import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Dropdown, DropdownItem, DropdownLink, DropdownSeparator } from "./dropdown";

export type RowAction = {
  key: string; label: string; disabled?: boolean;
} & ({ href: string; onSelect?: never } | { href?: never; onSelect: () => void });

/** Destructive content is supplied as a real form or a ConfirmDialog trigger. */
export function RowActionMenu({ name, items, destructive, align = "end" }: { name: string; items: readonly RowAction[]; destructive?: ReactNode; align?: "start" | "end" }) {
  if (!items.length && !destructive) return null;
  return <Dropdown label={<span><MoreHorizontal aria-hidden className="h-5 w-5" strokeWidth={1.75} /></span>}
    ariaLabel={`Thao tác với ${name}`} align={align} triggerClassName="min-w-11 px-2 [&>svg]:hidden">
    {items.map(item => item.href && !item.disabled
      ? <DropdownLink key={item.key} href={item.href}>{item.label}</DropdownLink>
      : <DropdownItem key={item.key} disabled={item.disabled} onClick={item.onSelect}>{item.label}</DropdownItem>)}
    {destructive ? <><DropdownSeparator />{destructive}</> : null}
  </Dropdown>;
}
