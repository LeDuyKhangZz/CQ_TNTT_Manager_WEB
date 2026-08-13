"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  markNotificationReadSchema,
  previewAudienceSchema,
  publishNotificationSchema,
  retractNotificationSchema,
  searchRecipientsSchema,
  type PublishNotificationInput,
} from "../schemas";
import { describeNotificationZodIssues } from "../zod-messages";

export type NotificationActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/**
 * 🔴 **Nợ #14 / D-96 — hai vế, module này mắc CẢ HAI.**
 *
 * ⓵ Guard phải gọi **ngoài `try`**. `redirect()` của Next hoạt động bằng cách
 * ném một ngoại lệ đặc biệt; đặt guard trong `try` thì `catch` **nuốt mất** nó
 * và người hết phiên đăng nhập nhận về câu *"Không thể xử lý thông báo. Vui
 * lòng thử lại."* — một câu **mời họ thử lại đúng thứ vừa hỏng**, thay vì được
 * đưa về trang đăng nhập.
 *
 * ⓶ Dùng `requireRouteAccess` chứ không `requireAuthContext`. Hàm sau chỉ hỏi
 * *"đã đăng nhập chưa"*; luật `ROUTE_RULES` vì thế chỉ được thi hành ở tầng
 * trang, còn Server Action đứng ngoài. Không phải lỗ hổng hôm nay — hàng rào
 * của cơ sở dữ liệu vẫn chặn — nhưng nó là hàng rào **cuối cùng** chứ không nên
 * là hàng rào **duy nhất**.
 */
async function notificationsRouteContext() {
  return requireRouteAccess("/notifications");
}

/**
 * 🔴 **`ZodError` không còn bị nuốt** — M10-C, đúng lỗi mà M07-A đã sửa cho
 * module bảng điểm.
 *
 * Bản cũ chỉ giữ `message` của `AppError`, nên **mọi** câu lỗi viết sẵn trong
 * `schemas.ts` — *"Vui lòng nhập tiêu đề."* · *"Vui lòng chọn đối tượng
 * nhận."* · *"Liên kết phải trỏ tới một trang đã có trong hệ thống."* ·
 * *"Vui lòng nêu lý do thu hồi."* — **chưa từng hiện ra một lần nào**. Người
 * dùng đọc *"Không thể xử lý thông báo. Vui lòng thử lại."* cho một thứ mà thử
 * lại y nguyên thì hỏng y nguyên.
 *
 * Bài E2E của D-166 là thứ bắt được lỗ này: nó bấm "Thu hồi" với ô lý do bỏ
 * trống rồi chờ đúng câu *"Vui lòng nêu lý do thu hồi."*.
 */
function failure(error: unknown): NotificationActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof z.ZodError) {
    return { ok: false, code: "VALIDATION_ERROR", message: describeNotificationZodIssues(error.issues) };
  }
  return { ok: false, code: "CONFLICT", message: "Không thể xử lý thông báo. Vui lòng thử lại." };
}

/**
 * `forbiddenMessage` có mặt vì **hai đường khác nhau cùng ném `42501`**: gửi
 * vượt phạm vi, và thu hồi thông báo của người khác. Dùng chung một câu thì
 * người bị chặn ở đường thu hồi đọc một câu nói về chuyện gửi — đúng kiểu
 * thông điệp làm người dùng đi sửa nhầm chỗ.
 */
function mapDatabaseError(
  error: { code?: string; message?: string } | null,
  forbiddenMessage = "Bạn không được gửi thông báo tới phạm vi này.",
): AppError {
  const message = error?.message ?? "";
  if (error?.code === "42501") {
    return new AppError("FORBIDDEN", forbiddenMessage);
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
  // M10-B / BR-M10-23 — mã này CHƯA TỪNG có trong bảng nên nếu quên, nó rơi
  // vào nhánh `CONFLICT` mặc định và người gửi đọc "Vui lòng thử lại." cho một
  // thứ thử lại bao nhiêu lần cũng hỏng.
  if (message.includes("NOTIFICATION_TARGET_INACTIVE")) {
    return new AppError(
      "VALIDATION_ERROR",
      "Tài khoản này chưa hoạt động nên không nhận được thông báo.",
    );
  }
  // M10-C / D-166 — ba nhánh của đường thu hồi. Thiếu chúng thì người dùng đọc
  // "Vui lòng thử lại." cho ba tình huống mà thử lại không giúp được gì.
  if (message.includes("NOTIFICATION_ALREADY_RETRACTED")) {
    return new AppError("CONFLICT", "Thông báo này đã được thu hồi trước đó rồi.");
  }
  if (message.includes("NOTIFICATION_RETRACT_REASON_REQUIRED")) {
    return new AppError("VALIDATION_ERROR", "Vui lòng nêu lý do thu hồi.");
  }
  if (error?.code === "P0002" || error?.code === "23503") return new AppError("RESOURCE_NOT_FOUND");
  if (error?.code === "23514") return new AppError("VALIDATION_ERROR");
  return new AppError("CONFLICT");
}

export async function publishNotification(
  input: PublishNotificationInput,
): Promise<NotificationActionResult<{ id: string; recipientCount: number }>> {
  await notificationsRouteContext();
  try {
    const parsed = publishNotificationSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("publish_notification", {
      p_title: parsed.title,
      p_content: parsed.content,
      p_target_type: parsed.targetType,
      p_target_id: parsed.targetId ?? undefined,
      p_link_path: parsed.linkPath ?? undefined,
      p_request_id: parsed.requestId ?? undefined,
    });
    if (error || !data) throw mapDatabaseError(error);

    // **AC-02-01 / AC-02-02 — SW-04 cho đường ghi nặng nhất của module.**
    // `publish_notification` chốt danh sách người nhận trong **cùng giao dịch**
    // rồi ghi số đó vào `notifications.recipient_count`; đọc lại là biết thông
    // báo vừa rồi tới được bao nhiêu người. Trước M10-A câu trả lời luôn là
    // *"Đã gửi thông báo."* — kể cả khi nó tới **không một ai**.
    //
    // Đọc lại được vì policy `notifications_select_recipient` mở cho
    // `author_profile_id = auth.uid()`: tác giả luôn đọc được thông báo của
    // chính mình, **không cần** nới thêm quyền và **không cần** migration.
    // Số về `null` (mạng chập giữa hai lượt gọi) thì trả `-1` — UI hiểu là
    // *"đã gửi nhưng chưa đếm được"*, thà không nói còn hơn nói một con số sai.
    const { data: published } = await supabase
      .from("notifications")
      .select("recipient_count")
      .eq("id", data)
      .maybeSingle();

    revalidatePath("/notifications");
    return { ok: true, data: { id: data, recipientCount: published?.recipient_count ?? -1 } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Đếm người nhận **trước** khi gửi — TB-M10-04, hạng mục 2/6.
 *
 * Quyền kiểm ở trong RPC (`app.can_publish_notification`, đúng hàm mà
 * `publish_notification` dùng), nên action này không tự phán quyền lần nữa.
 *
 * Lỗi ở đây **không chặn đường gửi**, chỉ ẩn con số đi (`04_TO_BE_FLOWS.md`
 * TB-M10-04 gọi là *degradation*): xem trước là tiện ích, không phải hàng rào.
 * Hàng rào thật nằm ở `publish_notification`.
 */
export async function previewNotificationAudience(
  input: { targetType: string; targetId: string | null },
): Promise<NotificationActionResult<{ count: number }>> {
  await notificationsRouteContext();
  try {
    const parsed = previewAudienceSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("count_notification_audience", {
      p_target_type: parsed.targetType,
      p_target_id: parsed.targetId ?? undefined,
    });
    if (error) throw mapDatabaseError(error);
    return { ok: true, data: { count: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Bộ chọn người nhận cho phạm vi "Một người" — TB-M10-03, hạng mục 4.
 *
 * 🔴 **Không đổ toàn bộ danh bạ xuống trình duyệt.** Trả tối đa 20 dòng và chỉ
 * hai cột cần cho việc chọn (tên hiển thị + tên đăng nhập). Hàng rào đọc của
 * `profiles` mở cho 6 vai trò cấp xứ đoàn, mà 4 vai trò gửi được thư riêng đều
 * nằm trong 6 — nên **không cần nới thêm một quyền nào**; ai không có quyền thì
 * chính hàng rào ấy trả về danh sách rỗng.
 *
 * Lọc `account_status = 'active'` ngay ở đây để bộ chọn không bày ra những
 * người mà `publish_notification` sẽ từ chối (BR-M10-23) — bày rồi mới báo lỗi
 * là dựng sẵn một cái bẫy.
 */
export async function searchNotificationRecipients(
  input: { query: string },
): Promise<NotificationActionResult<{ people: { id: string; label: string }[] }>> {
  await notificationsRouteContext();
  try {
    const parsed = searchRecipientsSchema.parse(input);
    if (parsed.query.length < 2) return { ok: true, data: { people: [] } };
    const supabase = await createClient();
    const escaped = parsed.query.replace(/[%_]/g, (match) => `\\${match}`);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .eq("account_status", "active")
      .or(`display_name.ilike.%${escaped}%,username.ilike.%${escaped}%`)
      .order("display_name")
      .limit(20);
    if (error) throw mapDatabaseError(error);
    return {
      ok: true,
      data: {
        people: (data ?? []).map((person) => ({
          id: person.id,
          label: `${person.display_name} · ${person.username}`,
        })),
      },
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Thu hồi thông báo — D-166, hạng mục 8.
 *
 * Toàn bộ luật nằm trong RPC (ai được thu hồi · lý do bắt buộc · không thu hồi
 * hai lần), vì `authenticated` gọi thẳng RPC được. Ở đây chỉ chặn sớm cho
 * người dùng đỡ phải đợi một vòng mạng để nhận lại đúng câu ấy.
 */
export async function retractNotification(
  input: { notificationId: string; reason: string },
): Promise<NotificationActionResult<{ recipientCount: number }>> {
  await notificationsRouteContext();
  try {
    const parsed = retractNotificationSchema.parse(input);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("retract_notification", {
      p_notification_id: parsed.notificationId,
      p_reason: parsed.reason,
    });
    if (error) throw mapDatabaseError(error, "Bạn không được thu hồi thông báo này.");
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true, data: { recipientCount: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}

export async function markNotificationRead(
  input: { notificationId: string },
): Promise<NotificationActionResult> {
  await notificationsRouteContext();
  try {
    const parsed = markNotificationReadSchema.parse(input);
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
  await notificationsRouteContext();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("mark_all_notifications_read");
    if (error) throw mapDatabaseError(error);
    revalidatePath("/notifications");
    return { ok: true, data: { count: data ?? 0 } };
  } catch (error) {
    return failure(error);
  }
}
