# M13-PORTAL — 03. Kết quả audit

> Chấm nghiêm các tiêu chí "dễ hiểu", "responsive", "accessibility":
> người dùng chính là **phụ huynh không rành công nghệ trên điện thoại 360px**.

## 1. Bảng tổng hợp

| ID luồng | Tên luồng | Trạng thái | Điểm /75 | Ưu tiên |
|---|---|---|---|---|
| M13-F01 | Phụ huynh đăng nhập và tìm đường | **CRITICAL** | 38 | **P0** |
| M13-F02 | Phụ huynh xem điểm danh của con | PASS_WITH_MINOR_UI_FIX | 62 | P3 |
| M13-F03 | Mở hồ sơ em không phải con mình | PASS | 72 | — |
| M13-F04 | `studentId` không hợp lệ | PASS | 70 | — |
| M13-F05 | Phụ huynh nhiều con — chuyển đổi | **CRITICAL** | 35 | **P0** |
| M13-F06 | Chưa liên kết `guardians.profile_id` | NEEDS_IMPROVEMENT | 44 | **P1** |
| M13-F07 | Thiếu nhi xem điểm danh của mình | PASS_WITH_MINOR_UI_FIX | 63 | P3 |
| M13-F08 | Non-student mở `/student/attendance` | **CRITICAL** | 40 | **P0** |
| M13-F09 | Xem kết quả đã công bố | PASS | 68 | — |
| M13-F10 | Xem Top 5 của lớp | PASS | 68 | — |
| M13-F11 | Xem giáo án tuần tới | PASS | 67 | — |
| M13-F12 | Xem thông báo | PASS | 66 | — |
| M13-F13 | Truy cập `/parent` | NEEDS_IMPROVEMENT | 45 | P2 |
| M13-F14 | Điều hướng mobile 360px | NEEDS_IMPROVEMENT | 48 | **P1** |

## 2. CRITICAL — chi tiết và `file:line`

### C-1 — Trang điểm danh của con KHÔNG có lối vào (M13-F01, M13-F05)

| Bằng chứng | Nội dung |
|---|---|
| `src/app/(dashboard)/parent/children/[studentId]/page.tsx:8-33` | Trang tồn tại, hoạt động đúng, bảo mật đúng |
| `src/config/navigation.ts:41-57` | `platformNavigation` **không có** mục nào trỏ `/parent/children` |
| `src/config/navigation.ts:84-90` | `guardianMobileNavigation` = Trang chủ · Xin nghỉ · Kết quả · Thông báo · Tài khoản |
| `src/features/dashboard/components/dashboard-overview.tsx:63` | Link duy nhất từ dashboard trỏ `/students/{id}` — route **staff-only** (`route-map.ts:26`) |
| `src/features/notifications/constants.ts:51` | `/parent/children` chỉ là deep-link hợp lệ của thông báo |
| Không tồn tại | `src/app/(dashboard)/parent/page.tsx`, `src/app/(dashboard)/parent/children/page.tsx` |

**Vì sao là CRITICAL:** đây là chức năng **cốt lõi nhất** của cổng phụ huynh
(`docs/06 §6 Guardian` liệt kê `/parent/children/[studentId]`), đã được xây đầy đủ và an toàn,
nhưng người dùng không thể tới được. Với phụ huynh nhiều con thì cả việc "chuyển giữa các con"
cũng không tồn tại vì không có nơi nào liệt kê UUID của các em.

### C-2 — `/student/attendance` không thực thi giới hạn role (M13-F08)

| Bằng chứng | Nội dung |
|---|---|
| `src/lib/permissions/route-map.ts:37` | `{ path: "/student", public: false, roles: ["student"] }` |
| `src/features/portal/server/queries.ts:174` | `requireAuthContext("/student/attendance")` — **không** `requireRouteAccess` |
| `src/app/(dashboard)/layout.tsx:6` | `requireAuthContext()` — layout cũng không kiểm route |
| Middleware | Không authorize (theo kiến trúc) |
| Đối chiếu trong cùng file | `src/features/portal/server/queries.ts:161` **có** dùng `requireRouteAccess` cho trang phụ huynh |

**Vì sao là CRITICAL:** quy tắc phân quyền được khai báo nhưng **không có tầng nào thực thi**.
Hiện tại RLS ngăn rò dữ liệu, nên đây là lỗ hổng phòng thủ theo chiều sâu chứ chưa phải rò dữ liệu.
Nhưng nó tạo tiền lệ nguy hiểm: bất kỳ trang nào thêm vào `/student/*` sau này mà tin vào
`route-map` đều sẽ hở, và mọi bài kiểm thử role-escalation dựa trên `route-map` sẽ cho kết quả sai.
Thêm nữa, `group_leader` mở URL này sẽ thấy hồ sơ điểm danh của **một em bất kỳ** dưới tiêu đề
"Điểm danh của em" — sai nghiệp vụ rõ ràng dù không sai quyền.

## 3. Chấm 15 tiêu chí (mức module)

| # | Tiêu chí | Điểm | Lý do |
|---|---|---|---|
| 1 | Đúng nghiệp vụ | 3 | Dữ liệu hiển thị đúng và đủ (chỉ buổi đã chốt, chỉ điểm đã publish). Nhưng cổng phụ huynh thiếu **trang chủ** và thiếu **danh sách con** — hai thứ `docs/06 §6` liệt kê. `/student` thiếu 4 trong 5 route được đặc tả. |
| 2 | Dễ hiểu | 2 | Với phụ huynh không rành công nghệ: không tìm được trang xem con; empty state nói sai nguyên nhân ("Chưa có kết quả nào được công bố" khi thật ra tài khoản chưa liên kết); tiêu đề header trang con là "Thiếu Nhi Chợ Quán". |
| 3 | Số bước hợp lý | 2 | Xem điểm danh con = **không thể** qua giao diện (chỉ qua deep-link thông báo). Chuyển giữa các con = không thể. |
| 4 | Không nhập trùng | 5 | Portal thuần đọc; `AttendanceHistory` dùng chung cho cả hai vai trò (`attendance-history.tsx:11`) — không có hai bản render song song. |
| 5 | Khó thao tác nhầm | 4 | Portal chỉ đọc nên hầu như không có thao tác sai. Trừ vì `/student/attendance` cho vai trò sai vào và hiển thị nhầm người. |
| 6 | Validation đầy đủ | 4 | `studentId` sai → 404 sạch; không có form nhập trong phạm vi audit này. Trừ vì `error` của Supabase bị bỏ qua nên lỗi hạ tầng bị trình bày như "không tìm thấy". |
| 7 | Trạng thái rõ ràng | 3 | Badge Lễ/Giáo lý rõ ràng; nhưng không phân biệt "chưa có dữ liệu" với "chưa liên kết tài khoản" với "buổi chưa chốt". |
| 8 | Phân quyền an toàn | 4 | RLS rất chắc: con người khác → 404 không lộ tên; thiếu nhi không thấy bạn cùng lớp (trừ Top 5 snapshot); không thấy sức khỏe/bí tích/`staff_only`/điểm chưa publish. **Trừ 1 điểm** vì `/student/attendance` bỏ qua `requireRouteAccess`. |
| 9 | Dữ liệu nhất quán | 4 | Lọc chưa-publish/chưa-finalize ở **cả** tầng ứng dụng lẫn RLS. Trừ vì TB portal (tính lại trên cột đã publish) khác TB staff (`v_student_weighted_average`) mà không có chú thích. |
| 10 | Dễ bảo trì | 4 | `getPortalAttendance` dùng chung; comment nguyên tắc RLS rõ (`queries.ts:7-13`). Trừ vì `getPortalChildren()` mang tên "children" nhưng ngữ nghĩa thật là "students đọc được" — dễ dùng sai ở nơi khác (và đã dùng sai tại `queries.ts:177`). |
| 11 | Dễ mở rộng | 3 | Thêm "xem điểm của con", "xem lịch", "hồ sơ" đều phải tạo route mới + mục nav mới; chưa có khung layout `/parent` để treo vào. |
| 12 | UI hỗ trợ đúng nghiệp vụ | 2 | Chức năng cốt lõi không có lối vào; không có bộ chọn con; không có nút quay lại danh sách. |
| 13 | Responsive | 4 | 360px không tràn ngang: `grid-cols-2 sm:grid-cols-4` (`attendance-history.tsx:43`), thẻ từng buổi `flex-wrap` (`:83`), bảng điểm bọc `overflow-x-auto min-w-[520px]` (`published-results-portal.tsx:25-26`), bottom nav `min-h-16`. Trừ vì nhãn nav `text-[11px]` + `truncate` cắt chữ. |
| 14 | Accessibility | 3 | Có `aria-current`, `aria-label` cho nav, `aria-hidden` cho icon. Thiếu: bảng điểm không có `<caption>`/`scope`; khối cảnh báo dùng `<ul>` màu vàng không có `role="status"`; badge trạng thái phân biệt bằng màu + chữ (đạt) nhưng cỡ chữ `text-xs`/`text-[11px]` nhiều nơi; không có nút "Quay lại". |
| 15 | Khả năng kiểm thử | 3 | pgTAP phủ tốt phần RLS (012/016/018). **Không có** e2e cho `/parent/children/<id người khác>`, cho phụ huynh nhiều con, cho tài khoản chưa liên kết, hay cho vai trò sai vào `/student/attendance`. |
| | **Tổng** | **50/75** | |

## 4. Kết luận cho các "kiểm đặc biệt"

| Kiểm | Kết luận | Bằng chứng |
|---|---|---|
| Guardian mở `/parent/children/<em không phải con>` → 404/denied, không 500, không rò tên | **ĐẠT** | `page.tsx:14-17` `notFound()` sau null-check; RLS `students_select_scope` (`20260716000100:198-200`) + `can_access_student` (`20260716000500:90-109`); tên chỉ dùng sau khi qua check |
| Student xem được bạn cùng lớp không (chỉ Top 5 đã publish là ngoại lệ) | **ĐẠT** | `students` chỉ `is_self_student`; `student_attendance_records` chỉ `own_student_ids()` (`20260721000300:326-330`); Top 5 dùng `saint_name_snapshot`/`full_name_snapshot` chứ không join `students` (`assessments/server/queries.ts:181-182`) |
| Guardian/student có thấy sức khỏe / bí tích / ghi chú `staff_only` không | **ĐẠT** | Không truy vấn bảng health/sacrament ở portal; `can_view_student_sensitive` loại trừ guardian/student (`20260716000500:112-129`); nhận xét lọc `.eq("visibility","student_visible")` (`assessments/server/queries.ts:143`) + RLS |
| Portal có thấy điểm/attendance chưa finalize / chưa publish không | **ĐẠT (2 tầng)** | `.not("session_finalized_at","is",null)` (`portal/server/queries.ts:74`) + RLS `20260721000300:326-330`; `.eq("is_published",true)` (`:133`), `.eq("assessment_published",true)` (`:139`) + RLS `20260722000400:519-563` |
| Guardian có nhiều con → chuyển đổi giữa các con thế nào | **KHÔNG ĐẠT** | Không có trang danh sách con, không có bộ chọn ở trang điểm danh (`page.tsx:8-33`), không có mục nav (`navigation.ts:84-90`). Bộ chọn con **chỉ** tồn tại trong đơn xin nghỉ (`absence-requests/page.tsx:15`) |
| Phụ huynh chưa liên kết `guardians.profile_id` thì thấy gì | **KHÔNG ĐẠT** | Empty state nói sai nguyên nhân: "Chưa có kết quả nào được công bố." (`published-results-portal.tsx:9`), danh sách con rỗng không giải thích (`portal/server/queries.ts:132`). Phía thiếu nhi thì đúng (`student/attendance/page.tsx:19-21`) — bất đối xứng |
| Đường vào portal từ navigation cho role guardian/student có đủ và rõ không | **KHÔNG ĐẠT (guardian)** / ĐẠT một phần (student) | Guardian: thiếu hoàn toàn lối vào điểm danh của con (`navigation.ts:84-90`) và `/parent` 404. Student: có "Điểm danh của em" (`navigation.ts:47,94`) nhưng thiếu `/student/schedule`, `/student/results`, `/student/profile` theo `docs/06:130-136` |

## 5. 5 Whys cho các luồng không PASS

### 5.1 C-1 — Trang chức năng cốt lõi không có lối vào (M13-F01, M13-F05)

1. **Vì sao** phụ huynh không xem được điểm danh của con? → Không có mục nav nào trỏ tới `/parent/children/[studentId]`.
2. **Vì sao** không có mục nav? → Vì `navigation.ts` chỉ chứa các href **tĩnh**, mà route này cần một `studentId` động.
3. **Vì sao** không có trang trung gian (`/parent` hoặc `/parent/children`) để chọn con? → Vì Phase 3 giới hạn portal ở "chỉ làm phần điểm danh" (D-60, comment `portal/server/queries.ts:9`) và trang chi tiết được coi là "đã xong phần điểm danh".
4. **Vì sao** không ai phát hiện lúc nghiệm thu? → Vì nghiệm thu đi thẳng bằng URL có `studentId` (giống cách e2e và pgTAP kiểm tra), không đi bằng đường của người dùng thật.
5. **Nguyên nhân gốc:** Không có tiêu chí nghiệm thu dạng "người dùng **đi từ màn hình đăng nhập** tới được chức năng X trong N bước". Chức năng được kiểm theo route, không theo hành trình. Kết hợp với việc `navigation.ts` chỉ hỗ trợ href tĩnh, mọi trang có tham số động đều có nguy cơ mồ côi.

### 5.2 C-2 — `/student/attendance` không kiểm role (M13-F08)

1. **Vì sao** vai trò sai vào được? → Trang gọi `requireAuthContext` thay vì `requireRouteAccess`.
2. **Vì sao** gọi sai hàm? → Hai hàm tên gần giống nhau, chỉ khác một lời gọi `canAccessRoute` (`guards.ts:17-21`), và cả hai đều nhận một chuỗi đường dẫn nên trông y hệt nhau tại điểm gọi.
3. **Vì sao** layout không bắt được? → `(dashboard)/layout.tsx:6` cố ý chỉ kiểm đăng nhập, để mỗi trang tự quyết định quyền.
4. **Vì sao** thiết kế như vậy? → Vì layout không biết `pathname` trong App Router server component (không có API trực tiếp), nên việc kiểm route bị đẩy xuống từng trang.
5. **Nguyên nhân gốc:** Hàng rào phân quyền route **do quy ước chứ không do cấu trúc** — không có gì buộc một trang mới phải gọi `requireRouteAccess`, và không có test nào duyệt toàn bộ `src/app/(dashboard)/**/page.tsx` để đối chiếu với `ROUTE_RULES`.

### 5.3 M13-F06 — Empty state nói sai nguyên nhân

1. **Vì sao** phụ huynh chưa liên kết thấy "Chưa có kết quả nào được công bố"? → Vì `getOwnedStudentIds` trả `[]` và component chỉ có một nhánh rỗng.
2. **Vì sao** chỉ có một nhánh? → Vì hàm trả `string[]`, mất thông tin "vì sao rỗng".
3. **Vì sao** mất thông tin? → Vì `guardians`/`students` được truy vấn rồi vứt bỏ, chỉ giữ id (`assessments/server/queries.ts:93-106`).
4. **Vì sao** không giữ? → Vì nguyên tắc "dựa hoàn toàn vào RLS" được hiểu là "tầng ứng dụng không cần biết ngữ cảnh".
5. **Nguyên nhân gốc:** Nguyên tắc RLS-first (rất đúng cho **bảo mật**) bị áp dụng luôn cho **trình bày**. RLS trả rỗng vì nhiều lý do khác nhau, và giao diện cần biết lý do — nhưng kiến trúc hiện tại cố ý không truyền lý do đó lên. Bằng chứng cho thấy vấn đề nằm ở nhận thức chứ không ở năng lực: trang thiếu nhi (`student/attendance/page.tsx:19-21`) **đã** làm đúng.

### 5.4 M13-F13 / M13-F14 — Thiếu `/parent` và điều hướng mobile chưa đủ

1. **Vì sao** `/parent` trả 404? → Không có `page.tsx`.
2. **Vì sao** không tạo? → Vì `route-map.ts:36` khai báo `/parent` như **tiền tố phân quyền**, không phải như một trang.
3. **Vì sao** người dùng vẫn gõ `/parent`? → Vì `docs/06:125` liệt kê nó là route của guardian.
4. **Vì sao** tài liệu và mã lệch nhau? → Vì `docs/06 §6` là danh sách route **dự kiến**, chưa được đánh dấu phần nào đã làm.
5. **Nguyên nhân gốc:** Không có bảng đối chiếu "route đặc tả ↔ route đã hiện thực ↔ lối vào từ nav". Hệ quả cùng lúc: `/parent` mồ côi, `/parent/children/[id]` mồ côi, và 3 route `/student/*` chưa làm mà không ai ghi nhận.

## 6. Điểm mạnh cần giữ nguyên

1. **404 thay vì 403** khi mở hồ sơ em không phải con mình, kèm comment giải thích chủ ý
   (`parent/children/[studentId]/page.tsx:15-16`) — không lộ sự tồn tại của hồ sơ.
2. **Lọc hai tầng** cho dữ liệu chưa chốt/chưa publish: ứng dụng lọc tường minh **và** RLS chặn.
3. **Top 5 dùng tên snapshot** thay vì join `students` — cô lập ngoại lệ mà không mở quyền đọc.
4. **`AttendanceHistory` dùng chung** cho phụ huynh và thiếu nhi (`attendance-history.tsx:11`)
   — cùng dữ liệu, cùng cách đọc, không có hai phiên bản lệch nhau.
5. **Nguyên tắc RLS-first được ghi thành comment** (`portal/server/queries.ts:7-13`) kèm chỉ dẫn
   "nếu RLS sai thì pgTAP 012 phải đỏ" — đúng chỗ trách nhiệm.
6. **Empty state của trang thiếu nhi viết đúng chuẩn cần có** cho toàn portal
   (`student/attendance/page.tsx:19-21`) — nói rõ nguyên nhân và việc cần làm tiếp.
7. **Cảnh báo chuyên cần (WF-06) được diễn đạt bằng câu tiếng Việt đầy đủ** thay vì mã kỹ thuật:
   "Vắng 3 buổi giáo lý liên tiếp." (`attendance-history.tsx:19-29`).

## 7. Vấn đề cross-module

| # | Vấn đề | Ảnh hưởng |
|---|---|---|
| X-1 | `/dashboard` dùng chung staff/portal; thẻ "Cần quan tâm" link tới `/students/{id}` (staff-only) ⇒ phụ huynh gặp `/access-denied` | M13 + M11 |
| X-2 | `(dashboard)/layout.tsx:6` không gọi `requireRouteAccess(pathname)` ⇒ mọi trang phải tự guard; đã có 1 trang quên | M13 + M14 + toàn bộ trang mới trong tương lai |
| X-3 | `navigation.ts` chỉ hỗ trợ href tĩnh ⇒ mọi route có tham số động đều có nguy cơ mồ côi | M13 + M14 |
| X-4 | `getPortalChildren()` trả về "mọi students đọc được" chứ không phải "con của tôi"; đang bị dùng cho cả `/student/attendance` và `/parent/absence-requests` | M13 + module đơn xin nghỉ |
| X-5 | `docs/06 §6` liệt kê 5 route `/student/*` và 3 route `/parent/*`; thực tế có 1 + 2 | M13 + M14 + tài liệu |
| X-6 | Trung bình có trọng số hiển thị cho portal (tính trên cột đã publish) khác con số staff thấy (`v_student_weighted_average`) — không có chú thích | M13 + M07 |

## 8. Câu hỏi NEEDS_CONFIRMATION

| # | Câu hỏi | Vì sao cần chốt |
|---|---|---|
| Q1 | Phụ huynh vào cổng bằng đường nào: một trang `/parent` liệt kê các con, hay thêm mục nav "Con của tôi" mở thẳng khi chỉ có 1 con? | Quyết định thiết kế cho C-1; ảnh hưởng `navigation.ts` và số route mới |
| Q2 | Khi phụ huynh chỉ có **một** con, có nên bỏ qua màn hình danh sách và vào thẳng không? | Ảnh hưởng số bước; đa số phụ huynh có 1–2 con |
| Q3 | `/student/schedule`, `/student/results`, `/student/profile` (`docs/06:130-136`) có còn trong phạm vi không, hay thiếu nhi dùng chung `/results` và `/teaching-plan`? | Quyết định có cần sửa `docs/06` hay cần làm thêm route |
| Q4 | `student_attendance_records.note` do GLV nhập — phụ huynh **có được** đọc không? Hiện đang hiển thị (`attendance-history.tsx:96`) | Nếu là ghi chú nội bộ thì đây là rò thông tin; nếu là lời nhắn cho phụ huynh thì cần nói rõ trong UI khi GLV nhập |
| Q5 | Phụ huynh chưa liên kết `guardians.profile_id` nên thấy thông điệp gì, và ai là người xử lý (GLV lớp hay thư ký)? | Quyết định nội dung empty state cho toàn bộ portal |
| Q6 | Trung bình hiển thị cho phụ huynh có cần ghi rõ "tạm tính trên các cột đã công bố" không? | Tránh phụ huynh so số với GLV rồi thắc mắc |
| Q7 | Thiếu nhi có được xem điểm danh của mình khi buổi **chưa** chốt không (hiện: không)? | Xác nhận kỳ vọng — hiện tại là "không", đúng `docs/05 §6` |
