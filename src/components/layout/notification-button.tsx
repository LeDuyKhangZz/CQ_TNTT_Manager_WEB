import Link from "next/link";
import { Bell } from "lucide-react";

/** Badge dùng đúng số chưa đọc từ `notification_recipients` (WF-14 bước 6). */
export function NotificationButton({ unreadCount = 0 }: { unreadCount?: number }) {
  const label = unreadCount > 0 ? `Mở thông báo, ${unreadCount} chưa đọc` : "Mở thông báo";
  return (
    <Link
      href="/notifications"
      className="relative grid min-h-control min-w-11 place-items-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
      aria-label={label}
    >
      <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      {unreadCount > 0 ? (
        // 12px là sàn cứng (09 §2); bản cũ dùng 10px.
        <span
          data-testid="unread-notification-badge"
          className="absolute right-0 top-0 min-w-5 rounded-full bg-danger px-1 text-center text-2xs font-semibold leading-5 text-ink-on-dark"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
