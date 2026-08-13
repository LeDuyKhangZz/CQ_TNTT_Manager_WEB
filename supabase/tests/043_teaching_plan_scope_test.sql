begin;

-- ============================================================================
-- M06-B — ba thay đổi phân quyền của module Giáo án, kiểm bằng **JWT thật của
-- từng vai trò**, không một dòng nào chạy bằng service role (`CLAUDE.md` §4).
--
--   D-144  🔴 SIẾT — Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký chỉ còn XEM.
--   D-145     NỚI  — đội ngũ lớp đọc được giáo án lớp mình, kể cả tệp đính kèm.
--   Nợ #18    SIẾT — năm học đã đóng không nhận ghi; Super Admin ngoại lệ (D-117).
--
-- 🔴 **Fixture của TB-09 trong `08_ACCEPTANCE_CRITERIA` KHÔNG dựng được**, và
-- đây là chỗ đáng ghi lại nhất của cả đợt. Tài liệu đề nghị một Giáo lý viên có
-- `role_assignments.class_id = X` nhưng `class_staff_assignments.class_id = Y`.
-- Cấu hình ấy bị **hai trigger chặn cả hai chiều**: `validate_class_staff_assignment`
-- ném `ROLE_CAPACITY_MISMATCH`, còn BR-A17 ném `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`.
-- Cả hai chỉ kiểm khi vai trò là **vai trò lớp** — nên lỗ "ghi được mà không đọc
-- được" chỉ còn đúng hai ca, và fixture dưới đây dựng đúng hai ca ấy:
--
--   · **Trưởng ngành được xếp đứng lớp thuộc ngành KHÁC** (F_SEC: Trưởng ngành
--     Ấu, làm đại diện một lớp **Thiếu**) — người này GHI được (đại diện lớp)
--     mà trước M06-B **không đọc lại được**: tạo giáo án xong, tải lại là trắng.
--   · **Thủ quỹ đứng lớp** (F_TRE) — `app.can_global_read()` không có
--     `treasurer`, nên trước M06-B họ không thấy gì.
--
-- Cả hai đều là chuyện có thật ở một xứ đoàn thiếu người.
-- ============================================================================

select plan(27);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'secretary-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deputy-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sector-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'treasurer-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'far-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f1000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'closed-rep-scope@test.local', crypt('x', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, username, display_name) values
  ('f1000000-0000-4000-8000-000000000001', 'F_REP',  'Đại diện Ấu 1A'),
  ('f1000000-0000-4000-8000-000000000002', 'F_SCR',  'Thư ký'),
  ('f1000000-0000-4000-8000-000000000003', 'F_LEAD', 'Xứ đoàn trưởng'),
  ('f1000000-0000-4000-8000-000000000004', 'F_DEP',  'Phó Xứ đoàn'),
  ('f1000000-0000-4000-8000-000000000005', 'F_ADM',  'Quản trị hệ thống'),
  ('f1000000-0000-4000-8000-000000000006', 'F_SEC',  'Trưởng ngành Ấu đứng lớp Thiếu'),
  ('f1000000-0000-4000-8000-000000000007', 'F_TRE',  'Thủ quỹ đứng lớp'),
  ('f1000000-0000-4000-8000-000000000008', 'F_FAR',  'GLV lớp không liên quan'),
  ('f1000000-0000-4000-8000-000000000009', 'F_OLD',  'Đại diện lớp năm đã đóng');

-- Hai năm học: một năm còn ghi được, một năm ĐÃ ĐÓNG (nợ #18).
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until) values
  ('f0000000-0000-4000-8000-000000000001', '2080-2081', 'Năm phạm vi', '2080-09-01', '2081-05-31', 'draft', '2086-05-31'),
  ('f0000000-0000-4000-8000-000000000002', '2079-2080', 'Năm đã đóng', '2079-09-01', '2080-05-31', 'draft', '2085-05-31');

insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  -- Ấu 1A: lớp "bình thường", dùng cho D-144.
  ('f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Scope'),
  -- Thiếu 1A: NGÀNH KHÁC với ngành của F_SEC ⇒ đúng ca lệch hai quyển sổ.
  ('f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Scope'),
  -- Nghĩa 1: lớp không liên quan tới ai, dùng cho TB-10. `section_code` phải là
  -- null — `app.validate_class_section` chặn khi khối không chia lớp A/B.
  ('f6000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000010', null, 'Nghĩa 1 Scope'),
  -- Lớp của năm đã đóng.
  ('f6000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000002', '20000000-0000-0000-0000-000000000005', 'A', 'Ấu 2A Đã đóng');

-- `app.validate_staff_role_link` đòi hồ sơ nhân sự cho **mọi** vai trò GLV —
-- kể cả ba vai trò cấp xứ đoàn không đứng lớp. Super Admin thì không đòi.
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Ấu 1A', '0928000001'),
  ('f7000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000002', 'chi', 'Thư ký', '0928000002'),
  ('f7000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000003', 'anh', 'Xứ đoàn trưởng', '0928000003'),
  ('f7000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000004', 'chi', 'Phó Xứ đoàn', '0928000004'),
  ('f7000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000006', 'chi', 'Trưởng ngành Ấu', '0928000006'),
  ('f7000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000007', 'anh', 'Thủ quỹ', '0928000007'),
  ('f7000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000008', 'chi', 'GLV Nghĩa 1A', '0928000008'),
  ('f7000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000009', 'anh', 'Đại diện năm cũ', '0928000009');

-- 🔴 **Phân công đội ngũ phải có TRƯỚC vai trò lớp**, không phải sau. BR-A17
-- (`app.validate_role_assignment_scope`) ném `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`
-- nếu một vai trò lớp ra đời mà chưa có tên trong sổ đội ngũ — chính là trigger
-- thứ hai mà D-145 nêu, và nó chặn thật.
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000001', 'representative', '2080-09-01'),
  ('f6000000-0000-4000-8000-000000000003', 'f7000000-0000-4000-8000-000000000008', 'member',         '2080-09-01'),
  ('f6000000-0000-4000-8000-000000000004', 'f7000000-0000-4000-8000-000000000009', 'representative', '2079-09-01'),
  -- Hai dòng dựng nên toàn bộ ca D-145: vai trò KHÔNG phải vai trò lớp nên
  -- `validate_class_staff_assignment` đứng ngoài, và hai quyển sổ lệch nhau một
  -- cách hoàn toàn hợp lệ.
  ('f6000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000006', 'representative', '2080-09-01'),
  ('f6000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000007', 'member',         '2080-09-01');

insert into public.role_assignments (profile_id, role) values
  ('f1000000-0000-4000-8000-000000000002', 'secretary'),
  ('f1000000-0000-4000-8000-000000000003', 'group_leader'),
  ('f1000000-0000-4000-8000-000000000004', 'deputy_group_leader'),
  ('f1000000-0000-4000-8000-000000000005', 'super_admin'),
  ('f1000000-0000-4000-8000-000000000007', 'treasurer');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('f1000000-0000-4000-8000-000000000001', 'class_representative', 'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000008', 'class_teacher',        'f0000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000003'),
  ('f1000000-0000-4000-8000-000000000009', 'class_representative', 'f0000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000004');
insert into public.role_assignments (profile_id, role, academic_year_id, sector_id) values
  ('f1000000-0000-4000-8000-000000000006', 'sector_leader', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000002');

insert into public.teaching_plans (id, class_id, academic_year_id, title) values
  ('fb000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Giáo án Ấu 1A'),
  ('fb000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Giáo án Thiếu 1A'),
  ('fb000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000002', 'Giáo án năm đã đóng');
insert into public.teaching_plan_items
  (id, teaching_plan_id, planned_date, title, teacher_staff_id, item_type, material_path, material_name, material_mime_type, material_size) values
  ('fc000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000001', '2080-09-07', 'Bài Ấu 1A',
   'f7000000-0000-4000-8000-000000000001', 'lesson', null, null, null, null),
  ('fc000000-0000-4000-8000-000000000002', 'fb000000-0000-4000-8000-000000000002', '2080-09-07', 'Bài Thiếu 1A',
   'f7000000-0000-4000-8000-000000000006', 'lesson',
   'f6000000-0000-4000-8000-000000000002/fc000000-0000-4000-8000-000000000002/fixture.pdf',
   'fixture.pdf', 'application/pdf', 12),
  ('fc000000-0000-4000-8000-000000000004', 'fb000000-0000-4000-8000-000000000004', '2079-09-07', 'Bài năm đã đóng',
   'f7000000-0000-4000-8000-000000000009', 'lesson', null, null, null, null);

-- Dựng lịch sử theo thứ tự hợp lệ: phân công được tạo khi năm còn ghi được,
-- rồi niên khóa mới đóng. Trigger Phase 3 cấm tạo phân công active mới vào năm đóng.
update public.academic_years
set status = 'closed'
where id = 'f0000000-0000-4000-8000-000000000002';

set local role authenticated;

-- ── D-144 · ba vai trò cấp xứ đoàn: ĐỌC còn, GHI mất ────────────────────────
-- Ba vai trò, ba lượt kiểm giống nhau — vì `docs/05` cho cả ba cùng một ô và
-- siết hụt một vai trò là để nguyên lỗ hổng mà biên bản nghiệm thu tưởng đã bịt.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.teaching_plans), 3, 'D-144: thư ký vẫn đọc được mọi giáo án');
select ok(not app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000001'), 'D-144: thư ký mất quyền quản lý giáo án');
select throws_ok(
  $$insert into public.teaching_plan_items (teaching_plan_id, planned_date, title, item_type)
    values ('fb000000-0000-4000-8000-000000000001', '2080-09-14', 'Thư ký thêm', 'assessment')$$,
  '42501', null, 'D-144: thư ký không thêm được mục giáo án'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.teaching_plans), 3, 'D-144: Xứ đoàn trưởng vẫn đọc được mọi giáo án');
select ok(not app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000001'), 'D-144: Xứ đoàn trưởng mất quyền quản lý giáo án');
-- `using` lọc dòng trong im lặng ⇒ đo KẾT QUẢ, không đo ngoại lệ.
delete from public.teaching_plan_items where id = 'fc000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.teaching_plan_items where id = 'fc000000-0000-4000-8000-000000000001'),
  1, 'D-144: Xứ đoàn trưởng không xóa được mục giáo án'
);

select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000004', true);
select ok(not app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000001'), 'D-144: Phó Xứ đoàn mất quyền quản lý giáo án');
update public.teaching_plans set title = 'Phó Xứ đoàn sửa'
where id = 'fb000000-0000-4000-8000-000000000001';
select is(
  (select title from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000001'),
  'Giáo án Ấu 1A', 'D-144: Phó Xứ đoàn không đổi được tên giáo án'
);

-- Giáo lý viên đại diện — người mà D-144 dồn trách nhiệm về — vẫn làm được việc.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000001', true);
select ok(app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000001'), 'đại diện giữ nguyên quyền quản lý lớp mình');
select lives_ok(
  $$update public.teaching_plan_items set title = 'Bài Ấu 1A đã sửa'
    where id = 'fc000000-0000-4000-8000-000000000001'$$,
  'đại diện vẫn sửa được mục giáo án lớp mình'
);

-- Super Admin là ngoại lệ duy nhất còn lại (chủ dự án xác nhận 2026-08-05).
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select ok(app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000001'), 'Super Admin giữ quyền quản lý giáo án mọi lớp');

-- ── D-145 · hai ca "ghi được mà không đọc lại được" ─────────────────────────
-- Trưởng ngành Ấu làm đại diện một lớp THIẾU: `app.can_access_class` không thấy
-- lớp ấy (khác ngành, khác thẻ đăng nhập), còn `app.is_class_representative` thì
-- thấy. Trước M06-B nghĩa là tạo giáo án xong tải lại trang là trắng.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000006', true);
select ok(
  not app.can_access_class('f6000000-0000-4000-8000-000000000002'),
  'điều kiện của ca: định nghĩa "thuộc lớp" CŨ vẫn nói không'
);
select ok(app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000002'), 'điều kiện của ca: người này GHI được');
select is(
  (select count(*)::integer from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000002'),
  1, 'D-145: Trưởng ngành đứng lớp ngành khác nay ĐỌC lại được giáo án mình vừa ghi'
);
select is(
  (select count(*)::integer from public.teaching_plan_items where id = 'fc000000-0000-4000-8000-000000000002'),
  1, 'D-145: và đọc được cả các mục của giáo án ấy'
);
select ok(
  app.can_read_teaching_material('f6000000-0000-4000-8000-000000000002/fc000000-0000-4000-8000-000000000002/fixture.pdf'),
  'D-145: tệp đính kèm đi theo giáo án — không hiện tên tệp rồi từ chối cho tải'
);

-- Thủ quỹ đứng lớp: `app.can_global_read()` không có `treasurer`.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000007', true);
select is(
  (select count(*)::integer from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000002'),
  1, 'D-145: Thủ quỹ đứng lớp đọc được giáo án CHÍNH lớp đó'
);
select is(
  (select count(*)::integer from public.teaching_plans), 1,
  'D-145: và chỉ lớp đó — Thủ quỹ không nhân tiện đọc được giáo án lớp khác'
);
select ok(
  not app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000002'),
  'D-145 chỉ nới quyền ĐỌC: Thủ quỹ đứng lớp không ghi được giáo án'
);

-- TB-10 — không nới quyền ngoài spec.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000008', true);
select is(
  (select count(*)::integer from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000002'),
  0, 'TB-10: Giáo lý viên lớp không liên quan vẫn đọc 0 dòng'
);
select ok(
  not app.can_read_teaching_material('f6000000-0000-4000-8000-000000000002/fc000000-0000-4000-8000-000000000002/fixture.pdf'),
  'TB-10: và không đọc được tệp của lớp ấy'
);

-- ── Nợ #18 · năm học đã đóng ────────────────────────────────────────────────
-- F_OLD là đại diện thật của lớp thuộc năm đã đóng: quyền vai trò **vẫn đủ**,
-- thứ chặn họ là trạng thái năm học chứ không phải phân quyền. Đó là điều bài
-- này phải chứng minh — nếu chặn bằng vai trò thì hàng rào năm học chưa hề chạy.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000009', true);
select ok(app.can_manage_teaching_plan('f6000000-0000-4000-8000-000000000004'), 'nợ #18: vai trò của người này vẫn đủ quyền quản lý');
select throws_ok(
  $$insert into public.teaching_plan_items (teaching_plan_id, planned_date, title, item_type)
    values ('fb000000-0000-4000-8000-000000000004', '2079-09-14', 'Thêm vào năm đã đóng', 'assessment')$$,
  '42501', null, 'nợ #18: năm học đã đóng không nhận mục giáo án mới'
);
update public.teaching_plan_items set title = 'Sửa năm đã đóng'
where id = 'fc000000-0000-4000-8000-000000000004';
select is(
  (select title from public.teaching_plan_items where id = 'fc000000-0000-4000-8000-000000000004'),
  'Bài năm đã đóng', 'nợ #18: và không sửa được mục cũ (using lọc im lặng)'
);
delete from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000004';
select is(
  (select count(*)::integer from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000004'),
  1, 'nợ #18: và không xóa được giáo án của năm đã đóng'
);

-- D-117 — Super Admin là ngoại lệ, y như ở `enrollments`/`classes` của M02-C.
select set_config('request.jwt.claim.sub', 'f1000000-0000-4000-8000-000000000005', true);
select lives_ok(
  $$update public.teaching_plans set title = 'Super Admin sửa năm đã đóng'
    where id = 'fb000000-0000-4000-8000-000000000004'$$,
  'D-117: Super Admin vẫn ghi được vào năm học đã đóng'
);
select is(
  (select title from public.teaching_plans where id = 'fb000000-0000-4000-8000-000000000004'),
  'Super Admin sửa năm đã đóng', 'D-117: và thay đổi ấy ghi xuống thật, không phải 0 dòng im lặng'
);

select * from finish();
rollback;
