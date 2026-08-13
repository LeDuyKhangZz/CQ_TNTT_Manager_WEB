-- ============================================================================
-- M05-A · TB-04 / TB-07 · nợ #18 · nợ #19 (D-140) — bốn việc trong MỘT migration.
--
-- Toàn bộ là `create or replace`: không `alter table`, không `create table`,
-- không backfill, không đổi enum, không đụng một dòng dữ liệu nào. Chữ ký của
-- cả bốn hàm giữ nguyên tuyệt đối ⇒ `src/types/database.ts` KHÔNG phải sinh lại
-- (`07_IMPLEMENTATION_IMPACT.md` §2.2).
--
-- 🔴 Vì sao KHÔNG dùng `drop function`: bài học M12-C (`20260803000100`) — drop
-- mang theo mọi `grant`, và quên cấp lại là gãy toàn bộ luồng với triệu chứng
-- `42501` trông hệt lỗi RLS. `create or replace` giữ nguyên quyền. Migration
-- vẫn lặp lại `grant execute` ở cuối cho khớp khuôn `20260721000300:793-794`.
--
-- ── 1. TB-07 · Một em rời lớp KHÔNG được khóa cứng cả buổi ──────────────────
-- `app.sync_student_attendance_keys` áp điều kiện "ghi danh còn mở tại ngày
-- buổi" cho **cả UPDATE**, mà finalize thì update MỌI dòng để đặt
-- `session_finalized_at`. Hệ quả: đóng ghi danh của một em với `ended_on` lùi
-- về trước ngày buổi là **không ai lưu hay chốt được buổi cũ nữa** — và câu
-- báo lỗi chỉ nói "Thao tác bị xung đột. Vui lòng thử lại.", nên người dùng
-- thử lại mãi. Nay điều kiện ấy chỉ áp cho INSERT.
-- *Lý do nghiệp vụ:* dòng đã tồn tại nghĩa là tại thời điểm điểm danh em ĐANG
-- thuộc lớp. Ghi danh đóng lại **sau đó** là sự kiện của tương lai; nó không
-- được phép viết lại lịch sử của một buổi đã diễn ra.
-- Hai kiểm tra còn lại giữ nguyên cho cả hai thao tác: khóa bất biến và
-- "ghi danh phải cùng lớp với buổi".
--
-- ── 2. D-140 · Em "Tạm nghỉ" ra khỏi danh sách điểm danh (nợ #19) ───────────
-- Chủ dự án chốt 2026-08-03. Từ M03-A trạng thái "Tạm nghỉ" mới thật sự dùng
-- được, và M03-C thêm cửa vào thứ hai (D-130), nên số em ở trạng thái ấy sẽ
-- tăng. Ghép với luật "điểm danh mặc định có mặt" (D-31), một em nghỉ dài ngày
-- được ghi **có mặt** nếu người điểm danh không để ý ⇒ chuyên cần của lớp đẹp
-- hơn sự thật, và điểm chuyên cần (M07) sinh ra từ đúng con số sai đó.
--
-- 🔴 Sửa `seed_attendance_roster` mà KHÔNG sửa phép đếm `roster_size` trong
-- `save_and_finalize_attendance` là gãy chức năng chốt: hai bên dùng hai định
-- nghĩa "ai thuộc danh sách", `record_size < roster_size` thành đúng, và mọi
-- lớp có một em tạm nghỉ **không chốt được buổi nào nữa** với thông điệp
-- "Danh sách chưa đủ" — vô nghĩa với người đọc. Vì vậy luật chuyển hẳn vào một
-- hàm dùng chung: `app.attendance_roster_enrollments`.
--
-- ── 3. TB-04 · Ba nguyên nhân, ba mã lỗi ────────────────────────────────────
-- `editing_by is distinct from actor or last_activity_at is null or lease hết`
-- là MỘT điều kiện gộp ba tình huống. Nặng nhất: finalize xóa `editing_by`
-- (`20260721000300:710`), nên bấm "Hoàn tất" hai lần (nhấp đúp, mạng chậm,
-- thử lại) báo "đang có người khác phụ trách" trong khi không có ai cả.
-- `ATTENDANCE_ALREADY_CLAIMED` **giữ nguyên** cho đúng ca bị tiếp quản — pgTAP
-- `012:192-199` đang assert chính chuỗi đó, và nó phải ở nguyên màu xanh.
--
-- ── 4. Nợ #18 · Năm học đã đóng thì không ghi điểm danh ─────────────────────
-- D-118 (2026-07-26) dựng hàng rào cho `enrollments` và `classes`, và ghi rõ
-- điểm danh CHƯA có, để lại thành nợ. Hôm nay tới lượt M05.
--
-- 🔴 Ở module này hàng rào **KHÔNG đặt được vào policy** như M02-C đã làm.
-- `authenticated` không hề có `insert/update` trên ba bảng điểm danh
-- (`20260721000300:283-285`): mọi đường ghi đi qua RPC `security definer`, mà
-- definer chạy dưới quyền chủ hàm nên **bỏ qua RLS**. Thêm một dòng vào policy
-- là thêm một dòng không bao giờ được chạy — hàng rào giả. Vì vậy hàng rào nằm
-- trong chính RPC, dùng đúng helper của D-117 nên Super Admin vẫn sửa được
-- năm đã đóng (WF-16 bước 5).
-- ============================================================================

-- ── Ai thuộc danh sách điểm danh của một buổi — MỘT định nghĩa duy nhất ─────
create or replace function app.attendance_roster_enrollments(
  p_class_id uuid,
  p_date date
)
returns table (enrollment_id uuid, student_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select enrollment.id, enrollment.student_id
  from public.enrollments as enrollment
  where enrollment.class_id = p_class_id
    and enrollment.enrolled_on <= p_date
    -- D-140: em đang tạm nghỉ KHÔNG có tên trong danh sách điểm danh. Trang
    -- buổi nói ra số em ấy để không ai tưởng hệ thống làm mất em.
    and enrollment.status <> 'paused'
    and (
      (enrollment.status = 'active' and enrollment.ended_on is null)
      or (enrollment.ended_on is not null and enrollment.ended_on >= p_date)
    )
$$;

revoke all on function app.attendance_roster_enrollments(uuid, date) from public, anon;

comment on function app.attendance_roster_enrollments(uuid, date) is
  'D-140/M05-A: ghi danh có tên trong danh sách điểm danh của một buổi. Dùng CHUNG '
  'bởi app.seed_attendance_roster và phép đếm roster_size khi chốt — hai định nghĩa '
  'lệch nhau nghĩa là lớp có em tạm nghỉ không chốt được buổi nào.';

-- ── 1. Trigger khóa phi chuẩn hóa — TB-07 ──────────────────────────────────
create or replace function app.sync_student_attendance_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_class uuid;
  session_date date;
  session_finalized timestamptz;
  enrollment_class uuid;
  enrollment_student uuid;
  enrollment_ok boolean;
begin
  if tg_op = 'UPDATE'
     and (new.attendance_session_id <> old.attendance_session_id
          or new.enrollment_id <> old.enrollment_id) then
    raise exception 'ATTENDANCE_RECORD_IMMUTABLE_KEY' using errcode = '23514';
  end if;

  select class_id, attendance_date, finalized_at
    into session_class, session_date, session_finalized
  from public.attendance_sessions where id = new.attendance_session_id;
  if session_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;

  select enrollment.class_id,
         enrollment.student_id,
         enrollment.enrolled_on <= session_date
           and (
             (enrollment.status in ('active', 'paused') and enrollment.ended_on is null)
             or (enrollment.ended_on is not null and enrollment.ended_on >= session_date)
           )
    into enrollment_class, enrollment_student, enrollment_ok
  from public.enrollments as enrollment where enrollment.id = new.enrollment_id;
  if enrollment_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  -- Giữ cho CẢ HAI thao tác: một dòng không bao giờ được trỏ sang lớp khác.
  if enrollment_class <> session_class then
    raise exception 'ATTENDANCE_ENROLLMENT_CLASS_MISMATCH' using errcode = '23514';
  end if;
  -- TB-07: chỉ chặn khi TẠO dòng mới. Xem ghi chú 1 ở đầu file.
  if tg_op = 'INSERT' and not enrollment_ok then
    raise exception 'ATTENDANCE_ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;

  new.class_id := session_class;
  new.student_id := enrollment_student;
  new.session_finalized_at := session_finalized;
  return new;
end;
$$;

-- ── 2. Seed danh sách — D-140 ──────────────────────────────────────────────
create or replace function app.seed_attendance_roster(p_session_id uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_class uuid;
  session_date date;
begin
  select class_id, attendance_date into session_class, session_date
  from public.attendance_sessions where id = p_session_id;
  if session_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;

  insert into public.student_attendance_records
    (attendance_session_id, enrollment_id, class_id, student_id, mass_status, catechism_status, updated_by)
  select p_session_id, roster.enrollment_id, session_class, roster.student_id, 'present', 'present', p_actor
  from app.attendance_roster_enrollments(session_class, session_date) as roster
  on conflict (attendance_session_id, enrollment_id) do nothing;

  insert into public.staff_attendance_records
    (attendance_session_id, class_staff_assignment_id, class_id, staff_profile_id, status, updated_by)
  select p_session_id, assignment.id, session_class, assignment.staff_profile_id, 'present', p_actor
  from public.class_staff_assignments as assignment
  where assignment.class_id = session_class
    and assignment.is_active
    and assignment.starts_on <= session_date
    and (assignment.ends_on is null or assignment.ends_on >= session_date)
  on conflict (attendance_session_id, class_staff_assignment_id) do nothing;
end;
$$;

-- ── 3 + 4. RPC claim — hàng rào năm học đã đóng ────────────────────────────
create or replace function public.claim_attendance_session(
  p_class_id uuid,
  p_date date,
  p_meeting_type public.meeting_type
)
returns table (
  out_session_id uuid,
  out_claimed boolean,
  out_editor_profile_id uuid,
  out_editor_display_name text,
  out_lease_expires_at timestamptz,
  out_status public.attendance_session_status,
  out_locked boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  class_year uuid;
  class_state public.class_status;
  lease_minutes smallint;
  lock_days smallint;
  session_row public.attendance_sessions;
  lease_free boolean;
  is_locked boolean;
begin
  if actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if not app.can_edit_attendance(p_class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not (
    (p_meeting_type = 'thursday' and extract(isodow from p_date) = 4)
    or (p_meeting_type = 'sunday' and extract(isodow from p_date) = 7)
  ) then
    raise exception 'ATTENDANCE_INVALID_MEETING_DAY' using errcode = '23514';
  end if;

  select class.academic_year_id, class.status into class_year, class_state
  from public.classes as class where class.id = p_class_id;
  if class_year is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  if class_state <> 'active' then
    raise exception 'CLASS_NOT_ACTIVE' using errcode = '23514';
  end if;
  -- Nợ #18 / D-117 / D-118: năm đã đóng thì không mở buổi mới được nữa;
  -- Super Admin là ngoại lệ duy nhất, đã nằm sẵn trong helper.
  if not (class_year = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '23514';
  end if;

  select year.attendance_edit_lease_minutes, year.attendance_lock_days
    into lease_minutes, lock_days
  from public.academic_years as year where year.id = class_year;

  insert into public.attendance_sessions
    (class_id, academic_year_id, attendance_date, meeting_type, updated_by)
  values (p_class_id, class_year, p_date, p_meeting_type, actor)
  on conflict (class_id, attendance_date, meeting_type) do nothing;

  select * into session_row from public.attendance_sessions
  where class_id = p_class_id and attendance_date = p_date and meeting_type = p_meeting_type
  for update;

  is_locked := session_row.status = 'locked'
    or (session_row.locked_at is not null and now() >= session_row.locked_at);
  if is_locked and not app.is_super_admin() then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;
  if session_row.unlocked_at is not null and not app.is_super_admin() then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;

  lease_free := session_row.editing_by is null
    or session_row.editing_by = actor
    or session_row.last_activity_at is null
    or session_row.last_activity_at + make_interval(mins => lease_minutes) <= now();

  if lease_free then
    update public.attendance_sessions
    set editing_by = actor,
        editing_started_at = now(),
        last_activity_at = now(),
        status = case when status in ('open', 'in_progress') then 'in_progress' else status end,
        updated_by = actor
    where id = session_row.id
    returning * into session_row;

    perform app.seed_attendance_roster(session_row.id, actor);
  end if;

  return query
  select session_row.id,
         lease_free,
         session_row.editing_by,
         coalesce(editor.display_name, ''),
         session_row.last_activity_at + make_interval(mins => lease_minutes),
         session_row.status,
         is_locked
  from (select 1) as ignored
  left join public.profiles as editor on editor.id = session_row.editing_by;
end;
$$;

-- ── 3 + 4. RPC heartbeat — tách ba nhánh lỗi + hàng rào năm học ────────────
create or replace function public.heartbeat_attendance_session(p_session_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  session_row public.attendance_sessions;
  lease_minutes smallint;
begin
  if actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select * into session_row from public.attendance_sessions where id = p_session_id for update;
  if session_row.id is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  if not app.can_edit_attendance(session_row.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not (session_row.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '23514';
  end if;

  select year.attendance_edit_lease_minutes into lease_minutes
  from public.academic_years as year where year.id = session_row.academic_year_id;

  -- TB-04. Thứ tự nhánh là thứ tự của sự thật: "không ai giữ" phải được nói
  -- trước, vì nếu để nhánh gộp cũ chạy thì nó gọi tên một người không có.
  if session_row.editing_by is null then
    raise exception 'ATTENDANCE_SESSION_NOT_CLAIMED' using errcode = '55006';
  end if;
  if session_row.editing_by <> actor then
    raise exception 'ATTENDANCE_ALREADY_CLAIMED' using errcode = '55006';
  end if;
  if session_row.last_activity_at is null
     or session_row.last_activity_at + make_interval(mins => lease_minutes) <= now() then
    raise exception 'ATTENDANCE_LEASE_EXPIRED' using errcode = '55006';
  end if;

  update public.attendance_sessions
  set last_activity_at = now(), updated_by = actor
  where id = p_session_id;

  return now() + make_interval(mins => lease_minutes);
end;
$$;

-- ── 4. RPC takeover — hàng rào năm học ─────────────────────────────────────
create or replace function public.takeover_attendance_session(p_session_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  session_row public.attendance_sessions;
  lease_minutes smallint;
begin
  if actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select * into session_row from public.attendance_sessions where id = p_session_id for update;
  if session_row.id is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  if not app.can_edit_attendance(session_row.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if session_row.status = 'locked'
     or (session_row.locked_at is not null and now() >= session_row.locked_at) then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;
  if session_row.unlocked_at is not null and not app.is_super_admin() then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;
  if not (session_row.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '23514';
  end if;

  select year.attendance_edit_lease_minutes into lease_minutes
  from public.academic_years as year where year.id = session_row.academic_year_id;

  if session_row.editing_by is not null
     and session_row.editing_by <> actor
     and session_row.last_activity_at is not null
     and session_row.last_activity_at + make_interval(mins => lease_minutes) > now() then
    raise exception 'LEASE_NOT_EXPIRED' using errcode = '55006';
  end if;

  update public.attendance_sessions
  set editing_by = actor,
      editing_started_at = now(),
      last_activity_at = now(),
      status = case when status in ('open', 'in_progress') then 'in_progress' else status end,
      updated_by = actor
  where id = p_session_id;

  perform app.seed_attendance_roster(p_session_id, actor);
  return now() + make_interval(mins => lease_minutes);
end;
$$;

-- ── 2 + 3 + 4. RPC save / finalize ─────────────────────────────────────────
create or replace function public.save_and_finalize_attendance(
  p_session_id uuid,
  p_students jsonb,
  p_staff jsonb,
  p_finalize boolean
)
returns table (
  out_session_id uuid,
  out_status public.attendance_session_status,
  out_finalized_at timestamptz,
  out_locked_at timestamptz,
  out_student_total integer,
  out_student_present integer,
  out_student_absent integer,
  out_staff_total integer,
  out_staff_present integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  session_row public.attendance_sessions;
  lease_minutes smallint;
  lock_days smallint;
  roster_size integer;
  record_size integer;
begin
  if actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select * into session_row from public.attendance_sessions where id = p_session_id for update;
  if session_row.id is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  if not app.can_edit_attendance(session_row.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if session_row.status = 'locked'
     or (session_row.locked_at is not null and now() >= session_row.locked_at) then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;
  if session_row.unlocked_at is not null and not app.is_super_admin() then
    raise exception 'ATTENDANCE_LOCKED' using errcode = '42501';
  end if;
  if not (session_row.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '23514';
  end if;

  select year.attendance_edit_lease_minutes, year.attendance_lock_days
    into lease_minutes, lock_days
  from public.academic_years as year where year.id = session_row.academic_year_id;

  -- TB-04. `ATTENDANCE_ALREADY_CLAIMED` giữ nguyên cho đúng ca "bị tiếp quản"
  -- mà pgTAP 012:192-199 đang canh; hai ca còn lại tách ra mã riêng.
  if session_row.editing_by is null then
    raise exception 'ATTENDANCE_SESSION_NOT_CLAIMED' using errcode = '55006';
  end if;
  if session_row.editing_by <> actor then
    raise exception 'ATTENDANCE_ALREADY_CLAIMED' using errcode = '55006';
  end if;
  if session_row.last_activity_at is null
     or session_row.last_activity_at + make_interval(mins => lease_minutes) <= now() then
    raise exception 'ATTENDANCE_LEASE_EXPIRED' using errcode = '55006';
  end if;

  perform app.seed_attendance_roster(p_session_id, actor);

  update public.student_attendance_records as record
  set mass_status = payload.mass_status,
      catechism_status = payload.catechism_status,
      note = nullif(btrim(coalesce(payload.note, '')), ''),
      updated_by = actor
  from jsonb_to_recordset(coalesce(p_students, '[]'::jsonb)) as payload(
    enrollment_id uuid,
    mass_status public.attendance_status,
    catechism_status public.attendance_status,
    note text
  )
  where record.attendance_session_id = p_session_id
    and record.enrollment_id = payload.enrollment_id;

  update public.staff_attendance_records as record
  set status = payload.status,
      note = nullif(btrim(coalesce(payload.note, '')), ''),
      updated_by = actor
  from jsonb_to_recordset(coalesce(p_staff, '[]'::jsonb)) as payload(
    class_staff_assignment_id uuid,
    status public.staff_attendance_status,
    note text
  )
  where record.attendance_session_id = p_session_id
    and record.class_staff_assignment_id = payload.class_staff_assignment_id;

  if p_finalize then
    -- D-140: đếm bằng ĐÚNG hàm mà seed dùng. Xem ghi chú 2 ở đầu file.
    select count(*) into roster_size
    from app.attendance_roster_enrollments(session_row.class_id, session_row.attendance_date);
    select count(*) into record_size
    from public.student_attendance_records where attendance_session_id = p_session_id;
    if record_size < roster_size then
      raise exception 'ATTENDANCE_ROSTER_INCOMPLETE' using errcode = '23514';
    end if;

    update public.attendance_sessions
    set status = 'completed',
        finalized_at = coalesce(finalized_at, now()),
        finalized_by = coalesce(finalized_by, actor),
        locked_at = coalesce(finalized_at, now()) + make_interval(days => lock_days),
        unlocked_at = null,
        unlocked_by = null,
        editing_by = null,
        editing_started_at = null,
        updated_by = actor
    where id = p_session_id
    returning * into session_row;

    update public.student_attendance_records
    set session_finalized_at = session_row.finalized_at
    where attendance_session_id = p_session_id
      and session_finalized_at is distinct from session_row.finalized_at;
    update public.staff_attendance_records
    set session_finalized_at = session_row.finalized_at
    where attendance_session_id = p_session_id
      and session_finalized_at is distinct from session_row.finalized_at;
  else
    update public.attendance_sessions
    set last_activity_at = now(), updated_by = actor
    where id = p_session_id
    returning * into session_row;
  end if;

  return query
  select session_row.id,
         session_row.status,
         session_row.finalized_at,
         session_row.locked_at,
         (select count(*)::integer from public.student_attendance_records
           where attendance_session_id = p_session_id),
         (select count(*)::integer from public.student_attendance_records
           where attendance_session_id = p_session_id
             and mass_status = 'present' and catechism_status = 'present'),
         (select count(*)::integer from public.student_attendance_records
           where attendance_session_id = p_session_id
             and (mass_status in ('excused_absence', 'unexcused_absence')
                  or catechism_status in ('excused_absence', 'unexcused_absence'))),
         (select count(*)::integer from public.staff_attendance_records
           where attendance_session_id = p_session_id),
         (select count(*)::integer from public.staff_attendance_records
           where attendance_session_id = p_session_id and status = 'present');
end;
$$;

-- `create or replace` giữ nguyên quyền, nhưng lặp lại cho khớp khuôn hiện có và
-- để hàm mới `attendance_roster_enrollments` cũng được cấp.
grant execute on function
  public.claim_attendance_session(uuid, date, public.meeting_type),
  public.heartbeat_attendance_session(uuid),
  public.takeover_attendance_session(uuid),
  public.save_and_finalize_attendance(uuid, jsonb, jsonb, boolean)
to authenticated, service_role;

grant execute on all functions in schema app to authenticated, service_role;

comment on function public.heartbeat_attendance_session(uuid) is
  'TB-04: gia hạn phiên chỉnh sửa. Ba nguyên nhân từ chối có ba mã riêng — '
  'ATTENDANCE_SESSION_NOT_CLAIMED (không ai giữ) · ATTENDANCE_ALREADY_CLAIMED '
  '(người khác giữ) · ATTENDANCE_LEASE_EXPIRED (phiên của chính mình hết hạn).';

comment on function public.save_and_finalize_attendance(uuid, jsonb, jsonb, boolean) is
  'Lối ghi duy nhất cho lưu nháp và chốt. M05-A thêm: ba mã lỗi phiên chỉnh sửa '
  '(TB-04), hàng rào năm học đã đóng (nợ #18, D-117 miễn cho Super Admin), và '
  'roster_size đếm bằng app.attendance_roster_enrollments (D-140).';
