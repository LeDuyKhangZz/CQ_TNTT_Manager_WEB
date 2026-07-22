# 06 — UI/UX Specification

## 1. Định hướng

- Cute, hiện đại, ấm áp.
- Tone cam đào + da người pastel + trắng ấm.
- Không trẻ con quá mức đối với màn quản trị.
- Người ít tiếp cận công nghệ phải hiểu sau 1–2 phút.
- Laptop và điện thoại là hai ưu tiên ngang nhau.
- Không dark mode.
- Không đa ngôn ngữ.
- Không cần mascot riêng trong v1.
- Mỗi ngành có icon/màu phụ riêng sau khi user cung cấp asset.

## 2. Design tokens đề xuất

Không hardcode màu rải rác; dùng CSS variables.

```css
--background: #FFF9F4;
--surface: #FFFFFF;
--surface-muted: #FFF2E8;
--primary: #F28C5B;
--primary-hover: #E97945;
--secondary: #F7C8A6;
--accent: #F6D7C3;
--text: #3F342F;
--text-muted: #756861;
--border: #EEDFD5;
--success: #4F9D76;
--warning: #D99A2B;
--danger: #D95C5C;
```

Màu ngành là metadata UI, không dùng để quyết định nghiệp vụ.

## 3. Typography

- Font ưu tiên: Inter hoặc Be Vietnam Pro.
- Body 15–16px.
- Heading rõ, không dùng quá nhiều weight.
- Không dùng chữ quá nhỏ dưới 13px.
- Số liệu dashboard dùng tabular numbers.

## 4. Layout desktop

- Sidebar trái 240–272px.
- Header trên:
  - breadcrumb;
  - năm học hiện tại;
  - notification badge;
  - user menu.
- Content max-width linh hoạt, ưu tiên bảng.
- Filter sticky ở trang danh sách.
- Drawer/modal cho tác vụ ngắn; trang riêng cho form dài.

## 5. Mobile

Bottom navigation tối đa 5 mục theo role.

### Staff lớp

```text
Trang chủ | Điểm danh | Lớp | Thông báo | Tài khoản
```

### Phụ huynh

```text
Trang chủ | Con của tôi | Lịch học | Thông báo | Tài khoản
```

### Thiếu nhi

```text
Trang chủ | Lịch học | Kết quả | Thông báo | Tài khoản
```

Các module còn lại trong menu `Thêm`.

Touch target >= 44px. Không phụ thuộc hover.

## 6. Route map

### Chung

```text
/login
/change-password
/dashboard
/notifications
/account
```

### Quản trị/cấp staff

```text
/students
/students/[studentId]
/classes
/classes/[classId]
/staff
/staff/[staffId]
/attendance
/attendance/[sessionId]
/teaching-plan
/teaching-plan/[classId]
/results
/results/[classId]
/promotions
/committees
/committees/[committeeId]
/equipment
/reports
/admin
/admin/accounts
/admin/academic-years
/admin/settings
/admin/import
```

### Guardian

```text
/parent
/parent/children/[studentId]
/parent/absence-requests
```

### Student

```text
/student
/student/schedule
/student/results
/student/attendance
/student/profile
```

### Sa mạc Phase 8

```text
/camps
/camps/[campId]
/parent/camps/[campId]
```

## 7. Dashboard

### Global

Cards:

- Tổng thiếu nhi.
- Tổng GLV.
- Tổng lớp.
- Tỷ lệ dự lễ.
- Tỷ lệ học giáo lý.

Charts:

- Chuyên cần theo tuần/tháng.
- Xu hướng vắng có phép/không phép.
- Không so sánh thi đua ngành.

Lists:

- Em cần quan tâm.
- Sinh nhật/bổn mạng.
- Buổi sắp tới.
- Thông báo.
- Hồ sơ thiếu dữ liệu.

### Sector

Tương tự nhưng scope sector.

### Class staff

- Sĩ số.
- Buổi kế tiếp.
- Nút Điểm danh nổi bật.
- Cảnh báo chuyên cần.
- Bài/kiểm tra sắp tới.
- Công việc lớp.

### Guardian/student

- Hôm nay/tuần tới.
- Điểm danh gần nhất.
- Điểm mới.
- Bài cần chuẩn bị.
- Thông báo.

## 8. Trang Thiếu nhi

### Table desktop

Cột:

- Tên thánh.
- Họ tên.
- Ngành.
- Lớp.
- Giáo lý viên đại diện.
- Trạng thái.
- Cảnh báo.
- Thao tác.

Mã thiếu nhi không hiển thị mặc định, chỉ trong chi tiết/admin/export khi cần.

Filter:

- Năm học.
- Ngành.
- Lớp.
- Trạng thái.
- Cảnh báo.
- Search tên/số điện thoại guardian.

### Mobile card

- Tên thánh + họ tên.
- Lớp chip.
- Guardian phone button.
- Warning badge.
- Tap mở chi tiết.

### Chi tiết

Top card:

- Thiếu nhi.
- Lớp.
- Giáo lý viên.
- Guardian.

Tabs:

1. Tổng quan.
2. Học tập.
3. Điểm danh.
4. Bí tích.
5. Sức khỏe.
6. Lịch sử lớp.

Không có tab `Đề xuất chuyển lớp`.

Sức khỏe/bí tích chỉ render nếu permission.

## 9. Trang Lớp học

Group theo 5 ngành.

Mỗi ngành là section có icon và số lớp. Mỗi lớp là card:

- Tên lớp.
- Sĩ số.
- GLV đại diện.
- Số GLV/Dự trưởng.
- Tỷ lệ chuyên cần gần nhất.
- Buổi tiếp theo.
- Badge A/B.

Tap/click vào card mở chi tiết.

Chi tiết lớp:

- Header + team.
- Roster.
- Điểm danh.
- Kế hoạch dạy.
- Điểm.
- Nhận xét.
- Báo cáo.
- Cuối năm (chỉ quyền phù hợp).

## 10. Attendance UX

Đây là màn hình quan trọng nhất.

### Header

- Lớp.
- Ngày.
- Thứ Năm/Chúa nhật.
- Người đang điểm danh.
- Trạng thái session.
- Auto-save status/last saved.

### Roster

Desktop:

| Tên | Thánh lễ | Giáo lý | Ghi chú |
|---|---|---|---|

Mobile:

- Một card/em.
- Hai segmented control lớn.
- Quick actions.

Defaults là Có mặt.

Quick filter:

- Chỉ hiện em không có mặt.
- Có đơn xin nghỉ.
- Cảnh báo.
- Search.

Actions:

- `Bắt đầu điểm danh`.
- `Lưu`.
- `Hoàn tất`.
- `Tiếp quản`.
- `Mở khóa` chỉ SA.

Không dùng checkbox mơ hồ. Status label phải rõ.

Confirm trước finalize:

```text
Có mặt: 52
Vắng có phép: 2
Vắng không phép: 1
Đi trễ: 3
Về sớm: 0
```

## 11. Teaching plan UX

- Calendar/list toggle.
- Row inline edit trên desktop.
- Mobile dùng form drawer.
- Người dạy dropdown chỉ staff của lớp.
- Tuần assessment hiển thị badge `Kiểm tra`.
- Parent/student view chỉ read-only card tuần tới.

## 12. Gradebook UX

- Sticky student column.
- Assessment dynamic columns.
- Không render sẵn bộ cột cố định; lớp chỉ thấy các assessment Giáo lý viên đã tạo và có thể chỉ có Giữa kỳ + Cuối kỳ.
- Giáo lý viên có thể thêm nhiều cột cùng loại hoặc bỏ hẳn một loại, gồm kiểm tra 15 phút.
- Horizontal scroll desktop.
- Mobile chọn từng assessment hoặc từng student, không ép full spreadsheet.
- Empty = chưa nhập, không hiển thị 0.
- Input 0..10.
- Hệ số hiển thị ở header và sửa được tại form cột trước khi gradebook lock.
- Lock state rõ.
- Export giữ filter.

Top 5:

- Separate panel.
- Preview trước publish.
- Toggle publish.
- Badge nguồn điểm.

## 13. Ban UX

Grid Ban.

Card:

- Tên Ban.
- Trưởng/Phó.
- Số thành viên.
- Lịch họp tiếp theo.
- Công việc tuần.

Chi tiết tabs:

- Tổng quan.
- Thành viên.
- Thông báo.
- Lịch họp.
- Công việc tuần.
- Thiết bị nếu Ban Kỹ thuật.

## 14. Notifications

- Badge unread.
- Filter unread/all.
- Scope chip.
- Read state.
- Click deep-link vào đúng module.
- Deep-link phải tồn tại; không tạo notification trỏ route chưa triển khai.

## 15. Forms và validation

- Label trên input.
- Required marker.
- Error dưới field.
- Không xóa dữ liệu form khi server error.
- Normalize phone.
- Date picker + input manual.
- Confirm modal cho archive/lock/finalize.
- Không dùng toast làm nơi duy nhất chứa lỗi nghiêm trọng.

## 16. Accessibility

- Semantic HTML.
- Keyboard focus.
- `aria-live` cho save/error.
- Icon luôn có label/tooltip.
- Contrast AA.
- Không chỉ dùng màu để biểu thị trạng thái.
- Bảng có caption hoặc heading.
- Modal trap focus.
- Mobile zoom không bị chặn.

## 17. Empty/loading/error

Mỗi trang phải có:

- Skeleton/loading.
- Empty state có hướng dẫn.
- Permission denied rõ.
- 404.
- Error retry.
- Không để raw Supabase error.

## 18. Logo và icon

User sẽ cung cấp logo Giáo xứ/Xứ đoàn. Cho đến khi có:

- Dùng placeholder text.
- Không tự vẽ logo tôn giáo sai.
- Không coi Luce là mascot mặc định.
- Icon ngành tách config để thay asset sau.
