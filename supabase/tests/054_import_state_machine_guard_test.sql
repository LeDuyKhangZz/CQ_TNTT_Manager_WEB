begin;

select plan(32);

-- M12 Phase 3: exercise the database boundary as a real authenticated global
-- writer.  Fixtures are inserted as the migration owner, then every attack or
-- valid workflow below runs under `role authenticated` + a JWT subject.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  'd1100000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'm12-state@test.local',
  crypt('x', gen_salt('bf')), now(), now(), now()
);

insert into public.profiles (id, username, display_name) values
  ('d1100000-0000-4000-8000-000000000001', 'M12_STATE', 'Thư ký M12 state');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d1700000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001',
   'anh', 'Thư ký M12 state', '0900005401');

insert into public.role_assignments (profile_id, role) values
  ('d1100000-0000-4000-8000-000000000001', 'secretary');

insert into public.academic_years (
  id, code, name, start_date, end_date, status, retention_until
) values
  ('d1000000-0000-4000-8000-000000000001', '2081-2082', 'Năm mở M12 state',
   '2081-09-01', '2082-05-31', 'current', '2087-05-31'),
  ('d1000000-0000-4000-8000-000000000002', '2080-2081', 'Năm đóng M12 state',
   '2080-09-01', '2081-05-31', 'closed', '2086-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('d1600000-0000-4000-8000-000000000001',
   'd1000000-0000-4000-8000-000000000001',
   '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 M12 mở'),
  ('d1600000-0000-4000-8000-000000000002',
   'd1000000-0000-4000-8000-000000000002',
   '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 M12 đóng');

insert into public.import_batches (
  id, filename, academic_year_id, uploaded_by, status,
  total_rows, committed_rows, committed_at
) values
  ('d1400000-0000-4000-8000-000000000001', 'committed.xlsx',
   'd1000000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001', 'committed', 1, 1, now()),
  ('d1400000-0000-4000-8000-000000000002', 'cancel-me.xlsx',
   'd1000000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001', 'dry_run', 1, 0, null),
  ('d1400000-0000-4000-8000-000000000003', 'closed-year.xlsx',
   'd1000000-0000-4000-8000-000000000002',
   'd1100000-0000-4000-8000-000000000001', 'dry_run', 1, 0, null),
  ('d1400000-0000-4000-8000-000000000004', 'duplicate-review.xlsx',
   'd1000000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001', 'dry_run', 1, 0, null),
  ('d1400000-0000-4000-8000-000000000005', 'missing-gender.xlsx',
   'd1000000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001', 'dry_run', 1, 0, null),
  ('d1400000-0000-4000-8000-000000000006', 'duplicate-and-gender.xlsx',
   'd1000000-0000-4000-8000-000000000001',
   'd1100000-0000-4000-8000-000000000001', 'dry_run', 1, 0, null);

insert into public.import_rows (
  id, batch_id, row_number, raw_json, normalized_json, status, action
) values
  ('d1500000-0000-4000-8000-000000000001',
   'd1400000-0000-4000-8000-000000000001', 1,
   jsonb_build_object('full_name', 'Dòng đã ghi'),
   jsonb_build_object('full_name', 'Dòng đã ghi'), 'committed', 'create'),
  ('d1500000-0000-4000-8000-000000000002',
   'd1400000-0000-4000-8000-000000000002', 1,
   jsonb_build_object('full_name', 'Dòng chờ huỷ'),
   jsonb_build_object('full_name', 'Dòng chờ huỷ'), 'valid', 'create'),
  ('d1500000-0000-4000-8000-000000000003',
   'd1400000-0000-4000-8000-000000000003', 1,
   jsonb_build_object('full_name', 'Em Năm Đã Đóng'),
   jsonb_build_object(
     'full_name', 'Em Năm Đã Đóng',
     'saint_name', 'Maria',
     'gender', 'female',
     'date_of_birth', '2015-05-05',
     'guardian_phone', '0900005499',
     'class_id', 'd1600000-0000-4000-8000-000000000002'
   ),
   'valid', 'create'),
  ('d1500000-0000-4000-8000-000000000004',
   'd1400000-0000-4000-8000-000000000004', 1,
   jsonb_build_object('full_name', 'Em Chờ Xác Nhận Trùng'),
   jsonb_build_object(
     'full_name', 'Em Chờ Xác Nhận Trùng',
     'saint_name', 'Giuse',
     'gender', 'male',
     'date_of_birth', '2016-06-06',
     'guardian_phone', '0900005498',
     'class_id', 'd1600000-0000-4000-8000-000000000001'
   ),
   'warning', 'create'),
  ('d1500000-0000-4000-8000-000000000005',
   'd1400000-0000-4000-8000-000000000005', 1,
   jsonb_build_object('full_name', 'Em Thiếu Giới Tính'),
   jsonb_build_object(
     'full_name', 'Em Thiếu Giới Tính',
     'saint_name', 'Anna',
     'date_of_birth', '2016-07-07',
     'guardian_phone', '0900005497',
     'class_id', 'd1600000-0000-4000-8000-000000000001'
   ),
   'warning', 'create'),
  ('d1500000-0000-4000-8000-000000000006',
   'd1400000-0000-4000-8000-000000000006', 1,
   jsonb_build_object('full_name', 'Em Trùng Và Thiếu Giới Tính'),
   jsonb_build_object(
     'full_name', 'Em Trùng Và Thiếu Giới Tính',
     'saint_name', 'Maria',
     'date_of_birth', '2016-08-08',
     'guardian_phone', '0900005496',
     'class_id', 'd1600000-0000-4000-8000-000000000001'
   ),
   'warning', 'create');

update public.import_rows
set warnings_json = jsonb_build_array(
  jsonb_build_object('field', 'duplicate_pending', 'message', 'review required')
)
where id = 'd1500000-0000-4000-8000-000000000004';

update public.import_rows
set warnings_json = jsonb_build_array(
  jsonb_build_object('field', 'gender', 'message', 'gender required'),
  jsonb_build_object('field', 'duplicate_pending', 'message', 'review required')
)
where id = 'd1500000-0000-4000-8000-000000000006';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000001', true);

select ok(
  not has_function_privilege(
    'authenticated',
    'app.commit_import_rows_internal(uuid,uuid[])',
    'execute'
  ),
  'authenticated cannot call the private unchecked commit body'
);

select throws_ok(
  $$select * from public.commit_import_rows(
       'd1400000-0000-4000-8000-000000000004',
       array['d1500000-0000-4000-8000-000000000004']::uuid[]
     )$$,
  '23514', 'IMPORT_DUPLICATE_REVIEW_REQUIRED',
  'direct RPC cannot bypass an unresolved duplicate decision'
);

select is(
  (select count(*)::integer from public.students where full_name = 'Em Chờ Xác Nhận Trùng'),
  0,
  'rejected unresolved duplicate creates no business record'
);

select throws_ok(
  $$update public.import_rows
       set warnings_json = jsonb_build_array(
         jsonb_build_object('field', 'duplicate', 'message', 'reviewed')
       )
     where id = 'd1500000-0000-4000-8000-000000000004'$$,
  '23514', 'IMPORT_DUPLICATE_CONFIRMATION_RPC_REQUIRED',
  'direct table update cannot forge a duplicate confirmation'
);

select lives_ok(
  $$select public.confirm_import_duplicate(
       'd1500000-0000-4000-8000-000000000004',
       'create'
     )$$,
  'dedicated confirmation RPC records the explicit duplicate decision'
);

select lives_ok(
  $$create temporary table reviewed_commit_result as
    select * from public.commit_import_rows(
      'd1400000-0000-4000-8000-000000000004',
      array['d1500000-0000-4000-8000-000000000004']::uuid[]
    )$$,
  'reviewed row can pass the public commit wrapper'
);

select ok(
  (select out_committed from reviewed_commit_result),
  'reviewed commit reports success'
);

select is(
  (select count(*)::integer from public.students where full_name = 'Em Chờ Xác Nhận Trùng'),
  1,
  'reviewed commit creates exactly one student'
);

select throws_ok(
  $$select * from public.commit_import_rows(
       'd1400000-0000-4000-8000-000000000005',
       array['d1500000-0000-4000-8000-000000000005']::uuid[]
     )$$,
  '23514', 'IMPORT_GENDER_REQUIRED',
  'direct RPC also enforces gender for create rows'
);

select lives_ok(
  $$update public.import_rows
       set normalized_json = normalized_json || '{"gender":"female"}'::jsonb,
           warnings_json = (
             select coalesce(jsonb_agg(item), '[]'::jsonb)
               from jsonb_array_elements(warnings_json) as item
              where item ->> 'field' <> 'gender'
           )
     where id = 'd1500000-0000-4000-8000-000000000006';
    select public.confirm_import_duplicate(
      'd1500000-0000-4000-8000-000000000006', 'create'
    );
    create temporary table combined_commit_result as
    select * from public.commit_import_rows(
      'd1400000-0000-4000-8000-000000000006',
      array['d1500000-0000-4000-8000-000000000006']::uuid[]
    )$$,
  'combined gender edit then duplicate confirmation commits successfully'
);

select ok(
  (select out_committed from combined_commit_result)
  and not exists (
    select 1
      from public.import_rows as row,
           jsonb_array_elements(row.warnings_json) as warning
     where row.id = 'd1500000-0000-4000-8000-000000000006'
       and warning ->> 'field' = 'duplicate_pending'
  )
  and (
    select normalized_json ->> 'gender'
      from public.import_rows
     where id = 'd1500000-0000-4000-8000-000000000006'
  ) = 'female',
  'combined path persists gender, resolves marker once, and reports committed'
);

select throws_ok(
  $$update public.import_batches
       set status = 'dry_run', committed_rows = 0
     where id = 'd1400000-0000-4000-8000-000000000001'$$,
  '23514', 'IMPORT_BATCH_STATE_IMMUTABLE',
  'committed batch cannot be downgraded/reset through the Data API'
);

select is(
  (select status::text || ':' || committed_rows::text
     from public.import_batches
    where id = 'd1400000-0000-4000-8000-000000000001'),
  'committed:1',
  'failed downgrade preserves committed state and counter'
);

delete from public.import_batches
where id = 'd1400000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.import_batches
    where id = 'd1400000-0000-4000-8000-000000000001'),
  1,
  'D-131: authenticated DELETE cannot remove a committed batch'
);

delete from public.import_batches
where id = 'd1400000-0000-4000-8000-000000000002';
select is(
  (select count(*)::integer from public.import_batches
    where id = 'd1400000-0000-4000-8000-000000000002'),
  1,
  'D-131: even a dry-run batch is cancelled, not hard-deleted'
);

select throws_ok(
  $$update public.import_rows
       set status = 'valid', created_student_id = 'd1300000-0000-4000-8000-000000000099'
     where id = 'd1500000-0000-4000-8000-000000000001'$$,
  '23514', 'IMPORT_ROW_PROTECTED_FIELDS',
  'authenticated caller cannot forge committed status/mapping fields'
);

select lives_ok(
  $$update public.import_rows
       set normalized_json = normalized_json || '{"gender":"male"}'::jsonb
     where id = 'd1500000-0000-4000-8000-000000000002'$$,
  'review payload of a pending row remains editable'
);

select is(
  (select normalized_json ->> 'gender' from public.import_rows
    where id = 'd1500000-0000-4000-8000-000000000002'),
  'male',
  'valid review edit is persisted'
);

select lives_ok(
  $$update public.import_batches
       set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
     where id = 'd1400000-0000-4000-8000-000000000002'$$,
  'a zero-progress dry run can still be cancelled'
);

select is(
  (select status::text from public.import_batches
    where id = 'd1400000-0000-4000-8000-000000000002'),
  'cancelled',
  'cancellation is a retained state transition'
);

select throws_ok(
  $$update public.import_rows
       set normalized_json = normalized_json || '{"gender":"female"}'::jsonb
     where id = 'd1500000-0000-4000-8000-000000000002'$$,
  '23514', 'IMPORT_ROW_PROTECTED_FIELDS',
  'cancelled rows cannot be edited back into a reviewable shape'
);

select throws_ok(
  $$insert into public.import_batches (
       filename, academic_year_id, uploaded_by, status, total_rows
     ) values (
       'closed-direct.xlsx',
       'd1000000-0000-4000-8000-000000000002',
       auth.uid(), 'dry_run', 1
     )$$,
  '42501', null,
  'non-SA cannot stage a new import directly in a closed year'
);

select throws_ok(
  $$insert into public.import_batches (
       filename, academic_year_id, uploaded_by, status,
       total_rows, committed_rows, committed_at
     ) values (
       'forged-committed.xlsx',
       'd1000000-0000-4000-8000-000000000001',
       auth.uid(), 'committed', 1, 1, now()
     )$$,
  '42501', null,
  'authenticated insert cannot forge a committed batch'
);

select throws_ok(
  $$insert into public.import_rows (
       batch_id, row_number, raw_json, status, action
     ) values (
       'd1400000-0000-4000-8000-000000000001', 2,
       '{}'::jsonb, 'committed', 'create'
     )$$,
  '42501', null,
  'authenticated insert cannot forge a committed row'
);

create temporary table closed_commit_result as
select * from public.commit_import_rows(
  'd1400000-0000-4000-8000-000000000003',
  array['d1500000-0000-4000-8000-000000000003']::uuid[]
);

select ok(
  (select not out_committed and out_error_message = 'YEAR_NOT_WRITABLE'
     from closed_commit_result),
  'commit RPC reports YEAR_NOT_WRITABLE for a non-SA closed-year batch'
);

select is(
  (select count(*)::integer from public.students where full_name = 'Em Năm Đã Đóng'),
  0,
  'closed-year rejection rolls back the student/business writes for that row'
);

select is(
  (select status::text from public.import_rows
    where id = 'd1500000-0000-4000-8000-000000000003'),
  'error',
  'rejected closed-year row is retained with an explicit error state'
);

select throws_ok(
  $$update public.import_rows
       set raw_json = '{}'::jsonb
     where id = 'd1500000-0000-4000-8000-000000000001'$$,
  '23514', 'IMPORT_ROW_PROTECTED_FIELDS',
  'D-132 raw rows cannot be cleared outside the atomic purge RPC'
);

select throws_ok(
  $$update public.import_batches
       set raw_purged_at = now(), raw_purged_by = auth.uid()
     where id = 'd1400000-0000-4000-8000-000000000001'$$,
  '23514', 'IMPORT_BATCH_STATE_IMMUTABLE',
  'direct Data API cannot forge a purged marker while sensitive rows remain'
);

select is(
  public.purge_import_raw_data('d1400000-0000-4000-8000-000000000001'),
  1,
  'D-132 atomic purge clears one sensitive source row'
);

select is(
  (select status::text || ':' || raw_json::text
     from public.import_rows
    where id = 'd1500000-0000-4000-8000-000000000001'),
  'committed:{}',
  'raw purge preserves committed status and row trace'
);

select ok(
  (select raw_purged_at is not null and raw_purged_by = auth.uid()
     from public.import_batches
    where id = 'd1400000-0000-4000-8000-000000000001'),
  'atomic purge stamps actor/time in the same transaction'
);

reset role;

select * from finish();
rollback;
