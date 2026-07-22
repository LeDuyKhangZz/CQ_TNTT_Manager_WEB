-- ============================================================================
-- P6-T3 — Thiết bị của Ban Kỹ thuật và mượn/trả (docs/02 §11.6–11.7, WF-13).
--
-- D-49  Ban Kỹ thuật có thiết bị và mượn/trả: ai mượn, lúc nào, người bàn
--       giao/nhận, ghi chú, tình trạng.
-- docs/05 §Thiết bị: thành viên Ban Kỹ thuật mượn/trả được; tạo/sửa danh mục là
--       Trưởng/Phó Ban hoặc global-write.
--
-- Số lượng chỉ đổi qua RPC có row lock (docs/02 §11.7 + AGENTS §6): `authenticated`
-- KHÔNG có UPDATE trên `equipment_items.available_quantity` qua đường thường —
-- policy UPDATE chỉ dành cho Trưởng/Phó Ban sửa danh mục, và trigger chặn mọi
-- thay đổi available_quantity ngoài RPC.
-- ============================================================================

create table public.equipment_items (
  id uuid primary key default extensions.gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  asset_code extensions.citext not null unique,
  name text not null check (btrim(name) <> '' and char_length(name) <= 200),
  category text check (category is null or char_length(category) <= 100),
  total_quantity integer not null check (total_quantity >= 0),
  available_quantity integer not null check (available_quantity >= 0),
  condition public.equipment_condition not null default 'good',
  storage_location text check (storage_location is null or char_length(storage_location) <= 200),
  note text check (note is null or char_length(note) <= 1000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint equipment_available_within_total check (available_quantity <= total_quantity)
);

create index equipment_items_committee_idx on public.equipment_items (committee_id, is_active, name);

create table public.equipment_loans (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_item_id uuid not null references public.equipment_items(id) on delete restrict,
  committee_id uuid not null references public.committees(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  borrower_staff_id uuid not null references public.staff_profiles(id) on delete restrict,
  handed_over_by uuid not null references public.profiles(id) on delete restrict,
  borrowed_at timestamptz not null default now(),
  expected_return_at timestamptz,
  returned_at timestamptz,
  received_by uuid references public.profiles(id) on delete set null,
  restored_quantity integer check (restored_quantity is null or restored_quantity >= 0),
  borrow_note text check (borrow_note is null or char_length(borrow_note) <= 1000),
  return_note text check (return_note is null or char_length(return_note) <= 1000),
  condition_on_return public.equipment_condition,
  status text not null default 'borrowed' check (status in ('borrowed', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_loan_return_shape check (
    (status = 'borrowed' and returned_at is null and received_by is null and restored_quantity is null)
    or (status = 'returned' and returned_at is not null and restored_quantity is not null)
  ),
  constraint equipment_loan_restored_within_quantity check (
    restored_quantity is null or restored_quantity <= quantity
  )
);

create index equipment_loans_status_idx on public.equipment_loans (status, borrowed_at desc);
create index equipment_loans_item_idx on public.equipment_loans (equipment_item_id, borrowed_at desc);
create index equipment_loans_committee_idx on public.equipment_loans (committee_id, status);

create trigger equipment_items_set_updated_at
before update on public.equipment_items
for each row execute function app.set_updated_at();
create trigger equipment_loans_set_updated_at
before update on public.equipment_loans
for each row execute function app.set_updated_at();

-- Kho chỉ tồn tại ở Ban được đánh dấu manages_equipment (docs/02 §11.6).
create function app.validate_equipment_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.committees
    where id = new.committee_id and manages_equipment and is_active
  ) then
    raise exception 'EQUIPMENT_COMMITTEE_INVALID' using errcode = '23514';
  end if;

  -- Số lượng khả dụng là hệ quả của mượn/trả, không phải ô nhập liệu.
  if tg_op = 'UPDATE' and new.available_quantity <> old.available_quantity
     and current_setting('app.equipment_rpc', true) is distinct from 'on' then
    raise exception 'EQUIPMENT_AVAILABLE_READONLY' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger equipment_items_validate
before insert or update on public.equipment_items
for each row execute function app.validate_equipment_item();

create function app.can_read_equipment(target_committee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.can_global_read() or app.is_committee_member(target_committee_id), false)
$$;

-- Mượn/trả: thành viên Ban Kỹ thuật (docs/05) hoặc global-write.
create function app.can_operate_equipment(target_committee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or (
      app.is_committee_member(target_committee_id)
      and exists (
        select 1 from public.committees
        where id = target_committee_id and manages_equipment and is_active
      )
    ), false)
$$;

create function public.borrow_equipment(
  p_equipment_item_id uuid,
  p_quantity integer,
  p_borrower_staff_id uuid,
  p_expected_return_at timestamptz default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.equipment_items;
  loan_id uuid;
begin
  select * into item from public.equipment_items
  where id = p_equipment_item_id for update;
  if item.id is null then
    raise exception 'EQUIPMENT_ITEM_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_operate_equipment(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not item.is_active then
    raise exception 'EQUIPMENT_ITEM_INACTIVE' using errcode = '23514';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'EQUIPMENT_QUANTITY_INVALID' using errcode = '23514';
  end if;
  if p_quantity > item.available_quantity then
    raise exception 'EQUIPMENT_NOT_ENOUGH' using errcode = '23514';
  end if;
  if not exists (select 1 from public.staff_profiles where id = p_borrower_staff_id) then
    raise exception 'BORROWER_NOT_FOUND' using errcode = '23503';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  update public.equipment_items
  set available_quantity = available_quantity - p_quantity,
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  insert into public.equipment_loans (
    equipment_item_id, committee_id, quantity, borrower_staff_id, handed_over_by,
    borrowed_at, expected_return_at, borrow_note, status
  ) values (
    item.id, item.committee_id, p_quantity, p_borrower_staff_id, auth.uid(),
    now(), p_expected_return_at, nullif(btrim(coalesce(p_note, '')), ''), 'borrowed'
  ) returning id into loan_id;
  return loan_id;
end;
$$;

create function public.return_equipment(
  p_loan_id uuid,
  p_restored_quantity integer default null,
  p_condition public.equipment_condition default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  loan public.equipment_loans;
  item public.equipment_items;
  restored integer;
begin
  select * into loan from public.equipment_loans where id = p_loan_id for update;
  if loan.id is null then
    raise exception 'EQUIPMENT_LOAN_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into item from public.equipment_items where id = loan.equipment_item_id for update;
  if not app.can_operate_equipment(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  -- Trả lại lần hai là idempotent: không cộng kho thêm lần nữa.
  if loan.status = 'returned' then
    return loan.id;
  end if;

  restored := coalesce(p_restored_quantity, loan.quantity);
  if restored < 0 or restored > loan.quantity then
    raise exception 'EQUIPMENT_RESTORED_INVALID' using errcode = '23514';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  update public.equipment_items
  set available_quantity = available_quantity + restored,
      -- Phần không trả về kho (hỏng/mất) rời khỏi tổng số theo WF-13 bước 5.
      total_quantity = total_quantity - (loan.quantity - restored),
      condition = coalesce(p_condition, condition),
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  update public.equipment_loans
  set status = 'returned',
      returned_at = now(),
      received_by = auth.uid(),
      restored_quantity = restored,
      condition_on_return = p_condition,
      return_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = loan.id;
  return loan.id;
end;
$$;

alter table public.equipment_items enable row level security;
alter table public.equipment_loans enable row level security;

grant select, insert, update on public.equipment_items to authenticated;
grant select on public.equipment_loans to authenticated;
grant all on public.equipment_items, public.equipment_loans to service_role;
revoke all on function public.borrow_equipment(uuid, integer, uuid, timestamptz, text) from public, anon;
revoke all on function public.return_equipment(uuid, integer, public.equipment_condition, text) from public, anon;
grant execute on function public.borrow_equipment(uuid, integer, uuid, timestamptz, text) to authenticated, service_role;
grant execute on function public.return_equipment(uuid, integer, public.equipment_condition, text) to authenticated, service_role;

create policy equipment_items_select_scope
on public.equipment_items for select to authenticated
using (app.can_read_equipment(committee_id));
create policy equipment_items_insert_leaders
on public.equipment_items for insert to authenticated
with check (app.can_write_committee_content(committee_id) and updated_by = auth.uid());
create policy equipment_items_update_leaders
on public.equipment_items for update to authenticated
using (app.can_write_committee_content(committee_id))
with check (app.can_write_committee_content(committee_id) and updated_by = auth.uid());

-- Sổ mượn/trả chỉ đọc qua bảng; ghi luôn đi qua RPC có row lock.
create policy equipment_loans_select_scope
on public.equipment_loans for select to authenticated
using (app.can_read_equipment(committee_id));

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.equipment_items is
  'Danh mục thiết bị của Ban Kỹ thuật (D-49). available_quantity chỉ đổi qua RPC mượn/trả.';
comment on table public.equipment_loans is
  'Sổ mượn/trả thiết bị: ai mượn, lúc nào, ai bàn giao/nhận, ghi chú và tình trạng khi trả.';
comment on function public.borrow_equipment(uuid, integer, uuid, timestamptz, text) is
  'Khóa dòng thiết bị, kiểm tồn kho rồi trừ available và tạo phiếu mượn trong một giao dịch (WF-13).';
comment on function public.return_equipment(uuid, integer, public.equipment_condition, text) is
  'Khóa phiếu/thiết bị, cộng lại phần trả được và trừ tổng số phần hỏng/mất. Trả lại lần hai là idempotent.';
