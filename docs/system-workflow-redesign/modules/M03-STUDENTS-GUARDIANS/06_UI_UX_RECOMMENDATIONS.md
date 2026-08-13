# M03 — STUDENTS & GUARDIANS · Đánh giá UI/UX

> **Giai đoạn 1 chỉ ĐÁNH GIÁ, không redesign.** Không có mã CSS/component mới trong tài liệu này.
> Mức: **Nhỏ** (chỉnh trình bày) · **Vừa** (thêm thành phần, không đổi nghiệp vụ) · **Lớn** (đi kèm To-Be nghiệp vụ).

---

## 1. Information Architecture

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| IA-1 | `/students` gộp **ba việc khác nhau** vào một trang: danh sách ~900 em, form tạo giám hộ, form tạo thiếu nhi. Hai form luôn hiện, đẩy danh sách xuống dưới | `students/page.tsx:22-167` | **Vừa** |
| IA-2 | Người giám hộ **không có nơi cư trú riêng** trong IA: không route, không mục menu, không màn hình xem/sửa — dù là thực thể có tài khoản đăng nhập và nhiều con | `src/config/navigation.ts:41-57`; `src/features/guardians/` chỉ có `schemas.ts` + `actions.ts` | **Lớn** (gắn TB-F12) |
| IA-3 | Ghi danh nằm ở **trang lớp** (`/classes/[classId]`) chứ không ở trang em — trong khi WF-03 mô tả một luồng liền từ hồ sơ đến lớp | `classes/[classId]/page.tsx`; `docs/03:86-97` | **Lớn** (gắn TB-F02/F09) |
| IA-4 | 4 tab của trang chi tiết dùng `?tab=` — đúng hướng (chia sẻ được URL, hoạt động không cần JS) | `[studentId]/page.tsx:48-50,65-66` | ✅ giữ nguyên |
| IA-5 | Không có "đường quay lại" nổi bật từ chi tiết về danh sách đã lọc; quay lại là mất bộ lọc (khi có bộ lọc) | — | **Nhỏ** |

## 2. Navigation

| # | Quan sát | Mức |
|---|---|---|
| NAV-1 | Từ trang lớp không có link tới hồ sơ em; từ hồ sơ em không có link tới lớp hiện tại. Hai màn hình liên quan chặt chẽ nhưng không nối nhau | **Vừa** |
| NAV-2 | Sau khi tạo hồ sơ xong, người dùng bị bỏ lại tại `/students` mà không biết hồ sơ đã tạo ở đâu — không điều hướng, không thông báo | **Vừa** (gắn TB-F14) |
| NAV-3 | Link "← Danh sách thiếu nhi" ở trang chi tiết là link chữ cỡ ~20px, **dưới ngưỡng chạm 44px** | **Nhỏ** |

## 3. Độ rõ của hành động

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| ACT-1 | **Nghiêm trọng nhất:** mọi nút lưu đều không phản hồi. Thành công, lỗi dữ liệu, bị từ chối quyền — cả ba đều cho ra cùng một hiện tượng: trang tải lại, không có gì thay đổi trên màn hình | `students/server/actions.ts:141-194`; `guardians/server/actions.ts:72-79`; `enrollments/server/actions.ts:86-101` | **Lớn** (TB-F14) |
| ACT-2 | Nút "Kết thúc" ghi danh nằm ngay cạnh tên từng em trong roster, **không có bước xác nhận**. Đây là thao tác đóng ghi danh của một đứa trẻ | `classes/[classId]/page.tsx:57` | **Vừa** |
| ACT-3 | Trường "Trạng thái hồ sơ" (lưu trữ/rút — thao tác nghiệp vụ nặng) nằm chung một nút "Lưu thay đổi" với các trường thông tin thường như địa chỉ | `[studentId]/page.tsx:186-192` | **Vừa** (TB-F06) |
| ACT-4 | Lựa chọn "Tạm nghỉ" hiện trong menu nhưng **không bao giờ hoạt động** — người dùng bấm mãi không có kết quả và không có lời giải thích | `enrollments/schemas.ts:19-25` | **Lớn** (TB-F10) |
| ACT-5 | Không có nút sửa cho bản ghi bí tích đã nhập; nhập sai một lần là vĩnh viễn | `[studentId]/page.tsx:243-313` | **Vừa** (TB-F08) |

## 4. Form và luồng thao tác

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| FRM-1 | Ô nhập ghi chú/sức khỏe **không có `maxLength`** khớp giới hạn 1000 ký tự của Zod ⇒ người dùng gõ dài rồi mất trắng khi lưu | `[studentId]/page.tsx:322-350`; `students/schemas.ts:48-54` | **Nhỏ** |
| FRM-2 | Chọn người giám hộ là một `<select>` chứa **toàn bộ** danh sách, không tìm kiếm được; với dữ liệu trùng (BR-M03-11) danh sách có nhiều dòng giống hệt nhau | `students/page.tsx` | **Vừa** |
| FRM-3 | Chọn thiếu nhi để ghi danh cũng là `<select>` toàn bộ em chưa ghi danh, không tìm kiếm | `classes/[classId]/page.tsx`; `classes/server/queries.ts:162-173` | **Vừa** |
| FRM-4 | Form không giữ lại dữ liệu đã nhập khi có lỗi ⇒ nhập lại từ đầu | — | **Vừa** (đi cùng TB-F14) |
| FRM-5 | Toàn bộ form dùng `<form action={serverAction}>` không cần JavaScript — **điểm mạnh thật sự**, giữ nguyên | `[studentId]/page.tsx` toàn file | ✅ |
| FRM-6 | Không có cảnh báo trùng tại thời điểm nhập — người dùng chỉ phát hiện khi đã tạo xong hồ sơ thứ hai | `students/server/actions.ts:34-52` | **Lớn** (TB-F13) |

## 5. Trạng thái rỗng và trạng thái lỗi

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| EMP-1 | Empty state của danh sách dùng đúng ngôn ngữ phạm vi: *"…trong phạm vi của bạn"* — cách diễn đạt tốt, nên nhân rộng ra module khác | `students/page.tsx:36` | ✅ **mẫu tốt** |
| EMP-2 | Nhưng vẫn **không phân biệt** "chưa có em nào" với "bạn không được xem em nào". Thủ quỹ thấy y hệt như một lớp thật sự rỗng | `route-map.ts:26` + RLS | **Vừa** (vấn đề toàn hệ thống) |
| EMP-3 | Mở `?tab=health` khi không có quyền → **trang trống hoàn toàn**, không tiêu đề, không giải thích | `[studentId]/page.tsx:243,315` | **Nhỏ** |
| EMP-4 | Không dùng `EmptyState` component có sẵn; tự viết `<p>` | `src/components/shared/empty-state.tsx` (0 nơi dùng) | **Nhỏ** |
| EMP-5 | UUID không hợp lệ → 404 đúng chuẩn, không phải 500 | `[studentId]/page.tsx:52-61` | ✅ |

## 6. Responsive (360px và 1366px)

| # | Quan sát | Mức |
|---|---|---|
| RES-1 | Danh sách dùng **card `flex-wrap`** thay vì bảng ⇒ không tràn ngang trên 360px. Lựa chọn đúng | ✅ |
| RES-2 | **Nhưng** ~900 card đổ một lần, không phân trang: trên điện thoại đây là màn hình cuộn vô tận, không dùng được. Đây là vấn đề **hiệu năng cảm nhận**, không phải layout | **Lớn** (TB-F03) |
| RES-3 | Trang chi tiết 4 tab hiển thị tốt ở cả hai kích thước; tab nằm trên một hàng cuộn ngang khi hẹp | ✅ |
| RES-4 | Roster trong trang lớp có `overflow-x-auto` | ✅ |
| RES-5 | Có E2E quét 3 viewport cho `/students` và `/students/[id]` | ✅ `tests/e2e/responsive.spec.ts` |

## 7. Accessibility

| # | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| A11Y-1 | Nhãn form liên kết đúng `htmlFor`/`id` xuyên suốt | `[studentId]/page.tsx` | ✅ |
| A11Y-2 | **Không có vùng thông báo `aria-live`** cho kết quả thao tác — hệ quả trực tiếp của ACT-1: người dùng đọc màn hình không nhận được bất kỳ tín hiệu nào sau khi bấm lưu | — | **Lớn** (đi cùng TB-F14) |
| A11Y-3 | Nút chạm ≥44px ở các nút chính (`Button` đã chuẩn hóa ở Phase 7) | `src/components/ui/button.tsx` | ✅ |
| A11Y-4 | Link điều hướng trong nội dung (`← Danh sách`) dưới 44px và **lọt lưới kiểm tra E2E** vì selector chỉ quét `nav a`/`header a`/`button` | `tests/e2e/responsive.spec.ts` | **Nhỏ** |
| A11Y-5 | Thứ bậc tiêu đề sai: `CardTitle` cứng `h2` trùng cấp với `PageHeader` `h2` | `src/components/ui/card.tsx:18` | **Nhỏ** (vấn đề toàn hệ thống) |
| A11Y-6 | Ngày hiển thị đúng `dd/MM/yyyy` tiếng Việt | `formatDateVi` | ✅ |

---

## 8. Tổng hợp khuyến nghị theo mức

### Lớn — chỉ làm cùng với To-Be nghiệp vụ tương ứng
1. Kênh phản hồi cho mọi thao tác ghi (ACT-1, A11Y-2) → **TB-F14**. *Đây là việc đáng làm đầu tiên của cả module.*
2. Cảnh báo trùng khi nhập hồ sơ (FRM-6) → **TB-F13**.
3. Sửa lựa chọn "Tạm nghỉ" (ACT-4) → **TB-F10**.
4. Tìm kiếm/lọc/phân trang danh sách (RES-2) → **TB-F03**.
5. Nơi cư trú cho người giám hộ (IA-2) → **TB-F12**.
6. Nối liền tạo hồ sơ → ghi danh (IA-3) → **TB-F02/F09**.

### Vừa — cải thiện rõ rệt, không đổi nghiệp vụ
7. Xác nhận trước khi kết thúc ghi danh (ACT-2).
8. Tách khối trạng thái hồ sơ khỏi form thông tin (ACT-3).
9. Cho phép sửa bản ghi bí tích (ACT-5).
10. Ô chọn giám hộ / chọn em có tìm kiếm (FRM-2, FRM-3).
11. Link chéo lớp ↔ hồ sơ em (NAV-1).
12. Phân biệt "rỗng" với "không có quyền" (EMP-2).

### Nhỏ — chỉnh trình bày
13. `maxLength` cho ô ghi chú/sức khỏe (FRM-1).
14. Thông báo thay cho trang trống ở tab không có quyền (EMP-3).
15. Dùng `EmptyState` có sẵn (EMP-4).
16. Nâng vùng chạm cho link quay lại (NAV-3, A11Y-4).
17. Sửa thứ bậc tiêu đề (A11Y-5).

## 9. Những điểm KHÔNG được đụng vào

| Điểm | Lý do |
|---|---|
| Form không cần JavaScript (`<form action={...}>`) | Là lựa chọn kiến trúc nhất quán của repo; chạy được trên điện thoại yếu, mạng kém của phòng học |
| Danh sách dùng card thay vì bảng | Đã được cân nhắc cho 360px; đổi sang bảng là bước lùi |
| Không hiển thị mã thiếu nhi ở danh sách | Quy tắc chốt (`AGENTS.md` §8) |
| Không hiển thị đề xuất chuyển lớp ở trang chi tiết | Quyết định D-42 |
| Ẩn tab sức khỏe/bí tích với phụ huynh, thiếu nhi, thủ quỹ | Đúng quy định bảo mật; RLS cũng chặn ở tầng dưới |
