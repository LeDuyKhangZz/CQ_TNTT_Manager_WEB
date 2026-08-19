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

/**
 * 🔴 IMP-BULK-002 — `phone` có thể trống **ở màn hình sửa**, không phải ở màn
 * hình tạo. Hồ sơ phụ huynh nhập hàng loạt từ sổ có thể mới chỉ có tên, và đây
 * chính là biểu mẫu người ta mở ra để **điền số vào**; bắt buộc ở đây thì không
 * sửa nổi cả cái tên viết sai cho tới khi xin được số.
 *
 * ⚠️ Không có số thì phụ huynh **không cấp được tài khoản** (tên đăng nhập của
 * phụ huynh chính là số điện thoại — `adminProvisionAccount`), nên đây vẫn là ô
 * đáng điền nhất trên biểu mẫu, chỉ không còn là hàng rào.
 */
export const updateGuardianSchema = createGuardianSchema
  .omit({ confirmDuplicate: true })
  .partial()
  .extend({
    id: z.string().uuid("Phụ huynh không hợp lệ."),
    phone: z.string().trim().max(20).nullable().optional(),
  });

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
