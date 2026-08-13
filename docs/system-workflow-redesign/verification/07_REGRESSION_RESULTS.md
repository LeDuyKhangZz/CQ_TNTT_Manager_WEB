# 07 — Kết quả regression và quality gate

> Thời điểm chốt ledger: **2026-08-13, sau full E2E final**.  
> Môi trường: Supabase local `127.0.0.1`, build production Next.js, Playwright 1 worker.  
> Quy tắc: chỉ ghi `PASS` cho lệnh đã chạy và có kết quả thật; không cộng các lượt khác baseline thành một suite xanh.

## 1. Kết luận gate

**Regression verdict: FAILED — NO-GO.** Các gate static, unit, build, database và gate dữ liệu Phase 2
đã xanh trên mã nguồn hiện tại. Targeted run 2 vẫn đỏ **3/18** và full E2E final chạy đủ **585 test**
nhưng chỉ **571 pass, 14 fail trong 32,2 phút**. Vì vậy exit criterion “full suite xanh trên cùng
baseline” không đạt.

Ngay cả sau khi full E2E được làm xanh, kết luận phát hành vẫn chỉ có thể đổi khi xử lý thêm
năm blocker độc lập với browser automation:

1. D-65 chưa có audit trail toàn hệ thống và audit tài khoản còn vi phạm redaction;
2. M02 có đường `set_current_academic_year` đóng năm bỏ qua checklist/metadata;
3. M07 vẫn last-write-wins khi hai người lưu cùng một ô điểm;
4. M11 chưa dựng live report cho năm học lịch sử;
5. M06 chưa bảo đảm hội tụ giữa Storage và DB ở failure path.

Các blocker và điều kiện retest được định danh tại `08_OPEN_ISSUES.md` lần lượt là
`P3-SEC-001`, `P3-BIZ-001`, `P3-DATA-001`, `P3-BIZ-002` và `P3-DATA-002`.

## 2. Ledger gate đã chạy

| Nhóm | Lệnh/phạm vi | Kết quả thật | Trạng thái | Giới hạn kết luận |
|---|---|---|---|---|
| Lint | `npm run lint` | 0 error, 0 warning | **PASS** | Chỉ chứng minh static lint |
| TypeScript | `npm run typecheck` | 0 type error | **PASS** | Không chứng minh runtime |
| Unit/component mặc định | `npm test` | **111 file / 1.545 test pass**; **5 file / 18 test skip** do opt-in | **PASS** | Các opt-in không được tính pass trong lượt này |
| Production build | `npm run build` | Build thành công, **29 page/route** được sinh | **PASS** | Không thay E2E hay permission test |
| Migration từ DB trống | `npm run db:reset` | Toàn bộ migration và seed nền áp dụng thành công | **PASS** | Local, không phải production-clone |
| Database regression | `npm run test:db` | **55 file / 1.442 assertion pass** | **PASS** | Bao gồm pgTAP `053`–`055` của Phase 3 |
| M03 concurrency opt-in | `M03_DB=1` · `phase3-student-lifecycle-concurrency.test.ts` | **2/2 pass**, mỗi race 12 vòng | **PASS invariant hẹp** | Finite-loop; `Promise.allSettled` không assert `{ error }` của Supabase nên chưa chứng minh không `40P01`/có retry |
| M09 concurrency opt-in | `M09_DB=1` · `m09-equipment-concurrency.test.ts` | **1/1 pass** | **PASS** | Chứng minh đúng một winner trên fixture local |
| M10 scope opt-in | `M10_DB=1` · `m10-notification-inbox-scope.test.ts` | **6/6 pass** | **PASS** | Không thay D-65 audit |
| Import gate | `GATE_PHASE2=1` · `gate-phase2-import.test.ts` | **1/1 pass**; 489 parsed, 84 source errors, 405 committed, 0 commit failure; tạo **376 student + 376 enrollment** | **PASS** | Dataset gate local; 405 gồm create/merge hợp lệ, không được diễn giải thành 405 hồ sơ mới |
| Performance smoke | `npm run perf:smoke` | Dataset đạt **930 student**; mọi truy vấn được script liệt kê đều **<100 ms** trong lượt đo này | **PASS (local smoke)** | Không phải production SLO; không suy latency UI/RSC từ DB query riêng |
| Scope gate | `GATE_PHASE2=1` · `gate-phase2-scope.test.ts` | **8/8 pass** | **PASS** | Chứng minh các case JWT/scope của gate, không chứng minh toàn bộ role matrix |
| Targeted E2E run 1 | 9 spec liên quan · 3 viewport · 1 worker | **210 chạy / 197 pass / 13 fail** | **FAIL** | Artifact: `evidence/targeted-e2e-20260813-run1/` |
| Targeted E2E run 2 | 18 test tập trung class settings/results | **18 chạy / 15 pass / 3 fail** | **FAIL** | Artifact: `evidence/targeted-e2e-20260813-run2/`; chỉ là chẩn đoán |
| Full E2E final | Reset + seed sạch, build cuối, 23 spec × 3 viewport, 1 worker | **585 chạy / 571 pass / 14 fail / 32,2 phút** | **FAIL** | Artifact: `evidence/full-e2e-20260813-final/`; không có `ECONNREFUSED` |

Giới hạn integrity của artifact final: **không dùng** `playwright-report/index.html` làm chứng cứ cho lượt
này vì file đó stale/mismatched (`home.spec`, 15 total/11 unexpected, 2026-07-15, 10 workers). Số
571/585 và 32,2 phút là console result đã quan sát; count/danh tính 14 failure được kiểm độc lập từ
`.last-run.json` và 14 thư mục `error-context.md`.

Năm file opt-in và 18 test bị skip trong lượt Vitest mặc định không bị bỏ quên: chúng được chạy bằng
các gate tách biệt ở trên, với tổng **2 + 1 + 6 + 1 + 8 = 18** test. Kết quả vẫn được giữ theo từng
lượt vì chúng dùng biến môi trường và state DB khác nhau; không giả tạo một con số aggregate duy nhất.

## 3. Chuỗi baseline dữ liệu

Chuỗi DB cuối được chạy theo trật tự có chủ ý:

1. reset từ DB trống;
2. pgTAP toàn bộ 55 file;
3. seed dev và các integration opt-in M03/M09/M10;
4. import gate tạo dataset thực tế;
5. perf smoke nâng dataset lên 930 student;
6. scope gate chạy bằng JWT thật.

Kết quả cuối của chuỗi này là **DB gate xanh**, nhưng DB đã bị import/perf mutation nên không được dùng
nguyên trạng làm fixture E2E. Targeted E2E dùng lượt reset + seed riêng; full E2E final sau đó cũng dùng
baseline reset + seed riêng để tránh contamination từ targeted.

## 4. Phân tích các lượt E2E

### 4.1 Số liệu và artifact

- Phạm vi: `class-settings`, `committees`, `enrollment-lifecycle`, `imports`, `portal`, `results`,
  `staff-directory`, `student-lifecycle`, `students-directory`.
- Ba project: `mobile-360`, `tablet-768`, `laptop-1366`; 1 worker.
- Kết quả: **197 pass, 13 fail, tổng 210**.
- Bằng chứng máy đọc: `evidence/targeted-e2e-20260813-run1/test-results/.last-run.json` liệt kê đúng 13
  test id thất bại; error context nằm cùng thư mục artifact. Dòng này chỉ mô tả **run 1**, không hợp thức
  hóa HTML report stale trong artifact full final.

### 4.2 Không được đọc 13 failure như 13 product regression độc lập

Ba failure `class-settings` đến từ assertion dùng sai enum trạng thái lớp: nhãn UI “Tạm ngưng” ánh xạ
về `class_status='inactive'`, không phải enum trạng thái ghi danh. Với database dùng chung, state/cleanup
của nhóm này còn tạo failure dây chuyền `CLASS_NOT_ACTIVE` khi fixture `results` cần phân công đại diện
vào lớp đó. Đây là lỗi test/fixture và contamination có quan hệ nhân quả, không phải bằng chứng rằng
RPC phân công tự nhiên hỏng trên một lớp active sạch.

Phần failure còn lại vẫn là tín hiệu phải giữ mở, gồm:

- thao tác/feedback không về trong cửa sổ chờ ở enrollment, import và student lifecycle;
- navigation hoặc derived state/RSC refresh chưa ổn định ở portal/results;
- locator/assertion và cleanup của class milestone/fixture còn phụ thuộc state dùng chung;
- ít nhất một case `results` bị cascade từ lớp không active như nêu trên.

Việc đã nhận diện lỗi test không làm gate xanh. Sau khi sửa enum và đảm bảo cleanup trong `finally`, cần
chạy lại targeted trên reset + seed sạch. Các case timing phải xác nhận cả DB state lẫn feedback/URL;
chỉ tăng timeout không đủ để kết luận sản phẩm đúng.

### 4.3 So với full baseline đầu tiên

| Lượt | Kết quả | Cách dùng |
|---|---|---|
| Full baseline 2026-08-12 | **585 chạy / 23 fail** | Bằng chứng gate đỏ ban đầu; artifact `evidence/full-e2e-20260812/` |
| Targeted khi Docker/Supabase đã dừng | `ECONNREFUSED` | **INVALID_INFRA**, loại khỏi đánh giá sản phẩm |
| Targeted run 1 2026-08-13 | **210 chạy / 13 fail** | Bằng chứng patch đã giảm một số failure nhưng gate vẫn đỏ |
| Targeted run 2 2026-08-13 | **18 chạy / 15 pass / 3 fail** | Chẩn đoán class settings/results; artifact run 2 |
| Full final 2026-08-13 | **585 chạy / 571 pass / 14 fail / 32,2 phút** | Kết quả quyết định: **FAIL**; artifact `evidence/full-e2e-20260813-final/` |

Không cộng tỷ lệ giữa các lượt để tuyên bố một suite xanh: targeted khác phạm vi và full final mới là
lượt quyết định. `.last-run.json` của final có SHA-256
`75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659` và liệt kê đúng 14 test id.

### 4.4 Phân loại 14 failure final

- **14/14 ca** là `PRODUCT_UX_RELIABILITY`: hành trình không hội tụ tới feedback, navigation hoặc derived
  state đã hứa. Phân loại final có **0 `TEST_SYNCHRONIZATION` và 0 `INCONCLUSIVE/CASCADE`**.
- Không ca nào chứng minh trực tiếp mutation nghiệp vụ sai; đây là ranh giới giữa lỗi độ tin cậy UI và
  claim sai dữ liệu, không phải lý do hạ severity hay bỏ qua gate.
- Phân bố: **mobile 2 · tablet 4 · laptop 8**. Danh sách thư mục và expected/actual nằm tại
  `06_E2E_TEST_MATRIX.md`.

## 5. Phản biện các claim dễ sai

| Claim | Kết luận critic |
|---|---|
| “Lint, typecheck, build đều xanh nên có thể release” | **Sai** — static gate không đo business invariant, D-65 hay browser journey |
| “1.442 pgTAP xanh nghĩa là 14 module đúng” | **Sai** — pgTAP hiện hành không có AC same-cell M07, Storage fault M06 hay live historical report M11 |
| “Import 0 commit failure nghĩa là toàn bộ dữ liệu đúng” | **Sai** — 84 source error bị loại đúng thiết kế; gate chỉ chứng minh dataset và contract được test |
| “Perf dưới 100 ms nghĩa là UI không timeout” | **Sai** — DB query local không bao gồm Server Action, RSC refresh, render và navigation |
| “Failure final chủ yếu do test nên có thể bỏ qua” | **Sai** — phân loại final chốt 14/14 product UX reliability, 0 test synchronization |
| “571/585 là đủ để release” | **Sai** — release gate yêu cầu full suite xanh; 14 failure không được bù bằng số pass |
| “Full final xanh sẽ tự động đổi verdict thành GO” | **Sai** — năm blocker D-65/M02/M07/M11/M06 độc lập với full suite hiện có |

## 6. Gate còn thiếu để tái đánh giá

1. Đối chiếu DB state, action response, URL và pending state cho 14 failure final; sửa độ tin cậy sản phẩm,
   không chỉ tăng timeout.
2. Bảo đảm mọi mutation E2E cleanup được kể cả khi assertion giữa luồng fail; targeted các nhóm đỏ phải
   về 0 failure trên reset + seed.
3. Reset + seed lần nữa; chạy full **585 test**, 1 worker, build cuối và yêu cầu 585/585 pass; lưu
   `.last-run.json`, console log, trace/screenshot/error context; chỉ dẫn HTML report sau khi xác minh
   metadata khớp lượt chạy.
4. Đóng các issue release-blocking trong `08_OPEN_ISSUES.md`, thêm test đúng failure path và chạy lại gate
   liên quan.
5. Chạy production-clone preflight cho PostgreSQL version, object owner và default ACL trước deploy.

Với bằng chứng final hiện tại, dòng release gate duy nhất hợp lệ là **FAILED / NO-GO**.
