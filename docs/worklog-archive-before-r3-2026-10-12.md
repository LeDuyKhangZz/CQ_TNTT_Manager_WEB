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

- **R2 — DONE — Codex — 2026-10-12.** Hoàn thành 13/13 task; QA-01–08 được reviewer kiểm lại.
- Unit 1.936 pass / 24 skip; harness 112/112; navigation 80/80; year view 78/78 và JWT thật.
- Database sạch 1.512/1.512; E2E cuối 593 pass / 4 lỗi proxy fixture, chạy lại 9/9 đạt (không phải một lượt 597/597 xanh).
- Migration chỉ áp local, không đổi RLS. Chưa deploy, chưa bắt đầu R3.

## ➡️ VIỆC TIẾP THEO

Đã dừng sau R2. Phase kế tiếp là R3 Shell & Navigation; chưa claim/chưa mở R3 trong phiên này.

Nguồn hiện tại: [báo cáo R2](../REDESIGN/16_R2_COMPLETION_2026-10-12.md), [STATE](../REDESIGN/STATE.md). Backlog Giai đoạn 3/production giữ trong [WORKLOG lịch sử](docs/worklog-archive-before-r2-completion-2026-10-12.md) và `docs/system-workflow-redesign/verification/`; R2 không tự đóng các nợ đó.

## ⛔ BLOCKERS

Không còn blocker triển khai R2. Bốn lỗi E2E cuối trùng request fixture 502 proxy local; chạy lại 9/9 đạt. Chưa có một lượt 597/597 xanh liên tục, R13.3 vẫn mở. Log/artifact trước sửa được giữ nguyên; không đóng backlog production ngoài phạm vi.

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

### [2026-08-19] Phiên 74 — Claude — `STAFF-COMP-001` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án đang dán khối §4.3 của `NHAP_LIEU_HANG_LOAT.md` thì hỏi: *"về phần trợ tá là
  1 vai trò mới hình như không có trong hệ thống thì hệ thống hiện tại xử lí sao với người này?"*,
  rồi *"họ là trợ tá, không phải giáo lí viên, họ thường là phụ huynh của 1 hoặc nhiều em thiếu nhi
  trong giáo xứ, họ thường hỗ trợ, làm đồ ăn sáng cho thiếu nhi, không liên quan gì đến việc dạy học
  như glv"*, và cuối cùng: *"vậy bạn ko sửa code gì à? vì họ là trợ tá ko phải giáo lí viên thì sao
  vai trò lại có thể nhập là glv lớp được hay mã sao có thể giống mng là GLVXXX được"*.
- **Đã hỏi lại trước khi code** — bốn mức, chủ dự án chọn **"Thêm cột + đổi mã thành TT001"**
  (mức 2/4). Mức 1 (chỉ thêm cột) và mức 4 (không nhập trợ tá) bị loại.
- **Đo trước khi sửa, không đoán:** `app_role` có 14 giá trị, **không** giá trị nào là Trợ tá;
  `class_staff_capacity` chỉ có `representative|member|trainee`; `staff_code` sinh từ
  `('GLV' || lpad(nextval(staff_code_seq),3,'0'))` và bị `staff_profiles_code_format` chốt
  `^GLV[0-9]{3,}$`. Riêng `NormalizedStaffRow.component` **đã tồn tại từ IMP-BULK-001** — đọc đúng
  cột `Thành phần` rồi bỏ, vì không có cột nào để ghi.
- **Làm được:**
  1. **`staff_component`** — enum 7 giá trị (`huynh_truong` · `du_truong` · `nu_tu` · `chung_sinh` ·
     `linh_muc` · `tro_ta` · `khac`) + cột `staff_profiles.component not null default 'khac'`.
     Mặc định cố ý là `khac` ("Chưa phân loại"), **không** phải `huynh_truong`: đoán bừa ở cột sinh
     ra để nói đúng về một người là biến nó thành chỗ nói sai có hệ thống.
  2. **Mã hồ sơ theo thành phần.** Bỏ DEFAULT của `staff_code`, thay bằng trigger
     `app.assign_staff_code()` (BEFORE INSERT): `tro_ta` ⇒ `TT` + `assistant_code_seq`, còn lại ⇒
     `GLV` + `staff_code_seq`. **Sequence riêng** để hai dãy mã không đục lỗ của nhau. CHECK nới
     đúng hai tiền tố (`^(GLV|TT)[0-9]{3,}$`), không nới thành "chữ gì cũng được" — dạng mã là thứ
     `deriveLoginAlias` dựa vào để phân biệt nhân sự với tài khoản thường.
     🔴 **Không có trigger UPDATE**: đổi `component` KHÔNG đánh lại mã (mã = tên đăng nhập).
  3. **Backfill trong migration — chỉ chỗ dữ liệu tự nói ra:** `title='so'` ⇒ `nu_tu`, `'cha'` ⇒
     `linh_muc`, `'thay'` ⇒ `chung_sinh`, phân công đang hoạt động `capacity='trainee'` ⇒
     `du_truong`. Còn lại để `khac`.
  4. **Tầng ứng dụng:** `parseStaffComponent()` (khớp theo *chứa chữ* vì ô trong sổ là văn bản gõ
     tay: "Huynh trưởng/ Phó ngành Ấu", "Sổ DỰ TRƯỞNG 1") · ghi vào cả đường tạo tay lẫn đường dán
     hàng loạt · lượt dán **nâng `khac` lên giá trị thật** và **đếm riêng** (`componentUpdated`) vì
     nó sửa hồ sơ đã có · thẻ "Thành phần" trên `/staff` và `/staff/[id]` · ô chọn ở form tạo và
     form sửa · nhãn thành phần vào chuỗi tìm kiếm (gõ "trợ tá" ra đủ cả ban — màn hình không có ô
     lọc theo thành phần) · `deriveLoginAlias` nhận thêm tiền tố `TT`.
- **File thay đổi:** `supabase/migrations/20260819000200_staff_component_and_assistant_code.sql` ·
  `supabase/tests/057_staff_component_and_code_test.sql` · `src/types/database.ts` ·
  `staff/bulk/parse.ts` · `staff/bulk/server/actions.ts` · `staff/bulk/components/staff-bulk-form.tsx` ·
  `staff/staff-directory.ts` · `staff/server/queries.ts` · `staff/server/actions.ts` ·
  `staff/schemas.ts` · `staff/create-form-state.ts` · `staff/components/staff-create-form.tsx` ·
  `staff/components/staff-profile-editor.tsx` · `app/(dashboard)/staff/page.tsx` ·
  `app/(dashboard)/staff/[staffId]/page.tsx` · `auth/aliases.ts` · 3 file test ·
  `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md` (§4 và §4.3).
- **Migration/data impact:** 1 migration. Trên production: enum + cột + sequence + trigger + CHECK
  mới, và backfill chạm **55/112** hồ sơ (14 `nu_tu` · 2 `chung_sinh` · 1 `linh_muc` · 38
  `du_truong`). **0 mã hồ sơ bị đánh lại.** Dump schema + data trước khi push, để ở
  `CQ_TNTT_Manager/backups/2026-08-19_pre-STAFF-COMP-001_{schema,data}.sql`.
- **Đã test (số thật):**
  - `npx supabase db reset` → 66 migration áp sạch, không lỗi.
  - `npx supabase test db` → **57 file / 1481 test — PASS** (mới: `057_...` 16 test — cấp mã theo
    thành phần, mã đặt tay không bị ghi đè, đổi thành phần không đổi mã, CHECK chặn tiền tố lạ).
  - `npm run typecheck` → sạch. `npm run lint` → *No ESLint warnings or errors*.
  - `npm test` → **123 file / 1736 pass · 24 skip · 0 fail** (mới: 8 bài `parseStaffComponent` +
    3 bài thành phần trong `staff-directory`).
  - `npm run build` → xanh.
  - `supabase migration list` sau khi push: `20260819000200` có ở **cả local lẫn remote**. Truy vấn
    thẳng production xác nhận CHECK mới là `^(GLV|TT)[0-9]{3,}$` và trigger
    `staff_profiles_assign_code` đang gắn trên bảng.
- **Quyết định mới:** (a) **KHÔNG thêm vai trò `Trợ tá` vào `app_role`** — Ban Trợ tá không cấp tài
  khoản, nên thêm một giá trị `app_role` là kéo theo khai quyền ở RLS của mọi bảng cho một nhóm
  không đăng nhập. (b) **Mã cấp một lần, không đổi theo `component`.** (c) Lượt dán chỉ **nâng**
  `khac` lên giá trị thật, không bao giờ ghi đè thành phần đã có — nếu không thì mỗi lần dán lại
  khối cũ sẽ xoá tay sửa của quản trị viên.
- **Blocker/rủi ro:** 57 hồ sơ nhập **trước** migration vẫn là `khac` (xem `BLOCKERS`).
- **Next action:** chủ dự án dán §4.3 (16 Trợ tá ⇒ `TT001`–`TT016`), rồi xử nốt 57 hồ sơ `khac`.

### [2026-08-19] Phiên 73 — Claude — `IMP-BULK-002` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án đọc `NHAP_LIEU_HANG_LOAT.md` của phiên 72 rồi ra ba lệnh: (1) *"module nhập
  hàng loạt chỉ có admin được làm, và chỉ xuất hiện ở trang admin"*; (2) *"nhân sự thiếu thông tin
  thì kệ, vẫn cho nhập, không bị lỗi — ai thiếu thì khi có tài khoản cá nhân hệ thống báo và họ tự
  nhập lại đầy đủ"*; (3) *"hướng dẫn kĩ càng trình tự nhập: ai trước, nhập ở đâu"*. Kèm một thắc
  mắc phải trả lời trước khi làm: *"thư mục `NH_2025-2026` toàn dữ liệu năm cũ thì sao lại nhập
  2026-2027?"*. **Đã hỏi lại phạm vi của lệnh (2)** — nới cho *cả nhân sự lẫn thiếu nhi*; chủ dự án
  chọn phương án rộng.
- **Trả lời thắc mắc (đã đo, không đoán):** khối thiếu nhi và khối dự trưởng lấy từ
  `DANH SÁCH LÊN LỚP NH 2026-2027/` — đếm lại từng workbook: **593 em / 18 lớp** và **32 dự
  trưởng**, khớp đúng con số của bản cũ. Chỗ **thật sự** là dữ liệu năm cũ chỉ có **phân công huynh
  trưởng** (`danh_sach_xu_doan_2025_2026.xlsx`) và các cột sơ yếu lý lịch tra thêm từ sheet `SYLL`.
  Bản 2 của file MD ghi nguồn của **từng** khối thành một bảng ở §1.
- **Làm được:**
  1. 🔴 **Quyền thu về đúng một người, ở CẢ BA tầng.** `ROUTE_RULES` (`/imports` + `/staff/bulk`) ·
     `IMPORT_ROLES` · và policy của `import_batches`/`import_rows` đổi từ `app.can_global_write()`
     sang `app.is_super_admin()`; hai RPC `commit_import_rows` + `confirm_import_duplicate` đổi theo
     (chúng `security definer` nên hàng rào bên trong là hàng rào duy nhất). Hai mục điều hướng bị
     **gỡ hẳn**, thay bằng thẻ ở `/admin`; `getPageTitle` + breadcrumb có bảng tra riêng nên
     `/imports` không rơi về tên ứng dụng và `/staff/bulk` không mượn nhãn của `/staff`.
     ⚠️ **Phạm vi cố ý hẹp:** KHÔNG siết `students`/`guardians`/`staff_profiles` — ba vai trò kia
     vẫn tạo/sửa từng hồ sơ ở màn hình thường.
  2. 🔴 **Năm cột NOT NULL được nới**, và mỗi cột là một nhóm người có thật:
     `staff_profiles.phone` (46 người, cả Ban Trợ tá) · `guardians.phone` (sổ có tên cha/mẹ mà
     không có số) · `students.gender` (sổ SYLL **không có cột này**) · `students.date_of_birth` +
     `students.guardian_id` (229/593 em chỉ có tên). Hàng rào **giữ lại**: thiếu họ tên · lớp không
     khớp · ngày sinh ở tương lai · D-133 trùng chắc chắn — ba cái đầu là dữ liệu *hỏng*, cái cuối
     là chỗ máy không được quyết thay người.
  3. 🔴 **Mức dò trùng thứ tư**, sinh ra bởi chính việc nới trên: ba mức cũ đều tựa vào ngày sinh
     hoặc SĐT phụ huynh, nên một em **chỉ có tên** thì không mức nào bắt được — dán lại khối ấy lần
     hai là đẻ ra hồ sơ thứ hai trong im lặng. Nay trùng khít họ tên **khi cả hai bên đều trống cả
     hai điểm tựa** ⇒ mức `low`. `findInFileDuplicates` cũng thôi bỏ qua dòng trống ngày sinh.
  4. **Đường tự bổ sung hồ sơ** — nửa sau của lời hứa ở lệnh (2). `/account` có khối *"Thông tin
     liên lạc của bạn"* nói thẳng còn thiếu gì; policy `staff_profiles_update_self` cho ghi **đúng
     bốn cột** trên hàng của chính mình, trigger `app.guard_staff_self_update` chặn phần còn lại.
     🔴 Trigger này **không được** `security definer`: trong một hàm definer, `current_user` là chủ
     sở hữu hàm nên phép so `current_user <> 'authenticated'` luôn đúng và hàng rào thành một câu
     `return new` vô nghĩa — đo được bằng bài 20/21 của pgTAP `056` (*"caught: no exception"*).
  5. **`v_incomplete_student_profiles`** thêm `missing_gender` · `missing_date_of_birth` ·
     `missing_guardian`. `missing_guardian` đọc `student.guardian_id` chứ **không** đọc
     `guardian.id` sau LEFT JOIN — GLV lớp không đọc được bảng `guardians`, nên join trả NULL vì
     **thiếu quyền** chứ không phải **thiếu dữ liệu**.
  6. **`NHAP_LIEU_HANG_LOAT.md` — bản 2.** Giữ nguyên mọi dòng bản 1 đã rà tay, **bổ sung** những
     người bị loại: 593 thiếu nhi (+229) và 128 nhân sự (+46, gồm cả 16 trợ tá mà bản 1 để bảng
     rỗng). Thêm §0 (ai làm, vào đâu), §1 (nguồn từng khối), §2 (bảng luật cũ/mới), §3 (7 bước +
     hai quy trình từng-bước), §6 (ai còn thiếu gì, ai điền). 🔴 **Sửa một lỗi của bản 1:** 12 dự
     trưởng đứng ở **cả hai** khối, mà `class_staff_one_active_class_per_staff_idx` chỉ cho **một
     lớp đang hoạt động một người** ⇒ lượt dán thứ hai sẽ báo lỗi phân công đúng 12 dòng ấy.
     🔴 **Và một cái bẫy trong sổ gốc:** cột mang tiêu đề `SỐ ĐTHOẠI` của sổ chia lớp **bị xáo** —
     35/58 người mang số của người khác; cột cuối mới là số đúng (khớp 55/58 với bản đã rà tay).
     28 người mới thêm được đánh dấu riêng để chủ dự án đối chiếu lại.
- **File thay đổi:** `supabase/migrations/20260819000100_bulk_import_admin_only_and_partial_profiles.sql`
  (mới) · `supabase/tests/056_bulk_import_admin_only_test.sql` (mới) ·
  `supabase/tests/{006,011,039,040,054}*` · `src/lib/permissions/route-map.ts` ·
  `src/config/navigation.ts` · `src/app/(dashboard)/{admin,account,staff,students}/**` ·
  `src/features/imports/{build-row,dedup,import-feedback}.ts` ·
  `src/features/imports/server/{actions,permissions,queries}.ts` ·
  `src/features/imports/components/batch-row-editor.tsx` ·
  `src/features/staff/{profile-completeness.ts,components/own-contact-form.tsx}` (mới) ·
  `src/features/staff/{schemas,staff-directory,staff-duplicates}.ts` ·
  `src/features/staff/server/{actions,queries}.ts` · `src/features/staff/bulk/{parse.ts,server/actions.ts}` ·
  `src/features/students/**` · `src/features/guardians/**` ·
  `src/features/auth/{server/{actions,queries}.ts,components/account-admin-panel.tsx}` ·
  `src/lib/students/duplicate.ts` · `src/lib/dates/index.ts` · `src/types/database.ts` ·
  `docs/{02,05,09}` · `tests/unit/*` · `tests/e2e/{imports,authenticated-shell,responsive}.spec.ts` ·
  `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md`.
- **Migration/data impact:** **1 migration** — 6 policy đổi vai trò (`import_batches` ×3,
  `import_rows` ×3) · 2 RPC + 1 wrapper viết lại · 5 cột `drop not null` + 2 CHECK dựng lại ·
  1 view mở rộng · 1 policy + 1 trigger mới trên `staff_profiles`. **0 backfill · 0 dòng dữ liệu bị
  đụng · 0 quyền ghi mới cho `authenticated`** (chỉ SIẾT, trừ đúng một đường tự-sửa-hồ-sơ-mình).
- **Đã test (số thật):** `npm run test:db` → **1465/1465** trên **56 file** (trước 1385/55; file mới
  `056` **22 bài**, dùng JWT thật của Super Admin · Thư ký · GLV lớp) · `npm test` →
  **1726 pass / 24 skip** (123 file) · `npm run lint` → **0 warning 0 error** · `npm run typecheck`
  → ✓ · `npm run build` → ✓ · E2E `imports.spec.ts` + `authenticated-shell.spec.ts` trên
  `laptop-1366` → **exit 0** (DB vừa `db:reset` + `seed:dev`).
  🔴 **Khối dán được kiểm bằng CHÍNH parser của web**, đúng cách phiên 72 đã làm: 18 khối thiếu nhi
  → `parsePastedText` + `buildRow` = **593/593 dòng, 0 lỗi chặn ghi**; 3 khối nhân sự →
  `parseStaffText` = **128/128 dòng, 0 lỗi**. (Bản 1: 25 dòng nhân sự lỗi, và 229 em không có mặt.)
- **Quyết định mới:**
  - Nhập hàng loạt = **riêng Super Admin**, và chỉ hiện ở `/admin` (thay luật bốn vai trò của
    IMP-BULK-001).
  - Thiếu thông tin **không chặn**; chặn chỉ còn dành cho dữ liệu *hỏng* và cho quyết định trùng.
  - Người thiếu thông tin **tự bổ sung** ở `/account` — nhân sự làm được vì họ đăng nhập bằng
    `staff_code`, phụ huynh thì không (tên đăng nhập của họ chính là số điện thoại).
- **Blocker/rủi ro:**
  1. 🔴 **Hệ quả kèm theo của lệnh (1): hàng rào "năm học đã đóng" không còn áp cho đường nhập.**
     D-117 cho Super Admin ghi vào **mọi** năm học, mà nay người nhập duy nhất chính là Super Admin.
     Trước đợt này một Thư ký nhập vào năm đã đóng bị `YEAR_NOT_WRITABLE` chặn. Không phải lỗ hổng
     mới (D-117 có từ `20260726000200`), nhưng là **một tấm lưới đã mất** — đã ghi thành hai bài
     kiểm trong `054` thay vì xoá đi trong im lặng. Muốn giữ lưới thì phải chốt một luật mới.
  2. ⚠️ **Số điện thoại của 28 nhân sự mới thêm chưa được đối chiếu tay** — nguồn là cột cuối của
     một sheet đã biết là có cột bị xáo. Đã liệt kê riêng trong `<details>` ở §4.1 của file MD.
  3. ⚠️ **E2E chỉ chạy 2 spec trên 1 viewport**, không chạy đủ ba viewport (nợ #10/#15 vẫn ở đó).
  4. ⚠️ **`/staff/bulk` vẫn chưa có spec E2E riêng** — nợ mở từ phiên 72, chưa trả.
  5. ⚠️ Sổ lớp **Thiếu 3 ghi Lê Quốc Phương Trang hai lần**; đã ghi chú ngay trong khối §5.13 để
     người nhập chọn *Bỏ qua* một dòng.
- **Next action:** đẩy migration `20260819000100` lên production (dump trước), rồi quay lại việc của
  2B — **M11-B** như phiên 72 đã ghi.


### [2026-08-18] Phiên 72 — Claude — `IMP-BULK-001` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án hỏi *"nhập liệu từ đâu, theo thứ tự nào"* + *"có cách nhập hàng loạt không"*
  + *"tạo năm học cũ 2025-2026"*, kèm thư mục `NH_2025-2026/` (~40 file Excel). Đọc **toàn bộ**
  các file ấy rồi mở đường nhập cho chúng.
- **Làm được:**
  1. 🔴 **Import chọn được NĂM HỌC ĐÍCH.** `createDryRunBatch` trước đây khoá cứng vào năm
     `current`, nên sổ của một năm đã qua **không có đường nào** vào hệ thống — mà đưa năm cũ về
     `current` để nhập rồi đổi lại là thao tác nguy hiểm (chỉ MỘT năm được `current`, mọi màn hình
     khác đọc theo nó). Nay chọn trong `draft` + `current`; `resolveTargetYear` tra lại năm ở máy
     chủ chứ không tin biểu mẫu, và hàng rào thật vẫn là
     `import_batches_insert_global_write` (`writable_academic_year_ids`) — không cấp quyền mới nào.
  2. **Đường DÁN VĂN BẢN** (`paste.ts` + `createPasteBatch`). Khối dán đi qua **đúng** pipeline của
     đường tải file — dry-run → duyệt → ghi — vì `stageParsedRows` được tách ra dùng chung; hai
     đường chỉ khác khâu đọc ô. Nhờ vậy trần số dòng, dò trùng, D-133, chặn thiếu giới tính áp dụng
     y nguyên mà không phải nhắc lại. Nhận TAB (chép từ Excel) lẫn `|` (bảng Markdown).
  3. **`/staff/bulk` — nhập hàng loạt nhân sự + phân công lớp.** Đây là khoảng trống lớn nhất còn
     lại: `createStaff` và `assignStaffToClass` đều **một người một lượt**, trong khi xứ đoàn có ~90
     nhân sự và mỗi năm phân công lại toàn bộ. Cố ý **không** dựng bảng tạm (luồng này không có khâu
     duyệt nhiều lượt như thiếu nhi): hai pha *xem trước → ghi* đều đọc lại chính khối văn bản đang
     hiện. Hồ sơ và phân công **báo cáo tách nhau** — tạo được hồ sơ mà lớp đã có đại diện thì không
     phải một lượt hỏng, gọi là lỗi rồi bắt nhập lại sẽ sinh hồ sơ trùng (khuôn `enrollmentSkipped`
     của TO-BE 6).
  4. **Năm học 2025-2026 + 19 lớp đã tạo trên production** (`draft`; 2026-2027 giữ `current`).
     `generate_default_classes` không gọi được qua psql (nó đòi `app.is_super_admin()` mà
     `auth.uid()` của phiên psql là null) nên chép đúng thân hàm ấy bằng SQL.
  5. **`NH_2025-2026/NHAP_LIEU_HANG_LOAT.md`** — trích toàn bộ Excel thành khối dán sẵn kèm phân
     tích thiếu/đủ: **364/593** thiếu nhi và **81/87** nhân sự đủ điều kiện nhập ngay.
- **File thay đổi:** `supabase/migrations/20260818000100_import_paste_source.sql` (mới) ·
  `src/features/imports/{paste.ts,parse.ts}` · `src/features/imports/server/{actions,queries}.ts` ·
  `src/features/imports/components/{import-target-fields,import-paste-form,import-upload-form}.tsx` ·
  `src/app/(dashboard)/imports/page.tsx` · `src/features/staff/bulk/**` (mới: `parse.ts`,
  `messages.ts`, `server/actions.ts`, `components/staff-bulk-form.tsx`) ·
  `src/app/(dashboard)/staff/bulk/page.tsx` (mới) · `src/lib/permissions/route-map.ts` ·
  `src/config/navigation.ts` · `tests/unit/{import-paste,staff-bulk-parse}.test.ts` (mới) ·
  `tests/unit/{import-upload-form,permissions}.test.ts` · `WORKLOG.md`.
- **Migration/data impact:** **1 migration** — nới `check` của `import_batches.source_format` cho
  giá trị `'paste'`. **0 `alter table` khác · 0 đổi policy · 0 đổi RLS · 0 quyền mới cho
  `authenticated` · 0 backfill.** Dữ liệu production: **+1 năm học (`draft`) + 19 lớp**, không đụng
  bản ghi nào đã có (lúc thao tác: 0 thiếu nhi, 0 nhân sự, 0 ghi danh).
- **Đã test (số thật):** `npm test` → **1710 pass / 24 skip** (trước 1709/24 — **+27** bài mới, trừ
  các bài scratch đã xoá) · `npm run lint` → **0 warning** · `npm run typecheck` → ✓ ·
  `npm run build` → ✓ **30/30 trang** (thêm `/staff/bulk`) · production: `migration list` xác nhận
  `20260818000100` đã áp, `pg_get_constraintdef` xác nhận `'paste'` được nhận.
  🔴 **Kiểm chứng bằng chính parser của web, không phải bằng mắt:** toàn bộ khối dán trong file MD
  vừa sinh được cho chạy qua `parsePastedText` + `buildRow` → **746/746 dòng thiếu nhi, 0 lỗi chặn
  ghi**; nhân sự 119 dòng, 25 lỗi và cả 25 đều nằm đúng trong hai khối *"thiếu số điện thoại"* được
  đánh dấu cố ý. Lượt chạy đầu bắt được **3 lỗi thật**: một cột `STT` thừa làm lệch mọi chỉ số cột
  của sổ Nghĩa 2, một sheet **tên là `SYLL` nhưng thật ra là sổ danh sách** (ô dưới tiêu đề "Ngày
  tháng năm sinh" chứa tên lớp cũ, làm rơi nguyên lớp Hiệp 1), và một ngày sinh ở tương lai.
  **KHÔNG chạy được `npm run test:db`** — Docker Desktop không chạy trên máy này (xem rủi ro 1).
- **Blocker/rủi ro:**
  1. ⚠️ **Chưa có pgTAP cho migration này.** Docker tắt nên không `db:reset` được. Rủi ro thấp một
     cách có chủ ý: migration **chỉ nới một `check` constraint**, không đụng policy/hàm/cột nào.
     Vẫn nên chạy lại `npm run test:db` khi Docker sống lại.
  2. ⚠️ **`/staff/bulk` chưa có E2E.** Đường ghi của nó là `insert` thẳng qua RLS sẵn có
     (`staff_profiles_insert_global_write`, `class_staff_assignments_insert_global_write`), không
     RPC mới — nhưng luồng hai pha *xem trước → ghi* thì chưa có bài nào chạy trên trình duyệt thật.
  3. 🔴 **Nhập cả hai năm học bằng đường Excel sẽ đụng tường D-133.** Trùng cả tên + ngày sinh + SĐT
     phụ huynh là mức `high` ⇒ phải xác nhận **từng dòng**. Với ~600 em là ~600 cú bấm. Đường đúng
     là `/promotions`. Đã ghi rõ ở §0 của file `NHAP_LIEU_HANG_LOAT.md`.
  4. ⚠️ **Sổ giáo xứ không có cột giới tính** mà `students.gender` là `not null` ⇒ phần lớn dòng
     phải chọn Nam/Nữ ở màn hình duyệt (có nút áp hàng loạt cho các dòng đang tick). Hệ thống **cố ý
     không đoán theo tên** — không đổi điều đó.
  5. ⚠️ **Hai lớp Dự Trưởng 1/2 của sổ 2026-2027 không khớp cấu trúc**: hệ thống chỉ cho **một** lớp
     Dự trưởng mỗi năm (`classes_one_trainee_per_year_idx`). Đang gộp 32 người vào một lớp.
  6. ⚠️ **Chưa có danh sách phân công huynh trưởng cho 2026-2027** — thư mục chỉ có sổ chia lớp
     2025-2026. Khối §2.1 dùng phân công cũ, phải sửa cột `Lớp` trước khi dán.
- **Next action:** quay lại **M11-B** (D-170 · D-171 · D-172 + AC-B09) — việc của 2B không đổi.

Các entry cũ hơn và trạng thái dài đã lưu nguyên trong [bản lưu trữ](docs/worklog-archive-before-r2-completion-2026-10-12.md).
