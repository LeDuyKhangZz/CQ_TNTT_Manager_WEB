# M06-TEACHING-PLANS — 05. Quy tắc nghiệp vụ

Cột "Nơi enforce": `UI` = client, `Zod` = schema server action, `Action` = code server action,
`CK` = check constraint, `TG` = trigger, `RLS` = policy, `ST` = Storage policy/bucket.

| Mã | Phát biểu | UI | Zod | Action | CK | TG | RLS | Bằng chứng `file:line` | Mâu thuẫn docs? |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|---|
| BR-M06-01 | Mỗi lớp có **tối đa một** kế hoạch giảng dạy cho năm học | ✓ | – | ✓ | ✓ | – | – | UI: `teaching-plan-editor.tsx:322`; Action idempotent: `server/actions.ts:93-98`; `unique class_id`: `20260722000100_teaching_plans.sql:7` | Không (docs/02 §8.1) |
| BR-M06-02 | `academic_year_id` của kế hoạch **luôn suy từ lớp**, không tin client | – | – | ✓ | – | ✓ | – | `actions.ts:100-113`; trigger `app.prepare_teaching_plan`: `20260722000100:69-77` | Không |
| BR-M06-03 | Tên kế hoạch 1..150 ký tự (nullable ở DB) | ✓ | ✓ | – | ✓ | – | – | `teaching-plan-editor.tsx:329`; `schemas.ts:12`; `20260722000100:14` | Không |
| BR-M06-04 | **Một mục giáo án cho mỗi ngày** trong một kế hoạch | ✓ (thông báo `:355`) | – | – | ✓ | – | – | `20260722000100:38` (`teaching_plan_items_one_per_date`) | Không (docs/02 §8.2 ghi rõ phương án mở rộng `sequence_no`) |
| BR-M06-05 | Người dạy phải thuộc `class_staff_assignments` **đang hiệu lực tại `planned_date`** | ✗ (dropdown không lọc theo ngày) | – | – | – | ✓ | – | Trigger: `20260722000100:125-135`; dropdown: `server/queries.ts:203-207` | Không mâu thuẫn nội dung, nhưng UI chưa phản chiếu (docs/06 §11 "Người dạy dropdown chỉ staff của lớp") |
| BR-M06-06 | Mục loại `lesson` **bắt buộc** có người dạy; `assessment` thì tùy chọn | ✓ | ✓ | – | ✓ | – | – | `teaching-plan-editor.tsx:76`; `schemas.ts:36-44`; `20260722000100:39` | Không |
| BR-M06-07 | `planned_date` phải nằm trong `[year.start_date, year.end_date]` của lớp | ✓ (`min`/`max`) | – | – | – | ✓ | – | `teaching-plan-editor.tsx:68`; trigger: `20260722000100:121-123` | Không |
| BR-M06-08 | Không được chuyển một mục sang kế hoạch khác | – | – | ✓ | – | ✓ | – | `actions.ts:187`; trigger: `20260722000100:108-110` | Không |
| BR-M06-09 | Chỉ `global-write` hoặc **đại diện lớp** được tạo/sửa/xóa kế hoạch và mục | ✓ (`canManage`) | – | ✓ | – | – | ✓ | UI: `teaching-plan-editor.tsx:236,271,343,353`; Action: `server/permissions.ts:45`; RLS: `20260722000100:171-229` qua `app.can_manage_teaching_plan` (`:146`) | Không (docs/05 §6 "Teaching plan") |
| BR-M06-10 | Staff trong phạm vi lớp/ngành/global-read **xem đầy đủ** giáo án | – | – | – | – | – | ✓ | `20260722000100:167`, `:184` (dùng `app.can_access_class`) | ⚠ **Có** — `docs/05 §6` nói "Class staff xem đầy đủ giáo án", nhưng policy bỏ sót nhân sự chỉ có `class_staff_assignments` (xem `03_AUDIT_RESULTS.md` §3) |
| BR-M06-11 | Guardian/student **không** `SELECT` bảng gốc; chỉ qua RPC an toàn | ✓ (`queries.ts:138`) | – | – | – | – | ✓ | RLS: `20260722000100:167,184`; RPC: `20260722000200:5`; test: `013_*:152-155`, `014_*:63,83` | Không |
| BR-M06-12 | Projection 7 ngày **chỉ** trả ngày, tên bài, chuẩn bị, người phụ trách, loại mục, lớp | – | – | – | – | – | ✓ | `20260722000200:9-18` (`returns table` chỉ 8 cột) + comment `:69`; test `014_*:62-79` | Không |
| BR-M06-13 | Guardian/student chỉ thấy mục của lớp có enrollment `active`/`paused` của con/của mình | – | – | – | – | – | ✓ | `20260722000200:52-60` (`app.own_student_ids()`) | Không |
| BR-M06-14 | RPC tuần tới yêu cầu đăng nhập + có role; `p_days` ∈ [1, 31] | – | – | – | – | – | ✓ | `20260722000200:25-30`; test `014_*:87-91` | Không |
| BR-M06-15 | Mỗi mục có **tối đa một** tài liệu; metadata phải đủ 4 trường hoặc null hết | ✓ | – | ✓ | ✓ | – | – | `actions.ts:275-291`; `20260722000300:8-12` (`teaching_plan_material_complete`) | Không |
| BR-M06-16 | Tài liệu ≤ **5 MB**, ≥ 1 byte | ✗ (không kiểm client) | – | ✓ | ✓ | – | ✓ (bucket) | Action: `actions.ts:254`; hằng: `constants.ts:11`; CK: `20260722000300:19-21`; bucket: `:39-43`; test `015_*:7` | Không |
| BR-M06-17 | MIME thuộc allowlist PDF/Office/ảnh/text | ✓ (`accept`) | – | ✓ | ✓ | – | ✓ (bucket) | `constants.ts:12-24`; `actions.ts:257`; `20260722000300:22-33`, `:44-54` | Không |
| BR-M06-18 | Đường dẫn object = `{class_id}/{item_id}/{uuid}-{tên an toàn}` và **unique** | – | – | ✓ | – | – | ✓ | `actions.ts:240-269`; unique index `20260722000300:35`; parser `app.can_manage_teaching_material` `:57-87`; comment `:163` | Không (docs/02 §…"967") |
| BR-M06-19 | Chỉ đại diện/global-write được upload/update/delete object; staff phạm vi lớp chỉ đọc | – | – | ✓ | – | – | ✓ | ST policies `20260722000300:126-156`; test `015_*:67,83,93,96,98` | Không |
| BR-M06-20 | Guardian/student **không** đọc được object tài liệu | – | – | – | – | – | ✓ | `app.can_read_teaching_material` yêu cầu `can_access_class` hoặc `can_manage_teaching_plan` (`20260722000300:110-122`); test `015_*:96-98` | Không |
| BR-M06-21 | Signed URL sống **60 giây**, ép tải về đúng tên gốc | – | – | ✓ | – | – | – | `actions.ts:343` | Không (docs/11 §7) |
| BR-M06-22 | Xóa mục phải dọn object trước; gỡ tệp thì xóa metadata trước rồi mới xóa object | – | – | ✓ | – | – | – | `actions.ts:225-231` (xóa mục) và `:309-320` (gỡ tệp); lý do thứ tự: comment `20260722000300:118-120` | Không |
| BR-M06-23 | Không có duyệt, không có versioning giáo án | – | – | – | – | – | – | comment `20260722000100:236` | Không (WF-07) |
| BR-M06-24 | `updated_by` luôn là người đăng nhập (không tin client) | – | – | – | – | ✓ | – | `20260722000100:78` và `:137` (`coalesce(auth.uid(), ...)`) | Không |

## Ghi chú mâu thuẫn / khoảng trống

1. **BR-M06-10 vs `docs/05 §6`** — như phân tích ở `03_AUDIT_RESULTS.md`; đề xuất xử lý tại
   `04_TO_BE_FLOWS.md` §TB-M06-06.
2. **BR-M06-05 chỉ enforce ở DB** — UI cho phép chọn sai rồi mới báo lỗi chung chung.
3. **Chưa có BR nào ràng buộc `item_type='assessment'` với module M07** — đánh dấu "Kiểm tra" trong
   giáo án **không** tạo cột điểm trong bảng điểm và ngược lại. WF-07 §5 và WF-08 không tuyên bố ràng buộc
   này, nên đây là câu hỏi cần xác nhận (xem `08_ACCEPTANCE_CRITERIA.md` §5).
4. **`teaching_plan_items.sequence_no`** tồn tại (`20260722000100:22`) nhưng app luôn để mặc định `1`;
   đúng với quyết định "một mục/ngày" nhưng là nợ kỹ thuật nếu sau này đổi unique key.
