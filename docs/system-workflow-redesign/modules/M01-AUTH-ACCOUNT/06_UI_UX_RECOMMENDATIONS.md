# M01-AUTH-ACCOUNT — Đánh giá UI/UX

Chỉ **đánh giá**, không redesign. Mức: **Nhỏ** (chỉnh trong file hiện có, <1h) · **Vừa** (thêm component/state) · **Lớn** (đổi cấu trúc trang/route).

## 1. Information architecture

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| `/admin` là một trang duy nhất chứa 4 nghiệp vụ không liên quan: Năm học, Tạo năm học, Cấu hình điểm danh, **Quản trị tài khoản**. `AccountAdminPanel` bị đặt ở **cuối trang**, ngoài grid chính | `src/app/(dashboard)/admin/page.tsx:33-156` | **Lớn** — `docs/06:115-119` đặc tả tách thành `/admin/accounts`, `/admin/academic-years`, `/admin/settings` |
| Không có `/staff/[staffId]` nên không có “nơi” nào là hồ sơ của một GLV | `docs/06:103` vs. `src/app/(dashboard)/staff/` chỉ có `page.tsx` | **Lớn** |
| Không có đường dẫn chéo giữa `/staff` (nơi tạo hồ sơ) và `/admin` (nơi tạo tài khoản) dù đây là một nghiệp vụ liên tục | `staff/page.tsx`, `admin/page.tsx` — không có `<Link>` nào | **Vừa** |
| `/account` là placeholder nhưng vẫn nằm trong mọi preset mobile nav (chiếm 1/5 tab) | `src/config/navigation.ts` `classStaffMobileNavigation`…, `account/page.tsx:3-5` | **Vừa** |

## 2. Navigation

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| **Không có nút Đăng xuất** ở bất kỳ đâu | `src/components/layout/user-menu.tsx:6-25` | **Vừa** (nhưng ưu tiên P0) |
| `UserMenu` dùng `<details>/<summary>` — không đóng khi bấm ra ngoài, không đóng bằng `Esc`, không quản lý focus | `user-menu.tsx:9-24` | **Vừa** |
| Sau khi hết phiên, `requireAuthContext` chuyển hướng kèm `?next=` và `?error=` nhưng `/login` **không đọc `searchParams`** → mất deep-link và mất thông báo lý do | `guards.ts:9-10` vs `login/page.tsx:7-16` | **Nhỏ** |
| `/login` không kiểm tra người dùng đã đăng nhập → hiển thị form cho người đang có phiên | `login/page.tsx:7-16` | **Nhỏ** |

## 3. Độ rõ của action

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| “Tạo mật khẩu ngẫu nhiên”, “Vô hiệu hóa”, “Lưu username”, “Đặt mật khẩu” đều thực thi **ngay, không confirm**. Chỉ “Xóa tài khoản” có `window.confirm` | `account-admin-panel.tsx:179,183,186,187` vs `:98` | **Nhỏ** |
| Không nút nào có trạng thái loading/disabled khi đang chạy → bấm đúp tạo 2 request (form “Tạo tài khoản” cũng vậy) | `account-admin-panel.tsx:117-161` — không có `isSubmitting` | **Vừa** |
| Nút “Xóa tài khoản” và “Vô hiệu hóa” cùng `variant="danger"`, cùng kích thước, cạnh nhau — dễ bấm nhầm thao tác không hoàn tác được | `account-admin-panel.tsx:187-188` | **Nhỏ** |
| Ô username là `Input` trần, không có nút “Hủy”, không phân biệt “đang sửa” vs “đã lưu” | `:178-179` | **Nhỏ** |
| `window.confirm` chặn UI thread, không style được, không đọc được bằng screen reader theo cách nhất quán | `:98` | **Vừa** |

## 4. Form & luồng thao tác

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Form “Tạo tài khoản” đọc `FormData` thủ công, **không** dùng react-hook-form/zodResolver như `LoginForm`/`ChangePasswordForm` → không có lỗi theo từng field, chỉ một dòng thông báo chung ở cuối | `account-admin-panel.tsx:31-59,162` vs `login-form.tsx:16-19` | **Vừa** |
| Toàn bộ lỗi (kể cả lỗi validation từng field) hiển thị bằng **một `<p>` duy nhất** ở cuối card, phải cuộn xuống mới thấy | `account-admin-panel.tsx:162` | **Vừa** |
| Không có gợi ý thứ tự bắt buộc “hồ sơ → phân công → tài khoản”; description card chỉ nói về mật khẩu tạm | `:113-114` | **Nhỏ** |
| Dropdown “Hồ sơ Giáo lý viên” có placeholder đổi theo role (`"Chọn hồ sơ đã phân công đúng lớp"`) — **ý tưởng tốt** nhưng danh sách **không thực sự lọc theo lớp**: `queries.ts:35` chỉ lọc `profile_id IS NULL` | `:158`, `queries.ts:35` | **Vừa** — placeholder đang **nói dối** người dùng |
| Không có empty state hướng dẫn khi chưa có hồ sơ GLV/guardian/student nào chưa link | `:138-158` chỉ có `<option>` placeholder | **Nhỏ** |
| Mật khẩu tạm hiển thị nhưng **không có nút Sao chép** — Super Admin phải bôi đen chuỗi 8 ký tự | `:163` | **Nhỏ** |
| `<select>` thô dùng class thủ công `selectClassName` thay vì component UI chung | `:21` | **Nhỏ** |

## 5. Empty / error state

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Empty state cho danh sách tài khoản: có | `:170` | ✅ |
| Thông báo thành công/thất bại dùng **cùng một biến `message`**, cùng style `text-muted-foreground` — thành công và lỗi trông giống hệt nhau | `:26,55,162` | **Nhỏ** |
| Trên `ChangePasswordForm`, lỗi server render bằng `<FormMessage tone="muted">` → lỗi trông như chú thích | `change-password-form.tsx:43` | **Nhỏ** |
| Lỗi mất phiên (NEXT_REDIRECT bị nuốt) hiển thị thành “Không thể tạo tài khoản. Vui lòng thử lại.” | `actions.ts:267-269` | **Vừa** |
| Trạng thái tài khoản hiển thị enum thô `active`/`disabled` trong UI tiếng Việt | `:174` | **Nhỏ** |
| Không hiển thị `must_change_password` → không biết ai chưa từng đăng nhập | `queries.ts:31` không select cột này | **Nhỏ** |

## 6. Responsive

**360px (mobile)**

| Quan sát | Bằng chứng | Đánh giá |
|---|---|---|
| `AuthLayout` ẩn cột thương hiệu dưới `lg`, có header logo riêng cho mobile | `(auth)/layout.tsx:10,25-28` | ✅ Tốt |
| `AccountAdminPanel` dùng `grid gap-5 xl:grid-cols-2` → mobile xếp dọc | `:110` | ✅ |
| Hàng username/password dùng `flex-col gap-2 sm:flex-row` | `:177,181` | ✅ |
| Hàng 3 nút hành động `flex flex-wrap gap-2` — trên 360px xuống 2 hàng, nút “Xóa tài khoản” có thể nằm sát nút “Vô hiệu hóa” | `:185-189` | ⚠️ **Nhỏ** |
| Danh sách tài khoản không phân trang → trên mobile là một trang cuộn rất dài | `:170` | **Vừa** |
| E2E đã kiểm không tràn ngang ở 3 viewport cho các trang Phase 2, **nhưng không phủ `/admin`** | `tests/e2e/authenticated-shell.spec.ts:36-46` | **Vừa** (thiếu test) |

**1366px (laptop)**

| Quan sát | Đánh giá |
|---|---|
| `xl:grid-cols-2` chỉ kích hoạt từ 1280px → ở 1366px panel tài khoản chia 2 cột: OK | ✅ |
| Trang `/admin` ở 1366px: 3 card trên + panel 2 cột dưới → phải cuộn khá xa mới tới phần tài khoản | **Vừa** |

## 7. Accessibility

| Tiêu chí | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| Label | `LoginForm`, `ChangePasswordForm`, `AccountAdminPanel` — mọi input đều có `<Label htmlFor>` | `login-form.tsx:34,39`, `account-admin-panel.tsx:119-159` | ✅ |
| Label | Ô username/password **trong danh sách tài khoản** chỉ có `aria-label` động (`"Tên đăng nhập <tên>"`) — chấp nhận được | `:178,182` | ✅ |
| `aria-invalid` / `aria-describedby` | Có ở `LoginForm`/`ChangePasswordForm` | `login-form.tsx:35,40` | ✅ |
| `aria-invalid` | **Không có** ở form tạo tài khoản (không có lỗi theo field) | `account-admin-panel.tsx:127-159` | **Vừa** |
| `role="status"` cho thông báo | Có ở `AccountAdminPanel` | `:162` | ✅ |
| `role="alert"` cho lỗi | **Không có** — lỗi và thành công dùng chung `role="status"` (polite), lỗi có thể bị bỏ qua | `:162` | **Nhỏ** |
| Focus management | Sau khi tạo tài khoản, focus không chuyển tới khối mật khẩu tạm → screen reader không đọc ngay | `:56-58,163` | **Nhỏ** |
| Focus | `window.confirm` trả focus không xác định sau khi đóng | `:98` | **Nhỏ** |
| Touch target ≥44px | `PasswordField` nút toggle `min-h-11 min-w-11` = 44px | `password-field.tsx:18` | ✅ Rất tốt |
| Touch target | `<select>` dùng `h-11` = 44px | `account-admin-panel.tsx:21` | ✅ |
| Touch target | `Button size="sm"` ở hàng hành động — cần kiểm tra `src/components/ui/button.tsx` có đảm bảo ≥44px không | `:186-188` | **Nhỏ** (cần xác minh) |
| Contrast | Khối mật khẩu tạm `border-warning/40 bg-warning/10` với chữ mặc định — nền rất nhạt, cần đo tỉ lệ tương phản thật | `:163` | **Nhỏ** |
| Contrast | Badge trạng thái `variant="warning"` cho `disabled` — “disabled” là trạng thái tiêu cực nhưng dùng màu cảnh báo thay vì trung tính/đỏ | `:174` | **Nhỏ** |
| Ngôn ngữ | `alt=""` cho logo trang trí — đúng | `(auth)/layout.tsx:15,26` | ✅ |
| Nhóm liên quan | Ba khối chọn hồ sơ (guardian/student/staff) render có điều kiện không dùng `<fieldset>/<legend>` | `:135-158` | **Nhỏ** |

## 8. Tổng hợp theo mức

**Lớn (đổi cấu trúc):** tách `/admin` theo `docs/06:115-119`; bổ sung `/staff/[staffId]`.

**Vừa:** thêm nút Đăng xuất; đưa form tạo tài khoản sang react-hook-form + lỗi theo field; trạng thái loading/disabled cho mọi nút; sửa dropdown hồ sơ để **thực sự lọc** theo lớp/capacity (hiện placeholder nói dối); thay `window.confirm` bằng dialog; phân trang + tìm kiếm danh sách tài khoản; `/account` thật; xử lý NEXT_REDIRECT bị nuốt; bổ sung E2E responsive cho `/admin`.

**Nhỏ:** phân biệt style thành công/lỗi; `role="alert"`; Việt hóa badge trạng thái; nút Sao chép mật khẩu tạm; confirm cho hành động phá hủy; đọc `?next=`/`?error=` ở `/login`; chuyển hướng khi đã đăng nhập; empty state hướng dẫn; `<fieldset>` cho nhóm chọn hồ sơ.
