# 04 — Bốn phương án kiến trúc theme

> Trả lời Bước 5 của Giai đoạn 2A. Chi tiết hàm giải quyết theme nằm ở `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md`;
> quy tắc nghiệp vụ ở `12_DYNAMIC_THEME_BUSINESS_RULES.md`; bảng tình huống biên ở `14_THEME_EDGE_CASE_MATRIX.md`.

---

## 0. Ba ràng buộc từ schema — quyết định mọi thứ

Trước khi so sánh phương án, phải nêu ba sự thật đã kiểm từ migration. Chúng **thu hẹp không gian lựa chọn**.

### R-1 · Một tài khoản chỉ có **đúng một** vai trò đang hiệu lực

```sql
-- 20260715000100_identity_foundation.sql:86-88
create unique index role_assignments_one_active_per_profile_idx
on public.role_assignments(profile_id) where is_active;
```

⇒ Tình huống *"một tài khoản có nhiều role"* (GLV + Phụ huynh, Trưởng ngành + GLV, Admin + GLV)
**không tồn tại được trong cơ sở dữ liệu hiện tại**.

Cách hệ thống đang giải quyết: một người **vừa là GLV vừa là phụ huynh** có role `class_teacher`,
và quan hệ phụ huynh đến từ **dữ liệu** (`students.guardian_id` → `guardians.profile_id`), không từ role thứ hai.
Route `/parent` cố ý **không giới hạn role** (D-25) chính là để phục vụ tình huống này.

**⇒ Đây là kiến trúc đúng và nên giữ:** *role quyết định quyền · dữ liệu quyết định ngữ cảnh*.
Nó khớp chính xác với yêu cầu của chủ dự án — *"tách Authorization context khỏi Theme context"*.

### R-2 · Một Giáo lý viên chỉ có **đúng một** phân công lớp đang hiệu lực

```sql
-- 20260715000400_staff_and_class_assignments.sql:52-53
create unique index class_staff_one_active_class_per_staff_idx
on public.class_staff_assignments (staff_profile_id) where is_active;
```

⇒ Tình huống *"GLV phụ trách nhiều lớp"* (yêu cầu #4) và *"GLV phụ trách nhiều ngành"* (yêu cầu #5)
**cũng không tồn tại được** trong cơ sở dữ liệu hiện tại.

🔴 **Đây là điểm cần chủ dự án chốt trước khi làm gì thêm** — xem `07_DECISIONS_REQUIRED.md` **Q-01**.
Nếu thực tế giáo xứ có GLV dạy hai lớp, đây **không phải vấn đề giao diện** mà là **lỗi mô hình nghiệp vụ**
chưa được Giai đoạn 1 phát hiện, và phải xử lý trước Giai đoạn 2B.

### R-3 · Lớp **Dự trưởng không thuộc ngành nào**

```sql
-- 20260716000300_canonical_19_classes.sql:31-40
alter table public.classes alter column grade_level_id drop not null, ...
  add constraint classes_kind_shape check (
    (class_kind = 'trainee' and grade_level_id is null and section_code is null ...))
```

Ngành được suy ra qua `classes.grade_level_id → grade_levels.sector_id`.
Lớp Dự trưởng có `grade_level_id = NULL` ⇒ **không suy ra được ngành**.

**Cách xử lý:** `class_kind = 'trainee'` là một khoá theme riêng, ánh xạ tới bộ **Huynh Trưởng / Dự Trưởng (đỏ–vàng)**.
Trùng khớp đúng định hướng chủ dự án đã nêu.

---

## 1. Bốn phương án

### Phương án A — Theme cố định theo tài khoản

Lưu `profiles.theme_color` hoặc `profiles.sector_id`. Người dùng hoặc quản trị viên đặt một lần.

| | |
|---|---|
| Dễ hiểu | ★★★★★ — ai cũng hiểu ngay |
| Chi phí | Thấp nhất |
| Nhiều role | Không giải quyết |
| Nhiều ngành | Không giải quyết |
| Phụ huynh nhiều con | Không giải quyết |
| Bảo trì | ✖ **Xấu** — mỗi lần đổi ngành phải sửa tay từng tài khoản |
| Accessibility | Không ảnh hưởng |
| Rủi ro | 🔴 **Vi phạm trực tiếp ràng buộc bắt buộc của chủ dự án**: *"Không được lưu themeColor/branchTheme/primaryColor trên tài khoản làm nguồn sự thật"* |

> ✖ **Loại.** Đưa vào để so sánh cho đủ. Sau mỗi lần chuyển năm học, ~40 GLV và ~900 thiếu nhi sẽ **hiển thị sai màu**
> cho tới khi có người sửa tay từng hồ sơ.

---

### Phương án B — Theme theo vai trò chính / ngành của vai trò

Suy từ `role_assignments`: role ngành → `sector_id` trên chính dòng role; role lớp → `class_id` → ngành.

| | |
|---|---|
| Dễ hiểu | ★★★★☆ |
| Chi phí | Thấp — dữ liệu đã có sẵn trong `AuthContext` (`sectorId`, `classId`) |
| Nhiều role | Không cần giải quyết (R-1: chỉ một role) |
| Nhiều ngành | ✖ Không giải quyết |
| Phụ huynh nhiều con | 🔴 **Hỏng** — role `guardian` có `sector_id = NULL` và `class_id = NULL` theo ràng buộc `role_assignments_scope_matches_role`. Phụ huynh **không có ngành** trong bảng role |
| Thiếu nhi | 🔴 **Hỏng cùng lý do** — role `student` cũng không có scope |
| Bảo trì | Tốt — tự đổi khi đổi phân công |
| Rủi ro | Hai nhóm người dùng **đông nhất** (phụ huynh + thiếu nhi) không có theme |

> ✖ **Loại.** Hỏng đúng ở nhóm người dùng lớn nhất.

---

### Phương án C — Theme theo **ngữ cảnh dữ liệu đang thao tác**

Theme suy từ thứ người dùng **đang xem**: đang mở lớp Ấu 2A → theme Ấu Nhi; đang xem hồ sơ con đang học Thiếu 1B → theme Thiếu Nhi.

| | |
|---|---|
| Dễ hiểu | ★★★☆☆ — cần chỉ báo "đang xem ngành nào", nếu không sẽ thấy màu nhảy khó hiểu |
| Chi phí | Cao — mỗi trang phải khai báo ngữ cảnh của mình |
| Nhiều role | ✅ Giải quyết (theme không phụ thuộc role) |
| Nhiều ngành | ✅ Giải quyết |
| Phụ huynh nhiều con | ✅ Giải quyết — theme theo con đang chọn |
| Bảo trì | ✅ Tốt |
| Accessibility | ⚠ Màu đổi khi điều hướng ⇒ cần chuyển mềm và chỉ báo bằng **chữ** |
| Rủi ro | 🔴 **Màn hình đa ngành không có câu trả lời**: `/students` toàn xứ đoàn, `/reports`, `/classes` (19 lớp, 5 ngành), `/admin` — tô màu gì? |

> ⚠ **Đúng hướng nhưng chưa đủ.** Thiếu quy tắc cho màn hình đa ngành và cho trang không có ngữ cảnh ngành.

---

### Phương án D ⭐ — **Nền trung tính, chỉ accent đổi theo ngữ cảnh ngành, có fallback tường minh**

Là phương án C **cộng thêm ba thứ C còn thiếu**:

1. **Nền, chữ, thẻ, viền, màu trạng thái đều trung tính và không bao giờ đổi.** Chỉ ~8 điểm nhấn đổi màu.
2. **Ngữ cảnh ngành do một hàm duy nhất quyết định**, có thứ tự ưu tiên viết ra được và kiểm thử được
   (`13_THEME_CONTEXT_RESOLUTION_OPTIONS.md`).
3. **Màn hình đa ngành và trang chưa có ngữ cảnh dùng theme mặc định đỏ–vàng (Huynh Trưởng)**, có lý do ghi rõ trong `fallbackReason`.

| | |
|---|---|
| Dễ hiểu | ★★★★☆ — cấu trúc trang giống hệt nhau, chỉ điểm nhấn khác |
| Chi phí | Vừa — nhưng phần lớn chi phí là **một lần** ở resolver + token, không nhân theo module |
| Nhiều role | ✅ (R-1 làm cho vấn đề này không tồn tại) |
| Nhiều ngành | ✅ qua bộ chọn ngữ cảnh (nếu Q-01 mở đường) |
| Phụ huynh nhiều con | ✅ qua bộ chọn con |
| Bảo trì | ✅ **Tốt nhất** — một hàm, một bộ token, không logic màu rải rác |
| Accessibility | ✅ Tốt nhất — nền và chữ **không đổi** ⇒ tương phản chữ chính **luôn 13,81:1** bất kể ngành |
| Rủi ro giao diện thiếu nhất quán | ✅ **Thấp nhất** — chỉ 8 điểm nhấn đổi màu |
| Rủi ro | Cần kỷ luật: một component "quên" dùng token ngữ nghĩa là lộ ra ngay |

**Tám điểm nhấn duy nhất đổi theo ngành:**

| # | Nơi | Token |
|---|---|---|
| 1 | Dải màu 4px dưới header | `--theme-primary` |
| 2 | Thanh dọc 3px + nền mục sidebar đang chọn | `--theme-primary`, `--theme-subtle` |
| 3 | Nút chính (`Button variant="primary"`) | `--theme-primary`, `--theme-on-primary` |
| 4 | Tab đang chọn | `--theme-primary`, `--theme-accent-text` |
| 5 | Chip ngành | `--theme-subtle`, `--theme-accent-text` |
| 6 | Focus ring | `--theme-ring` |
| 7 | Hàng/thẻ đang được chọn | `--theme-selected-bg` |
| 8 | Đường/cột biểu đồ đơn ngành | `--theme-chart` |

**Mọi thứ khác trung tính:** nền trang, nền thẻ, chữ, viền, `success`/`warning`/`danger`/`info`, skeleton, overlay.

---

## 2. Bảng so sánh tổng hợp

| Tiêu chí | A · Cố định tài khoản | B · Theo role/ngành | C · Theo ngữ cảnh | **D · Trung tính + accent** ⭐ |
|---|:--:|:--:|:--:|:--:|
| Dễ hiểu với người không rành công nghệ | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| Khả năng mở rộng | ★☆☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★★★★ |
| Tài khoản nhiều role | ✖ | n/a (R-1) | ✅ | ✅ |
| Tài khoản nhiều ngành | ✖ | ✖ | ✅ | ✅ |
| Phụ huynh nhiều con | ✖ | 🔴 hỏng | ✅ | ✅ |
| Thiếu nhi | ✖ | 🔴 hỏng | ✅ | ✅ |
| Màn hình đa ngành | n/a | n/a | 🔴 **không có lời giải** | ✅ theme mặc định |
| Chuyển năm học tự đổi màu | ✖ **sửa tay ~940 hồ sơ** | ✅ | ✅ | ✅ |
| Khả năng bảo trì | ★☆☆☆☆ | ★★★☆☆ | ★★★☆☆ | ★★★★★ |
| Accessibility | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | ★★★★★ |
| Chi phí triển khai | Thấp | Thấp | Cao | **Vừa** |
| Rủi ro thiếu nhất quán | Cao | Cao | Cao | **Thấp** |
| Tuân thủ ràng buộc bắt buộc của chủ dự án | 🔴 **Vi phạm** | Một phần | Phần lớn | ✅ **Đầy đủ** |

---

## 3. Khuyến nghị của nhóm

> **Chọn Phương án D.**
>
> Đây là phương án **duy nhất** thoả mãn đồng thời cả bốn điều kiện:
> 1. Không lưu màu trên tài khoản (ràng buộc bắt buộc của chủ dự án).
> 2. Nền tổng thể trung tính, màu ngành chỉ là điểm nhấn (định hướng của chủ dự án).
> 3. Có lời giải cho **màn hình đa ngành** — thứ mà A, B, C đều bỏ ngỏ.
> 4. Giữ tương phản chữ **không đổi giữa 6 ngành** — điều kiện tiên quyết để đạt AA mà không phải kiểm 6 lần.

**Đây là đề xuất, không phải quyết định.** Chủ dự án chốt ở `07_DECISIONS_REQUIRED.md` **Q-06**.

---

## 4. Mười câu hỏi về theme — phân tích và đề xuất

> Chủ dự án yêu cầu **không tự quyết** mười điểm dưới đây. Mỗi mục có phân tích, phương án và đề xuất.
> Ô "cần chốt" tổng hợp lại ở `07_DECISIONS_REQUIRED.md`.

### 4.1 — Giáo lý viên phụ trách nhiều ngành thì theme theo ngành nào?

**Sự thật kỹ thuật:** theo **R-2**, tình huống này **không tồn tại được** trong cơ sở dữ liệu hiện tại.

| | Nếu Q-01 = "giữ một lớp" | Nếu Q-01 = "cho nhiều lớp" |
|---|---|---|
| Xử lý | Không cần bộ chọn. Theme = ngành của lớp duy nhất | Cần **bộ chọn ngữ cảnh ngành** ở header + cột `is_primary` trên `class_staff_assignments` |

**Đề xuất:** thiết kế resolver **sẵn sàng cho nhiều ngành** (trả về `availableThemeContexts` dạng mảng),
nhưng **chưa xây bộ chọn** cho tới khi Q-01 được chốt là "cho nhiều lớp". Chi phí thiết kế sẵn ≈ 0; chi phí xây UI thừa thì không.

---

### 4.2 — Trưởng ngành đồng thời có vai trò quản trị: theme ưu tiên vai trò hay ngành?

**Sự thật kỹ thuật:** R-1 ⇒ không thể vừa `sector_leader` vừa `super_admin`. Chỉ một trong hai.

Tình huống thật có thể xảy ra: `super_admin` **có** `staff_profiles` và **có** phân công lớp ⇒ có ngành theo dữ liệu.

**Đề xuất (khớp yêu cầu chủ dự án nêu):**
- Trang **quản trị toàn hệ thống** (`/admin`, `/imports`, `/reports` phạm vi toàn xứ đoàn): **luôn theme đỏ–vàng mặc định**.
- Trang **thao tác trên một ngành/lớp cụ thể** (`/classes/[id]`, `/attendance/[id]`, `/results/[id]`): theme theo ngành của bản ghi đó.
- **Vai trò không bao giờ quyết định màu.** Vai trò quyết định quyền; ngữ cảnh dữ liệu quyết định màu.

---

### 4.3 — Phụ huynh nhiều con thuộc nhiều ngành: theme theo đâu?

| Tình huống | Đề xuất |
|---|---|
| 1 con | Theme theo ngành của con đó. **Không có bộ chọn** — vào thẳng (đúng D-64) |
| Nhiều con **cùng ngành** | Theme theo ngành chung. Không cần bộ chọn ngữ cảnh |
| Nhiều con **khác ngành**, đang ở trang một con | Theme theo ngành **con đang xem** |
| Nhiều con khác ngành, ở trang **tổng quan gia đình** / danh sách con | 🔴 **Theme mặc định đỏ–vàng**. Mỗi con hiển thị **chip ngành riêng**. Tuyệt đối không lấy màu của con đầu tiên trong danh sách |

Bắt buộc kèm theo: khi chọn con, **cả nội dung lẫn màu đều đổi**; tiêu đề trang là **tên con**, có ảnh đại diện chữ cái đầu và chip ngành.
Không được đổi màu mà không đổi dữ liệu.

---

### 4.4 — Giáo lý viên chuyển ngành thì theme có tự đổi không?

**Có, bắt buộc.** Đây là điểm cốt lõi của ràng buộc chủ dự án.

Cơ chế: theme **không lưu ở đâu cả**, được suy ra mỗi lần dựng trang từ:

```
profiles → staff_profiles → class_staff_assignments (is_active, ends_on IS NULL)
        → classes (academic_year_id = năm học 'current')
        → grade_levels → sectors
```

Phân công cũ có `is_active = false` và `ends_on` đã đặt ⇒ **tự động bị loại**.
Không cần sửa tay, không cần tạo lại tài khoản.

Chi tiết ở `12_DYNAMIC_THEME_BUSINESS_RULES.md` §3 và `15_ACADEMIC_YEAR_THEME_TRANSITION.md`.

---

### 4.5 — Một tài khoản nhiều vai trò: xác định vai trò chính thế nào?

**Không cần xác định.** R-1 bảo đảm chỉ có một vai trò đang hiệu lực, và
`role_assignments_one_active_per_profile_idx` là ràng buộc ở tầng cơ sở dữ liệu, không phải quy ước.

`src/lib/auth/session.ts:33-38` dùng `.maybeSingle()` — nếu có hai dòng active, hàm **trả lỗi và `role` thành `null`**
(fail-closed, không fail-open). Đây là hành vi đúng.

**Đề xuất:** giữ nguyên. Nếu chủ dự án muốn một tài khoản có nhiều vai trò thật sự, đó là
**thay đổi nghiệp vụ lớn** nằm ngoài phạm vi Giai đoạn 2 và phải quay lại Giai đoạn 1.

---

### 4.6 — Trang quản trị toàn hệ thống có dùng đỏ–vàng cố định không?

**Đề xuất: có.**

| Trang | Theme |
|---|---|
| `/admin`, `/imports` | Đỏ–vàng cố định |
| `/reports` khi **chưa lọc ngành** | Đỏ–vàng |
| `/reports` khi **đã lọc về một ngành** | ⚠ Có thể đổi accent theo ngành đó — **cần chốt**, xem Q-07 |
| `/students`, `/staff`, `/classes` phạm vi toàn xứ đoàn | Đỏ–vàng, mỗi hàng có chip ngành riêng |
| `/dashboard` của vai trò toàn cục | Đỏ–vàng |

---

### 4.7 — Có cho người dùng tự chọn theme không?

**Đề xuất: KHÔNG cho chọn *màu*. CÓ cho chọn *ngữ cảnh*.**

| | |
|---|---|
| Chọn màu tự do | ✖ Phá ý nghĩa: màu ngành mang thông tin, không phải sở thích. Người dùng chọn xanh trong khi đang ở ngành Nghĩa Sĩ sẽ làm hỏng chỉ báo |
| Chọn **ngữ cảnh** (con nào / ngành nào / lớp nào) | ✅ Có — và màu **đi theo** lựa chọn đó |

Lựa chọn ngữ cảnh lưu ở **cookie server-readable**, và **phải được xác thực lại** với dữ liệu hiện hành mỗi lần đọc
(nếu người dùng không còn quyền với ngành đó, cookie bị bỏ qua và ghi `fallbackReason`).

---

### 4.8 — Theme xác định theo tài khoản / vai trò / ngành / hay ngữ cảnh dữ liệu?

**Đề xuất: ngữ cảnh dữ liệu**, với thứ tự ưu tiên tường minh. Đầy đủ ở `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md`.

---

### 4.9 — Theme lưu trong database, session, hay suy ra động?

**Đề xuất: suy ra động, mỗi request, phía máy chủ.**

| Cách | Đánh giá |
|---|---|
| Cột trong database | ✖ Vi phạm ràng buộc bắt buộc; đổi ngành phải sửa tay |
| Session / JWT claim | ⚠ Sẽ **cũ** ngay khi quản trị viên đổi phân công, cho tới lần đăng nhập sau |
| Local storage | ✖ Chủ dự án đã cấm dùng làm nguồn sự thật |
| **Suy ra động ở Server Component** ⭐ | ✅ Luôn đúng. Truy vấn nằm trong `React.cache()` như `getAuthContext` đang làm — **1 truy vấn/request**, không phải mỗi component |

Ứng dụng đã dùng đúng khuôn mẫu này: `session.ts:18` bọc `getAuthContext` trong `cache()`.
Resolver theme dùng lại y hệt cách đó ⇒ chi phí gần bằng 0 và **không có cache cũ**.

---

### 4.10 — Trang dùng chung cho nhiều ngành hiển thị màu thế nào?

**Đề xuất:**

1. App shell (header, sidebar, nút chính) → **theme mặc định đỏ–vàng**.
2. Mỗi bản ghi có **chip ngành riêng** (chấm màu **+ tên ngành bằng chữ** — bắt buộc theo `03_BRANCH_COLOR_RESEARCH.md` §5.1).
3. Nếu lọc về một ngành → có thể đổi accent (cần chốt Q-07).
4. Biểu đồ so sánh ngành → dùng **bộ màu biểu đồ riêng** + nhãn trực tiếp (`03` §6).
5. **Không bao giờ** lấy màu của bản ghi đầu tiên làm màu trang.

---

## 5. Điều cả bốn phương án đều bị cấm

1. Không lưu `themeColor` / `branchTheme` / `primaryColor` trên tài khoản làm nguồn sự thật.
2. Không tạo bản sao component cho từng ngành. **Một component, nhận token ngữ nghĩa.**
3. Không để từng màn hình tự viết logic xác định ngành. **Một resolver dùng chung.**
4. Không dùng màu ngành để biểu thị thành công / cảnh báo / lỗi / nguy hiểm.
5. Không dùng local storage làm nguồn sự thật cho ngành.
6. Không lấy phân công đã hết hạn / bị huỷ / đã lưu trữ / thuộc năm học không hoạt động.
7. Không đổi theme sớm chỉ vì đã có dữ liệu phân công cho năm học kế tiếp.
