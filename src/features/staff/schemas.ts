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
  /**
   * TB-M04-03 — "Vẫn tạo hồ sơ mới". Cảnh báo trùng là MỀM: pha một trả về danh
   * sách nghi trùng, pha hai chạy lại đúng dữ liệu đó với cờ này bật. Không có
   * ràng buộc `unique` nào phía DB (AC-05.2), nên cờ này là toàn bộ cơ chế —
   * mặc định `false` để một lời gọi quên truyền vẫn đi qua bước cảnh báo.
   */
  confirmDuplicate: z.boolean().default(false),
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

/**
 * Chuyển lớp một bước (D-105). Không có trường `role`: vai trò đăng nhập được
 * RPC suy ra từ `capacity` bằng bảng cứng, nên không tồn tại đường nào để client
 * gợi ý một vai trò — trần vai trò D-102 ở đây là chính hình dạng dữ liệu.
 */
export const transferClassStaffSchema = z.object({
  assignmentId: z.string().uuid("Phân công không hợp lệ."),
  newClassId: z.string().uuid("Lớp mới không hợp lệ."),
  capacity: z.enum(["representative", "member", "trainee"]),
  effectiveOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày hiệu lực không hợp lệ."),
});

/**
 * Xóa hồ sơ chưa từng dùng (D-106/D-109). `confirmName` là họ tên người dùng gõ
 * lại; DB mới là nơi so (`delete_unused_staff_profile`), ở đây chỉ chặn chuỗi rỗng.
 */
export const deleteStaffSchema = z.object({
  id: z.string().uuid("Nhân sự không hợp lệ."),
  confirmName: z.string().trim().min(1, "Vui lòng gõ lại họ tên để xác nhận."),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type DeleteStaffInput = z.infer<typeof deleteStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type TransferClassStaffInput = z.infer<typeof transferClassStaffSchema>;
