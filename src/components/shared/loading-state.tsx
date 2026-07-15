import { cn } from "@/lib/utils";

export function LoadingState({ label = "Đang tải dữ liệu…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg border border-border bg-card" />)}
      </div>
    </div>
  );
}
