/**
 * Câu hậu quả của hộp xác nhận **"Chuyển lớp"** — M08-B, D-159.
 *
 * `11` §5 đòi *"thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên
 * riêng**"*, và `03_AUDIT_RESULTS` tiêu chí 5 chấm đúng chỗ này 3/5: *"nút
 * 'Duyệt'/'Từ chối' không có xác nhận, mà 'Duyệt' là hành động đóng ghi danh cũ —
 * không có đường lùi"*.
 *
 * 🔴 Đường một bước của D-159 **nguy hiểm hơn** đường hai bước đúng một mức: ở
 * đường cũ, người bấm "Lưu đề xuất" còn một chặng nữa để nghĩ lại; ở đây một cú
 * bấm là ghi danh đóng lại và ghi danh mới ra đời. Vì thế câu dưới đây phải nói
 * đủ **bốn tên riêng** — tên em · lớp đang học · lớp sẽ vào · năm học đích — chứ
 * không phải *"Bạn có chắc muốn chuyển lớp?"*.
 *
 * ⏸️ Hộp xác nhận cho nút **"Duyệt"** của đường hai bước là **AC-14**, hạng mục 2
 * của `07_IMPLEMENTATION_IMPACT`, và nó nằm ở **M08-C**. Cố ý không làm ở đây:
 * hai hộp có nội dung khác nhau (một cái xác nhận *quyết định của chính mình*, cái
 * kia xác nhận *quyết định của người khác*), và gộp vội thành một là làm hai lần.
 *
 * File thuần — kiểm được bằng unit test thường.
 */

import type { PromotionProposalStatus } from "./constants";

export interface TransferConsequenceInput {
  studentName: string;
  sourceClassName: string;
  sourceYearCode: string;
  proposedStatus: PromotionProposalStatus;
  proposeTrainee: boolean;
  /** Tên lớp đích đã kèm năm học, ví dụ `"Ấu 2A · 2091-2092"`. `null` khi chưa chọn. */
  targetLabel: string | null;
}

const NO_UNDO = "Việc này không có đường lùi: phải làm ngược lại bằng tay ở trang Lớp.";

export function describeTransferConsequence(input: TransferConsequenceInput): string {
  const source = `${input.studentName} (lớp ${input.sourceClassName}, năm ${input.sourceYearCode})`;

  if (input.proposeTrainee) {
    return (
      `Đóng ghi danh của ${source} và xếp em vào lớp Dự trưởng của năm học kế tiếp — `
      + `hệ thống tự chọn lớp Dự trưởng khi chuyển. ${NO_UNDO}`
    );
  }

  switch (input.proposedStatus) {
    case "recommended_promote":
    case "recommended_repeat":
      return (
        `Đóng ghi danh của ${source} và mở ghi danh mới ở lớp `
        + `${input.targetLabel ?? "chưa chọn"}. ${NO_UNDO}`
      );
    case "temporarily_pause":
      // Cố ý KHÔNG nói "không có đường lùi": tạm nghỉ là trạng thái mở và trang
      // Lớp có sẵn nút "Khôi phục" (M03-A). Nói sai theo hướng doạ người dùng cũng
      // là nói sai.
      return (
        `Chuyển ghi danh của ${source} sang "Tạm nghỉ". Em vẫn thuộc lớp và vẫn `
        + `được tính vào sĩ số; bấm "Khôi phục" ở trang Lớp khi em đi học lại.`
      );
    case "withdraw":
      return (
        `Đóng ghi danh của ${source} với lý do "Rút học". Em sẽ không còn trong `
        + `danh sách lớp và không có ghi danh mới nào được tạo. ${NO_UNDO}`
      );
    default:
      return `Chuyển lớp cho ${source}. ${NO_UNDO}`;
  }
}

/**
 * Câu thành công — **D-61**: nói ra **kết quả thật**, không phải "Đã lưu" suông.
 * Bài học M02-A: một câu thành công không nêu kết quả thì không phân biệt được
 * với một câu thành công giả.
 */
export function describeTransferSuccess(
  studentName: string,
  proposedStatus: PromotionProposalStatus,
  proposeTrainee: boolean,
): string {
  if (proposeTrainee) {
    return `Đã chuyển ${studentName} sang Dự trưởng. Ghi danh cũ đã đóng và ghi danh mới đã được tạo.`;
  }
  switch (proposedStatus) {
    case "recommended_promote":
    case "recommended_repeat":
      return `Đã chuyển lớp cho ${studentName}. Ghi danh cũ đã đóng và ghi danh mới đã được tạo.`;
    case "temporarily_pause":
      return `Đã chuyển ghi danh của ${studentName} sang "Tạm nghỉ".`;
    case "withdraw":
      return `Đã ghi nhận ${studentName} rút học. Ghi danh đã đóng, không có ghi danh mới nào được tạo.`;
    default:
      return `Đã cập nhật ghi danh của ${studentName}.`;
  }
}

/** Nhãn nút xác nhận — nói ra **việc sắp làm**, không phải "Đồng ý". */
export function transferConfirmLabel(
  proposedStatus: PromotionProposalStatus,
  proposeTrainee: boolean,
): string {
  if (proposeTrainee) return "Chuyển sang Dự trưởng";
  switch (proposedStatus) {
    case "recommended_promote":
      return "Chuyển lên lớp";
    case "recommended_repeat":
      return "Cho học lại";
    case "temporarily_pause":
      return "Chuyển sang Tạm nghỉ";
    case "withdraw":
      return "Ghi nhận Rút học";
    default:
      return "Chuyển lớp";
  }
}
