-- ============================================================================
-- IMP-BULK-001 · Cho phép lần nhập đến từ ĐƯỜNG DÁN VĂN BẢN (paste).
--
-- Chủ dự án yêu cầu 2026-08-18: dữ liệu hai năm học nằm trong các sổ Excel của
-- giáo xứ (`NH_2025-2026/`), và danh sách lên lớp 2026-2027 chỉ có TÊN — file
-- gốc không đủ cột để đi qua đường tải file. Dữ liệu đã được trích và gộp sẵn
-- thành các khối văn bản (file `NHAP_LIEU_HANG_LOAT.md`), người nhập dán thẳng
-- vào /imports. Lần nhập kiểu đó cần một `source_format` nói đúng nguồn gốc của
-- nó — ghi 'template' cho một lần dán là nói dối cột dữ liệu.
--
-- Chỉ nới CHECK constraint, không đổi cột, không đổi policy, không backfill.
-- Mọi hàng rào khác của import_batches giữ nguyên: insert vẫn đòi
-- `app.can_global_write()` + năm học nằm trong `app.writable_academic_year_ids()`
-- (migration 20260813000300) — đường dán KHÔNG mở thêm quyền ghi nào.
-- ============================================================================

alter table public.import_batches
  drop constraint import_batches_source_format_check;

alter table public.import_batches
  add constraint import_batches_source_format_check
  check (source_format in ('template', 'syll', 'ds_dau_nam', 'paste'));

comment on column public.import_batches.source_format is
  'Nguồn dữ liệu của lần nhập: file mẫu chuẩn (template), sheet SYLL, sheet '
  'DS_dau_nam, hoặc văn bản dán trực tiếp (paste — IMP-BULK-001).';
