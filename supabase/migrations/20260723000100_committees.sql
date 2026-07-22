-- ============================================================================
-- P6-T1 — Ban và thành viên Ban (docs/01 §10, docs/02 §11.1–11.2, WF-12).
--
-- D-15  Chức vụ Ban không phải primary role — bảng này hoàn toàn tách khỏi
--       `role_assignments`; một Trưởng ban vẫn giữ nguyên role GLV của mình.
-- D-47  6 Ban seed, có thể thêm; mỗi staff tối đa hai Ban.
--
-- Phạm vi đọc theo docs/05 §Committee: thành viên chỉ thấy Ban mình, global
-- read thấy tất cả. Tạo Ban/membership là global-write (WF-12).
-- ============================================================================

create table public.committees (
  id uuid primary key default extensions.gen_random_uuid(),
  code extensions.citext not null unique,
  name text not null check (btrim(name) <> ''),
  description text check (description is null or char_length(description) <= 1000),
  -- Ban giữ kho thiết bị (Ban Kỹ thuật). Cờ thay vì so sánh `code`: đổi tên Ban
  -- không được làm mất kho, và P6-T3 dùng đúng cờ này để chặn equipment_items
  -- gắn nhầm Ban.
  manages_equipment boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint committees_code_format check (code::text ~ '^[A-Z0-9_]{2,32}$')
);

create trigger committees_set_updated_at
before update on public.committees
for each row execute function app.set_updated_at();

create table public.committee_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  position public.committee_position not null default 'member',
  starts_on date not null default current_date,
  ends_on date,
  is_active boolean not null default true,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint committee_membership_date_order check (ends_on is null or ends_on >= starts_on),
  constraint committee_membership_active_end check ((is_active and ends_on is null) or not is_active)
);

-- Cùng một người không giữ hai chức vụ song song trong cùng một Ban; lịch sử
-- vẫn giữ được vì dòng cũ chỉ bị đặt is_active = false.
create unique index committee_memberships_one_active_per_pair_idx
on public.committee_memberships (committee_id, staff_profile_id)
where is_active;
create index committee_memberships_staff_idx
on public.committee_memberships (staff_profile_id, is_active);
create index committee_memberships_committee_idx
on public.committee_memberships (committee_id, is_active, position);

create trigger committee_memberships_set_updated_at
before update on public.committee_memberships
for each row execute function app.set_updated_at();

-- D-47: tối đa hai Ban đang hoạt động cho mỗi nhân sự. Ràng buộc ở DB vì UI ẩn
-- nút không phải authorization (AGENTS §5).
-- SECURITY DEFINER: trigger phải đếm trên TOÀN BỘ chức vụ đang hoạt động của
-- nhân sự đó, không phải phần mà người đang thao tác nhìn thấy qua RLS — nếu
-- không, người chỉ thấy một Ban sẽ lách được giới hạn hai Ban.
create function app.validate_committee_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
begin
  if not new.is_active then
    return new;
  end if;

  if not exists (select 1 from public.committees where id = new.committee_id and is_active) then
    raise exception 'COMMITTEE_NOT_ACTIVE' using errcode = '23514';
  end if;

  select count(*) into active_count
  from public.committee_memberships
  where staff_profile_id = new.staff_profile_id
    and is_active
    and committee_id <> new.committee_id
    and id <> new.id;

  if active_count >= 2 then
    raise exception 'COMMITTEE_LIMIT_EXCEEDED' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger committee_memberships_validate
before insert or update of committee_id, staff_profile_id, is_active
on public.committee_memberships
for each row execute function app.validate_committee_membership();

-- ── Helper phạm vi ──────────────────────────────────────────────────────────
-- Theo bài học hiệu năng Gate Phase 2: phạm vi tính MỘT LẦN thành mảng, policy
-- so cột với mảng trong `(select ...)` để Postgres chạy InitPlan.

create function app.member_committee_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct membership.committee_id), '{}'::uuid[])
  from public.committee_memberships as membership
  join public.staff_profiles as staff on staff.id = membership.staff_profile_id
  where staff.profile_id = auth.uid() and membership.is_active
$$;

create function app.led_committee_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct membership.committee_id), '{}'::uuid[])
  from public.committee_memberships as membership
  join public.staff_profiles as staff on staff.id = membership.staff_profile_id
  where staff.profile_id = auth.uid()
    and membership.is_active
    and membership.position in ('leader', 'deputy')
$$;

create or replace function app.is_committee_member(target_committee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(target_committee_id = any (app.member_committee_ids()), false)
$$;

create or replace function app.is_committee_leader_or_deputy(target_committee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(target_committee_id = any (app.led_committee_ids()), false)
$$;

-- Ai được đăng nội dung Ban (D-48): Trưởng/Phó Ban của chính Ban đó, hoặc
-- global-write. Cố vấn tối cao và thành viên chỉ đọc.
create function app.can_write_committee_content(target_committee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write() or app.is_committee_leader_or_deputy(target_committee_id),
    false
  )
$$;

alter table public.committees enable row level security;
alter table public.committee_memberships enable row level security;

grant select on public.committees, public.committee_memberships to authenticated;
grant insert, update on public.committees, public.committee_memberships to authenticated;
grant all on public.committees, public.committee_memberships to service_role;

create policy committees_select_scope
on public.committees for select to authenticated
using (
  (select app.can_global_read())
  or id = any ((select app.member_committee_ids())::uuid[])
);
create policy committees_insert_global_write
on public.committees for insert to authenticated
with check ((select app.can_global_write()) and updated_by = auth.uid());
create policy committees_update_global_write
on public.committees for update to authenticated
using ((select app.can_global_write()))
with check ((select app.can_global_write()) and updated_by = auth.uid());

create policy committee_memberships_select_scope
on public.committee_memberships for select to authenticated
using (
  (select app.can_global_read())
  or committee_id = any ((select app.member_committee_ids())::uuid[])
);
create policy committee_memberships_insert_global_write
on public.committee_memberships for insert to authenticated
with check ((select app.can_global_write()) and updated_by = auth.uid());
create policy committee_memberships_update_global_write
on public.committee_memberships for update to authenticated
using ((select app.can_global_write()))
with check ((select app.can_global_write()) and updated_by = auth.uid());

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.committees is
  'Ban của xứ đoàn (D-47). manages_equipment đánh dấu Ban giữ kho thiết bị.';
comment on table public.committee_memberships is
  'Chức vụ Ban theo nhiệm kỳ; tối đa hai Ban đang hoạt động cho mỗi nhân sự (D-47). Không thay primary role (D-15).';
comment on function app.member_committee_ids() is
  'Ban mà người đăng nhập đang là thành viên. Dùng cho RLS theo tập hợp.';
comment on function app.led_committee_ids() is
  'Ban mà người đăng nhập đang là Trưởng/Phó ban. Dùng cho RLS theo tập hợp.';
