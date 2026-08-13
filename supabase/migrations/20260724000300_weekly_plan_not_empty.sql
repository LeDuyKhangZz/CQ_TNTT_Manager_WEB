-- ============================================================================
-- M09-A · TB-M09-01 PA A — công việc tuần không được là bản trắng (AC-M09-14).
--
-- Bản trắng là dấu vết của chính lỗi F11: form mở ra trống, người dùng bấm "Lưu"
-- và upsert ghi đè bản cũ bằng `content = null, checklist = []`. Chặn bản trắng ở
-- DB nghĩa là kể cả khi tầng ứng dụng có lỗi trở lại thì nội dung cũ vẫn không bị
-- một cú bấm nhầm xoá sạch.
--
-- `btrim(coalesce(content,'')) <> ''` chứ không phải `content is not null`:
-- `04_TO_BE_FLOWS.md` viết bản rút gọn, nhưng chuỗi rỗng cũng là bản trắng và Zod
-- ở tầng trên trim trước khi gửi, nên hai tầng phải nói cùng một điều.
--
-- `not valid` + `validate`: dữ liệu production có thể đã có bản trắng sẵn, và khoá
-- bảng để quét toàn bộ trong một câu lệnh là thứ không cần thiết cho một bảng nhỏ.
-- ============================================================================

update public.committee_weekly_plans
set content = '(chưa nhập nội dung)'
where btrim(coalesce(content, '')) = ''
  and jsonb_array_length(checklist_json) = 0;

alter table public.committee_weekly_plans
  add constraint committee_weekly_plan_not_empty
  check (btrim(coalesce(content, '')) <> '' or jsonb_array_length(checklist_json) > 0)
  not valid;

alter table public.committee_weekly_plans
  validate constraint committee_weekly_plan_not_empty;

comment on constraint committee_weekly_plan_not_empty on public.committee_weekly_plans is
  'Một bản công việc tuần phải có nội dung hoặc ít nhất một việc trong checklist (M09-A, AC-M09-14).';
