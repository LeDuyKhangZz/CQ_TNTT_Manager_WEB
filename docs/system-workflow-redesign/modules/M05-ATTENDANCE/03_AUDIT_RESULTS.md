# M05-ATTENDANCE — Kết quả audit

## 1. Bảng luồng

| ID | Tên luồng | Trạng thái | Điểm /75 | Ưu tiên |
|---|---|---|---:|---|
| M05-ATTENDANCE-F01 | Mở/tạo buổi điểm danh + claim | NEEDS_IMPROVEMENT | 58 | P1 |
| M05-ATTENDANCE-F02 | Mở trang buổi (read-only / editor) | PASS_WITH_MINOR_UI_FIX | 62 | P2 |
| M05-ATTENDANCE-F03 | Sửa nháp và Lưu nháp | PASS_WITH_MINOR_UI_FIX | 63 | P2 |
| M05-ATTENDANCE-F04 | Heartbeat gia hạn lease | PASS_WITH_MINOR_UI_FIX | 61 | P2 |
| M05-ATTENDANCE-F05 | Tiếp quản | **PASS** | 67 | P3 |
| M05-ATTENDANCE-F06 | Hoàn tất (finalize) | NEEDS_IMPROVEMENT | 57 | P1 |
| M05-ATTENDANCE-F07 | Khóa sau 3 ngày | PASS_WITH_MINOR_UI_FIX | 64 | P2 |
| M05-ATTENDANCE-F08 | Super Admin mở khóa | PASS_WITH_MINOR_UI_FIX | 60 | P2 |
| M05-ATTENDANCE-F09 | Sửa sau khi mở khóa | PASS_WITH_MINOR_UI_FIX | 60 | P2 |
| M05-ATTENDANCE-F10 | Điểm danh nhân sự | PASS_WITH_MINOR_UI_FIX | 61 | P3 |
| M05-ATTENDANCE-F11 | Phụ huynh gửi đơn xin nghỉ | PASS_WITH_MINOR_UI_FIX | 60 | P2 |
| M05-ATTENDANCE-F12 | Phụ huynh hủy đơn | **PASS** | 64 | P3 |
| M05-ATTENDANCE-F13 | Staff xem / ghi nhận đơn xin nghỉ | **NEEDS_IMPROVEMENT** | 41 | **P1** |
| M05-ATTENDANCE-F14 | Portal xem lịch sử đã chốt | **PASS** | 66 | P3 |
| M05-ATTENDANCE-F15 | Cảnh báo chuyên cần | PASS_WITH_MINOR_UI_FIX | 60 | P2 |
| M05-ATTENDANCE-F16 | Điểm chuyên cần đề xuất (cross M07) | **PASS** | 65 | P3 |

**Không có luồng nào CRITICAL.** Tầng dữ liệu/bảo mật của module này rất chắc: mọi đường ghi đi qua
RPC `security definer` có row lock, `authenticated` không có `insert/update` trên ba bảng điểm danh
(`supabase/migrations/20260721000300_attendance_sessions.sql:283-285`), và pgTAP 67 assertion chạy
dưới JWT thật đã phủ đủ các luật then chốt. Toàn bộ vấn đề nằm ở **rõ ràng trạng thái, thông điệp
lỗi, và nghiệp vụ đơn xin nghỉ chưa hoàn chỉnh**.

## 2. Bảng 15 tiêu chí — mức module

| # | Tiêu chí | Điểm | Lý do (kèm `file:line`) |
|---|---|---:|---|
| 1 | Đúng nghiệp vụ | 4 | WF-05 khớp gần như tuyệt đối (claim/lease/finalize/lock/unlock). Trừ điểm vì WF-10 bước 5 "staff thấy đơn trước khi điểm danh" chưa có màn hình, và trạng thái `acknowledged` không đạt tới được từ UI (`src/features/absence-requests/server/actions.ts:94-112` không được component nào gọi). |
| 2 | Dễ hiểu | 4 | Nhãn tiếng Việt nhất quán (`constants.ts:9-47`); mô tả "Mặc định tất cả có mặt — chỉ sửa những em vắng" đúng trọng tâm (`attendance-editor.tsx:196-199`). Trừ điểm: không giải thích lease/khóa ngay trên trang buổi. |
| 3 | Số bước hợp lý | 4 | Mở buổi = 1 form 3 trường → vào thẳng trang điểm danh (`actions.ts:206-217`). Trừ điểm: muốn sửa lại buổi mình vừa chốt phải bấm "Tiếp quản" (`queries.ts:343-346`). |
| 4 | Không nhập trùng | 5 | `attendance_sessions_unique` (`M3:53`), `student_attendance_records_unique` (`M3:93`), `absence_requests_one_open_per_meeting_idx` (`M4:47-49`). Claim dùng `insert on conflict do nothing` + `for update` nên hai người bấm cùng lúc chỉ ra một buổi. |
| 5 | Khó thao tác nhầm | 3 | `mostRecentMeetingDate()` tính theo giờ server UTC → sáng Chúa nhật trước 07:00 ICT mặc định lùi về **thứ Năm trước** (`src/app/(dashboard)/attendance/page.tsx:22-31`). Không có hộp xác nhận trước khi chốt (`attendance-editor.tsx:357-359`) dù `docs/06-ui-ux-spec.md:322-331` yêu cầu. |
| 6 | Validation đầy đủ | 4 | Zod ở action (`schemas.ts:20-48`), constraint + trigger ở DB, luật ngày lặp ở cả hai tầng với mã lỗi ổn định (`M3:426-431`). Trừ điểm: `ATTENDANCE_ENROLLMENT_NOT_OPEN`, `ATTENDANCE_ENROLLMENT_CLASS_MISMATCH`, `ATTENDANCE_RECORD_IMMUTABLE_KEY` **không có** trong `RPC_ERROR_CODES` (`actions.ts:24-34`) → rơi về "Thao tác bị xung đột". |
| 7 | Trạng thái rõ ràng | 3 | Hub in "Đã chốt" cho buổi đã khóa (`attendance/page.tsx:133-135`) trong khi trang chi tiết in "Đã khóa" (`[sessionId]/page.tsx:44-46`). Enum `'locked'` không bao giờ được ghi. Không hiện thời gian còn lại của lease dù `leaseMinutes` đã có sẵn (`attendance-editor.tsx:86`). |
| 8 | Phân quyền an toàn | 5 | `can_edit_attendance` = SA + `is_class_staff` (`M3:243-251`), khớp `docs/05-permission-matrix.md:123`. Phụ huynh/thiếu nhi chỉ đọc dòng đã chốt của mình (`M3:320-330`), `role_assignments_scope_matches_role` chặn họ có `class_id` (`20260715000100:76-80`) nên không có đường vòng qua `scope_class_ids()`. Ghi chỉ qua RPC. |
| 9 | Dữ liệu nhất quán | 5 | Trigger đồng bộ khóa phi chuẩn hóa và chặn đổi `session_id`/`enrollment_id` (`M3:150-153`). Finalize giữ `finalized_at` đầu tiên (`M3:705`). `session_finalized_at` đẩy xuống mọi dòng trong cùng transaction (`M3:716-723`). |
| 10 | Dễ bảo trì | 4 | Comment giải thích *tại sao* rất tốt (`M3:1-24`, `M4:1-12`). Trừ điểm: biểu thức "đã khóa" lặp lại 3 lần trong RPC thay vì gọi `app.attendance_is_locked` (`M3:255-269` — hàm tồn tại nhưng không nơi nào dùng). |
| 11 | Dễ mở rộng | 4 | Ngưỡng cảnh báo và trọng số nằm trong bảng cấu hình theo năm (`M5:18-24,35-52`); comment cảnh báo rõ cách mở rộng đúng (`M5:33-34`). |
| 12 | UI hỗ trợ đúng nghiệp vụ | 3 | Thiếu toàn bộ quick filter mà `docs/06-ui-ux-spec.md:311-317` liệt kê (chỉ hiện em vắng / có đơn / cảnh báo / search); lớp ~50 em phải cuộn hết trên điện thoại. Thiếu confirm trước finalize. Không có "auto-save status/last saved" (`docs/06-ui-ux-spec.md:287`). |
| 13 | Responsive | 4 | Grid `sm:grid-cols-2` cho hai select, thanh hành động `sticky bottom-4` (`attendance-editor.tsx:217,353`); E2E kiểm không tràn ngang ở 360/768/1366 (`tests/e2e/attendance.spec.ts`). Trừ điểm: mỗi em chiếm ~180px chiều cao ở 360px. |
| 14 | Accessibility | 3 | `aria-label` đầy đủ cho mọi select/input (`attendance-editor.tsx:224,246,270,311,333`); chiều cao `h-11` = 44px đạt touch target (`:42`). Thiếu: `aria-live` cho thay đổi trạng thái editor/lease, không quản lý focus sau khi mất quyền, `FormMessage` không có `role="status"`/`role="alert"` được xác nhận trong module này. |
| 15 | Khả năng kiểm thử | 5 | pgTAP `plan(67)` dưới JWT thật (`supabase/tests/012_attendance_test.sql:5-11`); E2E dựng **hai browser context độc lập** để chứng minh tranh chấp editor thật, và dùng service role **chỉ** để chỉnh đồng hồ DB (`tests/e2e/attendance.spec.ts:20-23`). Đây là chuẩn mực cho các module khác. |
| | **Tổng** | **60/75** | |

**Phân loại module: `NEEDS_IMPROVEMENT`** — do F01 (ngày mặc định sai múi giờ), F06 (thiếu confirm +
thông điệp chốt lại sai) và F13 (nghiệp vụ đơn xin nghỉ phía staff chưa có).

## 3. Danh sách vấn đề

| Mã | Mức | Luồng | Mô tả ngắn | `file:line` |
|---|---|---|---|---|
| F01-I1 | **HIGH** | F01 | Ngày mặc định tính theo giờ server (UTC), sáng CN trước 07:00 ICT lùi về thứ Năm trước | `src/app/(dashboard)/attendance/page.tsx:22-31` |
| F13-I1 | **HIGH** | F13 | Không có màn hình staff xem đơn xin nghỉ trước khi điểm danh (WF-10 bước 5) | — (thiếu) |
| F13-I2 | MED | F13 | `acknowledgeAbsenceRequest` là action mồ côi; `acknowledged`/`staff_note` không đạt tới được | `src/features/absence-requests/server/actions.ts:94-112` |
| F06-I1 | MED | F06 | Chốt lần 2 báo "đang có người khác phụ trách" dù không ai giữ | `M3:710` + `M3:652-656` |
| F06-I3 | MED | F06 | Không confirm trước finalize (docs/06 yêu cầu bảng phân bố) | `attendance-editor.tsx:357-359` |
| F07-I1 | MED | F07 | Hub và trang chi tiết hiển thị trạng thái khóa khác nhau | `attendance/page.tsx:133-135` vs `[sessionId]/page.tsx:44-46` |
| F03-I1 | MED | F03/F06 | Enrollment đóng lùi quá khứ khóa cứng mọi lần lưu/chốt, lỗi hiện ra generic | `M3:178-180` vs `actions.ts:24-34` |
| F04-I1 | MED | F04 | Mất bản nháp âm thầm khi bị tiếp quản / hết lease | `attendance-editor.tsx:88-93,154,352` |
| F04-I3 | MED | F04 | Không hiển thị thời gian còn lại của lease | `attendance-editor.tsx:86` |
| F09-I1 | MED | F09 | Sau unlock, chốt lại đặt `locked_at` từ `finalized_at` cũ → khóa lại ngay, không giải thích | `M3:705-710` |
| F15-I1 | MED | F15 | Không có badge/filter cảnh báo trong roster điểm danh | `docs/06-ui-ux-spec.md:311-317` |
| NAV-I1 | MED | — | Nav hiện `/attendance` cho Cha sở/Cha phó/Thủ quỹ nhưng route-map chặn → dead link | `src/config/navigation.ts:45` vs `src/lib/permissions/route-map.ts:9-11,29` |
| F11-I1 | LOW-MED | F11 | Đơn xin nghỉ không chặn ngày quá khứ / buổi đã chốt | `absence-requests/schemas.ts:10-20`, `M4:37-40` |
| F01-I3 | LOW | F01 | `claimed=false` bị bỏ qua, không báo "X đang giữ buổi" khi redirect | `actions.ts:213-216` |
| F07-I2 | LOW | F07 | `app.attendance_is_locked` không được RPC nào dùng; luật lặp 3 chỗ | `M3:255-269` |
| F07-I3 | LOW | F07 | Enum `attendance_session_status='locked'` là giá trị chết | `M3:26-31` |
| F08-I1 | LOW | F08 | `unlock` set `status='completed'` vô điều kiện → vi phạm constraint nếu buổi chưa chốt | `M3:771` vs `M3:65-67` |
| HUB-I1 | LOW | F01 | Hub `.limit(24)`, không lọc/phân trang; SA thấy chưa tới 1 tuần dữ liệu | `queries.ts:142` |
| SEC-I1 | LOW | — | `app.seed_attendance_roster` grant cho `authenticated` và tự nó không kiểm quyền; an toàn hiện tại chỉ vì schema `app` không expose qua Data API | `M3:348-386,794` |
| ACT-I1 | LOW | — | Server action điểm danh dùng `requireAuthContext` (chỉ auth), không `requireRouteAccess`; chỉ `unlockAttendanceSession` kiểm role | `actions.ts:63,93,107,136` vs `:180-183` |
| F11-I2 | LOW | F11 | `.maybeSingle()` trên enrollments → lỗi mờ khi em có >1 ghi danh mở | `absence-requests/server/actions.ts:41-47` |
| F14-I1 | LOW | F14 | `own_student_class_ids()` gộp cả ghi danh đã đóng | `M3:292-302` |
| F15-I2 | LOW | F15 | Em chưa có buổi chốt nào không xuất hiện trong view — "chưa có dữ liệu" giống "tốt" | `M5:208-215` |

## 4. 5 Whys cho các vấn đề không PASS

### 4.1 F01-I1 — Ngày mặc định sai vào sáng Chúa nhật

1. **Vì sao GLV mở nhầm buổi thứ Năm vào sáng Chúa nhật?**
   Vì form đổ sẵn `defaultDate` = ngày thứ Năm trước đó và `defaultMeeting='thursday'`
   (`attendance/page.tsx:56-57`).
2. **Vì sao `mostRecentMeetingDate()` trả về thứ Năm?**
   Vì nó gọi `today.getDay()` và `candidate.toISOString().slice(0,10)` (`:22-31`) — cả hai đều theo
   múi giờ của **process Node**, không phải Asia/Ho_Chi_Minh.
3. **Vì sao process Node không ở giờ Việt Nam?**
   Vì Vercel/Node chạy mặc định UTC. 06:00 Chúa nhật ICT = 23:00 thứ Bảy UTC.
4. **Vì sao không dùng `APP_TIME_ZONE` như chỗ khác?**
   Vì `src/lib/dates/index.ts` chỉ export hàm **định dạng** (`formatDateVi`/`formatDateTimeVi`), chưa
   có hàm "lấy ngày hôm nay theo giờ xứ đoàn"; tác giả trang phải tự viết và đã quên múi giờ.
5. **Vì sao test không bắt được?**
   Vì E2E tự sinh ngày Chúa nhật rồi **fill tay** vào input (`tests/e2e/attendance.spec.ts` —
   `page.locator('input[name="date"]').fill(meetingDate)`), nên giá trị mặc định không bao giờ được
   kiểm. Unit test chỉ phủ `meetingTypeForDate`, không phủ `mostRecentMeetingDate`.

**Nguyên nhân gốc:** thiếu một hàm "ngày hôm nay theo `APP_TIME_ZONE`" dùng chung, và không có test
cho giá trị mặc định của form.

### 4.2 F13-I1 / F13-I2 — Nghiệp vụ đơn xin nghỉ phía staff chưa có

1. **Vì sao GLV không thấy đơn trước khi điểm danh?**
   Vì đơn chỉ được truy vấn bên trong `getAttendanceSessionDetail` theo đúng (lớp, ngày, buổi)
   (`queries.ts:246-252`), tức là **sau khi** đã mở buổi.
2. **Vì sao không có danh sách đơn riêng?**
   Vì Phase 3 chốt phạm vi portal ở mức tối thiểu (D-60) và không tạo route staff cho `absence_requests`.
3. **Vì sao `acknowledgeAbsenceRequest` vẫn được viết?**
   Vì tầng DB (policy update + trigger duyệt) đã làm xong trước, action được viết để "khớp" nhưng
   chưa có màn hình tiêu thụ.
4. **Vì sao không ai phát hiện action mồ côi?**
   Vì lint không cảnh báo export không dùng ở file `"use server"`, và pgTAP kiểm ở tầng DB
   (`012:399-420`) nên nhìn vào test thấy "đã có nghiệp vụ".
5. **Vì sao phụ huynh không phàn nàn?**
   Vì hệ chưa vận hành thật; khi chạy thật, mọi đơn sẽ vĩnh viễn ở "Đang chờ" và phụ huynh không có
   phản hồi nào.

**Nguyên nhân gốc:** nghiệp vụ WF-10 được hiện thực đủ ở DB nhưng **thiếu một màn hình staff**; không
có kiểm tra "mọi server action đều có nơi gọi".

### 4.3 F06-I1 — Thông điệp chốt lại sai ngữ nghĩa

1. **Vì sao bấm chốt lần 2 báo "đang có người khác phụ trách"?**
   Vì finalize xóa `editing_by` (`M3:710`), rồi lần gọi sau rơi vào nhánh
   `editing_by is distinct from actor` (`M3:652-656`).
2. **Vì sao nhánh đó dùng chung mã `ATTENDANCE_ALREADY_CLAIMED`?**
   Vì một điều kiện gộp ba tình huống khác nhau: bị tiếp quản, lease hết hạn, và **không ai giữ**.
3. **Vì sao không tách?**
   Vì lúc viết chỉ nghĩ tới ca "bị tiếp quản" — đúng ca mà `docs/07 §6` và pgTAP nhấn mạnh.
4. **Vì sao UI không tự tránh?**
   Vì sau finalize `router.refresh()` chuyển trang sang read-only, nên trong luồng bình thường không
   bấm lại được; chỉ lộ ra khi double-click, mạng chậm, hoặc retry.
5. **Vì sao test không bắt?**
   Vì E2E dùng `clickUntil` kiểm điều kiện **trước** mỗi lần bấm nên không bao giờ bấm chốt hai lần.

**Nguyên nhân gốc:** một mã lỗi gánh ba nguyên nhân; thiếu mã riêng cho "phiên chỉnh sửa đã kết thúc".

### 4.4 F07-I1 / F07-I3 — Trạng thái khóa không nhất quán

1. **Vì sao hub hiện "Đã chốt" còn trang chi tiết hiện "Đã khóa"?**
   Vì hub in thẳng `session.status` (`attendance/page.tsx:134`), còn chi tiết in
   `detail.isLocked ? "locked" : detail.status` (`[sessionId]/page.tsx:45`).
2. **Vì sao `status` không phản ánh khóa?**
   Vì không code path nào ghi `status='locked'`; khóa là hàm của `locked_at` và `now()`.
3. **Vì sao thiết kế như vậy?**
   Vì khóa theo thời gian không thể "tự chuyển state" nếu không có cron — đúng tinh thần WF-06
   "không cần cron". Quyết định đúng.
4. **Vì sao vẫn giữ enum `'locked'`?**
   Vì sơ đồ WF-05 (`docs/03-workflow.md:115-124`) vẽ `Locked` là state thật; enum được tạo theo sơ đồ
   rồi thực thi lại chọn cách suy ra.
5. **Vì sao không đồng bộ hai màn hình?**
   Vì `AttendanceSessionCard` không mang trường `isLocked` — logic suy ra chỉ tồn tại trong
   `getAttendanceSessionDetail` (`queries.ts:310-312`), không được đưa lên `toSessionCard`
   (`queries.ts:52-68`).

**Nguyên nhân gốc:** logic "đã khóa" bị nhân bản thay vì đặt ở một chỗ dùng chung; tài liệu và code
lệch nhau về ý nghĩa của `status`.

### 4.5 F03-I1 — Enrollment đóng lùi quá khứ khóa cứng buổi

1. **Vì sao không lưu/chốt được buổi?**
   Vì `sync_student_attendance_keys` raise `ATTENDANCE_ENROLLMENT_NOT_OPEN` (`M3:178-180`) cho một
   dòng đã tồn tại.
2. **Vì sao trigger chạy trên dòng đã tồn tại?**
   Vì nó là `before insert or update` và finalize update **mọi** dòng để đặt `session_finalized_at`
   (`M3:716-723`), còn save nháp update mọi dòng có trong payload (client gửi cả roster).
3. **Vì sao điều kiện `enrollment_ok` áp cho cả UPDATE?**
   Vì mục tiêu ban đầu là chặn INSERT sai (thêm em không thuộc lớp/không mở tại ngày đó); UPDATE bị
   cuốn theo vì dùng chung hàm.
4. **Vì sao người dùng không hiểu lỗi?**
   Vì mã `ATTENDANCE_ENROLLMENT_NOT_OPEN` không có trong `RPC_ERROR_CODES` (`actions.ts:24-34`) nên
   `fromPostgrestError` trả `CONFLICT` chung (`:45`).
5. **Vì sao test không bắt?**
   Vì pgTAP không có kịch bản "đóng ghi danh lùi ngày rồi chốt buổi cũ".

**Nguyên nhân gốc:** ràng buộc thời điểm (`enrollment_ok`) áp cho UPDATE thay vì chỉ INSERT, cộng với
bảng ánh xạ lỗi không đầy đủ.

### 4.6 F04-I1 / F04-I3 — Mất nháp và mù trạng thái lease

1. **Vì sao GLV mất phần đã gõ?**
   Vì khi heartbeat lỗi, UI chuyển read-only (`attendance-editor.tsx:88-93,154`) và nút Lưu biến mất
   (`:352`).
2. **Vì sao heartbeat lỗi?**
   Vì bị tiếp quản, hoặc lease hết do nhịp heartbeat bị trình duyệt bóp khi tab chạy nền.
3. **Vì sao GLV không biết lease sắp hết?**
   Vì trang không hiển thị đồng hồ lease; `leaseMinutes` chỉ dùng để đặt `setInterval` (`:86`), và
   `heartbeat_attendance_session` **có trả** `now() + lease` nhưng action bỏ đi (`actions.ts:95-99`).
4. **Vì sao không lưu nháp cục bộ?**
   Vì thiết kế xem "một editor giữ lease" là đủ; không có localStorage/optimistic buffer.
5. **Vì sao chấp nhận được ở giai đoạn trước?**
   Vì E2E chỉ chứng minh "không ghi đè" — đúng mục tiêu bảo toàn dữ liệu — mà không đo mất mát công
   sức của người dùng.

**Nguyên nhân gốc:** hợp đồng lease chưa được đưa lên UI; giá trị hết hạn do DB trả về bị vứt bỏ.

### 4.7 NAV-I1 — Link điểm danh chết cho Cha sở / Cha phó / Thủ quỹ

1. **Vì sao họ bấm vào bị đá sang `/access-denied`?**
   Vì `ROUTE_RULES` giới hạn `/attendance` cho `OPERATIONAL_STAFF_ROLES` (`route-map.ts:9-11,29`).
2. **Vì sao menu vẫn hiện mục đó?**
   Vì `navItem('/attendance')` không khai báo `roles` và scope `global` khớp scopeKind của họ
   (`src/config/navigation.ts:45`, `:105-112`).
3. **Vì sao hai nơi lệch nhau?**
   Vì navigation là metadata trình bày còn route-map là authorization; không có test liên kết hai bảng.
4. **Vì sao route lại loại 3 role này?**
   Vì `/attendance` là màn hình **ghi**, còn `docs/05-permission-matrix.md:39` cho họ quyền **xem**
   (👁 / 👁 báo cáo) — hai ý niệm bị gộp vào một route.
5. **Vì sao không tách?**
   Vì Phase 3 chưa có màn hình "xem điểm danh" tách khỏi màn hình "điểm danh".

**Nguyên nhân gốc:** một route phục vụ hai quyền khác nhau; navigation và route-map không có kiểm tra
chéo.
