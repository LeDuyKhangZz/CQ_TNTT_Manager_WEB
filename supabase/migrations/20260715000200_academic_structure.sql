-- P1-T2: Academic years, sectors, grade levels, class templates and classes.

create type public.academic_year_status as enum ('draft', 'current', 'closed', 'archived');
create type public.class_status as enum ('active', 'inactive', 'closed');

create table public.academic_years (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{4}-[0-9]{4}$'),
  name text not null check (btrim(name) <> ''),
  start_date date not null,
  end_date date not null,
  status public.academic_year_status not null default 'draft',
  top5_enabled boolean not null default false,
  attendance_lock_days smallint not null default 3 check (attendance_lock_days between 0 and 30),
  attendance_edit_lease_minutes smallint not null default 15 check (attendance_edit_lease_minutes between 1 and 60),
  retention_until date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint academic_years_date_order check (end_date > start_date),
  constraint academic_years_retention check (retention_until >= end_date)
);

create unique index academic_years_one_current_idx
on public.academic_years ((status)) where status = 'current';

create trigger academic_years_set_updated_at
before update on public.academic_years
for each row execute function app.set_updated_at();

create table public.sectors (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z_]+$'),
  name text not null unique check (btrim(name) <> ''),
  short_name text not null check (btrim(short_name) <> ''),
  sort_order smallint not null unique check (sort_order > 0),
  allows_sections boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sectors_set_updated_at
before update on public.sectors
for each row execute function app.set_updated_at();

create table public.grade_levels (
  id uuid primary key default extensions.gen_random_uuid(),
  sector_id uuid not null references public.sectors(id) on delete restrict,
  level_number smallint not null check (level_number between 1 and 3),
  display_name text not null check (btrim(display_name) <> ''),
  next_grade_level_id uuid references public.grade_levels(id) on delete set null,
  is_sector_final_level boolean not null default false,
  requires_sacrament_review boolean not null default false,
  can_propose_trainee boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null unique check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, level_number),
  unique (display_name)
);

create trigger grade_levels_set_updated_at
before update on public.grade_levels
for each row execute function app.set_updated_at();

create table public.class_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  section_code text,
  display_name text not null unique check (btrim(display_name) <> ''),
  sort_order smallint not null unique check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_templates_section_code check (section_code is null or section_code in ('A', 'B'))
);

create unique index class_templates_grade_section_idx
on public.class_templates (grade_level_id, coalesce(section_code, ''));

create trigger class_templates_set_updated_at
before update on public.class_templates
for each row execute function app.set_updated_at();

create table public.classes (
  id uuid primary key default extensions.gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  section_code text,
  display_name text not null check (btrim(display_name) <> ''),
  status public.class_status not null default 'active',
  meeting_location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint classes_section_code check (section_code is null or section_code in ('A', 'B'))
);

create unique index classes_year_grade_section_idx
on public.classes (academic_year_id, grade_level_id, coalesce(section_code, ''));
create index classes_year_grade_idx on public.classes (academic_year_id, grade_level_id);

create trigger classes_set_updated_at
before update on public.classes
for each row execute function app.set_updated_at();

alter table public.role_assignments
  add constraint role_assignments_academic_year_fk
    foreign key (academic_year_id) references public.academic_years(id) on delete restrict,
  add constraint role_assignments_sector_fk
    foreign key (sector_id) references public.sectors(id) on delete restrict,
  add constraint role_assignments_class_fk
    foreign key (class_id) references public.classes(id) on delete restrict;

create function app.validate_class_section()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  sector_allows_sections boolean;
begin
  select sector.allows_sections
  into sector_allows_sections
  from public.grade_levels as grade
  join public.sectors as sector on sector.id = grade.sector_id
  where grade.id = new.grade_level_id;

  if sector_allows_sections is null then
    raise exception 'GRADE_LEVEL_NOT_FOUND' using errcode = '23503';
  end if;
  if sector_allows_sections and new.section_code is null then
    raise exception 'SECTION_REQUIRED' using errcode = '23514';
  end if;
  if not sector_allows_sections and new.section_code is not null then
    raise exception 'SECTION_NOT_ALLOWED' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger class_templates_validate_section
before insert or update of grade_level_id, section_code on public.class_templates
for each row execute function app.validate_class_section();

create trigger classes_validate_section
before insert or update of grade_level_id, section_code on public.classes
for each row execute function app.validate_class_section();

create function app.validate_role_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  scoped_year_id uuid;
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
  end if;
  return new;
end;
$$;

create trigger role_assignments_validate_scope
before insert or update of role, academic_year_id, sector_id, class_id
on public.role_assignments
for each row execute function app.validate_role_assignment_scope();

create or replace function app.can_access_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or app.current_class_id() = target_class_id
    or exists (
      select 1
      from public.classes as class
      join public.grade_levels as grade on grade.id = class.grade_level_id
      where class.id = target_class_id
        and grade.sector_id = app.current_sector_id()
    ),
    false
  )
$$;

create function public.generate_default_classes(target_academic_year_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not exists (select 1 from public.academic_years where id = target_academic_year_id) then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.classes (
    academic_year_id, grade_level_id, section_code, display_name, updated_by
  )
  select target_academic_year_id, template.grade_level_id, template.section_code,
    template.display_name, auth.uid()
  from public.class_templates as template
  where template.is_active
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create function public.set_current_academic_year(target_academic_year_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if app.current_role() not in ('super_admin', 'group_leader') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  perform 1 from public.academic_years for update;
  if not exists (
    select 1 from public.academic_years
    where id = target_academic_year_id and status in ('draft', 'current')
  ) then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND_OR_CLOSED' using errcode = 'P0002';
  end if;

  update public.academic_years
  set status = 'closed', updated_by = auth.uid()
  where status = 'current' and id <> target_academic_year_id;

  update public.academic_years
  set status = 'current', updated_by = auth.uid()
  where id = target_academic_year_id;
end;
$$;

alter table public.academic_years enable row level security;
alter table public.sectors enable row level security;
alter table public.grade_levels enable row level security;
alter table public.class_templates enable row level security;
alter table public.classes enable row level security;

grant select, insert, update on public.academic_years to authenticated;
grant select on public.sectors, public.grade_levels, public.class_templates to authenticated;
grant select, insert, update on public.classes to authenticated;
grant all on public.academic_years, public.sectors, public.grade_levels, public.class_templates, public.classes to service_role;
revoke all on function public.generate_default_classes(uuid) from public, anon;
revoke all on function public.set_current_academic_year(uuid) from public, anon;
grant execute on function public.generate_default_classes(uuid) to authenticated, service_role;
grant execute on function public.set_current_academic_year(uuid) to authenticated, service_role;

create policy academic_years_select_authenticated
on public.academic_years for select to authenticated
using (app.current_role() is not null);
create policy academic_years_insert_global_write
on public.academic_years for insert to authenticated
with check (
  app.can_global_write()
  and updated_by = auth.uid()
  and (status <> 'current' or app.current_role() in ('super_admin', 'group_leader'))
);
create policy academic_years_update_global_write
on public.academic_years for update to authenticated
using (app.can_global_write())
with check (
  app.can_global_write()
  and updated_by = auth.uid()
  and (status <> 'current' or app.current_role() in ('super_admin', 'group_leader'))
);

create policy sectors_select_authenticated
on public.sectors for select to authenticated using (app.current_role() is not null);
create policy grade_levels_select_authenticated
on public.grade_levels for select to authenticated using (app.current_role() is not null);
create policy class_templates_select_staff
on public.class_templates for select to authenticated
using (app.current_role() not in ('guardian', 'student'));

create policy classes_select_authenticated
on public.classes for select to authenticated using (app.current_role() is not null);
create policy classes_insert_global_write
on public.classes for insert to authenticated
with check (app.can_global_write() and updated_by = auth.uid());
create policy classes_update_global_write
on public.classes for update to authenticated
using (app.can_global_write())
with check (app.can_global_write() and updated_by = auth.uid());

comment on table public.class_templates is 'Canonical 20-class structure copied into each academic year.';
comment on function public.generate_default_classes(uuid) is 'Idempotently copies active class templates into an academic year.';
