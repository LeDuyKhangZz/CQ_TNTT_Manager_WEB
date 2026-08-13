# M05-ATTENDANCE — Tiêu chí nghiệm thu

> Ký hiệu: **[R]** = test hồi quy phải **giữ xanh** (đã có hôm nay); **[N]** = test mới phải viết.
> Mọi test quyền chạy dưới **JWT thật**, không service role (`CLAUDE.md` §4).

## A. Nghiệm thu theo luồng

### AC-F01 — Mở buổi điểm danh (TB-01, TB-08)

**AC-F01-1 [N]** — Ngày mặc định theo giờ xứ đoàn
*Given* server chạy với `TZ=UTC` và thời điểm hệ thống là `2026-07-26T00:30:00Z` (tức 07:30 sáng
Chúa nhật 26/07 giờ Việt Nam — và cả `2026-07-25T23:30:00Z` = 06:30 sáng Chúa nhật)
*When* GLV mở `/attendance`
*Then* ô "Ngày" đổ sẵn `2026-07-26` và ô "Buổi" đổ sẵn `Chúa nhật`
*And* **không** phải ngày thứ Năm trước đó.

**AC-F01-2 [R]** — Chỉ thứ Năm/Chúa nhật
*Given* GLV chọn ngày thứ Ba
*When* bấm "Mở buổi"
*Then* thấy "Chỉ điểm danh vào thứ Năm hoặc Chúa nhật." và không có session nào được tạo.
*(pgTAP: kiểm `claim_attendance_session` raise `ATTENDANCE_INVALID_MEETING_DAY`)*

**AC-F01-3 [R]** — Một buổi duy nhất khi hai người bấm cùng lúc
*Given* GLV A và GLV B cùng lớp bấm "Mở buổi" cho cùng (lớp, ngày, buổi)
*When* cả hai request chạy đồng thời
*Then* chỉ tồn tại **một** dòng `attendance_sessions`
*And* đúng một người nhận `claimed=true`, người kia nhận `claimed=false` kèm tên editor.
*(E2E `tests/e2e/attendance.spec.ts` bài 2 phủ ca tuần tự; bổ sung pgTAP cho ca đồng thời)*

**AC-F01-4 [N]** — Báo rõ khi buổi đang có người giữ
*Given* GLV A đang giữ buổi
*When* GLV B mở cùng buổi
*Then* B thấy ngay banner "{Tên A} đang phụ trách buổi này. Bạn đang xem ở chế độ chỉ đọc."
*And* B **không** thấy nút "Lưu nháp"/"Hoàn tất".

### AC-F03/F06 — Sửa và chốt (TB-03, TB-04, TB-07)

**AC-F03-1 [R]** — Mặc định present, không vô tình ghi absent
*Given* buổi vừa được mở cho lớp có N em
*When* GLV **không đụng vào bất kỳ em nào** và bấm "Hoàn tất"
*Then* cả N dòng có `mass_status='present'` **và** `catechism_status='present'`
*And* số dòng có trạng thái vắng = **0**.

**AC-F03-2 [R]** — Hai trạng thái độc lập
*Given* GLV đặt em X: Thánh lễ = `present`, Giáo lý = `unexcused_absence`
*When* lưu và tải lại trang
*Then* hai giá trị giữ nguyên độc lập, không cái nào kéo theo cái kia.

**AC-F06-1 [N]** — Xác nhận trước khi chốt
*Given* GLV đã đánh 3 em vắng
*When* bấm "Hoàn tất điểm danh"
*Then* hộp xác nhận hiện bảng phân bố đủ 5 trạng thái cho **cả** Thánh lễ và Giáo lý, cùng "GLV có
mặt x/y"
*And* chỉ khi bấm nút xác nhận thì `save_and_finalize_attendance` mới được gọi
*And* bấm Hủy thì **không** có request nào tới server.

**AC-F06-2 [R]** — Finalize idempotent về dữ liệu
*Given* buổi đã chốt lúc `T0`, `locked_at = T0 + 3 ngày`
*When* Super Admin/GLV tiếp quản rồi chốt lại lúc `T0 + 1 ngày`
*Then* `finalized_at` vẫn là `T0`
*And* `locked_at` vẫn là `T0 + 3 ngày` — **không** bị đẩy lùi
*And* số dòng `student_attendance_records` không tăng.

**AC-F06-3 [N]** — Thông điệp đúng khi phiên đã kết thúc
*Given* GLV vừa chốt xong (server đã xóa `editing_by`)
*When* GLV bấm chốt lần nữa (double-click / retry)
*Then* thông điệp là "Phiên chỉnh sửa đã kết thúc. Bấm *Tiếp quản* để sửa tiếp."
*And* **không** phải "Buổi điểm danh đang có người khác phụ trách."

**AC-F06-4 [N]** — Em rời lớp không khóa cứng buổi
*Given* buổi đã seed roster gồm em X; sau đó ghi danh của X bị đóng với `ended_on` **trước** ngày buổi
*When* GLV lưu nháp rồi chốt buổi
*Then* thao tác **thành công**
*And* dòng của X vẫn còn với trạng thái GLV đã chọn.

**AC-F06-5 [N]** — Lỗi trigger được dịch ra tiếng Việt
*Given* một dòng điểm danh vi phạm ràng buộc trigger (ví dụ enrollment khác lớp)
*When* RPC ném `ATTENDANCE_ENROLLMENT_CLASS_MISMATCH`
*Then* người dùng thấy câu tiếng Việt cụ thể, **không** phải "Thao tác bị xung đột. Vui lòng thử lại."

### AC-F05 — Tranh chấp editor (giữ nguyên, TB-05)

**AC-F05-1 [R]** — Lease dùng giờ DB, không tin client
*Given* GLV A giữ buổi, `last_activity_at` cách đây 5 phút theo giờ DB
*When* GLV B đổi đồng hồ máy mình lùi/tiến rồi bấm "Tiếp quản"
*Then* B nhận `LEASE_NOT_EXPIRED` → "Chưa thể tiếp quản vì phiên chỉnh sửa chưa hết hạn."

**AC-F05-2 [R]** — Editor cũ không ghi đè sau khi bị tiếp quản
*Given* B đã tiếp quản và lưu giá trị `excused_absence` cho em X
*When* A (DOM cũ, control còn enabled) đổi X thành `unexcused_absence` và bấm "Lưu nháp"
*Then* A thấy "Buổi điểm danh đang có người khác phụ trách."
*And* tải lại phía B, em X **vẫn là** `excused_absence`.
*(E2E bài 2 — phải giữ xanh)*

**AC-F05-3 [N]** — Không mất công sức âm thầm
*Given* A đang sửa dở và bị B tiếp quản
*When* heartbeat của A thất bại
*Then* A thấy banner rõ ràng nêu tên người tiếp quản và cảnh báo phần chưa lưu
*And* banner được screen reader đọc (`aria-live="assertive"`)
*And* trang **không** tự động gửi bất kỳ ghi nào lên server.

**AC-F05-4 [N]** — Hiển thị hạn phiên chỉnh sửa
*Given* GLV đang giữ buổi với lease 15 phút
*When* trang mở
*Then* header hiện thời gian còn lại lấy từ giá trị **server trả về**, cập nhật theo nhịp heartbeat
*And* vùng này có `aria-live="polite"`.

### AC-F07/F08/F09 — Khóa và mở khóa

**AC-F07-1 [R]** — Khóa enforce ở DB, không bypass được
*Given* buổi đã quá mốc `locked_at`
*When* gọi **trực tiếp** PostgREST `POST /rest/v1/student_attendance_records` hoặc `PATCH` với JWT của
GLV lớp đó
*Then* nhận `42501` — vì `authenticated` **không có** quyền `insert/update` trên bảng
*And* gọi RPC `save_and_finalize_attendance` nhận `ATTENDANCE_LOCKED`.

**AC-F07-2 [R]** — Trang đang mở khi mốc khóa trôi qua
*Given* GLV đang mở trang buổi ở chế độ sửa; mốc khóa vừa trôi qua
*When* bấm "Lưu nháp"
*Then* thấy "Buổi điểm danh đã bị khóa."
*And* sau khi tải lại, mọi control `disabled` và thanh hành động biến mất.
*(E2E bài 3 — phải giữ xanh)*

**AC-F07-3 [N]** — Trạng thái nhất quán hai màn hình
*Given* một buổi đã quá mốc khóa
*When* xem ở `/attendance` và ở `/attendance/{id}`
*Then* **cả hai** hiển thị nhãn "Đã khóa"
*And* buổi đang mở khóa hiển thị "Đã mở khóa" ở cả hai nơi.

**AC-F08-1 [R]** — Chỉ Super Admin mở khóa
*Given* GLV lớp / trưởng ngành / phụ huynh
*When* gọi thẳng server action `unlockAttendanceSession` hoặc RPC `unlock_attendance_session`
*Then* nhận `FORBIDDEN` ở **cả hai** tầng (server action `actions.ts:182` và RPC `M3:766-768`).

**AC-F09-1 [R]** — Sau mở khóa chỉ Super Admin ghi được
*Given* buổi có `unlocked_at is not null`
*When* GLV lớp gọi claim / takeover / save
*Then* cả ba nhận `ATTENDANCE_LOCKED`
*And* Super Admin thực hiện được.

**AC-F09-2 [N]** — Giải thích cửa sổ sửa
*Given* buổi đang mở khóa và `finalized_at` cách đây > `attendance_lock_days`
*When* Super Admin xem trang buổi
*Then* thấy dòng giải thích rằng chốt lại sẽ khóa lại ngay vì mốc khóa tính từ lần chốt đầu.

### AC-F11/F12/F13 — Đơn xin nghỉ (TB-06, TB-11)

**AC-F11-1 [R]** — Chỉ phụ huynh của chính em đó gửi được
*Given* phụ huynh P1 (con: S1) và phụ huynh P2 (con: S2)
*When* P1 gửi đơn với `student_id = S2` bằng request thô
*Then* bị RLS từ chối (`42501`), không có dòng nào được tạo.

**AC-F11-2 [R]** — Thiếu nhi và GLV không gửi hộ
*Given* JWT của thiếu nhi S1 hoặc của GLV lớp
*When* insert vào `absence_requests`
*Then* bị từ chối — không có policy insert cho họ.

**AC-F11-3 [N]** — Không xin nghỉ cho buổi đã chốt
*Given* buổi Chúa nhật 20/07 đã được chốt
*When* phụ huynh gửi đơn cho ngày 20/07
*Then* nhận thông điệp "Chỉ xin nghỉ cho buổi sắp tới." và không có dòng nào được tạo.

**AC-F12-1 [R]** — Chủ đơn chỉ được rút khi còn `pending`
*Given* đơn ở trạng thái `acknowledged`
*When* phụ huynh cố đổi sang `cancelled`
*Then* trigger raise `ABSENCE_OWNER_CAN_ONLY_CANCEL`.

**AC-F12-2 [R]** — Staff không hủy được đơn của phụ huynh
*Given* JWT của GLV lớp
*When* update `status='cancelled'`
*Then* trigger raise `ABSENCE_STAFF_CANNOT_CANCEL`.

**AC-F13-1 [N]** — Staff thấy đơn **trước** khi điểm danh
*Given* phụ huynh đã gửi đơn cho Chúa nhật tới
*When* GLV lớp mở `/attendance`
*Then* thấy đơn đó trong thẻ "Đơn xin nghỉ tuần này" **mà không cần** mở buổi điểm danh
*And* GLV lớp khác **không** thấy đơn này.

**AC-F13-2 [N]** — Ghi nhận đơn
*Given* đơn đang `pending`
*When* GLV bấm "Ghi nhận"
*Then* `status='acknowledged'`, `reviewed_by` = profile của GLV, `reviewed_at` do **server** đặt
*And* phụ huynh thấy nhãn "Đã ghi nhận" ở `/parent/absence-requests`.

**AC-F13-3 [R+N]** — Đơn KHÔNG tự sửa điểm danh
*Given* em X có đơn xin nghỉ `acknowledged` cho buổi Y
*When* GLV mở buổi Y
*Then* trạng thái của X vẫn là `present` (mặc định seed)
*And* badge/nút gợi ý chỉ đổi **draft phía client**
*And* nếu GLV không bấm gì rồi chốt, X được ghi `present` — **quyết định vẫn của GLV**.

**AC-F13-4 [N]** — Gợi ý không ghi đè quyết định đã có
*Given* GLV đã tự đặt X = `unexcused_absence`
*When* trang được `router.refresh()` vì lý do bất kỳ
*Then* giá trị GLV chọn **không** bị đơn xin nghỉ ghi đè thành `excused_absence`.

### AC-F14 — Portal (giữ nguyên)

**AC-F14-1 [R]** — Chỉ đọc bản đã chốt
*Given* buổi đang điểm danh dở (chưa `finalized_at`)
*When* phụ huynh/thiếu nhi truy vấn `student_attendance_records`
*Then* trả về **0 dòng**.

**AC-F14-2 [R]** — Chỉ đọc của chính con/mình
*Given* lớp có con của P1 và con của P2, buổi đã chốt
*When* P1 truy vấn
*Then* nhận **đúng 1 dòng**, là dòng của con P1.

**AC-F14-3 [R]** — Không đọc được điểm danh giáo lý viên
*Given* JWT phụ huynh hoặc thiếu nhi
*When* truy vấn `staff_attendance_records`
*Then* trả về 0 dòng.

### AC-F15/F16 — Cảnh báo và điểm

**AC-F15-1 [R]** — Chỉ buổi đã chốt vào thống kê
*Given* 3 buổi đã chốt và 1 buổi đang dở
*When* đọc `v_student_attendance_summary`
*Then* `sessions_counted = 3`.

**AC-F15-2 [R]** — Chuỗi vắng và cờ cảnh báo
*Given* em vắng 3 Chúa nhật liên tiếp, ngưỡng năm học = 3
*Then* `sunday_absence_streak = 3` và `warn_consecutive_sunday = true`.

**AC-F15-3 [R]** — Năm học mới luôn có dòng trọng số
*Given* tạo `academic_years` mới
*Then* `attendance_weight_settings` có đúng 1 dòng tương ứng — nếu không, view sẽ mất sạch số liệu.

**AC-F15-4 [R]** — View tôn trọng RLS của người đọc
*Given* JWT phụ huynh
*When* `select count(*) from v_student_attendance_summary`
*Then* chỉ đếm được các em của chính họ (`security_invoker`).

**AC-F16-1 [R]** — Không ghi đè điểm GLV sửa tay
*Given* GLV đã sửa tay điểm chuyên cần của em X (`is_manual_override = true`)
*When* chạy `refresh_attendance_assessment_scores`
*Then* `score` của X **giữ nguyên**
*And* `system_suggested_score` được cập nhật theo dữ liệu mới.

**AC-F16-2 [R]** — Chưa có dữ liệu thì để trống, không thành 0
*Given* em Y chưa có buổi chốt nào
*When* refresh điểm chuyên cần
*Then* `score` của Y là `null`, **không** phải `0`.

---

## B. Test bảo mật bắt buộc phải XANH

> Đây là bộ chặn merge. Bất kỳ hạng mục nào trong `04_TO_BE_FLOWS.md` cũng không được làm đỏ nhóm này.

### B.1 pgTAP / RLS negative (`supabase/tests/012_attendance_test.sql`)

| # | Assertion | Trạng thái |
|---|---|---|
| S-01 | Phụ huynh gọi `claim_attendance_session` → `FORBIDDEN` | [R] `012:86-91` |
| S-02 | GLV lớp khác gọi `claim_attendance_session` → `FORBIDDEN` | [R] `012:80-85` |
| S-03 | Thiếu nhi gọi `claim_attendance_session` → `FORBIDDEN` | [R] `012:92-97` |
| S-04 | `insert` thẳng vào `attendance_sessions` → từ chối | [R] `012:134-140` |
| S-05 | `insert` thẳng vào `student_attendance_records` → từ chối | [R] `012:141-144` |
| S-06 | `update` thẳng vào `student_attendance_records` → từ chối | [R] `012:145-149` |
| S-07 | Người thứ hai claim khi lease còn hạn → không chuyển editor | [R] `012:151-171` |
| S-08 | Takeover khi lease còn hạn → `LEASE_NOT_EXPIRED` | [R] `012:162-172` |
| S-09 | Editor cũ save sau khi bị tiếp quản → `ATTENDANCE_ALREADY_CLAIMED`, dữ liệu không đổi | [R] `012:192-199` |
| S-10 | Phụ huynh đọc buổi **chưa** chốt → 0 dòng | [R] `012:239-245` |
| S-11 | Phụ huynh đọc buổi đã chốt → đúng dòng của con mình, không phải con người khác | [R] `012:279-309` |
| S-12 | Save/claim sau mốc khóa → `ATTENDANCE_LOCKED` | [R] `012:310-329` |
| S-13 | Không phải SA gọi `unlock_attendance_session` → `FORBIDDEN` | [R] `012:331-342` |
| S-14 | Sau unlock, GLV lớp vẫn bị chặn; SA sửa được | [R] `012:343-359` |
| S-15 | Phụ huynh gửi đơn cho con người khác → từ chối | [R] `012:376-392` |
| S-16 | Thiếu nhi tự gửi đơn → từ chối | [R] `012:384-392` |
| S-17 | Staff hủy đơn của phụ huynh → từ chối | [R] `012:415-420` |
| S-18 | Đơn xin nghỉ **không** làm đổi `student_attendance_records` | [R] `012:427-434` |
| S-19 | View chuyên cần dưới JWT phụ huynh chỉ trả dòng của con mình | [R] `012:522-529` |
| **S-20** | `heartbeat` bởi người **không** giữ lease → từ chối (mã mới `ATTENDANCE_ALREADY_CLAIMED`) | **[N]** |
| **S-21** | `save_and_finalize_attendance` khi `editing_by is null` → `ATTENDANCE_SESSION_NOT_CLAIMED`, **không** ghi gì | **[N]** |
| **S-22** | Sau TB-07, UPDATE dòng có enrollment đã đóng **thành công**, nhưng INSERT dòng cho enrollment không thuộc lớp vẫn bị từ chối | **[N]** |
| **S-23** | Sau TB-06, GLV lớp A **không** đọc/ghi nhận được đơn của lớp B | **[N]** |
| **S-24** | Sau TB-11, đơn cho buổi đã chốt bị từ chối ở tầng DB | **[N]** (nếu chọn trigger) |
| **S-25** | Guardian/student không thể có `role_assignments.class_id` ⇒ `scope_class_ids()` rỗng | **[N]** — chốt cứng BR-M05-24 |

Sau khi thêm S-20…S-25, phải cập nhật `select plan(n)` (`012:11`).

### B.2 E2E (`tests/e2e/attendance.spec.ts`)

| # | Kịch bản | Trạng thái |
|---|---|---|
| E-01 | Phụ huynh mở `/attendance` → bị đá sang `/access-denied` | [R] |
| E-02 | GLV mở buổi → sửa ngoại lệ → lưu nháp → chốt → phụ huynh đọc được bản đã chốt | [R] |
| E-03 | Hai browser context độc lập: B không sửa được khi A giữ; sau khi lease hết B tiếp quản và ghi; A bị từ chối và **không** ghi đè | [R] |
| E-04 | Trang stale khi mốc khóa trôi qua → lưu bị từ chối → reload thấy read-only | [R] |
| E-05 | Phụ huynh gửi rồi hủy đơn | [R] |
| **E-06** | Sau TB-06: GLV thấy đơn ở `/attendance` **trước khi** mở buổi, bấm "Ghi nhận", phụ huynh thấy "Đã ghi nhận" | **[N]** |
| **E-07** | Sau TB-03: bấm "Hoàn tất" → hộp xác nhận → bấm Hủy → **không** có session nào bị chốt | **[N]** |
| **E-08** | Sau TB-01: đặt `TZ=UTC` cho server dev, mở `/attendance` ở mốc thời gian sáng Chúa nhật ICT → ngày mặc định đúng | **[N]** |
| **E-09** | Sau TB-02: buổi đã khóa hiển thị cùng một nhãn ở hub và trang chi tiết | **[N]** |
| E-10 | Không tràn ngang ở 360 / 768 / 1366 cho `/attendance`, `/attendance/{id}`, `/parent/absence-requests` | [R] |

### B.3 Unit

| # | Kịch bản | Trạng thái |
|---|---|---|
| U-01 | `meetingTypeForDate` chỉ nhận thứ Năm / Chúa nhật | [R] |
| U-02 | `isAbsent` đúng cho 5 trạng thái | [R] |
| U-03 | `saveAttendanceSchema` giữ hai status độc lập; note toàn khoảng trắng → `null` | [R] |
| U-04 | `saveAttendanceSchema` từ chối trạng thái ngoài enum và enum lẫn giữa student/staff | [R] |
| U-05 | `createAbsenceRequestSchema` chặn ngày không sinh hoạt, bắt buộc lý do | [R] |
| **U-06** | `mostRecentMeetingDate` đúng dưới `TZ=UTC` ở các mốc 06:00 / 23:00 giờ VN | **[N]** |
| **U-07** | `deriveSessionState` đúng cho mọi tổ hợp `(status, lockedAt, unlockedAt, now)` | **[N]** |
| **U-08** | `canAccessRoute` cho `/attendance` với 14 role — khớp quyết định TB-10 | **[N]** |
| **U-09** | `createAbsenceRequestSchema` chặn ngày quá khứ | **[N]** |

---

## C. Định nghĩa hoàn thành (DoD)

1. `npm run lint` và `npm run build` xanh.
2. `npm run db:reset` + toàn bộ pgTAP xanh, **không** có assertion nào bị bỏ (`skip`).
3. `npm run test` (vitest) xanh, gồm toàn bộ [N] ở mục B.3.
4. E2E xanh trên cả 3 viewport, gồm toàn bộ [N] ở mục B.2.
5. Không có server action nào không được component nào gọi (kiểm bằng grep trong PR review) —
   luật này sinh ra từ F13-I2.
6. `docs/03-workflow.md` (WF-05 state `Locked`, WF-10 bước 5), `docs/05-permission-matrix.md:39` và
   `docs/11-api-and-server-actions.md:143-150` được cập nhật cho khớp code.
7. `WORKLOG.md` ghi rõ migration đã chạy và kết quả test thật (không ghi "sẽ chạy sau").
