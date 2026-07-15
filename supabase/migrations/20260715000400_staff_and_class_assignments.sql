-- P2-T1: Staff profiles and historical class staffing assignments.

create type public.staff_title as enum ('anh', 'chi', 'di', 'so', 'cha', 'thay', 'other');
create type public.formation_level as enum ('none', 'i', 'ii', 'iii', 'special');
create type public.staff_service_status as enum ('active', 'paused', 'inactive');
create type public.class_staff_capacity as enum ('representative', 'member', 'trainee');

create sequence public.staff_code_seq start with 1 increment by 1 no cycle;
revoke all on sequence public.staff_code_seq from public, anon;
grant usage, select on sequence public.staff_code_seq to authenticated, service_role;

create table public.staff_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  staff_code extensions.citext not null unique default ('GLV' || lpad(nextval('public.staff_code_seq')::text, 3, '0')),
  title public.staff_title not null,
  saint_name text,
  full_name text not null check (btrim(full_name) <> ''),
  date_of_birth date,
  phone text not null check (btrim(phone) <> ''),
  email text,
  address text,
  avatar_path text,
  formation_level public.formation_level not null default 'none',
  service_status public.staff_service_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint staff_profiles_code_format check (staff_code::text ~* '^GLV[0-9]{3,}$')
);

create index staff_profiles_name_idx on public.staff_profiles (full_name);
create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function app.set_updated_at();

create table public.class_staff_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  capacity public.class_staff_capacity not null,
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint class_staff_assignment_date_order check (ends_on is null or ends_on >= starts_on),
  constraint class_staff_assignment_active_end check ((is_active and ends_on is null) or not is_active)
);

create unique index class_staff_one_active_class_per_staff_idx
on public.class_staff_assignments (staff_profile_id) where is_active;
create unique index class_staff_one_active_representative_idx
on public.class_staff_assignments (class_id) where is_active and capacity = 'representative';
create index class_staff_class_history_idx
on public.class_staff_assignments (class_id, starts_on desc);
create index class_staff_staff_history_idx
on public.class_staff_assignments (staff_profile_id, starts_on desc);

create trigger class_staff_assignments_set_updated_at
before update on public.class_staff_assignments
for each row execute function app.set_updated_at();

create function app.validate_class_staff_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  linked_role public.app_role;
  linked_class_id uuid;
  expected_capacity public.class_staff_capacity;
begin
  if new.is_active and not exists (
    select 1 from public.classes where id = new.class_id and status = 'active'
  ) then
    raise exception 'CLASS_NOT_ACTIVE' using errcode = '23514';
  end if;

  select assignment.role, assignment.class_id
  into linked_role, linked_class_id
  from public.staff_profiles as staff
  join public.role_assignments as assignment on assignment.profile_id = staff.profile_id and assignment.is_active
  where staff.id = new.staff_profile_id;

  if linked_role in ('class_representative', 'class_teacher', 'trainee_assistant') then
    if not new.is_active then
      raise exception 'ACTIVE_CLASS_ROLE_EXISTS' using errcode = '23514';
    end if;
    expected_capacity := case linked_role
      when 'class_representative' then 'representative'::public.class_staff_capacity
      when 'class_teacher' then 'member'::public.class_staff_capacity
      else 'trainee'::public.class_staff_capacity
    end;
    if new.class_id <> linked_class_id or new.capacity <> expected_capacity then
      raise exception 'ROLE_CAPACITY_MISMATCH' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create function public.end_class_staff_assignment(
  target_assignment_id uuid,
  target_ends_on date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assignment public.class_staff_assignments;
  linked_profile_id uuid;
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into selected_assignment
  from public.class_staff_assignments
  where id = target_assignment_id and is_active
  for update;
  if selected_assignment.id is null then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if target_ends_on < selected_assignment.starts_on then
    raise exception 'INVALID_END_DATE' using errcode = '23514';
  end if;

  select profile_id into linked_profile_id
  from public.staff_profiles
  where id = selected_assignment.staff_profile_id;

  update public.role_assignments
  set is_active = false, ends_on = target_ends_on, updated_at = now()
  where profile_id = linked_profile_id
    and is_active
    and class_id = selected_assignment.class_id
    and role in ('class_representative', 'class_teacher', 'trainee_assistant');

  update public.class_staff_assignments
  set is_active = false,
      ends_on = target_ends_on,
      updated_by = auth.uid()
  where id = target_assignment_id;
end;
$$;

create trigger class_staff_assignments_validate
before insert or update of class_id, staff_profile_id, capacity, is_active
on public.class_staff_assignments
for each row execute function app.validate_class_staff_assignment();

create or replace function app.validate_role_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  scoped_year_id uuid;
  linked_staff_id uuid;
  expected_capacity public.class_staff_capacity;
begin
  if new.role in ('sector_leader', 'sector_deputy') and new.academic_year_id is null then
    raise exception 'ACADEMIC_YEAR_REQUIRED' using errcode = '23514';
  end if;

  if new.role in ('class_representative', 'class_teacher', 'trainee_assistant') then
    select academic_year_id into scoped_year_id from public.classes where id = new.class_id;
    if scoped_year_id is null then
      raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
    end if;
    if new.academic_year_id is null or new.academic_year_id <> scoped_year_id then
      raise exception 'CLASS_YEAR_MISMATCH' using errcode = '23514';
    end if;

    select id into linked_staff_id from public.staff_profiles where profile_id = new.profile_id;
    if linked_staff_id is null then
      raise exception 'STAFF_PROFILE_REQUIRED' using errcode = '23514';
    end if;
    expected_capacity := case new.role
      when 'class_representative' then 'representative'::public.class_staff_capacity
      when 'class_teacher' then 'member'::public.class_staff_capacity
      else 'trainee'::public.class_staff_capacity
    end;
    if not exists (
      select 1 from public.class_staff_assignments
      where staff_profile_id = linked_staff_id
        and class_id = new.class_id
        and capacity = expected_capacity
        and is_active
    ) then
      raise exception 'ACTIVE_CLASS_ASSIGNMENT_REQUIRED' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create or replace function app.is_class_staff(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (app.current_role() in ('class_representative', 'class_teacher', 'trainee_assistant')
      and app.current_class_id() = target_class_id)
    or exists (
      select 1
      from public.staff_profiles as staff
      join public.class_staff_assignments as assignment
        on assignment.staff_profile_id = staff.id and assignment.is_active
      where staff.profile_id = auth.uid() and assignment.class_id = target_class_id
    ), false
  )
$$;

create or replace function app.is_class_representative(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (app.current_role() = 'class_representative' and app.current_class_id() = target_class_id)
    or exists (
      select 1
      from public.staff_profiles as staff
      join public.class_staff_assignments as assignment
        on assignment.staff_profile_id = staff.id and assignment.is_active
      where staff.profile_id = auth.uid()
        and assignment.class_id = target_class_id
        and assignment.capacity = 'representative'
    ), false
  )
$$;

create function app.can_access_staff(target_staff_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or exists (select 1 from public.staff_profiles where id = target_staff_profile_id and profile_id = auth.uid())
    or exists (
      select 1 from public.class_staff_assignments
      where staff_profile_id = target_staff_profile_id
        and is_active
        and app.can_access_class(class_id)
    ), false
  )
$$;

alter table public.staff_profiles enable row level security;
alter table public.class_staff_assignments enable row level security;

grant select, insert, update on public.staff_profiles, public.class_staff_assignments to authenticated;
grant all on public.staff_profiles, public.class_staff_assignments to service_role;
revoke all on function public.end_class_staff_assignment(uuid, date) from public, anon;
grant execute on function public.end_class_staff_assignment(uuid, date) to authenticated, service_role;

create policy staff_profiles_select_scope
on public.staff_profiles for select to authenticated
using (app.can_access_staff(id));
create policy staff_profiles_insert_global_write
on public.staff_profiles for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy staff_profiles_update_global_write
on public.staff_profiles for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

create policy class_staff_assignments_select_scope
on public.class_staff_assignments for select to authenticated
using (app.can_access_class(class_id));
create policy class_staff_assignments_insert_global_write
on public.class_staff_assignments for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy class_staff_assignments_update_global_write
on public.class_staff_assignments for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

comment on table public.staff_profiles is 'Pastoral staff identity; Dì/Sơ are titles, not roles.';
comment on table public.class_staff_assignments is 'Historical class staffing with one active class per staff.';
