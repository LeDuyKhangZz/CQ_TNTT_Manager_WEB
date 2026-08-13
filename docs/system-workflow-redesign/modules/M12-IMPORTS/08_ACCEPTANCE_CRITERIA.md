# M12-IMPORTS — 08. Tiêu chí nghiệm thu

## A. Nghiệp vụ cốt lõi (đang ĐẠT — phải giữ xanh sau mọi thay đổi)

### AC-01 — Dry-run không chạm bảng nghiệp vụ
**Given** tôi là Thư ký và có một batch `dry_run` với 4 dòng
**Then** `students` = 0 và `enrollments` = 0.
_Ref: `011_imports_test.sql:105-106`_

### AC-02 — Guardian dùng lại theo số điện thoại
**Given** đã có phụ huynh SĐT `0912345678`
**When** commit một dòng mới có cùng SĐT đó
**Then** **không** tạo phụ huynh thứ hai; em mới trỏ về phụ huynh cũ.
_Ref: `011:128-134`_

### AC-03 — Mã thiếu nhi không trùng
**When** commit N dòng `create`
**Then** N `student_code` khác nhau, sinh từ default của DB.
_Ref: `…import_batches.sql:224-242`, `docs/09` §9_

### AC-04 — Lỗi một dòng không làm hỏng chunk
**Given** chunk 4 dòng, dòng #4 vi phạm ràng buộc
**Then** 3 dòng còn lại vẫn `committed`; dòng #4 có `status='error'`, `commit_error` khác null,
và batch ở trạng thái `partially_committed`.
_Ref: `011:119-124, 154-161`_

### AC-05 — Commit lại không nhân đôi
**When** gọi `commit_import_rows` lần hai với đúng dòng đã `committed`
**Then** số `students` không đổi.
_Ref: `011:164-168`_

### AC-06 — Dòng `skip` không tạo gì
**Then** `students` không có bản ghi cho dòng đó; dòng có `status='skipped'`.
_Ref: `011:149`_

### AC-07 — Không import được nếu không có quyền
**Given** tôi là `class_teacher` hoặc `guardian`
**Then** tôi không thấy batch nào, không thấy dòng nào, và gọi `commit_import_rows` bị `42501`.
_Ref: `011:85-94`_

### AC-08 — Import không tạo tài khoản đăng nhập
**When** commit một batch đầy đủ
**Then** `auth.users` và `profiles` **không** có bản ghi mới.
_Ref: `…import_batches.sql:214-278`; `docs/09` §7_

### AC-09 — Không tạo lớp ngoài 19 lớp chuẩn
**Given** một dòng ghi lớp "Chiên Con 3" (không tồn tại)
**Then** dòng đó là `error` với thông điệp `Lớp "Chiên Con 3" không khớp lớp nào của năm học hiện tại.`
**And** `classes` **không** có bản ghi mới.
_Ref: `build-row.ts:202-208`; `docs/09` §9_

### AC-10 — Từ chối sheet không đủ dữ liệu
**Given** workbook chỉ có sheet danh sách tên (Thiếu/Nghĩa/Hiệp `DS_dau_nam`)
**Then** không tạo batch, và người dùng nhận đúng câu:
"Sheet chỉ có danh sách tên, thiếu ngày sinh nên không đủ để import. Vui lòng dùng sheet SYLL hoặc file mẫu chuẩn."
_Ref: `parse.ts:199-204`; `import-sample-workbooks.test.ts:93`_

### AC-11 — Tiếng Việt không mojibake
**Given** file thật `Ấu 3A.xlsx`
**Then** mọi tên hiển thị đúng dấu ở màn hình preview và trong `students.full_name`.
_Ref: `normalize.ts:29-41`; `docs/09` §9_

### AC-12 — Giới tính không bị đoán
**Given** dòng SYLL không có cột giới tính
**Then** dòng là `warning` (không phải `error`), `normalized_json.gender` là null,
**and** commit bị chặn cho tới khi người duyệt chọn Nam/Nữ.
_Ref: `build-row.ts:177-183`; `actions.ts:267-283`; `docs/09` §2b_

---

## B. Tiêu chí cho phần To-Be (mới)

### AC-13 — Upload thất bại phải có thông điệp
**Given** tôi tải lên một file `.txt` đổi đuôi thành `.xlsx`
**When** tôi bấm "Kiểm tra file"
**Then** màn hình hiện thông điệp tiếng Việt nêu rõ lý do (không phải trang trắng, không phải trang tải lại y hệt).

### AC-14 — Upload thành công tự vào trang batch
**When** file được kiểm tra xong
**Then** trình duyệt chuyển tới `/imports/[batchId]` của batch vừa tạo.

### AC-15 — Kết quả commit phải hiển thị
**When** tôi bấm "Ghi N dòng vào hệ thống"
**Then** màn hình hiện `Đã ghi X dòng · Lỗi Y dòng`
**And** nếu Y > 0 thì liệt kê `#số dòng — lý do` cho từng dòng lỗi.

### AC-16 — Không xóa được batch đã ghi
**Given** batch có `committed_rows > 0`
**When** tôi bấm nút xóa
**Then** thao tác bị từ chối với thông điệp "Lần nhập này đã ghi dữ liệu vào hệ thống nên không xóa được."
**And** `import_batches` và `import_rows` của batch đó vẫn còn nguyên (giữ mapping `created_student_id`).

### AC-17 — Hủy batch chưa ghi phải xác nhận
**Given** batch `dry_run` 120 dòng
**When** tôi bấm "Hủy lần nhập"
**Then** hiện hộp xác nhận nêu rõ 120 dòng sẽ bị bỏ
**And** sau khi xác nhận, batch có `status='cancelled'`.

### AC-18 — Dòng trùng chắc chắn mặc định là "Ghép"
**Given** một dòng trùng mức `high` với hồ sơ TN0123
**Then** `action` của dòng đó là `merge` với `matched_student_id` = TN0123
**And** UI hiển thị liên kết mở hồ sơ TN0123 để đối chiếu.

### AC-19 — Không commit khi còn dòng trùng chưa quyết định
**Given** còn 3 dòng trùng mức `high` mà người duyệt chưa xác nhận
**When** tôi bấm "Ghi"
**Then** commit bị chặn với thông điệp liệt kê số dòng (#3, #17, #42).

### AC-20 — Dò trùng cả hồ sơ không còn hoạt động
**Given** em A đã nghỉ (`students.status <> 'active'`) và nay ghi danh lại
**When** dry-run một dòng có cùng tên + ngày sinh + SĐT phụ huynh
**Then** dòng đó vẫn được cảnh báo trùng mức `high`.

### AC-21 — Điền giới tính hàng loạt
**Given** 30 dòng thiếu giới tính
**When** tôi chọn giới tính cho cả 30 dòng rồi bấm "Lưu tất cả thay đổi"
**Then** chỉ có **một** lần gửi lên server và một lần tải lại danh sách.

### AC-22 — Tải file lỗi
**When** tôi bấm "Tải file lỗi"
**Then** nhận `.xlsx` gồm sheet `LOI` (dòng / họ tên / lớp / lỗi / cảnh báo)
và sheet `KET_QUA` (dòng / họ tên / mã thiếu nhi / trạng thái).

### AC-23 — Chống Excel formula injection ở file xuất
**Given** một dòng có họ tên `=cmd|'/c calc'!A1` hoặc `@SUM(1+1)`
**When** tôi tải file lỗi
**Then** ô tương ứng trong file `.xlsx` bắt đầu bằng dấu nháy đơn (`'`) và **không** được Excel diễn giải là công thức.

### AC-24 — Ghi danh bị bỏ qua phải được báo
**Given** em B đã có ghi danh `active` ở lớp Ấu 2A trong năm học hiện hành
**When** commit một dòng đưa em B vào lớp Ấu 2B
**Then** dòng vẫn `committed` (hồ sơ đã tồn tại/được ghép)
**But** dòng có cảnh báo "Em đã có ghi danh đang mở ở lớp khác trong năm học này; lớp không được thay đổi."
**And** kết quả commit tổng hợp con số này riêng.

### AC-25 — Phân trang và lọc dòng
**Given** batch 900 dòng
**When** tôi mở trang chi tiết
**Then** hiển thị tối đa 50 dòng/trang, có bộ lọc `Tất cả / Lỗi / Cảnh báo / Hợp lệ / Đã ghi / Bỏ qua`.

### AC-26 — Thông điệp lỗi không lộ SQL
**Given** một dòng lỗi ràng buộc DB
**Then** người dùng thấy câu tiếng Việt đã ánh xạ, **không** thấy `sqlerrm` thô,
tên bảng, tên cột hay tên ràng buộc.

---

## C. Test bảo mật **phải xanh**

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| SEC-01 | `class_teacher` / `class_representative` / `sector_leader` / `treasurer` mở `/imports` | Redirect `/access-denied` (`route-map.ts:47-51`) |
| SEC-02 | `guardian` / `student` mở `/imports` hoặc `/imports/[batchId]` | Redirect `/access-denied` |
| SEC-03 | `sector_leader` gọi trực tiếp `createDryRunBatch` / `commitBatch` / `deleteBatch` | `FORBIDDEN` (`permissions.ts:23`) |
| SEC-04 | `class_teacher` gọi `GET /imports/template` | **Bị chặn** — route handler gọi `requireImportAccess()` trước khi sinh file (`template/route.ts:7`) |
| SEC-04b | `class_teacher` gọi `GET /imports/[batchId]/errors` (route mới) | **Bị chặn** trước mọi truy vấn |
| SEC-05 | JWT `class_teacher` gọi `GET /rest/v1/import_batches` | Trả **rỗng** (RLS), không lỗi rò thông tin — test `011:85` |
| SEC-06 | JWT `guardian` gọi `POST /rest/v1/import_rows` | **403** (`…import_batches.sql:101-103`) |
| SEC-07 | JWT bất kỳ (không global-write) gọi `rpc/commit_import_rows` | **42501** — test `011:87-92, 94-99` |
| SEC-08 | `anon` gọi `rpc/commit_import_rows` | **403** — đã `revoke … from public, anon` (`…import_batches.sql:339`) |
| SEC-09 | Thư ký A insert `import_batches` với `uploaded_by` = id của Thư ký B | **403** — `with check (… and uploaded_by = auth.uid())` (`…import_batches.sql:88`) |
| SEC-10 | Upload file 6 MB | Bị từ chối **có thông điệp**, không làm sập tiến trình (`actions.ts:70-72`) |
| SEC-11 | Upload file `.xlsx` là zip bomb / có XML entity | exceljs từ chối hoặc lỗi được bắt thành `ImportParseError`, tiến trình không treo (`parse.ts:173-179`) |
| SEC-12 | Upload file có 100.000 dòng | Không được phép làm treo hàm; phải có giới hạn số dòng **hoặc** thông điệp rõ (`docs/11` §15 "Limit size/row count") — **hiện chưa có giới hạn số dòng** |
| SEC-13 | Dòng có tên chứa `=HYPERLINK(...)` được xuất ra file lỗi | Ô bị escape (AC-23) |
| SEC-14 | Dòng có `normalized_json.class_id` bị sửa tay thành lớp của năm khác | Trigger `validate_enrollment` chặn (`enrollments.sql:49-51`), dòng thành `error`, không ghi sai |
| SEC-15 | `raw_json` chứa dữ liệu nhạy cảm của trẻ em | Chỉ 4 vai trò global-write đọc được (RLS `…import_batches.sql:98-100`); cần có luồng xóa raw sau thời hạn (`docs/09` §6) — **hiện chưa có** |
| SEC-16 | Thông điệp lỗi trả về UI | Không chứa SQL raw / tên bảng / stack — **hiện đang vi phạm** ở `[batchId]/page.tsx:90` (hiển thị thẳng `commit_error`) |

**Điều kiện nghiệm thu tổng:** toàn bộ `supabase/tests/011_imports_test.sql` (26 assertion) xanh,
`tests/unit/import-*.test.ts` và `tests/integration/import-sample-workbooks.test.ts` xanh,
SEC-01…SEC-16 xanh, và `npm run build` + `tsc --noEmit` sạch.

---

## D. Mục cần xác nhận trước khi chốt nghiệm thu

| # | Câu hỏi | Vì sao cần |
|---|---|---|
| NC-01 | Giới hạn kích thước thân request và thời gian chạy hàm của môi trường triển khai thật là bao nhiêu? | `MAX_UPLOAD_BYTES = 5MB` (`actions.ts:27`) và `bodySizeLimit = "6mb"` (`next.config.mjs:8`) có thể **vượt** giới hạn nền tảng → file 4.5–5 MB bị chặn ở tầng hạ tầng với lỗi không phải tiếng Việt. Commit 900 dòng = 9 lần gọi RPC tuần tự, có thể vượt thời gian chạy tối đa |
| NC-02 | Có giới hạn **số dòng** tối đa cho một file không? | `docs/11` §15 yêu cầu "Limit size/row count"; hiện chỉ giới hạn dung lượng |
| NC-03 | Thời hạn giữ `raw_json` là bao lâu, và ai được xóa? | `docs/09` §6 nói "có thể xóa raw import sau thời hạn ngắn" nhưng chưa có tác vụ nào |
| NC-04 | "Ghép hồ sơ có sẵn" có nên **cập nhật** thông tin mới (SĐT, địa chỉ) lên hồ sơ cũ không, hay chỉ mở ghi danh? | Hiện chỉ mở ghi danh (`…import_batches.sql:192-199`); người dùng có thể kỳ vọng khác |
| NC-05 | Có cần hoàn tác (rollback) một batch đã ghi không? | Hiện không có; sửa sai phải thủ công từng hồ sơ |
