begin;

-- Phase 3 security regression: RLS cannot protect a table from TRUNCATE.
-- Inspect privileges only; never execute a destructive statement in this test.
select plan(6);

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and exists (
        select 1
        from unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) privilege_name
        where has_table_privilege(
          'anon',
          format('%I.%I', n.nspname, c.relname),
          privilege_name
        )
      )
  ),
  0,
  'anon không có đặc quyền DDL/bảo trì trên bất kỳ bảng public nào');

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and exists (
        select 1
        from unnest(array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']) privilege_name
        where has_table_privilege(
          'authenticated',
          format('%I.%I', n.nspname, c.relname),
          privilege_name
        )
      )
  ),
  0,
  'authenticated không có đặc quyền DDL/bảo trì trên bất kỳ bảng public nào');

select is(
  (
    select count(*)::integer
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    join pg_roles grantee on grantee.oid = x.grantee
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 'public'::regnamespace
      and d.defaclobjtype = 'r'
      and grantee.rolname = 'anon'
      and x.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  ),
  0,
  'default ACL của postgres không cấp lại đặc quyền thừa cho anon');

select is(
  (
    select count(*)::integer
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    join pg_roles grantee on grantee.oid = x.grantee
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 'public'::regnamespace
      and d.defaclobjtype = 'r'
      and grantee.rolname = 'authenticated'
      and x.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  ),
  0,
  'default ACL của postgres không cấp lại đặc quyền thừa cho authenticated');

select ok(
  has_table_privilege('authenticated', 'public.students', 'SELECT')
  and has_table_privilege('authenticated', 'public.students', 'INSERT')
  and has_table_privilege('authenticated', 'public.students', 'UPDATE')
  and has_table_privilege('authenticated', 'public.import_rows', 'DELETE'),
  'các quyền DML đã duyệt của authenticated vẫn nguyên vẹn');

select ok(
  has_table_privilege('service_role', 'public.profiles', 'SELECT')
  and has_table_privilege('service_role', 'public.profiles', 'INSERT')
  and has_table_privilege('service_role', 'public.profiles', 'UPDATE')
  and has_table_privilege('service_role', 'public.profiles', 'DELETE'),
  'quyền CRUD của service_role vẫn nguyên vẹn');

select * from finish();
rollback;
