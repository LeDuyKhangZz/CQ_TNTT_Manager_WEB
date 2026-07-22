import { z } from "zod";
import { APP_ROLES, CLASS_ROLES, SECTOR_ROLES, STAFF_PROFILE_ROLES } from "@/lib/permissions/roles";

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

const optionalUuid = z.string().uuid().nullable().optional();

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
  staffProfileId: optionalUuid,
  guardianId: optionalUuid,
  studentId: optionalUuid,
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).superRefine((value, context) => {
  if (SECTOR_ROLES.includes(value.role) && (!value.academicYearId || !value.sectorId || value.classId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role ngành cần năm học và ngành.", path: ["sectorId"] });
  }
  if (CLASS_ROLES.includes(value.role) && (!value.academicYearId || !value.classId || value.sectorId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role lớp cần năm học và lớp.", path: ["classId"] });
  }
  if (STAFF_PROFILE_ROLES.includes(value.role) && !value.staffProfileId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role Giáo lý viên cần liên kết hồ sơ nhân sự.", path: ["staffProfileId"] });
  }
  if (!STAFF_PROFILE_ROLES.includes(value.role) && value.staffProfileId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Role này không liên kết hồ sơ Giáo lý viên tại biểu mẫu này.", path: ["staffProfileId"] });
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

export const accountIdSchema = z.string().uuid("Tài khoản không hợp lệ.");
export const accountStatusSchema = z.enum(["active", "locked", "disabled"]);
export const adminUsernameSchema = z.string().trim().min(1, "Tên đăng nhập không được để trống.").max(50);
export const adminPasswordSchema = z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.").max(128);

export type LoginValues = z.infer<typeof loginSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProvisionAccountInput = z.infer<typeof provisionAccountSchema>;
