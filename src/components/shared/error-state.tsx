import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({ title = "Đã xảy ra lỗi", description = "Hệ thống chưa thể tải nội dung. Vui lòng thử lại.", onRetry, backHref = "/dashboard" }: { title?: string; description?: string; onRetry?: () => void; backHref?: string }) {
  return (
    <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><CircleAlert className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onRetry ? <Button onClick={onRetry}>Thử lại</Button> : null}
        <Link href={backHref} className={cn(buttonVariants({ variant: onRetry ? "outline" : "primary" }))}>{backHref === "/login" ? "Về đăng nhập" : "Về tổng quan"}</Link>
      </div>
    </div>
  );
}
