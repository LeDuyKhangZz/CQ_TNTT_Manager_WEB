# M12-IMPORTS — 06. Đánh giá UI/UX

> Chỉ **đánh giá**, không kèm code. Đối chiếu `docs/06-ui-ux-spec.md`.

## 1. Kiến trúc thông tin (IA)

| Quan sát | Đánh giá |
|---|---|
| Hai cấp `/imports` → `/imports/[batchId]` | Đúng mô hình "danh sách → chi tiết", phù hợp |
| Trang danh sách trộn **hành động chính** (form upload) và **lịch sử** (20 batch) | Chấp nhận được; upload nằm trên là đúng ưu tiên |
| Trang chi tiết đặt "Xác nhận ghi vào hệ thống" **trên** danh sách dòng (`[batchId]/page.tsx:168-199`) | **Sai thứ tự nhận thức**: người dùng thấy nút Ghi trước khi xem dữ liệu. Nút hành động cuối nên ở cuối, hoặc dính (sticky) sau khi đã cuộn qua danh sách |
| Không có bước "tóm tắt trước khi ghi" (bao nhiêu tạo mới / ghép / bỏ qua / trùng) | Thiếu điểm dừng cuối cùng cho một hành động tạo hàng trăm hồ sơ trẻ em |
| Route thực tế `/imports` vs `docs/06:119` ghi `/admin/import` | Lệch tài liệu |

## 2. Điều hướng

- Sau khi upload thành công **không chuyển sang trang batch** (`imports/page.tsx:23-26`) —
  người dùng phải tự tìm batch mới trong danh sách. Đây là điểm gãy nghiêm trọng nhất của điều hướng.
- Trang chi tiết có liên kết "Quay lại" (`[batchId]/page.tsx:191-196`) — tốt.
- **Không có liên kết** từ dòng trùng sang hồ sơ thiếu nhi đang có (`matchedStudentId` có sẵn ở
  `queries.ts:185` nhưng không được render thành link) → người duyệt phải quyết định "ghép hay tạo mới"
  mà không xem được hồ sơ kia.
- **Không có liên kết** từ dòng đã ghi sang hồ sơ vừa tạo.

## 3. Độ rõ của hành động

| Vấn đề | Bằng chứng | Mức |
|---|---|---|
| "Kiểm tra file" — nhãn tốt, nói đúng rằng chưa ghi gì | `imports/page.tsx:118`, mô tả ở `82` | ✅ |
| Bấm "Kiểm tra file" xong **không có bất kỳ phản hồi nào** | `imports/page.tsx:23-26` | **Rất cao** |
| "Ghi N dòng vào hệ thống" — nhãn có số, rất tốt | `[batchId]/page.tsx:182` | ✅ |
| Bấm "Ghi" xong không biết kết quả | `[batchId]/page.tsx:31-34` | **Rất cao** |
| "Xóa lần nhập này" **không xác nhận**, cùng cỡ, cạnh nút Ghi, xóa được cả batch đã ghi | `[batchId]/page.tsx:185-190` | **Rất cao** |
| Nút "Lưu" của select xử lý dòng chỉ ghi "Lưu" | `[batchId]/page.tsx:139-141` | Thấp |
| Không có trạng thái loading/disabled khi đang xử lý file lớn | toàn bộ form là server action thuần | Cao (người dùng bấm lại nhiều lần) |

## 4. Form

| Vấn đề | Bằng chứng |
|---|---|
| Input file có `accept=".xlsx"` + `required` ✅ | `imports/page.tsx:88-91` |
| **Không hiển thị giới hạn 5MB trước khi upload** — chỉ báo sau khi thất bại (mà thông báo lại bị nuốt) | `actions.ts:70-72` |
| Select "Lớp đích" có mô tả rõ khi nào cần dùng ✅ | `imports/page.tsx:111-114` |
| Không cho tải **nhiều file** cùng lúc, dù thực tế có 19 sổ lớp (`Excel mẫu/`) | `imports/page.tsx:86-92` |
| Mỗi dòng là một `<form>` độc lập → không lưu được nhiều thay đổi cùng lúc | `[batchId]/page.tsx:94, 122` |
| Select giới tính mặc định rỗng + option rỗng `disabled`; submit khi chưa chọn thì **im lặng không làm gì** | `[batchId]/page.tsx:105-107`, `48-53` |
| Select giới tính chỉ có Nam/Nữ, trong khi enum DB có `other` và action nhận `other` | `[batchId]/page.tsx:108-109` vs `actions.ts:204` — không sai, nhưng lệch khả năng |
| Không hiển thị dữ liệu đã chuẩn hóa của dòng (ngày sinh, SĐT phụ huynh, tên phụ huynh) | `[batchId]/page.tsx:62-69` chỉ hiện tên + lớp — người duyệt không kiểm được chất lượng chuẩn hóa |

## 5. Empty state / Error state

| Trạng thái | Hiện tại | Đánh giá |
|---|---|---|
| Chưa có năm học current | Thông báo + hướng dẫn đi đâu ("Vào trang Quản trị…") | ✅ **Tốt** — mẫu mực cho các empty state khác |
| Chưa có batch nào | "Chưa có lần nhập dữ liệu nào." | Đủ |
| Không còn dòng chờ ghi | "Không còn dòng nào chờ ghi." | ✅ |
| Lỗi upload / lỗi parse | **Không có gì** | ❌ **Nghiêm trọng** — trong khi `parse.ts:188-204` đã soạn sẵn 2 câu hướng dẫn rất tốt |
| Lỗi commit (còn dòng thiếu giới tính) | **Không có gì** | ❌ — `actions.ts:277-282` soạn câu có cả số dòng cụ thể |
| Kết quả commit | **Không có gì** | ❌ |
| Lỗi ghi từng dòng | Có, hiển thị `commit_error` thô của Postgres | ⚠️ Có hiển thị nhưng là tiếng Anh/SQL (`[batchId]/page.tsx:89-91`) |
| Cảnh báo trùng | Hiển thị dạng `[high] Trùng họ tên, ngày sinh và SĐT phụ huynh với TN0123.` | ⚠️ Tiền tố `[high]` là ngôn ngữ kỹ thuật; nên là badge "Nghi trùng cao" |

## 6. Responsive

**360px:**
- Form upload xếp dọc, input `w-full` ✅ (`imports/page.tsx:91`).
- Tên file dùng `break-all` ✅ (`imports/page.tsx:35`) — quan trọng vì tên sổ lớp dài và có dấu.
- Hàng nút `flex-wrap` ✅ (`imports/page.tsx:117`, `[batchId]/page.tsx:178`).
- Form trong `RowCard` dùng `flex-wrap items-center` ✅ (`[batchId]/page.tsx:94, 122`).
- ❌ **Vấn đề chính:** danh sách dòng không phân trang. Một sổ 30 em ≈ 30 card × ~180px = 5.400px;
  toàn xứ đoàn 900 dòng trong một batch ≈ 160.000px. Không có bộ lọc trạng thái để thu hẹp.

**1366px:**
- Bố cục một cột dọc suốt trang — **lãng phí ~60% bề ngang**.
- Dữ liệu dạng bảng (dòng / tên / lớp / trạng thái / lỗi / quyết định) phù hợp hơn nhiều so với card.
- Danh sách batch cũng là card một cột, trong khi bảng sẽ so sánh được các lần nhập.

**Kết luận:** không vỡ layout ở cả hai mốc; vấn đề là **mật độ thông tin quá thấp** cho một màn hình
duyệt dữ liệu hàng loạt.

## 7. Accessibility (mục tiêu ≥44px, WCAG AA)

| Hạng mục | Tình trạng | Bằng chứng |
|---|---|---|
| Nhãn select "Lớp đích" | `<label htmlFor="classId">` + `id` ✅ | `imports/page.tsx:95-100` |
| Nhãn select giới tính | `htmlFor={gender-…}` + `id` ✅ | `[batchId]/page.tsx:96-101` |
| Nhãn select xử lý dòng | `htmlFor={action-…}` + `id` ✅ | `[batchId]/page.tsx:124-129` |
| Chiều cao select | `min-h-11` = 44px ✅ | `imports/page.tsx:102`; `[batchId]/page.tsx:103, 131` |
| Nút "Tải file mẫu" | `h-11 min-h-11` ✅ | `imports/page.tsx:125` |
| Nút "Quay lại" | `h-11 min-h-11` ✅ | `[batchId]/page.tsx:193` |
| Nút "Lưu" của dòng | `size="sm"` — **cần kiểm** chiều cao thực tế, có nguy cơ < 44px ⚠️ | `[batchId]/page.tsx:111, 139` |
| Input file | `p-2` + `file:py-1.5` — vùng nhấn của nút "Chọn tệp" nhỏ ⚠️ | `imports/page.tsx:91` |
| Thông báo kết quả | **Không tồn tại** nên không có `aria-live` ❌ | — |
| Badge trạng thái | Có chữ nghĩa, không chỉ dựa vào màu ✅ | `imports/page.tsx:16-21`; `[batchId]/page.tsx:17-23` |
| Danh sách lỗi/cảnh báo | `<ul><li>` đúng ngữ nghĩa ✅ | `[batchId]/page.tsx:73-87` |
| Lỗi hiển thị bằng `text-destructive` | Chỉ khác màu; có tiền tố "Lỗi khi ghi:" ✅ nhưng danh sách lỗi thì không có nhãn ⚠️ | `[batchId]/page.tsx:74, 90` |
| Trạng thái đang xử lý file lớn | Không có phản hồi, không `aria-busy` ❌ | — |

## 8. Xếp hạng khuyến nghị UI

| Ưu tiên | Khuyến nghị |
|---|---|
| **P0** | Hiển thị kết quả/lỗi của mọi thao tác (upload, commit, xóa, sửa dòng) |
| **P0** | Upload thành công → chuyển thẳng sang trang batch |
| **P0** | Hộp xác nhận cho "Xóa lần nhập" và chặn xóa batch đã ghi |
| **P0** | Hộp xác nhận + bảng tóm tắt (tạo mới / ghép / bỏ qua / nghi trùng) trước khi "Ghi" |
| P1 | Phân trang + lọc theo trạng thái dòng; đổi card sang bảng ở desktop |
| P1 | Điền giới tính hàng loạt (một lần lưu cho nhiều dòng) |
| P1 | Liên kết từ dòng nghi trùng sang hồ sơ đối chiếu; từ dòng đã ghi sang hồ sơ mới |
| P1 | Nút tải file lỗi / file kết quả |
| P2 | Hiển thị giới hạn dung lượng và định dạng ngay trên form |
| P2 | Ánh xạ `commit_error` của Postgres sang câu tiếng Việt |
| P2 | Đổi `[high]` thành badge "Nghi trùng cao / vừa / thấp" |
| P2 | Hiển thị dữ liệu đã chuẩn hóa (ngày sinh, SĐT, phụ huynh) trên mỗi dòng để kiểm |
| P3 | Kiểm chiều cao thực của `Button size="sm"` và vùng nhấn input file |
