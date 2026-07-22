# 01 — Business Analysis

## 1. Tóm tắt sản phẩm

`CQ TNTT Manager` là web/PWA nội bộ dành cho Giáo xứ Chợ Quán để quản lý khoảng 900 thiếu nhi và 19 lớp.

Sản phẩm ưu tiên ba mục tiêu:

1. Điểm danh nhanh, đúng và dễ dùng trên điện thoại.
2. Quản lý tập trung hồ sơ, lớp, giáo án, điểm và chuyển lớp.
3. Cung cấp đúng dữ liệu cho đúng người theo role/phạm vi.

Đây không phải phần mềm quản lý toàn bộ cơ cấu TNTT. Bản đầu **không quản lý phân đoàn, chi đoàn, đội, đội trưởng hoặc đội phó**.

## 2. Phạm vi đã chốt

### 2.1 Trong phạm vi

- Dashboard theo role.
- Năm học.
- 5 ngành.
- 19 lớp mặc định: 18 lớp giáo lý thuộc 5 ngành và 1 lớp Dự trưởng trong HK1.
- Ấu 1..3 và Thiếu 1..2 có nhánh A/B; Thiếu 3 là một lớp, không chia nhánh.
- Không có Chiên Con 3.
- Hồ sơ thiếu nhi.
- Một người giám hộ cho mỗi thiếu nhi.
- Hồ sơ Huynh trưởng/Giáo lý viên/Dự trưởng.
- Phân công nhân sự vào lớp.
- Điểm danh thứ Năm và Chúa nhật.
- Điểm danh sự hiện diện Giáo lý viên.
- Kế hoạch giáo án cả năm.
- Phân công người dạy theo tuần/ngày.
- Bài kiểm tra động và bảng điểm thang 10.
- Điểm chuyên cần do hệ thống đề xuất, Giáo lý viên có thể sửa.
- Nhận xét công khai và ghi chú nội bộ.
- Top 5 bật/tắt.
- Chuyển lớp cuối năm.
- Bí tích và điều kiện cuối ngành.
- Cổng phụ huynh.
- Cổng thiếu nhi từ ngành Ấu Nhi.
- Ban, thông báo Ban, lịch họp, công việc tuần.
- Thiết bị và mượn/trả cho Ban Kỹ thuật.
- Thông báo trong web.
- Báo cáo tuần/tháng/năm học; Excel/PDF.
- Báo cáo snapshot.
- PWA.
- Import Excel từ dữ liệu Google Sheets.
- Sa mạc thiếu nhi ở bản cuối.

### 2.2 Ngoài phạm vi v1

- Phân đoàn, chi đoàn, đội.
- Quản lý chuyên hiệu/kỹ năng TNTT.
- Hoạt động bác ái/phong trào.
- Học phí giáo lý.
- Chat nội bộ/Zalo/SMS/email.
- Đăng ký sự kiện thông thường.
- Kho tổng quát ngoài Ban Kỹ thuật.
- Xếp lớp tự động.
- Danh sách chờ.
- Multi-parish/multi-tenant.
- Dark mode.
- Đa ngôn ngữ.
- App native.
- Public sign-up.
- Ảnh hồ sơ thiếu nhi.
- Phụ huynh sửa hoặc đề nghị sửa hồ sơ.

## 3. Người dùng và mục tiêu

### 3.1 Super Admin

Người dùng dự kiến: Khang Nhỏ và Mr. Đạt.

Mục tiêu:

- Cấu hình toàn hệ thống.
- Quản lý tài khoản: tạo, sửa username, đặt mật khẩu mới, vô hiệu hóa và xóa account không phải Super Admin.
- Mở khóa điểm danh/bảng điểm.
- Quản lý năm học, role và phạm vi.
- Import dữ liệu.
- Xem/sửa mọi module.
- Không được xem mật khẩu hiện tại vì hệ thống không lưu mật khẩu dạng đọc được.
- Không tự sửa/xóa account đang đăng nhập và không sửa/xóa account Super Admin khác qua luồng quản trị thông thường.
- Xóa account chỉ xóa khả năng đăng nhập/role; hồ sơ nhân sự, guardian và student phải được giữ lại rồi bỏ liên kết account.

### 3.2 Cấp cao Xứ đoàn

- Cha sở: chỉ xem và báo cáo.
- Cha phó/Tuyên úy: chỉ xem và báo cáo.
- Xứ đoàn trưởng: xem và chỉnh sửa toàn hệ thống.
- Phó Xứ đoàn: xem và chỉnh sửa toàn hệ thống.
- Thư ký: xem và chỉnh sửa toàn hệ thống.
- Thủ quỹ: quyền giới hạn; không sửa điểm, điểm danh, hồ sơ sức khỏe hoặc phân lớp.

### 3.3 Trưởng/Phó ngành

Role hiển thị luôn kèm ngành:

- Trưởng ngành Chiên Con.
- Trưởng ngành Ấu Nhi.
- Trưởng ngành Thiếu Nhi.
- Trưởng ngành Nghĩa Sĩ.
- Trưởng ngành Hiệp Sĩ.
- Các Phó ngành tương ứng.

Mục tiêu:

- Xem/sửa dữ liệu trong ngành.
- Xem tất cả lớp của ngành.
- Duyệt đề nghị chuyển lớp.
- Xuất báo cáo ngành.
- Nếu được phân công vào một lớp, có thể thực hiện nghiệp vụ lớp đó.

### 3.4 Giáo lý viên đại diện

Mọi account mang role Giáo lý viên (`group_leader`, `deputy_group_leader`, `secretary`, `treasurer`, role ngành và role lớp) bắt buộc liên kết đúng một `staff_profiles` record. Với role lớp, hồ sơ đó còn phải đang được phân công vào chính lớp với capacity tương ứng. Super Admin và Cha sở/Cha phó không bị ép liên kết hồ sơ GLV.

- Quản lý lớp được phân công.
- Tạo kế hoạch giảng dạy năm.
- Phân công người dạy.
- Điểm danh.
- Nhập điểm/nhận xét.
- Đề nghị chuyển lớp.
- Khóa bảng điểm.
- Bật/tắt Top 5 nếu Super Admin đã bật tính năng.

### 3.5 Giáo lý viên lớp

- Xem thiếu nhi lớp.
- Điểm danh.
- Nhập điểm và nhận xét.
- Xem số điện thoại người giám hộ.
- Xem sức khỏe cần thiết.
- Không tạo kế hoạch năm, không đề nghị chuyển lớp, không khóa bảng điểm.

### 3.6 Dự trưởng phụ tá

Quyền gần giống Giáo lý viên lớp, nhưng thao tác nhập điểm/nhận xét có thể được Super Admin bật/tắt bằng cấu hình. Không phải một ngành.

### 3.7 Phụ huynh/người giám hộ

- Một thiếu nhi có đúng một người giám hộ.
- Một người giám hộ có thể có nhiều con.
- Xem con, điểm danh, điểm, nhận xét công khai, lịch học, bài tuần tới, thông báo, Top 5.
- Gửi đơn xin phép nghỉ.
- Không xem lịch sử bí tích.
- Không chỉnh sửa hồ sơ.
- Nếu người dùng đồng thời là Giáo lý viên và phụ huynh, giữ role Giáo lý viên nhưng có thêm mục `Con của tôi`.
- Account có primary role `guardian` bắt buộc liên kết `guardians.profile_id`; không tạo account guardian rời hồ sơ.

### 3.8 Thiếu nhi

Có tài khoản từ ngành Ấu Nhi.

Account role `student` bắt buộc liên kết `students.profile_id`; không tạo account student rời hồ sơ.

- Xem bản thân.
- Xem lịch/bài tuần tới/người dạy.
- Xem điểm danh, điểm, nhận xét công khai.
- Xem Top 5 nếu được bật.
- Không xem ghi chú nội bộ hoặc dữ liệu em khác.

## 4. Quy tắc lớp và năm học

### 4.1 Năm học

- Thường bắt đầu khoảng tháng 9 và kết thúc khoảng tháng 5.
- Ngày chính xác cấu hình từng năm.
- Chỉ một năm học có trạng thái `current`.
- Dữ liệu nghiệp vụ phải gắn với năm học.
- Giữ lịch sử tối thiểu 5 năm.

### 4.2 Một thiếu nhi chỉ có một lớp chính

Trong một năm học, một thiếu nhi chỉ có một enrollment mở.

Có thể:

- Tạm nghỉ rồi quay lại.
- Học lại.
- Chuyển nhánh A/B.
- Nghỉ hẳn.

Không hard delete hồ sơ; chuyển sang archived/withdrawn.

### 4.3 Tách lớp

Ấu Nhi và Thiếu Nhi dùng A/B mặc định. Schema vẫn mô hình hóa `sector + level + section` để không phụ thuộc tên chuỗi.

Mặc định chuyển lớp giữ nhánh:

- Ấu 1A → Ấu 2A.
- Thiếu 2B → Thiếu 3.

Người duyệt có thể chuyển A ↔ B.

### 4.4 Lộ trình

```text
Chiên Con 1 → Chiên Con 2
→ Ấu 1A/B → Ấu 2A/B → Ấu 3A/B
→ Thiếu 1A/B → Thiếu 2A/B → Thiếu 3
→ Nghĩa 1 → Nghĩa 2 → Nghĩa 3
→ Hiệp 1 → Hiệp 2
→ Đề xuất trở thành Dự trưởng
```

Lớp Dự trưởng đầu năm chỉ hoạt động trong HK1 và vẫn được tính là một lớp trong tổng 19 lớp. Đây là lớp chuyển tiếp, không phải ngành thứ sáu và không làm thay đổi quy tắc Hiệp 2 chỉ đề xuất trở thành Dự trưởng.

## 5. Hồ sơ thiếu nhi

### 5.1 Trường cốt lõi

- Mã thiếu nhi tự sinh, ẩn ở phần lớn UI.
- Tên thánh.
- Họ tên.
- Giới tính.
- Ngày sinh.
- Ngày bổn mạng.
- Địa chỉ.
- Số điện thoại thiếu nhi, tùy chọn.
- Số điện thoại người giám hộ.
- Ghi chú.
- Tick hoàn cảnh khó khăn.
- Trạng thái.

Không có:

- Ảnh thiếu nhi.
- Trường học văn hóa.
- Lớp văn hóa.
- Ngày gia nhập giáo xứ.
- Nơi sinh/quê quán/giấy khai sinh.
- Tên ở nhà.

### 5.2 Bí tích

Quản lý:

- Rửa tội.
- Xưng tội lần đầu.
- Rước lễ lần đầu.
- Thêm sức.
- Bao đồng.
- Loại khác có cấu hình.

Thông tin có thể gồm ngày, nơi, số sổ, ghi chú; các field không áp dụng được để null.

Phụ huynh và thiếu nhi không xem lịch sử bí tích trong v1.

### 5.3 Sức khỏe

- Dị ứng.
- Tình trạng sức khỏe cần lưu ý.
- Thuốc/ghi chú khẩn cấp.
- Người có quyền xem: nhân sự thuộc lớp, Trưởng/Phó ngành, cấp cao phù hợp, Super Admin.
- Không hiển thị trong danh sách tổng.

## 6. Điểm danh

### 6.1 Loại buổi

- `THURSDAY`
- `SUNDAY`

Không có loại buổi khác trong v1.

### 6.2 Hai kết quả độc lập

Mỗi thiếu nhi trong một session có:

1. Kết quả Thánh lễ.
2. Kết quả học giáo lý.

Các trạng thái:

- Có mặt.
- Vắng có phép.
- Vắng không phép.
- Đi trễ.
- Về sớm.

Đi trễ vẫn được xem là có mặt nhưng tính tỷ lệ thấp hơn.

### 6.3 Trải nghiệm

- Khi bắt đầu, mặc định toàn bộ roster là có mặt.
- Giáo lý viên đọc tên và chỉ sửa các em vắng/trễ/về sớm.
- Một người giữ quyền chỉnh sửa tại một thời điểm.
- Người khác thấy tên người đang điểm danh.
- Sau 15 phút không hoạt động, người khác trong lớp được tiếp quản.
- Sau khi hoàn tất, phụ huynh/thiếu nhi thấy kết quả.
- Sau 3 ngày session tự khóa.
- Chỉ Super Admin được mở/sửa sau khóa.
- Không lưu before/after audit history; chỉ `updated_at`, `updated_by`.

### 6.4 Điểm danh Giáo lý viên

Ở cả thứ Năm và Chúa nhật:

- Có mặt.
- Vắng có phép.
- Vắng không phép.

Chỉ thống kê số buổi hiện diện, không thống kê số buổi giảng bài.

### 6.5 Cảnh báo

- Vắng 2 buổi liên tiếp.
- Vắng 3 Chúa nhật liên tiếp.
- Tỷ lệ chuyên cần dưới ngưỡng.
- Có học giáo lý nhưng không dự lễ.
- Có dự lễ nhưng không học giáo lý.
- Đi trễ nhiều lần.
- Vắng không phép nhiều lần.

Cảnh báo không tự động giữ lớp.

## 7. Giáo án và lịch dạy

Mỗi lớp có kế hoạch năm do Giáo lý viên đại diện tạo.

Mỗi dòng:

- Tuần/ngày.
- Tên bài.
- Mục tiêu.
- Nội dung giáo lý.
- Nội dung Thánh Kinh.
- Trò chơi.
- Bài hát.
- Bài tập.
- Tài liệu.
- Bài cần chuẩn bị.
- Người dạy.
- Ghi chú.
- Loại `lesson` hoặc `assessment`.

Không có:

- Quy trình duyệt.
- Trạng thái nháp/đã duyệt.
- Thư viện tái sử dụng.
- Lý do đổi người dạy.
- Bài kéo dài nhiều tuần.
- Nhắc tự động.

Phụ huynh/thiếu nhi thấy:

- Tên bài tuần sau.
- Bài cần chuẩn bị.
- Người dạy hoặc nhãn kiểm tra.

## 8. Kết quả học tập

### 8.1 Cột động

Không tạo cột database mới mỗi lần kiểm tra. Mỗi bài kiểm tra là một record và trở thành một cột động trong bảng điểm.

Các loại được hỗ trợ:

- Kiểm tra 15 phút.
- Giữa kỳ.
- Cuối kỳ.
- Chuyên cần.
- Kiểm tra phát sinh.

Giáo lý viên phụ trách lớp tự quyết định số lượng cột và loại cột cần dùng cho lớp mình. Không có số cột tối thiểu/tối đa theo từng loại, không tự sinh bộ cột cố định và không bắt buộc phải có cột kiểm tra 15 phút. Ví dụ một lớp có thể chỉ dùng hai cột `Giữa kỳ` và `Cuối kỳ`; một lớp khác có thể có nhiều bài 15 phút hoặc bài phát sinh.

Thang điểm 10.

Hệ số mặc định:

```text
15 phút/phát sinh: 1
Giữa kỳ: 2
Cuối kỳ: 3
Chuyên cần: 1
```

Khi tạo cột, hệ thống lấy hệ số mặc định theo loại. Giáo lý viên phụ trách lớp có thể đổi hệ số riêng của từng cột thành số dương trước khi bảng điểm bị khóa; hệ thống phải tính lại điểm trung bình có trọng số. Super Admin cấu hình hệ số mặc định theo năm học và có thể sửa ở mọi lớp.

### 8.2 Điểm chuyên cần

- Hệ thống đề xuất từ attendance.
- Có mặt: 100%.
- Đi trễ/về sớm: mặc định 80%.
- Vắng có phép: mặc định 50%.
- Vắng không phép: 0%.
- Giá trị trên là cấu hình.
- Giáo lý viên có thể điều chỉnh trước khi khóa bảng điểm.

### 8.3 Nhận xét

Tách hai loại:

- `student_visible`: phụ huynh/thiếu nhi xem được.
- `staff_only`: chỉ nhân sự đúng phạm vi xem.

### 8.4 Khóa bảng điểm

- Giáo lý viên đại diện khóa.
- Chỉ Super Admin mở lại.
- Không lưu full audit trước/sau.
- Xuất kết quả tất cả thiếu nhi trong lớp ra Excel/PDF.

### 8.5 Top 5

- Super Admin bật tính năng toàn hệ thống.
- Giáo lý viên đại diện bật/tắt từng lớp/bảng.
- Có thể công bố trước khi có điểm tổng kết cuối năm.
- Nguồn: bài kiểm tra cụ thể, điểm tạm, đợt thi đua, điểm tùy chỉnh hoặc điểm tổng kết.
- Hiển thị tên thánh + họ tên đầy đủ + điểm + thứ hạng.
- Chỉ Top 5, không công khai toàn bộ bảng xếp hạng.

## 9. Chuyển lớp cuối năm

- Không hiển thị trên trang chi tiết thiếu nhi.
- Giáo lý viên đại diện đề nghị.
- Trưởng ngành duyệt.
- Cảnh báo chỉ để tham khảo.
- Có thể vẫn lên lớp dù nghỉ nhiều/điểm thấp theo quyết định mục vụ.
- Trạng thái: lên lớp, học lại, tạm nghỉ, nghỉ học, chưa quyết định.
- Tạo enrollment mới; không sửa enrollment lịch sử.
- Lớp cuối ngành mới xét điều kiện bí tích.
- Hiệp 2 có thể được đề xuất thành Dự trưởng; không tự động tạo role.

## 10. Ban

Ban mặc định:

- Ban Sinh hoạt.
- Ban Kỹ thuật.
- Ban Phụng vụ.
- Ban Truyền thông.
- Ban Quản lý.
- Ban Y tế.

Có thể thêm Ban.

Mỗi người tối đa hai Ban.

Chức vụ:

- Cố vấn tối cao.
- Trưởng ban.
- Phó ban.
- Thành viên.

Trang Ban:

- Thành viên.
- Trưởng/phó/cố vấn.
- Thông báo.
- Lịch họp.
- Công việc tuần.

Chỉ Trưởng ban/Phó ban tạo nội dung. Thành viên chỉ thấy Ban mình; Super Admin có thể thấy tất cả.

### Ban Kỹ thuật

Quản lý:

- Thiết bị.
- Số lượng.
- Tình trạng.
- Vị trí.
- Ai mượn, lúc nào.
- Ai trả, lúc nào.
- Người bàn giao/nhận.
- Ghi chú.
- Báo hỏng.
- Trạng thái mượn/trả.

## 11. Thông báo

- Chỉ trong web.
- Có đã đọc/chưa đọc.
- Target: toàn hệ thống, ngành, lớp, Ban, người dùng, phụ huynh, thiếu nhi.
- Không chat.
- Không lịch gửi.
- Không SMS/email/Zalo.
- Không thông báo khẩn riêng.

## 12. Dashboard và báo cáo

Dashboard có thể hiển thị theo quyền:

- Tổng thiếu nhi.
- Tổng Giáo lý viên.
- Tổng lớp.
- Tỷ lệ dự lễ.
- Tỷ lệ học giáo lý.
- Chuyên cần tuần/tháng/năm học.
- Thiếu nhi vắng liên tiếp.
- Điểm thấp/cần quan tâm.
- Sinh nhật/bổn mạng.
- Buổi học sắp tới.
- Thông báo.
- Các lớp sắp kiểm tra.
- Hồ sơ thiếu dữ liệu.
- Công việc Ban.

Bỏ:

- Tỷ lệ thiếu nhi/Giáo lý viên.
- So sánh thi đua giữa ngành.
- Lớp chưa điểm danh.
- Lớp chưa có giáo án.
- Sắp lãnh bí tích.

Báo cáo:

- Tuần, tháng, năm học.
- Theo lớp/ngành.
- Excel rất quan trọng.
- PDF có logo/chữ ký.
- Xuất phải giữ nguyên filter/date range đang chọn.
- Snapshot đã chốt không thay đổi theo dữ liệu sau này.
- Lưu 5 năm.

## 13. Tài khoản

### Username

- Thiếu nhi: `CQ0001`, `CQ0002`, ...
- Giáo lý viên: `GLV001`, `GLV002`, ...
- Phụ huynh: số điện thoại chuẩn hóa.
- Cấp cao/Super Admin: mã ngắn do Super Admin cấp.

### Mật khẩu

- Mật khẩu tạm 8 ký tự chữ thường + số.
- Bắt buộc đổi lần đầu.
- Super Admin được đặt lại mật khẩu, không xem mật khẩu hiện tại.
- Không dùng ngày sinh/số điện thoại làm mật khẩu.
- Không dùng một mật khẩu chung cho cả lớp.
- Khóa tạm khi sai nhiều lần.

## 14. Sa mạc

- Chỉ Sa mạc thiếu nhi.
- Phát hành cuối cùng.
- Phụ huynh đăng ký trên web.
- Có Sa mạc trưởng theo từng Sa mạc, không phải role chính.
- Có Sa mạc phí.
- Sa mạc trưởng công bố biên lai; phụ huynh xem.
- Không giấy đồng ý trong v1 module.
- Không điểm danh lên đường/đến nơi/ra về.
- Các phần xe/lều/thực đơn/y tế/sự cố sẽ hỏi lại khi bắt đầu Phase 8.
