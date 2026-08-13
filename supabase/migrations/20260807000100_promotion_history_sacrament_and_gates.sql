-- ============================================================================
-- M08-B — module Chuyển lớp, đợt 2/3. **Đợt CÓ MIGRATION của module.**
--
-- Năm việc, và chúng đan vào nhau nhiều hơn vẻ ngoài:
--
--   1. D-161 / BR-M08-X1 — cảnh báo bí tích ở lớp cuối ngành. Cột cờ
--      `grade_levels.requires_sacrament_review` được seed từ Phase 2 và
--      `04_SYSTEM_WIDE_FINDINGS` xếp nó vào nhóm *"đã seed, KHÔNG AI ĐỌC"*.
--   2. D-157 / BR-M08-19 — nhật ký quyết định. Gửi lại một đề xuất bị từ chối
--      đang **ghi đè sạch** ai từ chối, lúc nào, vì sao.
--   3. D-160 / nợ #18 — năm học đã đóng vẫn đề xuất và duyệt chuyển lớp được.
--   4. D-162 / BR-M08-20 — bịt đường vòng đóng ghi danh ở `/classes/[classId]`.
--   5. D-159 / BR-M08-Y1 — một RPC "chuyển lớp thẳng" cho cấp xứ đoàn.
--
-- 🔴 **Ba việc SAU đan vào nhau, và thứ tự các lệnh trong `approve_promotion_review`
-- là chỗ dễ chết nhất của cả file.** Xem khối "QUẢ MÌN" ở mục 5.
--
-- **0 thay đổi phân quyền. 0 `alter table` trên bảng cũ. 0 dòng dữ liệu bị đụng.**
-- Bảng mới có mặc định rỗng nên không cần backfill; hai RPC cũ được
-- `create or replace` nên **không** đổi chữ ký ⇒ `grant` cũ (`…promotions.sql:344-347`)
-- vẫn đứng nguyên, đúng cảnh báo `07_IMPLEMENTATION_IMPACT` §2.3.
-- ============================================================================

-- ── 1 · D-161 — BÍ TÍCH LỚP CUỐI NGÀNH ──────────────────────────────────────
--
-- `docs/03` WF-11 đòi *"chỉ lớp cuối ngành xét điều kiện bí tích"* nhưng **không
-- nói xét bí tích nào**; `07_IMPLEMENTATION_IMPACT` §3 ghi thẳng *"cần user xác
-- nhận quy tắc chính xác"*. Chủ dự án chốt **D-156 (2026-08-06)** danh sách theo
-- ngành, rồi chốt tiếp **D-161 (2026-08-07)** cách hiểu vế cuối của D-156:
--
--   · Chiên Con 2  → Rửa Tội
--   · Ấu 3         → Xưng tội lần đầu + Rước lễ lần đầu   (KHÔNG nhắc lại Rửa Tội)
--   · Thiếu 3      → Thêm Sức                              (KHÔNG nhắc lại ba cái trước)
--   · Nghĩa 3      → không có bí tích mới ⇒ nhắc lại **tất cả** của ba ngành trước
--   · Hiệp 2       → như Nghĩa 3
--
-- Tức: **cấp cuối của một ngành xét đúng bí tích RIÊNG của ngành đó; ngành nào
-- không có bí tích riêng thì mới nhắc lại những cái còn thiếu của các ngành trước.**
--
-- 🔴 Vì sao bảng ánh xạ ngành→bí tích nằm ở đây chứ không thành một cột mới của
-- `public.sectors`: `sectors` và `grade_levels` là **danh mục tham chiếu bất biến**
-- của M02 — một module đã đóng — và `20260725000100_reference_catalog.sql` vừa
-- chuyển chúng vào migration đúng vì chúng là *"quyết định nghiệp vụ đã chốt"*.
-- Thêm một cột vào đó nghĩa là luật của M08 sống trong bảng của M02 và mọi lượt
-- sửa luật về sau phải đi qua hai module. Hàm dưới đây đứng trong schema `app`,
-- `create or replace` được, và **không đụng một dòng dữ liệu nào**.
create function app.sector_own_sacraments(p_sector_code text)
returns public.sacrament_type[]
language sql
immutable
set search_path = ''
as $$
  select case p_sector_code
    when 'CHIEN_CON' then array['baptism']::public.sacrament_type[]
    when 'AU_NHI' then array['first_confession', 'first_communion']::public.sacrament_type[]
    when 'THIEU_NHI' then array['confirmation']::public.sacrament_type[]
    -- Nghĩa Sĩ và Hiệp Sĩ: không có bí tích riêng (D-156).
    else '{}'::public.sacrament_type[]
  end
$$;

comment on function app.sector_own_sacraments(text) is
  'D-156: bí tích RIÊNG của từng ngành. Nghĩa Sĩ/Hiệp Sĩ trả mảng rỗng — đó là '
  'điều kiện để app.required_sacraments_for_grade nhắc lại các ngành trước.';

-- Danh sách bí tích mà một **cấp** phải xét. Trả mảng rỗng cho mọi cấp không
-- phải cấp cuối ngành (AC-17), và cho cả `p_grade_level_id is null` — lớp Dự
-- trưởng không có `grade_level_id`.
create function app.required_sacraments_for_grade(p_grade_level_id uuid)
returns public.sacrament_type[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  needs_review boolean;
  sector_code text;
  sector_order integer;
  own_list public.sacrament_type[];
  inherited_list public.sacrament_type[];
begin
  select level.requires_sacrament_review, sector.code, sector.sort_order
    into needs_review, sector_code, sector_order
  from public.grade_levels as level
  join public.sectors as sector on sector.id = level.sector_id
  where level.id = p_grade_level_id;

  -- BR-M08-17: chỉ tính khi `requires_sacrament_review = true`.
  if not coalesce(needs_review, false) then
    return '{}'::public.sacrament_type[];
  end if;

  own_list := app.sector_own_sacraments(sector_code);
  if coalesce(array_length(own_list, 1), 0) > 0 then
    return own_list;
  end if;

  -- D-161 vế hai: ngành không có bí tích riêng thì gom của **mọi** ngành trước nó.
  select coalesce(array_agg(distinct item order by item), '{}'::public.sacrament_type[])
    into inherited_list
  from public.sectors as previous
  cross join lateral unnest(app.sector_own_sacraments(previous.code)) as item
  where previous.sort_order < sector_order;
  return inherited_list;
end;
$$;

comment on function app.required_sacraments_for_grade(uuid) is
  'BR-M08-17/D-161: bí tích phải xét ở một cấp. Rỗng với mọi cấp không phải cấp '
  'cuối ngành và với lớp Dự trưởng (grade_level_id null).';

-- Bí tích còn thiếu của một em ở một cấp.
--
-- 🔴 `security definer` là **có chủ đích**, và nó KHÔNG nới quyền đọc: hàm trả về
-- đúng **tên loại bí tích còn thiếu**, không trả ngày, không trả nơi, không trả
-- một dòng nào của `student_sacraments`. Đó là điều `04_TO_BE_FLOWS` TO-BE 3 mục
-- "Permission" đòi — *"snapshot chỉ chứa cờ boolean, không chứa ngày/nơi ⇒ không
-- rò rỉ"*. Đường gọi duy nhất là `propose_promotion`, vốn đã kiểm
-- `app.can_manage_promotion` trước đó.
create function app.missing_sacraments_for_student(
  p_student_id uuid,
  p_grade_level_id uuid
)
returns public.sacrament_type[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  required_list public.sacrament_type[];
  missing_list public.sacrament_type[];
begin
  required_list := app.required_sacraments_for_grade(p_grade_level_id);
  if coalesce(array_length(required_list, 1), 0) = 0 then
    return '{}'::public.sacrament_type[];
  end if;

  select coalesce(array_agg(item order by item), '{}'::public.sacrament_type[])
    into missing_list
  from unnest(required_list) as item
  where not exists (
    select 1 from public.student_sacraments as record
    where record.student_id = p_student_id
      and record.sacrament_type = item
  );
  return missing_list;
end;
$$;

comment on function app.missing_sacraments_for_student(uuid, uuid) is
  'D-161: tên loại bí tích còn thiếu, KHÔNG kèm ngày/nơi. Định nghĩa để đưa vào '
  'warning_snapshot mà không nới quyền đọc dữ liệu nhạy cảm.';

-- ── 2 · D-157 — NHẬT KÝ QUYẾT ĐỊNH ──────────────────────────────────────────
--
-- `03_AUDIT_RESULTS` §4.3 truy đúng gốc rễ: *"yêu cầu idempotency được hiểu là
-- yêu cầu ghi đè; không tách trạng thái hiện tại khỏi nhật ký quyết định"*.
-- `on conflict do update` (`…promotions.sql:207-221`) đặt `reviewed_by`,
-- `reviewed_at`, `review_note` về `null` mỗi lần gửi lại ⇒ *"Trưởng ngành A đã từ
-- chối ngày … vì …"* biến mất **không để lại dấu vết nào**.
--
-- `04_TO_BE_FLOWS` TO-BE 4 khuyến nghị **phương án A** (cột `history jsonb` trên
-- chính hàng review). **Chủ dự án chốt phương án B (D-157, 2026-08-06):** bảng
-- riêng chỉ-ghi-thêm — cùng khuôn `leaderboard_snapshots` (D-155/M07-C) và
-- `account_audit_events` (D-65/M01-A), và cùng một lý do: lịch sử nằm chung dòng
-- với trạng thái hiện tại thì không tách ra báo cáo được, và mọi lượt `update`
-- hàng review đều là một cơ hội ghi đè lịch sử.
--
-- 🔴 Ghi **mọi** bước quyết định chứ không chỉ bước bị ghi đè. Ghi đúng lúc từ
-- chối thì AC-18 xanh mà không phải đoán *"cái gì sắp bị mất"* ngay trước một
-- lệnh `upsert` — thứ chỉ đúng cho tới lần đầu ai đó đổi mệnh đề `do update`.
create table public.promotion_review_events (
  id uuid primary key default extensions.gen_random_uuid(),
  review_id uuid not null references public.promotion_reviews(id) on delete restrict,
  source_enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  source_class_id uuid not null references public.classes(id) on delete restrict,
  source_academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  event_no smallint not null check (event_no >= 1),
  event_type text not null check (event_type in ('proposed', 'approved', 'rejected')),
  proposed_status public.promotion_status not null,
  propose_trainee boolean not null default false,
  target_class_id uuid references public.classes(id) on delete restrict,
  note text check (note is null or char_length(note) <= 1000),
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  unique (review_id, event_no)
);

create index promotion_review_events_scope_idx
on public.promotion_review_events (source_class_id, review_id, event_no desc);

-- Append-only tuyệt đối. Chặn ở tầng trigger nên luật đứng độc lập với mọi
-- `grant`, kể cả `service_role` — một bản lịch sử sửa được thì nó không còn là
-- lịch sử (AC-18 vế hai).
create function app.promotion_review_event_no_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'PROMOTION_EVENT_APPEND_ONLY' using errcode = '42501';
end;
$$;

create trigger promotion_review_events_no_mutation
before update or delete on public.promotion_review_events
for each row execute function app.promotion_review_event_no_mutation();

alter table public.promotion_review_events enable row level security;

-- Chỉ `select`, và **đúng phạm vi của `promotion_reviews_select_scope`**
-- (`…promotions.sql:349-355`) — không rộng hơn một ly. Ghi là việc của hai RPC
-- `security definer`, không phải của phiên người dùng ⇒ không có policy ghi nào,
-- đúng mô hình quyền BR-M08-24 mà `04_TO_BE_FLOWS` xếp vào nhóm "giữ nguyên vì
-- đã đúng".
grant select on public.promotion_review_events to authenticated;
grant all on public.promotion_review_events to service_role;

create policy promotion_review_events_select_scope
on public.promotion_review_events for select to authenticated
using (
  app.can_global_read()
  or app.can_access_class(source_class_id)
  or app.is_class_staff(source_class_id)
);

comment on table public.promotion_review_events is
  'D-157/BR-M08-19: nhật ký quyết định chuyển lớp, chỉ ghi thêm. Giữ được "ai từ '
  'chối, khi nào, vì sao" sau khi đại diện gửi lại đề xuất.';

-- ── 3 · `propose_promotion` ─────────────────────────────────────────────────
--
-- Ba điều thêm vào, phần còn lại **nguyên văn** bản `20260722000700:127-224`:
--   · nợ #18 / D-160 — vế NĂM NGUỒN (xem mục 5 để biết vì sao chỉ một vế ở đây);
--   · D-161 — ba khoá bí tích trong `warning_snapshot`;
--   · D-157 — một dòng nhật ký `proposed`.
create or replace function public.propose_promotion(
  p_source_enrollment_id uuid,
  p_proposed_status public.promotion_status,
  p_target_class_id uuid default null,
  p_propose_trainee boolean default false,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source public.enrollments;
  existing public.promotion_reviews;
  new_review_id uuid;
  warning jsonb;
  source_grade_level_id uuid;
  required_sacraments public.sacrament_type[];
  missing_sacraments public.sacrament_type[];
  next_event_no smallint;
begin
  select * into source from public.enrollments
  where id = p_source_enrollment_id for update;
  if source.id is null then
    raise exception 'ENROLLMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if source.status not in ('active', 'paused') then
    raise exception 'ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;
  if not app.can_manage_promotion(source.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  -- 🔴 Nợ #18 — D-160 vế một. Đề xuất là một lượt ghi thuộc **năm nguồn**; năm
  -- đích chưa bị đụng tới ở bước này nên không hỏi (hỏi ở bước duyệt).
  -- D-117 vẫn đứng: `writable_academic_year_ids()` trả **mọi** năm cho Super Admin.
  if not (source.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  if p_proposed_status not in ('recommended_promote', 'recommended_repeat', 'temporarily_pause', 'withdraw') then
    raise exception 'PROMOTION_STATUS_INVALID' using errcode = '23514';
  end if;

  if p_propose_trainee then
    if p_target_class_id is not null or p_proposed_status <> 'recommended_promote' then
      raise exception 'TRAINEE_PROPOSAL_INVALID' using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.classes as class
      join public.grade_levels as grade on grade.id = class.grade_level_id
      where class.id = source.class_id and grade.can_propose_trainee
    ) then
      raise exception 'TRAINEE_PROPOSAL_INVALID' using errcode = '23514';
    end if;
  elsif not app.promotion_target_is_valid(source.id, p_proposed_status, p_target_class_id, false) then
    raise exception 'PROMOTION_TARGET_INVALID' using errcode = '23514';
  end if;

  select * into existing from public.promotion_reviews
  where source_enrollment_id = source.id for update;
  if existing.id is not null and existing.final_status = 'approved' then
    raise exception 'PROMOTION_ALREADY_APPROVED' using errcode = '23505';
  end if;

  select jsonb_build_object(
    'weightedAverage', average.weighted_average,
    'massAttendanceScore', attendance.mass_attendance_score,
    'catechismAttendanceScore', attendance.catechism_attendance_score,
    'warnConsecutiveAbsence', coalesce(attendance.warn_consecutive_absence, false),
    'warnConsecutiveSunday', coalesce(attendance.warn_consecutive_sunday, false),
    'warnLowRate', coalesce(attendance.warn_low_rate, false)
  ) into warning
  from (select 1) as seed
  left join public.v_student_weighted_average as average
    on average.enrollment_id = source.id
  left join public.v_student_attendance_summary as attendance
    on attendance.student_id = source.student_id
   and attendance.academic_year_id = source.academic_year_id;

  -- D-161 / AC-16 · AC-17. Ba khoá này **chỉ tồn tại khi lớp nguồn là lớp cuối
  -- ngành**: AC-17 đòi snapshot của một lớp thường **không có** `sacramentReviewRequired`,
  -- chứ không phải có nó với giá trị `false`. Snapshot cũ (trước migration này)
  -- cũng thiếu ba khoá ⇒ giao diện phải chịu được khoá vắng, và nó chịu được vì
  -- `07_IMPLEMENTATION_IMPACT` §2.5 đã ghi `promotion-board.tsx` dùng `?.`.
  select class.grade_level_id into source_grade_level_id
  from public.classes as class where class.id = source.class_id;
  required_sacraments := app.required_sacraments_for_grade(source_grade_level_id);
  if coalesce(array_length(required_sacraments, 1), 0) > 0 then
    missing_sacraments := app.missing_sacraments_for_student(source.student_id, source_grade_level_id);
    warning := warning || jsonb_build_object(
      'sacramentReviewRequired', true,
      'requiredSacraments', to_jsonb(required_sacraments),
      'missingSacraments', to_jsonb(missing_sacraments)
    );
  end if;

  insert into public.promotion_reviews (
    source_enrollment_id, source_class_id, source_academic_year_id, student_id,
    proposed_target_class_id, propose_trainee, proposed_status, warning_snapshot,
    representative_note, proposed_by, proposed_at, final_status,
    reviewed_by, reviewed_at, review_note, approved_target_class_id, created_enrollment_id
  ) values (
    source.id, source.class_id, source.academic_year_id, source.student_id,
    p_target_class_id, p_propose_trainee, p_proposed_status, coalesce(warning, '{}'::jsonb),
    nullif(btrim(coalesce(p_note, '')), ''), auth.uid(), now(), 'pending',
    null, null, null, null, null
  )
  on conflict (source_enrollment_id) do update set
    proposed_target_class_id = excluded.proposed_target_class_id,
    propose_trainee = excluded.propose_trainee,
    proposed_status = excluded.proposed_status,
    warning_snapshot = excluded.warning_snapshot,
    representative_note = excluded.representative_note,
    proposed_by = auth.uid(),
    proposed_at = now(),
    final_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    review_note = null,
    approved_target_class_id = null,
    created_enrollment_id = null
  returning id into new_review_id;

  -- D-157. Lượt gửi lại **sau** một lần từ chối vẫn xoá `reviewed_*` khỏi hàng
  -- review — BR-M08-16 đòi vậy và `04_TO_BE_FLOWS` xếp `upsert` vào nhóm "giữ
  -- nguyên vì đã đúng". Cái đã đổi là: lần từ chối ấy **đã** nằm trong bảng nhật
  -- ký từ lúc nó xảy ra, nên xoá ở đây không còn xoá mất gì.
  select coalesce(max(logged.event_no), 0)::smallint + 1 into next_event_no
  from public.promotion_review_events as logged
  where logged.review_id = new_review_id;
  insert into public.promotion_review_events (
    review_id, source_enrollment_id, source_class_id, source_academic_year_id,
    event_no, event_type, proposed_status, propose_trainee, target_class_id, note, actor_id
  ) values (
    new_review_id, source.id, source.class_id, source.academic_year_id,
    next_event_no, 'proposed', p_proposed_status, p_propose_trainee,
    p_target_class_id, nullif(btrim(coalesce(p_note, '')), ''), auth.uid()
  );

  return new_review_id;
end;
$$;

comment on function public.propose_promotion(uuid, public.promotion_status, uuid, boolean, text) is
  'WF-11 + D-157/D-160/D-161: đề xuất chuyển lớp. Chốt snapshot cảnh báo (kể cả bí '
  'tích lớp cuối ngành), ghi một dòng nhật ký, và từ chối năm học đã đóng.';

-- ── 4 · D-162 / BR-M08-20 — BỊT ĐƯỜNG VÒNG ĐÓNG GHI DANH ────────────────────
--
-- `03_AUDIT_RESULTS` §4.5, gốc rễ: *"hai đường ghi vào cùng một trạng thái, chỉ
-- một đường có quy trình duyệt"*. `/classes/[classId]` đóng được ghi danh bằng
-- `closeEnrollment`, để lại một review `pending` **mồ côi** — trỏ vào một ghi danh
-- không còn mở, nên không bao giờ duyệt được nữa và cũng không ai xoá được (không
-- có policy DELETE, BR-M08-Y2).
--
-- `04_TO_BE_FLOWS` TO-BE 5 khuyến nghị **phương án A cho v1** (chặn mềm ở tầng ứng
-- dụng). **Chủ dự án chốt cả hai tầng (D-158, 2026-08-06)**, đúng bài học M07-B:
-- *"một điều chỉ đúng trên màn hình không phải một bảo đảm"*. Tầng ứng dụng cho
-- câu tiếng Việt nói ra **việc phải làm**; tầng này là lưới an toàn cho mọi lượt
-- gọi thẳng Data API bằng JWT thật.
--
-- **D-162 (2026-08-07)** khoanh phạm vi: chặn đúng bốn trạng thái **đóng**. Nút
-- "Tạm nghỉ"/"Khôi phục" vẫn chạy — `paused` là trạng thái **mở**, nó không để lại
-- đề xuất mồ côi, và chặn nó là chặn một việc chính đáng (em ốm dài ngày giữa lúc
-- đề xuất cuối năm đang chờ duyệt) bằng một nút "không ăn" mà người dùng không
-- hiểu vì sao.
create function app.enrollment_pending_promotion_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and new.status in ('completed', 'repeating', 'transferred', 'withdrawn')
    and exists (
      select 1 from public.promotion_reviews as review
      where review.source_enrollment_id = old.id
        and review.final_status = 'pending'
    ) then
    raise exception 'ENROLLMENT_HAS_PENDING_PROMOTION' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger enrollments_pending_promotion_guard
before update of status on public.enrollments
for each row execute function app.enrollment_pending_promotion_guard();

comment on function app.enrollment_pending_promotion_guard() is
  'BR-M08-20/D-158/D-162: không đóng được một ghi danh đang có đề xuất chuyển lớp '
  'chờ duyệt. Chỉ chặn 4 trạng thái đóng; "Tạm nghỉ" vẫn chạy.';

-- ── 5 · `approve_promotion_review` ──────────────────────────────────────────
--
-- 🔴 **QUẢ MÌN — và nó là thứ tự các lệnh, không phải một điều kiện bị quên.**
--
-- Trigger vừa dựng ở mục 4 nằm trên `public.enrollments` và **fire cho cả lượt
-- ghi của RPC này**: `security definer` bỏ qua RLS, nhưng **không** bỏ qua trigger.
-- Bản cũ đóng ghi danh nguồn (`:300-314`) **rồi mới** cập nhật review thành
-- `approved` (`:331-336`) — nghĩa là ngay tại lúc `update public.enrollments` chạy,
-- review vẫn còn `pending`, và trigger sẽ chặn **chính đường duyệt hợp lệ**. Duyệt
-- lên lớp sẽ hỏng 100%, với một mã lỗi trỏ vào một luật vừa được dựng để bảo vệ
-- nó.
--
-- Lời giải là **đảo thứ tự**: đánh dấu review `approved` TRƯỚC, rồi mới đụng vào
-- `enrollments`. Không cần cờ phiên `set_config` như `04_TO_BE_FLOWS` TO-BE 5
-- phương án B lo ngại (*"phức tạp, dễ sai"*) — và không cần vì cả hai lệnh nằm
-- trong **cùng một giao dịch**, nên tính nguyên tử của BR-M08-13 không suy suyển:
-- bất kỳ lỗi nào ở các bước sau đều cuộn lại cả dấu `approved`.
--
-- `created_enrollment_id` phải điền ở một lệnh `update` **thứ hai** vì ghi danh
-- mới chưa tồn tại lúc đánh dấu. Hai lượt `update` trên cùng một hàng trong cùng
-- giao dịch là vô hại.
--
-- Hai điều thêm vào nữa:
--   · nợ #18 / D-160 — **CẢ HAI VẾ**: năm nguồn (đóng ghi danh cũ) và năm đích
--     (tạo ghi danh mới). Chọn một vế là hở đúng vế kia: chỉ hỏi năm nguồn thì
--     tạo được ghi danh vào một năm đã đóng; chỉ hỏi năm đích thì sửa được ghi
--     danh của một năm đã đóng, trái BR-M02-N09 mà M02-C vừa dựng.
--   · D-157 — một dòng nhật ký `approved` hoặc `rejected`, có `reviewed_by` và lý do.
create or replace function public.approve_promotion_review(
  p_review_id uuid,
  p_decision text,
  p_target_class_id uuid default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  review public.promotion_reviews;
  source public.enrollments;
  source_year_end date;
  target_id uuid;
  target_year_id uuid;
  target_year_start date;
  new_enrollment_id uuid;
  next_event_no smallint;
  clean_note text;
begin
  select * into review from public.promotion_reviews
  where id = p_review_id for update;
  if review.id is null then
    raise exception 'PROMOTION_REVIEW_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_review_promotion(review.source_class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'PROMOTION_DECISION_INVALID' using errcode = '22023';
  end if;
  if review.final_status = 'approved' and p_decision = 'approve' then
    return review.created_enrollment_id;
  end if;
  if review.final_status <> 'pending' then
    raise exception 'PROMOTION_ALREADY_REVIEWED' using errcode = '23505';
  end if;
  -- Nợ #18 — D-160 vế NĂM NGUỒN. Đặt trước cả nhánh từ chối: từ chối cũng là một
  -- lượt ghi vào hồ sơ của năm nguồn.
  if not (review.source_academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;

  clean_note := nullif(btrim(coalesce(p_note, '')), '');
  select coalesce(max(logged.event_no), 0)::smallint + 1 into next_event_no
  from public.promotion_review_events as logged
  where logged.review_id = review.id;

  if p_decision = 'reject' then
    update public.promotion_reviews
    set final_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
        review_note = clean_note
    where id = review.id;
    -- D-157 / AC-18: **đây** là dòng cứu lịch sử. Lượt gửi lại sau đó sẽ xoá
    -- `reviewed_by`/`reviewed_at`/`review_note` khỏi hàng review, nhưng dòng này
    -- đã nằm ngoài tầm với của mệnh đề `do update` ấy.
    insert into public.promotion_review_events (
      review_id, source_enrollment_id, source_class_id, source_academic_year_id,
      event_no, event_type, proposed_status, propose_trainee, target_class_id, note, actor_id
    ) values (
      review.id, review.source_enrollment_id, review.source_class_id,
      review.source_academic_year_id, next_event_no, 'rejected', review.proposed_status,
      review.propose_trainee, review.proposed_target_class_id, clean_note, auth.uid()
    );
    return null;
  end if;

  select * into source from public.enrollments
  where id = review.source_enrollment_id for update;
  if source.id is null or source.status not in ('active', 'paused') then
    raise exception 'ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;
  select end_date into source_year_end from public.academic_years where id = source.academic_year_id;

  if review.propose_trainee then
    select class.id into target_id
    from public.classes as class
    join public.academic_years as year on year.id = class.academic_year_id
    join public.academic_years as source_year on source_year.id = source.academic_year_id
    where class.class_kind = 'trainee' and class.status = 'active'
      and year.start_date > source_year.start_date
    order by year.start_date
    limit 1;
  elsif review.proposed_status in ('recommended_promote', 'recommended_repeat') then
    target_id := coalesce(p_target_class_id, review.proposed_target_class_id);
  else
    target_id := null;
  end if;

  if not app.promotion_target_is_valid(
    source.id, review.proposed_status, target_id, review.propose_trainee
  ) then
    raise exception 'PROMOTION_TARGET_INVALID' using errcode = '23514';
  end if;

  if target_id is not null then
    select class.academic_year_id, year.start_date
      into target_year_id, target_year_start
    from public.classes as class
    join public.academic_years as year on year.id = class.academic_year_id
    where class.id = target_id;
    -- Nợ #18 — D-160 vế NĂM ĐÍCH. Ghi danh mới là một lượt `insert` vào năm đó;
    -- policy `enrollments_insert_scope` đã mang đúng điều kiện này từ M02-C
    -- (`20260726000200:72`) nhưng **definer bỏ qua RLS**, nên nó phải được chép
    -- lại vào đây — đúng bài học M05-A/M07-B của nợ #18.
    if not (target_year_id = any (app.writable_academic_year_ids())) then
      raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
    end if;
  end if;

  -- 🔴 ĐẢO THỨ TỰ — xem khối "QUẢ MÌN" ở đầu mục 5.
  update public.promotion_reviews
  set final_status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      review_note = clean_note,
      approved_target_class_id = target_id
  where id = review.id;

  if review.proposed_status = 'temporarily_pause' then
    update public.enrollments
    set status = 'paused', ended_on = null, updated_by = auth.uid()
    where id = source.id;
  else
    update public.enrollments
    set status = case review.proposed_status
      when 'recommended_repeat' then 'repeating'::public.enrollment_status
      when 'withdraw' then 'withdrawn'::public.enrollment_status
      else 'completed'::public.enrollment_status
    end,
    ended_on = source_year_end,
    updated_by = auth.uid()
    where id = source.id;
  end if;

  if target_id is not null then
    insert into public.enrollments (
      student_id, academic_year_id, class_id, status, enrolled_on,
      previous_enrollment_id, notes, updated_by
    ) values (
      source.student_id, target_year_id, target_id, 'active', target_year_start,
      source.id, 'Tạo từ duyệt chuyển lớp cuối năm', auth.uid()
    ) returning id into new_enrollment_id;
  end if;

  update public.promotion_reviews
  set created_enrollment_id = new_enrollment_id
  where id = review.id;

  insert into public.promotion_review_events (
    review_id, source_enrollment_id, source_class_id, source_academic_year_id,
    event_no, event_type, proposed_status, propose_trainee, target_class_id, note, actor_id
  ) values (
    review.id, review.source_enrollment_id, review.source_class_id,
    review.source_academic_year_id, next_event_no, 'approved', review.proposed_status,
    review.propose_trainee, target_id, clean_note, auth.uid()
  );

  return new_enrollment_id;
end;
$$;

comment on function public.approve_promotion_review(uuid, text, uuid, text) is
  'Atomically locks review/source, validates grade/branch/year, closes old enrollment '
  'and creates the next enrollment. Warnings never hard-block. D-157 ghi nhật ký; '
  'D-160 đòi CẢ hai năm học còn ghi được; review được đánh dấu approved TRƯỚC lượt '
  'ghi enrollments để trigger BR-M08-20 không chặn chính đường duyệt.';

-- ── 6 · D-159 — MỘT NÚT "CHUYỂN LỚP" CHO CẤP XỨ ĐOÀN ────────────────────────
--
-- `05_BUSINESS_RULES` BR-M08-Y1 hỏi *"bốn vai trò cấp xứ đoàn vừa đề xuất vừa tự
-- duyệt đề xuất của chính mình — có phải chủ ý không"*. **Chủ dự án chốt D-159
-- (2026-08-06): không siết, mà BỎ BỚT MỘT BƯỚC.**
--
-- 🔴 **0 thay đổi phân quyền, và đó là điều quan trọng nhất của hàm này.** Đúng
-- bốn vai trò ấy hôm nay đã làm được việc này — `app.can_manage_promotion` và
-- `app.can_review_promotion` đều mở nhánh đầu tiên cho `app.can_global_write()`
-- (`…promotions.sql:50, 62`), và pgTAP `019:109-110` cố tình dựng đúng kịch bản
-- đó. Cái đổi là **số biểu mẫu phải diễn qua**, không phải ai được làm.
--
-- 🔴 **Bắt buộc nguyên tử, và D-159 nói rõ vì sao:** hai lệnh nối nhau ở tầng ứng
-- dụng mà lệnh sau hỏng sẽ để lại **đúng cái đề xuất mồ côi** mà D-158 vừa được
-- chốt để diệt — và tệ hơn nữa, cái mồ côi ấy nay **khoá luôn** ghi danh của em
-- lại (trigger mục 4), nên một lỗi mạng giữa chừng biến thành một em không ai
-- đóng được ghi danh.
--
-- Gọi lại **nguyên hai RPC cũ** thay vì chép luật: mọi hàng rào của BR-M08-02…21,
-- nợ #18 và nhật ký D-157 đi theo miễn phí, và một lượt sửa luật về sau không thể
-- bỏ quên đường đi này.
create function public.promote_enrollment_now(
  p_source_enrollment_id uuid,
  p_proposed_status public.promotion_status,
  p_target_class_id uuid default null,
  p_propose_trainee boolean default false,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_review_id uuid;
  snapshot jsonb;
begin
  -- Hàng rào DUY NHẤT của riêng hàm này. Người không thuộc bốn vai trò ấy vẫn đi
  -- đường hai bước như cũ; nếu bỏ dòng này thì một Giáo lý viên đại diện sẽ tự
  -- duyệt được đề xuất của chính mình — tức một thay đổi phân quyền thật, trái
  -- SEC-09 và trái D-159.
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  created_review_id := public.propose_promotion(
    p_source_enrollment_id, p_proposed_status, p_target_class_id, p_propose_trainee, p_note
  );

  /*
    🔴 **BR-M08-18 / AC-16 vế ba — và đây là một lỗ do CHÍNH đợt này mở ra.**

    `04_TO_BE_FLOWS` TO-BE 3 bước 3 đòi *"thiếu bí tích thì bắt buộc nhập ý kiến
    trước khi bấm Duyệt (client + server)"*, và vế "server" của đường **hai bước**
    nằm ở Server Action `reviewPromotion`. Đường **một bước** của D-159 không đi
    qua Server Action ấy — nó gọi một action khác — nên nếu không có khối này thì
    bốn vai trò cấp xứ đoàn **đi vòng qua đúng luật vừa dựng**, bằng một nút mà
    chính đợt này thêm vào.

    Đặt ở đây chứ không ở `approve_promotion_review`, và có lý do: đường hai bước
    đã có hàng rào ở tầng ứng dụng đúng như tài liệu mô tả, còn hàm này là
    **chốt chặn duy nhất** của đường một bước — tầng ứng dụng không kiểm được vì
    `warning_snapshot` chỉ tồn tại **sau** khi `propose_promotion` chạy xong.
    Chép luật lên `approve_promotion_review` sẽ đổi hành vi của một đường đi đã
    được nghiệm thu từ Phase 5, thứ `AGENTS` §4 cấm làm ngoài phạm vi.

    `->` trả `null` khi khoá vắng (lớp không phải cấp cuối ngành, hoặc snapshot
    cũ), nên `coalesce` về mảng rỗng là ca "không có gì để đòi".
  */
  select warning_snapshot into snapshot
  from public.promotion_reviews where id = created_review_id;
  if jsonb_array_length(coalesce(snapshot -> 'missingSacraments', '[]'::jsonb)) > 0
    and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'PROMOTION_NOTE_REQUIRED' using errcode = '23514';
  end if;

  return public.approve_promotion_review(created_review_id, 'approve', p_target_class_id, p_note);
end;
$$;

comment on function public.promote_enrollment_now(uuid, public.promotion_status, uuid, boolean, text) is
  'D-159/BR-M08-Y1: đề xuất + duyệt trong MỘT giao dịch, chỉ cho 4 vai trò cấp xứ '
  'đoàn (app.can_global_write). 0 thay đổi phân quyền — gộp hai bước họ đã làm được.';

revoke all on function public.promote_enrollment_now(uuid, public.promotion_status, uuid, boolean, text) from public, anon;
grant execute on function public.promote_enrollment_now(uuid, public.promotion_status, uuid, boolean, text) to authenticated, service_role;

-- Bốn hàm mới của schema `app` cần dòng này; cùng khuôn các migration trước.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
