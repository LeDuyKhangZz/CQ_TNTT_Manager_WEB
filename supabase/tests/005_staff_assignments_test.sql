begin;

select plan(17);

select has_table('public', 'staff_profiles', 'staff profiles table exists');
select has_table('public', 'class_staff_assignments', 'class staff assignments table exists');
select has_index('public', 'class_staff_assignments', 'class_staff_one_active_class_per_staff_idx', 'one active class per staff index exists');
select has_index('public', 'class_staff_assignments', 'class_staff_one_active_representative_idx', 'one active representative per class index exists');
select has_function('public', 'end_class_staff_assignment', array['uuid', 'date'], 'atomic end-assignment RPC exists');
select enum_has_labels('public', 'staff_title', array['anh', 'chi', 'di', 'so', 'cha', 'thay', 'other'], 'titles include Di and So without roles');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('91000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader-staff@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('91000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-staff@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('91000000-0000-4000-8000-000000000001', 'LEADER_STAFF', 'Leader Staff'),
  ('91000000-0000-4000-8000-000000000002', 'GLV_TEST', 'Teacher Staff');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('60000000-0000-4000-8000-000000000001', '2030-2031', 'Năm học test', '2030-09-01', '2031-05-31', '2036-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000001', 'Chiên Test 1'),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000002', 'Chiên Test 2');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('62000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000001', 'anh', 'Leader Staff', '0900000005'),
  ('62000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'anh', 'Teacher One', '0900000001'),
  ('62000000-0000-4000-8000-000000000002', null, 'di', 'Representative One', '0900000002'),
  ('62000000-0000-4000-8000-000000000003', null, 'so', 'Other Class Staff', '0900000003'),
  ('62000000-0000-4000-8000-000000000004', null, 'chi', 'Representative Two', '0900000004');
select matches((select staff_code::text from public.staff_profiles where id = '62000000-0000-4000-8000-000000000001'), '^GLV[0-9]{3}$', 'staff code is generated safely');

insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('63000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000001', 'member', '2030-09-01'),
  ('63000000-0000-4000-8000-000000000002', '61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000002', 'representative', '2030-09-01'),
  ('63000000-0000-4000-8000-000000000003', '61000000-0000-4000-8000-000000000002', '62000000-0000-4000-8000-000000000003', 'member', '2030-09-01');

insert into public.role_assignments (profile_id, role) values
  ('91000000-0000-4000-8000-000000000001', 'group_leader');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('91000000-0000-4000-8000-000000000002', 'class_teacher', '60000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000001');

select throws_ok(
  $$insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values ('61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000003', 'member', '2030-10-01')$$,
  '23505', null, 'staff cannot have two active classes'
);
select throws_ok(
  $$insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values ('61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000004', 'representative', '2030-10-01')$$,
  '23505', null, 'class cannot have two active representatives'
);
select throws_ok(
  $$update public.class_staff_assignments set is_active = false, ends_on = '2030-10-01' where id = '63000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'assignment cannot end while its class role remains active'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.end_class_staff_assignment('63000000-0000-4000-8000-000000000002', '2030-10-01')$$,
  'global writer can end an unlinked assignment atomically'
);

reset role;
select lives_ok(
  $$insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values ('61000000-0000-4000-8000-000000000001', '62000000-0000-4000-8000-000000000004', 'representative', '2030-10-02')$$,
  'a new representative can start after the old assignment ends'
);
select is((select count(*)::integer from public.class_staff_assignments where class_id = '61000000-0000-4000-8000-000000000001' and capacity = 'representative'), 2, 'representative history is retained');

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);
select ok(app.is_class_staff('61000000-0000-4000-8000-000000000001'), 'linked teacher is recognized as class staff');
select is((select count(*)::integer from public.staff_profiles), 2, 'class teacher sees active staff in own class only');
select is((select count(*)::integer from public.class_staff_assignments), 3, 'class teacher sees own class assignment history');
select throws_ok(
  $$insert into public.staff_profiles (title, full_name, phone, updated_by) values ('anh', 'Forbidden', '0900999999', '91000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'class teacher cannot create staff'
);

select * from finish();
rollback;
