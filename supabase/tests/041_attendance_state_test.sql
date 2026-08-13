begin;

-- ============================================================================
-- M05-A · TB-04 · TB-07 · D-139 · D-140 · nợ #18.
--
-- Mọi khẳng định về quyền chạy dưới **JWT thật** (`request.jwt.claim.sub`),
-- không service role — `CLAUDE.md` §4. Chỗ nào dùng `reset role` là cố ý mượn
-- quyền superuser để **dựng bối cảnh** (đổi trạng thái ghi danh, đóng năm học,
-- đẩy đồng hồ lease), hoặc để gọi thẳng vào trigger — đúng khuôn `012`.
--
-- Bộ này là file RIÊNG chứ không thêm vào `012_attendance_test.sql`: `012` có
-- `plan(67)` và 67 khẳng định ấy phải giữ nguyên màu xanh làm mốc hồi quy cho
-- chính đợt này. Cùng khuôn với `037`…`040` của M03/M12.
--
-- Lịch dùng trong bài: năm học 2075-2076. 2075-09-05 là thứ Năm; 2075-09-08 và
-- 2075-09-15 là Chúa nhật.
-- ============================================================================

select plan(31);

-- ── Chốt chặn `grant` — bài học M12-C ──────────────────────────────────────
-- Migration của đợt này dùng `create or replace` nên quyền được giữ, nhưng ba
-- bài dưới đây là cái lưới cho phiên sau: nếu ai đó đổi kiểu trả về và buộc
-- phải `drop function`, quên cấp lại quyền sẽ gãy toàn bộ luồng điểm danh với
-- triệu chứng `42501` trông hệt lỗi RLS.
select ok(
  has_function_privilege('authenticated', 'public.save_and_finalize_attendance(uuid, jsonb, jsonb, boolean)', 'execute'),
  'authenticated vẫn gọi được save_and_finalize_attendance'
);
select ok(
  has_function_privilege('authenticated', 'public.heartbeat_attendance_session(uuid)', 'execute'),
  'authenticated vẫn gọi được heartbeat_attendance_session'
);
select ok(
  has_function_privilege('authenticated', 'app.attendance_roster_enrollments(uuid, date)', 'execute'),
  'authenticated gọi được hàm danh sách dùng chung'
);
select ok(
  not has_function_privilege('anon', 'app.attendance_roster_enrollments(uuid, date)', 'execute'),
  'anon KHÔNG gọi được hàm danh sách (revoke from public, anon)'
);
select has_function(
  'app', 'attendance_roster_enrollments', array['uuid', 'date'],
  'D-140: hàm dùng chung xác định ai có tên trong danh sách điểm danh'
);

-- ── Fixture (superuser bypass RLS) ─────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a5000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-m05@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'glv1-m05@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'glv2-m05@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chaso-m05@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'thuquy-m05@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('a5000000-0000-4000-8000-000000000001', 'SA_M05', 'Quản trị M05'),
  ('a5000000-0000-4000-8000-000000000002', 'GLV1_M05', 'GLV Một M05'),
  ('a5000000-0000-4000-8000-000000000003', 'GLV2_M05', 'GLV Hai M05'),
  ('a5000000-0000-4000-8000-000000000004', 'CHASO_M05', 'Cha sở M05'),
  ('a5000000-0000-4000-8000-000000000005', 'TQ_M05', 'Thủ quỹ M05');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('a0000000-0000-4000-8000-000000000001', '2075-2076', 'Năm M05', '2075-09-01', '2076-05-31', 'draft', '2081-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('a6000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A M05');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('a7000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'anh', 'GLV Một M05', '0951000002'),
  ('a7000000-0000-4000-8000-000000000003', 'a5000000-0000-4000-8000-000000000003', 'chi', 'GLV Hai M05', '0951000003'),
  -- Thủ quỹ bắt buộc có hồ sơ nhân sự (`validate_staff_role_link`); Cha sở thì
  -- không nằm trong danh sách ấy.
  ('a7000000-0000-4000-8000-000000000005', 'a5000000-0000-4000-8000-000000000005', 'anh', 'Thủ quỹ M05', '0951000005');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('a8000000-0000-4000-8000-000000000002', 'a6000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002', 'representative', '2075-09-01'),
  ('a8000000-0000-4000-8000-000000000003', 'a6000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000003', 'member', '2075-09-01');

insert into public.guardians (id, full_name, phone) values
  ('a2000000-0000-4000-8000-000000000001', 'Phụ huynh M05', '0951000009');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Một M05', 'female', '2016-01-01'),
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'Anna', 'Trò Hai M05', 'female', '2016-02-02'),
  ('a3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000001', 'Teresa', 'Trò Ba M05', 'female', '2016-03-03'),
  ('a3000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000001', 'Lucia', 'Trò Bốn M05', 'female', '2016-04-04');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('a4000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('a4000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('a4000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 'active', '2075-09-01');
-- Em Bốn rời lớp TRƯỚC mọi buổi trong bài — dùng cho S-22, để chứng minh
-- TB-07 nới cho UPDATE mà KHÔNG nới cho INSERT.
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on, ended_on) values
  ('a4000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 'transferred', '2075-09-01', '2075-09-02');

insert into public.role_assignments (profile_id, role) values
  ('a5000000-0000-4000-8000-000000000001', 'super_admin'),
  ('a5000000-0000-4000-8000-000000000004', 'parish_priest'),
  ('a5000000-0000-4000-8000-000000000005', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('a5000000-0000-4000-8000-000000000002', 'class_representative', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001'),
  ('a5000000-0000-4000-8000-000000000003', 'class_teacher', 'a0000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001');

-- ── D-140 · em tạm nghỉ ra khỏi danh sách ──────────────────────────────────
update public.enrollments set status = 'paused'
where id = 'a4000000-0000-4000-8000-000000000003';

-- Đọc hàm dùng chung ở quyền superuser: đây là khẳng định về ĐỊNH NGHĨA danh
-- sách, không phải về phân quyền.
select is(
  (select count(*)::integer
   from app.attendance_roster_enrollments('a6000000-0000-4000-8000-000000000001', '2075-09-05')),
  2, 'D-140: hàm danh sách bỏ em tạm nghỉ và em đã rời lớp, còn 2 trên 4 em'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-05', 'thursday')),
  'GLV lớp mở được buổi thứ Năm'
);
select is(
  (select count(*)::integer from public.student_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2075-09-05'),
  2, '🔴 D-140: em tạm nghỉ KHÔNG được nạp vào danh sách điểm danh'
);
select is(
  (select count(*)::integer from public.student_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2075-09-05'
      and record.student_id = 'a3000000-0000-4000-8000-000000000003'),
  0, 'em tạm nghỉ không có dòng nào để bị đánh nhầm "có mặt"'
);

-- 🔴 Cái bẫy của D-140: nếu `roster_size` khi chốt vẫn đếm cả em tạm nghỉ thì
-- `record_size < roster_size` thành đúng, và MỌI lớp có một em tạm nghỉ sẽ
-- không chốt được buổi nào nữa. Bài này là lý do hai bên phải dùng chung hàm.
select is(
  (select out_status::text from public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, true)),
  'completed', '🔴 lớp có em tạm nghỉ vẫn CHỐT được buổi (roster_size dùng chung hàm)'
);

-- ── TB-04 · ba nguyên nhân, ba mã lỗi ──────────────────────────────────────
-- Chốt xong thì RPC xóa `editing_by`. Trước M05-A, bấm "Hoàn tất" lần nữa
-- (nhấp đúp / mạng chậm / thử lại) rơi vào nhánh gộp và báo "đang có người
-- khác phụ trách" — gọi tên một người không hề tồn tại.
select is(
  (select editing_by from public.attendance_sessions where attendance_date = '2075-09-05'),
  null::uuid, 'chốt xong thì không còn ai giữ phiên chỉnh sửa'
);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, true)$$,
  '55006', 'ATTENDANCE_SESSION_NOT_CLAIMED',
  '🔴 TB-04: chốt lần hai báo "phiên đã kết thúc", KHÔNG phải "người khác đang phụ trách"'
);
select throws_ok(
  $$select public.heartbeat_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'))$$,
  '55006', 'ATTENDANCE_SESSION_NOT_CLAIMED',
  'heartbeat khi không ai giữ buổi cũng nói đúng nguyên nhân'
);

-- Lease của CHÍNH MÌNH hết hạn là chuyện thứ ba, và cũng có mã riêng.
select ok(
  (select out_claimed from public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-05', 'thursday')),
  'GLV nhận lại quyền sửa buổi đã chốt (còn trong cửa sổ 3 ngày)'
);
reset role;
update public.attendance_sessions set last_activity_at = now() - interval '2 hours'
where attendance_date = '2075-09-05';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.heartbeat_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'))$$,
  '55006', 'ATTENDANCE_LEASE_EXPIRED',
  'TB-04: phiên của chính mình hết hạn có mã riêng'
);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, false)$$,
  '55006', 'ATTENDANCE_LEASE_EXPIRED',
  'lưu nháp sau khi hết hạn phiên cũng nói đúng nguyên nhân'
);

-- Người KHÁC đang giữ thì vẫn là `ATTENDANCE_ALREADY_CLAIMED` — mã cũ giữ
-- nguyên đúng ca mà `012:192-199` đang canh.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);
select ok(
  (select public.takeover_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05')) is not null),
  'GLV thứ hai tiếp quản được khi lease đã hết'
);
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, false)$$,
  '55006', 'ATTENDANCE_ALREADY_CLAIMED',
  'S-20/S-09: bị tiếp quản thì vẫn là "người khác đang phụ trách" — mã cũ KHÔNG đổi'
);

-- ── TB-07 · một em rời lớp không khóa cứng cả buổi ─────────────────────────
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-08', 'sunday')),
  'mở buổi Chúa nhật để kiểm TB-07'
);
-- Em Hai rời lớp, ngày kết thúc LÙI VỀ TRƯỚC ngày buổi. Đây là ca thật: hồ sơ
-- được sửa sau khi buổi đã diễn ra.
reset role;
update public.enrollments
set status = 'transferred', ended_on = '2075-09-06'
where id = 'a4000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-08'),
    jsonb_build_array(jsonb_build_object(
      'enrollment_id', 'a4000000-0000-4000-8000-000000000002',
      'mass_status', 'excused_absence',
      'catechism_status', 'excused_absence',
      'note', null)),
    '[]'::jsonb, false)$$,
  '🔴 TB-07/AC-F06-4: em đã rời lớp không còn khóa cứng lượt lưu nháp'
);
select lives_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-08'),
    '[]'::jsonb, '[]'::jsonb, true)$$,
  'TB-07: và cũng không khóa cứng lượt chốt'
);
select is(
  (select mass_status::text from public.student_attendance_records
   where enrollment_id = 'a4000000-0000-4000-8000-000000000002'
     and attendance_session_id = (select id from public.attendance_sessions where attendance_date = '2075-09-08')),
  'excused_absence', 'dòng của em ấy vẫn còn, giữ đúng trạng thái GLV đã chọn'
);

-- S-22: nới cho UPDATE **không** nới cho INSERT. Gọi thẳng vào trigger bằng
-- quyền superuser vì `authenticated` không có insert trên bảng này.
reset role;
select throws_ok(
  $$insert into public.student_attendance_records
      (attendance_session_id, enrollment_id, class_id, student_id)
    values ((select id from public.attendance_sessions where attendance_date = '2075-09-08'),
            'a4000000-0000-4000-8000-000000000004',
            'a6000000-0000-4000-8000-000000000001',
            'a3000000-0000-4000-8000-000000000004')$$,
  '23514', 'ATTENDANCE_ENROLLMENT_NOT_OPEN',
  'S-22: TẠO dòng mới cho ghi danh đã đóng trước ngày buổi vẫn bị từ chối'
);
set local role authenticated;

-- ── Nợ #18 · năm học đã đóng thì không ghi điểm danh ───────────────────────
reset role;
update public.academic_years set status = 'closed', closed_at = now()
where id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;

select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-15', 'sunday')$$,
  '23514', 'ACADEMIC_YEAR_CLOSED',
  '🔴 nợ #18: năm học đã đóng thì GLV không mở buổi mới được'
);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, false)$$,
  '23514', 'ACADEMIC_YEAR_CLOSED',
  'nợ #18: buổi cũ trong năm đã đóng cũng không ghi thêm được'
);
select throws_ok(
  $$select public.takeover_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'))$$,
  '23514', 'ACADEMIC_YEAR_CLOSED',
  'nợ #18: tiếp quản cũng bị chặn — không có cửa sau nào'
);
-- D-117: Super Admin là ngoại lệ duy nhất, đúng WF-16 bước 5.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-15', 'sunday')$$,
  'D-117: Super Admin vẫn ghi được vào năm học đã đóng'
);

-- ── D-139 · Cha sở XEM được, nhưng KHÔNG ghi được ──────────────────────────
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000004', true);
select ok(
  (select count(*) from public.attendance_sessions
    where class_id = 'a6000000-0000-4000-8000-000000000001') > 0,
  'D-139: Cha sở đọc được buổi điểm danh của lớp (can_global_read có sẵn từ Phase 3)'
);
select throws_ok(
  $$select public.claim_attendance_session(
    'a6000000-0000-4000-8000-000000000001', '2075-09-15', 'sunday')$$,
  '42501', 'FORBIDDEN',
  '🔴 D-139: mở route KHÔNG mở quyền ghi — Cha sở vẫn không mở được buổi'
);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2075-09-05'),
    '[]'::jsonb, '[]'::jsonb, false)$$,
  '42501', 'FORBIDDEN',
  'D-139: Cha sở cũng không lưu được điểm danh'
);

-- Vì sao Thủ quỹ KHÔNG được mở route: cơ sở dữ liệu không cho họ đọc, nên
-- trang chỉ hiện một danh sách rỗng.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.attendance_sessions
    where class_id = 'a6000000-0000-4000-8000-000000000001'),
  0, 'Thủ quỹ đọc thẳng attendance_sessions vẫn ra 0 dòng — ranh giới cũ không nhúc nhích'
);

select * from finish();
rollback;
