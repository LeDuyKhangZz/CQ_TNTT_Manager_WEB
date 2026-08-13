# M02 — ACADEMIC STRUCTURE · Acceptance Criteria

## 1. Tiêu chí Given/When/Then

### AC-M02-01 — Sinh lớp khi thiếu danh mục phải báo lỗi rõ ràng *(TB-F02, P0)*
- **Given** cơ sở dữ liệu không có dòng nào trong `class_templates` với `is_active = true`
- **And** tồn tại một năm học ở trạng thái `draft`
- **When** `super_admin` nhấn "Sinh lớp mặc định"
- **Then** hệ thống **không** tạo lớp nào
- **And** hiển thị thông điệp tiếng Việt nêu rõ nguyên nhân là thiếu danh mục lớp chuẩn
- **And** không có thông điệp thành công nào xuất hiện

### AC-M02-02 — Sinh lớp thành công cho biết đủ hay thiếu *(TB-F02, P0)*
- **Given** `class_templates` có đúng 19 dòng `is_active`
- **When** `super_admin` sinh lớp cho một năm học chưa có lớp
- **Then** `classes` của năm đó có đúng 19 dòng: 18 `catechism` + 1 `trainee` (`class_kind='trainee'`, `grade_level_id IS NULL`, `term_scope='semester_1'`)
- **And** UI hiển thị "19/19"
- **When** nhấn lần thứ hai
- **Then** vẫn đúng 19 dòng
- **And** UI phân biệt rõ "đã có đủ 19 lớp từ trước" với "vừa tạo 19 lớp"

### AC-M02-03 — Không sinh lớp cho năm đã đóng *(TB-F02, P1)*
- **Given** một năm học `status = 'closed'`
- **When** người dùng cố gọi `generateDefaultClasses` cho năm đó (kể cả qua Data API trực tiếp)
- **Then** thao tác bị từ chối với lỗi nghiệp vụ
- **And** UI không hiển thị nút "Sinh lớp mặc định" cho năm đó

### AC-M02-04 — Mọi thao tác ghi đều có phản hồi *(TB-F12, P0)*
- **Given** `super_admin` đang ở `/admin`
- **When** tạo năm học với mã đã tồn tại
- **Then** hiển thị thông điệp tiếng Việt tương ứng mã lỗi `CONFLICT`
- **When** tạo năm học hợp lệ
- **Then** hiển thị thông điệp thành công
- **And** điều này áp dụng cho **cả 4** thao tác: tạo năm học, sinh lớp, đặt hiện hành, lưu cấu hình điểm danh

### AC-M02-05 — Chỉ một năm học `current` *(BR-M02-06, P0 — hiện đã PASS, phải giữ)*
- **Given** năm học A đang `current`
- **When** đặt năm học B thành hiện hành
- **Then** A chuyển sang `closed` và B thành `current` trong cùng một transaction
- **And** truy vấn `select count(*) from academic_years where status='current'` luôn trả 1
- **And** khi hai request đặt hiện hành chạy đồng thời, không có trạng thái nào có 2 năm `current`

### AC-M02-06 — Đóng năm học có tiền kiểm và xác nhận *(TB-F09, P0)*
- **Given** năm học `current` còn N ghi danh trạng thái `active`/`paused`
- **When** `super_admin` chọn "Đóng năm học"
- **Then** hệ thống hiển thị checklist gồm số ghi danh còn mở, số bảng điểm chưa khóa
- **And** yêu cầu nhập lại mã năm học để xác nhận
- **When** mã xác nhận không khớp
- **Then** thao tác bị từ chối với `VALIDATION_ERROR`

### AC-M02-07 — Năm học đã đóng không nhận ghi mới *(TB-F09 giai đoạn 2, P0)*
- **Given** năm học X có `status = 'closed'`
- **When** một tài khoản `secretary` (global-write) cố INSERT `enrollments` cho một lớp thuộc năm X **qua Supabase client trực tiếp với JWT thật**
- **Then** thao tác bị RLS từ chối (0 dòng hoặc lỗi 42501)
- **When** `super_admin` thực hiện cùng thao tác
- **Then** thành công

### AC-M02-08 — Chi tiết lớp năm cũ là chỉ đọc *(TB-F07, P1)*
- **Given** một lớp thuộc năm học `closed`
- **When** người có quyền global-write mở `/classes/{id}` của lớp đó
- **Then** trang hiển thị rõ năm học và trạng thái "đã đóng — chỉ đọc"
- **And** form "Ghi danh thiếu nhi" và form "Kết thúc" không hiển thị
- **And** nếu gọi thẳng `enrollStudent` cho lớp đó, action trả lỗi

### AC-M02-09 — Header hiển thị đúng năm học hiện hành *(TB-F10, P1)*
- **Given** năm học `current` có mã `2027-2028`
- **When** bất kỳ người dùng nào đăng nhập
- **Then** header hiển thị `2027-2028`, không phải chuỗi cố định
- **And** khi chưa có năm nào `current`, header hiển thị cảnh báo "Chưa có năm học hiện hành"
- **And** `aria-label` không chứa cụm "dữ liệu mẫu"

### AC-M02-10 — Sửa lớp có UI và báo đúng kết quả *(TB-F08, P2)*
- **Given** người dùng global-write ở trang chi tiết lớp của năm hiện hành
- **When** đổi trạng thái lớp sang "Đã đóng" và lưu
- **Then** `classes.status` đổi và danh sách `/classes` hiển thị badge trạng thái
- **When** một người **không** đủ quyền gọi cùng action
- **Then** action trả `FORBIDDEN` — **không được trả `ok: true`** (chống lỗi no-op im lặng)

### AC-M02-11 — UUID sai không gây 500 *(hiện đã PASS, phải giữ)*
- **Given** người dùng staff đã đăng nhập
- **When** truy cập `/classes/khong-phai-uuid` hoặc `/classes/{uuid không tồn tại}`
- **Then** nhận HTTP 404, không phải 500
- *(Đã có E2E: `tests/e2e/security.spec.ts:48-51`)*

### AC-M02-12 — Danh mục tham chiếu có mặt ở mọi môi trường *(TB-F02/I3, P0)*
- **Given** một project Supabase hoàn toàn mới
- **When** chạy đúng quy trình migration của repo (không chạy `seed.sql` thủ công)
- **Then** `sectors` có 5 dòng, `grade_levels` có 13 dòng, `class_templates` có 19 dòng
- **And** UUID của các dòng này khớp với môi trường local

### AC-M02-13 — Ràng buộc cơ cấu lớp giữ nguyên *(hiện đã PASS, phải giữ)*
- Thiếu 3 không nhận `section_code` → lỗi `23514`
- Thiếu 1 không có `section_code` → lỗi `23514`
- Lớp thứ hai `class_kind='trainee'` trong cùng năm → lỗi `23505`
- Lớp trùng `(năm, cấp, section)` → lỗi `23505`
- *(Đã có pgTAP: `supabase/tests/008_canonical_classes_test.sql:52-76`)*

---

## 2. Tiêu chí bảo mật / phân quyền **phải xanh**

| # | Tiêu chí | Cách kiểm | Trạng thái hiện tại |
|---|---|---|---|
| SEC-M02-01 | `guardian`, `student` truy cập `/classes` và `/admin` → `/access-denied` | E2E direct URL | ✅ (`route-map.ts:27,47`) |
| SEC-M02-02 | Role không phải global-write gọi thẳng RPC `generate_default_classes` bằng JWT thật → `42501` | pgTAP / integration với JWT | ✅ (`20260716000300:98-100`) |
| SEC-M02-03 | Role không phải SA/XĐT gọi `set_current_academic_year` → `42501` | pgTAP | ✅ (`20260715000200:241-243`) |
| SEC-M02-04 | Người dùng không thể tự đặt `updated_by` khác `auth.uid()` khi ghi `academic_years`/`classes` | pgTAP negative | ✅ (`20260715000200:284,309,313`) |
| SEC-M02-05 | Không role nào (kể cả SA) INSERT/UPDATE được `sectors`/`grade_levels`/`class_templates` qua Data API | pgTAP negative | ✅ (`20260715000200:270` chỉ `select`) |
| SEC-M02-06 | Không role nào DELETE được `academic_years`/`classes` | pgTAP negative | ✅ (không có grant `delete`) |
| SEC-M02-07 | Sau khi đóng năm, chỉ SA ghi được vào dữ liệu năm đó | pgTAP + integration JWT | ❌ **Chưa có** — TB-F09 |
| SEC-M02-08 | Trưởng ngành chỉ đọc lớp/hồ sơ **của năm học được phân công** | integration JWT nhiều năm | ❌ **Chưa có** — BR-M02-49, I10 |
| SEC-M02-09 | `guardian`/`student` truy vấn thẳng bảng `classes`/`academic_years` qua Supabase client chỉ thấy phạm vi của mình | integration JWT | ❌ **Đang rộng hơn matrix** — BR-M02-19/31/44 |
| SEC-M02-10 | Ba tầng quyền cho "Năm học" (matrix / route / RLS) khớp nhau | rà tài liệu + E2E | ❌ **Đang lệch** — BR-M02-15/16 |
| SEC-M02-11 | Middleware không authorize; mọi trang tự guard | rà mã | ✅ (`src/lib/auth/guards.ts:17-21`, mọi query gọi `requireRouteAccess`) |
| SEC-M02-12 | Không lộ SQL/stack ra UI khi lỗi | rà `AppError` | ✅ (`src/lib/errors/index.ts:39-47`) — nhưng hiện **không hiển thị gì cả**, cần giữ tính chất này khi làm I1 |

**Điều kiện bàn giao:** SEC-M02-01…06 và SEC-M02-11…12 phải xanh (đã xanh, **không được làm hỏng**); SEC-M02-07…10 là mục tiêu của các hạng mục To-Be tương ứng.

---

## 3. Tiêu chí hồi quy (không được làm hỏng)

| # | Đang PASS — phải giữ |
|---|---|
| R1 | pgTAP `002` (19 assertion) và `008` (13 assertion) tiếp tục xanh sau mọi migration mới |
| R2 | `/classes` chỉ hiển thị lớp của năm `current` (`classes/server/queries.ts:75`) |
| R3 | Sinh lớp idempotent — chạy nhiều lần không tạo trùng |
| R4 | Đặt hiện hành chống race bằng `for update` + unique partial index |
| R5 | Toàn bộ trang của module không tràn ngang và tap target ≥44px ở 360/768/1366 (`tests/e2e/responsive.spec.ts:100-128`) |
| R6 | Zod whitelist của `updateClass` không cho sửa `academic_year_id`/`grade_level_id`/`display_name` (`tests/unit/academic-year-schemas.test.ts:26-35`) |
| R7 | Trigger seed `attendance_weight_settings` và `assessment_type_settings` vẫn chạy khi tạo năm học mới |

---

## 4. Câu hỏi NEEDS_CONFIRMATION (phải trả lời trước khi code)

| Mã | Câu hỏi | Vì sao cần | Bằng chứng |
|---|---|---|---|
| **Q-M02-01** | Xứ đoàn trưởng / Phó Xứ đoàn / Thư ký **có** được quản lý năm học và sinh lớp không? Nếu có thì phải mở route; nếu không thì phải thu hẹp `requireAcademicWrite` về `super_admin`. | Ba tầng đang mâu thuẫn: matrix ✅ 4 role, route chỉ SA, RLS lại chặn `secretary`/`deputy` trên năm `current` | `docs/05-permission-matrix.md:35`; `route-map.ts:47`; `academic-years/server/permissions.ts:7-12`; `20260715000200:294` |
| **Q-M02-02** | "Lớp Dự trưởng chỉ hoạt động trong HK1" được xác định bằng gì? Hệ thống hiện **không có** mốc ngày kết thúc HK1. Cần thêm cột `semester_1_end_date` trên `academic_years`, hay HK1 chỉ là quy ước hành chính không cần enforce? | `term_scope='semester_1'` đang là dữ liệu chết | `docs/03-workflow.md:30`; `20260716000300:38`; `classes/page.tsx:65` |
| **Q-M02-03** | Ai được đóng năm học: chỉ Super Admin, hay cả Xứ đoàn trưởng? WF-16 bước 5 nói "không cho ghi mới trừ Super Admin" nhưng không nói ai được **thực hiện** việc đóng. | Quyết định quyền của TB-F09 | `docs/03-workflow.md:339` |
| **Q-M02-04** | Sau khi đóng năm học, Super Admin còn được ghi những gì? Toàn bộ (sửa điểm, sửa điểm danh) hay chỉ sửa lỗi hồ sơ? | Quyết định phạm vi ngoại lệ của RLS `year_is_writable` | `docs/03-workflow.md:339` |
| **Q-M02-05** | Trưởng/Phó ngành có được xem dữ liệu của **các năm học trước** trong ngành mình không? Hiện tại `scope_class_ids()` cho phép mọi năm. | Nếu "không", đây là lỗ hổng phạm vi cần vá (I10); nếu "có", cần ghi rõ vào docs/05 | `20260721000200:38-41`; `20260715000200:161-163` |
| **Q-M02-06** | Phụ huynh/Thiếu nhi có được đọc danh sách **tất cả** lớp và **tất cả** năm học qua API không? Matrix nói ❌/"lớp con"/"lớp mình", RLS hiện cho đọc hết. | Quyết định có siết RLS `classes_select_authenticated` / `academic_years_select_authenticated` hay sửa docs | `docs/05-permission-matrix.md:35-36`; `20260715000200:278-280,305-306` |
| **Q-M02-07** | Có được phép tạo lớp **ngoài** 19 lớp chuẩn không (ví dụ mở Ấu 1C khi sĩ số tăng)? Hiện không có UI và unique index cho phép về mặt kỹ thuật (chỉ cần khác section). | Quyết định có cần màn hình "thêm lớp" hay giữ hoàn toàn read-only | Quyết định đã chốt nói "19 lớp mặc định", không nói "tối đa 19" |
| **Q-M02-08** | Khi năm học kết thúc, các lớp của năm đó có tự động chuyển sang `status='closed'` không? | Ảnh hưởng TB-F08 và điều kiện của `enrollments_validate` (`20260716000500:52-54`) | `20260715000200:93` (mặc định `active`, không ai đổi) |
| **Q-M02-09** | `retention_until` (end_date + 5 năm) dùng để làm gì cụ thể ở v1: chỉ ghi nhận, hay chặn `archived` trước hạn, hay dùng cho tác vụ xóa có xác nhận? | `docs/03-workflow.md:340` nói "không tự động xóa ở v1" nhưng không nói cột này được dùng ra sao | `actions.ts:32`; `20260715000200:16,21` |
