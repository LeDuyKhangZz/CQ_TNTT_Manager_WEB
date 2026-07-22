# 11 — API and Server Actions

## 1. Nguyên tắc

- Không cần public REST API v1.
- UI dùng Server Actions/Route Handlers.
- Read query server-side.
- Complex transaction dùng RPC.
- Input Zod.
- Output typed.
- Error code ổn định.
- Không nhận actor/user role từ client.

## 2. Auth actions

```ts
loginWithUsername(input)
changeOwnPassword(input)
adminProvisionAccount(input)     // SA only
adminResetPassword(input)        // SA only
adminSetPassword(input)          // SA only; force change
adminUpdateUsername(input)       // SA only; Auth alias + profile
adminSetAccountStatus(input)     // SA only
adminDeleteAccount(input)        // SA only; preserve business profile
assignPrimaryRole(input)         // SA only
```

`adminResetPassword` trả password tạm một lần; không lưu/log. Các action sửa/xóa target từ chối account đang đăng nhập và mọi account có active role `super_admin`. `adminProvisionAccount` bắt buộc link `staff_profiles` cho mọi role GLV (role lớp còn kiểm tra assignment/capacity), `guardians` cho guardian và `students` cho student trước khi tạo role assignment.

## 3. Academic/classes

```ts
createAcademicYear
updateAcademicYear
setCurrentAcademicYear
generateDefaultClasses
updateClass
assignStaffToClass
endClassStaffAssignment
```

## 4. People

```ts
createGuardian
createStudent
updateStudentBasicInfo
updateStudentHealth
upsertStudentSacrament
archiveStudent
createStaff
updateStaff
```

Mỗi action có field whitelist. Không dùng generic `update(table,payload)`.

## 5. Enrollment

```ts
enrollStudent
pauseEnrollment
resumeEnrollment
withdrawEnrollment
transferEnrollment
```

Promotion dùng RPC riêng.

## 6. Attendance

### RPC `claim_attendance_session`

Input:

```ts
{
  classId: UUID
  date: ISODate
  meetingType: 'thursday' | 'sunday'
}
```

Output:

```ts
{
  sessionId: UUID
  claimed: boolean
  editorProfileId: UUID
  editorDisplayName: string
  leaseExpiresAt: ISODateTime
}
```

### RPC `heartbeat_attendance_session`

Chỉ editor.

### RPC `save_and_finalize_attendance`

Input roster đầy đủ:

```ts
{
  sessionId: UUID
  students: Array<{
    enrollmentId: UUID
    massStatus: AttendanceStatus
    catechismStatus: AttendanceStatus
    note?: string
  }>
  staff: Array<{
    classStaffAssignmentId: UUID
    status: StaffAttendanceStatus
    note?: string
  }>
  finalize: boolean
}
```

DB:

- lock session;
- verify editor;
- verify unlocked;
- validate roster;
- upsert;
- finalize.

### RPC `takeover_attendance_session`

DB time decides lease.

### RPC `unlock_attendance_session`

Super Admin only (D-33). Đưa buổi đã khóa về `completed`, xóa `locked_at`, và đặt `unlocked_at`
để từ đó tới lần chốt tiếp theo chỉ Super Admin ghi được.

### Đã hiện thực khác gì mô tả trên

- Tên tham số RPC có tiền tố `p_`, cột trả về có tiền tố `out_` (tránh đụng tên cột — cùng quy ước
  với `commit_import_rows`).
- `claim_attendance_session` trả thêm `out_status` và `out_locked`.
- `save_and_finalize_attendance` trả luôn số liệu tổng kết buổi để UI khỏi truy vấn lại.
- RPC ném lỗi với **message là mã ổn định** (`FORBIDDEN`, `ATTENDANCE_LOCKED`,
  `ATTENDANCE_ALREADY_CLAIMED`, `LEASE_NOT_EXPIRED`, `ATTENDANCE_INVALID_MEETING_DAY`,
  `ATTENDANCE_ROSTER_INCOMPLETE`); tầng Server Action ánh xạ sang `AppErrorCode` và câu tiếng Việt.
- Mọi thao tác ghi điểm danh **chỉ** qua các RPC này: `authenticated` không có quyền
  INSERT/UPDATE trên `attendance_sessions`, `student_attendance_records`, `staff_attendance_records`.

## 7. Teaching plan

```ts
ensureTeachingPlan
updateTeachingPlanTitle
createTeachingPlanItem
updateTeachingPlanItem
deleteTeachingPlanItem
uploadTeachingMaterial
removeTeachingMaterial
createTeachingMaterialUrl // signed URL 60 giây, staff scope
getWeekAheadTeachingData // gọi DB RPC safe projection
```

Representative lớp hoặc global-write được ghi plan/item/material. Action kiểm quyền tường minh trước
khi dựa vào RLS. Guardian/student chỉ dùng `get_week_ahead_teaching_items`; không nhận base row hay
signed URL tài liệu. File tối đa 5 MB, MIME allowlist PDF/Office/image/text và bucket private.

## 8. Assessment

```ts
createAssessment
updateAssessment
deleteAssessment
saveAssessmentScores
refreshAttendanceScores
resetAttendanceScoreOverride
createStudentComment
deleteStudentComment
lockGradebook
unlockGradebook // SA
setAssessmentPublished
```

`saveAssessmentScores` should accept batch and run transaction/RPC.

`createAssessment`/`updateAssessment` accept a positive per-assessment weight. They authorize against the actor's class assignment, do not enforce a required assessment kind/count, allow repeated kinds, and reject structural or weight changes after gradebook lock. Super Admin manages academic-year defaults separately.

## 9. Leaderboards

```ts
previewLeaderboard
createLeaderboard
publishLeaderboard
unpublishLeaderboard
saveCustomLeaderboardScores
```

When publish:

- calculate/snapshot entries;
- exactly rank 1..5;
- do not recompute silently afterward.

## 10. Promotion

### RPC `propose_promotion`

Nhận `sourceEnrollmentId`, trạng thái đề xuất, target tùy chọn, cờ Dự trưởng và note. RPC tự lấy
class/student/year từ enrollment, chỉ cho đại diện lớp hoặc global-write, kiểm đúng cấp/năm và
lưu snapshot cảnh báo. Client không gửi actor/class scope.

### RPC `approve_promotion_review`

Input:

```ts
{
  reviewId: UUID
  decision: 'approve' | 'reject'
  targetClassId?: UUID
  note?: string
}
```

Transaction:

1. lock review/source enrollment.
2. authorize sector.
3. validate target.
4. close/update source.
5. create new enrollment if applicable.
6. update review.

Idempotency: if already approved, return existing result or conflict predictably.

Server Actions `proposePromotion` và `reviewPromotion` kiểm lại scope từ row đọc qua RLS trước khi
gọi RPC. Portal dùng query ownership và luôn thêm điều kiện `is_published`/`student_visible` tường
minh, kể cả account đồng thời là staff và guardian.

## 11. Absence request

```ts
createAbsenceRequest
cancelAbsenceRequest
listClassAbsenceRequests
```

Guardian id derived from session.

## 12. Committees/equipment

Hiện thực P6-T1..T3 — `src/features/committees/server/actions.ts` và
`src/features/equipment/server/actions.ts`:

```ts
createCommittee
addCommitteeMember
updateCommitteeMemberPosition
endCommitteeMembership          // không hard delete, giữ lịch sử nhiệm kỳ
publishCommitteeAnnouncement
deleteCommitteeAnnouncement
saveCommitteeMeeting
deleteCommitteeMeeting
saveCommitteeWeeklyPlan         // upsert theo (committee_id, week_start)
deleteCommitteeWeeklyPlan
createEquipmentItem
updateEquipmentItem
borrowEquipment                 // RPC public.borrow_equipment
returnEquipment                 // RPC public.return_equipment
```

Không action nào tin quyền từ client: authorize thật nằm ở RLS/RPC, action chỉ
dịch mã lỗi DB sang thông điệp tiếng Việt (`COMMITTEE_LIMIT_EXCEEDED`,
`EQUIPMENT_NOT_ENOUGH`, `EQUIPMENT_AVAILABLE_READONLY`…).

## 13. Notifications

### `publishNotification`

Input target scope. Server checks actor allowed scope.

Materialize recipients in transaction. Do not create duplicate recipients.

Hiện thực P6-T4 — `src/features/notifications/server/actions.ts`:

```ts
publishNotification          // RPC public.publish_notification
markNotificationRead         // RPC public.mark_notification_read
markAllNotificationsRead     // RPC public.mark_all_notifications_read
```

`link_path` phải nằm trong danh sách route đã tồn tại; kiểm ở cả Zod
(`src/features/notifications/constants.ts`) lẫn CHECK trong DB.

## 14. Reports

```ts
previewReport(filters)
exportReportExcel(filters)
exportReportPdf(filters)
finalizeReportSnapshot(filters)
```

Use a single validated `filters` object for preview and export.

Hiện thực P6-T6: bộ lọc nằm trên URL (`parseReportFilter`), và xem trước, route
tải Excel/PDF lẫn `createReportSnapshot` đều gọi chung `buildReport(filter)` —
một đường tính duy nhất nên file tải về không thể lệch bản đang xem (D-52).

```ts
buildReport(filter)                  // dùng chung cho preview/export/snapshot
createReportSnapshot(filter)         // dựng lại payload từ chính filter, không nhận số liệu từ client
GET /reports/export?…&format=xlsx|pdf
GET /reports/snapshots/[id]/export?format=xlsx|pdf
```

`createReportSnapshot` không nhận payload từ client và không nhận checksum:
trigger `app.seal_report_snapshot` đặt người chốt/thời điểm và tính lại SHA-256.

Example:

```ts
const reportFilterSchema = z.object({
  academicYearId: z.string().uuid(),
  scopeType: z.enum(['global', 'sector', 'class']),
  scopeId: z.string().uuid().nullable(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  meetingTypes: z.array(z.enum(['thursday', 'sunday'])),
  statuses: z.array(attendanceStatusSchema).optional()
})
```

## 15. Import

```ts
uploadImportFile
parseImportBatch
reviewImportRow
commitImportBatch
downloadImportErrors
```

File parse server-side. Limit size/row count.

## 16. Route handlers

Chỉ dùng khi cần:

- File download.
- PWA manifest/service worker.
- Auth callback nếu dùng.
- Report file.
- Signed material redirect.

Mọi route handler phải authenticate/authorize.

## 17. Error translation

Map DB/app errors:

```ts
function toUserFacingError(error): {
  code: string
  message: string
  fieldErrors?: Record<string,string[]>
}
```

Không gửi raw `error.message` nếu chứa SQL/table/policy.

## 18. Idempotency

Cần cho:

- finalize attendance.
- promotion approval.
- publish notification.
- borrow/return equipment.
- report snapshot.
- Phase 8 payment receipt.

Có unique key hoặc state check trong DB.
