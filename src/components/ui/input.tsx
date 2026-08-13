import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ô nhập — docs/.../09 §6.
 * Viền dùng `--border-strong` (3,77:1). Bản cũ dùng `--border` chỉ đạt 1,2:1,
 * trượt WCAG 1.4.11 (thành phần giao diện phải >= 3:1).
 * Cao 44px, tự lên 48px ở `data-density="comfortable"` của M13.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Dùng lại cho `Textarea` và `Select` để ba ô nhập trông như một hệ. */
export const inputBaseClassName = [
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2",
  "text-base text-ink placeholder:text-ink-muted",
  "outline-none transition-colors duration-fast ease-out",
  "focus-visible:border-theme-primary focus-visible:ring-2 focus-visible:ring-theme-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
  "aria-[invalid=true]:border-danger",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputBaseClassName, "flex h-control", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
