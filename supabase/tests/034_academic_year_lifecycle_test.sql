begin;

select plan(37);

-- ============================================================================
-- M02-C — Vòng đời năm học ở tầng cơ sở dữ liệu.
--
--   A. I7 / TB-F09 / D-73 — `close_academic_year`: chỉ Super Admin, bắt gõ lại mã
--      năm học, bảng kiểm tiền điều kiện, đóng cưỡng bức phải có lý do.
--   B. D-120 / BR-M02-N07 — `archive_academic_year`: chỉ từ `closed`, và **chỉ sau**
--      `retention_until`.
--   C. I8 / BR-M02-N06 / **D-117** — sau khi đóng, **không vai trò nào** ngoài Super
--      Admin ghi được vào `enrollments`/`classes` của năm đó. Đây là lỗ hổng
--      nghiêm trọng nhất mà D-73 nêu và tới trước đợt này **vẫn đang mở**: năm đã
--      đóng vẫn nhận ghi danh mới qua Data API.
--   D. **D-119** — đóng năm **KHÔNG** tự chuyển lớp của năm đó sang `closed`.
--
-- Quy ước JWT thật theo `029`–`033`: `set role authenticated` +
-- `request.jwt.claim.sub`. Dùng service role ở đây là tự làm hỏng bài kiểm vì
-- `app.is_super_admin()` đọc vai trò từ chính phiên gọi.
--
-- 🔴 Hai chốt của bài kiểm mà người đọc sau phải biết:
--   · INSERT bị RLS chặn thì Postgres **ném 42501**; UPDATE bị chặn ở `using` thì
--     **trả 0 dòng, không lỗi**. Hai hình dạng khác nhau nên hai cách kiểm khác nhau.
--   · Mọi bài "vai trò X vẫn ghi được vào năm đang chạy" là **bài đối chứng**, không
--     phải bài phụ: siết quá tay thì cả hệ thống dừng ghi, và đó là rủi ro CAO mà
--     `07_IMPLEMENTATION_IMPACT.md` xếp cho I8.
-- ============================================================================

-- ==== A0. Hình dạng cột và chữ ký hàm ======================================
select has_column('public', 'academic_years', 'closed_at', 'I7: có dấu thời gian chốt sổ');
select has_column('public', 'academic_years', 'closed_by', 'I7: có người chốt sổ');
select has_column('public', 'academic_years', 'close_reason', 'I7: có lý do đóng');
select col_is_null('public', 'academic_years', 'closed_at',
  'closed_at nullable — năm cũ bị đóng như tác dụng phụ không có dấu thời gian nào');
select is_definer('public', 'close_academic_year', array['uuid', 'text', 'boolean', 'text'],
  'RPC đóng năm chạy security definer');
select is_definer('public', 'archive_academic_year', array['uuid'],
  'RPC lưu trữ chạy security definer');

-- ==== Dựng dữ liệu ==========================================================
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('b1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cl-sa@test.local',  crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cl-sec@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cl-sl@test.local',  crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('b1000000-0000-4000-8000-000000000001', 'CL_SA',  'Quản trị hệ thống'),
  ('b1000000-0000-4000-8000-000000000002', 'CL_SEC', 'Thư ký'),
  ('b1000000-0000-4000-8000-000000000003', 'CL_SL',  'Trưởng ngành Ấu Nhi');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'chi', 'Thư Ký CL',       '0900000401'),
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'anh', 'Trưởng Ngành CL', '0900000402');

-- Bốn năm học, mỗi năm một vai trong bài kiểm.
insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('b3000000-0000-4000-8000-000000000001', '2080-2081', 'Năm đang chạy',        '2080-09-01', '2081-05-31', '2086-05-31', 'current'),
  ('b3000000-0000-4000-8000-000000000002', '2081-2082', 'Năm nháp',             '2081-09-01', '2082-05-31', '2087-05-31', 'draft'),
  -- Đã đóng nhưng CHƯA qua hạn giữ dữ liệu (D-120).
  ('b3000000-0000-4000-8000-000000000003', '2082-2083', 'Năm đóng chưa hết hạn','2082-09-01', '2083-05-31', '2088-05-31', 'closed'),
  -- Đã đóng và ĐÃ qua hạn: đây là hình dạng duy nhất lưu trữ được.
  ('b3000000-0000-4000-8000-000000000004', '2010-2011', 'Năm đóng đã hết hạn',  '2010-09-01', '2011-05-31', '2016-05-31', 'closed');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('b4000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu CL 1A', 'active'),
  ('b4000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu CL nháp 1A', 'active');

insert into public.guardians (id, full_name, phone) values
  ('b5000000-0000-4000-8000-000000000001', 'Phụ huynh CL', '0900000403');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('b6000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001', 'Maria', 'Em Một CL',  'female', '2016-05-05'),
  ('b6000000-0000-4000-8000-000000000002', 'b5000000-0000-4000-8000-000000000001', 'Anna',  'Em Hai CL',  'female', '2016-06-06'),
  ('b6000000-0000-4000-8000-000000000003', 'b5000000-0000-4000-8000-000000000001', 'Teresa','Em Ba CL',   'female', '2016-07-07');

-- Một ghi danh còn mở ⇒ năm đang chạy CÓ việc tồn đọng.
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('b7000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'active', '2080-09-05');

insert into public.role_assignments (profile_id, role) values
  ('b1000000-0000-4000-8000-000000000001', 'super_admin'),
  ('b1000000-0000-4000-8000-000000000002', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('b1000000-0000-4000-8000-000000000003', 'sector_leader', 'b3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2080-09-01');

set local role authenticated;

-- ==== A1. Bảng kiểm nói ra con số thật =====================================
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select is(
  (public.academic_year_close_checklist('b3000000-0000-4000-8000-000000000001') ->> 'open_enrollments')::integer,
  1, 'WF-16 bước 1: bảng kiểm đếm đúng 1 ghi danh còn mở'
);
-- Lớp chưa có bài đánh giá nào thì KHÔNG phải "bảng điểm chưa khoá" (ghi chú 2 của
-- migration). Đếm gộp là mỗi lần chốt sổ đều báo 19 lớp tồn đọng.
select is(
  (public.academic_year_close_checklist('b3000000-0000-4000-8000-000000000001') ->> 'unlocked_gradebooks')::integer,
  0, 'lớp chưa có bài đánh giá không bị đếm là bảng điểm chưa khoá'
);

-- ==== A2. Quyền: chỉ Super Admin đóng năm (D-73) ===========================
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2081', true, 'thử')$$,
  '42501', null, 'D-73: Thư ký không đóng được năm học'
);
select throws_ok(
  $$select public.archive_academic_year('b3000000-0000-4000-8000-000000000004')$$,
  '42501', null, 'D-73: Thư ký không lưu trữ được năm học'
);
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2081', true, 'thử')$$,
  '42501', null, 'D-73: Trưởng ngành không đóng được năm học'
);
-- Bảng kiểm là số liệu quản trị toàn xứ đoàn, không phải thứ cho mọi vai trò xem.
select throws_ok(
  $$select public.academic_year_close_checklist('b3000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'Trưởng ngành không đọc được bảng kiểm chốt sổ'
);

-- ==== A3. Bốn cách đóng SAI, đều phải bị chặn ==============================
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000002', '2081-2082', true, 'thử')$$,
  '23514', null, 'trạng thái đi một chiều: năm NHÁP không đóng được'
);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000003', '2082-2083', true, 'thử')$$,
  '23514', null, 'đóng lại năm ĐÃ ĐÓNG bị chặn — nếu không thì closed_at bị ghi đè'
);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2082', true, 'thử')$$,
  '22023', null, 'BR-M02-N08: gõ sai mã năm học thì không đóng được'
);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-0000000000ff', '2080-2081', true, 'thử')$$,
  'P0002', null, 'năm học không tồn tại là "không tìm thấy", không phải 500'
);
-- BR-M02-N05: còn việc tồn đọng mà không cưỡng bức ⇒ chặn, và thông điệp mang
-- theo chính bảng kiểm để tầng ứng dụng nói ra con số.
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2081', false, null)$$,
  '23514', null, 'BR-M02-N05: còn ghi danh mở thì không đóng thẳng được'
);
select throws_ok(
  $$select public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2081', true, '   ')$$,
  '23514', null, 'đóng cưỡng bức mà bỏ trắng lý do bị chặn'
);
-- Không lượt nào trong sáu lượt trên được đổi trạng thái.
select is(
  (select status::text from public.academic_years where id = 'b3000000-0000-4000-8000-000000000001'),
  'current', 'sáu lượt đóng bị chặn không để lại dấu vết nào'
);

-- ==== A4. Đóng cưỡng bức đúng cách =========================================
select is(
  (public.close_academic_year('b3000000-0000-4000-8000-000000000001', '2080-2081', true,
    'Chốt sổ cuối năm; 1 em chuyển giáo xứ chưa kịp kết thúc ghi danh') ->> 'forced')::boolean,
  true, 'I7: đóng cưỡng bức thành công và nói rõ mình là cưỡng bức'
);
select is(
  (select status::text from public.academic_years where id = 'b3000000-0000-4000-8000-000000000001'),
  'closed', 'năm học chuyển sang Đã đóng'
);
select ok(
  (select closed_at is not null from public.academic_years where id = 'b3000000-0000-4000-8000-000000000001'),
  'closed_at được ghi'
);
select is(
  (select closed_by from public.academic_years where id = 'b3000000-0000-4000-8000-000000000001'),
  'b1000000-0000-4000-8000-000000000001'::uuid, 'closed_by là chính Super Admin vừa bấm'
);
-- `alike`, không phải `like`: `like` là từ khoá SQL nên pgTAP đặt tên hàm khác.
select alike(
  (select close_reason from public.academic_years where id = 'b3000000-0000-4000-8000-000000000001'),
  '%chuyển giáo xứ%', 'lý do được lưu nguyên văn (ghi chú 4 của migration)'
);

-- ==== D. D-119 — đóng năm KHÔNG tự đóng lớp ================================
select is(
  (select status::text from public.classes where id = 'b4000000-0000-4000-8000-000000000001'),
  'active', 'D-119: lớp của năm vừa đóng giữ nguyên trạng thái'
);

-- ==== C. I8 / BR-M02-N06 — hàng rào ghi ====================================
-- Thư ký (ghi toàn xứ đoàn) — trước đợt này ghi danh vào năm đã đóng chạy bình thường.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, enrolled_on, updated_by)
    values ('b6000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000001',
            'b4000000-0000-4000-8000-000000000001', '2080-10-01', 'b1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'BR-M02-N06: Thư ký KHÔNG ghi danh được vào năm đã đóng'
);
with attempted as (
  update public.classes set meeting_location = 'Phòng lậu', updated_by = 'b1000000-0000-4000-8000-000000000002'
  where id = 'b4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'BR-M02-N06: Thư ký sửa lớp của năm đã đóng được 0 dòng');
with attempted as (
  update public.enrollments set status = 'withdrawn', ended_on = '2081-01-01',
    updated_by = 'b1000000-0000-4000-8000-000000000002'
  where id = 'b7000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 0,
  'BR-M02-N09: Thư ký kết thúc ghi danh của năm đã đóng được 0 dòng');

-- Trưởng ngành (`can_manage_class` qua ngành) cũng bị chặn — hàng rào không phụ
-- thuộc nhóm quyền, nó phụ thuộc TRẠNG THÁI NĂM HỌC.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, enrolled_on, updated_by)
    values ('b6000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000001',
            'b4000000-0000-4000-8000-000000000001', '2080-10-01', 'b1000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'BR-M02-N06: Trưởng ngành cũng không ghi danh được vào năm đã đóng'
);

-- D-117 — Super Admin là ngoại lệ DUY NHẤT, và vẫn ghi được tất cả.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, enrolled_on, updated_by)
    values ('b6000000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000001',
            'b4000000-0000-4000-8000-000000000001', '2080-10-01', 'b1000000-0000-4000-8000-000000000001')$$,
  'D-117: Super Admin vẫn ghi danh được vào năm đã đóng'
);
with attempted as (
  update public.classes set meeting_location = 'Phòng 9', updated_by = 'b1000000-0000-4000-8000-000000000001'
  where id = 'b4000000-0000-4000-8000-000000000001'
  returning 1
)
select is((select count(*)::integer from attempted), 1,
  'D-117: Super Admin vẫn sửa được lớp của năm đã đóng');

-- 🔴 BÀI ĐỐI CHỨNG — siết quá tay thì cả hệ thống dừng ghi. Năm NHÁP vẫn phải
-- ghi được với vai trò thường.
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, enrolled_on, updated_by)
    values ('b6000000-0000-4000-8000-000000000003', 'b3000000-0000-4000-8000-000000000002',
            'b4000000-0000-4000-8000-000000000002', '2081-09-05', 'b1000000-0000-4000-8000-000000000002')$$,
  'đối chứng: Thư ký vẫn ghi danh được vào năm NHÁP'
);
with attempted as (
  update public.classes set meeting_location = 'Phòng 1', updated_by = 'b1000000-0000-4000-8000-000000000002'
  where id = 'b4000000-0000-4000-8000-000000000002'
  returning 1
)
select is((select count(*)::integer from attempted), 1,
  'đối chứng: Thư ký vẫn sửa được lớp của năm NHÁP');

-- ==== B. D-120 — lưu trữ chỉ sau hạn giữ dữ liệu ===========================
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.archive_academic_year('b3000000-0000-4000-8000-000000000002')$$,
  '23514', null, 'BR-M02-N07: năm NHÁP không lưu trữ được'
);
select throws_ok(
  $$select public.archive_academic_year('b3000000-0000-4000-8000-000000000003')$$,
  '23514', null, 'D-120: năm đã đóng nhưng CHƯA qua hạn giữ dữ liệu thì không lưu trữ được'
);
select lives_ok(
  $$select public.archive_academic_year('b3000000-0000-4000-8000-000000000004')$$,
  'D-120: năm đã đóng và đã qua hạn thì lưu trữ được'
);
select is(
  (select status::text from public.academic_years where id = 'b3000000-0000-4000-8000-000000000004'),
  'archived', 'và trạng thái thành Đã lưu trữ'
);

select * from finish();
rollback;
