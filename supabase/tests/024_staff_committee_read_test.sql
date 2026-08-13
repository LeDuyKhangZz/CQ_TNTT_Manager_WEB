begin;

-- M09-C · D-100: thành viên cùng một Ban ĐANG HOẠT ĐỘNG đọc được ĐẦY ĐỦ hồ sơ
-- nhau (nợ #13). Toàn bộ kiểm bằng JWT thật, không service role.
--
-- Fixture cố ý KHÔNG gán lớp cho ai: bốn nhân sự đều không có role toàn cục và
-- không cùng lớp với ai, nên nhánh duy nhất có thể mở quyền đọc là nhánh "cùng
-- Ban" của D-100. Mọi lượt đọc dương tính dưới đây vì thế chứng minh đúng D-100,
-- không phải nhánh lớp hay nhánh toàn cục lẻn vào.
select plan(7);

select has_function('app', 'shares_active_committee', array['uuid'], 'helper cùng-Ban tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd100-a@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd100-b@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd100-c@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd100-d@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('d1000000-0000-4000-8000-000000000001', 'D100_A', 'Trưởng Ban Sinh hoạt (D-100)'),
  ('d1000000-0000-4000-8000-000000000002', 'D100_B', 'Thành viên cùng Ban, khác lớp'),
  ('d1000000-0000-4000-8000-000000000003', 'D100_C', 'Thành viên Ban Y tế'),
  ('d1000000-0000-4000-8000-000000000004', 'D100_D', 'Người đã kết thúc nhiệm kỳ');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d7000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'anh', 'Trưởng Ban Sinh hoạt (D-100)', '0980000001'),
  ('d7000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'chi', 'Thành viên cùng Ban', '0980000002'),
  ('d7000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'chi', 'Thành viên Ban Y tế', '0980000003'),
  ('d7000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', 'anh', 'Đã kết thúc nhiệm kỳ', '0980000004');

-- A và B cùng Ban Sinh hoạt (đang hoạt động). C ở Ban Y tế. D từng ở Ban Sinh
-- hoạt nhưng đã kết thúc nhiệm kỳ.
insert into public.committee_memberships (committee_id, staff_profile_id, position, is_active) values
  ('30000000-0000-0000-0000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'leader', true),
  ('30000000-0000-0000-0000-000000000001', 'd7000000-0000-4000-8000-000000000002', 'member', true),
  ('30000000-0000-0000-0000-000000000006', 'd7000000-0000-4000-8000-000000000003', 'member', true),
  ('30000000-0000-0000-0000-000000000001', 'd7000000-0000-4000-8000-000000000004', 'member', false);

set local role authenticated;

-- ── A (Trưởng Ban Sinh hoạt) ────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000002'),
  1,
  'D-100: A thấy được hồ sơ B (cùng Ban Sinh hoạt, khác lớp)');

select is(
  (select phone from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000002'),
  '0980000002',
  'D-100: A đọc được ĐẦY ĐỦ hồ sơ B — kể cả số điện thoại (không chỉ tên)');

select is(
  (select count(*)::integer from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000003'),
  0,
  'D-100 không nới quá tay: A KHÔNG thấy C (Ban Y tế, khác Ban)');

select is(
  (select count(*)::integer from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000004'),
  0,
  'nhiệm kỳ đã kết thúc không mở quyền: A KHÔNG thấy D');

-- ── B (thành viên cùng Ban) ─────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000001'),
  1,
  'D-100 đối xứng: B thấy được hồ sơ A (cùng Ban)');

-- ── C (Ban khác) ────────────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.staff_profiles where id = 'd7000000-0000-4000-8000-000000000001'),
  0,
  'C ở Ban khác KHÔNG thấy A');

select finish();
rollback;
