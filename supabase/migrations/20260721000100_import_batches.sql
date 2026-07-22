-- P2-T4: Excel import staging (dry-run) and chunked commit.
-- Dry-run writes only to the staging tables below; business tables stay
-- untouched until commit_import_rows runs (docs/09 §2, §9).

create type public.import_batch_status as enum (
  'dry_run', 'partially_committed', 'committed', 'cancelled'
);
create type public.import_row_status as enum (
  'valid', 'warning', 'error', 'committed', 'skipped'
);
-- What the reviewing user decided for a row (docs/09 §5).
create type public.import_row_action as enum ('create', 'merge', 'skip');

-- 9.1 import_batches ---------------------------------------------------------
create table public.import_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  filename text not null check (btrim(filename) <> ''),
  -- Which sheet layout the rows were parsed from: our canonical template, the
  -- parish SYLL sheet, or the Chiên Con DS_dau_nam roster.
  source_format text not null default 'template'
    check (source_format in ('template', 'syll', 'ds_dau_nam')),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  uploaded_by uuid references public.profiles(id) on delete set null,
  status public.import_batch_status not null default 'dry_run',
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  warning_rows integer not null default 0 check (warning_rows >= 0),
  error_rows integer not null default 0 check (error_rows >= 0),
  committed_rows integer not null default 0 check (committed_rows >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  committed_at timestamptz,
  constraint import_batches_committed_at_matches_status
    check (status not in ('committed', 'partially_committed') or committed_at is not null)
);

create index import_batches_year_idx on public.import_batches (academic_year_id, created_at desc);
create index import_batches_uploader_idx on public.import_batches (uploaded_by);

create trigger import_batches_set_updated_at
before update on public.import_batches
for each row execute function app.set_updated_at();

-- 9.2 import_rows ------------------------------------------------------------
create table public.import_rows (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_json jsonb not null,
  normalized_json jsonb,
  status public.import_row_status not null default 'error',
  errors_json jsonb not null default '[]'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,
  -- Duplicate candidate found during dry-run; merge target when action='merge'.
  matched_student_id uuid references public.students(id) on delete set null,
  action public.import_row_action not null default 'create',
  created_student_id uuid references public.students(id) on delete set null,
  created_guardian_id uuid references public.guardians(id) on delete set null,
  commit_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_rows_merge_needs_target
    check (action <> 'merge' or matched_student_id is not null)
);

create unique index import_rows_batch_row_idx on public.import_rows (batch_id, row_number);
create index import_rows_batch_status_idx on public.import_rows (batch_id, status);

create trigger import_rows_set_updated_at
before update on public.import_rows
for each row execute function app.set_updated_at();

-- RLS ------------------------------------------------------------------------
-- Importing creates students/guardians/enrollments, so it is a global-write
-- operation only (docs/09 §9 "RLS không cho non-authorized import").
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

grant select, insert, update, delete on public.import_batches to authenticated;
grant select, insert, update, delete on public.import_rows to authenticated;
grant all on public.import_batches, public.import_rows to service_role;

create policy import_batches_select_global_write
on public.import_batches for select to authenticated
using (app.can_global_write());
create policy import_batches_insert_global_write
on public.import_batches for insert to authenticated
with check (app.can_global_write() and uploaded_by = auth.uid());
create policy import_batches_update_global_write
on public.import_batches for update to authenticated
using (app.can_global_write())
with check (app.can_global_write());
-- Staging data is disposable (docs/09 §6): the uploader may discard a batch.
create policy import_batches_delete_global_write
on public.import_batches for delete to authenticated
using (app.can_global_write());

create policy import_rows_select_global_write
on public.import_rows for select to authenticated
using (app.can_global_write());
create policy import_rows_insert_global_write
on public.import_rows for insert to authenticated
with check (app.can_global_write());
create policy import_rows_update_global_write
on public.import_rows for update to authenticated
using (app.can_global_write())
with check (app.can_global_write());
create policy import_rows_delete_global_write
on public.import_rows for delete to authenticated
using (app.can_global_write());

-- Commit ---------------------------------------------------------------------
-- Commits one chunk of reviewed rows. The caller loops over chunks so each call
-- is its own transaction (docs/09 §7: chunk of 100, per-chunk transaction, and
-- a row failure must never be ambiguous — it is recorded on the row itself).
create function public.commit_import_rows(
  p_batch_id uuid,
  p_row_ids uuid[]
)
-- OUT names are prefixed so they cannot collide with the column names used in
-- the queries below (row_number/student_id/status are all real columns here).
returns table (
  out_row_id uuid,
  out_row_number integer,
  out_committed boolean,
  out_student_id uuid,
  out_student_code text,
  out_error_message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.import_batches;
  v_row public.import_rows;
  v_norm jsonb;
  v_guardian_id uuid;
  v_student_id uuid;
  v_student_code text;
  v_class_id uuid;
  v_guardian_phone text;
  v_actor uuid := auth.uid();
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_batch from public.import_batches where id = p_batch_id;
  if v_batch.id is null then
    raise exception 'BATCH_NOT_FOUND' using errcode = '23503';
  end if;
  if v_batch.status = 'cancelled' then
    raise exception 'BATCH_CANCELLED' using errcode = '23514';
  end if;

  for v_row in
    select * from public.import_rows
    where batch_id = p_batch_id
      and id = any(p_row_ids)
      and status in ('valid', 'warning')
    order by row_number
    for update
  loop
    v_guardian_id := null;
    v_student_id := null;
    v_student_code := null;

    begin
      -- Skip decision is recorded, never written to business tables.
      if v_row.action = 'skip' then
        update public.import_rows
        set status = 'skipped', commit_error = null
        where id = v_row.id;
        out_row_id := v_row.id; out_row_number := v_row.row_number;
        out_committed := false; out_student_id := null; out_student_code := null;
        out_error_message := null;
        return next;
        continue;
      end if;

      v_norm := v_row.normalized_json;
      if v_norm is null then
        raise exception 'ROW_NOT_NORMALIZED';
      end if;

      v_class_id := nullif(v_norm ->> 'class_id', '')::uuid;
      if v_class_id is null then
        raise exception 'CLASS_NOT_RESOLVED';
      end if;

      if v_row.action = 'merge' then
        -- Reuse the existing student; only (re)open the enrollment.
        v_student_id := v_row.matched_student_id;
        select student_code::text into v_student_code
        from public.students where id = v_student_id;
        if v_student_code is null then
          raise exception 'MERGE_TARGET_MISSING';
        end if;
      else
        -- Guardian reuse by normalized phone (docs/09 §7).
        v_guardian_phone := nullif(v_norm ->> 'guardian_phone', '');
        if v_guardian_phone is null then
          raise exception 'GUARDIAN_PHONE_REQUIRED';
        end if;

        select id into v_guardian_id
        from public.guardians
        where phone = v_guardian_phone
        order by created_at
        limit 1;

        if v_guardian_id is null then
          insert into public.guardians (full_name, phone, address, updated_by)
          values (
            coalesce(nullif(v_norm ->> 'guardian_name', ''), 'Chưa rõ'),
            v_guardian_phone,
            nullif(v_norm ->> 'guardian_address', ''),
            v_actor
          )
          returning id into v_guardian_id;
        end if;

        -- student_code comes from the DB sequence default: no duplicates.
        insert into public.students (
          guardian_id, saint_name, full_name, gender, date_of_birth,
          patron_feast_date, address, phone, hardship_flag, general_notes, updated_by
        )
        values (
          v_guardian_id,
          coalesce(nullif(v_norm ->> 'saint_name', ''), 'Chưa'),
          v_norm ->> 'full_name',
          (v_norm ->> 'gender')::public.gender,
          (v_norm ->> 'date_of_birth')::date,
          nullif(v_norm ->> 'patron_feast_date', '')::date,
          nullif(v_norm ->> 'address', ''),
          nullif(v_norm ->> 'student_phone', ''),
          coalesce((v_norm ->> 'hardship_flag')::boolean, false),
          nullif(v_norm ->> 'general_notes', ''),
          v_actor
        )
        returning id, student_code::text into v_student_id, v_student_code;

        -- Optional sacraments parsed from the SYLL sheet.
        insert into public.student_sacraments (
          student_id, sacrament_type, sacrament_date, place, updated_by
        )
        select
          v_student_id,
          (sacrament ->> 'type')::public.sacrament_type,
          nullif(sacrament ->> 'date', '')::date,
          nullif(sacrament ->> 'place', ''),
          v_actor
        from jsonb_array_elements(coalesce(v_norm -> 'sacraments', '[]'::jsonb)) as sacrament
        on conflict do nothing;

        -- Optional health notes.
        if coalesce(nullif(v_norm ->> 'allergies', ''), nullif(v_norm ->> 'health_notes', '')) is not null then
          insert into public.student_health_profiles (
            student_id, allergies, emergency_notes, updated_by
          )
          values (
            v_student_id,
            nullif(v_norm ->> 'allergies', ''),
            nullif(v_norm ->> 'health_notes', ''),
            v_actor
          )
          on conflict (student_id) do nothing;
        end if;
      end if;

      -- Enrollment into the resolved class for the batch's year. A student who
      -- already has an open enrollment this year keeps it (D-11).
      insert into public.enrollments (
        student_id, academic_year_id, class_id, updated_by
      )
      values (v_student_id, v_batch.academic_year_id, v_class_id, v_actor)
      on conflict do nothing;

      update public.import_rows
      set status = 'committed',
          created_student_id = case when v_row.action = 'merge' then null else v_student_id end,
          created_guardian_id = v_guardian_id,
          commit_error = null
      where id = v_row.id;

      out_row_id := v_row.id; out_row_number := v_row.row_number;
      out_committed := true; out_student_id := v_student_id; out_student_code := v_student_code;
      out_error_message := null;
      return next;

    exception when others then
      -- Record the failure on the row; the surrounding chunk keeps its other
      -- rows so a single bad row is never silently lost.
      update public.import_rows
      set status = 'error',
          commit_error = sqlerrm,
          errors_json = v_row.errors_json || jsonb_build_array(
            jsonb_build_object('field', 'commit', 'message', sqlerrm)
          )
      where id = v_row.id;

      out_row_id := v_row.id; out_row_number := v_row.row_number;
      out_committed := false; out_student_id := null; out_student_code := null;
      out_error_message := sqlerrm;
      return next;
    end;
  end loop;

  -- Refresh batch counters from the rows themselves.
  update public.import_batches as batch
  set committed_rows = counts.committed_count,
      error_rows = counts.error_count,
      status = case
        -- Only fully committed when nothing is left pending AND nothing failed;
        -- a leftover error must stay visible as partially_committed (docs/09 §7).
        when counts.pending_count = 0 and counts.error_count = 0 and counts.committed_count > 0
          then 'committed'
        when counts.committed_count > 0 then 'partially_committed'
        else batch.status
      end,
      committed_at = case
        when counts.committed_count > 0 then coalesce(batch.committed_at, now())
        else batch.committed_at
      end
  from (
    select
      count(*) filter (where status = 'committed') as committed_count,
      count(*) filter (where status = 'error') as error_count,
      count(*) filter (where status in ('valid', 'warning')) as pending_count
    from public.import_rows where batch_id = p_batch_id
  ) as counts
  where batch.id = p_batch_id;

  return;
end;
$$;

revoke all on function public.commit_import_rows(uuid, uuid[]) from public, anon;
grant execute on function public.commit_import_rows(uuid, uuid[]) to authenticated, service_role;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.import_batches is 'Excel import staging batch; dry-run never touches business tables.';
comment on table public.import_rows is 'Per-row import staging with errors/warnings and the reviewer decision.';
comment on function public.commit_import_rows(uuid, uuid[]) is 'Commits one reviewed chunk; per-row failure is recorded on the row.';
