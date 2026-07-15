-- P1-T1: Core enums, identity tables and fail-closed RLS helpers.

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

create type public.app_role as enum (
  'super_admin', 'parish_priest', 'chaplain', 'group_leader',
  'deputy_group_leader', 'secretary', 'treasurer', 'sector_leader',
  'sector_deputy', 'class_representative', 'class_teacher',
  'trainee_assistant', 'guardian', 'student'
);
create type public.account_status as enum ('active', 'locked', 'disabled');
create type public.student_status as enum ('active', 'temporarily_inactive', 'withdrawn', 'archived');
create type public.enrollment_status as enum ('active', 'paused', 'completed', 'repeating', 'transferred', 'withdrawn');
create type public.meeting_type as enum ('thursday', 'sunday');
create type public.attendance_status as enum ('present', 'excused_absence', 'unexcused_absence', 'late', 'left_early');
create type public.staff_attendance_status as enum ('present', 'excused_absence', 'unexcused_absence');
create type public.sacrament_type as enum ('baptism', 'first_confession', 'first_communion', 'confirmation', 'profession', 'other');
create type public.assessment_kind as enum ('quiz_15m', 'midterm', 'final', 'attendance', 'custom');
create type public.comment_visibility as enum ('student_visible', 'staff_only');
create type public.promotion_status as enum ('pending', 'recommended_promote', 'recommended_repeat', 'temporarily_pause', 'withdraw', 'approved', 'rejected');
create type public.committee_position as enum ('supreme_advisor', 'leader', 'deputy', 'member');
create type public.equipment_condition as enum ('good', 'needs_maintenance', 'damaged', 'lost', 'retired');
create type public.notification_target_type as enum ('all', 'sector', 'class', 'committee', 'user', 'guardians', 'students');
create type public.leaderboard_source_type as enum ('assessment', 'temporary_weighted_average', 'final_average', 'custom_competition');

create function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null check (btrim(display_name) <> ''),
  saint_name text,
  account_status public.account_status not null default 'active',
  must_change_password boolean not null default true,
  phone text,
  email text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint profiles_username_not_blank check (btrim(username::text) <> '')
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app.set_updated_at();

create table public.role_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  academic_year_id uuid,
  sector_id uuid,
  class_id uuid,
  starts_on date not null default current_date,
  ends_on date,
  appointment_document_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_assignments_date_order check (ends_on is null or ends_on >= starts_on),
  constraint role_assignments_scope_matches_role check (
    (role in ('sector_leader', 'sector_deputy') and sector_id is not null and class_id is null)
    or (role in ('class_representative', 'class_teacher', 'trainee_assistant') and class_id is not null and sector_id is null)
    or (role in ('super_admin', 'parish_priest', 'chaplain', 'group_leader', 'deputy_group_leader', 'secretary', 'treasurer', 'guardian', 'student') and sector_id is null and class_id is null)
  ),
  constraint role_assignments_active_end_consistency check (
    (is_active and ends_on is null) or (not is_active)
  )
);

create unique index role_assignments_one_active_per_profile_idx
on public.role_assignments(profile_id)
where is_active;
create index role_assignments_profile_history_idx
on public.role_assignments(profile_id, starts_on desc);

create trigger role_assignments_set_updated_at
before update on public.role_assignments
for each row execute function app.set_updated_at();

alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;

create function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select auth.uid() $$;

create function app.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select assignment.role
  from public.role_assignments as assignment
  join public.profiles as profile on profile.id = assignment.profile_id
  where assignment.profile_id = auth.uid()
    and assignment.is_active
    and profile.account_status = 'active'
  limit 1
$$;

create function app.current_sector_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sector_id
  from public.role_assignments
  where profile_id = auth.uid() and is_active
  limit 1
$$;

create function app.current_class_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select class_id
  from public.role_assignments
  where profile_id = auth.uid() and is_active
  limit 1
$$;

create function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce(app.current_role() = 'super_admin', false) $$;

create function app.can_global_read()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in (
    'super_admin', 'parish_priest', 'chaplain', 'group_leader',
    'deputy_group_leader', 'secretary'
  ), false)
$$;

create function app.can_global_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() in (
    'super_admin', 'group_leader', 'deputy_group_leader', 'secretary'
  ), false)
$$;

create function app.can_access_sector(target_sector_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.can_global_read() or app.current_sector_id() = target_sector_id
$$;

create function app.can_access_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.can_global_read() or app.current_class_id() = target_class_id
$$;

create function app.is_class_staff(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.current_role() in ('class_representative', 'class_teacher', 'trainee_assistant')
    and app.current_class_id() = target_class_id,
    false
  )
$$;

create function app.is_class_representative(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() = 'class_representative' and app.current_class_id() = target_class_id, false)
$$;

create function app.is_guardian_of_student(target_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$ select false $$;
create function app.is_self_student(target_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$ select false $$;
create function app.is_committee_member(target_committee_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$ select false $$;
create function app.is_committee_leader_or_deputy(target_committee_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$ select false $$;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

grant select on public.profiles, public.role_assignments to authenticated;
grant all on public.profiles, public.role_assignments to service_role;

create policy profiles_select_self_or_global
on public.profiles for select to authenticated
using (id = auth.uid() or app.can_global_read());

create policy role_assignments_select_self_or_global
on public.role_assignments for select to authenticated
using (profile_id = auth.uid() or app.can_global_read());

comment on schema app is 'Security helper functions; not exposed through the Data API.';
comment on table public.profiles is 'Identity metadata linked one-to-one with auth.users; never stores passwords.';
comment on table public.role_assignments is 'Primary role history with at most one active assignment per profile.';
