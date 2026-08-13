# M08-PROMOTIONS — 03. Kết quả audit

## 1. Chấm điểm 15 tiêu chí

| # | Tiêu chí | Điểm /5 | Lý do (có `file:line`) |
|---|---|---:|---|
| 1 | Đúng nghiệp vụ | 4 | 4 trạng thái + Dự trưởng + đổi nhánh A/B đều đúng WF-11. **Trừ điểm:** quy tắc "chỉ lớp cuối ngành xét điều kiện bí tích" (docs/03 WF-11) **không được hiện thực**; `grade_levels.requires_sacrament_review` / `is_sector_final_level` (`20260715000200_academic_structure.sql:53-54`) không được dùng ở bất kỳ đâu trong `src/`; `warning_snapshot` chỉ chứa điểm TB + chuyên cần (`…promotions.sql:181-194`). |
| 2 | Dễ hiểu | 3 | Một card/em, mỗi card có 2 form khác nhau. Không nhóm theo lớp, không có tiêu đề lớp, không có thanh tiến độ "đã đề xuất X/Y". Người duyệt phải cuộn qua toàn bộ ngành. |
| 3 | Số bước hợp lý | 4 | Đề xuất 3 thao tác, duyệt 2 thao tác — hợp lý. **Trừ điểm:** không có thao tác hàng loạt ("đề xuất cả lớp lên lớp"), mà đó chính là thao tác điển hình cuối năm. |
| 4 | Không nhập trùng | 5 | `source_enrollment_id unique` (`…promotions.sql:5`) + upsert (`207-221`) + idempotent approve (`257-259`) + test `019:89-91`. |
| 5 | Khó thao tác nhầm | 3 | Mặc định `recommended_promote` và lớp đích tự chọn phần tử đầu (`promotion-board.tsx:42, 52`) → một cú bấm "Lưu đề xuất" là ra đề xuất hoàn chỉnh mà người dùng chưa thực sự chọn. Nút "Duyệt"/"Từ chối" **không có xác nhận**, mà "Duyệt" là hành động đóng ghi danh cũ — không có đường lùi. |
| 6 | Validation đầy đủ | 4 | 3 tầng: Zod (`schemas.ts:7-29`), CHECK constraint (`…promotions.sql:24-34`), RPC (`145-173`, `294-298`). **Trừ điểm:** lỗi Zod bị nuốt thành thông điệp `CONFLICT` chung (`actions.ts:14-17`); `23514` gộp nhiều nguyên nhân khác nhau vào một câu tiếng Việt (`actions.ts:23-25`). |
| 7 | Trạng thái rõ ràng | 4 | Badge `Chưa đề xuất`/`Chờ duyệt`/`Đã duyệt`/`Từ chối` (`promotion-board.tsx:103`, `constants.ts:11-19`). **Trừ điểm:** không hiển thị ai đề xuất, ai duyệt, lúc nào duyệt (`reviewedAt` có trong type nhưng không render). |
| 8 | Phân quyền an toàn | 5 | Bảng chỉ `grant select` (`…promotions.sql:342`), không có policy ghi → **không có đường ghi trực tiếp qua PostgREST**. Hai RPC `security definer` đều kiểm quyền nội bộ. Server Action kiểm lại lần hai. Test phủ 4 hướng tấn công (`019:72, 83`). |
| 9 | Dữ liệu nhất quán | 4 | Giao dịch nguyên tử + row lock + `previous_enrollment_id`. **Trừ điểm:** lịch sử từ chối bị ghi đè hoàn toàn khi gửi lại (`…promotions.sql:207-221`); luồng thủ công `/classes/[classId]` (`page.tsx:52-64`) đóng được ghi danh **ngoài** workflow, làm review `pending` mồ côi. |
| 10 | Dễ bảo trì | 4 | Feature-sliced rõ, logic nghiệp vụ tập trung ở DB. **Trừ điểm:** mượn `hasGlobalResultWrite` từ `features/assessments` (`permissions.ts:6`) — coupling chéo feature không đúng ngữ nghĩa. |
| 11 | Dễ mở rộng | 3 | `warning_snapshot` là jsonb tự do (tốt), nhưng không có chỗ móc cho: chuyển lớp giữa năm, nhiều vòng duyệt, thu hồi, lý do bắt buộc. Muốn thêm điều kiện bí tích phải sửa cả RPC lẫn UI. |
| 12 | UI hỗ trợ đúng nghiệp vụ | 2 | **Không có lọc theo ngành/lớp, không tìm kiếm, không phân trang, không thao tác hàng loạt** (`promotion-board.tsx:166-169`). Nghiệp vụ thật là "duyệt cả ngành cuối năm" — UI hiện tại buộc cuộn qua hàng trăm card. Không có bộ đếm tiến độ. |
| 13 | Responsive | 4 | `grid gap-4 xl:grid-cols-2` (`promotion-board.tsx:168`), form `md:grid-cols-2` (`117`), badge `flex-wrap` (`101`). Ổn ở 360 và 1366. **Trừ điểm:** ở 360px một card cao ~500px, cuộn rất dài vì không gấp gọn. |
| 14 | Accessibility | 3 | Select cao `h-11 min-h-11` = 44px (`promotion-board.tsx:16`), có `Label htmlFor` cho ô ghi chú (`138, 153`). **Trừ điểm:** checkbox Dự trưởng dùng `<input type="checkbox">` mặc định (~13px, dưới 44px, `135`); hai select chính chỉ có `<span>` trong `<label>` bọc, không `htmlFor`/`id` (`118-131`); thông báo kết quả render bằng `FormMessage` không có `role="status"`/`aria-live` (`160`). |
| 15 | Khả năng kiểm thử | 4 | pgTAP 32 assertion chất lượng cao (`019_promotions_test.sql`), unit test schema. **Trừ điểm:** không test tầng query (nơi có N+1), không có E2E, không test luồng gửi lại sau từ chối ở tầng ứng dụng. |

**Tổng: 56/75.**

## 2. Trạng thái tổng thể

**`NEEDS_IMPROVEMENT`**

Lõi DB của module này rất tốt — nguyên tử, idempotent, phân quyền chặt, có test.
Vấn đề nằm ở **tầng truy vấn (hiệu năng)**, **tầng UI (không dùng được ở quy mô thật)** và
**một quy tắc nghiệp vụ bị bỏ (bí tích lớp cuối ngành)**.

## 3. Trạng thái theo luồng

| Luồng | Trạng thái | Điểm /75 |
|---|---|---:|
| M08-F01 Xem bảng chuyển lớp | `CRITICAL` | 38 |
| M08-F02 Tạo đề xuất | `PASS_WITH_MINOR_UI_FIX` | 62 |
| M08-F03 Sửa / gửi lại đề xuất | `NEEDS_IMPROVEMENT` | 55 |
| M08-F04 Đề xuất Dự trưởng | `PASS` | 66 |
| M08-F05 Duyệt | `PASS_WITH_MINOR_UI_FIX` | 63 |
| M08-F06 Từ chối | `PASS_WITH_MINOR_UI_FIX` | 60 |
| M08-F07 Duyệt lại (idempotent) | `PASS` | 70 |
| M08-F08 Thu hồi đề xuất | `NEEDS_IMPROVEMENT` (chưa có) | 30 |
| M08-F09 Lọc theo ngành/lớp | `NEEDS_IMPROVEMENT` (chưa có) | 28 |
| M08-F10 Chuyển lớp giữa năm | `NEEDS_CONFIRMATION` | 35 |

## 4. Phân tích 5 Whys

### 4.1 CRITICAL — N+1 và tải toàn bộ ghi danh (M08-F01)

> **Hiện tượng:** `/promotions` gọi 2 query DB cho **mỗi** ghi danh (`queries.ts:98-101`) và tải
> toàn bộ ghi danh trong phạm vi không giới hạn năm học/không phân trang (`queries.ts:83-93`).

1. **Vì sao chậm?** Vì `canProposeForClass` được gọi trong `Promise.all` trên từng phần tử.
2. **Vì sao gọi từng phần tử?** Vì hàm nhận `classId` đơn lẻ (`permissions.ts:11`) và được tái dùng nguyên trạng từ chỗ kiểm quyền một hành động.
3. **Vì sao tái dùng cho danh sách?** Vì không có hàm "lấy tập lớp mà tôi là đại diện" (kiểu `scope_class_ids()` đã có sẵn ở tầng DB nhưng không được dùng ở đây).
4. **Vì sao không dùng `scope_class_ids()`?** Vì tầng ứng dụng chọn tự tính quyền bằng TypeScript thay vì hỏi DB, để hiển thị cờ `canPropose`/`canReview` per-row.
5. **Gốc rễ:** **thiếu một truy vấn danh sách được thiết kế cho danh sách** — quyền per-row được suy ra từ hàm quyền per-item, và không có tầng phân trang/lọc nào ép giới hạn số dòng.

### 4.2 Quy tắc bí tích lớp cuối ngành không được hiện thực

1. **Vì sao thiếu?** Vì `warning_snapshot` chỉ lấy từ 2 view điểm/chuyên cần (`…promotions.sql:181-194`).
2. **Vì sao không lấy bí tích?** Vì không có view tổng hợp tình trạng bí tích theo `enrollment`.
3. **Vì sao không có view đó?** Vì `student_sacraments` được thiết kế là dữ liệu nhạy cảm, truy cập qua `can_view_student_sensitive`, chưa có bản tổng hợp phi nhạy cảm.
4. **Vì sao không đặt cờ ở cấp lớp?** `grade_levels.requires_sacrament_review` đã có sẵn (`20260715000200:54`) nhưng chưa ai nối vào module.
5. **Gốc rễ:** **cột cờ được seed nhưng không có consumer** — quy tắc nghiệp vụ đã được mô hình hóa ở schema mà không được kéo lên tới RPC/UI.

### 4.3 Mất lịch sử khi gửi lại đề xuất bị từ chối

1. **Vì sao mất?** Vì `on conflict do update` ghi đè `review_note`, `reviewed_by`, `reviewed_at` về null (`…promotions.sql:213-220`).
2. **Vì sao ghi đè?** Vì mô hình là "một hàng cho một ghi danh" (unique `source_enrollment_id`).
3. **Vì sao chọn một hàng?** Vì `docs/02` §10 mô tả `source_enrollment_id` là unique FK.
4. **Vì sao không có bảng lịch sử?** Vì WF-11 chỉ yêu cầu "gửi lại trên cùng `source_enrollment_id`", không nói tới lưu vết.
5. **Gốc rễ:** **yêu cầu idempotency được hiểu là yêu cầu ghi đè**; không tách "trạng thái hiện tại" khỏi "nhật ký quyết định".

### 4.4 UI không lọc/không phân trang (M08-F09)

1. **Vì sao không có lọc?** Vì `PromotionBoard` chỉ nhận mảng và map (`promotion-board.tsx:168`).
2. **Vì sao chỉ map?** Vì trang không đọc `searchParams`.
3. **Vì sao không đọc?** Vì query không nhận tham số lọc (`getPromotionsPageData()` không tham số, `queries.ts:77`).
4. **Vì sao query không nhận tham số?** Vì phạm vi dữ liệu được coi là "đã bị RLS thu hẹp đủ".
5. **Gốc rễ:** **nhầm phạm vi bảo mật (RLS) với phạm vi trải nghiệm** — RLS giới hạn *được thấy gì*, không giới hạn *phải cuộn bao nhiêu*.

### 4.5 Chuyển lớp giữa năm đi đường vòng (M08-F10)

1. **Vì sao có đường vòng?** Vì `/classes/[classId]` cho phép đóng ghi danh với `status='transferred'` (`page.tsx:52-64`).
2. **Vì sao cho phép?** Vì `endEnrollment` là API quản trị ghi danh tổng quát của M03.
3. **Vì sao không chặn?** Vì `enrollments_update_scope` chỉ kiểm `can_manage_class` (`enrollments.sql:149-152`), không biết có review `pending` hay không.
4. **Vì sao không biết?** Vì không có trigger/constraint nối `promotion_reviews` với `enrollments`.
5. **Gốc rễ:** **hai đường ghi vào cùng một trạng thái, chỉ một đường có quy trình duyệt.**
