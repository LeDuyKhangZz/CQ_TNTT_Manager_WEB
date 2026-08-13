# M11-REPORTS-DASHBOARD — 08. Tiêu chí nghiệm thu

Dạng Given/When/Then. Nhóm **A** = hành vi hiện tại phải **không hồi quy**.
Nhóm **B** = hành vi mới theo To-Be. Mỗi tiêu chí ghi rõ tầng kiểm thử.

---

## A. Hồi quy — phải giữ nguyên

### AC-A01 — Một nguồn tính duy nhất (D-52)
- **Given** một GLV lớp đang xem báo cáo Chuyên cần tháng 09/2026, bảng có 1 dòng "Ấu 1 · 30 · 4 · 92% …"
- **When** bấm "Tải Excel" rồi "Tải PDF"
- **Then** cả hai file chứa đúng 1 dòng với đúng các giá trị đó, và tiêu đề phụ ghi đúng `2026-09-01 – 2026-09-30`
- **Tầng:** e2e

### AC-A02 — Export không mở rộng phạm vi
- **Given** GLV lớp Ấu 1 đăng nhập
- **When** gọi trực tiếp `GET /reports/export?reportType=attendance&periodType=month&anchorDate=2026-09-15&scopeType=global&format=xlsx`
- **Then** file chỉ chứa các lớp mà người đó được đọc (không có lớp ngành khác)
- **Tầng:** e2e (đường tấn công direct URL)

### AC-A03 — Chốt báo cáo không nhận số liệu từ client
- **Given** người dùng có quyền chốt
- **When** gọi server action `createReportSnapshot` với payload bịa thêm trường số liệu
- **Then** trường bịa bị bỏ qua; `payload_json` bằng đúng kết quả `buildReport(filter)`
- **Tầng:** unit/integration

### AC-A04 — Người chốt/thời điểm/checksum do server đặt
- **Given** client gửi `generated_by` = id người khác, `checksum` = "abc"
- **When** insert thành công
- **Then** `generated_by = auth.uid()`, `generated_at ≈ now()`, `status = 'final'`, `checksum` là chuỗi hex 64 ký tự khác "abc"
- **Tầng:** pgTAP (đã có: `023:116-130`)

### AC-A05 — Snapshot bất biến
- **Given** một snapshot đã chốt
- **When** người dùng `authenticated` thử `update` hoặc `delete`
- **Then** bị từ chối (thiếu quyền)
- **Tầng:** pgTAP (đã có: `023:132-137`)

### AC-A06 — Snapshot không đổi khi nguồn đổi/bị xóa
- **Given** snapshot chốt tháng 09 có dòng lớp Ấu 1
- **When** xóa toàn bộ bản ghi điểm danh tháng 09 của lớp đó
- **Then** tải lại snapshot vẫn ra đúng số cũ và checksum không đổi
- **Tầng:** pgTAP (đã có: `023:139-147`) + e2e

### AC-A07 — Chỉ đúng phạm vi mới tải được snapshot người khác
- **Given** trưởng ngành Ấu chốt báo cáo `scope=sector` ngành Ấu
- **When** trưởng ngành Thiếu mở `/reports/snapshots/<id>/export?format=xlsx`
- **Then** nhận `404` và **không** có thông tin nào về sự tồn tại của snapshot
- **Tầng:** e2e

### AC-A08 — Thủ quỹ không chốt được (D-19)
- **Given** tài khoản `treasurer`
- **When** gọi trực tiếp server action `createReportSnapshot` với filter bất kỳ
- **Then** nhận `FORBIDDEN` và không có hàng nào được thêm vào `report_snapshots`
- **Tầng:** integration + pgTAP

### AC-A09 — Chống Excel formula injection
- **Given** một lớp có `display_name` = `=HYPERLINK("http://x","clic")`
- **When** tải Excel báo cáo chứa lớp đó, rồi tải lại **bản đã chốt** chứa lớp đó
- **Then** cả hai file hiển thị chuỗi nguyên văn, không thành công thức (ô bắt đầu bằng `'`)
- **Tầng:** unit (`safeSpreadsheetText`) + e2e

### AC-A10 — ID snapshot không hợp lệ không gây 500
- **Given** đã đăng nhập với vai trò staff
- **When** mở `/reports/snapshots/khong-phai-uuid/export`
- **Then** nhận `404` JSON, log không có exception
- **Tầng:** e2e

### AC-A11 — Dashboard khi chưa có năm học
- **Given** không có `academic_years` nào `status='current'`
- **When** mở `/dashboard`
- **Then** hiện đúng một thẻ hướng dẫn, không hiện KPI 0
- **Tầng:** e2e

### AC-A12 — Khoảng ngày theo năm học
- **Given** năm học 2026-09-01 → 2027-05-31, mốc 2027-01-15, kỳ = "Năm học"
- **When** tính khoảng
- **Then** `from = 2026-09-01`, `to = 2027-05-31` (không phải 2027-01-01 → 2027-12-31)
- **Tầng:** unit (đã có)

---

## B. Hành vi mới theo To-Be

### AC-B01 — `class_count` đúng phạm vi (TB-01)
- **Given** xứ đoàn có 19 lớp; GLV lớp Ấu 1 phụ trách 1 lớp
- **When** GLV đó mở `/dashboard`
- **Then** ô "Lớp" hiển thị `1` (không phải `19`); trưởng ngành Ấu thấy đúng số lớp ngành Ấu; vai trò global thấy `19`
- **Tầng:** pgTAP (3 assertion mới trong `023`) + e2e

### AC-B02 — Không còn liên kết dẫn tới `/access-denied` từ dashboard (TB-03)
- **Given** phụ huynh có con đang bị cảnh báo chuyên cần
- **When** mở `/dashboard` và bấm mọi liên kết trên trang
- **Then** không liên kết nào dẫn tới `/access-denied`; liên kết tên con dẫn tới `/parent/children/<id>`
- **Tầng:** e2e (guardian) + e2e (student)

### AC-B03 — Nhãn KPI đúng nghĩa cho portal (TB-03)
- **Given** phụ huynh có 2 con
- **When** mở `/dashboard`
- **Then** không hiển thị ô "Giáo lý viên" và "Lớp"; ô số con mang nhãn "Con của tôi"; tỷ lệ chuyên cần ghi rõ là của con
- **Tầng:** e2e

### AC-B04 — Phân biệt rỗng với ngoài phạm vi (TB-04)
- **Given** GLV lớp Ấu 1 mở `/reports?scopeType=class&scopeId=<id lớp Chiên 3>`
- **When** trang render
- **Then** hiện thông điệp "Bạn không được xem phạm vi này…" — **khác** với thông điệp khi lớp mình thật sự chưa có buổi nào được chốt
- **Tầng:** e2e

### AC-B05 — Dropdown phạm vi chỉ liệt kê phạm vi hợp lệ (TB-04)
- **Given** GLV lớp Ấu 1
- **When** mở bộ lọc, chọn "Theo lớp"
- **Then** danh sách chỉ có lớp Ấu 1; trưởng ngành Ấu thấy đúng các lớp ngành Ấu; vai trò global thấy đủ 19 lớp
- **Tầng:** e2e

### AC-B06 — Tham số URL sai được báo, không im lặng nới rộng (TB-04)
- **Given** GLV lớp mở `/reports?scopeType=class` (thiếu `scopeId`)
- **When** trang render
- **Then** hiện cảnh báo "Tham số phạm vi không hợp lệ, đã đặt lại về lớp của bạn", và phạm vi hiển thị là **lớp của người đó**, không phải toàn xứ đoàn
- **Tầng:** unit + e2e

### AC-B07 — Phạm vi mặc định theo vai trò (TB-05)
- **Given** trưởng ngành Ấu mở `/reports` không kèm tham số
- **When** trang render
- **Then** phạm vi mặc định là "Theo ngành → Ngành Ấu"; nút "Chốt báo cáo" ở trạng thái bật
- **Tầng:** e2e

### AC-B08 — Nút chốt phản chiếu quyền thật (TB-05)
- **Given** GLV lớp đổi phạm vi sang "Toàn xứ đoàn"
- **When** trang render
- **Then** nút "Chốt báo cáo" bị `disabled` kèm giải thích; nếu vẫn gọi được action thì DB trả `42501` và UI hiện `FORBIDDEN`
- **Tầng:** e2e + integration

### AC-B09 — Xác nhận trước khi chốt (TB-05)
- **Given** người dùng đủ quyền bấm "Chốt báo cáo"
- **When** hộp xác nhận hiện ra
- **Then** hộp nêu đúng loại, kỳ, phạm vi, số dòng và câu "Bản chốt không sửa/xóa được"; huỷ thì không có hàng nào được tạo
- **Tầng:** e2e

### AC-B10 — Danh sách bản chốt phân biệt được (TB-06)
- **Given** hai snapshot cùng loại, cùng tháng, khác lớp
- **When** mở danh sách
- **Then** hai dòng hiển thị khác nhau ở phần phạm vi và người chốt
- **Tầng:** e2e

### AC-B11 — Tra cứu snapshot cũ (TB-06)
- **Given** có 60 snapshot trải 3 năm học
- **When** lọc theo năm học 2024–2025 và loại "Chuyên cần"
- **Then** trả đúng tập kết quả, có phân trang, mỗi trang ≤ 20 dòng
- **Tầng:** e2e

### AC-B12 — Xem lại snapshot trên trình duyệt (TB-06)
- **Given** một snapshot thuộc phạm vi người dùng
- **When** mở `/reports/snapshots/<id>`
- **Then** hiện đúng bảng từ `payload_json`, checksum đầy đủ, banner bất biến; với id ngoài phạm vi → `404`
- **Tầng:** e2e

### AC-B13 — Thủ quỹ (theo kết quả câu hỏi Q1)
- **Nếu chọn TB-02A:** treasurer mở `/reports` thấy số gộp theo lớp; **không** thấy tên/điểm từng em; nút chốt không hiện; gọi action trực tiếp → `FORBIDDEN`.
- **Nếu chọn TB-02B:** treasurer mở `/reports` → `/access-denied`; nav không hiện mục "Báo cáo".
- **Tầng:** pgTAP (A) hoặc unit `permissions.test.ts` (B) + e2e

### AC-B14 — Kỳ của báo cáo kết quả (theo kết quả câu hỏi Q2)
- **Nếu TB-08A:** chọn "Tháng 09/2026" cho báo cáo Kết quả → chỉ tính các cột điểm có `assessment_date` trong tháng đó; `period_start/end` khớp.
- **Nếu TB-08B:** chọn loại "Kết quả học tập" → ô "Kỳ báo cáo" tự khoá về "Năm học", ô "Ngày trong kỳ" ẩn; snapshot ghi `period_type='year'`.
- **Tầng:** unit + e2e

### AC-B15 — Accessibility tối thiểu
- **Given** dùng bàn phím và trình đọc màn hình trên `/reports`
- **When** đổi bộ lọc và bấm "Xem báo cáo"
- **Then** bảng có `<caption>` và `scope="col"`; vùng cuộn ngang nhận focus bằng `Tab`; số dòng kết quả được thông báo qua vùng `aria-live`; nút chốt có `aria-busy` khi đang chạy
- **Tầng:** e2e + kiểm thủ công

---

## C. Định nghĩa "hoàn thành"

Một đề xuất chỉ được coi là xong khi:

1. Toàn bộ AC nhóm **A** liên quan vẫn xanh (không hồi quy).
2. AC nhóm **B** tương ứng có test thật (không phải chỉ đọc diff).
3. `npm run lint` + `tsc --noEmit` + `npm run test` xanh.
4. Nếu đụng DB: `supabase db reset` + toàn bộ pgTAP xanh + regenerate `src/types/database.ts`.
5. Kiểm thủ công ở 360px cho mọi màn hình bị đụng.
6. WORKLOG được cập nhật đúng phần đã làm và phần còn dở.
