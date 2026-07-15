begin;

select plan(4);

select has_function('public', 'complete_password_change', array[]::text[], 'password completion RPC exists');
select function_returns('public', 'complete_password_change', array[]::text[], 'void', 'password completion returns void');
select isnt_definer('app', 'set_updated_at', array[]::text[], 'ordinary timestamp trigger is not security definer');
select is_definer('public', 'complete_password_change', array[]::text[], 'password completion uses a guarded definer');

select * from finish();
rollback;
