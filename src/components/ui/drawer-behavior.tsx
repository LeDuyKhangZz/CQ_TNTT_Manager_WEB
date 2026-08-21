"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useModalBehavior } from "./modal-behavior";

/**
 * Phần hành vi của `Drawer` — REDESIGN 2C task **R2.4**.
 *
 * Tệp này tồn tại vì `drawer.tsx` **không được** mang `"use client"`: panel do
 * máy chủ dựng (xem `drawer.tsx` mục 1), mà `useModalBehavior` lại là hook.
 * Cùng một hình dạng tách tệp như R2.1 (`data-table.tsx` server /
 * `data-table-column-toggle.tsx` client).
 *
 * Nó **không dựng gì cả** (`return null`). Việc của nó là gắn năm yêu cầu a11y
 * của lớp nổi (`05` §3.2) vào một phần tử do máy chủ dựng ra:
 *
 *   1. focus vào panel khi mở   4. đóng thì trả focus về nơi vừa rời đi
 *   2. bẫy `Tab`/`Shift+Tab`    5. khoá cuộn body
 *   3. `Escape` đóng
 *
 * Cả năm đều nằm trong `useModalBehavior` — **dùng lại, không cài lại**, đúng
 * lý do hook ấy được tách ra: `Dialog`, `NavDrawer` và nay `Drawer` không thể
 * tiến hoá lệch nhau.
 *
 * ## Vì sao tìm panel bằng `getElementById` chứ không bằng `ref`
 *
 * `ref` không đi qua được ranh giới RSC — Server Component chỉ truyền được dữ
 * liệu tuần tự hoá được. Nên hợp đồng giữa hai tệp là một **chuỗi `id`**
 * (`DRAWER_PANEL_ID`). Cùng lúc chỉ có một drawer mở nên `id` cố định là đủ.
 *
 * 🔴 Thứ tự effect là phần quan trọng: effect gán `panelRef` **khai báo trước**
 * `useModalBehavior`, mà React chạy effect theo đúng thứ tự khai báo. Đảo hai
 * dòng ấy là focus không vào panel nữa (`panelRef.current` còn `null` lúc hook
 * chạy) — và bài kiểm sẽ đỏ đúng chỗ đó.
 *
 * Dùng `useEffect` chứ không `useLayoutEffect`: đây là component client nhưng
 * vẫn được dựng sẵn ở máy chủ, mà `useLayoutEffect` ở máy chủ thì React cảnh
 * báo. Trả giá là focus vào panel chậm một nhịp — không ai thấy được.
 *
 * ## Vì sao `replace` chứ không `push`
 *
 * Xem `drawer.tsx` mục 3: `Escape` phải đóng **giống hệt** nút ✕ và lớp phủ
 * (hai thứ ấy là `<Link replace>`). Ba đường đóng mà lịch sử để lại ba kiểu
 * khác nhau là thứ người dùng không bao giờ đoán được.
 */
export function DrawerBehavior({
  panelId,
  closeHref,
}: {
  panelId: string;
  closeHref: string;
}) {
  const router = useRouter();
  const panelRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    panelRef.current = document.getElementById(panelId);
  }, [panelId]);

  const onClose = React.useCallback(() => {
    router.replace(closeHref);
  }, [router, closeHref]);

  // `open` luôn `true`: component chỉ được dựng khi drawer đang mở (`Drawer`
  // trả `null` trước khi tới đây), nên "mở" và "tồn tại" là một.
  useModalBehavior({ open: true, onClose, panelRef, initialFocus: "panel" });

  return null;
}
