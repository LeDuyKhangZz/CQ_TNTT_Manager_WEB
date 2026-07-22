begin;

-- P6-T5/P6-T6: view dashboard tôn trọng RLS của người đọc (security_invoker),
-- và snapshot báo cáo là bất biến, giữ đúng filter đã chọn (D-51/D-52).
select plan(26);

select has_view('public', 'v_dashboard_summary', 'view tổng quan tồn tại');
select has_view('public', 'v_students_at_risk', 'view thiếu nhi cần quan tâm tồn tại');
select has_view('public', 'v_upcoming_teaching_items', 'view buổi học sắp tới tồn tại');
select has_view('public', 'v_upcoming_celebrations', 'view sinh nhật/bổn mạng tồn tại');
select has_view('public', 'v_incomplete_student_profiles', 'view hồ sơ thiếu dữ liệu tồn tại');
select has_table('public', 'report_snapshots', 'bảng snapshot báo cáo tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f4000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rp-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rp-rep-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rp-rep-thieu@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rp-sector-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f4000000-0000-4000-8000-000000000001', 'RP_SEC', 'Thư ký báo cáo'),
  ('f4000000-0000-4000-8000-000000000002', 'RP_REP_AU', 'Đại diện Ấu 1A'),
  ('f4000000-0000-4000-8000-000000000003', 'RP_REP_TH', 'Đại diện Thiếu 1A'),
  ('f4000000-0000-4000-8000-000000000004', 'RP_SEC_AU', 'Trưởng ngành Ấu');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f5000000-0000-4000-8000-000000000001', '2092-2093', 'Năm báo cáo', '2092-09-01', '2093-05-31', 'draft', '2098-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('f5000000-0000-4000-8000-000000000011', 'f5000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A báo cáo'),
  ('f5000000-0000-4000-8000-000000000012', 'f5000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A báo cáo');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f5000000-0000-4000-8000-000000000021', 'f4000000-0000-4000-8000-000000000001', 'anh', 'Thư ký báo cáo', '0910000001'),
  ('f5000000-0000-4000-8000-000000000022', 'f4000000-0000-4000-8000-000000000002', 'anh', 'Đại diện Ấu 1A', '0910000002'),
  ('f5000000-0000-4000-8000-000000000023', 'f4000000-0000-4000-8000-000000000003', 'anh', 'Đại diện Thiếu 1A', '0910000003'),
  ('f5000000-0000-4000-8000-000000000024', 'f4000000-0000-4000-8000-000000000004', 'anh', 'Trưởng ngành Ấu', '0910000004');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('f5000000-0000-4000-8000-000000000011', 'f5000000-0000-4000-8000-000000000022', 'representative', '2092-09-01'),
  ('f5000000-0000-4000-8000-000000000012', 'f5000000-0000-4000-8000-000000000023', 'representative', '2092-09-01');
insert into public.role_assignments (profile_id, role) values
  ('f4000000-0000-4000-8000-000000000001', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f4000000-0000-4000-8000-000000000002', 'class_representative', 'f5000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000011'),
  ('f4000000-0000-4000-8000-000000000003', 'class_representative', 'f5000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000012');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('f4000000-0000-4000-8000-000000000004', 'sector_leader', 'f5000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');

insert into public.guardians (id, full_name, phone) values
  ('f5000000-0000-4000-8000-000000000031', 'Phụ huynh báo cáo', '0910000099');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth, patron_feast_date, address) values
  ('f5000000-0000-4000-8000-000000000041', 'f5000000-0000-4000-8000-000000000031', 'Maria', 'Em Ấu Một', 'female', '2016-01-01', '2016-08-15', '1 Trần Bình Trọng'),
  ('f5000000-0000-4000-8000-000000000042', 'f5000000-0000-4000-8000-000000000031', 'Anna', 'Em Ấu Hai', 'female', '2016-02-02', null, null),
  ('f5000000-0000-4000-8000-000000000043', 'f5000000-0000-4000-8000-000000000031', 'Gioan', 'Em Thiếu Một', 'male', '2013-03-03', '2013-06-24', '2 Trần Bình Trọng');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('f5000000-0000-4000-8000-000000000041', 'f5000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000011', 'active', '2092-09-01'),
  ('f5000000-0000-4000-8000-000000000042', 'f5000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000011', 'active', '2092-09-01'),
  ('f5000000-0000-4000-8000-000000000043', 'f5000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000012', 'active', '2092-09-01');

set local role authenticated;

-- security_invoker: cùng một view, mỗi vai trò cộng ra con số khác nhau.
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000001', true);
select is(
  (select student_count from public.v_dashboard_summary where academic_year_id = 'f5000000-0000-4000-8000-000000000001'),
  3, 'quyền toàn cục đếm đủ thiếu nhi trong năm');
select is(
  (select class_count from public.v_dashboard_summary where academic_year_id = 'f5000000-0000-4000-8000-000000000001'),
  2, 'quyền toàn cục đếm đủ lớp');

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000002', true);
select is(
  (select student_count from public.v_dashboard_summary where academic_year_id = 'f5000000-0000-4000-8000-000000000001'),
  2, 'đại diện lớp chỉ đếm được thiếu nhi lớp mình');

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
select is(
  (select student_count from public.v_dashboard_summary where academic_year_id = 'f5000000-0000-4000-8000-000000000001'),
  2, 'trưởng ngành chỉ đếm được thiếu nhi trong ngành mình');

-- Hồ sơ thiếu dữ liệu cũng đi theo phạm vi của người đọc.
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.v_incomplete_student_profiles),
  0, 'đại diện lớp Thiếu không thấy hồ sơ thiếu dữ liệu của lớp Ấu');
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.v_incomplete_student_profiles),
  1, 'đại diện lớp Ấu thấy đúng một hồ sơ thiếu dữ liệu');

-- Snapshot: quyền theo phạm vi (D-51/D-52).
select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Chốt lớp khác', 'f5000000-0000-4000-8000-000000000001', 'class',
      'f5000000-0000-4000-8000-000000000012', 'week', '2092-09-07', '2092-09-13',
      '{}'::jsonb, '{}'::jsonb, 'x', 'f4000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'không chốt được báo cáo cho lớp ngoài phạm vi');
select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Chốt toàn xứ đoàn', 'f5000000-0000-4000-8000-000000000001', 'global',
      null, 'year', '2092-09-01', '2093-05-31',
      '{}'::jsonb, '{}'::jsonb, 'x', 'f4000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'đại diện lớp không chốt được báo cáo toàn xứ đoàn');
select lives_ok(
  $$insert into public.report_snapshots (
      id, report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('f5000000-0000-4000-8000-000000000051', 'attendance', 'Chuyên cần tuần 1 — Ấu 1A',
      'f5000000-0000-4000-8000-000000000001', 'class', 'f5000000-0000-4000-8000-000000000011',
      'week', '2092-09-07', '2092-09-13',
      '{"periodType":"week","from":"2092-09-07","to":"2092-09-13"}'::jsonb,
      '{"rows":[{"className":"Ấu 1A báo cáo","studentCount":2}]}'::jsonb,
      'checksum-gia-tu-client', 'f4000000-0000-4000-8000-000000000003')$$,
  'đại diện lớp chốt được báo cáo lớp mình');
select is(
  (select generated_by from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  'f4000000-0000-4000-8000-000000000002'::uuid,
  'người chốt lấy từ phiên đăng nhập, không từ client');
select isnt(
  (select checksum from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  'checksum-gia-tu-client',
  'checksum do server tính lại');
select is(
  (select length(checksum) from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  64, 'checksum là SHA-256 hex');
select is(
  (select status from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  'final', 'snapshot luôn ở trạng thái final');

-- Bất biến: không có đường sửa/xóa cho người dùng thường.
select throws_ok(
  $$update public.report_snapshots set title = 'Sửa lại' where id = 'f5000000-0000-4000-8000-000000000051'$$,
  '42501', null, 'không sửa được snapshot đã chốt');
select throws_ok(
  $$delete from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'$$,
  '42501', null, 'không xóa được snapshot đã chốt');

-- Dữ liệu nguồn đổi về sau không làm đổi snapshot (D-51).
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$update public.enrollments set status = 'withdrawn', ended_on = '2092-10-01', updated_by = 'f4000000-0000-4000-8000-000000000001'
    where student_id = 'f5000000-0000-4000-8000-000000000042'$$,
  'rút một em khỏi lớp sau khi đã chốt báo cáo');
select is(
  (select payload_json -> 'rows' -> 0 ->> 'studentCount' from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  '2', 'snapshot giữ nguyên số liệu tại thời điểm chốt');
select is(
  (select filter_json ->> 'from' from public.report_snapshots where id = 'f5000000-0000-4000-8000-000000000051'),
  '2092-09-07', 'snapshot giữ nguyên filter đã chọn (D-52)');

-- Ngoài phạm vi thì không đọc được snapshot.
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.report_snapshots),
  0, 'đại diện lớp khác không đọc được snapshot lớp Ấu 1A');
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
select is(
  (select count(*)::integer from public.report_snapshots),
  1, 'trưởng ngành đọc được snapshot lớp trong ngành mình');

select * from finish();
rollback;
