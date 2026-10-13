import { cn } from "@/lib/utils";

/**
 * Khung xương chờ dữ liệu — tách khỏi `LoadingState` (05 §3.3 #4) để 14 module
 * dùng lại được.
 *
 * 🔴 Dùng token TRUNG TÍNH, không dùng `--theme-*`: lúc đang tải thì chưa biết
 * ngành (10 §6). Skeleton đổi màu theo ngành là hiện màu SAI trước khi biết
 * màu đúng.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

/** Local data loading; keep the page title, filters and navigation available. */
export function DataSkeleton({ rows = 8, label = "Đang tải danh sách" }: { rows?: number; label?: string }) {
  return <div role="status" aria-busy="true" className="overflow-hidden rounded-lg border border-line">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="space-y-0">
      <div className="border-b border-line bg-surface-muted p-3"><Skeleton className="h-5 w-1/3" /></div>
      {Array.from({length: Math.max(0, rows)}, (_,i) => <div key={i} className="flex min-h-12 items-center gap-4 border-b border-line px-3 last:border-0">
        <Skeleton className="h-4 w-2/5" /><Skeleton className="h-4 w-1/5" /><Skeleton className="ml-auto h-4 w-16" />
      </div>)}
    </div>
  </div>;
}

/** Vài dòng chữ giả — dùng cho danh sách và đoạn văn. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
