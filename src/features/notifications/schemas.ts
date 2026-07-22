import { z } from "zod";
import {
  NOTIFICATION_TARGETS_NEEDING_ID,
  NOTIFICATION_TARGET_TYPES,
  isKnownNotificationLink,
} from "./constants";

export const publishNotificationSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề.").max(200),
  content: z.string().trim().min(1, "Vui lòng nhập nội dung.").max(5000),
  targetType: z.enum(NOTIFICATION_TARGET_TYPES),
  targetId: z.string().uuid().nullable().optional(),
  linkPath: z.string().trim().max(200).nullable().optional(),
}).superRefine((value, context) => {
  if (NOTIFICATION_TARGETS_NEEDING_ID.includes(value.targetType) && !value.targetId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetId"], message: "Vui lòng chọn đối tượng nhận." });
  }
  if (!NOTIFICATION_TARGETS_NEEDING_ID.includes(value.targetType) && value.targetId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetId"], message: "Phạm vi này không cần chọn đối tượng." });
  }
  if (!isKnownNotificationLink(value.linkPath ?? null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["linkPath"], message: "Liên kết phải trỏ tới một trang đã có trong hệ thống." });
  }
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export type PublishNotificationInput = z.infer<typeof publishNotificationSchema>;
