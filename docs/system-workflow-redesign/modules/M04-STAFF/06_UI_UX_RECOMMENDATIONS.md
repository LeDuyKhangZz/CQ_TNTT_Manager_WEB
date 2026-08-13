# M04-STAFF — Đánh giá UI/UX

Chỉ **đánh giá**, không redesign. Mức: **Nhỏ** · **Vừa** · **Lớn**.

## 1. Information architecture

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Toàn bộ module là **một trang duy nhất** `/staff` chứa 3 nghiệp vụ (danh sách, tạo hồ sơ, phân công) trong 3 card. Không có trang chi tiết | `src/app/(dashboard)/staff/page.tsx:24-77`; `docs/06:103` đặc tả `/staff/[staffId]` | **Lớn** |
| Card “Thêm nhân sự” và “Phân công vào lớp” nằm ở cột phải, **không liên kết logic** với nhau dù bước 2 luôn nối tiếp bước 1 | `:49-74` | **Vừa** |
| Bước tiếp theo của nghiệp vụ (tạo tài khoản) nằm ở `/admin`, **không có link nào** dẫn tới | không có `<Link>` trong `staff/page.tsx` | **Vừa** |
| Không có UI nào phản ánh `service_status` — một nửa mô hình dữ liệu vô hình | `queries.ts:21`, `staff/page.tsx:34-35` | **Vừa** |
| Đội ngũ lớp ở `/classes/[classId]` hiển thị tên GLV nhưng **không click sang được hồ sơ** | `src/features/classes/server/queries.ts:186-188` | **Nhỏ** (tự hết khi có trang chi tiết) |

## 2. Navigation

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Mục menu “Huynh trưởng/Giáo lý viên” hiển thị cho mọi `staff` audience với scope global/sector/class — đúng | `src/config/navigation.ts` (`/staff`), `route-map.ts:28` | ✅ |
| Danh sách không có phân trang → với ~200 GLV, mobile phải cuộn rất dài, và không có neo/nhóm theo ngành hay lớp | `staff/page.tsx:31-45` | **Vừa** |
| Không có breadcrumb/quay lại vì chỉ có một cấp | — | ✅ |

## 3. Độ rõ của action

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| **Không thao tác ghi nào có phản hồi.** Ba form đều gọi wrapper trả `void` | `src/features/staff/server/actions.ts:115,129,138` | **Vừa** (ưu tiên P0) |
| Nút “Kết thúc phân công” **không nói đúng hệ quả**: nó cũng vô hiệu hóa vai trò đăng nhập | `staff/page.tsx:41` vs `20260715000400:136-141` | **Nhỏ** (sửa nhãn) + **Vừa** (thêm confirm) |
| Không confirm cho “Kết thúc phân công” — thao tác ảnh hưởng quyền truy cập | `:38-42` | **Nhỏ** |
| Không nút nào có trạng thái loading/disabled → bấm đúp tạo bản ghi trùng | `:41,60,71` | **Vừa** |
| Không có nút “Sửa” trên bất kỳ hồ sơ nào | `:32-45` | **Lớn** (cần trang chi tiết) |
| Capacity mặc định là “Giáo lý viên đại diện” — vai trò hiếm nhất và bị giới hạn 1/lớp lại là lựa chọn đầu tiên | `:69` | **Nhỏ** — nên mặc định “Giáo lý viên lớp” |

## 4. Form & luồng thao tác

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Form dùng `<form action={serverAction}>` **không có react-hook-form/zodResolver** như `LoginForm` (`login-form.tsx:16-19`) → không lỗi theo field | `staff/page.tsx:52,66` | **Vừa** |
| Ép kiểu thô `String(formData.get("title"))` → giá trị thiếu thành chuỗi `"null"`, Zod từ chối im lặng | `actions.ts:118,124` | **Vừa** |
| Dropdown lớp gộp lớp của **mọi năm học** | `queries.ts:22` | **Vừa** |
| Ô “Ngày bắt đầu”/“Ngày kết thúc” không prefill, không `min`/`max` theo năm học hoặc theo `starts_on` | `staff/page.tsx:40,70` | **Nhỏ** |
| Form phân công không cho biết lớp nào **đã có đại diện** → người dùng chỉ biết khi bị từ chối (im lặng) | `:68` | **Vừa** |
| Không có ô “Trạng thái phục vụ” khi tạo | `:53-59` (7 ô, không có) | **Nhỏ** |
| Sau khi tạo, mã `GLVxxx` vừa sinh **không được hiển thị** dù `createStaff` đã trả về (`actions.ts:51`) | `:115` | **Nhỏ** |
| Form “Thêm nhân sự” dài 7 ô xếp dọc trong card hẹp cột phải; hai select đầu tiên xếp 2 cột, phần còn lại 1 cột — nhịp không nhất quán | `:53-59` | **Nhỏ** |

## 5. Empty / error state

| Quan sát | Bằng chứng | Mức |
|---|---|---|
| Empty state danh sách: có, một dòng chữ, **không có nút hành động** | `:31` | **Nhỏ** |
| Empty state dropdown lớp / dropdown nhân sự: **không có** | `:67-68` | **Nhỏ** |
| **Error state: không tồn tại ở bất kỳ luồng nào** | `actions.ts:115,129,138` | **Vừa** (P0) |
| Success state: không tồn tại | như trên | **Vừa** (P0) |
| `formation_level` hiển thị enum thô viết hoa: “Huấn luyện NONE” | `:34` | **Nhỏ** |
| Badge “Chưa phân lớp” dùng `variant="secondary"` — trung tính, hợp lý | `:35` | ✅ |

## 6. Responsive

**360px**

| Quan sát | Bằng chứng | Đánh giá |
|---|---|---|
| Grid `xl:grid-cols-[1.25fr_0.75fr]` → mobile xếp dọc: danh sách trước, form sau | `:27` | ✅ |
| Card từng người dùng `flex flex-wrap items-start justify-between gap-2` → badge xuống dòng khi hẹp | `:33` | ✅ |
| Form kết thúc phân công `flex flex-wrap items-end gap-2` với `Input className="w-44"` (176px) — vừa đủ ở 360px, nút xuống dòng | `:38-41` | ✅ |
| Dòng mô tả `{staffCode} · {phone} · Huấn luyện …` là một chuỗi dài không ngắt → có thể ép chiều rộng ở 360px | `:34` | ⚠️ **Nhỏ** |
| Danh sách dài không phân trang | `:31` | **Vừa** |
| E2E đã kiểm `/staff` không tràn ngang ở 3 viewport | `tests/e2e/authenticated-shell.spec.ts:36-46` | ✅ |

**1366px**

| Quan sát | Đánh giá |
|---|---|
| `xl:` kích hoạt từ 1280px → ở 1366px chia 2 cột đúng ý đồ | ✅ |
| Cột phải `minmax(20rem,0.75fr)` = tối thiểu 320px cho form 7 ô — hơi chật cho ô địa chỉ | **Nhỏ** |

## 7. Accessibility

| Tiêu chí | Quan sát | Bằng chứng | Mức |
|---|---|---|---|
| Label | Mọi input/select đều có `<Label htmlFor>` khớp `id` | `staff/page.tsx:40,53-59,67-70` | ✅ |
| Label | `id` của form kết thúc phân công là duy nhất theo từng người (`end-${item.id}`) | `:40` | ✅ Tốt |
| `aria-invalid` / `aria-describedby` | **Không có ở bất kỳ ô nào** (vì không có lỗi theo field) | `:53-59` | **Vừa** |
| `role="status"` / `role="alert"` | **Không có vùng thông báo nào** | toàn trang | **Vừa** (P0) |
| Focus management | Sau submit trang render lại, focus về đầu trang, người dùng mất vị trí | `:52` | **Nhỏ** |
| Touch target ≥44px | `<select>` dùng `h-11` = 44px | `:15` | ✅ |
| Touch target | `Input` mặc định — cần xác minh chiều cao trong `src/components/ui/input.tsx` | `:40,54-59` | **Nhỏ** (cần xác minh) |
| Touch target | `Button size="sm"` cho “Kết thúc phân công” — cần xác minh ≥44px | `:41` | **Nhỏ** (cần xác minh) |
| Nhóm ngữ nghĩa | 3 card là 3 `<form>` riêng có `CardTitle` — cấu trúc heading hợp lý | `:28,50,64` | ✅ |
| Ngôn ngữ | Toàn bộ tiếng Việt, trừ `formation_level` hiển thị enum thô | `:34` | **Nhỏ** |
| Bảng dữ liệu | Danh sách dùng `<div>` thay vì `<table>` — hợp lý cho mobile-first, nhưng thiếu `<ul>/<li>` ngữ nghĩa | `:31-45` | **Nhỏ** |
| Thứ tự đọc | Với screen reader, form “Kết thúc phân công” nằm **bên trong** card của từng người → ngữ cảnh rõ | `:38-42` | ✅ Tốt |

## 8. Tổng hợp theo mức

**Lớn:** thêm `/staff/[staffId]` (mở khóa sửa hồ sơ, trạng thái phục vụ, lịch sử phân công, và khối tài khoản của M01).

**Vừa:** thêm phản hồi thành công/lỗi cho cả 3 thao tác ghi (**P0**); react-hook-form + lỗi theo field; trạng thái loading/disabled; lọc lớp theo năm học hiện hành; hiển thị `service_status` và tình trạng tài khoản trong danh sách; cảnh báo lớp đã có đại diện; confirm cho “Kết thúc phân công”; phân trang + tìm kiếm.

**Nhỏ:** Việt hóa `formation_level`; sửa nhãn “Kết thúc phân công” để nói đúng hệ quả; đổi capacity mặc định sang “Giáo lý viên lớp”; prefill/giới hạn ô ngày; hiển thị mã `GLVxxx` sau khi tạo; empty state có nút hành động; link từ đội ngũ lớp sang hồ sơ; ngắt dòng cho chuỗi mô tả dài.
