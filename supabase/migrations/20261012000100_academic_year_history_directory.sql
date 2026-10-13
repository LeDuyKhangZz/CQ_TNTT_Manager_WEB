-- R2.13: historical membership, with existing row and column permissions.
-- Does not change current-year queries, RLS policies or any write permission.
create view public.student_year_directory
with (security_invoker = true) as
select
  student.id,
  student.student_code::text as student_code,
  student.saint_name,
  student.full_name,
  student.search_name,
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
join (
  select distinct on (enrollment.student_id, enrollment.academic_year_id)
    enrollment.student_id, enrollment.class_id, enrollment.academic_year_id,
    enrollment.status as enrollment_status
  from public.enrollments as enrollment
  join public.academic_years as year on year.id = enrollment.academic_year_id
  where year.status in ('closed', 'archived')
  order by enrollment.student_id, enrollment.academic_year_id,
    enrollment.enrolled_on desc, enrollment.created_at desc, enrollment.id
) as current_enrollment on current_enrollment.student_id = student.id
left join public.classes as class on class.id = current_enrollment.class_id
left join public.grade_levels as grade on grade.id = class.grade_level_id
left join public.sectors as sector on sector.id = grade.sector_id;


comment on view public.student_year_directory is 'R2.13: one last enrollment per student/year; current profile fields, historical class, caller RLS.';
grant select on public.student_year_directory to authenticated;
grant all on public.student_year_directory to service_role;

create or replace function public.list_students_for_fees_by_year(
  p_year_id uuid,
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

  if not exists (select 1 from public.academic_years as selected_year where selected_year.id = p_year_id and selected_year.status in ('closed', 'archived')) then
    raise exception 'INVALID_YEAR' using errcode = '22023';
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
    join lateral (
      select enrollment.class_id
      from public.enrollments as enrollment
      join public.academic_years as year on year.id = enrollment.academic_year_id
      where enrollment.student_id = student.id
        and year.id = p_year_id
        and year.status in ('closed', 'archived')
      order by enrollment.enrolled_on desc, enrollment.created_at desc, enrollment.id
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

comment on function public.list_students_for_fees_by_year(uuid, text, uuid, uuid, boolean, public.student_status, integer, integer) is
  'D-67/D-129: cửa sổ hẹp cho Thủ quỹ — chỉ các cột đã duyệt, không có ngày sinh/địa chỉ/ghi chú.';

revoke all on function public.list_students_for_fees_by_year(uuid, text, uuid, uuid, boolean, public.student_status, integer, integer) from public, anon;
grant execute on function public.list_students_for_fees_by_year(uuid, text, uuid, uuid, boolean, public.student_status, integer, integer)
  to authenticated, service_role;

