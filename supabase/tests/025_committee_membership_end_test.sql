begin;

-- M09-C · TB-M09-05: khi kết thúc nhiệm kỳ, DB tự đặt ends_on = current_date để
-- cùng đồng hồ với starts_on (tránh ends_on < starts_on → 23514). Trigger là cơ
-- chế của DB nên kiểm ở tầng DB, không qua RLS.
select plan(4);

select has_function('app', 'set_committee_membership_end_date', 'trigger đặt ngày kết thúc tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('e1000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'end-date@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('e1000000-0000-4000-8000-000000000001', 'END_DATE', 'Nhân sự kiểm ends_on');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('e7000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'anh', 'Nhân sự kiểm ends_on', '0980000009');
-- starts_on lùi 10 ngày để bài idempotent bên dưới đặt được một ends_on hợp lệ
-- và phân biệt được (vẫn thoả ends_on >= starts_on).
insert into public.committee_memberships (id, committee_id, staff_profile_id, position, starts_on, is_active)
  values ('e9000000-0000-4000-8000-000000000001', '30000000-0000-0000-0000-000000000001', 'e7000000-0000-4000-8000-000000000001', 'member', current_date - 10, true);

-- Đổi chức vụ khi vẫn đang hoạt động: KHÔNG được đặt ends_on.
update public.committee_memberships set position = 'deputy'
  where id = 'e9000000-0000-4000-8000-000000000001';
select is(
  (select ends_on from public.committee_memberships where id = 'e9000000-0000-4000-8000-000000000001'),
  null,
  'đổi chức vụ khi còn hoạt động không đặt ends_on');

-- Kết thúc nhiệm kỳ mà KHÔNG gửi ends_on: trigger đặt = current_date.
update public.committee_memberships set is_active = false
  where id = 'e9000000-0000-4000-8000-000000000001';
select is(
  (select ends_on from public.committee_memberships where id = 'e9000000-0000-4000-8000-000000000001'),
  current_date,
  'kết thúc nhiệm kỳ: DB đặt ends_on = current_date');

-- Idempotent: một dòng đã ngưng sẵn, cập nhật lại is_active = false không dời
-- ends_on về hôm nay lần nữa. Ép ends_on về một mốc hợp lệ khác trước (không đụng
-- is_active nên trigger không chạy), rồi "kết thúc" lại.
update public.committee_memberships set ends_on = current_date - 3
  where id = 'e9000000-0000-4000-8000-000000000001';
update public.committee_memberships set is_active = false
  where id = 'e9000000-0000-4000-8000-000000000001';
select is(
  (select ends_on from public.committee_memberships where id = 'e9000000-0000-4000-8000-000000000001'),
  current_date - 3,
  'nhiệm kỳ đã ngưng sẵn: không ghi đè ends_on đang có');

select finish();
rollback;
