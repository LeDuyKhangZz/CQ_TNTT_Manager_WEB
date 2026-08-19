begin;

select plan(16);

-- ============================================================================
-- STAFF-COMP-001 — "Thành phần" của nhân sự, và mã riêng TTxxx cho Ban Trợ tá.
-- Kiểm ở ranh giới cơ sở dữ liệu: tiền tố mã phải do DB quyết theo `component`,
-- không phải do tầng ứng dụng nhớ mà làm — nếu để ứng dụng quyết thì một đường
-- ghi khác (RPC, Data API, seed) là mọc ra một Trợ tá mang mã GLV.
-- ============================================================================

-- ── Cấu trúc ───────────────────────────────────────────────────────────────
select has_type('public', 'staff_component', 'enum staff_component ton tai');
select has_column('public', 'staff_profiles', 'component', 'staff_profiles.component ton tai');
select col_not_null('public', 'staff_profiles', 'component', 'component la not null');
select col_default_is(
  'public', 'staff_profiles', 'component', 'khac',
  'chua khai bao thi la `khac` — he thong KHONG doan ai la huynh truong'
);
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_type t join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'staff_component'),
  array['huynh_truong','du_truong','nu_tu','chung_sinh','linh_muc','tro_ta','khac'],
  'bay gia tri, dung thu tu da chot'
);
select has_function('app', 'assign_staff_code', 'trigger cap ma ton tai');
select has_sequence('public', 'assistant_code_seq', 'chuoi so rieng cho ma TT');

-- ── Cấp mã theo thành phần ─────────────────────────────────────────────────
insert into public.staff_profiles (id, title, full_name, phone, component) values
  ('c1700000-0000-4000-8000-000000000001', 'chi', 'Nguoi day hoc', '0900001001', 'huynh_truong'),
  ('c1700000-0000-4000-8000-000000000002', 'chi', 'Nguoi tro ta',  '0900001002', 'tro_ta'),
  ('c1700000-0000-4000-8000-000000000003', 'anh', 'Nguoi chua ro', '0900001003', default);

select matches(
  (select staff_code::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000001'),
  '^GLV[0-9]{3,}$',
  'huynh truong nhan ma GLVxxx'
);
select matches(
  (select staff_code::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000002'),
  '^TT[0-9]{3,}$',
  'tro ta nhan ma TTxxx — khong con lan vao day GLV'
);
select matches(
  (select staff_code::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000003'),
  '^GLV[0-9]{3,}$',
  'khong khai thanh phan thi van la GLVxxx nhu truoc'
);

-- Mã đặt tay vẫn được tôn trọng: `scripts/seed-dev.mjs` đi đường này để không
-- tiêu thụ sequence mà pgTAP cũng dùng.
insert into public.staff_profiles (id, staff_code, title, full_name, phone, component) values
  ('c1700000-0000-4000-8000-000000000004', 'GLV900', 'anh', 'Ma dat tay', '0900001004', 'tro_ta');
select is(
  (select staff_code::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000004'),
  'GLV900',
  'ma dat tay khong bi trigger ghi de'
);

-- ── Mã là định danh: đổi thành phần KHÔNG đánh lại mã ──────────────────────
-- Với nhân sự, `staff_code` cũng là TEN DANG NHAP. Doi ma cua nguoi dang dung
-- la khoa ho khoi he thong.
update public.staff_profiles set component = 'tro_ta'
where id = 'c1700000-0000-4000-8000-000000000001';
select matches(
  (select staff_code::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000001'),
  '^GLV[0-9]{3,}$',
  'doi thanh phan sang tro_ta van GIU nguyen ma GLV cu'
);

-- ── CHECK chỉ nới đúng hai tiền tố ──────────────────────────────────────────
select throws_ok(
  $$insert into public.staff_profiles (staff_code, title, full_name, phone)
    values ('XX001', 'anh', 'Ma sai dang', '0900001005')$$,
  '23514',
  null,
  'tien to la khong phai GLV/TT thi bi CHECK chan'
);
select lives_ok(
  $$insert into public.staff_profiles (staff_code, title, full_name, phone, component)
    values ('TT900', 'chi', 'Ma TT dat tay', '0900001006', 'tro_ta')$$,
  'tien to TT dat tay duoc CHECK chap nhan'
);

-- ── Hai dãy mã không đục lỗ của nhau ───────────────────────────────────────
insert into public.staff_profiles (id, title, full_name, phone, component) values
  ('c1700000-0000-4000-8000-000000000006', 'chi', 'Tro ta thu hai', '0900001007', 'tro_ta');
select is(
  (select count(distinct staff_code) from public.staff_profiles
    where id in ('c1700000-0000-4000-8000-000000000002','c1700000-0000-4000-8000-000000000006')),
  2::bigint,
  'hai tro ta nhan hai ma TT khac nhau'
);

-- Backfill của migration: hồ sơ danh xưng Sơ/Cha/Thầy đã được xếp nhóm sẵn.
insert into public.staff_profiles (id, title, full_name, phone) values
  ('c1700000-0000-4000-8000-000000000007', 'so', 'Nu tu moi', '0900001008');
select is(
  (select component::text from public.staff_profiles where id = 'c1700000-0000-4000-8000-000000000007'),
  'khac',
  'backfill chi chay MOT LAN o migration — ho so moi khong tu suy tu danh xung'
);

select * from finish();
rollback;
