begin;

-- ============================================================================
-- M10-C — thu hồi mềm (D-166, Q-2).
-- Chạy bằng JWT thật của từng vai (CLAUDE.md §4), không service role.
-- ============================================================================

select plan(27);

select has_function('public', 'retract_notification', array['uuid', 'text'],
  'RPC thu hồi tồn tại');
select has_column('public', 'notifications', 'retracted_at', 'cột mốc thu hồi tồn tại');
select has_column('public', 'notifications', 'retract_reason', 'cột lý do thu hồi tồn tại');
select has_column('public', 'notification_recipients', 'notification_retracted_at',
  'cờ thu hồi có mặt ở bảng người-nhận');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f5000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nr-secretary@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f5000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nr-rep@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f5000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nr-teacher@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f5000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nr-guardian@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f5000000-0000-4000-8000-000000000001', 'NR_SEC', 'Thư ký thu hồi'),
  ('f5000000-0000-4000-8000-000000000002', 'NR_REP', 'Đại diện lớp thu hồi'),
  ('f5000000-0000-4000-8000-000000000003', 'NR_TEACHER', 'Giáo lý viên thu hồi'),
  ('f5000000-0000-4000-8000-000000000004', '84950000004', 'Phụ huynh thu hồi');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('fa500000-0000-4000-8000-000000000001', '2095-2096', 'Năm thu hồi', '2095-09-01', '2096-05-31', 'draft', '2099-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('fb500000-0000-4000-8000-000000000001', 'fa500000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A thu hồi');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('fc500000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000001', 'chi', 'Thư ký thu hồi', '0970000001'),
  ('fc500000-0000-4000-8000-000000000002', 'f5000000-0000-4000-8000-000000000002', 'anh', 'Đại diện lớp thu hồi', '0970000002'),
  ('fc500000-0000-4000-8000-000000000003', 'f5000000-0000-4000-8000-000000000003', 'chi', 'Giáo lý viên thu hồi', '0970000003');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('fb500000-0000-4000-8000-000000000001', 'fc500000-0000-4000-8000-000000000002', 'representative', '2095-09-01'),
  ('fb500000-0000-4000-8000-000000000001', 'fc500000-0000-4000-8000-000000000003', 'member', '2095-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('fd500000-0000-4000-8000-000000000004', 'f5000000-0000-4000-8000-000000000004', 'Phụ huynh thu hồi', '0930000054');

insert into public.role_assignments (profile_id, role) values
  ('f5000000-0000-4000-8000-000000000001', 'secretary'),
  ('f5000000-0000-4000-8000-000000000004', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f5000000-0000-4000-8000-000000000002', 'class_representative', 'fa500000-0000-4000-8000-000000000001', 'fb500000-0000-4000-8000-000000000001'),
  ('f5000000-0000-4000-8000-000000000003', 'class_teacher', 'fa500000-0000-4000-8000-000000000001', 'fb500000-0000-4000-8000-000000000001');

set local role authenticated;

-- Đại diện lớp gửi một thông báo cho lớp mình.
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.publish_notification(
      'Lịch sai', 'Chúa nhật này nghỉ.', 'class',
      'fb500000-0000-4000-8000-000000000001', null)$$,
  'đại diện lớp gửi được thông báo');

-- ---------------------------------------------------------------------------
-- Trước khi thu hồi: người nhận đọc được bình thường.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.notifications where title = 'Lịch sai'),
  1, 'trước khi thu hồi, người nhận đọc được thông báo');
select is(
  (select count(*)::integer from public.notification_recipients
   where notification_retracted_at is null and read_at is null),
  1, 'trước khi thu hồi, thông báo được tính là chưa đọc');

-- ---------------------------------------------------------------------------
-- Ai KHÔNG được thu hồi.
-- ---------------------------------------------------------------------------
select throws_ok(
  $$select public.retract_notification(
      (select id from public.notifications where title = 'Lịch sai'), 'Tôi thấy sai')$$,
  '42501', 'FORBIDDEN',
  'giáo lý viên trong lớp KHÔNG thu hồi được thông báo của người khác');

select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.retract_notification(
      (select id from public.notification_recipients
       where profile_id = 'f5000000-0000-4000-8000-000000000004' limit 1), 'Không thích')$$,
  'P0002', 'RESOURCE_NOT_FOUND',
  'phụ huynh không thu hồi được (và không dò được id bằng thông điệp lỗi)');

-- ---------------------------------------------------------------------------
-- Lý do bắt buộc — chặn ở tầng cơ sở dữ liệu, không chỉ ở màn hình.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.retract_notification(
      (select id from public.notifications where title = 'Lịch sai'), '   ')$$,
  '23514', 'NOTIFICATION_RETRACT_REASON_REQUIRED',
  'thu hồi bắt buộc nêu lý do');
select is(
  (select retracted_at from public.notifications where title = 'Lịch sai'),
  null, 'lần thu hồi bị từ chối không để lại dấu vết');

-- ---------------------------------------------------------------------------
-- Tác giả thu hồi được, và số trả về là số người bị ảnh hưởng (SW-04).
-- ---------------------------------------------------------------------------
select is(
  (select public.retract_notification(
     (select id from public.notifications where title = 'Lịch sai'),
     'Gửi nhầm lớp, lịch này của lớp khác')),
  (select recipient_count from public.notifications where title = 'Lịch sai'),
  'thu hồi trả về đúng số người đã nhận');

select isnt(
  (select retracted_at from public.notifications where title = 'Lịch sai'),
  null, 'mốc thu hồi được ghi');
select is(
  (select retracted_by from public.notifications where title = 'Lịch sai'),
  'f5000000-0000-4000-8000-000000000002'::uuid, 'nhật ký ghi đúng người thu hồi');
select is(
  (select retract_reason from public.notifications where title = 'Lịch sai'),
  'Gửi nhầm lớp, lịch này của lớp khác', 'nhật ký giữ nguyên lý do');

-- Không thu hồi hai lần: lần thứ hai sẽ ghi đè người và lý do của lần đầu.
select throws_ok(
  $$select public.retract_notification(
      (select id from public.notifications where title = 'Lịch sai'), 'Lần hai')$$,
  '23514', 'NOTIFICATION_ALREADY_RETRACTED',
  'không thu hồi lần thứ hai, nhật ký lần đầu không bị ghi đè');

-- ---------------------------------------------------------------------------
-- 🔴 Sau khi thu hồi — vế người nhận.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.notifications where title = 'Lịch sai'),
  0, 'người nhận KHÔNG đọc được nội dung đã thu hồi nữa, kể cả gọi thẳng Data API');
select is(
  (select count(*)::integer from public.notification_recipients),
  1, 'nhưng dòng người-nhận vẫn còn — nhãn "Đã thu hồi" dựng được từ đó');
select isnt(
  (select notification_retracted_at from public.notification_recipients limit 1),
  null, 'trigger đã kéo cờ thu hồi xuống bảng người-nhận');
select is(
  (select count(*)::integer from public.notification_recipients
   where notification_retracted_at is null and read_at is null),
  0, 'chuông thôi đếm thông báo đã thu hồi là chưa đọc');

-- ---------------------------------------------------------------------------
-- Tác giả và cấp xứ đoàn vẫn xem lại được — nếu không thì nhật ký vô dụng.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.notifications where title = 'Lịch sai'),
  1, 'tác giả vẫn xem lại được bản đã thu hồi ở mục "Đã gửi"');

select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000001', true);
select is(
  (select retract_reason from public.notifications where title = 'Lịch sai'),
  'Gửi nhầm lớp, lịch này của lớp khác',
  'cấp xứ đoàn đọc được nhật ký thu hồi');

-- ---------------------------------------------------------------------------
-- Cấp xứ đoàn thu hồi được thông báo của người khác (vế ⓶ của D-166).
-- ---------------------------------------------------------------------------
select lives_ok(
  $$select public.publish_notification('Bản thứ hai', 'Nội dung', 'all', null, null)$$,
  'thư ký gửi được một thông báo khác');
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.publish_notification(
      'Của đại diện', 'Nội dung', 'class',
      'fb500000-0000-4000-8000-000000000001', null)$$,
  'đại diện gửi thêm một thông báo nữa');
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.retract_notification(
      (select id from public.notifications where title = 'Của đại diện'),
      'Ban điều hành gỡ giúp vì đại diện đang đi vắng')$$,
  'cấp xứ đoàn thu hồi được thông báo của người khác');

-- ---------------------------------------------------------------------------
-- Bản ghi KHÔNG bị xoá, và `authenticated` vẫn không ghi thẳng được.
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::integer from public.notifications where title = 'Của đại diện'),
  1, 'thu hồi mềm — bản ghi vẫn nằm nguyên trong bảng');
select throws_ok(
  $$update public.notifications set retracted_at = null where title = 'Của đại diện'$$,
  '42501', null,
  'authenticated không tự gỡ cờ thu hồi bằng lệnh ghi thẳng');

select * from finish();
rollback;
