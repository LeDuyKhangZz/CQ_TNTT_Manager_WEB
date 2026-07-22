begin;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('97000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-unlinked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('97000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-linked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('97000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-unlinked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('97000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-linked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('97000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff-unlinked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('97000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff-linked@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('97000000-0000-4000-8000-000000000001', '84970000001', 'Guardian Unlinked'),
  ('97000000-0000-4000-8000-000000000002', '84970000002', 'Guardian Linked'),
  ('97000000-0000-4000-8000-000000000003', 'CQ9703', 'Student Unlinked'),
  ('97000000-0000-4000-8000-000000000004', 'CQ9704', 'Student Linked'),
  ('97000000-0000-4000-8000-000000000005', 'GLV9705', 'Staff Unlinked'),
  ('97000000-0000-4000-8000-000000000006', 'GLV9706', 'Staff Linked');

insert into public.staff_profiles (profile_id, staff_code, title, full_name, phone) values
  ('97000000-0000-4000-8000-000000000006', 'GLV9706', 'anh', 'Staff Linked', '0970000006');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000002', 'Guardian Linked', '0970000002'),
  ('97000000-0000-4000-8000-000000000011', null, 'Guardian For Students', '0970000011');

insert into public.students (id, profile_id, student_code, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('97000000-0000-4000-8000-000000000020', '97000000-0000-4000-8000-000000000004', 'CQ9704', '97000000-0000-4000-8000-000000000011', 'Anrê', 'Student Linked', 'male', '2015-01-01');

select throws_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000001', 'guardian')$$,
  '23514', null, 'active guardian role requires linked guardian profile'
);
select lives_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000002', 'guardian')$$,
  'linked guardian role is accepted'
);
select throws_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000003', 'student')$$,
  '23514', null, 'active student role requires linked student profile'
);
select lives_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000004', 'student')$$,
  'linked student role is accepted'
);
select throws_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000005', 'group_leader')$$,
  '23514', null, 'active GLV role requires linked staff profile'
);
select lives_ok(
  $$insert into public.role_assignments (profile_id, role) values ('97000000-0000-4000-8000-000000000006', 'group_leader')$$,
  'linked GLV role is accepted'
);
select has_trigger('public', 'role_assignments', 'role_assignments_validate_ownership_link', 'ownership link trigger exists');

select * from finish();
rollback;
