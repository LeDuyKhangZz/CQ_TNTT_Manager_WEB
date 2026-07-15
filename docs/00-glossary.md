# 00 — Thuật ngữ và quy ước đặt tên

## 1. Mục đích

File này ngăn Claude/Codex dùng lẫn các khái niệm tương tự nhau.

## 2. Thuật ngữ nghiệp vụ

| Thuật ngữ | Định nghĩa trong dự án |
|---|---|
| Xứ đoàn | Phạm vi tổ chức của hệ thống: Giáo xứ Chợ Quán. Không triển khai multi-tenant. |
| Ngành | Một trong 5 ngành: Chiên Con, Ấu Nhi, Thiếu Nhi, Nghĩa Sĩ, Hiệp Sĩ. |
| Cấp lớp | Mức 1, 2 hoặc 3 trong một ngành; riêng Hiệp Sĩ có Hiệp 1 và Hiệp 2. |
| Nhánh lớp | A/B đối với lớp đông. Hiện chỉ áp dụng cho Ấu Nhi và Thiếu Nhi. |
| Lớp giáo lý | Đơn vị học tập và điểm danh. Không đồng nhất với phân đoàn/chi đoàn/đội. |
| Năm học | Khoảng tháng 9 đến tháng 5. Ngày chính xác do Super Admin cấu hình. |
| Thiếu nhi | Đoàn sinh/học viên được quản lý trong hệ thống. |
| Người giám hộ | Một phụ huynh/người đại diện duy nhất được liên kết trực tiếp với một thiếu nhi. Một người giám hộ có thể có nhiều con. |
| Huynh trưởng/Giáo lý viên | Cùng một nhóm hồ sơ nhân sự trong dự án. |
| Giáo lý viên đại diện | Người phụ trách chính của lớp, tạo kế hoạch năm và đề nghị chuyển lớp. |
| Giáo lý viên lớp | Thành viên đứng lớp. |
| Dự trưởng phụ tá | Nhân sự chuyển tiếp lên Huynh trưởng, được phân công hỗ trợ một lớp. Dự trưởng không phải ngành. |
| Trưởng ngành | Role có tên hiển thị kèm ngành, ví dụ `Trưởng ngành Ấu Nhi`. |
| Phó ngành | Role có tên hiển thị kèm ngành, ví dụ `Phó ngành Thiếu Nhi`. |
| Ban | Nhóm chuyên môn như Ban Kỹ thuật, Ban Sinh hoạt. Chức vụ Ban không phải role hệ thống. |
| Sa mạc | Sa mạc dành cho thiếu nhi; là module phát hành cuối cùng. |
| Điểm danh buổi | Một lần điểm danh theo lớp, ngày và loại buổi thứ Năm/Chúa nhật. |
| Thánh lễ | Kết quả tham dự Thánh lễ trong buổi điểm danh. |
| Học giáo lý | Kết quả tham dự phần học giáo lý trong cùng buổi. |
| Khóa điểm danh | Điểm danh tự khóa sau 3 ngày; chỉ Super Admin mở/sửa. |
| Bài kiểm tra | Một cột điểm động: 15 phút, giữa kỳ, cuối kỳ, chuyên cần hoặc phát sinh. |
| Top 5 | Bảng xếp hạng tùy chọn, có thể lấy từ một bài kiểm tra, điểm tạm, thi đua hoặc tổng kết. |
| Đề nghị chuyển lớp | Nghiệp vụ cuối năm, không phải mục trên trang chi tiết thiếu nhi. |
| Báo cáo đã chốt | Snapshot bất biến của báo cáo tại thời điểm công bố. |

## 3. 20 lớp mặc định

```text
Chiên Con: Chiên Con 1, Chiên Con 2, Chiên Con 3

Ấu Nhi:
Ấu 1A, Ấu 1B
Ấu 2A, Ấu 2B
Ấu 3A, Ấu 3B

Thiếu Nhi:
Thiếu 1A, Thiếu 1B
Thiếu 2A, Thiếu 2B
Thiếu 3A, Thiếu 3B

Nghĩa Sĩ: Nghĩa 1, Nghĩa 2, Nghĩa 3

Hiệp Sĩ: Hiệp 1, Hiệp 2
```

Không tạo tùy tiện `Ấu 4`, `Thiếu 5`, `Hiệp 3`.

## 4. Role hệ thống

Tên code đề xuất:

```text
super_admin
parish_priest
chaplain
group_leader
deputy_group_leader
secretary
treasurer
sector_leader
sector_deputy
class_representative
class_teacher
trainee_assistant
guardian
student
```

Tên hiển thị phải theo tiếng Việt và theo phạm vi. Ví dụ:

```text
role_code = sector_leader
sector = AU_NHI
display = Trưởng ngành Ấu Nhi
```

## 5. Chức vụ không phải role

- Cố vấn tối cao Ban.
- Trưởng ban.
- Phó ban.
- Thành viên Ban.
- Sa mạc trưởng.
- Thành viên Ban tổ chức Sa mạc.

Một người chỉ có **một role hệ thống đang hoạt động**, nhưng có thể có tối đa hai membership Ban và nhiều phân công theo sự kiện.

## 6. Trạng thái chuẩn

### Tài khoản

```text
active
locked
disabled
must_change_password
```

### Thiếu nhi

```text
active
temporarily_inactive
withdrawn
archived
```

### Ghi danh năm học

```text
active
paused
completed
repeating
transferred
withdrawn
```

### Điểm danh

```text
present
excused_absence
unexcused_absence
late
left_early
```

Điểm danh Giáo lý viên chỉ dùng:

```text
present
excused_absence
unexcused_absence
```

### Chuyển lớp

```text
pending
recommended_promote
recommended_repeat
temporarily_pause
withdraw
approved
rejected
```

## 7. Quy ước code

- Tên bảng/cột: `snake_case`.
- Tên TypeScript: `camelCase`.
- Type/interface/component: `PascalCase`.
- Enum database dùng mã tiếng Anh ổn định.
- Label UI dùng tiếng Việt.
- ID chính dùng UUID, trừ mã hiển thị như `CQ0001`.
- Tiền tệ (Sa mạc phí) lưu integer VND, không dùng float.
- Thời gian database dùng `timestamptz`.
