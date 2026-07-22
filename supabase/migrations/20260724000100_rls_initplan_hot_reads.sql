-- P7-T3 — Hiệu năng RLS trên hai bảng đọc nhiều nhất.
--
-- Gate Phase 2 đã chuyển 5 policy SELECT sang lối "tính một lần rồi so khớp"
-- (migration 20260721000200). Hai policy dưới đây bị bỏ sót và EXPLAIN ở mốc
-- 900 thiếu nhi cho đúng triệu chứng cũ: `guardians` quét 451 dòng mất
-- **79,9 ms** vì `app.can_global_read()` được gọi lại cho *từng dòng*, trong khi
-- `students` 911 dòng chỉ mất **1,5 ms** nhờ Postgres nâng hàm lên InitPlan.
-- Trên `/dashboard`, view `v_incomplete_student_profiles` join sang `guardians`
-- nên toàn bộ chi phí đó rơi thẳng vào trang ai cũng mở.
--
-- **Không đổi quyền.** Từng vế của mỗi policy giữ nguyên nghĩa; chỉ bọc trong
-- scalar subquery để hàm chạy đúng một lần cho mỗi truy vấn thay vì mỗi dòng.
-- Bằng chứng không đổi ngữ nghĩa: pgTAP chạy lại sau migration này.

drop policy if exists guardians_select_scope on public.guardians;
create policy guardians_select_scope
on public.guardians for select to authenticated
using (
  (select app.can_global_read())
  or profile_id = (select auth.uid())
);

drop policy if exists profiles_select_self_or_global on public.profiles;
create policy profiles_select_self_or_global
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select app.can_global_read())
);
