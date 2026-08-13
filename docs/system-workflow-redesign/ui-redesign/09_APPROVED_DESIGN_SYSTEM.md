# 09 — DESIGN SYSTEM ĐÃ PHÊ DUYỆT

> **Ngày duyệt: 2026-07-23. Người duyệt: chủ dự án.**
> Đây là **nguồn sự thật** cho mọi việc tạo hình trong Giai đoạn 2B, cùng với
> `10_APPROVED_THEME_RULES.md`, `11_APPROVED_MODULE_PLAN.md` và tài liệu Giai đoạn 1.
>
> Tài liệu này **ghi đè** `docs/06-ui-ux-spec.md` §2 (design tokens) và §3 (typography).
> Mọi con số tương phản đã được đo bằng `scripts/palette.mjs` và `scripts/pastel.mjs`.

---

## 1. Quyết định gốc

| # | Quyết định | Mã |
|---|---|---|
| 1 | **Hướng thiết kế: A · "Sân Giáo Xứ"** — ấm, mềm, quen thuộc; tiến hoá từ giao diện hiện tại | Q-02 |
| 2 | **Bảng màu ngành: Phương án A (Truyền thống đậm) + tầng PASTEL** | Q-05 |
| 3 | **Nghĩa Sĩ dùng N-3** — nền sáng giữ đúng "vàng nghệ", chữ đậm; Hiệp Sĩ đẩy sang nâu sẫm | Q-06 |
| 4 | **Font: Be Vietnam Pro** qua `next/font/google` | Q-07 |
| 5 | **Cổng phụ huynh/thiếu nhi (M13) dùng thang chữ lớn hơn một bậc** | Q-08 |
| 6 | **Biểu đồ dùng thẳng màu ngành**, tự vẽ SVG, không thư viện | Q-09, Q-10 |

Kèm hai chi tiết vay mượn đã duyệt:
- **Dải màu ngành 4px** ngay dưới header (từ hướng B).
- **Thang chữ lớn hơn cho M13** (từ hướng C).

---

## 2. Typography

```tsx
// src/app/layout.tsx
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});
// <html lang="vi" className={beVietnamPro.variable}>
```

```css
--font-sans: var(--font-be-vietnam-pro), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

--text-2xs:  12px;   /* SÀN CỨNG — không có gì nhỏ hơn */
--text-xs:   13px;   /* sàn cho chữ đọc thành câu */
--text-sm:   14px;
--text-base: 16px;   /* body */
--text-lg:   18px;
--text-xl:   20px;
--text-2xl:  24px;
--text-3xl:  30px;

--leading-tight: 1.25;  --leading-normal: 1.5;  --leading-relaxed: 1.6;
--weight-normal: 400;   --weight-medium: 500;   --weight-semibold: 600;
```

**Không dùng weight 700.** Số liệu dùng `font-variant-numeric: tabular-nums`.

### Thang riêng cho M13 (cổng phụ huynh & thiếu nhi)

| | Chung | **M13** |
|---|--:|--:|
| Body | 16px | **17px** |
| Nhãn phụ | 13px | **14px** |
| Chiều cao nút | 44px | **48px** |
| Chiều cao ô nhập | 44px | **48px** |

Áp bằng một lớp bọc `data-density="comfortable"` ở layout của `/parent/*` và `/student/*`,
**không** tạo component riêng.

### Bắt buộc dọn dẹp

| Chỗ | Hiện tại | Sau |
|---|--:|--:|
| Nhãn bottom nav (`mobile-bottom-navigation.tsx:14`) | 11px | **12px**, cho xuống 2 dòng |
| Badge chưa đọc (`notification-button.tsx:17`) | 10px | **12px** |

Lint rule chặn `text-[Npx]` với N < 12.

---

## 3. Màu trung tính và trạng thái — **không đổi theo ngành**

```css
:root {
  --bg-page:          #FFFBF7;
  --bg-surface:       #FFFFFF;
  --bg-surface-muted: #FBF5EF;
  --bg-overlay:       rgb(46 42 39 / 0.45);

  --text:             #2E2A27;   /* 13,81:1 trên nền trang */
  --text-muted:       #5C534D;   /*  7,28:1 */
  --text-on-dark:     #FFFFFF;

  --border:           #EDE4DC;   /* đường phân cách trang trí */
  --border-strong:    #8C7F76;   /* viền ô nhập — 3,77:1, bắt buộc WCAG 1.4.11 */

  --success: #1E7A50;  --success-subtle: #E8F6EF;
  --warning: #8A5A00;  --warning-subtle: #FFF4DC;
  --danger:  #B3261E;  --danger-subtle:  #FDECEA;
  --info:    #1F5E9E;  --info-subtle:    #E8F1FA;
}
```

**Đã đo, 16/16 cặp đạt AA.** Năm cặp trượt của hệ cũ (chữ trắng/primary 2,42:1 · warning 2,28:1 ·
success 3,01:1 · chữ trắng/danger 3,73:1 · danger/subtle 3,37:1) được giải quyết triệt để.

**Màu trạng thái không bao giờ lấy từ token ngành.** Mỗi trạng thái phải có **icon riêng** (✓ / ⚠ / ✕ / ℹ).

---

## 4. Bảng màu ngành — **giá trị cuối, đã duyệt**

> Toàn bộ giá trị dưới đây là **đầu ra của `scripts/approved.mjs`** — chạy lại được, đã kiểm AA.
> Không sửa tay bất kỳ mã hex nào mà không chạy lại script.

### 4.1 Màu đặc (nút, chữ, viền, chuỗi biểu đồ)

| Token | Chiên Con | Ấu Nhi | Thiếu Nhi | **Nghĩa Sĩ** | **Hiệp Sĩ** | Huynh Trưởng |
|---|---|---|---|---|---|---|
| `primary` | `#C34C7C` | `#378630` | `#1079CD` | **`#C48401`** | **`#7A5136`** | `#CE4846` |
| `primary-hover` | `#B43E6F` | `#287821` | `#006CBA` | **`#D39223`** ↑ | `#6D452A` | `#BE3939` |
| `primary-active` | `#A63163` | `#196C12` | `#0060A8` | **`#E09F35`** ↑ | `#613A1F` | `#B02B2E` |
| **`on-primary`** | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | 🔴 **`#2E2A27`** | `#FFFFFF` | `#FFFFFF` |
| `accent-text` | `#BA4375` | `#308029` | `#0072C5` | `#986500` | `#97633E` | `#C5403E` |
| `accent-strong` | `#A52F63` | `#1D7016` | `#0061A9` | **`#815600`** | `#85522E` | `#B02A2D` |
| `border` | `#B98395` | `#789B73` | `#7196BC` | `#AC8D62` | `#A58E80` | `#BC847F` |
| `focus-ring` | `#E46998` | `#55A34D` | `#3996ED` | `#C58505` | `#B6896C` | `#EF6661` |
| `chart` | = `primary` | | | | | |

Tương phản đo được với `on-primary`:

| Ngành | primary | hover | active |
|---|--:|--:|--:|
| Chiên Con | 4,52 | 5,44 | 6,48 |
| Ấu Nhi | 4,55 | 5,53 | 6,57 |
| Thiếu Nhi | 4,53 | 5,45 | 6,48 |
| **Nghĩa Sĩ** | **4,50** | **5,35** | **6,22** |
| Hiệp Sĩ | 6,87 | 8,28 | 9,84 |
| Huynh Trưởng | 4,53 | 5,48 | 6,50 |

> ### 🔴 Hai ngoại lệ bắt buộc nhớ khi cài đặt
>
> **1. `Nghĩa Sĩ.on-primary = #2E2A27`** (chữ đậm, không phải trắng) — Q-06/N-3.
> Đây là cách duy nhất giữ đúng "vàng nghệ" mà vẫn đạt chuẩn đọc.
> `Button` **phải** đọc `var(--theme-on-primary)`, **không được hardcode `text-white`**.
>
> **2. `Nghĩa Sĩ` hover/active SÁNG DẦN, không tối dần** (↑ trong bảng).
> Vì nút này có chữ đậm: làm nền tối đi sẽ **giảm** tương phản với chữ đậm.
> Nếu cài theo phản xạ "hover thì tối hơn", Nghĩa Sĩ sẽ trượt AA. Đã có test canh —
> xem §4.5 test #4.
>
> **Hiệp Sĩ `#7A5136`** đậm hơn mức tối thiểu (6,87 thay vì ~4,5) là **cố ý**:
> để tách khỏi Nghĩa Sĩ (ΔE 0,050 → 0,225). Không được làm nhạt lại "cho cân bằng".

### 4.2 🍬 Bốn bậc nền pastel

| Bậc | Chiên Con | Ấu Nhi | Thiếu Nhi | Nghĩa Sĩ | Hiệp Sĩ | Huynh Trưởng |
|---|---|---|---|---|---|---|
| `tint` (0.965) | `#FFEEF3` | `#E8F9E6` | `#EBF5FF` | `#FFF1DF` | `#FCF1EA` | `#FFEFEE` |
| `soft` (0.925) | `#FFDBE6` | `#D2F0CE` | `#D4E9FF` | `#FCE2C0` | `#F5E2D7` | `#FFDDDA` |
| **`pastel`** (0.885) | `#FFC8D9` | `#BCE7B7` | `#BDDDFF` | `#F8D2A1` | `#EED3C3` | `#FFCAC5` |
| `pastel-deep` (0.845) | `#FFB3CC` | `#A6DDA0` | `#A5D1FF` | `#F2C383` | `#E6C4B0` | `#FFB7B1` |

Chữ đậm `#2E2A27` trên `pastel`: **9,82–10,33:1** · trên `pastel-deep`: **8,51–9,12:1**. Toàn bộ ĐẠT.

### 4.3 🔴 Quy tắc chữ trên nền màu — **bắt buộc, lỗi review nếu vi phạm**

| Nền | Chữ dùng được | Đo được |
|---|---|--:|
| `primary` | `on-primary` | 4,50–4,56:1 ✅ |
| `tint` | `accent-text` | 4,50–4,55:1 ✅ |
| **`pastel`** | **`--text` `#2E2A27`** ⭐ mặc định | **8,51–10,32:1** ✅ |
| `pastel` | `accent-strong` (khi cần chữ màu) | 4,51–4,55:1 ✅ |
| `pastel` | ~~`accent-text`~~ | 3,47–3,59:1 🔴 **CẤM** |
| `pastel` | ~~chữ trắng~~ | 1,38–1,46:1 🔴 **CẤM** |
| `soft` / `pastel-deep` | `--text` | ≥8,5:1 ✅ |

**Pastel không bao giờ là:** nền nút · nền trang · nền vùng có chữ trắng · màu chuỗi biểu đồ.

### 4.4 Mười hai nơi được dùng `--theme-*`

| # | Nơi | Token |
|---|---|---|
| 1 | Dải màu 4px dưới header | `primary` |
| 2 | Thanh dọc 3px + nền mục sidebar đang chọn | `primary` + `tint` |
| 3 | Nút chính | `primary` + `on-primary` |
| 4 | Tab đang chọn | `primary` + `accent-text` |
| 5 | Chip ngành kiểu nhạt | `tint` + `accent-text` |
| 6 | Focus ring | `focus-ring` |
| 7 | Hàng/thẻ đang được chọn | `tint` |
| 8 | Chuỗi biểu đồ | `primary` |
| 9 | Chip ngành kiểu cute | `pastel` + `--text` |
| 10 | Nền thẻ lớp ở `/classes` | `soft`, viền `pastel-deep` |
| 11 | Minh hoạ trong `EmptyState` | `pastel` + `pastel-deep` |
| 12 | Nền avatar chữ cái đầu | `pastel` + `--text` |

**Dùng `--theme-*` ở chỗ thứ mười ba là lỗi review.**
Nền trang **luôn** trung tính `#FFFBF7`, không đổi theo ngành.

### 4.5 Nơi lưu

`src/lib/theme/sector-palette.ts` — `Record<ThemeKey, SectorTokens>`, khoá theo `sectors.code`.
**Không thêm cột màu vào database.**

Năm unit test bắt buộc (hàng rào chống hồi quy màu — sửa hex sai là test đỏ ngay):

| # | Khẳng định |
|---|---|
| 1 | Mọi `sectors.code` trong `seed.sql` có mục tương ứng, **và số lượng khớp** |
| 2 | `contrast(onPrimary, primary) ≥ 4.5` cho cả 6 bộ |
| 3 | `contrast(onPrimary, hover) ≥ 4.5` **và** `contrast(onPrimary, active) ≥ 4.5` cho cả 6 bộ |
| **4** | 🔴 **`contrast(onPrimary, hover) > contrast(onPrimary, primary)`** cho cả 6 bộ — canh đúng *hướng* của hover. Đây là test bắt lỗi "Nghĩa Sĩ hover tối dần" |
| 5 | `contrast('#2E2A27', pastel) ≥ 4.5` · `contrast(accentText, tint) ≥ 4.5` · `contrast(accentStrong, pastel) ≥ 4.5` cho cả 6 bộ |

Giá trị JSON đầy đủ để dán vào `sector-palette.ts`: chạy `node scripts/approved.mjs`.

---

## 5. Spacing · Radius · Shadow · Z-index · Motion · Breakpoint

```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  --radius-sm: 8px;    /* chip, badge */
  --radius-md: 12px;   /* nút, ô nhập */
  --radius-lg: 16px;   /* thẻ */
  --radius-xl: 20px;   /* dialog */
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgb(46 42 39 / 0.05);    /* thẻ nghỉ */
  --shadow-md: 0 8px 24px rgb(46 42 39 / 0.12);   /* dialog, dropdown, drawer */
  /* KHÔNG có mức thứ ba */

  --z-base: 0; --z-sticky: 10; --z-header: 20; --z-sidebar: 30;
  --z-bottom-nav: 30; --z-overlay: 40; --z-drawer: 50;
  --z-dialog: 60; --z-dropdown: 70; --z-toast: 80;

  --duration-fast: 100ms; --duration-base: 150ms; --duration-slow: 200ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}

:focus-visible {
  outline: 2px solid var(--theme-ring);
  outline-offset: 2px;
  border-radius: inherit;
}
```

**Breakpoint:** mặc định 0–639 (**ưu tiên số 1, thiết kế từ 360px**) · `sm` 640 · `md` 768 ·
`lg` 1024 (ngưỡng hiện sidebar) · `xl` 1280.
**Ba viewport kiểm thử bắt buộc: 360 · 768 · 1366.**

---

## 6. Thông số tạo hình theo hướng A

| Hạng mục | Quy định |
|---|---|
| **Button** | Bo `md` 12px. Cao **≥44px ở mọi size** (`sm` là nút *hẹp ngang*, không phải nút thấp — quyết định có chủ ý, không được đổi). `primary` = `--theme-primary` + `--theme-on-primary`. `danger` = `--danger` hệ thống, **không** dùng theme |
| **Card** | Bo `lg` 16px, padding 20px (mobile 16px), `--shadow-sm`. `CardTitle` nhận prop `as`, mặc định `h3` |
| **Input** | Cao 44px, bo `md`, viền `--border-strong` |
| **Table** | Viền ngang nhẹ, **không viền dọc**. Header nền `--bg-surface-muted`, chữ 14px semibold. Hàng cao 48px. Cột đầu `sticky left-0`. Bắt buộc `<caption>`. Có chỉ báo cuộn ngang |
| **Form** | Label **trên** ô nhập, 14px semibold. Lỗi hiện **dưới ô**, chữ `--danger` + icon. Nhóm trường trong `<fieldset>` + `<legend>` |
| **Sidebar** | 264px, nền trắng. Mục đang chọn: nền `--theme-tint` + **thanh dọc 3px `--theme-primary`** + chữ `--theme-accent-text` — **ba tín hiệu, không chỉ màu** |
| **Icon** | lucide, `stroke-width: 1.75`, kích thước 16/20/24 |
| **Dashboard** | Lưới thẻ số liệu 2 cột (mobile) / 4 cột (desktop). Số lớn 30px tabular |
| **Chuyển động** | Chỉ 3 loại: hiện/ẩn 150ms · trượt drawer 200ms · nhấn nút 100ms. Tất cả `ease-out` |
| **"Cute"** | Bo 16px thẻ / 20px dialog · **empty state có minh hoạ đường nét đơn giản** · chip bo tròn hoàn toàn · nền kem · câu chữ thân thiện nêu tên phạm vi cụ thể |

---

## 7. Biểu đồ

| Quy tắc | Nội dung |
|---|---|
| Kỹ thuật | **SVG tự vẽ**, không thư viện. Ba loại: đường · cột · vòng tiến độ |
| Màu chuỗi | **Dùng thẳng `--theme-primary` của từng ngành** |
| 🔴 B-1 | **Không dùng bậc `pastel` làm màu chuỗi** — đo được 10/10 cặp dễ nhầm |
| 🔴 B-2 | **Nhãn trực tiếp trên đường/cột**, áp cho mọi biểu đồ kể cả một màu |
| Nếu có Huynh Trưởng | Dùng `#111827` cho chuỗi đó (không phải ngành giáo lý) |
| Mù màu | **Không xử lý** — quyết định có ý thức của chủ dự án (Q-09) |

---

## 8. Component: 7 giữ · 6 sửa · 21 làm mới

Chi tiết ở `05_GLOBAL_COMPONENT_SYSTEM.md` §3. Tóm tắt thứ tự làm:

**Nhóm 1 (chặn mọi module):** `Select` · `Dialog` · `ConfirmDialog` · `Skeleton` · `Alert` · `Textarea` · `BranchChip` · `EmptyState` (3 variant)

**Nhóm 2:** `SearchInput` · `Pagination` · `FilterBar` · `DataTable` · `Tabs` · `Breadcrumb` · `Dropdown` · `Toast` · `Tooltip` · `Avatar` · `Progress` · `FileUpload` · `SegmentedControl` · `Chart`

**Nhóm theme (7):** `ThemeScope` · `ContextIndicator` · `ChildSwitcher` · `AcademicYearSwitcher` (viết lại) · `UnassignedBanner` · `ArchivedYearBanner` · `BranchContextSwitcher` (thiết kế sẵn, **chưa xây** — Q-01 = một lớp)

---

## 9. Ba loại trạng thái rỗng chuẩn

| Loại | Khi nào | Mẫu câu |
|---|---|---|
| `no-data` | Thật sự chưa có dữ liệu | *"Lớp **Ấu 1A** chưa có thiếu nhi nào ghi danh."* |
| `out-of-scope` | Có dữ liệu nhưng ngoài phạm vi | *"Bạn không được xem danh sách của lớp này."* |
| `not-linked` | Tài khoản chưa thiết lập xong | *"Tài khoản của bạn chưa được liên kết với hồ sơ thiếu nhi nào. Vui lòng liên hệ Giáo lý viên lớp."* |

Luôn **nêu tên phạm vi cụ thể**, lấy từ `ThemeContext.branchName` và `AuthContext`.

⚠️ **`out-of-scope` không được áp cho hồ sơ thiếu nhi** — BR-25 cấm lộ sự tồn tại. Ở đó vẫn trả 404.

---

## 10. Mười điều bị cấm

1. Màu hardcode trong component khi có token.
2. Bản sao component cho từng ngành.
3. `--theme-*` ở ngoài 12 điểm đã liệt kê.
4. Màu ngành làm màu trạng thái (và ngược lại).
5. Màu là tín hiệu **duy nhất** cho ngành / trạng thái / vai trò.
6. Cỡ chữ < 12px.
7. Vùng chạm < 44px.
8. `window.confirm` / `window.alert`.
9. `<select>` native mới.
10. Chặn zoom trên mobile.

---

## 11. Danh sách KHÔNG ĐƯỢC ĐỤNG

| Thứ trông như lỗi | Vì sao giữ |
|---|---|
| `Button size="sm"` cao **44px** | `sm` là nút *hẹp ngang*. `responsive.spec.ts` sẽ đỏ ngay |
| Ô tick điểm danh nhỏ 16–20px | Vùng bấm đo theo `<label>` bao quanh, đã `min-h-11` |
| Service worker **không** cache HTML | Máy phòng học dùng chung — cache roster là rò hồ sơ thiếu nhi |
| Danh sách dùng **card thay vì bảng** | Đã cân nhắc cho 360px |
| `/parent/children/[id]` trả **404** thay vì "không có quyền" | Không lộ sự tồn tại của hồ sơ em |
| `/teaching-plan`, `/results`, `/parent` không giới hạn `roles` | Cố ý (D-25) |
| `FormMessage` tự đặt `role` theo `tone` | Thiết kế gọn và đúng — mở rộng, không thay |
| Form dùng `<form action={serverAction}>` không cần JS | Máy yếu, mạng phòng học kém |
| Mặc định "Có mặt", chỉ sửa ngoại lệ ở điểm danh | Là lý do luồng này nhanh |
| Không hiển thị mã thiếu nhi ở danh sách | `AGENTS.md` §8 |
| 16 điểm mạnh ở `04_SYSTEM_WIDE_FINDINGS.md` | Toàn bộ |
