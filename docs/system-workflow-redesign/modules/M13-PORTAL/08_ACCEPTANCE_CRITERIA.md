# M13 — CỔNG PHỤ HUYNH & THIẾU NHI · Tiêu chí nghiệm thu

> **F03, F04, F09, F10, F11, F12 (PASS) giữ nguyên** — tiêu chí là "hành vi không đổi",
> bảo vệ bằng pgTAP `012/016/018` đang xanh.

---

## 1. Hạng mục 1 — `/student/attendance` phải kiểm quyền route 🔴

### AC-01-01 · Vai trò sai bị chặn
**Given** một tài khoản Xứ đoàn trưởng
**When** mở thẳng đường dẫn `/student/attendance`
**Then** bị chuyển tới trang từ chối truy cập
**And** **không** thấy hồ sơ điểm danh của bất kỳ em nào.

### AC-01-02 · Thiếu nhi vẫn vào bình thường
**Given** tài khoản thiếu nhi
**When** mở `/student/attendance`
**Then** thấy điểm danh của chính mình, hành vi **không đổi** so với trước.

### AC-01-03 · Chống tái phát ở mức cấu trúc
**Given** bộ mã nguồn
**When** chạy bài kiểm thử kiến trúc
**Then** mọi trang trong `(dashboard)` có quy tắc khai báo giới hạn vai trò **đều** đi qua hàm kiểm quyền route
**And** bài kiểm thử **đỏ** nếu ai đó thêm trang mới mà quên.

---

## 2. Hạng mục 2 & 3 — Lối vào cho phụ huynh 🔴

### AC-03-01 · Đi được từ màn hình đăng nhập tới chức năng cốt lõi
**Given** một phụ huynh có một con
**When** đăng nhập rồi chỉ dùng giao diện (không gõ đường dẫn, không qua thông báo)
**Then** tới được trang xem điểm danh của con **trong tối đa 3 lần bấm**.

### AC-03-02 · Phụ huynh nhiều con chuyển đổi được
**Given** một phụ huynh có ba con
**When** đang xem con thứ nhất
**Then** có cách rõ ràng để chuyển sang con thứ hai và thứ ba
**And** không phải quay lại màn hình đăng nhập hay gõ đường dẫn.

### AC-02-01 · Không còn link dẫn tới trang bị từ chối
**Given** phụ huynh ở bảng tổng quan
**When** bấm vào bất kỳ liên kết nào trên trang
**Then** **không** bị đưa tới trang từ chối truy cập
*(hiện tại thẻ "Cần quan tâm" đang trỏ vào route chỉ dành cho nhân sự)*.

### AC-03-03 · Vẫn chỉ thấy con mình ⚠️ **bảo mật**
**Given** trang danh sách con mới
**When** phụ huynh mở
**Then** chỉ hiện các em mà tài khoản đó thực sự là người giám hộ
**And** danh sách lấy qua quyền của chính người dùng, **không** qua quyền quản trị.

### 🔴 Quyết định phải chốt trước khi code

| # | Câu hỏi | Lựa chọn |
|---|---|---|
| Q-1 | Phụ huynh vào cổng bằng đường nào? | **A** trang danh sách con · **B** mục nav thông minh (1 con thì vào thẳng) · **C** gộp vào bảng tổng quan. *Khuyến nghị: B* |
| Q-2 | Thanh dưới của phụ huynh đang đủ 5 mục và bị cắt ở 5. Thêm "Con của tôi" thì **bỏ mục nào**? | Hiện có: Trang chủ · Xin nghỉ · Kết quả · Thông báo · Tài khoản |

---

## 3. Hạng mục 4 — Trạng thái rỗng nói đúng nguyên nhân

### AC-04-01 · Tài khoản chưa liên kết
**Given** tài khoản phụ huynh chưa được nối với hồ sơ giám hộ
**When** mở trang kết quả
**Then** thấy thông điệp nói **đúng nguyên nhân** và **việc cần làm tiếp** (liên hệ ai)
**And** **không** thấy *"Chưa có kết quả nào được công bố."*

### AC-04-02 · Phân biệt ba tình huống
**Given** ba tình huống: chưa liên kết tài khoản / con chưa có dữ liệu / buổi chưa được chốt
**When** phụ huynh mở trang tương ứng
**Then** mỗi tình huống có thông điệp **riêng biệt**, không dùng chung một câu.

### AC-04-03 · Lấy trang thiếu nhi làm chuẩn
Thông điệp mới phải đạt cùng chất lượng với trang điểm danh của thiếu nhi hiện tại
(`student/attendance/page.tsx:19-21`) — nói rõ nguyên nhân và bước tiếp theo.

---

## 4. Hạng mục 5, 6, 7 — tiêu chí rút gọn

| Mã | Given / When / Then |
|---|---|
| AC-05-01 | **Given** hàm lấy danh sách em · **When** đọc mã nguồn · **Then** tên hàm phản ánh đúng ngữ nghĩa ("em đọc được" vs "con của tôi"), và nơi cần "con của tôi" dùng đúng hàm đó |
| AC-06-01 | **Given** lớp có 5 cột điểm, 3 cột đã công bố · **When** phụ huynh xem trung bình · **Then** thấy rõ *"tính trên 3/5 cột đã công bố"* — không để phụ huynh so số với Giáo lý viên rồi thắc mắc |
| AC-07-01 | **Given** người dùng dùng trình đọc màn hình · **When** đọc bảng điểm · **Then** nghe được tên cột và tên dòng cho từng ô |
| AC-07-02 | **Given** khối cảnh báo chuyên cần · **When** hiển thị · **Then** trình đọc màn hình thông báo được nội dung |
| AC-07-03 | **Given** phụ huynh lớn tuổi trên màn 360px · **When** đọc nhãn thanh dưới và nhãn thời gian · **Then** chữ không dưới 13px và không bị cắt cụt |

---

## 5. Hạng mục 8 — Route thiếu nhi còn thiếu ⛔ *chờ chốt*

`docs/06 §6` liệt kê 5 route `/student/*`; thực tế có 1. Chưa viết tiêu chí nghiệm thu cho tới khi
user chốt:

- **Hướng A:** làm thêm các route riêng cho thiếu nhi (lịch học, kết quả, hồ sơ).
- **Hướng B:** thiếu nhi dùng chung `/results` và `/teaching-plan` với các vai trò khác ⇒ **sửa `docs/06`**
  để bỏ mô tả route chưa từng tồn tại.

*Khuyến nghị: B* — các trang dùng chung đã hoạt động đúng cho vai trò thiếu nhi nhờ RLS; làm thêm route
riêng là nhân đôi công sức bảo trì mà không thêm giá trị rõ ràng.

---

## 6. Tiêu chí bảo mật / phân quyền phải xanh trước khi đóng module

> Chạy bằng **JWT thật của từng vai** (`CLAUDE.md` §4).

| # | Tiêu chí | Loại test | Trạng thái |
|---|---|---|---|
| S-01 | Phụ huynh mở hồ sơ em không phải con mình → **404**, không lộ tên, không lỗi máy chủ | pgTAP | ✅ giữ xanh |
| S-02 | Thiếu nhi **không** xem được bạn cùng lớp | pgTAP | ✅ giữ xanh |
| S-03 | Ngoại lệ Top 5 dùng tên đã chụp lại, **không** mở quyền đọc bảng hồ sơ | pgTAP | ✅ giữ xanh (`018`) |
| S-04 | Phụ huynh/thiếu nhi **không** xem được hồ sơ sức khỏe | pgTAP | ✅ giữ xanh (`006`) |
| S-05 | Phụ huynh/thiếu nhi **không** xem được bí tích | pgTAP | ✅ giữ xanh |
| S-06 | Phụ huynh/thiếu nhi **không** xem được nhận xét nội bộ, kể cả số lượng | pgTAP | ✅ giữ xanh (`017`) |
| S-07 | Điểm danh **chưa chốt** không hiện ở cổng | pgTAP | ✅ giữ xanh (`012`) |
| S-08 | Điểm **chưa công bố** không hiện ở cổng | pgTAP | ✅ giữ xanh (`016`) |
| S-09 | Giáo án tuần tới **không** trả nội dung nội bộ và tài liệu | pgTAP | ✅ giữ xanh (`014`) |
| S-10 | 🔴 **Vai trò không phải thiếu nhi bị chặn ở `/student/attendance`** | E2E + kiểm thử kiến trúc | ❌ **chưa có — hiện đang SAI** |
| S-11 | Trang danh sách con mới chỉ trả con của chính người đăng nhập | E2E + Integration | ❌ **chưa có (chức năng chưa tồn tại)** |
| S-12 | Mọi trang trong `(dashboard)` có khai báo giới hạn vai trò đều thực thi giới hạn đó | Kiểm thử kiến trúc | ❌ **chưa có — chống tái phát** |

## 7. Định nghĩa hoàn thành cho module

Module M13 chỉ được coi là xong khi:

1. **S-10, S-11, S-12 xanh.**
2. **Phụ huynh đi được từ màn hình đăng nhập tới trang xem con bằng giao diện** — có E2E chứng minh
   theo **hành trình**, không phải bằng đường dẫn trực tiếp. *(Đây là bài học gốc rễ: chức năng trước nay
   được nghiệm thu theo route nên lỗi "không có lối vào" lọt qua mọi vòng kiểm.)*
3. Không màn hình nào của phụ huynh dẫn tới trang từ chối truy cập.
4. Trạng thái rỗng nói đúng nguyên nhân ở **cả** phía phụ huynh lẫn phía thiếu nhi.
5. Toàn bộ 9 tiêu chí bảo mật S-01 → S-09 **vẫn xanh** — không được đánh đổi bảo mật lấy tiện dụng.
6. Q-1, Q-2 và phạm vi route thiếu nhi đã được user chốt.
7. `npm run lint` · `typecheck` · `test` · `test:db` · `build` xanh; `test:e2e` xanh.
8. WORKLOG ghi số test thật.

## 8. Ghi chú cho người triển khai

Module này có đặc điểm khác thường: **phần khó (bảo mật) đã làm rất tốt, phần dễ (đặt link vào menu) lại
thiếu.** Vì vậy nguyên tắc khi làm là:

> Không đụng vào bất kỳ lớp bảo vệ nào để đổi lấy sự tiện lợi.

Cụ thể: giữ nguyên lọc hai tầng, giữ nguyên 404 thay vì 403, giữ nguyên tên chụp lại cho Top 5, và
tuyệt đối không dùng quyền quản trị để lấy danh sách con "cho nhanh".
