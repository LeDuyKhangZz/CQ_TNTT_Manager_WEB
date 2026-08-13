begin;

-- ===========================================================================
-- M08-B — bí tích lớp cuối ngành (D-156/D-161) · nhật ký quyết định (D-157) ·
-- hàng rào năm học đã đóng (nợ #18/D-160) · bịt đường vòng đóng ghi danh
-- (D-158/D-162) · RPC chuyển lớp thẳng cho cấp xứ đoàn (D-159).
--
-- File riêng chứ không nối vào `019_promotions_test.sql` vì **điều kiện đầu vào
-- khác hẳn**: 019 dựng hai năm học `draft` (đều ghi được) nên không có chỗ nào
-- đo được hàng rào năm đóng, và mọi lớp của nó thuộc cấp KHÔNG phải cấp cuối
-- ngành. Nhét cả hai loại điều kiện vào một file là mời một bài xanh vì lý do
-- sai.
--
-- Mọi khẳng định phân quyền chạy bằng **JWT thật của từng vai trò**
-- (`request.jwt.claim.sub`), đúng `AGENTS` §5 và `11` §5 mục cuối.
-- ===========================================================================
select plan(53);

-- ── Cấu trúc ────────────────────────────────────────────────────────────────
select has_table('public', 'promotion_review_events', 'bảng nhật ký quyết định tồn tại');
select has_function('public', 'promote_enrollment_now',
  array['uuid', 'promotion_status', 'uuid', 'boolean', 'text'], 'RPC chuyển lớp thẳng tồn tại');
select has_function('app', 'required_sacraments_for_grade', array['uuid'], 'hàm luật bí tích tồn tại');

-- ===========================================================================
-- D-161 — LUẬT BÍ TÍCH ĐO THẲNG TRÊN HÀM, KHÔNG QUA MÀN HÌNH.
--
-- Chủ dự án chốt 2026-08-07: **cấp cuối của một ngành xét đúng bí tích RIÊNG
-- của ngành đó**; ngành nào không có bí tích riêng (Nghĩa Sĩ · Hiệp Sĩ) thì mới
-- nhắc lại những cái còn thiếu của các ngành trước. Năm bài dưới đây là chỗ duy
-- nhất trong hệ thống ghi lại quyết định ấy bằng số.
-- ===========================================================================
select is(
  app.required_sacraments_for_grade('20000000-0000-0000-0000-000000000002'),
  array['baptism']::public.sacrament_type[],
  'Chiên Con 2 xét đúng Rửa Tội');
select is(
  app.required_sacraments_for_grade('20000000-0000-0000-0000-000000000006'),
  array['first_confession', 'first_communion']::public.sacrament_type[],
  'Ấu 3 xét Xưng tội + Rước lễ lần đầu, KHÔNG kéo theo Rửa Tội (D-161)');
select is(
  app.required_sacraments_for_grade('20000000-0000-0000-0000-000000000009'),
  array['confirmation']::public.sacrament_type[],
  'Thiếu 3 xét đúng Thêm Sức');
select is(
  app.required_sacraments_for_grade('20000000-0000-0000-0000-000000000012'),
  array['baptism', 'first_confession', 'first_communion', 'confirmation']::public.sacrament_type[],
  'Nghĩa 3 không có bí tích mới nên nhắc lại cả bốn của ba ngành trước');
select is(
  app.required_sacraments_for_grade('20000000-0000-0000-0000-000000000004'),
  '{}'::public.sacrament_type[],
  'Ấu 1 không phải cấp cuối ngành nên không xét bí tích nào (AC-17)');

-- ── Dữ liệu dựng sẵn ────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-au-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-nghia-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'group-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-au1-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-nghia-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-closed-m08b@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'REP_AU3_M08B', 'Đại diện Ấu 3 M08B'),
  ('f1000000-0000-4000-8000-000000000002', 'SEC_AU_M08B', 'Trưởng ngành Ấu M08B'),
  ('f1000000-0000-4000-8000-000000000003', 'SEC_NGHIA_M08B', 'Trưởng ngành Nghĩa M08B'),
  ('f1000000-0000-4000-8000-000000000004', 'ADMIN_M08B', 'Quản trị M08B'),
  ('f1000000-0000-4000-8000-000000000005', 'GROUP_M08B', 'Xứ đoàn trưởng M08B'),
  ('f1000000-0000-4000-8000-000000000006', 'REP_AU1_M08B', 'Đại diện Ấu 1 M08B'),
  ('f1000000-0000-4000-8000-000000000007', 'REP_NGHIA_M08B', 'Đại diện Nghĩa 3 M08B'),
  ('f1000000-0000-4000-8000-000000000008', 'REP_CLOSED_M08B', 'Đại diện lớp năm đóng M08B');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f0000000-0000-4000-8000-000000000001', '2090-2091', 'Năm nguồn M08B', '2090-09-01', '2091-05-31', 'draft', '2096-05-31'),
  ('f0000000-0000-4000-8000-000000000002', '2091-2092', 'Năm đích M08B', '2091-09-01', '2092-05-31', 'draft', '2097-05-31'),
  ('f0000000-0000-4000-8000-000000000003', '2089-2090', 'Năm đã đóng M08B', '2089-09-01', '2090-05-31', 'draft', '2095-05-31'),
  ('f0000000-0000-4000-8000-000000000004', '2092-2093', 'Năm đích đã đóng M08B', '2092-09-01', '2093-05-31', 'draft', '2098-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  -- Lớp nguồn, năm còn ghi được.
  ('f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000006', 'A', 'catechism', 'full_year', 'Ấu 3A nguồn M08B'),
  ('f6000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000012', null, 'catechism', 'full_year', 'Nghĩa 3 nguồn M08B'),
  ('f6000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A nguồn M08B'),
  -- Lớp đích, năm còn ghi được.
  ('f6000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A đích M08B'),
  ('f6000000-0000-4000-8000-000000000014', 'f0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000013', null, 'catechism', 'full_year', 'Hiệp 1 đích M08B'),
  ('f6000000-0000-4000-8000-000000000015', 'f0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'catechism', 'full_year', 'Ấu 2A đích M08B'),
  -- Lớp của năm ĐÃ ĐÓNG (nguồn) và lớp đích thuộc một năm ĐÃ ĐÓNG.
  ('f6000000-0000-4000-8000-000000000021', 'f0000000-0000-4000-8000-000000000003', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A năm đóng M08B'),
  ('f6000000-0000-4000-8000-000000000022', 'f0000000-0000-4000-8000-000000000004', '20000000-0000-0000-0000-000000000005', 'A', 'catechism', 'full_year', 'Ấu 2A năm đích đóng M08B');

-- 🔴 Một đại diện cho MỖI lớp, không phải một người cầm bốn lớp: index
-- `class_staff_one_active_class_per_staff_idx` (M04) chỉ cho một nhân sự đứng ở
-- **một** lớp đang hoạt động — và đó chính là hàng rào Q-01 = "GLV một lớp" mà
-- `11` §1 đã chốt, nên bộ kiểm phải tôn trọng nó thay vì đi vòng.
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Ấu 3 M08B', '0970000001'),
  ('f7000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'anh', 'Trưởng ngành Ấu M08B', '0970000002'),
  ('f7000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'anh', 'Trưởng ngành Nghĩa M08B', '0970000003'),
  ('f7000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000006', 'chi', 'Đại diện Ấu 1 M08B', '0970000006'),
  ('f7000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000007', 'anh', 'Đại diện Nghĩa 3 M08B', '0970000007'),
  ('f7000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000008', 'chi', 'Đại diện lớp năm đóng M08B', '0970000008'),
  -- Xứ đoàn trưởng cũng là nhân sự: `role_assignments` có chốt STAFF_PROFILE_REQUIRED
  -- cho mọi vai trò trong STAFF_PROFILE_ROLES. Chỉ Super Admin được miễn.
  ('f7000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', 'anh', 'Xứ đoàn trưởng M08B', '0970000005');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('f6000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000001', 'representative', '2090-09-01'),
  ('f6000000-0000-4000-8000-000000000005', 'f7000000-0000-4000-8000-000000000006', 'representative', '2090-09-01'),
  ('f6000000-0000-4000-8000-000000000004', 'f7000000-0000-4000-8000-000000000007', 'representative', '2090-09-01'),
  ('f6000000-0000-4000-8000-000000000021', 'f7000000-0000-4000-8000-000000000008', 'representative', '2089-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f1000000-0000-4000-8000-000000000001', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002'),
  ('f1000000-0000-4000-8000-000000000006', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000005'),
  ('f1000000-0000-4000-8000-000000000007', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000004'),
  ('f1000000-0000-4000-8000-000000000008', 'class_representative', 'f0000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000021');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('f1000000-0000-4000-8000-000000000002', 'sector_leader', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-4000-8000-000000000003', 'sector_leader', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000004');
insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000004', 'super_admin'),
  ('f1000000-0000-4000-8000-000000000005', 'group_leader');

insert into public.guardians (id, full_name, phone) values
  ('f2000000-0000-4000-8000-000000000001', 'Phụ huynh M08B', '0970000099');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Maria', 'Thiếu Bí Tích', 'female', '2016-01-01'),
  ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001', 'Anna', 'Đủ Bí Tích', 'female', '2016-02-02'),
  ('f3000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000001', 'Gioan', 'Lớp Thường', 'male', '2016-03-03'),
  ('f3000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000001', 'Phêrô', 'Nghĩa Sĩ', 'male', '2012-04-04'),
  ('f3000000-0000-4000-8000-000000000005', 'f2000000-0000-4000-8000-000000000001', 'Phaolô', 'Đường Vòng', 'male', '2016-05-05'),
  ('f3000000-0000-4000-8000-000000000006', 'f2000000-0000-4000-8000-000000000001', 'Giuse', 'Một Nút', 'male', '2016-06-06'),
  ('f3000000-0000-4000-8000-000000000007', 'f2000000-0000-4000-8000-000000000001', 'Têrêsa', 'Đích Đã Đóng', 'female', '2016-07-07'),
  ('f3000000-0000-4000-8000-000000000008', 'f2000000-0000-4000-8000-000000000001', 'Martino', 'Năm Đã Đóng', 'male', '2016-08-08'),
  ('f3000000-0000-4000-8000-000000000009', 'f2000000-0000-4000-8000-000000000001', 'Đaminh', 'Một Nút Thiếu Bí Tích', 'male', '2016-09-09');

-- Em "Đủ Bí Tích" có sẵn hai bí tích của ngành Ấu; em "Nghĩa Sĩ" có ba, thiếu
-- đúng Rửa Tội — đó là bài đo vế hai của D-161.
insert into public.student_sacraments (student_id, sacrament_type, sacrament_date) values
  ('f3000000-0000-4000-8000-000000000002', 'first_confession', '2088-04-01'),
  ('f3000000-0000-4000-8000-000000000002', 'first_communion', '2088-05-01'),
  ('f3000000-0000-4000-8000-000000000004', 'first_confession', '2084-04-01'),
  ('f3000000-0000-4000-8000-000000000004', 'first_communion', '2084-05-01'),
  ('f3000000-0000-4000-8000-000000000004', 'confirmation', '2088-05-01');

insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000005', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000004', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000005', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000006', 'f3000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000005', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000007', 'f3000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000005', 'active', '2090-09-01'),
  ('f4000000-0000-4000-8000-000000000008', 'f3000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000021', 'active', '2089-09-01'),
  ('f4000000-0000-4000-8000-000000000009', 'f3000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000002', 'active', '2090-09-01');

-- ===========================================================================
-- AC-16 · AC-17 — cảnh báo bí tích trong `warning_snapshot`.
-- ===========================================================================
-- Dựng lịch sử theo thứ tự hợp lệ trước khi đo year gate.
update public.academic_years
set status = 'closed'
where id in (
  'f0000000-0000-4000-8000-000000000003',
  'f0000000-0000-4000-8000-000000000004'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000001', 'recommended_promote', 'f6000000-0000-4000-8000-000000000012', false, null)$$,
  'đề xuất được cho em lớp cuối ngành dù thiếu bí tích (BR-M08-18)');
select is(
  (select warning_snapshot -> 'missingSacraments' from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000001'),
  '["first_confession", "first_communion"]'::jsonb,
  'AC-16: snapshot liệt kê đúng hai bí tích còn thiếu của ngành Ấu');
select ok(
  (select (warning_snapshot ->> 'sacramentReviewRequired')::boolean from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000001'),
  'AC-16: snapshot bật cờ lớp cuối ngành');
select ok(
  not ((select warning_snapshot -> 'missingSacraments' from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000001') @> '["baptism"]'::jsonb),
  'D-161: Ấu 3 KHÔNG nhắc Rửa Tội dù em chưa có — đo đúng quyết định của chủ dự án');

select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000002', 'recommended_promote', 'f6000000-0000-4000-8000-000000000012', false, null)$$,
  'đề xuất cho em đã đủ bí tích ngành Ấu');
select is(
  (select warning_snapshot -> 'missingSacraments' from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000002'),
  '[]'::jsonb,
  'em đủ bí tích thì danh sách thiếu rỗng, cờ vẫn bật (lớp vẫn là lớp cuối ngành)');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000007', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000004', 'recommended_promote', 'f6000000-0000-4000-8000-000000000014', false, null)$$,
  'đề xuất cho em Nghĩa 3');
select is(
  (select warning_snapshot -> 'missingSacraments' from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000004'),
  '["baptism"]'::jsonb,
  'D-161 vế hai: Nghĩa 3 không có bí tích mới nên nhắc lại Rửa Tội còn thiếu');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000003', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, null)$$,
  'đề xuất cho em lớp thường');
select ok(
  not ((select warning_snapshot from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000003') ? 'sacramentReviewRequired'),
  'AC-17: lớp KHÔNG phải cấp cuối ngành thì snapshot không có khoá bí tích nào');

-- BR-M08-18 — cảnh báo bí tích **không** hard-block.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000001'), 'approve', null, 'Gia đình đã đăng ký lớp giáo lý bí tích')$$,
  'BR-M08-18: thiếu bí tích vẫn duyệt được, chỉ là cảnh báo');

-- 🔴 QUẢ MÌN của migration: trigger BR-M08-20 nằm trên `enrollments` và fire cả
-- cho RPC. Bài này đo rằng thứ tự lệnh mới **không** chặn chính đường duyệt.
select is(
  (select status from public.enrollments where id = 'f4000000-0000-4000-8000-000000000001'),
  'completed'::public.enrollment_status,
  'đường duyệt hợp lệ vẫn đóng được ghi danh nguồn dù trigger BR-M08-20 đang bật');

-- ===========================================================================
-- D-157 / AC-18 — NHẬT KÝ QUYẾT ĐỊNH.
-- Kịch bản đúng nguyên văn AC-18: từ chối có lý do → gửi lại → duyệt.
-- ===========================================================================
select is(
  (select count(*)::integer from public.promotion_review_events as event
   join public.promotion_reviews as review on review.id = event.review_id
   where review.source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'),
  1, 'một lượt đề xuất để lại đúng một dòng nhật ký');

select lives_ok(
  $$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'), 'reject', null, 'Chưa đủ chuyên cần')$$,
  'trưởng ngành từ chối kèm lý do');
select is(
  (select review_note from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'),
  'Chưa đủ chuyên cần', 'lý do từ chối nằm trên hàng review ngay sau khi từ chối');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000003', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, 'Đã bổ sung buổi bù')$$,
  'BR-M08-16: đại diện gửi lại trên cùng ghi danh');
select is(
  (select review_note from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'),
  null, 'BR-M08-16 GIỮ NGUYÊN: gửi lại vẫn xoá lý do khỏi hàng review');
select is(
  (select event.note from public.promotion_review_events as event
   join public.promotion_reviews as review on review.id = event.review_id
   where review.source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'
     and event.event_type = 'rejected'),
  'Chưa đủ chuyên cần',
  'AC-18: lý do từ chối VẪN CÒN trong nhật ký sau khi gửi lại — điều bản cũ làm mất');
select is(
  (select event.actor_id from public.promotion_review_events as event
   join public.promotion_reviews as review on review.id = event.review_id
   where review.source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'
     and event.event_type = 'rejected'),
  'f1000000-0000-4000-8000-000000000002'::uuid,
  'AC-18: nhật ký giữ đúng NGƯỜI từ chối');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'), 'approve', null, 'Đồng ý')$$,
  'trưởng ngành duyệt lượt gửi lại');
select is(
  (select string_agg(event.event_type, ',' order by event.event_no)
   from public.promotion_review_events as event
   join public.promotion_reviews as review on review.id = event.review_id
   where review.source_enrollment_id = 'f4000000-0000-4000-8000-000000000003'),
  'proposed,rejected,proposed,approved',
  'bốn bước quyết định nằm đúng thứ tự trong nhật ký');

-- Append-only: đo bằng CHÍNH quyền chủ bảng, vì trigger là thứ đứng độc lập với
-- mọi `grant` — chặn được `postgres` thì chặn được tất cả.
reset role;
select throws_ok(
  $$update public.promotion_review_events set note = 'sửa trộm' where event_type = 'rejected'$$,
  '42501', 'PROMOTION_EVENT_APPEND_ONLY', 'nhật ký không sửa được, kể cả bằng quyền chủ bảng');
select throws_ok(
  $$delete from public.promotion_review_events where event_type = 'rejected'$$,
  '42501', 'PROMOTION_EVENT_APPEND_ONLY', 'nhật ký không xoá được, kể cả bằng quyền chủ bảng');
select ok(
  has_table_privilege('authenticated', 'public.promotion_review_events', 'SELECT'),
  'người đăng nhập đọc được nhật ký trong phạm vi RLS');
select ok(
  not has_table_privilege('authenticated', 'public.promotion_review_events', 'INSERT')
  and not has_table_privilege('authenticated', 'public.promotion_review_events', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.promotion_review_events', 'DELETE'),
  'BR-M08-24: không có đường ghi thẳng vào nhật ký từ Data API');

-- ===========================================================================
-- Nợ #18 / D-160 — HÀNG RÀO NĂM HỌC ĐÃ ĐÓNG, CẢ HAI VẾ.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000008', true);
select throws_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000008', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, null)$$,
  '42501', 'ACADEMIC_YEAR_CLOSED',
  'D-160 vế nguồn: không đề xuất được cho ghi danh của một năm học đã đóng');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000008', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, null)$$,
  'D-117 vẫn đứng: Quản trị viên hệ thống là ngoại lệ duy nhất của hàng rào năm học');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000007', 'recommended_promote', 'f6000000-0000-4000-8000-000000000022', false, null)$$,
  'đề xuất sang một lớp thuộc năm đích đã đóng vẫn TẠO được (bước này chưa ghi vào năm đích)');
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000007'), 'approve', null, null)$$,
  '42501', 'ACADEMIC_YEAR_CLOSED',
  'D-160 vế đích: không duyệt được vào một năm học đã đóng');
select is(
  (select status from public.enrollments where id = 'f4000000-0000-4000-8000-000000000007'),
  'active'::public.enrollment_status,
  'lượt duyệt bị hàng rào chặn không để lại thay đổi nào trên ghi danh nguồn');

-- ===========================================================================
-- D-158 / D-162 / BR-M08-20 — BỊT ĐƯỜNG VÒNG ĐÓNG GHI DANH.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select lives_ok(
  $$select public.propose_promotion('f4000000-0000-4000-8000-000000000005', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, null)$$,
  'dựng một đề xuất chờ duyệt để kiểm đường vòng');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$update public.enrollments set status = 'withdrawn', ended_on = '2091-05-31', updated_by = auth.uid() where id = 'f4000000-0000-4000-8000-000000000005'$$,
  '42501', 'ENROLLMENT_HAS_PENDING_PROMOTION',
  'BR-M08-20: không đóng được ghi danh đang có đề xuất chờ duyệt, kể cả gọi thẳng Data API');
select is(
  (select status from public.enrollments where id = 'f4000000-0000-4000-8000-000000000005'),
  'active'::public.enrollment_status,
  'lượt đóng bị chặn giữ nguyên ghi danh');
select lives_ok(
  $$update public.enrollments set status = 'paused', ended_on = null, updated_by = auth.uid() where id = 'f4000000-0000-4000-8000-000000000005'$$,
  'D-162: "Tạm nghỉ" VẪN chạy — nó không đóng ghi danh nên không sinh đề xuất mồ côi');
select lives_ok(
  $$select public.approve_promotion_review((select id from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000005'), 'reject', null, 'Xử lý tay')$$,
  'từ chối đề xuất để gỡ khoá');
select lives_ok(
  $$update public.enrollments set status = 'withdrawn', ended_on = '2091-05-31', updated_by = auth.uid() where id = 'f4000000-0000-4000-8000-000000000005'$$,
  'hết đề xuất chờ duyệt thì đóng ghi danh lại được như cũ');

-- ===========================================================================
-- D-159 — MỘT NÚT "CHUYỂN LỚP" CHO CẤP XỨ ĐOÀN.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select throws_ok(
  $$select public.promote_enrollment_now('f4000000-0000-4000-8000-000000000006', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, null)$$,
  '42501', 'FORBIDDEN',
  '0 thay đổi phân quyền: Giáo lý viên đại diện KHÔNG tự duyệt được qua đường mới');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$select public.promote_enrollment_now('f4000000-0000-4000-8000-000000000006', 'recommended_promote', 'f6000000-0000-4000-8000-000000000015', false, 'Chuyển thẳng cuối năm')$$,
  'D-159: cấp xứ đoàn chuyển lớp trong một lượt');
select is(
  (select status from public.enrollments where id = 'f4000000-0000-4000-8000-000000000006'),
  'completed'::public.enrollment_status,
  'chuyển thẳng đóng ghi danh nguồn');
select is(
  (select count(*)::integer from public.enrollments where previous_enrollment_id = 'f4000000-0000-4000-8000-000000000006'),
  1, 'chuyển thẳng tạo đúng MỘT ghi danh đích');
select is(
  (select string_agg(event.event_type, ',' order by event.event_no)
   from public.promotion_review_events as event
   join public.promotion_reviews as review on review.id = event.review_id
   where review.source_enrollment_id = 'f4000000-0000-4000-8000-000000000006'),
  'proposed,approved',
  'chuyển thẳng vẫn để lại đủ hai bước trong nhật ký — nguyên tử không có nghĩa là không có vết');
select is(
  (select final_status from public.promotion_reviews where source_enrollment_id = 'f4000000-0000-4000-8000-000000000006'),
  'approved'::public.promotion_status,
  'chuyển thẳng không để lại đề xuất mồ côi (D-159)');

-- 🔴 **Lỗ do CHÍNH đợt này mở ra, và đây là ba bài canh nó.** Đường một bước
-- không đi qua Server Action `reviewPromotion` — nơi giữ luật *"thiếu bí tích thì
-- bắt buộc nêu ý kiến"* của đường hai bước — nên nếu không chặn trong RPC thì bốn
-- vai trò cấp xứ đoàn đi vòng qua đúng luật vừa dựng, bằng một nút đợt này thêm vào.
select throws_ok(
  $$select public.promote_enrollment_now('f4000000-0000-4000-8000-000000000009', 'recommended_promote', 'f6000000-0000-4000-8000-000000000012', false, null)$$,
  '23514', 'PROMOTION_NOTE_REQUIRED',
  'AC-16 vế ba: đường MỘT BƯỚC cũng đòi ý kiến khi em thiếu bí tích lớp cuối ngành');
select is(
  (select count(*)::integer from public.enrollments where previous_enrollment_id = 'f4000000-0000-4000-8000-000000000009'),
  0, 'lượt bị chặn không tạo ghi danh nào — cả giao dịch cuộn lại');
select lives_ok(
  $$select public.promote_enrollment_now('f4000000-0000-4000-8000-000000000002', 'recommended_promote', 'f6000000-0000-4000-8000-000000000012', false, null)$$,
  'BR-M08-18: em ĐỦ bí tích thì không đòi gì thêm — luật gắn vào "còn thiếu", không gắn vào "lớp cuối ngành"');

select * from finish();
rollback;
