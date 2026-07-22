import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { isNavigationItemActive, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  items: readonly NavigationItem[];
  pathname: string;
  mobile?: boolean;
  onClose?: () => void;
}

const groups = ["Chung", "Mục vụ", "Điều hành"] as const;

export function AppSidebar({ items, pathname, mobile = false, onClose }: AppSidebarProps) {
  return (
    <aside
      aria-label="Thanh bên ứng dụng"
      className={cn(
        "flex h-full w-[264px] flex-col border-r border-border bg-card",
        mobile ? "shadow-xl" : "fixed inset-y-0 left-0 z-30 hidden lg:flex",
      )}
    >
      <div className="flex min-h-20 items-center gap-3 border-b border-border px-5">
        <Image src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-primary">Giáo xứ Chợ Quán</p>
          <p className="truncate font-semibold text-foreground">Thiếu Nhi Thánh Thể</p>
        </div>
        {mobile ? (
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div className="mb-5" key={group}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const active = isNavigationItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active ? "bg-muted text-primary" : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Bản nền giao diện</p>
        <p>Phân quyền route hoàn thiện ở P0-T3.</p>
      </div>
    </aside>
  );
}
