# M05-ATTENDANCE — Module Discovery

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Mọi khẳng định đều kèm `file:line`.
> Nguồn nghiệp vụ: `docs/03-workflow.md` WF-05 (113–162), WF-06 (163–176), WF-10 (228–241);
> `docs/02-database-design.md` §7; `docs/05-permission-matrix.md:39,108,120-123,191-194`;
> `docs/06-ui-ux-spec.md:104-105,278-331`; `docs/11-api-and-server-actions.md:68-150`;
> `AGENTS.md` §8; `CLAUDE.md` §5.

## 1. Mục tiêu nghiệp vụ

1. Ghi nhận buổi sinh hoạt **duy nhất theo (lớp, ngày, thứ Năm/Chúa nhật)** — D-29, ràng buộc
   `attendance_sessions_unique` (`supabase/migrations/20260721000300_attendance_sessions.sql:53`) và
   `attendance_sessions_meeting_day` (`:55-58`).
2. Điểm danh thiếu nhi với **hai trạng thái độc lập**: Thánh lễ và Giáo lý (D-30) — hai cột riêng
   `mass_status`/`catechism_status`, mặc định `present` (`:87-88`).
3. Chống hai giáo lý viên ghi đè nhau bằng **claim + lease 15 phút tính bằng giờ DB** (D-32) —
   `claim_attendance_session` (`:390-494`), `heartbeat_attendance_session` (`:498-537`),
   `takeover_attendance_session` (`:541-593`).
4. **Chốt buổi** rồi **khóa sau 3 ngày** theo cấu hình năm học (D-33) — `save_and_finalize_attendance`
   (`:599-750`), `locked_at = finalized_at + attendance_lock_days` (`:707`).
5. **Super Admin mở khóa** và từ đó tới lần chốt kế tiếp chỉ Super Admin ghi được —
   `unlock_attendance_session` (`:754-783`), cờ `unlocked_at` (`:643-645`).
6. **Điểm danh giáo lý viên** trong cùng buổi (D-35) — `staff_attendance_records` (`:107-129`).
7. **Đơn xin nghỉ của phụ huynh** chỉ là *đề nghị*, không bao giờ tự ghi vào điểm danh (WF-10 bước 6–7,
   D-36) — `supabase/migrations/20260721000400_absence_requests.sql:1-12,174-175`.
8. **Cảnh báo chuyên cần và điểm chuyên cần** tính qua view trên các buổi đã chốt (WF-06, D-58/D-59) —
   `supabase/migrations/20260721000500_attendance_alerts_and_score.sql:98-255`.

## 2. Actor

| Actor | Được làm gì |
|---|---|
| GLV đại diện / GLV lớp / Dự trưởng phụ tá | Mở buổi, claim, sửa nháp, tiếp quản, chốt, điểm danh nhân sự — **chỉ ở lớp có `class_staff_assignment` hoặc `role_assignments.class_id` của mình** (`20260715000400_staff_and_class_assignments.sql:202-220`) |
| Trưởng/Phó ngành | Xem mọi buổi trong ngành (`scope_class_ids()`), **không** tự điểm danh mọi lớp trong ngành — `docs/05-permission-matrix.md:123`, `can_edit_attendance` (`20260721000300:243-251`) |
| XĐ trưởng / Phó XĐ / Thư ký | `can_global_read()` → xem mọi buổi; **không** có nhánh ghi trong `can_edit_attendance` |
| Super Admin | Mọi lớp, mở khóa, sửa buổi đã mở khóa (`:250`, `:457-463`, `:766-768`) |
| Phụ huynh | Xem điểm danh **đã chốt** của con; gửi/hủy đơn xin nghỉ (`20260721000400:151-156`) |
| Thiếu nhi | Xem điểm danh **đã chốt** của chính mình; **không** tự gửi đơn (`20260721000400:149-150`) |
| Cha sở / Cha phó / Thủ quỹ | **Bị chặn khỏi `/attendance`** bởi `OPERATIONAL_STAFF_ROLES` (`src/lib/permissions/route-map.ts:9-11,29`) — mâu thuẫn `docs/05-permission-matrix.md:39` (👁 / 👁 báo cáo). Xem BR-M05-24. |

## 3. Route

| Route | File | Guard |
|---|---|---|
| `/attendance` | `src/app/(dashboard)/attendance/page.tsx:33-145` | `requireRouteAccess("/attendance")` qua `getAttendanceHubData` (`src/features/attendance/server/queries.ts:120`) → `OPERATIONAL_STAFF_ROLES` |
| `/attendance/[sessionId]` | `src/app/(dashboard)/attendance/[sessionId]/page.tsx:15-88` | `requireRouteAccess("/attendance/${id}")` (`queries.ts:196`); `getRouteRule` khớp prefix `/attendance` (`route-map.ts:50-54`) |
| `/parent/absence-requests` | `src/app/(dashboard)/parent/absence-requests/page.tsx:6-18` | `requireRouteAccess("/parent/absence-requests")` (`src/features/portal/server/queries.ts:120`) — rule `/parent` không giới hạn role (D-25, `route-map.ts:36`) |

Route `docs/06-ui-ux-spec.md` yêu cầu nhưng **chưa có màn hình staff cho đơn xin nghỉ** (WF-10 bước 5).

## 4. Component

| Component | File | Loại |
|---|---|---|
| `AttendanceEditor` | `src/features/attendance/components/attendance-editor.tsx:65-364` | client — draft state, heartbeat, save/finalize, takeover |
| Form "Mở buổi điểm danh" | `src/app/(dashboard)/attendance/page.tsx:81-102` | server form → `openAttendanceSessionFromForm` |
| Form "Mở khóa" | `src/app/(dashboard)/attendance/[sessionId]/page.tsx:57-62` | server form → `unlockAttendanceSessionFromForm` |
| `AbsenceRequestPanel` | `src/features/absence-requests/components/absence-request-panel.tsx:33-187` | client — gửi/hủy đơn |
| Nhãn tiếng Việt | `src/features/attendance/constants.ts:9-47` | shared |

## 5. Server Action / Query / RPC

| Tên | File:line | Guard tầng app | RPC/DB |
|---|---|---|---|
| `claimAttendanceSession` | `src/features/attendance/server/actions.ts:59-88` | `requireAuthContext("/attendance")` (chỉ auth, **không** kiểm role) | `claim_attendance_session` |
| `heartbeatAttendanceSession` | `:90-103` | như trên | `heartbeat_attendance_session` |
| `takeoverAttendanceSession` | `:105-119` | như trên | `takeover_attendance_session` |
| `saveAttendance` | `:132-176` | như trên | `save_and_finalize_attendance` |
| `unlockAttendanceSession` | `:178-194` | **có** kiểm `role !== "super_admin"` (`:182`) | `unlock_attendance_session` |
| `openAttendanceSessionFromForm` | `:206-217` | — | gọi `claimAttendanceSession` rồi `redirect` |
| `unlockAttendanceSessionFromForm` | `:198-204` | — | gọi `unlockAttendanceSession` |
| `getAttendanceHubData` | `src/features/attendance/server/queries.ts:119-147` | `requireRouteAccess` | SELECT (RLS) |
| `getAttendanceSessionDetail` | `:193-353` | `requireRouteAccess` | SELECT (RLS) |
| `createAbsenceRequest` | `src/features/absence-requests/server/actions.ts:28-75` | `requireAuthContext("/parent/absence-requests")` | INSERT (RLS + trigger) |
| `cancelAbsenceRequest` | `:77-92` | như trên | UPDATE (RLS + trigger) |
| `acknowledgeAbsenceRequest` | `:94-112` | `requireAuthContext("/attendance")` | UPDATE — **không có UI nào gọi** (orphan) |
| `getPortalAttendance` | `src/features/portal/server/queries.ts:56-113` | — | view + SELECT (RLS) |

Ánh xạ lỗi RPC → tiếng Việt: `actions.ts:24-47`, thông điệp gốc `src/lib/errors/index.ts:19-35`.

## 6. Bảng DB / View

| Đối tượng | Migration | Ghi chú |
|---|---|---|
| `attendance_sessions` | `20260721000300:33-77` | Chỉ `select` cho `authenticated` (`:283`) |
| `student_attendance_records` | `:79-105` | Cột phi chuẩn hóa `class_id`/`student_id`/`session_finalized_at` cho RLS |
| `staff_attendance_records` | `:107-129` | |
| `absence_requests` | `20260721000400:20-53` | `select, insert, update` cho `authenticated` (`:137`) |
| `attendance_weight_settings` | `20260721000500:35-52` | Auto-seed mỗi năm học (`:60-80`) |
| `v_student_attendance_summary` | `:98-215` | `security_invoker`, chỉ buổi `finalized_at is not null` (`:130`) |
| `v_class_attendance_summary` | `:217-234` | |
| `v_staff_attendance_summary` | `:236-255` | |
| `refresh_attendance_assessment_scores` | `20260722000500:81-146` | Cross-module M07 |

Trigger: `sync_student_attendance_keys` (`20260721000300:136-191`), `sync_staff_attendance_keys`
(`:193-235`), `validate_absence_request` (`20260721000400:61-131`).

## 7. Role / Permission

- Ghi điểm danh: **chỉ qua RPC SECURITY DEFINER**. `authenticated` không có `insert/update` trên ba
  bảng điểm danh (`20260721000300:283-285`) — pgTAP chứng minh (`supabase/tests/012_attendance_test.sql:134-149`).
- `app.can_edit_attendance` = `is_super_admin() or is_class_staff()` (`:243-251`); `is_class_staff`
  gồm cả `class_staff_assignments` (`20260715000400:202-220`) → khớp `getEditableClasses`
  (`queries.ts:91-116`).
- Phụ huynh/thiếu nhi: policy chỉ mở dòng `session_finalized_at is not null` và
  `student_id = any(own_student_ids())` (`20260721000300:320-330`). `role_assignments_scope_matches_role`
  bắt `class_id is null` cho role `guardian`/`student` (`20260715000100:76-80`) nên
  `scope_class_ids()` của họ luôn rỗng → không có đường vòng.

## 8. Phụ thuộc

| Chiều | Module | Điểm nối |
|---|---|---|
| Vào | M02 Academic structure | `academic_years.attendance_lock_days`, `attendance_edit_lease_minutes`, ngưỡng cảnh báo (`20260721000500:18-24`) |
| Vào | M03 Students/Enrollments | `seed_attendance_roster` đọc `enrollments` (`20260721000300:364-374`) |
| Vào | M04 Staff | `class_staff_assignments` cho roster nhân sự (`:376-384`) |
| Ra | M07 Assessments | `refresh_attendance_assessment_scores` đọc `v_student_attendance_summary` (`20260722000500:114-122`) |
| Ra | M11 Dashboard | `riskReasons` đọc cờ cảnh báo (`src/features/dashboard/server/queries.ts:61-72`) |
| Ra | M13 Portal | `getPortalAttendance` (`src/features/portal/server/queries.ts:56-113`) |
| Ra | M14 Navigation | `src/config/navigation.ts:45-47,82-99` |

## 9. Mức quan trọng

**Cao nhất trong hệ thống.** `docs/06-ui-ux-spec.md:280` — "Đây là màn hình quan trọng nhất".
Dùng hằng tuần bởi ~40 GLV, chủ yếu trên điện thoại, hai buổi/tuần × 19 lớp.

## 10. Tình trạng test

| Loại | File | Phạm vi |
|---|---|---|
| pgTAP | `supabase/tests/012_attendance_test.sql` | `plan(67)` (`:11`) — quyền claim, mặc định present, chặn ghi thẳng, lease, tiếp quản, editor cũ bị chặn, hai status độc lập, chốt/chốt lại, RLS phụ huynh, khóa 3 ngày, mở khóa, đơn xin nghỉ, view cảnh báo/điểm. Chạy dưới JWT thật, không service role (`:5-6`) |
| Unit | `tests/unit/attendance-schemas.test.ts` | `meetingTypeForDate`, `isAbsent`, `saveAttendanceSchema`, `createAbsenceRequestSchema` |
| E2E | `tests/e2e/attendance.spec.ts` | 5 bài: mở→sửa→chốt→phụ huynh đọc; **hai người dùng tranh chấp thật** (2 browser context); khóa trôi qua khi trang đang stale; gửi/hủy đơn; phụ huynh bị chặn `/attendance` |

**Khoảng trống test:** không có bài nào cho (a) buổi đã mở khóa rồi Super Admin sửa lại,
(b) em rời lớp giữa chừng, (c) staff xử lý đơn xin nghỉ (chưa có UI), (d) ngày mặc định theo
múi giờ Việt Nam.
