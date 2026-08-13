import * as React from "react";
import { cn } from "@/lib/utils";
import { inputBaseClassName } from "./input";

/**
 * Ô nhập nhiều dòng — 05 §3.3 #6. Trước đây chuỗi class được chép tay ở 8 module.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBaseClassName, "block min-h-control resize-y", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
