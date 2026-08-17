import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({ title = "Đã xảy ra lỗi", description = "Hệ thống chưa thể tải nội dung. Vui lòng thử lại.", onRetry, backHref = "/dashboard" }: { title?: string; description?: string; onRetry?: () => void; backHref?: string }) {
  return (
    <div className="mx-auto flex min-h-72 max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger-subtle text-danger"><CircleAlert className="h-6 w-6" aria-hidden="true" /></span>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {onRetry ? <Button onClick={onRetry}>Thử lại</Button> : null}
        <Link href={backHref} className={cn(buttonVariants({ variant: onRetry ? "outline" : "primary" }))}>Về tổng quan</Link>
      </div>
    </div>
  );
}
