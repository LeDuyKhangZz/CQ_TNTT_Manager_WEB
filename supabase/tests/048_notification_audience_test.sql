begin;

-- ============================================================================
-- M10-B — đếm người nhận trước khi gửi · chống gửi đúp · sửa nhánh gửi đích danh.
--
-- D-165 (Q-1) · D-167 (Q-3) · BR-M10-23 · BR-M10-24 · BR-M10-25.
-- Chạy bằng JWT thật của từng vai (CLAUDE.md §4), không service role.
-- ============================================================================

select plan(26);

select has_function('app', 'notification_audience',
  array['notification_target_type', 'uuid', 'uuid', 'uuid', 'uuid'],
  'hàm định nghĩa phạm vi người nhận tồn tại');
select has_function('public', 'count_notification_audience',
  array['notification_target_type', 'uuid'],
  'RPC đếm trước khi gửi tồn tại');
select has_column('public', 'notifications', 'request_id', 'cột mã chống gửi đúp tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f4000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-norole@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-locked@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f4000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-sector@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

-- 🔴 `na-norole` là **cả module này sinh ra vì nó**: tài khoản đã kích hoạt
-- nhưng CHƯA được gán vai trò — trước D-167, người này không bao giờ nhận được
-- một thông báo nào, kể cả thư gửi thẳng tên họ.
insert into public.profiles (id, username, display_name) values
  ('f4000000-0000-4000-8000-000000000001', 'NA_SEC', 'Thư ký phạm vi'),
  ('f4000000-0000-4000-8000-000000000002', 'NA_NOROLE', 'Người chưa phân công'),
  ('f4000000-0000-4000-8000-000000000004', 'NA_GUARD', 'Phụ huynh phạm vi'),
  ('f4000000-0000-4000-8000-000000000005', 'NA_SECTOR', 'Trưởng ngành phạm vi');
insert into public.profiles (id, username, display_name, account_status) values
  ('f4000000-0000-4000-8000-000000000003', 'NA_LOCKED', 'Tài khoản đã khoá', 'disabled');

-- Vai trò nhân sự đòi có hồ sơ nhân sự (`validate_staff_role_link`). NA_NOROLE
-- cố ý KHÔNG có gì cả — đó là ca cần kiểm.
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('fc400000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'chi', 'Thư ký phạm vi', '0980000001'),
  ('fc400000-0000-4000-8000-000000000005', 'f4000000-0000-4000-8000-000000000005', 'anh', 'Trưởng ngành phạm vi', '0980000005');
insert into public.guardians (id, profile_id, full_name, phone) values
  ('fd400000-0000-4000-8000-000000000004', 'f4000000-0000-4000-8000-000000000004', 'Phụ huynh phạm vi', '0930000044');

-- NA_LOCKED cố ý **không** có vai trò: phép từ chối của BR-M10-23 nhìn vào
-- `account_status`, không nhìn vào vai trò. Gán cho nó một vai trò chỉ làm bài
-- kiểm mơ hồ — đỏ lên thì không biết vế nào đã chặn.
insert into public.role_assignments (profile_id, role) values
  ('f4000000-0000-4000-8000-000000000001', 'secretary'),
  ('f4000000-0000-4000-8000-000000000004', 'guardian');
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('fa400000-0000-4000-8000-000000000001', '2093-2094', 'Năm phạm vi thông báo', '2093-09-01', '2094-05-31', 'draft', '2099-05-31');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('f4000000-0000-4000-8000-000000000005', 'sector_leader', 'fa400000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- D-167 — gửi đích danh không phụ thuộc phân công vai trò (AC-05-01).
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000001', true);

select is(
  (select public.count_notification_audience('user', 'f4000000-0000-4000-8000-000000000002')),
  1, 'đếm trước khi gửi: người chưa phân công vai trò vẫn nằm trong phạm vi');

select lives_ok(
  $$select public.publish_notification(
      'Chào mừng', 'Anh/chị vừa được cấp tài khoản.', 'user',
      'f4000000-0000-4000-8000-000000000002', '/account')$$,
  'gửi được thư riêng cho người chưa phân công vai trò');

select is(
  (select recipient_count from public.notifications where title = 'Chào mừng'),
  1, 'AC-05-01 — thư riêng tới đúng 1 người, không rơi vào hư không');

select ok(
  exists (
    select 1 from public.notification_recipients as recipient
    join public.notifications as notification on notification.id = recipient.notification_id
    where notification.title = 'Chào mừng'
      and recipient.profile_id = 'f4000000-0000-4000-8000-000000000002'
  ), 'người nhận đúng là người chưa phân công vai trò');

-- BR-M10-23 — tài khoản đã khoá bị từ chối TRƯỚC khi ghi, không ghi rồi ra 0.
select throws_ok(
  $$select public.publish_notification(
      'Gửi người đã khoá', 'Không được phép', 'user',
      'f4000000-0000-4000-8000-000000000003', null)$$,
  '23514', 'NOTIFICATION_TARGET_INACTIVE',
  'BR-M10-23 — không gửi đích danh cho tài khoản đã khoá');
select is(
  (select count(*)::integer from public.notifications where title = 'Gửi người đã khoá'),
  0, 'lần gửi bị từ chối không để lại bản ghi nào');

-- ---------------------------------------------------------------------------
-- BR-M10-24 — con số xem trước phải KHỚP con số chốt được lúc gửi.
-- ---------------------------------------------------------------------------
select is(
  (select public.count_notification_audience('guardians', null)),
  (select count(*)::integer from public.profiles as profile
   join public.role_assignments as assignment
     on assignment.profile_id = profile.id and assignment.is_active
   where profile.account_status = 'active' and assignment.role = 'guardian'),
  'đếm nhóm phụ huynh khớp định nghĩa phạm vi');

select is(
  (select public.count_notification_audience('all', null)),
  (select count(*)::integer from public.profiles as profile
   join public.role_assignments as assignment
     on assignment.profile_id = profile.id and assignment.is_active
   where profile.account_status = 'active'),
  'đếm toàn hệ thống khớp định nghĩa phạm vi');

-- 🔴 Bài quan trọng nhất của BR-M10-24: **so hai con số với nhau**, không so
-- từng con số với một phép đếm chép tay. Chép tay thì hai bên cùng trôi mà bài
-- kiểm vẫn xanh.
select lives_ok(
  $$select public.publish_notification('So hai con số', 'Nội dung', 'guardians', null, null)$$,
  'gửi cho nhóm phụ huynh chạy được');
select is(
  (select recipient_count from public.notifications where title = 'So hai con số'),
  (select public.count_notification_audience('guardians', null)),
  'BR-M10-24 — số xem trước và số chốt lúc gửi là MỘT');

-- BR-M10-25 — phạm vi không có ai thì đếm ra 0 chứ không lỗi.
select is(
  (select public.count_notification_audience('students', null)),
  0, 'BR-M10-25 — phạm vi rỗng đếm ra 0, người gửi biết trước');

-- ---------------------------------------------------------------------------
-- 🔴 Đếm phải kiểm quyền TRƯỚC khi đếm — nếu không nó là cửa hậu đếm người.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.count_notification_audience('all', null)$$,
  '42501', 'FORBIDDEN', 'phụ huynh không đếm được phạm vi toàn hệ thống');
select throws_ok(
  $$select public.count_notification_audience('guardians', null)$$,
  '42501', 'FORBIDDEN', 'phụ huynh không đếm được nhóm phụ huynh');

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$select public.count_notification_audience('sector', '10000000-0000-0000-0000-000000000002')$$,
  'trưởng ngành đếm được ngành mình');
select throws_ok(
  $$select public.count_notification_audience('sector', '10000000-0000-0000-0000-000000000003')$$,
  '42501', 'FORBIDDEN', 'trưởng ngành không đếm được ngành khác');

-- ---------------------------------------------------------------------------
-- D-165 — chống gửi đúp bằng mã yêu cầu (AC-03-01).
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000001', true);

select is(
  (select public.publish_notification(
     'Gửi hai lần', 'Nội dung', 'all', null, null,
     'aa000000-0000-4000-8000-000000000001')),
  (select public.publish_notification(
     'Gửi hai lần', 'Nội dung', 'all', null, null,
     'aa000000-0000-4000-8000-000000000001')),
  'AC-03-01 — hai lượt gọi cùng mã trả về CÙNG một thông báo');

select is(
  (select count(*)::integer from public.notifications where title = 'Gửi hai lần'),
  1, 'AC-03-01 — chỉ một thông báo được tạo');

-- Lượt lặp KHÔNG được chốt lại danh sách người nhận: `unique (notification_id,
-- profile_id)` chặn dòng trùng, nhưng `row_count` khi ấy về 0 và
-- `recipient_count` bị ghi đè thành 0 — thông báo tới đủ người mà báo cáo là
-- "chưa tới ai". Đường tắt idempotent phải dừng TRƯỚC bước materialize.
select isnt(
  (select recipient_count from public.notifications where title = 'Gửi hai lần'),
  0, 'lượt gửi lặp không xoá sổ số người nhận của lượt đầu');

select is(
  (select recipient_count from public.notifications where title = 'Gửi hai lần'),
  (select count(*)::integer from public.notification_recipients as recipient
   join public.notifications as notification on notification.id = recipient.notification_id
   where notification.title = 'Gửi hai lần'),
  'số người nhận đã ghi khớp số dòng thật');

-- Mã khác nhau vẫn là hai thông báo — người ta CÓ QUYỀN gửi lại cùng nội dung.
select lives_ok(
  $$select public.publish_notification(
      'Gửi hai lần', 'Nội dung', 'all', null, null,
      'aa000000-0000-4000-8000-000000000002')$$,
  'mã khác thì gửi lại được, không bị chặn nhầm');
select is(
  (select count(*)::integer from public.notifications where title = 'Gửi hai lần'),
  2, 'cùng tiêu đề nhưng khác mã là hai thông báo — không chặn quá tay');

-- Không có mã (đường gọi cũ) vẫn chạy: cột nullable, ràng buộc duy nhất là
-- **một phần**, nên dữ liệu cũ và mọi lời gọi 5 tham số không vướng gì.
select lives_ok(
  $$select public.publish_notification('Không mã một', 'Nội dung', 'all', null, null)$$,
  'gọi không kèm mã vẫn chạy (tương thích ngược)');
select lives_ok(
  $$select public.publish_notification('Không mã hai', 'Nội dung', 'all', null, null)$$,
  'hai lần gọi không kèm mã không đụng ràng buộc duy nhất');

select * from finish();
rollback;
