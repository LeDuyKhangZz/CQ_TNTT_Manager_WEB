begin;

select plan(16);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('90000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('90000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('90000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reader@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now()),
  ('90000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'disabled@test.local', crypt('test-only', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name, account_status) values
  ('90000000-0000-4000-8000-000000000001', 'SA_TEST', 'Super Admin Test', 'active'),
  ('90000000-0000-4000-8000-000000000002', '84901234567', 'Guardian Test', 'active'),
  ('90000000-0000-4000-8000-000000000003', 'PRIEST_TEST', 'Reader Test', 'active'),
  ('90000000-0000-4000-8000-000000000004', 'LOCKED_TEST', 'Disabled Test', 'disabled');

insert into public.guardians (profile_id, full_name, phone) values
  ('90000000-0000-4000-8000-000000000002', 'Guardian Test', '0901234567');

insert into public.role_assignments (profile_id, role) values
  ('90000000-0000-4000-8000-000000000001', 'super_admin'),
  ('90000000-0000-4000-8000-000000000002', 'guardian'),
  ('90000000-0000-4000-8000-000000000003', 'parish_priest'),
  ('90000000-0000-4000-8000-000000000004', 'super_admin');

select throws_ok(
  $$insert into public.role_assignments (profile_id, role) values ('90000000-0000-4000-8000-000000000002', 'parish_priest')$$,
  '23505', null, 'one active role is enforced'
);
select lives_ok(
  $$insert into public.role_assignments (profile_id, role, is_active, ends_on) values ('90000000-0000-4000-8000-000000000002', 'student', false, current_date)$$,
  'inactive role history is allowed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000002', true);
select is(app.current_role()::text, 'guardian', 'guardian active role is resolved from DB');
select is((select count(*)::integer from public.profiles), 1, 'guardian sees only own profile');
select is((select count(*)::integer from public.role_assignments), 2, 'guardian sees own active and historical roles only');
select throws_ok(
  $$insert into public.profiles (id, username, display_name) values (gen_random_uuid(), 'NOPE', 'Nope')$$,
  '42501', null, 'ordinary authenticated account cannot provision profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000003', true);
select ok(app.can_global_read(), 'read-only global role has global read');
select is((select count(*)::integer from public.profiles), 4, 'global reader sees all profiles');
select throws_ok(
  $$update public.profiles set display_name = 'Forbidden' where id = '90000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'global reader cannot update profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-4000-8000-000000000004', true);
select is(app.current_role()::text, null, 'disabled account has no effective role');
select ok(not app.can_global_read(), 'disabled super-admin assignment grants no global read');
select is((select count(*)::integer from public.profiles), 1, 'disabled account can only read its own unavailable status');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select count(*) from public.profiles$$,
  '42501', null, 'anonymous role cannot read profiles'
);

reset role;
select hasnt_column('public', 'profiles', 'password', 'profiles never stores a password');
select hasnt_column('public', 'profiles', 'password_hash', 'profiles never exposes a password hash');
select ok((select relrowsecurity from pg_class where oid = 'public.role_assignments'::regclass), 'role assignments remain fail-closed with RLS');

select * from finish();
rollback;
