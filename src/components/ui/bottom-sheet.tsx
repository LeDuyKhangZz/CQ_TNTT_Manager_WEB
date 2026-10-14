"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModalBehavior } from "./modal-behavior";

/** Mobile navigation surface. Keep it outside sticky headers so its backdrop
 * covers the whole shell, while inheriting the current sector's theme tokens. */
export function BottomSheet({ open, onClose, id, title, toolbar, children }: {
  open: boolean; onClose: () => void; id: string; title: string;
  toolbar?: ReactNode; children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  useModalBehavior({ open, onClose, panelRef, initialFocus: "panel" });
  // Switching from the function catalogue to account keeps the same modal.
  // Announce its new title without losing the original opener for focus return.
  useEffect(() => { if (open) panelRef.current?.focus(); }, [open, title]);

  if (!open) return null;
  return <div className="fixed inset-0 z-drawer flex items-end justify-center lg:hidden">
    <div aria-hidden="true" data-sheet-backdrop onClick={onClose} className="drawer-overlay-enter absolute inset-0 bg-overlay" />
    <div ref={panelRef} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}
      className="bottom-sheet-enter relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-b-0 border-line bg-surface shadow-md outline-none">
      <div className="shrink-0 border-b border-line px-4 pb-3 sm:px-5">
        <div aria-hidden="true" className="flex h-5 touch-none items-center justify-center"
          onPointerDown={(event) => { dragStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerCancel={() => { dragStart.current = null; }}
          onPointerUp={(event) => {
            const start = dragStart.current;
            dragStart.current = null;
            if (start && event.clientY - start.y > 60 && Math.abs(event.clientX - start.x) < 60) onClose();
          }}>
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${id}-title`} className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Đóng ${title.toLocaleLowerCase("vi")}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-muted hover:bg-surface-muted">
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {toolbar}
      </div>
      <div className="safe-area-bottom min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  </div>;
}
