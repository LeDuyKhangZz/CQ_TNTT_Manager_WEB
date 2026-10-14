import { cn } from "@/lib/utils";

/**
 * Khung nội dung của một trang.
 *
 * 🔴 Cố ý là `<div>`, không phải `<main>` — mốc `main` duy nhất do `AppShell`
 * sở hữu, vì skip link cần **một** đích cố định và hai `main` lồng nhau làm
 * trình đọc màn hình đọc sai cấu trúc trang (Mốc 0B mục 0.7).
 */
export function PageContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("workspace-content mx-auto w-full min-w-0 space-y-4 px-4 py-4 sm:px-6 lg:space-y-5 lg:py-5", className)} {...props} />;
}
