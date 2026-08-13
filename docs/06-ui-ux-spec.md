# 06 — UI/UX Specification

## 1. Định hướng

- Cute, hiện đại, ấm áp.
- Tone cam đào + da người pastel + trắng ấm.
- Không trẻ con quá mức đối với màn quản trị.
- Người ít tiếp cận công nghệ phải hiểu sau 1–2 phút.
- Laptop và điện thoại là hai ưu tiên ngang nhau.
- Không dark mode.
- Không đa ngôn ngữ.
- Không cần mascot riêng trong v1.
- Mỗi ngành có icon/màu phụ riêng sau khi user cung cấp asset.

## 2. Design tokens đề xuất

Không hardcode màu rải rác; dùng CSS variables.

```css
--background: #FFF9F4;
--surface: #FFFFFF;
--surface-muted: #FFF2E8;
--primary: #F28C5B;
--primary-hover: #E97945;
--secondary: #F7C8A6;
--accent: #F6D7C3;
--text: #3F342F;
--text-muted: #756861;
--border: #EEDFD5;
--success: #4F9D76;
--warning: #D99A2B;
--danger: #D95C5C;
```

Màu ngành là metadata UI, không dùng để quyết định nghiệp vụ.

## 3. Typography

- Font ưu tiên: Inter hoặc Be Vietnam Pro.
- Body 15–16px.
- Heading rõ, không dùng quá nhiều weight.
- Không dùng chữ quá nhỏ dưới 13px.
- Số liệu dashboard dùng tabular numbers.

## 4. Layout desktop

- Sidebar trái 240–272px.
- Header trên:
  - breadcrumb;
  - năm học hiện tại;
  - notification badge;
  - user menu.
- Content max-width linh hoạt, ưu tiên bảng.
- Filter sticky ở trang danh sách.
- Drawer/modal cho tác vụ ngắn; trang riêng cho form dài.

## 5. Mobile

> **Cập nhật 2026-07-23 (Giai đoạn 2B · M14 đợt C, chủ dự án duyệt).** Mục này trước đây mô tả
> **ba** preset cho toàn bộ hệ thống và lệch với mã nguồn ở hai chỗ. Nay có **bảy** preset, tách
> theo phạm vi công tác (`scopeKind`) thay vì gộp chung mọi nhân sự — xem lý do ở
> `docs/system-workflow-redesign/modules/M14-NAVIGATION-SHELL/06_UI_UX_RECOMMENDATIONS.md` §B2.

Bottom navigation tối đa 5 mục theo role. Mục thứ 5 luôn là `Tài khoản`.

### Nhân sự — phạm vi lớp (Giáo lý viên đại diện · Giáo lý viên lớp · Dự trưởng phụ tá)

```text
Trang chủ | Điểm danh | Lớp | Thông báo | Tài khoản
```

🔴 **Preset này không được đổi.** Đây là nhóm đông nhất và đang dùng thật.

### Nhân sự — phạm vi ngành (Trưởng ngành · Phó ngành)

```text
Trang chủ | Điểm danh | Lên lớp | Thông báo | Tài khoản
```

### Nhân sự — phạm vi toàn xứ đoàn (Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký)

```text
Trang chủ | Thiếu nhi | Điểm danh | Báo cáo | Tài khoản
```

### Quản trị viên hệ thống

```text
Trang chủ | Điểm danh | Lớp | Quản trị | Tài khoản
```

### Vai trò chỉ đọc (Cha sở · Cha phó · Thủ quỹ)

```text
Trang chủ | Thiếu nhi | Kết quả | Báo cáo | Tài khoản
```

Ba vai trò này **không** có `Điểm danh`: `ROUTE_RULES` không cho họ vào `/attendance`, nên mục đó
trước đây chỉ dẫn tới `/access-denied` (M14 A-11).

### Phụ huynh

```text
Trang chủ | Con của tôi | Xin nghỉ | Thông báo | Tài khoản
```

`Kết quả` lùi vào menu điều hướng đầy đủ. `Xin nghỉ` giữ chỗ trên thanh dưới vì đó là việc phụ
huynh làm thường xuyên nhất; `Lịch học` (bản cũ) chỉ là giáo án của lớp, không phải lịch riêng
của em nào.

### Thiếu nhi

```text
Trang chủ | Điểm danh | Kết quả | Thông báo | Tài khoản
```

`Điểm danh` ở đây là **sổ điểm danh của chính em** (`/student/attendance`), thứ em thật sự cần
theo dõi. Bản cũ ghi `Lịch học`.

### Bất biến bắt buộc

Không mục nào trong bottom navigation được trỏ tới route mà `canAccessRoute` trả `false` cho
chính vai trò đó. Canh bằng unit test duyệt cả 14 vai trò (`tests/unit/navigation.test.ts`).

### Các module còn lại

Vào qua **nút ba gạch** ở góc trái thanh đầu trang (drawer). Bản cũ ghi "menu `Thêm`" ở ô thứ 5;
phương án drawer được chọn vì nút ba gạch đã là một hộp thoại đúng chuẩn (bẫy focus, `Escape`
đóng và trả focus, khoá cuộn nền — Giai đoạn 2B mục 0.7), còn một menu `Thêm` sẽ tạo **hai cửa
cho cùng một việc**.

Touch target >= 44px. Không phụ thuộc hover.

## 6. Route map

> **Cập nhật 2026-07-23 (Giai đoạn 2B · M14 đợt C, chủ dự án duyệt).** Bản cũ liệt kê 10 địa chỉ
> không tồn tại trong mã nguồn. Rà lại thì **9/10 là do gộp trang có chủ đích**, không phải nợ:
> `/equipment` đã nằm trong `/committees/[committeeId]`; bốn trang `/admin/*` gộp thành một trang
> `/admin` (riêng nhập Excel là `/imports`); thiếu nhi và phụ huynh dùng chung `/results`,
> `/teaching-plan` với nhân sự thay vì có bản sao riêng `/student/*`, vì RLS đã lọc dữ liệu và hai
> bản sao là hai chỗ để lệch nhau. Các địa chỉ đó đã được gỡ khỏi danh sách dưới đây.
>
> **Còn đúng một mục là nợ thật:** `/staff/[staffId]` — trang chi tiết một Giáo lý viên chưa có.
> Ghi nợ vào **module M04 Nhân sự** (module số 4 của Giai đoạn 2B).

### Chung

```text
/login
/change-password
/dashboard
/notifications
/account
```

### Quản trị/cấp staff

```text
/students
/students/[studentId]
/classes
/classes/[classId]
/staff
/staff/[staffId]
/attendance
/attendance/[sessionId]
/teaching-plan
/teaching-plan/[classId]
/results
/results/[classId]
/promotions
/committees
/committees/[committeeId]
/reports
/reports/export
/reports/snapshots
/reports/snapshots/[snapshotId]/export
/imports
/imports/template
/imports/[batchId]
/admin
```

`/staff/[staffId]` đã được hiện thực trong Giai đoạn 2B · M04; `/reports/snapshots`
là trang lịch sử dẫn tới từng bản chụp và tệp xuất của bản đó.
Kho thiết bị nằm trong `/committees/[committeeId]` (không có `/equipment` riêng).
Bốn màn hình quản trị gộp vào một trang `/admin`; nhập Excel là `/imports`.

### Guardian

```text
/parent/children
/parent/children/[studentId]
/parent/absence-requests
```

`/parent` không phải một trang — nó là **tiền tố luật quyền** trong `ROUTE_RULES`.
Trang danh sách con là `/parent/children` (Giai đoạn 2B · M14 đợt C).

### Student

```text
/student/attendance
```

Thiếu nhi dùng chung `/results` và `/teaching-plan` với nhân sự; RLS lọc dữ liệu, nên **không**
dựng bản sao `/student/results`, `/student/schedule`, `/student/profile`. Hai bản sao của cùng một
màn hình là hai chỗ để lệch nhau. `/student` là tiền tố luật quyền, không phải trang.

### Sa mạc Phase 8

```text
/camps
/camps/[campId]
/parent/camps/[campId]
```

## 7. Dashboard

### Global

Cards:

- Tổng thiếu nhi.
- Tổng GLV.
- Tổng lớp.
- Tỷ lệ dự lễ.
- Tỷ lệ học giáo lý.

Charts:

- Chuyên cần theo tuần/tháng.
- Xu hướng vắng có phép/không phép.
- Không so sánh thi đua ngành.

Lists:

- Em cần quan tâm.
- Sinh nhật/bổn mạng.
- Buổi sắp tới.
- Thông báo.
- Hồ sơ thiếu dữ liệu.

### Sector

Tương tự nhưng scope sector.

### Class staff

- Sĩ số.
- Buổi kế tiếp.
- Nút Điểm danh nổi bật.
- Cảnh báo chuyên cần.
- Bài/kiểm tra sắp tới.
- Công việc lớp.

### Guardian/student

- Hôm nay/tuần tới.
- Điểm danh gần nhất.
- Điểm mới.
- Bài cần chuẩn bị.
- Thông báo.

## 8. Trang Thiếu nhi

### Table desktop

Cột:

- Tên thánh.
- Họ tên.
- Ngành.
- Lớp.
- Giáo lý viên đại diện.
- Trạng thái.
- Cảnh báo.
- Thao tác.

Mã thiếu nhi không hiển thị mặc định, chỉ trong chi tiết/admin/export khi cần.

Filter:

- Năm học.
- Ngành.
- Lớp.
- Trạng thái.
- Cảnh báo.
- Search tên/số điện thoại guardian.

### Mobile card

- Tên thánh + họ tên.
- Lớp chip.
- Guardian phone button.
- Warning badge.
- Tap mở chi tiết.

### Chi tiết

Top card:

- Thiếu nhi.
- Lớp.
- Giáo lý viên.
- Guardian.

Tabs:

1. Tổng quan.
2. Học tập.
3. Điểm danh.
4. Bí tích.
5. Sức khỏe.
6. Lịch sử lớp.

Không có tab `Đề xuất chuyển lớp`.

Sức khỏe/bí tích chỉ render nếu permission.

## 9. Trang Lớp học

Group theo 5 ngành.

Mỗi ngành là section có icon và số lớp. Mỗi lớp là card:

- Tên lớp.
- Sĩ số.
- GLV đại diện.
- Số GLV/Dự trưởng.
- Tỷ lệ chuyên cần gần nhất.
- Buổi tiếp theo.
- Badge A/B.

Tap/click vào card mở chi tiết.

Chi tiết lớp:

- Header + team.
- Roster.
- Điểm danh.
- Kế hoạch dạy.
- Điểm.
- Nhận xét.
- Báo cáo.
- Cuối năm (chỉ quyền phù hợp).

## 10. Attendance UX

Đây là màn hình quan trọng nhất.

### Header

- Lớp.
- Ngày.
- Thứ Năm/Chúa nhật.
- Người đang điểm danh.
- Trạng thái session.
- Auto-save status/last saved.

### Roster

Desktop:

| Tên | Thánh lễ | Giáo lý | Ghi chú |
|---|---|---|---|

Mobile:

- Một card/em.
- Hai segmented control lớn.
- Quick actions.

Defaults là Có mặt.

Quick filter:

- Chỉ hiện em không có mặt.
- Có đơn xin nghỉ.
- Cảnh báo.
- Search.

> **M05-C ghi chú thực thi (2026-08-03) — mục này nay CÓ THẬT, và khác đặc tả ở ba chỗ.**
>
> 1. **Hàng em mặc định GẤP LẠI, chạm để mở** (**D-143**, chủ dự án chốt 2026-08-03). Đặc tả viết
>    "một card/em" với hai segmented control luôn hiện; đo thật thì thẻ ấy cao ~180px, nên lớp 50 em
>    dài **~9.000px** và việc *"soát lại mình đã đánh vắng ai"* trước khi chốt là cuộn hết cả trang.
>    Gấp lại còn ~1.800px. Hàng gấp lại **vẫn nói đủ** trạng thái cả hai cột bằng hai chip — gấp mà
>    giấu luôn kết quả thì tệ hơn hẳn bản cũ. Chi phí đã chấp nhận: sửa một em mất thêm một cú chạm.
> 2. **Segmented control có BA nút, không phải năm** (**D-142**): Có mặt · Vắng có phép · Vắng không
>    phép, cộng nút "…" mở Đi trễ · Về sớm. Phương án hai nút *"Có mặt · Vắng"* của
>    `M05/06_UI_UX_RECOMMENDATIONS` U-10 đã bị bỏ vì nó buộc phải chọn hộ người dùng một trong hai
>    loại vắng, mà dù chọn loại nào cũng sai với một nửa số ca — và con số ấy chảy thẳng vào điểm
>    chuyên cần (M07). Nhãn trên nút rút gọn ("Có phép") cho vừa bề ngang 360px; trình đọc màn hình
>    vẫn nghe câu đầy đủ ("Vắng có phép").
> 3. **"Quick actions"/"Đánh dấu vắng cả hai" chưa làm** (U-14, P3). Thứ có thật là nút *"Áp dụng gợi
>    ý: Vắng có phép"* ở em có đơn xin nghỉ (M05-B), và nó chỉ đổi bản nháp phía máy người dùng.
>
> Bộ lọc và ô tìm chạy **thuần trên máy người dùng**, không gọi máy chủ, và đọc **bản nháp đang gõ**
> chứ không đọc dữ liệu đã lưu: em vừa được đánh vắng phải rơi vào nhóm "Đang vắng" ngay lập tức.
> Con số trên nhãn nút lọc là con số của **cả buổi**, không phải của trang đang xem.

Actions:

- `Bắt đầu điểm danh`.
- `Lưu`.
- `Hoàn tất`.
- `Tiếp quản`.
- `Mở khóa` chỉ SA.

Không dùng checkbox mơ hồ. Status label phải rõ.

Confirm trước finalize:

```text
Có mặt: 52
Vắng có phép: 2
Vắng không phép: 1
Đi trễ: 3
Về sớm: 0
```

> **M05-C ghi chú thực thi (2026-08-03) — TB-03, nay có thật và rộng hơn khối trên.** Bảng phân bố
> tách **hai cột Thánh lễ / Giáo lý** chứ không một cột, vì hai trạng thái là độc lập (D-30) và một
> con số gộp giấu mất đúng thứ người ta cần soát. Hàng nào cả hai cột đều bằng 0 thì **không in ra**.
> Kèm dòng "Giáo lý viên có mặt: x/y", và — điều đặc tả không đòi — **tên riêng** những em có đơn xin
> nghỉ mà vẫn đang để "Có mặt" cả hai cột (một con số đếm không cho biết phải mở em nào ra xem lại).
> Bấm Huỷ ⇒ **không request nào** đi tới máy chủ.

## 11. Teaching plan UX

- Calendar/list toggle.
- Row inline edit trên desktop.
- Mobile dùng form drawer.
- Người dạy dropdown chỉ staff của lớp.
- Tuần assessment hiển thị badge `Kiểm tra`.
- Parent/student view chỉ read-only card tuần tới.

## 12. Gradebook UX

- Sticky student column.
- Assessment dynamic columns.
- Không render sẵn bộ cột cố định; lớp chỉ thấy các assessment Giáo lý viên đã tạo và có thể chỉ có Giữa kỳ + Cuối kỳ.
- Giáo lý viên có thể thêm nhiều cột cùng loại hoặc bỏ hẳn một loại, gồm kiểm tra 15 phút.
- Horizontal scroll desktop.
- Mobile chọn từng assessment hoặc từng student, không ép full spreadsheet.
- Empty = chưa nhập, không hiển thị 0.
- Input 0..10.
- Hệ số hiển thị ở header và sửa được tại form cột trước khi gradebook lock.
- Lock state rõ.
- Export giữ filter.

Top 5:

- Separate panel.
- Preview trước publish.
- Toggle publish.
- Badge nguồn điểm.

## 13. Ban UX

Grid Ban.

Card:

- Tên Ban.
- Trưởng/Phó.
- Số thành viên.
- Lịch họp tiếp theo.
- Công việc tuần.

Chi tiết tabs:

- Tổng quan.
- Thành viên.
- Thông báo.
- Lịch họp.
- Công việc tuần.
- Thiết bị nếu Ban Kỹ thuật.

## 14. Notifications

- Badge unread.
- Filter unread/all.
- Scope chip.
- Read state.
- Click deep-link vào đúng module.
- Deep-link phải tồn tại; không tạo notification trỏ route chưa triển khai.

## 15. Forms và validation

- Label trên input.
- Required marker.
- Error dưới field.
- Không xóa dữ liệu form khi server error.
- Normalize phone.
- Date picker + input manual.
- Confirm modal cho archive/lock/finalize.
- Không dùng toast làm nơi duy nhất chứa lỗi nghiêm trọng.

## 16. Accessibility

- Semantic HTML.
- Keyboard focus.
- `aria-live` cho save/error.
- Icon luôn có label/tooltip.
- Contrast AA.
- Không chỉ dùng màu để biểu thị trạng thái.
- Bảng có caption hoặc heading.
- Modal trap focus.
- Mobile zoom không bị chặn.

## 17. Empty/loading/error

Mỗi trang phải có:

- Skeleton/loading.
- Empty state có hướng dẫn.
- Permission denied rõ.
- 404.
- Error retry.
- Không để raw Supabase error.

## 18. Logo và icon

User sẽ cung cấp logo Giáo xứ/Xứ đoàn. Cho đến khi có:

- Dùng placeholder text.
- Không tự vẽ logo tôn giáo sai.
- Không coi Luce là mascot mặc định.
- Icon ngành tách config để thay asset sau.
