# M06-TEACHING-PLANS — 07. Ảnh hưởng triển khai

> Ước lượng: **S** ≤ 0,5 ngày · **M** 0,5–2 ngày · **L** > 2 ngày. Không có việc nào bắt buộc phải làm
> ngay để chặn rò rỉ dữ liệu — module đạt toàn bộ kiểm tra bảo mật đặc biệt.

## 1. Bảng tổng hợp

| # | Hạng mục | To-Be | File phải sửa | API | Migration | RLS | Dữ liệu | Test | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `FormMessage` thiếu `tone` (thông báo thành công màu đỏ) | – (bug UI) | `src/features/teaching-plans/components/teaching-plan-editor.tsx:245`, `:331` | Không | Không | Không | Không | E2E thêm assert màu/`role` | **S** | Không |
| 2 | Chuẩn hóa thông điệp lỗi (field-level + `23514`/`23505` theo constraint) | TB-M06-02 | `src/lib/errors/index.ts`; `src/features/teaching-plans/server/actions.ts:31-41`; `components/teaching-plan-editor.tsx` (render `details`) | Đổi kiểu trả về (thêm field tùy chọn — **không breaking**) | Không | Không | Không | Unit test cho `mapDatabaseError`; E2E case ngày ngoài năm học | **M** | **Cross-module**: cùng mẫu ở M07 và các module khác |
| 3 | Lọc dropdown người dạy theo `plannedDate` | TB-M06-03 | `components/teaching-plan-editor.tsx:45-91` (dùng `startsOn/endsOn` đã có ở `server/queries.ts:25`) | Không | Không | Không | Không | E2E: nhân sự hết hiệu lực không xuất hiện | **S** | M04 (dữ liệu `class_staff_assignments`) |
| 4 | Optimistic lock khi sửa mục | TB-M06-01 | `schemas.ts:46`; `server/actions.ts:181-214`; `server/queries.ts:33-51` (thêm `updatedAt`); `components/teaching-plan-editor.tsx:120-156` | `updateTeachingPlanItem` **breaking** (thêm field bắt buộc) | Không | Không | Không (dùng `updated_at` sẵn có) | pgTAP không cần; thêm test tích hợp 2 phiên | **M** | Không |
| 5 | Kiểm quyền tường minh cho signed URL | TB-M06-04 | `server/permissions.ts` (hàm `canReadTeachingClass`); `server/actions.ts:328-349` | Không | Không | Không | Không | E2E: GLV lớp khác nhận `FORBIDDEN`/`RESOURCE_NOT_FOUND` | **S** | Không |
| 6 | Chặn audience ở route chi tiết + empty state hub | TB-M06-05 | `server/queries.ts:186`, `src/app/(dashboard)/teaching-plan/page.tsx:15-19` | Không | Không | Không | Không | E2E: guardian mở `/teaching-plan/{id}` → 404 | **S** | M14 (shell điều hướng) |
| 7 | Thống nhất "thuộc lớp" cho policy select giáo án | TB-M06-06 (A) | Migration mới `supabase/migrations/2026xxxx_teaching_plan_select_scope.sql` | Không | **Có** (`drop`/`create policy` ×2) | **Có** — `teaching_plans_select_staff_scope`, `teaching_plan_items_select_staff_scope` | Không đổi dữ liệu | pgTAP `013_*`: fixture đại diện chéo lớp; regression 010/013/014/015 | **M** | Phải chạy lại `npm run db:reset` + toàn bộ pgTAP |
| 8 | Nhóm lại form 12 trường + drawer mobile + inline edit desktop | UI §4 | `components/teaching-plan-editor.tsx:45-156` (+ component drawer mới) | Không | Không | Không | Không | E2E 3 breakpoint + `expectNoHorizontalOverflow` | **L** | Design system (dialog/drawer chưa có) |
| 9 | Thay `window.confirm` bằng dialog design system | UI §3 | `components/teaching-plan-editor.tsx:170`, `:212`; `src/components/ui/*` | Không | Không | Không | Không | E2E phải bỏ `page.once('dialog')` | **M** | **Cross-module**: M05/M07 cũng dùng `window.confirm` |
| 10 | Kiểm dung lượng tệp phía client trước khi upload | BR-M06-16 | `components/teaching-plan-editor.tsx:181-197` | Không | Không | Không | Không | E2E: tệp 6 MB bị chặn ngay, không gọi server | **S** | Không |
| 11 | Phân biệt lỗi RPC tuần tới với trạng thái rỗng | UI §5 | `server/queries.ts:100-118`; `components/week-ahead-schedule.tsx` | Không | Không | Không | Không | Unit/E2E khó dựng — chấp nhận kiểm thủ công | **S** | Không |
| 12 | Bổ sung `expectNoHorizontalOverflow` cho E2E giáo án | Test | `tests/e2e/teaching-plan.spec.ts` | Không | Không | Không | Không | – | **S** | Không |

## 2. Thứ tự thực hiện đề xuất

1. **#1, #3, #10, #12** (S, độc lập, giảm ngay ma sát vận hành).
2. **#5, #6** (S, siết an toàn và IA).
3. **#7** (M, cần reset DB + chạy lại pgTAP → gộp vào một phiên migration).
4. **#2** (M, nên làm ở tầng `src/lib/errors` cùng lúc với M07 để tránh sửa hai lần).
5. **#4** (M, sau khi #2 xong để tận dụng thông điệp lỗi mới).
6. **#8, #9** (L/M, phụ thuộc design system).

## 3. Rủi ro và biện pháp

| Rủi ro | Mức | Biện pháp |
|---|---|---|
| #7 nới phạm vi đọc giáo án ngoài ý muốn | Trung bình | Chỉ thêm `or app.is_class_staff(class_id)` (đúng `docs/05 §6`); pgTAP khẳng định GLV lớp khác **vẫn** đọc 0 dòng (`013_*:149-150`) |
| #4 breaking API nội bộ | Thấp | Chỉ có một caller (`ItemForm`); TypeScript strict bắt lỗi lúc build |
| #2 chạm `src/lib/errors` dùng chung | Trung bình | Chỉ **thêm** field tùy chọn, không đổi `AppErrorCode` hiện có |
| #8 phải viết drawer mới | Trung bình | Cần chốt design trước; có thể tách thành task riêng |
| Regression E2E do đổi `window.confirm` (#9) | Thấp | Sửa đồng thời spec ở M05/M06/M07 |

## 4. Không cần đụng tới

- Toàn bộ migration `20260722000100/000200/000300` **trừ** 2 policy select ở #7.
- RPC `get_week_ahead_teaching_items` — đạt đúng WF-07, có test đầy đủ.
- Luồng upload/gỡ/tải tài liệu ở tầng Storage (policy + bucket + thứ tự dọn object).
- `app.can_manage_teaching_plan`, `app.can_manage_teaching_material`, `app.can_read_teaching_material`.
