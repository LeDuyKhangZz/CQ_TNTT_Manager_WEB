/**
 * Câu mô tả trạng thái một phiếu mượn (M09-B).
 *
 * ⚠️ File này cố ý **không** có `"use client"`. Mọi export của một module client
 * là *client reference*, nên gọi từ Server Component là ném lỗi lúc dựng trang —
 * kể cả với một hàm thuần trả về chuỗi. Đúng cái bẫy đã làm sập `/account` ở
 * M14-C. Hàm dùng chung nằm ở đây, `equipment-board.tsx` nhập vào.
 */
export interface LoanBalance {
  quantity: number;
  restoredQuantity: number;
  outstandingQuantity: number;
}

/**
 * "Đã mượn 5 · đã nhận lại 3 · còn nợ 2".
 *
 * Nói bằng CHỮ chứ không bằng màu (`11` §5), và phân biệt rõ ba con số mà bản
 * trước M09-B gộp làm một: mang về được bao nhiêu, mất bao nhiêu, còn nợ bao nhiêu.
 */
export function describeLoanBalance(loan: LoanBalance): string {
  const parts = [`Đã mượn ${loan.quantity} cái`];
  if (loan.restoredQuantity > 0) parts.push(`đã nhận lại ${loan.restoredQuantity}`);
  const writtenOff = loan.quantity - loan.restoredQuantity - loan.outstandingQuantity;
  if (writtenOff > 0) parts.push(`hỏng/mất ${writtenOff}`);
  if (loan.outstandingQuantity > 0) parts.push(`còn nợ ${loan.outstandingQuantity}`);
  return parts.join(" · ");
}
