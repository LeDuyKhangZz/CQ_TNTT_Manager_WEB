# M09 — BAN & THIẾT BỊ · 08. ACCEPTANCE CRITERIA

Định dạng Given/When/Then. Nhóm **§4 Test bảo mật bắt buộc xanh** là điều kiện chặn merge.

---

## 1. Ban và chức vụ

### AC-M09-01 — Tạo Ban (happy path)
- **Given** tôi đăng nhập bằng vai trò global-write (`secretary`)
- **When** tôi mở `/committees`, bấm "Thêm Ban mới", nhập mã `TRUYEN_THONG_2`, tên "Ban Truyền thông 2"
- **Then** Ban mới xuất hiện trong grid, thông báo "Đã thêm Ban mới." hiện ra, form đóng lại

### AC-M09-02 — Mã Ban trùng
- **Given** đã tồn tại Ban mã `KY_THUAT`
- **When** tôi tạo Ban mã `ky_thuat` (chữ thường)
- **Then** hệ thống từ chối với thông điệp "Dữ liệu này đã tồn tại." (do `citext unique`), **không** tạo Ban thứ hai

### AC-M09-03 — Mã Ban sai định dạng
- **When** tôi nhập mã `Ban KT!`
- **Then** hệ thống từ chối với thông điệp chỉ rõ lỗi ở trường "Mã Ban"
  *(hiện tại: trả "Không thể xử lý yêu cầu. Vui lòng thử lại." — **chưa đạt**, xem TB liên quan §3 của `06_UI_UX_RECOMMENDATIONS.md`)*

### AC-M09-04 — Giới hạn hai Ban
- **Given** anh A đang là thành viên hoạt động của Ban Sinh hoạt và Ban Kỹ thuật
- **When** tôi thêm anh A vào Ban Phụng vụ
- **Then** hệ thống từ chối với "Mỗi nhân sự chỉ tham gia tối đa hai Ban đang hoạt động."
- **And** trong dropdown chọn nhân sự, anh A hiển thị kèm "— đã đủ hai Ban" và **không chọn được**

### AC-M09-05 — Giải phóng slot rồi thêm lại
- **Given** anh A đang ở 2 Ban
- **When** tôi bấm "Kết thúc" nhiệm kỳ của anh A ở Ban Kỹ thuật, rồi thêm anh A vào Ban Phụng vụ
- **Then** thao tác thành công
- **And** dòng chức vụ cũ ở Ban Kỹ thuật vẫn còn trong DB với `is_active=false` và `ends_on` không null

### AC-M09-06 — Kết thúc nhiệm kỳ đầu ngày (UTC edge)
- **Given** giờ hệ thống là 06:00 sáng giờ Việt Nam (23:00 UTC hôm trước)
- **And** anh A vừa được thêm vào Ban trong cùng ngày
- **When** tôi bấm "Kết thúc"
- **Then** thao tác **thành công** và `ends_on = starts_on`
  *(hiện tại: `ends_on` lấy ngày UTC nên có thể nhỏ hơn `starts_on` → lỗi `23514`. **Chưa đạt**, xem TB-M09-05)*

### AC-M09-07 — Đổi chức vụ thất bại phải khôi phục UI
- **Given** tôi đang xem danh sách nhân sự Ban
- **When** tôi đổi chức vụ một người mà server trả lỗi
- **Then** ô chọn quay lại chức vụ cũ và hiện thông điệp lỗi
  *(hiện tại: ô chọn giữ giá trị mới → **chưa đạt**)*

### AC-M09-08 — Xác nhận trước khi kết thúc nhiệm kỳ
- **When** tôi bấm "Kết thúc nhiệm kỳ"
- **Then** hệ thống hỏi xác nhận nêu tên người và tên Ban trước khi thực hiện
  *(hiện tại: thực hiện ngay → **chưa đạt**)*

## 2. Nội dung Ban

### AC-M09-09 — Trưởng ban đăng thông báo
- **Given** tôi là Trưởng Ban Sinh hoạt
- **When** tôi đăng thông báo tiêu đề "Họp Trung Thu"
- **Then** bài xuất hiện đầu feed với tên tôi và thời điểm đăng
- **And** trong DB, `author_staff_id` là hồ sơ nhân sự **của tôi**, bất kể client gửi gì

### AC-M09-10 — Thành viên thường không đăng được
- **Given** tôi là thành viên thường Ban Sinh hoạt
- **Then** tôi **không thấy** form đăng thông báo
- **And** nếu gọi thẳng server action, DB trả `42501` → UI hiện "Bạn không có quyền thực hiện thao tác này."

### AC-M09-11 — Trưởng ban không đăng sang Ban khác
- **Given** tôi là Trưởng Ban Sinh hoạt và **thành viên thường** Ban Kỹ thuật
- **When** tôi gọi action đăng thông báo với `committeeId` của Ban Kỹ thuật
- **Then** DB từ chối `42501`

### AC-M09-12 — Công việc tuần: mốc thứ Hai
- **When** tôi chọn tuần bắt đầu là thứ Ba
- **Then** hệ thống từ chối, nêu rõ "Tuần phải bắt đầu từ thứ Hai."

### AC-M09-13 — Công việc tuần: không mất dữ liệu ⚠️
- **Given** Ban đã có bản công việc cho tuần 2026-10-05 với nội dung "Chuẩn bị Trung Thu" và 2 mục checklist
- **When** tôi (một Phó ban khác) mở trang, tuần mặc định là 2026-10-05
- **Then** form **nạp sẵn** nội dung và checklist hiện có, nút ghi "Cập nhật công việc tuần", có dòng ghi tác giả và thời điểm bản hiện tại
- **And When** tôi bấm lưu mà không sửa gì → nội dung không đổi
- **And When** người khác vừa cập nhật bản này từ lúc tôi mở form → hệ thống từ chối và mời tải lại, **không ghi đè**
  *(hiện tại: form trống, lưu là mất hết → **CHƯA ĐẠT — đây là tiêu chí chặn**)*

### AC-M09-14 — Công việc tuần: không tạo bản trắng
- **When** tôi lưu công việc tuần với nội dung rỗng và checklist rỗng
- **Then** hệ thống từ chối, nêu "Vui lòng nhập nội dung hoặc ít nhất một việc trong checklist."
  *(hiện tại: tạo được bản trắng → **chưa đạt**)*

### AC-M09-15 — Xoá nội dung có xác nhận
- **When** tôi bấm "Xóa" trên một thông báo/lịch họp/công việc tuần
- **Then** hệ thống hỏi xác nhận nêu tiêu đề bị xoá; chỉ khi tôi xác nhận thì mới xoá
  *(hiện tại: xoá ngay → **chưa đạt**)*

### AC-M09-16 — Phó ban xoá được bài của Trưởng ban
- **Given** tôi là Phó Ban Sinh hoạt, bài do Trưởng ban đăng
- **When** tôi xoá bài đó
- **Then** thao tác **thành công** (đúng `docs/03 WF-12`) ✅ *(đã đạt)*

## 3. Kho thiết bị

### AC-M09-17 — Chỉ Ban giữ kho mới có thiết bị
- **When** tôi cố tạo thiết bị gắn vào Ban Y tế
- **Then** hệ thống từ chối "Chỉ Ban Kỹ thuật mới quản lý kho thiết bị."

### AC-M09-18 — Mượn happy path
- **Given** "Loa kéo" có 3/3 khả dụng
- **When** tôi (thành viên Ban KT) cho mượn 2 cái cho anh B
- **Then** card hiện "Khả dụng 1/3", một phiếu xuất hiện ở mục "Đang mượn" ghi rõ anh B, thời điểm, người bàn giao là **tôi**

### AC-M09-19 — Mượn quá tồn kho
- **When** tôi cho mượn 5 cái trong khi chỉ còn 1
- **Then** hệ thống từ chối "Số lượng khả dụng không đủ để mượn." và tồn kho **không đổi**

### AC-M09-20 — Mượn số lượng 0 hoặc âm
- **When** tôi gửi số lượng `0` hoặc `-1` (kể cả gọi thẳng RPC)
- **Then** hệ thống từ chối "Số lượng mượn phải lớn hơn 0."

### AC-M09-21 — Hai người cùng mượn cái cuối cùng
- **Given** "Loa kéo" còn đúng 1 cái khả dụng
- **When** hai phiên đồng thời gọi `borrow_equipment(item, 1, …)`
- **Then** đúng **một** phiếu được tạo; phiên còn lại nhận `EQUIPMENT_NOT_ENOUGH`
- **And** `available_quantity` cuối cùng là `0`, không âm

### AC-M09-22 — Trả đủ
- **Given** phiếu mượn 2 cái
- **When** tôi ghi nhận trả 2/2
- **Then** `available` cộng lại 2, `total` không đổi, phiếu chuyển sang "Đã trả", `received_by` là tôi

### AC-M09-23 — Trả lần hai idempotent
- **When** tôi gọi `return_equipment` lần thứ hai trên cùng phiếu
- **Then** không lỗi, và `available_quantity` **không** tăng thêm

### AC-M09-24 — Người ngoài Ban gọi `return_equipment` trên phiếu đã trả
- **Then** nhận `42501` (kiểm quyền chạy **trước** nhánh idempotent) — không suy ra được phiếu tồn tại hay không ✅ *(đã đạt)*

### AC-M09-25 — Trả một phần (trả dần) ⚠️
- **Given** phiếu mượn 5 cái, hôm nay chỉ mang về 3
- **When** tôi bấm "Nhận lại hàng" với số 3
- **Then** `available += 3`, `total` **không đổi**, phiếu **vẫn mở** với "còn nợ 2"
  *(hiện tại: phiếu đóng luôn và `total -= 2` → **CHƯA ĐẠT — tiêu chí chặn**)*

### AC-M09-26 — Báo hỏng/mất ⚠️
- **When** tôi bấm "Báo hỏng/mất" 2 cái với tình trạng "Mất" và ghi chú bắt buộc
- **Then** hệ thống hiện hộp xác nhận nêu rõ "Tổng kho giảm từ 5 xuống 3. Thao tác không hoàn tác được."
- **And** sau khi xác nhận, `total -= 2`, `available` không đổi, phiếu ghi nhận sự kiện
  *(hiện tại: không có hộp xác nhận, không có nút riêng → **chưa đạt**)*

### AC-M09-27 — `available_quantity` không sửa tay được
- **When** tôi (Trưởng Ban KT) gửi thẳng `PATCH /rest/v1/equipment_items?id=eq.<id>` với `available_quantity: 99`
- **Then** DB từ chối với `EQUIPMENT_AVAILABLE_READONLY` ✅ *(đã đạt — `021:56-59`)*

### AC-M09-28 — `total_quantity` cũng không sửa tay được ⚠️
- **When** tôi gửi thẳng `PATCH … {"total_quantity": 9999}`
- **Then** DB phải từ chối
  *(hiện tại: **thành công** → **CHƯA ĐẠT — tiêu chí chặn**)*

### AC-M09-29 — Nhập thêm tồn kho
- **When** tôi (Trưởng Ban KT) bấm "Nhập thêm" 5 cái với lý do "Mua mới"
- **Then** `total += 5`, `available += 5`, một dòng audit được ghi kèm người thực hiện và lý do
  *(hiện tại: không có luồng → **chưa đạt**)*

### AC-M09-30 — Cho GLV ngoài Ban Kỹ thuật mượn
- **Given** anh C là GLV lớp Ấu 1A, không thuộc Ban Kỹ thuật
- **When** tôi cho anh C mượn 1 loa
- **Then** anh C xuất hiện được trong danh sách "Người mượn" và phiếu ghi đúng tên anh C
  *(hiện tại: danh sách chỉ có thành viên Ban KT → **chưa đạt**)*

## 4. Test bảo mật bắt buộc xanh

> Tất cả phải chạy bằng **JWT vai trò thật**, không dùng service role (`CLAUDE.md §4`).

| # | Kịch bản | Kỳ vọng | Trạng thái hiện tại |
|---|---|---|---|
| SEC-M09-01 | Người ngoài Ban mở `/committees/<id>` bằng URL trực tiếp | 404, **không** rò tiêu đề thông báo/lịch họp/công việc tuần | 🟢 `e2e committees.spec.ts:200-204` |
| SEC-M09-02 | Người ngoài Ban `select` trực tiếp 4 bảng nội dung Ban | 0 dòng | 🟢 `020:129-137` |
| SEC-M09-03 | GLV thường tự thêm mình vào Ban | `42501` | 🟢 `020:55-59` |
| SEC-M09-04 | Thành viên thường đăng thông báo Ban mình | `42501` | 🟢 `020:90-94` |
| SEC-M09-05 | Trưởng Ban A đăng nội dung sang Ban B | `42501` | 🟢 `020:117-120` |
| SEC-M09-06 | Vượt giới hạn 2 Ban ngay ở DB (không phải chỉ ẩn nút) | `23514 COMMITTEE_LIMIT_EXCEEDED` | 🟢 `020:72-75` |
| SEC-M09-07 | Client gửi `created_by`/`author_staff_id` giả | Trigger ghi đè bằng `auth.uid()` | 🟢 `020:101-104` |
| SEC-M09-08 | INSERT thẳng vào `equipment_loans` | `42501` | 🟢 `021:66-69` |
| SEC-M09-09 | Ngoài Ban Kỹ thuật gọi `borrow_equipment` | `42501 FORBIDDEN` | 🟢 `021:74-76` |
| SEC-M09-10 | Ban khác đọc `equipment_items` | 0 dòng | 🟢 `021:72-73` |
| SEC-M09-11 | Sửa tay `available_quantity` | `23514 EQUIPMENT_AVAILABLE_READONLY` | 🟢 `021:56-59` |
| SEC-M09-12 | **Sửa tay `total_quantity`** | phải `23514` | 🔴 **CHƯA CÓ TEST, HIỆN TẠI THÀNH CÔNG** |
| SEC-M09-13 | **INSERT `equipment_items` với `available <> total`** | phải bị chặn | 🔴 **CHƯA CÓ TEST, hiện tại thành công** |
| SEC-M09-14 | **Hai session cùng mượn cái cuối cùng** | đúng 1 phiếu, `available = 0` | 🟠 **CHƯA CÓ TEST** (lập luận đúng nhưng chưa chứng minh) |
| SEC-M09-15 | Thành viên thường tạo/sửa danh mục thiết bị | `42501` | 🟢 `021:43-46` |
| SEC-M09-16 | `guardian`/`student` mở `/committees` | redirect `/access-denied` | 🟠 **CHƯA CÓ TEST riêng** (có `route-map` + `tests/unit/permissions.test.ts` — cần xác nhận độ phủ) |
| SEC-M09-17 | `guardian` gọi thẳng server action `createCommittee` | bị từ chối | 🟠 **CHƯA CÓ TEST**; hiện chỉ RLS chặn, action không kiểm route (BR-M09-62) |
| SEC-M09-18 | UUID sai định dạng trên `/committees/<x>` | 404, không phải 500 | 🟠 code có guard (`[committeeId]/page.tsx:19`), **chưa có test** |

**Điều kiện merge**: SEC-M09-01..11 và 15 phải xanh (đã xanh); SEC-M09-12, 13, 14 phải được **bổ sung**
và xanh trước khi đóng bất kỳ To-Be nào liên quan tới kho thiết bị.

## 5. Câu hỏi NEEDS_CONFIRMATION

| # | Câu hỏi | Vì sao cần trả lời |
|---|---|---|
| Q-M09-01 | Có cố ý **không** làm luồng sửa/ngưng Ban không? Policy `committees_update_global_write` đang bỏ không. | Nếu là thiếu sót → TB-M09-06; nếu cố ý → nên xoá policy để không tạo bề mặt tấn công vô chủ |
| Q-M09-02 | Có cố ý **không** làm luồng sửa thông báo/lịch họp không? `docs/03 WF-12` ghi "tạo/sửa/xóa" nhưng chỉ có tạo/xóa. | Như trên |
| Q-M09-03 | "Trả một phần" nên hiểu là **trả dần** (còn nợ) hay **luôn là hỏng/mất**? | Quyết định giữa TB-M09-02 PA A và PA B |
| Q-M09-04 | `condition` nên gắn cho **cả dòng thiết bị** hay cho từng lần trả? Test `021:148-150` đang khoá hành vi hiện tại. | Nếu đổi, phải sửa test đã xanh |
| Q-M09-05 | GLV **ngoài** Ban Kỹ thuật có được ghi làm người mượn không? DB cho, UI không cho. | Quyết định `borrowerOptions` |
| Q-M09-06 | Một Ban có được có **hai Trưởng ban** không? Hiện không có ràng buộc nào. | Nếu không → cần unique partial index |
| Q-M09-07 | Có nên nâng quyền "báo hỏng/mất" lên Trưởng/Phó Ban (thay vì mọi thành viên như hiện nay)? | Thao tác này giảm tài sản vĩnh viễn |
| Q-M09-08 | Xoá nội dung Ban có cần audit trail (ai xoá, lúc nào) không? | Hiện là hard delete, không dấu vết |
| Q-M09-09 | Có chấp nhận việc mọi server action của M09 chỉ dùng `requireAuthContext` (không kiểm route role) không? | Ảnh hưởng toàn module; là quyết định kiến trúc chứ không phải bug cục bộ |
| Q-M09-10 | Module M11 (Reports/Dashboard) có đọc `equipment_items.total_quantity` không? | Quyết định phạm vi hồi quy của TB-M09-02 |
