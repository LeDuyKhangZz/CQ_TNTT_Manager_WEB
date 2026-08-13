# 02 — Kiểm định luồng nghiệp vụ

> Thời điểm chốt nội dung: **2026-08-13, sau lượt gate cuối trên cùng baseline**.  
> Kết luận trong file này là kết luận kiểm định, không phải trạng thái triển khai. `FAILED` không có nghĩa mọi chức năng của module đều hỏng; nó có nghĩa module còn ít nhất một quyết định/AC bắt buộc chưa được chứng minh hoặc đang sai nên chưa thể gọi là hoàn tất Giai đoạn 2.

## 1. Kết luận điều hành

**Kết luận: FAILED — chưa đủ điều kiện xác nhận Giai đoạn 2 hoàn tất.**

Các nhánh nghiệp vụ chính đã tiến bộ rõ rệt, đặc biệt ở vòng đời hồ sơ–ghi danh (M03), phân công nhân sự (M04) và máy trạng thái nhập Excel (M12). Tuy nhiên năm blocker hệ thống còn mở:

1. **D-65 chưa được triển khai toàn hệ thống.** Quyết định yêu cầu khoảng 30 thao tác thuộc 12 nhóm, bản ghi có actor/thời gian/hành động/đối tượng/trước–sau/địa chỉ truy cập, append-only, chỉ Super Admin đọc và phải redaction (`docs/system-workflow-redesign/06_DECISION_LOG.md:120-157`; `docs/system-workflow-redesign/05_REDESIGN_PRIORITY_PLAN.md:108-125`). Mã hiện tại chỉ có nhật ký hẹp cho tài khoản và vài lịch sử domain.
2. **M02 có hai đường đóng năm không tương đương.** `close_academic_year` có checklist, xác nhận, actor, thời gian và lý do (`supabase/migrations/20260726000100_academic_year_close_archive.sql:129-218`), nhưng `set_current_academic_year` vẫn tự đổi năm cũ từ `current` sang `closed` mà không chạy các tiền điều kiện hay điền `closed_at/closed_by/close_reason` (`supabase/migrations/20260725000300_academic_year_super_admin_only.sql:36-66`).
3. **M07 chưa đạt AC xung đột cùng ô.** AC yêu cầu người lưu sau bị báo xung đột và không ghi đè (`docs/system-workflow-redesign/modules/M07-ASSESSMENTS/08_ACCEPTANCE_CRITERIA.md:53-75`), trong khi payload/RPC không gửi phiên bản cơ sở và `ON CONFLICT DO UPDATE` ghi đè vô điều kiện (`src/features/assessments/schemas.ts:36-45`; `supabase/migrations/20260805000200_gradebook_scope_and_year_gate.sql:338-435`).
4. **M11 chưa chọn được năm học cho báo cáo trực tiếp.** BR-M11-13 ghi đây là GAP (`docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/05_BUSINESS_RULES.md:40-41`); `buildReport` vẫn lấy duy nhất `status='current'` (`src/features/reports/server/queries.ts:177-214`). Kho snapshot cũ đã có lọc, nhưng không thay thế việc xem/chốt số liệu trực tiếp của một năm cũ.
5. **M06 có thể lệch Storage và DB.** Xóa item xóa object trước rồi mới xóa DB; gỡ/thay tệp cập nhật DB rồi xóa object nhưng bỏ qua lỗi dọn (`src/features/teaching-plans/server/actions.ts:346-363,381-453`). Happy path xanh không chứng minh được AC “không orphan” khi một trong hai hệ thống lỗi.

Full E2E cuối đã chạy trên DB reset + seed sạch, build production và 1 worker: **571/585 pass,
14 fail, 32,2 phút**. Không failure nào là `ECONNREFUSED`; artifact ở
`docs/system-workflow-redesign/verification/evidence/full-e2e-20260813-final/`. Kết quả này tốt hơn
baseline đầu có 23 failure id, nhưng browser gate vẫn đỏ nên không phải bằng chứng release. HTML
report trong thư mục sao lưu là artifact cũ không khớp; tổng số lấy từ console lúc chạy, còn danh
sách và phân loại final chỉ dựa `.last-run.json` + 14 `error-context.md` đúng lượt.

## 2. Cách đối chiếu

Thứ tự nguồn sự thật áp dụng đúng kế hoạch verification (`docs/system-workflow-redesign/verification/01_VERIFICATION_PLAN.md:12-25`):

1. quyết định đã chốt;
2. business rule và acceptance criterion;
3. To-Be/approved plan;
4. hành vi mã nguồn, migration và runtime evidence;
5. implementation log chỉ là sổ việc đã làm.

Mỗi luồng được kiểm theo chuỗi: **actor → tiền điều kiện → bước → trạng thái dữ liệu → phản hồi → hậu quả chéo module → cleanup/audit**. Một UI có nút đúng nhưng action/RPC/RLS sai vẫn là fail; một pgTAP xanh nhưng AC UI hoặc luồng chéo chưa được chạy cũng chưa đủ để verify module.

## 3. Ma trận 14 module

| Module | Trạng thái as-of | Bằng chứng đạt đáng kể | Khoảng trống chặn xác nhận |
|---|---|---|---|
| **M01 Auth & Account** | **FAILED** | Route `/admin` chỉ Super Admin; nhật ký tài khoản append-only và SA-only (`src/lib/permissions/route-map.ts:75`; `supabase/migrations/20260724000800_account_audit_events.sql:52-75`) | D-65 bị thu hẹp thành account audit; không có viewer chung, không đủ 12 nhóm, thiếu địa chỉ truy cập/trước–sau có cấu trúc; còn lưu username trong log (`src/features/auth/server/actions.ts:670-676`) |
| **M02 Academic Structure** | **FAILED · NEEDS_CONFIRMATION** | Có close checklist/RPC, retention guard, write gate và quyền SA (`supabase/migrations/20260726000100_academic_year_close_archive.sql:63-125,131-218,223-266`) | `set_current_academic_year` là đường đóng năm bỏ qua checklist/metadata; quy trình chuyển năm được duyệt trong tài liệu UI yêu cầu đóng phân công và ghi danh nguyên tử nhưng RPC hiện không làm (`docs/system-workflow-redesign/ui-redesign/15_ACADEMIC_YEAR_THEME_TRANSITION.md:105-119`) |
| **M03 Students & Guardians** | **FAILED** | Phase 3 chặn hai invariant hai chiều: active student–active guardian và temporary student–paused enrollment; wrapper resume đổi parent trước (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:4-171`) | D-65 cho tạo/sửa/lưu trữ/sức khỏe/bí tích/đổi guardian chưa có; full E2E cuối còn failure ở pause/resume, bí tích và cập nhật số điện thoại guardian. Core integrity được cải thiện nhưng browser feedback chưa ổn định |
| **M04 Staff** | **FAILED** | Transfer nguyên tử và Phase 3 chặn active assignment vào năm đóng cho non-SA (`supabase/migrations/20260724001100_transfer_class_staff.sql:49-166`; `supabase/migrations/20260813000400_student_staff_year_integrity.sql:173-226`) | Close-year không kết thúc assignment đang `is_active`; unique active-per-staff có thể chặn chuẩn bị năm sau (`supabase/migrations/20260715000400_staff_and_class_assignments.sql:52-55`). D-65 nhân sự/phân công chưa đầy đủ |
| **M05 Attendance** | **FAILED** | State/lease/year gate và note privacy có DB tests hiện hành; spec M05 không tạo failure id ở full E2E cuối | D-65 bắt buộc ghi mở khóa buổi và sửa sau mở khóa (`docs/system-workflow-redesign/06_DECISION_LOG.md:139-141`) chưa có audit toàn hệ thống |
| **M06 Teaching Plans** | **FAILED** | Quyền đọc/ghi và stale-save item đã được siết; AC module nêu rõ rollback/orphan (`docs/system-workflow-redesign/modules/M06-TEACHING-PLANS/08_ACCEPTANCE_CRITERIA.md:24-38`) | Storage–DB không có transaction/repair queue và nhiều lỗi cleanup bị bỏ qua (`src/features/teaching-plans/server/actions.ts:346-363,381-453`); vì vậy AC-08/09/11 chưa được bảo đảm ở failure path |
| **M07 Assessments** | **FAILED · NEEDS_CONFIRMATION** | Có year gate, khóa/công bố tách biệt, lịch sử Top 5 và giữ manual override | AC-03-01 cùng ô vẫn last-write-wins. AC-06-01 còn đòi “hiện lại giống hệt” (`docs/system-workflow-redesign/modules/M07-ASSESSMENTS/08_ACCEPTANCE_CRITERIA.md:139`) nhưng D-155 đã chốt cho tính lại và lưu bản cũ (`supabase/migrations/20260806000100_publication_split_and_top5_history.sql:228-242`), cần sửa nguồn AC/traceability |
| **M08 Promotions** | **FAILED** | Review/transfer nguyên tử, lịch sử quyết định append-only, year gate (`supabase/migrations/20260807000100_promotion_history_sacrament_and_gates.sql:156-230,238-625`) | D-65 chuyển lớp chưa có bản ghi chuẩn chung. AC vẫn nói trường `history` (`docs/system-workflow-redesign/modules/M08-PROMOTIONS/08_ACCEPTANCE_CRITERIA.md:116`) trong khi D-157 dùng bảng event riêng, làm traceability sai |
| **M09 Committees & Equipment** | **FAILED · NEEDS_CONFIRMATION** | Kho có row lock, return/write-off và integration race “cái cuối cùng” (`supabase/migrations/20260724000500_equipment_lifecycle.sql:119-155,185-309`; `tests/integration/m09-equipment-concurrency.test.ts:114-149`) | Tài liệu vẫn để nhiều câu hỏi nghiệp vụ mở, gồm sửa/ngưng Ban, sửa thông báo/lịch họp, phạm vi người mượn và quyền báo hỏng (`docs/system-workflow-redesign/modules/M09-COMMITTEES-EQUIPMENT/08_ACCEPTANCE_CRITERIA.md:196-210`); D-65 Ban/thiết bị chưa đủ |
| **M10 Notifications** | **FAILED** | Idempotency theo `(author, request_id)` và thu hồi mềm có reason (`supabase/migrations/20260809000100_notification_audience_and_idempotency.sql:204-318`; `supabase/migrations/20260810000100_notification_retraction.sql:23-163`) | D-65 yêu cầu công bố/thu hồi vào audit chuẩn chung nhưng hiện chỉ có metadata domain. AC module vẫn ghi “không thu hồi được/chờ Q-2” (`docs/system-workflow-redesign/modules/M10-NOTIFICATIONS/08_ACCEPTANCE_CRITERIA.md:79-93`) trái D-166/D-168 |
| **M11 Reports & Dashboard** | **FAILED** | Snapshot bất biến, kho lọc/phân trang, phạm vi Thủ quỹ hẹp; report result đã ép kỳ đúng nhãn | Không có selector năm cho live report, trái WF-15/BR-M11-13 (`docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/03_AUDIT_RESULTS.md:130`; `docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/05_BUSINESS_RULES.md:40-41`; `src/features/reports/server/queries.ts:187-214`). D-65 “chốt báo cáo” chưa có audit chuẩn |
| **M12 Imports** | **FAILED** | Phase 3 bảo vệ state/mapping, xác nhận duplicate bằng RPC, wrapper commit kiểm duplicate/gender, purge raw nguyên tử; reset + pgTAP cuối đã xanh (`supabase/migrations/20260813000300_import_state_machine_guard.sql:125-203,212-296,298-393,395-456`) | D-65 commit/xóa lô chưa đủ; full E2E cuối còn failure ở xác nhận duplicate và mở lại lô đã huỷ |
| **M13 Portal** | **BLOCKED** | Ownership/RLS, fixture riêng và các case portal không còn failure id trong full E2E cuối | Journey portal vẫn phụ thuộc dữ liệu Kết quả/Báo cáo đang có blocker M07/M11; chưa đủ bằng chứng manual accessibility/ownership toàn ma trận để nâng thành `VERIFIED` |
| **M14 Navigation & Shell** | **VERIFIED_WITH_MINOR_ISSUES** *(có điều kiện)* | Route map tập trung, guard server-side, a11y shell/unit coverage; static/build xanh (`src/lib/permissions/route-map.ts:47-97`; `src/lib/auth/guards.ts:22-39`) | Full E2E toàn hệ thống vẫn đỏ và manual screen-reader/contrast chưa có bằng chứng; các quyết định tài liệu cũ như phạm vi sign-out còn cần dọn traceability (`docs/system-workflow-redesign/modules/M14-NAVIGATION-SHELL/08_ACCEPTANCE_CRITERIA.md:86-97`) |

**Tổng hợp as-of:** 12 `FAILED`, 1 `BLOCKED`, 1 `VERIFIED_WITH_MINOR_ISSUES` có điều kiện, 0 `VERIFIED` tuyệt đối.

## 4. Cross-module journeys

| Journey | Trạng thái | Kết quả kiểm định |
|---|---|---|
| Account ↔ hồ sơ ↔ role | **FAILED** | Cấp/đổi/xóa có guard và một phần audit, nhưng D-65 không đủ và audit đang giữ login identifier bị cấm redaction |
| Năm học ↔ lớp ↔ ghi danh ↔ phân công | **FAILED** | Close RPC đúng riêng lẻ; set-current vẫn bypass. Assignment active của năm cũ không được kết thúc, trong khi unique active-per-staff ảnh hưởng năm mới |
| Guardian ↔ student ↔ portal | **BLOCKED** | DB invariant hai chiều đã được harden; portal full E2E cuối chưa xanh nên chưa chứng minh toàn journey |
| Lớp ↔ GLV ↔ điểm danh | **FAILED** | Phạm vi/write gate có bằng chứng; chuyển năm và D-65 cho phân công/mở khóa điểm danh còn thiếu |
| Điểm danh ↔ điểm ↔ kết quả ↔ báo cáo/cổng | **FAILED** | Same-cell stale save ở M07 có thể làm mất cập nhật; M11 không xem live report năm cũ; full E2E cuối còn failure ở journey Kết quả |
| Chuyển lớp | **FAILED** | Mutation/historical review đã tốt hơn, nhưng audit chuẩn D-65 thiếu và traceability AC của M08 còn trỏ sai mô hình |
| Thông báo | **FAILED** | Audience/idempotency/retraction đã có guard; thiếu D-65 và AC cũ chưa được hòa giải với D-165…D-168 |
| Excel → staging → commit → hồ sơ/ghi danh | **FAILED** | Phase 3 đã đóng nhiều đường bypass DB và DB/import gate cuối xanh; chưa thể release vì D-65 và hai failure M12 trong full E2E cuối |
| Audit | **FAILED — SYSTEM BLOCKER** | Chỉ có account audit hẹp và lịch sử domain rời rạc; không có một event model/viewer bao phủ tối thiểu D-65 |

## 5. Phân tích blocker nghiệp vụ

### 5.1 D-65 là điều kiện hệ thống, không phải “nợ riêng M01”

D-65 liệt kê rõ 12 nhóm từ tài khoản đến báo cáo (`docs/system-workflow-redesign/06_DECISION_LOG.md:131-146`), và kế hoạch đặt audit trước các đợt sau để tránh nối lại từng thao tác (`docs/system-workflow-redesign/05_REDESIGN_PRIORITY_PLAN.md:108-125`). Hiện tại:

- `account_audit_events` chỉ mô hình hóa action tài khoản, không có `target_type`, before/after có cấu trúc hay địa chỉ truy cập (`supabase/migrations/20260724000800_account_audit_events.sql:32-44`);
- code search không có route/viewer audit cho Super Admin;
- lịch sử Top 5, review chuyển lớp, stock event, retraction metadata là lịch sử nghiệp vụ riêng, không thay được record chuẩn chung;
- đổi username còn ghi cả tên cũ và mới (`src/features/auth/server/actions.ts:670-676`), trái yêu cầu không ghi mã đăng nhập (`docs/system-workflow-redesign/06_DECISION_LOG.md:151-154`).

Do đó mọi module chứa thao tác D-65 không thể được nâng thành `VERIFIED` chỉ vì happy path và RLS xanh.

### 5.2 M02: hai state transition cùng đích nhưng khác invariant

`close_academic_year` tự mô tả là đường duy nhất để chuyển có chủ ý sang `closed` (`supabase/migrations/20260726000100_academic_year_close_archive.sql:129-130`). Tuy nhiên `set_current_academic_year` vẫn thực hiện đúng transition đó ở lệnh update riêng (`supabase/migrations/20260725000300_academic_year_super_admin_only.sql:55-61`). Đường sau không:

- đếm open enrollment/unlocked gradebook/open session;
- yêu cầu nhập lại code và lý do khi force;
- ghi `closed_at`, `closed_by`, `close_reason`;
- kết thúc assignment/enrollment như quy trình transition được duyệt đề xuất (`docs/system-workflow-redesign/ui-redesign/15_ACADEMIC_YEAR_THEME_TRANSITION.md:105-119`);
- ghi D-65.

Cần chốt một hành vi duy nhất: hoặc `set_current_academic_year` gọi/nhúng đúng close transition nguyên tử, hoặc cấm đặt năm mới current khi năm cũ chưa được đóng qua RPC chuẩn.

### 5.3 M07: khác ô đã an toàn hơn, cùng ô vẫn mất dữ liệu

Client chỉ gửi ô khác baseline nên hai người sửa **hai ô khác nhau** không còn ghi đè cả roster (`src/features/assessments/score-diff.ts:15-21,80-90`). Nhưng baseline/version không đi xuống schema (`src/features/assessments/schemas.ts:36-45`), và RPC không có compare-and-swap (`supabase/migrations/20260805000200_gradebook_scope_and_year_gate.sql:338-435`). Hai người sửa cùng ô vẫn theo quy tắc “request tới sau thắng”, trái AC-03-01.

Điều kiện đóng: payload mang `expectedUpdatedAt` hoặc expected value/version từng cell; RPC lock/compare và trả danh sách conflict; UI tô đúng ô, giữ draft và báo số ô bị bỏ qua.

### 5.4 M11: kho snapshot lịch sử không phải live report lịch sử

Kho snapshot lọc theo năm là tiến bộ thật (`src/features/reports/server/queries.ts:447-515`), nhưng `buildReport` vẫn tìm năm current duy nhất (`src/features/reports/server/queries.ts:187-195`). TB-07 yêu cầu “chốt được báo cáo năm cũ và xem lại số liệu năm trước” (`docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/04_TO_BE_FLOWS.md:341-344`). Nếu năm cũ chưa có snapshot đúng phạm vi/kỳ, người dùng không thể dựng lại báo cáo.

Điều kiện đóng: thêm `academicYearId` vào filter/schema/URL/action/export; xác thực quyền và range theo năm được chọn; giữ current làm mặc định, không làm hardcode.

### 5.5 M06: cần mô hình hóa failure path qua hai hệ thống

Không có giao dịch ACID chung giữa Postgres và Storage. Vì thế thứ tự hiện tại tạo ba split-brain:

- xóa object thành công, xóa DB thất bại → metadata trỏ tệp mất;
- DB bỏ metadata thành công, xóa object thất bại → object orphan;
- thay tệp cập nhật DB thành công, dọn object cũ thất bại → orphan mà action vẫn báo success.

Điều kiện đóng tối thiểu: kiểm lỗi mọi cleanup, có trạng thái/queue dọn bù idempotent, không xóa object cũ trước khi mutation DB chắc chắn thành công, và có integration fault-injection cho từng điểm lỗi.

## 6. Drift tài liệu phải sửa trước khi tái đánh giá

| Drift | Nguồn cũ | Nguồn/hành vi hiệu lực |
|---|---|---|
| Không full audit | `docs/01-business-analysis.md:296`; `docs/system-workflow-redesign/04_SYSTEM_WIDE_FINDINGS.md:235-244` | D-65 đảo ngược hoàn toàn (`docs/system-workflow-redesign/06_DECISION_LOG.md:120-157`) |
| Top 5 hiện lại không tính | `docs/system-workflow-redesign/modules/M07-ASSESSMENTS/08_ACCEPTANCE_CRITERIA.md:139` | D-155 cho tính lại và lưu snapshot cũ (`supabase/migrations/20260806000100_publication_split_and_top5_history.sql:228-242`) |
| Promotion history là field | `docs/system-workflow-redesign/modules/M08-PROMOTIONS/08_ACCEPTANCE_CRITERIA.md:116` | D-157 dùng `promotion_review_events` append-only (`supabase/migrations/20260807000100_promotion_history_sacrament_and_gates.sql:156-230`) |
| Notification không thu hồi/chờ Q | `docs/system-workflow-redesign/modules/M10-NOTIFICATIONS/08_ACCEPTANCE_CRITERIA.md:79-93` | D-165…D-168 đã cài qua migrations 20260809/10 |
| Report Q1/Q2 còn điều kiện | `docs/system-workflow-redesign/modules/M11-REPORTS-DASHBOARD/08_ACCEPTANCE_CRITERIA.md:158-166` | D-170/D-171 đã chốt và triển khai; TB-07 năm lịch sử vẫn chưa làm |

## 7. Điều kiện tái đánh giá

Chỉ nâng trạng thái khi đồng thời:

1. triển khai D-65 đúng phạm vi, redaction, append-only, SA-only viewer và test 12 nhóm;
2. hợp nhất transition M02 và chứng minh concurrency với M03/M04;
3. M07 có optimistic concurrency cho cùng ô;
4. M06 có compensation/fault tests cho Storage–DB;
5. M11 chọn được năm học cho live report;
6. hòa giải các AC stale nêu trên;
7. chạy lại toàn bộ static/unit/build, reset + full pgTAP/integration/gate và full E2E trên **cùng baseline**.
