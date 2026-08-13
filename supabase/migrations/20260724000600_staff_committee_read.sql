-- ============================================================================
-- M09-C · D-100 — Thành viên cùng một Ban đang hoạt động đọc được hồ sơ nhau.
--
-- Nợ #13: `app.can_access_staff` chỉ có ba nhánh — quyền toàn cục · chính mình ·
-- cùng lớp. Không có nhánh "cùng Ban", nên một Trưởng ban mở Ban của mình chỉ
-- thấy tên những người tình cờ cùng lớp; những người khác hiện dấu gạch "—".
-- Đo được bằng JWT thật (pgTAP 020/024): 2/3 thành viên trả về null.
--
-- Chủ dự án duyệt 2026-07-24 (D-100): cho thành viên cùng một Ban ĐANG HOẠT ĐỘNG
-- thấy ĐẦY ĐỦ hồ sơ nhau — họ tên, số điện thoại, ngày sinh, địa chỉ — vì thành
-- viên Ban cần liên lạc và phối hợp với nhau. Đây là một thay đổi phân quyền
-- (NỚI), nên bắt buộc có RLS negative + positive test bằng JWT thật (AGENTS §13).
--
-- RLS là row-level, KHÔNG lọc theo cột: nới quyền đọc dòng nghĩa là mở cả dòng.
-- Đó chính là điều chủ dự án chọn — khác với D-97 (cửa sổ hẹp chỉ-tên cho ô
-- "Người mượn") vốn cố ý không nới `can_access_staff`. D-100 nới thẳng nên đóng
-- luôn nợ #13, và ô "Người mượn" của D-97 vẫn hoạt động nguyên vẹn bên trên nó.
--
-- Phạm vi ảnh hưởng: `can_access_staff` CHỈ được dùng ở policy
-- `staff_profiles_select_scope` (đã rà: không nơi nào khác gọi nó), nên nới ở đây
-- không lan sang bảng khác.
-- Migration/data impact: 0 bảng mới, 0 cột mới; chỉ thêm một nhánh đọc.
-- ============================================================================

-- Cùng khuôn với `app.is_committee_member`: hỏi "người kia có đang là thành viên
-- của một Ban mà TÔI cũng đang là thành viên không". `member_committee_ids()`
-- lấy đúng các Ban đang hoạt động của người gọi (qua staff_profile của họ), nên
-- người không có hồ sơ nhân sự (phụ huynh/thiếu nhi) nhận mảng rỗng ⇒ không mở
-- thêm gì. Nhiệm kỳ đã kết thúc (`is_active = false`) không tính ở CẢ HAI phía.
create function app.shares_active_committee(target_staff_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.committee_memberships as target_membership
      where target_membership.staff_profile_id = target_staff_profile_id
        and target_membership.is_active
        and target_membership.committee_id = any (app.member_committee_ids())
    ),
    false
  )
$$;

-- Thêm nhánh thứ tư vào cuối. Giữ nguyên ba nhánh cũ để không đổi hành vi hiện
-- có; `create or replace` giữ nguyên quyền EXECUTE đã cấp.
create or replace function app.can_access_staff(target_staff_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_read()
    or exists (select 1 from public.staff_profiles where id = target_staff_profile_id and profile_id = auth.uid())
    or exists (
      select 1 from public.class_staff_assignments
      where staff_profile_id = target_staff_profile_id
        and is_active
        and app.can_access_class(class_id)
    )
    or app.shares_active_committee(target_staff_profile_id), false
  )
$$;

revoke all on function app.shares_active_committee(uuid) from public;
grant execute on function app.shares_active_committee(uuid) to authenticated, service_role;

comment on function app.shares_active_committee(uuid) is
  'D-100: người gọi và nhân sự đích cùng là thành viên đang hoạt động của ít nhất một Ban. Dùng cho nhánh "cùng Ban" của can_access_staff (nợ #13).';
