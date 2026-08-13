# M09 — BAN & THIẾT BỊ · 03. AUDIT RESULTS

Thang điểm 1–5 cho 15 tiêu chí, tổng tối đa **75**.

| Mã | Tiêu chí |
|---|---|
| C1 | Đúng nghiệp vụ |
| C2 | Dễ hiểu |
| C3 | Số bước hợp lý |
| C4 | Không nhập trùng |
| C5 | Khó thao tác nhầm |
| C6 | Validation đầy đủ |
| C7 | Trạng thái rõ ràng |
| C8 | Phân quyền an toàn |
| C9 | Dữ liệu nhất quán |
| C10 | Dễ bảo trì |
| C11 | Dễ mở rộng |
| C12 | UI hỗ trợ đúng nghiệp vụ |
| C13 | Responsive |
| C14 | Accessibility |
| C15 | Khả năng kiểm thử |

## 1. Bảng điểm

| Luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng | Trạng thái |
|---|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|---|
| F01 Xem danh sách Ban | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 3 | 5 | 5 | 5 | **69** | PASS |
| F02 Tạo Ban | 4 | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 4 | 3 | 3 | 5 | 5 | 4 | **65** | PASS_WITH_MINOR_UI_FIX |
| F03 Mở chi tiết Ban / URL trực tiếp | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 5 | **73** | PASS |
| F04 Thêm nhân sự vào Ban | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | **73** | PASS |
| F05 Đổi chức vụ | 4 | 3 | 5 | 5 | 2 | 3 | 2 | 5 | 3 | 4 | 3 | 3 | 5 | 5 | 3 | **55** | NEEDS_IMPROVEMENT |
| F06 Kết thúc nhiệm kỳ | 4 | 4 | 5 | 5 | 2 | 3 | 4 | 5 | 3 | 4 | 4 | 3 | 5 | 5 | 4 | **60** | PASS_WITH_MINOR_UI_FIX |
| F07 Đăng thông báo Ban | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 5 | **70** | PASS |
| F08 Xóa thông báo Ban | 4 | 4 | 5 | 5 | 2 | 4 | 4 | 5 | 4 | 5 | 4 | 3 | 5 | 5 | 4 | **63** | PASS_WITH_MINOR_UI_FIX |
| F09 Tạo lịch họp | 4 | 4 | 5 | 4 | 3 | 4 | 3 | 5 | 5 | 4 | 3 | 3 | 5 | 5 | 4 | **61** | PASS_WITH_MINOR_UI_FIX |
| F10 Xóa lịch họp | 4 | 4 | 5 | 5 | 2 | 4 | 4 | 5 | 4 | 5 | 4 | 3 | 5 | 5 | 4 | **63** | PASS_WITH_MINOR_UI_FIX |
| **F11 Lưu công việc tuần (upsert)** | 3 | 2 | 4 | 5 | **1** | 3 | 2 | 5 | **2** | 4 | 3 | **1** | 5 | 5 | 3 | **48** | **CRITICAL** |
| F12 Xóa công việc tuần | 4 | 4 | 5 | 5 | 2 | 4 | 4 | 5 | 4 | 5 | 4 | 3 | 5 | 5 | 4 | **63** | PASS_WITH_MINOR_UI_FIX |
| F13 Tạo thiết bị | 4 | 4 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | **66** | PASS_WITH_MINOR_UI_FIX |
| **F14 Sửa danh mục thiết bị** | 3 | 4 | 5 | 5 | 3 | 3 | 3 | **2** | **2** | 3 | 3 | 3 | 5 | 5 | 4 | **53** | **NEEDS_IMPROVEMENT** |
| F15 Cho mượn thiết bị | 4 | 4 | 4 | 4 | 3 | 5 | 5 | 5 | 5 | 5 | 4 | 3 | 5 | 5 | 5 | **66** | PASS_WITH_MINOR_UI_FIX |
| **F16 Ghi nhận trả / hỏng-mất** | **2** | **2** | 4 | 4 | **1** | 4 | 3 | 5 | 3 | 4 | 3 | **2** | 5 | 5 | 5 | **52** | **NEEDS_IMPROVEMENT** |
| F17 Trả lại phiếu đã trả (idempotent) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **75** | PASS |
| F18 Sửa/ngưng Ban (thiếu) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | NEEDS_CONFIRMATION |
| F19 Nhập thêm tồn kho (thiếu) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | NEEDS_IMPROVEMENT |

**Trung bình 17 luồng có điểm: 63,3 / 75.**

---

## 2. Kết luận cho các "kiểm đặc biệt"

| # | Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Người ngoài Ban mở thẳng `/committees/<id>` có thấy nội dung không? | **ĐẠT — không thấy** | `queries.ts:123-128` → `null` → `notFound()` (`[committeeId]/page.tsx:22`); 4 policy select bind `member_committee_ids()`; `020_committees_test.sql:129-137`; `tests/e2e/committees.spec.ts:200-204` |
| 2 | Trigger `app.validate_committee_membership` (SECURITY DEFINER) có đếm đúng 2 Ban không? | **ĐẠT** | `committees.sql:68-102`; loại chính nó bằng `committee_id <> new.committee_id and id <> new.id`; DEFINER nên không bị RLS bóp méo; `020_committees_test.sql:72-83` |
| 3 | `app.validate_equipment_item` chặn sửa tay `available_quantity` bằng biến phiên `app.equipment_rpc` — có phải cách chuẩn không? | **KHÔNG ĐẠT (thiết kế không chuẩn, hiện chưa khai thác được từ client)** | Xem §3 dưới |
| 4 | Trả một phiếu đã trả có idempotent không? | **ĐẠT** | `equipment.sql:208-211`; test `021:119-126` |
| 5 | Mượn quá tồn kho? | **ĐẠT** | `equipment.sql:159-161`; test `021:81-83` |
| 6 | Mượn số lượng âm/0? | **ĐẠT (hai lớp)** | Zod `positive()` (`equipment/schemas.ts:26`) + RPC `p_quantity <= 0` (`equipment.sql:156-158`); test `021:84-86` |
| 7 | Hai người cùng mượn cái cuối cùng? | **ĐẠT** | `SELECT … FOR UPDATE` trước khi đọc `available_quantity` (`equipment.sql:145-146`), READ COMMITTED đọc lại bản mới nhất sau khi thả khoá |
| 8 | Công việc tuần ghi đè tuần cũ có mất dữ liệu ngoài ý muốn không? | **KHÔNG ĐẠT — CÓ mất dữ liệu** | Form không prefill (`committee-workspace.tsx:336-350`), upsert ghi đè toàn bộ (`actions.ts:225-239`), không có cảnh báo/lịch sử |
| 9 | Ai xóa được nội dung Ban? | **ĐẠT nhưng thô** | `app.can_write_committee_content` = Trưởng/Phó Ban đó **hoặc** global-write (`committees.sql:158-169`); Phó ban xóa được bài Trưởng ban; không có confirm, không audit |

---

## 3. Đánh giá thiết kế biến phiên `app.equipment_rpc`

### 3.1 Cơ chế hiện tại

```sql
-- 20260723000300_equipment.sql:88-91
if tg_op = 'UPDATE' and new.available_quantity <> old.available_quantity
   and current_setting('app.equipment_rpc', true) is distinct from 'on' then
  raise exception 'EQUIPMENT_AVAILABLE_READONLY' using errcode = '23514';
end if;
```
RPC bật cờ ngay trước UPDATE và tắt ngay sau (`equipment.sql:166-171`, `:218-226`), phạm vi `is_local = true`.

### 3.2 Có phải cách chuẩn không? — **Không.**

Cách chuẩn của Postgres cho "cột chỉ đọc với `authenticated`" là **column-level privilege**:

```sql
revoke update on public.equipment_items from authenticated;
grant update (name, category, condition, storage_location, note, is_active, updated_by)
  on public.equipment_items to authenticated;
```

Hiện repo đang `grant select, insert, update on public.equipment_items to authenticated`
(`equipment.sql:243`) — quyền UPDATE **mọi cột**, rồi mới dùng trigger + GUC để vá lại một cột.

### 3.3 Rủi ro cụ thể

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| R1 | **`total_quantity` không được bảo vệ gì cả.** Bất kỳ Trưởng/Phó Ban KT hoặc global-write nào cũng PATCH thẳng qua PostgREST để bơm/nắn tổng kho, ngoài mọi phiếu mượn/trả | **CAO** | Trigger chỉ kiểm `available_quantity`; CK `available ≤ total` chỉ chặn chiều giảm |
| R2 | Nhánh INSERT không kiểm `available_quantity` → insert trực tiếp `available=0,total=100` hợp lệ | TRUNG BÌNH | `equipment.sql:88` bind `tg_op = 'UPDATE'` |
| R3 | Cờ là **trạng thái toàn phiên/giao dịch**, không gắn với dòng đang sửa. Bất kỳ hàm SECURITY DEFINER nào trong tương lai bật cờ rồi gọi tiếp code khác sẽ vô hiệu hoá toàn bộ hàng rào cho **mọi** thiết bị trong giao dịch đó | TRUNG BÌNH | Đây là rủi ro bảo trì, không phải lỗ hổng hôm nay |
| R4 | GUC namespace `app.*` là **tuỳ biến, không reserved** — mọi role đều `set_config` được. Hiện chưa khai thác được vì `supabase/config.toml` chỉ expose `["public","graphql_public"]`, PostgREST một request = một câu lệnh, và client không tạo được function | THẤP (hôm nay) | Đổi cấu hình expose schema `app`, hoặc thêm một RPC vô tình cho phép chạy SQL tuỳ ý, là mất hàng rào |
| R5 | `validate_equipment_item` **không** `security definer` trong khi các trigger cùng repo khác thì có → khác biệt không được ghi lý do | THẤP | `equipment.sql:74-78` so với `committees.sql:68-73` |

### 3.4 Điểm cộng của thiết kế hiện tại

- Thông điệp lỗi rõ ràng (`EQUIPMENT_AVAILABLE_READONLY`) và đã được test hoá (`021:56-59`).
- `equipment_loans` làm đúng chuẩn: `grant select` **duy nhất**, mọi ghi qua RPC (`equipment.sql:244`).

**Kết luận**: cơ chế đúng ý định nhưng sai công cụ; hàng rào không đầy đủ (bỏ trống `total_quantity`)
và không tự-vệ theo thời gian. Xem To-Be TB-M09-03.

---

## 4. Phân tích 5 Whys cho các luồng không PASS

### 4.1 F11 — Công việc tuần ghi đè mất dữ liệu (CRITICAL)

| Cấp | Câu hỏi | Trả lời |
|---|---|---|
| Why 1 | Vì sao nội dung tuần bị mất? | Vì upsert ghi đè toàn bộ `content` và `checklist_json` bằng payload mới (`actions.ts:225-239`) |
| Why 2 | Vì sao payload mới lại rỗng? | Vì form không nạp bản đã có; `content`/`checklist` không có `defaultValue` (`committee-workspace.tsx:342-348`) |
| Why 3 | Vì sao form không nạp? | Vì màn hình thiết kế theo hướng "form tạo mới + danh sách bên dưới", chưa có khái niệm "sửa bản tuần X" |
| Why 4 | Vì sao chưa có khái niệm sửa? | Vì `docs/03 WF-12` chỉ nói "sửa lại tuần cũ là ghi đè, không tạo bản thứ hai" — câu này mô tả ràng buộc **lưu trữ** (1 bản/tuần), lập trình viên hiểu thành ràng buộc **thao tác** (cứ ghi đè) |
| Why 5 (gốc rễ) | Vì sao hiểu nhầm không bị bắt? | Vì không có test nào kiểm "lưu tuần đã có → nội dung cũ ra sao"; `020_committees_test.sql` chỉ kiểm CHECK thứ Hai, E2E chia mỗi project một tuần riêng (`committees.spec.ts:163-164`) nên **cố ý tránh** đúng tình huống này |

**Gốc rễ**: thiếu phân biệt "1 bản/tuần" (ràng buộc lưu trữ) với "sửa bản đang có" (thao tác người dùng),
và test được thiết kế để né va chạm thay vì kiểm va chạm.

### 4.2 F14 — `total_quantity` không được bảo vệ (NEEDS_IMPROVEMENT)

| Cấp | Trả lời |
|---|---|
| Why 1 | `total_quantity` sửa được tuỳ ý vì `grant update` là toàn cột (`equipment.sql:243`) |
| Why 2 | Vì hàng rào chọn là trigger + GUC thay vì column privilege |
| Why 3 | Vì yêu cầu ghi trong `docs/02 §11.7` chỉ nêu đích danh `available_quantity` |
| Why 4 | Vì tài liệu coi `total_quantity` là "cột danh mục" (nhập tay khi tạo) trong khi `return_equipment` lại dùng nó như **cột sổ kho** (`equipment.sql:222`) |
| Why 5 (gốc rễ) | `total_quantity` mang **hai vai trò mâu thuẫn** — vừa là dữ liệu danh mục do người nhập, vừa là số dư kho do RPC tính — và không luồng nào giải quyết mâu thuẫn này |

### 4.3 F16 — "Trả một phần" đồng nghĩa xoá sổ (NEEDS_IMPROVEMENT)

| Cấp | Trả lời |
|---|---|
| Why 1 | Trả 3/5 làm mất 2 cái khỏi tổng kho vì `total -= (quantity - restored)` (`equipment.sql:222`) |
| Why 2 | Vì mô hình chỉ có 2 trạng thái phiếu: `borrowed` / `returned` (`equipment.sql:50`) |
| Why 3 | Vì `WF-13` bước 5 chỉ mô tả tình huống hỏng/mất, không mô tả tình huống "trả dần" |
| Why 4 | Vì v1 giả định mượn/trả trong một buổi sinh hoạt, trả là một lần dứt điểm |
| Why 5 (gốc rễ) | Nhãn UI "Số lượng trả được" không truyền đạt hệ quả (phần chênh = mất vĩnh viễn), nên giả định của mô hình không được người dùng nhìn thấy → thao tác nhầm gần như chắc chắn xảy ra |

### 4.4 F05 — Đổi chức vụ auto-save không đồng bộ (NEEDS_IMPROVEMENT)

| Cấp | Trả lời |
|---|---|
| Why 1 | Sau khi lỗi, select vẫn hiện chức vụ mới còn DB giữ chức vụ cũ |
| Why 2 | Vì `<select defaultValue={member.position}>` là uncontrolled (`committee-workspace.tsx:168`) |
| Why 3 | Vì luồng chọn "lưu ngay khi onChange" thay vì có nút xác nhận |
| Why 4 | Vì muốn giảm số bước cho thao tác được coi là ít rủi ro |
| Why 5 (gốc rễ) | Đổi chức vụ **không** phải thao tác ít rủi ro: nó thay đổi quyền ghi nội dung Ban (`leader/deputy` → `app.can_write_committee_content`), nên "một cú click, không xác nhận, không phản hồi trạng thái thật" là mức bảo vệ không tương xứng |

### 4.5 F06 — `ends_on` lấy ngày UTC

| Cấp | Trả lời |
|---|---|
| Why 1 | Kết thúc nhiệm kỳ lúc sáng sớm có thể ném `23514` |
| Why 2 | Vì `ends_on` = `new Date().toISOString().slice(0,10)` = ngày UTC (`actions.ts:138`), còn `starts_on` = `current_date` của DB |
| Why 3 | Vì hai nguồn thời gian khác nhau: một ở Node, một ở Postgres |
| Why 4 | Vì action tự tính ngày thay vì để DB tính |
| Why 5 (gốc rễ) | Quy ước "mốc ngày lấy từ DB" (đã áp dụng cho attendance lease theo `CLAUDE.md §5`) chưa được áp dụng nhất quán cho module này |

### 4.6 F08/F10/F12 — Xoá một cú bấm, không xác nhận, không audit

| Cấp | Trả lời |
|---|---|
| Why 1 | Bấm nhầm "Xóa" là mất luôn nội dung |
| Why 2 | Vì không có `confirm`/dialog và không có bản lưu |
| Why 3 | Vì comment migration coi "nội dung Ban không phải dữ liệu chốt sổ nên cho phép xóa" (`committee_content.sql:120-121`) |
| Why 4 | "Cho phép xóa" bị hiểu là "xoá không cần thủ tục" |
| Why 5 (gốc rễ) | Không phân biệt *quyền được xoá* với *ma sát cần thiết khi xoá*; nút "Xóa" đặt ngay cạnh tiêu đề bài viết, cùng kích thước với các nút vô hại khác |

---

## 5. Điểm mạnh cần giữ nguyên

1. **Cách ly Ban tuyệt đối**: mọi policy nội dung Ban đều bind `member_committee_ids()` — kiểm bằng
   pgTAP với JWT thật, không dùng service role (`020_committees_test.sql:5`).
2. **Tác giả không nhận từ client**: `app.set_committee_content_author` ghi đè `created_by` và
   `author_staff_id` từ `auth.uid()` (`committee_content.sql:78-97`), có test khẳng định (`020:101-104`).
3. **Row lock đúng chỗ** trong `borrow_equipment`/`return_equipment`.
4. **Idempotency của trả** đặt sau kiểm quyền → không rò trạng thái phiếu cho người ngoài Ban.
5. **`equipment_loans` chỉ grant SELECT** — sổ mượn/trả không ghi tay được.
6. **Mốc tuần thứ Hai chốt ở cả 3 tầng**: Zod (`schemas.ts:51-58`), CHECK (`committee_content.sql:60`),
   unique (`:62`) — đây là mẫu chuẩn nên nhân rộng.
7. **Touch target ≥44px ở mọi size nút** (`src/components/ui/button.tsx:20-24`) và `h-11` cho select.
