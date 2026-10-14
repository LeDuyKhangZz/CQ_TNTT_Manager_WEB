import Image from "next/image";
import { LOADING_OVERLAY_TEST_ID } from "@/lib/loading/constants";
import type { LoiChuaVerse } from "@/lib/loading/verses";

/**
 * Luce và một câu Lời Chúa cho mỗi lần chờ; provider quản lý chọn ngẫu nhiên và thời gian.
 * Không chặn thao tác, cướp focus hoặc đọc cả câu qua live region mỗi lần chuyển trang.
 * Ảnh dùng URL gốc để dùng lại ảnh đã được provider nạp trước.
 */
export function LoadingOverlay({ image, verse, label = "Đang xử lý…" }: {
  image: string | null;
  verse: LoiChuaVerse | null;
  label?: string;
}) {
  return (
    <div
      data-testid={LOADING_OVERLAY_TEST_ID}
      aria-hidden="true"
      className="loading-appear pointer-events-none fixed inset-0 z-loading flex items-center justify-center bg-overlay p-4"
    >
      <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-6 text-center shadow-md">
        {image ? (
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
