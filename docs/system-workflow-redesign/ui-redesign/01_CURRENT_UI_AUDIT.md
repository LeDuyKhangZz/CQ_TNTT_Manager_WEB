# 01 — Audit giao diện hiện trạng toàn hệ thống

> **Giai đoạn 2A — chỉ đánh giá và đề xuất. Chưa sửa một dòng mã nào.**
> Mọi khẳng định trong tài liệu này đều trích từ mã nguồn thật, có `file:line`.
> Các số đo tương phản là **kết quả chạy script**, không phải ước lượng.
>
> Nguồn phối hợp: `04_SYSTEM_WIDE_FINDINGS.md` (SW-13, SW-14), `modules/M14-NAVIGATION-SHELL/06_UI_UX_RECOMMENDATIONS.md`,
> và `06_DECISION_LOG.md` (D-79 cho phép chỉnh màu/cỡ chữ).

---

## 0. Kết luận một dòng

Hệ thống **không có design system** theo đúng nghĩa. Nó có **6 primitive** và **một bảng token màu chưa đạt chuẩn tiếp cận**;
mọi thứ còn lại (select, dialog, tabs, bảng, phân trang, tìm kiếm, toast, skeleton, tooltip, date picker) được **viết lại tại chỗ
ở từng trang**. Đây là lý do 13/14 module trông "gần giống nhau nhưng không giống nhau".

---

## 1. Nền tảng giao diện thực tế

| Hạng mục | Thực tế | Bằng chứng |
|---|---|---|
| Framework | Next.js 15 App Router, React Server Components mặc định | `package.json` |
| CSS | Tailwind 3 + CSS variables | `tailwind.config.ts`, `src/app/globals.css` |
| Thư viện component | **Không có.** `components.json` khai kiểu shadcn nhưng chỉ có 6 file tự viết | `src/components/ui/` |
| Radix / Headless UI | **Không cài** — `package.json` không có `@radix-ui/*` | `package.json` |
| Icon | `lucide-react` | — |
| Form | `react-hook-form` + Zod — **nhưng chỉ dùng ở 2 form auth**; phần còn lại là `<form action={serverAction}>` thuần | `login-form.tsx`, `change-password-form.tsx` |
| Animation | `tailwindcss-animate` đã cài, **gần như không dùng** (chỉ `animate-pulse` ở `LoadingState`) | `loading-state.tsx:7` |
| Dark mode | Không có, **cố ý** (D-5) | `docs/06` §1 |

---

## 2. 🔴 Phát hiện mới, chưa có trong Giai đoạn 1: **font chữ không hề được tải**

`globals.css:39-40` khai báo:

```css
--font-sans: "Be Vietnam Pro", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
```

Nhưng grep toàn bộ `src/` và `public/`:

- **Không có** `next/font`
- **Không có** `<link>` tới `fonts.googleapis.com`
- **Không có** `@font-face`

⇒ **Cả "Be Vietnam Pro" lẫn "Inter" đều chưa bao giờ được tải.** Ứng dụng thực tế đang chạy bằng `system-ui`:

| Thiết bị | Font thật đang hiển thị |
|---|---|
| Windows (laptop văn phòng) | Segoe UI |
| Android (phần lớn GLV, phụ huynh) | Roboto |
| iPhone/iPad | SF Pro |
| Máy phòng học đời cũ | tuỳ máy |

**Hệ quả:** `docs/06` §3 đặt ra định hướng typography ("Font ưu tiên: Inter hoặc Be Vietnam Pro") nhưng **định hướng đó chưa từng
có hiệu lực**. Chiều cao dòng, độ rộng chữ, và đặc biệt là **cách hiển thị dấu tiếng Việt** khác nhau giữa các thiết bị.
Đây là một trong những lý do giao diện "trông không đồng nhất" mà không ai chỉ ra được vì sao.

> Đây là hạng mục **rẻ và giá trị cao**: một lần thêm `next/font/google` ở `src/app/layout.tsx` là toàn hệ thống đồng nhất.
> Cần chốt font — xem `07_DECISIONS_REQUIRED.md` Q-05.

---

## 3. Design token hiện tại

`src/app/globals.css:6-41` — 24 biến. Được ánh xạ sang Tailwind ở `tailwind.config.ts:12-55`.

### 3.1 Kết quả đo tương phản (chạy bằng script, WCAG 2.1)

| Cặp màu | Giá trị | Tỷ lệ đo được | AA (4,5:1) | Dùng ở đâu |
|---|---|--:|:--:|---|
| chữ trắng / `--primary` | `#FFFFFF` / `#F28C5B` | **2,42:1** | ❌ | `Button variant="primary"` — **nút chính của toàn hệ thống** |
| `--warning` / `--warning-surface` | `#D99A2B` / `#FFF7E3` | **2,28:1** | ❌ | `Badge warning`; dòng "KHÔNG CÓ QUYỀN TRUY CẬP" |
| `--success` / `--success-surface` | `#4F9D76` / `#EDF8F2` | **3,01:1** | ❌ | `Badge success` — "Đang sinh hoạt", "Đang mở" |
| chữ trắng / `--danger` | `#FFFFFF` / `#D95C5C` | **3,73:1** | ❌ | `Button danger`; **badge số chưa đọc** |
| `--danger` / `--danger-surface` | `#D95C5C` / `#FFF0F0` | **3,37:1** | ❌ | `FormMessage` lỗi — **kênh báo lỗi chính** |
| `--text-muted` / `--background` | `#756861` / `#FFF9F4` | 5,14:1 | ✅ | mô tả, nhãn phụ |
| `--text` / `--background` | `#3F342F` / `#FFF9F4` | 11,53:1 | ✅ | chữ chính |

**5/7 cặp trượt chuẩn.** Nghiêm trọng nhất là hai cặp cuối bảng trên: **nút chính** (mọi hành động của mọi người dùng)
và **FormMessage lỗi** (kênh duy nhất báo sai). Người dùng chính là phụ huynh lớn tuổi trên điện thoại ngoài sân nhà thờ,
dưới nắng — điều kiện tệ nhất cho tương phản thấp.

> Con số ở đây khớp với `M14/06_UI_UX_RECOMMENDATIONS.md` §D3.5, có sai khác nhỏ ở 2 dòng do làm tròn.
> Số trong tài liệu này là kết quả chạy lại bằng script.

### 3.2 🔴 Màu ngành trong code **không khớp** màu ngành chính thức của TNTT

`globals.css:32-37`:

```css
--sector-chien-con: #e8b86d;   /* vàng đất */
--sector-au-nhi:    #f0a179;   /* cam đào */
--sector-thieu-nhi: #74b7a5;   /* xanh ngọc */
--sector-nghia-si:  #789ed1;   /* xanh lam nhạt */
--sector-hiep-si:   #a78ac6;   /* tím */
```

Đối chiếu Nội quy TNTT Việt Nam (Chương V, Điều 63):

| Ngành | Màu khăn chính thức | Màu trong code | Khớp? |
|---|---|---|:--:|
| Chiên Con | **Hồng** | vàng đất `#E8B86D` | ❌ |
| Ấu Nhi | **Xanh lá mạ** | cam đào `#F0A179` | ❌ |
| Thiếu Nhi | **Xanh dương** | xanh ngọc `#74B7A5` | ❌ |
| Nghĩa Sĩ | **Vàng nghệ** | xanh lam `#789ED1` | ❌ |
| Hiệp Sĩ | **Nâu đất** | tím `#A78AC6` | ❌ |
| Dự Trưởng / Huynh Trưởng | **Đỏ (phụ vàng)** | *không có token* | ❌ |

**5/5 sai, và thiếu hẳn ngành thứ 6.** Bộ màu hiện tại là một dải pastel hài hoà thẩm mỹ nhưng **không mang ý nghĩa TNTT nào**.

**Giảm nhẹ:** grep toàn `src/` cho thấy **5 biến này chưa được component nào sử dụng**. Chúng là token chết.
Nghĩa là sửa chúng **không gây hồi quy**, và đây là thời điểm đúng để làm lại từ đầu.

Chi tiết bảng màu đề xuất: `03_BRANCH_COLOR_RESEARCH.md`.

### 3.3 Token còn thiếu

| Nhóm | Hiện có | Thiếu |
|---|---|---|
| Màu | 24 biến | `info`, `border-strong` (viền ô nhập ≥3:1), `overlay`, token ngành đầy đủ (13 token × 6 ngành) |
| Typography | chỉ `--font-sans` | thang cỡ chữ, line-height, weight, tabular-nums |
| Spacing | không có | dùng thang mặc định Tailwind rải rác |
| Radius | 3 mức trong `tailwind.config.ts:59-63` | không có biến CSS ⇒ không đổi theo theme được |
| Shadow | dùng `shadow-sm`/`shadow-lg`/`shadow-xl` mặc định | không có token |
| Z-index | **hardcode** `z-20`, `z-30`, `z-40`, `z-50` rải rác | không có thang |
| Motion | không có | không có duration/easing chuẩn |
| Breakpoint | mặc định Tailwind | không khai báo chủ đích |
| Focus | 1 quy tắc `:focus-visible` toàn cục (`globals.css:63-66`) ✅ | — |

**Z-index đang là rủi ro thật:** header `z-20` (`app-header.tsx:9`), sidebar `z-30` (`app-sidebar.tsx:22`),
bottom nav `z-30` (`mobile-bottom-navigation.tsx:7`), drawer `z-40` (`app-shell.tsx:23`), dropdown user menu `z-50`
(`user-menu.tsx:15`). Bốn tầng, không tài liệu, và sidebar cùng bottom-nav **trùng z-30**.

---

## 4. Kiểm kê component — 47 hạng mục được yêu cầu audit

Ký hiệu: ✅ có và dùng tốt · ⚠️ có nhưng lệch/không dùng · ❌ **không tồn tại**, mỗi trang tự viết

| # | Thành phần | Trạng thái | Bằng chứng / ghi chú |
|---|---|:--:|---|
| 1 | App shell | ⚠️ | `app-shell.tsx` — chạy được, nhưng drawer không phải dialog thật (§6.2) |
| 2 | Sidebar | ⚠️ | `app-sidebar.tsx` — **còn chữ tạm "Bản nền giao diện · P0-T3"** ở `:72-75`, hiện cho **mọi** người dùng kể cả Cha sở và phụ huynh |
| 3 | Header | ⚠️ | `app-header.tsx` — `<h1>` trùng nguyên văn với `<h2>` của `PageHeader` |
| 4 | Navigation | ⚠️ | `config/navigation.ts` — chỉ hỗ trợ **đường dẫn tĩnh** ⇒ mọi trang có tham số động có nguy cơ mồ côi (M13 đã bị) |
| 5 | Breadcrumb | ❌ | `app-header.tsx:15` in chuỗi tĩnh `Hệ thống / {title}`, **không phải link**, `hidden sm:block` nên mất trên mobile |
| 6 | Dashboard | ⚠️ | `dashboard-overview.tsx` — một bố cục dùng chung cho cả nhân sự lẫn phụ huynh |
| 7 | Danh sách | ⚠️ | dạng card, nhất quán và đúng cho 360px — **giữ**; nhưng không có tìm kiếm/lọc/phân trang (SW-07) |
| 8 | Bảng dữ liệu | ⚠️ | chỉ 4 chỗ dùng `<table>`, đều bọc `overflow-x-auto` ✅; **không có `<caption>`**, cột đầu không `sticky` |
| 9 | Form | ⚠️ | 2 kiểu song song: `react-hook-form` (2 form auth) vs `<form action>` thuần (toàn bộ phần còn lại) |
| 10 | Trang chi tiết | ⚠️ | có, nhưng đường quay lại là link chữ nhỏ **~20px**, dưới ngưỡng 44px |
| 11 | Tabs | ❌ | `students/[studentId]` tự dựng bằng `<Link>` trong `<nav>`; không `role="tablist"` |
| 12 | Modal / Dialog | ❌ | **không tồn tại**. Thay bằng **7 lần `window.confirm()`** |
| 13 | Drawer | ⚠️ | chỉ có drawer menu mobile, thiếu 5 yêu cầu a11y (§6.2) |
| 14 | Dropdown | ⚠️ | `user-menu.tsx` dùng `<details>` — chạy không cần JS ✅ nhưng không đóng bằng `Escape`, không đóng khi bấm ra ngoài |
| 15 | Select | ❌ | **52 thẻ `<select>` native** trải trên 17 file; chuỗi class `selectClassName` bị **chép lại y hệt ở 10 file** |
| 16 | Combobox | ❌ | không có ⇒ chọn người giám hộ trong ~900 hồ sơ là một `<select>` phẳng |
| 17 | Date picker | ❌ | `<input type="date">` native |
| 18 | Time picker | ❌ | không có |
| 19 | Calendar | ❌ | không có |
| 20 | Notification (trang) | ✅ | `notification-center.tsx` |
| 21 | Toast | ❌ | không có |
| 22 | Alert / Banner | ❌ | không có; mỗi trang tự dựng `<Card>` màu |
| 23 | Confirm dialog | ❌ | `window.confirm` × 7 — không style được, không dịch được nút, chặn luồng, **trên iOS hiện tên miền** |
| 24 | Loading | ⚠️ | `LoadingState` có `role="status"` ✅ nhưng chỉ dùng ở 2 file `loading.tsx` |
| 25 | Skeleton | ⚠️ | nhúng cứng bên trong `LoadingState`, không tái sử dụng được |
| 26 | Progress | ❌ | không có (cần cho nhập Excel) |
| 27 | **Empty state** | ⚠️ | `EmptyState` **tồn tại, đúng chuẩn, và có 0 nơi dùng**. 13 module tự viết `<p>` theo 3 kiểu khác nhau (SW-13) |
| 28 | Error state | ⚠️ | `ErrorState` dùng ở 2 chỗ; không hiện `digest` để người dùng đọc cho quản trị viên |
| 29 | Pagination | ❌ | không có ở bất kỳ đâu |
| 30 | Search | ❌ | không có ở bất kỳ đâu |
| 31 | Filter | ⚠️ | vài trang tự dựng `<select>` lọc, không có mẫu chung |
| 32 | File upload | ⚠️ | `<input type="file">` trần ở `/imports`, không hiện giới hạn dung lượng/định dạng |
| 33 | Avatar | ❌ | `user-menu.tsx:11` dùng icon `UserRound` trong vòng tròn |
| 34 | Badge | ✅ | `badge.tsx` — 6 variant; **2 variant trượt tương phản** |
| 35 | Tooltip | ❌ | không có |
| 36 | Charts | ❌ | **không có thư viện biểu đồ nào**. `docs/06` §7 yêu cầu 2 biểu đồ chuyên cần — chưa tồn tại |
| 37 | Mobile navigation | ⚠️ | có; nhãn `text-[11px]` (dưới ngưỡng 13px của `docs/06` §3); 12 role staff dùng chung 1 preset |
| 38 | Permission-denied | ⚠️ | `permission-denied.tsx` — dòng chữ chính **2,28:1**, không nói người dùng đang ở vai trò nào |
| 39 | Button | ✅ | `button.tsx` — 5 variant, **mọi size ≥44px có chủ ý** (không được đổi) |
| 40 | Input | ✅ | `input.tsx` — `h-11`, `md:text-sm` |
| 41 | Label | ✅ | `label.tsx` |
| 42 | Card | ⚠️ | `CardTitle` **hardcode `<h2>`** ⇒ card lồng trong section `h2` tạo cấu trúc heading phẳng sai |
| 43 | FormMessage | ✅ | tự đặt `role="alert"`/`role="status"` theo `tone` — **thiết kế gọn, giữ nguyên** |
| 44 | Textarea | ❌ | `<textarea>` trần, class chép tay |
| 45 | Checkbox / Radio | ❌ | native, vùng bấm đo theo `<label>` bao quanh (đúng, không được "sửa") |
| 46 | Switch | ❌ | không có |
| 47 | Sector selector | ❌ | không có — **sẽ cần** nếu chọn theme theo ngữ cảnh ngành (xem `04_THEME_ARCHITECTURE_OPTIONS.md`) |

### Tổng kết kiểm kê

| | Số lượng |
|---|--:|
| ✅ Có và tốt | **7** |
| ⚠️ Có nhưng lệch, hoặc không được dùng | **19** |
| ❌ Không tồn tại — mỗi trang tự viết | **21** |

---

## 5. Component **bị lặp** — ứng viên đưa vào design system

| Thứ bị lặp | Số nơi | Bằng chứng |
|---|--:|---|
| `const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm"` | **10 file** | `attendance/page.tsx:19`, `classes/[classId]:13`, `staff/page.tsx:15`, `students/page.tsx:13`, `students/[studentId]:18`, `absence-request-panel:25`, `gradebook-editor:43`, và 3 file khác |
| Đoạn văn "chưa có dữ liệu" viết tay | **9 trang**, 3 kiểu khác nhau | `students/page.tsx:36` · `classes/[classId]:43,76` · `results/page.tsx:23` · `teaching-plan/page.tsx:16` · `imports/page.tsx:139` · `admin/page.tsx:41` · `student/attendance/page.tsx:19` · `dashboard-overview.tsx:57` |
| Link "← Danh sách …" ở `PageHeader.action` | **7 trang** | `classes/[classId]:29`, `attendance/[sessionId]:33`, `results/[classId]:17`, `teaching-plan/[classId]:27`, `committees/[committeeId]:34`, `students/[studentId]:80`, `imports/[batchId]` |
| `window.confirm(...)` | **7 lần** | `gradebook-editor:169,312,427,488`, `account-admin-panel:98`, `teaching-plan-editor:170,212` |
| Bảng bọc `overflow-x-auto` + `min-w-[…]` | 4 nơi, 4 giá trị `min-w` khác nhau | `gradebook-editor:254,544`, `published-results-portal:25`, `report-workbench:177` |

---

## 6. Vấn đề accessibility ở tầng vỏ ứng dụng

### 6.1 Làm tốt — **không được phá**

| Hạng mục | Bằng chứng |
|---|---|
| Vùng chạm ≥44px ở **mọi** control chính | `button.tsx:20-24` (`sm` là nút *hẹp ngang*, không phải nút thấp — có chủ ý, `WORKLOG` dòng 77–79) |
| `aria-label` **kèm tên em** trên từng ô điểm danh/điểm số | `attendance-editor.tsx:224,246,270,311,333`; `gradebook-editor.tsx:265,273` — điểm rất mạnh |
| `aria-current="page"` ở sidebar và bottom nav | `app-sidebar.tsx:54`, `mobile-bottom-navigation.tsx:14` |
| Mọi icon trang trí có `aria-hidden="true"`; icon-only button có `aria-label` | toàn bộ |
| `:focus-visible` toàn cục 2px + offset | `globals.css:63-66` |
| `maximumScale: 5` — **không chặn zoom** | `layout.tsx:29` |
| `html/body { min-width: 360px }` + `overflow-x-hidden` ở gốc shell | `globals.css:46,50`, `app-shell.tsx:20` |
| E2E quét 13 route × 3 viewport khẳng định không tràn ngang | `tests/e2e/responsive.spec.ts:112-138` |

### 6.2 Drawer mobile không phải dialog — **vấn đề a11y lớn nhất của vỏ**

`app-shell.tsx:22-29` thiếu **năm** thứ mà `docs/06` §16 ("Modal trap focus") đòi hỏi:

1. Không `role="dialog"` / `aria-modal="true"`
2. Focus **không** chuyển vào drawer khi mở — vẫn ở nút hamburger, nay nằm sau lớp phủ
3. Không focus trap — `Tab` chạy hết drawer rồi ra thẳng nội dung phía sau
4. Không đóng bằng `Escape`
5. Không khoá cuộn `body`

Thêm nữa lớp phủ là một `<button>` phủ toàn màn hình (`:24`) ⇒ với trình đọc màn hình đó là một nút khổng lồ chen giữa
hamburger và nội dung.

### 6.3 Thứ bậc tiêu đề sai

Trên `/students`:

| Cấp | Nội dung | Nguồn |
|---|---|---|
| `h1` | "Thiếu nhi" | `app-header.tsx:16` |
| `h2` | "Thiếu nhi" — **trùng nguyên văn** | `page-header.tsx:5` |
| `h2` | "Danh sách thiếu nhi" — đáng lẽ `h3` | `card.tsx:18` (hardcode `<h2>`) |

Và **không có skip link** — người dùng bàn phím phải `Tab` qua tối đa 15 mục sidebar trước khi tới nội dung.

### 6.4 Cỡ chữ dưới ngưỡng

`docs/06` §3 tự đặt ra: *"Không dùng chữ quá nhỏ dưới 13px."*

| Chỗ | Cỡ | Bằng chứng |
|---|--:|---|
| Nhãn bottom nav | **11px** | `mobile-bottom-navigation.tsx:14` |
| Số badge chưa đọc | **10px** | `notification-button.tsx:17` |
| `text-xs` (12px) | 12px | `app-header.tsx:15`, `app-sidebar.tsx:28,44,72`, `user-menu.tsx:18`, và rải rác |

Nhóm dùng nhiều nhất là **phụ huynh lớn tuổi trên điện thoại**. Đây là rào cản thật, không phải chuyện thẩm mỹ.

### 6.5 `aria-live` gần như vắng mặt

Chỉ `LoadingState` có (`loading-state.tsx:5`). `docs/06` §16 yêu cầu `aria-live` cho **lưu/lỗi** — badge chưa đọc,
kết quả lưu điểm danh, kết quả lưu bảng điểm **đều không có**.

---

## 7. Bốn thứ đang hiện sai trên production

| # | Vấn đề | Ai nhìn thấy | Bằng chứng |
|---|---|---|---|
| 1 | Chân sidebar: *"Bản nền giao diện — Phân quyền route hoàn thiện ở P0-T3"* | **Mọi người dùng**, mọi vai trò, cả desktop lẫn drawer mobile | `app-sidebar.tsx:72-75` |
| 2 | Bộ chọn năm học ghi cứng *"Năm học 2026–2027"*, `disabled`, `aria-label` chứa chữ *"dữ liệu mẫu"*, và có mũi tên xổ xuống gợi ý mở được | Mọi người dùng ≥640px; **ẩn hoàn toàn dưới 640px** ⇒ GLV dùng điện thoại không bao giờ thấy năm học | `academic-year-switcher.tsx:5-9` |
| 3 | `/account` là placeholder ghi *"sẽ được triển khai ở Phase 1"* — dự án đang ở Phase 7 | Là **tab thứ 5 của cả ba preset mobile** và mục duy nhất trong `UserMenu` ⇒ ai cũng chạm vào | `account/page.tsx:4` |
| 4 | **Không có nút Đăng xuất** trong toàn bộ giao diện | Mọi người dùng; nghiêm trọng vì máy phòng học là **máy dùng chung** | M01-F11, `04_TO_BE_FLOWS.md` F07 |

---

## 8. Đánh giá theo tiêu chí "cute trang nhã" mà chủ dự án nêu

| Tiêu chí | Hiện trạng | Khoảng cách |
|---|---|---|
| Góc bo mềm | `lg` = 12px, `md` = 8px, `sm` = 6px | Hơi nhỏ so với "mềm"; thẻ lớn nên 16px |
| Khoảng trắng thoáng | `CardHeader/Content` padding 20px | Ổn, nhưng danh sách khá dày |
| Icon thân thiện | lucide (nét mảnh, trung tính) | Đúng "hiện đại", chưa "ấm" |
| Empty state gần gũi | **0 nơi dùng `EmptyState`** | Khoảng cách lớn nhất |
| Hình khối mềm | trang đăng nhập có 2 khối tròn mờ (`(auth)/layout.tsx:7-8`) — đúng tinh thần | Chỉ có ở màn đăng nhập, không lan sang trong app |
| Typography dễ đọc | **Font không tải**; có chữ 10–11px | Khoảng cách lớn |
| Chuyển động nhẹ, có mục đích | Gần như không có | Thiếu, nhưng **không cấp bách** |
| Feedback rõ ràng | 🔴 **9/14 module không phản hồi gì khi ghi** (SW-01) | Đây là **vấn đề nghiệp vụ**, đã có D-61 |
| Không lạm dụng gradient/bóng/hoạt ảnh | Đang rất tiết chế ✅ | **Giữ nguyên tinh thần này** |

**Nhận định:** hệ thống hiện **không bị "quá đà"** — nó bị **"chưa tới"**. Hướng xử lý là *bổ sung và chuẩn hoá*,
không phải *cắt bớt*. Đây là tin tốt cho Giai đoạn 2.

---

## 9. Danh sách "KHÔNG ĐƯỢC ĐỤNG" khi redesign

> Những thứ **trông như lỗi nhưng là quyết định đã trả giá**. Nguồn: `M14/06` §0 + `04_SYSTEM_WIDE_FINDINGS.md` §16 điểm mạnh.

| Thứ trông như lỗi | Vì sao giữ |
|---|---|
| `Button size="sm"` cao **44px** chứ không phải 36px | `sm` là nút *hẹp ngang*. Người dùng chính bấm bằng ngón tay trên máy 360px. `responsive.spec.ts` sẽ đỏ ngay |
| Ô tick điểm danh nhỏ 16–20px | Vùng bấm đo theo `<label>` bao quanh, đã `min-h-11`. Phóng to ô tick là **hiểu sai vấn đề** |
| Service worker **không** cache HTML | Máy phòng học dùng chung — một trang roster trong cache là rò hồ sơ thiếu nhi |
| Danh sách dùng **card thay vì bảng** | Đã cân nhắc cho 360px; đổi sang bảng là bước lùi |
| `/parent/children/[id]` trả **404** thay vì "không có quyền" | Không lộ sự tồn tại của hồ sơ em |
| `/teaching-plan`, `/results`, `/parent` **không** giới hạn `roles` | Cố ý (D-25): một GLV vẫn có thể là phụ huynh |
| `FormMessage` tự đặt `role` theo `tone` | Thiết kế gọn và đúng — mở rộng, không thay |
| Form dùng `<form action={serverAction}>` không cần JS | Lựa chọn kiến trúc nhất quán: máy yếu, mạng phòng học kém |
| Mặc định "Có mặt", chỉ sửa ngoại lệ ở điểm danh | Là lý do luồng này nhanh |
| Không hiển thị mã thiếu nhi ở danh sách | Quy tắc chốt (`AGENTS.md` §8) |

---

## 10. Ba nhóm việc rút ra

| Nhóm | Nội dung | Đưa vào |
|---|---|---|
| **A — Nền tảng** | Tải font · viết lại bộ token (màu đạt AA, typography, spacing, radius, shadow, z-index, motion) · engine theme ngành | `05_GLOBAL_COMPONENT_SYSTEM.md` §1–2 |
| **B — Bổ sung 21 component còn thiếu** | Dialog, Select, Combobox, Tabs, Table, Pagination, SearchInput, FilterBar, Toast, Alert, Skeleton, Progress, Tooltip, Avatar, Switch, Textarea, DatePicker, FileUpload, Breadcrumb, SectorSwitcher, Chart | `05_GLOBAL_COMPONENT_SYSTEM.md` §3 |
| **C — Áp dụng theo module** | 14 module, theo thứ tự phụ thuộc của `01_SYSTEM_MODULE_MAP.md` §5 | `06_MODULE_UI_REDESIGN_PLAN.md` |
