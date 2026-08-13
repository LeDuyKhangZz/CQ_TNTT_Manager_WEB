import Link from "next/link";
import { isNavigationItemActive, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNavigation({ items, pathname }: { items: readonly NavigationItem[]; pathname: string }) {
  return (
    <nav aria-label="Điều hướng nhanh" className="safe-area-bottom fixed inset-x-0 bottom-0 z-bottom-nav border-t border-line bg-surface lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))` }}>
        {items.slice(0, 5).map((item) => {
          const active = isNavigationItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              {/* Nhãn 12px (sàn cứng của 09 §2) và cho xuống 2 dòng thay vì
                  cắt cụt — bản cũ dùng 11px + truncate. */}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-1 text-2xs font-medium leading-tight transition-colors duration-fast",
                  active ? "bg-theme-tint text-theme-accent-text" : "text-ink-muted",
                )}
              >
                {/* Tín hiệu THỨ HAI ngoài màu chữ (09 §10 điều 5): một vạch 3px
                    ở mép trên ô đang chọn, đối xứng với thanh dọc của thanh bên.
                    Bản cũ chỉ đổi màu chữ — người không phân biệt được màu chỉ
                    còn `aria-current`, thứ mà mắt thường không đọc được. */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 top-0 h-[3px] rounded-b-full bg-theme-primary"
                  />
                ) : null}
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                <span className="line-clamp-2 max-w-full text-center">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
