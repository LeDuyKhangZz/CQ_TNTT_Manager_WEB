import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";

/**
 * Bảng dữ liệu **v2** — REDESIGN 2C task R2.1 (`11_DESIGN_SYSTEM` U1, `07` §5).
 *
 * Bản v1 (05 §5.3) giải năm việc và giữ nguyên hết: `<caption>` bắt buộc, cột
 * đầu dính, chỉ báo cuộn ngang bằng CHỮ, khung `overflow-x-auto`, phân trang để
 * ngoài. v2 thêm sáu thứ mà D-R2 cần khi desktop quay lại dùng BẢNG cho danh
 * sách lớn (747 hồ sơ):
 *
 *   1. **Sắp xếp 1 cột** — `aria-sort` + link, KHÔNG phải nút + state
 *   2. **Ẩn/hiện cột** — `data-column` để `DataTableColumnToggle` (client) tắt
 *   3. **Header dính** khi vùng dữ liệu có trần chiều cao
 *   4. **Mật độ compact** cho vùng staff-facing (Q-R10: portal KHÔNG compact)
 *   5. **Chọn hàng** (opt-in) — ô tick thật, chạy được không cần JS
 *   6. **`mobileRow`** — dưới `md` mỗi hàng tự xếp thành card-row, **dùng lại
 *      đúng `cell` của cột desktop** nên không có đường nào để hai bên lệch số
 *
 * 🔴 **Tệp này vẫn KHÔNG có `"use client"`, và đó là ràng buộc kiến trúc chứ
 * không phải sở thích.** `cell`/`getRowKey` là HÀM; Server Component không
 * truyền được hàm qua ranh giới client. Chín nơi đang dùng bảng này có cả trang
 * server (`/reports/snapshots`) lẫn component client (`gradebook-editor`) —
 * gắn `"use client"` vào đây là làm chết các trang server. Hệ quả thiết kế:
 * mọi thứ v2 thêm phải chạy được **bằng HTML + link + form**, còn phần cần
 * JavaScript (nhớ cột đã ẩn) nằm ở tệp riêng `data-table-column-toggle.tsx`.
 *
 * 🔴 **Sắp xếp là LINK, không phải state.** Bảng lớn luôn đi kèm phân trang
 * máy chủ; sắp xếp bằng state chỉ xếp lại **trang hiện tại** — tức là nói dối
 * người dùng. Link đổi query ⇒ máy chủ xếp lại toàn tập, chép được đường dẫn,
 * bấm Back đúng, và chạy khi JS chưa tải (`09` §11).
 */

export type DataTableSortDirection = "asc" | "desc";

export type DataTableColumn<Row> = {
  /** Khoá duy nhất trong bảng. Cũng là giá trị `data-column` để ẩn/hiện cột. */
  key: string;
  header: React.ReactNode;
  cell: (row: Row) => React.ReactNode;
  /** Cột số: canh phải và bật `tabular-nums`. */
  numeric?: boolean;
  /** Ẩn cột dưới ngưỡng `sm` — dùng cho cột phụ trên máy 360px. */
  hideBelowSm?: boolean;
  /** Ẩn cột dưới ngưỡng `md` — dải máy bảng của `08` §7. */
  hideBelowMd?: boolean;
  /**
   * Bật sắp xếp cho cột và cho biết **giá trị đi vào query** (thường là tên
   * trường mà máy chủ hiểu). Bỏ trống ⇒ cột không sắp xếp được.
   */
  sortKey?: string;
  /**
   * Nhãn bằng CHỮ của cột. Bắt buộc khi `header` không phải chuỗi — menu ẩn/hiện
   * cột và nhãn của card-row đều cần đọc được thành lời.
   */
  label?: string;
  /** Cho phép người dùng ẩn cột này trong `DataTableColumnToggle`. */
  hideable?: boolean;
  className?: string;
};

export type DataTableSort = {
  /** `sortKey` đang được sắp xếp; `null` = chưa sắp xếp theo cột nào. */
  key: string | null;
  direction: DataTableSortDirection;
  /** Trang tự quyết giữ lại query nào (bộ lọc, trang, cỡ trang). */
  buildHref: (sortKey: string, direction: DataTableSortDirection) => string;
};

export type DataTableSelection<Row> = {
  /** `name` của ô tick — trang bọc bảng trong `<form>` của chính nó. */
  name: string;
  getValue: (row: Row) => string;
  /** Nhãn NÊU TÊN bản ghi: 25 ô tick giống hệt nhau thì đọc màn hình chịu. */
  getLabel: (row: Row) => string;
  defaultChecked?: (row: Row) => boolean;
  disabled?: (row: Row) => boolean;
  /** Ô tick "chọn tất cả" — cần JS nên do trang client tự cắm vào. */
  headerSlot?: React.ReactNode;
  /**
   * Thay hẳn ô tick mặc định (trang client cần ô tick có `onChange`).
   * Vẫn giữ nguyên bề rộng cột, vùng chạm và vị trí dính.
   */
  renderCell?: (row: Row) => React.ReactNode;
};

/**
 * Cách xếp một hàng thành card-row dưới `md`. **Chỉ nhận `key` của cột**, không
 * nhận hàm dựng riêng: đó chính là chỗ bản chế tay xưa nay đi lệch — sửa cột
 * desktop mà quên sửa nhánh mobile (`11` U1 "1 nguồn cột").
 */
export type DataTableMobileRow = {
  /** Cột làm dòng 1 (thường là tên). */
  titleKey: string;
  /** Cột nằm bên phải dòng 1 (chip trạng thái). */
  trailingKey?: string;
  /** Các cột thành dòng phụ, mỗi cột một dòng, có nhãn bằng chữ. */
  metaKeys?: readonly string[];
  /** Cột hành động — luôn nằm cuối card. */
  actionsKey?: string;
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
  /** Bề rộng tối thiểu của bảng trước khi sinh cuộn ngang (v1, class Tailwind). */
  minWidthClassName?: string;
  /**
   * Bề rộng tối thiểu dạng giá trị CSS ("720px"). Dùng cùng `mobileRow`: bề
   * rộng ấy chỉ áp **từ `md` trở lên**, để card-row ở 360px không sinh cuộn
   * ngang (E2E ba viewport canh đúng điểm này).
   */
  minWidth?: string;
  /** Định danh bảng — nối `DataTableColumnToggle` với đúng bảng này. */
  tableId?: string;
  /** `compact` = vùng dữ liệu staff-facing (`07` §4). Portal giữ mặc định. */
  density?: "comfortable" | "compact";
  /** Header dính khi cuộn dọc. Đi kèm `maxHeightClassName`. */
  stickyHeader?: boolean;
  /**
   * Trần chiều cao của vùng cuộn khi bật `stickyHeader`.
   *
   * 🔴 Không phải tuỳ chọn trang trí: `overflow-x: auto` biến khung bọc thành
   * **vùng cuộn của cả hai trục**, nên `position: sticky` của `<th>` neo vào
   * khung ấy chứ không neo vào trang. Khung cao bằng nội dung thì không có gì
   * để dính — phải có trần chiều cao thì header mới đứng lại được.
   */
  maxHeightClassName?: string;
  sort?: DataTableSort;
  selection?: DataTableSelection<Row>;
  mobileRow?: DataTableMobileRow;
  /**
   * Cả hàng là một link. Link thật nằm ở ô dữ liệu đầu và **giãn ra phủ hàng**
   * bằng `::after` — không dùng `onClick` trên `<tr>` (cần JS, và bàn phím
   * không tới được). Ô dữ liệu đầu vì thế **không được chứa link riêng**.
   */
  rowHref?: (row: Row) => string | null;
  /** Chân bảng (phân trang, đếm đã chọn) — component riêng làm ở R2.11. */
  footer?: React.ReactNode;
  className?: string;
};

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

/**
 * Tạo hình theo 09 §6: viền ngang nhẹ **không viền dọc**, header nền
 * `--bg-surface-muted` chữ 14px semibold, hàng cao 48px (compact 44px — vẫn
 * đứng trên sàn vùng chạm 44px của `09` §10 điều 7, không được hạ thêm).
 *
 * Các biến thể viết thành **chuỗi đầy đủ**, không ghép động: Tailwind quét mã
 * nguồn bằng văn bản, `md:${x}` ghép lúc chạy thì lớp ấy không có trong CSS
 * xuất ra và im lặng biến mất.
 */
const CELL_PADDING = {
  comfortable: { plain: "px-4 py-3", card: "p-0 md:px-4 md:py-3" },
  compact: { plain: "px-3 py-2", card: "p-0 md:px-3 md:py-2" },
} as const;

const ROW_HEIGHT = {
  comfortable: { plain: "h-12", card: "md:h-12" },
  compact: { plain: "h-11", card: "md:h-11" },
} as const;

/**
 * Cột dính: ô chọn ở `left-0`, ô dữ liệu đầu lùi đúng bề rộng ô chọn.
 * Ô chọn rộng cứng `w-12` (48px) và padding `px-3` (12+20+12 = 44px < 48px) nên
 * `left-12` khớp chính xác — nới padding ô chọn là hai cột dính chồng lên nhau.
 */
const STICKY_LEFT = {
  first: { plain: "sticky left-0 z-sticky", card: "md:sticky md:left-0 md:z-sticky" },
  afterSelection: { plain: "sticky left-12 z-sticky", card: "md:sticky md:left-12 md:z-sticky" },
} as const;

const SELECTION_CELL = "w-12 px-3 py-2";

/** Card-row: 2 cột khi không có ô chọn, 3 cột khi có. */
const CARD_ROW = {
  plain:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:table-row md:px-0 md:py-0",
  withSelection:
    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 md:table-row md:px-0 md:py-0",
} as const;

const CARD_PLACEMENT = {
  plain: {
    selection: "col-start-1 row-start-1",
    title: "col-start-1 row-start-1 min-w-0",
    trailing: "col-start-2 row-start-1 justify-self-end",
    meta: "col-start-1 col-end-3 text-xs text-ink-muted md:text-sm md:text-ink",
    actions: "col-start-1 col-end-3 md:text-right",
    hidden: "hidden md:table-cell",
  },
  withSelection: {
    selection: "col-start-1 row-start-1",
    title: "col-start-2 row-start-1 min-w-0",
    trailing: "col-start-3 row-start-1 justify-self-end",
    meta: "col-start-2 col-end-4 text-xs text-ink-muted md:text-sm md:text-ink",
    actions: "col-start-2 col-end-4 md:text-right",
    hidden: "hidden md:table-cell",
  },
} as const;

const HEAD_CELL = "text-left text-sm font-semibold text-ink";
const BODY_CELL = "align-middle text-sm text-ink";

/** Nhãn chữ của cột: `label` trước, `header` nếu nó vốn đã là chuỗi. */
export function dataTableColumnLabel<Row>(column: DataTableColumn<Row>): string | null {
  if (column.label) return column.label;
  return typeof column.header === "string" ? column.header : null;
}

/** Bấm lại đúng cột đang xếp thì đảo chiều; sang cột khác thì bắt đầu tăng dần. */
function nextSortDirection(
  sortKey: string,
  sort: DataTableSort | undefined,
): DataTableSortDirection {
  if (!sort || sort.key !== sortKey) return "asc";
  return sort.direction === "asc" ? "desc" : "asc";
}

function SortIcon({ state }: { state: DataTableSortDirection | "none" }) {
  const className = "h-4 w-4 shrink-0";
  if (state === "asc") return <ArrowUp className={className} strokeWidth={1.75} aria-hidden="true" />;
  if (state === "desc") return <ArrowDown className={className} strokeWidth={1.75} aria-hidden="true" />;
  return (
    <ChevronsUpDown
      className={cn(className, "text-ink-muted")}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

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
  minWidth,
  tableId,
  density = "comfortable",
  stickyHeader = false,
  maxHeightClassName = "max-h-[70vh]",
  sort,
  selection,
  mobileRow,
  rowHref,
  footer,
  className,
}: DataTableProps<Row>) {
  const cardMode = mobileRow ? "card" : "plain";
  const layout = selection ? "withSelection" : "plain";
  const padding = CELL_PADDING[density][cardMode];
  const rowHeight = ROW_HEIGHT[density][cardMode];
  const placement = CARD_PLACEMENT[layout];
  const columnCount = columns.length + (selection ? 1 : 0);

  // Bề rộng tối thiểu: `minWidth` (v2) đi qua biến CSS để lớp Tailwind vẫn là
  // chuỗi tĩnh; `minWidthClassName` (v1) giữ nguyên cho chín nơi đang dùng.
  const minWidthStyle = minWidth
    ? ({ "--dt-min-width": minWidth } as React.CSSProperties)
    : undefined;
  const minWidthClass = minWidth
    ? mobileRow
      ? "md:min-w-[var(--dt-min-width)]"
      : "min-w-[var(--dt-min-width)]"
    : mobileRow
      ? undefined
      : minWidthClassName;

  function cardRoleOf(key: string): keyof typeof placement {
    if (!mobileRow) return "hidden";
    if (mobileRow.titleKey === key) return "title";
    if (mobileRow.trailingKey === key) return "trailing";
    if (mobileRow.actionsKey === key) return "actions";
    if (mobileRow.metaKeys?.includes(key)) return "meta";
    return "hidden";
  }

  return (
    <div
      className={className}
      data-table-id={tableId}
      // R2.10 sẽ gắn token thật cho `[data-density="compact"]`; tới lúc ấy bảng
      // này đã khai báo sẵn nên không phải sửa lại consumer nào.
      data-density={density === "compact" ? "compact" : undefined}
    >
      {/* `relative` bọc RIÊNG vùng cuộn: bóng mờ phải cao đúng bằng bảng. Đặt
          `relative` lên khung ngoài thì bóng kéo dài xuống phủ cả dòng chữ
          "Vuốt ngang…" bên dưới. Bóng cũng không được nằm TRONG vùng cuộn —
          nằm trong thì nó cuộn theo nội dung và biến mất khỏi mép phải. */}
      <div className="relative">
        <div
          className={cn(
            tableScrollFrameClassName,
            stickyHeader && "overflow-y-auto",
            stickyHeader && maxHeightClassName,
          )}
        >
          <table className={cn("w-full border-collapse", minWidthClass)} style={minWidthStyle}>
            <caption
              className={cn(
                "caption-top px-4 pt-3 text-left text-xs text-ink-muted",
                hideCaption && "sr-only",
              )}
            >
              {caption}
            </caption>

            {/* Card-row không có hàng tiêu đề: nhãn đi kèm từng dòng phụ. Từ
                `md` trở lên vẫn là `<thead>` thật, cấu trúc bảng không mất. */}
            <thead className={cn(mobileRow && "hidden md:table-header-group")}>
              <tr className="border-b border-line bg-surface-muted">
                {selection ? (
                  <th
                    scope="col"
                    className={cn(
                      HEAD_CELL,
                      SELECTION_CELL,
                      stickyHeader && "sticky top-0 z-sticky",
                      stickyFirstColumn && STICKY_LEFT.first[cardMode],
                      (stickyHeader || stickyFirstColumn) && "bg-surface-muted",
                    )}
                  >
                    {selection.headerSlot ?? <span className="sr-only">Chọn</span>}
                  </th>
                ) : null}

                {columns.map((column, index) => {
                  const sortState =
                    sort && column.sortKey && sort.key === column.sortKey ? sort.direction : "none";
                  const target = column.sortKey
                    ? nextSortDirection(column.sortKey, sort)
                    : "asc";

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      data-column={column.key}
                      // `aria-sort` chỉ đặt trên cột SẮP XẾP ĐƯỢC — đặt "none"
                      // lên cột thường là nói với trình đọc màn hình rằng cột
                      // ấy bấm được, trong khi nó không bấm được.
                      aria-sort={
                        column.sortKey && sort
                          ? sortState === "asc"
                            ? "ascending"
                            : sortState === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={cn(
                        HEAD_CELL,
                        padding,
                        column.numeric && "text-right",
                        column.hideBelowSm && "hidden sm:table-cell",
                        column.hideBelowMd && "hidden md:table-cell",
                        stickyHeader && "sticky top-0 z-sticky",
                        // Ô đầu của header cũng phải dính, và phải có nền đặc —
                        // nền trong suốt thì chữ của cột thứ hai trượt qua dưới nó.
                        stickyFirstColumn &&
                          index === 0 &&
                          STICKY_LEFT[selection ? "afterSelection" : "first"][cardMode],
                        (stickyHeader || (stickyFirstColumn && index === 0)) && "bg-surface-muted",
                        column.className,
                      )}
                    >
                      {column.sortKey && sort ? (
                        <Link
                          href={sort.buildHref(column.sortKey, target)}
                          className={cn(
                            "inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-ink",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2",
                            column.numeric && "flex-row-reverse",
                          )}
                        >
                          {column.header}
                          <SortIcon state={sortState} />
                          {/* Mũi tên là hình; câu này mới nói ra bấm vào thì
                              chuyện gì xảy ra (09 §10 điều 5 — màu/hình không
                              bao giờ là tín hiệu duy nhất). */}
                          <span className="sr-only">
                            {sortState === "none"
                              ? "— sắp xếp tăng dần"
                              : sortState === "asc"
                                ? "— đang xếp tăng dần, bấm để xếp giảm dần"
                                : "— đang xếp giảm dần, bấm để xếp tăng dần"}
                          </span>
                        </Link>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-8">
                    {empty ?? (
                      <p className="text-sm text-ink-muted">Chưa có dữ liệu.</p>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => {
                  const selected = isRowSelected?.(row) ?? false;
                  const href = rowHref?.(row) ?? null;
                  const stickyBackground = selected ? " bg-theme-tint" : " bg-surface";

                  return (
                    <tr
                      key={getRowKey(row, rowIndex)}
                      aria-selected={isRowSelected ? selected : undefined}
                      className={cn(
                        rowHeight,
                        "border-b border-line last:border-b-0",
                        // Card-row: một hàng = một khối, dòng 1 là tên + chip,
                        // các dòng sau là thông tin phụ có nhãn. Từ `md` trở
                        // lên quay lại đúng `table-row`.
                        mobileRow && CARD_ROW[layout],
                        href && "relative",
                        selected ? "bg-theme-tint" : "hover:bg-surface-muted",
                      )}
                    >
                      {selection ? (
                        <td
                          className={cn(
                            BODY_CELL,
                            SELECTION_CELL,
                            mobileRow && "block md:table-cell",
                            mobileRow && placement.selection,
                            stickyFirstColumn &&
                              STICKY_LEFT.first[cardMode] + stickyBackground,
                          )}
                        >
                          {selection.renderCell?.(row) ?? (
                            <Checkbox
                              name={selection.name}
                              value={selection.getValue(row)}
                              defaultChecked={selection.defaultChecked?.(row)}
                              disabled={selection.disabled?.(row)}
                              // Nhãn nêu TÊN bản ghi — xem `getLabel`.
                              aria-label={selection.getLabel(row)}
                              labelClassName="flex"
                            />
                          )}
                        </td>
                      ) : null}

                      {columns.map((column, columnIndex) => {
                        const role = cardRoleOf(column.key);
                        const label = dataTableColumnLabel(column);
                        const isFirstData = columnIndex === 0;

                        return (
                          <td
                            key={column.key}
                            data-column={column.key}
                            data-numeric={column.numeric ? "" : undefined}
                            className={cn(
                              BODY_CELL,
                              padding,
                              mobileRow && "block md:table-cell",
                              mobileRow && placement[role],
                              column.numeric && "text-right",
                              column.hideBelowSm && "hidden sm:table-cell",
                              column.hideBelowMd && "hidden md:table-cell",
                              stickyFirstColumn &&
                                isFirstData &&
                                STICKY_LEFT[selection ? "afterSelection" : "first"][cardMode] +
                                  stickyBackground,
                              // Ô có nút/menu phải nằm TRÊN tấm phủ của link
                              // hàng, nếu không bấm vào nút lại mở trang chi
                              // tiết. `relative` là đủ: hai bên cùng
                              // `z-index: auto`, thứ đứng sau trong DOM vẽ trên.
                              href && !isFirstData && "relative",
                              column.className,
                            )}
                          >
                            {mobileRow && role === "meta" && label ? (
                              <span className="mr-1 md:hidden">{label}:</span>
                            ) : null}

                            {href && isFirstData ? (
                              <Link
                                href={href}
                                className={cn(
                                  "rounded-sm after:absolute after:inset-0 after:content-['']",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2",
                                )}
                              >
                                {column.cell(row)}
                              </Link>
                            ) : (
                              column.cell(row)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bóng mờ là trang trí thuần tuý nên `aria-hidden`; câu chữ bên dưới
            mới là thứ nói cho người dùng biết còn cột nữa (05 §5.3). Cả hai chỉ
            hiện dưới `lg` — từ 1024px trở lên bảng vừa màn hình. Có `mobileRow`
            thì dưới `md` không còn bảng để cuộn, nên cả hai lùi lên từ `md`. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l from-page to-transparent lg:hidden",
            mobileRow && "hidden md:block",
          )}
        />
      </div>

      <p
        className={cn(
          "mt-2 text-2xs text-ink-muted lg:hidden",
          mobileRow && "hidden md:block lg:hidden",
        )}
      >
        Vuốt ngang để xem thêm cột.
      </p>

      {footer}
    </div>
  );
}
