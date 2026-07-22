begin;

select plan(13);

select enum_has_labels('public', 'class_kind', array['catechism', 'trainee'], 'class_kind enum labels');
select enum_has_labels('public', 'term_scope', array['full_year', 'semester_1'], 'term_scope enum labels');
select has_column('public', 'grade_levels', 'allows_sections', 'grade levels carry per-grade section eligibility');

-- Fixtures -------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'grouplead@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'GROUPLEAD', 'Group Lead');
insert into public.staff_profiles (profile_id, title, full_name, phone) values
  ('b1000000-0000-4000-8000-000000000001', 'anh', 'Group Lead', '0900000092');
insert into public.role_assignments (profile_id, role) values
  ('b1000000-0000-4000-8000-000000000001', 'group_leader');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('b0000000-0000-4000-8000-000000000001', '2040-2041', 'Năm học sinh lớp', '2040-09-01', '2041-05-31', '2046-05-31'),
  ('b0000000-0000-4000-8000-000000000002', '2041-2042', 'Năm học ràng buộc', '2041-09-01', '2042-05-31', '2047-05-31');

-- Idempotent generation from templates --------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select is(
  public.generate_default_classes('b0000000-0000-4000-8000-000000000001'),
  19, 'generates the canonical 19 classes'
);
select is(
  (select count(*)::integer from public.classes where academic_year_id = 'b0000000-0000-4000-8000-000000000001'),
  19, 'year now has 19 classes'
);
select is(
  (select count(*)::integer from public.classes
    where academic_year_id = 'b0000000-0000-4000-8000-000000000001'
      and class_kind = 'trainee' and grade_level_id is null and term_scope = 'semester_1'),
  1, 'exactly one HK1 trainee class with no grade'
);
select is(
  (select count(*)::integer from public.classes
    where academic_year_id = 'b0000000-0000-4000-8000-000000000001' and class_kind = 'catechism'),
  18, 'eighteen catechism classes'
);
select is(
  public.generate_default_classes('b0000000-0000-4000-8000-000000000001'),
  0, 'second generation is idempotent'
);

-- Section eligibility is per grade level ------------------------------------
reset role;
select throws_ok(
  $$insert into public.classes (academic_year_id, grade_level_id, section_code, display_name)
    values ('b0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000009', 'A', 'Thiếu 3A')$$,
  '23514', null, 'Thieu 3 does not allow A/B sections'
);
select throws_ok(
  $$insert into public.classes (academic_year_id, grade_level_id, section_code, display_name)
    values ('b0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000007', null, 'Thiếu 1')$$,
  '23514', null, 'Thieu 1 requires a section'
);
select lives_ok(
  $$insert into public.classes (academic_year_id, grade_level_id, section_code, display_name)
    values ('b0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000009', null, 'Thiếu 3')$$,
  'Thieu 3 is a single class with no section'
);
select lives_ok(
  $$insert into public.classes (academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name)
    values ('b0000000-0000-4000-8000-000000000002', null, null, 'trainee', 'semester_1', 'Dự trưởng')$$,
  'a trainee class needs no grade or sector'
);
select throws_ok(
  $$insert into public.classes (academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name)
    values ('b0000000-0000-4000-8000-000000000002', null, null, 'trainee', 'semester_1', 'Dự trưởng 2')$$,
  '23505', null, 'only one trainee class per academic year'
);

select * from finish();
rollback;
