# 12 — Quy tắc nghiệp vụ của theme động

> Trả lời ràng buộc bắt buộc *"Theme động theo ngành và năm học"* do chủ dự án nêu.
> **Chưa triển khai.** Tài liệu này để chủ dự án duyệt trước.
>
> Đi kèm: `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` (hàm resolver) ·
> `14_THEME_EDGE_CASE_MATRIX.md` (bảng tình huống biên) · `15_ACADEMIC_YEAR_THEME_TRANSITION.md` (chuyển năm học).

---

## 1. Nguyên tắc gốc

> **Theme là kết quả suy ra từ dữ liệu nghiệp vụ đang có hiệu lực, không phải một thuộc tính được lưu.**

Chuỗi suy diễn:

```
Tài khoản (profiles)
  → hồ sơ nghiệp vụ (staff_profiles | students qua guardians)
    → phân công / ghi danh còn hiệu lực
      → lớp (classes) thuộc NĂM HỌC ĐANG HOẠT ĐỘNG
        → cấp giáo lý (grade_levels)
          → ngành (sectors.code)
            → bộ semantic theme token
```

**Bị cấm tuyệt đối:**

| Cấm | Lý do |
|---|---|
| `profiles.theme_color = 'green'` | Ràng buộc bắt buộc của chủ dự án |
| `profiles.branch_theme = 'AU_NHI'` | Như trên |
| `profiles.primary_color = '#…'` | Như trên |
| `sectors.theme_color` | Màu là quyết định trình bày, không phải dữ liệu nghiệp vụ. Đổi màu không được kéo theo migration |
| Local storage làm nguồn sự thật cho ngành | Ràng buộc bắt buộc; ngoài ra máy phòng học là **máy dùng chung** — local storage của người trước sẽ rò sang người sau |

**Được phép:** lưu **lựa chọn ngữ cảnh của người dùng** (đang xem con nào, đang chọn ngành nào)
trong cookie server-readable — nhưng **phải xác thực lại** với dữ liệu hiện hành ở mỗi request.

---

## 2. Đánh giá schema hiện tại — **đủ hay chưa?**

### 2.1 Những gì schema **đã đủ** ✅

| Yêu cầu | Có sẵn | Bằng chứng |
|---|---|---|
| Năm học đang hoạt động, duy nhất | `academic_years.status = 'current'` + unique index | `20260715000200:24-25` |
| Phân công theo năm học | `role_assignments.academic_year_id` | `:66` |
| Ngày bắt đầu / kết thúc phân công vai trò | `starts_on`, `ends_on` | `:69-70` |
| Trạng thái hiệu lực vai trò | `is_active` + check `(is_active and ends_on is null) or (not is_active)` | `:81-83` |
| Lịch sử vai trò | `role_assignments_profile_history_idx (profile_id, starts_on desc)` | `:89-90` |
| Ngày bắt đầu / kết thúc phân công lớp | `class_staff_assignments.starts_on`, `ends_on`, `is_active` | `20260715000400:42-44` |
| Lịch sử phân công lớp | `class_staff_staff_history_idx` | `:58-59` |
| Vai trò công tác trong lớp | `class_staff_assignments.capacity` (`representative`/`member`/`trainee`) | `:41` |
| Ghi danh thiếu nhi theo năm học | `enrollments.academic_year_id`, `class_id`, `status`, `enrolled_on`, `ended_on` | `20260716000500:6-21` |
| Một ghi danh mở / em / năm học | unique partial index | `:24-26` |
| Lịch sử chuyển lớp | `enrollments.previous_enrollment_id` | `:13` ⚠ **chưa bao giờ được ghi giá trị** (SW-11) |
| Lớp thuộc năm học nào | `classes.academic_year_id` | `20260715000200:89` |
| Lớp → ngành | `classes.grade_level_id → grade_levels.sector_id` | `:90` |
| Ngành có mã bất biến | `sectors.code`, chỉ SELECT cho `authenticated` | `seed.sql:5-11` |
| Phụ huynh → con | `students.guardian_id`, `app.own_student_ids()` | `20260721000200:94-107` |

**Kết luận: schema đã biểu diễn được đầy đủ chiều thời gian.** Không cần migration nào cho **kịch bản một-phân-công**.

### 2.2 Những gì schema **chưa đủ** ⚠️

| # | Thiếu | Hệ quả | Cần migration? |
|---|---|---|:--:|
| **S-1** | **Không có phân công chính/phụ.** `class_staff_assignments` không có `is_primary` | Nếu cho phép nhiều phân công, không biết lấy ngành nào | ✅ nếu Q-01 = "cho nhiều lớp" |
| **S-2** | Unique index chặn nhiều phân công lớp cùng lúc (`class_staff_one_active_class_per_staff_idx`) | Yêu cầu #4 và #5 của chủ dự án **không thực hiện được** | ✅ nếu Q-01 = "cho nhiều lớp" — **và đây là thay đổi nghiệp vụ lớn** |
| **S-3** | Unique index chặn nhiều vai trò cùng lúc (`role_assignments_one_active_per_profile_idx`) | Yêu cầu #7 không thực hiện được **ở tầng role** | Chỉ nếu chủ dự án thật sự muốn nhiều vai trò — **khuyến nghị KHÔNG** |
| **S-4** | Lớp Dự trưởng `grade_level_id = NULL` ⇒ **không có ngành** | Không suy ra được theme từ ngành | ❌ — xử lý bằng quy tắc `class_kind='trainee'` → theme Huynh Trưởng |
| **S-5** | `enrollments.previous_enrollment_id` **chưa bao giờ có giá trị** (SW-11) | Mất vết chuyển lớp ⇒ không dựng được "lịch sử ngành của em" | ❌ cho theme; ✅ cho tính năng lịch sử — đã nằm trong Đợt 4 |
| **S-6** | `staff_profiles.service_status` gán cứng "đang phục vụ", không ai đọc (SW-11) | GLV tạm ngưng phục vụ vẫn ra theme như đang phục vụ | ❌ — chỉ cần đọc cột đã có |

> **S-2 là điểm chặn quan trọng nhất.** Nó không phải vấn đề giao diện.
> Xem `07_DECISIONS_REQUIRED.md` **Q-01**.

### 2.3 Đề xuất migration — **chỉ khi Q-01 = "cho phép nhiều lớp"**

```sql
-- KHÔNG chạy cho tới khi được phê duyệt.
alter table public.class_staff_assignments
  add column is_primary boolean not null default false;

-- Thay index "một lớp mỗi GLV" bằng "một phân công CHÍNH mỗi GLV"
drop index class_staff_one_active_class_per_staff_idx;
create unique index class_staff_one_active_primary_per_staff_idx
on public.class_staff_assignments (staff_profile_id)
where is_active and is_primary;

-- Chống GLV có phân công nhưng không có cái nào là chính:
-- bắt buộc bằng trigger, không bằng constraint (constraint không kiểm được nhiều dòng).
```

**Ảnh hưởng vượt ngoài theme — phải kiểm lại toàn bộ:**
`app.is_class_staff()`, `app.is_class_representative()`, `app.can_edit_attendance()`,
`app.can_grade_class()`, `app.can_comment_class()`, `app.staff_class_ids()`,
và **23 bộ pgTAP** đang giả định một GLV = một lớp.

⇒ Đây là hạng mục cỡ **L**, thuộc phạm vi nghiệp vụ, phải xếp trước bước làm giao diện.

---

## 3. Quy tắc thời gian

### 3.1 Định nghĩa "đang có hiệu lực"

Một phân công/ghi danh được dùng để suy ra theme **khi và chỉ khi** thoả **tất cả**:

| # | Điều kiện | Áp cho |
|---|---|---|
| 1 | `is_active = true` (hoặc `status IN ('active','paused')` với `enrollments`) | mọi loại |
| 2 | `ends_on IS NULL` (hoặc `ended_on IS NULL`) | mọi loại |
| 3 | `starts_on <= hôm nay` **theo giờ Việt Nam** | mọi loại |
| 4 | Lớp/vai trò thuộc **năm học có `status = 'current'`** | phân công lớp, ghi danh |
| 5 | Hồ sơ nghiệp vụ chưa bị lưu trữ (`students.status`, `staff_profiles.service_status`) | mọi loại |

> **Điều kiện 3 dùng giờ Việt Nam, không dùng giờ máy chủ.** Dự án đã có `src/lib/dates/` và `date-fns-tz`;
> SW-08 ghi nhận đây là lỗi lặp lại ở 3 module — **không được lặp lại ở resolver**.

### 3.2 Phân biệt năm điều

| Khái niệm | Truy vấn | Dùng để |
|---|---|---|
| **Ngành hiện tại** | phân công hiệu lực ∩ năm học `current` | Quyết định theme của app shell |
| **Ngành năm học trước** | phân công của năm học `status='archived'` gần nhất | Hiển thị trong lịch sử; **không** đổi theme |
| **Lịch sử từng ngành** | mọi dòng theo `starts_on desc` | Trang hồ sơ, tab "Lịch sử lớp" |
| **Ngành năm học kế tiếp, chưa hiệu lực** | phân công thuộc năm học `status='draft'` | 🔴 **Tuyệt đối không dùng cho theme** |
| **Ngành đã ngừng hiệu lực** | `is_active=false` hoặc `ends_on` đã qua | 🔴 **Tuyệt đối không dùng cho theme** |

### 3.3 Xem dữ liệu lịch sử — quy tắc bắt buộc

Khi người dùng mở hồ sơ hoặc báo cáo của năm học cũ:

| Thành phần | Theme |
|---|---|
| App shell (header, sidebar, nút chính) | **Giữ nguyên ngữ cảnh hiện tại.** Không đổi |
| Thẻ/khối chứa dữ liệu lịch sử | Được phép hiển thị **chip ngành + tiêu đề** theo ngành của bản ghi lịch sử |
| Dải màu 4px dưới header | Giữ nguyên ngữ cảnh hiện tại |

Lý do: nếu app shell đổi màu khi xem lịch sử, người dùng sẽ tưởng mình đã chuyển ngữ cảnh làm việc
và có thể thao tác nhầm vào dữ liệu năm cũ.

Kèm theo bắt buộc: **banner cảnh báo bằng chữ** — *"Đang xem dữ liệu năm học 2025–2026 (đã lưu trữ)"* —
vì màu không được dùng làm tín hiệu duy nhất.

---

## 4. Quy tắc theo từng loại người dùng

### 4.1 Thiếu nhi (`role = 'student'`)

```
profiles.id → students.profile_id
  → enrollments (status IN ('active','paused'), ended_on IS NULL,
                 academic_year_id = năm học 'current')
    → classes → grade_levels → sectors.code   [hoặc class_kind='trainee' → HUYNH_TRUONG]
```

| Tình huống | Theme |
|---|---|
| Có ghi danh mở ở năm hiện tại | Ngành của lớp đó |
| Ghi danh ở lớp **Dự trưởng** | Huynh Trưởng (đỏ–vàng) |
| **Chưa xếp lớp** | Mặc định đỏ–vàng + trạng thái *"Chưa xếp lớp"* |
| Tài khoản chưa liên kết hồ sơ | Mặc định + *"Tài khoản chưa liên kết hồ sơ thiếu nhi"* |
| Ghi danh `paused` (tạm nghỉ) | ⚠ **Vẫn giữ ngành đó** — em vẫn thuộc lớp, chỉ tạm nghỉ. Kèm badge "Tạm nghỉ" |
| Ghi danh đã `ended` | Không tính. Rơi về "chưa xếp lớp" |

### 4.2 Phụ huynh (`role = 'guardian'`)

```
profiles.id → guardians.profile_id → students (guardian_id) → enrollments → … → sectors.code
```

| Số con (trong năm học hiện tại) | Theme |
|---|---|
| **1 con** | Ngành của con đó. **Không có bộ chọn** — vào thẳng (D-64) |
| **Nhiều con, cùng ngành** | Ngành chung. Không cần bộ chọn ngữ cảnh |
| **Nhiều con, khác ngành, đang ở trang một con** | Ngành của **con đang xem** |
| **Nhiều con, khác ngành, ở trang danh sách con / tổng quan** | 🔴 **Mặc định đỏ–vàng**. Mỗi con có chip ngành riêng |
| **0 con hợp lệ** | Mặc định + *"Tài khoản chưa được liên kết với hồ sơ thiếu nhi nào"* |

**Bắt buộc:** khi phụ huynh chọn con, **nội dung và màu đổi cùng lúc**. Tiêu đề trang là tên con,
có avatar chữ cái đầu và chip ngành. Không được đổi màu mà không đổi dữ liệu.

### 4.3 Giáo lý viên (role lớp: `class_representative` / `class_teacher` / `trainee_assistant`)

Có **hai** nguồn liên kết lớp, phải chốt thứ tự ưu tiên:

| Nguồn | Ý nghĩa |
|---|---|
| `role_assignments.class_id` | Lớp gắn với **vai trò** |
| `class_staff_assignments.class_id` | Lớp gắn với **phân công công tác** |

`app.is_class_staff(c)` coi **cả hai** đều hợp lệ (`20260715000400:202`).

**Đề xuất thứ tự:** `class_staff_assignments` **trước** (đó là phân công công tác thật, có `capacity`),
`role_assignments.class_id` là dự phòng. Nếu hai nguồn **mâu thuẫn** (khác lớp, khác ngành):
lấy `class_staff_assignments`, và ghi `fallbackReason = 'ROLE_CLASS_MISMATCH'` để hiện cảnh báo cho Super Admin.

> Đây là tình huống thật sinh ra từ lỗi M04-F06 (*"Đổi lớp cho GLV làm mất vai trò vĩnh viễn"*) —
> dữ liệu lệch giữa hai bảng **đang tồn tại**.

### 4.4 Trưởng ngành / Phó ngành (`sector_leader` / `sector_deputy`)

`role_assignments.sector_id` là **not null** theo `role_assignments_scope_matches_role`.
⇒ Theme = ngành đó. Đơn giản, không mơ hồ.

Nếu người này **đồng thời có phân công lớp** ở ngành khác: theo yêu cầu chủ dự án,
**vai trò không quyết định màu**. Đề xuất:

| Đang ở | Theme |
|---|---|
| Trang phạm vi ngành (`/students` lọc ngành mình, `/promotions`) | Ngành mình phụ trách |
| Trang một lớp cụ thể | Ngành **của lớp đó** (có thể khác) |
| Có bộ chọn ngữ cảnh (nếu Q-01 mở) | Theo lựa chọn, mặc định là ngành phụ trách |

### 4.5 Vai trò toàn cục (`super_admin`, `parish_priest`, `chaplain`, `group_leader`, `deputy_group_leader`, `secretary`, `treasurer`)

`sector_id` và `class_id` đều **NULL** theo ràng buộc.

| Đang ở | Theme |
|---|---|
| Trang toàn hệ thống (`/admin`, `/imports`, `/dashboard`, `/reports` chưa lọc) | **Đỏ–vàng mặc định** |
| Trang một lớp/ngành cụ thể (`/classes/[id]`, `/attendance/[id]`, `/results/[id]`) | Ngành của bản ghi đó |
| `/reports` đã lọc về một ngành | Q-07 — cần chốt |

### 4.6 Tài khoản chưa phân công (`role = null`)

Theme **đỏ–vàng mặc định**, `fallbackReason = 'NO_ACTIVE_ASSIGNMENT'`.

**Bắt buộc hiển thị trạng thái bằng chữ**, không im lặng:

| Tình huống | Thông điệp |
|---|---|
| GLV mới, chưa xếp ngành | *"Hồ sơ của bạn chưa được phân công lớp. Liên hệ Thư ký Xứ đoàn."* |
| Thiếu nhi chưa xếp lớp | *"Em chưa được xếp lớp cho năm học này."* |
| Tài khoản chưa liên kết hồ sơ | *"Tài khoản chưa được liên kết với hồ sơ. Liên hệ Quản trị viên."* |
| Phụ huynh chưa có con hợp lệ | *"Tài khoản chưa được liên kết với hồ sơ thiếu nhi nào."* |

> Đây chính là ba loại trạng thái rỗng mà SW-03 yêu cầu chuẩn hoá. Theme và trạng thái rỗng **dùng chung một nguồn sự thật**.

---

## 5. Quy tắc cho màn hình đa ngành

| Trang | Theme app shell | Mỗi bản ghi |
|---|---|---|
| `/dashboard` vai trò toàn cục | Đỏ–vàng | chip ngành |
| `/reports` chưa lọc | Đỏ–vàng | chip ngành |
| `/students` toàn xứ đoàn | Đỏ–vàng | chip ngành |
| `/staff` toàn xứ đoàn | Đỏ–vàng | chip ngành |
| `/classes` (19 lớp, 5 ngành) | Đỏ–vàng | **nhóm theo ngành**, mỗi nhóm có tiêu đề + viền trái màu ngành |
| `/admin` | Đỏ–vàng | — |
| `/promotions` | Ngành của Trưởng ngành, hoặc đỏ–vàng nếu toàn cục | chip ngành nguồn → đích |

**Bị cấm:** lấy màu của bản ghi đầu tiên trong danh sách làm màu trang.

---

## 6. Cache và đồng bộ

### 6.1 Nguyên tắc

> Theme **được suy ra ở Server Component, mỗi request**, bọc trong `React.cache()`.
> Không có tầng cache nào sống lâu hơn một request.

Ứng dụng **đã dùng đúng khuôn mẫu này**: `src/lib/auth/session.ts:18` bọc `getAuthContext` trong `cache()`.
Resolver theme dùng lại y hệt ⇒ 1 truy vấn/request và **không có khả năng cache cũ**.

### 6.2 Bảng rủi ro cache cũ

| Nguồn | Rủi ro | Cách xử lý |
|---|---|---|
| Session / JWT claim | Cao — cũ tới lần đăng nhập sau | ✅ **Không đưa ngành vào session/JWT** |
| Cookie lưu theme | Cao | ✅ Cookie **chỉ** lưu *lựa chọn ngữ cảnh* (id con / id ngành), **không** lưu màu; xác thực lại mỗi request |
| Local storage | Cao + rò dữ liệu trên máy dùng chung | ✅ **Không dùng** |
| Client cache (React Query…) | — | ✅ Dự án **không có** thư viện state toàn cục (`01_SYSTEM_MODULE_MAP.md` §1) |
| Server cache của Next | Trung bình | ✅ Trang có dữ liệu người dùng đều động; `revalidatePath` đã được dùng sau mọi thao tác ghi |
| Service worker | Thấp | ✅ SW **cố ý không cache HTML** ⇒ không giữ được trang có màu cũ |
| **Nhiều tab** | Trung bình | Tab cũ giữ HTML đã dựng. Chấp nhận được: **thao tác tiếp theo sẽ tải lại từ máy chủ và ra màu đúng**. Không giữ được màu sai qua một lần điều hướng |
| Quản trị viên vừa đổi phân công | — | Lần dựng trang kế tiếp đã đúng. Nếu muốn nhanh hơn: `revalidatePath('/', 'layout')` sau khi đổi phân công |
| Vừa kích hoạt năm học mới | Cao | Xem `15_ACADEMIC_YEAR_THEME_TRANSITION.md` |

### 6.3 Xác thực lại lựa chọn ngữ cảnh

Mỗi lần đọc cookie ngữ cảnh, resolver **bắt buộc**:

1. Kiểm giá trị có đúng dạng UUID không.
2. Kiểm đối tượng đó **còn tồn tại và còn hiệu lực trong năm học hiện tại** không.
3. Kiểm người dùng **có quyền với ngữ cảnh đó** không (RLS sẽ trả rỗng nếu không).
4. Nếu bất kỳ bước nào hỏng → **bỏ qua cookie**, dùng ngữ cảnh mặc định, ghi `fallbackReason`.

> Bước 3 quan trọng về bảo mật: người dùng sửa cookie thành id ngành khác **không được** làm lộ dữ liệu.
> Theme chỉ là màu — nhưng nếu ngữ cảnh cũng lọc dữ liệu thì đây là ranh giới phân quyền và
> **RLS vẫn là chốt chặn cuối**, đúng kiến trúc 3 lớp đang có.

---

## 7. Ràng buộc kỹ thuật bắt buộc khi triển khai (Phần 2B)

1. **Một** resolver dùng chung: `src/lib/theme/resolve-theme-context.ts`. Không module nào tự viết logic ngành.
2. Bảng màu ở `src/lib/theme/sector-palette.ts`, khoá theo `sectors.code`. **Không** cột màu trong database.
3. Token bơm vào DOM bằng **CSS variable trên phần tử gốc của shell**, không dùng class theo ngành:
   ```html
   <div data-theme-key="AU_NHI" style="--theme-primary:#378630; --theme-on-primary:#fff; …">
   ```
   ⇒ một bộ component, không có bản sao theo ngành.
4. Đổi theme phải **mềm**: `transition: background-color 200ms, border-color 200ms` trên các phần tử accent;
   tôn trọng `prefers-reduced-motion`.
5. **Không nhấp nháy**: theme được tính ở Server Component và render thẳng vào HTML đầu tiên.
   Không có bước "tải xong rồi mới đổi màu".
6. Skeleton/loading dùng token **trung tính**, không dùng token ngành (lúc đó chưa biết ngành).
7. Mọi shared component (dialog, dropdown, date picker, toast, notification) **chỉ dùng token ngữ nghĩa**.
8. Màu trạng thái (`success`/`warning`/`danger`/`info`) **không bao giờ** lấy từ token ngành.

---

## 8. Tóm tắt những gì cần chủ dự án duyệt

| # | Nội dung | Mục |
|---|---|---|
| 1 | 🔴 Một GLV có được phụ trách **nhiều lớp / nhiều ngành** không? (chặn S-1, S-2) | §2.2 |
| 2 | Thứ tự ưu tiên khi `role_assignments.class_id` mâu thuẫn `class_staff_assignments.class_id` | §4.3 |
| 3 | Lớp Dự trưởng dùng theme Huynh Trưởng (đỏ–vàng) — xác nhận | §4.1 |
| 4 | Ghi danh `paused` (tạm nghỉ) **vẫn giữ** màu ngành — xác nhận | §4.1 |
| 5 | Trang tổng quan gia đình của phụ huynh nhiều con khác ngành dùng **đỏ–vàng** — xác nhận | §4.2 |
| 6 | Xem dữ liệu năm cũ **không** đổi theme app shell — xác nhận | §3.3 |
| 7 | Không đưa ngành vào session/JWT; suy ra mỗi request — xác nhận | §6.1 |
