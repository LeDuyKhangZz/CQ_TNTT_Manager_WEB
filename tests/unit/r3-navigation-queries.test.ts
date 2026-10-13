import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "@/lib/auth/types";

const state = vi.hoisted(() => ({
  context: {} as AuthContext,
  year: "year-current",
  data: {} as Record<string, Record<string, unknown>[]>,
  errors: new Set<string>(),
  cookies: new Map<string, string>(),
  from: vi.fn(), unread: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getAuthContext: async () => state.context }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: state.from }) }));
vi.mock("@/lib/academic-year/view", () => ({ getAcademicYearView: async () => ({ year: { id: state.year } }) }));
vi.mock("@/features/academic-years/server/queries", () => ({ getCurrentAcademicYear: async () => ({ id: "year-current" }) }));
vi.mock("@/features/notifications/server/queries", () => ({ getUnreadNotificationCount: state.unread }));
vi.mock("@/lib/dates", () => ({ todayVi: () => "2026-10-12", APP_TIME_ZONE: "Asia/Ho_Chi_Minh" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => ({ value: state.cookies.get(name) }) }) }));
import { getMyClassDestination, getNavigationBadgeCount, getShellPreferences } from "@/features/navigation/server/queries";

function valueAt(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, row);
}

beforeEach(() => {
  vi.clearAllMocks(); state.errors.clear(); state.cookies.clear(); state.year = "year-current";
  state.context = { profileId: "actor-a", userId: "actor-a", username: "TEST", displayName: "Test", accountStatus: "active", mustChangePassword: false,
    role: "class_teacher", audience: "staff", scopeKind: "class", classId: "class-a", academicYearId: "year-current", sectorId: null };
  state.data = {
    class_staff_assignments: [{ class_id: "class-a", staff_profiles: { profile_id: "actor-a" }, starts_on: "2026-09-01", created_at: "2026-09-01T00:00:00Z", ends_on: null, is_active: true }],
    role_assignments: [{ profile_id: "actor-a", class_id: "class-a", academic_year_id: "year-current", starts_on: "2026-09-01", created_at: "2026-09-01T00:00:00Z", ends_on: null, is_active: true }],
    classes: [{ id: "class-a", display_name: "Ấu 1A", academic_year_id: "year-current", status: "active" }],
    absence_requests: [{ id: "absence-a", class_id: "class-a", academic_year_id: "year-current", status: "pending", absence_date: "2026-10-12" }],
    promotion_reviews: [
      { id: "own", source_academic_year_id: "year-current", final_status: "pending", source_class: { grade_levels: { sector_id: "sector-a" } } },
      { id: "readable-extra-teaching-class", source_academic_year_id: "year-current", final_status: "pending", source_class: { grade_levels: { sector_id: "sector-b" } } },
    ],
  };
  state.unread.mockResolvedValue(3);
  state.from.mockImplementation((table: string) => {
    let rows = [...(state.data[table] ?? [])];
    let head = false;
    const query = {
      select: (_columns: string, options?: { head?: boolean }) => { head = Boolean(options?.head); return query; },
      eq: (key: string, value: unknown) => { rows = rows.filter(row => valueAt(row, key) === value); return query; },
      is: (key: string, value: unknown) => { rows = rows.filter(row => valueAt(row, key) === value); return query; },
      in: (key: string, values: unknown[]) => { rows = rows.filter(row => values.includes(valueAt(row, key))); return query; },
      lte: (key: string, value: string) => { rows = rows.filter(row => String(valueAt(row, key)) <= value); return query; },
      gte: (key: string, value: string) => { rows = rows.filter(row => String(valueAt(row, key)) >= value); return query; },
      limit: (size: number) => { rows = rows.slice(0, size); return query; },
      then: (resolve: (result: unknown) => unknown) => Promise.resolve(state.errors.has(table)
        ? { data: null, count: null, error: { message: "network unavailable" } }
        : { data: head ? null : rows, count: rows.length, error: null }).then(resolve),
    };
    return query;
  });
});

describe("R3 navigation query boundaries", () => {
  it("uses the newest effective class and warns for bad multiple-assignment data (Q-R9)", async () => {
    expect(await getMyClassDestination()).toEqual({ href: "/classes/class-a", label: "Ấu 1A" });
    state.data.class_staff_assignments.push({ ...state.data.class_staff_assignments[0], class_id: "class-b", starts_on: "2026-10-01" });
    state.data.classes.push({ ...state.data.classes[0], id: "class-b", display_name: "Ấu 1B" });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await getMyClassDestination())?.href).toBe("/classes/class-b");
    expect(warning).toHaveBeenCalledWith("R3_MULTIPLE_EFFECTIVE_CLASSES", { count: 2 });
    state.data.class_staff_assignments.reverse();
    expect((await getMyClassDestination())?.href).toBe("/classes/class-b");
    warning.mockRestore();
  });
  it.each(["future", "ended", "inactive"])("%s assignment is not resurrected by AuthContext.classId", async kind => {
    for (const table of ["class_staff_assignments", "role_assignments"]) {
      if (kind === "future") state.data[table][0].starts_on = "2026-11-01";
      if (kind === "ended") state.data[table][0].ends_on = "2026-10-01";
      if (kind === "inactive") state.data[table][0].is_active = false;
    }
    expect((await getMyClassDestination())?.href).toBe("/classes");
    expect(await getNavigationBadgeCount("attendance")).toBe(0);
  });
  it("an effective role-scoped class still works without a class-staff row", async () => {
    state.data.class_staff_assignments = [];
    expect((await getMyClassDestination())?.href).toBe("/classes/class-a");
  });
  it("selected historical year does not resolve a current-year class", async () => {
    state.year = "year-old";
    expect((await getMyClassDestination())?.href).toBe("/classes");
  });
  it("portal cannot resolve or count staff work", async () => {
    state.context.role = "guardian"; state.context.audience = "guardian";
    expect(await getMyClassDestination()).toBeNull();
    expect(await getNavigationBadgeCount("attendance")).toBeNull();
    expect(await getNavigationBadgeCount("promotions")).toBeNull();
    expect(state.from).not.toHaveBeenCalled();
  });
  it("promotion count excludes a readable teaching class outside review scope", async () => {
    state.context.role = "sector_leader"; state.context.sectorId = "sector-a";
    expect(await getNavigationBadgeCount("promotions")).toBe(1);
    state.context.sectorId = null;
    expect(await getNavigationBadgeCount("promotions")).toBeNull();
  });
  it("attendance count excludes other classes, processed requests and dates outside the review window", async () => {
    const first = state.data.absence_requests[0];
    state.data.absence_requests.push({ ...first, class_id: "class-other" }, { ...first, status: "acknowledged" }, { ...first, absence_date: "2026-11-30" });
    expect(await getNavigationBadgeCount("attendance")).toBe(1);
  });
  it("query errors do not invent zero workload or a class destination", async () => {
    state.errors.add("classes"); state.errors.add("absence_requests");
    expect((await getMyClassDestination())?.href).toBe("/classes");
    expect(await getNavigationBadgeCount("attendance")).toBeNull();
  });
  it("notification count belongs to the actor, with the shared existing counter", async () => {
    expect(await getNavigationBadgeCount("notifications")).toBe(3);
    expect(state.unread).toHaveBeenCalledWith("actor-a");
  });
  it("rail and hint cookies are isolated per account and only literal 1 enables a preference", async () => {
    const first = await getShellPreferences("actor-a");
    state.cookies.set(`${first.key}-rail`, "1"); state.cookies.set(`${first.key}-menu`, "true");
    expect(await getShellPreferences("actor-a")).toMatchObject({ collapsed: true, menuSeen: false });
    const other = await getShellPreferences("actor-b");
    expect(other).toMatchObject({ collapsed: false, menuSeen: false });
    expect(other.key).not.toBe(first.key);
    expect(first.key).not.toContain("actor-a");
  });
});
