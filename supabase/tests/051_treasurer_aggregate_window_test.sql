begin;

-- ============================================================================
-- M11-B — Báo cáo & Dashboard, đợt 2/3.
--
-- D-170 Thủ quỹ đọc được SỐ GỘP THEO LỚP bằng một CỬA SỔ HẸP (trả nốt nửa còn
--       nợ của D-67, `11` §6 — thay đổi phân quyền thứ 2/6, hướng NỚI).
-- D-172 Bản chốt trùng: cho chốt, nhưng phải nêu bản đã có — ngày và NGƯỜI.
--
-- 🔴 Bộ kiểm này đo **hai vế**, và vế thứ hai mới là vế quan trọng:
--    (1) cửa sổ có MỞ đúng thứ đã duyệt không;
--    (2) ranh giới cũ có NHÚC NHÍCH không — Thủ quỹ đọc thẳng `students`,
--        `student_attendance_records`, `assessment_scores` và hai RPC báo cáo
--        gốc vẫn phải ra **0 dòng**, và vẫn không chốt được ở cả ba phạm vi.
--    Một bộ kiểm chỉ đo vế (1) sẽ xanh trọn vẹn trên một bản nới quá tay.
--
-- Chạy bằng JWT thật của từng vai (CLAUDE.md §4), không service role.
-- ============================================================================

select plan(48);

select has_function('app', 'can_read_aggregate', array[]::text[],
  'D-170: "đọc được số gộp" nay có một cái tên riêng, không còn núp trong can_global_read');
select has_function('public', 'report_attendance_rows_for_treasurer', array['uuid', 'date', 'date'],
  'cửa sổ hẹp cho bảng chuyên cần');
select has_function('public', 'report_results_rows_for_treasurer', array['uuid'],
  'cửa sổ hẹp cho bảng kết quả');
select has_function('public', 'dashboard_summary_for_treasurer', array['uuid'],
  'cửa sổ hẹp cho bốn ô số trang tổng quan');
select has_function('public', 'find_report_snapshot_duplicate',
  array['text', 'text', 'date', 'date', 'uuid'],
  'D-172: tra bản chốt trùng, kèm tên người chốt');

-- ── Dàn cảnh ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d2100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-admin@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-priest@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-treasurer@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-sector-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-sector-thieu@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-rep-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d2100000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tw-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('d2100000-0000-4000-8000-000000000001', 'TW_ADMIN', 'Quản trị cửa sổ'),
  ('d2100000-0000-4000-8000-000000000002', 'TW_PRIEST', 'Cha sở cửa sổ'),
  ('d2100000-0000-4000-8000-000000000004', 'TW_SEC', 'Thư ký Maria Nguyễn'),
  ('d2100000-0000-4000-8000-000000000005', 'TW_TREASURER', 'Thủ quỹ cửa sổ'),
  ('d2100000-0000-4000-8000-000000000006', 'TW_SECTOR_AU', 'Trưởng ngành Ấu'),
  ('d2100000-0000-4000-8000-000000000007', 'TW_SECTOR_TH', 'Trưởng ngành Thiếu'),
  ('d2100000-0000-4000-8000-000000000008', 'TW_REP_AU', 'Đại diện Ấu 1A'),
  ('d2100000-0000-4000-8000-000000000009', '84991200009', 'Phụ huynh cửa sổ');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('d2200000-0000-4000-8000-000000000001', '2098-2099', 'Năm cửa sổ hẹp', '2098-09-01', '2099-05-31', 'draft', '2104-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('d2300000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A cửa sổ'),
  ('d2300000-0000-4000-8000-000000000002', 'd2200000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A cửa sổ');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d2400000-0000-4000-8000-000000000004', 'd2100000-0000-4000-8000-000000000004', 'chi', 'Thư ký Maria Nguyễn', '0911200004'),
  ('d2400000-0000-4000-8000-000000000005', 'd2100000-0000-4000-8000-000000000005', 'chi', 'Thủ quỹ cửa sổ', '0911200005'),
  ('d2400000-0000-4000-8000-000000000006', 'd2100000-0000-4000-8000-000000000006', 'anh', 'Trưởng ngành Ấu', '0911200006'),
  ('d2400000-0000-4000-8000-000000000007', 'd2100000-0000-4000-8000-000000000007', 'anh', 'Trưởng ngành Thiếu', '0911200007'),
  ('d2400000-0000-4000-8000-000000000008', 'd2100000-0000-4000-8000-000000000008', 'anh', 'Đại diện Ấu 1A', '0911200008');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('d2300000-0000-4000-8000-000000000001', 'd2400000-0000-4000-8000-000000000008', 'representative', '2098-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('d2500000-0000-4000-8000-000000000009', 'd2100000-0000-4000-8000-000000000009', 'Phụ huynh cửa sổ', '0930012009');

insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth, patron_feast_date, address) values
  ('d2600000-0000-4000-8000-000000000001', 'd2500000-0000-4000-8000-000000000009', 'Maria', 'Em Ấu Một', 'female', '2018-01-01', '2018-08-15', '2 Trần Bình Trọng'),
  ('d2600000-0000-4000-8000-000000000002', 'd2500000-0000-4000-8000-000000000009', 'Anna', 'Em Ấu Hai', 'female', '2018-02-02', '2018-07-26', '2 Trần Bình Trọng'),
  ('d2600000-0000-4000-8000-000000000003', 'd2500000-0000-4000-8000-000000000009', 'Gioan', 'Em Thiếu Một', 'male', '2015-03-03', '2015-06-24', '2 Trần Bình Trọng');

insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('d2700000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'active', '2098-09-01'),
  ('d2700000-0000-4000-8000-000000000002', 'd2600000-0000-4000-8000-000000000002', 'd2200000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'active', '2098-09-01'),
  ('d2700000-0000-4000-8000-000000000003', 'd2600000-0000-4000-8000-000000000003', 'd2200000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000002', 'active', '2098-09-01');

insert into public.role_assignments (profile_id, role) values
  ('d2100000-0000-4000-8000-000000000001', 'super_admin'),
  ('d2100000-0000-4000-8000-000000000002', 'parish_priest'),
  ('d2100000-0000-4000-8000-000000000004', 'secretary'),
  ('d2100000-0000-4000-8000-000000000005', 'treasurer'),
  ('d2100000-0000-4000-8000-000000000009', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('d2100000-0000-4000-8000-000000000006', 'sector_leader', 'd2200000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('d2100000-0000-4000-8000-000000000007', 'sector_leader', 'd2200000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000003');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('d2100000-0000-4000-8000-000000000008', 'class_representative', 'd2200000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001');

-- Một buổi ĐÃ CHỐT cho mỗi lớp — `report_attendance_rows` chỉ đếm buổi đã chốt.
insert into public.attendance_sessions (id, class_id, academic_year_id, attendance_date, meeting_type, status, finalized_at, finalized_by) values
  ('d2800000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', '2098-09-07', 'sunday', 'completed', now(), 'd2100000-0000-4000-8000-000000000008'),
  ('d2800000-0000-4000-8000-000000000002', 'd2300000-0000-4000-8000-000000000002', 'd2200000-0000-4000-8000-000000000001', '2098-09-07', 'sunday', 'completed', now(), 'd2100000-0000-4000-8000-000000000004');

insert into public.student_attendance_records (attendance_session_id, enrollment_id, class_id, student_id, session_finalized_at, mass_status, catechism_status) values
  ('d2800000-0000-4000-8000-000000000001', 'd2700000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000001', now(), 'present', 'present'),
  ('d2800000-0000-4000-8000-000000000001', 'd2700000-0000-4000-8000-000000000002', 'd2300000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000002', now(), 'unexcused_absence', 'present'),
  ('d2800000-0000-4000-8000-000000000002', 'd2700000-0000-4000-8000-000000000003', 'd2300000-0000-4000-8000-000000000002', 'd2600000-0000-4000-8000-000000000003', now(), 'present', 'present');

insert into public.assessments (id, class_id, academic_year_id, kind, title, assessment_date, max_score, weight, created_by) values
  ('d2900000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', 'quiz_15m', 'Kiểm tra 15 phút', '2098-09-11', 10, 1, 'd2100000-0000-4000-8000-000000000008'),
  ('d2900000-0000-4000-8000-000000000002', 'd2300000-0000-4000-8000-000000000002', 'd2200000-0000-4000-8000-000000000001', 'quiz_15m', 'Kiểm tra 15 phút', '2098-09-11', 10, 1, 'd2100000-0000-4000-8000-000000000004');

insert into public.assessment_scores (assessment_id, enrollment_id, class_id, academic_year_id, student_id, score) values
  ('d2900000-0000-4000-8000-000000000001', 'd2700000-0000-4000-8000-000000000001', 'd2300000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000001', 9),
  ('d2900000-0000-4000-8000-000000000001', 'd2700000-0000-4000-8000-000000000002', 'd2300000-0000-4000-8000-000000000001', 'd2200000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000002', 4),
  ('d2900000-0000-4000-8000-000000000002', 'd2700000-0000-4000-8000-000000000003', 'd2300000-0000-4000-8000-000000000002', 'd2200000-0000-4000-8000-000000000001', 'd2600000-0000-4000-8000-000000000003', 8);

set local role authenticated;

-- Ba bản chốt do Thư ký tạo, trong đó HAI bản trùng nhau (cùng loại · cùng phạm
-- vi · cùng khoảng ngày) — nguyên liệu cho D-172.
--
-- 🔴 Phải chèn bằng JWT thật của Thư ký chứ không chèn thẳng bằng `postgres`:
-- trigger `report_snapshots_seal` ghi đè `generated_by := auth.uid()`, nên chèn
-- không có JWT sẽ vi phạm NOT NULL. Đây cũng là điều đang muốn đo — người chốt
-- do máy chủ đặt, không nhận từ client (AC-A04).
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000004', true);
insert into public.report_snapshots (id, report_type, title, academic_year_id, scope_type, scope_id, period_type, period_start, period_end, filter_json, payload_json, checksum, generated_by) values
  ('d2a00000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần toàn xứ đoàn — bản 1', 'd2200000-0000-4000-8000-000000000001', 'global', null, 'year', '2098-09-01', '2099-05-31', '{}'::jsonb, '{"headers":["Lớp"],"rows":[["Ấu 1A cửa sổ"]]}'::jsonb, 'x', 'd2100000-0000-4000-8000-000000000004'),
  ('d2a00000-0000-4000-8000-000000000002', 'attendance', 'Chuyên cần toàn xứ đoàn — bản 2', 'd2200000-0000-4000-8000-000000000001', 'global', null, 'year', '2098-09-01', '2099-05-31', '{}'::jsonb, '{"headers":["Lớp"],"rows":[["Ấu 1A cửa sổ"]]}'::jsonb, 'y', 'd2100000-0000-4000-8000-000000000004'),
  ('d2a00000-0000-4000-8000-000000000003', 'attendance', 'Chuyên cần lớp Ấu 1A', 'd2200000-0000-4000-8000-000000000001', 'class', 'd2300000-0000-4000-8000-000000000001', 'month', '2098-09-01', '2098-09-30', '{}'::jsonb, '{"headers":["Lớp"],"rows":[["Ấu 1A cửa sổ"]]}'::jsonb, 'z', 'd2100000-0000-4000-8000-000000000004');

-- `now()` là **thời điểm bắt đầu giao dịch**, nên ba bản trên có cùng
-- `generated_at` tới từng micro-giây và "bản mới nhất" sẽ là một câu vô nghĩa.
-- Tách chúng ra bằng quyền chủ sở hữu, sau khi trigger đã chạy xong.
reset role;
update public.report_snapshots set generated_at = '2098-10-01 09:00+07'
  where id = 'd2a00000-0000-4000-8000-000000000001';
update public.report_snapshots set generated_at = '2098-10-02 15:30+07'
  where id = 'd2a00000-0000-4000-8000-000000000002';
update public.report_snapshots set generated_at = '2098-10-03 08:00+07'
  where id = 'd2a00000-0000-4000-8000-000000000003';

set local role authenticated;

-- ---------------------------------------------------------------------------
-- D-170 vế (1) — cửa sổ MỞ đúng thứ đã duyệt: số gộp theo lớp.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000005', true);

select is(
  (select count(*)::integer from public.report_attendance_rows_for_treasurer(
    'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')),
  2, 'Thủ quỹ nay đọc được bảng chuyên cần gộp theo lớp — 2 lớp');

select is(
  (select student_count from public.report_attendance_rows_for_treasurer(
     'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')
   where class_name = 'Ấu 1A cửa sổ'),
  2, 'và con số là SỐ THẬT (2 em có điểm danh ở Ấu 1A), không phải một khung rỗng');

select is(
  (select mass_absent_count from public.report_attendance_rows_for_treasurer(
     'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')
   where class_name = 'Ấu 1A cửa sổ'),
  1, 'lượt vắng lễ cũng là số thật — 1 em vắng');

select is(
  (select count(*)::integer from public.report_results_rows_for_treasurer(
    'd2200000-0000-4000-8000-000000000001')),
  2, 'Thủ quỹ đọc được bảng kết quả gộp theo lớp — 2 lớp');

select is(
  (select class_average from public.report_results_rows_for_treasurer(
     'd2200000-0000-4000-8000-000000000001')
   where class_name = 'Ấu 1A cửa sổ'),
  6.50::numeric, 'trung bình lớp là số thật ((9+4)/2 = 6,50)');

select is(
  (select below_five_count from public.report_results_rows_for_treasurer(
     'd2200000-0000-4000-8000-000000000001')
   where class_name = 'Ấu 1A cửa sổ'),
  1, 'số em dưới 5 là số thật — và đây là số GỘP, không phải điểm của em nào');

-- ---------------------------------------------------------------------------
-- 🔴 D-170 vế (2) — RANH GIỚI CŨ KHÔNG NHÚC NHÍCH.
--
-- Đây là phần bộ kiểm dễ quên nhất và cũng là phần duy nhất phân biệt được
-- "mở một ô cửa" với "mở toang cánh cửa": nếu một bản cài đặt lười thêm
-- `treasurer` vào `app.can_global_read()` thì SÁU bài trên vẫn xanh y hệt, còn
-- SÁU bài dưới đây sẽ đỏ hết.
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::integer from public.report_attendance_rows(
    'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')),
  0, '🔴 Thủ quỹ gọi THẲNG RPC chuyên cần gốc vẫn 0 dòng — cửa sổ không nới RLS');

select is(
  (select count(*)::integer from public.report_results_rows(
    'd2200000-0000-4000-8000-000000000001')),
  0, '🔴 Thủ quỹ gọi THẲNG RPC kết quả gốc vẫn 0 dòng');

select is(
  (select count(*)::integer from public.students
   where id = 'd2600000-0000-4000-8000-000000000001'),
  0, '🔴 Thủ quỹ đọc thẳng `students` vẫn 0 dòng — bài canh hiện trạng của D-129 giữ nguyên');

select is(
  (select count(*)::integer from public.student_attendance_records),
  0, '🔴 Thủ quỹ đọc thẳng bảng điểm danh từng em vẫn 0 dòng');

select is(
  (select count(*)::integer from public.assessment_scores),
  0, '🔴 Thủ quỹ đọc thẳng bảng điểm từng em vẫn 0 dòng');

select ok(not app.can_global_read(),
  '🔴 và `app.can_global_read()` vẫn KHÔNG có Thủ quỹ — cửa sổ hẹp không đi qua đó');

-- ---------------------------------------------------------------------------
-- D-170 — cửa sổ KHÔNG mở cho bất kỳ vai trò nào khác.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select * from public.report_attendance_rows_for_treasurer(
      'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')$$,
  '42501', null, 'Thư ký không đi qua cửa sổ của Thủ quỹ (họ có đường riêng, rộng hơn)');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000006', true);
select throws_ok(
  $$select * from public.report_results_rows_for_treasurer('d2200000-0000-4000-8000-000000000001')$$,
  '42501', null, 'Trưởng ngành không đi qua cửa sổ của Thủ quỹ');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select * from public.dashboard_summary_for_treasurer('d2200000-0000-4000-8000-000000000001')$$,
  '42501', null, 'Cha sở không đi qua cửa sổ của Thủ quỹ');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000009', true);
select throws_ok(
  $$select * from public.report_attendance_rows_for_treasurer(
      'd2200000-0000-4000-8000-000000000001', '2098-09-01', '2099-05-31')$$,
  '42501', null, '🔴 Phụ huynh gọi thẳng cửa sổ Thủ quỹ bị từ chối — hàm `security definer` tự kiểm actor');

-- ---------------------------------------------------------------------------
-- D-170 — bốn ô số của trang tổng quan.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000005', true);

select is(
  (select student_count from public.dashboard_summary_for_treasurer('d2200000-0000-4000-8000-000000000001')),
  3, 'ô "Thiếu nhi" của Thủ quỹ nay là 3, không còn là 0');

select is(
  (select class_count from public.dashboard_summary_for_treasurer('d2200000-0000-4000-8000-000000000001')),
  2, 'ô "Lớp" là 2 — tính lại tại chỗ vì mệnh đề phạm vi trong view hỏi JWT chứ không hỏi RLS');

select is(
  (select staff_count from public.dashboard_summary_for_treasurer('d2200000-0000-4000-8000-000000000001')),
  1, 'ô "Giáo lý viên" là 1 — cùng một phạm vi với ba ô kia');

select is(
  (select coalesce(class_count, 0) from public.v_dashboard_summary
   where academic_year_id = 'd2200000-0000-4000-8000-000000000001'),
  0, '🔴 nhưng Thủ quỹ đọc THẲNG view vẫn ra 0 — cửa sổ không rò ngược, D-169 không bị phá');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000006', true);
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd2200000-0000-4000-8000-000000000001'),
  1, 'Trưởng ngành Ấu vẫn đếm đúng 1 lớp ngành mình — D-169 không hồi quy');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000004', true);
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd2200000-0000-4000-8000-000000000001'),
  2, 'quyền toàn cục vẫn đếm đủ 2 lớp — không hồi quy');

-- ---------------------------------------------------------------------------
-- D-170 — xem/tải bản chốt, và vế "vẫn không chốt được".
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000005', true);

select is(
  (select count(*)::integer from public.report_snapshots
   where academic_year_id = 'd2200000-0000-4000-8000-000000000001'),
  3, 'Thủ quỹ nay XEM và TẢI được bản chốt (docs/05: "👁/export giới hạn")');

select ok(app.can_read_report('class', 'd2300000-0000-4000-8000-000000000001'),
  'kể cả bản chốt phạm vi lớp — nội dung của nó là đúng cái bảng gộp họ vừa xem được');

select ok(not app.can_create_report('global', null),
  '🔴 nhưng Thủ quỹ VẪN không chốt được ở phạm vi toàn xứ đoàn (D-19 · D-66 đứng nguyên)');
select ok(not app.can_create_report('sector', '10000000-0000-0000-0000-000000000002'),
  '🔴 …không chốt được ở phạm vi ngành — nhánh dễ quên nhất');
select ok(not app.can_create_report('class', 'd2300000-0000-4000-8000-000000000001'),
  '🔴 …không chốt được ở phạm vi lớp');
select ok(not public.can_finalize_report('global', null),
  'và hàm bọc mà giao diện gọi trả về đúng câu ấy — nút "Chốt báo cáo" không hiện');

select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Thủ quỹ chốt', 'd2200000-0000-4000-8000-000000000001',
      'global', null, 'year', '2098-09-01', '2099-05-31',
      '{}'::jsonb, '{"headers":[],"rows":[]}'::jsonb, 'x', 'd2100000-0000-4000-8000-000000000005')$$,
  '42501', null, '🔴 gửi thẳng lệnh chốt vào cơ sở dữ liệu vẫn bị policy chặn — đo ĐƯỜNG GHI, không chỉ đo hàm');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.report_snapshots
   where academic_year_id = 'd2200000-0000-4000-8000-000000000001'),
  3, 'Cha sở vẫn đọc được đủ bản chốt — D-66 không hồi quy');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.report_snapshots
   where scope_type = 'global'),
  0, '🔴 Trưởng ngành Thiếu vẫn KHÔNG đọc được bản chốt toàn xứ đoàn — cửa sổ Thủ quỹ không nới cho ai khác');

-- ---------------------------------------------------------------------------
-- D-172 — tra bản chốt trùng, và cái bẫy `profiles`.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000004', true);

select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  1, 'tra bản trùng trả về ĐÚNG MỘT hàng — bản gần nhất, không phải một danh sách');

select is(
  (select duplicate_count from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  2, 'nhưng NÓI RA là đang có 2 bản trùng — "đã có 2 bản" là một câu khác hẳn "đã có 1 bản"');

select is(
  (select snapshot_id from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  'd2a00000-0000-4000-8000-000000000002'::uuid,
  'và trả về bản MỚI NHẤT, không phải bản đầu tiên');

select is(
  (select generated_by_name from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  'Thư ký Maria Nguyễn', 'kèm TÊN người chốt — thứ D-172 bắt buộc phải nêu');

select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-10-01', '2098-10-31', null)),
  0, 'khoảng ngày khác thì không phải bản trùng');

select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'results', 'global', '2098-09-01', '2099-05-31', null)),
  0, 'loại báo cáo khác thì không phải bản trùng');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000006', true);

select is(
  (select generated_by_name from public.find_report_snapshot_duplicate(
    'attendance', 'class', '2098-09-01', '2098-09-30', 'd2300000-0000-4000-8000-000000000001')),
  'Thư ký Maria Nguyễn',
  '🔴 Trưởng ngành — người mà RLS của `profiles` KHÔNG cho đọc tên người khác — vẫn nhận được tên qua cửa sổ hẹp');

select is(
  (select count(*)::integer from public.profiles
   where id = 'd2100000-0000-4000-8000-000000000004'),
  0, '🔴 …trong khi đọc thẳng `public.profiles` của chính người ấy vẫn 0 dòng — không nới danh bạ');

select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  0, '🔴 Trưởng ngành hỏi bản chốt TOÀN XỨ ĐOÀN thì không nhận được gì — cửa sổ tôn trọng phạm vi đọc');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'attendance', 'class', '2098-09-01', '2098-09-30', 'd2300000-0000-4000-8000-000000000001')),
  0, '🔴 Trưởng ngành Thiếu hỏi bản chốt của lớp ngành Ấu cũng không nhận được gì');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000009', true);
select is(
  (select count(*)::integer from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  0, 'phụ huynh hỏi bản chốt cũng không nhận được gì');

select set_config('request.jwt.claim.sub', 'd2100000-0000-4000-8000-000000000005', true);
select is(
  (select generated_by_name from public.find_report_snapshot_duplicate(
    'attendance', 'global', '2098-09-01', '2099-05-31', null)),
  'Thư ký Maria Nguyễn',
  'Thủ quỹ tra được bản trùng vì họ ĐỌC được bản chốt ấy — dù họ không bao giờ chốt được');

select * from finish();
rollback;
