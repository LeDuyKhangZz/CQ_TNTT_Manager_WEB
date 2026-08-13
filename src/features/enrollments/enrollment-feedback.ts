/**
 * Câu chữ phản hồi của các thao tác ghi danh — M03-A, TB-F14 / BR-M03-N10, D-61.
 *
 * ⚠️ `no_change` là câu quan trọng nhất trong file, cùng lý do đã ghi ở
 * `classes/class-feedback.ts`: RLS chặn một lệnh `update` bằng cách trả **0 dòng,
 * không lỗi**. Thiếu câu này thì người không đủ quyền bấm nút và nhận "đã lưu" —
 * đúng hình dạng lỗi mà BR-M03-N05 và SW-04 sinh ra để diệt.
 *
 * 🔴 Vì sao không dùng lại `classes/class-feedback.ts`: nhóm quyền khác nhau. Ghi
 * danh mở cho **sáu** vai trò của `ENROLLMENT_WRITE_ROLES` (có cả Trưởng/Phó ngành),
 * còn cài đặt lớp chỉ cho bốn vai trò ghi toàn xứ đoàn. Dùng chung từ điển là nói
 * **sai sự thật** với người bị từ chối — họ sẽ đi tìm nhầm loại quyền.
 *
 * File thuần, không import gì ⇒ kiểm được bằng unit test.
 */

import { enrollmentStatusLabel } from "./enrollment-status";

export type EnrollmentFeedbackTone = "success" | "danger";

export interface EnrollmentFeedback {
  tone: EnrollmentFeedbackTone;
  text: string;
}

export type EnrollmentFailedCode =
  | "forbidden"
  | "not_found"
  | "no_change"
  | "year_closed"
  | "duplicate"
  | "class_inactive"
  | "student_not_active"
  | "pending_promotion"
  | "invalid";

/**
 * 🔴 BR-M08-20 / D-158 (M08-B) — câu này nói ra **việc phải làm**, không chỉ nói
 * rằng đã thất bại. `03_AUDIT_RESULTS` §4.5 của M08 gọi đường vòng này là *"hai
 * đường ghi vào cùng một trạng thái, chỉ một đường có quy trình duyệt"*: đóng ghi
 * danh ở đây khi đang có đề xuất chờ duyệt để lại một đề xuất **mồ côi** — trỏ
 * vào một ghi danh không còn mở nên không bao giờ duyệt được nữa, và cũng không
 * ai xoá được (BR-M08-Y2: không có đường xoá đề xuất).
 *
 * Xuất ra ngoài vì `server/actions.ts` cần đúng câu này khi dịch lỗi của **trigger
 * cơ sở dữ liệu** — hàng rào tầng hai của D-158. Một câu, một chỗ định nghĩa.
 */
export const PENDING_PROMOTION_MESSAGE =
  "Ghi danh này đang có đề xuất chuyển lớp chờ duyệt nên chưa kết thúc được. "
  + "Hãy mở trang \"Lên lớp và chuyển lớp\" để duyệt hoặc từ chối đề xuất trước.";

const FAILURE_TEXT: Record<EnrollmentFailedCode, string> = {
  forbidden:
    "Bạn không có quyền sửa ghi danh. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký, Trưởng ngành, Phó ngành và Quản trị viên hệ thống.",
  not_found: "Không tìm thấy ghi danh này. Có thể nó vừa bị đổi ở một cửa sổ khác — hãy tải lại trang.",
  no_change:
    "Không có dòng nào được cập nhật. Ghi danh có thể thuộc một năm học đã đóng, hoặc bạn không đủ quyền sửa nó.",
  year_closed: "Năm học của lớp này đã đóng nên không sửa được ghi danh.",
  // BR-M03-13 — chốt chặn nằm ở partial unique index của cơ sở dữ liệu, câu này chỉ
  // dịch mã `23505` sang tiếng người.
  duplicate: "Em này đã có một ghi danh đang mở trong năm học. Hãy kết thúc ghi danh cũ trước.",
  class_inactive: "Lớp này không còn hoạt động nên không nhận ghi danh mới.",
  // BR-M03-N13 / AC-F06-04 (M03-C) — trigger `enrollments_need_active_student`
  // chặn ở cơ sở dữ liệu; câu này nói ra **việc phải làm trước**, không chỉ nói
  // rằng đã thất bại.
  student_not_active:
    "Hồ sơ của em không ở trạng thái \"Đang sinh hoạt\" nên chưa ghi danh được. Mở hồ sơ của em, chuyển trạng thái về \"Đang sinh hoạt\" rồi ghi danh lại. Nếu em đang tạm nghỉ ở một lớp thì dùng nút \"Khôi phục\" ở lớp đó.",
  pending_promotion: PENDING_PROMOTION_MESSAGE,
  invalid: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
};

export function enrollmentFailureFeedback(
  code: EnrollmentFailedCode,
  message?: string | null,
): EnrollmentFeedback {
  // Câu do chính server action viết ra (ví dụ lỗi Zod "Ngày không hợp lệ") luôn cụ
  // thể hơn câu mặc định ⇒ ưu tiên nó.
  return { tone: "danger", text: message?.trim() || FAILURE_TEXT[code] || FAILURE_TEXT.invalid };
}

/**
 * Câu thành công **nói ra kết quả thật**, không phải "Đã lưu" suông — bài học M02-A:
 * một câu thành công không nêu kết quả thì không phân biệt được với một câu thành
 * công giả.
 */
export function enrolledFeedback(studentName: string, className: string): EnrollmentFeedback {
  return { tone: "success", text: `Đã ghi danh ${studentName} vào lớp ${className}.` };
}

/**
 * D-121 — câu này phải nói ra **cả hai hệ quả** của "Tạm nghỉ", vì cả hai đều trái
 * với điều người dùng dễ đoán: em **vẫn** thuộc lớp (nên vẫn nằm trong sĩ số và vẫn
 * có tên khi điểm danh), và **có đường quay lại**.
 */
export function pausedFeedback(studentName: string): EnrollmentFeedback {
  return {
    tone: "success",
    text: `Đã chuyển ${studentName} sang "Tạm nghỉ". Em vẫn thuộc lớp và vẫn được tính vào sĩ số; bấm "Khôi phục" khi em đi học lại.`,
  };
}

export function resumedFeedback(studentName: string): EnrollmentFeedback {
  return { tone: "success", text: `Đã khôi phục ghi danh của ${studentName}. Em trở lại trạng thái "Đang học".` };
}

/**
 * D-122 — lý do "Chuyển lớp" phải nhắc lại việc còn phải làm, ngay cả ở câu thành
 * công. Người dùng bấm xong là rời trang; nếu chỉ nói trong hộp xác nhận thì câu
 * nhắc biến mất đúng lúc nó cần được nhớ.
 */
export function closedFeedback(studentName: string, reason: string): EnrollmentFeedback {
  const base = `Đã kết thúc ghi danh của ${studentName} với lý do "${enrollmentStatusLabel(reason)}".`;
  return {
    tone: "success",
    text:
      reason === "transferred"
        ? `${base} Nhớ ghi danh em vào lớp mới — hệ thống không tự làm việc đó.`
        : base,
  };
}
