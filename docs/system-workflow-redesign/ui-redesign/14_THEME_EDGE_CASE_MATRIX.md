# 14 — Bảng tình huống biên của theme

> Mỗi dòng là một tình huống chủ dự án nêu, kèm: kết quả theme · nguồn · lý do dự phòng ·
> **có làm được với schema hiện tại không** · và chỉ báo bằng chữ bắt buộc kèm theo.
>
> Ký hiệu: `HT` = HUYNH_TRUONG (đỏ–vàng, cũng là theme mặc định) ·
> 🔴 = **cần migration hoặc quyết định nghiệp vụ** · ✅ = làm được ngay.

---

## A. Thiếu nhi

| # | Tình huống | `themeKey` | `sourceOfTheme` | `fallbackReason` | Schema |
|---|---|---|---|---|:--:|
| A1 | Em học Ấu 2A, năm học hiện tại | `AU_NHI` | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A2 | **Ấu 3 → Thiếu 1** sau khi kích hoạt năm mới | `THIEU_NHI` | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A3 | **Thiếu 3 → Nghĩa 1** | `NGHIA_SI` | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A4 | **Nghĩa 3 → Hiệp 1** | `HIEP_SI` | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A5 | **Chiên Con 2 → Ấu 1** | `AU_NHI` | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A6 | Em học lớp **Dự trưởng** | `HT` | `TRAINEE_CLASS_DEFAULT` | — | ✅ *(lớp trainee `grade_level_id IS NULL` ⇒ không có ngành)* |
| A7 | Chuyển lớp **giữa năm**, cùng ngành | ngành đó (không đổi) | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A8 | Chuyển lớp **giữa năm**, khác ngành | ngành **mới**, ngay khi ghi danh mới hiệu lực | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A9 | Ghi danh **`paused`** (tạm nghỉ) | **giữ ngành đó** + badge "Tạm nghỉ" | `OWN_ENROLLMENT_BRANCH` | — | ✅ |
| A10 | Ghi danh đã `ended`, chưa có ghi danh mới | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NOT_ENROLLED_THIS_YEAR` | ✅ |
| A11 | Chưa xếp lớp cho năm học mới | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NOT_ENROLLED_THIS_YEAR` | ✅ |
| A12 | Tài khoản chưa liên kết `students` | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `PROFILE_NOT_LINKED` | ✅ |
| A13 | Hồ sơ đã **lưu trữ** | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `PROFILE_NOT_LINKED` | ✅ |
| A14 | Xem điểm danh **năm học cũ** | **không đổi** | (giữ nguyên) | `ARCHIVED_YEAR_VIEW` | ✅ |
| A15 | Đã có ghi danh cho năm mới **chưa kích hoạt** | 🔴 **giữ ngành năm HIỆN TẠI** | `OWN_ENROLLMENT_BRANCH` | — | ✅ *(lọc `academic_year_id = năm 'current'` là đủ)* |

**Chỉ báo bắt buộc:** A6 hiện chip "Dự trưởng" · A9 badge "Tạm nghỉ" · A10–A13 banner theo `12` §4.6 · A14 banner "đã lưu trữ".

---

## B. Phụ huynh

| # | Tình huống | `themeKey` | `sourceOfTheme` | `fallbackReason` | Schema |
|---|---|---|---|---|:--:|
| B1 | **1 con**, học Thiếu 1A | `THIEU_NHI` | `SOLE_CHILD_BRANCH` | — | ✅ |
| B2 | 1 con, con **vừa chuyển ngành** năm mới | ngành mới, tự đổi | `SOLE_CHILD_BRANCH` | — | ✅ |
| B3 | **2 con cùng ngành** | ngành chung | `SOLE_CHILD_BRANCH` | — | ✅ |
| B4 | **2 con khác ngành**, ở trang danh sách con | 🔴 `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `MULTI_BRANCH_NO_SELECTION` | ✅ |
| B5 | 2 con khác ngành, **đang mở trang con A** | ngành con A | `SELECTED_CHILD_BRANCH` | — | ✅ |
| B6 | 2 con khác ngành, đổi sang con B | ngành con B — **nội dung đổi cùng lúc** | `SELECTED_CHILD_BRANCH` | — | ✅ |
| B7 | 2 con, một con **chưa xếp lớp** | con đó hiện chip "Chưa xếp lớp"; theme theo con còn lại nếu chỉ còn một ngành | `SOLE_CHILD_BRANCH` | — | ✅ |
| B8 | Chưa liên kết con nào | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NO_LINKED_CHILDREN` | ✅ |
| B9 | Cookie trỏ tới **con không phải của mình** | `HT`, bỏ qua cookie | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `SELECTED_CONTEXT_FORBIDDEN` | ✅ *(RLS + `own_student_ids()` chặn)* |
| B10 | Cookie trỏ tới con **đã hết ghi danh** | như B4/B1 tuỳ số con còn lại | — | `SELECTED_CONTEXT_INVALID` | ✅ |
| B11 | Phụ huynh **đồng thời là GLV** | Ở `/parent/*`: theo con · Ở trang nhân sự: theo phân công lớp | tương ứng | — | ✅ *(D-25 đã mở route)* |

**Bắt buộc B5/B6:** tiêu đề trang = **tên con**, có avatar chữ cái đầu và chip ngành.
Không được đổi màu mà không đổi dữ liệu.

---

## C. Giáo lý viên và nhân sự

| # | Tình huống | `themeKey` | `sourceOfTheme` | `fallbackReason` | Schema |
|---|---|---|---|---|:--:|
| C1 | GLV phụ trách **một lớp** ngành Ấu | `AU_NHI` | `PRIMARY_ACTIVE_ASSIGNMENT` | — | ✅ |
| C2 | **Năm trước ngành Ấu, năm nay ngành Thiếu** | `THIEU_NHI` | `PRIMARY_ACTIVE_ASSIGNMENT` | — | ✅ *(phân công cũ `is_active=false`, `ends_on` đã đặt)* |
| C3 | Phụ trách **2 lớp cùng ngành** | ngành đó | `PRIMARY_ACTIVE_ASSIGNMENT` | — | 🔴 **Q-01** — index chặn 2 phân công |
| C4 | Phụ trách **2 ngành**, chưa chọn ngữ cảnh | `HT` + hiện bộ chọn | — | `MULTI_BRANCH_NO_SELECTION` | 🔴 **Q-01** + cần cột `is_primary` |
| C5 | Phụ trách 2 ngành, **đã chọn** ngành Thiếu | `THIEU_NHI` | `SELECTED_BRANCH_CONTEXT` | — | 🔴 **Q-01** |
| C6 | GLV lớp **Dự trưởng** | `HT` | `TRAINEE_CLASS_DEFAULT` | — | ✅ |
| C7 | **Trưởng ngành** ngành Nghĩa | `NGHIA_SI` | `PRIMARY_ACTIVE_ASSIGNMENT` | — | ✅ *(`role_assignments.sector_id` not null)* |
| C8 | Trưởng ngành Nghĩa **kiêm GLV lớp Ấu 1A** | `PERSONAL` → `NGHIA_SI` · mở lớp Ấu 1A → `AU_NHI` | tương ứng | — | ✅ |
| C9 | `role.class_id` ≠ `class_staff_assignment.class_id` | ngành theo **`class_staff_assignment`** | `PRIMARY_ACTIVE_ASSIGNMENT` | `ROLE_CLASS_MISMATCH` | ✅ — cần cảnh báo cho Super Admin |
| C10 | **Huỷ phân công** (`is_active=false`) | `HT` | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NO_ACTIVE_ASSIGNMENT` | ✅ |
| C11 | **Mất vai trò khi đổi lớp** (lỗi M04-F06) | `HT` + banner "Tài khoản chưa được gán vai trò" | — | `NO_ACTIVE_ASSIGNMENT` | ✅ — theme **phơi bày** lỗi này thay vì che giấu |
| C12 | `staff_profiles.service_status` = tạm ngưng | `HT` + badge "Tạm ngưng phục vụ" | — | `NO_ACTIVE_ASSIGNMENT` | ✅ — chỉ cần **đọc cột đã có** (SW-11) |
| C13 | Phân công cho **năm học chưa kích hoạt** | 🔴 **giữ ngành năm hiện tại** | `PRIMARY_ACTIVE_ASSIGNMENT` | — | ✅ |
| C14 | Đổi lớp **giữa năm**, khác ngành | ngành mới ngay khi phân công mới hiệu lực | `PRIMARY_ACTIVE_ASSIGNMENT` | — | ✅ |
| C15 | `starts_on` ở **tương lai** | không tính | — | tuỳ nhánh khác | ✅ — nhớ dùng **giờ Việt Nam** (SW-08) |

---

## D. Vai trò toàn cục và quản trị

| # | Tình huống | `themeKey` | `sourceOfTheme` | `fallbackReason` | Schema |
|---|---|---|---|---|:--:|
| D1 | Super Admin ở `/admin` | `HT` | `SYSTEM_ADMIN_DEFAULT` | — | ✅ |
| D2 | Super Admin **kiêm GLV**, ở `/admin` | `HT` — vai trò quản trị thắng ở trang hệ thống | `SYSTEM_ADMIN_DEFAULT` | — | ✅ |
| D3 | Super Admin kiêm GLV, mở lớp Ấu 1A | `AU_NHI` | `CURRENT_RECORD_BRANCH` | — | ✅ |
| D4 | Thư ký ở `/students` toàn xứ đoàn | `HT`, mỗi hàng có chip ngành | `SYSTEM_ADMIN_DEFAULT` | `CROSS_BRANCH_SCREEN` | ✅ |
| D5 | Cha sở ở `/dashboard` | `HT` | `SYSTEM_ADMIN_DEFAULT` | — | ✅ |
| D6 | Thủ quỹ ở `/students` (sau D-67) | `HT` | `SYSTEM_ADMIN_DEFAULT` | `CROSS_BRANCH_SCREEN` | ✅ |
| D7 | `/reports` **chưa lọc** ngành | `HT` | `SYSTEM_ADMIN_DEFAULT` | `CROSS_BRANCH_SCREEN` | ✅ |
| D8 | `/reports` **đã lọc** về ngành Hiệp | ⚠ `HIEP_SI` hoặc giữ `HT` | — | — | ✅ — **Q-07 cần chốt** |
| D9 | `/classes` — 19 lớp, 5 ngành | shell `HT`; **mỗi thẻ lớp bọc `ThemeScope` riêng** | `SYSTEM_ADMIN_DEFAULT` | `CROSS_BRANCH_SCREEN` | ✅ |
| D10 | `/imports` | `HT` | `SYSTEM_ADMIN_DEFAULT` | — | ✅ |
| D11 | `role = null` (chưa gán vai trò) | `HT` + banner | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NO_ACTIVE_ASSIGNMENT` | ✅ |
| D12 | **Không có năm học `current`** | `HT` + banner "Chưa đặt năm học hiện hành" | `NO_ACTIVE_ASSIGNMENT_FALLBACK` | `NO_CURRENT_ACADEMIC_YEAR` | ✅ |
| D13 | Tài khoản bị **khoá** | không tới được — chặn ở `app.current_role()` (tầng DB) | — | — | ✅ |

---

## E. Cache, phiên và nhiều tab

| # | Tình huống | Hành vi kỳ vọng | Cơ chế |
|---|---|---|---|
| E1 | Quản trị viên đổi phân công, người dùng đang mở trang | Lần điều hướng kế tiếp ra màu mới | Server Component dựng lại mỗi request |
| E2 | Người dùng **tải lại trang** | Màu đúng ngay | Không có cache sống lâu hơn request |
| E3 | Người dùng **đăng xuất rồi đăng nhập lại** | Màu đúng | Ngành **không** nằm trong session/JWT |
| E4 | **Hai tab**, phân công vừa đổi | Tab mới đúng ngay; tab cũ đúng sau một lần điều hướng | Chấp nhận được — HTML đã dựng không tự cập nhật |
| E5 | Cookie ngữ cảnh còn từ **năm học trước** | Bị bỏ qua, `SELECTED_CONTEXT_INVALID` | Xác thực lại mỗi request (`12` §6.3) |
| E6 | Local storage của **người dùng trước** trên máy chung | Không ảnh hưởng | **Không dùng local storage cho ngành** |
| E7 | Service worker giữ trang cũ | Không xảy ra | SW **cố ý không cache HTML** |
| E8 | Vừa kích hoạt năm học mới | Xem `15_ACADEMIC_YEAR_THEME_TRANSITION.md` | `revalidatePath('/', 'layout')` |

---

## F. Bảo mật

| # | Tình huống | Hành vi bắt buộc |
|---|---|---|
| F1 | Người dùng sửa cookie thành id ngành **không có quyền** | Bỏ qua cookie, `SELECTED_CONTEXT_FORBIDDEN`. **RLS vẫn là chốt chặn cuối** cho dữ liệu |
| F2 | Người dùng sửa cookie thành id **con của người khác** | `own_student_ids()` + RLS trả rỗng ⇒ resolver không tìm thấy ⇒ dự phòng. **Không lộ tên em** |
| F3 | Suy ra ngành có làm lộ dữ liệu không? | Không — resolver **chỉ đọc qua RLS của chính người dùng** (view `security invoker`) |
| F4 | Màu có tiết lộ thông tin ngoài quyền không? | Không — người dùng chỉ thấy màu của ngữ cảnh họ đã được phép vào |
| F5 | `availableThemeContexts` có làm lộ danh sách ngành không? | Chỉ liệt kê ngữ cảnh người dùng **thực sự có quyền**; xây từ chính truy vấn đã qua RLS |

---

## G. Tổng hợp: cái gì làm được ngay, cái gì bị chặn

| Nhóm | Số tình huống | Làm được ngay | Bị chặn |
|---|--:|--:|--:|
| A · Thiếu nhi | 15 | **15** | 0 |
| B · Phụ huynh | 11 | **11** | 0 |
| C · Giáo lý viên | 15 | 12 | **3** (C3, C4, C5 — đều do Q-01) |
| D · Toàn cục | 13 | 12 | 1 (D8 — chỉ cần chốt, không cần migration) |
| E · Cache | 8 | **8** | 0 |
| F · Bảo mật | 5 | **5** | 0 |
| **Tổng** | **67** | **63 (94%)** | **4** |

> **Kết luận:** schema hiện tại đủ cho **94%** tình huống. Bốn tình huống còn lại đều xoay quanh
> **một câu hỏi duy nhất: một Giáo lý viên có được phụ trách nhiều lớp không?** (`07_DECISIONS_REQUIRED.md` Q-01).
>
> Nếu câu trả lời là **"không"** — toàn bộ theme động triển khai được **ngay, không cần migration nào**.
> Nếu là **"có"** — cần một migration nhỏ (`is_primary`) nhưng kéo theo việc rà lại 6 hàm quyền và 23 bộ pgTAP,
> và đó là **việc nghiệp vụ phải làm trước**, không phải việc giao diện.
