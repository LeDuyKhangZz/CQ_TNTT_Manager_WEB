begin;

-- ============================================================================
-- M07-C — hai hạng mục cuối của module Bảng điểm, kiểm bằng **JWT thật của
-- từng vai trò**. Không một dòng nào chạy bằng service role sau
-- `set local role authenticated` (`CLAUDE.md` §4).
--
--   D-154 / TB-M07-02 — "khóa" chặn cấu trúc và điểm, KHÔNG chặn công bố.
--   D-155 / TB-M07-06 — Top 5 tính lại được, bản đang có xuống lịch sử.
--
-- 🔴 `08_ACCEPTANCE_CRITERIA` §4 ghi thẳng: *"pgTAP **cả hai chiều** (AC-02-01
-- và AC-02-02) — thiếu một chiều là chưa đủ."* Lý do rất cụ thể: hạng mục này
-- **nới một hàng rào bảo mật**, và một bài kiểm chỉ chứng minh "công bố được"
-- sẽ xanh y hệt nhau dù ngoại lệ rộng đúng một cột hay rộng ra cả bảng. Nên
-- phần C dưới đây có **một** khẳng định cho chiều nới, còn phần D có **sáu**
-- khẳng định cho chiều giữ.
--
-- 🔴 Và nhắc lại bài học M05-A mà `044` đã ghi: **đo đúng cơ chế chặn**.
--   · policy `using` **lọc dòng trong im lặng** ⇒ đo **KẾT QUẢ** (số dòng đổi).
--   · policy `with check` của INSERT ⇒ có ngoại lệ thật, đo bằng `throws_ok`.
--   · RPC `security definer` ⇒ có ngoại lệ thật, đo bằng `throws_ok`.
-- ============================================================================

select plan(43);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-pub@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-pub@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-pub@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-pub@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'closed-rep-pub@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'P_REP', 'Đại diện Ấu 1A'),
  ('f1000000-0000-4000-8000-000000000002', 'P_TEA', 'Giáo lý viên lớp'),
  ('f1000000-0000-4000-8000-000000000003', 'P_GUA', 'Phụ huynh em thứ nhất'),
  ('f1000000-0000-4000-8000-000000000004', 'P_ADM', 'Quản trị hệ thống'),
  ('f1000000-0000-4000-8000-000000000005', 'P_OLD', 'Đại diện lớp năm đã đóng');

insert into public.academic_years
  (id, code, name, start_date, end_date, status, retention_until, top5_enabled)
values
  ('f0000000-0000-4000-8000-000000000001', '2095-2096', 'Năm công bố', '2095-09-01', '2096-05-31', 'draft', '2101-05-31', true),
  ('f0000000-0000-4000-8000-000000000002', '2094-2095', 'Năm đã đóng', '2094-09-01', '2095-05-31', 'draft', '2100-05-31', true);

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Công bố'),
  ('f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu 2A Đã đóng');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Ấu 1A', '0930000001'),
  ('f7000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'chi', 'Giáo lý viên lớp', '0930000002'),
  ('f7000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', 'chi', 'Đại diện năm cũ', '0930000005');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000001', 'representative', '2095-09-01'),
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000002', 'member',         '2095-09-01'),
  ('f6000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000005', 'representative', '2094-09-01');

-- Hai người giám hộ: một có tài khoản (chỉ nhận em thứ nhất), một không có —
-- năm em còn lại phải thuộc về người **không** đăng nhập được, nếu không thì
-- mọi phép đếm "phụ huynh thấy bao nhiêu" đo nhầm sang cả lớp.
insert into public.guardians (id, profile_id, full_name, phone) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000003', 'Phụ huynh có tài khoản', '0930000003'),
  ('f2000000-0000-4000-8000-000000000002', null, 'Phụ huynh chung', '0930000099');

insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('f3000000-0000-4000-8000-000000000001', null, 'f2000000-0000-4000-8000-000000000001', 'Maria',  'Hạng Nhất', 'female', '2016-01-01'),
  ('f3000000-0000-4000-8000-000000000002', null, 'f2000000-0000-4000-8000-000000000002', 'Anna',   'Hạng Nhì',  'female', '2016-02-02'),
  ('f3000000-0000-4000-8000-000000000003', null, 'f2000000-0000-4000-8000-000000000002', 'Gioan',  'Hạng Ba',   'male',   '2016-03-03'),
  ('f3000000-0000-4000-8000-000000000004', null, 'f2000000-0000-4000-8000-000000000002', 'Phêrô',  'Hạng Tư',   'male',   '2016-04-04'),
  ('f3000000-0000-4000-8000-000000000005', null, 'f2000000-0000-4000-8000-000000000002', 'Phaolô', 'Hạng Năm',  'male',   '2016-05-05'),
  ('f3000000-0000-4000-8000-000000000006', null, 'f2000000-0000-4000-8000-000000000002', 'Têrêsa', 'Hạng Sáu',  'female', '2016-06-06'),
  ('f3000000-0000-4000-8000-000000000007', null, 'f2000000-0000-4000-8000-000000000002', 'Giuse',  'Trò Năm Cũ', 'male',  '2015-07-07');

insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000006', 'f3000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2095-09-01'),
  ('f4000000-0000-4000-8000-000000000007', 'f3000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000002', 'active', '2094-09-01');

insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000003', 'guardian'),
  ('f1000000-0000-4000-8000-000000000004', 'super_admin');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f1000000-0000-4000-8000-000000000001', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000002', 'class_teacher',        'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000005', 'class_representative', 'f0000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000002');

-- fa01 cột công bố trước khi khóa · fa02 cột công bố SAU khi khóa (ca mới)
-- fa03 nguồn Top 5 · fa04 cột của năm đã đóng · fa05 cột sẽ bị ẩn
insert into public.assessments
  (id, class_id, academic_year_id, kind, title, weight, is_active, created_by, updated_by)
values
  ('fa000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'midterm',  'Giữa kỳ',      2, true, 'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('fa000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'final',    'Cuối kỳ',      3, true, 'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('fa000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Nguồn Top 5',  1, true, 'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('fa000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002', 'midterm',  'Giữa kỳ năm cũ', 2, true, 'f1000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005'),
  ('fa000000-0000-4000-8000-000000000005', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Cột sẽ bị ẩn', 1, true, 'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001');

-- Điểm nguồn Top 5: sáu em, sáu con số phân biệt, để thứ hạng không nhập nhằng.
-- Hạng 1 = 9 điểm (em thứ nhất); em thứ sáu đứng ngoài với 1 điểm — chính em
-- này sẽ được nâng lên 10 để chứng minh lượt tính lại là **thật**.
insert into public.assessment_scores
  (assessment_id, enrollment_id, class_id, academic_year_id, student_id, score)
values
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 9),
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000002', 8),
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000003', 7),
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000004', 6),
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000005', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000005', 5),
  ('fa000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000006', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000006', 1),
  -- Một ô của cột fa01 để đo được "phụ huynh có thấy ĐIỂM không", không chỉ
  -- "có thấy cột không" — hai câu hỏi khác nhau, hai policy khác nhau.
  ('fa000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 10),
  ('fa000000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 7);

insert into public.leaderboards
  (id, class_id, academic_year_id, title, source_type, source_assessment_id, created_by, updated_by)
values
  ('fb000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
   'Top 5 tháng 10', 'assessment', 'fa000000-0000-4000-8000-000000000003',
   'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('fb000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
   'Bản nháp bỏ đi', 'assessment', 'fa000000-0000-4000-8000-000000000003',
   'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001');

-- Dựng lịch sử theo thứ tự hợp lệ trước khi đo year gate.
update public.academic_years
set status = 'closed'
where id = 'f0000000-0000-4000-8000-000000000002';

set local role authenticated;

-- Một nhận xét dựng sẵn để phần D đo được đường **sửa** sau khi khóa. Phải ghi
-- sau `set local role authenticated`: trigger đặt `author_profile_id := auth.uid()`.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
insert into public.student_comments (id, enrollment_id, visibility, content) values
  ('fc000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'staff_only', 'Nhận xét trước khi khóa');

-- ════════════════════════════════════════════════════════════════════════════
-- A · D-154 — ba hàng rào PHẢI được chép vào RPC, vì `security definer` bỏ qua
--     RLS. Đây đúng cái bẫy M05-A đã dặn và M07-B đã vấp một lần.
-- ════════════════════════════════════════════════════════════════════════════

select is(public.set_assessment_published('fa000000-0000-4000-8000-000000000001', true), 1,
  'D-154: đại diện công bố được một cột khi bảng điểm chưa khóa');
select is(public.set_assessment_published('fa000000-0000-4000-8000-000000000001', true), 0,
  'D-154: bấm lần hai đổi 0 dòng — vô hại, và KHÔNG phải lỗi');

-- Cột đã ẩn: công bố nó là thao tác không có kết quả nhìn thấy được (BR-M07-28).
select lives_ok(
  $$update public.assessments set is_active = false, updated_by = 'f1000000-0000-4000-8000-000000000001'
    where id = 'fa000000-0000-4000-8000-000000000005'$$,
  'dựng ca cột đã ẩn'
);
select throws_ok(
  $$select public.set_assessment_published('fa000000-0000-4000-8000-000000000005', true)$$,
  '42501', 'ASSESSMENT_INACTIVE', 'D-154: không công bố được một cột đang bị ẩn'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.set_assessment_published('fa000000-0000-4000-8000-000000000002', true)$$,
  '42501', 'FORBIDDEN', 'D-154: phụ huynh gọi thẳng RPC vẫn bị từ chối ở tầng cơ sở dữ liệu'
);
select is((select count(*)::integer from public.assessments where class_id = 'f6000000-0000-4000-8000-000000000001'), 1,
  'AC-02-03: phụ huynh chỉ thấy ĐÚNG cột đã công bố, không thấy dấu vết bốn cột kia');
select is((select count(*)::integer from public.assessment_scores), 1,
  'AC-02-03: và chỉ thấy điểm của cột ấy, của chính con mình');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$select public.set_assessment_published('fa000000-0000-4000-8000-000000000004', true)$$,
  '42501', 'ACADEMIC_YEAR_CLOSED', 'nợ #18: năm học đã đóng chặn cả đường công bố'
);
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select is(public.set_assessment_published('fa000000-0000-4000-8000-000000000004', true), 1,
  'D-117: Super Admin vẫn công bố được trong năm học đã đóng');

-- ════════════════════════════════════════════════════════════════════════════
-- B · D-155 — vòng đời Top 5. Chủ dự án chọn phương án B của `04_TO_BE_FLOWS`:
--     cho tính lại, nhưng bản đang có phải xuống lịch sử trước khi bị thay.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select is(public.publish_leaderboard('fb000000-0000-4000-8000-000000000001', null), 5,
  'chốt lần đầu ghi đúng năm vị trí');
select is((select count(*)::integer from public.leaderboard_snapshots where leaderboard_id = 'fb000000-0000-4000-8000-000000000001'), 0,
  'D-155: lần chốt ĐẦU TIÊN không sinh bản lịch sử nào — chưa có gì bị thay');
select is((select score from public.leaderboard_entries where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and rank = 1), 9.00::numeric,
  'hạng nhất của bản đầu là 9 điểm');

-- BR-M07-35, và đây là chỗ điều kiện cũ `not is_published` SAI.
delete from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000002'), 0,
  'BR-M07-35: xóa được bản nháp CHƯA TỪNG công bố');
delete from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000001';
select is((select count(*)::integer from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000001'), 1,
  'BR-M07-35: không xóa được bảng đang công bố');

update public.leaderboards set is_published = false, updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fb000000-0000-4000-8000-000000000001';
select is((select is_published from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000001'), false,
  'ẩn khỏi cổng đổi được cờ công bố');
delete from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000001';
select is((select count(*)::integer from public.leaderboards where id = 'fb000000-0000-4000-8000-000000000001'), 1,
  '🔴 BR-M07-35: ẨN RỒI VẪN KHÔNG XÓA ĐƯỢC — `published_at` mới là phép thử đúng, không phải `is_published`');
select is((select count(*)::integer from public.leaderboard_entries where leaderboard_id = 'fb000000-0000-4000-8000-000000000001'), 5,
  'danh sách vẫn nằm nguyên trong lúc ẩn — đó là thứ đường "hiện lại" dựa vào');

-- Đường 1: hiện lại — KHÔNG tính lại.
update public.leaderboards set is_published = true, updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fb000000-0000-4000-8000-000000000001';
select is((select score from public.leaderboard_entries where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and rank = 1), 9.00::numeric,
  'D-155: "hiện lại bản đang có" giữ nguyên hạng nhất, không tính lại');
select is((select count(*)::integer from public.leaderboard_snapshots where leaderboard_id = 'fb000000-0000-4000-8000-000000000001'), 0,
  'D-155: và không sinh bản lịch sử nào — có thay gì đâu mà lưu');

-- Đường 2: chốt lại — CÓ tính lại, và bản cũ phải xuống lịch sử.
update public.leaderboards set is_published = false, updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fb000000-0000-4000-8000-000000000001';
select is(public.save_assessment_scores('fa000000-0000-4000-8000-000000000003',
  '[{"enrollmentId":"f4000000-0000-4000-8000-000000000006","score":10}]'::jsonb), 1,
  'nâng em hạng sáu lên 10 điểm để lượt tính lại có gì để đổi');
select is(public.publish_leaderboard('fb000000-0000-4000-8000-000000000001', null), 5,
  'chốt lại danh sách chạy được sau khi ẩn');
select is((select score from public.leaderboard_entries where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and rank = 1), 10.00::numeric,
  'D-155: bản mới ĐÃ tính lại — hạng nhất nay là 10');
select is((select count(*)::integer from public.leaderboard_snapshots where leaderboard_id = 'fb000000-0000-4000-8000-000000000001'), 1,
  '🔴 D-155: bản đang có được lưu lại TRƯỚC khi bị thay — đúng điều phương án B đổi lấy');
select is((select entry_count from public.leaderboard_snapshots where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and snapshot_no = 1), 5::smallint,
  'bản lịch sử giữ đủ năm vị trí');
select is(
  (select (entries_json -> 0 ->> 'score')::numeric from public.leaderboard_snapshots
   where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and snapshot_no = 1),
  9.00::numeric,
  '🔴 D-155: và nó giữ ĐÚNG hạng nhất CŨ — 9 điểm, thứ vừa bị lượt tính lại thay mất'
);
select is(
  (select entries_json -> 0 ->> 'fullName' from public.leaderboard_snapshots
   where leaderboard_id = 'fb000000-0000-4000-8000-000000000001' and snapshot_no = 1),
  'Hạng Nhất',
  'bản lịch sử giữ cả tên em, không chỉ con số'
);

-- Append-only, và nó có **hai** lớp phải đo riêng — cùng khuôn `026` (D-65):
--   · `authenticated` không có `grant update/delete` ⇒ chặn ở tầng quyền, lỗi
--     là *"permission denied for table"* và trigger còn chưa kịp chạy;
--   · chủ bảng và `service_role` thì CÓ quyền ⇒ chỉ trigger chặn được.
-- Đo một lớp là để ngỏ lớp kia.
select throws_ok(
  $$update public.leaderboard_snapshots set entry_count = 1 where snapshot_no = 1$$,
  '42501', null, 'D-155: người dùng thường không có quyền ghi lên lịch sử Top 5'
);
reset role;
select throws_ok(
  $$update public.leaderboard_snapshots set entry_count = 1 where snapshot_no = 1$$,
  '42501', 'LEADERBOARD_SNAPSHOT_APPEND_ONLY', 'D-155: không ai SỬA được một bản lịch sử, kể cả chủ bảng'
);
select throws_ok(
  $$delete from public.leaderboard_snapshots where snapshot_no = 1$$,
  '42501', 'LEADERBOARD_SNAPSHOT_APPEND_ONLY', 'D-155: không ai XÓA được một bản lịch sử, kể cả chủ bảng'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

-- Lưới an toàn của đường "hiện lại".
insert into public.leaderboards (id, class_id, academic_year_id, title, source_type, source_assessment_id, created_by, updated_by)
values ('fb000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
        'Bản nháp chưa chốt', 'assessment', 'fa000000-0000-4000-8000-000000000003',
        'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001');
select throws_ok(
  $$update public.leaderboards
    set is_published = true, published_at = now(), published_by = 'f1000000-0000-4000-8000-000000000001',
        updated_by = 'f1000000-0000-4000-8000-000000000001'
    where id = 'fb000000-0000-4000-8000-000000000003'$$,
  '23514', 'LEADERBOARD_NOT_SNAPSHOTTED',
  'D-155: bật cờ công bố trên bảng chưa từng chốt bị chặn — nếu không, cổng phụ huynh nhận một bảng Top 5 RỖNG'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.leaderboard_snapshots), 0,
  '🔴 D-155: phụ huynh KHÔNG đọc được lịch sử Top 5 — bản đã bị gỡ xuống không được rò lại qua cửa khác');
select is((select count(*)::integer from public.leaderboard_entries), 5,
  'nhưng vẫn thấy đủ bảng Top 5 đang công bố của lớp');

-- ════════════════════════════════════════════════════════════════════════════
-- C · AC-02-01 — CHIỀU NỚI. Một khẳng định, và nó là toàn bộ hạng mục TB-M07-02.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.lock_gradebook('f6000000-0000-4000-8000-000000000001')$$, 'đại diện khóa được bảng điểm');
select is(public.set_assessment_published('fa000000-0000-4000-8000-000000000002', true), 1,
  '🔴 AC-02-01/D-154: BẢNG ĐIỂM ĐÃ KHÓA VẪN CÔNG BỐ ĐƯỢC — hạng mục rủi ro cao nhất của module');
select is(public.set_assessment_published('fa000000-0000-4000-8000-000000000001', false), 1,
  'D-154: và tắt công bố cũng chạy được sau khi khóa — chủ dự án chốt cả hai chiều');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.assessment_scores), 1,
  '🔴 quả mìn (c): phụ huynh thấy ĐIỂM của cột vừa công bố sau khi khóa — trigger đồng bộ `assessment_scores` đã chạy lọt qua hàng rào khóa'
);
select is((select title from public.assessments where class_id = 'f6000000-0000-4000-8000-000000000001'), 'Cuối kỳ',
  'và đúng một cột — cột vừa bị tắt công bố đã biến khỏi cổng ngay');

-- ════════════════════════════════════════════════════════════════════════════
-- D · AC-02-02 — CHIỀU GIỮ. Sáu khẳng định, vì đây là chỗ một ngoại lệ viết
--     rộng tay sẽ mở toang hàng rào mà không bài kiểm nào ở phần C nhận ra.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

update public.assessments set weight = 9, updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fa000000-0000-4000-8000-000000000002';
select is((select weight from public.assessments where id = 'fa000000-0000-4000-8000-000000000002'), 3.00::numeric,
  'AC-02-02: đã khóa vẫn KHÔNG đổi được hệ số');

update public.assessments set title = 'Đổi tên khi đã khóa', updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fa000000-0000-4000-8000-000000000002';
select is((select title from public.assessments where id = 'fa000000-0000-4000-8000-000000000002'), 'Cuối kỳ',
  'AC-02-02: đã khóa vẫn KHÔNG đổi được tên cột');

-- 🔴 Khẳng định quan trọng nhất của cả file: policy **giữ nguyên**. Ngoại lệ
-- của D-154 chỉ tồn tại bên trong RPC `security definer`; ai gửi thẳng lệnh vào
-- cơ sở dữ liệu vẫn bị chặn, kể cả khi lệnh ấy chỉ đổi mỗi cờ công bố.
update public.assessments set is_published = false, updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fa000000-0000-4000-8000-000000000002';
select is((select is_published from public.assessments where id = 'fa000000-0000-4000-8000-000000000002'), true,
  '🔴 AC-02-02: gửi THẲNG lệnh đổi cờ công bố vào cơ sở dữ liệu vẫn bị policy chặn — ngoại lệ nằm trong RPC, không nằm trong policy');

select throws_ok(
  $$select public.save_assessment_scores('fa000000-0000-4000-8000-000000000002',
      '[{"enrollmentId":"f4000000-0000-4000-8000-000000000001","score":3}]'::jsonb)$$,
  '42501', 'GRADEBOOK_LOCKED', 'AC-02-02: đã khóa vẫn KHÔNG sửa được điểm');

select throws_ok(
  $$insert into public.assessments (class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'quiz_15m',
            'Cột thêm sau khi khóa', 1, 'f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'AC-02-02: đã khóa vẫn KHÔNG thêm được cột');

update public.student_comments set content = 'Sửa sau khi khóa', updated_by = 'f1000000-0000-4000-8000-000000000001'
where id = 'fc000000-0000-4000-8000-000000000001';
select is((select content from public.student_comments where id = 'fc000000-0000-4000-8000-000000000001'), 'Nhận xét trước khi khóa',
  'AC-02-02: đã khóa vẫn KHÔNG sửa được nhận xét');

select * from finish();
rollback;
