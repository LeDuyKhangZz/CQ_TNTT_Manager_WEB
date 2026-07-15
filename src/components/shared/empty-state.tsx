import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({ title, description, icon: Icon = Inbox, action }: { title: string; description: string; icon?: LucideIcon; action?: React.ReactNode }) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
