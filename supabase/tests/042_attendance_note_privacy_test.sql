begin;

-- ============================================================================
-- M05-B · D-75 (quyền cột) · TB-11/D-141 · TB-06.
--
-- Mọi khẳng định về quyền chạy dưới **JWT thật** (`request.jwt.claim.sub`).
-- `reset role` chỉ dùng để dựng bối cảnh bằng quyền superuser — đúng khuôn
-- `012` và `041`.
--
-- File RIÊNG chứ không thêm vào `012`/`041`: cả hai file ấy là mốc hồi quy của
-- các đợt trước và phải giữ nguyên màu xanh. 🔴 Đặc biệt `012:280-308` khẳng
-- định phụ huynh đọc được **đúng 1 dòng** `student_attendance_records` — D-75
-- không được phép làm đỏ bài đó, và bài 25 dưới đây khẳng định lại điều ấy
-- ngay trong file này để nói rõ rằng đó là chủ ý chứ không phải sót.
--
-- Lịch dùng trong bài: năm học 2080-2081. 2080-09-05 là thứ Năm; 2080-09-08 là
-- Chúa nhật.
-- ============================================================================

select plan(35);

-- ── D-75 · quyền cột, kiểm ở tầng danh mục hệ thống ────────────────────────
select has_function(
  'public', 'attendance_session_notes', array['uuid'],
  'D-75: có cửa sổ hẹp để nhân sự đọc ghi chú'
);
select ok(
  has_function_privilege('authenticated', 'public.attendance_session_notes(uuid)', 'execute'),
  'authenticated gọi được cửa sổ hẹp'
);
select ok(
  not has_function_privilege('anon', 'public.attendance_session_notes(uuid)', 'execute'),
  'anon KHÔNG gọi được cửa sổ hẹp (revoke from public)'
);

-- 🔴 Quyền mức BẢNG phải mất hẳn: chừng nào nó còn, Postgres bỏ qua mọi giới
-- hạn mức cột và cả migration này không đổi được gì.
select ok(
  not has_table_privilege('authenticated', 'public.student_attendance_records', 'select'),
  'D-75: authenticated không còn quyền select MỨC BẢNG (điều kiện cần của quyền cột)'
);
select ok(
  not has_column_privilege('authenticated', 'public.student_attendance_records', 'note', 'select'),
  '🔴 D-75: không tài khoản thường nào đọc được cột ghi chú'
);
select ok(
  has_column_privilege('authenticated', 'public.student_attendance_records', 'mass_status', 'select'),
  'các cột còn lại vẫn đọc được — siết đúng một cột, không siết cả bảng'
);

-- 🔴 Lưới cho phiên sau: quyền cột KHÔNG tự mở rộng. Thêm cột mới mà quên
-- `grant select (cột_mới)` thì bài này đỏ và in ra đúng tên cột bị bỏ quên.
select is(
  (select string_agg(item.column_name, ', ' order by item.column_name)
   from information_schema.columns as item
   where item.table_schema = 'public'
     and item.table_name = 'student_attendance_records'
     and item.column_name <> 'note'
     and not has_column_privilege(
       'authenticated', 'public.student_attendance_records', item.column_name, 'select')),
  null,
  'mọi cột KHÁC `note` đều đã được cấp quyền (bẫy "thêm cột mới quên grant")'
);

-- ── Fixture (superuser bypass RLS) ─────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b5000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'glv1-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b5000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'glv3-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b5000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chaso-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b5000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ph1-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b5000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ph2-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b5000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tn1-m05b@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('b5000000-0000-4000-8000-000000000001', 'GLV1_M05B', 'GLV Một M05B'),
  ('b5000000-0000-4000-8000-000000000002', 'GLV3_M05B', 'GLV Lớp Khác M05B'),
  ('b5000000-0000-4000-8000-000000000003', 'CHASO_M05B', 'Cha sở M05B'),
  ('b5000000-0000-4000-8000-000000000004', 'PH1_M05B', 'Phụ huynh Một M05B'),
  ('b5000000-0000-4000-8000-000000000005', 'PH2_M05B', 'Phụ huynh Hai M05B'),
  ('b5000000-0000-4000-8000-000000000006', 'TN1_M05B', 'Thiếu nhi Một M05B');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('b0000000-0000-4000-8000-000000000001', '2080-2081', 'Năm M05B', '2080-09-01', '2081-05-31', 'draft', '2086-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A M05B'),
  ('b6000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A M05B');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('b7000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001', 'anh', 'GLV Một M05B', '0952000001'),
  ('b7000000-0000-4000-8000-000000000002', 'b5000000-0000-4000-8000-000000000002', 'chi', 'GLV Lớp Khác M05B', '0952000002');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('b8000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'representative', '2080-09-01'),
  ('b8000000-0000-4000-8000-000000000002', 'b6000000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000002', 'member', '2080-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('b2000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000004', 'Phụ huynh Một M05B', '0952000004'),
  ('b2000000-0000-4000-8000-000000000002', 'b5000000-0000-4000-8000-000000000005', 'Phụ huynh Hai M05B', '0952000005');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('b3000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000006', 'b2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Một M05B', 'female', '2016-01-01'),
  ('b3000000-0000-4000-8000-000000000002', null, 'b2000000-0000-4000-8000-000000000002', 'Anna', 'Trò Hai M05B', 'female', '2016-02-02'),
  ('b3000000-0000-4000-8000-000000000003', null, 'b2000000-0000-4000-8000-000000000002', 'Teresa', 'Trò Ba M05B', 'female', '2016-03-03');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('b4000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('b4000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2080-09-01'),
  ('b4000000-0000-4000-8000-000000000003', 'b3000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'active', '2080-09-01');

insert into public.role_assignments (profile_id, role) values
  ('b5000000-0000-4000-8000-000000000003', 'parish_priest'),
  ('b5000000-0000-4000-8000-000000000004', 'guardian'),
  ('b5000000-0000-4000-8000-000000000005', 'guardian'),
  ('b5000000-0000-4000-8000-000000000006', 'student');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('b5000000-0000-4000-8000-000000000001', 'class_representative', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b5000000-0000-4000-8000-000000000002', 'class_teacher', 'b0000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000002');

set local role authenticated;

-- ── Buổi thứ Năm: chốt kèm một ghi chú nội bộ ──────────────────────────────
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'b6000000-0000-4000-8000-000000000001', '2080-09-05', 'thursday')),
  'GLV lớp mở được buổi thứ Năm'
);
select is(
  (select out_status::text from public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2080-09-05'),
    jsonb_build_array(jsonb_build_object(
      'enrollment_id', 'b4000000-0000-4000-8000-000000000001',
      'mass_status', 'excused_absence',
      'catechism_status', 'excused_absence',
      'note', 'Nhà có tang, mẹ báo trước')),
    '[]'::jsonb, true)),
  'completed', 'chốt buổi kèm ghi chú nội bộ'
);

-- Cất id buổi thứ Năm vào một GUC của giao dịch. Cần cho bài 31: một Giáo lý
-- viên lớp KHÁC không đọc được `attendance_sessions` của lớp này, nên câu
-- `(select id from ... where attendance_date = …)` viết trong bài của họ trả
-- **null** và hàm báo RESOURCE_NOT_FOUND trước khi kịp tới cổng phân quyền —
-- bài xanh vì lý do sai. Truyền thẳng id mới kiểm được đúng nhánh FORBIDDEN.
reset role;
select set_config(
  'm05b.session_thursday',
  (select id::text from public.attendance_sessions where attendance_date = '2080-09-05'),
  true
);
set local role authenticated;

-- ── TB-11 / D-141 · chặn theo TRẠNG THÁI BUỔI, không theo ngày ─────────────
-- (a) Chưa có buổi nào cho ngày đó.
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$insert into public.absence_requests
      (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
    values ('b3000000-0000-4000-8000-000000000001',
            'b6000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-000000000001',
            '2080-09-08', 'sunday', 'Cháu về quê',
            'b5000000-0000-4000-8000-000000000004')$$,
  'phụ huynh gửi được đơn cho buổi chưa mở'
);

-- (b) Buổi đã mở nhưng CHƯA chốt — lý do vẫn còn kịp đổi "vắng không phép"
--     thành "vắng có phép", nên đơn vẫn phải nhận. Đây chính là ca mà phương
--     án "chặn mọi ngày quá khứ" của U-09 sẽ cắt mất (D-141).
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'b6000000-0000-4000-8000-000000000001', '2080-09-08', 'sunday')),
  'GLV mở buổi Chúa nhật'
);
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$insert into public.absence_requests
      (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
    values ('b3000000-0000-4000-8000-000000000002',
            'b6000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-000000000001',
            '2080-09-08', 'sunday', 'Cháu sốt từ sáng',
            'b5000000-0000-4000-8000-000000000005')$$,
  '🔴 D-141: buổi ĐANG MỞ vẫn nhận đơn — báo muộn vài giờ vẫn kịp'
);

-- (c) Chốt xong thì đơn mới thành rác.
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select is(
  (select out_status::text from public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2080-09-08'),
    '[]'::jsonb, '[]'::jsonb, true)),
  'completed', 'chốt buổi Chúa nhật'
);
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$insert into public.absence_requests
      (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
    values ('b3000000-0000-4000-8000-000000000003',
            'b6000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-000000000001',
            '2080-09-08', 'sunday', 'Cháu đi đám cưới',
            'b5000000-0000-4000-8000-000000000005')$$,
  '23514', 'ABSENCE_SESSION_ALREADY_FINALIZED',
  '🔴 TB-11: buổi ĐÃ CHỐT thì không nhận đơn nữa'
);

-- Chỉ áp cho INSERT: hai đơn gửi trước khi chốt vẫn còn nguyên.
reset role;
select is(
  (select count(*)::integer from public.absence_requests
    where absence_date = '2080-09-08' and status = 'pending'),
  2, 'hàng rào chỉ áp cho đơn MỚI — đơn cũ không bị hỏng'
);
set local role authenticated;

-- ── TB-06 · Giáo lý viên ghi nhận đơn ──────────────────────────────────────
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$update public.absence_requests
      set status = 'acknowledged', staff_note = 'Đã nắm, cảm ơn chị.'
    where student_id = 'b3000000-0000-4000-8000-000000000002'$$,
  'TB-06: GLV của lớp ghi nhận được đơn'
);
select is(
  (select status::text from public.absence_requests
    where student_id = 'b3000000-0000-4000-8000-000000000002'),
  'acknowledged', 'AC-F13-2: trạng thái "Đã ghi nhận" nay ĐẠT TỚI ĐƯỢC từ tài khoản thật'
);
select is(
  (select reviewed_by from public.absence_requests
    where student_id = 'b3000000-0000-4000-8000-000000000002'),
  'b5000000-0000-4000-8000-000000000001'::uuid,
  'reviewed_by do trigger đặt từ phiên đăng nhập, không nhận từ client'
);
select ok(
  (select reviewed_at is not null from public.absence_requests
    where student_id = 'b3000000-0000-4000-8000-000000000002'),
  'reviewed_at do server đặt'
);
select is(
  (select staff_note from public.absence_requests
    where student_id = 'b3000000-0000-4000-8000-000000000002'),
  'Đã nắm, cảm ơn chị.', 'lời nhắn cho phụ huynh lưu được'
);
-- AC-F13-3: ghi nhận đơn KHÔNG đụng vào điểm danh (D-36).
select is(
  (select mass_status::text from public.student_attendance_records
    where student_id = 'b3000000-0000-4000-8000-000000000002'
      and attendance_session_id = (
        select id from public.attendance_sessions where attendance_date = '2080-09-08')),
  'present', 'AC-F13-3: ghi nhận đơn KHÔNG tự sửa điểm danh'
);

-- ── D-75 · ai đọc được ghi chú, ai không ───────────────────────────────────
select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.student_attendance_records
    where class_id = 'b6000000-0000-4000-8000-000000000001'
      and attendance_session_id = (
        select id from public.attendance_sessions where attendance_date = '2080-09-05')),
  3, 'GLV vẫn đọc được các dòng điểm danh của lớp mình'
);
select throws_ok(
  $$select note from public.student_attendance_records limit 1$$,
  '42501', null,
  '🔴 D-75: ngay cả GLV cũng KHÔNG đọc thẳng cột ghi chú — chỉ còn một đường'
);
select is(
  (select notes.note from public.attendance_session_notes(
     (select id from public.attendance_sessions where attendance_date = '2080-09-05')) as notes),
  'Nhà có tang, mẹ báo trước', 'GLV đọc ghi chú qua cửa sổ hẹp'
);

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000004', true);
select is(
  (select count(*)::integer from public.student_attendance_records),
  2, 'AC-F14 GIỮ NGUYÊN: phụ huynh vẫn đọc đúng dòng của con mình (2 buổi đã chốt)'
);
select throws_ok(
  $$select note from public.student_attendance_records limit 1$$,
  '42501', null,
  '🔴 D-75: phụ huynh gọi thẳng Data API bị TỪ CHỐI, không phải nhận ô trống'
);
select throws_ok(
  $$select * from public.attendance_session_notes(
      (select id from public.attendance_sessions where attendance_date = '2080-09-05'))$$,
  '42501', 'FORBIDDEN',
  'D-75: phụ huynh không lách được qua cửa sổ hẹp'
);
-- Thẻ tổng kết chuyên cần của cổng phụ huynh phải còn nguyên — đây là thứ sẽ
-- gãy nếu ai đó chữa D-75 bằng cách cắt nhánh phụ huynh khỏi policy.
select is(
  (select sessions_counted::integer from public.v_student_attendance_summary
    where student_id = 'b3000000-0000-4000-8000-000000000001'),
  2, 'cổng phụ huynh KHÔNG gãy: thẻ chuyên cần vẫn cộng đủ 2 buổi'
);

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000006', true);
select throws_ok(
  $$select * from public.attendance_session_notes(
      (select id from public.attendance_sessions where attendance_date = '2080-09-05'))$$,
  '42501', 'FORBIDDEN',
  'D-75: thiếu nhi cũng không đọc được ghi chú về chính mình'
);

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000003', true);
select is(
  (select notes.note from public.attendance_session_notes(
     (select id from public.attendance_sessions where attendance_date = '2080-09-05')) as notes),
  'Nhà có tang, mẹ báo trước',
  'Cha sở (can_global_read, D-139) đọc được ghi chú — D-75 chỉ siết phía phụ huynh'
);

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select * from public.attendance_session_notes(
      current_setting('m05b.session_thursday')::uuid)$$,
  '42501', 'FORBIDDEN',
  'GLV lớp khác cầm ĐÚNG id buổi vẫn không đọc được ghi chú lớp này'
);
select is(
  (select count(*)::integer from public.absence_requests),
  0, 'AC-F13-1: GLV lớp khác không thấy đơn xin nghỉ của lớp này'
);

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select * from public.attendance_session_notes('b9000000-0000-4000-8000-0000000000ff')$$,
  '23503', 'RESOURCE_NOT_FOUND',
  'cửa sổ hẹp báo đúng khi buổi không tồn tại'
);

-- ── Nợ #18 · năm học đã đóng thì không nhận đơn xin nghỉ mới ───────────────
-- Khác M05-A: bảng này ghi THẲNG qua policy, nên hàng rào đặt được vào policy
-- và `42501` mới là câu trả lời đúng (không phải một mã do trigger ném).
reset role;
update public.academic_years set status = 'closed', closed_at = now()
where id = 'b0000000-0000-4000-8000-000000000001';
set local role authenticated;

select set_config('request.jwt.claim.sub', 'b5000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$insert into public.absence_requests
      (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
    values ('b3000000-0000-4000-8000-000000000001',
            'b6000000-0000-4000-8000-000000000001',
            'b0000000-0000-4000-8000-000000000001',
            '2080-09-15', 'sunday', 'Cháu bận',
            'b5000000-0000-4000-8000-000000000004')$$,
  '42501', null,
  '🔴 nợ #18: năm học đã đóng thì không gửi đơn xin nghỉ mới được'
);
-- 🔴 Hàng rào ở `using` **lọc dòng trong im lặng**, không ném lỗi — khác hẳn
-- `with check`. Vì vậy bài này đo *kết quả*, không đo ngoại lệ: viết
-- `throws_ok` ở đây là một bài xanh giả, vì UPDATE 0 dòng cũng "không ném".
update public.absence_requests set status = 'cancelled'
where student_id = 'b3000000-0000-4000-8000-000000000001';
select is(
  (select status::text from public.absence_requests
    where student_id = 'b3000000-0000-4000-8000-000000000001'),
  'pending',
  'nợ #18: hàng rào có ở CẢ `using` — đơn của năm đã đóng không rút được nữa'
);

select * from finish();
rollback;
