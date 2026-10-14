"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, CircleUserRound, KeyRound, Search, UserRound, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getAllFeaturesNavigation, groupNavigationItems, isNavigationItemActive, type MyClassDestination } from "@/config/navigation";
import type { ShellViewer } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import type { NavigationBadges } from "./app-sidebar";

export type MobilePanel = "menu" | "account" | null;
function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");
}
const actionClass = "flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm font-medium text-ink hover:bg-surface-muted";

export function MobileMenuSheet({ panel, setPanel, viewer, pathname, myClass, badges }: {
  panel: MobilePanel; setPanel: (panel: MobilePanel) => void; viewer: ShellViewer;
  pathname: string; myClass?: MyClassDestination | null; badges?: NavigationBadges;
}) {
  const [query, setQuery] = useState("");
  const close = () => { setPanel(null); setQuery(""); };
  const items = getAllFeaturesNavigation(viewer).map((item) => item.href === "/classes" && viewer.scopeKind === "class" && myClass
    ? { ...item, href: myClass.href, label: "Lớp của tôi", moduleHref: "/classes" } : item);
  const matches = items.filter((item) => searchable(`${item.label} ${item.group}`).includes(searchable(query.trim())));
  const groups = groupNavigationItems(matches);
  // Search may leave a single result, but its category still provides context.
  const showGroupHeadings = groupNavigationItems(items).length > 1;
  const account = panel === "account";

  return <BottomSheet open={panel !== null} onClose={close} id={account ? "mobile-account" : "mobile-navigation"} title={account ? "Tài khoản" : "Chức năng"}
    toolbar={!account ? <div className="relative mt-3">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink-muted" />
      <input type="search" aria-label="Tìm chức năng" placeholder="Tìm chức năng" value={query} onChange={(event) => setQuery(event.target.value)}
        className="h-12 w-full rounded-xl border border-line-strong bg-surface py-2 pl-10 pr-12 text-base text-ink placeholder:text-ink-muted [&::-webkit-search-cancel-button]:appearance-none" />
      {query ? <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery("")} className="absolute right-0 top-0 grid h-12 w-12 place-items-center text-ink-muted"><X className="h-4 w-4" aria-hidden="true" /></button> : null}
    </div> : undefined}>
    {account ? <div className="space-y-4">
      <div className="flex items-center gap-3 pb-1">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-theme-tint text-theme-accent-text"><UserRound className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></span>
        <div className="min-w-0"><p className="break-words font-semibold text-ink">{viewer.displayName}</p><p className="mt-1 text-sm text-ink-muted">{viewer.role ? ROLE_LABELS[viewer.role] : "Chưa gán vai trò"}</p></div>
      </div>
      <div className="space-y-2">
        <Link href="/account" onClick={close} className={actionClass}><CircleUserRound className="h-5 w-5 shrink-0" aria-hidden="true" />Hồ sơ cá nhân<ChevronRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        <Link href="/change-password?next=%2Faccount" onClick={close} className={actionClass}><KeyRound className="h-5 w-5 shrink-0" aria-hidden="true" />Đổi mật khẩu<ChevronRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        <SignOutButton variant="panel" className="min-h-14 justify-start gap-3 rounded-xl bg-surface-muted px-4 text-sm" />
      </div>
    </div> : <nav aria-label="Tất cả chức năng" className="space-y-5">
      {groups.map(({ group, items: members }, index) => <section key={group} aria-labelledby={showGroupHeadings ? `menu-group-${index}` : undefined}>
        {showGroupHeadings ? <h3 id={`menu-group-${index}`} className="mb-2 text-sm font-semibold text-ink-muted">{group}</h3> : null}
        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          {members.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(pathname, item.href);
            const count = badges?.[item.moduleHref ?? item.href];
            const className = cn("relative flex min-h-24 h-full w-full flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center text-sm font-medium leading-snug transition-colors hover:bg-surface-muted", active ? "border-theme-primary bg-theme-tint text-theme-accent-text" : "border-line bg-surface text-ink");
            const content = <>
              <Icon className="h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="w-full break-words">{item.label}</span>
              {active ? <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5" aria-hidden="true" /> : null}
              {count ? <span className="absolute left-1.5 top-1.5">{count}</span> : null}
            </>;
            return <li key={item.href} className="min-w-0">
              {item.href === "/account"
                ? <button type="button" onClick={() => { setQuery(""); setPanel("account"); }} aria-haspopup="dialog" aria-current={active ? "page" : undefined} className={className}>{content}</button>
                : <Link href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={className}>{content}</Link>}
            </li>;
          })}
        </ul>
      </section>)}
      {matches.length === 0 ? <p role="status" className="py-6 text-center text-sm text-ink-muted">Không tìm thấy chức năng. Thử tên khác.</p> : null}
    </nav>}
  </BottomSheet>;
}
