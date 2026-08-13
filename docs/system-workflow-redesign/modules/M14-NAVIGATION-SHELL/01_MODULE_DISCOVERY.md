# M14-NAVIGATION-SHELL — Module Discovery

> Giai đoạn 1 — Audit (read-only). Mọi khẳng định kèm `file:line`. Không sửa `src/`, `supabase/`, `tests/`.

## 1. Mục tiêu nghiệp vụ

Module là **vỏ ứng dụng**: cái khung mà 14 module nghiệp vụ còn lại chạy bên trong. Trách nhiệm:

1. Quyết định người dùng **thấy gì** trong menu (`src/config/navigation.ts:41-132`).
2. Quyết định người dùng **vào được đâu** (`src/lib/permissions/route-map.ts:19-63` + `src/lib/auth/guards.ts:7-21`).
3. Cung cấp trạng thái chung: header, badge thông báo, năm học, menu người dùng (`src/components/layout/*`).
4. Cung cấp trạng thái rỗng/đang tải/lỗi/không có quyền dùng chung (`src/components/shared/*`).
5. Cài đặt được như PWA và ứng xử tử tế khi mất mạng (`src/app/manifest.ts`, `public/sw.js`, `public/offline.html`).

Nguồn nghiệp vụ: `docs/06-ui-ux-spec.md` §4–§6, §16, §17; `docs/04-system-architecture.md` §3, §12; `docs/05-permission-matrix.md`; `AGENTS.md` §5, §8.

## 2. Actor

| Actor | Vỏ ứng dụng cho phép gì |
|---|---|
| Ẩn danh | `/` → redirect `/login` (`src/app/page.tsx:3-5`); `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/offline.html` tải được không cần đăng nhập (`tests/e2e/pwa.spec.ts:12-32`) |
| Đã đăng nhập, `role = null` | Chỉ thấy 3 mục: Tổng quan, Thông báo, Tài khoản (`src/config/navigation.ts:101-103`) |
| 12 role staff | Sidebar lọc theo `audiences`/`roles`/`scopes`; bottom nav dùng preset `classStaffMobileNavigation` |
| `guardian` | Preset `guardianMobileNavigation` (`src/config/navigation.ts:84-90`) |
| `student` | Preset `studentMobileNavigation` (`src/config/navigation.ts:92-98`) |

## 3. Ma trận route × guard × RouteRule × navigation

> **Cách đọc.** Cột *Guard thật* là nơi authorization **thực sự** chạy. Kiến trúc của dự án đẩy guard
> xuống tầng `features/*/server/queries.ts` chứ không đặt ở `page.tsx` — nên một page "không gọi guard"
> vẫn có thể được bảo vệ đầy đủ. Cột này ghi đúng hàm và `file:line` đang enforce.

| # | Route | File route | Guard thật (`file:line`) | RouteRule khớp (`route-map.ts`) | Roles của rule | Hiện trong navigation | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | `/` | `src/app/page.tsx:3-5` | — (redirect) | — | — | không | `redirect("/login")` |
| 2 | `/login` | `src/app/(auth)/login/page.tsx:7` | — (public) | `:20` | public | không | ✔ |
| 3 | `/change-password` | `src/app/(auth)/change-password/page.tsx:9` | `requireAuthContext("/change-password")` | `:21` | mọi role | không | ✔ |
| 4 | `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx:6-7` | `requireRouteAccess("/dashboard")` — `src/features/dashboard/server/queries.ts:75` | `:22` | mọi role | mọi audience | ✔ |
| 5 | `/notifications` | `.../notifications/page.tsx:6` | `requireRouteAccess("/notifications")` — `src/features/notifications/server/queries.ts:108` | `:23` | mọi role | mọi audience | ✔ |
| 6 | `/account` | `.../account/page.tsx:3-5` | `requireRouteAccess("/account")` — `src/components/shared/protected-module-placeholder.tsx:15` | `:24` | mọi role | **chỉ** bottom nav + user menu, **không** có trong sidebar | Trang là **placeholder** |
| 7 | `/access-denied` | `.../access-denied/page.tsx:4-5` | chỉ `requireAuthContext()` ở layout — `src/app/(dashboard)/layout.tsx:6` | `:25` | mọi role | không | ✔ (đúng thiết kế) |
| 8 | `/students` | `.../students/page.tsx:22-23` | `requireRouteAccess("/students")` — `src/features/students/server/queries.ts:25` | `:26` | `STAFF_ROLES` (12) | staff | ✔ khớp |
| 9 | `/students/[studentId]` | `.../students/[studentId]/page.tsx:52-61` | `requireRouteAccess("/students/{id}")` — `students/server/queries.ts:112` | kế thừa `:26` | `STAFF_ROLES` | qua danh sách | ✔ |
| 10 | `/classes` | `.../classes/page.tsx:25-26` | `requireRouteAccess("/classes")` — `src/features/classes/server/queries.ts:57` | `:27` | `STAFF_ROLES` | staff | ✔ khớp |
| 11 | `/classes/[classId]` | `.../classes/[classId]/page.tsx:16-18` | `requireRouteAccess("/classes/{id}")` — `classes/server/queries.ts:123` | kế thừa `:27` | `STAFF_ROLES` | qua danh sách | ✔ |
| 12 | `/staff` | `.../staff/page.tsx:20-21` | `requireRouteAccess("/staff")` — `src/features/staff/server/queries.ts:18` | `:28` | `STAFF_ROLES` | staff | ✔ khớp |
| 13 | `/attendance` | `.../attendance/page.tsx:33-41` | `requireRouteAccess("/attendance")` — `src/features/attendance/server/queries.ts:120` | `:29` | `OPERATIONAL_STAFF_ROLES` (9) | staff, **không** khai `roles` | ⚠️ **LỆCH — D1** |
| 14 | `/attendance/[sessionId]` | `.../attendance/[sessionId]/page.tsx:15-24` | `requireRouteAccess("/attendance/{id}")` — `attendance/server/queries.ts:196` | kế thừa `:29` | 9 role | qua danh sách | ✔ |
| 15 | `/teaching-plan` | `.../teaching-plan/page.tsx:9-10` | `requireRouteAccess("/teaching-plan")` — `src/features/teaching-plans/server/queries.ts:88,126` | `:30` | **không giới hạn** | staff+guardian+student | ✔ cố ý (RLS lo) |
| 16 | `/teaching-plan/[classId]` | `.../teaching-plan/[classId]/page.tsx:10-18` | `requireRouteAccess("/teaching-plan/{id}")` — `teaching-plans/server/queries.ts:187` | kế thừa `:30` | không giới hạn | qua danh sách | ✔ |
| 17 | `/results` | `.../results/page.tsx:9-10` | `requireRouteAccess("/results")` — `src/features/assessments/server/queries.ts:230` | `:31` | **không giới hạn** | staff+guardian+student | ✔ cố ý |
| 18 | `/results/[classId]` | `.../results/[classId]/page.tsx:8-11` | `requireRouteAccess("/results/{id}")` — `assessments/server/queries.ts:284` | kế thừa `:31` | không giới hạn | qua danh sách | ✔ |
| 19 | `/results/[classId]/export` | `.../results/[classId]/export/route.ts:84-90` | **gián tiếp** qua `getGradebookDetail` → `requireRouteAccess` (`assessments/server/queries.ts:284`) | kế thừa `:31` | không giới hạn | không | ✔ có authorize |
| 20 | `/promotions` | `.../promotions/page.tsx:6-7` | `requireRouteAccess("/promotions")` — `src/features/promotions/server/queries.ts:81` | `:32` | 11 role (trừ treasurer) | staff, `roles` khai đủ 11 | ✔ khớp |
| 21 | `/parent/absence-requests` | `.../parent/absence-requests/page.tsx:6-7` | `requireRouteAccess("/parent/absence-requests")` — `src/features/portal/server/queries.ts:129` | `/parent` `:36` | **không giới hạn** | **chỉ guardian** | ⚠️ **LỆCH — D2** |
| 22 | `/parent/children/[studentId]` | `.../parent/children/[studentId]/page.tsx:8-14` | `requireRouteAccess("/parent/children/{id}")` — `portal/server/queries.ts:161` | `/parent` `:36` | không giới hạn | **không có ở đâu cả** | ⚠️ **route mồ côi — D3** |
| 23 | `/student/attendance` | `.../student/attendance/page.tsx:7-8` | **`requireAuthContext("/student/attendance")`** — `portal/server/queries.ts:174` | `/student` `:37` | `["student"]` | chỉ student | 🔴 **RULE KHÔNG ĐƯỢC THI HÀNH — D4** |
| 24 | `/committees` | `.../committees/page.tsx:6-7` | `requireRouteAccess("/committees")` — `src/features/committees/server/queries.ts:89` | `:38` | `STAFF_ROLES` | staff | ✔ khớp |
| 25 | `/committees/[committeeId]` | `.../committees/[committeeId]/page.tsx:12-21` | `requireRouteAccess("/committees")` — `committees/server/queries.ts:119` | kế thừa `:38` | `STAFF_ROLES` | qua danh sách | ✔ (+ UUID guard `:19`) |
| 26 | `/reports` | `.../reports/page.tsx:7-15` | `requireRouteAccess("/reports")` — `src/features/reports/server/queries.ts:66,146` | `:39` | `STAFF_ROLES` | staff | ✔ khớp |
| 27 | `/reports/export` | `.../reports/export/route.ts:11-19` | **gián tiếp** qua `buildReport` → `requireRouteAccess("/reports")` (`reports/server/queries.ts:146`) | kế thừa `:39` | `STAFF_ROLES` | không | ✔ có authorize |
| 28 | `/reports/snapshots/[snapshotId]/export` | `.../snapshots/[snapshotId]/export/route.ts:15-29` | **gián tiếp** qua `getReportSnapshot` → `requireRouteAccess("/reports")` (`reports/server/queries.ts:195`) | kế thừa `:39` | `STAFF_ROLES` | không | ✔ + UUID guard `:20-22` |
| 29 | `/imports` | `.../imports/page.tsx:52-53` | `requireImportPage()` → `requireRouteAccess("/imports")` + `canImport` — `src/features/imports/server/permissions.ts:33-36` | `:42-46` | 4 role | staff, `roles` khai đủ 4 | ✔ khớp (2 lớp) |
| 30 | `/imports/[batchId]` | `.../imports/[batchId]/page.tsx:148-155` | `requireImportPage()` (`page.tsx:153`) | kế thừa `:42` | 4 role | qua danh sách | ✔ |
| 31 | `/imports/template` | `.../imports/template/route.ts:5-7` | `requireImportAccess()` — `imports/server/permissions.ts:21-25` | kế thừa `:42` | 4 role | không (nút tải trong `/imports`) | ✔ |
| 32 | `/admin` | `.../admin/page.tsx:22-23` | `requireRouteAccess("/admin")` (**gọi trực tiếp trong page**) | `:47` | `["super_admin"]` | staff, `roles` khai `super_admin` | ✔ khớp |

**Kết luận cột "route không có guard": không có route nào hoàn toàn trần.** Mọi route `(dashboard)/**`
tối thiểu đi qua `requireAuthContext()` ở `src/app/(dashboard)/layout.tsx:6`, và 31/32 route có thêm một
`requireRouteAccess` ở tầng query. Ngoại lệ duy nhất về **chất lượng** guard là hàng 23 (`/student/attendance`).

### 3b. Sự cố nhất quán của `nextPath`

`src/app/(dashboard)/layout.tsx:6` gọi `requireAuthContext()` **không truyền tham số** → mặc định
`nextPath = "/dashboard"` (`src/lib/auth/guards.ts:7`). Layout chạy **trước** guard của page, nên với
người chưa đăng nhập, mọi deep-link trong `(dashboard)` đều redirect về
`/login?next=%2Fdashboard`, không phải route đã gõ. `tests/e2e/home.spec.ts:15-18` ghi lại đúng hành vi
này như thể nó đúng (`/admin` → `next=%2Fdashboard`).

Tệ hơn: **không có file nào đọc `?next=` hoặc `?error=`.** Grep `searchParams.get` trên toàn `src/`
chỉ trúng 3 route handler xuất file (`format`); `src/app/(auth)/login/page.tsx` và
`src/features/auth/components/login-form.tsx` không nhận query nào. Hai tham số do
`guards.ts:9-10` sinh ra bị **nuốt hoàn toàn**.

## 4. Component

| Component | File | Loại | Ghi chú |
|---|---|---|---|
| `RootLayout` | `src/app/layout.tsx:32-43` | server | `lang="vi"`, `maximumScale: 5` (cho zoom) |
| `AuthLayout` | `src/app/(auth)/layout.tsx:4-34` | server | 2 cột, cột trái ẩn `< lg` |
| `DashboardLayout` | `src/app/(dashboard)/layout.tsx:5-13` | server | `requireAuthContext()` + `getUnreadNotificationCount()` |
| `AppShell` | `src/components/layout/app-shell.tsx:11-36` | **client** | Nhận nguyên `AuthContext` qua props → toàn bộ context serialize xuống RSC payload |
| `AppHeader` | `src/components/layout/app-header.tsx:7-23` | client (kế thừa) | "Breadcrumb" giả: `Hệ thống / {title}`, ẩn `< sm` (`:15`) |
| `AppSidebar` | `src/components/layout/app-sidebar.tsx:16-77` | client (kế thừa) | 3 nhóm; **footer còn text tạm** (`:72-75`) |
| `MobileBottomNavigation` | `src/components/layout/mobile-bottom-navigation.tsx:5-23` | client | `min-h-16`, nhãn `text-[11px]` |
| `AcademicYearSwitcher` | `src/components/layout/academic-year-switcher.tsx:3-11` | server | `disabled`, chuỗi **cứng** `"Năm học 2026–2027"` |
| `NotificationButton` | `src/components/layout/notification-button.tsx:5-24` | client | badge `text-[10px]`, `aria-label` động ✔ |
| `UserMenu` | `src/components/layout/user-menu.tsx:6-24` | client | `<details>`; **chỉ 1 mục "Tài khoản"**, không có Đăng xuất |
| `PageContainer` | `src/components/layout/page-container.tsx:3-5` | server | render `<main>`, `max-w-[1440px]` |
| `PageHeader` | `src/components/layout/page-header.tsx:1-11` | server | render `<h2>` |
| `EmptyState` | `src/components/shared/empty-state.tsx:5-14` | server | **chỉ được dùng bởi `ModulePlaceholder`** |
| `ErrorState` | `src/components/shared/error-state.tsx:6-18` | server | dùng ở 2 error boundary |
| `LoadingState` | `src/components/shared/loading-state.tsx:3-13` | server | `role="status" aria-live="polite"` ✔ |
| `ModulePlaceholder` | `src/components/shared/module-placeholder.tsx:5-12` | server | — |
| `PermissionDenied` | `src/components/shared/permission-denied.tsx:6-16` | server | dùng ở `/access-denied` |
| `ProtectedModulePlaceholder` | `src/components/shared/protected-module-placeholder.tsx:4-17` | server | dùng đúng 1 nơi: `/account` |
| `ServiceWorkerRegistrar` | `src/components/pwa/service-worker-registrar.tsx:13-41` | client | chỉ đăng ký ở production, gỡ đăng ký ở dev ✔ |
| `Button` / `Badge` / `Card` / `Input` / `Label` / `FormMessage` | `src/components/ui/*` | server | `Button` mọi size ≥ 44px (`button.tsx:20-24`) |

### Boundary & fallback

| File | Có | Ghi chú |
|---|---|---|
| `src/app/error.tsx` | ✔ | `backHref="/login"`, log chỉ `digest` (`:14`) — không rò stack |
| `src/app/loading.tsx` | ✔ | — |
| `src/app/not-found.tsx` | ✔ | **file `not-found.tsx` duy nhất trong repo** |
| `src/app/(dashboard)/error.tsx` | ✔ | giữ được `PageContainer`, nhưng **không** giữ sidebar/header |
| `src/app/(dashboard)/loading.tsx` | ✔ | — |
| `src/app/(dashboard)/not-found.tsx` | ✖ | **thiếu** → `notFound()` ở trang chi tiết văng ra 404 toàn màn hình, mất vỏ ứng dụng |
| `src/app/(auth)/error.tsx` / `loading.tsx` | ✖ | rơi về boundary gốc |
| `<Suspense>` | ✖ | grep toàn `src/` = 0 kết quả — không có streaming từng phần |

## 5. Server Action / Query / Service của module

| Tên | File:line | Vai trò |
|---|---|---|
| `requireAuthContext(nextPath)` | `src/lib/auth/guards.ts:7-15` | Chặn chưa đăng nhập, `accountStatus !== active`, `mustChangePassword` |
| `requireRouteAccess(pathname)` | `src/lib/auth/guards.ts:17-21` | `requireAuthContext` + `canAccessRoute` → `/access-denied` |
| `getAuthContext()` | `src/lib/auth/session.ts:18-60` | `cache()` — 1 lần/request |
| `getRouteRule(pathname)` | `src/lib/permissions/route-map.ts:50-54` | Khớp prefix, sắp theo độ dài giảm dần (rule dài thắng) |
| `canAccessRoute(context, pathname)` | `src/lib/permissions/route-map.ts:56-63` | Fail-closed: rule `null` → `false` (`:58`) |
| `getDesktopNavigation` / `getMobileNavigation` / `isItemVisible` | `src/config/navigation.ts:100-120` | **Chỉ trình bày**, không phải authorization |
| `getPageTitle(pathname)` | `src/config/navigation.ts:122-128` | Fallback `"Thiếu Nhi Chợ Quán"` |
| `isNavigationItemActive` | `src/config/navigation.ts:130-132` | — |
| `getUnreadNotificationCount()` | dùng ở `src/app/(dashboard)/layout.tsx:7` | Chạy **mọi** request của mọi trang |
| `updateSession(request)` | `src/lib/supabase/middleware.ts:12-40` | **Chỉ refresh token**, ghi rõ không authorize (`:8-11,36`) |

## 6. Cấu hình / hạ tầng

| Hạng mục | File | Ghi chú |
|---|---|---|
| Security headers | `next.config.mjs:11-43` | `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS. **Chưa có CSP** (ghi chú `:16-17`) |
| Manifest | `src/app/manifest.ts:6-50` | `start_url: "/login"`, `standalone`, icon 192/512 + maskable |
| Service worker | `public/sw.js:13-88` | `VERSION=v1`; chỉ cache `/_next/static/`, `/icons/`, `offline.html` |
| Trang offline | `public/offline.html` | Tĩnh, tự chứa CSS, nút "Thử lại" 44px (`:44-54`) |
| Design tokens | `src/app/globals.css:6-41` | CSS variables; `min-width: 360px` ở `html`/`body` (`:46,50`) |
| Tailwind | `tailwind.config.ts:12-63` | Map thẳng sang CSS variables — không hardcode màu ✔ |

## 7. Module phụ thuộc

| Chiều | Module | Lý do |
|---|---|---|
| M14 ← | **M01-AUTH-ACCOUNT** | `getAuthContext` là nguồn duy nhất của `role/audience/scopeKind` |
| M14 ← | M10-NOTIFICATIONS | `getUnreadNotificationCount()` chạy ở layout mọi trang |
| M14 → | **Toàn bộ 13 module còn lại** | `requireRouteAccess` + `ROUTE_RULES` + `PageContainer`/`PageHeader` |
| M14 ↔ | M13-PORTAL | `/parent/*`, `/student/*` — nơi tập trung mọi lệch giữa nav và route-map |

## 8. Mức độ quan trọng

**Cao (P0).** Là lớp authorization thứ hai trong ba lớp (route-map → guard → RLS) và là nơi duy nhất
người dùng nhìn thấy hệ thống. Một lỗ ở đây (ví dụ hàng 23) không bị RLS bắt vì RLS chỉ lọc **dữ liệu**,
không chặn **route**.

## 9. Tình trạng test hiện tại

| Loại | File | Bao phủ | Thiếu |
|---|---|---|---|
| unit | `tests/unit/navigation.test.ts` (3 test) | không trùng href, preset staff đúng 5 mục, `getPageTitle`/`isNavigationItemActive` | **không test `getDesktopNavigation`/`getMobileNavigation` theo từng role**; không test `role = null`; không test nav khớp `ROUTE_RULES` |
| unit | `tests/unit/permissions.test.ts` (3 test) | audience/scope, fail-closed, `/admin` | **chỉ 3 role được kiểm**; không test `/attendance` với `treasurer`; không test `/student` với `guardian` |
| unit | `tests/unit/button.test.tsx` | size ≥ 44px | — |
| unit | `tests/unit/errors.test.ts`, `dates.test.ts`, `utils.test.ts`, `service-worker.test.ts` | mã lỗi, timezone, `cn`, quy tắc cache SW | — |
| E2E | `tests/e2e/home.spec.ts` (5 test) | `/` → `/login`, deep-link cần đăng nhập, 404 | **khẳng định `next=%2Fdashboard` là đúng** — chốt luôn cả cái bug |
| E2E | `tests/e2e/authenticated-shell.spec.ts` | GLV901 đi hết Phase 2; phụ huynh bị chặn 4 route | không test staff bị chặn khỏi `/student/attendance` |
| E2E | `tests/e2e/responsive.spec.ts` | 13 route × 3 viewport, tràn ngang + vùng bấm ≥ 44px | **không có route nào của guardian/student ngoài 2 route**; không kiểm contrast |
| E2E | `tests/e2e/pwa.spec.ts` (3 test) | manifest/icon không cần đăng nhập, header `sw.js`, offline fallback | không test prompt cài đặt |
| E2E | `tests/e2e/security.spec.ts` (3 test) | headers, UUID rác không 5xx, GLV lớp mở URL lớp khác | — |

**Không có test nào** cho: đăng xuất (không có tính năng), `academic-year-switcher`, focus trap của drawer,
`?next=`/`?error=` sau khi đăng nhập, `/parent/children/[studentId]`.
