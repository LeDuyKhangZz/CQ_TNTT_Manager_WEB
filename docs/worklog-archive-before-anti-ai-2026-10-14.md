# Entry archived before anti-AI release

### [2026-08-20] Phiên 75 — Claude — `BDH-2025-001` + `BDH-2025-002` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án gửi `NH_2025-2026/DS BAN ĐIỀU HÀNH.xlsx` kèm ảnh màn hình `/account`:
  *"file chứa các người được bổ nhiệm làm các chức vụ tương đương với các role phân quyền trong hệ
  thống, thì tôi cần bạn làm sao kiếm các người này trong hệ thống hiện tại và đảm bảo khi tôi là
  admin tạo tài khoản cho họ thì họ sẽ được đúng role đúng phân quyền hệ thống — ví dụ như anh lê
  trí dũng là Xứ Đoàn Phó Nội Vụ… nhưng khi tạo tài khoản ra thì vai trò chỉ là giáo lý viên bình
  thường"*.
- **Đã hỏi lại trước khi code** — ba lựa chọn, chủ dự án chọn cả ba mức "làm thật": (a) thêm trường
  chức vụ bổ nhiệm, (b) gộp Chiên Con vào ngành Ấu Nhi, (c) tạo 6 Ban bằng migration.
- **Đo trước khi sửa, không đoán.** Đối chiếu từng dòng sổ với production qua session pooler:
  **20/20 hồ sơ tìm thấy, tên thánh khớp 20/20.** Toàn hệ thống mới có **3 tài khoản** (2 Super
  Admin + `GLV040`). `select count(*) from public.committees` ⇒ **0**.
  `class_staff_assignments` đang hoạt động: `member 65` · `trainee 22` · **`representative 0`**.
- **Nguyên nhân gốc (không phải lỗi phân quyền):** `staff_profiles` **không có cột nào ghi chức vụ**,
  và `role_assignments` không dùng để ghi trước được — nó tham chiếu `profiles(id)`, tức phải CÓ tài
  khoản rồi mới ghi được vai trò, trong khi chức vụ có trước tài khoản hàng tháng. Nên hộp thoại
  "Cấp tài khoản" chỉ còn một thứ để đoán: `capacity` của phân công lớp.
- **Làm được:**
  1. **`BDH-2025-001` — 6 Ban thật vào migration.** `PHUNG_VU · SINH_HOAT · KY_THUAT · TRUC ·
     TRUYEN_THONG · Y_TE`, thứ tự theo đúng sổ, chỉ Ban Kỹ thuật giữ kho thiết bị. `QUAN_LY` của
     seed cũ bị hạ cờ rồi **xoá có điều kiện** (9 khoá ngoại `on delete restrict` trỏ vào
     `committees`, nên phải tự kiểm trước chứ không để DB trả lời hộ). Khối committees **rời khỏi
     `seed.sql`** — cùng lý do và cùng khuôn với `20260725000100_reference_catalog.sql`.
  2. **`BDH-2025-002` — `appointed_role` + `appointed_sector_id`.** CHECK
     `staff_profiles_appointment_shape` hẹp hơn `app_role` một cách có chủ ý: **không** nhận vai trò
     lớp (đã suy được từ phân công — ghi lần hai là hai nguồn sự thật lệch nhau), không nhận
     `super_admin` (trần D-102), và buộc cặp chức-vụ-ngành khớp nhau đúng như
     `role_assignments_scope_matches_role`. Backfill **14 hồ sơ** khớp bằng **`staff_code`, không
     bằng họ tên**: sổ có **hai** "Maria Nguyễn Thị Thanh Hằng" (`GLV021` là Soeur ở Thiếu 1A,
     `GLV056` là chị huynh trưởng ở Ấu 3A) — khớp bằng tên ở đây là trao toàn quyền xứ đoàn cho
     nhầm người. **6 Trưởng Ban của sổ cố ý để NULL:** "Trưởng ban" không phải `app_role` (D-15).
  3. **Ai sửa được cột mới — 0 policy mới.** `staff_profiles_update_global_write` đã đúng tập người
     cầm sổ bổ nhiệm; còn `staff_profiles_update_self` bị `app.guard_staff_self_update()`
     (IMP-BULK-002) chặn theo **danh sách cho phép** (`to_jsonb(new) - <4 cột liên lạc>`), nên hai
     cột thêm hôm nay **tự động** được bảo vệ. pgTAP `058` canh đúng chỗ đó: nếu ai đổi hàm ấy sang
     danh-sách-cấm thì đây là bài đỏ trước tiên.
  4. **Tầng ứng dụng:** `grantableRolesForStaff` nhận thêm `appointedRole` và **sổ bổ nhiệm thắng
     phân công lớp** · `isAppointableRole()` lọc lại giá trị đọc từ DB (chọn sẵn một vai trò lớp mà
     không kèm `classId` là đẩy người dùng vào lượt chèn chắc chắn bị trigger chặn) ·
     `recommendedSectorId` điền sẵn luôn ô Ngành · khối "Tài khoản đăng nhập" **cảnh báo khi vai trò
     lệch chức vụ** (dùng khuôn `border-warning` thay vì `FormMessage tone="danger"`: đây là trạng
     thái đứng yên, `role="alert"` sẽ bắt trình đọc màn hình đọc "Lỗi:" ngay khi tải trang) · ô
     "Chức vụ bổ nhiệm" trong biểu mẫu sửa hồ sơ, ô "Ngành" chỉ hiện với chức vụ ngành ·
     `updateStaffSchema.superRefine` canh cặp ở tầng Zod để người dùng nhận câu tiếng Việt thay vì
     một `23514` trần bị `updateStaff` đổi thành "Không cập nhật được hồ sơ".
  5. **`NH_2025-2026/PHAN_QUYEN_BAN_DIEU_HANH_2025-2026.md`** — bảng 20 người kèm mã hồ sơ, vai trò
     phải chọn, ngành phải chọn; cách sửa `GLV040`; và 4 lỗ hổng đo được (§6).
- **File thay đổi:** `supabase/migrations/20260820000100_parish_committees.sql` ·
  `supabase/migrations/20260820000200_staff_appointed_role.sql` ·
  `supabase/tests/058_bdh_appointment_and_committees_test.sql` · `supabase/seed.sql` ·
  `src/types/database.ts` · `staff/grantable-roles.ts` · `staff/schemas.ts` ·
  `staff/server/queries.ts` · `staff/server/actions.ts` · `staff/components/staff-account-panel.tsx` ·
  `staff/components/staff-profile-editor.tsx` · `app/(dashboard)/staff/[staffId]/page.tsx` ·
  `tests/unit/provisionable-roles.test.ts` · `tests/unit/staff-schemas.test.ts` ·
  `NH_2025-2026/PHAN_QUYEN_BAN_DIEU_HANH_2025-2026.md` (mới).
- **Migration/data impact:** 2 migration, **đã push production**. Chèn **6 dòng** vào một bảng đang
  rỗng (`committees`), thêm **2 cột nullable** và backfill **14 dòng** `staff_profiles`. **0 policy
  mới · 0 đổi RLS · 0 đổi quyền · 0 dòng thiếu nhi bị đụng.** Sao lưu trước khi push:
  `backups/prod-20260820-truoc-BDH.sql` (schema) + `…-data.sql` (2,1 MB, ngoài repo).
- **Đã test (số thật):** pgTAP **1500/1500** (58 file, +19 bài mới) · unit **1749 pass / 24 skip**
  (123 file, +11 bài mới) · lint **0 warning** · typecheck ✓ · build **28/28**. Xác minh trên
  production sau push: `committees` 6 dòng đúng thứ tự sổ · `appointed_role is not null` = **14**.
  ⚠️ **Chưa chạy E2E** cho đợt này.
- **Quyết định mới:** **BDH-2025-002** — chức vụ bổ nhiệm là **dữ liệu về sổ, không phải quyền**;
  nó chỉ điền sẵn ô chọn và bật cảnh báo lệch, quyền vẫn đi nguyên qua `assign_primary_role` với
  trần D-102 và chốt "chỉ Super Admin". **BDH-2025-001** — danh sách Ban của xứ đoàn có **Ban Trực**
  và **không có** "Ban Quản lý"; dữ liệu tham chiếu đi theo migration, không theo seed.
- **Blocker/rủi ro:** việc (b) **gộp Chiên Con vào Ấu Nhi — CHƯA LÀM**, xem `BLOCKERS`. Ngoài ra
  `GLV040` vẫn đang mang `class_teacher`: cố ý để chủ dự án bấm "Đổi vai trò" trên giao diện, vì
  đường ấy ghi `account_audit_events` còn một lệnh UPDATE trong migration thì không có actor thật
  để ghi vào nhật ký.
- **Next action:** chốt hướng Chiên Con (§6.1 của báo cáo), rồi cấp 19 tài khoản còn lại theo bảng
  §3 và gắn 6 Trưởng ban ở `/committees`.
