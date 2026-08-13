begin;

select plan(16);

-- ============================================================================
-- M01-B / TB-05 — RPC `assign_primary_role` + BR-A17 (role lớp cần phân công).
-- Kiểm bằng JWT thật (set role authenticated + request.jwt.claim.sub), không dùng
-- service role để giả người dùng. Các bước chèn trực tiếp role_assignments chạy
-- dưới `reset role` (superuser bỏ qua RLS) vì bảng không cấp INSERT cho
-- authenticated — trigger vẫn thi hành, đó chính là điều đang kiểm.
-- ============================================================================

select has_function('public', 'assign_primary_role', 'RPC đổi vai trò nguyên tử tồn tại');
select is_definer('public', 'assign_primary_role', 'RPC đổi vai trò chạy security definer');

-- Người dùng ---------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'apr-sa@test.local',     crypt('x', gen_salt('bf')), now(), now(), now()),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'apr-sa2@test.local',    crypt('x', gen_salt('bf')), now(), now(), now()),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'apr-priest@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('10000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'apr-glv@test.local',    crypt('x', gen_salt('bf')), now(), now(), now()),
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'apr-glv2@test.local',   crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('10000000-0000-4000-8000-000000000001', 'APR_SA',     'Super Admin test'),
  ('10000000-0000-4000-8000-000000000002', 'APR_SA2',    'Super Admin đích'),
  ('10000000-0000-4000-8000-000000000003', 'APR_PRIEST', 'Cha sở test'),
  ('10000000-0000-4000-8000-000000000010', 'APR_GLV',    'GLV chuyển lớp'),
  ('10000000-0000-4000-8000-000000000011', 'APR_GLV2',   'GLV BR-A17');

-- Cấu trúc học vụ ----------------------------------------------------------
insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('ae100000-0000-4000-8000-000000000001', '2040-2041', 'Năm học APR', '2040-09-01', '2041-05-31', '2046-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('ad100000-0000-4000-8000-000000000001', 'ae100000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ấu Test A'),
  ('ad100000-0000-4000-8000-000000000002', 'ae100000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000002', 'Thiếu Test B');

-- Hồ sơ nhân sự ------------------------------------------------------------
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('af100000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000010', 'anh', 'GLV Chuyển Lớp', '0900000010'),
  ('af100000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000011', 'anh', 'GLV BR A17',     '0900000011');

-- Vai trò nền: 2 Super Admin, 1 Cha sở, GLV đang là class_teacher lớp A ------
insert into public.role_assignments (profile_id, role) values
  ('10000000-0000-4000-8000-000000000001', 'super_admin'),
  ('10000000-0000-4000-8000-000000000002', 'super_admin'),
  ('10000000-0000-4000-8000-000000000003', 'parish_priest');
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('ac100000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001', 'af100000-0000-4000-8000-000000000001', 'member', '2040-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('10000000-0000-4000-8000-000000000010', 'class_teacher', 'ae100000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001', '2040-09-01');

-- ==== Chốt chặn quyền + trần vai trò (JWT thật) ============================
set local role authenticated;

-- AC-04.3 / S8 — non-SA (Cha sở) bị từ chối.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000010', 'class_teacher', '2040-10-01', 'ae100000-0000-4000-8000-000000000001', null, 'ad100000-0000-4000-8000-000000000002')$$,
  '42501', 'FORBIDDEN', 'AC-04.3: người không phải Super Admin không gọi được assign_primary_role');

-- AC-04.4 / S8 — Super Admin cũng không cấp được super_admin (trần tuyệt đối).
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000010', 'super_admin', '2040-10-01')$$,
  '42501', 'ROLE_CEILING', 'AC-04.4: không cấp được super_admin qua assign_primary_role');

-- Không tự đổi vai trò của chính mình.
select throws_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000001', 'secretary', '2040-10-01')$$,
  '42501', 'CANNOT_MODIFY_SELF', 'Super Admin không tự đổi vai trò của mình');

-- Không đổi vai trò của một tài khoản Super Admin khác.
select throws_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000002', 'parish_priest', '2040-10-01')$$,
  '42501', 'FORBIDDEN', 'không đổi được vai trò của tài khoản Super Admin khác');

-- ==== AC-04.2 — nguyên tử: đổi sang role lớp chưa có phân công thì rollback ==
select throws_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000010', 'class_teacher', '2040-10-01', 'ae100000-0000-4000-8000-000000000001', null, 'ad100000-0000-4000-8000-000000000002')$$,
  '23514', 'ACTIVE_CLASS_ASSIGNMENT_REQUIRED', 'AC-04.2: đổi sang lớp B chưa phân công bị BR-A17 chặn');
select is(
  (select count(*)::integer from public.role_assignments
     where profile_id = '10000000-0000-4000-8000-000000000010' and is_active
       and role = 'class_teacher' and class_id = 'ad100000-0000-4000-8000-000000000001'),
  1, 'AC-04.2: sau khi RPC lỗi, vai trò cũ (lớp A) vẫn active');

-- ==== AC-04.1 — luồng thật: kết thúc phân công A → phân công B → đổi vai trò ==
select lives_ok(
  $$select public.end_class_staff_assignment('ac100000-0000-4000-8000-000000000001', '2040-10-01')$$,
  'AC-04.1: Super Admin kết thúc phân công lớp A (khử luôn vai trò lớp A)');
-- Phân công sang lớp B (member) — chèn trực tiếp dưới superuser, trigger vẫn chạy.
reset role;
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('ad100000-0000-4000-8000-000000000002', 'af100000-0000-4000-8000-000000000001', 'member', '2040-10-02');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.assign_primary_role('10000000-0000-4000-8000-000000000010', 'class_teacher', '2040-10-02', 'ae100000-0000-4000-8000-000000000001', null, 'ad100000-0000-4000-8000-000000000002')$$,
  'AC-04.1: đổi vai trò sang lớp B thành công');
select is(
  (select count(*)::integer from public.role_assignments
     where profile_id = '10000000-0000-4000-8000-000000000010' and is_active),
  1, 'AC-04.1: đúng một vai trò active sau khi đổi');
select is(
  (select role::text from public.role_assignments
     where profile_id = '10000000-0000-4000-8000-000000000010' and is_active),
  'class_teacher', 'AC-04.1: vai trò active là class_teacher');
select is(
  (select class_id::text from public.role_assignments
     where profile_id = '10000000-0000-4000-8000-000000000010' and is_active),
  'ad100000-0000-4000-8000-000000000002', 'AC-04.1: vai trò active thuộc lớp B');

-- ==== S7 / BR-A17 — chèn trực tiếp role lớp cần phân công đúng capacity ======
reset role;
select throws_ok(
  $$insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values ('10000000-0000-4000-8000-000000000011', 'class_teacher', 'ae100000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000002', '2040-09-01')$$,
  '23514', 'ACTIVE_CLASS_ASSIGNMENT_REQUIRED', 'BR-A17: role lớp không tạo được khi chưa có phân công');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('ad100000-0000-4000-8000-000000000001', 'af100000-0000-4000-8000-000000000002', 'representative', '2040-09-01');
select throws_ok(
  $$insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values ('10000000-0000-4000-8000-000000000011', 'class_teacher', 'ae100000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001', '2040-09-01')$$,
  '23514', 'ACTIVE_CLASS_ASSIGNMENT_REQUIRED', 'BR-A17: role lớp sai capacity (member ≠ representative) bị chặn');
select lives_ok(
  $$insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values ('10000000-0000-4000-8000-000000000011', 'class_representative', 'ae100000-0000-4000-8000-000000000001', 'ad100000-0000-4000-8000-000000000001', '2040-09-01')$$,
  'BR-A17: role lớp đúng capacity (representative) tạo được');

select * from finish();
rollback;
