import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Nhãn — docs/.../09 §6: label ĐẶT TRÊN ô nhập, 14px semibold.
 * `required` hiện dấu sao có nhãn chữ cho trình đọc màn hình — màu không bao
 * giờ là tín hiệu duy nhất (điều cấm thứ 5).
 */
export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-sm font-semibold leading-normal text-ink", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-danger">
          <span aria-hidden="true">*</span>
          <span className="sr-only">(bắt buộc)</span>
        </span>
      ) : null}
    </label>
  );
}
