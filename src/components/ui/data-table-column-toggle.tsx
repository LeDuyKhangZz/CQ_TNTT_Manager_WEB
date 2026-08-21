"use client";

import * as React from "react";
import { Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { Dropdown } from "./dropdown";

/**
 * Menu "Cột" — phần **cần JavaScript** của `DataTable` v2 (R2.1, `11` U1).
 *
 * 🔴 Tách hẳn khỏi `data-table.tsx` vì tệp kia **không được** mang `"use
 * client"` (Server Component truyền hàm `cell` vào đó). Hai mảnh nối nhau bằng
 * thuộc tính HTML chứ không bằng React state:
 *
 *   - `DataTable` đánh dấu `data-table-id` ở khung ngoài và `data-column="<key>"`
 *     lên **mọi** `<th>`/`<td>` của cột.
 *   - Menu này bơm một quy tắc CSS `display:none` cho đúng những cột bị ẩn.
 *
 * Nhờ vậy bảng **vẫn do máy chủ dựng** — không phải kéo cả bảng sang client chỉ
 * để giấu một cột. Quy tắc bơm ra có độ đặc hiệu (0,2,0) cao hơn lớp tiện ích
 * của Tailwind (0,1,0) nên thắng cả `md:table-cell`, không cần `!important`.
 *
 * 🔴 Không có JS thì **hiện đủ mọi cột** — mất tiện, không mất dữ liệu. Đây là
 * lý do lựa chọn ẩn cột chỉ nằm ở `localStorage`: nó là sở thích hiển thị của
 * một máy, không phải dữ liệu của xứ đoàn. Không lưu nội dung bảng, chỉ lưu
 * danh sách khoá cột (`09` §11 + ràng buộc "không cache HTML" của máy dùng chung).
 */

export type DataTableColumnOption = {
  key: string;
  /** Nhãn bằng CHỮ — menu này là nơi duy nhất người dùng đọc tên cột khi cột đã ẩn. */
  label: string;
};

export type DataTableColumnToggleProps = {
  /** Trùng với `tableId` truyền cho `DataTable`. */
  tableId: string;
  /** Các cột ĐƯỢC PHÉP ẩn. Cột định danh (tên em, tên nhân sự) không nên có ở đây. */
  columns: readonly DataTableColumnOption[];
  className?: string;
};

export function columnToggleStorageKey(tableId: string): string {
  return `cq.datatable.${tableId}.hidden`;
}

/** Đọc lựa chọn đã lưu, bỏ qua khoá lạ (cột đã đổi tên/xoá giữa hai lần vào). */
export function readHiddenColumns(
  tableId: string,
  allowed: readonly string[],
): string[] {
  try {
    const raw = window.localStorage.getItem(columnToggleStorageKey(tableId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string => typeof value === "string" && allowed.includes(value),
    );
  } catch {
    // localStorage bị chặn (chế độ riêng tư, chính sách máy chung) hoặc JSON
    // hỏng: coi như chưa ẩn cột nào. Không được ném lỗi làm sập cả trang danh sách.
    return [];
  }
}

export function DataTableColumnToggle({
  tableId,
  columns,
  className,
}: DataTableColumnToggleProps) {
  const [hidden, setHidden] = React.useState<readonly string[]>([]);

  const allowedKeys = React.useMemo(() => columns.map((column) => column.key), [columns]);

  // Đọc SAU khi gắn vào cây, không đọc lúc dựng: máy chủ không có
  // `localStorage`, đọc lúc dựng là lệch hydration ngay hàng đầu tiên.
  React.useEffect(() => {
    setHidden(readHiddenColumns(tableId, allowedKeys));
  }, [tableId, allowedKeys]);

  function toggle(key: string, visible: boolean) {
    setHidden((previous) => {
      const next = visible
        ? previous.filter((value) => value !== key)
        : previous.includes(key)
          ? previous
          : [...previous, key];

      // Ẩn hết mọi cột thì còn lại một cái khung rỗng không có đường quay lại —
      // giữ luôn ít nhất một cột hiện.
      if (next.length >= allowedKeys.length) return previous;

      try {
        window.localStorage.setItem(columnToggleStorageKey(tableId), JSON.stringify(next));
      } catch {
        // Không lưu được thì vẫn đổi trong phiên này.
      }
      return next;
    });
  }

  const hiddenCount = hidden.length;

  return (
    <>
      {hiddenCount > 0 ? (
        <style>
          {hidden
            .map(
              (key) =>
                `[data-table-id="${tableId}"] [data-column="${key}"]{display:none}`,
            )
            .join("")}
        </style>
      ) : null}

      <Dropdown
        align="end"
        className={className}
        ariaLabel="Chọn cột hiển thị"
        label={
          <span className="inline-flex items-center gap-2">
            <Columns3 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Cột
            {/* Số cột đang ẩn nói thành CHỮ cho trình đọc màn hình — nếu không,
                người dùng không hiểu vì sao bảng thiếu cột so với đồng nghiệp. */}
            {hiddenCount > 0 ? (
              <span
                className="rounded-full bg-theme-tint px-2 text-2xs font-medium text-theme-accent-text"
                data-numeric
              >
                <span className="sr-only">Đang ẩn </span>
                {hiddenCount}
                <span className="sr-only"> cột</span>
              </span>
            ) : null}
          </span>
        }
      >
        <p className="px-3 py-2 text-2xs text-ink-muted">
          Lựa chọn chỉ lưu trên máy này.
        </p>
        {columns.map((column) => {
          const visible = !hidden.includes(column.key);
          return (
            <Checkbox
              key={column.key}
              checked={visible}
              onChange={(event) => toggle(column.key, event.target.checked)}
              role="menuitemcheckbox"
              aria-checked={visible}
              data-dropdown-item="true"
              labelClassName={cn("w-full px-3", "hover:bg-surface-muted rounded-md")}
            >
              {column.label}
            </Checkbox>
          );
        })}
      </Dropdown>
    </>
  );
}
