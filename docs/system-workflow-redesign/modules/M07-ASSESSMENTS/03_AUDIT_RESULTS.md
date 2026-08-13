# M07-ASSESSMENTS — 03. Kết quả audit

Bộ 15 tiêu chí giống M06: C01 đúng nghiệp vụ · C02 dễ hiểu · C03 số bước hợp lý · C04 không nhập trùng ·
C05 khó thao tác nhầm · C06 validation đầy đủ · C07 trạng thái rõ ràng · C08 phân quyền an toàn ·
C09 dữ liệu nhất quán · C10 dễ bảo trì · C11 dễ mở rộng · C12 UI đúng nghiệp vụ · C13 responsive ·
C14 accessibility · C15 khả năng kiểm thử.

## 1. Bảng điểm theo luồng

| Luồng | C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| F01 Hub kết quả | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 3 | 4 | 4 | 5 | 4 | 4 | **66** | PASS |
| F02 Tạo cột điểm | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 3 | 4 | 4 | 4 | 4 | 5 | **62** | PASS_WITH_MINOR_UI_FIX |
| F03 Sửa cột / hệ số | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 5 | **64** | PASS_WITH_MINOR_UI_FIX |
| F04 Xóa cột điểm | **2** | 3 | 4 | 5 | 3 | 4 | 3 | 5 | **2** | 3 | 3 | 3 | 4 | 4 | **2** | **50** | **NEEDS_IMPROVEMENT** |
| F05 Công bố / ẩn cột | **3** | 3 | 4 | 5 | 3 | 4 | **3** | 5 | 4 | 4 | 3 | 3 | 4 | 4 | **3** | **55** | **NEEDS_IMPROVEMENT** |
| F06 Nhập điểm | 4 | 4 | 3 | 5 | **2** | 5 | **3** | 5 | **2** | 4 | 4 | 4 | 4 | 5 | **3** | **57** | **NEEDS_IMPROVEMENT** |
| F07 Đề xuất chuyên cần | 4 | 4 | 5 | 5 | 3 | 5 | 4 | 5 | **3** | 4 | 4 | 4 | 4 | 4 | 4 | **62** | PASS_WITH_MINOR_UI_FIX |
| F08 Trả về đề xuất | 5 | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | **67** | PASS |
| F09 Thêm nhận xét | 5 | 4 | 4 | 5 | **2** | 5 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | **60** | PASS_WITH_MINOR_UI_FIX |
| F10 Xóa nhận xét | 4 | 4 | 5 | 5 | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **61** | PASS_WITH_MINOR_UI_FIX |
| F11 Khóa bảng điểm | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | **67** | PASS_WITH_MINOR_UI_FIX |
| F12 Mở khóa | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 5 | **71** | PASS |
| F13 Tạo Top 5 | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | **3** | 4 | 4 | 4 | **61** | PASS_WITH_MINOR_UI_FIX |
| F14 Preview Top 5 | 4 | 3 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **62** | PASS_WITH_MINOR_UI_FIX |
| F15 Publish Top 5 | 5 | 4 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | **68** | PASS |
| F16 Unpublish Top 5 | **3** | 3 | 5 | 5 | **2** | 4 | **3** | 5 | **2** | 4 | 3 | 3 | 4 | 4 | **2** | **52** | **NEEDS_IMPROVEMENT** |
| F17 Portal kết quả | 4 | **3** | 5 | 5 | 5 | 4 | 4 | 5 | **3** | 4 | 4 | 4 | 5 | 4 | 5 | **64** | PASS_WITH_MINOR_UI_FIX |
| F18 Export | 4 | 4 | 5 | 5 | 4 | **2** | 4 | 5 | 4 | **3** | 4 | 4 | 4 | 4 | **3** | **55** | **NEEDS_IMPROVEMENT** |

**Trạng thái module: `NEEDS_IMPROVEMENT`** — 5/18 luồng dưới chuẩn; **không có `CRITICAL`**
(toàn bộ kiểm tra phân quyền/rò rỉ dữ liệu đều đạt và có test xanh).

## 2. Lý do trừ điểm

### F04 — Không xóa được cột điểm (C01 = 2, C09 = 2, C15 = 2)

`assessment_scores.assessment_id ... on delete restrict` (`M400:261`) + UI luôn gửi **cả roster** kể cả ô trống
(`gradebook-editor.tsx:212-216`) + RPC upsert **mọi** phần tử (`M400:403`).
⇒ Sau lần bấm "Lưu điểm" đầu tiên, cột đó không bao giờ xóa được, kể cả khi tất cả điểm là `null`.
Trái với WF-08 ("Thêm, **xóa** hoặc đổi hệ số một assessment phải cập nhật ngay cấu trúc cột và điểm trung bình").
Cột `assessments.is_active` (`M400:169`) được thiết kế cho ẩn mềm nhưng **không action nào ghi `false`**.

### F05 — Khóa bảng điểm chặn luôn việc công bố (C01 = 3, C07 = 3)

`assessments_update_grader` (`M400:542`) và trigger `validate_assessment` (`:218`) chặn **mọi** UPDATE khi khóa,
kể cả `is_published`. WF-08 kết thúc bằng bước "khóa bảng điểm" nên trình tự tự nhiên (khóa → công bố cho phụ huynh)
bị chặn; phải nhờ Super Admin mở khóa. Cột `gradebook_locks.results_published_at/by` (`M400:80-81`,
`docs/02 §9.6` "mốc công bố tổng thể") **chưa được dùng ở bất kỳ đâu**.

### F06 — Ghi đè đồng thời + đánh dấu override hàng loạt (C05 = 2, C09 = 2)

1. `save_assessment_scores` khóa hàng cột điểm bằng `for update` (`M400:366`) nhưng **không** so phiên bản dữ liệu;
   người lưu sau ghi đè bằng snapshot cũ, biến điểm người trước thành `null` mà không cảnh báo.
2. Với `kind='attendance'`, RPC set `is_manual_override = true` cho **mọi** dòng nhận được (`M400:410`, `:416-419`).
   Vì UI gửi cả roster, một lần "Lưu điểm" khóa toàn bộ lớp khỏi cơ chế đề xuất tự động (`M500:137-140`) —
   trái tinh thần D-39/D-59 ("chỉ cập nhật dòng chưa override").

### F07 — Bị vô hiệu bởi F06 (C09 = 3)

RPC `refresh_attendance_assessment_scores` đúng thiết kế, nhưng thực tế thường không cập nhật gì vì mọi dòng đã bị
đánh cờ override ở F06. Không có chỉ báo "N dòng bị bỏ qua do đang chỉnh tay".

### F09 — Mặc định nhận xét là công khai (C05 = 2)

`<select name="visibility" defaultValue="student_visible">` (`gradebook-editor.tsx:345`). Hành vi rủi ro cao
(đẩy nội dung ra portal) là mặc định; hành vi an toàn (`staff_only`) phải chọn thủ công. Không có xác nhận,
không có chức năng sửa nhận xét — sai thì phải xóa và viết lại, mất dấu vết.

### F10 — Ai cũng xóa được nhận xét của người khác (C08 = 4)

`deleteStudentComment` chỉ kiểm `canCommentClass` (`actions.ts:268`), policy cũng chỉ kiểm
`app.can_comment_class` (`M500:219`). Không giới hạn theo `author_profile_id`, không lưu vết ai xóa.
Đúng với `docs/05` (không nêu ràng buộc tác giả) nhưng là rủi ro vận hành.

### F13 — Không xóa được bản nháp Top 5 (C12 = 3)

Policy `leaderboards_delete_manager` tồn tại (`M600:344`) nhưng **không có server action** tương ứng và
UI không có nút. Bản nháp tạo nhầm tồn tại vĩnh viễn.

### F14 — Quy tắc xếp hạng không hiển thị (C02 = 3)

`row_number()` (`M600:191`, `:210`, `:241`) ⇒ hòa điểm vẫn ra hạng khác nhau, tie-break bằng `full_name` rồi
`enrollment.id`. UI không giải thích, GLV dễ bị phụ huynh chất vấn. Nguồn `assessment` cũng không lọc
`enrollments.status`, nên em đã rút vẫn có thể lọt Top 5.

### F16 — Snapshot mất tính bất biến qua vòng unpublish → publish (C01 = 3, C05 = 2, C09 = 2)

`unpublishLeaderboard` chỉ `UPDATE is_published=false` (`actions.ts:398`); `validate_leaderboard` **không** chặn
việc bật/tắt cờ (`M600:69-76` chỉ chặn đổi title/source). Sau đó `publish_leaderboard` chạy lại được, và nó
`DELETE` toàn bộ entries rồi tính lại (`M600:283-292`), ghi đè `published_at` (`:300`).
⇒ Cùng một `leaderboard.id`/tiêu đề có thể mang hai bảng xếp hạng khác nhau ở hai thời điểm mà không có lịch sử.
Ngoài ra, entries còn lại (published=false) khiến FK `on delete restrict` (`M600:87`) chặn luôn việc xóa bảng đó.

### F17 — Hai con số "Trung bình" khác nhau (C02 = 3, C09 = 3)

Portal: tính trong TypeScript chỉ trên cột **đã công bố** (`queries.ts:192-216`).
Bảng điểm nội bộ: `v_student_weighted_average` trên **mọi** cột `is_active` (`M400:565-581`).
Không có chú thích nào ở portal ("trung bình trên các cột đã công bố"), dễ gây khiếu nại.

### F18 — Header export chưa chống formula injection (C06 = 2, C10 = 3, C15 = 3)

`export-data.ts:15` ghép `${item.title} (HS ${item.weight})` **không** qua `safeSpreadsheetText`, trong khi
`saintName`/`fullName` thì có (`:19-20`). Tiêu đề cột do GLV tự đặt, hoàn toàn có thể bắt đầu bằng `=`/`+`/`-`/`@`.
Rủi ro thực tế với XLSX thấp (ExcelJS ghi ô chuỗi, Excel không tự diễn giải), nhưng:
(a) đây là **kiểm soát bắt buộc** theo `AGENTS §5` và `CLAUDE.md §6`, đang bị áp dụng nửa vời;
(b) người dùng thường "Save as CSV" từ file này, lúc đó khai thác được;
(c) unit test hiện chỉ đếm số phần tử header (`tests/unit/gradebook-export.test.ts`), không kiểm nội dung.
Ngoài ra `asciiFilename`/`excelResponse`/`pdfResponse` bị viết lại trong `export/route.ts:9,13,48` thay vì dùng
`src/lib/exports/http.ts` — trùng lặp logic, dễ lệch nhau khi sửa.

### Trừ điểm chung nhiều luồng

| Vấn đề | Ảnh hưởng |
|---|---|
| `ZodError` bị nuốt thành "Không thể lưu bảng điểm. Vui lòng thử lại." (`actions.ts:36-39`) | F02, F03, F06, F09, F13, F15 (C02/C06) |
| `DEFAULT_WEIGHTS` hardcode ở client (`gradebook-editor.tsx:46-52`) thay vì đọc `assessment_type_settings` | F02 (C09/C10) — SA đổi mặc định năm học không ảnh hưởng gợi ý UI |
| `lockGradebook` không kiểm quyền ở tầng app (`actions.ts:278-283`) | F11 (C08) — lệch chuẩn `docs/11` và lệch với `unlockGradebook` ngay bên cạnh |
| `canLock` cho cả `secretary`/`group_leader`/`deputy` (`queries.ts:384`), DB cũng cho `can_global_write` | F11 — lệch `docs/02 §9.6` "Chỉ class representative khóa" |
| `canGradeClass` ở app **bắt buộc** có `class_staff_assignments` (`permissions.ts:82`), DB `is_class_staff` chấp nhận cả phạm vi `role_assignments` | F02/F06 (C09) — app chặt hơn DB; GLV có role scope nhưng chưa được phân công sẽ bị `FORBIDDEN` dù `docs/05` cho phép |
| `getResultsPageData` gọi `canGradeClass` cho từng lớp (`queries.ts:267`) | F01 (C10) — ~3N truy vấn |

## 3. Phân tích 5 Whys

### 5 Whys — F04: cột điểm không xóa được

1. **Vì sao GLV không xóa được cột vừa tạo nhầm?** Vì Postgres trả `23503` do `assessment_scores` còn tham chiếu.
2. **Vì sao có dòng `assessment_scores` khi chưa nhập điểm nào?** Vì `ScoreColumnForm` gửi toàn bộ roster,
   kể cả ô trống, và RPC upsert từng phần tử.
3. **Vì sao gửi cả roster?** Vì UI thiết kế "lưu cả cột một lần" cho thao tác nhanh trên máy tính bảng,
   không theo dõi ô nào thực sự bị sửa (form không kiểm soát, chỉ đọc `FormData` lúc submit).
4. **Vì sao không lọc ô rỗng trước khi gửi?** Vì `null` là **giá trị hợp lệ có ý nghĩa** ("xóa điểm"),
   không phân biệt được với "ô chưa từng đụng đến".
5. **Vì sao không có đường xóa mềm thay thế?** Vì `is_active` được thêm vào schema nhưng chưa gắn với luồng nào
   (`M400:169`), và `docs/11 §8` không liệt kê action `archiveAssessment`.

→ **Nguyên nhân gốc**: thiếu phân biệt "ô chưa đụng / ô cố ý xóa" ở tầng UI, cộng với thiếu đường xóa mềm ở nghiệp vụ.

### 5 Whys — F06: ghi đè đồng thời

1. **Vì sao điểm GLV A biến mất?** Vì GLV B lưu cả cột bằng snapshot mở từ trước.
2. **Vì sao B ghi đè được?** Vì RPC upsert theo `(assessment_id, enrollment_id)` không so `updated_at`.
3. **Vì sao không so?** Vì `for update` trên hàng `assessments` được coi là đủ để "chạy transaction an toàn"
   (`docs/11 §8`: "should accept batch and run transaction/RPC").
4. **Vì sao "transaction" bị hiểu là đủ?** Vì yêu cầu chỉ nói tới **tính nguyên tử**, không nói tới **tranh chấp ghi**.
5. **Vì sao module điểm danh có claim/lease mà bảng điểm không có?** Vì WF-05 mô tả tường minh cơ chế
   claim/lease/takeover, còn WF-08 không mô tả gì về đồng thời — coi như mỗi lớp chỉ một người nhập.

→ **Nguyên nhân gốc**: giả định "một người nhập điểm mỗi lớp" không được nêu thành BR và không đúng thực tế
(GLV lớp + đại diện + global-write đều ghi được).

### 5 Whys — F16: snapshot Top 5 bị tính lại

1. **Vì sao snapshot đã công bố có thể đổi?** Vì unpublish rồi publish lại sẽ `DELETE` + tính lại entries.
2. **Vì sao publish lại được?** Vì chốt chặn duy nhất là `if selected_leaderboard.is_published then raise` (`M600:273`),
   mà unpublish đã đặt cờ về `false`.
3. **Vì sao unpublish không để lại dấu?** Vì `unpublishLeaderboard` chỉ đổi 1 cột, không ghi `unpublished_at`
   và không có bảng lịch sử.
4. **Vì sao thiết kế cho phép unpublish?** Vì WF-09 §8 yêu cầu "Có thể unpublish bởi representative/Super Admin".
5. **Vì sao unpublish lại được hiểu là "trở về nháp"?** Vì `docs/11 §9` chỉ nói "do not recompute silently
   afterward" mà không định nghĩa trạng thái sau unpublish (ẩn tạm hay hủy hẳn).

→ **Nguyên nhân gốc**: trạng thái sau `unpublish` chưa được định nghĩa trong nghiệp vụ (ẩn tạm ≠ hủy bỏ).

### 5 Whys — F18: header export không được làm sạch

1. **Vì sao header thoát khỏi bộ lọc?** Vì `buildGradebookExportData` chỉ gọi `safeSpreadsheetText` cho 2 ô tên.
2. **Vì sao chỉ 2 ô?** Vì lúc viết, "dữ liệu do người dùng nhập" được hiểu là tên thiếu nhi.
3. **Vì sao tiêu đề cột không bị coi là dữ liệu người dùng?** Vì nó đến từ GLV chứ không từ import — bị coi là "nội bộ, tin được".
4. **Vì sao giả định "tin được" là sai?** Vì tệp xuất ra được gửi cho ngành/xứ đoàn và có thể được lưu lại dạng CSV.
5. **Vì sao test không bắt được?** Vì `tests/unit/gradebook-export.test.ts` kiểm `safeSpreadsheetText` **tách rời**
   và chỉ đếm `headers).toHaveLength(5)`, không có case tiêu đề độc hại.

→ **Nguyên nhân gốc**: định nghĩa "dữ liệu không tin cậy" chưa bao gồm nội dung do staff nhập; test viết theo
hàm chứ không theo bề mặt tấn công.

### 5 Whys — F05: không công bố được sau khi khóa

1. **Vì sao không bấm "Công bố" được sau khóa?** Vì UPDATE trên `assessments` bị chặn.
2. **Vì sao chặn cả `is_published`?** Vì lệnh chặn đặt ở mức **bảng** (policy + trigger), không phân biệt cột.
3. **Vì sao đặt ở mức bảng?** Vì yêu cầu là "lock chặn mọi thay đổi" (CLAUDE.md §6) — cách an toàn nhất.
4. **Vì sao vẫn cần đổi `is_published` sau khóa?** Vì WF-08 xếp "khóa" ở bước 8, còn công bố cho phụ huynh
   là hành động độc lập không được nêu thứ tự.
5. **Vì sao không có mốc công bố riêng?** Vì `gradebook_locks.results_published_at/by` đã được thiết kế
   (`docs/02 §9.6`) nhưng chưa triển khai.

→ **Nguyên nhân gốc**: thiếu tách bạch giữa **khóa cấu trúc/điểm** và **công bố kết quả**; mốc công bố tổng thể
đã có chỗ trong schema nhưng chưa có luồng.
