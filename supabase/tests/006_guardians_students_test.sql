begin;

select plan(26);

-- Structure ------------------------------------------------------------------
select has_table('public', 'guardians', 'guardians table exists');
select has_table('public', 'students', 'students table exists');
select has_table('public', 'student_health_profiles', 'student health table exists');
select has_table('public', 'student_sacraments', 'student sacraments table exists');
select has_function('app', 'can_access_student', array['uuid'], 'student access helper exists');
select has_function('app', 'can_view_student_sensitive', array['uuid'], 'sensitive access helper exists');
select enum_has_labels('public', 'gender', array['male', 'female', 'other'], 'gender enum labels');

-- Fixtures (superuser bypasses RLS) ------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'secretary@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian1@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian2@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('a1000000-0000-4000-8000-000000000001', 'SECRETARY1', 'Secretary One'),
  ('a1000000-0000-4000-8000-000000000002', 'GUARDIAN1', 'Guardian One'),
  ('a1000000-0000-4000-8000-000000000003', 'GUARDIAN2', 'Guardian Two'),
  ('a1000000-0000-4000-8000-000000000004', 'CQ_SELF', 'Student Self');

insert into public.staff_profiles (profile_id, title, full_name, phone) values
  ('a1000000-0000-4000-8000-000000000001', 'chi', 'Secretary One', '0900000091');

insert into public.role_assignments (profile_id, role) values
  ('a1000000-0000-4000-8000-000000000001', 'secretary');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'Guardian One', '0900000001'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', 'Guardian Two', '0900000002');

insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000001', 'Maria', 'Nguyễn Thị An', 'female', '2015-03-10'),
  ('a3000000-0000-4000-8000-000000000002', null, 'a2000000-0000-4000-8000-000000000001', 'Giuse', 'Nguyễn Văn Bình', 'male', '2016-07-20'),
  ('a3000000-0000-4000-8000-000000000003', null, 'a2000000-0000-4000-8000-000000000002', 'Anna', 'Trần Thị Cúc', 'female', '2014-11-05');

insert into public.role_assignments (profile_id, role) values
  ('a1000000-0000-4000-8000-000000000002', 'guardian'),
  ('a1000000-0000-4000-8000-000000000003', 'guardian'),
  ('a1000000-0000-4000-8000-000000000004', 'student');

insert into public.student_health_profiles (student_id, allergies) values
  ('a3000000-0000-4000-8000-000000000001', 'Không rõ');
insert into public.student_sacraments (student_id, sacrament_type, sacrament_date) values
  ('a3000000-0000-4000-8000-000000000001', 'baptism', '2015-04-01');

select matches(
  (select student_code::text from public.students where id = 'a3000000-0000-4000-8000-000000000001'),
  '^CQ[0-9]{4}$', 'student code is generated safely'
);

-- Constraints ----------------------------------------------------------------
select throws_ok(
  $$insert into public.students (guardian_id, saint_name, full_name, gender, date_of_birth) values (null, 'X', 'No Guardian', 'other', '2015-01-01')$$,
  '23502', null, 'student requires a guardian'
);
select throws_ok(
  $$insert into public.students (guardian_id, saint_name, full_name, gender, date_of_birth) values ('a2000000-0000-4000-8000-000000000001', 'X', 'Future Child', 'other', (current_date + 1))$$,
  '23514', null, 'date of birth cannot be in the future'
);
select throws_ok(
  $$insert into public.student_sacraments (student_id, sacrament_type) values ('a3000000-0000-4000-8000-000000000001', 'baptism')$$,
  '23505', null, 'standard sacrament type is unique per student'
);
select throws_ok(
  $$insert into public.student_sacraments (student_id, sacrament_type) values ('a3000000-0000-4000-8000-000000000001', 'other')$$,
  '23514', null, 'other sacrament requires a name'
);
select lives_ok(
  $$insert into public.student_sacraments (student_id, sacrament_type, sacrament_name) values ('a3000000-0000-4000-8000-000000000001', 'other', 'Nghi thức riêng')$$,
  'other sacrament may repeat when named'
);

-- RLS as global-write secretary ---------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.students), 3, 'global reader sees every student');
select is((select count(*)::integer from public.student_health_profiles), 1, 'global reader sees health');
select is(
  (select count(*)::integer from public.student_sacraments where student_id = 'a3000000-0000-4000-8000-000000000001' and sacrament_type = 'baptism'),
  1, 'global reader sees sacraments'
);
select lives_ok(
  $$insert into public.students (guardian_id, saint_name, full_name, gender, date_of_birth, updated_by) values ('a2000000-0000-4000-8000-000000000002', 'Teresa', 'Lê Thị Dung', 'female', '2015-09-09', 'a1000000-0000-4000-8000-000000000001')$$,
  'global writer can create a student'
);

-- RLS as guardian1 -----------------------------------------------------------
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.students), 2, 'guardian sees only own children');
select is((select count(*)::integer from public.guardians), 1, 'guardian sees only own guardian record');
select ok(app.is_guardian_of_student('a3000000-0000-4000-8000-000000000001'), 'guardian recognized as owner');
select is((select count(*)::integer from public.student_health_profiles), 0, 'guardian cannot read health');
select is((select count(*)::integer from public.student_sacraments), 0, 'guardian cannot read sacraments');
select throws_ok(
  $$insert into public.students (guardian_id, saint_name, full_name, gender, date_of_birth, updated_by) values ('a2000000-0000-4000-8000-000000000001', 'X', 'Guardian Made', 'other', '2015-01-01', 'a1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'guardian cannot create students'
);

-- RLS as self student --------------------------------------------------------
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.students), 1, 'student sees only self');
select ok(app.is_self_student('a3000000-0000-4000-8000-000000000001'), 'student recognized as self');
select is((select count(*)::integer from public.student_health_profiles), 0, 'student cannot read health');

select * from finish();
rollback;
