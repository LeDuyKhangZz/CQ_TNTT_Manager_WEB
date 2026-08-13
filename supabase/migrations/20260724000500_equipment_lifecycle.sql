-- ============================================================================
-- M09-B — Vòng đời kho thiết bị.
--
-- TB-M09-02 PA A (F16, D-76, AC-M09-25/26): tách "nhận lại hàng" khỏi "báo
--   hỏng/mất". Trước đợt này MỘT con số `p_restored_quantity` vừa nghĩa là "hôm
--   nay mang về bấy nhiêu" vừa nghĩa là "phần còn lại mất vĩnh viễn", nên phiếu
--   luôn đóng ngay lần trả đầu tiên và phần chênh lệch TRỪ THẲNG tổng kho mà
--   không hỏi ai. Trả dần là việc xảy ra thật (mượn 5 loa, hôm nay mang về 3)
--   nhưng hệ thống không làm được.
--
-- TB-M09-04 (F19, AC-M09-29, D-92): đường hợp lệ để ĐỔI tổng kho. Sau khi M09-A
--   khoá `total_quantity`, mua thêm loa hay tìm lại đồ tưởng mất đều không còn
--   đường nào ngoài việc bịa một mã thiết bị mới.
--
-- D-94 + D-97 (AC-M09-30): ô "Người mượn" phải mở sang MỌI nhân sự xứ đoàn.
--   `app.can_access_staff` không có nhánh "cùng Ban" (nợ #13) nên đọc thẳng
--   `staff_profiles` chỉ ra được người cùng lớp. Chủ dự án chọn CỬA SỔ HẸP:
--   một RPC chỉ trả về HỌ TÊN + mã GLV, và chỉ ai thao tác được kho của Ban đó
--   mới gọi được. Không nới quyền đọc hồ sơ nhân sự nói chung — điện thoại,
--   ngày sinh, địa chỉ vẫn kín như cũ, và nợ #13 vẫn mở, trả ở M09-C/M04.
--
-- D-98: `adjust_equipment_stock` làm CẢ HAI CHIỀU. Sau M09-A + write-off, thiết
--   bị hỏng KHI ĐANG NẰM TRONG KHO (không ai mượn) không còn đường nào ghi giảm,
--   nên sổ sách sẽ nói kho nhiều hơn thực tế mà không ai sửa được.
--
-- KHÔNG ĐỤNG (`06` §2 + WORKLOG): mọi thay đổi tồn kho vẫn đi qua RPC có row
-- lock; `authenticated` vẫn không có INSERT/UPDATE trên `equipment_loans`;
-- trigger `app.validate_equipment_item` của M09-A giữ nguyên.
-- ============================================================================

-- ── 1. Lý do điều chỉnh tồn kho ─────────────────────────────────────────────
-- `04_TO_BE_FLOWS.md` liệt kê ba lý do tăng (mua mới / tìm lại / kiểm kê).
-- `damaged` là lý do của chiều giảm mà D-98 vừa mở.
create type public.equipment_stock_adjustment_reason as enum (
  'purchase', 'found', 'stocktake', 'damaged'
);

-- ── 2. Phiếu mượn biết mình còn nợ bao nhiêu ────────────────────────────────
alter table public.equipment_loans add column outstanding_quantity integer;

update public.equipment_loans
set outstanding_quantity = case when status = 'returned' then 0 else quantity end,
    restored_quantity = coalesce(restored_quantity, 0);

alter table public.equipment_loans
  alter column outstanding_quantity set not null,
  alter column restored_quantity set default 0,
  alter column restored_quantity set not null;

-- `restored_quantity` đổi nghĩa: từ "số cái trả được ở LẦN đóng phiếu" thành
-- "tổng số cái đã nhận lại". Vì vậy nó không còn phải null khi phiếu đang mở, và
-- `received_by` nay là người nhận LẦN GẦN NHẤT chứ không phải người đóng phiếu.
alter table public.equipment_loans
  drop constraint equipment_loan_return_shape,
  drop constraint equipment_loan_restored_within_quantity;

alter table public.equipment_loans
  add constraint equipment_loan_quantities_within check (
    restored_quantity >= 0
    and outstanding_quantity >= 0
    and restored_quantity + outstanding_quantity <= quantity
  ),
  add constraint equipment_loan_return_shape check (
    (status = 'borrowed' and returned_at is null and outstanding_quantity > 0)
    or (status = 'returned' and returned_at is not null and outstanding_quantity = 0)
  );

comment on column public.equipment_loans.outstanding_quantity is
  'Số cái người mượn còn giữ. Phiếu chỉ đóng khi về 0 (M09-B, TB-M09-02 PA A).';
comment on column public.equipment_loans.restored_quantity is
  'Tổng số cái đã nhận lại kho qua receive_equipment (cộng dồn, M09-B).';

-- ── 3. Nhật ký từng lần nhận lại / báo hỏng-mất (D-65 ở mức module) ─────────
-- `committee_id` để nguyên ở đây thay vì join sang phiếu: policy đọc chạy trên
-- MỌI dòng, và cùng khuôn với `equipment_loans` đã làm.
create table public.equipment_loan_events (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.equipment_loans(id) on delete cascade,
  committee_id uuid not null references public.committees(id) on delete restrict,
  kind text not null check (kind in ('receive', 'write_off')),
  quantity integer not null check (quantity > 0),
  condition public.equipment_condition,
  note text check (note is null or char_length(note) <= 1000),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index equipment_loan_events_loan_idx
  on public.equipment_loan_events (loan_id, created_at desc);
create index equipment_loan_events_committee_idx
  on public.equipment_loan_events (committee_id, created_at desc);

-- ── 4. Nhật ký nhập thêm / giảm tồn kho ─────────────────────────────────────
create table public.equipment_stock_adjustments (
  id uuid primary key default extensions.gen_random_uuid(),
  equipment_item_id uuid not null references public.equipment_items(id) on delete restrict,
  committee_id uuid not null references public.committees(id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason public.equipment_stock_adjustment_reason not null,
  note text check (note is null or char_length(note) <= 1000),
  total_after integer not null check (total_after >= 0),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index equipment_stock_adjustments_item_idx
  on public.equipment_stock_adjustments (equipment_item_id, created_at desc);
create index equipment_stock_adjustments_committee_idx
  on public.equipment_stock_adjustments (committee_id, created_at desc);

-- ── 5. Mượn: phiếu mới nợ đúng số đã mượn ───────────────────────────────────
create or replace function public.borrow_equipment(
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
  -- D-94: người mượn là nhân sự BẤT KỲ của xứ đoàn, không giới hạn ở Ban giữ kho.
  if not exists (
    select 1 from public.staff_profiles
    where id = p_borrower_staff_id and service_status = 'active'
  ) then
    raise exception 'BORROWER_NOT_FOUND' using errcode = '23503';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  update public.equipment_items
  set available_quantity = available_quantity - p_quantity,
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  insert into public.equipment_loans (
    equipment_item_id, committee_id, quantity, outstanding_quantity, restored_quantity,
    borrower_staff_id, handed_over_by, borrowed_at, expected_return_at, borrow_note, status
  ) values (
    item.id, item.committee_id, p_quantity, p_quantity, 0,
    p_borrower_staff_id, auth.uid(), now(), p_expected_return_at,
    nullif(btrim(coalesce(p_note, '')), ''), 'borrowed'
  ) returning id into loan_id;
  return loan_id;
end;
$$;

-- ── 6. Nhận lại hàng — KHÔNG bao giờ đụng tổng kho ──────────────────────────
-- Chữ ký lệch một tham số so với `04_TO_BE_FLOWS.md` (`p_condition` được thêm
-- vào): bản cũ cho phép người trả ghi luôn tình trạng thiết bị khi mang về, và
-- bỏ tham số đó đi là làm MẤT một khả năng đang có của thành viên thường —
-- chỉ Trưởng/Phó Ban mới sửa được `condition` qua danh mục.
create function public.receive_equipment(
  p_loan_id uuid,
  p_quantity integer default null,
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
  taken integer;
begin
  select * into loan from public.equipment_loans where id = p_loan_id for update;
  if loan.id is null then
    raise exception 'EQUIPMENT_LOAN_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into item from public.equipment_items where id = loan.equipment_item_id for update;
  -- Kiểm quyền TRƯỚC nhánh idempotent (AC-M09-24): người ngoài Ban không được
  -- suy ra phiếu này tồn tại hay không từ chỗ lỗi khác nhau.
  if not app.can_operate_equipment(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if loan.status = 'returned' then
    return loan.id;
  end if;

  taken := coalesce(p_quantity, loan.outstanding_quantity);
  if taken <= 0 then
    raise exception 'EQUIPMENT_QUANTITY_INVALID' using errcode = '23514';
  end if;
  if taken > loan.outstanding_quantity then
    raise exception 'EQUIPMENT_RESTORED_INVALID' using errcode = '23514';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  update public.equipment_items
  set available_quantity = available_quantity + taken,
      condition = coalesce(p_condition, condition),
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  update public.equipment_loans
  set restored_quantity = restored_quantity + taken,
      outstanding_quantity = outstanding_quantity - taken,
      received_by = auth.uid(),
      condition_on_return = coalesce(p_condition, condition_on_return),
      return_note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), return_note),
      status = case when outstanding_quantity - taken = 0 then 'returned' else 'borrowed' end,
      returned_at = case when outstanding_quantity - taken = 0 then now() else null end
  where id = loan.id;

  insert into public.equipment_loan_events (
    loan_id, committee_id, kind, quantity, condition, note, actor_profile_id
  ) values (
    loan.id, loan.committee_id, 'receive', taken, p_condition,
    nullif(btrim(coalesce(p_note, '')), ''), auth.uid()
  );
  return loan.id;
end;
$$;

-- ── 7. Báo hỏng/mất — TRỪ tổng kho, không hoàn tác được ─────────────────────
-- D-93: quyền vẫn là MỌI thành viên Ban Kỹ thuật (`app.can_operate_equipment`),
-- không nâng lên Trưởng/Phó Ban như `04_TO_BE_FLOWS.md` khuyến nghị. Hàng rào
-- dồn vào hộp xác nhận đỏ ở giao diện + ghi chú BẮT BUỘC ở đây.
create function public.write_off_equipment(
  p_loan_id uuid,
  p_quantity integer,
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
  lost integer;
  clean_note text;
begin
  select * into loan from public.equipment_loans where id = p_loan_id for update;
  if loan.id is null then
    raise exception 'EQUIPMENT_LOAN_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into item from public.equipment_items where id = loan.equipment_item_id for update;
  if not app.can_operate_equipment(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if loan.status = 'returned' then
    return loan.id;
  end if;

  lost := p_quantity;
  if lost is null or lost <= 0 then
    raise exception 'EQUIPMENT_QUANTITY_INVALID' using errcode = '23514';
  end if;
  if lost > loan.outstanding_quantity then
    raise exception 'EQUIPMENT_RESTORED_INVALID' using errcode = '23514';
  end if;
  clean_note := nullif(btrim(coalesce(p_note, '')), '');
  if clean_note is null then
    raise exception 'EQUIPMENT_WRITE_OFF_NOTE_REQUIRED' using errcode = '23514';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  -- `available_quantity` KHÔNG đổi: số cái này đang nằm ngoài kho từ lúc mượn.
  update public.equipment_items
  set total_quantity = total_quantity - lost,
      condition = coalesce(p_condition, condition),
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  update public.equipment_loans
  set outstanding_quantity = outstanding_quantity - lost,
      received_by = auth.uid(),
      condition_on_return = coalesce(p_condition, condition_on_return),
      return_note = clean_note,
      status = case when outstanding_quantity - lost = 0 then 'returned' else 'borrowed' end,
      returned_at = case when outstanding_quantity - lost = 0 then now() else null end
  where id = loan.id;

  insert into public.equipment_loan_events (
    loan_id, committee_id, kind, quantity, condition, note, actor_profile_id
  ) values (
    loan.id, loan.committee_id, 'write_off', lost, p_condition, clean_note, auth.uid()
  );
  return loan.id;
end;
$$;

-- ── 8. `return_equipment` giữ nguyên chữ ký, nay là vỏ bọc của hai RPC trên ──
-- Giữ lại để mã cũ, pgTAP cũ và mọi tích hợp ngoài không vỡ (04_TO_BE_FLOWS).
create or replace function public.return_equipment(
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
  lost integer;
begin
  select * into loan from public.equipment_loans where id = p_loan_id for update;
  if loan.id is null then
    raise exception 'EQUIPMENT_LOAN_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into item from public.equipment_items where id = loan.equipment_item_id;
  if not app.can_operate_equipment(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if loan.status = 'returned' then
    return loan.id;
  end if;

  restored := coalesce(p_restored_quantity, loan.outstanding_quantity);
  if restored < 0 or restored > loan.outstanding_quantity then
    raise exception 'EQUIPMENT_RESTORED_INVALID' using errcode = '23514';
  end if;
  lost := loan.outstanding_quantity - restored;

  if restored > 0 then
    perform public.receive_equipment(loan.id, restored, p_condition, p_note);
  end if;
  if lost > 0 then
    -- Luồng cũ không có ô ghi chú bắt buộc; điền sẵn một câu nói đúng nguồn gốc
    -- thay vì để RPC mới từ chối một lời gọi hợp lệ của mã cũ.
    perform public.write_off_equipment(
      loan.id, lost, p_condition,
      coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Ghi nhận qua luồng trả cũ')
    );
  end if;
  return loan.id;
end;
$$;

-- ── 9. Nhập thêm / giảm tồn kho ─────────────────────────────────────────────
create function public.adjust_equipment_stock(
  p_equipment_item_id uuid,
  p_delta integer,
  p_reason public.equipment_stock_adjustment_reason,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.equipment_items;
  clean_note text;
  adjustment_id uuid;
begin
  select * into item from public.equipment_items
  where id = p_equipment_item_id for update;
  if item.id is null then
    raise exception 'EQUIPMENT_ITEM_NOT_FOUND' using errcode = 'P0002';
  end if;
  -- Chặt hơn mượn/trả: đổi tổng tài sản là việc của Trưởng/Phó Ban hoặc
  -- global-write (`04_TO_BE_FLOWS.md` TB-M09-04).
  if not app.can_write_committee_content(item.committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'EQUIPMENT_ADJUST_INVALID' using errcode = '23514';
  end if;
  -- Chỉ giảm được tới mức đang nằm trong kho: phần đang có người mượn không
  -- phải của mình mà xoá.
  if item.available_quantity + p_delta < 0 then
    raise exception 'EQUIPMENT_NOT_ENOUGH' using errcode = '23514';
  end if;
  clean_note := nullif(btrim(coalesce(p_note, '')), '');
  if p_delta < 0 and clean_note is null then
    raise exception 'EQUIPMENT_ADJUST_NOTE_REQUIRED' using errcode = '23514';
  end if;

  perform set_config('app.equipment_rpc', 'on', true);
  update public.equipment_items
  set total_quantity = total_quantity + p_delta,
      available_quantity = available_quantity + p_delta,
      updated_by = auth.uid()
  where id = item.id;
  perform set_config('app.equipment_rpc', 'off', true);

  insert into public.equipment_stock_adjustments (
    equipment_item_id, committee_id, delta, reason, note, total_after, actor_profile_id
  ) values (
    item.id, item.committee_id, p_delta, p_reason, clean_note,
    item.total_quantity + p_delta, auth.uid()
  ) returning id into adjustment_id;
  return adjustment_id;
end;
$$;

-- ── 10. Danh sách người mượn — cửa sổ hẹp, CHỈ TÊN (D-94 + D-97) ────────────
-- Không nới `app.can_access_staff`: hàm này trả về đúng ba trường cần cho một ô
-- chọn và chỉ trả lời người đã có quyền thao tác kho của Ban đó.
create function public.list_equipment_borrower_options(p_committee_id uuid)
returns table (staff_profile_id uuid, display_name text, staff_code text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.can_operate_equipment(p_committee_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select
      staff.id,
      btrim(coalesce(staff.saint_name, '') || ' ' || staff.full_name),
      staff.staff_code::text
    from public.staff_profiles as staff
    where staff.service_status = 'active'
    order by staff.full_name, staff.staff_code;
end;
$$;

-- ── 11. Quyền ───────────────────────────────────────────────────────────────
alter table public.equipment_loan_events enable row level security;
alter table public.equipment_stock_adjustments enable row level security;

-- Chỉ SELECT: hai bảng này là nhật ký, ghi vào chúng là việc của RPC
-- `security definer`. Không cấp INSERT/UPDATE/DELETE cho `authenticated`.
grant select on public.equipment_loan_events, public.equipment_stock_adjustments to authenticated;
grant all on public.equipment_loan_events, public.equipment_stock_adjustments to service_role;

create policy equipment_loan_events_select_scope
on public.equipment_loan_events for select to authenticated
using (app.can_read_equipment(committee_id));
create policy equipment_stock_adjustments_select_scope
on public.equipment_stock_adjustments for select to authenticated
using (app.can_read_equipment(committee_id));

revoke all on function public.receive_equipment(uuid, integer, public.equipment_condition, text)
  from public, anon;
revoke all on function public.write_off_equipment(uuid, integer, public.equipment_condition, text)
  from public, anon;
revoke all on function public.adjust_equipment_stock(uuid, integer, public.equipment_stock_adjustment_reason, text)
  from public, anon;
revoke all on function public.list_equipment_borrower_options(uuid) from public, anon;

grant execute on function public.receive_equipment(uuid, integer, public.equipment_condition, text)
  to authenticated, service_role;
grant execute on function public.write_off_equipment(uuid, integer, public.equipment_condition, text)
  to authenticated, service_role;
grant execute on function public.adjust_equipment_stock(uuid, integer, public.equipment_stock_adjustment_reason, text)
  to authenticated, service_role;
grant execute on function public.list_equipment_borrower_options(uuid) to authenticated, service_role;

comment on table public.equipment_loan_events is
  'Nhật ký từng lần nhận lại / báo hỏng-mất của một phiếu mượn (M09-B, D-65).';
comment on table public.equipment_stock_adjustments is
  'Nhật ký nhập thêm và giảm tồn kho ngoài phiếu mượn (M09-B, TB-M09-04).';
comment on function public.receive_equipment(uuid, integer, public.equipment_condition, text) is
  'Nhận lại n cái về kho: available += n, outstanding -= n, KHÔNG đụng total. Phiếu đóng khi outstanding về 0.';
comment on function public.write_off_equipment(uuid, integer, public.equipment_condition, text) is
  'Báo hỏng/mất n cái: total -= n, outstanding -= n, available không đổi. Ghi chú bắt buộc, không hoàn tác.';
comment on function public.return_equipment(uuid, integer, public.equipment_condition, text) is
  'Vỏ bọc tương thích ngược: nhận lại phần trả được rồi báo hỏng/mất phần còn lại (M09-B).';
comment on function public.adjust_equipment_stock(uuid, integer, public.equipment_stock_adjustment_reason, text) is
  'Đổi tổng kho ngoài phiếu mượn (mua thêm, tìm lại, kiểm kê, hỏng trong kho). Chỉ Trưởng/Phó Ban.';
comment on function public.list_equipment_borrower_options(uuid) is
  'Danh sách người mượn: CHỈ họ tên + mã GLV của nhân sự đang hoạt động, chỉ cho người thao tác được kho (D-94, D-97).';
