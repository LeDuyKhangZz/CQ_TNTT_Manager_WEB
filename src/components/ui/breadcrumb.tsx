import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbCrumb } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Đường dẫn phân cấp — `05` §3.3 #12. Trước đây header chỉ in một chuỗi tĩnh
 * "Hệ thống / <tên trang>" và chuỗi đó ẩn hẳn trên mobile.
 *
 * Đoạn cuối là trang hiện tại: **không phải link**, mang `aria-current="page"`.
 *
 * Vùng bấm: `responsive.spec.ts` đo mọi `header a[href]` theo ngưỡng 44px, và
 * chữ 12px thì cao khoảng 20px. Nên link có `min-h-11 min-w-11` để đủ vùng bấm,
 * kèm margin âm để **ô bấm 44px không đẩy header cao thêm 24px** trên màn 360px.
 * Đừng gỡ margin âm "cho sạch" — gỡ là header phình ra ở đúng cỡ máy của giáo
 * lý viên đứng lớp.
 */

export function Breadcrumb({
  items,
  className,
}: {
  items: readonly BreadcrumbCrumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Đường dẫn trang" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center text-2xs text-ink-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.href ?? "current"}-${item.label}`} className="flex min-w-0 items-center">
              {index > 0 ? (
                <ChevronRight
                  className="mx-0.5 h-3.5 w-3.5 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              ) : null}
              {/* `truncate` phải nằm trên một phần tử KHỐI. Đặt thẳng lên
                  `inline-flex` hay lên `<span>` inline thì `overflow:hidden`
                  không cắt gì cả và chữ dài sẽ đẩy header tràn ngang ở 360px —
                  nên nhãn luôn được bọc trong một ô con làm nhiệm vụ cắt. */}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="-my-2.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-1 hover:text-ink hover:underline"
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined} className="min-w-0 truncate px-1">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
