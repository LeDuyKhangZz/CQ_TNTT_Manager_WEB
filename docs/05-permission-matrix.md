# 05 — Permission Matrix

## 1. Nguyên tắc

- Một người chỉ có một role hệ thống active.
- Role ngành luôn kèm `sector_id`.
- Role lớp luôn kèm `class_id`.
- Một người có role cao hơn vẫn có thể có `class_staff_assignment` để đứng lớp.
- Chức vụ Ban/Sa mạc không thay primary role.
- `view` không mặc định bao gồm `export`.
- `edit` không mặc định bao gồm `manage_accounts`, `unlock`, `delete`, `role_assignment`.
- Cha sở và Cha phó/Tuyên úy chỉ xem/báo cáo.
- Xứ đoàn trưởng, Phó Xứ đoàn và Thư ký có global write.
- Thủ quỹ là global limited.
- Super Admin là role duy nhất quản lý account/password/reset/unlock hệ thống.

## 2. Ký hiệu

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Được phép |
| 👁 | Chỉ xem |
| 📍 | Chỉ trong scope |
| ⚙ | Tùy cấu hình |
| ❌ | Không được |
| SA | Chỉ Super Admin |

## 3. Module-level matrix

| Module | Super Admin | Cha sở | Cha phó/TU | XĐ trưởng | Phó XĐ | Thư ký | Thủ quỹ | Trưởng/Phó ngành | GLV đại diện | GLV lớp | Dự trưởng | Phụ huynh | Thiếu nhi |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | 📍 | 📍 | 📍 | 📍 | bản thân/con | bản thân |
| Năm học | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | 👁📍 | 👁📍 | 👁📍 | 👁📍 | ❌ | ❌ |
| Ngành/lớp | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | ✅📍 | 👁📍 | 👁📍 | 👁📍 | lớp con | lớp mình |
| Thiếu nhi | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | giới hạn | ✅📍 | ✅📍 | ✅📍 | 👁/⚙📍 | con | bản thân |
| Sức khỏe | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | ❌ | ✅📍 | ✅📍 | ✅📍 | 👁📍 | ❌ | ❌ |
| Bí tích | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | ❌ | ✅📍 | ✅📍 | ✅📍 | 👁📍 | ❌ | ❌ |
| Nhân sự | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | danh sách cơ bản | ✅📍 | 👁 lớp | 👁 lớp | 👁 lớp | ❌ | ❌ |
| Điểm danh | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 báo cáo | 👁 ngành + edit lớp mình | ✅ lớp | ✅ lớp | ✅ lớp | xem con | xem mình |
| Giáo án | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | 👁 ngành | ✅ create/edit lớp | 👁 | 👁 | xem tuần tới | xem tuần tới |
| Điểm số | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 tổng hợp không nhạy cảm | 👁/edit📍 | ✅📍 | ✅📍 | ⚙📍 | xem con | xem mình |
| Chuyển lớp | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | ❌ | duyệt📍 | đề nghị📍 | ❌ | ❌ | ❌ | ❌ |
| Top 5 | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | 👁📍 | create/publish📍 | 👁📍 | 👁📍 | xem lớp con | xem lớp |
| Ban | ✅ | 👁 nếu thành viên/toàn cục theo policy | như trái | ✅ | ✅ | ✅ | nếu membership | ban mình | ban mình | ban mình | ban mình | ❌ | ❌ |
| Thiết bị | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁 | nếu Ban KT | nếu Ban KT | nếu Ban KT | nếu Ban KT | ❌ | ❌ |
| Thông báo | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | giới hạn | tạo theo ngành | tạo theo lớp nếu được cấu hình | 👁 | 👁 | xem | xem |
| Báo cáo | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | 👁/export giới hạn | 👁/export📍 | 👁/export lớp | 👁 lớp | 👁 lớp | xem con | xem mình |
| Quản trị tài khoản | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sa mạc Phase 8 | ✅ | 👁 | 👁 | ✅ | ✅ | ✅ | phí theo phân công | theo assignment | theo assignment | theo assignment | theo assignment | đăng ký/xem biên lai | xem |

## 4. Chi tiết role

### 4.1 `super_admin`

Được mọi thao tác, gồm:

- Tạo/sửa/khóa/xóa account không phải Super Admin; xóa account không xóa hồ sơ nghiệp vụ.
- Đổi username.
- Reset password.
- Gán role/scope.
- Mở khóa điểm danh/bảng điểm.
- Import.
- Cấu hình hệ số mặc định theo năm học; sửa hệ số ở mọi lớp.
- Bật Top 5.
- Sửa mọi scope.

Không thể xem mật khẩu hiện tại.

### 4.2 `parish_priest`, `chaplain`

- Read toàn hệ thống.
- Export báo cáo.
- Không insert/update/delete nghiệp vụ.
- Không account admin.
- Không mở khóa.

### 4.3 `group_leader`

- Global read/write.
- Không account/password admin.
- Không thay Super Admin role.
- Không xem mật khẩu.
- Có thể quản lý năm học/lớp/hồ sơ/attendance/grade/report theo workflow.
- Không bypass RLS bằng service role.

### 4.4 `deputy_group_leader`, `secretary`

Quyền global write tương tự Xứ đoàn trưởng, trừ các hành động reserved SA:

- account provisioning;
- reset password;
- assign super_admin;
- mở khóa sau khi policy chỉ dành SA;
- hệ thống secrets.

### 4.5 `treasurer`

Cho phép:

- Dashboard tổng hợp.
- Danh sách cơ bản cần thiết.
- Báo cáo tổng hợp.
- Phase 8: xem phí/biên lai nếu được phân công.

Cấm:

- Điểm chi tiết/nhận xét.
- Sửa điểm danh.
- Sửa lớp.
- Sức khỏe/bí tích.
- Account.
- Chuyển lớp.
- Ghi chú nội bộ.

### 4.6 `sector_leader`, `sector_deputy`

Scope bắt buộc sector.

- Read/write student/staff/class trong sector.
- View mọi attendance/score/plan trong sector.
- Duyệt promotion trong sector.
- Export sector.
- Chỉ được trực tiếp điểm danh/nhập điểm ở class có `class_staff_assignment` của chính mình; không tự sửa attendance của mọi lớp chỉ vì là Trưởng ngành, trừ khi user sau này chốt khác.
- Không access sector khác.

Tên UI = role + sector.

### 4.7 `class_representative`

- Full class operational access.
- Create/edit teaching plan.
- Assign teacher trong roster.
- Attendance.
- Assessment.
- Comments.
- Promotion proposal.
- Lock gradebook.
- Publish Top 5.
- Không đổi roster nhân sự nếu policy giữ ở cấp ngành/global.
- Không unlock.

### 4.8 `class_teacher`

- Attendance.
- Score/comment.
- View student/guardian contact/health.
- Không plan owner.
- Không promotion.
- Không gradebook lock.
- Không account.

### 4.9 `trainee_assistant`

- Attendance.
- View class.
- Score/comment theo feature flags:
  - `trainee_can_grade`.
  - `trainee_can_comment`.
- Không plan/promotion/lock.

### 4.10 `guardian`

- Ownership qua guardian_id/profile_id.
- Read child dashboard/attendance/score/visible comments/next lesson/notifications/Top 5.
- Create absence request cho con.
- Không update student profile.
- Không sacraments/health/staff note.

### 4.11 `student`

- Ownership qua student.profile_id.
- Read self.
- Không read other student cùng lớp, ngoại trừ published Top 5 chỉ chứa 5 public entries lớp.
- Không health/sacrament/staff-only.
- Không write score/attendance.

## 5. Action matrix quan trọng

| Action | Ai được |
|---|---|
| Tạo năm học | SA, group_leader, deputy_group_leader, secretary |
| Set current year | SA, group_leader |
| Tạo/sửa class template | SA |
| Phân staff vào lớp | SA/global-write; sector leader trong sector nếu bật policy |
| Tạo student | SA/global-write; sector leader/deputy trong sector |
| Archive student | SA/global-write |
| Tạo account | SA |
| Reset password | SA |
| Đổi username/đặt password account không phải SA | SA |
| Xóa account không phải SA | SA; giữ hồ sơ nghiệp vụ và bỏ link account |
| Claim attendance | Staff assigned class |
| Takeover attendance | Staff assigned class sau lease |
| Finalize attendance | Editor hiện tại |
| Sửa locked attendance | SA |
| Tạo/sửa assessment, gồm hệ số từng cột | Representative/teacher lớp trước gradebook lock |
| Nhập score | Representative/teacher; trainee nếu flag |
| Viết nhận xét | Representative/teacher; trainee nếu flag; public hoặc staff-only |
| Lock gradebook | Representative |
| Unlock gradebook | SA |
| Create promotion proposal | Representative |
| Approve promotion | Sector leader/deputy đúng sector |
| Publish Top 5 | Representative nếu feature enabled; SA |
| Xem result portal | Guardian chỉ con mình; student chỉ chính mình; chỉ assessment/comment/Top 5 đã publish |
| Ban post/meeting/weekly plan | Committee leader/deputy |
| Borrow/return equipment | Member Ban KT có quyền; leader/deputy mặc định |
| Publish global notification | SA/global-write |
| Publish sector notification | Sector leader/deputy đúng sector |
| Publish class notification | Representative; teacher nếu flag |
| Export class | Staff lớp, sector/global role |
| Export sector | Sector/global role |
| Finalize report snapshot | Actor có export scope; policy có thể giới hạn representative trở lên |

## 6. RLS policy outline

### Students

`SELECT` nếu:

- SA/global read;
- sector role cùng sector hiện tại của enrollment;
- class staff cùng class;
- guardian owner;
- student self.

`UPDATE` nếu:

- SA/global write;
- sector write cùng sector;
- class staff chỉ field nghiệp vụ được phép qua RPC/server action, không direct unrestricted update.

### Attendance

- Staff assigned class can select/write open session.
- Sector role can select sector.
- Guardian/student select own records only after finalized.
- Locked update only SA RPC.

### Teaching plan

- Global-write hoặc representative lớp tạo/sửa/xóa kế hoạch và mục giáo án.
- Class staff xem đầy đủ giáo án; sector/global-read xem trong phạm vi tương ứng.
- Guardian/student không `SELECT` bảng gốc, chỉ gọi safe RPC cho 7 ngày tới.
- Safe RPC không trả nội dung nội bộ hoặc tài liệu.
- Bucket `teaching-materials` private: representative/global-write upload/remove; staff đúng phạm vi
  tải qua signed URL 60 giây; guardian/student không đọc object.

### Assessment scores

- Staff class select/write trước lock.
- Sector/global select.
- Guardian/student select own score only khi assessment published hoặc gradebook policy công bố.
- Không update direct sau lock.

### Comments

- `student_visible`: owner guardian/student select.
- `staff_only`: staff scope only.
- Parent/student không được suy ra count staff-only nếu không cần.

### Committee

- Member select own committee.
- Leader/deputy write content own committee.
- SA select/write all.

## 7. Feature flags

Bảng `system_settings` hoặc `academic_year_settings`:

```text
top5_enabled
trainee_can_grade
trainee_can_comment
class_teacher_can_publish_notification
sector_leader_can_manage_class_staff
```

Mặc định an toàn:

```text
trainee_can_grade = false
trainee_can_comment = false
class_teacher_can_publish_notification = false
sector_leader_can_manage_class_staff = false
```
