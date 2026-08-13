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
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
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
