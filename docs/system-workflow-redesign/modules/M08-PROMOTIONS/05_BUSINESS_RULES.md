# M08-PROMOTIONS — 05. Quy tắc nghiệp vụ

| Mã | Phát biểu | Nơi enforce | `file:line` | Mâu thuẫn với docs? |
|---|---|---|---|---|
| BR-M08-01 | Mỗi ghi danh có tối đa **một** đề xuất chuyển lớp | DB (unique) | `20260722000700_promotions.sql:5` | Không (`docs/02` §10) |
| BR-M08-02 | Chỉ **GLV đại diện lớp** (hoặc global-write) được tạo/sửa đề xuất | RPC + App | `…promotions.sql:43-51, 153-155`; `permissions.ts:8-29`; `actions.ts:40` | Không (`docs/05:200`) |
| BR-M08-03 | Chỉ **Trưởng/Phó ngành đúng ngành** (hoặc global-write) được duyệt/từ chối | RPC + App | `…promotions.sql:53-72, 251-253`; `permissions.ts:31-39`; `actions.ts:68` | Không (`docs/05:201`) |
| BR-M08-04 | Chỉ đề xuất được cho ghi danh đang `active` hoặc `paused` | RPC | `…promotions.sql:150-152`, `274-276` | Không |
| BR-M08-05 | Lớp đích khi **lên lớp** phải thuộc `next_grade_level_id` của cấp nguồn | DB helper | `…promotions.sql:112-116` | Không (`docs/02` §10) |
| BR-M08-06 | Lớp đích khi **học lại** phải cùng `grade_level_id` với lớp nguồn | DB helper | `…promotions.sql:117-121` | Không |
| BR-M08-07 | Lớp đích phải thuộc **năm học bắt đầu sau** năm nguồn và `status='active'` | DB helper | `…promotions.sql:110-121` | Không |
| BR-M08-08 | Được **đổi nhánh A/B** trong cùng cấp | Hệ quả BR-05/06 (không ràng buộc `section_code`) | test `019:76, 88` | Không (`docs/03` "Cho phép đổi A/B") |
| BR-M08-09 | **Tạm nghỉ / Rút học** không có lớp đích và không được là đề xuất Dự trưởng | CHECK + RPC | `…promotions.sql:33, 103-104` | Không |
| BR-M08-10 | Đề xuất **Dự trưởng** chỉ ở cấp có `can_propose_trainee`, `target null`, status phải là `recommended_promote` | RPC + CHECK | `…promotions.sql:160-170, 29-32` | Không (`docs/02` §10) |
| BR-M08-11 | Duyệt Dự trưởng: hệ thống **tự chọn** lớp `class_kind='trainee'` active của năm sau, sớm nhất | RPC | `…promotions.sql:279-287` | Không |
| BR-M08-12 | Chuyển Dự trưởng **không** tạo `role_assignments`/tài khoản | Không có code tạo role trong RPC | `…promotions.sql:316-337`; test `019:112` | Không (`docs/03` WF-11) |
| BR-M08-13 | Duyệt là **nguyên tử**: đóng ghi danh cũ + tạo ghi danh mới + cập nhật review trong một giao dịch có row lock | RPC | `…promotions.sql:246-337` | Không (`docs/11` §10) |
| BR-M08-14 | Duyệt lại một review **đã approved** là **idempotent**, trả `created_enrollment_id` cũ | RPC | `…promotions.sql:257-259`; test `019:90-91` | Không |
| BR-M08-15 | Từ chối/duyệt một review **không còn `pending`** → `CONFLICT` | RPC | `…promotions.sql:260-262` | Không |
| BR-M08-16 | Review bị **từ chối** được gửi lại trên cùng `source_enrollment_id`, quay về `pending` | RPC upsert | `…promotions.sql:207-221` | Không (`docs/03` WF-11) |
| BR-M08-17 | Trạng thái ghi danh nguồn sau duyệt: `paused` (tạm nghỉ), `repeating` (học lại), `withdrawn` (rút học), `completed` (lên lớp/Dự trưởng) | RPC | `…promotions.sql:300-314` | Không |
| BR-M08-18 | `ended_on` của ghi danh nguồn = `end_date` của năm học nguồn (trừ tạm nghỉ giữ `null`) | RPC | `…promotions.sql:277, 302, 311` | Không |
| BR-M08-19 | Ghi danh mới nối về ghi danh cũ qua `previous_enrollment_id`, `enrolled_on = start_date` năm đích | RPC | `…promotions.sql:322-328` | Không |
| BR-M08-20 | **Cảnh báo (điểm/chuyên cần) không hard-block** việc duyệt | Không có kiểm tra warning trong nhánh duyệt | `…promotions.sql:294-337`; test `019:86` | Không (`docs/03` WF-11) |
| BR-M08-21 | Snapshot cảnh báo được chốt **tại thời điểm đề xuất**, không tính lại khi duyệt | RPC | `…promotions.sql:181-194` | Không |
| BR-M08-22 | Workflow chuyển lớp **không hiển thị** trên trang chi tiết thiếu nhi | UI (không có tab) | `src/app/(dashboard)/students/[studentId]/page.tsx:68-72` | Không (`docs/06:247`) |
| BR-M08-23 | `treasurer` không được vào `/promotions` | route-map | `src/lib/permissions/route-map.ts:41` | Không (`docs/05:42`) |
| BR-M08-24 | Bảng `promotion_reviews` chỉ được ghi qua RPC; `authenticated` chỉ có `select` | GRANT + RLS | `…promotions.sql:342, 349-355` | Không (`docs/11` §10) |
| BR-M08-25 | Mỗi em chỉ một ghi danh **mở** trong một năm học → không thể lên hai lớp | Partial unique index | `20260716000500_enrollments.sql:24-26` | Không (D-11) |

## Quy tắc trong docs **chưa** được enforce

| Mã | Phát biểu trong docs | Tình trạng | Bằng chứng |
|---|---|---|---|
| BR-M08-X1 | "Chỉ lớp cuối ngành xét điều kiện bí tích" (`docs/03` WF-11) | **CHƯA HIỆN THỰC** | `grade_levels.requires_sacrament_review` / `is_sector_final_level` (`20260715000200_academic_structure.sql:53-54`) chỉ xuất hiện ở migration, `seed.sql:16-17` và `002_academic_structure_test.sql:17`; **không có** tham chiếu nào trong `src/` hay trong `…promotions.sql` |
| BR-M08-X2 | "Mặc định giữ nhánh A/B" (`docs/03` WF-11) | **CHƯA HIỆN THỰC** | `defaultTarget` lấy phần tử **đầu danh sách** đã sắp xếp theo `display_name` (`promotion-board.tsx:52`, `queries.ts:92`), không ưu tiên lớp cùng `section_code` với lớp nguồn |
| BR-M08-X3 | "Idempotency: if already approved, return existing result **or conflict predictably**" (`docs/11` §10) | Đã hiện thực nhánh "return existing"; nhưng `reject` trên review `approved` trả `CONFLICT` chung "Đề xuất này đã được xử lý." | `…promotions.sql:257-262`, `actions.ts:22` |

## Quy tắc **ngầm** cần chốt (chưa có trong docs)

| Mã | Phát biểu quan sát được từ code | Cần xác nhận |
|---|---|---|
| BR-M08-Y1 | Global-write (`super_admin`, `group_leader`, `deputy_group_leader`, `secretary`) **vừa đề xuất vừa tự duyệt được** đề xuất của chính mình | `…promotions.sql:50, 62`; test `019:109-110` cố tình dựng kịch bản này. Có phải chủ ý? |
| BR-M08-Y2 | Không ai **thu hồi/xóa** được đề xuất | Không có policy DELETE, không có RPC (`…promotions.sql:342`) |
| BR-M08-Y3 | Bảng chuyển lớp hiển thị ghi danh của **mọi năm học**, không chỉ năm hiện hành | `queries.ts:83-97` không lọc `academic_year_id` |
| BR-M08-Y4 | Lý do từ chối **không bắt buộc** | `promotion-board.tsx:153` không `required`; `schemas.ts:28` nullable |
| BR-M08-Y5 | Chuyển lớp **giữa năm** dùng `endEnrollment(status='transferred')` + ghi danh lại thủ công, không qua duyệt, không nối `previous_enrollment_id` | `src/app/(dashboard)/classes/[classId]/page.tsx:52-64`; `src/features/enrollments/schemas.ts:20-31` |
