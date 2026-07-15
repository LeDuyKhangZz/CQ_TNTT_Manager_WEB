begin;

select plan(14);

select has_schema('app', 'app helper schema exists');
select has_type('public', 'app_role', 'app_role enum exists');
select has_type('public', 'account_status', 'account_status enum exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'role_assignments', 'role_assignments table exists');
select has_pk('public', 'profiles', 'profiles has primary key');
select has_fk('public', 'profiles', 'profiles references auth user/profile updater');
select has_index('public', 'role_assignments', 'role_assignments_one_active_per_profile_idx', 'one-active-role index exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles RLS is enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.role_assignments'::regclass),
  'role_assignments RLS is enabled'
);
select has_function('app', 'current_profile_id', array[]::text[], 'current_profile_id helper exists');
select has_function('app', 'current_role', array[]::text[], 'current_role helper exists');
select has_function('app', 'can_access_sector', array['uuid'], 'sector helper exists');
select has_function('app', 'can_access_class', array['uuid'], 'class helper exists');

select * from finish();
rollback;
