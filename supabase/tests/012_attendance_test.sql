begin;

-- P3-T1..P3-T5: điểm danh, đơn xin nghỉ, cảnh báo/điểm chuyên cần.
-- Phủ đúng checklist docs/07 §6 cộng phần RLS phụ huynh/thiếu nhi của Gate
-- Phase 3. Mọi khẳng định về quyền đều chạy dưới JWT thật (set_config
-- 'request.jwt.claim.sub'), không dùng service role.
--
-- Lịch dùng trong bài: năm học 2070-2071. 2070-09-04 là thứ Năm; 2070-09-07,
-- 2070-09-14, 2070-09-21 là các Chúa nhật liên tiếp.

select plan(67);

-- ── Nhân sự và dữ liệu nền ──────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't1-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't2-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't3-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g1-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g2-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's1-att@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'SA_ATT', 'Super Admin Att'),
  ('f1000000-0000-4000-8000-000000000002', 'T1_ATT', 'GLV Một'),
  ('f1000000-0000-4000-8000-000000000003', 'T2_ATT', 'GLV Hai'),
  ('f1000000-0000-4000-8000-000000000004', 'T3_ATT', 'GLV Thiếu'),
  ('f1000000-0000-4000-8000-000000000005', 'G1_ATT', 'Phụ huynh Một'),
  ('f1000000-0000-4000-8000-000000000006', 'G2_ATT', 'Phụ huynh Hai'),
  ('f1000000-0000-4000-8000-000000000007', 'S1_ATT', 'Thiếu nhi Một');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f0000000-0000-4000-8000-000000000001', '2070-2071', 'Năm điểm danh', '2070-09-01', '2071-05-31', 'draft', '2076-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Att'),
  ('f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Att');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'anh', 'GLV Một', '0921000002'),
  ('f7000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'chi', 'GLV Hai', '0921000003'),
  ('f7000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'anh', 'GLV Thiếu', '0921000004');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('f8000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000002', 'representative', '2070-09-01'),
  ('f8000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000003', 'member', '2070-09-01'),
  ('f8000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000004', 'member', '2070-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000005', 'Phụ huynh Một', '0921000005'),
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000006', 'Phụ huynh Hai', '0921000006');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('f3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000007', 'f2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Một', 'female', '2016-01-01'),
  ('f3000000-0000-4000-8000-000000000002', null, 'f2000000-0000-4000-8000-000000000002', 'Anna', 'Trò Hai', 'female', '2016-02-02'),
  ('f3000000-0000-4000-8000-000000000003', null, 'f2000000-0000-4000-8000-000000000002', 'Teresa', 'Trò Ba', 'female', '2015-03-03');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2070-09-01'),
  ('f4000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'active', '2070-09-01'),
  ('f4000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002', 'active', '2070-09-01');

-- Tài khoản thật luôn có một role active; thiếu nó thì ngay cả
-- `academic_years` cũng không đọc được và view thống kê rỗng.
insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000001', 'super_admin'),
  ('f1000000-0000-4000-8000-000000000005', 'guardian'),
  ('f1000000-0000-4000-8000-000000000006', 'guardian'),
  ('f1000000-0000-4000-8000-000000000007', 'student');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f1000000-0000-4000-8000-000000000002', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000003', 'class_teacher', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000004', 'class_teacher', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002');

-- Năm học mới phải tự có dòng trọng số, nếu không view sẽ mất sạch số liệu.
select is(
  (select count(*)::integer from public.attendance_weight_settings
    where academic_year_id = 'f0000000-0000-4000-8000-000000000001'),
  1, 'năm học mới tự sinh một dòng attendance_weight_settings'
);

set local role authenticated;

-- ── Quyền claim ─────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')$$,
  '42501', 'FORBIDDEN', 'GLV lớp khác không claim được buổi của lớp này'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')$$,
  '42501', 'FORBIDDEN', 'phụ huynh không claim được buổi điểm danh'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-05', 'thursday')$$,
  '23514', 'ATTENDANCE_INVALID_MEETING_DAY', 'ngày không đúng thứ bị từ chối (D-29)'
);

-- ── Claim, session duy nhất, mặc định present ───────────────────────────────
select ok(
  (select out_claimed from public.claim_attendance_session(
    'f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')),
  'GLV lớp claim được buổi mới'
);
select is(
  (select count(*)::integer from public.attendance_sessions
    where class_id = 'f6000000-0000-4000-8000-000000000001' and attendance_date = '2070-09-04'),
  1, 'chỉ một session cho (lớp, ngày, loại buổi)'
);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')),
  'chính editor claim lại vẫn thành công (idempotent)'
);
select is(
  (select count(*)::integer from public.attendance_sessions
    where class_id = 'f6000000-0000-4000-8000-000000000001' and attendance_date = '2070-09-04'),
  1, 'claim lần hai không tạo session thứ hai'
);
select is(
  (select count(*)::integer from public.student_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2070-09-04'
      and record.mass_status = 'present' and record.catechism_status = 'present'),
  2, 'roster được nạp với mặc định present cả Lễ và Giáo lý (D-31)'
);
select is(
  (select count(*)::integer from public.staff_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2070-09-04'),
  2, 'điểm danh GLV cũng được nạp sẵn cho cả hai GLV của lớp (D-35)'
);

-- Không ai ghi thẳng vào bảng được: mọi đường ghi đi qua RPC.
select throws_ok(
  $$insert into public.student_attendance_records (attendance_session_id, enrollment_id, class_id, student_id)
    values ((select id from public.attendance_sessions where attendance_date = '2070-09-04'),
            'f4000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001',
            'f3000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'GLV không insert trực tiếp vào student_attendance_records'
);
select throws_ok(
  $$update public.student_attendance_records set catechism_status = 'unexcused_absence'$$,
  '42501', null, 'GLV không update trực tiếp student_attendance_records'
);
select throws_ok(
  $$update public.attendance_sessions set status = 'completed'$$,
  '42501', null, 'GLV không update trực tiếp attendance_sessions'
);

-- ── Lease: người thứ hai bị chặn khi lease còn hiệu lực ─────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is(
  (select out_claimed from public.claim_attendance_session(
    'f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')),
  false, 'GLV thứ hai không giành được quyền khi lease còn hạn'
);
select is(
  (select out_editor_display_name from public.claim_attendance_session(
    'f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')),
  'GLV Một', 'người xem thấy tên editor đang giữ buổi'
);
select throws_ok(
  $$select public.takeover_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  '55006', 'LEASE_NOT_EXPIRED', 'chưa hết 15 phút thì không tiếp quản được (D-32)'
);
select throws_ok(
  $$select public.heartbeat_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  '55006', 'ATTENDANCE_ALREADY_CLAIMED', 'người không giữ buổi không heartbeat được'
);

-- Đẩy lease quá hạn bằng giờ DB (client không tự quyết định được).
reset role;
update public.attendance_sessions
set last_activity_at = now() - interval '20 minutes'
where attendance_date = '2070-09-04';
set local role authenticated;

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select ok(
  (select public.takeover_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04')) is not null),
  'hết lease thì GLV cùng lớp tiếp quản được'
);
select is(
  (select editing_by from public.attendance_sessions where attendance_date = '2070-09-04'),
  'f1000000-0000-4000-8000-000000000003'::uuid,
  'editor đã đổi sang người tiếp quản'
);

-- Editor cũ không được ghi đè sau khi bị tiếp quản.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'),
    '[]'::jsonb, '[]'::jsonb, false)$$,
  '55006', 'ATTENDANCE_ALREADY_CLAIMED', 'editor cũ không ghi đè được sau khi bị tiếp quản'
);

-- ── Lưu nháp: hai trạng thái độc lập ────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'),
    jsonb_build_array(jsonb_build_object(
      'enrollment_id', 'f4000000-0000-4000-8000-000000000001',
      'mass_status', 'present',
      'catechism_status', 'unexcused_absence',
      'note', 'Đi lễ rồi về')),
    jsonb_build_array(jsonb_build_object(
      'class_staff_assignment_id', 'f8000000-0000-4000-8000-000000000002',
      'status', 'excused_absence', 'note', 'bận')),
    false)$$,
  'editor hiện tại lưu nháp được'
);
select is(
  (select mass_status::text || '/' || catechism_status::text
   from public.student_attendance_records
   where enrollment_id = 'f4000000-0000-4000-8000-000000000001'),
  'present/unexcused_absence',
  'Thánh lễ và Giáo lý là hai trạng thái độc lập (D-30)'
);
select is(
  (select catechism_status::text from public.student_attendance_records
   where enrollment_id = 'f4000000-0000-4000-8000-000000000002'),
  'present', 'em không bị sửa vẫn giữ present, không hóa vắng'
);
select is(
  (select status::text from public.staff_attendance_records
   where class_staff_assignment_id = 'f8000000-0000-4000-8000-000000000002'),
  'excused_absence', 'điểm danh GLV lưu được ba trạng thái riêng (D-35)'
);
select is(
  (select status::text from public.attendance_sessions where attendance_date = '2070-09-04'),
  'in_progress', 'lưu nháp không tự chốt buổi'
);

-- Phụ huynh chưa thấy gì khi buổi chưa chốt.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.student_attendance_records),
  0, 'phụ huynh không đọc được điểm danh khi buổi chưa chốt'
);

-- ── Chốt buổi ───────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is(
  (select out_status::text from public.save_and_finalize_attendance(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'),
    '[]'::jsonb, '[]'::jsonb, true)),
  'completed', 'chốt buổi đưa trạng thái về completed'
);
select is(
  (select count(*)::integer from public.student_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2070-09-04'),
  2, 'chốt buổi có đủ roster'
);
select ok(
  (select locked_at = finalized_at + interval '3 days'
   from public.attendance_sessions where attendance_date = '2070-09-04'),
  'mốc khóa = thời điểm chốt + attendance_lock_days của năm học (D-33)'
);

-- Chốt lại lần nữa: không nhân đôi dòng, không đẩy lùi mốc khóa.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')$$,
  'buổi đã chốt nhưng chưa khóa vẫn claim lại để sửa được'
);
select is(
  (select count(*)::integer from public.student_attendance_records as record
    join public.attendance_sessions as session on session.id = record.attendance_session_id
    where session.attendance_date = '2070-09-04'),
  2, 'gửi lại không nhân đôi bản ghi (double-submit idempotent)'
);

-- ── Phụ huynh/thiếu nhi đọc bản đã chốt, và chỉ của mình ────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.student_attendance_records),
  1, 'phụ huynh chỉ thấy đúng bản ghi của con mình sau khi chốt'
);
select is(
  (select student_id from public.student_attendance_records),
  'f3000000-0000-4000-8000-000000000001'::uuid,
  'bản ghi phụ huynh thấy đúng là của con mình'
);
select is(
  (select count(*)::integer from public.staff_attendance_records),
  0, 'phụ huynh không đọc được điểm danh giáo lý viên'
);

-- Phụ huynh Hai cũng có con trong lớp này, nên phải thấy đúng một dòng — và
-- đúng dòng của con mình, không phải của con Phụ huynh Một.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select results_eq(
  $$select student_id from public.student_attendance_records$$,
  $$values ('f3000000-0000-4000-8000-000000000002'::uuid)$$,
  'phụ huynh khác chỉ thấy con mình, không thấy bản ghi của con nhà bên'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.student_attendance_records),
  1, 'thiếu nhi chỉ thấy bản ghi của chính mình'
);

-- ── Khóa sau 3 ngày ─────────────────────────────────────────────────────────
reset role;
update public.attendance_sessions
set finalized_at = now() - interval '4 days',
    locked_at = now() - interval '1 day',
    editing_by = null, editing_started_at = null
where attendance_date = '2070-09-04';
set local role authenticated;

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')$$,
  '42501', 'ATTENDANCE_LOCKED', 'quá 3 ngày thì GLV không sửa được nữa (D-33)'
);
select throws_ok(
  $$select public.takeover_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  '42501', 'ATTENDANCE_LOCKED', 'buổi đã khóa cũng không tiếp quản được'
);

-- Super Admin mở khóa, và sau đó chỉ Super Admin sửa được.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$select public.unlock_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  '42501', 'FORBIDDEN', 'phụ huynh không mở khóa được'
);
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.unlock_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  '42501', 'FORBIDDEN', 'GLV lớp không mở khóa được'
);
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.unlock_attendance_session(
    (select id from public.attendance_sessions where attendance_date = '2070-09-04'))$$,
  'Super Admin mở khóa được'
);
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.claim_attendance_session('f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')$$,
  '42501', 'ATTENDANCE_LOCKED', 'sau khi mở khóa, GLV thường vẫn không sửa được (D-33)'
);
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select ok(
  (select out_claimed from public.claim_attendance_session(
    'f6000000-0000-4000-8000-000000000001', '2070-09-04', 'thursday')),
  'Super Admin sửa được buổi vừa mở khóa'
);

-- ── Đơn xin nghỉ (WF-10) ────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$insert into public.absence_requests
     (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
   values ('f3000000-0000-4000-8000-000000000001',
           '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
           '2070-09-07', 'sunday', 'Về quê', 'f1000000-0000-4000-8000-000000000005')$$,
  'phụ huynh gửi đơn xin nghỉ cho con mình'
);
select is(
  (select class_id from public.absence_requests where student_id = 'f3000000-0000-4000-8000-000000000001'),
  'f6000000-0000-4000-8000-000000000001'::uuid,
  'lớp của đơn suy ra từ ghi danh đang mở, không tin giá trị client gửi'
);
select throws_ok(
  $$insert into public.absence_requests
     (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
   values ('f3000000-0000-4000-8000-000000000002',
           'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
           '2070-09-07', 'sunday', 'Xin nghỉ hộ', 'f1000000-0000-4000-8000-000000000005')$$,
  '42501', null, 'phụ huynh không gửi đơn cho con nhà người khác (docs/07 §5)'
);
select throws_ok(
  $$insert into public.absence_requests
     (student_id, class_id, academic_year_id, absence_date, meeting_type, reason, created_by)
   values ('f3000000-0000-4000-8000-000000000001',
           'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
           '2070-09-08', 'sunday', 'Sai thứ', 'f1000000-0000-4000-8000-000000000005')$$,
  '23514', null, 'đơn chỉ nhận buổi thứ Năm/Chúa nhật (D-29)'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select is(
  (select count(*)::integer from public.absence_requests),
  0, 'phụ huynh khác không đọc được đơn của nhà bên'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.absence_requests
    where class_id = 'f6000000-0000-4000-8000-000000000001' and status = 'pending'),
  1, 'GLV lớp thấy đơn đang chờ của lớp mình trước khi điểm danh'
);
select lives_ok(
  $$update public.absence_requests set status = 'acknowledged', staff_note = 'Đã nắm'
    where student_id = 'f3000000-0000-4000-8000-000000000001'$$,
  'GLV lớp ghi nhận đơn'
);
select ok(
  (select reviewed_by = 'f1000000-0000-4000-8000-000000000002'::uuid and reviewed_at is not null
   from public.absence_requests where student_id = 'f3000000-0000-4000-8000-000000000001'),
  'người ghi nhận lấy từ phiên đăng nhập, không tin client'
);
select throws_ok(
  $$update public.absence_requests set status = 'cancelled'
    where student_id = 'f3000000-0000-4000-8000-000000000001'$$,
  '42501', 'ABSENCE_STAFF_CANNOT_CANCEL', 'GLV không tự hủy đơn của phụ huynh'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select is(
  (select count(*)::integer from public.absence_requests),
  0, 'GLV lớp khác không đọc được đơn của lớp này'
);

-- Đơn không bao giờ tự sửa điểm danh (WF-10 bước 7).
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select is(
  (select catechism_status::text from public.student_attendance_records
   where enrollment_id = 'f4000000-0000-4000-8000-000000000001'),
  'unexcused_absence', 'đơn xin nghỉ không tự đổi bản ghi điểm danh đã có'
);

-- ── Cảnh báo và điểm chuyên cần ─────────────────────────────────────────────
-- Ba Chúa nhật liên tiếp: em Một vắng không phép cả ba, em Hai đi đủ.
reset role;
do $$
declare
  session_id uuid;
  meeting date;
begin
  foreach meeting in array array['2070-09-07'::date, '2070-09-14', '2070-09-21'] loop
    insert into public.attendance_sessions
      (class_id, academic_year_id, attendance_date, meeting_type, status, finalized_at, finalized_by, locked_at)
    values ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
            meeting, 'sunday', 'completed', now(), 'f1000000-0000-4000-8000-000000000002',
            now() + interval '3 days')
    returning id into session_id;
    insert into public.student_attendance_records
      (attendance_session_id, enrollment_id, class_id, student_id, mass_status, catechism_status)
    values (session_id, 'f4000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001',
            'f3000000-0000-4000-8000-000000000001', 'unexcused_absence', 'unexcused_absence'),
           (session_id, 'f4000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001',
            'f3000000-0000-4000-8000-000000000002', 'present', 'present');
  end loop;
end;
$$;
set local role authenticated;

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select is(
  (select sessions_counted from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  4, 'thống kê chỉ đếm buổi đã chốt'
);
select is(
  (select catechism_absence_streak from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  4, 'chuỗi vắng Giáo lý liên tiếp tính đúng'
);
select is(
  (select sunday_absence_streak from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  3, 'chuỗi Chúa nhật vắng lễ liên tiếp tính đúng (WF-06)'
);
select ok(
  (select warn_consecutive_absence and warn_consecutive_sunday and warn_low_rate
   from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  'em vắng nhiều bật đủ ba cờ cảnh báo theo ngưỡng năm học (D-58)'
);
select is(
  (select catechism_absence_streak from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000002'),
  0, 'em đi đủ có chuỗi vắng bằng 0'
);
select ok(
  (select not warn_consecutive_absence and not warn_low_rate
   from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000002'),
  'em đi đủ không bị cảnh báo'
);
-- Em Một: Lễ = present + 3 vắng không phép → (1 + 0 + 0 + 0)/4 = 0.25 → 2.50.
--         Giáo lý = 4 vắng không phép → 0 → 0.00.
select is(
  (select mass_attendance_score from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  2.50::numeric, 'điểm chuyên cần Thánh lễ = trung bình trọng số × 10 (D-59)'
);
select is(
  (select catechism_attendance_score from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  0.00::numeric, 'điểm chuyên cần Giáo lý tính riêng, không gộp với Thánh lễ (D-59)'
);
select is(
  (select mass_catechism_mismatch_count from public.v_student_attendance_summary
   where student_id = 'f3000000-0000-4000-8000-000000000001'),
  1, 'đếm được buổi lệch giữa Thánh lễ và Giáo lý (WF-06 điểm 4)'
);
select is(
  (select warned_student_count from public.v_class_attendance_summary
   where class_id = 'f6000000-0000-4000-8000-000000000001'),
  1, 'tổng hợp lớp đếm đúng số em bị cảnh báo'
);
select is(
  (select present_count from public.v_staff_attendance_summary
   where staff_profile_id = 'f7000000-0000-4000-8000-000000000003'),
  1, 'tổng hợp chuyên cần GLV đếm theo buổi đã chốt'
);

-- View dùng security_invoker: phụ huynh chỉ thấy dòng của con mình.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.v_student_attendance_summary),
  1, 'phụ huynh chỉ thấy thống kê của con mình'
);
select is(
  (select count(*)::integer from public.v_staff_attendance_summary),
  0, 'phụ huynh không thấy thống kê chuyên cần giáo lý viên'
);

select * from finish();
rollback;
