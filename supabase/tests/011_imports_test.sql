begin;

select plan(26);

select has_table('public', 'import_batches', 'import_batches table exists');
select has_table('public', 'import_rows', 'import_rows table exists');
select has_function('public', 'commit_import_rows', array['uuid', 'uuid[]'], 'commit RPC exists');

-- Fixtures (superuser bypasses RLS) ------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('e1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-im@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-im@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-im@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('e1000000-0000-4000-8000-000000000001', 'SEC_IM', 'Thư ký Import'),
  ('e1000000-0000-4000-8000-000000000002', 'TEACHER_IM', 'GLV Import'),
  ('e1000000-0000-4000-8000-000000000003', 'GUARDIAN_IM', 'Phụ huynh Import');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e7000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'anh', 'Thư ký Import', '0900000201'),
  ('e7000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'anh', 'GLV Import', '0900000202');

-- secretary has global write (D-18); class teacher does not.
insert into public.role_assignments (profile_id, role) values
  ('e1000000-0000-4000-8000-000000000001', 'secretary');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('e0000000-0000-4000-8000-000000000001', '2060-2061', 'Năm import', '2060-09-01', '2061-05-31', 'current', '2066-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 IM');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000002', 'member', '2060-09-01');

-- An existing guardian so the commit can prove phone-based reuse (docs/09 §7).
insert into public.guardians (id, profile_id, full_name, phone) values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'Phụ huynh Có Sẵn', '0912345678');

insert into public.import_batches (id, filename, academic_year_id, uploaded_by, total_rows, valid_rows) values
  ('e4000000-0000-4000-8000-000000000001', 'Thieu_1A.xlsx', 'e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 4, 4);

insert into public.import_rows (id, batch_id, row_number, raw_json, normalized_json, status, action) values
  -- New student + brand new guardian.
  ('e5000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000001', 1,
   '{}'::jsonb,
   jsonb_build_object(
     'full_name', 'Trần Ngọc Bảo', 'saint_name', 'Giuse', 'gender', 'male',
     'date_of_birth', '2015-04-05', 'guardian_name', 'Trần Văn Cha',
     'guardian_phone', '0987654321', 'guardian_address', '1 Trần Bình Trọng',
     'class_id', 'e6000000-0000-4000-8000-000000000001',
     'sacraments', jsonb_build_array(jsonb_build_object('type', 'baptism', 'date', '2015-06-01', 'place', 'Giáo xứ Chợ Quán'))
   ),
   'valid', 'create'),
  -- New student whose guardian phone already exists -> must reuse, not duplicate.
  ('e5000000-0000-4000-8000-000000000002', 'e4000000-0000-4000-8000-000000000001', 2,
   '{}'::jsonb,
   jsonb_build_object(
     'full_name', 'Trần Ngọc Mai', 'saint_name', 'Maria', 'gender', 'female',
     'date_of_birth', '2016-08-09', 'guardian_name', 'Phụ huynh Có Sẵn',
     'guardian_phone', '0912345678',
     'class_id', 'e6000000-0000-4000-8000-000000000001'
   ),
   'warning', 'create'),
  -- Reviewer chose to skip this row.
  ('e5000000-0000-4000-8000-000000000003', 'e4000000-0000-4000-8000-000000000001', 3,
   '{}'::jsonb,
   jsonb_build_object(
     'full_name', 'Bỏ Qua', 'saint_name', 'Anna', 'gender', 'female',
     'date_of_birth', '2016-01-01', 'guardian_phone', '0900000999',
     'class_id', 'e6000000-0000-4000-8000-000000000001'
   ),
   'valid', 'skip'),
  -- Bad row: class not resolved -> must fail alone without killing the chunk.
  ('e5000000-0000-4000-8000-000000000004', 'e4000000-0000-4000-8000-000000000001', 4,
   '{}'::jsonb,
   jsonb_build_object(
     'full_name', 'Thiếu Lớp', 'saint_name', 'Phêrô', 'gender', 'male',
     'date_of_birth', '2016-02-02', 'guardian_phone', '0900000998'
   ),
   'valid', 'create');

-- Non-authorized roles cannot see or import ----------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.import_batches), 0, 'class teacher cannot see import batches');
select is((select count(*)::integer from public.import_rows), 0, 'class teacher cannot see import rows');
select throws_ok(
  $$select * from public.commit_import_rows('e4000000-0000-4000-8000-000000000001', array['e5000000-0000-4000-8000-000000000001']::uuid[])$$,
  '42501', null, 'class teacher cannot commit an import batch'
);

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.import_batches), 0, 'guardian cannot see import batches');
select throws_ok(
  $$insert into public.import_batches (filename, academic_year_id, uploaded_by) values ('x.xlsx', 'e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'guardian cannot create an import batch'
);

-- Global-write role drives the real commit -----------------------------------
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.import_batches), 1, 'secretary sees the batch');
select is((select count(*)::integer from public.import_rows), 4, 'secretary sees all rows');

-- Dry-run state must not have touched business tables yet.
select is((select count(*)::integer from public.students), 0, 'dry-run created no students');
select is((select count(*)::integer from public.enrollments), 0, 'dry-run created no enrollments');

create temporary table commit_result as
select * from public.commit_import_rows(
  'e4000000-0000-4000-8000-000000000001',
  array[
    'e5000000-0000-4000-8000-000000000001',
    'e5000000-0000-4000-8000-000000000002',
    'e5000000-0000-4000-8000-000000000003',
    'e5000000-0000-4000-8000-000000000004'
  ]::uuid[]
);

select is((select count(*)::integer from commit_result where out_committed), 2, 'two rows committed');
select is(
  (select count(*)::integer from commit_result where not out_committed and out_error_message is not null),
  1, 'the unresolved-class row reports its own error'
);
select is((select count(*)::integer from public.students), 2, 'commit created exactly two students');
select is((select count(*)::integer from public.enrollments), 2, 'commit created two enrollments');

-- Guardian reuse by phone: only one new guardian, not two.
select is((select count(*)::integer from public.guardians), 2, 'guardian reused by phone, only one new guardian');
select is(
  (select count(*)::integer from public.students where guardian_id = 'e2000000-0000-4000-8000-000000000001'),
  1, 'second student attached to the pre-existing guardian'
);

-- Student codes are unique and sequence-generated.
select is(
  (select count(distinct student_code)::integer from public.students), 2,
  'student codes are unique'
);
select ok(
  (select bool_and(student_code::text ~ '^CQ[0-9]{4,}$') from public.students),
  'student codes follow the CQxxxx format'
);

-- Row bookkeeping.
select is(
  (select status::text from public.import_rows where row_number = 3),
  'skipped', 'skipped row is recorded as skipped'
);
select is((select count(*)::integer from public.students where full_name = 'Bỏ Qua'), 0, 'skipped row created no student');
select is(
  (select status::text from public.import_rows where row_number = 4),
  'error', 'failed row is marked error'
);
select ok(
  (select commit_error is not null from public.import_rows where row_number = 4),
  'failed row keeps its commit error message'
);
select is(
  (select status::text from public.import_batches where id = 'e4000000-0000-4000-8000-000000000001'),
  'partially_committed', 'batch is partially committed while a row still failed'
);

-- Re-committing an already committed row must not double-create.
select * from public.commit_import_rows(
  'e4000000-0000-4000-8000-000000000001',
  array['e5000000-0000-4000-8000-000000000001']::uuid[]
);
select is((select count(*)::integer from public.students), 2, 'recommit does not duplicate students');

reset role;

select * from finish();
rollback;
