"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Visible labels for an icon rail. Unlike the help Tooltip, its trigger is
 * an existing link/form, never a button containing another interactive element. */
export function RailLabel({ label, enabled, children }: { label: string; enabled: boolean; children: React.ReactNode }) {
  const trigger = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const closeSoon = () => { closeTimer.current = setTimeout(() => setPosition(null), 150); };
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onViewportChange = () => {
      const target = trigger.current;
      if (!target?.contains(document.activeElement)) { close(); return; }
      const rect = target.getBoundingClientRect();
      const bounds = target.closest("nav")?.getBoundingClientRect();
      if (rect.bottom <= (bounds?.top ?? 0) || rect.top >= (bounds?.bottom ?? innerHeight)) { close(); return; }
      // Keyboard focus scrolls a long rail automatically. Keep its label and
      // move it with the focused item instead of treating this as dismissal.
      setPosition({ left: rect.right + 8, top: Math.min(Math.max(8, rect.top), innerHeight - 64) });
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [position]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const show = (target: HTMLElement) => {
    if (!enabled) return;
    cancelClose();
    const rect = target.getBoundingClientRect();
    setPosition({ left: rect.right + 8, top: Math.min(Math.max(8, rect.top), window.innerHeight - 64) });
  };
  return <div ref={trigger} onMouseEnter={(event) => show(event.currentTarget)} onMouseLeave={closeSoon}
    onFocus={(event) => show(event.currentTarget)} onBlur={() => setPosition(null)}>
    {children}
    {enabled && position ? createPortal(<span role="tooltip" onMouseEnter={cancelClose} onMouseLeave={closeSoon}
      className="fixed z-dropdown max-w-64 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink shadow-md"
      style={position}>{label}</span>, document.body) : null}
  </div>;
}
