# M05-ATTENDANCE — Ảnh hưởng khi hiện thực

> Ước lượng: **S** ≤ 0,5 ngày · **M** 0,5–2 ngày · **L** > 2 ngày. Bao gồm cả test.
> Không hạng mục nào yêu cầu `alter table` hay backfill dữ liệu.

## 1. Bảng tổng hợp

| Mã | Hạng mục | File phải sửa | API | Migration | RLS | Dữ liệu hiện có | Test | Ước lượng | Phụ thuộc |
|---|---|---|---|---|---|---|---|---|---|
| TB-01 | Ngày mặc định theo giờ VN | `src/lib/dates/index.ts`, `src/app/(dashboard)/attendance/page.tsx` | Không | Không | Không | Không | unit mới | **S** | — |
| TB-02 | Trạng thái khóa nhất quán | `src/features/attendance/constants.ts`, `.../server/queries.ts`, 2 page | Không | Không | Không | Không | unit + E2E | **S** | — |
| TB-03 | Confirm trước finalize | `attendance-editor.tsx` (+ dialog dùng chung nếu chưa có) | Không | Không | Không | Không | E2E | **S–M** | có component dialog? |
| TB-04 | Mã lỗi "phiên đã kết thúc" | `src/lib/errors/index.ts`, `attendance/server/actions.ts`, migration mới | Đổi *thông điệp*, không đổi hợp đồng | **Có** (`create or replace` 2 RPC) | Không | Không | pgTAP mới | **S** | — |
| TB-05 | Hiển thị lease + bảo vệ nháp | `attendance/server/actions.ts`, `.../queries.ts`, `attendance-editor.tsx`, `[sessionId]/page.tsx` | Trả thêm `leaseExpiresAt` | Không | Không | Không | E2E + unit | **M** | TB-04 (thông điệp) |
| TB-06 | Màn hình staff cho đơn xin nghỉ | mới: `src/features/absence-requests/server/queries.ts`, component danh sách; sửa `attendance/page.tsx`, `attendance-editor.tsx` | Dùng lại `acknowledgeAbsenceRequest` | Không | **Không cần policy mới** | Không | pgTAP đã có + E2E mới | **M** | — |
| TB-07 | Nới enrollment khi UPDATE + map lỗi | migration mới, `attendance/server/actions.ts` | Không | **Có** (`create or replace` trigger fn) | Không | Không | pgTAP mới | **S** | — |
| TB-08 | Báo "đang có người giữ" | `attendance/server/actions.ts`, `[sessionId]/page.tsx` | Không | Không | Không | Không | E2E | **S** | — |
| TB-09 | Badge cảnh báo + lọc roster | `attendance/server/queries.ts`, `attendance-editor.tsx` | Không | Không | Không | Không | E2E | **M** | TB-02 |
| TB-10 | Thống nhất nav / route-map | `src/config/navigation.ts` **hoặc** `src/lib/permissions/route-map.ts` | Không | Không | Không | Không | unit route-map + E2E | **S** | **cần user chốt** |
| TB-11 | Chặn đơn cho buổi đã chốt | `absence-requests/schemas.ts` (+ migration tùy chọn) | Không | Tùy chọn | Không | Đơn cũ giữ nguyên | unit + pgTAP | **S** | TB-01 (hàm ngày) |
| TB-12 | Giải thích cửa sổ sau unlock | `[sessionId]/page.tsx` | Không | Không | Không | Không | — | **S** | — |
| U-10 | Segmented control thay `<select>` | `attendance-editor.tsx` (+ component mới) | Không | Không | Không | Không | E2E phải đổi selector | **M** | ⚠ E2E hiện bám `select[aria-label^=…]` |
| U-21 | Nén thẻ em ở 360px | `attendance-editor.tsx` | Không | Không | Không | Không | E2E responsive | **M** | U-10 |
| U-24/25/26 | `aria-live`, focus, `role` | `attendance-editor.tsx`, `src/components/ui/form-message.tsx` | Không | Không | Không | Không | E2E a11y | **S–M** | ảnh hưởng nhiều module (FormMessage) |

## 2. Chi tiết theo tầng

### 2.1 File ứng dụng phải sửa

| File | Hạng mục | Ghi chú |
|---|---|---|
| `src/lib/dates/index.ts` | TB-01, TB-11 | Thêm `todayInAppZone()`; file này dùng bởi nhiều module ⇒ **chỉ thêm export mới**, không đổi hàm cũ |
| `src/app/(dashboard)/attendance/page.tsx` | TB-01, TB-02, TB-06, U-01, U-02 | File chịu nhiều thay đổi nhất ở tầng trang |
| `src/app/(dashboard)/attendance/[sessionId]/page.tsx` | TB-02, TB-05, TB-08, TB-12, U-09 | |
| `src/features/attendance/constants.ts` | TB-02 | Thêm `deriveSessionState` + nhãn `unlocked` |
| `src/features/attendance/server/queries.ts` | TB-02, TB-05, TB-09 | `toSessionCard` phải mang thêm trạng thái suy ra |
| `src/features/attendance/server/actions.ts` | TB-04, TB-05, TB-07, TB-08 | Mở rộng `RPC_ERROR_CODES`/`EXTRA_MESSAGES_VI` |
| `src/features/attendance/components/attendance-editor.tsx` | TB-03, TB-05, TB-09, U-10, U-11, U-13, U-17, U-21, U-24 | **Nên tách** thành `RosterList` + `StaffList` + `ActionBar` trước khi thêm; file hiện 364 dòng |
| `src/features/absence-requests/schemas.ts` | TB-11 | |
| `src/features/absence-requests/server/queries.ts` | TB-06 | **File mới** |
| `src/config/navigation.ts` **hoặc** `src/lib/permissions/route-map.ts` | TB-10 | Chọn 1 theo quyết định của user |
| `src/lib/errors/index.ts` | TB-04 | Thêm 2 mã vào `APP_ERROR_CODES` — **ảnh hưởng type toàn repo**, chỉ mở rộng union nên an toàn |
| `src/components/ui/form-message.tsx` | U-18, U-26 | **Cross-module** — mọi module dùng chung; cần rà lại nơi khác trước khi đổi |

### 2.2 API / Server Action

- **Không** đổi tên, tham số, hay kiểu trả về của bất kỳ RPC nào ⇒ `src/types/database.ts`
  **không cần regenerate** cho TB-04/TB-07 (chỉ đổi thân hàm).
- `claimAttendanceSession` và `heartbeatAttendanceSession` trả thêm `leaseExpiresAt` — **mở rộng**
  kiểu trả về của server action (không phải RPC), không phá vỡ nơi gọi hiện có.
- `acknowledgeAbsenceRequest` giữ nguyên chữ ký; chỉ được gọi thật lần đầu.
- `docs/11-api-and-server-actions.md:143-150` phải cập nhật mục "Đã hiện thực khác gì mô tả trên" khi
  thêm 2 mã lỗi mới.

### 2.3 Migration

Một migration duy nhất, đặt sau `20260724000100_rls_initplan_hot_reads.sql`:

| Đối tượng | Loại | Lý do |
|---|---|---|
| `public.save_and_finalize_attendance` | `create or replace` | TB-04 tách nhánh lỗi |
| `public.heartbeat_attendance_session` | `create or replace` | TB-04 tách nhánh lỗi |
| `app.sync_student_attendance_keys` | `create or replace` | TB-07 chỉ áp `enrollment_ok` cho INSERT |
| `app.validate_absence_request` | `create or replace` (tùy chọn) | TB-11 chặn buổi đã chốt |

**Không có:** `alter table`, `create table`, `drop`, backfill, đổi enum.
**Lưu ý bắt buộc:** sau migration phải `grant execute` lại nếu `create or replace` làm mất quyền —
với `create or replace` quyền được giữ, nhưng migration nên lặp lại
`grant execute on all functions in schema app to authenticated, service_role;` cho khớp pattern hiện
có (`20260721000300:793-794`).

### 2.4 RLS

**Không thêm/sửa policy nào.** Tất cả hạng mục đều nằm trong phạm vi policy hiện hữu:

| Nhu cầu mới | Policy đã có |
|---|---|
| Staff đọc danh sách đơn pending của lớp mình (TB-06) | `absence_requests_select_scope` (`M4:140-147`) |
| Staff ghi nhận đơn (TB-06) | `absence_requests_update_scope` (`M4:158-169`) + trigger `M4:104-111` |
| Đọc cảnh báo cho roster (TB-09) | `v_student_attendance_summary` là `security_invoker` (`M5:99`) |
| Cha sở/Cha phó/Thủ quỹ xem điểm danh (TB-10 phương án B) | `attendance_sessions_select_scope` nhánh `can_global_read()` (`M3:309`) — **đã cho phép sẵn**; chỉ route đang chặn |

### 2.5 Dữ liệu hiện có

| Nguy cơ | Đánh giá |
|---|---|
| Buổi đã chốt/khóa | Không bị đụng — không có `update` dữ liệu trong migration |
| Đơn xin nghỉ cũ vi phạm TB-11 | Vẫn tồn tại; trigger chỉ áp cho INSERT mới |
| Session đang `in_progress` khi deploy | `create or replace` không hủy transaction đang chạy; editor đang mở trang sẽ nhận thông điệp lỗi mới ở lần gọi kế tiếp — vô hại |
| Điểm chuyên cần đã sinh (M07) | Không đụng |

**Khuyến nghị deploy:** ngoài khung giờ sinh hoạt (không phải tối thứ Năm, không phải sáng Chúa nhật).

### 2.6 Test

| Loại | Phải thêm/sửa |
|---|---|
| Unit (`tests/unit/`) | `mostRecentMeetingDate` với `TZ=UTC` (TB-01); `deriveSessionState` mọi tổ hợp (TB-02); `createAbsenceRequestSchema` chặn ngày quá khứ (TB-11); `canAccessRoute` cho 3 role theo quyết định TB-10 |
| pgTAP (`supabase/tests/012_attendance_test.sql`) | +`ATTENDANCE_SESSION_NOT_CLAIMED` khi `editing_by is null`; +`ATTENDANCE_LEASE_EXPIRED`; +giữ nguyên assert `ATTENDANCE_ALREADY_CLAIMED` cho ca bị tiếp quản (`012:192-199`); +chốt được buổi có em đã đóng ghi danh lùi ngày (TB-07); +đơn cho buổi đã chốt bị từ chối (TB-11). Phải cập nhật `plan(67)` |
| E2E (`tests/e2e/attendance.spec.ts`) | Hộp xác nhận finalize (TB-03); banner "đang có người giữ" (TB-08); đồng hồ lease (TB-05); luồng staff ghi nhận đơn (TB-06); **⚠ nếu làm U-10 thì mọi selector `select[aria-label^="Thánh lễ của"]` phải đổi** — đây là chi phí ẩn lớn nhất của U-10 |
| A11y | Bài mới kiểm `aria-live` phát thông báo khi mất quyền sửa (U-24) |

**Rủi ro test lớn nhất:** E2E hiện bám chặt vào `<select>` (5 chỗ). Nếu chọn U-10, tách thành 2 PR:
PR-1 giữ `<select>` + thêm `data-testid` ổn định và đổi E2E sang testid; PR-2 mới thay control.

## 3. Thứ tự thực hiện đề xuất

| Đợt | Nội dung | Ước lượng | Lý do |
|---|---|---|---|
| **1 — Sửa lỗi, rủi ro thấp** | TB-01, TB-02, TB-08, TB-12, U-04/TB-10 | **S** ×5 ≈ 1,5 ngày | Không đụng DB, không đụng E2E selector; TB-01 chặn ngay rủi ro ghi nhầm buổi |
| **2 — DB + thông điệp** | TB-04, TB-07 | **S** ×2 ≈ 1 ngày | Một migration duy nhất, chạy `db:reset` + pgTAP một lần |
| **3 — Hoàn thiện nghiệp vụ** | TB-06, TB-11 | **M + S** ≈ 2 ngày | Đóng khoảng trống WF-10 |
| **4 — Trạng thái & an toàn thao tác** | TB-03, TB-05, U-17/18/24/25 | **M** ≈ 2 ngày | Cần dialog + a11y |
| **5 — Trải nghiệm mobile** | TB-09, U-10, U-11, U-21, U-23 | **M–L** ≈ 3 ngày | Kèm chi phí đổi E2E selector |

**Tổng ước lượng: ~9–10 ngày công**, trong đó ~2,5 ngày đầu (đợt 1+2) đã xử lý toàn bộ vấn đề mức
HIGH/MED về đúng đắn dữ liệu.

## 4. Phụ thuộc ra ngoài module

| Phụ thuộc | Ảnh hưởng | Xử lý |
|---|---|---|
| `src/components/ui/form-message.tsx` (U-18/26) | Dùng bởi M01, M03, M07, M12, M13… | Thêm `role` là thay đổi cộng thêm, không phá; nên làm ở PR riêng có rà soát toàn repo |
| `src/lib/errors/index.ts` (TB-04) | Union type dùng toàn repo | Chỉ mở rộng union ⇒ TS không đỏ ở nơi khác |
| `src/lib/dates/index.ts` (TB-01) | Dùng bởi nhiều trang | Chỉ thêm export mới |
| `src/lib/permissions/route-map.ts` (TB-10 phương án B) | Ảnh hưởng M14 Navigation và mọi `requireRouteAccess` | Cần unit test route-map + E2E cho 3 role |
| M07 Assessments | `refresh_attendance_assessment_scores` đọc view chuyên cần | Không hạng mục nào đổi view ⇒ không ảnh hưởng |
| M11 Dashboard | `riskReasons` đọc cùng cờ | Không ảnh hưởng |
| M13 Portal | TB-06 làm trạng thái `acknowledged` xuất hiện thật | Nhãn đã có (`absence-requests/schemas.ts:4-8`), không cần sửa |
