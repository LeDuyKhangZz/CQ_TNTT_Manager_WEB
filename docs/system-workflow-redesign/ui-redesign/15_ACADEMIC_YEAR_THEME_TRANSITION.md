# 15 — Chuyển năm học và ảnh hưởng tới theme

> Trả lời yêu cầu #13, #14, #15 của chủ dự án: theme phải tự đổi khi chuyển năm học,
> **không** đổi sớm, **không** ghi đè lịch sử, **không** phải sửa tay từng tài khoản.
>
> Liên quan: D-73 (chỉ Super Admin đóng năm học) · M02-F09 (`CRITICAL` — quy trình đóng năm học **chưa cài bước nào**) ·
> CM-06 · Đợt 4 hạng mục 4.3.

---

## 1. Bối cảnh: quy trình đóng/mở năm học hiện **chưa tồn tại**

Đây là điều phải nói trước, vì nó quyết định thứ tự công việc.

| Sự thật | Nguồn |
|---|---|
| Trạng thái năm học có 3 giá trị: `draft` / `current` / `archived` | `academic_years.status` |
| Chỉ **một** năm được `current` tại một thời điểm | unique index `academic_years_one_current_idx` (`20260715000200:24-25`) |
| RPC `set_current_academic_year()` **đã có** | `20260715000200:234` |
| Quy trình **đóng** năm học | 🔴 **chưa cài bước nào** — M02-F09, điểm 21/75 |
| Chốt chặn ngăn ghi vào năm đã đóng | 🔴 **không có** — năm `archived` vẫn ghi được bình thường |
| `previous_enrollment_id` để nối ghi danh cũ ↔ mới | 🔴 **chưa bao giờ được ghi giá trị** (SW-11) |

⇒ **Theme động phụ thuộc vào một quy trình chưa tồn tại.** Nhưng — điểm quan trọng —
theme **không cần chờ** quy trình đó, vì nó chỉ đọc `status = 'current'`, thứ đã hoạt động đúng.

**Thứ tự đúng:**

| Bước | Việc | Đợt |
|---|---|---|
| 1 | Theme resolver đọc `status='current'` | Đợt 2 (nền tảng) |
| 2 | Quy trình đóng năm học đầy đủ (D-73) | Đợt 4, hạng mục 4.3 |
| 3 | Nối theme vào quy trình đóng năm (§4 dưới đây) | Đợt 4, **cùng lúc với bước 2** |

Làm bước 1 trước là an toàn: nếu chưa có năm `current`, resolver trả `HUYNH_TRUONG` +
`fallbackReason = 'NO_CURRENT_ACADEMIC_YEAR'` và hiện banner. Không hỏng gì.

---

## 2. Ba mốc thời gian — và vì sao chúng khác nhau

Chủ dự án nêu: *"Không đổi theme ngay chỉ vì đã có dữ liệu dự kiến cho năm học kế tiếp."*
Điều đó đòi hỏi phân biệt ba mốc, mà hệ thống hiện **gộp làm một**:

| Mốc | Nghĩa | Có trong schema? |
|---|---|:--:|
| **M1 · Chuẩn bị** | Tạo năm học mới (`status='draft'`), sinh 19 lớp, phân công GLV, xếp lớp thiếu nhi | ✅ |
| **M2 · Kích hoạt** | `set_current_academic_year()` — năm mới thành `current`, năm cũ thành `archived` | ✅ |
| **M3 · Hiệu lực phân công** | `class_staff_assignments.starts_on <= hôm nay` và `is_active` | ✅ |

**Theme chỉ đổi khi M2 **và** M3 đều thoả.** Đây chính là điều kiện 3 và 4 ở `12_DYNAMIC_THEME_BUSINESS_RULES.md` §3.1.

### Vì sao lọc theo `academic_year_id = năm 'current'` là đủ

Một phân công thuộc năm học mới trỏ tới `classes` của năm học mới.
Khi năm học mới còn `draft`, truy vấn `... join classes on classes.academic_year_id = ay.id where ay.status='current'`
**không khớp** dòng nào ⇒ phân công dự kiến tự động bị loại. **Không cần cột cờ nào thêm.**

⚠️ **Một cạm bẫy phải tránh:** nếu ai đó tạo `class_staff_assignment` mới **trước khi đóng năm cũ**,
unique index `class_staff_one_active_class_per_staff_idx` sẽ **chặn** vì GLV đó vẫn còn phân công cũ active.
⇒ Quy trình chuẩn bị năm mới **bắt buộc phải đóng phân công cũ trước**. Xem §4.

---

## 3. Bốn loại "ngành" trong một tài khoản

| Loại | Truy vấn | Dùng ở đâu | Có ảnh hưởng theme? |
|---|---|---|:--:|
| Ngành **hiện hành** | phân công hiệu lực ∩ năm `current` | App shell | ✅ **Có** |
| Ngành **năm trước** | phân công ∩ năm `archived` gần nhất | Tab "Lịch sử lớp", báo cáo cũ | ❌ Chỉ hiện chip |
| Ngành **dự kiến năm sau** | phân công ∩ năm `draft` | Màn hình chuẩn bị năm học của Super Admin | ❌ **Tuyệt đối không** |
| **Lịch sử đầy đủ** | mọi dòng `order by starts_on desc` | Hồ sơ nhân sự / hồ sơ em | ❌ Chỉ hiện chip |

**Ba loại sau chỉ được hiển thị dưới dạng chip/nhãn, không bao giờ đổi màu app shell.**

---

## 4. Quy trình chuyển năm học — đề xuất (đưa vào Đợt 4, hạng mục 4.3)

> Đây là đề xuất bổ sung cho quy trình đóng năm học vốn phải xây từ đầu (M02-F09).
> Phần liên quan tới theme được đánh dấu 🎨.

### Giai đoạn 1 — Chuẩn bị (năm mới `draft`)

| # | Bước | Ai | Ghi nhật ký (D-65) |
|---|---|---|:--:|
| 1.1 | Tạo năm học mới, đặt ngày bắt đầu/kết thúc, **ngày kết thúc học kỳ 1** (D-71) | Super Admin | ✅ |
| 1.2 | Sinh 19 lớp — **báo lỗi nếu danh mục mẫu trống** (sửa M02-F02) | Super Admin | ✅ |
| 1.3 | 🎨 **Báo cáo tiền kiểm**: liệt kê GLV chưa có phân công dự kiến, thiếu nhi chưa xếp lớp | hệ thống | — |
| 1.4 | Phân công GLV vào lớp năm mới | Thư ký / cấp xứ đoàn | ✅ |
| 1.5 | Xếp lớp thiếu nhi (qua duyệt chuyển lớp M08, hoặc ghi danh trực tiếp) | theo phân quyền | ✅ |
| 1.6 | 🎨 **Xem trước theme**: bảng "sau khi kích hoạt, ai sẽ đổi sang màu nào" | hệ thống | — |

**1.6 là màn hình mới, giá trị cao:** cho Super Admin thấy trước hậu quả trước khi bấm nút không quay lại được.

```
Sau khi kích hoạt năm học 2027–2028:

  40 Giáo lý viên     →  12 người đổi ngành      [Xem danh sách]
  912 thiếu nhi       →  198 em đổi ngành        [Xem danh sách]
  ⚠ 6 Giáo lý viên chưa có phân công  →  sẽ mất màu ngành, hiện "Chưa phân công"
  ⚠ 23 thiếu nhi chưa xếp lớp          →  sẽ hiện "Chưa xếp lớp"
```

### Giai đoạn 2 — Kích hoạt (giao dịch nguyên tử)

Bắt buộc trong **một** giao dịch, chỉ Super Admin (D-73):

| # | Bước | Bắt buộc |
|---|---|---|
| 2.1 | Khoá: xác nhận **không có** buổi điểm danh chưa chốt và bảng điểm chưa khoá ở năm cũ | ✅ |
| 2.2 | Đóng mọi `class_staff_assignments` của năm cũ: `is_active=false`, `ends_on = ngày kết thúc năm cũ` | ✅ |
| 2.3 | Đóng mọi `enrollments` còn mở của năm cũ: `status='ended'`, `ended_on=…` | ✅ |
| 2.4 | 🎨 Kích hoạt phân công/ghi danh năm mới (`is_active=true`, `starts_on <= hôm nay`) | ✅ |
| 2.5 | Đặt năm cũ `status='archived'`, năm mới `status='current'` | ✅ |
| 2.6 | 🎨 `revalidatePath('/', 'layout')` — buộc mọi trang dựng lại với theme mới | ✅ |
| 2.7 | Ghi nhật ký thao tác (D-65) | ✅ |

**Thứ tự 2.2 → 2.4 quan trọng:** phải đóng phân công cũ **trước** khi kích hoạt cái mới,
nếu không unique index sẽ chặn (§2 cạm bẫy).

### Giai đoạn 3 — Sau kích hoạt

| # | Bước |
|---|---|
| 3.1 | 🎨 Báo cáo hậu kiểm: ai chưa có phân công · em nào chưa xếp lớp · phân công trùng/không hợp lệ |
| 3.2 | 🎨 **Không tự gán ngành nếu thiếu dữ liệu** — hiện trạng thái "Chưa phân công", để người phụ trách xử lý |
| 3.3 | Gửi thông báo cho GLV đổi ngành (M10) |
| 3.4 | Khoá ghi vào năm `archived` — trừ Super Admin (D-73) |

---

## 5. Người dùng nhìn thấy gì khi năm học đổi

| Người dùng | Trước | Sau (lần tải trang kế tiếp) |
|---|---|---|
| GLV giữ nguyên ngành | Xanh Ấu Nhi | Xanh Ấu Nhi — **không đổi**, chỉ năm học trên header đổi |
| GLV đổi từ Ấu sang Thiếu | Xanh lá | **Xanh dương** + thông báo *"Bạn đã được phân công lớp Thiếu 1A ngành Thiếu Nhi cho năm học 2027–2028"* |
| GLV chưa có phân công mới | Xanh lá | **Đỏ–vàng** + banner *"Hồ sơ của bạn chưa được phân công lớp cho năm học 2027–2028. Liên hệ Thư ký Xứ đoàn."* |
| Thiếu nhi Ấu 3 → Thiếu 1 | Xanh lá | **Xanh dương** |
| Phụ huynh của em đó | Xanh lá | **Xanh dương** — tự đổi, không thao tác gì |
| Phụ huynh 2 con khác ngành | Đỏ–vàng | Đỏ–vàng (không đổi), chip từng con cập nhật |
| Super Admin | Đỏ–vàng | Đỏ–vàng — **không bao giờ đổi** |

**Bắt buộc:** GLV/thiếu nhi đổi ngành phải nhận **thông báo bằng chữ**.
Đổi màu im lặng làm người dùng tưởng hệ thống lỗi — đúng loại vấn đề mà `06_DECISION_LOG.md`
đã cảnh báo với bốn thay đổi siết quyền.

---

## 6. Xem dữ liệu năm cũ — quy tắc bắt buộc

| Thành phần | Hành vi |
|---|---|
| App shell (header, sidebar, nút chính, dải màu) | **Giữ nguyên ngữ cảnh hiện tại.** Không đổi |
| `isViewingArchivedData` | `true` |
| Banner đầu nội dung | *"Đang xem dữ liệu năm học 2026–2027 (đã lưu trữ). Không thể chỉnh sửa."* |
| Chip ngành trên từng bản ghi | Theo ngành **của bản ghi lịch sử** |
| Nút thao tác ghi | **Ẩn hoặc vô hiệu**, kèm giải thích |

**Vì sao shell không đổi màu:** nếu đổi, người dùng tưởng mình đã chuyển ngữ cảnh làm việc sang năm cũ
và có thể thao tác nhầm. Màu là tín hiệu *"tôi đang làm việc ở đâu"*, không phải *"tôi đang nhìn gì"*.

---

## 7. Kiểm thử

### 7.1 Integration (Vitest + Supabase local)

| # | Kịch bản | Khẳng định |
|---|---|---|
| T1 | Tạo năm mới `draft` + phân công GLV sang ngành khác, **chưa kích hoạt** | Theme **vẫn là ngành cũ** |
| T2 | Kích hoạt năm mới | Theme đổi sang ngành mới **ngay ở lần giải quyết kế tiếp** |
| T3 | GLV không có phân công năm mới | `HUYNH_TRUONG` + `NO_ACTIVE_ASSIGNMENT` |
| T4 | Ấu 3 → Thiếu 1 | Theme em đổi `AU_NHI` → `THIEU_NHI` |
| T5 | Phụ huynh của em ở T4 | Theme đổi theo, **không** thao tác gì |
| T6 | Đọc dữ liệu năm cũ sau khi kích hoạt | Ngành lịch sử **vẫn đúng ngành cũ** |
| T7 | Phân công cũ `is_active=false` | **Không** xuất hiện trong resolver |
| T8 | Kích hoạt khi có phân công trùng | Giao dịch **thất bại**, không để trạng thái nửa vời |
| T9 | Không có năm `current` | `NO_CURRENT_ACADEMIC_YEAR`, không sập trang |
| T10 | Chạy resolver 100 lần trên dữ liệu nhiều ứng viên | Kết quả **giống hệt nhau** |

### 7.2 E2E (Playwright)

| # | Kịch bản |
|---|---|
| E1 | GLV đăng nhập → `[data-theme-key="AU_NHI"]` → admin kích hoạt năm mới → GLV **tải lại** → `THIEU_NHI`, **không** cần đăng xuất |
| E2 | Sau kích hoạt, GLV chưa phân công thấy banner "Chưa được phân công" |
| E3 | Phụ huynh thấy màu con đổi sau khi con lên ngành mới |
| E4 | Mở báo cáo năm cũ → shell giữ màu + banner "đã lưu trữ" |
| E5 | Màn hình xem trước theme (§4 bước 1.6) hiện đúng số người sẽ đổi ngành |

---

## 8. Điều cần chủ dự án duyệt

| # | Nội dung | Mục |
|---|---|---|
| 1 | Quy trình 3 giai đoạn (chuẩn bị → kích hoạt nguyên tử → hậu kiểm) | §4 |
| 2 | Màn hình **xem trước theme** trước khi kích hoạt — có làm không? | §4 bước 1.6 |
| 3 | **Gửi thông báo** cho GLV/thiếu nhi đổi ngành — xác nhận | §5 |
| 4 | Xem dữ liệu năm cũ **không** đổi màu shell — xác nhận | §6 |
| 5 | Theme resolver làm ở **Đợt 2**, nối vào quy trình đóng năm ở **Đợt 4** — xác nhận thứ tự | §1 |
