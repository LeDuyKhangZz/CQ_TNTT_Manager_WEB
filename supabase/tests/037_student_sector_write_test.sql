begin;

select plan(38);

-- ============================================================================
-- M03-B — D-123 · D-124 · D-126, và toàn bộ hàng rào phân quyền của đợt.
--
-- Bốn thay đổi được kiểm ở đây, **tất cả bằng JWT thật** (`11` §5 mục 15):
--
--   1. **D-123 nới quyền GHI hồ sơ** cho Trưởng/Phó ngành, và nới đúng theo
--      ngành. Nhóm bài quan trọng nhất là nhóm ÂM TÍNH: Trưởng ngành Ấu Nhi
--      **không** tạo/sửa được hồ sơ em thuộc ngành Thiếu Nhi. D-63 nêu thẳng
--      yêu cầu này: *"phải có kiểm thử chứng minh Trưởng ngành ngành A không
--      tạo/sửa được hồ sơ em thuộc ngành B"*.
--   2. **D-124 nới quyền ĐỌC người giám hộ** — cũng chỉ trong ngành mình, và
--      cửa sổ hẹp `list_guardian_options` chỉ mở cho người được ghi hồ sơ.
--   3. Sức khoẻ và bí tích. ⚠️ **Cập nhật M03-C:** lúc viết file này Q-M03-02
--      còn để ngỏ nên nhóm bài ấy canh "KHÔNG được nới theo D-63". Chủ dự án
--      chốt **D-127** ngày 2026-07-28 theo đúng `docs/05` §3, nên nhóm bài đã
--      **đảo chiều cùng quyết định**: nay canh "nới quyền GHI nhưng giữ nguyên
--      PHẠM VI". Toàn bộ nhóm âm tính của D-127 (Dự trưởng phụ tá, phụ huynh)
--      nằm ở `038_student_lifecycle_and_fee_reads_test.sql`.
--   4. **D-126** — hàm bỏ dấu và cột `search_name` phải khớp đúng bản TypeScript
--      ở `src/lib/text/fold-vietnamese.ts`; lệch nhau thì ô tìm kiếm im lặng
--      không ra kết quả nào.
--
-- ⚠️ Năm học dùng `draft`, KHÔNG phải `current`: chỉ được tồn tại đúng một năm
-- `current` (`academic_years_one_current_idx`) mà `seed:dev` đã tạo một — cùng
-- cái bẫy M03-A đã ghi lại. `draft` vẫn nằm trong `app.writable_academic_year_ids()`
-- nên hàng rào năm học không cản bài nào ở đây; ca năm ĐÃ ĐÓNG có bài riêng.
-- ============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sw-au@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sw-th@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sw-glv@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sw-tk@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'SW_AU', 'Trưởng ngành Ấu'),
  ('f1000000-0000-4000-8000-000000000002', 'SW_TH', 'Trưởng ngành Thiếu'),
  ('f1000000-0000-4000-8000-000000000003', 'SW_GLV', 'Giáo lý viên lớp'),
  ('f1000000-0000-4000-8000-000000000004', 'SW_TK', 'Thư ký');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Trưởng Ngành Ấu SW', '0900000701'),
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ngành Thiếu SW', '0900000702'),
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'chi', 'Giáo Lý Viên SW', '0900000703'),
  ('f2000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'chi', 'Thư Ký SW', '0900000704');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('f3000000-0000-4000-8000-000000000001', '2082-2083', 'Năm ghi hồ sơ SW', '2082-09-01', '2083-05-31', '2088-05-31', 'draft'),
  ('f3000000-0000-4000-8000-000000000002', '2070-2071', 'Năm đã đóng SW', '2070-09-01', '2071-05-31', '2076-05-31', 'closed');

-- Một lớp Ấu Nhi, một lớp Thiếu Nhi: hai ngành khác nhau là điều kiện cần để
-- nhóm bài âm tính có nghĩa.
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu SW 1A', 'active'),
  ('f4000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu SW 1A', 'active'),
  ('f4000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu SW 2A', 'inactive'),
  ('f4000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000004', 'B', 'Ấu SW cũ', 'active');

insert into public.guardians (id, full_name, phone) values
  ('f5000000-0000-4000-8000-000000000001', 'Phụ huynh Ấu SW', '0900000801'),
  ('f5000000-0000-4000-8000-000000000002', 'Phụ huynh Thiếu SW', '0900000802');

insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('f6000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000001', 'Maria', 'Trần Ngọc Ánh', 'female', '2015-03-12'),
  ('f6000000-0000-4000-8000-000000000002', 'f5000000-0000-4000-8000-000000000002', 'Giuse', 'Đặng Văn Hùng', 'male', '2013-04-15');

insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('f6000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'active', '2082-09-05'),
  ('f6000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000002', 'active', '2082-09-05');

insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('f1000000-0000-4000-8000-000000000001', 'sector_leader', 'f3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2082-09-01'),
  ('f1000000-0000-4000-8000-000000000002', 'sector_leader', 'f3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000003', '2082-09-01');
-- Vai trò LỚP đòi một phân công GLV còn hiệu lực (`ACTIVE_CLASS_ASSIGNMENT_REQUIRED`,
-- `20260715000400:188-195`), nên phải dựng phân công trước rồi mới cấp vai trò.
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on, is_active) values
  ('f4000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000003', 'member', '2082-09-01', true);
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('f1000000-0000-4000-8000-000000000003', 'class_teacher', 'f3000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', '2082-09-01');
insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000004', 'secretary');

-- ============================================================================
-- 1. D-126 — bỏ dấu: bản SQL phải khớp bản TypeScript
-- ============================================================================

select is(
  app.fold_vietnamese('Trần Ngọc Hiếu'), 'tran ngoc hieu',
  'D-126: bỏ dấu và hạ chữ thường'
);
select is(
  app.fold_vietnamese('ĐÀO   Thị  Ánh'), 'dao thi anh',
  'D-126: `Đ` thành `d` và khoảng trắng thừa được gộp'
);
-- 🔴 Tên gõ từ máy Mac vào bằng tệp Excel ở dạng PHÂN RÃ. Thiếu bước
-- `normalize(…, nfc)` thì `translate` không đụng được vào dấu rời, và "Àn" nhập
-- từ Mac sẽ không bao giờ khớp "Àn" nhập từ bàn phím Việt.
select is(
  app.fold_vietnamese(U&'A\0300n'), 'an',
  'D-126: chuỗi Unicode PHÂN RÃ cũng bỏ được dấu'
);
select is(
  app.fold_vietnamese(null), '',
  'D-126: giá trị rỗng không làm hỏng cột sinh sẵn'
);
select is(
  (select search_name from public.students where id = 'f6000000-0000-4000-8000-000000000001'),
  'tran ngoc anh',
  'D-126: cột `search_name` tự sinh đúng từ họ tên'
);

-- Cột sinh sẵn phải TỰ CẬP NHẬT khi đổi tên; nếu không, ô tìm kiếm chỉ tìm được
-- cái tên lúc tạo hồ sơ.
update public.students set full_name = 'Trần Ngọc Ánh Tuyết'
  where id = 'f6000000-0000-4000-8000-000000000001';
select is(
  (select search_name from public.students where id = 'f6000000-0000-4000-8000-000000000001'),
  'tran ngoc anh tuyet',
  'D-126: đổi họ tên thì `search_name` đổi theo'
);
update public.students set full_name = 'Trần Ngọc Ánh'
  where id = 'f6000000-0000-4000-8000-000000000001';

select has_index(
  'public', 'students', 'students_search_name_idx',
  'D-126: có chỉ mục cho phép dò trùng theo tên đã bỏ dấu'
);

-- ============================================================================
-- 2. Khung nhìn danh sách — TB-F03
-- ============================================================================

select has_view('public', 'student_directory', 'TB-F03: có khung nhìn danh sách thiếu nhi');

-- 🔴 `security_invoker` là điều làm AC-F13-03 đúng: phép dò trùng đọc qua khung
-- nhìn này, nên nó KHÔNG được chạy bằng quyền của người tạo view.
select is(
  (select 'security_invoker=true' = any (c.reloptions)
   from pg_class as c
   join pg_namespace as n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'student_directory'),
  true,
  'AC-F13-03: khung nhìn chạy bằng quyền NGƯỜI GỌI, không phải người tạo'
);

-- ============================================================================
-- 3. D-123 — GHI hồ sơ theo ngành, bằng JWT thật
-- ============================================================================

set local role authenticated;

-- ── Trưởng ngành Ấu Nhi ─────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

select ok(app.can_write_student(), 'D-63: Trưởng ngành được xếp vào nhóm ghi hồ sơ');
-- ⚠️ KHÔNG chốt cứng số lượng: `seed:dev` cũng có em trong ngành Ấu Nhi của năm
-- hiện hành, nên một con số tuyệt đối làm file này chỉ chạy được trên DB vừa
-- reset — đúng cái bẫy M02-A đã ghi lại cho `004`/`006`/`009`/`010` và M03-A đã
-- gỡ cho `036`. Điều cần kiểm là **thành viên**, không phải số đếm.
select ok(
  'f6000000-0000-4000-8000-000000000001' = any (app.sector_managed_student_ids()),
  'D-123: Trưởng ngành Ấu Nhi quản lý được em của ngành mình'
);
select ok(
  not ('f6000000-0000-4000-8000-000000000002' = any (app.sector_managed_student_ids())),
  '🔴 D-63: em ngành Thiếu Nhi KHÔNG nằm trong phạm vi của Trưởng ngành Ấu Nhi'
);

select lives_ok(
  $$update public.students
      set address = 'Địa chỉ mới', updated_by = 'f1000000-0000-4000-8000-000000000001'
    where id = 'f6000000-0000-4000-8000-000000000001'$$,
  'D-123: Trưởng ngành sửa được hồ sơ em trong ngành mình'
);
select is(
  (select address from public.students where id = 'f6000000-0000-4000-8000-000000000001'),
  'Địa chỉ mới', 'D-123: thay đổi thật sự được ghi'
);

-- 🔴 BÀI ÂM TÍNH mà D-63 đòi. RLS từ chối bằng **0 dòng**, không phải exception —
-- nên phải kiểm bằng "giá trị không đổi", không phải bằng `throws_ok`.
select lives_ok(
  $$update public.students
      set address = 'Xâm phạm', updated_by = 'f1000000-0000-4000-8000-000000000001'
    where id = 'f6000000-0000-4000-8000-000000000002'$$,
  'câu lệnh chạy không lỗi — RLS lọc bằng 0 dòng chứ không ném lỗi'
);
select is(
  (select address from public.students where id = 'f6000000-0000-4000-8000-000000000002'),
  null,
  '🔴 D-63: Trưởng ngành Ấu Nhi KHÔNG sửa được hồ sơ em ngành Thiếu Nhi'
);

-- Tạo hồ sơ: bắt buộc kèm lớp, và lớp phải thuộc ngành mình.
select lives_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Anna', 'Lê Thị Bích', 'female', '2016-01-01',
      null, null, null, false, null, 'f4000000-0000-4000-8000-000000000001')$$,
  'D-123: Trưởng ngành tạo được hồ sơ kèm ghi danh vào lớp trong ngành mình'
);
select is(
  (select count(*)::integer from public.enrollments as e
   join public.students as s on s.id = e.student_id
   where s.full_name = 'Lê Thị Bích' and e.class_id = 'f4000000-0000-4000-8000-000000000001'),
  1,
  'D-123: hồ sơ VÀ ghi danh sinh ra cùng lúc — một giao dịch'
);
-- Người vừa tạo phải ĐỌC LẠI được hồ sơ của chính mình; nếu không thì
-- `insert … returning` trả 0 dòng và giao diện báo "thất bại" trên một bản ghi
-- đã được ghi. Đây chính là lý do D-123 chọn đường ghi cả hai bảng cùng lúc.
select isnt_empty(
  $$select 1 from public.students where full_name = 'Lê Thị Bích'$$,
  'D-123: người tạo đọc lại được hồ sơ vừa tạo (nhờ ghi danh sinh cùng lúc)'
);

select throws_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Anna', 'Không Có Lớp', 'female', '2016-01-01',
      null, null, null, false, null, null)$$,
  '42501', null,
  '🔴 D-123: Trưởng ngành KHÔNG tạo được hồ sơ "chưa xếp lớp"'
);

select throws_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Anna', 'Sang Ngành Khác', 'female', '2016-01-01',
      null, null, null, false, null, 'f4000000-0000-4000-8000-000000000002')$$,
  '42501', null,
  '🔴 D-63: Trưởng ngành Ấu Nhi KHÔNG tạo được hồ sơ vào lớp ngành Thiếu Nhi'
);

select throws_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Anna', 'Lớp Ngưng', 'female', '2016-01-01',
      null, null, null, false, null, 'f4000000-0000-4000-8000-000000000003')$$,
  '23514', null,
  'BR-M02-N12: lớp không còn hoạt động thì không nhận ghi danh mới'
);

-- 🔴 D-117/D-118 — hàm `security definer` BỎ QUA RLS, nên hàng rào năm học phải
-- được kiểm TAY trong thân hàm. Bài này canh đúng điều đó; bỏ bước ấy là mở lại
-- lỗ hổng mà M02-C vừa bịt.
select throws_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Anna', 'Năm Đã Đóng', 'female', '2016-01-01',
      null, null, null, false, null, 'f4000000-0000-4000-8000-000000000004')$$,
  '23514', null,
  '🔴 D-118: không tạo được hồ sơ kèm ghi danh vào một năm học ĐÃ ĐÓNG'
);

-- ============================================================================
-- 4. D-124 — ĐỌC người giám hộ theo ngành
-- ============================================================================

select is(
  (select count(*)::integer from public.guardians
   where id = 'f5000000-0000-4000-8000-000000000001'),
  1,
  'D-124: Trưởng ngành đọc được người giám hộ của em trong ngành mình'
);
select is(
  (select count(*)::integer from public.guardians
   where id = 'f5000000-0000-4000-8000-000000000002'),
  0,
  '🔴 D-124: KHÔNG đọc được người giám hộ của em thuộc ngành khác'
);
select isnt_empty(
  $$select 1 from public.list_guardian_options(null)$$,
  'D-124: cửa sổ hẹp trả được danh sách để chọn phụ huynh đã có'
);
select is(
  (select count(*)::integer from public.list_guardian_options('0900000802')),
  1,
  'D-124: cửa sổ hẹp tìm được phụ huynh NGOÀI ngành theo số điện thoại — đúng chủ ý, vì phép dò trùng chỉ nhìn nửa dữ liệu là nói dối'
);
select is(
  (select count(*)::integer from public.list_guardian_options('dang van')),
  0,
  'D-124: tìm theo tên không dấu vẫn lọc đúng, không trả bừa'
);

-- 🔴 **Cập nhật M03-C: Q-M03-02 đã chốt = theo bảng phân quyền (D-127).**
--
-- Bản M03-B của hai bài này khẳng định điều ngược lại — Trưởng ngành ghi hồ sơ
-- được nhưng KHÔNG ghi được sức khoẻ — vì lúc ấy câu hỏi còn để ngỏ và mã nguồn
-- cố ý đi hướng hẹp hơn `docs/05` §3. Chủ dự án chốt 2026-07-28 theo đúng bảng
-- phân quyền, nên hai bài này **đảo chiều cùng với quyết định**, không phải bị
-- nới lỏng cho hết đỏ. Phạm vi "chỉ em trong ngành mình" vẫn được canh nguyên
-- vẹn ở đây, và toàn bộ nhóm âm tính của D-127 nằm ở `038`.
--
-- Ghi chú về hình dạng lỗi vẫn giữ nguyên giá trị: INSERT bị `with check` chặn
-- thì Postgres NÉM `42501` thật, khác với UPDATE — nơi RLS lọc bằng **0 dòng**
-- và không có lỗi nào. Đó là lý do các bài âm tính của UPDATE ở trên phải kiểm
-- bằng "giá trị không đổi", và là lý do mọi `update` trong mã nguồn phải kèm
-- `.select()` (BR-M03-N11).
select lives_ok(
  $$insert into public.student_health_profiles (student_id, allergies, updated_by)
    values ('f6000000-0000-4000-8000-000000000001', 'Dị ứng SW', 'f1000000-0000-4000-8000-000000000001')$$,
  'D-127: Trưởng ngành GHI được hồ sơ sức khoẻ của em trong ngành mình'
);
select throws_ok(
  $$insert into public.student_health_profiles (student_id, allergies, updated_by)
    values ('f6000000-0000-4000-8000-000000000002', 'Dị ứng SW', 'f1000000-0000-4000-8000-000000000001')$$,
  '42501', null,
  '🔴 D-127: nới quyền GHI vẫn giữ nguyên phạm vi — không chạm được em ngành khác'
);

-- ── Giáo lý viên lớp: D-63 nêu thẳng là KHÔNG ─────────────────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select ok(
  not app.can_write_student(),
  'D-63: Giáo lý viên lớp KHÔNG nằm trong nhóm ghi hồ sơ'
);
select throws_ok(
  $$select public.list_guardian_options(null)$$,
  '42501', null,
  '🔴 D-124: Giáo lý viên lớp không mở được cửa sổ chọn phụ huynh'
);
select is(
  (select count(*)::integer from public.guardians),
  0,
  '🔴 D-124 không nới cho Giáo lý viên lớp — họ vẫn không đọc được bảng người giám hộ'
);
select lives_ok(
  $$update public.students set address = 'GLV sửa', updated_by = 'f1000000-0000-4000-8000-000000000003'
    where id = 'f6000000-0000-4000-8000-000000000001'$$,
  'câu lệnh chạy — xem bài kế tiếp'
);
select is(
  (select address from public.students where id = 'f6000000-0000-4000-8000-000000000001'),
  'Địa chỉ mới',
  '🔴 Giáo lý viên lớp KHÔNG sửa được hồ sơ em lớp mình (0 dòng)'
);

-- ── Thư ký: quyền toàn xứ đoàn, giữ nguyên như trước D-63 ───────────────────
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$select public.create_student_with_enrollment(
      'f5000000-0000-4000-8000-000000000001', 'Teresa', 'Phạm Chưa Xếp Lớp', 'female', '2016-06-06',
      null, null, null, false, null, null)$$,
  'D-123: Thư ký vẫn tạo được hồ sơ CHƯA XẾP LỚP'
);
select is(
  (select count(*)::integer from public.enrollments as e
   join public.students as s on s.id = e.student_id
   where s.full_name = 'Phạm Chưa Xếp Lớp'),
  0,
  'D-123: hồ sơ chưa xếp lớp thì không sinh ghi danh nào'
);
select lives_ok(
  $$select public.create_guardian_profile('Phụ huynh mới SW', '0900000899', null)$$,
  'D-124: tạo người giám hộ qua hàm trả lại được id + tên'
);

select * from finish();
rollback;
