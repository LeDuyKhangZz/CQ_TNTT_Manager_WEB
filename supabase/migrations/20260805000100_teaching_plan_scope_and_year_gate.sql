-- ============================================================================
-- M06-B · Giáo án — BA thay đổi phân quyền trong MỘT migration.
--
--   D-144  🔴 SIẾT — Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký chỉ còn XEM giáo án.
--   D-145     NỚI  — đội ngũ lớp đọc được giáo án lớp mình (TB-M06-06 phương án A).
--   Nợ #18    SIẾT — năm học đã đóng không nhận ghi giáo án nữa (D-118 giai đoạn 3).
--
-- Gộp một file vì cả ba đụng cùng một cụm policy: tách ra là ba lượt
-- `drop policy`/`create policy` trên đúng những dòng ấy, và một lượt `db:reset`
-- dở dang sẽ để lại trạng thái không ai đọc ra được.
--
-- ── D-144 — vì sao SIẾT, và siết tới đâu ────────────────────────────────────
--
-- Đây là lời giải cho một **mâu thuẫn giữa hai nguồn sự thật**, thuộc đúng loại
-- `AGENTS.md` §3 cấm agent tự chọn: `docs/05-permission-matrix.md` ghi Giáo án =
-- ✅ cho ba vai trò cấp xứ đoàn, còn `docs/03-workflow.md` WF-07 chỉ nêu người
-- làm là **Giáo lý viên đại diện lớp**. Mã nguồn Phase 4 theo `docs/05`. Chủ dự
-- án chốt theo WF-07 (2026-08-04): trách nhiệm giáo án thuộc về đúng một người
-- mỗi lớp.
--
-- 🔴 **Super Admin GIỮ quyền ghi** — chủ dự án xác nhận 2026-08-05. D-144 nêu
-- đích danh ba vai trò và không nhắc Super Admin, còn D-117 đã dựng sẵn khuôn
-- "Super Admin là ngoại lệ duy nhất". Lý do vận hành nặng hơn lý do đối xứng:
-- một lớp **chưa phân công Giáo lý viên đại diện** thì sau D-144 không còn tài
-- khoản nào lập được giáo án cho lớp đó. Không giữ Super Admin nghĩa là tình
-- huống ấy phải sửa bằng tay ở cơ sở dữ liệu.
--
-- ⚠️ Đây là siết quyền với người ĐANG dùng (`11` §6) — Ban điều hành xứ đoàn
-- phải được báo trước, nếu không họ mở giáo án ra, thấy mất nút "Sửa", và kết
-- luận là hệ thống hỏng.
--
-- ── D-145 — vì sao nới, và vì sao KHÔNG sửa `app.can_access_class` ──────────
--
-- Hệ thống mang **hai định nghĩa "thuộc lớp"**: `app.can_access_class` (thẻ đăng
-- nhập + ngành) và `app.is_class_staff` (có thêm sổ phân công đội ngũ). Policy
-- ĐỌC của giáo án dùng cái thứ nhất, còn `app.is_class_representative` — thứ
-- quyết định quyền GHI — dùng cái thứ hai. Hệ quả: có người **ghi được mà không
-- đọc lại được** (tạo giáo án xong, tải lại trang là trắng).
--
-- Phương án B (sửa thẳng `app.can_access_class`) bị loại: hàm ấy đang đỡ policy
-- của 6 module, sửa một chỗ là nới phạm vi đọc của tất cả cùng lúc.
--
-- 🔴 Phạm vi thật của lỗ này HẸP hơn biên bản audit mô tả, và đã kiểm chứng bằng
-- mã nguồn: với Giáo lý viên mang **vai trò lớp**, hai quyển sổ **không thể lệch
-- nhau** — trigger `validate_class_staff_assignment` chặn chiều này,
-- BR-A17 chặn chiều kia. Lỗ còn lại đúng hai ca, đều là chuyện có thật ở xứ đoàn
-- thiếu người: **Trưởng/Phó ngành được xếp đứng lớp thuộc ngành KHÁC**, và
-- **Thủ quỹ đứng lớp**. D-144 làm hai ca ấy nặng thêm, vì sau khi siết thì người
-- ghi được giáo án đúng là "đại diện đội ngũ lớp".
--
-- **Tệp đính kèm đi theo giáo án** — chủ dự án xác nhận 2026-08-05. `docs/05` §6
-- ghi "Class staff xem ĐẦY ĐỦ giáo án", mà tệp là một phần của bài. Nới đọc nội
-- dung nhưng không nới đọc tệp thì đúng nhóm người ấy **nhìn thấy tên tệp và nút
-- "Tải xuống"** rồi bấm vào bị từ chối. Nhánh nới nằm ở `can_read_teaching_material`
-- và dùng **cùng một hàm** `app.is_class_staff` ⇒ không thêm một ai ngoài nhóm
-- D-145 vừa cho đọc.
--
-- ── Nợ #18 — và ở module này hàng rào ĐẶT ĐƯỢC vào policy ───────────────────
--
-- Cùng món nợ đã trả ở M05: năm học `closed`/`archived` vẫn nhận ghi. M05-A phải
-- đặt hàng rào **trong RPC** vì ba bảng điểm danh chỉ ghi được qua
-- `security definer` (definer bỏ qua RLS ⇒ điều kiện trong policy là hàng rào
-- giả). Ở đây thì ngược lại: `authenticated` có `insert`/`update`/`delete`
-- **thẳng trên hai bảng**, mọi đường ghi đi qua policy — nên đúng khuôn một dòng
-- của M02-C (D-118), dùng lại `app.writable_academic_year_ids()` nên **D-117 vẫn
-- đứng**: Super Admin ghi được vào năm đã đóng.
--
-- Bốn điều cài đặt cần nhớ:
--
--   1. Hàng rào phải có ở **cả `using` lẫn `with check`** của UPDATE (ghi chú 2
--      của `20260726000200`): chỉ chặn `with check` thì `update … set title =
--      title` vẫn đi lọt vào một năm đã đóng.
--   2. **DELETE cũng bị chặn.** Xoá là một lượt ghi. `11` §5 đòi thao tác nguy
--      hiểm phải nêu hậu quả, mà xoá một mục của năm đã đóng thì không có lượt
--      hoàn tác nào.
--   3. `using` **lọc dòng trong im lặng**, không ném lỗi — pgTAP tương ứng phải
--      đo **kết quả** (`is(count(*))`), không đo ngoại lệ. Viết `throws_ok` ở đó
--      là một bài xanh giả, vì UPDATE 0 dòng cũng "không ném".
--   4. `teaching_plan_items` **không có cột năm học** — nó suy qua giáo án cha,
--      nên hàng rào nằm trong chính `exists (…)` đã có sẵn ở policy, không phải
--      một điều kiện thứ hai đặt cạnh.
--
-- KHÔNG có `alter table`, KHÔNG backfill, KHÔNG đổi chữ ký hàm nào.
-- ============================================================================

-- ── D-144 ───────────────────────────────────────────────────────────────────
create or replace function app.can_manage_teaching_plan(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    -- D-117: Super Admin là ngoại lệ duy nhất còn lại của nhóm ghi toàn cục.
    app.is_super_admin()
    or app.is_class_representative(target_class_id),
    false
  )
$$;

comment on function app.can_manage_teaching_plan(uuid) is
  'D-144 (2026-08-04): quyền GHI giáo án thu về Giáo lý viên đại diện lớp, theo '
  'docs/03 WF-07. Xứ đoàn trưởng/phó và Thư ký chỉ còn XEM — họ vẫn đọc được qua '
  'app.can_global_read() trong policy select. Super Admin giữ quyền ghi (D-117).';

-- ── D-145 — nới phạm vi ĐỌC ─────────────────────────────────────────────────
drop policy teaching_plans_select_staff_scope on public.teaching_plans;
create policy teaching_plans_select_staff_scope
on public.teaching_plans for select to authenticated
using (app.can_access_class(class_id) or app.is_class_staff(class_id));

drop policy teaching_plan_items_select_staff_scope on public.teaching_plan_items;
create policy teaching_plan_items_select_staff_scope
on public.teaching_plan_items for select to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and (app.can_access_class(plan.class_id) or app.is_class_staff(plan.class_id))
  )
);

comment on policy teaching_plans_select_staff_scope on public.teaching_plans is
  'D-145: "thuộc lớp" tính cả sổ phân công đội ngũ (app.is_class_staff), không chỉ '
  'thẻ đăng nhập — xoá ca "ghi được mà không đọc lại được".';

-- Tệp đính kèm đi theo giáo án: cùng hàm, cùng nhóm người, không thêm ai.
create or replace function app.can_read_teaching_material(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
  path_class_id uuid;
  path_item_id uuid;
begin
  path_parts := string_to_array(object_name, '/');
  if coalesce(array_length(path_parts, 1), 0) <> 3 then return false; end if;
  begin
    path_class_id := path_parts[1]::uuid;
    path_item_id := path_parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  return exists (
    select 1
    from public.teaching_plan_items as item
    join public.teaching_plans as plan on plan.id = item.teaching_plan_id
    where item.id = path_item_id
      and plan.class_id = path_class_id
      and (
        (
          item.material_path = object_name
          -- D-145: cùng phạm vi đọc với policy select của giáo án.
          and (app.can_access_class(plan.class_id) or app.is_class_staff(plan.class_id))
        )
        -- Storage DELETE kiểm SELECT trước. Manager vẫn được thấy object vừa
        -- tách metadata để dọn vật lý; staff chỉ-xem không thấy object mồ côi.
        or app.can_manage_teaching_plan(plan.class_id)
      )
  );
end;
$$;

comment on function app.can_read_teaching_material(text) is
  'Staff-only Storage authorization; guardian/student never receive material access. '
  'D-145: phạm vi đọc bám đúng policy select của teaching_plans (thêm app.is_class_staff).';

-- ── Nợ #18 — hàng rào năm học đã đóng ───────────────────────────────────────
drop policy teaching_plans_insert_manager on public.teaching_plans;
create policy teaching_plans_insert_manager
on public.teaching_plans for insert to authenticated
with check (
  app.can_manage_teaching_plan(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy teaching_plans_update_manager on public.teaching_plans;
create policy teaching_plans_update_manager
on public.teaching_plans for update to authenticated
using (
  app.can_manage_teaching_plan(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
)
with check (
  app.can_manage_teaching_plan(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy teaching_plans_delete_manager on public.teaching_plans;
create policy teaching_plans_delete_manager
on public.teaching_plans for delete to authenticated
using (
  app.can_manage_teaching_plan(class_id)
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

drop policy teaching_plan_items_insert_manager on public.teaching_plan_items;
create policy teaching_plan_items_insert_manager
on public.teaching_plan_items for insert to authenticated
with check (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
      and plan.academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
  )
);

drop policy teaching_plan_items_update_manager on public.teaching_plan_items;
create policy teaching_plan_items_update_manager
on public.teaching_plan_items for update to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
      and plan.academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
  )
)
with check (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
      and plan.academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
  )
);

drop policy teaching_plan_items_delete_manager on public.teaching_plan_items;
create policy teaching_plan_items_delete_manager
on public.teaching_plan_items for delete to authenticated
using (
  exists (
    select 1 from public.teaching_plans as plan
    where plan.id = teaching_plan_id
      and app.can_manage_teaching_plan(plan.class_id)
      and plan.academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
  )
);

comment on policy teaching_plans_insert_manager on public.teaching_plans is
  'D-144 + nợ #18: chỉ Giáo lý viên đại diện (hoặc Super Admin) và chỉ ở năm học '
  'còn ghi được. Super Admin ngoại lệ cả hai vế (D-117).';
comment on policy teaching_plan_items_update_manager on public.teaching_plan_items is
  'D-144 + nợ #18: năm học suy qua giáo án cha vì bảng này không có cột năm học. '
  'Hàng rào nằm ở CẢ using lẫn with check — chỉ chặn with check thì update giữ '
  'nguyên giá trị vẫn đi lọt.';
