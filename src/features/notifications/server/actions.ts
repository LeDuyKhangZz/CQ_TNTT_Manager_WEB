"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireAuthContext } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  markNotificationReadSchema,
  publishNotificationSchema,
  type PublishNotificationInput,
} from "../schemas";

export type NotificationActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

function failure(error: unknown): NotificationActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý thông báo. Vui lòng thử lại." };
}

function mapDatabaseError(error: { code?: string; message?: string } | null): AppError {
  const message = error?.message ?? "";
  if (error?.code === "42501") {
    return new AppError("FORBIDDEN", "Bạn không được gửi thông báo tới phạm vi này.");
  }
  if (message.includes("NOTIFICATION_TARGET_REQUIRED")) {
    return new AppError("VALIDATION_ERROR", "Vui lòng chọn đối tượng nhận thông báo.");
  }
  if (message.includes("NOTIFICATION_CONTENT_REQUIRED")) {
    return new AppError("VALIDATION_ERROR", "Vui lòng nhập tiêu đề và nội dung.");
  }
  if (message.includes("notifications_link_known_route")) {
    return new AppError("VALIDATION_ERROR", "Liên kết phải trỏ tới một trang đã có trong hệ thống.");
  }
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.code === "23514") return new AppError("VALIDATION_ERROR");
  return new AppError("CONFLICT");
}

export async function publishNotification(
  input: PublishNotificationInput,
): Promise<NotificationActionResult<{ id: string }>> {
  try {
    const parsed = publishNotificationSchema.parse(input);
    await requireAuthContext("/notifications");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("publish_notification", {
      p_title: parsed.title,
      p_content: parsed.content,
      p_target_type: parsed.targetType,
      p_target_id: parsed.targetId ?? undefined,
      p_link_path: parsed.linkPath ?? undefined,
    });
    if (error || !data) throw mapDatabaseError(error);
    revalidatePath("/notifications");
    return { ok: true, data: { id: data } };
  } catch (error) {
    return failure(error);
  }
}

export async function markNotificationRead(
  input: { notificationId: string },
): Promise<NotificationActionResult> {
  try {
    const parsed = markNotificationReadSchema.parse(input);
    await requireAuthContext("/notifications");
    const supabase = await createClient();
    const { error } = await supabase.rpc("mark_notification_read", {
      p_notification_id: parsed.notificationId,
    });
    if (error) throw mapDatabaseError(error);
    revalidatePath("/notifications");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult<{ count: number }>> {
  try {
    await requireAuthContext("/notifications");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("mark_all_notifications_read");
    if (error) throw mapDatabaseError(error);
    revalidatePath("/notifications");
    return { ok: true, data: { count: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}
