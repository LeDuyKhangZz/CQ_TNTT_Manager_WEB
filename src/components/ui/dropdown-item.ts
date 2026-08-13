import { cn } from "@/lib/utils";

/**
 * Lớp CSS của một mục trong menu — tách khỏi `dropdown.tsx` có lý do, không phải
 * để cho gọn file.
 *
 * 🔴 `dropdown.tsx` mang `"use client"`. Trong Next App Router, **mọi** export
 * của một module `"use client"` trở thành *client reference*: gọi nó trong lúc
 * dựng một Server Component sẽ ném lỗi ngay, kể cả khi đó chỉ là một hàm thuần
 * trả về chuỗi.
 *
 * Bẫy này ẩn rất kỹ vì nó phụ thuộc **nơi gọi**, không phụ thuộc mã nguồn:
 * `SignOutButton` nằm trong thanh bên (thuộc cây client) nên chạy tốt suốt từ
 * đợt M14-A; đến khi trang `/account` — một Server Component — dùng lại đúng
 * component đó ở đợt C thì cả trang đổ vào error boundary. Đo được bằng E2E:
 * `/account` hiện "Đã xảy ra lỗi" trên cả ba viewport.
 *
 * Vì thế hàm này sống trong một module **không** `"use client"`, và
 * `dropdown.tsx` cũng nhập từ đây thay vì tự định nghĩa.
 */
export function dropdownItemClassName(tone: "default" | "danger" = "default"): string {
  return cn(
    "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm",
    "hover:bg-surface-muted",
    tone === "danger" ? "text-danger" : "text-ink",
  );
}
