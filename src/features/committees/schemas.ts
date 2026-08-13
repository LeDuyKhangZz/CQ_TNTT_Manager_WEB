import { z } from "zod";
import { COMMITTEE_POSITIONS } from "./constants";

export const committeeIdSchema = z.string().uuid();

export const committeeInputSchema = z.object({
  code: z.string().trim().regex(/^[A-Z0-9_]{2,32}$/, "Mã Ban chỉ gồm chữ in hoa, số và dấu gạch dưới."),
  name: z.string().trim().min(1, "Vui lòng nhập tên Ban.").max(120),
  description: z.string().trim().max(1000).nullable().optional(),
});

// TB-M09-06: sửa Ban qua policy `committees_update_global_write` (đang bỏ không).
// KHÔNG cho sửa `code` — đó là khoá nghiệp vụ (docs/02 §11.1). `manages_equipment`
// cũng không nằm ở đây: đổi cờ giữ kho là việc riêng, không lẫn vào form sửa tên.
export const committeeUpdateSchema = z.object({
  id: committeeIdSchema,
  name: z.string().trim().min(1, "Vui lòng nhập tên Ban.").max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(32767),
});

export const committeeMembershipInputSchema = z.object({
  committeeId: committeeIdSchema,
  staffProfileId: z.string().uuid("Vui lòng chọn nhân sự."),
  position: z.enum(COMMITTEE_POSITIONS),
});

export const committeeMembershipEndSchema = z.object({
  membershipId: z.string().uuid(),
});

export const committeeMembershipPositionSchema = z.object({
  membershipId: z.string().uuid(),
  position: z.enum(COMMITTEE_POSITIONS),
});

export const committeeAnnouncementInputSchema = z.object({
  committeeId: committeeIdSchema,
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề.").max(200),
  content: z.string().trim().min(1, "Vui lòng nhập nội dung.").max(5000),
});

export const committeeMeetingInputSchema = z.object({
  committeeId: committeeIdSchema,
  // TB-M09-06: có `id` ⇒ sửa buổi họp đang có (policy `committee_meetings_update_leaders`);
  // vắng ⇒ tạo mới. Không dùng upsert mù — cùng bài học tách tạo/sửa của F11.
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Vui lòng nhập nội dung buổi họp.").max(200),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
}).superRefine((value, context) => {
  if (value.endsAt && new Date(value.endsAt) < new Date(value.startsAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Giờ kết thúc phải sau giờ bắt đầu." });
  }
});

export const WEEKLY_PLAN_EMPTY_MESSAGE =
  "Vui lòng nhập nội dung hoặc ít nhất một việc trong checklist.";

export const committeeWeeklyPlanInputSchema = z.object({
  committeeId: committeeIdSchema,
  weekStart: z.string().date(),
  content: z.string().trim().max(5000).nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(200)).max(30),
  /**
   * TB-M09-01: dấu thời gian của bản mà người dùng ĐANG nhìn thấy khi bấm Lưu.
   * `null`/vắng mặt nghĩa là "tôi đang tạo bản mới cho tuần này" — server dùng
   * đúng hai trạng thái đó để phân biệt *tạo* với *ghi đè*, thay vì upsert mù.
   */
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
}).superRefine((value, context) => {
  // Mốc tuần luôn là thứ Hai — cùng ràng buộc với CHECK ở DB.
  const [year, month, day] = value.weekStart.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCDay() !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["weekStart"], message: "Tuần phải bắt đầu từ thứ Hai." });
  }
  // AC-M09-14: bản trắng là dấu vết của lỗi ghi đè, không phải dữ liệu ai cần.
  // Cùng ràng buộc với CHECK `committee_weekly_plan_not_empty` ở DB.
  if (!value.content?.trim() && value.checklist.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: WEEKLY_PLAN_EMPTY_MESSAGE,
    });
  }
});

export const committeeContentIdSchema = z.object({ id: z.string().uuid() });

export type CommitteeInput = z.infer<typeof committeeInputSchema>;
export type CommitteeUpdateInput = z.infer<typeof committeeUpdateSchema>;
export type CommitteeMembershipInput = z.infer<typeof committeeMembershipInputSchema>;
export type CommitteeMembershipPositionInput = z.infer<typeof committeeMembershipPositionSchema>;
export type CommitteeAnnouncementInput = z.infer<typeof committeeAnnouncementInputSchema>;
export type CommitteeMeetingInput = z.infer<typeof committeeMeetingInputSchema>;
export type CommitteeWeeklyPlanInput = z.infer<typeof committeeWeeklyPlanInputSchema>;
