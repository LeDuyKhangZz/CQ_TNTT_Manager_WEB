# M10 — THÔNG BÁO · Đánh giá UI/UX

> **Giai đoạn 1 chỉ ĐÁNH GIÁ, không redesign.**
> Mức: **Nhỏ** · **Vừa** · **Lớn** (đi kèm To-Be nghiệp vụ).

---

## 1. Information Architecture

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| IA-1 | `/notifications` gộp **hai vai trò khác nhau** vào một trang: hộp thư cá nhân (mọi người) và bảng soạn thông báo (người có quyền công bố) | `notification-center.tsx` | **Vừa** |
| IA-2 | Chuông ở header là lối vào duy nhất — đúng và đủ, không cần thêm | `notification-button.tsx` | ✅ |
| IA-3 | Thông báo nằm ở nhóm "Chung" của thanh bên, hiện cho mọi vai trò | `src/config/navigation.ts` | ✅ |
| IA-4 | Không phân tách "hộp thư đến" với "thông báo tôi đã gửi" — người công bố không xem lại được mình đã gửi gì cho ai | — | **Vừa** |

## 2. Navigation

| # | Quan sát | Mức |
|---|---|---|
| NAV-1 | Đường dẫn kèm theo trong thông báo hoạt động tốt và chỉ trỏ tới route có thật (chặn ở cơ sở dữ liệu) | ✅ **điểm mạnh** |
| NAV-2 | Sau khi bấm vào thông báo và đi tới trang đích, không có đường quay lại hộp thư | **Nhỏ** |
| NAV-3 | Badge trên chuông là chỉ dấu điều hướng chính, nhưng hiện **sai số** với 6 vai trò quản lý ⇒ mất hoàn toàn giá trị điều hướng | **Lớn** (gắn sửa CRITICAL) |

## 3. Độ rõ của hành động

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| ACT-1 | Công bố thông báo là thao tác **không thể hoàn tác** nhưng **không có bước xác nhận** và không hiển thị trước "sẽ gửi tới bao nhiêu người" | `notification-center.tsx` | **Lớn** |
| ACT-2 | Bấm gửi hai lần tạo hai thông báo giống hệt nhau, không cảnh báo | (không có khóa chống trùng) | **Vừa** |
| ACT-3 | Nút "Đánh dấu đã đọc" hiển thị lỗi thật khi thất bại thay vì im lặng — **làm đúng**, có ghi chú giải thích lý do | `notification-center.tsx:79-83` | ✅ **mẫu tốt** |
| ACT-4 | "Đánh dấu tất cả đã đọc" không có xác nhận, nhưng hậu quả nhẹ và hồi phục được ⇒ chấp nhận được | — | ✅ |
| ACT-5 | Không có cách nào thu hồi hoặc đính chính thông báo gửi nhầm | — | **Vừa** (cần chốt nghiệp vụ trước) |

## 4. Form và luồng thao tác

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| FRM-1 | Bộ chọn phạm vi chỉ hiện phạm vi mà người dùng thực sự được phép — đúng nguyên tắc, tránh việc bấm rồi mới bị từ chối | `notification-center.tsx:33-40` | ✅ |
| FRM-2 | Phạm vi "một người" **không có** trong bộ chọn dù cơ sở dữ liệu hỗ trợ ⇒ chức năng nửa vời | `queries.ts:57-62` | **Lớn** |
| FRM-3 | Không có xem trước nội dung trước khi gửi | — | **Vừa** |
| FRM-4 | Không giới hạn/đếm ký tự cho tiêu đề và nội dung ở giao diện | — | **Nhỏ** |
| FRM-5 | Trường "đường dẫn kèm theo" là ô nhập tự do; người dùng phải tự biết route hợp lệ, sai thì bị cơ sở dữ liệu từ chối bằng lỗi kỹ thuật | `schemas.ts:21-23` | **Vừa** |

## 5. Trạng thái rỗng và trạng thái lỗi

| # | Quan sát | Mức |
|---|---|---|
| EMP-1 | Hộp thư rỗng có thông điệp, nhưng **không phân biệt** "chưa có thông báo nào" với "bạn chưa được gán vai trò nên chưa nằm trong danh sách nhận của bất kỳ thông báo nào" | **Vừa** |
| EMP-2 | Với 6 vai trò global-read, hộp thư **đầy dữ liệu của người khác** — trạng thái tệ hơn cả rỗng vì trông có vẻ đúng | **Lớn** (CRITICAL) |
| EMP-3 | Sau khi công bố, không có phản hồi "đã gửi tới N người"; gửi tới 0 người trông giống hệt gửi thành công | **Vừa** |

## 6. Responsive (360px và 1366px)

| # | Quan sát | Mức |
|---|---|---|
| RES-1 | Danh sách thông báo xếp dọc, không bảng ⇒ không tràn ngang ở 360px | ✅ |
| RES-2 | Badge trên chuông hiển thị tốt ở cả hai kích thước | ✅ |
| RES-3 | Với 6 vai trò global-read, danh sách hiện **một thông báo lặp lại hàng trăm lần** (mỗi người nhận một dòng) ⇒ trang dài vô nghĩa trên điện thoại | **Lớn** (hệ quả CRITICAL) |
| RES-4 | Khóa React `key={item.id}` bị **trùng lặp** khi cùng một thông báo xuất hiện nhiều dòng ⇒ hành vi hiển thị không xác định | `notification-center.tsx:175` | **Vừa** (tự hết sau khi sửa CRITICAL) |

## 7. Accessibility

| # | Quan sát | Mức |
|---|---|---|
| A11Y-1 | Chuông có nhãn mô tả cho trình đọc màn hình | ✅ |
| A11Y-2 | Số chưa đọc **không được thông báo bằng `aria-live`** khi thay đổi | **Nhỏ** |
| A11Y-3 | Phân biệt "đã đọc / chưa đọc" dựa vào **cả màu lẫn chữ**, không chỉ màu | ✅ |
| A11Y-4 | Thông điệp lỗi khi đánh dấu đã đọc thất bại có hiển thị ra giao diện | ✅ |
| A11Y-5 | Cỡ chữ nhỏ ở nhãn thời gian (`text-xs`) dưới ngưỡng 13px của `docs/06 §3` | **Nhỏ** |

---

## 8. Tổng hợp khuyến nghị theo mức

### Lớn — làm cùng To-Be nghiệp vụ
1. **Lọc hộp thư và badge theo người đang đăng nhập** (NAV-3, EMP-2, RES-3). *Đây là việc phải làm đầu tiên
   của cả module — và là sửa hai dòng.* Sau khi sửa, RES-4 và một phần EMP-1 tự hết.
2. Hiển thị số người nhận trước khi gửi + xác nhận (ACT-1).
3. Bộ chọn người nhận cho phạm vi "một người" (FRM-2).

### Vừa
4. Tách hộp thư đến khỏi bảng soạn thông báo (IA-1); thêm mục "Tôi đã gửi" (IA-4).
5. Chống bấm gửi hai lần (ACT-2).
6. Xem trước nội dung (FRM-3).
7. Chọn đường dẫn kèm theo từ danh sách thay vì gõ tay (FRM-5).
8. Phản hồi "đã gửi tới N người", cảnh báo khi N = 0 (EMP-3).
9. Phân biệt hộp thư rỗng vì chưa có thông báo với rỗng vì chưa có vai trò (EMP-1).
10. Cơ chế thu hồi/đính chính (ACT-5) — **chỉ sau khi user chốt nghiệp vụ**.

### Nhỏ
11. Đường quay lại hộp thư sau khi theo đường dẫn (NAV-2).
12. `aria-live` cho số chưa đọc (A11Y-2).
13. Đếm ký tự tiêu đề/nội dung (FRM-4).
14. Nâng cỡ chữ nhãn thời gian (A11Y-5).

## 9. Những điểm KHÔNG được đụng vào

| Điểm | Lý do |
|---|---|
| Bộ chọn phạm vi chỉ hiện phạm vi được phép | Đúng nguyên tắc; nhưng **không được** coi đây là phân quyền — RPC vẫn phải kiểm (và đang kiểm) |
| Đường dẫn kèm theo bị chặn ở cơ sở dữ liệu | Chống tạo liên kết chết; giữ nguyên cả hàng rào lẫn unit test canh đồng bộ |
| Nút đánh dấu đã đọc hiển thị lỗi thật | Có ghi chú giải thích chủ ý; là mẫu tốt cần nhân rộng, không được "dọn dẹp" |
| Thông báo là bản ghi bất biến | Nếu làm thu hồi, phải làm ở mức **hiển thị** (ẩn/đính chính), **không** xóa bản ghi |
| Không lên lịch, không gửi ra ngoài hệ thống | Quyết định D-50 |
