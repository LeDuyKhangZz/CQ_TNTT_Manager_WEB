import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Ba loại trạng thái rỗng CHUẨN — 09 §9, 05 §4 (SW-03).
 * Đây là hạng mục 12/14 module cần và hiện 0 module làm đúng.
 *
 * 🔴 Quy tắc câu chữ: LUÔN nêu tên phạm vi cụ thể (tên lớp, tên ngành) lấy từ
 * `ThemeContext.branchName` và `AuthContext`. Không viết "Không có dữ liệu".
 *
 * ⚠️ NGOẠI LỆ BẮT BUỘC: `out-of-scope` KHÔNG được áp cho hồ sơ thiếu nhi —
 * BR-25 cấm lộ sự tồn tại. Ở đó vẫn trả 404 (09 §9, §11).
 */

export type EmptyStateVariant = "no-data" | "out-of-scope" | "not-linked";

/**
 * Minh hoạ đường nét đơn giản, dùng bậc `pastel` + `pastel-deep` của ngành
 * (09 §4.4 nơi số 11) — một trong bốn điểm "cute" đã duyệt.
 * Tự vẽ SVG, không thêm phụ thuộc (cùng lý lẽ với quyết định về biểu đồ, 09 §7).
 */
function Illustration({ variant }: { variant: EmptyStateVariant }) {
  return (
    <svg
      viewBox="0 0 96 72"
      className="h-20 w-24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {variant === "no-data" ? (
        <>
          <rect x="14" y="20" width="68" height="44" rx="8" className="fill-theme-pastel" />
          <path
            d="M30 20v-6a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v6"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M32 40h32M32 52h20"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {variant === "out-of-scope" ? (
        <>
          <circle cx="48" cy="40" r="24" className="fill-theme-pastel" />
          <path
            d="M38 38v-6a10 10 0 0 1 20 0v6"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="34"
            y="38"
            width="28"
            height="20"
            rx="5"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
          />
        </>
      ) : null}

      {variant === "not-linked" ? (
        <>
          <circle cx="34" cy="36" r="16" className="fill-theme-pastel" />
          <circle
            cx="62"
            cy="36"
            r="16"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
            strokeDasharray="5 5"
          />
          <path
            d="M44 36h8"
            className="stroke-theme-pastel-deep"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}

export function EmptyState({
  variant = "no-data",
  title,
  description,
  action,
  className,
}: {
  variant?: EmptyStateVariant;
  title: string;
  /** PHẢI nêu tên phạm vi cụ thể: "Lớp Ấu 1A chưa có thiếu nhi nào ghi danh." */
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
    >
      <Illustration variant={variant} />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-lg text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
