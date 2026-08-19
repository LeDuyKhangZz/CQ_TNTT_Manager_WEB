# 02 — Database Design

## 1. Nguyên tắc

- PostgreSQL trên Supabase.
- UUID làm primary key.
- `created_at`, `updated_at` là `timestamptz`.
- Dùng UTC ở DB, hiển thị `Asia/Ho_Chi_Minh`.
- Không hard delete dữ liệu nghiệp vụ quan trọng.
- RLS bật trên mọi bảng trong schema public.
- Dùng unique/check/FK/index để bảo vệ nghiệp vụ, không chỉ kiểm ở UI.
- Không tạo bảng audit đầy đủ; giữ `updated_by` và `updated_at`.
- Một tài khoản chỉ có một role active.
- Chức vụ Ban/Sa mạc là assignment, không phải role.
- Các view dùng `security_invoker`.
- RPC `security definer` phải đặt `search_path` cố định và tự kiểm quyền.

## 2. Enum đề xuất

```sql
create type app_role as enum (
  'super_admin',
  'parish_priest',
  'chaplain',
  'group_leader',
  'deputy_group_leader',
  'secretary',
  'treasurer',
  'sector_leader',
  'sector_deputy',
  'class_representative',
  'class_teacher',
  'trainee_assistant',
  'guardian',
  'student'
);

create type account_status as enum (
  'active', 'locked', 'disabled'
);

create type student_status as enum (
  'active', 'temporarily_inactive', 'withdrawn', 'archived'
);

create type enrollment_status as enum (
  'active', 'paused', 'completed', 'repeating', 'transferred', 'withdrawn'
);

create type meeting_type as enum ('thursday', 'sunday');

create type attendance_status as enum (
  'present',
  'excused_absence',
  'unexcused_absence',
  'late',
  'left_early'
);

create type staff_attendance_status as enum (
  'present',
  'excused_absence',
  'unexcused_absence'
);

create type sacrament_type as enum (
  'baptism',
  'first_confession',
  'first_communion',
  'confirmation',
  'profession',
  'other'
);

create type assessment_kind as enum (
  'quiz_15m',
  'midterm',
  'final',
  'attendance',
  'custom'
);

create type comment_visibility as enum (
  'student_visible',
  'staff_only'
);

create type promotion_status as enum (
  'pending',
  'recommended_promote',
  'recommended_repeat',
  'temporarily_pause',
  'withdraw',
  'approved',
  'rejected'
);

create type committee_position as enum (
  'supreme_advisor',
  'leader',
  'deputy',
  'member'
);

create type equipment_condition as enum (
  'good',
  'needs_maintenance',
  'damaged',
  'lost',
  'retired'
);

create type notification_target_type as enum (
  'all',
  'sector',
  'class',
  'committee',
  'user',
  'guardians',
  'students'
);

create type leaderboard_source_type as enum (
  'assessment',
  'temporary_weighted_average',
  'final_average',
  'custom_competition'
);
```

## 3. Identity và phân quyền

### 3.1 `profiles`

Một dòng cho mỗi `auth.users`.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | uuid | PK, FK auth.users.id |
| username | citext | unique, not null |
| display_name | text | not null |
| saint_name | text | nullable |
| account_status | account_status | default active |
| must_change_password | boolean | default true |
| phone | text | nullable |
| email | text | nullable |
| last_login_at | timestamptz | nullable |
| created_at | timestamptz | not null |
| updated_at | timestamptz | not null |
| updated_by | uuid | nullable |

Không lưu mật khẩu.

### 3.2 `role_assignments`

Lưu role active và lịch sử nhiệm kỳ.

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| id | uuid | PK |
| profile_id | uuid | FK profiles |
| role | app_role | not null |
| academic_year_id | uuid | nullable cho role theo năm |
| sector_id | uuid | nullable |
| class_id | uuid | nullable |
| starts_on | date | not null |
| ends_on | date | nullable |
| appointment_document_path | text | nullable |
| is_active | boolean | not null |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Ràng buộc:

- Partial unique: một `profile_id` chỉ có một assignment active.
- `sector_leader/sector_deputy` bắt buộc `sector_id`.
- `class_representative/class_teacher/trainee_assistant` bắt buộc `class_id`.
- Global role không được có class/sector scope.
- Trigger không cho tạo role scope sai năm học/lớp.
- Active role `guardian` bắt buộc tồn tại đúng một `guardians.profile_id = profile_id`; active role `student` tương tự với `students.profile_id`.
- Mọi active role mang tính GLV (Xứ đoàn/Thư ký/Thủ quỹ, ngành, lớp) bắt buộc có `staff_profiles.profile_id = profile_id`; role lớp còn bắt buộc active class assignment đúng class/capacity.
- Khi xóa Auth account, `profiles`/`role_assignments` bị cascade; `staff_profiles.profile_id`, `guardians.profile_id`, `students.profile_id` dùng `on delete set null` để giữ hồ sơ nghiệp vụ.

### 3.3 `login_alias_rules`

Không nhất thiết là bảng. Login server action chuẩn hóa:

```text
CQ0001 -> cq0001@students.choquan.internal
GLV001 -> glv001@staff.choquan.internal
0901234567 -> 84901234567@guardians.choquan.internal
```

Nếu triển khai bảng mapping, bảng đó chỉ server/service-role đọc; không mở anon select.

## 4. Danh mục năm học và lớp

### 4.1 `academic_years`

| Cột | Kiểu |
|---|---|
| id | uuid PK |
| code | text unique, ví dụ `2026-2027` |
| name | text |
| start_date | date |
| end_date | date |
| semester_1_end_date | date **nullable** (D-71) — mốc kết thúc học kỳ 1. CHECK: phải nằm hẳn giữa `start_date` và `end_date`. `null` = chưa khai báo (D-116) |
| status | text: draft/current/closed/archived |
| top5_enabled | boolean |
| attendance_lock_days | smallint default 3 |
| attendance_edit_lease_minutes | smallint default 15 |
| attendance_warning_consecutive_absences | smallint default 3 (D-58) |
| attendance_warning_consecutive_sundays | smallint default 3 (D-58) |
| attendance_warning_rate_threshold | numeric(4,3) default 0.800 (D-58) |
| retention_until | date — `end_date + 5 năm`. **D-120**: chặn `archived` trước hạn |
| closed_at | timestamptz **nullable** (I7/D-73) — thời điểm chốt sổ. `null` với năm chưa đóng, **và với năm bị đóng trước migration `20260726000100`** (khi đó việc đóng chỉ là tác dụng phụ của `set_current_academic_year`) |
| closed_by | uuid **nullable** → `profiles(id)` `on delete set null` (D-101) |
| close_reason | text **nullable** — **bắt buộc khi đóng cưỡng bức** lúc còn việc tồn đọng (BR-M02-N05) |
| created_at/updated_at/updated_by | metadata |

Partial unique: tối đa một `current`.

> **D-115** — qua `semester_1_end_date`, lớp Dự trưởng (`term_scope = 'semester_1'`) chỉ **hiện cảnh
> báo**; hệ thống **không** tự đổi trạng thái lớp. Không có trigger và không có tác vụ nền nào đọc
> cột này — việc đóng lớp là quyết định của người phụ trách, làm ở màn hình "Cài đặt lớp".

> **I7 / D-73 / D-119 / D-120 (M02-C, 2026-07-26)** — vòng đời `draft → current → closed → archived`
> đi **một chiều** và nay có đường đi thật:
> - `public.close_academic_year(year, confirm_code, force, reason)` — Super Admin, chỉ từ `current`,
>   bắt gõ lại `code`, đối chiếu bảng kiểm `app.academic_year_open_work()`; còn việc tồn đọng mà
>   `force = false` thì ném `YEAR_HAS_OPEN_WORK` **kèm chính bảng kiểm đó**.
> - `public.archive_academic_year(year)` — Super Admin, chỉ từ `closed`, và **chỉ khi
>   `current_date > retention_until`** (D-120). So bằng ngày của máy chủ, không nhận tham số ngày.
> - **D-119**: đóng năm **không** đụng `classes.status`. Trạng thái năm học là chốt chặn duy nhất.
>
> **Hàng rào ghi (BR-M02-N06 / D-117 / D-118).** `app.writable_academic_year_ids()` trả về các năm
> `draft`/`current`, **và tất cả các năm nếu người gọi là Super Admin**. Policy INSERT/UPDATE của
> `enrollments` và `classes` có thêm mệnh đề
> `academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])`.
> Dạng **mảng không tham số** là cố ý — helper nhận tham số cột không inline được nên bị gọi lại
> từng dòng (bài học `20260721000200`). ⚠️ **Phạm vi hẹp theo D-118**: các bảng có `academic_year_id`
> của M05/M06/M07/M08/M10/M11 **chưa** có hàng rào này.

### 4.2 `sectors`

Seed cố định:

| code | name | sort_order |
|---|---|---:|
| CHIEN_CON | Chiên Con | 1 |
| AU_NHI | Ấu Nhi | 2 |
| THIEU_NHI | Thiếu Nhi | 3 |
| NGHIA_SI | Nghĩa Sĩ | 4 |
| HIEP_SI | Hiệp Sĩ | 5 |

### 4.3 `grade_levels`

| Cột | Ý nghĩa |
|---|---|
| id | PK |
| sector_id | FK |
| level_number | 1..3; Chiên Con và Hiệp Sĩ chỉ seed 1..2 |
| display_name | Chiên Con 1, Ấu 1, ... |
| next_grade_level_id | nullable self FK |
| is_sector_final_level | boolean |
| requires_sacrament_review | boolean |
| can_propose_trainee | boolean |
| is_active | boolean |
| sort_order | integer |

Seed:

- Chiên Con 1..2.
- Ấu 1..3.
- Thiếu 1..3.
- Nghĩa 1..3.
- Hiệp 1..2.

Tổng cộng 13 cấp giáo lý. Việc cho phép nhánh phải cấu hình theo cấp: Ấu 1..3 và Thiếu 1..2 cho phép A/B; Thiếu 3 không cho phép nhánh. Không suy ra A/B cho mọi cấp chỉ từ ngành Thiếu Nhi.

Lớp Dự trưởng HK1 không phải `grade_level`, không được gắn giả vào ngành Hiệp Sĩ hoặc tạo ngành thứ sáu.

### 4.4 `classes`

| Cột | Kiểu/ghi chú |
|---|---|
| id | uuid PK |
| academic_year_id | FK |
| grade_level_id | FK; bắt buộc với lớp giáo lý, để trống với lớp Dự trưởng |
| class_kind | `catechism` hoặc `trainee`; mặc định `catechism` |
| term_scope | `full_year` hoặc `semester_1`; lớp Dự trưởng bắt buộc `semester_1` |
| section_code | nullable text, `A`/`B` |
| display_name | text |
| status | active/inactive/closed |
| meeting_location | text nullable |
| notes | text nullable |
| created_at/updated_at/updated_by | metadata |

Unique: lớp giáo lý dùng `(academic_year_id, grade_level_id, coalesce(section_code,''))`; mỗi năm học chỉ có tối đa một lớp `trainee`.

Check:

- Chỉ Ấu 1..3 và Thiếu 1..2 cho phép section A/B theo seed/config; Thiếu 3 không có section.
- Không tạo level ngoài `grade_levels`.
- `display_name` có thể được generated/validated từ grade + section.
- Lớp `trainee` có tên hiển thị `Dự trưởng`, không có `grade_level_id`/`section_code`, không thuộc sector và chỉ hoạt động trong HK1.

`class_templates` phải seed đúng 19 dòng: 18 lớp giáo lý và 1 lớp Dự trưởng HK1. Template Dự trưởng phải giữ các ràng buộc `class_kind`/`term_scope` tương ứng khi sinh lớp cho năm học.

## 5. Hồ sơ nhân sự

### 5.1 `staff_profiles`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| profile_id | unique FK profiles, nullable đến khi có account |
| staff_code | unique, ví dụ GLV001 |
| title | Anh/Chị/Dì/Sơ/Cha/Thầy/Khác |
| saint_name | text |
| full_name | text |
| date_of_birth | date nullable |
| phone | text, **nullable** từ IMP-BULK-002; có thì không được rỗng |
| email | text nullable |
| address | text nullable |
| avatar_path | text nullable |
| formation_level | none/I/II/III/special |
| service_status | active/paused/inactive |
| created_at/updated_at/updated_by | metadata |

Không lưu chứng chỉ GLV hoặc ngày bắt đầu phục vụ.

> 🔴 **`phone` cho phép trống từ 2026-08-19 (IMP-BULK-002)** — sổ của xứ đoàn thiếu số
> của 46 người, trong đó **cả Ban Trợ tá**. Không như phụ huynh, nhân sự đăng nhập bằng
> `staff_code` nên người chưa có số **vẫn cấp được tài khoản**, rồi tự điền lấy ở
> `/account`: policy `staff_profiles_update_self` cho họ ghi **đúng bốn cột**
> `phone` · `email` · `address` · `date_of_birth` trên hàng của chính mình, còn
> `app.guard_staff_self_update()` chặn mọi cột khác (cấp huấn luyện và tình trạng phục
> vụ là quyết định của Ban Điều hành, không phải của đương sự).

### 5.2 `class_staff_assignments`

Dùng để hiển thị đội ngũ lớp và ghi nhận phân công thực tế.

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | FK |
| staff_profile_id | FK |
| capacity | representative/member/trainee |
| starts_on/ends_on | date |
| is_active | boolean |
| created_at/updated_at | |

Ràng buộc:

- Một lớp có đúng một representative active.
- Một staff không được phục vụ nhiều lớp cùng lúc, theo yêu cầu hiện tại.
- Sector leader/deputy có thể có assignment vào một lớp mà không đổi primary role.
- Role class-level phải khớp capacity và class scope.

## 6. Người giám hộ và thiếu nhi

### 6.1 `guardians`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| profile_id | unique nullable FK profiles |
| full_name | not null |
| phone | **nullable** từ IMP-BULK-002, normalized; có thì không được rỗng |
| address | nullable |
| status | active/inactive |
| created_at/updated_at/updated_by | |

Một guardian có nhiều students.

> 🔴 **`guardians.phone` cho phép trống từ 2026-08-19 (IMP-BULK-002)** — sổ giấy có tên
> cha/mẹ mà không có số. Hệ quả phải nhớ: **tên đăng nhập của phụ huynh CHÍNH LÀ số điện
> thoại**, nên hồ sơ không số thì `adminProvisionAccount` từ chối cấp tài khoản kèm câu
> giải thích. Ghép phụ huynh khi nhập hàng loạt vẫn **chỉ ghép theo số**: hai hồ sơ
> "Chưa rõ" không số thì không có gì để biết chúng là một người.

### 6.2 `students`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| profile_id | unique nullable FK profiles; chỉ tạo account từ Ấu Nhi |
| student_code | unique, tự sinh `CQ0001` |
| guardian_id | **nullable** từ IMP-BULK-002, FK guardians |
| saint_name | not null (ghi `'Chưa'` khi sổ ghi chưa Rửa Tội) |
| full_name | not null — **cột duy nhất còn bắt buộc của một con người** |
| gender | male/female/other, **nullable** từ IMP-BULK-002 |
| date_of_birth | date, **nullable** từ IMP-BULK-002 |
| patron_feast_date | date nullable |
| address | text nullable |
| phone | text nullable |
| hardship_flag | boolean default false |
| status | student_status |
| general_notes | text nullable |
| created_at/updated_at/updated_by | |

Không có cột ảnh.

Duplicate warning import dựa trên normalized name + birth date + guardian phone, không unique cứng.

> 🔴 **Ba cột nới NOT NULL ngày 2026-08-19 (IMP-BULK-002)** — `gender`, `date_of_birth`,
> `guardian_id`. Lý do: sổ lên lớp của giáo xứ có 229/593 em chỉ có tên, và luật cũ
> nghĩa là các em ấy **không tồn tại trong hệ thống** nên không điểm danh được.
> `students_dob_not_future` giữ nguyên (CHECK bỏ qua NULL), `students_dedup_idx` giữ
> nguyên. **0 backfill** — mọi hồ sơ đang có vẫn đủ ba trường đó.
>
> Kéo theo: mức dò trùng thứ tư ở `lib/students/duplicate.ts` — trùng khít họ tên **khi
> cả hai bên đều trống ngày sinh lẫn SĐT phụ huynh**. Không có nó thì dán lại một khối
> đã dán sẽ đẻ ra hồ sơ thứ hai cho mọi em chỉ có tên, không một lời cảnh báo.
> Chỗ nhắc bổ sung: `v_incomplete_student_profiles` (thêm `missing_gender`,
> `missing_date_of_birth`, `missing_guardian`).

### 6.3 `student_health_profiles`

| Cột | Ghi chú |
|---|---|
| student_id | PK/FK |
| allergies | text nullable |
| medical_conditions | text nullable |
| medications | text nullable |
| emergency_notes | text nullable |
| updated_at/updated_by | |

### 6.4 `student_sacraments`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| student_id | FK |
| sacrament_type | enum |
| sacrament_name | chỉ dùng khi other |
| sacrament_date | nullable |
| place | nullable |
| registry_number | nullable |
| godparent_name | nullable |
| notes | nullable |
| created_at/updated_at/updated_by | |

Unique gợi ý `(student_id, sacrament_type)` trừ `other`.

### 6.5 `enrollments`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| student_id | FK |
| academic_year_id | FK |
| class_id | FK |
| status | enrollment_status |
| enrolled_on | date |
| ended_on | nullable |
| previous_enrollment_id | nullable self FK |
| notes | nullable |
| created_at/updated_at/updated_by | |

Constraint:

- Class và enrollment cùng academic year.
- Partial unique: một student có tối đa một enrollment mở (`active`, `paused`) trong một năm.
- Không xóa enrollment có attendance/score.

## 7. Điểm danh

### 7.1 `attendance_sessions`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | FK |
| attendance_date | date |
| meeting_type | thursday/sunday |
| status | open/in_progress/completed/locked |
| editing_by | uuid nullable FK profiles |
| editing_started_at | timestamptz nullable |
| last_activity_at | timestamptz nullable |
| finalized_at | timestamptz nullable |
| locked_at | timestamptz nullable |
| created_at/updated_at/updated_by | |

Unique `(class_id, attendance_date, meeting_type)`.

Đã hiện thực ở `20260721000300_attendance_sessions.sql`, thêm so với bảng trên:
`academic_year_id`, `finalized_by`, `unlocked_at`, `unlocked_by`.

Rules:

- `locked_at = finalized_at + academic_year.attendance_lock_days`. Chốt lại lần nữa **không** đẩy
  lùi mốc này: `finalized_at` giữ nguyên lần chốt đầu tiên, nếu không thì bấm chốt lại là gia hạn
  vô hạn cửa sổ sửa.
- Lease hết hạn khi `last_activity_at + lease_minutes < now()`.
- Chỉ một editor hợp lệ.
- CHECK chặn ngày không phải thứ Năm/Chúa nhật (D-29).
- `unlocked_at` khác null nghĩa là Super Admin vừa mở khóa: từ lúc đó tới khi chốt lại, chỉ Super
  Admin ghi được (D-33). Chốt lại xóa cờ và đặt `locked_at` mới.

### 7.2 `student_attendance_records`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| attendance_session_id | FK |
| enrollment_id | FK |
| mass_status | attendance_status |
| catechism_status | attendance_status |
| note | nullable · 🔴 **`authenticated` KHÔNG có quyền `select` trên cột này** (D-75) |
| created_at/updated_at/updated_by | |

Unique `(attendance_session_id, enrollment_id)`.

> **D-75 · quyền cột (migration `20260803000300`, đợt M05-B).** Ghi chú điểm danh là ghi chú **nội
> bộ**. RLS lọc theo dòng nên không diễn đạt được luật này, và cắt nhánh phụ huynh khỏi policy thì
> mất luôn thẻ chuyên cần của cổng phụ huynh (view `security_invoker`). Vì vậy `authenticated` bị
> `revoke select` **mức bảng** rồi `grant select` lại **từng cột trừ `note`**.
> 🔴 Hệ quả cho mọi migration sau: **thêm cột mới vào bảng này phải `grant select` riêng cho cột
> đó**, nếu không nó vô hình với cả ứng dụng và triệu chứng `42501` trông hệt lỗi RLS. pgTAP `042`
> đối chiếu danh sách cột đã cấp với danh sách cột của bảng và đỏ kèm tên cột bị bỏ quên.
> Đường đọc hợp lệ duy nhất: `public.attendance_session_notes(p_session_id)`.

Thêm ba cột **phi chuẩn hóa cho RLS**: `class_id`, `student_id`, `session_finalized_at`. Chúng suy
ra hoàn toàn từ session và enrollment, do trigger `app.sync_student_attendance_keys` điền — client
không đặt được. Lý do: Gate Phase 2 đo được policy gọi hàm theo từng dòng làm bảng 900 dòng mất
2,4 s, nên policy ở đây chỉ so cột với mảng phạm vi tính một lần. `staff_attendance_records` cũng
theo khuôn này với `class_id`, `staff_profile_id`, `session_finalized_at`.

Trigger:

- Enrollment phải thuộc class của session và đang mở tại ngày điểm danh.
- Khi session hoàn tất, mọi roster active phải có record (kiểm trong RPC finalize).
- Client không được tự đổi session/class qua update.

### 7.3 `staff_attendance_records`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| attendance_session_id | FK |
| class_staff_assignment_id | FK |
| status | staff_attendance_status |
| note | nullable |
| created_at/updated_at/updated_by | |

Unique `(attendance_session_id, class_staff_assignment_id)`.

### 7.4 `attendance_weight_settings`

Theo academic year:

| present | late | left_early | excused | unexcused |
|---:|---:|---:|---:|---:|
| 1.0 | 0.8 | 0.8 | 0.5 | 0.0 |

Có thể tách mass/catechism nếu sau này cần.

Trigger trên `academic_years` tự tạo một dòng cho mỗi năm học mới: view thống kê join thẳng vào
bảng này nên thiếu dòng là mất sạch số liệu của năm đó.

### 7.5 `absence_requests`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| student_id | FK |
| class_id / academic_year_id | suy ra từ ghi danh đang mở, trigger điền, client không đặt được |
| absence_date | date, CHECK đúng thứ Năm/Chúa nhật |
| meeting_type | thursday/sunday |
| reason | bắt buộc, <= 500 ký tự |
| status | pending/acknowledged/cancelled |
| staff_note, reviewed_by, reviewed_at | phần của giáo lý viên · `staff_note` là **lời nhắn cho phụ huynh**, phụ huynh đọc được (khác `student_attendance_records.note`) |
| created_by | FK profiles |

Partial unique `(student_id, absence_date, meeting_type)` khi `status <> 'cancelled'`.

Rules (WF-10):

- Chỉ phụ huynh của chính em đó tạo được đơn; thiếu nhi không tự xin nghỉ.
- Người gửi chỉ được **hủy** đơn còn đang chờ, không sửa lý do, không tự duyệt.
- Giáo lý viên ghi nhận và ghi chú, nhưng **không hủy đơn của phụ huynh**.
- Đơn **không bao giờ** tự ghi vào `student_attendance_records`; nó chỉ hiện lên trang điểm danh
  như gợi ý, người điểm danh vẫn tự chọn.
- **TB-11 · D-141 (M05-B):** không nhận đơn cho **buổi đã chốt** — trigger ném
  `ABSENCE_SESSION_ALREADY_FINALIZED`, chỉ áp cho INSERT nên đơn cũ không bị hỏng. Chặn theo
  **trạng thái buổi**, không theo ngày: buổi còn mở thì đơn báo muộn vẫn có tác dụng.

### 7.6 View chuyên cần

- `v_student_attendance_summary` — theo em/năm học, **chỉ đếm buổi đã chốt**: tỷ lệ có trọng số,
  hai điểm thang 10 tách riêng Lễ và Giáo lý (D-59), chuỗi vắng liên tiếp, chuỗi Chúa nhật vắng lễ,
  số buổi lệch Lễ/Giáo lý, và ba cờ cảnh báo so với ngưỡng của năm học (D-58).
- `v_class_attendance_summary` — gộp theo lớp, dựng trên view trên.
- `v_staff_attendance_summary` — chuyên cần giáo lý viên theo lớp/năm học.

Cả ba dùng `security_invoker` nên phụ huynh/thiếu nhi đọc view vẫn chỉ thấy phần của mình.

Ngưỡng cảnh báo nằm ở `academic_years`: `attendance_warning_consecutive_absences` (mặc định 3),
`attendance_warning_consecutive_sundays` (3), `attendance_warning_rate_threshold` (0.800).

## 8. Giáo án và lịch dạy

### 8.1 `teaching_plans`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | unique FK |
| academic_year_id | FK |
| title | nullable |
| created_by_staff_id | FK |
| created_at/updated_at/updated_by | |

### 8.2 `teaching_plan_items`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| teaching_plan_id | FK |
| sequence_no | integer |
| planned_date | date |
| title | text |
| objectives | text nullable |
| catechism_content | text nullable |
| scripture_content | text nullable |
| game | text nullable |
| song | text nullable |
| homework | text nullable |
| preparation | text nullable |
| material_path | text nullable, unique khi có giá trị |
| material_name | text nullable |
| material_mime_type | text nullable, allowlist PDF/Office/image/text |
| material_size | bigint nullable, 1 byte..5 MB |
| teacher_staff_id | FK |
| item_type | lesson/assessment |
| note | nullable |
| created_at/updated_at/updated_by | |

Unique `(teaching_plan_id, planned_date)` theo quyết định hiện tại một mục/ngày; nếu thực tế có nhiều mục một ngày, đổi thành `(teaching_plan_id, planned_date, sequence_no)`. Ngày phải nằm trong năm học của lớp; `lesson` bắt buộc có người dạy đang được phân công vào lớp tại ngày đó.

RLS bảng gốc chỉ cho staff trong phạm vi lớp đọc. Representative lớp hoặc nhóm global-write được ghi.
Guardian/student không đọc bảng gốc; `get_week_ahead_teaching_items(from, days)` là projection
`security definer` chỉ trả `class`, ngày, tên, chuẩn bị, loại mục và người dạy.

## 9. Kiểm tra và bảng điểm

### 9.1 `assessment_type_settings`

Theo academic year:

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| academic_year_id | FK |
| kind | assessment_kind |
| display_name | text |
| default_weight | numeric(5,2), check 0 < x <= 100 |
| is_active | boolean |

Seed: quiz 1, midterm 2, final 3, attendance 1.

### 9.2 `assessments`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | FK |
| academic_year_id | FK |
| kind | enum |
| title | text |
| assessment_date | date nullable |
| max_score | numeric default 10, check 0 < x <= 10 |
| weight | numeric(5,2), check 0 < x <= 100; copy từ default và cho phép staff lớp chỉnh trước lock |
| is_published | boolean |
| created_by | uuid |
| created_at/updated_at/updated_by | |

Không đặt unique theo `(class_id, kind)` và không đặt quota số assessment: một lớp có thể không dùng một loại nào hoặc tạo nhiều assessment cùng loại. Hệ thống không seed assessment bắt buộc cho từng lớp; chỉ seed cấu hình loại và hệ số mặc định.

🔴 **M07-B — `assessments.is_active` từ "cột chết" thành cột nghiệp vụ** (BR-M07-26/27/28,
`20260805000200`). Cột này có từ Phase 5 nhưng **không đường nào đặt nó thành `false`**, nên chưa
ai phải hỏi *"ẩn rồi thì phụ huynh còn thấy không"*. Từ M07-B:

- **Xóa cứng** chỉ dành cho cột **chưa có điểm thật** (`score is not null` = 0), qua RPC
  `public.delete_assessment` — nó dọn luôn các dòng rỗng rồi mới xóa cột, và **đó là chỗ dữ liệu
  rác do lỗi "ghi cả roster" biến mất**, không cần backfill riêng.
- Cột đã có điểm chỉ **ẩn mềm** `is_active = false`, đi qua policy `assessments_update_grader`.
- 🔴 **Ẩn phải ẩn ở tầng cơ sở dữ liệu, không chỉ ở truy vấn ứng dụng.** Mọi truy vấn của app đã
  lọc `is_active` từ Phase 5 và `v_student_weighted_average` cũng vậy — nhưng **RLS thì không**,
  nên phụ huynh gọi thẳng Data API vẫn đọc được cột đã ẩn. Hai chỗ sửa:
  `assessments_select_scope` thêm `and is_active` **ở nhánh phụ huynh/thiếu nhi**, và trigger
  `app.sync_assessment_publication` (nay chạy `after update of is_published, is_active`) hạ
  `assessment_scores.assessment_published` về `false`. Cùng luật ấy nằm trong
  `app.sync_assessment_score_keys` cho đường ghi từng dòng — thiếu nó thì lưu một ô vào cột đã ẩn
  sẽ **bật lại** cờ công bố cho đúng dòng ấy.
- Cột đang là **nguồn của một bảng Top 5** (`leaderboards.source_assessment_id`, khoá ngoại
  `on delete restrict`) bị RPC chặn bằng mã riêng `ASSESSMENT_IS_LEADERBOARD_SOURCE`. Không chặn
  ở đây thì Postgres ném `23503`, mà `23503` được dịch thành *"Không tìm thấy dữ liệu liên quan"*
  — một câu sai hẳn nghĩa.
- **M07-C**: cột ẩn có đường **hiện lại** (`is_active = true`) ngay trên màn hình bảng điểm, cùng
  policy và cùng hàng rào khóa với đường ẩn (nợ #21). Trước M07-C đây là cửa một chiều.

🔴 **M07-C — "khóa bảng điểm" có ĐÚNG MỘT ngoại lệ: cờ công bố** (BR-M07-29, **D-154**,
`20260806000100`). Luật cũ *"khóa rồi thì không đổi được gì nữa"* buộc phải **mở khóa cả bảng
điểm** — tức mở luôn quyền sửa điểm và hệ số của cả lớp — chỉ để công bố kết quả cho phụ huynh vào
cuối năm. Chủ dự án chốt tách hai việc (2026-08-06), **cả hai chiều** bật và tắt.

Ngoại lệ đặt ở **ba** chỗ, và thiếu chỗ thứ ba thì thao tác vẫn hỏng với đúng mã lỗi cũ:

1. `public.set_assessment_published(uuid, boolean)` — RPC `security definer` mới, đường công bố
   **duy nhất** của ứng dụng. Quyền giữ nguyên `app.can_grade_class`; hàng rào năm học (nợ #18) và
   luật cột ẩn được **chép vào trong hàm**, vì definer bỏ qua RLS.
2. `app.validate_assessment` — bỏ qua kiểm khóa khi lượt UPDATE **chỉ** đổi `is_published`. Phép
   thử so **cả bản ghi** (`to_jsonb(new) = to_jsonb(old)` sau khi trừ `is_published`/`updated_at`/
   `updated_by`), không liệt kê tay từng cột: liệt kê tay thì cột nào thêm về sau sẽ lọt qua ngoại
   lệ **trong im lặng**, và ngoại lệ của một hàng rào bảo mật không được rộng ra một cách âm thầm.
3. 🔴 `app.sync_assessment_score_keys` — trigger nằm trên **bảng khác**. Đổi `assessments.is_published`
   làm `assessments_sync_publication` chạy một lệnh UPDATE lên `assessment_scores`, mà trigger dòng
   của bảng ấy **cũng** ném `GRADEBOOK_LOCKED`. Nới an toàn được vì hàm tự suy lại
   `assessment_published` từ chính cột điểm ⇒ một lượt UPDATE chỉ đổi mỗi cờ ấy không mang theo giá
   trị nào của người dùng; và `authenticated` chỉ có `select` trên bảng này nên không có đường gọi
   trực tiếp.

**Policy `assessments_update_grader` giữ nguyên** — đó là điều phương án A của `04_TO_BE_FLOWS`
đòi: lệnh gửi thẳng vào cơ sở dữ liệu khi đã khóa vẫn bị từ chối, **kể cả** lệnh chỉ đổi cờ công
bố (AC-02-02). pgTAP `045` đo **cả hai chiều**: một khẳng định cho chiều nới, sáu cho chiều giữ.

### 9.3 `assessment_scores`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| assessment_id | FK |
| enrollment_id | FK |
| class_id/academic_year_id/student_id | Scope keys do trigger suy ra, phục vụ RLS/index |
| score | numeric(4,2), 0..10 nullable |
| system_suggested_score | Đề xuất chuyên cần nullable |
| is_manual_override | Giữ điểm chỉnh tay khi refresh đề xuất |
| note | nullable |
| assessment_published | Cờ phi chuẩn hóa đồng bộ từ assessment để portal RLS |
| graded_by | uuid |
| graded_at | timestamptz |
| created_at/updated_at | |

Unique `(assessment_id, enrollment_id)`.

Trigger enrollment cùng class/year.

### 9.4 Điểm chuyên cần và override

Không có bảng override tách rời. Cột `system_suggested_score`, `score` và
`is_manual_override` trên `assessment_scores` giữ đề xuất, điểm cuối và trạng thái chỉnh tay.
`refresh_attendance_assessment_scores` chỉ cập nhật đề xuất/dòng chưa override;
`reset_attendance_score_override` đưa một dòng về lại đề xuất hệ thống.

🔴 **M07-B — luật đóng dấu "chỉnh tay" đã SAI từ Phase 5** (BR-M07-31, `20260805000200`).
`save_assessment_scores` đặt `is_manual_override = true` cho **mọi** phần tử nhận được khi cột là
`attendance`, mà biểu mẫu thì gửi cả roster ⇒ **một cú bấm "Lưu điểm" biến cả 50 em thành "đang
chỉnh tay"**, và cơ chế đề xuất tự động chết hẳn từ đó (F07 = 62/75). M07-A đã chặn phần lớn bằng
cách chỉ gửi ô đã đổi, nhưng luật vẫn sai: gõ trả lại đúng con số máy đề xuất vẫn bị đóng dấu.

Luật đúng: cờ bật khi **giá trị lưu khác đề xuất**, dùng `is distinct from` chứ không phải `<>` —
`<>` với `null` ra `null`, tức "không đúng cũng không sai", và `case … then` rơi vào nhánh sai. Ô
rỗng và ô có điểm là hai thứ khác nhau ở **cả hai** chiều. Cờ cũng **tự gỡ** khi giá trị trùng lại
đề xuất: luật đọc **giá trị**, không đọc lịch sử thao tác.

`refresh_attendance_assessment_scores` nay trả `(out_refreshed, out_skipped_manual)` thay cho một
`integer` — bắt buộc `drop` + `create` và sinh lại `src/types/database.ts` (TB-M07-04).

**D-153 (chủ dự án chốt 2026-08-05) — dọn dữ liệu cũ.** Sửa luật cho tương lai **không gỡ được**
những dấu đã đặt sai: nút "Lấy đề xuất mới" sẽ vĩnh viễn bỏ qua chúng và con số `skipped_manual`
vừa thêm sẽ hiện một số to giả ngay từ ngày đầu. Migration gỡ cờ ở **đúng** những ô mà
`score is not distinct from system_suggested_score` — tức không có bàn tay người nào trong đó. Mọi
ô có điểm khác đề xuất **giữ nguyên** dấu, kể cả khi nó bị đặt oan, vì ở đó không phân biệt được
"người sửa thật" với "người trùng số".

### 9.5 `student_comments`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| enrollment_id | FK |
| class_id/academic_year_id/student_id | Scope keys do trigger suy ra |
| visibility | comment_visibility |
| content | text |
| author_profile_id | FK |
| comment_date | date |
| created_at/updated_at/updated_by | |

### 9.6 `gradebook_locks`

| Cột | Ghi chú |
|---|---|
| class_id | PK/FK |
| academic_year_id | FK |
| locked_at | timestamptz |
| locked_by | uuid |
| unlocked_at | nullable |
| unlocked_by | nullable |
| is_locked | boolean |
| results_published_at/results_published_by | nullable, dành cho mốc công bố tổng thể |

Chỉ class representative khóa; Super Admin mở.

### 9.7 `leaderboards`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | FK |
| academic_year_id | FK |
| title | text |
| source_type | leaderboard_source_type |
| source_assessment_id | nullable FK |
| top_n | smallint default 5, check = 5 trong v1 |
| is_published | boolean |
| published_at | nullable |
| published_by | nullable uuid |
| created_by/updated_by | uuid |
| created_at/updated_at | |

### 9.8 `leaderboard_entries`

Dùng cho custom competition hoặc snapshot khi publish.

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| leaderboard_id | FK |
| enrollment_id | FK |
| class_id/academic_year_id | Scope keys snapshot |
| rank | smallint 1..5 |
| score | numeric nullable |
| title | nullable |
| saint_name_snapshot/full_name_snapshot | Tên bất biến khi publish |
| leaderboard_published | Cờ phi chuẩn hóa cho portal RLS |
| created_at | |

Unique rank và enrollment trong leaderboard. Bảng này luôn chứa **bản đang có** của mỗi Top 5 —
mọi bản trước nằm ở `leaderboard_snapshots` (§9.9).

### 9.9 `leaderboard_snapshots`

🔴 **M07-C — vòng đời Top 5** (BR-M07-34/35, **D-155**, `20260806000100`). Trước đợt này, "Ẩn khỏi
portal" rồi bấm công bố lại thì `publish_leaderboard` **xóa sạch** entries cũ và tính lại theo điểm
mới nhất: em đứng hạng 5 hôm trước biến khỏi bảng, **không ai được báo và bản cũ không còn ở đâu**
(F16). `04_TO_BE_FLOWS` khuyến nghị phương án A (chốt một lần, cấm tính lại); **chủ dự án chọn
phương án B (2026-08-06)** — giữ khả năng tính lại, nhưng mỗi lần thay phải lưu lại bản đang có.

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| leaderboard_id | FK `on delete restrict` |
| class_id/academic_year_id | Scope keys cho RLS |
| snapshot_no | smallint ≥ 1, unique theo `leaderboard_id` |
| entry_count | smallint 1..5 |
| entries_json | jsonb — `[{rank, enrollmentId, score, saintName, fullName}]`, xếp theo `rank` |
| published_at/published_by | Mốc công bố của **bản bị thay** |
| superseded_at/superseded_by | Ai thay, lúc nào |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **Bảng riêng, không thêm cột `snapshot_no` vào `leaderboard_entries`.**
   `07_IMPLEMENTATION_IMPACT` §4 cấm tuyệt đối mọi thay đổi làm nới quyền đọc của cổng phụ huynh, mà
   `leaderboard_entries` **là đúng cái bảng cổng phụ huynh đọc**: chứa nhiều bản trong đó thì hai
   `unique` của nó phải nới ra và policy phải học cách chọn bản nào. Tách ra thì
   `leaderboard_entries` **không đổi một chữ** — cổng luôn chỉ thấy bản đang có.
2. **Append-only tuyệt đối**, cùng khuôn `account_audit_events` (D-65): trigger chặn UPDATE/DELETE
   cho **mọi** vai trò kể cả chủ bảng và `service_role`. Một bản lịch sử sửa được thì nó không còn
   là lịch sử.
3. **Chỉ nhân sự phạm vi lớp đọc.** Không có nhánh phụ huynh/thiếu nhi — WF-09 nói cổng hiển thị
   Top 5 **đang** công bố; cho cổng đọc bảng này là để lộ đúng thứ vừa được gỡ xuống. Ghi là việc
   của `publish_leaderboard` (`security definer`), không phải của phiên người dùng.

`entries_json` theo tiền lệ `report_snapshots` (§13): dữ liệu **đông cứng**, không ai truy vấn quan
hệ vào nó, chỉ đọc ra để đối chiếu.

**Kèm một chỗ siết:** policy `leaderboards_delete_manager` đổi phép thử từ `not is_published` sang
`not is_published and published_at is null` (BR-M07-35). Điều kiện cũ sai theo **đúng hình dạng F04**
mà M07-B vừa chữa ở cột điểm: sau một lượt ẩn thì `is_published` về `false`, policy cho qua, rồi
khoá ngoại `on delete restrict` **trả lời hộ** bằng `23503` — dịch ra thành *"Không tìm thấy dữ liệu
liên quan"*. `published_at` không bao giờ bị xóa đi nên nó là phép thử đúng cho "đã từng công bố".

## 10. Chuyển lớp

### `promotion_reviews`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| source_enrollment_id | unique FK |
| source_class_id/source_academic_year_id/student_id | Scope keys bất biến của đề xuất |
| proposed_target_class_id | nullable FK |
| propose_trainee | boolean |
| proposed_status | promotion_status |
| warning_snapshot | jsonb |
| representative_note | nullable |
| proposed_by | uuid |
| proposed_at | timestamptz |
| reviewed_by | nullable uuid |
| reviewed_at | nullable |
| review_note | nullable |
| final_status | promotion_status |
| approved_target_class_id | nullable FK |
| created_enrollment_id | nullable FK |
| created_at/updated_at | |

Quy tắc:

- Chỉ representative đề nghị.
- Sector leader/deputy cùng ngành duyệt.
- Target class phải là next grade hoặc same grade khi repeat; A/B được đổi.
- Hiệp 2 có target null và `propose_trainee = true` trong field bổ sung.
- Approval tạo enrollment mới nguyên tử trong RPC.
- **M08-B/D-161 — `warning_snapshot` có thêm ba khoá khi lớp nguồn là cấp cuối
  ngành**: `sacramentReviewRequired` (luôn `true` khi có mặt) ·
  `requiredSacraments` · `missingSacraments`. Ba khoá này **vắng hẳn** khi lớp
  không phải cấp cuối ngành (AC-17) và ở mọi đề xuất tạo trước 2026-08-07 — tầng
  ứng dụng phải chịu được khoá vắng, không được coi vắng là lỗi dữ liệu.
- **M08-B/D-160 — hàng rào năm học đã đóng nằm TRONG hai RPC**, không nằm trong
  policy: bảng chỉ có `grant select` nên mọi đường ghi đi qua `security definer`,
  mà definer bỏ qua RLS. `propose_promotion` đòi **năm nguồn** còn ghi được;
  `approve_promotion_review` đòi **cả năm nguồn lẫn năm đích**. Super Admin là
  ngoại lệ duy nhất (D-117).
- **M08-B/D-159 — `public.promote_enrollment_now(...)`**: gọi lại đúng hai RPC
  trên trong **một giao dịch**, chỉ cho `app.can_global_write()`. 0 thay đổi
  phân quyền — nó gộp hai bước mà bốn vai trò ấy vốn đã làm được.

### 10.1 `promotion_review_events` (M08-B, D-157)

Nhật ký quyết định chuyển lớp — **chỉ ghi thêm**.

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| review_id | FK `promotion_reviews` |
| source_enrollment_id/source_class_id/source_academic_year_id | Scope keys, sao lại để báo cáo không phải join ngược |
| event_no | smallint, unique theo `(review_id, event_no)` |
| event_type | `proposed` · `approved` · `rejected` |
| proposed_status / propose_trainee / target_class_id | Nội dung quyết định tại thời điểm đó |
| note | Ghi chú đại diện hoặc ý kiến người duyệt |
| actor_id | nullable FK `profiles` (`on delete set null`) |
| occurred_at | timestamptz |

Quy tắc:

1. **Vì sao có bảng này:** `propose_promotion` upsert về `pending` khi gửi lại
   (BR-M08-16) nên nó **xoá** `reviewed_by`/`reviewed_at`/`review_note` — tức
   "ai từ chối, khi nào, vì sao" biến mất không dấu vết. `04_TO_BE_FLOWS` khuyến
   nghị cột `history jsonb`; chủ dự án chốt **bảng riêng** (D-157), cùng khuôn
   `leaderboard_snapshots` (§9.9) và `account_audit_events` (D-65).
2. **Append-only tuyệt đối**: trigger `promotion_review_events_no_mutation` chặn
   UPDATE/DELETE, nên luật đứng độc lập với mọi `grant`, kể cả `service_role`.
3. `authenticated` chỉ có `select`, phạm vi **đúng bằng**
   `promotion_reviews_select_scope` — không rộng hơn một ly. Ghi là việc của hai
   RPC `security definer`.
4. Sắp xếp để đọc theo `event_no`, **không** theo `occurred_at`: hai dòng của
   đường một-bước (D-159) nằm trong cùng một giao dịch nên `now()` bằng nhau tới
   micro giây.

### 10.2 Hàng rào `enrollments` ↔ `promotion_reviews` (M08-B, D-158/D-162)

Trigger `enrollments_pending_promotion_guard` (`before update of status`) từ chối
đưa một ghi danh sang **bốn trạng thái đóng** (`completed` · `repeating` ·
`transferred` · `withdrawn`) khi ghi danh ấy đang có review `pending` — bịt đường
vòng `/classes/[classId]` để lại đề xuất mồ côi. **"Tạm nghỉ" không bị chặn**
(D-162): `paused` là trạng thái mở.

🔴 **Hệ quả về thứ tự lệnh:** `security definer` bỏ qua RLS nhưng **không** bỏ qua
trigger, nên `approve_promotion_review` phải đánh dấu review `approved` **trước**
khi cập nhật `enrollments`; làm ngược lại là tự chặn chính đường duyệt hợp lệ.
Tính nguyên tử của BR-M08-13 không suy suyển vì cả hai nằm trong một giao dịch.

## 11. Ban và thiết bị

### 11.1 `committees`

- id, code, name, description, is_active, created_at, updated_at.
- `manages_equipment boolean` — Ban giữ kho thiết bị (P6-T1). Dùng cờ thay vì so
  sánh `code` để đổi tên Ban không làm mất kho; `equipment_items` chỉ gắn được
  vào Ban có cờ này.
- `sort_order` để thứ tự hiển thị ổn định.

Seed 6 Ban ở `supabase/seed.sql` với id cố định `30000000-…-00000000000{1..6}`;
chỉ Ban Kỹ thuật (`KY_THUAT`) có `manages_equipment = true`.

Đọc: global read hoặc thành viên chính Ban đó. Ghi: global-write (WF-12).

### 11.2 `committee_memberships`

- id.
- committee_id.
- staff_profile_id.
- position.
- starts_on/ends_on.
- is_active.

Constraint bằng trigger `app.validate_committee_membership` (SECURITY DEFINER):
một staff tối đa hai membership active (D-47). Trigger phải là definer để đếm
trên toàn bộ chức vụ chứ không chỉ phần người thao tác nhìn thấy qua RLS.

Partial-unique `(committee_id, staff_profile_id) where is_active`: không giữ hai
chức vụ song song trong cùng một Ban. Không hard delete — kết thúc nhiệm kỳ bằng
`is_active = false` + `ends_on` để giữ lịch sử.

### 11.3 `committee_announcements`

- committee_id, title, content, author_staff_id, published_at.

Chỉ leader/deputy.

### 11.4 `committee_meetings`

- committee_id, title, starts_at, ends_at, location, note, created_by.

### 11.5 `committee_weekly_plans`

- committee_id, week_start, content, checklist_json, created_by.

Không giao assignee/deadline trong v1.

`week_start` bị CHECK ràng phải là thứ Hai (`extract(isodow) = 1`) và unique
`(committee_id, week_start)`: nếu không chốt mốc tuần thì hai người chọn hai
ngày khác nhau cho cùng một tuần và unique mất tác dụng.

2B · M09-A bổ sung CHECK `committee_weekly_plan_not_empty`
(`btrim(coalesce(content,'')) <> ''`): bản tuần trắng là dấu hiệu của một lượt
ghi đè hỏng, không phải một bản hợp lệ. Cùng đợt, index một phần
`committee_memberships_one_active_leader_idx` giới hạn **mỗi Ban một Trưởng ban**
(D-78); Phó ban không giới hạn.

Ba bảng nội dung Ban (11.3–11.5) dùng chung trigger
`app.set_committee_content_author`: `created_by`/`author_staff_id` lấy từ phiên
đăng nhập, không nhận từ client. Ghi/xóa = `app.can_write_committee_content`
(Trưởng/Phó Ban của chính Ban đó, hoặc global-write — D-48).

### 11.6 `equipment_items`

- id, committee_id phải là Ban Kỹ thuật.
- asset_code.
- name.
- category.
- total_quantity.
- available_quantity.
- condition.
- storage_location.
- note.
- is_active.

### 11.7 `equipment_loans`

- id.
- equipment_item_id.
- quantity.
- **outstanding_quantity** — số cái người mượn còn giữ (2B · M09-B).
- restored_quantity — **tổng** số cái đã nhận lại, cộng dồn (2B · M09-B).
- borrower_staff_id.
- handed_over_by.
- borrowed_at.
- expected_return_at nullable.
- returned_at nullable.
- received_by nullable — người nhận **lần gần nhất** (2B · M09-B).
- borrow_note.
- return_note.
- condition_on_return.
- status.

Constraint số lượng > 0 và không vượt available; mượn/trả đi qua RPC có row lock.
`restored_quantity + outstanding_quantity <= quantity`, và phiếu chỉ ở trạng thái
`returned` khi `outstanding_quantity = 0`.

Hiện thực P6-T3: `authenticated` **không** có INSERT/UPDATE trên
`equipment_loans` — mọi thao tác qua RPC SECURITY DEFINER, `select … for update`
trên thiết bị rồi mới ghi. `available_quantity` **và** `total_quantity` đều không
sửa tay được: trigger `app.validate_equipment_item` chặn cả hai cột ngoài RPC, và
nhánh INSERT bắt buộc `available = total` (2B · M09-A, `EQUIPMENT_TOTAL_READONLY`
/ `EQUIPMENT_STOCK_MISMATCH`).

#### Vòng đời kho sau 2B · M09-B

Trước M09-B chỉ có `return_equipment(p_restored_quantity)`, và **một** con số vừa
nghĩa là "hôm nay mang về bấy nhiêu" vừa nghĩa là "phần còn lại mất vĩnh viễn":
phiếu luôn đóng ngay lần trả đầu tiên và phần chênh lệch trừ thẳng `total_quantity`
mà không hỏi ai. Nay tách làm hai RPC:

| RPC | Tác dụng | Quyền |
|---|---|---|
| `receive_equipment(loan, n, condition, note)` | `available += n`, `outstanding -= n`. **Không bao giờ** đụng `total_quantity`. Phiếu chỉ đóng khi `outstanding` về 0 | `app.can_operate_equipment` |
| `write_off_equipment(loan, n, condition, note)` | `total -= n`, `outstanding -= n`, `available` không đổi. **Ghi chú bắt buộc** (`EQUIPMENT_WRITE_OFF_NOTE_REQUIRED`) | `app.can_operate_equipment` (D-93) |
| `return_equipment(...)` | Giữ nguyên chữ ký, nay là **vỏ bọc**: nhận lại phần trả được rồi báo hỏng/mất phần còn lại | như trên |
| `adjust_equipment_stock(item, delta, reason, note)` | Đổi `total` **và** `available` cùng lúc, ngoài mọi phiếu mượn. `delta < 0` chỉ tới mức `available` còn lại và bắt buộc ghi chú | `app.can_write_committee_content` — **chặt hơn** mượn/trả |
| `list_equipment_borrower_options(committee)` | Trả về **chỉ** `staff_profile_id · display_name · staff_code` của nhân sự đang hoạt động | `app.can_operate_equipment`, ném `42501` nếu không |

Trả lại lần hai vẫn idempotent, và kiểm quyền chạy **trước** nhánh idempotent nên
người ngoài Ban không suy ra được phiếu có tồn tại hay không.

`list_equipment_borrower_options` là **cửa sổ hẹp** cho D-94/D-97: ô "Người mượn"
mở sang mọi nhân sự xứ đoàn mà **không** nới `app.can_access_staff` — điện thoại,
ngày sinh, địa chỉ trong `staff_profiles` vẫn theo phạm vi cũ.

### 11.8 `equipment_loan_events` · `equipment_stock_adjustments` (2B · M09-B)

Hai bảng nhật ký thuần append (D-65 ở mức module). `authenticated` chỉ có
**SELECT** trong phạm vi `app.can_read_equipment(committee_id)`; ghi vào chúng là
việc của RPC SECURITY DEFINER.

- `equipment_loan_events`: `loan_id` (cascade theo phiếu) · `committee_id` ·
  `kind ∈ {receive, write_off}` · `quantity` · `condition` · `note` ·
  `actor_profile_id` · `created_at`.
- `equipment_stock_adjustments`: `equipment_item_id` (**ON DELETE RESTRICT** — nhật
  ký kho không được biến mất chỉ vì ai đó xoá thiết bị) · `committee_id` · `delta` ·
  `reason ∈ {purchase, found, stocktake, damaged}` · `note` · `total_after` ·
  `actor_profile_id` · `created_at`.

Mượn/trả = thành viên Ban Kỹ thuật hoặc global-write; tạo/sửa danh mục và **đổi
tổng kho** = Trưởng/Phó Ban hoặc global-write (docs/05).

## 12. Thông báo

### 12.1 `notifications`

- id.
- title.
- content.
- target_type.
- target_sector_id/class_id/committee_id/user_id nullable theo target.
- author_profile_id.
- published_at.
- created_at.
- `link_path` — deep-link tùy chọn, bị CHECK ràng vào danh sách route đã tồn tại
  (AGENTS §8). Danh sách này lặp ở `src/features/notifications/constants.ts`;
  đổi một bên phải đổi cả hai, có unit test canh.
- `recipient_count` — số người nhận chốt tại thời điểm publish, để UI khỏi đếm lại.

Ghi qua RPC `public.publish_notification` (kiểm quyền theo phạm vi rồi
materialize người nhận trong cùng một giao dịch). `authenticated` không có
INSERT trực tiếp.

### 12.2 `notification_recipients`

Materialize người nhận khi publish:

- notification_id.
- profile_id.
- delivered_at.
- read_at.

Unique `(notification_id, profile_id)`.

Điều này giúp đếm chưa đọc ổn định ngay cả khi người dùng đổi lớp/role sau đó.

Phạm vi materialize (P6-T4): `all` = mọi tài khoản đang hoạt động; `guardians`/
`students` = theo role active; `user` = đúng một người; `sector` = nhân sự có
role gắn ngành đó cộng GLV đang đứng lớp thuộc ngành; `class` = GLV đứng lớp đó
cộng phụ huynh/thiếu nhi có ghi danh đang mở; `committee` = thành viên Ban đó.
Unique `(notification_id, profile_id)` chặn trùng khi một người thuộc nhiều
nhánh (GLV kiêm phụ huynh, D-25).

Đọc: `mark_notification_read` / `mark_all_notifications_read` chỉ đụng dòng của
chính người gọi.

## 13. Báo cáo

### 13.1 `report_snapshots`

- id.
- report_type.
- academic_year_id.
- scope_type và scope_id.
- filter_json.
- generated_by.
- generated_at.
- file_path.
- checksum.
- status `final`.
- title.
- `period_type` (week/month/year), `period_start`, `period_end`.
- `payload_json` — bảng số liệu tại thời điểm chốt.

Snapshot final không update/delete bằng user flow: `authenticated` chỉ được cấp
SELECT và INSERT, không có UPDATE/DELETE. Trigger `app.seal_report_snapshot`
đặt `generated_by`/`generated_at`/`status` và tính lại `checksum` (SHA-256 của
payload + filter) phía server — client không đặt được.

`payload_json` giữ số liệu, `filter_json` giữ bộ lọc đang chọn (D-52), nên tải
lại bản chốt hôm sau vẫn ra đúng file cũ dù dữ liệu nguồn đã đổi.

File Excel/PDF sinh lại từ `payload_json` khi tải; chưa dùng bucket
`report-snapshots` nên `file_path` để trống.

### 13.2 View đề xuất

- `v_student_attendance_summary`.
- `v_class_attendance_summary`.
- `v_staff_attendance_summary`.
- `v_student_weighted_average`.
- `v_students_at_risk`.
- `v_dashboard_summary`.
- `v_upcoming_teaching_items`.
- `v_upcoming_celebrations`.
- `v_incomplete_student_profiles`.

Tất cả `security_invoker` — cùng một view, mỗi vai trò cộng ra con số của đúng
phạm vi mình đọc được, không cần policy riêng cho dashboard.

`v_incomplete_student_profiles` LEFT JOIN `guardians` là cố ý: GLV lớp không đọc
được bảng `guardians`, join thường sẽ làm view rỗng với chính người cần dùng.
Cờ thiếu SĐT chỉ bật khi người đọc thật sự thấy được guardian.

Hai hàm nguồn báo cáo `public.report_attendance_rows(year, from, to)` và
`public.report_results_rows(year)` là SECURITY INVOKER: bản xem trước, file
Excel/PDF và payload snapshot dùng chung một truy vấn nên không thể lệch nhau.

## 14. Sa mạc — schema dự phòng

Không migrate cho đến Phase 8, nhưng giữ tên:

- `camps`.
- `camp_role_assignments`.
- `camp_registrations`.
- `camp_fees`.
- `camp_payment_receipts`.
- `camp_announcements`.
- `camp_schedule_items`.
- `camp_participants`.

Chi tiết tại `docs/13-summer-camp-backlog.md`.

## 15. Storage buckets

| Bucket | Public? | Dùng cho |
|---|---:|---|
| `staff-avatars` | No | Ảnh GLV tùy chọn |
| `teaching-materials` | No | Tài liệu giáo án |
| `appointment-documents` | No | Bổ nhiệm thư |
| `report-snapshots` | No | PDF/XLSX đã chốt |
| `camp-receipts` | No | Phase 8 |

`teaching-materials` giới hạn 5 MB, allowlist MIME và path
`{class_id}/{teaching_plan_item_id}/{uuid}-{safe_filename}`. Chỉ representative/global-write tải lên,
thay hoặc xóa; staff đúng phạm vi lớp tải bằng signed URL 60 giây. Guardian/student không có policy
đọc tài liệu. Các bucket đều dùng signed URL ngắn hạn; không public bucket cho dữ liệu cá nhân.

## 16. Index chính

- `profiles(lower(username))`.
- `students(student_code)`.
- `students(normalized_full_name, date_of_birth)`.
- `guardians(phone)`.
- `enrollments(student_id, academic_year_id, status)`.
- `classes(academic_year_id, grade_level_id)`.
- `attendance_sessions(class_id, attendance_date)`.
- `student_attendance_records(enrollment_id)`.
- `assessment_scores(enrollment_id)`.
- `teaching_plan_items(planned_date)`.
- `notification_recipients(profile_id, read_at)`.
- `equipment_loans(status, borrowed_at)`.
- `promotion_reviews(final_status)`.

## 17. RLS helper functions

Đặt trong schema `app`:

```sql
app.current_profile_id()
app.current_role()
app.is_super_admin()
app.can_global_read()
app.can_global_write()
app.current_sector_id()
app.can_access_sector(uuid)
app.can_access_class(uuid)
app.is_class_staff(uuid)
app.is_class_representative(uuid)
app.is_guardian_of_student(uuid)
app.is_self_student(uuid)
app.is_committee_member(uuid)
app.is_committee_leader_or_deputy(uuid)
```

Không tin claim client gửi. Role claim chỉ là tối ưu; database phải có thể kiểm chéo assignment active.

## 18. Migration order

1. Extensions/enums/helpers.
2. Identity/profiles/role assignments.
3. Academic years/sectors/grade levels/classes.
4. Staff/guardians/students/enrollments.
5. Sacraments/health.
6. Teaching plan.
7. Attendance.
8. Assessments/comments/leaderboards.
9. Promotions.
10. Committees/equipment.
11. Notifications/reports.
12. RLS/policies/views/RPC.
13. Seed/reference data.
14. Sa mạc ở Phase 8.

Mỗi migration phải chạy sạch từ database trống và không phụ thuộc thao tác tay trên dashboard.
