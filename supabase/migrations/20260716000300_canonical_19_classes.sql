-- P1-T2B: Correct canonical 19-class structure.
-- 18 catechism classes (no Chiên Con 3; Thiếu 3 is a single class, no A/B) plus
-- exactly one Dự trưởng (trainee) class that has no sector/grade and runs in HK1.
-- Section eligibility moves from sector-level to grade-level so Thiếu 3 has no A/B
-- while Thiếu 1/2 do. Seed data for the 13 grade levels / 19 templates lives in
-- supabase/seed.sql (re-run on every reset); this migration only changes schema,
-- constraints and the class-generation RPC. Existing migrations are untouched.

create type public.class_kind as enum ('catechism', 'trainee');
create type public.term_scope as enum ('full_year', 'semester_1');

-- Section eligibility is per grade level (Ấu 1..3, Thiếu 1..2 allow A/B; Thiếu 3
-- does not). Seed populates the flag; no rows exist yet at migration time.
alter table public.grade_levels
  add column allows_sections boolean not null default false;

-- Class templates -----------------------------------------------------------
alter table public.class_templates
  alter column grade_level_id drop not null,
  add column class_kind public.class_kind not null default 'catechism',
  add column term_scope public.term_scope not null default 'full_year',
  add constraint class_templates_kind_shape check (
    (class_kind = 'trainee'
      and grade_level_id is null and section_code is null and term_scope = 'semester_1')
    or (class_kind = 'catechism' and grade_level_id is not null)
  );

create unique index class_templates_one_trainee_idx
on public.class_templates (class_kind) where class_kind = 'trainee';

-- Classes -------------------------------------------------------------------
alter table public.classes
  alter column grade_level_id drop not null,
  add column class_kind public.class_kind not null default 'catechism',
  add column term_scope public.term_scope not null default 'full_year',
  add constraint classes_kind_shape check (
    (class_kind = 'trainee'
      and grade_level_id is null and section_code is null and term_scope = 'semester_1')
    or (class_kind = 'catechism' and grade_level_id is not null)
  );

create unique index classes_one_trainee_per_year_idx
on public.classes (academic_year_id) where class_kind = 'trainee';

-- Section validation now keys off grade-level eligibility and skips trainee.
create or replace function app.validate_class_section()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  grade_allows_sections boolean;
begin
  if new.grade_level_id is null then
    -- Trainee class: no grade, no section (enforced by the kind-shape CHECK).
    return new;
  end if;

  select allows_sections
  into grade_allows_sections
  from public.grade_levels
  where id = new.grade_level_id;

  if grade_allows_sections is null then
    raise exception 'GRADE_LEVEL_NOT_FOUND' using errcode = '23503';
  end if;
  if grade_allows_sections and new.section_code is null then
    raise exception 'SECTION_REQUIRED' using errcode = '23514';
  end if;
  if not grade_allows_sections and new.section_code is not null then
    raise exception 'SECTION_NOT_ALLOWED' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Re-point the triggers so class_kind changes are validated too.
drop trigger class_templates_validate_section on public.class_templates;
create trigger class_templates_validate_section
before insert or update of grade_level_id, section_code, class_kind on public.class_templates
for each row execute function app.validate_class_section();

drop trigger classes_validate_section on public.classes;
create trigger classes_validate_section
before insert or update of grade_level_id, section_code, class_kind on public.classes
for each row execute function app.validate_class_section();

-- Class generation carries kind/term/grade (nullable for trainee).
create or replace function public.generate_default_classes(target_academic_year_id uuid)
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
    academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name, updated_by
  )
  select target_academic_year_id, template.grade_level_id, template.section_code,
    template.class_kind, template.term_scope, template.display_name, auth.uid()
  from public.class_templates as template
  where template.is_active
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on table public.class_templates is 'Canonical 19-class structure (18 catechism + 1 Dự trưởng) copied into each academic year.';
comment on column public.grade_levels.allows_sections is 'Whether this grade level splits into A/B classes (Ấu 1..3, Thiếu 1..2 only).';
