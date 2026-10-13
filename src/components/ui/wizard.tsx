import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "./button";
import { FormSubmitButton } from "./form-submit-button";

export type WizardStep = { id: string; title: string; href?: string; optional?: boolean };

/** Server owns the current step, validation and draft. Each step is a real form.
 * Only supply hrefs for steps the server permits revisiting. Never persist PII
 * in browser storage or trust hidden inputs for authorization.
 */
export function Wizard({ label, steps, activeId, nextStepId, action, method = "post", fields = [], children, feedback, summary, backHref, skipHref, submitLabel = "Tiếp tục", pending = false }: {
  label: string; steps: readonly WizardStep[]; activeId: string;
  nextStepId?: string;
  /** Omit action when children already contain the step's form. */
  action?: string | ((formData: FormData) => void | Promise<void>); method?: "get" | "post";
  fields?: readonly {name:string; value:string}[]; children: ReactNode; feedback?: ReactNode; summary?: ReactNode;
  backHref?: string; skipHref?: string; submitLabel?: string; pending?: boolean;
}) {
  const index = steps.findIndex(step => step.id === activeId);
  if (index < 0) throw new Error("Wizard activeId must identify a step.");
  const current = steps[index];
  return <section aria-label={label} className="space-y-4">
    <nav aria-label={`Các bước ${label}`}><ol className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line pb-2 text-sm">
      {steps.map((step, i) => <li key={step.id} aria-current={i === index ? "step" : undefined} className={i === index ? "font-semibold" : "text-ink-muted"}>
        {step.href && i < index ? <Link href={step.href} className="inline-flex min-h-11 items-center underline">{i + 1}. {step.title}</Link>
          : <span className="inline-flex min-h-11 items-center">{i + 1}. {step.title}{step.optional ? " (tuỳ chọn)" : ""}</span>}
      </li>)}
    </ol></nav>
    {action ? <form action={action} method={typeof action === "string" ? method : undefined} className="space-y-4" aria-busy={pending || undefined}>
      <input type="hidden" name="step" value={nextStepId ?? activeId} />
      {fields.map((field, i) => <input key={`${field.name}-${i}`} type="hidden" name={field.name} value={field.value} />)}
      <h2 className="text-lg font-semibold">{current.title}</h2>
      {feedback}{children}{index === steps.length - 1 ? summary : null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        {backHref ? <Link href={backHref} className={buttonVariants({variant:"outline"})}>Quay lại</Link> : null}
        {current.optional && skipHref ? <Link href={skipHref} className={buttonVariants({variant:"ghost"})}>Bỏ qua bước này</Link> : null}
        <FormSubmitButton pending={pending}>{submitLabel}</FormSubmitButton>
      </div>
    </form> : <div className="space-y-4">
      {feedback}{children}{index === steps.length - 1 ? summary : null}
      {backHref ? <Link href={backHref} className={buttonVariants({variant:"outline"})}>Quay lại</Link> : null}
    </div>}
  </section>;
}
