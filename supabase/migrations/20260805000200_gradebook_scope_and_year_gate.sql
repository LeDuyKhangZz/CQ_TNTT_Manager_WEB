-- ============================================================================
-- M07-B — module Bảng điểm: đợt DUY NHẤT có migration.
--
-- Bảy việc trong một file, và chúng đụng nhau nên không tách ra được:
--
--   1. D-74 + D-151  🔴 SIẾT — quyền KHÓA bảng điểm về Giáo lý viên đại diện +
--                    Giáo lý viên lớp, cộng Super Admin làm đường thoát.
--   2. AC-10-02         — khóa hai lần không đẩy lùi mốc khóa (idempotent thật).
--   3. TB-M07-01        — `delete_assessment`: xóa cứng cột CHƯA có điểm thật,
--                         dọn luôn dòng rỗng; cột đã có điểm chỉ được ẩn mềm.
--   4. TB-M07-03 b6     — cờ "chỉnh tay" chỉ bật khi điểm **khác** đề xuất.
--   5. TB-M07-04        — `refresh_attendance_assessment_scores` trả **hai** số.
--   6. TB-M07-05/D-152  🔴 SIẾT — chỉ tác giả · Giáo lý viên đại diện lớp · nhóm
--                         cấp xứ đoàn mới xóa/sửa được một nhận xét.
--   7. Nợ #18        🔴 SIẾT — hàng rào "năm học đã đóng thì không ghi được" cho
--                         **cả bốn** bảng của module. D-117 giữ nguyên: Super
--                         Admin là ngoại lệ.
--
-- Và **một** thay đổi dữ liệu, thứ duy nhất của cả module:
--
--   8. D-153 (chủ dự án chốt 2026-08-05) — gỡ cờ "chỉnh tay" ở đúng những ô mà
--      lỗi cũ đặt sai. Xem khối cuối file.
--
-- ── 🔴 Bài học M05-A phải đọc TRƯỚC khi đọc phần nợ #18 ở dưới ───────────────
-- Nợ #18 ghi *"mỗi module chỉ cần thêm một dòng vào policy"*. Câu ấy đúng với
-- `enrollments`/`classes` (M02-C) và với `teaching_plans` (M06-B), nhưng **SAI**
-- với `attendance` — và module này chứa **cả hai ca cùng lúc**:
--
--   · `assessments` · `student_comments` · `leaderboards` — `authenticated` có
--     `insert/update/delete` mức bảng ⇒ hàng rào đặt được vào **policy**.
--   · `assessment_scores` — `authenticated` chỉ có `select` (`20260722000400:488`).
--     Mọi đường ghi đi qua RPC `security definer`, mà definer chạy dưới quyền chủ
--     hàm nên **bỏ qua RLS** ⇒ một điều kiện thêm vào policy sẽ **không bao giờ
--     được chạy**. Hàng rào của bảng ấy nằm **trong bốn RPC**.
--
-- Cùng một món nợ, hai chỗ đặt trái ngược, trong cùng một module — y như M05.
-- ============================================================================

-- ── 1 · D-74 + D-151 — AI được khóa bảng điểm ───────────────────────────────
-- Trước migration này có **ba tầng nói ba điều khác nhau**, đúng thứ
-- `08_ACCEPTANCE_CRITERIA` §5 gọi là "mâu thuẫn chưa giải quyết":
--
--   `docs/05` §5          → chỉ Giáo lý viên đại diện
--   RPC `lock_gradebook`  → `is_class_representative or can_global_write`
--                           (tức thêm Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký)
--   `queries.ts` `canLock`→ một phép tính riêng, lệch **cả hai** cái trên
--
-- Chủ dự án chốt (D-74, kèm D-151 trả lời câu để ngỏ cuối cùng): **đại diện lớp
-- + Giáo lý viên lớp + Super Admin**. Dự trưởng phụ tá KHÔNG.
--
-- 🔴 Đặt luật vào **một hàm có tên**, không viết thẳng vào thân RPC. Lý do là
-- chính cái lỗi đang chữa: luật nằm rải ba nơi thì ba nơi lệch nhau, và không ai
-- đọc được "ai khóa được" mà không mở ba file. Nay pgTAP, RPC và `docs/05` cùng
-- trỏ về một cái tên.
create or replace function app.can_lock_gradebook(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    -- D-151: đường thoát vận hành. Cuối năm mà cả đại diện lẫn Giáo lý viên của
    -- lớp đều không thao tác kịp thì phải còn một tài khoản khóa hộ được — cùng
    -- khuôn với ngoại lệ Super Admin của D-144 (M06-B) và D-117 (M02-C).
    app.is_super_admin()
    -- D-74: `is_class_staff` gồm ba vai trò lớp; trừ `trainee_assistant` ra là
    -- còn đúng "đại diện + Giáo lý viên lớp" mà bảng D-74 liệt kê.
    or (app.is_class_staff(target_class_id) and app.current_role() <> 'trainee_assistant'),
    false
  )
$$;

comment on function app.can_lock_gradebook(uuid) is
  'D-74 + D-151: khóa bảng điểm = Giáo lý viên đại diện + Giáo lý viên lớp của '
  'chính lớp đó, cộng Super Admin làm đường thoát. Xứ đoàn trưởng, Phó Xứ đoàn, '
  'Thư ký và Dự trưởng phụ tá KHÔNG. Mở khóa vẫn chỉ Super Admin (D-38).';

create or replace function public.lock_gradebook(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
begin
  if not app.can_lock_gradebook(p_class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select academic_year_id into class_year from public.classes where id = p_class_id for update;
  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0002';
  end if;
  insert into public.gradebook_locks (
    class_id, academic_year_id, is_locked, locked_at, locked_by,
    unlocked_at, unlocked_by
  ) values (
    p_class_id, class_year, true, now(), auth.uid(), null, null
  )
  on conflict (class_id) do update set
    is_locked = true,
    -- 🔴 AC-10-02 — khóa lần thứ hai KHÔNG được đẩy lùi mốc khóa. Bản cũ ghi
    -- `locked_at = now()` vô điều kiện, nên hai người cùng bấm "Khóa" cách nhau
    -- một giờ là mốc khóa nhảy sang giờ sau — mà mốc ấy là thứ duy nhất trả lời
    -- được câu "bảng điểm chốt lúc nào". Chỉ đặt mốc khi bảng đang MỞ.
    locked_at = case
      when public.gradebook_locks.is_locked then public.gradebook_locks.locked_at
      else now()
    end,
    locked_by = case
      when public.gradebook_locks.is_locked then public.gradebook_locks.locked_by
      else auth.uid()
    end,
    unlocked_at = null,
    unlocked_by = null;
end;
$$;

comment on function public.lock_gradebook(uuid) is
  'WF-08: khóa bảng điểm của lớp. Quyền theo app.can_lock_gradebook (D-74/D-151); '
  'gọi lần hai là vô hại, mốc khóa giữ nguyên (AC-10-02).';

-- ── 2 · Nợ #18 cho `assessments` — hàng rào năm học đặt vào POLICY ──────────
-- Bảng này `authenticated` ghi thẳng được nên đúng khuôn M02-C: thêm một điều
-- kiện vào cả ba policy ghi. Ghi chú 2 của `20260726000200` vẫn áp dụng — mệnh
-- đề `using` của UPDATE **cũng** phải có hàng rào, nếu không thì
-- `update … set title = title` vẫn lọt vào một năm đã đóng.
drop policy assessments_insert_grader on public.assessments;
create policy assessments_insert_grader
on public.assessments for insert to authenticated
with check (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy assessments_update_grader on public.assessments;
create policy assessments_update_grader
on public.assessments for update to authenticated
using (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy assessments_delete_grader on public.assessments;
create policy assessments_delete_grader
on public.assessments for delete to authenticated
using (
  app.can_grade_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

-- ── 3 · TB-M07-01 — "ẩn cột" phải ẩn THẬT, không chỉ ẩn trên màn hình ───────
-- `assessments.is_active` có từ Phase 5 nhưng là **cột chết**: không đường nào
-- đặt nó thành `false`, nên chưa ai phải hỏi "ẩn rồi thì phụ huynh còn thấy
-- không". Từ đợt này nó thành cột nghiệp vụ, và câu hỏi ấy có câu trả lời.
--
-- Mọi truy vấn của ứng dụng đều đã lọc `is_active`, và `v_student_weighted_average`
-- cũng vậy (`20260722000400:580`) — nhưng RLS thì **không**, nên một phụ huynh
-- gọi thẳng Data API vẫn đọc được cột đã ẩn. AC-01-03 đòi *"cột không còn trong
-- … cổng phụ huynh"*, và một bất biến chỉ đúng ở tầng ứng dụng thì không phải
-- bất biến. Đây là **SIẾT**, nên không vi phạm điều cấm nới quyền đọc của cổng
-- (`07_IMPLEMENTATION_IMPACT` §4).
drop policy assessments_select_scope on public.assessments;
create policy assessments_select_scope
on public.assessments for select to authenticated
using (
  app.can_access_class(class_id)
  or app.is_class_staff(class_id)
  or (
    is_published
    and is_active
    and exists (
      select 1 from public.enrollments as enrollment
      where enrollment.class_id = assessments.class_id
        and enrollment.academic_year_id = assessments.academic_year_id
        and (app.is_guardian_of_student(enrollment.student_id) or app.is_self_student(enrollment.student_id))
    )
  )
);

-- 🔴 Và đây là nửa còn lại, chỗ dễ quên nhất: **điểm** của một cột đã ẩn.
-- `assessment_scores` không có cột `is_active`; nó có `assessment_published`,
-- một bản sao được trigger giữ đồng bộ. Cách rẻ nhất và chính xác nhất là dạy
-- cho trigger ấy rằng "công bố" nghĩa là **đang công bố VÀ chưa bị ẩn** — khỏi
-- phải thêm một truy vấn con vào `using` của mọi dòng.
create or replace function app.sync_assessment_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_published is distinct from old.is_published
    or new.is_active is distinct from old.is_active then
    update public.assessment_scores
    set assessment_published = (new.is_published and new.is_active)
    where assessment_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger assessments_sync_publication on public.assessments;
create trigger assessments_sync_publication
after update of is_published, is_active on public.assessments
for each row execute function app.sync_assessment_publication();

-- Cùng một luật ở đường ghi từng dòng, nếu không thì lưu một ô điểm vào cột đã
-- ẩn sẽ **bật lại** cờ công bố cho đúng dòng ấy.
create or replace function app.sync_assessment_score_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  selected_enrollment public.enrollments;
begin
  select * into selected_assessment
  from public.assessments where id = new.assessment_id;
  select * into selected_enrollment
  from public.enrollments where id = new.enrollment_id;

  if selected_assessment.id is null or selected_enrollment.id is null then
    raise exception 'ASSESSMENT_OR_ENROLLMENT_NOT_FOUND' using errcode = '23503';
  end if;
  if selected_assessment.class_id <> selected_enrollment.class_id
    or selected_assessment.academic_year_id <> selected_enrollment.academic_year_id then
    raise exception 'ASSESSMENT_ENROLLMENT_MISMATCH' using errcode = '23514';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  if new.score is not null and new.score > selected_assessment.max_score then
    raise exception 'SCORE_EXCEEDS_MAX' using errcode = '23514';
  end if;

  new.class_id := selected_assessment.class_id;
  new.academic_year_id := selected_assessment.academic_year_id;
  new.student_id := selected_enrollment.student_id;
  new.assessment_published := (selected_assessment.is_published and selected_assessment.is_active);
  return new;
end;
$$;

-- ── 4 · TB-M07-01 — RPC xóa cột điểm ───────────────────────────────────────
-- `03_AUDIT_RESULTS` F04 (50/75): đường xóa cũ là một lệnh `delete` trần, nên
-- khoá ngoại `on delete restrict` của `assessment_scores` chặn lại và người dùng
-- đọc *"Cột đã có điểm"* — **trong khi họ chưa nhập điểm nào**. Nguyên nhân là
-- lỗi ghi cả roster (đã chữa ở M07-A): cột nào cũng có sẵn 50 dòng rỗng.
--
-- Nay phép thử đúng chỗ: đếm dòng có `score is not null`, chứ không đếm dòng.
create function public.delete_assessment(p_assessment_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  scored_count integer;
  removed_empty integer;
begin
  select * into selected_assessment
  from public.assessments where id = p_assessment_id for update;
  if selected_assessment.id is null then
    raise exception 'ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  -- AC-01-04 — bảng điểm đã khóa thì chặn cả xóa lẫn ẩn.
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  -- Nợ #18. Hàm `security definer` bỏ qua RLS nên policy vừa sửa ở trên KHÔNG
  -- che được đường này — phải kiểm tay, đúng bài học M05-A.
  if not (selected_assessment.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;

  -- 🔴 Cửa thứ hai, và nó KHÔNG có trong `04_TO_BE_FLOWS`: `leaderboards`
  -- `.source_assessment_id` là khoá ngoại `on delete restrict`. Một cột chưa có
  -- điểm nào vẫn có thể đang là **nguồn của một bảng Top 5** — thường gặp đúng
  -- ở ca "tạo nhầm rồi tạo Top 5 nhầm theo". Không chặn ở đây thì Postgres ném
  -- `23503`, mà `23503` được dịch thành *"Không tìm thấy dữ liệu liên quan"* —
  -- một câu sai hẳn nghĩa, khiến người dùng đi tìm sai chỗ.
  if exists (
    select 1 from public.leaderboards
    where source_assessment_id = p_assessment_id
  ) then
    raise exception 'ASSESSMENT_IS_LEADERBOARD_SOURCE' using errcode = '23514';
  end if;

  select count(*) into scored_count
  from public.assessment_scores
  where assessment_id = p_assessment_id and score is not null;
  if scored_count > 0 then
    -- BR-M07-27 — đã có điểm thật thì chỉ được ẩn mềm. Ném ở đây chứ không để
    -- khoá ngoại ném hộ: `23503` của Postgres không phân biệt nổi "cột có điểm"
    -- với "cột đang là nguồn của một bảng Top 5", mà hai thứ ấy cần hai câu trả
    -- lời khác nhau cho người dùng.
    raise exception 'ASSESSMENT_HAS_SCORES' using errcode = '23514';
  end if;

  -- BR-M07-26 — dọn luôn các dòng rỗng. Đây chính là chỗ dữ liệu rác do lỗi cũ
  -- sinh ra được xử lý: không cần backfill riêng, nó tự biến mất đúng lúc người
  -- dùng bấm xóa cột.
  delete from public.assessment_scores where assessment_id = p_assessment_id;
  get diagnostics removed_empty = row_count;
  delete from public.assessments where id = p_assessment_id;
  return removed_empty;
end;
$$;

comment on function public.delete_assessment(uuid) is
  'BR-M07-26/27 (TB-M07-01): xóa cứng một cột điểm CHƯA có điểm thật, dọn luôn '
  'các dòng rỗng của nó. Cột đã có ít nhất một điểm ném ASSESSMENT_HAS_SCORES — '
  'đường duy nhất là ẩn mềm (is_active = false). Trả về số dòng rỗng đã dọn.';

revoke all on function public.delete_assessment(uuid) from public, anon;
grant execute on function public.delete_assessment(uuid) to authenticated, service_role;

-- ── 5 · TB-M07-03 bước 6 + nợ #18 — lưu điểm ───────────────────────────────
create or replace function public.save_assessment_scores(
  p_assessment_id uuid,
  p_scores jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  item jsonb;
  selected_enrollment public.enrollments;
  parsed_score numeric(4, 2);
  saved_count integer := 0;
begin
  select * into selected_assessment
  from public.assessments
  where id = p_assessment_id and is_active
  for update;
  if selected_assessment.id is null then
    raise exception 'ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  -- Nợ #18 — xem ghi chú ở `delete_assessment`.
  if not (selected_assessment.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_scores) <> 'array' then
    raise exception 'VALIDATION_ERROR' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_scores)
  loop
    if not (item ? 'enrollmentId') or not (item ? 'score') then
      raise exception 'VALIDATION_ERROR' using errcode = '22023';
    end if;
    select * into selected_enrollment
    from public.enrollments
    where id = (item->>'enrollmentId')::uuid;
    if selected_enrollment.id is null
      or selected_enrollment.class_id <> selected_assessment.class_id
      or selected_enrollment.academic_year_id <> selected_assessment.academic_year_id then
      raise exception 'ASSESSMENT_ENROLLMENT_MISMATCH' using errcode = '23514';
    end if;

    parsed_score := case
      when item->>'score' is null then null
      else (item->>'score')::numeric
    end;
    if parsed_score is not null
      and (parsed_score < 0 or parsed_score > selected_assessment.max_score) then
      raise exception 'SCORE_OUT_OF_RANGE' using errcode = '23514';
    end if;

    insert into public.assessment_scores (
      assessment_id, enrollment_id, class_id, academic_year_id, student_id,
      score, is_manual_override, note, assessment_published, graded_by, graded_at
    ) values (
      selected_assessment.id, selected_enrollment.id, selected_assessment.class_id,
      selected_assessment.academic_year_id, selected_enrollment.student_id,
      parsed_score,
      -- 🔴 BR-M07-31 (TB-M07-03 bước 6). Dòng chưa từng tồn tại thì chưa có đề
      -- xuất nào, nên "khác đề xuất" quy về "có gõ một con số vào". Ô để trống
      -- **không** phải một lượt chỉnh tay — nếu không thì lần lấy đề xuất kế
      -- tiếp sẽ bỏ qua đúng những em chưa ai chấm.
      selected_assessment.kind = 'attendance' and parsed_score is not null,
      nullif(btrim(coalesce(item->>'note', '')), ''),
      (selected_assessment.is_published and selected_assessment.is_active),
      auth.uid(), now()
    )
    on conflict (assessment_id, enrollment_id) do update set
      score = excluded.score,
      -- 🔴 Bản cũ đặt `true` **vô điều kiện** cho mọi cột chuyên cần, nên một cú
      -- bấm "Lưu điểm" biến cả 50 em thành "đang chỉnh tay" và cơ chế đề xuất tự
      -- động chết hẳn từ đó (F07 = 62/75). M07-A đã chặn phần lớn bằng cách chỉ
      -- gửi ô đã đổi, nhưng luật vẫn sai: một Giáo lý viên sửa ô rồi gõ trả lại
      -- đúng con số máy đề xuất vẫn bị đóng dấu.
      --
      -- Phép so là `is distinct from` chứ không phải `<>` — `<>` với `null` ra
      -- `null`, tức "không đúng cũng không sai", và `case … then` sẽ rơi vào
      -- nhánh sai. Ô rỗng và ô có điểm là hai thứ khác nhau ở CẢ HAI chiều.
      is_manual_override = case
        when selected_assessment.kind <> 'attendance' then public.assessment_scores.is_manual_override
        else excluded.score is distinct from public.assessment_scores.system_suggested_score
      end,
      note = excluded.note,
      graded_by = auth.uid(),
      graded_at = now();
    saved_count := saved_count + 1;
  end loop;
  return saved_count;
end;
$$;

-- ── 6 · TB-M07-04 — lấy đề xuất chuyên cần, và NÓI RA số dòng bị bỏ qua ─────
-- 🔴 Đây là chỗ **bắt buộc `drop` + `create`**, không `create or replace` được:
-- kiểu trả về đổi từ `integer` sang một bản ghi hai cột, mà PostgreSQL không cho
-- đổi kiểu trả về bằng `replace`. Hệ quả dây chuyền đã lường trước
-- (`07_IMPLEMENTATION_IMPACT` §3.1): phải cấp lại `grant execute` và phải sinh
-- lại `src/types/database.ts`.
--
-- Vì sao con số cũ vô nghĩa: nó đếm **mọi** dòng chạm tới, kể cả dòng bị giữ
-- nguyên vì đang chỉnh tay. Người dùng đọc *"Đã cập nhật 50 đề xuất"* rồi mở
-- bảng ra thấy không ô nào đổi. Sau khi việc #5 sửa luật đóng dấu, con số
-- `skipped_manual` mới phản ánh đúng thực tế — đúng thứ tự `04_TO_BE_FLOWS`
-- TB-M07-04 đã dặn.
drop function public.refresh_attendance_assessment_scores(uuid);
create function public.refresh_attendance_assessment_scores(p_assessment_id uuid)
returns table (out_refreshed integer, out_skipped_manual integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  selected_enrollment public.enrollments;
  summary public.v_student_attendance_summary;
  proposed numeric(4, 2);
  existing_override boolean;
  refreshed_count integer := 0;
  skipped_count integer := 0;
begin
  select * into selected_assessment
  from public.assessments
  where id = p_assessment_id and is_active
  for update;
  if selected_assessment.id is null or selected_assessment.kind <> 'attendance' then
    raise exception 'ATTENDANCE_ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  -- Nợ #18.
  if not (selected_assessment.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;

  for selected_enrollment in
    select enrollment.*
    from public.enrollments as enrollment
    where enrollment.class_id = selected_assessment.class_id
      and enrollment.academic_year_id = selected_assessment.academic_year_id
      and enrollment.status in ('active', 'paused')
  loop
    select * into summary
    from public.v_student_attendance_summary as attendance
    where attendance.student_id = selected_enrollment.student_id
      and attendance.academic_year_id = selected_assessment.academic_year_id;
    proposed := case selected_assessment.attendance_component
      when 'mass' then summary.mass_attendance_score
      when 'catechism' then summary.catechism_attendance_score
      else null
    end;

    -- Đọc cờ TRƯỚC khi upsert — sau đó thì không phân biệt được nữa.
    select score.is_manual_override into existing_override
    from public.assessment_scores as score
    where score.assessment_id = selected_assessment.id
      and score.enrollment_id = selected_enrollment.id;
    if coalesce(existing_override, false) then
      skipped_count := skipped_count + 1;
    else
      refreshed_count := refreshed_count + 1;
    end if;

    insert into public.assessment_scores (
      assessment_id, enrollment_id, class_id, academic_year_id, student_id,
      score, system_suggested_score, is_manual_override, assessment_published,
      graded_by, graded_at
    ) values (
      selected_assessment.id, selected_enrollment.id, selected_assessment.class_id,
      selected_assessment.academic_year_id, selected_enrollment.student_id,
      proposed, proposed, false,
      (selected_assessment.is_published and selected_assessment.is_active),
      auth.uid(), now()
    )
    on conflict (assessment_id, enrollment_id) do update set
      system_suggested_score = excluded.system_suggested_score,
      score = case
        when public.assessment_scores.is_manual_override then public.assessment_scores.score
        else excluded.system_suggested_score
      end,
      graded_by = auth.uid(),
      graded_at = now();
  end loop;
  return query select refreshed_count, skipped_count;
end;
$$;

comment on function public.refresh_attendance_assessment_scores(uuid) is
  'TB-M07-04/AC-04-01: lấy lại đề xuất chuyên cần. Trả (đã cập nhật, bị giữ '
  'nguyên vì đang chỉnh tay) — con số thứ hai chỉ đúng sau khi BR-M07-31 sửa '
  'luật đóng dấu chỉnh tay.';

revoke all on function public.refresh_attendance_assessment_scores(uuid) from public, anon;
grant execute on function public.refresh_attendance_assessment_scores(uuid) to authenticated, service_role;

-- Nợ #18 cho đường ghi thứ ba của `assessment_scores`.
create or replace function public.reset_attendance_score_override(
  p_assessment_id uuid,
  p_enrollment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
begin
  select * into selected_assessment
  from public.assessments where id = p_assessment_id for update;
  if selected_assessment.id is null or selected_assessment.kind <> 'attendance' then
    raise exception 'ATTENDANCE_ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;
  if not (selected_assessment.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  update public.assessment_scores
  set score = system_suggested_score,
      is_manual_override = false,
      graded_by = auth.uid(),
      graded_at = now()
  where assessment_id = p_assessment_id and enrollment_id = p_enrollment_id;
  if not found then
    raise exception 'ASSESSMENT_SCORE_NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$$;

-- ── 7 · TB-M07-05 / D-152 — ai được sửa và xóa một nhận xét ────────────────
-- Hiện trạng: **bất kỳ ai dạy lớp** đều xóa được nhận xét của người khác — kể cả
-- Dự trưởng phụ tá khi năm học bật cờ cho họ nhận xét — và bảng không có lịch
-- sử nên xóa là mất hẳn.
--
-- `04_TO_BE_FLOWS` TB-M07-05 đề nghị `author_profile_id = auth.uid() or
-- app.can_global_write()`, nhưng `07_IMPLEMENTATION_IMPACT` §3.3 ghi thẳng rằng
-- đây là **giảm quyền của người đang dùng** và *"phải chốt nghiệp vụ trước"*:
-- siết đúng nguyên văn thì Giáo lý viên đại diện thấy một nhận xét sai trong
-- chính lớp mình cũng phải nhờ cấp xứ đoàn xóa hộ.
--
-- **D-152 (chủ dự án chốt 2026-08-05): tác giả + Giáo lý viên ĐẠI DIỆN lớp đó +
-- nhóm cấp xứ đoàn.** Vẫn là siết thật — một Giáo lý viên thường hoặc Dự trưởng
-- phụ tá không còn xóa được bài của đồng nghiệp — nhưng người chịu trách nhiệm
-- về lớp xử lý được ngay tại lớp.
create or replace function app.can_moderate_student_comment(
  target_class_id uuid,
  target_author_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    target_author_profile_id = auth.uid()
    or app.can_global_write()
    or app.is_class_representative(target_class_id),
    false
  )
$$;

comment on function app.can_moderate_student_comment(uuid, uuid) is
  'BR-M07-33 / D-152: sửa hoặc xóa một nhận xét = tác giả, Giáo lý viên đại diện '
  'lớp đó, hoặc nhóm cấp xứ đoàn (can_global_write).';

-- 🔴 Luật này phải đặt vào **cả UPDATE lẫn DELETE**, và đó không phải cẩn thận
-- thừa. Đợt này thêm đường *sửa* nhận xét (TB-M07-05 bước 2). Siết mỗi DELETE
-- thì ai không xóa được vẫn **sửa nội dung thành bất cứ thứ gì** — cùng một
-- thiệt hại, đi qua một cái cửa khác, và lần này còn giữ nguyên tên tác giả cũ.
drop policy student_comments_insert_grader on public.student_comments;
create policy student_comments_insert_grader
on public.student_comments for insert to authenticated
with check (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and author_profile_id = auth.uid()
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy student_comments_update_grader on public.student_comments;
create policy student_comments_update_grader
on public.student_comments for update to authenticated
using (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and app.can_moderate_student_comment(class_id, author_profile_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy student_comments_delete_grader on public.student_comments;
create policy student_comments_delete_grader
on public.student_comments for delete to authenticated
using (
  app.can_comment_class(class_id)
  and not app.is_gradebook_locked(class_id)
  and app.can_moderate_student_comment(class_id, author_profile_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

comment on policy student_comments_delete_grader on public.student_comments is
  'BR-M07-33/D-152 + nợ #18: xóa nhận xét = tác giả · đại diện lớp · cấp xứ đoàn, '
  'bảng điểm chưa khóa, năm học còn ghi được (Super Admin ngoại lệ, D-117).';

-- ── 8 · Nợ #18 cho `leaderboards` ──────────────────────────────────────────
drop policy leaderboards_insert_manager on public.leaderboards;
create policy leaderboards_insert_manager
on public.leaderboards for insert to authenticated
with check (
  app.can_manage_leaderboard(class_id)
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy leaderboards_update_manager on public.leaderboards;
create policy leaderboards_update_manager
on public.leaderboards for update to authenticated
using (
  app.can_manage_leaderboard(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_manage_leaderboard(class_id)
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy leaderboards_delete_manager on public.leaderboards;
create policy leaderboards_delete_manager
on public.leaderboards for delete to authenticated
using (
  app.can_manage_leaderboard(class_id)
  and not is_published
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

-- `publish_leaderboard` ghi `leaderboard_entries` và cập nhật `leaderboards`
-- bằng `security definer` ⇒ **cả hai policy trên đều đứng ngoài**. Đây đúng là
-- cái bẫy M05-A đã dặn, và nó có mặt trong chính module này.
create or replace function public.publish_leaderboard(
  p_leaderboard_id uuid,
  p_custom_scores jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_leaderboard public.leaderboards;
  inserted_count integer;
begin
  select * into selected_leaderboard
  from public.leaderboards where id = p_leaderboard_id for update;
  if selected_leaderboard.id is null then
    raise exception 'LEADERBOARD_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_manage_leaderboard(selected_leaderboard.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if selected_leaderboard.is_published then
    raise exception 'LEADERBOARD_ALREADY_PUBLISHED' using errcode = '23505';
  end if;
  -- Nợ #18.
  if not (selected_leaderboard.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.academic_years
    where id = selected_leaderboard.academic_year_id and top5_enabled
  ) then
    raise exception 'TOP5_DISABLED' using errcode = '42501';
  end if;

  delete from public.leaderboard_entries where leaderboard_id = selected_leaderboard.id;
  insert into public.leaderboard_entries (
    leaderboard_id, class_id, academic_year_id, enrollment_id, rank, score,
    saint_name_snapshot, full_name_snapshot, leaderboard_published
  )
  select selected_leaderboard.id, selected_leaderboard.class_id,
    selected_leaderboard.academic_year_id, preview.out_enrollment_id,
    preview.out_rank, preview.out_score, preview.out_saint_name,
    preview.out_full_name, false
  from public.preview_leaderboard(selected_leaderboard.id, p_custom_scores) as preview;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    raise exception 'LEADERBOARD_NO_DATA' using errcode = '23514';
  end if;

  update public.leaderboards
  set is_published = true,
      published_at = now(),
      published_by = auth.uid(),
      updated_by = auth.uid()
  where id = selected_leaderboard.id;
  return inserted_count;
end;
$$;

-- ── 9 · D-153 — DỌN dấu "chỉnh tay" mà lỗi cũ đặt sai ──────────────────────
-- 🔴 **Đây là thay đổi dữ liệu duy nhất của cả module M07**, và nó cần được đọc
-- kỹ vì phần lớn migration của 2B tự hào "0 dòng dữ liệu bị đụng".
--
-- Vì sao phải dọn: bản cũ của `save_assessment_scores` đóng dấu `is_manual_override`
-- lên **mọi** phần tử nhận được, và biểu mẫu thì gửi cả roster. Nên trong dữ liệu
-- hiện có, một cú bấm "Lưu điểm" duy nhất đã đánh dấu cả lớp. Sửa luật cho tương
-- lai (việc #5) **không gỡ được** những dấu đã đặt: nút "Lấy đề xuất mới" sẽ vĩnh
-- viễn bỏ qua chúng, và con số `skipped_manual` vừa thêm ở việc #6 sẽ hiện một
-- số to giả ngay từ ngày đầu.
--
-- Vì sao dọn được mà không mất công của ai: chỉ gỡ ở đúng những ô mà **điểm đang
-- lưu không khác đề xuất của hệ thống** — tức không có bàn tay người nào trong
-- đó. Mọi ô có điểm khác đề xuất đều **giữ nguyên** dấu, kể cả khi nó bị đặt oan,
-- vì ở đó không phân biệt được "người sửa thật" với "người trùng số".
--
-- Chủ dự án chốt phương án này 2026-08-05 (D-153), sau khi loại phương án "gỡ
-- sạch mọi dấu của cột chuyên cần" — phương án ấy sẽ để máy ghi đè lại đúng
-- những em được sửa tay có lý do, và không có cách lấy lại.
update public.assessment_scores
set is_manual_override = false
where is_manual_override
  and score is not distinct from system_suggested_score
  and assessment_id in (select id from public.assessments where kind = 'attendance');

-- ── 10 · Cấp lại quyền chạy cho hàm trong schema `app` ─────────────────────
-- Hai hàm mới của schema `app` cần dòng này; đặt ở cuối cho cùng khuôn với các
-- migration trước.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
