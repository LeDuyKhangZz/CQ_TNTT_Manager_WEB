import { Menu } from "lucide-react";
import { AcademicYearSwitcher } from "./academic-year-switcher";
import { NotificationButton } from "./notification-button";
import { UserMenu } from "./user-menu";
import type { AuthContext } from "@/lib/auth/types";

export function AppHeader({ authContext, title, onOpenMenu }: { authContext: AuthContext; title: string; onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMenu} className="grid min-h-11 min-w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted lg:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs text-muted-foreground sm:block">Hệ thống / {title}</p>
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
        </div>
        <AcademicYearSwitcher />
        <NotificationButton />
        <UserMenu authContext={authContext} />
      </div>
    </header>
  );
}
