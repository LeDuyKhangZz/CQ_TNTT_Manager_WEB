import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 🔴 **Tệp này KHÔNG được có `"use client"`, và không được import từ một tệp
 * có nó.** `Card` đang được rất nhiều Server Component dùng; kéo ranh giới
 * client vào đây là **chết trang** — đã sập thật một lần ở `/account` (mục 0.7)
 * và lint/typecheck/unit **đều xanh**, chỉ E2E bắt được. Cùng lý do khiến
 * `checkbox.tsx` của Đợt D cố ý không có `"use client"` (§6.4).
 */

/**
 * Chuỗi class của `Card`, cho chỗ phải giữ **thẻ HTML riêng** của nó —
 * `<section aria-labelledby>` chẳng hạn. `Card` cố ý **không** nhận `as`: nó là
 * component bị dùng nhiều nhất trong dự án và nới chữ ký của nó là mở một đường
 * để mọi thẻ HTML đi qua. Chỗ nào cần thẻ khác thì lấy chuỗi này.
 */
export const cardClassName = "rounded-lg border border-line bg-surface text-ink shadow-sm";

/**
 * Thẻ — docs/.../09 §6: bo `lg` 16px, padding 20px (mobile 16px), `--shadow-sm`.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardClassName, className)} {...props} />;
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

/* -------------------------------------------------------------------------- */

/**
 * Khối phẳng **bên trong** một `Card` — `17` §7.2.
 *
 * 🔴 Vấn đề nó sinh ra để chữa: cùng một thứ (một mục trong danh sách, một khối
 * gộp nhóm) được viết bằng **chín** biến thể khác nhau rải khắp `src/` — khác
 * bo (`rounded-md`/`rounded-lg`), khác viền (`border-border`/`border-line`/
 * `border-line-strong`), khác nền (trong suốt/`bg-surface`/`bg-surface-muted`),
 * khác padding. Trên cùng một trang chúng đứng cạnh nhau và trông như lỗi.
 *
 * Nay chỉ còn **hai** mẫu: `Card` (thẻ nổi, có bóng, bo 16px) và `Panel` (khối
 * phẳng trong thẻ, **không bóng**, bo 12px). Panel `bg-transparent` chứ không
 * `bg-surface`: nó nằm sẵn trên nền thẻ, tô lại đúng màu ấy chỉ là vẽ thừa —
 * và khi thẻ đổi nền thì khối bên trong lộ ra thành một ô vá màu.
 *
 * `as` để dùng đúng thẻ HTML của chỗ gọi (`li`, `article`, `section`, `p`,
 * `details`…) — phần lớn khối này là **mục danh sách**, ép thành `div` là bỏ
 * ngữ nghĩa danh sách của trình đọc màn hình.
 */
export type PanelProps = React.HTMLAttributes<HTMLElement> & {
  /** Thẻ HTML thật sự render. Mặc định `div`. */
  as?: React.ElementType;
  /** `muted` = khối lõm nền `--bg-surface-muted` (17 §7.2 V5). */
  variant?: "default" | "muted";
  /** `sm` = 12px (mặc định) · `md` = 16px. Không có mức thứ ba. */
  padding?: "sm" | "md" | "none";
};

/**
 * Chuỗi class của `Panel`, cho chỗ **không dùng được** chính component: phần tử
 * cần prop mà `PanelProps` không khai (`<Link href>`), hoặc chỗ chỉ có một
 * `className` để truyền vào. Cùng một nguồn với `Panel` nên hai bên không lệch.
 */
export function panelClassName({
  variant = "default",
  padding = "sm",
}: Pick<PanelProps, "variant" | "padding"> = {}): string {
  return cn(
    "rounded-md border border-line",
    variant === "muted" ? "bg-surface-muted" : "bg-transparent",
    padding === "md" ? "p-4" : padding === "sm" ? "p-3" : "",
  );
}

export function Panel({
  as: Component = "div",
  variant = "default",
  padding = "sm",
  className,
  ...props
}: PanelProps) {
  return <Component className={cn(panelClassName({ variant, padding }), className)} {...props} />;
}
