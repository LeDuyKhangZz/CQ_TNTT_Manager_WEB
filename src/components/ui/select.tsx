import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBaseClassName } from "./input";

/**
 * Ô chọn — 05 §3.3 #1. Thay 52 thẻ `<select>` trần với chuỗi class chép tay ở
 * 10 file.
 *
 * ⚠️ QUYẾT ĐỊNH CÀI ĐẶT — cần chủ dự án xác nhận:
 * 09 §10 cấm "`<select>` native MỚI", nhưng 09 §11 lại đặt "Form dùng
 * `<form action={serverAction}>` không cần JS" vào danh sách KHÔNG ĐƯỢC ĐỤNG
 * (lý do: máy yếu, mạng phòng học kém). Một listbox tự dựng cần JavaScript mới
 * gửi được giá trị, tức là phá ràng buộc thứ hai.
 *
 * Cách giải: `Select` bọc MỘT `<select>` native — đúng tinh thần điều cấm (không
 * còn thẻ trần rải rác, chỉ một component nhận token), giữ nguyên khả năng chạy
 * không cần JS, và được bàn phím + trình đọc màn hình hỗ trợ sẵn. Nếu chủ dự án
 * muốn listbox tự dựng thì phải chấp nhận form phụ thuộc JS — xem lại 09 §11.
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Dòng gợi ý đầu danh sách, không phải giá trị hợp lệ. */
  placeholder?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          inputBaseClassName,
          "h-control appearance-none pr-10",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </div>
  ),
);
Select.displayName = "Select";
