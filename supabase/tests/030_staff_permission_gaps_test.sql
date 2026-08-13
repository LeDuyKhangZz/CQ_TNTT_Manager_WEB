begin;

select plan(12);

-- ============================================================================
-- M04-A — vá năm lỗ kiểm thử phân quyền của M04 mà `08_ACCEPTANCE_CRITERIA.md`
-- §"Tiêu chí bảo mật BẮT BUỘC XANH" đánh dấu ❌ **phải thêm**:
--
--   S2  `sector_leader` / `treasurer` không ghi được `staff_profiles`
--       và `class_staff_assignments` (RLS đòi `can_global_write`)
--   S3  non-global-write gọi `end_class_staff_assignment` → 42501
--       (trước đợt này CHỈ có nhánh THÀNH CÔNG được kiểm — `005:56-60`)
--   S4  `updated_by <> auth.uid()` khi INSERT/UPDATE → 42501
--   S8  phân công vào lớp không hoạt động → `CLASS_NOT_ACTIVE` (BR-S19)
--   S9  phân công lệch capacity so với vai trò lớp → `ROLE_CAPACITY_MISMATCH` (BR-S20)
--
-- Cả năm đều là lưới an toàn ĐANG TỒN TẠI ở DB nhưng chưa từng có bài kiểm nào
-- chạm tới. Không sửa gì ở DB trong file này — chỉ chứng minh lưới còn nguyên,
-- vì M04 sắp dựng thêm giao diện bấm vào đúng những lối đó.
--
-- Quy ước: thao tác chạy dưới JWT thật; kiểm chứng chạy sau `reset role` (RLS
-- cũng lọc câu SELECT kiểm chứng — xem ghi chú đầu file `029`).
-- ============================================================================

-- Người dùng ---------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'spg-gl@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'spg-sl@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('40000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'spg-tr@test.local',   crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('40000000-0000-4000-8000-000000000001', 'SPG_GL', 'Xứ đoàn trưởng'),
  ('40000000-0000-4000-8000-000000000002', 'SPG_SL', 'Trưởng ngành Ấu Nhi'),
  ('40000000-0000-4000-8000-000000000003', 'SPG_TR', 'Thủ quỹ');

-- Cấu trúc học vụ: một lớp hoạt động + một lớp đã đóng (cho S8) -------------
insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('4e000000-0000-4000-8000-000000000001', '2042-2043', 'Năm học SPG', '2042-09-01', '2043-05-31', '2048-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('4d000000-0000-4000-8000-000000000001', '4e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu SPG 1A', 'active'),
  ('4d000000-0000-4000-8000-000000000002', '4e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu SPG 2A', 'closed');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('4f000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'anh', 'Xứ Đoàn Trưởng SPG', '0900000201'),
  ('4f000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ngành SPG',   '0900000202'),
  ('4f000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'chi', 'Thủ Quỹ SPG',        '0900000203'),
  ('4f000000-0000-4000-8000-000000000004', null,                                   'so',  'Sơ Phân Công SPG',   '0900000204');

insert into public.role_assignments (profile_id, role) values
  ('40000000-0000-4000-8000-000000000001', 'group_leader'),
  ('40000000-0000-4000-8000-000000000003', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('40000000-0000-4000-8000-000000000002', 'sector_leader', '4e000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2042-09-01');

insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('4c000000-0000-4000-8000-000000000001', '4d000000-0000-4000-8000-000000000001', '4f000000-0000-4000-8000-000000000004', 'member', '2042-09-01');

set local role authenticated;

-- ==== S2 — Trưởng ngành không ghi được hồ sơ/phân công =====================
-- Nới quyền của D-105 là RPC `transfer_class_staff` và CHỈ nó. Ghi thẳng vào
-- hai bảng vẫn đòi `can_global_write` — bài này canh đúng ranh giới đó.
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.staff_profiles (title, full_name, phone, updated_by) values ('anh', 'SL Tạo Trộm', '0900000901', '40000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'S2: Trưởng ngành không tạo được hồ sơ nhân sự');
select throws_ok(
  $$insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on, updated_by) values ('4d000000-0000-4000-8000-000000000001', '4f000000-0000-4000-8000-000000000002', 'trainee', '2042-10-01', '40000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'S2: Trưởng ngành không tự chèn được phân công lớp');

-- ==== S2 — Thủ quỹ cũng không ghi được ====================================
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$insert into public.staff_profiles (title, full_name, phone, updated_by) values ('anh', 'TQ Tạo Trộm', '0900000902', '40000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'S2: Thủ quỹ không tạo được hồ sơ nhân sự');
-- 🔴 Ở ĐÂY RLS KHÔNG NÉM LỖI — và đó là điều phải ghi lại, không phải điều phải
-- che. Mệnh đề `using (app.can_global_write())` của policy UPDATE **lọc dòng**
-- chứ không từ chối lệnh: Thủ quỹ không "thấy" dòng nào để sửa nên lệnh chạm 0
-- dòng và trả về THÀNH CÔNG. Chỉ vi phạm `with check` mới ném 42501 (xem S4).
-- Đây chính là lý do `updateStaff` phải đếm số dòng thay đổi (SW-04): tin vào
-- "không có lỗi" là báo cho người dùng đã lưu xong trong khi chưa lưu gì cả.
select lives_ok(
  $$update public.staff_profiles set phone = '0900000999', updated_by = '40000000-0000-4000-8000-000000000003' where id = '4f000000-0000-4000-8000-000000000004'$$,
  'S2: lệnh sửa của Thủ quỹ KHÔNG ném lỗi — RLS lọc dòng im lặng');
-- Kiểm chứng "chạm 0 dòng" nằm dưới, sau `reset role`.

-- ==== S3 — non-global-write gọi end_class_staff_assignment ================
select throws_ok(
  $$select public.end_class_staff_assignment('4c000000-0000-4000-8000-000000000001', '2042-10-01')$$,
  '42501', 'FORBIDDEN', 'S3: Thủ quỹ không kết thúc được phân công');
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.end_class_staff_assignment('4c000000-0000-4000-8000-000000000001', '2042-10-01')$$,
  '42501', 'FORBIDDEN', 'S3: Trưởng ngành không kết thúc được phân công');

reset role;
select is(
  (select phone from public.staff_profiles where id = '4f000000-0000-4000-8000-000000000004'),
  '0900000204', 'S2: …nhưng chạm 0 dòng — hồ sơ không hề đổi (SW-04 phải đếm dòng)');
select is(
  (select count(*)::integer from public.class_staff_assignments
     where id = '4c000000-0000-4000-8000-000000000001' and is_active),
  1, 'S2/S3: sau sáu lần bị từ chối, phân công gốc không suy suyển');

-- ==== S4 — updated_by phải là chính người đang thao tác ====================
-- `with check (... and updated_by = auth.uid())`: không tin `updated_by` từ input.
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$insert into public.staff_profiles (title, full_name, phone, updated_by) values ('anh', 'Mạo Danh', '0900000903', '40000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'S4: không tạo được hồ sơ mang tên người khác ở updated_by');
select throws_ok(
  $$update public.staff_profiles set phone = '0900000904', updated_by = '40000000-0000-4000-8000-000000000002' where id = '4f000000-0000-4000-8000-000000000004'$$,
  '42501', null, 'S4: không sửa được hồ sơ rồi ghi công cho người khác');

-- ==== S8 / BR-S19 — không phân công vào lớp đã đóng ========================
reset role;
select throws_ok(
  $$insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values ('4d000000-0000-4000-8000-000000000002', '4f000000-0000-4000-8000-000000000002', 'member', '2042-10-01')$$,
  '23514', 'CLASS_NOT_ACTIVE', 'S8/BR-S19: không phân công được vào lớp không hoạt động');

-- ==== S9 / BR-S20 — phân công phải khớp vai trò lớp đang giữ ===============
-- Sơ …0004 chưa có tài khoản nên không có vai trò; dùng một hồ sơ CÓ vai trò lớp.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'spg-ct@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('40000000-0000-4000-8000-000000000004', 'SPG_CT', 'GLV lớp SPG');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('4f000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000004', 'anh', 'GLV Lớp SPG', '0900000205');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('4c000000-0000-4000-8000-000000000002', '4d000000-0000-4000-8000-000000000001', '4f000000-0000-4000-8000-000000000005', 'representative', '2042-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('40000000-0000-4000-8000-000000000004', 'class_representative', '4e000000-0000-4000-8000-000000000001', '4d000000-0000-4000-8000-000000000001', '2042-09-01');

-- Người đang là Đại diện lớp mà bị chèn phân công `member` ⇒ lệch capacity.
select throws_ok(
  $$update public.class_staff_assignments set capacity = 'member' where id = '4c000000-0000-4000-8000-000000000002'$$,
  '23514', 'ROLE_CAPACITY_MISMATCH', 'S9/BR-S20: phân công lệch vai trò lớp đang giữ bị chặn');

select * from finish();
rollback;
