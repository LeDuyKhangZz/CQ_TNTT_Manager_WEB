import { NOTIFICATION_TARGET_LABELS, type NotificationTargetType } from "./constants";

/**
 * Chữ nghĩa của bước **xem lại trước khi gửi** — AC-06-01, `11` §5
 * (*"thao tác nguy hiểm có ConfirmDialog nêu hậu quả bằng tên riêng"*).
 *
 * Gửi thông báo là thao tác nguy hiểm theo đúng nghĩa của `11` §5: nó chạm tới
 * người khác, và **cho tới đợt C thì không lùi được**. Trước M10-B, một cú bấm
 * nhầm ô "Phạm vi" là 300 tài khoản nhận một thông báo dành cho một lớp.
 */

export interface PublishConfirmation {
  /** Tiêu đề hộp thoại. */
  heading: string;
  /** Câu hậu quả — nêu phạm vi **bằng tên riêng** và số người sẽ nhận. */
  scopeLine: string;
  /** Cảnh báo không lùi được, luôn hiện. */
  warning: string;
  /** Nhãn nút xác nhận — con số nói ra ngay trên nút. */
  confirmLabel: string;
  /** Phạm vi rỗng: hộp thoại đổi giọng, người dùng phải nhìn thấy điều đó. */
  emptyAudience: boolean;
}

/**
 * `audienceCount === null` nghĩa là lượt đếm trước không thành (mất mạng, hoặc
 * chính người đó không được đếm phạm vi ấy). Khi đó **không đoán một con số**:
 * hộp thoại vẫn hiện đủ phạm vi + cảnh báo, chỉ thiếu con số. Bịa một con số ở
 * đây là tệ hơn hẳn — người dùng bấm "Xác nhận" dựa vào nó.
 */
export function publishConfirmation({
  targetType,
  targetLabel,
  audienceCount,
}: {
  targetType: NotificationTargetType;
  /** Tên riêng của đối tượng: "Ấu 1A", "Ngành Thiếu", "Ban Phụng vụ", tên người. */
  targetLabel: string | null;
  audienceCount: number | null;
}): PublishConfirmation {
  const scopeName = targetLabel
    ? `${NOTIFICATION_TARGET_LABELS[targetType].toLowerCase()} — ${targetLabel}`
    : NOTIFICATION_TARGET_LABELS[targetType].toLowerCase();

  if (audienceCount === null) {
    return {
      heading: "Gửi thông báo?",
      scopeLine: `Gửi tới ${scopeName}. Chưa đếm được số người nhận.`,
      warning: WARNING,
      confirmLabel: "Gửi thông báo",
      emptyAudience: false,
    };
  }

  if (audienceCount === 0) {
    return {
      heading: "Phạm vi này hiện không có ai",
      scopeLine:
        `Gửi tới ${scopeName}, nhưng hiện không có tài khoản nào đang hoạt động `
        + "trong phạm vi ấy. Thông báo sẽ được lưu mà không tới một ai.",
      warning: WARNING,
      confirmLabel: "Vẫn gửi",
      emptyAudience: true,
    };
  }

  return {
    heading: "Gửi thông báo?",
    scopeLine: `Gửi tới ${scopeName} — ${audienceCount} người sẽ nhận được.`,
    warning: WARNING,
    confirmLabel: `Gửi cho ${audienceCount} người`,
    emptyAudience: false,
  };
}

/**
 * ⚠️ Câu này phải được **sửa lại ở đợt C**, khi thu hồi mềm (D-166) hạ nó từ
 * *"không thu hồi được"* xuống *"thu hồi được, nhưng người nhận có thể đã đọc"*.
 * Để nguyên là nói dối theo chiều ngược lại.
 */
const WARNING = "Thông báo đã gửi không thu hồi được.";

/** Nhãn nút gửi ở biểu mẫu chính — con số hiện ngay khi đã đếm được. */
export function sendButtonLabel(audienceCount: number | null, pending: boolean): string {
  if (pending) return "Đang gửi…";
  if (audienceCount === null) return "Gửi thông báo";
  if (audienceCount === 0) return "Gửi thông báo · chưa có ai trong phạm vi";
  return `Gửi thông báo tới ${audienceCount} người`;
}
