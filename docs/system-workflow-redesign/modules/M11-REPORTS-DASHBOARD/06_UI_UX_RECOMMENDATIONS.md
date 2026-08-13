# M11-REPORTS-DASHBOARD — 06. Đánh giá UI/UX

> **Chỉ đánh giá.** Không sửa mã, không sửa component.

## 1. Bối cảnh sử dụng

| Yếu tố | Thực tế |
|---|---|
| Người dùng | Ban điều hành xứ đoàn, trưởng ngành, GLV — đa số thao tác trên điện thoại, một số ít trên laptop khi làm báo cáo |
| Thiết bị chính của `/reports` | Laptop/tablet (bảng nhiều cột, tải file) — chấp nhận ưu tiên desktop |
| Thiết bị chính của `/dashboard` | Điện thoại — đây là màn hình sau đăng nhập của **mọi** vai trò kể cả phụ huynh |
| Tần suất | Dashboard: mỗi lần đăng nhập. Báo cáo: tuần/tháng |

## 2. Đánh giá `/dashboard`

### 2.1 Điểm tốt

| # | Điểm |
|---|---|
| 1 | Empty state khi chưa có năm học **giải thích được nguyên nhân và hành động tiếp theo** (`dashboard-overview.tsx:24-33`) — hiếm gặp và rất đáng giữ |
| 2 | `<section aria-label="Chỉ số năm học">` (`:37`) giúp trình đọc màn hình định vị khối KPI |
| 3 | Lưới KPI `grid gap-3 sm:grid-cols-2 xl:grid-cols-4` — ở 360px xếp 1 cột, không tràn |
| 4 | Mỗi thẻ có empty state riêng, viết bằng tiếng Việt tự nhiên ("Không có em nào cần lưu ý trong phạm vi của bạn.") |
| 5 | Trạng thái đọc/chưa đọc của thông báo hiện ngay ở dashboard (`:137`) |
| 6 | Là **server component** — không đẩy dữ liệu ẩn (`incompleteProfileCount`, `committeeTasks`) xuống client |

### 2.2 Vấn đề

| # | Vấn đề | Mức | Bằng chứng | Nhận xét |
|---|---|---|---|---|
| U-1 | Link "Cần quan tâm" trỏ `/students/{id}` cho **mọi** audience, kể cả phụ huynh/thiếu nhi vốn không được vào | **Cao** | `:63` vs `route-map.ts:26` | Ngõ cụt dẫn tới `/access-denied` |
| U-2 | Link "Quản trị hệ thống" trong empty state hiện cho mọi vai trò | Trung bình | `:29` vs `route-map.ts:47` | Cùng loại lỗi với U-1 |
| U-3 | Ô "Lớp" hiển thị tổng toàn xứ đoàn cho GLV lớp, đứng cạnh "Thiếu nhi" đã thu hẹp | **Cao** | `:40` + `migration:34-38` | Người dùng không có cách nào biết hai số khác phạm vi |
| U-4 | KPI của phụ huynh mang nhãn cấp tổ chức ("Thiếu nhi", "Tỷ lệ dự lễ") nhưng nội dung là của con họ | **Cao** | `:38,41-46` | Với phụ huynh không rành công nghệ, đây là hiểu nhầm nghiêm trọng |
| U-5 | Không phân biệt "0 vì chưa có dữ liệu" với "0 vì không đọc được" | Trung bình | `:57,86,110,130,151` | Đặc biệt tệ với thủ quỹ (mọi thẻ đều rỗng) |
| U-6 | Thẻ "Cần quan tâm" liệt kê lý do dạng chuỗi nối `reasons.join(", ")` + "· TB 4.2" | Thấp | `:69-70` | Nên là các chip/badge để quét nhanh; hiện là một dòng chữ nhỏ `text-xs` |
| U-7 | Không có nút hành động nổi bật cho GLV lớp ("Điểm danh hôm nay") như `docs/06 §7 Class staff` yêu cầu | Trung bình | `docs/06:178-185` vs component | Dashboard hiện giống nhau cho mọi vai trò staff |
| U-8 | Không có biểu đồ chuyên cần theo tuần/tháng như `docs/06 §7 Charts` | Thấp | `docs/06:160-164` | Có thể là quyết định phạm vi Phase 6 — cần xác nhận |
| U-9 | `text-xs` cho lý do cảnh báo và ngày tháng | Thấp | `:68,93,117,137` | 12px trên điện thoại, dưới ngưỡng thoải mái cho người lớn tuổi |
| U-10 | Không có skeleton/loading riêng cho từng thẻ; 7 truy vấn song song chặn cả trang | Thấp | `queries.ts:109-142` + `(dashboard)/loading.tsx` | Trên 3G một truy vấn chậm làm trắng cả dashboard |

### 2.3 Accessibility `/dashboard`

| Hạng mục | Đánh giá |
|---|---|
| Cấu trúc heading | `PageHeader` dùng `<h2>` (`page-header.tsx:5`), `CardTitle` cũng là heading — cần kiểm không nhảy cấp |
| Vùng landmark | Có `aria-label` cho KPI; các `Card` khác không có landmark → trình đọc màn hình phải duyệt tuần tự |
| Màu | Badge "warning"/"danger" phân biệt bằng màu; nội dung chữ vẫn đọc được nên không phụ thuộc **chỉ** vào màu — đạt |
| Vùng chạm | Link tên em là text inline, không có padding → dưới 44px chiều cao trên điện thoại |
| Ngôn ngữ | Tiếng Việt nhất quán, không lẫn thuật ngữ Anh — tốt |

## 3. Đánh giá `/reports`

### 3.1 Điểm tốt

| # | Điểm |
|---|---|
| 1 | `CardDescription` nói thẳng nguyên tắc quan trọng nhất: "File tải về và bản chốt dùng đúng bộ lọc đang hiển thị." (`report-workbench.tsx:75`) — đúng thứ người dùng cần tin tưởng |
| 2 | Sau khi chốt, thông báo nêu rõ hệ quả: "Bản chốt không đổi khi dữ liệu thay đổi về sau." (`:62`) |
| 3 | Bộ lọc nằm trên URL ⇒ chia sẻ link được, back/forward hoạt động đúng (`reports/page.tsx:12-14`) |
| 4 | Bảng bọc `overflow-x-auto` + `min-w-[640px]` (`:177-178`) — cuộn ngang trong khung, không làm trang cuộn ngang |
| 5 | Select cao `h-11 min-h-11` (`:27`) — đạt ngưỡng chạm 44px |
| 6 | Nút chốt `disabled` khi `pending` hoặc bảng rỗng (`:164`) — chặn double-submit ở mức cơ bản |
| 7 | Checksum hiển thị rút gọn 12 ký tự với nhãn tiếng Việt "mã kiểm tra" (`:217-218`) — dễ hiểu hơn "checksum" |
| 8 | `FormMessage` có `role="alert"` cho lỗi và `role="status"` cho thành công (`form-message.tsx:21`) |

### 3.2 Vấn đề

| # | Vấn đề | Mức | Bằng chứng | Nhận xét |
|---|---|---|---|---|
| R-1 | Empty state một câu cho ba nguyên nhân khác nhau | **Cao** | `:173-175` | Người dùng lặp lại thao tác vô ích |
| R-2 | Dropdown "Chọn lớp" liệt kê cả 19 lớp cho GLV chỉ phụ trách 1 lớp | **Cao** | `queries.ts:151-157` | Mời gọi thao tác nhầm rồi dẫn tới R-1 |
| R-3 | Nút "Chốt báo cáo" hiện cho trưởng ngành/GLV lớp ở phạm vi mặc định `global` — chắc chắn lỗi khi bấm | **Cao** | `:163` + `filters.ts:38` | Vi phạm "khó thao tác nhầm" |
| R-4 | Hành động không thể hoàn tác nhưng không có bước xác nhận | **Cao** | `:57-66,164` | Chốt nhầm là vĩnh viễn (không xóa được) |
| R-5 | Danh sách bản chốt không hiện **phạm vi** và **người chốt** | **Cao** | `:212-228` vs cột `scope_type`/`generated_by` có sẵn | Hai bản khác lớp trông y hệt nhau |
| R-6 | Chỉ 20 bản gần nhất, không lọc, không phân trang | Trung bình | `queries.ts:161` | Trái yêu cầu lưu 5 năm |
| R-7 | Không xem lại được nội dung bản chốt trên trình duyệt, buộc phải tải file | Trung bình | Không có `snapshots/[snapshotId]/page.tsx` | Trên điện thoại việc mở .xlsx rất bất tiện |
| R-8 | Bản chốt chỉ có nút Excel dù route hỗ trợ PDF | Thấp | `:223` vs `snapshots/.../route.ts:34-36` | Bất đối xứng với khu vực xem trước (có cả 2 nút) |
| R-9 | Phải bấm "Xem báo cáo" mới áp dụng; đổi select không có phản hồi nào | Thấp | `:44-55,131` | Chấp nhận được (tránh tải lại liên tục) nhưng nên có gợi ý "Bộ lọc đã đổi — bấm Xem báo cáo" |
| R-10 | Không có chỉ báo đang tải khi chuyển trang sau `router.push` | Thấp | `:54` | Không dùng `useTransition` cho điều hướng (chỉ dùng cho snapshot) |
| R-11 | Không có ô chọn **năm học** dù WF-15 bước 1 yêu cầu | Trung bình | `academic-year-switcher.tsx:5` là nút `disabled` | Nút giả này còn gây hiểu nhầm là chọn được |
| R-12 | Không có tổng dòng / dòng "Tổng cộng" ở cuối bảng | Thấp | `:186-195` | Người làm báo cáo thường cần con số tổng |
| R-13 | Ba nút (Excel/PDF/Chốt) trên cùng hàng với tiêu đề, ở 360px xuống 2–3 dòng | Thấp | `:150-168` `flex flex-wrap` | Không vỡ layout, chỉ hơi lộn xộn |
| R-14 | Ô "Ngày trong kỳ" vẫn hiện khi `periodType = "year"` dù không có tác dụng | Thấp | `:103-106` + `filters.ts:67-69` | Gây hiểu nhầm là ngày ảnh hưởng kết quả |
| R-15 | Báo cáo "Kết quả học tập" luôn cả năm nhưng vẫn cho chọn Tuần/Tháng | Trung bình | `:147` (chỉ có ghi chú nhỏ trong ngoặc) + `migration:322` | Ghi chú `(kết quả tính cho cả năm học)` nằm ở `CardDescription`, dễ bị bỏ qua |

### 3.3 Accessibility `/reports`

| Hạng mục | Đánh giá | Bằng chứng |
|---|---|---|
| Nhãn form | 3 select bọc trong `<label>` (liên kết ngầm — hợp lệ); ô ngày dùng `<Label htmlFor>` — **không nhất quán nhưng đều đúng** | `:79-118` |
| Bảng dữ liệu | Thiếu `<caption>`, thiếu `scope="col"` trên `<th>`, thiếu `<th scope="row">` cho cột Lớp | `:179-195` |
| Trạng thái bận | Nút đổi chữ "Đang chốt…" nhưng không có `aria-busy` / `aria-live` | `:164-166` |
| Thông báo kết quả | `FormMessage` có role phù hợp nhưng nằm **phía trên** khu vực bảng, cách xa nút vừa bấm | `:137` |
| Số dòng sau lọc | Không thông báo cho trình đọc màn hình sau khi điều hướng | — |
| Focus | Sau `router.push`, focus không được đặt về vùng kết quả | `:54` |
| Cuộn ngang | Vùng `overflow-x-auto` không có `tabIndex={0}` ⇒ không cuộn được bằng bàn phím | `:177` |
| Tương phản | Header bảng Excel dùng `#F28C5B` nền + chữ trắng (chỉ trong file, không phải web) — cần kiểm tương phản nếu áp dụng lên web | `http.ts:39` |

### 3.4 Responsive `/reports` ở 360px

| Khối | Kết quả |
|---|---|
| Form bộ lọc | `grid gap-3` 1 cột — tốt |
| Select | `w-full h-11` — tốt |
| Nút "Xem báo cáo" | `md:col-span-2 xl:col-span-4` chứa `<Button>` mặc định — chiếm đúng chiều rộng nút, chạm được |
| Hàng nút export | `flex flex-wrap gap-2` — xuống dòng, chấp nhận được |
| Bảng | Cuộn ngang trong khung `min-w-[640px]` — đúng cách, nhưng 7 cột trên 360px nghĩa là cuộn rất nhiều |
| Danh sách bản chốt | `flex flex-wrap justify-between` + `min-w-0` — không tràn |

**Kết luận responsive:** không có lỗi tràn ngang. Điểm trừ duy nhất là bảng 7 cột khó đọc trên
điện thoại — nhưng `/reports` chủ yếu dùng trên máy tính nên chấp nhận được.

## 4. Xếp hạng đề xuất theo giá trị/chi phí

| Hạng | Đề xuất | Giá trị | Chi phí |
|---|---|---|---|
| 1 | Sửa link `/students/{id}` và `/admin` theo audience (U-1, U-2) | Cao | Rất thấp |
| 2 | Empty state 3 nhánh cho báo cáo (R-1) | Cao | Thấp |
| 3 | Lọc dropdown ngành/lớp theo phạm vi (R-2) | Cao | Thấp |
| 4 | Hiện phạm vi + người chốt trong danh sách bản chốt (R-5) | Cao | Thấp |
| 5 | Nút chốt phản chiếu `can_create_report` + hộp xác nhận (R-3, R-4) | Cao | Trung bình |
| 6 | Sửa `class_count` theo phạm vi (U-3) | Cao | Trung bình (đụng DB) |
| 7 | Bố cục dashboard theo audience (U-4, U-7) | Cao | Trung bình |
| 8 | Trang tra cứu + xem lại snapshot (R-6, R-7) | Trung bình | Cao |
| 9 | Bổ sung a11y bảng, `aria-busy`, `aria-live`, `tabIndex` vùng cuộn | Trung bình | Thấp |
| 10 | Chọn năm học (R-11) | Trung bình | Cao (đụng nhiều module) |
