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
  /**
   * STAFF-COMP-001 — người này LÀ GÌ trong xứ đoàn. Mặc định `khac`
   * ("Chưa phân loại") chứ không phải `huynh_truong`: đoán bừa ở đây là ghi sai
   * về một người thật vào đúng cột sinh ra để nói đúng về họ.
   *
   * 🔴 Chỉ có tác dụng lúc TẠO. Cột này quyết tiền tố mã hồ sơ ở trigger
   * `staff_profiles_assign_code`, mà mã thì cấp một lần và không đổi — sửa thành
   * phần của hồ sơ đã có KHÔNG đánh lại mã, vì mã nhân sự cũng là tên đăng nhập.
   */
  component: z
    .enum(["huynh_truong", "du_truong", "nu_tu", "chung_sinh", "linh_muc", "tro_ta", "khac"])
    .default("khac"),
  serviceStatus: z.enum(["active", "paused", "inactive"]).default("active"),
  /**
   * TB-M04-03 — "Vẫn tạo hồ sơ mới". Cảnh báo trùng là MỀM: pha một trả về danh
   * sách nghi trùng, pha hai chạy lại đúng dữ liệu đó với cờ này bật. Không có
   * ràng buộc `unique` nào phía DB (AC-05.2), nên cờ này là toàn bộ cơ chế —
   * mặc định `false` để một lời gọi quên truyền vẫn đi qua bước cảnh báo.
   */
  confirmDuplicate: z.boolean().default(false),
});

/**
 * 🔴 IMP-BULK-002 — `phone` ở đây nới thành **có thể trống**, còn
 * `createStaffSchema` thì KHÔNG. Hai ô trông giống nhau nhưng đứng trước hai
 * tình huống khác nhau: gõ tay một người mới thì phải có số để liên lạc, còn
 * màn hình sửa lại thường xuyên mở trên hồ sơ **vừa nhập hàng loạt từ sổ**, nơi
 * ô số điện thoại vốn đã trống. Bắt buộc ở đó nghĩa là không ai sửa nổi tên
 * thánh của một người cho tới khi xin được số của họ.
 */
export const updateStaffSchema = createStaffSchema.partial().extend({
  id: z.string().uuid("Nhân sự không hợp lệ."),
  phone: z.string().trim().max(20).nullable().optional(),
  /**
   * BDH-2025-002 — chức vụ theo sổ Ban Điều Hành. KHÔNG có ở `createStaffSchema`:
   * lúc gõ một hồ sơ mới thì chưa ai bổ nhiệm người đó, và ép chọn ở đó chỉ tạo
   * thêm một ô để bỏ trống.
   *
   * Danh sách enum ở đây là bản sao TypeScript của ràng buộc
   * `staff_profiles_appointment_shape`: sáu chức vụ, không có vai trò lớp (đã suy
   * được từ phân công), không có `super_admin` (trần tuyệt đối D-102). Cột này
   * KHÔNG cấp quyền — nó chỉ điền sẵn ô chọn ở khối Tài khoản.
   */
  appointedRole: z
    .enum(["group_leader", "deputy_group_leader", "secretary", "treasurer", "sector_leader", "sector_deputy"])
    .nullable()
    .optional(),
  appointedSectorId: z.string().uuid("Ngành không hợp lệ.").nullable().optional(),
})
  /**
   * Cặp chức vụ ↔ ngành phải khớp NGAY Ở ĐÂY, không để cơ sở dữ liệu trả lời hộ:
   * ràng buộc CHECK ném một `23514` trần và `updateStaff` sẽ đổi nó thành
   * "Không cập nhật được hồ sơ", tức người dùng không bao giờ biết mình quên
   * chọn ngành. Chỉ kiểm khi `appointedRole` thực sự được gửi lên — biểu mẫu này
   * là `partial()`, mọi lượt gọi khác không đụng tới hai ô này.
   */
  .superRefine((value, ctx) => {
    if (value.appointedRole === undefined) return;
    const needsSector =
      value.appointedRole === "sector_leader" || value.appointedRole === "sector_deputy";
    if (needsSector && !value.appointedSectorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointedSectorId"],
        message: "Chức vụ Trưởng/Phó ngành phải kèm ngành.",
      });
    }
    if (!needsSector && value.appointedSectorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appointedSectorId"],
        message: "Chức vụ toàn xứ đoàn không nhận phạm vi ngành.",
      });
    }
  });

/**
 * IMP-BULK-002 — người dùng tự sửa **hồ sơ của chính mình**. Bốn ô, không có
 * `id`: id lấy từ phiên đăng nhập ở máy chủ, không nhận từ biểu mẫu. Nhận một
 * `id` ở đây là mở đúng cánh cửa mà policy `staff_profiles_update_self` vừa
 * đóng — client sửa một chữ trong DOM là sửa hồ sơ người khác.
 *
 * Cả bốn ô đều được phép trống: đây là biểu mẫu để **điền dần**, không phải một
 * cổng nghiệm thu. Trống thì hồ sơ vẫn nằm trong danh sách còn thiếu.
 */
export const ownStaffContactSchema = z.object({
  phone: z.string().trim().max(20).nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ.").nullable(),
  address: nullableText(500),
  email: z.string().trim().email("Email không hợp lệ.").nullable(),
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

export type OwnStaffContactInput = z.infer<typeof ownStaffContactSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type DeleteStaffInput = z.infer<typeof deleteStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type TransferClassStaffInput = z.infer<typeof transferClassStaffSchema>;
