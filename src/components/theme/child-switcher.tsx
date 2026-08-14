import { Check } from "lucide-react";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { BranchChip } from "@/components/theme/branch-chip";
import { cn } from "@/lib/utils";
import type { AvailableThemeContext } from "@/lib/theme/types";

/**
 * Bộ chọn "đang xem con nào" của phụ huynh — 13 §6, 10 §3 bước 6, 10 §8.
 *
 * 🔴 **Ẩn hoàn toàn khi chỉ có một con** (D-64). Một con thì không có gì để
 * chọn, và một bộ chọn chỉ có đúng một mục là thứ khiến người dùng đi tìm mục
 * thứ hai. Nhiều con **cùng ngành** cũng không cần chọn *màu*, nhưng vẫn cần
 * chọn *nội dung* — nên điều kiện ẩn là số con, không phải số ngành.
 *
 * 🔴 Là `<form>` thật với các nút `submit`, **chạy được khi JS chưa tải**
 * (09 §11). Máy phòng học yếu và mạng kém; một bộ chọn dựng bằng `onClick` là
 * một hàng nút chết đối với phụ huynh mở bằng điện thoại cũ.
 *
 * Lựa chọn đi vào cookie phiên rồi được resolver **xác thực lại mỗi request**
 * (10 §7). Ở đây không có kiểm tra quyền nào cả — cố tình: sửa cookie thành id
 * con người khác không lộ gì vì RLS mới là chốt chặn cuối.
 */

export type ChildSwitcherProps = {
  /** `ThemeContext.availableThemeContexts` — đã sắp xếp tất định ở resolver. */
  contexts: readonly AvailableThemeContext[];
  /** `selectorValue` đang được chọn; `null` khi phụ huynh chưa chọn con nào. */
  selectedValue?: string | null;
  /** Server Action đặt cookie — `selectThemeChild` ở `features/theme/server`. */
  action: (formData: FormData) => void | Promise<void>;
  /** Nhãn nhóm. Đổi được để hợp câu chữ của từng trang. */
  legend?: string;
  className?: string;
};

/** Tên trường gửi lên. Phải khớp với thứ Server Action đọc ra. */
export const CHILD_SWITCHER_FIELD = "studentId";

export function ChildSwitcher({
  contexts,
  selectedValue = null,
  action,
  legend = "Đang xem thiếu nhi",
  className,
}: ChildSwitcherProps) {
  if (contexts.length < 2) return null;

  return (
    <form action={action} className={className}>
      <FormPendingBridge />
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-ink">{legend}</legend>

        <div className="flex flex-wrap gap-2">
          {contexts.map((context) => {
            const selected = context.selectorValue === selectedValue;
            return (
              <button
                key={context.selectorValue}
                type="submit"
                name={CHILD_SWITCHER_FIELD}
                value={context.selectorValue}
                // `aria-current` là tín hiệu thứ hai bên cạnh dấu ✓ và nền —
                // ba tín hiệu, không cái nào là màu đơn độc (09 §10 điều 5).
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-md border px-3 text-left text-sm",
                  selected
                    ? // Nơi số 7 trong 12 nơi được dùng `--theme-*` (09 §4.4):
                      // hàng/thẻ đang được chọn.
                      "border-theme-border bg-theme-tint font-medium text-ink"
                    : "border-line bg-surface text-ink hover:bg-surface-muted",
                )}
              >
                {selected ? (
                  <>
                    <Check
                      className="h-4 w-4 shrink-0 text-theme-accent-text"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Đang xem:</span>
                  </>
                ) : null}

                <span>{context.label}</span>

                {/* Chip chỉ hiện khi em thật sự thuộc một ngành. Lớp Dự trưởng
                    và em chưa xếp lớp đều rơi về `branchId = null`; dán nhãn
                    "Huynh Trưởng" lên một em thiếu nhi là nói sai. */}
                {context.branchId ? (
                  <BranchChip
                    themeKey={context.key}
                    branchName={context.branchName}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
