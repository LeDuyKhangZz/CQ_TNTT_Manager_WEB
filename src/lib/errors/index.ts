// Error model ổn định (docs/04 §9). Mã lỗi tiếng Anh, thông điệp UI tiếng Việt.

export const APP_ERROR_CODES = [
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "OUT_OF_SCOPE",
  "VALIDATION_ERROR",
  "CONFLICT",
  "ATTENDANCE_ALREADY_CLAIMED",
  "ATTENDANCE_LOCKED",
  "LEASE_NOT_EXPIRED",
  "GRADEBOOK_LOCKED",
  "DUPLICATE_ENROLLMENT",
  "CAPACITY_CONFLICT",
  "RESOURCE_NOT_FOUND",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export const APP_ERROR_MESSAGES_VI: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: "Bạn cần đăng nhập để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  OUT_OF_SCOPE: "Nội dung nằm ngoài phạm vi được phép của bạn.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  CONFLICT: "Thao tác bị xung đột. Vui lòng thử lại.",
  ATTENDANCE_ALREADY_CLAIMED:
    "Buổi điểm danh đang có người khác phụ trách.",
  ATTENDANCE_LOCKED: "Buổi điểm danh đã bị khóa.",
  LEASE_NOT_EXPIRED:
    "Chưa thể tiếp quản vì phiên chỉnh sửa chưa hết hạn.",
  GRADEBOOK_LOCKED: "Bảng điểm đã bị khóa.",
  DUPLICATE_ENROLLMENT:
    "Thiếu nhi đã có lớp đang mở trong năm học này.",
  CAPACITY_CONFLICT: "Số lượng không hợp lệ hoặc vượt quá giới hạn.",
  RESOURCE_NOT_FOUND: "Không tìm thấy dữ liệu.",
};

/** Lỗi nghiệp vụ có mã ổn định; UI hiển thị tiếng Việt, không lộ raw stack/SQL. */
export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? APP_ERROR_MESSAGES_VI[code]);
    this.code = code;
    this.name = "AppError";
  }
}

export function getErrorMessageVi(code: AppErrorCode): string {
  return APP_ERROR_MESSAGES_VI[code];
}
