import { z } from "zod";

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

// Statuses that close an open enrollment (D-11: only one open enrollment/year).
export const CLOSE_ENROLLMENT_STATUSES = [
  "completed",
  "withdrawn",
  "transferred",
  "paused",
  "repeating",
] as const;

export const endEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid("Ghi danh không hợp lệ."),
  status: z.enum(CLOSE_ENROLLMENT_STATUSES),
  endedOn: isoDate,
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type EndEnrollmentInput = z.infer<typeof endEnrollmentSchema>;
