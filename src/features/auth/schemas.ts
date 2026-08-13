import { z } from "zod";
import { APP_ROLES, CLASS_ROLES, SECTOR_ROLES, STAFF_PROFILE_ROLES, type AppRole } from "@/lib/permissions/roles";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Hai mật khẩu chưa trùng khớp.",
    path: ["confirmPassword"],
  });

/**
 * TB-04 — đổi mật khẩu TỰ NGUYỆN (đóng M01-F02 / 5W-04).
 *
 * `changePasswordSchema` phía trên chỉ hỏi mật khẩu mới, đúng cho lần đăng nhập
 * ĐẦU (`must_change_password = true`): người dùng vừa nhận mật khẩu tạm nên hỏi
 * lại "mật khẩu hiện tại" là thừa. Nhưng một máy phòng học bỏ quên đang mở phiên
 * mà đổi được mật khẩu KHÔNG cần biết mật khẩu cũ là cách chiếm tài khoản vĩnh
 * viễn — cộng hưởng với việc trước M14 chưa có nút Đăng xuất. Bản tự nguyện vì
 * thế bắt buộc xác thực lại mật khẩu hiện tại, và mật khẩu mới phải KHÁC nó
 * (AC-03.2, AC-03.3).
 */
export const changePasswordWithCurrentSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    password: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Hai mật khẩu chưa trùng khớp.",
    path: ["confirmPassword"],
  })
  .refine(({ password, currentPassword }) => password !== currentPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    path: ["password"],
  });

const optionalUuid = z.string().uuid().nullable().optional();

/**
 * Cấp tài khoản tại `/admin` — sau M04-C chỉ còn dùng cho **trường hợp ngoại lệ**:
 * người không có hồ sơ Giáo lý viên (Cha sở · Cha phó · Phụ huynh · Thiếu nhi).
 *
 * D-111: mọi vai trò gắn hồ sơ nhân sự bị từ chối **ở tầng schema**, không chỉ ẩn
 * khỏi ô chọn — đường cấp tài khoản GLV là `provisionForStaffSchema` ở
 * `/staff/[staffId]`, nơi username/tên hiển thị suy từ hồ sơ chứ không nhận từ
 * client. Vì thế biểu mẫu này cũng không còn nhận `staffProfileId`.
 */
export const provisionAccountSchema = z.object({
  username: z.string().trim().min(1).max(50),
  displayName: z.string().trim().min(1).max(150),
  saintName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  role: z.enum(APP_ROLES),
  academicYearId: optionalUuid,
  sectorId: optionalUuid,
  classId: optionalUuid,
  guardianId: optionalUuid,
  studentId: optionalUuid,
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).superRefine((value, context) => {
  if (STAFF_PROFILE_ROLES.includes(value.role)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vai trò Giáo lý viên được cấp tại hồ sơ nhân sự, không phải tại trang Quản trị.",
      path: ["role"],
    });
  }
  if (SECTOR_ROLES.includes(value.role) && (!value.academicYearId || !value.sectorId || value.classId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role ngành cần năm học và ngành.", path: ["sectorId"] });
  }
  if (CLASS_ROLES.includes(value.role) && (!value.academicYearId || !value.classId || value.sectorId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role lớp cần năm học và lớp.", path: ["classId"] });
  }
  if (value.role === "guardian" && !value.guardianId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Tài khoản phụ huynh cần liên kết hồ sơ phụ huynh.", path: ["guardianId"] });
  }
  if (value.role === "student" && !value.studentId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Tài khoản thiếu nhi cần liên kết hồ sơ thiếu nhi.", path: ["studentId"] });
  }
  if (value.role !== "guardian" && value.guardianId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Chỉ role phụ huynh được liên kết hồ sơ phụ huynh.", path: ["guardianId"] });
  }
  if (value.role !== "student" && value.studentId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Chỉ role thiếu nhi được liên kết hồ sơ thiếu nhi.", path: ["studentId"] });
  }
  if (![...SECTOR_ROLES, ...CLASS_ROLES].includes(value.role) && (value.academicYearId || value.sectorId || value.classId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role toàn cục không nhận phạm vi.", path: ["role"] });
  }
});

/**
 * Ràng buộc hình dạng phạm vi (năm học/ngành/lớp) theo loại vai trò, dùng chung
 * cho `provisionForStaffSchema` (M01-B / TB-01) và `assignPrimaryRoleSchema`
 * (TB-05). Chỉ nhận vai trò GẮN HỒ SƠ NHÂN SỰ — điều này tự động loại `super_admin`
 * (trần tuyệt đối D-102 ở tầng schema) lẫn `guardian`/`student` khỏi hai luồng này.
 */
function refineStaffRoleScope(
  value: { role: AppRole; academicYearId?: string | null; sectorId?: string | null; classId?: string | null },
  ctx: z.RefinementCtx,
): void {
  if (!STAFF_PROFILE_ROLES.includes(value.role)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vai trò này không cấp được tại hồ sơ Giáo lý viên.", path: ["role"] });
    return;
  }
  if (SECTOR_ROLES.includes(value.role) && (!value.academicYearId || !value.sectorId || value.classId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vai trò ngành cần năm học và ngành.", path: ["sectorId"] });
  }
  if (CLASS_ROLES.includes(value.role) && (!value.academicYearId || !value.classId || value.sectorId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vai trò lớp cần năm học và lớp.", path: ["classId"] });
  }
  const isScoped = SECTOR_ROLES.includes(value.role) || CLASS_ROLES.includes(value.role);
  if (!isScoped && (value.academicYearId || value.sectorId || value.classId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vai trò toàn cục không nhận phạm vi.", path: ["role"] });
  }
}

/**
 * TB-01 — cấp tài khoản ngay tại hồ sơ GLV. Payload GỌN: username/tên hiển thị
 * được suy ra từ `staff_profiles` phía máy chủ, client không gửi (không tin được).
 */
export const provisionForStaffSchema = z
  .object({
    staffProfileId: z.string().uuid("Hồ sơ nhân sự không hợp lệ."),
    role: z.enum(APP_ROLES),
    academicYearId: optionalUuid,
    sectorId: optionalUuid,
    classId: optionalUuid,
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ."),
  })
  .superRefine(refineStaffRoleScope);

/** TB-05 — đổi vai trò chính của một tài khoản đã có, giữ đăng nhập. */
export const assignPrimaryRoleSchema = z
  .object({
    profileId: z.string().uuid("Tài khoản không hợp lệ."),
    role: z.enum(APP_ROLES),
    academicYearId: optionalUuid,
    sectorId: optionalUuid,
    classId: optionalUuid,
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ."),
  })
  .superRefine(refineStaffRoleScope);

export const accountIdSchema = z.string().uuid("Tài khoản không hợp lệ.");
export const accountStatusSchema = z.enum(["active", "locked", "disabled"]);
/**
 * Q4 (D-103) — giao diện chỉ đặt được hai trạng thái. Enum ở DB vẫn còn `locked`
 * để dữ liệu cũ không vỡ, nhưng không có màn hình nào phân biệt `locked` với
 * `disabled`, nên bộ đặt trạng thái CHỈ nhận `active`/`disabled` — người quản trị
 * không vô tình đẩy một tài khoản vào trạng thái không lối ra.
 */
export const accountStatusUpdateSchema = z.enum(["active", "disabled"]);
export const adminUsernameSchema = z.string().trim().min(1, "Tên đăng nhập không được để trống.").max(50);
export const adminPasswordSchema = z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.").max(128);

export type LoginValues = z.infer<typeof loginSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ChangePasswordWithCurrentValues = z.infer<typeof changePasswordWithCurrentSchema>;
/**
 * Đầu vào chung của `changeOwnPassword`: `currentPassword` chỉ có mặt ở chế độ
 * tự nguyện. Action tự chọn schema đúng theo `mustChangePassword` của phiên.
 */
export type ChangeOwnPasswordInput = {
  currentPassword?: string;
  password: string;
  confirmPassword: string;
};
export type ProvisionAccountInput = z.infer<typeof provisionAccountSchema>;
export type ProvisionForStaffInput = z.infer<typeof provisionForStaffSchema>;
export type AssignPrimaryRoleInput = z.infer<typeof assignPrimaryRoleSchema>;
