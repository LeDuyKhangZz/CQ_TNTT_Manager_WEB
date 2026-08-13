# M12-IMPORTS — 07. Tác động triển khai

Ước lượng: **S** ≤ 0.5 ngày · **M** 1–2 ngày · **L** ≥ 3 ngày.

## 1. Bảng tổng hợp

| # | Hạng mục | File phải sửa | API | Migration | RLS | Dữ liệu | Test | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|---|---|
| 1 | TO-BE 1 — phản hồi thật cho mọi action | `src/app/(dashboard)/imports/page.tsx`, `imports/[batchId]/page.tsx`, **file mới** `features/imports/components/*.tsx` | Không đổi chữ ký action | Không | Không | Không | Unit + E2E: upload file hỏng phải thấy lỗi | **M** | Không |
| 2 | TO-BE 3 — chặn xóa batch đã ghi + xác nhận | `features/imports/server/actions.ts:317-328`, `imports/[batchId]/page.tsx:185-190` | Đổi hành vi `deleteBatch`; thêm `cancelBatch` | Không (dùng `cancelled` sẵn có) | Không | Batch cũ không ảnh hưởng | pgTAP/unit: xóa batch `committed` phải fail | **S** | Không |
| 3 | TO-BE 2 — mặc định an toàn cho dòng trùng | `actions.ts:127-151, 247-283`, `queries.ts:49-67`, `imports/[batchId]/page.tsx` | Không | Không | Không | **Batch `dry_run` đang tồn tại giữ `action` cũ** — không backfill | Unit dedup mở rộng; test chặn commit | **M** | Không |
| 4 | TO-BE 5 — tải file lỗi / kết quả | **file mới** `src/app/(dashboard)/imports/[batchId]/errors/route.ts`, `features/imports/export.ts`, `queries.ts` | Route handler mới (phải authorize) | Không | Không | Không | Unit: escape ô bắt đầu bằng `= + - @`; E2E tải file | **M** | Không |
| 5 | TO-BE 4 — điền giới tính hàng loạt | `actions.ts` (+`setRowGenderBatch`), `imports/[batchId]/page.tsx` | +1 action | Không | Không | Không | Unit + E2E 30 dòng | **M** | Hạng mục 1 (cần Client Component) |
| 6 | TO-BE 6 — không che giấu ghi danh bỏ qua | **migration mới** (drop + create `commit_import_rows`), `actions.ts:296-304`, UI kết quả | Cột trả về mới `out_enrollment_created` | **CÓ — rủi ro trung bình** | Không đổi policy | Không | pgTAP: em đã có ghi danh mở → dòng có cảnh báo | **M** | Hạng mục 1 (để hiển thị) |
| 7 | TO-BE 7 — phân trang/lọc dòng + danh sách batch | `queries.ts:99-122, 143-191`, cả hai trang | Đổi chữ ký query (nội bộ) | Không | Không | Không | E2E lọc | **M** | Hạng mục 1 |
| 8 | TO-BE 8 — giới hạn dung lượng/thời gian | `actions.ts:27`, `next.config.mjs`, `imports/page.tsx` | Không | Không | Không | Không | Test upload sát ngưỡng | **S** | **Cần xác nhận hạ tầng** (xem 08 §NEEDS_CONFIRMATION) |
| 9 | Zod cho input action | `features/imports/schemas.ts` (**file mới**), `actions.ts` | Không | Không | Không | Không | Unit schema | **S** | Không |
| 10 | Ánh xạ `commit_error` sang tiếng Việt | `features/imports/errors.ts` (mới), `imports/[batchId]/page.tsx:90` | Không | Không | Không | Không | Unit ánh xạ | **S** | Không |

## 2. Chi tiết theo tầng

### 2.1 File phải sửa

**Viết lại đáng kể:**
- `src/app/(dashboard)/imports/[batchId]/page.tsx` — tách thành Server Component (nạp dữ liệu) +
  Client Component `BatchReviewTable` (bảng, chọn nhiều dòng, lưu hàng loạt, hiển thị kết quả).
- `src/app/(dashboard)/imports/page.tsx` — tách `ImportUploadForm` thành Client Component.

**File mới:**
- `src/features/imports/components/import-upload-form.tsx`
- `src/features/imports/components/batch-review-table.tsx`
- `src/features/imports/components/commit-result.tsx`
- `src/features/imports/schemas.ts` (Zod cho `setRowAction`, `setRowGender`, `commitBatch`, `deleteBatch`)
- `src/features/imports/export.ts` (xuất Excel lỗi/kết quả, có escape formula)
- `src/features/imports/errors.ts` (ánh xạ `commit_error` → tiếng Việt)
- `src/app/(dashboard)/imports/[batchId]/errors/route.ts`

**Sửa vừa:** `src/features/imports/server/actions.ts` (`deleteBatch`, `commitBatch`, dry-run default action, +2 action mới),
`src/features/imports/server/queries.ts` (phân trang, bỏ lọc `status='active'` khi dedup, select thêm cột).

**Không đụng tới:** `parse.ts`, `columns.ts`, `normalize.ts`, `build-row.ts`, `dedup.ts` (thuật toán),
`template.ts`, `permissions.ts`.

### 2.2 API / Server Action

| Tên | Thay đổi |
|---|---|
| `createDryRunBatch` | Không đổi chữ ký; đổi `action` mặc định cho dòng trùng |
| `setRowAction`, `setRowGender` | Thêm Zod; `revalidatePath` đúng `/imports/[batchId]` |
| `setRowGenderBatch` | **Mới** |
| `commitBatch` | Thêm kiểm dòng trùng `high` chưa quyết định; trả thêm `enrollmentSkipped` |
| `deleteBatch` | Chỉ cho `dry_run`; thêm `cancelBatch`, `purgeRawJson` |
| `GET /imports/[batchId]/errors` | **Mới** — route handler, phải authorize |

### 2.3 Migration

| Migration | Nội dung | Rủi ro | Rollback |
|---|---|---|---|
| `<ts>_commit_import_rows_enrollment_flag.sql` | `drop function public.commit_import_rows(uuid, uuid[]);` + `create function …` với cột trả về mới `out_enrollment_created boolean` + **`revoke`/`grant execute` lặp lại** | **TRUNG BÌNH.** Đổi `returns table` bắt buộc drop-create; quên `grant execute … to authenticated` (`…import_batches.sql:340`) là **gãy toàn bộ import** cho người dùng thường (chỉ `service_role` còn chạy được — và triệu chứng sẽ giống lỗi RLS, rất khó đoán) | Chạy lại nguyên văn định nghĩa cũ tại `20260721000100_import_batches.sql:116-340` |

**Chỉ hạng mục 6 cần migration.** Tất cả hạng mục khác là code ứng dụng.

### 2.4 RLS

- **Không thay đổi policy nào.** 8 policy hiện tại (`…import_batches.sql:83-110`) đều đúng và đã có test negative (`011:85-94`).
- Route handler mới (`/imports/[batchId]/errors`) **phải** gọi `requireImportAccess()` **trước** mọi truy vấn — `docs/11` §16 "Mọi route handler phải authenticate/authorize".
- Bỏ lọc `status='active'` trong `getExistingStudents` (`queries.ts:54`) **không** mở rộng phạm vi đọc:
  RLS `students` vẫn quyết định; 4 vai trò import vốn có `can_global_read`.

### 2.5 Dữ liệu hiện có

- Chưa có dữ liệu import production (Phase 2 gate đã chạy trên DB thử).
- Batch `dry_run` đang tồn tại sẽ **không** được backfill `action` mới → cần ghi rõ trong release note,
  hoặc yêu cầu tạo lại batch.
- Không có cột nào bị xóa/đổi kiểu → không mất dữ liệu.

### 2.6 Test phải bổ sung

| Loại | Nội dung |
|---|---|
| pgTAP (`011_imports_test.sql`) | Em đã có ghi danh mở ở lớp khác → `out_enrollment_created = false` + cảnh báo trên dòng; xóa batch `committed` bị chặn; `cancelBatch` đặt `status='cancelled'` |
| Unit | Zod các action; escape formula (`=SUM(A1)` → `'=SUM(A1)`); ánh xạ `commit_error`; `findDuplicate` với hồ sơ `status='inactive'` |
| Integration | `createDryRunBatch` với workbook thật → dòng trùng `high` có `action='merge'`; `commitBatch` chặn khi còn trùng chưa quyết định |
| E2E (Playwright) | Upload file hỏng → thấy thông điệp tiếng Việt; upload file tốt → tự vào trang batch; commit → thấy bảng kết quả; bấm Xóa trên batch đã ghi → bị chặn |
| Bảo mật (phải xanh) | Xem `08_ACCEPTANCE_CRITERIA.md` §C — đặc biệt SEC-04 (route `/imports/template` và `/errors` với vai trò không được phép) |

## 3. Thứ tự triển khai đề xuất

1. **Hạng mục 2** (chặn xóa batch đã ghi) — **S**, giảm ngay rủi ro mất dữ liệu. Làm trước tiên.
2. **Hạng mục 1** (phản hồi thật) — **M**, mở khóa cho mọi hạng mục UI sau.
3. **Hạng mục 3** (mặc định an toàn cho dòng trùng) — **M**, chặn nguồn sinh hồ sơ trùng.
4. **Hạng mục 9 + 10** (Zod + ánh xạ lỗi) — **S**, đi kèm hạng mục 1.
5. **Hạng mục 5 + 7** (hàng loạt + phân trang) — **M**, biến màn hình thành dùng được ở quy mô thật.
6. **Hạng mục 4** (tải file lỗi) — **M**, đóng acceptance criteria `docs/09` §9.
7. **Hạng mục 6** (migration RPC) — **M**, làm cuối vì có rủi ro grant.
8. **Hạng mục 8** — sau khi có xác nhận hạ tầng.

**Tổng ước lượng: ~9–12 ngày công**; **gói tối thiểu (1 + 2 + 3) ≈ 3 ngày** và đã gỡ cả 3 hạng mục CRITICAL.

## 4. Phụ thuộc liên module

| Phụ thuộc | Chi tiết |
|---|---|
| **M02-ACADEMIC-STRUCTURE** | `academic_years.status='current'` phải tồn tại, và 19 lớp chuẩn phải có `display_name` khớp alias người dùng gõ (`normalize.ts:261-268`). Sai `display_name` → toàn bộ file lỗi "Lớp không khớp" |
| **M03-STUDENTS-GUARDIANS** | Import ghi thẳng vào `students`, `guardians`, `student_sacraments`, `student_health_profiles`. Mọi ràng buộc mới ở M03 sẽ làm dòng import lỗi. Liên kết "mở hồ sơ đối chiếu" cần route `/students/[id]` |
| **M08-PROMOTIONS / enrollments** | Cùng ghi vào `enrollments`; unique index một ghi danh mở/năm là nguyên nhân của `on conflict do nothing` |
| **M01-AUTH** | `requireImportAccess` phụ thuộc `AuthContext.role`; nếu M01 đổi mô hình role thì `canImport` (`permissions.ts:17-19`) phải theo |
| **Hạ tầng triển khai** | Giới hạn thân request và thời gian chạy hàm quyết định `MAX_UPLOAD_BYTES` và kích thước chunk — **chưa xác nhận** |
