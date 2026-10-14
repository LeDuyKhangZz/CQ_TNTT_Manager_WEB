"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, CircleUserRound, KeyRound, Search, UserRound, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getAllFeaturesNavigation, isNavigationItemActive, type MyClassDestination } from "@/config/navigation";
import type { ShellViewer } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import type { NavigationBadges } from "./app-sidebar";

export type MobilePanel = "menu" | "account" | null;
const shortLabels: Readonly<Record<string, string>> = {
  "/staff": "Huynh trưởng · GLV", "/results": "Kết quả", "/promotions": "Lên / chuyển lớp", "/admin": "Quản trị",
};
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
  const matches = items.filter((item) => searchable(`${item.label} ${shortLabels[item.href] ?? ""}`).includes(searchable(query.trim())));
  const modules = matches.filter((item) => item.href !== "/account" && item.href !== "/notifications");
  const utilities = matches.filter((item) => item.href === "/account" || item.href === "/notifications");
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
    </div> : <nav aria-label="Tất cả chức năng">
      {modules.length ? <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {modules.map((item) => {
          const Icon = item.icon;
          const active = isNavigationItemActive(pathname, item.href);
          const count = badges?.[item.moduleHref ?? item.href];
          return <li key={item.href}>
            <Link href={item.href} onClick={close} aria-current={active ? "page" : undefined}
              className={cn("relative flex min-h-28 h-full flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-sm font-medium leading-snug hover:bg-surface-muted", active ? "border-theme-primary bg-theme-tint text-theme-accent-text" : "border-line bg-surface text-ink")}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted"><Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></span>
              <span>{shortLabels[item.href] ?? item.label}</span>
              {active ? <Check className="absolute right-2 top-2 h-4 w-4" aria-hidden="true" /> : null}
              {count ? <span className="absolute left-2 top-2">{count}</span> : null}
            </Link>
          </li>;
        })}
      </ul> : null}
      {utilities.length ? <ul className={cn("grid grid-cols-2 gap-2", modules.length && "mt-4 border-t border-line pt-4")}>
        {utilities.map((item) => <li key={item.href}>
          {item.href === "/account" ? <button type="button" onClick={() => setPanel("account")} className={cn(actionClass, "px-3")}><CircleUserRound className="h-5 w-5 shrink-0" aria-hidden="true" />Tài khoản</button>
            : <Link href={item.href} onClick={close} className={cn(actionClass, "px-3")}><Bell className="h-5 w-5 shrink-0" aria-hidden="true" />Thông báo{badges?.[item.href]}</Link>}
        </li>)}
      </ul> : null}
      {matches.length === 0 ? <p role="status" className="py-6 text-center text-sm text-ink-muted">Không tìm thấy chức năng. Thử tên khác.</p> : null}
    </nav>}
  </BottomSheet>;
}
