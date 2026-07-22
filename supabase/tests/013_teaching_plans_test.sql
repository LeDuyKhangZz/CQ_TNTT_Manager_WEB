begin;

-- P4-T1: kế hoạch giảng dạy cả năm, phân công đúng đội ngũ lớp và RLS.
-- Mọi nhánh quyền đều chạy dưới JWT thật, không dùng service role.
select plan(27);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'secretary-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('a1000000-0000-4000-8000-000000000001', 'REP_PLAN', 'Đại diện lớp'),
  ('a1000000-0000-4000-8000-000000000002', 'MEM_PLAN', 'GLV lớp'),
  ('a1000000-0000-4000-8000-000000000003', 'OTH_PLAN', 'GLV lớp khác'),
  ('a1000000-0000-4000-8000-000000000004', 'SEC_PLAN', 'Trưởng ngành Ấu'),
  ('a1000000-0000-4000-8000-000000000005', 'GUA_PLAN', 'Phụ huynh'),
  ('a1000000-0000-4000-8000-000000000006', 'STU_PLAN', 'Thiếu nhi'),
  ('a1000000-0000-4000-8000-000000000007', 'SCR_PLAN', 'Thư ký');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('a0000000-0000-4000-8000-000000000001', '2072-2073', 'Năm giáo án', '2072-09-01', '2073-05-31', 'draft', '2078-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('a6000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Plan'),
  ('a6000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Plan');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('a7000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện lớp', '0922000001'),
  ('a7000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'chi', 'GLV lớp', '0922000002'),
  ('a7000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', 'anh', 'GLV lớp khác', '0922000003'),
  ('a7000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004', 'chi', 'Trưởng ngành Ấu', '0922000004'),
  ('a7000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000007', 'anh', 'Thư ký', '0922000007');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('a6000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'representative', '2072-09-01'),
  ('a6000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002', 'member', '2072-09-01'),
  ('a6000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000003', 'member', '2072-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', 'Phụ huynh', '0922000005');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('a3000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000006', 'a2000000-0000-4000-8000-000000000005', 'Maria', 'Thiếu nhi', 'female', '2016-01-01');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('a3000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 'active', '2072-09-01');

insert into public.role_assignments (profile_id, role) values
  ('a1000000-0000-4000-8000-000000000005', 'guardian'),
  ('a1000000-0000-4000-8000-000000000006', 'student'),
  ('a1000000-0000-4000-8000-000000000007', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('a1000000-0000-4000-8000-000000000001', 'class_representative', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000002', 'class_teacher', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000003', 'class_teacher', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000002');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('a1000000-0000-4000-8000-000000000004', 'sector_leader', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');

set local role authenticated;

-- Đại diện chỉ quản lý đúng lớp của mình.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select ok(app.can_manage_teaching_plan('a6000000-0000-4000-8000-000000000001'), 'đại diện quản lý giáo án lớp mình');
select ok(not app.can_manage_teaching_plan('a6000000-0000-4000-8000-000000000002'), 'đại diện không quản lý giáo án lớp khác');
select lives_ok(
  $$insert into public.teaching_plans (id, class_id, academic_year_id, title)
    values ('ab000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001',
            '00000000-0000-0000-0000-000000000000', 'Giáo án Ấu 1A')$$,
  'đại diện tạo giáo án lớp mình'
);
select is(
  (select academic_year_id from public.teaching_plans where id = 'ab000000-0000-4000-8000-000000000001'),
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'năm học được suy ra từ lớp, không tin dữ liệu client'
);
select is(
  (select created_by_staff_id from public.teaching_plans where id = 'ab000000-0000-4000-8000-000000000001'),
  'a7000000-0000-4000-8000-000000000001'::uuid,
  'người tạo được suy ra từ JWT'
);
select throws_ok(
  $$insert into public.teaching_plans (class_id, academic_year_id, title)
    values ('a6000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Trùng')$$,
  '23505', null, 'mỗi lớp chỉ có một giáo án'
);
select lives_ok(
  $$insert into public.teaching_plan_items
      (id, teaching_plan_id, planned_date, title, teacher_staff_id, item_type, objectives)
    values ('ac000000-0000-4000-8000-000000000001', 'ab000000-0000-4000-8000-000000000001',
            '2072-09-07', 'Bài mở đầu', 'a7000000-0000-4000-8000-000000000002', 'lesson', 'Mục tiêu nội bộ')$$,
  'đại diện thêm bài và phân công GLV cùng lớp'
);
select lives_ok(
  $$insert into public.teaching_plan_items
      (id, teaching_plan_id, planned_date, title, teacher_staff_id, item_type, preparation)
    values ('ac000000-0000-4000-8000-000000000002', 'ab000000-0000-4000-8000-000000000001',
            '2072-09-14', 'Kiểm tra đầu kỳ', null, 'assessment', 'Ôn bài 1')$$,
  'mục kiểm tra được phép chưa phân công người dạy'
);
select throws_ok(
  $$insert into public.teaching_plan_items
      (teaching_plan_id, planned_date, title, teacher_staff_id, item_type)
    values ('ab000000-0000-4000-8000-000000000001', '2072-08-31', 'Ngoài năm',
            'a7000000-0000-4000-8000-000000000001', 'lesson')$$,
  '23514', 'TEACHING_PLAN_DATE_OUTSIDE_YEAR', 'ngày ngoài năm học bị chặn'
);
select throws_ok(
  $$insert into public.teaching_plan_items
      (teaching_plan_id, planned_date, title, teacher_staff_id, item_type)
    values ('ab000000-0000-4000-8000-000000000001', '2072-09-21', 'Sai người dạy',
            'a7000000-0000-4000-8000-000000000003', 'lesson')$$,
  '23514', 'TEACHING_PLAN_TEACHER_OUT_OF_CLASS', 'không phân công GLV lớp khác'
);
select throws_ok(
  $$insert into public.teaching_plan_items
      (teaching_plan_id, planned_date, title, teacher_staff_id, item_type)
    values ('ab000000-0000-4000-8000-000000000001', '2072-09-07', 'Trùng ngày',
            'a7000000-0000-4000-8000-000000000001', 'lesson')$$,
  '23505', null, 'mỗi ngày chỉ có một mục giáo án'
);
select is((select count(*)::integer from public.teaching_plans), 1, 'đại diện chỉ đọc giáo án lớp mình');

-- GLV lớp xem đầy đủ nhưng không được sửa.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.teaching_plans), 1, 'GLV lớp đọc được giáo án lớp');
select is((select count(*)::integer from public.teaching_plan_items), 2, 'GLV lớp đọc được đầy đủ các mục');
select throws_ok(
  $$insert into public.teaching_plan_items
      (teaching_plan_id, planned_date, title, teacher_staff_id, item_type)
    values ('ab000000-0000-4000-8000-000000000001', '2072-09-21', 'Không được ghi',
            'a7000000-0000-4000-8000-000000000002', 'lesson')$$,
  '42501', null, 'GLV thành viên không được ghi giáo án'
);

-- Trưởng ngành được xem trong ngành nhưng không sở hữu quyền sửa giáo án.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.teaching_plans), 1, 'trưởng ngành đọc được giáo án trong ngành');
update public.teaching_plans
set title = 'Trưởng ngành sửa'
where id = 'ab000000-0000-4000-8000-000000000001';
select is(
  (select title from public.teaching_plans where id = 'ab000000-0000-4000-8000-000000000001'),
  'Giáo án Ấu 1A', 'trưởng ngành không được sửa giáo án'
);

-- Người lớp khác, phụ huynh và thiếu nhi không đọc bảng gốc.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.teaching_plans), 0, 'GLV lớp khác không thấy giáo án');
select is((select count(*)::integer from public.teaching_plan_items), 0, 'GLV lớp khác không thấy mục giáo án');
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000005', true);
select is((select count(*)::integer from public.teaching_plans), 0, 'phụ huynh không đọc bảng giáo án gốc');
select is((select count(*)::integer from public.teaching_plan_items), 0, 'phụ huynh không đọc nội dung hạn chế');
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000006', true);
select is((select count(*)::integer from public.teaching_plan_items), 0, 'thiếu nhi không đọc bảng giáo án gốc');

-- Nhóm ghi toàn cục có thể quản trị mọi lớp; đại diện vẫn sửa/xóa lớp mình.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000007', true);
select lives_ok(
  $$insert into public.teaching_plans (id, class_id, academic_year_id, title)
    values ('ab000000-0000-4000-8000-000000000002', 'a6000000-0000-4000-8000-000000000002',
            'a0000000-0000-4000-8000-000000000001', 'Giáo án Thiếu 1A')$$,
  'thư ký ghi toàn cục tạo giáo án lớp khác'
);
select lives_ok(
  $$update public.teaching_plan_items set title = 'Bài mở đầu đã sửa'
    where id = 'ac000000-0000-4000-8000-000000000001'$$,
  'nhóm ghi toàn cục sửa được mục giáo án'
);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$update public.teaching_plans set title = 'Giáo án Ấu 1A mới'
    where id = 'ab000000-0000-4000-8000-000000000001'$$,
  'đại diện sửa được tên giáo án lớp mình'
);
select lives_ok(
  $$delete from public.teaching_plan_items where id = 'ac000000-0000-4000-8000-000000000002'$$,
  'đại diện xóa được mục giáo án lớp mình'
);
select is((select count(*)::integer from public.teaching_plan_items), 1, 'sau khi xóa còn đúng một mục trong lớp');

select * from finish();
rollback;
