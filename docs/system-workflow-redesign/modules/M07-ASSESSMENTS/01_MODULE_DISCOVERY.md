# M07-ASSESSMENTS — 01. Khảo sát module

## 1. Mục tiêu nghiệp vụ

Quản lý **bài kiểm tra, bảng điểm, nhận xét, Top 5 và cổng xem kết quả** (WF-08, WF-09):

- Số lượng và loại cột điểm **do lớp tự quyết**; không có bộ cột bắt buộc, được lặp cùng loại
  (`comment on table public.assessments` — `20260722000400_assessments_gradebooks.sql:588`).
- Hệ số dương từng cột, sửa được **trước khi khóa**; mặc định seed 1/2/3/1/1 theo năm học
  (`assessment_type_settings` — `:16`, seed `:33`).
- Ô trống là `null` (**không** thành 0); điểm 0 vẫn hợp lệ; thang tối đa 10.
- Điểm chuyên cần do hệ thống đề xuất từ điểm danh đã chốt, GLV sửa tay được và có thể trả về đề xuất.
- Nhận xét hai mức: `student_visible` (ra portal) và `staff_only` (nội bộ).
- Khóa bảng điểm chặn **mọi** thay đổi; chỉ Super Admin mở lại.
- Top 5 snapshot tên/điểm/hạng khi publish, hiển thị cho phụ huynh/thiếu nhi cùng lớp.
- Export Excel/PDF bảng điểm theo lớp.

## 2. Actor và quyền

| Actor | Quyền | Nơi enforce |
|---|---|---|
| `super_admin` | Tất cả + **mở khóa** bảng điểm | `unlock_gradebook` yêu cầu `app.is_super_admin()` (`:467`); app `actions.ts:296` |
| `group_leader`, `deputy_group_leader`, `secretary` | `can_global_write` → tạo/sửa/xóa cột, nhập điểm, nhận xét, khóa, Top 5 mọi lớp | `app.can_grade_class` / `can_comment_class` / `can_manage_leaderboard` (`:108`, `:133`, `20260722000600:33`) |
| `parish_priest`, `chaplain` | `can_global_read` → xem điểm, xem cả nhận xét `staff_only` | `assessments_select_scope` (`:519`) |
| `treasurer` | **Không** thuộc `can_global_read` → không thấy điểm chi tiết | `20260715000100:157` |
| `sector_leader`, `sector_deputy` | Xem toàn ngành; chỉ **nhập điểm** ở lớp có `class_staff_assignment` | `app.can_access_class` (sector) + `app.is_class_staff`; app `permissions.ts:32-45` |
| `class_representative` | Nhập điểm, nhận xét, **khóa**, tạo/publish Top 5 | `app.is_class_representative` trong `can_manage_leaderboard` (`20260722000600:40`) và `lock_gradebook` (`:438`) |
| `class_teacher` | Nhập điểm, nhận xét | `app.is_class_staff` |
| `trainee_assistant` | Chỉ khi cờ năm học `trainee_can_grade` / `trainee_can_comment` bật | `:118-127`, `:143-152`; app `permissions.ts:69-76`, `:99-106` |
| `guardian` | Xem điểm/nhận xét/Top 5 **đã publish** của con | `assessment_scores_select_scope` (`:554`), `student_comments_select_scope` (`20260722000500:193`), `leaderboards_select_scope` (`20260722000600:319`) |
| `student` | Như trên, cho chính mình | `app.is_self_student` (`20260716000100:128`) |

## 3. Route và màn hình

| Route | File | Ghi chú |
|---|---|---|
| `/results` | `src/app/(dashboard)/results/page.tsx:9` | Hub: staff thấy lưới lớp + (nếu có con) portal; guardian/student chỉ thấy portal |
| `/results/[classId]` | `src/app/(dashboard)/results/[classId]/page.tsx:8` | Bảng điểm đầy đủ; `notFound()` nếu ngoài phạm vi |
| `/results/[classId]/export?format=xlsx\|pdf` | `src/app/(dashboard)/results/[classId]/export/route.ts:84` | Route handler `runtime=nodejs`, `dynamic=force-dynamic` |

Route rule `{ path: "/results", public: false }` — không giới hạn role (`src/lib/permissions/route-map.ts:31`),
vì một GLV cũng có thể là phụ huynh (D-25).

## 4. Component

| Component | File | Vai trò |
|---|---|---|
| `GradebookEditor` | `src/features/assessments/components/gradebook-editor.tsx:475` | Vỏ; thanh khóa/export; điều phối các panel |
| `NewAssessmentForm` | `:59` | Thêm cột điểm |
| `AssessmentSettings` | `:137` | Sửa tên/ngày/hệ số, công bố/ẩn, xóa |
| `ScoreColumnForm` | `:201` | Bảng nhập điểm **cho từng cột** (một table/cột) |
| `StudentCommentsPanel` | `:288` | Nhận xét theo từng thiếu nhi |
| `NewLeaderboardForm` / `LeaderboardCard` / `LeaderboardPanel` | `:358` / `:400` / `:463` | Top 5 |
| `PublishedResultsPortal` | `components/published-results-portal.tsx:7` | Server component cho phụ huynh/thiếu nhi |

## 5. Server action / query / helper

| Hàm | File:line |
|---|---|
| `createAssessment` / `updateAssessment` / `deleteAssessment` | `server/actions.ts:89` / `:117` / `:142` |
| `saveAssessmentScores` | `:158` → RPC `save_assessment_scores` |
| `setAssessmentPublished` | `:178` |
| `refreshAttendanceScores` / `resetAttendanceScoreOverride` | `:194` / `:207` → RPC |
| `createStudentComment` / `deleteStudentComment` | `:223` / `:257` |
| `lockGradebook` / `unlockGradebook` | `:278` / `:292` → RPC |
| `createLeaderboard` / `previewLeaderboard` / `publishLeaderboard` / `unpublishLeaderboard` | `:320` / `:357` / `:378` / `:394` |
| `getResultsPageData` / `getGradebookDetail` / `getPublishedPortalResults` | `server/queries.ts:224` / `:283` / `:108` |
| `canGradeClass` / `canCommentClass` / `canManageLeaderboard` / `getVisibleResultClassIds` | `server/permissions.ts:63` / `:93` / `:123` / `:24` |
| `buildGradebookExportData` | `export-data.ts:11` |
| `safeSpreadsheetText` | `src/lib/exports/spreadsheet.ts:5` |
| `asciiFilename` / `excelResponse` / `pdfResponse` (dùng chung) | `src/lib/exports/http.ts:4` / `:13` / `:27` — **route export của M07 tự định nghĩa lại** (`export/route.ts:9`, `:13`, `:48`) |

## 6. Bảng và đối tượng DB

| Đối tượng | Migration:line |
|---|---|
| `academic_years.trainee_can_grade` / `trainee_can_comment` | `20260722000400:10-12` |
| `assessment_type_settings` + trigger seed theo năm | `:16`, `:33`, `:53` |
| `gradebook_locks` (+ `results_published_at/by`) | `:72` |
| `app.is_gradebook_locked` / `can_grade_class` / `can_comment_class` | `:94` / `:108` / `:133` |
| `assessments` + trigger `validate_assessment` + `block_locked_assessment_delete` | `:158`, `:187`, `:241` |
| `assessment_scores` + trigger `sync_assessment_score_keys` + `sync_assessment_publication` | `:259`, `:286`, `:327` |
| RPC `save_assessment_scores`, `lock_gradebook`, `unlock_gradebook` | `:347`, `:429`, `:460` |
| View `v_student_weighted_average` (`security_invoker`) | `:565` |
| `student_comments` + trigger sync/block-locked-delete | `20260722000500:3`, `:26`, `:63` |
| RPC `refresh_attendance_assessment_scores`, `reset_attendance_score_override` | `:81`, `:149` |
| `leaderboards`, `leaderboard_entries`, `app.can_manage_leaderboard`, `validate_leaderboard` | `20260722000600:3`, `:85`, `:33`, `:43` |
| RPC `preview_leaderboard`, `publish_leaderboard` | `:157`, `:252` |

**Ghi chú quyền bảng:** `authenticated` **không** có `INSERT/UPDATE/DELETE` trên `assessment_scores`
(`:488`) và `leaderboard_entries` (`20260722000600:311`) — mọi ghi đi qua RPC `security definer`.

## 7. Phụ thuộc

- **M05 Attendance**: view `v_student_attendance_summary` cung cấp `mass_attendance_score` /
  `catechism_attendance_score` cho `refresh_attendance_assessment_scores` (`20260722000500:115-123`).
- **M03**: `enrollments`, `students` (roster động, snapshot tên cho Top 5).
- **M02**: `academic_years` (cờ `top5_enabled`, `trainee_can_*`, biên ngày).
- **M04**: `class_staff_assignments` (điều kiện chấm điểm).
- **M08 Promotions**: dùng chung màn `/promotions`, không phụ thuộc trực tiếp.
- **M13 Portal**: portal kết quả nằm ngay trong `/results`.

## 8. Mức quan trọng

**Rất cao.** Đây là dữ liệu nhạy cảm nhất hướng ra phụ huynh/thiếu nhi và là nơi có yêu cầu bất biến
tường minh trong `CLAUDE.md §6`. Một lỗi khóa/công bố/rò nhận xét nội bộ ảnh hưởng trực tiếp uy tín.

## 9. Tình trạng test

| Test | Phạm vi | Đánh giá |
|---|---|---|
| `supabase/tests/016_assessments_gradebooks_test.sql` | Cột lặp loại, hệ số riêng, `null` ≠ 0, phụ huynh chỉ thấy cột đã công bố, khóa chặn RPC + chặn đổi hệ số, chỉ SA mở khóa | Tốt |
| `supabase/tests/017_attendance_scores_comments_test.sql` | Scope/author suy từ JWT, phụ huynh chỉ thấy `student_visible`, **không suy ra dòng `staff_only`**, phụ huynh không tự ghi nhận xét | Tốt |
| `supabase/tests/018_leaderboards_test.sql` | Snapshot 5 entry, thiếu nhi hạng 6 vẫn thấy Top 5, lớp khác không thấy, unpublish ẩn ngay, `TOP5_DISABLED` khi tắt cờ | Tốt |
| `tests/unit/assessment-schemas.test.ts` | Hệ số dương/thập phân, chuyên cần bắt buộc thành phần, 0 ≠ null, chặn 10.01 | Tốt |
| `tests/unit/gradebook-export.test.ts` | `safeSpreadsheetText` cho `=`/`-`; số dòng/cột đúng | ◐ **Chỉ test giá trị ô, không test header** |
| `tests/e2e/results.spec.ts` | Toàn trình đại diện → khóa → SA mở khóa → portal phụ huynh/thiếu nhi → export xlsx/pdf → không tràn ngang | Rất tốt |

**Khoảng trống test:** (a) 2 GLV cùng lưu một cột điểm; (b) xóa cột sau khi đã lưu điểm rỗng;
(c) công bố cột sau khi khóa; (d) unpublish → publish lại Top 5 (snapshot đổi); (e) tiêu đề cột bắt đầu
bằng `=` trong file export.
