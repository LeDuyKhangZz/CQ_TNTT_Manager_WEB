-- ============================================================================
-- P6-T2 — Nội dung Ban: thông báo, lịch họp, công việc tuần
-- (docs/01 §10, docs/02 §11.3–11.5, WF-12).
--
-- D-48  Chỉ Trưởng/Phó Ban tạo thông báo/lịch/công việc tuần. Cố vấn tối cao và
--       thành viên chỉ đọc. Global-write vẫn ghi được (docs/05 §Committee).
-- WF-12 `Công việc tuần` là nội dung/checklist chung — CHƯA có assignee/deadline
--       trong v1; đừng thêm cột người phụ trách.
--
-- Tác giả không lấy từ client: trigger điền `created_by`/`author_staff_id` từ
-- phiên đang đăng nhập (AGENTS §5).
-- ============================================================================

create table public.committee_announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  title text not null check (btrim(title) <> '' and char_length(title) <= 200),
  content text not null check (btrim(content) <> '' and char_length(content) <= 5000),
  author_staff_id uuid references public.staff_profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index committee_announcements_feed_idx
on public.committee_announcements (committee_id, published_at desc);

create table public.committee_meetings (
  id uuid primary key default extensions.gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  title text not null check (btrim(title) <> '' and char_length(title) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text check (location is null or char_length(location) <= 200),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint committee_meeting_time_order check (ends_at is null or ends_at >= starts_at)
);

create index committee_meetings_schedule_idx
on public.committee_meetings (committee_id, starts_at desc);

create table public.committee_weekly_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  week_start date not null,
  content text check (content is null or char_length(content) <= 5000),
  checklist_json jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  -- Tuần luôn bắt đầu thứ Hai: nếu không chốt, hai người chọn hai mốc khác nhau
  -- cho cùng một tuần và unique bên dưới mất tác dụng.
  constraint committee_weekly_plan_week_start_monday check (extract(isodow from week_start) = 1),
  constraint committee_weekly_plan_checklist_is_array check (jsonb_typeof(checklist_json) = 'array'),
  constraint committee_weekly_plan_unique_week unique (committee_id, week_start)
);

create index committee_weekly_plans_week_idx
on public.committee_weekly_plans (committee_id, week_start desc);

create trigger committee_announcements_set_updated_at
before update on public.committee_announcements
for each row execute function app.set_updated_at();
create trigger committee_meetings_set_updated_at
before update on public.committee_meetings
for each row execute function app.set_updated_at();
create trigger committee_weekly_plans_set_updated_at
before update on public.committee_weekly_plans
for each row execute function app.set_updated_at();

create function app.set_committee_content_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  if tg_table_name = 'committee_announcements' then
    new.author_staff_id := (
      select id from public.staff_profiles where profile_id = auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger committee_announcements_set_author
before insert on public.committee_announcements
for each row execute function app.set_committee_content_author();
create trigger committee_meetings_set_author
before insert on public.committee_meetings
for each row execute function app.set_committee_content_author();
create trigger committee_weekly_plans_set_author
before insert on public.committee_weekly_plans
for each row execute function app.set_committee_content_author();

alter table public.committee_announcements enable row level security;
alter table public.committee_meetings enable row level security;
alter table public.committee_weekly_plans enable row level security;

grant select, insert, update, delete on
  public.committee_announcements,
  public.committee_meetings,
  public.committee_weekly_plans
to authenticated;
grant all on
  public.committee_announcements,
  public.committee_meetings,
  public.committee_weekly_plans
to service_role;

-- Đọc: global read hoặc thành viên chính Ban đó. Ghi/xóa: Trưởng/Phó Ban hoặc
-- global-write. Nội dung Ban không phải dữ liệu chốt sổ nên cho phép xóa.
create policy committee_announcements_select_scope
on public.committee_announcements for select to authenticated
using (
  (select app.can_global_read())
  or committee_id = any ((select app.member_committee_ids())::uuid[])
);
create policy committee_announcements_insert_leaders
on public.committee_announcements for insert to authenticated
with check (app.can_write_committee_content(committee_id) and created_by = auth.uid());
create policy committee_announcements_update_leaders
on public.committee_announcements for update to authenticated
using (app.can_write_committee_content(committee_id))
with check (app.can_write_committee_content(committee_id) and updated_by = auth.uid());
create policy committee_announcements_delete_leaders
on public.committee_announcements for delete to authenticated
using (app.can_write_committee_content(committee_id));

create policy committee_meetings_select_scope
on public.committee_meetings for select to authenticated
using (
  (select app.can_global_read())
  or committee_id = any ((select app.member_committee_ids())::uuid[])
);
create policy committee_meetings_insert_leaders
on public.committee_meetings for insert to authenticated
with check (app.can_write_committee_content(committee_id) and created_by = auth.uid());
create policy committee_meetings_update_leaders
on public.committee_meetings for update to authenticated
using (app.can_write_committee_content(committee_id))
with check (app.can_write_committee_content(committee_id) and updated_by = auth.uid());
create policy committee_meetings_delete_leaders
on public.committee_meetings for delete to authenticated
using (app.can_write_committee_content(committee_id));

create policy committee_weekly_plans_select_scope
on public.committee_weekly_plans for select to authenticated
using (
  (select app.can_global_read())
  or committee_id = any ((select app.member_committee_ids())::uuid[])
);
create policy committee_weekly_plans_insert_leaders
on public.committee_weekly_plans for insert to authenticated
with check (app.can_write_committee_content(committee_id) and created_by = auth.uid());
create policy committee_weekly_plans_update_leaders
on public.committee_weekly_plans for update to authenticated
using (app.can_write_committee_content(committee_id))
with check (app.can_write_committee_content(committee_id) and updated_by = auth.uid());
create policy committee_weekly_plans_delete_leaders
on public.committee_weekly_plans for delete to authenticated
using (app.can_write_committee_content(committee_id));

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

comment on table public.committee_announcements is
  'Thông báo nội bộ của một Ban; chỉ Trưởng/Phó Ban hoặc global-write đăng (D-48).';
comment on table public.committee_meetings is
  'Lịch họp Ban. Không gửi lời mời/nhắc lịch — chỉ hiển thị trong web (D-50).';
comment on table public.committee_weekly_plans is
  'Công việc tuần của Ban, mốc tuần luôn là thứ Hai. v1 không có assignee/deadline (WF-12).';
