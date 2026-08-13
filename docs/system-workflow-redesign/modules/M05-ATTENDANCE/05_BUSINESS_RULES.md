# M05-ATTENDANCE — Business Rules

> Cột "Nơi enforce" ghi tầng **thật sự** chặn được, không phải chỗ ẩn nút.
> `M3` = `supabase/migrations/20260721000300_attendance_sessions.sql`,
> `M4` = `supabase/migrations/20260721000400_absence_requests.sql`,
> `M5` = `supabase/migrations/20260721000500_attendance_alerts_and_score.sql`.

## 1. Buổi điểm danh

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn docs? |
|---|---|---|---|---|
| BR-M05-01 | Chỉ thứ Năm và Chúa nhật có buổi sinh hoạt | DB constraint + RPC + Zod + client helper | `M3:55-58`, `M3:426-431`, `constants.ts:55-60`, `schemas.ts:23` | Không (D-29). **Nhưng** ngày đổ sẵn tính sai múi giờ: `attendance/page.tsx:22-31` |
| BR-M05-02 | Mỗi (lớp, ngày, buổi) có đúng một session | DB unique constraint | `M3:53` | Không |
| BR-M05-03 | Chỉ lớp `active` mới mở được buổi | RPC | `M3:438-440` | Không |
| BR-M05-04 | Chỉ GLV có phân công ở lớp đó (hoặc Super Admin) được điểm danh; trưởng ngành **không** tự điểm danh mọi lớp trong ngành | `app.can_edit_attendance` gọi trong cả 4 RPC | `M3:243-251`, `:421`, `:517`, `:560`, `:636` | Không — khớp `docs/05-permission-matrix.md:123` |
| BR-M05-05 | Chỉ **một** editor giữ quyền ghi tại một thời điểm; claim phải nguyên tử | RPC: `insert on conflict do nothing` + `select … for update` | `M3:446-453`, `:465-481` | Không |
| BR-M05-06 | Lease dài `academic_years.attendance_edit_lease_minutes` (mặc định 15'), tính bằng **giờ DB** | RPC (`now()` trong Postgres) | `M3:466-468`, `:527`, `:578`, `:654` | Không (D-32). UI **không** hiển thị hạn — TB-05 |
| BR-M05-07 | Editor cũ sau khi bị tiếp quản **không** ghi đè được | RPC save + heartbeat | `M3:652-656`, `:525-529` | Không. pgTAP `012:192-199`, E2E bài 2 |
| BR-M05-08 | Tiếp quản chỉ khi lease đã hết theo giờ DB | RPC takeover | `M3:575-580` | Không |
| BR-M05-09 | Mặc định mọi em `present` cho **cả hai** trạng thái; chỉ ngoại lệ mới phải sửa | Cột default + seed roster | `M3:87-88`, `M3:364-374` | Không (D-31). pgTAP `012:104-132` |
| BR-M05-10 | Thánh lễ và Giáo lý là **hai trạng thái độc lập**, không suy ra lẫn nhau | Hai cột riêng; hai câu SET riêng; UI hai select riêng | `M3:87-88`, `M3:661-662`, `attendance-editor.tsx:225-255` | Không (D-30). pgTAP `012:217-238`, unit test |
| BR-M05-11 | Chốt buổi phải có roster đủ so với ghi danh mở tại ngày đó | RPC finalize | `M3:686-700` | Không. **Thiếu** hộp xác nhận UI mà `docs/06-ui-ux-spec.md:322-331` yêu cầu |
| BR-M05-12 | Chốt lại **không** đẩy lùi mốc khóa: giữ `finalized_at` đầu tiên | RPC finalize | `M3:705-707` | Không. pgTAP `012:266-278` |
| BR-M05-13 | Buổi khóa sau `attendance_lock_days` (mặc định 3) kể từ lần chốt đầu | RPC đặt `locked_at`; 3 RPC ghi cùng chặn | `M3:707`, `:455-459`, `:563-566`, `:639-642` | Không (D-33) |
| BR-M05-14 | Mọi thao tác **ghi** điểm danh chỉ qua RPC; `authenticated` không có `insert/update` trên 3 bảng | GRANT + RLS (không có policy write) | `M3:279-288` | Không. pgTAP `012:134-149` |
| BR-M05-15 | Chỉ Super Admin mở khóa; sau mở khóa tới lần chốt kế tiếp chỉ Super Admin ghi được | RPC unlock + cờ `unlocked_at` trong 3 RPC ghi + kiểm role ở server action | `M3:766-768`, `:461-463`, `:567-569`, `:643-645`, `actions.ts:180-183` | Không (D-33). pgTAP `012:331-359` |
| BR-M05-16 | Không lưu log before/after khi sửa buổi đã khóa | — (cố ý không có) | `docs/03-workflow.md:162`; dấu vết = `unlocked_by`/`unlocked_at`/`updated_by` | Không |
| BR-M05-17 | Điểm danh giáo lý viên nằm trong cùng buổi, dùng enum 3 giá trị riêng | Bảng + enum + Zod riêng | `M3:107-129`, `constants.ts:43-47`, `schemas.ts:16-18` | Không (D-35) |
| BR-M05-18 | Em ghi danh sau khi mở buổi vẫn có dòng; ngoại lệ đã sửa không bị ghi đè | `seed_attendance_roster` gọi lại ở takeover và mỗi lần save, `on conflict do nothing` | `M3:374`, `:590`, `:658` | Không |
| BR-M05-19 | Không đổi được `attendance_session_id`/`enrollment_id` của một dòng đã có | Trigger | `M3:150-153`, `:205-208` | Không |
| BR-M05-20 | Dòng điểm danh phải thuộc đúng lớp của buổi | Trigger | `M3:175-177`, `:222-224` | Không |

## 2. Quyền đọc

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn docs? |
|---|---|---|---|---|
| BR-M05-21 | Phụ huynh/thiếu nhi chỉ đọc bản ghi **của chính con/mình** và **chỉ sau khi buổi đã chốt** | RLS policy trên `student_attendance_records` (`session_finalized_at is not null`) | `M3:320-330` | Không — khớp `docs/05-permission-matrix.md:39`. pgTAP `012:239-245,279-309` |
| BR-M05-22 | Phụ huynh/thiếu nhi thấy metadata buổi chỉ khi buổi đã chốt | RLS trên `attendance_sessions` | `M3:306-316` | Không |
| BR-M05-23 | Phụ huynh/thiếu nhi **không** đọc được điểm danh giáo lý viên | RLS trên `staff_attendance_records` | `M3:333-342` | Không |
| BR-M05-24 | Guardian/student không thể có `class_id` trong `role_assignments` ⇒ `scope_class_ids()` của họ luôn rỗng, không có đường vòng | DB check constraint | `20260715000100_identity_foundation.sql:76-80` | Không |
| BR-M05-25 | Trưởng/Phó ngành đọc mọi buổi trong ngành | `scope_class_ids()` trong policy | `20260721000200:21-43`, `M3:306-316` | Không |
| BR-M05-26 | Cha sở / Cha phó / Thủ quỹ được **xem** điểm danh | ✖ **Không nơi nào enforce theo hướng cho phép** — `/attendance` loại họ | `route-map.ts:9-11,29` | **CÓ** — `docs/05-permission-matrix.md:39` ghi 👁 / 👁 báo cáo. Xem NEEDS_CONFIRMATION |

## 3. Đơn xin nghỉ (WF-10)

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn docs? |
|---|---|---|---|---|
| BR-M05-27 | Chỉ **phụ huynh của chính em đó** gửi được đơn; thiếu nhi và GLV không gửi hộ | RLS insert policy | `M4:151-156` | Không. pgTAP `012:376-392` |
| BR-M05-28 | `class_id`/`academic_year_id`/`status` do trigger suy ra, client không đặt được | Trigger BEFORE INSERT | `M4:74-89` | Không |
| BR-M05-29 | Một đơn còn hiệu lực cho mỗi (em, ngày, buổi); hủy rồi gửi lại được | Unique partial index | `M4:47-49` | Không |
| BR-M05-30 | Người gửi chỉ được **rút** đơn khi còn `pending`; không sửa lý do, không tự duyệt | Trigger | `M4:112-119` | Không |
| BR-M05-31 | Staff **không** được hủy đơn của phụ huynh | Trigger | `M4:105-107` | Không. pgTAP `012:415-420` |
| BR-M05-32 | Staff ghi nhận đơn → `reviewed_by`/`reviewed_at` lấy từ phiên đăng nhập | Trigger | `M4:108-111` | Không |
| BR-M05-33 | Đơn **không bao giờ** tự ghi vào điểm danh; chỉ gợi ý, editor quyết định | Không có trigger nào ghi sang `student_attendance_records`; UI chỉ hiện badge | `M4:1-7,174-175`, `queries.ts:246-252`, `attendance-editor.tsx:213-215` | Không (D-36, WF-10 bước 6–7). pgTAP `012:427-434` |
| BR-M05-34 | Đơn không sửa được điểm danh đã khóa | Hệ quả của BR-M05-33 + BR-M05-14 | — | Không (WF-10 bước 7) |
| BR-M05-35 | Staff lớp **thấy đơn trước khi điểm danh** | ✖ **Chưa hiện thực** — chỉ thấy badge sau khi đã mở buổi | `queries.ts:246-252` | **CÓ** — `docs/03-workflow.md:236` (WF-10 bước 5) |
| BR-M05-36 | Trạng thái `acknowledged` và `staff_note` đạt tới được từ UI | ✖ **Chưa hiện thực** — action mồ côi | `absence-requests/server/actions.ts:94-112` | **CÓ** — hàm ý của WF-10 bước 5 |
| BR-M05-37 | Không xin nghỉ cho buổi đã chốt hoặc ngày quá khứ | ✖ **Không nơi nào enforce** | `absence-requests/schemas.ts:10-20`, `M4:37-40` | Không nêu trong docs — đề xuất mới (TB-11) |

## 4. Cảnh báo và điểm chuyên cần (WF-06)

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn docs? |
|---|---|---|---|---|
| BR-M05-38 | Chỉ buổi **đã chốt** vào thống kê chuyên cần | View `where session.finalized_at is not null` | `M5:130`, `:254` | Không |
| BR-M05-39 | Cảnh báo tính qua view khi đọc, không cron, không materialize | View `security_invoker` | `M5:98-99,217-218,236-237` | Không — WF-06 cho phép (`docs/03-workflow.md:175`) |
| BR-M05-40 | 4 loại cảnh báo: vắng giáo lý liên tiếp, vắng lễ CN liên tiếp, tỷ lệ thấp, lệch Lễ/Giáo lý | View | `M5:199-207` | Không (D-58, WF-06 điểm 1–4) |
| BR-M05-41 | Ngưỡng cảnh báo cấu hình theo năm học, không hardcode | Cột `academic_years` | `M5:18-24` | Không (D-58) |
| BR-M05-42 | Trọng số cấu hình theo năm; mỗi năm học **luôn** có đúng một dòng | Bảng + trigger auto-seed + backfill | `M5:35-52,60-80` | Không. pgTAP `012:70-78` |
| BR-M05-43 | Điểm chuyên cần tách **hai điểm riêng** Thánh lễ / Giáo lý, thang 10 | View | `M5:175-177` | Không (D-59) |
| BR-M05-44 | Điểm hệ thống đề xuất **không ghi đè** điểm GLV đã sửa tay | RPC `on conflict … do update` có nhánh `is_manual_override` | `20260722000500:135-140` | Không (D-39) |
| BR-M05-45 | Em chưa có buổi chốt nào → điểm để **trống**, không thành 0 | `summary` null ⇒ `proposed` null | `20260722000500:114-124` | Không — khớp `CLAUDE.md` §6 |
| BR-M05-46 | Thống kê chuyên cần không dựa vào giờ client | Toàn bộ tính trong Postgres | `M5:98-255` | Không |

## 5. Tóm tắt mâu thuẫn với tài liệu

| # | Mâu thuẫn | Nguồn docs | Code | Đề xuất |
|---|---|---|---|---|
| 1 | Cha sở / Cha phó / Thủ quỹ có quyền xem điểm danh nhưng bị chặn khỏi `/attendance`; menu vẫn hiện link chết | `docs/05-permission-matrix.md:39` | `route-map.ts:9-11,29`, `navigation.ts:45` | TB-10 (cần user chốt) |
| 2 | "Staff lớp thấy đơn trước khi điểm danh" chưa có màn hình | `docs/03-workflow.md:236` | — | TB-06 |
| 3 | WF-05 vẽ `Locked` là state DB; code chỉ suy ra từ `locked_at`, enum `'locked'` chết | `docs/03-workflow.md:115-124` | `M3:26-31` | TB-02 + cập nhật `docs/03` |
| 4 | Confirm trước finalize với bảng phân bố | `docs/06-ui-ux-spec.md:322-331` | `attendance-editor.tsx:357-359` | TB-03 |
| 5 | Quick filter roster (vắng / có đơn / cảnh báo / search) | `docs/06-ui-ux-spec.md:311-317` | — | TB-09 |
| 6 | "Auto-save status / last saved" ở header | `docs/06-ui-ux-spec.md:287` | — | TB-05 |
| 7 | Mobile dùng "hai segmented control lớn"; code dùng `<select>` | `docs/06-ui-ux-spec.md:305-307` | `attendance-editor.tsx:220,242` | Xem `06_UI_UX_RECOMMENDATIONS.md` |
