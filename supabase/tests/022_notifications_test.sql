begin;

-- P6-T4: publish theo đúng phạm vi được phép, materialize người nhận tại thời
-- điểm publish, không rò sang người ngoài phạm vi, và read state theo từng
-- người (WF-14, D-50).
select plan(31);

select has_table('public', 'notifications', 'bảng thông báo tồn tại');
select has_table('public', 'notification_recipients', 'bảng người nhận tồn tại');
select has_function('public', 'publish_notification', array['text', 'text', 'notification_target_type', 'uuid', 'text'], 'RPC publish tồn tại');
select has_function('public', 'mark_notification_read', array['uuid'], 'RPC đánh dấu đã đọc tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f3000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-rep@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-teacher@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-sector@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-guardian-in@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-guardian-out@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f3000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nt-otherrep@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f3000000-0000-4000-8000-000000000001', 'NT_SEC', 'Thư ký thông báo'),
  ('f3000000-0000-4000-8000-000000000002', 'NT_REP', 'Đại diện lớp Ấu 1A'),
  ('f3000000-0000-4000-8000-000000000003', 'NT_TEACHER', 'Giáo lý viên lớp Ấu 1A'),
  ('f3000000-0000-4000-8000-000000000004', 'NT_SECTOR', 'Trưởng ngành Ấu'),
  ('f3000000-0000-4000-8000-000000000005', '84930000005', 'Phụ huynh trong lớp'),
  ('f3000000-0000-4000-8000-000000000006', '84930000006', 'Phụ huynh lớp khác'),
  ('f3000000-0000-4000-8000-000000000007', 'NT_OTHERREP', 'Đại diện lớp Thiếu 1A');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('fa000000-0000-4000-8000-000000000001', '2091-2092', 'Năm thông báo', '2091-09-01', '2092-05-31', 'draft', '2097-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('fb000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A thông báo'),
  ('fb000000-0000-4000-8000-000000000002', 'fa000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'catechism', 'full_year', 'Thiếu 1A thông báo');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('fc000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'anh', 'Thư ký thông báo', '0990000001'),
  ('fc000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'anh', 'Đại diện lớp Ấu 1A', '0990000002'),
  ('fc000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'chi', 'Giáo lý viên lớp Ấu 1A', '0990000003'),
  ('fc000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 'anh', 'Trưởng ngành Ấu', '0990000004'),
  ('fc000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000007', 'anh', 'Đại diện lớp Thiếu 1A', '0990000005');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('fb000000-0000-4000-8000-000000000001', 'fc000000-0000-4000-8000-000000000002', 'representative', '2091-09-01'),
  ('fb000000-0000-4000-8000-000000000001', 'fc000000-0000-4000-8000-000000000003', 'member', '2091-09-01'),
  ('fb000000-0000-4000-8000-000000000002', 'fc000000-0000-4000-8000-000000000005', 'representative', '2091-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('fd000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000005', 'Phụ huynh trong lớp', '0930000005'),
  ('fd000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000006', 'Phụ huynh lớp khác', '0930000006');
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('fe000000-0000-4000-8000-000000000001', 'fd000000-0000-4000-8000-000000000001', 'Maria', 'Em Trong Lớp', 'female', '2016-01-01'),
  ('fe000000-0000-4000-8000-000000000002', 'fd000000-0000-4000-8000-000000000002', 'Anna', 'Em Lớp Khác', 'female', '2016-02-02');
insert into public.enrollments (student_id, academic_year_id, class_id, status, enrolled_on) values
  ('fe000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000001', 'active', '2091-09-01'),
  ('fe000000-0000-4000-8000-000000000002', 'fa000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000002', 'active', '2091-09-01');

insert into public.role_assignments (profile_id, role) values
  ('f3000000-0000-4000-8000-000000000001', 'secretary'),
  ('f3000000-0000-4000-8000-000000000005', 'guardian'),
  ('f3000000-0000-4000-8000-000000000006', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f3000000-0000-4000-8000-000000000002', 'class_representative', 'fa000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000003', 'class_teacher', 'fa000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000007', 'class_representative', 'fa000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000002');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('f3000000-0000-4000-8000-000000000004', 'sector_leader', 'fa000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');
insert into public.committee_memberships (committee_id, staff_profile_id, position) values
  ('30000000-0000-0000-0000-000000000003', 'fc000000-0000-4000-8000-000000000003', 'leader'),
  ('30000000-0000-0000-0000-000000000003', 'fc000000-0000-4000-8000-000000000005', 'member');

set local role authenticated;

-- Không ghi thẳng vào bảng thông báo được; publish phải qua RPC.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$insert into public.notifications (title, content, target_type, author_profile_id)
    values ('Ghi thẳng', 'Không được phép', 'all', 'f3000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'không INSERT thẳng vào bảng thông báo');

-- Phụ huynh không publish được gì.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000005', true);
select throws_ok(
  $$select public.publish_notification('Phụ huynh gửi', 'Không được phép', 'all', null, null)$$,
  '42501', 'FORBIDDEN', 'phụ huynh không publish thông báo toàn hệ thống');
select throws_ok(
  $$select public.publish_notification('Phụ huynh gửi lớp', 'Không được phép', 'class', 'fb000000-0000-4000-8000-000000000001', null)$$,
  '42501', 'FORBIDDEN', 'phụ huynh không publish thông báo lớp');

-- Giáo lý viên thường không publish cho lớp; đại diện thì được (docs/05).
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.publish_notification('GLV gửi lớp', 'Không được phép', 'class', 'fb000000-0000-4000-8000-000000000001', null)$$,
  '42501', 'FORBIDDEN', 'giáo lý viên thường không publish thông báo lớp');

select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.publish_notification('Đại diện gửi lớp khác', 'Không được phép', 'class', 'fb000000-0000-4000-8000-000000000002', null)$$,
  '42501', 'FORBIDDEN', 'đại diện không publish sang lớp khác');
select throws_ok(
  $$select public.publish_notification('Link sai', 'Route không tồn tại', 'class', 'fb000000-0000-4000-8000-000000000001', '/sa-mac')$$,
  '23514', null, 'không tạo được deep-link tới route chưa tồn tại');
select lives_ok(
  $$select public.publish_notification('Chúa nhật mặc đồng phục', 'Các em nhớ mặc đồng phục.', 'class', 'fb000000-0000-4000-8000-000000000001', '/attendance')$$,
  'đại diện lớp publish được cho lớp mình');

-- Người nhận chốt tại thời điểm publish: GLV lớp + phụ huynh/thiếu nhi lớp đó.
-- Đọc danh sách người nhận bằng phiên có quyền toàn cục: `notification_recipients`
-- chỉ cho mỗi người thấy dòng của chính mình.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000001', true);
select is(
  (select recipient_count from public.notifications where title = 'Chúa nhật mặc đồng phục'),
  3, 'thông báo lớp materialize đúng 3 người nhận');
select ok(
  exists (
    select 1 from public.notification_recipients as recipient
    join public.notifications as notification on notification.id = recipient.notification_id
    where notification.title = 'Chúa nhật mặc đồng phục'
      and recipient.profile_id = 'f3000000-0000-4000-8000-000000000005'
  ), 'phụ huynh trong lớp nằm trong danh sách nhận');
select ok(
  not exists (
    select 1 from public.notification_recipients as recipient
    join public.notifications as notification on notification.id = recipient.notification_id
    where notification.title = 'Chúa nhật mặc đồng phục'
      and recipient.profile_id = 'f3000000-0000-4000-8000-000000000006'
  ), 'phụ huynh lớp khác không nằm trong danh sách nhận');

-- Trưởng ngành publish theo ngành mình, không sang ngành khác.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$select public.publish_notification('Ngành Ấu họp', 'Các anh chị ngành Ấu họp thứ Bảy.', 'sector', '10000000-0000-0000-0000-000000000002', null)$$,
  'trưởng ngành publish được cho ngành mình');
select throws_ok(
  $$select public.publish_notification('Ngành Thiếu họp', 'Không được phép', 'sector', '10000000-0000-0000-0000-000000000003', null)$$,
  '42501', 'FORBIDDEN', 'trưởng ngành không publish sang ngành khác');
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000001', true);
select ok(
  not exists (
    select 1 from public.notification_recipients as recipient
    join public.notifications as notification on notification.id = recipient.notification_id
    where notification.title = 'Ngành Ấu họp'
      and recipient.profile_id = 'f3000000-0000-4000-8000-000000000007'
  ), 'đại diện ngành Thiếu không nhận thông báo ngành Ấu');

-- Trưởng Ban publish cho Ban mình.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.publish_notification('Ban Phụng vụ trực lễ', 'Phân công trực lễ tuần này.', 'committee', '30000000-0000-0000-0000-000000000003', '/committees')$$,
  'Trưởng Ban publish được cho Ban mình');
select is(
  (select recipient_count from public.notifications where title = 'Ban Phụng vụ trực lễ'),
  2, 'thông báo Ban chỉ tới thành viên Ban đó');
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.publish_notification('Ban khác', 'Không được phép', 'committee', '30000000-0000-0000-0000-000000000003', null)$$,
  '42501', 'FORBIDDEN', 'người ngoài Ban không publish cho Ban đó');

-- Thông báo toàn hệ thống và theo nhóm phụ huynh.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.publish_notification('Lịch khai giảng', 'Khai giảng ngày 05/09.', 'all', null, '/dashboard')$$,
  'thư ký publish được cho toàn hệ thống');
select is(
  (select recipient_count from public.notifications where title = 'Lịch khai giảng'),
  (select count(*)::integer from public.profiles as profile
   join public.role_assignments as assignment on assignment.profile_id = profile.id and assignment.is_active
   where profile.account_status = 'active'),
  'thông báo toàn hệ thống tới mọi tài khoản đang hoạt động');
select lives_ok(
  $$select public.publish_notification('Nhắc phụ huynh', 'Xin phụ huynh cập nhật số điện thoại.', 'guardians', null, null)$$,
  'thư ký publish được cho nhóm phụ huynh');
select is(
  (select recipient_count from public.notifications where title = 'Nhắc phụ huynh'),
  2, 'nhóm phụ huynh đúng số người nhận');

-- Người ngoài phạm vi không đọc được thông báo.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000006', true);
select is(
  (select count(*)::integer from public.notifications where target_type = 'class'),
  0, 'phụ huynh lớp khác không thấy thông báo lớp');
select is(
  (select count(*)::integer from public.notifications),
  2, 'phụ huynh lớp khác chỉ thấy thông báo dành cho mình');

-- Read state theo từng người.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000005', true);
select is(
  (select count(*)::integer from public.notification_recipients where read_at is null),
  3, 'phụ huynh trong lớp có 3 thông báo chưa đọc');
select lives_ok(
  $$select public.mark_notification_read(
      (select id from public.notifications where title = 'Chúa nhật mặc đồng phục'))$$,
  'đánh dấu đã đọc chạy được');
select is(
  (select count(*)::integer from public.notification_recipients where read_at is null),
  2, 'đánh dấu đã đọc giảm đúng số chưa đọc');
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000006', true);
select is(
  (select count(*)::integer from public.notification_recipients where read_at is not null),
  0, 'read state của người này không ảnh hưởng người khác');
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000005', true);
select is(
  (select public.mark_all_notifications_read()),
  2, 'đánh dấu tất cả đã đọc trả về số dòng vừa cập nhật');

select * from finish();
rollback;
