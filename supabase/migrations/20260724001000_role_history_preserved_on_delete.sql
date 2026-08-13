-- ============================================================================
-- M01-C / D-101 (Q3) — Xóa tài khoản GIỮ LẠI lịch sử vai trò.
--
-- Trước đợt này `role_assignments.profile_id ... on delete cascade` xóa sạch toàn
-- bộ lịch sử vai trò khi tài khoản đăng nhập bị xóa — chính bảng được đặt tên
-- "Primary role history". Chủ dự án chốt (2026-07-24): xóa tài khoản chỉ gỡ khả
-- năng đăng nhập; hồ sơ nghiệp vụ VÀ lịch sử vai trò vẫn còn (cùng khuôn với
-- `staff_profiles`/`guardians`/`students` vốn đã `on delete set null`).
--
-- Rủi ro cao vì đổi FK ẢNH HƯỞNG DỮ LIỆU HIỆN CÓ và bảng này là nền của mọi RLS
-- qua `app.current_role()`. Ba việc trong một migration:
--
--   1. `profile_id` thành nullable + FK `on delete set null` (thay `cascade`).
--
--   2. 🔴 Hai trigger `validate_ownership_role_link` và `validate_staff_role_link`
--      chạy `before update OF profile_id`. Khi FK set-null ô `profile_id` của một
--      dòng vai trò ĐANG ACTIVE (guardian/student, hoặc GLV/lãnh đạo/lớp), chúng
--      đòi liên kết guardians/students/staff_profiles — nhưng `new.profile_id` lúc
--      đó ĐÃ là NULL nên `where profile_id = new.profile_id` không khớp gì ⇒ ném
--      `*_PROFILE_REQUIRED` và LÀM HỎNG LUÔN lệnh xóa tài khoản. Thêm chốt
--      `new.profile_id is not null`: dòng lịch sử mồ côi (đã mất chủ) không cần
--      liên kết nào. Đây là lý do đợt này phải chạy lại TOÀN BỘ pgTAP RLS.
--
--   3. RLS `role_assignments_select_self_or_global` GIỮ NGUYÊN: `profile_id =
--      auth.uid() or app.can_global_read()`. Với `profile_id` NULL, vế `NULL =
--      <uuid>` ra NULL (không phải true) nên dòng mồ côi CHỈ nhóm đọc-toàn-cục
--      thấy — đúng ý D-101 (giữ lịch sử cho quản trị rà soát), không rò cho người
--      thường. Không rewrite policy đang đúng; pgTAP `028` khóa lại bất biến này.
--
-- KHÔNG đổi `is_active` của dòng mồ côi: nó không còn khớp `auth.uid()` của ai nên
-- vô hại về chức năng (`app.current_role()`/`current_sector_id()`/`current_class_id()`
-- đều lọc `profile_id = auth.uid()`), và giữ nguyên thì lịch sử trung thực với lúc
-- xóa. Unique index `role_assignments_one_active_per_profile_idx` trên `(profile_id)
-- where is_active` cho phép nhiều dòng NULL cùng active (NULLS DISTINCT), nên nhiều
-- tài khoản bị xóa không đụng nhau.
-- ============================================================================

alter table public.role_assignments
  alter column profile_id drop not null;

alter table public.role_assignments
  drop constraint role_assignments_profile_id_fkey,
  add constraint role_assignments_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete set null;

-- Chốt NULL cho hai trigger liên kết. `create or replace` giữ nguyên trigger đang
-- gắn và ACL hiện có — chỉ đổi thân hàm, thêm `new.profile_id is not null`.
create or replace function app.validate_ownership_role_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- profile_id NULL = dòng lịch sử mồ côi sau khi xóa tài khoản (D-101): không còn
  -- chủ để đòi liên kết. Bỏ qua để FK `on delete set null` không vỡ.
  if new.profile_id is not null and new.is_active and new.role = 'guardian' and not exists (
    select 1 from public.guardians where profile_id = new.profile_id
  ) then
    raise exception 'GUARDIAN_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  if new.profile_id is not null and new.is_active and new.role = 'student' and not exists (
    select 1 from public.students where profile_id = new.profile_id
  ) then
    raise exception 'STUDENT_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function app.validate_staff_role_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.profile_id is not null
     and new.is_active
     and new.role in (
       'group_leader', 'deputy_group_leader', 'secretary', 'treasurer',
       'sector_leader', 'sector_deputy',
       'class_representative', 'class_teacher', 'trainee_assistant'
     )
     and not exists (
       select 1 from public.staff_profiles where profile_id = new.profile_id
     ) then
    raise exception 'STAFF_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on constraint role_assignments_profile_id_fkey on public.role_assignments is
  'D-101: xóa tài khoản GIỮ lịch sử vai trò (set null), không xóa dây chuyền.';
