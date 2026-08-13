begin;

-- ============================================================================
-- M11-A — Báo cáo & Dashboard, đợt 1/3.
--
-- D-66  Cha sở/Cha phó XEM và TẢI được báo cáo, KHÔNG chốt được — ở CẢ BA phạm vi.
-- D-169 Ô "Lớp" của trang tổng quan đếm đúng phạm vi người xem.
-- Nợ #18 Năm học đã đóng thì không chốt thêm được (trừ Super Admin — D-117).
--
-- Chạy bằng JWT thật của từng vai (CLAUDE.md §4), không service role.
-- ============================================================================

select plan(38);

select has_function('app', 'can_read_report', array['text', 'uuid'],
  'D-66: quyền XEM báo cáo có tên riêng, tách khỏi quyền CHỐT');
select has_function('public', 'can_finalize_report', array['text', 'uuid'],
  'tầng giao diện có cửa sổ để HỎI luật chốt thay vì chép lại nó');

-- ── Dàn cảnh ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d1100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-admin@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-priest@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-chaplain@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-treasurer@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-sector-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-rep-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-rep-thieu@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1100000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rf-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('d1100000-0000-4000-8000-000000000001', 'RF_ADMIN', 'Quản trị báo cáo'),
  ('d1100000-0000-4000-8000-000000000002', 'RF_PRIEST', 'Cha sở báo cáo'),
  ('d1100000-0000-4000-8000-000000000003', 'RF_CHAPLAIN', 'Cha phó báo cáo'),
  ('d1100000-0000-4000-8000-000000000004', 'RF_SEC', 'Thư ký báo cáo'),
  ('d1100000-0000-4000-8000-000000000005', 'RF_TREASURER', 'Thủ quỹ báo cáo'),
  ('d1100000-0000-4000-8000-000000000006', 'RF_SECTOR_AU', 'Trưởng ngành Ấu'),
  ('d1100000-0000-4000-8000-000000000007', 'RF_REP_AU', 'Đại diện Ấu 1A'),
  ('d1100000-0000-4000-8000-000000000008', 'RF_REP_TH', 'Đại diện Thiếu 1A'),
  ('d1100000-0000-4000-8000-000000000009', '84991100009', 'Phụ huynh báo cáo');

-- Hai năm học: một năm còn ghi được (`draft`) và một năm ĐÃ ĐÓNG — nợ #18.
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('d1200000-0000-4000-8000-000000000001', '2096-2097', 'Năm báo cáo mở', '2096-09-01', '2097-05-31', 'draft', '2102-05-31'),
  ('d1200000-0000-4000-8000-000000000002', '2094-2095', 'Năm báo cáo đã đóng', '2094-09-01', '2095-05-31', 'closed', '2100-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('d1300000-0000-4000-8000-000000000001', 'd1200000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A báo cáo'),
  ('d1300000-0000-4000-8000-000000000002', 'd1200000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A báo cáo');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d1400000-0000-4000-8000-000000000004', 'd1100000-0000-4000-8000-000000000004', 'chi', 'Thư ký báo cáo', '0911100004'),
  ('d1400000-0000-4000-8000-000000000005', 'd1100000-0000-4000-8000-000000000005', 'chi', 'Thủ quỹ báo cáo', '0911100005'),
  ('d1400000-0000-4000-8000-000000000006', 'd1100000-0000-4000-8000-000000000006', 'anh', 'Trưởng ngành Ấu', '0911100006'),
  ('d1400000-0000-4000-8000-000000000007', 'd1100000-0000-4000-8000-000000000007', 'anh', 'Đại diện Ấu 1A', '0911100007'),
  ('d1400000-0000-4000-8000-000000000008', 'd1100000-0000-4000-8000-000000000008', 'anh', 'Đại diện Thiếu 1A', '0911100008');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('d1300000-0000-4000-8000-000000000001', 'd1400000-0000-4000-8000-000000000007', 'representative', '2096-09-01'),
  ('d1300000-0000-4000-8000-000000000002', 'd1400000-0000-4000-8000-000000000008', 'representative', '2096-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('d1500000-0000-4000-8000-000000000009', 'd1100000-0000-4000-8000-000000000009', 'Phụ huynh báo cáo', '0930011009');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth, patron_feast_date, address) values
  ('d1600000-0000-4000-8000-000000000001', 'd1500000-0000-4000-8000-000000000009', 'Maria', 'Em Ấu Một', 'female', '2016-01-01', '2016-08-15', '1 Trần Bình Trọng'),
  ('d1600000-0000-4000-8000-000000000002', 'd1500000-0000-4000-8000-000000000009', 'Anna', 'Em Ấu Hai', 'female', '2016-02-02', '2016-07-26', '1 Trần Bình Trọng'),
  ('d1600000-0000-4000-8000-000000000003', 'd1500000-0000-4000-8000-000000000009', 'Gioan', 'Em Thiếu Một', 'male', '2013-03-03', '2013-06-24', '1 Trần Bình Trọng');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('d1600000-0000-4000-8000-000000000001', 'd1200000-0000-4000-8000-000000000001', 'd1300000-0000-4000-8000-000000000001', 'active', '2096-09-01'),
  ('d1600000-0000-4000-8000-000000000002', 'd1200000-0000-4000-8000-000000000001', 'd1300000-0000-4000-8000-000000000001', 'active', '2096-09-01'),
  ('d1600000-0000-4000-8000-000000000003', 'd1200000-0000-4000-8000-000000000001', 'd1300000-0000-4000-8000-000000000002', 'active', '2096-09-01');

insert into public.role_assignments (profile_id, role) values
  ('d1100000-0000-4000-8000-000000000001', 'super_admin'),
  ('d1100000-0000-4000-8000-000000000002', 'parish_priest'),
  ('d1100000-0000-4000-8000-000000000003', 'chaplain'),
  ('d1100000-0000-4000-8000-000000000004', 'secretary'),
  ('d1100000-0000-4000-8000-000000000005', 'treasurer'),
  ('d1100000-0000-4000-8000-000000000009', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('d1100000-0000-4000-8000-000000000006', 'sector_leader', 'd1200000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('d1100000-0000-4000-8000-000000000007', 'class_representative', 'd1200000-0000-4000-8000-000000000001', 'd1300000-0000-4000-8000-000000000001'),
  ('d1100000-0000-4000-8000-000000000008', 'class_representative', 'd1200000-0000-4000-8000-000000000001', 'd1300000-0000-4000-8000-000000000002');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- D-66 · Hai câu hỏi, hai câu trả lời khác nhau cho CÙNG một người.
--
-- 🔴 Ba nhánh chứ không phải một: bản siết chỉ đổi nhánh `global` sẽ để Cha sở
-- chốt được ở phạm vi ngành và phạm vi lớp, vì `can_access_sector` /
-- `can_access_class` tự gọi `can_global_read()` bên trong.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000002', true);
select ok(app.can_read_report('global', null),
  'Cha sở VẪN xem được báo cáo toàn xứ đoàn (D-66 chỉ bỏ quyền chốt)');
select ok(not app.can_create_report('global', null),
  'Cha sở không chốt được báo cáo toàn xứ đoàn');
select ok(not app.can_create_report('sector', '10000000-0000-0000-0000-000000000002'),
  'Cha sở không chốt được ở phạm vi NGÀNH — nhánh dễ quên nhất');
select ok(not app.can_create_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Cha sở không chốt được ở phạm vi LỚP — nhánh dễ quên thứ hai');
select ok(not public.can_finalize_report('global', null),
  'và hàm bọc mà giao diện gọi trả về ĐÚNG câu ấy — nút "Chốt" không hiện cho Cha sở');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000003', true);
select ok(not app.can_create_report('global', null),
  'Cha phó không chốt được báo cáo toàn xứ đoàn');
select ok(app.can_read_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Cha phó vẫn xem được báo cáo của một lớp bất kỳ');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000004', true);
select ok(app.can_create_report('global', null),
  'Thư ký (nhóm ghi cấp xứ đoàn) chốt được báo cáo toàn xứ đoàn');
select ok(public.can_finalize_report('global', null),
  'và hàm bọc trả về cùng câu ấy — hai tầng không thể lệch nhau');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000006', true);
select ok(not app.can_create_report('global', null),
  'Trưởng ngành không chốt được báo cáo toàn xứ đoàn');
select ok(app.can_create_report('sector', '10000000-0000-0000-0000-000000000002'),
  'Trưởng ngành chốt được báo cáo ngành mình');
select ok(not app.can_create_report('sector', '10000000-0000-0000-0000-000000000003'),
  'Trưởng ngành Ấu không chốt được báo cáo ngành Thiếu');
select ok(app.can_create_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Trưởng ngành chốt được báo cáo lớp trong ngành mình');
select ok(not app.can_create_report('class', 'd1300000-0000-4000-8000-000000000002'),
  'Trưởng ngành Ấu không chốt được báo cáo lớp ngành Thiếu');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000007', true);
select ok(app.can_create_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Giáo lý viên đại diện chốt được báo cáo lớp mình');
select ok(not app.can_create_report('class', 'd1300000-0000-4000-8000-000000000002'),
  'Giáo lý viên đại diện không chốt được báo cáo lớp khác');
select ok(not app.can_create_report('global', null),
  'Giáo lý viên đại diện không chốt được báo cáo toàn xứ đoàn');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000005', true);
select ok(not app.can_create_report('global', null),
  'Thủ quỹ không chốt được báo cáo toàn xứ đoàn (D-19 vẫn đứng)');
select ok(not app.can_create_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Thủ quỹ không chốt được báo cáo một lớp');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000009', true);
select ok(not app.can_create_report('class', 'd1300000-0000-4000-8000-000000000001'),
  'Phụ huynh không chốt được báo cáo lớp của con');

-- ---------------------------------------------------------------------------
-- Đo ĐƯỜNG GHI THẬT, không chỉ đo hàm: policy mới có đứng không.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Cha sở chốt toàn xứ đoàn', 'd1200000-0000-4000-8000-000000000001',
      'global', null, 'year', '2096-09-01', '2097-05-31',
      '{}'::jsonb, '{"headers":[],"rows":[]}'::jsonb, 'x', 'd1100000-0000-4000-8000-000000000002')$$,
  '42501', null, 'Cha sở gọi thẳng cơ sở dữ liệu vẫn không chốt được (toàn xứ đoàn)');
select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Cha sở chốt một lớp', 'd1200000-0000-4000-8000-000000000001',
      'class', 'd1300000-0000-4000-8000-000000000001', 'year', '2096-09-01', '2097-05-31',
      '{}'::jsonb, '{"headers":[],"rows":[]}'::jsonb, 'x', 'd1100000-0000-4000-8000-000000000002')$$,
  '42501', null, 'Cha sở gọi thẳng cơ sở dữ liệu vẫn không chốt được (một lớp)');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$insert into public.report_snapshots (
      id, report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('d1700000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần năm 2096-2097',
      'd1200000-0000-4000-8000-000000000001', 'global', null, 'year', '2096-09-01', '2097-05-31',
      '{"scopeType":"global"}'::jsonb,
      '{"headers":["Lớp","Sĩ số"],"rows":[["Ấu 1A báo cáo",2]]}'::jsonb,
      'x', 'd1100000-0000-4000-8000-000000000004')$$,
  'Thư ký chốt được báo cáo toàn xứ đoàn của năm còn mở');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.report_snapshots
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  1, 'Cha sở ĐỌC được bản chốt người khác vừa tạo — quyền xem không bị siết theo');
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.report_snapshots
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  1, 'Cha phó ĐỌC được bản chốt — quyền tải file đi theo quyền đọc');
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000006', true);
select is(
  (select count(*)::integer from public.report_snapshots),
  0, 'Trưởng ngành vẫn KHÔNG đọc được bản chốt toàn xứ đoàn — phạm vi đọc không bị nới');

-- ---------------------------------------------------------------------------
-- Nợ #18 · năm học đã đóng. WF-16: chốt báo cáo (bước 3) đứng TRƯỚC khi đóng
-- năm (bước 4), và bước 5 nói "không cho ghi mới trừ Super Admin".
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$insert into public.report_snapshots (
      report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('attendance', 'Chốt muộn cho năm đã đóng', 'd1200000-0000-4000-8000-000000000002',
      'global', null, 'year', '2094-09-01', '2095-05-31',
      '{}'::jsonb, '{"headers":[],"rows":[]}'::jsonb, 'x', 'd1100000-0000-4000-8000-000000000004')$$,
  '42501', null, 'Thư ký không chốt thêm được báo cáo cho năm học đã đóng');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.report_snapshots (
      id, report_type, title, academic_year_id, scope_type, scope_id, period_type,
      period_start, period_end, filter_json, payload_json, checksum, generated_by)
    values ('d1700000-0000-4000-8000-000000000002', 'attendance', 'Chốt bù cho năm đã đóng',
      'd1200000-0000-4000-8000-000000000002', 'global', null, 'year', '2094-09-01', '2095-05-31',
      '{}'::jsonb, '{"headers":[],"rows":[]}'::jsonb, 'x', 'd1100000-0000-4000-8000-000000000001')$$,
  'Super Admin vẫn chốt bù được cho năm đã đóng (D-117 giữ nguyên)');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000004', true);
select is(
  (select count(*)::integer from public.report_snapshots
   where academic_year_id = 'd1200000-0000-4000-8000-000000000002'),
  1, 'hàng rào chỉ chặn TẠO bản chốt mới — đọc lại bản chốt của năm đã đóng vẫn được');

-- ---------------------------------------------------------------------------
-- D-169 · ô "Lớp" đếm đúng phạm vi. Bốn con số của trang tổng quan phải cùng
-- nói một chuyện.
-- ---------------------------------------------------------------------------
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  2, 'quyền toàn cục vẫn đếm đủ lớp — không hồi quy');
select is(
  (select student_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  3, 'quyền toàn cục vẫn đếm đủ thiếu nhi — không hồi quy');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000006', true);
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  1, 'Trưởng ngành Ấu đếm đúng số lớp NGÀNH MÌNH, không phải cả xứ đoàn');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000007', true);
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  1, 'Giáo lý viên đại diện Ấu 1A thấy 1 lớp chứ không phải toàn bộ danh mục lớp');
select is(
  (select student_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  2, 'và ô "Thiếu nhi" cạnh nó vẫn là 2 — hai con số nay cùng một phạm vi');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000008', true);
select is(
  (select class_count from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  1, 'Giáo lý viên đại diện Thiếu 1A cũng thấy đúng 1 lớp');

select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000009', true);
select is(
  (select coalesce(class_count, 0) from public.v_dashboard_summary
   where academic_year_id = 'd1200000-0000-4000-8000-000000000001'),
  0, 'phụ huynh không còn đọc được tổng số lớp toàn xứ đoàn qua view tổng quan');

select * from finish();
rollback;
