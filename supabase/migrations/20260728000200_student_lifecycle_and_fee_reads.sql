-- ============================================================================
-- M03-C — đợt cuối của module 6. Bốn hạng mục, một migration, vì cả bốn xoay
-- quanh đúng một câu hỏi mà cơ sở dữ liệu chưa từng trả lời được:
-- **"hồ sơ của em" và "chỗ của em trong lớp" liên quan với nhau thế nào.**
--
-- Bốn quyết định của chủ dự án ngày 2026-07-28 (sau M03-B):
--   · D-127  Q-M03-02 = **theo đúng bảng phân quyền `docs/05` §3**: Trưởng/Phó
--            ngành và Giáo lý viên (đại diện · lớp) GHI được sức khoẻ và bí
--            tích, chỉ trong phạm vi mình. Dự trưởng phụ tá vẫn 👁 (chỉ đọc).
--   · D-128  Q-M03-05 = **sửa cho mọi người ghi được, XOÁ chỉ cấp xứ đoàn**.
--   · D-129  D-67 = Thủ quỹ **ĐƯỢC** xem dấu "hoàn cảnh khó khăn".
--   · D-130  Trạng thái hồ sơ "Tạm nghỉ" **kéo theo** ghi danh sang "Tạm nghỉ";
--            "Đã rút"/"Lưu trữ" đóng ghi danh; "Đang sinh hoạt" khôi phục lại.
--
-- 🔴 Vì sao TB-F06 KHÔNG phải là "thêm một trigger đồng bộ hai cột":
-- `students.status` (danh tính) và `enrollments.status` (chỗ trong lớp) là hai
-- trục ĐỘC LẬP có thật — một em rút khỏi xứ đoàn khác một em kết thúc năm học.
-- Cái thiếu không phải một ràng buộc mà là **một thao tác nghiệp vụ** đổi cả
-- hai cùng lúc, cộng một lưới an toàn chặn tổ hợp vô nghĩa
-- ("đã lưu trữ" mà vẫn "đang học"). `public.set_student_status` là thao tác đó;
-- trigger dưới đây là lưới an toàn (`04_TO_BE_FLOWS` TB-F06: "B + A").
-- ============================================================================

-- ── 1. D-127 — ai GHI được sức khoẻ và bí tích ──────────────────────────────
--
-- Cổng thứ HAI, vẫn tách khỏi `app.can_write_student()` chứ không gộp lại.
-- Hai danh sách vai trò khác nhau thật, và khác ở hai đầu ngược nhau:
--
--   · Ghi HỒ SƠ (D-63): bốn vai trò xứ đoàn + Trưởng/Phó ngành. Giáo lý viên
--     KHÔNG — họ không sửa được ngày sinh, địa chỉ của em.
--   · Ghi SỨC KHOẺ / BÍ TÍCH (D-127): bốn vai trò xứ đoàn + Trưởng/Phó ngành
--     + Giáo lý viên đại diện và Giáo lý viên lớp. Vì người biết "em này dị ứng
--     đậu phộng" là người đứng lớp hằng tuần, không phải Thư ký ngồi bàn giấy.
--
-- **Dự trưởng phụ tá KHÔNG có trong danh sách này** — `docs/05` §3 cho họ 👁📍
-- (chỉ đọc) ở cả hai dòng "Sức khỏe" và "Bí tích". Họ vẫn đọc được như cũ.
create or replace function app.can_write_student_sensitive()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    app.can_global_write()
    or app.current_role() in (
      'sector_leader', 'sector_deputy', 'class_representative', 'class_teacher'
    ),
    false
  )
$$;

comment on function app.can_write_student_sensitive() is
  'Ai ghi được hồ sơ sức khoẻ và bí tích sau D-127; phạm vi từng em do policy kiểm riêng.';

grant execute on function app.can_write_student_sensitive() to authenticated, service_role;

-- 🔴 Vai trò quyết định "có được bấm không"; `app.class_scoped_student_ids()`
-- quyết định "bấm lên em nào". Thiếu vế thứ hai là mở quyền ghi hồ sơ y tế của
-- **cả 900 em** cho một Giáo lý viên dạy 29 em — đúng thứ ký hiệu 📍 của
-- `docs/05` cấm.
--
-- Dùng lại đúng hàm mà policy SELECT đang dùng (`20260721000200`), không viết
-- luật phạm vi lần thứ hai: quyền ĐỌC và quyền GHI lệch nhau là để một người
-- ghi được vào một hồ sơ họ không đọc lại được — hình dạng lỗi của D-123.
drop policy if exists student_health_insert_global_write on public.student_health_profiles;
drop policy if exists student_health_update_global_write on public.student_health_profiles;

create policy student_health_insert_scope on public.student_health_profiles
  for insert to authenticated
  with check (
    (
      (select app.can_global_write())
      or (
        (select app.can_write_student_sensitive())
        and student_id = any ((select app.class_scoped_student_ids())::uuid[])
      )
    )
    and updated_by = auth.uid()
  );

create policy student_health_update_scope on public.student_health_profiles
  for update to authenticated
  using (
    (select app.can_global_write())
    or (
      (select app.can_write_student_sensitive())
      and student_id = any ((select app.class_scoped_student_ids())::uuid[])
    )
  )
  with check (
    (
      (select app.can_global_write())
      or (
        (select app.can_write_student_sensitive())
        and student_id = any ((select app.class_scoped_student_ids())::uuid[])
      )
    )
    and updated_by = auth.uid()
  );

drop policy if exists student_sacraments_insert_global_write on public.student_sacraments;
drop policy if exists student_sacraments_update_global_write on public.student_sacraments;

create policy student_sacraments_insert_scope on public.student_sacraments
  for insert to authenticated
  with check (
    (
      (select app.can_global_write())
      or (
        (select app.can_write_student_sensitive())
        and student_id = any ((select app.class_scoped_student_ids())::uuid[])
      )
    )
    and updated_by = auth.uid()
  );

create policy student_sacraments_update_scope on public.student_sacraments
  for update to authenticated
  using (
    (select app.can_global_write())
    or (
      (select app.can_write_student_sensitive())
      and student_id = any ((select app.class_scoped_student_ids())::uuid[])
    )
  )
  with check (
    (
      (select app.can_global_write())
      or (
        (select app.can_write_student_sensitive())
        and student_id = any ((select app.class_scoped_student_ids())::uuid[])
      )
    )
    and updated_by = auth.uid()
  );

comment on policy student_health_update_scope on public.student_health_profiles is
  'D-127: vai trò ngành và Giáo lý viên ghi được sức khoẻ của em trong phạm vi mình.';
comment on policy student_sacraments_update_scope on public.student_sacraments is
  'D-127: vai trò ngành và Giáo lý viên ghi được bí tích của em trong phạm vi mình.';

-- ── 2. D-128 — xoá bản ghi bí tích, chỉ cấp xứ đoàn ─────────────────────────
--
-- Đây là quyền `delete` ĐẦU TIÊN được cấp trên một bảng hồ sơ thiếu nhi, nên
-- phải nói rõ vì sao nó không phá luật "không hard delete" của `AGENTS` §6:
-- danh sách cấm ở đó là ghi danh · điểm danh · điểm số · báo cáo đã chốt —
-- những thứ mang giá trị lịch sử và được tham chiếu từ nơi khác. Bản ghi bí
-- tích thì **không có bảng nào trỏ tới**, và ca cần xoá là ca không sửa nổi:
-- một bí tích lỡ thêm vào hồ sơ NHẦM EM không có cách nào chuyển sang em đúng
-- (Q-M03-05). Chỉ sửa được thì người dùng sẽ đổi nó thành một loại bí tích
-- khác để "dọn" — tức làm hỏng dữ liệu theo một kiểu khó phát hiện hơn.
--
-- Hẹp hơn quyền GHI một bậc có chủ đích: sửa sai còn lần sau sửa lại, xoá thì
-- không. Giáo lý viên ghi được nhưng không xoá được.
grant delete on public.student_sacraments to authenticated;

create policy student_sacraments_delete_global_write on public.student_sacraments
  for delete to authenticated
  using ((select app.can_global_write()));

comment on policy student_sacraments_delete_global_write on public.student_sacraments is
  'D-128: chỉ bốn vai trò ghi toàn xứ đoàn xoá được bản ghi bí tích nhập nhầm.';

-- ── 3. TB-F06 — lưới an toàn: hai trục không được mâu thuẫn ─────────────────
--
-- Ba điều cần nhớ:
--
--   1. `security definer` là BẮT BUỘC. Trigger chạy bằng quyền người gọi, nên
--      không có nó thì một Giáo lý viên đọc `enrollments` ngoài phạm vi sẽ
--      thấy **0 dòng** và trigger kết luận "em không còn ghi danh nào" — một
--      lưới an toàn có lỗ đúng ở chỗ cần nó nhất.
--   2. Chỉ kiểm khi `status` **thật sự đổi** (`is distinct from`). Dữ liệu cũ
--      có thể đã có em `archived` còn ghi danh mở; chặn mọi lượt UPDATE lên
--      những dòng đó là khoá luôn cả đường sửa lỗi
--      (`07_IMPLEMENTATION_IMPACT` §5).
--   3. `paused` nằm trong danh sách "còn mở" — đúng bằng
--      `OPEN_ENROLLMENT_STATUSES` của M03-A và partial unique index
--      `enrollments_one_open_per_year`. Ba nơi phải trùng khít; lệch một giá
--      trị là dựng lại lỗi CRITICAL F10 ở một chỗ khác.
create or replace function app.students_status_needs_closed_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    -- 🔴 `docs/05` §5 — *"Archive student: SA/global-write"*. Luật này phải nằm
    -- ở ĐÂY, không chỉ ở Server Action: `students_update_scope` (D-123) cho vai
    -- trò ngành `update` mọi cột của em trong ngành mình, kể cả `status`. Chỉ
    -- chặn ở tầng ứng dụng nghĩa là gọi thẳng Data API bằng JWT của họ là lưu
    -- trữ được — đúng thứ `AGENTS` §5 gọi tên: *"ẩn nút không phải
    -- authorization"*. D-63 nới quyền **tạo và sửa** hồ sơ, không nới quyền
    -- lưu trữ; `active` ⇄ `temporarily_inactive` vẫn là việc của họ.
    --
    -- `auth.uid() is not null` là điều kiện BẮT BUỘC của nhánh này: mã chạy
    -- phía máy chủ bằng `service_role` (script gieo dữ liệu, luồng nhập Excel,
    -- một lượt vá dữ liệu sau này) **không mang JWT**, nên `app.current_role()`
    -- trả `null` và `can_global_write()` trả `false`. Thiếu vế ấy là khoá luôn
    -- mọi đường quản trị hợp lệ để chặn một đường tấn công — và `service_role`
    -- vốn đã bỏ qua RLS, tức nó không phải thứ hàng rào này canh.
    if new.status in ('withdrawn', 'archived')
       and auth.uid() is not null
       and not app.can_global_write()
    then
      raise exception 'ARCHIVE_IS_GLOBAL_WRITE' using errcode = '42501';
    end if;

    if new.status in ('withdrawn', 'archived')
       and exists (
         select 1
         from public.enrollments as enrollment
         where enrollment.student_id = new.id
           and enrollment.status in ('active', 'paused')
       )
    then
      raise exception 'STUDENT_HAS_OPEN_ENROLLMENT' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

comment on function app.students_status_needs_closed_enrollment() is
  'BR-M03-N12 + docs/05 §5: chỉ cấp xứ đoàn lưu trữ/rút được, và không khi em còn ghi danh mở.';

create trigger students_status_needs_closed_enrollment
before update on public.students
for each row execute function app.students_status_needs_closed_enrollment();

-- BR-M03-N13 / AC-F06-04 — chiều ngược lại: không ghi danh một em đã rút hoặc
-- đã lưu trữ. Đặt ở cơ sở dữ liệu chứ không chỉ ở Server Action, vì `AGENTS` §6
-- ("constraint quan trọng nằm ở DB") và vì có **ba** đường ghi vào bảng này:
-- biểu mẫu trang lớp, `create_student_with_enrollment` (D-123) và luồng nhập
-- Excel. Kiểm ở một đường là bỏ sót hai đường.
--
-- Em `temporarily_inactive` cũng bị chặn: theo D-130 em ấy đang giữ một ghi
-- danh `paused`, nên "ghi danh mới" cho em là một câu hỏi sai — việc cần làm là
-- **khôi phục**.
create or replace function app.enrollments_need_active_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.student_status;
begin
  select student.status into v_status
    from public.students as student
   where student.id = new.student_id;

  if v_status is null then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status <> 'active' then
    raise exception 'STUDENT_NOT_ACTIVE' using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function app.enrollments_need_active_student() is
  'BR-M03-N13 / AC-F06-04: chỉ ghi danh được em có hồ sơ đang sinh hoạt.';

create trigger enrollments_need_active_student
before insert on public.enrollments
for each row execute function app.enrollments_need_active_student();

-- BR-M03-N17 (TB-F12) — không ngừng dùng một hồ sơ người giám hộ còn con đang
-- sinh hoạt. Đây không phải chuyện gọn gàng mà là chuyện **liên lạc khẩn cấp**:
-- `guardians.status = 'inactive'` là tín hiệu "đừng gọi số này nữa", và một em
-- đang đi học mỗi tuần phải luôn có ít nhất một số gọi được.
--
-- Ở cơ sở dữ liệu chứ không chỉ ở Server Action, vì `students.guardian_id` là
-- `on delete restrict` — tức bảng này đã tự bảo vệ khỏi XOÁ nhưng chưa có gì
-- bảo vệ khỏi VÔ HIỆU HOÁ, mà hệ quả nghiệp vụ của hai việc là như nhau.
create or replace function app.guardians_inactive_needs_no_active_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.status <> 'active'
     and exists (
       select 1
       from public.students as student
       where student.guardian_id = new.id
         and student.status = 'active'
     )
  then
    raise exception 'GUARDIAN_HAS_ACTIVE_STUDENTS' using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function app.guardians_inactive_needs_no_active_student() is
  'BR-M03-N17: không vô hiệu hoá người giám hộ khi còn thiếu nhi đang sinh hoạt gắn với họ.';

create trigger guardians_inactive_needs_no_active_student
before update on public.guardians
for each row execute function app.guardians_inactive_needs_no_active_student();

-- ── 4. TB-F06 / D-130 — một thao tác đổi cả hai trục ────────────────────────
--
-- 🔴 **KHÔNG `security definer`** — và đây là điều quan trọng nhất của cả
-- migration này. `create_student_with_enrollment` của M03-B phải là definer vì
-- nó ghi một hồ sơ mà chính người tạo chưa đọc được. Ở đây ngược lại: em đã tồn
-- tại, đã có lớp, và **mọi hàng rào cần thiết đã nằm trong RLS**:
--
--   · `students_update_scope`     — phạm vi ngành của D-123
--   · `enrollments_update_scope`  — `app.can_manage_class()` + hàng rào năm học
--                                   đã đóng của D-117/D-118 (M02-C)
--
-- Viết definer ở đây là **tự tay bỏ qua cả hai**, và phải chép lại chúng bằng
-- tay bên trong thân hàm — đúng bài học đã ghi ở ghi chú 3 của M03-B, chỉ khác
-- là lần này có đường tránh. Hai câu lệnh trong một thân hàm vẫn là **một giao
-- dịch**, nên tính nguyên tử mà AC-F06-02 đòi không mất gì.
--
-- Hệ quả phân quyền phải nói rõ: `docs/05` §5 ghi *"Archive student —
-- SA/global-write"*, nên hai trạng thái `withdrawn`/`archived` kiểm thêm
-- `app.can_global_write()`. D-63 nới quyền **tạo và sửa** hồ sơ cho vai trò
-- ngành, không nới quyền **lưu trữ**. Vai trò ngành vẫn đổi được
-- `active` ⇄ `temporarily_inactive` — đó là việc mục vụ hằng ngày của họ.
create or replace function public.set_student_status(
  p_student_id uuid,
  p_status public.student_status,
  p_close_enrollment boolean default false,
  p_reason public.enrollment_status default 'withdrawn',
  p_ended_on date default null
)
returns table (student_name text, class_name text, enrollment_action text)
language plpgsql
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_saint_name text;
  v_full_name text;
  v_open_id uuid;
  v_open_status public.enrollment_status;
  v_class_name text;
  v_action text := 'none';
  v_touched uuid;
begin
  if v_actor is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status in ('withdrawn', 'archived') and not app.can_global_write() then
    raise exception 'ARCHIVE_IS_GLOBAL_WRITE' using errcode = '42501';
  end if;
  if not app.can_write_student() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_reason not in ('withdrawn', 'completed', 'transferred', 'repeating') then
    raise exception 'INVALID_CLOSE_REASON' using errcode = '22023';
  end if;

  -- Đọc dưới RLS: em ngoài phạm vi người gọi trả 0 dòng, y hệt em không tồn
  -- tại. Đó là câu trả lời đúng — nói "bạn không có quyền với em X" là xác nhận
  -- rằng em X có thật.
  select student.saint_name, student.full_name
    into v_saint_name, v_full_name
    from public.students as student
   where student.id = p_student_id;
  if v_full_name is null then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  select enrollment.id, enrollment.status, class.display_name
    into v_open_id, v_open_status, v_class_name
    from public.enrollments as enrollment
    join public.classes as class on class.id = enrollment.class_id
   where enrollment.student_id = p_student_id
     and enrollment.status in ('active', 'paused')
   limit 1;

  if p_status in ('withdrawn', 'archived') and v_open_id is not null then
    -- BR-M03-N12 — không đóng lén. Người dùng phải nhìn thấy tên lớp rồi mới
    -- tick ô "đồng thời kết thúc ghi danh" (AC-F06-01).
    if not coalesce(p_close_enrollment, false) then
      raise exception 'STUDENT_HAS_OPEN_ENROLLMENT' using errcode = '23514';
    end if;
    update public.enrollments
       set status = p_reason,
           ended_on = coalesce(p_ended_on, current_date),
           updated_by = v_actor
     where id = v_open_id
    returning id into v_touched;
    if v_touched is null then
      raise exception 'ENROLLMENT_NOT_WRITABLE' using errcode = '42501';
    end if;
    v_action := 'closed';

  elsif p_status = 'temporarily_inactive' and v_open_status = 'active' then
    -- D-130. `ended_on = null` là điều kiện sống còn: `paused` là trạng thái MỞ
    -- nên CHECK `enrollments_open_has_no_end` bắt nó không được có ngày kết
    -- thúc — đúng cái bẫy đã làm nút "Tạm nghỉ" chưa từng chạy được (F10).
    update public.enrollments
       set status = 'paused', ended_on = null, updated_by = v_actor
     where id = v_open_id
    returning id into v_touched;
    if v_touched is null then
      raise exception 'ENROLLMENT_NOT_WRITABLE' using errcode = '42501';
    end if;
    v_action := 'paused';

  elsif p_status = 'active' and v_open_status = 'paused' then
    -- Chiều về của D-130. Không có nhánh này thì một em đưa sang "Tạm nghỉ" rồi
    -- đưa lại "Đang sinh hoạt" sẽ **kẹt ở ghi danh tạm nghỉ** — hồ sơ nói em đi
    -- học, sĩ số nói em nghỉ.
    update public.enrollments
       set status = 'active', ended_on = null, updated_by = v_actor
     where id = v_open_id
    returning id into v_touched;
    if v_touched is null then
      raise exception 'ENROLLMENT_NOT_WRITABLE' using errcode = '42501';
    end if;
    v_action := 'resumed';
  end if;

  update public.students
     set status = p_status, updated_by = v_actor
   where id = p_student_id
  returning id into v_touched;
  if v_touched is null then
    raise exception 'STUDENT_NOT_WRITABLE' using errcode = '42501';
  end if;

  return query
    select
      btrim(coalesce(v_saint_name, '') || ' ' || v_full_name),
      v_class_name,
      v_action;
end;
$$;

comment on function public.set_student_status(uuid, public.student_status, boolean, public.enrollment_status, date) is
  'TB-F06/D-130: đổi trạng thái hồ sơ và ghi danh đang mở trong MỘT giao dịch, dưới RLS của người gọi.';

revoke all on function public.set_student_status(uuid, public.student_status, boolean, public.enrollment_status, date) from public, anon;
grant execute on function public.set_student_status(uuid, public.student_status, boolean, public.enrollment_status, date)
  to authenticated, service_role;

-- ── 5. D-67 / D-129 — mức đọc riêng cho Thủ quỹ ─────────────────────────────
--
-- 🔴 **Cố ý KHÔNG thêm một nhánh `treasurer` vào `students_select_scope`.**
-- Đó là cách ngắn nhất và là cách sai: RLS lọc theo DÒNG, không theo CỘT. Mở
-- dòng ra là Thủ quỹ đọc được **mọi cột** — ngày sinh, địa chỉ nhà, ghi chú
-- nội bộ — qua Data API bằng chính JWT của họ, bất kể giao diện hiện gì. D-67
-- liệt kê đích danh những cột đó vào nhóm "KHÔNG được xem".
--
-- Nên đây là một **cửa sổ hẹp**, cùng khuôn với `list_guardian_options` (D-124)
-- và `list_equipment_borrower_options` (D-97): một hàm `security definer` trả
-- đúng những cột đã duyệt, không hơn một cột nào.
--
-- Hệ quả cố ý: bài pgTAP `036` **S-06** ("Thủ quỹ đọc `students` trả 0 dòng")
-- vẫn xanh sau đợt này. Ranh giới cũ không nhúc nhích; chỉ có một ô cửa mới,
-- và ô cửa ấy có kích thước đo được.
--
-- `hardship_flag` nằm trong danh sách trả về theo **D-129** (chủ dự án chốt
-- 2026-07-28): xét miễn/giảm phí là việc của Thủ quỹ, và bắt họ hỏi người khác
-- mỗi lần là đẩy họ đi lập một danh sách riêng ngoài hệ thống.
--
-- `count(*) over ()` thay vì hai lượt gọi: phân trang cần tổng số, và hai truy
-- vấn với hai bộ lọc chép tay là cách chắc chắn nhất để "trang 2" trỏ vào một
-- tập khác với con số tổng (bài học đã ghi ở `applyStudentFilters`).
create or replace function public.list_students_for_fees(
  p_search text default null,
  p_sector_id uuid default null,
  p_class_id uuid default null,
  p_unassigned boolean default false,
  p_status public.student_status default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  student_code text,
  saint_name text,
  full_name text,
  class_name text,
  sector_code text,
  sector_name text,
  guardian_name text,
  guardian_phone text,
  hardship_flag boolean,
  status public.student_status,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_name text := app.fold_vietnamese(coalesce(p_search, ''));
  v_digits text := regexp_replace(coalesce(p_search, ''), '\D', '', 'g');
begin
  -- Chỉ Thủ quỹ. Mọi vai trò khác đã có đường đọc riêng của mình
  -- (`public.student_directory`, RLS theo người gọi) và đường đó rộng hơn cửa
  -- sổ này — mở thêm ở đây chỉ tạo ra một đường thứ hai để lệch nhau.
  if app.current_role() is distinct from 'treasurer' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
    select
      student.id,
      student.student_code::text,
      student.saint_name,
      student.full_name,
      class.display_name,
      sector.code,
      sector.name,
      guardian.full_name,
      guardian.phone,
      student.hardship_flag,
      student.status,
      count(*) over () as total_count
    from public.students as student
    left join public.guardians as guardian on guardian.id = student.guardian_id
    left join lateral (
      select enrollment.class_id
      from public.enrollments as enrollment
      join public.academic_years as year on year.id = enrollment.academic_year_id
      where enrollment.student_id = student.id
        and enrollment.status in ('active', 'paused')
        and year.status = 'current'
      limit 1
    ) as current_enrollment on true
    left join public.classes as class on class.id = current_enrollment.class_id
    left join public.grade_levels as grade on grade.id = class.grade_level_id
    left join public.sectors as sector on sector.id = grade.sector_id
    where (p_status is null or student.status = p_status)
      and (p_sector_id is null or grade.sector_id = p_sector_id)
      and (
        case
          when coalesce(p_unassigned, false) then current_enrollment.class_id is null
          when p_class_id is not null then current_enrollment.class_id = p_class_id
          else true
        end
      )
      and (
        v_name = ''
        or student.search_name like '%' || v_name || '%'
        or student.student_code::text ilike '%' || coalesce(p_search, '') || '%'
        or (v_digits <> '' and guardian.phone like '%' || v_digits || '%')
      )
    order by student.full_name, student.id
    limit greatest(coalesce(p_limit, 20), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.list_students_for_fees(text, uuid, uuid, boolean, public.student_status, integer, integer) is
  'D-67/D-129: cửa sổ hẹp cho Thủ quỹ — chỉ các cột đã duyệt, không có ngày sinh/địa chỉ/ghi chú.';

revoke all on function public.list_students_for_fees(text, uuid, uuid, boolean, public.student_status, integer, integer) from public, anon;
grant execute on function public.list_students_for_fees(text, uuid, uuid, boolean, public.student_status, integer, integer)
  to authenticated, service_role;

-- Re-harden app schema execute privileges for the functions added here.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
