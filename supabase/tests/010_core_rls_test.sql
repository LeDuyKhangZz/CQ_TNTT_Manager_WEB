begin;

-- P2-T5: Core cross-scope RLS. Two students share Ấu 1A; a third sits in a
-- different sector (Thiếu 1A). We probe every audience against the child data to
-- prove no cross-scope leakage (docs/07 §5, Gate Phase 2).
select plan(28);

-- Personas -------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'slau-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tau-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tthieu-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g1-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g2-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sta-rls@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('d1000000-0000-4000-8000-000000000001', 'SEC_RLS', 'Secretary RLS'),
  ('d1000000-0000-4000-8000-000000000002', 'SLAU_RLS', 'Sector Lead Au'),
  ('d1000000-0000-4000-8000-000000000003', 'TAU_RLS', 'Teacher Au'),
  ('d1000000-0000-4000-8000-000000000004', 'TTHIEU_RLS', 'Teacher Thieu'),
  ('d1000000-0000-4000-8000-000000000005', 'G1_RLS', 'Guardian One'),
  ('d1000000-0000-4000-8000-000000000006', 'G2_RLS', 'Guardian Two'),
  ('d1000000-0000-4000-8000-000000000007', 'STA_RLS', 'Student A');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('d0000000-0000-4000-8000-000000000001', '2060-2061', 'Năm RLS', '2060-09-01', '2061-05-31', 'draft', '2066-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('d6000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A RLS'),
  ('d6000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A RLS');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d7000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'anh', 'Secretary RLS', '0900000101'),
  ('d7000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'anh', 'Sector Lead Au', '0900000102'),
  ('d7000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'anh', 'Teacher Au', '0900000103'),
  ('d7000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', 'anh', 'Teacher Thieu', '0900000104');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('d6000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000003', 'member', '2060-09-01'),
  ('d6000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000004', 'member', '2060-09-01');

insert into public.role_assignments (profile_id, role) values
  ('d1000000-0000-4000-8000-000000000001', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('d1000000-0000-4000-8000-000000000002', 'sector_leader', 'd0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000005', 'Guardian One', '0900000105'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000006', 'Guardian Two', '0900000106');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('d3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000007', 'd2000000-0000-4000-8000-000000000001', 'Maria', 'Trò A', 'female', '2016-01-01'),
  ('d3000000-0000-4000-8000-000000000002', null, 'd2000000-0000-4000-8000-000000000002', 'Anna', 'Trò B', 'female', '2016-02-02'),
  ('d3000000-0000-4000-8000-000000000003', null, 'd2000000-0000-4000-8000-000000000001', 'Teresa', 'Trò C', 'female', '2015-03-03'),
  ('d3000000-0000-4000-8000-000000000004', null, 'd2000000-0000-4000-8000-000000000001', 'Cecilia', 'Trò D', 'female', '2016-04-04');
insert into public.student_health_profiles (student_id, allergies) values
  ('d3000000-0000-4000-8000-000000000001', 'Bụi'),
  ('d3000000-0000-4000-8000-000000000003', 'Hải sản');
insert into public.enrollments (student_id, academic_year_id, class_id, status) values
  ('d3000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active'),
  ('d3000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active'),
  ('d3000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000002', 'active');

set local role authenticated;

-- Global secretary sees everything -------------------------------------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.students), 4, 'global reader sees all students');
select is((select count(*)::integer from public.student_health_profiles), 2, 'global reader sees all health');
select is((select count(*)::integer from public.enrollments), 3, 'global reader sees all enrollments');

-- Sector leader (Ấu) is bounded to Ấu ----------------------------------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select ok(app.can_access_student('d3000000-0000-4000-8000-000000000001'), 'Au sector leader accesses Au student');
select ok(not app.can_access_student('d3000000-0000-4000-8000-000000000003'), 'Au sector leader cannot access Thieu student');
select ok(app.can_view_student_sensitive('d3000000-0000-4000-8000-000000000001'), 'Au sector leader views Au health');
select ok(not app.can_view_student_sensitive('d3000000-0000-4000-8000-000000000003'), 'Au sector leader cannot view Thieu health');
select is((select count(*)::integer from public.students), 2, 'Au sector leader sees only Au students');
select ok(app.can_manage_class('d6000000-0000-4000-8000-000000000001'), 'Au sector leader manages Au class');
select ok(not app.can_manage_class('d6000000-0000-4000-8000-000000000002'), 'Au sector leader cannot manage Thieu class');

-- Class staff (Ấu 1A) is bounded to that class -------------------------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select ok(app.is_class_staff('d6000000-0000-4000-8000-000000000001'), 'assigned teacher is class staff');
select ok(app.can_access_student('d3000000-0000-4000-8000-000000000001'), 'class staff accesses own-class student A');
select ok(app.can_access_student('d3000000-0000-4000-8000-000000000002'), 'class staff accesses own-class student B');
select ok(not app.can_access_student('d3000000-0000-4000-8000-000000000003'), 'class staff cannot access other-sector student');
select is((select count(*)::integer from public.students), 2, 'class staff sees only own-class students');
select ok(app.can_view_student_sensitive('d3000000-0000-4000-8000-000000000001'), 'class staff views own-class health');
select is((select count(*)::integer from public.student_health_profiles), 1, 'class staff sees only own-class health');

-- A teacher of another class/sector cannot reach these students --------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000004', true);
select ok(not app.can_access_student('d3000000-0000-4000-8000-000000000001'), 'other-class teacher cannot access student A');
select is((select count(*)::integer from public.students), 1, 'Thieu teacher sees only own-class student');

-- Guardian ownership ---------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000005', true);
select is((select count(*)::integer from public.students), 3, 'guardian sees only own children');
select ok(not app.can_access_student('d3000000-0000-4000-8000-000000000002'), 'guardian cannot access another guardian child');
select is((select count(*)::integer from public.student_health_profiles), 0, 'guardian cannot read any health');
select is((select count(*)::integer from public.enrollments), 2, 'guardian sees only own children enrollments');
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, updated_by) values ('d3000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', 'd1000000-0000-4000-8000-000000000005')$$,
  '42501', null, 'guardian cannot enroll a student'
);

-- Same-class student isolation -----------------------------------------------
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000007', true);
select is((select count(*)::integer from public.students), 1, 'student sees only self');
select ok(not app.can_access_student('d3000000-0000-4000-8000-000000000002'), 'student cannot access same-class peer');
select is((select count(*)::integer from public.student_health_profiles), 0, 'student cannot read own health');
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, updated_by) values ('d3000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', 'd1000000-0000-4000-8000-000000000007')$$,
  '42501', null, 'student cannot enroll anyone'
);

select * from finish();
rollback;
