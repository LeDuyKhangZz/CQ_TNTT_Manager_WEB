# M08-PROMOTIONS — 04. Luồng TO-BE

Module **không PASS** → có To-Be. Lõi RPC (`propose_promotion`, `approve_promotion_review`)
được **giữ nguyên**; thay đổi tập trung ở tầng query, UI và 2 bổ sung nghiệp vụ.

---

## TO-BE 1 — Bảng chuyển lớp theo lớp, có lọc và phân trang (thay M08-F01/F09)

### Mục tiêu
Cuối năm, một Trưởng ngành phải duyệt được cả ngành trong một phiên làm việc mà không cuộn
qua hàng trăm card, và trang phải mở được dưới 2 giây với dữ liệu thật (~900 em toàn xứ đoàn).

### Actor
GLV đại diện (một lớp), Trưởng/Phó ngành (nhiều lớp trong ngành), global-write (toàn bộ).

### Bước mới

1. Vào `/promotions` → trang hiển thị **bộ chọn lớp** (mặc định: lớp đầu tiên trong phạm vi) và
   **bảng tiến độ theo lớp**: `Lớp | Sĩ số | Chưa đề xuất | Chờ duyệt | Đã duyệt | Từ chối`.
2. Chọn một lớp → `/promotions?classId=…&status=pending` (state nằm trên URL, chia sẻ được).
3. Danh sách trong lớp render dạng **bảng** (không phải card), 25 dòng/trang, có ô tìm tên.
4. Mỗi dòng có badge trạng thái + nút "Chi tiết" mở panel chứa 2 form hiện tại.

### Phương án kỹ thuật (2 phương án vì ảnh hưởng lớn)

**Phương án A — lọc + phân trang ở tầng ứng dụng, quyền tính theo tập lớp (khuyến nghị)**

- `getPromotionsPageData(params: { classId?, status?, page? })`.
- Tính **một lần** tập lớp mà người dùng được đề xuất:
  `getRepresentativeClassIds(context)` — 2 query cố định (`staff_profiles` + `class_staff_assignments … in(...)`),
  thay cho 2 query/dòng ở `queries.ts:98-101`.
- Truy vấn `enrollments` thêm `.eq("class_id", classId)`, `.range(...)`, và `.eq("academic_year_id", currentYearId)`.
- Chi phí: 4–5 query cố định cho mọi kích thước dữ liệu.
- Rủi ro: thấp. Không đụng DB.

**Phương án B — view tổng hợp `v_promotion_board` ở DB**

- Tạo view join `enrollments × classes × grade_levels × academic_years × promotion_reviews`,
  RLS kế thừa từ bảng gốc; UI chỉ `select` + `range`.
- Ưu: một round-trip; sắp xếp/lọc do Postgres làm.
- Nhược: cần migration + test RLS mới cho view; `security_invoker` phải đúng, nếu sai là lỗ bảo mật.
- Chọn B nếu sau này cần xuất Excel danh sách chuyển lớp.

### Business Rules áp dụng
`BR-M08-14` (chỉ hiện ghi danh của năm học hiện hành), `BR-M08-15` (mặc định lọc `pending` cho người duyệt).

### Validation
`classId` phải là uuid và nằm trong tập lớp người dùng đọc được; sai → hiện lại bộ chọn với thông báo,
không `throw`.

### Permission
Không đổi. RLS vẫn là hàng rào thật; lọc chỉ là tiện ích.

### Trạng thái dữ liệu
Chỉ đọc — không thay đổi.

### Error handling
Không có lớp nào trong phạm vi → empty state "Bạn chưa phụ trách lớp nào trong năm học này."

### Audit
Không phát sinh.

```mermaid
flowchart LR
    A[/promotions] --> B[Bảng tiến độ theo lớp]
    B --> C{Chọn lớp}
    C --> D[?classId=&status=&page=]
    D --> E[Query 4-5 round-trip cố định]
    E --> F[Bảng 25 dòng + tìm kiếm]
    F --> G[Panel chi tiết: form đề xuất / form duyệt]
```

### So sánh số bước
| | AS-IS | TO-BE |
|---|---|---|
| Tìm một em cụ thể | Ctrl+F trên trang hàng trăm card | 1 thao tác chọn lớp + gõ tên |
| Duyệt cả lớp | Cuộn thủ công | Lọc `pending` → duyệt tuần tự |
| Query DB | 3 + 2×N | 4–5 |

### Ảnh hưởng
- Module: M08 (query + component), không ảnh hưởng M03/M05/M07.
- API: chữ ký `getPromotionsPageData` đổi (chỉ nội bộ).
- DB: không (phương án A) / 1 view (phương án B).
- Migration risk: A = không; B = thấp (view, không đụng dữ liệu).
- Rollback: A = revert code; B = `drop view`.

---

## TO-BE 2 — Đề xuất hàng loạt theo lớp

### Mục tiêu
Thao tác thật của GLV đại diện cuối năm là "cả lớp lên lớp, trừ vài em". Hiện phải làm từng em.

### Bước mới
1. Trong bảng của một lớp, chọn nhiều dòng bằng checkbox (có "chọn tất cả dòng chưa đề xuất").
2. Chọn "Đề nghị lên lớp" + lớp đích chung → xem lại danh sách sẽ áp dụng.
3. Xác nhận → server action `proposePromotionBatch(enrollmentIds[], status, targetClassId)`
   gọi `propose_promotion` **tuần tự** cho từng ghi danh, gom kết quả.

### BR
`BR-M08-16`: hàng loạt chỉ áp dụng cho ghi danh **chưa có review** hoặc review `pending`/`rejected`;
ghi danh đã `approved` bị bỏ qua và báo lại tên.

### Validation / Permission
Zod `z.array(uuid).min(1).max(60)`; mỗi phần tử vẫn qua đủ kiểm quyền của `propose_promotion`.

### Error handling
Trả `{ succeeded: n, failed: [{studentName, message}] }`, hiển thị đầy đủ, **không nuốt lỗi**.

### So sánh số bước
30 em: AS-IS 30×3 = 90 thao tác → TO-BE 4 thao tác.

### Ảnh hưởng / rủi ro
Không đụng DB. Rủi ro: thao tác nhầm ở quy mô lớn → **bắt buộc có bước xem lại trước khi xác nhận**.

---

## TO-BE 3 — Kiểm điều kiện bí tích ở lớp cuối ngành (bổ sung nghiệp vụ thiếu)

### Mục tiêu
Thực hiện đúng WF-11: "Chỉ lớp cuối ngành xét điều kiện bí tích", **vẫn là cảnh báo, không hard-block**.

### Bước mới
1. Trong `propose_promotion`, khi lớp nguồn thuộc `grade_level` có `requires_sacrament_review = true`,
   bổ sung vào `warning_snapshot`:
   `{"sacramentReviewRequired": true, "hasBaptism": bool, "hasConfirmation": bool, "missingSacraments": [...]}`.
2. `WarningSummary` hiển thị dòng riêng: "Lớp cuối ngành — thiếu Thêm Sức" với tone cảnh báo.
3. Form duyệt: nếu có thiếu bí tích thì **bắt buộc nhập ý kiến** trước khi bấm Duyệt (client + server).

### BR
`BR-M08-17`: chỉ tính khi `requires_sacrament_review = true`.
`BR-M08-18`: thiếu bí tích **không** chặn duyệt; chỉ buộc ghi ý kiến.

### Permission
Dữ liệu bí tích là nhạy cảm; snapshot chỉ chứa **cờ boolean**, không chứa ngày/nơi → không rò rỉ.
Người duyệt (trưởng ngành) vốn đã có `can_view_student_sensitive` qua ghi danh đang mở
(`enrollments.sql:113-130`).

### Trạng thái dữ liệu
Chỉ thêm khóa vào `warning_snapshot` (jsonb, không cần đổi schema).

### Audit
`review_note` bắt buộc khi có cảnh báo bí tích → có vết lý do.

### Ảnh hưởng
- DB: migration `create or replace function public.propose_promotion(...)` — **không đổi chữ ký**, không đổi bảng.
- Test: thêm case pgTAP cho lớp `is_sector_final_level`.
- Migration risk: thấp; review cũ giữ snapshot cũ (thiếu khóa mới) → UI phải chịu được khóa vắng.
- Rollback: `create or replace` về bản cũ.

---

## TO-BE 4 — Nhật ký quyết định (không mất lịch sử từ chối)

### Mục tiêu
Giữ được "ai từ chối, khi nào, vì sao" sau khi đại diện gửi lại.

### Phương án
**A (khuyến nghị, nhẹ):** thêm cột `history jsonb not null default '[]'` vào `promotion_reviews`;
trước khi upsert ghi đè, `propose_promotion` append bản ghi cũ vào `history`.
**B:** bảng `promotion_review_events` (append-only) + RLS đọc theo cùng scope.

A đủ cho quy mô hiện tại và không sinh bảng mới; B đúng chuẩn audit hơn nếu sau này cần báo cáo.

### BR
`BR-M08-19`: mọi lần chuyển `pending → rejected` và `rejected → pending` phải để lại một mục lịch sử bất biến.

### Error handling / Audit
Không có đường xóa `history` từ ứng dụng (`grant select` như hiện tại).

### Ảnh hưởng
Migration `alter table … add column` (an toàn, không khóa lâu). Rollback: `drop column`.

---

## TO-BE 5 — Bịt đường vòng đóng ghi danh (M08-F10)

### Mục tiêu
Không để `/classes/[classId]` đóng một ghi danh đang có đề xuất `pending`, và làm rõ
"chuyển lớp giữa năm" là một luồng có chủ đích.

### Phương án A — chặn mềm (khuyến nghị cho v1)
- `endEnrollment` kiểm trước: nếu có `promotion_reviews.final_status='pending'` cho ghi danh đó →
  trả `CONFLICT` "Ghi danh này đang có đề xuất chuyển lớp chờ duyệt. Hãy xử lý đề xuất trước."
- UI `/classes/[classId]` hiển thị badge "Đang chờ duyệt chuyển lớp" và ẩn form kết thúc.

### Phương án B — chặn cứng ở DB
- Trigger `before update on enrollments` từ chối khi tồn tại review `pending` và `status` mới không do RPC đặt.
- Cần cờ phiên (`set_config`) để RPC tự bỏ qua trigger → phức tạp, dễ sai.

### BR
`BR-M08-20`: một ghi danh có đề xuất `pending` không được đóng bằng luồng thủ công.

### Ảnh hưởng
A: sửa `src/features/enrollments/server/actions.ts` + trang lớp; **ảnh hưởng M03**, cần thống nhất
với audit M03. B: migration + test trigger.

### Rủi ro migration / rollback
A: không có migration. B: trigger sai làm hỏng cả luồng ghi danh bình thường → phải có pgTAP phủ trước.

---

## TO-BE 6 — Xác nhận trước hành động không lùi được

- Nút "Duyệt" mở hộp xác nhận nêu rõ: em nào, đóng ghi danh lớp nào, mở ghi danh lớp nào, năm nào.
- Nút "Từ chối" bắt buộc `review_note` không rỗng (Zod `min(1)` khi `decision='reject'`).
- Không đụng DB, không đụng RPC.

---

## Không đưa vào To-Be (giữ nguyên vì đã đúng)

- Cơ chế nguyên tử + row lock của `approve_promotion_review` (`…promotions.sql:246-337`).
- Idempotency khi duyệt lại (`257-259`).
- Upsert về `pending` khi gửi lại (`207-221`).
- Mô hình quyền: bảng chỉ `select`, ghi qua RPC (`342-347`).
- Không hiển thị workflow trên trang chi tiết thiếu nhi (`students/[studentId]/page.tsx:68-72`) — đúng `docs/06` §8.
