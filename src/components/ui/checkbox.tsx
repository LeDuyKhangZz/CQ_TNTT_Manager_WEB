import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ô tick — `09` §12 A2 (kế hoạch `17` §6, Đợt D).
 *
 * Trước đợt này có **10 ô tick trần** rải trên 8 tệp, mỗi chỗ một cỡ và một
 * chuỗi class riêng: `h-4 w-4` (3 chỗ), `h-5 w-5` (3 chỗ), `h-6 w-6` (2 chỗ),
 * `size-4` (1 chỗ) và **một chỗ không có class nào** — tức mặc định của hệ điều
 * hành, thứ duy nhất trong ứng dụng còn do Windows vẽ. Hai chỗ còn dùng bí danh
 * token cũ `border-border`.
 *
 * 🔴 **Vẫn là `<input type="checkbox">` THẬT.** Không có nút tự dựng, không có
 * `<input type="hidden">`, không có state riêng: ô này chỉ là chính nó khoác một
 * lớp CSS phủ (`appearance-none` + hai dấu SVG nằm đè lên). Ba hệ quả, cả ba đều
 * cố ý:
 *
 *   1. Biểu mẫu **chạy không cần JS** (`09` §11) — `name`/`value`/`checked` đi
 *      thẳng vào `FormData` như cũ.
 *   2. **Không dính bẫy hydration của Đợt C** (`16` §6.3): máy chủ và trình
 *      duyệt dựng ra **đúng một phần tử giống nhau**, nên không có khoảng giữa
 *      nào để nuốt mất thứ người dùng vừa bấm. Đợt C phải thêm hẳn
 *      `useHydratedInput` chỉ vì nó **thay** phần tử; ở đây không có gì để thay.
 *   3. Bộ kiểm hiện có không phải đổi một dòng: `getByRole("checkbox")`,
 *      `getByLabelText(…)`, `.check()`, `toBeChecked()` đều bám vào phần tử gốc.
 *
 * 🔴 **Dấu tick KHÔNG BAO GIỜ hardcode màu trắng.** Nó là `--theme-on-primary`,
 * và với ngành **Nghĩa Sĩ** token ấy là **`#2E2A27` (chữ đậm)**, không phải
 * `#FFFFFF` — `09` §4.1 ghi rõ đó là một trong hai ngoại lệ của bảng màu ngành.
 * Viết `text-white` cho nhanh thì ô tick của Nghĩa Sĩ thành trắng-trên-vàng, tức
 * gần như không đọc được, và **không một bài kiểm nào bắt được bằng ảnh chụp**.
 * `tests/unit/checkbox.test.tsx` canh đúng điểm này.
 *
 * Vùng chạm 44px (`09` §10 điều cấm 7) do **thẻ `<label>` bọc ngoài** gánh, đúng
 * cách `09` §11 đã chốt cho ô tick điểm danh: bản thân ô là 20×20px — ép chính
 * nó lên 44px thì dòng nhãn trông như một cái nút.
 */

/**
 * Bo 6px cho một hộp 20×20.
 *
 * ⚠️ 6px **nằm ngoài** thang 4 mức của `09` §5 (8/12/16/20). Đây là con số của
 * chính kế hoạch `17` §6 — `rounded-sm` (8px) trên một hộp 20px cho ra hình gần
 * tròn, nhìn ra ô chọn-một (radio) chứ không ra ô tick. Nếu chủ dự án muốn tuyệt
 * đối không có giá trị ngoài thang thì đổi **một chỗ duy nhất** là dòng này.
 */
const BOX_RADIUS = "rounded-[6px]";

/** Xuất riêng để bài kiểm bám được, và để chỗ nào cần chỉ lấy phần hộp. */
export const checkboxBoxClassName = [
  "peer size-5 shrink-0 appearance-none border border-line-strong bg-surface",
  BOX_RADIUS,
  "outline-none transition-colors duration-fast ease-out",
  // Điểm theme #7 — "hàng/ô đang được chọn" (`09` §4.4). Không mở điểm mới.
  "checked:border-theme-primary checked:bg-theme-primary",
  "data-[indeterminate=true]:border-theme-primary data-[indeterminate=true]:bg-theme-primary",
  "focus-visible:border-theme-primary focus-visible:ring-2 focus-visible:ring-theme-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
  "aria-[invalid=true]:border-danger",
].join(" ");

/**
 * Màu của dấu tick. Tách thành hằng để bài kiểm chỉ vào được đúng một chỗ.
 * Đổi chuỗi này thành `text-white` là làm hỏng ngành Nghĩa Sĩ.
 */
export const checkboxMarkClassName =
  "pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-theme-on-primary";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> & {
  /** Chữ đứng cạnh ô. Bỏ trống thì **bắt buộc** có `aria-label`. */
  children?: React.ReactNode;
  /** Class cho thẻ `<label>` bọc ngoài — nơi giữ vùng chạm và vị trí trong lưới. */
  labelClassName?: string;
  /**
   * Trạng thái "một phần" của ô chọn-tất-cả.
   *
   * 🔴 Cố ý **không** đụng vào thuộc tính DOM `indeterminate`. Thuộc tính ấy chỉ
   * đặt được bằng JavaScript sau khi phần tử đã có mặt, tức phải có `useEffect`
   * — mà thêm `useEffect` là đẩy cả tệp này sang `"use client"`, và một ô tick
   * chỉ vẽ đúng sau khi hydration xong thì đi ngược tinh thần tăng tiến của cả
   * kế hoạch. Ở đây trạng thái ấy là **một thuộc tính HTML thật**
   * (`data-indeterminate`) nên máy chủ vẽ được ngay, còn phần trình đọc màn hình
   * do `aria-checked="mixed"` gánh — đúng giá trị mà `indeterminate` gốc ánh xạ
   * tới.
   */
  indeterminate?: boolean;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, labelClassName, children, indeterminate, id, disabled, ...props }, ref) => (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 text-sm text-ink",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        labelClassName,
      )}
    >
      {/*
        Ô và hai dấu phải nằm chung một khối `relative`, và ô phải đứng TRƯỚC —
        `peer-*` của Tailwind là bộ chọn anh–em **xuôi** (`~`). Đảo thứ tự thì
        dấu tick im lặng biến mất, không lỗi, không cảnh báo (bẫy #1 của Đợt B,
        `16` §6.2).
      */}
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          data-indeterminate={indeterminate ? "true" : undefined}
          aria-checked={indeterminate ? "mixed" : undefined}
          className={cn(checkboxBoxClassName, className)}
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className={cn(
            checkboxMarkClassName,
            "opacity-0 peer-checked:opacity-100 peer-data-[indeterminate=true]:opacity-0",
          )}
        />
        <Minus
          aria-hidden="true"
          strokeWidth={3}
          className={cn(
            checkboxMarkClassName,
            "opacity-0 peer-data-[indeterminate=true]:opacity-100",
          )}
        />
      </span>
      {children === undefined ? null : (
        <span className={cn("min-w-0", disabled && "opacity-60")}>{children}</span>
      )}
    </label>
  ),
);
Checkbox.displayName = "Checkbox";
