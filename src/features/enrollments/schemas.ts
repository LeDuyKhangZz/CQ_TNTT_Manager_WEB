import { z } from "zod";
import { CLOSE_ENROLLMENT_REASONS } from "./enrollment-status";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ.");
const nullableNotes = z
  .string()
  .trim()
  .max(1000)
  .transform((value) => value || null)
  .nullable();

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  classId: z.string().uuid("Lớp không hợp lệ."),
  enrolledOn: isoDate,
  notes: nullableNotes,
});

const enrollmentIdSchema = z.object({
  enrollmentId: z.string().uuid("Ghi danh không hợp lệ."),
});

/**
 * TB-F10 / BR-M03-N01 — "Tạm nghỉ" và "Khôi phục" **không nhận ngày kết thúc**.
 *
 * 🔴 Đây là dòng sửa lỗi CRITICAL F10. Bản cũ gộp `paused` vào cùng một schema với
 * các trạng thái đóng, mà schema đó bắt buộc có `endedOn` — nên mọi lượt "Tạm nghỉ"
 * đều gửi kèm một ngày và **luôn** vi phạm CHECK `enrollments_open_has_no_end`
 * (`20260716000500:19-20`). Không có ô nào để gửi ngày thì không có cách nào vi phạm.
 */
export const pauseEnrollmentSchema = enrollmentIdSchema;
export const resumeEnrollmentSchema = enrollmentIdSchema;

/**
 * BR-M03-N02 — trạng thái đóng, bắt buộc có `ended_on`. Danh sách lấy thẳng từ
 * `enrollment-status.ts` để **một chỗ duy nhất** định nghĩa "thế nào là đóng"; hai
 * bản chép tay chính là gốc rễ của F10.
 */
export const closeEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid("Ghi danh không hợp lệ."),
  status: z.enum(CLOSE_ENROLLMENT_REASONS),
  endedOn: isoDate,
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type PauseEnrollmentInput = z.infer<typeof pauseEnrollmentSchema>;
export type ResumeEnrollmentInput = z.infer<typeof resumeEnrollmentSchema>;
export type CloseEnrollmentInput = z.infer<typeof closeEnrollmentSchema>;
