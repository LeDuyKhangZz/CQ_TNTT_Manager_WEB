# M14-NAVIGATION-SHELL — Quy tắc nghiệp vụ (điều hướng & phân quyền route)

> Mỗi quy tắc ghi rõ **nơi enforce thật** kèm `file:line`. Quy tắc chỉ nằm trong tài liệu mà không có
> chỗ enforce được đánh dấu ⚠️.

## A. Kiến trúc phân quyền

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-01 | Authorization có **ba lớp**: route-map → guard server → RLS. Middleware **không** phải một lớp. | `src/lib/supabase/middleware.ts:8-11,36-37` (ghi rõ không authorize) | ✔ |
| BR-02 | Fail-closed: route không có `RouteRule` thì **cấm**. | `src/lib/permissions/route-map.ts:57-58` — `if (!rule) return false` | ✔ có test `tests/unit/permissions.test.ts:32-36` |
| BR-03 | Rule khớp theo **prefix**, rule có `path` dài hơn thắng. | `route-map.ts:50-54` (`sort` theo `path.length` giảm dần) | ✔ |
| BR-04 | Rule `public: true` bỏ qua mọi kiểm tra khác. Hiện chỉ `/login`. | `route-map.ts:20,59` | ✔ |
| BR-05 | Rule **không khai `roles`** ⇒ mọi tài khoản `active` vào được (RLS chịu trách nhiệm lọc dữ liệu). | `route-map.ts:61` — `if (!rule.roles) return true` | ✔ cố ý |
| BR-06 | `accountStatus !== 'active'` ⇒ cấm ở tầng route **và** mất quyền ở tầng RLS. | `route-map.ts:60`; `guards.ts:10`; `app.current_role()` yêu cầu `account_status='active'` | ✔ hai lớp |
| BR-07 | `role === null` ⇒ chỉ vào được route không khai `roles`. | `route-map.ts:62` — `context.role !== null && rule.roles.includes(...)` | ✔ |
| BR-08 | Ẩn nút **không phải** authorization; navigation chỉ là metadata trình bày. | `src/config/navigation.ts:38-40` (comment); `AGENTS.md` §5 | ✔ tuyên bố, xem BR-20 |

## B. Vòng đời phiên

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-09 | Chưa đăng nhập ⇒ `/login?next=<đích>`. | `src/lib/auth/guards.ts:9` | ⚠️ `next` **không được đọc lại** ở đâu (grep `searchParams` toàn `src/`) |
| BR-10 | Tài khoản không `active` ⇒ `/login?error=account_unavailable`. | `guards.ts:10` | ⚠️ `error` **không được hiển thị** |
| BR-11 | `mustChangePassword` ⇒ ép sang `/change-password`, không có đường vòng. | `guards.ts:11-13` | ✔ — mọi route `(dashboard)` đi qua layout (`layout.tsx:6`), `/change-password` tự loại trừ bằng điều kiện `nextPath !== "/change-password"` |
| BR-12 | Đăng nhập vào tài khoản không `active` ⇒ `signOut` ngay, không cấp phiên. | `src/features/auth/server/actions.ts:78-81` | ✔ |
| BR-13 | Sau đổi mật khẩu, cờ `must_change_password` do RPC `complete_password_change` hạ, không do client. | `auth/server/actions.ts:95` | ✔ |
| BR-14 | Người dùng phải kết thúc được phiên của mình. | **không có** | 🔴 **Không tồn tại** — không có action đăng xuất nào trong `src/` |

## C. Điều hướng

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-15 | Mục nav hiện khi khớp cả ba: `audiences`, `roles` (nếu khai), `scopes`. | `src/config/navigation.ts:100-107` | ✔ |
| BR-16 | `role/audience/scopeKind` = `null` ⇒ chỉ `/dashboard`, `/notifications`, `/account`. | `navigation.ts:101-103` | ✔ |
| BR-17 | Bottom nav tối đa 5 mục, chọn theo `audience`. | `navigation.ts:113-120` | ✔ (cả 3 preset đúng 5) |
| BR-18 | Preset mobile tra theo `href`, không theo chỉ số — thêm mục mới không làm lệch preset. | `navigation.ts:68-74` (`navItem` ném lỗi nếu không tìm thấy) | ✔ thiết kế tốt |
| BR-19 | Deep-link thông báo chỉ được trỏ tới route đã tồn tại. | `src/features/notifications/constants.ts:35-58` **và** CHECK `notifications_link_known_route` trong migration `20260723000400` | ✔ hai nơi, có test canh nhau |
| BR-20 | Nav và `ROUTE_RULES` phải khớp nhau. | **không có** | ⚠️ Không có test hay assertion nào; hiện có 3 chênh lệch (xem §E) |
| BR-21 | Mục active dùng `aria-current="page"`; `/dashboard` chỉ active khi khớp chính xác. | `navigation.ts:130-132`; `app-sidebar.tsx:54`; `mobile-bottom-navigation.tsx:14` | ✔ |

## D. Trạng thái, lỗi, dữ liệu

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-22 | Mã lỗi tiếng Anh ổn định, thông điệp UI tiếng Việt. | `src/lib/errors/index.ts:3-36` | ✔ |
| BR-23 | Không rò stack/SQL ra UI. | `src/app/error.tsx:14` và `src/app/(dashboard)/error.tsx:9` chỉ log `digest`; `ErrorState` in câu cố định | ✔ |
| BR-24 | UUID sai định dạng ⇒ 404, không 500. | `committees/[committeeId]/page.tsx:19`; `reports/snapshots/[snapshotId]/export/route.ts:20-22`; các trang khác dựa vào query trả `null` → `notFound()` | ✔ có E2E `tests/e2e/security.spec.ts:44-63` |
| BR-25 | Không đọc được hồ sơ ⇒ 404, **không** "không có quyền" (không lộ sự tồn tại). | `parent/children/[studentId]/page.tsx:15-17` | ✔ cố ý |
| BR-26 | Ngày hiển thị `dd/MM/yyyy`, timezone `Asia/Ho_Chi_Minh`, DB lưu UTC. | `src/lib/dates/index.ts:4-16` | ✔ |
| BR-27 | Mọi trang phải có skeleton / empty / permission-denied / 404 / error-retry. | `docs/06` §17 | ⚠️ Có đủ **component**, nhưng `EmptyState` không được trang nào dùng (grep ngoài `shared/` = 0) và thiếu `(dashboard)/not-found.tsx` |

## E. Chênh lệch navigation ↔ route-map (nguồn của BR-20)

| # | Route | `navigation.ts` cho ai thấy | `route-map.ts` cho ai vào | Hệ quả |
|---|---|---|---|---|
| D1 | `/attendance` | mọi staff (`:46`, không khai `roles`) | 9 role — trừ `parish_priest`, `chaplain`, `treasurer` (`:29`) | Cha sở / Cha phó / Thủ quỹ **thấy mục rồi bị chặn**. Là "ẩn nút thiếu, chặn đủ" — an toàn nhưng gây bực. |
| D2 | `/parent/absence-requests` | **chỉ** `guardian` (`:48`) | **mọi** tài khoản active (`/parent`, `:36`) | GLV cũng là phụ huynh **vào được nhưng không tìm thấy** đường vào. Route mở có chủ ý (D-25) nhưng nav không phản ánh. |
| D3 | `/student/attendance` | chỉ `student` (`:47`) | `roles: ["student"]` (`:37`) — **nhưng không được thi hành** | Xem D4. |
| D4 | `/student/attendance` (guard) | — | `requireAuthContext` thay vì `requireRouteAccess` (`portal/server/queries.ts:174`) | 🔴 **Rule bị bỏ qua.** Bất kỳ tài khoản active nào mở URL cũng render trang; `getPortalChildren()` trả về danh sách theo RLS nên một phụ huynh sẽ thấy trang "Điểm danh của em" với dữ liệu con mình. Không rò dữ liệu người khác, nhưng `RouteRule` khai `["student"]` là lời hứa **không được giữ**. |
| D5 | `/parent/children/[studentId]` | không xuất hiện ở bất kỳ nav nào | mọi tài khoản active | Route mồ côi — chỉ tới được bằng deep-link thông báo (`notifications/constants.ts:51`) hoặc gõ tay. |
| D6 | `/account` | có trong bottom nav + user menu, **không** trong sidebar | mọi tài khoản active | Desktop và mobile có tập mục khác nhau. |

**Không có chênh lệch** ở: `/students`, `/classes`, `/staff`, `/committees`, `/reports` (nav = staff,
rule = `STAFF_ROLES`); `/promotions` (11 role khai đủ hai bên); `/imports` (4 role khai đủ hai bên);
`/admin` (`super_admin` cả hai bên); `/teaching-plan`, `/results` (mở cả hai bên).

## F. Quy tắc PWA

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-28 | Service worker **chỉ** cache vỏ tĩnh: `/_next/static/`, `/icons/`, `offline.html`. | `public/sw.js:17-20,46-48,73` | ✔ cố ý, có test `tests/unit/service-worker.test.ts` |
| BR-29 | Điều hướng luôn ra mạng; mất mạng ⇒ trang offline **tĩnh**, không trả trang cũ. | `public/sw.js:63-70` | ✔ cố ý |
| BR-30 | Request `POST` (Server Action) không bao giờ bị service worker đụng vào. | `public/sw.js:53-54` | ✔ |
| BR-31 | Request khác origin (Supabase, signed URL) không bị đụng vào. | `public/sw.js:58-59` | ✔ |
| BR-32 | Đổi `PRECACHE` hoặc quy tắc cache ⇒ phải tăng `VERSION`. | `public/sw.js:9-13` (comment) | ⚠️ quy ước, không có test canh |
| BR-33 | Service worker chỉ đăng ký ở production; ở dev phải **gỡ** đăng ký cũ. | `src/components/pwa/service-worker-registrar.tsx:17-24` | ✔ |
| BR-34 | `sw.js` không được cache lâu ở tầng HTTP. | `next.config.mjs:33-41` | ✔ có test `tests/e2e/pwa.spec.ts:34-42` |
| BR-35 | Manifest và icon tải được khi **chưa** đăng nhập. | `tests/e2e/pwa.spec.ts:12-32` | ✔ |
| BR-36 | Cho phép zoom trên mobile (accessibility). | `src/app/layout.tsx:29` (`maximumScale: 5`) | ✔ |

## G. Header bảo mật

| ID | Quy tắc | Nơi enforce | Trạng thái |
|---|---|---|---|
| BR-37 | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS trên mọi path. | `next.config.mjs:18-31` | ✔ có test `tests/e2e/security.spec.ts:31-42` |
| BR-38 | URL mang UUID thiếu nhi không được rò sang miền khác. | `Referrer-Policy: strict-origin-when-cross-origin` (`next.config.mjs:21`) | ✔ |
| BR-39 | CSP. | **chưa có** | ⚠️ đã ghi nợ ở `next.config.mjs:16-17` và `WORKLOG.md` |
