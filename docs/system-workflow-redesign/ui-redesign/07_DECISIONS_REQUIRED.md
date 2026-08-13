# 07 — Những điều cần chủ dự án quyết định

> **ĐIỂM DỪNG BẮT BUỘC.** Giai đoạn 2A dừng tại đây. Chưa sửa dòng mã nào.
> Chỉ bắt đầu Phần 2B sau khi chủ dự án trả lời và xác nhận rõ:
> **"ĐÃ PHÊ DUYỆT DESIGN SYSTEM VÀ KẾ HOẠCH GIAI ĐOẠN 2."**
>
> Những gì có thể tự xác định chắc chắn từ mã nguồn thì **đã tự xác định** và không hỏi lại.
> 5 câu hỏi nhỏ chủ dự án đã ghi ở cuối `06_DECISION_LOG.md` cũng **không hỏi lại**.

---

## A. QUYẾT ĐỊNH BẮT BUỘC — chặn Giai đoạn 2B

### 🔴 Q-01 · Một Giáo lý viên có được phụ trách **nhiều lớp** không?

**Đây là câu hỏi chặn quan trọng nhất, và nó KHÔNG phải câu hỏi về giao diện.**

Chủ dự án nêu hai tình huống bắt buộc phải xử lý: *"GLV phụ trách nhiều lớp cùng một ngành"* (#4)
và *"GLV phụ trách nhiều ngành"* (#5). Nhưng cơ sở dữ liệu **hiện đang chặn cả hai**:

```sql
-- 20260715000400_staff_and_class_assignments.sql:52-53
create unique index class_staff_one_active_class_per_staff_idx
on public.class_staff_assignments (staff_profile_id) where is_active;
```

Một GLV **chỉ có đúng một phân công lớp đang hiệu lực**. Đây là ràng buộc ở tầng cơ sở dữ liệu,
không phải quy ước có thể lách.

| | A · Giữ nguyên một lớp | B · Cho phép nhiều lớp |
|---|---|---|
| Migration | Không cần | `is_primary` + đổi unique index + trigger |
| Ảnh hưởng | 0 | 🔴 Phải rà lại **6 hàm quyền** (`is_class_staff`, `is_class_representative`, `can_edit_attendance`, `can_grade_class`, `can_comment_class`, `staff_class_ids`) và **23 bộ pgTAP** |
| Theme | Đơn giản, không cần bộ chọn ngữ cảnh | Cần bộ chọn ngữ cảnh ngành + quy tắc phân công chính |
| Cỡ | — | **L** (nghiệp vụ, không phải UI) |
| Thực tế giáo xứ | ? | ? |

**Đề xuất: A cho phiên bản này.**
Lý do: đây là **thay đổi nghiệp vụ lớn chưa từng được Giai đoạn 1 phát hiện**, đụng vào 6 hàm quyền và toàn bộ
kiểm thử phân quyền. Nếu thực tế giáo xứ **có** GLV dạy hai lớp, đó là lỗi mô hình nghiệp vụ cần
xử lý riêng **trước** Giai đoạn 2B, không nên gộp vào đợt redesign giao diện.

Resolver theme sẽ được thiết kế **sẵn sàng cho nhiều ngành** (`availableThemeContexts` là mảng),
nên chọn A hôm nay **không khoá đường** mở B sau này.

> **Câu hỏi thực tế cần chủ dự án trả lời:** ở Xứ đoàn Chợ Quán hiện có Giáo lý viên nào **đang dạy hai lớp** không?

---

### 🔴 Q-02 · Chọn hướng thiết kế

Bốn hướng ở `02_DESIGN_DIRECTIONS.md`.

| | Cảm xúc | Cute | Hợp người không rành CN | Rủi ro | Chi phí |
|---|---|:--:|:--:|---|---|
| **A · Sân Giáo Xứ** ⭐ | Ấm, quen thuộc | 3/5 | ★★★★☆ | Thấp | Thấp |
| B · Khăn Quàng | Bản sắc TNTT mạnh | 4/5 | ★★★☆☆ | **Cao** | Cao |
| C · Sổ Tay Giáo Lý | Rõ ràng, tin cậy | 2/5 | ★★★★★ | Thấp | Vừa |
| D · Trong Trẻo | Hiện đại, gọn | 2/5 | ★★★☆☆ | Thấp | Vừa |

**Đề xuất: A + mượn 2 chi tiết**
- Từ B: **dải màu ngành 4px** ngay dưới header (nhận diện TNTT rõ, rủi ro thấp).
- Từ C: riêng **cổng phụ huynh/thiếu nhi (M13)** dùng thang chữ lớn hơn một bậc.

Lý do: A là hướng **duy nhất** làm đúng D-79 (*giữ tinh thần màu cam/da người ấm từ logo, chỉ chỉnh độ đậm*).
D mâu thuẫn trực tiếp với D-79.

---

### 🔴 Q-03 · Chọn kiến trúc theme

Bốn phương án ở `04_THEME_ARCHITECTURE_OPTIONS.md`.

| | Phụ huynh nhiều con | Màn hình đa ngành | Chuyển năm học | Tuân thủ ràng buộc chủ dự án |
|---|:--:|:--:|---|:--:|
| A · Cố định theo tài khoản | ✖ | n/a | ✖ sửa tay ~940 hồ sơ | 🔴 **Vi phạm** |
| B · Theo vai trò/ngành | 🔴 hỏng | n/a | ✅ | Một phần |
| C · Theo ngữ cảnh dữ liệu | ✅ | 🔴 **không có lời giải** | ✅ | Phần lớn |
| **D · Trung tính + accent theo ngữ cảnh** ⭐ | ✅ | ✅ | ✅ | ✅ **Đầy đủ** |

**Đề xuất: D.** Là phương án duy nhất thoả đồng thời cả bốn điều kiện.

---

### 🔴 Q-04 · Chọn thứ tự ưu tiên của Theme Context Resolver

Ba phương án ở `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` §2.

| | Ý tưởng | Rủi ro |
|---|---|---|
| R1 | Ngữ cảnh trang thắng tuyệt đối | Lựa chọn của người dùng bị bỏ qua |
| R2 | Lựa chọn người dùng thắng | 🔴 **Màu có thể nói dối**: mở lớp Thiếu 1A nhưng giao diện màu Ấu Nhi |
| **R3** ⭐ | Ngữ cảnh trang thắng; lựa chọn người dùng chỉ phá thế hoà | Nhiều nhánh hơn, cần ~25 unit test |

**Đề xuất: R3.** Bảo đảm nguyên tắc chủ dự án đặt ra: *"màu luôn phản ánh đúng ngành có hiệu lực
trong ngữ cảnh hiện tại"*.

---

### 🔴 Q-05 · Chọn bảng màu ngành: Phương án A hay B?

Cả hai **đều đạt WCAG AA 100%** (đã đo). Khác nhau ở cảm giác.

| Ngành | A · Truyền thống đậm | B · Ấm dịu |
|---|---|---|
| Chiên Con | `#C34C7C` | `#B25B72` |
| Ấu Nhi | `#378630` | `#548243` |
| Thiếu Nhi | `#1079CD` | `#357BB2` |
| Nghĩa Sĩ | `#A16C01` | `#A4690D` |
| Hiệp Sĩ | `#9F6B46` | `#986D56` |
| Huynh Trưởng | `#CE4846` | `#BB584D` |

**Đề xuất: A.** Lý do: B giảm độ bão hoà làm các ngành **xích lại gần nhau hơn** —
số cặp dễ nhầm tăng từ 6/15 lên 8/15 (đã đo). A giữ bản sắc rõ hơn *và* phân biệt tốt hơn.

---

### 🔴 Q-06 · Ngành Nghĩa Sĩ — nút chính dùng chữ đậm thay vì chữ trắng?

Vàng nghệ là màu **bản chất sáng**. Để nền vàng mang chữ trắng ở 4,5:1, nó phải tối tới `#A16C01` —
lúc đó **không còn là vàng nghệ** mà là nâu vàng, và **đụng Hiệp Sĩ (nâu đất)**, ΔE = 0,050 (rất dễ nhầm).

| | primary | Chữ trên nút | Giữ đúng "vàng nghệ"? | Tách khỏi Hiệp Sĩ |
|---|---|---|:--:|--:|
| N-1 | `#A16C01` | trắng | ✖ | ΔE 0,050 ✖ |
| N-2 | `#C48401` | **đậm** (4,50:1) | ✅ | ΔE 0,110 ⚠ |
| **N-3** ⭐ | `#C48401` | **đậm** | ✅ | **ΔE 0,225** ✅ *(+ đẩy Hiệp Sĩ sang `#7A5136`)* |

**Đề xuất: N-3.** Hệ quả: token `foreground-on-primary` là **biến theo ngành**, không phải hằng `#FFFFFF`.
Nút chính của **riêng ngành Nghĩa Sĩ** có chữ đậm. Chấp nhận được?

---

## B. QUYẾT ĐỊNH NÊN XÁC NHẬN

### Q-07 · Font chữ

Hiện `--font-sans` khai "Be Vietnam Pro" nhưng **chưa bao giờ được tải** — không `next/font`,
không `<link>`, không `@font-face`. App đang chạy bằng `system-ui`.

| | Be Vietnam Pro ⭐ | Inter | Giữ system-ui |
|---|---|---|---|
| Thiết kế cho tiếng Việt | ✅ Dấu cân đối, do người Việt thiết kế | ⚠ Dấu hơi cao | tuỳ máy |
| Ấm áp / thân thiện | ✅ Bo tròn nhẹ | Trung tính, hơi lạnh | — |
| Dung lượng (3 weight, subset vietnamese+latin) | ~55KB | ~48KB | 0 |
| Nhất quán giữa thiết bị | ✅ | ✅ | ✖ **Segoe UI / Roboto / SF Pro tuỳ máy** |

**Đề xuất: Be Vietnam Pro** — đúng định hướng `docs/06` §3 đã đặt ra từ đầu, hợp "ấm áp, thân thiện".

### Q-08 · Cổng phụ huynh/thiếu nhi dùng thang chữ **lớn hơn một bậc**?

Nhóm người dùng đông nhất và lớn tuổi nhất. Đề xuất riêng M13: body 17px (thay 16), nút 48px (thay 44),
nhãn 14px (thay 13).

| | Có ⭐ | Không |
|---|---|---|
| Dễ đọc cho phụ huynh lớn tuổi | ✅ | — |
| Cuộn nhiều hơn trên 360px | ~+15% | — |
| Chi phí | Một biến thể token, không phải component riêng | 0 |

**Đề xuất: Có.**

### Q-09 · Biểu đồ đa ngành dùng bộ màu riêng?

Màu ngành **không phân biệt được khi mù màu** (đã đo: 10/15 cặp dễ nhầm với người mù lục).
Bộ màu biểu đồ riêng cho **0/15** cặp nguy cơ ở thị lực bình thường.

| | Bộ màu biểu đồ riêng ⭐ | Dùng luôn màu ngành |
|---|---|---|
| Phân biệt được | ✅ | ✖ |
| Khớp màu chip ngành | ⚠ gần giống, không giống hệt | ✅ |

**Đề xuất: bộ riêng** (`03_BRANCH_COLOR_RESEARCH.md` §6), **và luôn có nhãn trực tiếp trên biểu đồ**.

### Q-10 · Thư viện biểu đồ hay tự vẽ SVG?

Dự án **hiện không có thư viện biểu đồ nào**. `docs/06` §7 yêu cầu 2 biểu đồ chuyên cần.

| | SVG tự vẽ ⭐ | Recharts / Chart.js |
|---|---|---|
| Dung lượng | ~3KB | 40–100KB + mã chạy trên trình duyệt |
| Hợp quyết định "hạn chế tối đa mã chạy trên trình duyệt" | ✅ | ✖ |
| Chỉ cần 2–3 loại biểu đồ | ✅ đủ | thừa |
| Kiểm soát màu/nhãn/a11y | ✅ hoàn toàn | phải ghi đè |

**Đề xuất: SVG tự vẽ** cho đường · cột · vòng tiến độ. Mạng phòng học kém, máy yếu.

### Q-11 · `/reports` khi **đã lọc về một ngành** — có đổi accent theo ngành đó không?

| | Có đổi ⭐ | Giữ đỏ–vàng |
|---|---|---|
| Người dùng biết đang lọc ngành nào | ✅ thêm một tín hiệu | Chỉ có chữ |
| Nhất quán | ⚠ màu đổi khi lọc | ✅ |

**Đề xuất: Có đổi**, kèm bắt buộc `ContextIndicator` bằng chữ: *"Đang lọc: **Ngành Ấu Nhi**"*.

### Q-12 · Màn hình **xem trước theme** trước khi kích hoạt năm học mới?

Hiện *"bao nhiêu người sẽ đổi ngành, ai chưa được phân công"* — trước khi bấm nút không quay lại được.

**Đề xuất: Có.** Chi phí **S–M**, giá trị cao, và đây là thao tác một chiều ảnh hưởng ~950 người.

---

## C. ĐỀ XUẤT CHUYÊN MÔN — xác nhận là đủ, không cần thảo luận

| # | Đề xuất | Lý do |
|---|---|---|
| C-1 | Bảng màu lưu trong **TypeScript**, khoá theo `sectors.code`, **không** thêm cột màu vào database | Đổi màu = sửa 1 file, không migration. Đúng nguyên tắc chủ dự án nêu |
| C-2 | Bơm token bằng **CSS variable inline** trên `ThemeScope`, không dùng class theo ngành | Cho phép **lồng ngữ cảnh**: trang `/classes` đỏ–vàng chứa 19 thẻ lớp mỗi thẻ màu ngành riêng |
| C-3 | Theme **suy ra ở Server Component mỗi request**, bọc `React.cache()` | Không có cache cũ. Đúng khuôn mẫu `getAuthContext` đã có |
| C-4 | **Không** đưa ngành vào session/JWT | Sẽ cũ ngay khi quản trị viên đổi phân công |
| C-5 | Lớp **Dự trưởng** (`class_kind='trainee'`, không có ngành) → theme **Huynh Trưởng đỏ–vàng** | Schema buộc như vậy; trùng đúng định hướng chủ dự án |
| C-6 | Ghi danh **`paused`** (tạm nghỉ) **vẫn giữ** màu ngành + badge "Tạm nghỉ" | Em vẫn thuộc lớp, chỉ tạm nghỉ |
| C-7 | Khi `role_assignments.class_id` ≠ `class_staff_assignments.class_id` → lấy **`class_staff_assignments`** + cảnh báo cho Super Admin | Đó là phân công công tác thật. Dữ liệu lệch **đang tồn tại** do lỗi M04-F06 |
| C-8 | Xem dữ liệu năm cũ → app shell **giữ nguyên màu**, chỉ hiện banner + chip lịch sử | Nếu shell đổi màu, người dùng tưởng đã chuyển ngữ cảnh làm việc và thao tác nhầm |
| C-9 | Phụ huynh nhiều con khác ngành, ở trang danh sách → **đỏ–vàng**, mỗi con có chip riêng | Không được lấy màu con đầu tiên |
| C-10 | Màu ngành **luôn đi kèm tên ngành bằng chữ**, không bao giờ đứng một mình | Đo được: 10/15 cặp dễ nhầm với người mù lục |
| C-11 | Nút `danger` giữ **đỏ hệ thống `#B3261E`**, không dùng `primary` của theme — kể cả ở theme Huynh Trưởng | Tránh nhầm "Lưu" với "Xoá" |
| C-12 | Sàn cỡ chữ **12px**, chữ đọc thành câu **≥13px**; lint chặn `text-[Npx]` với N<12 | Hiện có 10px và 11px |
| C-13 | **M09 làm sớm** ngay sau vỏ ứng dụng | Độc lập nhất — nơi tốt để kiểm chứng design system trên module thật |
| C-14 | **M06 Giáo án: không đụng nghiệp vụ**, chỉ đồng bộ giao diện; kiểm chứng bằng diff | PASS 65/75 |

---

## D. ĐIỂM CÓ RỦI RO — chủ dự án cần biết trước

| # | Rủi ro | Mức | Giảm nhẹ |
|---|---|---|---|
| **R-1** | 🔴 **Màu ngành không phân biệt được khi mù màu.** Kể cả bộ tốt nhất vẫn 9/15 cặp dễ nhầm với người mù lục (~6% nam giới). Đây là **giới hạn của chính bộ màu truyền thống**, không sửa được bằng chỉnh màu | Cao | Bắt buộc kèm chữ ở mọi nơi (C-10). Trong theme động, mỗi lúc chỉ có **một** màu trên màn hình nên ảnh hưởng chủ yếu ở màn hình đa ngành |
| **R-2** | 🔴 **Đợt 0-UI là 12–18 ngày chưa thấy gì trên màn hình.** Font, token, resolver, 21 component — toàn việc nền | Cao | Làm **M09 ngay sau vỏ** để có kết quả nhìn thấy được sớm. Tách Đợt 0-UI thành 2 mốc: (a) token + 8 component ưu tiên, (b) 13 component còn lại |
| **R-3** | Siết D-70 (phụ huynh/thiếu nhi chỉ thấy lớp mình) có thể làm cổng phụ huynh hiện *"lớp không xác định"* | Cao | `06_DECISION_LOG.md` đã cảnh báo. Bắt buộc rà lại **toàn bộ** cổng sau khi siết |
| **R-4** | Đổi token màu ảnh hưởng **mọi ảnh chụp màn hình** trong E2E nếu có so ảnh | Trung bình | Kiểm `playwright.config.ts` trước; ưu tiên khẳng định theo thuộc tính, không theo ảnh |
| **R-5** | Nâng tương phản có thể làm giao diện "đậm hơn, ít mềm hơn" so với bản hiện tại | Trung bình | D-79 đã cho phép. Bù lại bằng bo góc lớn hơn + khoảng trắng rộng hơn + empty state có minh hoạ |
| **R-6** | 21 component mới đều là **bề mặt lỗi mới** | Trung bình | Mỗi component có unit test + có mặt trong E2E của ít nhất 1 module trước khi dùng rộng |
| **R-7** | Tổng khối lượng Giai đoạn 2 tăng: 60–86 ngày (nghiệp vụ) **+ 12–18 ngày** (nền tảng UI) **+ ~20–30 ngày** (áp UI cho 14 module) | Cao | Chủ dự án cần biết con số thật trước khi phê duyệt |

---

## E. ĐIỂM CHƯA XÁC ĐỊNH ĐƯỢC TỪ MÃ NGUỒN

| # | Điều chưa rõ | Vì sao mã nguồn không trả lời được |
|---|---|---|
| E-1 | Thực tế Xứ đoàn **có** Giáo lý viên dạy hai lớp không? | Cơ sở dữ liệu chặn, nên dữ liệu không thể hiện nhu cầu thật (→ Q-01) |
| E-2 | Xứ đoàn/Giáo phận đã có **bộ nhận diện thương hiệu** với mã màu chưa? | Chỉ có `logo_TNTT_CHOQUAN.jpg` và `public/logo.png`, không có tài liệu nhận diện |
| E-3 | Có bao nhiêu người dùng thật đang dùng **màn hình rộng** so với điện thoại? | Không có công cụ đo lường trong dự án |
| E-4 | Có người dùng nào bị **mù màu** không? | Không thể biết. Đây là lý do R-1 phải xử lý bằng nguyên tắc, không bằng thống kê |
| E-5 | Có nhu cầu **in ấn** báo cáo ra giấy đen trắng không? | Nếu có, quy tắc "không dùng màu làm tín hiệu duy nhất" càng quan trọng |

---

## F. Nhắc về effort cho Phần 2B

Chủ dự án đã đặt: **Phần 2B — Effort: Xhigh.**

> ⚠️ Trước khi bắt đầu triển khai, xin chủ dự án xác nhận đã chuyển sang **Effort: Xhigh**.
> Đây là lần nhắc duy nhất.

---

## G. Bảng chốt

> Cập nhật **2026-07-23** theo trả lời của chủ dự án.

| # | Câu hỏi | Đề xuất | **CHỐT** |
|---|---|---|---|
| Q-01 | GLV nhiều lớp? | A · Giữ một lớp | ✅ **A — Giáo lý viên chỉ dạy 1 lớp.** Không migration. 4 tình huống bị chặn ở `14` §C được gỡ khỏi phạm vi |
| Q-02 | Hướng thiết kế | A + dải màu từ B + chữ lớn M13 từ C | ✅ **A · Sân Giáo Xứ** |
| Q-03 | Kiến trúc theme | D | ✅ **D — nền trung tính, chỉ accent đổi theo ngữ cảnh ngành** |
| Q-04 | Thứ tự ưu tiên resolver | R3 | ✅ **R3 — ngữ cảnh trang thắng, lựa chọn người dùng phá thế hoà** |
| Q-05 | Bảng màu ngành | A · Truyền thống đậm | ✅ **A + BỔ SUNG TẦNG PASTEL** — xem `03` §4.2b |
| Q-06 | Nghĩa Sĩ chữ đậm? | N-3 · Có | ✅ **Có — N-3.** Nghĩa Sĩ `#C48401` chữ đậm; Hiệp Sĩ đẩy sang `#7A5136` |
| Q-07 | Font | Be Vietnam Pro | ✅ **Be Vietnam Pro** qua `next/font/google` |
| Q-08 | M13 chữ lớn hơn? | Có | ✅ **Có** — cổng phụ huynh/thiếu nhi body 17px, nút 48px |
| Q-09 | Bộ màu biểu đồ riêng? | Có | 🔄 **KHÔNG — chủ dự án chọn dùng thẳng màu ngành**, không xử lý mù màu. Xem `03` §6 |
| Q-10 | Thư viện biểu đồ? | SVG tự vẽ | ✅ **SVG tự vẽ** |
| Q-11 | `/reports` lọc ngành đổi accent? | Có | ✅ **Có** + `ContextIndicator` bằng chữ |
| Q-12 | Xem trước theme khi chuyển năm? | Có | ✅ **Có** |
| C-1…C-14 | 14 đề xuất chuyên môn | Xác nhận trọn gói | ✅ **Duyệt trọn gói** |

**Toàn bộ 12 câu hỏi đã được chốt ngày 2026-07-23. Giai đoạn 2A hoàn tất.**

### Ghi chú về Q-09 — chủ dự án chọn khác khuyến nghị

Chủ dự án chốt: *"cứ sử dụng như bình thường, đừng quan tâm đến vấn đề mù màu"*.

**Kiểm lại sau quyết định — kết quả tốt hơn dự kiến:** quyết định **Q-06 (N-3)** đã tự giải quyết vấn đề
phân biệt ở thị lực bình thường. Với bảng màu đã duyệt, **5 ngành giáo lý cho 0/10 cặp có nguy cơ nhầm**
(cặp gần nhất Chiên Con ↔ Hiệp Sĩ, ΔE = 0,175 — an toàn). Bộ màu riêng trở nên **không cần thiết**.

Hai ràng buộc kỹ thuật vẫn giữ vì lý do **đọc biểu đồ**, không phải mù màu:
- **B-1:** không dùng bậc `pastel` làm màu chuỗi (đo được 10/10 cặp dễ nhầm) — dùng bậc `primary` đặc.
- **B-2:** nhãn trực tiếp trên đường/cột, áp cho mọi biểu đồ kể cả một màu.

Ghi lại để Giai đoạn 3 không coi là thiếu sót: với người mù lục các cặp ngành vẫn khó phân biệt;
đây là **lựa chọn có ý thức** của chủ dự án, B-2 là biện pháp giảm nhẹ còn lại.

### Ghi chú về Q-05 — pastel

Chủ dự án chốt phương án A **kèm yêu cầu**: *"nhớ sử dụng màu pastel cute làm giao diện cute hơn"*.

**Đã đo và giải quyết:** pastel **không thể** làm nền nút (chữ trắng trên pastel chỉ 1,38–1,46:1, cần 4,5:1).
Cách hoà giải: **pastel làm nền mềm diện tích lớn · màu đặc A làm chữ và nút**.
Chi tiết + 4 bậc nền + quy tắc chữ: `03_BRANCH_COLOR_RESEARCH.md` §4.2b, `05_GLOBAL_COMPONENT_SYSTEM.md` §2.2.

### Hệ quả của Q-01 = A

| Điều | Trạng thái mới |
|---|---|
| Migration `is_primary` (`12` §2.3) | ❌ **Không chạy** |
| Rà 6 hàm quyền + 23 bộ pgTAP | ❌ **Không cần** |
| `BranchContextSwitcher` (`13` §6) | ⏸ **Thiết kế sẵn, chưa xây** — `availableThemeContexts` vẫn là mảng để mở đường sau này |
| Tình huống C3, C4, C5 ở `14` | Ngoài phạm vi phiên bản này |
| **Theme động** | ✅ **Triển khai được ngay, không cần migration nào** |

---

## H. Q-02 — ✅ ĐÃ CHỐT: **Hướng A · Sân Giáo Xứ**

Giữ lại phần giải thích dưới đây làm hồ sơ, vì nó định nghĩa *hướng thiết kế quyết định điều gì*.

Chủ dự án hỏi lại: *"hướng thiết kế này là thiết cho cái gì nói rõ ra"*.

**Hướng thiết kế quyết định tầng HÌNH KHỐI và CẢM GIÁC** — tách bạch với hai thứ đã chốt:

| Tầng | Đã chốt? | Quyết định điều gì |
|---|:--:|---|
| **Màu** (Q-05) | ✅ A + pastel | Ngành nào màu gì |
| **Logic theme** (Q-03, Q-04) | ✅ D + R3 | Lúc nào hiện màu nào |
| **Hướng thiết kế** (Q-02) | ⏳ | **Mọi thứ còn lại**: chữ to bao nhiêu · góc bo bao nhiêu · thẻ thưa hay dày · có đổ bóng không · nút cao bao nhiêu · bảng có kẻ ô không · biểu mẫu trình bày sao · thanh bên trông thế nào |

Nó áp cho **toàn bộ 14 module và 21 component mới**, nên phải chốt trước khi làm bất kỳ component nào.

**Bốn hướng, khác nhau ở đúng 3 con số cốt lõi:**

| | Cỡ chữ body | Bo góc thẻ | Chiều cao nút | Cảm giác |
|---|--:|--:|--:|---|
| **A · Sân Giáo Xứ** | 16px | **16px** | 44px | Ấm, mềm, quen thuộc |
| B · Khăn Quàng | 16px | 16px | 44px | Như A + **sidebar nhuộm màu ngành** |
| C · Sổ Tay Giáo Lý | **17px** | **10px** | **48px** | Rõ ràng, dứt khoát, như biểu mẫu giấy |
| D · Trong Trẻo | **15px** | 12px | 44px | Gọn, lạnh, nhiều dữ liệu trên một màn |

Chi tiết đầy đủ 15 thuộc tính mỗi hướng: `02_DESIGN_DIRECTIONS.md`.
