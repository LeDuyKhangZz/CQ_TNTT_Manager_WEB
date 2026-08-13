# M04-STAFF — Business rules trích từ code

| Mã | Phát biểu | Nơi enforce | `file:line` | Đối chiếu docs |
|---|---|---|---|---|
| BR-S01 | Mỗi hồ sơ nhân sự có mã `GLVxxx` sinh tự động từ sequence, duy nhất, định dạng `^GLV[0-9]{3,}$` | **DB default + unique + CHECK** | `20260715000400:8-10,15,29` | Khớp `docs/01:528`, `docs/03:53`. Test `005:31` |
| BR-S02 | Danh xưng (Anh/Chị/Dì/Sơ/Cha/Thầy/Khác) là **danh xưng**, không phải role hệ thống | DB enum + UI + comment | `20260715000400:3,17,292`, `staff/page.tsx:51` | Khớp `docs/03:54`. Test `005:10` |
| BR-S03 | Họ tên bắt buộc, không được rỗng | Zod + **DB CHECK** | `schemas.ts:8`, `20260715000400:18` | — |
| BR-S04 | Số điện thoại bắt buộc, không được rỗng | Zod + **DB CHECK** | `schemas.ts:10`, `20260715000400:20` | — |
| BR-S05 | Email nếu có phải đúng định dạng | **Chỉ Zod** | `schemas.ts:12` | DB không có CHECK — chấp nhận được vì mọi ghi đều qua action |
| BR-S06 | Trình độ huấn luyện ∈ `none|i|ii|iii|special`, mặc định `none` | Zod + DB enum + default | `schemas.ts:13`, `20260715000400:4,24` | Khớp `docs/01` |
| BR-S07 | Trạng thái phục vụ ∈ `active|paused|inactive`, mặc định `active` | DB enum + default; Zod có nhưng **UI không dùng** | `20260715000400:5,25`, `schemas.ts:14`; hardcode tại `src/features/staff/server/actions.ts:125` | Docs không mô tả rõ. **Rule tồn tại ở DB nhưng chết ở tầng ứng dụng** |
| BR-S08 | Một hồ sơ nhân sự liên kết **tối đa một** tài khoản, và ngược lại | **DB unique** trên `profile_id` | `20260715000400:14` | Khớp `docs/01:117` |
| BR-S09 | Hồ sơ nhân sự **được phép không có tài khoản** | **DB nullable** `profile_id` | `20260715000400:14`; pgTAP tạo hồ sơ `profile_id = null` như dữ liệu hợp lệ `005:26-30` | Khớp `docs/03:53-55` (tạo hồ sơ và tạo account là hai bước) |
| BR-S10 | Xóa tài khoản **không** xóa hồ sơ nhân sự, chỉ bỏ liên kết | **DB FK `on delete set null`** | `20260715000400:14` | Khớp `docs/03:96`, `docs/01:85` |
| BR-S11 | **Không có ràng buộc chống trùng** trên `phone`, `email`, `full_name`, `full_name + date_of_birth` | — (không tồn tại ở tầng nào) | `20260715000400:12-35` (không có unique/index tương ứng); UI không kiểm (`staff/page.tsx:52-60`) | `docs/03:87` chỉ yêu cầu cảnh báo trùng cho **thiếu nhi**; **không phát biểu gì cho GLV** → khoảng trống nghiệp vụ |
| BR-S12 | Tạo/sửa hồ sơ nhân sự: chỉ `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Server Action + **RLS** | `actions.ts:19,21-25`; `20260715000400:273-279` (`can_global_write()`) | Khớp `docs/05:184` phần “SA/global-write”. Test RLS negative `005:78-81` |
| BR-S13 | Mọi INSERT/UPDATE hồ sơ phải có `updated_by = auth.uid()` | **RLS `with check`** + action tự set | `20260715000400:275,279`; `actions.ts:47,70` | Khớp `docs/10:50` “không tin `updated_by` input” |
| BR-S14 | Đọc hồ sơ nhân sự: global-read, hoặc chính mình, hoặc có phân công active ở lớp mình truy cập được | **RLS `app.can_access_staff`** | `20260715000400:243-260,270-272` | Khớp `docs/05`. Test `005:74-76` |
| BR-S15 | **Không xóa được** hồ sơ nhân sự | **RLS không có policy DELETE** + 8 FK `on delete restrict` | `20260715000400:262-290`, `:40`; các bảng khác: `20260721000300:112`, `20260722000100:32`, `20260723000100:36`, `20260723000300:40` | Docs không phát biểu → NEEDS_CONFIRMATION Q5 |
| BR-S16 | Một nhân sự chỉ thuộc **một lớp active** tại một thời điểm | **DB unique partial index** | `20260715000400:52-53` | Khớp `docs/03:104`. Test `005:39-42` |
| BR-S17 | Một lớp chỉ có **một Giáo lý viên đại diện active** | **DB unique partial index** | `20260715000400:54-55` | Khớp `docs/03:101`. Test `005:43-46` |
| BR-S18 | Một lớp có thể có nhiều `member` và nhiều `trainee` | (không có ràng buộc — cho phép) | `20260715000400:52-55` chỉ giới hạn representative | Khớp `docs/03:102-103` |
| BR-S19 | Không phân công active vào lớp có `status <> 'active'` | **DB trigger** | `20260715000400:75-79` | Khớp `docs/03` (lớp Dự trưởng chỉ hoạt động HK1). **Không có test** |
| BR-S20 | Nếu hồ sơ có role lớp active, `class_id` và `capacity` của phân công phải khớp role (`representative↔class_representative`, `member↔class_teacher`, `trainee↔trainee_assistant`) | **DB trigger** | `20260715000400:87-99` | Khớp `docs/01:117`, `docs/03:59`. **Không có test cho nhánh capacity sai** |
| BR-S21 | Không được kết thúc phân công khi vai trò lớp còn hiệu lực | **DB trigger** | `20260715000400:88-90` | Test `005:51-54` |
| BR-S22 | Kết thúc phân công phải **đồng thời** vô hiệu hóa vai trò lớp của tài khoản liên kết, theo đúng thứ tự (role trước, phân công sau) | **RPC** | `20260715000400:132-147` | Docs **không** phát biểu tác dụng phụ này → UI cũng không nói (`staff/page.tsx:41`). **Khoảng trống nghiệp vụ nghiêm trọng** |
| BR-S23 | Kết thúc phân công: chỉ `can_global_write()`; `ends_on >= starts_on`; khóa hàng bằng `for update` | **RPC (security definer)** | `20260715000400:117-130,121-124` | Khớp `docs/05:184`. Test `005:56-60` (chỉ nhánh thành công) |
| BR-S24 | `ends_on >= starts_on` và `is_active ⟺ ends_on IS NULL` | **DB CHECK** | `20260715000400:48-49` | — |
| BR-S25 | Lịch sử phân công được giữ lại, không xóa | **DB** (soft-end) + test | `20260715000400:44,49`; test `005:66-68` | Khớp `docs/03:111`. **Nhưng UI vứt bỏ lịch sử** (`src/features/staff/server/queries.ts:31`) |
| BR-S26 | Role lớp trong `role_assignments` chỉ hợp lệ khi hồ sơ có phân công active đúng lớp/capacity và `academic_year_id` khớp lớp | **DB trigger** `validate_role_assignment_scope` | `20260715000400:170-196` | Khớp `docs/01:117`, `docs/03:59`, `docs/11:28`. **Không có test** |
| BR-S27 | Role GLV bất kỳ (9 role) đòi hồ sơ nhân sự đã liên kết tài khoản | **DB trigger** `validate_staff_role_link` | `20260716000400:9-22` | Khớp `docs/01:117`. Test `007:52-56` |
| BR-S28 | `app.is_class_staff` / `is_class_representative` tính cả trường hợp không có role lớp nhưng có phân công active (ví dụ Xứ đoàn trưởng vẫn đứng lớp) | DB helper | `20260715000400:202-241` | Khớp `docs/05:8` “Một người có role cao hơn vẫn có thể có `class_staff_assignment` để đứng lớp”. Test `005:73` |
| BR-S29 | Danh sách lớp cho phân công lấy `status='active'`, **không lọc theo năm học** | Query | `src/features/staff/server/queries.ts:22` | **Mâu thuẫn** với `docs/03:100-112` (WF-04 nằm trong bối cảnh một năm học) → lỗi |
| BR-S30 | Nhân sự đã có phân công active bị `disabled` trong dropdown phân công | UI (chỉ UI) | `staff/page.tsx:67` | Chốt thật ở BR-S16. Ẩn nút ≠ authorization, nhưng ở đây là gợi ý UX hợp lệ |

## Quy tắc có trong docs nhưng **không** có trong code

| Mã | Phát biểu (docs) | Nguồn | Tình trạng |
|---|---|---|---|
| BR-S31 | Sector leader được phân staff vào lớp **nếu bật feature flag** `sector_leader_can_manage_class_staff` (mặc định `false`) | `docs/05:184,294,303` | **Flag không tồn tại**: không bảng `system_settings`, không code. Hành vi hiện tại = mặc định an toàn (`false`) nên **không phải lỗi bảo mật**, nhưng docs mô tả một tính năng chưa có → Q7 |
| BR-S32 | “Trưởng ban không được tự thêm người vào lớp” | `docs/03:112` | Đúng theo hiện trạng (chỉ `can_global_write`), nhưng không có test riêng cho `sector_leader`/`treasurer` |
| BR-S33 | Route `/staff/[staffId]` | `docs/06:103` | Không tồn tại |
| BR-S34 | Sửa hồ sơ nhân sự (`updateStaff`) | `docs/11:56` | Action tồn tại (`actions.ts:55-78`) nhưng **không UI nào gọi** |
| BR-S35 | Thay representative phải kết thúc assignment cũ rồi tạo mới | `docs/03:110` | Enforce bằng unique index (`:54-55`) nhưng UI **không hiển thị** lớp nào đã có đại diện → người dùng chỉ biết khi bị từ chối (và hiện bị từ chối **im lặng**) |

## Mâu thuẫn / trùng lặp phát hiện được

1. **BR-S22 vs UI** — RPC có tác dụng phụ lớn (vô hiệu hóa vai trò đăng nhập) mà nhãn nút, mô tả card và docs đều không nhắc. Đây là mâu thuẫn giữa hành vi thật và mô hình tinh thần của người dùng.
2. **BR-S07 vs thực tế** — DB có 3 trạng thái phục vụ, ứng dụng chỉ dùng 1.
3. **BR-S25 vs UI** — DB giữ lịch sử, UI vứt bỏ.
4. **BR-S29** — lọc lớp thiếu điều kiện năm học.
5. **BR-S12 lặp 3 lần** — `STAFF_WRITE_ROLES` (`actions.ts:19`), `writeRoles` (`staff/page.tsx:16`), `app.can_global_write()` (`20260715000100:170-180`). Lặp ở DB là **cố ý và đúng** (defence in depth); lặp giữa hai file TypeScript là **rủi ro bảo trì**.
