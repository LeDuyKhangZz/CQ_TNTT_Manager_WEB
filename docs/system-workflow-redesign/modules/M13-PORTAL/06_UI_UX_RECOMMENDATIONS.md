# M13 — CỔNG PHỤ HUYNH & THIẾU NHI · Đánh giá UI/UX

> **Giai đoạn 1 chỉ ĐÁNH GIÁ, không redesign.**
> Người dùng chính: **phụ huynh không rành công nghệ, dùng điện thoại 360px**. Chấm nghiêm theo chuẩn đó.
> Mức: **Nhỏ** · **Vừa** · **Lớn**.

---

## 1. Information Architecture

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| IA-1 | 🔴 **Cổng phụ huynh không có trang chủ.** `/parent` trả 404; `route-map.ts:36` khai `/parent` như một **tiền tố phân quyền**, không phải một trang | `route-map.ts:36`; không có `parent/page.tsx` | **Lớn** |
| IA-2 | 🔴 **Không có danh sách con.** Không tồn tại `parent/children/page.tsx` ⇒ phụ huynh không có nơi nào nhìn thấy các con của mình | — | **Lớn** |
| IA-3 | Trang chi tiết con (`/parent/children/[studentId]`) **đã xây đầy đủ và an toàn** nhưng **mồ côi** — không lối vào từ giao diện | `parent/children/[studentId]/page.tsx:8-33`; `navigation.ts:41-57` | **Lớn** |
| IA-4 | Đơn xin nghỉ là chức năng phụ huynh **duy nhất** có lối vào rõ ràng, và cũng là nơi **duy nhất** có bộ chọn con | `absence-requests/page.tsx:15` | ⚠️ bất đối xứng |
| IA-5 | `docs/06 §6` liệt kê 5 route `/student/*` và 3 route `/parent/*`; thực tế có **1 và 2** | `docs/06:125-136` | **Vừa** (cần chốt phạm vi) |
| IA-6 | `/dashboard` dùng chung cho nhân sự và phụ huynh | — | **Vừa** |

## 2. Navigation

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| NAV-1 | 🔴 Thanh dưới của phụ huynh: Trang chủ · Xin nghỉ · Kết quả · Thông báo · Tài khoản — **thiếu "Con của tôi"**, tức thiếu chính chức năng cốt lõi | `navigation.ts:84-90` | **Lớn** |
| NAV-2 | 🔴 Link duy nhất từ bảng tổng quan trỏ tới `/students/{id}` — route **chỉ dành cho nhân sự** ⇒ phụ huynh bấm vào bị đá sang trang từ chối truy cập | `dashboard-overview.tsx:63`; `route-map.ts:26` | **Lớn** |
| NAV-3 | `navigation.ts` chỉ hỗ trợ đường dẫn **tĩnh** ⇒ mọi trang có tham số động (như mã số em) đều có nguy cơ mồ côi. Đây là hạn chế **cấu trúc**, không phải sơ suất | `navigation.ts` toàn file | **Lớn** (ảnh hưởng cả M14) |
| NAV-4 | Thanh dưới của thiếu nhi có "Điểm danh của em" — **có lối vào đúng**. Bất đối xứng với phía phụ huynh | `navigation.ts:47,94` | ⚠️ |
| NAV-5 | Trang chi tiết con không có nút "Quay lại" | — | **Nhỏ** |
| NAV-6 | Tiêu đề đầu trang khi phụ huynh xem con vẫn là "Thiếu Nhi Chợ Quán", không phải tên con | — | **Nhỏ** |

## 3. Độ rõ của hành động

| # | Quan sát | Mức |
|---|---|---|
| ACT-1 | Portal thuần đọc ⇒ gần như không có nguy cơ thao tác nhầm. **Điểm mạnh thiết kế**, giữ nguyên | ✅ |
| ACT-2 | Nhưng vì thuần đọc mà lại thiếu lối vào, phụ huynh **không có hành động nào để làm** ngoài gửi đơn xin nghỉ | **Lớn** |
| ACT-3 | Cảnh báo chuyên cần viết bằng câu tiếng Việt đầy đủ (*"Vắng 3 buổi giáo lý liên tiếp."*) thay vì mã kỹ thuật | ✅ **mẫu tốt** |
| ACT-4 | Badge Lễ / Giáo lý phân biệt rõ ràng bằng **cả màu lẫn chữ** | ✅ |

## 4. Form và luồng thao tác

| # | Quan sát | Mức |
|---|---|---|
| FRM-1 | Không có form trong phạm vi audit này (đơn xin nghỉ thuộc M05) | — |
| FRM-2 | Với phụ huynh **một con**: lý tưởng là vào thẳng, không cần chọn. Với phụ huynh **nhiều con**: cần bộ chọn. Hiện tại **không có cái nào** | **Lớn** |

## 5. Trạng thái rỗng và trạng thái lỗi

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| EMP-1 | 🔴 **Trạng thái rỗng nói sai nguyên nhân.** Tài khoản phụ huynh chưa được liên kết với hồ sơ giám hộ thấy *"Chưa có kết quả nào được công bố."* — trong khi nguyên nhân thật là tài khoản chưa nối với con | `published-results-portal.tsx:9`; `portal/server/queries.ts:132` | **Vừa** |
| EMP-2 | Trang thiếu nhi **làm đúng** trạng thái rỗng: nói rõ nguyên nhân và việc cần làm tiếp | `student/attendance/page.tsx:19-21` | ✅ **mẫu chuẩn cho cả portal** |
| EMP-3 | Không phân biệt ba tình huống: *chưa có dữ liệu* / *tài khoản chưa liên kết* / *buổi chưa được chốt* | — | **Vừa** |
| EMP-4 | Lỗi hạ tầng (mất kết nối cơ sở dữ liệu) bị trình bày như "không tìm thấy" vì mã lỗi bị bỏ qua | — | **Vừa** |
| EMP-5 | Mở hồ sơ em không phải con mình trả 404 sạch, không lộ tên | `parent/children/[studentId]/page.tsx:14-17` | ✅ |

## 6. Responsive (360px)

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| RES-1 | Không tràn ngang ở 360px: lưới `grid-cols-2 sm:grid-cols-4`, thẻ buổi `flex-wrap` | `attendance-history.tsx:43,83` | ✅ |
| RES-2 | Bảng điểm bọc `overflow-x-auto` kèm chiều rộng tối thiểu ⇒ cuộn ngang trong khung, không đẩy cả trang | `published-results-portal.tsx:25-26` | ✅ |
| RES-3 | Thanh dưới cao tối thiểu 64px — đạt chuẩn vùng chạm | `navigation` | ✅ |
| RES-4 | Nhãn thanh dưới cỡ chữ 11px kèm cắt chữ ⇒ chữ bị cụt trên máy hẹp. Dưới ngưỡng 13px của `docs/06 §3` | — | **Nhỏ** |
| RES-5 | Nhiều nhãn dùng `text-xs`/`text-[11px]` — với phụ huynh lớn tuổi đây là rào cản thật | — | **Vừa** |

## 7. Accessibility

| # | Quan sát | Mức |
|---|---|---|
| A11Y-1 | Có `aria-current` cho mục đang mở, `aria-label` cho điều hướng, `aria-hidden` cho biểu tượng trang trí | ✅ |
| A11Y-2 | Bảng điểm **không có** `<caption>` và không đánh dấu ô tiêu đề ⇒ trình đọc màn hình không nói được "cột nào, dòng nào" | **Vừa** |
| A11Y-3 | Khối cảnh báo chuyên cần là danh sách màu vàng **không có** vai trò thông báo ⇒ trình đọc màn hình bỏ qua | **Vừa** |
| A11Y-4 | Trạng thái phân biệt bằng cả màu lẫn chữ — đạt | ✅ |
| A11Y-5 | Cỡ chữ nhỏ nhiều nơi (xem RES-5) | **Vừa** |
| A11Y-6 | Không có nút "Quay lại" ⇒ người dùng phụ thuộc nút back của trình duyệt | **Nhỏ** |

---

## 8. Tổng hợp khuyến nghị theo mức

### Lớn — chức năng không dùng được nếu không làm
1. 🔴 **Tạo lối vào cho trang xem con** (IA-3, NAV-1, ACT-2, FRM-2). Đây là việc quan trọng nhất
   của cả module. **Cần user chốt hình thức** — xem `08_ACCEPTANCE_CRITERIA.md`.
2. 🔴 **Sửa link bảng tổng quan** đang trỏ vào route chỉ dành cho nhân sự (NAV-2).
3. Bổ sung trang chủ cổng phụ huynh và/hoặc danh sách con (IA-1, IA-2).
4. Xử lý hạn chế "điều hướng chỉ hỗ trợ đường dẫn tĩnh" (NAV-3) — **vấn đề chung với M14**.

### Vừa
5. Sửa trạng thái rỗng để nói đúng nguyên nhân, lấy trang thiếu nhi làm mẫu (EMP-1, EMP-2, EMP-3).
6. Phân biệt lỗi hạ tầng với "không tìm thấy" (EMP-4).
7. Nâng cỡ chữ cho nhãn nhỏ (RES-5, A11Y-5) — nhóm người dùng chính là phụ huynh lớn tuổi.
8. Thêm chú thích cho bảng điểm và vai trò thông báo cho khối cảnh báo (A11Y-2, A11Y-3).
9. Chốt phạm vi các route `/student/*` còn thiếu so với đặc tả (IA-5).
10. Chú thích rõ trung bình đang tính trên bao nhiêu cột đã công bố (liên quan M07).

### Nhỏ
11. Nút "Quay lại" ở trang chi tiết con (NAV-5, A11Y-6).
12. Đặt tên con làm tiêu đề trang thay vì tên hệ thống (NAV-6).
13. Nới cỡ chữ nhãn thanh dưới để không bị cắt (RES-4).

## 9. Những điểm KHÔNG được đụng vào

| Điểm | Lý do |
|---|---|
| Trả **404** thay vì 403 khi mở hồ sơ em không phải con mình | Không xác nhận cho người lạ biết hồ sơ có tồn tại; có ghi chú giải thích chủ ý trong mã |
| Lọc **hai tầng** cho dữ liệu chưa chốt/chưa công bố | Phòng thủ theo chiều sâu; sửa "cho gọn" là bỏ mất một lớp bảo vệ |
| Top 5 dùng tên đã chụp lại thay vì đọc bảng hồ sơ | Cô lập ngoại lệ mà không mở quyền đọc |
| Thành phần lịch sử điểm danh dùng chung cho phụ huynh và thiếu nhi | Một nguồn hiển thị, không có hai phiên bản lệch nhau |
| `/parent` **không** giới hạn vai trò | Chủ ý theo D-25 — Giáo lý viên cũng có thể là phụ huynh |
| Portal thuần đọc, phụ huynh không sửa hồ sơ | Quyết định D-46 |
| Cảnh báo chuyên cần viết thành câu tiếng Việt đầy đủ | Mẫu tốt, nên nhân rộng chứ không rút gọn |
