import { z } from "zod";
import { TEACHING_ITEM_TYPES } from "./constants";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null).nullable().optional();

export const teachingPlanIdSchema = z.string().uuid();
export const teachingPlanItemIdSchema = z.string().uuid();

export const ensureTeachingPlanSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
});

export const updateTeachingPlanTitleSchema = z.object({
  planId: teachingPlanIdSchema,
  title: z.string().trim().min(1).max(150),
});

export const teachingPlanItemInputSchema = z
  .object({
    teachingPlanId: teachingPlanIdSchema,
    plannedDate: z.string().date(),
    title: z.string().trim().min(1).max(200),
    objectives: optionalText(4000),
    catechismContent: optionalText(8000),
    scriptureContent: optionalText(4000),
    game: optionalText(2000),
    song: optionalText(1000),
    homework: optionalText(2000),
    preparation: optionalText(2000),
    teacherStaffId: z.string().uuid().nullable().optional(),
    itemType: z.enum(TEACHING_ITEM_TYPES),
    note: optionalText(2000),
  })
  .superRefine((value, context) => {
    if (value.itemType === "lesson" && !value.teacherStaffId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teacherStaffId"],
        message: "Bài học phải có người dạy.",
      });
    }
  });

/**
 * Phiên bản mà trình duyệt đang giữ — **D-146 / TB-M06-01 / BR-M06-13**.
 *
 * 🔴 **Giữ NGUYÊN VĂN chuỗi máy chủ trả về, không đi qua `Date`.** `updated_at`
 * là `timestamptz` với độ chính xác **micro giây**, còn `Date` của JavaScript
 * chỉ tới **mili giây** — một vòng `new Date(value).toISOString()` là mất ba
 * chữ số cuối, và phép so ở cơ sở dữ liệu sẽ **không bao giờ khớp**. Hậu quả
 * không phải mất dữ liệu mà là mọi lượt lưu đều báo xung đột: hàng rào chống
 * ghi đè biến thành hàng rào chặn chính người đang sửa.
 *
 * `offset: true` là bắt buộc: PostgREST trả `…+00:00`, còn `z.string().datetime()`
 * mặc định chỉ nhận hậu tố `Z`.
 */
export const expectedUpdatedAtSchema = z.string().datetime({ offset: true });

export const updateTeachingPlanItemSchema = teachingPlanItemInputSchema.and(
  z.object({
    itemId: teachingPlanItemIdSchema,
    expectedUpdatedAt: expectedUpdatedAtSchema,
  }),
);

export type EnsureTeachingPlanInput = z.input<typeof ensureTeachingPlanSchema>;
export type UpdateTeachingPlanTitleInput = z.input<typeof updateTeachingPlanTitleSchema>;
export type TeachingPlanItemInput = z.input<typeof teachingPlanItemInputSchema>;
export type UpdateTeachingPlanItemInput = z.input<typeof updateTeachingPlanItemSchema>;

