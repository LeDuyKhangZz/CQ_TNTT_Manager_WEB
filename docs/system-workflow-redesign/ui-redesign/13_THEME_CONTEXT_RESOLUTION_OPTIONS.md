# 13 — Theme Context Resolver: thiết kế và các phương án thứ tự ưu tiên

> Đề xuất kỹ thuật cho hàm giải quyết theme dùng chung. **Chưa triển khai.**
> Quy tắc nghiệp vụ nền: `12_DYNAMIC_THEME_BUSINESS_RULES.md`. Bảng tình huống: `14_THEME_EDGE_CASE_MATRIX.md`.

---

## 1. Chữ ký hàm

```ts
// src/lib/theme/resolve-theme-context.ts
import "server-only";
import { cache } from "react";

export type ThemeKey =
  | "CHIEN_CON" | "AU_NHI" | "THIEU_NHI" | "NGHIA_SI" | "HIEP_SI"
  | "HUYNH_TRUONG";              // = Dự Trưởng + Huynh Trưởng + mặc định quản trị

export type ThemeSource =
  | "SELECTED_CHILD_BRANCH"        // phụ huynh đang xem một người con cụ thể
  | "CURRENT_RECORD_BRANCH"        // đang mở một lớp / buổi / bảng điểm cụ thể
  | "SELECTED_BRANCH_CONTEXT"      // người dùng chọn ngành ở bộ chọn ngữ cảnh
  | "PRIMARY_ACTIVE_ASSIGNMENT"    // phân công lớp/ngành đang hiệu lực
  | "SOLE_CHILD_BRANCH"            // phụ huynh chỉ có một con
  | "OWN_ENROLLMENT_BRANCH"        // thiếu nhi, ghi danh của chính em
  | "TRAINEE_CLASS_DEFAULT"        // lớp Dự trưởng — không có ngành
  | "SYSTEM_ADMIN_DEFAULT"         // trang toàn hệ thống
  | "NO_ACTIVE_ASSIGNMENT_FALLBACK";

export type FallbackReason =
  | null
  | "NO_CURRENT_ACADEMIC_YEAR"
  | "NO_ACTIVE_ASSIGNMENT"
  | "NOT_ENROLLED_THIS_YEAR"
  | "PROFILE_NOT_LINKED"
  | "NO_LINKED_CHILDREN"
  | "MULTI_BRANCH_NO_SELECTION"     // nhiều con/nhiều ngành, chưa chọn
  | "CROSS_BRANCH_SCREEN"           // màn hình đa ngành, cố ý dùng mặc định
  | "SELECTED_CONTEXT_INVALID"      // cookie trỏ tới ngữ cảnh không còn hiệu lực
  | "SELECTED_CONTEXT_FORBIDDEN"    // cookie trỏ tới ngữ cảnh ngoài quyền
  | "ROLE_CLASS_MISMATCH"           // role.class_id ≠ assignment.class_id
  | "ARCHIVED_YEAR_VIEW";           // đang xem dữ liệu năm cũ — shell giữ ngữ cảnh hiện tại

export type ContextType =
  | "PERSONAL"      // ngữ cảnh của chính người dùng
  | "CLASS"         // đang thao tác trên một lớp
  | "SECTOR"        // đang thao tác trên một ngành
  | "CHILD"         // phụ huynh đang xem một con
  | "CROSS_BRANCH"  // màn hình đa ngành
  | "SYSTEM";       // quản trị toàn hệ thống

export interface ThemeContext {
  themeKey: ThemeKey;
  branchId: string | null;          // sectors.id — null với HUYNH_TRUONG mặc định
  branchName: string;               // "Ấu Nhi" | "Huynh Trưởng" — LUÔN hiển thị được
  sourceOfTheme: ThemeSource;
  academicYearId: string | null;
  academicYearCode: string | null;  // "2026-2027" — để hiện trên header
  contextType: ContextType;
  fallbackReason: FallbackReason;
  /** Mọi ngữ cảnh người dùng ĐƯỢC PHÉP chuyển sang. Rỗng hoặc 1 phần tử ⇒ KHÔNG hiện bộ chọn. */
  availableThemeContexts: ReadonlyArray<{
    key: ThemeKey;
    branchId: string | null;
    branchName: string;
    contextType: ContextType;
    /** id của con / lớp / ngành để đặt vào cookie khi người dùng chọn */
    selectorValue: string;
    label: string;                  // "Bé Maria Nguyễn Thị A · Ấu 2A"
  }>;
  /** Cờ chỉ báo: đang xem dữ liệu năm học đã lưu trữ */
  isViewingArchivedData: boolean;
}

export interface ResolveThemeInput {
  /** Trang tự khai báo ngữ cảnh của mình. Trang toàn hệ thống truyền { kind: "SYSTEM" }. */
  scope:
    | { kind: "PERSONAL" }
    | { kind: "SYSTEM" }
    | { kind: "CROSS_BRANCH" }
    | { kind: "CLASS"; classId: string }
    | { kind: "SECTOR"; sectorId: string }
    | { kind: "CHILD"; studentId: string };
}

export const resolveThemeContext = cache(
  async (input: ResolveThemeInput): Promise<ThemeContext> => { /* … */ },
);
```

### Vì sao `scope` do **trang** truyền vào

Đây là điểm thiết kế quan trọng nhất. Ba lựa chọn đã cân nhắc:

| Cách | Đánh giá |
|---|---|
| Resolver tự đoán từ `pathname` | ✖ Phải giải mã URL, khớp regex `[classId]`, dễ sai khi thêm route. Đúng lỗi mà `navigation.ts` đang mắc (chỉ hỗ trợ path tĩnh ⇒ trang động mồ côi) |
| Mỗi trang tự tính màu | ✖ Chủ dự án cấm: *"Không để mỗi màn hình tự viết logic xác định màu riêng"* |
| **Trang khai báo `scope`, resolver quyết định màu** ⭐ | ✅ Trang chỉ nói *"tôi đang ở lớp X"* — nó vốn đã biết điều đó. Toàn bộ **quyết định** nằm trong resolver |

Đúng ranh giới trách nhiệm: *trang biết nó đang xem gì · resolver biết điều đó nghĩa là màu gì*.

---

## 2. Ba phương án thứ tự ưu tiên

### Phương án R1 — "Ngữ cảnh trang thắng tuyệt đối"

```
1. scope.kind = SYSTEM | CROSS_BRANCH        → HUYNH_TRUONG          (SYSTEM_ADMIN_DEFAULT)
2. scope.kind = CLASS                        → ngành của lớp đó      (CURRENT_RECORD_BRANCH)
3. scope.kind = SECTOR                       → ngành đó              (CURRENT_RECORD_BRANCH)
4. scope.kind = CHILD                        → ngành của con đó      (SELECTED_CHILD_BRANCH)
5. scope.kind = PERSONAL                     → ngữ cảnh cá nhân (§3)
6. mọi trường hợp còn lại                    → HUYNH_TRUONG          (NO_ACTIVE_ASSIGNMENT_FALLBACK)
```

| Ưu | Nhược |
|---|---|
| Đơn giản nhất, dễ giải thích, dễ kiểm thử | Lựa chọn ngữ cảnh của người dùng bị ngữ cảnh trang ghi đè |
| Màu **luôn khớp thứ đang hiển thị** | GLV vào lớp khác ngành sẽ thấy màu đổi — có thể gây bối rối |

---

### Phương án R2 — "Lựa chọn của người dùng thắng"

```
1. cookie ngữ cảnh hợp lệ + còn quyền        → theo lựa chọn         (SELECTED_BRANCH_CONTEXT)
2. scope.kind = SYSTEM | CROSS_BRANCH        → HUYNH_TRUONG
3. scope cụ thể (CLASS/SECTOR/CHILD)         → ngành của bản ghi
4. ngữ cảnh cá nhân
5. mặc định
```

| Ưu | Nhược |
|---|---|
| Người dùng nhiều ngành kiểm soát được | 🔴 **Màu có thể nói dối**: đang mở lớp Thiếu 1A nhưng giao diện màu Ấu Nhi vì cookie |
| | Vi phạm nguyên tắc *"màu phản ánh đúng ngành có hiệu lực trong ngữ cảnh hiện tại"* |

> ✖ **Không khuyến nghị.**

---

### Phương án R3 ⭐ — "Ngữ cảnh trang thắng, lựa chọn người dùng phá vỡ thế hoà"

```
0. Không có năm học 'current'   → HUYNH_TRUONG, fallbackReason = NO_CURRENT_ACADEMIC_YEAR
                                  (kèm banner "Chưa đặt năm học hiện hành")

1. scope.kind = SYSTEM          → HUYNH_TRUONG · SYSTEM_ADMIN_DEFAULT · SYSTEM
2. scope.kind = CROSS_BRANCH    → HUYNH_TRUONG · SYSTEM_ADMIN_DEFAULT · CROSS_BRANCH
                                  fallbackReason = CROSS_BRANCH_SCREEN
3. scope.kind = CLASS
     3a. class_kind='trainee'   → HUYNH_TRUONG · TRAINEE_CLASS_DEFAULT
     3b. còn lại                → ngành của lớp · CURRENT_RECORD_BRANCH
4. scope.kind = SECTOR          → ngành đó · CURRENT_RECORD_BRANCH
5. scope.kind = CHILD           → ngành ghi danh hiện tại của con · SELECTED_CHILD_BRANCH
6. scope.kind = PERSONAL:
     6a. audience = student
           có ghi danh mở năm hiện tại  → ngành đó · OWN_ENROLLMENT_BRANCH
           không                        → HUYNH_TRUONG · NOT_ENROLLED_THIS_YEAR
     6b. audience = guardian
           0 con                        → HUYNH_TRUONG · NO_LINKED_CHILDREN
           1 con                        → ngành con đó · SOLE_CHILD_BRANCH
           n con, cùng ngành            → ngành chung · SOLE_CHILD_BRANCH
           n con, khác ngành:
              cookie chọn con hợp lệ    → ngành con đó · SELECTED_CHILD_BRANCH
              không                     → HUYNH_TRUONG · MULTI_BRANCH_NO_SELECTION
     6c. audience = staff
           role ngành (sector_leader/deputy)  → ngành đó · PRIMARY_ACTIVE_ASSIGNMENT
           có class_staff_assignment hiệu lực → ngành của lớp · PRIMARY_ACTIVE_ASSIGNMENT
              (nhiều phân công: lấy is_primary; chưa có cột ⇒ chỉ có 1, xem R-2)
              (lớp trainee → HUYNH_TRUONG · TRAINEE_CLASS_DEFAULT)
           chỉ có role_assignments.class_id   → ngành của lớp đó
                                                 + fallbackReason=ROLE_CLASS_MISMATCH nếu lệch
           role toàn cục, không phân công     → HUYNH_TRUONG · SYSTEM_ADMIN_DEFAULT
           role = null                        → HUYNH_TRUONG · NO_ACTIVE_ASSIGNMENT
7. Mọi trường hợp còn lại       → HUYNH_TRUONG · NO_ACTIVE_ASSIGNMENT_FALLBACK
```

**Cookie ngữ cảnh chỉ được dùng ở bước 6b và 6c**, tức là **chỉ khi trang không có ngữ cảnh riêng**
và **chỉ khi thật sự có nhiều lựa chọn**. Đây là điểm khác biệt với R2.

| Ưu | Nhược |
|---|---|
| Màu **luôn khớp** thứ đang hiển thị | Nhiều nhánh hơn R1 |
| Vẫn cho người dùng nhiều ngành kiểm soát | Cần ~25 unit test để phủ hết |
| Mọi kết quả đều có `sourceOfTheme` + `fallbackReason` ⇒ **gỡ lỗi được** | |
| Không có nhánh nào rơi vào "lấy bản ghi đầu tiên" | |

> **Khuyến nghị: R3.** Cần chủ dự án chốt — `07_DECISIONS_REQUIRED.md` **Q-08**.

---

## 3. Bảo đảm tất định — không phụ thuộc thứ tự truy vấn

Chủ dự án yêu cầu: *"Không được chọn ngẫu nhiên ngành đầu tiên từ database. Không phụ thuộc vào thứ tự record được truy vấn."*

**Bảo đảm bằng ba lớp:**

1. **Mọi truy vấn có `ORDER BY` tường minh.** Không truy vấn nào dựa vào thứ tự tự nhiên.
   Thứ tự chuẩn: `sectors.sort_order` → `classes.display_name` → `students.full_name` → `id` (chốt cuối, luôn tất định).
2. **Khi có nhiều ứng viên mà không có tiêu chí chọn** → **KHÔNG chọn**. Trả `HUYNH_TRUONG` +
   `fallbackReason = 'MULTI_BRANCH_NO_SELECTION'` và hiện bộ chọn.
   *Thà trung tính còn hơn đoán sai.*
3. **Unit test bắt buộc:** chạy resolver 100 lần trên cùng dữ liệu có nhiều ứng viên, khẳng định kết quả **giống hệt nhau**.

---

## 4. Truy vấn — chi phí

Toàn bộ resolver là **một truy vấn**, ghép sẵn ở tầng cơ sở dữ liệu:

```sql
-- Đề xuất: view app-level, đọc qua RLS của chính người gọi (security invoker)
create or replace view public.v_my_theme_context as
select
  ay.id              as academic_year_id,
  ay.code            as academic_year_code,
  sector.id          as sector_id,
  sector.code        as sector_code,
  sector.name        as sector_name,
  cls.class_kind,
  cls.id             as class_id,
  'STAFF_ASSIGNMENT' as origin
from public.academic_years ay
join public.class_staff_assignments csa on csa.is_active and csa.ends_on is null
join public.staff_profiles sp on sp.id = csa.staff_profile_id and sp.profile_id = auth.uid()
join public.classes cls on cls.id = csa.class_id and cls.academic_year_id = ay.id
left join public.grade_levels gl on gl.id = cls.grade_level_id
left join public.sectors sector on sector.id = gl.sector_id
where ay.status = 'current'
union all
  /* … nhánh sector_leader, nhánh student, nhánh guardian … */
order by origin, sector_code, class_id;   -- tất định
```

Bọc trong `React.cache()` ⇒ **1 lượt đi cơ sở dữ liệu cho mỗi request**, dùng chung cho toàn bộ cây component —
đúng khuôn mẫu `getAuthContext` (`src/lib/auth/session.ts:18`) đã chứng minh hiệu quả.

⚠️ View phải là **security invoker** (mặc định của Postgres cho view thường) để RLS của người gọi vẫn áp dụng —
giống cách `report_attendance_rows()` đang làm (`02_ROLE_PERMISSION_MAP.md` §M11).

---

## 5. Bơm token vào giao diện

```tsx
// src/app/(dashboard)/layout.tsx
const theme = await resolveThemeContext({ scope: { kind: "PERSONAL" } });

<AppShell themeContext={theme} …>
```

```tsx
// src/components/theme/theme-provider.tsx  (Server Component, không cần "use client")
export function ThemeScope({ theme, children }: { theme: ThemeContext; children: React.ReactNode }) {
  const p = SECTOR_PALETTE[theme.themeKey];
  return (
    <div
      data-theme-key={theme.themeKey}
      data-theme-source={theme.sourceOfTheme}
      style={{
        "--theme-primary":        p.primary,
        "--theme-primary-hover":  p.primaryHover,
        "--theme-primary-active": p.primaryActive,
        "--theme-subtle":         p.primarySubtle,
        "--theme-on-primary":     p.foregroundOnPrimary,  // ĐỎ/XANH → trắng; NGHĨA SĨ → chữ đậm
        "--theme-accent-text":    p.accentText,
        "--theme-border":         p.border,
        "--theme-ring":           p.focusRing,
        "--theme-chart":          p.chartAccent,
        "--theme-selected-bg":    p.selectedBackground,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
```

**Vì sao dùng CSS variable inline chứ không phải class `.theme-au-nhi`:**

| | inline CSS var ⭐ | class theo ngành |
|---|---|---|
| Số bản sao component | **1** | 1 (nhưng cần 6 khối CSS) |
| Kích thước CSS | không đổi | +6 khối token |
| Lồng ngữ cảnh (thẻ ngành A trong trang ngành B) | ✅ tự nhiên — biến kế thừa theo cây DOM | Phải viết chọn lọc phức tạp |
| Nhấp nháy khi tải | ✅ không — nằm trong HTML đầu tiên | ✅ không |
| Debug | ✅ `data-theme-key` + `data-theme-source` hiện thẳng trên DOM | Khá |

Khả năng lồng ngữ cảnh là lý do quyết định: trang `/classes` (mặc định đỏ–vàng) chứa 19 thẻ lớp,
**mỗi thẻ tự bọc `ThemeScope` của ngành mình** ⇒ viền trái và chip màu đúng, không cần class riêng.

---

## 6. Thành phần giao diện đi kèm resolver

| Component | Khi nào hiện | Ghi chú |
|---|---|---|
| `BranchChip` | Mọi nơi có dữ liệu thuộc ngành | Chấm màu **+ tên ngành bằng chữ** — bắt buộc (`03` §5.1) |
| `ContextIndicator` | Đầu sidebar / dưới tiêu đề trang | *"Đang xem: **Ngành Ấu Nhi** · Năm học 2026–2027"* — **chữ, không phải màu** |
| `ChildSwitcher` | Phụ huynh có **≥2 con** | Ẩn hoàn toàn khi 1 con (D-64) |
| `BranchContextSwitcher` | `availableThemeContexts.length ≥ 2` | Chỉ xuất hiện nếu Q-01 mở đường nhiều ngành |
| `AcademicYearSwitcher` | Header, mọi vai trò | **Thay thế nút chết hiện tại**; hiện cả trên mobile |
| `UnassignedBanner` | `fallbackReason` ∈ {chưa phân công} | Câu chữ ở `12` §4.6 |
| `ArchivedYearBanner` | `isViewingArchivedData = true` | *"Đang xem dữ liệu năm học 2025–2026 (đã lưu trữ)"* |

**Quy tắc chung:** mọi component trên **nói bằng chữ trước, màu sau**.

---

## 7. Kiểm thử

### 7.1 Unit test cho resolver — 25 tình huống chủ dự án yêu cầu

| # | Tình huống | Kỳ vọng `themeKey` / `sourceOfTheme` |
|---|---|---|
| 1 | Ấu 3 → Thiếu 1 khi chuyển năm học | `THIEU_NHI` / `OWN_ENROLLMENT_BRANCH` |
| 2 | Thiếu 3 → Nghĩa 1 | `NGHIA_SI` / `OWN_ENROLLMENT_BRANCH` |
| 3 | GLV năm trước ngành Ấu, năm nay ngành Thiếu | `THIEU_NHI` / `PRIMARY_ACTIVE_ASSIGNMENT` |
| 4 | GLV hai lớp **cùng ngành** | ngành đó, ổn định qua 100 lần chạy |
| 5 | GLV hai **ngành** | `HUYNH_TRUONG` / `MULTI_BRANCH_NO_SELECTION` nếu chưa chọn; đúng ngành nếu đã chọn |
| 6 | Trưởng ngành kiêm GLV | ngành phụ trách ở `PERSONAL`; ngành của lớp khi `scope=CLASS` |
| 7 | Phụ huynh 1 con vừa chuyển ngành | ngành mới / `SOLE_CHILD_BRANCH` |
| 8 | Phụ huynh 2 con cùng ngành | ngành chung / `SOLE_CHILD_BRANCH` |
| 9 | Phụ huynh 2 con khác ngành, đổi con đang xem | đổi theo con / `SELECTED_CHILD_BRANCH` |
| 10 | Admin không thuộc ngành | `HUYNH_TRUONG` / `SYSTEM_ADMIN_DEFAULT` |
| 11 | Admin kiêm GLV | `HUYNH_TRUONG` ở `/admin`; ngành của lớp ở `scope=CLASS` |
| 12 | Tài khoản chưa phân công | `HUYNH_TRUONG` / `NO_ACTIVE_ASSIGNMENT` |
| 13 | Phân công năm mới **chưa hiệu lực** | 🔴 vẫn giữ ngành năm **hiện tại** |
| 14 | Kích hoạt năm học mới | ngành đổi ngay ở lần dựng trang kế tiếp |
| 15 | Chuyển ngành **giữa năm** | ngành mới ngay khi phân công mới hiệu lực |
| 16 | Huỷ phân công | `NO_ACTIVE_ASSIGNMENT` |
| 17 | Lưu trữ rồi khôi phục hồ sơ | mất theme ngành → khôi phục lại đúng ngành cũ |
| 18 | Phân công cũ (`is_active=false`) **không** được dùng | khẳng định không xuất hiện trong kết quả |
| 19 | Theme cập nhật sau khi dữ liệu đổi | dựng lại trang cho kết quả mới |
| 20 | Trang báo cáo toàn hệ thống | `HUYNH_TRUONG` / `CROSS_BRANCH_SCREEN` — **không** lấy ngẫu nhiên ngành |
| 21 | Xem dữ liệu lịch sử | `themeKey` **không đổi**, `isViewingArchivedData = true` |
| 22 | Nhiều vai trò → đúng theme context | (R-1: chỉ một vai trò — test khẳng định `maybeSingle` fail-closed) |
| 23 | Cookie trỏ ngành **ngoài quyền** | bỏ qua cookie, `SELECTED_CONTEXT_FORBIDDEN` |
| 24 | Tải lại trang / đăng nhập lại | kết quả giống hệt |
| 25 | Hai tab, phân công vừa đổi | tab mới đúng ngay; tab cũ đúng sau một lần điều hướng |

**Cộng thêm:**
- Test **tất định**: 100 lần chạy trên dữ liệu nhiều ứng viên → kết quả giống hệt.
- Test **canh bảng màu**: mọi `sectors.code` trong `seed.sql` đều có mục trong `SECTOR_PALETTE`,
  **và số lượng khớp** (theo khuôn mẫu tốt nhất của dự án — `04_SYSTEM_WIDE_FINDINGS.md` điểm mạnh #8).
- Test **tương phản**: duyệt toàn bộ `SECTOR_PALETTE`, khẳng định
  `contrast(foregroundOnPrimary, primary) ≥ 4.5` và `contrast(accentText, primarySubtle) ≥ 4.5`
  cho **cả 6 bộ**. Đây là hàng rào chống hồi quy màu — sửa hex sai là test đỏ ngay.
- Test **múi giờ**: `starts_on <= hôm nay` tính theo giờ Việt Nam, không theo giờ máy chủ (chống lặp lại SW-08).

### 7.2 E2E (Playwright)

| # | Kịch bản |
|---|---|
| E1 | Đăng nhập bằng GLV ngành Ấu → `[data-theme-key="AU_NHI"]` trên shell |
| E2 | Mở lớp Thiếu 1B → `[data-theme-key="THIEU_NHI"]`, `ContextIndicator` đọc "Ngành Thiếu Nhi" |
| E3 | Phụ huynh 2 con khác ngành: trang danh sách con `HUYNH_TRUONG`; chọn con → đổi cả nội dung lẫn màu |
| E4 | `/admin` luôn `HUYNH_TRUONG` kể cả khi tài khoản có phân công lớp |
| E5 | Kích hoạt năm học mới → GLV tải lại → màu mới, **không** cần đăng xuất |
| E6 | Xem báo cáo năm cũ → shell giữ màu, có banner "đã lưu trữ" |
| E7 | Kiểm tương phản chữ chính trên **cả 6 theme** ở 3 viewport |

---

## 8. Điều cần chủ dự án duyệt

| # | Nội dung | Mục |
|---|---|---|
| 1 | Chọn thứ tự ưu tiên **R1 / R2 / R3** | §2 |
| 2 | Xác nhận: trang **khai báo `scope`**, resolver quyết định màu | §1 |
| 3 | Xác nhận: khi mơ hồ thì **trung tính + hiện bộ chọn**, không đoán | §3 |
| 4 | Xác nhận hình dạng `ThemeContext` trả về (10 trường) | §1 |
| 5 | Xác nhận bơm token bằng **CSS variable inline** thay vì class theo ngành | §5 |
