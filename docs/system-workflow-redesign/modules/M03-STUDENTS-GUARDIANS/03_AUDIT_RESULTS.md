# M03 — STUDENTS & GUARDIANS · Audit Results

Ký hiệu tiêu chí:
`C1` đúng nghiệp vụ · `C2` dễ hiểu · `C3` số bước hợp lý · `C4` không nhập trùng · `C5` khó thao tác nhầm ·
`C6` validation đầy đủ · `C7` trạng thái rõ ràng · `C8` phân quyền an toàn · `C9` dữ liệu nhất quán ·
`C10` dễ bảo trì · `C11` dễ mở rộng · `C12` UI hỗ trợ đúng nghiệp vụ · `C13` responsive ·
`C14` accessibility · `C15` khả năng kiểm thử.

## 1. Bảng tổng hợp

| ID | Tên luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| F01 | Tạo người giám hộ | 4 | 4 | 4 | 1 | 3 | 3 | 3 | 4 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | **51** | NEEDS_IMPROVEMENT |
| F02 | Tạo hồ sơ thiếu nhi | 3 | 4 | 3 | 1 | 3 | 4 | 3 | 3 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | **49** | NEEDS_IMPROVEMENT |
| F03 | Xem danh sách thiếu nhi | 3 | 4 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 2 | 2 | 4 | 4 | 4 | **59** | NEEDS_IMPROVEMENT |
| F04 | Xem chi tiết thiếu nhi | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | **62** | PASS_WITH_MINOR_UI_FIX |
| F05 | Sửa hồ sơ thiếu nhi | 3 | 4 | 4 | 5 | 2 | 4 | 3 | 4 | 2 | 4 | 4 | 3 | 4 | 4 | 3 | **53** | NEEDS_IMPROVEMENT |
| F06 | Đổi trạng thái / lưu trữ hồ sơ | 2 | 2 | 3 | 5 | 2 | 3 | 2 | 4 | 1 | 3 | 3 | 2 | 4 | 4 | 2 | **42** | NEEDS_IMPROVEMENT |
| F07 | Nhập/sửa hồ sơ sức khỏe | 4 | 4 | 4 | 5 | 3 | 4 | 3 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **60** | PASS_WITH_MINOR_UI_FIX |
| F08 | Thêm bí tích | 3 | 4 | 4 | 4 | 3 | 4 | 3 | 5 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | **55** | NEEDS_IMPROVEMENT |
| F09 | Ghi danh thiếu nhi vào lớp | 4 | 4 | 4 | 5 | 3 | 4 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 4 | 4 | **56** | NEEDS_IMPROVEMENT |
| F10 | Kết thúc ghi danh | 1 | 2 | 4 | 4 | 1 | 1 | 1 | 5 | 2 | 3 | 2 | 1 | 3 | 3 | 2 | **35** | **CRITICAL** |
| F11 | Xem lịch sử ghi danh | 4 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **64** | **PASS** |
| F12 | Quản lý người giám hộ | 1 | 1 | 1 | 2 | 5 | 4 | 1 | 4 | 2 | 3 | 2 | 1 | 1 | 1 | 2 | **31** | NEEDS_IMPROVEMENT |
| F13 | Cảnh báo trùng gần đúng (WF-03 b4) | 1 | 1 | 3 | 1 | 2 | 1 | 1 | 5 | 2 | 3 | 4 | 1 | 1 | 1 | 2 | **29** | **CRITICAL** |

Điểm trung bình module: **49,7/75**.

## 2. Lý do chấm điểm

### F01 — Tạo guardian · 51 · NEEDS_IMPROVEMENT
- **Yếu nhất C4 = 1:** không có bất kỳ kiểm trùng nào (tên, SĐT); `guardians` không có unique constraint nào ngoài `profile_id`. Với 900 em, việc tạo lặp guardian là chắc chắn xảy ra.
- `phone` chỉ kiểm độ dài (`guardians/schemas.ts:13`) — nhưng số điện thoại này về sau **trở thành username** của tài khoản phụ huynh (`src/features/auth/server/actions.ts:139`), nên dữ liệu rác ở đây lan sang M01.
- Không phản hồi kết quả (`guardians/server/actions.ts:72-79`).

### F02 — Tạo hồ sơ thiếu nhi · 49 · NEEDS_IMPROVEMENT
- **C4 = 1:** thiếu bước 4 của WF-03 (xem F13).
- **C3 = 3:** WF-03 mô tả một luồng liền; hiện phải đi qua 3–4 màn hình để hoàn tất một hồ sơ có lớp.
- **C8 = 3:** `docs/05-permission-matrix.md:38` cho Trưởng/Phó ngành và GLV quyền ✅📍 trên "Thiếu nhi"; code giới hạn ở 4 role global-write (`students/server/permissions.ts:10-15`). Chú thích trong mã nói sẽ mở ở "P2-T3" (`:7-9`) — P2-T3 đã xong (`20260716000500`) nhưng danh sách chưa được mở.
- **Điểm mạnh:** sinh mã `CQxxxx` bằng sequence ⇒ **không có race condition** (`20260716000100:8-10,36-37`).

### F03 — Danh sách thiếu nhi · 59 · NEEDS_IMPROVEMENT
- **C11/C12 = 2:** không phân trang, không lọc, không tìm kiếm với ~900 bản ghi; thiếu 4/8 cột và toàn bộ 5 filter mà `docs/06-ui-ux-spec.md:195-224` yêu cầu.
- **Điểm mạnh:** empty state dùng đúng ngôn ngữ phạm vi ("trong phạm vi của bạn" `students/page.tsx:36`), không lộ mã thiếu nhi (đúng spec), RLS lọc đúng.

### F04 — Chi tiết thiếu nhi · 62 · PASS_WITH_MINOR_UI_FIX
- **C8 = 5:** kiểm tra kỹ và không tìm thấy đường rò nào. Tab nhạy cảm bị chặn hai lớp (danh sách role `permissions.ts:21-33` + điều kiện render `page.tsx:243,315`), và tầng cuối là RLS **không có nhánh nào cho guardian/student** (`20260721000200:128-142`) — đã có pgTAP xác nhận (`006:98-99,109`; `010:99,110`).
- Trừ điểm C12: top card thiếu **Lớp hiện tại** và **GLV phụ trách** (`docs/06-ui-ux-spec.md:230-235`); truy cập `?tab=health` không có quyền cho ra trang trống không giải thích.

### F05 — Sửa hồ sơ · 53 · NEEDS_IMPROVEMENT
- **C9 = 2:** `.update().eq()` không `.select()` ⇒ RLS chặn cũng trả `ok:true` (`students/server/actions.ts:80-84`).
- **C5 = 2:** trường `status` (thao tác nghiệp vụ nặng) nằm chung nút "Lưu thay đổi" với các trường thông tin thường.
- Không đổi được guardian.

### F06 — Đổi trạng thái / lưu trữ · 42 · NEEDS_IMPROVEMENT
- **C9 = 1:** lưu trữ một em **không** đóng ghi danh của em đó; em vẫn nằm trong roster và vẫn được tính sĩ số (`classes/server/queries.ts:50,149`).
- **C1 = 2:** `docs/11-api-and-server-actions.md:52` yêu cầu action `archiveStudent` riêng biệt; hiện chỉ là một mục trong `<select>`.
- **Điểm mạnh:** không có hard delete ở bất kỳ đâu (không cấp `delete` `20260716000100:176-179`) — đúng yêu cầu.

### F07 — Hồ sơ sức khỏe · 60 · PASS_WITH_MINOR_UI_FIX
- `upsert` trên PK `student_id` là lựa chọn đúng, idempotent (`students/server/actions.ts:97-107`).
- Phân tách rõ chế độ đọc/ghi trong cùng tab (`[studentId]/page.tsx:322-350`).
- Trừ điểm: textarea không có `maxLength` khớp Zod 1000 ⇒ mất dữ liệu im lặng; không có lịch sử thay đổi cho dữ liệu y tế.
- **Ghi chú quyền:** matrix cho Trưởng/Phó ngành và GLV quyền ✅ (ghi) trên Sức khỏe/Bí tích (`docs/05-permission-matrix.md:39-40`); code chỉ cho **đọc**. Đây là hướng an toàn hơn matrix ⇒ không hạ điểm C8, nhưng phải chốt (Q-M03-02).

### F08 — Thêm bí tích · 55 · NEEDS_IMPROVEMENT
- **C1 = 3:** chỉ thêm được, **không sửa/xóa**; nhập sai một lần là vĩnh viễn. `docs/11:51` yêu cầu `upsertStudentSacrament`.
- Unique index chống trùng loại hoạt động đúng (`20260716000100:101-103`), nhưng lỗi bị nuốt nên trải nghiệm là "bấm không có gì xảy ra".

### F09 — Ghi danh · 56 · NEEDS_IMPROVEMENT
- **C4 = 5:** ràng buộc "một ghi danh mở/em/năm" được enforce đúng ở DB bằng unique partial index (`20260716000500:24-26`) — chốt chặn tốt nhất có thể.
- **C8 = 5:** `can_manage_class` giới hạn Trưởng ngành đúng ngành (`:66-87`), có pgTAP (`010:77-78`).
- **C11/C12 = 2:** `<select>` chứa toàn bộ em chưa ghi danh, không tìm kiếm; `availableStudents` kéo cả bảng `students` về Node rồi lọc (`classes/server/queries.ts:162-173`).
- Thiếu chặn ghi danh vào năm học đã đóng và vào em đã lưu trữ.

### F10 — Kết thúc ghi danh · 35 · **CRITICAL**
- **C6 = 1, C7 = 1, C1 = 1:** lựa chọn "Tạm nghỉ" trong UI **luôn vi phạm CHECK constraint** và thất bại im lặng (chi tiết 5W bên dưới).
- **C5 = 1:** nút "Kết thúc" đặt ngay cạnh tên từng em, không xác nhận.
- **C9 = 2:** "Chuyển" không tạo ghi danh mới và không ghi `previous_enrollment_id` (`20260716000500:13` chưa bao giờ có giá trị); RLS chặn vẫn trả `ok:true`.
- Không có luồng khôi phục (`resumeEnrollment` trong `docs/11:62` không tồn tại).

### F11 — Lịch sử ghi danh · 64 · **PASS**
- Luồng đọc đúng, nhãn tiếng Việt đầy đủ (`[studentId]/page.tsx:39-46`), ngày định dạng Việt (`formatDateVi`), RLS lọc đúng, empty state đúng. **Giữ nguyên, không đề xuất sửa.**
- Chỉ trừ C15 vì chưa có E2E riêng.

### F12 — Quản lý guardian · 31 · NEEDS_IMPROVEMENT
- Không có màn hình nào để sửa/xem/vô hiệu hóa guardian, dù `updateGuardian` đã viết xong (`guardians/server/actions.ts:49-70`).
- Nhập sai số điện thoại phụ huynh ⇒ không sửa được qua UI, mà số này là dữ liệu liên lạc khẩn cấp.
- C13/C14 = 1 vì **không có UI để đánh giá**.

### F13 — Cảnh báo trùng gần đúng · 29 · **CRITICAL**
- Vi phạm trực tiếp WF-03 bước 4 (`docs/03-workflow.md:92`).
- Nghịch lý: cùng dữ liệu, cùng bảng, nhưng đường Import **có** dedup 3 mức (`src/features/imports/server/actions.ts:127-132`) còn đường nhập tay **không có gì**.
- C11 = 4 vì hạ tầng tái sử dụng đã sẵn sàng (`src/features/imports/dedup.ts`, cột `normalized_full_name`, index `students_dedup_idx`).

---

## 3. Phân tích 5 Whys

### 5W-F10 — Lựa chọn "Tạm nghỉ" luôn thất bại trong im lặng

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | GLV chọn "Tạm nghỉ" cho một em, đặt ngày, bấm "Kết thúc". Trang tải lại, em **vẫn nằm nguyên trong roster**, không có thông báo lỗi. Thử lại nhiều lần đều như vậy. |
| **Điểm đau** | Người dùng không có cách nào biết thao tác đã thất bại; họ sẽ kết luận hệ thống hỏng hoặc tệ hơn — tin rằng đã tạm nghỉ và không xử lý tiếp. |
| **Nguyên nhân trực tiếp** | `endEnrollment` luôn ghi `ended_on` (`enrollments/server/actions.ts:76`) trong khi CHECK `enrollments_open_has_no_end` quy định `status in ('active','paused')` **phải** có `ended_on IS NULL` (`20260716000500_enrollments.sql:19-20`) ⇒ vi phạm `23514`. Lỗi được gói thành `VALIDATION_ERROR` (`:78`) rồi bị `endEnrollmentFromForm` vứt bỏ (`:95-101`). |
| **Nguyên nhân gốc** | Mô hình dữ liệu coi `paused` là **trạng thái MỞ** (nằm trong unique index "một ghi danh mở/năm" `:24-26`, nằm trong `OPEN_STATUSES` của tầng đọc `classes/server/queries.ts:7`), nhưng tầng ứng dụng lại xếp `paused` vào **danh sách trạng thái ĐÓNG** `CLOSE_ENROLLMENT_STATUSES` (`enrollments/schemas.ts:19-25`) và đưa vào UI của thao tác "Kết thúc" (`classes/[classId]/page.tsx:57`). **Hai tầng có hai định nghĩa trái ngược nhau cho cùng một giá trị enum**, và không có test nào bắt được vì luồng ghi của module không được test. |
| **Hậu quả** | **Nghiệp vụ:** không tạm nghỉ được — một trạng thái mục vụ có thật (em nghỉ dài ngày nhưng chưa rút). **Dữ liệu:** không hỏng (DB đã chặn đúng) — đây là điểm sáng duy nhất. **Phân quyền:** không ảnh hưởng. **UX:** thất bại im lặng lặp lại là kiểu lỗi phá hoại niềm tin nhanh nhất; hơn nữa cùng cơ chế "nuốt lỗi" cũng che luôn `DUPLICATE_ENROLLMENT` và `FORBIDDEN` của các thao tác kề bên. |

### 5W-F13 — Không có cảnh báo trùng khi nhập hồ sơ tay

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Nhập "Maria Nguyễn Thị A, 12/03/2015" hai lần tạo ra hai hồ sơ, hai mã `CQxxxx`, không có cảnh báo. |
| **Điểm đau** | Thư ký không có cách nào biết em đã có hồ sơ; điểm danh, điểm số, ghi danh sẽ tách đôi trên hai bản ghi. |
| **Nguyên nhân trực tiếp** | `createStudent` insert thẳng, không truy vấn kiểm tra trước (`students/server/actions.ts:34-52`). |
| **Nguyên nhân gốc** | Chức năng dedup được phát triển **thuộc về module Import** (P2-T4, `src/features/imports/dedup.ts`, `docs/09-data-import-and-seed.md:101-121`) chứ không thuộc về **miền `students`**. Vì thế nó chỉ chạy trên đường vào bằng Excel; đường vào bằng form tay — dù ghi vào đúng bảng đó, với đúng rủi ro đó — không được che. Hạ tầng dữ liệu (`normalized_full_name`, `students_dedup_idx`) đã được chuẩn bị đúng ngay từ `20260716000100:49,59` nhưng chưa được nối vào. |
| **Hậu quả** | **Nghiệp vụ:** hai hồ sơ cho một em ⇒ sĩ số sai, báo cáo sai, chuyển lớp có thể bỏ sót. **Dữ liệu:** trùng lặp **không thể gộp** vì không có chức năng merge và `students` không cho xóa. **Phân quyền:** không ảnh hưởng. **UX:** người nhập không được hỗ trợ ở đúng thời điểm cần nhất. |

### 5W-F06 — Lưu trữ hồ sơ không đồng bộ với ghi danh

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Đặt một em sang "Lưu trữ"; em vẫn xuất hiện trong roster lớp và vẫn được đếm vào sĩ số trên `/classes`. |
| **Điểm đau** | Sĩ số hiển thị sai; GLV vẫn thấy tên em trong danh sách điểm danh. |
| **Nguyên nhân trực tiếp** | `updateStudent` chỉ ghi `students.status` (`students/server/actions.ts:76`); mọi truy vấn roster lọc theo `enrollments.status` chứ không theo `students.status` (`classes/server/queries.ts:50,149`). |
| **Nguyên nhân gốc** | Hệ thống có **hai trục trạng thái độc lập** — `students.status` (danh tính) và `enrollments.status` (tham gia lớp) — nhưng **không có luật nào ràng buộc chúng**: không trigger, không action gộp, không tài liệu nêu rõ mối quan hệ. `docs/02-database-design.md` mô tả hai enum riêng biệt và không có phần nào nói khi nào chúng phải khớp. |
| **Hậu quả** | **Nghiệp vụ:** sĩ số và danh sách điểm danh sai. **Dữ liệu:** một em "đã lưu trữ" vẫn giữ ghi danh mở, chiếm chỗ unique index "một ghi danh mở/năm" ⇒ nếu em quay lại phải xử lý thủ công. **Phân quyền:** `class_scoped_student_ids()` (`20260721000200:83-90`) chỉ dựa vào enrollment mở ⇒ GLV **vẫn đọc được hồ sơ và dữ liệu sức khỏe** của em đã lưu trữ. **UX:** người dùng không nhận được cảnh báo "em này còn ghi danh đang mở". |

### 5W-F12 — Không có màn hình quản lý người giám hộ

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Nhập sai số điện thoại phụ huynh; không có nơi nào để sửa. |
| **Điểm đau** | Thông tin liên lạc khẩn cấp sai và không sửa được bằng giao diện. |
| **Nguyên nhân trực tiếp** | `updateGuardian` (`guardians/server/actions.ts:49-70`) không có call site; `src/features/guardians/` chỉ có `schemas.ts` + `server/actions.ts`, không có query, không có component. |
| **Nguyên nhân gốc** | Guardian được mô hình hóa như **phụ lục của student** chứ không phải một thực thể có vòng đời riêng: không có route `/guardians`, không có mục navigation (`src/config/navigation.ts:41-57`), không có `queries.ts`. Nhưng nghiệp vụ thì ngược lại — guardian có tài khoản đăng nhập, có nhiều con, có trạng thái active/inactive, và là đầu mối của toàn bộ M13 Portal. |
| **Hậu quả** | **Nghiệp vụ:** không sửa liên lạc, không vô hiệu hóa, không xem được "gia đình này có mấy em". **Dữ liệu:** guardian trùng tích tụ (xem F01) không có đường xử lý. **Phân quyền:** không ảnh hưởng. **UX:** ngõ cụt. |

### 5W-F01/F02 (chung) — Không kiểm trùng ở cả guardian lẫn student

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Cùng một gia đình được nhập nhiều lần; danh sách guardian trong `<select>` có nhiều dòng giống nhau. |
| **Điểm đau** | Người nhập chọn nhầm guardian; các em anh chị em bị gắn vào hai bản ghi phụ huynh khác nhau. |
| **Nguyên nhân trực tiếp** | `guardians` không có unique nào trên `(full_name, phone)`; `createGuardian` không truy vấn trước (`guardians/server/actions.ts:30-40`). |
| **Nguyên nhân gốc** | Quyết định (hợp lý) rằng **trùng tên là chuyện bình thường** (`docs/09-data-import-and-seed.md:10`) được diễn dịch thành "không kiểm gì cả", thay vì "cảnh báo mềm nhưng vẫn cho tiếp tục" như WF-03 bước 4 quy định. Ranh giới giữa *ràng buộc cứng* và *cảnh báo mềm* chưa được thiết lập ở tầng ứng dụng. |
| **Hậu quả** | **Nghiệp vụ:** dữ liệu gia đình phân mảnh, thông báo gửi thiếu. **Dữ liệu:** không gộp được. **Phân quyền:** guardian trùng mà chỉ một bản ghi có `profile_id` ⇒ phụ huynh đăng nhập chỉ thấy **một phần** số con của mình (`own_student_ids()` `20260721000200:101-106` join theo `guardian.profile_id`) — **đây là hệ quả phân quyền thật sự và dễ bị bỏ sót**. **UX:** danh sách chọn dài và mơ hồ. |

### 5W-F03 — Danh sách thiếu nhi không có tìm kiếm/lọc/phân trang

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | `/students` đổ toàn bộ ~900 card; muốn tìm một em phải Ctrl+F. |
| **Điểm đau** | Trên điện thoại 360px của GLV, đây là màn hình không dùng được. |
| **Nguyên nhân trực tiếp** | `getStudentsPageData` không nhận tham số và không có `range`/`ilike` (`students/server/queries.ts:28-33`). |
| **Nguyên nhân gốc** | Trang được dựng ở giai đoạn Phase 2 khi dữ liệu mẫu còn nhỏ, và **không có bài kiểm thử nào ràng buộc trải nghiệm ở quy mô thật** — perf smoke 900 em (`20260721000200:1-7`) chỉ đo thời gian truy vấn RLS chứ không đánh giá khả năng sử dụng. Đồng thời `docs/06-ui-ux-spec.md:195-224` (bảng + 5 filter + search) chưa bao giờ được đối chiếu lại. |
| **Hậu quả** | **Nghiệp vụ:** thư ký không tra cứu nhanh được. **Dữ liệu:** không hỏng. **Phân quyền:** không ảnh hưởng (RLS vẫn lọc đúng). **UX:** trang nặng, cuộn dài, không dùng được trên mobile — trái mục tiêu "360px là màn hình thật của giáo lý viên đứng lớp" (`tests/e2e/responsive.spec.ts:8`). |

### 5W-F05/F08 (chung) — Ghi thành công giả và không sửa được dữ liệu đã nhập

| Bậc | Nội dung |
|---|---|
| **Triệu chứng** | Sửa hồ sơ khi không đủ quyền → không có lỗi, không có thay đổi. Nhập sai bí tích → không sửa được. |
| **Điểm đau** | Người dùng tin rằng dữ liệu đã lưu; dữ liệu sai tồn tại vĩnh viễn. |
| **Nguyên nhân trực tiếp** | Mọi `UPDATE` trong module dùng `.update(...).eq("id", ...)` **không kèm `.select()`**; PostgREST trả 204/0 dòng khi RLS lọc hết, `error === null` ⇒ code kết luận thành công (`students/server/actions.ts:80-84`, `guardians/server/actions.ts:62-66`, `enrollments/server/actions.ts:74-80`). `createSacrament` chỉ có INSERT, không có action sửa. |
| **Nguyên nhân gốc** | Nhầm lẫn giữa "câu lệnh chạy không lỗi" và "thao tác nghiệp vụ đã xảy ra". Trong mô hình RLS, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải exception** — bài học này đã được ghi lại cho luồng *đọc* (`WORKLOG.md:101-103`: "Bảng rỗng trả `[]` giống hệt RLS chặn") nhưng chưa được áp dụng cho luồng *ghi*. |
| **Hậu quả** | **Nghiệp vụ:** thao tác thất bại được báo là thành công. **Dữ liệu:** phân kỳ giữa những gì người dùng tin và những gì DB có. **Phân quyền:** che giấu việc từ chối quyền — người vượt quyền không bị cảnh báo, và người **đúng quyền** bị chặn nhầm cũng không biết để báo lỗi. **UX:** không thể tự chẩn đoán. |
