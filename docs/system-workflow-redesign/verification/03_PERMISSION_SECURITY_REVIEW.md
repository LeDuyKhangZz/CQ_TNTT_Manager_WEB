# 03 — Review phân quyền và bảo mật

> Thời điểm chốt nội dung: **2026-08-13, sau gate cuối trên baseline local sạch**.  
> Phạm vi: route guard, Server Action, RLS/RPC/trigger, table/function privilege, service role, direct Data API/RPC và auditability.

## 1. Kết luận

**Security verdict: NO-GO.** Kiến trúc phòng thủ nhiều lớp nhìn chung đúng hướng, và ba migration Phase 3 đã đóng các đường bypass quan trọng. Tuy nhiên D-65 là blocker cấp hệ thống; audit hiện tại vừa thiếu phạm vi vừa vi phạm redaction. Ngoài ra hardening default ACL còn residual `supabase_admin`, và đường chuyển năm có thể bypass tiền điều kiện dù caller đã được authorize đúng.

## 2. Mô hình đe dọa và trust boundary

| Tác nhân | Khả năng giả định | Chốt chặn bắt buộc |
|---|---|---|
| Chưa đăng nhập (`anon`) | Gọi PostgREST/RPC được grant, dò ID/route | Không có DML nhạy cảm; function revoke; route public tối thiểu |
| Người dùng đăng nhập | Gọi trực tiếp table/RPC, không đi qua UI; sửa payload/ID/role | RLS/trigger/RPC tự authorize; không tin client |
| Người có quyền phạm vi | Thử đọc/ghi chéo lớp/ngành/ownership | Scope helper + RLS + negative JWT test |
| `service_role` server | Bỏ qua RLS, có CRUD rộng | `server-only`; action phải authorize trước; log và secret hygiene |
| DB owner/migration | Bỏ qua RLS, có DDL/TRUNCATE | Quy trình migration/review; append-only trigger; không dùng owner cho app traffic |
| Hai phiên đồng thời | Race check-then-write, stale save, oversell | Row lock/canonical lock order/CAS/idempotency |

Ứng dụng khai đúng hai client: client session dùng anon key + cookie và chịu RLS (`src/lib/supabase/server.ts:8-36`); admin client import `server-only`, dùng service role và tự nêu rõ bỏ qua RLS (`src/lib/supabase/admin.ts:1-23`). Đây là ranh giới đúng, nhưng hậu quả khi action admin thiếu guard là rất cao.

## 3. Kiến trúc authorization quan sát được

- Có 14 vai trò chuẩn (`src/lib/permissions/roles.ts:1-18`), tách global-write khỏi global-read (`src/lib/permissions/roles.ts:39-74`).
- Route map tập trung; `/imports` chỉ bốn vai trò global-write và `/admin` chỉ Super Admin (`src/lib/permissions/route-map.ts:47-75`).
- `requireRouteAccess` kiểm session, trạng thái account, bắt đổi mật khẩu và role route ở server (`src/lib/auth/guards.ts:22-39`).
- Route access chỉ là cửa đầu; action quan trọng tiếp tục kiểm capability và DB giữ chốt cuối. Ví dụ account action gọi `guardAccountAdmin` trước service role (`src/features/auth/server/actions.ts:59-95`); import public wrapper gọi `app.can_global_write()` trước mutation (`supabase/migrations/20260813000300_import_state_machine_guard.sql:309-381`).
- `SECURITY DEFINER` mới đặt `search_path=''` và function public bị revoke khỏi `public/anon` trước khi grant role cần thiết (`supabase/migrations/20260813000300_import_state_machine_guard.sql:212-296,309-387,398-453`; `supabase/migrations/20260813000400_student_staff_year_integrity.sql:7-31,75-113,177-214`).

## 4. Finding ledger

| ID | Mức | Kết luận | Bằng chứng | Disposition |
|---|---|---|---|---|
| **SEC-P3-01** | **CRITICAL** | D-65 full audit chưa tồn tại; không thể truy trách nhiệm cho phần lớn thao tác nhạy cảm | D-65 tối thiểu 12 nhóm (`docs/system-workflow-redesign/06_DECISION_LOG.md:131-149`); code chỉ ghi `account_audit_events` ở auth/staff | **BLOCK RELEASE** |
| **SEC-P3-02** | **HIGH** | Audit tài khoản lưu login identifier, kể cả old→new username, trái redaction | Cấm mã đăng nhập (`docs/system-workflow-redesign/06_DECISION_LOG.md:151-154`); schema có `actor_username/target_username` (`supabase/migrations/20260724000800_account_audit_events.sql:36-44`); action ghi cả hai giá trị (`src/features/auth/server/actions.ts:670-676`) | Thiết kế lại audit payload/redaction trước migration dữ liệu |
| **SEC-P3-03** | **HIGH** | ACL hiện tại đã siết bảng đang có và default ACL của owner `postgres`, nhưng default ACL platform owner `supabase_admin` còn ngoài quyền migration | Residual được ghi ngay trong migration (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:15-20`); chỉ alter default cho `postgres` (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:23-29`) | Deployment preflight + runbook/privileged platform migration |
| **SEC-P3-04** | **HIGH** | `set_current_academic_year` là definer RPC được authorize SA đúng nhưng bypass business-security precondition của close-year | RPC trực tiếp update `current→closed` (`supabase/migrations/20260725000300_academic_year_super_admin_only.sql:36-61`) trong khi close chuẩn kiểm/lock/confirm (`supabase/migrations/20260726000100_academic_year_close_archive.sql:131-198`) | Hợp nhất thành một transition |
| **SEC-P3-05** | **MEDIUM** | Account audit dùng chiến lược không nhất quán: thao tác đảo ngược được log best-effort; xóa bắt audit trước. Kết quả là log có thể thiếu event dù mutation thành công | Contract nêu rõ (`src/features/auth/server/actions.ts:98-103`); đổi username bỏ qua boolean (`src/features/auth/server/actions.ts:670-679`); xóa chặn khi audit fail (`src/features/auth/server/actions.ts:689-703`) | D-65 phải chọn và tài liệu hóa một semantics chung hoặc per-action rõ ràng |
| **SEC-P3-06** | **MEDIUM / residual** | `app.set_student_status_internal` vẫn có EXECUTE cho `authenticated`; cấu hình local không expose schema `app`, nhưng privilege rộng hơn tên “internal” gợi ý | Function được chuyển schema/đổi tên và comment xác nhận giữ EXECUTE (`supabase/migrations/20260813000400_student_staff_year_integrity.sql:115-166`); pgTAP chủ động assert grant (`supabase/tests/055_student_staff_year_integrity_test.sql:81-87`); local API chỉ expose `public`, `graphql_public` (`supabase/config.toml:12-15`) | Xác nhận exposed schemas ở production; ưu tiên wrapper definer không cần grant internal |
| **SEC-P3-07** | **POSITIVE** | Internet roles mất TRUNCATE/REFERENCES/TRIGGER/MAINTAIN trên mọi bảng public hiện có; DML đã duyệt giữ nguyên | Migration `supabase/migrations/20260813000200_public_table_privilege_hardening.sql:23-29`; catalog test `supabase/tests/053_public_table_privilege_hardening_test.sql:7-89` | Giữ test trong release gate |
| **SEC-P3-08** | **POSITIVE** | M12 không còn dựa vào Server Action cho duplicate/gender/state; direct RPC/table bypass bị chặn ở DB | Trigger + confirm wrapper + private commit body (`supabase/migrations/20260813000300_import_state_machine_guard.sql:125-203,212-393`) | Reset cuối + full pgTAP 55 file/1.442 assertion đã PASS; vẫn cần production preflight và race/failure-injection chuyên biệt |
| **SEC-P3-09** | **POSITIVE** | M03/M04 invariant ngược và closed-year assignment được bảo vệ tại DB, gồm đường Data API trực tiếp | `supabase/migrations/20260813000400_student_staff_year_integrity.sql:4-113,173-226`; negative tests `supabase/tests/055_student_staff_year_integrity_test.sql:90-251` | Giữ concurrency test hai phiên |

## 5. D-65 coverage audit

### 5.1 Contract bắt buộc

D-65 yêu cầu:

- actor, thời gian, action, target, before/after, địa chỉ truy cập (`docs/system-workflow-redesign/06_DECISION_LOG.md:148-149`);
- append-only, kể cả Super Admin không sửa/xóa (`docs/system-workflow-redesign/06_DECISION_LOG.md:151-152`);
- không password/login code/full health content (`docs/system-workflow-redesign/06_DECISION_LOG.md:153-154`);
- chỉ Super Admin đọc (`docs/system-workflow-redesign/06_DECISION_LOG.md:155`);
- semantics khi log lỗi phải được chọn và ghi rõ (`docs/system-workflow-redesign/06_DECISION_LOG.md:156-157`);
- UI Super Admin xem/lọc (`docs/system-workflow-redesign/05_REDESIGN_PRIORITY_PLAN.md:112-122`).

### 5.2 Coverage thực tế

| Nhóm D-65 | Coverage hiện có | Gap |
|---|---|---|
| Tài khoản | `account_audit_events`, append-only/SA-only | Thiếu address + before/after chuẩn; lưu username; không có viewer; best-effort làm mất event |
| Hồ sơ thiếu nhi/sức khỏe/bí tích/guardian | Metadata `updated_by/at` rời rạc | Không phải audit event; không redaction event chuẩn |
| Nhân sự/phân công | Chỉ vài action tận dụng account audit | Tạo/sửa/kết thúc assignment/trạng thái phục vụ chưa phủ đúng D-65 |
| Học vụ | `closed_by/at/reason` ở close RPC | `set_current` bypass; tạo/sinh lớp/config không vào audit chung |
| Ghi danh | Trạng thái bản ghi | Thiếu event chuẩn cho enroll/pause/resume/end |
| Điểm danh | Session/lease metadata | Thiếu event mở khóa và sửa sau mở khóa |
| Điểm số/Top 5 | Lock metadata + leaderboard history | Không phải audit actor/action/target/address toàn diện |
| Chuyển lớp | `promotion_review_events` append-only | Lịch sử domain tốt nhưng thiếu D-65 chung/address/before-after |
| Ban & thiết bị | Loan/stock events | Không phủ đổi chức vụ, xóa content, audit chuẩn báo hỏng/mất |
| Thông báo | author/published/retracted fields | Không có event chuẩn công bố/thu hồi |
| Import | cancel/purge/row mapping | Commit và xóa lô không có D-65 chuẩn; thiếu address/before-after |
| Báo cáo | immutable snapshot/generated_by | Không có D-65 event chốt báo cáo/address |

`account_audit_events` chỉ có enum action tài khoản (`supabase/migrations/20260724000800_account_audit_events.sql:32-44`). Không tìm thấy route/component Super Admin đọc/lọc audit trong `src/app`, `src/features` hoặc navigation. Vì vậy mô tả “full audit” trong comment của bảng (`supabase/migrations/20260724000800_account_audit_events.sql:77-80`) không phản ánh contract D-65.

## 6. Review ACL và privilege

### 6.1 Trạng thái sau migration 20260813000200

| Đối tượng | Trạng thái |
|---|---|
| `anon`, `authenticated` trên bảng public hiện có | Bị revoke `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN` (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:23-25`) |
| Default ACL owner `postgres` | Không cấp lại bốn privilege trên bảng mới (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:27-29`) |
| DML ứng dụng | Cố ý giữ nguyên; test canh SELECT/INSERT/UPDATE/DELETE (`supabase/tests/053_public_table_privilege_hardening_test.sql:77-89`) |
| `service_role`/owner | Vẫn là trust boundary đặc quyền; không được coi là browser role |
| Default ACL owner `supabase_admin` | **Residual**; migration ghi rõ role chạy migration không đủ quyền (`supabase/migrations/20260813000200_public_table_privilege_hardening.sql:15-20`) |

### 6.2 Điều kiện deploy

1. kiểm `server_version_num` hỗ trợ privilege `MAINTAIN` trước khi chạy (cú pháp này yêu cầu PostgreSQL 17+);
2. liệt kê owner của mọi bảng public; hiện test chỉ chứng minh bảng đang có, không chứng minh bảng tương lai do owner khác tạo;
3. nếu production có object owner `supabase_admin`, dùng cơ chế platform-authorized để sửa default ACL hoặc thêm post-migration catalog gate;
4. không mô tả “không ai có TRUNCATE”; kết luận đúng chỉ là **hai Internet role không có**. Owner/service role vẫn là trust boundary riêng.

## 7. Trace authorization theo đường tấn công

| Bề mặt | Route | Action/query | DB boundary | Kết luận |
|---|---|---|---|---|
| Quản trị account | `/admin` SA-only (`src/lib/permissions/route-map.ts:75`) | `guardAccountAdmin`, target-role check (`src/features/auth/server/actions.ts:59-95`) | service role + audit table | Quyền tốt; audit contract fail |
| Đóng năm | `/admin` SA-only | `closeAcademicYear` gọi RPC (`src/features/academic-years/server/actions.ts:242-280`) | definer lock/checklist | Đường chuẩn tốt; `set_current` là bypass khác |
| Student lifecycle | `/students` staff route | action dùng user client | invoker RPC/RLS + Phase 3 triggers | Direct table/RPC invariant được chặn |
| Staff transfer | `/staff` staff route | capability source+target | atomic RPC + year trigger | Core write boundary tốt; D-65 thiếu |
| Teaching materials | `/teaching-plan` authenticated route | explicit class permission | Storage policy + DB RLS | Không thấy IDOR mới; consistency cross-system chưa an toàn |
| Gradebook | `/results` authenticated route | capability check + RPC | definer tự check scope/lock/year | Permission tốt hơn; same-cell concurrency không phải auth fix |
| Reports | `/reports` staff-only (`src/lib/permissions/route-map.ts:67`) | `can_finalize_report`/queries | RLS + scoped RPC | Scope tốt; historical-year và audit còn thiếu |
| Imports | `/imports` global-write-only (`src/lib/permissions/route-map.ts:68-74`) | action + public wrapper | trigger/RPC authoritative | Direct client bypass đã được harden |

## 8. Test evidence as-of

- Catalog test ACL: `supabase/tests/053_public_table_privilege_hardening_test.sql` có 6 assertion, không thực thi TRUNCATE (`supabase/tests/053_public_table_privilege_hardening_test.sql:1-5`).
- Import state/security: `054` có 32 assertion, gồm private RPC denial, duplicate confirmation, gender, downgrade/delete/mapping/raw purge (`supabase/tests/054_import_state_machine_guard_test.sql:3,145-423`).
- Student/staff/year: `055` có 18 assertion direct Data API/RPC và SA exception (`supabase/tests/055_student_staff_year_integrity_test.sql:3,90-251`).
- Sau source cuối, `db:reset` đã áp toàn bộ migration tới `20260813000400` và full pgTAP **55 file /
  1.442 assertion xanh**. Đây là bằng chứng local cuối cho schema/RLS/RPC, nhưng không thay production
  preflight owner/default ACL/PG version.
- Hai-session M03 đã chạy xanh 2 test, mỗi race 12 vòng (`tests/integration/phase3-student-lifecycle-concurrency.test.ts:121-204`). Test chứng minh invariant cuối, chưa chứng minh không có deadlock availability ở mọi interleaving.
- Full E2E cuối **571/585 pass, 14 fail**; không có failure `ECONNREFUSED` và không có failure nào tự
  chứng minh một direct-permission bypass mới. Browser gate vẫn đỏ, nên security review vẫn `NO-GO`.

## 9. Điều kiện đóng security review

1. Thiết kế và migrate audit event chung đúng D-65; backfill/retention/redaction plan rõ; viewer SA-only; negative tests cho 12 nhóm.
2. Không lưu username/login code/password/full health data trong event; kiểm cả dữ liệu audit đã có.
3. Loại bypass `set_current_academic_year`.
4. Đóng residual default ACL `supabase_admin` hoặc có catalog gate được phê duyệt chứng minh không object nào bị cấp thừa.
5. Xác nhận exposed schema và thu hẹp EXECUTE của internal function nếu có thể.
6. Full DB/static/E2E chạy xanh trên một baseline tái lập được.
