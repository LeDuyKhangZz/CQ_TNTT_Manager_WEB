-- ============================================================================
-- M01-B / TB-05 — RPC `assign_primary_role` (đóng M01-F12).
--
-- Trước đợt này KHÔNG có cách nào đổi vai trò/lớp của một Giáo lý viên mà GIỮ
-- được tài khoản đăng nhập: `adminProvisionAccount` chỉ TẠO mới, còn muốn đổi lớp
-- thì phải xóa tài khoản rồi cấp lại — GLV mất luôn đăng nhập. RPC này đổi vai trò
-- NGUYÊN TỬ: khử active bản ghi cũ rồi chèn bản ghi mới trong một giao dịch.
--
-- Ba quyết định cài đặt cần nhớ:
--
--   1. PHẢI là RPC `security definer`, không phải hai lần gọi từ Node. Unique index
--      `role_assignments_one_active_per_profile_idx` chỉ cho MỘT dòng active/hồ sơ;
--      tách hai lệnh ở tầng ứng dụng thì một lỗi giữa chừng để lại hồ sơ "không có
--      vai trò". Trong một hàm plpgsql, hai lệnh nằm CHUNG một giao dịch: bước chèn
--      bị trigger chặn (ví dụ chưa phân công lớp cho role lớp) sẽ rollback cả hàm ⇒
--      bản ghi cũ VẪN active (AC-04.2 atomic).
--
--   2. `security definer` bỏ qua RLS (bảng `role_assignments` không cấp INSERT cho
--      `authenticated`) NHƯNG không bỏ qua trigger. Mọi chốt chặn hiện có vẫn thi
--      hành trên bước chèn: `validate_role_assignment_scope` (kể cả BR-A17
--      `ACTIVE_CLASS_ASSIGNMENT_REQUIRED` cho role lớp), `validate_staff_role_link`,
--      `validate_ownership_role_link`, `scope_matches_role`. RPC không chép lại luật
--      nào — nó chỉ dựa vào các chốt chặn đó và thêm phần quyền + trần vai trò.
--      `app.is_super_admin()` đọc `auth.uid()` từ GUC của phiên gọi, không phải chủ
--      hàm, nên vẫn phản ánh đúng người gọi (giống `end_class_staff_assignment`).
--
--   3. Trần vai trò (D-102 / AC-04.4): KHÔNG bao giờ cấp `super_admin` qua RPC này,
--      kể cả khi người gọi là Super Admin — tạo Super Admin thứ hai không có lối UI.
--      Cũng không đổi vai trò của một tài khoản Super Admin khác, và không tự đổi
--      vai trò của chính mình (mất quyền giữa chừng). Đây là chốt chặn ở DB, cộng
--      hưởng với trần vai trò ở Zod + server action (S8).
-- ============================================================================

-- D-65 / TB-01.6 liệt kê "gán role" là một thao tác tài khoản phải ghi nhật ký,
-- nhưng enum `account_audit_action` (M01-A) chưa có giá trị đó — M01-A chưa làm
-- đổi vai trò. Bổ sung để `assignPrimaryRole` ghi được audit đúng loại.
alter type public.account_audit_action add value if not exists 'assign_role';

create or replace function public.assign_primary_role(
  p_profile_id uuid,
  p_role public.app_role,
  p_starts_on date,
  p_academic_year_id uuid default null,
  p_sector_id uuid default null,
  p_class_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- Chốt chặn 1 — chỉ Super Admin (AC-04.3 / S8). Không phiên ⇒ is_super_admin() false.
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Chốt chặn 2 — trần vai trò tuyệt đối (D-102 / AC-04.4).
  if p_role = 'super_admin' then
    raise exception 'ROLE_CEILING' using errcode = '42501';
  end if;

  -- Không tự đổi vai trò của chính mình.
  if p_profile_id = v_actor then
    raise exception 'CANNOT_MODIFY_SELF' using errcode = '42501';
  end if;

  -- Không đổi vai trò của một tài khoản Super Admin khác.
  if exists (
    select 1 from public.role_assignments
    where profile_id = p_profile_id and is_active and role = 'super_admin'
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Bước 1 — khử active vai trò hiện hành. `ends_on` phải >= `starts_on` của chính
  -- dòng đó (ràng buộc `role_assignments_date_order`); nếu vai trò cũ bắt đầu sau
  -- ngày (p_starts_on - 1) thì lấy `starts_on` để không vỡ ràng buộc.
  update public.role_assignments
    set is_active = false,
        ends_on = greatest(starts_on, p_starts_on - 1)
    where profile_id = p_profile_id and is_active;

  -- Bước 2 — chèn vai trò mới đang hoạt động. Mọi trigger là chốt chặn cuối; lỗi ở
  -- đây rollback cả hàm nên vai trò cũ được giữ nguyên active.
  insert into public.role_assignments (
    profile_id, role, academic_year_id, sector_id, class_id, starts_on, is_active
  )
  values (
    p_profile_id, p_role, p_academic_year_id, p_sector_id, p_class_id, p_starts_on, true
  );
end;
$$;

revoke all on function public.assign_primary_role(uuid, public.app_role, date, uuid, uuid, uuid) from public;
grant execute on function public.assign_primary_role(uuid, public.app_role, date, uuid, uuid, uuid) to authenticated;
