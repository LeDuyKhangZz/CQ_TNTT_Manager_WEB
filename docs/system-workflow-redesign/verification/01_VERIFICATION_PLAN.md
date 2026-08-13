# 01 — Kế hoạch verification Giai đoạn 3

> Ngày kiểm định: **2026-08-12**  
> Baseline mã nguồn: `main` · `07db667` · working tree chứa toàn bộ thay đổi Giai đoạn 2B chưa commit  
> Môi trường: Windows · Node `22.20.0` · npm `10.9.3` · Next `15.5.20` · Playwright `1.61.1` · Supabase local

## 1. Mục tiêu và nguyên tắc kết luận

Giai đoạn 3 kiểm tra độc lập việc **Giai đoạn 2B đã đóng 14/14 module** có thật sự đồng nghĩa với
hoàn tất Giai đoạn 2 hay không. Kết luận dựa trên hành vi và bằng chứng, không dựa trên nhãn `XONG`
trong implementation log.

Thứ tự ưu tiên nguồn sự thật khi có mâu thuẫn:

1. Quyết định đã chốt trong `06_DECISION_LOG.md` và các quyết định D-80…D-174 trong log 2B.
2. Business rule và acceptance criterion của module.
3. To-Be flow và kế hoạch module đã duyệt.
4. Mã nguồn/migration đang chạy và bằng chứng runtime.
5. Implementation log — chỉ là sổ đã làm, không được dùng để ghi đè quyết định hoặc AC.

Một module chỉ được `VERIFIED` khi luồng chính, quyền backend, toàn vẹn dữ liệu và UI thực tế đều có
bằng chứng phù hợp. Build xanh một mình không đủ.

## 2. Phạm vi tài liệu

Inventory bắt buộc gồm **142 file** dưới `docs/system-workflow-redesign/`:

- 7 tài liệu toàn hệ thống (`00`…`06`);
- 112 tài liệu module (14 module × 8 file: discovery, As-Is, audit, To-Be, BR, UI/UX, impact, AC);
- 16 tài liệu UI redesign (`01`…`16`);
- 7 script nghiên cứu màu/contrast dùng làm bằng chứng thiết kế, không phải nguồn nghiệp vụ.

Ngoài ra đối chiếu `AGENTS.md`, `WORKLOG.md`, migration, RLS/RPC/trigger, Server Action, unit,
integration, pgTAP và Playwright hiện hành.

## 3. Các nhánh review độc lập

| Nhánh | Trách nhiệm | Đầu ra |
|---|---|---|
| Business / BA | As-Is → To-Be → BR → AC; số bước; trạng thái và lỗi | `02_BUSINESS_FLOW_VERIFICATION.md` |
| Authorization | Role, ownership, scope, RLS, RPC definer, Server Action, IDOR | `03_PERMISSION_SECURITY_REVIEW.md` |
| Data integrity | Duplicate, orphan, FK/cascade, archive/soft delete, migration, dữ liệu cũ | `04_DATA_INTEGRITY_REVIEW.md` |
| UI/UX | Navigation, hierarchy, feedback, responsive 360/768/1366, keyboard/a11y | `05_UI_UX_REVIEW.md` |
| Playwright | Happy/error/permission/cross-module journeys và evidence khi fail | `06_E2E_TEST_MATRIX.md` |
| Regression / critic | Gate toàn hệ thống; phản biện claim PASS/XONG | `07_REGRESSION_RESULTS.md` |
| Triage | Severity, reproduce, expected/actual, root cause, disposition | `08_OPEN_ISSUES.md` |
| Release assessment | Trạng thái 14 module và readiness thực tế | `09_FINAL_SYSTEM_ASSESSMENT.md` |

BA-Kit được dùng theo chuỗi **consistency → quality gate → traceability → auditor/challenger**.
Product review dùng journey/story map để kiểm tra walking skeleton từ góc nhìn người dùng, không biến
ma trận test thành danh sách feature rời. `ui-ux-pro-max` ưu tiên accessibility/touch, responsive,
feedback/loading, focus, reduced motion và z-index trước thẩm mỹ.

## 4. Ma trận quality gate

| Gate | Dữ liệu | Tiêu chí |
|---|---|---|
| Static | lint + TypeScript | 0 error; lint 0 warning |
| Unit/component | Vitest | mọi test mặc định chạy xanh; skip phải được giải trình |
| Database | reset sạch + toàn bộ pgTAP | migration áp dụng từ đầu; 100% assertion xanh |
| DB integration | M09 race, M10 inbox scope | JWT thật; positive + negative; cleanup fixture |
| Gate Phase 2 | import sổ mẫu → perf smoke → scope | dữ liệu quy mô thật; không rò chéo phạm vi |
| Build | production build | build thành công; toàn bộ route dự kiến sinh được |
| E2E | 23 spec × 3 viewport = 585 test | chạy full suite 1 worker trên local reset + seed; giữ artifact đầy đủ |
| Security catalog | effective privilege + default ACL | Internet roles không có đặc quyền vượt RLS |
| Traceability | To-Be/BR/AC ↔ implementation ↔ test | mọi AC quan trọng có evidence hoặc trạng thái thiếu rõ ràng |

## 5. Kiểm tra theo module

Mỗi module được review theo cùng một checklist:

1. Đọc đủ 8 tài liệu module và các quyết định ghi đè liên quan.
2. Lập danh sách actor, precondition, dữ liệu, bước, expected result và cleanup.
3. Đối chiếu UI caller với Server Action/RPC/RLS — không chấp nhận chỉ ẩn nút.
4. Kiểm tra happy path, error path, permission path và trạng thái rỗng.
5. Kiểm tra consumer chéo module và dữ liệu lịch sử.
6. Gắn bằng chứng static/runtime/test; không suy diễn từ một tầng sang tầng khác.
7. Gán một trong: `VERIFIED`, `VERIFIED_WITH_MINOR_ISSUES`, `FAILED`, `BLOCKED`, `NOT_TESTABLE`.

## 6. Cross-module journeys bắt buộc

| Chuỗi | Walking skeleton cần chứng minh |
|---|---|
| Account ↔ hồ sơ ↔ role | cấp tài khoản → phân vai → đăng nhập → đổi/khóa/xóa có scope và trace |
| Năm học ↔ lớp ↔ ghi danh | tạo năm → sinh lớp → xếp em → đóng/lưu trữ mà không tạo orphan |
| Phụ huynh ↔ thiếu nhi | liên kết đúng con → portal chỉ thấy con mình → không lộ dữ liệu nhạy cảm |
| Lớp ↔ GLV ↔ điểm danh | phân công → roster đúng → chốt/mở khóa → báo cáo dùng cùng dữ liệu |
| Điểm danh ↔ điểm ↔ kết quả | dữ liệu nguồn → đề xuất điểm → công bố → portal/báo cáo nhất quán |
| Chuyển lớp | đề xuất → duyệt/từ chối → ghi danh nguồn/đích nguyên tử → lịch sử còn truy được |
| Thông báo | chọn audience → xem trước → gửi/idempotency → đọc → thu hồi |
| Excel | parse → staging → xử lý trùng → commit → tải lỗi → mapping còn nguyên |
| Audit | thao tác nhạy cảm → event đã redaction → append-only → chỉ Super Admin đọc/lọc |

## 7. An toàn dữ liệu

- Chỉ dùng Supabase local `127.0.0.1`; không chạy destructive test trên production.
- Mọi lần reset/seed/import đều được ghi trong regression report.
- Test đồng thời và fixture đặc biệt phải tự cleanup hoặc nằm trong transaction rollback.
- Không chạy `TRUNCATE` để chứng minh quyền; kiểm bằng catalog read-only.
- Không ghi bí mật từ `.env.local` vào báo cáo/artifact.

## 8. Quy tắc xử lý bug

- Bug kỹ thuật nằm trong thay đổi 2B, không cần quyết định nghiệp vụ mới: sửa tối thiểu, thêm test
  hồi quy, chạy lại gate liên quan.
- Mâu thuẫn giữa nguồn sự thật hoặc cần chọn hành vi mới: không tự chọn; ghi `NEEDS_CONFIRMATION`
  hoặc `BLOCKED` cùng hai phương án và tác động.
- Hạng mục đã được quyết định nhưng bị bỏ hẳn: ghi `FAILED`; không được đổi tên thành “technical debt”
  để né tiêu chí phát hành.

## 9. Exit criteria

Chỉ kết luận sẵn sàng dùng thực tế khi đủ cả bốn điều:

1. 14/14 module có trạng thái cuối và mọi CRITICAL đã đóng hoặc được blocker chấp thuận rõ.
2. Permission/backend, data integrity, UI task flow và cross-module đều có runtime evidence.
3. Full E2E và các gate quan trọng xanh trên cùng một baseline tái lập được.
4. Không còn AC bắt buộc bị bỏ qua, quyết định đã chốt chưa triển khai, hoặc claim bảo mật sai với
   catalog/runtime.

Nếu một điều không đạt, báo cáo vẫn được coi là **verification hoàn tất**, nhưng hệ thống không được
coi là hoàn tất/phát hành.
