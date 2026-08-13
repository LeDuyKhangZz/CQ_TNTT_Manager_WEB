# 08 — Danh sách kiểm phê duyệt Giai đoạn 2A

> Dùng để chủ dự án rà lại trước khi phê duyệt, và để Giai đoạn 3 đối chiếu.
> Khi mọi ô ở §1–§3 được tích, Giai đoạn 2A hoàn tất và Phần 2B được phép bắt đầu.

---

## 1. Đầu ra của Giai đoạn 2A — đã có đủ chưa?

| # | Tài liệu | Nội dung | Trạng thái |
|---|---|---|:--:|
| 1 | `01_CURRENT_UI_AUDIT.md` | Audit 47 hạng mục component · 5/7 cặp màu trượt AA (đo bằng script) · phát hiện **font chưa bao giờ được tải** · 4 thứ đang hiện sai trên production | ✅ |
| 2 | `02_DESIGN_DIRECTIONS.md` | **4** hướng thiết kế, mỗi hướng đủ 15 thuộc tính + ưu/nhược + ví dụ trên module thật | ✅ |
| 3 | `03_BRANCH_COLOR_RESEARCH.md` | Nguồn TNTT có trích dẫn · khẳng định **không có HEX chính thức** · **2 phương án × 6 ngành** · contrast đo bằng script · mô phỏng 3 dạng mù màu | ✅ |
| 4 | `04_THEME_ARCHITECTURE_OPTIONS.md` | **4** phương án so sánh 13 tiêu chí + trả lời **10 câu hỏi theme** | ✅ |
| 5 | `05_GLOBAL_COMPONENT_SYSTEM.md` | Token 3 tầng đầy đủ · 7 component giữ · 6 sửa · **21 làm mới** · 3 loại trạng thái rỗng · 10 điều bị cấm | ✅ |
| 6 | `06_MODULE_UI_REDESIGN_PLAN.md` | **14/14 module** — nghiệp vụ/giao diện/dùng chung/riêng/theme/responsive/a11y/nghiệm thu/thứ tự | ✅ |
| 7 | `07_DECISIONS_REQUIRED.md` | 12 câu hỏi (6 bắt buộc, 6 nên xác nhận) · 14 đề xuất chuyên môn · 7 rủi ro · 5 điểm chưa xác định | ✅ |
| 8 | `08_DESIGN_APPROVAL_CHECKLIST.md` | Tài liệu này | ✅ |
| 12 | `12_DYNAMIC_THEME_BUSINESS_RULES.md` | Đánh giá schema (đủ/chưa đủ) · quy tắc thời gian · quy tắc theo 6 loại người dùng · cache | ✅ |
| 13 | `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` | Chữ ký resolver 10 trường · **3** thứ tự ưu tiên · bảo đảm tất định · 25 unit test + 7 E2E | ✅ |
| 14 | `14_THEME_EDGE_CASE_MATRIX.md` | **67 tình huống biên** — 63 làm được ngay (94%), 4 bị chặn bởi Q-01 | ✅ |
| 15 | `15_ACADEMIC_YEAR_THEME_TRANSITION.md` | 3 mốc thời gian · quy trình chuyển năm 3 giai đoạn · 10 integration test + 5 E2E | ✅ |

---

## 2. Ràng buộc của chủ dự án — đã tuân thủ chưa?

### 2.1 Liên kết bắt buộc với Giai đoạn 1

| Ràng buộc | Đã làm | Ở đâu |
|---|:--:|---|
| Đọc và triển khai kết quả `docs/system-workflow-redesign/` | ✅ | Đã đọc 00→06 + module docs; mọi module trong `06` có trạng thái GĐ1 |
| `06_DECISION_LOG.md` (D-61…D-79) là nguồn sự thật ưu tiên | ✅ | D-61, D-62, D-63, D-64, D-65, D-66, D-67, D-68, D-70, D-71, D-73, D-74, D-75, D-76, D-77, D-78, D-79 đều được trích dẫn |
| `PASS` → giữ nghiệp vụ, vẫn đồng bộ UI | ✅ | M06 — ghi rõ "không đụng nghiệp vụ, kiểm chứng bằng diff" |
| `PASS_WITH_MINOR_UI_FIX` → giữ nghiệp vụ, sửa UI | ✅ | M09 |
| `NEEDS_IMPROVEMENT` → sửa nghiệp vụ trước rồi UI | ✅ | M05, M07, M08, M11 |
| `CRITICAL` → nghiệp vụ/dữ liệu/quyền/bảo mật trước | ✅ | M01, M02, M03, M04, M10, M12, M13, M14 |
| Không tự thiết kế lại luồng đã `PASS` | ✅ | M06 được bảo vệ tường minh |
| Không bỏ qua luồng nghiệp vụ rườm rà GĐ1 đã phát hiện | ✅ | CM-01, CM-02, CM-04, CM-05, CM-06, CM-07 đều có trong kế hoạch module |

### 2.2 Định hướng giao diện

| Yêu cầu | Đã đáp ứng | Ghi chú |
|---|:--:|---|
| Hiện đại · trẻ trung · cute trang nhã · thân thiện · ấm áp | ✅ | Hướng A, §"Cute đến từ đâu" |
| Dễ dùng với người không chuyên công nghệ | ✅ | Q-08 đề xuất chữ lớn hơn cho M13 |
| Phù hợp môi trường TNTT/giáo xứ | ✅ | Màu ngành theo Nội quy; dải màu khăn quàng |
| Không trẻ con quá mức | ✅ | Weight tối đa 600; icon nét mảnh; không mascot |
| Không hiệu ứng trang trí gây mất tập trung | ✅ | 3 loại chuyển động, tôn trọng `prefers-reduced-motion` |
| Ưu tiên rõ ràng, nhanh, ít thao tác nhầm | ✅ | `ConfirmDialog` nêu hậu quả bằng tên riêng |
| Góc bo mềm · khoảng trắng thoáng · icon thân thiện | ✅ | radius 8/12/16/20; padding 20px |
| Empty state gần gũi | ✅ | 3 variant + minh hoạ + hành động |
| Typography dễ đọc | ✅ | Be Vietnam Pro; sàn 12px |
| Chuyển động nhẹ, có mục đích | ✅ | 100/150/200ms |
| Feedback rõ ràng | ✅ | D-61 + `Toast` + `Alert` + `aria-live` |
| Không lạm dụng gradient/bóng/hoạt ảnh | ✅ | **Chỉ 2 mức shadow**; không gradient |

### 2.3 Hệ thống màu theo ngành

| Yêu cầu | Đã đáp ứng |
|---|:--:|
| Màu ngành dựa trên Nội quy TNTT | ✅ |
| **Không** tuyên bố HEX là "mã chính thức" khi nguồn chỉ có tên màu | ✅ `03` §1.3 nói rõ |
| Tìm và trích dẫn nguồn TNTT đáng tin cậy | ✅ 3 nguồn, có link |
| Xác định có tiêu chuẩn HEX/RGB chính thức hay không | ✅ **Không có** |
| Xây bảng màu số hoá suy từ màu khăn | ✅ |
| Tối thiểu **2 phương án/ngành** | ✅ A và B |
| Kiểm contrast theo WCAG | ✅ **Đo bằng script**, 100% đạt |
| Trình duyệt mã màu trước khi đưa vào code | ✅ Q-05, Q-06 |
| Hệ token đầy đủ 13 token/ngành | ✅ `03` §4.1 |
| Bao gồm ngành Dự Trưởng/Huynh Trưởng | ✅ + xử lý lớp `trainee` không có ngành |
| Tài khoản không thuộc ngành dùng đỏ–vàng | ✅ |
| Không dùng màu ngành cho toàn bộ nền trang | ✅ Chỉ **8 điểm nhấn** |
| Nền tổng thể trung tính, sáng, đồng nhất | ✅ `#FFFBF7` không đổi theo ngành |
| Nội dung và cấu trúc trang nhất quán giữa các ngành | ✅ |
| Không dùng màu làm tín hiệu duy nhất | ✅ + **có số đo chứng minh vì sao bắt buộc** |

### 2.4 Ràng buộc theme động

| Yêu cầu | Đã đáp ứng | Ở đâu |
|---|:--:|---|
| Theme không gắn cố định vào tài khoản/role/hồ sơ | ✅ | `12` §1 |
| Suy ra từ 5 nguồn (năm học, ngành, ngữ cảnh, phân công, quy tắc ưu tiên) | ✅ | `13` §2 |
| Không lưu `themeColor`/`branchTheme`/`primaryColor` | ✅ | `12` §1 bảng cấm |
| Cache được nhưng phải vô hiệu hoá khi có thay đổi | ✅ | `12` §6 — `React.cache()` phạm vi 1 request |
| Không tạo component riêng cho mỗi ngành | ✅ | `13` §5 CSS var inline |
| Phân biệt 5 loại quan hệ ngành theo thời gian | ✅ | `12` §3.2, `15` §3 |
| Xem lịch sử không đổi theme toàn tài khoản | ✅ | `12` §3.3, `15` §6 |
| **16 trường hợp bắt buộc xử lý** | ✅ | `14` — 67 tình huống, 63 làm được ngay |
| Hàm `resolveThemeContext` với 8 tham số vào | ✅ | `13` §1 |
| Trả về ≥8 trường (themeKey, branchId, branchName, sourceOfTheme, academicYearId, contextType, fallbackReason, availableThemeContexts) | ✅ | `13` §1 — **10 trường** |
| Nguồn theme có tên (SELECTED_CHILD_BRANCH…) | ✅ | `13` §1 — 9 nguồn |
| Thứ tự ưu tiên rõ ràng, kiểm thử được | ✅ | `13` §2, Q-04 |
| Không để mỗi màn hình tự viết logic màu | ✅ | `13` §1 — trang chỉ khai báo `scope` |
| Kiểm tra 9 nguồn cache cũ | ✅ | `12` §6.2 |
| Không dùng local storage làm nguồn sự thật | ✅ | `12` §1 |
| Kiểm schema có biểu diễn đủ không | ✅ | `12` §2 — **đủ 94%**, 3 điểm thiếu nêu rõ |
| Đề xuất migration nếu thiếu, **không tự triển khai** | ✅ | `12` §2.3 — SQL kèm ghi chú "KHÔNG chạy cho tới khi được phê duyệt" |
| Không thêm cột màu vào từng người dùng | ✅ | `03` §9 |
| UI: bộ chọn năm học/ngành/con/ngữ cảnh, badge ngành, chỉ báo, trạng thái chưa phân công | ✅ | `13` §6 — 7 component |
| Chuyển theme mềm, không nhấp nháy | ✅ | `12` §7 mục 4–5 |
| Skeleton dùng token trung tính | ✅ | `12` §7 mục 6 |
| Màu trạng thái giữ semantic riêng | ✅ | `03` §7, `05` §2.1 |
| **25 test case bắt buộc** | ✅ | `13` §7.1 — đủ 25 + 4 test bổ sung |
| 4 tài liệu đầu ra `12`–`15` | ✅ | |

---

## 3. Điểm dừng — chưa làm gì trái quy định

| Điều bị cấm ở Phần 2A | Đã tuân thủ |
|---|:--:|
| Không sửa mã nguồn | ✅ |
| Không tạo component | ✅ |
| Không sửa CSS | ✅ |
| Không thay theme | ✅ |
| Không triển khai luồng nghiệp vụ | ✅ |
| Không chạy migration | ✅ |
| Không tự chọn phương án thay chủ dự án | ✅ — mọi mục đều là **đề xuất kèm phương án thay thế** |

**Kiểm chứng:** toàn bộ thay đổi của Giai đoạn 2A nằm trong `docs/system-workflow-redesign/ui-redesign/`.
Không file nào trong `src/`, `supabase/`, hay file cấu hình bị chạm.

```bash
git status --short   # chỉ hiện docs/system-workflow-redesign/ui-redesign/
```

---

## 4. ✅ Chủ dự án đã quyết định — 2026-07-23

| Bước | Việc | Trạng thái |
|---|---|:--:|
| 1 | Đọc `07_DECISIONS_REQUIRED.md` | ✅ |
| 2 | Trả lời 6 câu bắt buộc (Q-01…Q-06) | ✅ |
| 3 | Trả lời 6 câu nên xác nhận (Q-07…Q-12) | ✅ — **Q-09 chọn khác khuyến nghị** |
| 4 | Xác nhận 14 đề xuất chuyên môn C-1…C-14 | ✅ trọn gói |
| 5 | Đọc 7 rủi ro ở mục D | ✅ |
| 6 | Chuyển **Effort: Xhigh** | ⏳ **nhắc trước khi bắt đầu 2B** |
| 7 | Câu xác nhận **"ĐÃ PHÊ DUYỆT DESIGN SYSTEM VÀ KẾ HOẠCH GIAI ĐOẠN 2."** | ⏳ |

### Bảng quyết định cuối

| Mã | Chốt |
|---|---|
| Q-01 | **Giáo lý viên chỉ dạy 1 lớp** ⇒ **0 migration** cho theme động |
| Q-02 | **Hướng A · Sân Giáo Xứ** |
| Q-03 | **Kiến trúc theme D** — nền trung tính, accent theo ngữ cảnh |
| Q-04 | **R3** — ngữ cảnh trang thắng |
| Q-05 | **Bảng màu A + tầng PASTEL** |
| Q-06 | **N-3** — Nghĩa Sĩ giữ vàng nghệ, chữ đậm |
| Q-07 | **Be Vietnam Pro** |
| Q-08 | **M13 chữ lớn hơn một bậc** |
| Q-09 | 🔄 **Dùng thẳng màu ngành cho biểu đồ**, không xử lý mù màu |
| Q-10 | **SVG tự vẽ** |
| Q-11 | **`/reports` đổi accent khi lọc ngành** |
| Q-12 | **Có màn hình xem trước theme** |
| C-1…C-14 | **Duyệt trọn gói** |

---

## 5. ✅ Ba tài liệu nguồn sự thật đã tạo

| # | Tài liệu | Nội dung |
|---|---|---|
| 1 | [`09_APPROVED_DESIGN_SYSTEM.md`](09_APPROVED_DESIGN_SYSTEM.md) | Hướng A · toàn bộ token giá trị cuối · bảng màu 6 ngành + 4 bậc pastel · 2 ngoại lệ Nghĩa Sĩ · 5 test canh màu · 10 điều cấm · danh sách không được đụng |
| 2 | [`10_APPROVED_THEME_RULES.md`](10_APPROVED_THEME_RULES.md) | Kiến trúc D · thứ tự ưu tiên R3 đầy đủ · điều kiện "đang có hiệu lực" · chữ ký resolver · cache · quy tắc 6 loại người dùng · chuyển năm học · 30 unit test |
| 3 | [`11_APPROVED_MODULE_PLAN.md`](11_APPROVED_MODULE_PLAN.md) | Đợt 0-UI chia 2 mốc · thứ tự 14 module · quy trình mỗi module · 15 tiêu chí nghiệm thu chung · 6 thay đổi phân quyền · khối lượng 92–134 ngày |

Ba file trên **cùng tài liệu Giai đoạn 1** là nguồn sự thật khi triển khai 2B.

### Việc đầu tiên của 2B

**Đợt 0-UI, Mốc 0A** (6–9 ngày) theo `11_APPROVED_MODULE_PLAN.md` §2:
tải font → viết lại token → `sector-palette.ts` + 5 test canh màu → `resolveThemeContext` + 30 test →
sửa 7 component cũ → làm 8 component ưu tiên.

### Số liệu màu tái lập được

Sáu script trong `scripts/`, **cả sáu đều chạy được**:
`palette.mjs` · `cvd.mjs` · `pastel.mjs` · `approved.mjs` · `chart-check.mjs` · `accent-check.mjs`.
`approved.mjs` in ra thẳng JSON để dán vào `sector-palette.ts`.

---

## 6. Đầu vào cho Giai đoạn 3

Giai đoạn 3 sẽ có sẵn để review và dựng Playwright E2E:

| Đầu vào | Nguồn |
|---|---|
| Tiêu chí nghiệm thu UI/UX **từng module** | `06` §2, mỗi module một bảng |
| Tiêu chí nghiệm thu **chung cho mọi module** (15 mục) | `06` §4 |
| **25 unit test + 7 E2E** cho theme resolver | `13` §7 |
| **10 integration + 5 E2E** cho chuyển năm học | `15` §7 |
| **67 tình huống biên** của theme, có kết quả kỳ vọng | `14` |
| Ngưỡng tương phản đo được cho **mọi** token | `03` §4.3, §7 |
| Danh sách **"không được đụng"** | `01` §9, và mục "Không đụng" trong từng module ở `06` |
| Script đo màu để **tái lập** mọi số liệu | `scripts/palette.mjs` (sinh màu + contrast WCAG) · `scripts/cvd.mjs` (mù màu + ΔE). Chạy: `node docs/system-workflow-redesign/ui-redesign/scripts/palette.mjs` |
