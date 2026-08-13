# M01-AUTH-ACCOUNT — Tiêu chí chấp nhận (Given/When/Then)

Chỉ viết cho luồng **phải sửa**. Mỗi tiêu chí ghi rõ loại test phải xanh: **pgTAP** · **RLS negative** · **unit** · **E2E**.

---

## AC-M01-01 — Cấp tài khoản GLV ngay tại hồ sơ (TB-01)

**AC-01.1 Happy path**
- **Given** tôi là Super Admin và hồ sơ `GLV045` đã có `class_staff_assignments` active ở lớp “Ấu 1A” với capacity `member`, và `staff_profiles.profile_id IS NULL`
- **When** tôi mở `/staff/<id>`, bấm “Cấp tài khoản”, chọn vai trò “Giáo lý viên lớp”, để nguyên năm học và ngày bắt đầu đã prefill, và bấm Xác nhận
- **Then** hệ thống tạo auth user + `profiles(username='GLV045', must_change_password=true, account_status='active')` + `staff_profiles.profile_id` + đúng một `role_assignments(role='class_teacher', class_id=<Ấu 1A>, is_active=true)`
- **And** trang hiện mật khẩu tạm 8 ký tự **đúng một lần** kèm nút Sao chép
- **And** khối “Tài khoản” đổi sang trạng thái “Đã có tài khoản GLV045 · Đang hoạt động · Chưa đổi mật khẩu lần đầu”
- **Test:** E2E `account-admin.spec.ts`

**AC-01.2 Vai trò được lọc theo phân công**
- **Given** hồ sơ có capacity `member`
- **When** tôi mở dialog “Cấp tài khoản”
- **Then** dropdown vai trò **không** hiển thị `class_representative` và `trainee_assistant`
- **Test:** E2E

**AC-01.3 Lỗi cụ thể, sớm, không tạo rác**
- **Given** hồ sơ **chưa** có phân công lớp active
- **When** tôi cố cấp vai trò “Giáo lý viên lớp” (qua gọi thẳng server action, bỏ qua UI)
- **Then** action trả lỗi có thông báo riêng `"Hồ sơ chưa được phân công vào lớp với vai trò Giáo lý viên lớp. Hãy phân công trước."`
- **And** **không** có auth user nào được tạo (kiểm `auth.users` không tăng)
- **Test:** unit (action) + pgTAP (`ACTIVE_CLASS_ASSIGNMENT_REQUIRED` vẫn là chốt cuối)

**AC-01.4 Không tạo tài khoản trùng cho một hồ sơ**
- **Given** hồ sơ đã có `profile_id`
- **When** hai request cấp tài khoản chạy đồng thời cho cùng hồ sơ
- **Then** đúng một request thành công; request còn lại trả `CONFLICT` với thông báo `"Hồ sơ này đã có tài khoản <username>."`
- **And** không còn auth user/profile mồ côi sau khi bù trừ
- **Test:** unit (mô phỏng race trên `.is("profile_id", null)`) + E2E

**AC-01.5 Không nới quyền**
- **Given** tôi là `group_leader`, `deputy_group_leader`, `secretary`, `sector_leader` hoặc `class_representative`
- **When** tôi mở `/staff/<id>`
- **Then** tôi **không** thấy nút “Cấp tài khoản”
- **And** khi gọi thẳng server action `provisionAccountForStaff`, tôi nhận `FORBIDDEN` mà **không** có thay đổi nào ở DB
- **Test:** **E2E (bắt buộc xanh)** + unit `identity-security.test.ts`

**AC-01.6 Hồ sơ không cần tài khoản vẫn hợp lệ**
- **Given** tôi tạo hồ sơ cho một Sơ chỉ dạy giáo lý, không dùng app
- **When** tôi không bấm “Cấp tài khoản”
- **Then** hồ sơ tồn tại với `profile_id IS NULL`, hiện trong danh sách `/staff` với nhãn “Chưa có tài khoản”, và có thể được phân công lớp bình thường
- **Test:** pgTAP (đã có sẵn tinh thần này ở `005_staff_assignments_test.sql:26-30`) + E2E

**AC-01.7 Không rò dữ liệu nhạy cảm trên trang chi tiết mới**
- **Given** tôi là `class_teacher` cùng lớp với GLV khác (nên `app.can_access_staff()` cho phép đọc)
- **When** tôi mở `/staff/<id-của-đồng-nghiệp>`
- **Then** tôi thấy tên, danh xưng, mã GLV, phân công lớp
- **And** tôi **không** thấy ngày sinh, địa chỉ, email, trạng thái tài khoản
- **Test:** **E2E (bắt buộc xanh)** + RLS negative (kiểm cột nhạy cảm không nằm trong payload trả về)

---

## AC-M01-02 — Đăng xuất (TB-02)

- **Given** tôi đang đăng nhập ở bất kỳ vai trò nào
- **When** tôi mở `UserMenu` và bấm “Đăng xuất”
- **Then** tôi được chuyển tới `/login`
- **And** cookie phiên bị xóa ở response
- **And** khi tôi bấm Back rồi mở `/dashboard`, tôi bị chuyển về `/login`
- **Test:** **E2E (bắt buộc xanh)** — 3 audience: staff, guardian, student

---

## AC-M01-03 — Đổi mật khẩu (TB-04)

**AC-03.1 Lần đầu (bắt buộc)**
- **Given** `must_change_password = true`
- **When** tôi mở `/change-password`
- **Then** form chỉ có 2 ô (mật khẩu mới + xác nhận), **không** hỏi mật khẩu hiện tại
- **Test:** E2E

**AC-03.2 Đổi tự nguyện**
- **Given** `must_change_password = false`
- **When** tôi mở `/change-password`
- **Then** form có thêm ô “Mật khẩu hiện tại”
- **And** nhập sai mật khẩu hiện tại → lỗi `"Mật khẩu hiện tại không đúng."`, mật khẩu **không** bị đổi
- **Test:** **E2E (bắt buộc xanh)** + unit (schema 2 chế độ)

**AC-03.3 Không đặt lại mật khẩu cũ**
- **Given** tôi nhập mật khẩu mới trùng mật khẩu hiện tại
- **Then** hệ thống từ chối với thông báo rõ ràng
- **Test:** unit + E2E

**AC-03.4 Tài khoản bị vô hiệu hóa không đổi được**
- **Given** `account_status = 'disabled'`
- **When** RPC `complete_password_change()` được gọi
- **Then** raise `42501 ACCOUNT_UNAVAILABLE`
- **Test:** **pgTAP (bắt buộc xanh)** — bổ sung vào `003_auth_account_flows_test.sql`

---

## AC-M01-04 — Đổi vai trò cho tài khoản đã có (TB-05)

**AC-04.1 Đổi lớp không mất quyền**
- **Given** GLV `GLV045` có tài khoản với role `class_teacher` ở lớp Ấu 1A
- **When** Super Admin kết thúc phân công Ấu 1A, phân công sang Thiếu 2B với capacity `member`, rồi bấm “Cập nhật vai trò”
- **Then** `role_assignments` cũ có `is_active=false`, `ends_on` hợp lệ
- **And** tồn tại đúng một `role_assignments` active `class_teacher` ở lớp Thiếu 2B
- **And** GLV đăng nhập vào thấy đúng lớp mới, **không** phải đổi mật khẩu, **không** mất tài khoản
- **Test:** **pgTAP (bắt buộc xanh)** + **E2E (bắt buộc xanh)**

**AC-04.2 Atomic**
- **Given** RPC `assign_primary_role` đang chạy
- **When** bước insert thất bại (ví dụ chưa có phân công lớp)
- **Then** bản ghi role cũ **vẫn active** (rollback toàn bộ transaction)
- **Test:** **pgTAP (bắt buộc xanh)**

**AC-04.3 Chỉ Super Admin**
- **Given** tôi là `group_leader` với JWT thật (không phải service role)
- **When** tôi gọi `select public.assign_primary_role(...)`
- **Then** raise `42501 FORBIDDEN` và không có thay đổi nào
- **Test:** **RLS negative / pgTAP (bắt buộc xanh)**

**AC-04.4 Không tự nâng quyền**
- **Given** bất kỳ actor nào
- **When** cố gán role `super_admin` qua `assign_primary_role`
- **Then** bị từ chối (role ceiling)
- **Test:** **pgTAP (bắt buộc xanh)** + unit (schema)

---

## AC-M01-05 — Quản trị tài khoản (TB-06)

**AC-05.1 Trạng thái tài khoản không lệch**
- **Given** ban ở Auth thành công nhưng `update profiles.account_status` thất bại
- **When** action `adminSetAccountStatus` kết thúc
- **Then** ban ở Auth được hoàn nguyên và action trả lỗi
- **Test:** unit (mock lỗi)

**AC-05.2 Vô hiệu hóa chặn ở mọi tầng**
- **Given** tài khoản `account_status = 'disabled'`
- **When** tài khoản đó đăng nhập
- **Then** bị từ chối với `"Tài khoản đang bị khóa hoặc đã vô hiệu hóa."`
- **And** `app.current_role()` trả `NULL` và mọi truy vấn RLS chỉ thấy chính profile của mình
- **Test:** **E2E (bắt buộc xanh)** + pgTAP (đã có `004:60-66`)

**AC-05.3 Xóa tài khoản giữ hồ sơ nghiệp vụ**
- **Given** GLV có tài khoản và có `class_staff_assignments` active
- **When** Super Admin xóa tài khoản (sau khi gõ lại tên đăng nhập để xác nhận)
- **Then** `staff_profiles` vẫn tồn tại với `profile_id IS NULL`
- **And** `guardians`/`students` liên quan cũng chỉ bị bỏ link
- **And** một bản ghi audit được ghi với `actor_profile_id` là Super Admin
- **Test:** **pgTAP (bắt buộc xanh)** + E2E

**AC-05.4 Không sửa/xóa được Super Admin và chính mình**
- **Given** tôi là Super Admin
- **When** tôi gọi bất kỳ action nào trong `{adminResetPassword, adminSetPassword, adminUpdateUsername, adminDeleteAccount, adminSetAccountStatus}` với target là chính tôi hoặc một Super Admin khác
- **Then** nhận `CONFLICT`/`FORBIDDEN` và không có thay đổi
- **Test:** unit + **E2E (bắt buộc xanh)**

**AC-05.5 Đổi username đồng bộ hai nơi**
- **Given** tài khoản `GLV045`
- **When** Super Admin đổi username thành `GLV046`
- **Then** `profiles.username = 'GLV046'` **và** email alias Auth = `glv046@staff.<domain>`
- **And** người dùng đăng nhập được bằng `GLV046`, không đăng nhập được bằng `GLV045`
- **Test:** **E2E (bắt buộc xanh)**

---

## AC-M01-06 — `/account` (TB-03)

- **Given** tôi đăng nhập với bất kỳ vai trò nào
- **When** tôi mở `/account`
- **Then** tôi thấy tên hiển thị, tên đăng nhập, vai trò + phạm vi, và hai hành động “Đổi mật khẩu”, “Đăng xuất”
- **And** tôi **không** thể tự sửa tên đăng nhập hay vai trò
- **Test:** E2E (3 audience)

---

## Tiêu chí bảo mật / phân quyền BẮT BUỘC XANH trước khi merge

| # | Tiêu chí | Loại test |
|---|---|---|
| S1 | Non-super-admin mở `/admin` → `/access-denied` | **E2E** |
| S2 | Non-super-admin gọi thẳng mọi `admin*` server action → `FORBIDDEN`, DB không đổi | **E2E + unit** |
| S3 | Không thấy nút “Cấp tài khoản” **và** không gọi được action tương ứng khi không phải SA (AC-01.5) | **E2E** |
| S4 | `app.current_role()` = NULL cho account `disabled`; disabled super_admin không có `can_global_read()` | **pgTAP** (đã có `004:60-63`) |
| S5 | `anon` không đọc được `profiles` | **RLS negative** (đã có `004:68-72`) |
| S6 | Ordinary `authenticated` không INSERT được `profiles` / `staff_profiles` | **RLS negative** (đã có `004:44-47`, `005:78-81`) |
| S7 | Role lớp không tạo được nếu thiếu/sai `class_staff_assignments` (BR-A17) | **pgTAP — CHƯA CÓ, phải thêm** |
| S8 | `assign_primary_role` từ chối non-SA và từ chối role `super_admin` | **pgTAP / RLS negative — mới** |
| S9 | Service role không bị bundle sang client (build fail nếu vi phạm) | **unit** (đã có `identity-security.test.ts:20-26`) |
| S10 | Trang `/staff/[staffId]` không rò field nhạy cảm cho class staff (AC-01.7) | **E2E + RLS negative — mới** |
| S11 | Sau đăng xuất, mọi route bảo vệ đều chuyển về `/login` | **E2E — mới** |
| S12 | ID rác (`not-a-uuid`, UUID không tồn tại) trên `/staff/[staffId]` không trả 5xx | **E2E** (mở rộng `security.spec.ts:47-66`) |
