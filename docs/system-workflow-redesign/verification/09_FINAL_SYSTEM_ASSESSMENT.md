# 09 — Đánh giá cuối Giai đoạn 3

> Thời điểm chốt: **2026-08-13, sau full E2E final**.  
> Phạm vi kết luận: source, migration, runtime gate và artifact được ghi trong bộ `verification/`.  
> `Verification hoàn tất` không đồng nghĩa `sản phẩm hoàn tất`.

## 1. Quyết định điều hành

**FINAL VERDICT: NO-GO — KHÔNG XÁC NHẬN GIAI ĐOẠN 2 ĐÃ HOÀN TẤT, CHƯA SẴN SÀNG PRODUCTION.**

Phase 3 đã chứng minh nhiều phần lõi tốt hơn đáng kể: migration chạy lại từ DB trống; 1.442 pgTAP,
18 integration/gate opt-in, lint, typecheck, unit và build đều xanh; import state machine, student–guardian–
enrollment invariant, closed-year assignment guard và Internet-role ACL đã được harden. Đây là bằng chứng
có giá trị, nhưng không đủ để đổi verdict vì:

- quyết định bắt buộc D-65 bị bỏ phần lớn phạm vi;
- M02 có hai đường transition năm với invariant khác nhau;
- M07 vi phạm AC chống mất cập nhật cùng ô;
- M11 thiếu live historical-year reporting;
- M06 có failure window gây lệch Storage/DB;
- targeted run 2 còn 3/18 failure; full E2E final chạy đủ 585 test nhưng còn **14 failure**
  (**571 pass, 32,2 phút**).

Do đó nhãn “14/14 module XONG” trong audit board/implementation log là claim triển khai lịch sử, không
phải chứng nhận phát hành. Kết quả kiểm định độc lập là **12 FAILED, 1 BLOCKED, 1
VERIFIED_WITH_MINOR_ISSUES có điều kiện, 0 VERIFIED tuyệt đối**.

## 2. Những gì Phase 3 đã thay đổi và chứng minh

### Đã thay đổi/harden

- Thu hồi `TRUNCATE/REFERENCES/TRIGGER/MAINTAIN` khỏi `anon/authenticated` trên các bảng public hiện có
  và default ACL của owner `postgres` (`20260813000200_public_table_privilege_hardening.sql`).
- Đưa invariant state/mapping/duplicate/gender/commit/purge của M12 xuống DB; raw purge cùng marker trong
  một transaction và dùng lock order canonical (`20260813000300_import_state_machine_guard.sql`).
- Bổ sung invariant hai chiều active student–active guardian, temporary student–paused enrollment và
  active assignment–writable year (`20260813000400_student_staff_year_integrity.sql`).
- Sửa Server Action import dùng RPC có thẩm quyền; thêm pgTAP `053`–`055`, concurrency/gate tests và
  ổn định một phần seed/Playwright fixture.

### Đã chứng minh bằng runtime

- static/unit/build: lint và typecheck pass; 111 file/1.545 default test pass; build 29 page/route pass;
- DB: reset pass, 55 file/1.442 pgTAP pass;
- opt-in: M03 2/2, M09 1/1, M10 6/6, import 1/1 và scope 8/8;
- data scale: import 489/84/405/0 tạo 376 student + 376 enrollment; perf smoke 930 student, mọi query được
  liệt kê dưới 100 ms trong lượt local này;
- browser: targeted run 1 đạt 197/210, targeted run 2 đạt 15/18; full final đạt **571/585** trong
  **32,2 phút** — bằng chứng thật và gate vẫn đỏ. Artifact final ở
  `verification/evidence/full-e2e-20260813-final/`; SHA-256 `.last-run.json` là
  `75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659`.

Giới hạn bằng chứng browser: `playwright-report/index.html` trong artifact final là file stale/mismatched
(`home.spec`, 15 total/11 unexpected, 2026-07-15, 10 workers) và **không** được dùng để chứng minh lượt
final. Count 571/585 và 32,2 phút lấy từ console result quan sát; danh tính/count 14 failure được neo bằng
`.last-run.json` cùng 14 `error-context.md`.

### Không bị thay đổi bởi Phase 3

Phase 3 không tự hạ acceptance criterion, không coi implementation log là nguồn ghi đè quyết định và
không tự chọn semantics nghiệp vụ mới cho M02/M07. Các khoảng trống D-65, M02, M06, M07 và M11 vẫn là
blocker; doc drift M07/M08/M09/M10/M13/M14 vẫn phải được hòa giải. Full E2E final đã chạy và **FAILED**;
571 pass không được ghép với lượt khác để bù 14 failure.

### Phân loại thay đổi module trong chính Giai đoạn 3

| Nhóm | Module | Kết quả/phạm vi |
|---|---|---|
| **Sửa enforcement nghiệp vụ/dữ liệu** | **M03, M04, M12** | M03 thêm invariant student–guardian–enrollment; M04 chặn active assignment vào năm không writable cho non-SA; M12 đưa state/duplicate/gender/commit/purge xuống DB. Đây là hardening contract, không tự đổi ý nghĩa nghiệp vụ đã chốt |
| **Sửa bảo mật hệ thống** | **Cross-module** | Thu hồi đặc quyền maintenance của `anon/authenticated` trên bảng public hiện có; không tuyên bố đã đóng D-65 hoặc residual `supabase_admin` |
| **Chỉ sửa UI sản phẩm** | **Không có module nào** | Phase 3 không che 14 lỗi reliability bằng thay đổi giao diện hoặc nới timeout. Các chỉnh sửa Playwright/seed chỉ là test/fixture, không phải UI sản phẩm |
| **Giữ nguyên runtime sản phẩm trong Phase 3** | **M01, M02, M05, M06, M07, M08, M09, M10, M11, M13, M14** | Được review/test nhưng không sửa semantics/runtime để né finding; M02/M07 chờ quyết định, M06/M11 cần thiết kế bổ sung |
| **Chưa thể hoàn thành/xác nhận** | **M01–M13** | 12 module `FAILED`, M13 `BLOCKED`; xem ma trận §3 và issue ledger |
| **Đạt có điều kiện** | **M14** | `VERIFIED_WITH_MINOR_ISSUES`; còn phụ thuộc full system browser gate và manual accessibility evidence |

## 3. Ma trận quyết định 14 module

Ma trận dưới đây đồng bộ với `02_BUSINESS_FLOW_VERIFICATION.md`. “Bằng chứng đạt” chỉ mô tả phần đã
chứng minh; trạng thái module do khoảng trống nghiêm trọng nhất quyết định.

| Module | Trạng thái cuối | Nghiệp vụ/dữ liệu đã chứng minh | UI/E2E hiện có | Chưa giải quyết / điều kiện đổi trạng thái |
|---|---|---|---|---|
| **M01 Auth & Account** | **FAILED** | Route `/admin`, role ceiling và account audit hẹp có guard | Luồng account không nằm trong 14 failure final | D-65 không đủ 12 nhóm/viewer/address/before-after; log còn username trái redaction (`P3-SEC-001`) |
| **M02 Academic Structure** | **FAILED · NEEDS_CONFIRMATION** | Close RPC có checklist, actor/time/reason; year write gate có test | Full final còn 4 failure year/class ở feedback/derived state | Hợp nhất `set_current` với canonical close; chốt child assignment/enrollment và semantics closed/archive (`P3-BIZ-001`) |
| **M03 Students & Guardians** | **FAILED** | Hai invariant đối ứng và 2 race × 12 vòng pass | Full final còn 5 failure khôi phục, bí tích và liên hệ guardian | D-65 hồ sơ/sức khỏe/bí tích/guardian; sửa reliability và full rerun phải xanh |
| **M04 Staff** | **FAILED** | Transfer nguyên tử; active assignment vào closed year bị chặn cho non-SA | Staff specs không nằm trong 14 failure final | Close-year còn giữ assignment `is_active`; unique active row có thể chặn năm mới; thiếu D-65 |
| **M05 Attendance** | **FAILED** | Lease/state/year gate và note privacy có DB evidence | Attendance không thuộc 14 failure final | D-65 bắt buộc cho mở khóa/sửa sau mở khóa chưa có |
| **M06 Teaching Plans** | **FAILED** | Permission và stale-save item đã được siết ở đường chuẩn | Happy-path coverage có, failure injection chưa có | Thiết kế outbox/compensation/reconciler cho DB–Storage và fault tests (`P3-DATA-002`) |
| **M07 Assessments** | **FAILED · NEEDS_CONFIRMATION** | Khóa/công bố tách; Top 5 history append-only; diff bảo vệ hai ô khác nhau | `results` còn 2 product UX reliability failure mobile/laptop; không chứng minh mutation sai | Cùng ô vẫn last-write-wins; triển khai CAS/conflict UI hoặc quyết định sửa AC minh thị (`P3-DATA-001`) |
| **M08 Promotions** | **FAILED** | Review/transfer nguyên tử, promotion event history và year gate | Cross-journey results thuộc M07 trong classifier final; không có failure M08 được tách riêng | Thiếu D-65; AC còn nói field `history` trong khi D-157 chọn event table (`P3-DOC-001`) |
| **M09 Committees & Equipment** | **FAILED · NEEDS_CONFIRMATION** | Race cái cuối cùng 1/1 pass; loan/return/write-off có row lock | Committees không nằm trong 14 failure final | Câu hỏi nghiệp vụ trong AC chưa được phân tách resolved/open; D-65 Ban/thiết bị chưa đủ |
| **M10 Notifications** | **FAILED** | Idempotency/retraction và inbox scope 6/6 pass | Full final còn 1 failure derived state khi người nhận tìm thông báo thu hồi | D-65 publish/retract thiếu; AC cũ trái D-165…D-168 phải cập nhật (`P3-DOC-001`) |
| **M11 Reports & Dashboard** | **FAILED** | Snapshot immutable và scoped; period label đúng | Không có E2E chứng minh live report năm cũ | Thêm authorized `academicYearId` cho live view/export/finalize năm lịch sử (`P3-BIZ-002`) và D-65 |
| **M12 Imports** | **FAILED** | DB-authoritative state machine; import gate 489/84/405/0 pass | Full final còn 2 failure feedback/navigation | D-65 commit/purge; sửa reliability và giữ regression direct-RPC/duplicate/gender/purge |
| **M13 Portal** | **BLOCKED** | Ownership/RLS và persona fixture đã được chỉnh | Portal không nằm trong 14 failure final; các failure baseline đã biến mất | Giữ verdict cho tới sign-off độc lập và full system gate xanh; duy trì one-child, empty reasons và foreign-child 404 trên cả ba viewport |
| **M14 Navigation & Shell** | **VERIFIED_WITH_MINOR_ISSUES** *(có điều kiện)* | Route map/guard server-side, focus/reduced-motion và build 29 page/route | Responsive spec không fail, nhưng full final tổng thể còn 14 failure | Full system rerun xanh; dọn AC/decision drift và hoàn tất manual a11y/contrast/screen-reader evidence |

## 4. Đánh giá theo trục hệ thống

| Trục | Kết luận | Lý do quyết định |
|---|---|---|
| Business flow | **FAILED** | M02, M07, M11 vi phạm hoặc chưa thống nhất AC/BR bắt buộc |
| Authorization/security | **NO-GO** | D-65 thiếu và sai redaction; ACL `supabase_admin`/production preflight còn residual |
| Data integrity | **NO-GO** | M02 transition, M06 split-brain, M07 lost update và audit event model còn mở |
| UI/UX | **PARTIAL / NOT FULLY TESTABLE** | Static a11y/responsive tốt hơn; timing/navigation/RSC còn failure; manual contrast/screen reader/PWA chưa có evidence đủ |
| Regression | **FAILED** | Static/DB gate xanh nhưng targeted run 2 đỏ 3/18 và full final đỏ **14/585** |
| Traceability | **FAILED** | Nhiều AC cũ chưa phản ánh decision đã chốt; implementation log từng thu hẹp D-65 sai phạm vi |
| Production readiness | **NO-GO** | Không đạt 14/14 verified, blocker chưa đóng và full same-baseline evidence đang đỏ |

## 5. Rủi ro nếu phát hành ngay

| Rủi ro | Tác động người dùng/vận hành |
|---|---|
| Không có D-65 đầy đủ | Không truy được ai đã làm thay đổi nhạy cảm; audit có thể lưu identifier bị cấm |
| Chuyển năm qua đường bypass | Năm đóng thiếu actor/reason, còn work mở hoặc child state lịch sử sai |
| Ghi đè cùng ô điểm | Mất điểm của người lưu trước mà không cảnh báo, ảnh hưởng kết quả/cổng/báo cáo |
| Storage–DB split-brain | Metadata trỏ tệp mất hoặc bucket có object rác không còn đường tham chiếu |
| Không xem live report năm cũ | Không lập/xuất/chốt được báo cáo lịch sử khi snapshot chưa tồn tại hoặc cần tái dựng |
| Timing/navigation không ổn định | Người dùng không biết thao tác đã ghi hay chưa, dễ bấm lại hoặc rời trang trong state không rõ |
| ACL rollout residual | Bảng tương lai do owner khác tạo có thể nhận privilege nền tảng không được harden |
| Residual concurrency/counter | Hai đường resume M03 có thể chọn deadlock victim; counter dry-run M12 còn có thể bị Data API làm sai dù commit invariant vẫn giữ |

## 6. Điều kiện bắt buộc để đổi sang GO

### 6.1 Đóng blocker sản phẩm

1. Cài audit model D-65 đúng actor/time/action/target/before-after/access address, append-only, SA-only,
   viewer/filter; redaction không password/login code/username/full health content; phủ đủ 12 nhóm.
2. Chỉ còn một state machine M02 cho activate/close year, khóa nguyên tử năm cũ+mới và xử lý child state
   theo quyết định được Product chốt.
3. M07 dùng expected version/value từng cell, RPC compare-and-swap và UI giữ draft/hiện conflict.
4. M06 có compensation bền vững hoặc outbox/reconciler idempotent, kèm fault injection cả bốn failure window.
5. M11 nhận năm học được authorize trong live view/export/finalize và có negative scope tests.

### 6.2 Đóng residual bảo mật và tài liệu

6. Chạy preflight trên production clone: PostgreSQL 17+, owner mọi public object, effective privilege và
   default ACL của `postgres`/`supabase_admin`; có catalog gate sau migration.
7. Hòa giải BR/AC/decision drift, đặc biệt M07 Top 5, M08 event history, M10 retraction, M09 questions và
   M13/M14 markers; traceability reviewer độc lập ký lại.
8. Quyết định và migration trạng thái assignment khi đóng năm để unique active assignment không chặn năm sau.
9. Thống nhất lock order/entry point hoặc chứng minh retry cho concurrent resume M03; chuyển counter
   staging M12 vào RPC có thẩm quyền và thêm direct-negative/two-session tests (`P3-DATA-003`).

### 6.3 Chạy lại release gate trên cùng baseline

10. Tách nguyên nhân 14 product UX reliability failure bằng DB assertion + action/URL/pending telemetry;
   targeted các nhóm đỏ phải **0 failure** và không tái xuất stale fixture/contamination/inconclusive.
11. Reset + seed lần nữa; full 23 spec × 3 viewport = **585/585 pass** trên build cuối, 1 worker, lưu
    đầy đủ artifact.
12. Chạy lại lint, typecheck, unit, build, DB reset, 55 pgTAP, 18 opt-in, import/perf/scope sau mọi fix có
    ảnh hưởng; ghi fingerprint source/migration/seed để tái lập.
13. Manual QA cho keyboard/focus, screen reader, contrast, 360/768/1366 và installed PWA; không đổi
    `NOT_TESTABLE` thành pass nếu chưa có người kiểm.

Chỉ Product owner, Security/DB reviewer và QA reviewer mới nên ký GO sau khi toàn bộ điều kiện trên có
evidence. Việc chấp thuận residual phải ghi rõ owner, lý do, thời hạn và rollback/monitoring; không dùng
nhãn “technical debt” để miễn một acceptance criterion bắt buộc.

## 7. Tuyên bố cuối

Giai đoạn 3 đã hoàn thành nhiệm vụ **phát hiện và ghi bằng chứng**: nó xác nhận nhiều cải tiến Phase 2B
là thật, đồng thời bác bỏ kết luận suy diễn rằng “xong 2B = xong Giai đoạn 2”. Tại baseline được đánh giá:

- **Verification:** hoàn tất ở mức đủ để ra quyết định;
- **Giai đoạn 2:** chưa được xác nhận hoàn tất;
- **Release:** **NO-GO**;
- **Full E2E final:** **FAILED — 571/585 pass, 14 fail, 32,2 phút; không có claim PASS**.
