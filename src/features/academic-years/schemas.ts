import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD.");

export const academicYearInputSchema = z.object({
  code: z.string().trim().regex(/^\d{4}-\d{4}$/, "Mã năm học phải có dạng 2026-2027."),
  name: z.string().trim().min(1, "Vui lòng nhập tên năm học.").max(100),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  top5Enabled: z.boolean().default(false),
  attendanceLockDays: z.coerce.number().int().min(0).max(30).default(3),
  attendanceEditLeaseMinutes: z.coerce.number().int().min(1).max(60).default(15),
}).refine(({ startDate, endDate }) => endDate > startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu.",
  path: ["endDate"],
});

export const academicYearIdSchema = z.string().uuid("Năm học không hợp lệ.");

export const updateClassSchema = z.object({
  id: z.string().uuid("Lớp không hợp lệ."),
  status: z.enum(["active", "inactive", "closed"]),
  meetingLocation: z.string().trim().max(200).nullable(),
  notes: z.string().trim().max(1000).nullable(),
});

export type AcademicYearInput = z.infer<typeof academicYearInputSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
