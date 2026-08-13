# M12-IMPORTS — 01. Khám phá module

## 1. Mục tiêu nghiệp vụ

Nhập hàng loạt hồ sơ thiếu nhi + phụ huynh + ghi danh từ **sổ lớp Excel của GLV** vào hệ thống,
theo luồng bắt buộc của `docs/09-data-import-and-seed.md` §2:

```
Upload → Parse → Normalize → Validate → Duplicate warnings
→ Dry-run preview → User confirms → Commit batch → Download result
```

Nguyên tắc gốc: **không import trực tiếp vào bảng nghiệp vụ**; dry-run chỉ ghi vào bảng staging
(`docs/09` §2, §9). Người dùng là người kiểm tra dữ liệu (`docs/09` §1).

## 2. Actor

| Actor | Vai trò | Quyền |
|---|---|---|
| Super Admin | `super_admin` | Toàn quyền import |
| Xứ đoàn trưởng | `group_leader` | Toàn quyền import |
| Phó Xứ đoàn | `deputy_group_leader` | Toàn quyền import |
| Thư ký | `secretary` | Toàn quyền import |
| **Mọi vai trò khác** | — | **Bị chặn** cả ở route (`route-map.ts:47-51`), ở Server Action (`permissions.ts:17-25`) và ở RLS (`app.can_global_write()`) |

Đây là tập `global_write` — trùng khớp 3 tầng, không lệch.

## 3. Route

| Route | File | Guard |
|---|---|---|
| `/imports` | `src/app/(dashboard)/imports/page.tsx:52-53` | `requireImportPage()` |
| `/imports/[batchId]` | `src/app/(dashboard)/imports/[batchId]/page.tsx:153` | `requireImportPage()` |
| `/imports/template` (GET, tải file mẫu) | `src/app/(dashboard)/imports/template/route.ts:5-18` | `requireImportAccess()` |
| Quy tắc route | `src/lib/permissions/route-map.ts:47-51` | 4 vai trò global-write |

> **Lệch với `docs/06` §7:** UI spec liệt kê `/admin/import` (`docs/06-ui-ux-spec.md:119`),
> hiện thực dùng `/imports`. Không phải lỗi chức năng nhưng docs cần cập nhật.

## 4. Component

Toàn bộ là **Server Component + form action thuần**, không có Client Component nào:

| Component | File | Vai trò |
|---|---|---|
| `ImportsPage` | `imports/page.tsx:52-154` | Form upload + chọn lớp đích + danh sách 20 batch gần nhất |
| `BatchRow` | `imports/page.tsx:28-50` | Thẻ tóm tắt một batch |
| `ImportBatchPage` | `imports/[batchId]/page.tsx:148-212` | Tóm tắt + nút Ghi/Xóa + danh sách toàn bộ dòng |
| `RowCard` | `imports/[batchId]/page.tsx:55-146` | Một dòng: lỗi, cảnh báo, chọn giới tính, chọn xử lý |

## 5. Server Action / RPC / Query / thư viện thuần

### 5.1 Server Action (`src/features/imports/server/actions.ts`)

| Tên | Line | Vai trò |
|---|---|---|
| `createDryRunBatch(formData)` | `60-178` | Parse workbook → build rows → dedup → ghi staging |
| `setRowAction(rowId, action)` | `181-195` | Ghi quyết định `create`/`merge`/`skip` |
| `setRowGender(rowId, gender)` | `202-234` | Điền giới tính thiếu (SYLL không có cột này) |
| `commitBatch(batchId)` | `247-314` | Gọi RPC theo chunk 100 |
| `deleteBatch(batchId)` | `317-328` | Xóa batch staging |

Hằng số: `COMMIT_CHUNK_SIZE = 100` (`actions.ts:23`), `MAX_UPLOAD_BYTES = 5MB` (`actions.ts:27`).

### 5.2 Thư viện thuần (test được, không phụ thuộc DB)

| File | Vai trò |
|---|---|
| `src/features/imports/parse.ts:159-234` | Đọc workbook, chọn sheet "giàu" nhất trong 3 layout `template`/`syll`/`ds_dau_nam` |
| `src/features/imports/columns.ts:57-149` | Ánh xạ header → field theo **văn bản header**, không theo vị trí cột |
| `src/features/imports/normalize.ts` | Chuẩn hóa text/ngày/điện thoại/tên/giới tính/boolean/alias lớp |
| `src/features/imports/build-row.ts:153-249` | Dựng `NormalizedRow` + gom lỗi/cảnh báo từng dòng |
| `src/features/imports/dedup.ts:63-130` | Dò trùng với hồ sơ có sẵn (3 mức) và trùng **trong cùng file** |
| `src/features/imports/template.ts:51-90` | Sinh file mẫu `.xlsx` bằng ExcelJS |

### 5.3 Query (`src/features/imports/server/queries.ts`)

`getCurrentAcademicYear` (`16-24`), `getClassLookup` (`30-43`), `getExistingStudents` (`49-67`),
`listClassOptions` (`75-84`), `listBatches` (`99-122`), `getBatchDetail` (`143-191`).

### 5.4 RPC

`public.commit_import_rows(p_batch_id uuid, p_row_ids uuid[])` —
`supabase/migrations/20260721000100_import_batches.sql:116-337`, `security definer`.

## 6. Bảng DB

| Bảng / type | Vai trò | Nguồn |
|---|---|---|
| `import_batches` | Một lần upload | `20260721000100_import_batches.sql:15-35` |
| `import_rows` | Một dòng Excel + kết quả kiểm tra + quyết định người duyệt | `…import_batches.sql:45-64` |
| `import_batch_status` | `dry_run`, `partially_committed`, `committed`, `cancelled` | `…:5-7` |
| `import_row_status` | `valid`, `warning`, `error`, `committed`, `skipped` | `…:8-10` |
| `import_row_action` | `create`, `merge`, `skip` | `…:12` |

**Bảng nghiệp vụ bị ghi khi commit:** `guardians`, `students`, `student_sacraments`,
`student_health_profiles`, `enrollments` (`…import_batches.sql:214-278`).

## 7. Role / permission

| Lớp bảo vệ | Cơ chế | `file:line` |
|---|---|---|
| Route | `route-map.ts` 4 role | `route-map.ts:47-51` |
| Server Component | `requireImportPage` → `requireRouteAccess` + `canImport` | `permissions.ts:33-37` |
| Server Action | `requireImportAccess` → `requireAuthContext` + `canImport` | `permissions.ts:21-25` |
| RLS bảng staging | 8 policy, tất cả `app.can_global_write()`; INSERT batch thêm `uploaded_by = auth.uid()` | `…import_batches.sql:83-110` |
| RPC | `if not app.can_global_write() then raise 42501` ngay dòng đầu | `…import_batches.sql:145-147` |
| Actor ghi vào dữ liệu | `v_actor := auth.uid()` dùng làm `updated_by` mọi insert | `…import_batches.sql:143, 219, 240, 277` |

**Không dùng `service_role` ở bất kỳ đâu trong luồng import.** Client Supabase là
`createClient()` từ `src/lib/supabase/server` (session của người dùng).

## 8. Phụ thuộc

- **exceljs** (đã chọn thay SheetJS vì CVE — `docs/09` §2b bảng).
- **M02**: `academic_years.status='current'`, `classes` active của năm đó (alias lớp).
- **M03**: `students`, `guardians`, `student_sacraments`, `student_health_profiles`.
- **M08/enrollments**: `enrollments` + trigger `validate_enrollment` + unique một ghi danh mở/năm.
- **next.config.mjs:5-10**: `serverActions.bodySizeLimit = "6mb"`.
- Thư mục mẫu người dùng: `Excel mẫu/` (xem §10).

## 9. Mức quan trọng

**CAO — và là cửa ngõ dữ liệu.** Đây là đường duy nhất đưa ~900 hồ sơ trẻ em vào hệ thống.
Sai ở đây tạo hồ sơ trùng, mất liên lạc phụ huynh, sai sĩ số lớp — và không có cơ chế hoàn tác.

## 10. Thư mục Excel mẫu của người dùng

`c:\Users\khang\OneDrive\Documents\CQ_TNTT_Manager\Excel mẫu` (chỉ liệt kê, không parse):

| Ngành | File |
|---|---|
| Chiên - Ấu | `Chiên con 1.xlsx`, `Chiên con 2.xlsx`, `Ấu 1A.xlsx`, `Ấu 1B.xlsx`, `Ấu 2A.xlsx`, `Ấu 2B.xlsx`, `Ấu 3A.xlsx`, `Ấu 3B.xlsx` |
| Thiếu | `Thieu_1A.xlsx`, `Thieu_1B.xlsx`, `Thieu_2A.xlsx`, `Thieu_2B.xlsx`, `Thieu_3.xlsx`, `Bản sao của Thieu_2A.xlsx` |
| Nghĩa | `Nghĩa 1.xlsx`, `Nghĩa 2.xlsx`, `Nghĩa 3.xlsx`, `Bộ câu hỏi GS ngành Nghĩa.xlsx` (không phải sổ lớp) |
| Hiệp | `Hiệp 1.xlsx`, `Hiệp 2.xlsx`, `Dự Trưởng.xlsx` |

Ghi chú: `Bản sao của Thieu_2A.xlsx` là **bản sao** — nếu người dùng lỡ upload cả hai, hệ thống
chỉ cảnh báo trùng chứ không chặn (xem 03/04).

## 11. Tình trạng test

| Test | Phạm vi | Đánh giá |
|---|---|---|
| `supabase/tests/011_imports_test.sql` (26 assertion) | RLS (GLV/phụ huynh không thấy), dry-run không ghi bảng nghiệp vụ, guardian reuse theo SĐT, skip, dòng lỗi giữ `commit_error`, `partially_committed`, recommit không nhân đôi | **Rất tốt** |
| `tests/unit/import-normalize.test.ts` | Chuẩn hóa ngày/điện thoại/tên/alias lớp | Tốt |
| `tests/unit/import-rows.test.ts` (~25 case) | `pickGuardian`, `buildRow`, `nameSimilarity`, `findDuplicate` | Tốt |
| `tests/integration/import-sample-workbooks.test.ts` (6 case) | Parse **file thật** của giáo xứ, kể cả trường hợp từ chối workbook không đủ dữ liệu | **Rất tốt** — hiếm gặp |
| `tests/integration/gate-phase2-import.test.ts` | Gate Phase 2 với DB thật (chỉ chạy khi bật) | Tốt |

**Không có test cho:** tầng Server Action (`createDryRunBatch`, `commitBatch`, `deleteBatch`),
tầng UI (form action nuốt kết quả), hành vi khi vượt giới hạn upload/thời gian chạy.
