-- ============================================================================
-- M04-A / TB-M04-02 Phương án A — RPC `transfer_class_staff` (đóng M04-F06).
--
-- D-105 (chủ dự án duyệt 2026-07-24): đổi lớp cho một Giáo lý viên là MỘT thao
-- tác, không phải ba. Trước đợt này, sự việc "anh A chuyển từ Ấu 1A sang Thiếu
-- 2B" phải ghi tay vào hai quyển sổ tách rời — `class_staff_assignments` (sổ
-- phân công) và `role_assignments` (thẻ ra vào mà phần mềm thật sự đọc) — và
-- không có gì bắt hai quyển phải khớp nhau. Ai dừng giữa chừng thì để lại một
-- tài khoản "zombie": đăng nhập được nhưng không thấy lớp nào, không điểm danh
-- được, và không màn hình nào nói vì sao (M04-F06 chấm 24/75, thấp gần nhất
-- toàn audit; 5W-06).
--
-- BỐN quyết định cài đặt cần nhớ:
--
--   1. 🔴 THỨ TỰ BỐN BƯỚC NGƯỢC VỚI `04_TO_BE_FLOWS.md`, và đây là điều bắt
--      buộc chứ không phải sở thích. Tài liệu ghi "1. end CSA · 2. end RA";
--      làm đúng như vậy thì hàm CHẾT NGAY Ở BƯỚC 1: trigger
--      `validate_class_staff_assignment` chạy `before update of is_active` và
--      ném `ACTIVE_CLASS_ROLE_EXISTS` nếu hồ sơ còn một vai trò lớp đang hiệu
--      lực. Phải khử vai trò TRƯỚC rồi mới đóng phân công — đúng thứ tự mà
--      `end_class_staff_assignment` (Phase 1) đã dùng. Không sửa `04`
--      (tài liệu audit, chỉ ghi lại ở đây và ở `16`).
--
--   2. Quyền = `app.can_manage_class` trên CẢ HAI lớp (D-105/D-107). Hàm đó có
--      sẵn từ M03 (ghi danh, chuyển lớp thiếu nhi) và trả đúng hai nhánh cần:
--      `can_global_write()` ⇒ Xứ đoàn trưởng/Phó · Thư ký · Super Admin thao
--      tác toàn xứ đoàn; `sector_leader`/`sector_deputy` ⇒ chỉ lớp thuộc ngành
--      mình. Đòi CẢ HAI lớp cùng đạt chính là điều chủ dự án nêu: Trưởng ngành
--      chuyển được người ĐANG dạy trong ngành mình sang lớp khác cũng trong
--      ngành mình, KHÔNG kéo được người từ ngành khác sang và KHÔNG lấy được
--      người chưa có lớp (người chưa có lớp thì không có phân công để chuyển).
--
--   3. Trần vai trò (D-102) ở đây MẠNH HƠN một phép so hạng: hàm chỉ sinh ra
--      vai trò LỚP, suy thẳng từ `p_new_capacity` bằng `case` cứng. Không có
--      tham số vai trò nào để truyền vào ⇒ không tồn tại đường gọi nào biến ai
--      đó thành `super_admin`, `group_leader`, hay bất cứ vai trò toàn cục/ngành
--      nào. So hạng vai trò vẫn giữ ở `assign_primary_role` cho luồng đổi vai
--      trò tổng quát; ở đây nó thừa.
--
--   4. Vai trò mới CHỈ được chèn khi hồ sơ VỐN ĐÃ có một vai trò lớp đang hiệu
--      lực cho lớp cũ. Hai trường hợp cố ý không đụng tới: (a) hồ sơ không có
--      tài khoản (Sơ chỉ dạy giáo lý, BR-S09) — chuyển lớp bình thường, không
--      sinh thẻ; (b) hồ sơ có tài khoản nhưng đang mang vai trò NGÀNH/TOÀN CỤC
--      (một Trưởng ngành cũng đứng lớp) — chuyển lớp không được hạ họ xuống
--      `class_teacher`, và `role_assignments_one_active_per_profile_idx` chỉ cho
--      một vai trò hiệu lực nên chèn thêm là vỡ. Giữ nguyên vai trò của họ.
-- ============================================================================

create or replace function public.transfer_class_staff(
  p_assignment_id uuid,
  p_new_class_id uuid,
  p_new_capacity public.class_staff_capacity,
  p_effective_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment public.class_staff_assignments;
  v_profile_id uuid;
  v_new_year_id uuid;
  v_new_role public.app_role;
  v_had_class_role boolean := false;
  v_new_assignment_id uuid;
begin
  -- Khoá dòng phân công cũ trước mọi việc khác: hai người cùng bấm "Chuyển lớp"
  -- trên một hồ sơ thì người sau phải thấy trạng thái sau khi người trước xong,
  -- không phải bản chụp cũ (cùng khuôn với `end_class_staff_assignment`).
  select * into v_assignment
  from public.class_staff_assignments
  where id = p_assignment_id and is_active
  for update;
  if v_assignment.id is null then
    raise exception 'ASSIGNMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Chốt chặn quyền (D-105). Đặt SAU khi đọc dòng vì cần biết lớp cũ là lớp nào,
  -- nhưng TRƯỚC mọi lệnh ghi.
  if not (app.can_manage_class(v_assignment.class_id) and app.can_manage_class(p_new_class_id)) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_new_class_id = v_assignment.class_id then
    raise exception 'SAME_CLASS' using errcode = '23514';
  end if;

  -- Lớp mới phải đang hoạt động. Trigger cũng bắt điều này ở bước chèn, nhưng
  -- báo sớm cho ra câu lỗi đúng chỗ thay vì một `23514` chung chung ở cuối hàm.
  select academic_year_id into v_new_year_id
  from public.classes
  where id = p_new_class_id and status = 'active';
  if v_new_year_id is null then
    raise exception 'CLASS_NOT_ACTIVE' using errcode = '23514';
  end if;

  -- Phân công cũ đóng ngày liền trước ngày hiệu lực. Ràng buộc
  -- `class_staff_assignment_date_order` đòi `ends_on >= starts_on`, nên chuyển
  -- lớp lùi về trước ngày bắt đầu của chính phân công đó là vô nghĩa ⇒ chặn.
  -- Riêng chuyển ngay trong ngày bắt đầu thì cho, đóng bằng chính `starts_on`.
  if p_effective_on < v_assignment.starts_on then
    raise exception 'INVALID_EFFECTIVE_DATE' using errcode = '23514';
  end if;

  select profile_id into v_profile_id
  from public.staff_profiles
  where id = v_assignment.staff_profile_id;

  -- BƯỚC 1 — khử vai trò lớp cũ. PHẢI đi trước bước 2 (xem ghi chú 1 ở đầu file).
  if v_profile_id is not null then
    update public.role_assignments
    set is_active = false,
        ends_on = greatest(starts_on, p_effective_on - 1)
    where profile_id = v_profile_id
      and is_active
      and class_id = v_assignment.class_id
      and role in ('class_representative', 'class_teacher', 'trainee_assistant');
    if found then
      v_had_class_role := true;
    end if;
  end if;

  -- BƯỚC 2 — đóng phân công cũ.
  update public.class_staff_assignments
  set is_active = false,
      ends_on = greatest(v_assignment.starts_on, p_effective_on - 1),
      updated_by = auth.uid()
  where id = p_assignment_id;

  -- BƯỚC 3 — mở phân công mới. Trigger `validate_class_staff_assignment` vẫn là
  -- chốt chặn cuối; lỗi ở đây rollback cả hàm nên phân công + vai trò cũ được
  -- giữ nguyên hiệu lực (AC-04.3).
  insert into public.class_staff_assignments (
    class_id, staff_profile_id, capacity, starts_on, is_active, updated_by
  )
  values (
    p_new_class_id, v_assignment.staff_profile_id, p_new_capacity, p_effective_on, true, auth.uid()
  )
  returning id into v_new_assignment_id;

  -- BƯỚC 4 — cấp lại thẻ lớp, chỉ khi vốn đã có (ghi chú 4 ở đầu file).
  if v_had_class_role then
    v_new_role := case p_new_capacity
      when 'representative' then 'class_representative'::public.app_role
      when 'member' then 'class_teacher'::public.app_role
      else 'trainee_assistant'::public.app_role
    end;
    insert into public.role_assignments (
      profile_id, role, academic_year_id, class_id, starts_on, is_active
    )
    values (
      v_profile_id, v_new_role, v_new_year_id, p_new_class_id, p_effective_on, true
    );
  end if;

  return v_new_assignment_id;
end;
$$;

revoke all on function public.transfer_class_staff(uuid, uuid, public.class_staff_capacity, date)
  from public, anon;
grant execute on function public.transfer_class_staff(uuid, uuid, public.class_staff_capacity, date)
  to authenticated, service_role;

comment on function public.transfer_class_staff(uuid, uuid, public.class_staff_capacity, date) is
  'D-105: chuyển một GLV sang lớp khác trong MỘT giao dịch — đóng phân công cũ, '
  'mở phân công mới, và mang theo vai trò đăng nhập lớp nếu vốn có. Quyền: '
  'app.can_manage_class trên CẢ HAI lớp, nên Trưởng/Phó ngành chỉ chuyển được '
  'trong ngành mình. Chỉ sinh ra vai trò lớp, không bao giờ vai trò toàn cục.';
