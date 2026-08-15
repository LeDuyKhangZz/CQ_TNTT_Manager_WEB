import Image from "next/image";
import { cn } from "@/lib/utils";
import { LOADING_OVERLAY_TEST_ID } from "@/lib/loading/constants";
import type { LoiChuaVerse } from "@/lib/loading/verses";

/**
 * Cửa sổ chờ giữa màn hình — `17_UI_POLISH_PLAN.md` §3.2, `09` §12 A3/A4.
 *
 * Chỉ là phần **nhìn thấy**; mọi luật thời gian nằm ở `loading-provider.tsx`.
 * Component này không tự quyết định lúc nào hiện.
 *
 * 🔴 Ba điều cố ý:
 *
 * 1. **Không phải `dialog`, và cũng KHÔNG phải vùng `status`.** Không `aria-modal`,
 *    không bẫy focus, không đóng bằng `Escape` — màn hình chờ không phải thứ người
 *    dùng "trả lời"; cướp focus giữa lúc họ gõ là làm hỏng ô nhập đang viết dở.
 *
 *    🔴 Bản đầu để `role="status"` + `aria-live="polite"` theo `17` §3.2. Điều đó
 *    **sai từ khi ngưỡng hiện về 0** (2026-08-14), và sai theo hai đường cùng lúc:
 *      · Với người dùng trình đọc màn hình: mỗi cú bấm đọc *"Đang xử lý…"* kèm
 *        **nguyên một câu Kinh Thánh**, nhấn chìm đúng câu kết quả họ cần nghe.
 *      · Với mã: nó thành vùng `status` **đầu tiên** trong DOM, nên
 *        `getByRole("status").first()` của cả ứng dụng lẫn bộ kiểm trỏ vào nó thay
 *        vì trỏ vào `FormMessage`. Bắt được ở E2E `enrollment-lifecycle` TB-F14.
 *
 *    Nay `aria-hidden`: ảnh và câu Lời Chúa là **an ủi cho mắt nhìn**, không phải
 *    thông tin. Trạng thái đang chạy đã có `disabled` trên chính nút vừa bấm, và
 *    kết quả vẫn do vùng `status` thật của ứng dụng công bố.
 * 2. **KHÔNG chặn chuột** (`pointer-events-none`) — và đây là chỗ đã đo, không suy đoán.
 *
 *    Bản đầu cố ý chặn, để ngăn bấm lần hai vào "Chốt báo cáo". Luật ấy viết dưới
 *    giả định `SHOW_AFTER_MS = 1000`, tức **chỉ chặn khi thao tác thật sự chậm**.
 *    Khi chủ dự án hạ ngưỡng về 0 (2026-08-14), nó chặn ở **mọi** thao tác, kể cả
 *    cái xong trong 50ms — đo được trên bộ 588 bài E2E: **545 pass / 18 fail /
 *    48,3 phút**, so với **585 pass / 3 fail / 22,0 phút** trước đó. Năm bài đỏ
 *    mang đúng chữ ký `element intercepts pointer events`.
 *
 *    Bỏ chặn KHÔNG mở lại lỗ hổng bấm đúp: mọi nút chạy việc chậm đều đã
 *    `disabled={pending}` ngay tại chỗ, và đường nguy hiểm nhất (gửi thông báo)
 *    còn có `requestId` chống bản lặp ở máy chủ (D-165). Lớp phủ vốn là hàng rào
 *    **thứ ba**, không phải hàng rào duy nhất.
 * 3. **Ảnh dùng `unoptimized`.** Provider nạp trước ảnh kế tiếp bằng
 *    `new Image()`, mà nạp trước chỉ có tác dụng khi địa chỉ **trùng khớp** với
 *    địa chỉ lúc hiện. Qua bộ tối ưu của Next thì hai địa chỉ khác nhau và công
 *    nạp trước thành công cốc — ô ảnh sẽ trống đúng lúc cần nhất.
 *
 * 🔴 **KHÔNG có `"use client"`** — component này không dùng hook nào, và nó phải
 * dựng được ở **cả hai phía**: client (do `LoadingProvider` gọi, cho thao tác ghi)
 * và **server** (do `loading.tsx` gọi, cho lượt chuyển module). Đóng đinh nó vào
 * phía client là mất đúng nửa sau — mà nửa sau mới là lúc chờ lâu nhất.
 */
export function LoadingOverlay({
  image,
  verse,
  label = "Đang xử lý…",
}: {
  image: string | null;
  verse: LoiChuaVerse | null;
  /** Câu trạng thái đọc cho trình đọc màn hình và hiện dưới ba chấm. */
  label?: string;
}) {
  return (
    <div
      data-testid={LOADING_OVERLAY_TEST_ID}
      aria-hidden="true"
      className={cn(
        "loading-appear pointer-events-none fixed inset-0 z-loading",
        "flex items-center justify-center bg-overlay p-4",
      )}
    >
      <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-6 text-center shadow-md">
        {image ? (
          // `alt=""` — ảnh thuần trang trí. Câu trạng thái ngay dưới đã nói đủ
          // cho trình đọc màn hình; mô tả thêm một tấm ảnh ngẫu nhiên chỉ làm
          // nhiễu (09 §10 điều 5 tinh thần: đừng bắt màu/ảnh gánh thông tin).
          <Image
            src={image}
            alt=""
            width={120}
            height={120}
            unoptimized
            priority
            className="loading-bob mx-auto h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
          />
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="loading-dot h-2.5 w-2.5 rounded-full bg-theme-primary"
              // Lệch pha 160ms để ba chấm nhún nối nhau thành sóng, không nhảy
              // đồng loạt như một khối.
              style={{ animationDelay: `${index * 160}ms` }}
            />
          ))}
        </div>

        <p className="mt-3 text-sm font-medium text-ink">{label}</p>

        {verse ? (
          <figure className="mt-4 border-t border-line pt-4">
            <blockquote className="text-sm leading-relaxed text-ink">“{verse.text}”</blockquote>
            {verse.source ? (
              <figcaption className="mt-2 text-xs text-ink-muted">{verse.source}</figcaption>
            ) : null}
          </figure>
        ) : null}
      </div>
    </div>
  );
}
