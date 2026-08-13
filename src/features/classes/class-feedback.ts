/**
 * Câu chữ phản hồi của màn hình "Cài đặt lớp" — M02-B, TB-F08 / AC-M02-10, D-61.
 *
 * 🔴 Vì sao có file riêng thay vì dùng `academic-years/admin-feedback.ts`: câu chữ
 * ở đó nói về **năm học** ("Vòng đời năm học chỉ dành cho Quản trị viên hệ thống")
 * và về trang `/admin`. Sửa lớp là nhóm quyền khác (bốn vai trò ghi toàn xứ đoàn,
 * không phải chỉ Super Admin — xem `server/permissions.ts`), nên dùng lại từ điển
 * kia sẽ nói **sai sự thật** cho người bị từ chối: họ đi tìm quyền Super Admin
 * trong khi vấn đề là ngành/lớp.
 *
 * ⚠️ `no_change` là câu quan trọng nhất trong file. RLS chặn một lệnh `update`
 * bằng cách trả **0 dòng, không lỗi** — đúng hình dạng "no-op im lặng" mà SW-04 và
 * AC-M02-10 bắt phải phát hiện. Nếu không có câu này thì người không đủ quyền bấm
 * Lưu và nhận được "đã lưu".
 *
 * File thuần, không import gì ⇒ kiểm được bằng unit test.
 */

export type ClassFeedbackTone = "success" | "danger";

export interface ClassFeedback {
  tone: ClassFeedbackTone;
  text: string;
}

export type ClassFailedCode = "forbidden" | "not_found" | "no_change" | "year_closed" | "invalid";

const FAILURE_TEXT: Record<ClassFailedCode, string> = {
  forbidden:
    "Bạn không có quyền sửa cài đặt lớp. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký và Quản trị viên hệ thống.",
  not_found: "Không tìm thấy lớp này. Có thể nó vừa bị đổi ở một cửa sổ khác — hãy tải lại trang.",
  no_change:
    "Không có dòng nào được cập nhật. Lớp có thể không còn tồn tại, hoặc bạn không đủ quyền sửa nó.",
  // TB-F07 / BR-M02-N09 — chặn ở tầng ứng dụng, chưa phải ở RLS (đó là I8, M02-C).
  year_closed: "Năm học của lớp này đã đóng nên không sửa được cài đặt lớp.",
  invalid: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
};

export function classFailureFeedback(code: ClassFailedCode): ClassFeedback {
  return { tone: "danger", text: FAILURE_TEXT[code] ?? FAILURE_TEXT.invalid };
}

/**
 * Câu thành công **nêu ra trạng thái vừa lưu**, không phải "Đã lưu" suông.
 *
 * Đây là bài học của M02-A: một câu thành công không nói ra kết quả thật thì không
 * phân biệt được với một câu thành công giả. Người dùng vừa đổi lớp sang "Đã đóng"
 * cần thấy đúng chữ "Đã đóng" hiện lên.
 */
export function classSavedFeedback(statusLabel: string): ClassFeedback {
  return { tone: "success", text: `Đã lưu cài đặt lớp. Trạng thái hiện tại: ${statusLabel}.` };
}
