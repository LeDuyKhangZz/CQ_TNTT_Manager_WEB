-- P2-T3: Enrollments linking a student to one open class per academic year,
-- plus the sector/class scope extension for student and sensitive-data access
-- promised in P2-T2 (app.can_access_student / app.can_view_student_sensitive).

create table public.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  enrolled_on date not null default current_date,
  ended_on date,
  previous_enrollment_id uuid references public.enrollments(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint enrollments_date_order check (ended_on is null or ended_on >= enrolled_on),
  constraint enrollments_open_has_no_end
    check (status not in ('active', 'paused') or ended_on is null)
);

-- One open (active/paused) enrollment per student per academic year (D-11).
create unique index enrollments_one_open_per_student_year_idx
on public.enrollments (student_id, academic_year_id)
where status in ('active', 'paused');
create index enrollments_class_idx on public.enrollments (class_id, status);
create index enrollments_student_idx on public.enrollments (student_id, academic_year_id, status);

create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function app.set_updated_at();

create function app.validate_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
  class_state public.class_status;
begin
  select academic_year_id, status into class_year, class_state
  from public.classes where id = new.class_id;
  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
  end if;
  if class_year <> new.academic_year_id then
    raise exception 'CLASS_YEAR_MISMATCH' using errcode = '23514';
  end if;
  if new.status in ('active', 'paused') and class_state <> 'active' then
    raise exception 'CLASS_NOT_ACTIVE' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enrollments_validate
before insert or update of student_id, academic_year_id, class_id, status
on public.enrollments
for each row execute function app.validate_enrollment();

-- Write authority for enrollment: global-write, or a sector leader/deputy over
-- the class's sector. Trainee classes have no sector → global-write only.
create function app.can_manage_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or (
      app.current_role() in ('sector_leader', 'sector_deputy')
      and exists (
        select 1
        from public.classes as class
        join public.grade_levels as grade on grade.id = class.grade_level_id
        where class.id = target_class_id
          and grade.sector_id = app.current_sector_id()
      )
    ),
    false
  )
$$;

-- Extend student visibility with sector/class scope through open enrollments.
create or replace function app.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or app.is_guardian_of_student(target_student_id)
    or app.is_self_student(target_student_id)
    or exists (
      select 1 from public.enrollments as enrollment
      where enrollment.student_id = target_student_id
        and enrollment.status in ('active', 'paused')
        and (app.can_access_class(enrollment.class_id) or app.is_class_staff(enrollment.class_id))
    ),
    false
  )
$$;

-- Sensitive health/sacrament stays staff-only but now includes the student's
-- sector leaders and class staff (matrix docs/05 §3). Never guardian/student.
create or replace function app.can_view_student_sensitive(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or exists (
      select 1 from public.enrollments as enrollment
      where enrollment.student_id = target_student_id
        and enrollment.status in ('active', 'paused')
        and (app.can_access_class(enrollment.class_id) or app.is_class_staff(enrollment.class_id))
    ),
    false
  )
$$;

alter table public.enrollments enable row level security;

grant select, insert, update on public.enrollments to authenticated;
grant all on public.enrollments to service_role;

create policy enrollments_select_scope
on public.enrollments for select to authenticated
using (
  app.can_global_read()
  or app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or app.is_guardian_of_student(student_id)
  or app.is_self_student(student_id)
);
create policy enrollments_insert_scope
on public.enrollments for insert to authenticated
with check (app.can_manage_class(class_id) and updated_by = auth.uid());
create policy enrollments_update_scope
on public.enrollments for update to authenticated
using (app.can_manage_class(class_id))
with check (app.can_manage_class(class_id) and updated_by = auth.uid());

-- Re-harden app schema execute privileges for the functions added here.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.enrollments is 'Student-class enrollment; at most one open enrollment per student per year.';
