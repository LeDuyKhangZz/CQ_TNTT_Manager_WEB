# M14-NAVIGATION-SHELL — Tiêu chí chấp nhận

> Dùng cho giai đoạn triển khai. Mỗi tiêu chí phải **kiểm được bằng máy hoặc bằng một thao tác cụ thể**.

## AC-A — Phân quyền route

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-A1 | Mọi route trong `src/app/(dashboard)/**` đi qua `requireRouteAccess` (trực tiếp hoặc qua query đầu tiên được `await`), trừ `/access-denied` chỉ cần `requireAuthContext`. | Unit/E2E: đăng nhập bằng `guardian` rồi mở lần lượt 32 route trong ma trận `01_MODULE_DISCOVERY.md` §3; mỗi route trả `/access-denied` hoặc render đúng phạm vi, không trang nào render nội dung staff |
| AC-A2 | `/student/attendance` chặn mọi role khác `student`. | E2E: đăng nhập `84912000001` (guardian) → `GET /student/attendance` → URL kết thúc `/access-denied` |
| AC-A3 | Không mục navigation nào trỏ tới route mà `canAccessRoute` trả `false` cho chính role đó. | Unit: duyệt 14 role × `getDesktopNavigation` ∪ `getMobileNavigation`, assert `canAccessRoute(ctx, item.href) === true` |
| AC-A4 | `getRouteRule` phủ hết mọi route thật. | Unit: đọc cây `src/app/(dashboard)` (hoặc danh sách cứng), assert `getRouteRule(path) !== null` cho từng route |
| AC-A5 | Mọi route handler xuất file tự authorize (trực tiếp hoặc qua query). | Unit/E2E: `guardian` gọi `/reports/export?format=xlsx`, `/imports/template`, `/results/<id>/export?format=xlsx`, `/reports/snapshots/<id>/export` → không nhận được file |
| AC-A6 | `role = null` không bị kẹt: thấy `/dashboard`, `/notifications`, `/account`, **và có nút đăng xuất**. | E2E hoặc kiểm tay: tài khoản không có `role_assignments` active |
| AC-A7 | `accountStatus !== 'active'` bị chặn ở cả tầng route lẫn tầng RLS. | Đã có ở pgTAP `004_identity_rls_test.sql`; bổ sung E2E cho tầng route |

## AC-B — Điều hướng

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-B1 | Footer sidebar không còn chuỗi `"P0-T3"` hay `"Bản nền giao diện"`. | `grep -r "P0-T3" src/` = 0 kết quả |
| AC-B2 | Không route nào trong `src/app/(dashboard)` không thể tới được bằng ít nhất một link trong giao diện (loại trừ route handler xuất file). | Kiểm tay theo bảng §3 của `01_MODULE_DISCOVERY.md`; `/parent/children/[id]` phải có link |
| AC-B3 | Sidebar và bottom nav có cùng tập mục cơ bản (`Tài khoản` xuất hiện ở cả hai). | Kiểm tay ở 1366px và 360px |
| AC-B4 | Bottom nav của `super_admin` có `Quản trị`; của `sector_leader` có `Lên lớp`; của `guardian` có `Con của tôi`. | Unit test preset |
| AC-B5 | `getPageTitle` trả nhãn đúng cho `/access-denied` và `/parent/children/<id>`, không trả `"Thiếu Nhi Chợ Quán"`. | Unit test |
| AC-B6 | Mọi trang chi tiết có đường quay lại cấp cha, vùng bấm ≥ 44px. | E2E `expectTapTargets` mở rộng selector sang `main a[href]:not(p a)` |

## AC-C — Trạng thái, lỗi, empty

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-C1 | Tồn tại `src/app/(dashboard)/not-found.tsx`; mở `/students/<uuid-không-tồn-tại>` vẫn thấy sidebar/header. | E2E |
| AC-C2 | Không trang nào hiển thị chuỗi từ `error.message` hoặc stack. | Grep + code review: `error.tsx` chỉ dùng `digest` |
| AC-C3 | UUID sai định dạng ⇒ status < 500 ở **mọi** route có `[param]`. | E2E `security.spec.ts` đã có 8 route; mở rộng cho `/imports/[batchId]`, `/parent/children/[id]` |
| AC-C4 | Empty state của dữ liệu chịu RLS nói rõ phạm vi (chứa tên lớp/ngành hoặc cụm "trong phạm vi của bạn"). | Kiểm tay 9 trang liệt kê ở `06_UI_UX_RECOMMENDATIONS.md` §C1 |
| AC-C5 | `/access-denied` hiển thị vai trò hiện tại. | E2E: `guardian` mở `/imports` → thấy chữ "Phụ huynh" |
| AC-C6 | Không còn trang production nào dùng `ModulePlaceholder`. | `grep -r "ModulePlaceholder" src/app/` = 0 (sau khi `/account` hoàn thiện) |

## AC-D — Responsive & accessibility

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-D1 | Không trang nào tràn ngang ở 360 / 768 / 1366. | `tests/e2e/responsive.spec.ts` (đã có) — **giữ nguyên, không được nới lỏng** |
| AC-D2 | Mọi vùng bấm ≥ 44px, kể cả link điều hướng trong `<main>`. | `expectTapTargets` với selector mở rộng |
| AC-D3 | Drawer mobile: có `role="dialog"` + `aria-modal`, `Escape` đóng, focus vào trong khi mở, `Tab` không thoát ra sau lưng, focus trả về nút hamburger khi đóng. | E2E bàn phím: `page.keyboard.press("Tab"/"Escape")` |
| AC-D4 | Có skip link tới `<main>`, hiện khi focus. | E2E: `Tab` một lần từ đầu trang |
| AC-D5 | Không có hai heading cùng cấp trùng nguyên văn trên một trang. | Kiểm tay hoặc axe-core |
| AC-D6 | Cỡ chữ nhỏ nhất trong giao diện ≥ 12px. | `grep -rE "text-\[(8|9|10|11)px\]" src/` = 0 |
| AC-D7 | Tương phản chữ/nền đạt AA (4,5:1 chữ thường, 3:1 chữ ≥ 18,66px bold hoặc 24px). | Chạy axe-core hoặc kiểm thủ công 7 tổ hợp ở `06_UI_UX_RECOMMENDATIONS.md` §D3.5 — **chỉ sau khi user duyệt màu** |
| AC-D8 | Bảng cuộn ngang có `<caption>` hoặc `aria-labelledby`, và có chỉ báo còn nội dung bên phải. | Kiểm tay 4 bảng |
| AC-D9 | Zoom tới 500% không bị chặn. | Đã đạt (`layout.tsx:29`) — giữ nguyên |

## AC-E — PWA

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-E1 | Manifest + icon tải được khi chưa đăng nhập. | `tests/e2e/pwa.spec.ts:12-32` (đã có) |
| AC-E2 | `sw.js` **không** cache HTML; điều hướng khi mất mạng ra `/offline.html`. | `tests/unit/service-worker.test.ts` + `pwa.spec.ts:44-66` (đã có) — **không được đổi** |
| AC-E3 | `/offline.html` có cả nút "Thử lại" và link về `/login`. | Kiểm tay |
| AC-E4 | Đổi `PRECACHE` hoặc quy tắc cache mà không tăng `VERSION` ⇒ test đỏ. | Bổ sung assertion vào `service-worker.test.ts` |
| AC-E5 | Mở app đã cài khi đang có phiên hợp lệ ⇒ vào thẳng `/dashboard`, không thấy màn đăng nhập. | Kiểm tay trên thiết bị thật (phụ thuộc NC-3) |

## AC-F — Phiên và đăng xuất

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-F1 | Có nút "Đăng xuất" nhìn thấy được ở cả 360px và 1366px, không quá 2 thao tác từ bất kỳ trang nào. | E2E: từ `/reports`, mở menu → bấm Đăng xuất → về `/login` |
| AC-F2 | Sau đăng xuất, mở lại `/dashboard` bằng nút Back ⇒ vẫn phải đăng nhập. | E2E: `page.goBack()` rồi assert URL `/login` |
| AC-F3 | Đăng xuất là `POST` (form + Server Action), không phải link `GET`. | Code review |
| AC-F4 | Deep-link `/reports?type=weekly` khi chưa đăng nhập ⇒ sau khi đăng nhập về đúng URL đó. | E2E |
| AC-F5 | `next` ngoài miền (`https://…`, `//…`, `\…`) ⇒ về `/dashboard`. | Unit test hàm validate |
| AC-F6 | Tài khoản `locked` có cookie ⇒ thấy banner giải thích ngay lần đầu bị đá về `/login`. | E2E: khóa tài khoản seed rồi điều hướng |

## AC-G — Năm học trên header

| ID | Tiêu chí | Cách kiểm |
|---|---|---|
| AC-G1 | Nhãn năm học khớp `academic_years.code` của bản ghi `status='current'`. | E2E: đọc DB rồi so với text trên header |
| AC-G2 | Không có năm học hiện hành ⇒ header hiện "Chưa đặt năm học", không hiện một năm bịa. | E2E trên DB chưa seed năm học |
| AC-G3 | Không có mũi tên dropdown khi chưa đổi được năm học. | Kiểm tay |
| AC-G4 | Năm học nhìn thấy được ở 360px. | E2E viewport 360 |
| AC-G5 | Layout **không** gọi query nào có guard `/admin`. | Code review — rủi ro số 1 ở `07_IMPLEMENTATION_IMPACT.md` §6 |

---

## NEEDS_CONFIRMATION — cần user hoặc agent chính quyết

| ID | Câu hỏi | Vì sao không tự quyết được |
|---|---|---|
| **NC-1** | Bottom nav phụ huynh và thiếu nhi hiện lệch với `docs/06` §5 (`Xin nghỉ`/`Điểm danh` thay vì `Con của tôi`/`Lịch học`). **Sửa code theo spec, hay cập nhật spec theo code?** | Code hiện tại có thể phản ánh phản hồi thực tế từ người dùng mà spec chưa cập nhật. Đổi sai hướng làm phụ huynh mất đường vào tính năng đang dùng. |
| **NC-2** | `docs/06` §5 nói "Các module còn lại trong menu **Thêm**". Hiện không có menu `Thêm`; các mục còn lại tới được qua drawer hamburger. **Chấp nhận drawer là cách thay thế, hay phải làm đúng menu `Thêm` trong bottom nav?** | Hai mô hình tương tác khác nhau; ảnh hưởng tới thiết kế preset ở B2.1. |
| **NC-3** | `manifest.start_url = "/login"` và `/login` không kiểm phiên sẵn có. **Cho `/login` redirect sang `/dashboard` khi đã đăng nhập, hay giữ nguyên để người dùng luôn thấy màn đăng nhập (có chủ ý cho máy dùng chung)?** | Nếu là chủ ý bảo mật cho máy phòng học thì **không được sửa**. Chưa tìm thấy quyết định nào ghi lại điều này trong `WORKLOG.md` hay `docs/`. |
| **NC-4** | 7 tổ hợp màu trượt chuẩn AA, gồm cả `bg-primary` + `text-white` của nút chính (≈ 2,42:1). **Được phép chỉnh `--primary`, `--warning`, `--success`, `--danger` trong `globals.css` không?** | Đây là màu bản sắc của Xứ đoàn, sinh từ logo chính thức. Agent không tự đổi màu thương hiệu. Có thể có giải pháp thay thế (dùng `--foreground` trên nền cam, hoặc tối màu chỉ khi làm nền chữ). |
| **NC-5** | `AppShell` là client component nhận **nguyên** `AuthContext` (`userId`, `profileId`, `username`, `displayName`, `accountStatus`, `role`, `academicYearId`, `sectorId`, `classId`) và serialize xuống RSC payload. Không rò dữ liệu người khác, nhưng là bề mặt lớn hơn mức cần (shell chỉ dùng `displayName`, `role`, `audience`, `scopeKind`). **Có nên thu hẹp thành một `ShellContext` gọn không?** | Đụng ranh giới client/server của cả vỏ ứng dụng; nên gộp với việc sửa F05 chứ không làm riêng lẻ. |
| **NC-6** | `docs/06` §6 liệt kê nhiều route chưa tồn tại: `/staff/[staffId]`, `/equipment`, `/admin/accounts`, `/admin/academic-years`, `/admin/settings`, `/admin/import`, `/parent` (index), `/student` (index), `/student/schedule`, `/student/results`. **Đây là nợ hay là spec đã lỗi thời?** (`/equipment` đã được gộp vào `/committees/[id]`; `/admin/*` gộp vào một trang `/admin`.) | Ảnh hưởng tới AC-A4 và tới việc đánh giá module nào "chưa xong". Cùng câu hỏi đã nêu ở `M01-AUTH-ACCOUNT/01_MODULE_DISCOVERY.md` §3. |
| **NC-7** | Đăng xuất nên dùng `signOut()` (chỉ thiết bị này) hay `signOut({ scope: 'global' })` (mọi thiết bị)? Bối cảnh máy dùng chung ở phòng học gợi ý phương án thứ hai, nhưng nó cũng đá người dùng ra khỏi điện thoại cá nhân. | Quyết định nghiệp vụ, không phải kỹ thuật. |
