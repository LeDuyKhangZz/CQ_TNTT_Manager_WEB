begin;

-- ===========================================================================
-- M08-C — cửa sổ hẹp `public.list_promotion_actor_names` (hạng mục 8 của
-- `07_IMPLEMENTATION_IMPACT`: *"hiển thị người đề xuất / người duyệt"*).
--
-- 🔴 **Bài quan trọng nhất của file này là bài CANH HIỆN TRẠNG** (#6): sau
-- migration, Giáo lý viên đại diện đọc thẳng `public.profiles` **vẫn** chỉ thấy
-- đúng một hàng — hàng của chính mình. Đó là điều phân biệt "một cửa sổ hẹp" với
-- "một lần nới quyền": ranh giới cũ không nhúc nhích, chỉ có thêm một ô cửa có
-- kích thước đo được. Cùng hình dạng bài S-06 của D-129 (M03-C).
--
-- File riêng chứ không nối vào `046` vì điều kiện đầu vào khác hẳn: 046 đo
-- **luật ghi** (bí tích · nhật ký · hàng rào năm học), file này đo **ranh giới
-- đọc** và cần một người ngoài cuộc chưa từng thao tác gì để chứng minh hàm
-- **không phải một cuốn danh bạ**.
--
-- Mọi khẳng định chạy bằng **JWT thật của từng vai trò** (`request.jwt.claim.sub`),
-- đúng `AGENTS` §5 và `11` §5 mục cuối. Tám vai trò, không một lượt `service_role`.
-- ===========================================================================
select plan(18);

-- ── Cấu trúc và quyền gọi ───────────────────────────────────────────────────
select has_function('public', 'list_promotion_actor_names', array['uuid'],
  'cửa sổ hẹp tên người tồn tại');
select ok(
  has_function_privilege('authenticated', 'public.list_promotion_actor_names(uuid)', 'execute'),
  'authenticated gọi được cửa sổ hẹp');
select ok(
  not has_function_privilege('anon', 'public.list_promotion_actor_names(uuid)', 'execute'),
  'anon KHÔNG gọi được cửa sổ hẹp (revoke from public, anon)');

-- ── Dữ liệu dựng sẵn ────────────────────────────────────────────────────────
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-au1-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-au-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-nghia-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-nghia-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-au1-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'group-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'treasurer-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-thieu-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bystander-m08c@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

-- 🔴 `NGOAI_CUOC_M08C` là nhân vật then chốt của file: một tài khoản **có thật,
-- đang hoạt động**, chưa từng đề xuất và chưa từng duyệt. Không ai — kể cả Xứ
-- đoàn trưởng, người có `can_global_read()` — được thấy tên này qua cửa sổ hẹp.
insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000001', 'REP_AU1_M08C', 'Đại diện Ấu 1A M08C'),
  ('c1000000-0000-4000-8000-000000000002', 'SEC_AU_M08C', 'Trưởng ngành Ấu M08C'),
  ('c1000000-0000-4000-8000-000000000003', 'SEC_NGHIA_M08C', 'Trưởng ngành Nghĩa M08C'),
  ('c1000000-0000-4000-8000-000000000004', 'REP_NGHIA_M08C', 'Đại diện Nghĩa 3 M08C'),
  ('c1000000-0000-4000-8000-000000000005', 'TEACHER_AU1_M08C', 'Giáo lý viên Ấu 1A M08C'),
  ('c1000000-0000-4000-8000-000000000006', 'GROUP_M08C', 'Xứ đoàn trưởng M08C'),
  ('c1000000-0000-4000-8000-000000000007', 'TREASURER_M08C', 'Thủ quỹ M08C'),
  ('c1000000-0000-4000-8000-000000000008', 'REP_THIEU_M08C', 'Đại diện Thiếu 1A M08C'),
  ('c1000000-0000-4000-8000-000000000009', 'NGOAI_CUOC_M08C', 'Người Ngoài Cuộc M08C');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('c0000000-0000-4000-8000-000000000001', '2093-2094', 'Năm nguồn M08C', '2093-09-01', '2094-05-31', 'draft', '2099-05-31'),
  ('c0000000-0000-4000-8000-000000000002', '2094-2095', 'Năm đích M08C', '2094-09-01', '2095-05-31', 'draft', '2100-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  -- Ấu 1A: lớp có đủ một vòng đề xuất → từ chối, tức có CẢ HAI actor.
  ('c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A nguồn M08C'),
  -- Nghĩa 3: lớp của ngành KHÁC — dùng để đo ca âm tính giữa hai ngành.
  ('c6000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000012', null, 'catechism', 'full_year', 'Nghĩa 3 nguồn M08C'),
  -- Thiếu 1A: lớp KHÔNG có đề xuất nào — đại diện của nó phải nhận về 0 dòng.
  ('c6000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A nguồn M08C'),
  ('c6000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'catechism', 'full_year', 'Ấu 2A đích M08C');

-- Một nhân sự đứng ở đúng một lớp đang hoạt động — index
-- `class_staff_one_active_class_per_staff_idx` (M04) và cũng là Q-01 "GLV một lớp".
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c7000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Ấu 1A M08C', '0960000001'),
  ('c7000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'anh', 'Trưởng ngành Ấu M08C', '0960000002'),
  ('c7000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'anh', 'Trưởng ngành Nghĩa M08C', '0960000003'),
  ('c7000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', 'anh', 'Đại diện Nghĩa 3 M08C', '0960000004'),
  ('c7000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000005', 'chi', 'Giáo lý viên Ấu 1A M08C', '0960000005'),
  ('c7000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000006', 'anh', 'Xứ đoàn trưởng M08C', '0960000006'),
  ('c7000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000007', 'chi', 'Thủ quỹ M08C', '0960000007'),
  ('c7000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000008', 'chi', 'Đại diện Thiếu 1A M08C', '0960000008');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000001', 'representative', '2093-09-01'),
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000005', 'member', '2093-09-01'),
  ('c6000000-0000-4000-8000-000000000002', 'c7000000-0000-4000-8000-000000000004', 'representative', '2093-09-01'),
  ('c6000000-0000-4000-8000-000000000003', 'c7000000-0000-4000-8000-000000000008', 'representative', '2093-09-01');

insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('c1000000-0000-4000-8000-000000000001', 'class_representative', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000005', 'class_teacher', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000004', 'class_representative', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000002'),
  ('c1000000-0000-4000-8000-000000000008', 'class_representative', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000003');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('c1000000-0000-4000-8000-000000000002', 'sector_leader', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-4000-8000-000000000003', 'sector_leader', 'c0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000004');
insert into public.role_assignments (profile_id, role) values
  ('c1000000-0000-4000-8000-000000000006', 'group_leader'),
  ('c1000000-0000-4000-8000-000000000007', 'treasurer');

insert into public.guardians (id, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000001', 'Phụ huynh M08C', '0960000099');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'Maria', 'Ấu Một A', 'female', '2017-01-01'),
  ('c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'Phêrô', 'Nghĩa Sĩ Ba', 'male', '2012-02-02');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('c4000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', 'active', '2093-09-01'),
  ('c4000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000002', 'active', '2093-09-01');

-- ── Sinh dữ liệu bằng chính hai RPC, không `insert` tay vào bảng review ──────
-- Ghi tay là tự đặt `proposed_by`/`reviewed_by` theo ý mình, tức đo một thứ
-- không phải thứ hệ thống thật tạo ra.
set local role authenticated;

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);
select public.propose_promotion(
  'c4000000-0000-4000-8000-000000000001', 'recommended_promote',
  'c6000000-0000-4000-8000-000000000004', false, 'Em học đều');

-- Trưởng ngành Ấu **từ chối** — sau bước này hàng review mang cả `proposed_by`
-- (đại diện) lẫn `reviewed_by` (trưởng ngành), tức đúng hai người.
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select public.approve_promotion_review(
  (select id from public.promotion_reviews where source_enrollment_id = 'c4000000-0000-4000-8000-000000000001'),
  'reject', null, 'Chưa đủ chuyên cần');

-- Ngành Nghĩa: "Tạm nghỉ" nên không cần lớp đích, và cố ý **không duyệt** —
-- một mình đại diện Nghĩa là actor của đề xuất này.
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000004', true);
select public.propose_promotion(
  'c4000000-0000-4000-8000-000000000002', 'temporarily_pause', null, false, null);

-- ===========================================================================
-- A. GIÁO LÝ VIÊN ĐẠI DIỆN — người mà `profiles` đóng cửa với họ.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')),
  2, 'đại diện Ấu 1A đọc được đúng hai người đã ra quyết định trên lớp mình');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Trưởng ngành Ấu M08C'),
  1, 'hạng mục 8: đại diện đọc được TÊN người duyệt — thứ trước migration này không có đường nào lấy');

-- 🔴 CANH HIỆN TRẠNG. Nếu bài này đỏ thì migration đã nới `profiles` chứ không
-- mở một cửa sổ hẹp, và cái nới ấy kéo theo `username` · `phone` · `email` ·
-- `account_status` của **mọi** tài khoản.
select is(
  (select count(*)::integer from public.profiles),
  1, 'ranh giới cũ KHÔNG nhúc nhích: đọc thẳng public.profiles vẫn chỉ thấy hàng của chính mình');

select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Đại diện Nghĩa 3 M08C'),
  0, 'đại diện Ấu 1A KHÔNG đọc được tên người thao tác ở ngành khác');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Người Ngoài Cuộc M08C'),
  0, 'KHÔNG phải danh bạ: tài khoản chưa từng đề xuất/duyệt không bao giờ xuất hiện');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000002')),
  0, 'phạm vi theo NĂM HỌC: hỏi năm khác thì không trả về ai (BR-M08-14)');

-- ===========================================================================
-- B. HAI TRƯỞNG NGÀNH — ranh giới ngành phải cắt đúng ở cả hai chiều.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Đại diện Ấu 1A M08C'),
  1, 'trưởng ngành Ấu đọc được tên người đề xuất trong ngành mình');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Đại diện Nghĩa 3 M08C'),
  0, 'trưởng ngành Ấu KHÔNG đọc được tên người thao tác ở ngành Nghĩa');

select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Đại diện Nghĩa 3 M08C'),
  1, 'trưởng ngành Nghĩa đọc được tên người đề xuất trong ngành mình');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name in ('Đại diện Ấu 1A M08C', 'Trưởng ngành Ấu M08C')),
  0, 'chiều ngược lại cũng cắt: trưởng ngành Nghĩa KHÔNG thấy hai người của ngành Ấu');

-- ===========================================================================
-- C. GIÁO LÝ VIÊN LỚP (không phải đại diện) — nhánh `app.is_class_staff`.
-- Họ KHÔNG đề xuất được (AC-03) nhưng vẫn đọc được đề xuất của lớp mình, nên
-- phải đọc được cả tên đi kèm — nếu không, bảng của họ có một cột trống vô cớ.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')),
  2, 'giáo lý viên lớp đọc được tên qua nhánh is_class_staff');

-- ===========================================================================
-- D. CẤP XỨ ĐOÀN VÀ CA ÂM TÍNH.
-- ===========================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000006', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name in ('Đại diện Ấu 1A M08C', 'Đại diện Nghĩa 3 M08C')),
  2, 'Xứ đoàn trưởng đọc toàn cục nên thấy người thao tác của cả hai ngành');
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')
   where display_name = 'Người Ngoài Cuộc M08C'),
  0, 'kể cả người đọc toàn cục cũng KHÔNG biến cửa sổ hẹp thành danh bạ');

-- Thủ quỹ: SEC-01 cấm họ vào `/promotions`, và tầng dữ liệu nói cùng một câu.
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')),
  0, 'SEC-01: Thủ quỹ không đọc được đề xuất nào nên không đọc được tên nào');

-- Đại diện một lớp KHÔNG có đề xuất nào: có quyền, nhưng không có gì để đọc.
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000008', true);
select is(
  (select count(*)::integer from public.list_promotion_actor_names('c0000000-0000-4000-8000-000000000001')),
  0, 'đại diện lớp chưa có đề xuất nào nhận về danh sách rỗng, không phải danh sách toàn trường');

select * from finish();
rollback;
