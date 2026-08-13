import { cn } from "@/lib/utils";
import type { ThemeContext } from "@/lib/theme/types";

/**
 * Chỉ báo ngữ cảnh bằng CHỮ — 13 §6, 10 §9, `06` §2 mục 7.
 *
 * 🔴 Component này cố ý KHÔNG có màu ngành. Nó tồn tại chính vì màu không được
 * là tín hiệu duy nhất (09 §10 điều 5): người dùng phải đọc được *"tôi đang ở
 * đâu"* kể cả khi không phân biệt được màu, khi in ra giấy, hay khi đọc bằng
 * trình đọc màn hình. Muốn thêm chấm màu thì dùng `BranchChip` bên cạnh.
 *
 * Hai kiểu câu, đúng như tài liệu đã duyệt:
 *   `viewing`   — "Đang xem: Ngành Ấu Nhi · Năm học 2026-2027"  (đầu sidebar)
 *   `filtering` — "Đang lọc: Ngành Ấu Nhi"                      (Q-11, `/reports`)
 */

export type ContextIndicatorProps = {
  theme: ThemeContext;
  /** `filtering` cho `/reports` khi đã lọc về một ngành (Q-11). */
  mode?: "viewing" | "filtering";
  /**
   * Kèm mã năm học vào câu. Mặc định có ở `viewing`, không có ở `filtering` —
   * bộ lọc báo cáo nói về ngành, không nói về năm.
   */
  showAcademicYear?: boolean;
  className?: string;
};

/**
 * "Ngành Ấu Nhi" cho ngành thật, "Huynh Trưởng" cho mặc định trung tính.
 *
 * 🔴 `HUYNH_TRUONG` KHÔNG phải một dòng trong `sectors` (`sector-palette.ts`) —
 * viết "Ngành Huynh Trưởng" là bịa ra một ngành không tồn tại trong xứ đoàn.
 * Phân biệt bằng `branchId`: null nghĩa là đang ở mặc định trung tính.
 */
export function branchLabel(theme: Pick<ThemeContext, "branchId" | "branchName">): string {
  return theme.branchId ? `Ngành ${theme.branchName}` : theme.branchName;
}

export function ContextIndicator({
  theme,
  mode = "viewing",
  showAcademicYear = mode === "viewing",
  className,
}: ContextIndicatorProps) {
  const prefix = mode === "filtering" ? "Đang lọc:" : "Đang xem:";
  const year = showAcademicYear ? theme.academicYearCode : null;

  return (
    <p
      data-context-indicator={mode}
      data-theme-key={theme.themeKey}
      className={cn("text-xs text-ink-muted", className)}
    >
      {prefix}{" "}
      <span className="font-semibold text-ink">{branchLabel(theme)}</span>
      {year ? (
        <>
          {" · "}
          <span className="whitespace-nowrap">Năm học {year}</span>
        </>
      ) : null}
    </p>
  );
}
