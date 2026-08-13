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
updateAttendanceSettings
updateSemesterMilestone
generateDefaultClasses
closeAcademicYear
archiveAcademicYear
updateClass
assignStaffToClass
endClassStaffAssignment
```

`updateSemesterMilestone` (M02-B, D-71/D-116) đặt hoặc **xoá** `academic_years.semester_1_end_date`;
Super Admin (D-112). `updateClass` đã chuyển sang `src/features/classes/server/actions.ts` — nhóm quyền
của nó là **bốn vai trò ghi toàn xứ đoàn** (`app.can_global_write`), khác nhóm quyền năm học. Cả hai
đọc **số dòng thay đổi** (`.select("id")`) nên RLS chặn không còn báo thành công (SW-04). `updateClass`
còn từ chối khi năm học của lớp đã `closed`/`archived` (BR-M02-N09).

`closeAcademicYear(input)` và `archiveAcademicYear(id)` — **M02-C, I7/TB-F09/D-73, Super Admin**. Cả hai
gọi RPC cùng tên; toàn bộ luật nằm ở cơ sở dữ liệu (quyền · trạng thái · mã gõ lại · bảng kiểm · hạn
giữ dữ liệu), tầng action chỉ dịch mã lỗi sang câu tiếng Việt.

🔴 **`force` KHÔNG là tham số của biểu mẫu.** `closeAcademicYear` suy nó ra từ việc người dùng có ghi
`reason` hay không: chỉ cơ sở dữ liệu biết còn bao nhiêu việc tồn đọng **vào đúng thời điểm bấm nút**
(nó đếm sau khi khoá dòng). Không lý do ⇒ `force = false` ⇒ còn việc dở thì RPC từ chối **và trả về
con số thật** để giao diện nói ra; có lý do ⇒ `force = true` (BR-M02-N05).

`getAcademicYearCloseChecklist(id)` đọc bảng kiểm qua RPC `academic_year_close_checklist`
(`app.can_global_read`), **không** tự đếm ở tầng ứng dụng: đếm ở đó là đếm dưới RLS của người xem, và
màn hình sẽ hứa "không còn việc tồn đọng" trước một RPC chắc chắn từ chối.

`endEnrollment` (M03) nay cũng `.select("id")` — từ M02-C, RLS `enrollments_update_scope` có hàng rào
trạng thái năm học, và RLS chặn `update` bằng cách trả **0 dòng, không lỗi** (SW-04).
**M03-A đã đổi tên `endEnrollment` → `closeEnrollment`** và áp cùng luật `.select()` cho **toàn bộ**
thao tác ghi của M03 (xem §4 và §5).

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

**Trạng thái sau M03-C** — tên thật trong mã nguồn. **Module M03 hết nợ ở bảng này:**

| Tài liệu | Mã nguồn | Trạng thái |
|---|---|---|
| `createGuardian` | `createGuardian` → RPC `create_guardian_profile` | ✅ có dò trùng (BR-M03-N09) và kênh phản hồi |
| `createStudent` | `createStudent` → RPC `create_student_with_enrollment` | ✅ có dò trùng (TB-F13) và **xếp lớp cùng lúc** (D-123) |
| `updateStudentBasicInfo` | `updateStudent` | ✅ — từ M03-C **không còn nhận `status`**, xem `setStudentStatus` |
| `updateStudentHealth` | `saveHealthProfile` | ✅ `upsert` kèm `.select()`; cổng quyền riêng `assertSensitiveWrite` (**D-127**) |
| `upsertStudentSacrament` | `upsertSacrament` | ✅ **M03-C** — có `id` ⇒ sửa, không ⇒ thêm (AC-F08-01) |
| *(mới)* | `deleteSacrament` | ✅ **M03-C / D-128** — chỉ bốn vai trò xứ đoàn, có `ConfirmDialog` |
| `archiveStudent` | `setStudentStatus` → RPC `set_student_status` | ✅ **M03-C** — đổi **cả hai trục** trạng thái trong một giao dịch (TB-F06/D-130) |
| *(mới)* | `changeStudentGuardian` | ✅ **M03-C / BR-M03-N16** — đổi ngay quyền đọc của hai tài khoản phụ huynh, có xác nhận nêu đủ ba tên |

> **Vì sao tên là `setStudentStatus` chứ không phải `archiveStudent` như đặc tả:** hàm này phục vụ
> **cả bốn** trạng thái hồ sơ, và ba trong bốn không phải là "lưu trữ". Sau **D-130** nó còn kéo theo
> ghi danh — "Tạm nghỉ" hồ sơ ⇒ ghi danh `paused`, "Đang sinh hoạt" ⇒ khôi phục. Một cái tên chỉ nói
> về một nhánh là cái tên nói dối về ba nhánh còn lại.

**M03-C thêm hai hàm và ba lưới an toàn** (`20260728000200`):

| Hàm / trigger | Vì sao |
|---|---|
| `set_student_status` | **KHÔNG `security definer`** — khác hẳn ba hàm của M03-B. Em đã tồn tại và mọi hàng rào cần thiết đã nằm trong RLS (`students_update_scope` của D-123, `enrollments_update_scope` với hàng rào năm học D-117/D-118). Viết definer ở đây là tự tay bỏ qua cả hai rồi phải chép lại chúng bằng tay. Hai câu lệnh trong một thân hàm vẫn là **một giao dịch** (AC-F06-02) |
| `list_students_for_fees` | **D-67/D-129** — cửa sổ hẹp cho Thủ quỹ. RLS lọc theo **dòng**, không theo **cột**, nên nới `students_select_scope` là mở luôn ngày sinh/địa chỉ/ghi chú nội bộ qua Data API |
| `students_status_needs_closed_enrollment` | BR-M03-N12 — chặn tổ hợp "đã lưu trữ mà vẫn đang học", kể cả đường ghi thẳng vào bảng |
| `enrollments_need_active_student` | BR-M03-N13 / AC-F06-04 — chiều ngược lại. Ở DB chứ không chỉ ở action vì có **ba** đường ghi vào `enrollments` |
| `guardians_inactive_needs_no_active_student` | BR-M03-N17 — `guardians.status='inactive'` nghĩa là "đừng gọi số này nữa", mà em đang đi học phải luôn có một số gọi được |

**M03-B thêm ba hàm cơ sở dữ liệu** (`20260728000100`), tất cả `security definer` và tự kiểm quyền:

| Hàm | Vì sao phải là hàm chứ không phải `insert` thẳng |
|---|---|
| `create_student_with_enrollment` | **D-123** — ngành của một em suy ra từ lớp em học, nên hồ sơ chưa xếp lớp thì không có gì để kiểm "trong ngành mình". Hàm ghi hồ sơ **và** ghi danh trong một giao dịch; vai trò ngành bắt buộc truyền `p_class_id`. Hàng rào năm học (D-117/D-118) kiểm tay vì `security definer` bỏ qua RLS |
| `create_guardian_profile` | **D-124** — vai trò ngành ghi được người giám hộ nhưng **đọc lại không được** (người mới chưa gắn với em nào), nên `insert … returning` trả 0 dòng và báo "thất bại" trên một bản ghi đã ghi |
| `list_guardian_options` | **D-124** — cửa sổ hẹp chỉ **tên + số điện thoại**, cùng khuôn D-97 của M09-B. Vừa là nguồn của ô chọn phụ huynh, vừa là nguồn của phép dò trùng người giám hộ |

**Đọc danh sách** dùng khung nhìn `public.student_directory` (`security_invoker`, TB-F03): lọc theo
ngành/lớp/trạng thái, tìm **không dấu** qua cột sinh sẵn `students.search_name` (D-126), và phân
trang bằng `range()`. Lọc trong SQL chứ không kéo cả bảng về — khác `staff-directory.ts` của M04
vì ở đây là ~900 dòng chứ không phải vài chục.

## 5. Enrollment

```ts
enrollStudent
pauseEnrollment
resumeEnrollment
closeEnrollment   // gộp withdraw/transfer/complete/repeat, phân biệt bằng LÝ DO
```

**M03-A đổi bộ này** (TB-F10). Bản cũ chỉ có `enrollStudent` + `endEnrollment`, trong đó
`endEnrollment` nhận cả `paused` — mà `paused` là trạng thái **mở** nên nó luôn vi phạm CHECK
`enrollments_open_has_no_end` và **thất bại im lặng, mọi lần** (lỗi CRITICAL F10). `pauseEnrollment`
và `resumeEnrollment` **không nhận ngày kết thúc**, nên không còn đường nào tạo ra tình trạng đó.

`withdrawEnrollment`/`transferEnrollment` của bản đặc tả gộp thành `closeEnrollment(enrollmentId,
status, endedOn)`: chúng khác nhau đúng một giá trị enum, tách ra là chép ba lần cùng một khối kiểm
tra. 🔴 **D-122** — lý do `transferred` **chỉ đóng** ghi danh ở lớp cũ, **không** tạo ghi danh lớp
mới và **không** ghi `previous_enrollment_id`; hộp xác nhận phải nói ra điều đó. Luồng chuyển lớp
thật (WF-11, đóng cũ + mở mới trong một RPC nguyên tử) thuộc **M08**.

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

Chỉ editor. Trả về `timestamptz` — **mốc hết hạn mới** của phiên chỉnh sửa, tính bằng `now()` của
cơ sở dữ liệu cộng `academic_years.attendance_edit_lease_minutes`.

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
- **M05-A / TB-04 thêm hai mã**, tách từ điều kiện gộp cũ của
  `heartbeat_attendance_session` và `save_and_finalize_attendance`:
  `ATTENDANCE_SESSION_NOT_CLAIMED` (không ai đang giữ phiên — chính là ca "vừa chốt xong bấm lại",
  vì finalize xóa `editing_by`) và `ATTENDANCE_LEASE_EXPIRED` (phiên của **chính mình** hết hạn).
  `ATTENDANCE_ALREADY_CLAIMED` **giữ nguyên** cho đúng ca người khác đang giữ.
- **M05-A / TB-07:** ba mã do trigger `app.sync_student_attendance_keys` ném
  (`ATTENDANCE_ENROLLMENT_NOT_OPEN`, `ATTENDANCE_ENROLLMENT_CLASS_MISMATCH`,
  `ATTENDANCE_RECORD_IMMUTABLE_KEY`) nay **có** trong bảng ánh xạ; trước đó chúng rơi vào
  `CONFLICT` chung. Điều kiện "ghi danh còn mở" chỉ còn áp cho **INSERT**, nên một em rời lớp
  không khóa cứng buổi điểm danh đã diễn ra.
- **M05-A / nợ #18:** cả bốn RPC ghi từ chối năm học đã đóng bằng mã `ACADEMIC_YEAR_CLOSED`
  (D-117 miễn cho Super Admin). Hàng rào nằm **trong RPC** chứ không trong policy, vì RPC là
  `security definer` nên bỏ qua RLS — thêm điều kiện vào policy là thêm một dòng không bao giờ chạy.
- Mọi thao tác ghi điểm danh **chỉ** qua các RPC này: `authenticated` không có quyền
  INSERT/UPDATE trên `attendance_sessions`, `student_attendance_records`, `staff_attendance_records`.
- **M05-B / D-75 — RPC đọc mới `attendance_session_notes(p_session_id)`**, trả `(record_id, note)`
  cho các dòng **có** ghi chú. Đây là đường đọc **duy nhất còn lại** của cột
  `student_attendance_records.note`: `authenticated` đã bị thu quyền `select` mức bảng và chỉ được
  cấp lại **từng cột trừ `note`**, nên xin cột ấy qua Data API nhận `42501` — kể cả Giáo lý viên.
  Hàm mang đúng **ba nhánh nhân sự** của `student_attendance_records_select_scope`
  (`can_global_read` · `scope_class_ids` · `staff_class_ids`) và **không** có nhánh phụ huynh/thiếu
  nhi, nên phạm vi của nhân sự không đổi còn phía phụ huynh thì đóng hẳn. Mã lỗi: `AUTH_REQUIRED` ·
  `RESOURCE_NOT_FOUND` · `FORBIDDEN`.
  🔴 **Bẫy cho phiên sau:** thêm cột mới vào `student_attendance_records` phải `grant select` riêng
  cho cột đó, nếu không cột ấy vô hình với cả ứng dụng. pgTAP `042` có bài đối chiếu và sẽ đỏ kèm
  tên cột bị bỏ quên.
- **M05-C / TB-05 — hai Server Action trả thêm `leaseExpiresAt`**, mở rộng kiểu trả về chứ **không**
  đổi hợp đồng RPC nào: `claimAttendanceSession` nay chuyển tiếp `out_lease_expires_at` (RPC đã trả
  từ Phase 3 mà action vứt đi), và `heartbeatAttendanceSession` trả `{ leaseExpiresAt }` thay cho
  `undefined`. Màn hình dùng nó để hiện *"còn khoảng N phút"*. 🔴 Con số ấy là **ước lượng để người
  dùng biết đường mà bấm Lưu**, không phải nguồn sự thật: quyết định tiếp quản vẫn hoàn toàn do giờ
  của cơ sở dữ liệu (BR-M05-06/07, AC-F05-1), nên câu chữ trên màn hình không được hứa chắc chắn.
  `getAttendanceSessionDetail` cũng trả `leaseExpiresAt` cho lượt dựng trang đầu tiên.
- **M05-C / TB-09 — trang buổi đọc thêm `v_student_attendance_summary`** để lấy bốn cờ cảnh báo
  chuyên cần của roster. View là `security_invoker` nên **không mở thêm cửa nào**; lọc bằng
  `(academic_year_id, class_id)` chứ không bằng danh sách `student_id`, để khỏi nối thêm một vòng
  gọi vào trang mà người ta mở ngay trước Thánh lễ.

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
deleteAssessment          // M07-B: RPC delete_assessment, chỉ cột CHƯA có điểm thật
archiveAssessment         // M07-B (mới): ẩn mềm is_active = false
restoreAssessment         // M07-C (mới): hiện lại cột đã ẩn — nợ #21
saveAssessmentScores
refreshAttendanceScores    // M07-B: trả { refreshed, skippedManual }
resetAttendanceScoreOverride
createStudentComment
updateStudentComment      // M07-B (mới)
deleteStudentComment
lockGradebook
unlockGradebook // SA
setAssessmentPublished    // M07-C: đổi ruột sang RPC set_assessment_published, chạy được cả khi đã khóa
```

`saveAssessmentScores` should accept batch and run transaction/RPC.

### M07-C — hai thay đổi đáng nhớ ở tầng action

1. 🔴 **`setAssessmentPublished` giữ tên, đổi ruột sang RPC `set_assessment_published`**
   (BR-M07-29 / **D-154**). Bản cũ là một `update` thẳng qua policy `assessments_update_grader`,
   mà policy ấy mang `not app.is_gradebook_locked(...)` — nên sau khi khóa, muốn công bố kết quả
   cho phụ huynh thì phải nhờ Quản trị viên hệ thống **mở khóa cả bảng điểm**, tức mở luôn quyền
   sửa điểm và hệ số của cả lớp. Nay công bố đi đường riêng; **policy giữ nguyên** nên lệnh gửi
   thẳng vào cơ sở dữ liệu khi đã khóa vẫn bị từ chối (AC-02-02). **Quyền không đổi**
   (`app.can_grade_class`) — chỉ đổi *lúc nào* công bố được.
   ⚠️ **Đây là thao tác ghi DUY NHẤT của module không assert "0 dòng là thất bại"** (SW-04). RPC
   ném ngoại lệ ở **mọi** đường từ chối — không quyền, năm học đã đóng, cột đã ẩn — nên `changed = 0`
   chỉ còn đúng một nghĩa: cột đã ở sẵn trạng thái ấy vì người khác vừa bấm. Gọi đó là lỗi thì hai
   người cùng bấm "Công bố" sẽ có một người đọc câu báo hỏng cho một việc **đã thành**.
2. **`restoreAssessment`** (nợ #21) đi qua đúng policy như `archiveAssessment`: cùng quyền, cùng
   hàng rào khóa, cùng hàng rào năm học. **0 thay đổi cơ sở dữ liệu.** M07-B mở đường ẩn nhưng
   không mở đường về, nên ẩn nhầm phải nhờ Quản trị viên hệ thống can thiệp thẳng vào dữ liệu.

### M07-B — bốn thay đổi đáng nhớ ở tầng action

1. **`deleteAssessment` giữ tên, đổi ruột sang RPC `delete_assessment`** (BR-M07-26/27).
   Bản cũ là `delete` trần nên nó để **khoá ngoại trả lời hộ**, và câu người dùng đọc được là
   *"Cột đã có điểm"* trong khi họ chưa nhập điểm nào — vì trước M07-A biểu mẫu ghi cả roster
   nên cột nào cũng có sẵn một dòng rỗng cho mỗi em. RPC đếm đúng dòng `score is not null`,
   dọn các dòng rỗng và trả về **số dòng đã dọn**. Cột đang là **nguồn của một bảng Top 5**
   nhận mã riêng `ASSESSMENT_IS_LEADERBOARD_SOURCE`, không dùng chung câu với "đã có điểm".
2. **`archiveAssessment`** đi qua policy `assessments_update_grader` (không cần RPC): quyền,
   hàng rào khóa và hàng rào năm học đều đã nằm sẵn ở đó. Ẩn cột có hiệu lực **ở tầng cơ sở dữ
   liệu** — trigger hạ `assessment_scores.assessment_published` và policy đọc của phụ huynh
   thêm điều kiện `is_active`, nên phụ huynh gọi thẳng Data API cũng không thấy (AC-01-03).
3. **`refreshAttendanceScores` đổi kiểu trả về.** Con số cũ đếm gộp cả dòng bị bỏ qua, nên màn
   hình báo *"Đã cập nhật 50 đề xuất"* trong khi không ô nào đổi. RPC nay trả
   `(out_refreshed, out_skipped_manual)` ⇒ bắt buộc `drop` + `create` và sinh lại
   `src/types/database.ts`.
4. **`lockGradebook` kiểm quyền tường minh ở app trước khi gọi RPC** (TB-M07-10 bước 1), giống
   `unlockGradebook`. Không thay hàng rào — hàng rào là `app.can_lock_gradebook` — mà để câu trả
   lời nói đúng lý do; `42501` từ RPC bị dịch thành một câu chung vô ích.
   ⚠️ **`updateStudentComment` mang đúng luật D-152 như `deleteStudentComment`.** Siết mỗi
   đường xóa thì ai bị chặn vẫn **sửa nội dung thành bất cứ thứ gì** — cùng một thiệt hại đi qua
   một cái cửa khác, và lần này còn giữ nguyên tên tác giả cũ.

`createAssessment`/`updateAssessment` accept a positive per-assessment weight. They authorize against the actor's class assignment, do not enforce a required assessment kind/count, allow repeated kinds, and reject structural or weight changes after gradebook lock. Super Admin manages academic-year defaults separately.

## 9. Leaderboards

```ts
previewLeaderboard
createLeaderboard
publishLeaderboard        // M07-C: lưu bản đang có vào leaderboard_snapshots trước khi thay
unpublishLeaderboard
republishLeaderboard      // M07-C (mới): hiện lại bản đang có, KHÔNG tính lại
deleteLeaderboard         // M07-C (mới): chỉ bản CHƯA TỪNG công bố
saveCustomLeaderboardScores
```

When publish:

- calculate/snapshot entries;
- exactly rank 1..5;
- do not recompute silently afterward.

### M07-C — vòng đời Top 5 (**D-155**)

Điều *"do not recompute silently afterward"* ở trên **đã bị vi phạm suốt từ Phase 5**: "Ẩn khỏi
portal" đưa `is_published` về `false`, và bấm công bố lại thì `publish_leaderboard` **xóa sạch**
entries cũ rồi dựng lại theo điểm mới nhất — em đứng hạng 5 hôm trước biến khỏi bảng, không ai
được báo, bản cũ không còn ở đâu (F16).

`04_TO_BE_FLOWS` khuyến nghị **cấm hẳn** việc tính lại (phương án A). **Chủ dự án chọn phương án B
(2026-08-06):** giữ khả năng tính lại, nhưng bản đang có phải xuống **lịch sử** trước khi bị thay.
Chữ *"silently"* mới là thứ được chữa, không phải chữ *"recompute"*.

Ba trạng thái, ba nhóm thao tác:

| Trạng thái | Phép thử | Action dùng được |
|---|---|---|
| **Bản nháp** | `published_at is null` | `previewLeaderboard` · `publishLeaderboard` · **`deleteLeaderboard`** |
| **Đã chốt · đang ẩn** | `published_at` khác null, `is_published = false` | **`republishLeaderboard`** (không tính lại) · `publishLeaderboard` (tính lại, bản cũ xuống lịch sử) |
| **Đang công bố** | `is_published` | `unpublishLeaderboard` |

🔴 **`deleteLeaderboard` kiểm `published_at`, KHÔNG kiểm `is_published`.** Sau một lượt ẩn thì
`is_published` về `false`: điều kiện cũ của policy cho qua, rồi khoá ngoại `on delete restrict`
của `leaderboard_entries` **trả lời hộ** bằng `23503` — dịch ra thành *"Không tìm thấy dữ liệu
liên quan"*, một câu sai hẳn nghĩa. Đây là **cùng một lỗi** M07-B vừa chữa ở cột điểm, ở bảng khác.
Action kiểm thêm một lần ở tầng ứng dụng để người dùng đọc được **lý do thật** thay vì câu chung
của `assertRowsAffected`.

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

### M08-B — ba thay đổi (2026-08-07)

**1. Thứ tự lệnh trong `approve_promotion_review` đã ĐẢO ở bước 4–6.** Nay là: đánh dấu review
`approved` → đóng/cập nhật ghi danh nguồn → tạo ghi danh mới → điền `created_enrollment_id` → ghi
nhật ký. 🔴 Bắt buộc, vì trigger `enrollments_pending_promotion_guard` (D-158) nằm trên
`enrollments` và `security definer` **không** bỏ qua trigger: giữ thứ tự cũ là tự chặn chính đường
duyệt hợp lệ. Vẫn một giao dịch nên BR-M08-13 không đổi.

**2. `reviewPromotion` thêm một luật ở tầng ứng dụng — AC-16 vế ba.** `decision='approve'` mà
`warning_snapshot.missingSacraments` không rỗng và `note` trống ⇒ `VALIDATION_ERROR` với câu nêu
**đích danh từng bí tích còn thiếu**. Đọc từ snapshot đã chốt lúc đề xuất (BR-M08-21), **không**
tính lại: hai người duyệt cùng một đề xuất phải gặp cùng một yêu cầu.

**3. RPC mới `promote_enrollment_now` + Server Action `transferEnrollmentNow` (D-159).**

```ts
{
  sourceEnrollmentId: UUID
  proposedStatus: 'recommended_promote' | 'recommended_repeat' | 'temporarily_pause' | 'withdraw'
  targetClassId?: UUID
  proposeTrainee: boolean
  note?: string
}
```

RPC gọi lại **đúng hai RPC cũ** trong một giao dịch — mọi hàng rào BR-M08-02…21, nợ #18 và nhật ký
D-157 đi theo miễn phí. Hàng rào riêng duy nhất của nó là `app.can_global_write()`; **0 thay đổi
phân quyền**. 🔴 Nó **cũng** cầm luật AC-16 vế ba (mã `PROMOTION_NOTE_REQUIRED`), vì đường một bước
không đi qua `reviewPromotion` và tầng ứng dụng không kiểm được — `warning_snapshot` chỉ tồn tại
**sau** khi `propose_promotion` chạy xong.

## 11. Absence request

```ts
createAbsenceRequest
cancelAbsenceRequest
acknowledgeAbsenceRequest       // TB-06: có màn hình gọi từ M05-B
```

Guardian id derived from session.

### Đã hiện thực khác gì mô tả trên

- `listClassAbsenceRequests` **không tồn tại** như một action riêng: danh sách đơn đang chờ của
  Giáo lý viên đọc thẳng qua RLS trong `getAttendanceHubData` (thẻ *"Đơn xin nghỉ tuần này"* trên
  `/attendance`, cửa sổ ±7 ngày quanh hôm nay).
- **M05-B / TB-06:** `acknowledgeAbsenceRequest` viết từ Phase 3 nhưng tới M05-B mới có màn hình
  gọi. Action nay `.select()` và **đếm số dòng đổi** (SW-04) rồi mới báo thành công, và chỉ nhận
  đơn còn `pending`. `reviewed_by`/`reviewed_at` do trigger đặt từ phiên đăng nhập — client không
  đặt được. Cột `staff_note` là **lời nhắn cho phụ huynh** (phụ huynh đọc được), khác hẳn
  `student_attendance_records.note` là ghi chú nội bộ mà phụ huynh **không** đọc được (D-75).
- **M05-B / TB-11 · D-141:** trigger `app.validate_absence_request` từ chối đơn **cho buổi đã
  chốt** bằng mã `ABSENCE_SESSION_ALREADY_FINALIZED` (chỉ áp cho INSERT, đơn cũ không bị hỏng).
  🔴 Chủ dự án chốt chặn **theo trạng thái buổi**, KHÔNG chặn theo ngày như đề xuất U-09 của
  `08_ACCEPTANCE_CRITERIA`: buổi còn mở thì phụ huynh báo muộn vài giờ vẫn kịp đổi "vắng không
  phép" thành "vắng có phép".
- Tầng Server Action dịch mã trigger sang câu tiếng Việt (`ABSENCE_SESSION_ALREADY_FINALIZED`,
  `ABSENCE_STUDENT_NOT_ENROLLED`, `ABSENCE_OWNER_CAN_ONLY_CANCEL`, `ABSENCE_OWNER_CANNOT_EDIT`,
  `ABSENCE_STAFF_CANNOT_CANCEL`); trước M05-B mọi mã rơi vào một câu *"Dữ liệu không hợp lệ"* duy
  nhất.

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
