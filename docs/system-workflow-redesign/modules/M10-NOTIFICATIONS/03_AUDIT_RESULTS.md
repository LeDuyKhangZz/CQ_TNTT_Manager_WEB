# M10 — THÔNG BÁO · 03. AUDIT RESULTS

Thang điểm 1–5 cho 15 tiêu chí, tổng tối đa **75**.

| Mã | Tiêu chí | | Mã | Tiêu chí |
|---|---|---|---|---|
| C1 | Đúng nghiệp vụ | | C9 | Dữ liệu nhất quán |
| C2 | Dễ hiểu | | C10 | Dễ bảo trì |
| C3 | Số bước hợp lý | | C11 | Dễ mở rộng |
| C4 | Không nhập trùng | | C12 | UI hỗ trợ đúng nghiệp vụ |
| C5 | Khó thao tác nhầm | | C13 | Responsive |
| C6 | Validation đầy đủ | | C14 | Accessibility |
| C7 | Trạng thái rõ ràng | | C15 | Khả năng kiểm thử |
| C8 | Phân quyền an toàn | | | |

## 1. Bảng điểm

| Luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng | Trạng thái |
|---|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|---|
| F01 Soạn & publish | 4 | 4 | 5 | **2** | 3 | 5 | 4 | 5 | 4 | 5 | 4 | 3 | 5 | 4 | 5 | **62** | PASS_WITH_MINOR_UI_FIX |
| F02 Materialize người nhận | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | — | — | 5 | **59/65** → **68/75 quy đổi** | PASS |
| **F03 Xem hộp thư** | **2** | **2** | 4 | **1** | 3 | 3 | **1** | **1** | **1** | 3 | 3 | **2** | 5 | 4 | 3 | **38** | **CRITICAL** |
| F04 Đánh dấu đã đọc (một) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | **74** | PASS |
| F05 Đánh dấu tất cả đã đọc | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | **71** | PASS |
| **F06 Badge unread ở header** | **2** | 3 | 5 | 5 | 4 | 3 | **1** | **1** | **1** | 3 | 3 | **2** | 5 | 5 | 4 | **47** | **CRITICAL** |
| F07 Mở deep-link | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 5 | **71** | PASS |
| F08 Gửi tới "một người" (không có UI) | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | NEEDS_IMPROVEMENT |
| F09 Sửa/xoá thông báo đã publish | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | NEEDS_CONFIRMATION |

> F02 là luồng thuần server, hai tiêu chí C13/C14 không áp dụng — điểm quy đổi theo tỉ lệ.

**Trung bình 7 luồng có điểm: 61,6 / 75.**

---

## 2. Kết luận cho các "kiểm đặc biệt"

| # | Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Ai publish được phạm vi nào — có role nào publish vượt phạm vi không? | **ĐẠT — không role nào vượt phạm vi** | `app.can_publish_notification` (`20260723000400_notifications.sql:74-104`) khớp từng dòng với `docs/05 §6 Notification`; kiểm ở RPC SECURITY DEFINER chứ không dựa RLS; 6 hướng chối có test (`022_notifications_test.sql:81-98,133-135,153-156`). Bảng đối chiếu đầy đủ ở `02_AS_IS_FLOWS.md §F01` |
| 2 | Người nhận có chốt tại thời điểm publish không? (vào lớp sau / rời lớp / count unread) | **ĐẠT cả 3** | Materialize chạy đúng một lần trong cùng giao dịch (`notifications.sql:224`); không có job re-materialize; badge đếm trên `notification_recipients` chứ không tính lại phạm vi; `022:110-126` |
| 3 | `read_at` có đúng per-user không? | **ĐẠT** | `mark_notification_read` cứng `profile_id = auth.uid()` (`notifications.sql:237`); `mark_all_notifications_read` tương tự (`:251`); client không truyền được profile khác; `022:186-200` |
| 4 | Badge count có N+1 query không? | **ĐẠT — không N+1** | Đúng 1 truy vấn `count: "exact", head: true` (`src/features/notifications/server/queries.ts:44-47`) |
| 5 | Badge count có leak count của người khác không? | **KHÔNG ĐẠT — CÓ LEAK** | `queries.ts:42-49` thiếu `.eq("profile_id", …)`; RLS `notification_recipients_select_self` cho global-read thấy **mọi** dòng (`notifications.sql:283-285`) → 6 vai trò thấy tổng unread của cả xứ đoàn |
| 6 | Deep-link validation nằm ở DB constraint hay chỉ Zod? | **ĐẠT — cả hai, có test canh đồng bộ** | CHECK `notifications_link_known_route` (`notifications.sql:47`) + hàm immutable (`:15-31`); Zod (`schemas.ts:21-23`); unit test so từng route **và** so số lượng giữa TS ↔ migration (`tests/unit/notification-schemas.test.ts:24-39`); `022:99-101` |
| 7 | Sửa/xoá thông báo đã publish có được không? | **KHÔNG — không ai làm được qua luồng người dùng** | Chỉ `grant select` (`notifications.sql:260`), không có policy ghi, không có RPC, không có action. Chỉ `service_role` (`:261`). Cần xác nhận là chủ ý |
| 8 | Thông báo tới "một người" có rò danh tính người nhận khác không? | **ĐẠT về danh tính — nhưng rò NỘI DUNG vào hộp thư global-read** | `notification_recipients_select_self` chặn người thường thấy dòng của người khác (`:283-285`); các truy vấn không bao giờ `select profile_id` (`queries.ts:112`). **Nhưng** hộp thư của 6 vai trò global-read hiện luôn nội dung thư riêng của người khác vì thiếu lọc `profile_id` (F03). Ngoài ra phạm vi `user` **chưa có UI** nên chưa dùng được |

---

## 3. Hai lỗi CRITICAL — chi tiết

### 3.1 CRIT-M10-01 — Badge unread đếm của cả hệ thống

**File**: `src/features/notifications/server/queries.ts:42-49`

```ts
const { count } = await supabase
  .from("notification_recipients")
  .select("id", { count: "exact", head: true })
  .is("read_at", null);          // ← thiếu .eq("profile_id", context.profileId)
```

**Điều kiện kích hoạt**: người đăng nhập có `app.can_global_read()` — `super_admin`, `parish_priest`,
`chaplain`, `group_leader`, `deputy_group_leader`, `secretary`.

**Hậu quả**
| Loại | Mô tả |
|---|---|
| Chức năng | Badge vô nghĩa với đúng nhóm người dùng quan trọng nhất. Sau một thông báo "Toàn hệ thống" (≈300 tài khoản), chuông hiện "99+" và không bao giờ về 0 |
| Bảo mật | Rò **số lượng** thông báo chưa đọc của toàn tổ chức cho 6 vai trò; `parish_priest`/`chaplain` không có quyền write nhưng vẫn thấy con số này |
| Lan toả | Chạy ở `src/app/(dashboard)/layout.tsx:7` → **mọi** trang dashboard |

**Sửa tối thiểu**: thêm `.eq("profile_id", context.profileId)` và truyền `context` vào hàm.

### 3.2 CRIT-M10-02 — Hộp thư hiển thị thông báo của người khác

**File**: `src/features/notifications/server/queries.ts:111-115`

```ts
const { data } = await supabase
  .from("notification_recipients")
  .select("read_at, notifications(id, title, content, published_at, link_path, target_type)")
  .order("delivered_at", { ascending: false })
  .limit(50);                    // ← thiếu .eq("profile_id", context.profileId)
```

**Hậu quả**
| # | Mô tả |
|---|---|
| 1 | Hộp thư cá nhân của 6 vai trò global-read là "50 dòng recipient mới nhất của toàn hệ thống" |
| 2 | `read_at` hiển thị là của **người khác** → badge "Mới" sai |
| 3 | Một thông báo gửi 200 người xuất hiện 200 lần; `key={item.id}` (`notification-center.tsx:175`) trùng lặp |
| 4 | Nội dung thư riêng (`target_type='user'`) nằm trong hộp thư cá nhân của họ |
| 5 | Bấm "Đánh dấu đã đọc" không có tác dụng vì RPC chỉ đụng dòng của chính mình → nút bấm mãi không tắt |
| 6 | Thông báo thật sự dành cho họ bị đẩy khỏi 50 dòng đầu → **bỏ lỡ thông báo** |

**Sửa tối thiểu**: thêm `.eq("profile_id", context.profileId)`; đồng thời lấy `unreadCount` từ count
thật thay vì đếm trên 50 dòng (`queries.ts:133`).

---

## 4. Phân tích 5 Whys

### 4.1 CRIT-M10-01 & CRIT-M10-02 (chung một gốc rễ)

| Cấp | Câu hỏi | Trả lời |
|---|---|---|
| Why 1 | Vì sao badge và hộp thư hiện dữ liệu của người khác? | Truy vấn không lọc `profile_id` |
| Why 2 | Vì sao không lọc? | Vì lập trình viên tin rằng RLS đã lọc giúp |
| Why 3 | Vì sao tin như vậy? | Vì policy `notification_recipients_select_self` **có** mệnh đề `profile_id = auth.uid()` — đọc lướt thì đúng là "chỉ thấy dòng của mình" |
| Why 4 | Vì sao mệnh đề `or (select app.can_global_read())` bị bỏ qua? | Vì nó phục vụ một mục đích **khác** (cho admin đọc/kiểm tra dữ liệu), nhưng lại nằm chung trong policy dùng cho **màn hình cá nhân** |
| Why 5 (gốc rễ) | Vì sao nhầm lẫn này không bị bắt? | Vì **RLS được dùng như bộ lọc nghiệp vụ chứ không phải hàng rào bảo mật**. RLS trả lời "được phép thấy gì", truy vấn phải trả lời "muốn thấy gì". Trộn hai câu hỏi làm một khiến mọi màn hình "của tôi" trở nên sai ngay khi ai đó có quyền rộng hơn. pgTAP kiểm bằng phiên phụ huynh (`022:186-200`) — vai trò **không** có global read — nên không bao giờ chạm tới nhánh này; E2E cũng chỉ đăng nhập phụ huynh (`committees.spec.ts:228`) |

**Bài học lan sang module khác**: mọi truy vấn "của tôi" trong repo cần được rà xem có dựa vào RLS để
lọc thay vì lọc tường minh không — nhất là những bảng có policy chứa `or can_global_read()`.

### 4.2 F01 — Không có idempotency khi publish

| Cấp | Trả lời |
|---|---|
| Why 1 | Bấm gửi hai lần tạo hai thông báo |
| Why 2 | Vì `publish_notification` không nhận khoá idempotency và không có unique nào ngăn trùng |
| Why 3 | Vì `docs/11 §18` chỉ **liệt kê** "publish notification" cần idempotency mà không định nghĩa khoá |
| Why 4 | Vì thông báo không có khoá tự nhiên rõ ràng (cùng title + cùng target + cùng phút có thể là chủ ý) |
| Why 5 (gốc rễ) | Yêu cầu idempotency được ghi ở mức danh sách chứ chưa được chuyển thành thiết kế (client-generated request id) → không ai biết phải làm gì để coi là "xong" |

### 4.3 F08 — Phạm vi "một người" có DB nhưng không có UI

| Cấp | Trả lời |
|---|---|
| Why 1 | Không gửi được cho một người |
| Why 2 | `availableTargets` không bao giờ đẩy `"user"` (`notification-center.tsx:33-40`) |
| Why 3 | Vì `getPublishOptions` không dựng danh sách người nhận (`queries.ts:57-62` chỉ có sectors/classes/committees) |
| Why 4 | Vì dựng danh sách "chọn một người" cần một picker tìm kiếm (hàng trăm profile), khác hẳn 3 dropdown còn lại |
| Why 5 (gốc rễ) | Phạm vi `user` được thiết kế ở DB cùng lúc với 6 phạm vi kia, nhưng chi phí UI của nó khác một bậc; không có ghi chú "để sau" nên nó trôi vào vùng xám giữa "đã làm" và "chưa làm" — pgTAP cũng không có assert nào cho `user` |

### 4.4 F09 — Không thu hồi được thông báo đã gửi

| Cấp | Trả lời |
|---|---|
| Why 1 | Gửi nhầm thì không sửa/xoá được |
| Why 2 | Không có grant/policy/RPC ghi trên `notifications` |
| Why 3 | Vì mô hình coi thông báo là **sự kiện đã xảy ra**, bất biến |
| Why 4 | Vì `docs/03 WF-14` chỉ mô tả đường đi xuôi (publish → đọc → badge), không mô tả đường sửa sai |
| Why 5 (gốc rễ) | Bất biến là lựa chọn tốt cho **bản ghi**, nhưng người dùng cần một đường sửa sai ở mức **hiển thị** (thu hồi/đính chính). Thiếu khái niệm "thu hồi" chứ không phải thiếu quyền xoá |

### 4.5 F02 cạnh 1 — Gửi cho người chưa có role assignment = hố đen

| Cấp | Trả lời |
|---|---|
| Why 1 | Người nhận không bao giờ thấy thông báo |
| Why 2 | `candidate` bắt buộc `join role_assignments … is_active` (`notifications.sql:127-128`) |
| Why 3 | Vì join này dùng để lọc theo `role`/`sector_id`/`class_id` cho các phạm vi nhóm |
| Why 4 | Nhánh `user` không cần các cột đó nhưng vẫn phải qua join |
| Why 5 (gốc rễ) | Một mệnh đề `from` dùng chung cho 7 phạm vi có ngữ nghĩa khác nhau; điều kiện "phải có role đang hoạt động" đúng cho 6 phạm vi nhóm nhưng sai cho phạm vi cá nhân. Và publisher **không được báo** khi `recipient_count = 0` nên lỗi vô hình |

---

## 5. Điểm mạnh cần giữ nguyên

1. **Materialize trong cùng giao dịch với publish** — `perform` nằm trong thân
   `publish_notification` (`notifications.sql:224`). Không có cửa sổ thời gian nào mà thông báo tồn tại
   nhưng chưa có người nhận.
2. **Bảng ghi chỉ qua RPC**: `authenticated` chỉ có `select` (`:260`); không policy INSERT/UPDATE/DELETE.
   Có test khẳng định (`022:75-78`).
3. **Kiểm quyền publish trong SECURITY DEFINER**, tách khỏi RLS — không thể lách bằng cách thao tác bảng.
4. **`read_at` per-user cứng theo `auth.uid()`** trong cả hai RPC — client không truyền được profile khác.
5. **Deep-link allowlist ở cả DB và Zod, có unit test canh chống trôi** (`notification-schemas.test.ts:24-39`).
   Test này còn so **số lượng** route, nên thêm route ở một bên mà quên bên kia sẽ đỏ. Mẫu chuẩn nên nhân rộng.
6. **`distinct` + unique `(notification_id, profile_id)`** chặn trùng khi một người thuộc nhiều nhánh
   (GLV kiêm phụ huynh, D-25) — `:125,178,67`.
7. **`notifications_target_shape`** đảm bảo đúng một cột target khác null, không có trạng thái nửa vời (`:48-56`).
8. **`markRead` không nuốt lỗi im lặng** — có comment giải thích vì sao phải hiện lỗi
   (`notification-center.tsx:79-83`).
