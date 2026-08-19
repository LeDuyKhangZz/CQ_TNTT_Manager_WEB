-- ============================================================================
-- IMP-BULK-002 · Nhập hàng loạt: CHỈ Quản trị viên, và hồ sơ THIẾU vẫn nhập được
--
-- Chủ dự án ra hai quyết định ngày 2026-08-19, cùng đảo lại hai giả định mà cả
-- module nhập liệu đang dựa vào:
--
-- 1. **Chỉ Super Admin được nhập hàng loạt.** Trước đợt này cả `/imports` lẫn
--    `/staff/bulk` mở cho bốn vai trò ghi-toàn-xứ-đoàn (`app.can_global_write()`:
--    Super Admin · Xứ đoàn trưởng · Phó · Thư ký). Một lượt dán tạo hàng trăm hồ
--    sơ và ghi danh trong một cú bấm, nên chủ dự án thu về đúng một người.
--    Hàng rào ứng dụng nằm ở `ROUTE_RULES` + `IMPORT_ROLES`; file này là hàng rào
--    thứ hai, ở ranh giới cơ sở dữ liệu, cho đường gọi thẳng Data API/RPC.
--
--    ⚠️ Phạm vi cố ý hẹp: chỉ `import_batches` · `import_rows` và hai RPC của
--    module nhập. **KHÔNG** siết `students`/`guardians`/`staff_profiles`/
--    `class_staff_assignments` — bốn vai trò kia vẫn phải tạo/sửa từng hồ sơ một
--    ở các màn hình thường (`docs/05` §3). Siết `app.can_global_write()` sẽ phá
--    đúng những màn hình đó.
--
-- 2. **Thiếu thông tin thì kệ, vẫn cho nhập.** Sổ giấy của giáo xứ không bao giờ
--    đủ: 229/593 thiếu nhi thiếu ngày sinh hoặc số điện thoại phụ huynh, 48/117
--    nhân sự thiếu số điện thoại (cả 16 người Ban Trợ tá). Luật cũ chặn từng dòng
--    ⇒ những người đó **không tồn tại trong hệ thống**, tức không điểm danh được,
--    không vào sổ lớp được. Chọn ngược lại: nhận hết, và đánh dấu chỗ còn thiếu
--    để người có tài khoản tự bổ sung sau (`v_incomplete_student_profiles`).
--
--    Bốn ràng buộc được nới, đều là NOT NULL trên cột dữ liệu **của con người**:
--      · `staff_profiles.phone`   — nhân sự chưa cho số
--      · `guardians.phone`        — sổ ghi tên cha/mẹ mà không có số
--      · `students.gender`        — sổ SYLL của giáo xứ không có cột giới tính
--      · `students.date_of_birth` — sổ lên lớp nhiều em chỉ có tên
--      · `students.guardian_id`   — không có cả tên lẫn số của phụ huynh
--
--    KHÔNG nới `full_name` (không tên thì không phải một người) và KHÔNG nới
--    `saint_name` (đã có đường riêng: sổ ghi "Chưa" ⇒ hàm ghi 'Chưa').
--
-- Data impact: **0 backfill, 0 dòng bị sửa.** Nới NOT NULL không đụng dữ liệu cũ;
-- mọi hồ sơ đang có vẫn đủ ba trường đó. Rollback = đặt lại NOT NULL, nhưng chỉ
-- chạy được nếu chưa có hồ sơ thiếu nào được nhập sau đợt này.
-- ============================================================================

-- ── 1. Quyền: module nhập hàng loạt chỉ còn Super Admin ─────────────────────
-- Giữ nguyên MỌI điều kiện khác của từng policy (trạng thái máy của D-131/D-132
-- và hàng rào năm học ở 20260813000300) — chỉ đổi vế vai trò.

drop policy if exists import_batches_select_global_write on public.import_batches;
create policy import_batches_select_super_admin
on public.import_batches for select to authenticated
using (app.is_super_admin());

drop policy if exists import_batches_insert_global_write on public.import_batches;
create policy import_batches_insert_super_admin
on public.import_batches for insert to authenticated
with check (
  app.is_super_admin()
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

drop policy if exists import_batches_update_global_write on public.import_batches;
create policy import_batches_update_super_admin
on public.import_batches for update to authenticated
using (app.is_super_admin())
with check (
  app.is_super_admin()
  and (status <> 'cancelled' or committed_rows = 0)
);

drop policy if exists import_rows_select_global_write on public.import_rows;
create policy import_rows_select_super_admin
on public.import_rows for select to authenticated
using (app.is_super_admin());

drop policy if exists import_rows_insert_global_write on public.import_rows;
create policy import_rows_insert_super_admin
on public.import_rows for insert to authenticated
with check (
  app.is_super_admin()
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

drop policy if exists import_rows_update_global_write on public.import_rows;
create policy import_rows_update_super_admin
on public.import_rows for update to authenticated
using (app.is_super_admin())
with check (app.is_super_admin());

comment on policy import_batches_insert_super_admin on public.import_batches is
  'IMP-BULK-002: nhập hàng loạt là việc của riêng Super Admin; mọi hàng rào trạng thái/năm học của 20260813000300 giữ nguyên.';

-- ── 2. Nới NOT NULL trên năm cột dữ liệu con người ──────────────────────────
-- Tên CHECK là tên Postgres tự sinh cho ràng buộc viết inline ở migration gốc
-- (`<bảng>_<cột>_check`). Dựng lại dạng "null thì thôi, có thì không được rỗng":
-- một chuỗi trắng vẫn là dữ liệu rác, còn NULL nay là câu trả lời hợp lệ cho
-- "chưa biết".

alter table public.staff_profiles alter column phone drop not null;
alter table public.staff_profiles drop constraint if exists staff_profiles_phone_check;
alter table public.staff_profiles
  add constraint staff_profiles_phone_check
  check (phone is null or btrim(phone) <> '');

alter table public.guardians alter column phone drop not null;
alter table public.guardians drop constraint if exists guardians_phone_check;
alter table public.guardians
  add constraint guardians_phone_check
  check (phone is null or btrim(phone) <> '');

alter table public.students alter column gender drop not null;
alter table public.students alter column date_of_birth drop not null;
alter table public.students alter column guardian_id drop not null;

comment on column public.staff_profiles.phone is
  'IMP-BULK-002: cho phép trống. Tài khoản nhân sự đăng nhập bằng staff_code nên người chưa có số vẫn cấp được tài khoản và tự bổ sung.';
comment on column public.guardians.phone is
  'IMP-BULK-002: cho phép trống. 🔴 Phụ huynh KHÔNG có số thì KHÔNG cấp được tài khoản — username phụ huynh chính là số điện thoại.';
comment on column public.students.guardian_id is
  'IMP-BULK-002: cho phép trống khi sổ không có cả tên lẫn số của cha/mẹ. Ghi danh, điểm danh và điểm số không phụ thuộc cột này.';

-- ── 3. commit_import_rows_internal: nhận dòng thiếu dữ liệu ─────────────────
-- Chép nguyên bản 20260803000100 rồi sửa đúng ba chỗ: hàng rào vai trò, khối
-- phụ huynh, và hai lượt cast giới tính/ngày sinh. Mọi thứ còn lại — vòng lặp
-- theo dòng, nhánh `merge`, bí tích, hồ sơ sức khoẻ, cảnh báo ghi danh của
-- TO-BE 6, bộ đếm cuối hàm — giữ y nguyên.
create or replace function app.commit_import_rows_internal(
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
  out_error_message text,
  -- TO-BE 6: false khi em đã có ghi danh đang mở, tức lớp trong file KHÔNG được
  -- áp dụng. Dòng vẫn `committed`; đây là hai chuyện khác nhau.
  out_enrollment_created boolean
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
  v_guardian_name text;
  v_enrollment_id uuid;
  v_open_class_id uuid;
  v_open_class_name text;
  v_warnings jsonb;
  v_actor uuid := auth.uid();
begin
  if not app.is_super_admin() then
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
    -- Phải đặt lại mỗi vòng: giá trị sót của dòng trước sẽ biến một ghi danh
    -- KHÔNG được tạo thành một ghi danh báo là đã tạo.
    v_enrollment_id := null;
    v_open_class_id := null;
    v_open_class_name := null;

    begin
      -- Skip decision is recorded, never written to business tables.
      if v_row.action = 'skip' then
        update public.import_rows
        set status = 'skipped', commit_error = null
        where id = v_row.id;
        out_row_id := v_row.id; out_row_number := v_row.row_number;
        out_committed := false; out_student_id := null; out_student_code := null;
        out_error_message := null; out_enrollment_created := false;
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
        --
        -- IMP-BULK-002 — ba trường hợp, không còn trường hợp nào là lỗi:
        --   có số            ⇒ dùng lại phụ huynh cùng số, chưa có thì tạo mới;
        --   chỉ có tên       ⇒ tạo hồ sơ phụ huynh KHÔNG số (điền số sau);
        --   không có gì cả   ⇒ em không gắn phụ huynh nào (`guardian_id` NULL).
        -- Ghép theo số là ghép theo DANH TÍNH; hai hồ sơ "Chưa rõ" không số thì
        -- không có cách nào biết là một người, nên không bao giờ ghép chúng.
        v_guardian_phone := nullif(v_norm ->> 'guardian_phone', '');
        v_guardian_name := nullif(v_norm ->> 'guardian_name', '');

        if v_guardian_phone is not null then
          select id into v_guardian_id
          from public.guardians
          where phone = v_guardian_phone
          order by created_at
          limit 1;
        end if;

        if v_guardian_id is null
           and (v_guardian_phone is not null or v_guardian_name is not null)
        then
          insert into public.guardians (full_name, phone, address, updated_by)
          values (
            coalesce(v_guardian_name, 'Chưa rõ'),
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
          -- `nullif` chứ không cast thẳng: một ô trống trong khối dán về tới
          -- đây là chuỗi rỗng, mà cast chuỗi rỗng sang enum/date là lỗi cú pháp
          -- kiểu — đúng dòng dữ liệu mà đợt này muốn nhận được lại.
          nullif(v_norm ->> 'gender', '')::public.gender,
          nullif(v_norm ->> 'date_of_birth', '')::date,
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
      -- already has an open enrollment this year keeps it (D-11) — và TỪ ĐỢT NÀY
      -- việc đó được nói ra thay vì bỏ qua trong im lặng.
      insert into public.enrollments (
        student_id, academic_year_id, class_id, updated_by
      )
      values (v_student_id, v_batch.academic_year_id, v_class_id, v_actor)
      on conflict do nothing
      returning id into v_enrollment_id;

      v_warnings := coalesce(v_row.warnings_json, '[]'::jsonb);

      if v_enrollment_id is null then
        -- Ghi danh đang mở của em, để câu cảnh báo nêu ĐÚNG TÊN LỚP em đang học.
        -- Nói "lớp khác" mà không nói lớp nào là bắt người nhập đi tra tay từng em.
        select e.class_id, c.display_name
        into v_open_class_id, v_open_class_name
        from public.enrollments as e
        join public.classes as c on c.id = e.class_id
        where e.student_id = v_student_id
          and e.academic_year_id = v_batch.academic_year_id
          and e.status in ('active', 'paused')
        limit 1;

        -- Chỉ thêm một lần: ghi lại lần hai sẽ dựng ra một mảng cảnh báo dài dần.
        if not (v_warnings @> jsonb_build_array(jsonb_build_object('field', 'enrollment'))) then
          v_warnings := v_warnings || jsonb_build_array(
            jsonb_build_object(
              'field', 'enrollment',
              'message',
              case
                when v_open_class_id is not distinct from v_class_id then
                  'Em đã có ghi danh đang mở ở đúng lớp này, nên hệ thống không tạo thêm ghi danh mới.'
                else
                  'Em đã có ghi danh đang mở ở lớp khác trong năm học này; lớp không được thay đổi. '
                  || 'Em đang ở lớp ' || coalesce(v_open_class_name, 'không xác định')
                  || '; muốn chuyển lớp thì làm ở trang Lớp học.'
              end
            )
          );
        end if;
      end if;

      update public.import_rows
      set status = 'committed',
          created_student_id = case when v_row.action = 'merge' then null else v_student_id end,
          created_guardian_id = v_guardian_id,
          warnings_json = v_warnings,
          commit_error = null
      where id = v_row.id;

      out_row_id := v_row.id; out_row_number := v_row.row_number;
      out_committed := true; out_student_id := v_student_id; out_student_code := v_student_code;
      out_error_message := null;
      out_enrollment_created := v_enrollment_id is not null;
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
      out_error_message := sqlerrm; out_enrollment_created := false;
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

comment on function app.commit_import_rows_internal(uuid, uuid[]) is
  'IMP-BULK-002: hồ sơ thiếu giới tính/ngày sinh/phụ huynh vẫn ghi được; chỉ Super Admin gọi được (qua wrapper public.commit_import_rows).';

-- ── 4. Wrapper public.commit_import_rows: bỏ hàng rào giới tính ─────────────
create or replace function public.commit_import_rows(
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
  if not app.is_super_admin() then
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

  -- 🔴 IMP-BULK-002 GỠ hàng rào IMPORT_GENDER_REQUIRED ở đây, không phải quên.
  -- Nó có từ 20260813000300 vì `students.gender` là NOT NULL, nên một lượt gọi
  -- RPC thẳng qua PostgREST sẽ đâm vào lỗi NOT NULL khó đọc. Cột nay cho phép
  -- trống ⇒ giữ nó lại chính là chặn đúng thứ chủ dự án bảo phải nhận.
  -- Hai hàng rào còn lại (payload hợp lệ · trùng chưa quyết) KHÔNG đụng tới.

  return query
  select *
    from app.commit_import_rows_internal(p_batch_id, p_row_ids);
end;
$$;
-- ── 5. confirm_import_duplicate: cùng một cánh cửa ──────────────────────────
-- Hàm này `security definer` nên nó tự đi vòng qua RLS; hàng rào vai trò bên
-- trong là thứ duy nhất chặn được người ngoài, và nó phải khớp policy ở §1.
-- `create or replace` giữ nguyên grant đã cấp; thân hàm chép nguyên bản
-- 20260813000300, đổi đúng một dòng.
create or replace function public.confirm_import_duplicate(
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
  if not app.is_super_admin() then
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

-- ── 6. Ai còn thiếu gì — nguồn cho lời nhắc tự bổ sung hồ sơ ────────────────
--
-- View cũ (20260723000500) chỉ soi ba thứ **tuỳ chọn**: SĐT phụ huynh, ngày bổn
-- mạng, địa chỉ. Từ đợt này ba thứ **bắt buộc cũ** cũng có thể trống, nên chúng
-- phải nằm trong cùng một danh sách — nếu không thì đúng những hồ sơ thiếu nhất
-- lại là những hồ sơ không ai nhắc.
--
-- 🔴 `missing_guardian` đọc `student.guardian_id`, KHÔNG đọc `guardian.id` sau
-- LEFT JOIN. Lý do là bài học ghi ngay trong view cũ: Giáo lý viên lớp không đọc
-- được bảng `guardians`, nên join trả NULL vì **thiếu quyền** chứ không phải vì
-- **thiếu dữ liệu**. Cột `guardian_id` nằm trên chính hàng thiếu nhi mà họ đọc
-- được, nên nó phân biệt đúng hai chuyện đó.
--
-- Cột mới nằm ở CUỐI danh sách: `create or replace view` chỉ cho nối thêm cột
-- vào đuôi; đổi thứ tự là phải drop view và drop mọi thứ phụ thuộc nó.
create or replace view public.v_incomplete_student_profiles
with (security_invoker = true) as
select
  student.id as student_id,
  student.saint_name,
  student.full_name,
  guardian.id is not null and (guardian.phone is null or btrim(guardian.phone) = '')
    as missing_guardian_phone,
  student.patron_feast_date is null as missing_patron_feast,
  student.address is null or btrim(student.address) = '' as missing_address,
  student.gender is null as missing_gender,
  student.date_of_birth is null as missing_date_of_birth,
  student.guardian_id is null as missing_guardian
from public.students as student
left join public.guardians as guardian on guardian.id = student.guardian_id
where student.status = 'active'
  and (
    (guardian.id is not null and (guardian.phone is null or btrim(guardian.phone) = ''))
    or student.patron_feast_date is null
    or student.address is null or btrim(student.address) = ''
    or student.gender is null
    or student.date_of_birth is null
    or student.guardian_id is null
  );

comment on view public.v_incomplete_student_profiles is
  'IMP-BULK-002: hồ sơ thiếu nhi còn thiếu dữ liệu, kể cả ba trường trước đây bắt buộc (giới tính, ngày sinh, phụ huynh).';

-- ── 7. Nhân sự tự bổ sung hồ sơ của chính mình ──────────────────────────────
--
-- Nới NOT NULL mà không mở đường tự điền thì lời hứa "có tài khoản rồi tự nhập
-- lại đầy đủ" không có chỗ nào thực hiện được: `staff_profiles_update_global_write`
-- chỉ cho bốn vai trò ghi-toàn-xứ-đoàn sửa hồ sơ, nên một Giáo lý viên lớp thiếu
-- số điện thoại phải đi nhờ Thư ký — đúng cái vòng mà đợt này muốn cắt.
--
-- Phạm vi hẹp đúng bằng một người và bốn cột. `staff_code` · `title` ·
-- `formation_level` · `service_status` · `profile_id` KHÔNG nằm trong đó: cấp
-- bậc và tình trạng phục vụ là quyết định của Ban Điều hành, không phải của
-- đương sự. Trigger dưới đây là chốt chặn thật, `with check` của policy chỉ
-- chọn được hàng chứ không so được từng cột với giá trị cũ.
--
-- 🔴 **KHÔNG `security definer`** — và đó là điều kiện để hàm này chạy đúng.
-- Trong một hàm `security definer`, `current_user` là **chủ sở hữu hàm**, nên
-- phép so ngay dưới luôn đúng và hàng rào biến thành một câu `return new` vô
-- nghĩa (đã đo: bài 20/21 của `056` bắt được, "caught: no exception"). Cùng
-- khuôn với `app.guard_import_row_update` của 20260813000300, vốn dựa vào đúng
-- phép so này. Hàm chỉ đọc `app.can_global_write()` (đã cấp cho `authenticated`)
-- nên không cần quyền cao hơn người gọi.
create or replace function app.guard_staff_self_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Chỉ soi lượt ghi đến từ một PHIÊN NGƯỜI DÙNG. `service_role` (cấp tài
  -- khoản, seed, bảo trì) và các hàm `security definer` chạy dưới role chủ sở
  -- hữu đi thẳng — không có dòng này thì `provisionAccountForStaff` gắn
  -- `profile_id` bằng khoá service sẽ đâm vào chính hàng rào bên dưới.
  if current_user <> 'authenticated' then
    return new;
  end if;

  -- Người có quyền ghi toàn xứ đoàn đi cửa cũ, không qua hàng rào bốn cột.
  if app.can_global_write() then
    return new;
  end if;

  if (
    to_jsonb(new) - array['updated_at', 'updated_by', 'phone', 'email', 'address', 'date_of_birth']
  ) is distinct from (
    to_jsonb(old) - array['updated_at', 'updated_by', 'phone', 'email', 'address', 'date_of_birth']
  ) then
    raise exception 'STAFF_SELF_UPDATE_FIELDS' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists staff_profiles_self_update_guard on public.staff_profiles;
create trigger staff_profiles_self_update_guard
before update on public.staff_profiles
for each row execute function app.guard_staff_self_update();

drop policy if exists staff_profiles_update_self on public.staff_profiles;
create policy staff_profiles_update_self
on public.staff_profiles for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

comment on function app.guard_staff_self_update() is
  'IMP-BULK-002: người không có quyền ghi toàn xứ đoàn chỉ sửa được bốn cột liên lạc trên hồ sơ của chính mình.';
comment on policy staff_profiles_update_self on public.staff_profiles is
  'IMP-BULK-002: nhân sự tự bổ sung SĐT/email/địa chỉ/ngày sinh còn thiếu sau lượt nhập hàng loạt.';
