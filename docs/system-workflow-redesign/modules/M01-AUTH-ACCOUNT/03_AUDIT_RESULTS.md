# M01-AUTH-ACCOUNT — Kết quả chấm điểm

Thang 1–5 cho 15 tiêu chí, tổng tối đa **75**.

Ký hiệu tiêu chí:
`C1` đúng nghiệp vụ · `C2` dễ hiểu · `C3` số bước hợp lý · `C4` không nhập trùng · `C5` khó thao tác nhầm · `C6` validation đầy đủ · `C7` trạng thái rõ ràng · `C8` phân quyền an toàn · `C9` dữ liệu nhất quán · `C10` dễ bảo trì · `C11` dễ mở rộng · `C12` UI hỗ trợ đúng nghiệp vụ · `C13` responsive · `C14` accessibility · `C15` khả năng kiểm thử.

## 1. Bảng tổng hợp

| ID | Tên luồng | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | Tổng /75 | Trạng thái | Ưu tiên |
|---|---|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--:|---|---|
| M01-F01 | Đăng nhập | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 5 | 5 | 4 | **69** | PASS_WITH_MINOR_UI_FIX | P2 |
| M01-F02 | Đổi mật khẩu của mình | 4 | 4 | 5 | 5 | 4 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 5 | 4 | 3 | **57** | NEEDS_IMPROVEMENT | P1 |
| M01-F03 | Tạo tài khoản (WF-02) | 4 | 2 | 1 | 3 | 2 | 4 | 2 | 5 | 3 | 3 | 2 | 2 | 4 | 3 | 2 | **42** | **CRITICAL** | **P0** |
| M01-F04 | Đổi tên đăng nhập | 3 | 3 | 4 | 4 | 2 | 3 | 3 | 5 | 2 | 4 | 3 | 3 | 4 | 3 | 2 | **48** | NEEDS_IMPROVEMENT | P1 |
| M01-F05 | Đặt mật khẩu thủ công | 5 | 4 | 5 | 5 | 3 | 4 | 4 | 5 | 4 | 4 | 4 | 3 | 4 | 3 | 3 | **60** | PASS_WITH_MINOR_UI_FIX | P2 |
| M01-F06 | Sinh mật khẩu ngẫu nhiên | 5 | 4 | 5 | 5 | 2 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 3 | **64** | PASS_WITH_MINOR_UI_FIX | P2 |
| M01-F07 | Vô hiệu hóa / kích hoạt | 4 | 3 | 5 | 5 | 2 | 3 | 3 | 5 | 2 | 4 | 3 | 3 | 4 | 3 | 2 | **51** | NEEDS_IMPROVEMENT | P1 |
| M01-F08 | Xóa tài khoản | 3 | 3 | 5 | 5 | 2 | 3 | 3 | 5 | 1 | 4 | 3 | 3 | 4 | 2 | 2 | **48** | **CRITICAL** (mất lịch sử role) | **P0** |
| M01-F09 | Danh sách tài khoản | 4 | 3 | 4 | 5 | 4 | 4 | 2 | 5 | 4 | 3 | 2 | 2 | 3 | 3 | 3 | **51** | NEEDS_IMPROVEMENT | P1 |
| M01-F10 | Trang `/account` | 1 | 2 | — | — | 2 | 1 | 1 | 5 | 3 | 3 | 3 | 1 | 3 | 3 | 1 | **29** | NEEDS_IMPROVEMENT | P1 |
| M01-F11 | Đăng xuất | 1 | 1 | 1 | 3 | 1 | 1 | 1 | 1 | 3 | 3 | 3 | 1 | 3 | 1 | 1 | **25** | **CRITICAL** (không tồn tại) | **P0** |
| M01-F12 | Gán/đổi primary role | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 3 | 1 | 2 | 1 | 1 | 3 | 1 | 1 | **20** | **CRITICAL** (không tồn tại) | **P0** |

Ghi chú C3/C4 của F10 để trống vì luồng chưa tồn tại đủ để đo số bước.

## 2. Lý do chấm — điểm thấp đáng chú ý

### M01-F03 — Tạo tài khoản (42/75, CRITICAL)

- **C3 = 1**: 2 trang, 3 form, tối thiểu 3 submit cho một GLV lớp (`staff/page.tsx:52-72` → `admin/page.tsx:156`). Không có bất kỳ liên kết điều hướng nào giữa `/staff` và `/admin`.
- **C2 = 2**: thứ tự bắt buộc (hồ sơ → phân công → tài khoản) **không được viết ở đâu trong UI**. `docs/03-workflow.md:56-63` mô tả đúng thứ tự nhưng người dùng không đọc docs.
- **C5 = 2**: chọn sai capacity ở bước phân công (`staff/page.tsx:69`) chỉ bị phát hiện ở bước cuối, sau khi đã tạo và xóa một auth user.
- **C7 = 2**: `ROLE_CAPACITY_MISMATCH`, `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`, `STAFF_PROFILE_REQUIRED`, `CLASS_YEAR_MISMATCH` bị gộp thành một câu duy nhất `"Role hoặc phạm vi tài khoản không hợp lệ."` (`actions.ts:262`).
- **C11 = 2**: mỗi loại hồ sơ mới (ví dụ role “Ban điều hành”) phải copy-paste một khối 3 lần trong `actions.ts:114-158` và một khối bù trừ trong `:250-263`.
- **C15 = 2**: 0 test cho action này; `tests/unit/auth-schemas.test.ts` không phủ nhánh `STAFF_PROFILE_ROLES`.
- **C8 = 5**: phân quyền **đúng và chặt** — `requireSuperAdmin` (`actions.ts:37-41`), service role chỉ ở server (`admin.ts:1`), trigger DB là chốt cuối. Đây là phần tốt, phải giữ.

### M01-F08 — Xóa tài khoản (48/75, CRITICAL vì C9 = 1)

`role_assignments.profile_id ... on delete cascade` (`20260715000100:64`) xóa sạch lịch sử role khi xóa account, trong khi chính bảng đó được đặt tên/đánh index là “role history” (`:89-90`) và `docs/03-workflow.md:96` chỉ yêu cầu giữ **hồ sơ nghiệp vụ**, không nói gì về lịch sử role — nhưng `docs/01-business-analysis.md` và `docs/02` coi role history là dữ liệu nghiệp vụ. → **NEEDS_CONFIRMATION** (câu hỏi Q3).

### M01-F11 / M01-F12 — hai luồng bắt buộc nhưng không tồn tại

Không phải “làm chưa đẹp” mà là **thiếu hẳn**. F11 là rủi ro bảo mật trực tiếp trên thiết bị dùng chung (nhà xứ, máy tính phòng học). F12 là gốc của lỗi mất role ở M04-F06.

## 3. Phân tích 5 Whys

### 5W-01 — Luồng tạo tài khoản GLV bị tách làm hai quy trình rườm rà (M01-F03)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Người dùng phải nhớ “vào `/staff` tạo hồ sơ, rồi lại vào `/staff` phân công, rồi mới sang `/admin` tạo tài khoản”. Sai thứ tự thì bị lỗi mơ hồ ở bước cuối. |
| **Điểm đau** | Không có điểm bắt đầu duy nhất. Hai màn hình thuộc hai vùng menu khác nhau (`Mục vụ` vs `Điều hành`, `src/config/navigation.ts`), không có link chéo, không có trang chi tiết `/staff/[staffId]` để nối chúng. |
| **Nguyên nhân trực tiếp** | Giao diện được cắt theo **ranh giới quyền** (staff-write vs super-admin-only) chứ không theo **hành trình nghiệp vụ**. `AccountAdminPanel` bị nhét vào cuối `/admin` (`admin/page.tsx:156`) cùng trang với cấu hình năm học và điểm danh. |
| **Nguyên nhân gốc** | Ràng buộc nghiệp vụ “role lớp cần `class_staff_assignments` active đúng capacity” được cài ở **trigger DB** (`20260715000400:188-196`) nhưng **không được phản ánh ở tầng UI**: không có bước dẫn, không có kiểm tra trước, không có thông báo riêng. Tầng UI không biết gì về thứ tự mà tầng DB bắt buộc. Cộng thêm việc `/staff/[staffId]` trong `docs/06-ui-ux-spec.md:103` chưa được triển khai nên không có “nơi” tự nhiên để đặt hành động tạo tài khoản. |
| **Hậu quả** | **Nghiệp vụ:** thời gian cấp tài khoản cho ~100 GLV đầu năm tăng gấp 3; dễ bỏ sót người. **Dữ liệu:** phát sinh hồ sơ GLV mồ côi (không account) không ai theo dõi được vì danh sách `/staff` không hiển thị cột “đã có tài khoản”. **Phân quyền:** Super Admin trở thành nút cổ chai duy nhất cho cả 14 role, tăng áp lực nới quyền sai cách. **UX:** lỗi cuối luồng buộc quay lại đầu luồng — vi phạm nguyên tắc “fail early”. |

### 5W-02 — Không có nút đăng xuất (M01-F11)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | `UserMenu` chỉ có một link `/account` (`user-menu.tsx:22`); không tìm thấy `signOut` nào ngoài `actions.ts:79`. |
| **Điểm đau** | Người dùng trên máy dùng chung phải xóa cookie trình duyệt để thoát. Không thể đổi tài khoản để kiểm thử. |
| **Nguyên nhân trực tiếp** | `/account` được lên kế hoạch chứa chức năng này nhưng vẫn là placeholder (`account/page.tsx:3-5`). |
| **Nguyên nhân gốc** | Phase plan coi `/account` là “Phase 1 placeholder” và không có tiêu chí chấp nhận nào bắt buộc “đăng xuất được” trước khi mở các phase nghiệp vụ; không có E2E nào kiểm tra vòng đời phiên đầy đủ (`tests/e2e/authenticated-shell.spec.ts` chỉ đăng nhập). |
| **Hậu quả** | **Bảo mật:** phiên tồn tại tới khi hết hạn refresh token trên thiết bị dùng chung tại nhà xứ — rủi ro thật vì hệ thống chứa dữ liệu sức khỏe/bí tích của trẻ em (`docs/10`). **Kiểm thử:** E2E phải mở `browser.newContext()` mỗi lần đổi vai (`tests/e2e/security.spec.ts:74-88`). |

### 5W-03 — Không thể đổi role của tài khoản đã có (M01-F12)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | Một GLV chuyển từ lớp Ấu 1A sang Thiếu 2B sẽ mất toàn bộ quyền và không có cách khôi phục ngoài xóa/tạo lại tài khoản. |
| **Điểm đau** | `end_class_staff_assignment` deactivate `role_assignments` (`20260715000400:136-141`) nhưng không có action nào tạo lại. |
| **Nguyên nhân trực tiếp** | `assignPrimaryRole` được đặc tả (`docs/11:25`) nhưng chưa implement; `role_assignments` chỉ có đúng một chỗ ghi trong `src/` (`actions.ts:241`). |
| **Nguyên nhân gốc** | Thiết kế coi `role_assignments` là dữ liệu “sinh ra một lần lúc tạo account” thay vì **dữ liệu vòng đời có lịch sử**. Sự đồng bộ `class_staff_assignments ↔ role_assignments` được cài **một chiều** (chỉ chiều kết thúc, trong RPC) mà không có chiều bắt đầu. |
| **Hậu quả** | **Nghiệp vụ:** mỗi lần luân chuyển nhân sự giữa năm học đều tạo ra một tài khoản “chết”. **Dữ liệu:** xóa/tạo lại làm mất lịch sử role (do cascade, xem F08) và đổi `profile_id`, phá vỡ mọi FK trỏ tới `profiles` (ví dụ `updated_by`, `attendance` editor). **Phân quyền:** GLV vẫn đăng nhập được nhưng `role = null` → navigation chỉ còn `/dashboard`, `/notifications`, `/account` (`src/config/navigation.ts` `isItemVisible`) — trạng thái “zombie” không được UI nào cảnh báo. |

### 5W-04 — Đổi mật khẩu không cần mật khẩu hiện tại (M01-F02)

| Tầng | Nội dung |
|---|---|
| **Triệu chứng** | `changeOwnPassword` chỉ nhận `password` + `confirmPassword` (`schemas.ts:9-17`). |
| **Điểm đau** | Không có kiểm chứng “người đang thao tác đúng là chủ tài khoản”. |
| **Nguyên nhân trực tiếp** | Schema được thiết kế cho tình huống **bắt buộc đổi mật khẩu tạm lần đầu**, nơi việc hỏi mật khẩu cũ là thừa. |
| **Nguyên nhân gốc** | Một màn hình duy nhất phục vụ **hai nghiệp vụ khác nhau** (đổi bắt buộc lần đầu vs đổi tự nguyện về sau) mà không phân biệt. |
| **Hậu quả** | **Bảo mật:** máy bỏ quên mở sẵn → người khác chiếm vĩnh viễn tài khoản. Trong bối cảnh thiết bị dùng chung + không có nút đăng xuất (5W-02), hai lỗi này cộng hưởng. |

## 4. Điểm PASS phải giữ nguyên (không sửa)

1. **Thông báo lỗi đăng nhập mờ** — sai username và sai mật khẩu trả cùng một câu (`actions.ts:67,71`). Đúng chuẩn, không được “cải thiện” thành thông báo cụ thể.
2. **`app.current_role()` lọc theo `account_status = 'active'`** (`20260715000100:107-121`). Vô hiệu hóa tài khoản là chặn ở tận RLS, không chỉ ở app. Đã có test (`004:60-63`).
3. **Unique partial index một role active** (`:86-88`) + test (`004:29-33`).
4. **Service role bị cô lập bằng `import "server-only"`** (`admin.ts:1`) + test build-guard (`tests/unit/identity-security.test.ts:20-26`).
5. **`requireManageableAccount` chặn tự-sửa và chặn target super_admin** (`actions.ts:43-61`) — đúng `docs/01-business-analysis.md:84`.
6. **`.is("profile_id", null)` khi link hồ sơ** (`actions.ts:195,210,227`) — chống race đúng cách, không cần lock.
7. **`complete_password_change()` là `security definer` + `search_path = ''` + chỉ tác động `auth.uid()`** (`20260715000300:3-24`).
8. **Middleware không authorize** (`src/middleware.ts:4-15`, `lib/supabase/middleware.ts:36-39`) — đúng `docs/04 §3`.
9. **Mật khẩu tạm sinh bằng `randomInt` với alphabet không nhập nhằng** (`passwords.ts:5-20`), hiển thị đúng một lần, không lưu, không log.
