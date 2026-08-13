-- ============================================================================
-- M08-C — module Chuyển lớp, đợt 3/3. **Hạng mục 8 của `07_IMPLEMENTATION_IMPACT`:
-- "hiển thị người đề xuất / người duyệt".**
--
-- `06_UI_UX_RECOMMENDATIONS` §3 chấm mục này mức **Cao** với lý do đúng một câu:
-- *"người duyệt cần biết nguồn"*. `07` §2.4 kèm một điều kiện chưa ai đo:
-- *"cần xác nhận RLS `profiles` cho phép staff đọc `display_name` của staff khác"*.
--
-- 🔴 **Đã đo, và câu trả lời là KHÔNG.** `profiles_select_self_or_global`
-- (`20260724000100_rls_initplan_hot_reads.sql:24-29`) chỉ mở cho **chính mình**
-- hoặc `app.can_global_read()` — tức sáu vai trò cấp xứ đoàn. Hai người dùng
-- chính của trang `/promotions` là **Trưởng ngành** (người duyệt) và **Giáo lý
-- viên đại diện** (người đề xuất), và **cả hai đều không nằm trong sáu vai trò
-- ấy**. Làm hạng mục 8 bằng một phép nhúng `profiles(display_name)` thẳng vào
-- truy vấn sẽ cho họ một cột `null` im lặng — tính năng có mặt trong mã nguồn mà
-- vắng mặt đúng ở người cần nó nhất.
--
-- **Chủ dự án chốt 2026-08-08: mở một CỬA SỔ HẸP, không nới `profiles`.**
-- Cùng khuôn `list_equipment_borrower_options` (D-97, M09-B) và
-- `list_students_for_fees` (D-129, M03-C), và cùng một lý do đã ghi ở D-129:
-- **RLS lọc theo DÒNG, không theo CỘT** — thêm một nhánh vào
-- `profiles_select_self_or_global` là mở luôn `username` · `phone` · `email` ·
-- `account_status` · `last_login_at` của **mọi** tài khoản trong hệ thống cho
-- mọi Giáo lý viên, để đổi lấy đúng một cột `display_name` của vài người.
--
-- **0 `alter table` · 0 policy bị sửa · 0 dòng dữ liệu bị đụng.** Ranh giới cũ
-- không nhúc nhích: pgTAP `047` có bài canh hiện trạng chứng minh Trưởng ngành
-- đọc thẳng `public.profiles` **vẫn** chỉ thấy đúng hàng của chính mình sau
-- migration này.
-- ============================================================================

-- ── Cửa sổ hẹp: CHỈ id → tên hiển thị, CHỈ của người đã ra quyết định ────────
--
-- Ba giới hạn, và cả ba đều cố ý:
--
--   1. **Chỉ hai cột.** Không `username` (là thứ đăng nhập được), không `phone`,
--      không `email`, không `account_status`.
--   2. **Chỉ người đã ra quyết định trên một đề xuất người gọi ĐỌC ĐƯỢC.** Vị từ
--      bên dưới là bản sao **đúng từng chữ** của `promotion_reviews_select_scope`
--      (`20260722000700_promotions.sql:349-355`). Hàm `security definer` bỏ qua
--      RLS nên phải chép lại — đúng bài học đã ghi ở D-160: *"definer bỏ qua
--      policy ⇒ bỏ một vế là mở một đường vòng đi xuyên qua chính hàng rào vừa
--      dựng"*.
--   3. **Chỉ một năm học mỗi lượt gọi**, đúng phạm vi BR-M08-14 mà trang đang xem.
--
-- ⚠️ Hàm này **không** trả về danh bạ: một người chưa từng đề xuất và chưa từng
-- duyệt sẽ không bao giờ xuất hiện, dù người gọi có quyền gì. Muốn dò xem ai tồn
-- tại trong hệ thống thì phải tự tạo ra một đề xuất mang tên mình trước — tức
-- phải đã có quyền ghi trên đúng lớp ấy.
create function public.list_promotion_actor_names(p_academic_year_id uuid)
returns table (profile_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct actor.id, actor.display_name
  from public.profiles as actor
  where exists (
    select 1
    from public.promotion_reviews as review
    where review.source_academic_year_id = p_academic_year_id
      and (
        app.can_global_read()
        or app.can_access_class(review.source_class_id)
        or app.is_class_staff(review.source_class_id)
      )
      and (
        actor.id = review.proposed_by
        or actor.id = review.reviewed_by
        or exists (
          select 1
          from public.promotion_review_events as event
          where event.review_id = review.id
            and event.actor_id = actor.id
        )
      )
  )
$$;

-- Cùng hàng rào `grant` với hai RPC ghi của module (`…promotions.sql:344-347`):
-- `anon` và `public` không gọi được, kể cả khi biết tên hàm.
revoke all on function public.list_promotion_actor_names(uuid) from public, anon;
grant execute on function public.list_promotion_actor_names(uuid) to authenticated, service_role;

comment on function public.list_promotion_actor_names(uuid) is
  'M08-C hạng mục 8: cửa sổ hẹp id → display_name cho người đề xuất/người duyệt '
  'của các đề xuất người gọi đọc được. Chép nguyên vị từ promotion_reviews_select_scope; '
  'KHÔNG nới policy profiles.';
