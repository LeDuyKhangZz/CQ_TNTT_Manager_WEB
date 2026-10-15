import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A real, full-surface link. Keep buttons, phone links and forms outside it. */
export function EntityLink({ href, children, label = "Xem chi tiết", className, ariaLabel }: {
  href: string; children: ReactNode; label?: string; className?: string; ariaLabel?: string;
}) {
  return <Link href={href} prefetch={false} data-entity-link aria-label={ariaLabel}
    className={cn("entity-link group flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 text-sm transition-colors hover:border-theme-primary hover:bg-theme-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2", className)}>
    <div className="min-w-0 flex-1">{children}</div>
    <span className="flex shrink-0 items-center gap-1 text-theme-accent-text">
      <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium">{label}</span>
      <ChevronRight className="h-5 w-5" aria-hidden="true" />
    </span>
  </Link>;
}
