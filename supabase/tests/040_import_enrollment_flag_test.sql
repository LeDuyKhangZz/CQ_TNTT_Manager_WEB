begin;

-- M12-C — TO-BE 6 / BR-M12-39 / AC-24, và chốt chặn cho rủi ro của chính
-- migration `20260803000100`.
--
-- 🔴 Hai nhóm bài, và nhóm ĐẦU quan trọng hơn nhóm sau: `07_IMPLEMENTATION_IMPACT`
-- §2.3 xếp migration này rủi ro **trung bình** không phải vì phần nghiệp vụ mà
-- vì `drop function` **mang theo mọi quyền đã cấp**. Quên một dòng `grant
-- execute` là gãy toàn bộ luồng nhập cho mọi người dùng thật, và triệu chứng —
-- lỗi 42501 — trông hệt như lỗi RLS, tức phiên sau sẽ đi tìm ở nhầm chỗ. Ba bài
-- đầu canh đúng chỗ đó.
--
-- Nhóm sau canh điều lỗi 4.5 gây ra: dòng báo "đã ghi" trong khi em **không**
-- được xếp vào lớp ghi trong file, và không một dòng chữ nào nói ra.

select plan(20);

-- 1. Hàm còn đó, đúng chữ ký, và quyền vẫn nguyên -----------------------------
select has_function('public', 'commit_import_rows', array['uuid', 'uuid[]'], 'commit RPC vẫn tồn tại sau drop+create');
select ok(
  has_function_privilege('authenticated', 'public.commit_import_rows(uuid, uuid[])', 'execute'),
  'grant execute cho authenticated ĐƯỢC CẤP LẠI sau drop function'
);
select ok(
  not has_function_privilege('anon', 'public.commit_import_rows(uuid, uuid[])', 'execute'),
  'anon vẫn KHÔNG gọi được commit RPC'
);

-- Fixtures (superuser bypasses RLS) ------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sec-enr@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'SEC_ENR', 'Thư ký Ghi danh');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Thư ký Ghi danh', '0900000301');
insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000001', 'secretary');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f0000000-0000-4000-8000-000000000001', '2070-2071', 'Năm ghi danh', '2070-09-01', '2071-05-31', 'current', '2076-05-31');

-- Hai lớp: em đang học ở lớp A, file lại ghi lớp B.
insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('f6000000-0000-4000-8000-00000000000a', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 ENR'),
  ('f6000000-0000-4000-8000-00000000000b', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000011', 'Nghĩa 2 ENR');

insert into public.guardians (id, full_name, phone) values
  ('f2000000-0000-4000-8000-000000000001', 'Phụ huynh Ghi danh', '0911222333');

-- Hai em ĐÃ CÓ hồ sơ và ĐÃ CÓ ghi danh đang mở — đây là đường đi thường gặp
-- nhất của module: nhập lại sổ đầu năm sau khi sửa vài dòng.
insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Maria', 'Em Đã Có Lớp A', 'female', '2014-03-03'),
  ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001', 'Giuse', 'Em Đã Có Đúng Lớp', 'male', '2014-04-04');
insert into public.enrollments (student_id, academic_year_id, class_id) values
  ('f3000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-00000000000a'),
  ('f3000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-00000000000b');

insert into public.import_batches (id, filename, academic_year_id, uploaded_by, total_rows, valid_rows) values
  ('f4000000-0000-4000-8000-000000000001', 'Nghia_2.xlsx', 'f0000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 4, 4);

insert into public.import_rows (id, batch_id, row_number, raw_json, normalized_json, status, action, matched_student_id) values
  -- Dòng 1: ghép vào em đang học lớp A, nhưng file ghi lớp B.
  ('f5000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 1, '{}'::jsonb,
   jsonb_build_object('full_name', 'Em Đã Có Lớp A', 'gender', 'female', 'date_of_birth', '2014-03-03',
     'class_id', 'f6000000-0000-4000-8000-00000000000b'),
   'warning', 'merge', 'f3000000-0000-4000-8000-000000000001'),
  -- Dòng 2: em hoàn toàn mới ⇒ ghi danh PHẢI được tạo.
  ('f5000000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', 2, '{}'::jsonb,
   jsonb_build_object('full_name', 'Em Hoàn Toàn Mới', 'saint_name', 'Anna', 'gender', 'female',
     'date_of_birth', '2015-05-05', 'guardian_phone', '0911222333',
     'class_id', 'f6000000-0000-4000-8000-00000000000b'),
   'valid', 'create', null),
  -- Dòng 3: ghép vào em đã học ĐÚNG lớp trong file — câu cảnh báo phải khác.
  ('f5000000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000001', 3, '{}'::jsonb,
   jsonb_build_object('full_name', 'Em Đã Có Đúng Lớp', 'gender', 'male', 'date_of_birth', '2014-04-04',
     'class_id', 'f6000000-0000-4000-8000-00000000000b'),
   'warning', 'merge', 'f3000000-0000-4000-8000-000000000002'),
  -- Dòng 4: người duyệt chọn Bỏ qua.
  ('f5000000-0000-4000-8000-000000000004', 'f4000000-0000-4000-8000-000000000001', 4, '{}'::jsonb,
   jsonb_build_object('full_name', 'Em Bỏ Qua', 'gender', 'male', 'date_of_birth', '2015-06-06',
     'guardian_phone', '0911222444', 'class_id', 'f6000000-0000-4000-8000-00000000000b'),
   'valid', 'skip', null);

-- 2. Chạy lượt ghi bằng JWT thật của Thư ký -----------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);

create temporary table enr_result as
select * from public.commit_import_rows(
  'f4000000-0000-4000-8000-000000000001',
  array[
    'f5000000-0000-4000-8000-000000000001',
    'f5000000-0000-4000-8000-000000000002',
    'f5000000-0000-4000-8000-000000000003',
    'f5000000-0000-4000-8000-000000000004'
  ]::uuid[]
);

-- 3. Dòng vẫn `committed` — hồ sơ em CÓ thật, nói là lỗi thì sai --------------
select ok(
  (select out_committed from enr_result where out_row_number = 1),
  'dòng ghép em đã có lớp vẫn được ghi (hồ sơ có thật)'
);
select is(
  (select status::text from public.import_rows where id = 'f5000000-0000-4000-8000-000000000001'),
  'committed', 'dòng đó KHÔNG bị đánh dấu lỗi'
);

-- 4. …nhưng ghi danh thì KHÔNG được tạo, và cột mới nói ra điều đó ------------
select ok(
  (select not out_enrollment_created from enr_result where out_row_number = 1),
  'AC-24: out_enrollment_created = false khi em đã có ghi danh đang mở ở lớp khác'
);
select ok(
  (select out_enrollment_created from enr_result where out_row_number = 2),
  'em hoàn toàn mới thì out_enrollment_created = true'
);
select ok(
  (select not out_enrollment_created from enr_result where out_row_number = 3),
  'em đã học đúng lớp cũng là ghi danh KHÔNG được tạo'
);
select ok(
  (select not out_enrollment_created from enr_result where out_row_number = 4),
  'dòng Bỏ qua không tạo ghi danh nào'
);

-- 5. Lớp của em KHÔNG bị đổi — đây là thiệt hại thật mà lỗi 4.5 che đi --------
select is(
  (select class_id from public.enrollments
    where student_id = 'f3000000-0000-4000-8000-000000000001'
      and status in ('active', 'paused')),
  'f6000000-0000-4000-8000-00000000000a'::uuid,
  'em vẫn ở lớp cũ; lượt nhập không âm thầm chuyển lớp'
);
select is(
  (select count(*)::integer from public.enrollments
    where academic_year_id = 'f0000000-0000-4000-8000-000000000001'),
  3, 'chỉ đúng MỘT ghi danh mới được tạo (em hoàn toàn mới)'
);

-- 6. Cảnh báo nằm trên chính dòng đó, nêu ĐÚNG TÊN LỚP ------------------------
select ok(
  (select warnings_json @> jsonb_build_array(jsonb_build_object('field', 'enrollment'))
    from public.import_rows where id = 'f5000000-0000-4000-8000-000000000001'),
  'dòng mang cảnh báo field = enrollment'
);
select ok(
  (select bool_or(issue ->> 'message' like '%lớp không được thay đổi%')
    from public.import_rows,
      lateral jsonb_array_elements(warnings_json) as issue
    where id = 'f5000000-0000-4000-8000-000000000001'),
  'AC-24: câu cảnh báo nói lớp không được thay đổi'
);
select ok(
  (select bool_or(issue ->> 'message' like '%Nghĩa 1 ENR%')
    from public.import_rows,
      lateral jsonb_array_elements(warnings_json) as issue
    where id = 'f5000000-0000-4000-8000-000000000001'),
  'câu cảnh báo nêu ĐÚNG TÊN LỚP em đang học, không nói chung chung "lớp khác"'
);
select ok(
  (select bool_or(issue ->> 'message' like '%đúng lớp này%')
    from public.import_rows,
      lateral jsonb_array_elements(warnings_json) as issue
    where id = 'f5000000-0000-4000-8000-000000000003'),
  'em đã học đúng lớp nhận câu khác — không vu cho người nhập một lỗi không có'
);
select is(
  (select count(*)::integer
    from public.import_rows,
      lateral jsonb_array_elements(warnings_json) as issue
    where id = 'f5000000-0000-4000-8000-000000000001' and issue ->> 'field' = 'enrollment'),
  1, 'cảnh báo chỉ được thêm MỘT lần, không dồn thành mảng dài dần'
);
select ok(
  (select not (warnings_json @> jsonb_build_array(jsonb_build_object('field', 'enrollment')))
    from public.import_rows where id = 'f5000000-0000-4000-8000-000000000002'),
  'dòng ghi danh thành công KHÔNG mang cảnh báo thừa'
);

-- 7. Phần cũ của RPC không bị migration làm hỏng ------------------------------
select is(
  (select status::text from public.import_rows where id = 'f5000000-0000-4000-8000-000000000004'),
  'skipped', 'dòng Bỏ qua vẫn được ghi nhận là skipped'
);
select is(
  (select count(*)::integer from public.students where full_name = 'Em Hoàn Toàn Mới'),
  1, 'em mới được tạo đúng một hồ sơ'
);
select is(
  (select status::text from public.import_batches where id = 'f4000000-0000-4000-8000-000000000001'),
  'committed', 'lần nhập không còn dòng chờ và không dòng nào lỗi ⇒ đã ghi'
);

reset role;

select * from finish();
rollback;
