import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Huy hiệu trạng thái — docs/.../05 §3.1.
 *
 * Ba variant `success`/`warning`/`danger` của bản cũ đều TRƯỢT AA (2,28–3,37:1).
 * Bộ token mới ở 09 §3 giải quyết triệt để.
 *
 * 🔴 Mỗi trạng thái có ICON RIÊNG (09 §3) — màu không bao giờ là tín hiệu duy
 * nhất. Truyền `icon={false}` chỉ khi chữ đã tự nói rõ trạng thái.
 *
 * Badge KHÔNG dùng token ngành: đây là màu trạng thái (điều cấm thứ 4).
 * Chip ngành là component riêng — xem `BranchChip`.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-surface-muted text-ink",
        secondary: "border-transparent bg-surface-muted text-ink-muted",
        // Nợ #5 (Đợt F): `border-{tone}/30` chưa từng sinh CSS (var() trần
        // không nhận bổ ngữ độ mờ) — viền thật là màu mặc định. Token đặc.
        success: "border-success bg-success-subtle text-success",
        warning: "border-warning bg-warning-subtle text-warning",
        danger: "border-danger bg-danger-subtle text-danger",
        info: "border-info bg-info-subtle text-info",
        outline: "border-line-strong bg-surface text-ink-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const VARIANT_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  default: null,
  secondary: null,
  outline: null,
} as const;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Mặc định hiện icon theo variant. `false` để tắt. */
  icon?: boolean;
}

export function Badge({
  className,
  variant,
  icon = true,
  children,
  ...props
}: BadgeProps) {
  const Icon = icon ? VARIANT_ICONS[variant ?? "default"] : null;

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
