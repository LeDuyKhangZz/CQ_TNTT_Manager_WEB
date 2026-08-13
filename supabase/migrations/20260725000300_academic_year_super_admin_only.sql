-- M02-A · I9 / D-112 — Vòng đời NĂM HỌC về đúng một chủ: Super Admin.
--
-- Trước đợt này, ba tầng nói ba kiểu khác nhau về cùng một việc (BR-M02-15/16):
--   · `docs/05-permission-matrix.md` §3 dòng "Năm học": ✅ cho Xứ đoàn trưởng,
--     Phó Xứ đoàn và Thư ký;
--   · `route-map.ts`: `/admin` — nơi duy nhất có biểu mẫu năm học — chỉ mở cho
--     `super_admin`, nên ba vai trò kia **chưa bao giờ** dùng được trên thực tế;
--   · RLS: `can_global_write()` cho họ ghi, nhưng mệnh đề
--     `status <> 'current' or role in (super_admin, group_leader)` lại chặn
--     Thư ký/Phó Xứ đoàn ngay trên năm đang chạy.
-- Ba tầng lệch nhau là chỗ lỗ hổng sinh ra, và cũng là chỗ người dùng mất niềm tin
-- ("bảng phân quyền nói tôi được mà bấm vào lại bị đuổi").
--
-- Chủ dự án chốt 2026-07-25 (**D-112**): **chỉ Super Admin** tạo năm học, sinh lớp,
-- đặt năm hiện hành và sửa cấu hình điểm danh. `docs/05` được sửa theo cho khớp.
-- Việc ĐỌC năm học không đổi — mọi vai trò vẫn đọc như cũ.
--
-- ⚠️ Phạm vi cố ý HẸP: chỉ bảng `academic_years`. Bảng `classes` giữ nguyên
-- `can_global_write()` vì dòng "Ngành/lớp" của `docs/05` là một quyết định khác và
-- màn hình cài đặt lớp (M02-B) sẽ dùng tới nó.

drop policy academic_years_insert_global_write on public.academic_years;
drop policy academic_years_update_global_write on public.academic_years;

create policy academic_years_insert_super_admin
on public.academic_years for insert to authenticated
with check (app.is_super_admin() and updated_by = auth.uid());

create policy academic_years_update_super_admin
on public.academic_years for update to authenticated
using (app.is_super_admin())
with check (app.is_super_admin() and updated_by = auth.uid());

-- Đặt năm hiện hành: bỏ `group_leader` khỏi chốt chặn. Phần chống đua (`for update`
-- + unique partial index) giữ nguyên từng chữ — nó đang đúng (AC-M02-05, R4).
create or replace function public.set_current_academic_year(target_academic_year_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  perform 1 from public.academic_years for update;
  if not exists (
    select 1 from public.academic_years
    where id = target_academic_year_id and status in ('draft', 'current')
  ) then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND_OR_CLOSED' using errcode = 'P0002';
  end if;

  update public.academic_years
  set status = 'closed', updated_by = auth.uid()
  where status = 'current' and id <> target_academic_year_id;

  update public.academic_years
  set status = 'current', updated_by = auth.uid()
  where id = target_academic_year_id;
end;
$$;

comment on function public.set_current_academic_year(uuid) is
  'Đặt một năm học thành hiện hành trong một giao dịch (Super Admin, D-112).';
