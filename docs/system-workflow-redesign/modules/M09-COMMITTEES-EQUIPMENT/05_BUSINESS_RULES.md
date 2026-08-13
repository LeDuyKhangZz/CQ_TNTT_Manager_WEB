# M09 — BAN & THIẾT BỊ · 05. BUSINESS RULES

Cột **Nơi enforce**: `UI` = ẩn/vô hiệu hoá (không phải authorization) · `Zod` = validation server-side
trong action · `RLS` = row-level security · `CK` = check constraint · `UQ` = unique index ·
`TRG` = trigger · `RPC` = logic trong stored procedure · `—` = **chưa được enforce ở đâu cả**.

## A. Ban và chức vụ

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M09-01 | Mã Ban chỉ gồm chữ in hoa, số, gạch dưới; dài 2–32 ký tự; duy nhất toàn hệ thống (không phân biệt hoa/thường vì `citext`) | Zod + CK + UQ | `src/features/committees/schemas.ts:7`; `20260723000100_committees.sql:14,26` |
| BR-M09-02 | Chỉ role global-write (`super_admin`, `group_leader`, `deputy_group_leader`, `secretary`) mới tạo Ban và lập chức vụ Ban | RLS (+UI ẩn nút) | `committees.sql:184-186,198-200`; `src/features/committees/server/permissions.ts:7-16` |
| BR-M09-03 | `updated_by` khi ghi `committees`/`committee_memberships` phải bằng chính người đang đăng nhập | RLS (`with check`) | `committees.sql:186,190,200,204` |
| BR-M09-04 | Ban có thể sửa tên/mô tả/trạng thái bởi global-write | **—** (policy có, không có luồng gọi) | `committees.sql:187-190` · thiếu action trong `src/features/committees/server/actions.ts` |
| BR-M09-05 | Ban không bị xoá cứng — mọi bảng con tham chiếu `on delete restrict` | CK/FK | `committees.sql:35`; `committee_content.sql:16,32,50`; `equipment.sql:17,38` |
| BR-M09-06 | Đúng một Ban giữ kho thiết bị (`manages_equipment`), mặc định là `KY_THUAT` | Seed (+TRG khi gắn thiết bị) | `supabase/seed.sql:64-66`; `equipment.sql:80-85`; test `020_committees_test.sql:14-17` |
| BR-M09-07 | Chức vụ Ban gồm đúng 4 giá trị: cố vấn tối cao / trưởng ban / phó ban / thành viên | Zod + enum DB | `constants.ts:1`; `schemas.ts:15`; `committees.sql:37` |
| BR-M09-08 | Chức vụ Ban **không** thay đổi primary role của nhân sự (D-15) | Thiết kế (bảng tách rời) | `committees.sql:4-6` |
| BR-M09-09 | Mỗi nhân sự tối đa **2 Ban đang hoạt động** | TRG SECURITY DEFINER (+UI vô hiệu hoá option) | `committees.sql:68-102`; `committee-workspace.tsx:209-213`; test `020:72-83` |
| BR-M09-10 | Không thêm được nhân sự vào Ban đã ngưng hoạt động | TRG | `committees.sql:81-83` |
| BR-M09-11 | Một người không giữ hai chức vụ song song trong cùng một Ban | UQ partial | `committees.sql:51-53` |
| BR-M09-12 | Gỡ người khỏi Ban là **kết thúc nhiệm kỳ** (`is_active=false` + `ends_on`), không xoá dòng — giữ lịch sử | Action + CK | `actions.ts:127-151`; `committees.sql:45-46`; test `020:84-87` |
| BR-M09-13 | `ends_on >= starts_on`; dòng còn hoạt động thì `ends_on` phải null | CK | `committees.sql:45-46` |
| BR-M09-14 | Chỉ tối đa một Trưởng ban và một Phó ban trong mỗi Ban | **—** (không có ràng buộc nào) | — |
| BR-M09-15 | Thành viên chỉ đọc được Ban mà mình đang tham gia; global-read đọc tất cả | RLS | `committees.sql:178-183,192-197`; test `020:122-141` |

## B. Nội dung Ban (thông báo / lịch họp / công việc tuần)

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M09-16 | Chỉ Trưởng/Phó Ban **của chính Ban đó**, hoặc global-write, mới tạo/sửa/xoá nội dung Ban | RLS qua `app.can_write_committee_content` | `committees.sql:158-169`; `committee_content.sql:128-171`; test `020:91-94,117-120` |
| BR-M09-17 | Thành viên thường và Cố vấn tối cao **chỉ đọc** nội dung Ban | RLS | `committee_content.sql:122-127,139-144,156-161` |
| BR-M09-18 | Tác giả nội dung (`created_by`, `author_staff_id`) lấy từ phiên đăng nhập, **không nhận từ client** | TRG | `committee_content.sql:78-103`; test `020:101-104` |
| BR-M09-19 | Nội dung Ban được phép xoá cứng (không phải dữ liệu chốt sổ) | RLS delete | `committee_content.sql:120-121,135-137,152-154,169-171` |
| BR-M09-20 | Tiêu đề thông báo ≤200 ký tự, nội dung ≤5000, cả hai không được rỗng sau `trim` | Zod + CK | `schemas.ts:29-30`; `committee_content.sql:17-18` |
| BR-M09-21 | Buổi họp có `ends_at` thì phải ≥ `starts_at` | Zod (superRefine) + CK | `schemas.ts:40-44`; `committee_content.sql:42` |
| BR-M09-22 | Lịch họp chỉ hiển thị trong web — không gửi lời mời, không nhắc lịch (D-50) | Thiết kế | `committee_content.sql:178-179` |
| BR-M09-23 | Mốc tuần của công việc tuần **luôn là thứ Hai** | Zod + CK | `schemas.ts:51-58`; `committee_content.sql:60`; test `020:113-116`, `tests/unit/committee-schemas.test.ts` |
| BR-M09-24 | Mỗi Ban chỉ có **một** bản công việc cho mỗi tuần | UQ | `committee_content.sql:62` |
| BR-M09-25 | `checklist_json` phải là mảng JSON, tối đa 30 mục, mỗi mục ≤200 ký tự | Zod + CK | `schemas.ts:50`; `committee_content.sql:61` |
| BR-M09-26 | Công việc tuần v1 **không** có người phụ trách và hạn chót | Thiết kế (không có cột) | `committee_content.sql:48-63`; `docs/03-workflow.md` WF-12 |
| BR-M09-27 | Lưu lại một tuần đã có bản là **cập nhật**, không tạo bản thứ hai | Action upsert + UQ | `actions.ts:225-239` |
| BR-M09-28 | Cập nhật bản tuần đã có phải giữ nội dung cũ nếu người dùng không chủ ý thay | **—** ⚠️ ghi đè mù, xem `03_AUDIT_RESULTS.md §4.1` | `committee-workspace.tsx:336-350` |
| BR-M09-29 | Bản công việc tuần phải có ít nhất nội dung hoặc một mục checklist | **—** (cả hai được phép rỗng) | `schemas.ts:49-50` |
| BR-M09-30 | Tác giả gốc của bản tuần không bị thay khi người khác cập nhật | **—** ⚠️ `created_by` bị upsert ghi đè | `actions.ts:233` |

### BR đề xuất bổ sung (từ TB-M09-01)
| Mã | Phát biểu | Nơi sẽ enforce |
|---|---|---|
| BR-M09-31 | Form công việc tuần phải nạp sẵn bản hiện có của tuần được chọn | UI |
| BR-M09-32 | Cập nhật bản tuần dùng optimistic lock theo `updated_at`; lệch thì từ chối và mời tải lại | Zod + Action |

## C. Kho thiết bị

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M09-33 | Thiết bị chỉ gắn được vào Ban có `manages_equipment` **và** đang hoạt động | TRG | `equipment.sql:80-85`; test `021:36-40` |
| BR-M09-34 | Tạo/sửa danh mục thiết bị = Trưởng/Phó Ban đó hoặc global-write | RLS | `equipment.sql:254-260`; test `021:42-53` |
| BR-M09-35 | Đọc kho = thành viên Ban giữ kho hoặc global-read | RLS qua `app.can_read_equipment` | `equipment.sql:100-108,251-253`; test `021:72-73,79-80` |
| BR-M09-36 | Mượn/trả = thành viên Ban giữ kho hoặc global-write | RPC | `equipment.sql:111-127,150-152,205-207`; test `021:74-76,153-156` |
| BR-M09-37 | `available_quantity ≥ 0`, `total_quantity ≥ 0`, `available ≤ total` | CK | `equipment.sql:21-22,30` |
| BR-M09-38 | `available_quantity` chỉ đổi qua RPC mượn/trả, không sửa tay | TRG + biến phiên `app.equipment_rpc` | `equipment.sql:87-91`; test `021:56-59` |
| BR-M09-39 | `total_quantity` chỉ đổi qua RPC (giảm khi hỏng/mất) | **—** ⚠️ không có hàng rào; UPDATE toàn cột được grant | `equipment.sql:243` vs `:88-91` |
| BR-M09-40 | Khi tạo thiết bị, `available_quantity` phải bằng `total_quantity` | Action (server tự đặt), **không** có ở DB | `src/features/equipment/server/actions.ts:70-71`; nhánh INSERT của TRG bỏ trống (`equipment.sql:88`) |
| BR-M09-41 | Mã thiết bị (`asset_code`) duy nhất toàn hệ thống, không phân biệt hoa/thường | UQ citext | `equipment.sql:18` |
| BR-M09-42 | Số lượng mượn phải là số nguyên **> 0** | Zod + RPC | `equipment/schemas.ts:26`; `equipment.sql:156-158`; test `021:84-86` |
| BR-M09-43 | Không mượn quá số khả dụng | RPC (sau row lock) | `equipment.sql:159-161`; test `021:81-83` |
| BR-M09-44 | Không mượn thiết bị đã ngưng sử dụng | RPC + UI ẩn nút | `equipment.sql:153-155`; `equipment-board.tsx:96` |
| BR-M09-45 | Người mượn phải là một `staff_profiles` tồn tại | RPC + FK | `equipment.sql:162-164,40` |
| BR-M09-46 | Người bàn giao (`handed_over_by`) và người nhận (`received_by`) lấy từ phiên đăng nhập | RPC | `equipment.sql:177,231`; test `021:93-96,113-116` |
| BR-M09-47 | Hai người mượn đồng thời cái cuối cùng: chỉ một người thành công | RPC row lock | `equipment.sql:145-146` |
| BR-M09-48 | `equipment_loans` không ghi trực tiếp được — chỉ `grant select` | GRANT | `equipment.sql:244`; test `021:66-69` |
| BR-M09-49 | Số trả lại nằm trong `[0, quantity]` | RPC + CK | `equipment.sql:214-216,57-59`; test `021:132-136` |
| BR-M09-50 | Phần trả được cộng lại `available_quantity` | RPC | `equipment.sql:219-220`; test `021:142-144` |
| BR-M09-51 | Phần không trả về kho (hỏng/mất) bị trừ khỏi `total_quantity` | RPC | `equipment.sql:222`; test `021:145-147` |
| BR-M09-52 | Trả lại một phiếu đã trả là **idempotent** — không cộng kho lần hai | RPC (return sớm) | `equipment.sql:208-211`; test `021:119-126` |
| BR-M09-53 | Phiếu ở trạng thái `returned` phải có đủ `returned_at` và `restored_quantity`; ở `borrowed` thì cả ba trường trả phải null | CK | `equipment.sql:53-56` |
| BR-M09-54 | `condition` khi trả áp cho **cả dòng** thiết bị (không theo từng cái) | RPC | `equipment.sql:223`; test `021:148-150` — ⚠️ đúng code, sai nghiệp vụ |
| BR-M09-55 | Có đường hợp lệ để nhập thêm/điều chỉnh tổng số thiết bị | **—** (không tồn tại) | — |
| BR-M09-56 | Người mượn có thể là GLV ngoài Ban Kỹ thuật | DB cho phép, **UI không cho** | `equipment.sql:162-164` vs `src/features/equipment/server/queries.ts:60-64` |

## D. Quy tắc xuyên suốt

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M09-57 | Ẩn nút **không phải** authorization — mọi thao tác đều bị RLS/RPC chặn lại ở DB | Thiết kế | `src/features/committees/server/permissions.ts:18-21` |
| BR-M09-58 | `/committees` chỉ dành cho staff; guardian/student bị redirect `/access-denied` | Route guard | `src/lib/permissions/route-map.ts:38`; `src/lib/auth/guards.ts:17-21` |
| BR-M09-59 | UUID sai định dạng trên route động phải là 404, không phải 500 | Page guard | `src/app/(dashboard)/committees/[committeeId]/page.tsx:10,19` |
| BR-M09-60 | Không trả raw SQL/policy ra UI — chỉ mã lỗi ổn định + thông điệp tiếng Việt | Action mapper | `src/features/committees/server/actions.ts:33-49`; `src/features/equipment/server/actions.ts:28-53`; `src/lib/errors/index.ts` |
| BR-M09-61 | Server action phải xác thực phiên trước khi chạm DB | `requireAuthContext` | mọi action, ví dụ `committees/actions.ts:59,84,109` |
| BR-M09-62 | Server action nên kiểm luôn quyền **route** chứ không chỉ phiên đăng nhập | **—** ⚠️ action dùng `requireAuthContext` (chỉ kiểm đăng nhập) chứ không `requireRouteAccess`; guardian gọi thẳng action vẫn tới được DB rồi mới bị RLS chặn | `committees/actions.ts:59` vs `queries.ts:89` |
| BR-M09-63 | Mượn/trả thiết bị cần khoá idempotency (docs/11 §18 liệt kê) | **—** (chưa có) | `docs/11-api-and-server-actions.md:379-380` |
