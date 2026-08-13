-- M12-C — TO-BE 6 / BR-M12-39 / AC-24.
--
-- 🔴 Vấn đề đang sửa (mục 4.5 của `03_AUDIT_RESULTS`): dòng báo **"đã ghi"**
-- trong khi việc quan trọng nhất của nó **không xảy ra**. `commit_import_rows`
-- ghi danh bằng `insert … on conflict do nothing`, mà `enrollments` có unique
-- index *một ghi danh đang mở / một em / một năm học* (D-11). Nên khi em đã có
-- lớp trong năm nay, lệnh insert **im lặng không làm gì**, dòng vẫn thành
-- `committed`, và người nhập tin rằng em đã được xếp vào lớp ghi trong file.
--
-- Tình huống này không hiếm mà là **đường đi thường gặp nhất**: nhập lại sổ đầu
-- năm sau khi sửa vài dòng, hoặc một em được ghi trong sổ của hai lớp. Hậu quả
-- đo được: sĩ số lớp mới thiếu người, Giáo lý viên lớp mới không thấy em, và
-- không có một dòng chữ nào ở bất kỳ đâu nói vì sao.
--
-- Cách chữa: `returning id into v_enrollment_id`. Không có id trả về nghĩa là
-- ghi danh **không được tạo** ⇒ (1) dòng **vẫn** `committed` — hồ sơ em đã thật
-- sự được tạo hoặc ghép, nói là lỗi thì sai; (2) một **cảnh báo** được ghi lên
-- chính dòng đó, nêu **tên lớp em đang học**; (3) cột trả về mới
-- `out_enrollment_created` để lượt ghi đếm riêng con số này.
--
-- ⚠️ **Đổi kiểu trả về bắt buộc `drop function` rồi tạo lại** (`create or
-- replace` không đổi được `returns table`), nên **phải cấp lại `grant execute`**.
-- `07_IMPLEMENTATION_IMPACT` §2.3 xếp đây là rủi ro **trung bình** vì quên
-- `grant` là **gãy toàn bộ import** cho mọi người dùng thường, mà triệu chứng
-- lại giống hệt lỗi RLS. Hai dòng `revoke`/`grant` ở cuối file là chốt chặn đó.
-- Rollback: chạy lại nguyên văn định nghĩa cũ ở
-- `20260721000100_import_batches.sql:116-340`.
--
-- Không đụng một dòng dữ liệu nào: không thêm/xoá/đổi cột của bảng nào,
-- không đổi policy nào. Dòng đã `committed` từ trước giữ nguyên trạng thái.

drop function if exists public.commit_import_rows(uuid, uuid[]);

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
  v_enrollment_id uuid;
  v_open_class_id uuid;
  v_open_class_name text;
  v_warnings jsonb;
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

-- 🔴 KHÔNG ĐƯỢC BỎ HAI DÒNG NÀY. `drop function` mang theo mọi quyền đã cấp cho
-- hàm cũ; thiếu `grant` thì chỉ `service_role` còn gọi được, và mọi người dùng
-- thật nhận đúng một lỗi 42501 trông hệt như lỗi RLS.
revoke all on function public.commit_import_rows(uuid, uuid[]) from public, anon;
grant execute on function public.commit_import_rows(uuid, uuid[]) to authenticated, service_role;

comment on function public.commit_import_rows(uuid, uuid[]) is
  'M12-C/TO-BE 6: trả thêm out_enrollment_created. False = em đã có ghi danh đang mở nên lớp trong file không được áp dụng; dòng vẫn committed và mang cảnh báo field=enrollment.';
