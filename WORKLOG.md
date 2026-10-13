# 📓 WORKLOG — CQ TNTT MANAGER

> **File phối hợp giữa các session AI (Claude ⇄ Codex).** Đọc TRƯỚC khi làm, cập nhật SAU khi làm.  
> Đây là nguồn sự thật về **trạng thái**. Nguồn sự thật về **việc cần làm** là [`docs/08-phase-plan.md`](docs/08-phase-plan.md).

---

## ⚠️ QUY TẮC BẮT BUỘC (đọc mỗi phiên)

1. **TRƯỚC khi làm gì:** đọc `TRẠNG THÁI HIỆN TẠI` + `VIỆC TIẾP THEO` + `BLOCKERS` + `QUYẾT ĐỊNH ĐÃ CHỐT` + entry mới nhất trong `NHẬT KÝ`.
2. **Claim task trước khi code:** lấy task ID từ `VIỆC TIẾP THEO` → ghi vào `TRẠNG THÁI HIỆN TẠI` dạng `P2-T11 — đang làm — <Claude|Codex> — <ngày>`.
3. **Làm đúng phạm vi task.** Không tiện tay sửa file ngoài scope.
4. **SAU khi làm xong hoặc trước khi hết phiên:**
   - Cập nhật `TRẠNG THÁI HIỆN TẠI` tối đa 6 dòng.
   - Cập nhật `VIỆC TIẾP THEO`.
   - Thêm 1 entry vào đầu `NHẬT KÝ SESSION`.
   - Cập nhật trạng thái task trong `docs/08-phase-plan.md`.
   - Có blocker → ghi vào `BLOCKERS`.
   - Chỉ giữ 6 entry gần nhất.
5. **Trước khi kết thúc phiên:** chạy các lệnh kiểm tra phù hợp. Tối thiểu sau khi scripts tồn tại:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
   Có DB/RLS → chạy thêm test DB. Có workflow UI → chạy E2E.
6. **KHÔNG ĐƯỢC:** ghi pass/done/verified/deployed khi chưa chạy thật; sửa test để che bug; tự đổi quyết định; commit secret.
7. **Commit + push: ĐƯỢC PHÉP** — chủ dự án cấp quyền thường trực **2026-08-14** (thay điều
   *"tự chạy git commit/push"* ở quy tắc 6 cũ và `AGENTS.md` §"User tự commit"). Ba ràng buộc
   **giữ nguyên**: (a) chạy kiểm thử thật **trước** khi commit — quy tắc 6 là về tính trung thực,
   không phải về git; (b) **một commit cho một task ID**, không gộp nhiều task; (c) cập nhật
   `WORKLOG` + log triển khai bằng số thật trước khi commit.

**Format entry:**

```text
### [YYYY-MM-DD] Phiên N — <Claude|Codex> — <task ID>
- **Làm được:** ...
- **File thay đổi:** ...
- **Migration/data impact:** ... hoặc không có
- **Đã test:** lệnh + kết quả thật
- **Quyết định mới:** ... hoặc không có
- **Blocker/rủi ro:** ...
- **Next action:** task tiếp theo + việc cụ thể
```

---

## 🚦 TRẠNG THÁI HIỆN TẠI

- **R4 release — đóng gói R3.4 — Codex — 2026-10-13.** R4 đủ5/5; kiểm thử thật đã chạy trước commit. R4-QA-01 đã sửa, đang hoàn tất E2E/redeploy.
- Kiểm thử: **2.000 unit pass /24 skip; R4 E2E105/105; pgTAP audit1.512/1.512**; lint/typecheck/build đạt. E2E toàn hệ thống cuối đang chạy.
- Reviewer độc lập kiểm browser/query/quyền; desktop y287, mobile hàng63px; tablet768×1024 thấy12 hàng, cột điện thoại/trạng thái cần cuộn ngang.
- Production đã backup và áp migration lịch sử;70/70 khớp. Chuẩn bị commit/push/redeploy theo yêu cầu; chưa ghi deployed.
- R2 13/13, R3 5/5 giữ hoàn tất; UX-42/R13.3 và R5–R13 còn mở. [Hồ sơ R4](docs/system-workflow-redesign/redesign-2c/R4_COMPLETION_2026-10-13.md).

## ➡️ VIỆC TIẾP THEO

**Đang làm: commit/push và redeploy R4**, kiểm tra deployment đúng SHA và smoke URL production. Sau bàn giao, task roadmap kế tiếp là R5.1; chưa claim R5.

## ⛔ BLOCKERS

Không còn blocker chức năng R4. E2E toàn hệ thống cuối đang chạy; Git/Vercel chưa hoàn tất. UX-42/R13.3 giữ mở. Giới hạn tablet và bản nháp wizard ghi rõ trong báo cáo; không reset DB local để xử lý xung đột pgTAP fixture.

## 🔒 QUYẾT ĐỊNH ĐÃ CHỐT (không tự đổi)

| # | Quyết định |
|---|---|
| D-1 | Hệ thống chỉ cho Giáo xứ Chợ Quán; không multi-tenant. |
| D-2 | Tech stack: Next.js + TypeScript + Supabase + Tailwind/shadcn; modular monolith. |
| D-3 | Deploy target cố định Vercel Hobby. |
| D-4 | Có PWA; không app native. |
| D-5 | Giao diện tiếng Việt, mobile + laptop, cam/da người pastel, không dark mode. |
| D-6 | 5 ngành: Chiên Con, Ấu Nhi, Thiếu Nhi, Nghĩa Sĩ, Hiệp Sĩ. |
| D-7 | Dự trưởng không phải ngành; là trạng thái chuyển tiếp và có thể là Dự trưởng phụ tá lớp. |
| D-8 | Không quản lý phân đoàn, chi đoàn, đội. |
| D-9 | 19 lớp mặc định: 2 Chiên, 6 Ấu, 5 Thiếu, 3 Nghĩa, 2 Hiệp và 1 lớp Dự trưởng trong HK1. Lớp Dự trưởng được tính vào tổng nhưng không phải ngành. Không có Chiên Con 3; chỉ có Thiếu 3, không có Thiếu 3A/3B. |
| D-10 | Ấu 1..3 và Thiếu 1..2 có A/B; mặc định lên lớp giữ nhánh và cho chuyển A↔B. Thiếu 2A/B cùng lên một lớp Thiếu 3. |
| D-11 | Một thiếu nhi có một lớp chính trong năm học. |
| D-12 | Năm học khoảng tháng 9–5; ngày cụ thể cấu hình. |
| D-13 | Một account chỉ có một role active. |
| D-14 | Role Trưởng/Phó ngành phải có sector cụ thể và hiển thị kèm tên ngành. |
| D-15 | Ban và Sa mạc assignment không phải primary role. |
| D-16 | Super Admin: Khang Nhỏ và Mr. Đạt; xem/sửa toàn hệ thống. |
| D-17 | Cha sở và Cha phó/Tuyên úy chỉ xem/báo cáo. |
| D-18 | Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký có global write. |
| D-19 | Thủ quỹ giới hạn; không sửa điểm, attendance, health, class/promotion. |
| D-20 | Trưởng/Phó ngành xem/sửa ngành mình; duyệt chuyển lớp. |
| D-21 | GLV đại diện tạo plan, phân người dạy, đề nghị chuyển lớp, khóa gradebook. |
| D-22 | GLV lớp và Dự trưởng có quyền lớp theo matrix; Dự trưởng grade/comment qua flag. |
| D-23 | Dì/Sơ là danh xưng, không role. |
| D-24 | Một student có một guardian; guardian có nhiều con. |
| D-25 | Nếu staff là guardian, giữ role staff và có mục Con của tôi. |
| D-26 | Student account từ ngành Ấu Nhi. |
| D-27 | Username: student CQxxxx; staff GLVxxx; guardian phone; password tạm ngắn 8 ký tự và force change. |
| D-28 | Super Admin đổi username/đặt password/xóa account role khác, không xem password hiện tại; không sửa/xóa account SA. Xóa account giữ hồ sơ nghiệp vụ và bỏ link. Guardian/student account bắt buộc link hồ sơ tương ứng; mọi role GLV bắt buộc link staff profile, role lớp còn phải đúng assignment. |
| D-29 | Attendance chỉ thứ Năm và Chúa nhật. |
| D-30 | Mỗi attendance record có Mass và Catechism độc lập. |
| D-31 | Default mọi em present; chỉ sửa ngoại lệ. |
| D-32 | Một editor/session; lease 15 phút; người khác takeover sau timeout. |
| D-33 | Attendance khóa sau 3 ngày; chỉ SA mở/sửa. |
| ~~D-34~~ | ~~Không full audit before/after; chỉ metadata updated_at/by.~~ **ĐÃ ĐẢO NGƯỢC bởi D-65 (2026-07-23).** |
| D-35 | Staff attendance ở cả Thu/Sun; present/excused/unexcused. |
| D-36 | Attendance warnings không tự động giữ lớp. |
| D-37 | Teaching plan không approval/version workflow; representative tạo. |
| D-38 | Kết quả thang 10; GLV lớp tự tạo số cột assessment tùy ý, không bắt buộc cột 15 phút và được lặp/bỏ loại; hệ số mặc định 1/2/3/1, GLV đổi hệ số từng cột trước gradebook lock, SA cấu hình mặc định/toàn cục. |
| D-39 | Attendance score hệ thống đề xuất, teacher sửa trước lock. |
| D-40 | Có public comments và staff-only notes. |
| D-41 | Top 5 bật/tắt và có thể publish trước final average. |
| D-42 | Trang student detail không có đề xuất chuyển lớp. |
| D-43 | Promotion: representative đề nghị, sector leader/deputy duyệt; warning không hard-block. |
| D-44 | Hiệp 2 có thể đề xuất Dự trưởng; không tự tạo account/role. |
| D-45 | Không module hộ gia đình riêng; guardian ở student detail và portal riêng. |
| D-46 | Phụ huynh không sửa/đề nghị sửa hồ sơ; được gửi đơn xin nghỉ. |
| D-47 | Ban: 6 seed, có thể thêm; mỗi staff tối đa hai Ban. |
| D-48 | Chỉ Trưởng/Phó Ban tạo thông báo/lịch/công việc tuần. |
| D-49 | Ban Kỹ thuật có thiết bị và mượn/trả ai/lúc nào/note. |
| D-50 | Thông báo chỉ trong web; có read state; không chat/SMS/email/Zalo/schedule. |
| D-51 | Dashboard/report theo tuần, tháng, năm; Excel/PDF; snapshot final; giữ 5 năm. |
| D-52 | Export phải giữ đúng filter/date range. |
| D-53 | Dữ liệu import từ Google Sheets/Excel; duplicate chỉ warning; user review. |
| D-54 | RLS mọi bảng, private storage, service role server-only. |
| D-55 | User tự commit; agent không commit/push nếu không được yêu cầu rõ. |
| D-56 | Sa mạc thiếu nhi là Phase 8 cuối cùng. |
| D-57 | Sa mạc: guardian đăng ký, camp leader assignment, phí và published receipt; chi tiết khác hỏi lại. |
| D-58 | Ngưỡng cảnh báo chuyên cần cấu hình theo năm học, mặc định: 3 buổi vắng liên tiếp, 3 Chúa nhật liên tiếp, tỷ lệ có trọng số < 80%. SA đổi trong `/admin`. |
| D-59 | Điểm chuyên cần tách **hai điểm riêng**: điểm Thánh lễ và điểm Giáo lý, mỗi điểm = trung bình có trọng số × 10. Không gộp thành một điểm. |
| D-60 | Portal phụ huynh/thiếu nhi ở Phase 3 chỉ làm tối thiểu để đóng gate: đơn xin nghỉ, xem điểm danh đã chốt của con/của mình. Dashboard và kết quả để P5-T6. |

### Chốt sau audit Giai đoạn 1 — 2026-07-23

> Chi tiết đầy đủ, lý do và ảnh hưởng: **`docs/system-workflow-redesign/06_DECISION_LOG.md`**.
> Các quyết định này **ghi đè** mô tả cũ trong `docs/03`, `docs/05`, `docs/06`.

| # | Quyết định | Migration |
|---|---|---|
| D-61 | Báo kết quả thao tác: form ngắn → redirect + mã kết quả; form dài → giữ dữ liệu, lỗi tại chỗ. Mọi write phải kiểm số dòng, 0 dòng = thất bại. | ❌ |
| D-62 | Tạo account + gán role vẫn **chỉ Super Admin**; nhưng thêm nút "Cần tạo tài khoản" ở trang chi tiết GLV + hàng chờ cho SA duyệt. Không gộp tạo hồ sơ với tạo account. | ❌ |
| D-63 | Tạo/sửa hồ sơ thiếu nhi + guardian: global-write **toàn xứ đoàn**; **Trưởng/Phó ngành trong ngành mình**. GLV không. | ✅ |
| D-64 | Cổng phụ huynh: mục "Con của tôi"; 1 con vào thẳng, nhiều con hiện danh sách. | ❌ |
| **D-65** | **CÓ full audit log** — đảo ngược D-34. Append-only, không ai sửa/xóa, chỉ SA đọc, không log password/health content. | ✅ |
| D-66 | Cha sở/Cha phó **không chốt** báo cáo (chỉ xem/export). Tách quyền view khỏi quyền finalize. | ✅ |
| D-67 | Thủ quỹ đọc: danh sách em theo lớp (tên thánh, họ tên, lớp, ngành), SĐT guardian, sĩ số, danh sách nhân sự cơ bản, báo cáo tổng hợp. **Không**: ngày sinh/địa chỉ, health, bí tích, điểm, nhận xét, chi tiết từng buổi điểm danh, ghi chú nội bộ. Không ghi gì. | ✅ |
| D-68 | Cha sở/Cha phó/Thủ quỹ **vào xem được** `/attendance` (không sửa). | ❌ |
| D-69 | Trưởng ngành xem được dữ liệu năm học cũ trong ngành mình (xác nhận hiện trạng). | ❌ |
| D-70 | Guardian/student **chỉ đọc lớp của con/của mình**; không đọc toàn bộ `classes`/`academic_years`. | ✅ |
| D-71 | Thêm cột **ngày kết thúc học tại giáo xứ** (= mốc HK1) vào `academic_years`. Sau mốc: cảnh báo, **không** tự đóng lớp Dự trưởng. | ✅ |
| D-72 | Không thêm lớp ngoài 19 lớp — **tạm thời**, không được thêm constraint "tối đa 19". | ❌ |
| D-73 | **Chỉ Super Admin** đóng năm học. Sau khi đóng, không ai ghi mới trừ SA. | ✅ |
| D-74 | Khóa gradebook: **GLV đại diện + GLV lớp của chính lớp đó**. Dự trưởng ❌. Global-write ❌ (siết lại). SA giữ unlock. | ✅ |
| D-75 | `student_attendance_records.note` là **ghi chú nội bộ** — chặn guardian/student ở cả UI lẫn RLS. | ✅ |
| D-76 | Trả thiết bị một phần = **còn nợ** (loan vẫn mở, không trừ kho). Hỏng/mất là thao tác **riêng**, có xác nhận, ghi audit. | ✅ |
| D-77 | **Thu hồi được** thông báo đã publish: đánh dấu revoked (không xóa row), biến khỏi hộp thư + unread count, ghi audit. | ✅ |
| D-78 | Mỗi Ban chỉ **một** Trưởng ban; Phó ban không giới hạn. | ✅ |
| D-79 | Được chỉnh đậm màu nút chính/cảnh báo và nâng cỡ chữ ≥13px để đạt AA. Giữ hệ màu cam/da người, không dark mode. | ❌ |

---

## 📖 NHẬT KÝ SESSION (mới nhất ở trên, giữ 6 entry)

### [2026-10-13] Codex — R4.5 — nghiệm thu R4 và triển khai theo yêu cầu

- **Làm được:** R4.2 wizard lưu giám hộ rồi em (JS/no-JS); R4.3 EntityHeader/6 tab, family/attendance và lỗi/retry UX-41; R4.4 hàng mobile63px/filter sheet/chip; R4.5 banner Thủ quỹ. Tất cả R4.1–R4.5 DONE.
- **File thay đổi:** students pages/components/actions/query, portal attendance query, TabNav/Wizard, E2E helper/spec và 18 unit mới; tài liệu tracking và hồ sơ R4 trong Git. Các phụ thuộc R2/R3 có sẵn được giữ và commit theo task ID.
- **Migration/data impact:** backup production schema/data ngoài Git; áp migration lịch sử R2.13,70/70 khớp; không policy RLS mới/backfill. E2E ghi fixture local và cleanup theo ID; pgTAP chạy DB audit mới từ70 migration.
- **Đã test:** lint/typecheck/build đạt; Vitest2.000 pass/24 skip; nhóm component cuối29/29; R4 E2E105/105,3,9 phút; pgTAP1.512/1.512. Full E2E đang chạy, chưa kết luận. Reviewer độc lập16 unit/boundary và JWT thật xác nhận D75.
- **Giới hạn:** tablet768×1024 có12 hàng nhưng điện thoại/trạng thái cần cuộn ngang;768×800 khoảng7 hàng. Không có live fixture ghi chú khác rỗng. UX-42/R13.3 chưa đóng.
- **Next:** commit theo task, push main, chờ Vercel đúng SHA và smoke production rồi mới ghi deployed.

### [2026-10-13] Codex — R4.1 — danh sách thiếu nhi

- **Làm được:** Toolbar/FacetFilter, DataTable v2, sort máy chủ và phân trang20/50; form trong drawer URL; giữ năm lịch sử/quyền Thủ quỹ. Sửa compact CSS, popup tràn và margin drawer.
- **File thay đổi:** students page/directory/queries, PageHeader, FacetFilter, ColumnToggle, Drawer, globals.css; unit/E2E và docs. [Báo cáo19](../REDESIGN/19_R4_1_COMPLETION_2026-10-13.md) ghi phạm vi và ảnh.
- **Migration/data impact:** không migration/RLS/production; E2E local có ghi fixture. Spec mới cleanup đúng51 UUID/worker; spec cũ giữ tác động fixture vốn có. Không reset/seed DB.
- **Đã test:** lint/typecheck/build đạt; full unit1.978 pass/24 skip; E2E90/90 ba viewport; hồi quy tập trung111/111. Reviewer độc lập query/component, các lượt70/70,37/37,44/44.
- **Quyết định mới:** không có; D-R14 một task rủi ro cao trong phiên. Form hiện có chưa phải wizard R4.2.
- **Blocker/rủi ro:** không có blocker R4.1; R4.2–.5, UX-41 detail, UX-42/R13.3 vẫn mở. Giữ log lỗi trước sửa và giới hạn Thủ quỹ scalar/fixed sort.
- **Next action:** R4.2 wizard giám hộ → thiếu nhi. Chưa commit/push vì có thay đổi R2/R3 sẵn trong cùng worktree; không gộp vào task này.

### [2026-10-12] Codex — R3 — Shell & Navigation và rà luồng theo vai trò

- **Làm được:** R3.1–R3.5 DONE; 5 biến thể menu, resolver Lớp của tôi đúng Q-R9/năm/phân công, rail nhớ theo tài khoản, badge server đúng lớp/ngành/người nhận, Menu/map/no-JS/coachmark. Sửa QA-01–06; giữ 7 preset mobile và luật CQ.
- **File thay đổi:** `src/config/navigation.ts`, feature navigation mới, layout shell/header/sidebar/drawer/rail/badge/map/sign-out, dashboard layout/page, class detail shortcuts; unit navigation/query và `tests/e2e/r3-navigation.spec.ts`; tài liệu và evidence ở `../REDESIGN/17_R3_COMPLETION_2026-10-12.md`, `18_ROLE_WORKFLOW_REVIEW_2026-10-12.md`.
- **Migration/data impact:** không migration/RLS mới, không production. E2E ghi DB audit riêng 54521; 16 dòng fixture badge/4 bảng đã cleanup đúng ID, xác nhận còn 0 và count về baseline. Walkthrough chỉ đọc normal 54421. Giữ toàn bộ thay đổi R2 chưa commit.
- **Đã test:** `npm.cmd test` 1.967 pass / 24 skip; `npm.cmd run lint`, `typecheck`, `build` đạt. Playwright R3 cuối 54/54; full 651 test: 645 pass / 6 fail, chạy lại 6 tình huống × 3 viewport: 18/18 pass. Walkthrough 644/644; SSR 15/15; shortcut 9/9; 9 cặp viewport chuẩn. Log thật trong `../REDESIGN/r3-verification/`.
- **Độc lập theo AGENTS §9:** JWT 54/54, sau Q-R9 20/20; pure Q-R9 9/9; badge dương 52/52; rail 13/13; NextLink 32/32. Không dùng lượt trước sửa để che lỗi; bundle cuối QA-06 được build và kiểm R3/shortcut lại.
- **Quyết định mới:** không có; CT_NOIBO chỉ áp nguyên tắc UI, giữ DS/nghiệp vụ CQ. Đã rà 14 vai trò/14 module và ghi điểm bất tiện từng phase sau.
- **Blocker/rủi ro:** R13.3 chưa có ba lượt toàn bộ xanh; UX-41 thiếu báo lỗi/retry giám hộ khi RPC 502; UX-42 tiêu đề desktop lặp. Chưa kiểm Safari/iOS thật, không tuyên bố mọi mutation của mọi vai trò đều đã chạy lại.
- **Next action:** R4 Thiếu nhi + UX-41; chưa bắt đầu R4, chưa deploy, chưa commit/push gộp working tree R2/R3.

### [2026-10-12] Codex — R2 — hoàn thiện 13 task và kiểm chứng độc lập

- **Đã làm:** sửa QA-01–08; hoàn thiện các primitive và consumer R2; sửa race điều hướng React bằng backport có version/hash guard; chọn năm cũ trên 4 module, banner chỉ đọc và 34 guard server. Bổ sung SSR/no-JS, Login POST, vùng bấm checkbox và feedback khôi phục cột điểm cuối.
- **File thay đổi:** shared UI/layout, truy vấn/action năm học, 4 consumer tabs, export, migration/types, test/runner và tài liệu. Danh mục theo task ở [báo cáo R2](../REDESIGN/16_R2_COMPLETION_2026-10-12.md).
- **Migration/data impact:** migration mới chỉ thêm view/RPC đọc, không đổi RLS/backfill; chạy sạch và áp local. Fixture lịch sử tổng hợp ở local; E2E dùng project audit riêng. Không áp production.
- **Đã test:** lint/typecheck/build đạt; Vitest 1.936 pass / 24 skip; patcher 3/3; pgTAP 1.512/1.512; harness 112/112; navigation 80/80; year view 78/78 và JWT thật. E2E đầu 547 pass / 16 fail / 34 không chạy; cuối 593 pass / 4 lỗi proxy fixture; chạy lại 9/9 đạt. Build hiển thị cuối: shell 87 pass / 3 lỗi giả định fixture, sửa test và chạy lại 3/3 đạt; component 20/20 và context 12/12 đạt.
- **Review độc lập:** foundation, React navigation và year view đã có reviewer; bản sửa feedback cột điểm được xác nhận đúng nguyên nhân. Log/JSON/screenshot giữ tại `../REDESIGN/r2-verification/`.
- **Rủi ro:** Next pin 15.5.20; khi nâng phiên bản phải đánh giá lại backport React. Chưa deploy; không đóng nợ production ngoài R2.
- **Next:** đã dừng sau R2; R3 là phase kế tiếp. R13.3 vẫn cần ba lượt toàn bộ E2E xanh ổn định.

### [2026-10-12] Codex — 2C-VERIFY-R1-R2 — kiểm định theo yêu cầu chủ dự án

- **Kết luận:** R1 chưa thấy lỗi mới trong diff đã kiểm; R1.5 chỉ hoàn tất scope cục bộ. R2.1/R2.2/R2.4 chưa đạt nghiệm thu, chuyển REVIEW; 8 lỗi UI có source, bước tái hiện và browser evidence.
- **Đã chạy:** lint/typecheck/build đạt; Vitest 1869 pass / 1 fail / 24 skip (lỗi cũ phụ thuộc tuần hiện tại, đối chứng Date 21/08 đạt 9/9); browser harness 77/92 pass; E2E chọn lọc app thật + Supabase local 27/30 pass, 3 fail bảng điểm. Baseline trước redesign: 1/3 pass, 2 fail do badge khoá/mở không cập nhật; lỗi hiện lại cột laptop của HEAD chưa phân loại dứt điểm. Chi tiết ở báo cáo.
- **Tài liệu bổ sung:** đã đọc CT_NOIBO_MASTER_UI_UX_CONSTRAINTS_CODEX.md; chỉ áp nguyên tắc UI phù hợp CQ TNTT, không nhập branding/domain của hệ thống khác. Ma trận ràng buộc và bảo toàn nghiệp vụ trong báo cáo.
- **File thay đổi:** WORKLOG + tài liệu tracking REDESIGN + báo cáo/harness/evidence độc lập ngoài repo app. **Không sửa source sản phẩm, không migration/RLS/production; E2E chỉ dùng fixture DB local.**
- **Next:** khi tiếp tục sửa, ưu tiên QA-05 rồi QA-01/02/03/04 và QA-06/07/08. Phiên này **dừng sau kiểm định**, không sửa lỗi hoặc làm task mới, không commit/push; giữ nguyên thay đổi chưa commit của R2.12.

### [2026-08-20] Phiên 75 — Claude — `BDH-2025-001` + `BDH-2025-002` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án gửi `NH_2025-2026/DS BAN ĐIỀU HÀNH.xlsx` kèm ảnh màn hình `/account`:
  *"file chứa các người được bổ nhiệm làm các chức vụ tương đương với các role phân quyền trong hệ
  thống, thì tôi cần bạn làm sao kiếm các người này trong hệ thống hiện tại và đảm bảo khi tôi là
  admin tạo tài khoản cho họ thì họ sẽ được đúng role đúng phân quyền hệ thống — ví dụ như anh lê
  trí dũng là Xứ Đoàn Phó Nội Vụ… nhưng khi tạo tài khoản ra thì vai trò chỉ là giáo lý viên bình
  thường"*.
- **Đã hỏi lại trước khi code** — ba lựa chọn, chủ dự án chọn cả ba mức "làm thật": (a) thêm trường
  chức vụ bổ nhiệm, (b) gộp Chiên Con vào ngành Ấu Nhi, (c) tạo 6 Ban bằng migration.
- **Đo trước khi sửa, không đoán.** Đối chiếu từng dòng sổ với production qua session pooler:
  **20/20 hồ sơ tìm thấy, tên thánh khớp 20/20.** Toàn hệ thống mới có **3 tài khoản** (2 Super
  Admin + `GLV040`). `select count(*) from public.committees` ⇒ **0**.
  `class_staff_assignments` đang hoạt động: `member 65` · `trainee 22` · **`representative 0`**.
- **Nguyên nhân gốc (không phải lỗi phân quyền):** `staff_profiles` **không có cột nào ghi chức vụ**,
  và `role_assignments` không dùng để ghi trước được — nó tham chiếu `profiles(id)`, tức phải CÓ tài
  khoản rồi mới ghi được vai trò, trong khi chức vụ có trước tài khoản hàng tháng. Nên hộp thoại
  "Cấp tài khoản" chỉ còn một thứ để đoán: `capacity` của phân công lớp.
- **Làm được:**
  1. **`BDH-2025-001` — 6 Ban thật vào migration.** `PHUNG_VU · SINH_HOAT · KY_THUAT · TRUC ·
     TRUYEN_THONG · Y_TE`, thứ tự theo đúng sổ, chỉ Ban Kỹ thuật giữ kho thiết bị. `QUAN_LY` của
     seed cũ bị hạ cờ rồi **xoá có điều kiện** (9 khoá ngoại `on delete restrict` trỏ vào
     `committees`, nên phải tự kiểm trước chứ không để DB trả lời hộ). Khối committees **rời khỏi
     `seed.sql`** — cùng lý do và cùng khuôn với `20260725000100_reference_catalog.sql`.
  2. **`BDH-2025-002` — `appointed_role` + `appointed_sector_id`.** CHECK
     `staff_profiles_appointment_shape` hẹp hơn `app_role` một cách có chủ ý: **không** nhận vai trò
     lớp (đã suy được từ phân công — ghi lần hai là hai nguồn sự thật lệch nhau), không nhận
     `super_admin` (trần D-102), và buộc cặp chức-vụ-ngành khớp nhau đúng như
     `role_assignments_scope_matches_role`. Backfill **14 hồ sơ** khớp bằng **`staff_code`, không
     bằng họ tên**: sổ có **hai** "Maria Nguyễn Thị Thanh Hằng" (`GLV021` là Soeur ở Thiếu 1A,
     `GLV056` là chị huynh trưởng ở Ấu 3A) — khớp bằng tên ở đây là trao toàn quyền xứ đoàn cho
     nhầm người. **6 Trưởng Ban của sổ cố ý để NULL:** "Trưởng ban" không phải `app_role` (D-15).
  3. **Ai sửa được cột mới — 0 policy mới.** `staff_profiles_update_global_write` đã đúng tập người
     cầm sổ bổ nhiệm; còn `staff_profiles_update_self` bị `app.guard_staff_self_update()`
     (IMP-BULK-002) chặn theo **danh sách cho phép** (`to_jsonb(new) - <4 cột liên lạc>`), nên hai
     cột thêm hôm nay **tự động** được bảo vệ. pgTAP `058` canh đúng chỗ đó: nếu ai đổi hàm ấy sang
     danh-sách-cấm thì đây là bài đỏ trước tiên.
  4. **Tầng ứng dụng:** `grantableRolesForStaff` nhận thêm `appointedRole` và **sổ bổ nhiệm thắng
     phân công lớp** · `isAppointableRole()` lọc lại giá trị đọc từ DB (chọn sẵn một vai trò lớp mà
     không kèm `classId` là đẩy người dùng vào lượt chèn chắc chắn bị trigger chặn) ·
     `recommendedSectorId` điền sẵn luôn ô Ngành · khối "Tài khoản đăng nhập" **cảnh báo khi vai trò
     lệch chức vụ** (dùng khuôn `border-warning` thay vì `FormMessage tone="danger"`: đây là trạng
     thái đứng yên, `role="alert"` sẽ bắt trình đọc màn hình đọc "Lỗi:" ngay khi tải trang) · ô
     "Chức vụ bổ nhiệm" trong biểu mẫu sửa hồ sơ, ô "Ngành" chỉ hiện với chức vụ ngành ·
     `updateStaffSchema.superRefine` canh cặp ở tầng Zod để người dùng nhận câu tiếng Việt thay vì
     một `23514` trần bị `updateStaff` đổi thành "Không cập nhật được hồ sơ".
  5. **`NH_2025-2026/PHAN_QUYEN_BAN_DIEU_HANH_2025-2026.md`** — bảng 20 người kèm mã hồ sơ, vai trò
     phải chọn, ngành phải chọn; cách sửa `GLV040`; và 4 lỗ hổng đo được (§6).
- **File thay đổi:** `supabase/migrations/20260820000100_parish_committees.sql` ·
  `supabase/migrations/20260820000200_staff_appointed_role.sql` ·
  `supabase/tests/058_bdh_appointment_and_committees_test.sql` · `supabase/seed.sql` ·
  `src/types/database.ts` · `staff/grantable-roles.ts` · `staff/schemas.ts` ·
  `staff/server/queries.ts` · `staff/server/actions.ts` · `staff/components/staff-account-panel.tsx` ·
  `staff/components/staff-profile-editor.tsx` · `app/(dashboard)/staff/[staffId]/page.tsx` ·
  `tests/unit/provisionable-roles.test.ts` · `tests/unit/staff-schemas.test.ts` ·
  `NH_2025-2026/PHAN_QUYEN_BAN_DIEU_HANH_2025-2026.md` (mới).
- **Migration/data impact:** 2 migration, **đã push production**. Chèn **6 dòng** vào một bảng đang
  rỗng (`committees`), thêm **2 cột nullable** và backfill **14 dòng** `staff_profiles`. **0 policy
  mới · 0 đổi RLS · 0 đổi quyền · 0 dòng thiếu nhi bị đụng.** Sao lưu trước khi push:
  `backups/prod-20260820-truoc-BDH.sql` (schema) + `…-data.sql` (2,1 MB, ngoài repo).
- **Đã test (số thật):** pgTAP **1500/1500** (58 file, +19 bài mới) · unit **1749 pass / 24 skip**
  (123 file, +11 bài mới) · lint **0 warning** · typecheck ✓ · build **28/28**. Xác minh trên
  production sau push: `committees` 6 dòng đúng thứ tự sổ · `appointed_role is not null` = **14**.
  ⚠️ **Chưa chạy E2E** cho đợt này.
- **Quyết định mới:** **BDH-2025-002** — chức vụ bổ nhiệm là **dữ liệu về sổ, không phải quyền**;
  nó chỉ điền sẵn ô chọn và bật cảnh báo lệch, quyền vẫn đi nguyên qua `assign_primary_role` với
  trần D-102 và chốt "chỉ Super Admin". **BDH-2025-001** — danh sách Ban của xứ đoàn có **Ban Trực**
  và **không có** "Ban Quản lý"; dữ liệu tham chiếu đi theo migration, không theo seed.
- **Blocker/rủi ro:** việc (b) **gộp Chiên Con vào Ấu Nhi — CHƯA LÀM**, xem `BLOCKERS`. Ngoài ra
  `GLV040` vẫn đang mang `class_teacher`: cố ý để chủ dự án bấm "Đổi vai trò" trên giao diện, vì
  đường ấy ghi `account_audit_events` còn một lệnh UPDATE trong migration thì không có actor thật
  để ghi vào nhật ký.
- **Next action:** chốt hướng Chiên Con (§6.1 của báo cáo), rồi cấp 19 tài khoản còn lại theo bảng
  §3 và gắn 6 Trưởng ban ở `/committees`.


Các entry cũ hơn: [bản lưu trước R4 cuối](docs/worklog-archive-before-r4-final-2026-10-13.md).
