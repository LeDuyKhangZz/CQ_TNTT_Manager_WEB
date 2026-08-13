begin;

select plan(20);

-- ============================================================================
-- M02-A — Ba chốt chặn mới của vòng đời năm học.
--
--   1. TB-F02 / BR-M02-N01 — thiếu danh mục lớp chuẩn thì **ném lỗi**, không
--      lặng lẽ trả 0. Đây chính là sự cố production (5W-F02): `class_templates`
--      rỗng ⇒ tạo 0 lớp ⇒ báo thành công ⇒ `/classes` trống mà không ai biết vì sao.
--   2. TB-F02 / BR-M02-N03 — năm học `closed`/`archived` không sinh lớp được,
--      kể cả khi gọi thẳng RPC qua Data API (bỏ qua giao diện).
--   3. D-112 — vòng đời năm học chỉ còn Super Admin: sinh lớp, đặt năm hiện hành,
--      và **ghi thẳng vào bảng `academic_years`** qua RLS.
--
-- Kiểm bằng JWT thật (`set role authenticated` + `request.jwt.claim.sub`) đúng quy
-- ước của `029`/`030`/`031`: `app.is_super_admin()` đọc vai trò từ chính phiên gọi,
-- nên dùng service role ở đây là tự làm hỏng bài kiểm.
-- ============================================================================

select function_returns('public', 'generate_default_classes', array['uuid'], 'jsonb',
  'RPC sinh lớp trả kết quả có cấu trúc');
select is_definer('public', 'generate_default_classes', array['uuid'],
  'RPC sinh lớp chạy security definer');
select is_definer('public', 'set_current_academic_year', array['uuid'],
  'RPC đặt năm hiện hành chạy security definer');

-- Bốn người, bốn vai trò ------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a2000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ay-sa@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ay-gl@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a2000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ay-sec@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a2000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ay-ct@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('a2000000-0000-4000-8000-000000000001', 'AY_SA',  'Quản trị hệ thống'),
  ('a2000000-0000-4000-8000-000000000002', 'AY_GL',  'Xứ đoàn trưởng'),
  ('a2000000-0000-4000-8000-000000000003', 'AY_SEC', 'Thư ký'),
  ('a2000000-0000-4000-8000-000000000004', 'AY_CT',  'Giáo lý viên lớp');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'anh', 'Xứ đoàn trưởng', '0900000201'),
  ('a3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', 'chi', 'Thư ký', '0900000202'),
  ('a3000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', 'anh', 'Giáo lý viên lớp', '0900000203');
insert into public.role_assignments (profile_id, role) values
  ('a2000000-0000-4000-8000-000000000001', 'super_admin'),
  ('a2000000-0000-4000-8000-000000000002', 'group_leader'),
  ('a2000000-0000-4000-8000-000000000003', 'secretary');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('a1000000-0000-4000-8000-000000000001', '2050-2051', 'Năm học nháp',    '2050-09-01', '2051-05-31', '2056-05-31', 'draft'),
  ('a1000000-0000-4000-8000-000000000002', '2051-2052', 'Năm học đã đóng', '2051-09-01', '2052-05-31', '2057-05-31', 'closed'),
  ('a1000000-0000-4000-8000-000000000003', '2052-2053', 'Năm học lưu trữ', '2052-09-01', '2053-05-31', '2058-05-31', 'archived');

-- 1. Quyền: chỉ Super Admin sinh lớp -----------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-112: Xứ đoàn trưởng KHÔNG sinh lớp được nữa'
);
select throws_ok(
  $$select public.set_current_academic_year('a1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-112: Xứ đoàn trưởng KHÔNG đặt năm hiện hành được nữa'
);

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-112: Thư ký không sinh lớp được'
);
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'Giáo lý viên lớp không sinh lớp được'
);

-- 2. Năm đã đóng / đã lưu trữ không sinh lớp được (kể cả Super Admin) ---------
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000002')$$,
  '23514', null, 'BR-M02-N03: năm học đã đóng không sinh lớp được'
);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000003')$$,
  '23514', null, 'BR-M02-N03: năm học đã lưu trữ không sinh lớp được'
);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-0000000000ff')$$,
  'P0002', null, 'năm học không tồn tại vẫn là "không tìm thấy", không phải 500'
);

-- 3. Sinh lớp thành công trả đủ ba con số ------------------------------------
select is(
  (public.generate_default_classes('a1000000-0000-4000-8000-000000000001') ->> 'inserted')::integer,
  19, 'Super Admin sinh đủ 19 lớp'
);
select is(
  (public.generate_default_classes('a1000000-0000-4000-8000-000000000001') ->> 'expected')::integer,
  19, 'expected = số mẫu lớp đang bật'
);

-- 4. RLS bảng academic_years: chỉ Super Admin ghi -----------------------------
select lives_ok(
  $$insert into public.academic_years (code, name, start_date, end_date, retention_until, updated_by)
    values ('2060-2061', 'Năm học SA tạo', '2060-09-01', '2061-05-31', '2066-05-31', 'a2000000-0000-4000-8000-000000000001')$$,
  'Super Admin tạo được năm học'
);
select lives_ok(
  $$update public.academic_years set name = 'Năm học nháp (đã sửa)', updated_by = 'a2000000-0000-4000-8000-000000000001'
    where id = 'a1000000-0000-4000-8000-000000000001'$$,
  'Super Admin sửa được năm học'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$insert into public.academic_years (code, name, start_date, end_date, retention_until, updated_by)
    values ('2061-2062', 'Thư ký tạo trộm', '2061-09-01', '2062-05-31', '2067-05-31', 'a2000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'D-112: Thư ký không tạo được năm học qua Data API'
);
-- `update` bị RLS chặn thì Postgres không báo lỗi — nó trả 0 dòng. Đó chính là
-- hình dạng "no-op im lặng" mà D-61/SW-04 bắt phải phát hiện ở tầng ứng dụng,
-- nên ở đây kiểm bằng SỐ DÒNG chứ không chờ một ngoại lệ.
with attempted as (
  update public.academic_years set name = 'Thư ký sửa trộm', updated_by = 'a2000000-0000-4000-8000-000000000003'
  where id = 'a1000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0, 'D-112: Thư ký sửa năm học được 0 dòng');

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
with attempted as (
  update public.academic_years set attendance_lock_days = 7, updated_by = 'a2000000-0000-4000-8000-000000000002'
  where id = 'a1000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0, 'D-112: Xứ đoàn trưởng sửa cấu hình năm học được 0 dòng');

-- Đọc thì KHÔNG đổi: siết ghi không được kéo theo siết đọc ---------------------
select isnt_empty(
  $$select 1 from public.academic_years where id = 'a1000000-0000-4000-8000-000000000001'$$,
  'Xứ đoàn trưởng vẫn đọc được năm học'
);

-- 5. Thiếu danh mục lớp chuẩn ⇒ ném lỗi, không báo thành công -----------------
reset role;
delete from public.classes;
delete from public.class_templates;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.generate_default_classes('a1000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'BR-M02-N01: danh mục lớp chuẩn rỗng thì ném lỗi chứ không trả 0'
);
reset role;
select is(
  (select count(*)::integer from public.classes where academic_year_id = 'a1000000-0000-4000-8000-000000000001'),
  0, 'và không tạo lớp nào'
);

select * from finish();
rollback;
