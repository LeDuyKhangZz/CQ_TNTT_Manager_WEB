begin;

select plan(22);

-- ============================================================================
-- IMP-BULK-002 — hai quyết định của chủ dự án ngày 2026-08-19, kiểm ở ranh giới
-- cơ sở dữ liệu chứ không chỉ ở giao diện:
--   1. nhập hàng loạt là việc của RIÊNG Super Admin;
--   2. hồ sơ thiếu dữ liệu vẫn ghi được, và người có tài khoản tự bổ sung được.
-- ============================================================================

-- ── Cấu trúc: năm cột đã nới ───────────────────────────────────────────────
select col_is_null('public', 'staff_profiles', 'phone', 'staff_profiles.phone cho phép trống');
select col_is_null('public', 'guardians', 'phone', 'guardians.phone cho phép trống');
select col_is_null('public', 'students', 'gender', 'students.gender cho phép trống');
select col_is_null('public', 'students', 'date_of_birth', 'students.date_of_birth cho phép trống');
select col_is_null('public', 'students', 'guardian_id', 'students.guardian_id cho phép trống');

-- Fixtures (superuser bypasses RLS) ------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('b9100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sa-bulk@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b9100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sec-bulk@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('b9100000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'glv-bulk@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('b9100000-0000-4000-8000-000000000001', 'SA_BULK', 'Quan tri vien'),
  ('b9100000-0000-4000-8000-000000000002', 'SEC_BULK', 'Thu ky'),
  ('b9100000-0000-4000-8000-000000000003', 'GLV_BULK', 'Giao ly vien lop');

-- Hồ sơ của GLV cố ý KHÔNG có số điện thoại: đúng hình dạng của một hồ sơ vừa
-- nhập hàng loạt từ sổ, và là thứ bài "tự bổ sung" ở cuối file cần tới.
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('b9700000-0000-4000-8000-000000000001', 'b9100000-0000-4000-8000-000000000001', 'anh', 'Quan tri vien', '0900009001'),
  ('b9700000-0000-4000-8000-000000000002', 'b9100000-0000-4000-8000-000000000002', 'chi', 'Thu ky', '0900009002'),
  ('b9700000-0000-4000-8000-000000000003', 'b9100000-0000-4000-8000-000000000003', 'anh', 'Giao ly vien lop', null);

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('b9000000-0000-4000-8000-000000000001', '2090-2091', 'Nam IMP-BULK-002',
   '2090-09-01', '2091-05-31', 'current', '2096-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('b9600000-0000-4000-8000-000000000001', 'b9000000-0000-4000-8000-000000000001',
   '20000000-0000-0000-0000-000000000010', 'Nghia 1 BULK');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('b9600000-0000-4000-8000-000000000001', 'b9700000-0000-4000-8000-000000000003', 'member', '2090-09-01');

insert into public.role_assignments (profile_id, role) values
  ('b9100000-0000-4000-8000-000000000001', 'super_admin'),
  ('b9100000-0000-4000-8000-000000000002', 'secretary');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('b9100000-0000-4000-8000-000000000003', 'class_teacher',
   'b9000000-0000-4000-8000-000000000001', 'b9600000-0000-4000-8000-000000000001', '2090-09-01');

insert into public.import_batches (id, filename, academic_year_id, uploaded_by, total_rows, valid_rows) values
  ('b9400000-0000-4000-8000-000000000001', 'so-len-lop.xlsx', 'b9000000-0000-4000-8000-000000000001',
   'b9100000-0000-4000-8000-000000000001', 1, 1);

-- Dòng chỉ có TÊN và LỚP: không giới tính, không ngày sinh, không phụ huynh.
-- Đây chính xác là hình dạng của 229/593 em trong sổ lên lớp của giáo xứ.
insert into public.import_rows (id, batch_id, row_number, raw_json, normalized_json, status, action) values
  ('b9500000-0000-4000-8000-000000000001', 'b9400000-0000-4000-8000-000000000001', 1,
   jsonb_build_object('full_name', 'Em Chi Co Ten'),
   jsonb_build_object(
     'full_name', 'Em Chi Co Ten',
     'class_id', 'b9600000-0000-4000-8000-000000000001'
   ),
   'warning', 'create');

-- ── Quyền: Thư ký (vẫn `can_global_write`) KHÔNG còn nhập được ─────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b9100000-0000-4000-8000-000000000002', true);

select ok(app.can_global_write(), 'Thu ky van thuoc nhom ghi toan xu doan');
select is(
  (select count(*)::integer from public.import_batches), 0,
  'Thu ky KHONG doc duoc lan nhap nao nua'
);
select throws_ok(
  $q$insert into public.import_batches (filename, academic_year_id, uploaded_by, total_rows)
    values ('cua-thu-ky.xlsx', 'b9000000-0000-4000-8000-000000000001', auth.uid(), 1)$q$,
  '42501', null, 'Thu ky khong dung duoc lan nhap'
);
select throws_ok(
  $q$select * from public.commit_import_rows(
      'b9400000-0000-4000-8000-000000000001',
      array['b9500000-0000-4000-8000-000000000001']::uuid[]
    )$q$,
  '42501', 'FORBIDDEN', 'Thu ky khong goi duoc RPC ghi'
);
select throws_ok(
  $q$select public.confirm_import_duplicate('b9500000-0000-4000-8000-000000000001', 'create')$q$,
  '42501', 'FORBIDDEN', 'Thu ky khong xac nhan duoc dong trung'
);

-- ── Quyền: Super Admin nhập được, và hồ sơ thiếu vẫn ghi ───────────────────
select set_config('request.jwt.claim.sub', 'b9100000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.import_batches), 1,
  'Quan tri vien doc duoc lan nhap'
);

create temporary table bulk_commit_result as
select * from public.commit_import_rows(
  'b9400000-0000-4000-8000-000000000001',
  array['b9500000-0000-4000-8000-000000000001']::uuid[]
);

select ok(
  (select out_committed from bulk_commit_result),
  'dong chi co ten van ghi duoc vao he thong'
);

select ok(
  (select gender is null and date_of_birth is null and guardian_id is null
     from public.students where full_name = 'Em Chi Co Ten'),
  'ba o chua biet duoc de TRONG, khong bi doan hay dien gia tri gia'
);

select is(
  (select count(*)::integer
     from public.enrollments as enrollment
     join public.students as student on student.id = enrollment.student_id
    where student.full_name = 'Em Chi Co Ten'),
  1,
  'em van duoc ghi danh vao lop — tuc diem danh va diem so dung duoc ngay'
);

-- ── Ai còn thiếu gì — nguồn cho lời nhắc tự bổ sung ────────────────────────
select ok(
  (select view.missing_gender and view.missing_date_of_birth and view.missing_guardian
     from public.v_incomplete_student_profiles as view
     join public.students as student on student.id = view.student_id
    where student.full_name = 'Em Chi Co Ten'),
  'view ho so chua day du neu dung ba o con trong'
);

-- ── Chuỗi rỗng vẫn là rác; NULL mới là "chưa biết" ─────────────────────────
reset role;
select throws_ok(
  $q$update public.staff_profiles set phone = '   ' where id = 'b9700000-0000-4000-8000-000000000003'$q$,
  '23514', null, 'khoang trang khong phai so dien thoai hop le'
);
select throws_ok(
  $q$insert into public.guardians (full_name, phone) values ('Cha Me', '  ')$q$,
  '23514', null, 'guardians.phone cung khong nhan khoang trang'
);
select lives_ok(
  $q$insert into public.guardians (full_name, phone) values ('Cha Me Chua Co So', null)$q$,
  'phu huynh chi co ten van tao duoc ho so'
);

-- ── Tự bổ sung hồ sơ của chính mình ────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b9100000-0000-4000-8000-000000000003', true);

update public.staff_profiles
   set phone = '0900009003', address = '12 Tran Binh Trong', updated_by = auth.uid()
 where id = 'b9700000-0000-4000-8000-000000000003';
select is(
  (select phone from public.staff_profiles where id = 'b9700000-0000-4000-8000-000000000003'),
  '0900009003',
  'Giao ly vien lop tu dien duoc so dien thoai cua chinh minh'
);

select throws_ok(
  $q$update public.staff_profiles
       set formation_level = 'iii'
     where id = 'b9700000-0000-4000-8000-000000000003'$q$,
  '23514', 'STAFF_SELF_UPDATE_FIELDS',
  'nhung KHONG tu nang duoc cap huan luyen cua minh'
);

select throws_ok(
  $q$update public.staff_profiles
       set full_name = 'Ten Khac'
     where id = 'b9700000-0000-4000-8000-000000000003'$q$,
  '23514', 'STAFF_SELF_UPDATE_FIELDS',
  'va KHONG tu doi duoc ho ten tren ho so'
);

-- RLS từ chối bằng **0 dòng**, không bằng ngoại lệ (SW-04). Phải đọc lại bằng
-- quyền chủ sở hữu: chính người này cũng KHÔNG đọc được hồ sơ của Thư ký, nên
-- đọc dưới phiên của họ chỉ nhận NULL và bài kiểm sẽ xanh vì lý do sai.
update public.staff_profiles
   set phone = '0900000000'
 where id = 'b9700000-0000-4000-8000-000000000002';

reset role;
select is(
  (select phone from public.staff_profiles where id = 'b9700000-0000-4000-8000-000000000002'),
  '0900009002',
  'RLS chan bang 0 dong: khong ai sua duoc ho so cua nguoi khac'
);

select * from finish();
rollback;
