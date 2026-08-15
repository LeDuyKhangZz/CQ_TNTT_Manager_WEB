"use client";

import * as React from "react";
import { useGlobalLoading } from "./loading-provider";

/**
 * Báo cho `LoadingProvider` biết "route mới đang dựng" — dùng trong `loading.tsx`.
 *
 * ## 🔴 Vì sao thay cho `RouteLoadingOverlay`
 *
 * Bản cũ cho `loading.tsx` dựng **overlay thứ hai** của riêng nó. Hậu quả chủ dự
 * án bắt được (2026-08-15), và cả hai vế đều là lỗi:
 *
 * 1. **Một lần chuyển module hiện overlay HAI lần liên tiếp.** Bộ bắt click của
 *    provider mở overlay thứ nhất ("Đang xử lý…"), rồi Next dựng `loading.tsx`
 *    và overlay thứ hai ("Đang mở trang…") chồng lên. Hai component khác nhau,
 *    hai ảnh khác nhau, hai câu khác nhau — nhìn như trang bị giật hai nhịp.
 *
 * 2. **Overlay thứ hai LUÔN ra đúng một ảnh và đúng một câu.** Nó là Server
 *    Component nằm trong `loading.tsx`, mà Next dựng sẵn phần đó **lúc build**
 *    rồi dùng lại mãi ⇒ `Math.random()` chạy đúng một lần trong đời, ở máy build.
 *    Bốc ngẫu nhiên ở máy chủ cho một thứ được dựng sẵn là **không bao giờ**
 *    ngẫu nhiên; chỗ duy nhất bốc được là trình duyệt.
 *
 * ## Cách làm
 *
 * `loading.tsx` nay chỉ **phát tín hiệu**, không vẽ gì: mount thì báo bận, unmount
 * (tức Next đã thay fallback bằng trang thật) thì báo xong. Overlay vẫn do
 * `LoadingProvider` vẽ — **một chỗ duy nhất**, và nó bốc ảnh + câu ở client nên
 * lần nào cũng ngẫu nhiên thật.
 *
 * Đây cũng là lời giải đúng cho vấn đề mà `RouteLoadingOverlay` sinh ra để chữa:
 * `usePathname()` đổi **tức thì** khi Next commit chuyển route, nên
 * `NavigationSettleWatcher` tắt cờ chờ quá sớm. Vòng đời của chính `loading.tsx`
 * mới là thước đo đúng cho "route mới đã dựng xong chưa".
 */
export function RouteLoadingSignal() {
  const { begin, end } = useGlobalLoading();

  React.useEffect(() => {
    begin();
    return end;
  }, [begin, end]);

  return null;
}
