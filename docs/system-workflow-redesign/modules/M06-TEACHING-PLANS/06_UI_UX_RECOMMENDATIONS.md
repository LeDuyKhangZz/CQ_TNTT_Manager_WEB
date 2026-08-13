# M06-TEACHING-PLANS — 06. Đánh giá UI/UX

> Tài liệu **chỉ đánh giá**, không kèm code sửa. Đối chiếu `docs/06-ui-ux-spec.md §11`.

## 1. Kiến trúc thông tin (IA)

| Điểm | Đánh giá |
|---|---|
| Hub `/teaching-plan` đặt card "7 ngày sắp tới" **trên** lưới lớp (`page.tsx:14`) | ✔ Đúng ưu tiên: nội dung sắp diễn ra trước, quản trị sau |
| Guardian/student và staff dùng **chung một route** | ✖ Hai đối tượng khác hẳn nhau (một bên đọc lịch, một bên soạn giáo án) nhưng cùng URL, cùng tiêu đề "Giáo án"; phụ huynh thấy tiêu đề mô tả "Kế hoạch giảng dạy năm học 2026-2027" (`page.tsx:13`) trong khi họ chỉ xem 7 ngày |
| `/teaching-plan/{classId}` không chặn audience (`route-map.ts:30`) | ✖ Guardian/student mở thẳng URL sẽ thấy khung trang quản trị rỗng thay vì 404/redirect |
| Không có breadcrumb, chỉ có link "← Danh sách lớp" (`[classId]/page.tsx:27`) | ◐ Đủ cho 2 cấp, nên giữ |

## 2. Điều hướng

- Toggle **Danh sách / Theo tháng** dùng 2 `<Link>` với `?view=` (`[classId]/page.tsx:29-32`) → giữ được trạng thái khi chia sẻ URL, tốt. Nhưng dùng `div[aria-label="Kiểu hiển thị"]` thay vì `role="tablist"`/`radiogroup`, nên trình đọc màn hình không biết đây là bộ chọn loại trừ nhau.
- Nhãn "Theo tháng" nhưng `docs/06 §11` gọi là "Calendar" — thực tế chỉ là **nhóm theo tháng**, không phải lưới lịch. Kỳ vọng người dùng có thể lệch.
- Card lớp ở hub là `<Link>` bọc `<Card>` (`page.tsx:24`) → toàn bộ card click được, tốt cho ngón tay.

## 3. Độ rõ của action

| Vấn đề | Vị trí |
|---|---|
| Nút "Sửa" đổi nhãn thành "Đóng" khi mở form, nhưng nút "Đóng" thứ hai lại nằm trong form (`teaching-plan-editor.tsx:151`, `:238`) → hai nút cùng chức năng, dễ nhầm | `ItemCard`/`ItemForm` |
| "Lưu tên" (kế hoạch) và "Lưu thay đổi" (mục) khác nhau về từ ngữ nhưng cùng ngữ cảnh trang | `:346`, `:152` |
| Nút "Xóa" (mục) và "Gỡ tệp" (tài liệu) đều là hành vi phá hủy nhưng khác cấp độ nhấn mạnh (`variant="danger"` vs `variant="ghost"`) — hợp lý | `:239`, `:268` |
| Xác nhận phá hủy dùng `window.confirm` (`:170`, `:212`) | Không theo design system, không dịch được nút OK/Cancel, không nêu hệ quả (xóa mục có tệp sẽ xóa luôn tệp) |
| Không có trạng thái "đang tải" cho nút "Tải xuống"/"Gỡ tệp" ngoài `disabled` | `:267-268` |

## 4. Form

- **F03/F04 — 12 trường phẳng**: `ItemFields` (`:58-89`) xếp 12 trường trong `grid md:grid-cols-2`.
  Không có nhóm ("Thông tin bắt buộc" / "Nội dung buổi học" / "Nội bộ"), không có `<fieldset>/<legend>`,
  không thu gọn phần ít dùng. Trên 360 px là 12 khối dọc.
- **Ghi chú nội bộ** (`note`) đứng cạnh các trường sẽ hiển thị cho GLV khác, chỉ phân biệt bằng nhãn
  "Ghi chú nội bộ" (`:88`) — nên có chỉ dấu thị giác rõ hơn vì đây là trường **không bao giờ** ra portal.
- **Người dạy**: option rỗng có nhãn động "Chưa phân công" / "Chọn người dạy" theo `itemType` (`:77`) — tốt;
  nhưng danh sách không lọc theo `plannedDate` (xem BR-M06-05) và không hiển thị `capacity`
  (đại diện / GLV / dự trưởng) dù dữ liệu đã có (`server/queries.ts:254`).
- **`maxLength`** đặt đúng theo constraint DB nhưng **không có bộ đếm ký tự**; người dùng bị cắt âm thầm ở
  4000/8000 ký tự.
- **`defaultValue={item?.plannedDate ?? yearStart}`** (`:68`) — form thêm mới luôn mặc định ngày khai giảng,
  không phải ngày trống hay ngày kế tiếp chưa dùng; dễ tạo lỗi trùng ngày lần đầu.

## 5. Empty state và error state

| Trạng thái | Hiện tại | Đánh giá |
|---|---|---|
| Chưa có năm học hiện hành | Card "Chưa có năm học hiện hành." (`page.tsx:16`) | ✔ |
| Staff không có lớp nào | Render `null` (`page.tsx:18`) | ✖ Trang trống hoàn toàn dưới card 7 ngày |
| Lớp chưa có kế hoạch, người xem không có quyền | "GLV đại diện chưa khởi tạo giáo án cho lớp." (`:333`) | ✔ Rõ ai phải hành động |
| Kế hoạch chưa có mục | "Giáo án chưa có bài dạy hoặc bài kiểm tra." (`:361`) | ✔ |
| Chưa có tài liệu | "Chưa đính kèm tài liệu." (`:270`) | ✔ |
| 7 ngày tới không có gì | "Chưa có bài học hoặc bài kiểm tra trong khoảng này." (`week-ahead-schedule.tsx:15`) | ✔ |
| RPC tuần tới lỗi | Nuốt lỗi, hiển thị **y hệt** trạng thái rỗng (`server/queries.ts:104`) | ✖ Không phân biệt "không có dữ liệu" với "hệ thống lỗi" |
| Thông báo thành công trong `ItemCard` | `<FormMessage>` **không truyền `tone`** (`:245`) → mặc định `tone="danger"`, chữ đỏ + `role="alert"` cho thông điệp "Đã lưu tài liệu vào kho riêng tư." | ✖ Lỗi hiển thị rõ ràng |
| Thông báo lỗi tạo kế hoạch | `<FormMessage>` cũng không truyền `tone` (`:331`) | ◐ May mắn đúng vì chỉ dùng cho lỗi |

## 6. Responsive

**360 px (mobile)**

- `PageContainer` `px-4 py-6` (`page-container.tsx`) — ổn.
- Lưới lớp `grid gap-4 md:grid-cols-2 xl:grid-cols-3` → 1 cột ở 360 px. ✔
- Card 7 ngày `md:grid-cols-2 xl:grid-cols-3` → 1 cột. ✔
- Form upload `flex-col gap-2 sm:flex-row` (`:272`) → xếp dọc ở mobile. ✔
- `ItemFields` `grid gap-4 md:grid-cols-2` → 1 cột, nhưng **12 trường liên tiếp** là form rất dài;
  `docs/06 §11` yêu cầu **form drawer** cho mobile — chưa có.
- Tên tệp dùng `break-all` (`:264`) → không tràn ngang. ✔
- `e2e/teaching-plan.spec.ts` chạy ở cả 3 project 360/768/1366 nhưng **không** có assertion
  `expectNoHorizontalOverflow` như spec `results.spec.ts` — thiếu chốt chặn tràn ngang cho M06.

**1366 px (laptop)**

- `max-w-[1440px]` → không giãn quá rộng. ✔
- View "Theo tháng" dùng `xl:grid-cols-2` (`:365`) → 2 card/hàng ở ≥1280 px. ✔
- `docs/06 §11` yêu cầu **row inline edit trên desktop**; hiện tại vẫn là card + form bung ra — không tận dụng chiều ngang.

## 7. Accessibility

| Hạng mục | Đánh giá |
|---|---|
| Touch target ≥ 44 px | ✔ `Button` mọi size đều `min-h-11` (`src/components/ui/button.tsx:21-23`); `Input` `h-11`; select dùng `h-11 min-h-11` (`teaching-plan-editor.tsx:29`) |
| Nhãn form | ✔ Trường có `Label htmlFor` hoặc `<label>` bọc control (implicit label) — hợp lệ |
| `textarea` | ◐ `min-h-24` nhưng không có `id`, chỉ dựa vào label bọc ngoài — hợp lệ nhưng khó tham chiếu từ `aria-describedby` |
| Thông báo | ✔ `FormMessage` có `role="alert"`/`role="status"` (`form-message.tsx:21`) — trừ lỗi `tone` nêu ở §5 |
| Toggle hiển thị | ✖ Không có `role="tablist"`/`aria-current` cho link đang chọn |
| Badge trạng thái | ◐ "Kiểm tra"/"Bài học" và "N mục"/"Chưa tạo" chỉ khác nhau bằng màu + chữ; chữ có sẵn nên vẫn đọc được, đạt |
| Bảng/danh sách | ✔ Dùng `<dl>/<dt>/<dd>` cho chi tiết mục (`:249-258`) và cho card tuần tới (`week-ahead-schedule.tsx:26-29`) |
| Hộp thoại xác nhận | ✖ `window.confirm` không quản lý được focus/ngôn ngữ |
| Focus ring | ✔ `focus-visible:ring-2` trên link card (`page.tsx:24`) và trên Button |

## 8. Tổng kết mức ưu tiên UI

| Ưu tiên | Việc |
|---|---|
| Cao | `FormMessage` thiếu `tone` trong `ItemCard` (thông báo thành công hiện màu lỗi) |
| Cao | Phân tách trải nghiệm portal (guardian/student) khỏi trang quản trị giáo án |
| Trung bình | Nhóm lại 12 trường của `ItemFields`; drawer cho mobile; inline edit cho desktop |
| Trung bình | Lọc dropdown người dạy theo ngày + hiển thị `capacity` |
| Trung bình | Empty state cho staff không có lớp; phân biệt lỗi RPC với "không có dữ liệu" |
| Thấp | Thay `window.confirm` bằng dialog của design system |
| Thấp | `aria-current`/`role="tablist"` cho toggle hiển thị; bộ đếm ký tự cho textarea dài |
