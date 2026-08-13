begin;

-- M01-A · D-65: nhật ký thao tác tài khoản `account_audit_events`.
--   • Chỉ Super Admin ĐỌC (AGENTS §6).
--   • Append-only tuyệt đối: không ai UPDATE/DELETE, kể cả chủ bảng.
-- Kiểm bằng JWT thật, không service role.
select plan(6);

select has_table('public', 'account_audit_events', 'bảng nhật ký tài khoản tồn tại');

-- Người thứ hai là Cha sở (`parish_priest`): có `can_global_read` nhưng KHÔNG
-- phải super_admin, và không phải role gắn hồ sơ nhân sự nên không vướng trigger
-- `validate_staff_role_link`. Đọc được 0 dòng ⇒ chứng minh chốt "chỉ Super Admin
-- đọc" chặt hơn cả quyền đọc-toàn-cục thông thường.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('aa100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'audit-sa@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('aa100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'audit-pp@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('aa100000-0000-4000-8000-000000000001', 'AUDIT_SA', 'Super Admin (audit)'),
  ('aa100000-0000-4000-8000-000000000002', 'AUDIT_PP', 'Cha sở (audit)');
insert into public.role_assignments (profile_id, role, starts_on, is_active) values
  ('aa100000-0000-4000-8000-000000000001', 'super_admin', current_date, true),
  ('aa100000-0000-4000-8000-000000000002', 'parish_priest', current_date, true);

-- Một dòng nhật ký có sẵn (ghi trực tiếp lúc còn là chủ bảng).
insert into public.account_audit_events (actor_profile_id, actor_username, target_profile_id, target_username, action, detail)
values ('aa100000-0000-4000-8000-000000000001', 'AUDIT_SA', 'aa100000-0000-4000-8000-000000000002', 'AUDIT_PP', 'set_status', 'Vô hiệu hóa');

set local role authenticated;

-- Super Admin đọc được.
select set_config('request.jwt.claim.sub', 'aa100000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.account_audit_events),
  1,
  'Super Admin đọc được nhật ký tài khoản');

-- Cha sở (global-read nhưng không phải SA) KHÔNG đọc được (AGENTS §6).
select set_config('request.jwt.claim.sub', 'aa100000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.account_audit_events),
  0,
  'Cha sở (không phải Super Admin) KHÔNG đọc được nhật ký tài khoản');

-- authenticated không có quyền ghi đè nhật ký.
select set_config('request.jwt.claim.sub', 'aa100000-0000-4000-8000-000000000001', true);
select throws_ok(
  'update public.account_audit_events set detail = ''sửa trộm''',
  '42501',
  null,
  'authenticated không UPDATE được nhật ký tài khoản');

-- Append-only kể cả với chủ bảng: trigger chặn UPDATE và DELETE (D-65).
reset role;
select throws_ok(
  'update public.account_audit_events set detail = ''sửa trộm''',
  '42501',
  'ACCOUNT_AUDIT_APPEND_ONLY',
  'nhật ký chặn UPDATE kể cả chủ bảng (append-only)');
select throws_ok(
  'delete from public.account_audit_events',
  '42501',
  'ACCOUNT_AUDIT_APPEND_ONLY',
  'nhật ký chặn DELETE kể cả chủ bảng (append-only)');

select finish();
rollback;
