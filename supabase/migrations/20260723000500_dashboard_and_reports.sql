-- ============================================================================
-- P6-T5/P6-T6 — View dashboard và snapshot báo cáo
-- (docs/01 §12, docs/02 §13, WF-15).
--
-- D-51  Báo cáo theo tuần/tháng/năm; Excel/PDF; snapshot final; giữ 5 năm.
-- D-52  Export phải giữ đúng filter/date range.
--
-- Mọi view đều `security_invoker`: trưởng ngành thấy đúng ngành mình, GLV lớp
-- thấy đúng lớp mình, phụ huynh chỉ thấy con mình — không cần policy riêng cho
-- dashboard, và cũng không thể lách bằng cách đọc thẳng view.
--
-- KPI đúng bằng danh sách đã chốt ở docs/01 §12; các mục bị bỏ (tỷ lệ
-- GLV/thiếu nhi, thi đua giữa ngành, lớp chưa điểm danh, lớp chưa có giáo án,
-- sắp lãnh bí tích) KHÔNG được thêm lại.
-- ============================================================================

create view public.v_dashboard_summary
with (security_invoker = true) as
with enrolled as (
  select enrollment.academic_year_id,
    count(*) filter (where enrollment.status in ('active', 'paused'))::integer as student_count,
    count(distinct enrollment.class_id) filter (where enrollment.status in ('active', 'paused'))::integer as enrolled_class_count
  from public.enrollments as enrollment
  group by enrollment.academic_year_id
),
staffed as (
  select class.academic_year_id,
    count(distinct assignment.staff_profile_id)::integer as staff_count
  from public.class_staff_assignments as assignment
  join public.classes as class on class.id = assignment.class_id
  where assignment.is_active
  group by class.academic_year_id
),
classed as (
  select academic_year_id, count(*)::integer as class_count
  from public.classes
  where status = 'active'
  group by academic_year_id
),
attendance as (
  select summary.academic_year_id,
    round(avg(summary.mass_rate), 4) as mass_rate,
    round(avg(summary.catechism_rate), 4) as catechism_rate,
    sum(summary.warned_student_count)::integer as warned_student_count,
    max(summary.last_session_date) as last_session_date
  from public.v_class_attendance_summary as summary
  group by summary.academic_year_id
)
select
  year.id as academic_year_id,
  year.code as academic_year_code,
  year.status as academic_year_status,
  coalesce(enrolled.student_count, 0) as student_count,
  coalesce(staffed.staff_count, 0) as staff_count,
  coalesce(classed.class_count, 0) as class_count,
  attendance.mass_rate,
  attendance.catechism_rate,
  coalesce(attendance.warned_student_count, 0) as warned_student_count,
  attendance.last_session_date
from public.academic_years as year
left join enrolled on enrolled.academic_year_id = year.id
left join staffed on staffed.academic_year_id = year.id
left join classed on classed.academic_year_id = year.id
left join attendance on attendance.academic_year_id = year.id;

-- "Thiếu nhi vắng liên tiếp" + "điểm thấp/cần quan tâm" gộp một view: cùng một
-- danh sách trên dashboard, và gộp lại thì chỉ quét chuyên cần một lần.
create view public.v_students_at_risk
with (security_invoker = true) as
select
  summary.student_id,
  summary.academic_year_id,
  summary.class_id,
  student.saint_name,
  student.full_name,
  class.display_name as class_name,
  summary.catechism_absence_streak,
  summary.sunday_absence_streak,
  summary.catechism_rate,
  summary.mass_attendance_score,
  summary.catechism_attendance_score,
  average.weighted_average,
  summary.warn_consecutive_absence,
  summary.warn_consecutive_sunday,
  summary.warn_low_rate,
  coalesce(average.weighted_average < 5, false) as warn_low_average
from public.v_student_attendance_summary as summary
join public.students as student on student.id = summary.student_id
left join public.classes as class on class.id = summary.class_id
left join public.v_student_weighted_average as average
  on average.student_id = summary.student_id
 and average.academic_year_id = summary.academic_year_id
where summary.warn_consecutive_absence
   or summary.warn_consecutive_sunday
   or summary.warn_low_rate
   or coalesce(average.weighted_average < 5, false);

-- "Buổi học sắp tới" và "các lớp sắp kiểm tra" (docs/01 §12).
create view public.v_upcoming_teaching_items
with (security_invoker = true) as
select
  item.id,
  plan.class_id,
  plan.academic_year_id,
  class.display_name as class_name,
  item.planned_date,
  item.title,
  item.item_type,
  item.item_type = 'assessment' as is_assessment
from public.teaching_plan_items as item
join public.teaching_plans as plan on plan.id = item.teaching_plan_id
join public.classes as class on class.id = plan.class_id
where item.planned_date >= current_date
  and item.planned_date < current_date + 21;

-- "Sinh nhật/bổn mạng" trong 30 ngày tới. Lần kỷ niệm kế tiếp tính bằng độ lệch
-- ngày-trong-năm chứ không make_date(): 29/02 không làm hỏng truy vấn, chỉ lệch
-- một ngày ở năm không nhuận.
create view public.v_upcoming_celebrations
with (security_invoker = true) as
select
  student.id as student_id,
  student.saint_name,
  student.full_name,
  celebration.kind,
  celebration.celebrated_on,
  occurrence.next_occurrence
from public.students as student
cross join lateral (
  values ('birthday'::text, student.date_of_birth), ('patron_feast'::text, student.patron_feast_date)
) as celebration(kind, celebrated_on)
cross join lateral (
  select min(options.candidate) as next_occurrence
  from (
    select date_trunc('year', current_date)::date
      + (celebration.celebrated_on - date_trunc('year', celebration.celebrated_on)::date) as candidate
    union all
    select (date_trunc('year', current_date) + interval '1 year')::date
      + (celebration.celebrated_on - date_trunc('year', celebration.celebrated_on)::date)
  ) as options
  where options.candidate >= current_date
) as occurrence
where celebration.celebrated_on is not null
  and student.status = 'active'
  and occurrence.next_occurrence is not null
  and occurrence.next_occurrence <= current_date + 30;

-- "Hồ sơ thiếu dữ liệu" (docs/01 §12): đúng những trường mà xứ đoàn thật sự
-- thiếu sau khi import (BLK-2c) — không dựng thành cảnh báo tùy tiện.
--
-- LEFT JOIN guardians là cố ý: GLV lớp KHÔNG đọc được bảng `guardians`
-- (policy guardians_select_scope). Nếu join thường thì view rỗng với chính
-- người cần dùng nó. Cờ thiếu SĐT chỉ bật khi người đọc thật sự thấy được
-- guardian — nói "thiếu" trong khi chỉ là "không có quyền xem" thì tệ hơn im lặng.
create view public.v_incomplete_student_profiles
with (security_invoker = true) as
select
  student.id as student_id,
  student.saint_name,
  student.full_name,
  guardian.id is not null and (guardian.phone is null or btrim(guardian.phone) = '')
    as missing_guardian_phone,
  student.patron_feast_date is null as missing_patron_feast,
  student.address is null or btrim(student.address) = '' as missing_address
from public.students as student
left join public.guardians as guardian on guardian.id = student.guardian_id
where student.status = 'active'
  and (
    (guardian.id is not null and (guardian.phone is null or btrim(guardian.phone) = ''))
    or student.patron_feast_date is null
    or student.address is null or btrim(student.address) = ''
  );

grant select on
  public.v_dashboard_summary,
  public.v_students_at_risk,
  public.v_upcoming_teaching_items,
  public.v_upcoming_celebrations,
  public.v_incomplete_student_profiles
to authenticated, service_role;

-- ── Snapshot báo cáo ────────────────────────────────────────────────────────
-- Bất biến theo D-51: `authenticated` KHÔNG được cấp UPDATE/DELETE. Không có
-- luồng người dùng nào sửa được snapshot đã chốt; muốn số khác thì chốt bản mới.
--
-- payload_json giữ đúng dữ liệu đã hiển thị khi chốt, nên báo cáo cũ không đổi
-- theo dữ liệu về sau. filter_json giữ nguyên filter đang chọn (D-52) và chính
-- là thứ được dùng lại khi tải Excel/PDF của snapshot.

create table public.report_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  report_type text not null check (report_type in ('attendance', 'results')),
  title text not null check (btrim(title) <> '' and char_length(title) <= 200),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  scope_type text not null check (scope_type in ('global', 'sector', 'class')),
  scope_id uuid,
  period_type text not null check (period_type in ('week', 'month', 'year')),
  period_start date not null,
  period_end date not null,
  filter_json jsonb not null default '{}'::jsonb,
  payload_json jsonb not null,
  checksum text not null,
  file_path text,
  status text not null default 'final' check (status = 'final'),
  generated_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default now(),
  constraint report_snapshot_period_order check (period_end >= period_start),
  constraint report_snapshot_scope_shape check (
    (scope_type = 'global' and scope_id is null)
    or (scope_type in ('sector', 'class') and scope_id is not null)
  )
);

create index report_snapshots_scope_idx
on public.report_snapshots (academic_year_id, scope_type, scope_id, generated_at desc);

create function app.can_create_report(p_scope_type text, p_scope_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_scope_type
    when 'global' then coalesce(app.can_global_read(), false)
    when 'sector' then coalesce(app.can_global_read() or app.can_access_sector(p_scope_id), false)
    when 'class' then coalesce(
      app.can_global_read() or app.can_access_class(p_scope_id) or app.is_class_staff(p_scope_id),
      false)
    else false
  end
$$;

-- Checksum và thời điểm chốt do server tính, không nhận từ client (AGENTS §5).
create function app.seal_report_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.generated_by := auth.uid();
  new.generated_at := now();
  new.status := 'final';
  new.checksum := encode(
    extensions.digest(
      convert_to(new.payload_json::text || '|' || new.filter_json::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
  return new;
end;
$$;

create trigger report_snapshots_seal
before insert on public.report_snapshots
for each row execute function app.seal_report_snapshot();

alter table public.report_snapshots enable row level security;

grant select, insert on public.report_snapshots to authenticated;
grant all on public.report_snapshots to service_role;

create policy report_snapshots_select_scope
on public.report_snapshots for select to authenticated
using (app.can_create_report(scope_type, scope_id));
create policy report_snapshots_insert_scope
on public.report_snapshots for insert to authenticated
with check (app.can_create_report(scope_type, scope_id) and generated_by = auth.uid());

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

-- ── Nguồn dữ liệu báo cáo ───────────────────────────────────────────────────
-- Hai hàm dưới đây là SECURITY INVOKER (mặc định): RLS của người gọi vẫn áp
-- dụng, nên trưởng ngành gọi cùng một hàm chỉ nhận về lớp trong ngành mình.
-- Đây cũng chính là nguồn của bản xem trước, của file Excel/PDF và của
-- payload snapshot — một truy vấn duy nhất nên ba thứ không thể lệch nhau (D-52).

create function public.report_attendance_rows(
  p_academic_year_id uuid,
  p_from date,
  p_to date
)
returns table (
  class_id uuid,
  class_name text,
  sector_id uuid,
  student_count integer,
  session_count integer,
  mass_present_rate numeric,
  catechism_present_rate numeric,
  mass_absent_count integer,
  catechism_absent_count integer
)
language sql
stable
set search_path = ''
as $$
  select
    class.id,
    class.display_name,
    grade.sector_id,
    count(distinct record.student_id)::integer,
    count(distinct session.id)::integer,
    round(avg(case when record.mass_status = 'present' then 1 else 0 end), 4),
    round(avg(case when record.catechism_status = 'present' then 1 else 0 end), 4),
    count(*) filter (where record.mass_status in ('excused_absence', 'unexcused_absence'))::integer,
    count(*) filter (where record.catechism_status in ('excused_absence', 'unexcused_absence'))::integer
  from public.student_attendance_records as record
  join public.attendance_sessions as session on session.id = record.attendance_session_id
  join public.classes as class on class.id = session.class_id
  left join public.grade_levels as grade on grade.id = class.grade_level_id
  where session.academic_year_id = p_academic_year_id
    and session.finalized_at is not null
    and session.attendance_date between p_from and p_to
  group by class.id, class.display_name, grade.sector_id
  order by class.display_name
$$;

create function public.report_results_rows(p_academic_year_id uuid)
returns table (
  class_id uuid,
  class_name text,
  sector_id uuid,
  student_count integer,
  class_average numeric,
  below_five_count integer,
  excellent_count integer
)
language sql
stable
set search_path = ''
as $$
  select
    class.id,
    class.display_name,
    grade.sector_id,
    count(*)::integer,
    round(avg(average.weighted_average), 2),
    count(*) filter (where average.weighted_average < 5)::integer,
    count(*) filter (where average.weighted_average >= 8)::integer
  from public.v_student_weighted_average as average
  join public.classes as class on class.id = average.class_id
  left join public.grade_levels as grade on grade.id = class.grade_level_id
  where average.academic_year_id = p_academic_year_id
    and average.weighted_average is not null
  group by class.id, class.display_name, grade.sector_id
  order by class.display_name
$$;

revoke all on function public.report_attendance_rows(uuid, date, date) from public, anon;
revoke all on function public.report_results_rows(uuid) from public, anon;
grant execute on function public.report_attendance_rows(uuid, date, date) to authenticated, service_role;
grant execute on function public.report_results_rows(uuid) to authenticated, service_role;

comment on function public.report_attendance_rows(uuid, date, date) is
  'Chuyên cần gộp theo lớp trong khoảng ngày, chỉ tính buổi đã chốt. SECURITY INVOKER nên tôn trọng RLS người gọi.';
comment on function public.report_results_rows(uuid) is
  'Kết quả học tập gộp theo lớp trong năm học. SECURITY INVOKER nên tôn trọng RLS người gọi.';

comment on view public.v_dashboard_summary is
  'KPI tổng quan theo năm học; security_invoker nên mỗi vai trò chỉ cộng được phần mình đọc được.';
comment on view public.v_students_at_risk is
  'Thiếu nhi cần quan tâm: vắng liên tiếp/tỷ lệ thấp (D-58) hoặc trung bình dưới 5.';
comment on view public.v_upcoming_teaching_items is
  'Buổi học và buổi kiểm tra trong 21 ngày tới, dùng cho dashboard GLV.';
comment on view public.v_upcoming_celebrations is
  'Sinh nhật và bổn mạng trong 30 ngày tới.';
comment on view public.v_incomplete_student_profiles is
  'Hồ sơ thiếu SĐT phụ huynh/bổn mạng/địa chỉ (BLK-2c). Cờ SĐT chỉ bật khi người đọc thấy được guardian.';
comment on table public.report_snapshots is
  'Báo cáo đã chốt: bất biến (không cấp UPDATE/DELETE), giữ nguyên filter và dữ liệu tại thời điểm chốt (D-51/D-52).';
