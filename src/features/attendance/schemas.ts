import { z } from "zod";
import { ATTENDANCE_STATUS_ORDER, STAFF_ATTENDANCE_STATUS_ORDER } from "./constants";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ.");
const note = z
  .string()
  .trim()
  .max(500, "Ghi chú tối đa 500 ký tự.")
  .transform((value) => value || null)
  .nullable()
  .default(null);

export const attendanceStatusSchema = z.enum(
  ATTENDANCE_STATUS_ORDER as unknown as [string, ...string[]],
);
export const staffAttendanceStatusSchema = z.enum(
  STAFF_ATTENDANCE_STATUS_ORDER as unknown as [string, ...string[]],
);

export const claimSessionSchema = z.object({
  classId: z.string().uuid("Vui lòng chọn lớp."),
  date: isoDate,
  meetingType: z.enum(["thursday", "sunday"]),
});

export const studentAttendanceEntrySchema = z.object({
  enrollmentId: z.string().uuid(),
  massStatus: attendanceStatusSchema,
  catechismStatus: attendanceStatusSchema,
  note,
});

export const staffAttendanceEntrySchema = z.object({
  classStaffAssignmentId: z.string().uuid(),
  status: staffAttendanceStatusSchema,
  note,
});

export const saveAttendanceSchema = z.object({
  sessionId: z.string().uuid("Buổi điểm danh không hợp lệ."),
  students: z.array(studentAttendanceEntrySchema).max(300),
  staff: z.array(staffAttendanceEntrySchema).max(50),
  finalize: z.boolean(),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid("Buổi điểm danh không hợp lệ."),
});

export type ClaimSessionInput = z.infer<typeof claimSessionSchema>;
export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
export type StudentAttendanceEntry = z.infer<typeof studentAttendanceEntrySchema>;
export type StaffAttendanceEntry = z.infer<typeof staffAttendanceEntrySchema>;
