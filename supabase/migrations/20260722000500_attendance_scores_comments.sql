-- P5-T2 — system-proposed attendance scores and public/internal comments.

create table public.student_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  visibility public.comment_visibility not null,
  content text not null check (btrim(content) <> '' and char_length(content) <= 2000),
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  comment_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index student_comments_enrollment_idx
on public.student_comments(enrollment_id, comment_date desc, created_at desc);
create index student_comments_scope_idx on public.student_comments(class_id, student_id);

create trigger student_comments_set_updated_at
before update on public.student_comments
for each row execute function app.set_updated_at();

create function app.sync_student_comment_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_enrollment public.enrollments;
begin
  select * into selected_enrollment
  from public.enrollments where id = new.enrollment_id;
  if selected_enrollment.id is null then
    raise exception 'ENROLLMENT_NOT_FOUND' using errcode = '23503';
  end if;
  if app.is_gradebook_locked(selected_enrollment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.enrollment_id <> old.enrollment_id then
    raise exception 'COMMENT_ENROLLMENT_IMMUTABLE' using errcode = '23514';
  end if;
  new.class_id := selected_enrollment.class_id;
  new.academic_year_id := selected_enrollment.academic_year_id;
  new.student_id := selected_enrollment.student_id;
  if tg_op = 'INSERT' then
    new.author_profile_id := auth.uid();
  else
    new.author_profile_id := old.author_profile_id;
  end if;
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger student_comments_sync_keys
before insert or update on public.student_comments
for each row execute function app.sync_student_comment_keys();

create function app.block_locked_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if app.is_gradebook_locked(old.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  return old;
end;
$$;

create trigger student_comments_block_locked_delete
before delete on public.student_comments
for each row execute function app.block_locked_comment_delete();

create function public.refresh_attendance_assessment_scores(p_assessment_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  selected_enrollment public.enrollments;
  summary public.v_student_attendance_summary;
  proposed numeric(4, 2);
  refreshed_count integer := 0;
begin
  select * into selected_assessment
  from public.assessments
  where id = p_assessment_id and is_active
  for update;
  if selected_assessment.id is null or selected_assessment.kind <> 'attendance' then
    raise exception 'ATTENDANCE_ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;

  for selected_enrollment in
    select enrollment.*
    from public.enrollments as enrollment
    where enrollment.class_id = selected_assessment.class_id
      and enrollment.academic_year_id = selected_assessment.academic_year_id
      and enrollment.status in ('active', 'paused')
  loop
    select * into summary
    from public.v_student_attendance_summary as attendance
    where attendance.student_id = selected_enrollment.student_id
      and attendance.academic_year_id = selected_assessment.academic_year_id;
    proposed := case selected_assessment.attendance_component
      when 'mass' then summary.mass_attendance_score
      when 'catechism' then summary.catechism_attendance_score
      else null
    end;

    insert into public.assessment_scores (
      assessment_id, enrollment_id, class_id, academic_year_id, student_id,
      score, system_suggested_score, is_manual_override, assessment_published,
      graded_by, graded_at
    ) values (
      selected_assessment.id, selected_enrollment.id, selected_assessment.class_id,
      selected_assessment.academic_year_id, selected_enrollment.student_id,
      proposed, proposed, false, selected_assessment.is_published,
      auth.uid(), now()
    )
    on conflict (assessment_id, enrollment_id) do update set
      system_suggested_score = excluded.system_suggested_score,
      score = case
        when public.assessment_scores.is_manual_override then public.assessment_scores.score
        else excluded.system_suggested_score
      end,
      graded_by = auth.uid(),
      graded_at = now();
    refreshed_count := refreshed_count + 1;
  end loop;
  return refreshed_count;
end;
$$;

create function public.reset_attendance_score_override(
  p_assessment_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
begin
  select * into selected_assessment
  from public.assessments where id = p_assessment_id for update;
  if selected_assessment.id is null or selected_assessment.kind <> 'attendance' then
    raise exception 'ATTENDANCE_ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  update public.assessment_scores
  set score = system_suggested_score,
      is_manual_override = false,
      graded_by = auth.uid(),
      graded_at = now()
  where assessment_id = p_assessment_id and enrollment_id = p_enrollment_id;
  if not found then
    raise exception 'ASSESSMENT_SCORE_NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$$;

alter table public.student_comments enable row level security;
grant select, insert, update, delete on public.student_comments to authenticated;
grant all on public.student_comments to service_role;

revoke all on function public.refresh_attendance_assessment_scores(uuid) from public, anon;
revoke all on function public.reset_attendance_score_override(uuid, uuid) from public, anon;
grant execute on function public.refresh_attendance_assessment_scores(uuid) to authenticated, service_role;
grant execute on function public.reset_attendance_score_override(uuid, uuid) to authenticated, service_role;

create policy student_comments_select_scope
on public.student_comments for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    visibility = 'student_visible'
    and (app.is_guardian_of_student(student_id) or app.is_self_student(student_id))
  )
);
create policy student_comments_insert_grader
on public.student_comments for insert to authenticated
with check (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and author_profile_id = auth.uid()
  and updated_by = auth.uid()
);
create policy student_comments_update_grader
on public.student_comments for update to authenticated
using (app.can_comment_class(class_id) and not app.is_gradebook_locked(class_id))
with check (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and updated_by = auth.uid()
);
create policy student_comments_delete_grader
on public.student_comments for delete to authenticated
using (app.can_comment_class(class_id) and not app.is_gradebook_locked(class_id));

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on function public.refresh_attendance_assessment_scores(uuid) is
  'Refreshes the Mass or Catechism proposal from finalized attendance while preserving manual overrides (D-39/D-59).';
comment on table public.student_comments is
  'Student-visible comments and staff-only notes with RLS isolation (D-40).';
