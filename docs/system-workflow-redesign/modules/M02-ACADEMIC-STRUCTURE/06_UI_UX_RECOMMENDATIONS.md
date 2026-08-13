# M02 — ACADEMIC STRUCTURE · Đánh giá UI/UX

> **Chỉ đánh giá, không redesign.** Đối chiếu với `docs/06-ui-ux-spec.md`.

## 1. Information Architecture (IA)

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| "Năm học" và "Quản trị tài khoản" nằm chung một trang `/admin` | **Vấn đề.** Hai nghiệp vụ khác nhau, hai tần suất khác nhau, dùng chung một màn hình dài; `AccountAdminPanel` nằm dưới cùng ngoài lưới (`admin/page.tsx:156`) | `admin/page.tsx:30-157` |
| Không có mục điều hướng riêng cho "Năm học" | **Vấn đề nhẹ.** Người dùng phải biết rằng năm học nằm trong "Quản trị hệ thống" | `src/config/navigation.ts:56` |
| Lớp học có trang danh sách + chi tiết, phân nhóm theo ngành | **Đúng spec** (`docs/06-ui-ux-spec.md:251-253`) | `classes/page.tsx:47-59` |
| Chi tiết lớp thiếu các mục spec yêu cầu: Điểm danh, Kế hoạch dạy, Điểm, Nhận xét, Báo cáo, Cuối năm | **Vấn đề** (các mục này thuộc module khác nhưng spec đặt chúng trên trang chi tiết lớp) | `docs/06-ui-ux-spec.md:274-281` vs `classes/[classId]/page.tsx:35-122` |
| `AcademicYearSwitcher` đặt ở header — vị trí đúng, nội dung sai | **Vấn đề** | `academic-year-switcher.tsx:5-8` |

## 2. Navigation

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| `/classes` xuất hiện trong bottom nav mobile của staff lớp (nhãn "Lớp") | **Tốt**, khớp `docs/06-ui-ux-spec.md:64` | `src/config/navigation.ts:79` |
| Chi tiết lớp có link "← Danh sách lớp" | **Tốt** — có đường lùi rõ ràng | `classes/[classId]/page.tsx:29-31` |
| Trang chi tiết lớp không có breadcrumb ngành/năm học | **Vấn đề nhẹ** — chỉ có dòng mô tả `"{Ngành} · Năm học {code}"` | `classes/[classId]/page.tsx:27` |
| Empty state của `/classes` chỉ *nói* "vào trang Quản trị" mà **không có link** | **Vấn đề** — ngõ cụt cho người dùng | `classes/page.tsx:35-36`, `:82-83` |
| Nhấn card lớp mở chi tiết | **Đúng spec** (`docs/06-ui-ux-spec.md:264`) | `classes/page.tsx:10-12` |

## 3. Độ rõ của action

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| Nút "Sinh lớp mặc định" hiện trên **mọi** năm học, kể cả `closed` | **Vấn đề nghiêm trọng** — action không hợp lệ vẫn được mời gọi | `admin/page.tsx:52-55` |
| Không có hộp xác nhận cho "Đặt hiện hành" (thao tác một chiều, đóng năm cũ) | **Vấn đề nghiêm trọng** | `admin/page.tsx:56-61` |
| **Không có bất kỳ phản hồi thành công/thất bại nào** sau mọi form | **Vấn đề nghiêm trọng** — xem 5W-F01/F03/F04 | `actions.ts:135-164` |
| Nút "Sinh lớp mặc định" không cho biết sẽ tạo bao nhiêu lớp, hay đã có bao nhiêu | Vấn đề nhẹ — thông tin `N/19` nằm ở dòng trên (`:47`) nhưng không gắn với nút | `admin/page.tsx:47,54` |
| Không có action "Đóng năm học"/"Lưu trữ" | **Thiếu chức năng** (WF-16) | — |
| Không có action nào cho lớp (đóng lớp, đổi phòng) | **Thiếu chức năng** | F08 |
| Nhãn nút bằng tiếng Việt, động từ rõ ("Tạo năm học nháp", "Đặt hiện hành") | **Tốt** | `admin/page.tsx:59,107` |

## 4. Form và luồng thao tác

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| Form tạo năm học: nhóm trường hợp lý, có placeholder mẫu `2026-2027` | **Tốt** | `admin/page.tsx:77,81` |
| Có `pattern` HTML cho mã năm học | **Tốt** — chặn sớm phía client | `admin/page.tsx:77` |
| **Không kiểm `endDate > startDate` phía client** | Vấn đề — lỗi chỉ lộ ra ở server, mà server lại im lặng | `admin/page.tsx:85-91` vs `schemas.ts:13-16` |
| Khi lỗi, **toàn bộ dữ liệu đã nhập bị mất** (Server Component render lại từ đầu) | **Vấn đề nghiêm trọng** với form 7 trường | `admin/page.tsx:74-108` |
| Form cấu hình điểm danh có `min`/`max` khớp Zod và CHECK | **Tốt** — ba tầng nhất quán | `admin/page.tsx:131-148` ↔ `schemas.ts:22-29` ↔ `20260721000500:19-24` |
| Nhãn trường dùng ngôn ngữ nghiệp vụ ("Cảnh báo khi vắng liên tiếp (buổi)") | **Tốt** | `admin/page.tsx:138,142,147` |
| Trường "Lease chỉnh sửa (phút)" dùng từ kỹ thuật "lease" | Vấn đề nhẹ — thuật ngữ lập trình lọt vào UI người dùng | `admin/page.tsx:99` |
| Ngày hiển thị dạng ISO `2026-09-01 → 2027-05-31` thay vì định dạng Việt | Vấn đề — `src/lib/dates.ts` có `formatDateVi` nhưng không dùng ở đây | `admin/page.tsx:47` |
| Badge trạng thái in chuỗi enum tiếng Anh `draft`/`current`/`closed` | **Vấn đề** — người dùng cuối là ban điều hành xứ đoàn | `admin/page.tsx:49` |
| Số `19` hardcode trong chuỗi `{classCount}/19 lớp` | Vấn đề nhẹ — sẽ sai nếu template thay đổi | `admin/page.tsx:47` |

## 5. Empty state / Error state

| Màn hình | Empty state | Error state | Đánh giá |
|---|---|---|---|
| `/admin` — danh sách năm học | ✔ "Chưa có năm học. Tạo năm học đầu tiên…" (`:41`) | ✘ Lỗi query trả `[]` (`queries.ts:19`) ⇒ **lỗi trông giống rỗng** | Empty tốt, error thiếu |
| `/admin` — cấu hình điểm danh | ✔ "Chưa có năm học hiện hành. Đặt một năm học thành hiện hành trước." (`:122-123`) | ✘ | Empty tốt, có hướng dẫn hành động tiếp |
| `/classes` — chưa có năm hiện hành | ✔ (`classes/page.tsx:34-37`) | ✘ | Có, nhưng không có link |
| `/classes` — có năm nhưng 0 lớp | ✔ "Năm học này chưa có lớp…" (`:77-84`) | ✘ | Có, nhưng **đây chính là màn hình mà người dùng gặp trong sự cố production** — nó không nói gì về khả năng thiếu danh mục |
| `/classes/[id]` — roster rỗng | ✔ "Lớp chưa có thiếu nhi ghi danh." (`:43`) | ✘ | **Sai ngữ nghĩa** với role bị RLS chặn (treasurer, Cha sở) |
| `/classes/[id]` — đội ngũ rỗng | ✔ "Chưa phân công nhân sự." (`:76`) | ✘ | Tốt |
| `/classes/[id]` — không còn em để ghi danh | ✔ "Không còn thiếu nhi nào chưa ghi danh trong năm học." (`:98`) | ✘ | Tốt |
| `/classes/{uuid lạ}` | — | ✔ `notFound()` → 404 | **Tốt**, có E2E (`tests/e2e/security.spec.ts:48-51`) |

**Kết luận:** empty state phủ tốt (7/7 màn hình); **error state gần như không tồn tại** ở toàn module.

## 6. Responsive

### 360px (điện thoại giáo lý viên)

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| Lưới `xl:grid-cols-[...]` đổ về 1 cột | Tốt | `admin/page.tsx:33`, `classes/[classId]/page.tsx:35` |
| Card lớp `grid gap-3 sm:grid-cols-2 xl:grid-cols-3` | Tốt — 1 cột ở 360px | `classes/page.tsx:53` |
| `AcademicYearSwitcher` bị `hidden ... sm:flex` | **Vấn đề** — người dùng mobile không thấy năm học nào | `academic-year-switcher.tsx:5` |
| Form kết thúc ghi danh dùng `flex flex-wrap items-end gap-2` với select + date + button | **Rủi ro** — ba control trên một hàng ở 360px; `flex-wrap` cứu được nhưng vẫn chật | `classes/[classId]/page.tsx:51-61` |
| E2E kiểm không tràn ngang cho `/classes`, `/admin` ở 3 viewport | **Tốt** — có bảo chứng tự động | `tests/e2e/responsive.spec.ts:100-101,126-128` |
| Dòng `{year.code} · {start} → {end} · {n}/19 lớp` là một chuỗi dài không ngắt | Rủi ro nhẹ ở 360px | `admin/page.tsx:47` |

### 1366px (laptop văn phòng)

| Quan sát | Đánh giá |
|---|---|
| `/admin` dùng `xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]` — `xl` = 1280px nên **có** hai cột ở 1366px | Tốt |
| `/classes` lớp hiển thị 2 cột ở 1366px (`xl:grid-cols-3` cần ≥1280px ⇒ thực tế 3 cột) | Tốt |
| Danh sách năm học không dùng bảng, chỉ là card xếp dọc | Chấp nhận được (số năm ít); nhưng spec `docs/06` §8 dùng table cho danh sách dài |

## 7. Accessibility

| Quan sát | Đánh giá | Bằng chứng |
|---|---|---|
| Tất cả input có `<Label htmlFor>` khớp `id` | **Tốt** | `admin/page.tsx:76-77, 80-81, 85-86, 95-96, 130-131, …` |
| Checkbox bọc trong `<label className="flex min-h-11 …">` | **Tốt** — vùng bấm đo theo label, đúng bài học `WORKLOG.md:80-82` | `admin/page.tsx:103-106` |
| `Button` mặc định và `<select>` dùng `h-11` (44px) | **Tốt** | `classes/[classId]/page.tsx:13,53,59` |
| E2E kiểm tap target ≥44px trên `/admin`, `/classes` | **Tốt** | `tests/e2e/responsive.spec.ts:128` |
| `AcademicYearSwitcher` có `aria-label="Năm học hiện tại, dữ liệu mẫu"` | **Vấn đề** — cụm "dữ liệu mẫu" là ngôn ngữ nội bộ đọc lên cho người dùng screen reader | `academic-year-switcher.tsx:5` |
| Nút `disabled` nhưng `disabled:opacity-100` khiến nhìn như còn dùng được | **Vấn đề** — trạng thái vô hiệu không được truyền đạt trực quan | `academic-year-switcher.tsx:5` |
| Icon đều có `aria-hidden="true"` | **Tốt** | `academic-year-switcher.tsx:6,8` |
| Badge trạng thái chỉ dùng **màu** (`success`/`secondary`) + chữ tiếng Anh | Vấn đề nhẹ — chữ tiếng Anh cứu được phần "không chỉ dựa vào màu", nhưng không thân thiện | `admin/page.tsx:49` |
| Nút "Sinh lớp mặc định" giống hệt nhau trên mọi dòng, không có ngữ cảnh cho screen reader | **Vấn đề** — nghe 5 nút "Sinh lớp mặc định" liên tiếp không biết thuộc năm nào | `admin/page.tsx:54` |
| Không có `aria-live` cho kết quả thao tác | **Vấn đề** — nhưng gốc rễ là không có kết quả nào để công bố | — |
| Card lớp là `<Link>` bọc toàn khối, có `hover:` nhưng không có `focus-visible:` riêng | Vấn đề nhẹ — phụ thuộc style mặc định của `Link` | `classes/page.tsx:10-13` |
| Không phụ thuộc hover để lộ chức năng | **Tốt**, khớp `docs/06-ui-ux-spec.md:81` | — |

## 8. Tổng kết ưu tiên UI/UX (không kèm giải pháp thiết kế)

| # | Vấn đề | Mức |
|---|---|---|
| 1 | Không có phản hồi thành công/thất bại cho **mọi** thao tác ghi | P0 |
| 2 | Nút "Sinh lớp mặc định" mời gọi hành động không hợp lệ (năm đã đóng) và không giải thích kết quả 0 lớp | P0 |
| 3 | Thiếu action đóng/lưu trữ năm học | P0 |
| 4 | Không có xác nhận cho thao tác một chiều ("Đặt hiện hành") | P1 |
| 5 | Mất dữ liệu form khi lỗi | P1 |
| 6 | `AcademicYearSwitcher` hiển thị năm hardcode, ẩn ở mobile, `aria-label` lộ ngôn ngữ nội bộ | P1 |
| 7 | Trạng thái năm học/lớp hiển thị bằng enum tiếng Anh; ngày dạng ISO | P2 |
| 8 | Empty state của roster nói sai nguyên nhân khi thực ra là chặn quyền | P2 |
| 9 | Empty state không có link điều hướng tới hành động tiếp theo | P2 |
| 10 | Nút lặp lại không có ngữ cảnh cho screen reader | P2 |
| 11 | Thuật ngữ "lease" trong nhãn trường | P3 |
| 12 | Số `19` hardcode trong nhãn | P3 |
