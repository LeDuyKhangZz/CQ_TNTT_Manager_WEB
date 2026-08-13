# 05 — Review UI/UX toàn hệ thống

> Ngày lập: **2026-08-13**  
> Runtime được dùng: full baseline 2026-08-12 và full final 2026-08-13 trong
> `verification/evidence/full-e2e-20260812/` và
> `verification/evidence/full-e2e-20260813-final/`  
> Kết luận nhánh UI/UX: **FAILED** — nền tảng responsive/a11y có nhiều bằng chứng tốt, nhưng full E2E
> final vẫn đỏ (**571 pass / 14 fail / 585, 32,2 phút**) và các luồng ghi/điều hướng còn biểu hiện
> chờ lâu, trạng thái giao diện cũ hoặc thiếu phản hồi xác nhận. Các kiểm tra thiết bị/trình đọc màn
> hình thủ công chưa được thực hiện.

## 1. Cách đọc trạng thái

| Nhãn | Ý nghĩa trong báo cáo này |
|---|---|
| `STATIC_VERIFIED` | Đã đọc trực tiếp mã nguồn hoặc unit/component test; chưa suy ra hành vi trên trình duyệt thật |
| `RUNTIME_VERIFIED` | Có Playwright chạy trên baseline đã ghi nhận |
| `FAILED` | Có bằng chứng runtime không đạt hoặc full gate liên quan còn đỏ |
| `NOT_TESTABLE` | Cần thiết bị/công cụ/đánh giá thủ công chưa có trong phiên này |

Review không dùng thiết kế đã duyệt làm bằng chứng runtime. Tương tự, một bài responsive xanh không
thay thế kiểm tra bàn phím, trình đọc màn hình, độ tương phản thực tế và thao tác trên thiết bị thật.

## 2. Responsive theo ba viewport bắt buộc

`playwright.config.ts` khai đúng ba project: `mobile-360` (360×800, touch), `tablet-768`
(768×1024, touch) và `laptop-1366` (1366×768), chạy một worker vì dùng chung cơ sở dữ liệu.
`tests/e2e/responsive.spec.ts` đo hai điều ở runtime:

- chênh lệch `documentElement.scrollWidth - innerWidth <= 1`;
- vùng bấm của nút, mục điều hướng, checkbox/radio và select đạt tối thiểu 44×44 px.

Bài quét bao phủ 13 route ghi toàn cục, `/admin`, trang chi tiết lớp và hai route cổng phụ huynh.
Trong cả artifact baseline lẫn final không có failure nào thuộc `responsive.spec.ts`. Đây là bằng
chứng tốt cho khung trang và vùng bấm của đúng các route đã quét, nhưng **không đủ để kết luận UI toàn
hệ thống đạt** vì lượt final vẫn còn 14 failure ở các hành trình khác.

| Viewport | Bằng chứng đạt | Failure còn quan sát trong full final | Kết luận |
|---|---|---|---|
| 360 px | Bài quét overflow/touch target không nằm trong danh sách fail; shell dùng bottom nav và drawer dưới `lg` | **2 failure:** luồng kết quả/chuyển lớp và xóa bí tích | `FAILED` ở mức hành trình; không có bằng chứng lỗi tràn ngang |
| 768 px | Cùng bộ đo overflow/touch; project được khai `hasTouch: true` | **4 failure:** sinh lớp năm học, mở lô import đã hủy, khôi phục thiếu nhi và lưu liên hệ phụ huynh | `FAILED` ở mức hành trình |
| 1366 px | Sidebar cố định từ `lg`, nội dung bỏ padding đáy của bottom nav; bài quét responsive không fail | **8 failure:** sinh lớp năm học, hai luồng cài lớp, import, thu hồi thông báo, kết quả/Top 5 và hai luồng vòng đời thiếu nhi | `FAILED` ở mức hành trình |

Phân bố final **2/4/8** cho thấy lỗi không chỉ thuộc một breakpoint. Phân loại ở
`06_E2E_TEST_MATRIX.md` phân loại cả **14/14** là `PRODUCT_UX_RELIABILITY`: UI không hội tụ tới feedback,
URL hoặc derived state đã hứa trong cửa sổ chờ. Artifact không chứng minh bố cục sai hay mutation nghiệp
vụ sai, nhưng vẫn chặn claim “dùng ổn định ở cả ba cỡ màn hình”.

## 3. Accessibility và thao tác bàn phím

### 3.1 Bằng chứng tĩnh/component

| Hạng mục | Bằng chứng | Trạng thái |
|---|---|---|
| Focus nhìn thấy | `src/app/globals.css:194-199` đặt outline 2 px theo màu ngữ cảnh; Button/Input còn có ring riêng | `STATIC_VERIFIED` |
| Giảm chuyển động | `src/app/globals.css:166-172` đưa cả ba duration về `0ms` khi `prefers-reduced-motion: reduce` | `STATIC_VERIFIED` |
| Skip link và landmark | `src/components/layout/app-shell.tsx:49-55,82`; `tests/unit/shell-a11y.test.tsx` kiểm link đầu tiên trỏ đúng một `<main id="main-content" tabindex="-1">` | `STATIC_VERIFIED` |
| Thứ bậc heading/breadcrumb | `shell-a11y.test.tsx` kiểm header không chiếm heading, trang có đúng một `h1`, breadcrumb có `aria-current` | `STATIC_VERIFIED` |
| Drawer mobile | `nav-drawer.tsx`; unit kiểm `role="dialog"`, `aria-modal`, focus ban đầu, focus trap, Escape, trả focus, khóa cuộn nền | `STATIC_VERIFIED` |
| Tabs/dropdown/tooltip | `tests/unit/ui-interactive.test.tsx` kiểm roving tabindex, phím mũi tên/Home/End, Escape, click/touch và liên kết ARIA | `STATIC_VERIFIED` |
| Phản hồi cho assistive tech | `toast.tsx:129-135` tách `role="alert" aria-live="assertive"` và `role="status" aria-live="polite"`; LoadingState và nhiều form có live region | `STATIC_VERIFIED` |
| Trạng thái hiện hành | Sidebar, bottom nav, pagination, breadcrumb và child switcher dùng `aria-current` thay vì chỉ dựa vào màu | `STATIC_VERIFIED` |

Unit/component gate gần nhất được ghi nhận xanh. Full browser final cũng đã chạy, nhưng vẫn đỏ; không có
bài axe-core hoặc kiểm tự động toàn cây DOM trong phạm vi bằng chứng.

### 3.2 Phần chưa được phép gọi là đạt

| Kiểm tra | Trạng thái | Lý do |
|---|---|---|
| Duyệt trọn hành trình chỉ bằng bàn phím trên 360/768/1366 | `NOT_TESTABLE` | Unit chứng minh component riêng lẻ; chưa có lượt Playwright/manual tab-through toàn hệ thống |
| Trình đọc màn hình NVDA/VoiceOver | `NOT_TESTABLE` | Không có phiên chạy thiết bị/trình đọc màn hình và biên bản người kiểm |
| Zoom 200%/400%/500% và reflow thực tế | `NOT_TESTABLE` | Không có artifact runtime; việc không khóa zoom trong code chỉ là tiền điều kiện |
| Tương phản computed style của mọi theme/trạng thái | `NOT_TESTABLE` | Script nghiên cứu palette và token thiết kế không thay thế đo DOM thật, kể cả hover/disabled/focus/error |
| Thiết bị cảm ứng thật, bàn phím ảo và safe-area | `NOT_TESTABLE` | Playwright mô phỏng touch; chưa thử trên điện thoại/máy tính bảng thật |
| PWA đã cài, offline và mở lại phiên | `NOT_TESTABLE` ở mức thủ công | Có test tự động PWA riêng, nhưng chưa có bằng chứng cài ứng dụng trên thiết bị thật |

## 4. Vùng chạm, mật độ và khả năng đọc

- Token `--control-height` là 44 px (`globals.css:84-86`); khu vực phụ huynh/thiếu nhi dùng density
  `comfortable` 48 px và cỡ chữ cơ sở 17 px (`:154-164`).
- Button luôn có `min-h-control`; pagination, tooltip, file upload và nhiều checkbox nghiệp vụ bổ sung
  vùng chạm 44 px tại component.
- `responsive.spec.ts` đo hình chữ nhật thực sau khi trang load, không chỉ grep class. Checkbox/radio
  được đo theo label bao quanh để phản ánh vùng bấm thật.

Kết luận: `STATIC_VERIFIED` cho design token/component và có bằng chứng runtime tốt trên các route đã
quét. Việc bấm chính xác bằng ngón tay trên thiết bị thật vẫn `NOT_TESTABLE`.

## 5. Phản hồi, loading và độ tin cậy cảm nhận

Điểm tốt ở tầng thiết kế:

- Toast phân biệt lỗi/thành công bằng icon, nhãn chữ và live region; nút đóng có nhãn cụ thể.
- LoadingState có `role="status"`; form ghi dùng trạng thái pending và vô hiệu nút để tránh bấm lặp.
- Empty/permission/error state đã có component chung; nhiều thao tác nguy hiểm dùng ConfirmDialog nêu
  hậu quả bằng tên đối tượng.

Điểm không đạt ở runtime final:

- **14/585** test dừng ở chờ feedback, URL, pending state hoặc derived state/RSC; danh sách chính xác nằm
  trong `evidence/full-e2e-20260813-final/test-results/`.
- Các luồng ảnh hưởng trực tiếp gồm năm học/cài lớp, import, thu hồi thông báo, kết quả/Top 5 và vòng đời
  thiếu nhi/người giám hộ. Hai ca M07 `results` cũng được tính là reliability của hành trình sản phẩm;
  chúng vẫn không chứng minh mutation nghiệp vụ sai.
- Đây không phải bằng chứng 14 mutation nghiệp vụ sai; tuy nhiên với người dùng, “đã lưu nhưng chưa biết
  đã xong chưa” và “bấm nhưng chưa sang trang” vẫn là lỗi UX có khả năng gây bấm lại hoặc bỏ dở.

Vì vậy hạng mục feedback/loading là **FAILED**, không được hạ thành “test flaky”. Targeted run 2 đã đỏ
**3/18** và full final đỏ **14/585**, nên cần chẩn đoán state DB cùng feedback/URL rồi rerun trên baseline
sạch.

## 6. Điều hướng và kiến trúc thông tin

Shell có các dấu hiệu đúng: sidebar cho laptop, drawer + bottom nav cho màn hẹp, breadcrumb thật, skip
link, trạng thái active bằng chữ/ARIA và nhãn năm học lấy từ dữ liệu. Các failure portal và staff
pagination của baseline không còn xuất hiện trong danh sách 14 failure final, là tín hiệu cải thiện có
giá trị. Tuy vậy final vẫn có timeout điều hướng khi mở lại lô import đã hủy ở tablet, cùng nhiều ca
feedback/derived state không hội tụ trong cửa sổ chờ.

Kết luận điều hướng: **FAILED / cần retest**. Không có bằng chứng cho phép gọi toàn bộ route reachable và
ổn định dù cấu trúc shell nhìn chung đúng hướng.

## 7. Tương phản, màu sắc và trạng thái không dựa riêng vào màu

Mã nguồn sử dụng icon, chữ trạng thái, badge, `aria-current`, viền và live text nên nhiều tín hiệu không
phụ thuộc riêng vào màu. `prefers-reduced-motion` và focus ring được hỗ trợ toàn cục. Tuy nhiên:

- chưa chạy audit tương phản trên computed colors của mọi theme ngành;
- chưa đo trạng thái disabled, error, warning, hover/focus và dark/system mode bằng công cụ runtime;
- chưa có người kiểm xác nhận màu thương hiệu trên màn hình thật.

Do đó contrast/WCAG AA là **NOT_TESTABLE**, không phải PASS. Các script palette trong
`ui-redesign/scripts/` chỉ là bằng chứng nghiên cứu thiết kế.

## 8. Kết luận và điều kiện đổi trạng thái

Nhánh UI/UX chỉ có thể đổi từ `FAILED` khi đồng thời:

1. phân loại và sửa 14 failure final; với mỗi mutation kiểm cả state DB lẫn feedback/URL, không chỉ nới
   timeout hoặc sửa locator;
2. targeted các nhóm còn đỏ và full 585-test rerun đều xanh trên baseline reset + seed mới;
3. thực hiện và ghi artifact cho keyboard-only, screen reader, contrast computed style, zoom/reflow và
   touch/PWA trên thiết bị thật;
4. đóng hoặc chấp nhận chính thức issue timing/navigation trong `08_OPEN_ISSUES.md`.

Artifact final được neo bằng SHA-256 của `.last-run.json`:
`75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659`.

Cho tới lúc đó, những gì đã kiểm được chỉ cho phép kết luận: **design system và shell có nền tảng
responsive/a11y đáng kể; trải nghiệm toàn hệ thống chưa được xác nhận sẵn sàng sử dụng thực tế**.
