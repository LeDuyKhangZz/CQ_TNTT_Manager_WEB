# M06-TEACHING-PLANS — 08. Tiêu chí nghiệm thu

## 1. Tiêu chí bảo mật — **bắt buộc xanh** (đang xanh, phải giữ xanh sau mọi thay đổi)

| # | Given / When / Then | Bằng chứng hiện có |
|---|---|---|
| SEC-01 | **Given** tài khoản `guardian` có con học lớp X **When** truy vấn trực tiếp `public.teaching_plan_items` **Then** trả về 0 dòng | `supabase/tests/013_teaching_plans_test.sql:153`; `014_*:63` |
| SEC-02 | **Given** tài khoản `student` **When** truy vấn `public.teaching_plans` **Then** 0 dòng | `013_*:155`; `014_*:83` |
| SEC-03 | **Given** guardian của lớp X **When** gọi `get_week_ahead_teaching_items` **Then** chỉ nhận mục của lớp X và **không** có cột `objectives`/`catechism_content`/`scripture_content`/`game`/`song`/`homework`/`note`/`material_*` | Chữ ký hàm `20260722000200_week_ahead_teaching.sql:9-18`; `014_*:62-79` |
| SEC-04 | **Given** guardian lớp B **When** gọi RPC **Then** không thấy `class_name` của lớp A | `014_*:79` |
| SEC-05 | **Given** người chưa đăng nhập hoặc không có role active **When** gọi RPC **Then** lỗi `42501 FORBIDDEN` | `20260722000200:25-27`; `014_*:87-91` |
| SEC-06 | **Given** `p_days` = 0 hoặc 32 **Then** lỗi `22023 INVALID_WEEK_RANGE` | `20260722000200:28-30` |
| SEC-07 | **Given** guardian/student **When** đọc `storage.objects` bucket `teaching-materials` **Then** 0 dòng | `015_*:96-98` |
| SEC-08 | **Given** GLV lớp khác **When** đọc/ghi object của lớp X **Then** 0 dòng đọc và predicate ghi = false | `015_*:93-94` |
| SEC-09 | **Given** guardian **When** gọi `createTeachingMaterialUrl(itemId)` của lớp con **Then** nhận `RESOURCE_NOT_FOUND`, **không** nhận signed URL | RLS `20260722000100:184` + `server/actions.ts:335-340`; E2E `tests/e2e/teaching-plan.spec.ts` (portal không thấy tên tệp) |
| SEC-10 | **Given** GLV lớp (không phải đại diện) **When** bấm "Sửa"/"Xóa"/upload **Then** UI không hiển thị nút, và nếu gọi thẳng action → `FORBIDDEN` | `013_*:128-135`; E2E xác nhận `GLV910` không có nút "Sửa" |
| SEC-11 | **Given** bucket `teaching-materials` **Then** `public = false`, `file_size_limit = 5242880`, `allowed_mime_types` chứa đúng allowlist | `015_*:6-8` |
| SEC-12 | **Given** đường dẫn object không đúng dạng `{uuid}/{uuid}/{file}` **Then** `app.can_manage_teaching_material` trả `false` (không ném lỗi) | `015_*:63`; `20260722000300:70-76` |

## 2. Nghiệm thu chức năng hiện hữu (regression)

| # | Given / When / Then |
|---|---|
| AC-01 | **Given** GLV đại diện lớp X chưa có kế hoạch **When** bấm "Tạo giáo án" với tên hợp lệ **Then** tạo đúng 1 `teaching_plans` với `academic_year_id` **suy từ lớp**, `created_by_staff_id` = staff của người bấm |
| AC-02 | **Given** đã có kế hoạch **When** gọi lại `ensureTeachingPlan` **Then** trả về `id` cũ, **không** tạo bản ghi thứ hai |
| AC-03 | **Given** kế hoạch của lớp X **When** thêm mục `lesson` không chọn người dạy **Then** bị chặn ở client (`required`), ở Zod (`superRefine`) và ở DB (`teaching_plan_lesson_has_teacher`) |
| AC-04 | **Given** mục loại `assessment` **When** để trống người dạy **Then** lưu thành công |
| AC-05 | **Given** đã có mục ngày 2026-09-06 **When** thêm mục thứ hai cùng ngày **Then** lỗi "Ngày này đã có một mục giáo án." |
| AC-06 | **Given** `planned_date` ngoài `[start_date, end_date]` **Then** DB ném `TEACHING_PLAN_DATE_OUTSIDE_YEAR` |
| AC-07 | **Given** nhân sự không thuộc `class_staff_assignments` của lớp tại ngày đó **When** chọn làm người dạy **Then** DB ném `TEACHING_PLAN_TEACHER_OUT_OF_CLASS` |
| AC-08 | **Given** mục đang có tài liệu **When** xóa mục **Then** object trong bucket bị xóa, không còn orphan (`storage.list` trả rỗng) |
| AC-09 | **Given** mục đã có tài liệu **When** upload tệp mới **Then** metadata trỏ tệp mới và object cũ bị xóa |
| AC-10 | **Given** tệp 6 MB hoặc MIME ngoài allowlist **Then** bị từ chối với thông điệp cụ thể, không có object nào được tạo |
| AC-11 | **Given** update metadata thất bại sau khi upload **Then** object vừa upload bị rollback |
| AC-12 | **Given** staff phạm vi lớp **When** bấm "Tải xuống" **Then** nhận signed URL sống 60 giây và tệp tải về đúng tên gốc |
| AC-13 | **Given** hôm nay trước ngày khai giảng **When** mở `/teaching-plan` **Then** khoảng hiển thị bắt đầu từ `year.start_date` |
| AC-14 | **Given** hôm nay sau `year.end_date` **Then** danh sách 7 ngày rỗng và **không** gọi RPC |
| AC-15 | **Given** mục loại `assessment` **When** hiển thị trong card 7 ngày **Then** tiêu đề hiển thị "Kiểm tra" và có badge `Kiểm tra` |

## 3. Nghiệm thu cho các To-Be

| # | To-Be | Given / When / Then |
|---|---|---|
| TB-01 | TB-M06-01 | **Given** GLV A và GLV B cùng mở mục M **When** A lưu trước rồi B lưu **Then** B nhận `CONFLICT` với thông điệp "Mục này vừa được người khác cập nhật…" và **dữ liệu của A còn nguyên** |
| TB-02 | TB-M06-01 | **Given** chỉ một người sửa **Then** số bước không đổi so với hiện tại (mở → sửa → lưu) |
| TB-03 | TB-M06-02 | **Given** bỏ trống tên bài **Then** thông báo nêu đúng trường "Tên bài" chứ không phải "Không thể lưu giáo án. Vui lòng thử lại." |
| TB-04 | TB-M06-02 | **Given** 2 người cùng tạo kế hoạch cho một lớp **Then** người sau nhận "Lớp này đã có kế hoạch giảng dạy." (không phải thông điệp về "ngày") |
| TB-05 | TB-M06-03 | **Given** nhân sự có `ends_on` = 2026-10-31 **When** chọn ngày 2026-11-05 **Then** nhân sự đó **không** xuất hiện trong dropdown |
| TB-06 | TB-M06-04 | **Given** GLV thuộc lớp khác gọi `createTeachingMaterialUrl` **Then** action trả `FORBIDDEN` **trước khi** chạm Storage API |
| TB-07 | TB-M06-05 | **Given** guardian mở `/teaching-plan/{classId}` **Then** nhận 404, không render khung trang quản trị |
| TB-08 | TB-M06-05 | **Given** staff không phụ trách lớp nào **Then** thấy card "Bạn chưa được phân công lớp nào có giáo án." |
| TB-09 | TB-M06-06 | **Given** nhân sự có `role_assignments.class_id = X` và `class_staff_assignments(capacity='representative').class_id = Y` **When** tạo kế hoạch cho Y **Then** tạo thành công **và** đọc lại được kế hoạch Y |
| TB-10 | TB-M06-06 | **Given** GLV lớp Z (không liên quan) **Then** vẫn đọc 0 dòng của lớp Y (không nới quyền ngoài spec) |

## 4. Nghiệm thu UI/Responsive

| # | Given / When / Then |
|---|---|
| UI-01 | **Given** viewport 360 px trên mọi màn của module **Then** `document.documentElement.scrollWidth <= window.innerWidth + 1` |
| UI-02 | **Given** thông báo thành công (ví dụ "Đã lưu tài liệu vào kho riêng tư.") **Then** hiển thị tone `success` và `role="status"`, **không** phải `role="alert"` màu đỏ |
| UI-03 | **Given** mọi nút trong module **Then** chiều cao thực tế ≥ 44 px |
| UI-04 | **Given** toggle "Danh sách/Theo tháng" **Then** mục đang chọn có `aria-current` |

## 5. Câu hỏi cần xác nhận trước khi nghiệm thu (NEEDS_CONFIRMATION)

1. **Mục `assessment` trong giáo án có phải sinh cột điểm ở M07 không?** Hiện tại hai module hoàn toàn
   độc lập; WF-07 §5 và WF-08 không nêu ràng buộc. Nếu nghiệp vụ muốn "đánh dấu Kiểm tra ⇒ tự tạo cột điểm"
   thì đây là thay đổi cỡ **L** đụng cả M06 và M07.
2. **Nhóm global-write (XĐ trưởng/phó/thư ký) có nên sửa trực tiếp giáo án của mọi lớp không?**
   `docs/05` bảng module ghi Giáo án = `✅` cho các vai trò này, nhưng WF-07 chỉ nêu actor là
   "Giáo lý viên đại diện". Nếu chỉ muốn họ **xem**, cần siết `app.can_manage_teaching_plan`
   (`20260722000100:146`).
3. **Có cần lịch sử thay đổi mục giáo án không?** Quyết định này chọn giữa phương án A và B của TB-M06-01.
4. **Phụ huynh/thiếu nhi có được xem lịch quá 7 ngày (ví dụ cả tháng) không?** RPC đã hỗ trợ `p_days` tới 31
   nhưng UI cố định 7 (`server/queries.ts:102`).
