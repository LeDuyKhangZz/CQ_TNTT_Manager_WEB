# 04 — Review toàn vẹn dữ liệu

> Thời điểm chốt nội dung: **2026-08-13, sau lượt reset/gate cuối trên baseline local sạch**.  
> Không dùng “build xanh” để suy ra dữ liệu đúng; kết luận dựa trên constraint/trigger/RPC, lock, migration preflight và test có state thật.

## 1. Kết luận

**Data integrity verdict: NO-GO.** Phase 3 đã sửa đúng ba vùng rủi ro cao:

- thu hồi đặc quyền maintenance của Internet roles;
- biến import staging/commit/purge thành state machine có thẩm quyền ở DB;
- đóng invariant hai chiều student–guardian–enrollment và assignment–academic year.

Tuy vậy bốn lỗi toàn vẹn còn chặn release: transition năm học có đường bypass; M06 có split-brain Storage/DB; M07 cùng ô last-write-wins; D-65 không có event model toàn hệ thống. M11 live reporting chỉ neo current year cũng làm dữ liệu lịch sử không thể tái dựng qua UI chuẩn.

## 2. Ma trận invariant

| ID | Invariant | Enforcement hiện tại | Kết luận |
|---|---|---|---|
| **DI-01** | Chỉ một academic year `current` | Lock toàn bảng + unique partial index/`set_current` | **PASS hẹp**, nhưng transition cũ→closed bypass metadata/checklist |
| **DI-02** | Close year phải có tiền kiểm/actor/time/reason | `close_academic_year` lock row, đếm work, confirm code (`supabase/migrations/20260726000100_academic_year_close_archive.sql:131-209`) | **FAIL hệ thống** vì `set_current_academic_year` có đường update khác (`supabase/migrations/20260725000300_academic_year_super_admin_only.sql:47-61`) |
| **DI-03** | Active student không gắn inactive guardian | Trigger lock guardian `FOR SHARE` (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:4-37`) | **PASS trên baseline local cuối**; có preflight legacy, pgTAP và race test |
| **DI-04** | Temporary student không có active enrollment, và active enrollment đòi active student | Hai trigger đối ứng + student row mutex + wrapper resume (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:39-171`) | **PASS invariant trên baseline local cuối**; còn residual deadlock availability ở hai lock order resume |
| **DI-05** | Active staff assignment chỉ vào writable year, trừ SA | Trigger lock academic year `FOR SHARE` (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:173-226`) | **PASS cho write mới**, nhưng close year giữ assignment cũ `is_active=true` |
| **DI-06** | Một staff chỉ có một active class assignment | Unique partial index (`supabase/migrations/20260715000400_staff_and_class_assignments.sql:52-55`) | **RISK**: assignment năm cũ còn active có thể chặn chuẩn bị/kích hoạt năm mới |
| **DI-07** | Import committed state/mapping không bị downgrade/forged/delete | Batch/row triggers + delete policy false (`supabase/migrations/20260813000300_import_state_machine_guard.sql:42-203`) | **PASS trên reset + pgTAP cuối** |
| **DI-08** | Duplicate import phải được người dùng xác nhận; create phải có gender | Dedicated confirm RPC + public commit wrapper (`supabase/migrations/20260813000300_import_state_machine_guard.sql:212-393`) | **PASS trên reset + pgTAP/import gate cuối** |
| **DI-09** | Raw import purge và marker cùng transaction | `purge_import_raw_data`, lock child→parent, update row+batch (`supabase/migrations/20260813000300_import_state_machine_guard.sql:395-456`) | **PASS trên baseline local cuối**; chưa có race/failure-injection bốn chiều chuyên biệt |
| **DI-10** | Hai người sửa hai score cell khác nhau không ghi đè cả roster | Client chỉ gửi diff (`src/features/assessments/score-diff.ts:80-90`) | **PASS logic hẹp** |
| **DI-11** | Hai người sửa cùng một score cell không mất dữ liệu | Không version/baseline ở payload; upsert unconditional (`src/features/assessments/schemas.ts:36-45`; `supabase/migrations/20260805000200_gradebook_scope_and_year_gate.sql:338-435`) | **FAIL** |
| **DI-12** | Teaching material không orphan/broken reference | Compensation thủ công trong Server Action | **FAIL failure-path**; nhiều cleanup error bị bỏ qua |
| **DI-13** | Equipment stock không âm khi hai người mượn cái cuối | Row lock item + quantity check (`supabase/migrations/20260724000500_equipment_lifecycle.sql:119-155`) | **PASS trên integration cuối**; hai session có đúng một winner (`tests/integration/m09-equipment-concurrency.test.ts:114-149`) |
| **DI-14** | Notification retry không tạo bản trùng | Unique partial `(author_profile_id, request_id)` + RPC idempotent (`supabase/migrations/20260809000100_notification_audience_and_idempotency.sql:204-318`) | **PASS trên DB/integration local cuối** |
| **DI-15** | Report snapshot bất biến | Chỉ grant select/insert; server seal checksum/generated actor (`supabase/migrations/20260723000500_dashboard_and_reports.sql:202-262`) | **PASS snapshot**, nhưng live historical report **FAIL** |
| **DI-16** | Audit event nhạy cảm append-only, đủ trước/sau và redaction | Chỉ account table hẹp + domain histories | **FAIL hệ thống** |

## 3. Review chi tiết migration Phase 3

### 3.1 `20260813000200_public_table_privilege_hardening.sql`

**Tác dụng đúng:** revoke `TRUNCATE/REFERENCES/TRIGGER/MAINTAIN` trên toàn bộ bảng public khỏi `anon/authenticated` và khỏi default ACL owner `postgres` (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:23-29`). pgTAP đọc catalog thay vì chạy destructive command (`supabase/tests/053_public_table_privilege_hardening_test.sql:1-5,7-75`).

**Residual:** default ACL `supabase_admin` không sửa được bởi migration role, đã được ghi rõ (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:15-20`). Đây là rollout caveat: bảng tương lai do owner khác tạo có thể không kế thừa hardening. `service_role` và owner vẫn là trust boundary có đặc quyền; báo cáo không được diễn giải thành “không role nào truncate được”. Migration dùng privilege `MAINTAIN`, nên production phải preflight PostgreSQL 17+.

### 3.2 `20260813000300_import_state_machine_guard.sql`

**Tác dụng đúng:** 

- batch mới bắt buộc `dry_run`, counters/actor/time sạch (`supabase/migrations/20260813000300_import_state_machine_guard.sql:7-23`);
- authenticated không hard-delete batch/row (`supabase/migrations/20260813000300_import_state_machine_guard.sql:42-56`);
- direct update không đổi status/mapping/commit fields (`supabase/migrations/20260813000300_import_state_machine_guard.sql:58-203`);
- clear `duplicate_pending` chỉ qua RPC có lock và validation (`supabase/migrations/20260813000300_import_state_machine_guard.sql:212-296`);
- unchecked commit body chuyển vào `app` và revoke khỏi application roles; public wrapper lock rows, kiểm warning JSON, duplicate và gender trước gọi internal (`supabase/migrations/20260813000300_import_state_machine_guard.sql:298-393`);
- purge raw lock rows theo `row_number` rồi parent batch, và ghi row+marker trong một transaction (`supabase/migrations/20260813000300_import_state_machine_guard.sql:395-456`).

**Migration/data caveat:** không backfill state cũ. Dòng cũ có `warnings_json` sai hình dạng sẽ bị wrapper từ chối thay vì bị commit im lặng — an toàn nhưng cần báo cáo pre-deploy. Lock order child→parent đã qua reset + pgTAP cuối; race chuyên biệt giữa review/commit/cancel/purge vẫn chưa có bằng chứng hai-session.

### 3.3 `20260813000400_student_staff_year_integrity.sql`

**Tác dụng đúng:**

- reverse guardian invariant lấy guardian row lock (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:16-28`);
- direct temporary status bị chặn nếu còn active enrollment (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:49-60`);
- insert/reactivate enrollment lock student row và đòi active (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:75-105`);
- resume wrapper đặt student active trước khi internal RPC reactivate enrollment (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:115-171`);
- active assignment lock year và chặn non-SA khi closed/archived (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:173-226`);
- final preflight dừng rollout nếu legacy data đã vi phạm hai invariant chính (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:228-256`).

**Residual:** preflight cố ý không coi active assignment trong closed year là lỗi (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:228-233`). Close year cũng không kết thúc assignment. Vì unique index đòi một active assignment/staff (`supabase/migrations/20260715000400_staff_and_class_assignments.sql:52-55`), một dòng lịch sử vẫn mang `is_active=true` không chỉ là nhãn sai: nó có thể chặn assignment cho năm mới. Cần một quyết định/migration transition rõ trước release.

**Residual concurrency:** wrapper `set_student_status(..., 'active')` khóa student trước rồi có thể cập
nhật enrollment, trong khi đường resume trực tiếp cập nhật enrollment rồi trigger khóa student. Hai
phiên resume cùng student có thể tạo chu kỳ lock và một giao dịch bị PostgreSQL hủy với `40P01`.
Invariant vẫn được giữ, nhưng availability/retry chưa được chứng minh. Bài integration hiện dùng
Supabase client, nơi một response `{ error }` vẫn có thể là Promise fulfilled; vì vậy kết quả xanh
không được diễn giải thành “không thể deadlock”.

## 4. Các finding chặn release

### DATA-P3-01 — Academic-year transition không có một state machine duy nhất — CRITICAL

Hai RPC cùng tạo trạng thái `closed` nhưng chỉ một RPC ghi evidence đóng năm. Comment schema thậm chí thừa nhận `closed_at` null với năm bị đóng qua `set_current` (`supabase/migrations/20260726000100_academic_year_close_archive.sql:52-54`). Hậu quả:

- năm có open work vẫn có thể bị đóng khi kích hoạt năm mới;
- mất actor/time/reason;
- assignment/enrollment cũ có thể còn open;
- D-65 và báo cáo hậu kiểm không thể tái dựng sự kiện.

Fix phải nguyên tử: lock năm cũ+mới; chạy close precondition; kết thúc hoặc chuyển đúng các child state đã chốt; đổi current; ghi audit. Không vá bằng việc ẩn nút.

### DATA-P3-02 — Storage/DB split-brain ở M06 — HIGH

Các failure window quan sát trực tiếp:

| Operation | Thứ tự hiện tại | State xấu có thể xảy ra |
|---|---|---|
| Xóa item có tệp | remove object → delete DB (`src/features/teaching-plans/server/actions.ts:351-363`) | DB delete fail: row còn nhưng object mất |
| Upload thay tệp | upload new → update DB → remove old (`src/features/teaching-plans/server/actions.ts:393-421`) | remove old fail bị bỏ qua: orphan old object |
| Gỡ tệp | null DB metadata → remove object (`src/features/teaching-plans/server/actions.ts:429-453`) | remove fail bị bỏ qua: orphan object |
| Rollback upload | update DB fail → remove new (`src/features/teaching-plans/server/actions.ts:405-417`) | cleanup fail bị bỏ qua: orphan new object |

AC-08/09/11 đòi không orphan/rollback (`docs/system-workflow-redesign/modules/M06-TEACHING-PLANS/08_ACCEPTANCE_CRITERIA.md:31-35`). E2E hiện chỉ chứng minh happy path list rỗng (`tests/e2e/teaching-plan.spec.ts:195-238`), không inject lỗi một nửa.

### DATA-P3-03 — Same-cell stale write ở M07 — HIGH

Client diff giải quyết “hai người sửa hai ô khác nhau”, nhưng không giải quyết “hai người sửa cùng ô”. `assessmentScoreInputSchema` chỉ có enrollment/score/note (`src/features/assessments/schemas.ts:36-45`); RPC không nhận expected version và upsert ghi đè score/note (`supabase/migrations/20260805000200_gradebook_scope_and_year_gate.sql:398-431`). Đây là vi phạm trực tiếp AC-03-01 (`docs/system-workflow-redesign/modules/M07-ASSESSMENTS/08_ACCEPTANCE_CRITERIA.md:55-60`).

Fix phù hợp: version hoặc expected `updated_at`/expected value từng cell; lock/compare tại RPC; trả `{saved, conflicts[]}`; không chỉ kiểm ở client.

### DATA-P3-04 — M11 không tái dựng live report năm cũ — HIGH

Snapshot đã chốt giữ lịch sử đúng, nhưng nguồn live report chỉ lấy year current (`src/features/reports/server/queries.ts:187-195`). BR-M11-13 đòi selector năm (`docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/05_BUSINESS_RULES.md:40-41`). Khi snapshot thiếu hoặc cần báo cáo mới trên dữ liệu cũ, không có đường chuẩn để dựng lại.

### DATA-P3-05 — D-65 event model chưa đủ — CRITICAL/SYSTEM

`account_audit_events` có append-only trigger tốt (`supabase/migrations/20260724000800_account_audit_events.sql:52-65`) nhưng chỉ có action tài khoản và text detail (`supabase/migrations/20260724000800_account_audit_events.sql:32-44`). Không đủ target type/before/after/address, không phủ 12 nhóm, và lưu login identifier. Các bảng `promotion_review_events`, `leaderboard_snapshots`, equipment events và report snapshots là lịch sử domain có giá trị, nhưng schema/quyền/retention khác nhau; không thể truy vấn như một audit trail thống nhất.

## 5. Duplicate, orphan, archive và lịch sử

| Chủ đề | Kết quả |
|---|---|
| Student duplicate | Chủ ý cảnh báo mềm; M12 duplicate phải xác nhận. Không có bằng chứng quét production dataset, nên không tuyên bố “0 duplicate” |
| Enrollment duplicate/open | Constraint/RPC và Phase 3 reciprocal student guard tăng độ an toàn; cần giữ race tests |
| Staff active assignment | Unique index ngăn hai active assignment, nhưng active historical row sau close-year là semantic conflict cần xử lý |
| Import mapping | Hard delete authenticated bị vô hiệu; commit mappings protected; raw purge giữ trace — tích cực |
| Teaching-material object | **Orphan/broken reference risk còn mở** |
| Top 5 history | Append-only snapshot trước khi recompute — tích cực (`supabase/migrations/20260806000100_publication_split_and_top5_history.sql:228-299,389-446`) |
| Promotion history | Append-only event table — tích cực (`supabase/migrations/20260807000100_promotion_history_sacrament_and_gates.sql:156-230`) |
| Report snapshot | Immutable/checksum — tích cực; live history gap vẫn mở |
| Notification | Soft retract + idempotency — tích cực; chưa thay audit D-65 |

## 6. Concurrency review

### Đã có bằng chứng tốt

- M09 “mượn cái cuối cùng”: item row lock và integration hai client, đúng một request thành công (`tests/integration/m09-equipment-concurrency.test.ts:114-149`).
- M03 race temporary student ↔ active enrollment và inactive guardian ↔ active student: 2 test, mỗi test 12 vòng (`tests/integration/phase3-student-lifecycle-concurrency.test.ts:121-204`).
- M12 canonical child→parent lock order đã được ghi trong confirm/commit/purge (`supabase/migrations/20260813000300_import_state_machine_guard.sql:230-245,331-339,412-424`).

### Còn thiếu

- race `set_current_academic_year` ↔ `close_academic_year` ↔ tạo assignment/enrollment;
- race M04 close year ↔ assignment mới và hậu trạng thái `is_active`;
- race M07 cùng score cell với expected-version assertion;
- fault injection M06 giữa Storage và DB;
- M12 bốn-way review/commit/cancel/purge bằng hai session/failure injection;
- M03 concurrent resume qua hai API path, có assertion rõ không `40P01` hoặc có retry được kiểm thử.

Finite-loop tests là evidence hữu ích, không phải chứng minh hình thức mọi interleaving. Release gate phải chạy lại trên DB reset sạch.

## 7. Runtime evidence as-of

| Gate | Kết quả cuối đã quan sát | Hạn chế |
|---|---|---|
| Reset DB + full pgTAP | **PASS tới migration `20260813000400`; 55 file / 1.442 assertion pass** | Local PG17.6; production cần preflight owner/default ACL/version |
| M03 concurrency opt-in | **2/2 pass**, 12 vòng/race | Chứng minh invariant, chưa chứng minh không deadlock như residual trên |
| M09 concurrency opt-in | **1/1 pass** | Fixture local; không thay full suite |
| M10 inbox scope opt-in | **6/6 pass** | Scope query tốt; không liên quan D-65 |
| Import gate | **489 parsed; 84 source errors; 405 committed; 376 students + 376 enrollments; 0 commit failure** | Dataset local; không đại diện production |
| Scope gate | **8/8 pass** | Chứng minh phạm vi gate đã chọn, không thay audit toàn hệ thống |
| Perf smoke | **PASS trên 930 students/enrollments; mọi query đo được <100 ms** | Local fixture, không phải production SLO |
| Full E2E | **571/585 pass; 14 fail; 32,2 phút** | Không `ECONNREFUSED`; browser gate vẫn FAILED; HTML report sao lưu bị stale, nên dùng console count + `.last-run.json`/14 error-context |

Các số trên là ledger local cuối của phiên kiểm định. Chúng không ghi đè blocker dữ liệu và không
phải bằng chứng production cho tới khi production preflight cùng các exit criterion bên dưới đạt.

## 8. Migration rollout checklist

1. Chạy read-only preflight trên production clone: server version, object owners, default ACL, hai legacy invariant của `130004`, malformed import warnings/state.
2. Xác nhận migration `130002` không fail vì `MAINTAIN`/version và không để owner ngoài danh sách.
3. Chạy `db:reset` từ DB trống; không chỉ apply incremental.
4. Chạy full pgTAP 55 file và lưu output sau source cuối.
5. Chạy M03/M09/M10 opt-in, import/scope/perf gate theo đúng thứ tự và seed được ghi nhận.
6. Reset + seed lại trước E2E để mutation của import/perf không làm bẩn fixture.
7. Không deploy trước khi DATA-P3-01/02/03/05 đóng; DATA-P3-04 phải có quyết định release rõ.

## 9. Exit criteria

- Một transition duy nhất cho year close/activate, có child-state và audit nguyên tử.
- M06 có compensation/reconciliation và fault tests.
- M07 có DB compare-and-swap cho cùng ô.
- M11 live report nhận academic year được authorize.
- D-65 có schema/event/viewer/test toàn hệ thống và redaction đúng.
- ACL residual được đóng hoặc có catalog gate được phê duyệt.
- Tất cả test/gate cuối xanh trên cùng commit + migration + seed baseline.
