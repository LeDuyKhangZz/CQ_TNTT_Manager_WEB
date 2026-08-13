-- ============================================================================
-- M01-A — Nhật ký thao tác tài khoản (D-65, AGENTS §6).
--
-- Trước đợt này KHÔNG bảng nào ghi lại "ai tạo/đổi/khóa/xóa tài khoản của ai".
-- Với một Super Admin còn truy được trách nhiệm; nhưng D-65 (chốt 2026-07-23)
-- yêu cầu full audit log, và AC-M01-05.3 đòi mỗi lần XÓA tài khoản để lại một
-- bản ghi với `actor_profile_id` là Super Admin. Bảng này đóng cả hai.
--
-- Bốn quyết định cài đặt cần nhớ:
--
--   1. KHÔNG có FK sang `profiles` cho `actor_profile_id`/`target_profile_id`.
--      Đây là nhật ký phải SỐNG SÓT khi chính tài khoản đích bị xóa — mà xóa
--      `auth.users` sẽ cascade xóa `profiles`. Một FK `on delete set null` sẽ
--      biến id thành null (mất thông tin ai bị xóa) VÀ xung đột với trigger
--      append-only bên dưới (set null là một UPDATE). Nên lưu id trần + ảnh
--      chụp `*_username` bằng text: bản ghi đọc được kể cả sau khi hồ sơ biến mất.
--
--   2. Append-only TUYỆT ĐỐI. Trigger chặn UPDATE/DELETE cho MỌI vai trò, kể cả
--      chủ bảng và service_role — đúng câu chữ AGENTS §6 "không ai sửa/xóa kể cả
--      Super Admin". INSERT vẫn được (nhật ký phải ghi vào được).
--
--   3. Chỉ Super Admin ĐỌC (AGENTS §6). `authenticated` khác nhìn ra bảng rỗng.
--      Không cấp INSERT/UPDATE/DELETE cho `authenticated`: nhật ký được ghi qua
--      service role trong action quản trị (cùng nơi đã dùng Admin API), không
--      phải từ phiên người dùng.
--
--   4. KHÔNG ghi mật khẩu/token/nội dung hồ sơ (AGENTS §6). `detail` chỉ là một
--      câu tóm tắt do action tự soạn (ví dụ "Vai trò: class_teacher",
--      "GLV045 → GLV046"), giới hạn 500 ký tự.
-- ============================================================================

create type public.account_audit_action as enum (
  'provision', 'reset_password', 'set_password', 'update_username', 'set_status', 'delete'
);

create table public.account_audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_profile_id uuid,
  actor_username text not null,
  target_profile_id uuid,
  target_username text not null,
  action public.account_audit_action not null,
  detail text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now()
);

create index account_audit_events_target_idx
  on public.account_audit_events (target_profile_id, created_at desc);
create index account_audit_events_created_idx
  on public.account_audit_events (created_at desc);

-- Append-only: chặn mọi UPDATE/DELETE ở tầng trigger, độc lập với quyền GRANT.
create function app.account_audit_no_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'ACCOUNT_AUDIT_APPEND_ONLY' using errcode = '42501';
end;
$$;

create trigger account_audit_events_no_mutation
before update or delete on public.account_audit_events
for each row execute function app.account_audit_no_mutation();

alter table public.account_audit_events enable row level security;

-- Chỉ SELECT cho authenticated; ghi là việc của service role trong action.
grant select on public.account_audit_events to authenticated;
grant all on public.account_audit_events to service_role;

create policy account_audit_select_super_admin
on public.account_audit_events for select to authenticated
using (app.is_super_admin());

comment on table public.account_audit_events is
  'Nhật ký append-only mọi thao tác tài khoản (D-65). Chỉ Super Admin đọc; không ai sửa/xóa.';
comment on column public.account_audit_events.target_username is
  'Ảnh chụp tên đăng nhập của tài khoản đích — sống sót sau khi hồ sơ bị xóa (AC-05.3).';
