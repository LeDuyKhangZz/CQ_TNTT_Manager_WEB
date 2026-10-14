import Image from "next/image";
import Link from "next/link";
import { Grid2X2, X } from "lucide-react";
import { isNavigationItemActive, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import { RailLabel } from "./rail-label";

export type NavigationBadges = Partial<Record<string, React.ReactNode>>;
interface AppSidebarProps {
  items: readonly NavigationItem[];
  pathname: string;
  contextIndicator?: React.ReactNode;
  badges?: NavigationBadges;
  collapsed?: boolean;
  mobile?: boolean;
  onClose?: () => void;
  onShowAllFeatures?: () => void;
}

/** Preserve ordered sections, including the account links below the work groups. */
function sectionsFor(items: readonly NavigationItem[]) {
  const sections: { group: NavigationItem["group"]; items: NavigationItem[] }[] = [];
  for (const item of items) {
    const last = sections.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }
  return sections;
}

export function AppSidebar({ items, pathname, contextIndicator, badges, collapsed = false, mobile = false, onClose, onShowAllFeatures }: AppSidebarProps) {
  const rail = collapsed && !mobile;
  const Frame = mobile ? "div" : "aside";
  return (
    <Frame id={mobile ? undefined : "app-sidebar"} data-collapsed={rail || undefined}
      aria-label={mobile ? undefined : "Thanh bên ứng dụng"}
      className={cn("flex h-full flex-col border-r border-line bg-surface",
        mobile ? "w-full" : "fixed inset-y-0 left-0 z-sidebar hidden lg:flex",
        !mobile && (rail ? "w-[72px]" : "w-[264px]"))}>
      <div className={cn("flex min-h-[68px] shrink-0 items-center gap-3 border-b border-line", rail ? "justify-center px-2" : "px-4")}>
        <Image src="/logo.png" alt={rail ? "Thiếu Nhi Thánh Thể Chợ Quán" : ""} width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
        {!rail ? <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-muted">Giáo xứ Chợ Quán</p>
          <p className="text-sm font-semibold text-ink">Thiếu Nhi Thánh Thể</p>
        </div> : null}
        {mobile ? <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-surface-muted" aria-label="Đóng menu">
          <X className="h-5 w-5" aria-hidden="true" />
        </button> : null}
      </div>
      {contextIndicator && !rail ? <div className="border-b border-line px-4 py-3">{contextIndicator}</div> : null}
      <nav aria-label="Điều hướng chính" className={cn("min-h-0 flex-1 overflow-y-auto py-3", rail ? "px-2" : "px-3")}>
        <RailLabel label="Tất cả chức năng" enabled={rail}>
          <button type="button" onClick={onShowAllFeatures} title={rail ? "Tất cả chức năng" : undefined} aria-haspopup="dialog"
            className={cn("mb-3 flex min-h-11 w-full items-center gap-3 rounded-md border border-line text-sm font-medium text-ink hover:bg-surface-muted", rail ? "justify-center" : "px-3 py-2")}>
            <Grid2X2 className="h-5 w-5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            <span className={rail ? "sr-only" : undefined}>Tất cả chức năng</span>
          </button>
        </RailLabel>
        {sectionsFor(items).map(({ group, items: groupItems }, index) => <div className="mb-3" key={`${group}-${index}`}>
          {!rail ? <p className="mb-1 px-3 text-xs font-medium text-ink-muted">{group}</p> : index > 0 ? <div className="mx-2 mb-2 border-t border-line" /> : null}
          <ul className="space-y-1">
            {groupItems.map((item) => {
              const ownId = item.moduleHref === "/classes" ? item.href.split("/")[2] : null;
              const active = isNavigationItemActive(pathname, item.href) || Boolean(ownId &&
                [`/teaching-plan/${ownId}`, `/results/${ownId}`].some((href) => isNavigationItemActive(pathname, href)));
              const Icon = item.icon;
              const accessibleLabel = item.description ? `${item.label} · ${item.description}` : item.label;
              return <li key={item.href}>
                <RailLabel label={accessibleLabel} enabled={rail}>
                  <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined}
                    title={rail ? accessibleLabel : undefined}
                    className={cn("relative flex min-h-11 items-center rounded-md border-l-[3px] py-2 text-sm font-medium transition-colors duration-fast",
                      rail ? "justify-center px-0" : "gap-3 px-3",
                      active ? "border-theme-primary bg-theme-tint text-theme-accent-text" : "border-transparent text-ink hover:bg-surface-muted")}>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className={rail ? "sr-only" : "min-w-0 flex-1"}>
                      {item.label}
                      {item.description ? <span className="block text-xs font-normal text-ink-muted">{item.description}</span> : null}
                    </span>
                    {badges?.[item.moduleHref ?? item.href] ? <span className={rail ? "absolute right-0 top-0" : "ml-auto"}>{badges[item.moduleHref ?? item.href]}</span> : null}
                  </Link>
                </RailLabel>
              </li>;
            })}
          </ul>
        </div>)}
      </nav>
      <div className={cn("shrink-0 border-t border-line py-3", rail ? "px-2" : "px-3")}>
        <RailLabel label="Đăng xuất" enabled={rail}><SignOutButton variant="panel" iconOnly={rail} /></RailLabel>
      </div>
    </Frame>
  );
}
