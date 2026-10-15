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
7. **Tự commit + push + production: BẮT BUỘC sau mỗi task sửa code hoàn tất**, theo yêu cầu
   thường trực của chủ dự án **2026-10-14**. Không kết thúc ở local hoặc hỏi lại có muốn
   phát hành không, trừ khi user yêu cầu riêng chưa phát hành lượt đó. Chạy kiểm thử thật,
   chỉ stage file thuộc task, một commit cho một task ID, cập nhật log bằng số thật;
   push `main`, theo dõi Vercel đúng SHA và smoke URL production. Nếu lỗi thì xử lý hoặc
   ghi blocker thật, không bỏ qua kiểm tra. Chi tiết: `AGENTS.md` §10.

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

- **DETAIL-NAV-AFFORDANCE-20261014 — đã phát hành — Codex — 2026-10-15; source `117362c`.** Thiết kế lại hồ sơ thiếu nhi/nhân sự/lớp, header chi tiết thống nhất; các hàng/thẻ có dấu hiệu mở và vùng bấm toàn khối, giữ tác vụ riêng.
- **2.033 unit đạt / 24 skip**, lint/typecheck/build đạt; browser **117/117**, kiểm lại **51/51** sau chỉnh menu cuối, trên 360/768/1366: vùng bấm, bàn phím, no-JS, tác vụ riêng, quyền, phân trang, tạo hồ sơ/ghi danh, Luce. Không migration/RLS/quyền hoặc dữ liệu production.
- **RESTORE-LUCE-LOADING-20261014 đã phát hành** source `82c05b0`, giữ trong bản sửa mới; **IMPORT-NH2025-20261014** đã nhập phần đủ căn cứ, đối soát 21/21.
- Thiếu/mâu thuẫn dữ liệu năm học và điểm danh Giáo lý chưa nhập native tiếp tục theo báo cáo Excel ngoài Git; full E2E lịch sử/R5–R13/UX-42/R13.3 giữ backlog riêng.

## ➡️ VIỆC TIẾP THEO

DETAIL-NAV-AFFORDANCE-20261014 đã hoàn tất và phát hành. Backlog dữ liệu theo báo cáo đã bàn giao; các hạng mục R5–R13/UX-42/R13.3 vẫn theo kế hoạch riêng, không nằm trong lượt sửa này.

## ⛔ BLOCKERS

Dữ liệu nguồn còn thiếu: giới tính/ngày sinh/địa chỉ/liên lạc; hai hồ sơ có điểm tổng kết mâu thuẫn và hai hồ sơ không có tổng kết. Attendance hiện bắt buộc cả Mass/Catechism, nguồn chỉ có Giáo lý. Báo cáo 15 sheet nằm trong `NH_2025-2026/KET_QUA_NHAP_LIEU_20261014` ngoài Git. `npm run test:db` trên DB preview có fixture sẵn bị trùng; bộ 59 file chạy lại trên database riêng giữ nguyên schema/owner/ACL và seed tham chiếu đạt 1.512/1.512. 24 integration skip và full E2E lịch sử chưa kiểm lại.

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
| D-55 | **Thay thế 2026-10-14:** sau mỗi task sửa code hoàn tất và qua kiểm tra, agent tự commit, push và triển khai production, xác nhận đúng SHA + smoke; không hỏi lại trừ user yêu cầu riêng chưa phát hành. Xem `AGENTS.md` §10. |
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

### [2026-10-14] Codex — DETAIL-NAV-AFFORDANCE-20261014 — hồ sơ và hàng mở chi tiết
- **Làm được:** tên trong danh sách có mũi tên/nhãn xem hồ sơ, nền/viền/hover/focus và bấm toàn hàng; dùng link thật không JS. Áp dụng thiếu nhi/nhân sự/lớp, giáo án, kết quả, điểm danh, Ban, nhập Excel, báo cáo và các danh sách con. Giữ `prefetch=false`, tác vụ ghi danh/điện thoại/xuất độc lập.
- **Bố cục:** nhận diện/lớp/trạng thái/liên hệ ở đầu; nhóm thông tin và tác vụ rõ; sáu mục thiếu nhi hiện đủ trên mobile; thông tin ngắn hai cột. Các trang chi tiết dùng chung header và khối nội dung; giữ Luce/Lời Chúa.
- **Đã test:** lint/typecheck/build đạt; 2.033 unit pass / 24 skip; browser 117/117, sau chỉnh menu cuối kiểm lại 51/51, ba viewport 360/768/1366. Ghi rõ các lượt trước, lỗi cột cố định che nút xuất trên mobile và locator cũ trong [báo cáo](docs/system-workflow-redesign/DETAIL_NAV_2026-10-14.md). Không gọi full E2E toàn hệ thống xanh.
- **File thay đổi:** UI shared, danh sách/trang chi tiết và kiểm thử tương ứng; log/ảnh fixture local lưu `backups/detail-nav-20261014` ngoài Git, ảnh chọn lọc trong verification/evidence.
- **Migration/data impact:** không SQL/migration/RLS/server action/dependency mới; browser dùng dữ liệu local, fixture do test tạo được dọn theo ID. Không thay dữ liệu production.
- **Phát hành 15/10/2026:** source `117362caeb8cf7fb936cfafc8b3208d51818fd3e`, Vercel success đúng SHA; public smoke 360/1366 đạt, `/login` HTTP 200, CSS mới đã có, không tràn ngang/runtime error. Các hồ sơ đăng nhập được kiểm local bằng E2E, không ghi dữ liệu production. Chứng cứ trong báo cáo task.

### [2026-10-14] Codex — RESTORE-LUCE-LOADING-20261014 — khôi phục loading theo yêu cầu
- **Nguyên nhân:** commit anti-AI `97b83c9` bỏ ảnh/câu khỏi overlay, truyền hai mảng rỗng vào provider ở cả auth/dashboard và bỏ preload ảnh. Tài sản gốc vẫn còn.
- **Làm được:** khôi phục ảnh Luce, một câu Lời Chúa có nguồn, ba chấm và chuyển động đã có; nạp trước ảnh kế tiếp, giữ chọn ngẫu nhiên không lặp liền kề. Giữ ngưỡng hiện 0 ms, tối thiểu 250 ms, failsafe 30 giây, không chặn chuột/cướp focus. Không khôi phục whole-page Suspense từng che nội dung SSR khi thiếu JavaScript.
- **File thay đổi:** hai layout auth/dashboard, loading-overlay/provider, unit và E2E loading, tài liệu tracking. Ảnh `public/loading` và nội dung `src/content/LoiChua.md` dùng nguyên bản; tracing build có cả 4 ảnh và kho câu.
- **Migration/data impact:** không có; browser đăng nhập bằng fixture local, không seed/reset dữ liệu, không đổi quyền hay mật khẩu.
- **Đã test:** lint/typecheck đạt; `npm test` 2.033 pass / 24 skip (nhóm loading 24/24); build production cô lập đạt; E2E cuối 6/6 trên mobile 360, tablet 768, laptop 1366 × hai chế độ chuyển động. Lượt đầu 4/6 do locator của test nhầm menu desktop `<summary>` là button; sửa locator đúng DOM và chạy lại toàn nhóm. Không gọi full E2E lịch sử xanh.
- **Phát hành / RESTORE-LUCE-RELEASE-20261014:** source `82c05b0` đã push main, Vercel success đúng SHA. Smoke production 4/4 (360/1366 × thường/giảm chuyển động): ảnh CDN tải thật, câu/nguồn khớp kho gốc, card nằm gọn màn hình, không pageerror. POST đăng nhập bị giữ/chặn ngay trong trình duyệt kiểm thử, không gửi yêu cầu đăng nhập hay ghi dữ liệu production. [Bằng chứng và ảnh](docs/system-workflow-redesign/verification/evidence/luce-loading-20261014/release.json).
- **Next:** người dùng tải lại trang; backlog dữ liệu năm học và full E2E lịch sử giữ nguyên.

### [2026-10-14] Codex — IMPORT-NH2025-20261014 — nhập dữ liệu và tải đủ bảng điểm
- **Làm được:** đọc đủ 53 tệp nguồn; bổ sung 11 thiếu nhi, 3 giám hộ, 3 bí tích, 6 Trưởng Ban, 39 địa chỉ nhân sự; nhập 472 cột / 18.659 ô điểm và 181 ghi chú nội bộ. Có 754 tổng kết năm không mâu thuẫn; giữ kết quả Excel kể cả công thức tính ô trống theo xác nhận của user. Cột thành phần được lưu ẩn để không cộng trùng vào tổng kết.
- **File thay đổi:** helper phân trang điểm theo lớp, truy vấn bảng điểm, ba unit hồi quy và tài liệu tracking. Không đưa hồ sơ, điện thoại, bản sao DB hoặc script có dữ liệu cá nhân vào Git.
- **Migration/data impact:** không migration/RLS; giao dịch nhập đã commit sau dry-run và backup schema/data. Sửa ngày ghi danh kỹ thuật của 747 hồ sơ về mốc khai giảng có trong nguồn. Giữ nguyên tài khoản, vai trò, lớp, năm học và điểm danh cũ; báo cáo ghi rõ các mốc ghi danh cần xác nhận.
- **Đã test:** lint/typecheck/build đạt; `npm test` 2.031 pass / 24 skip, gồm ba regression phân trang. `npm run test:db` ở DB preview bị fixture trùng; chạy toàn bộ 59 file pgTAP trên database local riêng với schema/owner/ACL và seed tham chiếu nguyên bản: 1.512/1.512. Đối soát dữ liệu 21/21, đủ 18.659 ô khớp nguồn. Không chạy lại full E2E.
- **Giới hạn:** nguồn chỉ điểm danh Giáo lý; 25.095 dấu có ngày và 530 dấu ngày hỏng nằm trong báo cáo, chưa nhập native vì schema bắt buộc trạng thái Thánh lễ. Không tự đoán các ô trống, điểm mâu thuẫn, hồ sơ thiếu hoặc lịch dạy; không tạo ghi danh năm sau. Tổng kết DB lưu hai số lẻ, số gốc và công thức lưu trong ghi chú/báo cáo. Không publish điểm.
- **Phát hành / IMPORT-NH2025-RELEASE-20261014:** source `04c58fd` đã push main; Vercel success đúng SHA. Smoke công khai 360/1366: login 200, không overflow/pageerror, bảng điểm chưa đăng nhập chuyển về login. [Bằng chứng](docs/system-workflow-redesign/verification/evidence/import-nh2025-20261014/release.json). Chưa chạy authenticated CRUD production qua trình duyệt.
- **Next:** bổ sung dữ liệu còn thiếu theo báo cáo Excel 15 sheet ngoài repo; không coi toàn bộ năm học đã đủ dữ liệu.

### [2026-10-14] Codex — AUTO-RELEASE-POLICY-20261014 — quy tắc thường trực và phát hành bản UI
- **Làm được:** AGENTS §10, WORKLOG/D-55 và deployment runbook yêu cầu tự kiểm tra, commit, push và xác minh production sau mỗi task sửa code; không hỏi lại trừ user yêu cầu riêng chưa phát hành. Đã commit/push bản sửa UI `c94386354fa7f24cff0615a0d5f9aa52c50515b7`, Vercel success đúng SHA.
- **File thay đổi:** AGENTS, WORKLOG, runbook, tài liệu tracking/báo cáo và bằng chứng release; không sửa thêm source sản phẩm ở task này.
- **Migration/data impact:** không có; không đổi mật khẩu, seed hoặc submit dữ liệu production.
- **Đã test:** bản UI đã có lint/typecheck/build đạt, 2.028 unit pass / 24 skip, 55 browser pass / 2 skip. Smoke production riêng 360/1366 HTTP 200, CSS bố cục sinh nhật mới, không overflow/pageerror; dashboard chưa đăng nhập chuyển về login. `git diff --check` đạt.
- **Quyết định mới:** yêu cầu trực tiếp của user 14/10 biến việc tự phát hành từ “được phép” thành bắt buộc sau task sửa code hoàn tất. Chỉ stage file thuộc task; giữ nguyên năm file `nav-*.json` có sẵn ngoài task.
- **Next:** người dùng xem production; task sau tiếp tục áp quy tắc tự phát hành. Backlog/giới hạn cũ giữ nguyên.

### [2026-10-14] Codex — MOBILE-NAV-GROUPS-20261014 — sửa theo ba ảnh phản hồi
- **Làm được:** bỏ khối Tất cả chức năng khỏi dashboard; sinh nhật/bổn mạng luôn xếp ngày dưới tên ở mobile, hai cột từ 640px; chia menu thành danh mục sau khi lọc quyền, tìm kiếm theo tên/nhóm. Desktop mở cùng danh mục trong dialog, giữ fallback no-JS đóng mặc định.
- **File thay đổi:** 8 file sản phẩm dashboard/shell/navigation, 2 file E2E, tracking và [báo cáo/ảnh](docs/system-workflow-redesign/MOBILE_NAV_GROUPS_2026-10-14.md).
- **Migration/data impact:** không migration/RLS/API/dependency; không ghi dữ liệu nghiệp vụ. Browser dùng tài khoản local, hình học sinh nhật dùng fixture tên giả trong DOM.
- **Đã test:** lint/typecheck/build đạt; 2.028 unit pass / 24 skip; Playwright cuối 55 pass / 2 skip có chủ đích, 14 role × ba viewport + geometry 12 độ rộng và 0/1/5/20/100 dòng. Lượt đầu 39 pass / 16 fail / 2 skip do hai lỗi harness, đã sửa và chạy lại toàn nhóm; không cộng lượt cũ vào lượt cuối.
- **Quyết định mới:** yêu cầu người dùng 14/10 bỏ danh mục khỏi trang chủ và khôi phục nhóm chức năng; quyền và nghiệp vụ giữ nguyên.
- **Phát hành:** source `c943863` đã push main; Vercel và smoke production đạt theo AUTO-RELEASE-POLICY-20261014. R5–R13/UX-42/R13.3 giữ backlog riêng.

### [2026-10-14] Codex — MOBILE-SHEETS-RELEASE-20261014 — xác nhận production
- **Làm được:** source `4bb4d42` đã push `main`; Vercel success đúng SHA; kiểm tra URL công khai ở 360/1366px đạt. CSS mobile mới đã được phục vụ; login HTTP 200, không overflow/pageerror, dashboard chưa đăng nhập chuyển về login.
- **File thay đổi:** hồ sơ release, WORKLOG, ba tài liệu tracking và lưu trữ nhật ký; không thay source sản phẩm trong commit release.
- **Migration/data impact:** không có. KHANG.NHO giữ mật khẩu hiện có; không chạy form ghi dữ liệu production.
- **Đã test:** source đã đạt lint/typecheck/build, 2.028 unit / 24 skip; browser 74 pass / 28 skip có chủ đích, refinement 9/9. Smoke production riêng như trên; không khẳng định full E2E hay authenticated production CRUD đã đạt.
- **Next:** người dùng xem và phản hồi qua preview 3150 đang mở. Backlog và giới hạn kiểm tra giữ nguyên trong báo cáo.

Các entry cũ hơn: [bản lưu trước mobile](docs/worklog-archive-before-mobile-2026-10-14.md) · [bản lưu trước anti-AI](docs/worklog-archive-before-anti-ai-2026-10-14.md) · [bản lưu trước R4 cuối](docs/worklog-archive-before-r4-final-2026-10-13.md).

Archive: [MOBILE-NAV-GROUPS-20261014](docs/worklog-archive-before-nav-groups-2026-10-14.md).

Archive: [Trước IMPORT-NH2025-20261014](docs/worklog-archive-before-import-2026-10-14.md).

Archive: [Trước RESTORE-LUCE-LOADING-20261014](docs/worklog-archive-before-luce-2026-10-14.md).

Archive: [Trước DETAIL-NAV-AFFORDANCE-20261014](docs/worklog-archive-before-detail-nav-2026-10-14.md).
