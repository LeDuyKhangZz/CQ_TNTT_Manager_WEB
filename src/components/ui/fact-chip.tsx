import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Neutral facts, without implying a success/warning status. */
export function FactChip({ label, value, className }: {label: string; value: ReactNode; className?: string}) {
  return <span className={cn("inline-flex flex-wrap items-baseline gap-x-1 text-sm", className)}>
    <span className="text-ink-muted">{label}:</span><span className="font-medium text-ink">{value}</span>
  </span>;
}
