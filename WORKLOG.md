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

- **IMPORT-NH2025-20261014 — dữ liệu đã nhập; code đã kiểm tra, chờ phát hành — Codex — 2026-10-14.** Đọc 53 tệp; 758 thiếu nhi (+11), 18.659 ô điểm, 6 Trưởng Ban, 39 địa chỉ nhân sự bổ sung; đối soát 21/21 đạt.
- **2.031 unit đạt / 24 skip**, lint/typecheck/build đạt; pgTAP trên database local riêng **1.512/1.512**. Sửa truy vấn bảng điểm để đọc đủ hơn 1.000 ô, giữ client có xác thực và lọc lớp.
- Giữ tổng kết Excel theo xác nhận của user; các cột thành phần lưu ẩn để tránh cộng trùng. 25.095 dấu Giáo lý chưa nhập native do thiếu trạng thái Thánh lễ; 530 dấu chưa rõ ngày và bốn tổng kết thiếu/mâu thuẫn được báo riêng.
- Không migration/RLS, không đổi tài khoản/quyền; dữ liệu cá nhân, bản sao trước nhập và báo cáo Excel chỉ nằm ngoài Git. Full E2E lịch sử và R5–R13/UX-42/R13.3 giữ backlog riêng.
- MOBILE-NAV-GROUPS-20261014 đã phát hành ở source `c943863`; quy tắc tự commit/push/kiểm tra production tiếp tục áp dụng theo AGENTS §10.

## ➡️ VIỆC TIẾP THEO

Phát hành bản sửa bảng điểm theo AGENTS §10 và kiểm tra đúng SHA. Người dùng bổ sung các trường hồ sơ, xác nhận điểm mâu thuẫn/ngày bị hỏng trong báo cáo Excel. Điểm danh Giáo lý cần mô hình lưu riêng khi không có dữ liệu Thánh lễ; chưa tự đổi schema trong lượt nhập này.

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

### [2026-10-14] Codex — IMPORT-NH2025-20261014 — nhập dữ liệu và tải đủ bảng điểm
- **Làm được:** đọc đủ 53 tệp nguồn; bổ sung 11 thiếu nhi, 3 giám hộ, 3 bí tích, 6 Trưởng Ban, 39 địa chỉ nhân sự; nhập 472 cột / 18.659 ô điểm và 181 ghi chú nội bộ. Có 754 tổng kết năm không mâu thuẫn; giữ kết quả Excel kể cả công thức tính ô trống theo xác nhận của user. Cột thành phần được lưu ẩn để không cộng trùng vào tổng kết.
- **File thay đổi:** helper phân trang điểm theo lớp, truy vấn bảng điểm, ba unit hồi quy và tài liệu tracking. Không đưa hồ sơ, điện thoại, bản sao DB hoặc script có dữ liệu cá nhân vào Git.
- **Migration/data impact:** không migration/RLS; giao dịch nhập đã commit sau dry-run và backup schema/data. Sửa ngày ghi danh kỹ thuật của 747 hồ sơ về mốc khai giảng có trong nguồn. Giữ nguyên tài khoản, vai trò, lớp, năm học và điểm danh cũ; báo cáo ghi rõ các mốc ghi danh cần xác nhận.
- **Đã test:** lint/typecheck/build đạt; `npm test` 2.031 pass / 24 skip, gồm ba regression phân trang. `npm run test:db` ở DB preview bị fixture trùng; chạy toàn bộ 59 file pgTAP trên database local riêng với schema/owner/ACL và seed tham chiếu nguyên bản: 1.512/1.512. Đối soát dữ liệu 21/21, đủ 18.659 ô khớp nguồn. Không chạy lại full E2E.
- **Giới hạn:** nguồn chỉ điểm danh Giáo lý; 25.095 dấu có ngày và 530 dấu ngày hỏng nằm trong báo cáo, chưa nhập native vì schema bắt buộc trạng thái Thánh lễ. Không tự đoán các ô trống, điểm mâu thuẫn, hồ sơ thiếu hoặc lịch dạy; không tạo ghi danh năm sau. Tổng kết DB lưu hai số lẻ, số gốc và công thức lưu trong ghi chú/báo cáo. Không publish điểm.
- **Next:** commit/push main theo AGENTS §10, đối chiếu Vercel SHA và smoke production; các mục còn thiếu được giao qua báo cáo Excel 15 sheet ngoài repo.

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

Các entry cũ hơn: [bản lưu trước mobile](docs/worklog-archive-before-mobile-2026-10-14.md) · [bản lưu trước anti-AI](docs/worklog-archive-before-anti-ai-2026-10-14.md) · [bản lưu trước R4 cuối](docs/worklog-archive-before-r4-final-2026-10-13.md).

Archive: [MOBILE-NAV-GROUPS-20261014](docs/worklog-archive-before-nav-groups-2026-10-14.md).

Archive: [Trước IMPORT-NH2025-20261014](docs/worklog-archive-before-import-2026-10-14.md).
