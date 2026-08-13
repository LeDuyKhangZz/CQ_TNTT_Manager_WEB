# M11-REPORTS-DASHBOARD — 04. Luồng TO-BE

> Chỉ đề xuất. Giai đoạn 1 không sửa mã.
> Các luồng **M11-F08, M11-F13** đã PASS — **không có To-Be**, giữ nguyên.
> Các luồng PASS_WITH_MINOR_UI_FIX (F01, F05, F06, F09, F12) chỉ cần sửa nhỏ, gộp ở §6.

---

## TB-01 — Chuẩn hoá phạm vi dashboard (giải quyết M11-F02)

### Mục tiêu
Mọi con số trên dashboard cùng một phạm vi với nhau và với phạm vi của người xem.

### Actor
Trưởng ngành, phó ngành, GLV đại diện, GLV lớp, dự trưởng.

### Hai phương án

#### Phương án A — Thu hẹp `class_count` ngay trong view (khuyến nghị)
Sửa CTE `classed` để đếm qua tập lớp trong phạm vi thay vì toàn bộ bảng `classes`:
đếm lớp có `id` thuộc `app.scope_class_ids() ∪ app.staff_class_ids()`, hoặc toàn bộ khi
`app.can_global_read()`.

- **Ưu:** một chỗ sửa; mọi consumer của view được lợi; không đụng policy `classes` (vốn cần mở cho dropdown).
- **Nhược:** thêm phụ thuộc helper vào view; cần đo lại kế hoạch truy vấn.

#### Phương án B — Ẩn ô "Lớp" với vai trò không global
Giữ view nguyên trạng, `dashboard-overview.tsx` chỉ hiện ô "Lớp" khi `scopeKind === "global"`.

- **Ưu:** thay đổi tối thiểu, không đụng DB.
- **Nhược:** con số sai vẫn nằm trong view, module khác dùng lại sẽ tái phát; không giải quyết `docs/06 §7` yêu cầu dashboard Sector "tương tự nhưng scope sector" (trưởng ngành **cần** biết số lớp của ngành mình).

**Khuyến nghị: A.** B chỉ nên dùng như biện pháp tạm nếu A gây hồi quy hiệu năng.

### Business rule liên quan
BR-M11-01 (xem `05_BUSINESS_RULES.md`).

### Validation
Không có input người dùng.

### Permission
Không đổi. RLS `classes` giữ nguyên (danh mục lớp vẫn công khai cho dropdown).

### Trạng thái
Không có trạng thái mới.

### Error handling
Không đổi.

### Audit
Không cần (`docs/10 §7`: đã bỏ audit history).

### So sánh số bước
Không đổi (0 bước thao tác).

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 |
| API/Server action | Không |
| DB | Migration mới `create or replace view public.v_dashboard_summary` |
| Rủi ro migration | Thấp — view không có dữ liệu; cần `create or replace` giữ nguyên danh sách cột (nếu đổi cột phải `drop cascade`) |
| Rollback | `create or replace view` về bản cũ |

---

## TB-02 — Định nghĩa quyền "đọc số liệu tổng hợp" cho thủ quỹ (giải quyết M11-F03, M11-F14)

### Mục tiêu
Chấm dứt tình trạng "được mời vào trang nhưng bị DB từ chối toàn bộ".

### Actor
Thủ quỹ (và về sau: cha sở/cha phó nếu muốn giới hạn tương tự).

### Hai phương án

#### Phương án A — Bổ sung quyền đọc tổng hợp
Thêm helper `app.can_read_aggregate()` (global read **hoặc** `treasurer`) và dùng nó cho:
- hai RPC báo cáo (`report_attendance_rows`, `report_results_rows`) — chuyển sang `SECURITY DEFINER`
  có kiểm `app.can_read_aggregate()` ở đầu, **chỉ trả số gộp theo lớp**, không có `student_id`;
- `report_snapshots_select_scope` (đọc snapshot) — tách khỏi `can_create_report`;
- các CTE của `v_dashboard_summary`.

`can_create_report` giữ nguyên ⇒ D-19 vẫn được bảo toàn: thủ quỹ đọc nhưng không chốt.

- **Ưu:** khớp `docs/05 §4.5` ("Dashboard tổng hợp", "Báo cáo tổng hợp") và ô ma trận "👁/export giới hạn"; không mở thêm dữ liệu chi tiết.
- **Nhược:** phải chuyển RPC sang `SECURITY DEFINER` — mất tính "RLS tự lo" hiện tại, phải tự viết kiểm phạm vi bên trong hàm (rủi ro cao nhất của phương án này). Cần pgTAP kỹ.

#### Phương án B — Bỏ thủ quỹ khỏi `/reports` và `/dashboard` số liệu
Loại `treasurer` khỏi `roles` của mục nav "Báo cáo" và khỏi `STAFF_ROLES` của route `/reports`;
dashboard của thủ quỹ chuyển sang bố cục tối giản (thông báo + việc của mình).

- **Ưu:** trung thực với năng lực thực tế của hệ thống; không đụng DB; rủi ro gần bằng 0.
- **Nhược:** trái mô tả `docs/05 §4.5`; Phase 8 (phí/biên lai) sẽ phải mở lại.

**Khuyến nghị:** hỏi Q1 trước (xem `03_AUDIT_RESULTS.md §7`). Nếu người dùng xác nhận thủ quỹ
cần số tổng hợp → A; nếu không → B (rẻ và an toàn hơn nhiều).

### Business rule
BR-M11-02.

### Permission
Bảng phân quyền mới cho `treasurer`: `report.read_aggregate = true`, `report.finalize = false`,
`student.read_detail = false`.

### Trạng thái / Error handling
Nếu chọn B: khi thủ quỹ mở `/reports` bằng URL trực tiếp → `/access-denied` (đã có sẵn).

### So sánh số bước
Không đổi.

### Ảnh hưởng
| Loại | A | B |
|---|---|---|
| Module | M11, M03, M14 | M11, M14 |
| API | Không | Không |
| DB | Helper mới + đổi 2 RPC sang DEFINER + 1 policy | Không |
| Rủi ro migration | **Cao** — `SECURITY DEFINER` sai một dòng là rò toàn bộ | Không |
| Rollback | Revert migration; RPC quay lại INVOKER | Sửa route-map/navigation |

---

## TB-03 — Dashboard theo `audience` (giải quyết M11-F04)

### Mục tiêu
Phụ huynh/thiếu nhi không gặp link dẫn tới trang họ không được vào; KPI mang nhãn đúng nghĩa.

### Actor
Phụ huynh, thiếu nhi.

### Bước mới
1. `getDashboardData` trả thêm `audience` (đã có, `queries.ts:145`).
2. `dashboard-overview.tsx` phân nhánh **sớm** theo `audience`, không dùng cờ `isStaff` rải rác:
   - `staff` → bố cục hiện tại;
   - `guardian`/`student` → bố cục `docs/06 §7 Guardian/student`: "Điểm danh gần nhất", "Điểm mới",
     "Tuần tới", "Thông báo" — mỗi thẻ trỏ tới route mà chính họ vào được.
3. Thẻ "Cần quan tâm" ở bố cục portal: đổi link `/students/{id}` → `/parent/children/{id}`
   (guardian) hoặc `/student/attendance` (student).
4. Nhãn KPI: "Thiếu nhi" → "Con của tôi" (guardian) / bỏ (student);
   "Tỷ lệ dự lễ" → "Tỷ lệ dự lễ của con" kèm câu giải thích.

### BR
BR-M11-03, BR-M11-04.

### Validation
Không có input.

### Permission
Không đổi (RLS đã đúng). Đây thuần tuý là sửa **điều hướng và nhãn**.

### Trạng thái
Không có trạng thái mới.

### Error handling
Không còn đường dẫn tới `/access-denied` từ dashboard.

### Audit
Không cần.

### So sánh số bước
Trước: phụ huynh bấm tên con → `/access-denied` → quay lại → không có đường nào khác (**ngõ cụt**).
Sau: 1 bước tới trang điểm danh của con.

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 + M13-PORTAL (phối hợp với TB-M13-01) |
| API | Không |
| DB | Không |
| Rủi ro migration | Không |
| Rollback | Revert component |

---

## TB-04 — Phân biệt "rỗng thật" với "ngoài phạm vi" (giải quyết M11-F07, M11-F15, M11-F06)

### Mục tiêu
Người dùng luôn biết vì sao bảng trống, và không bị đổi phạm vi sau lưng.

### Actor
Mọi vai trò staff.

### Bước mới
1. `getReportsPageData` chỉ đưa vào dropdown những ngành/lớp **trong phạm vi** người dùng:
   - `can_global_read` → tất cả;
   - `scopeKind = "sector"` → ngành của mình + các lớp thuộc ngành;
   - `scopeKind = "class"` → đúng lớp mình (khi chỉ có 1 lựa chọn thì hiện dạng nhãn tĩnh, không phải select).
2. `buildReport` xác thực `filter.scopeId` **trước** khi truy vấn:
   trả về `{ rows: [], reason: "out_of_scope" }` thay vì `rows: []` trần.
3. `parseReportFilter` **không fallback im lặng**: trả `{ filter, invalidKeys }`; trang hiện dải
   cảnh báo "Một số tham số không hợp lệ đã được đặt lại: …" (`role="status"`).
4. Empty state chia 3 câu:
   - `reason = "out_of_scope"` → "Bạn không được xem phạm vi này. Hãy chọn lớp/ngành bạn phụ trách."
   - `reason = "no_finalized_session"` → "Trong khoảng này chưa có buổi điểm danh nào được chốt."
   - `reason = "empty"` → "Không có dữ liệu trong khoảng thời gian này."
5. Hiện dòng tóm tắt luôn: "Đang xem: Chuyên cần · Tháng 09/2026 · Lớp Ấu 1 · 30 dòng".

### BR
BR-M11-05, BR-M11-06, BR-M11-08.

### Validation
| Trường | Client | Server |
|---|---|---|
| `reportType` | select (đóng) | `z.enum` |
| `periodType` | select (đóng) | `z.enum` |
| `anchorDate` | `type="date"` + `required` | `z.string().date()`; thêm kiểm nằm trong năm học đang chọn |
| `scopeType` | select (đóng) | `z.enum` |
| `scopeId` | `required` khi ≠ global | `z.uuid()` + superRefine + **kiểm thuộc phạm vi actor** |

### Permission
Không đổi ở DB. Bổ sung kiểm ở tầng ứng dụng để **báo lỗi sớm**, không thay RLS.

### Trạng thái
Thêm `reason` vào `ReportResult` (chỉ ảnh hưởng nội bộ).

### Error handling
Tham số sai → hiện cảnh báo + dùng mặc định **an toàn nhất theo `scopeKind`** (không phải `global`).

### Audit
Không cần.

### So sánh số bước
Trước: chọn nhầm lớp → thấy trống → thử lại → vẫn trống → không hiểu (vòng lặp không kết thúc).
Sau: chọn nhầm lớp là không thể (dropdown đã lọc); nếu vào bằng URL thì 1 câu giải thích + 1 bước sửa.

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 |
| API | `parseReportFilter` đổi kiểu trả về → cập nhật `tests/unit/report-filters.test.ts` |
| DB | Không |
| Rủi ro migration | Không |
| Rollback | Revert TS |

---

## TB-05 — Phạm vi mặc định theo vai trò + nút chốt đúng ngữ cảnh (giải quyết M11-F10)

### Mục tiêu
Không bao giờ hiển thị nút dẫn tới lỗi phân quyền.

### Actor
Trưởng/phó ngành, GLV đại diện, GLV lớp.

### Bước mới
1. Khi URL không có tham số phạm vi, `parseReportFilter` nhận `AuthContext` và đặt mặc định:
   - `scopeKind="global"` → `{ scopeType: "global", scopeId: null }`
   - `scopeKind="sector"` → `{ scopeType: "sector", scopeId: context.sectorId }`
   - `scopeKind="class"` → `{ scopeType: "class", scopeId: context.classId }`
2. `canSnapshot` tính theo **cả vai trò lẫn phạm vi đang chọn**, phản chiếu đúng
   `app.can_create_report`:
   - treasurer → false (D-19);
   - `global` → chỉ khi `can_global_read`;
   - `sector` → global read hoặc đúng ngành mình;
   - `class` → global read, đúng lớp mình, hoặc là nhân sự lớp đó.
3. Khi `canSnapshot = false` vì phạm vi: thay vì ẩn nút, hiện nút `disabled` kèm
   `title`/`aria-describedby`: "Bạn chỉ chốt được báo cáo trong phạm vi lớp/ngành mình phụ trách."
4. Thêm hộp xác nhận trước khi chốt, tóm tắt đúng nội dung sẽ chốt (loại, kỳ, phạm vi, số dòng)
   và câu "Bản chốt không sửa/xóa được."

### BR
BR-M11-07, BR-M11-09, BR-M11-10.

### Permission
Không đổi ở DB — tầng UI **phản chiếu** `can_create_report`, DB vẫn là tuyến chặn cuối.

### Trạng thái
`report_snapshots.status` giữ nguyên `'final'`.

### Error handling
`42501` vẫn map sang FORBIDDEN (`actions.ts:71`) như lưới an toàn.

### Audit
`generated_by`/`generated_at`/`checksum` đã do trigger đặt — giữ nguyên.

### So sánh số bước
Trước: 1 bước bấm → lỗi → không biết làm gì tiếp (thất bại).
Sau: 2 bước (bấm → xác nhận) nhưng luôn thành công.

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 |
| API | `parseReportFilter` nhận thêm `AuthContext` |
| DB | Không |
| Rủi ro migration | Không |
| Rollback | Revert TS |

---

## TB-06 — Trang tra cứu báo cáo đã chốt (giải quyết M11-F11, M11-F12)

### Mục tiêu
Khai thác được kho snapshot 5 năm.

### Actor
Mọi vai trò có phạm vi tương ứng.

### Bước mới
1. Tách danh sách bản chốt sang trang riêng `/reports/snapshots` với bộ lọc:
   năm học · loại · phạm vi · khoảng thời gian; phân trang 20/trang.
2. Mỗi dòng hiện: tiêu đề · **phạm vi** (Toàn xứ đoàn / Ngành X / Lớp Y) · người chốt · thời điểm ·
   checksum rút gọn · nút "Xem" · nút "Excel" · nút "PDF".
3. Trang `/reports/snapshots/[snapshotId]` render lại bảng từ `payload_json` (chỉ đọc), kèm banner
   "Bản chốt ngày … — dữ liệu không đổi kể cả khi nguồn thay đổi." và checksum đầy đủ.
4. Đổi `title` khi chốt để chứa phạm vi: `"Chuyên cần · Lớp Ấu 1 · 01/09–30/09/2026"`.

### BR
BR-M11-11, BR-M11-12.

### Validation
`snapshotId` phải khớp UUID trước khi truy vấn (đã có ở route export — áp dụng tương tự cho page).

### Permission
Không đổi: `report_snapshots_select_scope` đã lọc; page dùng `notFound()` khi không đọc được.

### Trạng thái
Không có trạng thái mới (snapshot luôn `final`).

### Error handling
UUID sai / ngoài phạm vi → `notFound()` (404), không lộ sự tồn tại.

### Audit
Không cần.

### So sánh số bước
Trước: cuộn tìm trong 20 dòng gần nhất; bản cũ hơn = không có đường vào.
Sau: 2 bước (lọc → mở) cho mọi bản trong 5 năm.

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 |
| API | Thêm `listReportSnapshots(filter, page)` |
| DB | Index `report_snapshots_scope_idx` đã có (`migration:214-215`) — đủ; nếu lọc theo `report_type` nhiều thì cân nhắc thêm |
| Rủi ro migration | Không (chỉ đọc) |
| Rollback | Bỏ route mới |

---

## TB-07 — Chọn năm học cho báo cáo (giải quyết thiếu sót WF-15 bước 1)

### Mục tiêu
Chốt được báo cáo năm cũ (WF-16 bước 3) và xem lại số liệu năm trước.

### Actor
Vai trò global read.

### Bước mới
1. Thêm `academicYearId` vào `ReportFilter` (mặc định = năm `current`).
2. `buildReport` dùng `academicYearId` thay vì `.eq("status","current")`.
3. Kích hoạt `AcademicYearSwitcher` hoặc thêm select "Năm học" vào form bộ lọc.
4. `resolveReportRange` đã nhận `academicYear` làm tham số — không đổi chữ ký.

### BR
BR-M11-13.

### Validation
`academicYearId` là UUID thuộc `academic_years` mà người dùng đọc được.

### Permission
`academic_years` đọc được bởi staff — không đổi.

### Ảnh hưởng
| Loại | Chi tiết |
|---|---|
| Module | M11 + M02-ACADEMIC-STRUCTURE + M14 |
| API | `ReportFilter` thêm trường ⇒ `filter_json` của snapshot mới có thêm khoá (tương thích ngược vì `jsonb`) |
| DB | Không |
| Rủi ro migration | Không |
| Rollback | Bỏ trường, mặc định `current` |

---

## TB-08 — Thống nhất kỳ báo cáo cho "Kết quả học tập"

### Mục tiêu
`period_start/period_end` của snapshot phải mô tả đúng dữ liệu bên trong.

### Hai phương án
- **A:** `report_results_rows` nhận thêm `p_from`, `p_to` và chỉ tính các assessment có
  `assessment_date` trong khoảng ⇒ "Kết quả tháng 9" là có thật.
- **B:** Với `reportType = "results"`, ép `periodType = "year"` ở UI và server; ẩn ô "Ngày trong kỳ".

**Khuyến nghị:** hỏi Q2 trước. B rẻ và trung thực ngay; A đúng kỳ vọng nghiệp vụ hơn nhưng
phải chốt cách xử lý assessment không có `assessment_date`.

### Ảnh hưởng
| Loại | A | B |
|---|---|---|
| DB | Đổi chữ ký RPC (drop + create) | Không |
| Rủi ro migration | Trung bình — `drop function` khi đổi chữ ký | Không |
| Rollback | Revert migration | Revert TS |

---

## 6. Sửa nhỏ gộp chung (cho các luồng PASS_WITH_MINOR_UI_FIX)

| Luồng | Sửa |
|---|---|
| F01 | Bắt và log `error` của 7 truy vấn dashboard thay vì bỏ qua; hiện dải "Không tải được một số mục" khi có lỗi |
| F05 | Chỉ hiện link `/admin` khi `role === "super_admin"`; các vai trò khác hiện "Liên hệ ban quản trị để mở năm học mới" |
| F06 | Bỏ lần gọi `requireRouteAccess` thứ hai (`queries.ts:66` chạy lại bên trong `:147`) |
| F09 | Chặn `pdfResponse` khi `headers.length === 0` → trả 422 thay vì để pdfmake ném lỗi |
| F12 | Thêm nút "PDF" cho bản chốt (route đã hỗ trợ) |
| Chung | Bảng preview thêm `<caption class="sr-only">` và `scope="col"`; nút chốt thêm `aria-busy={pending}`; vùng kết quả thêm `aria-live="polite"` |
