-- ============================================================================
-- STAFF-COMP-001 · "Thành phần" của nhân sự, và mã riêng `TT` cho Ban Trợ tá
--
-- Chủ dự án nêu vấn đề ngày 2026-08-19, khi đang dán khối §4.3 của
-- `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md` (16 người Ban Trợ tá):
--
--   "họ là trợ tá, không phải giáo lý viên. họ thường là phụ huynh của một hoặc
--    nhiều em thiếu nhi trong giáo xứ, họ hỗ trợ, làm đồ ăn sáng cho thiếu nhi,
--    không liên quan gì đến việc dạy học như GLV — sao vai trò lại nhập là GLV
--    lớp được, hay mã sao có thể giống mọi người là GLVxxx"
--
-- Hai chỗ hỏng, và cả hai đều thật:
--
-- 1. **Bảng `staff_profiles` không có chỗ nào ghi "người này là gì".** Sổ Excel
--    của xứ đoàn có cột `Thành phần` (Huynh trưởng · Dự trưởng · Nữ tu · Chủng
--    sinh · Linh mục · Trợ tá) và `staff/bulk/parse.ts` VẪN ĐANG đọc cột ấy vào
--    `NormalizedStaffRow.component` — rồi vứt đi, vì không có cột nào để ghi.
--    Hệ quả: mở danh sách Nhân sự thì Ban Trợ tá nằm lẫn giữa huynh trưởng, dấu
--    hiệu duy nhất để nhận ra là cột lớp trống — mà "chưa phân công lớp" thì
--    huynh trưởng mới cũng thế.
--
-- 2. **Mã hồ sơ khoá cứng tiền tố `GLV`.** `staff_code` sinh từ
--    `('GLV' || lpad(nextval('staff_code_seq'), 3, '0'))` và bị
--    `staff_profiles_code_format check (staff_code ~* '^GLV[0-9]{3,}$')` chốt
--    lại. Không có đường nào cấp `TT001` mà không sửa migration. Với xứ đoàn,
--    một người không dạy học mà mang mã `GLV093` là nói sai về họ.
--
-- Cách chữa: một enum `staff_component` + một cột `component`, và **tiền tố mã
-- suy ra từ chính cột ấy** bằng trigger BEFORE INSERT thay cho DEFAULT.
--
-- 🔴 **Mã cấp một lần, không đổi theo `component`.** Sửa thành phần của một hồ
-- sơ đã có KHÔNG đánh lại mã: mã là định danh, và với nhân sự nó còn là **tên
-- đăng nhập**. Đổi mã của người đang dùng là khoá họ khỏi hệ thống. Người xếp
-- nhầm nhóm thì sửa `component` cho đúng và **giữ mã cũ**.
--
-- Data impact — có backfill, và cố ý chỉ backfill chỗ SUY RA ĐƯỢC TỪ DỮ LIỆU:
--   · `title = 'so'`   ⇒ `nu_tu`      (danh xưng Sơ đã là câu trả lời)
--   · `title = 'cha'`  ⇒ `linh_muc`
--   · `title = 'thay'` ⇒ `chung_sinh`
--   · có phân công đang hoạt động với `capacity = 'trainee'` ⇒ `du_truong`
--   · còn lại ⇒ `khac` ("Chưa phân loại") — **không đoán** ai là huynh trưởng,
--     vì đoán sai là ghi sai về một người thật vào đúng cột sinh ra để nói đúng
--     về họ. Quản trị viên sửa lại ở trang hồ sơ, hoặc dán lại khối §4.1 (lượt
--     dán sau NÂNG CẤP `khac` lên giá trị thật, xem `staff/bulk/server/actions.ts`).
-- Mọi mã `GLVxxx` đang có **giữ nguyên**; không hồ sơ nào bị đánh lại mã.
-- Rollback: xoá trigger + cột + enum + sequence, dựng lại DEFAULT và CHECK cũ —
-- chỉ chạy được khi chưa có hồ sơ `TT` nào.
-- ============================================================================

-- ── 1. Thành phần ───────────────────────────────────────────────────────────
-- Enum chứ không phải text tự do: cột này để LỌC và ĐỌC LƯỚT trên danh sách,
-- mà cột `Thành phần` trong sổ Excel là văn bản người ta gõ tay ("Huynh trưởng/
-- Phó ngành Ấu", "Sổ DỰ TRƯỞNG 1"…). Giữ nguyên văn thì mỗi người một nhãn và
-- không nhóm được. Việc quy văn bản gốc về một trong bảy giá trị này là của
-- `parseStaffComponent` ở tầng ứng dụng.

create type public.staff_component as enum (
  'huynh_truong',
  'du_truong',
  'nu_tu',
  'chung_sinh',
  'linh_muc',
  'tro_ta',
  'khac'
);

alter table public.staff_profiles
  add column component public.staff_component not null default 'khac';

comment on column public.staff_profiles.component is
  'STAFF-COMP-001: người này là gì trong xứ đoàn (Huynh trưởng · Dự trưởng · Nữ tu · Chủng sinh · Linh mục · Trợ tá). KHÔNG phải quyền: quyền nằm ở role_assignments, tư cách trong lớp nằm ở class_staff_assignments.capacity. `tro_ta` là người hỗ trợ hậu cần, không dạy học, và là giá trị duy nhất đổi tiền tố mã hồ sơ.';

create index staff_profiles_component_idx on public.staff_profiles (component);

-- Backfill: chỉ những gì dữ liệu đang có tự nói ra.
update public.staff_profiles set component = 'nu_tu'      where title = 'so';
update public.staff_profiles set component = 'linh_muc'   where title = 'cha';
update public.staff_profiles set component = 'chung_sinh' where title = 'thay';
update public.staff_profiles s set component = 'du_truong'
where s.component = 'khac'
  and exists (
    select 1 from public.class_staff_assignments a
    where a.staff_profile_id = s.id and a.is_active and a.capacity = 'trainee'
  );

-- ── 2. Mã hồ sơ: `GLV` cho nhân sự dạy học, `TT` cho Trợ tá ─────────────────
-- Chuỗi số RIÊNG cho Trợ tá. Dùng chung `staff_code_seq` thì mã Trợ tá sẽ nhảy
-- cóc theo số huynh trưởng được tạo xen giữa (TT001 rồi TT047), đọc như thể
-- thiếu mất 45 người.

create sequence public.assistant_code_seq start with 1 increment by 1 no cycle;
revoke all on sequence public.assistant_code_seq from public, anon;
grant usage, select on sequence public.assistant_code_seq to authenticated, service_role;

comment on sequence public.assistant_code_seq is
  'STAFF-COMP-001: chuỗi số cho mã TTxxx của Ban Trợ tá, tách khỏi staff_code_seq để hai dãy mã không đục lỗ của nhau.';

-- DEFAULT phải bỏ: nó chạy TRƯỚC trigger và luôn cho ra `GLV`, nên còn DEFAULT
-- thì trigger không bao giờ thấy NULL để mà quyết định.
alter table public.staff_profiles alter column staff_code drop default;

create function app.assign_staff_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Chỉ điền khi người gọi không tự đặt mã. `scripts/seed-dev.mjs` đặt tay để
  -- không đụng sequence mà pgTAP cũng đang tiêu thụ — nhánh này giữ nguyên
  -- đường đó chạy được.
  if new.staff_code is null then
    if new.component = 'tro_ta' then
      new.staff_code := 'TT' || lpad(nextval('public.assistant_code_seq')::text, 3, '0');
    else
      new.staff_code := 'GLV' || lpad(nextval('public.staff_code_seq')::text, 3, '0');
    end if;
  end if;
  return new;
end;
$$;

revoke all on function app.assign_staff_code() from public, anon, authenticated;
grant execute on function app.assign_staff_code() to service_role;

create trigger staff_profiles_assign_code
before insert on public.staff_profiles
for each row execute function app.assign_staff_code();

comment on function app.assign_staff_code() is
  'STAFF-COMP-001: cấp mã hồ sơ theo `component` — TTxxx cho Trợ tá, GLVxxx cho phần còn lại. Chỉ chạy khi staff_code chưa được đặt tay. KHÔNG có trigger UPDATE tương ứng: đổi thành phần không đánh lại mã, vì mã nhân sự cũng là tên đăng nhập.';

-- CHECK: nới đúng một tiền tố, không nới thành "chữ gì cũng được". Dạng mã là
-- thứ `deriveLoginAlias` dựa vào để biết một tên đăng nhập là nhân sự hay là
-- tài khoản thường; mở rộng bừa ở đây là làm nhoè ranh giới đó.
alter table public.staff_profiles drop constraint if exists staff_profiles_code_format;
alter table public.staff_profiles
  add constraint staff_profiles_code_format
  check (staff_code::text ~* '^(GLV|TT)[0-9]{3,}$');

comment on column public.staff_profiles.staff_code is
  'STAFF-COMP-001: GLVxxx cho nhân sự dạy học, TTxxx cho Ban Trợ tá. Sinh bởi trigger staff_profiles_assign_code theo `component` lúc INSERT, và KHÔNG đổi về sau — mã này cũng là tên đăng nhập của nhân sự.';
