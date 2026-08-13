-- M12-A — TO-BE 3 / BR-M12-34 · BR-M12-35 / AC-16 · AC-17 / D-131 · D-132.
--
-- 🔴 Vấn đề đang sửa (lỗi CRITICAL 4.2 của `03_AUDIT_RESULTS`): nút "Xoá lần
-- nhập này" đứng ngay cạnh nút "Ghi", **không hỏi lại**, và xoá được cả một lần
-- nhập ĐÃ ghi dữ liệu vào hệ thống. `import_rows` là nơi duy nhất lưu mối nối
-- "dòng số 5 của file này đã tạo ra hồ sơ CQ0123" (`created_student_id`), mà
-- `on delete cascade` từ `import_batches` cuốn theo toàn bộ. Xoá xong thì hồ sơ
-- thiếu nhi vẫn còn nhưng **không còn đường nào truy ngược** về nguồn của nó —
-- trong khi `docs/09` §7 đòi đúng cái mapping ấy.
--
-- Chốt chặn nằm ở **CƠ SỞ DỮ LIỆU**, không chỉ ở Server Action: `import_batches`
-- mở `delete` cho mọi vai trò `app.can_global_write()`, nên một lệnh DELETE gọi
-- thẳng Data API bằng JWT thật của Thư ký vẫn xoá được nếu chỉ chặn ở tầng ứng
-- dụng. Đây đúng bài học M02-B đã ghi lại và M02-C phải quay lại trả.
--
-- Quyết định của chủ dự án 2026-07-29:
--   · **D-131** — huỷ một lần nhập chưa ghi là **đánh dấu `cancelled`**, giữ
--     nguyên hàng để còn tra được ai từng tải file gì lên. Không còn đường xoá
--     hẳn nào từ giao diện.
--   · **D-132** — "Xoá dữ liệu thô" (`raw_json`) mở cho **cả bốn vai trò nhập
--     được**, vì họ vốn đã ĐỌC được dữ liệu đó; giữ nguyên `created_student_id`.
--
-- Không đụng một dòng dữ liệu nào: bốn cột mới đều `nullable`, không mặc định.

-- 1. Vết của hai thao tác một chiều -------------------------------------------
-- `updated_at` không thay được hai cột này: nó đổi theo *mọi* lượt cập nhật, nên
-- không trả lời được câu "ai huỷ, lúc nào" — mà đó chính là điều D-131 hứa giữ.
alter table public.import_batches
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles(id) on delete set null,
  add column raw_purged_at timestamptz,
  add column raw_purged_by uuid references public.profiles(id) on delete set null;

comment on column public.import_batches.cancelled_at is
  'D-131: lúc huỷ lần nhập chưa ghi. Hàng được giữ lại, không xoá.';
comment on column public.import_batches.raw_purged_at is
  'D-132: lúc xoá raw_json của lần nhập. Mapping dòng → hồ sơ vẫn giữ.';

-- 2. Chỉ lần nhập CHƯA ghi mới xoá được ---------------------------------------
-- `committed_rows = 0` là điều kiện thật sự bảo vệ mapping; `status = 'dry_run'`
-- đi kèm để một lần nhập đã huỷ cũng ở lại danh sách theo đúng D-131.
drop policy if exists import_batches_delete_global_write on public.import_batches;
create policy import_batches_delete_dry_run
on public.import_batches for delete to authenticated
using (
  app.can_global_write()
  and status = 'dry_run'
  and committed_rows = 0
);

drop policy if exists import_rows_delete_global_write on public.import_rows;
create policy import_rows_delete_dry_run
on public.import_rows for delete to authenticated
using (
  app.can_global_write()
  and exists (
    select 1
    from public.import_batches as batch
    where batch.id = import_rows.batch_id
      and batch.status = 'dry_run'
      and batch.committed_rows = 0
  )
);

-- 3. Không "huỷ" được một lần nhập đã ghi --------------------------------------
-- Không có hàng rào này thì `status` vẫn bị hạ xuống `cancelled` bằng một lệnh
-- UPDATE thẳng, và lần nhập đã tạo ra hàng trăm hồ sơ hiện lên màn hình như một
-- lần nhập bỏ đi. `commit_import_rows` là `security definer` nên nó không đi qua
-- policy này — bộ đếm do RPC cập nhật không bị ảnh hưởng.
drop policy if exists import_batches_update_global_write on public.import_batches;
create policy import_batches_update_global_write
on public.import_batches for update to authenticated
using (app.can_global_write())
with check (
  app.can_global_write()
  and (status <> 'cancelled' or committed_rows = 0)
);

comment on policy import_batches_delete_dry_run on public.import_batches is
  'BR-M12-34 / AC-16: lần nhập đã ghi dữ liệu không xoá được, kể cả qua Data API.';
