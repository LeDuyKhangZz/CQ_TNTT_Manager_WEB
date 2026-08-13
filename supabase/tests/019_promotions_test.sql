begin;

-- P5-T5: representative proposal, sector approval, valid next-year targets and
-- an atomic enrollment transition. Warning snapshots are advisory only.
select plan(36);

select has_table('public', 'promotion_reviews', 'promotion review table exists');
select has_function('public', 'propose_promotion', array['uuid', 'promotion_status', 'uuid', 'boolean', 'text'], 'proposal RPC exists');
select has_function('public', 'approve_promotion_review', array['uuid', 'text', 'uuid', 'text'], 'approval RPC exists');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('e1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-promo@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-promo@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-promo@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wrong-sector-promo@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-promo@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('e1000000-0000-4000-8000-000000000001', 'REP_PROMO', 'Đại diện chuyển lớp'),
  ('e1000000-0000-4000-8000-000000000002', 'TEA_PROMO', 'Giáo lý viên chuyển lớp'),
  ('e1000000-0000-4000-8000-000000000003', 'SEC_PROMO', 'Trưởng ngành Ấu'),
  ('e1000000-0000-4000-8000-000000000004', 'WRONG_PROMO', 'Trưởng ngành Thiếu'),
  ('e1000000-0000-4000-8000-000000000005', 'ADMIN_PROMO', 'Quản trị chuyển lớp');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('e0000000-0000-4000-8000-000000000001', '2080-2081', 'Năm nguồn chuyển lớp', '2080-09-01', '2081-05-31', 'draft', '2086-05-31'),
  ('e0000000-0000-4000-8000-000000000002', '2081-2082', 'Năm đích chuyển lớp', '2081-09-01', '2082-05-31', 'draft', '2087-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A nguồn'),
  ('e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'catechism', 'full_year', 'Ấu 2A đích'),
  ('e6000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'B', 'catechism', 'full_year', 'Ấu 2B đích'),
  ('e6000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A học lại'),
  ('e6000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A sai cấp'),
  ('e6000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000014', null, 'catechism', 'full_year', 'Hiệp 2 nguồn'),
  ('e6000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002', null, null, 'trainee', 'semester_1', 'Dự trưởng đích');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e7000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện chuyển lớp', '0960000001'),
  ('e7000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'chi', 'Giáo lý viên chuyển lớp', '0960000002'),
  ('e7000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003', 'anh', 'Trưởng ngành Ấu', '0960000003'),
  ('e7000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004', 'anh', 'Trưởng ngành Thiếu', '0960000004');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000001', 'representative', '2080-09-01'),
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000002', 'member', '2080-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('e1000000-0000-4000-8000-000000000001', 'class_representative', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000002', 'class_teacher', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('e1000000-0000-4000-8000-000000000003', 'sector_leader', 'e0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-4000-8000-000000000004', 'sector_leader', 'e0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000003');
insert into public.role_assignments (profile_id, role) values
  ('e1000000-0000-4000-8000-000000000005', 'super_admin');

insert into public.guardians (id, full_name, phone) values
  ('e2000000-0000-4000-8000-000000000001', 'Phụ huynh chuyển lớp', '0960000099');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('e3000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Maria', 'Lên Lớp A', 'female', '2015-01-01'),
  ('e3000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Anna', 'Học Lại', 'female', '2015-02-02'),
  ('e3000000-0000-4000-8000-000000000003', 'e2000000-0000-4000-8000-000000000001', 'Gioan', 'Tạm Nghỉ', 'male', '2015-03-03'),
  ('e3000000-0000-4000-8000-000000000004', 'e2000000-0000-4000-8000-000000000001', 'Phêrô', 'Rút Học', 'male', '2015-04-04'),
  ('e3000000-0000-4000-8000-000000000005', 'e2000000-0000-4000-8000-000000000001', 'Phaolô', 'Kiểm Tra Lỗi', 'male', '2015-05-05'),
  ('e3000000-0000-4000-8000-000000000006', 'e2000000-0000-4000-8000-000000000001', 'Têrêsa', 'Dự Trưởng', 'female', '2010-06-06');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('e4000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('e4000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('e4000000-0000-4000-8000-000000000003', 'e3000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('e4000000-0000-4000-8000-000000000004', 'e3000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('e4000000-0000-4000-8000-000000000005', 'e3000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('e4000000-0000-4000-8000-000000000006', 'e3000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000006', 'active', '2080-09-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select throws_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000001', 'recommended_promote', 'e6000000-0000-4000-8000-000000000002', false, null)$$, '42501', 'FORBIDDEN', 'giáo lý viên không được đề xuất');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select throws_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000005', 'recommended_promote', 'e6000000-0000-4000-8000-000000000005', false, null)$$, '23514', 'PROMOTION_TARGET_INVALID', 'không được nhảy sai cấp');
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000001', 'recommended_promote', 'e6000000-0000-4000-8000-000000000003', false, 'Chuyển nhánh B')$$, 'đại diện chọn được nhánh A/B hợp lệ');
select ok((select warning_snapshot ? 'weightedAverage' from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 'đề xuất lưu snapshot cảnh báo');
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000002', 'recommended_repeat', 'e6000000-0000-4000-8000-000000000004', false, null)$$, 'đề xuất học lại đúng cấp');
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000003', 'temporarily_pause', null, false, null)$$, 'đề xuất tạm nghỉ không cần lớp đích');
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000004', 'withdraw', null, false, null)$$, 'đề xuất rút học không cần lớp đích');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000004', true);
select throws_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 'approve', null, null)$$, 'P0002', 'PROMOTION_REVIEW_NOT_FOUND', 'trưởng ngành khác không thấy và không được duyệt');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 'approve', null, 'Cảnh báo chỉ tham khảo')$$, 'trưởng ngành duyệt dù snapshot có cảnh báo/null');
select is((select status from public.enrollments where id = 'e4000000-0000-4000-8000-000000000001'), 'completed'::public.enrollment_status, 'lên lớp đóng ghi danh nguồn');
select is((select class_id from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 'e6000000-0000-4000-8000-000000000003'::uuid, 'lên lớp tạo đúng ghi danh đích nhánh B');
select is((select count(*)::integer from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 1, 'chỉ tạo một ghi danh đích');
select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 'approve', null, null)$$, 'duyệt lặp lại là idempotent');
select is((select count(*)::integer from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000001'), 1, 'duyệt lặp không nhân đôi ghi danh');

select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000002'), 'approve', null, null)$$, 'duyệt học lại');
select is((select status from public.enrollments where id = 'e4000000-0000-4000-8000-000000000002'), 'repeating'::public.enrollment_status, 'nguồn học lại có trạng thái repeating');
select is((select class_id from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000002'), 'e6000000-0000-4000-8000-000000000004'::uuid, 'học lại tạo ghi danh cùng cấp năm sau');
select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000003'), 'approve', null, null)$$, 'duyệt tạm nghỉ');
select is((select status from public.enrollments where id = 'e4000000-0000-4000-8000-000000000003'), 'paused'::public.enrollment_status, 'tạm nghỉ giữ ghi danh nguồn ở paused');
select is((select count(*)::integer from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000003'), 0, 'tạm nghỉ không tạo ghi danh mới');
select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000004'), 'approve', null, null)$$, 'duyệt rút học');
select is((select status from public.enrollments where id = 'e4000000-0000-4000-8000-000000000004'), 'withdrawn'::public.enrollment_status, 'rút học đóng nguồn');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000005', 'recommended_promote', 'e6000000-0000-4000-8000-000000000002', false, null)$$, 'tạo đề xuất để kiểm tra rollback nguyên tử');
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
select throws_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000005'), 'approve', 'e6000000-0000-4000-8000-000000000005', null)$$, '23514', 'PROMOTION_TARGET_INVALID', 'đích override sai làm toàn giao dịch thất bại');
select is((select status from public.enrollments where id = 'e4000000-0000-4000-8000-000000000005'), 'active'::public.enrollment_status, 'lỗi duyệt giữ nguyên ghi danh nguồn');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000005', true);
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000006', 'recommended_promote', null, true, 'Đề xuất Dự trưởng')$$, 'Hiệp 2 được đề xuất Dự trưởng không cần chọn lớp');
select lives_ok($$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000006'), 'approve', null, null)$$, 'quyền toàn cục duyệt Dự trưởng');
select is((select class_id from public.enrollments where previous_enrollment_id = 'e4000000-0000-4000-8000-000000000006'), 'e6000000-0000-4000-8000-000000000007'::uuid, 'Dự trưởng được tự tìm ở năm sau');
select is((select count(*)::integer from public.profiles where id = 'e3000000-0000-4000-8000-000000000006'), 0, 'chuyển Dự trưởng không tự tạo tài khoản/role');

-- ===========================================================================
-- M08-A · KIỂM CHÉO BÀN GIAO TỪ M07-B.
--
-- `07_IMPLEMENTATION_IMPACT` của M07 §8 gọi đây là **cảnh báo, không phải tùy
-- chọn**: từ M07-B một cột điểm **ẩn được**, và ẩn một cột là **đổi con số
-- trung bình có trọng số**. Ba module tiêu thụ số ấy (M08 · M11 · M13) phải
-- được kiểm chéo; M08 là module đầu tiên tới lượt.
--
-- Đọc code cho thấy khung nhìn `v_student_weighted_average` đã có
-- `and assessment.is_active` ngay trong mệnh đề `join` từ Phase 5. Nhưng **một
-- điều đúng khi đọc không phải một điều đã được đo** — và đây đúng loại bất
-- biến âm thầm hỏng: nếu mai kia ai đó viết lại khung nhìn mà quên vế ấy, thì
-- bảng điểm hiện một con số còn đề xuất chuyển lớp chụp một con số khác, không
-- màn hình nào báo sai, và người duyệt quyết định dựa trên số cũ.
--
-- Hai cột cùng hệ số 1, điểm 10 và 4 ⇒ trung bình 7. Ẩn cột 4 điểm ⇒ 10.
-- ===========================================================================
reset role;
insert into public.assessments (id, class_id, academic_year_id, kind, title, weight, max_score, created_by) values
  ('e8000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Cột giữ lại', 1, 10, 'e1000000-0000-4000-8000-000000000001'),
  ('e8000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Cột sẽ bị ẩn', 1, 10, 'e1000000-0000-4000-8000-000000000001');
insert into public.assessment_scores (assessment_id, enrollment_id, class_id, academic_year_id, student_id, score) values
  ('e8000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000005', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000005', 10),
  ('e8000000-0000-4000-8000-000000000002', 'e4000000-0000-4000-8000-000000000005', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000005', 4);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000005', 'recommended_promote', 'e6000000-0000-4000-8000-000000000002', false, null)$$, 'đề xuất lại khi lớp đã có hai cột điểm');
select is((select (warning_snapshot ->> 'weightedAverage')::numeric from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000005'), 7.00::numeric, 'trung bình chụp lại tính trên CẢ HAI cột đang hiện');

reset role;
update public.assessments set is_active = false where id = 'e8000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.propose_promotion('e4000000-0000-4000-8000-000000000005', 'recommended_promote', 'e6000000-0000-4000-8000-000000000002', false, null)$$, 'đề xuất lại sau khi ẩn một cột');
select is((select (warning_snapshot ->> 'weightedAverage')::numeric from public.promotion_reviews where source_enrollment_id = 'e4000000-0000-4000-8000-000000000005'), 10.00::numeric, 'ẩn cột (M07-B/BR-M07-28) loại luôn cột ấy khỏi trung bình mà chuyển lớp đọc');

select * from finish();
rollback;
