# 17 — KẾ HOẠCH ĐÁNH BÓNG GIAO DIỆN (UI POLISH) + HIỆU ỨNG LOADING

> **Soạn: 2026-08-14 — Claude (Fable 5), theo yêu cầu trực tiếp của chủ dự án.**
> Trạng thái: **CHỜ CHỦ DỰ ÁN DUYỆT**. Khi chủ dự án ra lệnh "làm theo kế hoạch 17"
> thì coi như đã duyệt các sửa đổi ở §2 (bổ sung vào `09_APPROVED_DESIGN_SYSTEM.md`).
>
> Bối cảnh: GĐ3 kết luận NO-GO; Codex đang làm `P3-UX-001` (ổn định E2E
> M02/M03/M07/M10/M12). Kế hoạch này là việc **thuần trình bày** (presentation),
> không đổi business rule, không migration, không đổi RLS/quyền.
> Task ID đề xuất: **`P3-UI-001`** — claim trong WORKLOG trước khi code.

---

## 0. Yêu cầu gốc của chủ dự án (2026-08-14)

1. Dropdown xấu (listbox native của HĐH) → đồng bộ **toàn bộ** dropdown thành listbox tự dựng, hiện đại, đúng token.
2. Bảng chọn ngày native xấu → date picker tự dựng, đồng bộ.
3. Dropdown/card **lệch hàng** trong khối lọc → canh thẳng.
4. Đồng bộ mọi "thứ lặt vặt" (checkbox, textarea trần, panel chép tay, alias token cũ).
5. **Hiệu ứng loading toàn cục**: cửa sổ nhỏ giữa màn hình, ảnh **random** từ thư mục `loading/` (hiện 4 ảnh `luce1–4.jpg`, phải tự nhận ảnh thêm sau này), kèm **1 câu Lời Chúa random** từ `LoiChua.md`, ảnh có hiệu ứng động cute. Dùng cho **mọi thao tác > 1 giây**: chuyển module, tạo/lưu/xoá/sửa…

### 🔴 Hai việc chỉ chủ dự án làm được

| # | Việc | Vì sao |
|---|---|---|
| 1 | **Điền nội dung vào `LoiChua.md`** — file hiện **RỖNG** | Không có câu nào để random. Format ở §3.6 |
| 2 | Ra lệnh "làm theo kế hoạch 17" | `09` đã khoá, cần lời duyệt của chủ dự án cho §2 |

---

## 1. Chẩn đoán gốc (đã rà toàn bộ `src/`)

| Triệu chứng chủ dự án thấy | Nguyên nhân gốc đã xác minh |
|---|---|
| Dropdown xổ xuống xấu (hình 1) | `src/components/ui/select.tsx` **cố ý** bọc `<select>` native để form chạy không cần JS (ghi chú ngay trong file: *"cần chủ dự án xác nhận"*). Trigger có token, nhưng **listbox do Windows vẽ** — không CSS nào đụng được |
| Bảng chọn ngày xấu (hình 2) | **Không tồn tại DatePicker** trong 27 component đã duyệt. 30 ô `type="date"` + 3 ô `type="datetime-local"` đều là widget native của trình duyệt |
| Lệch hàng trong khối lọc (hình 3) | `filter-bar.tsx:64` xếp grid nhưng ô con không cùng cấu trúc: ô có label, ô không; ô có dòng gợi ý dưới, ô không; `Select` lúc có `className="mt-1"` (`students/page.tsx:87,98,110`) lúc không (`staff/page.tsx:107,117`) |
| Card "lệch tùm lum", mỗi chỗ một kiểu | **9 biến thể panel** viết tay ngoài `Card` chuẩn (danh sách đầy đủ §7.2), nhiều chỗ còn dùng alias token cũ `border-border`/`bg-card` đã bị cấm trong code mới |
| Load lâu không có phản hồi | `router.refresh()` ở **45 chỗ** — re-fetch server component tại chỗ, **không** kích hoạt `loading.tsx`, phản hồi duy nhất là nút `disabled`. Nhiều nút thậm chí không đổi nhãn (`gradebook-editor.tsx:298,305,314,428,720,721`…) |

Điểm sáng: 73 chỗ đã dùng `<Select>` chuẩn, chỉ còn **5 `<select>` trần** (2 file), 11 checkbox trần, 1 textarea trần, 1 input file trần. Nền token ở `globals.css` + `tailwind.config.ts` rất tốt — kế hoạch này **xây trên nền đó, không đập lại**.

---

## 2. Sửa đổi cần duyệt vào `09_APPROVED_DESIGN_SYSTEM.md`

Khi chủ dự án duyệt, phiên thực thi **thêm mục "Sửa đổi 2026-08 (kế hoạch 17)"** vào cuối `09`, KHÔNG sửa đè nội dung đã duyệt cũ:

| # | Sửa đổi | Chi tiết |
|---|---|---|
| A1 | **Select nâng cấp listbox tự dựng** | Nới điều "form không cần JS" (09 §11) thành **tăng tiến (progressive enhancement)**: trước hydration vẫn là `<select>` native (không mất chức năng), sau hydration thay bằng listbox tự dựng. Điều cấm §10.9 (*không `<select>` native mới*) giữ nguyên |
| A2 | **4 component mới**: `DateField` · `DateTimeField` · `Checkbox` · `LoadingOverlay` (+ `FilterField` là con của `FilterBar`) | Vào danh sách §8 |
| A3 | **Z-index thêm 1 tầng**: `--z-loading: 90` (trên toast 80) | LoadingOverlay phải nổi trên mọi thứ, kể cả dialog đang mở |
| A4 | **Motion thêm loại thứ 4 — "loading"**: ảnh lắc lư nhẹ vòng lặp 2,5s `ease-in-out`; 3 chấm nhún; overlay hiện/ẩn 150ms. `prefers-reduced-motion` → ảnh đứng yên, chấm đổi opacity | 09 §6 hiện chỉ cho 3 loại chuyển động |
| A5 | **Không mở rộng thang radius/shadow** — `(auth)/layout.tsx` đang xài `rounded-2xl shadow-xl` ngoài thang thì sửa về `rounded-xl` (20px) + `shadow-md` | Giữ nguyên tắc "2 mức bóng, 4 mức bo" |

Mọi thứ khác của `09` (bảng màu ngành, 12 điểm theme, pastel, cấm đoán, danh sách không-được-đụng) **giữ nguyên tuyệt đối**.

---

## 3. Đợt A — Hệ thống LoadingOverlay (ưu tiên 1 của chủ dự án)

### 3.1 Tài sản

- Chuyển `loading/luce1–4.jpg` (203–279KB/ảnh, đang nằm **ngoài** app ở root working-dir) → `CQ_TNTT_Manager_Project_Spec/public/loading/`.
- Chuyển `LoiChua.md` (root) → `CQ_TNTT_Manager_Project_Spec/src/content/LoiChua.md`. Để lại ghi chú ở root trỏ sang chỗ mới (chủ dự án hay mở file root).

### 3.2 Kiến trúc (Next 15 App Router, không thêm thư viện)

| Mảnh | File mới | Nhiệm vụ |
|---|---|---|
| Liệt kê ảnh | `src/lib/loading/images.ts` (server-only) | `fs.readdir("public/loading")` lọc `.jpg/.jpeg/.png/.webp/.gif`, cache module-level. **Thêm ảnh mới = tự nhận, không sửa code** |
| Kho câu | `src/lib/loading/verses.ts` (server-only) | Đọc + parse `src/content/LoiChua.md` (format §6.3), cache. File rỗng → trả `[]`, overlay chỉ hiện ảnh |
| Provider | `src/components/loading/loading-provider.tsx` (`"use client"`) | Context giữ bộ đếm task đang chạy + danh sách ảnh/câu (nhận từ server qua props). API: `begin()`/`end()`, hook `useGlobalPending(isPending)`, random ảnh + câu **mỗi lần hiện** |
| Overlay | `src/components/loading/loading-overlay.tsx` | Cửa sổ nhỏ giữa màn hình: nền mờ `--bg-overlay`, thẻ `rounded-xl` (20px dialog) + `shadow-md` + `bg-surface`, ảnh luce ~96–120px bo tròn **lắc lư nhẹ** (loop 2,5s), 3 chấm nhún màu `--theme-primary`, câu Lời Chúa 14px + nguồn 13px `--ink-muted`. `role="status"` + `aria-live="polite"`, `data-testid="global-loading-overlay"`, z `--z-loading` |
| Bắt điều hướng | trong provider | Click-capture toàn cục trên `document`: thẻ `a[href]` nội bộ (bỏ qua phím bổ trợ, `target="_blank"`, `download`, hash-only, route hiện tại) → `begin()`. Kết thúc: effect theo `usePathname()+useSearchParams()` + `popstate`. **Không phải sửa từng `<Link>`** |
| Bắt form submit | `src/components/loading/form-pending-bridge.tsx` | Component 0-UI dùng `useFormStatus()`, thả vào trong `<form>` chậm → overlay theo pending. Không JS thì không render — đúng tinh thần tăng tiến |

Gắn provider ở `src/app/(dashboard)/layout.tsx` (ngoài `AppShell`, trong `ThemeScope` để chấm nhún ăn màu ngành) và `(auth)/layout.tsx` (đăng nhập cũng chậm).

### 3.3 Ngưỡng thời gian (hằng số một chỗ, đổi được)

| Hằng | Giá trị | Ý nghĩa |
|---|---|---|
| `SHOW_AFTER_MS` | ~~1000~~ → **0** | ⚠️ **ĐÃ ĐỔI 2026-08-14 khi triển khai.** Ngưỡng 1000ms đúng yêu cầu gốc ">1s mới hiện", nhưng trên production phần lớn thao tác xong **dưới** một giây nên overlay gần như không bao giờ hiện. Chủ dự án chốt lại: *"cứ loading là xuất hiện"*. Chống chớp nay do `MIN_VISIBLE_MS` gánh một mình |
| `MIN_VISIBLE_MS` | 600 | Đã hiện thì hiện đủ lâu để đọc, không nháy tắt |
| `FAILSAFE_HIDE_MS` | 30000 | Chống overlay kẹt vĩnh viễn nếu một `end()` bị nuốt |

Ảnh kế tiếp được **preload sẵn** (`new Image()`) ngay khi provider mount, để lúc hiện không bị ô trống.

### 3.4 Nối vào các luồng chậm hiện có

- 3 chỗ `router.push/replace`: `import-upload-form.tsx:60`, `report-workbench.tsx:94`, `staff-delete-panel.tsx:63` → gọi `begin()` trước khi push.
- ~20 client component đã có `useTransition`/`isPending` (danh sách ở inventory §7 của phiên khảo sát — `gradebook-editor`, `attendance-editor`, `promotion-board`, `equipment-board`, `notification-center`, `batch-row-editor`, `staff-*`, `committee-*`, `absence-*`, `account-admin-panel`, `class-settings-form`, `report-workbench`, `teaching-plan-editor`…) → mỗi file thêm **một dòng** `useGlobalPending(isPending)`.
- Form no-JS chậm (commit import, chốt báo cáo, chốt sổ năm, đổi mật khẩu, đăng nhập…) → thả `<FormPendingBridge />`.

### 3.5 Rủi ro E2E (585 bài đang là baseline của P3-UX-001)

- Overlay chỉ mount khi active; khi ẩn **unmount hẳn** (không phải `opacity-0` treo pointer-events).
- ~~`SHOW_AFTER_MS=1000` nghĩa là thao tác test nhanh (local DB) hầu như không thấy overlay.~~
  ⚠️ **KHÔNG CÒN ĐÚNG từ 2026-08-14**: ngưỡng nay là **0**, nên overlay hiện ở **mọi** thao tác và
  che màn hình ít nhất `MIN_VISIBLE_MS`. Mọi spec bấm nút liên tiếp đều phải chờ nó biến mất —
  dùng `waitForIdle(page)` ở `tests/e2e/utils/`.
- Nếu spec nào flake vì overlay che nút: chờ `data-testid="global-loading-overlay"` biến mất — thêm helper `waitForIdle(page)` vào `tests/e2e/utils`.

### 3.6 Format `LoiChua.md` (chủ dự án điền)

```markdown
# Lời Chúa

"Thầy là đường, là sự thật và là sự sống." — Ga 14,6
"Hãy để trẻ em đến với Thầy, đừng ngăn cấm chúng." — Mc 10,14
"Anh em là muối cho đời, là ánh sáng cho trần gian." — Mt 5,13-14
```

Quy tắc parse: bỏ dòng trắng + dòng bắt đầu `#`; mỗi dòng còn lại = 1 câu; chấp nhận có/không gạch đầu dòng `-`; phần sau dấu `—` (hoặc `--`) cuối cùng = nguồn trích, hiển thị dòng riêng nhỏ hơn. Muốn thêm câu: thêm dòng mới, không cần đụng code.

### 3.7 Kiểm thử Đợt A

- Unit: parser Lời Chúa (rỗng / có header / bullet / dòng trắng) · random không lặp liền kề · bộ đếm begin/end lồng nhau · ngưỡng show-after/min-visible (fake timers).
- E2E smoke: điều hướng có delay giả (route chậm) → overlay hiện rồi biến mất, focus không bị cướp, `Escape` không đóng được (loading không phải dialog).

---

## 4. Đợt B — `Select` v2: listbox tự dựng, giữ nguyên 73 chỗ gọi

### 4.1 Nguyên tắc

- **API giữ nguyên 100%**: vẫn nhận `<option>`/`<optgroup>` làm children, vẫn `name`/`value`/`defaultValue`/`onChange`/`disabled`/`required`/`placeholder` → **73 call site không phải sửa**.
- Trước hydration: render đúng `<select>` native như hiện tại (styled trigger) — form GET/POST vẫn chạy không cần JS.
- ~~Sau hydration: … render nút trigger … + `<input type="hidden" name>` để form submit không đổi.~~

⚠️ **KHÔNG CÒN ĐÚNG từ 2026-08-15 khi triển khai.** Bản thi hành **giữ chính `<select>` thật** làm
control duy nhất (nó nằm đè lên mặt tiền ở `opacity-0`, `pointerdown` bị chặn để listbox hệ điều
hành không bung), **không** dùng nút `role="combobox"` + `<input type="hidden">`. Lý do nặng nhất
là đo được: `getByLabel(...).selectOption(...)` có **43 lần** trong 13 tệp E2E và `selectOptions`
trong 12 tệp unit; đổi hợp đồng là bắt cả bộ kiểm ấy viết lại trong cùng phiên đang đổi hai
component lớn. Cộng ba lý do nữa (a11y, nhãn, `required`) — xem `16` §6.2. Con số thật là **74**
chỗ gọi, không phải 73, và **không chỗ nào phải sửa**.

### 4.2 Spec listbox (theo token 09)

| Hạng mục | Giá trị |
|---|---|
| Tấm menu | `bg-surface` · `border-line` · `rounded-md` (12px) · `shadow-md` · `z-dropdown` · `max-h-[280px] overflow-auto` · rộng ≥ trigger |
| Mục | cao **44px** (vùng chạm §10.7) · padding ngang 12px · 14px |
| Hover/focus mục | `bg-surface-muted` |
| Mục đang chọn | `bg-[--theme-tint]` + chữ `--theme-accent-text` + icon check 16px — đúng điểm theme #7 "hàng đang được chọn" |
| Nhóm (`optgroup`) | nhãn 13px semibold `--ink-muted`, không bấm được |
| Hiện/ẩn | 150ms `ease-out`, gốc scale từ trigger; lật lên trên nếu dưới thiếu chỗ (đo `getBoundingClientRect`) |
| Bàn phím | Đủ mẫu ARIA combobox: `↑↓` `Home` `End` `Enter` `Escape` (đóng + trả focus) · gõ chữ nhảy tới mục (type-ahead, hỗ trợ bỏ dấu tiếng Việt bằng `normalize("NFD")` — đồng bộ với triết lý "gõ không dấu cũng tìm được" đã có ở SearchInput) |
| A11y | `role="combobox"` + `aria-expanded` + `aria-controls`; listbox `role="listbox"`, mục `role="option"` + `aria-selected`; click ra ngoài đóng |

### 4.3 Dọn nợ cùng đợt

| Chỗ | Việc |
|---|---|
| `absence-request-panel.tsx:29,102` | Bỏ `selectClassName` chép tay → `<Select>` |
| `gradebook-editor.tsx:59,146,165,960,961` | Bỏ `selectClassName` hardcode (`border-border bg-card h-11`) → `<Select>` — ⚠️ file này thuộc M07, **phối hợp với Codex P3-UX-001 trước khi đụng** |

### 4.4 Kiểm thử Đợt B

Unit (jsdom): mở/đóng/chọn bằng chuột + đủ phím · type-ahead có dấu/không dấu · đóng khi click ngoài · hidden input mang đúng value · render server (không JS) vẫn là native select hoạt động. E2E: các trang lọc (`/students`, `/staff`, `/reports`) chọn bằng listbox mới rồi submit — kết quả lọc giữ nguyên như trước.

---

## 5. Đợt C — `DateField` / `DateTimeField`: 33 chỗ

### 5.1 Spec

- Trigger giống Input chuẩn (44px, `border-strong`, radius 12px) + icon lịch lucide 20px; hiện giá trị **dd/MM/yyyy** (vi-VN) thay vì format thô của trình duyệt; vẫn gõ tay được, parse bằng `date-fns` (đã có dep, không thêm thư viện).
- Popover lịch tự vẽ: header tháng/năm + 2 nút mũi tên (44px), lưới T2→CN 13px semibold, ô ngày **≥40px** trong lưới 7 cột (cả popover vẫn đạt vùng chạm nhờ padding), hôm nay viền `--theme-border`, ngày chọn nền `--theme-primary` chữ `--theme-on-primary` (điểm theme #3-tương-đương: nút chính trong widget — vẫn thuộc 12 điểm vì là "hàng/thẻ đang được chọn" #7), ngoài `min`/`max` mờ + không bấm. Nút "Hôm nay". `z-dropdown`, `shadow-md`, `rounded-md`.
- Tăng tiến: trước hydration render `<input type="date">` native như cũ — không mất chức năng no-JS. Sau hydration: trigger + popover + `<input type="hidden" name>` giá trị ISO `yyyy-MM-dd` → **server actions không đổi một dòng**.
- `DateTimeField` = DateField + hai ô giờ:phút (spinner 44px), hidden value `yyyy-MM-ddTHH:mm` — 3 chỗ (`committee-workspace.tsx:548,558`, `equipment-board.tsx:312`).
- Bàn phím trong lịch: `↑↓←→` di chuyển ngày, `PageUp/Down` đổi tháng, `Enter` chọn, `Escape` đóng; `role="dialog"` + `aria-label` tháng đang xem.
- **Chuẩn hoá bề rộng**: mặc định full-width trong form dọc, `w-44` thống nhất trong hàng lọc ngang — xoá các override lẻ `w-40`/`w-44`/`w-48`/`mt-1` (`semester-milestone-form.tsx:67`, `roster-row.tsx:189`, `staff-assignment-panel.tsx:202`, `report-workbench.tsx:177`).

### 5.2 Danh sách migrate (33)

⚠️ **Số thật khi triển khai (2026-08-15): 27 `type="date"` + 3 `type="datetime-local"` = 30 ô trên
22 tệp**, không phải 33. Bảng dưới đây đếm lặp vài dòng. Sau đợt này `src/` còn **0** ô ngày
native. Chi tiết ở `16` §6.3 — kèm bốn lỗi thật mà bộ kiểm của đợt bắt được, và một hàng rào
không có trong kế hoạch (`setCustomValidity` chặn gửi khi chuỗi gõ dở không đọc được).

Toàn bộ bảng file:line ở báo cáo khảo sát (mục 2) — 30 `type="date"`: `attendance/page.tsx:94` · `staff/page.tsx:260` · `create-year-form.tsx:76,80,93` · `semester-milestone-form.tsx:67` · `gradebook-editor.tsx:156,295` · `absence-request-panel.tsx:119` · `teaching-plan-editor.tsx:291` · `roster-row.tsx:189` · `enroll-student-form.tsx:53` · `account-admin-panel.tsx:225` · `weekly-plan-editor.tsx:120` · `create-student-form.tsx:145,155` · `update-student-form.tsx:82,92` · `sacrament-panel.tsx:231` · `student-status-panel.tsx:155` · `report-workbench.tsx:177` · `staff-account-panel.tsx:320` · `staff-assignment-panel.tsx:202,257,342` · `staff-create-form.tsx:145` · `staff-profile-editor.tsx:104` — cộng 3 `datetime-local` kể trên.

Kiểm thử: unit parse/format vi-VN, min/max, gõ tay giá trị lệch; E2E tạo thiếu nhi (DOB) + điểm danh (ngày buổi) + phân công (ngày bắt đầu) chạy trọn luồng.

---

## 6. Đợt D — Checkbox + vét control trần còn lại

- **`Checkbox` mới** (`src/components/ui/checkbox.tsx`): 20×20px, radius 6px (nửa `sm`), viền `--border-strong`, checked nền `--theme-primary` + check trắng (Nghĩa Sĩ: check `--theme-on-primary` = chữ đậm — **không hardcode trắng**, test canh sẵn), bọc trong `<label>` `min-h-11` để vùng chạm đạt 44px, hỗ trợ `indeterminate` (cho bulk-select). Vẫn là `<input type="checkbox">` thật bên dưới (form no-JS OK) — chỉ style bằng CSS phủ, không tự dựng state.
- Migrate 11 chỗ: `committee-workspace.tsx:220` · `equipment-board.tsx:360` (đang **không có className**) · `create-year-form.tsx:136` · `batch-row-editor.tsx:204,265` · `promotion-board.tsx:425,659` · `create-student-form.tsx:201` · `update-student-form.tsx:125` · `student-status-panel.tsx:137`.
- Textarea trần cuối cùng: `attendance-editor.tsx:343` → `<Textarea>`. ⚠️ Điểm danh nằm trong danh sách nhạy cảm (CLAUDE.md §5) — chỉ đổi vỏ, không đụng hành vi ghi chú.
- Input file trần: `import-upload-form.tsx` → `<FileUpload>` (primitive có sẵn, đang chỉ được dùng 1 chỗ).
- **Không đụng**: ô tick điểm danh nhỏ 16–20px (danh sách cấm 09 §11) — Checkbox mới **không** áp vào lưới điểm danh.

---

## 7. Đợt E — Canh thẳng khối lọc + đồng nhất card/panel

### 7.1 `FilterField` — chữa lệch hàng (hình 3)

Thêm vào `filter-bar.tsx`:

```tsx
<FilterField label="Lớp đang phục vụ" htmlFor="class" helper?>
  {control}
</FilterField>
```

Cấu trúc 3 tầng **cố định** cho mọi ô: hàng label cao 20px + mb-6px (label luôn render — ô tìm kiếm dùng label thật thay vì bỏ trống; cần ẩn thì `sr-only` **nhưng vẫn chiếm chỗ bằng `invisible`**) → hàng control `h-11` → hàng helper `min-h-[18px]` 13px `--ink-muted` (luôn chiếm chỗ, kể cả rỗng). Mọi ô trong grid bằng nhau tăm tắp, hết lệch. Dòng "Gõ không dấu cũng tìm được" chui vào helper. Xoá các `className="mt-1"` lẻ trên `Select`.

Áp cho 6 call site `FilterBar` + migrate 4 khối lọc tự chế: `classes/[classId]/page.tsx:216` (form GET tự dựng) · `attendance-editor.tsx:406-417` (giữ sticky, dùng FilterField bên trong) · `report-workbench.tsx:130-208` · `account-admin-panel.tsx:247,251` (thêm fieldset/legend cho đúng 09 §6).

### 7.2 Đồng nhất 9 biến thể panel về 2 mẫu

Chuẩn hoá: **`Card`** (như cũ) + thêm **`Panel`** = section phẳng trong card (`rounded-md border-line bg-transparent p-3|p-4`) export từ `card.tsx`.

| Biến thể hiện tại | Đổi thành | Số chỗ |
|---|---|---|
| V2 `border-border` panel (13 chỗ: `admin/page.tsx:87`, `staff/page.tsx:173`, `gradebook-editor.tsx:415,1172`, `equipment-board.tsx:256,446,704`, `attendance-editor.tsx:466`, `roster-row.tsx:116`, `absence-*-panel`, `published-results-portal.tsx:90`, `week-ahead-schedule.tsx:30`) | `Panel` | 13 |
| V3 `border-line` panel (`students/page.tsx:206`, `account-admin-panel.tsx:268`, `committee-workspace.tsx:458`, `weekly-plan-editor.tsx:173`) | `Panel` | 4 |
| V4 surface panel tay (`dashboard-overview.tsx:15`, `batch-row-editor.tsx:440`, `promotion-board.tsx:122,826`, `account-admin-panel.tsx:176`) | `Card` | 5 |
| V5 inset muted (`imports/[batchId]/page.tsx:109`, `guardian-panel.tsx:170`, `student-status-panel.tsx:124`) | `Panel` variant `muted` | 3 |
| V6 warning 2 cách viết (`bg-warning-surface` 4 chỗ · `bg-warning-subtle` 3 chỗ) | thống nhất `<Alert tone="warning">` hoặc `bg-warning-subtle` | 7 |
| V7 table wrapper 4 kiểu (`promotion-board.tsx:997`, `promotion-progress.tsx:91`, `published-results-portal.tsx:77`, `attendance-history.tsx:127`, `gradebook-editor.tsx:557`) | kiểu của `data-table.tsx:75` | 5 |
| V8 sticky bar điểm danh (`attendance-editor.tsx:405,520`) | giữ sticky, đổi token `border-line bg-surface` | 2 |
| V9 auth card (`(auth)/layout.tsx:9` `rounded-2xl shadow-xl` + 2 đốm blur `bg-secondary/45 bg-accent/55`) | `rounded-xl shadow-md`, đốm trang trí đổi sang `--theme-tint`/`--theme-soft` | 1 |

### 7.3 Quét alias token cũ

Sau 7.1–7.2, grep toàn `src/`: `border-border` · `bg-card` · `bg-background` · `text-foreground` · `bg-warning-surface` (& các `-surface` trạng thái) → thay bằng token mới (`line`, `surface`, `page`, `ink`, `-subtle`). Mục tiêu: **0 kết quả**, rồi cân nhắc xoá nhóm "BÍ DANH CŨ" khỏi `tailwind.config.ts` ở phiên sau (không làm trong đợt này để tránh vỡ diện rộng).

---

## 8. Đợt F — Phản hồi nút bấm + tổng nghiệm thu

- `Button` thêm prop `pending?: boolean`: hiện spinner 16px (lucide `Loader2`, `animate-spin`) + giữ nguyên bề rộng (không giật layout), tự `disabled` + `aria-busy`. Thay 11 chuỗi "Đang lưu…/Đang tạo…/Đang xử lý…" rải rác và các nút chỉ-disabled-không-nói-gì.
- Chạy **toàn bộ**: `lint` · `typecheck` · `test` · `build` · full E2E 585 bài, đối chiếu baseline của P3-UX-001 (không thêm bài đỏ mới).
- Nghiệm thu 15 mục của `11` §5 cho từng trang bị đụng + 3 viewport 360/768/1366.
- Cập nhật `16_PHASE_2B_IMPLEMENTATION_LOG.md` + `WORKLOG.md` bằng số thật.

---

## 9. Thứ tự, phụ thuộc, phối hợp

```
Đợt A (Loading) ──┐  độc lập, làm ngay, không đụng file module
Đợt B (Select)  ──┼─→ Đợt E (lọc/card cần Select v2 + FilterField)  ─→ Đợt F
Đợt C (Date)    ──┤
Đợt D (Checkbox)──┘
```

- **A trước tiên** (mong muốn lớn nhất của chủ dự án, rủi ro đụng độ = 0 vì toàn file mới). B/C/D là component + call-site sweep. E cuối vì quét diện rộng nhất.
- ⚠️ **Đụng độ với Codex `P3-UX-001`** (đang sửa M02/M03/M07/M10/M12): các file `gradebook-editor.tsx`, `students/*`, `imports/*`, `notification-center.tsx`, `class-settings-form.tsx` — trước khi sweep các file này phải đọc WORKLOG entry mới nhất; nếu Codex đang giữ, hoãn phần đó sang cuối đợt.
- Mỗi đợt kết thúc: `lint · typecheck · test · build` + E2E targeted của module bị đụng, ghi WORKLOG. **Không tự commit** (quy tắc dự án).
- Ước lượng: A ≈ 1–1,5 ngày · B ≈ 1–1,5 · C ≈ 1,5–2 · D ≈ 0,5 · E ≈ 1,5–2 · F ≈ 0,5–1 ⇒ **6–8,5 ngày-người**.

---

## 10. Điều KHÔNG làm trong kế hoạch này

- Không đổi business rule, không migration, không đụng RLS/quyền (thuần UI).
- Không thêm thư viện UI (không Radix/react-day-picker/nextjs-toploader — tự dựng trên token, đúng tinh thần "SVG tự vẽ" của 09).
- Không đụng: lưới tick điểm danh, SW không cache HTML, mặc định "Có mặt", 404 của `/parent/children/[id]`, `Button size="sm"` cao 44px, và toàn bộ 09 §11.
- Không sweep xoá alias cũ khỏi `tailwind.config.ts` (chỉ đưa usage về 0, xoá config để phiên riêng).
