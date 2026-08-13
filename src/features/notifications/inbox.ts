import type { NotificationTargetType } from "./constants";

/**
 * Phần **thuần** của hộp thư — tách khỏi `server/queries.ts` để kiểm thử được
 * mà không cần cơ sở dữ liệu (cùng khuôn với `student-directory.ts`,
 * `promotion-directory.ts`).
 *
 * 🔴 **BR-M10-20 — luật ra đời từ hai lỗi CRITICAL của module này.**
 * Màn hình *"của tôi"* phải hỏi cơ sở dữ liệu đúng câu hỏi *"của tôi"*.
 * Hàng rào bảo mật (RLS) trả lời *"được phép thấy gì"*, còn truy vấn phải trả
 * lời *"muốn thấy gì"*. Trộn hai câu hỏi làm một thì mọi màn hình cá nhân sẽ
 * sai **ngay khi** người đăng nhập có quyền rộng hơn — đúng chuyện đã xảy ra
 * với 6 vai trò cấp xứ đoàn ở đây.
 *
 * `INBOX_QUERY_OWNER_COLUMN` là tên cột phải xuất hiện trong **mọi** truy vấn
 * chạm `notification_recipients`; `tests/unit/notification-inbox.test.ts` quét
 * mã nguồn để canh điều đó, vì không cửa kiểm nào khác bắt được lỗi này.
 */
export const INBOX_QUERY_OWNER_COLUMN = "profile_id";

/** Số dòng hộp thư tải về một lượt. */
export const INBOX_PAGE_SIZE = 50;

export interface InboxNotification {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  linkPath: string | null;
  readAt: string | null;
  targetType: NotificationTargetType | null;
  /** M10-C — bản đã thu hồi: chỉ còn cái vỏ, không còn nội dung. */
  retracted: boolean;
}

/** Đúng hình dạng một dòng `notification_recipients` kèm thông báo nhúng. */
export interface InboxRow {
  notification_id: string;
  read_at: string | null;
  /** Cờ do trigger giữ đồng bộ — xem migration `20260810000100`. */
  notification_retracted_at: string | null;
  notifications: {
    id: string;
    title: string;
    content: string;
    published_at: string;
    link_path: string | null;
    target_type: string;
  } | null;
}

/** Bộ lọc hộp thư — `docs/06` §14 đòi có, trước M10-C thì chưa có. */
export const INBOX_FILTERS = ["all", "unread"] as const;
export type InboxFilter = (typeof INBOX_FILTERS)[number];

export function parseInboxFilter(value: string | undefined): InboxFilter {
  return value === "unread" ? "unread" : "all";
}

export function parseInboxPage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page >= 1 ? page : 1;
}

/**
 * Dòng người-nhận ⇒ mục hộp thư.
 *
 * Bỏ dòng có `notifications` rỗng: khi hàng rào đọc của bảng `notifications`
 * chặn bản ghi mà dòng người-nhận vẫn lọt, phép nhúng trả `null` — vẽ ra một
 * thẻ trắng không tiêu đề còn tệ hơn là không vẽ gì.
 *
 * Chống trùng theo `notification_id`: cơ sở dữ liệu đã có `unique
 * (notification_id, profile_id)` nên sau khi lọc đúng người thì không thể trùng
 * — nhưng AC-01-02 nói về đúng triệu chứng *"một thông báo gửi 200 người hiện
 * 200 lần"*, nên lưới an toàn này ở lại để triệu chứng ấy không quay về bằng
 * một con đường khác.
 */
export function toInboxNotifications(rows: readonly InboxRow[]): InboxNotification[] {
  const seen = new Set<string>();
  const inbox: InboxNotification[] = [];
  for (const row of rows) {
    if (seen.has(row.notification_id)) continue;
    const notification = row.notifications;

    // 🔴 **M10-C — bản đã thu hồi tới đây với phần nhúng RỖNG, và đó là đúng ý.**
    // Hàng rào đọc của `notifications` giấu hẳn bản đã thu hồi khỏi người nhận
    // (`07` §4) nên nội dung sai không đọc tiếp được, kể cả gọi thẳng Data API.
    // Cái vỏ thì vẫn phải hiện: người ta **có thể đã đọc** nội dung ấy rồi, và
    // cho nó biến mất không dấu vết là để họ tưởng mình nhớ nhầm — hoặc cứ làm
    // theo một thông báo đã bị huỷ (D-166 vế ⓸).
    //
    // Phân biệt "đã thu hồi" với "lỗi dữ liệu" bằng **cờ ở chính dòng
    // người-nhận**, không phải bằng cách đoán từ phần nhúng rỗng.
    if (!notification) {
      if (!row.notification_retracted_at) continue;
      seen.add(row.notification_id);
      inbox.push({
        id: row.notification_id,
        title: "Thông báo này đã được thu hồi",
        content: "Người gửi đã thu hồi thông báo này. Nếu bạn đã làm theo, hãy hỏi lại người gửi.",
        publishedAt: row.notification_retracted_at,
        linkPath: null,
        readAt: row.read_at,
        targetType: null,
        retracted: true,
      });
      continue;
    }

    seen.add(row.notification_id);
    inbox.push({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      publishedAt: notification.published_at,
      linkPath: notification.link_path,
      readAt: row.read_at,
      targetType: notification.target_type as NotificationTargetType,
      retracted: false,
    });
  }
  return inbox;
}
