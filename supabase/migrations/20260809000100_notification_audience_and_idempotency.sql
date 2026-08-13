-- ============================================================================
-- M10-B — Thông báo: đếm người nhận trước khi gửi · chống gửi đúp · sửa nhánh
-- gửi đích danh.
--
-- Ba quyết định của chủ dự án (2026-08-09), `07_IMPLEMENTATION_IMPACT.md` §6:
--   D-165 (Q-1) Chống gửi đúp bằng **mã yêu cầu do giao diện sinh**.
--   D-167 (Q-3) Gửi đích danh **phải tới được** người chưa có phân công vai trò.
--   (Q-2 thu hồi mềm nằm ở đợt C.)
--
-- 🔴 **KHÔNG cấp thêm một quyền ghi nào.** `authenticated` vẫn chỉ có `select`
-- trên cả hai bảng — tính bất biến của bản ghi là điểm mạnh nhất của module
-- (`07` §3, BR-M10-07…09) và không được đổi. Không policy nào bị sửa.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Mệnh đề "ai nằm trong phạm vi" tách thành MỘT hàm dùng chung.
--
-- BR-M10-24: con số hiện ra **trước** khi gửi phải dùng đúng logic với lúc chốt
-- danh sách người nhận. Chép mệnh đề `case` ra hai chỗ là hẹn ngày chúng trôi
-- khỏi nhau, mà khi ấy triệu chứng là *"xem trước nói 42, gửi xong còn 37"* —
-- không ai biết bên nào đúng.
--
-- 🔴 **D-167 nằm ở CẤU TRÚC của hàm này, không phải ở một điều kiện thêm vào.**
-- Bản cũ có đúng một mệnh đề `from` cho cả 7 phạm vi, trong đó phép nối bắt
-- buộc với `role_assignments … is_active` (`20260723000400:127-128`). Phép nối
-- ấy **đúng cho 6 phạm vi nhóm** — muốn lọc theo `role`/`sector_id`/`class_id`
-- thì phải có nó — nhưng **sai cho phạm vi cá nhân**: gửi đích danh cho một
-- người là gửi cho *chính người đó*, không phải cho *vai trò của họ*. Hậu quả
-- cũ: tài khoản vừa tạo, chưa kịp phân công, **không bao giờ** nhận được thông
-- báo nào — và người gửi không được báo, vì `recipient_count = 0` cũng không
-- nói ra (đợt A đã sửa vế nói ra).
--
-- Nên nhánh `user` đứng thành **một nhánh `union` riêng, không đi qua phép
-- nối**. Sửa bằng cách thêm `or` vào mệnh đề `case` là không được: phép nối
-- nằm ở `from`, tức nó đã loại người ta ra **trước khi** `case` được chạy.
-- ---------------------------------------------------------------------------
create function app.notification_audience(
  p_target_type public.notification_target_type,
  p_target_sector_id uuid,
  p_target_class_id uuid,
  p_target_committee_id uuid,
  p_target_profile_id uuid
)
returns table (profile_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  -- Nhánh cá nhân — D-167. Chỉ đòi tài khoản đang hoạt động (BR-M10-23).
  select profile.id
  from public.profiles as profile
  where p_target_type = 'user'
    and profile.account_status = 'active'
    and profile.id = p_target_profile_id

  union

  -- Sáu phạm vi nhóm — nguyên văn mệnh đề của `20260723000400`, không đổi một
  -- điều kiện nào. `022_notifications_test.sql` (31 assert) là lưới an toàn.
  select profile.id
  from public.profiles as profile
  join public.role_assignments as assignment
    on assignment.profile_id = profile.id and assignment.is_active
  where p_target_type <> 'user'
    and profile.account_status = 'active'
    and case p_target_type
      when 'all' then true
      when 'guardians' then assignment.role = 'guardian'
      when 'students' then assignment.role = 'student'
      when 'sector' then
        assignment.sector_id = p_target_sector_id
        or exists (
          select 1
          from public.staff_profiles as staff
          join public.class_staff_assignments as class_staff
            on class_staff.staff_profile_id = staff.id and class_staff.is_active
          join public.classes as class on class.id = class_staff.class_id
          join public.grade_levels as grade on grade.id = class.grade_level_id
          where staff.profile_id = profile.id
            and grade.sector_id = p_target_sector_id
        )
      when 'class' then
        exists (
          select 1
          from public.staff_profiles as staff
          join public.class_staff_assignments as class_staff
            on class_staff.staff_profile_id = staff.id and class_staff.is_active
          where staff.profile_id = profile.id
            and class_staff.class_id = p_target_class_id
        )
        or exists (
          select 1
          from public.enrollments as enrollment
          join public.students as student on student.id = enrollment.student_id
          left join public.guardians as guardian on guardian.id = student.guardian_id
          where enrollment.class_id = p_target_class_id
            and enrollment.status in ('active', 'paused')
            and (student.profile_id = profile.id or guardian.profile_id = profile.id)
        )
      when 'committee' then exists (
        select 1
        from public.committee_memberships as membership
        join public.staff_profiles as staff on staff.id = membership.staff_profile_id
        where membership.committee_id = p_target_committee_id
          and membership.is_active
          and staff.profile_id = profile.id
      )
      else false
    end
$$;

comment on function app.notification_audience(
  public.notification_target_type, uuid, uuid, uuid, uuid
) is
  'Định nghĩa DUY NHẤT của "ai nằm trong phạm vi" (BR-M10-24). Cả lúc đếm trước '
  'khi gửi lẫn lúc chốt danh sách người nhận đều gọi hàm này, để hai con số '
  'không thể trôi khỏi nhau. Nhánh `user` cố ý KHÔNG qua role_assignments (D-167).';

-- Materialize nay chỉ còn là "đổ kết quả của hàm trên vào bảng".
create or replace function app.materialize_notification_recipients(p_notification_id uuid)
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

  insert into public.notification_recipients (notification_id, profile_id)
  select notification.id, audience.profile_id
  from app.notification_audience(
    notification.target_type,
    notification.target_sector_id,
    notification.target_class_id,
    notification.target_committee_id,
    notification.target_profile_id
  ) as audience
  on conflict (notification_id, profile_id) do nothing;

  get diagnostics inserted = row_count;
  update public.notifications set recipient_count = inserted where id = notification.id;
  return inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Đếm người nhận TRƯỚC khi gửi — hạng mục 2/6, TB-M10-04.
--
-- 🔴 **Kiểm quyền phải chạy TRƯỚC khi đếm, không phải sau.** Hàm này là
-- `security definer` nên nó bỏ qua mọi hàng rào đọc; thiếu vế kiểm quyền thì nó
-- thành công cụ đếm số phụ huynh của **lớp bất kỳ** cho **bất kỳ ai** — một
-- cửa hậu rò rỉ quy mô tổ chức, mở ra để đổi lấy một con số tiện lợi.
-- Nguyên văn `04_TO_BE_FLOWS.md` TB-M10-04: *"Preview phải kiểm quyền y hệt
-- publish"*, và nó dùng đúng `app.can_publish_notification` mà `publish` dùng.
-- ---------------------------------------------------------------------------
create function public.count_notification_audience(
  p_target_type public.notification_target_type,
  p_target_id uuid default null
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  total integer;
begin
  if not app.can_publish_notification(p_target_type, p_target_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_target_type in ('sector', 'class', 'committee', 'user') and p_target_id is null then
    raise exception 'NOTIFICATION_TARGET_REQUIRED' using errcode = '23514';
  end if;

  select count(*) into total
  from app.notification_audience(
    p_target_type,
    case when p_target_type = 'sector' then p_target_id end,
    case when p_target_type = 'class' then p_target_id end,
    case when p_target_type = 'committee' then p_target_id end,
    case when p_target_type = 'user' then p_target_id end
  );
  return total;
end;
$$;

comment on function public.count_notification_audience(
  public.notification_target_type, uuid
) is
  'Đếm trước khi gửi (BR-M10-24/25). Kiểm quyền TRƯỚC khi đếm — nếu không, hàm '
  'definer này trở thành công cụ đếm người của phạm vi mình không được gửi.';

-- ---------------------------------------------------------------------------
-- 3. Chống gửi đúp — D-165 (Q-1), TB-M10-02 phương án A.
--
-- Cột nullable + ràng buộc duy nhất **một phần** (`where request_id is not
-- null`): mọi thông báo đã có từ trước mang `null` nên không dòng nào vướng
-- ràng buộc mới, không backfill, không đụng một dòng dữ liệu nào.
-- ---------------------------------------------------------------------------
alter table public.notifications add column request_id uuid;

create unique index notifications_author_request_key
on public.notifications (author_profile_id, request_id)
where request_id is not null;

comment on column public.notifications.request_id is
  'Mã yêu cầu do giao diện sinh một lần mỗi lượt soạn (D-165). Gửi lại cùng mã '
  'trả về thông báo cũ thay vì tạo bản thứ hai.';

-- Chữ ký đổi (thêm `p_request_id`) nên phải drop + create + **cấp lại quyền
-- chạy** — quyền đi theo chữ ký, quên bước cuối là cả module hỏng lặng lẽ.
drop function public.publish_notification(
  text, text, public.notification_target_type, uuid, text
);

create function public.publish_notification(
  p_title text,
  p_content text,
  p_target_type public.notification_target_type,
  p_target_id uuid default null,
  p_link_path text default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_id uuid;
begin
  -- Đường tắt idempotent: lần gọi thứ hai cùng khoá trả lại **đúng thông báo
  -- cũ** và dừng ở đây — không tạo bản mới, không chốt lại danh sách người
  -- nhận. Cùng khuôn với `return_equipment` của M09.
  if p_request_id is not null then
    select id into notification_id
    from public.notifications
    where author_profile_id = auth.uid() and request_id = p_request_id;
    if notification_id is not null then
      return notification_id;
    end if;
  end if;

  if not app.can_publish_notification(p_target_type, p_target_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if btrim(coalesce(p_title, '')) = '' or btrim(coalesce(p_content, '')) = '' then
    raise exception 'NOTIFICATION_CONTENT_REQUIRED' using errcode = '23514';
  end if;
  if p_target_type in ('sector', 'class', 'committee', 'user') and p_target_id is null then
    raise exception 'NOTIFICATION_TARGET_REQUIRED' using errcode = '23514';
  end if;
  -- BR-M10-23 — gửi đích danh cho tài khoản đã khoá/chưa kích hoạt bị từ chối
  -- **trước khi ghi**, thay vì ghi xong rồi lặng lẽ ra 0 người nhận.
  if p_target_type = 'user' and not exists (
    select 1 from public.profiles
    where id = p_target_id and account_status = 'active'
  ) then
    raise exception 'NOTIFICATION_TARGET_INACTIVE' using errcode = '23514';
  end if;

  insert into public.notifications (
    title, content, target_type,
    target_sector_id, target_class_id, target_committee_id, target_profile_id,
    link_path, author_profile_id, published_at, request_id
  ) values (
    btrim(p_title), btrim(p_content), p_target_type,
    case when p_target_type = 'sector' then p_target_id end,
    case when p_target_type = 'class' then p_target_id end,
    case when p_target_type = 'committee' then p_target_id end,
    case when p_target_type = 'user' then p_target_id end,
    nullif(btrim(coalesce(p_link_path, '')), ''), auth.uid(), now(), p_request_id
  )
  on conflict (author_profile_id, request_id) where request_id is not null
  do nothing
  returning id into notification_id;

  -- Hai lượt gọi cùng khoá chạy **song song**: lượt thua cuộc rơi vào đây với
  -- `notification_id` rỗng vì phép kiểm ở đầu hàm chạy trước khi lượt kia kịp
  -- ghi. Đọc lại bản của người thắng và trả về — vẫn đúng một thông báo.
  if notification_id is null then
    select id into notification_id
    from public.notifications
    where author_profile_id = auth.uid() and request_id = p_request_id;
    return notification_id;
  end if;

  perform app.materialize_notification_recipients(notification_id);
  return notification_id;
end;
$$;

revoke all on function public.publish_notification(
  text, text, public.notification_target_type, uuid, text, uuid
) from public, anon;
revoke all on function public.count_notification_audience(
  public.notification_target_type, uuid
) from public, anon;
grant execute on function public.publish_notification(
  text, text, public.notification_target_type, uuid, text, uuid
) to authenticated, service_role;
grant execute on function public.count_notification_audience(
  public.notification_target_type, uuid
) to authenticated, service_role;

comment on function public.publish_notification(
  text, text, public.notification_target_type, uuid, text, uuid
) is
  'Kiểm quyền theo phạm vi, tạo thông báo và chốt danh sách người nhận trong một '
  'giao dịch (WF-14). Idempotent theo (tác giả, request_id) — D-165.';

-- `app.notification_audience` là hàm nội bộ: mọi đường vào đều qua hai hàm
-- `public` ở trên, và cả hai đều tự kiểm quyền. Giữ đúng hàng rào cũ.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
