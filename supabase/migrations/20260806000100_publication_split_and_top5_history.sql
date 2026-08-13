-- ============================================================================
-- M07-C — module Bảng điểm, đợt cuối. **Migration thứ hai của module.**
--
-- ⚠️ Đính chính một câu chữ của đợt trước: `16_PHASE_2B_IMPLEMENTATION_LOG` ghi
-- M07-B là *"đợt duy nhất có migration của module"*. Câu ấy **sai** — `07_IMPLEMENTATION_IMPACT`
-- §1 xếp hạng mục 8 (TB-M07-02) và 10 (TB-M07-06) đều **có migration**, và cả
-- hai nằm ở đợt C theo đúng luật thứ tự §7. Câu **vẫn đúng** là: M07-B là
-- migration duy nhất của cả Giai đoạn 2B **có đụng dữ liệu** — file này
-- **0 dòng dữ liệu bị đụng**.
--
-- Hai việc, và chúng KHÔNG đụng nhau (khác hẳn đợt B):
--
--   1. D-154 / TB-M07-02 — tách "công bố kết quả" khỏi "khóa bảng điểm".
--      Chủ dự án chốt 2026-08-06: khóa rồi vẫn **bật VÀ tắt** được công bố;
--      mọi thay đổi khác vẫn bị chặn tuyệt đối. **0 thay đổi phân quyền.**
--   2. D-155 / TB-M07-06 — vòng đời Top 5: cho **tính lại**, nhưng bản đang có
--      được **lưu vào lịch sử** trước khi bị thay. Chủ dự án chốt phương án B
--      của `04_TO_BE_FLOWS` (tài liệu khuyến nghị A).
--
-- ── 🔴 Quả mìn của việc 1, và nó KHÔNG nằm ở chỗ ai cũng nhìn ────────────────
-- Đường công bố đi qua **ba** lớp kiểm, không phải một:
--
--   (a) policy `assessments_update_grader`  — `not app.is_gradebook_locked(...)`
--   (b) trigger `app.validate_assessment`   — ném `GRADEBOOK_LOCKED`
--   (c) trigger `app.sync_assessment_score_keys` trên **bảng KHÁC**
--
-- (c) là chỗ dễ chết nhất. Đổi `assessments.is_published` làm trigger
-- `assessments_sync_publication` chạy một lệnh UPDATE lên `assessment_scores`
-- để đồng bộ cờ phi chuẩn hoá — và trigger dòng của **bảng đó** cũng ném
-- `GRADEBOOK_LOCKED`. Nới (a) và (b) mà quên (c) thì thao tác công bố sau khi
-- khóa vẫn hỏng, với đúng mã lỗi cũ, ở một bảng người đọc diff không nghĩ tới.
--
-- Nới (c) an toàn được vì trigger ấy **tự suy lại** `assessment_published` từ
-- chính cột điểm (`selected_assessment.is_published and is_active`) ở cuối hàm:
-- một lượt UPDATE chỉ đổi mỗi cờ ấy **không mang theo giá trị nào của người
-- dùng**, nên bỏ kiểm khóa cho đúng hình dạng ấy không mở thêm đường ghi nào.
-- Và `authenticated` chỉ có `select` trên `assessment_scores` (`20260722000400:488`)
-- nên không có đường gọi trực tiếp.
--
-- (a) **giữ nguyên** — đó là điều `04_TO_BE_FLOWS` TB-M07-02 phương án A đòi:
-- `authenticated` vẫn không UPDATE thẳng được khi đã khóa (AC-02-02), đường duy
-- nhất là RPC `security definer` bên dưới.
-- ============================================================================

-- ── 1 · D-154 / BR-M07-29 — "khóa" chặn cấu trúc và điểm, KHÔNG chặn công bố ─
-- Cách nhận ra "chỉ đổi cờ công bố" phải **so cả bản ghi**, không liệt kê tay
-- từng cột: liệt kê tay thì cột nào thêm về sau sẽ **lọt qua ngoại lệ trong im
-- lặng**, và ngoại lệ của một hàng rào bảo mật thì không được phép rộng ra một
-- cách âm thầm. `to_jsonb(new) = to_jsonb(old)` sau khi trừ đúng ba khoá bao
-- luôn mọi cột tương lai.
--
-- Trừ `updated_at`/`updated_by` vì chúng **luôn** đổi: `assessments_set_updated_at`
-- chạy trước `assessments_validate` (thứ tự trigger của Postgres theo tên) nên
-- `new.updated_at` đã là `now()` khi hàm này nhìn thấy nó.
create or replace function app.validate_assessment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
  year_start date;
  year_end date;
  default_weight numeric(5, 2);
  publication_only boolean := false;
begin
  select class.academic_year_id, year.start_date, year.end_date
    into class_year, year_start, year_end
  from public.classes as class
  join public.academic_years as year on year.id = class.academic_year_id
  where class.id = new.class_id;

  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
  end if;
  if new.academic_year_id is null then
    new.academic_year_id := class_year;
  end if;
  if new.academic_year_id <> class_year then
    raise exception 'CLASS_YEAR_MISMATCH' using errcode = '23514';
  end if;
  if new.assessment_date is not null
    and (new.assessment_date < year_start or new.assessment_date > year_end) then
    raise exception 'ASSESSMENT_DATE_OUTSIDE_YEAR' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    publication_only :=
      new.is_published is distinct from old.is_published
      and (to_jsonb(new) - 'is_published' - 'updated_at' - 'updated_by')
        = (to_jsonb(old) - 'is_published' - 'updated_at' - 'updated_by');
  end if;
  if not publication_only and app.is_gradebook_locked(new.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and new.weight is null then
    select setting.default_weight into default_weight
    from public.assessment_type_settings as setting
    where setting.academic_year_id = class_year
      and setting.kind = new.kind
      and setting.is_active;
    if default_weight is null then
      raise exception 'ASSESSMENT_KIND_DISABLED' using errcode = '23514';
    end if;
    new.weight := default_weight;
  end if;
  return new;
end;
$$;

comment on function app.validate_assessment() is
  'BR-M07-29/D-154: bảng điểm đã khóa chặn MỌI thay đổi trừ đúng một hình dạng — '
  'lượt UPDATE chỉ đổi is_published và không đổi một cột nghiệp vụ nào khác.';

-- 🔴 Quả mìn (c). Xem khối đầu file. Trigger này nằm trên `assessment_scores`,
-- không phải `assessments`, nên nó không xuất hiện trong bất kỳ lượt đọc diff
-- nào của người đang xem "công bố cột điểm".
create or replace function app.sync_assessment_score_keys()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  selected_enrollment public.enrollments;
  publication_sync_only boolean := false;
begin
  select * into selected_assessment
  from public.assessments where id = new.assessment_id;
  select * into selected_enrollment
  from public.enrollments where id = new.enrollment_id;

  if selected_assessment.id is null or selected_enrollment.id is null then
    raise exception 'ASSESSMENT_OR_ENROLLMENT_NOT_FOUND' using errcode = '23503';
  end if;
  if selected_assessment.class_id <> selected_enrollment.class_id
    or selected_assessment.academic_year_id <> selected_enrollment.academic_year_id then
    raise exception 'ASSESSMENT_ENROLLMENT_MISMATCH' using errcode = '23514';
  end if;

  -- Lượt đồng bộ cờ công bố do `app.sync_assessment_publication` phát ra: dòng
  -- không mang theo giá trị nào của người dùng, và `assessment_published` bên
  -- dưới được suy lại từ chính cột điểm nên giá trị gửi lên là vô nghĩa.
  if tg_op = 'UPDATE' then
    publication_sync_only :=
      (to_jsonb(new) - 'assessment_published' - 'updated_at')
        = (to_jsonb(old) - 'assessment_published' - 'updated_at');
  end if;
  if not publication_sync_only and app.is_gradebook_locked(selected_assessment.class_id) then
    raise exception 'GRADEBOOK_LOCKED' using errcode = '42501';
  end if;

  if new.score is not null and new.score > selected_assessment.max_score then
    raise exception 'SCORE_EXCEEDS_MAX' using errcode = '23514';
  end if;

  new.class_id := selected_assessment.class_id;
  new.academic_year_id := selected_assessment.academic_year_id;
  new.student_id := selected_enrollment.student_id;
  new.assessment_published := (selected_assessment.is_published and selected_assessment.is_active);
  return new;
end;
$$;

-- Đường công bố duy nhất. `security definer` để đi vòng qua policy (a) — đó là
-- **mục đích**, không phải tác dụng phụ: policy giữ nguyên để AC-02-02 vẫn đúng
-- với mọi lệnh gửi thẳng vào cơ sở dữ liệu.
--
-- 🔴 Ba hàng rào phải chép lại VÀO ĐÂY vì definer bỏ qua RLS — đúng bài học
-- M05-A mà đợt B đã ghi lại:
--   · quyền     `app.can_grade_class`  (KHÔNG đổi ai được công bố — D-154 chỉ
--                đổi *lúc nào* công bố được, nên đợt này 0 thay đổi phân quyền)
--   · nợ #18    năm học đã đóng vẫn không ghi được (D-117 miễn Super Admin)
--   · cột đã ẩn công bố một cột `is_active = false` là vô nghĩa: nó không hiện
--               ở đâu cả (BR-M07-28), nên trả lời thẳng thay vì đổi 1 dòng rồi
--               để người dùng đi tìm xem điểm biến đi đâu.
create function public.set_assessment_published(
  p_assessment_id uuid,
  p_published boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_assessment public.assessments;
  changed_count integer;
begin
  select * into selected_assessment
  from public.assessments where id = p_assessment_id for update;
  if selected_assessment.id is null then
    raise exception 'ASSESSMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_grade_class(selected_assessment.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not (selected_assessment.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  if not selected_assessment.is_active then
    raise exception 'ASSESSMENT_INACTIVE' using errcode = '42501';
  end if;

  -- Bấm hai lần là vô hại, và **không** phải một lượt ghi giả: `where` lọc sẵn
  -- nên hàm trả 0 và tầng ứng dụng đọc được "không có gì đổi". Cùng khuôn
  -- AC-10-02 của `lock_gradebook`.
  update public.assessments
  set is_published = p_published,
      updated_by = auth.uid()
  where id = p_assessment_id
    and is_published is distinct from p_published;
  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

comment on function public.set_assessment_published(uuid, boolean) is
  'TB-M07-02/D-154: bật/tắt công bố một cột điểm, chạy được cả khi bảng điểm đã '
  'khóa. Giữ nguyên quyền (app.can_grade_class), hàng rào năm học và luật cột ẩn.';

revoke all on function public.set_assessment_published(uuid, boolean) from public, anon;
grant execute on function public.set_assessment_published(uuid, boolean) to authenticated, service_role;

-- ── 2 · D-155 / TB-M07-06 — Top 5 tính lại được, và bản cũ KHÔNG mất ─────────
-- Hiện trạng (F16): "Ẩn khỏi portal" rồi bấm công bố lại thì `publish_leaderboard`
-- **xóa sạch** entries cũ và tính lại theo điểm mới nhất. Em đứng hạng 5 hôm
-- trước biến khỏi bảng, **không ai được báo và bản cũ không còn ở đâu**.
--
-- `04_TO_BE_FLOWS` khuyến nghị phương án A (chốt một lần, cấm tính lại). **Chủ
-- dự án chọn phương án B (2026-08-06, D-155):** giữ khả năng tính lại, nhưng
-- mỗi lần thay phải **lưu lại bản đang có**.
--
-- 🔴 Vì sao lưu ra một bảng riêng chứ không thêm cột `snapshot_no` vào
-- `leaderboard_entries`: `07_IMPLEMENTATION_IMPACT` §4 cấm tuyệt đối mọi thay
-- đổi làm nới quyền đọc của cổng phụ huynh. `leaderboard_entries` là **đúng cái
-- bảng cổng phụ huynh đọc**, và hai `unique` của nó (`leaderboard_id, rank` và
-- `leaderboard_id, enrollment_id`) sẽ phải nới ra để chứa nhiều bản — tức phải
-- sửa **cả policy lẫn ràng buộc** của bề mặt nhạy cảm nhất module. Bảng lịch sử
-- đứng riêng thì `leaderboard_entries` **không đổi một chữ**: cổng phụ huynh
-- luôn chỉ thấy bản đang có, và không cần ai chọn hộ nó "hiện bản nào".
--
-- Hình dạng `entries_json` theo đúng tiền lệ `report_snapshots`
-- (`20260723000500:200`): dữ liệu **đông cứng**, không ai truy vấn quan hệ vào
-- nó, chỉ đọc ra để đối chiếu.
create table public.leaderboard_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  leaderboard_id uuid not null references public.leaderboards(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  snapshot_no smallint not null check (snapshot_no >= 1),
  entry_count smallint not null check (entry_count between 1 and 5),
  entries_json jsonb not null,
  published_at timestamptz not null,
  published_by uuid references public.profiles(id) on delete set null,
  superseded_at timestamptz not null default now(),
  superseded_by uuid references public.profiles(id) on delete set null,
  unique (leaderboard_id, snapshot_no)
);

create index leaderboard_snapshots_scope_idx
on public.leaderboard_snapshots (class_id, leaderboard_id, snapshot_no desc);

-- Append-only tuyệt đối, cùng khuôn `account_audit_events` (D-65/M01-A): một
-- bản lịch sử sửa được thì nó không còn là lịch sử. Chặn ở tầng trigger nên
-- luật đứng độc lập với mọi `grant`, kể cả `service_role`.
create function app.leaderboard_snapshot_no_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'LEADERBOARD_SNAPSHOT_APPEND_ONLY' using errcode = '42501';
end;
$$;

create trigger leaderboard_snapshots_no_mutation
before update or delete on public.leaderboard_snapshots
for each row execute function app.leaderboard_snapshot_no_mutation();

alter table public.leaderboard_snapshots enable row level security;

-- 🔴 Chỉ `select`, và chỉ cho nhân sự phạm vi lớp. **Không có nhánh phụ
-- huynh/thiếu nhi** — cố ý: WF-09 nói cổng hiển thị Top 5 **đang** công bố, còn
-- bảng này là bản đã bị thay. Cho cổng đọc là để lộ đúng thứ vừa được gỡ xuống.
-- Ghi là việc của `publish_leaderboard` (`security definer`), không phải của
-- phiên người dùng.
grant select on public.leaderboard_snapshots to authenticated;
grant all on public.leaderboard_snapshots to service_role;

create policy leaderboard_snapshots_select_staff
on public.leaderboard_snapshots for select to authenticated
using (app.can_access_class(class_id) or app.is_class_staff(class_id));

comment on table public.leaderboard_snapshots is
  'D-155/BR-M07-34: mọi bản Top 5 đã công bố rồi bị thay. Append-only, chỉ nhân '
  'sự phạm vi lớp đọc; cổng phụ huynh không có nhánh đọc nào ở đây.';

-- Lưới an toàn cho đường "hiện lại": bật cờ công bố trên một bảng **chưa từng
-- chốt** sẽ cho cổng phụ huynh một bảng Top 5 rỗng. Ràng buộc CHECK sẵn có chỉ
-- đòi `published_at`/`published_by` khác null — mà cả hai đều nhận được từ một
-- lệnh UPDATE thẳng qua Data API.
create or replace function app.validate_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_year uuid;
begin
  select academic_year_id into class_year from public.classes where id = new.class_id;
  if class_year is null then
    raise exception 'CLASS_NOT_FOUND' using errcode = '23503';
  end if;
  new.academic_year_id := class_year;
  if not exists (
    select 1 from public.academic_years
    where id = class_year and top5_enabled
  ) then
    raise exception 'TOP5_DISABLED' using errcode = '42501';
  end if;
  if new.source_type = 'assessment' and not exists (
    select 1 from public.assessments
    where id = new.source_assessment_id and class_id = new.class_id and is_active
  ) then
    raise exception 'LEADERBOARD_ASSESSMENT_MISMATCH' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and old.is_published and (
    new.class_id is distinct from old.class_id
    or new.source_type is distinct from old.source_type
    or new.source_assessment_id is distinct from old.source_assessment_id
    or new.title is distinct from old.title
  ) then
    raise exception 'LEADERBOARD_PUBLISHED' using errcode = '42501';
  end if;
  -- D-155: "hiện lại" chỉ có nghĩa khi có sẵn một bản để hiện.
  if tg_op = 'UPDATE' and new.is_published and not old.is_published and not exists (
    select 1 from public.leaderboard_entries where leaderboard_id = new.id
  ) then
    raise exception 'LEADERBOARD_NOT_SNAPSHOTTED' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- `publish_leaderboard` — thêm đúng một khối: lưu bản đang có trước khi xóa.
-- Mọi thứ khác giữ nguyên từ `20260805000200`, kể cả hàng rào nợ #18.
create or replace function public.publish_leaderboard(
  p_leaderboard_id uuid,
  p_custom_scores jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_leaderboard public.leaderboards;
  inserted_count integer;
  existing_count integer;
  next_snapshot_no smallint;
begin
  select * into selected_leaderboard
  from public.leaderboards where id = p_leaderboard_id for update;
  if selected_leaderboard.id is null then
    raise exception 'LEADERBOARD_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app.can_manage_leaderboard(selected_leaderboard.class_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if selected_leaderboard.is_published then
    raise exception 'LEADERBOARD_ALREADY_PUBLISHED' using errcode = '23505';
  end if;
  -- Nợ #18.
  if not (selected_leaderboard.academic_year_id = any (app.writable_academic_year_ids())) then
    raise exception 'ACADEMIC_YEAR_CLOSED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.academic_years
    where id = selected_leaderboard.academic_year_id and top5_enabled
  ) then
    raise exception 'TOP5_DISABLED' using errcode = '42501';
  end if;

  -- 🔴 D-155 — khối duy nhất được thêm vào hàm này. Đặt **trước** lệnh xóa, và
  -- trong cùng giao dịch: nếu bản mới hỏng ở bất cứ bước nào sau đây thì cả
  -- lượt lưu lịch sử cũng cuộn lại, không để lại một bản "đã bị thay" mà thứ
  -- thay nó không tồn tại.
  select count(*) into existing_count
  from public.leaderboard_entries where leaderboard_id = selected_leaderboard.id;
  if existing_count > 0 then
    select coalesce(max(snapshot_no), 0)::smallint + 1 into next_snapshot_no
    from public.leaderboard_snapshots where leaderboard_id = selected_leaderboard.id;
    insert into public.leaderboard_snapshots (
      leaderboard_id, class_id, academic_year_id, snapshot_no, entry_count,
      entries_json, published_at, published_by, superseded_by
    )
    select selected_leaderboard.id, selected_leaderboard.class_id,
      selected_leaderboard.academic_year_id, next_snapshot_no, count(*)::smallint,
      jsonb_agg(
        jsonb_build_object(
          'rank', entry.rank,
          'enrollmentId', entry.enrollment_id,
          'score', entry.score,
          'saintName', entry.saint_name_snapshot,
          'fullName', entry.full_name_snapshot
        ) order by entry.rank
      ),
      coalesce(selected_leaderboard.published_at, now()),
      selected_leaderboard.published_by,
      auth.uid()
    from public.leaderboard_entries as entry
    where entry.leaderboard_id = selected_leaderboard.id;
  end if;

  delete from public.leaderboard_entries where leaderboard_id = selected_leaderboard.id;
  insert into public.leaderboard_entries (
    leaderboard_id, class_id, academic_year_id, enrollment_id, rank, score,
    saint_name_snapshot, full_name_snapshot, leaderboard_published
  )
  select selected_leaderboard.id, selected_leaderboard.class_id,
    selected_leaderboard.academic_year_id, preview.out_enrollment_id,
    preview.out_rank, preview.out_score, preview.out_saint_name,
    preview.out_full_name, false
  from public.preview_leaderboard(selected_leaderboard.id, p_custom_scores) as preview;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    raise exception 'LEADERBOARD_NO_DATA' using errcode = '23514';
  end if;

  update public.leaderboards
  set is_published = true,
      published_at = now(),
      published_by = auth.uid(),
      updated_by = auth.uid()
  where id = selected_leaderboard.id;
  return inserted_count;
end;
$$;

comment on function public.publish_leaderboard(uuid, jsonb) is
  'WF-09 + D-155: chốt snapshot Top 5. Bản đang có (nếu có) được lưu vào '
  'public.leaderboard_snapshots trong cùng giao dịch trước khi bị thay.';

-- BR-M07-35 — chỉ bảng **chưa từng công bố** mới xóa được.
--
-- 🔴 Điều kiện cũ `not is_published` là **sai chỗ**, và nó sai theo đúng hình
-- dạng F04 mà đợt B vừa chữa: sau một lượt "Ẩn khỏi cổng" thì `is_published`
-- về `false`, policy cho qua, rồi khoá ngoại `on delete restrict` của
-- `leaderboard_entries` **trả lời hộ** bằng một mã lỗi `23503` mà bộ dịch lỗi
-- biến thành *"Không tìm thấy dữ liệu liên quan"* — một câu sai hẳn nghĩa.
-- `published_at` không bao giờ bị xóa đi, nên nó là phép thử đúng cho
-- "đã từng công bố".
drop policy leaderboards_delete_manager on public.leaderboards;
create policy leaderboards_delete_manager
on public.leaderboards for delete to authenticated
using (
  app.can_manage_leaderboard(class_id)
  and not is_published
  and published_at is null
  and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])
);

comment on policy leaderboards_delete_manager on public.leaderboards is
  'BR-M07-35/D-155: chỉ xóa được bản nháp CHƯA TỪNG công bố (published_at is null), '
  'trong năm học còn ghi được.';

-- Hai hàm mới của schema `app` cần dòng này; cùng khuôn các migration trước.
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;
