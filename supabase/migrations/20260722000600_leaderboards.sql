-- P5-T4 — Top 5 with multiple sources and immutable published snapshots.

create table public.leaderboards (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  title text not null check (btrim(title) <> '' and char_length(title) <= 120),
  source_type public.leaderboard_source_type not null,
  source_assessment_id uuid references public.assessments(id) on delete restrict,
  top_n smallint not null default 5 check (top_n = 5),
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint leaderboard_source_assessment check (
    (source_type = 'assessment' and source_assessment_id is not null)
    or (source_type <> 'assessment' and source_assessment_id is null)
  ),
  constraint leaderboard_publication_metadata check (
    (is_published and published_at is not null and published_by is not null)
    or not is_published
  )
);

create index leaderboards_class_idx on public.leaderboards(class_id, is_published, created_at desc);
create trigger leaderboards_set_updated_at
before update on public.leaderboards
for each row execute function app.set_updated_at();

create function app.can_manage_leaderboard(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.can_global_write() or app.is_class_representative(target_class_id), false)
$$;

create function app.validate_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
begin
  select academic_year_id into class_year from public.classes where id = new.class_id;
  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
  end if;
  new.academic_year_id := class_year;
  if not exists (
    select 1 from public.academic_years
    where id = class_year and top5_enabled
  ) then
    raise exception 'TOP5_DISABLED' using errcode = '42501';
  end if;
  if new.source_type = 'assessment' and not exists (
    select 1 from public.assessments
    where id = new.source_assessment_id and class_id = new.class_id and is_active
  ) then
    raise exception 'LEADERBOARD_ASSESSMENT_MISMATCH' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and old.is_published and (
    new.class_id is distinct from old.class_id
    or new.source_type is distinct from old.source_type
    or new.source_assessment_id is distinct from old.source_assessment_id
    or new.title is distinct from old.title
  ) then
    raise exception 'LEADERBOARD_PUBLISHED' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger leaderboards_validate
before insert or update on public.leaderboards
for each row execute function app.validate_leaderboard();

create table public.leaderboard_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  leaderboard_id uuid not null references public.leaderboards(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  rank smallint not null check (rank between 1 and 5),
  score numeric(12, 2),
  title text,
  saint_name_snapshot text not null,
  full_name_snapshot text not null,
  leaderboard_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (leaderboard_id, rank),
  unique (leaderboard_id, enrollment_id)
);

create index leaderboard_entries_scope_idx
on public.leaderboard_entries(class_id, leaderboard_published, rank);

create function app.sync_leaderboard_entry_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_leaderboard public.leaderboards;
  selected_enrollment public.enrollments;
  selected_student public.students;
begin
  select * into selected_leaderboard from public.leaderboards where id = new.leaderboard_id;
  select * into selected_enrollment from public.enrollments where id = new.enrollment_id;
  if selected_leaderboard.id is null or selected_enrollment.id is null
    or selected_leaderboard.class_id <> selected_enrollment.class_id
    or selected_leaderboard.academic_year_id <> selected_enrollment.academic_year_id then
    raise exception 'LEADERBOARD_ENROLLMENT_MISMATCH' using errcode = '23514';
  end if;
  select * into selected_student from public.students where id = selected_enrollment.student_id;
  new.class_id := selected_leaderboard.class_id;
  new.academic_year_id := selected_leaderboard.academic_year_id;
  new.saint_name_snapshot := selected_student.saint_name;
  new.full_name_snapshot := selected_student.full_name;
  new.leaderboard_published := selected_leaderboard.is_published;
  return new;
end;
$$;

create trigger leaderboard_entries_sync_keys
before insert or update on public.leaderboard_entries
for each row execute function app.sync_leaderboard_entry_keys();

create function app.sync_leaderboard_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published is distinct from old.is_published then
    update public.leaderboard_entries
    set leaderboard_published = new.is_published
    where leaderboard_id = new.id;
  end if;
  return new;
end;
$$;

create trigger leaderboards_sync_publication
after update of is_published on public.leaderboards
for each row execute function app.sync_leaderboard_publication();

create function public.preview_leaderboard(
  p_leaderboard_id uuid,
  p_custom_scores jsonb default null
)
returns table (
  out_enrollment_id uuid,
  out_saint_name text,
  out_full_name text,
  out_score numeric,
  out_rank smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_leaderboard public.leaderboards;
begin
  select * into selected_leaderboard
  from public.leaderboards where id = p_leaderboard_id;
  if selected_leaderboard.id is null then
    raise exception 'LEADERBOARD_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_manage_leaderboard(selected_leaderboard.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if selected_leaderboard.source_type = 'assessment' then
    return query
    select ranked.enrollment_id, ranked.saint_name, ranked.full_name, ranked.score,
      ranked.position::smallint
    from (
      select enrollment.id as enrollment_id, student.saint_name, student.full_name,
        score.score::numeric as score,
        row_number() over (order by score.score desc, student.full_name, enrollment.id) as position
      from public.assessment_scores as score
      join public.enrollments as enrollment on enrollment.id = score.enrollment_id
      join public.students as student on student.id = enrollment.student_id
      where score.assessment_id = selected_leaderboard.source_assessment_id
        and score.score is not null
    ) as ranked
    where ranked.position <= 5 order by ranked.position;
  elsif selected_leaderboard.source_type in ('temporary_weighted_average', 'final_average') then
    if selected_leaderboard.source_type = 'final_average'
      and not app.is_gradebook_locked(selected_leaderboard.class_id) then
      raise exception 'GRADEBOOK_NOT_LOCKED' using errcode = '42501';
    end if;
    return query
    select ranked.enrollment_id, ranked.saint_name, ranked.full_name, ranked.score,
      ranked.position::smallint
    from (
      select enrollment.id as enrollment_id, student.saint_name, student.full_name,
        average.weighted_average::numeric as score,
        row_number() over (order by average.weighted_average desc, student.full_name, enrollment.id) as position
      from public.v_student_weighted_average as average
      join public.enrollments as enrollment on enrollment.id = average.enrollment_id
      join public.students as student on student.id = enrollment.student_id
      where average.class_id = selected_leaderboard.class_id
        and average.weighted_average is not null
    ) as ranked
    where ranked.position <= 5 order by ranked.position;
  else
    if jsonb_typeof(p_custom_scores) <> 'array' then
      raise exception 'CUSTOM_SCORES_REQUIRED' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(p_custom_scores) as item
      left join public.enrollments as enrollment
        on enrollment.id = (item->>'enrollmentId')::uuid
       and enrollment.class_id = selected_leaderboard.class_id
      where enrollment.id is null
        or not (item ? 'score')
        or (item->>'score')::numeric < -1000000
        or (item->>'score')::numeric > 1000000
    ) then
      raise exception 'CUSTOM_SCORE_INVALID' using errcode = '23514';
    end if;
    return query
    select ranked.enrollment_id, ranked.saint_name, ranked.full_name, ranked.score,
      ranked.position::smallint
    from (
      select enrollment.id as enrollment_id, student.saint_name, student.full_name,
        (item->>'score')::numeric as score,
        row_number() over (order by (item->>'score')::numeric desc, student.full_name, enrollment.id) as position
      from jsonb_array_elements(p_custom_scores) as item
      join public.enrollments as enrollment on enrollment.id = (item->>'enrollmentId')::uuid
      join public.students as student on student.id = enrollment.student_id
      where enrollment.class_id = selected_leaderboard.class_id
    ) as ranked
    where ranked.position <= 5 order by ranked.position;
  end if;
end;
$$;

create function public.publish_leaderboard(
  p_leaderboard_id uuid,
  p_custom_scores jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_leaderboard public.leaderboards;
  inserted_count integer;
begin
  select * into selected_leaderboard
  from public.leaderboards where id = p_leaderboard_id for update;
  if selected_leaderboard.id is null then
    raise exception 'LEADERBOARD_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_manage_leaderboard(selected_leaderboard.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if selected_leaderboard.is_published then
    raise exception 'LEADERBOARD_ALREADY_PUBLISHED' using errcode = '23505';
  end if;
  if not exists (
    select 1 from public.academic_years
    where id = selected_leaderboard.academic_year_id and top5_enabled
  ) then
    raise exception 'TOP5_DISABLED' using errcode = '42501';
  end if;

  delete from public.leaderboard_entries where leaderboard_id = selected_leaderboard.id;
  insert into public.leaderboard_entries (
    leaderboard_id, class_id, academic_year_id, enrollment_id, rank, score,
    saint_name_snapshot, full_name_snapshot, leaderboard_published
  )
  select selected_leaderboard.id, selected_leaderboard.class_id,
    selected_leaderboard.academic_year_id, preview.out_enrollment_id,
    preview.out_rank, preview.out_score, preview.out_saint_name,
    preview.out_full_name, false
  from public.preview_leaderboard(selected_leaderboard.id, p_custom_scores) as preview;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    raise exception 'LEADERBOARD_NO_DATA' using errcode = '23514';
  end if;

  update public.leaderboards
  set is_published = true,
      published_at = now(),
      published_by = auth.uid(),
      updated_by = auth.uid()
  where id = selected_leaderboard.id;
  return inserted_count;
end;
$$;

alter table public.leaderboards enable row level security;
alter table public.leaderboard_entries enable row level security;
grant select, insert, update, delete on public.leaderboards to authenticated;
grant select on public.leaderboard_entries to authenticated;
grant all on public.leaderboards, public.leaderboard_entries to service_role;

revoke all on function public.preview_leaderboard(uuid, jsonb) from public, anon;
revoke all on function public.publish_leaderboard(uuid, jsonb) from public, anon;
grant execute on function public.preview_leaderboard(uuid, jsonb) to authenticated, service_role;
grant execute on function public.publish_leaderboard(uuid, jsonb) to authenticated, service_role;

create policy leaderboards_select_scope
on public.leaderboards for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    is_published and exists (
      select 1 from public.enrollments as enrollment
      where enrollment.class_id = leaderboards.class_id
        and enrollment.academic_year_id = leaderboards.academic_year_id
        and (app.is_guardian_of_student(enrollment.student_id) or app.is_self_student(enrollment.student_id))
    )
  )
);
create policy leaderboards_insert_manager
on public.leaderboards for insert to authenticated
with check (
  app.can_manage_leaderboard(class_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
);
create policy leaderboards_update_manager
on public.leaderboards for update to authenticated
using (app.can_manage_leaderboard(class_id))
with check (app.can_manage_leaderboard(class_id) and updated_by = auth.uid());
create policy leaderboards_delete_manager
on public.leaderboards for delete to authenticated
using (app.can_manage_leaderboard(class_id) and not is_published);

create policy leaderboard_entries_select_scope
on public.leaderboard_entries for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    leaderboard_published and exists (
      select 1 from public.enrollments as enrollment
      where enrollment.class_id = leaderboard_entries.class_id
        and enrollment.academic_year_id = leaderboard_entries.academic_year_id
        and (app.is_guardian_of_student(enrollment.student_id) or app.is_self_student(enrollment.student_id))
    )
  )
);

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.leaderboard_entries is
  'At most five immutable public snapshot rows; names are copied so portal never joins unrestricted student rows.';
