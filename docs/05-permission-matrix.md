# 05 — Permission Matrix

> ⚠️ **CẬP NHẬT 2026-07-23.** Các mục sau đã bị ghi đè bởi quyết định D-63, D-66, D-67, D-68,
> D-70, D-74, D-75 trong **`docs/system-workflow-redesign/06_DECISION_LOG.md`**.
> Đọc file đó trước; khi mâu thuẫn, **06_DECISION_LOG.md thắng**.
>
> | Đổi gì | Quyết định |
> |---|---|
> | Trưởng/Phó ngành **tạo/sửa được** hồ sơ thiếu nhi + guardian trong ngành mình | D-63 |
> | Cha sở/Cha phó **không chốt** báo cáo (chỉ xem/export) — gỡ mâu thuẫn §4.2 vs §6 | D-66 |
> | Thủ quỹ có mức đọc riêng (danh sách em theo lớp + SĐT guardian + sĩ số) | D-67 |
> | Cha sở/Cha phó/Thủ quỹ **vào xem được** trang điểm danh | D-68 |
> | Guardian/student **chỉ đọc lớp của mình**, không đọc toàn bộ `classes`/`academic_years` | D-70 |
> | Khóa gradebook: **GLV đại diện + GLV lớp** của chính lớp đó; global-write **không** còn khóa được. **Super Admin CÓ** — đường thoát vận hành (D-151). ✅ đã thi hành ở M07-B, `app.can_lock_gradebook` | D-74 · D-151 |
| Sửa/xóa nhận xét: **tác giả + GLV đại diện lớp + global-write**; GLV lớp và Dự trưởng phụ tá **không** đụng được bài của người khác. ✅ đã thi hành ở M07-B | D-152 |
> | Ghi chú điểm danh là **staff-only**, guardian/student không đọc | D-75 |
> | **Có full audit log**; chỉ Super Admin đọc | D-65 |

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
| Năm học *(D-112)* | ✅ | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁📍 | 👁📍 | 👁📍 | 👁📍 | ❌ | ❌ |
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

> **D-139 (chủ dự án chốt 2026-08-03) — dòng "Điểm danh" nay được thi hành đúng như đã ghi.**
> Cha sở 👁 và Cha phó 👁 có trong bảng này từ đầu, nhưng `/attendance` là màn hình **ghi** nên
> M14 A-11 đã khoá cả ba vai trò chỉ đọc để dẹp một link chết trong menu — tức mã nguồn nói ngược
> lại bảng. Từ M05-A, hai vị vào được ở **chế độ chỉ đọc**: không có form mở buổi, không có nút
> lưu/chốt, và `app.can_edit_attendance` vẫn chặn mọi RPC ghi (pgTAP `041` kiểm bằng JWT thật).
> **Thủ quỹ giữ nguyên bị chặn** — ô của họ ghi *"👁 báo cáo"*, tức xem qua trang Báo cáo (M11);
> `app.can_global_read()` cũng không có họ nên mở route chỉ dẫn tới một trang trắng.
>
> **D-75 (thi hành 2026-08-03, đợt M05-B) — GHI CHÚ ĐIỂM DANH LÀ NỘI BỘ, và chặn ở tầng dữ liệu.**
> Trước đợt này cổng phụ huynh in thẳng cột `student_attendance_records.note`, biến một ô ghi nhớ
> nội bộ thành kênh nhắn tin mà không ai định vậy. 🔴 RLS lọc theo **dòng**, không theo **cột**, và
> ở đây **không** cắt được nhánh phụ huynh khỏi policy: họ vẫn phải đọc đúng dòng của con mình
> (AC-F14 *"Portal — giữ nguyên"*), còn thẻ tổng kết chuyên cần thì cộng qua view
> `security_invoker` nên cắt dòng là mất luôn thẻ. Vì vậy chặn bằng **quyền cột**: `authenticated`
> mất quyền `select` mức bảng và được cấp lại từng cột **trừ `note`**. Sau bước này **không tài
> khoản thường nào** — kể cả Giáo lý viên — đọc được cột ấy qua Data API; nhân sự của lớp đọc qua
> cửa sổ hẹp `public.attendance_session_notes()` mang đúng ba nhánh nhân sự của policy hiện hành,
> **không** có nhánh phụ huynh/thiếu nhi. pgTAP `042` kiểm bằng JWT thật của cả năm vai trò.
> ⚠️ Đây là **siết quyền với người đang dùng**: phụ huynh đang thấy ghi chú sẽ không thấy nữa —
> phải báo trước, nếu không họ tưởng hệ thống hỏng. Cột `absence_requests.staff_note` (lời nhắn
> của Giáo lý viên khi ghi nhận đơn) **không** bị siết: đó đúng là kênh nói với phụ huynh.
>
> **D-141 (chủ dự án chốt 2026-08-03) — đơn xin nghỉ chặn theo TRẠNG THÁI BUỔI, không theo ngày.**
> Buổi đã chốt thì không nhận đơn nữa (`ABSENCE_SESSION_ALREADY_FINALIZED`); buổi còn mở thì nhận,
> kể cả cho một ngày đã qua. Khác đề xuất U-09 của `08_ACCEPTANCE_CRITERIA` (chặn mọi ngày quá
> khứ), và khác có chủ đích: con ốm sáng Chúa nhật, phụ huynh báo muộn vài giờ — lúc đó lý do vẫn
> kịp đổi "vắng không phép" thành "vắng có phép".
>
> **D-112 (chủ dự án chốt 2026-07-25) — vòng đời NĂM HỌC chỉ còn Super Admin.**
> Trước đó bảng này ghi ✅ cho Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký, nhưng cửa vào
> `/admin` — nơi duy nhất có biểu mẫu năm học — chỉ mở cho Super Admin, và RLS lại
> chặn Thư ký/Phó sửa năm đang chạy. **Ba tầng nói ba kiểu**, nên bảng này hứa một
> quyền chưa từng dùng được (BR-M02-15/16). Nay cả ba tầng nói cùng một câu: tạo năm
> học · sinh cơ cấu lớp chuẩn · đặt năm hiện hành · sửa cấu hình điểm danh đều là
> **Super Admin**. Việc **ĐỌC** năm học không đổi. Bảng `classes` **không** bị siết —
> dòng "Ngành/lớp" giữ nguyên `app.can_global_write()`.
> Cài ở `20260725000300_academic_year_super_admin_only.sql`; kiểm bằng JWT thật ở
> pgTAP `032`.

> **D-70 + D-73/D-117/D-118 (M02-C, 2026-07-26) — hai thay đổi SIẾT quyền.**
>
> **1. Đọc lớp và năm học của Phụ huynh / Thiếu nhi.** Bảng trên vẫn đúng như đã viết
> (dòng "Năm học" = ❌, dòng "Ngành/lớp" = *"lớp con"* / *"lớp mình"*) — nhưng cho tới
> trước đợt này **RLS cho đọc hết**: `using (app.current_role() is not null)` trên cả
> `classes` và `academic_years`. Một phụ huynh gọi Data API bằng JWT thật lấy được
> **toàn bộ 19 lớp** kèm phòng sinh hoạt và ghi chú, cùng **toàn bộ danh sách năm học**.
> Phạm vi mới:
> - **Lớp**: mọi lớp mà con mình / chính mình **từng ghi danh** (không chỉ năm hiện
>   hành — em chuyển lớp giữa năm thì cả hai lớp đều là lớp của em, và lịch sử năm cũ
>   mà mất tên lớp thì cổng phụ huynh sẽ in *"lớp không xác định"*).
> - **Năm học**: **năm hiện hành** + những năm con mình có ghi danh. Nhánh "năm hiện
>   hành" là bắt buộc vì thanh đầu trang hiện tên năm học cho **mọi** vai trò; chặn
>   sạch là cổng phụ huynh hiện *"Chưa đặt năm học"* — một câu **sai**.
> - ⚠️ `sectors` và `grade_levels` **KHÔNG** bị siết: chúng là danh mục tham chiếu của
>   cả giáo xứ, và siết chúng là lấy mất màu ngành của lớp con.
> - **Nhân sự không đổi gì** — D-69 chốt Trưởng ngành được xem năm cũ; mọi phạm vi hẹp
>   hơn cho nhân sự là hạng mục I10, chưa chốt.
>
> **2. Ghi vào năm học đã đóng.** `app.writable_academic_year_ids()` + hàng rào trong
> policy INSERT/UPDATE của `enrollments` và `classes`: năm `closed`/`archived` không
> nhận ghi từ **bất kỳ vai trò nào**, trừ **Super Admin** (**D-117**). ⚠️ **Phạm vi hẹp
> theo D-118**: các bảng có `academic_year_id` của M05/M06/M07/M08/M10/M11 **chưa** có
> hàng rào này — xem nợ #18 ở `16_PHASE_2B_IMPLEMENTATION_LOG.md` §3.
>
> Cài ở `20260726000200_year_write_gate.sql` và `20260726000300_portal_class_year_scope.sql`;
> kiểm bằng JWT thật ở pgTAP `034` (37 test) và `035` (18 test), trong đó có cả **bài đối
> chứng** cho nhân sự để bắt trường hợp siết quá tay.

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
- Có thể quản lý lớp/hồ sơ/attendance/grade/report theo workflow.
- 🔴 **KHÔNG** quản lý vòng đời năm học nữa (D-112, 2026-07-25): tạo năm học, sinh cơ
  cấu lớp chuẩn, đặt năm hiện hành và sửa cấu hình điểm danh đều thu về Super Admin.
  Vẫn **đọc** năm học bình thường.
- **Xóa hẳn hồ sơ nhân sự CHƯA TỪNG DÙNG** (D-106/D-109, 2026-07-24): gọi được
  RPC `public.delete_unused_staff_profile` — chỉ xóa khi hồ sơ không có tài
  khoản, không phân công lớp, và **không** bản ghi nào trong 7 bảng nghiệp vụ
  tham chiếu (`staff_profile_delete_blockers` kiểm). Quyền = `app.can_global_write()`
  ⇒ Super Admin · Xứ đoàn trưởng/Phó · Thư ký; Trưởng ngành/Thủ quỹ **không**.
  Đây là **ngoại lệ có kiểm soát** của nguyên tắc "giữ lịch sử mục vụ": chỉ áp
  cho hồ sơ tạo nhầm chưa gắn với dữ liệu nào. Bắt gõ lại đúng họ tên + ghi nhật
  ký `account_audit_events`. Không có policy DELETE trên bảng — RPC là đường duy nhất.
- Không bypass RLS bằng service role.

### 4.4 `deputy_group_leader`, `secretary`

Quyền global write tương tự Xứ đoàn trưởng, trừ các hành động reserved SA:

- toàn bộ vòng đời năm học (D-112);
- account provisioning;
- reset password;
- assign super_admin;
- mở khóa sau khi policy chỉ dành SA;
- hệ thống secrets.

Có (như Xứ đoàn trưởng): **xóa hồ sơ nhân sự chưa từng dùng** (D-106/D-109 — xem §4.3).

> **D-110 (chủ dự án duyệt 2026-07-24) — ba mức hiển thị TÌNH TRẠNG TÀI KHOẢN trên
> danh sách `/staff`.** Tên đăng nhập của người khác là dữ liệu nhạy cảm (nửa bộ
> thông tin để thử mật khẩu trên máy dùng chung). **Super Admin** thấy tên đăng nhập
> ("Đã có GLV045") + cảnh báo "⚠ Chưa gán vai trò"; **các vai trò đọc-toàn-cục khác**
> (Cha sở/phó · Xứ đoàn trưởng/phó · Thư ký · Thủ quỹ) chỉ thấy cảnh báo, KHÔNG thấy
> tên đăng nhập; **còn lại** (Trưởng ngành · GLV cùng lớp) chỉ thấy "Đã có / Chưa có".
> Ẩn ở tầng dữ liệu (`getStaffPageData` không truy vấn `role_assignments`/`profiles`
> cho mức thấp nhất), không phải giấu nút. Nhất quán với D-104 (trường nhạy cảm ở
> `/staff/[id]`).

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
- **Chuyển lớp cho nhân sự trong ngành mình** (D-105, 2026-07-24): gọi được RPC
  `public.transfer_class_staff` khi **cả lớp cũ lẫn lớp mới** đều thuộc ngành
  mình (`app.can_manage_class` trên cả hai). RPC chỉ sinh vai trò **lớp**, suy từ
  `capacity` bằng bảng cứng, nên không có đường nào cấp vai trò toàn cục/ngành.
  **Không** kéo được người từ ngành khác sang, **không** phân công được người
  chưa có lớp (không có phân công thì không có gì để chuyển).
- Vẫn **không** ghi thẳng được `staff_profiles` / `class_staff_assignments`, và
  **không** gọi được `end_class_staff_assignment` — hai việc đó là global-write
  (pgTAP `030_staff_permission_gaps_test.sql` canh cả hai).

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
- ~~Không gradebook lock.~~ → **CÓ gradebook lock** cho chính lớp mình (D-74, thi hành M07-B).
- **Không** sửa/xóa nhận xét của người khác (D-152) — chỉ nhận xét của chính mình.
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
| Tạo năm học | **SA** *(D-112 — trước là 4 vai trò ghi toàn xứ đoàn)* |
| Set current year | **SA** *(D-112 — trước là SA + group_leader)* |
| Sinh cơ cấu lớp chuẩn | **SA** *(D-112)* |
| Sửa cấu hình điểm danh năm học | **SA** *(D-112)* |
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
| Lock gradebook | **Representative + class_teacher của chính lớp đó, cộng SA** — D-74 + D-151, thi hành ở M07-B (`app.can_lock_gradebook`). Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký **không còn**; `trainee_assistant` **không**, kể cả khi năm học bật cờ chấm điểm. Gọi lần hai không đẩy lùi `locked_at` (AC-10-02) |
| Unlock gradebook | SA |
| Sửa/xóa nhận xét | **Tác giả · representative của chính lớp đó · global-write** — BR-M07-33 + D-152, thi hành ở M07-B (`app.can_moderate_student_comment`). Áp cho **cả** sửa lẫn xóa: siết mỗi xóa thì sửa nội dung vẫn đi lọt |
| Xóa cột điểm | Representative/teacher lớp, bảng điểm chưa khóa: **xóa cứng chỉ khi cột chưa có điểm thật**; cột đã có điểm chỉ **ẩn mềm** (`is_active = false`) — BR-M07-26/27/28. Hiện lại cột đã ẩn: **cùng nhóm ấy**, cũng chỉ khi chưa khóa (M07-C, nợ #21) |
| **Công bố / gỡ công bố một cột điểm** | Representative/teacher lớp (`app.can_grade_class`) — **quyền KHÔNG đổi**, nhưng từ M07-C làm được **cả khi bảng điểm đã khóa**: BR-M07-29 + D-154, qua RPC `public.set_assessment_published`. Khóa vẫn chặn tuyệt đối cấu trúc cột, hệ số, điểm và nhận xét; policy `assessments_update_grader` giữ nguyên nên lệnh gửi thẳng vào cơ sở dữ liệu vẫn bị từ chối. Không công bố được cột đang **ẩn** |
| Create promotion proposal | Representative |
| Approve promotion | Sector leader/deputy đúng sector |
| Publish Top 5 | Representative nếu feature enabled; SA |
| **Chốt lại / hiện lại / xóa một bảng Top 5** | Representative (`app.can_manage_leaderboard`) — **quyền không đổi**. Từ M07-C (D-155): *chốt lại* tính lại danh sách và **lưu bản đang có vào `leaderboard_snapshots`**; *hiện lại* chỉ bật cờ, không tính lại; **xóa chỉ được với bảng chưa từng công bố** (`published_at is null`, BR-M07-35) |
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
- Lập Ban và chức vụ Ban: global-write (WF-12). Mỗi nhân sự tối đa hai Ban đang
  hoạt động, ràng buộc ở DB chứ không chỉ ẩn nút.
- Kho thiết bị: đọc = thành viên Ban Kỹ thuật hoặc global read; mượn/trả = thành
  viên Ban Kỹ thuật hoặc global-write; sửa danh mục = Trưởng/Phó Ban hoặc global-write.
- 2B · M09-B: **nhận lại hàng** và **báo hỏng/mất** đều ở mức mượn/trả — D-93 cố ý
  giữ "báo hỏng/mất" cho mọi thành viên Ban Kỹ thuật, hàng rào là hộp xác nhận nêu
  đúng con số chứ không phải bậc quyền. **Đổi tổng kho** (`adjust_equipment_stock`)
  thì chặt hơn: Trưởng/Phó Ban hoặc global-write, vì nó thay đổi tổng tài sản.
- 2B · M09-B: ô "Người mượn" đọc qua `public.list_equipment_borrower_options` —
  chỉ trả về **họ tên + mã GLV** của nhân sự đang hoạt động và chỉ cho người thao
  tác được kho của Ban đó (D-94, D-97). Đây **không** phải một lần nới
  `app.can_access_staff`: phạm vi đọc hồ sơ nhân sự giữ nguyên.
- 2B · M09-C (D-100): thành viên **cùng một Ban đang hoạt động** đọc được **đầy đủ**
  hồ sơ nhau (họ tên, số điện thoại, ngày sinh, địa chỉ) qua nhánh thứ tư
  `app.shares_active_committee` của `app.can_access_staff`. Chủ dự án duyệt
  2026-07-24 để thành viên Ban liên lạc và phối hợp; đóng nợ #13 (trước đó tên
  người cùng Ban nhưng khác lớp hiện dấu "—"). RLS là row-level nên nới quyền đọc
  dòng là mở cả dòng — đúng điều chủ dự án chọn, khác với cửa sổ hẹp chỉ-tên của
  D-97. Có RLS negative + positive test bằng JWT thật (`pgTAP 024`).

### Notification

- Toàn hệ thống / tất cả phụ huynh / tất cả thiếu nhi / một người: global-write.
- Theo ngành: trưởng hoặc phó chính ngành đó, hoặc global-write.
- Theo lớp: đại diện chính lớp đó, trưởng/phó ngành của lớp đó, hoặc global-write.
- Theo Ban: Trưởng/Phó chính Ban đó, hoặc global-write.
- Đọc: chỉ người nằm trong danh sách nhận, tác giả, hoặc global read.

### Report

- Xem và xuất theo phạm vi: global read cho toàn xứ đoàn, trưởng/phó ngành cho
  ngành mình, GLV lớp cho lớp mình.
- Chốt báo cáo: mọi vai trò xem được phạm vi đó, trừ thủ quỹ (D-19).
- Snapshot đã chốt: không ai sửa/xóa được qua luồng người dùng.

## 7. Feature flags

Bảng `system_settings` hoặc `academic_year_settings`:

```text
top5_enabled
trainee_can_grade
trainee_can_comment
class_teacher_can_publish_notification
```

Mặc định an toàn:

```text
trainee_can_grade = false
trainee_can_comment = false
class_teacher_can_publish_notification = false
```

> **D-107 (chủ dự án duyệt 2026-07-24) — bỏ `sector_leader_can_manage_class_staff`.**
> Tài liệu này từng khai một công tắc cùng tên, mặc định `false`. Công tắc đó
> **chưa từng tồn tại** trong mã nguồn lẫn cơ sở dữ liệu — hành vi thật luôn bằng
> đúng trạng thái tắt, nên không phải lỗ hổng, nhưng để lại là hứa một tính năng
> không có. Nhu cầu đứng sau nó nay được giải theo cách **hẹp hơn**: Trưởng/Phó
> ngành **chuyển được** một GLV **đang phục vụ trong ngành mình** sang lớp khác
> **cũng trong ngành mình**, qua RPC `transfer_class_staff` (D-105) — xem §4.6.
> Ghi thẳng vào `staff_profiles`/`class_staff_assignments` vẫn đòi global-write.
