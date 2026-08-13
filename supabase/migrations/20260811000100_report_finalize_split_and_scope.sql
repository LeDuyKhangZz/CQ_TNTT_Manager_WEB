-- ============================================================================
-- 2B · M11-A — Báo cáo & Dashboard, đợt 1/3 (cơ sở dữ liệu + phân quyền)
--
-- D-66  Cha sở/Cha phó KHÔNG chốt báo cáo — tách quyền *xem/tải* khỏi quyền *chốt*.
-- D-169 Ô "Lớp" của trang tổng quan đếm đúng phạm vi người xem (TB-01 phương án A).
-- Nợ #18 Hàng rào "năm học đã đóng thì không ghi được" cho `report_snapshots`
--        — BẢNG CUỐI CÙNG của món nợ này (WF-16 bước 5).
--
-- 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng.
-- ============================================================================

-- ── D-66 · Tách quyền xem/tải khỏi quyền chốt ───────────────────────────────
--
-- `app.can_create_report` từ Phase 6 gánh CẢ HAI câu hỏi cùng lúc: policy SELECT
-- và policy INSERT của `report_snapshots` đều gọi đúng một hàm. Vì vậy siết
-- quyền chốt bằng cách sửa hàm ấy sẽ **lấy luôn quyền đọc** của Cha sở/Cha phó
-- — trái D-66, vốn chỉ bỏ quyền chốt và giữ nguyên quyền xem/tải.
--
-- Nay hai câu hỏi có hai cái tên:
--   `app.can_read_report`   — ai ĐỌC/tải được bản chốt của phạm vi này (rộng)
--   `app.can_create_report` — ai CHỐT được báo cáo cho phạm vi này  (hẹp)
create function app.can_read_report(p_scope_type text, p_scope_id uuid)
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

comment on function app.can_read_report(text, uuid) is
  'D-66: ai XEM/TẢI được báo cáo đã chốt của phạm vi này. Giữ nguyên luật cũ của '
  'app.can_create_report trước 2026-08-11 — Cha sở/Cha phó vẫn đọc và tải được.';

-- 🔴 Cái bẫy khi siết: KHÔNG được dùng lại `app.can_access_sector` /
-- `app.can_access_class`. Hai hàm ấy tự gọi `app.can_global_read()` bên trong
-- (`20260715000100:189,199`), nên một hàm "chốt" viết bằng chúng vẫn cho Cha sở
-- chốt ở phạm vi ngành và phạm vi lớp — tức siết đúng một nhánh trong ba và
-- pgTAP chỉ đo nhánh `global` sẽ xanh.
--
-- Luật mới đúng câu chữ D-66: "nhóm ghi cấp xứ đoàn + vai trò ngành + Giáo lý
-- viên lớp trong phạm vi mình".
--   · `app.can_global_write()` = Super Admin · Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký
--   · vai trò ngành: `app.current_sector_id()` chỉ khác null với sector_leader/
--     sector_deputy, nên phép so sánh tự loại mọi vai trò khác
--   · nhân sự lớp: `app.staff_class_ids()` / `app.scope_class_ids()`
-- Cha sở · Cha phó · Thủ quỹ không thoả nhánh nào ⇒ không chốt được ở BẤT KỲ
-- phạm vi nào. Phụ huynh/Thiếu nhi cũng vậy (hai tập lớp của họ rỗng).
create or replace function app.can_create_report(p_scope_type text, p_scope_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_scope_type
    when 'global' then coalesce(app.can_global_write(), false)
    when 'sector' then coalesce(
      app.can_global_write() or app.current_sector_id() = p_scope_id,
      false)
    when 'class' then coalesce(
      app.can_global_write()
      or p_scope_id = any (app.scope_class_ids())
      or p_scope_id = any (app.staff_class_ids()),
      false)
    else false
  end
$$;

comment on function app.can_create_report(text, uuid) is
  'D-66: ai CHỐT được báo cáo cho phạm vi này. Hẹp hơn app.can_read_report đúng '
  'ba cái tên — Cha sở, Cha phó và Thủ quỹ xem/tải được nhưng không chốt. '
  'KHÔNG dùng can_access_sector/can_access_class ở đây: hai hàm đó chứa '
  'can_global_read() nên sẽ mở lại đúng cánh cửa vừa đóng.';

-- 🔴 Bài học M07-B (D-151): *"ai được khoá bảng điểm"* từng có BA tầng nói ba
-- điều khác nhau vì tầng giao diện chép lại luật bằng một danh sách vai trò viết
-- tay. Ở đây tầng giao diện phải trả lời đúng câu hỏi ấy để không hiện một cái
-- nút chắc chắn lỗi (`03_AUDIT_RESULTS` §4.5), nên nó **hỏi thẳng** luật vừa
-- viết thay vì chép lại: `app.can_create_report` nằm ở schema `app` mà PostgREST
-- không phơi ra, nên cần đúng một hàm bọc mỏng ở `public`.
--
-- 🔴 `default null` KHÔNG phải thói quen viết cho đẹp — bỏ nó đi là tầng giao
-- diện không gọi được hàm này. Bộ sinh kiểu của Supabase khai mọi tham số
-- **không có mặc định** thành bắt buộc và **không cho phép `null`**
-- (`p_scope_id: string`), trong khi phạm vi `global` đúng nghĩa là *không có
-- id*. Có mặc định thì kiểu sinh ra là `p_scope_id?: string` và chỗ gọi truyền
-- `?? undefined` — đúng khuôn `propose_promotion` của M08
-- (`20260722000700:130`). Mặc định `null` cũng chính là giá trị mà nhánh
-- `global` dùng, nên không sinh ra ngữ nghĩa mới nào.
create function public.can_finalize_report(p_scope_type text, p_scope_id uuid default null)
returns boolean
language sql
stable
set search_path = ''
as $$
  select app.can_create_report(p_scope_type, p_scope_id)
$$;

revoke all on function public.can_finalize_report(text, uuid) from public, anon;
grant execute on function public.can_finalize_report(text, uuid) to authenticated, service_role;

comment on function public.can_finalize_report(text, uuid) is
  'Cửa sổ để tầng giao diện HỎI luật chốt báo cáo thay vì chép lại nó (D-66). '
  'Không nới quyền gì: chỉ trả về boolean của app.can_create_report cho chính '
  'người đang gọi.';

-- Policy đọc chuyển sang hàm rộng; policy ghi giữ hàm hẹp vừa siết.
drop policy report_snapshots_select_scope on public.report_snapshots;
create policy report_snapshots_select_scope
on public.report_snapshots for select to authenticated
using (app.can_read_report(scope_type, scope_id));

-- ── Nợ #18 · Hàng rào năm học đã đóng — bảng CUỐI CÙNG ──────────────────────
--
-- `authenticated` có `insert` ở **mức bảng** (`20260723000500:262`) và mọi đường
-- ghi đi thẳng qua policy, không qua RPC nào ⇒ đây là ca **policy**, đúng khuôn
-- M02-C, không phải khuôn RPC của M05-A/M07-B/M08-B.
--
-- Không mâu thuẫn với WF-16: bước 3 (*chốt báo cáo năm*) đứng TRƯỚC bước 4
-- (*đặt năm học `closed`*), và bước 5 nói thẳng *"không cho ghi mới trừ Super
-- Admin"*. D-117 giữ nguyên đường thoát cho Super Admin qua
-- `app.writable_academic_year_ids()`. Quyền **xem** và **tải** báo cáo của năm
-- đã đóng không bị đụng tới — chỉ thao tác tạo bản chốt mới bị chặn.
drop policy report_snapshots_insert_scope on public.report_snapshots;
create policy report_snapshots_insert_scope
on public.report_snapshots for insert to authenticated
with check (
  app.can_create_report(scope_type, scope_id)
  and generated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

-- ── D-169 · Ô "Lớp" đếm đúng phạm vi (TB-01 phương án A) ────────────────────
--
-- CTE `classed` cũ đếm trên toàn bộ `public.classes`, mà policy
-- `classes_select_authenticated` cho **mọi** tài khoản đọc **mọi** lớp (danh mục
-- lớp là cấu trúc công khai, phục vụ dropdown/điều hướng). Vì vậy
-- `security_invoker` KHÔNG thu hẹp con số này: Giáo lý viên lớp Ấu 1 thấy 19
-- trong khi ba ô cạnh nó (`student_count`, `staff_count`, tỷ lệ chuyên cần) đều
-- đã đúng phạm vi. Bốn con số nằm cạnh nhau nói hai chuyện khác nhau.
--
-- Gốc rễ (`03_AUDIT_RESULTS` §4.1): view trộn nguồn có RLS phạm vi với bảng danh
-- mục mở mà **không có mệnh đề phạm vi ở chính view**. Lời giải là viết mệnh đề
-- ấy ra, không phải nới/siết policy của `classes` (dropdown vẫn cần nó mở).
--
-- `create or replace view` **không cho đổi danh sách/thứ tự/kiểu cột** — ở đây
-- chỉ đổi biểu thức bên trong một CTE nên danh sách cột không nhúc nhích, không
-- cần `drop ... cascade` và không phải cấp lại `grant select`.
--
-- Mọi lời gọi hàm phạm vi đều bọc `(select …)` để planner nâng thành InitPlan —
-- bài học `20260721000200`; viết trần thì hàm chạy lại trên từng dòng `classes`.
create or replace view public.v_dashboard_summary
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
    and (
      (select app.can_global_read())
      or id = any ((select app.scope_class_ids())::uuid[])
      or id = any ((select app.staff_class_ids())::uuid[])
    )
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

comment on view public.v_dashboard_summary is
  'KPI tổng quan theo năm học; security_invoker nên mỗi vai trò chỉ cộng được phần '
  'mình đọc được. D-169: class_count có mệnh đề phạm vi RIÊNG vì policy của '
  'public.classes cố ý mở cho mọi tài khoản (dropdown), nên security_invoker không '
  'thu hẹp được con số đó.';

revoke all on function app.can_read_report(text, uuid) from public, anon;
grant execute on function app.can_read_report(text, uuid) to authenticated, service_role;
