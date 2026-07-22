begin;

-- P6-T3: kho thiết bị chỉ thuộc Ban Kỹ thuật, mượn/trả đi qua RPC có row lock,
-- số lượng khả dụng không sửa tay được và trả lại lần hai là idempotent (WF-13).
select plan(32);

select has_table('public', 'equipment_items', 'bảng thiết bị tồn tại');
select has_table('public', 'equipment_loans', 'bảng mượn/trả tồn tại');
select has_function('public', 'borrow_equipment', array['uuid', 'integer', 'uuid', 'timestamptz', 'text'], 'RPC mượn tồn tại');
select has_function('public', 'return_equipment', array['uuid', 'integer', 'equipment_condition', 'text'], 'RPC trả tồn tại');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('f2000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kt-leader@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f2000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kt-member@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f2000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kt-outsider@test.local', crypt('x', gen_salt('bf')), now(), now(), now()),
  ('f2000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kt-admin@test.local', crypt('x', gen_salt('bf')), now(), now(), now());
insert into public.profiles (id, username, display_name) values
  ('f2000000-0000-4000-8000-000000000001', 'KT_LEADER', 'Trưởng Ban Kỹ thuật'),
  ('f2000000-0000-4000-8000-000000000002', 'KT_MEMBER', 'Thành viên Ban Kỹ thuật'),
  ('f2000000-0000-4000-8000-000000000003', 'KT_OUT', 'Thành viên Ban Y tế'),
  ('f2000000-0000-4000-8000-000000000004', 'KT_ADMIN', 'Super Admin thiết bị');
insert into public.staff_profiles (id, profile_id, title, full_name, phone) values
  ('f8000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'anh', 'Trưởng Ban Kỹ thuật', '0980000001'),
  ('f8000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002', 'anh', 'Thành viên Ban Kỹ thuật', '0980000002'),
  ('f8000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000003', 'chi', 'Thành viên Ban Y tế', '0980000003');
insert into public.role_assignments (profile_id, role) values
  ('f2000000-0000-4000-8000-000000000004', 'super_admin');
insert into public.committee_memberships (committee_id, staff_profile_id, position) values
  ('30000000-0000-0000-0000-000000000002', 'f8000000-0000-4000-8000-000000000001', 'leader'),
  ('30000000-0000-0000-0000-000000000002', 'f8000000-0000-4000-8000-000000000002', 'member'),
  ('30000000-0000-0000-0000-000000000006', 'f8000000-0000-4000-8000-000000000003', 'leader');

set local role authenticated;

-- Kho chỉ tồn tại ở Ban Kỹ thuật (docs/02 §11.6).
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$insert into public.equipment_items (committee_id, asset_code, name, total_quantity, available_quantity, updated_by)
    values ('30000000-0000-0000-0000-000000000006', 'YT-001', 'Túi sơ cứu', 2, 2, 'f2000000-0000-4000-8000-000000000003')$$,
  '23514', 'EQUIPMENT_COMMITTEE_INVALID', 'Ban không giữ kho thì không tạo được thiết bị');

select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.equipment_items (committee_id, asset_code, name, total_quantity, available_quantity, updated_by)
    values ('30000000-0000-0000-0000-000000000002', 'KT-000', 'Thành viên tự thêm', 1, 1, 'f2000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'thành viên thường không tạo được danh mục thiết bị');

select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.equipment_items (id, committee_id, asset_code, name, category, total_quantity, available_quantity, storage_location, updated_by) values
    ('f9000000-0000-4000-8000-000000000001', '30000000-0000-0000-0000-000000000002', 'KT-001', 'Loa kéo', 'Âm thanh', 3, 3, 'Kho tầng trệt', 'f2000000-0000-4000-8000-000000000001'),
    ('f9000000-0000-4000-8000-000000000002', '30000000-0000-0000-0000-000000000002', 'KT-002', 'Micro không dây', 'Âm thanh', 4, 4, 'Kho tầng trệt', 'f2000000-0000-4000-8000-000000000001')$$,
  'Trưởng Ban Kỹ thuật tạo được danh mục thiết bị');

-- Số lượng khả dụng là hệ quả của mượn/trả, không phải ô nhập liệu.
select throws_ok(
  $$update public.equipment_items set available_quantity = 99, updated_by = 'f2000000-0000-4000-8000-000000000001'
    where id = 'f9000000-0000-4000-8000-000000000001'$$,
  '23514', 'EQUIPMENT_AVAILABLE_READONLY', 'không sửa tay được số lượng khả dụng');
select lives_ok(
  $$update public.equipment_items set storage_location = 'Kho lầu 1', updated_by = 'f2000000-0000-4000-8000-000000000001'
    where id = 'f9000000-0000-4000-8000-000000000001'$$,
  'vẫn sửa được thông tin danh mục');

-- Sổ mượn/trả không ghi trực tiếp được: mọi thao tác đi qua RPC.
select throws_ok(
  $$insert into public.equipment_loans (equipment_item_id, committee_id, quantity, borrower_staff_id, handed_over_by)
    values ('f9000000-0000-4000-8000-000000000001', '30000000-0000-0000-0000-000000000002', 1, 'f8000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'không INSERT thẳng vào sổ mượn/trả');

-- Ngoài Ban Kỹ thuật thì không mượn, không đọc.
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.equipment_items), 0, 'Ban khác không đọc được kho Ban Kỹ thuật');
select throws_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000001', 1, 'f8000000-0000-4000-8000-000000000003', null, null)$$,
  '42501', 'FORBIDDEN', 'ngoài Ban Kỹ thuật không mượn được');

-- Thành viên Ban Kỹ thuật mượn/trả được (docs/05).
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.equipment_items), 2, 'thành viên Ban Kỹ thuật đọc được kho');
select throws_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000001', 5, 'f8000000-0000-4000-8000-000000000002', null, null)$$,
  '23514', 'EQUIPMENT_NOT_ENOUGH', 'không mượn quá tồn kho');
select throws_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000001', 0, 'f8000000-0000-4000-8000-000000000002', null, null)$$,
  '23514', 'EQUIPMENT_QUANTITY_INVALID', 'số lượng mượn phải dương');
select lives_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000001', 2, 'f8000000-0000-4000-8000-000000000002', '2090-10-01 18:00+07', 'Mượn cho sinh hoạt')$$,
  'thành viên Ban Kỹ thuật mượn được');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000001'),
  1, 'mượn xong trừ đúng tồn kho');
select is(
  (select handed_over_by from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000001'),
  'f2000000-0000-4000-8000-000000000002'::uuid,
  'người bàn giao lấy từ phiên đăng nhập');
select is(
  (select status from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000001'),
  'borrowed', 'phiếu mới ở trạng thái đang mượn');

-- Trả đủ: cộng lại kho, không đổi tổng số.
select lives_ok(
  $$select public.return_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000001'),
      null, 'good', 'Trả đủ')$$,
  'trả được thiết bị');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000001'),
  3, 'trả đủ thì kho về nguyên trạng');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000001'),
  3, 'trả đủ không đổi tổng số');
select is(
  (select received_by from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000001'),
  'f2000000-0000-4000-8000-000000000002'::uuid,
  'người nhận lấy từ phiên đăng nhập');

-- Trả lần hai không được cộng kho thêm lần nữa.
select lives_ok(
  $$select public.return_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000001'),
      null, null, null)$$,
  'trả lại lần hai không lỗi');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000001'),
  3, 'trả lại lần hai là idempotent');

-- Mất/hỏng: phần không trả về kho rời khỏi tổng số (WF-13 bước 5).
select lives_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000002', 3, 'f8000000-0000-4000-8000-000000000002', null, null)$$,
  'mượn micro để thử tình huống mất');
select throws_ok(
  $$select public.return_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000002'),
      5, null, null)$$,
  '23514', 'EQUIPMENT_RESTORED_INVALID', 'không trả nhiều hơn số đã mượn');
select lives_ok(
  $$select public.return_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000002'),
      2, 'damaged', 'Mất 1 micro')$$,
  'trả thiếu kèm tình trạng hỏng');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000002'),
  3, 'phần trả được cộng lại kho');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000002'),
  3, 'phần mất trừ khỏi tổng số');
select is(
  (select condition from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000002'),
  'damaged'::public.equipment_condition, 'tình trạng thiết bị cập nhật theo lần trả');

-- Quyền toàn cục vẫn thao tác được dù không thuộc Ban.
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000001', 1, 'f8000000-0000-4000-8000-000000000001', null, 'Super Admin mượn hộ')$$,
  'quyền toàn cục mượn được');

select * from finish();
rollback;
