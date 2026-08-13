begin;

select plan(21);

-- ============================================================================
-- M03-A · TB-F10 — VÒNG ĐỜI GHI DANH, và S-06 của `08_ACCEPTANCE_CRITERIA.md` §7.
--
-- 🔴 Bốn bài đầu là **ca chưa từng được kiểm** và là gốc rễ của lỗi CRITICAL F10
-- (35/75). `01_MODULE_DISCOVERY.md` §5 ghi thẳng về bộ `009`: *"không kiểm ghi danh
-- trùng (23505) một cách tường minh; **không kiểm `status='paused'` kèm `ended_on`**"*.
-- Chính khoảng trống đó để lọt việc ứng dụng xếp `paused` vào nhóm trạng thái ĐÓNG
-- trong khi cơ sở dữ liệu coi nó là trạng thái MỞ — nên "Tạm nghỉ" **luôn** vi phạm
-- CHECK và thất bại im lặng, suốt từ Phase 2 tới nay.
--
-- Bốn nhóm bài:
--   1. AC-F10-04 — cơ sở dữ liệu là chốt chặn cuối: trạng thái mở **không được** có
--      `ended_on`. Kiểm cho CẢ `active` lẫn `paused`.
--   2. AC-F10-01/02 — tạm nghỉ và khôi phục thật sự chạy được, và khôi phục
--      **không** tạo bản ghi thứ hai.
--   3. BR-M03-13 — `paused` **chiếm suất** "một ghi danh mở mỗi năm". Đây là bài
--      chứng minh `paused` là trạng thái MỞ ở tầng thấp nhất; nếu ai đó sau này
--      "sửa" nó thành trạng thái đóng thì bài này đỏ ngay.
--   4. S-06 — Thủ quỹ đọc `students` trả **0 dòng** (chưa từng có vai này trong bộ
--      kiểm thử; `docs/05` cho Thủ quỹ vào được `/students` nên màn hình hiện ra
--      như "chưa có dữ liệu" — an toàn, nhưng phải có bài canh để nó không âm thầm
--      đổi chiều).
-- ============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('e1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'el-sl@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'el-tr@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('e1000000-0000-4000-8000-000000000001', 'EL_SL', 'Trưởng ngành EL'),
  ('e1000000-0000-4000-8000-000000000002', 'EL_TR', 'Thủ quỹ EL');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'anh', 'Trưởng Ngành EL', '0900000601'),
  ('e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'anh', 'Thủ Quỹ EL', '0900000602');

-- ⚠️ `draft`, KHÔNG phải `current`: chỉ được tồn tại đúng một năm `current`
-- (`academic_years_one_current_idx`), mà `seed:dev` đã tạo một. Dùng `current` ở đây
-- làm cả file đỏ khi ai đó chạy `test:db` sau `seed:dev` — đúng cái bẫy M02-A đã ghi
-- lại cho `004`/`006`/`009`/`010`. Trạng thái năm học không ảnh hưởng bài nào trong
-- file này: các CHECK và unique index của `enrollments` không đọc nó, và
-- `app.can_manage_class` chỉ so ngành của lớp với ngành của người thao tác.
insert into public.academic_years (id, code, name, start_date, end_date, retention_until, status) values
  ('e3000000-0000-4000-8000-000000000001', '2080-2081', 'Năm vòng đời EL', '2080-09-01', '2081-05-31', '2086-05-31', 'draft');
-- Hai lớp cùng ngành Ấu Nhi để kiểm ràng buộc "một ghi danh mở mỗi năm".
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('e4000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu EL 1A', 'active'),
  ('e4000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu EL 2A', 'active');

insert into public.guardians (id, full_name, phone) values
  ('e5000000-0000-4000-8000-000000000001', 'Phụ huynh EL', '0900000603');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('e6000000-0000-4000-8000-000000000001', 'e5000000-0000-4000-8000-000000000001', 'Maria', 'Nguyễn Thị EL', 'female', '2015-03-12');

insert into public.role_assignments (profile_id, role) values
  ('e1000000-0000-4000-8000-000000000002', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('e1000000-0000-4000-8000-000000000001', 'sector_leader', 'e3000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2080-09-01');

insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('e7000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000001', 'active', '2080-09-05');

-- ============================================================================
-- 1. AC-F10-04 — cơ sở dữ liệu là chốt chặn cuối cho trạng thái MỞ
-- ============================================================================

select has_index(
  'public', 'enrollments', 'enrollments_one_open_per_student_year_idx',
  'BR-M03-13: index "một ghi danh mở mỗi năm" còn nguyên'
);

-- 🔴 ĐÂY LÀ CA GÂY RA LỖI F10, và trước đợt này chưa bài nào kiểm.
select throws_ok(
  $$update public.enrollments set status = 'paused', ended_on = '2080-12-01'
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  'AC-F10-04: `paused` KÈM `ended_on` bị CHECK từ chối — đúng lỗi F10'
);

select throws_ok(
  $$update public.enrollments set status = 'active', ended_on = '2080-12-01'
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  '`active` kèm `ended_on` cũng bị từ chối — CHECK áp cho CẢ HAI trạng thái mở'
);

select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on, ended_on)
    values ('e6000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
            'e4000000-0000-4000-8000-000000000002', 'paused', '2080-09-05', '2080-12-01')$$,
  '23514', null,
  'không thể TẠO MỚI một ghi danh `paused` kèm ngày kết thúc'
);

select throws_ok(
  $$update public.enrollments set status = 'withdrawn', ended_on = '2080-08-01'
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  'BR-M03-15: ngày kết thúc trước ngày ghi danh bị từ chối'
);

-- ============================================================================
-- 2. AC-F10-01 / F10-02 — tạm nghỉ và khôi phục CHẠY ĐƯỢC
-- ============================================================================

select lives_ok(
  $$update public.enrollments set status = 'paused', ended_on = null
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  'AC-F10-01: tạm nghỉ (KHÔNG có ngày kết thúc) lưu được'
);
select is(
  (select status::text from public.enrollments where id = 'e7000000-0000-4000-8000-000000000001'),
  'paused', 'ghi danh đang ở trạng thái `paused`'
);
select is(
  (select ended_on from public.enrollments where id = 'e7000000-0000-4000-8000-000000000001'),
  null, 'ghi danh tạm nghỉ KHÔNG có ngày kết thúc'
);

-- ------------------------------------------------------------------
-- 3. BR-M03-13 — `paused` CHIẾM SUẤT "một ghi danh mở mỗi năm".
--    Bài này là bằng chứng ở tầng thấp nhất rằng `paused` là trạng thái MỞ.
-- ------------------------------------------------------------------
select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on)
    values ('e6000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
            'e4000000-0000-4000-8000-000000000002', 'active', '2080-10-01')$$,
  '23505', null,
  'BR-M03-13: em đang TẠM NGHỈ vẫn chiếm suất — không mở được ghi danh thứ hai'
);

select lives_ok(
  $$update public.enrollments set status = 'active'
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  'AC-F10-02: khôi phục về `active` lưu được'
);
select is(
  (select count(*)::integer from public.enrollments
   where student_id = 'e6000000-0000-4000-8000-000000000001'),
  1, 'AC-F10-02: khôi phục KHÔNG tạo bản ghi ghi danh thứ hai'
);

select throws_ok(
  $$insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on)
    values ('e6000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
            'e4000000-0000-4000-8000-000000000002', 'active', '2080-10-01')$$,
  '23505', null,
  'ghi danh mở thứ hai trong cùng năm bị từ chối với mã 23505 (ca `009` chưa kiểm tường minh)'
);

-- ------------------------------------------------------------------
-- Bốn lý do ĐÓNG đều lưu được kèm ngày, và đóng rồi thì suất được nhả ra.
-- ------------------------------------------------------------------
select lives_ok(
  $$update public.enrollments set status = 'withdrawn', ended_on = '2080-12-01'
    where id = 'e7000000-0000-4000-8000-000000000001'$$,
  'BR-M03-N02: đóng ghi danh với lý do "Rút" kèm ngày lưu được'
);
select lives_ok(
  $$insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on)
    values ('e7000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000001',
            'e3000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000002',
            'active', '2081-01-05')$$,
  'đóng ghi danh cũ xong thì ghi danh mới trong cùng năm được chấp nhận'
);
select lives_ok(
  $$update public.enrollments set status = 'transferred', ended_on = '2081-02-01'
    where id = 'e7000000-0000-4000-8000-000000000002'$$,
  'lý do "Chuyển lớp" lưu được — D-122 giữ lựa chọn này'
);
select lives_ok(
  $$update public.enrollments set status = 'repeating', ended_on = '2081-02-01'
    where id = 'e7000000-0000-4000-8000-000000000002'$$,
  'lý do "Học lại" lưu được'
);
select lives_ok(
  $$update public.enrollments set status = 'completed', ended_on = '2081-02-01'
    where id = 'e7000000-0000-4000-8000-000000000002'$$,
  'lý do "Hoàn thành" lưu được'
);

-- ============================================================================
-- 4. Phân quyền bằng JWT thật
-- ============================================================================

set local role authenticated;

-- S-06 — Thủ quỹ: `docs/05` cho vào `/students`, nhưng RLS không có nhánh nào cho
-- vai này ⇒ trang hiện ra như "chưa có dữ liệu". An toàn, và phải giữ nguyên như
-- vậy cho tới khi D-67 mở mức đọc riêng (đợt M03-C).
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.students), 0,
  'S-06: Thủ quỹ đọc `students` trả 0 dòng'
);
select is(
  (select count(*)::integer from public.enrollments), 0,
  'S-06: Thủ quỹ cũng không đọc được ghi danh'
);

-- Trưởng ngành đúng ngành: `app.can_manage_class` cho ghi (BR-M03-31) — hàng rào
-- phân quyền của TB-F10 **không đổi**, nhưng phải chứng minh nó vẫn đứng sau khi
-- đợt này viết lại toàn bộ tầng action.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select ok(
  app.can_manage_class('e4000000-0000-4000-8000-000000000001'),
  'Trưởng ngành Ấu Nhi quản lý được lớp trong ngành mình'
);
select isnt_empty(
  $$select 1 from public.enrollments where student_id = 'e6000000-0000-4000-8000-000000000001'$$,
  'Trưởng ngành đọc được ghi danh của em trong ngành mình'
);

select * from finish();
rollback;
