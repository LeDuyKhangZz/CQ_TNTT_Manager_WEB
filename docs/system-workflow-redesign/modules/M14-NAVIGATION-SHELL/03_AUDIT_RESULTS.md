# M14-NAVIGATION-SHELL — Kết quả audit

## 0. Thang chấm

15 tiêu chí, mỗi tiêu chí 1–5 điểm, tổng **75**.

| # | Tiêu chí | Nội dung |
|---|---|---|
| C01 | Rõ mục tiêu | Người dùng hiểu ngay mình đang ở đâu, làm được gì |
| C02 | Số bước | Đạt mục tiêu bằng ít thao tác nhất hợp lý |
| C03 | Độ rõ của action chính | Nút/liên kết chính nổi bật, nhãn nói đúng việc |
| C04 | Phản hồi hệ thống | Trạng thái active, badge, thông báo sau thao tác |
| C05 | Xử lý lỗi và khôi phục | Lỗi có nguyên nhân, có đường sửa |
| C06 | Empty / loading | Có skeleton, có trạng thái rỗng kèm hướng dẫn |
| C07 | Nhất quán | Cùng một việc trông giống nhau ở mọi trang |
| C08 | Phân quyền đúng, fail-closed | Ẩn nút đi kèm chặn thật; không đường vòng |
| C09 | Nhãn tiếng Việt | Đúng ngôn ngữ nghiệp vụ của Xứ đoàn |
| C10 | Responsive 360 / 1366 | Không tràn ngang, bố cục dùng được |
| C11 | Touch target ≥ 44px | Bấm được bằng ngón tay |
| C12 | Accessibility | ARIA, focus, heading, contrast AA |
| C13 | Lối thoát | Luôn quay lại/thoát ra được |
| C14 | Hiệu năng cảm nhận | Không chờ vô cớ |
| C15 | Bảo trì và test | Có test bảo vệ hành vi |

**Ngưỡng phân loại**

| Điểm | Trạng thái | Điều kiện chặn |
|---|---|---|
| ≥ 68 | `PASS` | không tiêu chí nào ≤ 3 |
| 60–67 | `PASS_WITH_MINOR_UI_FIX` | không tiêu chí nào ≤ 2 |
| 48–59 | `NEEDS_IMPROVEMENT` | — |
| < 48 | `CRITICAL` | — |

Quy tắc chặn bổ sung: **bất kỳ tiêu chí C05, C08 hoặc C13 nào ≤ 2 thì luồng không thể xếp cao hơn
`NEEDS_IMPROVEMENT`**, dù tổng điểm bao nhiêu — vì đó là các trục "người dùng bị kẹt" và "quyền bị hở".

## 1. Bảng tổng hợp

| ID | Tên luồng | C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| F01 | Đăng nhập → vào app | 5 | 4 | 5 | 3 | **2** | 4 | 4 | 5 | 5 | 5 | 5 | 3 | 3 | 4 | 5 | **62** | `NEEDS_IMPROVEMENT` |
| F02 | Điều hướng desktop | 4 | 5 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 5 | 3 | **62** | `PASS_WITH_MINOR_UI_FIX` |
| F03 | Điều hướng mobile | 4 | 3 | 4 | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 5 | **2** | 4 | 4 | 4 | **54** | `NEEDS_IMPROVEMENT` |
| F04 | Truy cập bị từ chối | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 3 | 4 | 5 | 5 | **67** | `PASS_WITH_MINOR_UI_FIX` |
| F05 | Đổi năm học | 2 | 1 | 1 | 1 | 2 | 2 | 2 | 3 | 3 | 2 | 5 | 3 | 2 | 4 | 1 | **34** | `CRITICAL` |
| F06 | Thông báo và badge | 5 | 5 | 4 | 4 | 3 | 4 | 4 | 4 | 5 | 5 | 5 | 3 | 4 | 3 | 3 | **61** | `PASS_WITH_MINOR_UI_FIX` |
| F07 | Đăng xuất | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | **1** | 1 | 1 | **16** | `CRITICAL` |
| F08 | Ngoại tuyến / PWA | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 3 | 3 | 5 | 5 | **66** | `PASS_WITH_MINOR_UI_FIX` |

**Trung bình: 52,75/75.** Bỏ hai luồng `CRITICAL` ra, phần còn lại trung bình 61,2/75 — tức là vỏ ứng
dụng đã dựng chắc, cái thiếu là **hai tính năng chưa từng được làm** (đăng xuất, đổi năm học) và **một
số chi tiết a11y**.

---

## 2. Chi tiết từng luồng

### F01 — Đăng nhập → vào app · `NEEDS_IMPROVEMENT` · 62/75

**Điểm mạnh.** Fail-closed đúng (`route-map.ts:58` rule `null` → `false`); ép đổi mật khẩu lần đầu
(`guards.ts:11-13`); form có `htmlFor`/`id`, `aria-invalid`, `aria-describedby`, lỗi trong
`FormMessage` với `role="alert"` (`form-message.tsx:21`); thông điệp không phân biệt "sai tên" và
"sai mật khẩu" (`actions.ts:71`) — chống dò tài khoản.

**Vấn đề chặn (C05 = 2).** Người dùng bị khóa tài khoản bị đá về `/login?error=account_unavailable`
(`guards.ts:10`) nhưng **không có gì đọc `error`**. Màn hình login hiện ra trắng trơn. Người dùng nghĩ
"chắc mình bấm nhầm", nhập lại, và chỉ khi đó mới thấy "Tài khoản đang bị khóa hoặc đã vô hiệu hóa"
(`actions.ts:80`). Với người dùng ít kinh nghiệm — phụ huynh lớn tuổi, thiếu nhi — đây là vòng lặp không
có lối ra.

**Vấn đề C02/C13.** Deep-link luôn mất: `layout.tsx:6` gọi `requireAuthContext()` không tham số nên
`next` luôn là `/dashboard` (`tests/e2e/home.spec.ts:15-18` xác nhận `/admin` → `next=%2Fdashboard`).
Kể cả nếu `next` đúng thì cũng không ai đọc nó. Link trong thông báo email/Zalo tới `/attendance/<id>`
sẽ luôn đổ người dùng về trang tổng quan.

#### 5 Whys — vì sao lý do khóa tài khoản không đến được người dùng?

1. **Vì sao người dùng bị khóa không biết mình bị khóa?**
   Trang `/login` không hiển thị `?error=account_unavailable`.
2. **Vì sao không hiển thị?**
   `src/app/(auth)/login/page.tsx:7-16` là component không nhận `searchParams`, và `LoginForm` là client
   component không dùng `useSearchParams`.
3. **Vì sao không ai nối hai đầu?**
   `guards.ts` được viết như một API "phát tín hiệu" (thêm query param) mà không có hợp đồng bắt buộc
   phía nhận. Không có test nào khẳng định "param này phải được hiển thị".
4. **Vì sao không có test?**
   E2E hiện có (`home.spec.ts`) chỉ kiểm **URL sau redirect**, coi việc đến đúng URL là đủ. Nó thậm chí
   khẳng định `next=%2Fdashboard` như hành vi đúng, biến bug thành đặc tả.
5. **Gốc rễ.**
   Không có ai sở hữu "trạng thái chuyển tiếp giữa guard và UI". Guard thuộc `lib/auth`, UI thuộc
   `features/auth`, và không có tài liệu nào liệt kê tập `error code` mà `/login` phải xử lý — trong khi
   `src/lib/errors/index.ts` đã có sẵn đúng mô hình đó cho lỗi nghiệp vụ.

---

### F02 — Điều hướng desktop · `PASS_WITH_MINOR_UI_FIX` · 62/75

**Điểm mạnh.** `aria-current="page"` (`app-sidebar.tsx:54`), `<nav aria-label>` cho cả sidebar và bottom
nav, icon `aria-hidden` kèm nhãn chữ, link cao `min-h-11`, không phụ thuộc hover.

**Vấn đề.**

- **C07 = 3.** Footer sidebar còn text tạm *"Bản nền giao diện / Phân quyền route hoàn thiện ở P0-T3"*
  (`app-sidebar.tsx:72-75`) — hiển thị trên **mọi** trang desktop cho **mọi** người dùng, kể cả phụ huynh.
  Ngoài ra `Tài khoản` có trong bottom nav nhưng không có trong sidebar → hai nền tảng có tập mục khác nhau.
- **C08 = 4.** Mục `Điểm danh` không khai `roles` (`navigation.ts:46`) trong khi rule chỉ cho 9 role
  (`route-map.ts:29`) → Cha sở, Cha phó, Thủ quỹ thấy mục rồi bị đá về `/access-denied`.
- **C01/C09 = 4.** Nhóm `Chung / Mục vụ / Điều hành` là ngôn ngữ quản trị, không phải ngôn ngữ của một
  Giáo lý viên đứng lớp (chi tiết ở `06_UI_UX_RECOMMENDATIONS.md` §1).
- **C15 = 3.** `tests/unit/navigation.test.ts` chỉ có 3 test, không test `getDesktopNavigation` với bất
  kỳ role nào.

---

### F03 — Điều hướng mobile · `NEEDS_IMPROVEMENT` · 54/75

**Vấn đề chặn (C12 = 2).** Drawer mobile (`app-shell.tsx:22-29`) không có `role="dialog"`, không
`aria-modal`, **không focus trap**, không đóng bằng `Escape`, không khóa cuộn nền. Lớp phủ là một
`<button>` phủ toàn màn hình (`:24`) — với bàn phím/screen reader đó là một nút khổng lồ vô nghĩa nằm
trước nội dung drawer trong thứ tự tab. Người dùng bàn phím mở drawer xong focus vẫn nằm ở nút hamburger
phía sau lớp phủ. `docs/06-ui-ux-spec.md` §16 yêu cầu rõ "Modal trap focus".

**Vấn đề khác.**

- **C02/C08 = 3.** Preset staff dùng chung cho cả 12 role. Super Admin không có `Quản trị hệ thống`;
  Trưởng ngành không có `Lên lớp/chuyển lớp` (việc duyệt là của họ); Thủ quỹ/Cha sở có tab `Điểm danh`
  **chết** (chạm → `/access-denied`).
- **C07 = 3.** Tab thứ 5 `Tài khoản` dẫn tới placeholder cho **mọi** vai trò.
- **C09 = 3.** Nhãn `text-[11px]` (`mobile-bottom-navigation.tsx:14`) dưới ngưỡng 13px mà
  `docs/06-ui-ux-spec.md` §3 tự đặt ra. Nhãn `Xin nghỉ` lệch với spec §5 (`Con của tôi`).

---

### F04 — Truy cập bị từ chối · `PASS_WITH_MINOR_UI_FIX` · 67/75

Luồng đúng, có E2E bảo vệ, thông điệp tiếng Việt lịch sự, có nút về Tổng quan.

**Trừ điểm C12 = 3:** chữ `text-warning` (`#d99a2b`) trên `bg-warning-surface` (`#fff7e3`) cho tỷ lệ
tương phản **≈ 2,29:1** — dưới chuẩn AA 4,5:1 rất xa (`permission-denied.tsx:10`, tokens
`globals.css:27-28`). Dòng "KHÔNG CÓ QUYỀN TRUY CẬP" chính là dòng cần đọc được nhất.

**Trừ điểm C03 = 4:** trang không nói *vai trò hiện tại* và *cần vai trò nào*, nên người dùng gọi cho
quản trị viên mà không mang theo thông tin gì.

---

### F05 — Đổi năm học · `CRITICAL` · 34/75

`AcademicYearSwitcher` là một `<button disabled>` in **chuỗi cứng** `"Năm học 2026–2027"`
(`academic-year-switcher.tsx:5-9`). Nó không đọc DB, không lưu state, không thay đổi được gì, và biến
mất hoàn toàn dưới 640px.

Đây không chỉ là "tính năng chưa làm" — nó là **hiển thị sai sự thật**. Mọi query đọc
`academic_years where status='current'` (ví dụ `dashboard/server/queries.ts:19-23`); nếu quản trị viên
đặt năm học hiện hành là 2025–2026 thì header vẫn khẳng định 2026–2027 trong khi số liệu bên dưới thuộc
năm khác. Người dùng không có cách nào biết.

`docs/06-ui-ux-spec.md` §4 (dòng 50) liệt kê "năm học hiện tại" là thành phần bắt buộc của header —
tức là hiển thị đúng năm học là yêu cầu đã chốt, không phải mở rộng.

#### 5 Whys — vì sao một nhãn cứng lọt tới production?

1. **Vì sao header hiện năm học cứng?** Component không nhận props và không gọi query.
2. **Vì sao không gọi query?** Nó là component **server** nhưng được đặt trong cây con của `AppShell`
   (`"use client"`, `app-shell.tsx:1`) → nó bị biên dịch thành client component, không `await` được DB.
3. **Vì sao `AppShell` phải là client?** Chỉ vì hai thứ: `usePathname()` và `useState(drawerOpen)`
   (`app-shell.tsx:12-13`). Toàn bộ header/sidebar bị kéo sang client theo.
4. **Vì sao không truyền năm học xuống bằng props như `authContext`/`unreadCount`?**
   `layout.tsx:6-7` đã có sẵn đúng khuôn mẫu đó cho hai giá trị khác — nhưng năm học chưa từng được thêm
   vào, và không có test nào đòi hỏi.
5. **Gốc rễ.** Ranh giới client/server của vỏ ứng dụng bị đặt ở mức quá cao. Một chi tiết tương tác nhỏ
   (drawer) buộc cả header thành client, và hệ quả là dữ liệu server phải đi vòng qua props — việc nào
   quên thì thành hằng số cứng, và không có cơ chế nào báo động.

---

### F06 — Thông báo và badge · `PASS_WITH_MINOR_UI_FIX` · 61/75

Badge dùng số thật, `aria-label` động ("Mở thông báo, N chưa đọc"), cắt `99+`.

**Trừ điểm.** C14 = 3: `getUnreadNotificationCount()` chạy trong `layout.tsx:7` nên **mọi** điều hướng
đều phải chờ thêm một query, kể cả `/reports` vốn đã nặng; không có `<Suspense>` để tách. C12 = 3: badge
`text-[10px]` (`notification-button.tsx:17`), và số thay đổi không có `aria-live`. C15 = 3: không có test
nào cho badge trong `tests/unit` hay `tests/e2e` của module này.

---

### F07 — Đăng xuất · `CRITICAL` · 16/75

**Tính năng không tồn tại.** `UserMenu` chỉ có một mục "Tài khoản" (`user-menu.tsx:20`). Grep `signOut`
trên toàn `src/` trả về đúng **một** dòng: `src/features/auth/server/actions.ts:79`, dùng nội bộ khi
phát hiện tài khoản không active lúc đăng nhập — không có action đăng xuất nào cho người dùng gọi.

Hệ quả trong đúng bối cảnh mà dự án tự nêu:

- `public/sw.js:4-7` viện dẫn "máy trong phòng học là máy dùng chung" để cấm cache HTML. Cùng cái máy
  đó, người dùng **không thể kết thúc phiên của mình**.
- Người có nhiều vai trò (một GLV cũng là phụ huynh, hai tài khoản khác nhau) không thể đổi tài khoản.
- Tài khoản bị Super Admin khóa vẫn giữ cookie; chỉ bị chặn khi request tiếp theo chạm `guards.ts:10`,
  và khi đó lại rơi vào lỗi F01.

#### 5 Whys — vì sao không có nút đăng xuất?

1. **Vì sao không có nút?** `UserMenu` chỉ render một `<Link href="/account">`.
2. **Vì sao chỉ có một link?** Đăng xuất được coi là việc của trang `/account`, mà `/account` là
   `ProtectedModulePlaceholder` (`account/page.tsx:4`) — chưa làm.
3. **Vì sao `/account` chưa làm mà vẫn ở trong nav?** Nó nằm trong `accountNavigationItem`
   (`navigation.ts:59-66`) và là mục thứ 5 của **cả ba** preset mobile — được đưa vào từ giai đoạn dựng
   khung, chưa ai gỡ ra hoặc hoàn thiện.
4. **Vì sao không phase nào nhặt lại?** Phase 1–7 chia theo **module nghiệp vụ** (điểm danh, giáo án,
   báo cáo…). Đăng xuất không thuộc module nghiệp vụ nào nên không có task chủ.
5. **Gốc rễ.** Không có checklist "vỏ ứng dụng phải đủ những gì" độc lập với các module nghiệp vụ. Cổng
   Gate của từng phase kiểm "module X dùng được", không ai kiểm "người dùng ra khỏi hệ thống được".

---

### F08 — Ngoại tuyến / PWA · `PASS_WITH_MINOR_UI_FIX` · 66/75

Đây là phần được làm kỹ nhất của module: manifest đủ icon 192/512 + maskable, `sw.js` có nguyên tắc rõ
ràng và có test đọc thẳng file thật (`tests/unit/service-worker.test.ts`), header `sw.js` chống cache
lâu (`next.config.mjs:33-41`), E2E bấm thật cả luồng offline (`tests/e2e/pwa.spec.ts:44-66`).

**Không được đụng vào** (có chủ ý, đã ghi trong `WORKLOG.md` dòng 70–74): sw không cache HTML, và
`/offline.html` nói thẳng là không có chế độ làm việc ngoại tuyến.

**Trừ điểm.** C13 = 3: `/offline.html` chỉ có nút "Thử lại", không có đường về `/login`; nếu mạng vẫn
chưa có thì người dùng bấm mãi. C12 = 3: nút cam `#f28c5b` chữ trắng ≈ **2,42:1**, dưới AA. C03 = 4:
không có prompt cài đặt (`beforeinstallprompt` không xuất hiện ở đâu trong `src/`), người dùng phải tự
biết dùng menu trình duyệt — trong khi Gate Phase 7 lấy "installable PWA" làm tiêu chí.

---

## 3. Vấn đề xếp theo mức độ

| ID | Vấn đề | Mức | Bằng chứng |
|---|---|---|---|
| A-01 | Không có chức năng đăng xuất | `CRITICAL` | `user-menu.tsx:6-24`; grep `signOut` = 1 kết quả nội bộ |
| A-02 | `AcademicYearSwitcher` hiển thị năm học cứng, có thể sai so với DB | `CRITICAL` | `academic-year-switcher.tsx:5-9` |
| A-03 | `/student/attendance` chỉ dùng `requireAuthContext`, `RouteRule` roles `["student"]` không được thi hành | `CRITICAL` (an ninh) | `portal/server/queries.ts:174` vs `route-map.ts:37` |
| A-04 | `?error=account_unavailable` và `?next=` bị nuốt hoàn toàn | `NEEDS_IMPROVEMENT` | `guards.ts:9-10`; grep `searchParams.get` |
| A-05 | Drawer mobile không có focus trap / `role="dialog"` / phím `Esc` | `NEEDS_IMPROVEMENT` | `app-shell.tsx:22-29` |
| A-06 | Text tạm "Phân quyền route hoàn thiện ở P0-T3" còn ở production | `NEEDS_IMPROVEMENT` | `app-sidebar.tsx:72-75` |
| A-07 | `/parent/children/[studentId]` không có link nội bộ nào | `NEEDS_IMPROVEMENT` | grep `parent/children` chỉ trúng nav constants + query |
| A-08 | Bottom nav sai trọng tâm cho 7/12 role staff | `NEEDS_IMPROVEMENT` | `navigation.ts:76-82,113-120` |
| A-09 | Tương phản dưới AA: primary/white 2,42:1, warning 2,29:1, danger 3,70:1, success 3,02:1 | `NEEDS_IMPROVEMENT` | `globals.css:13-30`, `button.tsx:14,18`, `badge.tsx:12-14` |
| A-10 | `/account` là placeholder nhưng là tab thứ 5 của mọi preset mobile | `NEEDS_IMPROVEMENT` | `account/page.tsx:4`, `navigation.ts:59-98` |
| A-11 | Mục `Điểm danh` hiện cho Cha sở/Cha phó/Thủ quỹ rồi chặn | `PASS_WITH_MINOR_UI_FIX` | `navigation.ts:46` vs `route-map.ts:29` |
| A-12 | Thiếu `(dashboard)/not-found.tsx` → 404 làm mất vỏ ứng dụng | `PASS_WITH_MINOR_UI_FIX` | chỉ có `src/app/not-found.tsx` |
| A-13 | `EmptyState` gần như không được dùng; mỗi trang tự viết `<p>` rỗng | `PASS_WITH_MINOR_UI_FIX` | grep `EmptyState` ngoài `shared/` = 0 |
| A-14 | `getPageTitle` trả "Thiếu Nhi Chợ Quán" ở `/access-denied`, `/parent/children/*` | `PASS_WITH_MINOR_UI_FIX` | `navigation.ts:122-128` |
| A-15 | Chữ `text-[11px]`, `text-[10px]` dưới ngưỡng 13px của chính spec | `PASS_WITH_MINOR_UI_FIX` | `mobile-bottom-navigation.tsx:14`, `notification-button.tsx:17` |
| A-16 | Đếm chưa đọc chạy ở layout mọi request, không `<Suspense>` | `PASS_WITH_MINOR_UI_FIX` | `layout.tsx:7` |
| A-17 | `manifest.start_url = "/login"` và `/login` không kiểm phiên sẵn có | `NEEDS_CONFIRMATION` | `manifest.ts:12`, `login/page.tsx:7` |
| A-18 | `AuthContext` đầy đủ được serialize xuống client qua props của `AppShell` | `NEEDS_CONFIRMATION` | `layout.tsx:9`, `app-shell.tsx:11` |
