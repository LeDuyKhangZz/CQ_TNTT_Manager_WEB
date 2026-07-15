# 📓 WORKLOG — CQ TNTT MANAGER

> **File phối hợp giữa các session AI (Claude ⇄ Codex).** Đọc TRƯỚC khi làm, cập nhật SAU khi làm.  
> Đây là nguồn sự thật về **trạng thái**. Nguồn sự thật về **việc cần làm** là [`docs/08-phase-plan.md`](docs/08-phase-plan.md).

---

## ⚠️ QUY TẮC BẮT BUỘC (đọc mỗi phiên)

1. **TRƯỚC khi làm gì:** đọc `TRẠNG THÁI HIỆN TẠI` + `VIỆC TIẾP THEO` + `BLOCKERS` + `QUYẾT ĐỊNH ĐÃ CHỐT` + entry mới nhất trong `NHẬT KÝ`.
2. **Claim task trước khi code:** lấy task ID từ `VIỆC TIẾP THEO` → ghi vào `TRẠNG THÁI HIỆN TẠI` dạng `P2-T11 — đang làm — <Claude|Codex> — <ngày>`.
3. **Làm đúng phạm vi task.** Không tiện tay sửa file ngoài scope.
4. **SAU khi làm xong hoặc trước khi hết phiên:**
   - Cập nhật `TRẠNG THÁI HIỆN TẠI` tối đa 6 dòng.
   - Cập nhật `VIỆC TIẾP THEO`.
   - Thêm 1 entry vào đầu `NHẬT KÝ SESSION`.
   - Cập nhật trạng thái task trong `docs/08-phase-plan.md`.
   - Có blocker → ghi vào `BLOCKERS`.
   - Chỉ giữ 6 entry gần nhất.
5. **Trước khi kết thúc phiên:** chạy các lệnh kiểm tra phù hợp. Tối thiểu sau khi scripts tồn tại:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
   Có DB/RLS → chạy thêm test DB. Có workflow UI → chạy E2E.
6. **KHÔNG ĐƯỢC:** ghi pass/done/verified/deployed khi chưa chạy thật; sửa test để che bug; tự đổi quyết định; commit secret; tự chạy git commit/push.

**Format entry:**

```text
### [YYYY-MM-DD] Phiên N — <Claude|Codex> — <task ID>
- **Làm được:** ...
- **File thay đổi:** ...
- **Migration/data impact:** ... hoặc không có
- **Đã test:** lệnh + kết quả thật
- **Quyết định mới:** ... hoặc không có
- **Blocker/rủi ro:** ...
- **Next action:** task tiếp theo + việc cụ thể
```

---

## 🚦 TRẠNG THÁI HIỆN TẠI

> Cập nhật: **2026-07-15** — Phase 2 đang chạy

- **`P2-T1 — XONG — Codex — 2026-07-15`**; staff profiles, mã GLV, phân công/lịch sử lớp, CRUD/RLS/UI đã hoàn tất.
- `P1-T1..P1-T4 — XONG`; Gate Phase 1 đạt bằng fresh reset, Auth local smoke và RLS fail-closed.
- Có 5 ngành, 14 cấp, 20 class template; one-current year và sinh lớp mặc định idempotent.
- Login alias, đổi/reset/disable, account admin SA-only đã nối thật; không lưu/đọc mật khẩu hiện tại.
- Kiểm tra cuối: lint/typecheck/build ✓; unit 34/34; pgTAP 67/67; Auth smoke ✓; E2E 15/15.
- Auth/Role/RLS high-risk đang chờ Claude independent verification; không có blocker mới cho `P2-T2`.

---

## ➡️ VIỆC TIẾP THEO

**`P2-T2 — Guardians and students — chưa claim`.**

Tiếp theo tạo guardian/student, mã CQ, health/sacrament và student detail tabs; không thêm promotion tab.

**Ghi chú bàn giao:**
- `src/config/navigation.ts` đã mô hình hóa `audience`, `role`, `scope`; P0-T3 phải thực hiện lọc/guard thật ở server.
- Account role lớp từ P2-T1 bắt buộc liên kết staff profile đã có assignment capacity/lớp khớp.
- `npm run test:e2e` dùng production build, cổng riêng 3107 và ba viewport chuẩn để tránh chạy nhầm app đang chiếm cổng 3000.
- `next lint` và Vite CJS vẫn có cảnh báo deprecated từ scaffold, không chặn build/test.

---

## ⛔ BLOCKERS

| ID | Blocker | Ảnh hưởng | Cần gì để gỡ |
|---|---|---|---|
| BLK-2 | Chưa có file dữ liệu Google Sheets/Excel mẫu | Chặn hoàn thiện mapping import production, không chặn Phase 0–1 | User cung cấp sau |
| BLK-3 | Chưa biết tên bộ sách giáo lý theo từng ngành | Không chặn schema; teaching plan để text/config | Hỏi lại khi triển khai Phase 4 |
| BLK-4 | Chưa có logo/icon ngành chính thức | UI dùng placeholder, không chặn core | User cung cấp asset |
| BLK-5 | Chưa có Supabase production credentials | Chặn deploy Phase 7, không chặn local | Tạo Supabase project production |
| BLK-6 | Chưa có domain riêng | Không chặn deploy bằng Vercel domain | User mua/cấu hình nếu cần |
| BLK-7 | Nghiệp vụ Sa mạc còn câu hỏi mở | Chặn Phase 8 | Hỏi lại theo `docs/13-summer-camp-backlog.md` |

---

## 🔒 QUYẾT ĐỊNH ĐÃ CHỐT (không tự đổi)

| # | Quyết định |
|---|---|
| D-1 | Hệ thống chỉ cho Giáo xứ Chợ Quán; không multi-tenant. |
| D-2 | Tech stack: Next.js + TypeScript + Supabase + Tailwind/shadcn; modular monolith. |
| D-3 | Deploy target cố định Vercel Hobby. |
| D-4 | Có PWA; không app native. |
| D-5 | Giao diện tiếng Việt, mobile + laptop, cam/da người pastel, không dark mode. |
| D-6 | 5 ngành: Chiên Con, Ấu Nhi, Thiếu Nhi, Nghĩa Sĩ, Hiệp Sĩ. |
| D-7 | Dự trưởng không phải ngành; là trạng thái chuyển tiếp và có thể là Dự trưởng phụ tá lớp. |
| D-8 | Không quản lý phân đoàn, chi đoàn, đội. |
| D-9 | 20 lớp mặc định: 3 Chiên, 6 Ấu, 6 Thiếu, 3 Nghĩa, 2 Hiệp. |
| D-10 | Ấu/Thiếu có A/B; mặc định lên lớp giữ nhánh nhưng cho chuyển A↔B. |
| D-11 | Một thiếu nhi có một lớp chính trong năm học. |
| D-12 | Năm học khoảng tháng 9–5; ngày cụ thể cấu hình. |
| D-13 | Một account chỉ có một role active. |
| D-14 | Role Trưởng/Phó ngành phải có sector cụ thể và hiển thị kèm tên ngành. |
| D-15 | Ban và Sa mạc assignment không phải primary role. |
| D-16 | Super Admin: Khang Nhỏ và Mr. Đạt; xem/sửa toàn hệ thống. |
| D-17 | Cha sở và Cha phó/Tuyên úy chỉ xem/báo cáo. |
| D-18 | Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký có global write. |
| D-19 | Thủ quỹ giới hạn; không sửa điểm, attendance, health, class/promotion. |
| D-20 | Trưởng/Phó ngành xem/sửa ngành mình; duyệt chuyển lớp. |
| D-21 | GLV đại diện tạo plan, phân người dạy, đề nghị chuyển lớp, khóa gradebook. |
| D-22 | GLV lớp và Dự trưởng có quyền lớp theo matrix; Dự trưởng grade/comment qua flag. |
| D-23 | Dì/Sơ là danh xưng, không role. |
| D-24 | Một student có một guardian; guardian có nhiều con. |
| D-25 | Nếu staff là guardian, giữ role staff và có mục Con của tôi. |
| D-26 | Student account từ ngành Ấu Nhi. |
| D-27 | Username: student CQxxxx; staff GLVxxx; guardian phone; password tạm ngắn 8 ký tự và force change. |
| D-28 | Super Admin reset/đổi password, không xem password hiện tại. |
| D-29 | Attendance chỉ thứ Năm và Chúa nhật. |
| D-30 | Mỗi attendance record có Mass và Catechism độc lập. |
| D-31 | Default mọi em present; chỉ sửa ngoại lệ. |
| D-32 | Một editor/session; lease 15 phút; người khác takeover sau timeout. |
| D-33 | Attendance khóa sau 3 ngày; chỉ SA mở/sửa. |
| D-34 | Không full audit before/after; chỉ metadata updated_at/by. |
| D-35 | Staff attendance ở cả Thu/Sun; present/excused/unexcused. |
| D-36 | Attendance warnings không tự động giữ lớp. |
| D-37 | Teaching plan không approval/version workflow; representative tạo. |
| D-38 | Kết quả thang 10, cột assessment động; hệ số mặc định 1/2/3/1. |
| D-39 | Attendance score hệ thống đề xuất, teacher sửa trước lock. |
| D-40 | Có public comments và staff-only notes. |
| D-41 | Top 5 bật/tắt và có thể publish trước final average. |
| D-42 | Trang student detail không có đề xuất chuyển lớp. |
| D-43 | Promotion: representative đề nghị, sector leader/deputy duyệt; warning không hard-block. |
| D-44 | Hiệp 2 có thể đề xuất Dự trưởng; không tự tạo account/role. |
| D-45 | Không module hộ gia đình riêng; guardian ở student detail và portal riêng. |
| D-46 | Phụ huynh không sửa/đề nghị sửa hồ sơ; được gửi đơn xin nghỉ. |
| D-47 | Ban: 6 seed, có thể thêm; mỗi staff tối đa hai Ban. |
| D-48 | Chỉ Trưởng/Phó Ban tạo thông báo/lịch/công việc tuần. |
| D-49 | Ban Kỹ thuật có thiết bị và mượn/trả ai/lúc nào/note. |
| D-50 | Thông báo chỉ trong web; có read state; không chat/SMS/email/Zalo/schedule. |
| D-51 | Dashboard/report theo tuần, tháng, năm; Excel/PDF; snapshot final; giữ 5 năm. |
| D-52 | Export phải giữ đúng filter/date range. |
| D-53 | Dữ liệu import từ Google Sheets/Excel; duplicate chỉ warning; user review. |
| D-54 | RLS mọi bảng, private storage, service role server-only. |
| D-55 | User tự commit; agent không commit/push nếu không được yêu cầu rõ. |
| D-56 | Sa mạc thiếu nhi là Phase 8 cuối cùng. |
| D-57 | Sa mạc: guardian đăng ký, camp leader assignment, phí và published receipt; chi tiết khác hỏi lại. |

---

## 📖 NHẬT KÝ SESSION (mới nhất ở trên, giữ 6 entry)

### [2026-07-15] Phiên 8 — Codex — P2-T1
- **Làm được:** Tạo staff profiles với mã GLV concurrency-safe, danh xưng gồm Dì/Sơ, trình độ huấn luyện; class assignments có lịch sử, one-active-class/staff, one-active-representative/class, role-capacity alignment; RPC kết thúc assignment nguyên tử; CRUD/RLS và `/staff` UI; account role lớp liên kết staff profile.
- **File thay đổi:** migration `20260715000400`, pgTAP 005, `features/staff/**`, `/staff`, bổ sung auth provision/query/UI, unit staff schemas và generated DB types.
- **Migration/data impact:** Thêm 2 bảng, 4 enums, sequence mã GLV, indexes/triggers/helper/RPC; fresh reset local sạch.
- **Đã test:** `db:reset`/`db:types` ✓; pgTAP 67/67; Auth smoke ✓; `lint`/`typecheck` ✓; unit 34/34; `build` ✓; E2E 15/15.
- **Quyết định mới:** Kết thúc assignment lớp sẽ kết thúc active class role tương ứng trong cùng transaction; role lớp mới bắt buộc assignment đúng capacity.
- **Blocker/rủi ro:** P1 auth/role/RLS high-risk và P2-T1 RLS cần Claude independent verification trước production.
- **Next action:** `P2-T2 — Guardians and students`.

### [2026-07-15] Phiên 7 — Codex — P1-T4
- **Làm được:** Kiểm thử JWT thật cho self/global/disabled/anon, one-active-role và account write denial; kiểm service-role boundary/invalid UUID; smoke Supabase Auth local đủ provision/login/change/reset/disable; Gate Phase 1 đạt.
- **File thay đổi:** pgTAP `004_identity_rls_test.sql`, unit `identity-security.test.ts`, `auth/permissions.ts`, script `test-auth-flow.mjs`, package script và phase/worklog.
- **Migration/data impact:** Không thêm migration; auth smoke tự cleanup user test.
- **Đã test:** pgTAP 50/50; Auth smoke ✓; `lint`/`typecheck` ✓; unit 31/31; `build` ✓; E2E 15/15.
- **Quyết định mới:** Không có.
- **Blocker/rủi ro:** Identity/Auth/RLS high-risk vẫn cần Claude independent verification trước production.
- **Next action:** `P2-T1 — Staff profiles and class assignments`.

### [2026-07-15] Phiên 6 — Codex — P1-T3
- **Làm được:** Nối login alias nội bộ cho student/staff/guardian/admin, đổi mật khẩu thật, profile/session guard; tạo/reset/disable account SA-only qua Admin API server-only; mật khẩu tạm ngẫu nhiên 8 ký tự chỉ trả một lần; bổ sung account admin UI.
- **File thay đổi:** migration `20260715000300`, pgTAP 003, `features/auth/{aliases,schemas,server,components}/**`, login/change-password/admin pages và generated DB types.
- **Migration/data impact:** Thêm RPC hẹp `complete_password_change`; không lưu plaintext/hash mật khẩu trong public schema.
- **Đã test:** `db:reset`/`db:types` ✓; pgTAP 34/34; `lint`/`typecheck` ✓; unit 28/28; `build` ✓ (21 pages).
- **Quyết định mới:** Auth alias chỉ dùng server action; profile email là email liên hệ, không phải alias đăng nhập.
- **Blocker/rủi ro:** Auth/reset là high-risk — fixed, awaiting independent verification bởi Claude.
- **Next action:** `P1-T4 — RLS identity tests` và Gate Phase 1.

### [2026-07-15] Phiên 5 — Codex — P1-T2
- **Làm được:** Tạo schema năm học/ngành/cấp/template/lớp, seed 5/14/20, one-current constraint, RPC nguyên tử set current, RPC sinh lớp idempotent, Server Actions và giao diện quản trị năm học.
- **File thay đổi:** migration `20260715000200`, `seed.sql`, pgTAP 002, feature `academic-years/**`, trang `/admin`, Supabase client typing, unit schema test, generated DB types.
- **Migration/data impact:** Thêm 5 bảng danh mục/nghiệp vụ và reference seed; reset local sạch.
- **Đã test:** `db:reset`/`db:types` ✓; pgTAP 30/30; `lint`/`typecheck` ✓; unit 23/23; `build` ✓ (21 pages).
- **Quyết định mới:** Business RPC đặt trong `public` để PostgREST gọi được, helper bảo mật vẫn ở schema `app` không expose.
- **Blocker/rủi ro:** Không có blocker mới.
- **Next action:** `P1-T3 — Auth alias/provision/reset`.

### [2026-07-15] Phiên 4 — Codex — P1-T1
- **Làm được:** Hoàn thiện enums, `profiles`, `role_assignments`, one-active-role, helper schema/functions fail-closed; tài khoản locked/disabled không còn role hiệu lực; session đọc profile và active assignment thật.
- **File thay đổi:** `supabase/migrations/20260715000100_identity_foundation.sql`, `supabase/tests/001_identity_foundation_test.sql`, `src/lib/auth/session.ts`, generated `src/types/database.ts`, phase plan và WORKLOG.
- **Migration/data impact:** Migration identity mới; reset DB local sạch, không có production data.
- **Đã test:** `db:reset` ✓; `db:types` ✓; `test:db` 14/14; `lint` ✓; `typecheck` ✓; unit 20/20; `build` ✓ (21 pages).
- **Quyết định mới:** Không có.
- **Blocker/rủi ro:** Role/RLS foundation cần Claude xác minh độc lập trước production.
- **Next action:** `P1-T2 — Academic year/sector/grade/class schema`.

### [2026-07-15] Phiên 3 — Codex — P0-T3
- **Làm được:** Tạo role constants/labels/scope, route map fail-closed, AuthContext và server guards; dashboard/direct module URL bắt buộc session; navigation lọc theo context và bỏ user/role mẫu production.
- **File thay đổi:** `src/lib/{auth,permissions}/**`, `src/config/navigation.ts`, app shell/header/user menu, protected module routes, unit permission tests và E2E auth-guard smoke.
- **Migration/data impact:** Không có.
- **Đã test:** `lint`, `typecheck`, `build` ✓; unit 20/20; E2E 15/15 tại 3 viewport.
- **Quyết định mới:** Không có; UI navigation không thay authorization server/RLS.
- **Blocker/rủi ro:** AuthContext chưa đọc profile/active assignment cho đến P1-T1.
- **Next action:** `P1-T1 — Core enums/helpers/migrations`.

_(Giữ tối đa 6 entry gần nhất.)_
