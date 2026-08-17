import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bảng dữ liệu — 05 §3.3 #10 và §5.3. Bốn bảng hiện có dùng bốn giá trị
 * `min-w` khác nhau, **hai bảng không có `<caption>`**, và cột đầu không dính.
 *
 * Năm yêu cầu của 05 §5.3 gom hết vào đây:
 *   1. `<caption>` bắt buộc — `caption` là prop **không có mặc định**
 *   2. Cột đầu `sticky left-0` (file Excel xuất ra đã làm đúng, web thì chưa)
 *   3. Chỉ báo cuộn ngang: bóng mờ mép phải + "Vuốt ngang để xem thêm cột"
 *   4. `overflow-x-auto` bọc ngoài
 *   5. ≥20 dòng thì phải phân trang — dùng `Pagination`, không thuộc file này
 *
 * Tạo hình theo 09 §6: viền ngang nhẹ **không viền dọc**, header nền
 * `--bg-surface-muted` chữ 14px semibold, hàng cao 48px.
 *
 * Không có `"use client"`: bảng chỉ đọc dữ liệu, cuộn ngang là hành vi của
 * trình duyệt. Cột nào cần nút bấm thì `cell` trả về `<Button>` của chính trang.
 */

export type DataTableColumn<Row> = {
  /** Khoá duy nhất trong bảng. */
  key: string;
  header: React.ReactNode;
  cell: (row: Row) => React.ReactNode;
  /** Cột số: canh phải và bật `tabular-nums`. */
  numeric?: boolean;
  /** Ẩn cột dưới ngưỡng `sm` — dùng cho cột phụ trên máy 360px. */
  hideBelowSm?: boolean;
  className?: string;
};

export type DataTableProps<Row> = {
  /** Bắt buộc. Câu mô tả bảng, ví dụ "Danh sách thiếu nhi lớp Ấu 1A". */
  caption: string;
  /** Ẩn caption khỏi màn hình khi trang đã có tiêu đề nói đúng nội dung đó. */
  hideCaption?: boolean;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string;
  /** Hiện khi `rows` rỗng. Dùng `EmptyState` đúng 1 trong 3 loại của 09 §9. */
  empty?: React.ReactNode;
  /** Đánh dấu hàng đang được chọn — nơi số 7 trong 12 nơi dùng `--theme-*`. */
  isRowSelected?: (row: Row) => boolean;
  /** Cột đầu dính khi cuộn ngang. Tắt cho bảng hẹp không cần cuộn. */
  stickyFirstColumn?: boolean;
  /** Bề rộng tối thiểu của bảng trước khi sinh cuộn ngang. */
  minWidthClassName?: string;
  className?: string;
};

const HEAD_CELL = "px-4 py-3 text-left text-sm font-semibold text-ink";
const BODY_CELL = "px-4 py-3 align-middle text-sm text-ink";

/**
 * Khung bọc vùng cuộn ngang của bảng — `17` §7.2 V7.
 *
 * `DataTable` không phủ được **mọi** bảng: vài bảng dựng tay vì có ô nhập trong
 * từng ô, có `colSpan`, hoặc có hai tầng `<thead>`. Trước Đợt E, mỗi bảng như
 * thế tự chọn lấy bo và viền của mình ⇒ **bốn kiểu khung khác nhau** cho cùng
 * một thứ. Hằng số này để chúng dùng lại **đúng** khung của `DataTable` thay vì
 * chép gần đúng.
 *
 * 🔴 Là hằng chuỗi, không phải component, và tệp này **không có `"use client"`**
 * — vài bảng dựng tay nằm trong Client Component, vài bảng nằm trong Server
 * Component; một hằng chuỗi đi được cả hai phía.
 */
export const tableScrollFrameClassName = "overflow-x-auto rounded-lg border border-line bg-surface";

export function DataTable<Row>({
  caption,
  hideCaption = false,
  columns,
  rows,
  getRowKey,
  empty,
  isRowSelected,
  stickyFirstColumn = true,
  minWidthClassName = "min-w-[640px]",
  className,
}: DataTableProps<Row>) {
  return (
    <div className={className}>
      {/* `relative` bọc RIÊNG vùng cuộn: bóng mờ phải cao đúng bằng bảng. Đặt
          `relative` lên khung ngoài thì bóng kéo dài xuống phủ cả dòng chữ
          "Vuốt ngang…" bên dưới. Bóng cũng không được nằm TRONG vùng cuộn —
          nằm trong thì nó cuộn theo nội dung và biến mất khỏi mép phải. */}
      <div className="relative">
        <div className={tableScrollFrameClassName}>
          <table className={cn("w-full border-collapse", minWidthClassName)}>
            <caption
              className={cn(
                "caption-top px-4 pt-3 text-left text-xs text-ink-muted",
                hideCaption && "sr-only",
              )}
            >
              {caption}
            </caption>

            <thead>
              <tr className="border-b border-line bg-surface-muted">
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      HEAD_CELL,
                      column.numeric && "text-right",
                      column.hideBelowSm && "hidden sm:table-cell",
                      // Ô đầu của header cũng phải dính, và phải có nền đặc —
                      // nền trong suốt thì chữ của cột thứ hai trượt qua dưới nó.
                      stickyFirstColumn &&
                        index === 0 &&
                        "sticky left-0 z-sticky bg-surface-muted",
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8">
                    {empty ?? (
                      <p className="text-sm text-ink-muted">Chưa có dữ liệu.</p>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const selected = isRowSelected?.(row) ?? false;
                  return (
                    <tr
                      key={getRowKey(row, rowIndex)}
                      aria-selected={isRowSelected ? selected : undefined}
                      className={cn(
                        "h-12 border-b border-line last:border-b-0",
                        selected ? "bg-theme-tint" : "hover:bg-surface-muted",
                      )}
                    >
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          data-numeric={column.numeric ? "" : undefined}
                          className={cn(
                            BODY_CELL,
                            column.numeric && "text-right",
                            column.hideBelowSm && "hidden sm:table-cell",
                            stickyFirstColumn &&
                              columnIndex === 0 &&
                              cn(
                                "sticky left-0 z-sticky",
                                selected ? "bg-theme-tint" : "bg-surface",
                              ),
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bóng mờ là trang trí thuần tuý nên `aria-hidden`; câu chữ bên dưới
            mới là thứ nói cho người dùng biết còn cột nữa (05 §5.3). Cả hai chỉ
            hiện dưới `lg` — từ 1024px trở lên bảng vừa màn hình. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l from-page to-transparent lg:hidden"
        />
      </div>

      <p className="mt-2 text-2xs text-ink-muted lg:hidden">
        Vuốt ngang để xem thêm cột.
      </p>
    </div>
  );
}
