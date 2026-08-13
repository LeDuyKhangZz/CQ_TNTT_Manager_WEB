-- ============================================================================
-- M02-C · I8 / TB-F09 giai đoạn 2 · BR-M02-N06 — KHOÁ GHI vào năm học đã đóng.
--
-- 🔴 Đây là lỗ hổng nghiêm trọng nhất mà D-73 đã nêu và cho tới trước migration
-- này **vẫn đang mở**: năm học `closed`/`archived` vẫn nhận ghi danh mới và vẫn
-- sửa được cài đặt lớp, với **mọi** vai trò. Đợt M02-B đã dựng chốt chặn ở tầng
-- ứng dụng (`isAcademicYearWritable`) và ghi thẳng ra trong `year-lifecycle.ts`
-- rằng hàng rào chưa dựng xong: ai gọi Data API bằng JWT thật đều đi qua được, vì
-- RLS không hề biết trạng thái năm học. Migration này dựng hàng rào thật.
--
-- **D-117** (chủ dự án 2026-07-26): sau khi đóng, **Super Admin còn ghi được tất
-- cả** trong năm đó — ngoại lệ duy nhất, đúng WF-16 bước 5 và AC-M02-07.
--
-- **D-118** (chủ dự án 2026-07-26): phạm vi đợt này **chỉ `enrollments` và
-- `classes`** — đúng khuyến nghị `04_TO_BE_FLOWS.md` TB-F09 ("A cho enrollments +
-- classes trước; mở rộng sang M05/M07 khi audit các module đó"). Bảng điểm danh,
-- bảng điểm, chuyển lớp, báo cáo **CHƯA** bị khoá, và đó là chủ ý: chúng thuộc năm
-- module chưa được thiết kế lại và chưa audit chéo. Ghi vào nợ kỹ thuật để không ai
-- đọc mã rồi tưởng năm đã đóng là bất khả xâm phạm.
--
-- BA quyết định cài đặt cần nhớ:
--
--   1. 🔴 HELPER KHÔNG THAM SỐ, TRẢ MẢNG — không phải `app.year_is_writable(uuid)`
--      như `07_IMPLEMENTATION_IMPACT.md` §2 đề xuất. Lý do là một bài học đã ĐO
--      được của chính repo này (`20260721000200`, và `WORKLOG` guardians 79,9 →
--      8,9 ms): một helper `security definer` **có tham số cột** không inline được,
--      nên Postgres gọi lại nó **cho từng dòng** của mọi lệnh ghi. Bọc trong
--      `(select …)` cũng không cứu được vì biểu thức tham chiếu cột ⇒ subquery
--      tương quan, không nâng thành InitPlan. Dạng mảng không tham số thì
--      `(select app.writable_academic_year_ids())` chạy **một lần cho cả câu lệnh**.
--      Ngữ nghĩa giữ y nguyên điều TB-F09 mô tả.
--
--   2. Mệnh đề `using` của UPDATE cũng phải có hàng rào, không chỉ `with check`.
--      Chỉ chặn `with check` thì người ta vẫn **đọc-để-ghi** được dòng cũ và chỉ bị
--      chặn ở giá trị mới — nghĩa là `update … set notes = notes` (không đổi năm
--      học) vẫn đi lọt vào một năm đã đóng.
--
--   3. `generate_default_classes` KHÔNG bị hàng rào này chặn vì nó chạy
--      `security definer` (chủ hàm là owner của bảng ⇒ bỏ qua RLS). Đó là đúng: nó
--      đã có chốt chặn riêng `ACADEMIC_YEAR_CLOSED` từ M02-A. Hai hàng rào ở hai
--      tầng, cùng một luật.
-- ============================================================================

create or replace function app.writable_academic_year_ids()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(year.id), '{}'::uuid[])
  from public.academic_years as year
  -- D-117: Super Admin ghi được vào MỌI năm học, kể cả đã đóng/đã lưu trữ.
  where app.is_super_admin() or year.status in ('draft', 'current')
$$;

revoke all on function app.writable_academic_year_ids() from public, anon;
grant execute on function app.writable_academic_year_ids() to authenticated, service_role;

comment on function app.writable_academic_year_ids() is
  'BR-M02-N06/D-117: năm học mà người đang đăng nhập được phép ghi vào. Nháp + đang '
  'áp dụng với mọi vai trò; TẤT CẢ với Super Admin. Dạng mảng không tham số để RLS '
  'nâng thành InitPlan (bài học 20260721000200).';

-- ── Ghi danh — BR-M02-N09 ───────────────────────────────────────────────────
drop policy enrollments_insert_scope on public.enrollments;
create policy enrollments_insert_scope
on public.enrollments for insert to authenticated
with check (
  app.can_manage_class(class_id)
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy enrollments_update_scope on public.enrollments;
create policy enrollments_update_scope
on public.enrollments for update to authenticated
using (
  app.can_manage_class(class_id)
  -- Ghi chú 2: hàng rào phải có ở CẢ `using`.
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_manage_class(class_id)
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

-- ── Lớp — TB-F08 / AC-M02-08 ────────────────────────────────────────────────
-- Phạm vi quyền giữ nguyên `app.can_global_write()` (bốn vai trò) — D-112 cố ý
-- KHÔNG lan sang bảng này, và pgTAP `033` canh đúng ranh giới đó. Đợt này chỉ
-- thêm điều kiện trạng thái năm học.
drop policy classes_insert_global_write on public.classes;
create policy classes_insert_global_write
on public.classes for insert to authenticated
with check (
  app.can_global_write()
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy classes_update_global_write on public.classes;
create policy classes_update_global_write
on public.classes for update to authenticated
using (
  app.can_global_write()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_global_write()
  and updated_by = auth.uid()
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

comment on policy enrollments_insert_scope on public.enrollments is
  'BR-M02-N06/N09: ghi danh chỉ vào năm học còn ghi được; Super Admin ngoại lệ (D-117).';
comment on policy classes_update_global_write on public.classes is
  'BR-M02-N06: sửa lớp chỉ ở năm học còn ghi được; Super Admin ngoại lệ (D-117).';
