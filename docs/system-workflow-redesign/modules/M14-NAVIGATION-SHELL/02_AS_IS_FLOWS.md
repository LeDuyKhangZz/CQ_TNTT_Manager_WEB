# M14-NAVIGATION-SHELL — Luồng AS-IS

> Mô tả **đúng những gì code đang làm**, không phải những gì tài liệu mong muốn.

## Danh mục luồng

| ID | Tên luồng | Điểm vào | Điểm ra |
|---|---|---|---|
| `M14-NAVIGATION-SHELL-F01` | Đăng nhập → vào ứng dụng | `/` hoặc deep-link | `/dashboard` hoặc `/change-password` |
| `M14-NAVIGATION-SHELL-F02` | Điều hướng desktop (sidebar ≥ 1024px) | `/dashboard` | route bất kỳ |
| `M14-NAVIGATION-SHELL-F03` | Điều hướng mobile (bottom nav + drawer) | `/dashboard` | route bất kỳ |
| `M14-NAVIGATION-SHELL-F04` | Truy cập bị từ chối | URL ngoài quyền | `/access-denied` |
| `M14-NAVIGATION-SHELL-F05` | Đổi năm học | header desktop | **không có điểm ra** |
| `M14-NAVIGATION-SHELL-F06` | Thông báo và badge chưa đọc | header | `/notifications` |
| `M14-NAVIGATION-SHELL-F07` | Đăng xuất | — | **không tồn tại** |
| `M14-NAVIGATION-SHELL-F08` | Ngoại tuyến / PWA | mất mạng | `/offline.html` |

---

## F01 — Đăng nhập → vào ứng dụng

### Mermaid

```mermaid
flowchart TD
    A["Người dùng mở URL bất kỳ"] --> B{"Route thuộc (dashboard)?"}
    B -- "không, là /" --> C["src/app/page.tsx:4 redirect /login"]
    B -- "có" --> D["layout.tsx:6 requireAuthContext()<br/>nextPath mặc định = /dashboard"]
    D --> E{"getAuthContext() có user?"}
    E -- "không" --> F["guards.ts:9 redirect<br/>/login?next=%2Fdashboard"]
    E -- "có" --> G{"accountStatus === 'active'?"}
    G -- "không" --> H["guards.ts:10 redirect<br/>/login?error=account_unavailable"]
    G -- "có" --> I{"mustChangePassword?"}
    I -- "có" --> J["guards.ts:12 redirect /change-password"]
    I -- "không" --> K["AppShell dựng vỏ"]

    C --> L["LoginForm"]
    F --> L
    H --> L
    L --> M["!! login/page.tsx KHÔNG đọc<br/>?next và ?error — cả hai bị nuốt"]
    M --> N["loginWithUsername (actions.ts:63)"]
    N --> O{"đúng mật khẩu?"}
    O -- "không" --> P["FormMessage role=alert:<br/>'Tên đăng nhập hoặc mật khẩu không đúng.'"]
    O -- "có" --> Q{"account_status === 'active'?"}
    Q -- "không" --> R["signOut + 'Tài khoản đang bị khóa...'<br/>(actions.ts:79-80)"]
    Q -- "có" --> S["window.location.assign(redirectTo)<br/>login-form.tsx:28"]
    S --> T{"must_change_password?"}
    T -- "có" --> U["/change-password"]
    T -- "không" --> V["/dashboard — KHÔNG phải route đã gõ"]

    K --> V
```

### Bước AS-IS

1. `/` → `redirect("/login")` (`src/app/page.tsx:4`).
2. Deep-link `(dashboard)` khi chưa đăng nhập → `/login?next=%2Fdashboard` **bất kể** route gõ vào, vì
   layout chạy trước page và gọi `requireAuthContext()` không tham số (`src/app/(dashboard)/layout.tsx:6`).
3. `LoginForm` submit qua Server Action, nhận `{ redirectTo }` rồi `window.location.assign`
   (`src/features/auth/components/login-form.tsx:23-28`).
4. **Tham số `next` và `error` không được đọc ở bất kỳ đâu.** Người dùng luôn về `/dashboard`.
5. Tài khoản `locked`/`disabled` đang có phiên hợp lệ → `guards.ts:10` đá về `/login?error=...`, nhưng
   trang login hiện ra **sạch trơn, không một dòng giải thích**. Nếu người dùng nhập lại đúng mật khẩu,
   `loginWithUsername` mới báo "Tài khoản đang bị khóa hoặc đã vô hiệu hóa"
   (`src/features/auth/server/actions.ts:80`) — tức là phải đoán và thử lại mới biết lý do.

---

## F02 — Điều hướng desktop

```mermaid
flowchart LR
    A["AppShell (client)<br/>app-shell.tsx:14"] --> B["getDesktopNavigation(authContext)"]
    B --> C["platformNavigation.filter(isItemVisible)"]
    C --> D{"role === null?"}
    D -- "có" --> E["chỉ /dashboard, /notifications, /account<br/>navigation.ts:101-102"]
    D -- "không" --> F["lọc audiences → roles → scopes"]
    F --> G["AppSidebar chia 3 nhóm<br/>Chung | Mục vụ | Điều hành"]
    G --> H["Link + aria-current='page'"]
    H --> I["Click → route"]
    I --> J{"canAccessRoute?"}
    J -- "true" --> K["Trang render"]
    J -- "false" --> L["redirect /access-denied"]
```

Đặc điểm AS-IS:

- Sidebar `fixed inset-y-0 w-[264px]`, chỉ hiện `lg:` trở lên (`app-sidebar.tsx:21-23`); content bù
  `lg:pl-[264px]` (`app-shell.tsx:30`).
- Tối đa **15 mục** trong 3 nhóm. `Tài khoản` **không** nằm trong sidebar — chỉ trong `UserMenu`
  (`user-menu.tsx:20`) và bottom nav.
- Footer sidebar in cố định *"Bản nền giao diện / Phân quyền route hoàn thiện ở P0-T3"*
  (`app-sidebar.tsx:72-75`) — văn bản của giai đoạn dựng khung, vẫn còn ở bản production.
- `role = null` vẫn vào được `/dashboard` vì rule `:22` không giới hạn role
  (`route-map.ts:22` + `:61` `if (!rule.roles) return true`).

---

## F03 — Điều hướng mobile

```mermaid
flowchart TD
    A["< 1024px"] --> B["AppHeader nút 'Mở menu'<br/>app-header.tsx:11"]
    A --> C["MobileBottomNavigation<br/>fixed bottom, tối đa 5 mục"]
    B --> D["setDrawerOpen(true)"]
    D --> E["div fixed inset-0 z-40"]
    E --> F["button phủ toàn màn hình<br/>aria-label='Đóng menu'<br/>app-shell.tsx:24"]
    E --> G["AppSidebar mobile w-[min(82vw,320px)]"]
    G --> H["!! KHÔNG role='dialog'<br/>!! KHÔNG aria-modal<br/>!! KHÔNG focus trap<br/>!! KHÔNG đóng bằng Esc<br/>!! KHÔNG khóa scroll body"]
    G --> I["Click item → onClose + điều hướng"]
    D --> J["useEffect đóng drawer khi pathname đổi<br/>app-shell.tsx:17"]
    C --> K["getMobileNavigation(context)"]
    K --> L{"audience"}
    L -- "guardian" --> M["Trang chủ | Xin nghỉ | Kết quả | Thông báo | Tài khoản"]
    L -- "student" --> N["Trang chủ | Điểm danh | Kết quả | Thông báo | Tài khoản"]
    L -- "staff hoặc null" --> O["Trang chủ | Điểm danh | Lớp | Thông báo | Tài khoản"]
    M --> P[".slice(0,5) — navigation.ts:119"]
    N --> P
    O --> P
```

Đặc điểm AS-IS:

- `classStaffMobileNavigation` là **preset duy nhất cho cả 12 role staff** — thiết kế cho GLV lớp,
  dùng luôn cho Super Admin, Xứ đoàn trưởng, Trưởng ngành, Thủ quỹ, Cha sở.
- Mục cuối luôn là `/account`, hiện là **trang placeholder** (`account/page.tsx:4`).
- `.slice(0, 5)` không bao giờ thực sự cắt: cả ba preset chỉ có đúng 5 phần tử. Việc "mất mục" đến từ
  **preset chọn sai mục**, không từ `slice`.

---

## F04 — Truy cập bị từ chối

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant P as Page/Query
    participant G as guards.ts
    participant R as route-map.ts
    U->>P: GET /imports (role = guardian)
    P->>G: requireImportPage() → requireRouteAccess("/imports")
    G->>G: requireAuthContext("/imports") ✔
    G->>R: canAccessRoute(ctx, "/imports")
    R->>R: getRouteRule → roles = [4 role global-write]
    R-->>G: false
    G-->>U: redirect 307 → /access-denied
    U->>P: GET /access-denied
    P-->>U: PermissionDenied<br/>"Bạn không thể mở nội dung này"<br/>+ nút "Về tổng quan"
```

- Được `tests/e2e/authenticated-shell.spec.ts:105-112` bảo vệ cho 4 route với tài khoản phụ huynh.
- Trang không nói **vai trò hiện tại là gì** và **cần vai trò nào**, chỉ khuyên "liên hệ người quản trị"
  (`permission-denied.tsx:12`).
- `AppHeader` trên trang này in tiêu đề `"Thiếu Nhi Chợ Quán"` vì `getPageTitle("/access-denied")` không
  khớp mục nav nào (`navigation.ts:127`).

---

## F05 — Đổi năm học

```mermaid
flowchart LR
    A["Header desktop ≥ 640px"] --> B["AcademicYearSwitcher"]
    B --> C["button disabled<br/>academic-year-switcher.tsx:5"]
    C --> D["Chuỗi CỨNG 'Năm học 2026–2027'<br/>:7"]
    D --> E["Không đọc DB<br/>Không state<br/>Không URL/cookie/server"]
    E --> F["Có icon ChevronDown gợi ý mở được — nhưng không mở"]
    B -.-> G["< 640px: hidden hoàn toàn"]
```

- Không có bất kỳ nơi nào lưu "năm học đang chọn". Mọi query tự đọc
  `academic_years where status = 'current'` (ví dụ `src/features/dashboard/server/queries.ts:19-23`).
- Nhãn hiển thị là **hằng số trong code**, không đồng bộ với `academic_years.status='current'` của DB.
- `aria-label="Năm học hiện tại, dữ liệu mẫu"` (`:5`) thừa nhận đây là dữ liệu mẫu — nhưng người dùng
  cuối chỉ nghe được nếu dùng screen reader.

---

## F06 — Thông báo và badge

```mermaid
flowchart TD
    A["DashboardLayout (mọi request)"] --> B["getUnreadNotificationCount()<br/>layout.tsx:7"]
    B --> C["AppShell → AppHeader → NotificationButton"]
    C --> D{"unreadCount > 0?"}
    D -- "có" --> E["span badge, >99 → '99+'<br/>notification-button.tsx:19"]
    D -- "không" --> F["chỉ icon chuông"]
    C --> G["aria-label động:<br/>'Mở thông báo, N chưa đọc'"]
    E --> H["Link → /notifications"]
    H --> I["getNotificationsPageData → requireRouteAccess"]
```

- Badge dùng số thật (`notification_recipients`), không phải số giả.
- Đếm chạy ở layout ⇒ **mỗi lần điều hướng đều query lại**, không cache, không `<Suspense>` — làm chậm
  cả những trang không liên quan.
- Sau khi đánh dấu đã đọc ở `/notifications`, badge chỉ đổi khi layout render lại; không có `aria-live`
  nên screen reader không được báo.

---

## F07 — Đăng xuất

```mermaid
flowchart TD
    A["Người dùng muốn thoát"] --> B["UserMenu (details)"]
    B --> C["Chỉ có 1 mục: 'Tài khoản'<br/>user-menu.tsx:20"]
    C --> D["/account = ProtectedModulePlaceholder<br/>'Nền giao diện đã sẵn sàng... Phase 1'"]
    D --> E["!! Không có nút Đăng xuất ở bất kỳ đâu"]
    E --> F["grep signOut toàn src/ = 1 kết quả duy nhất:<br/>auth/server/actions.ts:79 — dùng nội bộ khi login<br/>vào tài khoản bị khóa"]
    F --> G["Lối thoát duy nhất: xóa cookie trình duyệt"]
```

**Luồng này không tồn tại trong sản phẩm.** Trên máy dùng chung ở phòng học — đúng bối cảnh mà
`public/sw.js:4-7` viện dẫn để từ chối cache HTML — người dùng không có cách nào kết thúc phiên.

---

## F08 — Ngoại tuyến / PWA

```mermaid
flowchart TD
    A["Tải trang production"] --> B["ServiceWorkerRegistrar<br/>đăng ký /sw.js sau sự kiện load"]
    B --> C["install: precache offline.html + 2 icon<br/>sw.js:22-31"]
    C --> D["activate: xóa cache khác version + clients.claim()"]
    D --> E{"fetch"}
    E -- "method != GET" --> F["bỏ qua (Server Action)"]
    E -- "khác origin" --> G["bỏ qua (Supabase, signed URL)"]
    E -- "mode = navigate" --> H["LUÔN ra mạng"]
    H --> I{"mạng lỗi?"}
    I -- "có" --> J["trả /offline.html tĩnh<br/>KHÔNG trả trang cũ (chống rò hồ sơ)"]
    I -- "không" --> K["HTML mới"]
    E -- "/_next/static/ hoặc /icons/" --> L["cache-first, lưu lại nếu response.type='basic'"]
    E -- "còn lại" --> M["ra thẳng mạng"]
```

- `/offline.html` nói thẳng: không có chế độ làm việc ngoại tuyến, thao tác chưa gửi sẽ mất
  (`public/offline.html:66-69`). Đây là quyết định cố ý (D-29..D-33).
- Manifest `start_url: "/login"` (`src/app/manifest.ts:12`) → mở app đã cài luôn bắt đầu ở `/login`, và
  nếu đã có phiên thì `/login` **không** tự chuyển sang `/dashboard` (login page không kiểm phiên).
- Không có prompt cài đặt (`beforeinstallprompt`): grep toàn `src/` không có. Người dùng phải tự dùng
  menu "Thêm vào màn hình chính" của trình duyệt.
