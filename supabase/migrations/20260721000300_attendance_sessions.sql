-- ============================================================================
-- P3-T1 — Attendance session, editing lease and 3-day lock.
--
-- Nguồn: docs/02 §7.1–7.3, docs/03 WF-05, docs/05 §5+§6, docs/11 §6,
-- quyết định D-29..D-36.
--
-- Ba điểm thiết kế cần biết trước khi đọc:
--
-- 1. **Mọi thao tác ghi đi qua RPC.** `authenticated` chỉ được SELECT trên ba
--    bảng dưới. Điểm danh là ghi nhiều dòng có tranh chấp editor, nên phải khóa
--    dòng session rồi mới ghi (AGENTS §6). Không có policy INSERT/UPDATE cho
--    authenticated — không phải quên, mà là cố ý.
--
-- 2. **Cột phi chuẩn hóa cho RLS.** Bản ghi điểm danh mang sẵn `class_id`,
--    `student_id` (hoặc `staff_profile_id`) và `session_finalized_at`. Gate
--    Phase 2 đã đo được rằng policy gọi hàm theo từng dòng làm bảng 900 dòng
--    mất 2,4 s; policy ở đây vì vậy chỉ so cột với mảng phạm vi tính một lần.
--    Trigger `app.sync_attendance_record_keys` giữ các cột này đúng và chặn
--    client đổi session/enrollment qua update (docs/02 §7.2).
--
-- 3. **Khóa tính theo giờ DB.** Lease và lock không bao giờ tin thời gian
--    client (WF-05 “Tiếp quản”). `attendance_edit_lease_minutes` và
--    `attendance_lock_days` đọc từ `academic_years`, không hardcode (D-32/D-33).
-- ============================================================================

create type public.attendance_session_status as enum (
  'open',
  'in_progress',
  'completed',
  'locked'
);

create table public.attendance_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  attendance_date date not null,
  meeting_type public.meeting_type not null,
  status public.attendance_session_status not null default 'open',
  editing_by uuid references public.profiles(id) on delete set null,
  editing_started_at timestamptz,
  last_activity_at timestamptz,
  finalized_at timestamptz,
  finalized_by uuid references public.profiles(id) on delete set null,
  locked_at timestamptz,
  -- Super Admin mở khóa (D-33). Còn khác null nghĩa là buổi này đang ở chế độ
  -- chỉ Super Admin được sửa; finalize lại sẽ xóa cờ và đặt lock mới.
  unlocked_at timestamptz,
  unlocked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint attendance_sessions_unique unique (class_id, attendance_date, meeting_type),
  -- D-29: chỉ thứ Năm và Chúa nhật. isodow: thứ Năm = 4, Chúa nhật = 7.
  constraint attendance_sessions_meeting_day check (
    (meeting_type = 'thursday' and extract(isodow from attendance_date) = 4)
    or (meeting_type = 'sunday' and extract(isodow from attendance_date) = 7)
  ),
  constraint attendance_sessions_editor_pair check (
    (editing_by is null) = (editing_started_at is null)
  ),
  constraint attendance_sessions_finalized_shape check (
    (finalized_at is null) = (finalized_by is null)
  ),
  constraint attendance_sessions_completed_needs_finalize check (
    status <> 'completed' or finalized_at is not null
  )
);

create index attendance_sessions_class_date_idx
  on public.attendance_sessions (class_id, attendance_date);
create index attendance_sessions_year_idx
  on public.attendance_sessions (academic_year_id, attendance_date);

create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function app.set_updated_at();

create table public.student_attendance_records (
  id uuid primary key default extensions.gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  -- Phi chuẩn hóa cho RLS; trigger giữ đồng bộ, client không đặt được.
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  session_finalized_at timestamptz,
  mass_status public.attendance_status not null default 'present',
  catechism_status public.attendance_status not null default 'present',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint student_attendance_records_unique unique (attendance_session_id, enrollment_id)
);

create index student_attendance_records_student_idx
  on public.student_attendance_records (student_id, session_finalized_at);
create index student_attendance_records_class_idx
  on public.student_attendance_records (class_id);
create index student_attendance_records_enrollment_idx
  on public.student_attendance_records (enrollment_id);

create trigger student_attendance_records_set_updated_at
before update on public.student_attendance_records
for each row execute function app.set_updated_at();

create table public.staff_attendance_records (
  id uuid primary key default extensions.gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  class_staff_assignment_id uuid not null references public.class_staff_assignments(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  session_finalized_at timestamptz,
  status public.staff_attendance_status not null default 'present',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint staff_attendance_records_unique unique (attendance_session_id, class_staff_assignment_id)
);

create index staff_attendance_records_staff_idx
  on public.staff_attendance_records (staff_profile_id);
create index staff_attendance_records_class_idx
  on public.staff_attendance_records (class_id);

create trigger staff_attendance_records_set_updated_at
before update on public.staff_attendance_records
for each row execute function app.set_updated_at();

-- ── Trigger giữ khóa phi chuẩn hóa đúng ─────────────────────────────────────
-- Đây cũng là chỗ hiện thực ba ràng buộc docs/02 §7.2: enrollment phải thuộc
-- lớp của session, enrollment phải đang mở tại ngày điểm danh, và client không
-- được đổi session/enrollment của một dòng đã có.

create function app.sync_student_attendance_keys()
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
  if enrollment_class <> session_class then
    raise exception 'ATTENDANCE_ENROLLMENT_CLASS_MISMATCH' using errcode = '23514';
  end if;
  if not enrollment_ok then
    raise exception 'ATTENDANCE_ENROLLMENT_NOT_OPEN' using errcode = '23514';
  end if;

  new.class_id := session_class;
  new.student_id := enrollment_student;
  new.session_finalized_at := session_finalized;
  return new;
end;
$$;

create trigger student_attendance_records_sync_keys
before insert or update on public.student_attendance_records
for each row execute function app.sync_student_attendance_keys();

create function app.sync_staff_attendance_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_class uuid;
  session_finalized timestamptz;
  assignment_class uuid;
  assignment_staff uuid;
begin
  if tg_op = 'UPDATE'
     and (new.attendance_session_id <> old.attendance_session_id
          or new.class_staff_assignment_id <> old.class_staff_assignment_id) then
    raise exception 'ATTENDANCE_RECORD_IMMUTABLE_KEY' using errcode = '23514';
  end if;

  select class_id, finalized_at into session_class, session_finalized
  from public.attendance_sessions where id = new.attendance_session_id;
  if session_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;

  select class_id, staff_profile_id into assignment_class, assignment_staff
  from public.class_staff_assignments where id = new.class_staff_assignment_id;
  if assignment_class is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
  if assignment_class <> session_class then
    raise exception 'ATTENDANCE_ASSIGNMENT_CLASS_MISMATCH' using errcode = '23514';
  end if;

  new.class_id := session_class;
  new.staff_profile_id := assignment_staff;
  new.session_finalized_at := session_finalized;
  return new;
end;
$$;

create trigger staff_attendance_records_sync_keys
before insert or update on public.staff_attendance_records
for each row execute function app.sync_staff_attendance_keys();

-- ── Helper phạm vi ──────────────────────────────────────────────────────────

-- Lớp mà người đăng nhập được trực tiếp điểm danh. docs/05 §4.6 chốt rõ: trưởng
-- ngành CHỈ điểm danh ở lớp mình có class_staff_assignment, không phải mọi lớp
-- trong ngành. Vì vậy hàm này bằng app.staff_class_ids() cộng Super Admin
-- (D-33 cho phép SA sửa buổi đã khóa).
create function app.can_edit_attendance(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.is_super_admin() or app.is_class_staff(target_class_id), false)
$$;

-- Buổi đã khóa theo giờ DB. Trạng thái 'locked' là chốt tay; ngoài ra buổi tự
-- khóa khi qua mốc locked_at (D-33).
create function app.attendance_is_locked(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select session.status = 'locked'
        or (session.locked_at is not null and now() >= session.locked_at)
     from public.attendance_sessions as session
     where session.id = target_session_id),
    false
  )
$$;

grant execute on function
  app.can_edit_attendance(uuid),
  app.attendance_is_locked(uuid)
to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Chỉ cấp SELECT cho authenticated. Ghi đi qua RPC SECURITY DEFINER bên dưới.

alter table public.attendance_sessions enable row level security;
alter table public.student_attendance_records enable row level security;
alter table public.staff_attendance_records enable row level security;

grant select on public.attendance_sessions to authenticated;
grant select on public.student_attendance_records to authenticated;
grant select on public.staff_attendance_records to authenticated;
grant all on public.attendance_sessions to service_role;
grant all on public.student_attendance_records to service_role;
grant all on public.staff_attendance_records to service_role;

-- Lớp có con/chính mình đang ghi danh — để phụ huynh/thiếu nhi thấy được buổi
-- điểm danh đã chốt của lớp đó, và chỉ buổi đã chốt.
create function app.own_student_class_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct enrollment.class_id), '{}'::uuid[])
  from public.enrollments as enrollment
  where enrollment.student_id = any (app.own_student_ids())
$$;

grant execute on function app.own_student_class_ids() to authenticated;

create policy attendance_sessions_select_scope
on public.attendance_sessions for select to authenticated
using (
  (select app.can_global_read())
  or class_id = any ((select app.scope_class_ids())::uuid[])
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or (
    finalized_at is not null
    and class_id = any ((select app.own_student_class_ids())::uuid[])
  )
);

-- Phụ huynh/thiếu nhi: chỉ dòng của mình VÀ chỉ sau khi buổi được chốt
-- (docs/05 §6 “Guardian/student select own records only after finalized”).
create policy student_attendance_records_select_scope
on public.student_attendance_records for select to authenticated
using (
  (select app.can_global_read())
  or class_id = any ((select app.scope_class_ids())::uuid[])
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or (
    session_finalized_at is not null
    and student_id = any ((select app.own_student_ids())::uuid[])
  )
);

-- Điểm danh GLV không mở cho phụ huynh/thiếu nhi.
create policy staff_attendance_records_select_scope
on public.staff_attendance_records for select to authenticated
using (
  (select app.can_global_read())
  or class_id = any ((select app.scope_class_ids())::uuid[])
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or staff_profile_id in (
    select staff.id from public.staff_profiles as staff where staff.profile_id = (select auth.uid())
  )
);

-- ── Seed roster: mặc định present (D-31) ────────────────────────────────────
-- Gọi khi claim và một lần nữa khi finalize, nên em ghi danh giữa chừng vẫn có
-- dòng. `on conflict do nothing` giữ nguyên các ngoại lệ người dùng đã sửa.

create function app.seed_attendance_roster(p_session_id uuid, p_actor uuid)
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
  select p_session_id, enrollment.id, session_class, enrollment.student_id, 'present', 'present', p_actor
  from public.enrollments as enrollment
  where enrollment.class_id = session_class
    and enrollment.enrolled_on <= session_date
    and (
      (enrollment.status in ('active', 'paused') and enrollment.ended_on is null)
      or (enrollment.ended_on is not null and enrollment.ended_on >= session_date)
    )
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

-- ── RPC claim ───────────────────────────────────────────────────────────────

create function public.claim_attendance_session(
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
  -- Cùng luật với constraint attendance_sessions_meeting_day, nhưng ném mã ổn
  -- định để UI dịch được thay vì lộ tên constraint (D-29).
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
  -- Sau khi Super Admin mở khóa, buổi này chỉ Super Admin được sửa (D-33).
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

-- ── RPC heartbeat ───────────────────────────────────────────────────────────

create function public.heartbeat_attendance_session(p_session_id uuid)
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

  select year.attendance_edit_lease_minutes into lease_minutes
  from public.academic_years as year where year.id = session_row.academic_year_id;

  -- Editor cũ đã bị tiếp quản, hoặc lease đã hết: không gia hạn được nữa.
  if session_row.editing_by is distinct from actor
     or session_row.last_activity_at is null
     or session_row.last_activity_at + make_interval(mins => lease_minutes) <= now() then
    raise exception 'ATTENDANCE_ALREADY_CLAIMED' using errcode = '55006';
  end if;

  update public.attendance_sessions
  set last_activity_at = now(), updated_by = actor
  where id = p_session_id;

  return now() + make_interval(mins => lease_minutes);
end;
$$;

-- ── RPC takeover ────────────────────────────────────────────────────────────

create function public.takeover_attendance_session(p_session_id uuid)
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

  select year.attendance_edit_lease_minutes into lease_minutes
  from public.academic_years as year where year.id = session_row.academic_year_id;

  -- Giờ DB quyết định, không tin client (WF-05 “Tiếp quản”).
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

-- ── RPC save / finalize ─────────────────────────────────────────────────────
-- Một lối ghi duy nhất cho cả lưu nháp và hoàn tất (docs/11 §6). Nhận đúng
-- những dòng người dùng đổi; phần còn lại đã là `present` từ lúc seed.

create function public.save_and_finalize_attendance(
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

  select year.attendance_edit_lease_minutes, year.attendance_lock_days
    into lease_minutes, lock_days
  from public.academic_years as year where year.id = session_row.academic_year_id;

  -- Editor cũ sau khi bị tiếp quản không ghi đè được (docs/07 §6).
  if session_row.editing_by is distinct from actor
     or session_row.last_activity_at is null
     or session_row.last_activity_at + make_interval(mins => lease_minutes) <= now() then
    raise exception 'ATTENDANCE_ALREADY_CLAIMED' using errcode = '55006';
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
    -- Roster phải đủ trước khi chốt (docs/07 §6 “Finalize creates complete roster”).
    select count(*) into roster_size
    from public.enrollments as enrollment
    where enrollment.class_id = session_row.class_id
      and enrollment.enrolled_on <= session_row.attendance_date
      and (
        (enrollment.status in ('active', 'paused') and enrollment.ended_on is null)
        or (enrollment.ended_on is not null and enrollment.ended_on >= session_row.attendance_date)
      );
    select count(*) into record_size
    from public.student_attendance_records where attendance_session_id = p_session_id;
    if record_size < roster_size then
      raise exception 'ATTENDANCE_ROSTER_INCOMPLETE' using errcode = '23514';
    end if;

    update public.attendance_sessions
    set status = 'completed',
        -- Giữ lần chốt đầu tiên: chốt lại không đẩy lùi mốc khóa 3 ngày.
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

-- ── RPC unlock (Super Admin) ────────────────────────────────────────────────

create function public.unlock_attendance_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.attendance_sessions
  set status = 'completed',
      locked_at = null,
      unlocked_at = now(),
      unlocked_by = actor,
      editing_by = null,
      editing_started_at = null,
      updated_by = actor
  where id = p_session_id;
  if not found then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = '23503';
  end if;
end;
$$;

grant execute on function
  public.claim_attendance_session(uuid, date, public.meeting_type),
  public.heartbeat_attendance_session(uuid),
  public.takeover_attendance_session(uuid),
  public.save_and_finalize_attendance(uuid, jsonb, jsonb, boolean),
  public.unlock_attendance_session(uuid)
to authenticated, service_role;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.attendance_sessions is
  'Buổi điểm danh duy nhất theo (lớp, ngày, thứ Năm/Chúa nhật). Ghi chỉ qua RPC.';
comment on table public.student_attendance_records is
  'Điểm danh thiếu nhi; Thánh lễ và Giáo lý là hai trạng thái độc lập (D-30).';
comment on table public.staff_attendance_records is
  'Điểm danh giáo lý viên trong cùng buổi (D-35).';
comment on function app.can_edit_attendance(uuid) is
  'Được trực tiếp điểm danh lớp này: GLV có phân công, hoặc Super Admin (docs/05 §4.6).';
