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
  /**
   * D-165 — mã chống gửi đúp, do giao diện sinh một lần mỗi lượt soạn.
   *
   * `optional` chứ không bắt buộc: đường gọi cũ (và mọi kịch bản không có
   * `crypto.randomUUID`) vẫn phải chạy được. Có mã thì máy chủ bảo đảm gửi lại
   * cùng mã trả về đúng thông báo cũ; không có mã thì hành vi y như trước.
   */
  requestId: z.string().uuid().nullable().optional(),
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

/** Đếm trước khi gửi — cùng hình dạng đầu vào với publish, trừ nội dung. */
export const previewAudienceSchema = z.object({
  targetType: z.enum(NOTIFICATION_TARGET_TYPES),
  targetId: z.string().uuid().nullable().optional(),
}).superRefine((value, context) => {
  if (NOTIFICATION_TARGETS_NEEDING_ID.includes(value.targetType) && !value.targetId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetId"], message: "Vui lòng chọn đối tượng nhận." });
  }
});

export const searchRecipientsSchema = z.object({
  query: z.string().trim().max(80),
});

/**
 * D-166 — lý do thu hồi **bắt buộc**, chặn ở cả màn hình lẫn máy chủ.
 *
 * Chủ dự án chọn "không giới hạn thời gian" với đúng lý lẽ: biện pháp an toàn
 * không phải đồng hồ mà là nhật ký. Lý do rỗng làm nhật ký ấy vô nghĩa, nên
 * luật này gánh cả phần mà giới hạn thời gian đã không gánh.
 */
export const retractNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  reason: z.string().trim().min(1, "Vui lòng nêu lý do thu hồi.").max(500),
});

export type PublishNotificationInput = z.infer<typeof publishNotificationSchema>;
