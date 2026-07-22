begin;

-- P5-T4: Top 5 feature flag, multiple sources, five-row immutable snapshot and
-- narrow guardian/student class exception.
select plan(26);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('d1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rep-top@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guardian-top@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student-top@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider-top@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('d1000000-0000-4000-8000-000000000001', 'REP_TOP', 'Đại diện Top 5'),
  ('d1000000-0000-4000-8000-000000000002', 'GUA_TOP', 'Phụ huynh Top 5'),
  ('d1000000-0000-4000-8000-000000000003', 'STU_TOP', 'Thiếu nhi Top 5'),
  ('d1000000-0000-4000-8000-000000000004', 'OUT_TOP', 'Phụ huynh lớp khác');
insert into public.academic_years (id, code, name, start_date, end_date, status, retention_until, top5_enabled) values
  ('d0000000-0000-4000-8000-000000000001', '2075-2076', 'Năm Top 5', '2075-09-01', '2076-05-31', 'draft', '2081-05-31', true);
insert into public.classes (id, academic_year_id, grade_level_id, section_code, display_name) values
  ('d6000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A Top'),
  ('d6000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A Top');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('d7000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'anh', 'Đại diện Top 5', '0950000001');
insert into public.class_staff_assignments (class_id, staff_profile_id, capacity, starts_on) values
  ('d6000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'representative', '2075-09-01');
insert into public.guardians (id, profile_id, full_name, phone) values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', 'Phụ huynh Top', '0950000002'),
  ('d2000000-0000-4000-8000-000000000002', null, 'Phụ huynh chung', '0950000099'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000004', 'Phụ huynh ngoài', '0950000004');
insert into public.students (id, profile_id, guardian_id, saint_name, full_name, gender, date_of_birth) values
  ('d3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000001', 'Maria', 'Hạng Sáu', 'female', '2016-01-01'),
  ('d3000000-0000-4000-8000-000000000002', null, 'd2000000-0000-4000-8000-000000000002', 'Anna', 'Hạng Năm', 'female', '2016-02-02'),
  ('d3000000-0000-4000-8000-000000000003', null, 'd2000000-0000-4000-8000-000000000002', 'Gioan', 'Hạng Bốn', 'male', '2016-03-03'),
  ('d3000000-0000-4000-8000-000000000004', null, 'd2000000-0000-4000-8000-000000000002', 'Phêrô', 'Hạng Ba', 'male', '2016-04-04'),
  ('d3000000-0000-4000-8000-000000000005', null, 'd2000000-0000-4000-8000-000000000002', 'Phaolô', 'Hạng Hai', 'male', '2016-05-05'),
  ('d3000000-0000-4000-8000-000000000006', null, 'd2000000-0000-4000-8000-000000000002', 'Têrêsa', 'Hạng Nhất', 'female', '2016-06-06'),
  ('d3000000-0000-4000-8000-000000000007', null, 'd2000000-0000-4000-8000-000000000003', 'Giuse', 'Lớp Khác', 'male', '2015-07-07');
insert into public.enrollments (id, student_id, academic_year_id, class_id, status, enrolled_on) values
  ('d4000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000005', 'd3000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000006', 'd3000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'active', '2075-09-01'),
  ('d4000000-0000-4000-8000-000000000007', 'd3000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000002', 'active', '2075-09-01');
insert into public.role_assignments (profile_id, role) values
  ('d1000000-0000-4000-8000-000000000002', 'guardian'),
  ('d1000000-0000-4000-8000-000000000003', 'student'),
  ('d1000000-0000-4000-8000-000000000004', 'guardian');
insert into public.role_assignments (profile_id, role, academic_year_id, class_id) values
  ('d1000000-0000-4000-8000-000000000001', 'class_representative', 'd0000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
insert into public.assessments (id, class_id, academic_year_id, kind, title, weight, created_by, updated_by)
values ('da000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'custom', 'Thi đua tháng', 1, 'd1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001');
select is(public.save_assessment_scores('da000000-0000-4000-8000-000000000001', '[{"enrollmentId":"d4000000-0000-4000-8000-000000000001","score":1},{"enrollmentId":"d4000000-0000-4000-8000-000000000002","score":5},{"enrollmentId":"d4000000-0000-4000-8000-000000000003","score":6},{"enrollmentId":"d4000000-0000-4000-8000-000000000004","score":7},{"enrollmentId":"d4000000-0000-4000-8000-000000000005","score":8},{"enrollmentId":"d4000000-0000-4000-8000-000000000006","score":9}]'::jsonb), 6, 'dựng sáu điểm nguồn');

select lives_ok(
  $$insert into public.leaderboards (id, class_id, academic_year_id, title, source_type, source_assessment_id, created_by, updated_by)
    values ('db000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000000', 'Top 5 thi đua', 'assessment', 'da000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001')$$,
  'đại diện tạo Top 5 khi feature bật'
);
select is((select academic_year_id from public.leaderboards where id = 'db000000-0000-4000-8000-000000000001'), 'd0000000-0000-4000-8000-000000000001'::uuid, 'năm học Top 5 suy ra từ lớp');
select is((select count(*)::integer from public.preview_leaderboard('db000000-0000-4000-8000-000000000001', null)), 5, 'preview chỉ trả đúng 5 vị trí');
select results_eq(
  $$select out_score from public.preview_leaderboard('db000000-0000-4000-8000-000000000001', null) order by out_rank$$,
  $$values (9::numeric), (8::numeric), (7::numeric), (6::numeric), (5::numeric)$$,
  'preview xếp đúng năm điểm cao nhất'
);
select is(public.publish_leaderboard('db000000-0000-4000-8000-000000000001', null), 5, 'publish snapshot đúng 5 dòng trước khi khóa gradebook');
select is((select count(*)::integer from public.leaderboard_entries where leaderboard_id = 'db000000-0000-4000-8000-000000000001'), 5, 'snapshot có đúng năm entry');
select results_eq($$select rank from public.leaderboard_entries where leaderboard_id = 'db000000-0000-4000-8000-000000000001' order by rank$$, $$values (1::smallint),(2::smallint),(3::smallint),(4::smallint),(5::smallint)$$, 'rank chỉ từ 1 đến 5');
select is((select count(*)::integer from public.leaderboard_entries where enrollment_id = 'd4000000-0000-4000-8000-000000000001'), 0, 'hạng sáu không bị công khai');
select throws_ok($$select public.publish_leaderboard('db000000-0000-4000-8000-000000000001', null)$$, '23505', 'LEADERBOARD_ALREADY_PUBLISHED', 'không publish chồng lên snapshot đang công bố');

select is(public.save_assessment_scores('da000000-0000-4000-8000-000000000001', '[{"enrollmentId":"d4000000-0000-4000-8000-000000000001","score":10}]'::jsonb), 1, 'điểm nguồn vẫn có thể đổi sau publish');
select is((select count(*)::integer from public.leaderboard_entries where enrollment_id = 'd4000000-0000-4000-8000-000000000001'), 0, 'snapshot không tự tính lại khi điểm nguồn đổi');
select is((select score from public.leaderboard_entries where rank = 1 and leaderboard_id = 'db000000-0000-4000-8000-000000000001'), 9.00::numeric, 'điểm hạng nhất snapshot vẫn bất biến');

select lives_ok(
  $$insert into public.leaderboards (id, class_id, academic_year_id, title, source_type, created_by, updated_by)
    values ('db000000-0000-4000-8000-000000000002', 'd6000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Top 5 tùy chỉnh', 'custom_competition', 'd1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001')$$,
  'tạo được nguồn thi đua tùy chỉnh'
);
select is((select count(*)::integer from public.preview_leaderboard('db000000-0000-4000-8000-000000000002', '[{"enrollmentId":"d4000000-0000-4000-8000-000000000001","score":60},{"enrollmentId":"d4000000-0000-4000-8000-000000000002","score":50},{"enrollmentId":"d4000000-0000-4000-8000-000000000003","score":40},{"enrollmentId":"d4000000-0000-4000-8000-000000000004","score":30},{"enrollmentId":"d4000000-0000-4000-8000-000000000005","score":20},{"enrollmentId":"d4000000-0000-4000-8000-000000000006","score":10}]'::jsonb)), 5, 'custom competition cũng chỉ preview năm dòng');
select is(public.publish_leaderboard('db000000-0000-4000-8000-000000000002', '[{"enrollmentId":"d4000000-0000-4000-8000-000000000001","score":60},{"enrollmentId":"d4000000-0000-4000-8000-000000000002","score":50},{"enrollmentId":"d4000000-0000-4000-8000-000000000003","score":40},{"enrollmentId":"d4000000-0000-4000-8000-000000000004","score":30},{"enrollmentId":"d4000000-0000-4000-8000-000000000005","score":20},{"enrollmentId":"d4000000-0000-4000-8000-000000000006","score":10}]'::jsonb), 5, 'publish được custom competition');
select is((select score from public.leaderboard_entries where leaderboard_id = 'db000000-0000-4000-8000-000000000002' and rank = 1), 60.00::numeric, 'custom score không bị ép thang 10');

select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.leaderboards), 2, 'phụ huynh lớp thấy hai Top 5 đã công bố');
select is((select count(*)::integer from public.leaderboard_entries), 10, 'phụ huynh thấy đúng năm entry mỗi snapshot dù không phải con mình');
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.leaderboard_entries), 10, 'thiếu nhi hạng sáu vẫn thấy Top 5 công bố của lớp');
select is((select count(*)::integer from public.students), 1, 'Top 5 không mở quyền đọc hồ sơ năm em khác');
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.leaderboards), 0, 'phụ huynh lớp khác không thấy Top 5');
select is((select count(*)::integer from public.leaderboard_entries), 0, 'phụ huynh lớp khác không thấy entry');

select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select lives_ok($$update public.leaderboards set is_published = false, updated_by = 'd1000000-0000-4000-8000-000000000001' where id = 'db000000-0000-4000-8000-000000000001'$$, 'đại diện unpublish được');
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.leaderboards), 1, 'portal ẩn ngay snapshot đã unpublish');

select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
reset role;
update public.academic_years set top5_enabled = false where id = 'd0000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$insert into public.leaderboards (class_id, academic_year_id, title, source_type, created_by, updated_by)
    values ('d6000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Bị chặn', 'temporary_weighted_average', 'd1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001')$$,
  '42501', 'TOP5_DISABLED', 'feature flag tắt chặn tạo Top 5 mới'
);

select * from finish();
rollback;
