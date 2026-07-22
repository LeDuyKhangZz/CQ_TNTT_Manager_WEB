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
6. **KHÔNG ĐƯỢC:** ghi pass/done/verified/deployed khi chưa chạy thật; sửa test để che bug; tự đổi quyết định; commit secret; tự chạy git commit/push.

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

> Cập nhật: **2026-07-22** — Phase 7 đang chạy, T1..T5 xong

- **`P7-T1..P7-T5 — XONG — Claude — 2026-07-22`**; PWA + responsive QA, full regression,
  hiệu năng/RLS, privacy review, seed production. Chi tiết ở nhật ký Phiên 23.
- **`P7-T6/T7 — CHƯA LÀM`**; chờ user cấp Supabase production + Vercel (BLK-5/BLK-6).
- **`P6-T1..P6-T7 + Gate Phase 6 — XONG — Claude — 2026-07-22`**; fresh 547/547 pgTAP,
  lint/typecheck/build xanh và full E2E 63/63 trên 3 viewport.
- **BLK-4 đã gỡ**; user cấp `logo_TNTT_CHOQUAN.jpg`, icon PWA/favicon/sidebar dùng logo thật.

---

## ➡️ VIỆC TIẾP THEO

**`P7-T6 — Deploy Supabase/Vercel Hobby`** là task kế tiếp. P7-T1..T5 đã xong và có bằng chứng
chạy thật; T6/T7 chỉ chờ user tạo project thật (BLK-5) — cách lấy từng khóa đã ghi ở
docs/12 §4 và §5. Agent **không** tự tạo project, không tự đặt env trên Vercel, không commit
secret; user tự làm hai việc đó rồi báo lại URL để chạy smoke.

**Ghi chú bàn giao Phase 7 (đọc trước khi đụng vào PWA/hiệu năng/deploy):**
- **Service worker cố ý không cache HTML.** `public/sw.js` chỉ cache `/_next/static/`,
  `/icons/` và `offline.html`; điều hướng luôn ra mạng. Máy phòng học là máy dùng chung —
  một trang roster nằm lại trong cache là rò hồ sơ thiếu nhi cho người đăng nhập kế tiếp.
  `tests/unit/service-worker.test.ts` nạp thẳng file thật vào scope giả và bấm thử từng loại
  request; đổi quy tắc cache mà không sửa test là test sẽ đỏ.
- **Đổi PRECACHE hoặc quy tắc cache thì phải tăng `VERSION` trong `sw.js`**, nếu không máy
  đã cài vẫn giữ danh sách cũ.
- **`Button size="sm"` nay cao 44px, không phải 36px.** `sm` là nút *hẹp ngang*, không phải
  nút thấp. Đừng "trả lại cho gọn" — `tests/e2e/responsive.spec.ts` quét 15 route × 3 viewport
  và sẽ bắt lại ngay.
- **Ô tick đo vùng bấm theo `<label>` bao quanh**, không theo chính cái ô: ô tick gốc của
  trình duyệt luôn 16–20px. Label phải có `min-h-11`.
- **E2E nay chạy 1 worker, kể cả local.** Ba project viewport dùng chung **một** database;
  chạy 3 worker là ba phiên cùng ghi vào cùng lớp/giáo án/báo cáo. Spec Phase 4/6 rớt ngẫu
  nhiên vì vậy (đã tái hiện: 3 worker rớt 6/12, 1 worker xanh 12/12). Đừng nâng lại
  `workers` để cho nhanh — muốn nhanh thì phải cho mỗi project một database riêng.
- **Snapshot báo cáo kiểm theo `payload_json`/`checksum`, không theo kích thước file.**
  File Excel sinh lại từ payload mỗi lần tải và ExcelJS nhúng mốc thời gian, nên hai lần tải
  cùng một snapshot lệch nhau một byte là chuyện bình thường — cái phải bất biến là payload.
- **Nút thắt hiệu năng là cách đánh giá RLS, không phải index.** Index đã đủ cho mọi đường
  truy vấn thật. Policy SELECT phải viết `(select app.can_...())` để Postgres nâng lên
  InitPlan; gọi trần thì hàm chạy lại cho **từng dòng** (đo được: `guardians` 79,9 → 8,9 ms).
  Migration `20260724000100` sửa `guardians` + `profiles`; các bảng còn lại hiện đủ nhỏ.
- **`seed:dev` tuyệt đối không được chạy trên project thật** (mật khẩu chung `123456`).
  Production dùng `npm run seed:prod`, xem docs/12 §4b.
- **Chưa có CSP.** Next App Router cần nonce cho script bootstrap; thêm vội dễ làm trắng trang.
- `npm audit --omit=dev` còn 5 advisory (2 high) qua `next` → `sharp`/`postcss`; nhánh 15.x
  chưa có bản vá. Phơi nhiễm thấp (đã phân tích ở docs/08 P7-T4), không lên Next 16 ở Phase 7.

**Bằng chứng Gate Phase 6:** fresh `db:reset` áp sạch 5 migration Phase 6; pgTAP **547/547**
(`020..023` thêm 124 assertion bằng JWT thật); unit/integration **156/156** (9 gate Phase 2 skip
theo cờ); lint ✓ 0 warning; typecheck ✓; production build ✓; full E2E **63/63** trên ba viewport,
riêng Phase 6 **9/9**: Trưởng ban đăng nội dung và người ngoài Ban mở URL trực tiếp không thấy gì;
thành viên Ban Kỹ thuật mượn 2 trả 1 và tổng số giảm đúng; thông báo lớp tới đúng phụ huynh,
không tới GLV lớp khác, đánh dấu đã đọc theo từng người; báo cáo giữ đúng filter, chốt rồi tải
lại bản chốt nguyên vẹn sau khi dữ liệu nguồn bị xóa.

**Ghi chú bàn giao Phase 6 (đọc trước khi đụng vào Ban/thông báo/báo cáo):**
- **Mọi thao tác đổi tồn kho đi qua RPC.** `authenticated` không có INSERT/UPDATE trên
  `equipment_loans`, và trigger `app.validate_equipment_item` chặn sửa tay `available_quantity`
  (dựa vào biến phiên `app.equipment_rpc` mà chỉ hai RPC đặt). Đừng "dọn dẹp" trigger này.
- **`app.validate_committee_membership` phải là SECURITY DEFINER.** Trigger đếm số Ban đang
  hoạt động của nhân sự; chạy dưới RLS thì người chỉ thấy một Ban sẽ lách được giới hạn D-47.
  Bản đầu không phải definer và pgTAP bắt được ngay.
- **Danh sách deep-link hợp lệ nằm ở HAI nơi**: CHECK `notifications_link_known_route` trong
  migration `20260723000400` và `NOTIFICATION_LINK_ROUTES` ở
  `src/features/notifications/constants.ts`. `tests/unit/notification-schemas.test.ts` đọc thẳng
  file migration để canh hai bên khớp nhau — thêm route mới phải sửa cả hai.
- **`v_incomplete_student_profiles` dùng LEFT JOIN `guardians` có chủ ý.** GLV lớp không đọc được
  bảng `guardians` (policy `guardians_select_scope`), join thường làm view rỗng với đúng người cần
  dùng nó. Cờ thiếu SĐT chỉ bật khi người đọc thật sự thấy được guardian — nói "thiếu" trong khi
  chỉ là "không có quyền xem" thì tệ hơn im lặng.
- **Báo cáo chỉ có MỘT đường tính.** Xem trước, `/reports/export` và `createReportSnapshot` đều gọi
  `buildReport(filter)`; bộ lọc nằm trên URL nên link tải dùng lại chính chuỗi query (D-52). Đừng
  thêm đường tính thứ hai cho export.
- **Snapshot bất biến bằng cách không cấp quyền**, không phải bằng trigger chặn: `authenticated`
  chỉ có SELECT/INSERT trên `report_snapshots`. Checksum/generated_by/generated_at do trigger
  `app.seal_report_snapshot` đặt lại, giá trị client gửi lên bị bỏ.
- **Báo cáo kết quả học tập tính cho cả năm học**, khoảng ngày chỉ ràng buộc báo cáo chuyên cần.
  UI có ghi rõ; nếu sau này cần chia kỳ cho điểm thì phải quyết định cột mốc nào là nguồn.
- **`seed:dev` nay dựng sẵn chức vụ Ban**: GLV909 Trưởng Ban Sinh hoạt **và** thành viên Ban Kỹ
  thuật (đúng hai Ban), GLV910 Phó Ban Sinh hoạt, GLV912 Trưởng Ban Kỹ thuật, GLV905 cố vấn tối
  cao, cộng 2 thiết bị mẫu. GLV907 (Trưởng ngành Thiếu) cố ý **không** thuộc Ban nào để E2E kiểm
  được trạng thái rỗng và chặn URL trực tiếp.

**Nợ đã thấy, chưa làm (Phase 6):**
- Chưa dùng bucket `report-snapshots`: file Excel/PDF sinh lại từ `payload_json` khi tải, cột
  `file_path` để trống. Đủ cho yêu cầu "snapshot không đổi", nhưng docs/02 §15 vẫn liệt kê bucket.
- Chưa có trang quản trị Ban tập trung cho Super Admin (thêm/ngưng Ban làm ngay ở `/committees`).
- Thông báo chưa có phân trang; hộp thư giới hạn 50 dòng gần nhất.
- Chưa có báo cáo theo ngành dạng gộp nhiều lớp thành một dòng — hiện luôn liệt kê theo lớp.

**Bằng chứng Gate Phase 5:** fresh reset + pgTAP **423/423**; unit/integration **137/137**
(9 gate Phase 2 skip đúng theo cờ); lint/typecheck/build xanh; full E2E **54/54** trên ba viewport.
E2E Phase 5 dùng ba lớp độc lập và bấm thật toàn chuỗi điểm, comment, Top 5, export, lock/unlock,
promotion nguyên tử và portal ownership/published-only.

**Bằng chứng Gate Phase 4:** pgTAP `013..015` phủ 58 assertion JWT/RLS thật; full E2E **51/51**
trên ba viewport, trong đó chuỗi Phase 4 bấm thật representative CRUD/upload, class teacher tải
signed URL, guardian chỉ thấy safe week-ahead và representative gỡ sạch object vật lý.

**Bằng chứng Gate Phase 3:** pgTAP `012` phủ 67 assertion JWT thật; E2E hai browser context phủ
claim denial → lease expiry → takeover → old editor bị chặn và không ghi đè; E2E khóa bấm save
trên trang stale rồi xác nhận toàn bộ control bị disable; portal phụ huynh đọc bản finalized;
toàn bộ **48/48** test qua ba viewport. `perf:smoke` đo lớp Ấu 1A 60 em/30 buổi bằng JWT thật.

**Hạ tầng dùng lại cho mọi phiên sau:**
- `.env.local` đã tạo từ `npx supabase status` (cổng API **54421**, DB **54422**). File này bị
  gitignore, không commit. Không có nó thì `npm run seed:dev`/`perf:smoke`/`test:auth` không chạy.
- `npm run seed:dev` — dựng fixture docs/07 §14. **Chỉ chạy trên DB vừa reset**, script tự từ chối
  nếu `profiles` đã có dòng. Mật khẩu chung local: `123456` (đọc `DEV_PASSWORD` trong
  `scripts/seed-dev.mjs`; ghi chú cũ trong WORKLOG ghi sai giá trị này).
- Mã GLV của fixture **đặt tay dải GLV901–GLV913**, không lấy từ sequence: pgTAP tiêu thụ
  `staff_code_seq` nên mã sinh tự động đổi theo số lần chạy test và làm E2E gãy.
  GLV901 = Xứ đoàn trưởng (global write), GLV905 = Trưởng ngành Ấu, GLV910 = GLV lớp Ấu 1A kiêm
  phụ huynh (D-25), `84912000001` = phụ huynh; mã account thiếu nhi do sequence quyết định và
  được `seed:dev` in ra, E2E không hard-code mã này.
- `npm run perf:smoke` — bơm tối thiểu 900 em, bảo đảm Ấu 1A có 60 em, dựng 30 buổi rồi đo bằng JWT thật.
- Hai bộ gate cần cờ: `GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-*.test.ts`.
  Bộ import đọc `../Excel mẫu` **ngoài repo** và tự skip nếu thiếu.

**Trình tự tái lập trạng thái hiện tại:**
`npm run db:reset` → `npm run test:db` → `npm run seed:dev` → `npm run build && npm run test:e2e`.
Muốn có lại dữ liệu thật 405 em thì chạy thêm
`GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-import.test.ts` (đọc `../Excel mẫu`).

⚠️ **DB local hiện có 910 em tổng hợp và 30+ buổi perf** sau Gate Phase 3; không có 405 hồ sơ thật
từ sổ lớp. Muốn chạy pgTAP phải `npm run db:reset` trước. Dữ liệu gốc vẫn ở `../Excel mẫu` ngoài
repo và có thể import lại bằng lệnh Gate Phase 2 ở trên.

⚠️ pgTAP giả định DB sạch nên `npm run test:db` sẽ **đỏ** khi DB có dữ liệu nghiệp vụ. Luôn
`npm run db:reset` trước khi chạy `test:db`. Đó là hành vi đúng, không phải regression.

**Ghi chú bàn giao P3-T1..P3-T5 (đọc trước khi đụng vào điểm danh):**
- **Mọi thao tác ghi điểm danh đi qua RPC.** `authenticated` **không** có quyền INSERT/UPDATE trên
  `attendance_sessions`, `student_attendance_records`, `staff_attendance_records` — cố ý, không
  phải quên. Năm RPC: `claim_attendance_session`, `heartbeat_attendance_session`,
  `takeover_attendance_session`, `save_and_finalize_attendance`, `unlock_attendance_session`.
- **Ba bảng mang cột phi chuẩn hóa cho RLS** (`class_id`, `student_id`/`staff_profile_id`,
  `session_finalized_at`), do trigger điền và client không đặt được. Đây là hệ quả trực tiếp của
  bài học hiệu năng ở Gate Phase 2 — đừng "dọn dẹp" mấy cột này.
- **Chốt lại không đẩy lùi mốc khóa**: `finalized_at` giữ lần chốt đầu tiên. Nếu không thì bấm chốt
  lại là gia hạn vô hạn cửa sổ 3 ngày.
- **Sau khi Super Admin mở khóa, chỉ Super Admin sửa được** (cột `unlocked_at`). Chốt lại xóa cờ.
  Vì `finalized_at` giữ nguyên nên buổi khóa lại gần như ngay — đúng ý D-33.
- **Trưởng ngành không tự điểm danh mọi lớp trong ngành** (docs/05 §4.6): `app.can_edit_attendance`
  = GLV có phân công lớp đó, hoặc Super Admin. Trưởng ngành vẫn *xem* được cả ngành.
- **Đơn xin nghỉ không bao giờ tự sửa điểm danh.** Không có trigger nào nối hai bảng; đơn chỉ hiện
  lên trang điểm danh như gợi ý (WF-10 bước 6). Giáo lý viên **không hủy** được đơn của phụ huynh,
  chỉ ghi nhận; phụ huynh chỉ hủy được đơn còn đang chờ.
- **Thống kê chỉ đếm buổi ĐÃ CHỐT.** Buổi đang dở toàn `present` do seed, đưa vào sẽ thổi phồng
  tỷ lệ. Ngưỡng cảnh báo đọc từ `academic_years`, sửa trong `/admin` (D-58).
- **Bẫy đã gặp, đừng lặp lại:** `redirect()` về đúng đường đang đứng từ trong một Server Action làm
  Next trả payload rỗng và trang rơi vào error boundary. Trang `/parent/absence-requests` vì vậy
  dùng client component + `router.refresh()` (giống trang điểm danh) chứ không dùng
  `<form action={serverAction}>` — `revalidatePath` một mình **không** làm mới router phía client,
  phụ huynh gửi đơn xong không thấy đơn của mình.

**Nợ đã thấy, chưa làm (Phase 3):**
- Chưa có trang tổng hợp cảnh báo chuyên cần cho GLV/trưởng ngành: view đã có
  (`v_class_attendance_summary`), mới dùng ở portal phụ huynh và trang thiếu nhi.
- `absence_requests` chưa có UI cho giáo lý viên ghi nhận đơn (`acknowledgeAbsenceRequest` đã có ở
  tầng action + RLS, nhưng chưa gắn nút vào trang điểm danh).
- Điểm chuyên cần mới là view; đưa vào bảng điểm và cho GLV sửa là P5-T2 (D-39).

**Ghi chú bàn giao Gate Phase 2:**
- Migration `20260721000200_scope_lookup_performance.sql` **chỉ đổi cách tính, không đổi quyền**:
  mỗi helper mảng ứng 1-1 với một nhánh của helper cũ, và các helper cũ (`app.can_access_student`,
  `app.can_access_class`, `app.is_class_staff`…) vẫn giữ nguyên cho code/test đang gọi. Bằng chứng
  không đổi ngữ nghĩa: pgTAP 186/186 sau khi đổi.
- `/imports` trước đây chặn sai role bằng cách ném `AppError` → rơi vào error boundary, khác mọi
  trang khác. Đã thêm `requireImportPage()` (redirect `/access-denied`) cho Server Component;
  Server Action vẫn dùng `requireImportAccess()` vì redirect trong action sẽ phá kiểu trả về.
- Số liệu BLK-2c cập nhật: đo trên **18 sổ** (không phải 11) thì **84/489 dòng** không import được,
  không phải 61/302.
- **Giới tính trong bộ gate là giả**: sổ SYLL không có cột giới tính, UI bắt người duyệt chọn tay
  từng dòng. Bộ gate điền luân phiên nam/nữ chỉ để chạy được commit — dữ liệu giới tính trong DB
  local KHÔNG phản ánh thực tế các em.
- **Nợ UX đã thấy, chưa làm:** trang review import bắt chọn giới tính **từng dòng một form** —
  với sổ 50 dòng là 50 lần submit. Cần nút chọn hàng loạt trước khi giao cho xứ đoàn dùng thật.
- **Nợ khác chưa làm:** `/students` tải toàn bộ danh sách, không phân trang (docs/07 §12 có yêu
  cầu); export báo cáo lỗi import ra file; import GLV (BLK-2b); E2E cho luồng upload→review→commit
  (gate chỉ phủ bằng integration test, chưa bấm nút thật).

**Ghi chú bàn giao P2-T4:**
- Migration `20260721000100_import_batches.sql`: `import_batches`/`import_rows` + RPC
  `commit_import_rows(uuid, uuid[])`. RPC là SECURITY DEFINER, tự kiểm `app.can_global_write()`.
  OUT param đặt tiền tố `out_` để không đụng tên cột — đừng đổi tên khi refactor.
- **Commit theo chunk 100, mỗi chunk một transaction.** Lỗi một dòng được ghi vào chính dòng đó
  (`status='error'`, `commit_error`) và không làm hỏng các dòng còn lại. Batch chỉ là `committed`
  khi không còn dòng pending **và** không còn dòng lỗi; còn lỗi thì `partially_committed`.
- **Không dùng SheetJS.** `xlsx` trên npm chỉ có 0.18.5, dính CVE HIGH (prototype pollution + ReDoS)
  "No fix available", trong khi đây đúng là đường parse file người dùng upload. Đã dùng `exceljs`
  (chỉ thêm 1 moderate gián tiếp qua `uuid`, ngoài đường parse). exceljs khai báo
  `interface Buffer extends ArrayBuffer` sai nên `parse.ts` phải cast — đã ghi chú tại chỗ.
- **Giới tính:** SYLL của xứ đoàn **không có cột giới tính** (83% dòng). Thiếu giới tính là
  *cảnh báo*, người duyệt chọn Nam/Nữ trên UI; `commitBatch` từ chối nếu còn dòng chưa chọn.
  Không đặt mặc định, không đổi schema.
- **Lớp:** sổ Chiên Con không có cột lớp → chọn lớp đích khi upload; cột lớp trong file vẫn thắng.
- `tests/integration/import-sample-workbooks.test.ts` đọc thư mục `../Excel mẫu` **ngoài repo**
  (dữ liệu cá nhân thật của thiếu nhi — **không được copy vào repo**) và tự skip nếu thiếu.
  Suite này chạy ở `@vitest-environment node`; `vitest.config.ts` đã thêm `tests/integration/**`.

⚠️ **Còn thiếu, cần quyết trước khi coi là hoàn chỉnh cho production:**
- 61/302 dòng dữ liệu thật không import được vì **file gốc thiếu SĐT phụ huynh (61) và ngày sinh (25)**,
  tập trung ở hai sổ Chiên Con. Xứ đoàn phải bổ sung — code không xử lý được.
- Chưa có **export báo cáo lỗi ra file** để tải về (docs/09 §9 yêu cầu); hiện chỉ hiển thị trên UI.
- Chưa có **import GLV** (BLK-2b: không có file mẫu).
- Chưa chạy **E2E thật** cho luồng upload→review→commit (pgTAP đã phủ RPC + RLS bằng JWT thật).

**Ghi chú bàn giao P2-T3:**
- Migration `20260716000500_enrollments.sql`: bảng `enrollments` (một enrollment mở/năm qua partial-unique `enrollments_one_open_per_student_year_idx`), trigger `app.validate_enrollment` (security definer, khớp class/year + class active), helper `app.can_manage_class`. **Không cấp DELETE** — không hard delete enrollment.
- Đã `create or replace` `app.can_access_student` và `app.can_view_student_sensitive` để thêm scope ngành/lớp qua enrollment mở. Đây là interface P2-T2 dùng chung — nếu đổi phải ghi impact.
- Enrollment write = global-write hoặc sector_leader/sector_deputy đúng ngành (RLS `can_manage_class`); trainee (không sector) chỉ global-write.
- Health/bí tích **view** đã mở cho sector/class staff (SENSITIVE_READ_ROLES); **edit** vẫn global-write. Class-staff edit health/điểm sẽ làm qua RPC ở phase sau.
- `/classes` cần một năm học `status='current'` để hiển thị; nếu chưa có, hiện hướng dẫn sang `/admin`.
- `npm run test:e2e` dùng production build, cổng 3107, ba viewport.

**Ghi chú bàn giao P2-T2:**
- Migration `20260716000100_guardians_and_students.sql`: bảng `guardians`, `students`, `student_health_profiles`, `student_sacraments`; enum `gender`, `guardian_status`; sequence `student_code_seq` (CQxxxx).
- Đã hiện thực stub `app.is_guardian_of_student`/`app.is_self_student`; thêm `app.can_access_student` và `app.can_view_student_sensitive`. **P2-T3 phải mở rộng hai helper này** để thêm scope ngành/lớp qua enrollment (hiện chỉ global + guardian owner + self; health/bí tích chỉ global read). Đây là interface dùng chung — đổi thì ghi impact.
- Student write chỉ global-write role; sector leader/deputy tạo trong ngành sẽ bật ở P2-T3 khi enrollment cho student một sector context.
- RLS students negative đã test bằng JWT thật (guardian thấy đúng con, student thấy self, guardian/student không đọc health/bí tích, guardian không insert student). Gate Phase 2 (cross-scope leakage lớp/ngành) chờ enrollment ở P2-T5.
- `src/config/navigation.ts` đã mô hình hóa `audience`, `role`, `scope`; guard thật ở server đã có tại route-map.
- `npm run test:e2e` dùng production build, cổng riêng 3107 và ba viewport chuẩn.
- `next lint` và Vite CJS vẫn có cảnh báo deprecated từ scaffold, không chặn build/test.

---

## ⛔ BLOCKERS

| ID | Blocker | Ảnh hưởng | Cần gì để gỡ |
|---|---|---|---|
| ~~BLK-2~~ | ~~Chưa có file dữ liệu Google Sheets/Excel mẫu~~ | **ĐÃ GỠ 2026-07-21** — user cung cấp `Excel mẫu/`; mapping đã khảo sát và hiện thực (docs/09 §2b) | — |
| BLK-2b | Không có file mẫu danh sách GLV (sheet `GIAO_LY_VIEN` không tồn tại trong bộ file thật) | Chặn import GLV; không chặn import thiếu nhi | User cung cấp file GLV |
| BLK-2c | **84/489** dòng dữ liệu thật không import được vì thiếu SĐT phụ huynh hoặc ngày sinh (đo lại ở Gate Phase 2 trên đủ 18 sổ; nặng nhất là 2 sổ Chiên Con: 34/50 và 23/52) | Các dòng này không import được | Xứ đoàn bổ sung dữ liệu vào file nguồn |
| BLK-3 | Chưa biết tên bộ sách giáo lý theo từng ngành | Không chặn schema; teaching plan để text/config | Hỏi lại khi triển khai Phase 4 |
| ~~BLK-4~~ | ~~Chưa có logo/icon ngành chính thức~~ | **ĐÃ GỠ 2026-07-22** — user cấp `logo_TNTT_CHOQUAN.jpg`; icon PWA 192/512 + maskable, favicon, apple-icon và logo sidebar/đăng nhập đều sinh từ file này | — |
| BLK-5 | Chưa có Supabase production credentials | Chặn deploy Phase 7, không chặn local | Tạo Supabase project production |
| BLK-6 | Chưa có domain riêng | Không chặn deploy bằng Vercel domain | User mua/cấu hình nếu cần |
| BLK-7 | Nghiệp vụ Sa mạc còn câu hỏi mở | Chặn Phase 8 | Hỏi lại theo `docs/13-summer-camp-backlog.md` |

---

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
| D-34 | Không full audit before/after; chỉ metadata updated_at/by. |
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

---

## 📖 NHẬT KÝ SESSION (mới nhất ở trên, giữ 6 entry)

### [2026-07-22] Phiên 23 — Claude — P7-T1..P7-T5

- **Làm được:** Năm task đầu Phase 7. (1) **PWA**: icon 192/512 + maskable + apple-icon +
  favicon sinh từ logo thật user cấp giữa phiên (gỡ BLK-4, đã bỏ dải chữ ở đáy logo vì ở
  192px nó chỉ còn là vệt mờ); `public/sw.js` viết tay, không thêm dependency, chỉ cache vỏ
  tĩnh, điều hướng luôn ra mạng và rớt mạng thì trả `offline.html` tĩnh; `next.config.mjs`
  bắt `sw.js` phải revalidate. Logo thay hai chỗ "CQ" placeholder ở trang đăng nhập và
  sidebar, bỏ dòng "Giao diện nền tảng · P0-T2" còn sót. (2) **Responsive QA** quét 15 route
  × 3 viewport, kiểm cả tràn ngang lẫn vùng bấm ≥ 44px — bắt được nợ thật: `Button size="sm"`
  cao 36px (31 chỗ dùng) và 2 label ô tick thiếu `min-h-11`. (3) **Full regression** từ DB
  sạch. (4) **Hiệu năng**: mở rộng `perf:smoke` sang dashboard/báo cáo/thông báo (Phase 5–6
  trước nay không được đo), rồi EXPLAIN dưới RLS thật tìm ra nút thắt là policy gọi helper
  theo từng dòng chứ không phải thiếu index. (5) **Privacy review** bằng lệnh thật + header
  bảo vệ + `tests/e2e/security.spec.ts`. (6) **`scripts/seed-production.mjs`**: mật khẩu tạm
  ngẫu nhiên, ép đổi lần đầu, không dữ liệu mẫu.
- **File thay đổi:** mới `public/{sw.js,offline.html,logo.png}`, `public/icons/*` (4 PNG),
  `src/app/{icon.png,apple-icon.png}`, `src/components/pwa/service-worker-registrar.tsx`,
  `supabase/migrations/20260724000100_rls_initplan_hot_reads.sql`,
  `scripts/seed-production.mjs`, `tests/unit/service-worker.test.ts`,
  `tests/e2e/{pwa,responsive,security}.spec.ts`. Sửa `src/app/{layout,manifest}.ts(x)`,
  `src/app/(auth)/layout.tsx`, `src/components/layout/app-sidebar.tsx`,
  `src/components/ui/button.tsx`, `src/app/(dashboard)/students/{page,[studentId]/page}.tsx`,
  `src/app/(dashboard)/classes/[classId]/page.tsx`, `src/middleware.ts`, `next.config.mjs`,
  `scripts/perf-smoke.mjs`, `package.json`, docs/08, docs/12. Xóa `src/app/icon.svg`.
- **Migration/data impact:** Một migration, **chỉ viết lại 2 policy SELECT**
  (`guardians_select_scope`, `profiles_select_self_or_global`) bằng scalar subquery.
  Không thêm/bớt bảng, cột, quyền; không cần regenerate types. Fresh `db:reset` áp sạch và
  pgTAP giữ nguyên 547/547 — đó là bằng chứng không đổi ngữ nghĩa.
- **Đã test:** fresh `db:reset` ✓; `test:db` **547/547** (cả trước và sau migration);
  `seed:dev` ✓; `lint` ✓ 0 warning; `typecheck` ✓; `npm test` **167 passed / 9 skipped**;
  `build` ✓; `test:e2e` **90/90** trên 360/768/1366 (thêm 9 PWA + 9 responsive + 9 security
  so với 63 của Phase 6). `perf:smoke` ở 911 em, JWT thật:
  `/dashboard` hồ sơ thiếu **225 → 13 ms**, `/students` **163 → 65 ms**; EXPLAIN dưới RLS:
  `guardians` **79,9 → 8,9 ms**, `profiles` **4,3 → 0,34 ms**. `seed:prod` chạy thật trên DB
  local sạch: đúng 2 profile buộc đổi mật khẩu, 2 role super_admin, 19 lớp, 1 năm học, 0
  staff/student/guardian; chạy lần hai bị chặn; gõ sai hostname bị chặn.
- **Quyết định mới:** Không có quyết định nghiệp vụ mới. Ba quyết định kỹ thuật đã ghi ở
  `VIỆC TIẾP THEO`: service worker không cache HTML; `sm` là nút hẹp ngang chứ không phải nút
  thấp; policy SELECT từ nay phải bọc `(select ...)`.
- **Blocker/rủi ro:** BLK-4 đã gỡ. BLK-5/BLK-6 vẫn chặn T6/T7 — cần user tạo Supabase project
  và Vercel project, cách lấy từng khóa đã ghi docs/12 §4a/§5a. Nợ đã thấy: chưa có CSP;
  `npm audit --omit=dev` còn 5 advisory (2 high) qua `next` → `sharp`/`postcss`, nhánh 15.x
  chưa có bản vá, phơi nhiễm thấp; bảng phân công backup ở docs/12 §8 mới là đề xuất, chờ
  user xác nhận; phép đo "publish thông báo toàn xứ đoàn" chưa đại diện vì DB local chỉ có
  ~20 tài khoản, số thật phải đo lại sau khi có tài khoản production.
- **Next action:** `P7-T6 — Deploy Supabase/Vercel Hobby`. User tạo project và đặt env trước;
  agent không tự tạo, không tự đặt secret. Có URL rồi thì chạy `P7-T7 — Smoke production`.

### [2026-07-22] Phiên 22 — Claude — P6-T1..P6-T7 + Gate Phase 6
- **Làm được:** Trọn Phase 6. (1) `committees`/`committee_memberships` + seed 6 Ban id cố định,
  trigger chặn Ban thứ ba (D-47), helper mảng `app.member_committee_ids`/`led_committee_ids` và
  hai stub `is_committee_member`/`is_committee_leader_or_deputy` từ Phase 1 nay có thân thật.
  (2) Thông báo/lịch họp/công việc tuần Ban, ghi chỉ Trưởng/Phó ban, tác giả lấy từ phiên đăng
  nhập, mốc tuần ràng buộc thứ Hai. (3) Kho Ban Kỹ thuật + RPC `borrow_equipment`/
  `return_equipment` khóa dòng, phần hỏng/mất trừ khỏi tổng số, trả lại lần hai idempotent.
  (4) `publish_notification` kiểm quyền theo 7 phạm vi rồi materialize người nhận cùng giao dịch;
  read state theo từng người; badge header đếm thật; deep-link có allowlist ở cả DB lẫn Zod.
  (5) `/dashboard` thật dựng trên 5 view `security_invoker`, đúng danh sách KPI docs/01 §12.
  (6) `/reports` tuần/tháng/năm học, Excel/PDF, chốt snapshot bất biến giữ nguyên filter và số liệu.
- **File thay đổi:** mới migration `20260723000100..00500`, pgTAP `020..023`,
  `src/features/{committees,equipment,notifications,dashboard,reports}/**`,
  route `/committees/[committeeId]`, `/reports/export`, `/reports/snapshots/[id]/export`,
  `src/lib/exports/{spreadsheet,http}.ts`, `tests/e2e/committees.spec.ts`, 3 bộ unit mới.
  Sửa `supabase/seed.sql` (6 Ban), `scripts/seed-dev.mjs` (chức vụ Ban + thiết bị mẫu), 4 trang
  placeholder, `app-shell`/`app-header`/`notification-button` (badge chưa đọc),
  `(dashboard)/layout.tsx`, `src/features/assessments/export-data.ts`, generated types, docs 02/03/05/08/11.
- **Migration/data impact:** Thêm 10 bảng, 5 view, 2 hàm nguồn báo cáo, 5 RPC public và
  ~12 hàm/trigger `app.*`; seed thêm 6 Ban. Không sửa migration cũ. Fresh `db:reset` áp sạch;
  DB local sau gate có fixture dev + dữ liệu E2E Phase 3/4/5/6, không chạm `../Excel mẫu`.
- **Đã test:** fresh `db:reset` ✓; `test:db` **547/547**; `seed:dev` ✓; `lint` ✓ 0 warning;
  `typecheck` ✓; `npm test` **156 passed / 9 skipped** (skip đúng theo cờ `GATE_PHASE2`);
  `build` ✓ (5 route mới); `test:e2e` **63/63** trên 360/768/1366 (Phase 6 **9/9**);
  `git diff --check` ✓.
- **Quyết định mới:** Không có quyết định nghiệp vụ mới; D-47..D-52 giữ nguyên. Chi tiết hiện thực
  đã ghi ở `VIỆC TIẾP THEO`: cờ `manages_equipment` thay vì so mã Ban; snapshot lưu `payload_json`
  trong DB thay vì bucket; báo cáo kết quả tính theo cả năm học.
- **Blocker/rủi ro:** Không có blocker Phase 6. BLK-5/BLK-6 vẫn mở nhưng chỉ chặn P7-T6/T7.
  Nợ chưa làm đã liệt kê ở `VIỆC TIẾP THEO`. Cảnh báo deprecation `next lint`/Vite CJS không
  làm fail gate.
- **Next action:** `P7-T1 — PWA and responsive QA`; claim task trước khi code.

### [2026-07-22] Phiên 21 — Codex — P5-T1..P5-T7 + Gate Phase 5
- **Làm được:** Hoàn tất Phase 5: cột điểm động/hệ số/null≠0; hai đề xuất chuyên cần với override;
  comment public/internal; representative lock và SA unlock; Excel/PDF Unicode đúng lớp; Top 5
  feature flag với assessment/average/custom source và snapshot tối đa 5; portal guardian/student
  published-only; `/promotions` đề xuất–duyệt theo ngành, A/B, repeat/pause/withdraw và Hiệp 2 →
  Dự trưởng. Duyệt khóa review/source và đóng nguồn + tạo đích nguyên tử, idempotent; không tạo role.
- **File thay đổi:** migration `20260722000400..00700`, pgTAP `016..019`,
  `src/features/assessments/**`, `src/features/promotions/**`, routes `/results/**` và `/promotions`,
  `tests/e2e/results.spec.ts`, unit assessment/export/promotion, generated DB types, navigation,
  route map, package `pdfmake` và docs 02/03/05/07/08/11.
- **Migration/data impact:** Thêm assessment settings/assessments/scores/locks/comments,
  leaderboards/entries và promotion reviews; helper/trigger/RPC/RLS tương ứng. Fresh reset cuối áp
  sạch; DB local sau full E2E có fixture dev + dữ liệu test ở ba lớp độc lập, không chạm Excel nguồn.
- **Đã test:** fresh `db:reset` ✓; `test:db` **423/423**; `seed:dev` ✓; lint ✓ 0 warning;
  typecheck ✓; unit/integration **137/137** (9 skip theo cờ Gate P2); production build ✓;
  full E2E **54/54** trên 360/768/1366 (Phase 5: **3/3**); `git diff --check` ✓.
- **Quyết định mới:** Không đổi nghiệp vụ D-38..D-44. Chi tiết hiện thực: PDF dùng Roboto nhúng để
  giữ tiếng Việt; portal lọc published tường minh kể cả GLV kiêm phụ huynh; snapshot Top 5 giữ tên.
- **Blocker/rủi ro:** Không có blocker Phase 5. `npm audit` còn 10 advisory từ dependency scaffold
  (Next/Vite/Vitest/ExcelJS và gói gián tiếp); không chạy `audit fix --force`. Cảnh báo deprecation
  `next lint`/Vite CJS không làm fail gate.
- **Next action:** `P6-T1 — Committees and memberships`; claim task trước khi code.

### [2026-07-22] Phiên 20 — Codex — P4-T1..P4-T3 + Gate Phase 4
- **Làm được:** Hoàn tất module giáo án. (1) `teaching_plans`/`teaching_plan_items` với một plan/lớp,
  lịch cả năm, đủ trường nội dung, ngày trong năm học và người dạy bắt buộc thuộc assignment lớp;
  representative/global-write ghi, staff scope chỉ xem. (2) UI `/teaching-plan` và
  `/teaching-plan/[classId]`: danh sách lớp, list/theo tháng, tạo/đổi tên plan, thêm/sửa/xóa mục,
  badge kiểm tra và phân công người dạy. (3) RPC `get_week_ahead_teaching_items` chỉ trả 8 trường an
  toàn; guardian/student không đọc bảng gốc. (4) Bucket private `teaching-materials`, 5 MB + MIME
  allowlist, path lớp/mục/tệp, upload/thay/gỡ theo manager và signed URL 60 giây cho staff scope.
  E2E phát hiện và sửa hai lỗi thật: callback dùng `event.currentTarget` sau `await` làm rơi error
  boundary; Storage DELETE cần SELECT object sau khi metadata đã tách nên manager được đọc riêng
  object mồ côi để dọn vật lý, còn staff chỉ-xem/guardian/student vẫn bị chặn.
- **File thay đổi:** mới 3 migration `20260722000100..00300`, pgTAP `013..015`,
  `src/features/teaching-plans/**`, route `/teaching-plan/[classId]`, unit
  `teaching-plan-schemas.test.ts`, E2E `teaching-plan.spec.ts`; thay placeholder `/teaching-plan`,
  generated `src/types/database.ts`, `next.config.mjs`, `scripts/run-e2e.mjs`, docs 02/03/05/08/11
  và `WORKLOG.md`.
- **Migration/data impact:** Thêm 2 bảng, 1 enum, 4 cột metadata tài liệu, 1 private bucket, 1 RPC
  public safe projection, 5 helper/trigger `app.*` và RLS/policy Storage. Fresh `db:reset` đã xóa
  dữ liệu local cũ; sau gate đã chạy lại `seed:dev`, DB local hiện có fixture dev và dữ liệu E2E
  Phase 3/4, không đụng file Excel nguồn.
- **Đã test:** fresh `db:reset` ✓; `test:db` **311/311** (Phase 4 thêm 58 assertion); `seed:dev` ✓;
  lint ✓ 0 warning; typecheck ✓; build production ✓; unit+integration **125/125** (9 gate Phase 2
  skip theo cờ); `test:e2e` **51/51** trên 360/768/1366, gồm Phase 4 **3/3** upload/download/remove
  Storage thật và kiểm portal không rò nội dung nội bộ/tài liệu; `git diff --check` ✓.
- **Quyết định mới:** Không có quyết định nghiệp vụ mới; BLK-3 không chặn vì nội dung giáo lý tiếp
  tục là text tự do. Chi tiết kỹ thuật: signed URL 60 giây, tệp tối đa 5 MB, allowlist
  PDF/Office/image/text và một tài liệu hiện hành cho mỗi mục giáo án.
- **Blocker/rủi ro:** BLK-3 (tên bộ sách theo ngành) vẫn mở nhưng không chặn Phase 4. `next lint` và
  Vite CJS còn cảnh báo deprecation từ scaffold, không làm fail suite.
- **Next action:** `P5-T1 — Dynamic assessments and score grid`; claim task rồi đọc D-38/D-39.

### [2026-07-22] Phiên 19 — Codex — P3-T6 + Gate Phase 3
- **Làm được:** Thêm E2E hai browser context đăng nhập GLV909/GLV910: A giữ lease, B bị chặn;
  đẩy `last_activity_at` quá hạn bằng setup local, B tiếp quản và lưu; A dùng DOM stale bị RPC từ
  chối bằng thông báo tiếng Việt, tải lại xác nhận dữ liệu B không bị ghi đè. Thêm E2E buổi vừa
  khóa: editor stale bấm lưu bị chặn, reload thấy badge khóa và control disabled. Test đầu tiên lộ
  hai lỗi UI thật và đã sửa: tên editor bị RLS `profiles` che (đổi sang `staff_profiles` theo scope
  lớp), và `editing_by = null` vẫn phải cho tiếp quản ngay thay vì chờ lease cũ. Mở rộng perf smoke
  để bảo đảm Ấu 1A 60 em, dựng 30 buổi qua JWT GLV thật và đo finalize/list/roster/summary.
- **File thay đổi:** `tests/e2e/attendance.spec.ts`, `src/features/attendance/server/queries.ts`,
  `scripts/run-e2e.mjs`, `scripts/perf-smoke.mjs`, `docs/08-phase-plan.md`, `WORKLOG.md`.
- **Migration/data impact:** Không có migration/schema change. `db:reset` xóa dữ liệu local cũ;
  `perf:smoke` để lại 910 hồ sơ tổng hợp và 30+ buổi điểm danh local, không chạm file Excel thật.
- **Đã test:** fresh `npm run db:reset` ✓; `npm run test:db` **253/253**; `npm run seed:dev` ✓;
  `npm run lint` ✓ 0 warning; `npm run typecheck` ✓; `npm test` **118/118** (9 gate Phase 2 skip
  theo cờ); `npm run build` ✓; `npm run test:e2e` **48/48** trên 360/768/1366. `perf:smoke` bằng
  JWT thật: 60 em/30 buổi, bulk finalize **16 ms**, list 24 buổi **10 ms**, roster **25 ms**,
  summary **16 ms**; `/students` 910 dòng **118 ms**.
- **Quyết định mới:** Không có; hiện thực đúng D-29..D-36, D-58..D-60.
- **Blocker/rủi ro:** Không có blocker Phase 3. DB local có dữ liệu perf nên pgTAP chỉ chạy lại sau
  `db:reset`. Cảnh báo deprecation `next lint`/Vite CJS vẫn không chặn build/test.
- **Next action:** `P4-T1 — Teaching plan CRUD`; đọc BLK-3 và claim task trước khi code.

### [2026-07-21] Phiên 18 — Claude — P3-T1..P3-T5
- **Làm được:** Toàn bộ nghiệp vụ điểm danh. (1) Migration `...000300`: `attendance_sessions` +
  `student_attendance_records` + `staff_attendance_records`, 5 RPC (claim/heartbeat/takeover/
  save-finalize/unlock) khóa dòng session trước khi ghi, lease và lock đọc từ `academic_years` và
  so bằng giờ DB, roster nạp sẵn `present/present` khi claim (D-31). Ghi chỉ qua RPC —
  `authenticated` không có INSERT/UPDATE. (2) Migration `...000400`: `absence_requests` với trigger
  suy ra lớp từ ghi danh và giới hạn ai đổi cột nào (phụ huynh chỉ hủy, GLV chỉ ghi nhận).
  (3) Migration `...000500`: `attendance_weight_settings` (tự sinh theo năm học), 3 cột ngưỡng cảnh
  báo trên `academic_years`, và 3 view `security_invoker` tính tỷ lệ, chuỗi vắng liên tiếp, chuỗi
  Chúa nhật vắng lễ, lệch Lễ/Giáo lý, hai điểm thang 10. (4) UI: `/attendance` (mở buổi + danh sách
  buổi), `/attendance/[sessionId]` (roster hai trạng thái độc lập, điểm danh GLV cùng buổi, gợi ý
  đơn xin nghỉ, lưu nháp/chốt, tiếp quản, heartbeat nửa nhịp lease, SA mở khóa),
  `/parent/absence-requests`, `/parent/children/[studentId]`, `/student/attendance`, và form cấu
  hình ngưỡng trong `/admin`.
- **File thay đổi:** mới `supabase/migrations/20260721000300_attendance_sessions.sql`,
  `...000400_absence_requests.sql`, `...000500_attendance_alerts_and_score.sql`,
  `supabase/tests/012_attendance_test.sql`, `src/features/attendance/**`,
  `src/features/absence-requests/**`, `src/features/portal/**`,
  `src/app/(dashboard)/attendance/[sessionId]/page.tsx`, `src/app/(dashboard)/parent/**`,
  `src/app/(dashboard)/student/attendance/page.tsx`, `tests/e2e/attendance.spec.ts`,
  `tests/unit/attendance-schemas.test.ts`. Sửa `src/app/(dashboard)/attendance/page.tsx` (bỏ
  placeholder), `src/app/(dashboard)/admin/page.tsx`, `src/features/academic-years/**`,
  `src/config/navigation.ts` (preset mobile tra theo href thay vì chỉ số mảng),
  `src/lib/permissions/route-map.ts`, `src/types/database.ts`, `tests/e2e/home.spec.ts`,
  `docs/02`, `docs/08`, `docs/11`, `WORKLOG.md`.
- **Migration/data impact:** Thêm 4 bảng, 2 enum, 3 cột ngưỡng trên `academic_years`, 3 view,
  5 RPC public, 6 hàm `app.*`, 4 trigger. Không sửa migration cũ, không đụng bảng nghiệp vụ có sẵn.
  Fresh `db:reset` áp sạch; generated types đã cập nhật. ⚠️ **`db:reset` đã xóa 405 hồ sơ thật
  import ở phiên 17 khỏi DB local** — bắt buộc để áp migration và chạy `test:db`; import lại bằng
  `GATE_PHASE2=1 npx vitest run tests/integration/gate-phase2-import.test.ts`.
- **Đã test:** `db:reset` ✓; `test:db` pgTAP **253/253** (012: 67 mới, chạy bằng JWT thật — quyền
  claim, session duy nhất, mặc định present, hai trạng thái độc lập, lease/tiếp quản, editor cũ bị
  chặn, chốt đủ roster, mốc khóa = chốt + 3 ngày, khóa rồi GLV không sửa, chỉ SA mở khóa và sau đó
  GLV vẫn bị chặn, phụ huynh/thiếu nhi chỉ thấy bản đã chốt của mình, đơn xin nghỉ đủ luật, chuỗi
  vắng + hai điểm + cờ cảnh báo); `lint` ✓ 0 warning; `typecheck` ✓; `build` ✓ (5 route mới);
  unit+integration **118/118** (9 skip vì thiếu cờ `GATE_PHASE2`); `test:e2e` **42/42** trên
  360/768/1366, **chạy lại 3 lần liên tiếp đều xanh**.
- **Quyết định mới:** D-58 (ngưỡng cảnh báo cấu hình theo năm học, mặc định 3 buổi / 3 Chúa nhật /
  80%), D-59 (hai điểm chuyên cần riêng cho Thánh lễ và Giáo lý), D-60 (portal phụ huynh/thiếu nhi
  ở Phase 3 chỉ làm tối thiểu để đóng gate) — cả ba do user chốt đầu phiên.
- **Blocker/rủi ro:** Không có blocker mới. Hai bẫy kỹ thuật đã ghi ở phần bàn giao: `redirect()` về
  đúng đường đang đứng từ Server Action làm trang rơi vào error boundary; `revalidatePath` một mình
  không làm mới router phía client nên form thuần không hiện dữ liệu vừa ghi. Nợ chưa làm: E2E hai
  trình duyệt song song, đo hiệu năng điểm danh lớp đông, trang tổng hợp cảnh báo cho GLV, nút ghi
  nhận đơn xin nghỉ trên trang điểm danh.
- **Next action:** `P3-T6 — Attendance security/concurrency tests` rồi `Gate Phase 3`. Xem
  `VIỆC TIẾP THEO` để biết ba mục còn thiếu cụ thể.

_(Giữ tối đa 6 entry gần nhất.)_
