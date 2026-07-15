import Link from "next/link";
import { ChevronDown, UserRound } from "lucide-react";
import type { AuthContext } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/permissions/roles";

export function UserMenu({ authContext }: { authContext: AuthContext }) {
  const roleLabel = authContext.role ? ROLE_LABELS[authContext.role] : "Chưa gán vai trò";
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-sm hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-secondary-foreground"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
        <span className="hidden max-w-32 truncate font-medium md:inline">{authContext.displayName}</span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 md:block" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card p-2 shadow-lg">
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-medium">{authContext.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <Link href="/account" className="mt-1 flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted">Tài khoản</Link>
      </div>
    </details>
  );
}
