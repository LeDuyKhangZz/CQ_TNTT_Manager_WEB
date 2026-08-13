# M01-AUTH-ACCOUNT — Business rules trích từ code

Cột “Nơi enforce” liệt kê **mọi** tầng thực sự chặn, theo thứ tự UI → Zod → Server Action → DB.
Cột “Đối chiếu docs” ghi rõ trùng lặp / mâu thuẫn / thiếu.

| Mã | Phát biểu | Nơi enforce | `file:line` | Đối chiếu docs |
|---|---|---|---|---|
| BR-A01 | Tên đăng nhập được ánh xạ sang email alias nội bộ theo 4 namespace: `CQ\d{4,}`→`@students.`, `GLV\d{3,}`→`@staff.`, SĐT VN chuẩn hóa→`@guardians.`, còn lại→`@accounts.` | Server (pure fn) | `src/features/auth/aliases.ts:22-35` | Khớp `docs/01:528`, `docs/03:44-47`. Ánh xạ **chỉ ở server**, đúng `CLAUDE.md §7` |
| BR-A02 | SĐT VN chuẩn hóa: `0XXXXXXXXX` → `84XXXXXXXXX`; chỉ chấp nhận 10 số bắt đầu `0` hoặc 11 số bắt đầu `84` | Server | `aliases.ts:9-14` | Khớp `docs/03:66` |
| BR-A03 | Đăng nhập sai username và sai mật khẩu trả **cùng một thông báo** | Server | `actions.ts:67,71` | `docs/10` (không lộ tồn tại tài khoản) — **đúng, giữ nguyên** |
| BR-A04 | Tài khoản `account_status != 'active'` không đăng nhập được; nếu lỡ sign-in thì bị `signOut` ngay | Server + Guard + **RLS** | `actions.ts:78-81`, `guards.ts:10`, `route-map.ts:60`, `20260715000100:107-121` | Khớp `docs/01:78`. Enforce **3 tầng** — cố ý, không phải trùng lặp thừa |
| BR-A05 | Tài khoản có `must_change_password = true` bị ép về `/change-password` trước mọi route khác | Guard | `guards.ts:11-13`; redirect ban đầu ở `actions.ts:82` | Khớp `docs/03:47`, `CLAUDE.md §7` |
| BR-A06 | Mật khẩu mới tối thiểu 8 ký tự và phải khớp ô xác nhận | Zod (client+server) | `schemas.ts:9-17` | Khớp `docs/03` (mật khẩu tạm 8 ký tự). **Không** có yêu cầu độ phức tạp trong docs → không thiếu |
| BR-A07 | Đổi mật khẩu **không** cần mật khẩu hiện tại | Server (thiếu kiểm tra) | `actions.ts:88-101` | **Docs không phát biểu.** Là lỗ hổng, xem 5W-04 → NEEDS_CONFIRMATION Q1 |
| BR-A08 | Cờ `must_change_password` chỉ được xóa qua RPC `complete_password_change()`, chỉ cho chính `auth.uid()` và chỉ khi account active | DB (security definer) | `20260715000300:3-24` | Khớp `docs/11 §2` |
| BR-A09 | Chỉ `super_admin` được quản trị tài khoản | UI + Server + Route rule | `permissions.ts:3-5`, `actions.ts:39`, `route-map.ts:47`, `queries.ts:28` | Khớp `docs/05:15,48,187-190`, `docs/01:78` |
| BR-A10 | Không được sửa/xóa tài khoản **đang đăng nhập** | Server | `actions.ts:46-48` | Khớp `docs/01:84`, `docs/03:98` |
| BR-A11 | Không được sửa/xóa tài khoản có active role `super_admin` | Server | `actions.ts:56-59` | Khớp `docs/01:84`. **Lưu ý:** không áp dụng cho `adminProvisionAccount` → **vẫn tạo mới được `super_admin`** (`actions.ts:105`) — docs không cấm rõ → Q2 |
| BR-A12 | `username` là duy nhất toàn hệ thống, không phân biệt hoa/thường | **DB unique (citext)** + kiểm trước ở server | `20260715000100:44`, `actions.ts:312-318` | Khớp `docs/02`. Kiểm ở server là TOCTOU, DB là chốt thật |
| BR-A13 | Mỗi `profiles` có **tối đa một** `role_assignments` với `is_active = true` | **DB unique partial index** | `20260715000100:86-88` | Khớp `docs/01`, `docs/05:8`; có test `004:29-31` |
| BR-A14 | Scope phải khớp role: role ngành cần `sector_id` (không `class_id`); role lớp cần `class_id` (không `sector_id`); role toàn cục không có scope | Zod + **DB CHECK** + trigger | `schemas.ts:36-41,60-62`, `20260715000100:76-80`, `20260715000200:161-173` | Khớp `docs/03`, `docs/05` |
| BR-A15 | Role lớp phải có `academic_year_id` **bằng** `academic_year_id` của lớp | **DB trigger** | `20260715000400:170-177` | Khớp `docs/02`. UI **không** kiểm trước → lỗi chỉ hiện ở cuối luồng |
| BR-A16 | 9 role GLV (`group_leader`, `deputy_group_leader`, `secretary`, `treasurer`, role ngành, role lớp) bắt buộc có `staff_profiles.profile_id` trỏ tới account | Zod + Server + **DB trigger** | `roles.ts:56-64`, `schemas.ts:42-47`, `actions.ts:114-128,190-204`, `20260716000400:9-22` | Khớp `docs/01:117`, `docs/11:28`. Có test `007:52-56` |
| BR-A17 | Role lớp còn phải có `class_staff_assignments` **active, đúng lớp, đúng capacity** (`representative`↔`class_representative`, `member`↔`class_teacher`, `trainee`↔`trainee_assistant`) | **DB trigger** duy nhất | `20260715000400:179-196` | Khớp `docs/01:117`, `docs/03:59`. **Không có tầng nào khác kiểm** → không có test pgTAP cho nhánh này |
| BR-A18 | Role `guardian` bắt buộc `guardians.profile_id`; role `student` bắt buộc `students.profile_id` | Zod + Server + **DB trigger** | `schemas.ts:48-53`, `actions.ts:130-158,206-239`, `20260716000200:9-22` | Khớp `docs/01:150,156`, `docs/03:68-70`. Test `007:36-51` |
| BR-A19 | Chỉ được cấp tài khoản cho hồ sơ **chưa có** account (`profile_id IS NULL`) | UI (lọc dropdown) + Server (2 lần: đọc + update có điều kiện) | `queries.ts:35-37`, `actions.ts:120,136,151,195,210,227` | Khớp `docs/03:56`. Điều kiện `.is("profile_id", null)` là **chống race đúng cách** |
| BR-A20 | Với hồ sơ đã chọn, username/tên hiển thị/tên thánh/SĐT/email **luôn lấy từ hồ sơ**, không tin client | Server (ghi đè) | `actions.ts:114-128,130-143,145-158` | Khớp `docs/11:14` “không nhận actor/role từ client”. UI cũng tự điền (`account-admin-panel.tsx:39-45`) — **trùng lặp vô hại** |
| BR-A21 | Mật khẩu tạm 8 ký tự, sinh bằng `randomInt`, alphabet loại bỏ ký tự dễ nhầm (`i,l,o,0,1`), luôn có ≥1 chữ + ≥1 số, hiển thị **đúng một lần**, không lưu, không log | Server + UI | `passwords.ts:5-20`, `actions.ts:266`, `account-admin-panel.tsx:163` | Khớp `docs/03:46`, `docs/11:28` |
| BR-A22 | Mọi thao tác đặt/reset mật khẩu của Super Admin đều bật lại `must_change_password = true` | Server | `actions.ts:278,295` | Khớp `docs/03:94` |
| BR-A23 | Đổi username phải đồng bộ **cả** email alias trong Supabase Auth **và** `profiles.username`; nếu bước 2 lỗi thì hoàn nguyên email | Server | `actions.ts:320-338` | Khớp `docs/03:95` |
| BR-A24 | Vô hiệu hóa tài khoản = ban ở Auth (`876000h`) **và** `profiles.account_status = 'disabled'` | Server | `actions.ts:363-367` | Docs chỉ nói “vô hiệu hóa” (`docs/01:78`). **Không có bù trừ nếu bước 2 lỗi** → có thể lệch |
| BR-A25 | Xóa tài khoản giữ nguyên hồ sơ nghiệp vụ và đặt `profile_id = null` | **DB FK ON DELETE SET NULL** | `20260715000400:14` (staff), `20260716000100` (guardians/students) | Khớp `docs/03:96`, `docs/01:85`. Enforce ở DB, không phụ thuộc code — **tốt** |
| BR-A26 | Xóa tài khoản **cũng xóa toàn bộ lịch sử `role_assignments`** | **DB FK ON DELETE CASCADE** | `20260715000100:64` | **Docs không phát biểu.** Mâu thuẫn tinh thần “lưu lịch sử” (`:89-90`, `docs/02`) → NEEDS_CONFIRMATION Q3 |
| BR-A27 | `account_status` có 3 giá trị `active|locked|disabled`; UI chỉ dùng 2 | Zod nhận 3, UI dùng 2 | `schemas.ts:66`, `20260715000100:16`, `account-admin-panel.tsx:187` | **Docs không mô tả `locked` khác gì `disabled`** → Q4 |
| BR-A28 | `staff_profiles.service_status` (`active|paused|inactive`) là trạng thái **phục vụ**, tách khỏi `account_status` | **DB** (đã tách) — nhưng **không tầng nào cho đổi** | `20260715000400:25`; hardcode `"active"` tại `src/features/staff/server/actions.ts:125`; không xuất hiện trong `src/features/staff/server/queries.ts:21` | Docs không mô tả rõ. Thực tế: rule tồn tại ở schema nhưng **chết ở tầng ứng dụng** |
| BR-A29 | Middleware chỉ refresh token, **không** authorize | Middleware | `src/middleware.ts:4-15`, `lib/supabase/middleware.ts:36-39` | Khớp `docs/04 §3`, `AGENTS §5` |
| BR-A30 | Route không khai báo trong `ROUTE_RULES` → **từ chối** (fail-closed) | Server | `route-map.ts:51-57` | Khớp `docs/10 §47` |
| BR-A31 | Service role client chỉ tồn tại server-side; import vào browser làm **fail build** | `import "server-only"` + test | `lib/supabase/admin.ts:1`, `tests/unit/identity-security.test.ts:20-26` | Khớp `docs/04 §5`, `AGENTS §5` |
| BR-A32 | `profiles`/`role_assignments` chỉ có policy SELECT cho `authenticated`; mọi ghi phải qua service role hoặc RPC | **RLS** | `20260715000100:241-247`, `238-239` | Khớp `docs/10 §47`. Test `004:39-42,52-56` |

## Quy tắc **được đặc tả trong docs nhưng KHÔNG có trong code**

| Mã | Phát biểu (docs) | Nguồn | Tình trạng |
|---|---|---|---|
| BR-A33 | `assignPrimaryRole(input)` — Super Admin gán/đổi primary role cho account đã có | `docs/11:25` | **Không tồn tại trong `src/`** |
| BR-A34 | Guardian đã là GLV thì không tạo role thứ hai; liên kết `guardians.profile_id` vào account hiện có | `docs/03:70` | **Không có action nào liên kết hồ sơ vào account đã tồn tại** — chỉ liên kết được lúc tạo mới |
| BR-A35 | “Có thể thêm tối đa hai membership Ban” khi tạo tài khoản GLV | `docs/03:62` | Không nằm trong luồng tạo tài khoản (thuộc M09) |
| BR-A36 | Route `/admin/accounts`, `/admin/settings`, `/admin/academic-years`, `/admin/import` | `docs/06:115-119` | Gộp hết vào `/admin` |
| BR-A37 | Route `/staff/[staffId]` | `docs/06:103` | Không tồn tại |
| BR-A38 | `profiles.last_login_at` | `20260715000100:51` | Cột tồn tại, **không code nào ghi** |
