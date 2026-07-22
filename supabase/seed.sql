-- supabase/seed.sql
-- Dữ liệu tham chiếu/seed dùng CHUNG cho mọi môi trường (kể cả production sau này).
-- Không đưa mật khẩu/dữ liệu demo production vào đây.

insert into public.sectors (id, code, name, short_name, sort_order, allows_sections) values
  ('10000000-0000-0000-0000-000000000001', 'CHIEN_CON', 'Chiên Con', 'Chiên', 1, false),
  ('10000000-0000-0000-0000-000000000002', 'AU_NHI', 'Ấu Nhi', 'Ấu', 2, true),
  ('10000000-0000-0000-0000-000000000003', 'THIEU_NHI', 'Thiếu Nhi', 'Thiếu', 3, true),
  ('10000000-0000-0000-0000-000000000004', 'NGHIA_SI', 'Nghĩa Sĩ', 'Nghĩa', 4, false),
  ('10000000-0000-0000-0000-000000000005', 'HIEP_SI', 'Hiệp Sĩ', 'Hiệp', 5, false)
on conflict (id) do nothing;

-- 13 cấp giáo lý (D-9): Chiên Con chỉ 1..2; Thiếu 3 tồn tại nhưng không chia A/B.
-- allows_sections đặt theo từng cấp: chỉ Ấu 1..3 và Thiếu 1..2 mới có A/B.
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

update public.grade_levels as grade set next_grade_level_id = next_grade.id
from public.grade_levels as next_grade
where grade.sort_order + 1 = next_grade.sort_order
  and grade.sort_order < 13;

-- 19 lớp mặc định (D-9/D-10): 18 lớp giáo lý + 1 lớp Dự trưởng HK1.
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

-- 6 Ban mặc định (D-47, docs/01 §10). Có thể thêm Ban qua UI quản trị.
-- Chỉ Ban Kỹ thuật giữ kho thiết bị (docs/02 §11.6).
insert into public.committees (id, code, name, description, manages_equipment, sort_order) values
  ('30000000-0000-0000-0000-000000000001', 'SINH_HOAT', 'Ban Sinh hoạt', 'Tổ chức sinh hoạt, trò chơi, băng reo.', false, 1),
  ('30000000-0000-0000-0000-000000000002', 'KY_THUAT', 'Ban Kỹ thuật', 'Âm thanh, ánh sáng, thiết bị và kho mượn/trả.', true, 2),
  ('30000000-0000-0000-0000-000000000003', 'PHUNG_VU', 'Ban Phụng vụ', 'Chuẩn bị Thánh lễ và các giờ kinh.', false, 3),
  ('30000000-0000-0000-0000-000000000004', 'TRUYEN_THONG', 'Ban Truyền thông', 'Hình ảnh, bài viết, truyền thông xứ đoàn.', false, 4),
  ('30000000-0000-0000-0000-000000000005', 'QUAN_LY', 'Ban Quản lý', 'Hồ sơ, hậu cần và điều phối chung.', false, 5),
  ('30000000-0000-0000-0000-000000000006', 'Y_TE', 'Ban Y tế', 'Sơ cấp cứu và chăm sóc sức khỏe khi sinh hoạt.', false, 6)
on conflict (id) do nothing;
