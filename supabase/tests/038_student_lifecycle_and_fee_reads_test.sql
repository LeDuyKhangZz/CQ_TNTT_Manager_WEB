begin;

select plan(57);

-- ============================================================================
-- M03-C — bốn thay đổi phân quyền của đợt, **tất cả kiểm bằng JWT thật**
-- (`11` §5 mục 15). Không dùng service role ở bất kỳ bài nào (`CLAUDE.md` §4).
--
--   1. **D-127** (Q-M03-02 chốt 2026-07-28) — Trưởng/Phó ngành và Giáo lý viên
--      GHI được sức khoẻ và bí tích, **chỉ trong phạm vi mình**. Nhóm âm tính
--      quan trọng nhất ở đây là **Dự trưởng phụ tá**: `docs/05` §3 cho họ 👁📍
--      (chỉ đọc), nên họ là vai trò duy nhất của nhóm lớp KHÔNG được nới.
--   2. **D-128** (Q-M03-05) — xoá bí tích hẹp hơn ghi một bậc: bốn vai trò vừa
--      được trao quyền ghi ở D-127 đều không xoá được.
--   3. **TB-F06 / D-130** — `set_student_status` đổi cả hai trục trong MỘT giao
--      dịch, và lưới an toàn chặn tổ hợp vô nghĩa. Bài quan trọng nhất là
--      **S-11** của `08_ACCEPTANCE_CRITERIA` §7: em đã lưu trữ thì Giáo lý viên
--      **mất quyền đọc** hồ sơ và sức khoẻ — tiêu chí này trước M03-C đang SAI.
--   4. **D-67 / D-129** — Thủ quỹ đọc qua cửa sổ hẹp. Bài **S-06** ("Thủ quỹ đọc
--      `students` trả 0 dòng") phải **vẫn xanh**: ranh giới cũ không nhúc nhích,
--      chỉ có thêm một ô cửa có kích thước đo được.
--
-- ⚠️ Năm học dùng `draft`, KHÔNG phải `current`: chỉ được tồn tại đúng một năm
-- `current` (`academic_years_one_current_idx`) mà `seed:dev` đã tạo một — cùng
-- cái bẫy M03-A đã ghi lại. Và không bài nào chốt cứng một con số đếm toàn cục,
-- để file chạy được **cả trên DB vừa reset lẫn sau `seed:dev`**.
-- ============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('a1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-tk@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-glv@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-dt@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-tq@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('a1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lc-ph@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('a1000000-0000-4000-8000-000000000001', 'LC_TK', 'Thư ký M03C'),
  ('a1000000-0000-4000-8000-000000000002', 'LC_AU', 'Trưởng ngành Ấu M03C'),
  ('a1000000-0000-4000-8000-000000000003', 'LC_GLV', 'Giáo lý viên M03C'),
  ('a1000000-0000-4000-8000-000000000004', 'LC_DT', 'Dự trưởng phụ tá M03C'),
  ('a1000000-0000-4000-8000-000000000005', 'LC_TQ', 'Thủ quỹ M03C'),
  ('a1000000-0000-4000-8000-000000000006', 'LC_PH', 'Phụ huynh M03C');

-- `app.validate_staff_role_link()` đòi hồ sơ nhân sự cho MỌI vai trò trong
-- `STAFF_PROFILE_ROLES` — kể cả Thư ký và Thủ quỹ, hai vai trò không đứng lớp.
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'chi', 'Thư Ký LC', '0900000900'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ngành Ấu LC', '0900000901'),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000003', 'chi', 'Giáo Lý Viên LC', '0900000902'),
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004', 'anh', 'Dự Trưởng LC', '0900000903'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000005', 'anh', 'Thủ Quỹ LC', '0900000904');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('a3000000-0000-4000-8000-000000000001', '2084-2085', 'Năm vòng đời M03C', '2084-09-01', '2085-05-31', '2090-05-31', 'draft'),
  ('a3000000-0000-4000-8000-000000000002', '2068-2069', 'Năm đã đóng M03C', '2068-09-01', '2069-05-31', '2074-05-31', 'closed');

-- `section_code` chỉ nhận 'A' hoặc 'B' (`classes_section_code`), và bộ ba
-- (năm · khối · phân đoạn) là duy nhất — hai năm học riêng của file này nên 'A'
-- vẫn còn trống.
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('a4000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu LC 1A', 'active'),
  ('a4000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu LC 1A', 'active'),
  ('a4000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu LC năm đóng', 'active');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('a5000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000006', 'Phụ huynh LC một', '0900001001'),
  ('a5000000-0000-4000-8000-000000000002', null, 'Phụ huynh LC hai', '0900001002'),
  ('a5000000-0000-4000-8000-000000000003', null, 'Phụ huynh LC ba', '0900001003');

-- S1 mang `hardship_flag` để kiểm **D-129** (Thủ quỹ thấy dấu hoàn cảnh khó khăn).
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth, hardship_flag) values
  ('a6000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 'Maria', 'Phạm Thị Hạnh', 'female', '2015-05-05', true),
  ('a6000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'Giuse', 'Vũ Đức Kiên', 'male', '2013-06-06', false),
  ('a6000000-0000-4000-8000-000000000003', 'a5000000-0000-4000-8000-000000000003', 'Anna', 'Ngô Thị Lành', 'female', '2015-07-07', false),
  ('a6000000-0000-4000-8000-000000000004', 'a5000000-0000-4000-8000-000000000002', 'Phêrô', 'Bùi Văn Mạnh', 'male', '2014-08-08', false);

insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('a6000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'active', '2084-09-05'),
  ('a6000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'active', '2084-09-05'),
  ('a6000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'active', '2084-09-05'),
  ('a6000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000003', 'active', '2068-09-05');

insert into public.role_assignments (profile_id, role) values
  ('a1000000-0000-4000-8000-000000000001', 'secretary'),
  ('a1000000-0000-4000-8000-000000000005', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('a1000000-0000-4000-8000-000000000002', 'sector_leader', 'a3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2084-09-01');
-- Vai trò LỚP đòi một phân công GLV còn hiệu lực (`ACTIVE_CLASS_ASSIGNMENT_REQUIRED`).
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on, is_active) values
  ('a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000003', 'member', '2084-09-01', true),
  -- Dự trưởng phụ tá đi với `capacity = 'trainee'`; vai trò và sức vụ phải khớp
  -- nhau (`validate_role_assignment_scope`).
  ('a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000004', 'trainee', '2084-09-01', true);
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('a1000000-0000-4000-8000-000000000003', 'class_teacher', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', '2084-09-01'),
  ('a1000000-0000-4000-8000-000000000004', 'trainee_assistant', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', '2084-09-01');
insert into public.role_assignments (profile_id, role, starts_on) values
  ('a1000000-0000-4000-8000-000000000006', 'guardian', '2084-09-01');

set local role authenticated;

-- ============================================================================
-- 1. D-127 — ai GHI được sức khoẻ và bí tích, và ghi lên em nào
-- ============================================================================

-- ── Trưởng ngành Ấu Nhi ─────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);

select ok(
  app.can_write_student_sensitive(),
  'D-127: Trưởng ngành nằm trong nhóm ghi sức khoẻ và bí tích'
);

select lives_ok(
  $$insert into public.student_health_profiles (student_id, allergies, updated_by)
    values ('a6000000-0000-4000-8000-000000000001', 'Hải sản', 'a1000000-0000-4000-8000-000000000002')$$,
  'D-127: Trưởng ngành ghi được hồ sơ sức khoẻ của em trong ngành mình'
);
select is(
  (select allergies from public.student_health_profiles
    where student_id = 'a6000000-0000-4000-8000-000000000001'),
  'Hải sản',
  'D-127: dữ liệu sức khoẻ thật sự được ghi'
);

-- 🔴 Bài ÂM TÍNH: RLS từ chối bằng **0 dòng**, không phải exception — với
-- `insert` thì nó ném `42501`, nên ở đây dùng `throws_ok`.
select throws_ok(
  $$insert into public.student_health_profiles (student_id, allergies, updated_by)
    values ('a6000000-0000-4000-8000-000000000002', 'Xâm phạm', 'a1000000-0000-4000-8000-000000000002')$$,
  '42501', null,
  '🔴 D-127: Trưởng ngành Ấu Nhi KHÔNG ghi được sức khoẻ em ngành Thiếu Nhi'
);

select lives_ok(
  $$insert into public.student_sacraments (student_id, sacrament_type, sacrament_date, updated_by)
    values ('a6000000-0000-4000-8000-000000000001', 'baptism', '2015-06-01', 'a1000000-0000-4000-8000-000000000002')$$,
  'D-127: Trưởng ngành ghi được bí tích của em trong ngành mình'
);
select throws_ok(
  $$insert into public.student_sacraments (student_id, sacrament_type, sacrament_date, updated_by)
    values ('a6000000-0000-4000-8000-000000000002', 'baptism', '2013-06-01', 'a1000000-0000-4000-8000-000000000002')$$,
  '42501', null,
  '🔴 D-127: Trưởng ngành Ấu Nhi KHÔNG ghi được bí tích em ngành Thiếu Nhi'
);

-- ── Giáo lý viên lớp ────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);

select ok(
  app.can_write_student_sensitive(),
  'D-127: Giáo lý viên lớp nằm trong nhóm ghi sức khoẻ và bí tích'
);
-- Đây là lý lẽ chính của D-127: người biết "em này dị ứng đậu phộng" là người
-- đứng lớp hằng tuần.
select lives_ok(
  $$update public.student_health_profiles
      set allergies = 'Đậu phộng', updated_by = 'a1000000-0000-4000-8000-000000000003'
    where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'D-127: Giáo lý viên sửa được sức khoẻ của em lớp mình'
);
select is(
  (select allergies from public.student_health_profiles
    where student_id = 'a6000000-0000-4000-8000-000000000001'),
  'Đậu phộng',
  'D-127: thay đổi của Giáo lý viên thật sự được ghi'
);

-- ── Dự trưởng phụ tá — 🔴 vai trò DUY NHẤT của nhóm lớp KHÔNG được nới ───────
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000004', true);

select ok(
  not app.can_write_student_sensitive(),
  '🔴 D-127: Dự trưởng phụ tá KHÔNG nằm trong nhóm ghi (docs/05 §3 cho họ 👁📍)'
);
select lives_ok(
  $$update public.student_health_profiles
      set allergies = 'Dự trưởng sửa', updated_by = 'a1000000-0000-4000-8000-000000000004'
    where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'câu lệnh chạy không lỗi — RLS lọc `update` bằng 0 dòng chứ không ném lỗi'
);
select is(
  (select allergies from public.student_health_profiles
    where student_id = 'a6000000-0000-4000-8000-000000000001'),
  'Đậu phộng',
  '🔴 D-127: Dự trưởng phụ tá KHÔNG sửa được sức khoẻ — dữ liệu không đổi'
);
select isnt_empty(
  $$select 1 from public.student_health_profiles
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'D-127: Dự trưởng phụ tá vẫn ĐỌC được sức khoẻ như trước (👁 không đổi)'
);

-- ── Phụ huynh — hàng rào cũ S-01/S-02 phải VẪN đứng sau khi nới ─────────────
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000006', true);

select is_empty(
  $$select 1 from public.student_health_profiles
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  '🔴 S-01: phụ huynh vẫn KHÔNG đọc được hồ sơ sức khoẻ của con'
);
select is_empty(
  $$select 1 from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  '🔴 S-02: phụ huynh vẫn KHÔNG đọc được bí tích của con'
);

-- ============================================================================
-- 2. D-128 — xoá bí tích, hẹp hơn quyền ghi một bậc
-- ============================================================================

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$delete from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'câu lệnh chạy không lỗi — RLS lọc `delete` bằng 0 dòng'
);
select isnt_empty(
  $$select 1 from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  '🔴 D-128: Giáo lý viên GHI được bí tích nhưng KHÔNG xoá được'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$delete from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'câu lệnh chạy không lỗi cho Trưởng ngành'
);
select isnt_empty(
  $$select 1 from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  '🔴 D-128: Trưởng ngành cũng KHÔNG xoá được bí tích'
);

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$delete from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'D-128: Thư ký xoá được bản ghi bí tích nhập nhầm'
);
select is_empty(
  $$select 1 from public.student_sacraments
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'D-128: bản ghi thật sự biến mất'
);

-- ============================================================================
-- 3. TB-F06 / D-130 — hai trục trạng thái đi cùng nhau
-- ============================================================================

-- Thư ký đang giữ phiên. D-130 chiều đi: hồ sơ "Tạm nghỉ" ⇒ ghi danh "Tạm nghỉ".
select lives_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000001', 'temporarily_inactive', false, 'withdrawn', null)$$,
  'D-130: đổi hồ sơ sang "Tạm nghỉ" chạy được'
);
select is(
  (select status::text from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000001'
      and academic_year_id = 'a3000000-0000-4000-8000-000000000001'),
  'paused',
  '🔴 D-130: ghi danh cũng chuyển sang "Tạm nghỉ" — hai trục đi cùng nhau'
);
select is(
  (select ended_on from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000001'
      and academic_year_id = 'a3000000-0000-4000-8000-000000000001'),
  null,
  'F10: `paused` là trạng thái MỞ nên KHÔNG được có ngày kết thúc'
);

-- Chiều về. Không có nhánh này thì em bị kẹt ở ghi danh tạm nghỉ: hồ sơ nói em
-- đi học, sĩ số nói em nghỉ.
select lives_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000001', 'active', false, 'withdrawn', null)$$,
  'D-130: đổi hồ sơ về "Đang sinh hoạt" chạy được'
);
select is(
  (select status::text from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000001'
      and academic_year_id = 'a3000000-0000-4000-8000-000000000001'),
  'active',
  '🔴 D-130: ghi danh tạm nghỉ được KHÔI PHỤC theo hồ sơ'
);

-- BR-M03-N12 — không đóng lén: chưa tick ô "đồng thời kết thúc ghi danh" thì
-- thao tác bị từ chối, không phải âm thầm đóng.
select throws_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000003', 'archived', false, 'withdrawn', null)$$,
  '23514', null,
  '🔴 BR-M03-N12: không lưu trữ được em còn ghi danh đang mở khi chưa đồng ý đóng'
);

select lives_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000003', 'archived', true, 'withdrawn', '2085-01-15')$$,
  'AC-F06-02: lưu trữ kèm đóng ghi danh chạy được'
);
select is(
  (select status::text from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000003'),
  'withdrawn',
  'AC-F06-02: ghi danh được đóng trong cùng giao dịch'
);
select is(
  (select ended_on from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000003'),
  '2085-01-15'::date,
  'AC-F06-02: ngày kết thúc do người dùng chọn được ghi đúng'
);
select is(
  (select status::text from public.students
    where id = 'a6000000-0000-4000-8000-000000000003'),
  'archived',
  'AC-F06-02: trạng thái hồ sơ đổi trong cùng giao dịch'
);

-- 🔴 **S-11** — tiêu chí `08_ACCEPTANCE_CRITERIA` §7 ghi "chưa có — hiện đang
-- SAI". Đây là hệ quả phân quyền của lỗi F06 và là lý do TB-F06 quan trọng hơn
-- vẻ ngoài của nó: trước đợt này em đã lưu trữ vẫn giữ ghi danh mở, nên Giáo lý
-- viên lớp cũ **vẫn đọc được hồ sơ và dữ liệu sức khoẻ** của em đã rời đi.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select ok(
  not ('a6000000-0000-4000-8000-000000000003' = any (app.class_scoped_student_ids())),
  '🔴 S-11: em đã lưu trữ RỜI khỏi phạm vi lớp của Giáo lý viên'
);
select is_empty(
  $$select 1 from public.students where id = 'a6000000-0000-4000-8000-000000000003'$$,
  '🔴 S-11: Giáo lý viên mất quyền đọc hồ sơ của em đã lưu trữ'
);

-- `docs/05` §5 — "Archive student: SA/global-write". D-63 nới quyền tạo/sửa hồ
-- sơ cho vai trò ngành, KHÔNG nới quyền lưu trữ.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000001', 'withdrawn', true, 'withdrawn', null)$$,
  '42501', null,
  '🔴 docs/05 §5: Trưởng ngành KHÔNG lưu trữ / không rút được hồ sơ'
);
select lives_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000001', 'temporarily_inactive', false, 'withdrawn', null)$$,
  'D-63: Trưởng ngành VẪN đổi được em trong ngành sang "Tạm nghỉ"'
);

-- 🔴 **Ẩn nút không phải authorization** (`AGENTS` §5). Bài trên chứng minh hàm
-- từ chối; bài này chứng minh **đường vòng cũng bị chặn**: `students_update_scope`
-- (D-123) cho vai trò ngành `update` mọi cột của em trong ngành mình, kể cả
-- `status`, nên nếu luật "chỉ cấp xứ đoàn lưu trữ" chỉ nằm ở Server Action thì
-- gọi thẳng Data API bằng JWT của họ là lưu trữ được.
select throws_ok(
  $$update public.students
      set status = 'archived', updated_by = 'a1000000-0000-4000-8000-000000000002'
    where id = 'a6000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  '🔴 docs/05 §5: Trưởng ngành KHÔNG lưu trữ được kể cả khi ghi thẳng vào bảng'
);
select is(
  (select status::text from public.students
    where id = 'a6000000-0000-4000-8000-000000000001'),
  'temporarily_inactive',
  'docs/05 §5: hồ sơ giữ nguyên trạng thái sau lượt ghi bị từ chối'
);

-- Lưới an toàn (phương án A của TB-F06): đường ghi thẳng vào bảng cũng bị chặn,
-- không chỉ đường đi qua hàm.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$update public.students
      set status = 'archived', updated_by = 'a1000000-0000-4000-8000-000000000001'
    where id = 'a6000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  '🔴 BR-M03-N12: trigger chặn cả đường ghi thẳng vào bảng, không chỉ qua RPC'
);

-- BR-M03-N13 / AC-F06-04 — chiều ngược lại của cùng một luật.
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on, updated_by)
    values ('a6000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000001',
            'a4000000-0000-4000-8000-000000000001', 'active', '2084-10-01',
            'a1000000-0000-4000-8000-000000000001')$$,
  '23514', null,
  '🔴 AC-F06-04: không ghi danh được em đã lưu trữ'
);

-- 🔴 D-117/D-118 (M02-C) — `set_student_status` là `security invoker`, nên hàng
-- rào năm học đã đóng nằm trong `enrollments_update_scope` **tự áp dụng**. Bài
-- này canh đúng điều đó: viết hàm thành `security definer` là mở lại lỗ hổng
-- M02-C vừa bịt, và bài này sẽ đỏ.
select throws_ok(
  $$select public.set_student_status(
      'a6000000-0000-4000-8000-000000000004', 'archived', true, 'withdrawn', null)$$,
  '42501', null,
  '🔴 D-117/D-118: không đóng được ghi danh thuộc năm học đã đóng'
);
select is(
  (select status::text from public.enrollments
    where student_id = 'a6000000-0000-4000-8000-000000000004'),
  'active',
  'D-118: giao dịch được huỷ toàn bộ — ghi danh năm cũ không suy suyển'
);
select is(
  (select status::text from public.students
    where id = 'a6000000-0000-4000-8000-000000000004'),
  'active',
  'AC-F06-02: một bên lỗi thì KHÔNG bên nào được ghi'
);

-- ============================================================================
-- 4. BR-M03-N17 — không vô hiệu hoá người giám hộ còn con đang sinh hoạt
-- ============================================================================

select throws_ok(
  $$update public.guardians
      set status = 'inactive', updated_by = 'a1000000-0000-4000-8000-000000000001'
    where id = 'a5000000-0000-4000-8000-000000000002'$$,
  '23514', null,
  '🔴 BR-M03-N17: không ngừng dùng hồ sơ phụ huynh còn con đang sinh hoạt'
);
-- Phụ huynh ba chỉ có một con, và em đó vừa được lưu trữ ở mục 3.
select lives_ok(
  $$update public.guardians
      set status = 'inactive', updated_by = 'a1000000-0000-4000-8000-000000000001'
    where id = 'a5000000-0000-4000-8000-000000000003'$$,
  'BR-M03-N17: hết con đang sinh hoạt thì ngừng dùng được'
);

-- TB-F12/BR-M03-N16 — đổi người giám hộ đổi ngay quyền đọc của hai tài khoản.
select lives_ok(
  $$update public.students
      set guardian_id = 'a5000000-0000-4000-8000-000000000002',
          updated_by = 'a1000000-0000-4000-8000-000000000001'
    where id = 'a6000000-0000-4000-8000-000000000001'$$,
  'BR-M03-N16: đổi được người giám hộ của một em'
);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000006', true);
select ok(
  not ('a6000000-0000-4000-8000-000000000001' = any (app.own_student_ids())),
  '🔴 S-09: phụ huynh cũ MẤT NGAY quyền đọc sau khi đổi người giám hộ'
);

-- ============================================================================
-- 5. D-67 / D-129 — mức đọc riêng cho Thủ quỹ
-- ============================================================================

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000005', true);

-- 🔴 **S-06 phải VẪN xanh.** Ranh giới cũ không nhúc nhích: cửa sổ mới là một ô
-- cửa riêng, không phải một nhánh nới thêm vào policy của bảng.
select is_empty(
  $$select 1 from public.students where id = 'a6000000-0000-4000-8000-000000000001'$$,
  '🔴 S-06: Thủ quỹ đọc thẳng bảng `students` vẫn trả 0 dòng'
);
select is_empty(
  $$select 1 from public.guardians where id = 'a5000000-0000-4000-8000-000000000002'$$,
  'D-67: Thủ quỹ đọc thẳng bảng `guardians` vẫn trả 0 dòng'
);
select is_empty(
  $$select 1 from public.student_health_profiles
     where student_id = 'a6000000-0000-4000-8000-000000000001'$$,
  'D-67: Thủ quỹ KHÔNG đọc được hồ sơ sức khoẻ (D-19)'
);

select isnt_empty(
  $$select 1 from public.list_students_for_fees('Phạm Thị Hạnh', null, null, false, null, 20, 0)$$,
  'D-67: Thủ quỹ đọc được danh sách em qua cửa sổ hẹp'
);
select is(
  (select hardship_flag from public.list_students_for_fees(
     'Phạm Thị Hạnh', null, null, false, null, 20, 0)),
  true,
  '🔴 D-129: Thủ quỹ THẤY dấu "hoàn cảnh khó khăn" (chốt 2026-07-28)'
);
select is(
  (select class_name from public.list_students_for_fees(
     'Phạm Thị Hạnh', null, null, false, null, 20, 0)),
  null,
  'D-67: lớp lấy theo năm HIỆN HÀNH — em của năm nháp chưa hiện lớp'
);
-- D-126 — cùng phép bỏ dấu với danh sách chung; lệch nhau thì ô tìm kiếm của
-- Thủ quỹ im lặng không ra kết quả nào.
select is(
  (select full_name from public.list_students_for_fees(
     'pham thi hanh', null, null, false, null, 20, 0)),
  'Phạm Thị Hạnh',
  'D-126: ô tìm của Thủ quỹ cũng tìm được khi gõ KHÔNG DẤU'
);
select is(
  (select total_count from public.list_students_for_fees(
     'Phạm Thị Hạnh', null, null, false, null, 20, 0)),
  1::bigint,
  'TB-F03: cửa sổ hẹp trả tổng số để phân trang biết đường'
);

-- Cửa sổ chỉ mở cho đúng một vai trò. Mọi vai trò khác đã có đường đọc riêng
-- rộng hơn; mở thêm ở đây là tạo một đường thứ hai để lệch dần.
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select 1 from public.list_students_for_fees(null, null, null, false, null, 20, 0)$$,
  '42501', null,
  'D-67: Thư ký KHÔNG dùng cửa sổ của Thủ quỹ'
);
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select 1 from public.list_students_for_fees(null, null, null, false, null, 20, 0)$$,
  '42501', null,
  'D-67: Giáo lý viên KHÔNG dùng cửa sổ của Thủ quỹ'
);

-- 🔴 Bài CẤU TRÚC — canh đúng thứ D-67 liệt kê vào nhóm "KHÔNG được xem". RLS
-- lọc theo DÒNG, không theo CỘT; nếu ai đó sau này "cho tiện" thêm `date_of_birth`
-- hay `address` vào cửa sổ này thì không bài hành vi nào đỏ, chỉ bài này đỏ.
select is(
  (select count(*)::integer
     from information_schema.parameters
    where specific_schema = 'public'
      and specific_name in (
        select specific_name from information_schema.routines
         where routine_schema = 'public' and routine_name = 'list_students_for_fees'
      )
      and parameter_mode = 'OUT'
      and parameter_name in ('date_of_birth', 'address', 'general_notes', 'phone')),
  0,
  '🔴 D-67: cửa sổ Thủ quỹ KHÔNG trả ngày sinh, địa chỉ, ghi chú nội bộ'
);

select * from finish();
rollback;
