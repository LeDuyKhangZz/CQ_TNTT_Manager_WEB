# 08 — Phase Plan

## Cách dùng

- Mỗi task có ID.
- Agent claim task trong `WORKLOG.md`.
- Không làm task phase sau nếu gate phase trước chưa đạt, trừ user yêu cầu.
- `☐` chưa làm, `◐` đang làm, `☑` xong, `⚠` blocked.
- Definition of Done phải có bằng chứng thật.

---

# Phase 0 — Repository bootstrap và baseline

## P0-T1 — Audit/scaffold repository ☐

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

## P0-T2 — App shell, design tokens, auth layout ☐

- Responsive sidebar/header.
- Mobile bottom nav.
- Login/change password placeholder wired.
- Error/404/loading.
- PWA manifest baseline.

## P0-T3 — Permission/navigation skeleton ☐

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

## P1-T1 — Core enums/helpers/migrations ☐

- Enums.
- `profiles`, `role_assignments`.
- RLS helper schema/functions.
- One active role constraint.

## P1-T2 — Academic year/sector/grade/class schema ☐

- Seed 5 sectors, grade levels, 20 class template.
- Current year constraint.
- Admin CRUD.

## P1-T3 — Auth alias/provision/reset ☐

- Username login.
- Internal email alias.
- SA account create/reset/disable.
- Must change password.
- Password never viewable.

## P1-T4 — RLS identity tests ☐

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

## P2-T1 — Staff profiles and class assignments ☐

- Titles incl. Dì/Sơ.
- Formation level.
- One class at a time.
- One representative/class.
- Historical assignment.

## P2-T2 — Guardians and students ☐

- One guardian/student.
- One guardian many students.
- Student code.
- Health, sacraments, hardship.
- Student detail tabs, no promotion tab.

## P2-T3 — Enrollments and class detail ☐

- One open enrollment.
- 20 class cards grouped by sector.
- Roster and team.
- A/B.

## P2-T4 — Import Excel dry-run/commit ☐

- Template.
- Warning duplicate.
- Error report.
- User review.
- Google Sheet export workflow.

## P2-T5 — Core RLS tests ☐

- Same-class student isolation.
- Guardian ownership.
- Class/sector/global scope.
- Health/sacrament.

### Gate Phase 2

- Import sample Vietnamese data.
- 900-row seed/performance smoke.
- No cross-scope leakage.
- Student/guardian/staff/class UI usable.

---

# Phase 3 — Attendance

## P3-T1 — Attendance session/RPC locking ☐

- Unique session.
- Claim/heartbeat/takeover.
- 15-minute lease.
- 3-day lock.

## P3-T2 — Student attendance UI ☐

- Default present.
- Two independent statuses.
- Mobile optimized.
- Finalize summary.

## P3-T3 — Staff attendance ☐

- Thu/Sun.
- 3 statuses.
- Summary.

## P3-T4 — Absence request ☐

- Guardian create.
- Staff suggestion.
- No auto-update locked attendance.

## P3-T5 — Alerts and attendance score ☐

- Warnings.
- Weighted score settings.
- Views/dashboard.

## P3-T6 — Attendance security/concurrency tests ☐

### Gate Phase 3

- Two browser users concurrency verified.
- Old editor cannot overwrite.
- Locked behavior.
- Parent/student see own finalized record.
- Mobile E2E.

---

# Phase 4 — Teaching plan

## P4-T1 — Teaching plan CRUD ☐

- Representative owner.
- Year schedule.
- Required fields.
- Teacher assignment.

## P4-T2 — Week-ahead views ☐

- Staff.
- Guardian.
- Student.
- Test label.

## P4-T3 — Materials storage ☐

- Private bucket.
- Signed URL.
- Scope policies.

### Gate Phase 4

- Representative edits; others read as designed.
- Guardian/student only see safe fields.
- Storage private.

---

# Phase 5 — Assessments, results, Top 5, promotion

## P5-T1 — Dynamic assessments and score grid ☐

- 15m/mid/final/custom/attendance.
- 0..10.
- weights.
- null vs 0.

## P5-T2 — Attendance score and comments ☐

- System proposal.
- Override.
- public/internal notes.

## P5-T3 — Gradebook lock/export ☐

- Representative lock.
- SA unlock.
- Excel/PDF class.

## P5-T4 — Top 5 ☐

- Feature flag.
- multiple source types.
- publish snapshot.
- student/guardian view.

## P5-T5 — Promotion workflow ☐

- Proposal.
- sector approval.
- A/B.
- repeat/pause/withdraw.
- Hiệp 2 → trainee proposal.

## P5-T6 — Result portals ☐

- Parent.
- Student.
- Published only.

## P5-T7 — Security/integrity E2E ☐

### Gate Phase 5

- No score leakage.
- Locked gradebook.
- Promotion atomic.
- Top 5 only 5 entries.
- Export filter correct.

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
