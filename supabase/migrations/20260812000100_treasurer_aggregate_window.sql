-- ============================================================================
-- 2B · M11-B — Báo cáo & Dashboard, đợt 2/3 (cơ sở dữ liệu + phân quyền)
--
-- D-170  Thủ quỹ đọc được SỐ GỘP THEO LỚP, làm bằng một CỬA SỔ HẸP.
--        Trả nốt nửa còn nợ của D-67 — thay đổi phân quyền thứ **2/6** của
--        `11` §6, hướng **NỚI**.
-- D-172  Chốt trùng thì CHO, nhưng phải hỏi lại và **nêu bản đã có** — ngày
--        nào, ai chốt.
--
-- 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng · 0 policy của bảng
-- nghiệp vụ bị sửa. Đúng **một** policy đổi vị từ: quyền ĐỌC bản chốt.
-- ============================================================================

-- ── D-170 · "đọc được số gộp" là một câu hỏi CHƯA TỪNG CÓ TÊN ───────────────
--
-- `03_AUDIT_RESULTS` §4.2 truy tới tận gốc: hệ thống chỉ có **nhị phân**
-- `can_global_read()` hoặc không có gì, nên Thủ quỹ — người mà `docs/05` §4.5
-- ghi rõ được xem *"Dashboard tổng hợp"* và *"Báo cáo tổng hợp"* — rơi vào vế
-- "không có gì". Hậu quả đã ĐO chứ không đoán, trên cơ sở dữ liệu cục bộ ngày
-- 2026-08-12 bằng JWT thật của Thủ quỹ `GLV904`:
--
--     v_dashboard_summary  → student_count 0 · staff_count 0 · class_count 0
--                            · mass_rate null · warned_student_count 0
--     report_attendance_rows → 0 dòng
--     report_results_rows    → 0 dòng
--
-- Tức trang tổng quan **nói sai** (0 thiếu nhi, 0 lớp — không phải "không biết"),
-- còn trang Báo cáo thì Thủ quỹ được mời vào rồi thấy bảng trống hoàn toàn.
--
-- 🔴 **Không nới bằng cách thêm `treasurer` vào `app.can_global_read()`.** Đó là
-- cách ngắn nhất và là cách sai — cùng một lý lẽ đã ghi ở D-129 (M03-C): hàm ấy
-- đứng trong policy của **hàng chục** bảng, nên thêm một cái tên vào đó là mở
-- luôn hồ sơ sức khoẻ, bí tích, ghi chú nội bộ và điểm từng em — đúng danh sách
-- mà `docs/05` §4.5 xếp vào nhóm "Cấm".
--
-- Vì vậy: một cái tên **thứ hai**, hẹp, chỉ dùng cho đúng những chỗ trả về
-- **số gộp theo lớp**.
create function app.can_read_aggregate()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.can_global_read() or app.current_role() = 'treasurer', false)
$$;

comment on function app.can_read_aggregate() is
  'D-67/D-170: ai đọc được SỐ GỘP (theo lớp) dù không đọc được chi tiết từng em. '
  'Rộng hơn app.can_global_read() đúng MỘT cái tên: treasurer. Chỉ dùng cho các '
  'đường trả về số gộp — KHÔNG được thay can_global_read() trong policy bảng nào.';

revoke all on function app.can_read_aggregate() from public, anon;
grant execute on function app.can_read_aggregate() to authenticated, service_role;

-- ── D-170 (1/3) · Bảng báo cáo — cửa sổ hẹp cho Thủ quỹ ─────────────────────
--
-- 🔴 Hai hàm dưới đây **không chép lại một dòng SQL nào** của hai RPC báo cáo;
-- chúng **gọi thẳng** vào đó. Đây là điều kiện sống còn của D-52: bản xem trước,
-- file Excel, file PDF và payload bản chốt phải cùng một nguồn tính. Chép ra một
-- bản thứ hai "cho Thủ quỹ" là dựng sẵn hai con số sẽ lệch nhau vào một ngày
-- không ai nhớ nổi.
--
-- Vì sao gọi được: `report_attendance_rows` là SECURITY INVOKER, mà "invoker"
-- bên trong một hàm SECURITY DEFINER chính là **chủ sở hữu hàm** (`postgres`) —
-- và chủ sở hữu bảng được miễn RLS (không bảng nào của dự án bật
-- `force row level security`). Nên lời gọi bên trong nhìn thấy đủ dòng, còn lời
-- gọi trực tiếp của Thủ quỹ vào chính hàm ấy **vẫn trả 0 dòng như cũ**. pgTAP
-- `051` có bài canh đúng vế thứ hai đó.
--
-- Ba giới hạn, cả ba cố ý:
--   1. **Chỉ Thủ quỹ.** Mọi vai trò khác đã có đường đọc riêng, rộng hơn cửa sổ
--      này; mở thêm ở đây chỉ tạo ra một đường thứ hai để lệch nhau (khuôn
--      `list_students_for_fees`, D-129).
--   2. **Chỉ số gộp theo lớp.** Kiểu trả về là **đúng kiểu** của hai RPC gốc:
--      không có `student_id`, không có tên em, không có điểm từng em, không có
--      ghi chú. `08_ACCEPTANCE_CRITERIA` AC-B13 đòi đúng vế này.
--   3. **Không có nhánh ghi.** `stable`, không `insert/update/delete` ở đâu.
create function public.report_attendance_rows_for_treasurer(
  p_academic_year_id uuid,
  p_from date,
  p_to date
)
returns table (
  class_id uuid,
  class_name text,
  sector_id uuid,
  student_count integer,
  session_count integer,
  mass_present_rate numeric,
  catechism_present_rate numeric,
  mass_absent_count integer,
  catechism_absent_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if app.current_role() is distinct from 'treasurer' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select * from public.report_attendance_rows(p_academic_year_id, p_from, p_to);
end;
$$;

create function public.report_results_rows_for_treasurer(p_academic_year_id uuid)
returns table (
  class_id uuid,
  class_name text,
  sector_id uuid,
  student_count integer,
  class_average numeric,
  below_five_count integer,
  excellent_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if app.current_role() is distinct from 'treasurer' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select * from public.report_results_rows(p_academic_year_id);
end;
$$;

revoke all on function public.report_attendance_rows_for_treasurer(uuid, date, date) from public, anon;
revoke all on function public.report_results_rows_for_treasurer(uuid) from public, anon;
grant execute on function public.report_attendance_rows_for_treasurer(uuid, date, date) to authenticated, service_role;
grant execute on function public.report_results_rows_for_treasurer(uuid) to authenticated, service_role;

comment on function public.report_attendance_rows_for_treasurer(uuid, date, date) is
  'D-170: cửa sổ hẹp cho Thủ quỹ đọc chuyên cần GỘP THEO LỚP. Gọi thẳng '
  'report_attendance_rows nên không có đường tính thứ hai (D-52). Vai trò khác → 42501.';
comment on function public.report_results_rows_for_treasurer(uuid) is
  'D-170: cửa sổ hẹp cho Thủ quỹ đọc kết quả GỘP THEO LỚP (trung bình lớp, số em '
  'dưới 5, số em từ 8) — không có điểm của em nào. Vai trò khác → 42501.';

-- ── D-170 (2/3) · Bốn ô số của trang tổng quan ──────────────────────────────
--
-- 🔴 **Cố ý KHÔNG sửa `v_dashboard_summary`.** Cách rẻ là đổi mệnh đề phạm vi
-- của CTE `classed` (viết hôm qua cho D-169) sang `app.can_read_aggregate()`.
-- Nó sẽ sai theo một kiểu rất khó thấy: bốn con số của view lấy từ **bốn nguồn
-- khác nhau**, ba nguồn kia lọc bằng RLS của bảng gốc nên với Thủ quỹ vẫn là 0,
-- riêng `class_count` lọc bằng **vị từ viết tay trong view** nên sẽ nhảy lên 19.
-- Kết quả: một hàng KPI có 1 số đúng và 3 số sai — **đúng cái bệnh D-169 vừa
-- chữa hôm qua**, chỉ đổi vai người mắc.
--
-- Nên trang tổng quan của Thủ quỹ đi qua một cửa sổ hẹp thứ ba, và bên trong nó
-- `security definer` làm RLS của ba nguồn kia ngừng cắt. `class_count` phải tính
-- lại tại chỗ vì vị từ trong view hỏi **JWT của người gọi**, không hỏi RLS — nên
-- `security definer` không nới nó. Biểu thức tính lại là **đúng biểu thức của
-- nhánh toàn cục** trong view: đếm lớp `active` của năm học ấy.
create function public.dashboard_summary_for_treasurer(p_academic_year_id uuid)
returns table (
  student_count integer,
  staff_count integer,
  class_count integer,
  mass_rate numeric,
  catechism_rate numeric,
  warned_student_count integer,
  last_session_date date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if app.current_role() is distinct from 'treasurer' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select
      summary.student_count,
      summary.staff_count,
      (
        select count(*)::integer
        from public.classes as class
        where class.academic_year_id = p_academic_year_id
          and class.status = 'active'
      ),
      summary.mass_rate,
      summary.catechism_rate,
      summary.warned_student_count,
      summary.last_session_date
    from public.v_dashboard_summary as summary
    where summary.academic_year_id = p_academic_year_id;
end;
$$;

revoke all on function public.dashboard_summary_for_treasurer(uuid) from public, anon;
grant execute on function public.dashboard_summary_for_treasurer(uuid) to authenticated, service_role;

comment on function public.dashboard_summary_for_treasurer(uuid) is
  'D-170: bốn ô số tổng quan cho Thủ quỹ. CHỈ số gộp — không có danh sách em nào, '
  'nên các thẻ "Cần quan tâm"/"Sinh nhật" của trang vẫn rỗng đúng như trước. '
  'Vai trò khác → 42501.';

-- ── D-170 (3/3) · Xem và tải lại bản đã chốt ────────────────────────────────
--
-- Bản chốt chứa **đúng cái bảng** hai cửa sổ trên vừa cho phép xem
-- (`payload_json` = headers + rows gộp theo lớp), nên chặn Thủ quỹ đọc nó là
-- chặn một thứ họ đã xem được ở dạng sống. `docs/05` bảng module ghi ô của họ là
-- *"👁/export giới hạn"* — vế `export` chính là đây.
--
-- 🔴 Chỉ đổi **vế đọc**. `app.can_create_report` không nhúc nhích ⇒ D-19 và D-66
-- vẫn đứng: Thủ quỹ không chốt được ở bất kỳ phạm vi nào, và pgTAP `051` đo lại
-- cả ba nhánh cho họ chứ không tin vào việc "hàm kia không bị sửa".
create or replace function app.can_read_report(p_scope_type text, p_scope_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_scope_type
    when 'global' then coalesce(app.can_read_aggregate(), false)
    when 'sector' then coalesce(app.can_read_aggregate() or app.can_access_sector(p_scope_id), false)
    when 'class' then coalesce(
      app.can_read_aggregate() or app.can_access_class(p_scope_id) or app.is_class_staff(p_scope_id),
      false)
    else false
  end
$$;

comment on function app.can_read_report(text, uuid) is
  'D-66 + D-170: ai XEM/TẢI được báo cáo đã chốt của phạm vi này. Giữ nguyên luật '
  'của app.can_create_report trước 2026-08-11, và từ 2026-08-12 thêm Thủ quỹ '
  '(app.can_read_aggregate). Quyền CHỐT nằm ở app.can_create_report và KHÔNG đổi.';

-- ── D-172 · Bản chốt trùng: cho, nhưng phải nói ra bản đã có ────────────────
--
-- Bản chốt **không sửa và không xoá được** (`grant select, insert` —
-- `20260723000500:262`), nên một cú bấm nhầm để lại một hàng vĩnh viễn. Chủ dự
-- án chốt phương án (b): vẫn cho chốt trùng — điểm danh bổ sung muộn và điểm
-- nhập sót là việc chính đáng, hay xảy ra — nhưng hộp xác nhận phải **nêu bản
-- đã có**: ngày nào, **ai** chốt.
--
-- 🔴 Chữ "ai" là chỗ hàm này phải tồn tại, và nó là **bản sinh đôi của cái bẫy
-- M08-C đã vấp** (`07` §2.4 → D-163). `profiles_select_self_or_global`
-- (`20260724000100:24-29`) chỉ mở cho chính mình hoặc `app.can_global_read()`,
-- tức **sáu** vai trò cấp xứ đoàn — mà hai nhóm chốt báo cáo nhiều nhất, Trưởng
-- ngành và Giáo lý viên đại diện, **không nằm trong sáu**. Nhúng thẳng
-- `profiles(display_name)` vào truy vấn bản chốt sẽ cho họ một ô **null trong
-- im lặng**: hộp xác nhận có mặt trong mã nguồn mà vắng mặt đúng ở người cần nó.
--
-- Cửa sổ này hẹp hơn cả `list_promotion_actor_names`:
--   1. **Trả tối đa MỘT hàng** — bản chốt trùng gần nhất, không phải một danh sách.
--   2. **Chỉ khi người gọi ĐÃ đọc được bản chốt ấy.** Vị từ là lời gọi thẳng
--      `app.can_read_report(...)` — chính vị từ của `report_snapshots_select_scope`,
--      không phải một bản chép tay của nó (bài học D-160: definer bỏ qua policy
--      nên bỏ một vế là mở một đường vòng xuyên qua hàng rào vừa dựng).
--   3. **Hai cột về người: không có gì ngoài `display_name`.** Không `username`
--      (thứ đăng nhập được), không `phone`, không `email`, không trạng thái tài khoản.
--
-- ⚠️ Hàm này **không** là danh bạ: người chưa từng chốt một báo cáo nào mà người
-- gọi đọc được thì không bao giờ xuất hiện.
--
-- `p_scope_id` có `default null` và đứng CUỐI — bài học M11-A mục 9: bộ sinh kiểu
-- của Supabase khai tham số không mặc định thành bắt buộc và **không nhận `null`**,
-- trong khi phạm vi `global` đúng nghĩa là *không có id*.
create function public.find_report_snapshot_duplicate(
  p_report_type text,
  p_scope_type text,
  p_period_start date,
  p_period_end date,
  p_scope_id uuid default null
)
returns table (
  snapshot_id uuid,
  generated_at timestamptz,
  generated_by_name text,
  duplicate_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not coalesce(app.can_read_report(p_scope_type, p_scope_id), false) then
    return;
  end if;
  return query
    select
      snapshot.id,
      snapshot.generated_at,
      actor.display_name,
      -- Đếm TRƯỚC khi cắt: hàm cửa sổ chạy trước `limit`, nên con số này là tổng
      -- số bản trùng chứ không phải 1. Hộp xác nhận nói được "đã có 3 bản".
      (count(*) over ())::integer
    from public.report_snapshots as snapshot
    -- `left join`: một hồ sơ bị xoá không được phép làm biến mất cả lời cảnh báo.
    left join public.profiles as actor on actor.id = snapshot.generated_by
    where snapshot.report_type = p_report_type
      and snapshot.scope_type = p_scope_type
      and snapshot.scope_id is not distinct from p_scope_id
      and snapshot.period_start = p_period_start
      and snapshot.period_end = p_period_end
    order by snapshot.generated_at desc
    limit 1;
end;
$$;

revoke all on function public.find_report_snapshot_duplicate(text, text, date, date, uuid) from public, anon;
grant execute on function public.find_report_snapshot_duplicate(text, text, date, date, uuid)
  to authenticated, service_role;

comment on function public.find_report_snapshot_duplicate(text, text, date, date, uuid) is
  'D-172: bản chốt trùng gần nhất (cùng loại · cùng phạm vi · cùng khoảng ngày) kèm '
  'ngày chốt, TÊN người chốt và tổng số bản trùng. Chỉ trả về khi người gọi vốn đã '
  'đọc được bản chốt ấy (app.can_read_report). KHÔNG nới policy profiles.';

revoke all on all functions in schema app from public, anon;
grant execute on all functions in schema app to authenticated, service_role;
