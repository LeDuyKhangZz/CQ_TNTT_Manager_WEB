import type { ReactNode } from "react";
import { PageHeader } from "./page-header";

export function EntityHeader({ title, description, backHref, backLabel, facts, chips, actions = [], more }: {
  title: string; description?: string; backHref: string; backLabel?: string;
  facts?: ReactNode; chips?: ReactNode; actions?: readonly [] | readonly [ReactNode] | readonly [ReactNode, ReactNode]; more?: ReactNode;
}) {
  return <div className="space-y-3">
    <PageHeader title={title} description={description} backHref={backHref} backLabel={backLabel}
      action={actions.length || more ? <div className="flex flex-wrap items-center gap-2">{actions}{more}</div> : undefined} />
    {chips ? <div className="flex flex-wrap items-center gap-2">{chips}</div> : null}
    {facts ? <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">{facts}</div> : null}
  </div>;
}
