# M11-REPORTS-DASHBOARD — 07. Ảnh hưởng khi triển khai

> Ước lượng cho giai đoạn thực thi sau. Chưa có dòng mã nào được sửa ở giai đoạn 1.

## 1. Ma trận ảnh hưởng theo đề xuất

| Đề xuất | TS/UI | Server action | Route handler | DB migration | Test phải đổi | Rủi ro |
|---|---|---|---|---|---|---|
| TB-01 Thu hẹp `class_count` | — | — | — | ✅ `create or replace view` | pgTAP `023` (+2 assertion) | Thấp |
| TB-02A Quyền đọc tổng hợp cho thủ quỹ | `roles.ts` | — | — | ✅ helper + 2 RPC sang DEFINER + 1 policy | pgTAP mới cho treasurer | **Cao** |
| TB-02B Bỏ thủ quỹ khỏi `/reports` | `route-map.ts`, `navigation.ts` | — | — | — | `tests/unit/permissions.test.ts`, `navigation.test.ts` | Thấp |
| TB-03 Dashboard theo audience | `dashboard-overview.tsx` | — | — | — | e2e mới cho guardian/student | Thấp |
| TB-04 Rỗng vs ngoài phạm vi | `filters.ts`, `report-workbench.tsx`, `reports/server/queries.ts` | — | ✅ `export/route.ts` (dùng lại `parseReportFilter`) | — | `report-filters.test.ts` (đổi kiểu trả về) | Trung bình |
| TB-05 Phạm vi mặc định + nút chốt | `filters.ts`, `report-workbench.tsx`, `queries.ts` | — | ✅ | — | `report-filters.test.ts` | Trung bình |
| TB-06 Trang tra cứu snapshot | 2 trang mới | — | — | — | e2e mới | Thấp |
| TB-07 Chọn năm học | `filters.ts`, workbench, switcher | `actions.ts` | ✅ | — | `report-filters.test.ts` | Trung bình |
| TB-08A Kỳ cho báo cáo kết quả | `queries.ts` | — | — | ✅ drop+create RPC | pgTAP | Trung bình |
| TB-08B Ép `year` cho báo cáo kết quả | `filters.ts`, workbench | — | — | — | `report-filters.test.ts` | Thấp |
| Sửa nhỏ a11y/UI (§6 của 04) | 3 component | — | ✅ (`http.ts` guard headers rỗng) | — | — | Rất thấp |

## 2. Điểm nguy hiểm nhất

### 2.1 TB-02A — chuyển RPC báo cáo sang `SECURITY DEFINER`
Hiện tại `report_attendance_rows`/`report_results_rows` là **INVOKER**, nghĩa là RLS của người gọi
tự động bảo vệ. Chuyển sang DEFINER là **đổi mô hình bảo mật**: mọi kiểm phạm vi phải viết tay
bên trong hàm. Một `where` thiếu là rò toàn bộ số liệu xứ đoàn.

**Bắt buộc nếu làm:**
- Viết pgTAP negative cho cả 14 vai trò trước khi merge.
- Không được trả cột nào chứa `student_id` hay tên em.
- Giữ nguyên comment giải thích ở migration cũ và ghi rõ lý do đổi.
- Cân nhắc phương án ít rủi ro hơn: giữ INVOKER, chỉ thêm policy `SELECT` cho `treasurer` trên
  bảng nguồn ở mức **chỉ đọc cột không nhạy cảm** — nhưng RLS Postgres không lọc theo cột, nên
  phương án này cần view trung gian.

### 2.2 TB-01 — `create or replace view`
`create or replace view` **không cho đổi danh sách/thứ tự/kiểu cột**. Nếu chỉ đổi biểu thức của
`class_count` thì an toàn. Nếu cần thêm cột phải `drop view ... cascade` — mà `v_dashboard_summary`
hiện không có view nào phụ thuộc, nên vẫn khả thi; phải kiểm lại `grant select` sau khi drop.

### 2.3 TB-04 — đổi kiểu trả về của `parseReportFilter`
Hàm này được gọi ở 2 nơi (`reports/page.tsx:14`, `reports/export/route.ts:18`) và có 4 unit test.
Đổi từ `ReportFilter` sang `{ filter, invalidKeys }` là breaking change nội bộ — nhỏ nhưng phải
sửa đồng thời cả hai điểm gọi, nếu không file tải về sẽ dùng filter khác trang đang xem (đúng thứ
D-52 cấm).

### 2.4 TB-07 — thêm `academicYearId` vào `ReportFilter`
`filter_json` của snapshot sẽ có thêm khoá. Vì là `jsonb` nên **tương thích ngược** (snapshot cũ
không có khoá này vẫn đọc được). Nhưng `checksum` = sha256(`payload_json` || `filter_json`) nên
snapshot mới và cũ có cùng số liệu sẽ ra checksum khác nhau — điều này **đúng** và không cần xử lý,
chỉ cần không ai đi so checksum giữa hai thế hệ.

## 3. Không có rủi ro dữ liệu

Không đề xuất nào yêu cầu:
- backfill dữ liệu;
- sửa/xóa hàng `report_snapshots` đã có (và cũng không thể — không có `UPDATE`/`DELETE` cho `authenticated`);
- đổi kiểu cột.

Snapshot cũ tiếp tục đọc và tải được nguyên vẹn với mọi đề xuất trên.

## 4. Thứ tự triển khai đề xuất

| Đợt | Nội dung | Lý do xếp trước |
|---|---|---|
| 1 | Sửa nhỏ UI/a11y + TB-03 (link theo audience) | Không đụng DB, không đụng API, chặn ngay ngõ cụt `/access-denied` |
| 2 | TB-04 + TB-05 | Cùng chạm `filters.ts` — làm một lần để chỉ sửa test một lần |
| 3 | TB-01 | Migration độc lập, dễ rollback |
| 4 | TB-06 | Chỉ thêm trang mới, không sửa gì đang chạy |
| 5 | TB-08 (sau khi có câu trả lời Q2) | Có thể đụng chữ ký RPC |
| 6 | TB-02 (sau khi có câu trả lời Q1) | Rủi ro cao nhất, cần làm khi các thứ khác đã ổn định |
| 7 | TB-07 | Đụng nhiều module, nên đi cùng M02-ACADEMIC-STRUCTURE |

## 5. Nợ kỹ thuật ghi nhận (không sửa ở giai đoạn 1)

| # | Nợ | Vị trí |
|---|---|---|
| N-1 | `getReportsPageData` gọi `requireRouteAccess("/reports")` hai lần (một lần trực tiếp, một lần qua `buildReport`) | `reports/server/queries.ts:66,146` |
| N-2 | Mọi truy vấn dashboard bỏ qua `error` của Supabase | `dashboard/server/queries.ts:78,109-142` |
| N-3 | `AcademicYearSwitcher` là nút giả hardcode "Năm học 2026–2027" | `src/components/layout/academic-year-switcher.tsx:5` |
| N-4 | Cột `report_snapshots.file_path` khai báo nhưng chưa bao giờ ghi | `migration:203` |
| N-5 | Thêm loại báo cáo mới phải sửa 4 chỗ rời rạc (enum TS, mảng headers, nhánh `if`, check constraint) | `filters.ts:3`, `queries.ts:45-54,95-124`, `migration:192` |
| N-6 | Không có e2e nào cho `/reports` và `/dashboard` | `tests/e2e/` |
| N-7 | pgTAP `023` khẳng định payload dạng object (`rows->0->>'studentCount'`) trong khi ứng dụng ghi payload dạng **mảng** (`report-data.ts:12-17`) — test tự tạo dữ liệu nên không đỏ, nhưng không phản ánh hình dạng thật | `supabase/tests/023_dashboard_reports_test.sql:145-147` |
