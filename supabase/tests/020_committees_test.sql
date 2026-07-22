begin;

-- P6-T1/P6-T2: 6 Ban seed, tối đa hai Ban đang hoạt động cho mỗi nhân sự
-- (D-47), chỉ Trưởng/Phó Ban đăng nội dung (D-48) và thành viên chỉ thấy Ban
-- mình. Toàn bộ kiểm bằng JWT thật, không dùng service role.
select plan(35);

select has_table('public', 'committees', 'bảng Ban tồn tại');
select has_table('public', 'committee_memberships', 'bảng thành viên Ban tồn tại');
select has_table('public', 'committee_announcements', 'bảng thông báo Ban tồn tại');
select has_table('public', 'committee_meetings', 'bảng lịch họp Ban tồn tại');
select has_table('public', 'committee_weekly_plans', 'bảng công việc tuần tồn tại');
select is((select count(*)::integer from public.committees), 6, 'seed đúng 6 Ban (D-47)');
select is(
  (select count(*)::integer from public.committees where manages_equipment),
  1,
  'chỉ một Ban giữ kho thiết bị');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-ban@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader-ban@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-ban@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider-ban@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'busy-ban@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'SEC_BAN', 'Thư ký xứ đoàn'),
  ('f1000000-0000-4000-8000-000000000002', 'LEADER_BAN', 'Trưởng Ban Sinh hoạt'),
  ('f1000000-0000-4000-8000-000000000003', 'MEMBER_BAN', 'Thành viên Ban Sinh hoạt'),
  ('f1000000-0000-4000-8000-000000000004', 'OUTSIDER_BAN', 'Thành viên Ban Y tế'),
  ('f1000000-0000-4000-8000-000000000005', 'BUSY_BAN', 'Nhân sự đã hai Ban');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Thư ký xứ đoàn', '0970000001'),
  ('f7000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'anh', 'Trưởng Ban Sinh hoạt', '0970000002'),
  ('f7000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'chi', 'Thành viên Ban Sinh hoạt', '0970000003'),
  ('f7000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'chi', 'Thành viên Ban Y tế', '0970000004'),
  ('f7000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000005', 'anh', 'Nhân sự đã hai Ban', '0970000005');
insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000001', 'secretary');
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f0000000-0000-4000-8000-000000000001', '2090-2091', 'Năm Ban', '2090-09-01', '2091-05-31', 'draft', '2096-05-31');
insert into public.classes (id, academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name) values
  ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'catechism', 'full_year', 'Ấu 1A Ban');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000002', 'member', '2090-09-01'),
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000003', 'trainee', '2090-09-01'),
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000004', 'representative', '2090-09-01');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f1000000-0000-4000-8000-000000000002', 'class_teacher', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000003', 'trainee_assistant', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000004', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001');

set local role authenticated;

-- Chỉ global-write mới lập được Ban/membership (WF-12).
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.committee_memberships (committee_id, staff_profile_id, position, updated_by)
    values ('30000000-0000-0000-0000-000000000001', 'f7000000-0000-4000-8000-000000000002', 'leader', 'f1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'giáo lý viên thường không tự thêm mình vào Ban');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.committee_memberships (committee_id, staff_profile_id, position, updated_by) values
    ('30000000-0000-0000-0000-000000000001', 'f7000000-0000-4000-8000-000000000002', 'leader', 'f1000000-0000-4000-8000-000000000001'),
    ('30000000-0000-0000-0000-000000000001', 'f7000000-0000-4000-8000-000000000003', 'member', 'f1000000-0000-4000-8000-000000000001'),
    ('30000000-0000-0000-0000-000000000006', 'f7000000-0000-4000-8000-000000000004', 'leader', 'f1000000-0000-4000-8000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'f7000000-0000-4000-8000-000000000005', 'member', 'f1000000-0000-4000-8000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'f7000000-0000-4000-8000-000000000005', 'member', 'f1000000-0000-4000-8000-000000000001')$$,
  'thư ký lập được Ban và chức vụ');

-- D-47: Ban thứ ba bị chặn ở DB, không phải chỉ ẩn nút.
select throws_ok(
  $$insert into public.committee_memberships (committee_id, staff_profile_id, position, updated_by)
    values ('30000000-0000-0000-0000-000000000004', 'f7000000-0000-4000-8000-000000000005', 'member', 'f1000000-0000-4000-8000-000000000001')$$,
  '23514', 'COMMITTEE_LIMIT_EXCEEDED', 'không ai giữ quá hai Ban đang hoạt động');
select lives_ok(
  $$update public.committee_memberships set is_active = false, ends_on = current_date, updated_by = 'f1000000-0000-4000-8000-000000000001'
    where committee_id = '30000000-0000-0000-0000-000000000003' and staff_profile_id = 'f7000000-0000-4000-8000-000000000005'$$,
  'kết thúc một Ban để nhường chỗ');
select lives_ok(
  $$insert into public.committee_memberships (committee_id, staff_profile_id, position, updated_by)
    values ('30000000-0000-0000-0000-000000000004', 'f7000000-0000-4000-8000-000000000005', 'member', 'f1000000-0000-4000-8000-000000000001')$$,
  'kết thúc Ban cũ rồi thì vào được Ban mới');
select is(
  (select count(*)::integer from public.committee_memberships where staff_profile_id = 'f7000000-0000-4000-8000-000000000005'),
  3,
  'lịch sử chức vụ vẫn giữ đủ dòng');

-- Nội dung Ban: chỉ Trưởng/Phó Ban (D-48).
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$insert into public.committee_announcements (committee_id, title, content, created_by)
    values ('30000000-0000-0000-0000-000000000001', 'Thành viên đăng', 'Không được phép', 'f1000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'thành viên thường không đăng thông báo Ban');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$insert into public.committee_announcements (committee_id, title, content, created_by)
    values ('30000000-0000-0000-0000-000000000001', 'Họp chuẩn bị Trung Thu', 'Các anh chị chuẩn bị đạo cụ.', 'f1000000-0000-4000-8000-000000000002')$$,
  'Trưởng ban đăng được thông báo');
select is(
  (select author_staff_id from public.committee_announcements where title = 'Họp chuẩn bị Trung Thu'),
  'f7000000-0000-4000-8000-000000000002'::uuid,
  'tác giả lấy từ phiên đăng nhập, không từ client');
select lives_ok(
  $$insert into public.committee_meetings (committee_id, title, starts_at, location, created_by)
    values ('30000000-0000-0000-0000-000000000001', 'Họp Ban tuần 1', '2090-09-05 19:00+07', 'Hội trường', 'f1000000-0000-4000-8000-000000000002')$$,
  'Trưởng ban tạo được lịch họp');
select lives_ok(
  $$insert into public.committee_weekly_plans (committee_id, week_start, content, checklist_json, created_by)
    values ('30000000-0000-0000-0000-000000000001', '2090-09-04', 'Chuẩn bị Trung Thu', '["Mua đèn", "Tập múa"]'::jsonb, 'f1000000-0000-4000-8000-000000000002')$$,
  'Trưởng ban tạo được công việc tuần');
select throws_ok(
  $$insert into public.committee_weekly_plans (committee_id, week_start, content, created_by)
    values ('30000000-0000-0000-0000-000000000001', '2090-09-05', 'Sai mốc tuần', 'f1000000-0000-4000-8000-000000000002')$$,
  '23514', null, 'mốc tuần phải là thứ Hai');
select throws_ok(
  $$insert into public.committee_announcements (committee_id, title, content, created_by)
    values ('30000000-0000-0000-0000-000000000006', 'Đăng nhờ Ban khác', 'Không được phép', 'f1000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'Trưởng Ban này không đăng sang Ban khác');

-- Thành viên chỉ thấy Ban mình (docs/05 §Committee).
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.committees), 1, 'thành viên chỉ thấy Ban mình');
select is((select count(*)::integer from public.committee_announcements), 1, 'thành viên đọc được thông báo Ban mình');
select is((select count(*)::integer from public.committee_meetings), 1, 'thành viên đọc được lịch họp Ban mình');
select is((select count(*)::integer from public.committee_weekly_plans), 1, 'thành viên đọc được công việc tuần Ban mình');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.committee_announcements), 0, 'Ban khác không thấy thông báo Ban Sinh hoạt');
select is((select count(*)::integer from public.committee_meetings), 0, 'Ban khác không thấy lịch họp Ban Sinh hoạt');
select is((select count(*)::integer from public.committee_weekly_plans), 0, 'Ban khác không thấy công việc tuần Ban Sinh hoạt');
select is(
  (select count(*)::integer from public.committee_memberships),
  1,
  'Ban khác chỉ thấy chức vụ trong Ban mình');
select is((select code::text from public.committees), 'Y_TE', 'Ban khác chỉ thấy đúng Ban Y tế');

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.committees), 6, 'quyền toàn cục thấy tất cả Ban');
select is((select count(*)::integer from public.committee_announcements), 1, 'quyền toàn cục đọc được nội dung mọi Ban');

-- Helper phạm vi phải khớp với những gì policy dùng.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select ok(app.is_committee_member('30000000-0000-0000-0000-000000000001'), 'is_committee_member đúng cho thành viên');
select ok(app.is_committee_leader_or_deputy('30000000-0000-0000-0000-000000000001'), 'is_committee_leader_or_deputy đúng cho Trưởng ban');
select ok(not app.is_committee_leader_or_deputy('30000000-0000-0000-0000-000000000006'), 'không phải Trưởng ban của Ban khác');
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select ok(not app.is_committee_leader_or_deputy('30000000-0000-0000-0000-000000000001'), 'thành viên thường không phải Trưởng/Phó ban');

select * from finish();
rollback;
