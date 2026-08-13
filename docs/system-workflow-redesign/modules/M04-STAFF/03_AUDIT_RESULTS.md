# M04-STAFF — Kết quả chấm điểm

Thang 1–5 cho 15 tiêu chí, tổng tối đa **75**.
`C1` đúng nghiệp vụ · `C2` dễ hiểu · `C3` số bước hợp lý · `C4` không nhập trùng · `C5` khó thao tác nhầm · `C6` validation đầy đủ · `C7` trạng thái rõ ràng · `C8` phân quyền an toàn · `C9` dữ liệu nhất quán · `C10` dễ bảo trì · `C11` dễ mở rộng · `C12` UI hỗ trợ đúng nghiệp vụ · `C13` responsive · `C14` accessibility · `C15` khả năng kiểm thử.

## 1. Bảng tổng hợp

| ID | Tên luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái | Ưu tiên |
|---|---|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--:|---|---|
| M04-F01 | Danh sách nhân sự | 3 | 3 | 5 | 5 | 5 | — | 2 | 5 | 4 | 3 | 2 | 2 | 4 | 4 | 3 | **50** (14 tiêu chí ×5=70 → quy đổi 54/75) | NEEDS_IMPROVEMENT | P1 |
| M04-F02 | Tạo hồ sơ GLV | 4 | 3 | 4 | 2 | 2 | 3 | 1 | 5 | 3 | 2 | 3 | 2 | 4 | 3 | 2 | **43** | **CRITICAL** | **P0** |
| M04-F03 | Sửa hồ sơ GLV | 1 | 1 | 1 | 1 | 1 | 3 | 1 | 5 | 2 | 4 | 3 | 1 | 3 | 1 | 1 | **29** | **CRITICAL** (không có UI) | **P0** |
| M04-F04 | Phân công vào lớp | 4 | 3 | 4 | 4 | 2 | 3 | 2 | 5 | 4 | 3 | 3 | 2 | 4 | 3 | 2 | **48** | **CRITICAL** | **P0** |
| M04-F05 | Kết thúc phân công | 4 | 2 | 5 | 5 | 1 | 3 | 2 | 5 | 5 | 4 | 3 | 2 | 4 | 3 | 3 | **51** | **CRITICAL** (tác dụng phụ ẩn) | **P0** |
| M04-F06 | Đổi lớp cho GLV | 1 | 1 | 1 | 2 | 1 | 2 | 1 | 4 | 1 | 2 | 1 | 1 | 3 | 2 | 1 | **24** | **CRITICAL** | **P0** |
| M04-F07 | Xóa hồ sơ GLV | 4 | 3 | — | — | 5 | 5 | 2 | 5 | 5 | 4 | 3 | 2 | — | — | 4 | quy đổi **51** | NEEDS_CONFIRMATION | P2 |
| M04-F08 | Đổi trạng thái phục vụ | 1 | 1 | 1 | 1 | 3 | 3 | 1 | 5 | 3 | 3 | 3 | 1 | 3 | 1 | 1 | **31** | **CRITICAL** (không có UI) | **P0** |
| M04-F09 | Xem đội ngũ lớp | 5 | 5 | 5 | 5 | 5 | — | 4 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | quy đổi **66** | **PASS** | — |

*Ghi chú:* dấu `—` là tiêu chí không áp dụng (luồng chỉ đọc / luồng không tồn tại); tổng được quy đổi tuyến tính về thang 75.

## 2. Lý do chấm — điểm thấp đáng chú ý

### M04-F02 — Tạo hồ sơ (43/75, CRITICAL vì C7 = 1)

- **C7 = 1**: `createStaffFromForm` khai báo `Promise<void>` và **bỏ hoàn toàn** kết quả của `createStaff` (`src/features/staff/server/actions.ts:115-127`). Thành công và thất bại **trông giống hệt nhau**: trang render lại, không thông báo, không hiện `GLVxxx` vừa sinh. Đây không phải khuyết điểm UI mà là **thiếu vòng phản hồi của một nghiệp vụ ghi dữ liệu**.
- **C4 = 2 / C5 = 2**: không có ràng buộc hay cảnh báo trùng trên `phone`, `email`, `full_name + date_of_birth` (`20260715000400:12-30`); nút không disable khi submit (`staff/page.tsx:60`) → bấm đúp tạo 2 hồ sơ; `service_status` bị hardcode (`actions.ts:125`).
- **C10 = 2**: `writeRoles` bị hardcode lần thứ hai ở `staff/page.tsx:16` thay vì import từ `actions.ts:19`.
- **C8 = 5**: phân quyền **đúng và hai tầng** — `requireStaffWrite` (`actions.ts:21-25`) + RLS `can_global_write() and updated_by = auth.uid()` (`20260715000400:273-275`). Đã có RLS negative test (`005:78-81`). Giữ nguyên.

### M04-F05 — Kết thúc phân công (51/75, CRITICAL vì C5 = 1)

RPC được viết **rất tốt** về mặt kỹ thuật: `security definer` + tự kiểm quyền + `for update` + thứ tự deactivate đúng để vượt trigger (`20260715000400:104-149`). Nhưng **UI nói dối về hệ quả**: nút ghi “Kết thúc phân công”, thực tế còn vô hiệu hóa vai trò đăng nhập (`:136-141`). Không confirm, không cảnh báo, không thông báo kết quả.

### M04-F06 — Đổi lớp (24/75, CRITICAL)

Luồng nghiệp vụ **thường xuyên nhất** giữa năm học nhưng **không hoàn thành được**. Xem 5W-03 dưới đây.

### M04-F03 / M04-F08 — hai luồng có code/DB sẵn nhưng không có UI

`updateStaff` (`actions.ts:55-78`) và `service_status` (`20260715000400:25`) đều đã đúng, đã an toàn, chỉ **thiếu 1 trang** để dùng. Chi phí sửa thấp, giá trị cao.

### M04-F09 — PASS (66/75)

Chỉ đọc, dữ liệu đúng, có fallback trống. **Giữ nguyên**, không đề xuất sửa. Điểm trừ duy nhất: chưa link được sang hồ sơ GLV vì `/staff/[staffId]` chưa tồn tại — sẽ tự hết khi TB-01 xong.

## 3. Phân tích 5 Whys

### 5W-05 — Thao tác ghi im lặng, không ai biết thành công hay thất bại (M04-F02/F04/F05)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Người dùng bấm “Tạo hồ sơ”, trang nhấp nháy rồi trở lại. Không biết đã tạo hay chưa, mã GLV là gì. Nếu thiếu quyền hoặc sai định dạng email, hiện tượng **y hệt**. |
| **Điểm đau** | Ba wrapper `createStaffFromForm` / `assignStaffFromForm` / `endStaffAssignmentFromForm` khai báo `Promise<void>` và không đọc kết quả (`actions.ts:115,129,138`). |
| **Nguyên nhân trực tiếp** | Trang `/staff` là **Server Component thuần**, dùng `<form action={serverAction}>` — chữ ký của form action Next 15 buộc trả `void` hoặc `Promise<void>` nếu không dùng `useActionState`. Không có Client Component trung gian nào (module không có thư mục `components/`). |
| **Nguyên nhân gốc** | Trang được dựng để **hiển thị nhanh** chứ chưa dựng theo chuẩn “mọi write phải có phản hồi” mà chính repo đã áp dụng ở nơi khác: `AccountAdminPanel` là Client Component có `message` state (`src/features/auth/components/account-admin-panel.tsx:26,55`), `LoginForm` có `submissionError` (`login-form.tsx:15`). Nghĩa là **pattern đúng đã tồn tại trong repo nhưng M04 không dùng**. |
| **Hậu quả** | **Nghiệp vụ:** hồ sơ trùng do bấm lại nhiều lần khi tưởng chưa lưu. **Dữ liệu:** không phát hiện được lỗi Zod/RLS/trigger — dữ liệu lệch âm thầm. **Phân quyền:** một `sector_leader` bị RLS chặn nhưng **không hề biết mình bị chặn**, dễ hiểu nhầm là hệ thống hỏng. **UX:** vi phạm nguyên tắc cơ bản nhất; không thể viết E2E cho luồng ghi vì không có gì để assert. |

### 5W-06 — Không thể đổi lớp cho GLV mà giữ được tài khoản (M04-F06)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Sau khi kết thúc phân công cũ và phân công lớp mới, GLV đăng nhập được nhưng không thấy lớp nào, không điểm danh được. |
| **Điểm đau** | `end_class_staff_assignment` deactivate `role_assignments` (`20260715000400:136-141`) nhưng `assignStaffToClass` **không** tạo lại (`actions.ts:80-97`). |
| **Nguyên nhân trực tiếp** | Sự đồng bộ `class_staff_assignments ↔ role_assignments` được cài **một chiều** — chỉ ở chiều kết thúc, và chỉ trong RPC. Chiều bắt đầu bị bỏ trống. |
| **Nguyên nhân gốc** | `role_assignments` được coi là **sản phẩm phụ của việc tạo tài khoản** chứ không phải thực thể vòng đời độc lập: trong toàn bộ `src/` nó chỉ được ghi đúng một lần, tại `src/features/auth/server/actions.ts:241`, bên trong `adminProvisionAccount`. `assignPrimaryRole` được đặc tả (`docs/11:25`) nhưng chưa làm. Sâu hơn nữa: **ranh giới quyền cắt ngang một nghiệp vụ** — phân công lớp là `can_global_write` (4 role), gán role là `super_admin` (1 role), nên không ai thiết kế một luồng đi hết cả hai. |
| **Hậu quả** | **Nghiệp vụ:** mỗi lần luân chuyển nhân sự tạo ra một tài khoản chết; đầu năm học chuyển lớp hàng loạt sẽ làm hỏng hàng chục tài khoản cùng lúc. **Dữ liệu:** cách khắc phục duy nhất (xóa + tạo lại) đổi `profiles.id` ⇒ đứt mọi FK `updated_by`/người thực hiện, và xóa sạch lịch sử role do cascade (`20260715000100:64`). **Phân quyền:** trạng thái “zombie” (`account_status='active'` + `role=null`) không được màn hình nào cảnh báo. **UX:** GLV bị mất quyền giữa mùa mà không ai biết nguyên nhân. |

### 5W-07 — Trạng thái “phục vụ” và trạng thái “tài khoản” bị trộn trên thực tế (M04-F08)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Muốn ghi nhận “anh A tạm nghỉ phục vụ học kỳ này”, người quản lý không có ô nào để chọn; cách duy nhất là kết thúc phân công (mất luôn quyền) hoặc vô hiệu hóa tài khoản (mất luôn khả năng đăng nhập). |
| **Điểm đau** | `service_status` có ở DB nhưng bị hardcode `"active"` khi tạo (`actions.ts:125`), không select khi đọc (`queries.ts:21`), không hiển thị (`staff/page.tsx:34-35`), và `updateStaff` không có UI. |
| **Nguyên nhân trực tiếp** | Không có trang chi tiết hồ sơ để đặt ô này; form tạo chỉ có 7 ô và không có ô trạng thái. |
| **Nguyên nhân gốc** | Schema đã tách hai trạng thái **đúng ngay từ đầu** (`staff_profiles.service_status` `20260715000400:25` vs `profiles.account_status` `20260715000100:47`), nhưng tầng ứng dụng chỉ triển khai **một nửa** — nửa `account_status` (vì nó nằm trong M01 đã làm) và bỏ nửa `service_status`. Không có test nào (pgTAP lẫn unit) chạm tới `service_status`, nên khoảng trống không bị phát hiện. |
| **Hậu quả** | **Nghiệp vụ:** không phản ánh được thực tế mục vụ (nghỉ sinh con, đi học xa, nghỉ hè). **Dữ liệu:** danh sách `/staff` trộn lẫn người đang phục vụ và người đã nghỉ nhiều năm; báo cáo “Tổng Giáo lý viên” (`docs/01:491`) sẽ sai. **UX:** người quản lý buộc phải dùng sai công cụ (vô hiệu hóa tài khoản) để diễn đạt một sự việc nghiệp vụ. |

### 5W-08 — Hồ sơ tạo nhầm không gỡ được (M04-F07)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Tạo nhầm hai hồ sơ cho cùng một người (dễ xảy ra do 5W-05) thì không có cách nào dọn. |
| **Điểm đau** | Không có UI xóa, không có action, và **RLS không có policy DELETE** (`20260715000400:262-290`). |
| **Nguyên nhân trực tiếp** | Thiết kế “không xóa cứng dữ liệu mục vụ” — 8 bảng khác tham chiếu bằng `on delete restrict`. |
| **Nguyên nhân gốc** | Nguyên tắc “giữ lịch sử” là **đúng**, nhưng thiếu cặp bù trừ của nó: một cơ chế **soft-delete / archive** ở tầng ứng dụng. `service_status = 'inactive'` là ứng viên tự nhiên nhưng lại không dùng được (5W-07). |
| **Hậu quả** | **Dữ liệu:** rác tích lũy vĩnh viễn, mỗi lần nhầm tiêu một mã `GLVxxx`. **Nghiệp vụ:** danh sách nhân sự mất độ tin cậy. → Cần **NEEDS_CONFIRMATION** (Q5): xóa cứng hồ sơ chưa từng dùng có được phép không? |

## 4. Điểm PASS phải giữ nguyên (không sửa)

1. **Hai unique partial index** — một lớp active/nhân sự (`20260715000400:52-53`) và một đại diện active/lớp (`:54-55`). Đúng `docs/03:101,103`, có test (`005:39-46`).
2. **RPC `end_class_staff_assignment`** — `security definer` + tự kiểm `can_global_write()` + `for update` + kiểm ngày + thứ tự deactivate đúng (`:104-149`). Kỹ thuật tốt, chỉ cần bọc UI đúng.
3. **Trigger `validate_class_staff_assignment`** — chặn phân công vào lớp không active và chặn lệch role↔capacity (`:65-102`). Có test (`005:47-50`).
4. **RLS hai bảng** với `updated_by = auth.uid()` trong `with check` (`:273-290`) — không tin `updated_by` từ input, đúng `docs/10:50`.
5. **`app.can_access_staff`** (`:243-260`) — cho phép GLV cùng lớp đọc nhau, có test (`005:74-76`).
6. **`staff_code` sinh từ sequence ở DB** (`:15`) với CHECK định dạng (`:29`) — không có race, có test (`005:31`).
7. **`profile_id` nullable + unique + `on delete set null`** (`:14`) — cho phép hồ sơ không tài khoản, cấm 1 tài khoản gắn 2 hồ sơ, và giữ hồ sơ khi xóa tài khoản. **Đúng cả ba yêu cầu nghiệp vụ cùng lúc.**
8. **`updateStaff` whitelist từng field** (`actions.ts:60-71`) — không dùng generic update, đúng `docs/11:59`.
9. **M04-F09 xem đội ngũ lớp** — PASS toàn phần.
