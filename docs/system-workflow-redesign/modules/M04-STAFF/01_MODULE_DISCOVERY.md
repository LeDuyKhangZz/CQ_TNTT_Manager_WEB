# M04-STAFF — Module Discovery

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Mọi khẳng định đều kèm `file:line`.

## 1. Mục tiêu nghiệp vụ

Quản lý **hồ sơ nhân sự mục vụ** (Huynh trưởng / Giáo lý viên / Dự trưởng) và **lịch sử phân công đứng lớp** (WF-04, `docs/03-workflow.md:100-112`):

1. Lưu hồ sơ định danh nghiệp vụ với mã `GLVxxx` sinh tự động — **tách khỏi tài khoản đăng nhập** (`staff_profiles.profile_id` nullable).
2. Danh xưng (Anh/Chị/Dì/Sơ/Cha/Thầy) là **danh xưng**, không phải role hệ thống (`docs/03` và comment DB `20260715000400:292`).
3. Mỗi lớp có **đúng một** Giáo lý viên đại diện; mỗi nhân sự thuộc **đúng một** lớp tại một thời điểm.
4. Lưu **lịch sử** phân công (ngày bắt đầu / kết thúc), không xóa cứng.
5. Là điều kiện tiên quyết của mọi role GLV trong M01 (trigger `validate_staff_role_link`, `20260716000400:9-22`).

## 2. Actor

| Actor | Quyền trong module | Bằng chứng |
|---|---|---|
| `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Tạo hồ sơ, sửa hồ sơ (action tồn tại nhưng **không có UI**), phân công lớp, kết thúc phân công | `src/features/staff/server/actions.ts:19`, RLS `20260715000400:273-279` = `app.can_global_write()` |
| `parish_priest`, `chaplain`, `treasurer`, `sector_leader`, `sector_deputy` | Chỉ đọc (`can_global_read` hoặc phạm vi ngành) | `route-map.ts:28`, `20260715000400:243-260` |
| `class_representative`, `class_teacher`, `trainee_assistant` | Đọc hồ sơ **của chính mình và của đồng nghiệp cùng lớp** | `app.can_access_staff` `20260715000400:243-260`; test `005:74-76` |
| `guardian`, `student` | Không truy cập `/staff` | `route-map.ts:28` (`STAFF_ROLES`) |

**Lệch với docs:** `docs/05-permission-matrix.md:184` ghi “Phân staff vào lớp | SA/global-write; **sector leader trong sector nếu bật policy**”. Feature flag `sector_leader_can_manage_class_staff` (`docs/05:294,303`, mặc định `false`) **chưa được triển khai ở bất kỳ đâu** — không có bảng `system_settings`, không có kiểm tra trong code. Hiện tại sector leader **không bao giờ** ghi được.

## 3. Route

| Route | File | Guard |
|---|---|---|
| `/staff` | `src/app/(dashboard)/staff/page.tsx:20-78` | `requireRouteAccess("/staff")` qua `getStaffPageData` (`src/features/staff/server/queries.ts:18`) → roles `STAFF_ROLES` (`route-map.ts:28`) |
| `/staff/[staffId]` | **KHÔNG TỒN TẠI** | được đặc tả tại `docs/06-ui-ux-spec.md:103` |
| `/classes/[classId]` | `src/app/(dashboard)/classes/[classId]/page.tsx` | hiển thị đội ngũ lớp (read-only) qua `src/features/classes/server/queries.ts:186-188` |

## 4. Component

Module **không có component riêng nào**. Toàn bộ UI nằm inline trong `src/app/(dashboard)/staff/page.tsx:24-77`, dùng `Card`/`Input`/`Label`/`Button`/`Badge` và `<select>` thô với class thủ công (`:15`).

| Khối UI | Vị trí |
|---|---|
| Danh sách nhân sự + form “Kết thúc phân công” inline | `staff/page.tsx:28-47` |
| Form “Thêm nhân sự” (7 ô) | `:50-62` |
| Form “Phân công vào lớp” (4 ô) | `:64-73` |

## 5. Server Action / Query

| Tên | File:line | Quyền | Client Supabase | UI gọi? |
|---|---|---|---|---|
| `createStaff` | `src/features/staff/server/actions.ts:32-53` | `STAFF_WRITE_ROLES` | anon/session (chịu RLS) | qua wrapper |
| `updateStaff` | `:55-78` | `STAFF_WRITE_ROLES` | anon/session | ❌ **KHÔNG** — dead code |
| `assignStaffToClass` | `:80-97` | `STAFF_WRITE_ROLES` | anon/session | qua wrapper |
| `endClassStaffAssignment` | `:99-113` | `STAFF_WRITE_ROLES` | RPC `end_class_staff_assignment` | qua wrapper |
| `createStaffFromForm` | `:115-127` | — | — | ✅ `staff/page.tsx:52` |
| `assignStaffFromForm` | `:129-136` | — | — | ✅ `:66` |
| `endStaffAssignmentFromForm` | `:138-140` | — | — | ✅ `:38` |
| `getStaffPageData` | `src/features/staff/server/queries.ts:17-40` | `requireRouteAccess("/staff")` | anon/session | ✅ |
| `getClassDetail` (phần `team`) | `src/features/classes/server/queries.ts:118-193` | `requireRouteAccess` | anon/session | ✅ |

⚠️ **Cả 3 wrapper `*FromForm` đều có kiểu trả về `Promise<void>` và bỏ hoàn toàn kết quả** (`actions.ts:115-140`). Mọi lỗi — kể cả `FORBIDDEN` và lỗi Zod — bị nuốt im lặng.

## 6. Bảng DB, constraint, trigger, RLS

### `public.staff_profiles` — `supabase/migrations/20260715000400_staff_and_class_assignments.sql:12-35`

| Cột / ràng buộc | Chi tiết |
|---|---|
| `profile_id uuid **unique** references profiles(id) **on delete set null**` (`:14`) | Nullable → **hồ sơ mồ côi (không tài khoản) là hợp lệ theo thiết kế**; unique → 1-1 |
| `staff_code citext not null unique default 'GLV' \|\| lpad(nextval(...),3,'0')` (`:15`) | Sinh tự động từ sequence `staff_code_seq` (`:8-10`); CHECK định dạng `^GLV[0-9]{3,}$` (`:29`) |
| `title public.staff_title not null` (`:17`) | enum 7 giá trị (`:3`) |
| `phone text not null check (btrim(phone) <> '')` (`:20`) | Bắt buộc, **KHÔNG unique** |
| `email text` (`:21`) | **KHÔNG unique**, **không CHECK định dạng** |
| `full_name`, `date_of_birth`, `address`, `avatar_path` | không ràng buộc trùng |
| `formation_level` (`:24`) | enum `none|i|ii|iii|special` |
| `service_status public.staff_service_status not null default 'active'` (`:25`) | enum `active|paused|inactive` — **trạng thái phục vụ, tách khỏi `account_status`** |
| Index | `staff_profiles_name_idx (full_name)` (`:32`) — chỉ để sort, không unique |

**Không có bất kỳ ràng buộc chống trùng nào trên `phone`, `email`, `full_name + date_of_birth`.**

### `public.class_staff_assignments` — `:37-63`

| Ràng buộc | Chi tiết |
|---|---|
| `class_id ... on delete restrict`, `staff_profile_id ... on delete restrict` (`:39-40`) | Không xóa được lớp/hồ sơ khi còn phân công → **không có DELETE policy cho `staff_profiles`** nên hồ sơ không xóa được bằng bất kỳ cách nào |
| `class_staff_assignment_date_order` (`:48`), `..._active_end` (`:49`) | `ends_on >= starts_on`; active ⟺ `ends_on IS NULL` |
| **Unique partial** `class_staff_one_active_class_per_staff_idx` (`:52-53`) | Một nhân sự **một lớp active** |
| **Unique partial** `class_staff_one_active_representative_idx` (`:54-55`) | Một lớp **một đại diện active** |
| Index lịch sử | `:56-59` |

### Trigger `class_staff_assignments_validate` → `app.validate_class_staff_assignment()` — `:65-102,151-154`

1. Không cho phân công active vào lớp `status <> 'active'` (`:75-79`).
2. Nếu hồ sơ đang có **role lớp active**: (a) **không cho set `is_active = false`** → raise `ACTIVE_CLASS_ROLE_EXISTS` (`:88-90`); (b) `class_id` và `capacity` phải khớp role (`:96-98`).

### RPC `public.end_class_staff_assignment(uuid, date)` — `:104-149`

`security definer`; tự kiểm `app.can_global_write()` (`:117-119`); `select ... for update` (`:121-124`); **deactivate `role_assignments` của tài khoản liên kết trước** (`:136-141`) rồi mới deactivate phân công (`:143-147`). Thứ tự này là **bắt buộc** để vượt qua trigger ở trên.

### Trigger `role_assignments_validate_scope` → `app.validate_role_assignment_scope()` (bản đã replace) — `:156-200`

Với role lớp: bắt buộc `academic_year_id` khớp lớp (`:170-177`), bắt buộc có `staff_profiles.profile_id` (`:179-182`), bắt buộc có `class_staff_assignments` active đúng `capacity` (`:183-196`).

### RLS — `:262-290`

| Bảng | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `staff_profiles` | `app.can_access_staff(id)` (`:270-272`) | `can_global_write() and updated_by = auth.uid()` (`:273-275`) | `can_global_write()` + cùng điều kiện `with check` (`:276-279`) | **không có policy → cấm** |
| `class_staff_assignments` | `app.can_access_class(class_id)` (`:281-283`, sửa lại ở `20260721000200:154-155`) | `can_global_write() and updated_by = auth.uid()` (`:284-286`) | `can_global_write()` (`:287-290`) | **không có policy → cấm** |

`app.can_access_staff` (`:243-260`) cho phép đọc khi: global read **hoặc** là chính mình **hoặc** có phân công active ở lớp mà mình truy cập được.

## 7. Role / Permission

- `STAFF_WRITE_ROLES = ["super_admin","group_leader","deputy_group_leader","secretary"]` (`actions.ts:19`) — **khớp chính xác** `app.can_global_write()` (`20260715000100:170-180`). Enforce hai tầng, cố ý.
- `/staff` mở cho toàn bộ `STAFF_ROLES` đọc (`route-map.ts:28`); phạm vi thật do RLS quyết định.
- `writeRoles` được **hardcode lại lần thứ hai** trong page (`staff/page.tsx:16`) thay vì import từ `actions.ts:19` → nguy cơ lệch khi sửa.

## 8. Module phụ thuộc

| Chiều | Module | Lý do |
|---|---|---|
| M04 ← | M02-ACADEMIC-STRUCTURE | `class_staff_assignments.class_id`; lớp phải `status='active'` |
| M04 → | **M01-AUTH-ACCOUNT** | mọi role GLV cần `staff_profiles.profile_id`; role lớp cần phân công đúng capacity |
| M04 → | M05-ATTENDANCE | `attendance_sessions.class_staff_assignment_id`, `staff_profile_id` (`20260721000300:110-112`); `app.is_class_staff` dùng `class_staff_assignments` |
| M04 → | M06-TEACHING-PLANS | `teacher_staff_id`, `created_by_staff_id` (`20260722000100:10,32`) |
| M04 → | M09-COMMITTEES-EQUIPMENT | `committee_memberships.staff_profile_id` (`20260723000100:36`), `equipment_loans.borrower_staff_id` (`20260723000300:40`) |
| M04 → | M10-NOTIFICATIONS | đối tượng nhận theo lớp suy từ `class_staff_assignments` (`20260723000400:139-151`) |
| M04 → | M11-REPORTS-DASHBOARD | thống kê nhân sự (`20260723000500:29`) |
| M04 → | M03/M07/M08 | `is_class_staff` / `is_class_representative` là nền của RLS điểm danh, bảng điểm, đề nghị lên lớp |

**Mức lan tỏa rất cao:** `staff_profiles` được 8 migration khác tham chiếu bằng FK `on delete restrict` → hồ sơ GLV về bản chất là **không thể xóa**, chỉ có thể đánh dấu `service_status`.

## 9. Mức độ quan trọng

**Cao (P0).** Là bản lề giữa danh tính (M01) và mọi nghiệp vụ lớp (M05–M08). Đồng thời là nơi user báo đau trực tiếp.

## 10. Tình trạng test hiện tại

| Loại | File | Bao phủ | Thiếu |
|---|---|---|---|
| pgTAP | `supabase/tests/005_staff_assignments_test.sql` (17 test) | tồn tại bảng/index/RPC/enum; sinh `staff_code` đúng định dạng; **một lớp active/staff**; **một đại diện/lớp**; không kết thúc được phân công khi role lớp còn active; RPC kết thúc atomic cho global writer; lịch sử đại diện được giữ; `is_class_staff` cho GLV liên kết; class teacher chỉ thấy staff cùng lớp; class teacher không tạo được staff | **`service_status` không được test dòng nào**; không test `can_access_staff` cho sector leader; không test RLS UPDATE (`updated_by = auth.uid()`); không test trigger `CLASS_NOT_ACTIVE`; không test `ROLE_CAPACITY_MISMATCH` (nhánh capacity sai); không test `end_class_staff_assignment` với `ends_on < starts_on`; **không test non-global-write gọi RPC** (`FORBIDDEN`) |
| unit | `tests/unit/staff-schemas.test.ts` (3 test) | Dì/Sơ là title hợp lệ; UUID sai bị chặn; ngày kết thúc biên | `updateStaffSchema`; `serviceStatus`; `formationLevel`; `phone` rỗng |
| E2E | `tests/e2e/authenticated-shell.spec.ts` | mở được `/staff` ở 3 viewport | **không có E2E nào tạo hồ sơ / phân công / kết thúc phân công**; không có E2E kiểm thông báo lỗi (vì hiện không có thông báo nào) |
| RLS negative | `005:78-81` | class teacher không insert được | không kiểm `sector_leader`, `treasurer`, `guardian` |

**Không có test nào** cho: `createStaff`/`updateStaff`/`assignStaffToClass` ở tầng action, luồng đổi lớp (M04-F06), và toàn bộ hành vi khi wrapper `*FromForm` nuốt lỗi.
