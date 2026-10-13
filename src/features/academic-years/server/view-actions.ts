"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRouteAccess } from "@/lib/auth/guards";
import { ACADEMIC_YEAR_COOKIE, getAcademicYearView } from "@/lib/academic-year/view";

export async function selectAcademicYear(formData: FormData) {
  const section = String(formData.get("section") ?? "");
  const destination = ["/classes", "/students", "/results", "/reports"].includes(section) ? section : "/classes";
  const actor = await requireRouteAccess(destination);
  if (actor.audience === "guardian" || actor.audience === "student") redirect("/access-denied");
  const view = await getAcademicYearView();
  const selected = view.years.find(year => year.id === formData.get("year"));
  if (!selected) redirect(destination);
  const jar = await cookies();
  if (selected.id === view.current?.id) jar.delete(ACADEMIC_YEAR_COOKIE);
  else jar.set(ACADEMIC_YEAR_COOKIE, selected.id, {httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:60*60*8});
  revalidatePath("/", "layout");
  if (selected.id !== view.current?.id && destination === "/reports") redirect(`/reports?periodType=year&anchorDate=${selected.end_date}`);
  redirect(selected.id !== view.current?.id && destination === "/students" ? "/students?status=all" : destination);
}
