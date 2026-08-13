# M09 — BAN & THIẾT BỊ · 07. IMPLEMENTATION IMPACT

Đánh giá tác động nếu triển khai các To-Be ở `04_TO_BE_FLOWS.md`. Giai đoạn 1 **không** thực hiện thay đổi.

## 1. Bảng tác động tổng hợp

| To-Be | DB | Server action / RPC | UI | Test | Module khác | Mức rủi ro |
|---|---|---|---|---|---|---|
| TB-M09-03 PA B (bịt `total_quantity`) | 1 migration sửa TRG | không | không | +2 assert `021` | không | **Thấp** |
| TB-M09-01 PA A (công việc tuần) | 1 CHECK mới | sửa `saveCommitteeWeeklyPlan` | sửa form + danh sách | +3 assert `020`, +2 unit, +1 e2e | không | **Thấp–TB** |
| TB-M09-05 (ma sát UI) | không | sửa `endCommitteeMembership` (bỏ `ends_on`) | 5 chỗ | +1 e2e | không | **Thấp** |
| TB-M09-02 PA A (trả dần) | +1 cột, +2 CHECK, +2 RPC, backfill | +2 action | sửa `equipment-board` | +6 assert `021`, +1 e2e | M11 báo cáo thiết bị (nếu có) | **Trung bình** |
| TB-M09-04 (nhập thêm tồn kho) | +1 bảng, +1 RPC | +1 action | +1 form | +4 assert | không | **Trung bình** |
| TB-M09-06 (bổ khuyết + tabs) | không | +2 action | refactor trang chi tiết | +2 e2e | M14 navigation (URL `?tab=`) | **Trung bình** |
| TB-M09-03 PA A (column privilege) | migration đổi GRANT | map lỗi mới | không | sửa `021:56-59` | không | **Cao** |

## 2. Chi tiết theo tầng

### 2.1 Database

**Migration mới cần viết (đề xuất thứ tự file):**

| File đề xuất | Nội dung | Reversible |
|---|---|---|
| `2026xxxx_equipment_total_guard.sql` | Sửa `app.validate_equipment_item`: chặn đổi `total_quantity` ngoài RPC; thêm nhánh INSERT kiểm `available = total` | ✅ `create or replace` bản cũ |
| `2026xxxx_weekly_plan_nonempty.sql` | `alter table … add constraint committee_weekly_plan_not_empty check (content is not null or jsonb_array_length(checklist_json) > 0) not valid;` rồi `validate constraint` sau khi dọn dữ liệu | ✅ `drop constraint` |
| `2026xxxx_equipment_partial_return.sql` | `outstanding_quantity` + 2 CHECK + backfill + 2 RPC `receive_equipment`/`write_off_equipment` | ⚠️ Backfill không mất dữ liệu, nhưng cột mới `not null` cần `default` tạm |
| `2026xxxx_equipment_stock_adjustments.sql` | Bảng audit + RPC `adjust_equipment_stock` + RLS | ✅ `drop table` |

**Rủi ro dữ liệu hiện có**
- CHECK "công việc tuần không rỗng": dữ liệu production có thể đã có bản `content = null` và
  `checklist_json = '[]'` (đúng là dấu vết của lỗi F11). Phải **đếm trước** rồi quyết định:
  xoá bản trắng hay điền `content = '(chưa nhập)'`. Dùng `not valid` + `validate` để không khoá bảng lâu.
- `outstanding_quantity`: backfill
  `case when status = 'returned' then 0 else quantity end` — an toàn, không phụ thuộc thứ tự.
- **Không** có migration nào cần xoá dữ liệu.

**Hàm `app.*` bị ảnh hưởng**: chỉ `app.validate_equipment_item`. Các helper phạm vi
(`member_committee_ids`, `led_committee_ids`, `can_write_committee_content`, `can_read_equipment`,
`can_operate_equipment`) **không đổi** — đây là điểm tốt: mọi thay đổi đề xuất đều nằm trong ranh giới
hiện có của mô hình quyền.

**Generated types**: `src/types/database.ts` phải regenerate sau mỗi migration
(`outstanding_quantity`, bảng adjustments, RPC mới).

### 2.2 Server actions / RPC

| File | Thay đổi |
|---|---|
| `src/features/committees/server/actions.ts` | `saveCommitteeWeeklyPlan` nhận `expectedUpdatedAt`, bỏ `created_by` khỏi payload upsert (`:233`); `endCommitteeMembership` bỏ `ends_on` (`:138`); **thêm** `updateCommittee`, `updateCommitteeAnnouncement`, `updateCommitteeMeeting` |
| `src/features/committees/schemas.ts` | `committeeWeeklyPlanInputSchema` thêm `expectedUpdatedAt`; thêm `committeeUpdateSchema` |
| `src/features/equipment/server/actions.ts` | Thêm `receiveEquipment`, `writeOffEquipment`, `adjustEquipmentStock`; map mã lỗi mới |
| `src/features/equipment/server/queries.ts` | Trả thêm `outstandingQuantity`; **mở rộng `borrowerOptions`** sang toàn bộ `staff_profiles` (BR-M09-56) |

**Cần rà lại `requireAuthContext` → `requireRouteAccess`** (BR-M09-62): hiện mọi action ở M09 chỉ kiểm
đăng nhập. Đây là thay đổi 12 dòng nhưng chạm **mọi** action của module → nên tách thành PR riêng và
chạy lại toàn bộ `020`/`021` + e2e.

### 2.3 UI

| File | Mức thay đổi |
|---|---|
| `committee-workspace.tsx` (385 dòng) | **Lớn** — tách thành 4 component con theo tab; đổi select chức vụ sang controlled; thêm dialog xác nhận; prefill form tuần |
| `committee-list.tsx` (138 dòng) | Nhỏ — bổ sung thông tin card |
| `equipment-board.tsx` (372 dòng) | **Lớn** — tách "nhận lại" / "báo hỏng-mất"; thêm form nhập kho; hiện `outstanding` |
| `[committeeId]/page.tsx` | Nhỏ — thêm `searchParams.tab` |
| Component dùng chung cần thêm | Dialog xác nhận (kiểm tra `src/components/ui/` đã có chưa; nếu chưa thì đây là component mới dùng lại được cho các module khác) |

### 2.4 Test

| Loại | Bổ sung |
|---|---|
| pgTAP `020` | Lưu đè bản tuần đã có → nội dung cũ không bị mất khi client gửi `expectedUpdatedAt` cũ; `created_by` giữ nguyên tác giả gốc |
| pgTAP `021` | `update total_quantity` trực tiếp phải `23514`; INSERT với `available <> total` phải bị chặn; trả dần 2 lần; `write_off` bởi thành viên thường phải `42501` |
| Unit | `expectedUpdatedAt` lệch → schema/action trả CONFLICT; checklist+content cùng rỗng → invalid |
| E2E `committees.spec.ts` | Kịch bản "hai người cùng sửa một tuần"; kịch bản "trả dần 3 rồi 2"; kịch bản "xoá cần xác nhận" |
| **Đang thiếu và nên thêm bất kể To-Be** | Concurrency thật cho `borrow_equipment` (hai session cùng mượn cái cuối) — hiện chỉ có lập luận, chưa có test |

## 3. Tác động sang module khác

| Module | Tác động | Ghi chú |
|---|---|---|
| **M10 Notifications** | `app.is_committee_leader_or_deputy` được `app.can_publish_notification` dùng lại (`20260723000400_notifications.sql:100-101`). Mọi thay đổi về membership/chức vụ **lập tức** đổi quyền publish thông báo Ban. Không được đổi chữ ký hay ngữ nghĩa hai helper này. | Ràng buộc cứng |
| **M10 Notifications** | `materialize_notification_recipients` với `target_type='committee'` đọc `committee_memberships … is_active` (`:165-172`). Nếu TB-M09-05 đổi cách kết thúc nhiệm kỳ thì danh sách người nhận thay đổi theo — đúng ý (chốt tại thời điểm publish). | Không cần sửa |
| **M11 Reports/Dashboard** | Cần kiểm `20260723000500_dashboard_and_reports.sql` có đọc `equipment_items.total_quantity` không; nếu có, TB-M09-02 đổi ngữ nghĩa cột này | **Cần xác nhận** |
| **M14 Navigation shell** | TB-M09-06 thêm `?tab=` — nav highlight theo prefix `/committees` nên không vỡ (`route-map.ts:53`) | Rủi ro thấp |
| **M04 Staff** | `committee_memberships.staff_profile_id … on delete restrict` (`committees.sql:36`) — không xoá được `staff_profiles` còn chức vụ Ban. Bất kỳ luồng "xoá nhân sự" nào ở M04 phải kết thúc nhiệm kỳ Ban trước | Ràng buộc hiện có |
| **M01 Auth** | `app.can_global_write()` quyết định toàn bộ quyền lập Ban. Thêm/bớt role trong hàm này lan sang M09 ngay | Ràng buộc hiện có |

## 4. Tác động hiệu năng

| Điểm | Hiện trạng | Đánh giá |
|---|---|---|
| `getCommitteesPageData` | 3 truy vấn (staff_profile, committees, tất cả memberships active) rồi lọc bằng JS (`queries.ts:93-113`) | Với global-read, "tất cả memberships active" là toàn bộ bảng. Quy mô xứ đoàn (≈100 nhân sự × ≤2 Ban) → vài trăm dòng, chấp nhận được. Nếu mở rộng nhiều xứ đoàn thì phải đổi sang aggregate ở DB |
| `getCommitteeDetail` | 1 + 4 truy vấn song song + 2 truy vấn staffOptions | Không N+1; `Promise.all` đúng cách |
| `getEquipmentBoard` | 3 truy vấn song song, `limit 50` phiếu | Ổn; nhưng lọc `openLoans`/`closedLoans` ở client trên 50 dòng đầu → nếu có >50 phiếu, phiếu đang mượn cũ nhất **biến mất khỏi màn hình** (`equipment-board.tsx:237`, `queries.ts:59`). Đây là lỗi tiềm ẩn khi kho hoạt động mạnh |
| Index | `committee_memberships_staff_idx`, `_committee_idx`, `equipment_items_committee_idx`, `equipment_loans_*_idx` đủ cho các truy vấn hiện có | ✅ |
| RLS InitPlan | Policy dùng mẫu `(select app.xxx())` để Postgres chạy InitPlan một lần (`committees.sql:181-182`) — đúng bài học ghi trong migration | ✅ |
| ⚠️ Không nhất quán | `committee_content` và `equipment` policy gọi `app.can_write_committee_content(committee_id)` **không** bọc `(select …)` (`committee_content.sql:130`, `equipment.sql:256`). Vì hàm nhận tham số theo cột nên không InitPlan được — đánh giá per-row. Với bảng nhỏ thì không sao, nhưng lệch với mẫu đã chốt | Cần rà |

## 5. Ước lượng công sức

| To-Be | Ước lượng | Ghi chú |
|---|---|---|
| TB-M09-03 PA B | 0,5 ngày | 1 migration + 2 assert |
| TB-M09-01 PA A | 1,5 ngày | Có phần dọn dữ liệu cũ |
| TB-M09-05 | 1 ngày | Cần component dialog dùng chung |
| TB-M09-02 PA A | 3 ngày | DB + RPC + UI + test |
| TB-M09-04 | 2 ngày | |
| TB-M09-06 | 3 ngày | Refactor trang chi tiết |
| Rà `requireRouteAccess` | 0,5 ngày | Tách PR riêng |
| **Tổng** | **≈11,5 ngày** | |

## 6. Điều kiện tiên quyết trước khi triển khai

1. Chốt câu trả lời cho các câu hỏi ở `08_ACCEPTANCE_CRITERIA.md §5` (NEEDS_CONFIRMATION).
2. Đếm dữ liệu production: số bản `committee_weekly_plans` rỗng, số phiếu `status='returned'` có
   `restored_quantity < quantity` (để biết mức độ thiệt hại tồn kho đã xảy ra).
3. Xác nhận M11 có phụ thuộc `equipment_items.total_quantity` hay không.
4. Kiểm tra `src/components/ui/` đã có dialog xác nhận chưa; nếu chưa, thống nhất API component trước.
