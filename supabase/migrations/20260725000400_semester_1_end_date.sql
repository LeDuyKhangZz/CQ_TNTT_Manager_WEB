-- M02-B · D-71 — Mốc kết thúc học kỳ 1 của năm học.
--
-- Vì sao cần: lớp Dự trưởng được sinh với `term_scope = 'semester_1'` từ
-- `20260716000300_canonical_19_classes.sql`, và `docs/03-workflow.md` §30 nói lớp
-- này "chỉ hoạt động trong học kỳ 1" (D-9). Nhưng hệ thống **không có mốc ngày nào
-- để so**, nên cái cờ đó là **dữ liệu chết**: không màn hình nào, không truy vấn
-- nào, không luật nào dùng được nó. D-71 chốt thêm trường ngày này để câu nghiệp
-- vụ kia trở thành thứ kiểm được.
--
-- Hai quyết định của chủ dự án ngày 2026-07-25 định hình cột này:
--
--   · **D-115** — qua mốc thì hệ thống **chỉ cảnh báo**, KHÔNG tự đóng lớp Dự
--     trưởng. Vì vậy đây thuần là một mốc dữ liệu: không trigger, không tác vụ
--     nền, không policy nào đọc nó. Việc đóng lớp là quyết định mục vụ của người
--     phụ trách (`docs/03` §1), làm bằng màn hình "Cài đặt lớp" của I6.
--   · **D-116** — **không bắt buộc**. Cột `null` được, và `null` nghĩa là "chưa
--     khai báo" ⇒ không hiện cảnh báo nào. Nếu bắt buộc thì năm học đang chạy
--     (`2026-2027`, đã tồn tại trước migration này) sẽ không có cách nào hợp lệ
--     hoá được, và mọi bản ghi cũ thành dữ liệu sai.
--
-- Cột nullable, không mặc định ⇒ không có downtime, không đụng một dòng dữ liệu nào.

alter table public.academic_years
  add column semester_1_end_date date;

-- D-71 nói rõ: "ràng buộc phải nằm giữa ngày bắt đầu và ngày kết thúc năm học".
-- Chặn hai kiểu gõ sai nguy hiểm: mốc trước khai giảng (mọi lớp Dự trưởng cảnh báo
-- ngay từ buổi đầu) và mốc sau bế giảng (cảnh báo không bao giờ xuất hiện).
-- Nghiêm ngặt hai đầu: mốc trùng ngày bắt đầu hoặc ngày kết thúc thì học kỳ 1 dài
-- 0 ngày hoặc bằng cả năm — cả hai đều vô nghĩa.
alter table public.academic_years
  add constraint academic_years_semester_1_range
  check (
    semester_1_end_date is null
    or (semester_1_end_date > start_date and semester_1_end_date < end_date)
  );

comment on column public.academic_years.semester_1_end_date is
  'Ngày kết thúc học tại giáo xứ = mốc kết thúc học kỳ 1 (D-71). NULL = chưa khai báo, hệ thống không cảnh báo gì. Qua mốc chỉ cảnh báo, không tự đóng lớp Dự trưởng (D-115).';
