# M11-REPORTS-DASHBOARD — 05. Quy tắc nghiệp vụ

Ký hiệu: **[AS-IS]** = đã thực thi đúng trong mã hiện tại · **[GAP]** = chưa có / sai · **[TO-BE]** = đề xuất.

## 1. Quy tắc đang đúng — phải giữ

| ID | Quy tắc | Thực thi tại | Trạng thái |
|---|---|---|---|
| BR-R-01 | Bản xem trước, file Excel, file PDF và payload snapshot **phải cùng một nguồn tính**. | `buildReport` (`reports/server/queries.ts:65`) là điểm gọi duy nhất của `report_attendance_rows`/`report_results_rows` | [AS-IS] |
| BR-R-02 | Khoảng ngày suy ra từ mốc đang chọn: tuần = thứ Hai→Chúa nhật chứa mốc; tháng = trọn tháng dương lịch; năm = **năm học**, không phải năm dương lịch. | `resolveReportRange` (`filters.ts:63-81`); unit test `report-filters.test.ts` | [AS-IS] |
| BR-R-03 | Báo cáo chuyên cần chỉ tính buổi **đã chốt**. | `session.finalized_at is not null` (`migration:316`) | [AS-IS] |
| BR-R-04 | Người dùng chỉ thấy dữ liệu trong phạm vi của mình; giới hạn do RLS, không do bộ lọc ứng dụng. | RPC `SECURITY INVOKER` (`migration:281,322,358-361`); comment `queries.ts:126-127` | [AS-IS] |
| BR-R-05 | Khi chốt báo cáo, **payload do server dựng lại** từ chính bộ lọc đang xem; không nhận số liệu từ client. | `actions.ts:26-40` | [AS-IS] |
| BR-R-06 | Người chốt, thời điểm chốt, trạng thái và checksum **do server đặt**. | Trigger `app.seal_report_snapshot` (`migration:235-258`) | [AS-IS] |
| BR-R-07 | Snapshot là **bất biến**: không có luồng người dùng nào sửa hoặc xóa. | `grant select, insert` (`migration:262`); `check (status = 'final')` (`:204`) | [AS-IS] |
| BR-R-08 | Snapshot **không thay đổi** khi dữ liệu nguồn thay đổi hoặc bị xóa. | Đọc `payload_json`, không tính lại (`queries.ts:197-216`) | [AS-IS] |
| BR-R-09 | Chỉ người có phạm vi tương ứng mới đọc/tải được snapshot của người khác. | Policy `report_snapshots_select_scope` (`migration:265-267`) | [AS-IS] |
| BR-R-10 | **Thủ quỹ không chốt báo cáo** (D-19). | UI `queries.ts:182`; DB `can_create_report` (`migration:224-232`) | [AS-IS] |
| BR-R-11 | Ô Excel bắt đầu bằng `=`, `+`, `-`, `@` phải được escape để không thành công thức. | `safeSpreadsheetText` (`lib/exports/spreadsheet.ts:5-7`), áp trong `buildReportExportData` | [AS-IS] |
| BR-R-12 | Snapshot phải neo vào **một năm học cụ thể** và có ràng buộc hình dạng phạm vi. | `academic_year_id not null`; `report_snapshot_scope_shape` (`migration:208-211`) | [AS-IS] |
| BR-R-13 | File tải về không được cache. | `Cache-Control: private, no-store` (`lib/exports/http.ts:18,71`) | [AS-IS] |
| BR-R-14 | Tên file tải về chỉ chứa ASCII an toàn. | `asciiFilename` (`http.ts:4-11`) — cũng chặn chèn `"` vào `Content-Disposition` | [AS-IS] |
| BR-R-15 | Không cho chốt khi chưa có năm học hiện hành hoặc khi bảng rỗng. | `actions.ts:33-38` | [AS-IS] |

## 2. Quy tắc mặc định chưa được viết ra — cần chốt

| ID | Quy tắc đề xuất | Vấn đề hiện tại | Trạng thái |
|---|---|---|---|
| BR-M11-01 | Mọi ô KPI trên dashboard phải cùng **một** phạm vi: phạm vi đọc của người xem. | `class_count` đếm toàn bộ `classes` (`migration:34-38` + policy `20260715000200:305-306`) | [GAP] → TB-01 |
| BR-M11-02 | Vai trò được vào một màn hình thì phải đọc được **ít nhất một phần** dữ liệu của màn hình đó. | Thủ quỹ vào `/reports` và `/dashboard` nhưng đọc được 0 dòng | [GAP] → TB-02 |
| BR-M11-03 | Không hiển thị liên kết tới route mà chính người đang xem không được vào. | `dashboard-overview.tsx:63` → `/students/{id}` cho guardian; `:29` → `/admin` cho mọi vai trò | [GAP] → TB-03 |
| BR-M11-04 | Nhãn KPI phải đúng nghĩa với phạm vi thực tế của con số. | "Tỷ lệ dự lễ" của phụ huynh thực chất là tỷ lệ của con họ | [GAP] → TB-03 |
| BR-M11-05 | Bảng rỗng phải nói rõ **vì sao** rỗng: không có dữ liệu / chưa chốt buổi nào / ngoài phạm vi của bạn. | Một câu duy nhất (`report-workbench.tsx:174`) | [GAP] → TB-04 |
| BR-M11-06 | Bộ lọc phạm vi chỉ liệt kê ngành/lớp mà người dùng được xem. | `queries.ts:151-157` lấy tất cả (`sectors`/`classes` mở cho mọi tài khoản) | [GAP] → TB-04 |
| BR-M11-07 | Phạm vi mặc định khi mở trang phải suy từ `scopeKind` của người đăng nhập, không mặc định `global`. | `filters.ts:38` mặc định `global` cho mọi người | [GAP] → TB-05 |
| BR-M11-08 | Tham số URL sai **không được im lặng nới rộng** phạm vi; phải báo và về mặc định an toàn nhất. | `filters.ts:97-105` fallback `global` không thông báo | [GAP] → TB-04 |
| BR-M11-09 | Chỉ hiện (hoặc bật) nút hành động khi hành động đó chắc chắn được phép với phạm vi đang chọn. | `canSnapshot` chỉ loại trừ treasurer (`queries.ts:182`) | [GAP] → TB-05 |
| BR-M11-10 | Hành động không thể hoàn tác phải có bước xác nhận nêu rõ nội dung và hệ quả. | Chốt báo cáo hiện là 1 cú bấm, không xác nhận | [GAP] → TB-05 |
| BR-M11-11 | Tiêu đề snapshot phải đủ để phân biệt hai bản khác phạm vi. | `actions.ts:46` chỉ gồm loại + khoảng ngày | [GAP] → TB-06 |
| BR-M11-12 | Dữ liệu giữ 5 năm phải có đường tra cứu tương ứng (lọc + phân trang). | `limit(20)` cứng (`queries.ts:161`) | [GAP] → TB-06 |
| BR-M11-13 | Báo cáo phải chọn được năm học (WF-15 bước 1). | `buildReport` cứng `status='current'` (`queries.ts:71`); switcher `disabled` | [GAP] → TB-07 |
| BR-M11-14 | `period_start`/`period_end` của snapshot phải mô tả đúng khoảng dữ liệu bên trong. | Báo cáo kết quả luôn tính cả năm nhưng ghi khoảng tuần/tháng (`migration:322-351` vs `actions.ts:51-52`) | [GAP] → TB-08 |
| BR-M11-15 | Chốt trùng (cùng loại/phạm vi/kỳ) hoặc bị chặn, hoặc phải phân biệt được. | Không có ràng buộc; bản trùng không xóa được | [GAP] → cần Q3 |

## 3. Ràng buộc dữ liệu hiện có (tham chiếu)

| Ràng buộc | Nội dung | Vị trí |
|---|---|---|
| `report_type` | `in ('attendance','results')` | `migration:192` |
| `title` | không rỗng, ≤ 200 ký tự | `migration:193` |
| `scope_type` | `in ('global','sector','class')` | `migration:195` |
| `period_type` | `in ('week','month','year')` | `migration:197` |
| `report_snapshot_period_order` | `period_end >= period_start` | `migration:207` |
| `report_snapshot_scope_shape` | global ⇒ `scope_id is null`; sector/class ⇒ `scope_id is not null` | `migration:208-211` |
| `status` | `= 'final'` (không có trạng thái nào khác) | `migration:204` |
| `academic_year_id` | `on delete restrict` — không xóa được năm học còn snapshot | `migration:194` |
| `generated_by` | `on delete restrict` — không xóa được profile đã chốt báo cáo | `migration:205` |

## 4. Quyết định đã chốt được module này tôn trọng

| Mã | Nội dung | Thực thi |
|---|---|---|
| D-19 | Thủ quỹ không chốt báo cáo | `queries.ts:182` + `can_create_report` |
| D-51 | Báo cáo tuần/tháng/năm; Excel/PDF; snapshot final; giữ 5 năm | Đủ 3 ý đầu; ý "giữ 5 năm" thiếu đường tra cứu (BR-M11-12) |
| D-52 | Export giữ đúng filter/date range | `buildReport` dùng chung + filter trên URL |
| D-58 | Ngưỡng cảnh báo chuyên cần | `v_students_at_risk` (`migration:93-96`) |
| D-25 | GLV vẫn có thể là phụ huynh | Không ảnh hưởng M11 (`/reports` là staff-only) |
