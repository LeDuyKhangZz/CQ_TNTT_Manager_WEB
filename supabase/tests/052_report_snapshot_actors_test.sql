begin;

-- ============================================================================
-- M11-C — Báo cáo & Dashboard, đợt 3/3.
--
-- TB-06 bước 2 / AC-B10: kho bản chốt hiện **người chốt**, và cửa sổ hẹp đưa
-- được cái tên ấy tới đúng hai nhóm mà RLS của `profiles` không cho đọc tên
-- người khác — Trưởng ngành và Giáo lý viên đại diện.
--
-- 🔴 Bộ kiểm đo cả **vế mở** lẫn **vế đóng**, và vế đóng có hai lớp:
--    (a) người gọi không đọc được bản chốt nào của một người ⇒ **không** thấy
--        tên người ấy (hàm này không phải danh bạ);
--    (b) đọc thẳng `public.profiles` **vẫn** 0 dòng như trước migration.
-- ============================================================================

select plan(13);

select has_function('public', 'list_report_snapshot_actors', array[]::text[],
  'TB-06: cửa sổ hẹp id → tên người chốt');

-- ── Dàn cảnh ────────────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d3100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-admin@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-treasurer@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-sector-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-sector-thieu@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-rep-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d3100000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('d3100000-0000-4000-8000-000000000001', 'SA_ADMIN', 'Quản trị Gioan'),
  ('d3100000-0000-4000-8000-000000000004', 'SA_SEC', 'Thư ký Maria Nguyễn'),
  ('d3100000-0000-4000-8000-000000000005', 'SA_TREASURER', 'Thủ quỹ kho bản chốt'),
  ('d3100000-0000-4000-8000-000000000006', 'SA_SECTOR_AU', 'Trưởng ngành Ấu'),
  ('d3100000-0000-4000-8000-000000000007', 'SA_SECTOR_TH', 'Trưởng ngành Thiếu'),
  ('d3100000-0000-4000-8000-000000000008', 'SA_REP_AU', 'Đại diện Ấu 1A'),
  ('d3100000-0000-4000-8000-000000000009', '84991300009', 'Phụ huynh kho bản chốt');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('d3200000-0000-4000-8000-000000000001', '2099-2100', 'Năm kho bản chốt', '2099-09-01', '2100-05-31', 'draft', '2105-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('d3300000-0000-4000-8000-000000000001', 'd3200000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A kho');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d3400000-0000-4000-8000-000000000004', 'd3100000-0000-4000-8000-000000000004', 'chi', 'Thư ký Maria Nguyễn', '0911300004'),
  ('d3400000-0000-4000-8000-000000000005', 'd3100000-0000-4000-8000-000000000005', 'chi', 'Thủ quỹ kho bản chốt', '0911300005'),
  ('d3400000-0000-4000-8000-000000000006', 'd3100000-0000-4000-8000-000000000006', 'anh', 'Trưởng ngành Ấu', '0911300006'),
  ('d3400000-0000-4000-8000-000000000007', 'd3100000-0000-4000-8000-000000000007', 'anh', 'Trưởng ngành Thiếu', '0911300007'),
  ('d3400000-0000-4000-8000-000000000008', 'd3100000-0000-4000-8000-000000000008', 'anh', 'Đại diện Ấu 1A', '0911300008');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('d3300000-0000-4000-8000-000000000001', 'd3400000-0000-4000-8000-000000000008', 'representative', '2099-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('d3500000-0000-4000-8000-000000000009', 'd3100000-0000-4000-8000-000000000009', 'Phụ huynh kho bản chốt', '0930013009');

insert into public.role_assignments (profile_id, role) values
  ('d3100000-0000-4000-8000-000000000001', 'super_admin'),
  ('d3100000-0000-4000-8000-000000000004', 'secretary'),
  ('d3100000-0000-4000-8000-000000000005', 'treasurer'),
  ('d3100000-0000-4000-8000-000000000009', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('d3100000-0000-4000-8000-000000000006', 'sector_leader', 'd3200000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('d3100000-0000-4000-8000-000000000007', 'sector_leader', 'd3200000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000003');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('d3100000-0000-4000-8000-000000000008', 'class_representative', 'd3200000-0000-4000-8000-000000000001', 'd3300000-0000-4000-8000-000000000001');

set local role authenticated;

-- Hai người chốt khác nhau, hai phạm vi khác nhau — đây là điều làm cho phép đo
-- "không phải danh bạ" có nghĩa: Trưởng ngành Ấu đọc được bản của lớp mình
-- (nên phải thấy tên Thư ký) và KHÔNG đọc được bản toàn xứ đoàn (nên không được
-- thấy tên Quản trị viên).
select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000004', true);
insert into public.report_snapshots (id, report_type, title, academic_year_id, scope_type, scope_id, period_type, period_start, period_end, filter_json, payload_json, checksum, generated_by) values
  ('d3a00000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần · Lớp Ấu 1A kho · 2099-09-01 – 2099-09-30', 'd3200000-0000-4000-8000-000000000001', 'class', 'd3300000-0000-4000-8000-000000000001', 'month', '2099-09-01', '2099-09-30', '{}'::jsonb, '{"headers":["Lớp"],"rows":[["Ấu 1A kho"]]}'::jsonb, 'x', 'd3100000-0000-4000-8000-000000000004');

select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000001', true);
insert into public.report_snapshots (id, report_type, title, academic_year_id, scope_type, scope_id, period_type, period_start, period_end, filter_json, payload_json, checksum, generated_by) values
  ('d3a00000-0000-4000-8000-000000000002', 'attendance', 'Chuyên cần · Toàn xứ đoàn · 2099-09-01 – 2100-05-31', 'd3200000-0000-4000-8000-000000000001', 'global', null, 'year', '2099-09-01', '2100-05-31', '{}'::jsonb, '{"headers":["Lớp"],"rows":[["Ấu 1A kho"]]}'::jsonb, 'y', 'd3100000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Vế MỞ — cái tên tới được đúng người cần nó.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000006', true);

select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  1, '🔴 Trưởng ngành thấy đúng MỘT người chốt — của bản chốt lớp trong ngành mình');

select is(
  (select display_name from public.list_report_snapshot_actors()),
  'Thư ký Maria Nguyễn',
  '…và đó là tên thật, không phải một ô trống trong im lặng');

select is(
  (select count(*)::integer from public.list_report_snapshot_actors()
   where display_name = 'Quản trị Gioan'),
  0, '🔴 nhưng KHÔNG thấy người chốt bản toàn xứ đoàn — hàm này không phải danh bạ');

select is(
  (select count(*)::integer from public.profiles
   where id = 'd3100000-0000-4000-8000-000000000004'),
  0, '🔴 và đọc thẳng `public.profiles` của chính người ấy vẫn 0 dòng — policy không bị nới');

select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000008', true);
select is(
  (select display_name from public.list_report_snapshot_actors()),
  'Thư ký Maria Nguyễn',
  'Giáo lý viên đại diện cũng nhận được tên người chốt bản của lớp mình');
select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  1, '…và cũng chỉ đúng một người');

-- ---------------------------------------------------------------------------
-- Vế ĐÓNG — ai không đọc được bản chốt thì không nhận được tên nào.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  0, '🔴 Trưởng ngành Thiếu không đọc được bản chốt nào ⇒ không nhận được tên nào');

select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000009', true);
select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  0, 'phụ huynh không nhận được tên nào');

select is(
  (select count(*)::integer from public.list_report_snapshot_actors()
   where display_name in ('Đại diện Ấu 1A', 'Trưởng ngành Ấu', 'Thủ quỹ kho bản chốt')),
  0, '🔴 người CHƯA TỪNG chốt báo cáo nào không bao giờ xuất hiện, dù người gọi có quyền gì');

-- ---------------------------------------------------------------------------
-- Vai trò đọc rộng vẫn thấy đủ — không hồi quy.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000004', true);
select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  2, 'Thư ký đọc được cả hai bản chốt nên thấy cả hai người chốt');

select set_config('request.jwt.claim.sub', 'd3100000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.list_report_snapshot_actors()),
  2, 'Thủ quỹ cũng thấy cả hai — D-170 cho họ đọc bản chốt, và kho bản chốt là một trang thật');

select is(
  (select count(*)::integer from public.profiles
   where id = 'd3100000-0000-4000-8000-000000000001'),
  0, '🔴 nhưng Thủ quỹ đọc thẳng `public.profiles` vẫn 0 dòng — ranh giới cũ không nhúc nhích');

select * from finish();
rollback;
