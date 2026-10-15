import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailFields({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 text-sm", className)}>{children}</dl>;
}

export function DetailField({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={cn("min-w-0", wide && "col-span-2")}>
    <dt className="text-xs font-medium text-ink-muted">{label}</dt>
    <dd className="mt-1.5 whitespace-pre-wrap break-words font-medium leading-relaxed text-ink">{children || <span className="font-normal text-ink-muted">Chưa có thông tin</span>}</dd>
  </div>;
}
