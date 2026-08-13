"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Thẻ nội dung — 05 §3.3 #11. `students/[studentId]` hiện tự dựng tab bằng nút
 * thường: **không có `role="tablist"`**, không có mũi tên, trình đọc màn hình
 * không biết đây là bộ thẻ nên đọc thành một dãy nút rời.
 *
 * Cài theo mẫu ARIA "tabs with automatic activation":
 *   • `role="tablist"` có `aria-label`
 *   • mỗi tab `role="tab"` + `aria-selected` + `aria-controls`
 *   • **roving tabindex**: chỉ tab đang chọn nhận `Tab`, mũi tên đi giữa các tab
 *   • `Home`/`End` nhảy đầu/cuối
 *   • panel `role="tabpanel"` + `aria-labelledby` + `tabIndex={0}` để cuộn được
 *     bằng bàn phím khi nội dung dài
 *
 * ⚠️ Chỉ hiện panel đang chọn. Panel ẩn không được để trong DOM dạng
 * `display:none` mà vẫn chứa ô nhập — trình duyệt sẽ gửi cả dữ liệu ẩn.
 */

export type TabItem = {
  /** Duy nhất trong một bộ tab. Dùng làm mảnh của `id` DOM. */
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

export type TabsProps = {
  items: readonly TabItem[];
  /** Nhãn của cả bộ thẻ, ví dụ "Thông tin thiếu nhi". Bắt buộc. */
  label: string;
  defaultTabId?: string;
  className?: string;
};

export function Tabs({ items, label, defaultTabId, className }: TabsProps) {
  const baseId = React.useId();
  const [activeId, setActiveId] = React.useState(
    () => defaultTabId ?? items[0]?.id,
  );
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());

  if (items.length === 0) return null;

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const active = items[activeIndex];

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  function moveTo(index: number) {
    const next = items[(index + items.length) % items.length];
    setActiveId(next.id);
    // Kích hoạt tự động: focus phải đi theo, nếu không thì `aria-selected`
    // và vị trí focus lệch nhau và trình đọc màn hình đọc sai tab.
    tabRefs.current.get(next.id)?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveTo(activeIndex + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveTo(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(items.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {items.map((item) => {
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={selected}
              aria-controls={panelId(item.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-t-md px-4 text-sm",
                "-mb-px border-b-2 transition-colors duration-fast ease-out",
                selected
                  ? // Nơi số 4 trong 12 nơi dùng `--theme-*` (09 §4.4).
                    // Ba tín hiệu: gạch chân, màu chữ, `aria-selected`.
                    "border-theme-primary font-semibold text-theme-accent-text"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId(active.id)}
        aria-labelledby={tabId(active.id)}
        tabIndex={0}
        className="pt-4 outline-none"
      >
        {active.content}
      </div>
    </div>
  );
}
