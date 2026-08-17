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

> Cập nhật: **2026-08-13** — GIAI ĐOẠN 3 **đã hoàn tất kiểm định độc lập với kết luận NO-GO**.
> Trạng thái lịch sử “2B đã đóng đủ 14/14 module” chỉ nói các đợt triển khai đã chạy xong; kết quả
> verification không xác nhận Giai đoạn 2 hoàn tất vì còn blocker quyết định/AC, bảo mật, toàn vẹn
> và browser gate.

- **`P3-UI-001 · Đợt A→E — XONG — Claude — 2026-08-17`** — kế hoạch 17, **còn đúng Đợt F**.
  A màn hình chờ toàn cục · B `Select` v2 (74 chỗ gọi không sửa) · C `DateField`/`DateTimeField`
  (30 ô, toàn web DD/MM/YYYY) · D `Checkbox` (10 ô tick + 2 control trần cuối) · E `FilterField`
  (27 ô/9 tệp) + `Panel`/`Card` (37 khối) + bí danh token cũ về **0** trong `src/`.
  Chủ dự án ra lệnh *"làm theo kế hoạch 17"* ⇒ **duyệt §2**, `09` có thêm **§12 (A1–A5)**.
  **0 business rule · 0 migration · 0 đổi RLS · 0 đổi quyền · 0 đổi dữ liệu** ở cả năm đợt.
  ⚠️ Còn nợ cho Đợt F: **nợ #5** (16 lớp bổ-ngữ-độ-mờ trên token màu, **không sinh CSS** — đã có
  danh sách đủ ở `16` §6.5) và xoá nhóm "BÍ DANH CŨ" khỏi `tailwind.config.ts` (`17` §10).

- **`P3-UX-001 — XONG phần 14 bài baseline — Claude — 2026-08-14`** (🔁 bàn giao từ Codex
  2026-08-13). **14/14 bài đỏ của baseline GĐ3 nay xanh**: 11 bài do đợt sửa `revalidatePath` của
  Codex, 3 bài còn lại do hai fix trong phiên này. Lượt full cuối còn **3 bài đỏ mang chữ ký nợ
  ổn định** (nợ #10) — chạy lại targeted thì **51/51 xanh**, xem entry Phiên 67.

- **`2B · M13-B + M13-C — XONG — Codex — 2026-08-12`** ⇒ **ĐÓNG module 14/14 và đóng phần
  triển khai Giai đoạn 2B.** Bốn nguyên nhân rỗng được tách đúng; hai portal dùng mật độ
  `comfortable`; cảnh báo/bảng/focus đạt yêu cầu 360px; đối chiếu route và Kết quả · Giáo án ·
  Thông báo hoàn tất. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền.** DB sạch: pgTAP
  **1385/1385** · unit **1545 pass / 16 skip** · portal E2E **24/24** · lint 0 · typecheck ✓ ·
  build **29/29**. E2E toàn hệ thống chạy đủ **585 bài: 561 pass · 24 fail**; cả 9 bài mới M13-B/C
  xanh, các bài đỏ còn lại thuộc nợ ổn định Server Action/stream và fixture chia sẻ.

- **`2B · M13-A — XONG — Codex — 2026-08-12`** — đóng lớp nền `CRITICAL` của module cuối:
  `/student/*` có layout guard mặc định đóng; tách đúng ba ngữ nghĩa *em đọc được / con của tôi /
  chính em*; D-25 cho GLV đồng thời là phụ huynh; D-64 một con đi thẳng/nhiều con chọn danh sách;
  rà lại D-70/D-75 bằng hành trình thật. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền.**
  pgTAP **1385/1385** trên 52 file · unit **1536 pass / 16 skip** · lint **0 warning 0 error** ·
  typecheck ✓ · build ✓ **29/29 trang** · `portal.spec.ts` **15/15** trên 360/768/1366.

- **`2B · M11-B + M11-C — XONG — Claude — 2026-08-12`** ⇒ **ĐÓNG module 13/14 (M11 Báo cáo &
  Dashboard)**. Hai đợt trong **một phiên** theo yêu cầu của chủ dự án, mỗi đợt vẫn chạy kiểm thử
  riêng. **2 migration · 1 thay đổi phân quyền (`11` §6 D-67, **NỚI** — nửa còn nợ) · 0 `alter table`
  · 0 backfill · 0 dòng dữ liệu bị đụng.**
  **(1) 🔴 HIỆN TRẠNG CỦA THỦ QUỸ ĐÃ ĐO BẰNG JWT THẬT TRƯỚC KHI SỬA, KHÔNG SUY ĐOÁN:** trang tổng
  quan hiện `0 thiếu nhi · 0 giáo lý viên · 0 lớp`, hai bảng báo cáo trả **0 dòng**. Đó **không phải
  "chưa biết", đó là NÓI SAI** — và nói sai với một chức việc cấp xứ đoàn ngay màn hình đầu tiên sau
  khi đăng nhập. **D-170 + D-173** nới bằng **cửa sổ hẹp** phủ ba chỗ: bảng báo cáo · kho bản chốt ·
  bốn ô số tổng quan. Sau khi sửa: `4 · 5 · 19` và bảng có dòng.
  **(2) 🔴 Hai hàm `_for_treasurer` GỌI THẲNG hai RPC gốc, không chép một dòng SQL nào.** Chép ra
  một bản thứ hai "cho Thủ quỹ" là dựng sẵn hai con số sẽ lệch nhau vào một ngày không ai nhớ nổi,
  tức phá **D-52** ngay chỗ nó được sinh ra để bảo vệ.
  **(3) 🔴 Cố ý KHÔNG sửa `v_dashboard_summary`.** Bốn con số của view lấy từ **bốn nguồn khác
  nhau**: ba nguồn lọc bằng RLS của bảng gốc nên với Thủ quỹ vẫn là 0, riêng `class_count` lọc bằng
  **vị từ viết tay trong view**. Nới trong view chỉ nới được **một** số và dựng lại **đúng cái bệnh
  D-169 vừa chữa hôm trước** — một hàng KPI có 1 số đúng và 3 số sai, chỉ đổi vai người mắc.
  **(4) 🔴 RANH GIỚI CŨ KHÔNG NHÚC NHÍCH, và pgTAP `051` có 6 bài canh riêng vế đó:** Thủ quỹ gọi
  thẳng hai RPC gốc vẫn **0 dòng** · đọc thẳng `students`, `student_attendance_records`,
  `assessment_scores` vẫn **0 dòng** · `app.can_global_read()` **vẫn không có họ** · và vẫn **không
  chốt được** ở cả ba phạm vi, đo cả bằng hàm lẫn bằng một lệnh `insert` gửi thẳng vào cơ sở dữ
  liệu. **Một bản cài đặt lười thêm `treasurer` vào `can_global_read()` sẽ làm 6 bài đo cửa sổ xanh
  y hệt và 6 bài này đỏ hết** — đó là toàn bộ giá trị của nửa sau bộ kiểm.
  **(5) D-171 — một cái nhãn nói sai nội dung, không phải một tính năng còn thiếu.**
  `report_results_rows` **bỏ qua hoàn toàn** khoảng ngày, nên chọn "Tháng 09" ra số của **cả năm**
  dưới nhãn một tháng — và bản chốt ghi lại đúng cái nhãn ấy **vĩnh viễn** vì snapshot không sửa
  được. Ép ở **một hàm thuần duy nhất** rồi gọi từ cả ba cửa vào; mỗi cửa tự ép lấy thì đủ để một
  cửa quên, và cửa quên ấy chính là cửa **ghi bản chốt**.
  **(6) 🔴 D-172 + D-174 — hộp xác nhận, và chữ "AI" là chỗ khó.** Nêu tên người chốt bản trùng là
  **bản sinh đôi của cái bẫy M08-C đã vấp** (D-163): `profiles` chỉ mở cho chính mình hoặc sáu vai
  trò cấp xứ đoàn, mà **hai nhóm chốt báo cáo nhiều nhất — Trưởng ngành và Giáo lý viên đại diện —
  không nằm trong sáu**. Nhúng thẳng là một ô `null` **trong im lặng**.
  **(7) 🔴 TB-03 — ngõ cụt nằm ở thẻ mà không ai bọc cờ.** Bản cũ bọc **ba** thẻ bằng `isStaff` và
  **bỏ sót thẻ "Cần quan tâm"**, nên phụ huynh thấy tên con đang bị cảnh báo, bấm vào, và bị đá sang
  `/access-denied` — từ đó **không còn đường nào khác**.
  **(8) TB-06 — kho 5 năm lần đầu có cửa**, và nó kéo theo cái bẫy `profiles` **lần thứ hai trong
  cùng một module** ⇒ `list_report_snapshot_actors`.
  **(9) 🔴 N-6 lộ một khoảng trống của chính bộ dữ liệu mẫu:** `seed:dev` **không tạo một buổi điểm
  danh đã chốt nào**, nên nút "Chốt báo cáo" **luôn `disabled`** và đường ghi nguy hiểm nhất của
  module — thao tác **không xoá được** — sẽ **không bao giờ được chạy tới**. Một bộ E2E xanh mà chưa
  từng bấm nút nguy hiểm nhất là một bộ E2E nói dối; spec tự dựng dữ liệu qua service role, mỗi
  viewport **một tháng riêng** để phép đo "bản trùng" không phụ thuộc thứ tự chạy.
  pgTAP **1385/1385** trên **52 file** (trước 1324/50 ⇒ **+61**) · unit **1531 pass / 16 skip**
  (trước 1469/16 ⇒ **+62**) · lint **0 warning 0 error** · typecheck ✓ · build ✓ **29/29 trang** ·
  `reports.spec.ts` **18/18 xanh** chạy riêng trên `laptop-1366`.
  ⚠️ **Số E2E TOÀN BỘ của phiên này KHÔNG dùng làm số nghiệm thu:** Docker Desktop **hỏng hai lần**
  giữa phiên (engine trả `500` cho mọi lệnh; một truy vấn Supabase đo được **445 giây**), và lượt
  chạy đầy đủ rơi đúng vào cửa sổ ấy — các bài đỏ mang chữ ký **hạ tầng** (`page.goto: … browser has
  been closed`) ở những spec đợt này **không đụng một dòng nào**. **Phải chạy lại `npm run test:e2e`
  khi môi trường ổn**; dịch vụ `com.docker.service` đang **Stopped**, cần quyền Administrator.

- **`2B · M11-A — XONG — Claude — 2026-08-11`** ⇒ **MỞ module 13/14 (M11 Báo cáo & Dashboard**,
  `NEEDS_IMPROVEMENT`, **52/75** ở mức module, **0 luồng CRITICAL)**.
  **1 migration · 1 thay đổi phân quyền (`11` §6 D-66, SIẾT) · 0 `alter table` · 0 backfill ·
  0 dòng dữ liệu bị đụng.**
  **(1) 🔴 PHIÊN TRƯỚC BỎ DỞ ĐỢT NÀY VÀ KHÔNG GHI MỘT DÒNG NÀO VÀO SỔ.** Migration `20260811000100`,
  pgTAP `050` và 8 file mã nguồn đã viết xong lúc 17:02–21:53 hôm trước, còn file 16 và WORKLOG
  dừng ở 16:36 — phiên này phải dựng lại hiện trạng bằng **dấu thời gian của file**. Nặng hơn:
  **`src/types/database.ts` — 4120 dòng — bị ghi đè thành ĐÚNG MỘT DÒNG báo lỗi**, vì
  `npm run db:types` chạy lúc Postgres cục bộ đang tắt và dấu `>` trong script **cắt trắng file
  đích trước khi lệnh chạy**. Hệ quả: `typecheck` đỏ ngay dòng 1, `build` chết ⇒ **cả đợt A chưa
  từng qua một cửa kiểm nào**. Nguyên nhân gốc nằm ngoài repo: Windows giữ chỗ dải cổng
  **54336–54935** cho Hyper-V, nuốt trọn 54420–54429 của Supabase; chủ dự án đã chạy
  `net stop winnat` / `net start winnat` bằng quyền Administrator để mở lại.
  **(2) D-66 — một hàm đang gánh hai câu hỏi.** `app.can_create_report` từ Phase 6 phục vụ **cả**
  policy đọc lẫn policy ghi của `report_snapshots`, nên siết thẳng nó là **lấy luôn quyền xem/tải**
  của hai Cha — trái đúng câu chữ D-66. Nay tách làm hai cái tên. Mất quyền chốt **đúng ba cái tên**:
  Cha sở · Cha phó · Thủ quỹ, đo bằng cách liệt kê lại **14 vai trò × 3 phạm vi**.
  **(3) 🔴 Cái bẫy sẽ cho một bộ kiểm XANH GIẢ:** không được viết hàm hẹp bằng `can_access_sector` /
  `can_access_class` — **hai hàm ấy tự gọi `can_global_read()` bên trong**, nên bản siết chỉ đổi
  nhánh `global` vẫn để Cha sở chốt được ở phạm vi **ngành** và **lớp**, và một bộ kiểm chỉ đo nhánh
  `global` sẽ xanh trọn vẹn trong khi hai cánh cửa còn mở.
  **(4) Ô "Lớp" của trang tổng quan hết nói sai (D-169).** Nó đếm trên toàn bộ `classes` — bảng mà
  policy **cố ý mở cho mọi tài khoản** để phục vụ dropdown — nên Giáo lý viên lớp Ấu 1 thấy **19**
  trong khi ba ô cạnh nó (thiếu nhi · giáo lý viên · tỷ lệ chuyên cần) đều đã đúng phạm vi.
  **(5) Trang Báo cáo hết nói dối về phạm vi.** Ba lý do bảng trống ra **ba câu khác nhau**; ô chọn
  ngành/lớp chỉ liệt kê thứ người đó xem được; tham số URL hỏng **thu hẹp và nói ra** thay vì âm
  thầm nới về "toàn xứ đoàn"; phạm vi mặc định suy từ vai trò; nút "Chốt báo cáo" **hỏi luật** thay
  vì chép lại nó bằng danh sách vai trò viết tay (bài học D-151 của M07-B).
  **(6) Nợ #18 ĐÓNG HẲN** — `report_snapshots` là **bảng cuối cùng** của món nợ mở từ M02-C.
  **Nợ #14** trả cho `reports` — bốn cửa vào, còn đúng 1 module (`theme`).
  **(7) 🔴 Bốn chỗ hỏng trong phần phiên trước để lại**, cả bốn không có bài kiểm nào canh: bộ unit
  test cũ vẫn gọi hàm theo **chữ ký cũ** (đã viết lại, 30 bài thay cho 9) · câu *"vì sao bảng trống"*
  hỏi **cả xứ đoàn** rồi trả lời cho **một ngành** · gõ tay `?scopeType=sector` làm ô chọn phạm vi
  hiện **ô trống** · bản chốt có hình dạng lạ làm trang **500** (nay 422).
  **(8) 🔴 Một lỗi chỉ `typecheck` bắt được:** bộ sinh kiểu của Supabase khai tham số không có mặc
  định thành **không nhận `null`**, trong khi phạm vi "toàn xứ đoàn" đúng nghĩa là *không có id* ⇒
  `p_scope_id` phải có `default null` ở SQL. Sửa thẳng migration vì file này **chưa từng áp
  production**.
  **(9) Ba quyết định chủ dự án chốt cho đợt B: D-170** Thủ quỹ đọc số gộp theo lớp bằng **cửa sổ
  hẹp** (không chuyển hai RPC báo cáo sang `security definer` — `07` §2.1 tự xếp đó là điểm nguy
  hiểm nhất của module) · **D-171** báo cáo "Kết quả học tập" luôn là cả năm học · **D-172** cho
  chốt trùng nhưng **hỏi lại và nêu bản đã có**.
  ⚠️ **Cái giá đã biết của đợt này:** nút "Chốt báo cáo" **vẫn chưa hỏi lại** (AC-B09) — hoãn có
  chủ ý vì D-172 vừa đổi hẳn nội dung câu hỏi; trong thời gian chờ, một cú bấm nhầm tạo một bản
  chốt **vĩnh viễn**.
  pgTAP **1324/1324** trên 50 file (trước 1286/1286 trên 49, **+38** = đúng `plan(38)` của `050`,
  toàn bộ **JWT thật của 9 vai trò**) · unit **1469 pass / 16 skip** (trước 1448/16, **+21**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang**. **Không chạy E2E** — đúng tiền lệ đợt
  A của M10/M08, và vì `07` §5 ghi **N-6: chưa từng có e2e nào cho `/reports` và `/dashboard`**;
  dựng bộ ấy là việc của **M11-C**.

- **`2B · M10-A · M10-B · M10-C — XONG — Claude — 2026-08-10`** ⇒ **ĐÓNG module 12/14 (M10 Thông
  báo)**. Cả ba đợt làm trong **một phiên** theo yêu cầu của chủ dự án, mỗi đợt vẫn chạy kiểm thử
  đầy đủ. **2 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng · 0 quyền ghi mới.**
  Điểm audit **61,6/75** — cao thứ nhì trong 2B — mà vẫn có **hai luồng CRITICAL**, và khoảng cách
  ấy là chuyện đáng nhớ của module này.
  **(1) 🔴 Hai lỗi CRITICAL là MỘT lỗi, và nó là một dòng VẮNG MẶT.** Chuông và hộp thư đều quên
  hỏi *"của tôi"*. Với 8/14 vai trò **không sao** — cơ sở dữ liệu vốn đã lọc đúng cho họ. Với 6 vai
  trò cấp xứ đoàn (Quản trị viên · Cha sở · Cha phó · Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký) thì:
  chuông đếm chưa đọc **của cả xứ đoàn** — sau một thông báo toàn hệ thống là *"99+"* và **không
  bao giờ về 0**; hộp thư **cá nhân** của họ là *"50 dòng mới nhất của cả hệ thống"*, **kể cả nội
  dung thư riêng gửi cho người khác**; nhãn "Mới" lấy trạng thái đọc **của người khác**; nút "Đánh
  dấu đã đọc" **bấm mãi không tắt**; và thông báo thật sự dành cho họ **bị đẩy ra ngoài 50 dòng
  đầu** ⇒ **bỏ lỡ thông báo**. Sửa bằng **hai dòng**, không migration, không đụng phân quyền.
  **(2) 🔴 Bài kiểm viết cho đợt A tìm ra CHỖ THỨ BA, ở trang tổng quan — ngoài phạm vi audit.**
  Ô *"Thông báo mới nhất"* của `/dashboard` mắc đúng lỗi ấy ở **hai** chỗ, tức trang **ai cũng đổ
  vào ngay sau khi đăng nhập** đang hiện tiêu đề thư riêng của người khác. Ô này thuộc **M11**;
  sửa luôn vì cùng loại rò rỉ, chỉ tốn một dòng, và chỉ **siết** phạm vi dữ liệu. Đã bàn giao.
  **(3) Người gửi cuối cùng cũng biết thông báo tới được bao nhiêu người.** Trước đây câu trả lời
  luôn là *"Đã gửi thông báo."* — **kể cả khi nó tới không một ai**. Nay: số thật sau khi gửi, số
  dự kiến **ngay trên nút** trước khi gửi, và ca 0 người **không** hiện như một lần gửi thành công.
  Không cần migration: cột đếm đã có sẵn từ Phase 6, chỉ chưa ai đọc.
  **(4) Bấm "Gửi" hai lần không còn ra hai thông báo** (D-165, mã ẩn do giao diện sinh) — chặn được
  cả bấm đúp, mạng gửi lại, và hai tab.
  **(5) 🔴 Gửi riêng cho một người: chức năng đã có ĐỦ ở cơ sở dữ liệu từ Phase 6 mà chưa từng có
  nút bấm nào**, và nó còn kèm một hố đen — người **chưa được phân công vai trò** thì **không bao
  giờ nhận được**, người gửi cũng không được báo. D-167 sửa cả hai: có ô tìm người, và thư tới nơi.
  **(6) Gửi nhầm thì thu hồi được** (D-166): người nhận thấy dòng *"Thông báo này đã được thu hồi"*
  thay cho nội dung, chuông thôi đếm nó. Không giới hạn thời gian, nhưng **bắt buộc nêu lý do**, và
  lý do ấy nằm lại vĩnh viễn cùng tên người thu hồi.
  **(7) 🔴 TÔI LẶP LẠI ĐÚNG LỖI CRITICAL CỦA MODULE, TRONG CHÍNH LƯỢT SỬA NÓ.** Mục *"Tôi đã gửi"*
  của đợt C ban đầu **không lọc theo tác giả**, nên với 6 vai trò cấp xứ đoàn nó sẽ liệt kê thông
  báo **của cả xứ đoàn**, và 4 trong 6 còn bấm được nút "Thu hồi" trên đó. Bài quét của đợt A
  **không bắt được** vì nó chỉ canh **một** bảng. Nay canh **cả hai**. Bài học: *một bài kiểm chỉ
  bảo vệ đúng phạm vi nó quét.*
  **(8) Một mâu thuẫn thật giữa hai tài liệu đã duyệt của module** (`07` §4 nói bản thu hồi phải
  **biến mất**, `04_TO_BE_FLOWS` nói phải **ở lại kèm nhãn**) — không tự chọn, đã hỏi chủ dự án
  (**D-168**), và cài đặt cuối thoả **cả hai** vế.
  **(9) 🔴 Lượt kiểm cuối lộ thêm bốn lỗi thật mà bốn cửa kiểm trước đều không thấy:** bộ chọn người
  của đợt B là `<select>` trần (điều cấm của `11` §5) · **mọi câu lỗi tiếng Việt của module chưa
  từng hiện ra một lần nào** (bản sinh đôi của lỗi M07-A đã sửa cho bảng điểm) · câu lỗi thu hồi
  hiện ở **đầu trang trong khi hộp thoại đang che** · trạng thái rỗng là một dòng chữ xám thay vì
  một trong ba loại chuẩn. Đã sửa cả bốn.
  **(10) 🔴 Và một cái XANH GIẢ trong bài E2E của chính tôi.** Bài thu hồi chờ chuỗi chung chung nên
  nó khớp dòng đã thu hồi của **lượt viewport trước**, xanh **trong khi lệnh thu hồi còn đang bay**.
  Hỏi thẳng cơ sở dữ liệu mới ra: **1/3 lượt thu hồi thật**. Cùng lúc, bài "đánh dấu đã đọc" **skip
  cả ba viewport** vì hộp thư rỗng — một tiêu chí nghiệm thu **chưa từng chạy**. Đã sửa cả hai.
  pgTAP **1286/1286** (trước 1233, **+53**) · unit **1448 pass / 16 skip** (trước 1385/10) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 494/507** (27,3 phút
  trên DB vừa `db:reset` + `seed:dev`) · `notifications.spec.ts` **21/21 xanh cả ba cỡ màn, 0 skip**
  · integration `m10-inbox-scope` **6/6 bằng JWT thật**.
  ⚠️ **13 bài đỏ = 2,56 %, TĂNG so với 1,85 % của M08-C** (mẫu số đổi 486 → 507 vì thêm 21 bài, và
  **cả 21 đều xanh**). **0/13 bài đỏ liên quan tới thông báo** — `grep` toàn bộ nhật ký lỗi ra 0 kết
  quả cho *thông báo · chuông · hộp thư · thu hồi*. 4 bài mang câu *"bấm nhiều lần vẫn không có hiệu
  lực"* ⇒ **nợ #15**; 9 bài rớt ở `toBeVisible` hết giờ ⇒ hình dạng **nợ #10**. Đã **kiểm chứ không
  đoán**: chạy cô lập ba spec ấy trên DB sạch, tải nhẹ — vẫn đỏ nhưng **ở viewport khác**, tức nhiễu
  chứ không phải thay đổi hành vi (thay đổi hành vi đỏ **cố định** ở mọi viewport). Cả ba thuộc
  **M03 · M04**, hai module M10 không đụng một dòng nào.

- **`2B · M08-C — XONG — Claude — 2026-08-08`** ⇒ **ĐÓNG module 11/14 (M08 Chuyển lớp)**. Ba nợ
  cuối của module, và **cả ba đều đã được hai đợt trước ghi ra rồi cố ý hoãn**.
  **1 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**
  **(1) 🔴 Nút "Duyệt" lần đầu HỎI LẠI**, sau khi mang nợ qua **cả hai** đợt trước. Lý do hoãn vẫn
  đúng khi nhìn lại — D-159 ở đợt B đã đổi hẳn nội dung câu hỏi cho bốn vai trò cấp xứ đoàn — nhưng
  cái giá là thật: suốt hai đợt, một cú bấm nhầm là **một ghi danh bị đóng không có đường lùi**.
  Hộp này **không phải bản sao** của hộp "Chuyển lớp": ở đường một bước người bấm xác nhận quyết
  định **của chính mình**, ở đây họ thi hành quyết định **của người khác** — nên câu hậu quả in
  **lớp đang sắp ghi vào**, và **nói ra khi nó khác lớp đại diện đề nghị** (ô ấy sửa được, một cú
  lăn chuột là đổi giá trị mà không ai bấm gì).
  **(2) Từ chối bắt buộc nêu lý do**, chặn ở **cả** màn hình lẫn Zod máy chủ. Nút "Từ chối"
  **cố ý KHÔNG** có hộp xác nhận: từ chối lùi được, và chồng hai lớp hỏi lại lên nhau là dạy người
  dùng bấm "Xác nhận" theo phản xạ — thứ làm hộp của "Duyệt" mất tác dụng.
  **(3) 🔴 Đề xuất hàng loạt, và chủ dự án chốt phạm vi NGƯỢC với phương án an toàn nhất (D-164):**
  *"Chọn tất cả"* lấy **mọi em khớp bộ lọc, kể cả em ở trang sau**, biết trước cái giá là người bấm
  xác nhận một danh sách **dài hơn thứ họ đang nhìn**. Bù lại: hộp xem lại **liệt kê đủ tên từng
  em**, con số nói ra **ngay trên nút**, kèm dòng *"trong đó N em ở trang khác"*. Danh sách dựng từ
  tập **đã lọc chưa cắt trang** (dựng từ trang đang xem là bỏ quên em thứ 26 trở đi) và **không tốn
  thêm một truy vấn nào**. Một cái bẫy được chặn **trước khi gửi**: chọn tất cả trên "Tất cả lớp"
  gom em nhiều cấp, mà **không lớp đích nào đúng cho tất cả**.
  **(4) 🔴 Phụ thuộc mà M08-B để ngỏ hoá ra là một câu TRẢ LỜI KHÔNG.** `07` §2.4 đòi xác nhận RLS
  `profiles` có cho nhân sự đọc tên nhau không — **không**: chỉ chính mình hoặc sáu vai trò cấp xứ
  đoàn, mà **hai người dùng chính của trang** (Trưởng ngành duyệt · GLV đại diện đề xuất) **không
  nằm trong sáu**. Nhúng thẳng sẽ cho họ một cột `null` **trong im lặng**. **D-163** — chủ dự án
  chốt mở một **cửa sổ hẹp**, **không** nới `profiles` (RLS lọc theo **dòng chứ không theo cột**).
  Bài quan trọng nhất của pgTAP `047` là bài **canh hiện trạng**: sau migration, GLV đại diện đọc
  thẳng `public.profiles` **vẫn chỉ thấy đúng một hàng của chính mình**.
  **(5) ⚠️ Cái giá đo được: `/promotions` chạm ĐÚNG TRẦN 6 lượt gọi của AC-13** (M08-A dùng 3–5).
  🔴 **Một thay đổi hành vi và một lỗi build lọt qua bốn cửa kiểm, E2E bắt được cả hai:** lượt E2E
  đầy đủ đầu tiên đỏ **15 bài**, trong đó `promotions` và `results` đỏ ở **cả ba viewport** — *đỏ
  đều ở mọi viewport* chính là chữ ký phân biệt một **thay đổi hành vi** với nợ #10. Cả hai là **bộ
  test chưa theo kịp mã**: `results.spec.ts` bấm "Duyệt" rồi đọc thẳng cơ sở dữ liệu nên hộp xác
  nhận mới làm ghi danh vẫn `active`; và `name: "Lọc"` khớp **hai** nút vì Playwright so tên theo
  **chứa chuỗi**. Sửa ở tầng **bộ test**, **không** đổi câu chữ giao diện để né bộ định vị. Lỗi thứ
  hai: một chú thích JSX đặt sai chỗ làm `next build` hỏng cú pháp, lọt qua vì tôi sửa **sau** lượt
  build đã chạy.
  pgTAP **1233/1233** (trước 1215, **+18**) · unit **1385 pass / 10 skip** (trước 1322, **+63**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 477/486** (22,7 phút
  trên DB vừa `db:reset` + `seed:dev`) · `promotions.spec.ts` **60/60 xanh cả ba cỡ màn**.
  ⚠️ **9 đỏ = 1,85 %, TĂNG so với 1,68 % của M08-B** (mẫu số cũng đổi 477 → 486 vì đợt này thêm 9
  bài, và cả 9 đều xanh). Phân loại bằng **ảnh chụp lỗi**: **6 bài** để lại nút *"Đang …"* vô hiệu
  ⇒ **nợ #10**; **1 bài** rớt ở `waitForURL` với 0 nút vô hiệu ⇒ **nợ #15**; **2 bài `committees`
  không mang chữ ký nào** — đúng hình dạng M05-C dặn là *có thể là lỗi thật*, nên đã **kiểm chứ
  không đoán**: chạy cô lập trên DB vừa reset + seed, `committees` + `promotions` **75/75 xanh**
  ⇒ biến số chi phối là **tải máy**, đúng kết luận M04-A.
  **Không bài nào rớt ở một khẳng định nghiệp vụ, không bài nào thuộc luồng chuyển lớp.**
  ✅ **Bằng chứng DƯƠNG TÍNH cho hộp xác nhận mới, không chỉ "không bài nào đỏ":**
  `results.spec.ts` — bài E2E **duy nhất** chạy hết đường ghi của module — **xanh trọn vẹn trên**
  **`mobile-360`**, tức hộp xác nhận đã được bấm qua và giao dịch duyệt vẫn đúng (ghi danh nguồn
  `completed`, ghi danh mới `active`); trên hai cỡ màn kia nó rớt ở bước **công bố Top 5 của M07**,
  tức **trước** phần chuyển lớp.

- **`2B · M08-B — XONG — Claude — 2026-08-07`** — đợt **CÓ MIGRATION** của module chuyển lớp.
  **1 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**
  **(1) 🔴 Một quy tắc nghiệp vụ nằm sẵn trong cơ sở dữ liệu từ Phase 2 mà CHƯA AI ĐỌC LẦN NÀO.**
  Xứ đoàn đã đánh dấu đúng 5 lớp cuối ngành ngay từ đầu, nhưng **không màn hình nào dùng dấu ấy**.
  Nay đề xuất lên lớp ở lớp cuối ngành **nêu tên từng bí tích em còn thiếu**. Đây là **cảnh báo,
  KHÔNG chặn** việc lên lớp — nhưng người duyệt **bắt buộc nêu ý kiến** trước khi bấm Duyệt, để
  sang năm còn đọc lại được xứ đoàn đã cân nhắc điều gì.
  **(2) 🔴 Gửi lại một đề xuất bị từ chối đang XOÁ SẠCH lịch sử.** Trưởng ngành từ chối và ghi rõ
  lý do; đại diện sửa rồi gửi lại — và **ai từ chối, lúc nào, vì sao biến mất không dấu vết**. Nay
  có một **sổ nhật ký riêng chỉ ghi thêm**, không ai sửa và không ai xoá được, kể cả Quản trị viên
  hệ thống. Màn hình hiện lại đủ bốn bước: *gửi → từ chối vì … → gửi lại → duyệt*.
  **(3) 🔴 Đóng ghi danh ở trang Lớp trong lúc đang có đề xuất chờ duyệt để lại một đề xuất MỒ
  CÔI** — nó trỏ vào một ghi danh không còn mở nên **không bao giờ duyệt được nữa**, và cũng không
  ai xoá được. Nay chặn ở **cả hai tầng**; dòng của em mang huy hiệu *"Chờ duyệt chuyển lớp"* và
  biểu mẫu "Kết thúc" biến mất, kèm một câu nói ra việc phải làm trước. **Nút "Tạm nghỉ" vẫn chạy**
  — tạm nghỉ không đóng ghi danh, và chặn nó là chặn một việc chính đáng (em ốm dài ngày).
  **(4) Năm học đã đóng nay không đề xuất và không duyệt chuyển lớp được nữa** kể cả khi gọi thẳng
  vào cơ sở dữ liệu. Hỏi **cả hai** năm: năm em đang học **và** năm em sẽ vào. Quản trị viên hệ
  thống vẫn là ngoại lệ duy nhất, có bài kiểm chứng minh.
  **(5) Bốn vai trò cấp xứ đoàn hết phải diễn qua hai biểu mẫu** — một nút **"Chuyển lớp"**, hỏi
  lại một lần rồi xong, và cả hai bước nằm trong **một giao dịch**. **Không ai được thêm quyền
  gì** — đúng bốn vai trò ấy hôm nay đã làm được việc này.
  🔴 **Một lỗi thật lọt qua CẢ BỐN cửa kiểm, chỉ E2E bắt được:** câu truy vấn tôi thêm vào trang
  chi tiết lớp **nhập nhằng** (bảng đề xuất có hai đường nối về bảng ghi danh), làm **cả trang chi
  tiết lớp 404**. `lint` · `typecheck` · `test` · `build` đều xanh. Đã sửa và đo lại.
  pgTAP **1215/1215** (trước 1162, **+53**) · unit **1322 pass / 10 skip** (trước 1282, **+40**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 469/477** (24,5 phút
  trên DB vừa `db:reset` + `seed:dev`) · `promotions.spec.ts` **57/57 xanh cả ba cỡ màn**.
  ⚠️ **8 bài đỏ = 1,68 %, TĂNG so với 1,07 % của M08-A** (mẫu số cũng đổi 468 → 477 vì đợt này
  thêm 9 bài, và cả 9 đều xanh). Phân loại bằng **ảnh chụp lỗi**: **6 bài** để lại nút *"Đang lưu…"*
  ở trạng thái vô hiệu ⇒ **nợ #10**; **2 bài** rớt ở *"bấm liên kết, thanh địa chỉ không đổi"* ⇒
  **nợ #15**. **Không bài nào rớt ở một khẳng định nghiệp vụ, không bài nào thuộc luồng chuyển lớp.**
  ⚠️ **Một điều tôi KHÔNG kết luận được:** bài `results.spec.ts` rớt ở bước *khóa bảng điểm* của
  M07 **trước khi** chạy tới bước *duyệt chuyển lớp*, nên trên cỡ màn ấy phần tôi vừa sửa **chưa
  được chạy tới**; nó xanh trọn vẹn trên cỡ điện thoại.
  ⚠️ **Cái giá đã biết, giữ nguyên từ M08-A: nút "Duyệt" VẪN CHƯA hỏi lại** — thuộc đợt C.

- **`2B · M08-A — XONG — Claude — 2026-08-06`** ⇒ **MỞ module 11/14 (M08 Chuyển lớp**, 56/75,
  **1 lỗi CRITICAL).** Đợt rẻ nhất và an toàn nhất theo đúng thứ tự `07_IMPLEMENTATION_IMPACT` §3:
  **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**
  **(1) 🔴 Lỗi CRITICAL duy nhất của module là một phép nhân.** Trang "Lên lớp và chuyển lớp" hỏi
  cơ sở dữ liệu **hai câu cho MỖI em**, rồi tải về ghi danh của **mọi năm học**, không lọc, không
  chia trang. Với ~900 em toàn xứ đoàn đó là **khoảng 1.800 lượt hỏi cho một lần mở trang**, và
  một trang phải cuộn hàng chục nghìn pixel. Nay hệ thống hỏi **một lần cho cả trang** — *"tôi phụ
  trách những lớp nào"* — và cả trang dùng **3–5 câu hỏi cố định**, dù có 50 em hay 5.000 em.
  **(2) Bảng tiến độ theo lớp lần đầu tồn tại.** `Lớp · Sĩ số · Chưa đề xuất · Chờ duyệt · Đã
  duyệt · Từ chối`, **mỗi con số bấm được** để đi thẳng vào đúng lớp ở đúng trạng thái. Biên bản
  audit chấm đây là khoảng trống lớn nhất: người duyệt không có cách nào biết **còn bao nhiêu em
  nữa thì xong**. Con số đếm trên **toàn bộ phạm vi**, không đếm trên trang đang xem.
  **(3) 🔴 Tài liệu đòi "mặc định giữ nhánh A/B" từ đầu, hệ thống chưa bao giờ làm.** Ô lớp đích
  lấy lớp **đầu danh sách xếp theo tên**, nên mọi em lớp **Ấu 1B** đều được đề nghị sẵn sang **Ấu
  2A**. Điều tệ hơn không phải việc sửa tay từng em: ô ấy **tự điền sẵn một giá trị hợp lệ**, nên
  một cú bấm "Lưu" là ra một đề xuất trông hoàn chỉnh mà người dùng **chưa thật sự quyết định**.
  **(4) 🔴 Mười một loại lỗi khác nhau đi qua đúng HAI câu tiếng Việt.** Nặng nhất: ghi danh của
  em đã đóng thì màn hình báo *"Lớp đích … không hợp lệ"* — chỉ sai chỗ, nên người dùng đổi lớp
  đích rồi bấm lại, và hỏng y hệt. Ba câu lỗi viết kỹ từ Phase 5 **chưa từng hiện ra một lần nào**.
  **(5) Kiểm chéo bàn giao từ M07 đã ĐO, không chỉ đọc mã.** Từ M07-B một cột điểm **ẩn được**, mà
  ẩn cột là **đổi điểm trung bình** module này đọc để cảnh báo. Hai bên vốn đã nhất quán, nhưng nay
  có **4 bài kiểm** canh đúng hai con số 7,00 → 10,00 thay vì một câu khẳng định.
  unit **1282 pass / 10 skip** (trước 1224, **+58**) · pgTAP **1162/1162** (trước 1158, **+4**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 463/468** (21,7 phút
  trên DB vừa reset + seed) · bộ E2E mới của trang này **48/48 xanh cả ba cỡ màn**.
  ⚠️ **5 bài đỏ = 1,07 %** (M07-C: 2,4 %), nhưng **mẫu số cũng đổi** 420 → 468 nên hai tỷ lệ không
  so trực tiếp được. Ba bài rớt ở *"ghi xong, màn hình chưa kịp hiện"* (**nợ #10**), hai bài rớt ở
  *"bấm liên kết, thanh địa chỉ không đổi"* (**nợ #15**). **Không bài nào rớt ở một khẳng định
  nghiệp vụ, và không bài nào thuộc luồng chuyển lớp.**
  ⚠️ **Cái giá đã biết của đợt này: nút "Duyệt" VẪN CHƯA hỏi lại**, trong khi duyệt là thao tác
  đóng ghi danh cũ và mở ghi danh mới, **không có đường lùi**. Hoãn có chủ ý sang đợt C vì
  **D-159** sẽ đổi hẳn nội dung câu hỏi cho bốn vai trò cấp xứ đoàn — làm bây giờ là làm hai lần.

- **`2B · M07-C — XONG — Claude — 2026-08-06`** ⇒ **M07 ĐÓNG (module 10/14).** Đợt cuối lo
  **vòng đời**: cái gì đổi được sau khi khóa, và cái gì mất đi khi xếp hạng lại.
  **1 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**
  **(1) 🔴 "Khóa bảng điểm" và "công bố kết quả cho phụ huynh" là HAI việc, mà hệ thống buộc
  chung làm một.** Muốn công bố thêm một cột sau khi đã khóa thì phải nhờ Quản trị viên hệ thống
  **mở khóa cả bảng điểm** — tức mở luôn quyền sửa điểm và hệ số cho cả lớp, **đúng vào lúc điểm
  vừa được chốt**. Biên bản xếp đây là hạng mục **rủi ro nghiệp vụ cao nhất** của module và bảo
  làm cuối cùng. Nay tách ra, **cả hai chiều** bật và tắt. **Ai được công bố thì KHÔNG đổi** — chỉ
  đổi *lúc nào* công bố được.
  🔴 **Và quả mìn nằm ở một bảng khác hẳn:** việc công bố đi qua **ba** lớp kiểm, lớp thứ ba là
  một quy tắc nằm trên **bảng điểm số** chứ không phải bảng cột điểm. Nới hai lớp đầu mà quên lớp
  thứ ba thì thao tác vẫn hỏng, với **đúng câu lỗi cũ**, ở một chỗ không ai nghĩ tới khi đọc lại
  thay đổi. Luật cấm cũ **giữ nguyên nguyên vẹn**: ai gửi thẳng lệnh vào cơ sở dữ liệu khi bảng
  điểm đã khóa vẫn bị từ chối — **kể cả** khi lệnh ấy chỉ đổi mỗi cờ công bố.
  **(2) 🔴 Ẩn một bảng Top 5 rồi bấm công bố lại là ÂM THẦM XẾP HẠNG LẠI.** Em đứng hạng 5 hôm
  trước biến khỏi bảng, **không ai được báo**, và bản cũ **không còn ở đâu** — trong khi nhãn nút
  chỉ ghi *"Ẩn khỏi portal"*. Tài liệu khuyến nghị **cấm hẳn** việc tính lại; chủ dự án chọn hướng
  ngược lại: **cho tính lại, nhưng bản đang có phải được lưu lại** trước khi bị thay. Một bảng
  Top 5 nay có **ba** trạng thái chứ không phải hai, và trạng thái ở giữa có **hai nút khác hẳn
  nhau** — *"Hiện lại bản đang có"* (giữ nguyên danh sách) và *"Chốt lại danh sách"* (xếp hạng lại,
  bản cũ xuống lịch sử). Kèm một chỗ siết: **bảng đã từng công bố thì không xóa được nữa** — luật
  cũ để **khoá ngoại trả lời hộ** bằng một câu sai hẳn nghĩa, đúng cái lỗi đợt B vừa chữa ở cột
  điểm.
  **(3) 🔴 Bốn hộp hỏi thô của trình duyệt CUỐI CÙNG CỦA TOÀN HỆ THỐNG đã hết.** Nay cả sáu hộp
  xác nhận của trang bảng điểm đều nêu hậu quả **bằng tên riêng** (tên cột · tên lớp · tên em ·
  tên người viết · số bản lịch sử), bẫy được phím Tab, đóng bằng `Escape` và trả con trỏ về đúng
  nút vừa rời đi — thứ hộp thoại của trình duyệt không làm được. Đây là mục **duy nhất** trong 15
  mục nghiệm thu chung còn treo suốt 14 đợt trước.
  **(4) Cột đã ẩn nay có đường hiện lại** ngay trên màn hình — món nợ do chính đợt B mở ra **ba
  ngày trước**. ⚠️ Với một cột đang ở trạng thái *"Đã công bố"* thì hiện lại là **phụ huynh thấy
  lại điểm ngay lập tức**, và hộp xác nhận nói thẳng điều đó.
  pgTAP **1158/1158** (trước 1115, **+43**) · unit **1224 pass / 10 skip** (trước 1210, **+14**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 410/420** (21,9 phút
  trên DB vừa reset + seed).
  ⚠️ **Tỷ lệ E2E đỏ tăng từ 1,4 % lên 2,4 %, và tôi không giấu nó sau chữ "đã biết".** **Bốn** trong
  mười bài rớt ở *"bấm một liên kết, thanh địa chỉ không đổi trong 20–30 giây"* — chữ ký đúng
  nguyên văn của **nợ #15**; sáu bài kia rớt ở *"thứ lấy từ máy chủ chưa hiện sau lượt làm mới"* —
  chữ ký **nợ #10**. **Không bài nào rớt ở một khẳng định về nghiệp vụ.** Hai bài của bảng điểm rớt
  ở **bước có trước đợt này**, nên trên hai cỡ màn ấy các bước mới **chưa được chạy tới**; trên cỡ
  máy tính thì bộ bảng điểm **xanh trọn vẹn**, gồm cả bốn bước mới. ⚠️ **Nhưng KHÔNG kết luận được
  rằng đợt C vô can:** nó cộng thêm khoảng sáu lượt làm mới trang vào chính bộ test ấy, mà mỗi lượt
  là một lần rút thăm với hai món nợ trên — bộ test dài ra thì xác suất rớt ở đâu đó tăng theo, kể
  cả khi mọi bước mới đều đúng.

- **`2B · M07-B — XONG — Claude — 2026-08-05`** — ⚠️ **đính chính (M07-C):** bản ghi cũ nói đây là
  *"đợt duy nhất có migration của module"* — **sai**, đợt C có migration thứ hai. Câu **vẫn đúng**:
  đây là **migration duy nhất của cả Giai đoạn 2B có đụng tới dữ liệu**.
  **1 migration · 4 thay đổi phân quyền · 0 `alter table` · 0 backfill cấu trúc · 1 lượt dọn dữ
  liệu (D-153).**
  **(1) 🔴 "Ai được khóa bảng điểm" có BA nơi nói ba điều khác nhau.** Bảng phân quyền nói *"chỉ
  Giáo lý viên đại diện"*; hàm trong cơ sở dữ liệu lại cho cả Xứ đoàn trưởng · Phó Xứ đoàn · Thư
  ký; còn phép tính quyết định **hiện nút hay không** thì lệch cả hai và **không kiểm lớp** — nên
  một Giáo lý viên đại diện của lớp A **nhìn thấy nút "Khóa bảng điểm" trên lớp B**. Biên bản
  nghiệm thu gọi đây là *"mâu thuẫn chưa giải quyết"* và **từ chối viết tiêu chí** cho tới khi chủ
  dự án chốt. Nay cả ba trỏ về **một chỗ duy nhất**: đại diện + Giáo lý viên **của chính lớp đó**,
  cộng Quản trị viên hệ thống làm đường thoát cuối năm.
  ⚠️ **Đây là giảm quyền của người ĐANG dùng — phải báo trước cho Ban điều hành xứ đoàn**, nếu
  không họ mở bảng điểm ra, thấy mất nút "Khóa", và kết luận là hệ thống hỏng.
  Kèm: bấm khóa **lần thứ hai** không còn đẩy lùi mốc khóa — mà mốc ấy là thứ **duy nhất** trả lời
  được câu *"bảng điểm này chốt lúc nào"*, và hệ thống không lưu lịch sử.
  **(2) 🔴 Xóa một cột tạo nhầm là việc KHÔNG LÀM ĐƯỢC, và câu lỗi thì nói sai.** Người dùng đọc
  *"Cột đã có điểm"* trong khi **chưa nhập điểm nào** — vì lỗi cũ ghi cả danh sách lớp nên cột nào
  cũng có sẵn một dòng trống cho mỗi em, và ràng buộc cơ sở dữ liệu chặn lại. Nay: cột **chưa có
  điểm** → *"Xóa cột"*, mất hẳn cùng những dòng rác ấy; cột **đã có điểm** → *"Ẩn cột"*, điểm giữ
  nguyên. 🔴 Và **ẩn phải ẩn thật**: mọi màn hình đã lọc cột ẩn từ lâu, nhưng **luật phân quyền thì
  chưa**, nên phụ huynh hỏi thẳng cơ sở dữ liệu vẫn đọc được. Một điều chỉ đúng trên màn hình
  **không phải một bảo đảm**.
  **(3) 🔴 Một cú bấm "Lưu điểm" đóng dấu "đang chỉnh tay" lên CẢ LỚP**, kể cả những em không ai
  đụng vào — và từ đó nút *"Lấy đề xuất mới"* bỏ qua gần hết lớp trong im lặng. Nay dấu chỉ bật khi
  điểm **khác** đề xuất của máy, và **tự gỡ** khi gõ trả lại đúng con số ấy. Chủ dự án chốt dọn
  luôn những dấu đã đặt sai trong dữ liệu hiện có, ở **đúng** những ô không có bàn tay người nào.
  Con số của nút ấy cũng đếm gộp cả dòng bị bỏ qua nên **nó nói sai**; nay nói ra **hai** số.
  **(4) 🔴 Ô "Mức hiển thị" của nhận xét mặc định là CÔNG KHAI** — viết vội một câu về một em rồi
  bấm Thêm là câu ấy **ra thẳng cổng phụ huynh**, không một dòng cảnh báo. Nay mặc định **nội bộ**,
  chọn công khai mới hiện câu nói rõ hậu quả. Và **bất kỳ ai dạy lớp cũng xóa được nhận xét của
  người khác** trong khi hệ thống **không lưu lịch sử**; nay chỉ người viết, Giáo lý viên đại diện
  lớp và Ban điều hành xứ đoàn — luật đặt vào **cả sửa lẫn xóa**, vì siết mỗi đường xóa thì người
  bị chặn vẫn sửa nội dung thành bất cứ thứ gì.
  **(5)** Hàng rào *"năm học đã đóng thì không ghi được"* đóng nốt **bốn bảng** của module. Đáng
  ghi: module này chứa **cả hai kiểu** cùng lúc — ba bảng chặn được bằng luật phân quyền, riêng
  bảng điểm số chỉ chặn được **bên trong hàm cơ sở dữ liệu**, vì mọi đường ghi của nó đi qua hàm
  chạy dưới quyền chủ sở hữu và bỏ qua luật phân quyền.
  pgTAP **1115/1115** (trước 1061, **+54**) · unit **1210 pass / 10 skip** (trước 1185, **+25**) ·
  lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 414/420** trên DB vừa
  `db:reset` + `seed:dev` — 6 đỏ = **1,4 %**, đúng bằng tỷ lệ của M07-A.

- **`2B · M07-A — XONG — Claude — 2026-08-05`** — mở module 10/14, đi đúng thứ tự phụ thuộc mà
  `07_IMPLEMENTATION_IMPACT` §7 của module đã vẽ: **0 migration · 0 thay đổi phân quyền · 0 dòng dữ
  liệu bị đụng**, pgTAP giữ nguyên **1061/1061** sau một lượt `db:reset` sạch.
  **(1) 🔴 Kiểm soát chống công thức lạ trong file Excel đang được áp dụng NỬA VỜI — và nửa vời tệ
  hơn không có, vì bảng kiểm ghi là "đã có".** Tên thánh và họ tên đi qua bộ lọc; **tiêu đề cột điểm
  thì không** — mà đó là một ô văn bản tự do 120 ký tự do chính Giáo lý viên gõ, đặt tên cột là
  `=1+1` hoàn toàn hợp lệ. Tệp bảng điểm **đi ra ngoài hệ thống** (gửi cho ngành/xứ đoàn), và người
  nhận thường lưu lại thành CSV — lúc đó khai thác được thật.
  🔴 **Và bài kiểm cũ LÀ MỘT PHẦN của lỗi, không chỉ bỏ sót nó:** nó gọi hàm lọc **tách rời** rồi
  đếm số phần tử tiêu đề, nên nó xanh **vĩnh viễn** bất kể hàm dựng bảng có gọi bộ lọc hay không.
  Bài mới **quét mọi ô văn bản** mà hàm dựng ra.
  **(2) 🔴 Bấm "Lưu điểm" một lần là ghi CẢ DANH SÁCH LỚP kể cả ô trống — và đó là gốc rễ của BA
  lỗi khác nhau.** Cột nào cũng lập tức có 50 dòng điểm, mà ràng buộc cơ sở dữ liệu không cho xóa
  cột còn dòng ⇒ **một cột tạo nhầm không bao giờ xóa được nữa**, và câu lỗi người dùng đọc được là
  *"Cột đã có điểm"* trong khi họ **chưa nhập điểm nào**. Hai người cùng mở một cột thì người lưu
  sau **ghi đè sạch** công người lưu trước, không cảnh báo và **không có cách lấy lại**. Một cú bấm
  đóng dấu *"đang chỉnh tay"* lên **cả 50 em**, làm cơ chế đề xuất điểm chuyên cần tự động không bao
  giờ cập nhật được nữa. Nay chỉ gửi **ô đã đổi** — thứ tài liệu gọi là **điều kiện tiên quyết** cho
  ba hạng mục của đợt sau.
  **(3) 🔴 D-150 — hai tiêu chí trong CÙNG một tài liệu đã duyệt mâu thuẫn nhau.** Cổng phụ huynh và
  bảng điểm nội bộ tính trung bình theo hai cách khác nhau và **không chỗ nào giải thích**, nên phụ
  huynh đối chiếu ra hai con số rồi chất vấn Giáo lý viên. Tiêu chí nghiệm thu đòi hiện *"tính trên
  3/**5** cột"* — nhưng con số 5 là **tổng số cột của lớp**, tức nói cho phụ huynh biết lớp còn 2 cột
  chưa công bố, đúng thứ một tiêu chí khác của cùng tài liệu **cấm**. Chủ dự án chốt: **cả hai con
  số lấy từ phần đã công bố**.
  **(4)** Hệ số mặc định nay đọc từ **cấu hình năm học** (bảng ấy có thật, có màn hình, có phân quyền
  từ Phase 5 — mà biểu mẫu tạo cột **chưa từng đọc nó**, nên Quản trị viên đổi hệ số mặc định thì
  giao diện không đổi một chữ) · câu lỗi tiếng Việt riêng cho **6 luồng** vốn dùng chung một câu
  *"Không thể lưu bảng điểm. Vui lòng thử lại."* — một câu **hứa rằng thử lại sẽ được** trong khi
  bấm lại thì hỏng y hệt · **SW-04**: khóa bảng điểm rồi bấm Lưu vẫn báo *"Đã cập nhật cột điểm."*
  vì luật phân quyền **lọc dòng trong im lặng**, năm thao tác ghi nay đều đếm số dòng thật · **nợ
  #14** · **nợ #20 ĐÓNG HẲN** (chỗ cuối cùng của toàn hệ thống) · phần *"chờ cứng 5 giây"* của
  **nợ #10**.
  Unit **1185 pass/10 skip** (trước 1151/10, **+34**) · pgTAP **1061/1061** (**+0**) · lint **0
  warning** · typecheck ✓ · build ✓ 28/28 · **E2E toàn bộ 414/420** trên DB vừa `db:reset` +
  `seed:dev` — 6 đỏ = **1,4 %** (M06-C: 8 đỏ/420 = 1,9 %), **0 bài nào thuộc bảng điểm**

- **`2B · M06-C — XONG — Claude — 2026-08-05`** ⇒ **M06 ĐÓNG (module 9/14).** Đợt cuối là đợt
  **giao diện thuần: 0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng** — pgTAP giữ
  nguyên **1061/1061** sau một lượt `db:reset` sạch, và đó chính là bằng chứng ranh giới phân quyền
  của module không nhúc nhích.
  **(1) Biểu mẫu soạn bài có 12 ô, và nó nằm TRÊN toàn bộ danh sách bài.** Trên điện thoại 360px,
  người soạn phải cuộn hết một biểu mẫu 12 khối dọc mới nhìn thấy bài đầu tiên của giáo án. Nay
  biểu mẫu mở trong một **hộp thoại trượt lên từ đáy màn hình**, trang chỉ còn một nút *"Thêm mục
  giáo án"*. Chủ dự án chọn **một cách hiển thị duy nhất cho cả điện thoại lẫn máy tính**
  (**D-148**): làm hai bản khác nhau theo cỡ màn hình thì máy phải tự đoán cỡ màn hình bằng
  JavaScript, gây **nhấp nháy lúc trang vừa tải**, và mọi bài kiểm phải viết hai lần.
  **(2) 12 ô chia ba nhóm, hai nhóm ít dùng gập lại** (**D-149**) — và **điều kiện bắt buộc để được
  phép gập là tiêu đề nhóm phải ĐẾM số ô đã điền**: *"Nội dung buổi học · đã điền 4/7"*, đếm theo
  **thứ đang gõ dở** chứ không theo dữ liệu đã lưu. Gập một nhóm đang có nội dung mà không nói ra
  là giấu mất đúng thứ người sửa cần soát lại.
  🔴 **Nhóm bắt buộc KHÔNG được gập, và đây là ràng buộc kỹ thuật chứ không phải sở thích:** trình
  duyệt từ chối lượt gửi có một ô bắt buộc đang bị ẩn — người dùng bấm Lưu và **không có gì xảy
  ra**, không một câu nào giải thích.
  **(3) Hai hộp xác nhận thô cuối cùng của module** thành hộp thoại chuẩn, **và nói ra điều câu cũ
  giấu mất**: xoá một mục giáo án là **xoá luôn tệp đính kèm** khỏi kho lưu trữ — hệ thống vẫn làm
  vậy từ Phase 4, chỉ chưa bao giờ nói. Nợ hộp xác nhận thô của toàn hệ thống còn **4 chỗ**, tất cả
  ở M07.
  **(4) 🔴 Một lỗ hổng phản hồi có thật, lộ ra vì đợt này phải đọc lại đường đóng biểu mẫu:** sửa
  xong một mục giáo án **không có một chữ xác nhận nào** — câu thông báo bị chính lượt đóng biểu mẫu
  xoá mất. Đúng hình dạng lỗi M05-B đã trả giá. Nay câu ấy do thẻ mục giữ nên sống sót; ngược lại,
  hộp thoại **thêm** mục **cố ý không tự đóng**, vì soạn giáo án là việc thêm nhiều mục liên tiếp.
  **(5)** Hai ô chọn thả xuống cuối cùng của module về component chuẩn — và **nhánh "giữ lại người
  đang được chọn" của M06-A đi qua nguyên vẹn**, bài unit cũ không phải sửa một chữ. Hai ô có ranh
  giới riêng tư nay nói ra ai đọc được, và ô đi ra cổng phụ huynh **không phải** ô mà biên bản audit
  nêu, mà là **"Chuẩn bị"**.
  Unit **1151 pass/10 skip** (trước 1140/10, **+11**) · pgTAP **1061/1061** (**+0**) · lint **0
  warning** · typecheck ✓ · build ✓ 28/28 · bộ `teaching-plan` E2E **15/15** trên ba viewport (trước
  12/12) · **E2E toàn bộ 412/420** trên DB vừa `db:reset` + `seed:dev` — 8 đỏ = **1,9 %** (M06-B:
  11 đỏ / 417), và **0 bài nào thuộc giáo án**

- **`2B · M06-B — XONG — Claude — 2026-08-05`** — đợt **duy nhất có migration** của module giáo án,
  và là đợt trả lời **cả ba** câu còn để ngỏ của biên bản nghiệm thu. **1 migration · 1 thay đổi
  NỚI quyền · 2 thay đổi SIẾT quyền · 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng** —
  pgTAP **1061/1061** (trước 1033, **+28**).
  **(1) 🔴 Ba vai trò cấp xứ đoàn đang sửa được giáo án của mọi lớp, và đó là mâu thuẫn giữa hai
  tài liệu chứ không phải lỗi lập trình.** Bảng phân quyền cho Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký
  quyền sửa; quy trình WF-07 lại chỉ nêu người làm là **Giáo lý viên đại diện lớp**. Chủ dự án chốt
  theo WF-07 (**D-144**). Từ nay ba vị **vẫn xem đầy đủ**, chỉ mất nút sửa.
  ⚠️ **Đây là giảm quyền của người ĐANG dùng — phải báo trước cho Ban điều hành xứ đoàn**, nếu
  không họ mở giáo án ra, thấy mất nút "Sửa", và kết luận là hệ thống hỏng.
  **Quản trị viên hệ thống giữ quyền sửa** (chủ dự án xác nhận 2026-08-05): một lớp **chưa phân
  công Giáo lý viên đại diện** thì sau khi siết sẽ không còn tài khoản nào lập được giáo án cho lớp
  đó — đây là đường thoát duy nhất khi cần chữa cháy.
  **(2) Có người ghi được giáo án mà không đọc lại được** — tạo xong, tải lại trang là **trắng**.
  Nguyên nhân: hệ thống mang **hai cách hiểu "thuộc lớp"** (theo thẻ đăng nhập, và theo sổ phân công
  đội ngũ), phần đọc dùng cách hẹp còn phần ghi dùng cách rộng. **D-145** nới phần đọc cho **riêng**
  giáo án. Người bị dính đúng hai kiểu, đều có thật ở xứ đoàn thiếu người: **Trưởng/Phó ngành được
  xếp đứng một lớp thuộc ngành khác**, và **Thủ quỹ đứng lớp**. **Tệp đính kèm đi theo giáo án**
  (xác nhận 2026-08-05) — cho đọc nội dung mà không cho tải tệp thì đúng những người ấy nhìn thấy
  tên tệp và nút "Tải xuống" rồi bấm vào bị từ chối.
  **(3) Năm học đã đóng vẫn nhận ghi giáo án** — nay hết. Đây là món nợ M05 vừa trả, nhưng lời giải
  **ngược lại**: ở điểm danh hàng rào phải nằm trong hàm cơ sở dữ liệu, ở đây nằm thẳng trong luật
  phân quyền. Quản trị viên hệ thống vẫn là ngoại lệ.
  **(4) 🔴 Hai người cùng sửa một mục giáo án thì người lưu sau xoá sạch công của người lưu trước** —
  không cảnh báo, và **không có cách nào lấy lại** vì hệ thống không lưu lịch sử. Nay lượt lưu mang
  theo phiên bản mình đang giữ; ai cầm bản cũ sẽ bị từ chối kèm câu nói rõ và nút *"Tải lại mục
  này"* (**D-146**). Cái bẫy nằm ở **độ chính xác thời gian**: mốc phiên bản chính xác tới **micro
  giây**, mà kiểu ngày giờ của JavaScript chỉ tới **mili giây** — đi qua nó một vòng là phép so
  **không bao giờ khớp**, và hàng rào chống ghi đè sẽ chặn chính người đang sửa.
  🔴 **Một lỗi thật của đợt này lọt qua CẢ BỐN cửa kiểm.** Thêm đúng một dòng khai báo câu thông báo
  vào tệp Server Action làm **chết cả trang giáo án**; `lint` · `typecheck` · `test` · `build` đều
  báo xanh, chỉ lượt chạy thật mới lộ. Đã chuyển chỗ khai báo và **dựng thêm một cửa kiểm mới** để
  lỗi cùng loại không lọt ở module khác.
  Unit **1140 pass/10 skip** (trước 1131/10, **+9**) · pgTAP **1061/1061** (**+28**) · lint **0
  warning** · typecheck ✓ · build ✓ 28/28 · bộ `teaching-plan` E2E **12/12** trên ba viewport (trước
  6/6) · E2E toàn bộ **406/417** (11 đỏ = **2,6 %**, **0 bài thuộc giáo án**)
  🔴 **Và một phát hiện về chính cách đo:** hai lượt E2E toàn bộ trên **cùng một mã nguồn** cho **bộ
  bài đỏ khác nhau**, vì **một số bài tiêu thụ dữ liệu seed** — `staff-directory` xoá mất hồ sơ nhân
  sự "chưa từng dùng" nên lượt sau đỏ oan. Lượt đo đầu (407/417) đã bị bỏ vì chạy trên DB không
  sạch; số dùng chính thức là lượt sau `db:reset` + `seed:dev`

- **`2B · M06-A — XONG — Claude — 2026-08-04`** — nhóm *"S, độc lập"* và *"S, siết an toàn"* của
  module điểm cao nhất hệ thống (65/75). **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị
  đụng** — pgTAP giữ nguyên **1033/1033**, và đó chính là bằng chứng ranh giới phân quyền không
  nhúc nhích.
  **(1) Thông báo THÀNH CÔNG đang hiện màu đỏ.** Chỗ gọi `FormMessage` quên khai `tone`, mà mặc
  định của component là `danger`. Nên câu *"Đã lưu tài liệu vào kho riêng tư."* không chỉ đỏ: nó
  mang `role="alert"` và trình đọc màn hình đọc **"Lỗi:"** trước một thông báo thành công.
  **(2) Ô chọn người dạy mời chọn người mà cơ sở dữ liệu chắc chắn từ chối** — nó lọc "còn hiệu
  lực" mà không lọc "còn phụ trách lớp **vào ngày ấy**", trong khi dữ liệu để lọc **đã nằm sẵn**
  trong tay từ Phase 4. 🔴 Cái bẫy khi sửa còn nặng hơn lỗi: chỉ lọc rồi thôi thì `<select>` mất
  giá trị đang giữ sẽ nhảy về lựa chọn đầu tiên — mở một mục cũ và **chỉ đổi mỗi ngày** cũng đủ để
  người dạy bị thay bằng một cái tên chưa ai bấm vào, rồi lượt lưu ghi đè.
  **(3) Câu lỗi viết rất kỹ từ Phase 4 chưa từng hiện ra một lần nào.** Mọi lỗi validation rơi vào
  *"Không thể lưu giáo án. Vui lòng thử lại."* — một câu **hứa rằng thử lại sẽ được**, trong khi
  bấm lại y hệt thì hỏng y hệt. Và mọi lỗi trùng dữ liệu đều nói về **"ngày"**, kể cả khi hai người
  cùng tạo giáo án cho một lớp — lúc ấy biểu mẫu **chỉ có đúng một ô tên**, không có ô ngày nào.
  **(4) 🔴 Trần 5 MB của tài liệu giáo án là một lời hứa KHÔNG THỂ giữ** — đúng cái bẫy M12-C đã
  trả giá một lần: `bodySizeLimit` của nền tảng là **4,5 MB** và áp cho **mọi** Server Action, nên
  tệp 4,5–5 MB chết ở tầng hạ tầng bằng một trang lỗi tiếng Anh, trước khi câu tiếng Việt kịp chạy.
  Dòng chữ *"tối đa 5 MB"* dưới ô chọn tệp **mời** người dùng làm đúng thứ chắc chắn hỏng. Nay trần
  là **4 MB** — đúng con số D-137 đã chốt cho toàn hệ thống, một sự thật chứ không phải hai.
  **(5) Phụ huynh gõ thẳng địa chỉ trang quản trị giáo án vẫn thấy khung trang** với tên lớp thật
  và câu *"Giáo án chưa có bài dạy hoặc bài kiểm tra."* — RLS đã lọc sạch dữ liệu nên **không rò rỉ
  gì**, nhưng câu ấy là một lời nói dối về một giáo án đang có đầy bài. Nay 404.
  **(6)** Link tải tệp là action **duy nhất** của module không kiểm quyền theo lớp — nay từ chối
  **trước khi** chạm Storage. Nhân sự chưa có lớp nào hết thấy màn hình trắng không giải thích. Lỗi
  của RPC lịch 7 ngày hết bị nhầm thành *"tuần này không có bài"*. Trả **nợ #14** và **nợ #20**.
  Unit **1131 pass/10 skip** (trước 1090/10, **+41**) · pgTAP **1033/1033** (**+0**) · lint **0
  warning** · typecheck ✓ · build ✓ 28/28 · bộ `teaching-plan` E2E **6/6** trên ba viewport (**ba
  lượt chạy riêng đều 6/6**) · E2E toàn bộ **397/411** (14 đỏ = **3,4 %**, **0 bài thuộc giáo án**)
- **Quyết định chủ dự án 2026-08-04 (M06):** **D-144** (🔴 **SIẾT** — Xứ đoàn trưởng/phó/thư ký chỉ
  **XEM** giáo án; giải quyết mâu thuẫn giữa `docs/05` và WF-07) · **D-145** (**NỚI** — đội ngũ lớp
  đọc được giáo án lớp mình, sửa cho **riêng** giáo án chứ không sửa định nghĩa dùng chung) ·
  **D-146** (chống ghi đè bằng **kiểm phiên bản**, không lưu lịch sử) · **D-147** (mục "Kiểm tra"
  **không** sinh cột điểm ở M07 — hai module giữ độc lập). **Cả ba việc đầu nằm ở đợt B.**
  ⚠️ **D-144 giảm quyền của người ĐANG dùng — phải báo trước cho Ban điều hành xứ đoàn.**
- 🔴 **Hai chỗ tài liệu audit của M06 ghi SAI, đã kiểm chứng bằng mã nguồn** (ghi đính chính ở `16`,
  **không sửa** `03`/`04`/`08`): fixture mà **TB-09** yêu cầu **không dựng được** — hai trigger chặn
  cả hai chiều, nên lỗ "ghi được mà không đọc được" chỉ dính **Trưởng/Phó ngành và Thủ quỹ đứng lớp
  ngoài phạm vi**, không dính Giáo lý viên thường; và nhánh rỗng của **TB-08** không phải *"chưa
  được phân công lớp nào"* mà là *"năm học chưa có lớp nào đang hoạt động"*.

- **`2B · M05-C — XONG — Claude — 2026-08-03`** ⇒ **M05 ĐÓNG (module 8/14).** Đợt cuối lo **trạng
  thái, an toàn thao tác và điện thoại** — và là đợt **không sinh migration nào**.
  **(1) Bấm "Hoàn tất" là chốt luôn, không hỏi lại.** Chốt là thao tác **một chiều**: nó đặt mốc
  khoá và sau đó chỉ Quản trị viên hệ thống mở lại được. Tổng kết buổi thì chỉ hiện **sau khi đã
  chốt** — đúng lúc không còn sửa nhẹ nhàng được nữa. Nay có hộp xác nhận nêu bảng phân bố tính
  **từ những gì người điểm danh vừa chọn**, tách **hai cột** Thánh lễ / Giáo lý (một con số gộp
  giấu mất đúng thứ cần soát), kèm **tên riêng** những em có đơn xin nghỉ mà vẫn đang để "Có mặt".
  Bấm Huỷ thì **không có gì được gửi đi**.
  **(2) Bị người khác tiếp quản thì trang âm thầm chuyển sang chỉ-đọc.** Các ô mờ đi, phần đang gõ
  biến mất, không một chữ nào giải thích. Nay có đồng hồ *"Bạn đang giữ quyền sửa · còn khoảng N
  phút"* — con số này **máy chủ trả về**, và nó đã được tính sẵn từ Phase 3 mà phần mềm vứt đi. Khi
  mất quyền: một băng-rôn nói rõ, cộng một ô **chép lại được** phần chưa lưu. Trang **không tự gửi
  gì lên** ở thời điểm đó, vì gửi là ghi đè lên dữ liệu của người đang phụ trách.
  **(3) 🔴 Lớp 50 em dài khoảng 9.000 pixel trên điện thoại**, mà việc người điểm danh thật sự làm
  trước khi chốt là *soát lại mình đã đánh vắng ai* — tức cuộn hết cả trang. Nay mỗi em gấp lại còn
  **một dòng**, chạm mới mở ra sửa: còn **~1.800 pixel**. Hàng gấp lại **vẫn nói đủ** trạng thái cả
  hai cột — gấp mà giấu luôn kết quả thì tệ hơn hẳn bản cũ.
  **(4) Năm ô chọn thả xuống mỗi em thành hàng nút bấm.** Một buổi nhiều ngoại lệ trước đây là **ít
  nhất 100 lần bung danh sách**, và trên iPhone mỗi lần là một bảng chọn chiếm cả màn hình.
  **(5)** Thêm bộ lọc **Tất cả · Đang vắng · Có đơn · Cảnh báo** và ô tìm tên **gõ không dấu cũng
  ra**, chạy hoàn toàn trên máy người dùng, và đọc **thứ đang gõ dở** chứ không đọc dữ liệu đã lưu.
  Em bị cảnh báo chuyên cần có huy hiệu nêu **lý do**. Thông báo sau khi bấm Lưu chuyển xuống **nằm
  cạnh chính cái nút vừa bấm** — trước đây nút ở đáy màn hình còn lỗi hiện ở đỉnh, cách nhau hàng
  nghìn pixel, nên người ta tưởng bấm không ăn và bấm lại.
  🔴 **Và một lỗi thật của đợt trước (M05-B) bắt được nhờ CHẠY, không phải nhờ đọc:** màn hình đơn
  xin nghỉ hiện trạng thái rỗng **trước khi** kịp hiện dòng thông báo, nên khi Giáo lý viên ghi nhận
  **đơn cuối cùng** đang chờ thì câu *"Đã ghi nhận đơn của {tên em}"* **bị chính lượt làm mới nó vừa
  gây ra xoá mất** — người bấm thấy thẻ biến mất mà không gì xác nhận là đã xong. Ở M05-B lỗi này đã
  bị **ghi nhầm thành "test chập chờn"**. Đã sửa, có bài kiểm canh riêng.
  **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**
  Unit **1090 pass/10 skip** (trước 1033/10, **+57**) · pgTAP **1033/1033** (**+0** — không có
  migration, và đó chính là bằng chứng ranh giới phân quyền không nhúc nhích) · lint **0 warning** ·
  typecheck ✓ · build ✓ 28/28 · bộ `attendance` E2E **39/39** trên ba viewport (**hai lượt chạy
  riêng đều 39/39**) · **E2E toàn bộ 401/408** — 7 đỏ = **1,7 %, thấp nhất từ trước tới nay**, và
  **0 bài nào thuộc điểm danh**.
- **Quyết định chủ dự án 2026-08-03 (M05-C):** **D-142** (hàng nút trạng thái có **ba** lựa chọn —
  Có mặt · Vắng có phép · Vắng không phép — cộng nút "…" mở Đi trễ · Về sớm; **không** chọn phương
  án hai nút của tài liệu vì nó buộc máy chọn hộ một trong hai loại vắng, mà chọn kiểu nào cũng sai
  với một nửa số ca) · **D-143** (hàng thiếu nhi **gấp lại một dòng, chạm để mở**; chấp nhận đánh
  đổi sửa một em mất thêm một cú chạm để đổi lấy giảm ~80 % chiều dài trang).
- ⚠️ **Một việc cần điều tra riêng ở phiên sau, KHÔNG thuộc M05:** bài E2E `staff-directory:124`
  (phân trang trang `/staff`) nay đã đỏ **3/3 viewport · 1/3 · 3/3** qua ba lượt đo. Kết luận
  "chập chờn" của M05-B **không còn đứng vững** — nó khớp với nghi phạm dẫn đầu của **nợ #15** (lượt
  chuyển trang phía trình duyệt của Next 15.5 không bao giờ chốt). Không sửa ở đợt này vì nó nằm ở
  module M04 đã đóng.

- **`2B · M05-B — XONG — Claude — 2026-08-03`** — **hoàn thiện nghiệp vụ đơn xin nghỉ, và đưa ghi
  chú điểm danh về đúng nghĩa "nội bộ".**
  **(1) Phụ huynh đang gửi đơn vào một chỗ không ai trả lời.** Nghiệp vụ ghi nhận đơn **đã viết
  xong từ Phase 3** — policy, trigger, và cả hàm `acknowledgeAbsenceRequest` — nhưng **không màn
  hình nào gọi nó**. Hệ quả khi chạy thật: trạng thái *"Đã ghi nhận"* **chưa bao giờ tồn tại**, mọi
  đơn nằm ở *"Đang chờ"* vĩnh viễn. Tệ hơn cả chuyện không phản hồi: Giáo lý viên chỉ thấy đơn
  **sau khi** đã mở buổi điểm danh — tức sau khi đã quá muộn để nó giúp được gì. Nay thẻ **"Đơn xin
  nghỉ tuần này"** ngay trên trang Điểm danh, cửa sổ ±7 ngày và **nhìn cả về trước**, kèm ô nhắn
  lại cho phụ huynh. Trong trang buổi có nút **"Áp dụng gợi ý: Vắng có phép"** — chỉ đổi **bản nháp
  trên máy**, người điểm danh vẫn phải bấm Lưu (D-36 giữ nguyên).
  **(2) 🔴 D-75 — cổng phụ huynh đang in thẳng ghi chú nội bộ của Giáo lý viên**, biến một ô ghi
  nhớ thành kênh nhắn tin mà không ai định vậy. Chỗ khó nằm ở cơ sở dữ liệu: **RLS lọc theo DÒNG,
  không theo CỘT**. Đây là lần thứ hai dự án gặp đúng bức tường ấy (D-67 ở M03-C), nhưng **lời giải
  phải khác**: lần trước Thủ quỹ chưa đọc được dòng nào nên chỉ cần mở một cửa sổ hẹp; lần này phụ
  huynh **đang** đọc đúng dòng của con mình và **phải tiếp tục đọc được**, còn thẻ tổng kết chuyên
  cần thì cộng bằng quyền của chính người xem — cắt dòng là **mất luôn thẻ**. ⇒ Chặn bằng **quyền
  cột**: tài khoản thường mất quyền đọc mức bảng, được cấp lại **từng cột trừ cột ghi chú**. Sau
  bước này **không ai** — kể cả Giáo lý viên — đọc thẳng được cột ấy; nhân sự của lớp đọc qua một
  cửa sổ riêng có kiểm quyền. Phụ huynh gọi thẳng vào hệ thống nhận **lỗi từ chối**, không phải một
  ô trống trông như *"em này không có ghi chú"*.
  🔴 **Bẫy để lại cho phiên sau:** quyền cột **không** tự mở rộng — thêm cột mới vào bảng điểm danh
  mà quên cấp quyền là cột ấy vô hình với cả ứng dụng, triệu chứng trông hệt lỗi phân quyền. Đã ghi
  vào `docs/02` §7.2, `docs/11` §6, và có **bài kiểm tự bắt** (in ra đúng tên cột bị bỏ quên).
  **(3) TB-11 — đơn cho buổi đã chốt bị từ chối**, nhưng chặn theo **trạng thái buổi** chứ không
  theo ngày như tài liệu đề xuất (**D-141**): con ốm sáng Chúa nhật, phụ huynh báo muộn vài giờ mà
  Giáo lý viên còn chưa chốt — lúc ấy lý do **vẫn kịp** đổi "vắng không phép" thành "vắng có phép".
  **(4) Nợ #18 đóng nốt bảng cuối của module.** Đơn xin nghỉ ghi **thẳng qua policy** nên ở đây
  đúng là khuôn một-dòng của M02-C — ngược hẳn ba bảng điểm danh ở đợt A. Kèm **nợ #14** trả cho cả
  ba thao tác đơn xin nghỉ, **năm mã lỗi** nay có câu tiếng Việt riêng thay cho một câu *"Dữ liệu
  không hợp lệ"* duy nhất, và `acknowledgeAbsenceRequest` hết báo thành công khi phân quyền chặn.
  **1 migration · 0 dòng dữ liệu bị đụng · 0 NỚI · 1 SIẾT (D-75) · 1 hàng rào năm học (nợ #18).**
  Unit **1033 pass/10 skip** (trước 1014/10, **+19**) · pgTAP **1033/1033** (trước 998, **+35**:
  `042`) · lint **0 warning** · typecheck ✓ · build ✓ 28/28 · bộ `attendance` E2E **33/33** trên ba
  viewport — **hai lượt chạy riêng đều 33/33** · **E2E toàn bộ 390/402** (12 đỏ = 3,0 %; **2 bài
  của đợt này** đỏ bằng *timeout*, không phải khẳng định sai — xem `Blocker/rủi ro`).
  ⚠️ **Bẫy về thứ tự chạy, gặp thật ở phiên này:** `npm run test:db` phải chạy trên DB **vừa
  `db:reset`**, **trước** `seed:dev`. Chạy sau seed thì **57 khẳng định của 8 file cũ đỏ hàng loạt**
  — toàn bài đếm số tuyệt đối kiểu *"global reader sees all profiles"*. Không bài nào liên quan tới
  đợt này, nhưng nhìn lần đầu thì giống hệt một migration vừa phá hỏng cả hệ thống.
- **Quyết định chủ dự án 2026-08-03 (M05-B):** **D-141** (đơn xin nghỉ chặn theo **trạng thái
  buổi**, không theo ngày — buổi còn mở thì vẫn nhận đơn báo muộn; khác đề xuất U-09 của
  `08_ACCEPTANCE_CRITERIA`) · **cách thi hành D-75** = khoá **quyền cột**, không dời cột sang bảng
  riêng (không đụng dữ liệu đang có, không sửa hàm chốt điểm danh — hàm quan trọng nhất hệ thống,
  vừa mới sửa ở đợt A).
  ⚠️ **D-75 là siết quyền với người đang dùng:** phụ huynh đang thấy ghi chú sẽ không thấy nữa —
  **phải báo trước**, nếu không họ tưởng hệ thống hỏng.

- **`2B · M05-A — XONG — Claude — 2026-08-03`** — **toàn bộ nhóm "đúng đắn dữ liệu" của module Điểm
  danh.** Module này **không có luồng CRITICAL nào** và tầng dữ liệu được audit gọi là *"chuẩn mực
  cho các module khác"*, nên đợt A không sửa cái gì hỏng nặng — nó sửa **những chỗ hệ thống nói sai
  sự thật**, và mỗi chỗ đều nói sai theo hướng người dùng không thể tự nhận ra.
  **(1) Sáng Chúa nhật, ô "Ngày" đổ sẵn buổi thứ Năm TUẦN TRƯỚC.** Máy chủ chạy giờ UTC nên 06:00
  sáng Chúa nhật giờ Việt Nam là **23:00 thứ Bảy UTC**. Đây không phải ca biên — tới nhà thờ sớm là
  chuyện thường ngày. 🔴 Vì sao bảy phase không ai thấy: bộ E2E **tự sinh ngày rồi điền tay vào ô**,
  nên **giá trị mặc định chưa từng được kiểm** lần nào.
  **(2) Cùng một buổi, hai màn hình nói hai điều khác nhau.** Danh sách in thẳng cột `status`, mà
  **không đoạn mã nào ghi `status='locked'`** — khóa là hàm của thời gian. Nên buổi đã khóa hiện
  *"Đã chốt"* ở danh sách và *"Đã khóa"* khi mở ra; người dùng không có cách nào biết mình còn sửa
  được không nếu chưa bấm vào. Nay luật nằm ở **một chỗ duy nhất**, và có thêm nhãn **"Đã mở khóa"**
  mà danh sách chưa từng có.
  **(3) Bấm "Hoàn tất" lần thứ hai báo "đang có người khác phụ trách" — trong khi không có ai.** Một
  điều kiện gộp **ba** tình huống khác hẳn nhau, mà chính thao tác chốt lại **xóa người giữ phiên**.
  Nhấp đúp, mạng chậm hay một lượt thử lại đều rơi vào đó và gọi tên một người không tồn tại.
  **(4) Một em rời lớp khóa cứng CẢ BUỔI điểm danh đã diễn ra.** Luật *"ghi danh còn mở"* áp cho cả
  lượt sửa, mà chốt buổi thì sửa mọi dòng ⇒ không lưu được, không chốt được. Tệ hơn: ba mã lỗi của
  cơ sở dữ liệu **chưa từng có** trong bảng dịch, nên tất cả rơi về *"Thao tác bị xung đột. **Vui
  lòng thử lại**."* — một lời hứa sai khiến người ta thử lại mãi trên thứ hỏng vĩnh viễn.
  **(5) D-140 — em "Tạm nghỉ" ra khỏi danh sách điểm danh.** 🔴 Chỗ suýt hỏng **không phải chỗ sửa**:
  phép đếm sĩ số lúc chốt là một truy vấn **chép tay** cùng luật ở nơi khác — giữ nguyên nó thì
  **mọi lớp có một em tạm nghỉ không chốt được buổi nào nữa**, với câu *"Danh sách chưa đủ"* vô
  nghĩa. Hai bên nay dùng chung một hàm, có bài kiểm canh riêng.
  **(6) Nợ #18 — và hàng rào KHÔNG đặt được vào policy.** Khuôn của M02-C nằm sẵn đó để chép, nhưng
  ba bảng điểm danh **không ai ghi thẳng được**: mọi đường ghi qua RPC `security definer`, mà thứ đó
  **bỏ qua RLS** ⇒ thêm điều kiện vào policy là dựng một **hàng rào giả**. Hàng rào nằm trong bốn
  RPC; D-117 vẫn đứng, Super Admin sửa được năm đã đóng.
  Kèm **TB-08** (báo ngay khi buổi đang có người giữ) · **TB-12** · **nợ #20** (link quay lại 18px →
  44px) · **nợ #14** (guard sai kiểu và sai chỗ).
  **1 migration toàn `create or replace` · 0 dòng dữ liệu bị đụng · 1 NỚI (chỉ đọc) · 1 SIẾT.**
  Unit **1014 pass/10 skip** (trước 998/10, **+16**) · pgTAP **998/998** (trước 967, **+31**: `041`)
  · lint **0 warning** · typecheck ✓ · build ✓ 28/28 · bộ `attendance` E2E **27/27** trên ba viewport
  (trước 15 bài, **+12**) · **E2E toàn bộ 383/396**, 13 đỏ và **0 bài thuộc điểm danh**.
- **Quyết định chủ dự án 2026-08-03 (M05-A):** **D-139** (Cha sở + Cha phó **xem** điểm danh ở chế độ
  chỉ đọc; **Thủ quỹ giữ nguyên bị chặn** — ô của họ trong bảng phân quyền là *"👁 báo cáo"*, và cơ
  sở dữ liệu cũng không cho họ đọc nên mở route chỉ ra một trang trắng) · **D-140** (em đang tạm nghỉ
  **ra khỏi** danh sách điểm danh, trang buổi nói ra số em bị loại; **không** chọn đường "giữ tên
  nhưng mặc định Vắng có phép" vì nó sinh cảnh báo chuyên cần giả cho chính những em xứ đoàn **đã
  biết** là đang nghỉ).

- **`2B · M12-C — XONG — Claude — 2026-08-03`** ⇒ **M12 ĐÓNG.** Đợt cuối trả nốt ba việc, và **hai
  trong ba việc ấy là thứ tài liệu đòi từ Phase 2 mà chưa bao giờ tồn tại.**
  **(1) Tải file lỗi/kết quả — cầu nối duy nhất tới Giáo lý viên lớp.** Người **có** dữ liệu còn
  thiếu là GLV lớp (họ biết em nào Nam em nào Nữ), nhưng họ **không được vào `/imports`** — và điều
  đó đúng, vì nhập Excel tạo hồ sơ hàng loạt. Trước đợt này hệ quả là Thư ký phải **chép tay** từng
  dòng lỗi ra tin nhắn. Nay `.xlsx` hai sheet: **`LOI`** (chỉ dòng có việc phải làm) và
  **`KET_QUA`** (đủ mọi dòng, kèm mã thiếu nhi). **Không nới quyền cho ai** — Thư ký tải rồi gửi đi;
  Giáo lý viên lớp gọi thẳng đường dẫn nhận **403** kèm câu tiếng Việt, không phải một file rỗng hợp
  lệ. 🔴 **SEC-16 suýt mở lại ở cửa thứ hai**: `errors_json` chứa `sqlerrm` **nguyên văn**, màn hình
  đã dịch từ M12-A nhưng file xuất ra thì đọc thẳng mảng ấy — mà cửa này tệ hơn màn hình vì **tệp đi
  ra ngoài hệ thống**.
  **(2) Ghi danh bị bỏ qua hết im lặng.** `insert … on conflict do nothing` làm dòng báo `committed`
  dù em vẫn ở lớp cũ — **đường đi thường gặp nhất** của module (nhập lại sổ đầu năm sau khi sửa vài
  dòng). Nay `commit_import_rows` trả thêm `out_enrollment_created`, dòng mang cảnh báo nêu **đúng
  tên lớp em đang học**, và lượt ghi đếm con số ấy **riêng** — không gộp vào "đã ghi" (dựng lại đúng
  lỗi vừa sửa) cũng không gộp vào "lỗi" (hồ sơ em có thật; bảo sửa file rồi tải lại là sinh hồ sơ
  trùng). 🔴 Migration **drop + create**, nên phải **cấp lại `grant execute`** — quên là gãy toàn bộ
  đường nhập, mà triệu chứng `42501` trông hệt lỗi RLS. Ba bài **đầu tiên** của pgTAP `040` canh đúng
  chỗ đó.
  **(3) Hai cái trần, và cái thứ nhất là một CON SỐ SAI chứ không phải hành vi sai.** Vercel chặn
  thân request >~4,5 MB **ở tầng hạ tầng**, nên câu `"File vượt quá 5MB."` chưa từng có cơ hội chạy
  cho đúng khoảng nó canh; `bodySizeLimit: "6mb"` còn cao hơn cả trần nền tảng, tức một con số không
  có hiệu lực nào. Nay **4 MB** (**D-137**) và **1.000 dòng** (**D-138** — trước đây **không có giới
  hạn số dòng nào**, SEC-12 để đỏ từ Giai đoạn 1), cả hai **nói ra ngay trên ô chọn file**.
  **1 migration · 0 thay đổi phân quyền.** Đóng luôn **NC-01** và **NC-02**.
  Unit **998 pass/10 skip** (trước 970/10, **+28**) · pgTAP **967/967** (trước 947, **+20**: `040`) ·
  lint **0 warning** · typecheck ✓ · build ✓ 28/28 · bộ `imports` chạy riêng **42/42** trên ba
  viewport (trước đợt này 30 bài, **+12**) · **toàn bộ E2E 371/384**. 🔴 13 bài đỏ, **0 bài thuộc bốn
  luồng mới của đợt C**; ba bài `imports` đỏ ở lượt toàn bộ đều là bài của **M12-A/B trên mã đợt C
  không đụng tới** và **xanh 3/3 ở lượt chạy riêng của chính bản mã ấy**. Tất cả cùng hình dạng nợ
  #10/#15. Tỷ lệ đỏ 3,4 % (M12-B 3,0 % · M12-A 1,7 % · M03-C 4,1 %).
- **Quyết định chủ dự án 2026-08-03:** **D-137** (trần dung lượng **4 MB**, cấu hình nền tảng
  **4,5 MB** — căn cứ: 21 file Excel thật của giáo xứ, nặng nhất **860 KB**) · **D-138** (trần
  **1.000 dòng** một file — căn cứ: sổ lớp đông nhất **75 dòng**, gộp cả 19 lớp cũng chỉ ~900).

- **`2B · M12-B — XONG — Claude — 2026-07-29`** — **module nhập Excel dùng được ở quy mô thật.**
  **(1) Hết 30 lần bấm cho 30 em.** Sổ SYLL của giáo xứ **không có cột giới tính** — thiếu ở **83%
  dòng** — mà `students.gender` là NOT NULL, nên người duyệt phải chọn tay từng dòng. Trước đợt này
  mỗi dòng là **một lần gửi + một lượt dựng lại cả trang** đang hiện đủ 30 thẻ; biên bản audit chấm
  tiêu chí *"số bước hợp lý"* **2/5**, thấp nhất module. Nay **một** biểu mẫu mang cả trang dòng:
  chọn liên tục rồi bấm "Lưu tất cả thay đổi" một lần, kèm **"Áp dụng Nam/Nữ cho các dòng đang
  chọn"**. 🔴 **Vẫn không có nút đoán theo tên đệm** — `docs/09` §2b cấm, BR-M12-36 nói thẳng.
  **(2) D-133 của hôm qua vẫn đứng nguyên.** Nút lưu chung **cố ý không** xác nhận hộ dòng trùng chắc
  chắn: dòng ấy có nút **"Xác nhận dòng #N"** riêng, nằm **bên trong khối đối chiếu phải mở ra mới
  bấm được** — người duyệt nhìn hồ sơ trước, đúng điều D-133 muốn — và lượt lưu chung **nói ra** số
  dòng nó bỏ qua kèm số dòng cụ thể (**D-136**).
  **(3) Hết đổ 900 dòng vào một lượt dựng.** 50 dòng/trang + 6 bộ lọc trạng thái; danh sách lần nhập
  hết `.limit(20)` viết cứng — có phân trang, lọc theo năm học (**D-135**, mặc định năm hiện hành) và
  trạng thái, và **nói ai tải lên**. 🔴 Cái bẫy của phân trang đã bị bắt tại chỗ: ba con số ở đầu
  trang nay đếm **trong cơ sở dữ liệu**; giữ phép đếm cũ thì lần nhập 900 dòng hiện nút *"Ghi 50
  dòng"* — sai mà không gì báo là sai.
  **0 migration · 0 thay đổi phân quyền.** Lần đầu `Pagination` và `FilterBar` của Đợt 0-UI chạy
  trong trang thật (trả tiếp nợ #7).
  Unit **970 pass/10 skip** (trước 947/10, **+23**) · pgTAP **947/947** (không đổi) · lint **0
  warning** · typecheck ✓ · build ✓ 28/28 · **toàn bộ E2E 361/372**; bộ `imports` chạy riêng bốn lượt
  cho **30/30 · 30/30 · 29/30 · 28/30**, mọi bài đỏ đều ở ngưỡng **46–47 giây** và đều thuộc luồng
  huỷ của M12-A, **đổi chỗ giữa các lượt** — đúng hình dạng nợ #10.
- **Quyết định chủ dự án 2026-07-29 (đợt B):** **D-134** (bảng trên máy tính, thẻ trên điện thoại,
  **một cây DOM**) · **D-135** (danh sách lần nhập mặc định lọc **năm học hiện hành**, lưu bằng chữ
  `current` để dấu trang không cũ) · **D-136** (nút lưu chung gồm cả giới tính lẫn cách xử lý,
  **trừ** dòng trùng chắc chắn).

- **`2B · M12-A — XONG — Claude — 2026-07-29`** — **gỡ CẢ BA lỗi CRITICAL của M12 trong một đợt**,
  đúng "gói tối thiểu" mà `07_IMPLEMENTATION_IMPACT` §3 khuyến nghị.
  **(1) Module hết câm.** Cả **năm** biểu mẫu `await` rồi **vứt** giá trị trả về, nên bấm "Kiểm tra
  file" xong màn hình **không đổi một chữ nào** — file hỏng và file tốt trông giống hệt nhau. Câu
  giải thích **đã có sẵn từ Phase 2** ở `parse.ts`; cái thiếu chỉ là **người nhận**. Nay ba Client
  Component dùng `useActionState`; tải lên xong vào thẳng trang lần nhập; kết quả ghi liệt kê **từng
  dòng lỗi** đã dịch sang tiếng Việt (**SEC-16 từ "hiện đang vi phạm" thành đúng** — hết in `sqlerrm`).
  **(2) Hết mất vết.** Nút *"Xoá lần nhập này"* đứng cạnh nút "Ghi", **không hỏi lại**, xoá được cả
  lần nhập **đã ghi dữ liệu** — cuốn theo mối nối *"dòng số 5 tạo ra hồ sơ CQ0123"*, thứ duy nhất
  truy ngược được hồ sơ về nguồn. Hàng rào nay ở **cơ sở dữ liệu**, không chỉ ở Server Action: gọi
  thẳng Data API bằng JWT thật của Thư ký cũng **không xoá được**. Huỷ là **đánh dấu** (**D-131**);
  "Xoá dữ liệu thô" tách riêng, giữ nguyên mapping (**D-132**).
  **(3) Hết mặc định tạo trùng.** Mọi dòng mang `action='create'` kể cả dòng trùng cả **tên + ngày
  sinh + SĐT phụ huynh** ⇒ một cú bấm là hai hồ sơ, mà hệ thống **không có chức năng gộp**. Nay mặc
  định là **Ghép** và dòng trùng chắc chắn **chặn ghi** tới khi người duyệt xác nhận từng dòng
  (**D-133**); dò trùng xét **cả hồ sơ đã rút** (em nghỉ rồi quay lại không bị tạo hồ sơ thứ hai).
  **1 migration · 0 nới quyền · 1 siết quyền**, có RLS negative bằng JWT thật.
  Unit **947 pass/10 skip** (trước 891/10, **+56**) · pgTAP **947/947** (trước 926, **+21**: `039`) ·
  E2E của đợt **15/15** trên ba viewport · **toàn bộ E2E 351/357** — 6 đỏ, **0 bài thuộc M12**, tất
  cả cùng hình dạng nợ #10 và nằm ở spec của bốn đợt trước. Tỷ lệ đỏ **1,7 %**, thấp nhất kể từ khi
  bắt đầu đo (M03-C 14/342 = 4,1 %). lint **0 warning** · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-29:** **D-131** (huỷ lần nhập chưa ghi = đánh dấu, **giữ lại** để
  tra cứu ai từng tải file gì lên) · **D-132** ("Xoá dữ liệu thô" mở cho **cả bốn vai trò nhập
  được** — họ vốn đã đọc được dữ liệu đó, cùng lý lẽ D-109) · **D-133** (dòng trùng **chắc chắn**
  phải xác nhận từng dòng; dòng chỉ **nghi** thì mặc định Ghép nhưng không cản).

- **`2B · M03-C — XONG — Claude — 2026-07-28`** ⇒ **M03 ĐÓNG.** **Lưu trữ một em nay thật sự đưa em
  ra khỏi lớp, và tiêu chí bảo mật S-11 từ "hiện đang SAI" thành đúng.** Đóng ba luồng còn lại:
  **F06** (42/75) · **F12** (**31/75, thấp nhất module**) · **F08**. Gốc rễ F06 là hệ thống có **hai
  trục trạng thái** — `students.status` (danh tính) và `enrollments.status` (chỗ trong lớp) — mà
  **không luật nào ràng buộc chúng**: không trigger, không action gộp, không dòng tài liệu nào nói
  khi nào chúng phải khớp. Hậu quả không chỉ là sĩ số sai: vì `class_scoped_student_ids()` chỉ nhìn
  ghi danh còn mở, một em "đã lưu trữ" mà vẫn giữ ghi danh nghĩa là **Giáo lý viên lớp cũ vẫn đọc
  được hồ sơ và toàn bộ dữ liệu sức khoẻ** của em đã rời đi. Nay `set_student_status` đổi **cả hai
  trục trong một giao dịch**, kèm **ba trigger** làm lưới an toàn ở cả hai chiều.
  🔴 **RPC này KHÔNG `security definer`** — ngược hẳn ba hàm của M03-B, và đó là điểm quan trọng
  nhất của migration: em đã tồn tại, đã có lớp, nên **mọi hàng rào cần thiết đã nằm trong RLS**
  (phạm vi ngành D-123, năm học đã đóng D-117/D-118). Viết definer là tự tay bỏ qua cả hai rồi phải
  chép lại chúng bằng tay. Có pgTAP canh: đóng ghi danh thuộc **năm học đã đóng** bị từ chối và
  **cả giao dịch bị huỷ**.
  **F12 chấm thấp nhất module vì nó KHÔNG TỒN TẠI**: `updateGuardian` viết xong từ Phase 2 mà không
  màn hình nào gọi ⇒ nhập sai số điện thoại phụ huynh thì không sửa được, mà đó là số gọi khi em ốm
  giữa buổi học. Nay sửa được, và **đổi được người giám hộ** — thao tác **đổi ngay quyền đọc của hai
  tài khoản**, nên có hộp xác nhận nêu **đủ ba cái tên** và pgTAP chứng minh phụ huynh cũ mất quyền.
  🔴 **Khe hở tự phát hiện, không bài test nào bắt được:** luật *"chỉ cấp xứ đoàn được lưu trữ"*
  (`docs/05` §5) ban đầu chỉ nằm ở Server Action, trong khi `students_update_scope` của D-123 cho
  vai trò ngành `update` **mọi cột** của em trong ngành mình — gọi thẳng Data API là lưu trữ được.
  Nay luật nằm trong trigger, có bài âm tính **đi đường vòng** để canh.
  🔴 **Một lỗi cũ chưa ai từng đo:** link "← Danh sách thiếu nhi" cao **18px**, dưới ngưỡng chạm
  44px, đứng đó từ Phase 2 vì `responsive.spec.ts` quét **13 địa chỉ cấp một** và **không có địa chỉ
  chi tiết nào**. Bài đo tại chỗ mới viết bắt được ngay lượt đầu; ba trang cùng lỗi ⇒ **nợ #20**.
  **1 migration · 3 thay đổi NỚI (D-127, D-128, D-67/D-129) · 1 thay đổi SIẾT** (lưu trữ về đúng
  bốn vai trò xứ đoàn), tất cả có RLS negative bằng JWT thật.
  Unit **891 pass/10 skip** (trước 828/10, **+63**) · pgTAP **926/926** (trước 869, **+57**: `038`,
  toàn bộ JWT thật) · E2E đợt này **40/42** · **toàn bộ E2E 328/342** · lint **0 warning** ·
  typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-28 (mở đường M03-C) — ba trong bốn là câu hỏi để ngỏ từ ĐẦU Giai
  đoạn 2B:** **D-127** (Q-M03-02 = theo đúng bảng phân quyền: vai trò ngành **và** Giáo lý viên ghi
  được sức khoẻ/bí tích trong phạm vi mình; **Dự trưởng phụ tá vẫn chỉ đọc**) · **D-128** (Q-M03-05 =
  sửa cho mọi người ghi được, **xoá** chỉ cấp xứ đoàn, vì một bí tích lỡ thêm vào hồ sơ **nhầm em**
  thì không có đường nào chuyển sang em đúng) · **D-129** (Thủ quỹ **được** xem dấu "hoàn cảnh khó
  khăn" — việc xét miễn/giảm phí ở xứ đoàn do họ làm) · **D-130** (trạng thái hồ sơ "Tạm nghỉ"
  **kéo theo** ghi danh, và "Đang sinh hoạt" khôi phục lại).

- **`2B · M03-B — XONG — Claude — 2026-07-28`** — **cảnh báo trùng nay che cả hai cửa vào, và
  `/students` dùng được ở quy mô thật.** Đóng luồng **CRITICAL M03-F13** (29/75, thấp nhất module).
  Nghịch lý trước đợt này: cùng dữ liệu, cùng bảng, nhưng đường **Excel có** dò trùng ba mức còn
  đường **gõ tay không có gì** — nhập một em hai lần ra hai hồ sơ, hai mã, không một lời cảnh báo.
  Gốc rễ là luật dò trùng được viết **thuộc về module Nhập Excel** chứ không thuộc miền `students`;
  nay luật nằm ở `src/lib/students/duplicate.ts`, `imports/dedup.ts` chỉ còn là lớp mỏng gọi vào đó
  ⇒ **hai đường không thể lệch mức**, và có unit test chạy **cùng một cặp dữ liệu qua cả hai đường**
  để canh. Cảnh báo là **MỀM**: xem xong bấm "Vẫn tạo hồ sơ mới" là qua. Phép dò chạy dưới RLS của
  người thao tác qua khung nhìn `security_invoker`, **không** service role. Người giám hộ cũng được
  dò — đây là chuyện **phân quyền**, vì một gia đình bị tách đôi làm phụ huynh đăng nhập chỉ thấy
  **một phần số con của mình**, mà hệ thống không có chức năng gộp.
  **`/students` hết đổ ~900 em ra một trang:** tìm **không dấu** (D-126) · lọc ngành/lớp/trạng thái ·
  phân trang 20/trang, **tất cả trong SQL**. Đưa **`FilterBar` · `SearchInput` · `Pagination` ·
  `EmptyState` · `BranchChip`** của Đợt 0-UI vào trang thật lần đầu (trả một phần nợ #7).
  **Tạo hồ sơ và xếp lớp nay là một thao tác** (TB-F02/F09), trong **một giao dịch**.
  🔴 **D-63 mở quyền ghi hồ sơ cho Trưởng/Phó ngành** — nhưng ngành của một em suy ra từ **lớp** em
  học, mà hồ sơ vừa tạo thì chưa có lớp nào, nên "chỉ trong ngành mình" **không có gì để kiểm**.
  Chủ dự án chọn **D-123**: họ **bắt buộc chọn lớp** khi tạo. Hệ quả tốt kèm theo — không có đường
  nào sinh ra hồ sơ "lơ lửng" mà **chính người tạo cũng không đọc lại được**. Kèm **D-124** cho họ
  đọc người giám hộ trong ngành mình (trước đó chỗ đó hiện dấu **"—"**, cùng họ với nợ #13).
  🔴 **Sức khoẻ và bí tích CỐ Ý không nới theo** vì Q-M03-02 chưa chốt ⇒ mã nguồn nay có **hai**
  cổng quyền. Gộp một cổng là để Trưởng ngành bấm "Lưu" trên tab Sức khoẻ rồi nhận *"0 dòng được
  cập nhật"* — đúng loại thất bại im lặng M03-A vừa diệt.
  **1 migration · 2 thay đổi NỚI quyền · 0 siết quyền**, có RLS negative bằng JWT thật.
  🔴 **Lỗi thật do chính đợt này gây ra:** spec E2E mới ghi danh em vào **Ấu 1A** — lớp duy nhất có
  thiếu nhi trong `seed:dev`, nên nhiều spec khác chốt cứng sĩ số của nó — làm **đỏ 4 bài của
  M03-A**. Đã đổi sang một lớp không spec nào chốt số. Bài học lặp lại từ M04-A và M02-C: trên một
  database dùng chung, **một bài test ghi dữ liệu là một bài test sửa hệ thống của bài khác**.
  ⚠️ **Nợ #10 — lần đầu loại được cơ sở dữ liệu khỏi diện nghi vấn bằng số đo.** `perf:smoke` với
  **909 em**: `/students` nặng nhất **52 ms**, `list_guardian_options` **47 ms**. Ảnh chụp lỗi cho
  thấy nút còn nguyên chữ *"Đang lưu…"* ở trạng thái vô hiệu ⇒ **vòng gọi Server Action chưa về**,
  không phải trang dựng sai. Ba lượt E2E toàn bộ cho **ba tập bài đỏ khác nhau**. Đã nới ngưỡng chờ
  ba khẳng định sau-thao-tác-ghi lên 45 giây và **ghi rõ đó là che triệu chứng, không phải chữa**.
  Unit **828 pass/10 skip** (trước 780/10, **+48**) · pgTAP **869/869** (trước 831, **+38**: `037`,
  toàn bộ JWT thật) · E2E đợt này **27/27** trên 360·768·1366 · **toàn bộ E2E 293/300** · lint
  **0 warning** · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-28 (mở đường M03-B):** **D-123** (tạo hồ sơ **kèm chọn lớp**;
  hai đường còn lại đều dở — cho tạo hồ sơ chưa xếp lớp thì phải cho **mọi** Trưởng ngành đọc/sửa
  **mọi** hồ sơ chưa xếp lớp của cả xứ đoàn, còn chỉ-cho-sửa thì mới làm một nửa D-63) · **D-124**
  (đọc người giám hộ trong ngành + cửa sổ hẹp chỉ tên và số điện thoại để chọn người đã có) ·
  **D-125** (Q-M03-06 = **không** lưu vết bỏ qua cảnh báo trùng) · **D-126** (tìm **không dấu**,
  giống màn hình Nhân sự của M04).
- **`2B · M03-A — XONG — Claude — 2026-07-28`** — **nút "Tạm nghỉ" lần đầu tiên chạy được, sau khi
  chưa từng chạy được lần nào kể từ Phase 2.** Đóng luồng **CRITICAL M03-F10** (35/75). Gốc rễ là
  **một chữ mang hai nghĩa trái ngược ở hai tầng**: cơ sở dữ liệu coi `paused` là trạng thái **MỞ**
  (CHECK `enrollments_open_has_no_end` bắt trạng thái mở phải **không có** ngày kết thúc), còn phần
  mềm xếp nó vào danh sách trạng thái **ĐÓNG** rồi đặt vào ô "Lý do kết thúc" — nơi **luôn** gửi kèm
  một ngày. Mọi lượt bấm vì thế vi phạm ràng buộc, lỗi bị nuốt, và người dùng chỉ thấy trang tải lại
  với em nằm nguyên trong lớp. Nay ba việc là **ba biểu mẫu riêng**: **Tạm nghỉ** · **Khôi phục**
  (chức năng `docs/11` đòi từ đầu mà **chưa từng tồn tại**) · **Kết thúc** có hộp xác nhận nêu **tên
  em và tên lớp** (nút cũ ghi thẳng, không hỏi gì). 🔴 **Và sáu thao tác ghi im lặng của module nay
  đều nói ra kết quả:** cả sáu adapter trước đây gọi xong rồi **vứt kết quả đi**, còn `updateStudent`
  /`saveHealthProfile`/`updateGuardian` thì thiếu `.select()` nên **RLS chặn vẫn báo thành công** —
  người không đủ quyền bấm "Lưu" và nhận đúng thứ người đủ quyền nhận. **D-121:** sĩ số tách hai số
  (*"Sĩ số 28 · trong đó 2 tạm nghỉ"*). **D-122:** giữ lý do "Chuyển lớp" nhưng nói thẳng nó **chỉ**
  đóng ghi danh lớp cũ. **0 migration, 0 thay đổi phân quyền.**
  🔴 **Lỗi thật do chính đợt này tạo ra, chỉ chạy mới thấy:** ba nút dùng ba `useActionState` riêng,
  mà hook đó **giữ lại** kết quả lượt trước — nên bấm "Tạm nghỉ" rồi "Khôi phục" thì dòng thông báo
  vẫn đứng ở câu *"Đã chuyển … sang Tạm nghỉ"*, tức **nói sai trạng thái hiện tại của em**. E2E rớt
  3/3 viewport; unit test không bắt được vì mỗi bài chỉ bấm một nút. Đã gộp về một luồng, phân nhánh
  bằng ô ẩn `intent` (vẫn chạy khi chưa có JS).
  ⚠️ **Nợ #19 mới:** em tạm nghỉ **vẫn còn tên trong danh sách điểm danh**, mà điểm danh mặc định là
  "có mặt" ⇒ chuyên cần đẹp hơn sự thật. Đây là phạm vi đã chốt của D-121, trả ở **M05**.
  Unit **780 pass/10 skip** (trước 729/10, **+51**) · pgTAP **831/831** (trước 810, **+21**: `036`,
  trong đó ca `paused` kèm ngày kết thúc là **ca chưa từng được kiểm**) · E2E đợt này **42/42**
  (`enrollment-lifecycle` 18 + `responsive` 12 + `security` 12) trên 360·768·1366 · **toàn bộ E2E
  269/273** (4 đỏ ở `committees`/`results`/`staff-directory` — ba file đợt này không đụng tới, đúng
  hình dạng nợ #10 và #15) · lint **0 warning** · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-28 (mở đường M03-A):** **D-121** (sĩ số **tách hai số**; loại hẳn em
  tạm nghỉ khỏi sĩ số và điểm danh sẽ đụng M05/M07 chưa tới lượt ⇒ ghi thành **nợ #19**) · **D-122**
  (giữ lý do "Chuyển lớp", hộp xác nhận nói thẳng hệ thống **không** ghi danh em vào lớp mới; ẩn đi
  thì người đang thật sự chuyển em phải chọn "Rút" ⇒ **ghi sai lý do vào hồ sơ**).
- **`2B · M02-C — XONG — Claude — 2026-07-26`** ⇒ **M02 ĐÓNG.** **Năm học nay chốt sổ được, và năm
  đã đóng nay thật sự không ghi được.** Đóng **M02-F09** — luồng chấm **thấp nhất toàn hệ thống**
  (21/75): `docs/03` WF-16 mô tả sáu bước chốt sổ mà hệ thống **chưa cài bước nào**, năm học chỉ rơi
  sang "Đã đóng" như **tác dụng phụ** của thao tác đặt năm mới. Nay `/admin` có khối **"Đóng năm
  học"**: bảng kiểm do **cơ sở dữ liệu đếm** (ghi danh đang mở · bảng điểm chưa khoá · buổi điểm danh
  chưa chốt), **gõ lại mã năm học**, và **bắt ghi lý do** khi còn việc tồn đọng. 🔴 **Lỗ hổng nghiêm
  trọng nhất của D-73 nay đã bịt:** trước đợt này năm đã đóng **vẫn nhận ghi danh mới** qua Data API
  bằng JWT thật — M02-B chỉ chặn ở tầng ứng dụng và đã ghi rõ trong mã rằng hàng rào chưa dựng xong.
  `app.writable_academic_year_ids()` nay là hàng rào thật trên `enrollments` + `classes`; **Super
  Admin là ngoại lệ duy nhất (D-117)**. **D-70:** phụ huynh/thiếu nhi hết đọc được **toàn bộ 19 lớp
  và toàn bộ danh sách năm học** — nay chỉ lớp của con/của mình, và năm hiện hành + năm con có ghi
  danh. **3 migration**, **2 thay đổi siết quyền**, cả hai có RLS negative test bằng JWT thật.
  Unit **729 pass/10 skip** (trước 693/10, **+36**) · pgTAP **810/810** (trước 755, **+55**: `034`
  37 + `035` 18) · lint **0 warning** · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-26 (mở đường M02-C):** **D-117** (sau khi đóng năm, Super Admin còn
  ghi được **tất cả** — ngoại lệ duy nhất) · **D-118** (hàng rào ghi đợt này chỉ áp cho **ghi danh +
  lớp**; điểm danh/bảng điểm/chuyển lớp/báo cáo siết sau ⇒ **nợ #18**) · **D-119** (đóng năm **không**
  tự chuyển lớp sang `closed`) · **D-120** (`retention_until` **chặn** lưu trữ trước hạn — nghĩa là
  nút "Lưu trữ" gần như không xuất hiện trên dữ liệu thật trong 5 năm tới, và đó là chủ ý).
- **`2B · M02-B — XONG — Claude — 2026-07-25`** — **lớp có nơi để cài đặt, và biết mình thuộc năm nào.**
  Đóng **M02-F07** và **M02-F08**. `updateClass` viết xong từ **Phase 1** mà **không màn hình nào
  gọi** (5W-F08) — nghĩa là đóng lớp · tạm ngưng lớp · ghi phòng sinh hoạt là việc `docs/11` §3 đòi
  mà **thực tế không làm được**; nay có thẻ **"Cài đặt lớp"** ở `/classes/[classId]`, hàm chuyển về
  `features/classes/` cho đúng ranh giới. Trang chi tiết lớp trước đây mở được cho **mọi** năm học
  và **ghi danh vào năm đã đóng vẫn chạy**, không một dấu hiệu nào; nay phụ đề nói **trạng thái năm
  học bằng chữ**, năm khác `current` có dải riêng, và `enrollStudent`/`endEnrollment` **tự kiểm phía
  máy chủ** (ẩn biểu mẫu không phải authorization). **D-115/D-116**: thêm mốc kết thúc học kỳ 1 —
  `term_scope='semester_1'` của lớp Dự trưởng hết là **dữ liệu chết** — qua mốc thì **chỉ cảnh báo**,
  hệ thống không tự đóng lớp. Thẻ lớp ở `/classes` mang **màu ngành** (09 §4.4 #10) và có huy hiệu
  trạng thái bằng chữ. **1 migration**, **0 siết quyền mới**.
  🔴 **Nợ #15 đã ĐO xong, khoanh đúng vùng lỗi, chưa chữa được.** Ba giả thuyết, **hai bị loại bằng
  số**: cơ sở dữ liệu (910 thiếu nhi → **17 ms** + **8 ms**, tổng ≈25 ms — nên cách chữa cũ ghi trong
  nợ là vô nghĩa) và bão nạp trước (5/36 treo có nạp trước so với **4/36** khi tắt — trong sai số).
  Cú bấm **luôn tới đích** (23–123 ms, kể cả khi bỏ qua kiểm tra của Playwright), `goto` thẳng
  **9/9 không treo**, nhưng **9/72 lượt bấm thẻ URL không đổi trong 45 giây** ⇒ lỗi nằm ở **lượt điều
  hướng phía trình duyệt của Next 15.5**, không phải DB, không phải máy chủ, không phải lỗi bài test.
  🔴 **Lỗi thật thứ hai:** nhãn mới *"Ngày kết thúc học kỳ 1"* **bao chứa** nhãn cũ *"Ngày kết thúc"*
  nên `getByLabel` khớp hai phần tử và làm đỏ **hai bài E2E vốn đang xanh** — biến thể mới của họ lỗi
  "nhãn trùng hai chỗ" đã gặp ở M02-A và M04-C.
  🔴 **Nợ #15 nay xác nhận là nợ TOÀN HỆ THỐNG:** lượt chạy **toàn bộ** bộ E2E (244/246) rớt đúng hai
  bài `staff-directory` *"phân trang sang trang 2"* với **cùng** thông điệp *"bấm nhiều lần vẫn không
  có hiệu lực"* — `<Link>` khác route, khác kiểu phần tử. Lượt trước đó (236/246) hai bài ấy xanh mà
  `class-settings`/`committees`/`results` rớt ⇒ tập bài đỏ **đổi chỗ giữa hai lượt**.
  Unit **693 pass/10 skip** (trước 641/10, **+52**) · pgTAP **755/755** (trước 733, **+22**: `033`)
  · E2E đợt này **51/51** (`class-settings` 15 + `academic-year` 15 + `responsive` 12 + `security` 9)
  · **toàn bộ E2E 244/246** trên 360·768·1366 · lint **0 warning** · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-25 (mở đường M02-B):** **D-115** (qua mốc HK1 lớp Dự trưởng **chỉ
  cảnh báo**, không tự đóng — đóng câu hỏi mở số 4 của `06_DECISION_LOG.md`) · **D-116** (mốc HK1
  **không bắt buộc** và **sửa được sau**, vì năm `2026-2027` đang chạy có trước cột này).
- **`2B · M02-A — XONG — Claude — 2026-07-25`** — **hết "báo thành công giả" ở `/admin`.**
  Đóng **M02-F02**, đúng luồng đã gây **sự cố production**: bấm "Sinh lớp mặc định" tạo 0 lớp mà
  vẫn báo xong. Gốc rễ là **một con số 0 mang hai nghĩa trái ngược** ("đã sinh rồi" và "không có
  gì để sinh"), nay RPC trả **`{inserted, expected, already_present}`** và **ném lỗi** khi thiếu
  danh mục lớp chuẩn hoặc khi năm học đã đóng. Danh mục **5 ngành · 13 cấp · 19 mẫu lớp** rời
  `seed.sql` để **đi theo migration** (`supabase db push` không chạy seed — 5W-F11), giữ nguyên
  UUID cố định. **Cả bốn thao tác ghi nay nói ra kết quả** (TB-F12/AC-M02-04): thêm `.select("id")`
  để 0 dòng không còn báo thành công (SW-04), và `failure()` **nhận diện lỗi Zod** thay vì gán mọi
  lỗi lạ thành `CONFLICT`. **3 migration**, **0 thay đổi giao diện ngoài `/admin`**.
  🔴 **Lỗi thật, chỉ chạy mới thấy:** `redirect()` về **chính route đang đứng** làm Next 15.5 đổi
  thanh địa chỉ rồi **bỏ luôn lượt dựng lại trang** — `<main>` trắng vĩnh viễn, log máy chủ sạch,
  không lỗi trình duyệt. Đo trên cùng bản build: sang route khác **749 ms**, về chính nó **treo quá
  120 giây**. Đã đổi cả bốn biểu mẫu sang **`useActionState`** (D-114) — vẫn chạy khi không có JS.
  Unit **641 pass/10 skip** (trước 624/10, **+17**) · pgTAP **733/733** (trước 710, **+23**: `032`
  20 bài JWT thật · `008` +3) · E2E **33/33** (`academic-year` 15 + `responsive` 9 + `security` 9)
  trên 360·768·1366 · lint 0 · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-25 (mở đường M02-A):** **D-112** (vòng đời năm học **chỉ Super
  Admin** — ba tầng quyền trước đó nói ba kiểu; `docs/05` §3/§4/§5 đã sửa theo) · **D-113** (đặt
  năm hiện hành khi chưa đủ lớp thì **cảnh báo bằng con số thật** rồi vẫn cho làm, không chặn cứng).
- **`2B · M04-C — XONG — Claude — 2026-07-25`** ⇒ **M04 ĐÓNG.** **Mỗi việc một nơi (D-111).**
  `/admin` thu hẹp về **tra cứu + xử lý ngoại lệ**: biểu mẫu tạo tài khoản còn **4 vai trò không
  gắn hồ sơ GLV** (Cha sở · Cha phó · Phụ huynh · Thiếu nhi) thay cho **14**, bốn ô chọn phạm vi
  (năm học · ngành · lớp · hồ sơ GLV) **gỡ hẳn** ⇒ trang chạy **3 truy vấn thay vì 7**, và không
  còn thẻ `<select>` trần nào. Siết ở **schema** chứ không chỉ ẩn ô chọn: `provisionAccountSchema`
  từ chối mọi vai trò gắn hồ sơ nhân sự và bỏ trường `staffProfileId`; nhánh liên kết
  `staff_profiles` **gỡ khỏi** `adminProvisionAccount` ⇒ đường cấp tài khoản GLV **duy nhất** là
  `provisionAccountForStaff`. 🔴 **Lỗ hổng do chính lựa chọn này tạo ra, đã vá cùng đợt:** bản
  M01-B chỉ cho trang hồ sơ chọn đúng vai trò lớp, nên người **vừa đứng lớp vừa làm Trưởng ngành**
  sẽ không cấp được tài khoản ở đâu cả — `grantableRolesForStaff` nay trả vai trò lớp (chọn sẵn)
  **cộng** vai trò ngành/toàn xứ đoàn. **M04-F09 đóng:** đội ngũ lớp mở thẳng hồ sơ GLV; RLS không
  cho đọc thì giữ chữ thường, không dựng link tới trang trống. **0 migration, 0 thay đổi phân
  quyền.** Unit **624 pass/10 skip** (trước 604/10, **+20**) · pgTAP **710/710** (chạy lại toàn bộ
  để chứng minh không hồi quy) · E2E `staff-detail`+`account-security` **24/24** và
  `responsive`+`security` **30/30** trên 360·768·1366 · lint 0 · typecheck ✓ · build ✓ 28/28.
  ⚠️ **Nợ #15 mới (thuộc M02):** bấm thẻ lớp ở `/classes` mất ~15–20 giây, có lượt **mất hẳn** cú
  bấm; `prefetch={false}` **đã thử và hoàn tác** vì không chữa được — E2E tạm dùng `clickUntil`.
- **`2B · M04-B — XONG — Claude — 2026-07-25`** — **danh sách `/staff` dùng được + dọn hồ sơ.**
  Đóng **năm luồng** M04: F01 (danh sách) · F02 (tạo, chống trùng) · F04 (phân công) · F07 (xóa) ·
  F08 (trạng thái phục vụ). **(1) TB-M04-04 + D-108:** tìm không dấu (tên/tên thánh/mã/SĐT) · lọc
  lớp + trạng thái · phân trang 10/trang · trình độ **tiếng Việt** (hết `NONE`) · mặc định ẩn "Đã
  nghỉ" và **ghi rõ số người bị ẩn** · toàn bộ luật lọc là hàm thuần (25 unit test). **(2) D-110:**
  ba mức hiện tài khoản — Super Admin thấy tên đăng nhập, vai trò đọc-toàn-cục khác chỉ thấy cảnh
  báo zombie, còn lại chỉ có/không (mức thấp nhất không chạy truy vấn nào). **(3) TB-M04-03:** cảnh
  báo trùng **hai pha, mềm** (`useActionState`, chạy không cần JS) — không thêm unique constraint.
  **(4) D-106/D-109:** RPC `delete_unused_staff_profile` xóa hồ sơ **chưa từng dùng** (7 bảng tham
  chiếu = 0), gõ lại tên kiểm ở DB, `ConfirmDialog` nêu tên riêng, nhật ký D-65; quyền
  `can_global_write`. **1 migration** (`20260724001200_delete_unused_staff_profile`). 🔴 **Ba lỗi
  thật do chạy bắt được:** (a) hai ô CHỌN quay về mặc định sau cảnh báo trùng ⇒ tạo hồ sơ sai danh
  xưng/trình độ (sửa bằng `key`); (b) bấm số trang không ăn vì 10 thẻ `prefetch` cùng lúc làm nghẽn
  6 kết nối (sửa bằng `prefetch={false}`); (c) `text[] || literal` nổ `22P02` (thêm `::text`).
  Unit **604 pass/10 skip** (trước 551/10, **+53**) · pgTAP **710/710** (trước 688, **+22**: `031`
  22 bài JWT thật) · E2E staff **48/48** + responsive/security **27/27** trên 360·768·1366 · lint 0 ·
  typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-24 (đợt 3, mở đường M04-B):** **D-109** (bốn vai trò ghi toàn xứ
  đoàn được xóa hồ sơ chưa từng dùng) · **D-110** (ba mức hiển thị tài khoản trên `/staff`).
- **`2B · M04-A — XONG — Claude — 2026-07-24`** — **chuyển lớp một bước (D-105)** đóng M04-F06
  (chấm 24/75, thấp gần nhất toàn audit). RPC `transfer_class_staff` làm **bốn bước trong một giao
  dịch**; quyền = `app.can_manage_class` trên **CẢ HAI** lớp ⇒ Trưởng/Phó ngành chuyển được người
  **trong ngành mình**, không kéo được người ngoài ngành. 🔴 **Bẫy đã vá:** thứ tự bốn bước phải
  **ngược** với `04_TO_BE_FLOWS.md` — đóng phân công trước khi khử vai trò là trigger
  `validate_class_staff_assignment` ném `ACTIVE_CLASS_ROLE_EXISTS` ngay bước 1. Cùng đợt: vá lỗi
  trang `/staff/[id]` **nuốt sạch mọi thông báo** (chỉ nhận `params`, không nhận `searchParams` —
  5W-05); bản đồ mã lỗi DB → câu tiếng Việt **nêu tên lớp/tên người** (AC-01.4); `ConfirmDialog`
  nói đúng hệ quả kèm tác dụng phụ lên vai trò đăng nhập (AC-03.1); **gỡ** nút "Kết thúc phân công"
  trần ở `/staff` (lối đi vòng qua chính hàng rào đó). **1 migration**
  (`20260724001100_transfer_class_staff`). Unit **551 pass/10 skip** (trước 523/10, **+28**) ·
  pgTAP **688/688** (trước 651, **+37**: `029` 25 test chuyển lớp · `030` 12 test vá năm lỗ
  S2·S3·S4·S8·S9) · E2E `staff-transfer`+`staff-detail`+`responsive` **27/27** 3 viewport ·
  lint 0 · typecheck ✓ · build ✓ 28/28.
- **Quyết định chủ dự án 2026-07-24 (đợt 2):** **D-105** (một nút "Chuyển lớp" nguyên tử; Trưởng/Phó
  ngành dùng được trong ngành mình — **đã làm M04-A**) · **D-106** (xóa hẳn hồ sơ **chưa từng dùng**
  — M04-B) · **D-107** (bỏ mô tả feature flag `sector_leader_can_manage_class_staff` khỏi `docs/05`
  — **đã làm M04-A**) · **D-108** (danh sách `/staff` mặc định ẩn người "Đã nghỉ" — M04-B).
- **`2B · M01-C — XONG — Claude — 2026-07-24`** ⇒ **M01 ĐÓNG.** Xóa tài khoản nay **GIỮ lịch sử vai
  trò** (D-101/Q3): FK `role_assignments.profile_id` đổi `on delete cascade` → **`on delete set null`**
  + cột nullable. 🔴 **Bẫy đã vá:** hai trigger `validate_ownership_role_link`/`validate_staff_role_link`
  chạy `before update OF profile_id` sẽ ném `*_PROFILE_REQUIRED` và làm hỏng luôn lệnh xóa khi set-null
  một dòng vai trò đang active — thêm chốt `new.profile_id is not null` để bỏ qua dòng mồ côi. RLS
  `role_assignments_select_self_or_global` GIỮ NGUYÊN (dòng mồ côi chỉ đọc-toàn-cục thấy). **1 migration**
  (`20260724001000_role_history_preserved_on_delete`). Unit **523 pass/10 skip** (không đổi) · **pgTAP
  651/651** (trước 634, +17: `028` xóa `auth.users` thật) · E2E **27/27** (account-security + security +
  responsive) 3 viewport · lint 0 · typecheck ✓ · build ✓. **Chạy lại TOÀN BỘ pgTAP** vì đổi
  `role_assignments` ảnh hưởng gián tiếp mọi RLS — không hồi quy policy nào.
- **`2B · M01-B — XONG — Claude — 2026-07-24`** — cấp tài khoản tại hồ sơ + đổi vai trò + trần vai
  trò. Trang mới **`/staff/[id]`** 4 khối; **`provisionAccountForStaff`** (TB-01, payload gọn, vai
  trò lọc theo phân công, pre-check AC-01.3) · **`assignPrimaryRole`** (TB-05, RPC nguyên tử
  super-admin-only) đổi lớp **giữ đăng nhập** · **trần vai trò D-102** ở 3 tầng (Zod · action · DB;
  cả `adminProvisionAccount` cũ) · **`updateStaff`** kích hoạt (đóng M04-F03/F06) · nợ #14 trả `staff`.
  **AC-01.7/D-104:** trường nhạy cảm chỉ `can_global_read` thấy, ẩn ở payload. **1 migration**
  (`assign_primary_role`). Unit **523 pass/10 skip** · pgTAP **634/634** · E2E **36/36** (staff-detail +
  security + account-security + responsive) 3 viewport · lint 0 · typecheck ✓ · build ✓.
- **Quyết định chủ dự án 2026-07-24:** D-101 (xóa tài khoản **GIỮ** lịch sử vai trò — **M01-C**) ·
  D-102 (**trần vai trò** — đã làm M01-B) · D-103 (bỏ 'locked' — M01-A) · **D-104** (trên `/staff/[id]`
  chỉ vai trò quản trị thấy trường nhạy cảm — AC-01.7, đã làm M01-B).
- 🔴 **Việc đang làm là GIAI ĐOẠN 2B** (tái thiết kế giao diện). Task lấy từ
  `docs/system-workflow-redesign/ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md`,
  **không** lấy từ `docs/08-phase-plan.md` nữa.
- **`2B · Đợt 0-UI — XONG`** · **`M14 — XONG`** · **`M09-A — XONG`** (F11 · F14 · D-78, 3 migration).
- **`2B · M09-C — XONG — Claude — 2026-07-24`** ⇒ **M09 ĐÓNG.** Trang chi tiết Ban chuyển sang
  **tabs** · ma sát tương xứng (chức vụ controlled + nút "Lưu", `ConfirmDialog` cho mọi thao tác
  xoá + bàn giao Trưởng ban) · sửa Ban/lịch họp (policy đang bỏ không) · `ends_on` do **DB** đặt ·
  **D-100 đóng nợ #13** (thành viên cùng Ban đọc đầy đủ hồ sơ nhau). Unit **498 pass/10 skip** ·
  pgTAP **610/610** · **E2E `committees.spec.ts` 9/9 xanh 3 viewport** · lint 0 warning · typecheck ✓ · build ✓ 28/28.
- 🔴 **Migration sửa nghiệp vụ của 2B nay là 14** (M02-A ba: `..._reference_catalog` ·
  `..._generate_default_classes_result` · `..._academic_year_super_admin_only` ·
  M09 sáu · M01-A một `..._account_audit_events` ·
  M01-B một `..._assign_primary_role` · M01-C một `..._role_history_preserved_on_delete` · M04-A một
  `..._transfer_class_staff` · M04-B một `..._delete_unused_staff_profile`). Migration cho **theme**
  vẫn là **0** (đúng `11` §7).
- ✅ **Nợ #13 ĐÓNG (D-100).** `app.can_access_staff` thêm nhánh `app.shares_active_committee`;
  RLS negative + positive test bằng JWT thật (pgTAP `024`). Chủ dự án duyệt phạm vi **đầy đủ hồ sơ**
  (kể cả SĐT/ngày sinh/địa chỉ) vì thành viên Ban cần liên lạc.
- ⚠️ **Nợ #10 trả một phần:** `committees.spec.ts` nay dùng helper `expectSoon` (chờ 20s cho khẳng
  định "hiện sau khi làm mới") ⇒ 9/9 xanh. Phần `window.confirm`/chờ cứng ở **`results.spec.ts`/M07
  vẫn mở**. **Nợ #11 vẫn mở** — chạy `npm run perf:smoke` khi máy rảnh.
- **`P7-T7 — ĐANG DỞ`** (ngoài 2B); còn thiếu đăng nhập thật + kiểm backup trên production.

---

## ➡️ VIỆC TIẾP THEO

🔴 **KẾT LUẬN GIAI ĐOẠN 3: NO-GO — chưa xác nhận Giai đoạn 2 hoàn tất.** Không phát hành và không
gắn nhãn production-ready trước khi đóng các việc sau, theo thứ tự:

1. **D-65:** triển khai audit log chung đúng khoảng 30 thao tác/12 nhóm, before/after + địa chỉ
   truy cập, append-only cho mọi application role, redaction và màn hình chỉ Super Admin đọc.
2. **M02:** hợp nhất quy trình chuyển/đóng niên khóa theo workflow đã duyệt; checklist, metadata và
   chuyển trạng thái phải nguyên tử, không còn đường Data API/RPC đi tắt.
3. **M07:** chủ dự án xác nhận AC-03-01; nếu giữ AC thì thêm version/CAS để stale save cùng một ô
   báo conflict và giữ giá trị đã ghi trước.
4. **M11/M06:** bổ sung live report năm lịch sử; đóng cửa sổ Storage/DB split-brain bằng cơ chế
   outbox/tombstone/retry có failure-injection test.
5. **Browser reliability:** xử lý Server Action → revalidate/RSC → client feedback/navigation bị
   kẹt; sau đó reset + seed và chạy lại **đủ 585 E2E, 1 worker, 3 viewport**. Lượt cuối hiện tại là
   **571 pass · 14 fail**, không phải PASS có flake.
6. Chạy production preflight cho owner/default ACL/PG version và rà dữ liệu legacy trước các
   migration hardening; đóng các residual concurrency đã ghi trong báo cáo 03/04.

📌 Bằng chứng và disposition nằm trong `docs/system-workflow-redesign/verification/01..09`; Audit
Board có phụ lục Giai đoạn 3 tại `docs/system-workflow-redesign/00_SYSTEM_AUDIT_BOARD.md` §8.

**Ghi chú lịch sử:** Giai đoạn 2B đã chạy hết các đợt A/B/C của 14 module theo phạm vi triển khai
được hiểu lúc đó. Nội dung dưới đây là backlog lịch sử từ lúc đóng 2B; khi mâu thuẫn, kết luận
verification Giai đoạn 3 ở trên được ưu tiên.

**Audit phần còn lại — đây là backlog/nợ đã chủ động hoãn, không phải M13 hay bước module bị sót:**

- **TB-07 + N-3:** chọn năm học cũ cho báo cáo và `AcademicYearSwitcher` thật; WF-16 bước 3 chưa
  làm được từ giao diện.
- **TB-08A:** lọc báo cáo Kết quả thật theo `assessment_date`; cần chốt luật cho bài không có ngày.
- **N-4/N-5:** `report_snapshots.file_path` chưa dùng và loại báo cáo mới còn phải sửa bốn chỗ.
- **Nợ #22:** lịch sử Top 5 có dữ liệu nhưng chưa có màn hình xem lại.
- **Nợ kỹ thuật:** #2 bí danh token cũ · #3 script màu Nghĩa Sĩ cũ · #5 còn 14 lớp màu có bổ ngữ
  độ mờ không sinh CSS · #7 component design system chưa có consumer · #10 ổn định E2E/Server
  Action/DB dùng chung · #12 mã placeholder/dead code; #4 mật độ portal đã trả ở M13-B.
- **Ngoài 2B:** P7-T7 triển khai/backup production và BLK-8 kiểm dữ liệu thật.

⚠️ **Việc còn nợ của M11:**

- **TB-07 (chọn năm học cho báo cáo) + N-3 (`AcademicYearSwitcher` vẫn là nút giả).** `07` §4 của
  M11 xếp việc này **cuối cùng** vì nó *"đụng nhiều module"*. Hệ quả đang phải chịu: **chốt báo cáo
  cho năm cũ (WF-16 bước 3) vẫn chưa làm được từ giao diện.**

🔴 **Hai bài học của M08-C, đáng mang sang mọi module còn lại:**

1. **Hạng mục nào cần "hiện tên người" đều phải ĐO `profiles` TRƯỚC KHI VIẾT.**
   `profiles_select_self_or_global` chỉ mở cho **chính mình** hoặc `app.can_global_read()` — sáu vai
   trò cấp xứ đoàn. Mọi vai trò **cấp ngành và cấp lớp** đọc `display_name` của người khác ra
   `null`, **trong im lặng**: `lint`/`typecheck`/`test`/`build` đều xanh và màn hình chỉ thiếu một
   cột. Cách đã chốt (**D-163**, cùng khuôn D-97 và D-129): **cửa sổ hẹp** chỉ trả `id → tên`, chép
   nguyên vị từ của policy đang có, **không** nới `profiles` — vì RLS lọc theo **dòng chứ không
   theo cột**. M11 (Báo cáo) và M13 (Cổng PH) gần như chắc chắn gặp lại đúng câu hỏi này.
2. **Lượt kiểm cuối phải chạy trên ĐÚNG bản mã cuối.** M08-C sửa một chú thích **sau** khi
   `build`/`typecheck` đã chạy, và chú thích ấy đặt sai chỗ trong một biểu thức ba ngôi JSX ⇒
   `next build` hỏng cú pháp, chỉ lộ ra ở lượt E2E (vì `run-e2e.mjs` tự `next build` lại).

⚠️ **Trần AC-13 của `/promotions` đã CHẠM ĐÚNG 6 lượt gọi** sau M08-C (M08-A dùng 3–5). Ai thêm bất
cứ thứ gì cần đọc vào trang ấy phải **gộp vào một lượt đang có**, không được thêm lượt thứ bảy.

✅ **Việc M07 bàn giao đã xong ở M08-A:** kiểm chéo *"ẩn một cột điểm ⇒ đổi điểm trung bình mà
chuyển lớp đọc"*. Khung nhìn `v_student_weighted_average` vốn đã lọc `is_active` từ Phase 5, và nay
có **4 bài pgTAP đo hai con số thật** thay vì một câu khẳng định. **M11 và M13 vẫn phải tự kiểm chéo
khi tới lượt** — chúng đọc cùng con số ấy qua đường khác.

⏸️ **Hạng mục 9a của M07 (khoá lạc quan đầy đủ) — CỐ Ý để ngỏ, và không thuộc M08.** `07` §7 luật 3
của M07: *"chỉ làm nếu 9b chưa đủ — đo bằng thực tế sử dụng, đừng làm trước"*. Đây là thứ **duy
nhất** còn để ngỏ của module bảng điểm. Nếu chủ dự án muốn làm: đổi **kiểu trả về** của
`save_assessment_scores` ⇒ `drop function` + `create` **trong cùng một transaction của migration**,
rồi `npm run db:types`, rồi cập nhật `gradebook-editor.tsx` để tô ô xung đột.

⏸️ **Nợ #22 (mới, do M07-C mở ra) — lịch sử Top 5 có dữ liệu nhưng chưa có màn hình đọc lại.**
Bảng `leaderboard_snapshots` giữ đủ mọi bản Top 5 đã bị thay (thứ hạng, điểm, tên em, ai thay, lúc
nào), có policy chỉ-nhân-sự và có pgTAP. Thẻ Top 5 **đã nói ra số bản** đang nằm trong lịch sử nên
người dùng biết nó tồn tại, nhưng muốn xem nội dung thì phải nhờ Quản trị viên hệ thống truy vấn.
Cố ý chưa làm: `04_TO_BE_FLOWS` không mô tả màn hình nào cho phương án B, và dựng thêm một màn hình
là mở rộng phạm vi ra ngoài đợt đã chốt (`AGENTS` §4). Chỗ tự nhiên để trả: **M11 (Báo cáo)**.

⏸️ **Tầng `fieldErrors` dùng chung ở `src/lib/errors` — M07-A quyết định KHÔNG làm, và ghi lý do.**
`07` §2 của **M06** khuyên làm cùng M07, nhưng `07_IMPLEMENTATION_IMPACT` của **chính M07 không liệt
kê hạng mục ấy**, mà `src/lib/errors` đỡ cả 14 module ⇒ sửa nó là mở rộng phạm vi ra ngoài đợt đã
chốt (`AGENTS` §4). M07-A đóng phần cục bộ ở `features/assessments/db-errors.ts`. Nếu muốn làm tầng
chung thì đó là **một việc riêng cần chủ dự án đồng ý**, không phải phần đuôi của một đợt module.

⚠️ **Việc cần chủ dự án làm, không phải việc của agent — nay có BA món, cùng một loại và cùng một
nhóm người nhận:** `11` §6 đòi **báo trước** cho mọi thay đổi giảm quyền, nếu không người dùng mở
màn hình ra, thấy mất nút, và kết luận là hệ thống hỏng.

| Đã có hiệu lực | Ai mất gì | Từ đợt |
|---|---|---|
| **D-144** | Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký **không sửa được giáo án** (vẫn xem đầy đủ) | M06-B |
| **D-74 + D-151** | Cùng ba vị ấy **mất nút "Khóa bảng điểm"**; Dự trưởng phụ tá cũng không khóa được. Quản trị viên hệ thống **được thêm** làm đường thoát cuối năm | **M07-B** |
| **D-152** | Giáo lý viên thường và Dự trưởng phụ tá **không còn sửa/xóa được nhận xét của người khác** — chỉ người viết, Giáo lý viên đại diện lớp và Ban điều hành xứ đoàn | **M07-B** |

Kèm một thay đổi **không phải giảm quyền nhưng đổi thói quen**, nên cũng nên nói: ô *"Mức hiển thị"*
khi viết nhận xét nay mặc định là **Nội bộ nhân sự**, không còn là *"Công khai cho phụ huynh"*.

**Quy trình:** đợt nào có migration thì `db:reset` → `test:db` → `db:types` → `seed:dev`. Mọi đợt
chạy `lint` · `typecheck` · `test` · `build` · `test:e2e` bộ của module trên **ba viewport**.
🔴 **E2E toàn bộ chỉ đo được trên DB vừa `db:reset` + `seed:dev`** — và M07-A đo được cái giá của
việc quên: cùng một bộ `results.spec.ts`, cùng một bản build, chạy trên DB đã tích tụ dữ liệu 3 lượt
trước mất **4,5 phút**; chạy ngay sau `db:reset` + `seed:dev` mất **60 giây**. Spec này cộng thêm 2
cột điểm vào lớp **mỗi lượt chạy**.
🔴 **pgTAP phải chạy TRƯỚC `seed:dev`** — chạy sau thì 8 file đỏ bằng "Bad plan", không phải hồi quy.

✅ **Ba món nợ đến hạn ở M07 — đợt A trả hai, còn một:**

- ✅ **Nợ #20 — ĐÓNG HẲN.** `results/[classId]` là chỗ cuối cùng của toàn hệ thống; bài E2E đo bằng
  `boundingBox()` (chiều cao **thật đã dựng**, không kiểm tên lớp CSS) đặt ngay đầu luồng bảng điểm.
- ✅ **Nợ #14** → `assessments`. ⚠️ **Lại đúng cái bẫy M12-A đã dặn**: `requireAuthContext` nấp
  trong **ba** hàm bọc, nên grep tên hàm ở tầng action chỉ thấy **5** trong **15** thao tác.
  **Cập nhật sau M08:** `promotions` đã trả ở M08-A, và danh sách cũ ghi thừa `absence-requests`
  (M05-B trả rồi). Còn đúng **3 module**: `theme` · `reports` (M11) · `notifications` (M10).
- ✅ **Nợ #18 — ĐÃ TRẢ ở đợt B** cho cả bốn bảng của module. 🔴 Điều đáng mang sang module sau:
  **cùng một món nợ, hai chỗ đặt hàng rào trái ngược, trong CÙNG một module.**
  `assessments`/`student_comments`/`leaderboards` ghi thẳng qua policy ⇒ khuôn một dòng của M02-C;
  `assessment_scores` thì `authenticated` **chỉ có `select`**, mọi đường ghi đi qua RPC
  `security definer` ⇒ điều kiện đặt trong policy **không bao giờ chạy**.
  **Cập nhật sau M08:** `promotion_reviews` đã trả ở M08-B (D-160, ca **RPC**, khuôn M05-A). Còn
  **2 bảng**: bảng của **M10** và `report_snapshots` (**M11**).
- ⏸️ **Nợ #1** → **đợt C**, và nay chỉ còn **đổi vỏ**: nội dung bốn câu hỏi đã được viết lại cho
  đúng nghiệp vụ mới ở đợt B.
- ⏸️ **Nợ #21 (mới, do đợt B mở ra)** → **đợt C**, xem điều 4 phía trên.

🔴 **Ba điều M07-A để lại cho mọi module còn lại:**

1. 🔴 **`using` của policy LỌC DÒNG TRƯỚC KHI TRIGGER CHẠY — nên "bị chặn" và "thành công" trông y
   hệt nhau.** Bốn policy ghi của M07 mang `not app.is_gradebook_locked(...)` ngay trong `using`,
   nên một lượt UPDATE lên bảng điểm vừa bị người khác khóa **không ném `GRADEBOOK_LOCKED`** — nó
   chỉ đổi **0 dòng**, và màn hình báo *"Đã cập nhật cột điểm."*. Ẩn nút theo trạng thái **không**
   che được ca này: người đang mở sẵn trang lúc người khác bấm khóa vẫn bấm được. ⇒ **Mọi thao tác
   ghi phải `.select()` và đếm dòng** (SW-04), không riêng những thao tác "nhạy cảm".
2. 🔴 **Ô nhập KHÔNG KIỂM SOÁT mà thiếu `key` là một quả mìn chờ.** Ô ghi chú của bảng điểm thiếu
   `key` từ Phase 5; suốt thời gian ấy hậu quả chỉ là *"ghi chú người khác vừa sửa không hiện lên"*
   — khó chịu nhưng vô hại, vì lượt lưu ghi đè cả roster. **Đúng lúc chuyển sang "chỉ gửi ô đã đổi"
   thì nó thành lỗi mất dữ liệu:** một giá trị cũ kẹt trong DOM bị tính là *"đã đổi"* và ghi đè đúng
   thứ vừa được cập nhật. ⇒ Trước khi đọc DOM để so với dữ liệu máy chủ, kiểm xem ô ấy có remount
   sau `router.refresh()` không.
3. 🔴 **Nhận ra "câu lỗi tự viết" bằng `code === "custom"` là CHƯA ĐỦ.** Khuôn của M06 dựa vào đó,
   nhưng phần lớn câu đáng giá lại nằm ở tham số thứ hai của `.min(1, "…")` / `.positive("…")` — zod
   giữ nguyên `code: "too_small"`. Dấu hiệu dùng ở M07: **câu tự viết là tiếng Việt có dấu**, câu zod
   sinh ra là tiếng Anh thuần ASCII. Và nhãn trường phải lấy từ đoạn **cuối** đường dẫn, không phải
   đoạn đầu — một ô sai ở `scores[7].score` mà lấy đoạn đầu thì ra *"Bảng điểm không đúng định
   dạng"*, đúng mà vô dụng.

🔴 **Ba điều M06-B để lại cho mọi module còn lại:**

1. 🔴 **Tệp `"use server"` CHỈ được export hàm async — và không cửa kiểm nào bắt được.** Thêm một
   `export const MESSAGE = "…"` vào `src/features/*/server/actions.ts` làm **chết cả trang** với
   `A "use server" file can only export async functions, found string`, trong khi `lint` ·
   `typecheck` · `test` · `build` **đều xanh**: Next chỉ dựng danh sách Server Action lúc trang được
   render thật, nên bằng chứng duy nhất là một lượt E2E — thứ đắt nhất và chạy sau cùng. Đây là bản
   sinh đôi của bẫy `"use client"` dự án đã trả giá một lần. ⇒ Hằng số/kiểu dùng chung đặt ở **file
   thuần** cạnh đó. Cửa chặn đã dựng: `tests/unit/use-server-exports.test.ts`, chạy trong `npm test`.
2. **Chống ghi đè bằng kiểm phiên bản: đừng cho mốc thời gian đi qua `Date`.** `timestamptz` là
   **micro giây**, `Date` của JavaScript chỉ tới **mili giây**. Một vòng `new Date(x).toISOString()`
   là phép so ở cơ sở dữ liệu **không bao giờ khớp**, và hàng rào chống ghi đè quay ra chặn chính
   người đang sửa. Kèm: `z.string().datetime()` mặc định **chỉ nhận hậu tố `Z`**, mà PostgREST trả
   `+00:00` ⇒ phải `datetime({ offset: true })`. Khuôn dùng lại được ở M07 (bảng điểm cũng nhiều
   người cùng sửa).
3. 🔴 **"UPDATE trả 0 dòng" có nhiều hơn một nguyên nhân, và nói sai nguyên nhân còn tệ hơn im
   lặng.** Từ khi RLS mang hàng rào năm học, 0 dòng có thể là: bản đang giữ đã cũ · dòng vừa bị xoá ·
   `using` của policy lọc im lặng. Dán một câu *"người khác vừa cập nhật"* cho cả ba là bảo người
   dùng đi tải lại trang trong khi việc phải làm hoàn toàn khác. Đọc lại rồi mới trả lời.
4. 🔴 **Con số "E2E toàn bộ" chỉ so sánh được giữa hai lượt CÙNG xuất phát từ `db:reset` +
   `seed:dev`.** Đo được ở đợt này: hai lượt trên **cùng một mã nguồn** cho **bộ bài đỏ khác nhau**,
   vì **một số spec TIÊU THỤ dữ liệu seed** — `staff-directory` D-106 xoá hồ sơ nhân sự "chưa từng
   dùng", `student-lifecycle` xoá bản ghi bí tích, `academic-year` sinh lớp mặc định. Bằng chứng
   trực tiếp: chạy riêng `staff-directory.spec.ts` lần thứ hai thì bài D-106 đỏ ngay ở dòng
   *"seed phải còn ít nhất một hồ sơ chưa từng dùng để xoá"*.
   ⇒ **Chạy E2E toàn bộ trên DB đã dùng rồi là tự tạo ra bài đỏ oan**, và phiên sau sẽ ghi nhầm
   chúng thành hồi quy của module vừa làm. Đợt này đã suýt ghi 4 bài `staff-directory` như vậy.

🔴 **Ba điều M06-A để lại cho mọi module còn lại:**

1. **`bodySizeLimit` là trần của MỌI Server Action, không riêng luồng nhập Excel.** M06 mang trần
   5 MB từ Phase 4 trong khi nền tảng chặn ở 4,5 MB, nên khoảng 4,5–5 MB **không bao giờ** chạm tới
   mã ứng dụng — câu lỗi tiếng Việt viết cho đúng khoảng ấy chưa từng hiển thị lần nào, còn dòng chữ
   *"tối đa 5 MB"* thì **mời** người dùng làm đúng thứ chắc chắn hỏng. **Module nào còn màn hình tải
   tệp lên phải tự kiểm con số của mình so với `next.config.mjs`.** Cách làm có sẵn: một file thuần
   giữ trần + câu chữ + hàm kiểm, dùng chung cả hai phía, cộng một bài test **đọc thẳng
   `next.config.mjs`** thay vì chép tay con số.
2. **jsdom: `new FormData(form).get("file")` trả về `File` size 0, mất cả tên lẫn kiểu MIME.**
   Khác và **tệ hơn** giới hạn M12-A đã ghi (biểu mẫu có tệp thì cú bấm nút không kích hoạt
   `onSubmit` — cái đó vẫn đúng, vẫn phải `fireEvent.submit`). Hệ quả: kiểm tệp ở client phải đọc
   `input.files`, không đọc `FormData` — vừa đúng hơn về bản chất vừa là cách duy nhất unit test
   chứng minh được điều gì.
3. 🔴 **Một bài E2E "xanh" chưa chắc đã kiểm thứ nó tưởng.** Bài cũ của M06 chờ **tên tệp** hiện trên
   màn hình để kết luận "đã lưu"; đợt A đổi ô chọn tệp sang `FileUpload`, và component ấy hiện tên
   tệp ngay lúc **chọn** — tức trước khi bấm Lưu. Bài ấy xanh **kể cả khi lượt lưu thất bại hoàn
   toàn**, và lượt đỏ đầu tiên rơi ở một bước cách chỗ hỏng thật **ba thao tác**. ⇒ Khẳng định phải
   nhắm vào thứ **chỉ tồn tại sau khi ghi thành công** (một nút, một trạng thái), đừng nhắm vào chữ
   mà người dùng vừa gõ hoặc vừa chọn.


🔴 **Một điều M05-C để lại cho MỌI module còn lại, và nó về cách ĐỌC KẾT QUẢ TEST:** một bài E2E đỏ
bằng *timeout* **không** tự động là nợ #10. M05-B đã gán nhầm đúng như vậy, và M05-C mở
`error-context.md` ra đọc thì thấy một **lỗi ứng dụng thật**: `AbsenceReviewPanel` trả về trạng thái
rỗng **trước khi** dựng dòng thông báo, nên ghi nhận đơn *cuối cùng* thì câu xác nhận bị chính lượt
`router.refresh()` nó kích hoạt xoá mất — vi phạm D-61 ở ca thường gặp nhất, và **không bài unit nào
bắt được** vì mọi bài đều dựng lại với danh sách không đổi. Hai dấu hiệu phân biệt: nợ #10 để lại
nút còn nguyên chữ *"Đang lưu…"* ở trạng thái vô hiệu; lỗi thật để lại một màn hình **đã đổi xong**
mà thiếu đúng thứ bài test đang chờ.

✅ **Bốn món nợ đến hạn ở M05 — ĐÃ TRẢ HẾT (A ba, B một):**

- ✅ **Nợ #19** → **D-140**: em `paused` ra khỏi danh sách điểm danh, trang buổi nói ra số em.
- ✅ **Nợ #20** → link "← Danh sách buổi" đạt 44px, có bài E2E đo bằng `boundingBox()`.
- ✅ **Nợ #14** → `attendance` ở đợt A, `absence-requests` ở đợt B (guard ngoài `try` +
  `requireRouteAccess`). Còn **6 module** mang lỗi này.
- ✅ **Nợ #18** → ba bảng điểm danh (đợt A, hàng rào **trong RPC**) và `absence_requests` (đợt B,
  hàng rào **trong policy**).
  🔴 **Bài học của M05, đọc trước khi trả nợ #18 ở module khác:** dòng ghi trong nợ ("mỗi bảng chỉ
  cần thêm một dòng vào policy") **chỉ đúng khi bảng đó được ghi qua policy**. Ba bảng điểm danh ghi
  qua RPC `security definer`, mà definer **bỏ qua RLS** — thêm điều kiện vào policy ở đó là dựng một
  **hàng rào giả**. `absence_requests` thì ngược lại, và cùng một module chứa **cả hai ca**. Xem
  bảng đó ghi bằng đường nào TRƯỚC khi chọn chỗ đặt hàng rào.

🔴 **Một điều M05-B để lại cho MỌI migration sau đụng `student_attendance_records`:**
`authenticated` **không còn quyền `select` mức bảng** — nó được cấp **từng cột trừ `note`** (D-75).
Thêm cột mới mà quên `grant select (cột_mới)` là cột ấy **vô hình với cả ứng dụng**, và triệu chứng
`42501` trông hệt lỗi RLS. pgTAP `042` có bài đối chiếu, đỏ kèm tên cột bị bỏ quên. Đường đọc ghi
chú hợp lệ duy nhất: `public.attendance_session_notes(p_session_id)`.

**Hai câu M12 để lại chưa chốt** (`08_ACCEPTANCE_CRITERIA` §D của M12-IMPORTS) — **không chặn M05**,
hỏi khi có dịp: **NC-04** "Ghép hồ sơ có sẵn" có **cập nhật** số điện thoại/địa chỉ mới lên hồ sơ cũ
không, hay chỉ mở ghi danh (hiện chỉ mở ghi danh — và sau D-133 thì "Ghép" là **mặc định** của dòng
trùng nên câu này nặng hơn trước) · **NC-05** có cần **hoàn tác** một lần nhập đã ghi không.
**NC-01 → D-137 · NC-02 → D-138 · NC-03 → D-132: đã đóng.**

✅ **Hai điều M03 để lại cho M12 — cả hai đã đóng, ghi lại để không ai lật lại:**

1. **Luật dò trùng nay là của chung, không còn thuộc module Nhập Excel.** M03-B chuyển nó lên
   `src/lib/students/duplicate.ts`; `src/features/imports/dedup.ts` chỉ còn là lớp mỏng gọi vào đó.
   Có unit test chạy **cùng một cặp dữ liệu qua cả hai đường** để canh hai bên không lệch mức.
   Sửa luật ở một bên là đổi hành vi của cả hai — đó là chủ ý (AC-F13-04).
2. ✅ **Trigger `enrollments_need_active_student`** (M03-C, BR-M03-N13) — **đã xử lý ở M12-A.**
   Nó chặn ghi danh cho em có `students.status <> 'active'`, mà luồng nhập Excel ghi thẳng vào
   `enrollments`. Nay `commit-errors.ts` dịch `STUDENT_NOT_ACTIVE` thành câu nói rõ việc phải làm
   (khôi phục hồ sơ ở trang Thiếu nhi trước), và `row-decision.ts` **chặn trước từ bước duyệt**:
   dòng nào mặc định là "Ghép" mà hồ sơ đối chiếu không còn sinh hoạt thì phải có người xác nhận.

🔴 **Một điều M12-C để lại cho MỌI module còn lại có màn hình xuất tệp** (M07 bảng điểm · M11 báo cáo
· M13 cổng): `safeSpreadsheetText` ở `src/lib/exports/spreadsheet.ts` nay chặn thêm **`TAB` và `CR`**
đứng đầu ô, đúng chữ của BR-M12-37. Nhưng bài học thật của đợt C không phải cái regex — mà là:
**dữ liệu lỗi của cơ sở dữ liệu (`sqlerrm`) nằm sẵn trong `errors_json`, và một màn hình đã dịch nó
không có nghĩa là tệp xuất ra cũng dịch**. SEC-16 suýt mở lại ở cửa thứ hai, và cửa ấy tệ hơn màn
hình vì tệp **đi ra ngoài hệ thống**. Module nào xuất tệp cũng phải tự hỏi câu đó.

**Nợ đợt M03 để lại, đúng module mới trả:**

- ✅ **Nợ #19 (M05 Điểm danh) — ĐÃ TRẢ ở M05-A** bằng **D-140**: em tạm nghỉ ra khỏi danh sách điểm
  danh, trang buổi ghi *"N em đang tạm nghỉ, không có trong danh sách này"*. Chủ dự án cân nhắc cả
  đường "giữ tên nhưng mặc định Vắng có phép" và **không chọn**, vì nó sinh cảnh báo chuyên cần giả
  cho chính những em xứ đoàn đã biết là đang nghỉ.
- **D-67 phần M11:** mức đọc của Thủ quỹ ở M03 đã xong (danh sách em theo lớp + liên lạc phụ huynh
  + dấu hoàn cảnh khó khăn qua cửa sổ hẹp `list_students_for_fees`). Phần **báo cáo tổng hợp**
  ("xem và tải, **không** chốt") chờ tới lượt M11.
- ✅ **D-75 (M05/M13) — ĐÃ TRẢ ở M05-B** bằng **quyền cột**, không bằng một nhánh trong policy:
  phụ huynh vẫn đọc đúng dòng của con mình (bài `012` canh con số 1 dòng **vẫn xanh**) và thẻ
  chuyên cần vẫn cộng đủ, nhưng **cột ghi chú thì không ai đọc thẳng được nữa**. Phần **giao diện
  cổng phụ huynh** thuộc M13, khi tới lượt phải **rà lại** vì nó thêm màn hình mới.
  ⚠️ *Siết quyền với người đang dùng — phải báo trước.*

> ✅ **Ba câu `NEEDS_CONFIRMATION` của M03 đã đóng hết** (chủ dự án chốt 2026-07-28):
> Q-M03-02 → **D-127** (theo đúng bảng phân quyền: vai trò ngành **và** Giáo lý viên ghi được sức
> khoẻ/bí tích trong phạm vi mình; Dự trưởng phụ tá vẫn chỉ đọc) · Q-M03-05 → **D-128** (sửa cho mọi
> người ghi được, **xoá** chỉ cấp xứ đoàn) · Q-M03-06 → **D-125** (không lưu vết bỏ qua cảnh báo
> trùng). Kèm **D-129** (Thủ quỹ **được** xem ô "hoàn cảnh khó khăn") và **D-130** (hồ sơ "Tạm nghỉ"
> kéo theo ghi danh).

> ✅ **Chín câu `NEEDS_CONFIRMATION` của M02 đã đóng hết.** Ba câu cuối được chủ dự án chốt
> **2026-07-26**: Q-M02-04 → **D-117** (sau khi đóng, Super Admin ghi được **tất cả**) ·
> Q-M02-08 → **D-119** (đóng năm **không** tự đóng lớp) · Q-M02-09 → **D-120** (`retention_until`
> **chặn** lưu trữ trước hạn). Kèm **D-118** — phạm vi hàng rào ghi chỉ **ghi danh + lớp** ở đợt
> này. Sáu câu trước: Q-M02-01 → **D-112** · Q-M02-02 → **D-71** · Q-M02-03 → **D-73** ·
> Q-M02-05 → **D-69** · Q-M02-06 → **D-70** · Q-M02-07 → **D-72**.

**Đã trả ở M01 + M04 + M02 (cả ba đợt), không nhắc lại:** **chốt sổ năm học có bảng kiểm + gõ lại mã
(M02-F09)** · **hàng rào ghi bằng RLS cho năm đã đóng (D-117/D-118)** · **siết đọc lớp/năm học của
phụ huynh–thiếu nhi (D-70)** · cấp tài khoản tại hồ sơ · đổi vai trò giữ đăng
nhập · trần vai trò · xoá tài khoản giữ lịch sử vai trò · **chuyển lớp một bước** · **phản hồi thật
cho thao tác ghi** · **câu lỗi nêu tên lớp/tên người** · **danh sách tìm/lọc/phân trang** · **chống
trùng hồ sơ** · **xóa hồ sơ chưa từng dùng** · **`/admin` thu hẹp về tra cứu/ngoại lệ (D-111)** ·
**đội ngũ lớp mở thẳng hồ sơ GLV** · **sinh lớp hết báo thành công giả (M02-F02)** · **danh mục 19
lớp chuẩn đi theo migration** · **quyền năm học về Super Admin (D-112)** · **nhãn trạng thái tiếng
Việt + ngày dd/MM/yyyy ở `/admin`** · **chi tiết lớp neo vào năm học (M02-F07)** · **màn hình cài đặt
lớp, `updateClass` có call site thật (M02-F08)** · **huy hiệu trạng thái lớp** · **mốc kết thúc học kỳ
1 (D-115/D-116)** · guard ngoài `try` cho
`auth`+`staff`+`committees`+`equipment`+`academic-years`.

**Nên làm sớm, không phụ thuộc module nào:** **nợ #11 vẫn mở**, nhưng M03-B đã chạy
`npm run perf:smoke` với **909 thiếu nhi** và số đo cho thấy tầng cơ sở dữ liệu **không** phải nút
thắt: truy vấn nặng nhất của `/students` sau khi thêm join ngành/lớp là **52 ms**, đếm tổng để phân
trang **13 ms**, tìm không dấu **14 ms**, dò trùng **10 ms**, danh sách em chưa ghi danh của trang
lớp **9 ms** (bản cũ kéo cả 909 dòng: 9 ms). Phần **chưa đo** của nợ #11 vẫn là chi phí
`resolveThemeContext` trên mọi lần dựng trang — cần một lượt đo **khi máy rảnh** rồi so với số
Phase 7 (`/dashboard` 13 ms · `/students` 65 ms).

**Chạy E2E thế nào cho đúng** (đọc trước khi đụng vào `run-e2e.mjs`):
Supabase local dùng cổng API **54421**, không phải 54321. `npm run test:e2e` nay **tự
`next build`** với env local và **từ chối chạy** nếu URL không phải máy này hoặc cổng 3107
đã bị chiếm. Stack local hay bị tắt để nhường Docker cho dự án khác — kiểm
`docker ps --filter name=cq-tntt-manager` trước khi chạy (tên container có dạng
`supabase_db_cq-tntt-manager`; nếu `studio`/`analytics` tắt mà `db`/`kong`/`auth` còn sống
thì vẫn chạy E2E được).

🔴 **Chạy `npm run db:reset && npm run seed:dev` trước mỗi lượt E2E đầy đủ.** Bộ E2E để lại
dữ liệu đã biến đổi (bài chuyển lớp kết thúc ghi danh, bài bảng điểm khóa sổ), và fixture
`results.spec.ts` **chỉ vừa được sửa cho tái lập được** ở M14-A — trước đó chạy lượt hai là
rớt ngay ở bước dựng dữ liệu với lỗi `enrollments_open_has_no_end`.

**Ngoài 2B:** `P7-T7` vẫn dở — chỉ chờ user đăng nhập thật trên production và kiểm backup.

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
- **`supabase db push` KHÔNG chạy `supabase/seed.sql`.** Đây là bẫy đã sập một lần khi deploy
  thật: 27/27 migration lên đủ, app chạy, đăng nhập được, nhưng `/classes` rỗng vì
  `sectors`/`grade_levels`/`class_templates`/`committees` chưa có dòng nào, và
  `generate_default_classes` đọc `class_templates` rỗng nên tạo **0 lớp mà không báo lỗi**.
  Local không bao giờ lộ vì `db reset` có chạy seed. Quy trình đã ghi ở docs/12 §4a bước 2b.
  Đáng làm ở phase sau: cho `generate_default_classes` ném lỗi khi `class_templates` rỗng.
- **Bảng rỗng trả `[]` giống hệt RLS chặn.** Khi kiểm RLS negative trên production, chỉ được
  dùng bảng **chắc chắn có dòng** làm bằng chứng (`profiles`, `academic_years`); bảng rỗng
  không chứng minh được gì. Đã suýt kết luận nhầm ở lần smoke đầu.
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
| ~~BLK-5~~ | ~~Chưa có Supabase production credentials~~ | **ĐÃ GỠ 2026-07-22** — project `dnqzheyerrqnzilxrtdp`, 27/27 migration đã áp | — |
| BLK-6 | Chưa có domain riêng | Không chặn; đang dùng `cq-tntt-manager-web.vercel.app` | User mua/cấu hình nếu cần |
| BLK-7 | Nghiệp vụ Sa mạc còn câu hỏi mở | Chặn Phase 8 | Hỏi lại theo `docs/13-summer-camp-backlog.md` |
| **BLK-8** | **Supabase Free KHÔNG có backup tự động** (đã kiểm màn hình Database → Backups ngày 2026-07-22; cả scheduled backup lẫn point-in-time đều không có). Dump thủ công là lớp bảo vệ duy nhất. | **CHẶN nhập dữ liệu thật của thiếu nhi vào production.** User đã chọn: dùng thử với dữ liệu mẫu trước, quyết định backup sau. Không chặn việc thử nghiệm tính năng. | Nâng lên Pro, **hoặc** chốt lịch dump tay mỗi tuần theo docs/12 §8 và có người nhận trách nhiệm |

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

### [2026-08-17] Phiên 71 — Claude — `P3-UI-001` (Đợt F — đợt CUỐI) ⇒ **ĐÓNG kế hoạch 17**

- **Claim:** kế hoạch 17 **Đợt F** — `Button pending` + trả nợ #5 + xoá nhóm "BÍ DANH CŨ" +
  tổng nghiệm thu. Đợt cuối ⇒ `P3-UI-001` **XONG**, có mục tổng kết A→F ở `16` §6.7.

- **🔴 Số của `17` §8 sai gấp gần 5 lần — đếm lại chứ không chép, như mọi đợt.** Kế hoạch ghi
  *"11 chuỗi Đang…"*; số thật **51** (50 ternary JSX + 1 nhánh trong `sendButtonLabel`). Cộng
  **16** nút chỉ-disabled-không-nói-gì ⇒ **67 nút trên 38 tệp** sang `pending` prop (đo bằng
  `git diff | grep -c "pending={"`).

- **`Button pending` — nhãn GIỮ NGUYÊN làm tên trợ năng, spinner đè lên trên.** Overlay
  `absolute inset-0` + `aria-hidden`, nhãn `opacity-0` giữ đúng bề rộng; tự `disabled` +
  `aria-busy`. Bản cũ đổi nhãn thành "Đang lưu…" là đổi TÊN nút giữa chừng. KHÔNG `"use client"`
  (`filter-bar` không-client import `./button`); bài kiểm chỉ thị đo câu lệnh đầu tệp theo khuôn
  panel.test; `size="sm"` vẫn 44px có bài canh. Luật chọn nút ghi ở `16` §6.6: gọi thẳng action
  → `pending` theo đúng cờ; chỉ-mở-hộp-thoại hoặc anh-em-dùng-cờ-chung → giữ `disabled`.
  Điểm danh chỉ đổi vỏ 2 nút ("Tiếp quản", "Lưu nháp"), 0 dòng hành vi.

- **🔴 Nợ #5: sổ ghi 16, số thật 12** — 3 chỗ đã trả sẵn giữa Đợt E mà sổ không cập nhật, 1 là
  chú thích. Alert/badge LẦN ĐẦU có viền màu trạng thái thật (trước `/30` không sinh CSS, rơi về
  xám); thead bảng điểm nay đúng 09 §6; khối lõm promotion-board lần đầu có nền.

- **🔴 Xoá "BÍ DANH CŨ": tiền đề "usage = 0 từ Đợt E" SAI** — chỉ đúng với 4 bí danh §7.3 đã
  quét. Kiểm từng khoá lộ **126 lượt sống** (`text-muted-foreground` ×106 · `-primary*` ×13 ·
  `bg-muted` ×3 · `divide-border` ×4 — §7.3 bỏ sót biến thể `divide-`). Di trú cùng-biến-CSS
  toàn bộ, trừ MỘT chỗ cố ý đổi giá trị: vòng tròn hạng Top 5 `text-white` →
  `text-theme-on-primary` (Nghĩa Sĩ vàng nghệ + trắng là trượt AA — cùng họ Đợt D). Rồi mới
  xoá 10 khoá + 3 khoá phụ khỏi tailwind.config, khối 18 biến khỏi globals.css. ⚠️ `surface` là
  token MỚI nằm lẫn trong nhóm cũ — chuyển lên nhóm trung tính, KHÔNG xoá.

- **🔴 E2E 15 đỏ / 573 xanh (45 phút) — và một cuộc điều tra ~1 giờ đáng từng phút.** 14/15
  khớp hồ sơ nợ cũ (5 bài ổn định + flapper + hạ tầng). Tên mới `academic-year:106` [m360]:
  chạy riêng ×2 vẫn đỏ → đối chứng Đợt E xanh → **tưởng hồi quy thật** → trace Playwright cho
  bằng chứng pháp y sâu nhất từ trước tới nay của họ nợ #10: **`POST /admin` 200 +
  `x-action-revalidated` trong 169ms mà client không bao giờ hoàn tất transition, overlay treo
  vĩnh viễn** → bisect cho kết quả mâu thuẫn logic → chạy nguyên trạng lần 4: **XANH**. Kết
  luận: cuộc đua nhạy theo **từng bản build** (đổi hash chunk là đổi cửa sổ đua), không phải
  hồi quy Đợt F; một mẫu đối chứng xanh không đủ kết tội. Quy trình chuẩn ghi ở `16` §6.7 mục 6.
  Hồ sơ nợ #10 được nâng cấp: *"chưa truy ra cơ chế"* → *"máy chủ trả lời xong, client không áp
  dụng được"*; ứng viên sửa gốc = chuyển nốt action còn `revalidatePath` sang khuôn
  refresh-sau-phản-hồi (P3-UX-001 §7.1).

- **File thay đổi (~64):** `button.tsx` + 38 tệp chỗ gọi + ~28 tệp di trú (chồng nhau một phần)
  · `tailwind.config.ts` · `globals.css` · `alert/badge/confirm-dialog` · `publish-preview.ts` ·
  `button.test.tsx` (2→9 bài) · `notification-publish-preview.test.ts` · `16` · `WORKLOG`.

- **Migration/data impact:** **không có.** 0 business rule · 0 migration · 0 đổi RLS · 0 đổi
  quyền · 0 dòng dữ liệu — thuần trình bày.

- **Đã test:** lint **0 warning 0 error** · typecheck ✓ · unit **1691 pass / 18 skip / 121 tệp**
  (+7 bài button) · build ✓ **29/29** · grep `.next/static/css` hai chiều (17/17 phải-có, 0
  phải-vắng; CSS build ra cùng hash trước/sau điều tra — bằng chứng cây được khôi phục trung
  thực) · full E2E trên DB reset+seed như trên.

- **Quyết định mới:** không có quyết định nghiệp vụ. `sendButtonLabel` bỏ tham số `pending`
  (nhãn không còn nhiệm vụ báo trạng thái chờ — việc của `Button pending`).

- **Blocker/rủi ro:** ⚠️ Bộ E2E vẫn chưa là cổng tự động (3 viewport chung một DB — 16 §6.5);
  hai việc kế tiếp có hồ sơ sẵn: mỗi viewport một tập dữ liệu + đo lại nợ #10, và khuôn
  refresh-sau-phản-hồi cho các action còn `revalidatePath`.

- **Next action:** `P3-UI-001` **ĐÓNG toàn bộ A→F**. Việc treo kế tiếp nằm ngoài kế hoạch 17
  (xem Blocker).

### [2026-08-17] Phiên 70 — Claude — `P3-UI-001` (Đợt E) + đóng sổ Đợt D

- **Claim:** kế hoạch 17 **Đợt E** — đợt quét **rộng nhất** của kế hoạch: `FilterField` canh thẳng
  khối lọc · gom **9 biến thể panel** về 2 mẫu · quét bí danh token cũ về **0**. Phiên mở đầu bằng
  việc **đóng sổ Đợt D của phiên 69** (xem entry dưới): chạy lại toàn bộ cửa kiểm trên cây làm việc
  còn dở rồi commit riêng `fd8acfa`, để **một commit vẫn là một đợt**.

- **🔴 Mọi con số của `17` §7 đều đã lệch — đếm lại chứ không chép.** Đợt D bắt được kiểu sai này
  một lần (§6 ghi 11, liệt kê 10); §7 nặng hơn vì nó liệt kê ~40 chỗ trên nhiều module và Đợt B/C/D
  đã xê dịch gần hết. Số thật: V2 **21** (kế hoạch ghi 13, bỏ sót 8 chỗ) · V3 **6** (ghi 4) ·
  V4 **3** về `Card` (ghi 5 — 2 chỗ thật ra là khối **lồng trong** thẻ, đặt `Card` có bóng vào
  trong `Card` là chồng hai tầng bóng) · V5 **5** (ghi 3) · V6 **5+5** (ghi 4+3) · V7/V8 khớp.
  **Tổng 37 khối** đổi, không phải ~33. Và **mọi** `file:line` của §7.1/§7.2 đều lệch — bảng đối
  chiếu đầy đủ ở `16` §6.5.

- **`FilterField` — ba tầng CỐ ĐỊNH là lời giải cho "lệch tùm lum" (hình 3 của chủ dự án).**
  Hàng nhãn `h-5` + `mb-1.5` → control `min-h-11` → gợi ý `min-h-[18px]`; **hai tầng ngoài luôn
  render kể cả khi rỗng** — đó chính là điều kiện để các ô cao bằng nhau. Trước đó trong **cùng một
  lưới** có ô đeo `<Label>`, ô chỉ có `aria-label` (không hàng nhãn nào), ô có dòng gợi ý, ô không.
  Áp cho **27 ô** trên **9 tệp** (6 chỗ gọi `FilterBar` + 4 khối lọc tự chế), xoá **16** `mt-1` lẻ.

- **🔴 Ba quyết định cài đặt, và cái thứ nhất là rủi ro lớn nhất của đợt:**
  1. **`filter-bar.tsx` và `card.tsx` KHÔNG được có `"use client"`** — `card.tsx` đang được rất
     nhiều Server Component dùng, `filter-bar.tsx` được 6 trang dùng. Vì thế `FilterField` nối
     `aria-describedby` bằng **`React.cloneElement`** (hàm thuần trên mô tả phần tử, chạy được cả
     hai phía ranh giới RSC) chứ **không** dùng `createContext` — thứ chỉ sống ở phía client. Cùng
     lý do khiến `checkbox.tsx` của Đợt D cố ý không có chỉ thị ấy.
  2. **Tách `SearchInputControl` khỏi `SearchInput`.** `SearchInput` tự dựng nhãn + gợi ý của nó;
     đặt nguyên nó vào `FilterField` là trang có **hai nhãn trỏ vào cùng một ô**.
  3. **`staticValue` — `<label for>` KHÔNG trỏ được vào `<p>`.** Hai ô "khoá cứng" của
     `report-workbench` hiện giá trị bằng `<p>`; `for` chỉ trỏ được vào phần tử **nhận-nhãn-được**,
     trỏ vào `<p>` thì trình duyệt **âm thầm bỏ qua** ⇒ ô **mất tên** với trình đọc màn hình. Nay
     nối chiều ngược lại bằng `aria-labelledby`. Bản cũ dùng `<span>` trần nên **chưa từng** có tên
     — đây là chỗ đợt này làm *tốt hơn*, không chỉ *đều hơn*.

- **🔴 Một chỗ CỐ Ý lệch khỏi `17` §7.1 — thanh lọc dính của điểm danh.** Kế hoạch xếp
  `attendance-editor` vào danh sách "dùng `FilterField` bên trong". **Không làm**, vì khối ấy có
  **một** ô lọc xếp **dọc** dưới `SegmentedControl` — không có ô nào để canh thẳng hàng cùng, tức
  ba tầng cố định cho **0** lợi ích, còn cái giá là **48px** trống thêm vào một thanh **DÍNH**,
  bằng **7,5%** màn hình 360px, ngay trong luồng mà tốc độ là lý do tồn tại của thiết kế. V8 vì thế
  **chỉ đổi token**, giữ nguyên sticky và **0 dòng** hành vi (CLAUDE.md §5).

- **🔴 V9 — hai đốm trang trí của trang đăng nhập CHƯA TỪNG HIỆN RA.** Không phải "khác token" mà
  là **một lỗi**: `bg-secondary/45`, `bg-accent/55` — token màu là `var()` **trần** nên Tailwind
  không sinh nổi lớp có bổ ngữ độ mờ. Đo chứ không đoán: grep `.next/static/css` cho **0** kết quả
  với cả `/45` lẫn `/55`. Bản sinh đôi của lỗi `bg-background/95` ở `app-header`. Nay dùng token
  đặc `--theme-soft`/`--theme-tint`. ⚠️ **Còn 16 lớp cùng họ** trong `src/`, tất cả đều không sinh
  CSS (`alert` ×4 · `badge` ×4 · `classes/page` ×2 · `(auth)/layout` ×2 · 4 chỗ lẻ) — đó là **nợ
  #5**, ngoài phạm vi §7.3, đã liệt kê đủ file cho Đợt F đóng một lượt.

- **🔴 Một lỗi do CHÍNH đợt này gây ra và tự bắt được, đáng ghi vì nó im lặng.** Bản quét đầu đổi
  `className` của `promotion-board.tsx:826` mà **quên** đổi `<section>` thành `Card` ⇒ khối *"Đề
  xuất hàng loạt"* mất sạch viền và nền. **lint, typecheck, 1683 bài unit và build đều xanh** —
  không cửa kiểm nào thấy một khối mất viền. Nó lộ ra khi đối chiếu **từng dòng `-` có `rounded-`**
  trong `git diff` với chỗ thay thế tương ứng. Đó là phép kiểm bắt buộc sau mọi lượt quét diện rộng.

- **Quét bí danh token về 0 (§7.3):** **64 lượt trên 34 tệp**. Bản quét **bỏ qua chữ nằm giữa hai
  dấu `` ` ``** vì nhiều chú thích *cố ý* nhắc tên token cũ để giải thích vì sao nó bị bỏ — nhưng
  đúng luật ấy làm nó **bỏ sót một chỗ thật**: `change-password/page.tsx:31` viết class trong một
  **template literal**. Bài học: bản quét có luật loại trừ thì **phải grep lại sau khi chạy**,
  không được tin con số nó tự báo. ⛔ Nhóm "BÍ DANH CŨ" trong `tailwind.config.ts` **giữ nguyên**
  đúng `17` §10.

- **File thay đổi (~60):** 5 tệp `ui/` (`filter-bar` `card` `data-table` `search-input` + 6 trang
  gọi `FilterBar`) · 4 khối lọc tự chế · ~40 tệp của lượt quét panel/token · 2 tệp kiểm **mới**
  (`filter-field.test.tsx` · `panel.test.tsx`) · `16` · `WORKLOG`.

- **Migration/data impact:** **không có.** 0 business rule · 0 migration · 0 đổi RLS · 0 đổi quyền ·
  0 dòng dữ liệu bị đụng — thuần trình bày.

- **Đã test:** `npm run lint` **0 warning 0 error** · `npm run typecheck` ✓ ·
  `npm test` **1684 pass / 18 skip** trên **121** tệp (trước 1656/119 ⇒ **+28 bài mới** trên 2 tệp)
  · `npm run build` ✓ **29/29 trang** · **xác minh CSS thật sự được sinh ra** bằng grep thẳng
  `.next/static/css` (11/11 lớp có mặt, kể cả hai giá trị tuỳ biến `min-h-[18px]` và
  `leading-[18px]`; và **0** lần `.bg-secondary\/45` / `.bg-accent\/55`).

- **🔴 E2E — BA lượt đầy đủ, mỗi lượt trên DB vừa reset+seed, không chạy gì khác cùng lúc
  (~50 phút/lượt):** Đợt E bản đầu **21 đỏ / 567 xanh** → **đối chứng `9b30dd9` ngay trước Đợt E
  13 đỏ / 575 xanh** → Đợt E sau khi sửa **21 đỏ / 567 xanh**.
  **Hồi quy thật, đúng một cái, và bộ E2E là cửa duy nhất bắt được nó:** `reports.spec.ts:275`
  (**AC-B14**) đỏ **cả ba viewport** ở lượt 1, **xanh cả ba** ở lượt 3 sau khi bỏ `aria-labelledby`.
  🔴 **Và ba lượt ấy lật một câu trong sổ nợ:** *"nợ #10 — 10 bài đỏ **ỔN ĐỊNH**"* **không ổn định**
  — danh sách đỏ đổi giữa các lượt **kể cả trên cùng một commit** (`staff-directory:71`/`:196` đỏ
  lượt 1 xanh lượt 3; `attendance:555` + `teaching-plan:255` đỏ ở **đối chứng** rồi xanh ở Đợt E;
  `committees:156` — bài nợ #10 ghi đỏ ×3 viewport — **không đỏ lần nào** ở lượt đối chứng).
  Chỉ **5** bài đỏ ở **cả ba** lượt: `results:278` · `attendance:454` · `students-directory:156` ·
  `imports:332` · `teaching-plan:92`. Và **11/21** bài đỏ lượt cuối mang chữ ký **hạ tầng**
  (`Không đăng nhập được bằng GLV904/901` ×7 · `browser has been closed` · timeout 30s/180s) —
  trong đó **7 bài `student-lifecycle` đỏ thành một CHÙM trên đúng `laptop-1366`** vì **một** lần
  không đăng nhập được. Nguyên nhân gốc: **ba viewport chạy nối tiếp trên MỘT cơ sở dữ liệu** và
  nhiều bài ghi/xoá dữ liệu seed — `staff-directory:196` đỏ đúng câu *"seed phải còn ít nhất một hồ
  sơ chưa từng dùng để xoá"*, tức viewport chạy trước đã xoá mất. **Lỗi của bộ đồ gá, không phải
  của mã ứng dụng.**

- **Quyết định mới:** không có quyết định nghiệp vụ. Ba bổ sung API thuần trình bày, ghi ở `16`
  §6.5: `Panel` + `panelClassName()` + `cardClassName` (`card.tsx`) · `tableScrollFrameClassName`
  (`data-table.tsx`) · `FilterField` + `SearchInputControl`. **`Card` cố ý KHÔNG nhận `as`** — nó
  là component bị dùng nhiều nhất, nới chữ ký của nó là mở đường cho mọi thẻ HTML đi qua.

- **Blocker/rủi ro:**
  🔴 **Bộ E2E hiện KHÔNG dùng làm cổng nghiệm thu được.** Ba danh sách đỏ khác nhau trên cùng một
  commit thì nó không phân biệt nổi *"hồi quy"* với *"thứ tự chạy"*. Cách duy nhất còn lại để bắt
  hồi quy là **lùi commit đối chứng**, tức trả **~100 phút cho mỗi lần nghi ngờ** — phiên này đã
  trả đúng cái giá ấy. Việc phải làm: cho **mỗi viewport một tập dữ liệu riêng** (khuôn
  `reports.spec.ts` đã làm đúng), rồi **đo lại nợ #10 bằng số thật** thay cho con số 10 đang sai.
  ⚠️ Lượt E2E đầu của phiên **không chạy được** vì cổng 3107 còn một tiến trình `next start` **bỏ
  lại từ lượt trước** — chốt an toàn của `run-e2e.mjs` chặn đúng, vì chạy tiếp là kiểm **bản build
  cũ**. Đã tắt tiến trình ấy.
  ⚠️ **Nợ #5** (16 lớp bổ-ngữ-độ-mờ trên token màu, **không sinh CSS**) chưa đóng — đã có danh sách
  đủ file:line ở `16` §6.5.

- **Next action:** **`P3-UI-001` Đợt F** — `Button pending` + tổng nghiệm thu; gộp luôn nợ #5 và
  việc xoá nhóm "BÍ DANH CŨ" khỏi `tailwind.config.ts` (`17` §10).

### [2026-08-17] Phiên 69 — Claude — `P3-UI-001` (Đợt D)

- **Claim:** kế hoạch 17 **Đợt D** — `Checkbox` + vét nốt các control trần còn lại.
  ⚠️ **Entry này được viết ở phiên 70**: phiên 69 làm xong việc, cập nhật `16` §6.4 bằng số thật,
  nhưng **hết phiên trước khi ghi `WORKLOG` và commit** — cây làm việc còn nguyên 12 tệp chưa
  commit. Phiên 70 chạy lại **toàn bộ** cửa kiểm trên đúng cây ấy trước khi commit, và số ghi dưới
  đây là số của **lượt chạy lại**, khớp từng con với số phiên 69 ghi ở `16` §6.4.

- **🔴 Số của kế hoạch `17` §6 SAI, và đợt này đếm lại chứ không chép.** Kế hoạch viết *"migrate
  11 chỗ"* rồi liệt kê **10** cặp `file:line` — con số 11 chưa bao giờ khớp với chính danh sách
  của nó. Số thật, đếm bằng `grep type="checkbox"` **sau** khi Đợt B/C đã xê dịch mọi dòng:
  **10 ô tick trần trên 8 tệp** (kết quả thứ 11 của `grep` là một dòng **chú thích**). Cả **10**
  cặp `file:line` của kế hoạch đều đã lệch 1–11 dòng — dùng lại chúng là sửa nhầm dòng. Bảng đối
  chiếu *dòng cũ ↔ dòng thật* nằm ở `16` §6.4.

- **Bốn cỡ khác nhau cho cùng một thứ — đó mới là lỗi, không phải màu sắc.** 10 ô tick ấy có
  **bốn** cỡ (`h-4 w-4` ×3 · `h-5 w-5` ×3 · `h-6 w-6` ×2 · `size-4` ×1) và **một chỗ không có
  class nào** — ô duy nhất trong toàn ứng dụng còn do Windows vẽ (`equipment-board`). Nay tất cả
  là 20×20px, bo 6px, viền `--border-strong`, tick nền `--theme-primary`.

- **🔴 Ba quyết định cài đặt:** (1) `checkbox.tsx` **không** có `"use client"` — cố ý, vì
  `dropdownItemClassName` xuất từ một tệp `"use client"` từng làm **chết cả trang `/account`**
  (mục 0.7) trong khi typecheck/lint/unit đều xanh. (2) `indeterminate` là **thuộc tính DOM**, chỉ
  đặt được bằng JS ⇒ sẽ kéo cả tệp sang `"use client"` **và** dựng lại đúng lỗi hydration của
  Đợt C; nay dùng `data-indeterminate` + `aria-checked="mixed"`, máy chủ vẽ được ngay.
  (3) Vẫn là chính `<input type="checkbox">` cũ, chỉ khoác CSS phủ ⇒ **74 chỗ gọi/locator của bộ
  kiểm không phải sửa một dòng**, và **không dính** bẫy hydration đã suýt làm mất dữ liệu ở Đợt C.

- **🔴 Bài kiểm quan trọng nhất canh một thứ mắt người không thấy.** `09` §4.1 cho **Nghĩa Sĩ**
  `--theme-on-primary` là **`#2E2A27`** chứ không phải trắng. Viết `text-white` cho dấu tick thì
  **5/6 ngành vẫn trông đúng** và người review đang mở ngành khác **không bao giờ nhìn thấy**.
  `checkbox.test.tsx` canh ba lớp, trong đó có một bài canh **tiền đề** — sửa `sector-palette.ts`
  cho Nghĩa Sĩ về trắng thì bài kiểm **đỏ** chứ không âm thầm trở nên vô nghĩa.

- **Đã xác minh CSS thật sự được sinh ra**, không chỉ tin vào chuỗi class: `peer-data-[…]` là biến
  thể tuỳ biến, Tailwind bỏ qua thì dấu gạch **im lặng không bao giờ hiện**. Grep thẳng
  `.next/static/css`: 4/4 lớp có mặt (chi tiết ở `16` §6.4).

- **Hai control trần cuối cùng:** `attendance-editor.tsx` `<textarea>` → `<Textarea>` (điểm danh
  thuộc danh sách nhạy cảm CLAUDE.md §5 ⇒ **chỉ đổi vỏ**, 0 dòng luồng ghi chú bị đụng) ·
  `import-upload-form.tsx` `<input type="file">` → `<FileUpload>`. Sau đợt này `src/` còn **0** ô
  tick trần, **0** `<textarea>` trần, **0** `<input type="file">` trần.

- **🔴 Một bài đỏ ngẫu nhiên KHÔNG được ghi là "nhiễu do tải máy".** `import-upload-form.test.tsx`
  đỏ ở *"mở trang kết quả sau khi phản hồi tải file đã hoàn tất"* (`Number of calls: 0`); chạy
  riêng thì xanh. Truy ra cơ chế thay vì đoán: `findByText` thoát ngay khi **DOM** đổi — pha
  commit — còn `router.push` nằm trong `useEffect`, tức pha hiệu ứng **thụ động**, bị bộ lập lịch
  đẩy lùi khi máy tải nặng. Bài ấy đang đo **tốc độ máy** chứ không đo mã; đã bọc `waitFor`.

- **File thay đổi (14):** `src/components/ui/checkbox.tsx` **mới** · `tests/unit/checkbox.test.tsx`
  **mới** · `create-year-form.tsx` · `attendance-editor.tsx` · `committee-workspace.tsx` ·
  `equipment-board.tsx` · `batch-row-editor.tsx` · `import-upload-form.tsx` · `promotion-board.tsx` ·
  `create-student-form.tsx` · `student-status-panel.tsx` · `update-student-form.tsx` ·
  `tests/unit/import-upload-form.test.tsx` · `16_PHASE_2B_IMPLEMENTATION_LOG.md`.

- **Migration/data impact:** **không có.** 0 business rule · 0 migration · 0 đổi RLS · 0 đổi quyền ·
  0 dòng dữ liệu bị đụng — thuần trình bày.

- **Đã test (lượt chạy lại ở phiên 70, trên đúng cây làm việc của phiên 69):** `npm run lint`
  **0 warning 0 error** · `npm run typecheck` ✓ · `npm test` **1656 pass / 18 skip** trên **119**
  tệp (trước 1642 ⇒ **+14 bài mới** trên 1 tệp) · `npm run build` ✓. **Không chạy E2E riêng cho
  Đợt D** — bộ kiểm E2E không phải sửa một locator nào (xem quyết định cài đặt #3), và lượt E2E
  đầy đủ chạy ở cuối Đợt E trên cùng cây.

- **Quyết định mới:** không có quyết định nghiệp vụ. Một **giá trị ngoài thang nói ra chứ không
  giấu**: bo **6px** của ô tick không thuộc 4 mức của `09` §5 (8/12/16/20) — đó là con số của
  chính `17` §6, lý do là hình học (`rounded-sm` 8px trên hộp 20px cho ra hình gần tròn, nhìn ra ô
  chọn-một chứ không ra ô tick). Nó nằm ở **một hằng số duy nhất** (`BOX_RADIUS`).

- **Blocker/rủi ro:** ⚠️ Phiên 69 kết thúc **không ghi sổ và không commit** — đây là lần thứ hai
  chuyện ấy xảy ra trong dự án (lần đầu ở M11-A, xem Phiên 62). Cách phát hiện vẫn là cũ: đối
  chiếu `git status` với `16`.

- **Next action:** **`P3-UI-001` Đợt E** — `FilterField` + đồng nhất 9 biến thể panel + quét bí
  danh token cũ về 0.

### [2026-08-15] Phiên 68 — Claude — `P3-UI-001` (Đợt B + Đợt C) + `P3-PERF-001`

- **Claim:** ba việc trong một phiên theo lệnh chủ dự án — kế hoạch 17 **Đợt B** và **Đợt C** làm
  trọn, cộng một task phát sinh giữa phiên: **`P3-PERF-001`** chữa lag 3–4 giây của bản Vercel.
  Chủ dự án còn ra thêm một yêu cầu trong phiên: *"định dạng ngày tháng năm của TOÀN BỘ trang web
  phải là DD/MM/YYYY"* — yêu cầu ấy **chính là** Đợt C, không phải việc thứ tư.

- **🔴 `P3-PERF-001` — đo trước, sửa sau. Log của Kong, không sửa một dòng mã ứng dụng:**
  mỗi lần vào **một** trang gọi Supabase **15–19 lượt** (`/students` 16 · `/staff` 15 ·
  `/dashboard` 19 · `/attendance` 16), trong đó **6–8 lượt là bản trùng** và phần lớn **xếp hàng
  nối đuôi nhau**. Nguyên nhân gốc nằm **ngoài mã nguồn**: không có `vercel.json` nên hàm chạy ở
  vùng mặc định **`iad1` (Washington)** còn Supabase ở **`ap-northeast-2` (Seoul)** — mỗi lượt
  đi–về **~200ms**, mười lượt nối đuôi là **hai giây** trước khi truy vấn của chính trang bắt đầu.
  Bốn việc: ghim `vercel.json` về **`icn1` (Seoul)** · gộp hai hàm `cache()` cùng hỏi "năm học
  hiện hành" (`cache()` chỉ gộp được các lượt gọi **cùng MỘT hàm**) · `loadStaffViewer` từ 5 truy
  vấn nối đuôi xuống **3 đợt** · middleware `getUser()` → `getSession()` (gọi mạng **mọi lần** →
  chỉ gọi khi token sắp hết hạn; **không mất an toàn** vì kết quả ở đó vốn bị bỏ đi, người gác
  cổng thật vẫn là `getUser()` trong `getAuthContext()`). Đo lại: 16→**14** · 15→**13** ·
  19→**18** · 16→**14**, và chuỗi nối đuôi của vỏ ứng dụng ngắn đi rõ rệt.
  🔴 **Việc thứ tư ĐÃ TRẢ LẠI cuối phiên — xem gạch đầu dòng riêng bên dưới.**
  ⚠️ **Chưa xác minh được từ máy này** vùng thật Vercel đang chạy — `vercel.json` là khai báo đúng
  và không thể làm hỏng; nếu dự án vốn đã ở `icn1` thì nó không đổi gì.

- **Đợt B — `Select` v2, và một lệch có chủ ý so với `17` §4.1.** Kế hoạch đề nghị thay `<select>`
  bằng nút `role="combobox"` + `<input type="hidden">`. **Không làm theo.** `<select>` **thật** vẫn
  là control duy nhất (giữ `name`/`id`/nhãn/`required`/`ref`/ngữ nghĩa trợ năng), nằm **đè lên**
  mặt tiền ở `opacity-0` để nhận trọn cú bấm; `pointerdown` bị chặn để listbox hệ điều hành không
  kịp bung. Lý do nặng nhất là **đo được**: `getByLabel(...).selectOption(...)` có **43 lần** trong
  **13** tệp E2E và `selectOptions` trong **12** tệp unit — đổi hợp đồng là bắt cả bộ kiểm ấy viết
  lại **trong cùng phiên** đang đổi hai component lớn, tức mất luôn khả năng phân biệt *"đỏ vì hồi
  quy"* với *"đỏ vì bài kiểm chưa viết lại"*. **Kết quả: 74 chỗ gọi không sửa một dòng.**

- **🔴 Ba cái bẫy của Đợt B, cả ba đều phải trả giá mới tìm ra:**
  1. `peer-*` của Tailwind là bộ chọn anh–em **xuôi** (`~`) ⇒ `<select>` phải đứng **trước** mặt
     tiền trong DOM. Đặt sau thì vòng focus bàn phím **im lặng biến mất** — không lỗi, không cảnh
     báo, chỉ là không có.
  2. Mặt tiền phải là `<button>` chứ không phải `<div>`. Vài chỗ bọc ô chọn trong `<label>` không
     `htmlFor`; tên nhãn kiểu ấy tính bằng chữ của **cả cây con**, nên nhãn *"Đối tượng nhận"* hoá
     thành *"Đối tượng nhậnChọn đối tượng"* ⇒ **8 bài `notification-center` đỏ**. Quy tắc tính tên
     bỏ qua phần tử **nhận-nhãn-được**, nên `<button>` nằm ngoài phép tính.
  3. Tấm listbox phải bắn sang `document.body` (portal): nằm trong cây thì vừa bị tổ tiên
     `overflow-*` của bảng **xén cụt**, vừa chui vào tên nhãn như bẫy #2.

- **🔴 Một lỗi Đợt B tôi tìm ra bằng cách ĐỌC LẠI mã, không phải bằng bộ kiểm** — và đã viết bài
  canh nó: chống-xử-lý-hai-lần bằng một cái **cờ** thì `preventDefault()` ở `pointerdown` có thể
  nuốt luôn `click` đi sau ⇒ cờ bật lên **không ai tắt** ⇒ cú bấm vào **chữ nhãn** lần kế tiếp bị
  nuốt. Thử `Date.now()` cũng sai (hai cú bấm gần nhau bị gộp làm một) và thử `event.detail === 0`
  cũng sai (**đo được**: click do nhãn chuyển tiếp vẫn mang `detail = 1`). Lời giải đúng là hỏi
  *"cú bấm bắt đầu ở đâu"*, kèm một listener `pointerdown` cấp `document` để cờ không bao giờ kẹt.

- **Đợt C — và vì sao nó KHÔNG còn là việc đánh bóng.** `<input type="date">` vẽ ngày theo
  **locale của trình duyệt**: máy phòng học đặt tiếng Anh thì ngày sinh thiếu nhi hiện
  `MM/DD/YYYY`, trong khi 103 chỗ còn lại in `dd/MM/yyyy` qua `formatDateVi`. **Không dòng CSS nào
  đụng được vào phần đó** — nên `DateField` là lời giải kỹ thuật **duy nhất** cho yêu cầu của chủ
  dự án. Migrate **27 `type="date"` + 3 `type="datetime-local"` trên 22 tệp** ⇒ còn **0** ô ngày
  native. Trước hydration vẫn là ô native (form chạy không cần JS); sau hydration là ô chữ
  `dd/MM/yyyy` + lịch tự vẽ + `<input type="hidden">` mang **ISO** ⇒ **0 server action phải sửa**.
  Ô chữ nhận **cả** `dd/MM/yyyy` lẫn `yyyy-MM-dd` — gõ tay vẫn là đường chính (nhập ngày sinh cho
  ~900 em bằng cách bấm lùi lịch về 2016 là việc không ai làm nổi).

- **🔴 Bốn lỗi thật của Đợt C, do chính bộ kiểm của đợt bắt được:** `Escape` không đóng được lịch
  (focus nằm trên **nút**, nên `onKeyDown` ở ô chữ không nghe thấy — phải bắt ở tầng `document`) ·
  sửa giờ **làm mất ngày** (suy ngược ngày–giờ từ chuỗi đã ghép: xoá trắng ô giờ ⇒ chuỗi rỗng ⇒
  lượt dựng sau tách ra ngày rỗng) · `defaultValue` đổi giữa chừng **không kéo ô đi theo**, tức
  **nuốt mất dữ liệu đã gõ** ở màn cảnh báo trùng · nút lịch **36px**, vi phạm điều cấm số 7
  (vùng chạm < 44px) — `responsive.spec.ts` bắt được `"button 36px"` ×2 ở trang hồ sơ thiếu nhi.
  Thêm một hàng rào không có trong kế hoạch: chuỗi gõ dở không đọc được thì `setCustomValidity`
  **chặn lượt gửi** — `required` chỉ biết ô rỗng hay không, nên `31/02/2016` qua được nó trong khi
  ô ẩn mang giá trị cũ, và biểu mẫu sẽ gửi đi lặng lẽ một ngày khác ngày người dùng đang nhìn.

- **🔴 LỖI NẶNG NHẤT CỦA PHIÊN, và bộ kiểm KHÔNG tìm ra — full E2E tìm ra, sau khi tôi suýt đổ
  cho tải máy.** Lượt full đầu tiên có **25 bài đỏ**, 8 bài cùng chữ ký ở Điểm danh. Tôi đã định
  ghi là nhiễu, nhưng chạy **cô lập trên DB vừa reset** vẫn đỏ y nguyên ⇒ hồi quy thật của Đợt C:
  **trước hydration ô ngày còn là `<input type="date">` native; ai gõ vào khoảng giữa — trang đã
  hiện nhưng JS chưa chạy xong — thì `DateField` dựng lại từ `defaultValue` của máy chủ và NUỐT
  SẠCH thứ vừa gõ.** Ô hiện lại ngày mặc định, người dùng bấm Lưu, biểu mẫu gửi đi **một ngày khác
  ngày họ vừa chọn**, không một lời cảnh báo. Đây **không** phải lỗi của riêng bộ kiểm — bộ kiểm
  chỉ thao tác nhanh hơn người thật chứ không làm gì người thật không làm được, và nó là **cuộc
  đua với hydration** nên đỏ ngẫu nhiên tuỳ máy nhanh chậm. Sửa: lúc hydration ô **nhận lấy giá
  trị đang có trong DOM** trước khi thay. `attendance.spec.ts` trên DB sạch: **10/13 → 13/13**, và
  cả spec từ 6,8 phút xuống 2,2 phút (không còn bấm lại 48 giây mỗi bài).

- **🔴 MỘT BẢN TỐI ƯU CỦA CHÍNH TÔI ĐÃ BỊ TRẢ LẠI, vì đo ra nó làm hỏng thứ khác.** Đổi middleware
  `getUser()` → `getSession()` (bớt một lượt gọi mạng mỗi request) nghe rất hợp lý và đúng là bớt
  được thật. Nhưng lượt full E2E để lại `attendance.spec.ts:517` đỏ, mà **mã trước phiên thì
  xanh**. Thay vì đoán, tôi thử thẳng giả thuyết — đây là thay đổi **duy nhất** của phiên có đường
  nhân quả tới một nút chạy qua Server Action:

  | Middleware | Kết quả 4 lượt | Thời lượng |
  |---|--:|---|
  | `getSession()` (bản tối ưu) | **2 xanh / 2 đỏ** | xanh 8,2s và 31s · đỏ chạm trần 3 phút |
  | `getUser()` (trả lại) | **4 xanh / 0 đỏ** | 6,7 – 8,6 giây, cả bốn |

  Nút "Tiếp quản" kẹt ở `disabled`, tức `pending` của Server Action không bao giờ hạ. **Cơ chế
  chính xác chưa truy ra và tôi ghi đúng như vậy**; giả thuyết mạnh nhất là `getUser()` buộc phiên
  được đọc–kiểm–ghi lại trọn vẹn ở middleware nên Server Action đi sau luôn nhận bộ cookie đã ổn
  định. Cái giá của việc trả lại **nay rất nhỏ**: sau khi hàm và CSDL về cùng vùng Singapore, một
  vòng đi–về chỉ còn vài mili giây thay vì ~200ms — đổi một lượt gọi rẻ tiền lấy rủi ro trên đường
  xác thực là món hời ngược. Lý do đầy đủ ghi ngay trong `middleware.ts` để phiên sau đừng "tối
  ưu" lại lần nữa.
- **🔴 Hai lỗi màn hình chờ do CHỦ DỰ ÁN tìm ra trên bản thật, không phải bộ kiểm:** một lượt
  chuyển module hiện overlay **hai lần** liên tiếp, và lần thứ hai **luôn ra đúng một ảnh và đúng
  một câu** (`Gl 2:20`). Chẩn đoán: có **hai** component cùng vẽ overlay — `LoadingProvider`
  (*"Đang xử lý…"*) và `RouteLoadingOverlay` trong `loading.tsx` (*"Đang mở trang…"*); hai ảnh chụp
  của chủ dự án đọc đúng hai nhãn ấy. Vế thứ hai sâu hơn: `RouteLoadingOverlay` là **Server
  Component nằm trong `loading.tsx`**, mà Next **dựng sẵn phần đó lúc build** rồi dùng lại mãi ⇒
  `Math.random()` chạy **đúng một lần trong đời**, trên máy build. **Bốc ngẫu nhiên ở máy chủ cho
  một thứ được dựng sẵn thì không bao giờ ngẫu nhiên** — bài học đáng ghi của Đợt A. Sửa:
  `loading.tsx` nay chỉ **phát tín hiệu** (`RouteLoadingSignal`, client) chứ không vẽ; overlay do
  provider vẽ, một chỗ duy nhất, bốc ở trình duyệt. Vòng đời của chính `loading.tsx` cũng là thước
  đo **đúng** cho *"route mới dựng xong chưa"* — thứ mà `usePathname()` không đo được vì nó đổi
  tức thì. Đo lại bằng `MutationObserver` trên bản dựng thật: **1 lần hiện/lượt** (trước là 2), ảnh
  và câu đổi ở **cả bốn** lượt chuyển module.

- **Soát định dạng ngày toàn `src/` theo lệnh chủ dự án:** 0 ô ngày native · 0 chuỗi định dạng
  `MM/dd` · 103 chỗ hiển thị đi qua `formatDateVi`/`formatDateTimeVi`. Hai chỗ còn dùng
  `toLocaleString("vi-VN")` cho dòng *"Xuất lúc…"* của tệp tải về đã đổi sang `formatDateTimeVi` —
  vi-VN cho ra đúng dạng nhưng **phụ thuộc dữ liệu ICU của máy chạy**.
  ⏸️ **Chưa làm, và nói ra:** `<input type="time">` của `DateTimeField` (3 chỗ) **vẫn là ô
  native**, nên máy đặt tiếng Anh hiện kiểu 12 giờ `07:00 PM`. Yêu cầu chủ dự án nói về **ngày**;
  ô giờ tự dựng là việc riêng.

- **🔴 Hạ tầng đổi hẳn trong phiên: Supabase Seoul ⇒ Singapore.** Chủ dự án hỏi *"đổi sang
  Singapore hay Tokyo có nhanh hơn không"*, nên đo thẳng vào **pooler thật của Supabase** (7/7 lượt
  mỗi vùng): **Singapore 38ms · Mumbai 98ms · Seoul 100ms · Tokyo 108ms**. Nhãn `RECOMMENDED` của
  Supabase gợi ý **Seoul** và **nó sai** — nhãn ấy suy từ địa chỉ IP qua bảng tra vị trí, *không đo
  gì cả*; đây cũng đúng là lý do dự án cũ nằm ở Seoul. Xoá được dự án cũ vì đã **đếm trước**:
  0 thiếu nhi · 0 phụ huynh · 0 ghi danh · 0 điểm danh · 0 điểm số (chỉ 2 Super Admin + 1 năm học +
  19 lớp, mà `seed:prod` dựng lại đủ). Vẫn dump cả schema lẫn data ra `backups/` trước khi xoá.
  Dự án mới đo được **32ms — nhanh hơn 3,1 lần**. `db push --include-all` → **64/64 migration**,
  đối chiếu lại **0 chưa áp**; `seed:prod` → khớp y hệt bản cũ. Chủ dự án đã đổi vùng hàm Vercel
  sang `sin1`, cập nhật 3 biến môi trường, deploy lại và **đăng nhập thành công**. Xác minh bằng
  header thật: `x-vercel-id: hkg1::sin1::…`, `/login` trung vị **235ms**.
  ⚠️ Ảnh chụp Vercel cho thấy vùng cũ là **`iad1` (Washington)** — **chứng minh đúng chẩn đoán §8**.
  🔴 Hai bẫy mới ghi vào `CLAUDE.md` §4: pooler là **`aws-0`**-ap-southeast-1 (`aws-1` phân giải
  được nhưng từ chối kết nối, báo `LegacyDbConnectError` không nói lý do) · khoá nay là kiểu mới
  `sb_publishable_`/`sb_secret_`, chạy được vì **không chỗ nào trong mã bóc tách khoá** (đã rà).

- **File thay đổi:** `vercel.json` (mới) · `src/lib/academic-year/current-year.ts` (mới) ·
  `src/lib/{supabase/middleware,theme/resolve-theme-context}.ts` ·
  `src/features/academic-years/server/queries.ts` · `src/app/(dashboard)/layout.tsx` ·
  `src/components/ui/{select,select-options,date-field,date-field-utils}.{tsx,ts}` ·
  **22 tệp migrate ô ngày** · `src/features/{absence-requests,assessments}/…` (dọn nợ `17` §4.3) ·
  `src/lib/exports/http.ts` + `results/[classId]/export/route.ts` · **4 tệp unit mới** + 6 tệp
  unit sửa khẳng định · 5 tệp E2E sửa locator · file `16` (§6.2, §6.3, §8 mới) · `WORKLOG.md`.

- **Migration/data impact:** **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền** cho cả ba task.

- **Đã test (số thật):** lint **0 warning 0 error** · typecheck ✓ · build ✓ **29/29 trang** ·
  unit **1642 pass / 18 skip** trên 118 tệp (trước phiên: 1568/18 — **+74 bài mới** trên 4 tệp
  của Đợt B và Đợt C) · DB `db:reset` qua đủ migration + `seed:dev` **trước** lượt full E2E.
  **E2E toàn hệ thống: 588 bài ⇒ 578 pass · 10 fail · 41,0 phút** (baseline GĐ3 571/14; phiên 67
  585/3; lượt đầu của phiên này 563/25 — trước bản vá hydration).

- **⚠️ 10 bài đỏ, phân loại BẰNG PHÉP ĐO chứ không bằng suy đoán.** Tôi lùi hẳn về commit trước
  phiên (`58d9b40`) rồi chạy lại đúng những bài ấy: `committees:156` · `results:278` ·
  `teaching-plan:92` **cũng đỏ y nguyên trên mã cũ** ⇒ nợ có sẵn (6 bài còn lại là chính ba tệp ấy
  ở viewport khác, cùng chữ ký *dữ liệu Server Component chưa về kịp cửa sổ 5 giây* — **nợ #10**,
  đúng họ với 3 bài đỏ của phiên 67). Bài thứ tư `attendance:517` mã cũ **xanh** ⇒ truy tiếp, và
  đó là cách tìm ra bản tối ưu middleware phải trả lại. Sau khi trả lại: `attendance.spec.ts`
  **13/13**, và `:517` **4/4** ở phép đo lặp.
  🔴 **Nói rõ giới hạn:** con số 578/10 đo **trước** lượt trả lại middleware. Sau khi trả lại tôi
  chạy lại `attendance.spec.ts` (13/13) chứ **chưa chạy lại trọn 588 bài**, vì bản trả lại đưa mã
  về **gần mã cũ hơn**, không xa hơn. Con số trọn bộ của bản cuối cùng là việc của phiên sau.

- **⚠️ Một sai sót trong CÁCH ĐO của chính tôi, ghi lại để phiên sau khỏi mắc:** lượt full E2E đầu
  tiên bị bỏ đi vì tôi chạy `typecheck`/`lint`/`vitest` **song song** với nó — CPU bị giành, nhiều
  bài chạm trần thời gian và hiện `button "Đang xử lý…"` treo 20 giây. Con số của một lượt E2E
  chạy chung máy với việc khác **không dùng được**; phải chạy sạch rồi mới đọc.

- **Blocker/rủi ro:** kết luận **NO-GO của GĐ3 vẫn nguyên** — phiên này thuần trình bày cộng một
  bản vá hiệu năng, chưa đụng D-65 audit log, M02 hai workflow chuyển năm, M07 AC-03-01, M11/M06
  live report + split-brain, production preflight.

- **Next action:** **Đợt D** của kế hoạch 17 (`Checkbox` + vét control trần còn lại), rồi Đợt E/F.
  Chủ dự án nên xem lại **Vercel → Project Settings → Functions** sau lần deploy tới để xác nhận
  vùng đã về `icn1`.

### [2026-08-14] Phiên 67 — Claude — `P3-UI-001` (Đợt A) + `P3-UX-001` (nhận bàn giao)

- **Claim:** hai task trong một phiên theo lệnh chủ dự án. `P3-UI-001` = kế hoạch 17 Đợt A;
  `P3-UX-001` = nhận bàn giao từ Codex (20 tệp sửa chưa commit trong cây làm việc, **không
  revert**, làm tiếp trên nền đó).
- **Duyệt tài liệu:** lệnh *"làm theo kế hoạch 17"* duyệt §2 ⇒ thêm **`09` §12 (A1–A5)** ở cuối,
  **không sửa đè** §1–§11. Bảng màu ngành, 12 điểm theme, 10 điều cấm, danh sách KHÔNG ĐƯỢC ĐỤNG
  giữ nguyên tuyệt đối.
- **Đợt A — màn hình chờ toàn cục.** Chẩn đoán gốc xác nhận lại bằng mã nguồn: `router.refresh()`
  ở **45 chỗ** dựng lại server component **tại chỗ**, nên `loading.tsx` **không bao giờ chạy** —
  phản hồi duy nhất là một cái nút mờ đi. 9 tệp mới; nối **45 chỗ luồng chậm trên 41 tệp**
  (16 `useTransition` · 18 `useActionState` · 7 cờ `useState` · 3 `useFormStatus` · 2 react-hook-form
  · 3 `router.push` · 6 form không-cần-JS). Ba ngưỡng nằm một chỗ, đổi được.
- **🔴 Chủ dự án ĐỔI Ý ngay trong ngày về ngưỡng hiện, và lý do đáng ghi:** bản đầu để
  `SHOW_AFTER_MS = 1000` theo đúng yêu cầu gốc *"mọi thao tác > 1 giây"*. Nhưng trên Vercel phần
  lớn thao tác xong **dưới** một giây, nên overlay gần như **không bao giờ hiện** — đúng luật mà
  sai ý muốn, và chủ dự án báo *"chả có hiệu ứng gì"*. Chốt lại: **`SHOW_AFTER_MS = 0` ·
  `MIN_VISIBLE_MS = 250`**. `17` §3.3 và §3.5 nay **lỗi thời** ở hai dòng nói về ngưỡng 1000ms.
- **🔴 Hạ ngưỡng làm lộ BA lỗi mà 1568 unit test + lint + typecheck + build đều không thấy** —
  vì cả ba chỉ xuất hiện khi overlay hiện ở **mọi** thao tác thay vì chỉ thao tác chậm. Đo bằng
  ba lượt full E2E:

  | Cấu hình | Kết quả | Thời lượng |
  |---|--:|--:|
  | 1000 / 600 (bản đầu) | 585 pass · 3 fail | 22,0 ph |
  | 0 / 600 | 582 pass · **6 fail** | **38,1 ph** |
  | **0 / 250 (chốt)** | **584 pass · 4 fail** | **27,8 ph** |

  1. **Overlay chặn chuột** — 5 bài mang đúng chữ ký `element intercepts pointer events`. Bỏ chặn
     (`pointer-events-none`): nó vốn là hàng rào **thứ ba**, vì nút chạy việc chậm đều đã
     `disabled={pending}` và đường gửi thông báo còn có `requestId` chống bản lặp (D-165).
  2. **Overlay chiếm `role="status"` ĐẦU TIÊN trong DOM** ⇒ cướp bộ định vị của `FormMessage`
     (bắt được ở `enrollment-lifecycle` TB-F14). Và nặng hơn chuyện test: mỗi cú bấm sẽ đọc cho
     người dùng trình đọc màn hình nghe *"Đang xử lý…"* **kèm nguyên một câu Kinh Thánh**, nhấn
     chìm đúng câu kết quả họ cần nghe. Nay `aria-hidden` — ảnh và câu là an ủi cho **mắt nhìn**.
  3. **`MIN_VISIBLE_MS = 600` là cái giá thật, không phải con số trang trí**: 600 → 250 kéo bộ
     kiểm từ 38,1 xuống 27,8 phút, và `results.spec.ts:278` (hành trình dài, trần cứng 240s) từ
     đỏ **3/3 viewport** xuống **2/3**.
- **⚠️ Một giả thuyết tôi nêu SAI và phải ghi lại:** tôi kết luận `loading.tsx` thành `async`
  (fallback của Suspense tự suspend) là nguyên nhân `results:278`, và **sai** — bản vá đồng bộ
  không đổi được kết quả. Vẫn giữ bản vá vì nó đúng nguyên tắc (`assets.ts` nay đọc đĩa đồng bộ,
  cache tầng module), nhưng nó **không** phải lời giải. `results:278` chính là bài *"M07 hành
  trình Kết quả/chuyển lớp"* vốn nằm trong **14 bài đỏ của baseline GĐ3**; nó marginal từ trước.
- **🔴 Lỗ hổng của Đợt A do chủ dự án tìm ra, không phải bộ kiểm:** chuyển module mất 3–4 giây mà
  không có overlay. Nguyên nhân: Next commit chuyển route **ngay lập tức** để dựng `loading.tsx`,
  nên `usePathname()` đổi tức thì, `NavigationSettleWatcher` tưởng route đã xong và tắt cờ chờ.
  Thao tác chờ **lâu nhất** của ứng dụng lại là thao tác **duy nhất** không có phản hồi. Sửa bằng
  cách cho chính `loading.tsx` dựng overlay (`RouteLoadingOverlay`, Server Component) và bỏ
  `"use client"` khỏi `LoadingOverlay` để nó dựng được cả hai phía.
- **🔴 Ba quyết định cài đặt đáng nhớ:** (1) `useGlobalPending` **không ném lỗi** khi thiếu
  provider — nó nằm trong 41 tệp nghiệp vụ mà bộ kiểm render **trần**; ném lỗi là đánh sập vài
  chục bài đang xanh vì một thứ thuần trang trí. (2) Điều hướng dùng **cờ**, không dùng bộ đếm —
  một cú bấm có thể không dẫn tới lần đổi route nào, là bộ đếm thì nó rò một đơn vị vĩnh viễn.
  (3) `useSearchParams()` **phải** bọc `Suspense` riêng, nếu không `next build` đẩy cả cây sang
  render phía client và với trang tĩnh đó là **lỗi build**.
- **`LoiChua.md`:** chủ dự án soạn bằng **bảng Markdown**, `17` §3.6 mô tả kiểu mỗi câu một dòng.
  Parser nhận **cả hai** (nhận diện hàng tiêu đề bằng **dòng kẻ**, không dò chữ), và tệp chính đã
  chuyển sang kiểu §3.6 theo lệnh chủ dự án. **145/145 cặp (nguồn, nội dung) khớp tuyệt đối** —
  đối chiếu bằng chính parser của ứng dụng, không phải bằng mắt.
- **P3-UX-001 — 14/14 bài baseline nay xanh.** Chẩn đoán của Codex (`revalidatePath` gọi **trong**
  action làm `pending` kẹt) đúng cơ chế và trả được 11 bài. Ba bài còn lại **ba nguyên nhân khác
  nhau**, xem `16` §7.2: M12 do dải cảnh báo **cấp trang** nằm ngoài lớp che lạc quan + 250ms hẹn
  giờ thừa; M10 (2 viewport) do mục *"Tôi đã gửi"* thiếu dòng vừa gửi.
- **🔴 Một giả thuyết đã bị LOẠI TRỪ bằng phép đo, không phải bằng suy luận:** trả lại
  `revalidatePath("/notifications")` vào `publishNotification` **không đổi được gì** — bài vẫn đỏ
  y nguyên ở cả hai viewport. Nên đã gỡ ra lại: giữ "cho chắc" là nhét một lượt dựng lại cây vào
  response của action, đúng thứ đợt sửa đang đi gỡ, mà không mua được gì.
- **Migration/data impact:** **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền** cho cả hai task.
- **Đã test (số thật):** lint **0 warning 0 error** · typecheck ✓ · build ✓ **29/29 trang** ·
  unit **1568 pass / 18 skip** (114 tệp pass / 5 skip; **22 bài mới** trên 3 tệp của Đợt A) ·
  DB reset qua đủ migration + `seed:dev` trước lượt full.
  **E2E toàn hệ thống: 588 bài** (585 cũ + 3 bài mới của Đợt A) ⇒ **585 pass · 3 fail · 22,0 phút**.
  Đối chiếu baseline GĐ3 (**571 pass · 14 fail** trên 585).
- **⚠️ Ba bài đỏ của lượt full — nói đúng bản chất, không làm tròn thành "hoà":** chúng **không
  phải** 3 bài đỏ của lượt trước, và **cả ba đều xanh khi chạy lại targeted (51/51 trên 3
  viewport)**. Cả ba cùng một chữ ký: sau một lượt ghi, dữ liệu Server Component chưa về kịp cửa
  sổ **5 giây mặc định** (`committees:382` ×2 · `imports:332` ×1). Đây là **nợ #10**, không phải
  hồi quy của phiên này — nhưng cũng **không được ghi là PASS**.
- **🔴 Nợ mở, ghi đúng như nó là:** **vì sao** `router.refresh()` không mang dòng vừa gửi xuống
  mục *"Tôi đã gửi"* thì **chưa tìm ra** — truy vấn sắp xếp `published_at` giảm dần, giới hạn 20,
  danh sách chỉ có 8 dòng nên **không phải bị cắt trang**. Lớp chèn tay làm màn hình nói đúng
  ngay, nhưng nó **không phải** lời giải thích.
- **Quyết định mới:** chủ dự án cấp **quyền thường trực tự commit + push** (2026-08-14) ⇒ sửa
  `CLAUDE.md` §8, `AGENTS.md` §10, quy tắc 6/7 của file này. Ba ràng buộc giữ nguyên: kiểm thử
  thật trước khi commit · một commit một task ID · cập nhật WORKLOG bằng số thật trước khi commit.
  Thêm `.gitignore` cho `.agents/` · `BA-Kit/` · `skills-lock.json` (đồ nghề phiên AI).
- **Blocker/rủi ro:** kết luận **NO-GO của GĐ3 vẫn nguyên** — phiên này chỉ đóng nhánh browser
  reliability của mục 5, chưa đụng D-65 audit log, M02 hai workflow chuyển năm, M07 AC-03-01,
  M11/M06 live report + split-brain, production preflight.
- **Next action:** Đợt B của kế hoạch 17 (`Select` v2 — listbox tự dựng, giữ nguyên 73 chỗ gọi).
  Chủ dự án cần **xoá `loading/` và `LoiChua.md` ở thư mục gốc** — đã có ghi chú hướng dẫn ở đó.

### [2026-08-13] Phiên 66 — Codex — GĐ3-VERIFY — **HOÀN TẤT KIỂM ĐỊNH / NO-GO**

- **Phạm vi:** đọc và đối chiếu đủ bộ tài liệu hệ thống, 14 × 8 tài liệu module và bộ UI redesign;
  review độc lập bốn nhánh business/product, permission/security, data integrity và UI/UX/E2E.
  Không dùng nhãn `XONG` trong log triển khai thay cho bằng chứng hành vi.
- **Hardening đã thực hiện trong phạm vi:** thu hồi đặc quyền bảng nguy hiểm của `anon`/
  `authenticated`; bảo vệ state machine/import duplicate/commit/purge ở DB; thêm invariant hai
  chiều student–guardian, student–enrollment và year gate cho phân công lớp. Migration mới:
  `20260813000200`…`20260813000400`, pgTAP `053`…`055` và integration concurrency tương ứng.
- **Quality gates cuối:** lint **0/0** · typecheck **PASS** · build production **PASS (29
  page/route)** · default test **1.545 pass / 18 skip** · reset DB qua toàn bộ migration **PASS** ·
  pgTAP **55 file / 1.442 assertion PASS** · M03/M09/M10/import/scope/perf integration **PASS**.
  Import gate ghi **405/489** dòng hợp lệ, **0 write failure**; perf smoke trên 930 hồ sơ có mọi
  truy vấn đo được dưới 100 ms.
- **E2E:** lưu baseline đầu **23 failure id**; sửa các test stale/fixture contamination có bằng
  chứng; full cuối trên DB reset + seed, build production, 1 worker: **571/585 pass · 14 fail ·
  32,2 phút**, không có `ECONNREFUSED`. Artifact ở
  `docs/system-workflow-redesign/verification/evidence/full-e2e-20260813-final/`. Cả 14 ca được
  phân loại `PRODUCT_UX_RELIABILITY`; 0 test-sync/inconclusive và 0 ca tự chứng minh mutation sai.
  HTML report sao lưu bị stale/mismatched nên không dùng; danh tính fail lấy từ `.last-run.json` +
  14 `error-context.md`, tổng số lấy từ console result lúc chạy.
- **Blocker phát hành:** D-65 audit toàn hệ thống chưa có; M02 có hai workflow chuyển năm; M07
  same-cell stale save vẫn last-write-wins nếu AC-03-01 còn hiệu lực; M11 thiếu live report năm cũ;
  M06 có cửa sổ Storage/DB split-brain; browser feedback/navigation còn kẹt dưới tải. Migration
  hardening mới cũng còn residual production ACL/concurrency được ghi rõ, không được gọi tuyệt đối.
- **Kết luận module:** **12 FAILED · 1 BLOCKED · 1 VERIFIED_WITH_MINOR_ISSUES có điều kiện · 0
  VERIFIED tuyệt đối**. Vì vậy **không xác nhận Giai đoạn 2 hoàn tất** và **không production-ready**.
- **Bàn giao:** báo cáo `01_VERIFICATION_PLAN.md` đến `09_FINAL_SYSTEM_ASSESSMENT.md`, Audit Board
  §8 và open-issue ledger là nguồn tiếp tục. Không commit/push/deploy.

### [2026-08-12] Phiên 65 — Codex — GĐ 2B · Module 14 · M13-B + M13-C — **ĐÓNG MODULE 14/14**

- **Claim:** hoàn tất luôn M13-B và M13-C theo quy trình 9 bước của `11` §4 và nghiệm thu 15 mục
  của `11` §5. Không có lựa chọn mới cần chủ dự án quyết; dùng các quyết định D-64/D-75/D-88/D-91
  đã chốt. **Không sửa `09/10/11`; không commit.** Skill UI/UX được dùng để rà 44px, cỡ chữ,
  semantics bảng, focus bàn phím và bố cục 360px.
- **M13-B:** thêm trạng thái dùng chung `not_linked` · `no_children` · `no_enrollment` · `no_data`,
  giữ lỗi query là lỗi hệ thống. `PortalEmptyState` được dùng ở danh sách con, điểm danh, kết quả và
  xin nghỉ; nội dung nêu đúng người/năm học/bước tiếp theo. Hai layout portal dùng
  `data-density="comfortable"` (nền 17px, nhỏ nhất 14px, control 48px).
- **Khả năng đọc:** cảnh báo chuyên cần có icon + chữ, `role="status"`, `aria-live` và đường liên hệ
  GLV. Bảng có `caption`, `scope`, vùng cuộn ngang nhận focus và không ép chữ ở 360px. Không truy
  vấn/hiện `note` nội bộ; không dùng màu làm tín hiệu duy nhất.
- **M13-C:** đối chiếu route theo D-91; ghi lại `/reports/snapshots` đang tồn tại và gỡ ghi chú nợ
  `/staff/[staffId]` đã trả ở M04. Rà Kết quả · Giáo án · Thông báo cho cả phụ huynh và thiếu nhi.
  Bài độc lập tự dựng hai cột điểm công bố, ẩn một cột rồi tải lại, chứng minh TB và mẫu số đổi đúng
  trên đường portal.
- **Dữ liệu/quyền:** **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền**. DB được reset từ
  trống qua đủ 54 migration; pgTAP chạy trước seed; seed dev tạo **19 lớp**.
- **Số kiểm thử thật cuối:** pgTAP **1385/1385** trên **52 file** · unit **1545 pass / 16 skip**
  (**111 file pass / 4 skip**) · lint **0 warning 0 error** · typecheck ✓ · build ✓ **29/29 trang** ·
  `portal.spec.ts` **24/24** trên 360/768/1366.
- **E2E toàn hệ thống đã chạy đủ:** **561/585 pass**, **24 fail**, 36,9 phút. Cả **9 bài mới của
  M13-B/C xanh**. Tám bài M13-A cũ đỏ do response/stream chậm hoặc con do spec khác thêm; 16 bài
  còn lại ở module cũ mang chữ ký Server Action kẹt `pending`, response chậm hay DB chia sẻ. Sau
  reset, toàn M13 xanh 24/24. Ghi cả mẫu số, không dùng lượt riêng để che nợ toàn hệ thống.
- **Kết luận audit:** **14/14 module đã đóng về phạm vi triển khai được duyệt; không còn đợt A/B/C
  nào bị sót.** Chưa gọi là sẵn sàng phát hành vì 24 E2E toàn hệ thống còn đỏ. Backlog chủ động:
  TB-07/TB-08A/N-3/N-4/N-5 · lịch sử Top 5 · nợ #2/#3/#5/#7/#10/#12 · P7-T7/BLK-8.
- **Next action:** ưu tiên trả **nợ #10** bằng cô lập fixture DB và điều tra vòng trả lời Server
  Action/stream; sau đó mới chạy lại full E2E làm release gate. Việc này là một đợt chất lượng hệ
  thống riêng, không phải phần M13 còn thiếu.

### [2026-08-12] Phiên 64 — Codex — GĐ 2B · Module 14 · Đợt M13-A — **ĐÓNG LỚP NỀN CRITICAL**

- **Claim:** `2B · M13-A`; làm theo thứ tự user yêu cầu và quy trình 9 bước của `11` §4. Không có
  câu hỏi mới cần chủ dự án quyết: D-64 (một con đi thẳng), D-75 (ghi chú nội bộ), D-88 (menu) và
  D-91 (dùng chung `/results` + `/teaching-plan`) đã chốt. **Không sửa `09/10/11`; không commit.**
- **Điều quan trọng nhất tìm thấy:** `getPortalChildren()` mang tên "con" nhưng ngữ nghĩa thật là
  *mọi em RLS cho người gọi đọc*. Nó đúng cho GLV nộp đơn hộ, nhưng sai khi dùng làm *con của tôi*
  hoặc *chính em*; với tài khoản nhân sự toàn cục, cổng có thể thành một danh sách thiếu nhi thứ
  hai. Gốc rễ giống M10: **hàng rào bảo mật không thay cho bộ lọc nghiệp vụ**.
- **Đã sửa lớp nền:** tách `getAccessibleStudents()` · `getMyChildren(profileId)` ·
  `getSelfStudent(profileId)`; trang chi tiết cũng bắt đầu từ `getMyChildren`, nên URL con người
  khác là 404 và không lộ tên. `/student/*` có layout gọi `requireRouteAccess("/student")`; trang
  điểm danh giữ guard thứ hai. D-64: đúng một con redirect thẳng, nhiều con mới ở danh sách.
- **D-25 được thi hành mà không phình dữ liệu client:** `getAuthContext` chỉ thêm cờ boolean
  `hasGuardianProfile`; GLV-phụ huynh thấy hai mục portal trong sidebar/drawer, GLV thường không
  thấy; không gửi id guardian/child xuống vỏ. Thanh dưới của nhân sự đứng lớp giữ nguyên năm ô.
- **D-70/D-75 được rà lại:** 5 hành trình E2E gồm cả truy cập chéo và vai trò sai; query/type portal
  không có `note`; pgTAP quyền cột vẫn xanh. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi
  quyền.**
- **Bộ kiểm mới:** +1 bài navigation cho GLV-phụ huynh; +4 bài kiến trúc/ngữ nghĩa query; một spec
  portal 5 hành trình × 3 viewport. Lượt E2E đầu **9/15** vì test bắt URL danh sách trước redirect
  và dò menu trước lúc dashboard dựng xong; sửa phép đo, lượt cuối **15/15**. Không dùng lượt đầu
  để che hay đổi hành vi sản phẩm.
- **Số kiểm thử thật trên DB sạch:** `db:reset` ✓ · pgTAP **1385/1385** trên **52 file** · seed dev
  ✓ · unit **1536 pass / 16 skip** (**109 file pass / 4 skip**) · lint **0 warning 0 error** ·
  typecheck ✓ · build ✓ **29/29 trang** · `portal.spec.ts` **15/15** ở 360/768/1366, không tràn
  ngang. Runner E2E cũng tự build production sạch trước khi chạy.
- **Tài liệu:** cập nhật `16_PHASE_2B_IMPLEMENTATION_LOG.md`, `00_SYSTEM_AUDIT_BOARD.md` và WORKLOG.
  M13 **chưa đóng**; không chạy toàn bộ E2E ở đợt nền — đó là gate của M13-C.
- **Next action:** **M13-B** — phân biệt đủ bốn nguyên nhân rỗng trên toàn cổng, hoàn thiện khả năng
  đọc/accessibility ở 360px và thêm bài kiểm chéo điểm trung bình portal sau khi ẩn cột.

### [2026-08-12] Phiên 63 — Claude — GĐ 2B · Module 13 · Đợt M11-B + M11-C — **ĐÓNG MODULE 13 (M11)**

- **Làm được:** hai đợt cuối của module Báo cáo & Dashboard trong **một phiên**, mỗi đợt chạy kiểm
  thử riêng. Chủ đề chung của cả hai: module này **không hỏng ở chỗ cho phép sai, nó hỏng ở chỗ nói
  sai** — và mỗi hạng mục dưới đây là một lượt chữa một câu nói sai cụ thể.

  **Hai câu hỏi phải chủ dự án chốt trước khi code, cả hai đều là ranh giới quyền:**

  1. **D-173 — cửa sổ hẹp của Thủ quỹ mở tới đâu.** D-170 đã chốt *cách* nới nhưng chưa chốt *tới
     đâu*. 🔴 **Lý lẽ đến từ số đo, không từ suy đoán:** đo bằng JWT thật của `GLV904` **trước** khi
     sửa — trang tổng quan hiện `0 thiếu nhi · 0 giáo lý viên · 0 lớp`, hai bảng báo cáo trả **0
     dòng**. Đó **không phải "chưa biết", đó là NÓI SAI**, và nói sai với một chức việc cấp xứ đoàn
     ngay màn hình đầu tiên sau khi đăng nhập. Chủ dự án chọn phương án rộng nhất trong ba: phủ
     **cả ba chỗ** (bảng báo cáo · kho bản chốt · bốn ô số tổng quan). Loại phương án "chỉ trang
     Báo cáo" vì nó **lặp lại đúng vấn đề đang chữa** ở hai chỗ còn lại.
  2. **D-174 — hộp xác nhận có nêu TÊN người đã chốt bản trùng không.** Chủ dự án chọn **có**, qua
     một cửa sổ hẹp. Xem mục "cái bẫy `profiles`" bên dưới.

- **🔴 Bốn điều đáng nhớ của đợt B:**
  1. **Hai hàm `_for_treasurer` GỌI THẲNG hai RPC gốc, không chép một dòng SQL nào.** Chép ra một
     bản thứ hai "cho Thủ quỹ" là dựng sẵn hai con số sẽ lệch nhau vào một ngày không ai nhớ nổi,
     tức phá **D-52** ngay chỗ nó được sinh ra để bảo vệ. Gọi được vì "invoker" bên trong một hàm
     `security definer` chính là **chủ sở hữu hàm**, và chủ sở hữu bảng được miễn RLS — đã kiểm
     không bảng nào của dự án bật `force row level security`.
  2. **Cố ý KHÔNG sửa `v_dashboard_summary`.** Bốn con số của view lấy từ **bốn nguồn khác nhau**:
     ba nguồn lọc bằng RLS của bảng gốc nên với Thủ quỹ vẫn là 0, riêng `class_count` lọc bằng **vị
     từ viết tay trong view**. Nới trong view chỉ nới được **một** số ⇒ dựng lại **đúng cái bệnh
     D-169 vừa chữa hôm trước**: một hàng KPI có 1 số đúng và 3 số sai, chỉ đổi vai người mắc.
  3. **Nới số thôi thì sinh ra một câu nói sai THỨ HAI, ở thẻ bên cạnh.** `warned_student_count` là
     số gộp nên nó lên số thật, trong khi danh sách tên bên dưới vẫn rỗng vì RLS (đúng như D-67
     muốn) và bản cũ in *"Không có em nào cần lưu ý trong phạm vi của bạn"* — hai câu ngược nhau
     trong cùng một thẻ. Nên cờ `aggregateOnly` không chỉ đổi **nguồn số**, nó đổi cả **những thẻ
     được hiện**.
  4. **RANH GIỚI CŨ KHÔNG NHÚC NHÍCH, và đó là nửa quan trọng hơn của bộ kiểm.** pgTAP `051` có 6
     bài đo cửa sổ **có mở** và **6 bài đo ranh giới cũ**: Thủ quỹ gọi thẳng hai RPC gốc vẫn 0 dòng
     · đọc thẳng `students`, `student_attendance_records`, `assessment_scores` vẫn 0 dòng ·
     `app.can_global_read()` vẫn không có họ · và vẫn **không chốt được** ở cả ba phạm vi, đo cả
     bằng hàm lẫn bằng một lệnh `insert` gửi thẳng vào cơ sở dữ liệu. **Một bản cài đặt lười thêm
     `treasurer` vào `can_global_read()` sẽ làm 6 bài đầu xanh y hệt và 6 bài sau đỏ hết.**

- **🔴 Cái bẫy `profiles` gặp HAI LẦN trong cùng một module** — sau khi M08-C đã gặp một lần
  (D-163). `profiles_select_self_or_global` chỉ mở cho chính mình hoặc `app.can_global_read()`, mà
  **hai nhóm chốt báo cáo nhiều nhất — Trưởng ngành và Giáo lý viên đại diện — không nằm trong sáu
  vai trò ấy**. Nhúng thẳng `profiles(display_name)` cho họ một ô `null` **trong im lặng**. Lần một:
  `find_report_snapshot_duplicate` (đợt B, trả **một** hàng cho hộp xác nhận). Lần hai: TB-06 cần
  cột "Người chốt" cho **20 dòng** mỗi trang, dùng lại hàm kia là 20 lượt gọi cho một lượt dựng
  trang ⇒ `list_report_snapshot_actors` (đợt C). Cả hai chép **nguyên vị từ** `app.can_read_report`,
  không viết lại tay (bài học D-160).

- **🔴 TB-03 — ngõ cụt nằm ở thẻ mà không ai bọc cờ.** Bản cũ bọc **ba** thẻ bằng `isStaff` và **bỏ
  sót thẻ "Cần quan tâm"**, nên phụ huynh mở trang chủ, thấy tên con mình đang bị cảnh báo chuyên
  cần, bấm vào — và bị đá sang `/access-denied`. Từ đó **không còn đường nào khác**. Nay đích đến
  của một cái tên **suy từ `audience` ở một chỗ duy nhất**.

- **🔴 N-6 lộ một khoảng trống của chính bộ dữ liệu mẫu.** `seed:dev` tạo lớp, thiếu nhi và nhân sự
  nhưng **không tạo một buổi điểm danh đã chốt nào** — đo được: `report_attendance_rows` trả 0 dòng
  cho cả vai trò toàn cục. Với 0 dòng thì nút "Chốt báo cáo" **luôn `disabled`**, tức đường ghi
  nguy hiểm nhất của module (bản chốt **không xoá được**) sẽ **không bao giờ được chạy tới**. Một
  bộ E2E xanh mà chưa từng bấm nút nguy hiểm nhất là một bộ E2E nói dối; spec tự dựng dữ liệu qua
  service role, **mỗi viewport một tháng riêng** để phép đo "bản trùng" không phụ thuộc thứ tự chạy
  (đúng loại xanh giả M10-C đã vấp).

- **File thay đổi:** `supabase/migrations/20260812000100_treasurer_aggregate_window.sql` **mới** ·
  `supabase/migrations/20260813000100_report_snapshot_actor_names.sql` **mới** ·
  `supabase/tests/051_treasurer_aggregate_window_test.sql` **mới** ·
  `supabase/tests/052_report_snapshot_actors_test.sql` **mới** · `src/types/database.ts` (sinh lại
  bằng khuôn file-tạm-rồi-chép-đè) · `src/features/reports/filters.ts` ·
  `src/features/reports/snapshot-directory.ts` **mới** · `src/features/reports/server/queries.ts` ·
  `src/features/reports/server/actions.ts` · `src/features/reports/components/report-workbench.tsx`
  (viết lại theo `09`) · `src/features/dashboard/server/queries.ts` ·
  `src/features/dashboard/components/dashboard-overview.tsx` (viết lại) ·
  `src/app/(dashboard)/reports/snapshots/page.tsx` **mới** ·
  `src/app/(dashboard)/reports/snapshots/[snapshotId]/page.tsx` **mới** ·
  `tests/unit/report-filters.test.ts` · `tests/unit/report-workbench.test.tsx` **mới** ·
  `tests/unit/report-snapshot-directory.test.ts` **mới** ·
  `tests/unit/dashboard-overview.test.tsx` **mới** · `tests/e2e/reports.spec.ts` **mới** ·
  `16_PHASE_2B_IMPLEMENTATION_LOG.md` · `00_SYSTEM_AUDIT_BOARD.md` · `WORKLOG.md`.

- **Migration/data impact:** **2 migration · 1 thay đổi phân quyền (`11` §6 D-67, NỚI) ·
  0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng.** Đúng **một** policy đổi vị từ:
  `report_snapshots_select_scope` (quyền **đọc** bản chốt). `app.can_create_report` **không nhúc
  nhích** ⇒ D-19 và D-66 vẫn đứng.

- **Đã test:** `npm run db:reset` sạch từ DB trống → `npm run test:db` **1385/1385** trên **52 file**
  (trước 1324/50 ⇒ **+61**: `051` 48 bài, `052` 13 bài, đều bằng JWT thật) → `db:types` (khuôn an
  toàn: sinh file tạm, kiểm là TypeScript thật, rồi mới chép đè) → `seed:dev`.
  `npm test` **1531 pass / 16 skip** (trước 1469/16 ⇒ **+62**) · `npm run lint` **0 warning 0 error**
  · `npm run typecheck` ✓ · `npm run build` ✓ **29/29 trang** ·
  `npx playwright test tests/e2e/reports.spec.ts --project=laptop-1366` **18/18 xanh**; lượt trước
  đó trên cả ba viewport **44/48** (4 bài đỏ đều là `page.goto`/`locator.fill` hết giờ, **0 bài đỏ ở
  một khẳng định nghiệp vụ**).

- **Quyết định mới:** **D-173** (cửa sổ hẹp của Thủ quỹ phủ cả ba chỗ: bảng báo cáo · kho bản chốt ·
  trang tổng quan) · **D-174** (hộp xác nhận nêu **tên** người chốt bản trùng, qua cửa sổ hẹp; 0
  policy bị nới). Cả hai chủ dự án chốt 2026-08-12, ghi ở `16` §4.

- **Blocker/rủi ro:**
  🔴 **Số E2E TOÀN BỘ của phiên này KHÔNG dùng làm số nghiệm thu.** Docker Desktop **hỏng hai lần**
  giữa phiên — engine trả `500 Internal Server Error` cho **mọi** lệnh, và một truy vấn Supabase đơn
  giản đo được **445 giây** trước khi trả lời. Lượt chạy đầy đủ rơi đúng vào cửa sổ ấy nên các bài
  đỏ mang chữ ký **hạ tầng** (`page.goto: Target page, context or browser has been closed`,
  `Test timeout`) ở những spec mà đợt này **không đụng một dòng nào** (`authenticated-shell` ·
  `class-settings` · `enrollment-lifecycle`). **Con số nói ra mức độ hỏng rõ hơn mọi lời giải thích:
  lượt chạy mất 3,6 GIỜ** cho một bộ test bình thường mất **~25 phút** (M10-C: 27,3 phút · M08-C:
  22,7 phút), và nó **bị cắt ngang**: **107 bài xanh, 46 bài KHÔNG ĐƯỢC CHẠY**. Một lượt không đi hết
  bộ test thì không có mẫu số, nên nó không so được với 494/507 của M10-C. **Phải chạy lại
  `npm run test:e2e` khi môi trường ổn.** Dịch vụ `com.docker.service` đang ở trạng thái **Stopped**
  và cần **quyền Administrator** để bật lại — bản sinh đôi của cái bẫy `winnat` mà M11-A đã ghi.
  ⚠️ **Một giới hạn cố ý:** với Thủ quỹ, câu *"vì sao bảng trống"* luôn là câu chung, không bao giờ
  là *"chưa có buổi nào được chốt"* — `resolveEmptyReason` đếm `attendance_sessions` dưới RLS của
  người gọi. Sửa cho đúng cần một cửa sổ hẹp **thứ tư** cho đúng một câu chữ.
  ⚠️ **TB-07 (chọn năm học) vẫn để ngỏ** theo đúng thứ tự `07` §4 xếp — hệ quả: **chốt báo cáo cho
  năm cũ (WF-16 bước 3) chưa làm được từ giao diện.**
  ⚠️ **Ba món giảm quyền của M06-B/M07-B vẫn đang chờ chủ dự án báo cho Ban điều hành xứ đoàn**;
  nay thêm **D-66** (Cha sở · Cha phó · Thủ quỹ mất nút "Chốt báo cáo", từ M11-A). Xem
  `VIỆC TIẾP THEO`.

- **Next action:** **`2B · M13` — Cổng Phụ huynh & Thiếu nhi, module 14/14 — MODULE CUỐI CÙNG.**
  `CRITICAL` (3), chưa chia đợt. Ba việc M11 bàn giao thẳng: cái bẫy `profiles` sẽ gặp **lần thứ
  ba** · **D-70 phải rà lại toàn bộ cổng** vì M13 thêm màn hình mới · kiểm chéo điểm trung bình sau
  khi M07-B cho phép ẩn cột. Chi tiết ở `VIỆC TIẾP THEO`.

### [2026-08-11] Phiên 62 — Claude — GĐ 2B · Module 13 · Đợt M11-A — **MỞ MODULE 13 (M11 Báo cáo & Dashboard)**

- **Làm được:**
  1. 🔴 **Phiên bắt đầu bằng việc dựng lại một phiên bỏ dở KHÔNG GHI SỔ.** Migration
     `20260811000100`, pgTAP `050` và 8 file mã nguồn đã được viết xong lúc 17:02–21:53 hôm trước,
     nhưng file 16 · `WORKLOG` · `00_SYSTEM_AUDIT_BOARD` đều dừng ở 16:36 ⇒ phải dựng lại hiện trạng
     bằng **dấu thời gian của file**. Và `src/types/database.ts` — **4120 dòng** — bị ghi đè thành
     **đúng một dòng** `{"_tag":"Error"…ECONNREFUSED 127.0.0.1:54422}`, vì `npm run db:types` chạy
     lúc Postgres cục bộ đang tắt và dấu `>` trong script **cắt trắng file đích trước khi lệnh
     chạy**. Hệ quả: `tsc` đỏ ngay dòng 1 ⇒ **cả đợt A chưa từng qua một cửa kiểm nào**.
     Nguyên nhân gốc **nằm ngoài repo**: Windows giữ chỗ dải cổng **54336–54935** cho Hyper-V, nuốt
     trọn 54420–54429 của Supabase nên Docker không mở được cổng nào — kể cả những container báo
     *"Up"*, `netstat` cho **0** cổng 544xx đang lắng nghe. Chủ dự án chạy `net stop winnat` /
     `net start winnat` (Administrator) rồi `supabase stop` + `start` để mở lại.
  2. **D-66 — tách một hàm gánh hai câu hỏi làm hai.** `app.can_create_report` từ Phase 6 phục vụ
     **cả** `report_snapshots_select_scope` lẫn `report_snapshots_insert_scope`, nên siết thẳng nó
     là **lấy luôn quyền xem/tải** của Cha sở/Cha phó — trái đúng câu chữ D-66. Nay
     `app.can_read_report` giữ **nguyên văn** luật cũ, `app.can_create_report` hẹp lại. Delta đo
     bằng cách liệt kê **14 vai trò × 3 phạm vi**: mất quyền chốt **đúng ba cái tên** — Cha sở ·
     Cha phó · Thủ quỹ; **không ai** mất quyền đọc.
  3. 🔴 **Cái bẫy sẽ cho một bộ pgTAP XANH GIẢ:** không được viết hàm hẹp bằng `can_access_sector` /
     `can_access_class` — **hai hàm ấy tự gọi `can_global_read()` bên trong**
     (`20260715000100:189,199`), nên bản siết chỉ đổi nhánh `global` vẫn để Cha sở chốt ở phạm vi
     **ngành** và **lớp**, tức siết **một nhánh trong ba**, và bộ kiểm chỉ đo nhánh `global` sẽ xanh
     trọn vẹn. `050` đo **cả ba nhánh cho từng vai trò**, cộng hai bài `throws_ok` **gọi thẳng
     `insert`** — vì đo hàm không phải đo đường ghi.
  4. **D-169 — ô "Lớp" của trang tổng quan hết nói sai.** Nó đếm trên toàn bộ `classes`, mà policy
     của bảng ấy **cố ý mở cho mọi tài khoản** (danh mục lớp phục vụ dropdown), nên `security_invoker`
     **không** thu hẹp con số: Giáo lý viên lớp Ấu 1 thấy **19** trong khi ba ô cạnh nó đều đúng
     phạm vi. Sửa bằng mệnh đề phạm vi **ở chính view**, không đụng policy của `classes`.
  5. **TB-04/TB-05 — trang Báo cáo hết nói dối về phạm vi.** Ba lý do bảng trống ra **ba câu khác
     nhau**; ô chọn ngành/lớp chỉ liệt kê thứ người đó xem được (một lựa chọn thì hiện nhãn tĩnh);
     tham số URL hỏng **thu hẹp và nói ra** thay vì âm thầm **nới rộng** về "toàn xứ đoàn"; phạm vi
     mặc định suy từ vai trò; nút "Chốt báo cáo" **hỏi luật** qua `public.can_finalize_report` thay
     vì chép lại bằng danh sách vai trò viết tay (bài học **D-151** của M07-B).
  6. **Nợ #18 ĐÓNG HẲN** (`report_snapshots` là **bảng cuối cùng**, ca **policy** khuôn M02-C) ·
     **nợ #14** trả cho `reports` ở **bốn** cửa vào, còn 1 module · **F06** bỏ guard chạy hai lần ·
     **F09** bản chốt hình dạng lạ trả **422** thay vì **500**.
  7. 🔴 **Bốn chỗ hỏng trong phần phiên trước để lại**, không chỗ nào có bài kiểm canh:
     `tests/unit/report-filters.test.ts` vẫn gọi hàm theo **chữ ký cũ** (viết lại, **30 bài** thay
     cho 9) · câu *"vì sao bảng trống"* hỏi **cả xứ đoàn** rồi trả lời cho **một ngành** · gõ tay
     `?scopeType=sector` làm ô chọn phạm vi hiện **ô trống** · F09 ở trên.
  8. 🔴 **Một lỗi chỉ `typecheck` bắt được, và chỉ sau khi `database.ts` sinh lại:** bộ sinh kiểu của
     Supabase khai tham số không có mặc định thành **không nhận `null`**, trong khi phạm vi `global`
     đúng nghĩa là *không có id* ⇒ `p_scope_id` phải có `default null` ở SQL, chỗ gọi truyền
     `?? undefined` (khuôn `propose_promotion` của M08). Sửa thẳng migration vì file này **chưa từng
     áp production** (`AGENTS` §6 cấm sửa migration **đã** áp).
- **File thay đổi:** `supabase/migrations/20260811000100_report_finalize_split_and_scope.sql` ·
  `supabase/tests/050_report_finalize_split_test.sql` · `src/features/reports/filters.ts` ·
  `src/features/reports/server/{queries,actions}.ts` ·
  `src/features/reports/components/report-workbench.tsx` ·
  `src/app/(dashboard)/reports/{page.tsx,export/route.ts,snapshots/[snapshotId]/export/route.ts}` ·
  `src/features/dashboard/server/queries.ts` (bàn giao M10-A) · `tests/unit/report-filters.test.ts` ·
  `src/types/database.ts` (**sinh lại** — trước đó là một dòng báo lỗi) · file 16 ·
  `00_SYSTEM_AUDIT_BOARD.md` · `WORKLOG.md`.
- **Migration/data impact:** **1 migration.** 2 hàm quyền (1 mới, 1 `create or replace`) · 1 hàm bọc
  `public` mới có `revoke … from public, anon` · 2 policy của `report_snapshots` drop+create ·
  1 `create or replace view`. **0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng · 0 quyền ghi
  mới cho `authenticated`.** 🔴 Ba chỗ phải kiểm tay vì `create or replace` **im lặng từ chối** nếu
  lệch: tên tham số của `can_create_report` khớp bản Phase 6 · danh sách/thứ tự/kiểu cột của
  `v_dashboard_summary` **không đổi một cột nào** (nên không phải `drop … cascade`, không phải cấp
  lại `grant select`) · `default null` của `p_scope_id`.
- **Đã test (số thật, trên DB vừa `db:reset`, pgTAP chạy TRƯỚC `seed:dev`):**
  `npm run test:db` → **1324/1324** trên **50 file** (trước 1286/1286 trên 49 — **+38**, đúng
  `plan(38)` của `050`, toàn bộ **JWT thật của 9 vai trò**) · `npm test` → **1469 pass / 16 skip**
  (trước 1448/16 — **+21**) · `npm run lint` → **0 warning** · `npm run typecheck` → ✓ ·
  `npm run build` → ✓ **28/28 trang**. **Không chạy E2E** — đúng tiền lệ đợt A của M10/M08, và vì
  `07` §5 ghi **N-6: chưa từng có e2e nào cho `/reports` và `/dashboard`**; dựng bộ ấy là việc của
  **M11-C**, không phải chạy lại bộ cũ.
- **Quyết định mới:** **D-169** ô "Lớp" sửa **trong view** (phương án A, đúng khuyến nghị tài liệu —
  không cần chủ dự án) · **D-170** Thủ quỹ đọc số gộp theo lớp bằng **cửa sổ hẹp**, **không** chuyển
  hai RPC báo cáo sang `security definer` · **D-171** báo cáo "Kết quả học tập" luôn là cả năm học ·
  **D-172** cho chốt trùng nhưng **hỏi lại và nêu bản đã có**. Ba cái sau chủ dự án chốt 2026-08-11,
  thi hành ở **M11-B**.
- **Blocker/rủi ro:**
  1. ⚠️ **Nút "Chốt báo cáo" VẪN CHƯA hỏi lại** (AC-B09) — hoãn **có chủ ý** vì D-172 vừa đổi hẳn
     nội dung câu hỏi (hộp phải nhận ra bản chốt trùng). Trong thời gian chờ, **một cú bấm nhầm tạo
     một bản chốt vĩnh viễn** — snapshot không sửa và không xóa được.
  2. ⚠️ **D-66 siết quyền của người đang dùng — phải báo trước cho Cha sở và Cha phó**, nếu không
     hai vị mở trang Báo cáo, thấy mất nút "Chốt báo cáo", và kết luận hệ thống hỏng.
  3. ⚠️ **Thủ quỹ vẫn thấy trang Báo cáo trống** cho tới khi D-170 được thi hành ở M11-B.
  4. ⚠️ **Lỗi cổng Hyper-V sẽ tái phát sau mỗi lần khởi động máy.** Cách dứt điểm: chạy
     `netsh int ipv4 set dynamicport tcp start=10000 num=20000` bằng quyền Administrator.
  5. ⚠️ **Nợ #11 vẫn chưa đo** (`perf:smoke`). Đợt này thêm hai lượt gọi RPC `can_finalize_report`
     và một truy vấn `count` **chỉ chạy khi bảng đã trống** vào trang `/reports`.
- **Next action:** **M11-B** — ba việc đã chốt sẵn (D-170 · D-171 · D-172 + AC-B09), xem
  `VIỆC TIẾP THEO`. Không tự commit — cây làm việc đang có thay đổi chưa commit của cả 2B.

