"use server";

import { redirect } from "next/navigation";
import { createGuardianFormAction } from "@/features/guardians/server/actions";
import type { CreateGuardianFormState } from "../create-student-form-state";
import { parseStudentCriteria, studentListHref } from "../student-directory";

/** Reuse validation/duplicate checks/authorization; only the next screen changes. */
export async function createGuardianWizardAction(listHref: string, previous: CreateGuardianFormState, form: FormData): Promise<CreateGuardianFormState> {
  const result = await createGuardianFormAction(previous, form);
  if (result.createdGuardianId) {
    const raw = new URL(listHref, "http://local").searchParams;
    const params: Record<string, string[]> = {};
    raw.forEach((value, key) => { (params[key] ??= []).push(value); });
    const criteria = parseStudentCriteria(params);
    const target = new URL(studentListHref(criteria, criteria.page), "http://local");
    target.searchParams.set("new", "1");
    target.searchParams.set("step", "student");
    target.searchParams.set("guardian", result.createdGuardianId);
    redirect(`${target.pathname}${target.search}`);
  }
  return result;
}
