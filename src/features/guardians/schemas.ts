import { z } from "zod";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();

export const createGuardianSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên phụ huynh.").max(150),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại.").max(20),
  address: nullableText(500),
  status: z.enum(["active", "inactive"]).default("active"),
  /** BR-M03-N09 pha hai — "tôi đã xem danh sách nghi trùng rồi". */
  confirmDuplicate: z.boolean().default(false),
});

export const updateGuardianSchema = createGuardianSchema
  .omit({ confirmDuplicate: true })
  .partial()
  .extend({
    id: z.string().uuid("Phụ huynh không hợp lệ."),
  });

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
