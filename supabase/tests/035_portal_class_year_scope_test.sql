begin;

select plan(18);

-- ============================================================================
-- M02-C · D-70 — Phụ huynh và Thiếu nhi chỉ thấy LỚP CỦA MÌNH.
--
-- SEC-M02-09 / Q-M02-06: `docs/05` §3 ghi "lớp con" cho phụ huynh và "lớp mình" cho
-- thiếu nhi, dòng "Năm học" ghi ❌ cho cả hai — nhưng RLS cho đọc **hết**. Đây là
-- một **thay đổi SIẾT quyền**, nên bài kiểm phải chứng minh hai điều **cùng lúc**:
--
--   1. Siết ĐỦ — phụ huynh/thiếu nhi không còn lấy được danh sách toàn bộ lớp và
--      toàn bộ năm học qua Data API bằng JWT thật.
--   2. Siết KHÔNG QUÁ TAY — đây là điều D-70 cảnh báo bằng chữ: *"nhiều màn hình
--      hiện dựa vào việc đọc được danh sách lớp để hiển thị tên lớp; siết quá tay
--      sẽ làm cổng phụ huynh hiện «lớp không xác định»"*. Bốn đường đi thật của
--      cổng phụ huynh được kiểm ở đây, không phải chỉ suy luận:
--        · lớp của con (bộ chọn màu ngành, tên lớp ở `/results`),
--        · năm học hiện hành (thanh đầu trang hiện tên năm cho MỌI vai trò),
--        · năm học cũ mà con có ghi danh (lịch sử điểm/điểm danh),
--        · danh mục ngành/cấp (màu ngành của lớp con — 09 §4.4 #10).
--
-- 🔴 Và một bài đối chứng cho **nhân sự**: siết này chỉ áp cho `guardian`/`student`.
-- Trưởng ngành vẫn đọc được lớp năm cũ (**D-69**), nên nếu ai đó vô tình siết chung
-- cho mọi vai trò thì bài đó đỏ ngay.
-- ============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pt-gu@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pt-st@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pt-sl@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000001', 'PT_GU', 'Phụ huynh'),
  ('c1000000-0000-4000-8000-000000000002', 'PT_ST', 'Thiếu nhi'),
  ('c1000000-0000-4000-8000-000000000003', 'PT_SL', 'Trưởng ngành Ấu Nhi');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'anh', 'Trưởng Ngành PT', '0900000501');

-- Hai năm học: một đang chạy, một đã đóng (con có học năm đó ⇒ phải đọc được).
insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('c3000000-0000-4000-8000-000000000001', '2090-2091', 'Năm đang chạy PT', '2090-09-01', '2091-05-31', '2096-05-31', 'current'),
  ('c3000000-0000-4000-8000-000000000002', '2089-2090', 'Năm cũ có con học', '2089-09-01', '2090-05-31', '2095-05-31', 'closed'),
  -- Năm mà con KHÔNG hề học: phụ huynh không được thấy dòng này.
  ('c3000000-0000-4000-8000-000000000003', '2088-2089', 'Năm không liên quan', '2088-09-01', '2089-05-31', '2094-05-31', 'closed');

-- Ba lớp trong năm đang chạy: lớp của con, lớp của em thiếu nhi, và một lớp khác.
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('c4000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu PT 1A', 'active'),
  ('c4000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'B', 'Ấu PT 1B', 'active'),
  ('c4000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu PT 2A', 'active'),
  ('c4000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu PT cũ 1A', 'active');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('c5000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Phụ Huynh PT', '0900000502'),
  ('c5000000-0000-4000-8000-000000000002', null, 'Phụ Huynh Khác', '0900000503');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c6000000-0000-4000-8000-000000000001', null, 'c5000000-0000-4000-8000-000000000001', 'Maria', 'Con Của Tôi PT', 'female', '2015-03-03'),
  ('c6000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'c5000000-0000-4000-8000-000000000002', 'Giuse', 'Em Tự Đăng Nhập PT', 'male', '2015-04-04');

-- Con của phụ huynh: lớp 1A năm nay, và lớp cũ của năm đã đóng.
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on, ended_on) values
  ('c7000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 'active', '2090-09-05', null),
  ('c7000000-0000-4000-8000-000000000002', 'c6000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000004', 'completed', '2089-09-05', '2090-05-31'),
  -- Em tự đăng nhập: lớp 2A năm nay.
  ('c7000000-0000-4000-8000-000000000003', 'c6000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000003', 'active', '2090-09-05', null);

insert into public.role_assignments (profile_id, role) values
  ('c1000000-0000-4000-8000-000000000001', 'guardian'),
  ('c1000000-0000-4000-8000-000000000002', 'student');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('c1000000-0000-4000-8000-000000000003', 'sector_leader', 'c3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2090-09-01');

set local role authenticated;

-- ==== 1. Phụ huynh — SIẾT ĐỦ ===============================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.classes where academic_year_id = 'c3000000-0000-4000-8000-000000000001'),
  1, 'D-70: phụ huynh chỉ thấy 1 lớp trong năm nay — lớp của con, không phải cả ba'
);
select is(
  (select display_name from public.classes where academic_year_id = 'c3000000-0000-4000-8000-000000000001'),
  'Ấu PT 1A', 'và đúng là lớp của con mình'
);
select is_empty(
  $$select 1 from public.classes where id = 'c4000000-0000-4000-8000-000000000002'$$,
  'D-70: lớp của em khác trong cùng ngành cũng không đọc được'
);
select is_empty(
  $$select 1 from public.academic_years where id = 'c3000000-0000-4000-8000-000000000003'$$,
  'D-70: năm học mà con không hề học thì không đọc được'
);

-- ==== 2. Phụ huynh — SIẾT KHÔNG QUÁ TAY ====================================
-- Thanh đầu trang hiện tên năm học cho MỌI vai trò (`getCurrentAcademicYear`).
-- Chặn dòng này là cổng phụ huynh hiện "Chưa đặt năm học" — một câu SAI.
select isnt_empty(
  $$select 1 from public.academic_years where status = 'current'$$,
  'không quá tay: phụ huynh vẫn đọc được năm học hiện hành'
);
select isnt_empty(
  $$select 1 from public.academic_years where id = 'c3000000-0000-4000-8000-000000000002'$$,
  'không quá tay: năm cũ mà con có ghi danh vẫn đọc được (lịch sử điểm/điểm danh)'
);
select isnt_empty(
  $$select 1 from public.classes where id = 'c4000000-0000-4000-8000-000000000004'$$,
  'không quá tay: lớp cũ của con vẫn ra tên — không hiện "lớp không xác định"'
);
-- Đường đi thật của `/results` phụ huynh và của bộ chọn màu ngành: đọc lớp QUA
-- ghi danh, kèm ngành để lấy màu.
select isnt_empty(
  $$select 1
    from public.enrollments as enrollment
    join public.classes as class on class.id = enrollment.class_id
    join public.grade_levels as grade on grade.id = class.grade_level_id
    join public.sectors as sector on sector.id = grade.sector_id
    where enrollment.student_id = 'c6000000-0000-4000-8000-000000000001'$$,
  'không quá tay: ghi danh ⟶ lớp ⟶ cấp ⟶ ngành vẫn đi hết được (màu ngành, 09 §4.4 #10)'
);
-- Ghi chú 3 của migration: danh mục tham chiếu KHÔNG bị siết.
select is(
  (select count(*)::integer from public.sectors),
  5, 'không quá tay: danh mục 5 ngành vẫn đọc được'
);

-- ==== 3. Thiếu nhi tự đăng nhập ============================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.classes where academic_year_id = 'c3000000-0000-4000-8000-000000000001'),
  1, 'D-70: thiếu nhi chỉ thấy lớp của mình'
);
select is(
  (select display_name from public.classes where academic_year_id = 'c3000000-0000-4000-8000-000000000001'),
  'Ấu PT 2A', 'và đúng là lớp mình đang học'
);
select is_empty(
  $$select 1 from public.classes where id = 'c4000000-0000-4000-8000-000000000001'$$,
  'D-70: thiếu nhi không đọc được lớp của em khác'
);
select isnt_empty(
  $$select 1 from public.academic_years where status = 'current'$$,
  'không quá tay: thiếu nhi vẫn đọc được năm học hiện hành'
);
select is_empty(
  $$select 1 from public.academic_years where id = 'c3000000-0000-4000-8000-000000000002'$$,
  'D-70: năm cũ mà chính em không học thì không đọc được'
);

-- ==== 4. Ghi vẫn bị chặn như cũ ============================================
-- Siết ĐỌC không được vô tình mở ĐƯỜNG GHI nào. `classes` chỉ mở cho
-- `app.can_global_write()`, và phụ huynh/thiếu nhi chưa bao giờ nằm trong đó.
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
with attempted as (
  update public.classes set meeting_location = 'Phòng của phụ huynh',
    updated_by = 'c1000000-0000-4000-8000-000000000001'
  where id = 'c4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'phụ huynh sửa lớp của con được 0 dòng — đọc được không có nghĩa là ghi được');

-- ==== 5. Đối chứng cho NHÂN SỰ (D-69) ======================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.classes where academic_year_id = 'c3000000-0000-4000-8000-000000000001'),
  3, 'đối chứng: Trưởng ngành vẫn thấy cả ba lớp của năm nay'
);
select isnt_empty(
  $$select 1 from public.classes where id = 'c4000000-0000-4000-8000-000000000004'$$,
  'đối chứng D-69: Trưởng ngành vẫn đọc được lớp của năm ĐÃ ĐÓNG'
);
select is(
  (select count(*)::integer from public.academic_years
   where id in ('c3000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000003')),
  3, 'đối chứng D-69: Trưởng ngành vẫn đọc được cả ba năm học'
);

select * from finish();
rollback;
