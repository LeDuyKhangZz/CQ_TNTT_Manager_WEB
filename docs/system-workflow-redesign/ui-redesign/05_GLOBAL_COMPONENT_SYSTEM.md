# 05 — Hệ thống component và design token dùng chung

> Thông số dưới đây theo **hướng thiết kế A "Sân Giáo Xứ"** (`02_DESIGN_DIRECTIONS.md`).
> Nếu chủ dự án chọn hướng khác, phần token ở §2 đổi giá trị; **cấu trúc ở §3–§5 giữ nguyên**.
>
> Nguyên tắc xuyên suốt: **một component, nhận semantic token.** Không bản sao theo ngành. Không màu hardcode.

---

## 1. Kiến trúc token ba tầng

```
Tầng 1 — PRIMITIVE            Tầng 2 — SEMANTIC              Tầng 3 — COMPONENT
(giá trị thô, không dùng     (ý nghĩa, dùng trong           (chỉ khi component cần
 trực tiếp trong component)    component)                     điều gì đặc thù)

--red-600: #B3261E      →   --danger: var(--red-600)    →   --btn-danger-bg: var(--danger)
--sector-au-nhi-500     →   --theme-primary  (BƠM ĐỘNG) →   --btn-primary-bg: var(--theme-primary)
--space-5: 20px         →   --card-padding              →   —
```

| Tầng | Nơi định nghĩa | Đổi theo ngành? |
|---|---|:--:|
| Primitive | `src/app/globals.css` — `:root` | ❌ |
| Semantic trung tính | `src/app/globals.css` — `:root` | ❌ |
| **Semantic theme** (`--theme-*`) | **Bơm inline** bởi `ThemeScope` | ✅ |
| Component | trong file component, chỉ khi cần | ❌ |

**Quy tắc bất di dịch:** component **chỉ đọc tầng 2 và 3**. Đọc thẳng tầng 1 trong component là lỗi review.

---

## 2. Bộ token đầy đủ

### 2.1 Màu trung tính và trạng thái — **không đổi theo ngành**

```css
:root {
  /* Nền */
  --bg-page:            #FFFBF7;   /* kem ấm */
  --bg-surface:         #FFFFFF;   /* thẻ */
  --bg-surface-muted:   #FBF5EF;   /* header bảng, hàng chẵn, ô nhập vô hiệu */
  --bg-overlay:         rgb(46 42 39 / 0.45);  /* lớp phủ dialog/drawer */

  /* Chữ */
  --text:               #2E2A27;   /* 13,81:1 trên nền trang */
  --text-muted:         #5C534D;   /* 7,28:1 */
  --text-on-dark:       #FFFFFF;

  /* Viền */
  --border:             #EDE4DC;   /* đường phân cách trang trí */
  --border-strong:      #8C7F76;   /* viền ô nhập — 3,77:1, bắt buộc WCAG 1.4.11 */

  /* Trạng thái — KHÔNG BAO GIỜ lấy từ token ngành */
  --success:            #1E7A50;   --success-subtle: #E8F6EF;
  --warning:            #8A5A00;   --warning-subtle: #FFF4DC;
  --danger:             #B3261E;   --danger-subtle:  #FDECEA;
  --info:               #1F5E9E;   --info-subtle:    #E8F1FA;
}
```

> Toàn bộ 16 cặp đã đo, **đều đạt AA**. Chi tiết: `03_BRANCH_COLOR_RESEARCH.md` §7.

### 2.2 Token theme — **bơm động bởi `ThemeScope`**

```css
/* Giá trị mặc định (HUYNH_TRUONG) đặt ở :root làm dự phòng.
   ThemeScope ghi đè bằng inline style theo ngành. */
:root {
  --theme-primary:        #CE4846;
  --theme-primary-hover:  #BE3939;
  --theme-primary-active: #B12B2D;
  --theme-on-primary:     #FFFFFF;   /* NGHĨA SĨ dùng #2E2A27 — xem 03 §8 */
  --theme-accent-text:    #C5403E;   /* dùng trên nền trắng hoặc --theme-tint */
  --theme-accent-strong:  #B02A2D;   /* dùng khi cần chữ MÀU trên nền --theme-pastel */
  --theme-border:         #BC847F;
  --theme-ring:           #EF6661;
  --theme-chart:          #F26963;

  /* 🍬 Bốn bậc nền — pastel làm giao diện "cute", chữ đậm giữ chuẩn đọc */
  --theme-tint:           #FFEFEE;   /* 0.965 — hàng được chọn, chip nhạt */
  --theme-soft:           #FFDDDA;   /* 0.925 — nền thẻ lớp */
  --theme-pastel:         #FFCAC5;   /* 0.885 — chip cute, avatar, minh hoạ */
  --theme-pastel-deep:    #FFB7B0;   /* 0.845 — viền thẻ, nét minh hoạ */
  --theme-selected-bg:    var(--theme-tint);
}
```

**Quy tắc chữ trên nền màu — bắt buộc, đã đo:**

| Nền | Chữ | Đo được |
|---|---|--:|
| `--theme-primary` | `--theme-on-primary` | 4,50–4,56:1 ✅ |
| `--theme-tint` | `--theme-accent-text` | 4,50–4,55:1 ✅ |
| **`--theme-pastel`** | **`--text` `#2E2A27`** ⭐ | **8,51–10,32:1** ✅ |
| `--theme-pastel` | `--theme-accent-strong` | 4,51–4,55:1 ✅ |
| `--theme-pastel` | ~~`--theme-accent-text`~~ | 3,47–3,59:1 🔴 **CẤM** |
| `--theme-pastel` | ~~chữ trắng~~ | 1,38–1,46:1 🔴 **CẤM** |

**Mười hai nơi được dùng `--theme-*`** — 8 điểm nhấn ở `04_THEME_ARCHITECTURE_OPTIONS.md` §1
+ 4 điểm pastel ở `03_BRANCH_COLOR_RESEARCH.md` §4.2b. Dùng ở chỗ thứ mười ba là lỗi review.

> ⚠️ **Pastel không bao giờ là nền nút, nền trang, hay nền vùng có chữ trắng.**
> Pastel là **mảng màu mềm trên thẻ**. Nền trang luôn trung tính `#FFFBF7`.

### 2.3 Typography

```css
:root {
  --font-sans: var(--font-be-vietnam-pro), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  --text-2xs:  12px;  /* NGƯỠNG SÀN — không có gì nhỏ hơn */
  --text-xs:   13px;
  --text-sm:   14px;
  --text-base: 16px;  /* body */
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;   /* KHÔNG dùng 700 ở hướng A */
}
```

🔴 **Bắt buộc — hai việc:**

1. **Tải font thật.** Hiện `--font-sans` khai "Be Vietnam Pro" nhưng **không có `next/font`, không `<link>`,
   không `@font-face`** (`01_CURRENT_UI_AUDIT.md` §2). Sửa ở `src/app/layout.tsx`:

   ```tsx
   import { Be_Vietnam_Pro } from "next/font/google";
   const beVietnamPro = Be_Vietnam_Pro({
     subsets: ["vietnamese", "latin"],
     weight: ["400", "500", "600"],
     variable: "--font-be-vietnam-pro",
     display: "swap",
   });
   // <html lang="vi" className={beVietnamPro.variable}>
   ```

2. **Xoá mọi cỡ chữ dưới 12px.** Hiện có `text-[11px]` (bottom nav) và `text-[10px]` (badge chưa đọc).
   `docs/06` §3 tự đặt sàn 13px; đề xuất **sàn cứng 12px** cho nhãn phụ và **13px** cho mọi thứ đọc thành câu.
   Lint rule chặn `text-[Npx]` với N < 12.

### 2.4 Spacing · Radius · Shadow · Z-index · Motion

```css
:root {
  /* Spacing — thang 4px */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;  --space-10: 40px;

  /* Radius */
  --radius-sm:  8px;    /* chip, badge nhỏ */
  --radius-md:  12px;   /* nút, ô nhập */
  --radius-lg:  16px;   /* thẻ */
  --radius-xl:  20px;   /* dialog, thẻ lớn */
  --radius-full: 9999px;

  /* Shadow — CHỈ HAI MỨC */
  --shadow-sm: 0 1px 2px rgb(46 42 39 / 0.05);
  --shadow-md: 0 8px 24px rgb(46 42 39 / 0.12);

  /* Z-index — thang tường minh, thay 4 giá trị hardcode hiện tại */
  --z-base:        0;
  --z-sticky:     10;   /* thanh hành động dính, header bảng */
  --z-header:     20;
  --z-sidebar:    30;
  --z-bottom-nav: 30;
  --z-overlay:    40;   /* lớp phủ drawer/dialog */
  --z-drawer:     50;
  --z-dialog:     60;
  --z-dropdown:   70;
  --z-toast:      80;

  /* Motion */
  --duration-fast:   100ms;   /* nhấn nút */
  --duration-base:   150ms;   /* hiện/ẩn */
  --duration-slow:   200ms;   /* trượt drawer, chuyển theme */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}
```

**Z-index hiện đang là rủi ro thật:** sidebar `z-30` và bottom-nav `z-30` **trùng nhau**
(`app-sidebar.tsx:22`, `mobile-bottom-navigation.tsx:7`). Thang trên giải quyết.

### 2.5 Breakpoint

| Tên | Giá trị | Ý nghĩa trong dự án này |
|---|--:|---|
| (mặc định) | 0–639 | **Điện thoại GLV/phụ huynh — ưu tiên số 1.** Thiết kế bắt đầu từ 360px |
| `sm` | 640 | Điện thoại ngang, máy tính bảng nhỏ |
| `md` | 768 | Máy tính bảng |
| `lg` | 1024 | **Ngưỡng hiện sidebar** — laptop Thư ký |
| `xl` | 1280 | Laptop lớn |

**Ba viewport kiểm thử bắt buộc** (đã có trong `responsive.spec.ts`): 360 · 768 · 1366.

### 2.6 Focus

```css
:focus-visible {
  outline: 2px solid var(--theme-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Quy tắc hiện tại (`globals.css:63-66`) **đã đúng** — chỉ đổi từ `var(--ring)` sang `var(--theme-ring)`
để focus ring theo màu ngữ cảnh. Mọi biến thể `--theme-ring` đều ≥3:1 trên nền trang (đã đo).

---

## 3. Component: giữ · sửa · làm mới

### 3.1 GIỮ NGUYÊN cấu trúc, chỉ đổi token (7)

| Component | Việc cần làm |
|---|---|
| `Button` | Đổi sang `--theme-primary` / `--theme-on-primary`. **Giữ nguyên `min-h-11` ở mọi size** (quyết định có chủ ý). `danger` giữ `--danger` hệ thống, **không** dùng theme |
| `Input` | Viền đổi sang `--border-strong` (hiện `--border` chỉ 1,2:1) |
| `Label` | Giữ nguyên |
| `FormMessage` | Giữ cơ chế `role` theo `tone` — **thiết kế tốt**. Thêm `tone="info"` và icon |
| `Badge` | Sửa `success`/`warning`/`danger` sang token mới (3 variant đang trượt AA). **Thêm icon** cho từng tone |
| `Card` | 🔴 `CardTitle` phải nhận prop `as` (mặc định `h3`), hiện hardcode `<h2>` |
| `LoadingState` | Tách phần `Skeleton` ra thành component riêng dùng lại được |

### 3.2 SỬA LỖI a11y / cấu trúc (5)

| Component | Vấn đề | Việc cần làm |
|---|---|---|
| `AppShell` drawer | Thiếu 5 yêu cầu dialog | `role="dialog"` + `aria-modal` · focus vào drawer khi mở · focus trap · `Escape` đóng và trả focus · khoá cuộn body · lớp phủ đổi từ `<button>` sang `<div>` + `aria-hidden` |
| `AppHeader` | `<h1>` trùng nguyên văn `<h2>` của `PageHeader` | Header đổi sang `<p>`; `PageHeader` giữ `h1`. Thêm **breadcrumb thật 3 cấp**, hiện cả trên mobile |
| `AppSidebar` | Còn chữ tạm "P0-T3" | Thay bằng khối tài khoản + **nút Đăng xuất**. Mục đang chọn: nền `--theme-subtle` + **thanh dọc 3px** + chữ `--theme-accent-text` (ba tín hiệu) |
| `UserMenu` | `<details>` không đóng bằng `Escape`/click ngoài | Nâng lên `Dropdown` mới (§3.3), **giữ khả năng chạy không cần JS** |
| `PermissionDenied` | Chữ chính 2,28:1 | Token mới + **hiện vai trò hiện tại**: *"Bạn đang đăng nhập với vai trò **Thủ quỹ**."* |
| `EmptyState` | Đúng chuẩn nhưng **0 nơi dùng** | Thêm `variant`: `no-data` / `out-of-scope` / `not-linked` (ba loại của SW-03) + chỗ đặt hành động + minh hoạ |

### 3.3 LÀM MỚI — 21 component

Xếp theo thứ tự triển khai (số module hưởng lợi giảm dần).

| # | Component | Vì sao cần | Module hưởng lợi |
|---|---|---|--:|
| 1 | **`Select`** | **52 thẻ `<select>` native**, chuỗi class chép ở **10 file** | 17 file |
| 2 | **`Dialog`** | Thay **7 lần `window.confirm`**; SW-06 cần xác nhận ở 8 module | 8 |
| 3 | **`ConfirmDialog`** | Bọc `Dialog`, bắt buộc nêu **hậu quả bằng tên riêng** (tên em, tên lớp, số người nhận) | 8 |
| 4 | **`Skeleton`** | Tách khỏi `LoadingState` | 14 |
| 5 | **`Alert`** | Banner trong trang (cảnh báo năm học, đang xem lịch sử, chưa phân công) | 14 |
| 6 | **`Textarea`** | Class chép tay khắp nơi | 8 |
| 7 | **`SearchInput`** | SW-07 — **không có tìm kiếm ở bất kỳ đâu** | 5 |
| 8 | **`Pagination`** | SW-07 — **không có phân trang ở bất kỳ đâu**; `/students` ~900 em | 5 |
| 9 | **`FilterBar`** | Mẫu chung cho lọc; hiện mỗi trang tự dựng | 6 |
| 10 | **`DataTable`** | 4 bảng, 4 giá trị `min-w` khác nhau, **không `<caption>`**, cột đầu không sticky | 4 |
| 11 | **`Tabs`** | `students/[studentId]` tự dựng, không `role="tablist"` | 3 |
| 12 | **`Breadcrumb`** | Không có breadcrumb thật; header in chuỗi tĩnh | toàn hệ thống |
| 13 | **`BranchChip`** | Chấm màu **+ tên ngành** — bắt buộc theo `03` §5.1 | 8 |
| 14 | **`Dropdown`** | Menu người dùng, menu thao tác trên hàng | 5 |
| 15 | **`Toast`** | Phản hồi cho form dài theo D-61 | 9 |
| 16 | **`Tooltip`** | Giải thích cách tính trung bình, hệ số, trạng thái | 4 |
| 17 | **`Avatar`** | Chữ cái đầu + màu ngành; cần cho bộ chọn con | 4 |
| 18 | **`Progress`** | Nhập Excel; không có gì hiện tiến độ | 1 |
| 19 | **`FileUpload`** | `<input type="file">` trần, không hiện giới hạn | 1 |
| 20 | **`SegmentedControl`** | M05 U-10: thay 2 `<select>` × 50 em | 2 |
| 21 | **`Chart`** | 🔴 **Không có thư viện biểu đồ nào**; `docs/06` §7 yêu cầu 2 biểu đồ | 2 |

**Về `Chart` (#21):** dự án hiện **không có** thư viện biểu đồ. Cần chốt — xem `07_DECISIONS_REQUIRED.md` **Q-09**.
Đề xuất: **SVG tự vẽ** cho 2–3 loại biểu đồ đơn giản (đường, cột, vòng tiến độ) thay vì thêm một phụ thuộc nặng.
Lý do: chỉ cần 2 biểu đồ; thư viện biểu đồ thường 40–100KB và kéo theo mã chạy trên trình duyệt,
đi ngược quyết định kiến trúc *"hạn chế tối đa mã chạy trên trình duyệt"* cho máy yếu, mạng phòng học kém.

### 3.4 Component của theme (7) — xem `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` §6

`ThemeScope` · `BranchChip` · `ContextIndicator` · `ChildSwitcher` · `BranchContextSwitcher` ·
`AcademicYearSwitcher` (viết lại) · `UnassignedBanner` / `ArchivedYearBanner` (dùng `Alert`).

---

## 4. Ba loại trạng thái rỗng chuẩn (SW-03)

Đây là hạng mục **12/14 module** cần và hiện **0 module** làm đúng.

| Loại | Khi nào | Mẫu câu | Hành động gợi ý |
|---|---|---|---|
| `no-data` | Thật sự chưa có dữ liệu | *"Lớp **Ấu 1A** chưa có thiếu nhi nào ghi danh."* | "Ghi danh thiếu nhi" (nếu có quyền) |
| `out-of-scope` | Có dữ liệu nhưng ngoài phạm vi người dùng | *"Bạn không được xem danh sách của lớp này."* | "Về lớp của tôi" |
| `not-linked` | Tài khoản chưa được thiết lập xong | *"Tài khoản của bạn chưa được liên kết với hồ sơ thiếu nhi nào. Vui lòng liên hệ Giáo lý viên lớp."* | — |

**Quy tắc câu chữ:** luôn **nêu tên phạm vi cụ thể** (tên lớp, tên ngành) lấy từ `ThemeContext.branchName`
và `AuthContext`. Không viết *"Không có dữ liệu"* trống rỗng.

⚠️ **Ngoại lệ bắt buộc:** `out-of-scope` **không được áp cho hồ sơ thiếu nhi** — BR-25 cấm lộ sự tồn tại.
Ở đó vẫn trả 404 như hiện tại (điểm mạnh #6, không được phá).

---

## 5. Quy tắc dùng chung

### 5.1 Xác nhận thao tác (SW-06)

Bắt buộc `ConfirmDialog` khi thao tác **không hoàn tác được**, **ảnh hưởng người khác**, hoặc **đổi quyền**:

| Thao tác | Câu xác nhận phải nêu |
|---|---|
| Kết thúc ghi danh | tên em + tên lớp |
| Xoá lô nhập Excel | số dòng đã ghi + *"không hoàn tác được"* |
| Công bố thông báo | **số người nhận** |
| Đổi chức vụ trong Ban | *"thay đổi quyền ghi nội dung Ban"* |
| Báo hỏng/mất thiết bị | *"giảm vĩnh viễn tổng kho"* + số lượng |
| Khoá bảng điểm | tên lớp + *"không nhập điểm được nữa"* |
| Đổi người giám hộ | 🔴 tên phụ huynh cũ → mới + *"thay đổi ngay quyền xem của cả hai"* |
| Đóng năm học | danh sách hậu quả (xem `15` §4) |

### 5.2 Phản hồi thao tác ghi (D-61)

| Loại biểu mẫu | Cách | Component |
|---|---|---|
| Ngắn (1–3 ô) | Chuyển hướng + mã kết quả → dòng thông báo đầu trang | `Alert` |
| Dài (hồ sơ, điểm cả lớp, thông báo, Excel) | Giữ dữ liệu, lỗi tại chỗ | `FormMessage` + `Toast` |

Bắt buộc kèm: `role="alert"` cho lỗi, `role="status"` cho thành công, `aria-busy` khi đang gửi.
Thông báo phải đặt **cạnh nút vừa bấm** (M05 U-17: hiện lỗi ở đầu trang trong khi nút ở đáy trên roster 9000px).

### 5.3 Bảng dữ liệu

| Yêu cầu | Chi tiết |
|---|---|
| `<caption>` hoặc `aria-labelledby` | Bắt buộc — hiện 2 bảng thiếu |
| Cột đầu `sticky left-0` | Bảng điểm; file Excel xuất ra **đã làm đúng**, web thì chưa |
| Chỉ báo cuộn ngang | Bóng mờ mép phải + *"Vuốt ngang để xem thêm cột"* |
| `overflow-x-auto` bọc ngoài | Giữ — đang làm đúng ở cả 4 bảng |
| ≥20 dòng | Bắt buộc phân trang hoặc cuộn ảo |

### 5.4 Bị cấm

1. Màu hardcode trong component khi có token.
2. Bản sao component cho từng ngành.
3. `--theme-*` ở ngoài 8 điểm nhấn đã liệt kê.
4. Màu ngành làm màu trạng thái.
5. Màu là **tín hiệu duy nhất** cho ngành / trạng thái / vai trò.
6. Cỡ chữ < 12px.
7. Vùng chạm < 44px.
8. `window.confirm` / `window.alert`.
9. `<select>` native mới (dùng `Select`).
10. Chặn zoom trên mobile.
