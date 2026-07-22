# 08 — Phase Plan

## Cách dùng

- Mỗi task có ID.
- Agent claim task trong `WORKLOG.md`.
- Không làm task phase sau nếu gate phase trước chưa đạt, trừ user yêu cầu.
- `☐` chưa làm, `◐` đang làm, `☑` xong, `⚠` blocked.
- Definition of Done phải có bằng chứng thật.

---

# Phase 0 — Repository bootstrap và baseline

## P0-T1 — Audit/scaffold repository ☑

**Scope**

- Nếu repo đã có: đọc source, package, migrations, route, test; không xóa làm lại trước khi audit.
- Nếu repo trống: scaffold Next.js TypeScript.
- Setup Tailwind/shadcn, lint, typecheck, Vitest, Playwright, Supabase local.
- Copy bộ docs vào repo.
- `.env.example`, `.gitignore`.
- Không commit secret.

**DoD**

- `npm run lint`, `typecheck`, `test`, `build` chạy được.
- Supabase local start/reset được hoặc blocker ghi rõ.
- WORKLOG cập nhật.

## P0-T2 — App shell, design tokens, auth layout ☑

- Responsive sidebar/header.
- Mobile bottom nav.
- Login/change password placeholder wired.
- Error/404/loading.
- PWA manifest baseline.

## P0-T3 — Permission/navigation skeleton ☑

- Role constants.
- Route map.
- Server auth guard.
- No fake hardcoded role in production path.

### Gate Phase 0

- Build xanh.
- Mobile/desktop shell.
- Docs và WORKLOG hoạt động.
- Không secret.

---

# Phase 1 — Database, Auth, RLS foundation

## P1-T1 — Core enums/helpers/migrations ☑

- Enums.
- `profiles`, `role_assignments`.
- RLS helper schema/functions.
- One active role constraint.

## P1-T2 — Academic year/sector/grade/class schema ☑

- Seed 5 sectors, grade levels và 19 class template: không có Chiên Con 3, Thiếu 3 không chia A/B, có 1 lớp Dự trưởng trong HK1.
- Current year constraint.
- Admin CRUD.

> Cấu trúc 19 lớp được user sửa sau khi P1-T2 hoàn tất; implementation hiện tại vẫn là cấu trúc 20 lớp cũ và phải được sửa tại P1-T2B.

## P1-T2B — Correct canonical 19-class structure ☑

- Migration mới, không sửa migration đã áp dụng.
- Bỏ Chiên Con 3; gộp Thiếu 3A/B thành một lớp Thiếu 3.
- Thêm đúng một lớp Dự trưởng không thuộc sector/grade, chỉ hoạt động trong HK1.
- Cập nhật seed, RPC sinh lớp, UI quản trị, generated types và pgTAP.
- Hoàn tất trước P2-T3.

> Migration `20260716000300`. Thêm enum `class_kind`/`term_scope`, cột `grade_levels.allows_sections` (section theo cấp thay vì theo ngành), `class_kind`/`term_scope` cho `class_templates`/`classes`; grade_level_id nullable cho lớp trainee; partial-unique một trainee/năm; RPC `generate_default_classes` sinh đúng 19 lớp. Seed 13 cấp + 19 template. pgTAP 002 cập nhật + `008_canonical_classes_test`.

## P1-T3 — Auth alias/provision/reset ☑

- Username login.
- Internal email alias.
- SA account create/reset/disable.
- Must change password.
- Password never viewable.

## P1-T3B — Account lifecycle and identity links ☑

- Super Admin đổi username hoặc đặt mật khẩu mới cho account không phải Super Admin.
- Super Admin xóa account không phải Super Admin; hồ sơ nghiệp vụ được giữ lại và bỏ liên kết account.
- Account guardian/student bắt buộc liên kết đúng một `guardians`/`students` record chưa có account.
- Mọi role GLV bắt buộc liên kết `staff_profiles`; role lớp còn phải có phân công đúng lớp/capacity.
- Không cho Super Admin tự sửa/xóa account đang đăng nhập hoặc quản trị account Super Admin khác qua luồng này.

## P1-T4 — RLS identity tests ☑

- Roles.
- One active.
- account admin SA only.
- invalid UUID.
- service role server-only.

### Gate Phase 1

- Fresh DB reset.
- Account flow end-to-end local.
- Non-SA cannot provision/reset.
- RLS fail-closed.

---

# Phase 2 — Core people, classes, import

## P2-T1 — Staff profiles and class assignments ☑

- Titles incl. Dì/Sơ.
- Formation level.
- One class at a time.
- One representative/class.
- Historical assignment.

## P2-T2 — Guardians and students ☑

- One guardian/student.
- One guardian many students.
- Student code.
- Health, sacraments, hardship.
- Student detail tabs, no promotion tab.

> Migration `20260716000100`. Scope hiện tại: global read/write + guardian owner + self student; health/bí tích staff-only (global read). Scope theo ngành/lớp qua enrollment sẽ mở rộng `app.can_access_student`/`app.can_view_student_sensitive` ở P2-T3.

## P2-T3 — Enrollments and class detail ☑

- One open enrollment.
- 19 class cards: 18 lớp giáo lý grouped by sector và 1 lớp Dự trưởng HK1 hiển thị riêng, không gán thành sector.
- Roster and team.
- A/B.

> Migration `20260716000500`. Bảng `enrollments` (partial-unique một enrollment mở/năm), trigger `app.validate_enrollment` khớp class/year, helper `app.can_manage_class`; không hard delete (không cấp DELETE). Mở rộng `app.can_access_student`/`app.can_view_student_sensitive` thêm scope ngành/lớp qua enrollment. UI `/classes` (19 card 5 ngành + Dự trưởng) + `/classes/[id]` (đội ngũ/roster/ghi danh); student detail thêm tab Lịch sử lớp. pgTAP `009_enrollments_test`. Health/bí tích edit vẫn global-write (class-staff edit để phase sau).

## P2-T4 — Import Excel dry-run/commit ☑

- Template.
- Warning duplicate.
- Error report.
- User review.
- Google Sheet export workflow.

> Migration `20260721000100`. Bảng staging `import_batches`/`import_rows` + RPC
> `commit_import_rows` (chunk 100/transaction, lỗi một dòng ghi lên chính dòng đó, guardian reuse
> theo phone chuẩn hóa, student code từ sequence). RLS: chỉ global-write đọc/ghi/xóa được.
> Parser `exceljs` đọc 3 layout (template chuẩn, SYLL, DS_dau_nam) + chuẩn hóa ngày/SĐT/tên/alias lớp
> + chấm trùng High/Medium/Low. UI `/imports` (upload, chọn lớp đích) và `/imports/[batchId]`
> (review từng dòng, chọn giới tính, tạo mới/ghép/bỏ qua, commit). Chi tiết khảo sát file thật và
> các quyết định: `docs/09` §2b.
>
> **Chưa làm (ngoài scope đã chốt):** import GLV (không có file mẫu — xem BLK-2b) và
> export kết quả lỗi ra file tải về (hiện hiển thị trên UI).

## P2-T5 — Core RLS tests ☑

- Same-class student isolation.
- Guardian ownership.
- Class/sector/global scope.
- Health/sacrament.

> pgTAP `010_core_rls_test` (28 assertion): hai trò cùng lớp Ấu 1A + một trò lớp Thiếu 1A. Kiểm bằng JWT thật: student/guardian chỉ thấy của mình (không đọc peer/health), class staff theo assignment chỉ thấy lớp mình, sector leader Ấu không chạm Thiếu, global thấy tất cả; guardian/student không ghi danh (42501). Không phát hiện rò rỉ cross-scope. Toàn bộ pgTAP 160/160.

### Gate Phase 2 ☑

- Import sample Vietnamese data.
- 900-row seed/performance smoke.
- No cross-scope leakage.
- Student/guardian/staff/class UI usable.

> **Đạt 2026-07-21.** Bằng chứng thật, chạy trên Supabase local:
>
> - **Import dữ liệu thật:** `GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-import.test.ts` chạy đúng pipeline của `/imports` (parse → buildRow → staging → RPC `commit_import_rows`) bằng JWT của Xứ đoàn trưởng trên **18 sổ lớp thật**: parse 489 dòng, **ghi được 405**, 84 dòng bị chặn do file gốc thiếu SĐT/ngày sinh, **0 dòng hỏng khi ghi**. Tiếng Việt có dấu giữ nguyên sau Excel → JSON → Postgres.
> - **Perf smoke 900:** `npm run perf:smoke` bơm lên 900 thiếu nhi / 900 ghi danh / 19 lớp rồi đo bằng JWT thật. Lần đo đầu lộ ra RLS gọi hàm theo từng dòng (GLV lớp đọc `students`: **2.458 ms**, 43.504 buffer). Migration `20260721000200_scope_lookup_performance.sql` chuyển policy sang so khớp tập hợp tính một lần (InitPlan). Sau sửa: `/students` 1.420 → **109 ms**, `/classes` 734 → **14 ms**, roster lớp đông nhất 306 → **9 ms**, GLV lớp 3.684 → **47 ms**; ở tầng DB 2.458 → **28,9 ms**.
> - **No cross-scope leakage:** pgTAP **186/186** sau khi đổi policy (010 giữ nguyên 28 assertion), cộng `tests/integration/gate-phase2-scope.test.ts` **8/8** chạy lại trên chính bộ 900 em: trưởng ngành Ấu thấy đúng tập ngành Ấu, GLV lớp thấy đúng roster lớp mình cộng con mình (D-25), không đọc được sức khỏe lớp khác, không ghi được sang lớp khác, phụ huynh/thiếu nhi chỉ thấy phần của mình và không đọc sức khỏe, phụ huynh không tạo được hồ sơ.
> - **UI dùng được:** `npm run test:e2e` **33/33** trên ba viewport (360/768/1366), gồm bộ mới `authenticated-shell.spec.ts` đăng nhập thật rồi đi `/students`, hồ sơ một em, `/classes` (đủ 19 thẻ), chi tiết lớp, `/staff`, `/imports`; không trang nào tràn ngang; phụ huynh bị chặn đúng về `/access-denied` ở cả 4 route staff.
> - **Fixture dev (docs/07 §14):** `npm run seed:dev` dựng năm học hiện hành, 19 lớp, 2 SA, cha sở/cha phó, ban điều hành, trưởng/phó 2 ngành, 2 lớp A/B mỗi lớp 2 GLV, 1 Dự trưởng, 2 phụ huynh, 1 GLV kiêm phụ huynh, 4 thiếu nhi, 1 account thiếu nhi.

---

# Phase 3 — Attendance

## P3-T1 — Attendance session/RPC locking ☑

- Unique session — `attendance_sessions` unique `(class_id, attendance_date, meeting_type)`; chỉ thứ Năm/Chúa nhật (CHECK + kiểm trong RPC, D-29).
- Claim/heartbeat/takeover — `claim_attendance_session`, `heartbeat_attendance_session`, `takeover_attendance_session`, tất cả khóa dòng session rồi mới ghi.
- 15-minute lease — đọc `academic_years.attendance_edit_lease_minutes`, so bằng giờ DB (D-32).
- 3-day lock — `locked_at = finalized_at + attendance_lock_days`; sau khi Super Admin mở khóa thì chỉ Super Admin sửa được (D-33).
- Ghi chỉ qua RPC: `authenticated` không có quyền INSERT/UPDATE trên ba bảng điểm danh.

## P3-T2 — Student attendance UI ☑

- Default present — roster nạp sẵn `present/present` ngay khi claim (D-31).
- Two independent statuses — hai `select` riêng cho Thánh lễ và Giáo lý (D-30).
- Mobile optimized — `/attendance` và `/attendance/[sessionId]`, mọi control cao 44px, E2E ba viewport không tràn ngang.
- Finalize summary — RPC trả sĩ số/đủ hai buổi/có vắng/GLV có mặt.

## P3-T3 — Staff attendance ☑

- Thu/Sun — cùng session với thiếu nhi, không có bảng buổi riêng.
- 3 statuses — `staff_attendance_status` (D-35).
- Summary — `v_staff_attendance_summary` theo GLV/lớp/năm học.

## P3-T4 — Absence request ☑

- Guardian create — `absence_requests`, RLS chỉ cho phụ huynh của chính em đó gửi; `/parent/absence-requests`.
- Staff suggestion — trang điểm danh hiện đơn đang chờ ngay cạnh tên em.
- No auto-update locked attendance — không có trigger nào ghi vào `student_attendance_records`; người điểm danh vẫn tự chọn (WF-10 bước 6).

## P3-T5 — Alerts and attendance score ☑

- Warnings — ngưỡng cấu hình theo năm học, mặc định 3 buổi / 3 Chúa nhật / 80% (D-58), sửa trong `/admin`.
- Weighted score settings — `attendance_weight_settings` theo docs/02 §7.4, tự sinh cho mỗi năm học.
- Views/dashboard — `v_student_attendance_summary`, `v_class_attendance_summary`, `v_staff_attendance_summary` (security_invoker). Hai điểm chuyên cần tách riêng Lễ/Giáo lý (D-59).

## P3-T6 — Attendance security/concurrency tests ☑

- Hai browser context đăng nhập thật bằng GLV909/GLV910: B bị giới hạn chỉ đọc khi A giữ lease;
  sau khi DB xác nhận lease hết hạn, B tiếp quản và lưu được; A dùng trang stale bị RPC từ chối
  bằng thông báo tiếng Việt, dữ liệu B không bị ghi đè.
- Trang stale bị từ chối khi buổi vừa qua mốc khóa; tải lại hiển thị trạng thái khóa và vô hiệu hóa
  toàn bộ control.
- `perf:smoke` dựng lớp Ấu 1A **60 em / 30 buổi** và đo bằng JWT GLV thật: bulk finalize 60 em
  **16 ms**, tải roster **25 ms**, danh sách 24 buổi kèm records **10 ms**, view tổng hợp **16 ms**.

### Gate Phase 3 ☑

- Two browser users concurrency verified.
- Old editor cannot overwrite.
- Locked behavior.
- Parent/student see own finalized record.
- Mobile E2E.

> **Đạt 2026-07-22.** `test:e2e` **48/48** trên 360/768/1366; pgTAP **253/253**; unit/integration
> **118/118** (9 gate Phase 2 skip theo cờ); lint/typecheck/build xanh. Trong lúc thêm E2E đã sửa
> hai lỗi UI: GLV cùng lớp không thấy tên editor do đọc nhầm qua RLS `profiles`, và session đã nhả
> `editing_by` nhưng nút tiếp quản vẫn chờ lease cũ.

---

# Phase 4 — Teaching plan

## P4-T1 — Teaching plan CRUD ☑

- Representative owner.
- Year schedule.
- Required fields.
- Teacher assignment.

## P4-T2 — Week-ahead views ☑

- Staff.
- Guardian.
- Student.
- Test label.

## P4-T3 — Materials storage ☑

- Private bucket.
- Signed URL.
- Scope policies.

### Gate Phase 4 ☑

- Representative edits; others read as designed.
- Guardian/student only see safe fields.
- Storage private.

> **Đạt 2026-07-22.** Fresh `db:reset` áp sạch 3 migration; pgTAP **311/311** (58 assertion Phase 4
> bằng JWT thật và policy `storage.objects`); unit/integration **125/125** (9 gate Phase 2 skip theo
> cờ); lint/typecheck/build xanh; E2E **51/51** trên 360/768/1366. E2E Phase 4 bấm thật chuỗi
> representative tạo bài + upload → class teacher đọc và tải signed URL → guardian chỉ thấy safe
> week-ahead → representative gỡ tệp và xác nhận object vật lý đã biến mất.

---

# Phase 5 — Assessments, results, Top 5, promotion

## P5-T1 — Dynamic assessments and score grid ☑

- 15m/mid/final/custom/attendance.
- Teacher-defined number of columns; no required assessment kind or fixed 15m column.
- Multiple columns of the same kind allowed.
- 0..10.
- Per-assessment positive weights, default 1/2/3/1; assigned teacher may override before lock.
- null vs 0.

## P5-T2 — Attendance score and comments ☑

- System proposal.
- Override.
- public/internal notes.

## P5-T3 — Gradebook lock/export ☑

- Representative lock.
- SA unlock.
- Excel/PDF class.

## P5-T4 — Top 5 ☑

- Feature flag.
- multiple source types.
- publish snapshot.
- student/guardian view.

## P5-T5 — Promotion workflow ☑

- Proposal.
- sector approval.
- A/B.
- repeat/pause/withdraw.
- Hiệp 2 → trainee proposal.

## P5-T6 — Result portals ☑

- Parent.
- Student.
- Published only.

## P5-T7 — Security/integrity E2E ☑

### Gate Phase 5 ☑

- No score leakage.
- Locked gradebook.
- Promotion atomic.
- Top 5 only 5 entries.
- Export filter correct.

> **Đạt 2026-07-22.** Fresh `db:reset` áp sạch 4 migration Phase 5; pgTAP **423/423**
> (`016..019` gồm 112 assertion assessment/comment/Top 5/promotion); unit/integration
> **137/137** (9 gate Phase 2 skip theo cờ); lint/typecheck/build xanh; toàn bộ E2E **54/54**
> trên 360/768/1366. Riêng Phase 5 bấm thật chuỗi tạo/nhập/publish → public/internal comment →
> Top 5 đúng 5 → Excel/PDF đúng lớp → lock/SA unlock → đề xuất/duyệt promotion nguyên tử →
> guardian/student chỉ thấy published và không thấy draft/internal/cross-class.

---

# Phase 6 — Ban, equipment, notifications, dashboard, reports

## P6-T1 — Committees and memberships ☐

- 6 seed Ban.
- max 2.
- positions.
- own committee visibility.

## P6-T2 — Ban content ☐

- Announcement.
- Meeting.
- Weekly checklist.
- leader/deputy write.

## P6-T3 — Ban Kỹ thuật equipment ☐

- Item.
- Borrow/return RPC.
- quantity/condition.
- who/when/note.

## P6-T4 — Notifications ☐

- target scope.
- recipient materialization.
- unread.
- valid deep-links.

## P6-T5 — Dashboards ☐

- Global/sector/class/guardian/student.
- agreed KPIs only.

## P6-T6 — Reports and snapshots ☐

- weekly/month/year.
- Excel/PDF.
- filter preservation.
- immutable snapshot.

## P6-T7 — RLS/E2E ☐

### Gate Phase 6

- Committee isolation.
- Equipment consistency.
- Notifications no wrong recipient.
- Report export matches filters.
- Snapshot immutable.

---

# Phase 7 — Production hardening và Vercel

## P7-T1 — PWA and responsive QA ☐

## P7-T2 — Full regression ☐

- Lint/typecheck/unit/db/e2e/build.
- 360px and 1366px.

## P7-T3 — Performance and indexes ☐

- 900 students.
- EXPLAIN hotspots.

## P7-T4 — Privacy/security review ☐

## P7-T5 — Production seed/admin ☐

- No demo password.
- 2 SA.
- backup ownership.

## P7-T6 — Deploy Supabase/Vercel Hobby ☐

## P7-T7 — Smoke production ☐

### Gate Phase 7

- Production login.
- RLS negative smoke.
- No secret in bundle.
- Backup/export.
- Installable PWA where supported.
- Status can be called deployed only after URL verified.

---

# Phase 8 — Sa mạc thiếu nhi (LAST RELEASE)

Không bắt đầu nếu Phase 1–7 chưa ổn định hoặc user chưa trả lời open questions.

## P8-T1 — Reconfirm business requirements ☐

- Xe/lều/nhóm/thực đơn/y tế/sự cố.
- Payment method.
- Receipt workflow.
- Refund.
- Camp leader permissions.

## P8-T2 — Camp core and assignments ☐

## P8-T3 — Guardian registration ☐

## P8-T4 — Fees and published receipts ☐

## P8-T5 — Camp portal/announcements/schedule ☐

## P8-T6 — Security/financial integrity tests ☐

### Gate Phase 8

- Guardian only registers own child.
- Camp leader only assigned camp.
- Receipt cannot be forged by guardian.
- Amount integer VND.
- Published receipt visible to right guardian.
- No assumptions left undocumented.
