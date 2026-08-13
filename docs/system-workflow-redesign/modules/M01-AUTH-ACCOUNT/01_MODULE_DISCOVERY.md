# M01-AUTH-ACCOUNT — Module Discovery

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Mọi khẳng định đều kèm `file:line`.

## 1. Mục tiêu nghiệp vụ

Module chịu trách nhiệm cho toàn bộ vòng đời **danh tính đăng nhập** của hệ thống:

1. Cho phép người dùng nội bộ đăng nhập bằng **tên đăng nhập nghiệp vụ** (`GLVxxx`, `CQxxxx`, số điện thoại, hoặc username tự do) thay vì email — email chỉ là alias kỹ thuật sinh server-side (`src/features/auth/aliases.ts:16-37`).
2. Ép đổi mật khẩu ở lần đăng nhập đầu (`must_change_password`) trước khi vào bất kỳ trang nghiệp vụ nào (`src/lib/auth/guards.ts:11-13`).
3. Cho Super Admin cấp phát tài khoản, gắn **đúng một primary role đang hoạt động** và bắt buộc liên kết hồ sơ nghiệp vụ (`staff_profiles` / `guardians` / `students`).
4. Cho Super Admin quản trị vòng đời tài khoản: đổi username, đặt/reset mật khẩu, vô hiệu hóa, xóa — **không xóa hồ sơ nghiệp vụ**.
5. Cung cấp `AuthContext` chuẩn (role, scope, audience) cho toàn bộ ứng dụng (`src/lib/auth/session.ts:18-60`).

Nguồn nghiệp vụ: `docs/03-workflow.md` §WF-02 (dòng 38–98), `docs/01-business-analysis.md:78-85`, `docs/05-permission-matrix.md:15,48,187-190`, `docs/11-api-and-server-actions.md:14-28`.

## 2. Actor

| Actor | Được làm gì trong module |
|---|---|
| Ẩn danh (chưa đăng nhập) | Truy cập `/login`, submit form đăng nhập |
| Mọi tài khoản đã đăng nhập | Đổi mật khẩu của chính mình tại `/change-password`; mở `/account` (hiện là placeholder) |
| Super Admin | Toàn bộ nghiệp vụ quản trị tài khoản tại `/admin` |
| 13 role còn lại | **Không** có bất kỳ quyền quản trị tài khoản nào (`src/features/auth/permissions.ts:3-5`) |

## 3. Route

| Route | File | Guard |
|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx:7-16` | public (`src/lib/permissions/route-map.ts:20`) |
| `/change-password` | `src/app/(auth)/change-password/page.tsx:8-18` | `requireAuthContext("/change-password")` |
| `/admin` | `src/app/(dashboard)/admin/page.tsx:22-159` | `requireRouteAccess("/admin")` → roles `["super_admin"]` (`src/lib/permissions/route-map.ts:47`) |
| `/account` | `src/app/(dashboard)/account/page.tsx:3-5` | `ProtectedModulePlaceholder` — **chưa triển khai** |
| `/access-denied` | `src/app/(dashboard)/access-denied/page.tsx` | authenticated |

Route được `docs/06-ui-ux-spec.md:115-119` yêu cầu nhưng **chưa tồn tại**: `/admin/accounts`, `/admin/settings`, `/admin/academic-years`, `/admin/import`. Toàn bộ được gộp vào một trang `/admin` duy nhất.

## 4. Component

| Component | File | Loại |
|---|---|---|
| `LoginForm` | `src/features/auth/components/login-form.tsx:14-50` | client, react-hook-form + zodResolver |
| `ChangePasswordForm` | `src/features/auth/components/change-password-form.tsx:13-49` | client, react-hook-form + zodResolver |
| `AccountAdminPanel` | `src/features/auth/components/account-admin-panel.tsx:23-199` | client, form không dùng react-hook-form (đọc `FormData` thủ công) |
| `PasswordField` | `src/features/auth/components/password-field.tsx:8-28` | client, toggle hiện/ẩn, touch target 44px |
| `AuthLayout` | `src/app/(auth)/layout.tsx:4-34` | server |
| `UserMenu` | `src/components/layout/user-menu.tsx:6-25` | server — **không có nút Đăng xuất** |

## 5. Server Action / Query / Service

| Tên | File:line | Quyền | Client Supabase |
|---|---|---|---|
| `loginWithUsername` | `src/features/auth/server/actions.ts:63-86` | public | anon/session |
| `changeOwnPassword` | `:88-101` | authenticated | anon/session + RPC `complete_password_change` |
| `adminProvisionAccount` | `:103-270` | super_admin | **service role** |
| `adminResetPassword` | `:272-285` | super_admin | service role |
| `adminSetPassword` | `:287-303` | super_admin | service role |
| `adminUpdateUsername` | `:305-345` | super_admin | service role |
| `adminDeleteAccount` | `:347-357` | super_admin | service role |
| `adminSetAccountStatus` | `:359-374` | super_admin | service role |
| `getAccountAdminOptions` | `src/features/auth/server/queries.ts:26-86` | super_admin | anon/session (chịu RLS) |
| `getAuthContext` | `src/lib/auth/session.ts:18-60` | authenticated | anon/session |
| `requireAuthContext` / `requireRouteAccess` | `src/lib/auth/guards.ts:7-21` | — | — |
| `generateTemporaryPassword` | `src/features/auth/server/passwords.ts:9-20` | server-only | — |
| `deriveLoginAlias` / `normalizeVietnamesePhone` | `src/features/auth/aliases.ts:9-37` | pure | — |

**Thiếu so với `docs/11-api-and-server-actions.md:25`:** `assignPrimaryRole(input)` được đặc tả nhưng **không tồn tại trong `src/`** (grep toàn repo chỉ trúng dòng docs). Đây là gốc của nhiều lỗi ở M04 (xem `03_AUDIT_RESULTS.md` §F12).

## 6. Bảng DB, constraint, trigger, RLS

### `public.profiles` — `supabase/migrations/20260715000100_identity_foundation.sql:42-60`

- PK = `auth.users(id)` **ON DELETE CASCADE** (`:43`).
- `username extensions.citext not null unique` (`:44`) — chống trùng username ở **DB layer**, không phân biệt hoa/thường.
- `account_status public.account_status not null default 'active'` (`:47`) — enum `active|locked|disabled` (`:16`).
- `must_change_password boolean not null default true` (`:48`).
- `last_login_at timestamptz` (`:51`) — **cột tồn tại nhưng không có code nào ghi vào** (grep `last_login_at` trong `src/` chỉ trúng `types/database.ts`).
- RLS: `profiles_select_self_or_global` (`:241-243`). **Không có policy INSERT/UPDATE/DELETE cho `authenticated`** → mọi ghi phải qua service role.

### `public.role_assignments` — `:62-94`

- `profile_id ... on delete cascade` (`:64`) → **xóa account xóa luôn toàn bộ lịch sử role**.
- `role_assignments_scope_matches_role` CHECK (`:76-80`) — role ngành cần `sector_id`, role lớp cần `class_id`, role toàn cục không có scope.
- `role_assignments_active_end_consistency` CHECK (`:81-83`).
- **Unique partial index** `role_assignments_one_active_per_profile_idx ... where is_active` (`:86-88`) — enforce “một account chỉ một role active”.
- Trigger `role_assignments_validate_scope` (`supabase/migrations/20260715000200_academic_structure.sql:178-181`) chạy hàm `app.validate_role_assignment_scope()` **đã bị `create or replace` ở** `supabase/migrations/20260715000400_staff_and_class_assignments.sql:156-200` → bản đang chạy còn bắt buộc: có `staff_profiles.profile_id` và **có `class_staff_assignments` active đúng lớp/đúng capacity**.
- Trigger `role_assignments_validate_ownership_link` (`supabase/migrations/20260716000200_account_identity_links.sql:25-28`).
- Trigger `role_assignments_validate_staff_link` (`supabase/migrations/20260716000400_staff_role_identity_links.sql:25-28`).
- RLS: chỉ `SELECT` (`20260715000100:245-247`).

### RPC `public.complete_password_change()` — `supabase/migrations/20260715000300_auth_account_flows.sql:3-27`

`security definer`, `search_path = ''`, chỉ cập nhật `must_change_password = false` cho `auth.uid()` và chỉ khi `account_status = 'active'`.

### Helper `app.current_role()` — `20260715000100:107-121`

Join `profiles` và **yêu cầu `account_status = 'active'`** → tài khoản bị `disabled` mất toàn bộ quyền ở tầng RLS, không chỉ ở tầng app. Đây là điểm thiết kế tốt, đã có test (`supabase/tests/004_identity_rls_test.sql:60-63`).

## 7. Role / Permission liên quan

- `canManageAccounts(role) === role === "super_admin"` (`src/features/auth/permissions.ts:3-5`) — khớp `docs/05-permission-matrix.md:15,48,187`.
- `ROUTE_RULES` cho `/admin` chỉ `["super_admin"]` (`src/lib/permissions/route-map.ts:47`).
- `canAccessRoute` fail-closed: route không khai báo → `false` (`:57`), và chặn `accountStatus !== "active"` (`:60`).
- `STAFF_PROFILE_ROLES` (9 role) bắt buộc link `staff_profiles` (`src/lib/permissions/roles.ts:56-64`), khớp `docs/01-business-analysis.md:117`.

## 8. Module phụ thuộc

| Chiều | Module | Lý do |
|---|---|---|
| M01 ← | **M04-STAFF** | `adminProvisionAccount` chỉ chọn được `staff_profiles` chưa có account (`queries.ts:35`); role lớp còn cần `class_staff_assignments` active đúng capacity |
| M01 ← | M03-STUDENTS-GUARDIANS | tương tự cho `guardians` / `students` |
| M01 ← | M02-ACADEMIC-STRUCTURE | role ngành/lớp cần `academic_year_id`, `sector_id`, `class_id` |
| M01 → | **Toàn bộ module còn lại** | `getAuthContext` là nguồn duy nhất của role/scope; `app.current_role()` là nền của mọi RLS |
| M01 → | M14-NAVIGATION-SHELL | `isItemVisible` dựa `context.role/audience/scopeKind` (`src/config/navigation.ts`) |

## 9. Mức độ quan trọng

**Cao (P0).** Là gốc của toàn bộ authorization. Một lỗi ở đây lan sang 14 module. Đồng thời là điểm nghẽn vận hành: mọi thay đổi nhân sự đều phải qua Super Admin.

## 10. Tình trạng test hiện tại

| Loại | File | Bao phủ | Thiếu |
|---|---|---|---|
| pgTAP | `supabase/tests/001_identity_foundation_test.sql` (14 test) | tồn tại schema/enum/index/RLS bật | — |
| pgTAP | `supabase/tests/003_auth_account_flows_test.sql` (4 test) | `complete_password_change` là definer | **không test hành vi** (không test account disabled bị từ chối) |
| pgTAP RLS | `supabase/tests/004_identity_rls_test.sql` (16 test) | one-active-role, guardian chỉ thấy mình, global reader không update được, disabled account mất quyền, anon bị chặn, không có cột password | không test `account_status='locked'` |
| pgTAP | `supabase/tests/007_account_identity_links_test.sql` (7 test) | 3 trigger bắt buộc link hồ sơ | không test role **lớp** cần `class_staff_assignments` active (nhánh nặng nhất của `validate_role_assignment_scope`) |
| unit | `tests/unit/auth-aliases.test.ts` (4 test) | alias 4 namespace, chuẩn hóa SĐT, username sai định dạng | không test va chạm namespace |
| unit | `tests/unit/auth-schemas.test.ts` (6 test) | scope theo role, bắt buộc link guardian/student | **không test nhánh `STAFF_PROFILE_ROLES` bắt buộc `staffProfileId`**, không test “role toàn cục không nhận scope” |
| unit | `tests/unit/identity-security.test.ts` (3 test) | `canManageAccounts`, service role server-only | — |
| E2E | `tests/e2e/security.spec.ts` (3 test) | security headers, UUID rác không 5xx, GLV lớp mở URL lớp khác bị chặn | **không có E2E nào cho `/admin`**: không test tạo/xóa/khóa account, không test non-SA mở `/admin` |
| E2E | `tests/e2e/authenticated-shell.spec.ts` | đăng nhập thật + đi các trang Phase 2 | — |

**Không có test nào** cho: `adminProvisionAccount` (happy/rollback), `adminUpdateUsername` (đồng bộ alias Auth ↔ `profiles`), `adminDeleteAccount` (giữ hồ sơ nghiệp vụ — yêu cầu tại `docs/03-workflow.md:96`), `adminSetAccountStatus`.
