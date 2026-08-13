import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Trạng thái chờ mặc định của trang. Phần khung xương đã tách sang
 * `@/components/ui/skeleton` để dùng lại (05 §3.1).
 */
export function LoadingState({ label = "Đang tải dữ liệu…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-36 rounded-lg border border-line" />
        ))}
      </div>
    </div>
  );
}
