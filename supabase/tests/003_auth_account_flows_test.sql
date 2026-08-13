begin;

select plan(6);

select has_function('public', 'complete_password_change', array[]::text[], 'password completion RPC exists');
select function_returns('public', 'complete_password_change', array[]::text[], 'void', 'password completion returns void');
select isnt_definer('app', 'set_updated_at', array[]::text[], 'ordinary timestamp trigger is not security definer');
select is_definer('public', 'complete_password_change', array[]::text[], 'password completion uses a guarded definer');

-- AC-03.4 (M01-A) — hành vi của RPC, kiểm bằng JWT thật.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c3040000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pwd-disabled@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name, account_status) values
  ('c3040000-0000-4000-8000-000000000001', 'PWD_DISABLED', 'Tài khoản vô hiệu', 'disabled');

set local role authenticated;

-- Tài khoản bị vô hiệu hóa: chặn ngay ở RPC (không chỉ ở app).
select set_config('request.jwt.claim.sub', 'c3040000-0000-4000-8000-000000000001', true);
select throws_ok(
  'select public.complete_password_change()',
  '42501',
  'ACCOUNT_UNAVAILABLE',
  'AC-03.4: tài khoản disabled không hoàn tất đổi mật khẩu được');

-- Không có phiên (auth.uid() null): bị từ chối.
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  'select public.complete_password_change()',
  '42501',
  'AUTH_REQUIRED',
  'AC-03.4: không có phiên thì không gọi được');

select * from finish();
rollback;
