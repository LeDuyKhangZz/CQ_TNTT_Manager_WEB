# M02 — ACADEMIC STRUCTURE · Audit Results

Thang điểm mỗi tiêu chí 1–5, tổng **/75**.

Ký hiệu tiêu chí:
`C1` đúng nghiệp vụ · `C2` dễ hiểu · `C3` số bước hợp lý · `C4` không nhập trùng · `C5` khó thao tác nhầm ·
`C6` validation đầy đủ · `C7` trạng thái rõ ràng · `C8` phân quyền an toàn · `C9` dữ liệu nhất quán ·
`C10` dễ bảo trì · `C11` dễ mở rộng · `C12` UI hỗ trợ đúng nghiệp vụ · `C13` responsive ·
`C14` accessibility · `C15` khả năng kiểm thử.

## 1. Bảng tổng hợp

| ID | Tên luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| F01 | Tạo năm học (draft) | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 4 | 5 | 4 | 4 | 3 | 4 | 4 | 3 | **57** | NEEDS_IMPROVEMENT |
| F02 | Sinh 19 lớp mặc định | 2 | 2 | 4 | 5 | 2 | 2 | 1 | 4 | 3 | 4 | 3 | 2 | 4 | 3 | 3 | **44** | **CRITICAL** |
| F03 | Đặt năm học hiện hành | 3 | 4 | 5 | 5 | 3 | 4 | 3 | 5 | 5 | 4 | 4 | 3 | 4 | 3 | 2 | **57** | NEEDS_IMPROVEMENT |
| F04 | Cấu hình điểm danh năm học | 4 | 4 | 5 | 5 | 4 | 5 | 3 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 2 | **57** | NEEDS_IMPROVEMENT |
| F05 | Xem danh sách năm học | 4 | 3 | 5 | 5 | 5 | 5 | 2 | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 3 | **58** | PASS_WITH_MINOR_UI_FIX |
| F06 | Xem danh sách lớp theo ngành | 4 | 4 | 5 | 5 | 5 | 5 | 2 | 4 | 3 | 4 | 3 | 3 | 5 | 4 | 4 | **60** | PASS_WITH_MINOR_UI_FIX |
| F07 | Xem chi tiết lớp | 3 | 4 | 4 | 4 | 3 | 4 | 2 | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 4 | **52** | NEEDS_IMPROVEMENT |
| F08 | Sửa thông tin lớp (`updateClass`) | 2 | 1 | 1 | 5 | 5 | 5 | 1 | 4 | 2 | 3 | 3 | 1 | 1 | 1 | 3 | **38** | NEEDS_IMPROVEMENT |
| F09 | Đóng / lưu trữ năm học (WF-16) | 1 | 1 | 1 | 3 | 2 | 1 | 1 | 2 | 1 | 2 | 2 | 1 | 1 | 1 | 1 | **21** | **CRITICAL** |
| F10 | Đổi năm học đang xem (switcher) | 1 | 2 | 5 | 5 | 4 | 5 | 1 | 5 | 5 | 4 | 2 | 1 | 2 | 3 | 3 | **48** | NEEDS_IMPROVEMENT |
| F11 | Danh mục ngành/cấp/mẫu lớp | 4 | 3 | 5 | 5 | 5 | 5 | 3 | 4 | 2 | 4 | 2 | 2 | 5 | 5 | 4 | **58** | NEEDS_CONFIRMATION |

Điểm trung bình module: **50,0/75**.

## 2. Lý do chấm điểm (rút gọn)

### F01 — Tạo năm học · 57 · NEEDS_IMPROVEMENT
- **Mạnh:** Zod + CHECK DB trùng khớp (`schemas.ts:5-16` ↔ `20260715000200:8,20,21`); `retention_until` tính tự động (`actions.ts:32`); trigger seed `attendance_weight_settings`/`assessment_type_settings` chạy ngay (`20260721000500:74-77`, `20260722000400:53-55`).
- **Yếu:** `createAcademicYearFromForm` trả `void`, mọi `AppError` bị nuốt (`actions.ts:146-156`) → C7/C12 thấp; `failure()` gán mọi lỗi không phải `AppError` thành `CONFLICT` nên lỗi Zod hiện ra như "xung đột" (`actions.ts:22-25`); không có kiểm client `endDate > startDate`.

### F02 — Sinh 19 lớp mặc định · 44 · **CRITICAL**
- **Yếu chí mạng:** `class_templates` rỗng ⇒ tạo 0 lớp, **trả về thành công** (`20260716000300:105-114`) — đã gây sự cố production (`WORKLOG.md:95-100`). `inserted=0` không phân biệt được "đã sinh rồi" với "template rỗng". Nút "Sinh lớp mặc định" hiển thị trên **mọi** năm kể cả `closed` (`admin/page.tsx:52`) và RPC không kiểm `status` (`20260716000300:101-103`).
- **Mạnh:** idempotent thật sự nhờ unique index (`20260715000200:102-103`, `20260716000300:42-43`), có pgTAP (`008:26-48`).

### F03 — Đặt năm học hiện hành · 57 · NEEDS_IMPROVEMENT
- **Mạnh:** chống race đúng cách (`for update` `20260715000200:245` + unique partial index `:24-25`); quyền hẹp đúng (SA/XĐT, `permissions.ts:22-28`, `20260715000200:241`).
- **Yếu:** WF-01 bước 8 yêu cầu "chỉ khi dữ liệu sẵn sàng mới đặt current" nhưng **không có tiền kiểm** (đủ 19 lớp? đã phân công nhân sự?); không có xác nhận trước hành động không thể hoàn tác (`closed` là một chiều); không có thông báo kết quả.

### F04 — Cấu hình điểm danh · 57 · NEEDS_IMPROVEMENT
- **Mạnh:** Zod (`schemas.ts:22-29`) khớp CHECK (`20260721000500:19-24`); quy đổi `%`↔0..1 có chú thích (`actions.ts:121-122`); empty state đúng (`admin/page.tsx:121-124`).
- **Yếu:** `.update().eq()` không `.select()` → RLS chặn hoặc id sai vẫn trả `ok:true` (`actions.ts:114-129`); mâu thuẫn quyền: `requireAcademicWrite` cho `secretary`/`deputy` nhưng RLS WITH CHECK từ chối họ trên năm `current` (`20260715000200:294`).

### F05 — Danh sách năm học · 58 · PASS_WITH_MINOR_UI_FIX
- Chỉ vấn đề trình bày: badge in `draft/current/closed` (`admin/page.tsx:49`), ngày ISO thô (`:47`), `19` hardcode (`:47`). Lỗi query trả `[]` (`queries.ts:19`) khiến "lỗi" trông giống "rỗng".

### F06 — Danh sách lớp · 60 · PASS_WITH_MINOR_UI_FIX
- Lọc năm học đúng, phân nhóm ngành đúng, empty state đúng, responsive có E2E (`tests/e2e/responsive.spec.ts:100-101`). Trừ điểm: không hiển thị trạng thái lớp; thiếu "tỷ lệ chuyên cần gần nhất" và "buổi tiếp theo" mà `docs/06-ui-ux-spec.md:255-262` yêu cầu; "Sĩ số: 0" gây hiểu nhầm với role không được đọc enrollment.

### F07 — Chi tiết lớp · 52 · NEEDS_IMPROVEMENT
- `getClassDetail` không ràng buộc năm học (`classes/server/queries.ts:127-134`) ⇒ mở được lớp năm cũ và **form ghi danh vẫn hiện**. `availableStudents` kéo toàn bộ bảng `students` (`:168`) rồi lọc phía Node — không mở rộng được. Thông điệp "Lớp chưa có thiếu nhi ghi danh" hiển thị cả khi thực chất là bị chặn quyền.
- Điểm cộng: `notFound()` đúng cho UUID sai (`page.tsx:19`, E2E `security.spec.ts:50-51`).

### F08 — `updateClass` không có UI · 38 · NEEDS_IMPROVEMENT
- Action + Zod whitelist viết đúng và có unit test (`tests/unit/academic-year-schemas.test.ts:26-35`) nhưng **không call site nào**. Không có cách nào đóng một lớp, ghi phòng học hay ghi chú qua giao diện, dù `docs/11-api-and-server-actions.md:36` liệt kê là action bắt buộc.
- C13/C14 chấm 1 vì **không có UI để đánh giá**, không phải vì UI kém.

### F09 — Đóng / lưu trữ năm học · 21 · **CRITICAL**
- WF-16 (`docs/03-workflow.md:335-341`) **chưa được cài bất kỳ bước nào**. Trạng thái `archived` chưa bao giờ được ghi. Không có chốt chặn "không cho ghi mới sau khi đóng" — sau khi năm A thành `closed`, `enrollments`/`classes`/attendance của năm A vẫn ghi được vì RLS không đọc `academic_years.status`.

### F10 — Academic year switcher · 48 · NEEDS_IMPROVEMENT
- **Không rò dữ liệu năm khác** (C9 = 5): không có cơ chế chuyển năm, mọi query neo `status='current'`.
- Nhưng chuỗi "Năm học 2026–2027" hardcode (`academic-year-switcher.tsx:7`) sẽ **hiển thị sai** ngay khi năm hiện hành đổi; `aria-label` còn ghi "dữ liệu mẫu" và đọc lên cho người dùng screen reader (`:5`). Ẩn ở <640px (`:5`) nên người dùng mobile không có bất kỳ chỉ báo năm học nào.

### F11 — Danh mục ngành/cấp/mẫu lớp · 58 · NEEDS_CONFIRMATION
- Read-only là **hợp lý** với quyết định đã chốt (5 ngành, 19 lớp cố định) — không đề xuất mở UI sửa.
- Cần xác nhận 2 điểm: (a) `supabase db push` không chạy `seed.sql` (`WORKLOG.md:93`) nên môi trường mới rỗng; (b) `sectors`/`grade_levels` cho `guardian`/`student` đọc (`20260715000200:297-300`) trong khi `docs/05-permission-matrix.md:35` ghi "Năm học ❌" cho hai role này.

---

## 3. Phân tích 5 Whys

### 5W-F02 — Sinh 19 lớp mặc định báo thành công khi không tạo lớp nào

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Deploy production: 27/27 migration OK, đăng nhập được, nhấn "Sinh lớp mặc định" không báo lỗi, nhưng `/classes` rỗng (`WORKLOG.md:95-98`). |
| **Điểm đau** | Người vận hành **không có tín hiệu nào** để biết hệ thống đang ở trạng thái không dùng được; họ phải suy luận ngược từ trang `/classes` trống. |
| **Nguyên nhân trực tiếp** | `insert ... select from class_templates` trên bảng rỗng chèn 0 dòng; `get diagnostics row_count` = 0; hàm `return 0` thay vì `raise exception` (`20260716000300:105-116`). Server action coi mọi giá trị trả về là thành công (`actions.ts:81`) và adapter form vứt kết quả (`actions.ts:162-164`). |
| **Nguyên nhân gốc** | Thiết kế trộn hai ngữ nghĩa khác nhau vào **một** giá trị trả về: "0 vì đã sinh rồi (idempotent, đúng)" và "0 vì không có gì để sinh (sai cấu hình, hỏng)". Đồng thời, **điều kiện tiên quyết** (`class_templates` phải có 19 dòng active) không được kiểm ở bất kỳ đâu: không ở migration (seed cố ý tách ra), không ở RPC, không ở action, không ở UI. |
| **Hậu quả** | **Nghiệp vụ:** không lớp ⇒ không ghi danh, không điểm danh, không giáo án, không điểm — hệ thống chết lâm sàng. **Dữ liệu:** năm học có thể bị đặt `current` với 0 lớp, sau đó import Excel sẽ fail hàng loạt vì không ánh xạ được tên lớp. **Phân quyền:** không ảnh hưởng. **UX:** người vận hành mất niềm tin và có xu hướng bấm lại nhiều lần (vô hại nhưng vô ích). |

### 5W-F09 — WF-16 (đóng/lưu trữ năm học) không tồn tại

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Không có nút/action nào đóng hay lưu trữ năm học; enum `archived` không bao giờ được ghi. |
| **Điểm đau** | Sau khi năm học kết thúc, dữ liệu vẫn "mở": vẫn ghi danh được, vẫn sửa được, không có mốc chốt sổ. |
| **Nguyên nhân trực tiếp** | Việc chuyển `current → closed` chỉ là **tác dụng phụ** của `set_current_academic_year` (`20260715000200:253-255`); không ai viết action `closeAcademicYear`/`archiveAcademicYear`, và `docs/11-api-and-server-actions.md:31-37` cũng chỉ liệt kê `updateAcademicYear` (cũng chưa có). |
| **Nguyên nhân gốc** | Vòng đời năm học được mô hình hóa bằng enum 4 giá trị nhưng **chỉ 3 chuyển tiếp được cài** (`→draft`, `draft→current`, `current→closed`), và **không có bất biến nào ràng buộc dữ liệu nghiệp vụ theo `status` của năm**: mọi RLS/trigger của `classes`, `enrollments`, `attendance_*`, `assessments` đều bỏ qua `academic_years.status`. Trạng thái năm học là *nhãn hiển thị*, không phải *cơ chế điều khiển*. |
| **Hậu quả** | **Nghiệp vụ:** WF-16 bước 5 ("không cho ghi mới trừ Super Admin") không được đảm bảo; báo cáo năm cũ có thể đổi sau khi đã chốt. **Dữ liệu:** enrollment mở của năm cũ tồn tại vô thời hạn ⇒ `class_scoped_student_ids()` (`20260721000200:83-90`) tiếp tục cấp quyền đọc cho GLV năm cũ. **Phân quyền:** đây là **rò rỉ phạm vi theo thời gian** — GLV nghỉ dạy nhưng role assignment còn active vẫn đọc được hồ sơ. **UX:** không có mốc "kết thúc năm" nên người dùng không biết khi nào ngừng thao tác. |

### 5W-F08 — `updateClass` viết xong nhưng không có UI

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Không đóng được lớp, không ghi được phòng học/ghi chú lớp qua giao diện. |
| **Điểm đau** | Lớp bị hủy giữa năm (ví dụ gộp Ấu 1A và 1B) vẫn hiện trên `/classes` như lớp đang hoạt động. |
| **Nguyên nhân trực tiếp** | `src/features/classes/` **chỉ có `server/queries.ts`** — không có `schemas.ts`, không có `server/actions.ts`, không có component; action lại nằm ở `features/academic-years/server/actions.ts:87-105`. |
| **Nguyên nhân gốc** | Ranh giới feature bị đặt sai: "lớp" bị coi là phần phụ của "năm học" ở tầng ghi, nhưng là feature riêng ở tầng đọc. Không có ai sở hữu màn hình "quản trị lớp", nên action mồ côi. |
| **Hậu quả** | **Nghiệp vụ:** trạng thái lớp trong DB không bao giờ khác `active`; `enrollments_validate` (`20260716000500:52-54`) chặn ghi danh vào lớp không active — luật đúng nhưng không bao giờ kích hoạt được một cách chủ động. **Dữ liệu:** `meeting_location`, `notes` luôn NULL. **UX:** người dùng phải nhờ dev chạy SQL. |

### 5W-F10 — Academic year switcher là stub hardcode

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Header luôn in "Năm học 2026–2027", nút `disabled`, `aria-label` chứa chữ "dữ liệu mẫu" (`academic-year-switcher.tsx:5-8`). |
| **Điểm đau** | Người dùng không biết mình đang xem dữ liệu của năm nào; khi sang năm học mới, nhãn sẽ **sai sự thật**. |
| **Nguyên nhân trực tiếp** | Component được dựng làm placeholder ở giai đoạn shell và chưa bao giờ được nối vào `academic_years`. |
| **Nguyên nhân gốc** | Hệ thống chưa quyết định "năm học đang xem" là một **khái niệm phiên làm việc** hay chỉ là "năm `current`". Hiện tại toàn bộ code chọn phương án thứ hai (mọi query dùng `status='current'`), nên switcher không có ngữ nghĩa để hiện thực — nhưng vẫn được để lại trong header. |
| **Hậu quả** | **Nghiệp vụ:** không xem được dữ liệu năm cũ ở bất kỳ màn hình nào (báo cáo lịch sử, roster năm trước). **Dữ liệu:** không rò rỉ (điểm tích cực). **Phân quyền:** không ảnh hưởng. **UX:** nhãn sai + `aria-label` lộ ngôn ngữ nội bộ ("dữ liệu mẫu") cho người dùng screen reader. |

### 5W-F07 — Chi tiết lớp không ràng buộc năm học

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | `/classes/{id-lớp-năm-cũ}` mở bình thường và hiển thị form "Ghi danh thiếu nhi". |
| **Điểm đau** | Người có quyền có thể vô tình ghi danh một em vào lớp của năm học đã đóng. |
| **Nguyên nhân trực tiếp** | `getClassDetail` truy vấn theo `id` duy nhất (`classes/server/queries.ts:127-134`); `enrollStudent` lấy `academic_year_id` **từ chính lớp đó** (`enrollments/server/actions.ts:49`) nên ghi danh vào năm cũ là hợp lệ với mọi ràng buộc DB. |
| **Nguyên nhân gốc** | Không có khái niệm "năm học đang làm việc" ở tầng ứng dụng (xem 5W-F10). Trang danh sách lọc `status='current'` nhưng trang chi tiết không, tạo ra **hai định nghĩa phạm vi khác nhau trong cùng một module**. |
| **Hậu quả** | **Nghiệp vụ:** dữ liệu năm cũ bị sửa sau khi đã chốt. **Dữ liệu:** enrollment mới trong năm `closed` phá vỡ giả định của báo cáo và của promotion. **Phân quyền:** không mở rộng quyền, nhưng mở rộng *phạm vi thời gian*. **UX:** người dùng không có tín hiệu nào cho biết đang xem lớp năm nào ngoài dòng chữ nhỏ ở `page.tsx:27`. |

### 5W-F01/F03/F04 (chung) — Mọi form quản trị đều không phản hồi kết quả

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Tạo năm học trùng mã, đặt hiện hành thất bại, lưu cấu hình bị RLS chặn — màn hình đều **im lặng như nhau**. |
| **Điểm đau** | Người dùng không biết thao tác thành công hay thất bại; phải tự đối chiếu danh sách. |
| **Nguyên nhân trực tiếp** | 4 adapter `*FromForm` khai báo `Promise<void>` và không dùng giá trị trả về (`actions.ts:135-164`); trang là Server Component thuần, không có `useActionState`/toast. |
| **Nguyên nhân gốc** | Chọn progressive-enhancement bằng `<form action={serverAction}>` **mà không kèm kênh phản hồi** (redirect kèm `searchParams`, cookie flash, hay client wrapper). Model lỗi `AppError`/`APP_ERROR_MESSAGES_VI` (`src/lib/errors/index.ts:20-36`) được xây rất kỹ nhưng **không có đường đi tới UI**. |
| **Hậu quả** | **Nghiệp vụ:** thao tác thất bại được hiểu nhầm là thành công (đặc biệt nguy hiểm với F02). **Dữ liệu:** không hỏng trực tiếp, nhưng che giấu tình trạng dữ liệu sai. **Phân quyền:** `FORBIDDEN` bị nuốt ⇒ không phân biệt được "không có quyền" với "hệ thống lỗi". **UX:** vi phạm nguyên tắc phản hồi cơ bản; toàn bộ từ điển thông báo tiếng Việt trở thành mã chết. |

### 5W-F11 — Danh mục tham chiếu không có ở môi trường mới

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | `sectors`/`grade_levels`/`class_templates` rỗng sau khi `supabase db push` lên project mới. |
| **Điểm đau** | Toàn bộ F02 sụp đổ (xem 5W-F02) và người vận hành không có manh mối. |
| **Nguyên nhân trực tiếp** | `supabase db push` **không chạy `supabase/seed.sql`** (`WORKLOG.md:93`); local che khuất vì `db reset` có chạy seed. |
| **Nguyên nhân gốc** | Dữ liệu **tham chiếu bất biến của nghiệp vụ** (5 ngành, 13 cấp, 19 mẫu lớp — đều là quyết định đã chốt, không bao giờ do người dùng nhập) bị xếp chung với **dữ liệu demo** trong `seed.sql`, thay vì đi cùng migration như một phần của schema. |
| **Hậu quả** | **Nghiệp vụ:** phụ thuộc vào một bước runbook thủ công (`docs/12` §4a bước 2b) — sai một lần là hỏng cả deployment. **Dữ liệu:** nguy cơ hai môi trường có UUID danh mục khác nhau nếu ai đó seed lại bằng cách khác. **Phân quyền:** không ảnh hưởng. **UX:** lỗi biểu hiện ở nơi rất xa nguyên nhân. |
