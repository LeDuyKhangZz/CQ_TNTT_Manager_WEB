"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

/**
 * Nút lọc mở bảng tick — REDESIGN 2C task **R2.2** (`11_DESIGN_SYSTEM` N3,
 * `04_UX_AUDIT` §benchmark, `07_DESKTOP_UX` §2). Chỗ đứng của nó là trong
 * `Toolbar`.
 *
 * ## 1. Vì sao dựng trên `<details>` chứ không trên `useState`
 *
 * Đây là **bộ lọc**, và bộ lọc của dự án này phải chạy khi JS chưa tải (`09`
 * §11). `<details>` mở/đóng bằng chính trình duyệt; các ô bên trong là
 * `<input type="checkbox" name value>` **thật** nằm trong `<form method="get">`
 * của `Toolbar`; nút "Áp dụng" là `type="submit"`. Ba thứ ấy cộng lại: không có
 * một dòng JavaScript nào thì người dùng vẫn mở được, tick được, lọc được.
 *
 * JavaScript chỉ thêm **phần tiện**, mất nó không mất chức năng:
 *   1. `Escape` đóng, **hoàn tác** các ô vừa tick, và **trả focus** về nút mở
 *   2. Bấm ra ngoài thì đóng — **không** đụng vào các ô đã tick
 *
 * ## 2. Vì sao KHÔNG tự gửi form khi đóng, và vì sao chỉ `Escape` mới hoàn tác
 *
 * Bản đầu định "đóng là lọc luôn" cho đỡ một cú bấm. Bỏ, vì cú bấm đóng bảng
 * thường **cũng là** cú bấm vào thứ khác (một hàng trong bảng): người dùng bấm
 * một cái mà trang đi hai nơi, và cái thắng là cái họ không định. Nên đóng
 * **không bao giờ** gửi form; "Áp dụng" (và nút "Lọc" của `Toolbar`) mới gửi —
 * đúng một luật, giống hệt nhau dù có JS hay không (D-R8).
 *
 * 🔴 Bản thứ hai cho **mọi** kiểu đóng đều hoàn tác, và nó **ăn mất cú tick**
 * trong một đường đi rất thường: tick "Ấu Nhi" → bấm thẳng nút "Lọc" của
 * toolbar. `mousedown` chạy TRƯỚC `click`, nên bảng đóng và hoàn tác xong xuôi
 * rồi form mới gửi đi — người dùng bấm Lọc mà không có gì xảy ra, và không có
 * lỗi nào để lần ra. Luật cuối: **chỉ `Escape` mới huỷ**, vì đó là cử chỉ duy
 * nhất nói rõ "tôi đổi ý"; bấm ra ngoài là cử chỉ nhập nhằng nên tuyệt đối
 * không được phép **xoá thứ người dùng vừa nhập** (đúng tinh thần bẫy Đợt C).
 *
 * Hệ quả có chủ ý: **con số trên huy hiệu là số ĐANG ÁP DỤNG** (đọc từ
 * `searchParams` ở máy chủ), không phải số ô đang tick. Huy hiệu nói về **bảng
 * đang hiện**, không nói về ý định chưa gửi đi; ô tick nói về ý định. Hai thứ
 * khác nhau nên đặt ở hai chỗ khác nhau.
 *
 * ## 3. Ô tick KHÔNG bị điều khiển bởi React state
 *
 * `defaultChecked`, không phải `checked`. Ô có state sẽ **nuốt mất** cú tick
 * xảy ra trước khi hydration xong — đúng con bọ Đợt C phải sinh ra
 * `useHydratedInput` để chữa (`16` §6.3). Hoàn tác khi đóng vì thế viết thẳng
 * vào DOM (`input.checked = …`), không đi qua state.
 *
 * ## 4. Chỉ chọn NHIỀU
 *
 * `N3` là "popover checklist" — nhiều lựa chọn, gửi lên thành tham số lặp
 * (`?sector=au&sector=thieu`). Bộ lọc **loại trừ nhau** (một giá trị) vẫn dùng
 * `Select` trong `FilterBar` như cũ; trang nào muốn đổi sang facet thì phải mở
 * bộ đọc `searchParams` của nó cho nhận mảng — việc ấy thuộc trang, không
 * thuộc component này (R4.1 sẽ làm cho `/students`).
 *
 * ## 5. Bo góc: 12px, không phải bo tròn hoàn toàn
 *
 * `11` N3 gọi đây là "nút pill". Thi công dùng `rounded-md` (bán kính nút của
 * `09` §5) để một hàng toolbar không trộn hai bán kính cạnh ô tìm kiếm 12px.
 * Trạng thái "đang lọc" phân biệt bằng **viền liền vs viền đứt** + huy hiệu số
 * — hình dạng và chữ, không phải màu (`09` §10 điều 5). Muốn đúng chữ "pill"
 * thì đổi **một** hằng `TRIGGER_BASE` bên dưới.
 */

const TRIGGER_BASE = [
  "inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border px-3",
  "text-sm font-medium text-ink transition-colors duration-fast ease-out",
  "[&::-webkit-details-marker]:hidden",
].join(" ");

export type FacetOption = {
  value: string;
  /** Chữ hiện trong bảng tick. */
  label: string;
  /** Số bản ghi ứng với lựa chọn — hiện bên phải để đoán được kết quả trước khi lọc. */
  count?: number;
  disabled?: boolean;
};

export type FacetFilterProps = {
  /** Tham số truy vấn, ví dụ `sector`. Nhiều lựa chọn ⇒ tham số lặp lại. */
  name: string;
  /** Chữ trên nút, ví dụ "Ngành". */
  label: string;
  options: readonly FacetOption[];
  /** Giá trị **đang áp dụng**, đọc từ `searchParams` ở máy chủ. */
  selected?: readonly string[];
  /** Cạnh canh của bảng tick. Mặc định canh trái vì nút nằm đầu hàng toolbar. */
  align?: "start" | "end";
  applyLabel?: string;
  /** Câu hiện khi không có lựa chọn nào (ví dụ Giáo lý viên chỉ có 1 lớp). */
  emptyLabel?: string;
  className?: string;
};

export function FacetFilter({
  name,
  label,
  options,
  selected = [],
  align = "start",
  applyLabel = "Áp dụng",
  emptyLabel = "Không có lựa chọn nào trong phạm vi của bạn.",
  className,
}: FacetFilterProps) {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = React.useState(false);

  const appliedCount = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)).length,
    [options, selected],
  );

  /**
   * Trả các ô tick về đúng thứ máy chủ đang áp dụng.
   *
   * Viết thẳng vào DOM chứ không qua state — xem mục 3 của phần mô tả đầu tệp.
   * **Chỉ `Escape` được gọi hàm này** (mục 2).
   */
  const revert = React.useCallback(() => {
    const details = detailsRef.current;
    if (!details) return;
    for (const input of details.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
      input.checked = selected.includes(input.value);
    }
  }, [selected]);

  const close = React.useCallback(
    ({ cancel }: { cancel: boolean }) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      details.open = false;
      setOpen(false);
      if (cancel) {
        revert();
        details.querySelector("summary")?.focus();
      }
    },
    [revert],
  );

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const details = detailsRef.current;
      if (details && !details.contains(event.target as Node)) close({ cancel: false });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close({ cancel: true });
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <details
      ref={detailsRef}
      data-facet={name}
      className={cn("relative", className)}
      onToggle={(event) => {
        // Chỉ theo dõi trạng thái mở để gắn/gỡ hai listener. Đóng bằng
        // `<summary>` KHÔNG hoàn tác: nó là cử chỉ nhập nhằng (mục 2).
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      {/* 🔴 KHÔNG đặt `aria-expanded`: HTML-AAM đã phơi `<summary>` ra là nút và
          lấy trạng thái mở thẳng từ `details.open`. Tự đặt theo state React thì
          khi JS chưa tải, người dùng mở bằng chính trình duyệt mà thuộc tính vẫn
          kẹt ở `false` (lý do đầy đủ trong `dropdown.tsx`). */}
      <summary
        className={cn(
          TRIGGER_BASE,
          appliedCount > 0
            ? "border-solid border-line-strong bg-surface-muted"
            : "border-dashed border-line-strong bg-surface hover:bg-surface-muted",
        )}
      >
        {label}
        {appliedCount > 0 ? (
          <span
            className="rounded-full bg-theme-tint px-2 text-2xs font-medium text-theme-accent-text"
            data-numeric
          >
            {/* Con số một mình không nói được nó là số gì. */}
            <span className="sr-only">Đang lọc </span>
            {appliedCount}
            <span className="sr-only"> lựa chọn</span>
          </span>
        ) : null}
        <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </summary>

      <div
        className={cn(
          "absolute z-dropdown mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface shadow-md",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="px-3 pt-2 text-2xs font-medium text-ink-muted">
            Lọc theo {label}
          </legend>

          {options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-ink-muted">{emptyLabel}</p>
          ) : (
            /* Trần chiều cao + cuộn dọc: `/students` có 19 lớp, danh sách dài
               hơn màn hình thì nút "Áp dụng" bị đẩy ra ngoài tầm với. */
            <div className="max-h-64 overflow-y-auto p-1">
              {options.map((option) => (
                <Checkbox
                  key={option.value}
                  name={name}
                  value={option.value}
                  defaultChecked={selected.includes(option.value)}
                  disabled={option.disabled}
                  labelClassName="w-full rounded-md px-2 hover:bg-surface-muted"
                >
                  <span className="flex w-full min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.count === undefined ? null : (
                      <span className="shrink-0 text-2xs text-ink-muted" data-numeric>
                        {option.count}
                      </span>
                    )}
                  </span>
                </Checkbox>
              ))}
            </div>
          )}

          {/* Nút gửi thật: đây là thứ làm cả bảng tick chạy được không cần JS. */}
          <div className="border-t border-line p-2">
            <Button type="submit" variant="secondary" className="w-full">
              {applyLabel}
            </Button>
          </div>
        </fieldset>
      </div>
    </details>
  );
}
