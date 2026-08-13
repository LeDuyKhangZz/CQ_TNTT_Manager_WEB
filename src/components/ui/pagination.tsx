import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Phân trang — 05 §3.3 #8. SW-07: hiện **không có phân trang ở bất kỳ đâu**;
 * `/students` tải thẳng ~900 em vào một trang.
 *
 * Dựng bằng `<Link>`, **không** bằng nút + state: người dùng phải chép được
 * đường dẫn trang 3, mở tab mới, bấm Back. Chạy được không cần JS (09 §11).
 *
 * Vùng chạm 44px cho mọi ô số — đây là chỗ giáo lý viên bấm bằng ngón tay trên
 * máy 360px, và các ô số là mục tiêu nhỏ nhất trong toàn hệ thống.
 *
 * Trang hiện tại tô `tint` + `accent-text` + viền + `aria-current="page"` (ba
 * tín hiệu, không chỉ màu). Đây là nơi số 7 trong 12 nơi được dùng `--theme-*`
 * — "hàng/thẻ đang được chọn" (09 §4.4). KHÔNG dùng `primary` làm nền ô số:
 * `primary` chỉ dành cho nút chính, và ô số không phải nút chính.
 */

export type PaginationProps = {
  /** Trang hiện tại, đếm từ 1. */
  page: number;
  pageSize: number;
  totalItems: number;
  /** Sinh href cho một trang. Trang tự quyết giữ lại query nào. */
  buildHref: (page: number) => string;
  /** Danh từ đếm được, ví dụ "thiếu nhi". Dùng cho dòng tóm tắt. */
  itemLabel?: string;
  className?: string;
};

const ELLIPSIS = "ellipsis" as const;

/**
 * Cửa sổ số trang: luôn có trang đầu, trang cuối, và trang hiện tại ± 1.
 * Tách riêng để test được mà không phải dựng DOM.
 */
export function paginationRange(
  page: number,
  totalPages: number,
): (number | typeof ELLIPSIS)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | typeof ELLIPSIS)[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push(ELLIPSIS);
    result.push(value);
    previous = value;
  }
  return result;
}

const cellClassName =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 text-sm";

export function Pagination({
  page,
  pageSize,
  totalItems,
  buildHref,
  itemLabel = "mục",
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), totalPages);

  // Một trang thì không phân trang, nhưng vẫn nói rõ đang xem bao nhiêu.
  const firstItem = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const lastItem = Math.min(current * pageSize, totalItems);
  const summary =
    totalItems === 0
      ? `Không có ${itemLabel} nào.`
      : `Đang xem ${firstItem}–${lastItem} trong ${totalItems} ${itemLabel}.`;

  return (
    <nav
      aria-label="Phân trang"
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-ink-muted" data-numeric>
        {summary}
      </p>

      {totalPages > 1 ? (
        <ul className="flex flex-wrap items-center gap-1">
          <li>
            {current > 1 ? (
              <Link
                href={buildHref(current - 1)}
                rel="prev"
                aria-label="Trang trước"
                className={cn(cellClassName, "text-ink hover:bg-surface-muted")}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden sm:inline">Trước</span>
              </Link>
            ) : (
              // Nút chết phải ở lại trong cây a11y để bố cục không nhảy, nhưng
              // không được bấm và không được là link.
              <span
                aria-disabled="true"
                className={cn(cellClassName, "text-ink-muted opacity-60")}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden sm:inline">Trước</span>
              </span>
            )}
          </li>

          {paginationRange(current, totalPages).map((entry, index) =>
            entry === ELLIPSIS ? (
              <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-ink-muted">
                …
              </li>
            ) : (
              <li key={entry}>
                {entry === current ? (
                  <span
                    aria-current="page"
                    className={cn(
                      cellClassName,
                      "border border-theme-border bg-theme-tint font-semibold text-theme-accent-text",
                    )}
                    data-numeric
                  >
                    {entry}
                  </span>
                ) : (
                  <Link
                    href={buildHref(entry)}
                    aria-label={`Trang ${entry}`}
                    className={cn(cellClassName, "text-ink hover:bg-surface-muted")}
                    data-numeric
                  >
                    {entry}
                  </Link>
                )}
              </li>
            ),
          )}

          <li>
            {current < totalPages ? (
              <Link
                href={buildHref(current + 1)}
                rel="next"
                aria-label="Trang sau"
                className={cn(cellClassName, "text-ink hover:bg-surface-muted")}
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={cn(cellClassName, "text-ink-muted opacity-60")}
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
            )}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
