# 03 — Nghiên cứu màu ngành TNTT và bảng màu đề xuất

> **Mọi con số tương phản và khoảng cách màu trong tài liệu này là kết quả chạy script**, không phải ước lượng.
> Script: sinh màu bằng OKLCH → clip về sRGB → đo tương phản WCAG 2.1 → mô phỏng mù màu (ma trận Machado 2009)
> → đo khoảng cách OKLab ΔE giữa các cặp ngành.
>
> Kết quả có thể tái lập. Script được lưu lại để Giai đoạn 3 kiểm chứng.

---

## 1. Nguồn chính thức

### 1.1 Điều đã tra được

| Nguồn | Nội dung | Độ tin cậy |
|---|---|---|
| [TNTT & Giới trẻ GP. Mỹ Tho — Đồng phục, huy hiệu, khăn quàng, cờ đoàn](https://tnttgioitremytho.com/2024/06/12/dong-phuc-huy-hieu-khan-quang-co-doan-thieu-nhi-thanh-the/) | Trích **Chương V, Điều 63, Nội quy Thiếu Nhi Thánh Thể** — quy định màu khăn từng ngành | **Cao** — trang của một Giáo phận, dẫn đúng số điều |
| [Hải Triều — Ý nghĩa màu khăn trong Phong trào TNTT](https://haitrieu.com/blogs/y-nghia-mau-khan-trong-phong-trao-thieu-nhi-thanh-the/) | Bảng đầy đủ 7 dòng, **có cả Dự Trưởng và Huynh Trưởng** | Trung bình — nhà sản xuất khăn, nhưng khớp nguồn trên |
| [Tổng Giáo phận Hà Nội — Nội quy TNTT Việt Nam](https://www.tonggiaophanhanoi.org/noi-quy-thieu-nhi-thanh-the-viet-nam/) | Bản Nội quy đầy đủ | Cao — **nhưng máy chủ trả 403, không đọc được nội dung** |

### 1.2 Bảng màu chính thức (theo tên gọi)

| Ngành | Màu khăn | Màu thánh giá trên khăn |
|---|---|---|
| Chiên Con | **Hồng** | Đỏ |
| Ấu Nhi | **Xanh lá mạ** | Vàng |
| Thiếu Nhi | **Xanh dương** *(nguồn Hải Triều ghi "xanh nước biển")* | Vàng |
| Nghĩa Sĩ | **Vàng nghệ** | Đỏ |
| Hiệp Sĩ | **Nâu đất** | Vàng |
| Dự Trưởng | **Đỏ** | Vàng |
| Huynh Trưởng | **Đỏ (viền vàng)** | Vàng |

Khớp hoàn toàn với định hướng chủ dự án nêu trong yêu cầu Giai đoạn 2.

### 1.3 ⚠️ Kết luận bắt buộc phải ghi rõ

> **Không có mã HEX/RGB chính thức.** Cả ba nguồn đều chỉ quy định **tên màu tiếng Việt**
> ("xanh lá mạ", "vàng nghệ", "nâu đất") — là tên màu dân gian, không phải mã kỹ thuật.

Vì vậy tài liệu này **không tuyên bố bất kỳ mã HEX nào là "mã chính thức của TNTT"**.
Những gì trình bày dưới đây là **bảng màu số hoá được suy ra** từ tên màu khăn, tối ưu cho màn hình
và cho chuẩn tiếp cận. Đây là **quyết định thiết kế của dự án**, cần chủ dự án duyệt, không phải quy định của Phong trào.

Nếu sau này Xứ đoàn/Giáo phận ban hành bộ nhận diện có mã màu, bảng này phải được thay bằng mã đó.

---

## 2. Hiện trạng trong mã nguồn — sai toàn bộ

`src/app/globals.css:32-37` khai 5 biến màu ngành:

| Ngành | Màu khăn chính thức | Trong code | |
|---|---|---|:--:|
| Chiên Con | Hồng | `#E8B86D` vàng đất | ❌ |
| Ấu Nhi | Xanh lá mạ | `#F0A179` cam đào | ❌ |
| Thiếu Nhi | Xanh dương | `#74B7A5` xanh ngọc | ❌ |
| Nghĩa Sĩ | Vàng nghệ | `#789ED1` xanh lam | ❌ |
| Hiệp Sĩ | Nâu đất | `#A78AC6` tím | ❌ |
| Dự Trưởng / Huynh Trưởng | Đỏ | *không có token* | ❌ |

**5/5 sai, thiếu ngành thứ 6.**

**Tin tốt:** grep toàn bộ `src/` cho thấy **năm biến này chưa được bất kỳ component nào sử dụng**.
Chúng là token chết ⇒ thay mới **không gây hồi quy nào**.

---

## 3. Phương pháp xây bảng màu

1. Đặt mỗi ngành ở một **góc màu (hue) trong OKLCH** suy từ tên màu khăn.
2. **Giải ngược độ sáng (L)**: tìm L *sáng nhất* mà chữ trắng trên nền đó vẫn đạt **≥4,5:1**.
   → đảm bảo nút chính của mọi ngành đều đạt AA ngay từ khi sinh ra, không phải sửa sau.
3. Suy ra `hover` (L−0,045) và `active` (L−0,085).
4. `subtle` = L 0,965, chroma rất thấp → nền badge/tab/hàng được chọn.
5. `accent-text` = màu chữ ngành, giải ngược để đạt ≥4,5:1 **trên cả nền trắng lẫn nền `subtle`**.
6. `border`, `focus-ring`, `chart` giải ngược để đạt **≥3:1** (chuẩn cho thành phần phi văn bản).
7. Chroma vượt sRGB được **giảm dần giữ nguyên hue và L** (gamut clip theo chroma).

Hai phương án cho mỗi ngành:

| | Phương án A — **Truyền thống đậm** | Phương án B — **Ấm dịu** |
|---|---|---|
| Chroma | Cao — bám sát màu khăn thật | Giảm ~30% |
| Hue | Đúng màu khăn | Lệch nhẹ về phía ấm để hoà với nền kem |
| Cảm giác | Rực rỡ, nhận ra ngay | Trầm hơn, dễ nhìn lâu |
| Hợp với | Hướng thiết kế B "Khăn Quàng" | Hướng thiết kế A "Sân Giáo Xứ" |

---

## 4. Bảng màu đề xuất — đã đo, **100% đạt WCAG AA**

### Bảng tóm tắt theo yêu cầu

| Ngành | Màu truyền thống | Primary A | Primary B | Secondary (phụ) | Màu nền nhẹ (A) |
|---|---|---|---|---|---|
| Chiên Con | Hồng | `#C34C7C` | `#B25B72` | Đỏ `#CE4846` | `#FFEEF3` |
| Ấu Nhi | Xanh lá mạ | `#378630` | `#548243` | Vàng `#9A6F00` | `#E8F9E6` |
| Thiếu Nhi | Xanh dương | `#1079CD` | `#357BB2` | Vàng `#9A6F00` | `#EBF5FF` |
| Nghĩa Sĩ | Vàng nghệ | `#A16C01` | `#A4690D` | Đỏ `#CE4846` | `#FFF1DF` |
| Hiệp Sĩ | Nâu đất | `#9F6B46` | `#986D56` | Vàng `#9A6F00` | `#FEF1E8` |
| Huynh Trưởng / Dự Trưởng / Quản trị | Đỏ | `#CE4846` | `#BB584D` | Vàng `#9A6F00` | `#FFEFEE` |

### 4.1 Bộ token đầy đủ — Phương án A (Truyền thống đậm)

| Token | Chiên Con | Ấu Nhi | Thiếu Nhi | Nghĩa Sĩ | Hiệp Sĩ | Huynh Trưởng |
|---|---|---|---|---|---|---|
| `primary` | `#C34C7C` | `#378630` | `#1079CD` | `#A16C01` | `#9F6B46` | `#CE4846` |
| `primary-hover` | `#B43D6F` | `#287921` | `#006CBB` | `#916000` | `#915E39` | `#BE3939` |
| `primary-active` | `#A63064` | `#196D12` | `#0060A8` | `#825600` | `#85522E` | `#B12B2D` |
| `primary-subtle` | `#FFEEF3` | `#E8F9E6` | `#EBF5FF` | `#FFF1DF` | `#FEF1E8` | `#FFEFEE` |
| `primary-subtle-strong` | `#FFDEE8` | `#D8F0D5` | `#D7EAFF` | `#FBE4C6` | `#F6E4D8` | `#FFDFDC` |
| `foreground-on-primary` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `accent-text` | `#BA4375` | `#308029` | `#0072C5` | `#986500` | `#97633E` | `#C5403E` |
| `border` | `#B98395` | `#789B73` | `#7196BC` | `#AC8D62` | `#A98D7B` | `#BC847F` |
| `focus-ring` | `#E46998` | `#54A34D` | `#3996EC` | `#C58501` | `#BD8661` | `#EF6661` |
| `chart-accent` | `#E66B9A` | `#57A64F` | `#3C99EF` | `#C88702` | `#BF8863` | `#F26963` |
| `selected-background` | = `primary-subtle` | | | | | |
| `sidebar-accent` | = `primary` (thanh dọc 3px) | | | | | |
| `notification-accent` | = `accent-text` | | | | | |
| `secondary` | `#CE4846` đỏ | `#9A6F00` vàng | `#9A6F00` vàng | `#CE4846` đỏ | `#9A6F00` vàng | `#9A6F00` vàng |
| `secondary-subtle` | `#FFEBE9` | `#FEEED3` | `#FEEED3` | `#FFEBE9` | `#FEEED3` | `#FEEED3` |

### 4.2 Bộ token đầy đủ — Phương án B (Ấm dịu)

| Token | Chiên Con | Ấu Nhi | Thiếu Nhi | Nghĩa Sĩ | Hiệp Sĩ | Huynh Trưởng |
|---|---|---|---|---|---|---|
| `primary` | `#B25B72` | `#548243` | `#357BB2` | `#A4690D` | `#986D56` | `#BB584D` |
| `primary-hover` | `#A44E65` | `#477536` | `#266EA3` | `#945D00` | `#8A6049` | `#AC4A41` |
| `primary-active` | `#97425A` | `#3C692B` | `#166297` | `#855300` | `#7E553E` | `#9E3E35` |
| `primary-subtle` | `#FFEFF2` | `#ECF7E8` | `#EAF5FF` | `#FFF1E2` | `#FCF1EB` | `#FFEFED` |
| `accent-text` | `#AA546B` | `#4D7B3C` | `#2D74AA` | `#9C6200` | `#90664E` | `#B35146` |
| `border` | `#B48690` | `#82997A` | `#7696B2` | `#AC8D6B` | `#A58E82` | `#B9867E` |
| `focus-ring` | `#D2778D` | `#6F9E5E` | `#5298D0` | `#C38637` | `#B58970` | `#DC7569` |
| `chart-accent` | `#D4798F` | `#72A161` | `#549AD2` | `#C58839` | `#B88B73` | `#DE776B` |

### 4.2b 🍬 TẦNG PASTEL — chốt 2026-07-23 theo yêu cầu *"dùng màu pastel cute cho giao diện cute hơn"*

> **Mâu thuẫn phải nói thẳng:** pastel **không thể** làm nền nút chính. Đã đo trực tiếp —
> chữ trắng trên pastel chỉ đạt **1,38–1,46:1**, trong khi chuẩn AA cần 4,5:1. Trượt gấp ~3 lần.
>
> **Cách hoà giải (đây là cách mọi hệ thống "cute mà vẫn đọc được" đều làm):**
> **Pastel làm NỀN MỀM · màu đặc phương án A làm CHỮ và NÚT.**
> Diện tích pastel lớn (thẻ, chip, hàng được chọn, minh hoạ) ⇒ cảm giác tổng thể **là pastel**,
> trong khi phần chữ và nút vẫn đạt chuẩn.

Mỗi ngành có **4 bậc nền**, chroma tăng dần khi càng sáng để pastel không bị xám xịt:

| Ngành | `tint` (0.965) | `soft` (0.925) | **`pastel`** (0.885) | `pastel-deep` (0.845) |
|---|---|---|---|---|
| Chiên Con | `#FFEEF3` | `#FFDBE6` | **`#FFC7D9`** | `#FFB3CC` |
| Ấu Nhi | `#E8F9E6` | `#D2F0CE` | **`#BCE7B6`** | `#A6DDA0` |
| Thiếu Nhi | `#EBF5FF` | `#D4E9FF` | **`#BDDDFF`** | `#A5D1FF` |
| Nghĩa Sĩ | `#FFF1DF` | `#FEE2BC` | **`#FBD29A`** | `#F5C27C` |
| Hiệp Sĩ | `#FEF1E8` | `#F8E1D2` | **`#F3D2BC`** | `#ECC3A8` |
| Huynh Trưởng | `#FFEFEE` | `#FFDDDA` | **`#FFCAC5`** | `#FFB7B0` |

#### Quy tắc chữ trên nền pastel — **bắt buộc**

| Nền | Chữ dùng được | Đo được | Dùng ở đâu |
|---|---|--:|---|
| `tint` | `accent-text` (màu ngành) | 4,50–4,55:1 ✅ | Chip ngành kiểu nhạt, hàng được chọn |
| **`pastel`** | **`--text` `#2E2A27`** (đậm trung tính) | **8,51–10,32:1** ✅ | Chip ngành kiểu cute, thẻ lớp, minh hoạ |
| `pastel` | `accent-text` thường | **3,47–3,59:1** ❌ | 🔴 **CẤM** |
| `pastel` | `accent-text-strong` (bậc đậm riêng) | 4,51–4,55:1 ✅ | Chỉ khi cần chữ màu trên pastel |

`accent-text-strong` nếu cần chữ **màu ngành** trên nền pastel:

| Ngành | `accent-text-strong` | Trên `pastel` |
|---|---|--:|
| Chiên Con | `#A52F63` | 4,53:1 ✅ |
| Ấu Nhi | `#1D7016` | 4,51:1 ✅ |
| Thiếu Nhi | `#0061A9` | 4,55:1 ✅ |
| Nghĩa Sĩ | `#825600` | 4,51:1 ✅ |
| Hiệp Sĩ | `#85522E` | 4,55:1 ✅ |
| Huynh Trưởng | `#B02A2D` | 4,51:1 ✅ |

> **Đề xuất mặc định:** dùng **chữ đậm `#2E2A27` trên pastel** (10:1 — thoải mái, dễ đọc dưới nắng),
> và giữ `accent-text-strong` cho trường hợp thật sự cần nhấn màu.
> Tương phản 10:1 cũng chính là thứ nhóm người dùng chính (phụ huynh lớn tuổi ngoài sân nhà thờ) cần nhất.

#### Pastel được dùng ở đâu — mở rộng từ 8 lên 12 điểm

| # | Nơi | Token |
|---|---|---|
| 9 | Chip ngành kiểu cute | nền `pastel` + chữ `--text` |
| 10 | Thẻ lớp ở `/classes` (nền thẻ, không chỉ viền trái) | nền `soft`, viền `pastel-deep` |
| 11 | Minh hoạ trong `EmptyState` | mảng màu `pastel` + `pastel-deep` |
| 12 | Nền avatar chữ cái đầu | `pastel` + chữ `--text` |

**Vẫn không đổi:** nền trang tổng thể luôn trung tính `#FFFBF7`. Pastel là **mảng màu trên thẻ**,
không phải màu nền toàn trang.

---

### 4.3 Kết quả đo tương phản — **cả hai phương án, cả 6 ngành đều ĐẠT**

| Cặp cần kiểm | Ngưỡng | Kết quả (khoảng, 12 bộ màu) |
|---|--:|---|
| chữ trắng / `primary` | 4,5 | **4,50 – 4,56** ✅ |
| chữ trắng / `primary-hover` | 4,5 | 5,42 – 5,51 ✅ |
| chữ trắng / `primary-active` | 4,5 | 6,40 – 6,57 ✅ |
| `accent-text` / nền trắng | 4,5 | 4,95 – 5,06 ✅ |
| `accent-text` / `primary-subtle` | 4,5 | 4,50 – 4,55 ✅ |
| chữ chính `#2E2A27` / `primary-subtle` | 4,5 | 12,72 – 12,95 ✅ |
| `border` / nền trang | 3,0 | 3,00 – 3,03 ✅ |
| `focus-ring` / nền trang | 3,0 | 3,00 – 3,03 ✅ |
| `chart-accent` / nền trắng | 3,0 | 3,00 – 3,04 ✅ |

**Không có tổ hợp nào trượt.** Đây là hệ quả của việc *giải ngược từ ngưỡng tương phản* thay vì chọn màu rồi kiểm sau.

---

## 5. 🔴 Phát hiện quan trọng nhất: **6 màu ngành KHÔNG phân biệt được với nhau khi mù màu**

Đo bằng khoảng cách OKLab ΔE (ngưỡng thực dụng: <0,10 = dễ nhầm · 0,10–0,15 = ranh giới · >0,15 = ổn).

### Phương án A — số cặp có nguy cơ nhầm trên tổng 15 cặp

| Điều kiện | Cặp gần nhất | ΔE | Số cặp ΔE<0,15 |
|---|---|--:|--:|
| Thị lực bình thường | Nghĩa Sĩ ↔ Hiệp Sĩ | **0,050** | **6/15** |
| Protanopia (mù đỏ) | Ấu Nhi ↔ Nghĩa Sĩ | **0,038** | **11/15** |
| Deuteranopia (mù lục — **phổ biến nhất, ~6% nam giới**) | Hiệp Sĩ ↔ Huynh Trưởng | **0,023** | **10/15** |
| Tritanopia (mù lam) | Nghĩa Sĩ ↔ Hiệp Sĩ | **0,012** | **7/15** |

### Vì sao — và không thể sửa bằng cách chỉnh màu

Nguyên nhân nằm ở **chính bộ màu truyền thống**, không nằm ở cách số hoá:

- **Vàng nghệ và nâu đất là cùng một góc màu**, chỉ khác độ bão hoà. Khi cả hai bị làm tối xuống đủ để
  mang chữ trắng (điều kiện AA), chúng **hội tụ về cùng một màu nâu vàng** — ΔE = 0,050 ngay cả với người
  thị lực bình thường.
- **Hồng và đỏ** cũng cùng nhánh, ΔE = 0,077.
- Với người mù lục, **đỏ / nâu / vàng / xanh lá đều rơi về một dải vàng nâu**.

### Đã thử ba cách cứu, kết quả:

| Cách | Cặp nguy cơ (bình thường) | Đánh giá |
|---|--:|---|
| Phương án A nguyên bản | 6/15 | ✖ |
| Phương án B (ấm dịu) | 8/15 | ✖ **tệ hơn** — giảm chroma làm các màu xích lại gần nhau |
| **A′** — Nghĩa Sĩ dùng nền sáng `#C48401` + chữ đậm | 4/15 | Khá hơn, giữ được "vàng nghệ" thật |
| **A″** — A′ + đẩy Hiệp Sĩ nâu sẫm `#7A5136` | **1/15** | ✅ **Tốt nhất**, nhưng vẫn 9/15 khi mù màu |

**Ngay cả phương án tốt nhất vẫn không cứu được tình huống mù màu.** Đây là giới hạn vật lý của bộ màu, không phải lỗi thiết kế.

### 5.1 Kết luận thiết kế — bắt buộc

> **Màu ngành KHÔNG BAO GIỜ được là tín hiệu duy nhất cho biết dữ liệu thuộc ngành nào.**
> Mọi nơi hiển thị màu ngành **bắt buộc** đi kèm **tên ngành hoặc tên viết tắt bằng chữ**.

Cụ thể:

| Nơi | Bắt buộc |
|---|---|
| Chip/badge ngành | Chấm màu **+ chữ** ("Ấu Nhi" hoặc "Ấu") — không bao giờ chỉ chấm màu |
| Thẻ lớp ở `/classes` | Tên lớp là thông tin chính; màu chỉ là viền trái |
| Biểu đồ nhiều ngành | **Nhãn trực tiếp trên đường/cột**, không chỉ dựa vào chú giải màu |
| Hàng bảng theo ngành | Cột "Ngành" bằng chữ, không tô nền hàng theo ngành |
| Sidebar accent | Kèm tên ngữ cảnh dạng chữ ở đầu sidebar ("Đang xem: **Ngành Ấu Nhi**") |

**Điều này trùng khớp với ràng buộc chủ dự án đã nêu** — *"Không dùng màu sắc làm tín hiệu duy nhất cho trạng thái hoặc quyền"* —
tài liệu này chỉ mở rộng nó sang **ngành**, và cung cấp số đo chứng minh vì sao bắt buộc.

### 5.2 Giảm nhẹ quan trọng

Trong kiến trúc theme đề xuất (`04_THEME_ARCHITECTURE_OPTIONS.md`), **mỗi lúc chỉ có MỘT màu ngành trên màn hình**.
Người dùng không phải phân biệt 6 màu cạnh nhau — họ chỉ thấy màu của ngữ cảnh hiện tại.

⇒ Vấn đề ở §5 **chỉ ảnh hưởng các màn hình đa ngành**: danh sách 19 lớp, biểu đồ so sánh, báo cáo toàn xứ đoàn,
danh sách thiếu nhi toàn xứ. Đúng những chỗ mà quy tắc "luôn kèm chữ" ở §5.1 áp dụng.

---

## 6. Biểu đồ đa ngành — ✅ CHỐT: **dùng thẳng màu ngành**

> **Quyết định của chủ dự án 2026-07-23 (Q-09):** dùng màu ngành như bình thường cho biểu đồ,
> không xây bộ màu riêng, không tối ưu cho mù màu.

### Kiểm lại sau khi có quyết định — kết quả tốt hơn dự kiến

Quyết định **Q-06 (N-3)** ở §8 — đẩy Nghĩa Sĩ sang `#C48401` sáng và Hiệp Sĩ sang `#7A5136` sẫm —
đã **tự giải quyết** vấn đề phân biệt ở thị lực bình thường:

| Bộ màu dùng cho biểu đồ | Số cặp ΔE<0,15 |
|---|--:|
| **5 ngành giáo lý, bảng màu đã duyệt (A + N-3)** | **0/10** ✅ |
| Bảng màu A **trước khi** áp N-3 | 6/15 ✖ |
| 6 màu (thêm Huynh Trưởng) | 1/15 — chỉ Chiên Con ↔ Huynh Trưởng (ΔE 0,077) |

Cặp gần nhất trong 5 ngành: Chiên Con ↔ Hiệp Sĩ **ΔE = 0,175** — trên ngưỡng an toàn.

⇒ **Không cần bộ màu biểu đồ riêng.** Bảng màu đã duyệt dùng thẳng được.

### Hai ràng buộc kỹ thuật vẫn giữ

| # | Ràng buộc | Lý do (không liên quan mù màu) |
|---|---|:--|
| **B-1** | 🔴 **Không dùng bậc `pastel` làm màu chuỗi biểu đồ** — dùng bậc `primary` đặc | Đo được: 5 màu pastel cho **10/10 cặp dễ nhầm** (ΔE 0,043–0,091). Pastel quá nhạt để phân biệt ở dạng đường mảnh hoặc cột nhỏ |
| **B-2** | **Nhãn trực tiếp trên đường/cột**, không chỉ dựa vào chú giải màu | Chuẩn đọc biểu đồ: mắt phải liếc qua lại giữa chú giải và đồ thị. Áp cho **mọi** biểu đồ, kể cả một màu |

### Nếu biểu đồ có cả Huynh Trưởng

Chiên Con `#C34C7C` và Huynh Trưởng `#CE4846` gần nhau (ΔE 0,077). Trong thực tế hiếm gặp —
biểu đồ so sánh thường là **5 ngành giáo lý**, còn Huynh Trưởng là nhân sự.

Nếu cần vẽ chung: dùng `#111827` (gần đen) cho chuỗi Huynh Trưởng — nó không phải một ngành giáo lý
nên không cần trung thành màu khăn trong ngữ cảnh biểu đồ.

### Ghi nhận về mù màu

Chủ dự án đã chọn **không xử lý** mù màu cho biểu đồ. Ghi lại để Giai đoạn 3 không coi là thiếu sót:
với người mù lục, các cặp ngành vẫn khó phân biệt (`§5`). **B-2 (nhãn trực tiếp) là biện pháp giảm nhẹ
duy nhất còn lại**, và nó đủ để đọc được biểu đồ mà không cần phân biệt màu.

---

## 7. Token trung tính và token trạng thái — thay thế bộ hiện tại

Đây là phần **không thuộc ngành**, dùng chung cho toàn hệ thống, không đổi theo theme.

| Token | Giá trị | Đo được | Thay cho |
|---|---|--:|---|
| `--bg-page` | `#FFFBF7` | — | `--background: #FFF9F4` (ấm hơn một chút, sáng hơn) |
| `--bg-surface` | `#FFFFFF` | — | `--card`, `--surface` |
| `--bg-surface-muted` | `#FBF5EF` | — | `--surface-muted` |
| `--text` | `#2E2A27` | **13,81:1** / nền trang | `--text: #3F342F` (11,53:1) |
| `--text-muted` | `#5C534D` | **7,28:1** / nền trang | `--text-muted: #756861` (5,14:1) |
| `--border` | `#EDE4DC` | 1,22:1 — **đường phân cách trang trí, không cần 3:1** | `--border: #EEDFD5` |
| `--border-strong` | `#8C7F76` | **3,77:1** / nền trang | **mới** — viền ô nhập, bắt buộc theo WCAG 1.4.11 |
| `--success` | `#1E7A50` | **5,31:1** / trắng · **4,77:1** / subtle | `--success: #4F9D76` (3,01:1 ❌) |
| `--success-subtle` | `#E8F6EF` | — | `--success-surface` |
| `--warning` | `#8A5A00` | **5,93:1** / trắng · **5,43:1** / subtle | `--warning: #D99A2B` (2,28:1 ❌) |
| `--warning-subtle` | `#FFF4DC` | — | `--warning-surface` |
| `--danger` | `#B3261E` | **6,54:1** / trắng · **5,72:1** / subtle | `--danger: #D95C5C` (3,37:1 ❌) |
| `--danger-subtle` | `#FDECEA` | — | `--danger-surface` |
| `--info` | `#1F5E9E` | **6,66:1** / trắng · **5,83:1** / subtle | **mới** |
| `--info-subtle` | `#E8F1FA` | — | **mới** |

**Toàn bộ 16 cặp trên đã được đo và ĐẠT.** Năm cặp trượt của hệ hiện tại (`01_CURRENT_UI_AUDIT.md` §3.1) được giải quyết triệt để.

### ⚠️ Màu trạng thái **không được** trùng màu ngành

Đây là ràng buộc chủ dự án nêu và tài liệu này khẳng định lại kèm rủi ro cụ thể:

| Xung đột thật | Rủi ro |
|---|---|
| `--success` xanh lá `#1E7A50` ↔ Ấu Nhi `#378630` | Badge "Đã chốt" và chip "Ấu Nhi" trông giống nhau |
| `--danger` đỏ `#B3261E` ↔ Huynh Trưởng `#CE4846` | Nút "Xoá" và nút chính của theme Huynh Trưởng cùng đỏ |
| `--warning` vàng `#8A5A00` ↔ Nghĩa Sĩ `#A16C01` | Cảnh báo và chip "Nghĩa Sĩ" trông giống nhau |

**Cách xử lý bắt buộc:**
1. Trạng thái **luôn có icon riêng** (✓ / ⚠ / ✕ / ℹ) — hình dạng khác nhau, không chỉ màu.
2. Chip ngành dùng **kiểu dáng khác hẳn** badge trạng thái: chip ngành có **chấm tròn đặc + viền nhạt + nền `subtle`**;
   badge trạng thái **nền đặc hoặc viền đậm + icon**.
3. Nút `danger` giữ **màu đỏ hệ thống `#B3261E`**, không dùng `primary` của theme — kể cả khi theme là Huynh Trưởng.
   Ở theme Huynh Trưởng, nút "Xoá" phải phân biệt được với nút "Lưu" bằng **chữ và vị trí**, và nút "Xoá" phải là `outline` viền đỏ.

---

## 8. Vấn đề riêng của **Nghĩa Sĩ — "vàng nghệ"**

Vàng là màu **bản chất sáng**. Để nền vàng mang được chữ trắng ở 4,5:1, nó phải bị làm tối tới `#A16C01` —
lúc đó nó **không còn trông là vàng nghệ nữa**, mà là nâu vàng, và **đụng Hiệp Sĩ (nâu đất)**.

Ba lựa chọn:

| | Cách | primary | Chữ trên nút | Giữ đúng "vàng nghệ"? | ΔE với Hiệp Sĩ |
|---|---|---|---|:--:|--:|
| **N-1** | Làm tối để mang chữ trắng | `#A16C01` | trắng | ✖ trông như nâu | 0,050 ✖ |
| **N-2** ⭐ | Nền sáng + **chữ đậm `#2E2A27`** | `#C48401` | đậm (4,50:1 ✅) | ✅ **vẫn là vàng nghệ** | 0,110 ⚠ |
| **N-3** | N-2 + đẩy Hiệp Sĩ nâu sẫm `#7A5136` | `#C48401` | đậm | ✅ | **0,225** ✅ |

**Khuyến nghị: N-3.**

Hệ quả kỹ thuật: token `foreground-on-primary` **phải là biến theo ngành**, không phải hằng số `#FFFFFF`.
Component `Button` đọc `var(--theme-on-primary)`. Đây là lý do bộ token ngành có riêng token này —
xem `05_GLOBAL_COMPONENT_SYSTEM.md` §2.

> Cần chủ dự án duyệt: chấp nhận nút chính của **riêng ngành Nghĩa Sĩ** có chữ đậm thay vì chữ trắng?
> Xem `07_DECISIONS_REQUIRED.md` Q-02.

---

## 9. Nơi lưu bảng màu — **KHÔNG lưu trong database**

| Phương án | Đánh giá |
|---|---|
| Thêm cột `sectors.theme_color` | ✖ **Không.** Chủ dự án đã nêu: *"Không thêm cột màu vào từng người dùng nếu màu có thể suy ra từ ngành."* Nguyên tắc đó cũng áp cho bảng `sectors`: màu là **quyết định trình bày**, không phải dữ liệu nghiệp vụ. Đổi màu sẽ phải chạy migration |
| **Map trong TypeScript, khoá theo `sectors.code`** ⭐ | ✅ `sectors.code` là hằng đã seed (`CHIEN_CON`, `AU_NHI`, `THIEU_NHI`, `NGHIA_SI`, `HIEP_SI`) và **bất biến** (`sectors` chỉ có quyền SELECT cho `authenticated`). Đổi màu = sửa 1 file, không migration, không đụng dữ liệu |

**Đề xuất:** `src/lib/theme/sector-palette.ts` — một `Record<SectorCode | "HUYNH_TRUONG", SectorTokens>`,
kèm **unit test canh** rằng mọi `sectors.code` trong seed đều có mục tương ứng (theo đúng khuôn mẫu tốt nhất
dự án đã có: `04_SYSTEM_WIDE_FINDINGS.md` điểm mạnh #8 — *"danh sách đường dẫn hợp lệ canh bằng kiểm thử so cả nội dung lẫn số lượng"*).

---

## 10. Tóm tắt những gì cần chủ dự án duyệt

| # | Nội dung | Chi tiết ở |
|---|---|---|
| 1 | Chọn Phương án **A** (truyền thống đậm) hay **B** (ấm dịu) | §4 |
| 2 | Ngành Nghĩa Sĩ: chấp nhận nút chính **chữ đậm** để giữ đúng "vàng nghệ"? (N-3) | §8 |
| 3 | Biểu đồ đa ngành: dùng **bộ màu riêng** hay dùng luôn màu ngành? | §6 |
| 4 | Xác nhận: bảng màu này là **quyết định của dự án**, không phải quy định của Phong trào TNTT | §1.3 |
| 5 | Xác nhận nguyên tắc: **màu ngành luôn đi kèm chữ**, không bao giờ đứng một mình | §5.1 |
