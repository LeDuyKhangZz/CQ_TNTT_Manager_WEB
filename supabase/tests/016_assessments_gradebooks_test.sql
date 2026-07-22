begin;

-- P5-T1/P5-T3 foundation: dynamic columns, nullable scores, weighted average,
-- class isolation and lock enforcement under real JWT identities.
select plan(32);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-grade@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'REP_GRADE', 'Đại diện bảng điểm'),
  ('b1000000-0000-4000-8000-000000000002', 'TEA_GRADE', 'GLV bảng điểm'),
  ('b1000000-0000-4000-8000-000000000003', 'OTH_GRADE', 'GLV lớp khác'),
  ('b1000000-0000-4000-8000-000000000004', 'GUA_GRADE', 'Phụ huynh bảng điểm'),
  ('b1000000-0000-4000-8000-000000000005', 'STU_GRADE', 'Thiếu nhi bảng điểm'),
  ('b1000000-0000-4000-8000-000000000006', 'SA_GRADE', 'SA bảng điểm');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('b0000000-0000-4000-8000-000000000001', '2073-2074', 'Năm bảng điểm', '2073-09-01', '2074-05-31', 'draft', '2079-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Grade'),
  ('b6000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Grade');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('b7000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện bảng điểm', '0930000001'),
  ('b7000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'chi', 'GLV bảng điểm', '0930000002'),
  ('b7000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'anh', 'GLV lớp khác', '0930000003');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('b6000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'representative', '2073-09-01'),
  ('b6000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000002', 'member', '2073-09-01'),
  ('b6000000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000003', 'member', '2073-09-01');
insert into public.guardians (id, profile_id, full_name, phone) values
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', 'Phụ huynh bảng điểm', '0930000004');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('b3000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Điểm Một', 'female', '2016-01-01'),
  ('b3000000-0000-4000-8000-000000000002', null, 'b2000000-0000-4000-8000-000000000001', 'Anna', 'Trò Điểm Hai', 'female', '2016-02-02');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('b4000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2073-09-01'),
  ('b4000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2073-09-01');
insert into public.role_assignments (profile_id, role) values
  ('b1000000-0000-4000-8000-000000000004', 'guardian'),
  ('b1000000-0000-4000-8000-000000000005', 'student'),
  ('b1000000-0000-4000-8000-000000000006', 'super_admin');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('b1000000-0000-4000-8000-000000000001', 'class_representative', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002', 'class_teacher', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000003', 'class_teacher', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000002');

select is((select count(*)::integer from public.assessment_type_settings where academic_year_id = 'b0000000-0000-4000-8000-000000000001'), 5, 'năm học tự seed đủ năm loại điểm');
select is((select default_weight from public.assessment_type_settings where academic_year_id = 'b0000000-0000-4000-8000-000000000001' and kind = 'final'), 3.00::numeric, 'cuối kỳ mặc định hệ số 3');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.assessments (id, class_id, academic_year_id, kind, title, assessment_date, weight, created_by, updated_by)
    values ('ba000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'midterm', 'Giữa kỳ', '2073-12-01', 2, 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')$$,
  'đại diện tạo cột giữa kỳ mà không cần cột 15 phút'
);
select lives_ok(
  $$insert into public.assessments (id, class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('ba000000-0000-4000-8000-000000000002', 'b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'final', 'Cuối kỳ', 3, 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')$$,
  'lớp chỉ có giữa kỳ và cuối kỳ là hợp lệ'
);
select lives_ok(
  $$insert into public.assessments (id, class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('ba000000-0000-4000-8000-000000000003', 'b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'midterm', 'Giữa kỳ lần 2', 1.5, 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')$$,
  'được tạo nhiều cột cùng loại'
);
select throws_ok(
  $$insert into public.assessments (class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'custom', 'Hệ số sai', 0, 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'hệ số 0 bị DB chặn'
);
select throws_ok(
  $$insert into public.assessments (class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'attendance', 'Thiếu thành phần', 1, 'b1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'cột chuyên cần phải tách Lễ hoặc Giáo lý'
);
select is(public.save_assessment_scores('ba000000-0000-4000-8000-000000000001', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000001","score":0},{"enrollmentId":"b4000000-0000-4000-8000-000000000002","score":null}]'::jsonb), 2, 'RPC lưu batch đủ hai dòng');
select is((select score from public.assessment_scores where enrollment_id = 'b4000000-0000-4000-8000-000000000001'), 0.00::numeric, 'điểm 0 được giữ là điểm thật');
select is((select score from public.assessment_scores where enrollment_id = 'b4000000-0000-4000-8000-000000000002'), null::numeric, 'ô trống được giữ null, không biến thành 0');
select throws_ok(
  $$select public.save_assessment_scores('ba000000-0000-4000-8000-000000000001', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000001","score":10.01}]'::jsonb)$$,
  '23514', 'SCORE_OUT_OF_RANGE', 'điểm lớn hơn 10 bị chặn'
);
select is(public.save_assessment_scores('ba000000-0000-4000-8000-000000000002', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000001","score":10}]'::jsonb), 1, 'lưu được điểm cuối kỳ');
select is((select weighted_average from public.v_student_weighted_average where enrollment_id = 'b4000000-0000-4000-8000-000000000001'), 6.00::numeric, 'trung bình có trọng số tính đúng (0x2 + 10x3) / 5');
select lives_ok($$update public.assessments set weight = 1, updated_by = 'b1000000-0000-4000-8000-000000000001' where id = 'ba000000-0000-4000-8000-000000000001'$$, 'đổi hệ số trước khóa được phép');
select is((select weighted_average from public.v_student_weighted_average where enrollment_id = 'b4000000-0000-4000-8000-000000000001'), 7.50::numeric, 'đổi hệ số cập nhật trung bình ngay');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.assessments), 3, 'GLV lớp đọc đủ cột động');
select is(public.save_assessment_scores('ba000000-0000-4000-8000-000000000001', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000002","score":8}]'::jsonb), 1, 'GLV lớp nhập điểm được');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.assessments), 0, 'GLV lớp khác không đọc cột điểm');
select throws_ok(
  $$select public.save_assessment_scores('ba000000-0000-4000-8000-000000000001', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000001","score":9}]'::jsonb)$$,
  '42501', 'FORBIDDEN', 'GLV lớp khác không ghi điểm'
);

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.assessments), 0, 'phụ huynh chưa thấy assessment chưa công bố');
select is((select count(*)::integer from public.assessment_scores), 0, 'phụ huynh chưa thấy điểm chưa công bố');

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select lives_ok($$update public.assessments set is_published = true, updated_by = 'b1000000-0000-4000-8000-000000000001' where id = 'ba000000-0000-4000-8000-000000000001'$$, 'đại diện công bố một cột điểm');
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.assessments), 1, 'phụ huynh chỉ thấy cột đã công bố của lớp con');
select is((select count(*)::integer from public.assessment_scores), 2, 'phụ huynh thấy điểm công bố của các con mình, không thấy cột nội bộ');
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000005', true);
select results_eq(
  $$select student_id from public.assessment_scores$$,
  $$values ('b3000000-0000-4000-8000-000000000001'::uuid)$$,
  'thiếu nhi chỉ thấy điểm đã công bố của chính mình'
);

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.lock_gradebook('b6000000-0000-4000-8000-000000000001')$$, 'đại diện khóa bảng điểm');
select throws_ok(
  $$select public.save_assessment_scores('ba000000-0000-4000-8000-000000000001', '[{"enrollmentId":"b4000000-0000-4000-8000-000000000001","score":9}]'::jsonb)$$,
  '42501', 'GRADEBOOK_LOCKED', 'khóa chặn RPC nhập điểm'
);
select lives_ok(
  $$update public.assessments
    set weight = 4, updated_by = 'b1000000-0000-4000-8000-000000000001'
    where id = 'ba000000-0000-4000-8000-000000000001'$$,
  'lệnh direct update không lộ lỗi policy ra client'
);
select is(
  (select weight from public.assessments where id = 'ba000000-0000-4000-8000-000000000001'),
  1.00::numeric, 'RLS khóa giữ nguyên hệ số'
);
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select throws_ok($$select public.unlock_gradebook('b6000000-0000-4000-8000-000000000001')$$, '42501', 'FORBIDDEN', 'GLV không mở khóa được');
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000006', true);
select lives_ok($$select public.unlock_gradebook('b6000000-0000-4000-8000-000000000001')$$, 'chỉ Super Admin mở khóa được');
select ok(not app.is_gradebook_locked('b6000000-0000-4000-8000-000000000001'), 'trạng thái đã mở khóa');

select * from finish();
rollback;
