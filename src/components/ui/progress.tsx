import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Thanh tiến độ — 05 §3.3 #18. Nhập Excel hiện **không có gì hiện tiến độ**;
 * người dùng nhìn màn hình đứng im và bấm lại nút.
 *
 * 🔴 Con số luôn hiện **bằng chữ** cạnh thanh: màu và độ dài thanh không được
 * là tín hiệu duy nhất (09 §10 điều 5). Người dùng phải đọc được "142/900 dòng"
 * chứ không phải đoán theo chiều dài vệt màu.
 *
 * `role="progressbar"` + `aria-valuenow/min/max` + `aria-valuetext`: trình đọc
 * màn hình đọc "142 trên 900 dòng", không đọc "16 phần trăm" vô nghĩa.
 */

export type ProgressProps = {
  /** Bỏ trống ⇒ tiến độ **không xác định** (đang chạy, chưa biết bao lâu). */
  value?: number;
  max?: number;
  /** Bắt buộc. Ví dụ: "Đang nhập tệp danh sách". */
  label: string;
  /** Ẩn nhãn khỏi màn hình khi chỗ đặt đã nói rõ. */
  hideLabel?: boolean;
  /** Chữ hiện bên phải nhãn. Mặc định "value/max". */
  valueText?: string;
  className?: string;
};

export function Progress({
  value,
  max = 100,
  label,
  hideLabel = false,
  valueText,
  className,
}: ProgressProps) {
  const labelId = React.useId();
  const indeterminate = value === undefined;
  const safeMax = max > 0 ? max : 100;
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), safeMax);
  const percent = indeterminate ? 0 : Math.round((clamped / safeMax) * 100);
  const text = indeterminate ? "Đang xử lý…" : (valueText ?? `${clamped}/${safeMax}`);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "mb-1 flex items-baseline justify-between gap-3 text-sm",
          hideLabel && "sr-only",
        )}
      >
        <span id={labelId} className="font-semibold text-ink">
          {label}
        </span>
        <span className="text-ink-muted" data-numeric>
          {text}
        </span>
      </div>

      <div
        role="progressbar"
        // Trỏ vào nhãn hiện trên màn hình, không chép lại bằng `aria-label`:
        // nhãn ẩn hay hiện thì thanh vẫn có đúng một cái tên, và tên đó luôn
        // khớp với chữ người dùng đang đọc.
        aria-labelledby={labelId}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={indeterminate ? undefined : text}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          // Nơi số 8 trong 12 nơi dùng `--theme-*` không nhận thanh tiến độ,
          // nên vệt chạy dùng màu TRUNG TÍNH đậm, không dùng màu ngành.
          className={cn(
            "h-full rounded-full bg-ink transition-[width] duration-base ease-out",
            indeterminate && "w-1/3 animate-pulse",
          )}
          style={indeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
