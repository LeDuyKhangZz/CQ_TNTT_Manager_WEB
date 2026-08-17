"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ATTENDANCE_STATUS_LABELS } from "../constants";
import { usedStatuses, type FinalizePreview } from "../finalize-preview";

/**
 * Hộp xác nhận trước khi chốt — M05-C / TB-03, AC-F06-1.
 *
 * **Cố ý thêm một bước bấm.** `04_TO_BE_FLOWS` TB-03 nói thẳng lý do: chốt là
 * thao tác một chiều — nó đặt mốc khóa 3 ngày, và sau mốc đó chỉ Quản trị viên
 * hệ thống mở lại được. Một cú bấm nhầm ở đây đắt hơn nhiều một cú bấm thừa.
 *
 * 🔴 Bảng phân bố tính từ **bản nháp phía client**: không có lượt gọi máy chủ
 * nào giữa cú bấm "Hoàn tất" và cú bấm xác nhận. Bấm Huỷ ⇒ **không request nào
 * được gửi** đi (AC-F06-1 canh đúng điều đó).
 */
export function FinalizeConfirmDialog({
  open,
  preview,
  pending,
  isRefinalize,
  onClose,
  onConfirm,
}: {
  open: boolean;
  preview: FinalizePreview;
  pending: boolean;
  isRefinalize: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const rows = usedStatuses(preview);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      pending={pending}
      tone="primary"
      confirmLabel={isRefinalize ? "Chốt lại buổi" : "Chốt buổi điểm danh"}
      cancelLabel="Quay lại sửa"
      title={isRefinalize ? "Chốt lại buổi điểm danh?" : "Chốt buổi điểm danh?"}
      consequence={
        <div className="space-y-3">
          <p>
            Chốt {preview.studentTotal} thiếu nhi và {preview.staffTotal} giáo lý viên. Sau khi chốt,
            buổi khóa lại theo số ngày của năm học và chỉ Quản trị viên hệ thống mở khóa được.
          </p>

          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Phân bố trạng thái điểm danh tính từ những gì bạn vừa chọn
            </caption>
            <thead>
              <tr className="border-b border-line text-xs uppercase text-ink-muted">
                <th scope="col" className="py-1 pr-2 font-medium">Trạng thái</th>
                <th scope="col" className="py-1 pr-2 text-right font-medium">Thánh lễ</th>
                <th scope="col" className="py-1 text-right font-medium">Giáo lý</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((status) => (
                <tr key={status} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1 pr-2 font-normal text-ink">
                    {ATTENDANCE_STATUS_LABELS[status]}
                  </th>
                  <td className="py-1 pr-2 text-right tabular-nums text-ink">
                    {preview.mass[status]}
                  </td>
                  <td className="py-1 text-right tabular-nums text-ink">
                    {preview.catechism[status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            Giáo lý viên có mặt: {preview.staffPresent}/{preview.staffTotal}.
          </p>

          {/* Nêu **tên riêng** chứ không phải "có N em có đơn" — trên một danh
              sách 50 em, con số không cho biết phải mở em nào ra xem lại. */}
          {preview.ignoredAbsenceRequests.length > 0 ? (
            <p className="text-warning">
              Có đơn xin nghỉ nhưng vẫn đang để “Có mặt” cả hai cột:{" "}
              {preview.ignoredAbsenceRequests.join(", ")}. Nếu đúng là các em có đi thì cứ chốt.
            </p>
          ) : null}
        </div>
      }
    />
  );
}
