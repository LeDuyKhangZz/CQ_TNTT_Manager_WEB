import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD.");

/**
 * Mốc kết thúc học kỳ 1 — **D-71**, và **D-116**: chủ dự án chốt 2026-07-25 là
 * **không bắt buộc**. Ô trống trên biểu mẫu về đây thành `null`, không thành lỗi.
 *
 * Bắt buộc thì năm học `2026-2027` đang chạy — tạo ra trước khi có trường này —
 * không có cách nào hợp lệ hoá được, và mọi bản ghi cũ hoá thành dữ liệu sai.
 */
const optionalIsoDateSchema = z
  .union([isoDateSchema, z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));

/**
 * Mốc HK1 phải nằm **hẳn bên trong** năm học — cùng luật với CHECK constraint
 * `academic_years_semester_1_range` của migration `20260725000400`.
 *
 * 🔴 Kiểm ở cả hai tầng có chủ ý: tầng Zod để người dùng nhận câu tiếng Việt nói rõ
 * sai ở đâu, tầng cơ sở dữ liệu để đường đi không qua biểu mẫu (Data API, script)
 * cũng không lọt. Bỏ tầng Zod thì người gõ sai chỉ nhận được mã lỗi `23514` khô
 * khốc; bỏ tầng DB thì ràng buộc chỉ là lời hứa của giao diện.
 */
function refineSemester1<T extends { startDate: string; endDate: string; semester1EndDate: string | null }>(
  value: T,
): boolean {
  if (!value.semester1EndDate) return true;
  return value.semester1EndDate > value.startDate && value.semester1EndDate < value.endDate;
}

const SEMESTER_1_RANGE_MESSAGE =
  "Ngày kết thúc học kỳ 1 phải nằm trong năm học, sau ngày bắt đầu và trước ngày kết thúc.";

export const academicYearInputSchema = z.object({
  code: z.string().trim().regex(/^\d{4}-\d{4}$/, "Mã năm học phải có dạng 2026-2027."),
  name: z.string().trim().min(1, "Vui lòng nhập tên năm học.").max(100),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  semester1EndDate: optionalIsoDateSchema,
  top5Enabled: z.boolean().default(false),
  attendanceLockDays: z.coerce.number().int().min(0).max(30).default(3),
  attendanceEditLeaseMinutes: z.coerce.number().int().min(1).max(60).default(15),
}).refine(({ startDate, endDate }) => endDate > startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu.",
  path: ["endDate"],
}).refine(refineSemester1, {
  message: SEMESTER_1_RANGE_MESSAGE,
  path: ["semester1EndDate"],
});

/**
 * Sửa riêng mốc HK1 của một năm học đã tồn tại (D-116 — "sửa được sau").
 *
 * Ngày bắt đầu/kết thúc đi kèm **không** để người dùng gõ: biểu mẫu đọc chúng từ
 * chính bản ghi và gửi lại làm ô ẩn, để câu kiểm khoảng thời gian nói được lỗi ngay
 * tại chỗ thay vì đợi cơ sở dữ liệu trả `23514`. Chúng không có mặt trong lệnh ghi.
 */
export const semesterMilestoneSchema = z.object({
  academicYearId: z.string().uuid("Năm học không hợp lệ."),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  semester1EndDate: optionalIsoDateSchema,
}).refine(refineSemester1, {
  message: SEMESTER_1_RANGE_MESSAGE,
  path: ["semester1EndDate"],
});

export const academicYearIdSchema = z.string().uuid("Năm học không hợp lệ.");

/**
 * Đóng năm học — **I7 / TB-F09 / BR-M02-N08**.
 *
 * `confirmCode` là mã năm học người dùng **gõ lại**. Ở đây chỉ kiểm *hình dạng*
 * (đúng dạng `2026-2027`); việc so nó với mã thật nằm ở
 * `public.close_academic_year`, vì tầng này không được tin cái mã do biểu mẫu gửi
 * lên là mã của đúng năm đang bị đóng.
 *
 * `reason` không bắt buộc ở tầng Zod nhưng **bắt buộc ở tầng cơ sở dữ liệu khi còn
 * việc tồn đọng** (BR-M02-N05). Cố ý không nhân đôi luật đó ở đây: chỉ cơ sở dữ liệu
 * biết còn bao nhiêu việc tồn đọng vào **thời điểm bấm nút**, và một luật viết hai
 * chỗ là hai chỗ để lệch nhau.
 */
export const closeAcademicYearSchema = z.object({
  academicYearId: academicYearIdSchema,
  confirmCode: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Mã năm học phải có dạng 2026-2027."),
  reason: z
    .string()
    .trim()
    .max(500, "Lý do tối đa 500 ký tự.")
    .optional()
    .transform((value) => (value ? value : "")),
});

/** Lưu trữ năm học đã đóng — **D-120**. Hạn giữ dữ liệu do cơ sở dữ liệu kiểm. */
export const archiveAcademicYearSchema = z.object({
  academicYearId: academicYearIdSchema,
});

// D-58: ngưỡng cảnh báo chuyên cần cấu hình theo năm học, không hardcode.
// Giới hạn ở đây phải khớp CHECK constraint trong migration ...000500.
export const attendanceSettingsSchema = z.object({
  academicYearId: academicYearIdSchema,
  attendanceLockDays: z.coerce.number().int().min(0).max(30),
  attendanceEditLeaseMinutes: z.coerce.number().int().min(1).max(60),
  warningConsecutiveAbsences: z.coerce.number().int().min(1).max(20),
  warningConsecutiveSundays: z.coerce.number().int().min(1).max(20),
  warningRatePercent: z.coerce.number().int().min(1).max(100),
});

// `updateClassSchema` đã chuyển sang `features/classes/schemas.ts` ở M02-B (I6):
// lớp không phải năm học, và từ D-112 hai thứ này thuộc hai nhóm quyền khác nhau.

export type AttendanceSettingsInput = z.infer<typeof attendanceSettingsSchema>;
export type AcademicYearInput = z.infer<typeof academicYearInputSchema>;
export type SemesterMilestoneInput = z.infer<typeof semesterMilestoneSchema>;
export type CloseAcademicYearInput = z.infer<typeof closeAcademicYearSchema>;
export type ArchiveAcademicYearInput = z.infer<typeof archiveAcademicYearSchema>;
