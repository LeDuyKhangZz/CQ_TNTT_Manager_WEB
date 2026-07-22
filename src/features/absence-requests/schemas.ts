import { z } from "zod";
import { meetingTypeForDate } from "@/features/attendance/constants";

export const ABSENCE_REQUEST_STATUS_LABELS = {
  pending: "Đang chờ",
  acknowledged: "Đã ghi nhận",
  cancelled: "Đã hủy",
} as const;

export const createAbsenceRequestSchema = z
  .object({
    studentId: z.string().uuid("Vui lòng chọn con của bạn."),
    absenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ."),
    reason: z.string().trim().min(1, "Vui lòng nhập lý do.").max(500, "Lý do tối đa 500 ký tự."),
  })
  // Buổi suy ra từ ngày thay vì bắt phụ huynh chọn: chỉ có hai khả năng (D-29).
  .refine((value) => meetingTypeForDate(value.absenceDate) !== null, {
    message: "Xứ đoàn chỉ sinh hoạt thứ Năm và Chúa nhật.",
    path: ["absenceDate"],
  });

export const absenceRequestIdSchema = z.object({
  requestId: z.string().uuid("Đơn không hợp lệ."),
});

export const acknowledgeAbsenceRequestSchema = absenceRequestIdSchema.extend({
  staffNote: z
    .string()
    .trim()
    .max(500, "Ghi chú tối đa 500 ký tự.")
    .transform((value) => value || null)
    .nullable()
    .default(null),
});

export type CreateAbsenceRequestInput = z.infer<typeof createAbsenceRequestSchema>;
export type AcknowledgeAbsenceRequestInput = z.infer<typeof acknowledgeAbsenceRequestSchema>;
