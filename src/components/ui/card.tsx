import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Thẻ — docs/.../09 §6: bo `lg` 16px, padding 20px (mobile 16px), `--shadow-sm`.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-line bg-surface text-ink shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5 p-4 sm:p-5", className)} {...props} />;
}

/**
 * 🔴 `as` là bắt buộc phải có (05 §3.1): bản cũ hardcode `<h2>` nên mọi thẻ trên
 * một trang đều là h2, phá thứ bậc heading. Mặc định `h3` — thẻ thường nằm dưới
 * `h1` của `PageHeader` và `h2` của khối.
 */
export function CardTitle({
  className,
  as: Component = "h3",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: React.ElementType }) {
  return (
    <Component className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0 sm:p-5 sm:pt-0", className)} {...props} />;
}
