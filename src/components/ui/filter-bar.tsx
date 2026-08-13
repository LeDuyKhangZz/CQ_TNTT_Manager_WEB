import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * Thanh lọc — 05 §3.3 #9. Hiện mỗi trang tự dựng một kiểu lọc khác nhau.
 *
 * Là một `<form method="get">` thật: bấm "Lọc" đổi query string của URL, nên
 * kết quả lọc **chép được, đánh dấu được, bấm Back được**, và chạy **không cần
 * JS** (09 §11). Không có `"use client"`, không giữ state.
 *
 * Các ô lọc nằm trong `<fieldset>` + `<legend>` theo 09 §6 — nếu không, trình
 * đọc màn hình đọc từng ô rời rạc mà không biết chúng thuộc cùng một nhóm.
 */
export type FilterBarProps = {
  /** Ví dụ: "Lọc danh sách thiếu nhi". Không được rỗng. */
  legend: string;
  /** Ẩn legend khỏi màn hình nhưng giữ cho trình đọc màn hình. */
  hideLegend?: boolean;
  /** Đích form. Mặc định gửi về chính trang hiện tại. */
  action?: string;
  /** Các ô lọc — `Select`, `SearchInput`, `Input`… */
  children: React.ReactNode;
  /** Đường dẫn trang khi bỏ hết bộ lọc. Có thì hiện "Xoá lọc". */
  resetHref?: string;
  submitLabel?: string;
  className?: string;
  /**
   * Ô ẩn giữ lại tham số không thuộc bộ lọc (ví dụ `sort`). Form GET **xoá
   * sạch** query string cũ khi gửi, nên tham số nào cần giữ phải nằm ở đây.
   */
  keepParams?: Readonly<Record<string, string | undefined>>;
};

export function FilterBar({
  legend,
  hideLegend = false,
  action,
  children,
  resetHref,
  submitLabel = "Lọc",
  className,
  keepParams,
}: FilterBarProps) {
  return (
    <form
      method="get"
      action={action}
      className={cn("rounded-lg border border-line bg-surface p-4", className)}
    >
      <fieldset className="min-w-0 border-0 p-0">
        <legend
          className={cn(
            "mb-3 flex items-center gap-2 text-sm font-semibold text-ink",
            hideLegend && "sr-only",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {legend}
        </legend>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>

        {keepParams
          ? Object.entries(keepParams)
              .filter(([, value]) => value !== undefined && value !== "")
              .map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))
          : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit">{submitLabel}</Button>
          {resetHref ? (
            <Link
              href={resetHref}
              className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Xoá lọc
            </Link>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
