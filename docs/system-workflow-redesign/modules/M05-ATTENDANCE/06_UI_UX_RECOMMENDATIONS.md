# M05-ATTENDANCE — Khuyến nghị UI/UX

> **Chỉ đánh giá UI/UX.** Luật nghiệp vụ và bảo mật xem `03`/`05`.
> Bối cảnh: ~40 GLV, dùng hằng tuần, chủ yếu **điện thoại 360px**, thường trong sân nhà thờ,
> mạng 4G không ổn định, thao tác ngay trước/sau Thánh lễ.

## 1. Information Architecture

### Hiện trạng
- `/attendance` = 2 cột: form "Mở buổi điểm danh" (trái) + "Buổi gần đây" (phải)
  (`src/app/(dashboard)/attendance/page.tsx:68-142`).
- `/attendance/[sessionId]` = thẻ trạng thái → (thẻ báo khóa nếu có) → editor thiếu nhi → editor GLV →
  thanh hành động sticky (`[sessionId]/page.tsx:41-85`, `attendance-editor.tsx:156-362`).

### Vấn đề
1. **Không có "buổi của hôm nay" nổi bật.** 90% thao tác thực tế là "điểm danh buổi đang diễn ra",
   nhưng người dùng phải đọc form 3 trường rồi bấm "Mở buổi". Danh sách "Buổi gần đây" đứng ngang hàng
   thay vì phục vụ mục đích khác nhau.
2. **Thứ tự cột trên mobile:** grid `lg:grid-cols-[…]` (`page.tsx:68`) nên ở 360px form nằm trên,
   danh sách nằm dưới — hợp lý. Nhưng khi buổi hôm nay **đã mở**, người dùng vẫn thấy form mở buổi
   trước, dễ tạo lại thay vì tiếp tục.
3. **Danh sách giới hạn cứng 24 buổi**, không lọc, không phân trang (`queries.ts:142`). Với Super Admin
   / global-read (19 lớp × 2 buổi/tuần) đây là chưa tới một tuần.

### Khuyến nghị
- **U-01 (P1):** Trên `/attendance`, đưa lên đầu một khối **"Hôm nay"**: nếu ngày hiện tại (theo
  `APP_TIME_ZONE`) là thứ Năm/Chúa nhật, hiện thẻ lớn cho từng lớp mình phụ trách với nhãn hành động
  rõ: **"Bắt đầu điểm danh"** / **"Tiếp tục"** / **"Xem (đã chốt)"** / **"{Tên} đang phụ trách"**.
  Form "Mở buổi" thu xuống thành mục phụ "Mở buổi khác…".
- **U-02 (P2):** Thêm bộ lọc cho "Buổi gần đây": lớp (nếu >1) · trạng thái · phạm vi tuần; tăng
  `limit` theo bộ lọc thay vì cắt cứng 24.
- **U-03 (P3):** Nhóm danh sách theo ngày (`Chúa nhật 27/07`, `Thứ Năm 24/07`) thay vì danh sách phẳng.

## 2. Navigation

- **U-04 (P1):** Mục "Điểm danh" hiện với Cha sở / Cha phó / Thủ quỹ nhưng dẫn tới `/access-denied`
  (`src/config/navigation.ts:45` vs `src/lib/permissions/route-map.ts:9-11,29`). Link chết trong menu
  chính là lỗi UX nghiêm trọng với nhóm người dùng lớn tuổi. Phải hoặc ẩn, hoặc mở chế độ xem
  (xem TB-10).
- **U-05 (P3):** Trang buổi có link "← Danh sách buổi" ở `PageHeader` (`[sessionId]/page.tsx:32-37`) —
  tốt. Nên thêm breadcrumb ngắn `Điểm danh › {Tên lớp} › {Ngày}` để biết mình đang ở lớp nào khi vào
  từ thông báo/deep link.

## 3. Độ rõ của hành động

### Vấn đề
1. **"Mở buổi" mơ hồ.** Người dùng không biết nút này *tạo mới* hay *vào buổi đã có*, và không biết
   mình có nhận được quyền sửa hay không cho tới khi trang sau tải xong (`actions.ts:206-217` redirect
   bất kể `claimed`).
2. **"Chốt lại" xuất hiện nhưng không bấm được.** Nhãn nút đổi thành "Chốt lại" khi `isFinalized`
   (`attendance-editor.tsx:358`), nhưng ngay sau khi chốt `editing_by=null` nên toàn bộ thanh hành
   động biến mất (`:352`). Nhãn đó thực tế chỉ hiện sau khi đã bấm "Tiếp quản".
3. **"Tiếp quản" là từ nặng** cho hành động thường gặp "tôi muốn sửa lại buổi mình vừa chốt".
4. **Nút "Mở khóa"** đứng cạnh badge trạng thái, không có xác nhận (`[sessionId]/page.tsx:57-62`) —
   hành động của Super Admin có hệ quả nghiệp vụ lớn.

### Khuyến nghị
- **U-06 (P1):** Đổi nhãn theo ngữ cảnh: `Bắt đầu điểm danh` (chưa có buổi) / `Tiếp tục điểm danh`
  (đang dở, mình giữ) / `Xem buổi` (người khác giữ hoặc đã chốt).
- **U-07 (P1):** Khi `claimed === false`, banner ngay đầu trang buổi:
  *"{Tên} đang phụ trách buổi này. Bạn đang xem ở chế độ chỉ đọc."* (TB-08).
- **U-08 (P2):** Đổi "Tiếp quản" → **"Nhận quyền sửa"** khi không có editor nào giữ; giữ chữ
  "Tiếp quản" **chỉ** khi thực sự lấy quyền từ người khác (hai ngữ cảnh này phân biệt được từ
  `editorProfileId === null`, `queries.ts:344-346`).
- **U-09 (P2):** "Mở khóa" cần hộp xác nhận nêu hệ quả: *"Buổi sẽ mở cho Quản trị viên sửa. Sau khi
  chốt lại, buổi khóa lại ngay vì mốc khóa tính từ lần chốt đầu."*

## 4. Form và nhập liệu

### Hiện trạng tốt — giữ nguyên
- Mặc định `present`, chỉ sửa ngoại lệ; mô tả nói đúng điều đó
  (`attendance-editor.tsx:196-199`). Đây là quyết định UX đúng cho lớp 40–50 em.
- Ô ghi chú **chỉ hiện khi có ngoại lệ** (`:208,263`) — giảm nhiễu thị giác rất tốt.
- Bộ đếm sống "Đang vắng: Lễ x, Giáo lý y trên z em" (`:98-105,198`) — phản hồi tức thì, không cần
  gọi server.
- Badge "Có đơn xin nghỉ: {lý do}" ngay trên dòng em đó (`:213-215`).

### Vấn đề
1. **`<select>` cho 5 trạng thái × 2 cột × ~50 em** = tối thiểu 100 lần mở dropdown native cho một
   buổi có nhiều ngoại lệ; trên iOS mỗi lần mở là một picker toàn màn hình.
   `docs/06-ui-ux-spec.md:305-307` yêu cầu "hai segmented control lớn".
2. **Không có thao tác nhanh hàng loạt** (`docs/06-ui-ux-spec.md:308` "Quick actions"), ví dụ
   "vắng cả hai" cho một em — hiện phải đổi 2 dropdown.
3. **Không có bộ lọc/tìm kiếm** (`docs/06-ui-ux-spec.md:311-317`). Ở 360px, mỗi em chiếm ~180px ⇒
   lớp 50 em là **~9000px cuộn**; để soát lại "mình đã đánh vắng ai" phải cuộn hết.
4. **Không có xác nhận trước khi chốt** (`docs/06-ui-ux-spec.md:322-331`). Tổng kết chỉ hiện **sau**
   (`attendance-editor.tsx:179-191`) — đúng lúc không còn sửa nhẹ nhàng được nữa.
5. **Badge đơn xin nghỉ chỉ là thông tin**, không có nút áp dụng gợi ý → GLV phải tự nhớ đổi dropdown.
6. Ghi chú giới hạn 500 ký tự có `maxLength` nhưng **không hiện bộ đếm** khi gần chạm ngưỡng
   (`:269,332`).

### Khuyến nghị
- **U-10 (P1):** Thay `<select>` bằng **segmented control 2 lựa chọn chính** (Có mặt / Vắng) với nút
  "…" mở 3 trạng thái còn lại (Đi trễ / Về sớm / phân biệt có phép–không phép). Lý do: >90% thao tác
  thực tế là chuyển giữa 2 giá trị; ba giá trị còn lại là đuôi dài. Mỗi nút ≥44×44px.
- **U-11 (P1):** Thanh lọc dính đầu roster: **Tất cả · Đang vắng · Có đơn · Cảnh báo** + ô tìm tên
  (so khớp bỏ dấu). Thuần client, không gọi server.
- **U-12 (P1):** Hộp xác nhận trước "Hoàn tất điểm danh" với bảng phân bố 5 trạng thái × 2 cột, tính
  từ draft (TB-03).
- **U-13 (P2):** Trong badge đơn xin nghỉ, thêm nút **"Đặt Vắng có phép"** — chỉ đổi draft, không tự
  ghi (BR-M05-33 phải giữ nguyên).
- **U-14 (P3):** Nút "Đánh dấu vắng cả hai" trên mỗi thẻ em.
- **U-15 (P3):** Bộ đếm ký tự cho ghi chú khi còn <50 ký tự.

## 5. Empty state

| Màn hình | Hiện trạng | Đánh giá |
|---|---|---|
| Chưa có năm học `current` | Giải thích + link `/admin` (`attendance/page.tsx:41-54`) | ✔ tốt — không hiện số 0 giả |
| Không được phân công lớp nào | Giải thích rõ cả lý do nghiệp vụ (trưởng ngành) (`:75-79`) | ✔ rất tốt |
| Chưa có buổi nào | "Chưa có buổi điểm danh nào." (`:114`) | ⚠ thiếu lối ra — nên thêm gợi ý "Mở buổi cho Chúa nhật 27/07" |
| Lớp chưa có thiếu nhi | "Lớp chưa có thiếu nhi ghi danh." (`attendance-editor.tsx:203`) | ⚠ thiếu link tới `/students` để ghi danh |
| Lớp chưa phân công nhân sự | "Lớp chưa phân công nhân sự." (`:296`) | ⚠ thiếu link tới `/staff` |
| Phụ huynh chưa gắn hồ sơ con | "Tài khoản của bạn chưa gắn với hồ sơ thiếu nhi nào." (`absence-request-panel.tsx:85-87`) | ⚠ thiếu hướng dẫn "liên hệ GLV lớp" |
| Chưa có đơn nào | "Chưa có đơn nào." (`:142`) | ✔ |

- **U-16 (P2):** Mọi empty state đều nên có **một lối ra** (link hoặc hành động kế tiếp).

## 6. Error state

### Hiện trạng
- Lỗi server action hiện qua `FormMessage` trong editor (`attendance-editor.tsx:175-177`) hoặc qua
  `?error=` trên query string cho các form server (`attendance/page.tsx:66`, `[sessionId]/page.tsx:39`).
- Thông điệp tiếng Việt ổn định, không lộ SQL (`src/lib/errors/index.ts:19-35`).

### Vấn đề
1. **Thông báo lỗi hiện ở đầu editor**, trong khi nút bấm nằm ở thanh sticky **dưới đáy**
   (`:175` vs `:353`). Trên 360px với roster dài, người dùng bấm Lưu ở dưới, lỗi hiện ở trên màn hình
   cách đó hàng nghìn pixel ⇒ **cảm giác "bấm không ăn"**.
2. **Ba nguyên nhân khác nhau chung một câu**: "Buổi điểm danh đang có người khác phụ trách." dùng cho
   cả ca không ai giữ (F06-I1).
3. **Lỗi trigger DB không được ánh xạ** → "Thao tác bị xung đột. Vui lòng thử lại." — người dùng thử
   lại mãi vẫn hỏng (F03-I1).
4. `?error=` trên URL vẫn còn sau khi reload/chia sẻ link.

### Khuyến nghị
- **U-17 (P1):** Đặt vùng thông báo **trong thanh hành động sticky** (hoặc toast neo đáy) để phản hồi
  luôn ở cạnh nút vừa bấm; giữ thêm bản sao ở đầu trang cho screen reader.
- **U-18 (P1):** `role="alert"` cho lỗi và `role="status"` cho thành công.
- **U-19 (P2):** Mỗi lỗi kèm **hành động khắc phục**: `ATTENDANCE_ALREADY_CLAIMED` → nút "Tải lại";
  `ATTENDANCE_LOCKED` → dòng "Liên hệ Quản trị viên để mở khóa"; lease hết → nút "Nhận quyền sửa".
- **U-20 (P3):** Xóa `?error=` khỏi URL sau khi hiển thị.

## 7. Responsive

### 360px (ưu tiên cao nhất)
| Điểm | Đánh giá |
|---|---|
| Hai select xếp dọc (`grid gap-2 sm:grid-cols-2`, `:217`) | ✔ |
| Thanh hành động `sticky bottom-4`, `flex-col sm:flex-row` (`:353`) | ✔ tốt — nút luôn với tới được |
| Thẻ trạng thái `flex-wrap` (`[sessionId]/page.tsx:42`) | ✔ |
| E2E kiểm không tràn ngang ở cả 3 viewport | ✔ `tests/e2e/attendance.spec.ts` |
| Chiều cao mỗi thẻ em ~180px ⇒ lớp 50 em ~9000px cuộn | ✖ **U-21 (P1)** |
| Tổng kết `grid-cols-2` ở mobile (`:184`) | ✔ |

- **U-21 (P1):** Nén thẻ em ở chế độ "không có ngoại lệ" thành **một dòng** (tên + 2 chip trạng thái),
  chỉ mở rộng khi chạm/đổi trạng thái. Kết hợp U-11 (lọc) giảm cuộn ~80% cho buổi điển hình.
- **U-22 (P2):** Thanh sticky nên hiện tóm tắt siêu ngắn *"48/50 có mặt"* để không phải cuộn lên đọc
  bộ đếm ở `CardDescription`.

### 1366px
| Điểm | Đánh giá |
|---|---|
| Hub 2 cột `lg:grid-cols-[minmax(18rem,0.6fr)_minmax(0,1.4fr)]` (`page.tsx:68`) | ✔ |
| Roster vẫn là **danh sách thẻ**, không phải bảng | ⚠ `docs/06-ui-ux-spec.md:295-299` yêu cầu bảng `Tên / Thánh lễ / Giáo lý / Ghi chú` trên desktop |

- **U-23 (P2):** Ở `lg:` trở lên, render roster dạng bảng để quét mắt theo cột — GLV đại diện thường
  soát lại trên laptop.

## 8. Accessibility

### Đạt
- `aria-label` mô tả đầy đủ và **có tên em** trên mọi control:
  `Thánh lễ của {tên}`, `Giáo lý của {tên}`, `Ghi chú của {tên}`, `Điểm danh {tên}`
  (`attendance-editor.tsx:224,246,270,311,333`). Đây là điểm rất tốt — screen reader đọc ra ngữ cảnh
  đầy đủ.
- Touch target: `h-11 min-h-11` = 44px cho mọi select (`:42`); input mặc định của design system cũng
  ở mức này. ✔ ≥44px.
- `<label>` bọc control với text mô tả (`:218-239,240-261`).
- Form ở hub có `htmlFor`/`id` khớp (`attendance/page.tsx:83-99`).

### Thiếu
| Mã | Vấn đề | Ưu tiên |
|---|---|---|
| **U-24** | **Không có `aria-live` cho trạng thái lease/editor.** Người dùng screen reader không biết mình vừa mất quyền sửa; trang chỉ âm thầm chuyển read-only (`:88-93,154`). Cần vùng `aria-live="polite"` cho lease và `aria-live="assertive"` cho mất quyền. | **P1** |
| **U-25** | Không quản lý focus sau `router.refresh()`; focus rơi về `<body>`, người dùng bàn phím phải Tab lại từ đầu qua ~150 control. | **P1** |
| U-26 | `FormMessage` không được xác nhận có `role="status"`/`role="alert"` trong module này. | P1 |
| U-27 | Bộ đếm "Đang vắng: Lễ x, Giáo lý y" nằm trong `CardDescription` tĩnh (`:196-199`), thay đổi không được thông báo. Nên bọc `aria-live="polite"`. | P2 |
| U-28 | Nút "Lưu nháp"/"Hoàn tất" khi `disabled={pending}` không có `aria-busy` hay text trạng thái ("Đang lưu…"). | P2 |
| U-29 | Badge trạng thái (`success`/`secondary`/`warning`) truyền nghĩa **chỉ bằng màu + chữ**; chữ có nên đạt, nhưng `warning` cho "n vắng" (`attendance/page.tsx:131`) nên thêm `aria-label` đầy đủ "12 em vắng". | P3 |
| U-30 | Thanh sticky `bottom-4` có thể che nội dung cuối; cần `padding-bottom` tương ứng trên container để nội dung cuối không bị khuất khi zoom 200%. | P3 |

## 9. Ưu tiên tổng hợp

| Ưu tiên | Mã |
|---|---|
| **P1** | U-01, U-04, U-06, U-07, U-10, U-11, U-12, U-17, U-18, U-21, U-24, U-25, U-26 |
| **P2** | U-02, U-08, U-09, U-13, U-16, U-19, U-22, U-23, U-27, U-28 |
| **P3** | U-03, U-05, U-14, U-15, U-20, U-29, U-30 |

## 10. Không được đổi

- **Giữ** mặc định `present` và mô hình "chỉ sửa ngoại lệ" — đây là lý do luồng này nhanh.
- **Giữ** claim/lease/tiếp quản. Không rút gọn thành "ai vào cũng sửa được": mọi đề xuất giảm bước ở
  trên đều nằm ngoài đường tranh chấp editor.
- **Giữ** việc đơn xin nghỉ chỉ là gợi ý; U-13 chỉ đổi draft phía client.
- **Giữ** hai select độc lập Thánh lễ / Giáo lý — U-10 đổi *dạng control*, không gộp hai trạng thái.
