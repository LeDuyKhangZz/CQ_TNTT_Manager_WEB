-- ============================================================================
-- Gate Phase 2 — perf smoke 900 thiếu nhi phát hiện: policy SELECT của
-- students/enrollments/health/bí tích gọi app.can_access_student(id) &
-- app.can_access_class(class_id) THEO TỪNG DÒNG. Mỗi lần gọi lại chạy 5–8 truy
-- vấn con lồng nhau, và vì các helper là SECURITY DEFINER nên Postgres không
-- inline được. Đo thật: GLV lớp Ấu 1A đọc bảng students (900 dòng, thấy 29) mất
-- 2.4 s, 43.504 buffer hit.
--
-- Cách sửa: giữ nguyên NGỮ NGHĨA, đổi cách tính. Phạm vi của người đang đăng
-- nhập được gom thành mảng qua helper không tham số, rồi policy so sánh cột với
-- mảng đó. Đặt trong `(select ...)` để Postgres chạy một lần cho cả câu lệnh
-- (InitPlan) thay vì một lần cho mỗi dòng.
--
-- KHÔNG mở rộng quyền: mỗi helper dưới đây tương ứng 1-1 với một nhánh của
-- helper cũ, và các helper cũ vẫn giữ nguyên cho code/test đang dùng.
-- ============================================================================

-- Lớp mà người dùng "thấy" theo phạm vi tổ chức — đúng bằng hai nhánh không
-- global của app.can_access_class(): lớp gắn với role đang giữ, và mọi lớp
-- thuộc ngành mình phụ trách.
create or replace function app.scope_class_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct class_id), '{}'::uuid[])
  from (
    select assignment.class_id
    from public.role_assignments as assignment
    where assignment.profile_id = auth.uid()
      and assignment.is_active
      and assignment.class_id is not null

    union

    select class.id
    from public.classes as class
    join public.grade_levels as grade on grade.id = class.grade_level_id
    where grade.sector_id = app.current_sector_id()
  ) as scoped(class_id)
$$;

-- Lớp mà người dùng đứng lớp — đúng bằng app.is_class_staff(): role lớp đang
-- giữ, cộng với mọi phân công GLV còn hiệu lực.
create or replace function app.staff_class_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct class_id), '{}'::uuid[])
  from (
    select assignment.class_id
    from public.role_assignments as assignment
    where assignment.profile_id = auth.uid()
      and assignment.is_active
      and assignment.class_id is not null
      and assignment.role in ('class_representative', 'class_teacher', 'trainee_assistant')

    union

    select assignment.class_id
    from public.staff_profiles as staff
    join public.class_staff_assignments as assignment
      on assignment.staff_profile_id = staff.id and assignment.is_active
    where staff.profile_id = auth.uid()
  ) as staffed(class_id)
$$;

-- Thiếu nhi tiếp cận được qua lớp — đúng bằng nhánh enrollment của
-- app.can_access_student()/app.can_view_student_sensitive(): ghi danh còn mở
-- (active/paused) vào một lớp trong phạm vi hoặc lớp mình đứng.
create or replace function app.class_scoped_student_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct enrollment.student_id), '{}'::uuid[])
  from public.enrollments as enrollment
  where enrollment.status in ('active', 'paused')
    and (
      enrollment.class_id = any (app.scope_class_ids())
      or enrollment.class_id = any (app.staff_class_ids())
    )
$$;

-- Thiếu nhi "của mình" — đúng bằng app.is_guardian_of_student() cộng
-- app.is_self_student(): con của phụ huynh đang đăng nhập, hoặc chính em đó.
create or replace function app.own_student_ids()
returns uuid[]
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(array_agg(distinct student.id), '{}'::uuid[])
  from public.students as student
  left join public.guardians as guardian on guardian.id = student.guardian_id
  where student.profile_id = auth.uid()
     or guardian.profile_id = auth.uid()
$$;

grant execute on function
  app.scope_class_ids(),
  app.staff_class_ids(),
  app.class_scoped_student_ids(),
  app.own_student_ids()
to authenticated;

-- ── Policy viết lại theo tập hợp ────────────────────────────────────────────
-- Từng nhánh giữ nguyên thứ tự và ý nghĩa của helper cũ; chỉ khác ở chỗ vế
-- phải được tính một lần cho cả câu lệnh.

drop policy if exists students_select_scope on public.students;
create policy students_select_scope on public.students
  for select to authenticated
  using (
    (select app.can_global_read())
    or id = any ((select app.own_student_ids())::uuid[])
    or id = any ((select app.class_scoped_student_ids())::uuid[])
  );

drop policy if exists student_health_select_staff on public.student_health_profiles;
create policy student_health_select_staff on public.student_health_profiles
  for select to authenticated
  using (
    (select app.can_global_read())
    or student_id = any ((select app.class_scoped_student_ids())::uuid[])
  );

drop policy if exists student_sacraments_select_staff on public.student_sacraments;
create policy student_sacraments_select_staff on public.student_sacraments
  for select to authenticated
  using (
    (select app.can_global_read())
    or student_id = any ((select app.class_scoped_student_ids())::uuid[])
  );

drop policy if exists enrollments_select_scope on public.enrollments;
create policy enrollments_select_scope on public.enrollments
  for select to authenticated
  using (
    (select app.can_global_read())
    or class_id = any ((select app.scope_class_ids())::uuid[])
    or class_id = any ((select app.staff_class_ids())::uuid[])
    or student_id = any ((select app.own_student_ids())::uuid[])
  );

drop policy if exists class_staff_assignments_select_scope on public.class_staff_assignments;
create policy class_staff_assignments_select_scope on public.class_staff_assignments
  for select to authenticated
  using (
    (select app.can_global_read())
    or class_id = any ((select app.scope_class_ids())::uuid[])
  );

comment on function app.scope_class_ids() is
  'Lớp trong phạm vi tổ chức của người đăng nhập (không gồm global). Dùng cho RLS theo tập hợp.';
comment on function app.staff_class_ids() is
  'Lớp mà người đăng nhập đứng lớp. Dùng cho RLS theo tập hợp.';
comment on function app.class_scoped_student_ids() is
  'Thiếu nhi tiếp cận được qua ghi danh đang mở vào lớp trong phạm vi.';
comment on function app.own_student_ids() is
  'Thiếu nhi do chính người đăng nhập sở hữu: con của phụ huynh, hoặc chính em.';
