# M03 — STUDENTS & GUARDIANS · Tiêu chí nghiệm thu

> Chỉ viết cho luồng phải sửa. **F04, F07, F11 giữ nguyên** — tiêu chí của chúng là "hành vi hiện tại
> không thay đổi", được bảo vệ bằng bộ test hồi quy hiện có.

---

## 1. TB-F14 — Kênh phản hồi và phát hiện ghi 0 dòng

### AC-F14-01 · Thành công có thông báo
**Given** thư ký đang ở `/students`
**When** tạo hồ sơ thiếu nhi với dữ liệu hợp lệ
**Then** hiển thị thông báo thành công bằng tiếng Việt kèm tên em và mã `CQxxxx`
**And** thông báo nằm trong vùng `aria-live` để trình đọc màn hình đọc được.

### AC-F14-02 · Bị từ chối quyền phải báo lỗi, không báo thành công
**Given** một tài khoản **không** thuộc nhóm được ghi hồ sơ (ví dụ Giáo lý viên lớp)
**When** gửi thẳng yêu cầu sửa hồ sơ một em (bỏ qua giao diện)
**Then** nhận mã `FORBIDDEN` và thông báo tiếng Việt
**And** **không** nhận `ok:true`
**And** dữ liệu trong cơ sở dữ liệu không đổi.

### AC-F14-03 · Lỗi dữ liệu giữ lại nội dung đã nhập
**Given** người dùng điền form thiếu ngày sinh
**When** bấm lưu
**Then** thấy thông báo lỗi chỉ đúng trường sai
**And** các trường đã nhập **vẫn còn nguyên**, không phải gõ lại.

### Test bắt buộc xanh
- Integration: mỗi thao tác ghi (`createStudent`, `updateStudent`, `saveHealthProfile`, `createSacrament`,
  `createGuardian`, `updateGuardian`, `enrollStudent`, `closeEnrollment`) chạy dưới **JWT thật** của một
  vai không đủ quyền ⇒ **phải** trả lỗi.
- E2E: luồng tạo hồ sơ hiển thị thông báo.

---

## 2. TB-F10 — Vòng đời ghi danh

### AC-F10-01 · Tạm nghỉ hoạt động được
**Given** một em đang `active` trong lớp Ấu 1A
**When** người có quyền chọn "Tạm nghỉ" và xác nhận
**Then** ghi danh chuyển sang `paused` với `ended_on` để trống
**And** em vẫn hiển thị trong roster kèm nhãn "Tạm nghỉ"
**And** có nút "Khôi phục".

### AC-F10-02 · Khôi phục
**Given** một ghi danh `paused`
**When** bấm "Khôi phục"
**Then** trở về `active`, `ended_on` vẫn trống
**And** **không** tạo bản ghi ghi danh thứ hai.

### AC-F10-03 · Đóng ghi danh có xác nhận
**Given** một em đang học
**When** chọn "Kết thúc"
**Then** hộp xác nhận hiển thị **tên em** và lý do đã chọn
**And** chỉ sau khi xác nhận mới ghi `ended_on`.

### AC-F10-04 · Cơ sở dữ liệu vẫn là chốt chặn cuối
**Given** một yêu cầu đặt `status='paused'` kèm `ended_on` không rỗng gửi thẳng vào cơ sở dữ liệu
**When** thực thi
**Then** bị từ chối bởi ràng buộc `enrollments_open_has_no_end`.

### Test bắt buộc xanh
- **pgTAP mới**: `status='paused'` kèm `ended_on` bị từ chối (đây là ca chưa từng được kiểm và là gốc của lỗi).
- **pgTAP mới**: ghi danh mở thứ hai trong cùng năm bị từ chối với mã `23505`.
- **E2E mới**: tạm nghỉ → khôi phục → vẫn đúng một ghi danh mở.

---

## 3. TB-F13 — Cảnh báo trùng khi nhập tay

### AC-F13-01 · Phát hiện và cảnh báo
**Given** đã có hồ sơ "Maria Nguyễn Thị A · 12/03/2015"
**When** người dùng nhập đúng tên và ngày sinh đó
**Then** **không** tạo ngay
**And** hiển thị danh sách hồ sơ tương tự kèm mã, ngày sinh và lớp hiện tại
**And** có hai lựa chọn: "Mở hồ sơ đã có" và "Vẫn tạo hồ sơ mới".

### AC-F13-02 · Cảnh báo là mềm, không chặn
**Given** đang thấy cảnh báo trùng
**When** chọn "Vẫn tạo hồ sơ mới"
**Then** hồ sơ được tạo bình thường
**And** không có ràng buộc cứng nào ngăn cản (đúng WF-03 bước 4).

### AC-F13-03 · Không rò dữ liệu ngoài phạm vi ⚠️ **bảo mật**
**Given** một Giáo lý viên lớp Ấu 1A (nếu quyền tạo được mở rộng theo Q-M03-01)
**When** nhập tên trùng với một em thuộc lớp Thiếu 2B
**Then** **không** thấy em đó trong danh sách cảnh báo
**And** truy vấn dò trùng chạy dưới quyền người dùng, **không** dùng service role.

### AC-F13-04 · Cùng định nghĩa "trùng" với đường Excel
**Given** cùng một cặp dữ liệu
**When** đưa vào bằng nhập tay và bằng Excel
**Then** cả hai cho ra **cùng mức cảnh báo** (High/Medium/Low).

### Test bắt buộc xanh
- Unit: hàm dò trùng dùng chung, các ca High/Medium/Low.
- **Integration bảo mật**: dò trùng dưới JWT của vai có phạm vi hẹp **không** trả về hồ sơ ngoài phạm vi.
- E2E: tạo trùng → thấy cảnh báo → vẫn tạo được.

---

## 4. TB-F06 — Lưu trữ hồ sơ đồng bộ với ghi danh

### AC-F06-01 · Cảnh báo khi còn ghi danh mở
**Given** một em đang học lớp Ấu 1A
**When** đổi trạng thái hồ sơ sang "Lưu trữ"
**Then** hiển thị cảnh báo nêu rõ **tên lớp** em đang học
**And** có ô chọn "Đồng thời kết thúc ghi danh".

### AC-F06-02 · Nguyên tử
**Given** đã chọn đóng ghi danh cùng lúc
**When** xác nhận
**Then** cả hai thay đổi xảy ra **trong cùng một giao dịch**
**And** nếu một bên lỗi thì **không** bên nào được ghi.

### AC-F06-03 · Sĩ số phản ánh đúng
**Given** một em đã lưu trữ và ghi danh đã đóng
**When** mở `/classes`
**Then** sĩ số lớp **giảm 1**
**And** em không còn trong danh sách điểm danh.

### AC-F06-04 · Không ghi danh cho em đã lưu trữ
**Given** một em `status='archived'`
**When** thử ghi danh vào lớp
**Then** nhận `VALIDATION_ERROR` với thông điệp rõ ràng.

### Test bắt buộc xanh
- pgTAP: RPC `archive_student` nguyên tử; rollback khi một bước lỗi.
- pgTAP: lưu trữ rồi kiểm `class_scoped_student_ids()` **không** còn trả em đó ⇒ Giáo lý viên
  **mất quyền đọc** hồ sơ và dữ liệu sức khỏe của em đã rời lớp. *(Hiện tại vẫn đọc được — đây là
  hệ quả phân quyền của lỗi F06.)*
- Kiểm dữ liệu trước khi chạy migration: không còn em `archived` nào giữ ghi danh mở.

---

## 5. TB-F12 — Quản lý người giám hộ

### AC-F12-01 · Sửa được thông tin liên lạc
**Given** số điện thoại phụ huynh nhập sai
**When** người có quyền sửa qua giao diện
**Then** lưu thành công và có thông báo.

### AC-F12-02 · Đổi người giám hộ có xác nhận ⚠️ **bảo mật**
**Given** em A đang thuộc giám hộ X
**When** đổi sang giám hộ Y
**Then** hộp xác nhận nêu rõ: **"Phụ huynh X sẽ không còn xem được em A; phụ huynh Y sẽ xem được"**
**And** sau khi đổi, tài khoản của X **không** còn thấy em A trong cổng phụ huynh
**And** tài khoản của Y thấy em A.

### Test bắt buộc xanh
- **pgTAP/Integration bảo mật**: sau khi đổi `guardian_id`, `own_student_ids()` của cả hai phụ huynh
  thay đổi đúng; phụ huynh cũ nhận 0 dòng khi đọc hồ sơ em.

---

## 6. TB-F03 / TB-F08 / TB-F02-F09 — tiêu chí rút gọn

| Mã | Given / When / Then |
|---|---|
| AC-F03-01 | **Given** ~900 em · **When** mở `/students` trên màn 360px · **Then** chỉ tải một trang kết quả, có ô tìm kiếm và bộ lọc, không cuộn vô tận |
| AC-F03-02 | **Given** Giáo lý viên lớp · **When** tìm kiếm · **Then** kết quả **chỉ** gồm em trong phạm vi được phép (RLS vẫn lọc sau khi thêm bộ lọc) |
| AC-F08-01 | **Given** bản ghi bí tích nhập sai ngày · **When** bấm "Sửa" · **Then** cập nhật được, không phải tạo bản ghi mới |
| AC-F08-02 | **Given** bảng đã có bí tích "Rửa tội" · **When** thêm "Rửa tội" lần hai · **Then** bị từ chối bởi ràng buộc duy nhất **và người dùng thấy thông báo** (hiện tại lỗi bị nuốt) |
| AC-F09-01 | **Given** vừa tạo hồ sơ xong · **When** hoàn tất · **Then** được đưa tới trang em kèm lời mời ghi danh vào lớp năm hiện hành |

---

## 7. Tiêu chí bảo mật / phân quyền phải xanh trước khi đóng module

> Đây là danh sách **không được bỏ qua**. Mọi mục đều phải chạy bằng **JWT thật của từng vai**,
> không được dùng service role để giả lập (`CLAUDE.md` §4).

| # | Tiêu chí | Loại test | Trạng thái hiện tại |
|---|---|---|---|
| S-01 | Phụ huynh **không** đọc được hồ sơ sức khỏe của con | pgTAP RLS negative | ✅ đã có (`006:98`) — **phải giữ xanh** |
| S-02 | Phụ huynh **không** đọc được bí tích của con | pgTAP RLS negative | ✅ đã có (`006:99,109`) |
| S-03 | Thiếu nhi chỉ đọc hồ sơ của chính mình | pgTAP RLS negative | ✅ đã có (`010:108-111`) |
| S-04 | Giáo lý viên lớp không đọc được em lớp khác | pgTAP RLS negative | ✅ đã có (`009:60`) |
| S-05 | Trưởng ngành không đọc được ngành khác | pgTAP RLS negative | ✅ đã có (`010:72-78`) |
| S-06 | **Thủ quỹ đọc `students` trả 0 dòng** | pgTAP RLS negative | ❌ **chưa có — phải thêm** |
| S-07 | Thao tác ghi bị RLS chặn **trả lỗi**, không trả thành công | Integration JWT thật | ❌ **chưa có — phải thêm** |
| S-08 | Truy vấn dò trùng không lộ hồ sơ ngoài phạm vi | Integration JWT thật | ❌ **chưa có — phải thêm** |
| S-09 | Đổi giám hộ làm đổi đúng quyền đọc của hai phụ huynh | Integration JWT thật | ❌ **chưa có — phải thêm** |
| S-10 | UUID không hợp lệ trả 404, không phải 500 | E2E | ✅ đã có |
| S-11 | Em đã rời lớp: Giáo lý viên mất quyền đọc hồ sơ và sức khỏe | pgTAP | ❌ **chưa có — hiện đang SAI** (xem AC-F06 trên) |

## 8. Định nghĩa hoàn thành cho module

Module M03 chỉ được coi là xong khi:

1. Tất cả tiêu chí S-01 → S-11 xanh bằng test thật.
2. Không còn thao tác ghi nào trả `ok:true` khi cơ sở dữ liệu không có dòng nào thay đổi.
3. Lựa chọn "Tạm nghỉ" hoạt động, hoặc bị gỡ khỏi giao diện — **không được để một nút không bao giờ chạy**.
4. Nhập tay và nhập Excel dùng **chung một định nghĩa trùng**.
5. `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:db` · `npm run build` xanh;
   `npm run test:e2e` xanh nếu có đổi luồng giao diện.
6. WORKLOG ghi số test thật, không ghi "pass" khi chưa chạy.
