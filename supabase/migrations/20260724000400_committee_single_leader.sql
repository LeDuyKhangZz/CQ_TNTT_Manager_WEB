-- ============================================================================
-- M09-A · D-78 — mỗi Ban chỉ MỘT Trưởng ban tại một thời điểm (Q-M09-06).
--
-- Phó ban không giới hạn số lượng (D-78 giữ nguyên hiện trạng), nên ràng buộc chỉ
-- bám vào đúng chức vụ `leader`. Index một phần trên `is_active` để lịch sử nhiệm
-- kỳ cũ (`is_active = false`) không bị tính vào.
--
-- Ràng buộc nằm ở DB chứ không ở UI: ẩn nút không phải authorization (AGENTS §5),
-- và chức vụ Trưởng ban quyết định quyền ghi nội dung Ban qua
-- `app.can_write_committee_content`.
--
-- Câu chữ thân thiện ("Kết thúc nhiệm kỳ của {tên} và bổ nhiệm {tên mới}?") thuộc
-- đợt M09-C, nơi ô chọn chức vụ được dựng lại theo TB-M09-05. Ở đợt này lỗi được
-- dịch sang một câu nói rõ phải làm gì tiếp, không phải "Dữ liệu đã tồn tại".
-- ============================================================================

do $$
declare
  offenders text;
begin
  select string_agg(committee.code::text, ', ' order by committee.code::text)
  into offenders
  from public.committee_memberships as membership
  join public.committees as committee on committee.id = membership.committee_id
  where membership.is_active and membership.position = 'leader'
  group by committee.id, committee.code
  having count(*) > 1;

  if offenders is not null then
    raise exception
      'D-78: các Ban sau đang có nhiều hơn một Trưởng ban đang hoạt động (%). Hãy đổi chức vụ những người thừa trước khi chạy migration này.',
      offenders;
  end if;
end;
$$;

create unique index committee_memberships_one_active_leader_idx
on public.committee_memberships (committee_id)
where is_active and position = 'leader';

comment on index public.committee_memberships_one_active_leader_idx is
  'D-78: mỗi Ban chỉ một Trưởng ban đang hoạt động; Phó ban không giới hạn.';
