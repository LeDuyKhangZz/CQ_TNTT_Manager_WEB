import * as React from "react";
import { foldVietnamese } from "@/lib/text/fold-vietnamese";

/**
 * Đọc `<option>`/`<optgroup>` ra danh sách phẳng — `17` §4.1.
 *
 * Tách khỏi `select.tsx` vì file kia mang `"use client"`: mọi export của một
 * module `"use client"` là *client reference*, gọi từ Server Component sẽ ném
 * lỗi lúc dựng trang (bài học đã ghi ở `dropdown-item.ts`). Bộ kiểm đơn vị cũng
 * gọi thẳng vào đây để đo phần thuần logic mà không phải dựng cả widget.
 */

export type SelectOptionItem = {
  value: string;
  label: string;
  disabled: boolean;
  /** Nhãn `<optgroup>` chứa mục này, `null` nếu mục nằm ngoài mọi nhóm. */
  group: string | null;
  /** Chuỗi đã bỏ dấu, dựng sẵn cho type-ahead. */
  folded: string;
};

/** Gom mọi kiểu children của `<option>` thành một chuỗi hiển thị. */
function textOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) {
    return textOf((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

type OptionProps = {
  value?: string | number | readonly string[];
  disabled?: boolean;
  label?: string;
  children?: React.ReactNode;
};

type OptGroupProps = {
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

function pushOption(
  target: SelectOptionItem[],
  element: React.ReactElement<OptionProps>,
  group: string | null,
  groupDisabled: boolean,
) {
  const props = element.props;
  const label = props.label ?? textOf(props.children);
  // 🔴 `value` vắng mặt thì giá trị của `<option>` LÀ phần chữ bên trong — đúng
  // luật HTML. Bỏ qua điều này là mọi `<option>Chưa chọn</option>` không có
  // `value` sẽ gửi đi chuỗi rỗng sau khi hydrate, khác hẳn trước hydrate.
  const value = props.value === undefined ? label : String(props.value);
  target.push({
    value,
    label,
    disabled: Boolean(props.disabled) || groupDisabled,
    group,
    folded: foldVietnamese(label),
  });
}

/**
 * Duyệt cây children. Nhận cả mảng, `Fragment`, `null`/`false` — vì call site
 * thật viết `{items.map(...)}` và `{cond ? <option/> : null}` khắp nơi.
 */
export function collectSelectOptions(children: React.ReactNode): SelectOptionItem[] {
  const items: SelectOptionItem[] = [];

  const walk = (node: React.ReactNode, group: string | null, groupDisabled: boolean) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;

      if (child.type === "option") {
        pushOption(items, child as React.ReactElement<OptionProps>, group, groupDisabled);
        return;
      }

      if (child.type === "optgroup") {
        const props = (child as React.ReactElement<OptGroupProps>).props;
        walk(props.children, props.label ?? null, Boolean(props.disabled));
        return;
      }

      if (child.type === React.Fragment) {
        const props = child.props as { children?: React.ReactNode };
        walk(props.children, group, groupDisabled);
      }
    });
  };

  walk(children, null, false);
  return items;
}

/**
 * Type-ahead: tìm mục kế tiếp bắt đầu bằng `query` (đã bỏ dấu), quét vòng từ
 * ngay sau `from`. Trả `-1` khi không có mục nào khớp.
 *
 * Gõ không dấu vẫn tìm được — cùng triết lý với `SearchInput` (`17` §4.2).
 */
export function findByTypeAhead(
  items: SelectOptionItem[],
  query: string,
  from: number,
): number {
  const folded = foldVietnamese(query);
  if (!folded) return -1;

  for (let step = 1; step <= items.length; step += 1) {
    const index = (from + step + items.length) % items.length;
    const item = items[index];
    if (!item.disabled && item.folded.startsWith(folded)) return index;
  }
  return -1;
}

/** Mục bấm được kế tiếp theo hướng `delta`, bỏ qua mục `disabled`. */
export function nextEnabledIndex(
  items: SelectOptionItem[],
  from: number,
  delta: 1 | -1,
): number {
  for (let step = 1; step <= items.length; step += 1) {
    const index = from + delta * step;
    if (index < 0 || index >= items.length) break;
    if (!items[index].disabled) return index;
  }
  return from;
}

/** Mục bấm được đầu tiên (`delta = 1`) hoặc cuối cùng (`delta = -1`). */
export function edgeEnabledIndex(items: SelectOptionItem[], delta: 1 | -1): number {
  if (delta === 1) {
    const index = items.findIndex((item) => !item.disabled);
    return index;
  }
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!items[index].disabled) return index;
  }
  return -1;
}
