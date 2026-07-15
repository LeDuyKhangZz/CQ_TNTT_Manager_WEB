import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationButton() {
  return (
    <Link href="/notifications" className="relative grid min-h-11 min-w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Mở thông báo">
      <Bell className="h-5 w-5" aria-hidden="true" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
    </Link>
  );
}
