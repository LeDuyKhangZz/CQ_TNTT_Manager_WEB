begin;

select plan(18);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
(
  'e1100000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'integrity-55@test.local',
  crypt('x', gen_salt('bf')), now(), now(), now()
),
(
  'e1100000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'integrity-55-admin@test.local',
  crypt('x', gen_salt('bf')), now(), now(), now()
);

insert into public.profiles (id, username, display_name) values
  ('e1100000-0000-4000-8000-000000000001', 'INT_55', 'Thư ký integrity 55'),
  ('e1100000-0000-4000-8000-000000000002', 'INT_55_ADMIN', 'Admin integrity 55');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e1700000-0000-4000-8000-000000000001',
   'e1100000-0000-4000-8000-000000000001',
   'anh', 'Thư ký integrity 55', '0900005501'),
  ('e1700000-0000-4000-8000-000000000002',
   null, 'chi', 'GLV được phân công', '0900005502'),
  ('e1700000-0000-4000-8000-000000000003',
   null, 'anh', 'GLV ngoại lệ Super Admin', '0900005503');

insert into public.role_assignments (profile_id, role) values
  ('e1100000-0000-4000-8000-000000000001', 'secretary'),
  ('e1100000-0000-4000-8000-000000000002', 'super_admin');

insert into public.academic_years (
  id, code, name, start_date, end_date, status, retention_until
) values
  ('e1000000-0000-4000-8000-000000000001', '2090-2091', 'Năm mở integrity 55',
   '2090-09-01', '2091-05-31', 'current', '2096-05-31'),
  ('e1000000-0000-4000-8000-000000000002', '2089-2090', 'Năm đóng integrity 55',
   '2089-09-01', '2090-05-31', 'closed', '2095-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, display_name, status) values
  ('e1600000-0000-4000-8000-000000000001',
   'e1000000-0000-4000-8000-000000000001',
   '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 integrity mở', 'active'),
  ('e1600000-0000-4000-8000-000000000002',
   'e1000000-0000-4000-8000-000000000002',
   '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 integrity đóng', 'active');

insert into public.guardians (id, full_name, phone, status) values
  ('e1200000-0000-4000-8000-000000000001', 'Phụ huynh đang dùng', '0900005511', 'active'),
  ('e1200000-0000-4000-8000-000000000002', 'Phụ huynh đã ngưng', '0900005512', 'inactive');

insert into public.students (
  id, guardian_id, saint_name, full_name, gender, date_of_birth, updated_by
) values (
  'e1300000-0000-4000-8000-000000000001',
  'e1200000-0000-4000-8000-000000000001',
  'Maria', 'Em Integrity 55', 'female', '2015-05-05',
  'e1100000-0000-4000-8000-000000000001'
);

insert into public.enrollments (
  id, student_id, academic_year_id, class_id, status, updated_by
) values (
  'e1800000-0000-4000-8000-000000000001',
  'e1300000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000001',
  'e1600000-0000-4000-8000-000000000001', 'active',
  'e1100000-0000-4000-8000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1100000-0000-4000-8000-000000000001', true);

select ok(
  has_function_privilege(
    'authenticated',
    'app.set_student_status_internal(uuid,student_status,boolean,enrollment_status,date)',
    'execute'
  ),
  'internal invoker function retains EXECUTE only for the non-exposed public wrapper call'
);

select throws_ok(
  $$update public.students
       set guardian_id = 'e1200000-0000-4000-8000-000000000002',
           updated_by = auth.uid()
     where id = 'e1300000-0000-4000-8000-000000000001'$$,
  '23514', 'GUARDIAN_NOT_ACTIVE',
  'active student cannot be reassigned to an inactive guardian'
);

select is(
  (select guardian_id::text from public.students
    where id = 'e1300000-0000-4000-8000-000000000001'),
  'e1200000-0000-4000-8000-000000000001',
  'failed reassignment preserves the active guardian link'
);

select throws_ok(
  $$insert into public.students (
       guardian_id, saint_name, full_name, gender, date_of_birth, updated_by
     ) values (
       'e1200000-0000-4000-8000-000000000002',
       'Giuse', 'Em Gắn Sai Guardian', 'male', '2016-06-06', auth.uid()
     )$$,
  '23514', 'GUARDIAN_NOT_ACTIVE',
  'direct Data API insert cannot attach an active student to inactive guardian'
);

select throws_ok(
  $$select * from public.create_student_with_enrollment(
       p_guardian_id := 'e1200000-0000-4000-8000-000000000002',
       p_saint_name := 'Anna',
       p_full_name := 'Em RPC Sai Guardian',
       p_gender := 'female',
       p_date_of_birth := '2016-07-07'
     )$$,
  '23514', 'GUARDIAN_NOT_ACTIVE',
  'create-student RPC is protected by the same guardian invariant'
);

select throws_ok(
  $$update public.students
       set status = 'temporarily_inactive', updated_by = auth.uid()
     where id = 'e1300000-0000-4000-8000-000000000001'$$,
  '23514', 'STUDENT_STATUS_ENROLLMENT_MISMATCH',
  'direct status update cannot leave an active enrollment behind'
);

select is(
  (select student.status::text || ':' || enrollment.status::text
     from public.students as student
     join public.enrollments as enrollment on enrollment.student_id = student.id
    where student.id = 'e1300000-0000-4000-8000-000000000001'),
  'active:active',
  'failed direct status update leaves both axes unchanged'
);

select lives_ok(
  $$select * from public.set_student_status(
       'e1300000-0000-4000-8000-000000000001',
       'temporarily_inactive', false, 'withdrawn', null
     )$$,
  'D-130 atomic status RPC still succeeds'
);

select is(
  (select student.status::text || ':' || enrollment.status::text
     from public.students as student
     join public.enrollments as enrollment on enrollment.student_id = student.id
    where student.id = 'e1300000-0000-4000-8000-000000000001'),
  'temporarily_inactive:paused',
  'D-130 RPC changes student and enrollment together'
);

select throws_ok(
  $$update public.enrollments
       set status = 'active', ended_on = null, updated_by = auth.uid()
     where id = 'e1800000-0000-4000-8000-000000000001'$$,
  '23514', 'STUDENT_NOT_ACTIVE',
  'paused enrollment cannot be reactivated while its student is temporarily inactive'
);

select is(
  (select student.status::text || ':' || enrollment.status::text
     from public.students as student
     join public.enrollments as enrollment on enrollment.student_id = student.id
    where student.id = 'e1300000-0000-4000-8000-000000000001'),
  'temporarily_inactive:paused',
  'failed reciprocal update preserves both lifecycle axes'
);

select throws_ok(
  $$insert into public.class_staff_assignments (
       class_id, staff_profile_id, capacity, starts_on, updated_by
     ) values (
       'e1600000-0000-4000-8000-000000000002',
       'e1700000-0000-4000-8000-000000000002',
       'member', '2089-09-01', auth.uid()
     )$$,
  '23514', 'YEAR_NOT_WRITABLE',
  'active assignment cannot be inserted into a closed-year class'
);

select lives_ok(
  $$insert into public.class_staff_assignments (
       id, class_id, staff_profile_id, capacity, starts_on, updated_by
     ) values (
       'e1900000-0000-4000-8000-000000000001',
       'e1600000-0000-4000-8000-000000000001',
       'e1700000-0000-4000-8000-000000000002',
       'member', '2090-09-01', auth.uid()
     )$$,
  'active assignment in the current year remains valid'
);

select throws_ok(
  $$update public.class_staff_assignments
       set class_id = 'e1600000-0000-4000-8000-000000000002',
           updated_by = auth.uid()
     where id = 'e1900000-0000-4000-8000-000000000001'$$,
  '23514', 'YEAR_NOT_WRITABLE',
  'direct reassignment cannot move active staff into a closed year'
);

select throws_ok(
  $$select public.transfer_class_staff(
       'e1900000-0000-4000-8000-000000000001',
       'e1600000-0000-4000-8000-000000000002',
       'member', '2090-10-01'
     )$$,
  '23514', 'YEAR_NOT_WRITABLE',
  'atomic transfer RPC also rejects a closed-year target'
);

select is(
  (select class_id::text || ':' || is_active::text
     from public.class_staff_assignments
    where id = 'e1900000-0000-4000-8000-000000000001'),
  'e1600000-0000-4000-8000-000000000001:true',
  'failed transfer rolls back and preserves the original current assignment'
);

select set_config('request.jwt.claim.sub', 'e1100000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$insert into public.class_staff_assignments (
       class_id, staff_profile_id, capacity, starts_on, updated_by
     ) values (
       'e1600000-0000-4000-8000-000000000002',
       'e1700000-0000-4000-8000-000000000003',
       'member', '2089-09-01', auth.uid()
     )$$,
  'D-117: Super Admin may create an active closed-year assignment'
);

select is(
  (select count(*)::integer
     from public.class_staff_assignments
    where class_id = 'e1600000-0000-4000-8000-000000000002'
      and staff_profile_id = 'e1700000-0000-4000-8000-000000000003'
      and is_active),
  1,
  'Super Admin closed-year exception is persisted'
);

reset role;

select * from finish();
rollback;
