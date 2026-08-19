/**
 * Nhãn tiếng Việt của hồ sơ thiếu nhi — M03-A.
 *
 * Trước đợt này bốn từ điển nhãn được **chép tay ở hai trang** (`/students` và
 * `/students/[studentId]`) — cùng nội dung, hai bản. Hai bản là hai chỗ để lệch
 * nhau, và đúng loại lệch không ai phát hiện ra: một trang gọi `archived` là "Lưu
 * trữ", trang kia đổi thành thứ khác thì chẳng bài kiểm thử nào đỏ.
 *
 * ⚠️ `student_status` (danh tính) **khác** `enrollment_status` (tham gia lớp) — hai
 * trục trạng thái độc lập, và cả hai đều có một giá trị đọc lên nghe giống nhau:
 * `students.temporarily_inactive` và `enrollments.paused` cùng hiện chữ "Tạm nghỉ".
 * Việc chúng **không** ràng buộc nhau chính là lỗi F06 (5W-F06), và được sửa ở
 * **M03-C** chứ không phải ở đây.
 *
 * File thuần, không import gì ⇒ kiểm được bằng unit test.
 */

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: "Đang sinh hoạt",
  temporarily_inactive: "Tạm nghỉ",
  withdrawn: "Đã rút",
  archived: "Lưu trữ",
};

export function studentStatusLabel(status: string): string {
  return STUDENT_STATUS_LABELS[status] ?? status;
}

export const GENDER_LABELS: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

/** IMP-BULK-002 — `null` là câu trả lời hợp lệ, và phải ĐỌC RA được như thế. */
export function genderLabel(gender: string | null): string {
  if (gender === null || gender === "") return "chưa rõ";
  return GENDER_LABELS[gender] ?? gender;
}

/**
 * M08-B — bảng nhãn bí tích chuyển sang `@/lib/sacraments` vì module Chuyển lớp
 * cũng cần nó (D-161). **Xuất lại nguyên tên cũ** nên mọi lượt import hiện có
 * không đổi; chỉ có một bảng nhãn trong hệ thống. Xem đầu file đó để biết vì sao
 * không cho `features/promotions` import thẳng vào đây.
 */
export { SACRAMENT_LABELS, sacramentLabel } from "@/lib/sacraments";
