-- P2-T2: Guardians, students, health profiles and sacraments.
-- One guardian per student; one guardian may have many students.
-- Student code CQ0001 generated concurrency-safe. Health/sacrament are staff-only.

create type public.gender as enum ('male', 'female', 'other');
create type public.guardian_status as enum ('active', 'inactive');

create sequence public.student_code_seq start with 1 increment by 1 no cycle;
revoke all on sequence public.student_code_seq from public, anon;
grant usage, select on sequence public.student_code_seq to authenticated, service_role;

-- 6.1 guardians -------------------------------------------------------------
create table public.guardians (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check (btrim(full_name) <> ''),
  phone text not null check (btrim(phone) <> ''),
  address text,
  status public.guardian_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index guardians_phone_idx on public.guardians (phone);
create index guardians_name_idx on public.guardians (full_name);

create trigger guardians_set_updated_at
before update on public.guardians
for each row execute function app.set_updated_at();

-- 6.2 students --------------------------------------------------------------
create table public.students (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  student_code extensions.citext not null unique
    default ('CQ' || lpad(nextval('public.student_code_seq')::text, 4, '0')),
  guardian_id uuid not null references public.guardians(id) on delete restrict,
  saint_name text not null check (btrim(saint_name) <> ''),
  full_name text not null check (btrim(full_name) <> ''),
  gender public.gender not null,
  date_of_birth date not null,
  patron_feast_date date,
  address text,
  phone text,
  hardship_flag boolean not null default false,
  status public.student_status not null default 'active',
  general_notes text,
  normalized_full_name text generated always as (lower(btrim(full_name))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint students_code_format check (student_code::text ~* '^CQ[0-9]{4,}$'),
  constraint students_dob_not_future check (date_of_birth <= current_date)
);

create index students_guardian_idx on public.students (guardian_id);
create index students_status_idx on public.students (status);
create index students_dedup_idx on public.students (normalized_full_name, date_of_birth);

create trigger students_set_updated_at
before update on public.students
for each row execute function app.set_updated_at();

-- 6.3 student_health_profiles ----------------------------------------------
create table public.student_health_profiles (
  student_id uuid primary key references public.students(id) on delete cascade,
  allergies text,
  medical_conditions text,
  medications text,
  emergency_notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create trigger student_health_profiles_set_updated_at
before update on public.student_health_profiles
for each row execute function app.set_updated_at();

-- 6.4 student_sacraments ----------------------------------------------------
create table public.student_sacraments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  sacrament_type public.sacrament_type not null,
  sacrament_name text,
  sacrament_date date,
  place text,
  registry_number text,
  godparent_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint student_sacraments_other_name check (
    sacrament_type <> 'other'
    or (sacrament_name is not null and btrim(sacrament_name) <> '')
  )
);

-- One record per standard sacrament type; `other` may repeat.
create unique index student_sacraments_unique_type_idx
on public.student_sacraments (student_id, sacrament_type)
where sacrament_type <> 'other';
create index student_sacraments_student_idx on public.student_sacraments (student_id);

create trigger student_sacraments_set_updated_at
before update on public.student_sacraments
for each row execute function app.set_updated_at();

-- Helper functions ----------------------------------------------------------
-- Implement the ownership stubs seeded in the identity migration.
create or replace function app.is_guardian_of_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students as student
    join public.guardians as guardian on guardian.id = student.guardian_id
    where student.id = target_student_id
      and guardian.profile_id = auth.uid()
  )
$$;

create or replace function app.is_self_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students
    where id = target_student_id and profile_id = auth.uid()
  )
$$;

-- Student profile visibility: global readers, owning guardian, self student.
-- Sector/class staff scope (via enrollment) is added in P2-T3.
create function app.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or app.is_guardian_of_student(target_student_id)
    or app.is_self_student(target_student_id),
    false
  )
$$;

-- Sensitive health/sacrament visibility: staff-only, never guardian/student.
-- Sector/class staff scope (via enrollment) is added in P2-T3.
create function app.can_view_student_sensitive(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.can_global_read(), false)
$$;

-- RLS ------------------------------------------------------------------------
alter table public.guardians enable row level security;
alter table public.students enable row level security;
alter table public.student_health_profiles enable row level security;
alter table public.student_sacraments enable row level security;

grant select, insert, update
  on public.guardians, public.students,
     public.student_health_profiles, public.student_sacraments
  to authenticated;
grant all
  on public.guardians, public.students,
     public.student_health_profiles, public.student_sacraments
  to service_role;

-- Guardians: global readers or the guardian's own account.
create policy guardians_select_scope
on public.guardians for select to authenticated
using (app.can_global_read() or profile_id = auth.uid());
create policy guardians_insert_global_write
on public.guardians for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy guardians_update_global_write
on public.guardians for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

-- Students: owner guardian/self read; only global write may mutate directly.
create policy students_select_scope
on public.students for select to authenticated
using (app.can_access_student(id));
create policy students_insert_global_write
on public.students for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy students_update_global_write
on public.students for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

-- Health: staff-only read, global write. Guardian/student never see health.
create policy student_health_select_staff
on public.student_health_profiles for select to authenticated
using (app.can_view_student_sensitive(student_id));
create policy student_health_insert_global_write
on public.student_health_profiles for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy student_health_update_global_write
on public.student_health_profiles for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

-- Sacraments: staff-only read, global write.
create policy student_sacraments_select_staff
on public.student_sacraments for select to authenticated
using (app.can_view_student_sensitive(student_id));
create policy student_sacraments_insert_global_write
on public.student_sacraments for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy student_sacraments_update_global_write
on public.student_sacraments for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

-- Re-harden app schema execute privileges for the functions added here.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.guardians is 'Guardian contacts; one guardian may have many students.';
comment on table public.students is 'Student roster identity; student_code CQxxxx generated per parish.';
comment on table public.student_health_profiles is 'Staff-only health data; never visible to guardian/student.';
comment on table public.student_sacraments is 'Sacrament registry; standard types unique per student, other may repeat.';
