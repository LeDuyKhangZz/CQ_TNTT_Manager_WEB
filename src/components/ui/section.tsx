import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ id, title, description, action, children, className }: {
  id: string; title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return <section aria-labelledby={`${id}-heading`} className={cn("space-y-4 bg-section", className)}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
      <div><h2 id={`${id}-heading`} className="text-xs font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}</div>
      {action}
    </div>
    {children}
  </section>;
}
