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
adminChangeUsername(input)       // SA only
adminSetAccountStatus(input)     // SA only
assignPrimaryRole(input)         // SA only
```

`adminResetPassword` trả password tạm một lần; không lưu/log.

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

## 7. Teaching plan

```ts
createTeachingPlanItem
updateTeachingPlanItem
deleteTeachingPlanItem
uploadTeachingMaterial
```

Only representative write plan.

## 8. Assessment

```ts
createAssessment
updateAssessment
deleteAssessment
saveAssessmentScores
calculateAttendanceScores
saveAttendanceScoreOverride
createStudentComment
lockGradebook
unlockGradebook // SA
publishAssessment
```

`saveAssessmentScores` should accept batch and run transaction/RPC.

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

## 11. Absence request

```ts
createAbsenceRequest
cancelAbsenceRequest
listClassAbsenceRequests
```

Guardian id derived from session.

## 12. Committees/equipment

```ts
createCommitteeContent
createCommitteeMeeting
createCommitteeWeeklyPlan
borrowEquipment // RPC
returnEquipment // RPC
```

## 13. Notifications

### `publishNotification`

Input target scope. Server checks actor allowed scope.

Materialize recipients in transaction. Do not create duplicate recipients.

## 14. Reports

```ts
previewReport(filters)
exportReportExcel(filters)
exportReportPdf(filters)
finalizeReportSnapshot(filters)
```

Use a single validated `filters` object for preview and export.

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
