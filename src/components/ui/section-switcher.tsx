"use client";

import { useId, useState, type ReactNode } from "react";

/** One workspace at a time. Hidden sections stay mounted to retain drafts. */
export function SectionSwitcher({ label, sections }: {
  label: string;
  sections: { id: string; label: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(sections[0]?.id);
  const active = sections.some((section) => section.id === selected) ? selected : sections[0]?.id;
  const prefix = useId();
  return <div className="space-y-4">
    <nav aria-label={label} className="flex flex-wrap gap-1 border-b border-line pb-2">
      {sections.map((section) => <button type="button" key={section.id} aria-pressed={active === section.id}
        aria-controls={`${prefix}-${section.id}`} onClick={() => setSelected(section.id)}
        className={`min-h-11 rounded-lg px-3 text-sm font-medium ${active === section.id ? "bg-theme-tint text-theme-accent-text" : "text-ink-muted hover:bg-surface-muted"}`}>
        {section.label}
      </button>)}
    </nav>
    {sections.map((section) => <div key={section.id} id={`${prefix}-${section.id}`} hidden={active !== section.id}>{section.content}</div>)}
  </div>;
}
