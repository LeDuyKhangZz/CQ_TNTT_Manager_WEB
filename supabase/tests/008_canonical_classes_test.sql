begin;

select plan(16);

select enum_has_labels('public', 'class_kind', array['catechism', 'trainee'], 'class_kind enum labels');
select enum_has_labels('public', 'term_scope', array['full_year', 'semester_1'], 'term_scope enum labels');
select has_column('public', 'grade_levels', 'allows_sections', 'grade levels carry per-grade section eligibility');
select function_returns('public', 'generate_default_classes', array['uuid'], 'jsonb',
  'class generation returns a structured result, not a bare integer');

-- Fixtures -------------------------------------------------------------------
-- 🔴 D-112 (M02-A): vòng đời năm học thu hẹp về Super Admin, nên người gọi RPC ở
-- đây không còn là Xứ đoàn trưởng. Bài kiểm "Xứ đoàn trưởng/Thư ký bị từ chối"
-- nằm ở `032_academic_year_guard_test.sql`.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'canon-sa@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'CANON_SA', 'Quản trị hệ thống');
insert into public.staff_profiles (profile_id, title, full_name, phone) values
  ('b1000000-0000-4000-8000-000000000001', 'anh', 'Quản trị hệ thống', '0900000092');
insert into public.role_assignments (profile_id, role) values
  ('b1000000-0000-4000-8000-000000000001', 'super_admin');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('b0000000-0000-4000-8000-000000000001', '2040-2041', 'Năm học sinh lớp', '2040-09-01', '2041-05-31', '2046-05-31'),
  ('b0000000-0000-4000-8000-000000000002', '2041-2042', 'Năm học ràng buộc', '2041-09-01', '2042-05-31', '2047-05-31');

-- Idempotent generation from templates --------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select is(
  (public.generate_default_classes('b0000000-0000-4000-8000-000000000001') ->> 'inserted')::integer,
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
-- 🔴 Đúng chỗ sự cố production nằm (5W-F02): lượt sinh thứ hai trả `inserted = 0`
-- **và** `expected = 19` — hai con số này là thứ phân biệt "đã sinh đủ từ trước"
-- với "không có gì để sinh vì thiếu danh mục". Bản cũ chỉ trả một số 0 trần, mang
-- cả hai nghĩa, nên giao diện không có cách nào nói đúng. BR-M02-N02.
select is(
  (public.generate_default_classes('b0000000-0000-4000-8000-000000000001') ->> 'inserted')::integer,
  0, 'second generation is idempotent'
);
select is(
  (public.generate_default_classes('b0000000-0000-4000-8000-000000000001') ->> 'expected')::integer,
  19, 'result carries the expected template count'
);
select is(
  (public.generate_default_classes('b0000000-0000-4000-8000-000000000001') ->> 'already_present')::integer,
  19, 'result carries how many classes the year already had'
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
