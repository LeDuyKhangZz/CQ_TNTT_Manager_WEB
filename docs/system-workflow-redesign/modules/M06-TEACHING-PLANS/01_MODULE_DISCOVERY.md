# M06-TEACHING-PLANS — 01. Khảo sát module

## 1. Mục tiêu nghiệp vụ

Quản lý **kế hoạch giảng dạy cả năm học** cho từng lớp giáo lý (WF-07):

- Mỗi lớp có tối đa **một** `teaching_plan` cho năm học (unique `class_id`).
- Kế hoạch gồm nhiều `teaching_plan_item`, **một mục mỗi ngày** (`unique (teaching_plan_id, planned_date)`).
- Mỗi mục có loại `lesson` hoặc `assessment`, người dạy phải nằm trong đội ngũ lớp tại đúng ngày.
- Mỗi mục đính kèm **tối đa một tài liệu** trong bucket private `teaching-materials` (≤ 5 MB), tải về qua signed URL 60 giây.
- Phụ huynh/thiếu nhi **chỉ** thấy projection an toàn 7 ngày tới (ngày, tên bài, chuẩn bị, người phụ trách, nhãn `Kiểm tra`).
- Không có duyệt, không có versioning (`comment on table public.teaching_plans` — `supabase/migrations/20260722000100_teaching_plans.sql:236`).

## 2. Actor và quyền

| Actor | Quyền trên module | Nơi enforce |
|---|---|---|
| `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Tạo/sửa/xóa kế hoạch + mục + tài liệu mọi lớp | `app.can_global_write()` trong `app.can_manage_teaching_plan` (`20260722000100_teaching_plans.sql:146`); app layer `hasGlobalTeachingPlanWrite` (`src/features/teaching-plans/server/permissions.ts:15`) |
| `class_representative` (GLV đại diện) | Tạo/sửa/xóa kế hoạch lớp mình | `app.is_class_representative` (`20260715000400_staff_and_class_assignments.sql:222`); app layer `getManageableTeachingClassIds` (`permissions.ts:19`) |
| `class_teacher`, `trainee_assistant` | Chỉ xem đầy đủ giáo án lớp mình + tải tài liệu | RLS `teaching_plans_select_staff_scope` (`20260722000100_teaching_plans.sql:167`) |
| `sector_leader`, `sector_deputy` | Xem giáo án các lớp trong ngành | `app.can_access_class` nhánh sector (`20260715000200_academic_structure.sql:183`) |
| `parish_priest`, `chaplain`, `treasurer` | `can_global_read()` → cha sở/cha phó xem được; `treasurer` **không** (không thuộc `can_global_read`) | `20260715000100_identity_foundation.sql:157` |
| `guardian`, `student` | Chỉ RPC `get_week_ahead_teaching_items` | `20260722000200_week_ahead_teaching.sql:5`; chặn UI tại `queries.ts:138` |

## 3. Route và màn hình

| Route | File | Ghi chú |
|---|---|---|
| `/teaching-plan` | `src/app/(dashboard)/teaching-plan/page.tsx:9` | Hub: card "7 ngày sắp tới" + lưới lớp. Guardian/student chỉ thấy card 7 ngày (`queries.ts:138`). |
| `/teaching-plan/[classId]?view=list\|calendar` | `src/app/(dashboard)/teaching-plan/[classId]/page.tsx:10` | Chi tiết giáo án; `notFound()` khi không đọc được lớp. |

Route rule: `{ path: "/teaching-plan", public: false }` — **không giới hạn role** (`src/lib/permissions/route-map.ts:30`), tức guardian/student vẫn qua `requireRouteAccess`.

## 4. Component

| Component | File | Loại |
|---|---|---|
| `WeekAheadSchedule` | `src/features/teaching-plans/components/week-ahead-schedule.tsx:6` | Server component (không `use client`) — HTML render sẵn, không đẩy payload sang client |
| `TeachingPlanEditor` | `src/features/teaching-plans/components/teaching-plan-editor.tsx:287` | Client component; chứa `ItemForm` (120), `ItemCard` (163), `ItemFields` (45), `TextArea` (93) |

## 5. Server action / query

| Hàm | File:line | Ghi chú |
|---|---|---|
| `ensureTeachingPlan` | `server/actions.ts:87` | Idempotent — trả plan sẵn có nếu đã tồn tại |
| `updateTeachingPlanTitle` | `server/actions.ts:125` | |
| `createTeachingPlanItem` | `server/actions.ts:162` | |
| `updateTeachingPlanItem` | `server/actions.ts:181` | Chặn đổi `teaching_plan_id` ở app (187) và DB (`migration:108`) |
| `deleteTeachingPlanItem` | `server/actions.ts:216` | Dọn object Storage trước khi xóa row |
| `uploadTeachingMaterial` | `server/actions.ts:250` | FormData; kiểm size + MIME; rollback object khi update DB lỗi (285) |
| `removeTeachingMaterial` | `server/actions.ts:299` | Bỏ metadata trước, xóa object sau |
| `createTeachingMaterialUrl` | `server/actions.ts:328` | Signed URL 60 s, `download: material_name` |
| `getWeekAheadTeachingData` | `server/queries.ts:87` | Gọi RPC safe projection |
| `getTeachingPlanPageData` | `server/queries.ts:121` | |
| `getTeachingPlanDetail` | `server/queries.ts:186` | |
| `canManageTeachingClass` / `getManageableTeachingClassIds` | `server/permissions.ts:45` / `:19` | |

## 6. Bảng và đối tượng DB

| Đối tượng | Migration | Ghi chú |
|---|---|---|
| `public.teaching_plans` | `20260722000100:5` | `unique(class_id)`, FK `classes` on delete restrict |
| `public.teaching_plan_items` | `20260722000100:19` | 4 constraint nội dung + `one_per_date` + `lesson_has_teacher` |
| enum `teaching_plan_item_type` | `20260722000100:3` | `lesson` / `assessment` |
| trigger `teaching_plans_prepare` | `:93` | Suy `academic_year_id` từ lớp, gán `created_by_staff_id`, `updated_by` |
| trigger `teaching_plan_items_validate` | `:142` | Chặn chuyển plan, kiểm ngày trong năm học, kiểm người dạy thuộc `class_staff_assignments` đúng ngày |
| `app.can_manage_teaching_plan(uuid)` | `:146` | `can_global_write() OR is_class_representative()` |
| cột `material_*` + 5 constraint | `20260722000300:3` | Bao gồm giới hạn 1 byte..5 MB và MIME allowlist |
| bucket `teaching-materials` | `20260722000300:39` | `public=false`, `file_size_limit=5242880`, `allowed_mime_types` |
| `app.can_manage_teaching_material` / `can_read_teaching_material` | `:57` / `:89` | Parse path `{class}/{item}/{file}` |
| 4 policy `storage.objects` | `:126`–`:156` | select/insert/update/delete theo phạm vi |
| RPC `get_week_ahead_teaching_items(date, int)` | `20260722000200:5` | `security definer`, `p_days` 1..31 |

## 7. Phụ thuộc

- **M02 Academic structure**: `classes`, `academic_years` (`start_date`/`end_date` giới hạn `planned_date`).
- **M04 Staff**: `staff_profiles`, `class_staff_assignments` (dropdown người dạy + trigger validate).
- **M03 Students/Guardians**: `enrollments` + `app.own_student_ids()` cho projection tuần tới.
- **M01 Auth**: `requireAuthContext` / `requireRouteAccess`, `app.current_role()`.
- **Supabase Storage**: bucket private.

## 8. Mức quan trọng

**Cao.** Là nguồn duy nhất cho lịch học phụ huynh/thiếu nhi thấy và là nơi lưu tài liệu nội bộ. Rò rỉ nội dung nội bộ (mục tiêu, giáo lý, ghi chú, tài liệu) sang portal là rủi ro riêng tư trực tiếp.

## 9. Tình trạng test

| Test | Phạm vi | Đánh giá |
|---|---|---|
| `supabase/tests/013_teaching_plans_test.sql` (27 assertion) | RLS đại diện/GLV lớp/lớp khác/trưởng ngành/phụ huynh/thiếu nhi, constraint ngày, người dạy ngoài lớp, trùng ngày | Tốt, chạy bằng JWT thật |
| `supabase/tests/014_week_ahead_teaching_test.sql` (15) | Projection cho phụ huynh A/B, thiếu nhi, staff; biên `p_days`; không rò tên lớp khác | Tốt |
| `supabase/tests/015_teaching_materials_test.sql` (16) | Bucket private/5 MB/MIME, policy storage cho 5 vai trò, path sai định dạng | Tốt |
| `tests/e2e/teaching-plan.spec.ts` | CRUD + upload/gỡ/tải tài liệu + portal không thấy `objectives`/tên tệp + dọn object khi xóa item | Tốt, chạy 3 breakpoint |

**Khoảng trống test:** chưa có test cho (a) đồng thời 2 người sửa cùng một mục; (b) người dạy có `ends_on` trước `planned_date` bị chặn nhưng UI vẫn liệt kê; (c) nhân sự là đại diện qua `class_staff_assignments` nhưng `role_assignments.class_id` khác lớp (xem `03_AUDIT_RESULTS.md` §BR-M06-12).
