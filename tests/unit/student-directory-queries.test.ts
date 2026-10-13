import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppRole } from "@/lib/permissions/roles";

const state = vi.hoisted(() => ({
  role: "secretary" as AppRole, historical: false, fail: "", count: 125,
  calls: [] as { source: string; operations: [string, ...unknown[]][] }[],
  rpc: vi.fn(), from: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/guards", () => ({ requireRouteAccess: async () => ({ role: state.role, profileId: "actor" }) }));
vi.mock("@/lib/academic-year/view", () => ({ getAcademicYearView: async () => ({ readOnly: state.historical, year: { id: "historical-year" } }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: state.from, rpc: state.rpc }) }));
import { getStudentsPageData } from "@/features/students/server/queries";
import { parseStudentCriteria } from "@/features/students/student-directory";

const classA = "a1000000-0000-4000-8000-000000000001";
const sectorA = "a2000000-0000-4000-8000-000000000001";
const sectorB = "a2000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks(); state.calls = []; state.role = "secretary"; state.historical = false; state.fail = "";
  state.from.mockImplementation((source: string) => {
    const entry = { source, operations: [] as [string, ...unknown[]][] };
    state.calls.push(entry);
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "is", "or", "order", "range"]) {
      query[method] = (...args: unknown[]) => { entry.operations.push([method, ...args]); return query; };
    }
    query.then = (resolve: (value: unknown) => unknown) => {
      const isCount = entry.operations.some(operation => operation[0] === "select" && (operation[2] as {head?: boolean})?.head);
      const failed = state.fail === source || state.fail === (isCount ? "count" : "rows");
      return Promise.resolve({ data: [], count: state.count, error: failed ? { message: "unavailable" } : null }).then(resolve);
    };
    return query;
  });
  state.rpc.mockImplementation(async (name: string) => ({
    data: name.startsWith("list_students_for_fees") ? [{ id: "student", full_name: "Test", total_count: state.count }] : [],
    error: state.fail === name ? { message: "unavailable" } : null,
  }));
});

describe("R4.1 directory query boundaries", () => {
  it("count and page use the same multi-filters; sort is stable and precedes the bounded SQL range", async () => {
    const data = await getStudentsPageData(parseStudentCriteria({ sector: [sectorA, sectorB], class: [classA, "none"], status: ["active", "withdrawn"], q: "an", size: "50", page: "99", sort: "class", dir: "desc" }), { loadCreationOptions: false });
    const queries = state.calls.filter(call => call.source === "student_directory");
    const filters = (index: number) => queries[index].operations.filter(operation => ["in", "eq", "is", "or"].includes(operation[0]));
    expect(filters(0)).toEqual(filters(1));
    expect(filters(1)).toContainEqual(["in", "sector_id", [sectorA, sectorB]]);
    expect(filters(1)).toContainEqual(["in", "status", ["active", "withdrawn"]]);
    expect(filters(1)).toContainEqual(["or", `class_id.is.null,class_id.in.(${classA})`]);
    expect(queries[1].operations.slice(-3)).toEqual([
      ["order", "class_name", { ascending: false, nullsFirst: false }], ["order", "id", { ascending: true }], ["range", 100, 149],
    ]);
    expect(data).toMatchObject({ page: 3, pageSize: 50, totalItems: 125 });
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("historical count and rows both constrain the selected year and cannot expose creation", async () => {
    state.historical = true;
    const data = await getStudentsPageData(parseStudentCriteria({ status: "all" }));
    const queries = state.calls.filter(call => call.source === "student_year_directory");
    expect(queries).toHaveLength(2);
    for (const query of queries) expect(query.operations).toContainEqual(["eq", "academic_year_id", "historical-year"]);
    expect(data.canWrite).toBe(false);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it.each([false, true])("fee reads stay on the narrow RPC (historical=%s), with clamped pagination", async historical => {
    state.role = "treasurer"; state.historical = historical;
    const data = await getStudentsPageData(parseStudentCriteria({ sector: [sectorA, sectorB], status: "all", size: "50", page: "99", sort: "class" }));
    const name = historical ? "list_students_for_fees_by_year" : "list_students_for_fees";
    expect(state.rpc.mock.calls.map(call => call[0])).toEqual([name, name]);
    expect(state.rpc.mock.calls[1][1]).toMatchObject({ p_sector_id: sectorA, p_limit: 50, p_offset: 100 });
    expect(state.calls.map(call => call.source)).not.toContain("student_directory");
    expect(data).toMatchObject({ feeScope: true, canWrite: false, criteria: { sort: "name", direction: "asc" } });
  });
  it.each(["count", "rows"])("a failed %s request is not presented as an empty directory", async failure => {
    state.fail = failure;
    await expect(getStudentsPageData(parseStudentCriteria({}))).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("guardian load failure is distinguishable from an empty choice list in the creation drawer", async () => {
    state.fail = "list_guardian_options";
    expect(await getStudentsPageData(parseStudentCriteria({}))).toMatchObject({ guardians: [], guardianOptionsError: true });
  });
});
