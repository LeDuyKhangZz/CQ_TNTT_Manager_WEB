import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold text-foreground">Không tìm thấy trang</h1>
      <p className="text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "primary" }), "mt-2")}
      >
        Về tổng quan
      </Link>
    </main>
  );
}
