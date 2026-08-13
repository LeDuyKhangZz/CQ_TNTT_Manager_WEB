/**
 * Câu hậu quả của hộp xác nhận **"Duyệt"** — M08-C, **AC-14 / TO-BE 6**.
 *
 * `06_UI_UX_RECOMMENDATIONS` §3 xếp mục này mức **Cao** với đúng một câu:
 * *"Nút 'Duyệt' không có xác nhận, dù nó đóng ghi danh cũ và tạo ghi danh mới
 * không lùi được"*. Nợ ấy đã được ghi ra và **cố ý mang qua hai đợt** (M08-A và
 * M08-B đều nêu nó là "cái giá đã biết"), vì D-159 sẽ đổi hẳn nội dung câu hỏi
 * cho bốn vai trò cấp xứ đoàn. D-159 xong ở M08-B; đây là chỗ trả nợ.
 *
 * 🔴 **Hộp này KHÔNG phải bản sao của `transfer-consequence.ts`, và khác ở một
 * điểm quyết định giọng văn của cả file:** ở đường một bước (D-159), người bấm
 * đang xác nhận **quyết định của chính mình**; ở đây người bấm đang thi hành
 * **quyết định của người khác** — một đại diện lớp đã đề xuất, có thể từ nhiều
 * ngày trước, và người duyệt có thể vừa đổi ô "Lớp đích khi duyệt" so với lớp
 * được đề nghị. Vì thế câu dưới đây nói ra **lớp đang sắp ghi vào**, không nói
 * lại lớp trong đề xuất; hai thứ đó khác nhau đúng ở lúc nguy hiểm nhất.
 *
 * ⏸️ **Nút "Từ chối" cố ý KHÔNG có hộp xác nhận.** `04_TO_BE_FLOWS` TO-BE 6 chỉ
 * đòi hộp cho "Duyệt", và lý do đứng vững: từ chối **lùi được** — đại diện sửa
 * rồi gửi lại (BR-M08-16), và từ M08-B lần từ chối ấy còn nằm lại vĩnh viễn
 * trong nhật ký (D-157). Chỗ giảm rủi ro của "Từ chối" là **AC-15** — bắt buộc
 * nêu lý do — chứ không phải thêm một lần bấm. Chồng cả hai lên nhau là dạy
 * người dùng bấm "Xác nhận" theo phản xạ, đúng thứ làm hộp xác nhận của "Duyệt"
 * mất tác dụng.
 *
 * File thuần — kiểm được bằng unit test thường.
 */

import type { PromotionProposalStatus } from "./constants";

export interface ApproveConsequenceInput {
  studentName: string;
  sourceClassName: string;
  sourceYearCode: string;
  /** Trạng thái **của đề xuất đang duyệt**, không phải một lựa chọn mới. */
  proposedStatus: PromotionProposalStatus;
  proposeTrainee: boolean;
  /** Lớp đích **đang chọn trong ô duyệt**, đã kèm năm học. `null` khi chưa chọn. */
  targetLabel: string | null;
  /** Lớp đại diện đề nghị ban đầu — chỉ để nói ra khi người duyệt đã đổi. */
  proposedTargetLabel?: string | null;
}

const NO_UNDO = "Việc này không có đường lùi: phải làm ngược lại bằng tay ở trang Lớp.";

/**
 * 🔴 Nói ra khi người duyệt đã **đổi lớp đích** so với lớp đại diện đề nghị.
 *
 * Ô "Lớp đích khi duyệt" là một `<Select>` sửa được, và một cú lăn chuột trên ô
 * ấy đủ để đổi giá trị mà không ai bấm gì. Không nói ra thì hộp xác nhận vẫn
 * đúng — nó in lớp sắp ghi — nhưng người duyệt đọc lướt sẽ tưởng mình đang xác
 * nhận đúng thứ đại diện đề nghị.
 */
function targetChangeNote(input: ApproveConsequenceInput): string {
  const proposed = input.proposedTargetLabel;
  if (!proposed || !input.targetLabel || proposed === input.targetLabel) return "";
  return ` Lưu ý: đại diện lớp đề nghị ${proposed}, bạn đang chọn ${input.targetLabel}.`;
}

export function describeApproveConsequence(input: ApproveConsequenceInput): string {
  const source = `${input.studentName} (lớp ${input.sourceClassName}, năm ${input.sourceYearCode})`;

  if (input.proposeTrainee) {
    return (
      `Duyệt đề xuất của đại diện lớp: đóng ghi danh của ${source} và xếp em vào lớp `
      + `Dự trưởng của năm học kế tiếp — hệ thống tự chọn lớp Dự trưởng khi duyệt. ${NO_UNDO}`
    );
  }

  switch (input.proposedStatus) {
    case "recommended_promote":
    case "recommended_repeat":
      return (
        `Duyệt đề xuất của đại diện lớp: đóng ghi danh của ${source} và mở ghi danh mới ở lớp `
        + `${input.targetLabel ?? "chưa chọn"}.${targetChangeNote(input)} ${NO_UNDO}`
      );
    case "temporarily_pause":
      // Giữ nguyên lập luận của `transfer-consequence.ts`: "Tạm nghỉ" là trạng
      // thái MỞ và trang Lớp có sẵn nút "Khôi phục" (M03-A). Doạ người dùng bằng
      // một câu sai cũng là nói sai.
      return (
        `Duyệt đề xuất của đại diện lớp: chuyển ghi danh của ${source} sang "Tạm nghỉ". `
        + `Em vẫn thuộc lớp và vẫn được tính vào sĩ số; bấm "Khôi phục" ở trang Lớp khi em đi học lại.`
      );
    case "withdraw":
      return (
        `Duyệt đề xuất của đại diện lớp: đóng ghi danh của ${source} với lý do "Rút học". `
        + `Em sẽ không còn trong danh sách lớp và không có ghi danh mới nào được tạo. ${NO_UNDO}`
      );
    default:
      return `Duyệt đề xuất chuyển lớp cho ${source}. ${NO_UNDO}`;
  }
}

/** Nhãn nút xác nhận — nói ra **việc sắp làm**, không phải "Đồng ý". */
export function approveConfirmLabel(
  proposedStatus: PromotionProposalStatus,
  proposeTrainee: boolean,
): string {
  if (proposeTrainee) return "Duyệt vào Dự trưởng";
  switch (proposedStatus) {
    case "recommended_promote":
      return "Duyệt lên lớp";
    case "recommended_repeat":
      return "Duyệt cho học lại";
    case "temporarily_pause":
      return "Duyệt Tạm nghỉ";
    case "withdraw":
      return "Duyệt Rút học";
    default:
      return "Duyệt";
  }
}
