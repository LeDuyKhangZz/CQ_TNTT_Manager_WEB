import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bộ chọn phân đoạn — 05 §3.3 #20. M05 U-10: màn điểm danh hiện dùng **hai
 * `<select>` cho mỗi em, nhân 50 em một lớp** — 100 lần bung danh sách thả
 * xuống cho một buổi điểm danh.
 *
 * 🔴 Dựng bằng `<input type="radio">` native trong `<fieldset>`, **không** bằng
 * nút + state. Ba lý do, theo đúng thứ tự quan trọng:
 *   1. Roster điểm danh gửi bằng `<form action={serverAction}>` không cần JS
 *      (09 §11). Nút bấm không gửi được giá trị nếu JS chưa tải.
 *   2. Nhóm radio có sẵn điều hướng phím mũi tên và ngữ nghĩa "chọn 1 trong N".
 *   3. 100 control trên một trang mà mỗi cái giữ state React là chỗ lag thật
 *      trên máy phòng học.
 *
 * Ô đang chọn có **ba tín hiệu**: nền `--theme-tint`, chữ `--theme-accent-text`,
 * và **dấu ✓** — màu không bao giờ là tín hiệu duy nhất (09 §10 điều 5).
 * Nền dùng nơi số 7 trong 12 nơi được phép ("hàng/thẻ đang được chọn").
 */

export type SegmentedOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /**
   * Câu đầy đủ cho trình đọc màn hình khi nhãn nhìn thấy được phải rút gọn vì
   * bề ngang (M05-C: "Có phép" trên màn hình, "Vắng có phép" khi đọc lên).
   * **Mở rộng, không thay** — bỏ trống thì nhãn nhìn thấy chính là nhãn đọc.
   */
  ariaLabel?: string;
};

export type SegmentedControlProps = {
  /** Tên trường gửi lên máy chủ. Mỗi hàng roster một tên riêng. */
  name: string;
  /** Ví dụ: "Thánh lễ — Nguyễn Văn An". Không được rỗng. */
  legend: string;
  /** Ẩn legend khỏi màn hình khi bảng đã có tên em ở cột bên cạnh. */
  hideLegend?: boolean;
  options: readonly SegmentedOption[];
  /** Không kiểm soát: giá trị ban đầu. Điểm danh mặc định "Có mặt". */
  defaultValue?: string;
  /** Có kiểm soát: chỉ dùng khi trang thật sự cần biết giá trị ngay. */
  value?: string;
  onChange?: (value: string) => void;
  /**
   * Khoá cả nhóm. Dùng `<fieldset disabled>` của HTML chứ không rải `disabled`
   * xuống từng ô: trình duyệt tự lan xuống mọi input bên trong, nên thêm một
   * lựa chọn mới về sau không thể quên khoá.
   */
  disabled?: boolean;
  className?: string;
};

export function SegmentedControl({
  name,
  legend,
  hideLegend = false,
  options,
  defaultValue,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps) {
  const controlled = value !== undefined;

  return (
    <fieldset disabled={disabled} className={cn("min-w-0 border-0 p-0", className)}>
      <legend
        className={cn(
          "mb-1 text-sm font-semibold text-ink",
          hideLegend && "sr-only",
        )}
      >
        {legend}
      </legend>

      <div className="inline-flex flex-wrap gap-1 rounded-md border border-line-strong bg-surface p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm",
              "text-ink transition-colors duration-fast ease-out",
              "hover:bg-surface-muted",
              "has-[:checked]:bg-theme-tint has-[:checked]:font-semibold has-[:checked]:text-theme-accent-text",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-theme-ring",
              "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              disabled={option.disabled}
              aria-label={option.ariaLabel}
              className="sr-only peer"
              {...(controlled
                ? { checked: value === option.value, onChange: () => onChange?.(option.value) }
                : { defaultChecked: defaultValue === option.value })}
            />
            {/* Dấu ✓ chỉ hiện ở ô đang chọn. `hidden` + `peer-checked:inline`
                để ô không đổi bề rộng khi chọn — nếu dùng `opacity` thì chỗ
                trống vẫn chiếm bề ngang và hàng roster nhảy khi bấm. */}
            <Check
              className="hidden h-4 w-4 shrink-0 peer-checked:inline"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
