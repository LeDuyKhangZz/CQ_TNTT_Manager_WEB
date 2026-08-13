begin;

-- P5-T2: two attendance proposals, teacher override and public/internal notes.
select plan(22);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-result@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-result@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-result@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian2-result@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000001', 'REP_RESULT', 'Đại diện kết quả'),
  ('c1000000-0000-4000-8000-000000000002', 'GUA_RESULT', 'Phụ huynh Một'),
  ('c1000000-0000-4000-8000-000000000003', 'STU_RESULT', 'Thiếu nhi Một'),
  ('c1000000-0000-4000-8000-000000000004', 'GUA2_RESULT', 'Phụ huynh Hai');
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('c0000000-0000-4000-8000-000000000001', '2070-2071', 'Năm chuyên cần', '2070-09-01', '2071-05-31', 'draft', '2076-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Result');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c7000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện kết quả', '0940000001');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('c8000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', 'representative', '2070-09-01');
insert into public.guardians (id, profile_id, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'Phụ huynh Một', '0940000002'),
  ('c2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000004', 'Phụ huynh Hai', '0940000004');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c3000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Một', 'female', '2016-01-01'),
  ('c3000000-0000-4000-8000-000000000002', null, 'c2000000-0000-4000-8000-000000000002', 'Anna', 'Trò Hai', 'female', '2016-02-02');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('c4000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active', '2070-09-01'),
  ('c4000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active', '2070-09-01');
insert into public.role_assignments (profile_id, role) values
  ('c1000000-0000-4000-8000-000000000002', 'guardian'),
  ('c1000000-0000-4000-8000-000000000003', 'student'),
  ('c1000000-0000-4000-8000-000000000004', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('c1000000-0000-4000-8000-000000000001', 'class_representative', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001');

insert into public.attendance_sessions
  (id, class_id, academic_year_id, attendance_date, meeting_type, status, finalized_at, finalized_by, locked_at)
values
  ('c9000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday', 'completed', now(), 'c1000000-0000-4000-8000-000000000001', now() + interval '3 days');
insert into public.student_attendance_records
  (attendance_session_id, enrollment_id, class_id, student_id, mass_status, catechism_status)
values
  ('c9000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'present', 'unexcused_absence'),
  ('c9000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000002', 'c6000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000002', 'present', 'present');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
insert into public.assessments
  (id, class_id, academic_year_id, kind, title, weight, attendance_component, created_by, updated_by)
values
  ('ca000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần Lễ', 1, 'mass', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001'),
  ('ca000000-0000-4000-8000-000000000002', 'c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần Giáo lý', 1, 'catechism', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001');

-- M07-B · TB-M07-04 — hàm nay trả **hai** số `(out_refreshed, out_skipped_manual)`
-- thay cho một `integer`, nên ba lời gọi dưới đây phải đọc theo cột.
select is(
  (select out_refreshed from public.refresh_attendance_assessment_scores('ca000000-0000-4000-8000-000000000001')),
  2, 'lấy đề xuất Lễ cho đủ roster'
);
select is(
  (select out_refreshed from public.refresh_attendance_assessment_scores('ca000000-0000-4000-8000-000000000002')),
  2, 'lấy đề xuất Giáo lý cho đủ roster'
);
select is((select score from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 10.00::numeric, 'đề xuất Lễ tính riêng là 10');
select is((select score from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000002' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 0.00::numeric, 'đề xuất Giáo lý tính riêng là 0');
select ok(not (select is_manual_override from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 'điểm hệ thống ban đầu chưa phải override');
select is(public.save_assessment_scores('ca000000-0000-4000-8000-000000000001', '[{"enrollmentId":"c4000000-0000-4000-8000-000000000001","score":7}]'::jsonb), 1, 'GLV chỉnh tay điểm chuyên cần');
select ok((select is_manual_override from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 'đánh dấu override sau chỉnh tay');
-- 🔴 M07-B · TB-M07-04 / AC-04-01 — và đây là chỗ con số cũ **nói sai**: nó đếm
-- gộp cả dòng bị bỏ qua, nên màn hình báo *"Đã cập nhật 2 đề xuất"* trong khi
-- đúng **một** dòng đổi và một dòng bị giữ nguyên vì đang chỉnh tay. Người dùng
-- mở bảng ra thấy không khớp và không có gì giải thích.
select results_eq(
  $$select out_refreshed, out_skipped_manual
    from public.refresh_attendance_assessment_scores('ca000000-0000-4000-8000-000000000001')$$,
  $$values (1, 1)$$,
  'TB-M07-04: 1 ô cập nhật · 1 ô đang chỉnh tay được giữ nguyên, hai số tách nhau'
);
select is((select score from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 7.00::numeric, 'refresh giữ nguyên điểm override');
select lives_ok($$select public.reset_attendance_score_override('ca000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001')$$, 'GLV dùng lại đề xuất hệ thống');
select is((select score from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 10.00::numeric, 'reset khôi phục đúng đề xuất');
select ok(not (select is_manual_override from public.assessment_scores where assessment_id = 'ca000000-0000-4000-8000-000000000001' and enrollment_id = 'c4000000-0000-4000-8000-000000000001'), 'reset xóa cờ override');

select lives_ok(
  $$insert into public.student_comments (id, enrollment_id, class_id, academic_year_id, student_id, visibility, content, author_profile_id, updated_by)
    values ('cb000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'student_visible', 'Con tiến bộ tốt', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001')$$,
  'GLV thêm nhận xét công khai'
);
select lives_ok(
  $$insert into public.student_comments (id, enrollment_id, class_id, academic_year_id, student_id, visibility, content, author_profile_id, updated_by)
    values ('cb000000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'staff_only', 'Cần trao đổi riêng', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001')$$,
  'GLV thêm ghi chú nội bộ'
);
select is((select class_id from public.student_comments limit 1), 'c6000000-0000-4000-8000-000000000001'::uuid, 'scope comment suy ra từ enrollment');
select is((select author_profile_id from public.student_comments limit 1), 'c1000000-0000-4000-8000-000000000001'::uuid, 'tác giả comment suy ra từ JWT');
select is((select count(*)::integer from public.student_comments), 2, 'nhân sự lớp thấy cả public và internal');

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select results_eq($$select content from public.student_comments$$, $$values ('Con tiến bộ tốt'::text)$$, 'phụ huynh chỉ thấy nhận xét công khai của con');
select is((select count(*)::integer from public.student_comments where visibility = 'staff_only'), 0, 'phụ huynh không suy ra dòng staff-only');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select results_eq($$select content from public.student_comments$$, $$values ('Con tiến bộ tốt'::text)$$, 'thiếu nhi chỉ thấy nhận xét công khai của mình');
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.student_comments), 0, 'phụ huynh khác không thấy nhận xét của nhà bên');
select throws_ok(
  $$insert into public.student_comments (enrollment_id, class_id, academic_year_id, student_id, visibility, content, author_profile_id, updated_by)
    values ('c4000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'student_visible', 'Tự nhận xét', 'c1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004')$$,
  '42501', null, 'phụ huynh không tự ghi nhận xét'
);

select * from finish();
rollback;
