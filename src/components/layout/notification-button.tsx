import Link from "next/link";
import { Bell } from "lucide-react";

/** Badge dùng đúng số chưa đọc từ `notification_recipients` (WF-14 bước 6). */
export function NotificationButton({ unreadCount = 0 }: { unreadCount?: number }) {
  const label = unreadCount > 0 ? `Mở thông báo, ${unreadCount} chưa đọc` : "Mở thông báo";
  return (
    <Link
      href="/notifications"
      className="relative grid min-h-11 min-w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={label}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span
          data-testid="unread-notification-badge"
          className="absolute right-0 top-1 min-w-5 rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-5 text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
