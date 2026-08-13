# M07-ASSESSMENTS — 05. Quy tắc nghiệp vụ

`M400` = `supabase/migrations/20260722000400_assessments_gradebooks.sql`,
`M500` = `..._000500_attendance_scores_comments.sql`, `M600` = `..._000600_leaderboards.sql`,
`editor` = `src/features/assessments/components/gradebook-editor.tsx`,
`actions`/`queries`/`permissions` = `src/features/assessments/server/*.ts`.

## 1. Cấu trúc cột điểm

| Mã | Phát biểu | UI | Zod | Action | CK | TG | RLS | Bằng chứng | Mâu thuẫn docs? |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|---|
| BR-M07-01 | **Không có** cột điểm bắt buộc; lớp có thể có 0 cột | ✓ | – | – | – | – | – | `editor:526` ("Đây là trạng thái hợp lệ"); comment `M400:588` | Không (WF-08, docs/06 §12) |
| BR-M07-02 | Được tạo **nhiều cột cùng loại** | ✓ | ✓ | – | – | – | – | Không có unique `(class_id, kind)`; unit test `tests/unit/assessment-schemas.test.ts` | Không (docs/02 §9.2) |
| BR-M07-03 | Hệ số từng cột là số **dương ≤ 100** | ✓ | ✓ | – | ✓ | – | – | `editor:116`; `schemas.ts:13`; `M400:166` | Không |
| BR-M07-04 | Hệ số mặc định theo năm học: 15′=1, giữa kỳ=2, cuối kỳ=3, chuyên cần=1, phát sinh=1 | ✗ (hardcode client) | – | – | – | ✓ (seed) | – | Seed `M400:43-47`, `:57-70`; UI hardcode `editor:46-52` | ⚠ **Có** — `docs/11 §8` nói "Super Admin manages academic-year defaults separately", nhưng UI không đọc `assessment_type_settings` |
| BR-M07-05 | `max_score` luôn = 10 | – | ✓ (`max(10)`) | ✓ | ✓ | – | – | `actions.ts:82`; `schemas.ts:38`; `M400:165` | Không (WF-08 §4) |
| BR-M07-06 | Cột `attendance` **bắt buộc** chọn `mass` hoặc `catechism`; loại khác **cấm** | ✓ | ✓ | ✓ | ✓ | – | – | `editor:118-126`; `schemas.ts:15-29`; `actions.ts:84`; `M400:174` | Không |
| BR-M07-07 | `assessment_date` (nếu có) phải nằm trong năm học của lớp | ✓ | ✓ | – | – | ✓ | – | `editor:112`; `schemas.ts:12`; trigger `M400:214-217` | Không |
| BR-M07-08 | `academic_year_id` của cột **luôn khớp lớp** | – | – | ✓ | – | ✓ | – | `actions.ts:95-104`; trigger `M400:199-213` | Không |
| BR-M07-09 | Chỉ `can_grade_class` được tạo/sửa/xóa cột, và chỉ khi **chưa khóa** | ✓ | – | ✓ | – | ✓ | ✓ | `editor:516`; `permissions.ts:63`; trigger `M400:218`; policy `:534,542,550` | Không |
| BR-M07-10 | Cột đã có dòng điểm **không xóa được** | ✓ (thông báo) | – | ✓ | ✓ (FK restrict) | – | – | `editor:169`; `actions.ts:147-149`; FK `M400:261` | ⚠ **Có** — WF-08 nói "Thêm, **xóa** hoặc đổi hệ số… phải cập nhật ngay"; thực tế xóa bị chặn ngay cả khi mọi điểm là `null` (xem `03_AUDIT_RESULTS.md` §F04) |

## 2. Điểm số

| Mã | Phát biểu | UI | Zod | Action | CK | TG | RLS | Bằng chứng | Mâu thuẫn? |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|---|
| BR-M07-11 | Ô trống lưu là `null`, **không** thành 0 | ✓ | ✓ | – | ✓ | – | – | `scoreFrom` `editor:54-57`; `schemas.ts:38` (`nullable`); RPC `M400:394-397`; hiển thị `?? ""` `editor:265`; test `016_*`, unit test | Không (CLAUDE §6) |
| BR-M07-12 | Điểm **0 là giá trị hợp lệ**, khác `null` | ✓ | ✓ | – | ✓ | ✓ | – | `editor:265` dùng `??` chứ không `\|\|`; `M400:266`; RPC `:398-401`; unit test | Không |
| BR-M07-13 | `0 ≤ score ≤ max_score (10)` | ✓ | ✓ | – | ✓ | ✓ | – | `editor:265` (`min/max`); `schemas.ts:38`; `M400:266`, `:311`, `:398` | Không |
| BR-M07-14 | Điểm chỉ thuộc enrollment **cùng lớp và cùng năm** với cột | – | – | – | – | ✓ | – | trigger `M400:304-307`; RPC `:388-392` | Không |
| BR-M07-15 | Mọi ghi điểm đi qua RPC transaction; `authenticated` **không có** DML trực tiếp trên `assessment_scores` | – | – | ✓ | – | – | ✓ | grant `M400:488` (chỉ `select`); RPC `:347` | Không (docs/11 §8) |
| BR-M07-16 | Trung bình có trọng số = Σ(score×weight)/Σ(weight) **chỉ trên ô đã nhập**, cột `is_active` | – | – | – | – | – | ✓ (view `security_invoker`) | `M400:565-581`; UI `editor:542-545` | Không |
| BR-M07-17 | Đổi hệ số / thêm cột cập nhật trung bình **ngay** | ✓ | – | – | – | – | – | View tính lúc đọc + `revalidateGradebook` (`actions.ts:50`) | Không |

## 3. Điểm chuyên cần đề xuất

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-18 | Đề xuất lấy từ `v_student_attendance_summary` theo thành phần (`mass`/`catechism`) cho enrollment `active`/`paused` | RPC `M500:108-123` | Không |
| BR-M07-19 | Refresh **giữ nguyên** ô đã chỉnh tay, chỉ cập nhật `system_suggested_score` | `M500:135-140` | Không (D-39/D-59) |
| BR-M07-20 | Ô chuyên cần được đánh dấu `is_manual_override` khi GLV lưu điểm | `M400:410`, `:416-419` | ⚠ **Có vấn đề** — hiện đánh dấu **mọi** dòng được gửi, kể cả ô không thay đổi và ô đúng bằng đề xuất ⇒ vô hiệu hóa BR-M07-19 sau lần lưu đầu tiên |
| BR-M07-21 | Có thể trả một ô về đúng đề xuất hệ thống | RPC `M500:172-177`; UI `editor:269` | Không |

## 4. Nhận xét

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-22 | Hai mức hiển thị: `student_visible` (ra portal) và `staff_only` (nội bộ) | enum `20260715000100:24`; `M500:9` | Không |
| BR-M07-23 | Guardian/student **chỉ** đọc `student_visible` của con/mình; **không suy ra được** số lượng hay nội dung `staff_only` | RLS `M500:193-202`; portal lọc tường minh `queries.ts:143`; test `017_*` ("phụ huynh không suy ra dòng staff-only") | Không (docs/05 §Comments) |
| BR-M07-24 | Tác giả nhận xét = người đăng nhập, không tin client | trigger `M500:49-53`; policy `:203-210` | Không |
| BR-M07-25 | Nhận xét bị chặn tạo/sửa/xóa khi bảng điểm đã khóa | trigger `M500:40`, `:63`; policy `:203-221` | Không |
| BR-M07-26 | Mặc định UI là **công khai** | `editor:345` (`defaultValue="student_visible"`) | ⚠ Không mâu thuẫn văn bản nhưng **rủi ro** — mặc định nên an toàn (xem TB-M07-05) |
| BR-M07-27 | Ai có quyền nhận xét trong lớp đều xóa được nhận xét của người khác | `actions.ts:268`; policy `M500:219` | Không mâu thuẫn docs (docs/05 không nêu), nhưng cần xác nhận |

## 5. Khóa bảng điểm

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-28 | Khóa chặn: thêm/sửa/xóa cột, đổi hệ số, nhập điểm, refresh/reset chuyên cần, tạo/sửa/xóa nhận xét | `M400:218,241,308,373,534,542,550`; `M500:40,63,104,169,203,211,219` | Không (CLAUDE §6) |
| BR-M07-29 | Khóa **cũng** chặn bật/tắt công bố cột điểm | Hệ quả của `M400:218` + `:542` | ⚠ **Có** — WF-08 không nói công bố phải trước khi khóa; `gradebook_locks.results_published_at/by` (`M400:80`) được `docs/02 §9.6` mô tả là "mốc công bố tổng thể" nhưng **chưa dùng** |
| BR-M07-30 | Khóa **không** chặn tạo/publish Top 5 (có chủ đích) | Không có kiểm khóa ở `M600`; `final_average` còn **yêu cầu** đã khóa (`M600:200-203`) | Không (WF-09 "Không cần chờ final average") |
| BR-M07-31 | Người được khóa: đại diện lớp **hoặc** nhóm global-write | RPC `M400:438`; UI `queries.ts:384` | ⚠ **Có** — `docs/02 §9.6` và `docs/05 §5` ghi "Chỉ class representative khóa" |
| BR-M07-32 | Chỉ **Super Admin** mở khóa; ghi `unlocked_at/unlocked_by` | RPC `M400:467-475`; app `actions.ts:296`; test `016_*` | Không |
| BR-M07-33 | Trạng thái khóa hiển thị rõ trên hub và trang lớp | `page.tsx:27`; `editor:503` | Không (docs/06 §12 "Lock state rõ") |

## 6. Top 5

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-34 | Top 5 chỉ hoạt động khi `academic_years.top5_enabled` bật | trigger `M600:57-62`; RPC publish `:276-281`; UI `editor:467` | Không (docs/05 §7) |
| BR-M07-35 | Người quản lý Top 5 = đại diện lớp hoặc global-write | `app.can_manage_leaderboard` `M600:33`; app `permissions.ts:123` | Không |
| BR-M07-36 | `top_n` cố định = 5; snapshot ≤ 5 dòng, rank 1..5 | `M600:10`, `:91` | Không (WF-09 §5) |
| BR-M07-37 | 4 nguồn: cột điểm, TB tạm, TB tổng kết (yêu cầu đã khóa), thi đua tùy chỉnh | `M600:184-248` | Không |
| BR-M07-38 | Snapshot lưu **tên tại thời điểm publish**; portal không join bảng `students` | trigger `M600:123-127`; comment `:366`; portal đọc `saint_name_snapshot` (`queries.ts:181`) | Không |
| BR-M07-39 | `authenticated` **không** ghi được `leaderboard_entries` | grant `M600:311` | Không |
| BR-M07-40 | Khi đã publish, không đổi được tiêu đề/nguồn/lớp | trigger `M600:69-76` | Không |
| BR-M07-41 | Không publish lại khi đang publish | RPC `M600:273` | Không |
| BR-M07-42 | Được unpublish (ẩn khỏi portal) | `actions.ts:394`; policy `M600:340`; test `018_*` | Không (WF-09 §8) |
| BR-M07-43 | **Sau unpublish, publish lại sẽ tính lại snapshot mới** | RPC `M600:283-292`, `:300` | ⚠ **Có** — `docs/11 §9` "do not recompute silently afterward" |
| BR-M07-44 | Hòa điểm vẫn ra thứ hạng khác nhau (tie-break `full_name`, `enrollment.id`) | `M600:191`, `:210`, `:241` | Không nêu trong docs — **cần xác nhận** |
| BR-M07-45 | Phụ huynh/thiếu nhi cùng lớp thấy đủ 5 tên | policy `M600:348-361`; test `018_*` | Không (docs/05 §4 "ngoại trừ published Top 5") |

## 7. Portal kết quả

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-46 | Guardian thấy con mình; student thấy chính mình | `getOwnedStudentIds` `queries.ts:93-106`; RLS `app.is_guardian_of_student`/`is_self_student` (`20260716000100:112`, `:128`) | Không |
| BR-M07-47 | Chỉ hiện cột `is_published` **và** dòng điểm `assessment_published` | `queries.ts:129-139`; RLS `M400:519`, `:554`; cờ đồng bộ qua trigger `:327` | Không |
| BR-M07-48 | Chỉ hiện Top 5 `is_published` của lớp con/em | `queries.ts:145-149`; RLS `M600:319`, `:348` | Không |
| BR-M07-49 | Account vừa là staff vừa là phụ huynh vẫn thấy phần "Kết quả của con" | `queries.ts:240` (tính portal trước khi rẽ nhánh role); `page.tsx:20` | Không (D-25, docs/11 §10) |
| BR-M07-50 | Trung bình trên portal tính **chỉ trên cột đã công bố** | `queries.ts:192-216` | ⚠ Khác `v_student_weighted_average` dùng cho bảng điểm nội bộ; docs không quy định — **cần xác nhận** |

## 8. Export

| Mã | Phát biểu | Bằng chứng | Mâu thuẫn? |
|---|---|---|---|
| BR-M07-51 | Export dùng đúng phạm vi/bộ lọc của bảng điểm đang xem (cùng lớp, cột `is_active`, roster `active`/`paused`) | `export/route.ts:14`, `:49` dùng `getGradebookDetail`; E2E kiểm `rowCount = 9` | Không (docs/06 §12 "Export giữ filter") |
| BR-M07-52 | Guardian/student **không** export được | `getVisibleResultClassIds` trả tập rỗng → `getGradebookDetail` trả `null` → 404 (`queries.ts:293-294`; `export/route.ts:15`) | Không |
| BR-M07-53 | Export **không** chứa nhận xét ⇒ không rò `staff_only` | `export-data.ts:11-24` | Không |
| BR-M07-54 | Ô văn bản do người dùng nhập phải chống Excel formula injection (`= + - @`) | `safeSpreadsheetText` `src/lib/exports/spreadsheet.ts:5`; áp dụng ở `export-data.ts:19-20` | ⚠ **Có** — **header cột điểm không được bọc** (`export-data.ts:15`), trái `AGENTS §5` / `CLAUDE.md §6` |
| BR-M07-55 | Tên file tải về chỉ ASCII | `export/route.ts:9` | Không |

## 9. Tổng hợp mâu thuẫn cần xử lý

| # | BR | Mâu thuẫn với | Mức |
|---|---|---|---|
| 1 | BR-M07-54 | `AGENTS §5`, `CLAUDE.md §6` | **Cao** |
| 2 | BR-M07-10 | WF-08 ("xóa assessment phải cập nhật ngay") | **Cao** |
| 3 | BR-M07-43 | `docs/11 §9` ("do not recompute silently afterward") | **Cao** |
| 4 | BR-M07-29 | WF-08 (thứ tự khóa/công bố), `docs/02 §9.6` (`results_published_at` chưa dùng) | Trung bình |
| 5 | BR-M07-20 | D-39/D-59 (giữ override) — bị vô hiệu do đánh dấu hàng loạt | Trung bình |
| 6 | BR-M07-31 | `docs/02 §9.6`, `docs/05 §5` ("Chỉ class representative khóa") | Trung bình |
| 7 | BR-M07-04 | `docs/11 §8` (SA quản lý mặc định theo năm học) | Thấp |
| 8 | BR-M07-50, BR-M07-44, BR-M07-27 | Không có quy định — **cần xác nhận nghiệp vụ** | Thấp |
