begin;

-- ============================================================================
-- M07-B — bốn thay đổi phân quyền + hai thay đổi nghiệp vụ của module Bảng
-- điểm, kiểm bằng **JWT thật của từng vai trò**. Không một dòng nào chạy bằng
-- service role sau `set local role authenticated` (`CLAUDE.md` §4).
--
--   D-74 + D-151  🔴 SIẾT — chỉ đại diện lớp · Giáo lý viên lớp · Super Admin
--                    khóa được bảng điểm. Ba vai trò cấp xứ đoàn mất quyền.
--   AC-10-02         — khóa lần hai không đẩy lùi mốc khóa.
--   TB-M07-01        — xóa cứng cột chưa có điểm · ẩn mềm cột đã có điểm.
--   TB-M07-03 b6     — cờ "chỉnh tay" chỉ bật khi điểm KHÁC đề xuất.
--   D-152         🔴 SIẾT — chỉ tác giả · đại diện lớp · cấp xứ đoàn sửa/xóa
--                    được một nhận xét.
--   Nợ #18        🔴 SIẾT — năm học đã đóng không nhận ghi; Super Admin ngoại
--                    lệ (D-117).
--
-- 🔴 **Hai cơ chế chặn khác nhau trong CÙNG một module, và bài kiểm phải đo
-- đúng cơ chế của từng bảng** — đây là bài học M05-A, và nó có mặt ở đây:
--   · `assessments` · `student_comments` · `leaderboards` chặn bằng **policy**
--     ⇒ policy `using` **lọc dòng trong im lặng**, nên đo **KẾT QUẢ** (số dòng
--     còn lại), không đo ngoại lệ.
--   · `assessment_scores` chặn bằng **RPC `security definer`** ⇒ có ngoại lệ
--     thật, đo bằng `throws_ok`.
-- Đo nhầm cơ chế là dựng một bài kiểm xanh vĩnh viễn.
-- ============================================================================

select plan(54);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('e1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teacher-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'secretary-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trainee-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'closed-rep-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deputy-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-lock@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('e1000000-0000-4000-8000-000000000001', 'G_REP',  'Đại diện Ấu 1A'),
  ('e1000000-0000-4000-8000-000000000002', 'G_TEA',  'Giáo lý viên lớp'),
  ('e1000000-0000-4000-8000-000000000003', 'G_SCR',  'Thư ký'),
  ('e1000000-0000-4000-8000-000000000004', 'G_LEAD', 'Xứ đoàn trưởng'),
  ('e1000000-0000-4000-8000-000000000005', 'G_ADM',  'Quản trị hệ thống'),
  ('e1000000-0000-4000-8000-000000000006', 'G_TRN',  'Dự trưởng phụ tá'),
  ('e1000000-0000-4000-8000-000000000007', 'G_OLD',  'Đại diện lớp năm đã đóng'),
  ('e1000000-0000-4000-8000-000000000008', 'G_DEP',  'Phó Xứ đoàn'),
  ('e1000000-0000-4000-8000-000000000009', 'G_GUA',  'Phụ huynh');

-- `trainee_can_grade` bật để chứng minh đợt này siết **đúng một việc**: Dự
-- trưởng phụ tá vẫn chấm điểm được, chỉ mất quyền KHÓA.
insert into public.academic_years
  (id, code, name, start_date, end_date, status, retention_until, top5_enabled, trainee_can_grade, trainee_can_comment)
values
  ('e0000000-0000-4000-8000-000000000001', '2090-2091', 'Năm bảng điểm', '2090-09-01', '2091-05-31', 'draft', '2096-05-31', true, true, true),
  ('e0000000-0000-4000-8000-000000000002', '2089-2090', 'Năm đã đóng', '2089-09-01', '2090-05-31', 'draft', '2095-05-31', true, true, true);

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Lock'),
  ('e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu 2A Đã đóng');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e7000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Ấu 1A', '0940000001'),
  ('e7000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'chi', 'Giáo lý viên lớp', '0940000002'),
  ('e7000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003', 'chi', 'Thư ký', '0940000003'),
  ('e7000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004', 'anh', 'Xứ đoàn trưởng', '0940000004'),
  ('e7000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000006', 'anh', 'Dự trưởng phụ tá', '0940000006'),
  ('e7000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000007', 'chi', 'Đại diện năm cũ', '0940000007'),
  ('e7000000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000008', 'chi', 'Phó Xứ đoàn', '0940000008');

-- Sổ đội ngũ phải có TRƯỚC vai trò lớp (BR-A17), và `capacity` phải khớp vai
-- trò: đại diện ↔ representative · Giáo lý viên ↔ member · Dự trưởng ↔ trainee.
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000001', 'representative', '2090-09-01'),
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000002', 'member',         '2090-09-01'),
  ('e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000006', 'trainee',        '2090-09-01'),
  ('e6000000-0000-4000-8000-000000000002', 'e7000000-0000-4000-8000-000000000007', 'representative', '2089-09-01');

insert into public.guardians (id, profile_id, full_name, phone) values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000009', 'Phụ huynh Lock', '0940000009');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('e3000000-0000-4000-8000-000000000001', null, 'e2000000-0000-4000-8000-000000000001', 'Maria', 'Trò Khóa Một', 'female', '2016-01-01'),
  ('e3000000-0000-4000-8000-000000000002', null, 'e2000000-0000-4000-8000-000000000001', 'Anna',  'Trò Khóa Hai', 'female', '2016-02-02'),
  -- `guardians` là NOT NULL trên `students` — dùng lại đúng người giám hộ ở
  -- trên; em này chỉ tồn tại để lớp của năm đã đóng có một ghi danh.
  ('e3000000-0000-4000-8000-000000000003', null, 'e2000000-0000-4000-8000-000000000001', 'Teresa', 'Trò Năm Cũ', 'female', '2015-03-03');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('e4000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2090-09-01'),
  ('e4000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'active', '2090-09-01'),
  ('e4000000-0000-4000-8000-000000000003', 'e3000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000002', 'active', '2089-09-01');

insert into public.role_assignments (profile_id, role) values
  ('e1000000-0000-4000-8000-000000000003', 'secretary'),
  ('e1000000-0000-4000-8000-000000000004', 'group_leader'),
  ('e1000000-0000-4000-8000-000000000005', 'super_admin'),
  ('e1000000-0000-4000-8000-000000000008', 'deputy_group_leader'),
  ('e1000000-0000-4000-8000-000000000009', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('e1000000-0000-4000-8000-000000000001', 'class_representative', 'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000002', 'class_teacher',        'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000006', 'trainee_assistant',    'e0000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000007', 'class_representative', 'e0000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000002');

-- gA01 cột RỖNG (chỉ có dòng điểm null) — ca xóa cứng được.
-- gA02 cột đã có điểm thật      — ca chỉ ẩn được.
-- gA03 cột là NGUỒN của Top 5   — ca bị chặn bởi khoá ngoại.
-- gA04 cột chuyên cần            — ca cờ "chỉnh tay".
-- gA05 cột của năm đã đóng       — ca nợ #18.
-- gA06 cột đã công bố            — ca ẩn cột trước mắt phụ huynh.
insert into public.assessments
  (id, class_id, academic_year_id, kind, title, weight, attendance_component, is_published, created_by, updated_by)
values
  ('ea000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Cột tạo nhầm',   1, null,   false, 'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'),
  ('ea000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'midterm',  'Giữa kỳ',        2, null,   false, 'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'),
  ('ea000000-0000-4000-8000-000000000003', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'quiz_15m', 'Nguồn Top 5',    1, null,   false, 'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'),
  ('ea000000-0000-4000-8000-000000000004', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'attendance', 'Chuyên cần Lễ', 1, 'mass', false, 'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'),
  ('ea000000-0000-4000-8000-000000000005', 'e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'midterm',  'Giữa kỳ năm cũ', 2, null,   false, 'e1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000007'),
  ('ea000000-0000-4000-8000-000000000006', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'final',    'Cuối kỳ',        3, null,   true,  'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001');

insert into public.assessment_scores
  (assessment_id, enrollment_id, class_id, academic_year_id, student_id, score, system_suggested_score)
values
  -- Hai dòng RỖNG của cột tạo nhầm — đúng loại rác mà lỗi "ghi cả roster" sinh ra.
  ('ea000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', null, null),
  ('ea000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000002', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000002', null, null),
  ('ea000000-0000-4000-8000-000000000002', 'e4000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 10, null),
  ('ea000000-0000-4000-8000-000000000006', 'e4000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 5, null),
  -- Ô chuyên cần đã có đề xuất 8 — dựng thẳng thay vì đi qua cả đường điểm
  -- danh, vì bài này đo **luật đóng dấu**, không đo phép tính chuyên cần.
  ('ea000000-0000-4000-8000-000000000004', 'e4000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 8, 8);

insert into public.leaderboards
  (id, class_id, academic_year_id, title, source_type, source_assessment_id, created_by, updated_by)
values
  ('e5000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'Top 5 dùng cột nguồn', 'assessment', 'ea000000-0000-4000-8000-000000000003',
   'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001');

-- Dựng lịch sử theo thứ tự hợp lệ trước khi đo year gate.
update public.academic_years
set status = 'closed'
where id = 'e0000000-0000-4000-8000-000000000002';

set local role authenticated;

-- 🔴 Ba nhận xét của HAI tác giả khác nhau — không có cặp này thì D-152 không đo
-- được. Và chúng **phải** được ghi sau `set local role authenticated`: trigger
-- `sync_student_comment_keys` đặt `author_profile_id := auth.uid()`, nên dựng
-- bằng quyền superuser thì tác giả ra `null` và bảng từ chối.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
insert into public.student_comments (id, enrollment_id, visibility, content) values
  ('ec000000-0000-4000-8000-000000000001', 'e4000000-0000-4000-8000-000000000001', 'staff_only', 'Nhận xét của đại diện');
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
insert into public.student_comments (id, enrollment_id, visibility, content) values
  ('ec000000-0000-4000-8000-000000000002', 'e4000000-0000-4000-8000-000000000001', 'staff_only', 'Nhận xét của GLV lớp'),
  ('ec000000-0000-4000-8000-000000000003', 'e4000000-0000-4000-8000-000000000002', 'staff_only', 'Nhận xét thứ ba');

-- ════════════════════════════════════════════════════════════════════════════
-- A · D-74 + D-151 — AI KHÓA ĐƯỢC BẢNG ĐIỂM
--
-- Ba vai trò cấp xứ đoàn phải kiểm **cả ba**: `docs/05` xếp chúng vào cùng một
-- ô, và siết hụt một vai trò là để nguyên lỗ hổng mà biên bản nghiệm thu tưởng
-- đã bịt — đúng lời dặn của M06-B.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
select ok(not app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-74: thư ký mất quyền khóa bảng điểm');
select throws_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-74: thư ký gọi thẳng RPC vẫn bị từ chối ở tầng cơ sở dữ liệu (AC-10-01)'
);
select is((select count(*)::integer from public.assessments where class_id = 'e6000000-0000-4000-8000-000000000001'), 5, 'D-74: thư ký vẫn ĐỌC đủ bảng điểm — siết đúng một việc');

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000004', true);
select ok(not app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-74: Xứ đoàn trưởng mất quyền khóa bảng điểm');
select throws_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-74: Xứ đoàn trưởng gọi thẳng RPC vẫn bị từ chối'
);

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000008', true);
select ok(not app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-74: Phó Xứ đoàn mất quyền khóa bảng điểm');

-- Dự trưởng phụ tá: bảng D-74 ghi ❌ **dù** năm học bật cờ cho họ chấm điểm.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000006', true);
select ok(app.can_grade_class('e6000000-0000-4000-8000-000000000001'), 'Dự trưởng phụ tá vẫn CHẤM ĐIỂM được — đợt này không siết nhầm chỗ');
select ok(not app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-74: Dự trưởng phụ tá không khóa được bảng điểm');
select throws_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-74: Dự trưởng phụ tá gọi thẳng RPC vẫn bị từ chối'
);

-- Giáo lý viên lớp — nhóm được D-74 **nới thêm** so với `docs/05` cũ.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select ok(app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-74: Giáo lý viên lớp khóa được bảng điểm lớp mình');
select lives_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  'D-74: và lượt khóa của Giáo lý viên lớp chạy thật'
);
select ok((select is_locked from public.gradebook_locks where class_id = 'e6000000-0000-4000-8000-000000000001'), 'bảng điểm đã ở trạng thái khóa');

-- 🔴 AC-10-02 — khóa lần hai là **vô hại**. Bản cũ ghi `locked_at = now()` vô
-- điều kiện, nên hai người cùng bấm "Khóa" cách nhau một giờ là mốc khóa nhảy
-- theo người bấm sau, và mốc ấy là thứ duy nhất trả lời được câu "bảng điểm
-- chốt lúc nào".
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  'AC-10-02: khóa lần hai không ném lỗi'
);
select is(
  (select count(distinct locked_by)::integer from public.gradebook_locks where class_id = 'e6000000-0000-4000-8000-000000000001'),
  1, 'AC-10-02: người khóa vẫn là người bấm ĐẦU TIÊN, không bị người sau ghi đè'
);
select is(
  (select locked_by from public.gradebook_locks where class_id = 'e6000000-0000-4000-8000-000000000001'),
  'e1000000-0000-4000-8000-000000000002'::uuid,
  'AC-10-02: và đó đúng là Giáo lý viên lớp đã bấm trước'
);

-- AC-01-04 — bảng điểm đã khóa thì chặn cả xóa lẫn ẩn cột.
select throws_ok(
  $$select public.delete_assessment('ea000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'AC-01-04: bảng điểm đã khóa thì không xóa được cột'
);
update public.assessments set is_active = false, updated_by = 'e1000000-0000-4000-8000-000000000001'
where id = 'ea000000-0000-4000-8000-000000000001';
select ok(
  (select is_active from public.assessments where id = 'ea000000-0000-4000-8000-000000000001'),
  'AC-01-04: bảng điểm đã khóa thì cũng không ẩn được cột'
);

-- Mở khóa vẫn chỉ Super Admin (D-38 giữ nguyên), rồi D-151 cho chính họ khóa lại.
select throws_ok(
  $$select public.unlock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'D-38: đại diện lớp KHÔNG mở khóa được'
);
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$select public.unlock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  'D-38: Super Admin mở khóa được'
);
select ok(app.can_lock_gradebook('e6000000-0000-4000-8000-000000000001'), 'D-151: Super Admin khóa được — đường thoát khi cả lớp không thao tác kịp');
select lives_ok(
  $$select public.lock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  'D-151: và lượt khóa của Super Admin chạy thật'
);
select lives_ok(
  $$select public.unlock_gradebook('e6000000-0000-4000-8000-000000000001')$$,
  'mở khóa lại để các phần sau chạy trên bảng điểm đang mở'
);

-- ════════════════════════════════════════════════════════════════════════════
-- B · TB-M07-01 — XÓA CỨNG / ẨN MỀM CỘT ĐIỂM
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);

-- AC-01-01 — cột chỉ có dòng RỖNG: xóa được, và dọn luôn hai dòng rác.
-- 🔴 Đây đúng là ca mà bản cũ **không làm được**: khoá ngoại `on delete restrict`
-- chặn lại vì có dòng, và người dùng đọc "Cột đã có điểm" khi chưa nhập gì.
select is(
  (select public.delete_assessment('ea000000-0000-4000-8000-000000000001')),
  2, 'AC-01-01: xóa cột chưa có điểm và dọn đúng 2 dòng rỗng'
);
select is(
  (select count(*)::integer from public.assessments where id = 'ea000000-0000-4000-8000-000000000001'),
  0, 'AC-01-01: cột biến mất khỏi bảng điểm'
);
select is(
  (select count(*)::integer from public.assessment_scores where assessment_id = 'ea000000-0000-4000-8000-000000000001'),
  0, 'AC-01-01: và các dòng điểm rỗng của nó cũng biến mất'
);

-- AC-01-02 — cột đã có điểm thật: chặn, **và dữ liệu còn nguyên**.
select throws_ok(
  $$select public.delete_assessment('ea000000-0000-4000-8000-000000000002')$$,
  '23514', null, 'AC-01-02: không xóa cứng được cột đã có điểm'
);
select is(
  (select score from public.assessment_scores
   where assessment_id = 'ea000000-0000-4000-8000-000000000002'
     and enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  10.00::numeric, 'AC-01-02: điểm đã nhập còn nguyên sau lượt xóa bị từ chối'
);

-- Cửa thứ hai, không có trong tài liệu: cột đang là **nguồn của một bảng Top 5**.
select throws_ok(
  $$select public.delete_assessment('ea000000-0000-4000-8000-000000000003')$$,
  '23514', null, 'cột đang là nguồn Top 5 thì chặn ở RPC, không để khoá ngoại trả lời hộ'
);

-- AC-01-03 — ẩn cột phải có hiệu lực ở MỌI nơi, kể cả cổng phụ huynh.
-- Em này có điểm ở **ba** cột: Giữa kỳ 10 (hệ số 2) · Cuối kỳ 5 (hệ số 3) ·
-- Chuyên cần 8 (hệ số 1) ⇒ (10×2 + 5×3 + 8×1)/6 = 43/6 = **7,17**.
select is(
  (select weighted_average from public.v_student_weighted_average
   where enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  7.17::numeric, 'trước khi ẩn: trung bình tính trên cả ba cột đang hiện'
);
select lives_ok(
  $$update public.assessments set is_active = false, updated_by = 'e1000000-0000-4000-8000-000000000001'
    where id = 'ea000000-0000-4000-8000-000000000006'$$,
  'AC-01-03: ẩn được cột đã có điểm'
);
select is(
  (select weighted_average from public.v_student_weighted_average
   where enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  -- Bỏ cột Cuối kỳ ra: (10×2 + 8×1)/3 = 28/3 = **9,33**. Cột ẩn rời khỏi CẢ
  -- tử số lẫn mẫu số — nếu chỉ rời tử số thì trung bình sẽ tụt, và đó là loại
  -- sai âm thầm mà ba module M08/M11/M13 sẽ tiêu thụ tiếp.
  9.33::numeric, 'AC-01-03: trung bình tính lại NGAY, không cần thao tác thêm'
);
select ok(
  not (select assessment_published from public.assessment_scores
       where assessment_id = 'ea000000-0000-4000-8000-000000000006'
         and enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  'AC-01-03: điểm của cột đã ẩn mất luôn cờ công bố'
);

-- 🔴 Và đây là nửa quan trọng nhất: đo bằng **JWT của phụ huynh**, không đo
-- bằng truy vấn của ứng dụng. Một bất biến chỉ đúng ở tầng ứng dụng thì không
-- phải bất biến — phụ huynh gọi thẳng Data API là qua hết.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000009', true);
select is(
  (select count(*)::integer from public.assessments where class_id = 'e6000000-0000-4000-8000-000000000001'),
  0, 'AC-01-03: phụ huynh không còn thấy cột đã ẩn, kể cả khi gọi thẳng cơ sở dữ liệu'
);
select is(
  (select count(*)::integer from public.assessment_scores
   where assessment_id = 'ea000000-0000-4000-8000-000000000006'),
  0, 'AC-01-03: và cũng không thấy điểm của cột đã ẩn'
);

-- ════════════════════════════════════════════════════════════════════════════
-- C · TB-M07-03 bước 6 / BR-M07-31 / AC-03-03 — CỜ "CHỈNH TAY"
--
-- Ô đang có điểm 8, đề xuất hệ thống 8.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select is(
  (select public.save_assessment_scores(
     'ea000000-0000-4000-8000-000000000004',
     '[{"enrollmentId":"e4000000-0000-4000-8000-000000000001","score":8}]'::jsonb)),
  1, 'lưu lại đúng giá trị đề xuất vẫn là một lượt ghi hợp lệ'
);
select ok(
  not (select is_manual_override from public.assessment_scores
       where assessment_id = 'ea000000-0000-4000-8000-000000000004'
         and enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  'AC-03-03: lưu đúng giá trị máy đề xuất thì KHÔNG bị đóng dấu "chỉnh tay"'
);
select is(
  (select public.save_assessment_scores(
     'ea000000-0000-4000-8000-000000000004',
     '[{"enrollmentId":"e4000000-0000-4000-8000-000000000001","score":6}]'::jsonb)),
  1, 'sửa tay một ô chuyên cần'
);
select ok(
  (select is_manual_override from public.assessment_scores
   where assessment_id = 'ea000000-0000-4000-8000-000000000004'
     and enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  'BR-M07-31: điểm KHÁC đề xuất thì mới được đóng dấu "chỉnh tay"'
);
select is(
  (select public.save_assessment_scores(
     'ea000000-0000-4000-8000-000000000004',
     '[{"enrollmentId":"e4000000-0000-4000-8000-000000000001","score":8}]'::jsonb)),
  1, 'gõ trả lại đúng con số máy đề xuất'
);
select ok(
  not (select is_manual_override from public.assessment_scores
       where assessment_id = 'ea000000-0000-4000-8000-000000000004'
         and enrollment_id = 'e4000000-0000-4000-8000-000000000001'),
  'BR-M07-31: và dấu "chỉnh tay" tự gỡ — luật đọc GIÁ TRỊ, không đọc lịch sử thao tác'
);

-- ════════════════════════════════════════════════════════════════════════════
-- D · TB-M07-05 / BR-M07-33 / D-152 — AI SỬA/XÓA ĐƯỢC NHẬN XÉT
--
-- Policy chặn bằng cách **lọc dòng**, nên đo KẾT QUẢ chứ không đo ngoại lệ.
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
delete from public.student_comments where id = 'ec000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.student_comments where id = 'ec000000-0000-4000-8000-000000000001'),
  1, 'D-152: Giáo lý viên lớp KHÔNG xóa được nhận xét của người khác'
);
-- 🔴 Cửa thứ hai: siết mỗi DELETE thì sửa nội dung vẫn đi lọt, cùng một thiệt
-- hại qua một cái cửa khác — và còn giữ nguyên tên tác giả cũ.
update public.student_comments
set content = 'Bị người khác sửa', updated_by = 'e1000000-0000-4000-8000-000000000002'
where id = 'ec000000-0000-4000-8000-000000000001';
select is(
  (select content from public.student_comments where id = 'ec000000-0000-4000-8000-000000000001'),
  'Nhận xét của đại diện', 'D-152: và cũng KHÔNG sửa được nội dung nhận xét của người khác'
);
-- Chính bài của mình thì vẫn làm chủ được.
delete from public.student_comments where id = 'ec000000-0000-4000-8000-000000000002';
select is(
  (select count(*)::integer from public.student_comments where id = 'ec000000-0000-4000-8000-000000000002'),
  0, 'D-152: tác giả vẫn xóa được nhận xét của chính mình'
);

-- Đại diện lớp — nhánh chủ dự án chốt thêm so với nguyên văn tài liệu.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
delete from public.student_comments where id = 'ec000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::integer from public.student_comments where id = 'ec000000-0000-4000-8000-000000000003'),
  0, 'D-152: Giáo lý viên đại diện xóa được nhận xét của người khác trong lớp mình'
);

-- Cấp xứ đoàn giữ nguyên quyền — nhánh `can_global_write` của BR-M07-33.
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
delete from public.student_comments where id = 'ec000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.student_comments where id = 'ec000000-0000-4000-8000-000000000001'),
  0, 'BR-M07-33: nhóm cấp xứ đoàn vẫn xóa được nhận xét của người khác'
);

-- ════════════════════════════════════════════════════════════════════════════
-- E · NỢ #18 — NĂM HỌC ĐÃ ĐÓNG KHÔNG NHẬN GHI
--
-- Bốn bảng, **hai cơ chế**: ba bảng chặn bằng policy (đo kết quả), riêng
-- `assessment_scores` chặn trong RPC (đo ngoại lệ).
-- ════════════════════════════════════════════════════════════════════════════

select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000007', true);
select ok(app.can_grade_class('e6000000-0000-4000-8000-000000000002'), 'đại diện lớp năm cũ vẫn đủ quyền chấm — cái chặn phải là NĂM HỌC, không phải vai trò');
select throws_ok(
  $$insert into public.assessments (class_id, academic_year_id, kind, title, weight, created_by, updated_by)
    values ('e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'quiz_15m', 'Cột năm đã đóng', 1,
            'e1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000007')$$,
  '42501', null, 'nợ #18: không thêm được cột điểm vào năm học đã đóng'
);
update public.assessments set title = 'Đổi tên năm đã đóng', updated_by = 'e1000000-0000-4000-8000-000000000007'
where id = 'ea000000-0000-4000-8000-000000000005';
select is(
  (select title from public.assessments where id = 'ea000000-0000-4000-8000-000000000005'),
  'Giữa kỳ năm cũ', 'nợ #18: không sửa được cột điểm của năm học đã đóng'
);
delete from public.assessments where id = 'ea000000-0000-4000-8000-000000000005';
select is(
  (select count(*)::integer from public.assessments where id = 'ea000000-0000-4000-8000-000000000005'),
  1, 'nợ #18: và cũng không xóa được'
);
select throws_ok(
  $$select public.save_assessment_scores(
      'ea000000-0000-4000-8000-000000000005',
      '[{"enrollmentId":"e4000000-0000-4000-8000-000000000003","score":9}]'::jsonb)$$,
  '42501', null, 'nợ #18: RPC lưu điểm tự chặn — policy đứng ngoài đường security definer'
);
select throws_ok(
  $$insert into public.student_comments (enrollment_id, class_id, academic_year_id, student_id, visibility, content, author_profile_id, updated_by)
    values ('e4000000-0000-4000-8000-000000000003', 'e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002',
            'e3000000-0000-4000-8000-000000000003', 'staff_only', 'Nhận xét năm đã đóng',
            'e1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000007')$$,
  '42501', null, 'nợ #18: không thêm được nhận xét vào năm học đã đóng'
);
select throws_ok(
  $$insert into public.leaderboards (class_id, academic_year_id, title, source_type, created_by, updated_by)
    values ('e6000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'Top 5 năm đã đóng',
            'final_average', 'e1000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000007')$$,
  '42501', null, 'nợ #18: không tạo được bảng Top 5 trong năm học đã đóng'
);

-- D-117 — ngoại lệ Super Admin, y như `enrollments`/`classes` (M02-C),
-- `attendance` (M05-A) và `teaching_plans` (M06-B).
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$update public.assessments set title = 'Super Admin sửa năm đã đóng', updated_by = 'e1000000-0000-4000-8000-000000000005'
    where id = 'ea000000-0000-4000-8000-000000000005'$$,
  'D-117: Super Admin vẫn ghi được vào năm học đã đóng'
);
select is(
  (select title from public.assessments where id = 'ea000000-0000-4000-8000-000000000005'),
  'Super Admin sửa năm đã đóng', 'D-117: và thay đổi ấy ghi xuống thật, không phải 0 dòng im lặng'
);

select * from finish();
rollback;
