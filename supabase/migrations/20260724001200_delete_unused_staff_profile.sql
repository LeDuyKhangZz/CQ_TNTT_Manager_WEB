-- ============================================================================
-- M04-B / D-106 + D-109 — Xóa hẳn một hồ sơ nhân sự CHƯA TỪNG DÙNG (M04-F07).
--
-- 5W-08: tạo nhầm hai hồ sơ cho cùng một người là chuyện dễ xảy ra (5W-05 làm
-- thao tác ghi im lặng ⇒ người ta bấm lại), nhưng KHÔNG có cách nào dọn: RLS
-- không có policy DELETE và 7 bảng khác tham chiếu tới `staff_profiles`. Mỗi lần
-- nhầm tiêu vĩnh viễn một mã `GLVxxx` và danh sách nhân sự mất độ tin cậy.
--
-- D-106 (chủ dự án duyệt 2026-07-24): cho xóa cứng, nhưng CHỈ khi hồ sơ chưa
-- từng được dùng vào việc gì. D-109 (chủ dự án duyệt 2026-07-24): người xóa là
-- **bốn vai trò ghi toàn xứ đoàn** — trùng đúng `app.can_global_write()`, tức
-- cùng nhóm đang tạo được hồ sơ. Ai tạo nhầm thì dọn được ngay.
--
-- NĂM quyết định cài đặt cần nhớ:
--
--   1. VẪN KHÔNG CÓ POLICY DELETE trên `staff_profiles`, và đó là chủ ý. Nếu mở
--      policy thì mọi lệnh `delete from staff_profiles` của bất kỳ phiên nào
--      cũng đi lọt miễn qua được `using`, và điều kiện "chưa từng dùng" sẽ phải
--      viết lại trong `using` bằng 8 câu `not exists` — một biểu thức khổng lồ
--      chạy lại mỗi dòng, không khoá được hàng, và không nói được LÝ DO bị chặn.
--      Đường xóa duy nhất là RPC dưới đây. `revoke delete` vẫn giữ nguyên.
--
--   2. `app.staff_profile_delete_blockers()` là NGUỒN SỰ THẬT DUY NHẤT của điều
--      kiện "chưa từng dùng", và cả giao diện lẫn RPC đều gọi đúng nó. Nếu trang
--      chi tiết tự đếm bằng truy vấn riêng thì nó đếm DƯỚI RLS của người xem —
--      một phiếu mượn thiết bị mà người xem không được đọc sẽ biến mất khỏi phép
--      đếm, và màn hình sẽ hứa "xóa được" trước một RPC chắc chắn từ chối.
--      Hàm chạy `security definer` nên nhìn thấy mọi dòng, y như RPC.
--
--   3. HAI trong bảy bảng tham chiếu dùng `on delete set null`
--      (`teaching_plans.created_by_staff_id`, `committee_announcements.author_staff_id`).
--      Khoá ngoại KHÔNG chặn xóa ở hai bảng đó — nó lặng lẽ xoá tên tác giả khỏi
--      một bản giáo án hay một thông báo vẫn đang hiển thị. Vì vậy hai bảng này
--      phải được đếm TAY ở đây; trông thừa nếu chỉ nhìn `on delete restrict` của
--      năm bảng còn lại, nhưng bỏ đi là mất tên người soạn.
--
--   4. GÕ LẠI ĐÚNG HỌ TÊN được kiểm Ở DB, không chỉ ở hộp thoại. Hộp thoại là
--      ma sát cho người dùng; chốt chặn là nơi này. So sánh sau khi cắt khoảng
--      trắng hai đầu và gộp khoảng trắng giữa (người ta hay gõ thừa một dấu cách),
--      nhưng CÓ phân biệt hoa/thường và dấu tiếng Việt — gõ lại tên là để buộc
--      người ta nhìn kỹ mình đang xóa ai.
--
--   5. Hàm trả về `jsonb` mang theo `staff_code` + `full_name` của hồ sơ vừa xóa.
--      Sau lệnh `delete` thì không còn dòng nào để đọc lại, mà cả câu thông báo
--      cho người dùng lẫn dòng nhật ký D-65 đều cần đúng hai giá trị đó.
-- ============================================================================

-- Nhật ký D-65: xóa hồ sơ nhân sự là thao tác nhạy cảm và phải để lại vết. Dùng
-- lại `account_audit_events` thay vì dựng bảng nhật ký thứ hai — nó đã append-only
-- tuyệt đối, đã chỉ Super Admin đọc, và một hệ thống có hai quyển nhật ký là một
-- hệ thống có hai chỗ để quên ghi. Hồ sơ xóa được thì theo định nghĩa KHÔNG có
-- tài khoản, nên `target_profile_id` để null và `target_username` mang ảnh chụp
-- "GLVxxx · Họ tên" (cột đó `not null`, và đây là danh tính duy nhất còn lại).
alter type public.account_audit_action add value if not exists 'delete_staff_profile';

comment on table public.account_audit_events is
  'Nhật ký append-only mọi thao tác tài khoản và việc xóa hồ sơ nhân sự (D-65). '
  'Chỉ Super Admin đọc; không ai sửa/xóa.';

-- ---------------------------------------------------------------------------
-- Lý do một hồ sơ KHÔNG xóa được — dùng chung cho giao diện và cho RPC.
-- Mảng rỗng nghĩa là xóa được. Mỗi phần tử là một câu tiếng Việt đọc lên hiểu
-- ngay, vì nó được hiển thị thẳng cho người dùng chứ không phải mã lỗi.
-- ---------------------------------------------------------------------------
create or replace function app.staff_profile_delete_blockers(p_staff_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_blockers text[] := array[]::text[];
  v_count integer;
  v_profile_id uuid;
  v_exists boolean;
begin
  select true, profile_id into v_exists, v_profile_id
  from public.staff_profiles
  where id = p_staff_id;
  if v_exists is null then
    return array['Không tìm thấy hồ sơ này.'];
  end if;

  if v_profile_id is not null then
    -- `::text` KHÔNG thừa: `text[] || 'chuỗi'` với một literal chưa định kiểu thì
    -- Postgres chọn nhánh `anyarray || anyarray` và cố đọc câu tiếng Việt như một
    -- mảng ⇒ `22P02 malformed array literal`. Các nhánh khác dùng `format()` nên
    -- đã có kiểu `text` sẵn; chỉ nhánh này là literal trần.
    v_blockers := v_blockers || 'Hồ sơ đang gắn với một tài khoản đăng nhập. Hãy xóa tài khoản trước.'::text;
  end if;

  select count(*) into v_count from public.class_staff_assignments where staff_profile_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Đã có %s lần phân công lớp trong lịch sử.', v_count);
  end if;

  select count(*) into v_count from public.staff_attendance_records where staff_profile_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Đã có %s bản ghi điểm danh huynh trưởng.', v_count);
  end if;

  -- `on delete set null` — khoá ngoại KHÔNG chặn, phải tự đếm (ghi chú 3).
  select count(*) into v_count from public.teaching_plans where created_by_staff_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Là người soạn %s bản giáo án.', v_count);
  end if;

  select count(*) into v_count from public.teaching_plan_items where teacher_staff_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Được xếp dạy trong %s mục giáo án.', v_count);
  end if;

  select count(*) into v_count from public.committee_memberships where staff_profile_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Đã tham gia %s Ban.', v_count);
  end if;

  -- `on delete set null` — như ghi chú 3.
  select count(*) into v_count from public.committee_announcements where author_staff_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Là tác giả %s thông báo của Ban.', v_count);
  end if;

  select count(*) into v_count from public.equipment_loans where borrower_staff_id = p_staff_id;
  if v_count > 0 then
    v_blockers := v_blockers || format('Đã có %s phiếu mượn thiết bị.', v_count);
  end if;

  return v_blockers;
end;
$$;

revoke all on function app.staff_profile_delete_blockers(uuid) from public, anon;
grant execute on function app.staff_profile_delete_blockers(uuid) to authenticated, service_role;

comment on function app.staff_profile_delete_blockers(uuid) is
  'D-106: các lý do khiến một hồ sơ nhân sự KHÔNG xóa được, bằng tiếng Việt. '
  'Mảng rỗng = xóa được. Nguồn sự thật duy nhất cho cả giao diện lẫn RPC xóa.';

-- Vỏ bọc public để trang chi tiết gọi được qua PostgREST. Kiểm quyền tại đây:
-- danh sách lý do có kèm số đếm của bảy bảng, không phải thứ cho mọi người xem.
create or replace function public.staff_profile_delete_blockers(p_staff_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return app.staff_profile_delete_blockers(p_staff_id);
end;
$$;

revoke all on function public.staff_profile_delete_blockers(uuid) from public, anon;
grant execute on function public.staff_profile_delete_blockers(uuid) to authenticated, service_role;

comment on function public.staff_profile_delete_blockers(uuid) is
  'D-106/D-109: lý do không xóa được hồ sơ, cho giao diện. Chỉ 4 vai trò ghi toàn xứ đoàn.';

-- ---------------------------------------------------------------------------
-- Xóa hồ sơ chưa từng dùng. Đường DUY NHẤT để một dòng `staff_profiles` biến mất.
-- ---------------------------------------------------------------------------
create or replace function public.delete_unused_staff_profile(
  p_staff_id uuid,
  p_confirm_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff public.staff_profiles;
  v_blockers text[];
begin
  -- D-109 — bốn vai trò ghi toàn xứ đoàn. Đặt TRƯỚC cả việc đọc dòng: người
  -- không có quyền xóa cũng không cần biết hồ sơ đó có tồn tại hay không.
  if not app.can_global_write() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Khoá dòng: hai người cùng bấm xóa, hoặc một người bấm xóa trong lúc người
  -- kia đang phân công lớp cho chính hồ sơ đó. Người sau phải thấy trạng thái
  -- sau khi người trước xong, nên phép đếm "chưa từng dùng" chạy SAU khi khoá.
  select * into v_staff from public.staff_profiles where id = p_staff_id for update;
  if v_staff.id is null then
    raise exception 'STAFF_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Gõ lại đúng họ tên (ghi chú 4). Gộp khoảng trắng thừa, giữ nguyên hoa/thường
  -- và dấu tiếng Việt.
  if regexp_replace(btrim(coalesce(p_confirm_name, '')), '\s+', ' ', 'g')
     <> regexp_replace(btrim(v_staff.full_name), '\s+', ' ', 'g') then
    raise exception 'NAME_MISMATCH' using errcode = '22023';
  end if;

  v_blockers := app.staff_profile_delete_blockers(p_staff_id);
  if array_length(v_blockers, 1) > 0 then
    raise exception 'STAFF_PROFILE_IN_USE: %', array_to_string(v_blockers, ' ')
      using errcode = '23503';
  end if;

  delete from public.staff_profiles where id = p_staff_id;

  -- Ghi chú 5 — trả danh tính vừa xóa cho câu thông báo và cho nhật ký D-65.
  return jsonb_build_object(
    'staffCode', v_staff.staff_code::text,
    'fullName', v_staff.full_name
  );
end;
$$;

revoke all on function public.delete_unused_staff_profile(uuid, text) from public, anon;
grant execute on function public.delete_unused_staff_profile(uuid, text) to authenticated, service_role;

comment on function public.delete_unused_staff_profile(uuid, text) is
  'D-106/D-109: xóa hẳn một hồ sơ nhân sự chưa từng dùng (không tài khoản, không '
  'phân công, không bản ghi nào tham chiếu). Quyền: app.can_global_write(). Bắt '
  'gõ lại đúng họ tên. Không có policy DELETE nào trên bảng — đây là đường duy nhất.';
