-- ============================================================================
-- P3-T5 — Cảnh báo chuyên cần và điểm chuyên cần (WF-06, docs/02 §7.4, D-38/D-39).
--
-- Quyết định của user ở phiên này:
--   D-58 — ngưỡng cảnh báo cấu hình theo năm học, mặc định 3 buổi vắng liên
--          tiếp / 3 Chúa nhật liên tiếp / tỷ lệ có trọng số < 80%.
--   D-59 — điểm chuyên cần tách **hai điểm riêng**: Thánh lễ và Giáo lý, mỗi
--          điểm = trung bình trọng số × 10. Không gộp một điểm.
--
-- Tính bằng view chứ không materialize: WF-06 nói rõ "không cần cron... chỉ
-- materialize nếu hiệu năng thực tế yêu cầu". View dùng security_invoker nên
-- phụ huynh/thiếu nhi đọc view vẫn chỉ thấy phần của mình.
--
-- Chỉ buổi ĐÃ CHỐT mới vào thống kê: buổi đang điểm danh dở toàn 'present' do
-- seed, đưa vào sẽ thổi phồng tỷ lệ.
-- ============================================================================

alter table public.academic_years
  add column attendance_warning_consecutive_absences smallint not null default 3
    check (attendance_warning_consecutive_absences between 1 and 20),
  add column attendance_warning_consecutive_sundays smallint not null default 3
    check (attendance_warning_consecutive_sundays between 1 and 20),
  add column attendance_warning_rate_threshold numeric(4, 3) not null default 0.800
    check (attendance_warning_rate_threshold > 0 and attendance_warning_rate_threshold <= 1);

comment on column public.academic_years.attendance_warning_consecutive_absences is
  'D-58: số buổi vắng Giáo lý liên tiếp bắt đầu cảnh báo.';
comment on column public.academic_years.attendance_warning_consecutive_sundays is
  'D-58: số Chúa nhật vắng lễ liên tiếp bắt đầu cảnh báo.';
comment on column public.academic_years.attendance_warning_rate_threshold is
  'D-58: tỷ lệ chuyên cần có trọng số, dưới mức này thì cảnh báo.';

-- Trọng số theo docs/02 §7.4. Dùng chung cho cả Thánh lễ và Giáo lý; nếu sau
-- này cần tách thì thêm bảng thứ hai, đừng đổi ý nghĩa cột hiện có.
create table public.attendance_weight_settings (
  academic_year_id uuid primary key references public.academic_years(id) on delete cascade,
  weight_present numeric(3, 2) not null default 1.00,
  weight_late numeric(3, 2) not null default 0.80,
  weight_left_early numeric(3, 2) not null default 0.80,
  weight_excused_absence numeric(3, 2) not null default 0.50,
  weight_unexcused_absence numeric(3, 2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint attendance_weights_range check (
    weight_present between 0 and 1
    and weight_late between 0 and 1
    and weight_left_early between 0 and 1
    and weight_excused_absence between 0 and 1
    and weight_unexcused_absence between 0 and 1
  )
);

create trigger attendance_weight_settings_set_updated_at
before update on public.attendance_weight_settings
for each row execute function app.set_updated_at();

-- Mỗi năm học luôn có đúng một dòng trọng số, kể cả năm tạo sau này — view
-- join thẳng vào bảng này nên thiếu dòng là mất sạch thống kê của năm đó.
create function app.seed_attendance_weight_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.attendance_weight_settings (academic_year_id)
  values (new.id)
  on conflict (academic_year_id) do nothing;
  return new;
end;
$$;

create trigger academic_years_seed_attendance_weights
after insert on public.academic_years
for each row execute function app.seed_attendance_weight_settings();

insert into public.attendance_weight_settings (academic_year_id)
select id from public.academic_years
on conflict (academic_year_id) do nothing;

alter table public.attendance_weight_settings enable row level security;
grant select on public.attendance_weight_settings to authenticated;
grant all on public.attendance_weight_settings to service_role;

-- Bảng cấu hình, không chứa dữ liệu cá nhân: ai đăng nhập cũng đọc được để UI
-- giải thích điểm; chỉ global-write mới sửa.
create policy attendance_weight_settings_select_all
on public.attendance_weight_settings for select to authenticated
using (true);
create policy attendance_weight_settings_write_global
on public.attendance_weight_settings for update to authenticated
using ((select app.can_global_write()))
with check ((select app.can_global_write()));

-- ── View tổng hợp ───────────────────────────────────────────────────────────

create view public.v_student_attendance_summary
with (security_invoker = true) as
with scored as (
  select
    record.student_id,
    session.academic_year_id,
    record.class_id,
    session.attendance_date,
    session.meeting_type,
    record.mass_status,
    record.catechism_status,
    case record.mass_status
      when 'present' then weights.weight_present
      when 'late' then weights.weight_late
      when 'left_early' then weights.weight_left_early
      when 'excused_absence' then weights.weight_excused_absence
      when 'unexcused_absence' then weights.weight_unexcused_absence
    end as mass_weight,
    case record.catechism_status
      when 'present' then weights.weight_present
      when 'late' then weights.weight_late
      when 'left_early' then weights.weight_left_early
      when 'excused_absence' then weights.weight_excused_absence
      when 'unexcused_absence' then weights.weight_unexcused_absence
    end as catechism_weight,
    record.mass_status in ('excused_absence', 'unexcused_absence') as mass_absent,
    record.catechism_status in ('excused_absence', 'unexcused_absence') as catechism_absent
  from public.student_attendance_records as record
  join public.attendance_sessions as session
    on session.id = record.attendance_session_id
  join public.attendance_weight_settings as weights
    on weights.academic_year_id = session.academic_year_id
  where session.finalized_at is not null
),
-- Chuỗi vắng hiện tại = số buổi gần nhất liên tiếp bị vắng. Đếm ngược từ buổi
-- mới nhất tới buổi có mặt đầu tiên; không có buổi có mặt nào thì cả chuỗi.
ranked_all as (
  select student_id, academic_year_id, catechism_absent,
    row_number() over (
      partition by student_id, academic_year_id order by attendance_date desc
    ) as position
  from scored
),
ranked_sunday as (
  select student_id, academic_year_id, mass_absent,
    row_number() over (
      partition by student_id, academic_year_id order by attendance_date desc
    ) as position
  from scored
  where meeting_type = 'sunday'
),
streaks as (
  select student_id, academic_year_id,
    coalesce(min(position) filter (where not catechism_absent) - 1, max(position)) as catechism_absence_streak
  from ranked_all group by student_id, academic_year_id
),
sunday_streaks as (
  select student_id, academic_year_id,
    coalesce(min(position) filter (where not mass_absent) - 1, max(position)) as sunday_absence_streak
  from ranked_sunday group by student_id, academic_year_id
),
aggregated as (
  select
    student_id,
    academic_year_id,
    (array_agg(class_id order by attendance_date desc))[1] as class_id,
    count(*)::integer as sessions_counted,
    count(*) filter (where mass_status = 'present')::integer as mass_present_count,
    count(*) filter (where mass_absent)::integer as mass_absent_count,
    count(*) filter (where mass_status = 'unexcused_absence')::integer as mass_unexcused_count,
    count(*) filter (where catechism_status = 'present')::integer as catechism_present_count,
    count(*) filter (where catechism_absent)::integer as catechism_absent_count,
    count(*) filter (where catechism_status = 'unexcused_absence')::integer as catechism_unexcused_count,
    -- WF-06 điểm 4: lệch giữa Thánh lễ và Giáo lý trong cùng một buổi.
    count(*) filter (where mass_absent <> catechism_absent)::integer as mass_catechism_mismatch_count,
    round(avg(mass_weight), 4) as mass_rate,
    round(avg(catechism_weight), 4) as catechism_rate,
    -- D-59: hai điểm riêng, thang 10.
    round(avg(mass_weight) * 10, 2) as mass_attendance_score,
    round(avg(catechism_weight) * 10, 2) as catechism_attendance_score,
    max(attendance_date) as last_session_date
  from scored
  group by student_id, academic_year_id
)
select
  aggregated.student_id,
  aggregated.academic_year_id,
  aggregated.class_id,
  aggregated.sessions_counted,
  aggregated.mass_present_count,
  aggregated.mass_absent_count,
  aggregated.mass_unexcused_count,
  aggregated.catechism_present_count,
  aggregated.catechism_absent_count,
  aggregated.catechism_unexcused_count,
  aggregated.mass_catechism_mismatch_count,
  aggregated.mass_rate,
  aggregated.catechism_rate,
  aggregated.mass_attendance_score,
  aggregated.catechism_attendance_score,
  aggregated.last_session_date,
  streaks.catechism_absence_streak::integer as catechism_absence_streak,
  coalesce(sunday_streaks.sunday_absence_streak, 0)::integer as sunday_absence_streak,
  streaks.catechism_absence_streak >= year.attendance_warning_consecutive_absences
    as warn_consecutive_absence,
  coalesce(sunday_streaks.sunday_absence_streak, 0) >= year.attendance_warning_consecutive_sundays
    as warn_consecutive_sunday,
  aggregated.catechism_rate < year.attendance_warning_rate_threshold
    as warn_low_rate,
  aggregated.mass_catechism_mismatch_count > 0 as warn_mass_catechism_mismatch
from aggregated
join public.academic_years as year on year.id = aggregated.academic_year_id
join streaks
  on streaks.student_id = aggregated.student_id
 and streaks.academic_year_id = aggregated.academic_year_id
left join sunday_streaks
  on sunday_streaks.student_id = aggregated.student_id
 and sunday_streaks.academic_year_id = aggregated.academic_year_id;

create view public.v_class_attendance_summary
with (security_invoker = true) as
select
  summary.class_id,
  summary.academic_year_id,
  count(*)::integer as student_count,
  round(avg(summary.mass_rate), 4) as mass_rate,
  round(avg(summary.catechism_rate), 4) as catechism_rate,
  round(avg(summary.mass_attendance_score), 2) as mass_attendance_score,
  round(avg(summary.catechism_attendance_score), 2) as catechism_attendance_score,
  count(*) filter (
    where summary.warn_consecutive_absence
       or summary.warn_consecutive_sunday
       or summary.warn_low_rate
  )::integer as warned_student_count,
  max(summary.last_session_date) as last_session_date
from public.v_student_attendance_summary as summary
group by summary.class_id, summary.academic_year_id;

create view public.v_staff_attendance_summary
with (security_invoker = true) as
select
  record.staff_profile_id,
  session.academic_year_id,
  record.class_id,
  count(*)::integer as sessions_counted,
  count(*) filter (where record.status = 'present')::integer as present_count,
  count(*) filter (where record.status = 'excused_absence')::integer as excused_count,
  count(*) filter (where record.status = 'unexcused_absence')::integer as unexcused_count,
  round(
    count(*) filter (where record.status = 'present')::numeric
      / nullif(count(*), 0),
    4
  ) as present_rate,
  max(session.attendance_date) as last_session_date
from public.staff_attendance_records as record
join public.attendance_sessions as session on session.id = record.attendance_session_id
where session.finalized_at is not null
group by record.staff_profile_id, session.academic_year_id, record.class_id;

grant select on
  public.v_student_attendance_summary,
  public.v_class_attendance_summary,
  public.v_staff_attendance_summary
to authenticated, service_role;

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on view public.v_student_attendance_summary is
  'Chuyên cần theo em/năm học trên các buổi ĐÃ CHỐT: tỷ lệ, hai điểm thang 10 (D-59), chuỗi vắng và cờ cảnh báo (D-58).';
comment on view public.v_class_attendance_summary is
  'Chuyên cần gộp theo lớp, dựng trên v_student_attendance_summary.';
comment on view public.v_staff_attendance_summary is
  'Chuyên cần giáo lý viên theo lớp/năm học (D-35).';
