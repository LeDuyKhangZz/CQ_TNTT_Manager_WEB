# M07 — ASSESSMENTS · Tiêu chí nghiệm thu

> Chỉ viết cho luồng phải sửa. **F01, F08, F12, F15 giữ nguyên** — tiêu chí của chúng là "hành vi hiện tại
> không đổi", bảo vệ bằng pgTAP `016/017/018` và E2E `results` đang xanh.

---

## 1. TB-M07-08 — Làm sạch mọi ô xuất bảng tính  *(ưu tiên cao nhất, rẻ nhất)*

### AC-08-01 · Tên cột chứa công thức
**Given** Giáo lý viên đặt tên một cột điểm là `=1+1`
**When** xuất bảng điểm ra Excel
**Then** ô tiêu đề trong file bắt đầu bằng dấu nháy đơn `'`
**And** mở bằng Excel **không** thực thi công thức.

### AC-08-02 · Áp dụng cho mọi ô, không chỉ tên thiếu nhi
**Given** tên lớp, tên cột, nhận xét đều do người dùng nhập
**When** xuất file
**Then** **tất cả** đều đi qua bộ làm sạch, không phân biệt tiêu đề hay giá trị.

### Test bắt buộc xanh
- Unit `tests/unit/gradebook-export.test.ts`: ca `=`, `+`, `-`, `@` ở **cả tiêu đề cột và tên lớp**.

---

## 2. TB-M07-01 — Xóa / ẩn cột điểm

### AC-01-01 · Xóa cột chưa có điểm
**Given** một cột điểm chưa nhập điểm nào
**When** Giáo lý viên bấm "Xóa cột" và xác nhận
**Then** cột biến mất khỏi bảng điểm, bản xuất và trung bình
**And** các dòng điểm rỗng của cột cũng bị xóa.

### AC-01-02 · Không xóa cứng cột đã có điểm
**Given** một cột đã có ít nhất một điểm thật
**When** thử xóa cứng
**Then** nhận lỗi với thông điệp *"Cột này đã có điểm. Bạn có thể ẩn cột thay vì xóa."*
**And** dữ liệu điểm **còn nguyên**.

### AC-01-03 · Ẩn cột cập nhật ngay mọi nơi
**Given** một cột đã có điểm
**When** chọn "Ẩn cột khỏi bảng điểm"
**Then** cột không còn trong bảng điểm, bản xuất, cổng phụ huynh và Top 5
**And** trung bình có trọng số được tính lại **ngay**, không cần thao tác thêm.

### AC-01-04 · Bảng điểm đã khóa vẫn chặn
**Given** bảng điểm đã khóa
**When** thử xóa hoặc ẩn cột
**Then** nhận `GRADEBOOK_LOCKED`.

---

## 3. TB-M07-03 — Nhập điểm khi nhiều người cùng làm

### AC-03-01 · Không mất điểm của người khác ⚠️ **mất dữ liệu**
**Given** Giáo lý viên A vừa lưu điểm 9 cho em X
**When** Giáo lý viên B lưu điểm 8 cho em X dựa trên bản cũ
**Then** điểm 9 của A **vẫn còn nguyên**
**And** B nhận thông báo *"1 ô bị bỏ qua vì người khác vừa sửa"*
**And** ô xung đột được tô nổi bật.

### AC-03-02 · Hai người sửa hai ô khác nhau đều thành công
**Given** A sửa điểm em X, B sửa điểm em Y, cùng lúc, cùng cột
**When** cả hai lưu
**Then** cả hai điểm đều được ghi, **không** ai bị bỏ qua.

### AC-03-03 · Chỉ đánh dấu "chỉnh tay" khi thật sự chỉnh tay
**Given** một ô điểm chuyên cần bằng đúng giá trị hệ thống đề xuất
**When** Giáo lý viên lưu bảng điểm mà không sửa ô đó
**Then** ô **không** bị đánh dấu "chỉnh tay"
**And** lần làm mới đề xuất sau vẫn cập nhật được ô đó.

### Test bắt buộc xanh
- pgTAP: hai phiên đồng thời, phiên sau nhận `conflicts`, dữ liệu phiên trước còn nguyên.
- pgTAP: cờ "chỉnh tay" chỉ bật khi giá trị khác đề xuất.

---

## 4. TB-M07-02 — Tách "công bố" khỏi "khóa"  ⚠️ *cần chốt nghiệp vụ trước*

### AC-02-01 · Khóa rồi vẫn công bố được
**Given** bảng điểm đã khóa
**When** Giáo lý viên bật công bố cho một cột
**Then** thao tác thành công
**And** phụ huynh của em trong lớp thấy cột đó.

### AC-02-02 · Khóa vẫn chặn mọi thay đổi khác ⚠️ **bảo mật/toàn vẹn**
**Given** bảng điểm đã khóa
**When** thử đổi hệ số, sửa điểm, thêm cột, xóa cột, sửa nhận xét
**Then** **tất cả** đều bị từ chối
**And** kể cả khi gửi thẳng câu lệnh vào cơ sở dữ liệu, không qua giao diện.

### AC-02-03 · Cổng phụ huynh không bị nới lỏng
**Given** một cột **chưa** công bố
**When** phụ huynh mở trang kết quả của con
**Then** **không** thấy cột đó, không thấy điểm, không thấy dấu vết cột tồn tại.

### Test bắt buộc xanh
- pgTAP **cả hai chiều** (AC-02-01 và AC-02-02) — thiếu một chiều là chưa đủ.
- E2E hồi quy cổng phụ huynh.

---

## 5. TB-M07-10 — Quyền khóa bảng điểm  🔴 *cần user chốt*

Hiện tại có **mâu thuẫn chưa giải quyết**:

| Nguồn | Ai được khóa bảng điểm |
|---|---|
| `docs/05-permission-matrix.md` §5 | Chỉ Giáo lý viên đại diện |
| RPC `lock_gradebook` thực tế | `can_global_write` (thêm Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký) |
| `queries.ts:384` (`canLock` hiển thị nút) | Theo cách tính riêng, có thể lệch cả hai |

**Không viết tiêu chí nghiệm thu cho hạng mục này cho tới khi user chốt một trong hai hướng:**

- **Hướng A — giữ như code hiện tại:** nhóm quản lý cấp xứ đoàn cũng khóa được (thuận tiện khi
  Giáo lý viên đại diện nghỉ/không thao tác kịp cuối năm). ⇒ Phải **sửa `docs/05`**.
- **Hướng B — siết theo tài liệu:** chỉ Giáo lý viên đại diện khóa được. ⇒ Phải **sửa RPC và `canLock`**,
  và chấp nhận rủi ro nghiệp vụ nêu trên.

### AC-10-01 · Áp dụng cho cả hai hướng
**Given** một người **không** thuộc nhóm được chốt
**When** gửi thẳng lệnh khóa bảng điểm (bỏ qua giao diện)
**Then** bị từ chối ở tầng cơ sở dữ liệu, không chỉ ẩn nút.

### AC-10-02 · Khóa hai lần là vô hại
**Given** bảng điểm đã khóa lúc 10:00
**When** gọi khóa lần nữa lúc 11:00
**Then** thời điểm khóa **vẫn là 10:00**, không bị đẩy lùi.

---

## 6. TB-M07-05 / TB-M07-06 / TB-M07-04 / TB-M07-07 / TB-M07-09 — tiêu chí rút gọn

| Mã | Given / When / Then |
|---|---|
| AC-05-01 | **Given** viết nhận xét mới · **When** mở form · **Then** mặc định là **nội bộ**; chọn "Công khai" hiện cảnh báo *"Nội dung này sẽ hiện trên cổng phụ huynh"* |
| AC-05-02 | **Given** nhận xét của Giáo lý viên khác · **When** người không phải tác giả và không thuộc nhóm global-write thử xóa · **Then** bị từ chối ở tầng cơ sở dữ liệu |
| AC-06-01 | **Given** Top 5 đã công bố rồi ẩn · **When** công bố lại · **Then** danh sách 5 em **giống hệt** lần đầu, không tính lại |
| AC-06-02 | **Given** Top 5 chưa từng công bố · **When** xóa · **Then** xóa được; **Given** đã công bố · **When** xóa · **Then** bị từ chối |
| AC-04-01 | **Given** 3 ô đang chỉnh tay · **When** bấm làm mới đề xuất chuyên cần · **Then** hiện *"Đã cập nhật N đề xuất · 3 ô đang chỉnh tay được giữ nguyên"* kèm đường dẫn đặt lại |
| AC-07-01 | **Given** lớp có 5 cột, 3 cột đã công bố · **When** phụ huynh xem · **Then** thấy *"TB 8.40 · tính trên 3/5 cột đã công bố"*, không thấy số của 2 cột còn lại |
| AC-09-01 | **Given** Super Admin đổi hệ số mặc định của năm học · **When** Giáo lý viên tạo cột mới · **Then** hệ số gợi ý lấy từ cấu hình năm học, không phải số cố định trong mã |

---

## 7. Tiêu chí bảo mật / phân quyền phải xanh trước khi đóng module

> Chạy bằng **JWT thật của từng vai**, không dùng service role (`CLAUDE.md` §4, §6).

| # | Tiêu chí | Loại test | Trạng thái |
|---|---|---|---|
| S-01 | Ô điểm để trống là **rỗng**, không phải 0 | pgTAP + Unit | ✅ giữ xanh |
| S-02 | Điểm 0 vẫn là điểm hợp lệ, phân biệt với ô rỗng | pgTAP + Unit | ✅ giữ xanh |
| S-03 | Điểm tối đa 10, ngoài khoảng bị từ chối | pgTAP | ✅ giữ xanh |
| S-04 | Phụ huynh/thiếu nhi **không** thấy cột chưa công bố | pgTAP RLS negative | ✅ giữ xanh (`016`) |
| S-05 | Phụ huynh/thiếu nhi **không** thấy nhận xét nội bộ, **kể cả số lượng** | pgTAP RLS negative | ✅ giữ xanh (`017`) |
| S-06 | Thiếu nhi không thấy điểm bạn cùng lớp, trừ Top 5 đã công bố | pgTAP RLS negative | ✅ giữ xanh (`018`) |
| S-07 | Dự trưởng chỉ nhập điểm/nhận xét khi cờ năm học bật | pgTAP | ✅ giữ xanh |
| S-08 | Bảng điểm đã khóa: **không** đổi được cấu trúc, hệ số, điểm, nhận xét | pgTAP | ✅ giữ xanh — **AC-02-02 phải giữ được điều này** |
| S-09 | Bản xuất chỉ chứa dữ liệu trong phạm vi người xuất | Integration | ✅ giữ xanh |
| S-10 | Ô bảng tính chống công thức lạ ở **mọi** vị trí | Unit | ❌ **chưa đủ — mới làm cho tên thiếu nhi** |
| S-11 | Hai người cùng nhập không mất dữ liệu | pgTAP | ❌ **chưa có** |
| S-12 | Chỉ tác giả/global-write xóa được nhận xét | pgTAP | ❌ **chưa có** |
| S-13 | Top 5 đã công bố là bất biến | pgTAP | ❌ **chưa có** |

## 8. Định nghĩa hoàn thành cho module

Module M07 chỉ được coi là xong khi:

1. S-01 → S-13 xanh bằng test thật.
2. **Bất biến quan trọng nhất không bị phá:** phụ huynh và thiếu nhi chỉ nhìn thấy điểm/nhận xét
   **đã được công bố có chủ ý**, và không bao giờ suy ra được sự tồn tại của dữ liệu nội bộ.
3. Không thao tác nào làm mất điểm đã nhập của người khác mà không báo.
4. Ba module tiêu thụ số trung bình (M08, M11, M13) đã được kiểm chéo sau khi đổi cách tính.
5. Mâu thuẫn quyền khóa bảng điểm (§5) đã được user chốt và tài liệu đã cập nhật khớp với code.
6. `npm run lint` · `typecheck` · `test` · `test:db` · `build` xanh; `test:e2e` xanh cho `results.spec.ts`.
7. WORKLOG ghi số test thật.
