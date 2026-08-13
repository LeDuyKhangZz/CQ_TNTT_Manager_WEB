# 10 — QUY TẮC THEME ĐÃ PHÊ DUYỆT

> **Ngày duyệt: 2026-07-23. Người duyệt: chủ dự án.**
> Nguồn sự thật cho theme động trong Giai đoạn 2B.
> Nền chi tiết: `12_DYNAMIC_THEME_BUSINESS_RULES.md` · `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` ·
> `14_THEME_EDGE_CASE_MATRIX.md` · `15_ACADEMIC_YEAR_THEME_TRANSITION.md`.

---

## 1. Quyết định gốc

| # | Quyết định | Mã |
|---|---|---|
| 1 | **Kiến trúc: Phương án D** — nền trung tính, chỉ accent đổi theo ngữ cảnh ngành | Q-03 |
| 2 | **Thứ tự ưu tiên: R3** — ngữ cảnh trang thắng; lựa chọn người dùng chỉ phá thế hoà | Q-04 |
| 3 | **Một Giáo lý viên = một lớp** — không migration, không bộ chọn ngữ cảnh ngành | Q-01 |
| 4 | `/reports` **đổi accent** khi lọc về một ngành, kèm chỉ báo bằng chữ | Q-11 |
| 5 | **Có màn hình xem trước theme** trước khi kích hoạt năm học mới | Q-12 |

---

## 2. Nguyên tắc bất di dịch

> **Theme là kết quả suy ra từ dữ liệu nghiệp vụ đang có hiệu lực, không phải thuộc tính được lưu.**

```
Tài khoản → hồ sơ nghiệp vụ → phân công/ghi danh còn hiệu lực
   → lớp thuộc NĂM HỌC ĐANG HOẠT ĐỘNG → cấp giáo lý → ngành → semantic token
```

**Bị cấm tuyệt đối:**

| Cấm | |
|---|---|
| `profiles.theme_color` / `branch_theme` / `primary_color` | Ràng buộc bắt buộc của chủ dự án |
| `sectors.theme_color` | Màu là quyết định trình bày; đổi màu không được kéo theo migration |
| Local storage làm nguồn sự thật cho ngành | Máy phòng học là máy dùng chung |
| Ngành trong session / JWT claim | Sẽ cũ ngay khi quản trị viên đổi phân công |
| Mỗi màn hình tự viết logic xác định màu | Một resolver dùng chung |
| Bản sao component cho từng ngành | Một component, nhận semantic token |
| Màu ngành làm màu trạng thái (và ngược lại) | |
| Lấy phân công đã hết hạn / huỷ / lưu trữ / thuộc năm không hoạt động | |
| Đổi theme sớm vì đã có dữ liệu cho năm học kế tiếp | |

**Được phép:** lưu **lựa chọn ngữ cảnh** (đang xem con nào) trong cookie server-readable —
nhưng **xác thực lại mỗi request**.

---

## 3. Thứ tự ưu tiên đã duyệt (R3)

```
0. Không có năm học 'current'  → HUYNH_TRUONG · NO_CURRENT_ACADEMIC_YEAR
                                  + banner "Chưa đặt năm học hiện hành"

1. scope = SYSTEM              → HUYNH_TRUONG · SYSTEM_ADMIN_DEFAULT
2. scope = CROSS_BRANCH        → HUYNH_TRUONG · CROSS_BRANCH_SCREEN
3. scope = CLASS
     3a. class_kind='trainee'  → HUYNH_TRUONG · TRAINEE_CLASS_DEFAULT
     3b. còn lại               → ngành của lớp · CURRENT_RECORD_BRANCH
4. scope = SECTOR              → ngành đó · CURRENT_RECORD_BRANCH
5. scope = CHILD               → ngành ghi danh hiện tại của con · SELECTED_CHILD_BRANCH
6. scope = PERSONAL:
     student   có ghi danh mở  → ngành đó · OWN_ENROLLMENT_BRANCH
               không           → HUYNH_TRUONG · NOT_ENROLLED_THIS_YEAR
     guardian  0 con           → HUYNH_TRUONG · NO_LINKED_CHILDREN
               1 con           → ngành con · SOLE_CHILD_BRANCH
               n con cùng ngành→ ngành chung · SOLE_CHILD_BRANCH
               n con khác ngành, có cookie hợp lệ → ngành con đó · SELECTED_CHILD_BRANCH
               n con khác ngành, không cookie     → HUYNH_TRUONG · MULTI_BRANCH_NO_SELECTION
     staff     role ngành      → ngành đó · PRIMARY_ACTIVE_ASSIGNMENT
               có class_staff_assignment → ngành của lớp · PRIMARY_ACTIVE_ASSIGNMENT
                                          (trainee → HUYNH_TRUONG · TRAINEE_CLASS_DEFAULT)
               chỉ có role_assignments.class_id → ngành lớp đó
                                          + ROLE_CLASS_MISMATCH nếu lệch
               role toàn cục, không phân công   → HUYNH_TRUONG · SYSTEM_ADMIN_DEFAULT
               role = null                      → HUYNH_TRUONG · NO_ACTIVE_ASSIGNMENT
7. còn lại                     → HUYNH_TRUONG · NO_ACTIVE_ASSIGNMENT_FALLBACK
```

**Cookie ngữ cảnh chỉ được dùng ở bước 6 (guardian)** — vì Q-01 = một lớp nên nhánh staff
không bao giờ có nhiều ngành để chọn.

### Bảo đảm tất định

1. Mọi truy vấn có `ORDER BY` tường minh: `sectors.sort_order` → `classes.display_name` → `students.full_name` → `id`.
2. Nhiều ứng viên mà không có tiêu chí chọn ⇒ **KHÔNG chọn**. Trả `HUYNH_TRUONG` + `MULTI_BRANCH_NO_SELECTION`.
   *Thà trung tính còn hơn đoán sai.*
3. Test: chạy 100 lần trên cùng dữ liệu → kết quả giống hệt.

---

## 4. Điều kiện "đang có hiệu lực"

Một phân công/ghi danh được dùng **khi và chỉ khi** thoả **tất cả**:

| # | Điều kiện |
|---|---|
| 1 | `is_active = true` (hoặc `status IN ('active','paused')` với `enrollments`) |
| 2 | `ends_on IS NULL` (hoặc `ended_on IS NULL`) |
| 3 | `starts_on <= hôm nay` **theo giờ Việt Nam** — không dùng giờ máy chủ |
| 4 | Lớp/vai trò thuộc năm học có `status = 'current'` |
| 5 | Hồ sơ chưa bị lưu trữ (`students.status`, `staff_profiles.service_status`) |

> **Điều kiện 3 dùng `src/lib/dates/` + `date-fns-tz`.** SW-08 ghi nhận lỗi giờ máy chủ đã lặp ở 3 module —
> **không được lặp lại ở resolver**.

---

## 5. Chữ ký hàm

```ts
// src/lib/theme/resolve-theme-context.ts
export const resolveThemeContext = cache(
  async (input: { scope:
      | { kind: "PERSONAL" }
      | { kind: "SYSTEM" }
      | { kind: "CROSS_BRANCH" }
      | { kind: "CLASS";  classId: string }
      | { kind: "SECTOR"; sectorId: string }
      | { kind: "CHILD";  studentId: string }
  }): Promise<ThemeContext> => { /* … */ },
);
```

**Trang khai báo `scope`; resolver quyết định màu.** Trang vốn đã biết nó đang xem gì.
Resolver **không** giải mã `pathname` — đó chính là lỗi mà `navigation.ts` đang mắc.

`ThemeContext` trả về 10 trường: `themeKey` · `branchId` · `branchName` · `sourceOfTheme` ·
`academicYearId` · `academicYearCode` · `contextType` · `fallbackReason` ·
`availableThemeContexts` · `isViewingArchivedData`.

> `availableThemeContexts` **giữ dạng mảng** kể cả khi Q-01 = một lớp, để mở đường nếu sau này
> chủ dự án đổi ý. `BranchContextSwitcher` **thiết kế sẵn nhưng chưa xây**.

---

## 6. Bơm token

```tsx
<div
  data-theme-key={theme.themeKey}
  data-theme-source={theme.sourceOfTheme}
  style={{ "--theme-primary": p.primary, "--theme-on-primary": p.onPrimary, /* … 12 token */ }}
>
```

**CSS variable inline, không dùng class theo ngành.** Lý do quyết định: cho phép **lồng ngữ cảnh** —
trang `/classes` nền đỏ–vàng chứa 19 thẻ lớp, **mỗi thẻ tự bọc `ThemeScope` của ngành mình**.

Bắt buộc:
- Theme tính ở **Server Component**, render thẳng vào HTML đầu tiên ⇒ **không nhấp nháy**.
- Chuyển mềm: `transition: background-color 200ms, border-color 200ms` trên phần tử accent.
- Tôn trọng `prefers-reduced-motion`.
- Skeleton/loading dùng token **trung tính** (lúc đó chưa biết ngành).

---

## 7. Cache

| Nguồn | Xử lý |
|---|---|
| Server Component + `React.cache()` | ✅ **1 truy vấn/request**, không có cache sống lâu hơn request |
| Session / JWT | ❌ Không đưa ngành vào |
| Cookie | Chỉ lưu *lựa chọn ngữ cảnh* (id con), **không** lưu màu; xác thực lại mỗi request |
| Local storage | ❌ Không dùng |
| Client state library | Dự án không có |
| Service worker | Cố ý không cache HTML ⇒ không giữ được trang màu cũ |
| Nhiều tab | Tab cũ đúng sau một lần điều hướng — chấp nhận được |
| Đổi phân công / kích hoạt năm học | `revalidatePath('/', 'layout')` |

### Xác thực lại cookie ngữ cảnh — 4 bước bắt buộc

1. Đúng dạng UUID?
2. Đối tượng còn tồn tại và còn hiệu lực trong năm học hiện tại?
3. Người dùng **có quyền** với ngữ cảnh đó? (RLS trả rỗng nếu không)
4. Hỏng bất kỳ bước nào → bỏ qua cookie, dùng mặc định, ghi `fallbackReason`.

> Bước 3 là ranh giới bảo mật. Sửa cookie thành id con của người khác **không được** lộ gì —
> `own_student_ids()` + RLS chặn, và **RLS vẫn là chốt chặn cuối**.

---

## 8. Quy tắc theo loại người dùng

| Loại | Theme | Ghi chú |
|---|---|---|
| Thiếu nhi có ghi danh mở | Ngành của lớp | |
| Thiếu nhi lớp **Dự trưởng** | **HUYNH_TRUONG** | `class_kind='trainee'` không có ngành |
| Ghi danh **`paused`** | **Giữ ngành đó** + badge "Tạm nghỉ" | Em vẫn thuộc lớp |
| Phụ huynh 1 con | Ngành của con — **không có bộ chọn** (D-64) | |
| Phụ huynh n con **cùng ngành** | Ngành chung — không cần bộ chọn | |
| Phụ huynh n con **khác ngành**, trang một con | Ngành con đang xem | Đổi con ⇒ **đổi cả nội dung lẫn màu** |
| Phụ huynh n con khác ngành, trang danh sách | **HUYNH_TRUONG** + chip từng con | **Không** lấy màu con đầu tiên |
| GLV có phân công lớp | Ngành của lớp | |
| Trưởng/Phó ngành | `role_assignments.sector_id` | |
| Vai trò toàn cục | **HUYNH_TRUONG** ở trang hệ thống; ngành của bản ghi khi mở lớp cụ thể | Vai trò **không** quyết định màu |
| Chưa phân công | **HUYNH_TRUONG** + banner bằng chữ | |

### Khi `role_assignments.class_id` ≠ `class_staff_assignments.class_id`

Lấy **`class_staff_assignments`** (phân công công tác thật), ghi `fallbackReason = 'ROLE_CLASS_MISMATCH'`,
hiện cảnh báo cho Super Admin. Dữ liệu lệch **đang tồn tại** do lỗi M04-F06.

### Trạng thái chưa phân công — bắt buộc nói bằng chữ

| Tình huống | Thông điệp |
|---|---|
| GLV chưa xếp ngành | *"Hồ sơ của bạn chưa được phân công lớp. Liên hệ Thư ký Xứ đoàn."* |
| Thiếu nhi chưa xếp lớp | *"Em chưa được xếp lớp cho năm học này."* |
| Chưa liên kết hồ sơ | *"Tài khoản chưa được liên kết với hồ sơ. Liên hệ Quản trị viên."* |
| Phụ huynh chưa có con | *"Tài khoản chưa được liên kết với hồ sơ thiếu nhi nào."* |

---

## 9. Màn hình đa ngành

| Trang | Theme shell | Mỗi bản ghi |
|---|---|---|
| `/dashboard` toàn cục · `/students` · `/staff` · `/admin` · `/imports` | HUYNH_TRUONG | chip ngành |
| `/classes` | HUYNH_TRUONG | **nhóm theo ngành**, mỗi thẻ lớp bọc `ThemeScope` riêng |
| `/reports` **chưa lọc** | HUYNH_TRUONG | chip ngành |
| `/reports` **đã lọc một ngành** | ✅ **Đổi accent theo ngành đó** (Q-11) | + `ContextIndicator`: *"Đang lọc: **Ngành Ấu Nhi**"* |

**Cấm:** lấy màu bản ghi đầu tiên làm màu trang.

---

## 10. Xem dữ liệu năm học cũ

| Thành phần | Hành vi |
|---|---|
| App shell | **Giữ nguyên ngữ cảnh hiện tại** — không đổi màu |
| `isViewingArchivedData` | `true` |
| Banner | *"Đang xem dữ liệu năm học 2026–2027 (đã lưu trữ). Không thể chỉnh sửa."* |
| Chip trên bản ghi | Ngành **của bản ghi lịch sử** |
| Nút thao tác ghi | Ẩn hoặc vô hiệu + giải thích |

Lý do: màu là tín hiệu *"tôi đang làm việc ở đâu"*, không phải *"tôi đang nhìn gì"*.
Nếu shell đổi màu, người dùng tưởng đã chuyển ngữ cảnh và thao tác nhầm vào năm cũ.

---

## 11. Chuyển năm học

Ba giai đoạn, chi tiết ở `15_ACADEMIC_YEAR_THEME_TRANSITION.md` §4.

**Thứ tự bắt buộc trong giao dịch kích hoạt:**

1. Xác nhận không còn buổi điểm danh chưa chốt / bảng điểm chưa khoá ở năm cũ.
2. **Đóng phân công cũ** (`is_active=false`, `ends_on`) — **phải trước bước 4**,
   nếu không unique index `class_staff_one_active_class_per_staff_idx` sẽ chặn.
3. Đóng ghi danh còn mở của năm cũ.
4. Kích hoạt phân công/ghi danh năm mới.
5. Năm cũ → `archived`, năm mới → `current`.
6. `revalidatePath('/', 'layout')`.
7. Ghi nhật ký thao tác (D-65).

**Trước khi kích hoạt:** màn hình **xem trước theme** (Q-12) — bao nhiêu người đổi ngành,
ai chưa được phân công, em nào chưa xếp lớp.

**Sau khi kích hoạt:** báo cáo hậu kiểm · **không tự gán ngành nếu thiếu dữ liệu** ·
gửi thông báo cho GLV/thiếu nhi đổi ngành.

> Đổi màu im lặng làm người dùng tưởng hệ thống lỗi. Thông báo bằng chữ là bắt buộc.

---

## 12. Kiểm thử bắt buộc

**Unit — 25 tình huống** ở `13_THEME_CONTEXT_RESOLUTION_OPTIONS.md` §7.1, trừ #4, #5
(GLV nhiều lớp/nhiều ngành — ngoài phạm vi do Q-01), cộng:

| # | Test |
|---|---|
| U-26 | **Tất định:** 100 lần chạy trên dữ liệu nhiều ứng viên → kết quả giống hệt |
| U-27 | **Canh bảng màu:** mọi `sectors.code` trong `seed.sql` có mục trong `SECTOR_PALETTE`, số lượng khớp |
| U-28 | **Canh tương phản:** 5 khẳng định ở `09_APPROVED_DESIGN_SYSTEM.md` §4.5 |
| U-29 | **Múi giờ:** `starts_on <= hôm nay` tính theo giờ Việt Nam |
| U-30 | Phân công `is_active=false` **không** xuất hiện trong kết quả |

**E2E — 7 kịch bản** ở `13` §7.2 + **5 kịch bản chuyển năm học** ở `15` §7.2.

---

## 13. Tóm tắt: cái gì làm được ngay

| | |
|---|--:|
| Tình huống biên đã phân tích | 67 |
| Làm được **ngay, không migration** | **63** |
| Ngoài phạm vi do Q-01 = một lớp | 4 |
| **Migration cần cho theme động** | **0** ✅ |
