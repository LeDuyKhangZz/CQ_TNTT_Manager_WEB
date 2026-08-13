-- Phase 3 / M12: make the import state machine authoritative at the database
-- boundary.  The previous RLS policy only rejected a target state of
-- `cancelled` when committed_rows > 0.  An authenticated global writer could
-- first rewrite a committed batch to dry_run/0 and then delete the batch and
-- its row-to-record trace through the Data API.

-- New batches are always staging batches in a writable academic year.  The
-- commit RPC is the only path that may create committed progress/mappings.
drop policy if exists import_batches_insert_global_write on public.import_batches;
create policy import_batches_insert_global_write
on public.import_batches for insert to authenticated
with check (
  app.can_global_write()
  and uploaded_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
  and status = 'dry_run'
  and committed_rows = 0
  and committed_at is null
  and cancelled_at is null
  and cancelled_by is null
  and raw_purged_at is null
  and raw_purged_by is null
);

drop policy if exists import_rows_insert_global_write on public.import_rows;
create policy import_rows_insert_global_write
on public.import_rows for insert to authenticated
with check (
  app.can_global_write()
  and status in ('valid', 'warning', 'error')
  and created_student_id is null
  and created_guardian_id is null
  and commit_error is null
  and exists (
    select 1
    from public.import_batches as batch
    where batch.id = import_rows.batch_id
      and batch.status = 'dry_run'
  )
);

-- D-131 supersedes the original "staging is disposable" rule: cancellation
-- keeps the batch and its rows for traceability.  Keep DELETE granted so a
-- direct Data API DELETE remains a harmless zero-row operation (and existing
-- callers do not turn it into an authorization exception), but no
-- authenticated row is eligible anymore.  service_role retains its explicit
-- maintenance grant and bypasses RLS.
drop policy if exists import_batches_delete_dry_run on public.import_batches;
create policy import_batches_delete_none
on public.import_batches for delete to authenticated
using (false);

drop policy if exists import_rows_delete_dry_run on public.import_rows;
create policy import_rows_delete_none
on public.import_rows for delete to authenticated
using (false);

create or replace function app.guard_import_batch_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The commit RPC runs as its SECURITY DEFINER owner.  Only direct Data API
  -- writes arrive here as current_user=authenticated.
  if current_user <> 'authenticated' then
    return new;
  end if;

  if old.status = 'dry_run' and new.status = 'dry_run' then
    -- createDryRunBatch fills these three validation counters immediately
    -- after inserting the batch.  No other batch field is client-editable.
    if (
      to_jsonb(new) - array['updated_at', 'valid_rows', 'warning_rows', 'error_rows']
    ) is distinct from (
      to_jsonb(old) - array['updated_at', 'valid_rows', 'warning_rows', 'error_rows']
    ) then
      raise exception 'IMPORT_BATCH_PROTECTED_FIELDS' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.status = 'dry_run' and new.status = 'cancelled' then
    if (
      to_jsonb(new) - array['updated_at', 'status', 'cancelled_at', 'cancelled_by']
    ) is distinct from (
      to_jsonb(old) - array['updated_at', 'status', 'cancelled_at', 'cancelled_by']
    )
       or old.committed_rows <> 0
       or new.committed_rows <> 0
       or new.cancelled_at is null
       or new.cancelled_by is distinct from auth.uid()
    then
      raise exception 'IMPORT_BATCH_INVALID_CANCEL' using errcode = '23514';
    end if;
    return new;
  end if;

  -- Preserve the established API contract for the simple
  -- processed -> cancelled attempt: the existing RLS WITH CHECK rejects it
  -- with 42501.  Only this exact, non-destructive shape is allowed to reach
  -- RLS; changing the counter or any other field is still caught below.
  if old.status in ('partially_committed', 'committed')
     and old.committed_rows > 0
     and new.status = 'cancelled'
     and new.committed_rows = old.committed_rows
     and (
       to_jsonb(new) - array['updated_at', 'status']
     ) is not distinct from (
       to_jsonb(old) - array['updated_at', 'status']
     )
  then
    return new;
  end if;

  raise exception 'IMPORT_BATCH_STATE_IMMUTABLE' using errcode = '23514';
end;
$$;

drop trigger if exists import_batches_state_machine_guard on public.import_batches;
create trigger import_batches_state_machine_guard
before update on public.import_batches
for each row execute function app.guard_import_batch_update();

create or replace function app.guard_import_row_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_batch_status public.import_batch_status;
  v_year_id uuid;
begin
  -- This row lock serializes commit-row transitions with cancellation.  If
  -- cancellation wins, a later commit transition observes `cancelled` and the
  -- row's subtransaction rolls its business inserts back.  If commit wins,
  -- cancel's `status = dry_run` compare-and-update returns zero rows.
  select batch.status, batch.academic_year_id
    into v_batch_status, v_year_id
    from public.import_batches as batch
   where batch.id = new.batch_id
   for update;

  if v_batch_status is null then
    raise exception 'IMPORT_BATCH_NOT_FOUND' using errcode = '23503';
  end if;

  if new.status is distinct from old.status
     and new.status in ('committed', 'skipped')
  then
    if v_batch_status not in ('dry_run', 'partially_committed') then
      raise exception 'IMPORT_BATCH_NOT_COMMITTABLE' using errcode = '23514';
    end if;
    if new.status = 'committed'
       and not (v_year_id = any (app.writable_academic_year_ids()))
    then
      raise exception 'YEAR_NOT_WRITABLE' using errcode = '23514';
    end if;
  end if;

  -- Updates made inside commit_import_rows run as postgres and are the only
  -- writers of status, error details and created-record mappings.
  if current_user <> 'authenticated' then
    return new;
  end if;

  -- D-133 is a real confirmation step, not a client-side convention.  A
  -- direct table update may edit gender or other review fields, but only the
  -- dedicated SECURITY DEFINER RPC below may clear the unresolved marker.
  if jsonb_path_exists(
       coalesce(old.warnings_json, '[]'::jsonb),
       '$[*] ? (@.field == "duplicate_pending")'
     )
     and not jsonb_path_exists(
       coalesce(new.warnings_json, '[]'::jsonb),
       '$[*] ? (@.field == "duplicate_pending")'
     )
  then
    raise exception 'IMPORT_DUPLICATE_CONFIRMATION_RPC_REQUIRED' using errcode = '23514';
  end if;

  -- Reviewers may edit only the review payload of rows still pending in a
  -- dry-run/partially-committed batch.  Identity, status, parser errors and
  -- record mappings are protected.
  if v_batch_status in ('dry_run', 'partially_committed')
     and old.status in ('valid', 'warning', 'error')
     and new.status = old.status
     and (
       to_jsonb(new) - array['updated_at', 'normalized_json', 'warnings_json', 'action']
     ) is not distinct from (
       to_jsonb(old) - array['updated_at', 'normalized_json', 'warnings_json', 'action']
     )
  then
    return new;
  end if;

  raise exception 'IMPORT_ROW_PROTECTED_FIELDS' using errcode = '23514';
end;
$$;

drop trigger if exists import_rows_state_machine_guard on public.import_rows;
create trigger import_rows_state_machine_guard
before update on public.import_rows
for each row execute function app.guard_import_row_update();

comment on function app.guard_import_batch_update() is
  'M12 Phase 3: direct authenticated writes cannot forge/downgrade committed import state; D-131 cancellation and D-132 purge are one-way.';

comment on function app.guard_import_row_update() is
  'M12 Phase 3: protects import status/mappings, serializes commit with cancel, and blocks non-SA commit into closed years.';

create function public.confirm_import_duplicate(
  p_row_id uuid,
  p_action public.import_row_action
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.import_rows;
  v_batch_status public.import_batch_status;
  v_warnings jsonb;
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Keep the same row -> batch lock order used by guard_import_row_update.
  select row.*
    into v_row
    from public.import_rows as row
   where row.id = p_row_id
   for update;

  if v_row.id is null then
    raise exception 'IMPORT_ROW_NOT_FOUND' using errcode = 'P0002';
  end if;

  select batch.status
    into v_batch_status
    from public.import_batches as batch
   where batch.id = v_row.batch_id
   for update;

  if v_batch_status not in ('dry_run', 'partially_committed')
     or v_row.status not in ('valid', 'warning')
  then
    raise exception 'IMPORT_ROW_NOT_REVIEWABLE' using errcode = '23514';
  end if;

  if jsonb_typeof(coalesce(v_row.warnings_json, '[]'::jsonb)) <> 'array' then
    raise exception 'IMPORT_REVIEW_PAYLOAD_INVALID' using errcode = '23514';
  end if;

  if not jsonb_path_exists(
    coalesce(v_row.warnings_json, '[]'::jsonb),
    '$[*] ? (@.field == "duplicate_pending")'
  ) then
    raise exception 'IMPORT_DUPLICATE_NOT_PENDING' using errcode = '23514';
  end if;

  if p_action = 'merge' and v_row.matched_student_id is null then
    raise exception 'IMPORT_MERGE_TARGET_REQUIRED' using errcode = '23514';
  end if;

  select coalesce(
    jsonb_agg(
      case
        when warning.value ->> 'field' = 'duplicate_pending'
          then jsonb_set(warning.value, '{field}', to_jsonb('duplicate'::text), true)
        else warning.value
      end
      order by warning.position
    ),
    '[]'::jsonb
  )
    into v_warnings
    from jsonb_array_elements(v_row.warnings_json)
      with ordinality as warning(value, position);

  update public.import_rows
     set action = p_action,
         warnings_json = v_warnings
   where id = p_row_id;
end;
$$;

revoke all on function public.confirm_import_duplicate(uuid, public.import_row_action)
  from public, anon;
grant execute on function public.confirm_import_duplicate(uuid, public.import_row_action)
  to authenticated;

comment on function public.confirm_import_duplicate(uuid, public.import_row_action) is
  'M12/D-133 authoritative confirmation: locks one review row, records the chosen action, and resolves only its duplicate_pending marker.';

-- The original commit RPC was callable directly by every authenticated
-- global writer.  The Server Action checked unresolved duplicate decisions
-- and required gender, but a direct PostgREST RPC call skipped both checks.
-- Move the mutation body behind the private schema and expose a small wrapper
-- that locks the selected review rows before validating them.
alter function public.commit_import_rows(uuid, uuid[]) set schema app;
alter function app.commit_import_rows(uuid, uuid[]) rename to commit_import_rows_internal;

revoke all on function app.commit_import_rows_internal(uuid, uuid[])
  from public, anon, authenticated, service_role;

create function public.commit_import_rows(
  p_batch_id uuid,
  p_row_ids uuid[]
)
returns table (
  out_row_id uuid,
  out_row_number integer,
  out_committed boolean,
  out_student_id uuid,
  out_student_code text,
  out_error_message text,
  out_enrollment_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Serialize this precondition check with row review, cancellation and the
  -- internal commit.  The internal row trigger also locks the parent batch.
  perform 1
    from public.import_rows as row
   where row.batch_id = p_batch_id
     and row.id = any (p_row_ids)
     and row.status in ('valid', 'warning')
   order by row.row_number
   for update;

  if exists (
    select 1
      from public.import_rows as row
     where row.batch_id = p_batch_id
       and row.id = any (p_row_ids)
       and row.status in ('valid', 'warning')
       and jsonb_typeof(coalesce(row.warnings_json, '[]'::jsonb)) <> 'array'
  ) then
    raise exception 'IMPORT_REVIEW_PAYLOAD_INVALID' using errcode = '23514';
  end if;

  if exists (
    select 1
      from public.import_rows as row
     where row.batch_id = p_batch_id
       and row.id = any (p_row_ids)
       and row.status in ('valid', 'warning')
       and exists (
         select 1
           from jsonb_array_elements(coalesce(row.warnings_json, '[]'::jsonb)) as warning
          where warning ->> 'field' = 'duplicate_pending'
       )
  ) then
    raise exception 'IMPORT_DUPLICATE_REVIEW_REQUIRED' using errcode = '23514';
  end if;

  if exists (
    select 1
      from public.import_rows as row
     where row.batch_id = p_batch_id
       and row.id = any (p_row_ids)
       and row.status in ('valid', 'warning')
       and row.action = 'create'
       and coalesce(row.normalized_json ->> 'gender', '') not in ('male', 'female')
  ) then
    raise exception 'IMPORT_GENDER_REQUIRED' using errcode = '23514';
  end if;

  return query
  select *
    from app.commit_import_rows_internal(p_batch_id, p_row_ids);
end;
$$;

revoke all on function public.commit_import_rows(uuid, uuid[]) from public, anon;
grant execute on function public.commit_import_rows(uuid, uuid[])
  to authenticated, service_role;

comment on function app.commit_import_rows_internal(uuid, uuid[]) is
  'M12 Phase 3 private mutation body. Application roles must use the public review-enforcing wrapper.';

comment on function public.commit_import_rows(uuid, uuid[]) is
  'M12/D-133: locks selected staging rows and rejects unresolved duplicate decisions or missing create-gender before committing.';

-- D-132 contains sensitive source cells, so clearing child rows and recording
-- the batch marker must be one transaction. Direct table updates are rejected
-- by the two guards above; this owner-executed RPC is the only application path.
create function public.purge_import_raw_data(p_batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.import_batches;
  v_rows integer;
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Canonical lock order for every import mutation is child rows -> parent
  -- batch. This avoids purge-vs-review/commit deadlocks.
  perform 1
    from public.import_rows as row
   where row.batch_id = p_batch_id
   order by row.row_number
   for update;

  select *
    into v_batch
    from public.import_batches as batch
   where batch.id = p_batch_id
   for update;

  if v_batch.id is null then
    raise exception 'IMPORT_BATCH_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_batch.status = 'dry_run' then
    raise exception 'IMPORT_BATCH_NOT_PROCESSED' using errcode = '23514';
  end if;
  if v_batch.raw_purged_at is not null then
    raise exception 'IMPORT_RAW_ALREADY_PURGED' using errcode = '23514';
  end if;

  update public.import_rows
     set raw_json = '{}'::jsonb
   where batch_id = p_batch_id
     and raw_json <> '{}'::jsonb;
  get diagnostics v_rows = row_count;

  update public.import_batches
     set raw_purged_at = now(),
         raw_purged_by = auth.uid()
   where id = p_batch_id;

  return v_rows;
end;
$$;

revoke all on function public.purge_import_raw_data(uuid) from public, anon;
grant execute on function public.purge_import_raw_data(uuid)
  to authenticated, service_role;

comment on function public.purge_import_raw_data(uuid) is
  'M12/D-132: atomically clears sensitive import_rows.raw_json and stamps the retained batch trace.';
