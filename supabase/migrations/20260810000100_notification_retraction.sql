-- ============================================================================
-- M10-C — Thu hồi thông báo (D-166, Q-2 chủ dự án chốt 2026-08-09).
--
-- Bốn vế của quyết định:
--   ⓵ **Thu hồi mềm** — bản ghi không bị xoá, chỉ thôi hiển thị nội dung.
--   ⓶ **Ai:** chính tác giả **hoặc** bốn vai trò cấp xứ đoàn (`can_global_write`).
--      Tác giả có thể đi vắng, tài khoản có thể bị khoá, và đôi khi chính họ là
--      người không nhận ra mình vừa gửi sai.
--   ⓷ **Không giới hạn thời gian.** Sai sót thường bị phát hiện muộn — một phụ
--      huynh nhắn lại sau hai tiếng thì cửa 15 phút đã đóng. Biện pháp an toàn
--      **không phải đồng hồ mà là nhật ký**: mọi lần thu hồi ghi lại ai, lúc
--      nào, lý do gì, và lý do là **bắt buộc**.
--   ⓸ **Người nhận vẫn thấy dòng ấy, kèm nhãn "Đã thu hồi"** — họ CÓ THỂ ĐÃ ĐỌC
--      rồi; cho nó biến mất không dấu vết là để họ tưởng mình nhớ nhầm, hoặc tệ
--      hơn là cứ làm theo nội dung sai mà không biết nó đã bị huỷ.
--
-- 🔴 **Vẫn KHÔNG cấp một quyền ghi nào cho `authenticated`.** Thu hồi làm bằng
-- cột trạng thái + RPC `security definer`, đúng ràng buộc tuyệt đối của
-- `08_ACCEPTANCE_CRITERIA.md` §4. Không xoá dòng, không backfill.
-- ============================================================================

alter table public.notifications
  add column retracted_at timestamptz,
  add column retracted_by uuid references public.profiles(id) on delete restrict,
  add column retract_reason text;

-- Ba cột đi cùng nhau hoặc cùng vắng mặt — không có trạng thái nửa vời, cùng
-- tinh thần với `notifications_target_shape` sẵn có. Lý do **bắt buộc** vì nó
-- là thứ thay cho giới hạn thời gian ở vế ⓷.
alter table public.notifications
  add constraint notifications_retraction_shape check (
    (retracted_at is null and retracted_by is null and retract_reason is null)
    or (retracted_at is not null and retracted_by is not null
        and btrim(coalesce(retract_reason, '')) <> '')
  );

-- ---------------------------------------------------------------------------
-- 🔴 Cờ thu hồi được **nhân bản xuống bảng người-nhận**, và đây là một quyết
-- định cài đặt có lý do, không phải thừa dữ liệu.
--
-- Hai việc cần nó:
--   ⓵ Hàng rào đọc bên dưới **giấu hẳn** thông báo đã thu hồi khỏi người nhận
--     (`07` §4 đòi đúng vậy) ⇒ phép nhúng `notifications(...)` trả về rỗng ⇒
--     giao diện **không còn cách nào** phân biệt "đã thu hồi" với "lỗi dữ
--     liệu". Cờ nằm ở bảng người-nhận là thứ họ vẫn đọc được, nên nhãn "Đã thu
--     hồi" dựng được mà nội dung thì không lộ. Cả hai tài liệu cùng được thoả.
--   ⓶ Phép đếm chưa đọc chạy ở **vỏ ứng dụng, trên mọi trang**. Có cờ tại chỗ
--     thì nó vẫn là một lượt đếm một bảng; không có thì phải nối bảng.
--
-- Khuôn này repo đã dùng: `sync_assessment_publication` của M07-B nhân cờ công
-- bố xuống `assessment_scores` vì đúng hai lý do trên.
-- ---------------------------------------------------------------------------
alter table public.notification_recipients add column notification_retracted_at timestamptz;

create index notification_recipients_unread_live_idx
on public.notification_recipients (profile_id, read_at)
where notification_retracted_at is null;

create function app.sync_notification_retraction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notification_recipients
  set notification_retracted_at = new.retracted_at
  where notification_id = new.id;
  return new;
end;
$$;

-- Trigger chứ không phải một lệnh `update` thứ hai trong RPC: đường nào sửa
-- `retracted_at` cũng phải kéo theo cờ, kể cả `service_role` sửa tay lúc chữa
-- cháy. Hai lệnh rời trong RPC chỉ đúng cho đúng một đường đi.
create trigger notifications_sync_retraction
after update of retracted_at on public.notifications
for each row
when (new.retracted_at is distinct from old.retracted_at)
execute function app.sync_notification_retraction();

-- ---------------------------------------------------------------------------
-- Hàng rào đọc — vế duy nhất của module này có đụng RLS.
--
-- Tác giả và cấp có quyền đọc toàn cục **vẫn thấy** bản đã thu hồi: mục "Đã
-- gửi" phải liệt kê được nó, và nhật ký thu hồi vô dụng nếu không ai đọc nổi.
-- Người nhận thì không — nội dung sai không được đọc tiếp qua Data API.
-- ---------------------------------------------------------------------------
drop policy notifications_select_recipient on public.notifications;
create policy notifications_select_recipient
on public.notifications for select to authenticated
using (
  author_profile_id = (select auth.uid())
  or (select app.can_global_read())
  or (
    retracted_at is null
    and exists (
      select 1 from public.notification_recipients as recipient
      where recipient.notification_id = notifications.id
        and recipient.profile_id = (select auth.uid())
    )
  )
);

-- ---------------------------------------------------------------------------
-- RPC thu hồi.
-- ---------------------------------------------------------------------------
create function public.retract_notification(
  p_notification_id uuid,
  p_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.notifications;
  affected integer;
begin
  select * into target from public.notifications where id = p_notification_id;
  if target.id is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- 🔴 Hàm `definer` bỏ qua hàng rào đọc, nên phép kiểm quyền phải viết lại
  -- **trong thân hàm** — bài học D-160/D-163 của M08.
  if not (target.author_profile_id = auth.uid() or app.can_global_write()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if target.retracted_at is not null then
    raise exception 'NOTIFICATION_ALREADY_RETRACTED' using errcode = '23514';
  end if;
  -- Vế ⓷ của D-166: lý do là thứ thay cho giới hạn thời gian. Chặn ở đây chứ
  -- không chỉ ở màn hình, vì `authenticated` gọi thẳng RPC được.
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'NOTIFICATION_RETRACT_REASON_REQUIRED' using errcode = '23514';
  end if;

  update public.notifications
  set retracted_at = now(),
      retracted_by = auth.uid(),
      retract_reason = btrim(p_reason)
  where id = p_notification_id;

  select count(*)::integer into affected
  from public.notification_recipients
  where notification_id = p_notification_id;
  return affected;
end;
$$;

revoke all on function public.retract_notification(uuid, text) from public, anon;
grant execute on function public.retract_notification(uuid, text) to authenticated, service_role;

comment on function public.retract_notification(uuid, text) is
  'Thu hồi mềm (D-166). Tác giả hoặc cấp xứ đoàn, không giới hạn thời gian, lý do '
  'bắt buộc. Không xoá dòng — chỉ đặt cột trạng thái, và trigger kéo cờ xuống '
  'bảng người-nhận để nhãn "Đã thu hồi" dựng được mà nội dung không lộ.';
comment on column public.notifications.retract_reason is
  'Bắt buộc khi thu hồi. Thay cho giới hạn thời gian: không chặn ai bằng đồng hồ, '
  'nhưng mọi lần thu hồi đều có tên người và lý do nằm lại.';
comment on column public.notification_recipients.notification_retracted_at is
  'Bản sao cờ thu hồi do trigger giữ đồng bộ. Người nhận không đọc được bản ghi '
  'thông báo nữa nhưng vẫn đọc được cờ này để giao diện hiện nhãn "Đã thu hồi".';

revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
