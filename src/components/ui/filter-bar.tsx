import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "./button";
import { Label } from "./label";
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

/* -------------------------------------------------------------------------- */

/**
 * Một ô lọc. **`FilterField` là phần con của `FilterBar`**, không phải component
 * thứ năm của `09` §12 A2 — nó không có mặt riêng trong danh sách §8.
 *
 * 🔴 Vấn đề nó sinh ra để chữa (hình 3 của chủ dự án): mỗi ô lọc trước đây tự
 * dựng lấy phần khung của mình, nên trong **cùng một lưới** có ô đeo `<Label>`,
 * ô không nhãn chỉ có `aria-label`, ô có dòng gợi ý, ô không có. Mỗi khác biệt
 * ấy đổi chiều cao của ô ⇒ các ô đứng lệch nhau và mép dưới không thẳng hàng.
 *
 * Lời giải là **ba tầng CỐ ĐỊNH, giống hệt nhau ở mọi ô**, kể cả khi tầng đó
 * rỗng:
 *
 * | Tầng | Chiều cao | Ghi chú |
 * |---|---|---|
 * | nhãn | `h-5` (20px) + `mb-1.5` (6px) | nhãn **luôn** render; ẩn thì `sr-only` — hàng vẫn giữ đúng 20px |
 * | control | `min-h-11` (44px) | đúng `--control-height` của `Input`/`Select` |
 * | gợi ý | `min-h-[18px]`, 13px `--ink-muted` | **luôn** chiếm chỗ, kể cả rỗng |
 *
 * `leading-5` cho hàng nhãn là cố ý: `Label` mặc định `leading-normal` (1.5),
 * tức 14px × 1.5 = **21px** — tràn 1px khỏi hàng 20px và kéo lệch trở lại đúng
 * thứ vừa chữa. Nhãn dài phải viết ngắn lại và đẩy phần mô tả xuống `helper`
 * (nhãn là **TÊN** của ô, giới hạn/gợi ý là **MÔ TẢ** — cùng lý lẽ đã ghi ở
 * Đợt D cho `import-upload-form`).
 *
 * Không có `"use client"` và không dùng context: file này được **Server
 * Component** dùng ở 6 chỗ. `React.cloneElement` là hàm thuần trên mô tả phần
 * tử nên chạy được ở cả hai phía ranh giới RSC, còn `createContext` thì không.
 */
/**
 * Hàng nhãn của `FilterField` — 20px + cách 6px.
 *
 * Xuất ra để thứ **không phải ô lọc** đứng cùng hàng (nút "Tìm" của một khối lọc
 * tự chế) chừa đúng chỗ ấy và đứng thẳng hàng với các control. Chép tay `h-5` ở
 * chỗ gọi thì hai bên sẽ lệch nhau vào ngày ai đó đổi một trong hai.
 */
export const filterFieldLabelRowClassName = "mb-1.5 flex h-5 items-center";

/**
 * Giá trị **khoá cứng** đứng thay chỗ một ô chọn: cao đúng `--control-height`,
 * nền lõm để đọc ra ngay là "không sửa được". Dùng cùng `staticValue`.
 */
export const filterFieldLockedValueClassName =
  "flex h-control items-center rounded-md border border-line bg-surface-muted px-3 text-sm text-ink";

export type FilterFieldProps = {
  /** Tên của ô, ví dụ "Lớp". Ngắn — phần giải thích thuộc về `helper`. */
  label: string;
  /** `id` của chính control bên trong. Bắt buộc: nhãn phải trỏ vào một ô thật. */
  htmlFor: string;
  /** Ẩn nhãn khỏi màn hình nhưng giữ cho trình đọc màn hình; hàng vẫn chiếm chỗ. */
  hideLabel?: boolean;
  /** Dòng gợi ý dưới ô. Tự nối vào control bằng `aria-describedby`. */
  helper?: React.ReactNode;
  /**
   * Ô **không có control thật** — giá trị bị khoá cứng, hiện bằng `<p>`.
   *
   * 🔴 `<label for>` chỉ trỏ được vào **phần tử nhận nhãn được** (`input`,
   * `select`, `textarea`…). Trỏ vào một `<p>` thì trình duyệt **âm thầm bỏ
   * qua** — không lỗi, không cảnh báo. Bật cờ này thì hàng nhãn render
   * `<span>` thay cho `<label>`: vẫn đúng ba tầng, nhưng không dựng một quan
   * hệ `for` giả.
   *
   * ⚠️ **CỐ Ý không gắn `aria-labelledby` cho giá trị.** Bản đầu của Đợt E có
   * gắn, và nó **làm đỏ 3 bài E2E trên cả ba viewport**: `reports.spec.ts:279`
   * (AC-B14) đòi *"khi kỳ bị khoá thì KHÔNG phần tử nào mang nhãn 'Kỳ báo
   * cáo'"* — tức ô **chọn** đã biến mất. Gắn tên cho `<p>` làm
   * `getByLabel("Kỳ báo cáo")` khớp trở lại. Đây là chữ tĩnh chứ không phải
   * control: trình đọc màn hình đọc tuần tự vẫn nghe "Kỳ báo cáo" rồi "Cả năm
   * học", nên cái được thêm là rất nhỏ, còn cái mất là một AC đã duyệt.
   */
  staticValue?: boolean;
  /** Đúng **một** phần tử control — `Select`, `Input`, `SearchInputControl`… */
  children: React.ReactNode;
  className?: string;
};

export function FilterField({
  label,
  htmlFor,
  hideLabel = false,
  helper,
  staticValue = false,
  children,
  className,
}: FilterFieldProps) {
  const helperId = `${htmlFor}-helper`;
  const hasHelper = helper !== undefined && helper !== null && helper !== false && helper !== "";

  // Nối dòng gợi ý vào control. Không nối thì nó chỉ là chữ nằm cạnh ô: người
  // dùng trình đọc màn hình nghe tên ô rồi nghe thẳng sang ô kế tiếp.
  const control =
    hasHelper && React.isValidElement<{ "aria-describedby"?: string }>(children)
      ? React.cloneElement(children, {
          "aria-describedby": [children.props["aria-describedby"], helperId]
            .filter(Boolean)
            .join(" "),
        })
      : children;

  const labelClassName = cn("truncate leading-5", hideLabel && "sr-only");

  return (
    <div className={cn("min-w-0", className)}>
      <div className={filterFieldLabelRowClassName}>
        {staticValue ? (
          <span className={cn("block text-sm font-semibold text-ink", labelClassName)}>
            {label}
          </span>
        ) : (
          <Label htmlFor={htmlFor} className={labelClassName}>
            {label}
          </Label>
        )}
      </div>

      <div className="flex min-h-11 flex-col justify-center">{control}</div>

      <p id={helperId} className="mt-1 min-h-[18px] text-xs leading-[18px] text-ink-muted">
        {hasHelper ? helper : null}
      </p>
    </div>
  );
}
