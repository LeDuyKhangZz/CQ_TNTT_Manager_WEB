import { getLoadingAssets } from "@/lib/loading/assets";
import { pickNextIndex } from "@/lib/loading/pick";
import { LoadingOverlay } from "./loading-overlay";

/**
 * Overlay chờ cho **lượt chuyển route** — dùng trong `loading.tsx`.
 *
 * 🔴 Vì sao phải có cái này, dù đã có `LoadingProvider`:
 *
 * Bộ bắt click của provider **không phủ được lượt chuyển module**, và đây là lý
 * do đo được chứ không phải phỏng đoán. Khi người dùng bấm sang route khác, Next
 * commit chuyển trang **ngay lập tức** để kịp dựng `loading.tsx` — nghĩa là
 * `usePathname()` đổi **tức thì**, `NavigationSettleWatcher` thấy route đã xong
 * và tắt cờ chờ, nên hẹn giờ 1 giây bị huỷ **trước khi kịp chạy**. Kết quả: thao
 * tác chờ LÂU NHẤT của cả ứng dụng (3–4 giây đi từ Tổng quan sang Thông báo)
 * lại là thao tác duy nhất không có phản hồi.
 *
 * `loading.tsx` mới là chỗ Next dành riêng cho đúng khoảng chờ ấy. Đây là Server
 * Component nên nó bốc ảnh + câu ngay tại máy chủ, không cần đợi hydrate.
 *
 * 🔴 **KHÔNG `async`.** `loading.tsx` là *fallback* của Suspense; một fallback tự
 * nó suspend là nghịch lý — React không có gì để hiện trong lúc chờ chính cái
 * đang chờ. Bản đầu `await getLoadingAssets()` và đã làm `results.spec.ts:278`
 * đỏ **cả ba viewport**, tái hiện 100%. Vì thế `assets.ts` đọc đĩa đồng bộ.
 */
export function RouteLoadingOverlay() {
  const { images, verses } = getLoadingAssets();

  // Bốc mới mỗi lượt dựng. Không có "lần trước" để tránh trùng ở phía máy chủ —
  // mỗi lượt chuyển route là một tiến trình dựng riêng, không giữ trạng thái.
  const imageIndex = pickNextIndex(images.length, -1);
  const verseIndex = pickNextIndex(verses.length, -1);

  return (
    <LoadingOverlay
      label="Đang mở trang…"
      image={imageIndex >= 0 ? images[imageIndex] : null}
      verse={verseIndex >= 0 ? verses[verseIndex] : null}
    />
  );
}
