# M07-ASSESSMENTS — 06. Đánh giá UI/UX

> Tài liệu **chỉ đánh giá**. Đối chiếu `docs/06-ui-ux-spec.md §12`.

## 1. Kiến trúc thông tin (IA)

| Điểm | Đánh giá |
|---|---|
| `/results` phục vụ **cả** portal phụ huynh lẫn hub quản trị (`results/page.tsx:16-20`) | ✔ Đúng D-25: GLV vừa là phụ huynh thấy cả hai khối, có tiêu đề phân tách "Kết quả của con" / "Bảng điểm phụ trách" |
| Trang lớp gộp 6 khối trong một trang dài: thanh khóa/export → thêm cột → cấu hình cột → nhập điểm → trung bình → nhận xét → Top 5 (`gradebook-editor.tsx:498-551`) | ✖ Không có tab/anchor; với lớp 6 cột điểm và 30 em, trang có ~7 bảng và ~30 card nhận xét → cuộn rất dài |
| "Cấu hình cột điểm" và "Nhập điểm" là **hai danh sách song song cùng một tập cột** (`:518-523` và `:536-537`) | ✖ Người dùng phải ghép cặp bằng mắt; sửa hệ số ở trên, nhập điểm ở dưới |
| Khối "Điểm trung bình có trọng số" đứng riêng (`:541-546`) | ◐ Rõ ràng nhưng tách khỏi bảng nhập điểm nên khó đối chiếu |
| Export đặt cạnh nút Khóa trên thanh trạng thái (`:507-510`) | ✔ Dễ tìm |

## 2. Điều hướng

- Hub → lớp bằng card `<Link>` bọc toàn bộ (`results/page.tsx:24`) — ✔ vùng chạm lớn.
- Không có breadcrumb; chỉ "← Danh sách lớp" (`[classId]/page.tsx:17`) — đủ cho 2 cấp.
- Mobile có `<select id="mobile-assessment">` để chọn cột (`:529-534`) nhưng **desktop không có** cơ chế
  nhảy nhanh tới cột; `ScoreColumnForm` có `id={"assessment-" + id}` (`:242`) mà **không nơi nào link tới**.
- Sau khi lưu điểm, `router.refresh()` giữ nguyên vị trí cuộn — ✔.

## 3. Độ rõ của action

| Vấn đề | Vị trí |
|---|---|
| Nút "Công bố"/"Ẩn" nằm chung hàng với "Lưu"/"Xóa" ở `variant="ghost"` (`:186`) — hành động có **tác động ra ngoài tổ chức** lại nhẹ nhất về thị giác | `AssessmentSettings` |
| Không có xác nhận khi "Công bố" (khác với Top 5 có confirm — `:427`) | `:160-166` |
| Nút "Lưu điểm {tên cột}" đặt **dưới** bảng dài (`:280`); trên mobile phải cuộn hết roster mới thấy | `ScoreColumnForm` |
| "Xem trước" và "Công bố snapshot" cùng một `<form>`, nút publish là `type="button"` đọc `event.currentTarget.form` (`:453`) — dễ vỡ nếu đổi cấu trúc DOM | `LeaderboardCard` |
| Bản nháp Top 5 **không có nút xóa** dù policy cho phép (`M600:344`) | `LeaderboardPanel` |
| Nhãn "Ẩn khỏi portal" (`:449`) không nói rõ hệ quả: publish lại sẽ **tính lại** bảng xếp hạng | `LeaderboardCard` |
| `window.confirm` cho 4 hành động phá hủy (`:169`, `:312`, `:427`, `:488`) | Không theo design system |

## 4. Form

- **Thêm cột điểm** (`:99-131`): 5 trường trên `xl:grid-cols-5`, hợp lý. Nhưng ô "Hệ số" dùng
  `key={kind}` để reset `defaultValue` khi đổi loại (`:116`) — thủ thuật React khiến giá trị người dùng vừa gõ
  bị **mất** nếu họ đổi loại sau khi nhập hệ số.
- **Nhập điểm**: `<Input key={...score ?? "null"}>` (`:265`) buộc remount khi dữ liệu server đổi — cần thiết để
  đồng bộ nhưng đồng nghĩa **mọi ô đang gõ dở sẽ bị reset** sau `router.refresh()` của một hành động khác trên trang.
- Không có tự động lưu, không có chỉ báo "có thay đổi chưa lưu"; rời trang là mất.
- **Không có bộ lọc/tìm kiếm** thiếu nhi trong roster; lớp đông phải cuộn.
- **Nhận xét**: mặc định "Công khai cho phụ huynh/thiếu nhi" (`:345`) — mặc định rủi ro; không có preview
  "phụ huynh sẽ thấy gì"; không sửa được, chỉ xóa.
- **Top 5 thi đua tùy chỉnh**: ô điểm `required` cho **toàn bộ** lớp (`:452`) — muốn xếp hạng 5 em vẫn phải nhập
  đủ 30 số; `min="-1000000"` hiển thị trong tooltip trình duyệt gây khó hiểu.

## 5. Empty state và error state

| Trạng thái | Hiện tại | Đánh giá |
|---|---|---|
| Chưa có năm học | Card "Chưa có năm học hiện hành." (`results/page.tsx:15`) | ✔ |
| Staff không có lớp | "Bạn chưa có lớp nào trong phạm vi kết quả." (`:23`) | ✔ |
| Lớp chưa có cột điểm | "Lớp chưa tạo cột điểm. Đây là trạng thái hợp lệ; không có cột bắt buộc." (`:526`) | ✔ Rất tốt — dạy người dùng đúng nghiệp vụ |
| Chưa có nhận xét | "Chưa có nhận xét." (`:329`) | ✔ |
| Top 5 tắt cờ | "Super Admin chưa bật tính năng Top 5 cho năm học này." (`:467`) | ✔ Nêu rõ ai cần hành động |
| Chưa có Top 5 | "Chưa có bảng Top 5." (`:470`) | ✔ |
| Chưa xem trước Top 5 | "Chưa có bản xem trước." (`:456`) | ✔ |
| Portal rỗng | "Chưa có kết quả nào được công bố." (`published-results-portal.tsx:9`) | ✔ |
| Lỗi từ server | `FormMessage` với `tone` đúng ở hầu hết chỗ | ✔ (khác M06) |
| Thông điệp Zod | Luôn hiện "Không thể lưu bảng điểm. Vui lòng thử lại." (`actions.ts:38`) | ✖ Nuốt mọi lỗi field |
| Lỗi export | Trả JSON `{error}` thô ra trình duyệt khi 404/400 (`export/route.ts:15`, `:89`) | ✖ Người dùng thấy JSON, không phải trang lỗi |

## 6. Responsive

**360 px**

- Hub: lưới lớp `md:grid-cols-2 xl:grid-cols-3` → 1 cột. ✔
- Bảng nhập điểm: `overflow-x-auto` + `min-w-[34rem]` + cột tên `sticky left-0` (`:254-263`) → cuộn ngang
  **bên trong** khung, không tràn trang. ✔ E2E có `expectNoHorizontalOverflow` (`tests/e2e/results.spec.ts`).
- Chỉ render **một** cột điểm ở mobile qua `<select>` (`:537`) → đúng `docs/06 §12` ("Mobile chọn từng
  assessment hoặc từng student, không ép full spreadsheet"). ✔
- Nhưng: `visibleAssessments` được tính ở cấp `GradebookEditor` còn cả hai nhánh desktop/mobile đều **render đồng
  thời** (`:536-537`), chỉ ẩn bằng `hidden md:block` / `md:hidden` ⇒ với 6 cột × 30 em, DOM chứa ~7 bảng dù
  mobile chỉ thấy 1 → nặng máy yếu.
- Panel nhận xét `xl:grid-cols-2` → 1 cột; mỗi em một card + form → trang rất dài.
- Portal: bảng điểm `overflow-x-auto min-w-[520px]` (`published-results-portal.tsx:25-26`). ✔

**1366 px**

- `max-w-[1440px]` → không quá rộng. ✔
- `AssessmentSettings` dùng `md:grid-cols-[minmax(12rem,1fr)_10rem_7rem_auto]` (`:180`) → hàng gọn. ✔
- Bảng điểm vẫn là **một bảng cho mỗi cột** thay vì một lưới nhiều cột như `docs/06 §12` mô tả
  ("Assessment dynamic columns", "Sticky student column", "Horizontal scroll desktop") ⇒ **lệch spec**:
  không thể nhìn toàn cảnh một em qua tất cả các cột.

## 7. Accessibility

| Hạng mục | Đánh giá |
|---|---|
| Touch target ≥ 44 px | ✔ Button mọi size `min-h-11`; Input `h-11`; select `h-11 min-h-11` (`:43`) |
| Nút "Đang chỉnh tay · dùng lại đề xuất" là `<button className="min-h-11 text-primary underline">` (`:269`) | ✔ đủ cao, nhưng chỉ khác biệt bằng gạch chân + màu |
| Nhãn ô điểm/ghi chú | ✔ `aria-label="Điểm {tên}"` / `aria-label="Ghi chú {tên}"` (`:265`, `:273`) — rất tốt cho bảng |
| Bảng | ✔ `<caption className="sr-only">` (`:256`), `<th>` cho cả header cột và tên thiếu nhi (`:263`) |
| Thông báo | ✔ `FormMessage` có `role="alert"`/`role="status"` |
| Ô điểm thi đua Top 5 | ✔ có `aria-label` (`:452`) |
| Trạng thái khóa | ◐ Chỉ là `Badge` màu + chữ ("Đã khóa"/"Đang mở") — có chữ nên đọc được, đạt |
| Trạng thái "Đã công bố"/"Nội bộ" | ◐ Như trên, đạt |
| Bảng portal | ✔ có `<thead>` đầy đủ |
| `window.confirm` | ✖ Không quản lý focus, không dịch được nút |
| Bảng nhập điểm khi khóa | ◐ Input `disabled` — trình đọc màn hình bỏ qua hoàn toàn; nên `readonly` + thông báo lý do |

## 8. Tổng kết mức ưu tiên UI

| Ưu tiên | Việc |
|---|---|
| Cao | Đổi mặc định nhận xét sang "Nội bộ" + cảnh báo khi chọn công khai |
| Cao | Thêm xác nhận cho "Công bố" cột điểm; làm rõ hệ quả của "Ẩn khỏi portal" (Top 5) |
| Cao | Hiển thị thông điệp lỗi theo trường thay vì câu chung |
| Trung bình | Gộp "Cấu hình cột" vào chính bảng nhập điểm của cột đó; hoặc thêm anchor điều hướng giữa hai danh sách |
| Trung bình | Chỉ render bảng đang hiển thị (mobile) thay vì render cả hai nhánh |
| Trung bình | Nút "Lưu điểm" dạng sticky ở đáy bảng dài; chỉ báo "có thay đổi chưa lưu" |
| Trung bình | Thêm nút xóa bản nháp Top 5; cho phép nhập điểm thi đua chỉ cho một phần lớp |
| Thấp | Bộ lọc/tìm nhanh thiếu nhi trong roster; trang lỗi thay vì JSON thô cho export |
| Thấp | Thay `window.confirm` bằng dialog design system; `readonly` thay `disabled` khi khóa |
