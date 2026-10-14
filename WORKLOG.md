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

- **MOBILE-SHEETS-COPY-20261014 — hoàn tất và đã phát hành — Codex — 2026-10-14.** Menu/tài khoản bottom sheet; form tác vụ tách khỏi danh sách; giảm chữ/card trên toàn module, giữ màu/nghiệp vụ/quyền.
- **2.028 unit đạt / 0 lỗi / 24 integration bỏ qua**, lint/typecheck/build đạt. Build riêng không ngắt preview trực tiếp `http://127.0.0.1:3150`.
- Browser 14 vai trò: **74 đạt / 28 bỏ qua có chủ đích**, ba viewport; rà module ở 360px. Sau tinh chỉnh bộ lọc cuối, chạy lại **9/9 đạt**. [Phạm vi và bằng chứng](docs/system-workflow-redesign/MOBILE_SHEETS_2026-10-14.md).
- Kiểm chứng độc lập theo AGENTS §9: modal/focus/hydration và mất lease điểm danh; không đổi server rule, DB/RLS/API hay mật khẩu production.
- **MOBILE-SHEETS-RELEASE-20261014:** source `4bb4d42` đã push main, Vercel success đúng SHA; production 360/1366 HTTP 200, CSS mobile mới, không overflow/pageerror; dashboard yêu cầu đăng nhập.
- R5–R13/UX-42/R13.3, full E2E lịch sử và hydration P2 vẫn giữ mở; không suy ra hoàn tất từ lượt kiểm tra giao diện này.

## ➡️ VIỆC TIẾP THEO

Bản mobile đã phát hành; giữ cửa sổ preview để người dùng xem và phản hồi trực tiếp. KHANG.NHO dùng mật khẩu hiện có theo xác nhận; không đặt lại. R5.1 và full E2E/R13.3 giữ backlog riêng.

## ⛔ BLOCKERS

Không có blocker cho phát hành UI này. 24 integration test bỏ qua; full E2E lịch sử chưa hoàn tất. React hydration #418 ngắt quãng trước đây vẫn theo dõi riêng dù lượt rà module hiện tại không ghi nhận pageerror. Giới hạn Safari/điện thoại thật, no-JS và bảo vệ nháp ghi rõ trong báo cáo; không dùng kết quả giả lập để khẳng định mọi thao tác production.

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

### [2026-10-14] Codex — MOBILE-SHEETS-RELEASE-20261014 — xác nhận production
- **Làm được:** source `4bb4d42` đã push `main`; Vercel success đúng SHA; kiểm tra URL công khai ở 360/1366px đạt. CSS mobile mới đã được phục vụ; login HTTP 200, không overflow/pageerror, dashboard chưa đăng nhập chuyển về login.
- **File thay đổi:** hồ sơ release, WORKLOG, ba tài liệu tracking và lưu trữ nhật ký; không thay source sản phẩm trong commit release.
- **Migration/data impact:** không có. KHANG.NHO giữ mật khẩu hiện có; không chạy form ghi dữ liệu production.
- **Đã test:** source đã đạt lint/typecheck/build, 2.028 unit / 24 skip; browser 74 pass / 28 skip có chủ đích, refinement 9/9. Smoke production riêng như trên; không khẳng định full E2E hay authenticated production CRUD đã đạt.
- **Next:** người dùng xem và phản hồi qua preview 3150 đang mở. Backlog và giới hạn kiểm tra giữ nguyên trong báo cáo.

### [2026-10-14] Codex — MOBILE-SHEETS-COPY-20261014 — bố cục mobile và preview trực tiếp
- **Làm được:** menu/account bottom sheet theo ảnh; giảm chữ và khung card; danh sách thiếu nhi gọn; điểm danh hai cột trạng thái trực tiếp, ghi chú trong sheet; thay form cuối trang/anchor bằng sheet hoặc chuyển mục tại chỗ ở các module. Preview Chromium 390×844 có Fast Refresh, QA chạy browser riêng.
- **File thay đổi:** shared UI/layout, presentation pages/components trong `src`, test hồi quy và [báo cáo/inventory](docs/system-workflow-redesign/MOBILE_SHEETS_2026-10-14.md).
- **Migration/data impact:** không migration/API/RLS/dependency; không reset/seed DB hay thay mật khẩu production. E2E mới kiểm giao diện/read-only với tài khoản local.
- **Đã test:** lint/typecheck/build đạt; unit 2.028 pass / 0 fail / 24 skip; Playwright R3 navigation + mobile workspaces 74 pass / 28 skip có chủ đích. Sau tinh chỉnh bộ lọc, bản build cuối 9/9 pass. Không cộng rerun hay gọi full E2E lịch sử xanh.
- **Độc lập theo AGENTS §9:** verifier kiểm 59 guard/drawer test và browser/harness; lỗi mất lease vẫn cho lưu và hydration thay node mất nháp đã sửa, xác minh lại. Hai lượt verifier timeout do HMR không tính pass.
- **Quyết định mới:** yêu cầu người dùng cấm nút cuộn tới form cuối trang, ưu tiên bottom sheet, ít chữ trên điện thoại; giữ quy định màu/nghiệp vụ. Không tự đóng backlog R5–R13/UX-42/R13.3.
- **Phát hành:** source `4bb4d42` đã push main; Vercel và smoke production đạt theo task MOBILE-SHEETS-RELEASE-20261014. Giữ preview trực tiếp; giới hạn thực tế và rollback trong báo cáo.

### [2026-10-14] Codex — ANTI-AI-ERP-20261013 — redesign ERP và chuẩn bị phát hành
- **Làm được:** áp dụng tiêu chuẩn anti-AI toàn shell/module; chỉ giữ palette; bảng/list gọn, dashboard theo việc, disclosure cho tác vụ ít dùng, loading không che màn hình; bảo vệ nháp điểm danh/điểm và giữ phần gõ tiếp qua save/refresh.
- **File thay đổi:** inventory và route matrix tại [báo cáo anti-AI](docs/system-workflow-redesign/ANTI_AI_ERP_2026-10-13.md); shared UI, presentation components, tests và docs.
- **Migration/data impact:** không đổi SQL/RLS/API/permission/dependency; E2E dùng fixture local riêng, không seed/reset production.
- **Đã test:** lint/typecheck/build đạt;2026unit pass/24skip. Laptop226pass/3fixturefail, rerun3/3pass; final browser80/80 và staff10width đạt; full687 ngắt ở19pass khi local stack dừng. Khôi phục Docker, smoke release43/43pass trên build cuối.
- **Quyết định mới:** yêu cầu chủ dự án13/10 thay tiêu chuẩn hình thức cũ, giữ màu/nghiệp vụ; yêu cầu14/10 push/redeploy. Không tự đóng backlog R5–R13.
- **Blocker/rủi ro:** fullE2E chưa xanh toàn bộ; guard không intercept history/programmatic navigation; xem báo cáo. Docker đã khôi phục.
- **Phát hành / ANTI-AI-ERP-RELEASE-20261014:** source97b83c9 đã pushmain; Vercel success đúngSHA; smoke public production360/1366 đạt, xác nhận token8px/none và guard/dashboard. Bàn giao tài khoản theo lựa chọn chủ tài khoản; không tự reset mật khẩu.

### [2026-10-13] Codex — R4.5 — nghiệm thu R4 và triển khai theo yêu cầu

- **Làm được:** R4.2 wizard lưu giám hộ rồi em (JS/no-JS); R4.3 EntityHeader/6 tab, family/attendance và lỗi/retry UX-41; R4.4 hàng mobile63px/filter sheet/chip; R4.5 banner Thủ quỹ. Tất cả R4.1–R4.5 DONE.
- **File thay đổi:** students pages/components/actions/query, portal attendance query, TabNav/Wizard, E2E helper/spec và 18 unit mới; tài liệu tracking và hồ sơ R4 trong Git. Các phụ thuộc R2/R3 có sẵn được giữ và commit theo task ID.
- **Migration/data impact:** backup production schema/data ngoài Git; áp migration lịch sử R2.13,70/70 khớp; không policy RLS mới/backfill. E2E ghi fixture local và cleanup theo ID; pgTAP chạy DB audit mới từ70 migration.
- **Đã test:** lint/typecheck/build đạt; Vitest2.000 pass/24 skip; nhóm component cuối29/29; R4 E2E105/105,3,9 phút; pgTAP1.512/1.512. Full E2E trước sửa cuối: **677 pass /10 fail**; build release: **140 pass /1 lỗi giả định fixture lớp**, trong đó R4 **105/105 PASS**. Sau cập nhật test xác nhận lớp: **15/15 PASS**; luồng lên lớp trên DB audit mới **3/3 PASS**. Không cộng rerun vào lượt gốc để gọi toàn hệ thống xanh. Reviewer độc lập16 unit/boundary và JWT thật xác nhận D75.
- **Giới hạn:** tablet768×1024 có12 hàng nhưng điện thoại/trạng thái cần cuộn ngang;768×800 khoảng7 hàng. Không có live fixture ghi chú khác rỗng. UX-42/R13.3 chưa đóng.
- **Deployment:** `e4dcf89` đã push main và Vercel Production success. Smoke alias `https://cq-tntt-manager-web.vercel.app` đạt; URL riêng có Vercel Authentication; không gửi form production. **Next:** R5.1 chưa claim; UX-42/R13.3 giữ mở.

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

Các entry cũ hơn: [bản lưu trước mobile](docs/worklog-archive-before-mobile-2026-10-14.md) · [bản lưu trước anti-AI](docs/worklog-archive-before-anti-ai-2026-10-14.md) · [bản lưu trước R4 cuối](docs/worklog-archive-before-r4-final-2026-10-13.md).
