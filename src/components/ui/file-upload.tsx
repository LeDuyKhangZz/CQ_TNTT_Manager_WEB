"use client";

import * as React from "react";
import { Paperclip } from "lucide-react";
import { FormMessage } from "./form-message";
import { cn } from "@/lib/utils";

/**
 * Ô chọn tệp — 05 §3.3 #19. Màn nhập Excel hiện là một `<input type="file">`
 * trần: **không nói định dạng nào được nhận, không nói giới hạn dung lượng**,
 * và sau khi chọn xong không hiện tên tệp nên người dùng không biết đã chọn.
 *
 * Vẫn là `<input type="file">` native, không phải vùng kéo-thả tự dựng: input
 * native gửi được trong `<form action={serverAction}>` **không cần JS** (09
 * §11), có sẵn bàn phím và trình đọc màn hình. JS chỉ thêm hai tiện ích, mất JS
 * thì mất tiện ích chứ không mất chức năng:
 *   • hiện tên và cỡ tệp đã chọn (vùng `role="status"`)
 *   • báo sớm khi tệp quá cỡ, thay vì để người dùng chờ tải xong mới biết
 *
 * 🔴 Kiểm ở trình duyệt **không phải** kiểm bảo mật. Máy chủ vẫn phải tự kiểm
 * lại cỡ tệp và định dạng — `accept` và đoạn mã dưới đây đều sửa được bằng
 * DevTools (AGENTS.md §5: không tin dữ liệu từ client).
 */

export type FileUploadProps = {
  /** Tên trường gửi lên máy chủ. */
  name: string;
  /** Ví dụ: "Tệp danh sách thiếu nhi". Bắt buộc. */
  label: string;
  /** Ví dụ: ".xlsx,.xls". Hiện luôn thành chữ dưới ô. */
  accept?: string;
  /** Giới hạn mềm ở trình duyệt, tính bằng MB. */
  maxSizeMb?: number;
  /** Câu gợi ý thêm, ví dụ "Tải mẫu ở nút bên dưới". */
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  name,
  label,
  accept,
  maxSizeMb,
  hint,
  required,
  disabled,
  id,
  className,
}: FileUploadProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const statusId = `${inputId}-status`;

  const [selected, setSelected] = React.useState<{ name: string; size: number } | null>(
    null,
  );
  const [tooLarge, setTooLarge] = React.useState(false);

  const limits = [
    accept ? `Định dạng nhận: ${accept.split(",").join(", ")}` : null,
    maxSizeMb ? `Tối đa ${maxSizeMb} MB` : null,
    hint,
  ].filter(Boolean);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setSelected(null);
      setTooLarge(false);
      return;
    }
    setSelected({ name: file.name, size: file.size });
    setTooLarge(maxSizeMb !== undefined && file.size > maxSizeMb * 1024 * 1024);
  }

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>

      <input
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        onChange={onChange}
        aria-describedby={limits.length > 0 ? hintId : undefined}
        aria-invalid={tooLarge || undefined}
        className={cn(
          "block w-full cursor-pointer rounded-md border border-line-strong bg-surface text-sm text-ink",
          // Nút "Chọn tệp" do trình duyệt vẽ. `file:` là cách duy nhất chạm được
          // vào nó; cho nó cao đủ 44px chứ không để cỡ mặc định ~24px.
          "file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-surface-muted",
          "file:px-4 file:text-sm file:font-medium file:text-ink",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-danger",
        )}
      />

      {limits.length > 0 ? (
        <p id={hintId} className="mt-1 text-xs text-ink-muted">
          {limits.join(" · ")}
        </p>
      ) : null}

      <div id={statusId} role="status" className="mt-1 min-h-0">
        {selected ? (
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Paperclip className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0 truncate">
              Đã chọn: {selected.name} ({formatSize(selected.size)})
            </span>
          </p>
        ) : null}
      </div>

      {tooLarge && maxSizeMb !== undefined ? (
        <FormMessage tone="danger">
          Tệp lớn hơn giới hạn {maxSizeMb} MB. Hãy chọn tệp nhỏ hơn.
        </FormMessage>
      ) : null}
    </div>
  );
}
