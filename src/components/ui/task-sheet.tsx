"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { buttonVariants } from "./button";
import { useModalBehavior } from "./modal-behavior";

const TaskFeedbackContext = createContext<ReactNode>(null);
export const TaskFeedbackProvider = TaskFeedbackContext.Provider;

/** A focused task, never an anchor to a form below the list. Children stay
 * mounted while closed so a dismissed sheet doesn't silently erase the draft. */
export function TaskSheet({ open, onClose, title, description, children, progressive = false, returnFocusRef }: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; progressive?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const feedback = useContext(TaskFeedbackContext);
  useModalBehavior({ open, onClose, panelRef, returnFocusRef });
  return <div hidden={!open && !progressive} className={progressive ? "py-4" : open ? "fixed inset-0 !m-0 z-drawer flex items-end justify-end" : "hidden"}>
    <div hidden={progressive} aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-overlay" />
    <div ref={panelRef} role={open ? "dialog" : undefined} aria-modal={open ? true : undefined} aria-labelledby={open ? `${id}-title` : undefined} tabIndex={-1}
      className={progressive ? undefined : "drawer-enter relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-md outline-none md:h-full md:max-h-full md:w-[560px] md:rounded-none"}>
      <div hidden={progressive} className="shrink-0 border-b border-line px-4 pb-3 pt-2 md:p-5">
        <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-10 rounded-full bg-line-strong md:hidden" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${id}-title`} className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Đóng ${title.toLocaleLowerCase("vi")}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-muted hover:bg-surface">
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        {description ? <div className="mt-1 text-sm text-ink-muted">{description}</div> : null}
      </div>
      <div className="safe-area-bottom min-h-0 overflow-y-auto overscroll-contain"><div className="space-y-4 p-4 md:p-5">{open ? feedback : null}{children}</div></div>
    </div>
  </div>;
}

/** Simple create/edit entry. Never navigates or moves the underlying list. */
export function ActionSheet({ title, triggerLabel = title, description, children, onOpenChange }: {
  title: string; triggerLabel?: string; description?: ReactNode; children: ReactNode; onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  useEffect(() => onOpenChange?.(open), [open, onOpenChange]);
  useEffect(() => {
    // Enhance the SAME form nodes: typing before hydration must survive.
    setOpen(disclosureRef.current?.open ?? false);
    if (disclosureRef.current) disclosureRef.current.open = true;
    setHydrated(true);
  }, []);
  return <details ref={disclosureRef} suppressHydrationWarning>
    <summary ref={triggerRef} role="button" className={`${buttonVariants({ variant: "outline" })} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}
      onClick={(event) => { if (hydrated) { event.preventDefault(); setOpen(true); } }} aria-haspopup={hydrated ? "dialog" : undefined}>{triggerLabel}</summary>
    <TaskSheet open={open} progressive={!hydrated} returnFocusRef={triggerRef} onClose={() => setOpen(false)} title={title} description={description}>{children}</TaskSheet>
  </details>;
}
