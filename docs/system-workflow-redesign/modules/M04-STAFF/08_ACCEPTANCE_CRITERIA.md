# M04-STAFF — Tiêu chí chấp nhận (Given/When/Then)

Chỉ viết cho luồng **phải sửa**. **M04-F09 (xem đội ngũ lớp) là PASS — không có tiêu chí thay đổi, chỉ cần giữ nguyên hành vi khi refactor.**
Loại test: **pgTAP** · **RLS negative** · **unit** · **E2E**.

---

## AC-M04-01 — Mọi thao tác ghi có phản hồi (TB-M04-00)

**AC-01.1 Tạo hồ sơ thành công**
- **Given** tôi là Xứ đoàn trưởng ở `/staff`
- **When** tôi điền danh xưng, họ tên, số điện thoại và bấm “Tạo hồ sơ”
- **Then** tôi thấy thông báo `"Đã tạo hồ sơ GLV045."` kèm mã vừa sinh
- **And** tôi được đưa tới `/staff/<id>` của hồ sơ vừa tạo
- **Test:** **E2E (bắt buộc xanh)**

**AC-01.2 Thiếu quyền phải thấy lỗi**
- **Given** tôi là `sector_leader` (không thuộc `can_global_write`)
- **When** tôi gọi thẳng `createStaff` (bỏ qua UI)
- **Then** tôi nhận `{ok:false, code:"FORBIDDEN"}` và **không** có bản ghi nào được tạo
- **And** nếu UI có hiển thị form (không được phép), thông báo lỗi phải hiện rõ chứ không im lặng
- **Test:** **E2E + RLS negative (bắt buộc xanh)** — mở rộng `supabase/tests/005_staff_assignments_test.sql:78-81` cho `sector_leader`

**AC-01.3 Lỗi validation hiện theo field**
- **Given** tôi nhập email `abc` (sai định dạng)
- **When** tôi submit
- **Then** ô Email hiện lỗi `"Email không hợp lệ."` với `aria-invalid="true"`
- **And** hồ sơ **không** được tạo
- **Test:** unit (schema) + E2E

**AC-01.4 Lỗi DB được dịch sang tiếng Việt cụ thể**
- **Given** lớp Ấu 1A đã có Giáo lý viên đại diện
- **When** tôi phân công thêm một người với vai trò “Giáo lý viên đại diện” vào Ấu 1A
- **Then** tôi thấy `"Lớp Ấu 1A đã có Giáo lý viên đại diện. Hãy kết thúc phân công của người hiện tại trước."`
- **And** **không** thấy thông báo chung chung “Không thể lưu dữ liệu nhân sự”
- **Test:** **E2E (bắt buộc xanh)** + unit (hàm map mã lỗi)

**AC-01.5 Không tạo trùng do bấm đúp**
- **Given** tôi bấm nút “Tạo hồ sơ” hai lần liên tiếp
- **Then** nút bị `disabled` sau lần bấm đầu và chỉ **một** hồ sơ được tạo
- **Test:** E2E

---

## AC-M04-02 — Trang chi tiết hồ sơ (TB-M04-01)

**AC-02.1 Sửa hồ sơ**
- **Given** tôi là Thư ký và hồ sơ GLV045 ghi sai số điện thoại
- **When** tôi mở `/staff/<id>`, bấm “Sửa”, đổi số điện thoại và lưu
- **Then** giá trị mới được lưu với `updated_by = <profile của tôi>`
- **And** tôi thấy thông báo thành công
- **Test:** **E2E (bắt buộc xanh)** + pgTAP (RLS UPDATE với `updated_by <> auth.uid()` bị `42501`)

**AC-02.2 Trạng thái phục vụ độc lập với tài khoản**
- **Given** GLV045 có tài khoản đang hoạt động
- **When** tôi đổi trạng thái phục vụ sang “Tạm nghỉ”
- **Then** `staff_profiles.service_status = 'paused'`
- **And** `profiles.account_status` **vẫn** là `active` và người đó **vẫn đăng nhập được**
- **And** ngược lại, vô hiệu hóa tài khoản **không** làm đổi `service_status`
- **Test:** **pgTAP (bắt buộc xanh)** + **E2E (bắt buộc xanh)**

**AC-02.3 Lịch sử phân công hiển thị đầy đủ**
- **Given** GLV045 từng phục vụ Ấu 1A (2025–2026) và hiện phục vụ Thiếu 2B
- **When** tôi mở `/staff/<id>`
- **Then** tôi thấy cả phân công hiện tại **và** phân công đã kết thúc kèm ngày bắt đầu/kết thúc
- **Test:** E2E

**AC-02.4 Không rò dữ liệu nhạy cảm**
- **Given** tôi là `class_teacher` cùng lớp với GLV045 (nên `app.can_access_staff` cho phép đọc)
- **When** tôi mở `/staff/<id-của-GLV045>`
- **Then** tôi thấy danh xưng, tên thánh, họ tên, mã GLV, lớp đang phục vụ
- **And** tôi **không** thấy ngày sinh, địa chỉ, email, trạng thái tài khoản, và **không** có nút thao tác nào
- **Test:** **E2E (bắt buộc xanh)** + RLS negative

**AC-02.5 ID rác không làm sập server**
- **Given** tôi mở `/staff/khong-phai-uuid` hoặc `/staff/<uuid-không-tồn-tại>`
- **Then** trang trả về trạng thái < 500 (không tìm thấy hoặc điều hướng)
- **Test:** **E2E (bắt buộc xanh)** — mở rộng `tests/e2e/security.spec.ts:47-66`

**AC-02.6 Hồ sơ không có tài khoản vẫn hợp lệ**
- **Given** một Sơ chỉ dạy giáo lý, không dùng app
- **When** tôi mở hồ sơ của Sơ ấy
- **Then** khối “Tài khoản” hiển thị “Chưa có tài khoản” — **không** phải lỗi, **không** phải cảnh báo đỏ
- **And** hồ sơ vẫn phân công lớp được bình thường
- **Test:** pgTAP (đã có tinh thần ở `005:26-30`) + E2E

---

## AC-M04-03 — Kết thúc phân công nói đúng hệ quả (TB-M04-05)

**AC-03.1 Cảnh báo trước**
- **Given** GLV045 có tài khoản với role `class_teacher` ở Ấu 1A
- **When** tôi bấm “Kết thúc phân công”
- **Then** hộp xác nhận ghi rõ: *“Sẽ kết thúc phân công tại Ấu 1A **và** vô hiệu hóa vai trò đăng nhập hiện tại của <Tên>.”*
- **And** nếu tôi bấm Hủy thì **không** có thay đổi nào ở DB
- **Test:** **E2E (bắt buộc xanh)**

**AC-03.2 Ngày kết thúc hợp lệ**
- **Given** phân công bắt đầu 01/09/2026
- **When** tôi nhập ngày kết thúc 31/08/2026
- **Then** tôi thấy lỗi `"Ngày kết thúc không được trước ngày bắt đầu (01/09/2026)."`
- **Test:** **pgTAP (bắt buộc xanh — hiện chưa có)** + E2E

**AC-03.3 Chỉ global-write được kết thúc**
- **Given** tôi là `class_teacher` hoặc `sector_leader` với JWT thật
- **When** tôi gọi `select public.end_class_staff_assignment(...)`
- **Then** raise `42501 FORBIDDEN` và không có thay đổi
- **Test:** **RLS negative / pgTAP (bắt buộc xanh — hiện chỉ test nhánh thành công `005:56-60`)**

**AC-03.4 Gợi ý bước tiếp theo**
- **When** kết thúc phân công thành công
- **Then** hiển thị gợi ý “Phân công lớp mới” và (nếu có tài khoản) “Cập nhật vai trò”
- **Test:** E2E

---

## AC-M04-04 — Đổi lớp giữ nguyên tài khoản (TB-M04-02)

**AC-04.1 Không còn trạng thái zombie**
- **Given** GLV045 có tài khoản role `class_teacher` ở Ấu 1A
- **When** tôi kết thúc phân công, phân công sang Thiếu 2B (capacity `member`), rồi bấm “Cập nhật vai trò”
- **Then** tồn tại đúng **một** `role_assignments` active: `class_teacher` ở Thiếu 2B
- **And** bản ghi cũ có `is_active = false` và `ends_on` hợp lệ (lịch sử được giữ)
- **And** GLV045 đăng nhập vào thấy Thiếu 2B, điểm danh được, **không** phải đổi mật khẩu
- **Test:** **pgTAP (bắt buộc xanh)** + **E2E (bắt buộc xanh)**

**AC-04.2 Cảnh báo tài khoản mất vai trò**
- **Given** GLV045 có phân công active nhưng tài khoản không có `role_assignments` active
- **When** tôi mở `/staff/<id>` hoặc `/admin`
- **Then** tôi thấy cảnh báo rõ: *“Tài khoản này chưa có vai trò — người dùng đăng nhập được nhưng không truy cập được nghiệp vụ nào.”* kèm nút xử lý
- **Test:** E2E

**AC-04.3 Atomic**
- **Given** `assign_primary_role` đang chạy và bước insert thất bại (ví dụ chưa có phân công đúng capacity)
- **Then** vai trò cũ **vẫn active** (rollback toàn bộ)
- **Test:** **pgTAP (bắt buộc xanh)**

**AC-04.4 Chỉ Super Admin gán vai trò**
- **Given** tôi là `group_leader`/`secretary` với JWT thật
- **When** tôi gọi `assign_primary_role`
- **Then** raise `42501` và không có thay đổi
- **Test:** **RLS negative / pgTAP (bắt buộc xanh)**

**AC-04.5 Không tự nâng quyền**
- **When** ai đó cố gán `super_admin` qua `assign_primary_role`
- **Then** bị từ chối
- **Test:** **pgTAP (bắt buộc xanh)**

---

## AC-M04-05 — Chống trùng hồ sơ (TB-M04-03)

**AC-05.1 Cảnh báo, không chặn**
- **Given** đã có hồ sơ với số điện thoại `0901234567`
- **When** tôi tạo hồ sơ mới cùng số đó
- **Then** hệ thống hiện danh sách hồ sơ nghi trùng và yêu cầu xác nhận
- **And** khi tôi bấm “Vẫn tạo hồ sơ mới”, hồ sơ **được tạo** (không chặn cứng — theo tinh thần `docs/03-workflow.md:87`)
- **Test:** unit + E2E

**AC-05.2 Không thêm unique constraint**
- **Then** DB **vẫn không** có unique trên `phone`/`email` (gia đình dùng chung số là hợp lệ)
- **Test:** pgTAP (`hasnt_index` / kiểm không có unique constraint tương ứng)

---

## AC-M04-06 — Danh sách nhân sự (TB-M04-04)

- **Given** tôi mở `/staff`
- **Then** mỗi dòng hiển thị: danh xưng + tên, mã GLV, **trạng thái phục vụ**, lớp đang phục vụ, **tình trạng tài khoản** (`Đã có <username>` / `Chưa có` / `⚠ Chưa gán vai trò`)
- **And** trình độ huấn luyện hiển thị bằng tiếng Việt (`"Chưa qua huấn luyện"`, `"Cấp I"`, …), không phải `NONE`
- **And** dropdown lớp trong form phân công chỉ chứa lớp của **năm học hiện hành**
- **And** tôi tìm được người theo tên hoặc mã, lọc được theo lớp/trạng thái
- **Test:** E2E + unit (bảng nhãn)

---

## Tiêu chí bảo mật / phân quyền BẮT BUỘC XANH trước khi merge

| # | Tiêu chí | Loại test | Tình trạng hiện tại |
|---|---|---|---|
| S1 | `class_teacher` không INSERT được `staff_profiles` | RLS negative | ✅ đã có `005:78-81` |
| S2 | `sector_leader`, `treasurer` không INSERT/UPDATE được `staff_profiles`/`class_staff_assignments` | RLS negative | ❌ **phải thêm** |
| S3 | Non-global-write gọi `end_class_staff_assignment` → `42501` | pgTAP | ❌ **phải thêm** |
| S4 | `updated_by <> auth.uid()` khi INSERT/UPDATE → `42501` | RLS negative | ❌ **phải thêm** |
| S5 | Một nhân sự không có 2 lớp active; một lớp không có 2 đại diện active | pgTAP | ✅ đã có `005:39-46` |
| S6 | Không kết thúc được phân công khi role lớp còn active | pgTAP | ✅ đã có `005:51-54` |
| S7 | Role lớp không tạo được nếu thiếu/sai `class_staff_assignments` (BR-S26) | pgTAP | ❌ **phải thêm** (dùng chung với M01 §S7) |
| S8 | Phân công vào lớp không active bị chặn (BR-S19) | pgTAP | ❌ **phải thêm** |
| S9 | Phân công lệch capacity so với role lớp bị chặn (BR-S20) | pgTAP | ❌ **phải thêm** |
| S10 | `assign_primary_role` từ chối non-SA và từ chối `super_admin` | pgTAP / RLS negative | ❌ **mới** |
| S11 | `class_teacher` không thấy field nhạy cảm trên `/staff/[staffId]` | E2E + RLS negative | ❌ **mới** |
| S12 | `/staff/<id rác>` không trả 5xx | E2E | ❌ **phải thêm** |
| S13 | `guardian`/`student` mở `/staff` → `/access-denied` | E2E | ❌ **phải thêm** |
