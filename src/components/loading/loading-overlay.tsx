"use client";

import Image from "next/image";
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
 * 1. **Không phải `dialog`.** `role="status"` + `aria-live="polite"`, không
 *    `aria-modal`, không bẫy focus, không đóng bằng `Escape`. Màn hình chờ không
 *    phải thứ người dùng "trả lời"; cướp focus của họ giữa lúc gõ là làm hỏng ô
 *    nhập họ đang viết dở.
 * 2. **Che thật.** Lớp phủ nhận sự kiện chuột (không `pointer-events-none`): mục
 *    đích của nó là ngăn bấm lần hai vào cái nút vừa bấm trong lúc máy chủ chưa
 *    trả lời — bấm hai lần vào "Chốt báo cáo" là hai bản chốt.
 * 3. **Ảnh dùng `unoptimized`.** Provider nạp trước ảnh kế tiếp bằng
 *    `new Image()`, mà nạp trước chỉ có tác dụng khi địa chỉ **trùng khớp** với
 *    địa chỉ lúc hiện. Qua bộ tối ưu của Next thì hai địa chỉ khác nhau và công
 *    nạp trước thành công cốc — ô ảnh sẽ trống đúng lúc cần nhất.
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
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-loading flex items-center justify-center bg-overlay p-4"
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
