import { z } from "zod";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ.");
const nullableIsoDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Ngày không hợp lệ.")
  .transform((value) => value || null)
  .nullable();

export const SACRAMENT_TYPES = [
  "baptism",
  "first_confession",
  "first_communion",
  "confirmation",
  "profession",
  "other",
] as const;

export const createStudentSchema = z.object({
  guardianId: z.string().uuid("Vui lòng chọn phụ huynh."),
  saintName: z.string().trim().min(1, "Vui lòng nhập tên thánh.").max(100),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên.").max(150),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: isoDate,
  patronFeastDate: nullableIsoDate,
  address: nullableText(500),
  phone: nullableText(20),
  hardshipFlag: z.boolean().default(false),
  generalNotes: nullableText(1000),
  status: z
    .enum(["active", "temporarily_inactive", "withdrawn", "archived"])
    .default("active"),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().uuid("Thiếu nhi không hợp lệ."),
});

export const healthProfileSchema = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  allergies: nullableText(1000),
  medicalConditions: nullableText(1000),
  medications: nullableText(1000),
  emergencyNotes: nullableText(1000),
});

export const createSacramentSchema = z
  .object({
    studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
    sacramentType: z.enum(SACRAMENT_TYPES),
    sacramentName: nullableText(150),
    sacramentDate: nullableIsoDate,
    place: nullableText(200),
    registryNumber: nullableText(100),
    godparentName: nullableText(150),
    notes: nullableText(1000),
  })
  .refine(
    (value) => value.sacramentType !== "other" || Boolean(value.sacramentName),
    { message: "Vui lòng nhập tên bí tích khác.", path: ["sacramentName"] },
  );

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type HealthProfileInput = z.infer<typeof healthProfileSchema>;
export type CreateSacramentInput = z.infer<typeof createSacramentSchema>;
