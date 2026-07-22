-- Phase 4 / P4-T2: lịch 7 ngày với projection an toàn cho mọi audience.
-- Phụ huynh/thiếu nhi không được SELECT bảng giáo án gốc; RPC này là đường
-- duy nhất và chỉ trả tên bài, chuẩn bị, người dạy hoặc nhãn kiểm tra.

create function public.get_week_ahead_teaching_items(
  p_from date,
  p_days integer default 7
)
returns table (
  item_id uuid,
  class_id uuid,
  class_name text,
  planned_date date,
  title text,
  preparation text,
  item_type public.teaching_plan_item_type,
  teacher_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or app.current_role() is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_from is null or p_days < 1 or p_days > 31 then
    raise exception 'INVALID_WEEK_RANGE' using errcode = '22023';
  end if;

  return query
  select
    item.id,
    plan.class_id,
    class.display_name,
    item.planned_date,
    item.title,
    item.preparation,
    item.item_type,
    case
      when teacher.id is null then null
      when teacher.saint_name is null then teacher.full_name
      else teacher.saint_name || ' ' || teacher.full_name
    end
  from public.teaching_plan_items as item
  join public.teaching_plans as plan on plan.id = item.teaching_plan_id
  join public.classes as class on class.id = plan.class_id
  left join public.staff_profiles as teacher on teacher.id = item.teacher_staff_id
  where item.planned_date >= p_from
    and item.planned_date < p_from + p_days
    and (
      app.can_access_class(plan.class_id)
      or exists (
        select 1
        from public.enrollments as enrollment
        where enrollment.class_id = plan.class_id
          and enrollment.student_id = any (app.own_student_ids())
          and enrollment.status in ('active', 'paused')
      )
    )
  order by item.planned_date, class.display_name, item.title;
end;
$$;

revoke all on function public.get_week_ahead_teaching_items(date, integer) from public, anon;
grant execute on function public.get_week_ahead_teaching_items(date, integer) to authenticated, service_role;

comment on function public.get_week_ahead_teaching_items(date, integer) is
  'Projection lịch sắp tới an toàn: không trả mục tiêu, nội dung giáo lý/Lời Chúa, trò chơi, bài hát, bài tập hoặc ghi chú nội bộ.';
