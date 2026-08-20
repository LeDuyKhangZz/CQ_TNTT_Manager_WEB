begin;

select plan(19);

-- ============================================================================
-- BDH-2025-001 / BDH-2025-002 — sổ Ban Điều Hành 2025-2026.
--
-- Hai việc, một gốc: hệ thống không có chỗ nào ghi CHỨC VỤ, nên hộp thoại cấp
-- tài khoản đoán theo phân công lớp và đoán sai với 14/20 người của Ban Điều
-- Hành; và 6 Ban của xứ đoàn chỉ nằm trong `seed.sql` mà `db push` không chạy
-- seed, nên `public.committees` trên production rỗng.
--
-- Kiểm ở ranh giới cơ sở dữ liệu chứ không ở giao diện: cột `appointed_role`
-- KHÔNG cấp quyền, nhưng nó là thứ điền sẵn ô chọn vai trò, nên ai sửa được nó
-- là một câu hỏi phải trả lời bằng chốt chặn thật.
-- ============================================================================

-- ── BDH-2025-001 · Sáu Ban ─────────────────────────────────────────────────
select is(
  (select count(*)::integer from public.committees where is_active), 6,
  'dung 6 Ban dang hoat dong'
);
select is(
  (select array_agg(code::text order by sort_order) from public.committees where is_active),
  array['PHUNG_VU','SINH_HOAT','KY_THUAT','TRUC','TRUYEN_THONG','Y_TE'],
  'dung 6 Ban cua so, dung thu tu so — co Ban Truc'
);
select is(
  (select count(*)::integer from public.committees where code = 'QUAN_LY'), 0,
  'Ban Quan ly cua seed cu khong con — no khong co trong so nao cua xu doan'
);
select is(
  (select code::text from public.committees where manages_equipment), 'KY_THUAT',
  'chi Ban Ky thuat giu kho thiet bi'
);

-- ── BDH-2025-002 · Cấu trúc cột chức vụ bổ nhiệm ───────────────────────────
select has_column('public', 'staff_profiles', 'appointed_role', 'cot appointed_role ton tai');
select has_column('public', 'staff_profiles', 'appointed_sector_id', 'cot appointed_sector_id ton tai');
select col_is_null('public', 'staff_profiles', 'appointed_role', 'khong co chuc vu la NULL, khong phai mot gia tri gia');
select has_index('public', 'staff_profiles', 'staff_profiles_appointed_role_idx', 'co chi muc loc theo chuc vu');

-- ── Hình dạng cặp chức vụ ↔ ngành ──────────────────────────────────────────
-- Cùng luật với `role_assignments_scope_matches_role`. Sai luật ở đây nghĩa là
-- ô chọn điền sẵn một cặp mà trigger của `role_assignments` chắc chắn từ chối.
insert into public.staff_profiles (id, title, full_name, phone, component) values
  ('c1800000-0000-4000-8000-000000000001', 'anh', 'Nguoi duoc bo nhiem', '0900002001', 'huynh_truong');

select lives_ok(
  $q$update public.staff_profiles set appointed_role = 'deputy_group_leader'
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  'chuc vu toan xu doan khong can nganh'
);
select throws_ok(
  $q$update public.staff_profiles
        set appointed_role = 'deputy_group_leader',
            appointed_sector_id = '10000000-0000-0000-0000-000000000002'
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  '23514', null,
  'chuc vu toan xu doan KHONG nhan pham vi nganh'
);
select throws_ok(
  $q$update public.staff_profiles
        set appointed_role = 'sector_leader', appointed_sector_id = null
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  '23514', null,
  'Truong nganh thieu nganh thi bi chan'
);
select lives_ok(
  $q$update public.staff_profiles
        set appointed_role = 'sector_leader',
            appointed_sector_id = '10000000-0000-0000-0000-000000000002'
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  'Truong nganh kem nganh thi ghi duoc'
);
select throws_ok(
  $q$update public.staff_profiles
        set appointed_role = 'class_teacher', appointed_sector_id = null
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  '23514', null,
  'vai tro LOP khong ghi vao so bo nhiem — no suy tu class_staff_assignments'
);
select throws_ok(
  $q$update public.staff_profiles
        set appointed_role = 'super_admin', appointed_sector_id = null
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  '23514', null,
  'super_admin la tran tuyet doi D-102, khong bao gio la mot chuc vu bo nhiem'
);
select lives_ok(
  $q$update public.staff_profiles
        set appointed_role = null, appointed_sector_id = null
      where id = 'c1800000-0000-4000-8000-000000000001'$q$,
  'go chuc vu = dat ca hai ve null'
);

-- ── Ai sửa được: hàng rào cũ tự phủ cột mới ────────────────────────────────
-- `app.guard_staff_self_update()` (IMP-BULK-002) viết theo DANH SACH CHO PHEP,
-- nen hai cot them hom nay duoc bao ve ma khong phai sua mot chu nao trong no.
-- Bai kiem nay chinh la thu canh dieu do: neu ai đó doi hàm ấy sang danh sách
-- cấm thì đây là chỗ đỏ trước tiên.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('c1810000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'bdh-self@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('c1810000-0000-4000-8000-000000000001', 'BDH_SELF', 'Nhan su khong co quyen ghi toan cuc');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('c1800000-0000-4000-8000-000000000002', 'c1810000-0000-4000-8000-000000000001',
   'anh', 'Nhan su tu sua', '0900002002');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1810000-0000-4000-8000-000000000001', true);

select ok(not app.can_global_write(), 'nhan su nay khong co quyen ghi toan xu doan');

update public.staff_profiles set phone = '0900002099', updated_by = auth.uid()
 where id = 'c1800000-0000-4000-8000-000000000002';
select is(
  (select phone from public.staff_profiles where id = 'c1800000-0000-4000-8000-000000000002'),
  '0900002099',
  'van tu sua duoc so dien thoai cua chinh minh'
);

select throws_ok(
  $q$update public.staff_profiles set appointed_role = 'group_leader'
      where id = 'c1800000-0000-4000-8000-000000000002'$q$,
  '23514', 'STAFF_SELF_UPDATE_FIELDS',
  'nhung KHONG tu ghi minh la Xu doan truong vao so bo nhiem'
);
select throws_ok(
  $q$update public.staff_profiles
        set appointed_sector_id = '10000000-0000-0000-0000-000000000002'
      where id = 'c1800000-0000-4000-8000-000000000002'$q$,
  '23514', 'STAFF_SELF_UPDATE_FIELDS',
  'va cung khong tu gan nganh cho minh'
);

reset role;

select * from finish();
rollback;
