# M09 — BAN & THIẾT BỊ · 06. UI/UX RECOMMENDATIONS

> Tài liệu **chỉ đánh giá**, không sửa code. Đối chiếu `docs/06-ui-ux-spec.md` §13 (Ban UX)
> và §15 (Forms và validation).

## 1. Information Architecture

### Hiện trạng
- `/committees` — grid card (`committee-list.tsx:130-134`, `md:grid-cols-2 xl:grid-cols-3`).
- `/committees/[id]` — **4 card xếp dọc** (Nhân sự → Thông báo Ban → Lịch họp → Công việc tuần)
  cộng thêm 3 card thiết bị nếu là Ban Kỹ thuật (`committee-workspace.tsx:150-383`,
  `equipment-board.tsx:240-370`).

### Đánh giá
| Điểm | Nhận xét |
|---|---|
| ❌ | `docs/06 §13` quy định **tabs**: Tổng quan / Thành viên / Thông báo / Lịch họp / Công việc tuần / Thiết bị. Hiện tại là một trang cuộn dài. Trên Ban Kỹ thuật, trang có 7 card — người dùng phải cuộn qua toàn bộ nhân sự + thông báo + lịch họp + công việc tuần mới tới kho thiết bị. |
| ❌ | Không có mục "Tổng quan" — không có chỗ nào trả lời nhanh "Ban này đang làm gì tuần này". |
| ❌ | Card ở grid thiếu 3/5 thông tin spec yêu cầu: **Trưởng/Phó**, **lịch họp tiếp theo**, **công việc tuần** (`committee-list.tsx:25-36` chỉ có tên + số thành viên + mô tả). |
| ✅ | Breadcrumb ngược ("← Danh sách Ban") đặt ở `PageHeader.action`, luôn thấy được (`[committeeId]/page.tsx:33-37`). |
| ✅ | Kho thiết bị chỉ xuất hiện đúng ở Ban giữ kho — không tạo mục rỗng gây nhiễu. |

### Khuyến nghị
1. Chuyển trang chi tiết sang tabs; giữ URL `?tab=` để chia sẻ link được.
2. Card Ban bổ sung dòng "Trưởng ban: {tên}" và chip "Họp {ngày gần nhất sắp tới}".
3. Thêm tab "Tổng quan" gom: công việc tuần hiện tại + buổi họp kế tiếp + 3 thông báo mới nhất.

## 2. Navigation

| Điểm | Nhận xét |
|---|---|
| ✅ | Mục "Ban" nằm đúng nhóm "Điều hành", chỉ audience `staff` (`src/config/navigation.ts:52`). |
| ⚠️ | Staff không thuộc Ban nào vẫn thấy mục "Ban" trong sidebar rồi vào một trang rỗng. Empty state có hướng dẫn tốt (`committee-list.tsx:126`) nhưng vẫn là một mục menu dẫn tới ngõ cụt. |
| ⚠️ | Không có đường đi ngược từ kho thiết bị về "tất cả phiếu đang mượn của tôi" — thủ kho phải nhớ đang cho ai mượn gì. |
| ❌ | Không có deep-link tới một Ban cụ thể từ thông báo Ban (M10 chỉ cho chọn `/committees` gốc, xem `constants.ts:35-53` của module notifications). |

## 3. Độ rõ của action

| Nút | Vị trí | Đánh giá |
|---|---|---|
| "Thêm Ban mới" | `committee-list.tsx:116` | ✅ Ẩn hoàn toàn khi không có quyền; có mô tả bối cảnh ("Sáu Ban mặc định đã có sẵn…") |
| "Kết thúc" (nhiệm kỳ) | `committee-workspace.tsx:183-189` | ❌ Nhãn mơ hồ ("Kết thúc" cái gì?), `variant="outline"` giống nút vô hại, **không có xác nhận**. Nên là "Kết thúc nhiệm kỳ" + dialog. |
| Select chức vụ | `committee-workspace.tsx:166-182` | ❌ Lưu ngay khi `onChange`. Người dùng dùng bàn phím/mũi tên để duyệt option sẽ vô tình bắn nhiều request. Không có nút xác nhận, không có trạng thái "đã lưu" cho từng dòng. |
| "Xóa" (3 loại nội dung) | `:255-264, :318-327, :361-370` | ❌ Một cú bấm, không hoàn tác, không xác nhận. Cần dialog + `variant="danger"`. |
| "Cho mượn" | `equipment-board.tsx:96-98` | ✅ Ẩn khi hết hàng hoặc thiết bị ngưng dùng — đúng trạng thái |
| "Ghi nhận trả" | `equipment-board.tsx:338` | ❌ Không truyền đạt hệ quả. Xem §5. |
| "Sửa" thiết bị | `equipment-board.tsx:100` | ⚠️ `variant="ghost"` cạnh badge tình trạng, độ tương phản thấp trên nền card |

**Vấn đề chung**: mọi phản hồi thành công/thất bại dồn về **một** `FormMessage` ở đầu component
(`committee-workspace.tsx:151`, `equipment-board.tsx:242`). Khi người dùng đang ở cuối trang (kho thiết bị
nằm sau 4 card), bấm "Ghi nhận trả" xong thì thông báo hiện ở **trên cùng**, ngoài viewport. Người dùng
không biết thao tác đã thành công hay chưa và dễ bấm lại.

## 4. Form

| Tiêu chí `docs/06 §15` | Trạng thái | Bằng chứng |
|---|---|---|
| Label trên input | ✅ | `<Label htmlFor>` dùng nhất quán; các `<select>` bọc trong `<label><span>` |
| Required marker | ❌ | Dùng thuộc tính `required` của HTML nhưng **không có dấu \*** hay nhãn "bắt buộc" nào nhìn thấy được |
| Error dưới field | ❌ | Toàn bộ lỗi hiển thị ở một banner đầu form; lỗi Zod theo field (`path: ["endsAt"]`, `path: ["weekStart"]`) bị nuốt vì action chỉ trả `code`+`message` chung (`actions.ts:28-31`) — thực tế lỗi Zod rơi vào nhánh `CONFLICT` với thông điệp "Không thể xử lý yêu cầu. Vui lòng thử lại." **hoàn toàn không nói người dùng sai chỗ nào** |
| Không xóa dữ liệu form khi server error | ⚠️ Vi phạm 1 chỗ | `equipment-board.tsx:58` — `setShowBorrow(false)` chạy ngay sau khi khởi động transition, form mượn đóng lại kể cả khi lỗi |
| Date picker + input manual | ✅ | `type="date"` / `type="datetime-local"` |
| Mô tả Ban | ⚠️ | Dùng `<Input>` một dòng cho trường tối đa 1000 ký tự (`committee-list.tsx:108`) — nên là `<textarea>` |

**Điểm cộng đáng giữ**: gợi ý giới hạn 2 Ban ngay trong option (`"— đã đủ hai Ban"`,
`committee-workspace.tsx:212`) là ví dụ tốt về việc dạy quy tắc nghiệp vụ ngay tại điểm quyết định.

**Thiếu nghiêm trọng**: form "Công việc tuần" (`:336-350`) không cho biết tuần đang chọn **đã có bản**.
Đây vừa là vấn đề UI vừa là nguyên nhân mất dữ liệu (F11).

**Thiếu**: form "Cho mượn" và "Ghi nhận trả" đều không hiện lại số tồn kho **sau** thao tác dự kiến
(ví dụ "Sau khi mượn: còn 1/3").

## 5. Empty state và error state

| Màn hình | Empty state | Đánh giá |
|---|---|---|
| Danh sách Ban | "Bạn chưa thuộc Ban nào. Xin liên hệ Ban điều hành xứ đoàn để được thêm vào Ban." (`committee-list.tsx:126`) | ✅ Có nguyên nhân + hành động tiếp theo |
| Nhân sự Ban | "Ban chưa có nhân sự." (`:155`) | ✅ |
| Thông báo Ban | "Ban chưa có thông báo nào." (`:248`) | ✅ |
| Lịch họp | "Chưa có buổi họp nào." (`:304`) | ✅ |
| Công việc tuần | "Chưa có công việc tuần nào." (`:354`) | ✅ |
| Kho thiết bị | "Kho chưa có thiết bị nào." (`equipment-board.tsx:283`) | ✅ |
| Đang mượn | "Không có thiết bị nào đang được mượn." (`:309`) | ✅ |
| Lịch sử mượn/trả | Card **biến mất hoàn toàn** khi rỗng (`:347`) | ⚠️ Không sai, nhưng gây cảm giác trang "nhảy" sau lần trả đầu tiên |

**Error state**: đủ thông điệp tiếng Việt cho các lỗi nghiệp vụ đã lường trước
(`COMMITTEE_LIMIT_EXCEEDED`, `EQUIPMENT_NOT_ENOUGH`, `EQUIPMENT_AVAILABLE_READONLY`…, xem
`committees/actions.ts:33-49` và `equipment/actions.ts:28-53`). **Nhưng** lỗi Zod (đường phổ biến nhất
khi người dùng nhập sai) rơi vào nhánh cuối cùng và hiện thông điệp vô nghĩa. Đây là khoảng trống lớn nhất
của tầng error state.

**Thiếu cảnh báo hệ quả**: "Ghi nhận trả" với số nhỏ hơn số đã mượn sẽ trừ vĩnh viễn khỏi tổng kho.
Không một chữ nào trên màn hình nói điều đó. Nhãn "Số lượng trả được" (`equipment-board.tsx:322`)
gợi ý sai rằng đây chỉ là "hôm nay mang về bấy nhiêu".

## 6. Responsive 360 / 1366

| Điểm | Nhận xét |
|---|---|
| ✅ | Mọi grid dùng cặp `grid gap-3` + `md:grid-cols-*` → 360px xếp một cột |
| ✅ | `flex flex-wrap items-start justify-between gap-3` ở mọi hàng có nút → nút rơi xuống dòng thay vì tràn |
| ✅ | `min-w-0` trên khối text dài giúp `truncate`/wrap hoạt động (`committee-list.tsx:24`, `committee-workspace.tsx:160,309`) |
| ✅ | E2E chạy 3 viewport (360/768/1366) và assert không tràn ngang (`tests/e2e/committees.spec.ts:62-69,146,170`) |
| ⚠️ | Ở 1366px, grid Ban `xl:grid-cols-3` chưa kích hoạt (breakpoint `xl` = 1280px của Tailwind thì có) — kiểm tra lại mật độ; card nhiều khoảng trắng ở laptop |
| ⚠️ | Form thiết bị `md:grid-cols-2` → ở 360px, 6 ô xếp dọc thành form rất dài; nên gom "Nhóm/Vị trí/Ghi chú" vào phần "Thông tin thêm" thu gọn được |
| ⚠️ | Danh sách "Đang mượn" ở 360px: mỗi phiếu là một card có 3 ô nhập + 1 nút — với 10 phiếu đang mượn thì trang rất dài, không có tìm kiếm/lọc |

## 7. Accessibility

| Tiêu chí | Trạng thái | Bằng chứng |
|---|---|---|
| Touch target ≥44px | ✅ | `Button` mọi size đều `min-h-11` (`src/components/ui/button.tsx:20-24`); `<select>` dùng `h-11 min-h-11` (`committee-workspace.tsx:31`, `equipment-board.tsx:21`) |
| Nhãn cho control không có `<Label>` | ✅ | `aria-label={\`Chức vụ của ${member.displayName}\`}` (`committee-workspace.tsx:169`) — làm đúng |
| Liên kết `htmlFor` ↔ `id` | ✅ | id có hậu tố theo item (`quantity-${item.id}`) nên không trùng khi nhiều dòng (`equipment-board.tsx:117-118`) |
| Heading hierarchy | ✅ | `PageHeader` → `CardTitle` theo thứ tự |
| Checkbox "Còn sử dụng" | ❌ | `<input type="checkbox">` thô, ~13–16px, dưới ngưỡng 44px; chỉ có `<label>` bọc `min-h-11` nên vùng bấm đủ nhưng **ô** thì không (`equipment-board.tsx:158-160`) |
| Thông báo động cho screen reader | ❌ | `FormMessage` không có `role="status"`/`aria-live` — người dùng screen reader không biết thao tác đã xong |
| Trạng thái pending | ⚠️ | Nút đổi chữ ("Đang lưu…") nhưng không có `aria-busy`; các nút chỉ có `disabled` (nút "Xóa", "Kết thúc") thì im lặng hoàn toàn |
| Màu là kênh thông tin duy nhất | ⚠️ | Badge tình trạng thiết bị (`success`/`warning`/`danger`, `equipment-board.tsx:92-94`) có kèm chữ → ✅; nhưng badge "Mới"/chức vụ chỉ khác nhau bằng variant màu |
| Focus visible | ✅ | `focus-visible:ring-2` trong `buttonVariants` |

## 8. Xếp hạng khuyến nghị UI/UX

| # | Khuyến nghị | Mức | Luồng liên quan |
|---|---|---|---|
| 1 | Form công việc tuần: prefill + nhãn "Cập nhật" khi tuần đã có bản | **Cao** | F11 |
| 2 | "Ghi nhận trả": tách "nhận lại hàng" khỏi "báo hỏng/mất", có xác nhận nêu rõ tổng kho sẽ giảm | **Cao** | F16 |
| 3 | Trả lỗi Zod theo từng field thay vì thông điệp "Không thể xử lý yêu cầu" | **Cao** | tất cả |
| 4 | Dialog xác nhận cho 3 nút "Xóa" và nút "Kết thúc nhiệm kỳ" | **Cao** | F06, F08, F10, F12 |
| 5 | Bỏ auto-save trên select chức vụ; dùng controlled + nút lưu | **Cao** | F05 |
| 6 | `FormMessage` đặt gần hành động (hoặc dùng toast) + `aria-live` | Trung bình | tất cả |
| 7 | Chuyển trang chi tiết sang tabs theo `docs/06 §13` | Trung bình | F03 |
| 8 | Card Ban bổ sung Trưởng/Phó, họp kế tiếp, công việc tuần | Trung bình | F01 |
| 9 | Không đóng form mượn khi server lỗi | Trung bình | F15 |
| 10 | Lịch họp tách "Sắp diễn ra" / "Đã qua" | Trung bình | F09 |
| 11 | Required marker nhìn thấy được; mô tả Ban dùng textarea | Thấp | F02 |
| 12 | Checkbox tùy biến đạt 44px | Thấp | F14 |
