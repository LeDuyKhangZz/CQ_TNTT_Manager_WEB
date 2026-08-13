# M14-NAVIGATION-SHELL — Khuyến nghị UI/UX

> Đây là file dài nhất của module. Trả lời chi tiết nhóm câu hỏi **B (IA & navigation)**,
> **C (trạng thái/lỗi/empty)**, **D (responsive & accessibility)**.
>
> Mức công sức: **Nhỏ** ≤ nửa ngày, một file · **Vừa** 1–2 ngày, vài file + test ·
> **Lớn** > 2 ngày, đụng nhiều module hoặc cần quyết định của user.

## 0. DANH SÁCH KHÔNG ĐƯỢC ĐỤNG

Đây là những thứ **trông như lỗi nhưng là quyết định có chủ ý**. Bất kỳ agent nào định "dọn dẹp" chúng
đều đang phá một quyết định đã trả giá.

| Thứ trông như lỗi | Vì sao giữ | Nguồn |
|---|---|---|
| `Button size="sm"` cao **44px** chứ không phải 36px | `sm` là nút *hẹp ngang*, không phải nút thấp. Người dùng chính là GLV bấm bằng ngón tay trên máy 360px. `tests/e2e/responsive.spec.ts` quét 13 route × 3 viewport và sẽ đỏ ngay. | `src/components/ui/button.tsx:5-8`, `WORKLOG.md` dòng 77–79 |
| Service worker **không** cache HTML → offline mất hết nội dung | Máy phòng học dùng chung. Một trang roster nằm trong cache là rò hồ sơ thiếu nhi cho người đăng nhập kế tiếp. **Hệ quả UX được chấp nhận có ý thức**: ngoại tuyến = không dùng được, và `/offline.html` nói thẳng điều đó. | `public/sw.js:1-11,61-70`, `WORKLOG.md` dòng 70–74 |
| `/offline.html` nói "thao tác chưa gửi sẽ không được lưu" thay vì hứa đồng bộ sau | D-29..D-33: điểm danh phải ghi thẳng lên máy chủ, không có chế độ offline. Nói thẳng để GLV không ngồi chờ. | `public/offline.html:64-69` |
| Ô tick nhỏ 16–20px trong bảng điểm danh | Vùng bấm đo theo `<label>` bao quanh chứ không theo chính ô tick. Label phải `min-h-11`. | `WORKLOG.md` dòng 81–83, `tests/e2e/responsive.spec.ts:66-74` |
| `/teaching-plan`, `/results`, `/parent` không giới hạn `roles` | Cố ý. Một GLV vẫn có thể là phụ huynh và phải vào được "con của tôi" (D-25). Quyền thật ở RLS. | `src/lib/permissions/route-map.ts:33-36` |
| `/parent/children/[id]` trả **404** thay vì "bạn không có quyền" | Không lộ sự tồn tại của hồ sơ thiếu nhi. | `parent/children/[studentId]/page.tsx:15-17` |
| Middleware không authorize | Kiến trúc: `docs/04` §3. Đặt authorization ở middleware là bẫy CVE quen thuộc của Next. | `src/lib/supabase/middleware.ts:8-11` |
| Không có đăng ký công khai, không "quên mật khẩu" tự phục vụ | Hệ thống nội bộ, tài khoản do Ban quản trị cấp. | `login/page.tsx:12`, `AGENTS.md` §4 |

---

# B. Information architecture & navigation

## B1 (Câu 7) — 15 mục sidebar, 3 nhóm: có phản ánh mô hình tinh thần của Giáo lý viên không?

**Trả lời: một phần. Nhóm đúng về mặt quản trị, sai về mặt người dùng chính.**

Nhóm hiện tại (`src/config/navigation.ts:29`, render ở `app-sidebar.tsx:14`):

| Nhóm | Mục |
|---|---|
| **Chung** | Tổng quan, Thông báo |
| **Mục vụ** | Thiếu nhi, Lớp học, Huynh trưởng/Giáo lý viên, Điểm danh, Điểm danh của em, Đơn xin nghỉ, Giáo án, Kết quả học tập, Lên lớp/chuyển lớp |
| **Điều hành** | Ban, Báo cáo, Nhập dữ liệu Excel, Quản trị hệ thống |

Vấn đề:

1. **Nhóm "Mục vụ" chứa 9/15 mục** — một nhóm chiếm 60% thì không còn tác dụng phân loại. Với GLV lớp,
   sau khi lọc quyền chỉ còn 5–6 mục và gần như tất cả rơi vào "Mục vụ" ⇒ ba tiêu đề nhóm trở thành
   trang trí.
2. **"Mục vụ" và "Điều hành" là từ của Ban điều hành Xứ đoàn, không phải của GLV.** Trong đầu một GLV
   lớp, công việc chia theo *nhịp tuần*: hôm nay điểm danh → chuẩn bị bài Chúa nhật tới → nhập điểm cuối
   kỳ → xem thông báo. Không ai nghĩ "việc này là mục vụ hay điều hành".
3. **"Ban" đứng một mình rất mơ hồ** — dễ đọc thành "ban" (bạn) hoặc "Ban" nào. Nhãn đầy đủ trong trang
   là "Ban" nhưng mô tả lại nói về Trưởng ban/Phó ban (`committees/page.tsx:12`).
4. **"Huynh trưởng/Giáo lý viên"** dài 24 ký tự, tràn trên sidebar 264px với chữ 14px; là mục duy nhất
   dùng dấu `/` trong nhãn.
5. **"Điểm danh" và "Điểm danh của em"** đứng cạnh nhau trong cùng nhóm — nếu một tài khoản nào đó thấy
   cả hai thì rất khó phân biệt. Thực tế `audiences` loại trừ nhau nên không bao giờ hiện cùng lúc, nhưng
   nhãn vẫn nên khác nhau rõ hơn.

**Khuyến nghị**

| # | Nội dung | Mức |
|---|---|---|
| B1.1 | Đổi tên nhóm sang ngôn ngữ công việc: `Hằng ngày` (Tổng quan, Điểm danh, Giáo án, Thông báo) · `Hồ sơ` (Thiếu nhi, Lớp học, Huynh trưởng/GLV, Kết quả, Lên lớp) · `Quản lý` (Ban, Báo cáo, Nhập dữ liệu, Quản trị). Chỉ đổi trường `group`, không đổi cấu trúc. | **Nhỏ** |
| B1.2 | Rút gọn nhãn: `Huynh trưởng/Giáo lý viên` → `Giáo lý viên`; `Ban` → `Ban chuyên môn`; `Lên lớp/chuyển lớp` → `Lên lớp`. | **Nhỏ** |
| B1.3 | Ẩn tiêu đề nhóm khi người dùng chỉ có ≤ 5 mục tổng cộng (GLV lớp, phụ huynh, thiếu nhi) — nhóm chỉ có nghĩa khi danh sách dài. | **Nhỏ** |
| B1.4 | Đưa `Tài khoản` vào sidebar (nhóm cuối) để desktop và mobile có cùng tập mục. | **Nhỏ** |

## B2 (Câu 8) — Bottom nav `.slice(0, 5)`: role nào bị cắt mất mục quan trọng?

**Làm rõ trước một hiểu nhầm:** `.slice(0, 5)` (`navigation.ts:119`) **chưa bao giờ thực sự cắt gì** —
cả ba preset đều có đúng 5 phần tử (`:76-98`). Vấn đề không nằm ở `slice` mà ở chỗ **cả 12 role staff
dùng chung một preset được thiết kế cho GLV lớp**.

Bảng theo từng role (preset thực tế = `classStaffMobileNavigation`: Trang chủ · Điểm danh · Lớp · Thông
báo · Tài khoản):

| Role | Bottom nav thực tế | Mục **quan trọng nhất** bị thiếu | Tab **chết** (chạm → `/access-denied`) |
|---|---|---|---|
| `super_admin` | 5 mục staff | **Quản trị hệ thống** (`/admin`) — việc chính của vai trò này | — |
| `parish_priest` (Cha sở) | 5 mục staff | **Báo cáo**, **Kết quả học tập** — vai trò giám sát, không điểm danh | 🔴 **Điểm danh** (`route-map.ts:29` loại) |
| `chaplain` (Cha phó) | 5 mục staff | **Báo cáo**, **Kết quả học tập** | 🔴 **Điểm danh** |
| `treasurer` (Thủ quỹ) | 5 mục staff | **Báo cáo** | 🔴 **Điểm danh** |
| `group_leader` (Xứ đoàn trưởng) | 5 mục staff | **Thiếu nhi**, **Báo cáo**, **Nhập dữ liệu** | — |
| `deputy_group_leader` | 5 mục staff | **Thiếu nhi**, **Báo cáo** | — |
| `secretary` (Thư ký) | 5 mục staff | **Thiếu nhi**, **Nhập dữ liệu Excel** — việc chính của thư ký | — |
| `sector_leader` (Trưởng ngành) | 5 mục staff | **Lên lớp/chuyển lớp** — trưởng ngành là người *duyệt* (`promotions/page.tsx:10`), **Báo cáo** | — |
| `sector_deputy` (Phó ngành) | 5 mục staff | **Lên lớp/chuyển lớp** | — |
| `class_representative` | 5 mục staff | (hợp lý) — có thể thiếu **Kết quả học tập** khi vào mùa nhập điểm | — |
| `class_teacher` | 5 mục staff | ✔ preset đúng đối tượng | — |
| `trainee_assistant` | 5 mục staff | ✔ | — |
| `guardian` | Trang chủ · Xin nghỉ · Kết quả · Thông báo · Tài khoản | 🔴 **"Con của tôi"** — `docs/06` §5 yêu cầu mục này ở vị trí 2; route `/parent/children/[id]` **không có link nào trong app** | — |
| `student` | Trang chủ · Điểm danh · Kết quả · Thông báo · Tài khoản | **Giáo án / Lịch học** — `docs/06` §5 yêu cầu "Lịch học" ở vị trí 2 | — |
| `role = null` | Trang chủ · Thông báo · Tài khoản (3 mục) | — | — |

**So với `docs/06-ui-ux-spec.md` §5** (dòng 70–79):

| Đối tượng | Spec yêu cầu | Code hiện tại | Khớp? |
|---|---|---|---|
| Staff lớp | `Trang chủ / Điểm danh / Lớp / Thông báo / Tài khoản` | y hệt | ✔ |
| Phụ huynh | `Trang chủ / Con của tôi / Lịch học / Thông báo / Tài khoản` | `Trang chủ / Xin nghỉ / Kết quả / Thông báo / Tài khoản` | ✖ lệch 2 mục |
| Thiếu nhi | `Trang chủ / Lịch học / Kết quả / Thông báo / Tài khoản` | `Trang chủ / Điểm danh / Kết quả / Thông báo / Tài khoản` | ✖ lệch 1 mục |
| "Các module còn lại trong menu `Thêm`" | có menu `Thêm` | **không có**; các mục còn lại chỉ tới được qua drawer hamburger | ✖ (drawer là giải pháp thay thế chấp nhận được, nhưng không có chỉ dẫn) |

**Khuyến nghị**

| # | Nội dung | Mức |
|---|---|---|
| B2.1 | Tách preset staff theo `scopeKind` + một preset "chỉ đọc": `global` → Trang chủ/Thiếu nhi/Điểm danh/Báo cáo/Tài khoản; `sector` → Trang chủ/Điểm danh/Lên lớp/Thông báo/Tài khoản; `class` → **giữ nguyên preset hiện tại**; nhóm Cha sở/Cha phó/Thủ quỹ → Trang chủ/Thiếu nhi/Kết quả/Báo cáo/Tài khoản. `super_admin` → thay `Lớp` bằng `Quản trị`. | **Vừa** |
| B2.2 | Thêm mục **"Con của tôi"** cho phụ huynh, trỏ tới trang danh sách con (xem B4). Đây là mục spec đã yêu cầu và đang thiếu hoàn toàn. | **Vừa** (cần một trang mới, đụng M13) |
| B2.3 | Thiếu nhi: thay `Điểm danh` → `Lịch học` (`/teaching-plan`) theo spec, hoặc **giữ nguyên và cập nhật spec** — cần user chốt (xem `08_ACCEPTANCE_CRITERIA.md` NC-2). | **Nhỏ** (code) / cần quyết định |
| B2.4 | **Bất biến bắt buộc:** không mục nào trong bottom nav được trỏ tới route mà `canAccessRoute` trả `false` cho chính role đó. Viết unit test duyệt 14 role × mọi mục. | **Nhỏ** |

## B3 (Câu 9) — Mục nav trỏ tới route chưa tồn tại / placeholder?

| Mục | Route | Tình trạng |
|---|---|---|
| `Tài khoản` | `/account` | 🔴 **Placeholder** — `ProtectedModulePlaceholder ... phase="Phase 1"` (`account/page.tsx:4`) hiện chữ *"Nền giao diện đã sẵn sàng — Dữ liệu và nghiệp vụ của mục này sẽ được triển khai ở Phase 1"*. Đây là **tab thứ 5 của cả ba preset mobile** và là mục duy nhất trong `UserMenu`. Mọi người dùng, mọi vai trò, mọi thiết bị đều chạm vào một trang trống. |
| 14 mục còn lại | — | ✔ đều trỏ tới trang có nội dung thật |

Không có mục nào trỏ tới route **không tồn tại** (`tests/unit/navigation.test.ts:5-9` chặn `/camps`).

Ngược lại, có **route tồn tại nhưng không có mục nav và không có link nội bộ**:
`/parent/children/[studentId]` (xem B4).

| # | Khuyến nghị | Mức |
|---|---|---|
| B3.1 | Hoàn thiện `/account` ở mức tối thiểu: tên, tên đăng nhập, vai trò, đổi mật khẩu, **đăng xuất**. Dữ liệu đã có sẵn trong `AuthContext`. | **Vừa** |
| B3.2 | Trong lúc chờ B3.1: đổi tab thứ 5 của bottom nav từ `Tài khoản` sang `Thông báo` và để `Tài khoản` chỉ nằm trong `UserMenu`. | **Nhỏ** |
| B3.3 | Văn bản placeholder nói *"Phase 1"* trong khi dự án đang ở Phase 7 — nếu giữ placeholder thì ít nhất phải nói đúng. | **Nhỏ** |

## B4 — Route mồ côi `/parent/children/[studentId]`

Grep `parent/children` trên toàn `src/`: chỉ 3 kết quả — khai báo deep-link
(`notifications/constants.ts:51`), guard trong query (`portal/server/queries.ts:161`), và chính file
page. **Không có một `href` nào trong toàn bộ giao diện dẫn tới trang này.**

Trong khi đó chính trang đó lại có link *đi ra* `/parent/absence-requests`
(`parent/children/[studentId]/page.tsx:25-27`) — tức là nó được thiết kế như trang con của một luồng
mà đầu vào chưa bao giờ được nối.

| # | Khuyến nghị | Mức |
|---|---|---|
| B4.1 | Trên `/parent/absence-requests` và trên dashboard phụ huynh, hiển thị danh sách con, mỗi con là link tới `/parent/children/[id]`. Dữ liệu đã có: `getAbsenceRequestsPageData()` trả về `children` (`portal/server/queries.ts:33,58`). | **Nhỏ** |
| B4.2 | Thêm mục nav "Con của tôi" (kèm B2.2). | **Vừa** |

## B5 (Câu 10) — Text tạm ở `app-sidebar.tsx:73-74`

**Xác nhận. Văn bản tạm của giai đoạn dựng khung vẫn còn trong bản production.**

```
src/components/layout/app-sidebar.tsx:72-75
  <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
    <p className="font-medium text-foreground">Bản nền giao diện</p>
    <p>Phân quyền route hoàn thiện ở P0-T3.</p>
  </div>
```

Đây là footer cố định của sidebar desktop **và** của drawer mobile (cùng một component,
`app-shell.tsx:21,26`). Ai cũng thấy: Cha sở, phụ huynh, thiếu nhi. Nó nói với người dùng cuối rằng hệ
thống chưa xong và tiết lộ mã task nội bộ (`P0-T3`) — task đó đã hoàn thành từ Phase 0.

| # | Khuyến nghị | Mức |
|---|---|---|
| B5.1 | Thay bằng thông tin hữu ích cho người dùng: tên Xứ đoàn + phiên bản, hoặc **bỏ hẳn** khối footer. Nếu cần chỗ cho "Đăng xuất" trên mobile thì đây là vị trí tự nhiên. | **Nhỏ** |

## B6 (Câu 11) — `academic-year-switcher`: state lưu ở đâu?

**Không lưu ở đâu cả. Không có state.**

```
src/components/layout/academic-year-switcher.tsx:5-9
  <button type="button" disabled ... aria-label="Năm học hiện tại, dữ liệu mẫu">
    <CalendarDays ... />
    <span>Năm học 2026–2027</span>       ← chuỗi cứng
    <ChevronDown ... />                   ← gợi ý mở được, nhưng disabled
  </button>
```

- Không URL, không cookie, không server state, không props.
- Mọi trang tự đọc `academic_years where status='current'` một cách độc lập (ví dụ
  `dashboard/server/queries.ts:19-23`, `imports/server/queries.ts`, `teaching-plans/server/queries.ts`).
  Vì thế các trang **nhất quán với nhau**, nhưng **header thì không nhất quán với bất kỳ trang nào** —
  nó chỉ nhất quán với chính nó.
- Ẩn hoàn toàn dưới 640px (`hidden ... sm:flex`), nên GLV dùng điện thoại không bao giờ thấy năm học.
- `docs/06` §4 (dòng 50) liệt kê "năm học hiện tại" là thành phần **bắt buộc** của header.

Rủi ro thật: nếu Super Admin đặt năm học hiện hành khác 2026–2027, header vẫn nói 2026–2027 trong khi
mọi con số bên dưới thuộc năm khác. Không có gì trên màn hình giúp người dùng phát hiện.

| # | Khuyến nghị | Mức |
|---|---|---|
| B6.1 | Truyền năm học thật từ `DashboardLayout` (server) xuống `AppShell` bằng props, giống cách đã làm với `authContext` và `unreadCount` (`layout.tsx:9`). | **Nhỏ** |
| B6.2 | Không có năm học hiện hành ⇒ hiện "Chưa đặt năm học" + link `/admin` cho `super_admin`. `DashboardOverview` đã có đúng khuôn mẫu này (`dashboard-overview.tsx:24-33`). | **Nhỏ** |
| B6.3 | Bỏ `ChevronDown` khi chưa đổi được; đổi `aria-label` khỏi chữ "dữ liệu mẫu". | **Nhỏ** |
| B6.4 | Hiện năm học cả trên mobile (dòng phụ nhỏ dưới tiêu đề trang). | **Nhỏ** |
| B6.5 | *Nếu* sau này cho chọn năm học khác: chốt **một** nguồn sự thật (đề xuất cookie server-readable) và bắt mọi query đọc qua một helper duy nhất. Không được vừa có bộ chọn vừa để mỗi query tự đọc `status='current'`. | **Lớn** — cần user chốt trước |

## B7 (Câu 12) — Breadcrumb và đường quay lại từ trang chi tiết

**Breadcrumb thật: không có.** `app-header.tsx:15` in `Hệ thống / {title}` — một chuỗi tĩnh hai cấp,
không phải link, và `hidden ... sm:block` nên biến mất trên mobile. Ở trang chi tiết
`/students/<id>`, nó vẫn chỉ hiện `Hệ thống / Thiếu nhi` — không có tên em, không có cấp thứ ba.

**Đường quay lại thủ công: có, và khá nhất quán** — nhưng là link chữ nhỏ ở góc phải `PageHeader.action`,
không phải breadcrumb:

| Trang chi tiết | Đường quay lại | `file:line` |
|---|---|---|
| `/classes/[classId]` | `← Danh sách lớp` | `classes/[classId]/page.tsx:29-31` |
| `/attendance/[sessionId]` | `← Danh sách buổi` | `attendance/[sessionId]/page.tsx:33-35` |
| `/results/[classId]` | `← Danh sách lớp` | `results/[classId]/page.tsx:17` |
| `/teaching-plan/[classId]` | `← Danh sách lớp` | `teaching-plan/[classId]/page.tsx:27` |
| `/committees/[committeeId]` | `← Danh sách Ban` | `committees/[committeeId]/page.tsx:34-36` |
| `/students/[studentId]` | `← Danh sách thiếu nhi` | `students/[studentId]/page.tsx:80-83` |
| `/imports/[batchId]` | có link quay lại `/imports` | `imports/[batchId]/page.tsx` |
| `/parent/children/[studentId]` | ⚠️ **chỉ có `Đơn xin nghỉ →`** (đi tiếp), **không có đường quay lại** — và cũng không có trang cha nào trỏ tới nó (xem B4) | `parent/children/[studentId]/page.tsx:25-27` |

Vấn đề phụ: `getPageTitle` không xử lý `/access-denied` và `/parent/children/*` ⇒ `<h1>` của header hiện
`"Thiếu Nhi Chợ Quán"` thay vì tên trang (`navigation.ts:122-128`).

| # | Khuyến nghị | Mức |
|---|---|---|
| B7.1 | Cho `PageHeader` nhận `backHref`/`backLabel` và render nút quay lại chuẩn (44px, bên trái tiêu đề) thay vì mỗi trang tự đặt link chữ nhỏ ở góc phải. Đảm bảo `/students/[studentId]` cũng có. | **Vừa** |
| B7.2 | Breadcrumb thật 3 cấp trong header: `Tổng quan / Thiếu nhi / Nguyễn Văn A`, cấp giữa là link. Cần page truyền tên thực thể lên — có thể qua một context nhỏ hoặc qua props của `PageHeader`. | **Vừa** |
| B7.3 | Bổ sung `/access-denied` và `/parent/children` vào bảng tra của `getPageTitle`, hoặc cho fallback dùng nhãn nhóm gần nhất thay vì tên ứng dụng. | **Nhỏ** |
| B7.4 | Breadcrumb hiện cả trên mobile (ít nhất một cấp cha dạng nút "←"). Hiện `sm:block` che mất trên đúng thiết bị cần nó nhất. | **Nhỏ** |

---

# C. Trạng thái, lỗi, empty

## C1 (Câu 13) — Sáu component trạng thái có được dùng nhất quán không?

| Component | Số nơi dùng ngoài `components/shared/` | Chi tiết |
|---|---|---|
| `LoadingState` | 2 | `src/app/loading.tsx:6`, `src/app/(dashboard)/loading.tsx:5` |
| `ErrorState` | 2 | `src/app/error.tsx:19`, `src/app/(dashboard)/error.tsx:12` |
| `PermissionDenied` | 1 | `access-denied/page.tsx:5` |
| `ProtectedModulePlaceholder` | 1 | `account/page.tsx:4` |
| `ModulePlaceholder` | 0 (chỉ gián tiếp qua `ProtectedModulePlaceholder`) | — |
| **`EmptyState`** | **0** | Chỉ được `ModulePlaceholder` dùng (`module-placeholder.tsx:9`) |

**Kết luận: không nhất quán.** `EmptyState` — component được thiết kế đúng cho việc "không có dữ liệu",
có icon, tiêu đề, mô tả, chỗ đặt hành động — **không được trang nghiệp vụ nào dùng**. Thay vào đó mỗi
trang tự viết một dòng `<p>`:

| Trang | Cách làm hiện tại | `file:line` |
|---|---|---|
| `/students` | `<p className="text-sm text-muted-foreground">Chưa có hồ sơ thiếu nhi trong phạm vi của bạn.</p>` | `students/page.tsx:36` |
| `/classes/[id]` | `<p ...>Lớp chưa có thiếu nhi ghi danh.</p>` | `classes/[classId]/page.tsx:43` |
| `/classes/[id]` | `<p ...>Chưa phân công nhân sự.</p>` | `classes/[classId]/page.tsx:76` |
| `/results` | `<Card><CardContent ...>Bạn chưa có lớp nào trong phạm vi kết quả.</CardContent></Card>` | `results/page.tsx:23` |
| `/teaching-plan` | `<Card>...Chưa có năm học hiện hành.</Card>` | `teaching-plan/page.tsx:16` |
| `/imports` | `<Card>...Chưa có lần nhập dữ liệu nào.</Card>` | `imports/page.tsx:139` |
| `/admin` | `<p ...>Chưa có năm học. Tạo năm học đầu tiên bằng biểu mẫu bên cạnh.</p>` | `admin/page.tsx:41` |
| `/student/attendance` | `<Card>...Tài khoản của em chưa gắn với hồ sơ thiếu nhi...</Card>` | `student/attendance/page.tsx:19-21` |
| `/dashboard` | `<p ...>Không có em nào cần lưu ý trong phạm vi của bạn.</p>` | `dashboard-overview.tsx:57` |

Ba biến thể cùng tồn tại: `<p>` trần, `<p>` trong `<Card>`, và `<Card><CardContent>` trực tiếp. Không cái
nào có icon, không cái nào có hành động gợi ý — trong khi `docs/06` §17 yêu cầu "Empty state **có hướng
dẫn**".

**`module-placeholder` còn được dùng ở trang production nào?** Đúng **một**: `/account`
(`account/page.tsx:4`) — nghĩa là module Tài khoản chưa làm xong. Không còn trang nào khác.

| # | Khuyến nghị | Mức |
|---|---|---|
| C1.1 | Chuẩn hóa: mọi "không có dữ liệu" ở cấp **trang/section** dùng `EmptyState`; "không có dữ liệu" ở cấp **một ô nhỏ trong card** giữ `<p>` nhưng theo một class thống nhất. | **Vừa** (đụng ~9 trang) |
| C1.2 | Mỗi `EmptyState` phải có hành động khi có thể: `/imports` rỗng → nút "Tải file mẫu"; `/admin` chưa có năm học → nút cuộn tới biểu mẫu; `/classes` chưa ghi danh → nút "Ghi danh thiếu nhi" (nếu `canManage`). | **Vừa** |
| C1.3 | Bổ sung `src/app/(dashboard)/not-found.tsx` để `notFound()` ở trang chi tiết vẫn giữ sidebar/header thay vì văng ra 404 toàn màn hình. | **Nhỏ** |
| C1.4 | Cân nhắc `error.tsx` cho `(auth)` — hiện lỗi ở màn đăng nhập rơi về boundary gốc với nút "Về tổng quan" trỏ `/dashboard`, vô nghĩa với người chưa đăng nhập. (Boundary gốc có `backHref="/login"` — kiểm lại phối hợp.) | **Nhỏ** |

## C2 (Câu 14) — `src/lib/errors/index.ts`: mã lỗi, thông điệp, rò rỉ, UUID sai

**Mã lỗi ổn định: ✔.** 12 mã tiếng Anh (`errors/index.ts:3-16`), map 1-1 sang thông điệp tiếng Việt
(`:20-36`), có `AppError` giữ `code` (`:39-47`). Đúng `AGENTS.md` §7.

**Thông điệp tiếng Việt: ✔ và viết tốt** — nói bằng ngôn ngữ nghiệp vụ, không nói bằng ngôn ngữ kỹ thuật.
Ví dụ `ATTENDANCE_ALREADY_CLAIMED` → *"Buổi điểm danh đang có người khác phụ trách."*

**Rò stack / chi tiết kỹ thuật ra UI: ✖ không rò.**

- `src/app/error.tsx:14` và `src/app/(dashboard)/error.tsx:9` chỉ `console.error` với `error.digest` —
  **không** log message, không log stack, không hiển thị gì từ `error`.
- `ErrorState` in câu cố định *"Hệ thống chưa thể tải nội dung. Vui lòng thử lại."* (`error-state.tsx:6`).
- Server Action trả `{ ok: false, code, message }` với fallback tiếng Việt cố định
  (`auth/server/actions.ts:32-35`) — lỗi Supabase gốc bị nuốt, không đẩy ra client.

**Điểm yếu ngược lại:** nuốt quá sạch. `digest` được log ra console **server** nhưng người dùng không
thấy mã nào để đọc cho quản trị viên qua điện thoại. Với hệ thống không có công cụ giám sát, một mã 8 ký
tự hiển thị trên màn hình là công cụ hỗ trợ rẻ nhất.

**Invalid UUID → 404 hay 500?**

| Route | Cách xử lý | Kết quả |
|---|---|---|
| `/committees/[committeeId]` | `UUID_PATTERN.test()` → `notFound()` (`:19`) | **404** ✔ |
| `/reports/snapshots/[id]/export` | `UUID_PATTERN.test()` → JSON 404 (`:20-22`) | **404** ✔ |
| `/students/[studentId]` | Không kiểm dạng; query trả `null` → `notFound()` (`:63`) | **404** ✔ (nhờ Postgres/PostgREST trả lỗi được nuốt thành `null`) |
| `/classes/[classId]`, `/results/[classId]`, `/teaching-plan/[classId]`, `/attendance/[sessionId]`, `/parent/children/[studentId]` | cùng cơ chế `null → notFound()` | **404** ✔ |
| `/imports/[batchId]` | `getBatchDetail` → `notFound()` | **404** ✔ |

`tests/e2e/security.spec.ts:44-63` kiểm 8 route với cả UUID hợp lệ-không tồn tại và chuỗi rác, khẳng định
status < 500. ✔ Đúng `AGENTS.md` §5.

| # | Khuyến nghị | Mức |
|---|---|---|
| C2.1 | Hiển thị `error.digest` trên `ErrorState` dưới dạng "Mã sự cố: `a1b2c3d4`" để người dùng đọc cho quản trị viên. Không rò gì thêm. | **Nhỏ** |
| C2.2 | Thống nhất kiểm UUID: 5 route đang dựa vào "query trả null" thay vì kiểm dạng tường minh như `/committees`. Hoạt động đúng, nhưng phụ thuộc hành vi của tầng dưới — nên đưa `UUID_PATTERN` vào `src/lib/validation/` (thư mục đã tồn tại, chỉ có `.gitkeep`) và dùng chung. | **Nhỏ** |
| C2.3 | `APP_ERROR_MESSAGES_VI` chưa có mã cho "route không tồn tại" / "tài khoản bị khóa" — hai tình huống mà vỏ ứng dụng cần. Bổ sung `ROUTE_NOT_FOUND`, `ACCOUNT_UNAVAILABLE` để dùng cho `?error=` ở F01. | **Nhỏ** |

## C3 (Câu 15) — Người dùng có phân biệt "không có dữ liệu" với "bạn không có quyền xem" không?

**Trả lời: ở cấp route thì có. Ở cấp dữ liệu trong trang thì KHÔNG.**

**Cấp route — rõ ràng ✔.** Vào route ngoài quyền ⇒ chuyển hẳn sang `/access-denied` với tiêu đề
"Không có quyền truy cập" (`permission-denied.tsx:10-12`). Không thể nhầm với trang rỗng.

**Cấp dữ liệu — mập mờ ✖.** RLS lọc âm thầm; trang chỉ thấy mảng rỗng và in "chưa có". Người dùng không
biết là *chưa có* hay là *có nhưng không được thấy*:

| Tình huống | Người dùng thấy | Sự thật có thể là |
|---|---|---|
| GLV lớp mở `/students` | "Chưa có hồ sơ thiếu nhi trong phạm vi của bạn" | Có 500 em trong Xứ đoàn, bạn chỉ được thấy lớp mình — mà lớp mình chưa ghi danh ai |
| GLV lớp mở URL lớp khác | roster rỗng (`security.spec.ts:88` khẳng định count = 0) | Lớp đó có 30 em |
| Phụ huynh mở `/results` | portal rỗng | Điểm chưa công bố, **hoặc** con chưa được ghi danh |
| Thành viên ngoài Ban mở `/committees/[id]` | nội dung rỗng | Ban có đầy nội dung |

Dự án **đã ý thức được vấn đề này ở một chỗ** và xử lý rất đúng: `v_incomplete_student_profiles` dùng
`LEFT JOIN guardians` có chủ ý, vì *"nói 'thiếu' trong khi chỉ là 'không có quyền xem' thì tệ hơn im
lặng"* (`WORKLOG.md`, ghi chú bàn giao Phase 6). Cùng nguyên tắc đó chưa được áp cho giao diện.

Một số trang đã cố gắng bằng cách **nói rõ phạm vi trong câu chữ** — đó là cách làm đúng và nên nhân rộng:

- `/dashboard`: *"Số liệu hiển thị đúng phạm vi bạn được phép xem."* (`dashboard/page.tsx:12`)
- `/students`: *"...trong phạm vi của bạn"* (`students/page.tsx:36`)
- `/results`: *"Bạn chưa có lớp nào trong phạm vi kết quả."* (`results/page.tsx:23`)
- `/committees`: *"Thành viên chỉ thấy Ban của mình"* (`committees/page.tsx:12`)

| # | Khuyến nghị | Mức |
|---|---|---|
| C3.1 | Chuẩn hóa: **mọi** empty state của dữ liệu chịu RLS phải nói rõ phạm vi — "Trong **lớp Ấu 1A** của bạn chưa có…" thay vì "Chưa có…". Tên phạm vi lấy từ `AuthContext` (đã có `sectorId`/`classId`). | **Vừa** |
| C3.2 | Ở trang chi tiết mà người dùng có quyền vào route nhưng RLS lọc sạch nội dung (ví dụ GLV mở lớp khác), hiển thị `EmptyState` với thông điệp phân biệt được: "Bạn không được xem danh sách của lớp này." — chứ không phải "Lớp chưa có thiếu nhi ghi danh." Đây vừa là UX vừa là chống hiểu nhầm nghiệp vụ (GLV có thể tưởng lớp bạn mình chưa ghi danh và đi hỏi nhầm). | **Vừa** — cần cẩn thận: chỉ áp cho lớp/ban, **không** áp cho hồ sơ thiếu nhi (BR-25 cấm lộ sự tồn tại) |
| C3.3 | Trên `/access-denied`, in vai trò hiện tại: "Bạn đang đăng nhập với vai trò **Thủ quỹ**." — dữ liệu đã có trong `AuthContext.role` + `ROLE_LABELS`. | **Nhỏ** |

---

# D. Responsive & accessibility

## D1 (Câu 16) — 360px và 1366px: bảng dữ liệu dài xử lý thế nào?

Kết quả rà toàn bộ: **chỉ 4 chỗ dùng `<table>`; tất cả đều bọc `overflow-x-auto` + `min-w`. Roster và
danh sách thiếu nhi không dùng bảng mà dùng card/list.**

| Vùng dữ liệu | Kỹ thuật | Đánh giá 360px | Đánh giá 1366px |
|---|---|---|---|
| Bảng điểm (`gradebook-editor.tsx:254-255`) | `<div className="overflow-x-auto rounded-md border"> <table className="w-full min-w-[34rem]">` | ✔ cuộn ngang **trong khung**, không tràn trang. 34rem = 544px ⇒ luôn phải cuộn ở 360px, chấp nhận được với ma trận điểm | ✔ |
| Bảng trung bình (`gradebook-editor.tsx:544`) | `overflow-x-auto` + `min-w-[24rem]` | ✔ | ✔ |
| Kết quả portal (`published-results-portal.tsx:25-26`) | `overflow-x-auto` + `min-w-[520px]` | ✔ | ✔ |
| Báo cáo (`report-workbench.tsx:177-178`) | `overflow-x-auto` + `min-w-[640px]` | ✔ | ✔ |
| **Roster lớp** (`classes/[classId]/page.tsx:45-64`) | **không phải bảng** — mỗi em một `<div>` `flex flex-wrap items-center justify-between` | ✔ tốt: form kết thúc ghi danh tự xuống dòng | ✔ |
| **Danh sách thiếu nhi** (`students/page.tsx:38-60`) | **không phải bảng** — mỗi em một `<Link>` dạng card, badge `flex-wrap` | ✔ tốt | ⚠ ở 1366px vẫn là danh sách dọc một cột trong lưới `xl:grid-cols-[1.25fr_0.75fr]` — lãng phí bề ngang, khó quét mắt khi có hàng trăm em |
| Điểm danh (`attendance-editor.tsx`) | có nhánh riêng cho mobile/desktop (2 bộ `aria-label` khác nhau ở `:224,246,270` và `:311,333`) | ✔ đã tách chủ ý | ✔ |

Bảo chứng bằng máy: `tests/e2e/responsive.spec.ts:112-138` quét 13 route × 3 viewport và khẳng định
`documentElement.scrollWidth - window.innerWidth ≤ 1`. Cộng thêm `html/body { min-width: 360px }`
(`globals.css:46,50`) và `overflow-x-hidden` ở gốc shell (`app-shell.tsx:20`).

**Kết luận: đây là mảng làm tốt.** Không có tràn ngang, chiến lược nhất quán (bảng thì cuộn trong khung,
danh sách thì card).

| # | Khuyến nghị | Mức |
|---|---|---|
| D1.1 | Bảng cuộn ngang cần **chỉ báo** rằng còn nội dung bên phải (bóng mờ mép phải hoặc dòng chữ "Vuốt ngang để xem thêm cột"). Trên 360px người dùng không đoán được. | **Nhỏ** |
| D1.2 | Bảng nên có `<caption>` hoặc `aria-labelledby` trỏ tới heading của card — `docs/06` §16 yêu cầu "Bảng có caption hoặc heading". Hiện `gradebook-editor.tsx:255` và `report-workbench.tsx:178` không có. | **Nhỏ** |
| D1.3 | Ở 1366px, `/students` nên chuyển sang lưới 2 cột hoặc bảng gọn khi danh sách > 30 em. **Không cấp bách** — hiện tại đúng và dùng được. | **Vừa** |
| D1.4 | Cột đầu của bảng điểm nên `sticky left-0` để tên em không trôi mất khi cuộn ngang. File Excel xuất ra đã làm đúng điều này (`views: [{ state: "frozen", xSplit: 2 }]`, `results/[classId]/export/route.ts:20`) — giao diện web thì chưa. | **Vừa** |

## D2 (Câu 17) — Touch target ≥ 44px

| Phần tử | Kích thước | `file:line` | Kết luận |
|---|---|---|---|
| `Button` mọi size | `sm`/`md` = `h-11 min-h-11` (44px), `lg` = `h-12 min-h-12` | `button.tsx:20-24` | ✔ **có chủ ý, không được đổi** |
| Link sidebar | `min-h-11` | `app-sidebar.tsx:56` | ✔ |
| Mục bottom nav | `min-h-16` (64px) | `mobile-bottom-navigation.tsx:14` | ✔ dư |
| Nút hamburger | `min-h-11 min-w-11` | `app-header.tsx:11` | ✔ |
| Nút đóng drawer | `min-h-11 min-w-11` | `app-sidebar.tsx:32` | ✔ |
| Nút chuông thông báo | `min-h-11 min-w-11` | `notification-button.tsx:10` | ✔ |
| `UserMenu` summary | `min-h-11` | `user-menu.tsx:10` | ✔ |
| Mục "Tài khoản" trong dropdown | `min-h-11` | `user-menu.tsx:20` | ✔ |
| `AcademicYearSwitcher` | `min-h-11` | `academic-year-switcher.tsx:5` | ✔ (dù disabled) |
| `Input` | `h-11` | `input.tsx:12` | ✔ |
| `<select>` thủ công trong trang | `h-11` (`selectClassName`) | `students/page.tsx:13`, `classes/[classId]/page.tsx:13,53`, `admin/page.tsx` | ✔ |
| Link "Tải file mẫu" | `h-11 min-h-11` | `imports/page.tsx:125` | ✔ |
| Nút hiện/ẩn mật khẩu | `min-h-11 min-w-11` | `password-field.tsx:18` | ✔ |
| Nút "Thử lại" trang offline | `min-height: 44px` | `public/offline.html:45` | ✔ |
| Tab hồ sơ thiếu nhi | `<Link>` trong `<nav>` | `students/[studentId]/page.tsx:103-110` | ✔ nằm trong `nav a[href]` ⇒ đã được `responsive.spec.ts` quét và đang xanh |
| **Link quay lại ở `PageHeader.action`** | chỉ `text-sm`, **không** ràng buộc chiều cao | `students/[studentId]/page.tsx:80`, `classes/[classId]/page.tsx:29`, `results/[classId]/page.tsx:17`, `teaching-plan/[classId]/page.tsx:27`, `committees/[committeeId]/page.tsx:34`, `attendance/[sessionId]/page.tsx:33` | ⚠️ **~20px cao** — E2E không bắt vì selector chỉ quét `nav a`, `header a`, `button` (`responsive.spec.ts:61-63`), còn đây là `<a>` trần trong `<main>` |
| Ô tick điểm danh | 16–20px, **nhưng vùng bấm là `<label>` bao quanh** | `attendance-editor.tsx` | ✔ **đo đúng cách, không được "sửa"** |

**Kết luận: gần như hoàn hảo, trừ một khoảng mù đã lọt lưới test.** Link "← Danh sách lớp" là đúng loại
điều khiển mà quy tắc 44px nhắm tới (người dùng bấm để điều hướng), nhưng nằm ngoài phạm vi quét của
`expectTapTargets`.

| # | Khuyến nghị | Mức |
|---|---|---|
| D2.1 | Đưa link quay lại vào `PageHeader` với `min-h-11` (kèm B7.1). | **Nhỏ** |
| D2.2 | Mở rộng selector của `expectTapTargets` sang `main a[href]` nhưng **loại trừ link nằm trong đoạn văn** (`p a`) — đúng tinh thần ghi chú hiện có ở `responsive.spec.ts:51-53`. | **Nhỏ** |

## D3 (Câu 18) — Accessibility

### D3.1 ARIA — làm tốt

| Hạng mục | Tình trạng |
|---|---|
| `aria-current="page"` | ✔ sidebar (`app-sidebar.tsx:54`) và bottom nav (`mobile-bottom-navigation.tsx:14`) |
| `<nav aria-label>` | ✔ "Điều hướng chính" (`app-sidebar.tsx:38`), "Điều hướng nhanh" (`mobile-bottom-navigation.tsx:7`), `<aside aria-label>` (`:19`) |
| Icon | ✔ **mọi** icon trang trí có `aria-hidden="true"`; icon-only button có `aria-label` |
| `aria-label` động | ✔ chuông: "Mở thông báo, N chưa đọc" (`notification-button.tsx:6`); mắt mật khẩu: "Hiện/Ẩn mật khẩu" + `aria-pressed` (`password-field.tsx:19-20`) |
| `aria-label` cho ô nhập trong bảng | ✔ mỗi ô điểm/ghi chú/ô tick có nhãn kèm tên em (`gradebook-editor.tsx:265,273`; `attendance-editor.tsx:224,246,270,311,333`) — rất tốt |
| `aria-live` | ⚠️ **chỉ** `LoadingState` có (`role="status" aria-live="polite"`, `loading-state.tsx:5`). `docs/06` §16 yêu cầu `aria-live` cho **save/error** — badge thông báo, kết quả lưu điểm danh/điểm số đều không có |
| `role="alert"` cho lỗi form | ✔ `FormMessage` tự đặt `role="alert"` khi `tone="danger"` (mặc định) và `role="status"` cho tone khác (`form-message.tsx:21`) — thiết kế gọn và đúng |
| `aria-describedby` | ✔ ở form auth (`login-form.tsx:35,40`; `change-password-form.tsx:34,40`) ⚠️ nhưng các form trong trang nghiệp vụ (`/students`, `/admin`, `/classes/[id]`) **không** có — lỗi validate ở đó là lỗi native của trình duyệt |
| `<Image alt>` | ✔ logo dùng `alt=""` + `aria-hidden` ngầm — đúng, vì logo là trang trí cạnh chữ "Thiếu Nhi Thánh Thể" (`auth/layout.tsx:15,26`; `app-sidebar.tsx:26`; `offline.html:62`) |

### D3.2 Focus và drawer — vấn đề lớn nhất

```
src/components/layout/app-shell.tsx:22-29
  {drawerOpen ? (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" className="absolute inset-0 bg-foreground/30"
              onClick={() => setDrawerOpen(false)} aria-label="Đóng menu" />
      <div className="relative h-full w-[min(82vw,320px)]">
        <AppSidebar ... mobile onClose={...} />
```

Thiếu **năm** thứ mà `docs/06` §16 ("Modal trap focus") đòi hỏi:

1. Không `role="dialog"` / `aria-modal="true"`.
2. Focus không được chuyển vào drawer khi mở — vẫn nằm ở nút hamburger, giờ nằm sau lớp phủ.
3. Không focus trap: `Tab` chạy hết drawer rồi ra thẳng nội dung trang phía sau.
4. Không đóng bằng `Escape`.
5. Không khóa cuộn `body`: cuộn trong drawer sẽ cuộn cả trang bên dưới.

Thêm nữa, lớp phủ là `<button>` phủ toàn màn hình ⇒ với screen reader đó là một nút khổng lồ chen vào
giữa hamburger và nội dung drawer.

`UserMenu` dùng `<details>` (`user-menu.tsx:9`): hoạt động không cần JS (tốt) nhưng không đóng khi click
ra ngoài, không đóng bằng `Escape`.

### D3.3 Heading hierarchy — có lỗi cấu trúc

Trên một trang danh sách điển hình (`/students`):

| Cấp | Nội dung | `file:line` |
|---|---|---|
| `h1` | "Thiếu nhi" (từ `getPageTitle`) | `app-header.tsx:16` |
| `h2` | "Thiếu nhi" (từ `PageHeader`) — **trùng chữ với h1** | `page-header.tsx:5` |
| `h2` | "Danh sách thiếu nhi" (`CardTitle`) — **cùng cấp với h2 ở trên, đáng lẽ h3** | `card.tsx:18` |
| `h2` | "Bảng điểm phụ trách" (section thủ công) | `results/page.tsx:22` |
| `h3` | "Lần nhập gần đây" | `imports/page.tsx:135` |

Ba vấn đề: (a) `h1` và `h2` lặp nguyên văn; (b) `CardTitle` cứng là `h2` nên card lồng trong section
`h2` tạo cấu trúc phẳng sai; (c) cùng một vai trò "tiêu đề mục" khi thì `h2` khi thì `h3`.

Không có **skip link** ("Bỏ qua điều hướng") — người dùng bàn phím phải `Tab` qua tối đa 15 mục sidebar
trước khi tới nội dung.

### D3.4 Form label — tốt

`htmlFor`/`id` được dùng rộng khắp: 20 file có `htmlFor`, nhiều nhất là `students/[studentId]/page.tsx`
(20 lần) và `staff/page.tsx`/`students/page.tsx` (12 lần). `Label` component render `<label>` chuẩn
(`label.tsx:4-6`). Không thấy trường hợp label rời rạc.

### D3.5 Tương phản — **không đạt AA ở 4 tổ hợp**

Tokens ở `globals.css:13-30`, dùng qua `tailwind.config.ts:12-55`. Tỷ lệ tính theo WCAG 2.1:

| Tổ hợp | Màu | Tỷ lệ | Chuẩn AA (chữ thường 4,5:1) | Dùng ở đâu |
|---|---|---|---|---|
| `text-white` trên `bg-primary` | `#ffffff` / `#f28c5b` | **≈ 2,42:1** | ✖ **trượt nặng** | `Button variant="primary"` (`button.tsx:14`) — nút chính của **toàn bộ ứng dụng**; nút "Thử lại" trang offline |
| `text-warning` trên `bg-warning-surface` | `#d99a2b` / `#fff7e3` | **≈ 2,29:1** | ✖ **trượt nặng** | `Badge variant="warning"` (`badge.tsx:13`); dòng "KHÔNG CÓ QUYỀN TRUY CẬP" (`permission-denied.tsx:10`) |
| `text-success` trên `bg-success-surface` | `#4f9d76` / `#edf8f2` | ≈ 3,02:1 | ✖ | `Badge variant="success"` — trạng thái "Đang sinh hoạt", "Đang mở" |
| `text-white` trên `bg-danger` | `#ffffff` / `#d95c5c` | ≈ 3,70:1 | ✖ | `Button variant="danger"`; badge số chưa đọc (`notification-button.tsx:17`) |
| `text-muted-foreground` trên `bg-background` | `#756861` / `#fff9f4` | ≈ 5,19:1 | ✔ | mô tả, nhãn phụ |
| `text-foreground` trên `bg-background` | `#3f342f` / `#fff9f4` | ≈ 12,4:1 | ✔ | chữ chính |
| `text-danger` trên `bg-danger-surface` | `#d95c5c` / `#fff0f0` | ≈ 3,72:1 | ✖ | `Badge variant="danger"`, `FormMessage` lỗi (`form-message.tsx:15`) |

**Đây là phát hiện a11y nghiêm trọng nhất của module** và nó nằm ở tầng token, không phải tầng component
— nghĩa là sửa một chỗ là sửa toàn hệ thống. Cần thận trọng: `docs/06` §2 nói "Không hardcode màu rải
rác; dùng CSS variables" — đúng là vậy, nên việc chỉnh giá trị biến là an toàn về mặt kiến trúc, **nhưng
đổi màu thương hiệu là quyết định của user, không phải của agent** (xem `08_ACCEPTANCE_CRITERIA.md`
NC-4).

Ngoài ra `docs/06` §16 yêu cầu "Không chỉ dùng màu để biểu thị trạng thái" — các `Badge` hiện có **cả
chữ** nên đạt yêu cầu này ✔.

### D3.6 Cỡ chữ

`docs/06` §3 (dòng 41): *"Không dùng chữ quá nhỏ dưới 13px."* Vi phạm:

| Chỗ | Cỡ | `file:line` |
|---|---|---|
| Nhãn bottom nav | `text-[11px]` (11px) | `mobile-bottom-navigation.tsx:14` |
| Số badge chưa đọc | `text-[10px]` (10px) | `notification-button.tsx:17` |
| Nhiều `text-xs` (12px) | 12px | `app-header.tsx:15`, `app-sidebar.tsx:28,44,72`, `user-menu.tsx:18`, khắp nơi |

`text-xs` = 12px vi phạm nhẹ và phổ biến; 10–11px thì rõ ràng.

### Khuyến nghị nhóm D3

| # | Nội dung | Mức |
|---|---|---|
| D3.a | **Drawer mobile thành dialog đúng nghĩa**: `role="dialog"` + `aria-modal`, focus vào nút Đóng khi mở, focus trap, `Escape` đóng và trả focus, khóa cuộn body, lớp phủ đổi từ `<button>` sang `<div onClick>` + `aria-hidden`. | **Vừa** |
| D3.b | **Skip link** "Bỏ qua điều hướng" ở đầu `body`, hiện khi focus, nhảy tới `<main>`. | **Nhỏ** |
| D3.c | **Heading**: `CardTitle` nhận prop `as` (mặc định `h3`); `PageHeader` giữ `h2`; header ứng dụng đổi `<h1>` thành `<p>` **hoặc** `PageHeader` bỏ `h2` — chọn một, không để hai heading trùng chữ. | **Vừa** |
| D3.d | **`aria-live`** cho badge chưa đọc và cho kết quả lưu của điểm danh/bảng điểm. | **Nhỏ** (badge) / **Vừa** (các editor) |
| D3.e | **Tương phản**: nâng `--primary` cho nền nút (hoặc dùng chữ `--foreground` trên nền cam nhạt), nâng `--warning`, `--success`, `--danger` khi dùng làm **chữ**. Giữ nguyên khi dùng làm **viền/nền trang trí**. ⚠️ Cần user duyệt vì đụng bản sắc thương hiệu. | **Lớn** (cần quyết định) |
| D3.f | **Cỡ chữ**: bottom nav 11px → 12px và cho phép xuống 2 dòng; badge 10px → 11px với `min-w-5` giữ nguyên. | **Nhỏ** |
| D3.g | **`aria-describedby`** cho form trong trang nghiệp vụ (`/students`, `/admin`, `/classes/[id]`) như đã làm ở form auth. | **Vừa** |
| D3.h | `UserMenu`: đóng khi `Escape` và khi click ra ngoài. | **Nhỏ** |

## D4 (Câu 19) — PWA

### Manifest — ✔ đầy đủ

`src/app/manifest.ts:6-50`: `name`, `short_name`, `description`, `start_url: "/login"`, `scope: "/"`,
`display: "standalone"`, `orientation: "portrait"`, `background_color`, `theme_color`, `lang: "vi"`,
4 icon (192/512 × any/maskable). Đúng yêu cầu tối thiểu của Chrome (cần cả 192 **và** 512, ghi rõ ở
`:21`). Có E2E kiểm manifest + từng icon tải được **khi chưa đăng nhập** (`pwa.spec.ts:12-32`).

### `sw.js` — cố ý không cache HTML, **xác nhận**

`public/sw.js:1-11` ghi nguyên tắc; `:61-70` thực thi: `request.mode === "navigate"` ⇒ luôn `fetch`,
lỗi mạng ⇒ `caches.match(OFFLINE_URL)`. `:73` ⇒ mọi thứ không thuộc `/_next/static/` hay `/icons/` đi
thẳng ra mạng, không cache. Có unit test đọc thẳng file thật vào scope giả
(`tests/unit/service-worker.test.ts`).

**Hệ quả UX khi offline — nêu rõ để không ai coi là bug:**

1. Mất mạng ⇒ **toàn bộ ứng dụng trở thành trang `/offline.html`**. Không xem lại được trang vừa mở,
   không xem lại được roster vừa tải, không có bản nháp.
2. Đang điểm danh dở mà rớt mạng ⇒ dữ liệu chưa `submit` **mất**. `/offline.html:66-69` nói thẳng điều
   này thay vì để GLV ngồi chờ đồng bộ.
3. App đã cài (standalone) mở khi không có mạng ⇒ vào thẳng trang offline, không có màn hình chờ.
4. Đổi lại: **không có rò rỉ**. Máy dùng chung của phòng học không giữ lại hồ sơ em nào sau khi người
   trước rời đi. Với dữ liệu trẻ em, đây là đánh đổi đúng.
5. ⚠️ Nhưng hệ quả 2 va chạm với việc **không có nút đăng xuất**: người dùng vừa không thể chủ động kết
   thúc phiên, vừa mất dữ liệu khi rớt mạng — hai điều cùng làm cho phiên làm việc trên máy chung trở
   nên khó kiểm soát.

### `/offline.html` — ✔ có

Tự chứa CSS, không phụ thuộc `/_next/`, `lang="vi"`, `maximum-scale=5`, nút "Thử lại" 44px, `<img alt="">`
đúng cho ảnh trang trí, `h1` duy nhất. Nhược: **không có link về `/login`**, chỉ có `location.reload()`
— nếu vẫn chưa có mạng thì bấm mãi.

### Prompt cài đặt — ✖ không có

Grep `beforeinstallprompt` / `getInstalledRelatedApps` trên `src/` = 0 kết quả.
`ServiceWorkerRegistrar` chỉ đăng ký SW (`service-worker-registrar.tsx:26-28`). Người dùng phải tự biết
"Thêm vào màn hình chính" — trong khi Gate Phase 7 lấy "Installable PWA where supported" làm tiêu chí và
`pwa.spec.ts` chỉ kiểm *điều kiện kỹ thuật* để cài được, không kiểm *người dùng có được mời cài không*.

| # | Khuyến nghị | Mức |
|---|---|---|
| D4.1 | Thêm link "Về trang đăng nhập" trong `/offline.html` cạnh nút "Thử lại". | **Nhỏ** |
| D4.2 | Nút mời cài đặt: bắt `beforeinstallprompt`, hiện một dải nhỏ **ở trang `/login`** (nơi ai cũng đi qua và không có dữ liệu nhạy cảm), có thể tắt và ghi nhớ lựa chọn. iOS không hỗ trợ sự kiện này ⇒ hiện hướng dẫn tĩnh cho Safari. | **Vừa** |
| D4.3 | ⚠️ **Cân nhắc `start_url`**: hiện là `/login` (`manifest.ts:12`) và `/login` không kiểm phiên sẵn có ⇒ người đã đăng nhập mở app đã cài vẫn thấy màn đăng nhập. Sửa bằng cách cho `/login` redirect sang `/dashboard` khi đã có phiên hợp lệ, **hoặc** đổi `start_url` sang `/dashboard`. Ưu tiên cách một vì `start_url: "/dashboard"` sẽ cho người chưa đăng nhập một cú redirect thừa. | **Nhỏ** — nhưng xem NC-3 |
| D4.4 | `VERSION` trong `sw.js` chưa có test canh khi `PRECACHE`/quy tắc đổi mà quên tăng version (BR-32). Thêm một assertion vào `service-worker.test.ts`. | **Nhỏ** |

---

## E. Bảng tổng hợp khuyến nghị theo mức công sức

### Nhỏ (≤ nửa ngày mỗi mục) — 22 mục

B1.1, B1.2, B1.3, B1.4, B2.4, B3.2, B3.3, B4.1, B5.1, B6.1, B6.2, B6.3, B6.4, B7.3, B7.4, C1.3, C1.4,
C2.1, C2.2, C2.3, C3.3, D1.1, D1.2, D2.1, D2.2, D3.b, D3.d(badge), D3.f, D3.h, D4.1, D4.3, D4.4

### Vừa (1–2 ngày) — 13 mục

B2.1, B2.2, B3.1, B4.2, B7.1, B7.2, C1.1, C1.2, C3.1, C3.2, D1.3, D1.4, D3.a, D3.c, D3.g, D4.2

### Lớn (> 2 ngày hoặc cần quyết định của user) — 2 mục

B6.5 (bộ chọn năm học thật), D3.e (điều chỉnh token màu để đạt AA)

### Ngoài phạm vi file này nhưng bắt buộc (xem `04_TO_BE_FLOWS.md`)

- **F07 — Đăng xuất** (`CRITICAL`)
- **F01 — đọc `?next=` / `?error=`** (`NEEDS_IMPROVEMENT`)
- **D4 — `/student/attendance` phải dùng `requireRouteAccess`** (`CRITICAL`, an ninh)
