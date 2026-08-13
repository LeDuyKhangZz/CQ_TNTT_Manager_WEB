# M11-REPORTS-DASHBOARD — 03. Kết quả audit

## 1. Bảng tổng hợp

| ID luồng | Tên luồng | Trạng thái | Điểm /75 | Ưu tiên |
|---|---|---|---|---|
| M11-F01 | Dashboard — vai trò global read | PASS_WITH_MINOR_UI_FIX | 65 | P3 |
| M11-F02 | Dashboard — GLV lớp / trưởng ngành | NEEDS_IMPROVEMENT | 52 | **P1** |
| M11-F03 | Dashboard — thủ quỹ | NEEDS_IMPROVEMENT | 45 | **P1** |
| M11-F04 | Dashboard — phụ huynh / thiếu nhi | NEEDS_IMPROVEMENT | 46 | **P1** |
| M11-F05 | Dashboard — chưa có năm học | PASS_WITH_MINOR_UI_FIX | 68 | P3 |
| M11-F06 | Xem báo cáo mặc định | PASS_WITH_MINOR_UI_FIX | 63 | P2 |
| M11-F07 | Đổi bộ lọc và xem lại | NEEDS_IMPROVEMENT | 50 | **P1** |
| M11-F08 | Xuất Excel | PASS | 70 | — |
| M11-F09 | Xuất PDF | PASS_WITH_MINOR_UI_FIX | 66 | P3 |
| M11-F10 | Chốt báo cáo (snapshot) | NEEDS_IMPROVEMENT | 54 | **P1** |
| M11-F11 | Danh sách báo cáo đã chốt | NEEDS_IMPROVEMENT | 50 | P2 |
| M11-F12 | Tải lại bản đã chốt | PASS_WITH_MINOR_UI_FIX | 64 | P3 |
| M11-F13 | Snapshot ID sai / ngoài phạm vi | PASS | 69 | — |
| M11-F14 | Thủ quỹ vào `/reports` | NEEDS_IMPROVEMENT | 45 | **P1** |
| M11-F15 | Sửa tham số URL thủ công | NEEDS_IMPROVEMENT | 52 | P2 |

**Không có luồng CRITICAL trong M11.** Toàn bộ yêu cầu bảo mật của WF-15 đều ĐẠT;
các điểm trừ nằm ở nhất quán số liệu, phân biệt "rỗng vs bị chặn" và trải nghiệm.

## 2. Chấm 15 tiêu chí (mức module)

| # | Tiêu chí | Điểm | Lý do |
|---|---|---|---|
| 1 | Đúng nghiệp vụ | 4 | WF-15 bước 2–6 đủ và chắc. Thiếu bước 1 (chọn năm học); `report_results_rows` bỏ qua khoảng ngày trong khi snapshot vẫn ghi `period_start/end` của tuần/tháng. |
| 2 | Dễ hiểu | 3 | Một câu "Không có dữ liệu…" gánh 3 nguyên nhân khác nhau (thật sự rỗng / ngoài phạm vi / không có quyền). Danh sách bản chốt không hiện phạm vi. |
| 3 | Số bước hợp lý | 4 | Chọn filter → Xem → Tải/Chốt: 3 bước, ngắn gọn. Trừ điểm vì phải bấm "Xem báo cáo" mới áp dụng (không tự áp dụng khi đổi select). |
| 4 | Không nhập trùng | 5 | `buildReport` là nguồn duy nhất cho preview + Excel + PDF + payload snapshot (`queries.ts:60-64`); không có đường tính song song. |
| 5 | Khó thao tác nhầm | 2 | `parseReportFilter` fallback im lặng về `global` khi tham số sai (`filters.ts:97-105`); nút "Chốt báo cáo" hiện cho vai trò chắc chắn sẽ bị RLS từ chối; dropdown lớp liệt kê toàn bộ 19 lớp cho GLV chỉ có 1 lớp. |
| 6 | Validation đầy đủ | 4 | Zod + `superRefine` ở server (`filters.ts:34-47`); check UUID trước truy vấn (`snapshots/.../route.ts:20`); check format export. Trừ vì client không validate và fallback thay vì báo lỗi. |
| 7 | Trạng thái rõ ràng | 3 | Snapshot có `status='final'` cứng, checksum, thời điểm — rất rõ. Nhưng trạng thái "bạn đang xem phạm vi nào / vì sao rỗng" thì không. |
| 8 | Phân quyền an toàn | 5 | RPC `SECURITY INVOKER`; RLS trên mọi view (`security_invoker`); snapshot không cấp UPDATE/DELETE; checksum/người chốt do trigger đặt; export không mở rộng được phạm vi; 404 thay vì 403 cho snapshot ngoài phạm vi. |
| 9 | Dữ liệu nhất quán | 3 | Preview/Excel/PDF/snapshot luôn khớp (điểm mạnh nhất). Nhưng `class_count` trên dashboard không cùng phạm vi với các KPI khác; snapshot `period_start/end` không khớp dữ liệu với báo cáo kết quả. |
| 10 | Dễ bảo trì | 4 | Tách lớp sạch: `filters.ts` thuần, `report-data.ts` thuần, query/action tách riêng. Trừ vì `buildReport` gọi `requireRouteAccess` 2 lần trong `getReportsPageData` (`:66` và `:146`). |
| 11 | Dễ mở rộng | 3 | Thêm loại báo cáo phải sửa 4 chỗ (`REPORT_TYPES`, headers const, nhánh `if` trong `buildReport`, check constraint DB). Không có registry. |
| 12 | UI hỗ trợ đúng nghiệp vụ | 3 | Có đủ nút cần thiết; thiếu nút PDF cho bản chốt, thiếu trang xem lại snapshot, thiếu phân trang. |
| 13 | Responsive | 4 | Form `grid md:grid-cols-2 xl:grid-cols-4`; bảng bọc `overflow-x-auto min-w-[640px]` (`report-workbench.tsx:177-178`); select `h-11` đạt target chạm. Trừ vì ở 360px hàng nút Excel/PDF/Chốt dễ tràn 2 dòng. |
| 14 | Accessibility | 3 | `FormMessage` có `role="alert"/"status"` (`form-message.tsx:21`); `<label>` bọc select (liên kết ngầm hợp lệ); `aria-label` trên section KPI. Thiếu: bảng không có `<caption>`/`scope="col"`; nút "Chốt báo cáo" không có `aria-busy`; không có vùng `aria-live` báo số dòng sau khi lọc. |
| 15 | Khả năng kiểm thử | 4 | Unit test cho phần thuần; 26 assertion pgTAP cho RLS/bất biến. Trừ vì **không có e2e** cho `/reports` và **không có pgTAP** khẳng định `class_count` bị thu hẹp theo phạm vi. |
| | **Tổng** | **52/75** | |

## 3. Kết luận cho các "kiểm đặc biệt" (WF-15)

| Kiểm | Kết luận | Bằng chứng |
|---|---|---|
| Export dùng chính filter đang xem, không nhận filter khác để mở rộng phạm vi | **ĐẠT** | Link dựng từ `data.filter` (`report-workbench.tsx:68`); route dựng lại bằng `buildReport` dưới RLS người gọi (`export/route.ts:18-19`); sửa query string chỉ thu hẹp/không mở rộng vì RLS chặn |
| Khi chốt, server dựng lại số liệu từ filter đang xem | **ĐẠT** | `actions.ts:32` `const report = await buildReport(filter)`; action chỉ nhận `ReportFilter` |
| Người chốt / thời điểm / checksum do server đặt | **ĐẠT** | Trigger `app.seal_report_snapshot` — migration `:242-251`; pgTAP `023:116-130` |
| Snapshot final bất biến kể cả khi dữ liệu nguồn bị xóa | **ĐẠT** | Đọc từ `payload_json`, không tính lại (`queries.ts:197-216`); pgTAP `023:139-147` |
| Không luồng người dùng nào sửa/xóa snapshot | **ĐẠT** | `grant select, insert` (migration `:262`), check `status = 'final'` (`:204`); pgTAP `023:132-137` |
| Chỉ user có scope tương ứng tải được snapshot của người khác | **ĐẠT** | `report_snapshots_select_scope using (app.can_create_report(...))` — `:265-267`; ngoài phạm vi → 404 không phân biệt được với "không tồn tại" |
| Thủ quỹ KHÔNG chốt báo cáo (D-19) | **ĐẠT (2 lớp)** | UI `queries.ts:182`; DB `can_create_report` → `can_global_read()` không gồm `treasurer` (`20260715000100:164-167`) |
| Thủ quỹ KHÔNG thấy điểm chi tiết / nhận xét / ghi chú nội bộ | **ĐẠT nhưng quá tay** | Báo cáo chỉ có số gộp theo lớp (không có điểm từng em); nhưng treasurer bị RLS chặn **toàn bộ**, kể cả số gộp ⇒ trái `docs/05 §4.5` "Báo cáo tổng hợp" |
| Excel formula injection ở export | **ĐẠT** | `safeSpreadsheetText` (`spreadsheet.ts:5-7`) áp cho `className` và mọi ô kiểu chuỗi (`report-data.ts:13-16`); headers là hằng số; snapshot lưu dữ liệu đã escape nên tải lại vẫn an toàn |
| Dashboard rò số liệu ngoài scope (GLV lớp thấy tổng toàn xứ đoàn)? | **KHÔNG ĐẠT — có rò** | Ô "Lớp" lấy từ CTE `classed` trên bảng `classes`, mà `classes_select_authenticated using (app.current_role() is not null)` (`20260715000200:305-306`) cho mọi tài khoản đọc ⇒ GLV lớp thấy `class_count` = tổng lớp toàn xứ đoàn. `student_count`/`staff_count`/tỷ lệ thì đúng phạm vi |

## 4. 5 Whys cho các luồng không PASS

### 4.1 M11-F02 — `class_count` rò phạm vi

1. **Vì sao** GLV lớp thấy số lớp toàn xứ đoàn? → Vì `v_dashboard_summary.class_count` đếm trên `public.classes`.
2. **Vì sao** đếm được hết? → Vì policy `classes_select_authenticated` cho mọi vai trò đọc mọi lớp.
3. **Vì sao** policy mở như vậy? → Vì danh mục lớp được coi là "cấu trúc công khai" phục vụ dropdown/điều hướng, không phải dữ liệu nhạy cảm.
4. **Vì sao** vẫn thành vấn đề? → Vì `security_invoker` được tin là "tự động thu hẹp mọi con số", nhưng nó chỉ thu hẹp đúng bằng RLS của bảng nguồn — bảng nguồn ở đây không hạn chế.
5. **Nguyên nhân gốc:** Thiết kế view trộn hai loại nguồn (bảng có RLS phạm vi và bảng danh mục mở) trong cùng một hàng KPI mà **không có mệnh đề phạm vi rõ ràng ở chính view**; và pgTAP không có assertion cho `class_count` ở vai trò lớp/ngành nên sai lệch không bị phát hiện.

### 4.2 M11-F03 / F14 — Thủ quỹ thấy trang trống

1. **Vì sao** thủ quỹ không thấy gì? → Vì mọi policy dữ liệu nghiệp vụ đòi `can_global_read()` hoặc scope lớp/ngành.
2. **Vì sao** thủ quỹ không thoả? → Vì `can_global_read()` liệt kê cứng 6 vai trò, không có `treasurer`.
3. **Vì sao** vẫn vào được trang? → Vì tầng ứng dụng xếp treasurer vào `GLOBAL_ROLES`/`scopeKind="global"` (`roles.ts:40-47,79`) và `route-map.ts:39` dùng `STAFF_ROLES`.
4. **Vì sao** hai tầng lệch nhau? → Vì `docs/05` mô tả treasurer là "global **limited**" nhưng chưa bao giờ định nghĩa "limited" thành một helper riêng ở DB.
5. **Nguyên nhân gốc:** Thiếu khái niệm quyền "đọc số liệu tổng hợp, không đọc chi tiết" — hệ thống chỉ có nhị phân global-read / không có. Kết quả là treasurer bị **cấm toàn bộ ở DB nhưng được mời vào ở UI**.

### 4.3 M11-F04 — Phụ huynh/thiếu nhi bấm vào thẻ "Cần quan tâm" thì bị chặn

1. **Vì sao** bị chặn? → Link trỏ `/students/{id}`, route chỉ dành `STAFF_ROLES`.
2. **Vì sao** thẻ hiện với phụ huynh? → Vì `v_students_at_risk` trả về con của họ (RLS cho phép đọc record đã finalize).
3. **Vì sao** component không phân nhánh? → Vì chỉ 3 thẻ được bọc `isStaff`, thẻ "Cần quan tâm" thì không (`dashboard-overview.tsx:50-77`).
4. **Vì sao** không ai phát hiện? → Vì không có e2e dashboard cho vai trò guardian/student.
5. **Nguyên nhân gốc:** Dashboard được thiết kế như **một** màn hình dùng chung với vài chỗ ẩn/hiện, thay vì hai bố cục theo `audience` như `docs/06 §7` đã tách sẵn ("Global / Sector / Class staff / Guardian-student").

### 4.4 M11-F07 / F15 — Không phân biệt "rỗng" với "bị chặn", fallback im lặng

1. **Vì sao** người dùng hiểu nhầm? → Vì cùng một câu cho mọi nguyên nhân.
2. **Vì sao** chỉ có một câu? → Vì `buildReport` chỉ trả `rows`, không trả lý do rỗng.
3. **Vì sao** không trả lý do? → Vì tầng ứng dụng cố tình "không tự lọc, để RLS lọc" (comment `queries.ts:126-127`) nên nó không biết phạm vi hợp lệ của người dùng là gì.
4. **Vì sao** không biết? → Vì `AuthContext` có `sectorId`/`classId` nhưng `buildReport` không dùng để đối chiếu với `filter.scopeId`.
5. **Nguyên nhân gốc:** Không có bước "xác thực phạm vi yêu cầu **trước** khi truy vấn". Cùng nguyên nhân sinh ra fallback im lặng của `parseReportFilter`: khi filter sai, hệ thống chọn "đoán lại" thay vì "từ chối và nói rõ".

### 4.5 M11-F10 — Nút "Chốt báo cáo" hiện cho người chắc chắn bị từ chối

1. **Vì sao** bị từ chối? → `can_create_report('global', null)` = `can_global_read()` = false với trưởng ngành/GLV lớp.
2. **Vì sao** vẫn hiện nút? → `canSnapshot` chỉ loại trừ `treasurer` (`queries.ts:182`).
3. **Vì sao** chỉ loại trừ treasurer? → Vì D-19 được đọc là "chỉ thủ quỹ bị cấm", còn giới hạn theo phạm vi bị coi là việc của RLS.
4. **Vì sao** đó là vấn đề? → Vì phạm vi **mặc định** là `global` (`filters.ts:38`), tức trạng thái mặc định của trưởng ngành/GLV lớp luôn là trạng thái sẽ lỗi.
5. **Nguyên nhân gốc:** Phạm vi mặc định không suy từ `scopeKind` của người đăng nhập. Một trưởng ngành lẽ ra phải mở trang ở `scope=sector, scopeId=ngành của mình`.

### 4.6 M11-F11 — Danh sách bản chốt không dùng được lâu dài

1. **Vì sao** không tìm lại được bản cũ? → `limit(20)`, không phân trang, không lọc.
2. **Vì sao** đặt 20? → Đủ cho giai đoạn đầu.
3. **Vì sao** không đủ? → Retention 5 năm × (tuần/tháng/năm × 2 loại × 19 lớp) ⇒ hàng nghìn bản.
4. **Vì sao** không phân biệt được các bản? → Title chỉ gồm loại + khoảng ngày (`actions.ts:46`), không có phạm vi/người chốt.
5. **Nguyên nhân gốc:** Snapshot được thiết kế đúng ở tầng dữ liệu (bất biến, có checksum, có `scope_type/scope_id/generated_by`) nhưng UI **không phơi bày** các trường đó, nên giá trị lưu trữ 5 năm không khai thác được.

## 5. Điểm mạnh cần giữ nguyên

1. **Một nguồn tính duy nhất** (`buildReport`) cho preview/Excel/PDF/snapshot — đây là lý do D-52 không thể bị phá.
2. **Trigger `seal_report_snapshot`** đặt người chốt/thời điểm/checksum ở DB, không tin client.
3. **Không cấp `UPDATE`/`DELETE`** trên `report_snapshots` — bất biến ở tầng quyền, không phải bằng cách ẩn nút.
4. **RPC báo cáo là `SECURITY INVOKER`** với comment giải thích rõ.
5. **`safeSpreadsheetText`** nằm ở tầng dữ liệu dùng chung, không phải ở từng route.
6. **Kiểm UUID trước khi truy vấn** ở route snapshot → 404 chứ không 500/22P02.
7. **Comment nghiệp vụ trong mã** (D-51/D-52) giúp người sau không tách nhầm đường tính.

## 6. Vấn đề cross-module

| # | Vấn đề | Ảnh hưởng |
|---|---|---|
| X-1 | `treasurer` được coi là global ở TS (`roles.ts`) nhưng không phải global ở SQL (`can_global_read`) | M11 + M03-STUDENTS + M14-NAVIGATION |
| X-2 | Dashboard là màn hình dùng chung giữa staff và portal nhưng không tách bố cục theo `audience` | M11 + M13-PORTAL |
| X-3 | `classes`/`sectors` đọc được bởi mọi tài khoản → mọi dropdown phạm vi trong hệ thống đều liệt kê ngoài phạm vi | M11 + M05 + M07 + M12 |
| X-4 | `(dashboard)/layout.tsx:6` chỉ gọi `requireAuthContext()`, không `requireRouteAccess(pathname)` ⇒ mọi trang phải tự guard | M11 (đã guard đủ) + M13 (**thiếu**, xem M13-F08) |
| X-5 | Không có bộ chọn năm học hoạt động ⇒ WF-15 bước 1 và WF-16 bước 3 chưa thực hiện được | M11 + M02-ACADEMIC-STRUCTURE + M08-PROMOTIONS |

## 7. Câu hỏi NEEDS_CONFIRMATION

| # | Câu hỏi | Vì sao cần chốt |
|---|---|---|
| Q1 | "Thủ quỹ · 👁/export **giới hạn**" (docs/05 §2) nghĩa là gì cụ thể? Thủ quỹ được xem số gộp theo lớp (sĩ số, tỷ lệ chuyên cần, trung bình lớp) hay không được xem gì cả? | Quyết định giữ nguyên hiện trạng (trang trống) hay bổ sung helper `app.can_read_aggregate()` |
| Q2 | Báo cáo "Kết quả học tập" có cần theo tuần/tháng không, hay luôn là cả năm học? | `report_results_rows` bỏ tham số ngày nhưng snapshot vẫn ghi `period_start/end` theo tuần/tháng |
| Q3 | Có được phép chốt hai báo cáo trùng (cùng loại, phạm vi, kỳ) không? | Snapshot không xóa được; nếu không cho trùng thì cần unique index |
| Q4 | Bản chốt cần giữ 5 năm — người dùng tìm lại bằng cách nào (lọc theo năm học? theo lớp? tìm kiếm)? | Quyết định thiết kế trang danh sách/tra cứu snapshot |
| Q5 | Có cần trang **xem lại** nội dung snapshot trong trình duyệt, hay chỉ tải file là đủ? | Hiện chỉ có route tải file |
| Q6 | Ô "Lớp" trên dashboard của GLV lớp nên hiển thị gì: số lớp mình phụ trách, hay bỏ hẳn? | Quyết định cách sửa rò `class_count` |
