begin;

select plan(22);

-- ============================================================================
-- M12-A — hàng rào của lần nhập Excel, **kiểm bằng JWT thật** (`11` §5 mục 15).
-- Không dùng service role ở bất kỳ bài nào (`CLAUDE.md` §4).
--
-- 🔴 Vì sao bộ này tồn tại: lỗi CRITICAL 4.2 của `03_AUDIT_RESULTS` là nút "Xoá
-- lần nhập này" xoá được cả lần nhập **đã ghi dữ liệu**, cuốn theo mối nối
-- "dòng nào tạo ra em nào" (`import_rows.created_student_id`, `on delete
-- cascade`). Sửa ở Server Action là chưa đủ: policy `import_batches_delete_*`
-- mở `delete` cho **mọi** vai trò `app.can_global_write()`, nên một lệnh DELETE
-- gọi thẳng Data API bằng JWT thật của Thư ký vẫn xoá được. Bộ này đi **đường
-- vòng đó**, không đi qua giao diện.
--
--   1. AC-16 / BR-M12-34 — lần nhập đã ghi: DELETE = 0 dòng, hàng còn nguyên.
--   2. AC-17 / BR-M12-35 / D-131 — lần nhập chưa ghi: đánh dấu `cancelled` được,
--      và **không** hạ được một lần nhập đã ghi xuống `cancelled`.
--   3. D-132 — xoá `raw_json` được, nhưng `created_student_id` phải ở lại.
--   4. Đối chứng âm tính: Giáo lý viên lớp không đụng được gì (ranh giới cũ
--      không nhúc nhích sau đợt này).
--
-- ⚠️ Năm học dùng mã riêng và **không bài nào chốt cứng số đếm toàn cục**, để
-- file chạy được cả trên DB vừa reset lẫn sau `seed:dev` (bài học M03-A).
-- ============================================================================

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('c1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'im-tk@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('c1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'im-glv@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('c1000000-0000-4000-8000-000000000001', 'IM_TK', 'Thư ký M12A'),
  ('c1000000-0000-4000-8000-000000000002', 'IM_GLV', 'Giáo lý viên M12A');

insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c7000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'anh', 'Thư ký M12A', '0900001201'),
  ('c7000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'anh', 'Giáo lý viên M12A', '0900001202');

insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('c0000000-0000-4000-8000-000000000001', '2070-2071', 'Năm nhập M12A', '2070-09-01', '2071-05-31', 'draft', '2076-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, display_name) values
  ('c6000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000010', 'Nghĩa 1 M12A');

insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('c6000000-0000-4000-8000-000000000001', 'c7000000-0000-4000-8000-000000000002', 'member', '2070-09-01');

insert into public.role_assignments (profile_id, role) values
  ('c1000000-0000-4000-8000-000000000001', 'secretary');
-- Vai trò LỚP đòi đủ phạm vi năm học + lớp (`validate_role_assignment_scope`).
insert into public.role_assignments (profile_id, role, academic_year_id, class_id, starts_on) values
  ('c1000000-0000-4000-8000-000000000002', 'class_teacher',
   'c0000000-0000-4000-8000-000000000001', 'c6000000-0000-4000-8000-000000000001', '2070-09-01');

insert into public.guardians (id, full_name, phone) values
  ('c2000000-0000-4000-8000-000000000001', 'Phụ huynh M12A', '0900001301');

insert into public.students (id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'Maria', 'Em Đã Nhập M12A', 'female', '2015-05-05');

-- Ba lần nhập: một đã ghi, một chưa ghi, một để thử xoá dữ liệu thô.
insert into public.import_batches (id, filename, academic_year_id, uploaded_by, status, total_rows, committed_rows, committed_at) values
  ('c4000000-0000-4000-8000-000000000001', 'Da_ghi.xlsx', 'c0000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'committed', 1, 1, now()),
  ('c4000000-0000-4000-8000-000000000002', 'Chua_ghi.xlsx', 'c0000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'dry_run', 2, 0, null),
  ('c4000000-0000-4000-8000-000000000003', 'Ghi_mot_phan.xlsx', 'c0000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'partially_committed', 1, 1, now());

insert into public.import_rows (id, batch_id, row_number, raw_json, normalized_json, status, action, created_student_id) values
  ('c5000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 1,
   jsonb_build_object('full_name', 'Em Đã Nhập M12A', 'phone', '0900001301'),
   jsonb_build_object('full_name', 'Em Đã Nhập M12A'), 'committed', 'create',
   'c3000000-0000-4000-8000-000000000001'),
  ('c5000000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000002', 1,
   jsonb_build_object('full_name', 'Em Chờ Duyệt M12A'),
   jsonb_build_object('full_name', 'Em Chờ Duyệt M12A'), 'valid', 'create', null),
  ('c5000000-0000-4000-8000-000000000004', 'c4000000-0000-4000-8000-000000000003', 1,
   jsonb_build_object('full_name', 'Em Ghi Một Phần M12A'),
   jsonb_build_object('full_name', 'Em Ghi Một Phần M12A'), 'committed', 'create',
   'c3000000-0000-4000-8000-000000000001');

-- Dòng chọn "Ghép" phải có hồ sơ đối chiếu ngay từ lúc chèn
-- (`import_rows_merge_needs_target` là CHECK, không phải trigger).
insert into public.import_rows
  (id, batch_id, row_number, raw_json, normalized_json, status, action, matched_student_id) values
  ('c5000000-0000-4000-8000-000000000003', 'c4000000-0000-4000-8000-000000000002', 2,
   jsonb_build_object('full_name', 'Em Chờ Duyệt Hai M12A'),
   jsonb_build_object('full_name', 'Em Chờ Duyệt Hai M12A'), 'warning', 'merge',
   'c3000000-0000-4000-8000-000000000001');

-- ============================================================================
-- 1. Cột giữ vết của hai thao tác một chiều
-- ============================================================================
select has_column('public', 'import_batches', 'cancelled_at', 'D-131: có cột ghi lúc huỷ');
select has_column('public', 'import_batches', 'cancelled_by', 'D-131: có cột ghi ai huỷ');
select has_column('public', 'import_batches', 'raw_purged_at', 'D-132: có cột ghi lúc xoá dữ liệu thô');
select has_column('public', 'import_batches', 'raw_purged_by', 'D-132: có cột ghi ai xoá dữ liệu thô');

set local role authenticated;

-- ============================================================================
-- 2. 🔴 AC-16 — Thư ký KHÔNG xoá được lần nhập đã ghi, kể cả qua Data API
-- ============================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000001'),
  1, 'Thư ký đọc được lần nhập đã ghi (đối chứng: quyền đọc không đổi)'
);

delete from public.import_batches where id = 'c4000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000001'),
  1, '🔴 AC-16: xoá lần nhập ĐÃ GHI không có tác dụng — hàng còn nguyên'
);
select is(
  (select created_student_id::text from public.import_rows
    where id = 'c5000000-0000-4000-8000-000000000001'),
  'c3000000-0000-4000-8000-000000000001',
  '🔴 AC-16: mối nối "dòng nào tạo ra em nào" vẫn còn'
);

delete from public.import_batches where id = 'c4000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::integer from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000003'),
  1, 'lần nhập ghi MỘT PHẦN cũng không xoá được'
);

-- Xoá thẳng dòng của lần nhập đã ghi cũng không được: `on delete cascade` chặn
-- ở bảng cha rồi, nhưng bảng con có policy riêng nên phải kiểm riêng.
delete from public.import_rows where id = 'c5000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.import_rows
    where id = 'c5000000-0000-4000-8000-000000000001'),
  1, '🔴 dòng của lần nhập đã ghi cũng không xoá thẳng được'
);

-- ============================================================================
-- 3. AC-17 / D-131 — lần nhập CHƯA ghi: huỷ được, và huỷ là ĐÁNH DẤU
-- ============================================================================
update public.import_batches
set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
where id = 'c4000000-0000-4000-8000-000000000002';

select is(
  (select status::text from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000002'),
  'cancelled', 'AC-17: lần nhập chưa ghi đánh dấu Đã huỷ được'
);
select is(
  (select count(*)::integer from public.import_rows
    where batch_id = 'c4000000-0000-4000-8000-000000000002'),
  2, 'D-131: huỷ KHÔNG xoá dòng nào — vết vẫn còn để tra cứu'
);
select ok(
  (select cancelled_by = 'c1000000-0000-4000-8000-000000000001'
     from public.import_batches where id = 'c4000000-0000-4000-8000-000000000002'),
  'D-131: ghi lại ai huỷ'
);

-- Không hạ được một lần nhập ĐÃ GHI xuống "Đã huỷ" (`with check` của policy).
-- ⚠️ Ở đây RLS **ném lỗi** chứ không im lặng trả 0 dòng: dòng đi qua được `using`
-- (Thư ký đọc/ghi được lần nhập này) rồi mới vướng `with check`, mà đó là ca
-- Postgres báo `42501`. Khác hẳn ca của Giáo lý viên bên dưới — ở đó `using`
-- chặn từ đầu nên chỉ có 0 dòng.
select throws_ok(
  $$update public.import_batches set status = 'cancelled'
    where id = 'c4000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  '🔴 lần nhập đã ghi KHÔNG hạ xuống "Đã huỷ" được'
);
select is(
  (select status::text from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000001'),
  'committed',
  'trạng thái lần nhập đã ghi không nhúc nhích — nếu không, hàng trăm hồ sơ hiện lên như một lần nhập bỏ đi'
);

-- ============================================================================
-- 4. D-132 — xoá dữ liệu thô, giữ mapping
-- ============================================================================
select is(
  public.purge_import_raw_data('c4000000-0000-4000-8000-000000000001'),
  1,
  'D-132: atomic purge reports the number of raw rows cleared'
);

select is(
  (select raw_json::text from public.import_rows
    where id = 'c5000000-0000-4000-8000-000000000001'),
  '{}', 'D-132: dữ liệu thô của lần nhập đã ghi xoá được'
);
select is(
  (select created_student_id::text from public.import_rows
    where id = 'c5000000-0000-4000-8000-000000000001'),
  'c3000000-0000-4000-8000-000000000001',
  '🔴 D-132: xoá dữ liệu thô KHÔNG đụng mối nối dòng → hồ sơ'
);
select ok(
  (select raw_purged_at is not null from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000001'),
  'D-132: ghi lại lúc xoá dữ liệu thô'
);

-- ============================================================================
-- 5. Đối chứng âm tính — Giáo lý viên lớp không đụng được gì (SEC-05)
-- ============================================================================
select set_config('request.jwt.claim.sub', 'c1000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.import_batches),
  0, 'Giáo lý viên lớp không thấy lần nhập nào'
);
select is(
  (select count(*)::integer from public.import_rows),
  0, 'Giáo lý viên lớp không thấy dòng nào'
);

delete from public.import_batches where id = 'c4000000-0000-4000-8000-000000000002';
update public.import_batches set status = 'cancelled'
where id = 'c4000000-0000-4000-8000-000000000002';

reset role;

select is(
  (select count(*)::integer from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000002'),
  1, 'Giáo lý viên lớp không xoá được lần nhập chưa ghi của người khác'
);
select is(
  (select status::text from public.import_batches
    where id = 'c4000000-0000-4000-8000-000000000002'),
  'cancelled', 'Giáo lý viên lớp không đổi được trạng thái lần nhập'
);

select * from finish();
rollback;
