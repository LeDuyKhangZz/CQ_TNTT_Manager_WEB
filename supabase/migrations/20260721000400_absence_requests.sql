-- ============================================================================
-- P3-T4 — Đơn xin nghỉ (WF-10, docs/05 §4.10, docs/11 §11).
--
-- Bảng này chỉ là *đề nghị*. Nó không bao giờ tự ghi vào điểm danh: khi mở buổi
-- điểm danh, UI hiện đơn đang chờ và gợi ý `vắng có phép`, người điểm danh vẫn
-- phải tự chọn (WF-10 bước 6, D-36). Vì vậy không có trigger nào đụng tới
-- student_attendance_records — cố ý, đừng "tối ưu" thêm.
--
-- `class_id`/`academic_year_id` phi chuẩn hóa từ ghi danh đang mở tại thời điểm
-- gửi đơn, để policy so cột với mảng phạm vi thay vì gọi hàm theo từng dòng
-- (bài học hiệu năng ở Gate Phase 2).
-- ============================================================================

create type public.absence_request_status as enum (
  'pending',
  'acknowledged',
  'cancelled'
);

create table public.absence_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  absence_date date not null,
  meeting_type public.meeting_type not null,
  reason text not null check (btrim(reason) <> '' and length(reason) <= 500),
  status public.absence_request_status not null default 'pending',
  staff_note text check (staff_note is null or length(staff_note) <= 500),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  -- Chỉ xin nghỉ được buổi có sinh hoạt (D-29).
  constraint absence_requests_meeting_day check (
    (meeting_type = 'thursday' and extract(isodow from absence_date) = 4)
    or (meeting_type = 'sunday' and extract(isodow from absence_date) = 7)
  ),
  constraint absence_requests_reviewed_shape check (
    (reviewed_by is null) = (reviewed_at is null)
  )
);

-- Một đơn còn hiệu lực cho mỗi em mỗi buổi; hủy rồi thì gửi lại được.
create unique index absence_requests_one_open_per_meeting_idx
on public.absence_requests (student_id, absence_date, meeting_type)
where status <> 'cancelled';
create index absence_requests_class_date_idx
on public.absence_requests (class_id, absence_date, meeting_type)
where status = 'pending';
create index absence_requests_student_idx on public.absence_requests (student_id, absence_date desc);

create trigger absence_requests_set_updated_at
before update on public.absence_requests
for each row execute function app.set_updated_at();

-- ── Trigger: suy ra lớp, và giới hạn ai đổi được cột nào ────────────────────

create function app.validate_absence_request()
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

create trigger absence_requests_validate
before insert or update on public.absence_requests
for each row execute function app.validate_absence_request();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.absence_requests enable row level security;

grant select, insert, update on public.absence_requests to authenticated;
grant all on public.absence_requests to service_role;

create policy absence_requests_select_scope
on public.absence_requests for select to authenticated
using (
  (select app.can_global_read())
  or class_id = any ((select app.scope_class_ids())::uuid[])
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or student_id = any ((select app.own_student_ids())::uuid[])
);

-- Chỉ phụ huynh của chính em đó gửi đơn (docs/05 §4.10). Thiếu nhi không tự
-- xin nghỉ; GLV/global-write cũng không gửi hộ — họ ghi thẳng vào điểm danh.
create policy absence_requests_insert_guardian
on public.absence_requests for insert to authenticated
with check (
  created_by = (select auth.uid())
  and app.is_guardian_of_student(student_id)
);

create policy absence_requests_update_scope
on public.absence_requests for update to authenticated
using (
  (select app.can_global_write())
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or student_id = any ((select app.own_student_ids())::uuid[])
)
with check (
  (select app.can_global_write())
  or class_id = any ((select app.staff_class_ids())::uuid[])
  or student_id = any ((select app.own_student_ids())::uuid[])
);

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.absence_requests is
  'Đơn xin nghỉ do phụ huynh gửi. Chỉ gợi ý cho người điểm danh, không tự sửa attendance (WF-10).';
