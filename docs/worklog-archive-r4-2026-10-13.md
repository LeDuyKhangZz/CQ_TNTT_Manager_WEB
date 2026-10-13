# Bản lưu WORKLOG khi đóng R4.1 — 13/10/2026

### [2026-08-19] Phiên 73 — Claude — `IMP-BULK-002` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án đọc `NHAP_LIEU_HANG_LOAT.md` của phiên 72 rồi ra ba lệnh: (1) *"module nhập
  hàng loạt chỉ có admin được làm, và chỉ xuất hiện ở trang admin"*; (2) *"nhân sự thiếu thông tin
  thì kệ, vẫn cho nhập, không bị lỗi — ai thiếu thì khi có tài khoản cá nhân hệ thống báo và họ tự
  nhập lại đầy đủ"*; (3) *"hướng dẫn kĩ càng trình tự nhập: ai trước, nhập ở đâu"*. Kèm một thắc
  mắc phải trả lời trước khi làm: *"thư mục `NH_2025-2026` toàn dữ liệu năm cũ thì sao lại nhập
  2026-2027?"*. **Đã hỏi lại phạm vi của lệnh (2)** — nới cho *cả nhân sự lẫn thiếu nhi*; chủ dự án
  chọn phương án rộng.
- **Trả lời thắc mắc (đã đo, không đoán):** khối thiếu nhi và khối dự trưởng lấy từ
  `DANH SÁCH LÊN LỚP NH 2026-2027/` — đếm lại từng workbook: **593 em / 18 lớp** và **32 dự
  trưởng**, khớp đúng con số của bản cũ. Chỗ **thật sự** là dữ liệu năm cũ chỉ có **phân công huynh
  trưởng** (`danh_sach_xu_doan_2025_2026.xlsx`) và các cột sơ yếu lý lịch tra thêm từ sheet `SYLL`.
  Bản 2 của file MD ghi nguồn của **từng** khối thành một bảng ở §1.
- **Làm được:**
  1. 🔴 **Quyền thu về đúng một người, ở CẢ BA tầng.** `ROUTE_RULES` (`/imports` + `/staff/bulk`) ·
     `IMPORT_ROLES` · và policy của `import_batches`/`import_rows` đổi từ `app.can_global_write()`
     sang `app.is_super_admin()`; hai RPC `commit_import_rows` + `confirm_import_duplicate` đổi theo
     (chúng `security definer` nên hàng rào bên trong là hàng rào duy nhất). Hai mục điều hướng bị
     **gỡ hẳn**, thay bằng thẻ ở `/admin`; `getPageTitle` + breadcrumb có bảng tra riêng nên
     `/imports` không rơi về tên ứng dụng và `/staff/bulk` không mượn nhãn của `/staff`.
     ⚠️ **Phạm vi cố ý hẹp:** KHÔNG siết `students`/`guardians`/`staff_profiles` — ba vai trò kia
     vẫn tạo/sửa từng hồ sơ ở màn hình thường.
  2. 🔴 **Năm cột NOT NULL được nới**, và mỗi cột là một nhóm người có thật:
     `staff_profiles.phone` (46 người, cả Ban Trợ tá) · `guardians.phone` (sổ có tên cha/mẹ mà
     không có số) · `students.gender` (sổ SYLL **không có cột này**) · `students.date_of_birth` +
     `students.guardian_id` (229/593 em chỉ có tên). Hàng rào **giữ lại**: thiếu họ tên · lớp không
     khớp · ngày sinh ở tương lai · D-133 trùng chắc chắn — ba cái đầu là dữ liệu *hỏng*, cái cuối
     là chỗ máy không được quyết thay người.
  3. 🔴 **Mức dò trùng thứ tư**, sinh ra bởi chính việc nới trên: ba mức cũ đều tựa vào ngày sinh
     hoặc SĐT phụ huynh, nên một em **chỉ có tên** thì không mức nào bắt được — dán lại khối ấy lần
     hai là đẻ ra hồ sơ thứ hai trong im lặng. Nay trùng khít họ tên **khi cả hai bên đều trống cả
     hai điểm tựa** ⇒ mức `low`. `findInFileDuplicates` cũng thôi bỏ qua dòng trống ngày sinh.
  4. **Đường tự bổ sung hồ sơ** — nửa sau của lời hứa ở lệnh (2). `/account` có khối *"Thông tin
     liên lạc của bạn"* nói thẳng còn thiếu gì; policy `staff_profiles_update_self` cho ghi **đúng
     bốn cột** trên hàng của chính mình, trigger `app.guard_staff_self_update` chặn phần còn lại.
     🔴 Trigger này **không được** `security definer`: trong một hàm definer, `current_user` là chủ
     sở hữu hàm nên phép so `current_user <> 'authenticated'` luôn đúng và hàng rào thành một câu
     `return new` vô nghĩa — đo được bằng bài 20/21 của pgTAP `056` (*"caught: no exception"*).
  5. **`v_incomplete_student_profiles`** thêm `missing_gender` · `missing_date_of_birth` ·
     `missing_guardian`. `missing_guardian` đọc `student.guardian_id` chứ **không** đọc
     `guardian.id` sau LEFT JOIN — GLV lớp không đọc được bảng `guardians`, nên join trả NULL vì
     **thiếu quyền** chứ không phải **thiếu dữ liệu**.
  6. **`NHAP_LIEU_HANG_LOAT.md` — bản 2.** Giữ nguyên mọi dòng bản 1 đã rà tay, **bổ sung** những
     người bị loại: 593 thiếu nhi (+229) và 128 nhân sự (+46, gồm cả 16 trợ tá mà bản 1 để bảng
     rỗng). Thêm §0 (ai làm, vào đâu), §1 (nguồn từng khối), §2 (bảng luật cũ/mới), §3 (7 bước +
     hai quy trình từng-bước), §6 (ai còn thiếu gì, ai điền). 🔴 **Sửa một lỗi của bản 1:** 12 dự
     trưởng đứng ở **cả hai** khối, mà `class_staff_one_active_class_per_staff_idx` chỉ cho **một
     lớp đang hoạt động một người** ⇒ lượt dán thứ hai sẽ báo lỗi phân công đúng 12 dòng ấy.
     🔴 **Và một cái bẫy trong sổ gốc:** cột mang tiêu đề `SỐ ĐTHOẠI` của sổ chia lớp **bị xáo** —
     35/58 người mang số của người khác; cột cuối mới là số đúng (khớp 55/58 với bản đã rà tay).
     28 người mới thêm được đánh dấu riêng để chủ dự án đối chiếu lại.
- **File thay đổi:** `supabase/migrations/20260819000100_bulk_import_admin_only_and_partial_profiles.sql`
  (mới) · `supabase/tests/056_bulk_import_admin_only_test.sql` (mới) ·
  `supabase/tests/{006,011,039,040,054}*` · `src/lib/permissions/route-map.ts` ·
  `src/config/navigation.ts` · `src/app/(dashboard)/{admin,account,staff,students}/**` ·
  `src/features/imports/{build-row,dedup,import-feedback}.ts` ·
  `src/features/imports/server/{actions,permissions,queries}.ts` ·
  `src/features/imports/components/batch-row-editor.tsx` ·
  `src/features/staff/{profile-completeness.ts,components/own-contact-form.tsx}` (mới) ·
  `src/features/staff/{schemas,staff-directory,staff-duplicates}.ts` ·
  `src/features/staff/server/{actions,queries}.ts` · `src/features/staff/bulk/{parse.ts,server/actions.ts}` ·
  `src/features/students/**` · `src/features/guardians/**` ·
  `src/features/auth/{server/{actions,queries}.ts,components/account-admin-panel.tsx}` ·
  `src/lib/students/duplicate.ts` · `src/lib/dates/index.ts` · `src/types/database.ts` ·
  `docs/{02,05,09}` · `tests/unit/*` · `tests/e2e/{imports,authenticated-shell,responsive}.spec.ts` ·
  `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md`.
- **Migration/data impact:** **1 migration** — 6 policy đổi vai trò (`import_batches` ×3,
  `import_rows` ×3) · 2 RPC + 1 wrapper viết lại · 5 cột `drop not null` + 2 CHECK dựng lại ·
  1 view mở rộng · 1 policy + 1 trigger mới trên `staff_profiles`. **0 backfill · 0 dòng dữ liệu bị
  đụng · 0 quyền ghi mới cho `authenticated`** (chỉ SIẾT, trừ đúng một đường tự-sửa-hồ-sơ-mình).
- **Đã test (số thật):** `npm run test:db` → **1465/1465** trên **56 file** (trước 1385/55; file mới
  `056` **22 bài**, dùng JWT thật của Super Admin · Thư ký · GLV lớp) · `npm test` →
  **1726 pass / 24 skip** (123 file) · `npm run lint` → **0 warning 0 error** · `npm run typecheck`
  → ✓ · `npm run build` → ✓ · E2E `imports.spec.ts` + `authenticated-shell.spec.ts` trên
  `laptop-1366` → **exit 0** (DB vừa `db:reset` + `seed:dev`).
  🔴 **Khối dán được kiểm bằng CHÍNH parser của web**, đúng cách phiên 72 đã làm: 18 khối thiếu nhi
  → `parsePastedText` + `buildRow` = **593/593 dòng, 0 lỗi chặn ghi**; 3 khối nhân sự →
  `parseStaffText` = **128/128 dòng, 0 lỗi**. (Bản 1: 25 dòng nhân sự lỗi, và 229 em không có mặt.)
- **Quyết định mới:**
  - Nhập hàng loạt = **riêng Super Admin**, và chỉ hiện ở `/admin` (thay luật bốn vai trò của
    IMP-BULK-001).
  - Thiếu thông tin **không chặn**; chặn chỉ còn dành cho dữ liệu *hỏng* và cho quyết định trùng.
  - Người thiếu thông tin **tự bổ sung** ở `/account` — nhân sự làm được vì họ đăng nhập bằng
    `staff_code`, phụ huynh thì không (tên đăng nhập của họ chính là số điện thoại).
- **Blocker/rủi ro:**
  1. 🔴 **Hệ quả kèm theo của lệnh (1): hàng rào "năm học đã đóng" không còn áp cho đường nhập.**
     D-117 cho Super Admin ghi vào **mọi** năm học, mà nay người nhập duy nhất chính là Super Admin.
     Trước đợt này một Thư ký nhập vào năm đã đóng bị `YEAR_NOT_WRITABLE` chặn. Không phải lỗ hổng
     mới (D-117 có từ `20260726000200`), nhưng là **một tấm lưới đã mất** — đã ghi thành hai bài
     kiểm trong `054` thay vì xoá đi trong im lặng. Muốn giữ lưới thì phải chốt một luật mới.
  2. ⚠️ **Số điện thoại của 28 nhân sự mới thêm chưa được đối chiếu tay** — nguồn là cột cuối của
     một sheet đã biết là có cột bị xáo. Đã liệt kê riêng trong `<details>` ở §4.1 của file MD.
  3. ⚠️ **E2E chỉ chạy 2 spec trên 1 viewport**, không chạy đủ ba viewport (nợ #10/#15 vẫn ở đó).
  4. ⚠️ **`/staff/bulk` vẫn chưa có spec E2E riêng** — nợ mở từ phiên 72, chưa trả.
  5. ⚠️ Sổ lớp **Thiếu 3 ghi Lê Quốc Phương Trang hai lần**; đã ghi chú ngay trong khối §5.13 để
     người nhập chọn *Bỏ qua* một dòng.
- **Next action:** đẩy migration `20260819000100` lên production (dump trước), rồi quay lại việc của
  2B — **M11-B** như phiên 72 đã ghi.
