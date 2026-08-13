-- M02-A · I3 — Danh mục tham chiếu bất biến đi THEO MIGRATION, không còn treo vào seed.sql.
--
-- 5W-F11: `supabase db push` KHÔNG chạy `supabase/seed.sql`. Ở máy lập trình,
-- `db reset` có chạy seed nên lỗi bị che kín; lên một project Supabase mới thì
-- `sectors`/`grade_levels`/`class_templates` rỗng, và hậu quả nổ ra ở nơi rất xa
-- nguyên nhân: bấm "Sinh lớp mặc định" tạo 0 lớp mà vẫn báo thành công (5W-F02,
-- sự cố production đã ghi ở `WORKLOG.md`). Đây là dữ liệu **quyết định nghiệp vụ
-- đã chốt** (5 ngành · 13 cấp · 19 mẫu lớp — D-9/D-10), không phải dữ liệu demo,
-- nên chỗ đúng của nó là schema chứ không phải seed. AC-M02-12.
--
-- Sao chép NGUYÊN VĂN `supabase/seed.sql:5-60`, giữ **đúng UUID cố định** để hai
-- môi trường không lệch khoá ngoại. `seed.sql` giữ nguyên: nó cũng
-- `on conflict do nothing` nên sau migration này nó chỉ còn là một lượt chạy rỗng.

insert into public.sectors (id, code, name, short_name, sort_order, allows_sections) values
  ('10000000-0000-0000-0000-000000000001', 'CHIEN_CON', 'Chiên Con', 'Chiên', 1, false),
  ('10000000-0000-0000-0000-000000000002', 'AU_NHI', 'Ấu Nhi', 'Ấu', 2, true),
  ('10000000-0000-0000-0000-000000000003', 'THIEU_NHI', 'Thiếu Nhi', 'Thiếu', 3, true),
  ('10000000-0000-0000-0000-000000000004', 'NGHIA_SI', 'Nghĩa Sĩ', 'Nghĩa', 4, false),
  ('10000000-0000-0000-0000-000000000005', 'HIEP_SI', 'Hiệp Sĩ', 'Hiệp', 5, false)
on conflict (id) do nothing;

insert into public.grade_levels (
  id, sector_id, level_number, display_name, is_sector_final_level,
  requires_sacrament_review, can_propose_trainee, allows_sections, sort_order
) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Chiên Con 1', false, false, false, false, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Chiên Con 2', true,  true,  false, false, 2),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 1, 'Ấu 1', false, false, false, true, 3),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 2, 'Ấu 2', false, false, false, true, 4),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 3, 'Ấu 3', true,  true,  false, true, 5),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 1, 'Thiếu 1', false, false, false, true, 6),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 2, 'Thiếu 2', false, false, false, true, 7),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 3, 'Thiếu 3', true,  true,  false, false, 8),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 1, 'Nghĩa 1', false, false, false, false, 9),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 2, 'Nghĩa 2', false, false, false, false, 10),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 3, 'Nghĩa 3', true,  true,  false, false, 11),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 1, 'Hiệp 1', false, false, false, false, 12),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 2, 'Hiệp 2', true,  true,  true,  false, 13)
on conflict (id) do nothing;

-- Nối chuỗi thăng cấp. `is distinct from` để lượt chạy thứ hai không ghi lại gì.
update public.grade_levels as grade set next_grade_level_id = next_grade.id
from public.grade_levels as next_grade
where grade.sort_order + 1 = next_grade.sort_order
  and grade.sort_order < 13
  and grade.next_grade_level_id is distinct from next_grade.id;

-- 19 lớp mặc định (D-9/D-10): 18 lớp giáo lý + 1 lớp Dự trưởng HK1.
-- Không khai `id`: bảng này không được bảng nào tham chiếu bằng khoá ngoại, và
-- `display_name`/`sort_order`/`(grade_level_id, section_code)` đều là unique nên
-- `on conflict do nothing` đủ để chạy lại vô hại.
insert into public.class_templates (grade_level_id, section_code, display_name, class_kind, term_scope, sort_order) values
  ('20000000-0000-0000-0000-000000000001', null, 'Chiên Con 1', 'catechism', 'full_year', 1),
  ('20000000-0000-0000-0000-000000000002', null, 'Chiên Con 2', 'catechism', 'full_year', 2),
  ('20000000-0000-0000-0000-000000000004', 'A', 'Ấu 1A', 'catechism', 'full_year', 3),
  ('20000000-0000-0000-0000-000000000004', 'B', 'Ấu 1B', 'catechism', 'full_year', 4),
  ('20000000-0000-0000-0000-000000000005', 'A', 'Ấu 2A', 'catechism', 'full_year', 5),
  ('20000000-0000-0000-0000-000000000005', 'B', 'Ấu 2B', 'catechism', 'full_year', 6),
  ('20000000-0000-0000-0000-000000000006', 'A', 'Ấu 3A', 'catechism', 'full_year', 7),
  ('20000000-0000-0000-0000-000000000006', 'B', 'Ấu 3B', 'catechism', 'full_year', 8),
  ('20000000-0000-0000-0000-000000000007', 'A', 'Thiếu 1A', 'catechism', 'full_year', 9),
  ('20000000-0000-0000-0000-000000000007', 'B', 'Thiếu 1B', 'catechism', 'full_year', 10),
  ('20000000-0000-0000-0000-000000000008', 'A', 'Thiếu 2A', 'catechism', 'full_year', 11),
  ('20000000-0000-0000-0000-000000000008', 'B', 'Thiếu 2B', 'catechism', 'full_year', 12),
  ('20000000-0000-0000-0000-000000000009', null, 'Thiếu 3', 'catechism', 'full_year', 13),
  ('20000000-0000-0000-0000-000000000010', null, 'Nghĩa 1', 'catechism', 'full_year', 14),
  ('20000000-0000-0000-0000-000000000011', null, 'Nghĩa 2', 'catechism', 'full_year', 15),
  ('20000000-0000-0000-0000-000000000012', null, 'Nghĩa 3', 'catechism', 'full_year', 16),
  ('20000000-0000-0000-0000-000000000013', null, 'Hiệp 1', 'catechism', 'full_year', 17),
  ('20000000-0000-0000-0000-000000000014', null, 'Hiệp 2', 'catechism', 'full_year', 18),
  (null, null, 'Dự trưởng', 'trainee', 'semester_1', 19)
on conflict do nothing;
