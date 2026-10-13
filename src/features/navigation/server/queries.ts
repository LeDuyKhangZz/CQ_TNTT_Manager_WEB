import "server-only";

import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CLASS_ROLES, SECTOR_ROLES } from "@/lib/permissions/roles";
import { getAcademicYearView } from "@/lib/academic-year/view";
import { getCurrentAcademicYear } from "@/features/academic-years/server/queries";
import { getUnreadNotificationCount } from "@/features/notifications/server/queries";
import { absenceReviewWindow } from "@/features/absence-requests/review-window";
import { todayVi } from "@/lib/dates";
import type { MyClassDestination } from "@/config/navigation";
import type { NavigationBadgeKind, ShellPreferences } from "../types";

/** UI preferences only, scoped to the signed-in account on a shared device.
 * Never send profile/user IDs just to name a preference cookie. */
export async function getShellPreferences(profileId: string): Promise<ShellPreferences> {
  const key = `cq-shell-${createHash("sha256").update(profileId).digest("hex").slice(0, 24)}`;
  const jar = await cookies();
  return {
    key,
    collapsed: jar.get(`${key}-rail`)?.value === "1",
    menuSeen: jar.get(`${key}-menu`)?.value === "1",
  };
}

const getAssignedClassIds = cache(async (): Promise<string[]> => {
  const context = await getAuthContext();
  if (!context || context.audience !== "staff") return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("class_staff_assignments")
    .select("class_id, starts_on, created_at, staff_profiles!inner(profile_id)")
    .eq("staff_profiles.profile_id", context.profileId)
    .eq("is_active", true).is("ends_on", null).lte("starts_on", todayVi());
  const assignments = (error ? [] : data ?? []).map(row => ({
    classId: row.class_id, startsOn: row.starts_on, createdAt: row.created_at,
  }));
  const ids = new Set(assignments.map(row => row.classId));
  // AuthContext intentionally carries only the active role. Its dates have not
  // been validated there, so it is not evidence of an effective assignment.
  if (context.classId && context.academicYearId && !ids.has(context.classId)) {
    const { data: roleRows, error: roleError } = await supabase.from("role_assignments")
      .select("class_id, starts_on, created_at").eq("profile_id", context.profileId)
      .eq("academic_year_id", context.academicYearId).eq("class_id", context.classId)
      .eq("is_active", true).is("ends_on", null).lte("starts_on", todayVi()).limit(1);
    if (!roleError && roleRows?.[0]?.class_id) assignments.push({
      classId: roleRows[0].class_id, startsOn: roleRows[0].starts_on, createdAt: roleRows[0].created_at,
    });
  }
  // Q-R9: bad data with multiple open assignments resolves to the newest.
  // Sort effective date first, then creation time and ID for stable ties.
  assignments.sort((a, b) => b.startsOn.localeCompare(a.startsOn)
    || b.createdAt.localeCompare(a.createdAt) || a.classId.localeCompare(b.classId));
  return [...new Set(assignments.map(row => row.classId))];
});

/** Resolve the newest effective, accessible class (approved Q-R9).
 * The selected year is respected. An old/stale assignment falls back to the list. */
export const getMyClassDestination = cache(async (): Promise<MyClassDestination | null> => {
  const context = await getAuthContext();
  if (!context?.role || !CLASS_ROLES.includes(context.role)) return null;
  const [view, assignmentIds] = await Promise.all([getAcademicYearView(), getAssignedClassIds()]);
  if (!view.year) return { href: "/classes", label: "Chưa đặt năm học" };
  const ids = new Set(assignmentIds);
  if (ids.size === 0) return { href: "/classes", label: "Xem phân công trong năm đang chọn" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("classes").select("id, display_name")
    .in("id", [...ids]).eq("academic_year_id", view.year.id).eq("status", "active");
  if (error || !data?.length) return { href: "/classes", label: "Xem lớp trong năm đang chọn" };
  if (data.length > 1) console.warn("R3_MULTIPLE_EFFECTIVE_CLASSES", { count: data.length });
  const newest = assignmentIds.map(id => data.find(row => row.id === id)).find(row => row !== undefined)!;
  return { href: `/classes/${newest.id}`, label: newest.display_name };
});

/** One count per kind/request, with the actor's JWT and existing RLS.
 * Badge failures are optional UI failures, never a reason to block the shell. */
export const getNavigationBadgeCount = cache(async (kind: NavigationBadgeKind): Promise<number | null> => {
  const context = await getAuthContext();
  if (!context) return null;
  if (kind === "notifications") return getUnreadNotificationCount(context.profileId);
  if (!context.role) return null;
  if (kind === "promotions" && !SECTOR_ROLES.includes(context.role)) return null;
  if (kind === "attendance" && !CLASS_ROLES.includes(context.role)) return null;
  const year = await getCurrentAcademicYear();
  if (!year) return null;
  const supabase = await createClient();
  if (kind === "promotions") {
    // Read scope is broader than review scope for leaders also teaching in a
    // different sector. Match canReviewSector, not merely readable rows.
    if (!context.sectorId) return null;
    const { count, error } = await supabase.from("promotion_reviews")
      .select("id, source_class:classes!promotion_reviews_source_class_id_fkey!inner(grade_levels!inner(sector_id))", { count: "exact", head: true })
      .eq("source_class.grade_levels.sector_id", context.sectorId)
      .eq("source_academic_year_id", year.id).eq("final_status", "pending");
    return error ? null : count;
  }
  const ids = new Set(await getAssignedClassIds());
  if (!ids.size) return 0;
  const window = absenceReviewWindow(todayVi());
  const { count, error } = await supabase.from("absence_requests")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", year.id).in("class_id", [...ids]).eq("status", "pending")
    .gte("absence_date", window.start).lte("absence_date", window.end);
  return error ? null : count;
});
