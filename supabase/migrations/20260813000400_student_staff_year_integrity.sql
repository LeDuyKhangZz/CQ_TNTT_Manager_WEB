-- Phase 3 integrity guards for two cross-table invariants that were only
-- enforced by application option lists.

-- BR-M03-N17, reverse direction: an active student must not be attached to an
-- inactive guardian.  The older guardian trigger only protected
-- guardian active -> inactive; it did not protect student insert/reassignment.
create or replace function app.students_need_active_guardian()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian_status public.guardian_status;
begin
  if new.status = 'active' and new.guardian_id is not null then
    select guardian.status
      into v_guardian_status
      from public.guardians as guardian
     where guardian.id = new.guardian_id
     -- Guardian status is the canonical mutex for both directions. UPDATE to
     -- inactive already holds the conflicting row lock before checking child
     -- rows; a concurrent student insert/reassignment must wait and re-read.
     for share;

    if v_guardian_status is distinct from 'active'::public.guardian_status then
      raise exception 'GUARDIAN_NOT_ACTIVE' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists students_need_active_guardian on public.students;
create trigger students_need_active_guardian
before insert or update of guardian_id, status on public.students
for each row execute function app.students_need_active_guardian();

-- D-130: set_student_status pauses the open enrollment before changing the
-- student.  A direct Data API update used to skip that first step and leave a
-- temporarily-inactive profile in an active roster.  A pre-paused enrollment
-- remains valid (pause is also an independent class workflow).
create or replace function app.temporary_student_needs_paused_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.status = 'temporarily_inactive'
  then
    if exists (
      select 1
      from public.enrollments as enrollment
      where enrollment.student_id = new.id
        and enrollment.status = 'active'
    ) then
      raise exception 'STUDENT_STATUS_ENROLLMENT_MISMATCH' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists temporary_student_needs_paused_enrollment on public.students;
create trigger temporary_student_needs_paused_enrollment
before update of status on public.students
for each row execute function app.temporary_student_needs_paused_enrollment();

-- Close the reciprocal path as well.  The legacy trigger only ran BEFORE
-- INSERT, so a paused enrollment could be switched back to active after its
-- student became temporarily inactive.  Ending an old enrollment remains
-- possible even when the profile is no longer active.
create or replace function app.enrollments_need_active_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.student_status;
begin
  if tg_op = 'UPDATE'
     and new.student_id is not distinct from old.student_id
     and new.status <> 'active'
  then
    return new;
  end if;

  select student.status
    into v_status
    from public.students as student
   where student.id = new.student_id
   -- The student row is the sole lifecycle mutex.  Do not take an enrollment
   -- lock from the reciprocal student trigger: child -> parent and parent ->
   -- child lock orders would otherwise deadlock.
   for update;

  if v_status is null then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status <> 'active' then
    raise exception 'STUDENT_NOT_ACTIVE' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_need_active_student on public.enrollments;
create trigger enrollments_need_active_student
before insert or update of student_id, status on public.enrollments
for each row execute function app.enrollments_need_active_student();

-- The original D-130 function resumed the enrollment before the student,
-- which the reciprocal invariant correctly rejects.  Keep its complete
-- security-invoker/RLS behavior in a private implementation and make the
-- public entry point acquire/update the canonical parent row first on resume.
alter function public.set_student_status(
  uuid, public.student_status, boolean, public.enrollment_status, date
) set schema app;
alter function app.set_student_status(
  uuid, public.student_status, boolean, public.enrollment_status, date
) rename to set_student_status_internal;

create function public.set_student_status(
  p_student_id uuid,
  p_status public.student_status,
  p_close_enrollment boolean default false,
  p_reason public.enrollment_status default 'withdrawn',
  p_ended_on date default null
)
returns table (student_name text, class_name text, enrollment_action text)
language plpgsql
set search_path = ''
as $$
begin
  if p_status = 'active' then
    update public.students
       set status = 'active', updated_by = auth.uid()
     where id = p_student_id;
  end if;

  return query
  select *
    from app.set_student_status_internal(
      p_student_id,
      p_status,
      p_close_enrollment,
      p_reason,
      p_ended_on
    );
end;
$$;

revoke all on function public.set_student_status(
  uuid, public.student_status, boolean, public.enrollment_status, date
) from public, anon;
grant execute on function public.set_student_status(
  uuid, public.student_status, boolean, public.enrollment_status, date
) to authenticated, service_role;

comment on function app.set_student_status_internal(
  uuid, public.student_status, boolean, public.enrollment_status, date
) is
  'D-130 internal, non-PostgREST-exposed security-invoker implementation; authenticated EXECUTE is retained only so the public invoker wrapper can call it.';

comment on function public.set_student_status(
  uuid, public.student_status, boolean, public.enrollment_status, date
) is
  'D-130 Phase 3: resume locks/updates the student parent before activating its paused enrollment; all original RLS checks remain in the invoker implementation.';

-- M04 / TB-M04-04: class status alone is insufficient because closing an
-- academic year intentionally does not rewrite every class row.  Historical
-- assignments remain readable/endable, but no active assignment may be
-- inserted or edited in a closed/archived year.
create or replace function app.active_class_staff_needs_writable_year()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year_id uuid;
  v_year_status public.academic_year_status;
begin
  if new.is_active then
    select year.id, year.status
      into v_year_id, v_year_status
      from public.classes as class
      join public.academic_years as year on year.id = class.academic_year_id
     where class.id = new.class_id
     -- Serialize with close_academic_year's FOR UPDATE. If this assignment
     -- commits first, it becomes legitimate history when the year closes; if
     -- close commits first, a normal caller observes closed and is rejected.
     for share of year;

    if v_year_id is null then
      raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
    end if;
    if not app.is_super_admin()
       and v_year_status not in ('draft', 'current')
    then
      raise exception 'YEAR_NOT_WRITABLE' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists class_staff_assignments_year_guard on public.class_staff_assignments;
create trigger class_staff_assignments_year_guard
before insert or update on public.class_staff_assignments
for each row execute function app.active_class_staff_needs_writable_year();

comment on function app.students_need_active_guardian() is
  'BR-M03-N17 reverse invariant: an active student cannot be inserted/reassigned to an inactive guardian.';

comment on function app.temporary_student_needs_paused_enrollment() is
  'D-130 DB boundary: temporarily_inactive cannot coexist with an active open enrollment.';

comment on function app.enrollments_need_active_student() is
  'BR-M03-N13/D-130: insert/reassignment and transitions to active require an active student; counterpart row is locked against concurrent split-brain updates.';

comment on function app.active_class_staff_needs_writable_year() is
  'M04/TB-M04-04/D-117: active staff assignments use the shared writable-year set, including the Super Admin exception.';

-- Final rollout preflight runs after all trigger DDL. PostgreSQL holds those
-- table locks until this migration transaction commits, so a concurrent write
-- cannot slip between validation and enforcement. Active assignments in a
-- now-closed year are intentionally not rejected: close_academic_year leaves
-- class/team history in place (D-119), while the trigger blocks later edits by
-- non-Super-Admin callers.
do $$
begin
  if exists (
    select 1
      from public.students as student
      join public.guardians as guardian on guardian.id = student.guardian_id
     where student.status = 'active'
       and guardian.status <> 'active'
  ) then
    raise exception 'LEGACY_ACTIVE_STUDENT_INACTIVE_GUARDIAN' using errcode = '23514';
  end if;

  if exists (
    select 1
      from public.students as student
      join public.enrollments as enrollment on enrollment.student_id = student.id
     where student.status = 'temporarily_inactive'
       and enrollment.status = 'active'
  ) then
    raise exception 'LEGACY_STUDENT_ENROLLMENT_MISMATCH' using errcode = '23514';
  end if;
end;
$$;
