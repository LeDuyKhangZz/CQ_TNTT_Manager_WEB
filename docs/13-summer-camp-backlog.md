# 13 — Module Sa mạc thiếu nhi — Backlog Phase 8

## 1. Trạng thái

- Là module phát hành cuối cùng.
- Chưa được phép triển khai trước khi Phase 1–7 ổn định.
- Nghiệp vụ phức tạp, phải hỏi lại user trước khi migration/code.

## 2. Đã chốt

- Chỉ Sa mạc dành cho thiếu nhi.
- Phụ huynh đăng ký con trên web.
- Có `Sa mạc trưởng` riêng cho từng Sa mạc.
- Sa mạc trưởng là event assignment, không phải primary role.
- Có Sa mạc phí.
- Sa mạc trưởng công bố biên lai.
- Phụ huynh xem biên lai.
- Không cần giấy đồng ý trong bản đã thảo luận.
- Không cần điểm danh lên đường/đến nơi/ra về.
- Không cần Excel/PDF theo quyết định hiện tại.
- Không tự động biến người thành role mới.

## 3. Câu hỏi phải hỏi lại

### Phạm vi

- Sa mạc 1 ngày hay nhiều ngày?
- Có giới hạn tuổi/ngành/lớp?
- Capacity?
- Waitlist?
- Đăng ký có deadline?
- Hủy đăng ký?

### Phí

- Một mức phí hay theo nhóm?
- Cash/chuyển khoản?
- Ai xác nhận tiền ngoài Sa mạc trưởng?
- Có thanh toán một phần?
- Hoàn tiền?
- Miễn/giảm?
- Biên lai có số tự tăng?
- Biên lai có ảnh/chứng từ?
- Khi đã publish có sửa được không?
- Nếu sửa cần void/reissue hay update?
- Đây là điểm cần cân nhắc lưu lịch sử bất biến dù hệ thống chung bỏ audit.

### Tổ chức

- Xe đưa đón.
- Lều/phòng.
- Nhóm/đội.
- Trưởng nhóm.
- Thực đơn.
- Vật dụng.
- Y tế/dị ứng.
- Người liên hệ khẩn cấp.
- Sự cố.
- Lịch chương trình.
- Thông báo.

### Quyền

- Ai tạo Sa mạc?
- Ai assign Sa mạc trưởng?
- Trưởng/Phó ngành có quản lý đăng ký ngành?
- Thủ quỹ có xem/xác nhận?
- Phụ huynh có upload biên lai chuyển khoản?
- Thiếu nhi có tự xem?

## 4. Schema dự kiến, chưa migrate

### `camps`

- name.
- code.
- start/end.
- location.
- description.
- registration open/close.
- capacity nullable.
- fee amount integer VND.
- status.

### `camp_role_assignments`

- camp_id.
- staff_profile_id.
- role: leader/organizer/accounting/medical/other.
- dates.

### `camp_registrations`

- camp_id.
- student_id.
- guardian_id.
- status pending/approved/cancelled.
- registered_at.
- note.
- special_health_snapshot.

### `camp_fees`

- registration_id.
- amount_due.
- amount_paid.
- status unpaid/partial/paid/refunded/waived.
- integer VND.

### `camp_payment_receipts`

- receipt_number.
- registration_id.
- amount.
- payment_method.
- paid_at.
- confirmed_by.
- published_at.
- status issued/void/refunded.
- note.
- receipt_file_path optional.

Receipt published phải immutable hoặc dùng void/reissue; không update im lặng.

## 5. Security gates

- Guardian chỉ đăng ký own child.
- Child đúng eligibility.
- Camp leader only assigned camp.
- Amount không client-controlled.
- Receipt confirm server-side.
- Guardian không tự set paid.
- Treasurer chỉ access nếu assigned/policy.
- Private receipt storage.
- No cross-camp leakage.
- Double payment idempotency.

## 6. UI dự kiến

### Parent

- Danh sách Sa mạc mở.
- Eligibility.
- Đăng ký.
- Trạng thái.
- Phí.
- Biên lai.
- Thông báo/lịch.

### Camp leader

- Dashboard.
- Registration list.
- Fee status.
- Publish receipt.
- Roles.
- Program.

## 7. Phase 8 gate

Không gọi module hoàn tất nếu chưa:

- Chốt câu hỏi mở.
- Test financial integrity.
- Test guardian ownership.
- Test receipt immutability.
- Verify production-like workflow.
