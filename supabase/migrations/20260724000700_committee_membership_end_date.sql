-- ============================================================================
-- M09-C · TB-M09-05 — Ngày kết thúc nhiệm kỳ do DB đặt, không do client gửi.
--
-- Trước đây `endCommitteeMembership` gửi `ends_on = new Date().toISOString()` —
-- tức NGÀY UTC tính ở trình duyệt. Nhưng `starts_on` mặc định là `current_date`
-- (đồng hồ của DB). Hai đồng hồ lệch múi giờ có thể cho `ends_on < starts_on` và
-- vi phạm CHECK `committee_membership_date_order` (23514) — đúng lỗi
-- `08_ACCEPTANCE_CRITERIA.md` §1 nêu. Để hai mốc dùng CÙNG một đồng hồ, ngày kết
-- thúc phải do DB đặt bằng `current_date`.
--
-- Một cột DEFAULT không dùng được ở đây: DEFAULT chỉ áp khi INSERT, còn kết thúc
-- nhiệm kỳ là một UPDATE (đặt is_active = false). Vì vậy phải là trigger.
-- Migration/data impact: 0 bảng/cột mới; chỉ thêm một trigger BEFORE UPDATE.
-- ============================================================================

create function app.set_committee_membership_end_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Chỉ khi vừa chuyển từ đang hoạt động sang ngưng VÀ chưa có ngày kết thúc.
  -- Không đụng tới nhiệm kỳ đã ngưng sẵn (idempotent) và không ghi đè ngày mà
  -- một luồng khác cố tình đặt.
  if old.is_active and not new.is_active and new.ends_on is null then
    new.ends_on := current_date;
  end if;
  return new;
end;
$$;

-- Chạy TRƯỚC `..._set_updated_at` và `..._validate` (thứ tự theo tên trigger),
-- và trước khi CHECK constraint đánh giá — đúng lúc để đặt ends_on hợp lệ.
create trigger committee_memberships_set_end_date
before update of is_active on public.committee_memberships
for each row execute function app.set_committee_membership_end_date();

revoke all on function app.set_committee_membership_end_date() from public;
grant execute on function app.set_committee_membership_end_date() to authenticated, service_role;

comment on function app.set_committee_membership_end_date() is
  'TB-M09-05: khi kết thúc nhiệm kỳ (is_active true→false) đặt ends_on = current_date của DB, để cùng đồng hồ với starts_on.';
