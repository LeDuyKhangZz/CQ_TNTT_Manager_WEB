begin;
select plan(12);

select ok((select reloptions @> array['security_invoker=true'] from pg_class where oid = 'public.student_year_directory'::regclass), 'History view keeps caller RLS');
select ok(not has_function_privilege('anon', 'public.list_students_for_fees_by_year(uuid,text,uuid,uuid,boolean,public.student_status,integer,integer)', 'EXECUTE'), 'Anonymous cannot execute fee history');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'public.list_students_for_fees_by_year(uuid,text,uuid,uuid,boolean,public.student_status,integer,integer)'::regprocedure), 'Fee history is definer with fixed empty search path');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='student_year_directory' and column_name in ('date_of_birth','address','health_notes')), 'History directory omits sensitive fields');

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
values ('a2f00000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','r2-fees@test.local',now(),now());
insert into public.profiles(id,username,display_name) values ('a2f00000-0000-4000-8000-000000000001','R2_FEES_TEST','Thủ quỹ kiểm chứng');
insert into public.staff_profiles(id,profile_id,title,full_name) values ('a2f00000-0000-4000-8000-000000000002','a2f00000-0000-4000-8000-000000000001','chi','Thủ quỹ kiểm chứng');
insert into public.role_assignments(profile_id,role) values ('a2f00000-0000-4000-8000-000000000001','treasurer');
insert into public.academic_years(id,code,name,start_date,end_date,status,retention_until) values
('a2f00000-0000-4000-8000-000000000010','2070-2071','R2 đóng','2070-09-01','2071-05-31','closed','2076-05-31'),
('a2f00000-0000-4000-8000-000000000011','2071-2072','R2 lưu trữ','2071-09-01','2072-05-31','archived','2077-05-31'),
('a2f00000-0000-4000-8000-000000000012','2072-2073','R2 nháp','2072-09-01','2073-05-31','draft','2078-05-31');

set local role authenticated;
select set_config('request.jwt.claim.sub','a2f00000-0000-4000-8000-000000000001',true);
-- Regression: unqualified id/status collided with RETURNS TABLE variables (42702).
select is((select count(*)::integer from public.list_students_for_fees_by_year('a2f00000-0000-4000-8000-000000000010')),0,'Treasurer closed year executes successfully');
select is((select count(*)::integer from public.list_students_for_fees_by_year('a2f00000-0000-4000-8000-000000000011')),0,'Treasurer archived year executes successfully');
select throws_ok($$select * from public.list_students_for_fees_by_year('a2f00000-0000-4000-8000-000000000012')$$,'22023','INVALID_YEAR','Draft year is rejected');
select throws_ok($$select * from public.list_students_for_fees_by_year('a2f00000-0000-4000-8000-000000000099')$$,'22023','INVALID_YEAR','Missing year is rejected');
select throws_ok($$select * from public.list_students_for_fees_by_year(null)$$,'22023','INVALID_YEAR','Null year is rejected');
select is((select count(*)::integer from public.students),0,'Treasurer still cannot read student profiles');
select is((select count(*)::integer from public.student_year_directory),0,'Invoker history view does not bypass treasurer RLS');
select set_config('request.jwt.claim.sub','a2f00000-0000-4000-8000-000000000099',true);
select throws_ok($$select * from public.list_students_for_fees_by_year('a2f00000-0000-4000-8000-000000000010')$$,'42501','FORBIDDEN','Unassigned user cannot read fee history');
select * from finish();
rollback;
