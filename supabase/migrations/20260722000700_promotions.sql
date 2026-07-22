-- P5-T5 — end-of-year promotion proposals and atomic sector approval.

create table public.promotion_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  source_enrollment_id uuid not null unique references public.enrollments(id) on delete restrict,
  source_class_id uuid not null references public.classes(id) on delete restrict,
  source_academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  proposed_target_class_id uuid references public.classes(id) on delete restrict,
  propose_trainee boolean not null default false,
  proposed_status public.promotion_status not null,
  warning_snapshot jsonb not null default '{}'::jsonb,
  representative_note text check (representative_note is null or char_length(representative_note) <= 1000),
  proposed_by uuid not null references public.profiles(id) on delete restrict,
  proposed_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  final_status public.promotion_status not null default 'pending',
  approved_target_class_id uuid references public.classes(id) on delete restrict,
  created_enrollment_id uuid references public.enrollments(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotion_proposed_status check (
    proposed_status in ('recommended_promote', 'recommended_repeat', 'temporarily_pause', 'withdraw')
  ),
  constraint promotion_final_status check (final_status in ('pending', 'approved', 'rejected')),
  constraint promotion_target_shape check (
    (proposed_status in ('recommended_promote', 'recommended_repeat') and (
      (propose_trainee and proposed_target_class_id is null)
      or (not propose_trainee and proposed_target_class_id is not null)
    ))
    or (proposed_status in ('temporarily_pause', 'withdraw') and not propose_trainee and proposed_target_class_id is null)
  )
);

create index promotion_reviews_scope_idx
on public.promotion_reviews(source_class_id, final_status, proposed_at desc);
create trigger promotion_reviews_set_updated_at
before update on public.promotion_reviews
for each row execute function app.set_updated_at();

create function app.can_manage_promotion(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.can_global_write() or app.is_class_representative(target_class_id), false)
$$;

create function app.can_review_promotion(target_class_id uuid)
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
        where class.id = target_class_id and grade.sector_id = app.current_sector_id()
      )
    ), false
  )
$$;

create function app.promotion_target_is_valid(
  p_source_enrollment_id uuid,
  p_status public.promotion_status,
  p_target_class_id uuid,
  p_propose_trainee boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with source as (
    select enrollment.id, enrollment.class_id, enrollment.academic_year_id,
      class.grade_level_id, year.start_date as year_start,
      grade.next_grade_level_id, grade.can_propose_trainee
    from public.enrollments as enrollment
    join public.classes as class on class.id = enrollment.class_id
    join public.academic_years as year on year.id = enrollment.academic_year_id
    left join public.grade_levels as grade on grade.id = class.grade_level_id
    where enrollment.id = p_source_enrollment_id
  ), target as (
    select class.id, class.grade_level_id, class.class_kind, class.status,
      year.start_date as year_start
    from public.classes as class
    join public.academic_years as year on year.id = class.academic_year_id
    where class.id = p_target_class_id
  )
  select coalesce(case
    when p_status in ('temporarily_pause', 'withdraw')
      then p_target_class_id is null and not p_propose_trainee
    when p_propose_trainee
      then p_status = 'recommended_promote'
        and p_target_class_id is not null
        and source.can_propose_trainee
        and target.class_kind = 'trainee'
        and target.status = 'active'
        and target.year_start > source.year_start
    when p_status = 'recommended_promote'
      then p_target_class_id is not null
        and target.grade_level_id = source.next_grade_level_id
        and target.status = 'active'
        and target.year_start > source.year_start
    when p_status = 'recommended_repeat'
      then p_target_class_id is not null
        and target.grade_level_id = source.grade_level_id
        and target.status = 'active'
        and target.year_start > source.year_start
    else false
  end, false)
  from source left join target on true
$$;

create function public.propose_promotion(
  p_source_enrollment_id uuid,
  p_proposed_status public.promotion_status,
  p_target_class_id uuid default null,
  p_propose_trainee boolean default false,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.enrollments;
  existing public.promotion_reviews;
  review_id uuid;
  warning jsonb;
begin
  select * into source from public.enrollments
  where id = p_source_enrollment_id for update;
  if source.id is null then
    raise exception 'ENROLLMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if source.status not in ('active', 'paused') then
    raise exception 'ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;
  if not app.can_manage_promotion(source.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_proposed_status not in ('recommended_promote', 'recommended_repeat', 'temporarily_pause', 'withdraw') then
    raise exception 'PROMOTION_STATUS_INVALID' using errcode = '23514';
  end if;

  if p_propose_trainee then
    if p_target_class_id is not null or p_proposed_status <> 'recommended_promote' then
      raise exception 'TRAINEE_PROPOSAL_INVALID' using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.classes as class
      join public.grade_levels as grade on grade.id = class.grade_level_id
      where class.id = source.class_id and grade.can_propose_trainee
    ) then
      raise exception 'TRAINEE_PROPOSAL_INVALID' using errcode = '23514';
    end if;
  elsif not app.promotion_target_is_valid(source.id, p_proposed_status, p_target_class_id, false) then
    raise exception 'PROMOTION_TARGET_INVALID' using errcode = '23514';
  end if;

  select * into existing from public.promotion_reviews
  where source_enrollment_id = source.id for update;
  if existing.id is not null and existing.final_status = 'approved' then
    raise exception 'PROMOTION_ALREADY_APPROVED' using errcode = '23505';
  end if;

  select jsonb_build_object(
    'weightedAverage', average.weighted_average,
    'massAttendanceScore', attendance.mass_attendance_score,
    'catechismAttendanceScore', attendance.catechism_attendance_score,
    'warnConsecutiveAbsence', coalesce(attendance.warn_consecutive_absence, false),
    'warnConsecutiveSunday', coalesce(attendance.warn_consecutive_sunday, false),
    'warnLowRate', coalesce(attendance.warn_low_rate, false)
  ) into warning
  from (select 1) as seed
  left join public.v_student_weighted_average as average
    on average.enrollment_id = source.id
  left join public.v_student_attendance_summary as attendance
    on attendance.student_id = source.student_id
   and attendance.academic_year_id = source.academic_year_id;

  insert into public.promotion_reviews (
    source_enrollment_id, source_class_id, source_academic_year_id, student_id,
    proposed_target_class_id, propose_trainee, proposed_status, warning_snapshot,
    representative_note, proposed_by, proposed_at, final_status,
    reviewed_by, reviewed_at, review_note, approved_target_class_id, created_enrollment_id
  ) values (
    source.id, source.class_id, source.academic_year_id, source.student_id,
    p_target_class_id, p_propose_trainee, p_proposed_status, coalesce(warning, '{}'::jsonb),
    nullif(btrim(coalesce(p_note, '')), ''), auth.uid(), now(), 'pending',
    null, null, null, null, null
  )
  on conflict (source_enrollment_id) do update set
    proposed_target_class_id = excluded.proposed_target_class_id,
    propose_trainee = excluded.propose_trainee,
    proposed_status = excluded.proposed_status,
    warning_snapshot = excluded.warning_snapshot,
    representative_note = excluded.representative_note,
    proposed_by = auth.uid(),
    proposed_at = now(),
    final_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    review_note = null,
    approved_target_class_id = null,
    created_enrollment_id = null
  returning id into review_id;
  return review_id;
end;
$$;

create function public.approve_promotion_review(
  p_review_id uuid,
  p_decision text,
  p_target_class_id uuid default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  review public.promotion_reviews;
  source public.enrollments;
  source_year_end date;
  target_id uuid;
  target_year_id uuid;
  target_year_start date;
  new_enrollment_id uuid;
begin
  select * into review from public.promotion_reviews
  where id = p_review_id for update;
  if review.id is null then
    raise exception 'PROMOTION_REVIEW_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_review_promotion(review.source_class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'PROMOTION_DECISION_INVALID' using errcode = '22023';
  end if;
  if review.final_status = 'approved' and p_decision = 'approve' then
    return review.created_enrollment_id;
  end if;
  if review.final_status <> 'pending' then
    raise exception 'PROMOTION_ALREADY_REVIEWED' using errcode = '23505';
  end if;

  if p_decision = 'reject' then
    update public.promotion_reviews
    set final_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
        review_note = nullif(btrim(coalesce(p_note, '')), '')
    where id = review.id;
    return null;
  end if;

  select * into source from public.enrollments
  where id = review.source_enrollment_id for update;
  if source.id is null or source.status not in ('active', 'paused') then
    raise exception 'ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;
  select end_date into source_year_end from public.academic_years where id = source.academic_year_id;

  if review.propose_trainee then
    select class.id into target_id
    from public.classes as class
    join public.academic_years as year on year.id = class.academic_year_id
    join public.academic_years as source_year on source_year.id = source.academic_year_id
    where class.class_kind = 'trainee' and class.status = 'active'
      and year.start_date > source_year.start_date
    order by year.start_date
    limit 1;
  elsif review.proposed_status in ('recommended_promote', 'recommended_repeat') then
    target_id := coalesce(p_target_class_id, review.proposed_target_class_id);
  else
    target_id := null;
  end if;

  if not app.promotion_target_is_valid(
    source.id, review.proposed_status, target_id, review.propose_trainee
  ) then
    raise exception 'PROMOTION_TARGET_INVALID' using errcode = '23514';
  end if;

  if review.proposed_status = 'temporarily_pause' then
    update public.enrollments
    set status = 'paused', ended_on = null, updated_by = auth.uid()
    where id = source.id;
  else
    update public.enrollments
    set status = case review.proposed_status
      when 'recommended_repeat' then 'repeating'::public.enrollment_status
      when 'withdraw' then 'withdrawn'::public.enrollment_status
      else 'completed'::public.enrollment_status
    end,
    ended_on = source_year_end,
    updated_by = auth.uid()
    where id = source.id;
  end if;

  if target_id is not null then
    select class.academic_year_id, year.start_date
      into target_year_id, target_year_start
    from public.classes as class
    join public.academic_years as year on year.id = class.academic_year_id
    where class.id = target_id;
    insert into public.enrollments (
      student_id, academic_year_id, class_id, status, enrolled_on,
      previous_enrollment_id, notes, updated_by
    ) values (
      source.student_id, target_year_id, target_id, 'active', target_year_start,
      source.id, 'Tạo từ duyệt chuyển lớp cuối năm', auth.uid()
    ) returning id into new_enrollment_id;
  end if;

  update public.promotion_reviews
  set final_status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      review_note = nullif(btrim(coalesce(p_note, '')), ''),
      approved_target_class_id = target_id,
      created_enrollment_id = new_enrollment_id
  where id = review.id;
  return new_enrollment_id;
end;
$$;

alter table public.promotion_reviews enable row level security;
grant select on public.promotion_reviews to authenticated;
grant all on public.promotion_reviews to service_role;
revoke all on function public.propose_promotion(uuid, public.promotion_status, uuid, boolean, text) from public, anon;
revoke all on function public.approve_promotion_review(uuid, text, uuid, text) from public, anon;
grant execute on function public.propose_promotion(uuid, public.promotion_status, uuid, boolean, text) to authenticated, service_role;
grant execute on function public.approve_promotion_review(uuid, text, uuid, text) to authenticated, service_role;

create policy promotion_reviews_select_scope
on public.promotion_reviews for select to authenticated
using (
  app.can_global_read()
  or app.can_access_class(source_class_id)
  or app.is_class_staff(source_class_id)
);

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on function public.approve_promotion_review(uuid, text, uuid, text) is
  'Atomically locks review/source, validates grade/branch/year, closes old enrollment and creates the next enrollment. Warnings never hard-block.';
