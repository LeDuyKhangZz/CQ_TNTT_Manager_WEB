begin;

select plan(25);

-- ============================================================================
-- M04-A / D-105 — RPC `transfer_class_staff` (đóng M04-F06, 5W-06).
--
-- Kiểm bằng JWT thật (`set role authenticated` + `request.jwt.claim.sub`), không
-- dùng service role để giả người dùng — `app.can_manage_class` đọc vai trò từ
-- chính phiên gọi nên đây là cách duy nhất kiểm đúng ranh giới ngành.
--
-- 🔴 BẪY ĐÃ VẤP, ghi lại để phiên sau không mất thời gian: câu `select` KIỂM
-- CHỨNG cũng chạy dưới JWT đang đặt. RLS `role_assignments_select_self_or_global`
-- chỉ cho đọc dòng của chính mình hoặc người có quyền đọc toàn cục — mà Trưởng
-- ngành KHÔNG có quyền đó. Kiểm chứng ngay sau một thao tác của Trưởng ngành mà
-- quên `reset role` thì đếm ra 0 và bài test báo hỏng oan (tệ hơn: một bài
-- "không được thấy gì" sẽ XANH GIẢ). Quy ước trong file này: thao tác chạy dưới
-- JWT, kiểm chứng chạy sau `reset role`.
--
-- Dựng hai NGÀNH khác nhau vì D-105/D-107 chốt phạm vi theo ngành:
--   · Ngành Ấu Nhi    (10000000-…-0002) → Ấu TCS 1A · 2A · 3A
--   · Ngành Thiếu Nhi (10000000-…-0003) → Thiếu TCS 1A · Thiếu TCS Đóng
-- ============================================================================

select has_function('public', 'transfer_class_staff',
  array['uuid', 'uuid', 'class_staff_capacity', 'date'], 'RPC chuyển lớp tồn tại');
select is_definer('public', 'transfer_class_staff', 'RPC chuyển lớp chạy security definer');

-- Người dùng ---------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tcs-gl@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tcs-slau@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tcs-slth@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tcs-ct@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('30000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tcs-glv@test.local',  crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('30000000-0000-4000-8000-000000000001', 'TCS_GL',   'Xứ đoàn trưởng test'),
  ('30000000-0000-4000-8000-000000000002', 'TCS_SLAU', 'Trưởng ngành Ấu Nhi'),
  ('30000000-0000-4000-8000-000000000003', 'TCS_SLTH', 'Trưởng ngành Thiếu Nhi'),
  ('30000000-0000-4000-8000-000000000004', 'TCS_CT',   'GLV lớp thường'),
  ('30000000-0000-4000-8000-000000000010', 'TCS_GLV',  'GLV được chuyển lớp');

-- Cấu trúc học vụ ----------------------------------------------------------
insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('3e000000-0000-4000-8000-000000000001', '2041-2042', 'Năm học TCS', '2041-09-01', '2042-05-31', '2047-05-31');
-- `section_code` bắt buộc với ngành `allows_sections` (Ấu Nhi, Thiếu Nhi) —
-- trigger `validate_class_section` chặn nếu thiếu.
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('3d000000-0000-4000-8000-000000000001', '3e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu TCS 1A',      'active'),
  ('3d000000-0000-4000-8000-000000000002', '3e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu TCS 2A',      'active'),
  ('3d000000-0000-4000-8000-000000000003', '3e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000006', 'A', 'Ấu TCS 3A',      'active'),
  ('3d000000-0000-4000-8000-000000000004', '3e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu TCS 1A',   'active'),
  ('3d000000-0000-4000-8000-000000000005', '3e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000008', 'A', 'Thiếu TCS Đóng', 'closed');

-- Hồ sơ nhân sự ------------------------------------------------------------
--   · …0001 GLV: có tài khoản, đang là class_teacher lớp Ấu 1A → nhân vật chính
--   · …0002 Sơ: KHÔNG có tài khoản (BR-S09)
--   · …0003 Đại diện Ấu 3A → dựng va chạm "một Đại diện/lớp"
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('3f000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000010', 'anh', 'GLV Chuyển TCS',     '0900000110'),
  ('3f000000-0000-4000-8000-000000000002', null,                                   'so',  'Sơ Không Tài Khoản', '0900000111'),
  ('3f000000-0000-4000-8000-000000000003', null,                                   'chi', 'Đại Diện Ấu 3A',     '0900000112'),
  ('3f000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'anh', 'GLV Lớp Thường',     '0900000113'),
  ('3f000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ngành Ấu',    '0900000114'),
  ('3f000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000003', 'anh', 'Trưởng Ngành Thiếu', '0900000115'),
  ('3f000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000001', 'anh', 'Xứ Đoàn Trưởng TCS', '0900000116');

insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000001', '3f000000-0000-4000-8000-000000000001', 'member',         '2041-09-01'),
  ('3c000000-0000-4000-8000-000000000002', '3d000000-0000-4000-8000-000000000001', '3f000000-0000-4000-8000-000000000002', 'trainee',        '2041-09-01'),
  ('3c000000-0000-4000-8000-000000000003', '3d000000-0000-4000-8000-000000000003', '3f000000-0000-4000-8000-000000000003', 'representative', '2041-09-01'),
  ('3c000000-0000-4000-8000-000000000004', '3d000000-0000-4000-8000-000000000004', '3f000000-0000-4000-8000-000000000004', 'member',         '2041-09-01');

insert into public.role_assignments (profile_id, role) values
  ('30000000-0000-4000-8000-000000000001', 'group_leader');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('30000000-0000-4000-8000-000000000002', 'sector_leader', '3e000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2041-09-01'),
  ('30000000-0000-4000-8000-000000000003', 'sector_leader', '3e000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000003', '2041-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('30000000-0000-4000-8000-000000000010', 'class_teacher', '3e000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000001', '2041-09-01'),
  ('30000000-0000-4000-8000-000000000004', 'class_teacher', '3e000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000004', '2041-09-01');

-- ==== Chốt chặn quyền (D-105 / D-107) =====================================
set local role authenticated;

-- GLV lớp thường không nằm trong `can_manage_class` ⇒ bị chặn (cùng hình dạng S3).
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000002', 'member', '2041-11-01')$$,
  '42501', 'FORBIDDEN', 'D-105: GLV lớp không gọi được transfer_class_staff');

-- Trưởng ngành THIẾU NHI đụng vào hai lớp Ấu Nhi ⇒ bị chặn (lớp CŨ ngoài ngành).
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000002', 'member', '2041-11-01')$$,
  '42501', 'FORBIDDEN', 'D-107: Trưởng ngành Thiếu Nhi không chuyển được người của ngành Ấu Nhi');

-- Trưởng ngành ẤU NHI kéo người sang lớp ngành Thiếu Nhi ⇒ bị chặn (lớp MỚI ngoài ngành).
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000004', 'member', '2041-11-01')$$,
  '42501', 'FORBIDDEN', 'D-107: Trưởng ngành Ấu Nhi không đẩy được người sang lớp ngành khác');

-- ==== Chốt chặn dữ liệu ===================================================
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000001', 'member', '2041-11-01')$$,
  '23514', 'SAME_CLASS', 'chuyển về đúng lớp đang dạy bị chặn');

select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000002', 'member', '2041-08-01')$$,
  '23514', 'INVALID_EFFECTIVE_DATE', 'ngày hiệu lực trước ngày bắt đầu phân công cũ bị chặn');

select throws_ok(
  $$select public.transfer_class_staff('30000000-0000-4000-8000-000000000099', '3d000000-0000-4000-8000-000000000002', 'member', '2041-11-01')$$,
  'P0002', 'ASSIGNMENT_NOT_FOUND', 'phân công không tồn tại/đã kết thúc báo đúng mã');

-- ==== AC-04.3 — NGUYÊN TỬ: lỗi ở bước sau phải trả nguyên trạng ============
-- Lớp "Thiếu TCS Đóng" thuộc ngành Thiếu Nhi nên Trưởng ngành Ấu sẽ bị chặn ở
-- tầng quyền trước khi tới nhánh này ⇒ dùng Xứ đoàn trưởng để chạm được nó.
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000005', 'member', '2041-11-01')$$,
  '23514', 'CLASS_NOT_ACTIVE', 'không chuyển được vào lớp đã đóng');

-- Va chạm "một Đại diện/lớp": Ấu 3A đã có Đại diện đang hiệu lực. Lỗi rơi vào
-- BƯỚC 3 — tức sau khi hai lệnh khử active đã chạy — nên đây mới là bài kiểm
-- nguyên tử thật sự, không phải bài chặn-trước-khi-ghi.
select throws_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000003', 'representative', '2041-11-01')$$,
  '23505', null, 'lớp đã có Đại diện thì không nhận thêm Đại diện');

reset role;
select is(
  (select count(*)::integer from public.class_staff_assignments
     where id = '3c000000-0000-4000-8000-000000000001' and is_active),
  1, 'AC-04.3: sau lỗi ở bước 3, phân công cũ VẪN đang hiệu lực');
select is(
  (select count(*)::integer from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000010' and is_active
       and class_id = '3d000000-0000-4000-8000-000000000001'),
  1, 'AC-04.3: sau lỗi ở bước 3, vai trò đăng nhập lớp cũ VẪN đang hiệu lực');

-- ==== D-105 luồng thật — Trưởng ngành Ấu chuyển trong ngành mình ===========
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000001', '3d000000-0000-4000-8000-000000000002', 'member', '2041-11-01')$$,
  'D-105: Trưởng ngành Ấu Nhi chuyển được người trong ngành mình');

reset role;
-- AC-04.1 — không còn trạng thái zombie: đúng MỘT phân công và MỘT vai trò.
select is(
  (select count(*)::integer from public.class_staff_assignments
     where staff_profile_id = '3f000000-0000-4000-8000-000000000001' and is_active),
  1, 'AC-04.1: đúng một phân công đang hiệu lực sau khi chuyển');
select is(
  (select class_id::text from public.class_staff_assignments
     where staff_profile_id = '3f000000-0000-4000-8000-000000000001' and is_active),
  '3d000000-0000-4000-8000-000000000002', 'AC-04.1: phân công đang hiệu lực thuộc lớp mới');
select is(
  (select count(*)::integer from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000010' and is_active),
  1, 'AC-04.1: đúng một vai trò đăng nhập đang hiệu lực — KHÔNG zombie');
select is(
  (select class_id::text from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000010' and is_active),
  '3d000000-0000-4000-8000-000000000002', 'AC-04.1: vai trò đăng nhập đã theo sang lớp mới');
select is(
  (select ends_on::text from public.class_staff_assignments
     where id = '3c000000-0000-4000-8000-000000000001'),
  '2041-10-31', 'lịch sử giữ nguyên: phân công cũ đóng đúng ngày liền trước');
select is(
  (select count(*)::integer from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000010' and not is_active
       and class_id = '3d000000-0000-4000-8000-000000000001'),
  1, 'lịch sử giữ nguyên: vai trò lớp cũ còn lại dạng đã kết thúc');

-- Đổi vai trò trong lớp kéo theo đổi vai trò đăng nhập tương ứng.
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.transfer_class_staff(
      (select id from public.class_staff_assignments where staff_profile_id = '3f000000-0000-4000-8000-000000000001' and is_active),
      '3d000000-0000-4000-8000-000000000001', 'trainee', '2041-12-01')$$,
  'chuyển kèm đổi vai trò trong lớp chạy được');
reset role;
select is(
  (select role::text from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000010' and is_active),
  'trainee_assistant', 'vai trò đăng nhập đổi theo vai trò trong lớp (trainee ⇒ trainee_assistant)');

-- ==== Hồ sơ KHÔNG có tài khoản (BR-S09) — chuyển được, không sinh thẻ ======
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000002', '3d000000-0000-4000-8000-000000000002', 'trainee', '2041-11-01')$$,
  'BR-S09: hồ sơ không có tài khoản vẫn chuyển lớp được');
reset role;
select is(
  (select count(*)::integer from public.role_assignments as ra
     join public.staff_profiles as sp on sp.profile_id = ra.profile_id
     where sp.id = '3f000000-0000-4000-8000-000000000002'),
  0, 'BR-S09: chuyển lớp KHÔNG bịa ra tài khoản/vai trò cho hồ sơ không có tài khoản');

-- ==== Ghi chú 4 — người mang vai trò NGÀNH mà cũng đứng lớp ================
-- Trưởng ngành Ấu Nhi tự đứng lớp; chuyển lớp cho chính họ KHÔNG được hạ vai trò
-- `sector_leader` xuống vai trò lớp (`role_assignments_one_active_per_profile_idx`
-- chỉ cho một vai trò hiệu lực — hạ xuống là mất luôn quyền quản ngành).
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('3c000000-0000-4000-8000-000000000005', '3d000000-0000-4000-8000-000000000001', '3f000000-0000-4000-8000-000000000005', 'member', '2041-09-01');
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.transfer_class_staff('3c000000-0000-4000-8000-000000000005', '3d000000-0000-4000-8000-000000000003', 'member', '2041-11-01')$$,
  'chuyển lớp cho người đang mang vai trò ngành chạy được');
reset role;
select is(
  (select role::text from public.role_assignments
     where profile_id = '30000000-0000-4000-8000-000000000002' and is_active),
  'sector_leader', 'ghi chú 4: chuyển lớp KHÔNG hạ vai trò ngành xuống vai trò lớp');

select * from finish();
rollback;
