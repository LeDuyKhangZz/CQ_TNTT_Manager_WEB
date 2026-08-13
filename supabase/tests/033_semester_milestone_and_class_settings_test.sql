begin;

select plan(22);

-- ============================================================================
-- M02-B — hai thứ mới của đợt này ở tầng cơ sở dữ liệu.
--
--   A. **D-71 / D-116** — cột `academic_years.semester_1_end_date`:
--      · **nullable** (D-116: không bắt buộc) — nếu cột này `not null` thì năm học
--        `2026-2027` đang chạy, tạo ra trước migration `20260725000400`, mất khả
--        năng lưu bất cứ thay đổi nào;
--      · CHECK `academic_years_semester_1_range` — mốc phải nằm **hẳn bên trong**
--        năm học. Hai kiểu gõ sai nguy hiểm: mốc trước khai giảng (mọi lớp Dự
--        trưởng cảnh báo ngay buổi đầu) và mốc sau bế giảng (cảnh báo không bao
--        giờ xuất hiện);
--      · ghi vào cột này vẫn theo **D-112** — chỉ Super Admin.
--
--   B. **TB-F08 / AC-M02-10** — nhóm quyền của màn hình "Cài đặt lớp".
--      Cố ý KHÁC nhóm quyền năm học: D-112 siết *năm học* về một mình Super Admin
--      nhưng **không nói gì về lớp**, nên `classes` giữ `app.can_global_write()`
--      (bốn vai trò). Bài kiểm này chốt đúng ranh giới đó bằng JWT thật, và chốt
--      luôn hình dạng "no-op im lặng" mà SW-04 bắt tầng ứng dụng phải phát hiện:
--      RLS chặn `update` thì Postgres **trả 0 dòng, không ném lỗi**.
--
-- Quy ước JWT thật theo `029`–`032`: `set role authenticated` +
-- `request.jwt.claim.sub`. Dùng service role ở đây là tự làm hỏng bài kiểm vì
-- `app.can_global_write()` đọc vai trò từ chính phiên gọi.
-- ============================================================================

-- ==== A1. Hình dạng cột ====================================================
select has_column('public', 'academic_years', 'semester_1_end_date',
  'D-71: năm học có cột mốc kết thúc học kỳ 1');
select col_is_null('public', 'academic_years', 'semester_1_end_date',
  'D-116: mốc học kỳ 1 KHÔNG bắt buộc — năm học cũ để trống vẫn hợp lệ');
select col_type_is('public', 'academic_years', 'semester_1_end_date', 'date',
  'mốc là một ngày, không phải dấu thời gian có múi giờ');

-- ==== A2. Ràng buộc khoảng thời gian =======================================
-- Tạo năm học mà KHÔNG khai báo mốc — đây chính là hình dạng của mọi năm học đã tồn
-- tại trước migration `20260725000400`. Bắt buộc thì dòng này đỏ, và năm `2026-2027`
-- đang chạy sẽ không lưu lại được thay đổi nào (D-116).
select lives_ok(
  $$insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status)
    values ('a4000000-0000-4000-8000-000000000001', '2070-2071', 'Năm học mốc HK1', '2070-09-01', '2071-05-31', '2076-05-31', 'draft')$$,
  'D-116: tạo năm học không cần khai báo mốc học kỳ 1'
);

select lives_ok(
  $$update public.academic_years set semester_1_end_date = '2071-01-15'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  'mốc nằm giữa năm học thì hợp lệ'
);
select is(
  (select semester_1_end_date from public.academic_years where id = 'a4000000-0000-4000-8000-000000000001'),
  '2071-01-15'::date,
  'và được lưu đúng ngày'
);
select lives_ok(
  $$update public.academic_years set semester_1_end_date = null
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  'xoá mốc về null được — D-116'
);
select throws_ok(
  $$update public.academic_years set semester_1_end_date = '2070-08-31'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'mốc TRƯỚC ngày bắt đầu bị chặn'
);
select throws_ok(
  $$update public.academic_years set semester_1_end_date = '2071-06-01'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'mốc SAU ngày kết thúc bị chặn'
);
select throws_ok(
  $$update public.academic_years set semester_1_end_date = '2070-09-01'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'mốc trùng ngày bắt đầu bị chặn — học kỳ 1 dài 0 ngày là vô nghĩa'
);
select throws_ok(
  $$update public.academic_years set semester_1_end_date = '2071-05-31'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'mốc trùng ngày kết thúc bị chặn — học kỳ 1 bằng cả năm là vô nghĩa'
);
select throws_ok(
  $$insert into public.academic_years (code, name, start_date, end_date, retention_until, semester_1_end_date)
    values ('2071-2072', 'Năm học mốc sai', '2071-09-01', '2072-05-31', '2077-05-31', '2072-09-01')$$,
  '23514', null, 'ràng buộc áp cả lúc INSERT, không chỉ lúc UPDATE'
);

-- ==== Bốn người, bốn vai trò cho phần phân quyền ===========================
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a5000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-sa@test.local',  crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-sec@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-sl@test.local',  crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a5000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-ct@test.local',  crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('a5000000-0000-4000-8000-000000000001', 'CS_SA',  'Quản trị hệ thống'),
  ('a5000000-0000-4000-8000-000000000002', 'CS_SEC', 'Thư ký'),
  ('a5000000-0000-4000-8000-000000000003', 'CS_SL',  'Trưởng ngành Ấu Nhi'),
  ('a5000000-0000-4000-8000-000000000004', 'CS_CT',  'Giáo lý viên lớp');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('a6000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'chi', 'Thư Ký CS',        '0900000301'),
  ('a6000000-0000-4000-8000-000000000003', 'a5000000-0000-4000-8000-000000000003', 'anh', 'Trưởng Ngành CS',  '0900000302'),
  ('a6000000-0000-4000-8000-000000000004', 'a5000000-0000-4000-8000-000000000004', 'anh', 'GLV Lớp CS',       '0900000303');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('a7000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu CS 1A', 'active');

-- Vai trò lớp đòi một phân công lớp đang hoạt động với đúng `capacity`
-- (`app.validate_role_assignment_scope`: `class_teacher` ⇒ `member`).
insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('a8000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000004', 'member', '2070-09-01');

insert into public.role_assignments (profile_id, role) values
  ('a5000000-0000-4000-8000-000000000001', 'super_admin'),
  ('a5000000-0000-4000-8000-000000000002', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('a5000000-0000-4000-8000-000000000003', 'sector_leader', 'a4000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2070-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('a5000000-0000-4000-8000-000000000004', 'class_teacher', 'a4000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', '2070-09-01');

set local role authenticated;

-- ==== A3. Ghi mốc HK1 vẫn theo D-112 — chỉ Super Admin =====================
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
with attempted as (
  update public.academic_years
  set semester_1_end_date = '2071-02-01', updated_by = 'a5000000-0000-4000-8000-000000000002'
  where id = 'a4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'D-112: Thư ký đặt mốc HK1 được 0 dòng');

select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);
with attempted as (
  update public.academic_years
  set semester_1_end_date = '2071-02-01', updated_by = 'a5000000-0000-4000-8000-000000000003'
  where id = 'a4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'D-112: Trưởng ngành đặt mốc HK1 được 0 dòng');

select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000001', true);
with attempted as (
  update public.academic_years
  set semester_1_end_date = '2071-01-20', updated_by = 'a5000000-0000-4000-8000-000000000001'
  where id = 'a4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 1,
  'Super Admin đặt được mốc HK1');

-- ==== B. Cài đặt lớp — TB-F08 / AC-M02-10 ==================================
-- Thư ký NẰM TRONG nhóm ghi lớp: đây là chỗ chứng minh D-112 cố ý KHÔNG lan sang
-- bảng `classes`. Nếu bài này đỏ thì màn hình "Cài đặt lớp" đã âm thầm bị siết về
-- một mình Super Admin — điều chủ dự án chưa bao giờ chốt.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
with attempted as (
  update public.classes
  set status = 'inactive', meeting_location = 'Phòng 3', updated_by = 'a5000000-0000-4000-8000-000000000002'
  where id = 'a7000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 1,
  'Thư ký sửa được cài đặt lớp — D-112 không lan sang bảng classes');

-- Trưởng ngành: ghi danh được (ENROLLMENT_WRITE_ROLES) nhưng KHÔNG đóng lớp.
-- Đây là lý do `getClassDetail` trả hai cờ quyền riêng biệt.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000003', true);
with attempted as (
  update public.classes
  set status = 'closed', updated_by = 'a5000000-0000-4000-8000-000000000003'
  where id = 'a7000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'AC-M02-10: Trưởng ngành đóng lớp được 0 dòng — KHÔNG được báo thành công');

select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000004', true);
with attempted as (
  update public.classes
  set status = 'closed', updated_by = 'a5000000-0000-4000-8000-000000000004'
  where id = 'a7000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'AC-M02-10: Giáo lý viên lớp đóng lớp được 0 dòng');

-- SEC-M02-04 — không ai tự đặt `updated_by` khác `auth.uid()`.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$update public.classes set status = 'active', updated_by = 'a5000000-0000-4000-8000-000000000001'
    where id = 'a7000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'SEC-M02-04: không mạo danh được người sửa cuối'
);

-- Đọc thì mọi vai trò vẫn đọc được — siết ghi không kéo theo siết đọc.
select set_config('request.jwt.claim.sub', 'a5000000-0000-4000-8000-000000000004', true);
select isnt_empty(
  $$select 1 from public.classes where id = 'a7000000-0000-4000-8000-000000000001'$$,
  'Giáo lý viên lớp vẫn đọc được cài đặt lớp'
);

-- Trạng thái sau cùng đúng như lượt ghi hợp lệ duy nhất của Thư ký.
reset role;
select is(
  (select status::text from public.classes where id = 'a7000000-0000-4000-8000-000000000001'),
  'inactive', 'ba lượt ghi bị chặn không để lại dấu vết nào'
);
select is(
  (select meeting_location from public.classes where id = 'a7000000-0000-4000-8000-000000000001'),
  'Phòng 3', 'phòng sinh hoạt lưu đúng giá trị Thư ký đã ghi'
);

select * from finish();
rollback;
