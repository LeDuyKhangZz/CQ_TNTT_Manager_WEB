# M13-PORTAL — 01. Khảo sát module

> Giai đoạn 1 — AUDIT NGHIỆP VỤ (read-only).
> Ngày audit: 2026-07-22.
> **Bối cảnh sử dụng quyết định cách chấm:** portal chạy chủ yếu trên **điện thoại 360px**,
> người dùng là **phụ huynh không rành công nghệ** và **thiếu nhi**. Tiêu chí "dễ hiểu",
> "responsive", "accessibility" được chấm nghiêm.

## 1. Phạm vi

Cổng dành cho phụ huynh (`guardian`) và thiếu nhi (`student`):

| Nhu cầu | Trang | Trạng thái |
|---|---|---|
| Xem con / xem bản thân | `/parent/children/[studentId]`, `/student/attendance` | Có |
| Lịch sử điểm danh | Cùng hai trang trên | Có |
| Kết quả đã publish | `/results` (nhánh portal) | Có |
| Giáo án tuần tới | `/teaching-plan` (safe RPC) | Có |
| Thông báo | `/notifications` | Có |
| Gửi đơn xin nghỉ | `/parent/absence-requests` | Có (**luồng chi tiết do agent khác audit** — ở đây chỉ xét điều hướng/hiển thị) |

## 2. Bản đồ file

| File | Vai trò | Số dòng |
|---|---|---|
| `src/features/portal/server/queries.ts` | `getPortalChildren`, `getPortalAttendance`, `getAbsenceRequestsPageData`, `getChildAttendancePageData`, `getStudentSelfAttendancePageData` | 180 |
| `src/features/portal/components/attendance-history.tsx` | Component dùng chung cho cả trang phụ huynh và trang thiếu nhi | 104 |
| `src/features/assessments/components/published-results-portal.tsx` | Bảng điểm đã công bố + nhận xét + Top 5 | 41 |
| `src/app/(dashboard)/parent/children/[studentId]/page.tsx` | Trang điểm danh của một em | 33 |
| `src/app/(dashboard)/student/attendance/page.tsx` | Trang điểm danh của chính thiếu nhi | 29 |
| `src/app/(dashboard)/parent/absence-requests/page.tsx` | Layout đơn xin nghỉ (chỉ xét điều hướng) | 18 |
| `src/app/(dashboard)/results/page.tsx` | Phân nhánh portal / staff | 39 |
| `src/config/navigation.ts` | Quyết định lối vào portal | 132 |
| `src/lib/permissions/route-map.ts` | `/parent` không giới hạn role (D-25); `/student` chỉ `student` | 63 |
| `src/app/(dashboard)/layout.tsx` | Chỉ `requireAuthContext()`, **không** `requireRouteAccess(pathname)` | 13 |

## 3. Nguyên tắc thiết kế được tuyên bố

`src/features/portal/server/queries.ts:7-13` ghi rõ:

> "Mọi truy vấn ở đây dựa hoàn toàn vào RLS: `students` trả về con của phụ huynh hoặc chính em đó,
> `student_attendance_records` chỉ trả dòng đã chốt của mình. Không có bộ lọc `guardian_id` nào ở
> tầng ứng dụng — nếu RLS sai thì test pgTAP 012 phải đỏ, chứ không phải trang này che đi."

**Đánh giá:** đây là nguyên tắc đúng và đã được thực thi nhất quán. Toàn bộ điểm mạnh bảo mật của
module đến từ đây. Nhưng nó cũng là nguồn gốc của hai vấn đề: (a) khi RLS trả rỗng, tầng ứng dụng
không biết vì sao nên thông điệp trống luôn sai; (b) `getPortalChildren()` không lọc gì nên với
tài khoản staff nó trả về **toàn bộ** thiếu nhi trong phạm vi của họ.

## 4. Hàng rào phân quyền thực tế

| Lớp | Nội dung | Bằng chứng |
|---|---|---|
| Middleware | **Không** authorize | Theo mô tả kiến trúc |
| `(dashboard)/layout.tsx` | Chỉ kiểm đăng nhập + `account_status` + `must_change_password` | `layout.tsx:6` |
| Route map | `/parent` mở cho mọi role (D-25); `/student` chỉ `student` | `route-map.ts:36-37` |
| Guard trang | `/parent/children/[id]` dùng `requireRouteAccess` ✅ · `/student/attendance` dùng **`requireAuthContext`** ❌ | `portal/server/queries.ts:161` vs `:174` |
| RLS | `students_select_scope using (app.can_access_student(id))` | `20260716000100:198-200` |
| RLS | `student_attendance_records`: guardian/student chỉ dòng **đã finalize** của mình | `20260721000300:320-331` |
| RLS | `assessment_scores`: guardian/student chỉ khi `assessment_published` | `20260722000400:554-563` |
| RLS | Sức khỏe/bí tích: `can_view_student_sensitive` **không bao giờ** gồm guardian/student | `20260716000500:112-129` |

## 5. Phát hiện then chốt khi khảo sát

1. **Không có bất kỳ lối vào nào tới `/parent/children/[studentId]`.**
   `grep -rn "parent/children" src/` chỉ ra 2 kết quả: bản thân query
   (`portal/server/queries.ts:161`) và danh sách link hợp lệ của thông báo
   (`features/notifications/constants.ts:51`). `src/config/navigation.ts` **không có** mục nào
   trỏ tới trang này. Phụ huynh chỉ vào được nếu nhận một thông báo có deep-link.

2. **Không có trang `/parent` và `/parent/children`.**
   `docs/06 §6` liệt kê `/parent` là route của guardian nhưng
   `src/app/(dashboard)/parent/` chỉ có `absence-requests/` và `children/[studentId]/`.
   Gõ `/parent` → 404 của Next.

3. **`/student/attendance` không kiểm role.**
   `getStudentSelfAttendancePageData` gọi `requireAuthContext("/student/attendance")`
   (`queries.ts:174`) chứ không `requireRouteAccess`. Vì `layout.tsx` cũng không kiểm route,
   quy tắc `{ path: "/student", roles: ["student"] }` (`route-map.ts:37`) **không được thực thi ở
   bất kỳ đâu** cho trang này.

4. **`getPortalChildren()` không phải "children" mà là "mọi students đọc được".**
   `queries.ts:46-53` chỉ `select id, saint_name, full_name from students order by full_name`.
   Với `guardian` → đúng các con. Với `student` → chính em. Với **staff global-read** → toàn bộ
   thiếu nhi xứ đoàn.

5. **`/student` chỉ có duy nhất `attendance`.**
   `docs/06 §6` liệt kê `/student`, `/student/schedule`, `/student/results`, `/student/profile` —
   chỉ `/student/attendance` tồn tại. Thiếu nhi xem điểm qua `/results` (dùng chung với phụ huynh).

6. **Cổng lọc dữ liệu chưa publish/chưa finalize được thực thi ở cả hai tầng** —
   ứng dụng lọc tường minh (`queries.ts:74` `.not("session_finalized_at","is",null)`;
   assessments `.eq("is_published", true)`; scores `.eq("assessment_published", true)`;
   comments `.eq("visibility","student_visible")`) **và** RLS chặn. Đây là điểm rất tốt.

## 6. Test hiện có

| File | Bao phủ phần portal |
|---|---|
| `supabase/tests/012_attendance_test.sql` | RLS guardian/student trên `student_attendance_records` |
| `supabase/tests/016_assessments_gradebooks_test.sql` | RLS điểm/nhận xét cho portal |
| `supabase/tests/018_leaderboards_test.sql` | Top 5 đã publish |
| `tests/e2e/results.spec.ts` | Có chạm `/results` |
| `tests/e2e/security.spec.ts` | Cần kiểm có phủ `/parent/children/<id người khác>` hay không |
| **Không có** | e2e cho `/parent/children/[studentId]`, `/student/attendance` với vai trò sai, hoặc phụ huynh nhiều con |

## 7. Ranh giới với module khác

| Module | Quan hệ |
|---|---|
| M05-ATTENDANCE | Nguồn `student_attendance_records`, `v_student_attendance_summary`, quy tắc finalize |
| M07-ASSESSMENTS | `PublishedResultsPortal`, `getPublishedPortalResults`, Top 5 |
| M06-TEACHING-PLANS | Safe RPC `get_week_ahead_teaching_items` cho tuần tới |
| M10-NOTIFICATIONS | `/notifications` + danh sách deep-link hợp lệ |
| M11-REPORTS-DASHBOARD | `/dashboard` dùng chung — nguồn của lỗi ngõ cụt (xem M11-F04) |
| M14-NAVIGATION-SHELL | `guardianMobileNavigation`, `studentMobileNavigation` — nơi thiếu lối vào |
| Đơn xin nghỉ | Luồng nghiệp vụ do agent khác audit |
