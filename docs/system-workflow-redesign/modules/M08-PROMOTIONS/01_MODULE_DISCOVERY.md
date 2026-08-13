# M08-PROMOTIONS — 01. Khám phá module

## 1. Mục tiêu nghiệp vụ

Cuối năm học, mỗi thiếu nhi phải được quyết định một trong bốn hướng: **lên lớp**,
**học lại**, **tạm nghỉ**, **rút học** (và với lớp Hiệp 2 thêm hướng **đề xuất vào Dự trưởng**).
Quyết định đi qua hai tầng: **GLV đại diện lớp đề nghị** → **Trưởng/Phó ngành đúng ngành duyệt**.
Khi duyệt, hệ thống phải **đóng ghi danh năm cũ và mở ghi danh năm mới trong một giao dịch nguyên tử**
(nguồn: `docs/03-workflow.md` WF-11, `docs/02-database-design.md` §10).

## 2. Actor

| Actor | Vai trò kỹ thuật | Được làm gì |
|---|---|---|
| GLV đại diện lớp | `class_representative` **và** có `class_staff_assignments.capacity='representative'`, `is_active=true` | Tạo/sửa/gửi lại đề xuất cho lớp mình |
| Trưởng ngành | `sector_leader` đúng `sector_id` | Duyệt / từ chối đề xuất trong ngành |
| Phó ngành | `sector_deputy` đúng `sector_id` | Duyệt / từ chối đề xuất trong ngành |
| Global-write | `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Vừa đề xuất vừa duyệt được ở mọi lớp |
| Global-read | `parish_priest`, `chaplain` | Chỉ xem |
| GLV lớp, Dự trưởng phụ tá | `class_teacher`, `trainee_assistant` | Chỉ xem lớp mình (không đề xuất, không duyệt) |
| Thủ quỹ | `treasurer` | **Bị chặn route** (`route-map.ts:41`) |
| Phụ huynh / Thiếu nhi | `guardian`, `student` | Không truy cập; workflow không hiện trên trang chi tiết thiếu nhi |

## 3. Route và điều hướng

| Route | File | Guard |
|---|---|---|
| `/promotions` | `src/app/(dashboard)/promotions/page.tsx:6-14` | `requireRouteAccess("/promotions")` gọi trong `getPromotionsPageData` (`queries.ts:81`) |
| Quy tắc route | `src/lib/permissions/route-map.ts:41` | `STAFF_ROLES` trừ `treasurer` |
| Mục điều hướng | `src/config/navigation.ts:51` | "Lên lớp/chuyển lớp", nhóm "Mục vụ" |

Không có route con (`/promotions/[classId]`, `/promotions/[reviewId]`).

## 4. Component

| Component | File | Vai trò |
|---|---|---|
| `PromotionsPage` | `src/app/(dashboard)/promotions/page.tsx:6` | Server Component, nạp dữ liệu và render board |
| `PromotionBoard` | `src/features/promotions/components/promotion-board.tsx:166-169` | Lưới card, xử lý empty state |
| `PromotionCard` | `promotion-board.tsx:39-164` | Client Component: form đề xuất + form duyệt cho **một** ghi danh |
| `WarningSummary` | `promotion-board.tsx:19-37` | Hiển thị snapshot cảnh báo (điểm TB, điểm lễ, điểm giáo lý, 3 cờ cảnh báo) |

## 5. Server Action / RPC / Query

| Tên | File:line | Loại |
|---|---|---|
| `getPromotionsPageData` | `src/features/promotions/server/queries.ts:77-145` | Query (server-only) |
| `proposePromotion` | `src/features/promotions/server/actions.ts:29-54` | Server Action |
| `reviewPromotion` | `src/features/promotions/server/actions.ts:56-82` | Server Action |
| `canProposeForClass` | `src/features/promotions/server/permissions.ts:8-29` | Kiểm quyền tầng ứng dụng |
| `canReviewSector` | `src/features/promotions/server/permissions.ts:31-39` | Kiểm quyền tầng ứng dụng |
| `public.propose_promotion` | `supabase/migrations/20260722000700_promotions.sql:127-224` | RPC `security definer` |
| `public.approve_promotion_review` | `…promotions.sql:226-339` | RPC `security definer` (nguyên tử) |
| `app.can_manage_promotion` | `…promotions.sql:43-51` | Helper DB |
| `app.can_review_promotion` | `…promotions.sql:53-72` | Helper DB |
| `app.promotion_target_is_valid` | `…promotions.sql:74-125` | Helper DB (kiểm cấp/nhánh/năm) |

## 6. Bảng DB liên quan

| Bảng / view | Vai trò | Nguồn |
|---|---|---|
| `promotion_reviews` | Bảng chính, `source_enrollment_id` **unique** | `…promotions.sql:3-35` |
| `enrollments` | Bị đóng và được tạo mới | `20260716000500_enrollments.sql:5-32` |
| `classes`, `grade_levels`, `academic_years` | Xác định cấp, ngành, năm đích | `20260715000200_academic_structure.sql` |
| `class_staff_assignments` | Xác định ai là đại diện lớp | `20260715000400_staff_and_class_assignments.sql` |
| `v_student_weighted_average`, `v_student_attendance_summary` | Nguồn snapshot cảnh báo | `…promotions.sql:181-194` |

Ràng buộc quan trọng:

- `promotion_reviews.source_enrollment_id` **unique** → mỗi ghi danh tối đa một đề xuất (`…promotions.sql:5`).
- `promotion_target_shape` → tạm nghỉ/rút học **bắt buộc** không có lớp đích; Dự trưởng **bắt buộc** `proposed_target_class_id is null` (`…promotions.sql:28-34`).
- `enrollments_one_open_per_student_year_idx` → một ghi danh mở/năm/em (`enrollments.sql:24-26`).

## 7. Role / permission

| Hành động | Enforce ở đâu |
|---|---|
| Vào trang | `route-map.ts:41` + `requireRouteAccess` |
| Đọc `promotion_reviews` | RLS `promotion_reviews_select_scope` (`…promotions.sql:349-355`) |
| Ghi `promotion_reviews` | **Không có policy INSERT/UPDATE/DELETE**; `grant select` duy nhất (`…promotions.sql:342`) → chỉ ghi được qua 2 RPC |
| Đề xuất | `app.can_manage_promotion` (`…promotions.sql:43-51`) + `canProposeForClass` (`permissions.ts:8-29`) |
| Duyệt | `app.can_review_promotion` (`…promotions.sql:53-72`) + `canReviewSector` (`permissions.ts:31-39`) |

Thiết kế quyền ở đây **chắc**: bảng chỉ cấp `select` cho `authenticated`, mọi ghi đều đi qua RPC
`security definer` có kiểm quyền bên trong.

## 8. Phụ thuộc

- **M03-STUDENTS / enrollments**: mọi hành động đều thao tác trên `enrollments`.
- **M02-ACADEMIC-STRUCTURE**: `next_grade_level_id`, `can_propose_trainee`, `is_sector_final_level`, `requires_sacrament_review`.
- **M05-ATTENDANCE / M07-ASSESSMENTS**: cung cấp 2 view cho snapshot cảnh báo.
- **M04-STAFF**: `class_staff_assignments.capacity='representative'`.
- `hasGlobalResultWrite` mượn từ `src/features/assessments/server/permissions.ts:20-22` (coupling chéo feature).

## 9. Mức quan trọng

**CAO.** Đây là workflow duy nhất chuyển toàn bộ xứ đoàn sang năm học mới. Sai sót ở đây
làm sai sĩ số, sai lịch sử lớp và sai mọi báo cáo năm sau. Không có luồng bù trừ.

## 10. Tình trạng test

| Test | Phạm vi | Đánh giá |
|---|---|---|
| `supabase/tests/019_promotions_test.sql` (32 assertion) | Quyền, cấp/nhánh, 4 trạng thái, idempotent, rollback nguyên tử, Dự trưởng không tạo role | **Tốt** — bao phủ đúng các điểm rủi ro DB |
| `tests/unit/promotion-schemas.test.ts` (5 case) | Zod schema | Đủ cho tầng schema |
| Tầng query / UI | — | **Không có test**: `getPromotionsPageData`, `PromotionBoard`, không có E2E |

Điểm chưa được test: hiệu năng/N+1, luồng gửi lại sau khi bị từ chối (chỉ test ở mức DB gián tiếp),
xung đột với luồng đóng ghi danh thủ công ở `/classes/[classId]`.
