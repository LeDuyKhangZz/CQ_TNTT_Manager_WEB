begin;

select plan(16);

select has_table('public', 'enrollments', 'enrollments table exists');
select has_index('public', 'enrollments', 'enrollments_one_open_per_student_year_idx', 'one open enrollment index exists');
select has_function('app', 'can_manage_class', array['uuid'], 'class management helper exists');

-- Fixtures (superuser bypasses RLS) ------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-en@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-en@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-en@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-en@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000002', 'TEACHER_EN', 'Teacher EN'),
  ('c1000000-0000-4000-8000-000000000003', 'GUARDIAN_EN', 'Guardian EN'),
  ('c1000000-0000-4000-8000-000000000004', 'STUDENT_EN', 'Student EN'),
  ('c1000000-0000-4000-8000-000000000005', 'OTHER_EN', 'Other EN');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('c0000000-0000-4000-8000-000000000001', '2050-2051', 'Năm ghi danh', '2050-09-01', '2051-05-31', 'current', '2056-05-31'),
  ('c0000000-0000-4000-8000-000000000002', '2051-2052', 'Năm khác', '2051-09-01', '2052-05-31', 'draft', '2057-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 EN'),
  ('c6000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000011', 'Nghĩa 2 EN');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c7000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'anh', 'Teacher EN', '0900000010'),
  ('c7000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', 'anh', 'Other EN', '0900000011');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', 'member', '2050-09-01'),
  ('c6000000-0000-4000-8000-000000000002', 'c7000000-0000-4000-8000-000000000002', 'member', '2050-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'Guardian EN', '0900000012');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c3000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000001', 'Phêrô', 'Ngô Văn Em', 'male', '2013-02-02'),
  ('c3000000-0000-4000-8000-000000000003', null, 'c2000000-0000-4000-8000-000000000001', 'Phaolô', 'Ngô Văn Ba', 'male', '2013-06-06');
insert into public.student_health_profiles (student_id, allergies) values
  ('c3000000-0000-4000-8000-000000000001', 'Không');
insert into public.enrollments (student_id, academic_year_id, class_id, status) values
  ('c3000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active');

-- Class staff (via assignment) can reach the enrolled student ----------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select ok(app.is_class_staff('c6000000-0000-4000-8000-000000000001'), 'assigned teacher is class staff');
select ok(app.can_access_student('c3000000-0000-4000-8000-000000000001'), 'class staff can access enrolled student');
select is((select count(*)::integer from public.enrollments), 1, 'class staff sees own class enrollment');
select ok(app.can_view_student_sensitive('c3000000-0000-4000-8000-000000000001'), 'class staff can view sensitive');
select is((select count(*)::integer from public.student_health_profiles), 1, 'class staff sees enrolled student health');
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, updated_by) values ('c3000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active', 'c1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'class staff without manage rights cannot enroll'
);

-- A teacher of another class cannot reach the student ------------------------
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000005', true);
select ok(not app.can_access_student('c3000000-0000-4000-8000-000000000001'), 'out-of-class teacher cannot access student');

-- Guardian and self student ownership ---------------------------------------
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.enrollments), 1, 'guardian sees own child enrollment');
select is((select count(*)::integer from public.student_health_profiles), 0, 'guardian cannot see health');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.enrollments), 1, 'student sees own enrollment');

-- Constraints ----------------------------------------------------------------
reset role;
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status) values ('c3000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000002', 'active')$$,
  '23505', null, 'at most one open enrollment per student per year'
);
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status) values ('c3000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'c6000000-0000-4000-8000-000000000001', 'active')$$,
  '23514', null, 'enrollment year must match the class year'
);
update public.enrollments set status = 'withdrawn', ended_on = '2050-12-31'
where student_id = 'c3000000-0000-4000-8000-000000000001';
select lives_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status) values ('c3000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000002', 'active')$$,
  'a new enrollment is allowed once the previous one is closed'
);

select * from finish();
rollback;
