import Link from "next/link";
import { isNavigationItemActive, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNavigation({ items, pathname }: { items: readonly NavigationItem[]; pathname: string }) {
  return (
    <nav aria-label="Điều hướng nhanh" className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))` }}>
        {items.slice(0, 5).map((item) => {
          const active = isNavigationItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
