"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabNavItem = { key: string; href: string; label: ReactNode; badge?: number };

/** Navigation between server-rendered views: real links, not ARIA widget tabs. */
export function TabNav({ items, activeKey, label, stickyMobile = true, className, layout = "scroll" }: {
  items: readonly TabNavItem[];
  activeKey: string;
  label: string;
  stickyMobile?: boolean;
  className?: string;
  layout?: "scroll" | "wrap";
}) {
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const revealActive = () => {
      const nav = navRef.current;
      const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!nav || !active) return;
      const frame = nav.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      // Only move the tab strip; scrollIntoView would also jump the page.
      if (item.left < frame.left) nav.scrollLeft += item.left - frame.left;
      else if (item.right > frame.right) nav.scrollLeft += item.right - frame.right;
    };
    revealActive();
    window.addEventListener("resize", revealActive);
    return () => window.removeEventListener("resize", revealActive);
  }, [activeKey]);
  if (!items.length) return null;
  return <nav ref={navRef} aria-label={label} data-tab-nav data-sticky={stickyMobile || undefined}
    className={cn("min-w-0 gap-1", layout === "wrap" ? "grid grid-cols-3 rounded-lg border border-line bg-surface p-1 sm:flex sm:flex-wrap" : "flex overflow-x-auto border-b border-line bg-page", stickyMobile && "sticky top-[68px] z-sticky md:static", className)}>
    {items.map(item => <Link key={item.key} href={item.href} aria-current={item.key === activeKey ? "page" : undefined}
      className={cn("inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring",
        layout === "wrap" ? "justify-center rounded-md text-center sm:flex-1" : "shrink-0 whitespace-nowrap border-b-2",
        item.key === activeKey ? "border-theme-primary bg-theme-tint font-semibold text-theme-accent-text" : "border-transparent text-ink-muted hover:bg-surface-muted hover:text-ink")}>
      {item.label}{item.badge === undefined ? null : <span className="tabular-nums text-xs">({item.badge})</span>}
    </Link>)}
  </nav>;
}
