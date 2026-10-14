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

export function EmptyState({
  variant = "no-data",
  title,
  description,
  action,
  className,
  bare = false,
}: {
  variant?: EmptyStateVariant;
  title: string;
  /** PHẢI nêu tên phạm vi cụ thể: "Lớp Ấu 1A chưa có thiếu nhi nào ghi danh." */
  description: string;
  action?: React.ReactNode;
  className?: string;
  /**
   * R1.5 (redesign 2C, UX-10) — khi trạng thái rỗng nằm BÊN TRONG một Card
   * (hộp thư, tab của workspace), vỏ Card thứ hai là card-lồng-card. `bare`
   * bỏ vỏ, giữ nguyên câu chữ và hành động. Đứng một mình thì vẫn dùng Card.
   */
  bare?: boolean;
}) {
  const Shell = bare ? "div" : Card;
  return (
    <Shell
      data-empty-state={variant}
      className={cn(
        "flex flex-col items-start gap-2 px-4 py-6",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-2xl text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </Shell>
  );
}
