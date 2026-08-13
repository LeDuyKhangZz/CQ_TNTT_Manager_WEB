/**
 * Câu chữ phản hồi sau mỗi thao tác ghi của module thông báo — `11` §5 (D-61
 * *"mọi thao tác ghi có phản hồi"* + SW-04 *"kiểm số dòng thay đổi"*).
 *
 * Tách thành hàm thuần để kiểm thử được từng ca, cùng khuôn với
 * `student-feedback.ts` · `import-feedback.ts` · `class-feedback.ts`.
 */

export type PublishFeedbackTone = "success" | "danger" | "info";

export interface PublishFeedback {
  tone: PublishFeedbackTone;
  text: string;
  /**
   * Có xoá trắng biểu mẫu sau khi gửi không.
   *
   * 🔴 Ca `recipientCount === 0` **cố ý giữ lại chữ đã gõ**. Thông báo ấy đã
   * được ghi và **không thu hồi được** (cho tới đợt C), nhưng nó tới **không
   * một ai** — nên việc tiếp theo của người dùng gần như chắc chắn là *chọn lại
   * phạm vi rồi gửi lại*. Xoá trắng biểu mẫu lúc đó là bắt họ gõ lại toàn bộ
   * nội dung để sửa một lỗi chọn nhầm ô. Bản gửi hụt nằm lại vô hại: nó không
   * có người nhận nào.
   */
  resetForm: boolean;
}

/**
 * **AC-02-01 + AC-02-02.**
 *
 * `recipientCount < 0` nghĩa là đã gửi xong nhưng lượt đọc lại con số không
 * thành — nói *"đã gửi"* mà không nói một con số nào, thay vì đoán bừa.
 *
 * `recipientCount === 0` **không** được hiển thị như một lần gửi thành công
 * bình thường (nguyên văn AC-02-02). Đây là ca *"gửi vào hư không"* mà audit
 * xếp là lỗi vô hình: phạm vi không còn ai đang hoạt động, hoặc — cho tới khi
 * đợt B sửa — người nhận đích danh chưa được gán vai trò.
 */
export function publishFeedback(recipientCount: number): PublishFeedback {
  if (recipientCount < 0) {
    return { tone: "success", text: "Đã gửi thông báo.", resetForm: true };
  }
  if (recipientCount === 0) {
    return {
      tone: "danger",
      text:
        "Thông báo chưa tới người nhận nào. Phạm vi bạn chọn hiện không có ai đang hoạt động — "
        + "hãy kiểm tra lại phạm vi rồi gửi lại.",
      resetForm: false,
    };
  }
  return {
    tone: "success",
    text: `Đã gửi thông báo tới ${recipientCount} người.`,
    resetForm: true,
  };
}

/** SW-04 cho nút "Đánh dấu tất cả đã đọc": nói ra số dòng thật sự đổi. */
export function markAllFeedback(count: number): PublishFeedback {
  if (count === 0) {
    return { tone: "info", text: "Không có thông báo nào chưa đọc.", resetForm: false };
  }
  return {
    tone: "success",
    text: `Đã đánh dấu ${count} thông báo là đã đọc.`,
    resetForm: false,
  };
}
