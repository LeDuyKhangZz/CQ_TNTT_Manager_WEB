"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDesktopNavigation, getMobileNavigation, getPageTitle } from "@/config/navigation";
import type { AuthContext } from "@/lib/auth/types";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";

export function AppShell({ children, authContext }: { children: React.ReactNode; authContext: AuthContext }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const desktopItems = getDesktopNavigation(authContext);
  const mobileItems = getMobileNavigation(authContext);

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <AppSidebar items={desktopItems} pathname={pathname} />
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/30" onClick={() => setDrawerOpen(false)} aria-label="Đóng menu" />
          <div className="relative h-full w-[min(82vw,320px)]">
            <AppSidebar items={desktopItems} pathname={pathname} mobile onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-h-screen lg:pl-[264px]">
        <AppHeader authContext={authContext} title={getPageTitle(pathname)} onOpenMenu={() => setDrawerOpen(true)} />
        <div className="pb-24 lg:pb-0">{children}</div>
      </div>
      <MobileBottomNavigation items={mobileItems} pathname={pathname} />
    </div>
  );
}
