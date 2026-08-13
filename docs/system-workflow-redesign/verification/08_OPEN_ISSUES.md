# 08 — Open issues và điều kiện phát hành

> Ngày chốt danh sách: **2026-08-13**  
> Trạng thái hệ thống: **NO-GO**  
> Quy tắc: issue chỉ đóng khi có bằng chứng retest trên baseline cuối; “đã có patch” không đồng nghĩa
> `CLOSED`.

## 1. Thang mức độ

| Severity | Định nghĩa dùng trong Giai đoạn 3 |
|---|---|
| `CRITICAL` | Vi phạm quyết định/AC bắt buộc, mở đường bypass hoặc làm sai vòng đời cốt lõi; chặn phát hành vô điều kiện |
| `HIGH` | Có nguy cơ mất dữ liệu, sai dữ liệu hoặc hành trình chính không đáng tin cậy; chặn phát hành cho tới khi sửa/retest |
| `MEDIUM` | Chưa chứng minh gây mất dữ liệu hiện tại nhưng làm yếu security/traceability/QA; phải đóng hoặc có chấp thuận rủi ro rõ ràng |

## 2. Danh sách tóm tắt

| ID | Severity | Phạm vi | Tiêu đề | Trạng thái | Release |
|---|---|---|---|---|---|
| `P3-SEC-001` | `CRITICAL` | Toàn hệ thống / D-65 | Thiếu full audit log, thiếu viewer và đang ghi dữ liệu đăng nhập bị cấm | `OPEN` | **BLOCK** |
| `P3-BIZ-001` | `CRITICAL` | M02 | `set_current_academic_year` bypass quy trình đóng năm; semantics `closed/archived` mâu thuẫn | `OPEN · NEEDS_CONFIRMATION` | **BLOCK** |
| `P3-DATA-001` | `HIGH` | M07 | Hai người sửa cùng một ô điểm vẫn last-write-wins, trái AC-03-01 | `OPEN · NEEDS_CONFIRMATION` | **BLOCK** |
| `P3-BIZ-002` | `HIGH` | M11 | Không chọn/xem/chốt báo cáo năm học cũ | `OPEN` | **BLOCK** |
| `P3-DATA-002` | `HIGH` | M06 | Storage và metadata DB có thể split-brain khi một nửa thao tác thất bại | `OPEN` | **BLOCK** |
| `P3-UX-001` | `HIGH` | Cross-module | Full final còn 14 E2E failure; pending/navigation/feedback không ổn định | `OPEN` | **BLOCK** |
| `P3-SEC-002` | `HIGH` | ACL / triển khai | Quyền bảng hiện tại đã harden nhưng còn default ACL `supabase_admin` và yêu cầu PG17 | `MITIGATED · RESIDUAL OPEN` | **CONDITIONAL BLOCK** |
| `P3-DATA-003` | `MEDIUM` | M03/M12 hardening | Còn residual deadlock/forgeable counters và thiếu race assertion chuyên biệt | `OPEN` | **CONDITIONAL BLOCK** |
| `P3-DOC-001` | `MEDIUM` | Traceability | AC/tài liệu module còn hành vi cũ và câu hỏi đã được quyết định | `OPEN` | **BLOCK GĐ3 SIGN-OFF** |
| `P3-QA-001` | `MEDIUM` | E2E | Nợ stale/fixture baseline đã cải thiện; final classifier có 0 test-sync/inconclusive nhưng suite vẫn đỏ | `MITIGATED · RESIDUAL OPEN` | **BLOCK E2E GATE** |

## 3. Chi tiết issue

### P3-SEC-001 — D-65 chưa được triển khai toàn hệ thống

**Severity:** `CRITICAL`  
**Owner đề xuất:** Backend/Database + Security; Product owner xác nhận chính sách redaction/failure  
**Disposition:** phải triển khai, không được hạ thành technical debt sau phát hành.

**Evidence**

- `docs/system-workflow-redesign/06_DECISION_LOG.md:120-157` chốt audit đầy đủ cho khoảng 30 thao tác
  trong 12 nhóm. Mỗi event cần actor, thời gian, action, target, before/after và địa chỉ truy cập; bảng
  append-only; chỉ Super Admin đọc; không ghi mật khẩu/mã đăng nhập/toàn bộ hồ sơ sức khỏe.
- `docs/system-workflow-redesign/05_REDESIGN_PRIORITY_PLAN.md:108-125` tách rõ ba phần: bảng append-only,
  nối ~30 thao tác và màn hình Super Admin xem/lọc.
- Repo chỉ có `account_audit_events` cho một phần tài khoản/nhân sự và các lịch sử miền riêng như
  leaderboard/promotion; không có event model chung và không có viewer Super Admin toàn hệ thống.
- Nhiều mục trong `16_PHASE_2B_IMPLEMENTATION_LOG.md` ghi D-65 “không áp dụng” rồi chỉ giữ
  `updated_at/updated_by`, trái phạm vi D-65 (hồ sơ, người giám hộ, năm học, ghi danh, điểm danh, điểm,
  Ban/thiết bị, thông báo, import và báo cáo đều được gọi đích danh).
- `src/features/auth/server/actions.ts:670-676` ghi thẳng `previousUsername → normalizedUsername` vào
  `detail`, trong khi D-65 cấm ghi mã/tên dùng để đăng nhập.

**Reproduce**

1. Thực hiện lần lượt đổi người giám hộ, chốt năm học, mở khóa điểm danh, công bố/ẩn điểm, báo hỏng
   thiết bị, thu hồi thông báo, commit import và chốt báo cáo.
2. Đăng nhập Super Admin, tìm một trang audit chung hoặc truy vấn một bảng event chung.
3. Quan sát: không có viewer/event chung; phần lớn thao tác chỉ để lại metadata miền. Riêng đổi username
   để lại old/new username trong `account_audit_events.detail`.

**Expected:** mọi thao tác tối thiểu của D-65 sinh event redacted, append-only và SA-only; mô hình lỗi
ghi audit được chọn/document rõ; viewer lọc được actor/action/target/thời gian.  
**Actual:** coverage phân mảnh, không đủ trường/nhóm, không có viewer; có dữ liệu đăng nhập không được
redact.  
**Root cause:** triển khai đã thu hẹp “full audit” thành audit tài khoản và coi metadata `updated_by/at`
là đủ ở module còn lại, dù quyết định D-65 đã đảo ngược cách làm đó.  
**Retest bắt buộc:** catalog quyền + pgTAP append-only/SA-only/negative JWT; unit redaction; integration
cho từng nhóm action; E2E “thao tác nhạy cảm → viewer thấy event đúng, người thường không thấy”.  
**Điều kiện release:** đóng đủ danh sách D-65, xóa/redact dữ liệu đăng nhập khỏi event mới, có chiến
lược xử lý event cũ và full gate xanh.

### P3-BIZ-001 — M02 có đường chuyển năm bỏ qua chốt sổ

**Severity:** `CRITICAL`  
**Owner đề xuất:** Product owner/BA + Backend/Database  
**Disposition:** dừng đường bypass ngay; cần xác nhận semantics chuyển năm trước khi thiết kế giao dịch cuối.

**Evidence**

- `supabase/migrations/20260725000300_academic_year_super_admin_only.sql:36-62` cho
  `set_current_academic_year` khóa bảng rồi đổi năm cũ từ `current` sang `closed` và năm đích sang
  `current` trực tiếp.
- Đường này không gọi checklist/`close_academic_year`, không yêu cầu gõ code, không kiểm việc tồn đọng,
  không ghi `closed_at/closed_by/close_reason`; `src/features/academic-years/server/actions.ts:125-142`
  vẫn gọi RPC đó từ UI.
- Chính migration vòng đời thừa nhận năm từng rơi vào `closed` như tác dụng phụ không có tiền kiểm
  (`20260726000100_academic_year_close_archive.sql:4-9`), nhưng không vô hiệu hóa đường cũ.
- Nguồn tài liệu còn mâu thuẫn: `ui-redesign/15_ACADEMIC_YEAR_THEME_TRANSITION.md:105-120` đề xuất
  một giao dịch đóng assignment/enrollment và đổi năm cũ thẳng sang `archived`; To-Be M02
  `04_TO_BE_FLOWS.md:142-158` chốt chuỗi `current → closed → archived` sau retention. Code hiện tại
  theo nửa sau về status nhưng không làm giao dịch chuyển giao được mô tả ở nguồn đầu.

**Reproduce**

1. Tạo năm `draft`; để năm hiện hành còn enrollment mở, buổi chưa chốt hoặc bảng điểm chưa khóa.
2. Gọi `set_current_academic_year(draft_id)` bằng JWT Super Admin hoặc action hiện hành.
3. Năm cũ thành `closed` và năm mới thành `current` mà không qua checklist/lý do/audit columns.

**Expected:** không có đường nào đóng năm ngoài flow đã duyệt; chuyển năm phải nguyên tử, có tiền kiểm,
xác nhận và audit; trạng thái archive có một nghĩa duy nhất.  
**Actual:** RPC cũ là bypass hợp lệ đối với chính hàng rào mới; assignment/enrollment không được chuyển
đồng bộ.  
**Root cause:** bổ sung `close_academic_year` song song thay vì thay thế/điều phối `set_current...`; tài
liệu theme transition không được hòa giải với quyết định retention D-120.  
**Cần xác nhận:** chọn một canonical workflow: (A) `current → closed`, archive sau retention; hoặc (B)
một semantics khác cho “archive” khi chuyển năm. Không thể giữ hai nghĩa.  
**Retest bắt buộc:** pgTAP direct-RPC negative, checklist/force reason, audit columns, race hai phiên đặt
năm; integration chuyển assignment/enrollment; E2E full transition và rollback.  
**Điều kiện release:** xóa/revoke/viết lại đường bypass, migrate tài liệu và toàn bộ consumer về cùng state
machine, rồi full DB/E2E xanh.

### P3-DATA-001 — M07 chưa chống ghi đè cùng ô

**Severity:** `HIGH`  
**Owner đề xuất:** Product owner + Backend/Frontend M07  
**Disposition:** triển khai optimistic concurrency đầy đủ hoặc Product owner phải sửa AC một cách minh thị;
không được coi “chỉ gửi ô đổi” là đạt AC hiện tại.

**Evidence**

- `modules/M07-ASSESSMENTS/08_ACCEPTANCE_CRITERIA.md:53-65` yêu cầu người B lưu từ bản cũ không ghi
  đè điểm 9 của A, nhận conflict và ô bị tô nổi bật.
- To-Be `04_TO_BE_FLOWS.md:129-160` yêu cầu gửi `expectedUpdatedAt` từng ô và RPC trả
  `{saved, conflicts[]}`.
- `src/features/assessments/score-diff.ts:17-21` ghi rõ phương án hiện tại chỉ bảo vệ hai ô khác nhau;
  cùng một ô “cần đổi chữ ký RPC nên để đợt sau”.
- `src/features/assessments/server/actions.ts:292-307` chỉ gửi `enrollmentId/score/note`, không có version,
  và RPC trả một count.

**Reproduce**

1. A và B mở cùng cột/cùng em tại version `v0`.
2. A lưu 9; sau đó B lưu 8 từ form cũ.
3. Quan sát điểm 8 thắng, B không nhận conflict; thay đổi của A mất.

**Expected:** điểm 9 còn nguyên, B nhận “1 ô bị bỏ qua…” và UI đánh dấu ô.  
**Actual:** last-write-wins ở đúng cùng một ô.  
**Root cause:** đợt M07-A chọn phương án B “chỉ gửi ô thay đổi” nhưng module được đóng trước khi làm
phương án A/version check, trong khi AC không được hạ.  
**Cần xác nhận:** giữ AC và triển khai optimistic lock (khuyến nghị), hay chính thức chấp nhận last-write-
wins và sửa BR/AC/rủi ro.  
**Retest bắt buộc:** integration hai client cùng version cho cùng ô và hai ô khác nhau; UI conflict;
E2E hai browser context; pgTAP/RPC kiểm không ghi một phần sai.  
**Điều kiện release:** không còn silent lost update hoặc có quyết định chấp nhận rủi ro bằng văn bản.

### P3-BIZ-002 — M11 chỉ dựng báo cáo năm hiện hành

**Severity:** `HIGH`  
**Owner đề xuất:** Backend/Frontend M11 + BA  
**Disposition:** triển khai TB-07 đã được đặc tả; không cần quyết định nghiệp vụ mới.

**Evidence**

- BR-M11-13 ghi báo cáo phải chọn được năm học; To-Be TB-07
  `modules/M11-REPORTS-DASHBOARD/04_TO_BE_FLOWS.md:341-369` yêu cầu thêm `academicYearId` và cho chốt
  năm cũ.
- `src/features/reports/filters.ts:27-33` chưa có `academicYearId`.
- `src/features/reports/server/queries.ts:185-191` hardcode `.eq("status", "current")`.
- Implementation log vẫn ghi hạng mục mở và hệ quả không chốt được năm cũ
  (`ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md:3814`). Kho snapshot lọc năm cũ đã có nhưng đó chỉ là
  đọc bản đã chốt, không phải dựng lại/chốt dữ liệu lịch sử.

**Reproduce:** mở `/reports`, tìm bộ chọn năm; thử tạo/xuất/chốt báo cáo cho năm `closed` có dữ liệu.
Màn hình và filter không có năm; query luôn lấy năm `current`.  
**Expected:** người đủ quyền chọn một năm mình đọc được, xem/xuất/chốt báo cáo lịch sử với range và scope
neo đúng năm đó.  
**Actual:** chỉ năm hiện hành; nếu không có năm current thì trả khung rỗng.  
**Root cause:** TB-07 bị để cuối vì đụng M02/M14 rồi module M11 vẫn được ghi “đóng”.  
**Retest bắt buộc:** unit parse/normalize năm; integration scope năm cũ; E2E chọn năm, export và snapshot;
negative test cho năm ngoài scope/UUID sai.  
**Điều kiện release:** TB-07 hoàn tất và historical report dùng cùng permission/scope với current report.

### P3-DATA-002 — M06 có thể lệch Storage và metadata

**Severity:** `HIGH`  
**Owner đề xuất:** Backend/Storage + Database  
**Disposition:** cần cơ chế compensation bền vững/outbox-reconciler hoặc thao tác idempotent có kiểm hậu
điều kiện; E2E happy path hiện tại không đủ.

**Evidence**

- Xóa item: `src/features/teaching-plans/server/actions.ts:346-363` xóa object trước rồi mới xóa row.
  Nếu DB delete fail/0 row sau đó, metadata còn nhưng object đã mất.
- Thay tệp: `:400-421` upload object mới, cập nhật metadata rồi dọn object cũ; lỗi dọn object cũ bị bỏ
  qua, tạo object rác.
- Gỡ tệp: `:429-452` null metadata trước rồi gọi Storage; lỗi Storage bị bỏ qua, object rác không còn
  đường tham chiếu.
- Audit As-Is đã ghi đúng hai split-brain edge và “chưa có bù trừ/job dọn” tại
  `modules/M06-TEACHING-PLANS/02_AS_IS_FLOWS.md:100-103,129-132`.
- AC-08/09/11 đòi không orphan và rollback object, nhưng các bài hiện hành chủ yếu đo happy path.

**Reproduce**

1. Với xóa item, gây DB delete fail/0-row sau khi Storage remove thành công; row còn trỏ path không tồn tại.
2. Với gỡ tệp, gây Storage API 5xx/network error sau khi DB update thành công; metadata null nhưng object
   còn trong bucket.
3. Với thay tệp, gây lỗi remove object cũ; action vẫn trả thành công và object cũ tồn tại.

**Expected:** hai tài nguyên hội tụ về một trạng thái nhất quán, lỗi được báo/ghi hàng đợi để retry; không
metadata chết và không object rác.  
**Actual:** thứ tự chỉ chọn một dạng hỏng; compensation là best-effort và có lỗi bị bỏ qua.  
**Root cause:** Supabase DB và Storage không chung transaction, nhưng flow chưa có state/outbox/reconciler
và không assert hậu điều kiện.  
**Retest bắt buộc:** fault-injection cho cả ba cửa lỗi, retry/idempotency, concurrent replace/delete và job
reconcile; kiểm catalog bucket sau mỗi lỗi.  
**Điều kiện release:** chứng minh mọi nhánh lỗi hội tụ hoặc có cảnh báo/repair path vận hành được.

### P3-UX-001 — Timing/navigation/RSC không ổn định

**Severity:** `HIGH`  
**Owner đề xuất:** Frontend/Next runtime + QA, phối hợp Backend cho latency  
**Disposition:** điều tra và sửa hành vi sản phẩm/test theo từng case; không gán chung nhãn “flaky”.

**Evidence:** full final hợp lệ chạy đủ **585 test trong 32,2 phút** và còn **14 failure**
(`571 pass`), chi tiết tại `06_E2E_TEST_MATRIX.md` và
`evidence/full-e2e-20260813-final/`. Phân bố **mobile 2 · tablet 4 · laptop 8**. Phần lớn error context
cho thấy thao tác đã bắt đầu nhưng feedback, derived state, pending state hoặc URL chưa về đúng trạng
thái trong cửa sổ chờ. Classifier final chốt **14/14 `PRODUCT_UX_RELIABILITY`, 0
`TEST_SYNCHRONIZATION`, 0 `INCONCLUSIVE/CASCADE`**. Lượt final không có `ECONNREFUSED`; SHA-256 `.last-run.json` là
`75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659`.  
**Reproduce:** reset + seed, chạy 23 spec một worker trên ba project; targeted từng nhóm đỏ và
ghi thời gian action, network/RSC response, URL, pending state, DB state trước/sau.  
**Expected:** mỗi thao tác có kết quả hữu hạn; khi DB commit thành công UI nói thành công và phản ánh state;
khi lỗi UI thoát pending và nói việc tiếp theo; navigation hoàn tất ổn định.  
**Actual:** 14 bài final dừng ở feedback/state/URL: 4 M02, 5 M03, 2 M12, 1 M10 và 2 M07;
portal/staff failures của baseline không còn trong danh sách final.  
**Root cause:** **chưa chứng minh một nguyên nhân duy nhất**. Bằng chứng hiện tại phù hợp với phối hợp
Server Action → revalidate/refresh → client pending và navigation chưa ổn định; một phần timeout test cũng
quá ngắn. Việc chỉ nới timeout sẽ che latency/feedback nếu không đo DB và UI cùng lúc.  
**Retest bắt buộc:** targeted có telemetry + full 585/585 sau reset/seed; không dùng lượt
`ECONNREFUSED` đã bị loại.  
**Điều kiện release:** targeted lặp ổn định và full E2E xanh; SLO/timeout được đặt theo số đo, không theo
phỏng đoán.

### P3-SEC-002 — ACL hardening còn residual triển khai

**Severity:** `HIGH` (current tables đã giảm rủi ro, nhưng production owner/version chưa được chứng minh)  
**Owner đề xuất:** Database/DevOps  
**Disposition:** migration mitigation đã có, issue chỉ đóng sau production-clone preflight.

**Evidence**

- `20260813000200_public_table_privilege_hardening.sql:23-29` revoke
  `TRUNCATE/REFERENCES/TRIGGER/MAINTAIN` khỏi `anon/authenticated` trên mọi bảng public và default ACL
  của owner `postgres`.
- Catalog Phase 3 ghi nhận 46 bảng hiện tại do `postgres` sở hữu và được bảo vệ; pgTAP `053` kiểm quyền
  hiện tại/default ACL của `postgres`.
- Cùng migration `:15-20` ghi rõ không đủ authority đổi default ACL do `supabase_admin` sở hữu. Bảng tương
  lai do owner này tạo có thể nhận lại grant nền tảng.
- Cú pháp quyền `MAINTAIN` cần PostgreSQL 17; migration cần preflight `server_version_num >= 170000`.

**Reproduce:** trên production clone, liệt kê owner/ACL của mọi `public` table và `pg_default_acl` cho
`postgres`, `supabase_admin`; kiểm `has_table_privilege` của `anon/authenticated` cho bốn privilege; ghi
`server_version_num`.  
**Expected:** Internet roles không có quyền vượt RLS trên bảng hiện tại hoặc tương lai; migration chạy được
trên version production.  
**Actual:** bảng/owner `postgres` đã được harden; default ACL platform-owned còn ngoài authority và version
production chưa được chứng minh trong artifact local.  
**Root cause:** quyền sở hữu default ACL thuộc role nền tảng khác migration role; SQL dùng privilege mới của
PG17.  
**Retest bắt buộc:** production-clone reset/migrate + catalog assertions; tạo probe table bằng từng owner
được phép và kiểm effective privilege.  
**Điều kiện release:** production chạy PG17+, mọi owner thực tế nằm trong policy hardening hoặc DBA áp
default ACL tương đương; catalog gate xanh.

### P3-DATA-003 — Residual concurrency và trust boundary của hardening mới

**Severity:** `MEDIUM`  
**Owner đề xuất:** Database + Backend + QA concurrency  
**Disposition:** invariant corruption chính đã được chặn; phải đóng hoặc có retry/risk acceptance minh
bạch trước production.

**Evidence**

- Wrapper `set_student_status(..., 'active')` khóa/cập nhật student trước rồi internal function có thể
  cập nhật enrollment (`20260813000400_student_staff_year_integrity.sql:126-151`), trong khi
  `resumeEnrollment` cập nhật enrollment trước và trigger sau đó khóa student
  (`src/features/enrollments/server/actions.ts:296-312`). Hai phiên cùng resume có thể tạo chu kỳ
  parent→child / child→parent và một giao dịch bị PostgreSQL hủy với `40P01`.
- Test M03 dùng `Promise.allSettled` rồi chỉ kiểm invariant cuối
  (`tests/integration/phase3-student-lifecycle-concurrency.test.ts:132-157,179-204`). Supabase có thể trả
  Promise fulfilled chứa `{ error }`, nên test xanh chưa chứng minh không deadlock hoặc có retry.
- M12 đã thống nhất lock order row→batch trong confirm/commit/purge, nhưng chưa có test hai-session cho
  review/commit/cancel/purge. Trong trạng thái `dry_run`, trigger còn cho authenticated sửa trực tiếp ba
  counter `valid_rows/warning_rows/error_rows` để phục vụ action tạo lô
  (`20260813000300_import_state_machine_guard.sql:68-83`); direct Data API có thể làm sai số hiển thị dù
  không bypass được commit invariant.

**Reproduce:** chạy hai session đồng thời qua public `set_student_status(active)` và direct resume cùng
student; assert cả error code lẫn state. Với M12, chạy purge đối đầu review/commit/cancel và thử sửa ba
counter qua Data API.  
**Expected:** không deadlock không được xử lý; nếu PostgreSQL chọn victim thì application retry an toàn và
UI nói rõ. Counter staging phải được tính/ghi qua một RPC có thẩm quyền hoặc kiểm lại từ rows.  
**Actual:** invariant cuối được giữ, nhưng availability/error semantics và tính xác thực counter chưa có
bằng chứng đầy đủ.  
**Root cause:** hai entry point dùng lock order khác nhau; counter được chừa editable để action hai bước
hoạt động.  
**Retest bắt buộc:** concurrency test assert `error` rõ (không chỉ Promise status), retry/idempotency test;
M12 two-session matrix và direct-counter negative test sau khi chuyển cập nhật counter vào RPC.  
**Điều kiện release:** một lock order/entry point cho resume hoặc retry được chứng minh; counter không còn
forgeable từ Data API; các race test lặp ổn định trên production-like DB.

### P3-DOC-001 — Nguồn nghiệm thu còn drift so với quyết định đã cài

**Severity:** `MEDIUM`  
**Owner đề xuất:** BA/Product + Tech lead từng module  
**Disposition:** cập nhật canonical BR/To-Be/AC và đánh dấu superseded; không sửa bằng cách xóa lịch sử quyết định.

**Evidence cụ thể**

| Module | Tài liệu cũ | Quyết định/implementation mới |
|---|---|---|
| M07 | `08_ACCEPTANCE_CRITERIA.md:139` đòi công bố lại Top 5 giống hệt lần đầu, `:165` gọi bất biến | D-155 chọn tính lại và lưu bản cũ vào `leaderboard_snapshots` append-only |
| M08 | `08_ACCEPTANCE_CRITERIA.md:116` đòi trường `history` trên review | D-157 chọn bảng riêng `promotion_review_events`, ngược phương án JSON history |
| M10 | `08_ACCEPTANCE_CRITERIA.md:81` còn cảnh báo “không thu hồi được”; `:89-93` còn câu hỏi thu hồi mở | D-165…D-168 đã chốt idempotency, thu hồi mềm, người nhận đích danh và cách hiển thị |
| M09 | `08_ACCEPTANCE_CRITERIA.md:196-209` còn 10 câu `NEEDS_CONFIRMATION`, cùng nhiều trạng thái test “chưa có” ở `:184-194` | D-92…D-100 và các đợt M09 đã giải quyết một phần lớn; phần thực sự còn mở chưa được tách khỏi marker cũ |
| M13 | `08_ACCEPTANCE_CRITERIA.md` còn Q-1/Q-2, route “chờ chốt”, S-10…S-12 ghi chưa có | D-88/D-91 và implementation M13 đã chọn menu/route và thêm các luồng tương ứng; trạng thái cần đồng bộ bằng bằng chứng mới |
| M14 | `08_ACCEPTANCE_CRITERIA.md:86-98` còn NC-1…NC-5 (ví dụ NC-3 login) | D-87…D-91 đã chốt login redirect, menu, route và shell context; AC chưa phản ánh hết |
| M02/theme | `15_ACADEMIC_YEAR_THEME_TRANSITION.md:48,105-120` dùng nghĩa `archived` khi kích hoạt | M02 To-Be/D-120 dùng `closed`, archive chỉ sau retention; cần hòa giải cùng `P3-BIZ-001` |

**Reproduce:** grep các cụm `NEEDS_CONFIRMATION`, `không thu hồi được`, `giống hệt lần đầu`, `history`
trong AC rồi đối chiếu bảng quyết định D-155/D-157/D-165…168/D-87…91.  
**Expected:** mỗi BR/AC đang hiệu lực có một nghĩa và trỏ tới implementation/test hiện hành; câu hỏi đã chốt
được đánh dấu resolved.  
**Actual:** reviewer có thể đánh fail code đúng quyết định mới hoặc viết test tái lập hành vi cũ.  
**Root cause:** implementation log trở thành nơi ghi quyết định thực tế nhưng 8 tài liệu module không được
back-propagate sau từng đợt.  
**Retest bắt buộc:** traceability review BR/AC ↔ decision ↔ code ↔ test cho 14 module; grep không còn marker
mở đã được quyết định; critic độc lập ký lại.  
**Điều kiện release:** traceability gate xanh; riêng conflict M02 phải có quyết định product trước.

### P3-QA-001 — Bộ E2E còn test/fixture không đáng tin cậy

**Severity:** `MEDIUM`  
**Owner đề xuất:** QA automation + owner các spec  
**Disposition:** patch test/seed đã được đo bằng targeted run 2 và full final; phần stale/fixture baseline
đã được giảm. Issue còn residual vì full gate đỏ, nhưng 14 failure final không được quy cho test.

**Evidence:** baseline từng có 5 failure stale, 2 fixture D-25 bị nhiễm và 3 bài portal ownership dừng
trước request đích. Sau patch, targeted run 2 đạt **15/18** và full final đạt **571/585**; các nhóm
committees/portal/staff trước đây không còn trong 14 failure final. Classifier final không tìm thấy ca
test synchronization, fixture cascade hoặc inconclusive nào; hai failure `results` thuộc product UX
reliability.  
**Reproduce:** chạy riêng `results.spec.ts` trên reset+seed, ghi URL, RSC/action response, pending state và
DB state tại đúng bước UI không hội tụ; lặp lại trên mobile/laptop và một viewport đối chứng.  
**Expected:** mỗi spec sở hữu fixture độc lập, khẳng định hành vi thay vì chi tiết triển khai, luôn đi tới
security request đích và cleanup kể cả khi fail.  
**Actual:** full final còn 14 product UX reliability failure; không ca nào chứng minh mutation sai, và
không ca nào được phân loại test synchronization/inconclusive.  
**Root cause:** nợ test/fixture baseline đã được giảm; nguyên nhân sản phẩm cụ thể của từng failure cần
telemetry action/RSC/DB để đóng.  
**Retest bắt buộc:** targeted các nhóm đỏ có telemetry và DB assertion, lặp ổn định; sau đó full 585/585.
Lượt `ECONNREFUSED` bị loại.  
**Điều kiện release:** 0 failure trong full rerun; không tái xuất stale/contamination/inconclusive; artifact được lưu.

## 4. Thứ tự đóng issue để tái đánh giá

1. Chốt semantics M02 và M07; khóa mọi đường bypass/lost update.
2. Thiết kế/cài D-65 xuyên module và viewer; đồng thời sửa redaction.
3. Đóng M11 historical reporting và M06 compensation/reconciliation.
4. Ổn định timing/navigation với telemetry, không chỉ nới timeout.
5. Đóng/accept có thời hạn residual concurrency và counter staging; hoàn tất ACL production preflight.
6. Sửa toàn bộ doc drift.
7. Reset + seed; chạy targeted; reset + seed lần nữa; chạy full gate.

Chỉ khi mọi issue `BLOCK` được đóng bằng retest và các residual được Product/Security chấp thuận rõ ràng,
hệ thống mới đủ điều kiện đổi khỏi **NO-GO**.
