import { cn } from "@/lib/utils";
import { themeCssVariables, type ThemeKey } from "@/lib/theme/sector-palette";

/**
 * Chip ngành — 05 §3.3 #13, 09 §4.4 nơi số 5 và số 9.
 *
 * 🔴 LUÔN có TÊN NGÀNH bằng chữ, không bao giờ chỉ có chấm màu. Đây là tiêu chí
 * nghiệm thu chung của mọi module (11 §5): "không dùng màu làm tín hiệu duy
 * nhất — chip ngành luôn có tên ngành bằng chữ".
 *
 * Hai kiểu, cả hai đã đo tương phản (09 §4.3):
 *   `soft` — nền `tint` + chữ `accent-text`  (4,50–4,55:1)
 *   `cute` — nền `pastel` + chữ `--text` đậm (8,51–10,33:1)
 *
 * Chip tự bơm token của ngành mình nên dùng được BÊN TRONG một `ThemeScope`
 * khác — ví dụ danh sách thiếu nhi nền HUYNH_TRUONG, mỗi dòng một chip ngành.
 */
export function BranchChip({
  themeKey,
  branchName,
  variant = "soft",
  className,
}: {
  themeKey: ThemeKey;
  /** Lấy từ `ThemeContext.branchName` hoặc `sectors.name`. Không được rỗng. */
  branchName: string;
  variant?: "soft" | "cute";
  className?: string;
}) {
  return (
    <span
      data-theme-key={themeKey}
      style={themeCssVariables(themeKey) as React.CSSProperties}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium",
        variant === "cute"
          ? "bg-theme-pastel text-ink"
          : "bg-theme-tint text-theme-accent-text",
        className,
      )}
    >
      {/* Chấm màu chỉ là phần TRANG TRÍ đi kèm chữ, không thay chữ. */}
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-theme-primary"
      />
      {branchName}
    </span>
  );
}
