-- Phase 4 / P4-T1: kế hoạch giảng dạy năm và phân công người dạy.

create type public.teaching_plan_item_type as enum ('lesson', 'assessment');

create table public.teaching_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null unique references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  title text,
  created_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint teaching_plans_title_length check (
    title is null or (char_length(btrim(title)) between 1 and 150)
  )
);

create table public.teaching_plan_items (
  id uuid primary key default extensions.gen_random_uuid(),
  teaching_plan_id uuid not null references public.teaching_plans(id) on delete cascade,
  sequence_no integer not null default 1 check (sequence_no > 0),
  planned_date date not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  objectives text check (objectives is null or char_length(objectives) <= 4000),
  catechism_content text check (catechism_content is null or char_length(catechism_content) <= 8000),
  scripture_content text check (scripture_content is null or char_length(scripture_content) <= 4000),
  game text check (game is null or char_length(game) <= 2000),
  song text check (song is null or char_length(song) <= 1000),
  homework text check (homework is null or char_length(homework) <= 2000),
  preparation text check (preparation is null or char_length(preparation) <= 2000),
  teacher_staff_id uuid references public.staff_profiles(id) on delete restrict,
  item_type public.teaching_plan_item_type not null default 'lesson',
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint teaching_plan_items_one_per_date unique (teaching_plan_id, planned_date),
  constraint teaching_plan_lesson_has_teacher check (
    item_type = 'assessment' or teacher_staff_id is not null
  )
);

create index teaching_plan_items_plan_date_idx
on public.teaching_plan_items (teaching_plan_id, planned_date);

create index teaching_plan_items_teacher_date_idx
on public.teaching_plan_items (teacher_staff_id, planned_date)
where teacher_staff_id is not null;

create trigger teaching_plans_set_updated_at
before update on public.teaching_plans
for each row execute function app.set_updated_at();

create trigger teaching_plan_items_set_updated_at
before update on public.teaching_plan_items
for each row execute function app.set_updated_at();

create function app.prepare_teaching_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
  actor_staff uuid;
begin
  select class.academic_year_id into class_year
  from public.classes as class
  where class.id = new.class_id;
  if class_year is null then
    raise exception 'TEACHING_PLAN_CLASS_NOT_FOUND' using errcode = '23503';
  end if;

  -- Năm học luôn suy ra từ lớp; không tin academic_year_id phía client.
  new.academic_year_id := class_year;
  new.updated_by := coalesce(auth.uid(), new.updated_by);

  if tg_op = 'INSERT' then
    select staff.id into actor_staff
    from public.staff_profiles as staff
    where staff.profile_id = auth.uid();
    new.created_by_staff_id := actor_staff;
  else
    new.created_by_staff_id := old.created_by_staff_id;
  end if;

  return new;
end;
$$;

create trigger teaching_plans_prepare
before insert or update on public.teaching_plans
for each row execute function app.prepare_teaching_plan();

create function app.validate_teaching_plan_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_class_id uuid;
  year_start date;
  year_end date;
begin
  if tg_op = 'UPDATE' and new.teaching_plan_id is distinct from old.teaching_plan_id then
    raise exception 'TEACHING_PLAN_ITEM_CANNOT_MOVE' using errcode = '23514';
  end if;

  select plan.class_id, year.start_date, year.end_date
    into target_class_id, year_start, year_end
  from public.teaching_plans as plan
  join public.academic_years as year on year.id = plan.academic_year_id
  where plan.id = new.teaching_plan_id;

  if target_class_id is null then
    raise exception 'TEACHING_PLAN_NOT_FOUND' using errcode = '23503';
  end if;
  if new.planned_date < year_start or new.planned_date > year_end then
    raise exception 'TEACHING_PLAN_DATE_OUTSIDE_YEAR' using errcode = '23514';
  end if;

  if new.teacher_staff_id is not null and not exists (
    select 1
    from public.class_staff_assignments as assignment
    where assignment.class_id = target_class_id
      and assignment.staff_profile_id = new.teacher_staff_id
      and assignment.is_active
      and assignment.starts_on <= new.planned_date
      and (assignment.ends_on is null or assignment.ends_on >= new.planned_date)
  ) then
    raise exception 'TEACHING_PLAN_TEACHER_OUT_OF_CLASS' using errcode = '23514';
  end if;

  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger teaching_plan_items_validate
before insert or update on public.teaching_plan_items
for each row execute function app.validate_teaching_plan_item();

create function app.can_manage_teaching_plan(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or app.is_class_representative(target_class_id),
    false
  )
$$;

alter table public.teaching_plans enable row level security;
alter table public.teaching_plan_items enable row level security;

grant select, insert, update, delete on public.teaching_plans to authenticated;
grant select, insert, update, delete on public.teaching_plan_items to authenticated;
grant all on public.teaching_plans, public.teaching_plan_items to service_role;

create policy teaching_plans_select_staff_scope
on public.teaching_plans for select to authenticated
using (app.can_access_class(class_id));

create policy teaching_plans_insert_manager
on public.teaching_plans for insert to authenticated
with check (app.can_manage_teaching_plan(class_id));

create policy teaching_plans_update_manager
on public.teaching_plans for update to authenticated
using (app.can_manage_teaching_plan(class_id))
with check (app.can_manage_teaching_plan(class_id));

create policy teaching_plans_delete_manager
on public.teaching_plans for delete to authenticated
using (app.can_manage_teaching_plan(class_id));

create policy teaching_plan_items_select_staff_scope
on public.teaching_plan_items for select to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_access_class(plan.class_id)
  )
);

create policy teaching_plan_items_insert_manager
on public.teaching_plan_items for insert to authenticated
with check (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
  )
);

create policy teaching_plan_items_update_manager
on public.teaching_plan_items for update to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
  )
)
with check (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
  )
);

create policy teaching_plan_items_delete_manager
on public.teaching_plan_items for delete to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
  )
);

revoke all on function app.prepare_teaching_plan() from public, anon;
revoke all on function app.validate_teaching_plan_item() from public, anon;
revoke all on function app.can_manage_teaching_plan(uuid) from public, anon;
grant execute on function app.can_manage_teaching_plan(uuid) to authenticated, service_role;

comment on table public.teaching_plans is
  'Một kế hoạch giảng dạy cho mỗi lớp/năm học; không có approval hoặc version workflow.';
comment on table public.teaching_plan_items is
  'Lịch bài dạy/kiểm tra cả năm; một mục mỗi ngày, người dạy phải thuộc đội ngũ lớp.';
