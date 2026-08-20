-- ============================================================================
-- BDH-2025-002 · "Chức vụ bổ nhiệm" của nhân sự — chỗ để hệ thống NHỚ ai là
-- Xứ đoàn phó, Thư ký, Trưởng ngành… trước khi họ có tài khoản.
--
-- Chủ dự án nêu vấn đề ngày 2026-08-20, kèm ảnh màn hình `/account` của
-- `GLV040`:
--
--   "anh lê trí dũng là Xứ Đoàn Phó Nội Vụ tương đương với xứ đoàn phó trong hệ
--    thống nhưng khi tạo tài khoản ra thì vai trò chỉ là giáo lý viên bình thường"
--
-- Không phải lỗi phân quyền — ô chọn vai trò **tự điền sẵn cái sai**, và nó điền
-- sai vì không có gì khác để điền. `grantableRolesForStaff` (D-111) suy vai trò
-- gợi ý từ `class_staff_assignments.capacity`: anh Dũng dạy Nghĩa 2 với tư cách
-- `member` ⇒ gợi ý `class_teacher`. Danh sách xổ xuống CÓ đủ `deputy_group_leader`,
-- nhưng ai bấm "Xác nhận" ngay thì nhận đúng cái được chọn sẵn.
--
-- Đối chiếu `NH_2025-2026/DS BAN ĐIỀU HÀNH.xlsx` với database: **14/20 người của
-- Ban Điều Hành có vai trò đúng KHÁC với cái được chọn sẵn.** Cùng một cái bẫy,
-- 14 lần nữa, mỗi lần là một người thật nhận sai quyền.
--
-- Gốc rễ: `staff_profiles` không có chỗ nào ghi **chức vụ được bổ nhiệm**, và
-- `role_assignments` thì không dùng được để ghi trước — nó tham chiếu
-- `profiles(id)`, tức phải CÓ tài khoản rồi mới ghi được vai trò. Chức vụ có
-- trước tài khoản hàng tháng trời.
--
-- 🔴 **Cột này KHÔNG cấp quyền.** Nó chỉ trả lời "sổ bổ nhiệm ghi người này là
-- gì", và hệ quả duy nhất là ô chọn trong hộp thoại "Cấp tài khoản"/"Đổi vai
-- trò" điền sẵn đúng thứ, cộng một dòng cảnh báo khi vai trò của tài khoản lệch
-- khỏi chức vụ. Quyền thật vẫn nằm nguyên ở `role_assignments`, vẫn đi qua
-- `assign_primary_role` với trần vai trò D-102 và chốt chặn "chỉ Super Admin".
-- Sửa cột này rồi ngồi đợi thì không có gì xảy ra cả.
--
-- Ai sửa được: **không cần policy mới.** `staff_profiles` đã có sẵn hai đường
-- ghi và cả hai đều đúng cho cột này —
--   · `staff_profiles_update_global_write` ⇒ Quản trị viên · Xứ đoàn trưởng ·
--     Phó Xứ đoàn · Thư ký, tức đúng những người cầm sổ bổ nhiệm;
--   · `staff_profiles_update_self` bị `app.guard_staff_self_update()` (IMP-BULK-002)
--     chặn theo **danh sách cho phép** — chỉ 4 cột liên lạc đi lọt, mọi cột khác
--     ném `STAFF_SELF_UPDATE_FIELDS`. Hàm ấy so `to_jsonb(new) - <danh sách>` với
--     `to_jsonb(old) - <danh sách>`, nên hai cột thêm hôm nay **tự động** được
--     bảo vệ mà không phải sửa một chữ nào trong nó. Đó là lý do phải viết
--     danh-sách-cho-phép chứ không phải danh-sách-cấm.
--
-- Data impact: thêm 2 cột nullable (mặc định NULL ⇒ 90 hồ sơ còn lại không đổi
-- hành vi một chút nào), rồi backfill **14 hồ sơ** đúng theo sổ. Sáu Trưởng Ban
-- của sổ CỐ Ý để NULL: "Trưởng ban" không phải một `app_role` (D-15) — nó là
-- `committee_memberships.position = 'leader'`, và vai trò đăng nhập của họ vẫn
-- là vai trò lớp. Rollback: `alter table … drop column` cả hai, không mất gì
-- ngoài chính bảng bổ nhiệm.
-- ============================================================================

alter table public.staff_profiles
  add column appointed_role public.app_role,
  add column appointed_sector_id uuid references public.sectors(id) on delete restrict;

-- Hình dạng hợp lệ, và nó cố ý HẸP hơn `app_role`:
--
--   · vai trò LỚP (`class_representative`/`class_teacher`/`trainee_assistant`)
--     KHÔNG được phép ở đây — vai trò lớp đã suy được từ `class_staff_assignments`
--     và luôn đúng hơn, ghi lại lần hai chỉ tạo ra hai nguồn sự thật lệch nhau;
--   · `super_admin`/`parish_priest`/`chaplain`/`guardian`/`student` cũng không:
--     `super_admin` là trần tuyệt đối không bao giờ cấp qua màn hình này (D-102),
--     ba cái còn lại không phải chức vụ trong sổ Ban Điều Hành;
--   · vai trò NGÀNH buộc phải kèm ngành, vai trò TOÀN XỨ ĐOÀN buộc phải không —
--     cùng luật với `role_assignments_scope_matches_role`, để cái điền sẵn không
--     bao giờ dẫn người dùng tới một lượt chèn chắc chắn bị trigger chặn.
alter table public.staff_profiles
  add constraint staff_profiles_appointment_shape check (
    (appointed_role is null and appointed_sector_id is null)
    or (appointed_role in ('sector_leader', 'sector_deputy') and appointed_sector_id is not null)
    or (appointed_role in ('group_leader', 'deputy_group_leader', 'secretary', 'treasurer')
        and appointed_sector_id is null)
  );

create index staff_profiles_appointed_role_idx
  on public.staff_profiles (appointed_role)
  where appointed_role is not null;

comment on column public.staff_profiles.appointed_role is
  'BDH-2025-002: chức vụ theo sổ Ban Điều Hành (Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký · Thủ quỹ · Trưởng ngành · Phó ngành). KHÔNG phải quyền — quyền nằm ở role_assignments. Cột này chỉ điền sẵn ô chọn khi cấp/đổi vai trò và bật cảnh báo khi tài khoản lệch chức vụ. Vai trò lớp không ghi ở đây: nó suy từ class_staff_assignments.capacity.';

comment on column public.staff_profiles.appointed_sector_id is
  'BDH-2025-002: ngành đi kèm khi appointed_role là Trưởng/Phó ngành; NULL với mọi chức vụ toàn xứ đoàn. Ràng buộc staff_profiles_appointment_shape canh cặp này.';

-- ── Backfill theo DS BAN ĐIỀU HÀNH.xlsx, NH 2025-2026 ───────────────────────
-- Khớp bằng `staff_code` chứ không bằng họ tên: sổ có **hai** "Maria Nguyễn Thị
-- Thanh Hằng" — GLV021 là Soeur (nữ tu, Thiếu 1A) và GLV056 là chị huynh trưởng
-- (Ấu 3A). Xứ đoàn trưởng là GLV056 (sổ ghi phân ngành Ấu; sheet `BAN ĐIỀU HÀNH`
-- của `danh_sach_xu_doan_2025_2026.xlsx` xếp vào Ban Thường Vụ với tư cách huynh
-- trưởng). Khớp bằng tên ở đây là trao toàn quyền xứ đoàn cho nhầm người.
--
-- `where` lọc theo staff_code nên lượt chạy trên một cơ sở dữ liệu chưa có nhân
-- sự (máy lập trình sau `db reset`) là một no-op sạch, không cần điều kiện phụ.
update public.staff_profiles as staff
set appointed_role = book.role::public.app_role,
    appointed_sector_id = book.sector_id::uuid
from (values
  -- Ban Thường Vụ
  ('GLV056', 'group_leader',        null),                                    -- Xứ Đoàn Trưởng
  ('GLV040', 'deputy_group_leader', null),                                    -- XĐ Phó Nội Vụ
  ('GLV046', 'deputy_group_leader', null),                                    -- XĐ Phó Ngoại Vụ
  ('GLV033', 'deputy_group_leader', null),                                    -- XĐ Phó Nghiên Huấn
  ('GLV026', 'secretary',           null),                                    -- Thư ký xứ đoàn
  ('GLV008', 'treasurer',           null),                                    -- Thủ quỹ
  -- Trưởng ngành
  ('GLV053', 'sector_leader', '10000000-0000-0000-0000-000000000002'),        -- Ngành Ấu
  ('GLV031', 'sector_leader', '10000000-0000-0000-0000-000000000003'),        -- Ngành Thiếu
  ('GLV044', 'sector_leader', '10000000-0000-0000-0000-000000000004'),        -- Ngành Nghĩa
  ('GLV048', 'sector_leader', '10000000-0000-0000-0000-000000000005'),        -- Ngành Hiệp - Dự
  -- Phó ngành
  ('GLV014', 'sector_deputy', '10000000-0000-0000-0000-000000000002'),        -- Ngành Ấu
  ('GLV011', 'sector_deputy', '10000000-0000-0000-0000-000000000002'),        -- Ngành Ấu
  ('GLV024', 'sector_deputy', '10000000-0000-0000-0000-000000000003'),        -- Ngành Thiếu
  ('GLV036', 'sector_deputy', '10000000-0000-0000-0000-000000000004')         -- Ngành Nghĩa
) as book(staff_code, role, sector_id)
where staff.staff_code::text = book.staff_code
  and (
    staff.appointed_role is distinct from book.role::public.app_role
    or staff.appointed_sector_id is distinct from book.sector_id::uuid
  );
