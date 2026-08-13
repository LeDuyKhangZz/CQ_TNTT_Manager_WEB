# M12-IMPORTS — 05. Quy tắc nghiệp vụ

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn với docs? |
|---|---|---|---|---|
| BR-M12-01 | Chỉ 4 vai trò global-write được import | Route + Action + RLS + RPC | `route-map.ts:47-51`; `permissions.ts:10-25`; `…import_batches.sql:83-110, 145-147` | Không (`docs/09` §9) |
| BR-M12-02 | Dry-run **không** ghi vào bất kỳ bảng nghiệp vụ nào | Kiến trúc action | `actions.ts:106-161`; test `011:105-106` | Không (`docs/09` §2, §9) |
| BR-M12-03 | Import luôn vào **năm học `current`** | Query | `queries.ts:16-24`; `actions.ts:74-80` | Không |
| BR-M12-04 | File upload tối đa 5 MB | Action | `actions.ts:27, 70-72` | `docs/11` §15 chỉ nói "Limit size/row count" — không nêu con số |
| BR-M12-05 | Chỉ nhận `.xlsx`; file hỏng → thông báo rõ | UI + parse | `imports/page.tsx:90`; `parse.ts:173-179` | Không |
| BR-M12-06 | Nhận 3 layout sheet: `template`, `syll`, `ds_dau_nam` | Parse | `parse.ts:144-149` | Không (`docs/09` §2b) |
| BR-M12-07 | Sheet chỉ có danh sách tên (thiếu ngày sinh) **bị từ chối** kèm hướng dẫn | Parse | `parse.ts:193-204` | Không (`docs/09` §2b) |
| BR-M12-08 | Ánh xạ cột theo **văn bản header**, không theo vị trí | Columns | `columns.ts:57-105, 122-145` | Không |
| BR-M12-09 | Cột phụ huynh phải được nhận diện **trước** cột tên thánh/họ tên của em | Columns (thứ tự kiểm) | `columns.ts:65-75` | Không |
| BR-M12-10 | Một SĐT trần được gán cho người ở cột tên ngay trước nó | Columns | `columns.ts:108-133` | Không (`docs/09` §2b) |
| BR-M12-11 | Bắt buộc: họ tên, ngày sinh (không ở tương lai), lớp resolve được, ít nhất một SĐT phụ huynh hợp lệ | Build-row | `build-row.ts:162-217` | Không |
| BR-M12-12 | Thiếu **giới tính** là **cảnh báo**, không phải lỗi; commit từ chối nếu còn dòng chưa chọn | Build-row + Action | `build-row.ts:177-183`; `actions.ts:267-283` | Không (`docs/09` §2b) |
| BR-M12-13 | Hệ thống **không đoán** giới tính, không đặt mặc định | Không có code đoán | `normalize.ts:235-242` (trả `null` khi không nhận diện) | Không (`docs/09` §2b) |
| BR-M12-14 | Thiếu tên thánh là cảnh báo ("chưa rửa tội?") | Build-row | `build-row.ts:219-222` | Không |
| BR-M12-15 | Một guardian/em: ưu tiên **giám hộ > cha > mẹ**, ứng viên **có SĐT** thắng | Build-row | `build-row.ts:69-107` | Không (`docs/09` §2b) |
| BR-M12-16 | Người không được chọn làm guardian được ghi vào `general_notes` để không mất liên lạc | Build-row | `build-row.ts:124-136` | Không (`docs/09` §2b) |
| BR-M12-17 | Lớp ghi **trên dòng** thắng lớp chọn lúc upload; không có cả hai → lỗi | Build-row | `build-row.ts:197-217` | Không (`docs/09` §2b) |
| BR-M12-18 | Lớp đích chọn ở form được **kiểm lại server-side** phải thuộc năm hiện hành | Action | `actions.ts:90-98` | Không |
| BR-M12-19 | Alias lớp: `ẤU 3A` / `Au 3 A` / `Ấu 3a` cùng một lớp; `chien con` ≡ `chien` | Normalize | `normalize.ts:261-268` | Không (`docs/09` §4) |
| BR-M12-20 | Chuẩn hóa: NFC, trim, gộp khoảng trắng; giữ bản gốc để hiển thị | Normalize | `normalize.ts:29-56` | Không (`docs/09` §4) |
| BR-M12-21 | Ngày: nhận Excel serial, `dd/MM/yyyy`, `yyyy-MM-dd`, dấu `. - /`, khoảng trắng thừa | Normalize | `normalize.ts:107-137` | Không (`docs/09` §4) |
| BR-M12-22 | SĐT chuẩn hóa về dạng `0xxxxxxxxx` (nhận `+84`, `84`, mất số 0 đầu) | Normalize | `normalize.ts:168-181` | `docs/09` §4 nói "E.164 nội bộ **hoặc** normalized VN" — chọn VN, hợp lệ |
| BR-M12-23 | Dò trùng 3 mức: `high` (tên+ngày sinh+SĐT), `medium` (tên+ngày sinh), `low` (tên gần giống ≥0.7 + SĐT) | Dedup | `dedup.ts:52, 81-99` | Không (`docs/09` §5) |
| BR-M12-24 | Trùng **không bao giờ chặn** import — chỉ cảnh báo, người dùng quyết định | Action | `actions.ts:126-135` | Không (`docs/09` §5) |
| BR-M12-25 | Trùng **trong cùng file** cũng được cảnh báo | Dedup | `dedup.ts:111-130` | Không (bổ sung ngoài docs, đúng hướng) |
| BR-M12-26 | Guardian được **dùng lại** theo SĐT chuẩn hóa; chưa có mới tạo | RPC | `…import_batches.sql:201-222` | Không (`docs/09` §7) |
| BR-M12-27 | `student_code` sinh bằng default của DB → không trùng | RPC (không set thủ công) | `…import_batches.sql:224-242` | Không (`docs/09` §7, §9) |
| BR-M12-28 | Commit theo **chunk 100**, mỗi chunk một giao dịch | Action | `actions.ts:23, 288-293` | Không (`docs/09` §7) |
| BR-M12-29 | Lỗi một dòng được ghi **lên chính dòng đó** (`commit_error` + `errors_json`), không làm hỏng chunk | RPC | `…import_batches.sql:292-307` | Không (`docs/09` §7) |
| BR-M12-30 | Dòng `skip` không ghi gì vào bảng nghiệp vụ, chỉ đổi trạng thái | RPC | `…import_batches.sql:171-180`; test `011:149` | Không (`docs/09` §5) |
| BR-M12-31 | Dòng `merge` dùng lại `matched_student_id`, chỉ mở ghi danh | RPC | `…import_batches.sql:192-199` | Không (`docs/09` §5) |
| BR-M12-32 | `action='merge'` bắt buộc có `matched_student_id` | CHECK | `…import_batches.sql:62-63` | Không |
| BR-M12-33 | Batch chỉ là `committed` khi **không còn dòng chờ và không còn dòng lỗi**; ngược lại là `partially_committed` | RPC | `…import_batches.sql:314-321`; test `011:158-161` | Không (`docs/09` §7) |
| BR-M12-34 | Batch `cancelled` không commit được | RPC | `…import_batches.sql:153-155` | Không |
| BR-M12-35 | Import **không tạo tài khoản đăng nhập** | Không có code tạo `auth.users`/`profiles`/`accounts` trong RPC | `…import_batches.sql:214-278` | Không (`docs/09` §7 "Không tạo account hàng loạt tự động") |
| BR-M12-36 | Ghi danh phải cùng năm học với lớp; lớp phải `active` | Trigger `validate_enrollment` | `20260716000500_enrollments.sql:34-62` | Không |
| BR-M12-37 | Một em chỉ một ghi danh **mở** trong một năm học | Partial unique index | `20260716000500_enrollments.sql:24-26` | Không (D-11) |
| BR-M12-38 | Không tạo lớp mới ngoài 19 lớp chuẩn — import chỉ **tra cứu** lớp, không insert | `getClassLookup` chỉ `select` | `queries.ts:30-43`; `build-row.ts:202-208` | Không (`docs/09` §9) |
| BR-M12-39 | Tiếng Việt không mojibake: NFC + đọc qua exceljs | Normalize | `normalize.ts:40` | Không (`docs/09` §9) |
| BR-M12-40 | Template **không** có dòng dữ liệu mẫu | Template | `template.ts:82-85` | Không (bổ sung an toàn ngoài docs) |
| BR-M12-41 | `uploaded_by` phải là chính người đăng nhập | RLS WITH CHECK | `…import_batches.sql:86-88` | Không |

## Quy tắc trong docs **chưa** được enforce

| Mã | Phát biểu trong docs | Tình trạng | Bằng chứng |
|---|---|---|---|
| BR-M12-X1 | "User download được errors" (`docs/09` §9); "→ Download result" (`docs/09` §2) | **CHƯA HIỆN THỰC** | Chỉ có route `/imports/template`; không có route/action xuất lỗi hay kết quả |
| BR-M12-X2 | "Kết quả có mapping row → student_code" (`docs/09` §7) | **Chỉ có trong DB**, không đến được người dùng | RPC trả `out_student_code` (`…import_batches.sql:126`) nhưng `commitBatch` **bỏ** giá trị đó (`actions.ts:296-304`) và `commitAction` bỏ cả kết quả (`[batchId]/page.tsx:31-34`) |
| BR-M12-X3 | "Failure một row không được làm mơ hồ" (`docs/09` §7) | **Mơ hồ ở tầng UI** | `CommitSummary.failures` bị vứt; người dùng chỉ thấy lỗi nếu tự cuộn tìm dòng |
| BR-M12-X4 | Sheet `BI_TICH` và `GIAO_LY_VIEN` trong template (`docs/09` §3) | **CHƯA HIỆN THỰC** | `template.ts:56` chỉ tạo một sheet `THIEU_NHI`; `docs/09` §2b đã ghi nhận hoãn `GIAO_LY_VIEN`, nhưng `BI_TICH` không được nhắc |
| BR-M12-X5 | Template gồm cột `nam_hoc`, `nganh` (`docs/09` §3) | **Khác thực tế** | `template.ts:19-44` không có 2 cột này (năm học lấy từ hệ thống, ngành suy từ lớp) — hợp lý hơn, nhưng `docs/09` §3 cần cập nhật |
| BR-M12-X6 | Route `/admin/import` (`docs/06` §7) | **Khác thực tế** | Hiện thực là `/imports` (`route-map.ts:47`) |
| BR-M12-X7 | Tên action `uploadImportFile / parseImportBatch / reviewImportRow / commitImportBatch / downloadImportErrors` (`docs/11` §15) | **Khác thực tế 4/5** | `createDryRunBatch`, `setRowAction`, `setRowGender`, `commitBatch`, `deleteBatch`; `downloadImportErrors` **không tồn tại** |

## Quy tắc **ngầm** cần chốt (chưa có trong docs)

| Mã | Phát biểu quan sát được từ code | Cần xác nhận |
|---|---|---|
| BR-M12-Y1 | `action` mặc định là `create` cho **mọi** dòng, kể cả trùng mức `high` | `actions.ts:149` — đây là mặc định nguy hiểm nhất của module |
| BR-M12-Y2 | Dò trùng chỉ so với `students.status='active'` — em đã nghỉ không được phát hiện | `queries.ts:54` |
| BR-M12-Y3 | Em đã có ghi danh mở ở lớp khác → dòng vẫn `committed` nhưng lớp **không đổi**, không cảnh báo | `…import_batches.sql:274-278` |
| BR-M12-Y4 | Batch **đã commit** vẫn xóa được, kéo theo mất mapping `created_student_id` | `actions.ts:317-328`; `…import_batches.sql:47, 57-58` |
| BR-M12-Y5 | Trạng thái `cancelled` không có luồng nào tạo ra | `…import_batches.sql:6` vs toàn bộ `actions.ts` |
| BR-M12-Y6 | Dòng `merge` **không** cập nhật thông tin mới lên hồ sơ có sẵn (không sửa SĐT/địa chỉ mới) | `…import_batches.sql:192-199` — "merge" thực chất là "reuse", cần thống nhất thuật ngữ với người dùng |
| BR-M12-Y7 | `sqlerrm` thô của Postgres được hiển thị thẳng cho người dùng | `…import_batches.sql:297`; `[batchId]/page.tsx:90` |
| BR-M12-Y8 | Ghi chú sức khỏe/dị ứng chỉ insert khi có ít nhất một trong hai; `on conflict (student_id) do nothing` | `…import_batches.sql:258-269` |
