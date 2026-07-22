import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Nút cơ bản theo design tokens (docs/06). Touch target >= 44px (min-h-11) ở
// **mọi** size: `sm` là nút hẹp ngang chứ không phải nút thấp. Bản trước cho
// `sm` cao 36px và responsive QA của P7-T1 bắt được — người dùng chính là giáo
// lý viên bấm bằng ngón tay trên máy 360px, không phải chuột.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        secondary: "bg-surface-muted text-text hover:bg-secondary",
        outline: "border border-border bg-surface text-text hover:bg-surface-muted",
        ghost: "text-text hover:bg-surface-muted",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "h-11 min-h-11 px-3",
        md: "h-11 min-h-11 px-4",
        lg: "h-12 min-h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
