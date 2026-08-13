-- ============================================================================
-- M03-B — nền cơ sở dữ liệu cho bốn hạng mục của đợt. Gom vào MỘT migration vì
-- cả bốn dựa trên đúng hai khái niệm mới, và tách ra thì hai khái niệm ấy bị
-- định nghĩa hai lần:
--
--   1. `app.fold_vietnamese()` — "hai chuỗi này có phải cùng một tên không" khi
--      người gõ bỏ dấu. Dùng cho ô tìm kiếm (D-126) VÀ cho phép dò trùng
--      (TB-F13). Hai chỗ dùng hai định nghĩa chính là hình dạng của lỗi F13:
--      đường Excel có dedup, đường gõ tay không có.
--   2. "ngành của em" = ngành của lớp em đang học (ghi danh `active`/`paused`).
--      Dùng cho quyền GHI hồ sơ (D-123) VÀ quyền ĐỌC người giám hộ (D-124).
--
-- Bốn quyết định của chủ dự án ngày 2026-07-28 (sau M03-A):
--   · D-123  Trưởng/Phó ngành tạo hồ sơ **phải chọn lớp trong ngành mình**;
--            hồ sơ và ghi danh sinh ra trong CÙNG một giao dịch.
--   · D-124  Trưởng/Phó ngành đọc được người giám hộ của em trong ngành mình,
--            và tra được danh sách tên + số điện thoại để CHỌN người đã có.
--   · D-125  KHÔNG lưu vết việc bỏ qua cảnh báo trùng (Q-M03-06 = không)
--            ⇒ migration này cố ý không có bảng nhật ký nào.
--   · D-126  Tìm kiếm không dấu, giống màn hình Nhân sự của M04.
--
-- 🔴 Vì sao D-123 KHÔNG phải là "thêm hai vai trò vào policy INSERT":
-- ngành của một em suy ra từ lớp em học, mà hồ sơ vừa tạo thì CHƯA có lớp nào.
-- Nới INSERT thẳng thì "chỉ trong ngành mình" không có gì để kiểm — và tệ hơn,
-- người vừa tạo cũng KHÔNG đọc lại được hồ sơ của chính mình
-- (`app.can_access_student` chỉ thấy em qua ghi danh), nên `insert ... returning`
-- trả 0 dòng và người dùng nhận "tạo thất bại" trên một hồ sơ đã được ghi.
-- Đường ra là một hàm ghi cả hai bảng cùng lúc.
-- ============================================================================

-- ── 1. Chuẩn hoá chữ: bỏ dấu để so khớp (D-126) ─────────────────────────────
--
-- Bản sao chính xác của `foldVietnamese()` ở `src/lib/text/fold-vietnamese.ts`,
-- và `tests/unit/…` bên TypeScript cùng pgTAP bên này canh cho hai bản không
-- lệch nhau. Vì sao phải có bản SQL: với ~900 em, lọc trong bộ nhớ Node như
-- màn hình Nhân sự (hàng chục dòng) là kéo cả bảng về mỗi lần mở trang.
--
-- `immutable` là bắt buộc — cột sinh ra (`generated always as`) chỉ nhận hàm
-- bất biến. Hàm này bất biến thật: không đọc bảng nào, không phụ thuộc locale
-- (bảng `translate` viết cứng), không phụ thuộc `now()`.
--
-- `normalize(…, nfc)` chạy TRƯỚC: tên gõ từ máy Mac vào bằng tệp Excel ở dạng
-- PHÂN RÃ (`"A" + U+0300` thay vì `"À"`), và `translate` làm việc trên KÝ TỰ
-- nên nó không đụng được vào dấu rời. Thiếu bước này thì "Trần" nhập từ Mac
-- không bao giờ khớp "Trần" nhập từ bàn phím Việt — đúng lỗi `initialsFromName`
-- đã bắt được ở mục 0.8 của Đợt 0-UI.
--
-- `đ` phải thay tay: nó KHÔNG phải "d + dấu phụ" trong Unicode nên bước NFD/NFC
-- không đụng tới.
create or replace function app.fold_vietnamese(p_value text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(
    regexp_replace(
      translate(
        lower(normalize(coalesce(p_value, ''), nfc)),
        'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
      ),
      '\s+', ' ', 'g'
    )
  )
$$;

comment on function app.fold_vietnamese(text) is
  'Bỏ dấu + hạ chữ thường + gộp khoảng trắng. Bản SQL của foldVietnamese() ở src/lib/text (D-126).';

-- Cột sinh sẵn thay vì tính lúc truy vấn: `ilike` trên một biểu thức thì mọi
-- chỉ mục đều vô dụng, và PostgREST cũng không lọc được theo biểu thức.
alter table public.students
  add column search_name text
  generated always as (app.fold_vietnamese(full_name)) stored;

comment on column public.students.search_name is
  'Họ tên đã bỏ dấu, dùng cho ô tìm kiếm và phép dò trùng (D-126, TB-F13).';

-- Chỉ mục cho phép dò trùng (`=`, TB-F13). Ô tìm kiếm dùng `like '%…%'` nên
-- KHÔNG dùng được chỉ mục này — với ~900 dòng đó là một lượt quét bảng rẻ.
-- **Không thêm `pg_trgm` trước khi đo** (`07_IMPLEMENTATION_IMPACT` §3).
create index students_search_name_idx on public.students (search_name);

-- ── 2. "Ngành của em" — nền cho D-123 và D-124 ──────────────────────────────
--
-- Viết theo TẬP HỢP (trả mảng, policy so cột với mảng) chứ không phải hàm nhận
-- id gọi theo từng dòng. Đây là bài học đã đo được ở `20260721000200`: helper
-- `security definer` không inline được, nên gọi theo dòng trên bảng 900 em mất
-- 2,4 giây. Đặt trong `(select …)` để Postgres tính một lần cho cả câu lệnh.
create or replace function app.sector_managed_student_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when app.current_role() in ('sector_leader', 'sector_deputy') then (
      select coalesce(array_agg(distinct enrollment.student_id), '{}'::uuid[])
      from public.enrollments as enrollment
      join public.classes as class on class.id = enrollment.class_id
      join public.grade_levels as grade on grade.id = class.grade_level_id
      where enrollment.status in ('active', 'paused')
        and grade.sector_id = app.current_sector_id()
    )
    else '{}'::uuid[]
  end
$$;

comment on function app.sector_managed_student_ids() is
  'Thiếu nhi đang học trong ngành của Trưởng/Phó ngành đang đăng nhập; vai trò khác trả rỗng (D-123).';

-- D-124 — người giám hộ của đúng những em ấy, không hơn.
--
-- ⚠️ Cố ý KHÔNG dùng `app.class_scoped_student_ids()` dù nó sẵn có và ngắn hơn:
-- hàm đó gồm cả lớp mình ĐỨNG LỚP, nên dùng nó là nới quyền đọc liên lạc phụ
-- huynh cho cả Giáo lý viên lớp. Chủ dự án chỉ duyệt cho vai trò NGÀNH.
create or replace function app.sector_guardian_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct student.guardian_id), '{}'::uuid[])
  from public.students as student
  where student.id = any (app.sector_managed_student_ids())
$$;

comment on function app.sector_guardian_ids() is
  'Người giám hộ của thiếu nhi trong ngành mình — chỉ vai trò ngành (D-124).';

-- Ai được ghi hồ sơ thiếu nhi / người giám hộ sau D-63.
-- KHÔNG gồm sức khoẻ và bí tích: Q-M03-02 (Trưởng/Phó ngành và Giáo lý viên có
-- được GHI hai mục đó không) vẫn để ngỏ, thuộc đợt M03-C. Hai policy
-- `student_health_*` và `student_sacraments_*` giữ nguyên `app.can_global_write()`.
create or replace function app.can_write_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or app.current_role() in ('sector_leader', 'sector_deputy'),
    false
  )
$$;

comment on function app.can_write_student() is
  'Bốn vai trò ghi toàn xứ đoàn cộng Trưởng/Phó ngành (D-63/D-123).';

grant execute on function
  app.fold_vietnamese(text),
  app.sector_managed_student_ids(),
  app.sector_guardian_ids(),
  app.can_write_student()
to authenticated, service_role;

-- ── 3. D-123 — sửa hồ sơ em trong ngành mình ────────────────────────────────
--
-- Chỉ nới UPDATE. INSERT thẳng vẫn là đặc quyền của bốn vai trò toàn xứ đoàn;
-- vai trò ngành tạo hồ sơ qua `public.create_student_with_enrollment` (mục 5).
drop policy if exists students_update_global_write on public.students;
create policy students_update_scope on public.students
  for update to authenticated
  using (
    (select app.can_global_write())
    or id = any ((select app.sector_managed_student_ids())::uuid[])
  )
  with check (
    (
      (select app.can_global_write())
      or id = any ((select app.sector_managed_student_ids())::uuid[])
    )
    and updated_by = auth.uid()
  );

-- ── 4. D-124 — đọc người giám hộ trong phạm vi ngành ────────────────────────
drop policy if exists guardians_select_scope on public.guardians;
create policy guardians_select_scope on public.guardians
  for select to authenticated
  using (
    (select app.can_global_read())
    or profile_id = auth.uid()
    or id = any ((select app.sector_guardian_ids())::uuid[])
  );

-- Cửa sổ hẹp CHỈ-TÊN để chọn người giám hộ đã có — cùng khuôn với D-97
-- (`list_equipment_borrower_options` của M09-B).
--
-- Vì sao không nới thẳng `guardians_select_scope` cho vai trò ngành đọc cả
-- bảng: hồ sơ giám hộ có địa chỉ nhà và liên kết tài khoản. Việc cần làm chỉ là
-- "đừng tạo trùng anh Nguyễn Văn A 0901…" ⇒ chỉ cần TÊN và SỐ ĐIỆN THOẠI.
-- Hàm này cũng chính là nguồn của phép dò trùng người giám hộ (BR-M03-N09):
-- một cảnh báo trùng chỉ nhìn thấy nửa dữ liệu là một cảnh báo nói dối.
create or replace function public.list_guardian_options(p_search text default null)
returns table (id uuid, full_name text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_name text := app.fold_vietnamese(coalesce(p_search, ''));
  v_digits text := regexp_replace(coalesce(p_search, ''), '\D', '', 'g');
begin
  if not app.can_write_student() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select guardian.id, guardian.full_name, guardian.phone
    from public.guardians as guardian
    where guardian.status = 'active'
      and (
        v_name = ''
        or app.fold_vietnamese(guardian.full_name) like '%' || v_name || '%'
        or (v_digits <> '' and guardian.phone like '%' || v_digits || '%')
      )
    order by guardian.full_name, guardian.phone;
end;
$$;

comment on function public.list_guardian_options(text) is
  'Cửa sổ hẹp chỉ tên + số điện thoại người giám hộ, cho người được ghi hồ sơ thiếu nhi (D-124).';

-- Tạo người giám hộ qua hàm thay vì INSERT thẳng — cùng lý do với hồ sơ thiếu
-- nhi: vai trò ngành ghi được nhưng ĐỌC LẠI KHÔNG ĐƯỢC (người giám hộ mới chưa
-- gắn với em nào nên chưa nằm trong `app.sector_guardian_ids()`), nên
-- `insert … returning` trả 0 dòng và người dùng nhận "thất bại" trên một bản
-- ghi đã được ghi. Trả về đúng id + tên để biểu mẫu nói được câu thành công.
create or replace function public.create_guardian_profile(
  p_full_name text,
  p_phone text,
  p_address text default null
)
returns table (id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not app.can_write_student() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  insert into public.guardians (full_name, phone, address, status, updated_by)
  values (btrim(p_full_name), btrim(p_phone), p_address, 'active', v_actor)
  returning guardians.id into v_id;

  return query
    select guardian.id, guardian.full_name
    from public.guardians as guardian
    where guardian.id = v_id;
end;
$$;

comment on function public.create_guardian_profile(text, text, text) is
  'Tạo hồ sơ người giám hộ và trả lại id + tên; dùng chung cho vai trò xứ đoàn và vai trò ngành (D-123/D-124).';

-- ── 5. D-123 — tạo hồ sơ (kèm ghi danh) trong MỘT giao dịch ─────────────────
--
-- BỐN điều cần nhớ:
--
--   1. `p_class_id` để trống chỉ dành cho bốn vai trò ghi toàn xứ đoàn. Vai trò
--      ngành bỏ trống thì bị từ chối bằng `SECTOR_ROLE_NEEDS_CLASS` — một mã
--      riêng, không phải `FORBIDDEN`, vì hai câu phải nói khác nhau: một câu là
--      "bạn không có quyền", câu kia là "còn thiếu ô lớp".
--   2. Quyền dùng `app.can_manage_class` — hàm đã có từ P2-T3 và trả đúng hai
--      nhánh cần: ghi toàn xứ đoàn ⇒ mọi lớp; vai trò ngành ⇒ chỉ lớp thuộc
--      ngành mình. Không viết lại luật ngành lần thứ hai ở đây.
--   3. Hàng rào năm học (D-117/D-118) phải kiểm TAY. Hàm `security definer` bỏ
--      qua RLS, nên `enrollments_insert_scope` — nơi đang giữ hàng rào ấy —
--      không chạy. Bỏ bước này là mở lại đúng lỗ hổng M02-C vừa bịt.
--   4. Hai `insert` trong một thân hàm là một giao dịch: lỗi ở bước ghi danh
--      thì hồ sơ cũng không được tạo. Đó là điều làm cho D-123 an toàn — không
--      có đường nào sinh ra "hồ sơ lơ lửng" mà chính người tạo không đọc được.
create or replace function public.create_student_with_enrollment(
  p_guardian_id uuid,
  p_saint_name text,
  p_full_name text,
  p_gender public.gender,
  p_date_of_birth date,
  p_patron_feast_date date default null,
  p_address text default null,
  p_phone text default null,
  p_hardship_flag boolean default false,
  p_general_notes text default null,
  p_class_id uuid default null
)
returns table (student_id uuid, student_code text, class_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_class_name text := null;
  v_year_id uuid;
  v_class_status public.class_status;
  v_student_id uuid;
begin
  if v_actor is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_class_id is null then
    if not app.can_global_write() then
      raise exception 'SECTOR_ROLE_NEEDS_CLASS' using errcode = '42501';
    end if;
  else
    if not app.can_manage_class(p_class_id) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;

    select class.display_name, class.academic_year_id, class.status
      into v_class_name, v_year_id, v_class_status
      from public.classes as class
     where class.id = p_class_id;

    if v_class_name is null then
      raise exception 'CLASS_NOT_FOUND' using errcode = 'P0002';
    end if;
    if v_class_status <> 'active' then
      raise exception 'CLASS_INACTIVE' using errcode = '23514';
    end if;
    if not (v_year_id = any (app.writable_academic_year_ids())) then
      raise exception 'YEAR_NOT_WRITABLE' using errcode = '23514';
    end if;
  end if;

  insert into public.students (
    guardian_id, saint_name, full_name, gender, date_of_birth, patron_feast_date,
    address, phone, hardship_flag, general_notes, status, updated_by
  )
  values (
    p_guardian_id, btrim(p_saint_name), btrim(p_full_name), p_gender, p_date_of_birth,
    p_patron_feast_date, p_address, p_phone, coalesce(p_hardship_flag, false),
    p_general_notes, 'active', v_actor
  )
  returning students.id into v_student_id;

  if p_class_id is not null then
    insert into public.enrollments (
      student_id, class_id, academic_year_id, enrolled_on, status, updated_by
    )
    values (v_student_id, p_class_id, v_year_id, current_date, 'active', v_actor);
  end if;

  return query
    select student.id, student.student_code::text, v_class_name
    from public.students as student
    where student.id = v_student_id;
end;
$$;

comment on function public.create_student_with_enrollment(uuid, text, text, public.gender, date, date, text, text, boolean, text, uuid) is
  'Tạo hồ sơ thiếu nhi, kèm ghi danh vào lớp nếu có, trong một giao dịch (D-123 / TB-F02-F09).';

revoke all on function public.list_guardian_options(text) from public, anon;
revoke all on function public.create_guardian_profile(text, text, text) from public, anon;
revoke all on function public.create_student_with_enrollment(uuid, text, text, public.gender, date, date, text, text, boolean, text, uuid) from public, anon;

grant execute on function public.list_guardian_options(text) to authenticated, service_role;
grant execute on function public.create_guardian_profile(text, text, text) to authenticated, service_role;
grant execute on function public.create_student_with_enrollment(uuid, text, text, public.gender, date, date, text, text, boolean, text, uuid)
  to authenticated, service_role;

-- ── 6. TB-F03 — một khung nhìn phẳng cho danh sách thiếu nhi ────────────────
--
-- Vì sao là VIEW chứ không phải nhiều truy vấn ghép trong Node: `/students` cần
-- lọc theo ngành/lớp, tìm theo tên em VÀ số điện thoại phụ huynh, rồi phân
-- trang — cả ba phải xảy ra ở CÙNG một chỗ, nếu không thì "trang 2" không có
-- nghĩa gì. Ghép ở Node nghĩa là kéo cả 900 em về rồi mới cắt trang, tức đúng
-- thứ TB-F03 sinh ra để bỏ.
--
-- `security_invoker = true` (AGENTS §6): RLS của các bảng nền vẫn chạy theo
-- người đang đăng nhập. Đây là điều làm AC-F13-03 đúng — phép dò trùng đọc qua
-- khung nhìn này nên không thể lộ hồ sơ ngoài phạm vi.
--
-- `left join lateral` chứ không phải `join`: em CHƯA xếp lớp vẫn phải hiện
-- trong danh sách (đó chính là nhóm cần chú ý nhất), chỉ là cột lớp để trống.
create view public.student_directory
with (security_invoker = true) as
select
  student.id,
  student.student_code::text as student_code,
  student.saint_name,
  student.full_name,
  student.search_name,
  student.gender,
  student.date_of_birth,
  student.status,
  student.hardship_flag,
  student.guardian_id,
  guardian.full_name as guardian_name,
  guardian.phone as guardian_phone,
  current_enrollment.class_id,
  class.display_name as class_name,
  grade.sector_id,
  sector.code as sector_code,
  sector.name as sector_name,
  current_enrollment.academic_year_id,
  current_enrollment.enrollment_status
from public.students as student
left join public.guardians as guardian on guardian.id = student.guardian_id
left join lateral (
  select enrollment.class_id, enrollment.academic_year_id, enrollment.status as enrollment_status
  from public.enrollments as enrollment
  join public.academic_years as year on year.id = enrollment.academic_year_id
  where enrollment.student_id = student.id
    and enrollment.status in ('active', 'paused')
    and year.status = 'current'
  limit 1
) as current_enrollment on true
left join public.classes as class on class.id = current_enrollment.class_id
left join public.grade_levels as grade on grade.id = class.grade_level_id
left join public.sectors as sector on sector.id = grade.sector_id;

comment on view public.student_directory is
  'Danh sách thiếu nhi đã phẳng hoá kèm người giám hộ và lớp của năm hiện hành; RLS theo người gọi (TB-F03).';

grant select on public.student_directory to authenticated;
grant all on public.student_directory to service_role;
