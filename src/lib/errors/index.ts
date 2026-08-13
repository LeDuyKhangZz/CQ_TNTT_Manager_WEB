// Error model ổn định (docs/04 §9). Mã lỗi tiếng Anh, thông điệp UI tiếng Việt.

export const APP_ERROR_CODES = [
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "OUT_OF_SCOPE",
  "VALIDATION_ERROR",
  "CONFLICT",
  "ATTENDANCE_ALREADY_CLAIMED",
  // M05-A / TB-04: ba tình huống khác hẳn nhau từng gánh chung một mã.
  // "Không ai giữ buổi" và "phiên của chính bạn đã hết hạn" là chuyện thường
  // ngày, chữa bằng một cú bấm; ghép chúng vào "người khác đang phụ trách" là
  // nói với người vừa chốt xong rằng có một người thứ hai không hề tồn tại.
  "ATTENDANCE_SESSION_NOT_CLAIMED",
  "ATTENDANCE_LEASE_EXPIRED",
  "ATTENDANCE_LOCKED",
  "LEASE_NOT_EXPIRED",
  "GRADEBOOK_LOCKED",
  "DUPLICATE_ENROLLMENT",
  "CAPACITY_CONFLICT",
  "RESOURCE_NOT_FOUND",
  // M02-A / TB-F02: thiếu **dữ liệu tham chiếu bất biến** (danh mục 19 lớp chuẩn)
  // là một loại hỏng riêng, không phải "dữ liệu bạn nhập sai" cũng không phải
  // "không tìm thấy". Người vận hành cần biết phải đi nạp danh mục, chứ không
  // phải thử lại thao tác vừa rồi.
  "REFERENCE_DATA_MISSING",
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
  ATTENDANCE_SESSION_NOT_CLAIMED:
    "Phiên chỉnh sửa đã kết thúc. Bấm “Tiếp quản” để sửa tiếp.",
  ATTENDANCE_LEASE_EXPIRED:
    "Phiên chỉnh sửa đã hết hạn. Bấm “Tiếp quản” để sửa tiếp.",
  ATTENDANCE_LOCKED: "Buổi điểm danh đã bị khóa.",
  LEASE_NOT_EXPIRED:
    "Chưa thể tiếp quản vì phiên chỉnh sửa chưa hết hạn.",
  GRADEBOOK_LOCKED: "Bảng điểm đã bị khóa.",
  DUPLICATE_ENROLLMENT:
    "Thiếu nhi đã có lớp đang mở trong năm học này.",
  CAPACITY_CONFLICT: "Số lượng không hợp lệ hoặc vượt quá giới hạn.",
  RESOURCE_NOT_FOUND: "Không tìm thấy dữ liệu.",
  REFERENCE_DATA_MISSING:
    "Chưa có danh mục lớp chuẩn trong hệ thống. Hãy nạp dữ liệu tham chiếu trước.",
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
