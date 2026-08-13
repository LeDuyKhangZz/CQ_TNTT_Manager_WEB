begin;

select plan(22);

-- ============================================================================
-- M04-B / D-106 + D-109 — xóa hồ sơ nhân sự CHƯA TỪNG DÙNG (M04-F07, 5W-08).
--
-- Kiểm bằng JWT thật (`set role authenticated` + `request.jwt.claim.sub`), không
-- dùng service role để giả người dùng: `app.can_global_write()` đọc vai trò từ
-- chính phiên gọi.
--
-- Hai điều file này canh mà đọc mã nguồn không thấy được:
--
--   1. HAI bảng tham chiếu dùng `on delete set null` (`teaching_plans`,
--      `committee_announcements`). Khoá ngoại KHÔNG chặn xóa ở đó — nếu hàm
--      quên đếm tay thì lệnh xóa vẫn CHẠY THÀNH CÔNG và lặng lẽ bỏ trống tên
--      người soạn giáo án. Bài test dựng đúng tình huống đó rồi kiểm hai điều:
--      lệnh bị từ chối, VÀ dòng giáo án vẫn còn nguyên tác giả.
--
--   2. Không có policy/grant DELETE nào trên `staff_profiles`, nên ngay cả Xứ
--      đoàn trưởng — người GỌI ĐƯỢC hàm xóa — cũng không `delete` thẳng được.
--      RPC là đường duy nhất.
--
-- Quy ước như `029`/`030`: thao tác chạy dưới JWT, kiểm chứng chạy sau `reset role`.
-- ============================================================================

select has_function('public', 'delete_unused_staff_profile', array['uuid', 'text'],
  'RPC xóa hồ sơ chưa từng dùng tồn tại');
select is_definer('public', 'delete_unused_staff_profile', array['uuid', 'text'],
  'RPC xóa chạy security definer');
select has_function('public', 'staff_profile_delete_blockers', array['uuid'],
  'Hàm liệt kê lý do không xóa được tồn tại');

-- Người dùng ---------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('50000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-gl@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('50000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-sl@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('50000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-tr@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('50000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-ct@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('50000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-acc@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('50000000-0000-4000-8000-000000000001', 'DEL_GL',  'Xứ đoàn trưởng'),
  ('50000000-0000-4000-8000-000000000002', 'DEL_SL',  'Trưởng ngành Ấu Nhi'),
  ('50000000-0000-4000-8000-000000000003', 'DEL_TR',  'Thủ quỹ'),
  ('50000000-0000-4000-8000-000000000004', 'DEL_CT',  'Giáo lý viên lớp'),
  ('50000000-0000-4000-8000-000000000010', 'DEL_ACC', 'Người có tài khoản');

insert into public.academic_years (id, code, name, start_date, end_date, retention_until) values
  ('5e000000-0000-4000-8000-000000000001', '2043-2044', 'Năm học DEL', '2043-09-01', '2044-05-31', '2049-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name, status) values
  ('5d000000-0000-4000-8000-000000000001', '5e000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu DEL 1A', 'active');

insert into public.committees (id, code, name) values
  ('5b000000-0000-4000-8000-000000000001', 'DEL_BAN', 'Ban Kiểm Thử Xóa');

-- Bảy hồ sơ, mỗi hồ sơ dựng đúng MỘT lý do bị chặn (hoặc không lý do nào) ----
--   …0001 sạch hoàn toàn                      → xóa được
--   …0002 sạch hoàn toàn                      → dùng cho bài "gõ sai tên"
--   …0003 có tài khoản đăng nhập              → chặn
--   …0004 có phân công lớp                    → chặn (`on delete restrict`)
--   …0005 là tác giả giáo án                  → chặn (`on delete set null`!)
--   …0006 là thành viên Ban                   → chặn
--   …0007 sạch, dùng để chứng minh không bị vạ lây khi hồ sơ khác bị xóa
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('5f000000-0000-4000-8000-000000000001', null,                                   'anh', 'Hồ Sơ Tạo  Nhầm',    '0900000301'),
  ('5f000000-0000-4000-8000-000000000002', null,                                   'chi', 'Hồ Sơ Gõ Sai Tên',   '0900000302'),
  ('5f000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000010', 'anh', 'Người Có Tài Khoản', '0900000303'),
  ('5f000000-0000-4000-8000-000000000004', null,                                   'so',  'Sơ Đang Dạy Lớp',    '0900000304'),
  ('5f000000-0000-4000-8000-000000000005', null,                                   'anh', 'Người Soạn Giáo Án', '0900000305'),
  ('5f000000-0000-4000-8000-000000000006', null,                                   'chi', 'Người Trong Ban',    '0900000306'),
  ('5f000000-0000-4000-8000-000000000007', null,                                   'anh', 'Hồ Sơ Sạch Khác',    '0900000307'),
-- Bốn hồ sơ dưới đây chỉ để `validate_staff_role_link` chịu cho gán vai trò:
-- mọi vai trò nhân sự đều đòi tài khoản phải có hồ sơ nhân sự đi kèm.
  ('5f000000-0000-4000-8000-000000000008', '50000000-0000-4000-8000-000000000001', 'anh', 'Xứ Đoàn Trưởng DEL', '0900000308'),
  ('5f000000-0000-4000-8000-000000000009', '50000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ngành DEL',   '0900000309'),
  ('5f000000-0000-4000-8000-00000000000a', '50000000-0000-4000-8000-000000000003', 'chi', 'Thủ Quỹ DEL',        '0900000310'),
  ('5f000000-0000-4000-8000-00000000000b', '50000000-0000-4000-8000-000000000004', 'anh', 'GLV Lớp DEL',        '0900000311');

insert into public.class_staff_assignments (id, class_id, staff_profile_id, capacity, starts_on) values
  ('5c000000-0000-4000-8000-000000000001', '5d000000-0000-4000-8000-000000000001', '5f000000-0000-4000-8000-000000000004', 'member', '2043-09-01'),
  ('5c000000-0000-4000-8000-000000000002', '5d000000-0000-4000-8000-000000000001', '5f000000-0000-4000-8000-00000000000b', 'member', '2043-09-01');

-- 🔴 `teaching_plans.created_by_staff_id` KHÔNG nhận giá trị từ câu insert:
-- trigger `app.prepare_teaching_plan` ghi đè bằng hồ sơ suy từ `auth.uid()`.
-- Nghĩa là một "tác giả treo" (hồ sơ không tài khoản mà vẫn đứng tên giáo án)
-- chỉ sinh ra theo đúng một đường trong đời thật: người đó SOẠN giáo án khi còn
-- tài khoản, rồi tài khoản bị xóa — D-101 giữ hồ sơ lại và đặt `profile_id` về
-- null. Bài test dựng lại đúng đường đó, vì đây chính là tình huống mà khoá
-- ngoại `on delete set null` không bảo vệ được gì.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('50000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'del-plan@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('50000000-0000-4000-8000-000000000011', 'DEL_PLAN', 'Người soạn giáo án');
update public.staff_profiles set profile_id = '50000000-0000-4000-8000-000000000011'
where id = '5f000000-0000-4000-8000-000000000005';

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000011', true);
insert into public.teaching_plans (id, class_id, academic_year_id, title) values
  ('5a000000-0000-4000-8000-000000000001', '5d000000-0000-4000-8000-000000000001', '5e000000-0000-4000-8000-000000000001', 'Giáo án DEL');
select set_config('request.jwt.claim.sub', '', true);

-- Xóa tài khoản ⇒ hồ sơ ở lại, `profile_id` về null, nhưng giáo án vẫn đứng tên.
delete from auth.users where id = '50000000-0000-4000-8000-000000000011';

insert into public.committee_memberships (committee_id, staff_profile_id, position, starts_on) values
  ('5b000000-0000-4000-8000-000000000001', '5f000000-0000-4000-8000-000000000006', 'member', '2043-09-01');

insert into public.role_assignments (profile_id, role) values
  ('50000000-0000-4000-8000-000000000001', 'group_leader'),
  ('50000000-0000-4000-8000-000000000003', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id, starts_on) values
  ('50000000-0000-4000-8000-000000000002', 'sector_leader', '5e000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002', '2043-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('50000000-0000-4000-8000-000000000004', 'class_teacher', '5e000000-0000-4000-8000-000000000001', '5d000000-0000-4000-8000-000000000001', '2043-09-01');

set local role authenticated;

-- ==== D-109 — ai KHÔNG được gọi ==========================================
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000001', 'Hồ Sơ Tạo Nhầm')$$,
  '42501', 'FORBIDDEN', 'D-109: Trưởng ngành không xóa được hồ sơ nhân sự');
select throws_ok(
  $$select public.staff_profile_delete_blockers('5f000000-0000-4000-8000-000000000001')$$,
  '42501', 'FORBIDDEN', 'D-109: Trưởng ngành không đọc được danh sách lý do chặn');

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000001', 'Hồ Sơ Tạo Nhầm')$$,
  '42501', 'FORBIDDEN', 'D-109: Thủ quỹ không xóa được hồ sơ nhân sự');

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000001', 'Hồ Sơ Tạo Nhầm')$$,
  '42501', 'FORBIDDEN', 'D-109: Giáo lý viên lớp không xóa được hồ sơ nhân sự');

-- ==== Từ đây chạy dưới Xứ đoàn trưởng — một trong bốn vai trò được phép ====
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true);

-- Gõ lại tên là chốt chặn Ở DB, không chỉ ở hộp thoại.
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000002', 'Hồ Sơ Gõ Sai')$$,
  '22023', null, 'D-106: gõ sai họ tên thì không xóa được');

-- Nhưng gõ thừa khoảng trắng thì vẫn nhận (hồ sơ …0001 có hai dấu cách giữa tên).
select lives_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000001', '  Hồ Sơ Tạo Nhầm  ')$$,
  'D-106: khoảng trắng thừa hai đầu và giữa tên không làm hỏng xác nhận');

-- ==== Bốn lý do bị chặn ===================================================
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000003', 'Người Có Tài Khoản')$$,
  '23503', null, 'D-106: hồ sơ có tài khoản đăng nhập thì không xóa được');

select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000004', 'Sơ Đang Dạy Lớp')$$,
  '23503', null, 'D-106: hồ sơ đã từng phân công lớp thì không xóa được');

-- 🔴 Bài quan trọng nhất file này: `teaching_plans.created_by_staff_id` là
-- `on delete set null`, tức KHÓA NGOẠI KHÔNG CHẶN. Nếu hàm quên đếm tay thì
-- lệnh dưới đây THÀNH CÔNG và tên người soạn giáo án biến mất không ai hay.
select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000005', 'Người Soạn Giáo Án')$$,
  '23503', null, 'D-106: người soạn giáo án không xóa được (FK set null KHÔNG chặn thay)');

select throws_ok(
  $$select public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000006', 'Người Trong Ban')$$,
  '23503', null, 'D-106: thành viên Ban không xóa được');

-- Không có policy/grant DELETE — kể cả người GỌI ĐƯỢC hàm xóa cũng không
-- `delete` thẳng được. RPC là đường duy nhất (ghi chú 1 của migration).
select throws_ok(
  $$delete from public.staff_profiles where id = '5f000000-0000-4000-8000-000000000007'$$,
  '42501', null, 'D-106: không ai DELETE thẳng bảng staff_profiles được');

-- ==== Kiểm chứng — chạy sau `reset role` (RLS lọc cả câu SELECT kiểm chứng) =
reset role;

select is(
  (select count(*)::int from public.staff_profiles where id = '5f000000-0000-4000-8000-000000000001'),
  0, 'D-106: hồ sơ chưa từng dùng đã bị xóa hẳn khỏi bảng');

select is(
  (select created_by_staff_id from public.teaching_plans where id = '5a000000-0000-4000-8000-000000000001'),
  '5f000000-0000-4000-8000-000000000005'::uuid,
  'D-106: giáo án vẫn giữ nguyên tên người soạn sau khi lệnh xóa bị từ chối');

select is(
  (select count(*)::int from public.staff_profiles
   where id in ('5f000000-0000-4000-8000-000000000002', '5f000000-0000-4000-8000-000000000003',
                '5f000000-0000-4000-8000-000000000004', '5f000000-0000-4000-8000-000000000005',
                '5f000000-0000-4000-8000-000000000006', '5f000000-0000-4000-8000-000000000007')),
  6, 'D-106: sáu hồ sơ còn lại không bị vạ lây');

select is(
  app.staff_profile_delete_blockers('5f000000-0000-4000-8000-000000000007'),
  array[]::text[],
  'D-106: hồ sơ sạch trả về mảng lý do RỖNG');

select is(
  array_length(app.staff_profile_delete_blockers('5f000000-0000-4000-8000-000000000003'), 1),
  1, 'D-106: hồ sơ có tài khoản trả về đúng một lý do');

select is(
  app.staff_profile_delete_blockers('5f000000-0000-4000-8000-0000000000ff'),
  array['Không tìm thấy hồ sơ này.'],
  'D-106: id không tồn tại trả về lý do rõ ràng, không nổ');

-- Giá trị trả về của RPC mang theo danh tính vừa xóa (cho câu thông báo + D-65).
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', true);
select is(
  public.delete_unused_staff_profile('5f000000-0000-4000-8000-000000000007', 'Hồ Sơ Sạch Khác')
    ->> 'fullName',
  'Hồ Sơ Sạch Khác', 'D-106: RPC trả về họ tên hồ sơ vừa xóa để ghi nhật ký D-65');
reset role;

select is(
  (select count(*)::int from public.staff_profiles where id = '5f000000-0000-4000-8000-000000000007'),
  0, 'D-106: hồ sơ thứ hai cũng bị xóa hẳn');

select * from finish();
rollback;
