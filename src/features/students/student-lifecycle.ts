import {
  CLOSE_ENROLLMENT_REASONS,
  enrollmentStatusLabel,
} from "@/features/enrollments/enrollment-status";
import { studentStatusLabel } from "./student-status";

/**
 * Vòng đời **hồ sơ** thiếu nhi — M03-C, TB-F06 / BR-M03-N12·N13·N14, **D-130**.
 *
 * 🔴 **Đây là chỗ chữa lỗi F06 (42/75).** Trước đợt này hệ thống có hai trục
 * trạng thái mà **không luật nào ràng buộc chúng**:
 *
 *   · `students.status`    — danh tính: em còn thuộc xứ đoàn không
 *   · `enrollments.status` — chỗ trong lớp: em còn học lớp nào không
 *
 * Hệ quả đo được (5W-F06): đặt một em sang "Lưu trữ" thì em **vẫn nằm trong sĩ
 * số**, **vẫn có tên trong danh sách điểm danh**, và — điều không ai để ý —
 * Giáo lý viên **vẫn đọc được hồ sơ sức khoẻ** của em đã rời đi, vì
 * `app.class_scoped_student_ids()` chỉ nhìn ghi danh còn mở.
 *
 * **D-130 (chủ dự án chốt 2026-07-28):** hai trục nay đi cùng nhau. Ba đường đã
 * đặt lên bàn — (a) chỉ Rút/Lưu trữ mới đóng ghi danh, (b) Tạm nghỉ hồ sơ kéo
 * theo tạm nghỉ ghi danh, (c) bỏ hẳn "Tạm nghỉ" khỏi trạng thái hồ sơ. Chủ dự
 * án chọn **(b)**: chữ "Tạm nghỉ" xuất hiện ở cả hai trục, và để chúng nói hai
 * điều khác nhau là dựng lại đúng loại nhầm lẫn đã sinh ra lỗi F10.
 *
 * File thuần, không import gì ngoài hai từ điển nhãn ⇒ kiểm được bằng unit
 * test. Cùng khuôn với `enrollment-status.ts` và `year-lifecycle.ts`.
 */

/** Trạng thái đóng hồ sơ — hai trạng thái **bắt buộc** đóng ghi danh đang mở. */
export const CLOSING_STUDENT_STATUSES = ["withdrawn", "archived"] as const;

export type ClosingStudentStatus = (typeof CLOSING_STUDENT_STATUSES)[number];

export function isClosingStudentStatus(status: string): status is ClosingStudentStatus {
  return (CLOSING_STUDENT_STATUSES as readonly string[]).includes(status);
}

/**
 * Thứ tự hiện trên ô chọn. Đặt "Đang sinh hoạt" đầu tiên vì đó là đích của thao
 * tác **hoàn tác** — người dùng tìm nó khi vừa lỡ tay.
 */
export const STUDENT_STATUS_CHOICES = [
  "active",
  "temporarily_inactive",
  "withdrawn",
  "archived",
] as const;

/** Lý do kết thúc ghi danh dùng lại **nguyên vẹn** của M03-A — không chép tay. */
export const STUDENT_CLOSE_REASONS = CLOSE_ENROLLMENT_REASONS;

/**
 * `11` §5 — *"Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên
 * riêng**"*. Câu dưới đây là toàn bộ nội dung hộp xác nhận, nên nó phải nói đủ
 * ba điều: em nào · lớp nào · chuyện gì xảy ra với chỗ của em trong lớp.
 *
 * Ca `archived` nói thêm một câu về **quyền đọc**, vì đó là hệ quả duy nhất
 * người dùng không thể suy ra được từ màn hình: đóng ghi danh là cắt luôn đường
 * `app.class_scoped_student_ids()`, nên Giáo lý viên lớp cũ mất quyền xem hồ sơ
 * và sức khoẻ của em ngay lập tức (AC-F06, tiêu chí S-11). Không nói ra thì họ
 * sẽ báo "hệ thống mất hồ sơ của em".
 */
export function studentStatusConsequence(
  status: string,
  studentName: string,
  className: string | null,
  reason: string = STUDENT_CLOSE_REASONS[0],
): string {
  const head = `Chuyển hồ sơ của ${studentName} sang "${studentStatusLabel(status)}".`;

  if (isClosingStudentStatus(status)) {
    if (!className) {
      return `${head} Em hiện không có ghi danh nào đang mở nên không lớp nào bị ảnh hưởng.`;
    }
    const tail =
      status === "archived"
        ? ` Từ lúc đó, Giáo lý viên lớp ${className} không còn xem được hồ sơ và thông tin sức khoẻ của em.`
        : "";
    return `${head} Ghi danh ở lớp ${className} sẽ được kết thúc với lý do "${enrollmentStatusLabel(reason)}", và em rời khỏi sĩ số lớp.${tail}`;
  }

  if (status === "temporarily_inactive") {
    if (!className) return `${head} Em hiện không có ghi danh nào đang mở.`;
    return `${head} Ghi danh ở lớp ${className} cũng chuyển sang "Tạm nghỉ": em giữ nguyên chỗ trong lớp và vẫn được đếm trong sĩ số, ở phần "trong đó N tạm nghỉ".`;
  }

  if (!className) {
    return `${head} Em chưa có lớp trong năm học hiện hành — hãy ghi danh cho em ở tab "Lịch sử lớp".`;
  }
  return `${head} Ghi danh tạm nghỉ ở lớp ${className} sẽ được khôi phục về "Đang học".`;
}

/**
 * Câu **sau khi** thao tác xong. Khác câu xác nhận ở thì: một câu nói "sẽ xảy
 * ra", câu kia nói "đã xảy ra" — dùng chung một câu cho cả hai là để người dùng
 * bấm xong rồi vẫn không biết nó đã chạy hay chưa (D-61).
 *
 * `enrollmentAction` do cơ sở dữ liệu trả về chứ không do giao diện đoán: chỉ
 * `set_student_status` mới biết em có ghi danh mở hay không tại đúng thời điểm
 * ghi.
 */
export function studentStatusSavedText(
  status: string,
  studentName: string,
  className: string | null,
  enrollmentAction: string,
): string {
  const head = `Đã chuyển hồ sơ của ${studentName} sang "${studentStatusLabel(status)}".`;
  if (enrollmentAction === "closed" && className) {
    return `${head} Đã kết thúc ghi danh ở lớp ${className}; em không còn trong sĩ số lớp.`;
  }
  if (enrollmentAction === "paused" && className) {
    return `${head} Ghi danh ở lớp ${className} đã chuyển sang "Tạm nghỉ".`;
  }
  if (enrollmentAction === "resumed" && className) {
    return `${head} Đã khôi phục ghi danh ở lớp ${className}.`;
  }
  return `${head} Em không có ghi danh nào đang mở nên không lớp nào thay đổi.`;
}
