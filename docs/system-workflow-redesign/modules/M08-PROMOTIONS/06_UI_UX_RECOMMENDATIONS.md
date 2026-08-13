# M08-PROMOTIONS — 06. Đánh giá UI/UX

> Chỉ **đánh giá**, không kèm code. Đối chiếu `docs/06-ui-ux-spec.md`.

## 1. Kiến trúc thông tin (IA)

| Quan sát | Đánh giá |
|---|---|
| Một trang phẳng `/promotions`, không route con (`page.tsx:6-14`) | Phù hợp với quy mô nhỏ, **không phù hợp** với 900 em |
| Không phân cấp Ngành → Lớp → Thiếu nhi, dù đây chính là cấu trúc tổ chức | **Sai với mô hình tinh thần của người dùng.** `docs/06` §9 đã dùng nhóm-theo-ngành cho trang Lớp; trang này nên nhất quán |
| Không có bảng tiến độ ("đã đề xuất 12/28") | Người duyệt không biết còn thiếu bao nhiêu → không biết khi nào xong |
| Trộn 2 vai trò trong cùng một card (form đề xuất + form duyệt) | Với global-write, một card có tới 2 form chồng nhau; ranh giới trách nhiệm mờ |

## 2. Điều hướng

- Mục "Lên lớp/chuyển lớp" nằm nhóm "Mục vụ" (`navigation.ts:51`) — hợp lý.
- **Không có breadcrumb, không có liên kết ngược** từ card sang hồ sơ thiếu nhi hay trang lớp.
  Người duyệt muốn xem học lực chi tiết một em phải tự mở tab khác và tìm lại.
- Trang chi tiết thiếu nhi **không** có tab chuyển lớp — **đúng** `docs/06:247`.
- Trang lớp `/classes/[classId]` **không** liên kết sang `/promotions` cho lớp đó → hai nơi cùng nói về ghi danh mà không nối nhau.

## 3. Độ rõ của hành động

| Vấn đề | Bằng chứng | Mức |
|---|---|---|
| Nút **"Duyệt"** không có xác nhận, dù nó đóng ghi danh cũ và tạo ghi danh mới không lùi được | `promotion-board.tsx:155` | Cao |
| Nút **"Từ chối"** dùng `variant="outline"`, nhìn như nút phụ; nó là hành động phá hủy nhẹ | `promotion-board.tsx:156` | Trung bình |
| Nút "Lưu đề xuất" không nói rõ hệ quả ("gửi cho Trưởng ngành duyệt") | `promotion-board.tsx:139` | Trung bình |
| Không hiển thị **ai** đã đề xuất và **ai** đã duyệt | `queries.ts:120-132` không map `proposed_by`/`reviewed_by` | Cao (người duyệt cần biết nguồn) |
| Ngày duyệt (`reviewedAt`) có trong dữ liệu nhưng không render | `queries.ts:127`, `promotion-board.tsx:108-112` | Thấp |

## 4. Form

| Vấn đề | Bằng chứng |
|---|---|
| Select "Đề xuất" mặc định `recommended_promote` và select lớp đích tự chọn phần tử đầu | `promotion-board.tsx:42, 52` — người dùng có thể lưu một đề xuất "đầy đủ" mà chưa thực sự quyết định |
| Danh sách lớp đích sắp theo `display_name` toàn hệ thống, không ưu tiên nhánh A/B tương ứng | `queries.ts:92`, `promotion-board.tsx:52` — trái quy tắc "mặc định giữ nhánh A/B" |
| Ô "Ghi chú đại diện" là `<Input>` một dòng, `maxLength=1000` | `promotion-board.tsx:138` — 1000 ký tự trong ô một dòng là sai kiểu control, nên là `textarea` |
| Ô "Ý kiến trưởng ngành" cũng là `<Input>` một dòng | `promotion-board.tsx:153` |
| Checkbox "Đề xuất vào Dự trưởng" đặt **sau** ô lớp đích, nhưng khi tick lại làm ô lớp đích biến mất | `promotion-board.tsx:124-137` — layout nhảy, gây giật |
| Khi `reviewTargets` rỗng, select `required` không có option nào | `promotion-board.tsx:148-150` — người duyệt thấy select trống, không có thông báo giải thích |
| Không có trạng thái "dirty"/cảnh báo rời trang khi đang sửa | — |

## 5. Empty state / Error state

| Trạng thái | Hiện tại | Đánh giá |
|---|---|---|
| Không có ghi danh | "Không có ghi danh đang mở trong phạm vi của bạn." (`promotion-board.tsx:167`) | Rõ, nhưng **thiếu hướng dẫn tiếp theo** (liên hệ ai, kiểm tra năm học nào) |
| Chưa đề xuất | Badge "Chưa đề xuất" (`103`) | Tốt |
| Lỗi server | `FormMessage tone="danger"` ngay trong card (`160`) | Vị trí tốt (gần hành động), nhưng **không có `aria-live`** nên trình đọc màn hình không thông báo |
| Lỗi validation client | Chỉ dựa vào `required` của HTML | Thông điệp mặc định của trình duyệt, tiếng Anh trên một số cấu hình |
| Thông điệp lỗi từ DB | Gộp nhiều nguyên nhân `23514` thành một câu (`actions.ts:23-25`) | Người dùng không biết phải sửa gì |
| Thành công | Chỉ hiện text + `router.refresh()` (`67-70`) | Sau refresh, form đề xuất biến mất nếu đã approved — thay đổi đột ngột không được báo trước |

## 6. Responsive

**360px (điện thoại — thiết bị chính của GLV):**
- Lưới 1 cột (`promotion-board.tsx:168`) — đúng.
- Form đề xuất `md:grid-cols-2` → xếp dọc — đúng.
- **Vấn đề:** mỗi card cao ~450–550px (header + đề xuất + cảnh báo + form đề xuất + form duyệt).
  Với 28 em một lớp là ~14.000px cuộn. Không có cách gấp gọn card.
- Hàng nút "Duyệt / Từ chối" dùng `flex-wrap` (`154`) — không tràn ngang. Đạt.
- Không có thanh hành động dính (sticky) → phải cuộn về đầu để đổi ngữ cảnh.

**1366px (laptop — thiết bị của Trưởng ngành):**
- `xl:grid-cols-2` chỉ kích hoạt từ 1280px → có 2 cột. Đạt.
- Bề ngang bị lãng phí: mỗi card chỉ dùng ~50% với nội dung thưa; dạng bảng sẽ hiệu quả hơn nhiều.
- Không có cột cố định/tiêu đề dính khi cuộn.

**Kết luận responsive:** không vỡ layout ở cả hai mốc, nhưng **mật độ thông tin sai** ở cả hai —
quá dày dọc trên mobile, quá thưa ngang trên desktop.

## 7. Accessibility (mục tiêu ≥44px, WCAG AA)

| Hạng mục | Tình trạng | Bằng chứng |
|---|---|---|
| Chiều cao select | `h-11 min-h-11` = 44px ✅ | `promotion-board.tsx:16` |
| Chiều cao nút | `Button` mặc định (kiểm tra ở `components/ui/button`) — hàng nút có `flex-wrap` | `154-157` |
| **Checkbox Dự trưởng** | `<input type="checkbox">` thuần, ~13–16px ❌ **dưới 44px** | `promotion-board.tsx:135` (bọc trong `<label class="flex min-h-11 items-center">` nên vùng nhấn của **label** đạt 44px chiều cao, nhưng vùng nhấn thực của ô tick thì không) |
| Nhãn select "Đề xuất" / "Lớp đích" | Dùng `<span>` bên trong `<label>` bọc, **không có `id`/`htmlFor`** ❌ | `promotion-board.tsx:118-131, 146-151` |
| Nhãn ô ghi chú | Có `Label htmlFor` + `id` ✅ | `138, 153` |
| Thông báo kết quả | Không `role="status"` / `aria-live` ❌ | `160` |
| Trạng thái đang xử lý | Nút đổi chữ "Đang xử lý…" ✅ nhưng không `aria-busy` | `155` |
| Badge trạng thái | Chỉ phân biệt bằng **màu** + chữ; chữ có nghĩa ✅ | `103` |
| Cảnh báo | `text-warning` trên nền `bg-muted` — **cần kiểm tương phản** ⚠️ | `promotion-board.tsx:34` |
| Thứ tự tab | Hợp lý (form theo thứ tự DOM) ✅ | — |
| Nút "Từ chối" là `type="button"` trong form | Bàn phím Enter trong form sẽ kích hoạt **"Duyệt"**, không phải "Từ chối" — đúng nhưng nguy hiểm vì Duyệt là hành động không lùi ⚠️ | `144, 156` |

## 8. Xếp hạng khuyến nghị UI

| Ưu tiên | Khuyến nghị |
|---|---|
| P0 | Thêm lọc theo ngành/lớp + phân trang; đổi card sang bảng khi ≥20 dòng |
| P0 | Hộp xác nhận cho "Duyệt" (nêu rõ lớp cũ → lớp mới) |
| P1 | Hiển thị người đề xuất / người duyệt / thời điểm |
| P1 | Bắt buộc lý do khi "Từ chối" |
| P1 | `id`+`htmlFor` cho 2 select chính; `aria-live` cho thông báo |
| P2 | Đổi ô ghi chú sang `textarea` |
| P2 | Mặc định lớp đích theo cùng nhánh A/B của lớp nguồn |
| P2 | Card gấp gọn được trên mobile; bảng tiến độ theo lớp ở đầu trang |
| P3 | Kiểm tương phản `text-warning` trên `bg-muted` |
