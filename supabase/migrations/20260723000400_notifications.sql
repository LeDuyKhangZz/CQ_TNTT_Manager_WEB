-- ============================================================================
-- P6-T4 — Thông báo trong web (docs/01 §11, docs/02 §12, WF-14).
--
-- D-50  Chỉ trong web; có read state; không chat/SMS/email/Zalo/schedule.
-- WF-14 Publish ngay → hệ thống materialize danh sách người nhận → mở thông báo
--       set read_at → badge đếm chưa đọc.
--
-- Vì sao materialize: đếm chưa đọc phải ổn định ngay cả khi người dùng đổi
-- lớp/role sau đó (docs/02 §12.2). Người nhận được chốt tại thời điểm publish.
--
-- AGENTS §8: không tạo deep-link tới route chưa tồn tại — `link_path` bị CHECK
-- ràng vào danh sách route đã có.
-- ============================================================================

create function app.notification_link_is_valid(p_link text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_link is null or exists (
    select 1
    from unnest(array[
      '/dashboard', '/notifications', '/account', '/students', '/classes', '/staff',
      '/attendance', '/teaching-plan', '/results', '/promotions', '/committees',
      '/reports', '/imports', '/admin', '/parent/absence-requests',
      '/parent/children', '/student/attendance'
    ]) as known(route)
    where p_link = known.route or p_link like known.route || '/%'
  )
$$;

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (btrim(title) <> '' and char_length(title) <= 200),
  content text not null check (btrim(content) <> '' and char_length(content) <= 5000),
  target_type public.notification_target_type not null,
  target_sector_id uuid references public.sectors(id) on delete restrict,
  target_class_id uuid references public.classes(id) on delete restrict,
  target_committee_id uuid references public.committees(id) on delete restrict,
  target_profile_id uuid references public.profiles(id) on delete cascade,
  link_path text,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  created_at timestamptz not null default now(),
  constraint notifications_link_known_route check (app.notification_link_is_valid(link_path)),
  constraint notifications_target_shape check (
    (target_type = 'sector' and target_sector_id is not null and target_class_id is null and target_committee_id is null and target_profile_id is null)
    or (target_type = 'class' and target_class_id is not null and target_sector_id is null and target_committee_id is null and target_profile_id is null)
    or (target_type = 'committee' and target_committee_id is not null and target_sector_id is null and target_class_id is null and target_profile_id is null)
    or (target_type = 'user' and target_profile_id is not null and target_sector_id is null and target_class_id is null and target_committee_id is null)
    or (target_type in ('all', 'guardians', 'students')
        and target_sector_id is null and target_class_id is null
        and target_committee_id is null and target_profile_id is null)
  )
);

create index notifications_feed_idx on public.notifications (published_at desc);

create table public.notification_recipients (
  id uuid primary key default extensions.gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notification_recipients_unique unique (notification_id, profile_id)
);

create index notification_recipients_inbox_idx
on public.notification_recipients (profile_id, read_at);

-- Ai được publish cho phạm vi nào (docs/05 §Ghi chú hành động).
create function app.can_publish_notification(
  p_target_type public.notification_target_type,
  p_target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_target_type
    when 'sector' then coalesce(
      app.can_global_write()
      or (app.current_role() in ('sector_leader', 'sector_deputy')
          and app.current_sector_id() = p_target_id), false)
    when 'class' then coalesce(
      app.can_global_write()
      or app.is_class_representative(p_target_id)
      or exists (
        select 1
        from public.classes as class
        join public.grade_levels as grade on grade.id = class.grade_level_id
        where class.id = p_target_id
          and grade.sector_id = app.current_sector_id()
          and app.current_role() in ('sector_leader', 'sector_deputy')
      ), false)
    when 'committee' then coalesce(
      app.can_global_write() or app.is_committee_leader_or_deputy(p_target_id), false)
    else coalesce(app.can_global_write(), false)
  end
$$;

-- Materialize người nhận. Một dòng cho mỗi profile còn hoạt động trong phạm vi;
-- unique (notification_id, profile_id) chặn trùng khi một người thuộc nhiều
-- nhánh (ví dụ GLV kiêm phụ huynh của chính lớp đó, D-25).
create function app.materialize_notification_recipients(p_notification_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification public.notifications;
  inserted integer;
begin
  select * into notification from public.notifications where id = p_notification_id;
  if notification.id is null then
    raise exception 'NOTIFICATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  with candidate as (
    select distinct profile.id as profile_id
    from public.profiles as profile
    join public.role_assignments as assignment
      on assignment.profile_id = profile.id and assignment.is_active
    where profile.account_status = 'active'
      and case notification.target_type
        when 'all' then true
        when 'guardians' then assignment.role = 'guardian'
        when 'students' then assignment.role = 'student'
        when 'user' then profile.id = notification.target_profile_id
        when 'sector' then
          assignment.sector_id = notification.target_sector_id
          or exists (
            select 1
            from public.staff_profiles as staff
            join public.class_staff_assignments as class_staff
              on class_staff.staff_profile_id = staff.id and class_staff.is_active
            join public.classes as class on class.id = class_staff.class_id
            join public.grade_levels as grade on grade.id = class.grade_level_id
            where staff.profile_id = profile.id
              and grade.sector_id = notification.target_sector_id
          )
        when 'class' then
          exists (
            select 1
            from public.staff_profiles as staff
            join public.class_staff_assignments as class_staff
              on class_staff.staff_profile_id = staff.id and class_staff.is_active
            where staff.profile_id = profile.id
              and class_staff.class_id = notification.target_class_id
          )
          or exists (
            select 1
            from public.enrollments as enrollment
            join public.students as student on student.id = enrollment.student_id
            left join public.guardians as guardian on guardian.id = student.guardian_id
            where enrollment.class_id = notification.target_class_id
              and enrollment.status in ('active', 'paused')
              and (student.profile_id = profile.id or guardian.profile_id = profile.id)
          )
        when 'committee' then exists (
          select 1
          from public.committee_memberships as membership
          join public.staff_profiles as staff on staff.id = membership.staff_profile_id
          where membership.committee_id = notification.target_committee_id
            and membership.is_active
            and staff.profile_id = profile.id
        )
        else false
      end
  )
  insert into public.notification_recipients (notification_id, profile_id)
  select notification.id, candidate.profile_id from candidate
  on conflict (notification_id, profile_id) do nothing;

  get diagnostics inserted = row_count;
  update public.notifications set recipient_count = inserted where id = notification.id;
  return inserted;
end;
$$;

create function public.publish_notification(
  p_title text,
  p_content text,
  p_target_type public.notification_target_type,
  p_target_id uuid default null,
  p_link_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_id uuid;
begin
  if not app.can_publish_notification(p_target_type, p_target_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if btrim(coalesce(p_title, '')) = '' or btrim(coalesce(p_content, '')) = '' then
    raise exception 'NOTIFICATION_CONTENT_REQUIRED' using errcode = '23514';
  end if;
  if p_target_type in ('sector', 'class', 'committee', 'user') and p_target_id is null then
    raise exception 'NOTIFICATION_TARGET_REQUIRED' using errcode = '23514';
  end if;

  insert into public.notifications (
    title, content, target_type,
    target_sector_id, target_class_id, target_committee_id, target_profile_id,
    link_path, author_profile_id, published_at
  ) values (
    btrim(p_title), btrim(p_content), p_target_type,
    case when p_target_type = 'sector' then p_target_id end,
    case when p_target_type = 'class' then p_target_id end,
    case when p_target_type = 'committee' then p_target_id end,
    case when p_target_type = 'user' then p_target_id end,
    nullif(btrim(coalesce(p_link_path, '')), ''), auth.uid(), now()
  ) returning id into notification_id;

  perform app.materialize_notification_recipients(notification_id);
  return notification_id;
end;
$$;

create function public.mark_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notification_recipients
  set read_at = coalesce(read_at, now())
  where notification_id = p_notification_id and profile_id = auth.uid()
$$;

create function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.notification_recipients
  set read_at = now()
  where profile_id = auth.uid() and read_at is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;

grant select on public.notifications, public.notification_recipients to authenticated;
grant all on public.notifications, public.notification_recipients to service_role;
revoke all on function public.publish_notification(text, text, public.notification_target_type, uuid, text) from public, anon;
revoke all on function public.mark_notification_read(uuid) from public, anon;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.publish_notification(text, text, public.notification_target_type, uuid, text) to authenticated, service_role;
grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated, service_role;

-- Chỉ đọc được thông báo mà mình nằm trong danh sách nhận, hoặc mình là tác giả,
-- hoặc có quyền đọc toàn cục. Không suy ra được thông báo của phạm vi khác.
create policy notifications_select_recipient
on public.notifications for select to authenticated
using (
  author_profile_id = auth.uid()
  or (select app.can_global_read())
  or exists (
    select 1 from public.notification_recipients as recipient
    where recipient.notification_id = notifications.id
      and recipient.profile_id = auth.uid()
  )
);

create policy notification_recipients_select_self
on public.notification_recipients for select to authenticated
using (profile_id = auth.uid() or (select app.can_global_read()));

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.notifications is
  'Thông báo trong web (D-50). Không schedule, không gửi ra ngoài hệ thống.';
comment on table public.notification_recipients is
  'Danh sách người nhận chốt tại thời điểm publish để badge chưa đọc ổn định khi người dùng đổi lớp/role.';
comment on function public.publish_notification(text, text, public.notification_target_type, uuid, text) is
  'Kiểm quyền theo phạm vi, tạo thông báo và materialize người nhận trong một giao dịch (WF-14).';
