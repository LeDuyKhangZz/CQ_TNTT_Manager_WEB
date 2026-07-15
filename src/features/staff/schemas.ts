import { z } from "zod";

const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const createStaffSchema = z.object({
  title: z.enum(["anh", "chi", "di", "so", "cha", "thay", "other"]),
  saintName: nullableText(100),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên.").max(150),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại.").max(20),
  email: z.string().trim().email().nullable(),
  address: nullableText(500),
  formationLevel: z.enum(["none", "i", "ii", "iii", "special"]),
  serviceStatus: z.enum(["active", "paused", "inactive"]).default("active"),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  id: z.string().uuid("Nhân sự không hợp lệ."),
});

export const assignStaffSchema = z.object({
  staffProfileId: z.string().uuid("Nhân sự không hợp lệ."),
  classId: z.string().uuid("Lớp không hợp lệ."),
  capacity: z.enum(["representative", "member", "trainee"]),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const endStaffAssignmentSchema = z.object({
  assignmentId: z.string().uuid("Phân công không hợp lệ."),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
