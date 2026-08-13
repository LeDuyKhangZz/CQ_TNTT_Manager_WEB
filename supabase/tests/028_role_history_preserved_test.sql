begin;

-- ============================================================================
-- M01-C · D-101 (Q3) — Xóa tài khoản GIỮ lịch sử vai trò.
--   • FK `role_assignments.profile_id` đổi `on delete cascade` → `on delete set null`.
--   • Hai trigger liên kết (`validate_ownership_role_link`/`validate_staff_role_link`)
--     phải BỎ QUA dòng `profile_id` NULL, nếu không lệnh xóa tài khoản của một
--     GLV/phụ huynh đang có vai trò active sẽ bị chúng ném lỗi và hỏng luôn.
--   • RLS `role_assignments_select_self_or_global`: dòng mồ côi (profile_id NULL)
--     CHỈ nhóm đọc-toàn-cục thấy, người thường không thấy.
-- "Xóa tài khoản" = xóa `auth.users` (giống `admin.auth.admin.deleteUser`), cascade
-- xuống `profiles` rồi set-null các bảng con. Chèn fixture + xóa chạy dưới superuser
-- (đúng như app xóa bằng service role); phần RLS kiểm bằng JWT vai trò thật.
-- ============================================================================

select plan(17);

-- ==== Cấu trúc: FK set null + cột nullable ==================================
select col_is_null('public', 'role_assignments', 'profile_id',
  'profile_id cho phép NULL (dòng lịch sử mồ côi sau khi xóa tài khoản)');
select is(
  (select confdeltype from pg_constraint
     where conname = 'role_assignments_profile_id_fkey'
       and conrelid = 'public.role_assignments'::regclass),
  'n', 'FK profile_id dùng ON DELETE SET NULL (không còn cascade)');

-- ==== Fixture ==============================================================
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b0100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh-staff@test.local',    crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b0100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b0100000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh-staff2@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b0100000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh-priest@test.local',   crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b0100000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh-live-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b0100000-0000-4000-8000-000000000001', 'RH_STAFF',    'Thư ký sẽ bị xóa'),
  ('b0100000-0000-4000-8000-000000000002', 'RH_GUARDIAN', 'Phụ huynh sẽ bị xóa'),
  ('b0100000-0000-4000-8000-000000000003', 'RH_STAFF2',   'Thủ quỹ sẽ bị xóa'),
  ('b0100000-0000-4000-8000-000000000010', 'RH_PRIEST',   'Cha sở còn sống'),
  ('b0100000-0000-4000-8000-000000000011', 'RH_LIVEGRD',  'Phụ huynh còn sống');

-- Liên kết nghiệp vụ cần trước khi gắn vai trò active (các trigger đòi hỏi).
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('bf100000-0000-4000-8000-000000000001', 'b0100000-0000-4000-8000-000000000001', 'anh', 'Thư ký X', '0900000101'),
  ('bf100000-0000-4000-8000-000000000003', 'b0100000-0000-4000-8000-000000000003', 'anh', 'Thủ quỹ Y', '0900000103');
insert into public.guardians (profile_id, full_name, phone) values
  ('b0100000-0000-4000-8000-000000000002', 'Phụ huynh Z', '0900000102'),
  ('b0100000-0000-4000-8000-000000000011', 'Phụ huynh L', '0900000111');

-- Vai trò: RH_STAFF có 1 lịch sử INACTIVE + 1 active (chứng minh cả hai loại
-- dòng đều sống sót). Mỗi tài khoản bị xóa dùng một `role` riêng để tìm dòng mồ côi.
insert into public.role_assignments (profile_id, role, is_active, starts_on, ends_on) values
  ('b0100000-0000-4000-8000-000000000001', 'secretary', false, '2024-09-01', '2025-05-31');
insert into public.role_assignments (profile_id, role) values
  ('b0100000-0000-4000-8000-000000000001', 'secretary'),
  ('b0100000-0000-4000-8000-000000000002', 'guardian'),
  ('b0100000-0000-4000-8000-000000000003', 'treasurer'),
  ('b0100000-0000-4000-8000-000000000010', 'parish_priest'),
  ('b0100000-0000-4000-8000-000000000011', 'guardian');

-- 6 dòng vai trò tổng cộng; không dòng nào được biến mất qua ba lần xóa.
select is((select count(*)::integer from public.role_assignments), 6,
  'baseline: 6 dòng vai trò trước khi xóa');

-- ==== Xóa tài khoản STAFF (trigger staff link từng chặn) ====================
select lives_ok(
  $$delete from auth.users where id = 'b0100000-0000-4000-8000-000000000001'$$,
  'D-101: xóa tài khoản thư ký KHÔNG bị validate_staff_role_link chặn');
select is((select count(*)::integer from public.role_assignments), 6,
  'sau khi xóa thư ký: vẫn 6 dòng (không xóa dây chuyền)');
select is(
  (select count(*)::integer from public.role_assignments
     where role = 'secretary' and profile_id is null),
  2, 'AC-05.3: cả 2 dòng vai trò thư ký (active + lịch sử) còn lại với profile_id NULL');
select is(
  (select count(*)::integer from public.staff_profiles
     where id = 'bf100000-0000-4000-8000-000000000001' and profile_id is null),
  1, 'AC-05.3: hồ sơ nhân sự còn lại, chỉ bị bỏ link (profile_id NULL)');

-- ==== Xóa tài khoản GUARDIAN (trigger ownership link từng chặn) =============
select lives_ok(
  $$delete from auth.users where id = 'b0100000-0000-4000-8000-000000000002'$$,
  'D-101: xóa tài khoản phụ huynh KHÔNG bị validate_ownership_role_link chặn');
select is(
  (select count(*)::integer from public.guardians
     where full_name = 'Phụ huynh Z' and profile_id is null),
  1, 'AC-05.3: hồ sơ phụ huynh còn lại, chỉ bị bỏ link');
select is(
  (select count(*)::integer from public.role_assignments
     where role = 'guardian' and profile_id is null),
  1, 'lịch sử vai trò phụ huynh còn lại với profile_id NULL');

-- ==== Xóa tài khoản thứ hai có role active → hai dòng mồ côi cùng active =====
select lives_ok(
  $$delete from auth.users where id = 'b0100000-0000-4000-8000-000000000003'$$,
  'xóa tài khoản thủ quỹ được (dòng mồ côi active thứ hai)');
select is(
  (select count(*)::integer from public.role_assignments
     where is_active and profile_id is null),
  3, 'unique index (profile_id) where is_active cho phép nhiều dòng NULL cùng active (secretary+guardian+treasurer)');
select is((select count(*)::integer from public.role_assignments), 6,
  'sau ba lần xóa: vẫn đủ 6 dòng lịch sử vai trò');

-- ==== RLS: người thường KHÔNG thấy dòng mồ côi ==============================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0100000-0000-4000-8000-000000000011', true);
select is((select count(*)::integer from public.role_assignments), 1,
  'RLS: phụ huynh còn sống chỉ thấy vai trò của chính mình, KHÔNG thấy 4 dòng mồ côi');
select is(app.current_role()::text, 'guardian',
  'app.current_role() vẫn đúng (dòng mồ côi không phá resolver)');

-- ==== RLS: nhóm đọc-toàn-cục THẤY dòng mồ côi (giữ lịch sử cho quản trị) =====
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0100000-0000-4000-8000-000000000010', true);
select is(
  (select count(*)::integer from public.role_assignments where profile_id is null),
  4, 'RLS: Cha sở (đọc toàn cục) thấy đủ 4 dòng lịch sử mồ côi');
select is((select count(*)::integer from public.role_assignments), 6,
  'RLS: nhóm đọc toàn cục thấy toàn bộ lịch sử vai trò (mồ côi lẫn còn chủ)');

select * from finish();
rollback;
