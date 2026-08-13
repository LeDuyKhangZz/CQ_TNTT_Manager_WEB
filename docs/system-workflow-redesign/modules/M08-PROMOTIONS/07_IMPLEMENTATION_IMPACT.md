# M08-PROMOTIONS — 07. Tác động triển khai

Ước lượng: **S** ≤ 0.5 ngày · **M** 1–2 ngày · **L** ≥ 3 ngày.

## 1. Bảng tổng hợp

| # | Hạng mục | File phải sửa | API | Migration | RLS | Dữ liệu | Test | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|---|---|
| 1 | TO-BE 1 — lọc/phân trang + bỏ N+1 | `src/features/promotions/server/queries.ts`, `server/permissions.ts`, `components/promotion-board.tsx`, `src/app/(dashboard)/promotions/page.tsx` | Đổi chữ ký `getPromotionsPageData` (nội bộ) | Không (PA A) | Không đổi | Không | Unit cho hàm gom quyền; E2E lọc | **M** | Không |
| 2 | TO-BE 6 — xác nhận Duyệt / bắt buộc lý do Từ chối | `components/promotion-board.tsx`, `schemas.ts` | Không | Không | Không | Không | Unit schema; E2E | **S** | Không |
| 3 | TO-BE 3 — cảnh báo bí tích lớp cuối ngành | `supabase/migrations/<new>_promotion_sacrament_warning.sql`, `server/queries.ts` (type), `components/promotion-board.tsx` | `propose_promotion` giữ nguyên chữ ký | **Có** (`create or replace function`) | Không đổi policy | Snapshot cũ thiếu khóa mới → UI phải chịu khóa vắng | pgTAP: lớp `is_sector_final_level` có/không bí tích | **M** | M02 (cờ `requires_sacrament_review` phải seed đúng), M03 (`student_sacraments`) |
| 4 | TO-BE 2 — đề xuất hàng loạt | `server/actions.ts` (+`proposePromotionBatch`), `schemas.ts`, component bảng mới | Thêm 1 Server Action | Không | Không | Không | Unit + E2E; test 60 dòng | **M** | Hạng mục 1 (cần bảng có checkbox) |
| 5 | TO-BE 4 — nhật ký quyết định | migration `alter table promotion_reviews add column history jsonb`, `create or replace propose_promotion` | Không | **Có** | Không đổi (`select` đã bao) | Cột mới default `[]` — an toàn | pgTAP: reject → propose lại → history có 1 mục | **M** | Không |
| 6 | TO-BE 5 — chặn đóng ghi danh khi có review `pending` | `src/features/enrollments/server/actions.ts`, `src/app/(dashboard)/classes/[classId]/page.tsx`, `src/features/classes/server/queries.ts` | Đổi hành vi `endEnrollment` | Không (PA A) | Không | Không | pgTAP/E2E: đóng ghi danh có review pending phải fail | **M** | **M03-STUDENTS/enrollments** — phải đồng bộ với audit M03 |
| 7 | UI phụ (textarea, aria-live, htmlFor, mặc định nhánh A/B) | `components/promotion-board.tsx`, `server/queries.ts` | Không | Không | Không | Không | Snapshot/axe | **S** | Không |
| 8 | Hiển thị người đề xuất/người duyệt | `server/queries.ts` (join `profiles`), `components/promotion-board.tsx` | Không | Không | Cần đọc `profiles.display_name` — kiểm RLS `profiles` cho phép | Không | E2E | **S** | M01-AUTH (RLS `profiles`) |
| 9 | Tách `hasGlobalResultWrite` khỏi `features/assessments` | `src/lib/permissions/` (hàm dùng chung), `promotions/server/permissions.ts` | Không | Không | Không | Không | Unit `permissions.test.ts` | **S** | Ảnh hưởng M07 (import path) |

## 2. Chi tiết theo tầng

### 2.1 File phải sửa (theo mức độ)

**Sửa nhiều:**
- `src/features/promotions/server/queries.ts` — viết lại phần tính quyền (`98-101`) và thêm tham số lọc/phân trang (`77-93`).
- `src/features/promotions/components/promotion-board.tsx` — tách thành `PromotionFilters` + `PromotionTable` + `PromotionDetailPanel`; card hiện tại (`39-164`) trở thành panel.

**Sửa vừa:**
- `src/features/promotions/server/permissions.ts` — thêm `getRepresentativeClassIds(context, supabase)`, giữ `canProposeForClass` cho action đơn lẻ.
- `src/features/promotions/server/actions.ts` — thêm `proposePromotionBatch`; sửa `failure()` (`14-17`) để giữ thông điệp Zod.
- `src/app/(dashboard)/promotions/page.tsx` — đọc `searchParams`.

**Sửa nhỏ:** `schemas.ts` (bắt buộc `note` khi reject), `constants.ts` (nhãn mới).

**File ngoài module (cần phối hợp):**
- `src/features/enrollments/server/actions.ts`, `src/app/(dashboard)/classes/[classId]/page.tsx` (hạng mục 6).

### 2.2 API / Server Action

| Tên | Thay đổi |
|---|---|
| `getPromotionsPageData` | Nhận `{ classId?, status?, page?, q? }`; trả thêm `classSummaries[]`, `pagination` |
| `proposePromotion` | Không đổi chữ ký; sửa ánh xạ lỗi để không nuốt thông điệp Zod |
| `reviewPromotion` | Không đổi chữ ký; Zod bắt buộc `note` khi `decision='reject'` |
| `proposePromotionBatch` | **Mới** |

### 2.3 Migration

| Migration | Nội dung | Rủi ro | Rollback |
|---|---|---|---|
| `<ts>_promotion_sacrament_warning.sql` | `create or replace function public.propose_promotion(...)` — thêm khóa bí tích vào `warning_snapshot` | **Thấp.** Không đổi chữ ký nên không cần đổi `grant`. Cần **giữ nguyên** `revoke/grant` ở cuối file gốc (`…promotions.sql:344-347`) — nếu drop-and-create sẽ mất grant | `create or replace` về bản trong `20260722000700_promotions.sql:127-224` |
| `<ts>_promotion_review_history.sql` | `alter table public.promotion_reviews add column history jsonb not null default '[]'::jsonb;` + cập nhật `propose_promotion` để append | **Thấp.** `add column` có default hằng → không rewrite bảng trên PG ≥11 | `alter table … drop column history` (mất dữ liệu lịch sử) |

**Không** cần migration cho hạng mục 1, 2, 4, 6 (PA A), 7, 8, 9.

### 2.4 RLS

- **Không thay đổi policy nào.** `promotion_reviews_select_scope` (`…promotions.sql:349-355`) đã đúng.
- Nếu chọn TO-BE 1 phương án B (view `v_promotion_board`), phải:
  - đặt `security_invoker = true` cho view,
  - viết pgTAP negative: GLV lớp khác / trưởng ngành khác / phụ huynh **không** đọc được view.
- Hạng mục 8 cần xác nhận RLS `profiles` cho phép staff đọc `display_name` của staff khác (kiểm ở `20260715000100_identity_foundation.sql`).

### 2.5 Dữ liệu hiện có

- Không có dữ liệu production cho `promotion_reviews` (module thuộc Phase 5, chưa tới cuối năm học).
- `warning_snapshot` cũ (nếu có) sẽ thiếu khóa bí tích → UI **phải** xử lý `undefined`, không được crash (`promotion-board.tsx:19-37` hiện đã dùng `?.` nên an toàn).
- Cột `history` mới mặc định `[]` → không cần backfill.

### 2.6 Test phải bổ sung

| Loại | Nội dung |
|---|---|
| pgTAP (`019_promotions_test.sql`) | Lớp cuối ngành thiếu bí tích → vẫn duyệt được (không hard-block) nhưng snapshot có cờ; reject → propose lại → `history` có đúng 1 mục; đóng ghi danh thủ công khi có review `pending` bị từ chối |
| Unit | `getRepresentativeClassIds` (0 lớp / 1 lớp / nhiều lớp); `promotionReviewSchema` bắt buộc `note` khi reject; `proposePromotionBatch` gom lỗi đúng |
| Integration | `getPromotionsPageData` với 500 ghi danh giả → đếm số query ≤ 6 |
| E2E (Playwright) | GLV đại diện đề xuất → Trưởng ngành duyệt → kiểm ghi danh mới; Trưởng ngành **khác ngành** không thấy nút duyệt |
| Bảo mật (phải xanh) | Gọi trực tiếp `proposePromotion`/`reviewPromotion` bằng session GLV lớp thường → `FORBIDDEN`; gọi PostgREST `POST /promotion_reviews` bằng JWT bất kỳ → 401/403 |

## 3. Thứ tự triển khai đề xuất

1. **Hạng mục 1** (bỏ N+1 + lọc) — chặn mọi thứ khác vì UI mới dựa trên đó. **M**
2. **Hạng mục 2** (xác nhận + lý do từ chối) — rẻ, giảm rủi ro thao tác nhầm ngay. **S**
3. **Hạng mục 6** (bịt đường vòng) — cần chốt với audit M03 trước. **M**
4. **Hạng mục 3** (bí tích) — cần user xác nhận quy tắc chính xác. **M**
5. **Hạng mục 5** (history), **4** (hàng loạt), **7/8/9** (UI + dọn dẹp). **M/S**

**Tổng ước lượng: ~7–9 ngày công** nếu làm đủ; **~2 ngày** cho gói tối thiểu (1 + 2).

## 4. Phụ thuộc liên module

| Phụ thuộc | Chi tiết |
|---|---|
| **M02-ACADEMIC-STRUCTURE** | `next_grade_level_id`, `can_propose_trainee`, `requires_sacrament_review`, `is_sector_final_level` phải seed đúng cho 13 cấp; sai một cột là sai toàn bộ lớp đích |
| **M03-STUDENTS/ENROLLMENTS** | Hạng mục 6 sửa `endEnrollment` — **phải thống nhất** với To-Be của M03 |
| **M04-STAFF** | `class_staff_assignments.capacity='representative'` + `is_active` là điều kiện duy nhất xác định người đề xuất |
| **M05/M07** | Hai view cảnh báo; nếu view đổi cột thì `propose_promotion` (`…promotions.sql:181-194`) hỏng ngầm (trả null, không lỗi) |
| **M11-REPORTS** | Báo cáo cuối năm đọc `enrollments.status` sau chuyển lớp — mọi thay đổi trạng thái ở đây lan sang báo cáo |
