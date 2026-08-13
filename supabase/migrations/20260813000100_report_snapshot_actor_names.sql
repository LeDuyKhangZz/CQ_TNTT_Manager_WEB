-- ============================================================================
-- 2B · M11-C — Báo cáo & Dashboard, đợt 3/3 (cơ sở dữ liệu)
--
-- TB-06 bước 2: mỗi dòng của kho bản chốt phải hiện **người chốt**, và AC-B10
-- đòi hai bản cùng loại cùng kỳ phải phân biệt được *"ở phần phạm vi và người
-- chốt"*.
--
-- 0 `alter table` · 0 policy bị sửa · 0 backfill · 0 dòng dữ liệu bị đụng.
-- ============================================================================

-- ── Cửa sổ hẹp: id → tên hiển thị, CHỈ của người đã chốt báo cáo mình đọc được ─
--
-- 🔴 Cùng cái bẫy mà M08-C đã vấp (`07` §2.4 → D-163) và M11-B vừa gặp lại:
-- `profiles_select_self_or_global` (`20260724000100:24-29`) chỉ mở cho **chính
-- mình** hoặc `app.can_global_read()` — sáu vai trò cấp xứ đoàn. Hai nhóm chốt
-- báo cáo nhiều nhất, **Trưởng ngành** và **Giáo lý viên đại diện**, không nằm
-- trong sáu. Nhúng `profiles(display_name)` thẳng vào truy vấn danh sách sẽ cho
-- họ một cột trống **trong im lặng** — cột có mặt trong mã nguồn mà vắng mặt
-- đúng ở người cần nó nhất.
--
-- Vì sao KHÔNG dùng lại `find_report_snapshot_duplicate` của M11-B: hàm ấy tra
-- **một** bộ (loại · phạm vi · kỳ) và trả **một** hàng. Trang kho hiện 20 dòng
-- mỗi trang với 20 bộ khác nhau ⇒ 20 lượt gọi cho một lượt dựng trang.
--
-- Ba giới hạn, cả ba cố ý — chép đúng khuôn `list_promotion_actor_names` (D-163):
--   1. **Hai cột.** Không `username` (thứ đăng nhập được), không `phone`, không
--      `email`, không `account_status`.
--   2. **Chỉ người đã chốt một bản mà người gọi ĐỌC ĐƯỢC.** Vị từ là lời gọi
--      thẳng `app.can_read_report(...)` — chính vị từ của
--      `report_snapshots_select_scope`, không phải bản chép tay của nó (D-160:
--      definer bỏ qua policy nên bỏ một vế là mở một đường vòng).
--   3. **Không phải danh bạ.** Người chưa từng chốt báo cáo nào sẽ không bao giờ
--      xuất hiện, dù người gọi có quyền gì.
create function public.list_report_snapshot_actors()
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
    from public.report_snapshots as snapshot
    where snapshot.generated_by = actor.id
      and app.can_read_report(snapshot.scope_type, snapshot.scope_id)
  )
$$;

revoke all on function public.list_report_snapshot_actors() from public, anon;
grant execute on function public.list_report_snapshot_actors() to authenticated, service_role;

comment on function public.list_report_snapshot_actors() is
  'TB-06/AC-B10: cửa sổ hẹp id → display_name cho người đã chốt các báo cáo mà '
  'người gọi đọc được. Chép nguyên vị từ report_snapshots_select_scope; '
  'KHÔNG nới policy profiles.';
