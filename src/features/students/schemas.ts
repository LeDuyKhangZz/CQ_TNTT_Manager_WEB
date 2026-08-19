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

/** UUID tuỳ chọn: ô `<select>` để trống gửi lên chuỗi rỗng, không phải `undefined`. */
const optionalUuid = (message: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
      message,
    )
    .transform((value) => value || null)
    .nullable();

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
  /**
   * D-123 / TB-F02-F09 — lớp ghi danh ngay khi tạo hồ sơ. Để trống là hợp lệ ở
   * tầng này; ràng buộc "Trưởng/Phó ngành **bắt buộc** chọn lớp" nằm ở cơ sở dữ
   * liệu (`create_student_with_enrollment`) vì chỉ ở đó mới biết vai trò thật
   * của người gọi. Zod không được là nơi duy nhất giữ một luật phân quyền.
   */
  classId: optionalUuid("Lớp không hợp lệ.").default(null),
  /**
   * TB-F13 pha hai. **Không phải một ràng buộc** mà là chữ ký "tôi đã xem cảnh
   * báo trùng rồi" (BR-M03-N08 — cảnh báo mềm, người nhập luôn được đi tiếp).
   */
  confirmDuplicate: z.boolean().default(false),
});

/**
 * 🔴 **`status` bị loại khỏi đây từ M03-C** (TB-F06 bước 1).
 *
 * Trước đợt này ô "Trạng thái" nằm chung nút "Lưu thay đổi" với tên thánh và số
 * điện thoại — điểm trừ C5 = 2 của biên bản audit. Hai hệ quả, cái sau nặng hơn
 * cái trước:
 *
 *   1. Một cú chọn nhầm trong `<select>` là lưu trữ một em, không hỏi gì.
 *   2. Biểu mẫu **không còn ô đó** mà schema vẫn nhận `status`, thì
 *      `formData.get("status") ?? "active"` sẽ **âm thầm đặt mọi em về "Đang
 *      sinh hoạt"** mỗi lần ai đó sửa số điện thoại. Loại hẳn khỏi schema là
 *      cách duy nhất khiến lỗi ấy không thể xảy ra.
 *
 * Đổi trạng thái nay đi qua `setStudentStatusSchema` + `public.set_student_status`.
 */
/**
 * 🔴 IMP-BULK-002 — `gender` và `dateOfBirth` nới thành **có thể trống ở đây,
 * nhưng KHÔNG ở `createStudentSchema`**. Cùng lý do với `updateStaffSchema`:
 * gõ tay một em mới thì người nhập đang cầm tờ sơ yếu lý lịch trong tay, còn
 * màn hình sửa mở thường xuyên trên hồ sơ **vừa nhập hàng loạt từ sổ**, nơi hai
 * ô ấy vốn đã trống. Bắt buộc ở đó nghĩa là không sửa nổi địa chỉ của một em
 * cho tới khi tra ra ngày sinh của em.
 *
 * 🔴 Và ô giới tính phải có lựa chọn "chưa rõ" thật (`""` ⇒ null). Một
 * `<select>` không có lựa chọn trống thì trình duyệt hiện sẵn "Nam", nên chỉ
 * cần ai đó bấm Lưu để sửa số điện thoại là một em chưa rõ giới tính **bị ghi
 * thành Nam** mà không ai chọn gì cả.
 */
export const updateStudentSchema = createStudentSchema
  .omit({ classId: true, confirmDuplicate: true, status: true })
  .partial()
  .extend({
    id: z.string().uuid("Thiếu nhi không hợp lệ."),
    gender: z.enum(["male", "female", "other"]).nullable().optional(),
    dateOfBirth: nullableIsoDate.optional(),
  });

export const healthProfileSchema = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  allergies: nullableText(1000),
  medicalConditions: nullableText(1000),
  medications: nullableText(1000),
  emergencyNotes: nullableText(1000),
});

/**
 * Tách phần **object** ra khỏi `.refine()` vì `ZodEffects` không có `.extend()`.
 * TB-F08 cần đúng cùng bộ trường ấy kèm thêm một `id` tuỳ chọn; chép lại tám
 * dòng trường là dựng hai định nghĩa cho một biểu mẫu.
 */
const sacramentFields = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  sacramentType: z.enum(SACRAMENT_TYPES),
  sacramentName: nullableText(150),
  sacramentDate: nullableIsoDate,
  place: nullableText(200),
  registryNumber: nullableText(100),
  godparentName: nullableText(150),
  notes: nullableText(1000),
});

/** BR-M03-25 — loại `other` bắt buộc có tên tự nhập. */
function requireOtherName(value: {
  sacramentType: string;
  sacramentName: string | null;
}): boolean {
  return value.sacramentType !== "other" || Boolean(value.sacramentName);
}
const OTHER_NAME_ISSUE = {
  message: "Vui lòng nhập tên bí tích khác.",
  path: ["sacramentName"],
};

export const createSacramentSchema = sacramentFields.refine(requireOtherName, OTHER_NAME_ISSUE);

/**
 * **TB-F08 / AC-F08-01** — `upsertStudentSacrament` như `docs/11` §3 đòi từ đầu:
 * có `id` ⇒ sửa, không có ⇒ thêm mới. Nhập sai một lần là vĩnh viễn chính là
 * điểm trừ C1 = 3 của luồng F08.
 */
export const upsertSacramentSchema = sacramentFields
  .extend({ id: optionalUuid("Bản ghi bí tích không hợp lệ.").default(null) })
  .refine(requireOtherName, OTHER_NAME_ISSUE);

/** **D-128** — xoá một bản ghi bí tích. `studentId` để làm mới đúng trang. */
export const deleteSacramentSchema = z.object({
  id: z.string().uuid("Bản ghi bí tích không hợp lệ."),
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
});

/**
 * **TB-F06 / BR-M03-N14 / D-130** — đổi trạng thái hồ sơ là một thao tác RIÊNG,
 * không còn là một ô trong biểu mẫu "Cập nhật hồ sơ".
 *
 * `closeEnrollment` mặc định `false` có chủ đích: mặc định `true` là đóng ghi
 * danh của một em vì người dùng quên bỏ tick — BR-M03-N12 đòi họ **nhìn thấy
 * tên lớp rồi mới đồng ý**.
 */
export const setStudentStatusSchema = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  status: z.enum(["active", "temporarily_inactive", "withdrawn", "archived"]),
  closeEnrollment: z.boolean().default(false),
  reason: z.enum(["withdrawn", "completed", "transferred", "repeating"]).default("withdrawn"),
  endedOn: nullableIsoDate,
});

/**
 * **TB-F12 / BR-M03-N16** — đổi người giám hộ của một em.
 *
 * Schema riêng chứ không dùng `updateStudentSchema` (vốn đã nhận `guardianId`):
 * thao tác này **đổi ngay quyền đọc** của hai tài khoản phụ huynh, nên nó phải
 * có một cửa vào riêng, một hộp xác nhận riêng và một câu phản hồi riêng. Đi
 * chung đường với "sửa số điện thoại" là để nó trôi qua mà không ai xác nhận.
 */
export const changeGuardianSchema = z.object({
  studentId: z.string().uuid("Thiếu nhi không hợp lệ."),
  guardianId: z.string().uuid("Vui lòng chọn phụ huynh."),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type HealthProfileInput = z.infer<typeof healthProfileSchema>;
export type CreateSacramentInput = z.infer<typeof createSacramentSchema>;
export type UpsertSacramentInput = z.infer<typeof upsertSacramentSchema>;
export type DeleteSacramentInput = z.infer<typeof deleteSacramentSchema>;
export type SetStudentStatusInput = z.infer<typeof setStudentStatusSchema>;
export type ChangeGuardianInput = z.infer<typeof changeGuardianSchema>;
