# 02 — Bốn hướng thiết kế đề xuất

> Chủ dự án chọn **một** hướng. Hướng được chọn quyết định typography, radius, spacing, shadow, icon,
> và cách 21 component mới ở `05_GLOBAL_COMPONENT_SYSTEM.md` được tạo hình.
>
> **Cả bốn hướng đều bắt buộc:** nền tổng thể trung tính · màu ngành chỉ dùng làm điểm nhấn ·
> không dark mode (D-5) · vùng chạm ≥44px · WCAG AA · không dùng màu làm tín hiệu duy nhất.
> Bốn hướng khác nhau ở **cảm xúc và mật độ**, không khác nhau ở nguyên tắc.

---

## Bảng so sánh nhanh

| | A · Sân Giáo Xứ | B · Khăn Quàng | C · Sổ Tay Giáo Lý | D · Trong Trẻo |
|---|---|---|---|---|
| Cảm xúc | Ấm, quen thuộc, an toàn | Tự hào, có bản sắc TNTT | Tin cậy, rõ ràng, nghiêm túc | Hiện đại, gọn, chuyên nghiệp |
| Mức "cute" | **3/5** | **4/5** | **2/5** | **2/5** |
| Hợp người không rành công nghệ | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★★☆☆ |
| Nhận ra ngay là "của TNTT" | ★★☆☆☆ | ★★★★★ | ★★☆☆☆ | ★☆☆☆☆ |
| Rủi ro thiếu nhất quán | Thấp | **Cao** | Thấp | Thấp |
| Khoảng cách với mã hiện tại | **Gần nhất** | Xa | Vừa | Vừa |
| Chi phí triển khai | **Thấp** | Cao | Vừa | Vừa |
| Hợp màn hình nhiều dữ liệu (bảng điểm, roster 50 em) | Khá | Kém | **Tốt nhất** | Tốt |
| **Khuyến nghị của nhóm** | ✅ **Chọn A**, mượn 2 chi tiết của B | | | |

---

## Hướng A — **"Sân Giáo Xứ"** ✅ *khuyến nghị*

### Cảm xúc
Bước vào sân nhà thờ buổi chiều Chúa nhật: nắng ấm, có bóng cây, mọi thứ ở đúng chỗ quen thuộc.
Không long trọng, không trẻ con. Người dùng cảm thấy **được đón tiếp**, không cảm thấy đang dùng phần mềm.

Đây là **tiến hoá** từ giao diện hiện tại chứ không phải làm lại: giữ tinh thần cam/da người ấm lấy từ logo
(D-79 yêu cầu giữ), sửa phần chưa đạt, bổ sung phần còn thiếu.

### Thông số

| Hạng mục | Quy định |
|---|---|
| **Typography** | Be Vietnam Pro (thiết kế cho tiếng Việt, dấu cân đối). Thang: 12 / 14 / **16 (body)** / 18 / 20 / 24 / 30. Weight chỉ dùng 400 · 500 · 600. Số liệu dùng `font-variant-numeric: tabular-nums` |
| **Radius** | `sm 8` · `md 12` · **`lg 16` (thẻ)** · `xl 20` (thẻ lớn, dialog) · `full` (badge, avatar, chip) |
| **Spacing** | Thang 4px. Padding thẻ **20px** (mobile 16px). Khoảng cách giữa section **24px**. Dòng danh sách **12px dọc** |
| **Shadow** | Hai mức duy nhất: `sm` (thẻ nghỉ — rất nhẹ, gần như chỉ có viền) và `md` (nổi: dialog, dropdown, drawer). **Không có mức thứ ba** |
| **Icon** | lucide, `stroke-width: 1.75` (mặc định 2 → hơi gắt). Kích thước 16 / 20 / 24 |
| **Button** | Bo `md`. Primary = nền màu chủ đề + chữ trắng. Secondary = nền kem + chữ đậm. Outline = viền + nền trắng. Ghost. Danger. **Mọi size cao ≥44px** (giữ nguyên quy tắc hiện tại) |
| **Table** | Viền ngang nhẹ, **không viền dọc**. Header nền kem, chữ 14px semibold. Hàng cao 48px. Cột đầu `sticky`. Hover nền kem nhạt |
| **Form** | Label **trên** ô nhập, 14px semibold. Ô nhập cao 44px, bo `md`, viền `border-strong` (≥3:1). Lỗi hiện **dưới ô**, chữ đỏ + icon. Nhóm trường trong `<fieldset>` có `<legend>` |
| **Navigation** | Sidebar 264px nền trắng. Mục đang chọn: **nền `primary-subtle` + thanh dọc 3px màu chủ đề bên trái + chữ `accent-text`** (ba tín hiệu, không chỉ màu) |
| **Dashboard** | Lưới thẻ số liệu 2 cột (mobile) / 4 cột (desktop). Số lớn 30px tabular. Dưới là 1–2 khối danh sách |
| **Chuyển động** | Chỉ 3 loại: hiện/ẩn (150ms), trượt drawer/sheet (200ms), nhấn nút (100ms). Tất cả `ease-out`. Tôn trọng `prefers-reduced-motion` |

### "Cute" đến từ đâu
- Bo góc 16px ở thẻ + **20px ở dialog**
- **Empty state có minh hoạ đường nét đơn giản** (mặt trời, cuốn sổ, cái chuông) — nét mảnh, một màu, không hoạt hình
- Chip ngành bo tròn hoàn toàn
- Nền kem `#FFFBF7` thay vì trắng lạnh
- Câu chữ thân thiện: *"Chưa có em nào trong lớp Ấu 1A của bạn"* thay vì *"Không có dữ liệu"*

### Ví dụ áp dụng

| Module | Trước | Sau |
|---|---|---|
| M14 sidebar | Chân sidebar là chữ tạm "P0-T3" | Chân sidebar là **khối tài khoản + nút Đăng xuất** |
| M05 điểm danh | 2 `<select>` × 50 em | **Segmented control** 2 lựa chọn, nút "…" cho 3 trạng thái đuôi dài |
| M03 danh sách | `<p>` "Chưa có hồ sơ…" | `EmptyState` có minh hoạ + nút "Thêm thiếu nhi" (nếu có quyền) |
| M13 cổng phụ huynh | Không có lối vào | Thẻ **"Con của tôi"** bo 16px, ảnh đại diện chữ cái đầu, chip lớp màu ngành |

### Ưu / nhược

| Ưu | Nhược |
|---|---|
| Rẻ nhất — token đổi giá trị, cấu trúc component giữ nguyên | Không có "khoảnh khắc wow" |
| Rủi ro hồi quy thấp nhất | Bản sắc TNTT thể hiện nhạt hơn hướng B |
| Đúng tinh thần D-79 (giữ hệ màu cam ấm, chỉ chỉnh độ đậm) | |
| Hợp cả GLV ngoài sân lẫn Thư ký trên laptop | |

---

## Hướng B — **"Khăn Quàng"**

### Cảm xúc
Nhìn vào là biết ngay đây là hệ thống của Thiếu Nhi Thánh Thể. Màu ngành **hiện diện rõ** ở đầu trang
dưới dạng một **dải màu mỏng** như mép khăn quàng, kèm hoa văn thánh giá rất mờ ở góc thẻ tiêu đề.

### Thông số (chỉ nêu điểm khác hướng A)

| Hạng mục | Quy định |
|---|---|
| Typography | Như A, nhưng heading dùng weight **700** để cân với dải màu đậm |
| Radius | Như A |
| Shadow | Như A |
| **Header** | Dải màu ngành cao **4px** chạy hết chiều ngang, ngay dưới header. Đổi màu theo ngữ cảnh ngành |
| **Sidebar** | Nền **`primary-subtle` của ngành** thay vì trắng; mục đang chọn nền trắng đặc |
| **Card tiêu đề trang** | Nền `primary-subtle`, viền trái 4px màu chủ đề |
| **Chip ngành** | To hơn, có **chấm màu + tên ngành**, xuất hiện ở mọi nơi có dữ liệu thuộc ngành |
| Chuyển động | Dải màu ngành **chuyển màu 250ms** khi đổi ngữ cảnh ngành — tín hiệu thị giác rất rõ |

### Ưu / nhược

| Ưu | Nhược |
|---|---|
| **Bản sắc TNTT mạnh nhất** — chủ dự án nêu đây là môi trường giáo xứ | 🔴 **Rủi ro cao nhất về nhất quán**: 6 sidebar khác màu nền ⇒ chụp màn hình 2 ngành trông như 2 sản phẩm |
| Người dùng nhiều ngành biết ngay mình đang ở ngành nào | 🔴 Vi phạm tinh thần *"nền tổng thể trung tính"* mà chính chủ dự án đặt ra |
| Đẹp trên ảnh giới thiệu | Sidebar màu làm giảm tương phản chữ mục menu — phải kiểm lại 6 lần |
| | Màn hình **đa ngành** (danh sách 19 lớp, báo cáo toàn xứ đoàn) không biết tô màu gì |
| | Chi phí cao: mỗi component phải kiểm trên 6 nền khác nhau |

> **Đề xuất của nhóm:** không chọn B toàn phần, nhưng **mượn dải màu 4px dưới header** đưa vào hướng A.
> Nó cho 90% giá trị nhận diện với 10% rủi ro.

---

## Hướng C — **"Sổ Tay Giáo Lý"**

### Cảm xúc
Một cuốn sổ điểm danh giấy được số hoá cẩn thận. Ưu tiên tuyệt đối cho **đọc được** và **không bấm nhầm**.
Ít màu, chữ to, ranh giới rõ. Trông như biểu mẫu hành chính đẹp.

### Thông số

| Hạng mục | Quy định |
|---|---|
| **Typography** | Body **17px** (không phải 16). Thang 14 / 15 / 17 / 20 / 24 / 28 / 34. Line-height 1,6. Heading weight 600, không dùng 700 |
| **Radius** | `sm 6` · `md 8` · `lg 10`. **Bo ít** — cạnh dứt khoát như giấy kẻ ô |
| **Spacing** | Thang 4px nhưng **rộng hơn A ~25%**: padding thẻ 24px, dòng danh sách 16px dọc |
| **Shadow** | **Không dùng shadow cho thẻ** — chỉ dùng viền 1px. Shadow chỉ cho lớp nổi (dialog, dropdown) |
| **Icon** | lucide `stroke-width: 2`, kích thước 20/24 — to và rõ |
| **Button** | Bo `md`, cao **48px** (không phải 44). Chữ 16px |
| **Table** | **Có viền đầy đủ** cả ngang lẫn dọc, như bảng giấy. Hàng chẵn/lẻ nền xen kẽ. Hàng cao 52px |
| **Form** | Label trên, 15px. Ô nhập cao 48px. **Trường bắt buộc có dấu ✱ đỏ và chữ "bắt buộc"** |
| **Navigation** | Sidebar 280px, mục cao 48px, chữ 16px, icon 24px |
| **Dashboard** | Ít thẻ hơn, mỗi thẻ to hơn, chữ nhãn 15px |

### Ưu / nhược

| Ưu | Nhược |
|---|---|
| ★★★★★ cho **phụ huynh lớn tuổi** và Cha sở — nhóm quan trọng nhất | Mức "cute" thấp nhất — chủ dự án nêu rõ muốn "cute trang nhã" |
| Tốt nhất cho màn hình dày dữ liệu (bảng điểm 50 em × 8 cột) | Chữ 17px + spacing rộng ⇒ **cuộn nhiều hơn ~20%** trên 360px |
| Hạ tỷ lệ thao tác nhầm | Trẻ trung? Không |
| Rẻ để kiểm thử a11y | |

> **Đề xuất của nhóm:** không chọn C làm hướng chính, nhưng **áp dụng thông số C cho cổng phụ huynh và cổng
> thiếu nhi (M13)** — nơi người dùng lớn tuổi nhất và ít thao tác nhất. Xem `07_DECISIONS_REQUIRED.md` Q-04.

---

## Hướng D — **"Trong Trẻo"**

### Cảm xúc
Phần mềm quản lý hiện đại chuẩn mực: nền trắng lạnh, xám trung tính, một màu nhấn duy nhất, rất nhiều khoảng trắng.

### Thông số

| Hạng mục | Quy định |
|---|---|
| Typography | Inter. Body 15px. Thang 12/13/15/16/18/22/28. Weight 400/500/600 |
| Radius | `sm 6` · `md 8` · `lg 12` |
| Spacing | Thang 4px, padding thẻ 16px — **gọn nhất** |
| Shadow | Gần như không dùng; phân tầng bằng nền xám nhạt |
| Icon | lucide 16/20, `stroke-width: 1.5` |
| Nền | **`#FFFFFF` + `#F8FAFC`** — trắng lạnh, không kem |
| Table | Kiểu bảng tính: viền rất nhạt, hàng cao 40px, mật độ cao |

### Ưu / nhược

| Ưu | Nhược |
|---|---|
| Hiện đại nhất, gọn nhất | 🔴 **Trái định hướng của chủ dự án** — "ấm áp", "cute trang nhã", "thân thiện" |
| Hiển thị được nhiều dữ liệu nhất trên một màn | 🔴 **Trái D-79** — D-79 yêu cầu *giữ tinh thần màu cam/da người ấm từ logo* |
| Dễ tìm tài liệu tham khảo | Lạnh; không gợi gì tới giáo xứ |
| | Mật độ cao ⇒ vùng chạm dễ tuột xuống dưới 44px |

> Đưa vào đây để so sánh cho đủ. **Nhóm không khuyến nghị D** vì mâu thuẫn trực tiếp với hai ràng buộc đã chốt.

---

## Khuyến nghị tổng hợp của nhóm

**Chọn hướng A "Sân Giáo Xứ", cộng hai chi tiết vay mượn:**

1. **Từ B:** dải màu ngành cao 4px ngay dưới header, đổi theo ngữ cảnh ngành.
   Cho nhận diện TNTT rõ ràng mà **không** đụng vào nền sidebar hay nền trang.
2. **Từ C:** riêng cổng phụ huynh và cổng thiếu nhi (M13) dùng thang chữ lớn hơn một bậc
   (body 17px, nút 48px) vì đó là nhóm người dùng lớn tuổi nhất.

### Vì sao

| Lý do | Giải thích |
|---|---|
| Đúng ràng buộc đã chốt | D-79 yêu cầu **giữ** hệ màu cam ấm, chỉ chỉnh độ đậm. A là hướng duy nhất làm đúng điều đó |
| Rẻ và ít rủi ro nhất | 21 component mới đã là khối lượng lớn; không nên cộng thêm rủi ro đổi toàn bộ ngôn ngữ thị giác |
| `04_SYSTEM_WIDE_FINDINGS.md` xếp tương phản/cỡ chữ ở **Đợt 5** | Nghiệp vụ đi trước. Hướng A cho phép tách rời: token sửa ngay, tạo hình từ từ |
| Hệ thống đang **"chưa tới"**, không phải "quá đà" | Việc cần làm là bổ sung và chuẩn hoá |

---

## Điều cả bốn hướng đều phải tuân thủ

1. Nền tổng thể **trung tính**. Màu ngành **không** dùng làm nền trang.
2. Màu ngành chỉ xuất hiện ở: dải header · thanh chỉ mục đang chọn ở sidebar · nút chính · tab đang chọn ·
   chip ngành · focus ring · điểm nhấn biểu đồ.
3. **Không** dùng màu làm tín hiệu duy nhất — mọi trạng thái, vai trò, ngành đều phải có **chữ hoặc icon** đi kèm.
   Lý do định lượng ở `03_BRANCH_COLOR_RESEARCH.md` §5.
4. Cấu trúc trang **giống hệt nhau** giữa các ngành. Chỉ màu nhấn đổi.
5. Vùng chạm ≥44px. Không chặn zoom. `prefers-reduced-motion` được tôn trọng.
6. Không tạo bản sao component cho từng ngành. **Một component, nhận token ngữ nghĩa.**
