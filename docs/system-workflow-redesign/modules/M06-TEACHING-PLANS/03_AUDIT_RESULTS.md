# M06-TEACHING-PLANS — 03. Kết quả audit

## 1. Bộ 15 tiêu chí (thang 1–5)

| Mã | Tiêu chí |
|---|---|
| C01 | Đúng nghiệp vụ |
| C02 | Dễ hiểu |
| C03 | Số bước hợp lý |
| C04 | Không nhập trùng |
| C05 | Khó thao tác nhầm |
| C06 | Validation đầy đủ |
| C07 | Trạng thái rõ ràng |
| C08 | Phân quyền an toàn |
| C09 | Dữ liệu nhất quán |
| C10 | Dễ bảo trì |
| C11 | Dễ mở rộng |
| C12 | UI hỗ trợ đúng nghiệp vụ |
| C13 | Responsive |
| C14 | Accessibility |
| C15 | Khả năng kiểm thử |

## 2. Bảng điểm theo luồng

| Luồng | C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| F01 Tạo kế hoạch | 5 | 4 | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | **66** | PASS_WITH_MINOR_UI_FIX |
| F02 Đổi tên kế hoạch | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **65** | PASS |
| F03 Thêm mục giáo án | 5 | 4 | 3 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 4 | 4 | 5 | **63** | PASS_WITH_MINOR_UI_FIX |
| F04 Sửa mục / đổi người dạy | 5 | 4 | 3 | 5 | 3 | 4 | 3 | 5 | 3 | 4 | 4 | 3 | 4 | 4 | 3 | **57** | NEEDS_IMPROVEMENT |
| F05 Xóa mục | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 5 | **67** | PASS |
| F06 Upload tài liệu | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 5 | **66** | PASS_WITH_MINOR_UI_FIX |
| F07 Gỡ tài liệu | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | **68** | PASS |
| F08 Signed URL 60 s | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | **67** | PASS_WITH_MINOR_UI_FIX |
| F09 Hub giáo án | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 5 | 4 | 4 | **66** | PASS_WITH_MINOR_UI_FIX |
| F10 Chi tiết list/tháng | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 3 | 4 | 4 | 4 | **62** | PASS_WITH_MINOR_UI_FIX |
| F11 Lịch 7 ngày tới | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | **72** | PASS |

**Trạng thái module: `PASS_WITH_MINOR_UI_FIX`** (một luồng `NEEDS_IMPROVEMENT`, không có `CRITICAL`).

## 3. Lý do trừ điểm (theo tiêu chí)

### C02 / C06 — thông điệp validation bị nuốt

`failure()` chỉ giữ `message` khi lỗi là `AppError`; mọi `ZodError` rơi vào nhánh mặc định
`{ code: 'CONFLICT', message: 'Không thể lưu giáo án. Vui lòng thử lại.' }`
(`src/features/teaching-plans/server/actions.ts:31-34`). Kết quả: các thông điệp đã viết sẵn trong
schema như `"Bài học phải có người dạy."` (`schemas.ts:41`) **không bao giờ hiển thị**.
Tương tự, `mapDatabaseError` không xử lý `23514`, nên `TEACHING_PLAN_DATE_OUTSIDE_YEAR` và
`TEACHING_PLAN_TEACHER_OUT_OF_CLASS` đều hiện "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."
(`actions.ts:36-41`).

### C02 — thông điệp `23505` sai ngữ cảnh (F01)

`mapDatabaseError` gán cứng `"Ngày này đã có một mục giáo án."` cho mọi `23505`
(`actions.ts:38`). Xung đột `teaching_plans_class_id_key` (2 người cùng tạo kế hoạch) cũng hiện
thông điệp về "ngày".

### C03 / C12 — form 12 trường một khối (F03/F04)

`ItemFields` render 12 trường phẳng trong `grid md:grid-cols-2` (`teaching-plan-editor.tsx:58-89`),
không nhóm, không thu gọn phần tùy chọn. Trên 360 px thành 12 ô dọc liên tiếp; GLV chỉ cần điền
"ngày + tên bài + người dạy" vẫn phải cuộn qua toàn bộ. `docs/06 §11` yêu cầu
"Row inline edit trên desktop / Mobile dùng form drawer" — cả hai đều chưa có.

### C05 / C06 — dropdown người dạy không lọc theo ngày (F03/F04)

`getTeachingPlanDetail` chỉ lọc `is_active` (`queries.ts:203-207`), trong khi trigger DB đòi
`starts_on <= planned_date <= ends_on` (`20260722000100_teaching_plans.sql:125-135`). Người dùng
chọn được nhân sự đã hết nhiệm kỳ rồi bị từ chối bằng thông điệp chung.

### C07 / C09 / C15 — không phát hiện chỉnh sửa đồng thời (F04)

`updateTeachingPlanItem` ghi đè toàn bộ payload theo `id` (`actions.ts:204-207`), không so
`updated_at`/version. Hai người có quyền (đại diện + global-write) mở cùng một mục thì bản lưu sau
xóa sạch thay đổi của bản lưu trước, **không có cảnh báo và không có audit trail**
(`teaching_plan_items` chỉ có `updated_by`, không có bảng lịch sử).

### C08 — action tải tệp dựa hoàn toàn vào RLS (F08)

`createTeachingMaterialUrl` không gọi `canManageTeachingClass`/`requireRouteAccess` theo lớp
(`actions.ts:328-345`), khác với mọi action khác trong module và khác yêu cầu `docs/11 §7`.
Hiện tại vẫn an toàn nhờ 2 lớp RLS (bảng + storage), nhưng là điểm gãy một-lớp.

### C08 / C09 — `can_access_class` bỏ sót `class_staff_assignments`

`app.can_access_class` chỉ xét `can_global_read() OR current_class_id = X OR sector`
(`20260715000200_academic_structure.sql:183-202`), trong khi
`app.is_class_representative` **có** xét `class_staff_assignments`
(`20260715000400_staff_and_class_assignments.sql:222-241`).
Hệ quả: nhân sự là đại diện lớp Y qua `class_staff_assignments` nhưng `role_assignments.class_id = X`
sẽ **ghi được nhưng không đọc được** giáo án lớp Y (`teaching_plans_select_staff_scope` dùng
`can_access_class` — `20260722000100:167`, `:184`). `INSERT ... RETURNING` trong
`ensureTeachingPlan` (`actions.ts:107-116`) sẽ hỏng ở đúng cấu hình này.
So sánh: module M07 tránh được vì mọi policy select đều thêm `or app.is_class_staff(class_id)`
(`20260722000400_assessments_gradebooks.sql:519-533`).

### C12 — empty state thiếu (F09)

`page.tsx:18` trả `null` khi `data.classes.length === 0`; staff không phụ trách lớp nào không thấy
thông báo nào dưới card "7 ngày sắp tới".

### C08 (nhẹ) — route chi tiết không chặn audience (F10)

`route-map.ts:30` khai báo `/teaching-plan` không giới hạn role, nên guardian/student mở thẳng
`/teaching-plan/{classId}` vẫn render khung trang (dữ liệu rỗng nhờ RLS).

### C14 — accessibility (F06)

`<input type="file">` chỉ được bọc bằng `<label>` với `<span>` (`teaching-plan-editor.tsx:273-275`),
không có `id`/`htmlFor`, không có `aria-describedby` trỏ tới dòng ghi chú "tối đa 5 MB" (`:280`).
Các nút "Sửa/Xóa/Tải xuống/Gỡ tệp" dùng `size="sm"` — cần kiểm lại chiều cao ≥ 44 px
(xem `06_UI_UX_RECOMMENDATIONS.md`).

### C15 — thiếu test (F04)

Không có test cho ghi đè đồng thời, cho người dạy hết hiệu lực, và cho cấu hình đại diện chéo lớp.

## 4. Phân tích 5 Whys

### 5 Whys — F04 `NEEDS_IMPROVEMENT`: ghi đè mù khi sửa mục giáo án

1. **Vì sao thay đổi của một GLV bị mất?**
   Vì `updateTeachingPlanItem` ghi `UPDATE ... WHERE id = ?` với toàn bộ 12 trường lấy từ form.
2. **Vì sao ghi toàn bộ trường?**
   Vì UI dùng một form duy nhất cho cả tạo và sửa (`ItemForm` dùng chung `ItemFields`), payload luôn đầy đủ.
3. **Vì sao không phát hiện được bản ghi đã đổi?**
   Vì client không giữ `updated_at` của bản đang sửa và server không so sánh trước khi ghi.
4. **Vì sao không có cơ chế đó?**
   Vì thiết kế giả định "một lớp chỉ có một đại diện chỉnh giáo án", nên xung đột được coi là không xảy ra
   (`comment on table public.teaching_plans` nhấn mạnh "không có approval hoặc version workflow" — `20260722000100:236`).
5. **Vì sao giả định đó không đủ?**
   Vì `app.can_manage_teaching_plan` còn cho toàn bộ nhóm global-write (`super_admin`, XĐ trưởng, phó, thư ký)
   ghi vào mọi lớp (`20260722000100:146-158`), nên tập người ghi thực tế lớn hơn 1 và
   `revalidatePath` không đồng bộ tab đang mở.

→ **Nguyên nhân gốc**: phạm vi người ghi rộng hơn giả định thiết kế, trong khi tầng ghi không có
kiểm tra phiên bản.

### 5 Whys — thông điệp lỗi chung chung (ảnh hưởng F01, F03, F04, F06)

1. **Vì sao người dùng luôn thấy "Không thể lưu giáo án. Vui lòng thử lại."?**
   Vì `failure()` chỉ đọc `message` từ `AppError`.
2. **Vì sao `ZodError` không được chuyển thành `AppError`?**
   Vì action gọi `schema.parse()` (ném) thay vì `safeParse()` rồi ánh xạ `issues`.
3. **Vì sao chọn `parse()`?**
   Vì mẫu này được sao chép cho tất cả action trong repo để giữ code ngắn.
4. **Vì sao không có helper chung ánh xạ lỗi Zod?**
   Vì `src/lib/errors/index.ts` chỉ định nghĩa mã lỗi và câu tiếng Việt cố định, không có chỗ chứa lỗi theo field.
5. **Vì sao mô hình lỗi không có field-level?**
   Vì `docs/04 §9` định nghĩa error model ở mức mã ổn định, chưa yêu cầu `fieldErrors`.

→ **Nguyên nhân gốc**: mô hình lỗi toàn hệ thống thiếu tầng `fieldErrors`; đây là vấn đề
**cross-module**, không riêng M06.

### 5 Whys — `can_access_class` bỏ sót `class_staff_assignments`

1. **Vì sao đại diện chéo lớp không đọc được giáo án?** Vì policy select dùng `can_access_class`.
2. **Vì sao `can_access_class` không thấy họ?** Vì hàm chỉ xét `role_assignments.class_id` và sector.
3. **Vì sao hàm được viết như vậy?** Vì bản gốc (P1-T1) ra đời trước bảng `class_staff_assignments` (P1-T4).
4. **Vì sao không cập nhật khi có bảng mới?** Vì P1-T4 chỉ `create or replace` cho `is_class_staff` và
   `is_class_representative` (`20260715000400:202`, `:222`), bỏ qua `can_access_class`.
5. **Vì sao khác biệt không bị phát hiện?** Vì pgTAP 013 chỉ dựng fixture mà `role_assignments.class_id`
   trùng với `class_staff_assignments.class_id`, nên hai hàm luôn cho cùng kết quả.

→ **Nguyên nhân gốc**: hai định nghĩa "thuộc lớp" cùng tồn tại; fixture test không tách hai định nghĩa đó ra.
