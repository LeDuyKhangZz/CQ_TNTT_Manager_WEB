// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(relativePath: string): string {
  return readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

describe("M13-A — hàng rào route và ngữ nghĩa portal", () => {
  it("AC-01-03: mọi trang /student đi qua layout kiểm quyền route", () => {
    const layout = source("src/app/(dashboard)/student/layout.tsx");
    expect(layout).toContain('requireRouteAccess("/student")');
  });

  it("trang điểm danh vẫn giữ lớp guard thứ hai", () => {
    const queries = source("src/features/portal/server/queries.ts");
    const selfPage = queries.slice(queries.indexOf("getStudentSelfAttendancePageData"));
    expect(selfPage).toContain('requireRouteAccess("/student/attendance")');
  });

  it("TB-M13-05: chính em được lọc bằng profile, không lấy phần tử đầu tiên", () => {
    const queries = source("src/features/portal/server/queries.ts");
    const start = queries.indexOf("export async function getSelfStudent");
    const end = queries.indexOf("export async function getGuardianChildLinks", start);
    const selfQuery = queries.slice(start, end);

    expect(selfQuery).toContain('.eq("profile_id", profileId)');
    expect(selfQuery).not.toMatch(/\[0\]/);
  });

  it("TB-M13-05: 'con của tôi' và 'em đọc được' là hai hàm khác nhau", () => {
    const queries = source("src/features/portal/server/queries.ts");
    expect(queries).toContain("export async function getAccessibleStudents");
    expect(queries).toContain("export async function getMyChildren");
    expect(queries).not.toContain("function getPortalChildren");
  });
});
