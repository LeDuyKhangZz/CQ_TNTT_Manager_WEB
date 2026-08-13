# M08-PROMOTIONS — 08. Tiêu chí nghiệm thu

## A. Nghiệp vụ cốt lõi (đang ĐẠT — phải giữ xanh sau mọi thay đổi)

### AC-01 — Đề xuất lên lớp hợp lệ
**Given** tôi là GLV đại diện lớp Ấu 1A năm 2080-2081, em X có ghi danh `active`
**When** tôi chọn "Đề nghị lên lớp" + lớp đích "Ấu 2B" (năm 2081-2082)
**Then** `promotion_reviews` có đúng 1 hàng cho `source_enrollment_id` của em X, `final_status='pending'`,
`warning_snapshot` chứa khóa `weightedAverage`
**And** `enrollments` của em X **không đổi**.
_Ref: `019_promotions_test.sql:76-77`_

### AC-02 — Không nhảy sai cấp
**Given** em X đang học Ấu 1A
**When** tôi đề xuất lên "Thiếu 1A"
**Then** thao tác bị từ chối với mã `23514`, không tạo hàng nào trong `promotion_reviews`.
_Ref: `019:75`_

### AC-03 — GLV lớp thường không đề xuất được
**Given** tôi là `class_teacher` của Ấu 1A (không phải đại diện)
**When** tôi gọi `propose_promotion` cho em X
**Then** lỗi `42501` / UI hiện "Bạn không có quyền thực hiện thao tác này."
_Ref: `019:72`_

### AC-04 — Duyệt là nguyên tử
**Given** đề xuất `pending` lên lớp Ấu 2B
**When** Trưởng ngành Ấu bấm "Duyệt"
**Then** trong **một** giao dịch: ghi danh nguồn → `completed` với `ended_on = end_date` năm nguồn;
tạo **đúng một** ghi danh mới `active` ở Ấu 2B với `previous_enrollment_id` trỏ về nguồn;
review → `approved` với `created_enrollment_id` đã điền.
_Ref: `019:86-89`_

### AC-05 — Duyệt lại là idempotent
**Given** review đã `approved`
**When** gọi `approve_promotion_review(..., 'approve', ...)` lần hai (kể cả với lớp đích khác)
**Then** trả về đúng `created_enrollment_id` cũ **và** số ghi danh có `previous_enrollment_id = nguồn` vẫn bằng **1**.
_Ref: `019:90-91`_

### AC-06 — Lỗi khi duyệt rollback toàn bộ
**Given** đề xuất `pending`
**When** Trưởng ngành duyệt với lớp đích **sai cấp**
**Then** lỗi `23514` **và** ghi danh nguồn vẫn `active`, review vẫn `pending`, không có ghi danh mới.
_Ref: `019:105-106`_

### AC-07 — Từ chối rồi gửi lại
**Given** review của em X đã `rejected`
**When** GLV đại diện gửi lại đề xuất cho **cùng** `source_enrollment_id`
**Then** vẫn chỉ có **một** hàng `promotion_reviews`, `final_status` quay về `pending`,
`reviewed_by`/`reviewed_at`/`review_note` bị xóa.
_Ref: `…promotions.sql:207-221`_

### AC-08 — Trưởng ngành khác không duyệt được
**Given** đề xuất thuộc ngành Ấu
**When** Trưởng ngành Thiếu gọi `approve_promotion_review`
**Then** lỗi `P0002` (không đọc thấy review) — **không** rò rỉ sự tồn tại của review.
_Ref: `019:83`_

### AC-09 — Cảnh báo không hard-block
**Given** em X có `warnLowRate=true` và `weightedAverage` null
**When** Trưởng ngành duyệt
**Then** duyệt thành công.
_Ref: `019:86`_

### AC-10 — Dự trưởng không sinh role/tài khoản
**Given** em Y ở lớp Hiệp 2 (`can_propose_trainee=true`), đề xuất Dự trưởng đã duyệt
**Then** có ghi danh mới vào lớp `class_kind='trainee'` năm sau
**And** `role_assignments` **không** có hàng mới cho em Y
**And** `profiles` **không** có hàng mới.
_Ref: `019:109-112`_

### AC-11 — Không hiện trên trang chi tiết thiếu nhi
**Given** tôi mở `/students/[studentId]` với mọi vai trò
**Then** danh sách tab chỉ gồm Tổng quan / Lịch sử lớp / Bí tích / Sức khỏe — **không có** tab đề xuất chuyển lớp.
_Ref: `students/[studentId]/page.tsx:68-72`, `docs/06:247`_

---

## B. Tiêu chí cho phần To-Be (mới)

### AC-12 — Lọc theo lớp
**Given** tôi là Trưởng ngành Ấu với 8 lớp trong ngành
**When** tôi mở `/promotions`
**Then** tôi thấy bảng tiến độ 8 lớp (sĩ số / chưa đề xuất / chờ duyệt / đã duyệt / từ chối)
**When** tôi chọn "Ấu 2A" và trạng thái "Chờ duyệt"
**Then** URL thành `/promotions?classId=…&status=pending` và chỉ hiện ghi danh của lớp đó ở trạng thái đó.

### AC-13 — Hiệu năng
**Given** 500 ghi danh trong phạm vi của tôi
**When** tôi mở `/promotions`
**Then** số truy vấn DB ≤ **6** (không phụ thuộc số dòng)
**And** thời gian render server < 2s.

### AC-14 — Xác nhận trước khi duyệt
**When** tôi bấm "Duyệt"
**Then** hiện hộp xác nhận nêu rõ: tên em, lớp hiện tại → lớp đích, năm học đích
**And** chỉ khi tôi xác nhận thì action mới chạy.

### AC-15 — Bắt buộc lý do khi từ chối
**When** tôi bấm "Từ chối" mà ô ý kiến để trống
**Then** hiện lỗi "Vui lòng nêu lý do từ chối." **và** server cũng từ chối (Zod), không chỉ chặn ở client.

### AC-16 — Cảnh báo bí tích ở lớp cuối ngành
**Given** em Z học lớp có `requires_sacrament_review = true` và **chưa** có Thêm Sức
**When** GLV đại diện tạo đề xuất
**Then** `warning_snapshot` chứa `sacramentReviewRequired: true` và danh sách bí tích còn thiếu
**And** UI hiện cảnh báo
**And** Trưởng ngành **vẫn duyệt được** (không hard-block) sau khi nhập ý kiến.

### AC-17 — Lớp không phải cuối ngành không xét bí tích
**Given** em W học Ấu 1A (`requires_sacrament_review = false`) và chưa có bí tích nào
**Then** `warning_snapshot` **không** có `sacramentReviewRequired` và UI không cảnh báo bí tích.

### AC-18 — Nhật ký quyết định
**Given** review bị từ chối với lý do "Chưa đủ chuyên cần" bởi Trưởng ngành A
**When** đại diện gửi lại và Trưởng ngành A duyệt
**Then** `history` chứa mục ghi lại lần từ chối (người, thời điểm, lý do)
**And** không có đường nào từ ứng dụng xóa/sửa được mục đó.

### AC-19 — Không đóng ghi danh đang chờ duyệt
**Given** em X có review `pending`
**When** Trưởng ngành mở `/classes/[classId]` và thử bấm "Kết thúc" ghi danh của em X
**Then** thao tác bị chặn với thông điệp "Ghi danh này đang có đề xuất chuyển lớp chờ duyệt."
**And** ghi danh giữ nguyên `active`.

### AC-20 — Đề xuất hàng loạt
**Given** lớp Ấu 1A có 28 em chưa đề xuất
**When** tôi chọn tất cả, chọn "Đề nghị lên lớp" + "Ấu 2A", xem lại và xác nhận
**Then** tạo 28 review `pending`
**And** nếu 2 em đã có review `approved` thì 2 em đó bị bỏ qua và được liệt kê tên trong kết quả.

---

## C. Test bảo mật **phải xanh**

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| SEC-01 | `treasurer` mở `/promotions` | Redirect `/access-denied` (`route-map.ts:41`) |
| SEC-02 | Phụ huynh/thiếu nhi mở `/promotions` | Redirect `/access-denied` |
| SEC-03 | JWT `class_teacher` gọi trực tiếp `POST /rest/v1/promotion_reviews` | **403** — bảng không có policy INSERT (`…promotions.sql:342`) |
| SEC-04 | JWT bất kỳ gọi `PATCH /rest/v1/promotion_reviews?id=eq.…` để tự đặt `final_status='approved'` | **403** — không có policy UPDATE |
| SEC-05 | JWT bất kỳ gọi `DELETE /rest/v1/promotion_reviews` | **403** |
| SEC-06 | `anon` gọi `rpc/propose_promotion` hoặc `rpc/approve_promotion_review` | **403** — đã `revoke … from public, anon` (`…promotions.sql:344-345`) |
| SEC-07 | GLV đại diện lớp Ấu 1A gọi `proposePromotion` cho ghi danh lớp Ấu 2A | `FORBIDDEN` ở cả Server Action lẫn RPC |
| SEC-08 | Trưởng ngành Thiếu gọi `reviewPromotion` cho review ngành Ấu | `RESOURCE_NOT_FOUND` (không rò rỉ) |
| SEC-09 | GLV đại diện gọi `reviewPromotion` cho chính đề xuất của mình | `FORBIDDEN` — `can_review_promotion` không bao gồm `class_representative` (`…promotions.sql:53-72`) |
| SEC-10 | GLV đại diện đã bị gỡ phân công (`is_active=false`) gọi `proposePromotion` | `FORBIDDEN` (`permissions.ts:26`) |
| SEC-11 | Gửi `sourceEnrollmentId` không phải UUID | `VALIDATION_ERROR`, **không** chạm DB |
| SEC-12 | Gửi `proposedStatus` ngoài enum | `VALIDATION_ERROR` (Zod) + `23514` (RPC) nếu bypass client |
| SEC-13 | Hai phiên duyệt song song cùng một review | Đúng một ghi danh mới được tạo (row lock `…promotions.sql:246-247`) |
| SEC-14 | Thông điệp lỗi trả về UI | Không chứa SQL raw, không chứa tên bảng/cột, không chứa stack (`actions.ts:14-27`) |

**Điều kiện nghiệm thu tổng:** toàn bộ `supabase/tests/019_promotions_test.sql` (32 assertion) xanh,
toàn bộ SEC-01…SEC-14 xanh, và `npm run build` + `tsc --noEmit` sạch.
