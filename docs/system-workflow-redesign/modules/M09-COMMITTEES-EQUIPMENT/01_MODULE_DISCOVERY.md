# M09 — BAN & THIẾT BỊ · 01. MODULE DISCOVERY

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Không sửa `src/`, `supabase/`, `tests/`.
> Nguồn sự thật: `docs/03-workflow.md` WF-12/WF-13, `docs/02-database-design.md` §11,
> `docs/05-permission-matrix.md` §6 Committee, `docs/06-ui-ux-spec.md` §13,
> `docs/11-api-and-server-actions.md` §12.

## 1. Phạm vi module

Module gồm hai khối nghiệp vụ gắn chặt nhau vì cùng hiển thị trên một trang:

| Khối | Nội dung |
|---|---|
| Ban (committees) | Danh mục Ban, membership theo nhiệm kỳ, chức vụ Ban |
| Nội dung Ban | Thông báo Ban, lịch họp Ban, công việc tuần (mốc thứ Hai) |
| Kho thiết bị | Danh mục thiết bị của Ban Kỹ thuật, phiếu mượn/trả, hỏng/mất |

Kho thiết bị chỉ tồn tại ở Ban có cờ `committees.manages_equipment`. Seed đặt cờ này
cho đúng một Ban — `KY_THUAT` (`supabase/seed.sql:64-66`).

## 2. Bản đồ file

### 2.1 Tầng UI (route + client component)

| File | Vai trò |
|---|---|
| `src/app/(dashboard)/committees/page.tsx:1-17` | Trang danh sách Ban (server component) |
| `src/app/(dashboard)/committees/[committeeId]/page.tsx:1-52` | Trang chi tiết Ban; chặn UUID sai định dạng (`:10`, `:19`), `notFound()` khi RLS không trả dòng (`:22`), nối thêm `EquipmentBoard` nếu Ban giữ kho (`:25`) |
| `src/features/committees/components/committee-list.tsx:1-138` | Grid card Ban + form tạo Ban |
| `src/features/committees/components/committee-workspace.tsx:1-385` | 4 section: Nhân sự / Thông báo Ban / Lịch họp / Công việc tuần |
| `src/features/equipment/components/equipment-board.tsx:1-372` | Kho thiết bị, form mượn theo từng dòng, form trả theo từng phiếu, lịch sử |
| `src/config/navigation.ts:52` | Mục "Ban" trong nhóm "Điều hành", chỉ audience `staff` |

### 2.2 Tầng server (action / query / permission)

| File | Vai trò |
|---|---|
| `src/features/committees/server/actions.ts:56-275` | 10 server action: tạo Ban, thêm/đổi/kết thúc membership, đăng/xóa 3 loại nội dung |
| `src/features/committees/server/queries.ts:85-228` | `getCommitteesPageData`, `getCommitteeDetail` |
| `src/features/committees/server/permissions.ts:1-27` | `canManageCommittees`, `canWriteCommitteeContent` — **chỉ để ẩn nút**, không phải authorization |
| `src/features/committees/schemas.ts:1-67` | 7 Zod schema |
| `src/features/committees/constants.ts:1-15` | 4 chức vụ, `MAX_ACTIVE_COMMITTEES_PER_STAFF = 2` |
| `src/features/equipment/server/actions.ts:55-156` | `createEquipmentItem`, `updateEquipmentItem`, `borrowEquipment`, `returnEquipment` |
| `src/features/equipment/server/queries.ts:46-100` | `getEquipmentBoard` (không tự guard, dựa hoàn toàn vào RLS) |
| `src/features/equipment/schemas.ts:1-42` | 4 Zod schema |
| `src/features/equipment/constants.ts:1-24` | 5 tình trạng thiết bị, 2 trạng thái phiếu |

### 2.3 Tầng DB

| Migration | Đối tượng |
|---|---|
| `supabase/migrations/20260723000100_committees.sql` | `committees`, `committee_memberships`; trigger `app.validate_committee_membership` (`:68-102`); helper `app.member_committee_ids` (`:108`), `app.led_committee_ids` (`:121`), `app.is_committee_member` (`:136`), `app.is_committee_leader_or_deputy` (`:146`), `app.can_write_committee_content` (`:158`); 6 policy (`:178-204`) |
| `supabase/migrations/20260723000200_committee_content.sql` | `committee_announcements`, `committee_meetings`, `committee_weekly_plans`; CHECK thứ Hai (`:60`), unique tuần (`:62`); trigger tác giả `app.set_committee_content_author` (`:78-103`); 12 policy (`:122-171`) |
| `supabase/migrations/20260723000300_equipment.sql` | `equipment_items`, `equipment_loans`; trigger `app.validate_equipment_item` (`:74-98`); `app.can_read_equipment` (`:100`), `app.can_operate_equipment` (`:111`); RPC `public.borrow_equipment` (`:129-182`), `public.return_equipment` (`:184-238`); grant (`:243-249`); 4 policy (`:251-265`) |
| `supabase/seed.sql:64-70` | 6 Ban mặc định, id cố định `30000000-…-000000000001..6` |

### 2.4 Tầng test

| File | Bao phủ |
|---|---|
| `supabase/tests/020_committees_test.sql` (35 assert) | Seed 6 Ban, giới hạn 2 Ban, tác giả từ phiên, thành viên chỉ thấy Ban mình, Trưởng ban không đăng sang Ban khác |
| `supabase/tests/021_equipment_test.sql` (32 assert) | Kho chỉ ở Ban KT, `EQUIPMENT_AVAILABLE_READONLY`, không INSERT thẳng `equipment_loans`, mượn quá tồn/số 0, trả đủ/thiếu, idempotent lần hai |
| `tests/unit/committee-schemas.test.ts` (4 case) | Mã Ban, enum chức vụ, mốc thứ Hai, giờ họp |
| `tests/e2e/committees.spec.ts:103-205` | Trưởng ban đăng nội dung, thành viên Ban KT mượn/trả, người ngoài Ban mở URL trực tiếp → 404 |

## 3. Vai trò tham gia

| Actor | Nguồn quyền | Làm được gì |
|---|---|---|
| `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | `app.can_global_write()` (`20260715000100_identity_foundation.sql:170-180`) | Tạo Ban, thêm/đổi/kết thúc membership mọi Ban, ghi/xóa nội dung mọi Ban, tạo/sửa danh mục thiết bị, mượn/trả |
| `parish_priest`, `chaplain` | `app.can_global_read()` (`:157-168`) | Chỉ đọc mọi Ban và kho thiết bị. **Không** mượn/trả |
| Trưởng ban / Phó ban | `app.is_committee_leader_or_deputy()` | Ghi/xóa nội dung Ban mình, tạo/sửa danh mục thiết bị (nếu là Ban KT) |
| Thành viên Ban / Cố vấn tối cao | `app.is_committee_member()` | Đọc Ban mình; nếu là Ban KT thì mượn/trả được |
| Staff khác (`class_teacher`, `sector_leader`, …) không thuộc Ban | — | Vào `/committees` được (route-map cho STAFF_ROLES) nhưng danh sách rỗng |
| `guardian`, `student` | — | Bị `requireRouteAccess("/committees")` chặn → `/access-denied` |

## 4. Quyết định thiết kế đã ghi trong repo

- **D-15**: chức vụ Ban tách hoàn toàn khỏi `role_assignments`.
- **D-47**: 6 Ban seed; mỗi nhân sự tối đa 2 Ban đang hoạt động, chặn ở DB trigger.
- **D-48**: chỉ Trưởng/Phó Ban đăng nội dung Ban.
- **D-49**: Ban Kỹ thuật có kho, ghi rõ ai mượn/ai bàn giao/ai nhận/tình trạng.
- **D-50**: lịch họp chỉ hiển thị trong web, không gửi lời mời/nhắc lịch.

## 5. Điểm cần soi kỹ (đầu vào cho bước 02–03)

1. Người ngoài Ban mở thẳng `/committees/<id>` — có rò nội dung không.
2. Trigger `app.validate_committee_membership` có đếm đúng "2 Ban" không, có bị RLS bóp méo không.
3. Cơ chế biến phiên `app.equipment_rpc` bảo vệ `available_quantity` — có phải cách chuẩn không.
4. `total_quantity` có được bảo vệ tương đương không.
5. Công việc tuần upsert đè tuần cũ — có mất dữ liệu ngoài ý muốn không.
6. Trả một phần / trả lần hai / mượn quá tồn / mượn số âm.
7. Hai người cùng mượn cái cuối cùng.
8. Ai xóa được nội dung Ban.
