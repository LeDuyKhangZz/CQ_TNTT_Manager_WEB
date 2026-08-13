-- ============================================================================
-- M02-C · D-70 — Phụ huynh và Thiếu nhi chỉ thấy LỚP CỦA MÌNH.
--
-- SEC-M02-09 / BR-M02-19/31/44 / Q-M02-06: `docs/05` §3 dòng "Ngành/lớp" ghi
-- **"lớp con"** cho phụ huynh và **"lớp mình"** cho thiếu nhi, còn dòng "Năm học"
-- ghi **❌** cho cả hai. RLS thì cho đọc **hết**: `using (app.current_role() is not
-- null)` trên cả `classes` và `academic_years`. Nghĩa là một phụ huynh gọi Data API
-- bằng JWT thật lấy được **toàn bộ 19 lớp** kèm phòng sinh hoạt và ghi chú, và
-- **toàn bộ danh sách năm học** của xứ đoàn.
--
-- D-70 đã được chủ dự án chốt, kèm một cảnh báo phải làm đúng: *"nhiều màn hình
-- hiện dựa vào việc đọc được danh sách lớp để hiển thị tên lớp. Siết quá tay sẽ làm
-- cổng phụ huynh hiện «lớp không xác định»."* Bốn đường đi đã rà từng cái:
--
--   · `resolveThemeContext` → `enrollments ⟶ classes(grade_levels(sectors))` để lấy
--     màu ngành của lớp con (10 §4). Lớp con **nằm trong** phạm vi mới ⇒ chạy.
--   · `/results` phụ huynh → `enrollments ⟶ classes(display_name,
--     academic_years(code))`. Lớp con trong phạm vi, năm học là năm **hiện hành**
--     ⇒ chạy.
--   · `v_students_at_risk`, `v_upcoming_teaching_items` (`security_invoker`) join
--     `classes` để lấy tên lớp ⇒ lớp con vẫn ra tên.
--   · Thanh đầu trang hiện tên năm học cho **mọi** vai trò
--     (`getCurrentAcademicYear`) ⇒ vì vậy năm `current` **vẫn phải đọc được**.
--     Chặn sạch `academic_years` là cổng phụ huynh hiện *"Chưa đặt năm học"* —
--     một câu SAI, và đúng kiểu "siết quá tay" mà D-70 cảnh báo.
--
-- BA quyết định cài đặt cần nhớ:
--
--   1. Phạm vi của phụ huynh/thiếu nhi là **mọi lớp mà con/chính mình từng ghi
--      danh**, không chỉ lớp của năm hiện hành. `app.own_student_class_ids()` (có
--      từ `20260721000300`) không lọc theo trạng thái ghi danh hay theo năm — và
--      đó là đúng: em chuyển lớp giữa năm thì cả hai lớp đều là lớp của em, còn
--      lịch sử năm cũ mà mất tên lớp thì M13 sẽ phải in "lớp không xác định".
--
--   2. Năm học đọc được = **năm hiện hành** + **những năm con mình có ghi danh**.
--      Không phải "chỉ năm hiện hành": bảng điểm và sổ điểm danh của năm trước vẫn
--      là dữ liệu của chính em đó, và một cổng phụ huynh in "Năm học ?" ở lịch sử
--      là tự tạo ra một lỗi để sửa ở M13.
--
--   3. ⚠️ `sectors` và `grade_levels` **KHÔNG** bị siết. Chúng là danh mục tham
--      chiếu của cả giáo xứ (5 ngành, 13 cấp), không phải dữ liệu của ai, và bộ
--      chọn màu ngành đọc chúng trên **mọi** trang. Dòng "Ngành/lớp" của `docs/05`
--      nói về *lớp*, và siết danh mục ngành sẽ làm mất màu ngành của lớp con —
--      lấy đi đúng thứ 09 §4.4 #10 vừa dựng.
--
-- ⚠️ **Điều này KHÔNG đóng lỗ hổng của M11.** `03_AUDIT_RESULTS.md` của M11 ghi:
-- ô "Lớp" trên dashboard đếm qua `classes` nên **Giáo lý viên lớp thấy tổng số lớp
-- toàn xứ đoàn**. Đó là một vai trò **nhân sự**, không phải phụ huynh/thiếu nhi,
-- nên nó nằm ngoài D-70 và vẫn mở. Trả ở M11.
-- ============================================================================

-- Năm học mà con mình / chính mình có ghi danh. Cùng khuôn
-- `app.own_student_class_ids()`: không tham số, trả mảng, để RLS nâng thành InitPlan.
create or replace function app.own_student_academic_year_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct enrollment.academic_year_id), '{}'::uuid[])
  from public.enrollments as enrollment
  where enrollment.student_id = any (app.own_student_ids())
$$;

revoke all on function app.own_student_academic_year_ids() from public, anon;
grant execute on function app.own_student_academic_year_ids() to authenticated, service_role;

comment on function app.own_student_academic_year_ids() is
  'D-70: năm học mà con của phụ huynh đang đăng nhập (hoặc chính thiếu nhi đó) có ghi danh.';

-- ── Lớp ────────────────────────────────────────────────────────────────────
drop policy classes_select_authenticated on public.classes;
create policy classes_select_scope
on public.classes for select to authenticated
using (
  (select app.current_role()) is not null
  and (
    -- Nhân sự: KHÔNG đổi gì. D-69 chốt Trưởng ngành được xem năm cũ, và mọi phạm
    -- vi hẹp hơn cho nhân sự là hạng mục I10 — chưa chốt, không làm ở đây.
    (select app.current_role()) not in ('guardian', 'student')
    or id = any ((select app.own_student_class_ids())::uuid[])
  )
);

-- ── Năm học ────────────────────────────────────────────────────────────────
drop policy academic_years_select_authenticated on public.academic_years;
create policy academic_years_select_scope
on public.academic_years for select to authenticated
using (
  (select app.current_role()) is not null
  and (
    (select app.current_role()) not in ('guardian', 'student')
    -- Ghi chú 2 — thanh đầu trang của cổng phụ huynh hiện năm hiện hành.
    or status = 'current'
    or id = any ((select app.own_student_academic_year_ids())::uuid[])
  )
);

comment on policy classes_select_scope on public.classes is
  'D-70: phụ huynh/thiếu nhi chỉ đọc lớp của con/của mình. Nhân sự đọc như cũ.';
comment on policy academic_years_select_scope on public.academic_years is
  'D-70: phụ huynh/thiếu nhi chỉ đọc năm hiện hành và năm con mình có ghi danh.';
