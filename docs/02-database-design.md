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
| status | text: draft/current/closed/archived |
| top5_enabled | boolean |
| attendance_lock_days | smallint default 3 |
| attendance_edit_lease_minutes | smallint default 15 |
| retention_until | date |
| created_at/updated_at/updated_by | metadata |

Partial unique: tối đa một `current`.

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
| level_number | 1..3 |
| display_name | Chiên Con 1, Ấu 1, ... |
| next_grade_level_id | nullable self FK |
| is_sector_final_level | boolean |
| requires_sacrament_review | boolean |
| can_propose_trainee | boolean |
| is_active | boolean |
| sort_order | integer |

Seed:

- Chiên Con 1..3.
- Ấu 1..3.
- Thiếu 1..3.
- Nghĩa 1..3.
- Hiệp 1..2.

### 4.4 `classes`

| Cột | Kiểu/ghi chú |
|---|---|
| id | uuid PK |
| academic_year_id | FK |
| grade_level_id | FK |
| section_code | nullable text, `A`/`B` |
| display_name | text |
| status | active/inactive/closed |
| meeting_location | text nullable |
| notes | text nullable |
| created_at/updated_at/updated_by | metadata |

Unique: `(academic_year_id, grade_level_id, coalesce(section_code,''))`.

Check:

- Chỉ Ấu/Thiếu cho phép section A/B theo seed/config.
- Không tạo level ngoài `grade_levels`.
- `display_name` có thể được generated/validated từ grade + section.

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
| phone | text |
| email | text nullable |
| address | text nullable |
| avatar_path | text nullable |
| formation_level | none/I/II/III/special |
| service_status | active/paused/inactive |
| created_at/updated_at/updated_by | metadata |

Không lưu chứng chỉ GLV hoặc ngày bắt đầu phục vụ.

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
| phone | not null, normalized |
| address | nullable |
| status | active/inactive |
| created_at/updated_at/updated_by | |

Một guardian có nhiều students.

### 6.2 `students`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| profile_id | unique nullable FK profiles; chỉ tạo account từ Ấu Nhi |
| student_code | unique, tự sinh `CQ0001` |
| guardian_id | not null FK guardians |
| saint_name | not null |
| full_name | not null |
| gender | male/female/other |
| date_of_birth | date |
| patron_feast_date | date nullable |
| address | text nullable |
| phone | text nullable |
| hardship_flag | boolean default false |
| status | student_status |
| general_notes | text nullable |
| created_at/updated_at/updated_by | |

Không có cột ảnh.

Duplicate warning import dựa trên normalized name + birth date + guardian phone, không unique cứng.

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

Rules:

- `locked_at = finalized_at + academic_year.attendance_lock_days`.
- Lease hết hạn khi `last_activity_at + lease_minutes < now()`.
- Chỉ một editor hợp lệ.

### 7.2 `student_attendance_records`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| attendance_session_id | FK |
| enrollment_id | FK |
| mass_status | attendance_status |
| catechism_status | attendance_status |
| note | nullable |
| created_at/updated_at/updated_by | |

Unique `(attendance_session_id, enrollment_id)`.

Trigger:

- Enrollment phải thuộc class của session và đang mở tại ngày điểm danh.
- Khi session hoàn tất, mọi roster active phải có record.
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
| material_path | text nullable |
| teacher_staff_id | FK |
| item_type | lesson/assessment |
| assessment_id | nullable FK |
| note | nullable |
| created_at/updated_at/updated_by | |

Unique `(teaching_plan_id, planned_date)` theo yêu cầu một bài/tuần; nếu thực tế có nhiều mục một ngày, đổi thành `(plan_id, planned_date, sequence_no)`.

## 9. Kiểm tra và bảng điểm

### 9.1 `assessment_type_settings`

Theo academic year:

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| academic_year_id | FK |
| kind | assessment_kind |
| display_name | text |
| default_weight | numeric |
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
| weight | numeric > 0 |
| is_published | boolean |
| created_by | uuid |
| created_at/updated_at/updated_by | |

### 9.3 `assessment_scores`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| assessment_id | FK |
| enrollment_id | FK |
| score | numeric(4,2), 0..10 nullable |
| note | nullable |
| graded_by | uuid |
| graded_at | timestamptz |
| created_at/updated_at | |

Unique `(assessment_id, enrollment_id)`.

Trigger enrollment cùng class/year.

### 9.4 `attendance_score_overrides`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| class_id | FK |
| enrollment_id | FK |
| academic_year_id | FK |
| calculated_score | numeric |
| final_score | numeric |
| overridden_by | nullable |
| note | nullable |
| updated_at | |

### 9.5 `student_comments`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| enrollment_id | FK |
| visibility | comment_visibility |
| content | text |
| author_profile_id | FK |
| comment_date | date |
| created_at/updated_at/updated_by | |

### 9.6 `gradebook_locks`

| Cột | Ghi chú |
|---|---|
| class_id | PK/FK |
| locked_at | timestamptz |
| locked_by | uuid |
| unlocked_at | nullable |
| unlocked_by | nullable |
| is_locked | boolean |

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
| created_by | uuid |
| created_at/updated_at | |

### 9.8 `leaderboard_entries`

Dùng cho custom competition hoặc snapshot khi publish.

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| leaderboard_id | FK |
| enrollment_id | FK |
| rank | smallint 1..5 |
| score | numeric nullable |
| title | nullable |
| created_at | |

Unique rank và enrollment trong leaderboard.

## 10. Chuyển lớp

### `promotion_reviews`

| Cột | Ghi chú |
|---|---|
| id | uuid PK |
| source_enrollment_id | unique FK |
| proposed_target_class_id | nullable FK |
| proposed_status | promotion_status |
| warning_snapshot | jsonb |
| representative_note | nullable |
| proposed_by | uuid |
| proposed_at | timestamptz |
| reviewed_by | nullable uuid |
| reviewed_at | nullable |
| review_note | nullable |
| final_status | promotion_status |
| created_enrollment_id | nullable FK |
| created_at/updated_at | |

Quy tắc:

- Chỉ representative đề nghị.
- Sector leader/deputy cùng ngành duyệt.
- Target class phải là next grade hoặc same grade khi repeat; A/B được đổi.
- Hiệp 2 có target null và `propose_trainee = true` trong field bổ sung.
- Approval tạo enrollment mới nguyên tử trong RPC.

## 11. Ban và thiết bị

### 11.1 `committees`

- id, code, name, description, is_active, created_at, updated_at.

Seed 6 Ban.

### 11.2 `committee_memberships`

- id.
- committee_id.
- staff_profile_id.
- position.
- starts_on/ends_on.
- is_active.

Constraint bằng trigger: một staff tối đa hai membership active.

### 11.3 `committee_announcements`

- committee_id, title, content, author_staff_id, published_at.

Chỉ leader/deputy.

### 11.4 `committee_meetings`

- committee_id, title, starts_at, ends_at, location, note, created_by.

### 11.5 `committee_weekly_plans`

- committee_id, week_start, content, checklist_json, created_by.

Không giao assignee/deadline trong v1.

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
- borrower_staff_id.
- handed_over_by.
- borrowed_at.
- expected_return_at nullable.
- returned_at nullable.
- received_by nullable.
- borrow_note.
- return_note.
- condition_on_return.
- status.

Constraint số lượng > 0 và không vượt available; thao tác mượn/trả nên qua RPC có row lock.

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

### 12.2 `notification_recipients`

Materialize người nhận khi publish:

- notification_id.
- profile_id.
- delivered_at.
- read_at.

Unique `(notification_id, profile_id)`.

Điều này giúp đếm chưa đọc ổn định ngay cả khi người dùng đổi lớp/role sau đó.

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

Snapshot final không update/delete bằng user flow.

### 13.2 View đề xuất

- `v_student_attendance_summary`.
- `v_class_attendance_summary`.
- `v_staff_attendance_summary`.
- `v_student_weighted_average`.
- `v_students_at_risk`.
- `v_dashboard_summary`.
- `v_guardian_children`.
- `v_next_teaching_item`.

Tất cả `security_invoker`.

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

Dùng signed URL ngắn hạn. Không public bucket cho dữ liệu cá nhân.

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
