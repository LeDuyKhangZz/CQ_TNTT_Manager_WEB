import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PermissionDenied() {
  return (
    <div className="mx-auto flex min-h-72 max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-warning-surface text-warning"><ShieldX className="h-6 w-6" aria-hidden="true" /></span>
      <p className="text-sm font-semibold uppercase tracking-wider text-warning">Không có quyền truy cập</p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Bạn không thể mở nội dung này</h2>
      <p className="mt-2 text-sm text-muted-foreground">Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ người quản trị hệ thống.</p>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "mt-5")}>Về tổng quan</Link>
    </div>
  );
}
