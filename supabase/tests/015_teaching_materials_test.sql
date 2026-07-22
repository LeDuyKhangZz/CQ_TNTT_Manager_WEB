begin;

-- P4-T3: bucket private và policy tài liệu theo phạm vi lớp.
select plan(16);

select is((select public from storage.buckets where id = 'teaching-materials'), false, 'bucket tài liệu là private');
select is((select file_size_limit from storage.buckets where id = 'teaching-materials'), 5242880::bigint, 'bucket giới hạn đúng 5 MB');
select ok((select 'application/pdf' = any (allowed_mime_types) from storage.buckets where id = 'teaching-materials'), 'bucket nhận PDF trong allowlist');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-mat@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-mat@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-mat@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-mat@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-mat@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000001', 'REP_MAT', 'Đại diện tài liệu'),
  ('c1000000-0000-4000-8000-000000000002', 'MEM_MAT', 'GLV tài liệu'),
  ('c1000000-0000-4000-8000-000000000003', 'OTH_MAT', 'GLV lớp khác'),
  ('c1000000-0000-4000-8000-000000000004', 'GUA_MAT', 'Phụ huynh tài liệu'),
  ('c1000000-0000-4000-8000-000000000005', 'STU_MAT', 'Thiếu nhi tài liệu');
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('c0000000-0000-4000-8000-000000000001', '2076-2077', 'Năm tài liệu', '2076-09-01', '2077-05-31', 'draft', '2082-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Material'),
  ('c6000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Material');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c7000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện tài liệu', '0924000001'),
  ('c7000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'chi', 'GLV tài liệu', '0924000002'),
  ('c7000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'anh', 'GLV lớp khác', '0924000003');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', 'representative', '2076-09-01'),
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000002', 'member', '2076-09-01'),
  ('c6000000-0000-4000-8000-000000000002', 'c7000000-0000-4000-8000-000000000003', 'member', '2076-09-01');
insert into public.guardians (id, profile_id, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', 'Phụ huynh tài liệu', '0924000004');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c3000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000005', 'c2000000-0000-4000-8000-000000000004', 'Maria', 'Thiếu nhi tài liệu', 'female', '2016-01-01');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('c3000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active', '2076-09-01');
insert into public.role_assignments (profile_id, role) values
  ('c1000000-0000-4000-8000-000000000004', 'guardian'),
  ('c1000000-0000-4000-8000-000000000005', 'student');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('c1000000-0000-4000-8000-000000000001', 'class_representative', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000002', 'class_teacher', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000003', 'class_teacher', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000002');

insert into public.teaching_plans (id, class_id, academic_year_id, title) values
  ('cb000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Giáo án tài liệu');
insert into public.teaching_plan_items
  (id, teaching_plan_id, planned_date, title, teacher_staff_id, item_type,
   material_path, material_name, material_mime_type, material_size) values
  ('cc000000-0000-4000-8000-000000000001', 'cb000000-0000-4000-8000-000000000001', '2076-09-07', 'Bài có tài liệu',
   'c7000000-0000-4000-8000-000000000001', 'lesson',
   'c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/fixture.pdf',
   'fixture.pdf', 'application/pdf', 12);

select throws_ok(
  $$update public.teaching_plan_items set material_name = null where id = 'cc000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'metadata tài liệu không được ghi dở dang'
);
select ok(not app.can_manage_teaching_material('not/a/uuid'), 'đường dẫn sai định dạng bị từ chối an toàn');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
select ok(app.can_manage_teaching_material('c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/fixture.pdf'), 'đại diện quản lý đường dẫn thuộc mục lớp mình');
select ok(app.can_read_teaching_material('c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/orphan.pdf'), 'manager đọc được object vừa tách metadata để Storage API dọn vật lý');
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('teaching-materials',
      'c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/fixture.pdf',
      'c1000000-0000-4000-8000-000000000001')$$,
  'đại diện ghi object đúng cấu trúc'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('teaching-materials', 'invalid/path/file.pdf', 'c1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'đường dẫn không gắn với lớp/mục hợp lệ bị chặn'
);

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'teaching-materials'), 1, 'GLV cùng lớp đọc được metadata object');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('teaching-materials',
      'c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/member.pdf',
      'c1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'GLV thành viên không tải object lên'
);

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'teaching-materials'), 0, 'GLV lớp khác không đọc object');
select ok(not app.can_manage_teaching_material('c6000000-0000-4000-8000-000000000001/cc000000-0000-4000-8000-000000000001/fixture.pdf'), 'GLV lớp khác không vượt được predicate ghi/xóa');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'teaching-materials'), 0, 'phụ huynh không đọc object');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000005', true);
select is((select count(*)::integer from storage.objects where bucket_id = 'teaching-materials'), 0, 'thiếu nhi không đọc object');

select is(
  (select count(*)::integer from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname = 'teaching_materials_delete_manager' and cmd = 'DELETE'),
  1, 'bucket có đúng policy xóa giới hạn theo manager; xóa vật lý phải đi qua Storage API'
);

select * from finish();
rollback;
