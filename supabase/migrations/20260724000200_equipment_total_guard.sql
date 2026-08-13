-- ============================================================================
-- M09-A · TB-M09-03 PA B — bịt lỗ `total_quantity` (F14, AC-M09-28, SEC-M09-12/13).
--
-- Hàng rào cũ chỉ khoá `available_quantity`, còn `total_quantity` thì `authenticated`
-- PATCH thẳng qua PostgREST được: một Trưởng/Phó Ban Kỹ thuật bơm tổng kho lên bao
-- nhiêu cũng xong, ngoài mọi phiếu mượn/trả. Hai cột này là một cặp sổ sách; khoá
-- một nửa nghĩa là không khoá.
--
-- Nhánh INSERT cũng chưa kiểm gì: `available = 0, total = 100` lọt qua, và từ đó
-- CHECK `available <= total` không bao giờ bắt được sai lệch nữa.
--
-- KHÔNG chuyển sang column-level GRANT ở đây (TB-M09-03 PA A). PA A đổi quyền cột
-- nên PostgREST trả 403 trơn, mất hết thông điệp `EQUIPMENT_*_READONLY` mà UI đang
-- dịch sang tiếng Việt — `04_TO_BE_FLOWS.md` xếp nó vào lần refactor DB kế tiếp.
-- ============================================================================

create or replace function app.validate_equipment_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.committees
    where id = new.committee_id and manages_equipment and is_active
  ) then
    raise exception 'EQUIPMENT_COMMITTEE_INVALID' using errcode = '23514';
  end if;

  -- Kho mới phải bắt đầu ở trạng thái "chưa ai mượn". Muốn ghi nhận thiết bị đang
  -- nằm ngoài kho thì tạo xong rồi lập phiếu mượn, không nhập lệch ngay từ đầu.
  if tg_op = 'INSERT' and new.available_quantity <> new.total_quantity then
    raise exception 'EQUIPMENT_STOCK_MISMATCH' using errcode = '23514';
  end if;

  -- Số lượng khả dụng VÀ tổng số đều là hệ quả của mượn/trả, không phải ô nhập liệu.
  if tg_op = 'UPDATE'
     and current_setting('app.equipment_rpc', true) is distinct from 'on' then
    if new.available_quantity <> old.available_quantity then
      raise exception 'EQUIPMENT_AVAILABLE_READONLY' using errcode = '23514';
    end if;
    if new.total_quantity <> old.total_quantity then
      raise exception 'EQUIPMENT_TOTAL_READONLY' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

comment on function app.validate_equipment_item() is
  'Kho chỉ thuộc Ban giữ kho; available_quantity và total_quantity chỉ đổi qua RPC (M09-A, TB-M09-03 PA B).';
