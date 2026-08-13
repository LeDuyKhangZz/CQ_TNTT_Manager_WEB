-- ============================================================================
-- M02-C · I7 / TB-F09 · D-73 — ĐÓNG và LƯU TRỮ năm học.
--
-- 5W-F09 (luồng chấm thấp nhất toàn hệ thống, F09 = 21/75): `docs/03` WF-16 mô tả
-- một quy trình chốt sổ cuối năm gồm sáu bước, nhưng hệ thống **chưa cài bước
-- nào**. Năm học chỉ rơi sang `closed` như **tác dụng phụ** của
-- `set_current_academic_year` — tức người phụ trách không bao giờ thấy một màn
-- hình nào nói "năm học này đã chốt sổ", không nhập lý do, không đối chiếu việc
-- còn tồn đọng, và không có dấu thời gian nào ghi lại thời điểm chốt.
--
-- Bốn quyết định của chủ dự án ngày 2026-07-26 mở đường cho migration này:
--
--   · **D-117** — sau khi đóng, **Super Admin còn ghi được tất cả** trong năm đó.
--     Đây là ngoại lệ duy nhất (WF-16 bước 5 và AC-M02-07 đã viết đúng vậy: "khi
--     `super_admin` thực hiện cùng thao tác ⇒ thành công"). Cài ở migration
--     `20260726000200`.
--   · **D-118** — phạm vi khoá ghi đợt này chỉ **ghi danh + lớp**; điểm danh,
--     bảng điểm, chuyển lớp, báo cáo siết sau khi tới lượt module đó. Đúng khuyến
--     nghị `04_TO_BE_FLOWS.md` TB-F09 ("A cho enrollments + classes trước").
--   · **D-119** — đóng năm **KHÔNG** tự chuyển 19 lớp của năm đó sang `closed`.
--     Trạng thái năm học là chốt chặn duy nhất; trạng thái từng lớp là quyết định
--     mục vụ của người phụ trách (cùng nguyên tắc D-115).
--   · **D-120** — `retention_until` **chặn lưu trữ trước hạn** (BR-M02-N07).
--
-- BỐN quyết định cài đặt cần nhớ:
--
--   1. `app.academic_year_open_work()` là NGUỒN SỰ THẬT DUY NHẤT của bảng kiểm
--      tiền điều kiện, và **cả giao diện lẫn RPC đều gọi đúng nó** — cùng khuôn
--      `app.staff_profile_delete_blockers` của M04-B. Nếu trang `/admin` tự đếm
--      bằng truy vấn riêng thì nó đếm DƯỚI RLS của người xem: một buổi điểm danh
--      chưa chốt của lớp mà người xem không được đọc sẽ biến mất khỏi phép đếm, và
--      màn hình sẽ hứa "không còn việc tồn đọng" trước một RPC chắc chắn từ chối.
--
--   2. "Bảng điểm chưa khoá" chỉ đếm lớp **đã có bài đánh giá đang dùng**. Lớp
--      chưa có bài nào thì không phải "bảng điểm chưa khoá" mà là "chưa có bảng
--      điểm" — đếm gộp là mỗi lần chốt sổ đều báo 19 lớp tồn đọng, và một con số
--      luôn khác 0 thì người dùng học cách bỏ qua nó.
--
--   3. GÕ LẠI ĐÚNG MÃ NĂM HỌC được kiểm Ở ĐÂY, không chỉ ở hộp thoại (BR-M02-N08).
--      Hộp thoại là ma sát cho người dùng; chốt chặn là chỗ này.
--
--   4. Đóng **cưỡng bức** bắt buộc có LÝ DO. Không có lý do thì bản ghi
--      `close_reason` rỗng và sáu tháng sau không ai giải thích được vì sao năm học
--      bị chốt trong lúc còn 37 em đang ghi danh mở.
-- ============================================================================

alter table public.academic_years
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles(id) on delete set null,
  add column if not exists close_reason text;

comment on column public.academic_years.closed_at is
  'D-73/I7: thời điểm chốt sổ năm học. NULL với năm chưa từng đóng, và với năm bị '
  'đóng như tác dụng phụ của set_current_academic_year trước migration này.';
comment on column public.academic_years.closed_by is
  'D-73/I7: Super Admin đã chốt sổ. on delete set null — xoá tài khoản không xoá lịch sử (D-101).';
comment on column public.academic_years.close_reason is
  'D-73/I7: lý do, BẮT BUỘC khi đóng cưỡng bức lúc còn việc tồn đọng (BR-M02-N05).';

-- ---------------------------------------------------------------------------
-- Bảng kiểm tiền điều kiện (WF-16 bước 1–3). Ghi chú 1 và 2 ở đầu file.
-- ---------------------------------------------------------------------------
create or replace function app.academic_year_open_work(p_year_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'open_enrollments', (
      select count(*)
      from public.enrollments as enrollment
      where enrollment.academic_year_id = p_year_id
        and enrollment.status in ('active', 'paused')
        and enrollment.ended_on is null
    ),
    'unlocked_gradebooks', (
      select count(distinct class.id)
      from public.classes as class
      left join public.gradebook_locks as lock on lock.class_id = class.id
      where class.academic_year_id = p_year_id
        and coalesce(lock.is_locked, false) = false
        and exists (
          select 1 from public.assessments as assessment
          where assessment.class_id = class.id and assessment.is_active
        )
    ),
    'open_sessions', (
      select count(*)
      from public.attendance_sessions as session
      where session.academic_year_id = p_year_id
        and session.finalized_at is null
    )
  )
$$;

revoke all on function app.academic_year_open_work(uuid) from public, anon;
grant execute on function app.academic_year_open_work(uuid) to authenticated, service_role;

comment on function app.academic_year_open_work(uuid) is
  'WF-16 bước 1-3: việc còn tồn đọng của một năm học (ghi danh mở, bảng điểm chưa '
  'khoá, buổi điểm danh chưa chốt). Nguồn sự thật duy nhất cho cả giao diện lẫn RPC đóng năm.';

-- Vỏ bọc public để `/admin` đọc được qua PostgREST. Bảng kiểm là số liệu quản trị
-- toàn xứ đoàn, không phải thứ cho mọi vai trò xem.
create or replace function public.academic_year_close_checklist(p_year_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.can_global_read() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return app.academic_year_open_work(p_year_id);
end;
$$;

revoke all on function public.academic_year_close_checklist(uuid) from public, anon;
grant execute on function public.academic_year_close_checklist(uuid) to authenticated, service_role;

comment on function public.academic_year_close_checklist(uuid) is
  'I7: bảng kiểm trước khi đóng năm học, cho giao diện /admin. Quyền: app.can_global_read().';

-- ---------------------------------------------------------------------------
-- Đóng năm học. Đường DUY NHẤT để một năm chuyển sang `closed` một cách có chủ ý.
-- ---------------------------------------------------------------------------
create or replace function public.close_academic_year(
  p_year_id uuid,
  p_confirm_code text,
  p_force boolean default false,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year public.academic_years;
  v_work jsonb;
  v_open integer;
  v_reason text;
begin
  -- D-73 — chỉ Super Admin. Đặt TRƯỚC cả việc đọc dòng: người không có quyền đóng
  -- năm học cũng không cần biết năm đó có tồn tại hay không.
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Khoá dòng trước khi đếm: hai người cùng bấm "Đóng năm học", hoặc một người bấm
  -- đóng trong lúc người kia đang ghi danh nốt vài em. Người sau phải thấy trạng
  -- thái sau khi người trước xong, nên bảng kiểm chạy SAU khi khoá.
  select * into v_year from public.academic_years where id = p_year_id for update;
  if v_year.id is null then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Trạng thái đi một chiều: draft → current → closed → archived (WF-16 bước 6).
  -- Đóng một năm nháp là vô nghĩa (nó chưa từng chạy) và đóng lại một năm đã đóng
  -- sẽ ghi đè `closed_at` — xoá mất dấu thời gian chốt sổ thật.
  if v_year.status <> 'current' then
    raise exception 'ACADEMIC_YEAR_NOT_CURRENT: chỉ năm học đang áp dụng mới đóng được'
      using errcode = '23514';
  end if;

  -- Ghi chú 3 — gõ lại đúng mã năm học (BR-M02-N08).
  if btrim(coalesce(p_confirm_code, '')) <> btrim(v_year.code) then
    raise exception 'YEAR_CODE_MISMATCH' using errcode = '22023';
  end if;

  v_work := app.academic_year_open_work(p_year_id);
  v_open := (v_work ->> 'open_enrollments')::integer
          + (v_work ->> 'unlocked_gradebooks')::integer
          + (v_work ->> 'open_sessions')::integer;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  if v_open > 0 and not coalesce(p_force, false) then
    raise exception 'YEAR_HAS_OPEN_WORK: %', v_work::text using errcode = '23514';
  end if;

  -- Ghi chú 4 — đóng cưỡng bức bắt buộc có lý do (BR-M02-N05).
  if v_open > 0 and v_reason is null then
    raise exception 'CLOSE_REASON_REQUIRED: đóng khi còn việc tồn đọng phải ghi lý do'
      using errcode = '23514';
  end if;

  update public.academic_years
  set status = 'closed',
      closed_at = now(),
      closed_by = auth.uid(),
      close_reason = v_reason,
      updated_by = auth.uid()
  where id = p_year_id;

  -- D-119: KHÔNG đụng tới `public.classes`. Trạng thái từng lớp là quyết định mục
  -- vụ của người phụ trách; chốt chặn ghi nằm ở trạng thái NĂM HỌC (migration
  -- 20260726000200).

  return jsonb_build_object(
    'code', v_year.code,
    'name', v_year.name,
    'forced', v_open > 0,
    'open_work', v_work
  );
end;
$$;

revoke all on function public.close_academic_year(uuid, text, boolean, text) from public, anon;
grant execute on function public.close_academic_year(uuid, text, boolean, text) to authenticated, service_role;

comment on function public.close_academic_year(uuid, text, boolean, text) is
  'D-73/I7: chốt sổ năm học đang áp dụng. Super Admin, bắt gõ lại mã năm, bảng kiểm '
  'tiền điều kiện, đóng cưỡng bức phải có lý do. Không đụng trạng thái lớp (D-119).';

-- ---------------------------------------------------------------------------
-- Lưu trữ năm học đã đóng — chỉ sau hạn giữ dữ liệu (D-120 / BR-M02-N07).
-- ---------------------------------------------------------------------------
create or replace function public.archive_academic_year(p_year_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year public.academic_years;
begin
  if not app.is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_year from public.academic_years where id = p_year_id for update;
  if v_year.id is null then
    raise exception 'ACADEMIC_YEAR_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_year.status <> 'closed' then
    raise exception 'ACADEMIC_YEAR_NOT_CLOSED: chỉ năm học đã đóng mới lưu trữ được'
      using errcode = '23514';
  end if;

  -- D-120 — chặn trước hạn. So bằng `current_date` của máy chủ cơ sở dữ liệu, không
  -- nhận ngày từ phía gọi: một tham số ngày là một đường lách hàng rào này.
  if current_date <= v_year.retention_until then
    raise exception 'RETENTION_NOT_REACHED: hạn giữ dữ liệu tới %', v_year.retention_until
      using errcode = '23514';
  end if;

  update public.academic_years
  set status = 'archived', updated_by = auth.uid()
  where id = p_year_id;

  return jsonb_build_object('code', v_year.code, 'name', v_year.name);
end;
$$;

revoke all on function public.archive_academic_year(uuid) from public, anon;
grant execute on function public.archive_academic_year(uuid) to authenticated, service_role;

comment on function public.archive_academic_year(uuid) is
  'D-120/BR-M02-N07: lưu trữ năm học đã đóng, CHỈ sau retention_until. Super Admin. '
  'Một chiều — hệ thống chưa có luồng bỏ lưu trữ.';
