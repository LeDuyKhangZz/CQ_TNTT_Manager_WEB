import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dải thông báo trong trang — 05 §3.3 #5. Dùng cho: cảnh báo năm học, đang xem
 * dữ liệu lịch sử, chưa được phân công, kết quả thao tác ghi ngắn (D-61).
 *
 * 🔴 Mỗi tone có ICON RIÊNG (09 §3) — màu không bao giờ là tín hiệu duy nhất.
 * KHÔNG dùng token ngành: đây là màu trạng thái (điều cấm thứ 4).
 */
const alertVariants = cva(
  "flex gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      tone: {
        // Nợ #5 (Đợt F): `border-{tone}/30` KHÔNG sinh CSS — token màu là
        // `var()` trần nên Tailwind bỏ bổ ngữ độ mờ, viền rơi về màu mặc định
        // `--border` từ trước tới nay. Dùng token đặc như dải cảnh báo của
        // imports/[batchId] đã làm.
        info: "border-info bg-info-subtle text-ink",
        success: "border-success bg-success-subtle text-ink",
        warning: "border-warning bg-warning-subtle text-ink",
        danger: "border-danger bg-danger-subtle text-ink",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const TONE_META = {
  info: { Icon: Info, className: "text-info", srLabel: "Thông tin" },
  success: { Icon: CheckCircle2, className: "text-success", srLabel: "Thành công" },
  warning: { Icon: AlertTriangle, className: "text-warning", srLabel: "Cảnh báo" },
  danger: { Icon: XCircle, className: "text-danger", srLabel: "Lỗi" },
} as const;

export type AlertTone = keyof typeof TONE_META;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  /** Nút hành động đặt cuối dải, ví dụ "Về lớp của tôi". */
  action?: React.ReactNode;
}

export function Alert({
  className,
  tone = "info",
  title,
  action,
  children,
  ...props
}: AlertProps) {
  const meta = TONE_META[tone ?? "info"];

  return (
    <div
      // `danger` phải cắt ngang lời đang đọc; các tone khác thì không.
      role={tone === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <meta.Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", meta.className)}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="sr-only">{meta.srLabel}:</span>
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-ink-muted">{children}</div> : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}
