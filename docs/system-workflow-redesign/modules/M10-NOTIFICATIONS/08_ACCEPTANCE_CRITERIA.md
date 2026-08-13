# M10 — THÔNG BÁO · Tiêu chí nghiệm thu

> **F04, F05, F07 (PASS) và F02 (PASS) giữ nguyên** — tiêu chí của chúng là "hành vi không đổi",
> bảo vệ bằng pgTAP `022` đang xanh.

---

## 1. Hạng mục 1 — Lọc hộp thư và badge theo người đăng nhập 🔴 *ưu tiên tuyệt đối*

### AC-01-01 · Hộp thư chỉ chứa thông báo của mình
**Given** Thư ký (có quyền đọc toàn cục) và một thông báo gửi riêng cho Giáo lý viên A
**When** Thư ký mở `/notifications`
**Then** **không** thấy thông báo riêng của A
**And** chỉ thấy những thông báo mà chính Thư ký nằm trong danh sách nhận.

### AC-01-02 · Một thông báo xuất hiện đúng một lần
**Given** một thông báo "Toàn hệ thống" gửi tới 300 tài khoản
**When** bất kỳ ai trong 300 người đó mở hộp thư
**Then** thông báo hiện **đúng một dòng**, không lặp lại 300 lần.

### AC-01-03 · Badge đếm đúng số của mình
**Given** Xứ đoàn trưởng có 3 thông báo chưa đọc, toàn hệ thống có 500 dòng chưa đọc
**When** xem chuông ở đầu trang
**Then** badge hiện **3**, không phải 500 hay "99+".

### AC-01-04 · Badge về 0 được
**Given** Thư ký đã đọc hết thông báo của mình
**When** làm mới trang
**Then** badge biến mất.

### AC-01-05 · `read_at` hiển thị là của chính mình
**Given** người khác đã đọc thông báo chung, mình chưa đọc
**When** mở hộp thư
**Then** thông báo vẫn hiện nhãn "Mới" với mình.

### AC-01-06 · Bấm đánh dấu đã đọc có tác dụng thật
**Given** Thư ký bấm "Đánh dấu đã đọc" trên một thông báo
**When** làm mới trang
**Then** thông báo **không còn** nhãn "Mới" *(hiện tại nút này bấm mãi không có tác dụng)*.

### AC-01-07 · Vai trò không có quyền rộng không bị ảnh hưởng
**Given** phụ huynh, thiếu nhi, Giáo lý viên lớp
**When** mở hộp thư sau khi sửa
**Then** hành vi **giống hệt** trước khi sửa.

### Test bắt buộc xanh
- 🔴 **pgTAP/Integration mới:** chạy bằng phiên của vai **có quyền đọc toàn cục** (Thư ký hoặc
  Xứ đoàn trưởng). Đây là ca chưa từng được kiểm và là gốc rễ của lỗi — pgTAP hiện chỉ dùng phiên
  phụ huynh (`022:186-200`).
- E2E mới: đăng nhập Thư ký, kiểm số trên chuông khớp số thông báo thật của tài khoản đó.

---

## 2. Hạng mục 2 & 5 — Báo số người nhận, sửa nhánh gửi đích danh

### AC-02-01 · Biết thông báo tới được bao nhiêu người
**Given** Trưởng ngành công bố thông báo cho ngành mình
**When** gửi thành công
**Then** thấy phản hồi *"Đã gửi tới N người"* với N là số thật.

### AC-02-02 · Cảnh báo khi không tới ai ⚠️
**Given** công bố tới một phạm vi hiện chưa có ai
**When** gửi
**Then** hiện cảnh báo rõ *"Thông báo chưa tới người nhận nào"*
**And** **không** hiển thị như một lần gửi thành công bình thường.

### AC-05-01 · Gửi đích danh không phụ thuộc phân công vai trò
**Given** một tài khoản đã kích hoạt nhưng **chưa** được gán vai trò
**When** Super Admin gửi thông báo đích danh cho tài khoản đó
**Then** người đó **nhận được** thông báo
*(hiện tại: không bao giờ nhận, và người gửi không biết)*.

---

## 3. Hạng mục 3, 4, 6, 7 — tiêu chí rút gọn

| Mã | Given / When / Then | Điều kiện |
|---|---|---|
| AC-03-01 | **Given** người dùng bấm "Gửi" hai lần liên tiếp · **When** cả hai yêu cầu tới máy chủ · **Then** chỉ **một** thông báo được tạo | ⛔ chờ chốt Q-1 (khóa chống trùng) |
| AC-04-01 | **Given** Super Admin muốn nhắn riêng một Giáo lý viên · **When** chọn phạm vi "Một người" · **Then** có ô tìm kiếm theo tên, chọn được đúng người | Sau AC-05-01 |
| AC-06-01 | **Given** đã soạn xong · **When** bấm "Gửi" · **Then** hộp xác nhận hiện **phạm vi**, **số người nhận dự kiến** và **nội dung**, kèm cảnh báo *"Thông báo đã gửi không thu hồi được"* | — |
| AC-07-01 | **Given** người có quyền công bố · **When** mở `/notifications` · **Then** phân tách rõ "Hộp thư của tôi" và "Soạn thông báo"; xem lại được thông báo mình đã gửi | — |

---

## 4. Hạng mục 8 — Thu hồi / đính chính  ⛔ *chờ chốt Q-2*

Chưa viết tiêu chí nghiệm thu. Cần user chốt trước:
- Thu hồi = **ẩn khỏi hộp thư** người nhận, hay = **giữ lại kèm nhãn "Đã thu hồi"**?
- Ai được thu hồi: chỉ người gửi, hay cả nhóm global-write?
- Có giới hạn thời gian không (ví dụ chỉ trong 15 phút đầu)?

**Ràng buộc bắt buộc dù chọn hướng nào:** thu hồi phải làm bằng **cột trạng thái + RPC**,
tuyệt đối **không** cấp quyền xóa dòng trên `notifications` cho `authenticated`.

---

## 5. Tiêu chí bảo mật / phân quyền phải xanh trước khi đóng module

> Chạy bằng **JWT thật của từng vai** (`CLAUDE.md` §4).

| # | Tiêu chí | Loại test | Trạng thái |
|---|---|---|---|
| S-01 | Không vai trò nào công bố vượt phạm vi được phép (6 hướng chối) | pgTAP | ✅ đã có (`022:81-98,133-135,153-156`) — **giữ xanh** |
| S-02 | Thông báo lớp tới đúng phụ huynh của lớp đó, **không** tới Giáo lý viên lớp khác | pgTAP + E2E | ✅ đã có |
| S-03 | `read_at` gắn cứng với người đăng nhập; không đánh dấu hộ người khác được | pgTAP | ✅ đã có (`022:186-200`) |
| S-04 | Danh sách người nhận chốt tại thời điểm công bố (vào sau không nhận ngược, rời lớp vẫn giữ) | pgTAP | ✅ đã có (`022:110-126`) |
| S-05 | `authenticated` **không** ghi được trực tiếp vào `notifications` / `notification_recipients` | pgTAP | ✅ đã có (`022:75-78`) |
| S-06 | Đường dẫn kèm theo lạ bị cơ sở dữ liệu từ chối | pgTAP + Unit | ✅ đã có (`022:99-101`) |
| S-07 | Danh sách đường dẫn hợp lệ khớp nhau giữa mã nguồn và cơ sở dữ liệu (cả nội dung lẫn số lượng) | Unit | ✅ đã có (`notification-schemas.test.ts:24-39`) — **mẫu tốt, giữ nguyên** |
| S-08 | 🔴 **Vai có quyền đọc toàn cục chỉ thấy hộp thư của chính mình** | pgTAP/Integration | ❌ **chưa có — đây là lỗ hổng test gốc rễ, phải thêm** |
| S-09 | 🔴 **Badge chỉ đếm thông báo của chính người đăng nhập** | pgTAP/Integration | ❌ **chưa có — phải thêm** |
| S-10 | Nội dung thông báo riêng của người khác không lọt vào hộp thư ai | Integration | ❌ **chưa có — phải thêm** |
| S-11 | Người không nằm trong danh sách nhận và không phải tác giả **không** đọc được thông báo | pgTAP | ✅ đã có |

## 6. Định nghĩa hoàn thành cho module

Module M10 chỉ được coi là xong khi:

1. **S-08, S-09, S-10 xanh** — ba tiêu chí này chính là hai lỗi CRITICAL. Không có chúng thì mọi thứ
   khác đều vô nghĩa.
2. Không màn hình "của tôi" nào trong module dựa vào RLS để lọc thay cho việc lọc tường minh.
3. Tính bất biến của bản ghi được giữ: `authenticated` vẫn chỉ có quyền đọc.
4. Người công bố luôn biết thông báo tới được bao nhiêu người.
5. Q-1, Q-2, Q-3 (xem `07_IMPLEMENTATION_IMPACT.md` §6) đã được user chốt, hoặc các hạng mục phụ thuộc
   được ghi rõ là hoãn.
6. `npm run lint` · `typecheck` · `test` · `test:db` · `build` xanh; `test:e2e` xanh nếu đổi giao diện.
7. WORKLOG ghi số test thật.

## 7. Cảnh báo khi triển khai

Sau khi sửa hạng mục 1, **badge của 6 vai trò quản lý sẽ tụt mạnh** (ví dụ từ "99+" xuống "2").
Đây là hành vi **đúng**, nhưng với người dùng nó trông giống như mất dữ liệu.
**Phải thông báo trước cho Super Admin và Ban điều hành** trước khi phát hành.
