# M11-REPORTS-DASHBOARD — 01. Khảo sát module

> Giai đoạn 1 — AUDIT NGHIỆP VỤ (read-only). Không sửa `src/`, `supabase/`, `tests/`.
> Ngày audit: 2026-07-22.

## 1. Phạm vi

Module gồm hai khối gắn với nhau qua cùng một tầng dữ liệu:

| Khối | Mục đích nghiệp vụ | Nguồn sự thật |
|---|---|---|
| Dashboard | Màn hình đầu tiên sau đăng nhập, hiển thị KPI + danh sách cần hành động theo đúng phạm vi người xem | `docs/01 §12`, `docs/06 §7` |
| Báo cáo | Chọn filter → xem trước theo RLS → xuất Excel/PDF → **chốt snapshot bất biến** giữ 5 năm | `docs/03 WF-15`, `docs/05 §Report`, D-51/D-52 |

Cảnh báo chuyên cần (WF-06) không có màn hình riêng: nó **chỉ hiện diện** trong module này
qua thẻ "Cần quan tâm" trên dashboard và các cột `warn_*` của view.

## 2. Bản đồ file

### 2.1 Tầng ứng dụng

| File | Vai trò | Ghi chú |
|---|---|---|
| `src/features/reports/filters.ts` | Kiểu + Zod schema bộ lọc, `resolveReportRange`, `parseReportFilter`, `reportFilterToSearchParams` | 116 dòng, thuần, có unit test |
| `src/features/reports/report-data.ts` | `buildReportExportData` — bảng phẳng dùng chung Excel/PDF/snapshot, chống formula injection | 18 dòng |
| `src/features/reports/server/queries.ts` | `buildReport`, `getReportsPageData`, `getReportSnapshot` | 217 dòng |
| `src/features/reports/server/actions.ts` | `createReportSnapshot` (server action duy nhất của module) | 79 dòng |
| `src/features/reports/components/report-workbench.tsx` | Client component: form filter, bảng preview, nút export, nút chốt, danh sách đã chốt | 235 dòng, `"use client"` |
| `src/features/dashboard/server/queries.ts` | `getDashboardData` — 7 truy vấn song song | 193 dòng |
| `src/features/dashboard/components/dashboard-overview.tsx` | Server component render KPI + 6 thẻ | 183 dòng, KHÔNG `"use client"` |
| `src/app/(dashboard)/dashboard/page.tsx` | Trang tổng quan | 17 dòng |
| `src/app/(dashboard)/reports/page.tsx` | Trang báo cáo, đọc filter từ `searchParams` | 25 dòng |
| `src/app/(dashboard)/reports/export/route.ts` | GET Excel/PDF theo filter trên URL | 51 dòng |
| `src/app/(dashboard)/reports/snapshots/[snapshotId]/export/route.ts` | GET Excel/PDF của bản đã chốt | 55 dòng |
| `src/lib/exports/http.ts` | `asciiFilename`, `excelResponse`, `pdfResponse` (pdfmake + Roboto) | 74 dòng |
| `src/lib/exports/spreadsheet.ts` | `safeSpreadsheetText` — chống Excel formula injection | 7 dòng |

### 2.2 Tầng dữ liệu — `supabase/migrations/20260723000500_dashboard_and_reports.sql`

| Đối tượng | Loại | Điểm cần nhớ |
|---|---|---|
| `v_dashboard_summary` | view `security_invoker` | Gộp 4 CTE: `enrolled`, `staffed`, `classed`, `attendance` |
| `v_students_at_risk` | view `security_invoker` | Gộp cảnh báo WF-06 + trung bình < 5 |
| `v_upcoming_teaching_items` | view `security_invoker` | 21 ngày tới |
| `v_upcoming_celebrations` | view `security_invoker` | 30 ngày tới |
| `v_incomplete_student_profiles` | view `security_invoker` | `LEFT JOIN guardians` cố ý (dòng 151–154) |
| `report_snapshots` | bảng | KHÔNG cấp `UPDATE`/`DELETE` cho `authenticated` (dòng 262) |
| `app.can_create_report(scope_type, scope_id)` | function | **Dùng chung cho cả SELECT lẫn INSERT policy** |
| `app.seal_report_snapshot()` | trigger BEFORE INSERT | Server đặt `generated_by`/`generated_at`/`status`/`checksum` |
| `report_attendance_rows(uuid, date, date)` | function SECURITY **INVOKER** | Nguồn duy nhất của preview/export/snapshot |
| `report_results_rows(uuid)` | function SECURITY **INVOKER** | Không nhận tham số ngày → luôn cả năm học |

### 2.3 Test hiện có

| File | Bao phủ |
|---|---|
| `tests/unit/report-filters.test.ts` | `resolveReportRange` (tuần/tháng/năm học), `parseReportFilter`, `reportFilterToSearchParams`, `buildReportExportData` |
| `supabase/tests/023_dashboard_reports_test.sql` | 26 assertion: tồn tại view/bảng, `security_invoker` theo vai trò, RLS insert snapshot, bất biến (không UPDATE/DELETE), snapshot không đổi khi nguồn đổi |
| `tests/e2e/*` | **Không có** e2e nào cho `/reports` hoặc `/dashboard` |

## 3. Vai trò tham gia

| Vai trò | Vào `/reports`? | Thấy gì (thực tế theo RLS) | Chốt được? |
|---|---|---|---|
| `super_admin`, `parish_priest`, `chaplain`, `group_leader`, `deputy_group_leader`, `secretary` | Có | Toàn xứ đoàn (`can_global_read` = true) | Có, mọi scope |
| `treasurer` | Có (route-map cho phép) | **Rỗng hoàn toàn** — xem §4 | Không (UI ẩn + RLS chặn) |
| `sector_leader`, `sector_deputy` | Có | Các lớp thuộc ngành mình | Chỉ `scope=sector` của mình |
| `class_representative`, `class_teacher`, `trainee_assistant` | Có | Đúng lớp mình | Chỉ `scope=class` của lớp mình |
| `guardian`, `student` | Không (`/reports` giới hạn `STAFF_ROLES`) | — | — |

Dashboard `/dashboard` mở cho **tất cả** vai trò (`route-map.ts:23`).

## 4. Phát hiện then chốt khi khảo sát

1. **`app.can_global_read()` KHÔNG bao gồm `treasurer`** (`20260715000100_identity_foundation.sql:164-167`),
   trong khi `getScopeKindForRole` xếp treasurer vào `"global"` (`src/lib/permissions/roles.ts:40-47, 79`).
   Hệ quả: treasurer vào được `/reports` và `/dashboard` nhưng mọi truy vấn dữ liệu đều bị RLS trả rỗng.
2. **`classes` đọc được bởi mọi tài khoản** (`20260715000200_academic_structure.sql:305-306`:
   `using (app.current_role() is not null)`), nên `class_count` trong `v_dashboard_summary`
   KHÔNG bị thu hẹp theo phạm vi trong khi `student_count`/`staff_count` thì có.
3. **Không có bộ chọn năm học**: `AcademicYearSwitcher` là nút `disabled` hardcode
   "Năm học 2026–2027" (`src/components/layout/academic-year-switcher.tsx:5`), còn `buildReport`
   luôn lấy `status = 'current'` (`server/queries.ts:68-72`). WF-15 bước 1 chưa có.
4. **Không có trang xem lại snapshot**: chỉ tồn tại route tải file
   (`reports/snapshots/[snapshotId]/export/route.ts`), không có `page.tsx`.
5. **`report_results_rows` bỏ qua khoảng ngày**: luôn tính cả năm học bất kể chọn tuần/tháng
   (`migration:322-351`). UI có ghi chú "(kết quả tính cho cả năm học)" (`report-workbench.tsx:147`)
   nhưng `period_start`/`period_end` của snapshot vẫn ghi khoảng tuần/tháng → dữ liệu và nhãn lệch nhau.
6. **Chống Excel formula injection có thật** và nằm đúng chỗ dùng chung
   (`report-data.ts:14-15` → `spreadsheet.ts:6`).

## 5. Ranh giới với module khác

| Module | Quan hệ |
|---|---|
| M05-ATTENDANCE | `report_attendance_rows` chỉ đọc buổi `finalized_at is not null`; view cảnh báo WF-06 nằm ở M05 |
| M07-ASSESSMENTS | `report_results_rows` đọc `v_student_weighted_average` |
| M10-NOTIFICATIONS | Thẻ "Thông báo mới" trên dashboard |
| M09-COMMITTEES | Thẻ "Công việc Ban" |
| M14-NAVIGATION-SHELL | Mục nav "Báo cáo" (`src/config/navigation.ts:54`) và "Tổng quan" (dòng 42) |
| M13-PORTAL | Dùng chung `/dashboard`; xem vấn đề cross-module ở `03_AUDIT_RESULTS.md` §6 |
