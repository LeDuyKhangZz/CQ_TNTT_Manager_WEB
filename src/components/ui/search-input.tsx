import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBaseClassName } from "./input";

/**
 * Ô tìm kiếm — 05 §3.3 #7. SW-07: hiện **không có tìm kiếm ở bất kỳ đâu**,
 * trong khi `/students` có ~900 em.
 *
 * Không có `"use client"` và không giữ state: đây là một `<input name>` nằm
 * trong `<form method="get">` của trang, gửi được **không cần JS** (09 §11 —
 * máy yếu, mạng phòng học kém). Trang tự đọc `searchParams` ở máy chủ.
 *
 * `label` là **bắt buộc**. Placeholder không phải nhãn: nó biến mất khi người
 * dùng gõ và trình đọc màn hình nhiều máy bỏ qua. Mặc định nhãn chỉ hiện cho
 * trình đọc màn hình (`hideLabel`), truyền `hideLabel={false}` khi cần thấy.
 */
export type SearchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Ví dụ: "Tìm theo tên thiếu nhi". Không được rỗng. */
  label: string;
  /** Mặc định `true` — nhãn dành cho trình đọc màn hình. */
  hideLabel?: boolean;
  /** Dòng gợi ý dưới ô, ví dụ phạm vi tìm kiếm. */
  hint?: string;
};

/**
 * Chỉ phần **điều khiển**: kính lúp + `<input type="search">`. Không nhãn,
 * không dòng gợi ý.
 *
 * Sinh ra cho `FilterField` (Đợt E): khung ngoài ấy đã lo tầng nhãn và tầng gợi
 * ý cho **mọi** ô lọc, nên đặt nguyên `SearchInput` vào trong là trang có **hai
 * nhãn trỏ vào cùng một ô** — đúng cái bẫy đã ghi ở `promotions/page.tsx`.
 * `SearchInput` đứng một mình vẫn giữ nguyên hợp đồng cũ, chỉ dựng trên chính
 * component này.
 */
export const SearchInputControl = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, name = "q", ...props }, ref) => (
  <div className="relative w-full">
    <Search
      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
      strokeWidth={1.75}
      aria-hidden="true"
    />
    <input
      ref={ref}
      name={name}
      type="search"
      inputMode="search"
      enterKeyHint="search"
      className={cn(inputBaseClassName, "flex h-control pl-10", className)}
      {...props}
    />
  </div>
));
SearchInputControl.displayName = "SearchInputControl";

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, label, hideLabel = true, hint, id, name = "q", ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={cn(
            "mb-1 block text-sm font-semibold text-ink",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </label>

        <SearchInputControl
          ref={ref}
          id={inputId}
          name={name}
          aria-describedby={hint ? hintId : undefined}
          className={className}
          {...props}
        />

        {hint ? (
          <p id={hintId} className="mt-1 text-xs text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
