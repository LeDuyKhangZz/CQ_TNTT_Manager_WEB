import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";

export function EntityHeader({ title, description, backHref, backLabel = "Quay lại", facts, chips, actions = [], action, more, label = "Thông tin chi tiết", initials }: {
  title: string; description?: string; backHref: string; backLabel?: string;
  facts?: ReactNode; chips?: ReactNode; actions?: readonly [] | readonly [ReactNode] | readonly [ReactNode, ReactNode]; more?: ReactNode;
  label?: string; initials?: string; action?: ReactNode;
}) {
  return <div className="space-y-2">
    <Link href={backHref} prefetch={false} className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}
    </Link>
    <header className="rounded-xl border border-line border-t-[3px] border-t-theme-primary bg-surface" data-entity-header>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-theme-tint text-lg font-semibold text-theme-accent-text sm:h-14 sm:w-14">
            {initials || <UserRound className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium text-ink-muted">{label}</p>
            <h1 className="break-words text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">{title}</h1>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
        </div>
        {chips || actions.length || action || more ? <div className="flex flex-wrap items-center justify-between gap-3">
          {chips ? <div className="flex flex-wrap items-center gap-2">{chips}</div> : null}
          {actions.length || action || more ? <div className="flex flex-wrap items-center gap-2">{actions}{action}{more}</div> : null}
        </div> : null}
      </div>
      {facts ? <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-b-xl border-t border-line bg-surface-muted px-4 py-3 text-sm sm:px-5">{facts}</div> : null}
    </header>
  </div>;
}
