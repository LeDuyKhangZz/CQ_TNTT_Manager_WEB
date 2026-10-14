import { Loader2 } from "lucide-react";
import { LOADING_OVERLAY_TEST_ID } from "@/lib/loading/constants";
import type { LoiChuaVerse } from "@/lib/loading/verses";

/**
 * Non-blocking progress notice. Timing, pending actions and navigation cleanup
 * remain owned by LoadingProvider. Keep its prop contract for server fallbacks.
 * No focus capture or live announcement on each navigation: field feedback and
 * disabled/pending controls remain the accessible source of operation status.
 */
export function LoadingOverlay({ label = "Đang xử lý…" }: {
  image: string | null;
  verse: LoiChuaVerse | null;
  label?: string;
}) {
  return (
    <div
      data-testid={LOADING_OVERLAY_TEST_ID}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-4 top-20 z-loading flex justify-center"
    >
      <div className="flex max-w-full items-center gap-3 rounded-md border border-line-strong bg-surface px-4 py-3 text-sm font-medium text-ink shadow-md">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <p>{label}</p>
      </div>
    </div>
  );
}