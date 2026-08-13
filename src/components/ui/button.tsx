import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Nút theo design system đã duyệt (docs/.../09 §6).
//
// 🔴 Chữ dùng `--theme-on-primary`, KHÔNG hardcode `text-white`.
// Ngành Nghĩa Sĩ có nền vàng nghệ và chữ ĐẬM `#2E2A27` (Q-06/N-3); ép trắng ở
// đây là trượt AA ngay. Xem 09 §4.1 "hai ngoại lệ bắt buộc nhớ".
//
// Touch target >= 44px (`min-h-control`) ở **mọi** size: `sm` là nút HẸP NGANG
// chứ không phải nút thấp. Bản trước cho `sm` cao 36px và responsive QA của
// P7-T1 bắt được — người dùng chính là giáo lý viên bấm bằng ngón tay trên máy
// 360px, không phải chuột. Đây là mục trong danh sách KHÔNG ĐƯỢC ĐỤNG (09 §11).
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium",
    "transition-colors duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-theme-primary text-theme-on-primary hover:bg-theme-hover active:bg-theme-active",
        secondary: "bg-surface-muted text-ink hover:bg-theme-tint",
        outline: "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
        ghost: "text-ink hover:bg-surface-muted",
        // `danger` dùng màu TRẠNG THÁI của hệ thống, KHÔNG dùng token ngành
        // (09 §6). Màu ngành làm màu trạng thái là điều cấm thứ 4.
        danger: "bg-danger text-ink-on-dark hover:opacity-90",
      },
      size: {
        sm: "h-control min-h-control px-3",
        md: "h-control min-h-control px-4",
        lg: "h-control min-h-control px-6 text-base",
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
