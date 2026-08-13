# M14-NAVIGATION-SHELL — Tác động triển khai

> Ước lượng cho **giai đoạn sau**. Giai đoạn 1 là audit read-only; không file nào trong `src/`,
> `supabase/`, `tests/` bị sửa.

## 1. Thứ tự ưu tiên

| Ưu tiên | Hạng mục | Lý do |
|---|---|---|
| **P0** | A-03 — `/student/attendance` dùng `requireRouteAccess` | Lỗ hổng an ninh: `RouteRule` khai `["student"]` nhưng không được thi hành |
| **P0** | A-01 — Đăng xuất | Người dùng không kết thúc được phiên trên máy dùng chung |
| **P0** | A-02 — Năm học trong header lấy từ DB | Đang hiển thị **sai sự thật**, không phải chỉ là thiếu tính năng |
| **P1** | A-04 — Đọc `?next=` / `?error=` | Người bị khóa tài khoản rơi vào vòng lặp không lối thoát |
| **P1** | A-05 — Focus trap drawer mobile | `docs/06` §16 yêu cầu; ảnh hưởng người dùng bàn phím/screen reader |
| **P1** | A-06 — Gỡ text tạm "P0-T3" | Một dòng sửa, hiện ra với mọi người dùng |
| **P1** | A-11 — `roles` cho mục `Điểm danh` | Ba vai trò thấy nút rồi bị chặn |
| **P2** | A-07, A-08, A-10 — IA (route mồ côi, preset mobile, `/account`) | Cải thiện lớn nhưng không chặn ai |
| **P2** | A-12, A-13, A-14, A-15, A-16 | Nhất quán và đánh bóng |
| **P3** | A-09 — Tương phản token màu | Đúng chuẩn nhưng cần user duyệt màu thương hiệu |

## 2. File dự kiến bị đụng

### P0

| Hạng mục | File | Kiểu thay đổi |
|---|---|---|
| A-03 | `src/features/portal/server/queries.ts:174` | Đổi `requireAuthContext` → `requireRouteAccess("/student/attendance")` — **1 dòng** |
| A-03 | `tests/unit/permissions.test.ts` | Thêm case: `guardian`/`class_teacher` không vào được `/student` |
| A-03 | `tests/e2e/authenticated-shell.spec.ts` | Thêm route `/student/attendance` vào danh sách phụ huynh bị chặn |
| A-01 | `src/features/auth/server/actions.ts` | Thêm `signOutAction` (`"use server"`) |
| A-01 | `src/components/layout/user-menu.tsx` | Thêm `<form action={signOutAction}>` |
| A-01 | `src/components/layout/app-sidebar.tsx` | Thêm nút đăng xuất ở footer mobile (thay khối text tạm — gộp với A-06) |
| A-02 | `src/app/(dashboard)/layout.tsx` | Gọi query năm học, truyền props |
| A-02 | `src/components/layout/app-shell.tsx` | Nhận và chuyển tiếp props |
| A-02 | `src/components/layout/app-header.tsx` | Chuyển tiếp props |
| A-02 | `src/components/layout/academic-year-switcher.tsx` | Nhận props, bỏ chuỗi cứng và `ChevronDown` |
| A-02 | `src/features/academic-years/server/queries.ts` | ⚠️ hàm hiện có `requireAuthContext("/admin")` (`:13,38`) — **không dùng lại được cho layout**; cần một query nhẹ chỉ đọc năm học hiện hành, guard mức `requireAuthContext()` |

**Cảnh báo A-02:** đây là điểm dễ sai nhất. `listAcademicYears()` và `getCurrentAttendanceSettings()`
đều guard bằng `requireAuthContext("/admin")`; nếu layout gọi nhầm chúng thì **mọi** người dùng không
phải Super Admin sẽ bị chuyển hướng. Phải viết query mới, không tái sử dụng.

### P1

| Hạng mục | File |
|---|---|
| A-04 | `src/app/(auth)/login/page.tsx` (nhận `searchParams`), `src/features/auth/components/login-form.tsx` (nhận `next`), `src/features/auth/server/actions.ts` (validate `next`), `src/app/(dashboard)/layout.tsx` (truyền pathname), `tests/e2e/home.spec.ts` (**phải sửa** — đang khẳng định `next=%2Fdashboard` là đúng) |
| A-05 | `src/components/layout/app-shell.tsx` (dialog + focus trap + Esc + khóa cuộn), `src/components/layout/app-sidebar.tsx` (ref cho nút Đóng) |
| A-06 | `src/components/layout/app-sidebar.tsx:72-75` |
| A-11 | `src/config/navigation.ts:46` (+ `roles` cho `/attendance`), `tests/unit/navigation.test.ts` |

### P2–P3

| Hạng mục | File |
|---|---|
| A-07 | `src/features/absence-requests/components/absence-request-panel.tsx`, `src/features/dashboard/components/dashboard-overview.tsx`, `src/config/navigation.ts` |
| A-08 | `src/config/navigation.ts:76-120` (tách preset), `tests/unit/navigation.test.ts` |
| A-10 | `src/app/(dashboard)/account/page.tsx` (làm thật) hoặc `src/config/navigation.ts` (đổi tab 5) |
| A-12 | **file mới** `src/app/(dashboard)/not-found.tsx` |
| A-13 | ~9 trang nghiệp vụ + có thể mở rộng `EmptyState` |
| A-14 | `src/config/navigation.ts:122-128` |
| A-15 | `src/components/layout/mobile-bottom-navigation.tsx:14`, `notification-button.tsx:17` |
| A-16 | `src/app/(dashboard)/layout.tsx` (+ `<Suspense>`) |
| A-09 | `src/app/globals.css:13-30` — **đụng toàn bộ giao diện** |

## 3. Tác động chéo module

| Thay đổi | Module bị ảnh hưởng | Mức |
|---|---|---|
| A-03 (`requireRouteAccess`) | M13-PORTAL | Thấp — 1 dòng, hành vi chặt hơn |
| A-01 (đăng xuất) | M01-AUTH-ACCOUNT | Trung bình — action mới thuộc M01 |
| A-02 (năm học) | M02-ACADEMIC-STRUCTURE | Trung bình — cần query mới |
| A-04 (`next`) | M01-AUTH-ACCOUNT | Trung bình — đổi hợp đồng của `loginWithUsername` |
| A-08 (preset mobile) | Không đụng module nghiệp vụ | Thấp — chỉ `config/navigation.ts` |
| A-13 (`EmptyState`) | **Tất cả 13 module** | Cao — nên làm theo từng module, không làm một lượt |
| A-09 (token màu) | **Toàn bộ ứng dụng** | Cao — cần chụp lại ảnh so sánh trước/sau |

## 4. Migration DB

**Không có.** Toàn bộ khuyến nghị của M14 nằm ở tầng ứng dụng. Không đụng `supabase/migrations/`,
không đụng RLS, không đụng RPC.

Ngoại lệ tiềm năng: nếu triển khai B6.5 (bộ chọn năm học thật) thì vẫn **không** cần migration —
`academic_years` đã có sẵn; chỉ cần cookie ở tầng app.

## 5. Tác động tới bộ test

| Test | Tác động |
|---|---|
| `tests/e2e/home.spec.ts:15-18` | 🔴 **Sẽ đỏ sau A-04** — hiện khẳng định `/admin` → `next=%2Fdashboard`. Phải sửa expectation thành `next=%2Fadmin`. Đây là ví dụ điển hình của test chốt cứng một bug. |
| `tests/unit/navigation.test.ts` | Cần bổ sung sau A-08, A-11 |
| `tests/unit/permissions.test.ts` | Cần bổ sung sau A-03 |
| `tests/e2e/responsive.spec.ts` | Không đỏ (Button giữ nguyên 44px); mở rộng selector theo D2.2 có thể bắt thêm nợ ở link quay lại |
| `tests/e2e/pwa.spec.ts` | Không đổi trừ khi làm D4.3 (`start_url`) |
| `tests/unit/service-worker.test.ts` | Không đổi — **không được đụng `sw.js`** |
| `tests/e2e/authenticated-shell.spec.ts` | Bổ sung `/student/attendance` sau A-03 |
| Test mới cần viết | Đăng xuất (E2E), focus trap drawer (E2E bàn phím), năm học header khớp DB, bất biến "nav ⊆ route cho phép" (unit, duyệt 14 role) |

## 6. Rủi ro

| Rủi ro | Xác suất | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Layout gọi nhầm query có guard `/admin` khi làm A-02 | Cao | Mọi non-SA bị đá khỏi hệ thống | Viết query riêng; E2E đăng nhập bằng GLV910 (role lớp) trước khi merge |
| Sửa `next` mở đường redirect ra ngoài miền | Trung bình | An ninh | Chỉ chấp nhận `next` bắt đầu `/`, không `//`, không `\`, và `canAccessRoute` = true |
| Đổi preset mobile làm GLV lớp mất tab quen thuộc | Trung bình | Người dùng bối rối | **Giữ nguyên preset `class`**; chỉ thêm preset mới cho các scope khác |
| Ai đó "dọn dẹp" `Button size="sm"` về 36px | Trung bình | Vỡ chuẩn 44px | Đã ghi ở `06_UI_UX_RECOMMENDATIONS.md` §0 và `WORKLOG.md`; `responsive.spec.ts` bắt được |
| Ai đó cho `sw.js` cache HTML "cho nhanh" | Thấp | **Rò hồ sơ thiếu nhi** | `tests/unit/service-worker.test.ts` đỏ ngay; đã ghi ở §0 |
| Đổi token màu làm vỡ ảnh chụp/nhận diện thương hiệu | Cao | Cần duyệt lại toàn bộ giao diện | Không tự làm; chờ user duyệt (NC-4) |
| Bỏ text tạm ở footer làm sidebar mất cân đối | Thấp | Thẩm mỹ | Thay bằng nút đăng xuất (gộp A-01 + A-06) |

## 7. Ước lượng

| Nhóm | Nội dung | Ước lượng |
|---|---|---|
| P0 | A-01, A-02, A-03 + test | **2–3 ngày** |
| P1 | A-04, A-05, A-06, A-11 + test | **2–3 ngày** |
| P2 | A-07, A-08, A-10, A-12, A-14, A-15, A-16 | **2–3 ngày** |
| P2 (rải) | A-13 (`EmptyState` toàn hệ thống) | **3–4 ngày**, nên chia theo module |
| P3 | A-09 (token màu) | **1–2 ngày** sau khi user duyệt màu |

**Tổng: khoảng 10–15 ngày công** nếu làm hết. Riêng P0 + P1 (phần chặn thật) là **4–6 ngày**.
