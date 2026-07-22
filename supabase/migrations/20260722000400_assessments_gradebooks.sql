-- P5-T1/P5-T3 foundation — dynamic assessments, score grid and gradebook lock.
--
-- Invariants live in PostgreSQL, not only the UI:
--   * no required assessment kind and repeated kinds are valid;
--   * every score is null or 0..10 (zero remains a real score);
--   * weights are positive and copied from per-year defaults;
--   * assessment structure and scores cannot change while the gradebook is locked;
--   * score writes are batched through a transaction RPC.

alter table public.academic_years
  add column trainee_can_grade boolean not null default false,
  add column trainee_can_comment boolean not null default false;

create type public.attendance_score_component as enum ('mass', 'catechism');

create table public.assessment_type_settings (
  id uuid primary key default extensions.gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  kind public.assessment_kind not null,
  display_name text not null check (btrim(display_name) <> ''),
  default_weight numeric(5, 2) not null check (default_weight > 0 and default_weight <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  unique (academic_year_id, kind)
);

create trigger assessment_type_settings_set_updated_at
before update on public.assessment_type_settings
for each row execute function app.set_updated_at();

create function app.seed_assessment_type_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.assessment_type_settings (
    academic_year_id, kind, display_name, default_weight
  ) values
    (new.id, 'quiz_15m', 'Kiểm tra 15 phút', 1),
    (new.id, 'midterm', 'Giữa kỳ', 2),
    (new.id, 'final', 'Cuối kỳ', 3),
    (new.id, 'attendance', 'Chuyên cần', 1),
    (new.id, 'custom', 'Kiểm tra phát sinh', 1)
  on conflict (academic_year_id, kind) do nothing;
  return new;
end;
$$;

create trigger academic_years_seed_assessment_types
after insert on public.academic_years
for each row execute function app.seed_assessment_type_settings();

insert into public.assessment_type_settings (
  academic_year_id, kind, display_name, default_weight
)
select year.id, seed.kind, seed.display_name, seed.default_weight
from public.academic_years as year
cross join (
  values
    ('quiz_15m'::public.assessment_kind, 'Kiểm tra 15 phút', 1::numeric),
    ('midterm'::public.assessment_kind, 'Giữa kỳ', 2::numeric),
    ('final'::public.assessment_kind, 'Cuối kỳ', 3::numeric),
    ('attendance'::public.assessment_kind, 'Chuyên cần', 1::numeric),
    ('custom'::public.assessment_kind, 'Kiểm tra phát sinh', 1::numeric)
) as seed(kind, display_name, default_weight)
on conflict (academic_year_id, kind) do nothing;

create table public.gradebook_locks (
  class_id uuid primary key references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  is_locked boolean not null default false,
  locked_at timestamptz,
  locked_by uuid references public.profiles(id) on delete set null,
  unlocked_at timestamptz,
  unlocked_by uuid references public.profiles(id) on delete set null,
  results_published_at timestamptz,
  results_published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gradebook_lock_metadata check (
    (is_locked and locked_at is not null and locked_by is not null)
    or (not is_locked)
  )
);

create trigger gradebook_locks_set_updated_at
before update on public.gradebook_locks
for each row execute function app.set_updated_at();

create function app.is_gradebook_locked(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select gradebook.is_locked
    from public.gradebook_locks as gradebook
    where gradebook.class_id = target_class_id
  ), false)
$$;

create function app.can_grade_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or (
      app.is_class_staff(target_class_id)
      and (
        app.current_role() <> 'trainee_assistant'
        or exists (
          select 1
          from public.classes as class
          join public.academic_years as year on year.id = class.academic_year_id
          where class.id = target_class_id and year.trainee_can_grade
        )
      )
    ),
    false
  )
$$;

create function app.can_comment_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or (
      app.is_class_staff(target_class_id)
      and (
        app.current_role() <> 'trainee_assistant'
        or exists (
          select 1
          from public.classes as class
          join public.academic_years as year on year.id = class.academic_year_id
          where class.id = target_class_id and year.trainee_can_comment
        )
      )
    ),
    false
  )
$$;

create table public.assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  kind public.assessment_kind not null,
  title text not null check (btrim(title) <> '' and char_length(title) <= 120),
  assessment_date date,
  max_score numeric(4, 2) not null default 10 check (max_score > 0 and max_score <= 10),
  weight numeric(5, 2) not null check (weight > 0 and weight <= 100),
  attendance_component public.attendance_score_component,
  is_published boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint assessments_attendance_component check (
    (kind = 'attendance' and attendance_component is not null)
    or (kind <> 'attendance' and attendance_component is null)
  )
);

create index assessments_class_idx
on public.assessments(class_id, is_active, assessment_date, created_at);

create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function app.set_updated_at();

create function app.validate_assessment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
  year_start date;
  year_end date;
  default_weight numeric(5, 2);
begin
  select class.academic_year_id, year.start_date, year.end_date
    into class_year, year_start, year_end
  from public.classes as class
  join public.academic_years as year on year.id = class.academic_year_id
  where class.id = new.class_id;

  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
  end if;
  if new.academic_year_id is null then
    new.academic_year_id := class_year;
  end if;
  if new.academic_year_id <> class_year then
    raise exception 'CLASS_YEAR_MISMATCH' using errcode = '23514';
  end if;
  if new.assessment_date is not null
    and (new.assessment_date < year_start or new.assessment_date > year_end) then
    raise exception 'ASSESSMENT_DATE_OUTSIDE_YEAR' using errcode = '23514';
  end if;
  if app.is_gradebook_locked(new.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and new.weight is null then
    select setting.default_weight into default_weight
    from public.assessment_type_settings as setting
    where setting.academic_year_id = class_year
      and setting.kind = new.kind
      and setting.is_active;
    if default_weight is null then
      raise exception 'ASSESSMENT_KIND_DISABLED' using errcode = '23514';
    end if;
    new.weight := default_weight;
  end if;
  return new;
end;
$$;

create trigger assessments_validate
before insert or update on public.assessments
for each row execute function app.validate_assessment();

create function app.block_locked_assessment_delete()
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

create trigger assessments_block_locked_delete
before delete on public.assessments
for each row execute function app.block_locked_assessment_delete();

create table public.assessment_scores (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  score numeric(4, 2) check (score is null or (score >= 0 and score <= 10)),
  system_suggested_score numeric(4, 2)
    check (system_suggested_score is null or (system_suggested_score >= 0 and system_suggested_score <= 10)),
  is_manual_override boolean not null default false,
  note text check (note is null or char_length(note) <= 500),
  assessment_published boolean not null default false,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, enrollment_id)
);

create index assessment_scores_enrollment_idx on public.assessment_scores(enrollment_id);
create index assessment_scores_scope_idx on public.assessment_scores(class_id, student_id);

create trigger assessment_scores_set_updated_at
before update on public.assessment_scores
for each row execute function app.set_updated_at();

create function app.sync_assessment_score_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  selected_enrollment public.enrollments;
begin
  select * into selected_assessment
  from public.assessments where id = new.assessment_id;
  select * into selected_enrollment
  from public.enrollments where id = new.enrollment_id;

  if selected_assessment.id is null or selected_enrollment.id is null then
    raise exception 'ASSESSMENT_OR_ENROLLMENT_NOT_FOUND' using errcode = '23503';
  end if;
  if selected_assessment.class_id <> selected_enrollment.class_id
    or selected_assessment.academic_year_id <> selected_enrollment.academic_year_id then
    raise exception 'ASSESSMENT_ENROLLMENT_MISMATCH' using errcode = '23514';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  if new.score is not null and new.score > selected_assessment.max_score then
    raise exception 'SCORE_EXCEEDS_MAX' using errcode = '23514';
  end if;

  new.class_id := selected_assessment.class_id;
  new.academic_year_id := selected_assessment.academic_year_id;
  new.student_id := selected_enrollment.student_id;
  new.assessment_published := selected_assessment.is_published;
  return new;
end;
$$;

create trigger assessment_scores_sync_keys
before insert or update on public.assessment_scores
for each row execute function app.sync_assessment_score_keys();

create function app.sync_assessment_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published is distinct from old.is_published then
    update public.assessment_scores
    set assessment_published = new.is_published
    where assessment_id = new.id;
  end if;
  return new;
end;
$$;

create trigger assessments_sync_publication
after update of is_published on public.assessments
for each row execute function app.sync_assessment_publication();

create function public.save_assessment_scores(
  p_assessment_id uuid,
  p_scores jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  item jsonb;
  selected_enrollment public.enrollments;
  parsed_score numeric(4, 2);
  saved_count integer := 0;
begin
  select * into selected_assessment
  from public.assessments
  where id = p_assessment_id and is_active
  for update;
  if selected_assessment.id is null then
    raise exception 'ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_scores) <> 'array' then
    raise exception 'VALIDATION_ERROR' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_scores)
  loop
    if not (item ? 'enrollmentId') or not (item ? 'score') then
      raise exception 'VALIDATION_ERROR' using errcode = '22023';
    end if;
    select * into selected_enrollment
    from public.enrollments
    where id = (item->>'enrollmentId')::uuid;
    if selected_enrollment.id is null
      or selected_enrollment.class_id <> selected_assessment.class_id
      or selected_enrollment.academic_year_id <> selected_assessment.academic_year_id then
      raise exception 'ASSESSMENT_ENROLLMENT_MISMATCH' using errcode = '23514';
    end if;

    parsed_score := case
      when item->>'score' is null then null
      else (item->>'score')::numeric
    end;
    if parsed_score is not null
      and (parsed_score < 0 or parsed_score > selected_assessment.max_score) then
      raise exception 'SCORE_OUT_OF_RANGE' using errcode = '23514';
    end if;

    insert into public.assessment_scores (
      assessment_id, enrollment_id, class_id, academic_year_id, student_id,
      score, is_manual_override, note, assessment_published, graded_by, graded_at
    ) values (
      selected_assessment.id, selected_enrollment.id, selected_assessment.class_id,
      selected_assessment.academic_year_id, selected_enrollment.student_id,
      parsed_score,
      selected_assessment.kind = 'attendance',
      nullif(btrim(coalesce(item->>'note', '')), ''),
      selected_assessment.is_published, auth.uid(), now()
    )
    on conflict (assessment_id, enrollment_id) do update set
      score = excluded.score,
      is_manual_override = case
        when selected_assessment.kind = 'attendance' then true
        else public.assessment_scores.is_manual_override
      end,
      note = excluded.note,
      graded_by = auth.uid(),
      graded_at = now();
    saved_count := saved_count + 1;
  end loop;
  return saved_count;
end;
$$;

create function public.lock_gradebook(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
begin
  if not (app.is_class_representative(p_class_id) or app.can_global_write()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select academic_year_id into class_year from public.classes where id = p_class_id for update;
  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0002';
  end if;
  insert into public.gradebook_locks (
    class_id, academic_year_id, is_locked, locked_at, locked_by,
    unlocked_at, unlocked_by
  ) values (
    p_class_id, class_year, true, now(), auth.uid(), null, null
  )
  on conflict (class_id) do update set
    is_locked = true,
    locked_at = now(),
    locked_by = auth.uid(),
    unlocked_at = null,
    unlocked_by = null;
end;
$$;

create function public.unlock_gradebook(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  update public.gradebook_locks
  set is_locked = false, unlocked_at = now(), unlocked_by = auth.uid()
  where class_id = p_class_id and is_locked;
  if not found then
    raise exception 'GRADEBOOK_NOT_LOCKED' using errcode = 'P0002';
  end if;
end;
$$;

alter table public.assessment_type_settings enable row level security;
alter table public.gradebook_locks enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_scores enable row level security;

grant select on public.assessment_type_settings to authenticated;
grant update on public.assessment_type_settings to authenticated;
grant select on public.gradebook_locks to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select on public.assessment_scores to authenticated;
grant all on public.assessment_type_settings, public.gradebook_locks,
  public.assessments, public.assessment_scores to service_role;

revoke all on function public.save_assessment_scores(uuid, jsonb) from public, anon;
revoke all on function public.lock_gradebook(uuid) from public, anon;
revoke all on function public.unlock_gradebook(uuid) from public, anon;
grant execute on function public.save_assessment_scores(uuid, jsonb) to authenticated, service_role;
grant execute on function public.lock_gradebook(uuid) to authenticated, service_role;
grant execute on function public.unlock_gradebook(uuid) to authenticated, service_role;

create policy assessment_type_settings_select_authenticated
on public.assessment_type_settings for select to authenticated
using (app.current_role() is not null);
create policy assessment_type_settings_update_global
on public.assessment_type_settings for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

create policy gradebook_locks_select_scope
on public.gradebook_locks for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or exists (
    select 1 from public.enrollments as enrollment
    where enrollment.class_id = gradebook_locks.class_id
      and (app.is_guardian_of_student(enrollment.student_id) or app.is_self_student(enrollment.student_id))
  )
);

create policy assessments_select_scope
on public.assessments for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    is_published
    and exists (
      select 1 from public.enrollments as enrollment
      where enrollment.class_id = assessments.class_id
        and enrollment.academic_year_id = assessments.academic_year_id
        and (app.is_guardian_of_student(enrollment.student_id) or app.is_self_student(enrollment.student_id))
    )
  )
);
create policy assessments_insert_grader
on public.assessments for insert to authenticated
with check (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
);
create policy assessments_update_grader
on public.assessments for update to authenticated
using (app.can_grade_class(class_id) and not app.is_gradebook_locked(class_id))
with check (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and updated_by = auth.uid()
);
create policy assessments_delete_grader
on public.assessments for delete to authenticated
using (app.can_grade_class(class_id) and not app.is_gradebook_locked(class_id));

create policy assessment_scores_select_scope
on public.assessment_scores for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    assessment_published
    and (app.is_guardian_of_student(student_id) or app.is_self_student(student_id))
  )
);

create view public.v_student_weighted_average
with (security_invoker = true) as
select
  score.enrollment_id,
  score.student_id,
  score.class_id,
  score.academic_year_id,
  count(*) filter (where score.score is not null)::integer as scored_assessment_count,
  round(
    sum(score.score * assessment.weight) filter (where score.score is not null)
      / nullif(sum(assessment.weight) filter (where score.score is not null), 0),
    2
  ) as weighted_average
from public.assessment_scores as score
join public.assessments as assessment
  on assessment.id = score.assessment_id and assessment.is_active
group by score.enrollment_id, score.student_id, score.class_id, score.academic_year_id;

grant select on public.v_student_weighted_average to authenticated, service_role;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.assessments is
  'Dynamic gradebook columns. No required kind/count and repeated kinds are valid (D-38).';
comment on table public.assessment_scores is
  'One nullable score per assessment/enrollment; zero remains distinct from null.';
comment on view public.v_student_weighted_average is
  'Weighted average over visible non-null active assessment scores; security_invoker preserves score RLS.';
