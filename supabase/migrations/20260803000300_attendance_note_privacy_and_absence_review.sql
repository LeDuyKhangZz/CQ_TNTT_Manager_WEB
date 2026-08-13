-- ============================================================================
-- M05-B · D-75 (SIẾT quyền) · TB-11 — hai việc trong MỘT migration.
--
-- ── 1. D-75 · Ghi chú điểm danh là ghi chú NỘI BỘ ───────────────────────────
-- Chủ dự án chốt: ghi chú Giáo lý viên nhập khi điểm danh **phụ huynh và thiếu
-- nhi không đọc được**, và phải chặn ở tầng cơ sở dữ liệu chứ không chỉ ẩn trên
-- màn hình. Hiện trạng: `attendance-history.tsx` in thẳng cột `note` ra cổng
-- phụ huynh, và ngay cả khi gỡ dòng ấy đi thì một phụ huynh gọi Data API bằng
-- JWT của chính mình vẫn đọc được cột.
--
-- 🔴 **RLS lọc theo DÒNG, không theo CỘT** — đây là lần thứ hai dự án gặp đúng
-- bức tường ấy (D-67/D-129 ở M03-C). Nhưng lời giải **khác** lần trước, và khác
-- vì một lý do cụ thể: ở M03-C, Thủ quỹ **chưa** đọc được dòng nào nên chỉ cần
-- mở một cửa sổ hẹp. Ở đây phụ huynh **đang** đọc đúng dòng của con mình và
-- phải tiếp tục đọc được (AC-F14-1/2/3 ghi rõ *"Portal — giữ nguyên"*, pgTAP
-- `012:280-308` đang canh đúng con số 1 dòng). Cắt nhánh phụ huynh khỏi policy
-- là cắt luôn thẻ tổng kết chuyên cần, vì `v_student_attendance_summary` là
-- `security_invoker` (`20260721000500:98-99`) nên nó cộng bằng quyền của chính
-- người đang xem.
--
-- ⇒ Chặn bằng **quyền cột**: thu quyền `select` mức bảng của `authenticated`
-- rồi cấp lại **từng cột trừ `note`**. Sau bước này không một tài khoản thường
-- nào — kể cả Giáo lý viên — đọc được cột đó qua Data API; ai hỏi tới nó nhận
-- `42501`, chứ không phải một ô trống trông như "em này không có ghi chú".
--
-- 🔴 **BẪY CHO PHIÊN SAU:** quyền cột **không** tự mở rộng. Thêm một cột mới
-- vào `public.student_attendance_records` mà quên `grant select (cột_mới)` thì
-- cột ấy vô hình với toàn bộ ứng dụng, và triệu chứng là `42501` trông hệt lỗi
-- RLS. pgTAP `042` có một bài đối chiếu **danh sách cột đã cấp với danh sách
-- cột của bảng**, nên quên là đỏ ngay, kèm tên cột bị thiếu.
--
-- Đường đọc còn lại của nhân sự là `public.attendance_session_notes` — cửa sổ
-- hẹp `security definer`, mang đúng **ba nhánh nhân sự** của policy hiện hành
-- và **không** có nhánh phụ huynh/thiếu nhi.
--
-- Ghi chú điểm danh **Giáo lý viên** (`staff_attendance_records.note`) giữ
-- nguyên: policy của bảng ấy (`20260721000300:333-342`) chưa từng có nhánh phụ
-- huynh, nên nó không nằm trong đường đi mà D-75 nói tới.
--
-- ── 2. TB-11 · Không nhận đơn xin nghỉ cho buổi ĐÃ CHỐT ─────────────────────
-- Chủ dự án chốt 2026-08-03 (**D-141**): chặn **theo trạng thái buổi**, không
-- chặn theo ngày. `04_TO_BE_FLOWS` §TB-11 và tiêu chí U-09 đề xuất chặn mọi
-- ngày quá khứ ở tầng Zod; phương án ấy **không được chọn** vì nó cắt mất ca
-- thật hay gặp: con ốm sáng Chúa nhật, phụ huynh báo muộn vài giờ, mà Giáo lý
-- viên còn chưa chốt — lúc đó lý do vẫn kịp đổi "vắng không phép" thành "vắng
-- có phép". Đơn chỉ thành rác **sau khi** buổi đã chốt, nên hàng rào đặt đúng
-- ở đó.
--
-- Hàng rào nằm trong trigger `app.validate_absence_request` (`security
-- definer`, nên đọc được `attendance_sessions` bất kể RLS của người gửi) và
-- chỉ áp cho **INSERT**: đơn cũ vi phạm luật mới vẫn tồn tại, không bản ghi nào
-- bị hỏng. Tầng Zod **không** kiểm được điều này — nó không biết buổi đã chốt
-- hay chưa — nên đây là một luật chỉ cơ sở dữ liệu nói được.
--
-- ── 3. Nợ #18 · hàng rào năm học đã đóng cho `absence_requests` ─────────────
-- Bảng cuối cùng của module còn thiếu hàng rào. Khác ba bảng điểm danh ở M05-A:
-- bảng này ghi **thẳng qua policy**, nên ở đây đúng là khuôn một-dòng của M02-C.
--
-- **0 `alter table` · 0 backfill · 0 đổi chữ ký hàm sẵn có.**
-- ============================================================================

-- ── 1. D-75 — quyền cột ─────────────────────────────────────────────────────
-- Thu quyền mức bảng trước: Postgres bỏ qua mọi `revoke` mức cột chừng nào
-- quyền mức bảng còn đó, nên chỉ `revoke select (note)` là một câu lệnh chạy
-- xong mà không đổi được gì.
revoke select on public.student_attendance_records from authenticated;

grant select (
  id,
  attendance_session_id,
  enrollment_id,
  class_id,
  student_id,
  session_finalized_at,
  mass_status,
  catechism_status,
  created_at,
  updated_at,
  updated_by
) on public.student_attendance_records to authenticated;

comment on column public.student_attendance_records.note is
  'D-75: ghi chú NỘI BỘ. `authenticated` KHÔNG có quyền select trên cột này — '
  'thêm cột mới vào bảng phải nhớ grant riêng (pgTAP 042 canh chỗ này). '
  'Đường đọc hợp lệ duy nhất: public.attendance_session_notes().';

-- Cửa sổ hẹp cho nhân sự: đúng ba nhánh nhân sự của
-- `student_attendance_records_select_scope`, không có nhánh phụ huynh.
create or replace function public.attendance_session_notes(p_session_id uuid)
returns table (record_id uuid, note text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_class uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select session.class_id into v_class
  from public.attendance_sessions as session
  where session.id = p_session_id;
  if v_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;

  if not (
    app.can_global_read()
    or v_class = any (app.scope_class_ids())
    or v_class = any (app.staff_class_ids())
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Chỉ trả dòng CÓ ghi chú: hàm này chạy thêm một lượt cho mỗi lần mở trang
  -- buổi, và phần lớn buổi chỉ vài em có ngoại lệ (D-31 "mặc định có mặt").
  return query
    select record.id, record.note
    from public.student_attendance_records as record
    where record.attendance_session_id = p_session_id
      and record.note is not null;
end;
$$;

revoke all on function public.attendance_session_notes(uuid) from public;
grant execute on function public.attendance_session_notes(uuid) to authenticated, service_role;

comment on function public.attendance_session_notes(uuid) is
  'D-75: đường đọc ghi chú điểm danh duy nhất còn lại cho nhân sự của lớp. '
  'Phụ huynh/thiếu nhi nhận FORBIDDEN.';

-- ── 2. TB-11 / D-141 — đơn xin nghỉ cho buổi đã chốt ────────────────────────
-- `create or replace`, giữ nguyên toàn bộ phần còn lại của trigger.
create or replace function app.validate_absence_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  open_class uuid;
  open_year uuid;
  is_owner boolean;
  is_staff boolean;
begin
  if tg_op = 'INSERT' then
    select enrollment.class_id, enrollment.academic_year_id into open_class, open_year
    from public.enrollments as enrollment
    where enrollment.student_id = new.student_id
      and enrollment.status in ('active', 'paused')
    order by enrollment.enrolled_on desc
    limit 1;
    if open_class is null then
      raise exception 'ABSENCE_STUDENT_NOT_ENROLLED' using errcode = '23514';
    end if;

    -- TB-11 / D-141 — buổi đã chốt thì đơn không còn tác dụng gì: nó không tự
    -- sửa điểm danh (D-36) và người điểm danh đã xong việc. Chặn ở đây thay vì
    -- chặn theo ngày, để phụ huynh báo muộn vài giờ vẫn kịp khi buổi còn mở.
    if exists (
      select 1
      from public.attendance_sessions as session
      where session.class_id = open_class
        and session.attendance_date = new.absence_date
        and session.meeting_type = new.meeting_type
        and session.finalized_at is not null
    ) then
      raise exception 'ABSENCE_SESSION_ALREADY_FINALIZED' using errcode = '23514';
    end if;

    new.class_id := open_class;
    new.academic_year_id := open_year;
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;

  -- UPDATE: khóa nghiệp vụ không đổi được.
  if new.student_id <> old.student_id
     or new.absence_date <> old.absence_date
     or new.meeting_type <> old.meeting_type
     or new.class_id <> old.class_id then
    raise exception 'ABSENCE_REQUEST_IMMUTABLE_KEY' using errcode = '23514';
  end if;

  is_owner := app.is_guardian_of_student(new.student_id) or app.is_self_student(new.student_id);
  is_staff := app.can_global_write() or app.is_class_staff(old.class_id)
    or app.can_manage_class(old.class_id);

  if is_staff then
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      raise exception 'ABSENCE_STAFF_CANNOT_CANCEL' using errcode = '42501';
    end if;
    if new.status is distinct from old.status or new.staff_note is distinct from old.staff_note then
      new.reviewed_by := actor;
      new.reviewed_at := now();
    end if;
  elsif is_owner then
    -- Người gửi chỉ được rút đơn khi còn đang chờ; không sửa lý do, không tự duyệt.
    if new.status <> 'cancelled' or old.status <> 'pending' then
      raise exception 'ABSENCE_OWNER_CAN_ONLY_CANCEL' using errcode = '42501';
    end if;
    if new.reason <> old.reason or new.staff_note is distinct from old.staff_note then
      raise exception 'ABSENCE_OWNER_CANNOT_EDIT' using errcode = '42501';
    end if;
  else
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  new.updated_by := actor;
  return new;
end;
$$;

-- ── 3. Nợ #18 · năm học đã đóng thì không nhận đơn xin nghỉ mới ─────────────
-- Ở M05-A hàng rào phải nằm TRONG bốn RPC vì ba bảng điểm danh chỉ ghi được qua
-- `security definer`. `absence_requests` thì ngược lại: `authenticated` có
-- `insert`/`update` thẳng trên bảng, nên ở đây đúng là khuôn một-dòng của M02-C
-- (D-118). Bài học của nợ #18 giữ nguyên giá trị và cũng nằm ở chính chỗ này:
-- **xem bảng đó ghi bằng đường nào TRƯỚC khi chọn chỗ đặt hàng rào.**
--
-- Ghi chú 2 của `20260726000200` áp nguyên: UPDATE phải có hàng rào ở **cả**
-- `using`, không chỉ `with check` — nếu không thì `update … set status =
-- status` trên một dòng của năm đã đóng vẫn đi lọt.
--
-- D-117 vẫn đứng: `app.writable_academic_year_ids()` cho Super Admin mọi năm.
drop policy absence_requests_insert_guardian on public.absence_requests;
create policy absence_requests_insert_guardian
on public.absence_requests for insert to authenticated
with check (
  created_by = (select auth.uid())
  and app.is_guardian_of_student(student_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy absence_requests_update_scope on public.absence_requests;
create policy absence_requests_update_scope
on public.absence_requests for update to authenticated
using (
  (
    (select app.can_global_write())
    or class_id = any ((select app.staff_class_ids())::uuid[])
    or student_id = any ((select app.own_student_ids())::uuid[])
  )
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  (
    (select app.can_global_write())
    or class_id = any ((select app.staff_class_ids())::uuid[])
    or student_id = any ((select app.own_student_ids())::uuid[])
  )
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

-- Khuôn của `20260721000300:793-794` và M05-A: lặp lại grant cho chắc, kể cả
-- khi `create or replace` đã giữ nguyên quyền.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
