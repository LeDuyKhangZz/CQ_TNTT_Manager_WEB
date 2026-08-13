-- M02-A · I2 (TB-F02) — "Sinh lớp mặc định" không bao giờ được báo thành công giả.
--
-- 5W-F02 (sự cố production đã xảy ra): `class_templates` rỗng ⇒ `insert ... select`
-- chèn 0 dòng ⇒ hàm `return 0` ⇒ server action coi mọi giá trị trả về là thành công
-- ⇒ người vận hành tin cơ cấu lớp đã sẵn sàng trong khi `/classes` rỗng. Nguyên nhân
-- gốc: MỘT con số 0 mang HAI nghĩa trái ngược — "đã sinh rồi" (đúng, idempotent) và
-- "không có gì để sinh" (hỏng cấu hình).
--
-- Bản mới tách hẳn hai nghĩa đó bằng cách trả về `jsonb`:
--   { "inserted": 19, "expected": 19, "already_present": 0 }
-- và **ném lỗi** cho những tình huống trước đây im lặng:
--   · thiếu danh mục lớp chuẩn   → CLASS_TEMPLATES_EMPTY (BR-M02-N01)
--   · năm học đã đóng/lưu trữ    → ACADEMIC_YEAR_CLOSED   (BR-M02-N03)
--
-- 🔴 Quyền thu hẹp về Super Admin theo **D-112** (chủ dự án chốt 2026-07-25): trước
-- đây là `app.can_global_write()` (4 vai trò) trong khi cửa vào trang `/admin` chỉ
-- mở cho Super Admin — ba tầng nói ba kiểu. Nay cả ba tầng nói cùng một câu.
--
-- Đổi kiểu trả về nên phải `drop` trước; `create or replace` không đổi được kiểu.
-- Rollback: drop hàm này, tạo lại nguyên văn bản ở `20260716000300:89-117`.

drop function public.generate_default_classes(uuid);

create function public.generate_default_classes(target_academic_year_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_count integer;
  already_present integer;
  inserted_count integer;
  year_status public.academic_year_status;
begin
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select status into year_status
  from public.academic_years
  where id = target_academic_year_id;
  if year_status is null then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND' using errcode = 'P0002';
  end if;
  if year_status not in ('draft', 'current') then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '23514';
  end if;

  -- Điều kiện tiên quyết, kiểm TRƯỚC khi ghi: không có mẫu lớp nào thì đây là
  -- môi trường sai cấu hình, không phải một lượt sinh lớp không có gì để làm.
  select count(*) into expected_count from public.class_templates where is_active;
  if expected_count = 0 then
    raise exception 'CLASS_TEMPLATES_EMPTY' using errcode = '23514';
  end if;

  select count(*) into already_present
  from public.classes where academic_year_id = target_academic_year_id;

  insert into public.classes (
    academic_year_id, grade_level_id, section_code, class_kind, term_scope, display_name, updated_by
  )
  select target_academic_year_id, template.grade_level_id, template.section_code,
    template.class_kind, template.term_scope, template.display_name, auth.uid()
  from public.class_templates as template
  where template.is_active
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  return jsonb_build_object(
    'inserted', inserted_count,
    'expected', expected_count,
    'already_present', already_present
  );
end;
$$;

revoke all on function public.generate_default_classes(uuid) from public, anon;
grant execute on function public.generate_default_classes(uuid) to authenticated, service_role;

comment on function public.generate_default_classes(uuid) is
  'Sinh cơ cấu lớp chuẩn cho một năm học (Super Admin, D-112). Trả {inserted, expected, already_present}; ném CLASS_TEMPLATES_EMPTY khi thiếu danh mục và ACADEMIC_YEAR_CLOSED khi năm đã đóng.';
