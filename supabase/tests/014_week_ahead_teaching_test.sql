begin;

-- P4-T2: projection tuần an toàn cho staff/guardian/student.
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-week@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-week@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-a-week@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-b-week@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-week@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'REP_WEEK', 'Đại diện tuần'),
  ('b1000000-0000-4000-8000-000000000002', 'OTH_WEEK', 'GLV lớp B'),
  ('b1000000-0000-4000-8000-000000000003', 'GUA_A_WEEK', 'Phụ huynh A'),
  ('b1000000-0000-4000-8000-000000000004', 'GUA_B_WEEK', 'Phụ huynh B'),
  ('b1000000-0000-4000-8000-000000000005', 'STU_WEEK', 'Thiếu nhi A');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('b0000000-0000-4000-8000-000000000001', '2074-2075', 'Năm lịch tuần', '2074-09-01', '2075-05-31', 'draft', '2080-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Week'),
  ('b6000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Week');
insert into public.staff_profiles (id, profile_id, title, saint_name, full_name, phone) values
  ('b7000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'anh', 'Phêrô', 'Đại diện tuần', '0923000001'),
  ('b7000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'chi', null, 'GLV lớp B', '0923000002');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('b6000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'representative', '2074-09-01'),
  ('b6000000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000002', 'member', '2074-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'Phụ huynh A', '0923000003'),
  ('b2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', 'Phụ huynh B', '0923000004');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('b3000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000003', 'Maria', 'Trò A', 'female', '2016-01-01'),
  ('b3000000-0000-4000-8000-000000000002', null, 'b2000000-0000-4000-8000-000000000004', 'Anna', 'Trò B', 'female', '2015-01-01');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2074-09-01'),
  ('b3000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000002', 'active', '2074-09-01');
insert into public.role_assignments (profile_id, role) values
  ('b1000000-0000-4000-8000-000000000003', 'guardian'),
  ('b1000000-0000-4000-8000-000000000004', 'guardian'),
  ('b1000000-0000-4000-8000-000000000005', 'student');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('b1000000-0000-4000-8000-000000000001', 'class_representative', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002', 'class_teacher', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000002');

-- Setup nghiệp vụ bằng owner để bài test chỉ tập trung vào projection/RLS.
insert into public.teaching_plans (id, class_id, academic_year_id, title) values
  ('bb000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Giáo án A'),
  ('bb000000-0000-4000-8000-000000000002', 'b6000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Giáo án B');
insert into public.teaching_plan_items
  (id, teaching_plan_id, planned_date, title, objectives, catechism_content, preparation, teacher_staff_id, item_type, note) values
  ('bc000000-0000-4000-8000-000000000001', 'bb000000-0000-4000-8000-000000000001', '2074-09-02', 'Bài A', 'MỤC TIÊU BÍ MẬT', 'NỘI DUNG BÍ MẬT', 'Mang Kinh Thánh', 'b7000000-0000-4000-8000-000000000001', 'lesson', 'GHI CHÚ BÍ MẬT'),
  ('bc000000-0000-4000-8000-000000000002', 'bb000000-0000-4000-8000-000000000001', '2074-09-07', 'Khảo sát đầu năm', null, null, 'Ôn bài cũ', null, 'assessment', null),
  ('bc000000-0000-4000-8000-000000000003', 'bb000000-0000-4000-8000-000000000001', '2074-09-08', 'Ngoài 7 ngày', null, null, null, 'b7000000-0000-4000-8000-000000000001', 'lesson', null),
  ('bc000000-0000-4000-8000-000000000004', 'bb000000-0000-4000-8000-000000000002', '2074-09-03', 'Bài B', null, null, 'Bút màu', 'b7000000-0000-4000-8000-000000000002', 'lesson', null);

set local role authenticated;

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.get_week_ahead_teaching_items('2074-09-01', 7)), 2, 'phụ huynh A thấy đúng hai mục trong 7 ngày của lớp con');
select is((select count(*)::integer from public.teaching_plan_items), 0, 'phụ huynh không đọc bảng mục giáo án gốc');
select is((select title from public.get_week_ahead_teaching_items('2074-09-01', 7) where item_type = 'lesson'), 'Bài A', 'projection có tên bài');
select is((select preparation from public.get_week_ahead_teaching_items('2074-09-01', 7) where item_type = 'lesson'), 'Mang Kinh Thánh', 'projection có phần chuẩn bị');
select is((select teacher_name from public.get_week_ahead_teaching_items('2074-09-01', 7) where item_type = 'lesson'), 'Phêrô Đại diện tuần', 'projection có người dạy');
select is((select item_type::text from public.get_week_ahead_teaching_items('2074-09-01', 7) where planned_date = '2074-09-07'), 'assessment', 'projection có nhãn kiểm tra');
select is(
  (select array_agg(key order by key)::text
   from (select * from public.get_week_ahead_teaching_items('2074-09-01', 7) limit 1) as safe_row
   cross join lateral jsonb_object_keys(to_jsonb(safe_row)) as key),
  '{class_id,class_name,item_id,item_type,planned_date,preparation,teacher_name,title}',
  'projection chỉ có đúng tám trường an toàn'
);
select is((select count(*)::integer from public.get_week_ahead_teaching_items('2074-09-02', 6)), 2, 'khoảng ngày gồm đầu vào và loại trừ đúng cận cuối');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.get_week_ahead_teaching_items('2074-09-01', 7)), 1, 'phụ huynh B chỉ thấy lớp của con B');
select is((select class_name from public.get_week_ahead_teaching_items('2074-09-01', 7)), 'Thiếu 1A Week', 'không rò tên lớp A sang phụ huynh B');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000005', true);
select is((select count(*)::integer from public.get_week_ahead_teaching_items('2074-09-01', 7)), 2, 'thiếu nhi xem được lịch an toàn của chính lớp mình');
select is((select count(*)::integer from public.teaching_plans), 0, 'thiếu nhi không đọc bảng kế hoạch gốc');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.get_week_ahead_teaching_items('2074-09-01', 7)), 2, 'staff chỉ thấy lịch tuần trong phạm vi lớp mình');
select throws_ok(
  $$select * from public.get_week_ahead_teaching_items('2074-09-01', 0)$$,
  '22023', 'INVALID_WEEK_RANGE', 'không nhận khoảng 0 ngày'
);
select throws_ok(
  $$select * from public.get_week_ahead_teaching_items('2074-09-01', 32)$$,
  '22023', 'INVALID_WEEK_RANGE', 'không nhận khoảng quá 31 ngày'
);

select * from finish();
rollback;
