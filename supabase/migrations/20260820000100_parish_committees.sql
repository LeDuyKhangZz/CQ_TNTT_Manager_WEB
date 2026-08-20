-- ============================================================================
-- BDH-2025-001 · Sáu Ban THẬT của xứ đoàn, đi theo migration thay vì seed.sql
--
-- Chủ dự án phát hiện 2026-08-20 khi đối chiếu `NH_2025-2026/DS BAN ĐIỀU HÀNH.xlsx`:
-- sổ có **6 Trưởng Ban**, mà `select count(*) from public.committees` trên
-- production trả **0**. Không gắn được ai làm Trưởng ban.
--
-- Hai chỗ hỏng, cùng một gốc:
--
-- 1. **6 Ban chỉ nằm trong `supabase/seed.sql`.** `supabase db push` KHÔNG chạy
--    seed — đúng cái bẫy mà `20260725000100_reference_catalog.sql` đã gặp một
--    lần với `sectors`/`grade_levels`/`class_templates` và đã ghi thành 5W-F11.
--    Ở máy lập trình `db reset` có chạy seed nên lỗi bị che kín suốt; lên
--    production thì bảng rỗng, và hậu quả nổ ra ở nơi rất xa nguyên nhân (mở
--    `/committees` thấy danh sách trắng, không có câu lỗi nào).
--
-- 2. **Danh sách Ban trong seed KHÔNG phải danh sách Ban của xứ đoàn.** Seed có
--    `QUAN_LY` ("Ban Quản lý") — một cái tên không có trong bất kỳ sổ nào của
--    xứ đoàn — và THIẾU **Ban Trực**, ban có thật, do chị Maria Trương Ngọc Kim
--    Thanh làm Trưởng ban theo sổ 2025-2026.
--
-- Chỗ đúng của dữ liệu này là migration, không phải seed: 6 Ban là **quyết định
-- nghiệp vụ đã chốt** (D-47, `docs/01` §10), không phải dữ liệu demo. Cùng lý do
-- và cùng khuôn với `20260725000100`.
--
-- Thứ tự `sort_order` lấy theo đúng sổ `DS BAN ĐIỀU HÀNH.xlsx` (Phụng vụ · Sinh
-- hoạt · Kỹ thuật · Trực · Truyền thông · Y tế), không theo thứ tự cũ của seed.
--
-- 🔴 `manages_equipment` chỉ bật cho **Ban Kỹ thuật** (`docs/02` §11.6). Cờ này
-- chứ không phải `code` là thứ P6-T3 dùng để chặn `equipment_items` gắn nhầm Ban
-- — đổi tên Ban không được làm mất kho.
--
-- Data impact: production **chèn 6 dòng vào một bảng đang rỗng**, 0 dòng bị sửa.
-- Ở máy lập trình (đã có 6 Ban của seed) thì 5 dòng được cập nhật tên/mô tả/thứ
-- tự cho khớp, `TRUC` được chèn mới, và `QUAN_LY` bị xoá **có điều kiện** — chỉ
-- xoá khi chưa có gì móc vào nó. `committees` bị 9 khoá ngoại `on delete restrict`
-- trỏ tới, nên nếu ai đó đã dùng Ban Quản lý thì lệnh xoá dưới đây tự bỏ qua và
-- Ban ấy ở lại (vô hại, `is_active` được hạ xuống false để nó không hiện ra nữa).
-- Rollback: xoá 6 dòng này khi chưa có membership/thiết bị nào.
-- ============================================================================

insert into public.committees (id, code, name, description, manages_equipment, sort_order) values
  ('30000000-0000-0000-0000-000000000003', 'PHUNG_VU',     'Ban Phụng vụ',     'Chuẩn bị Thánh lễ và các giờ kinh.',                false, 1),
  ('30000000-0000-0000-0000-000000000001', 'SINH_HOAT',    'Ban Sinh hoạt',    'Tổ chức sinh hoạt, trò chơi, băng reo.',            false, 2),
  ('30000000-0000-0000-0000-000000000002', 'KY_THUAT',     'Ban Kỹ thuật',     'Âm thanh, ánh sáng, thiết bị và kho mượn/trả.',     true,  3),
  ('30000000-0000-0000-0000-000000000007', 'TRUC',         'Ban Trực',         'Trực giờ sinh hoạt, giữ trật tự và điểm danh cổng.', false, 4),
  ('30000000-0000-0000-0000-000000000004', 'TRUYEN_THONG', 'Ban Truyền thông', 'Hình ảnh, bài viết, truyền thông xứ đoàn.',         false, 5),
  ('30000000-0000-0000-0000-000000000006', 'Y_TE',         'Ban Y tế',         'Sơ cấp cứu và chăm sóc sức khỏe khi sinh hoạt.',    false, 6)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  manages_equipment = excluded.manages_equipment,
  sort_order = excluded.sort_order,
  is_active = true;

-- Ban Quản lý — chỉ tồn tại ở máy lập trình, do seed cũ. Hạ cờ trước (luôn chạy
-- được), rồi xoá hẳn nếu chưa có gì móc vào. Hai bước chứ không một: `delete`
-- gặp khoá ngoại `restrict` sẽ NÉM lỗi và làm hỏng cả migration, nên phải tự
-- kiểm trước thay vì để cơ sở dữ liệu trả lời hộ.
update public.committees set is_active = false where code = 'QUAN_LY';

delete from public.committees as retired
where retired.code = 'QUAN_LY'
  and not exists (select 1 from public.committee_memberships   where committee_id = retired.id)
  and not exists (select 1 from public.committee_announcements where committee_id = retired.id)
  and not exists (select 1 from public.committee_meetings      where committee_id = retired.id)
  and not exists (select 1 from public.committee_weekly_plans  where committee_id = retired.id)
  and not exists (select 1 from public.equipment_items         where committee_id = retired.id)
  and not exists (select 1 from public.equipment_loans         where committee_id = retired.id)
  and not exists (select 1 from public.equipment_loan_events   where committee_id = retired.id)
  and not exists (select 1 from public.equipment_stock_adjustments where committee_id = retired.id)
  and not exists (select 1 from public.notifications           where target_committee_id = retired.id);

comment on table public.committees is
  'BDH-2025-001: 6 Ban của xứ đoàn Chợ Quán theo DS BAN ĐIỀU HÀNH 2025-2026 — Phụng vụ · Sinh hoạt · Kỹ thuật · Trực · Truyền thông · Y tế. Dữ liệu tham chiếu đi theo migration (không phải seed.sql, vì db push không chạy seed). Chức vụ Ban KHÔNG phải vai trò đăng nhập (D-15): Trưởng ban vẫn giữ nguyên vai trò Giáo lý viên của mình.';
