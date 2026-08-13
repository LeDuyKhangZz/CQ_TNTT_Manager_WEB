begin;

-- P6-T3: kho thiết bị chỉ thuộc Ban Kỹ thuật, mượn/trả đi qua RPC có row lock,
-- số lượng khả dụng không sửa tay được và trả lại lần hai là idempotent (WF-13).
-- M09-B bổ sung: trả dần tách khỏi báo hỏng/mất, nhập thêm/giảm tồn kho, và ô
-- chọn người mượn mở sang mọi nhân sự mà KHÔNG nới quyền đọc hồ sơ nhân sự.
select plan(72);

select has_table('public', 'equipment_items', 'bảng thiết bị tồn tại');
select has_table('public', 'equipment_loans', 'bảng mượn/trả tồn tại');
select has_table('public', 'equipment_loan_events', 'nhật ký nhận lại/báo hỏng tồn tại');
select has_table('public', 'equipment_stock_adjustments', 'nhật ký đổi tổng kho tồn tại');
select has_function('public', 'borrow_equipment', array['uuid', 'integer', 'uuid', 'timestamptz', 'text'], 'RPC mượn tồn tại');
select has_function('public', 'return_equipment', array['uuid', 'integer', 'equipment_condition', 'text'], 'RPC trả tồn tại');
select has_function('public', 'receive_equipment', array['uuid', 'integer', 'equipment_condition', 'text'], 'RPC nhận lại hàng tồn tại');
select has_function('public', 'write_off_equipment', array['uuid', 'integer', 'equipment_condition', 'text'], 'RPC báo hỏng/mất tồn tại');
select has_function('public', 'adjust_equipment_stock', array['uuid', 'integer', 'equipment_stock_adjustment_reason', 'text'], 'RPC đổi tổng kho tồn tại');
select has_function('public', 'list_equipment_borrower_options', array['uuid'], 'RPC danh sách người mượn tồn tại');

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
-- SEC-M09-12 (M09-A): tổng kho cũng là sổ sách, không phải ô nhập liệu. Trước
-- M09-A câu lệnh này CHẠY ĐƯỢC — Trưởng Ban bơm tổng kho tuỳ ý ngoài mọi phiếu.
select throws_ok(
  $$update public.equipment_items set total_quantity = 9999, updated_by = 'f2000000-0000-4000-8000-000000000001'
    where id = 'f9000000-0000-4000-8000-000000000001'$$,
  '23514', 'EQUIPMENT_TOTAL_READONLY', 'không sửa tay được tổng số lượng');
-- SEC-M09-13 (M09-A): kho mới phải bắt đầu ở trạng thái chưa ai mượn.
select throws_ok(
  $$insert into public.equipment_items (committee_id, asset_code, name, total_quantity, available_quantity, updated_by)
    values ('30000000-0000-0000-0000-000000000002', 'KT-003', 'Kho lệch từ đầu', 100, 0, 'f2000000-0000-4000-8000-000000000001')$$,
  '23514', 'EQUIPMENT_STOCK_MISMATCH', 'không tạo được thiết bị có khả dụng lệch tổng số');
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

-- ══════════════════════════════════════════════════════════════════════════
-- M09-B · TB-M09-02 PA A — trả dần KHÔNG được ăn vào tổng kho
-- ══════════════════════════════════════════════════════════════════════════
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$insert into public.equipment_items (id, committee_id, asset_code, name, total_quantity, available_quantity, updated_by)
    values ('f9000000-0000-4000-8000-000000000003', '30000000-0000-0000-0000-000000000002', 'KT-004', 'Bộ dây tín hiệu', 5, 5, 'f2000000-0000-4000-8000-000000000001')$$,
  'tạo thiết bị cho kịch bản trả dần');

select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.borrow_equipment('f9000000-0000-4000-8000-000000000003', 5, 'f8000000-0000-4000-8000-000000000002', null, 'Mượn cả bộ')$$,
  'mượn cả 5 cái');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  0, 'mượn hết thì kho trống');

-- AC-M09-25: hôm nay chỉ mang về 3 — phiếu phải CÒN MỞ và tổng kho KHÔNG đổi.
-- Trước M09-B cùng thao tác này đóng phiếu và trừ 2 cái khỏi tổng kho.
select lives_ok(
  $$select public.receive_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
      3, null, 'Mang về 3 cái')$$,
  'nhận lại một phần');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  3, 'phần nhận lại cộng vào kho');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  5, 'nhận lại KHÔNG BAO GIỜ đụng tổng kho');
select is(
  (select status from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  'borrowed', 'phiếu vẫn mở khi còn nợ');
select is(
  (select outstanding_quantity from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  2, 'còn nợ đúng 2 cái');
select is(
  (select restored_quantity from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  3, 'tổng đã nhận lại cộng dồn đúng');

select throws_ok(
  $$select public.receive_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
      3, null, null)$$,
  '23514', 'EQUIPMENT_RESTORED_INVALID', 'không nhận lại nhiều hơn số còn nợ');

-- AC-M09-26: báo hỏng/mất phải có ghi chú, và chỉ nó mới được trừ tổng kho.
select throws_ok(
  $$select public.write_off_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
      2, 'lost', '   ')$$,
  '23514', 'EQUIPMENT_WRITE_OFF_NOTE_REQUIRED', 'báo hỏng/mất phải ghi rõ lý do');
select lives_ok(
  $$select public.write_off_equipment(
      (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
      2, 'lost', 'Mất trên đường chở về')$$,
  'báo mất 2 cái còn lại');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  3, 'phần mất rời khỏi tổng kho');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  3, 'báo mất KHÔNG cộng vào số khả dụng');
select is(
  (select status from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  'returned', 'hết nợ thì phiếu tự đóng');
select is(
  (select outstanding_quantity from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  0, 'phiếu đóng thì không còn nợ cái nào');
select is(
  (select count(*)::integer from public.equipment_loan_events
   where loan_id = (select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003')),
  2, 'mỗi lần nhận lại/báo mất là một dòng nhật ký (D-65)');

-- ══════════════════════════════════════════════════════════════════════════
-- M09-B · TB-M09-04 — nhập thêm và giảm tồn kho
-- ══════════════════════════════════════════════════════════════════════════
-- Chặt hơn mượn/trả: thành viên thường KHÔNG đổi được tổng tài sản.
select throws_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', 5, 'purchase', null)$$,
  '42501', 'FORBIDDEN', 'thành viên thường không đổi được tổng kho');

select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', 0, 'stocktake', 'Không đổi gì')$$,
  '23514', 'EQUIPMENT_ADJUST_INVALID', 'điều chỉnh 0 cái là vô nghĩa');
-- AC-M09-29
select lives_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', 5, 'purchase', 'Mua bổ sung')$$,
  'Trưởng Ban nhập thêm được');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  8, 'nhập thêm cộng vào tổng kho');
select is(
  (select available_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  8, 'nhập thêm cộng luôn vào số khả dụng');
select is(
  (select total_after from public.equipment_stock_adjustments
   where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
  8, 'nhật ký ghi đúng tổng kho sau khi đổi');

select throws_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', -100, 'stocktake', 'Kiểm kê')$$,
  '23514', 'EQUIPMENT_NOT_ENOUGH', 'không giảm quá số đang nằm trong kho');
select throws_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', -2, 'damaged', null)$$,
  '23514', 'EQUIPMENT_ADJUST_NOTE_REQUIRED', 'giảm tồn kho phải ghi rõ lý do');
select lives_ok(
  $$select public.adjust_equipment_stock('f9000000-0000-4000-8000-000000000003', -2, 'damaged', 'Cháy khi cất kho')$$,
  'giảm được tồn kho khi thiết bị hỏng trong kho');
select is(
  (select total_quantity from public.equipment_items where id = 'f9000000-0000-4000-8000-000000000003'),
  6, 'giảm tồn kho trừ đúng tổng kho');

-- ══════════════════════════════════════════════════════════════════════════
-- M09-B · D-94 + D-97 — ô "Người mượn" mở, quyền đọc hồ sơ nhân sự KHÔNG mở
-- ══════════════════════════════════════════════════════════════════════════
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);
-- Nợ #13 vẫn nguyên: thành viên Ban Kỹ thuật KHÔNG đọc được hồ sơ người Ban Y tế.
select is(
  (select count(*)::integer from public.staff_profiles where id = 'f8000000-0000-4000-8000-000000000003'),
  0, 'quyền đọc hồ sơ nhân sự KHÔNG bị nới rộng');
-- AC-M09-30: nhưng vẫn cho người đó mượn được, vì cửa sổ hẹp chỉ trả về tên.
select is(
  (select count(*)::integer from public.list_equipment_borrower_options('30000000-0000-0000-0000-000000000002')
   where staff_profile_id = 'f8000000-0000-4000-8000-000000000003'),
  1, 'người ngoài Ban Kỹ thuật vẫn chọn được làm người mượn');

select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select * from public.list_equipment_borrower_options('30000000-0000-0000-0000-000000000002')$$,
  '42501', 'FORBIDDEN', 'người không thao tác được kho thì không lấy được danh sách');

-- Hai bảng nhật ký chỉ ghi được qua RPC.
select set_config('request.jwt.claim.sub', 'f2000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.equipment_loan_events (loan_id, committee_id, kind, quantity)
    values ((select id from public.equipment_loans where equipment_item_id = 'f9000000-0000-4000-8000-000000000003'),
            '30000000-0000-0000-0000-000000000002', 'receive', 1)$$,
  '42501', null, 'không ghi tay vào nhật ký mượn/trả');
select throws_ok(
  $$insert into public.equipment_stock_adjustments (equipment_item_id, committee_id, delta, reason, total_after)
    values ('f9000000-0000-4000-8000-000000000003', '30000000-0000-0000-0000-000000000002', 99, 'purchase', 99)$$,
  '42501', null, 'không ghi tay vào nhật ký tổng kho');

select * from finish();
rollback;
