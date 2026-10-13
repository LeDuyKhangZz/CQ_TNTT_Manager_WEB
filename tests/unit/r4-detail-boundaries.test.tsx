import * as React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  history: false,
  deny: false,
  calls: [] as { source: string; operations: [string, ...unknown[]][] }[],
  replies: {} as Record<string, { data: unknown; error: null | { code: string } }[]>,
  authorize: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  attendance: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/guards", () => ({ requireRouteAccess: state.authorize }));
vi.mock("@/lib/academic-year/view", () => ({
  getAcademicYearView: async () => ({
    readOnly: state.history,
    year: { id: state.history ? "past-year" : "current-year", code: "2026-2027" },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: state.from, rpc: state.rpc }),
}));
vi.mock("@/features/portal/server/queries", () => ({ getPortalAttendance: state.attendance }));
vi.mock("@/features/portal/components/attendance-history", () => ({
  AttendanceHistory: () => <div>Attendance remains available</div>,
}));

import { StudentAttendanceOverview, StudentAttendanceSection, StudentFamilyMembers } from "@/features/students/components/student-detail-sections";
import { getStudentDetail } from "@/features/students/server/queries";

const studentId = "10000000-0000-4000-8000-000000000001";
const guardianId = "20000000-0000-4000-8000-000000000001";
const student = {
  id: studentId, student_code: "CQ0001", saint_name: "Giuse", full_name: "Em kiểm thử",
  status: "active", hardship_flag: false, gender: null, date_of_birth: null,
  patron_feast_date: null, address: null, phone: null, general_notes: null,
  guardians: { id: guardianId, full_name: "Giám hộ kiểm thử", phone: null, address: null },
};
const attendanceRow = {
  recordId: "record-for-this-student", sessionId: "allowed-session",
  attendanceDate: "2026-10-11", meetingType: "sunday", massStatus: "present", catechismStatus: "present",
};

function reply(source: string, data: unknown, error: null | { code: string } = null) {
  (state.replies[source] ??= []).push({ data, error });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.history = false;
  state.deny = false;
  state.calls = [];
  state.replies = {};
  state.authorize.mockImplementation(async () => {
    if (state.deny) throw new Error("ACCESS_DENIED");
    return { role: "secretary", profileId: "actor" };
  });
  const builder = (source: string) => {
    const entry = { source, operations: [] as [string, ...unknown[]][] };
    state.calls.push(entry);
    const query: Record<string, unknown> = {};
    for (const name of ["select", "eq", "neq", "not", "order", "limit", "maybeSingle", "in", "is", "range", "or"]) {
      query[name] = (...args: unknown[]) => { entry.operations.push([name, ...args]); return query; };
    }
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(
      state.replies[source]?.shift() ?? { data: [], error: null },
    ).then(resolve);
    return query;
  };
  state.from.mockImplementation(builder);
  state.rpc.mockImplementation((name: string) => builder(`rpc:${name}`));
  state.attendance.mockResolvedValue({ status: "ok", yearCode: "2026-2027", summary: null, rows: [attendanceRow] });
});

describe("R4 independent detail boundary verification", () => {
  it.each(["family", "attendance", "overview"])("denied route cannot query the %s section", async section => {
    state.deny = true;
    const read = section === "family"
      ? StudentFamilyMembers({ studentId, guardianId })
      : section === "attendance" ? StudentAttendanceSection({ studentId }) : StudentAttendanceOverview({ studentId });
    await expect(read).rejects.toThrow("ACCESS_DENIED");
    expect(state.from).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.attendance).not.toHaveBeenCalled();
  });

  it.each([false, true])("siblings retain guardian, student exclusion and year boundaries (history=%s)", async historical => {
    state.history = historical;
    render(await StudentFamilyMembers({ studentId, guardianId }));
    expect(state.authorize).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(state.calls).toHaveLength(1);
    const query = state.calls[0];
    expect(query.source).toBe(historical ? "student_year_directory" : "student_directory");
    expect(query.operations).toContainEqual(["eq", "guardian_id", guardianId]);
    expect(query.operations).toContainEqual(["neq", "id", studentId]);
    if (historical) expect(query.operations).toContainEqual(["eq", "academic_year_id", "past-year"]);
    else expect(query.operations.some(op => op[1] === "academic_year_id")).toBe(false);
    expect(screen.getByText("Không có hồ sơ khác trong phạm vi của bạn.")).toBeInTheDocument();
  });

  it("sibling query failure is distinguishable from an empty family", async () => {
    reply("student_directory", null, { code: "FETCH_ERROR" });
    render(await StudentFamilyMembers({ studentId, guardianId }));
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể tải anh chị em cùng giám hộ");
    expect(screen.queryByText("Không có hồ sơ khác trong phạm vi của bạn.")).toBeNull();
  });

  it("notes use the allowed session and current student's record, never direct note column reads", async () => {
    state.history = true;
    reply("rpc:attendance_session_notes", [{ record_id: attendanceRow.recordId, note: "Ghi chú riêng của em" }]);
    render(await StudentAttendanceSection({ studentId, noteSession: "forged-other-session" }));
    expect(state.attendance).toHaveBeenCalledWith(studentId, { id: "past-year", code: "2026-2027" });
    expect(state.rpc).toHaveBeenCalledWith("attendance_session_notes", { p_session_id: "allowed-session" });
    expect(state.calls[0].operations).toContainEqual(["eq", "record_id", attendanceRow.recordId]);
    expect(state.from).not.toHaveBeenCalled();
    expect(screen.getByText("Ghi chú riêng của em")).toBeInTheDocument();
  });

  it("note failure leaves attendance visible and offers a session-specific retry", async () => {
    reply("rpc:attendance_session_notes", null, { code: "42501" });
    render(await StudentAttendanceSection({ studentId }));
    expect(screen.getByText("Attendance remains available")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể tải ghi chú của buổi");
    expect(screen.getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", `/students/${studentId}?tab=attendance&noteSession=allowed-session`);
  });

  it("no attendance rows cannot trigger a note request from a crafted URL", async () => {
    state.attendance.mockResolvedValue({ status: "no_data", yearCode: "2026-2027", summary: null, rows: [] });
    render(await StudentAttendanceSection({ studentId, noteSession: "forged-other-session" }));
    expect(state.rpc).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("guardian-options failure reaches the detail page without dropping the student", async () => {
    reply("students", student);
    reply("rpc:list_guardian_options", null, { code: "FETCH_ERROR" });
    const detail = await getStudentDetail(studentId);
    expect(detail).toMatchObject({ student: { id: studentId }, canWrite: true, guardianOptions: [], guardianOptionsError: true });
  });

  it("historical detail requires membership and never loads writable guardian choices", async () => {
    state.history = true;
    reply("students", student);
    reply("enrollments", [{ id: "historical-membership" }]);
    const detail = await getStudentDetail(studentId);
    expect(detail).toMatchObject({ student: { id: studentId }, canWrite: false, canWriteSensitive: false, canArchive: false, guardianOptionsError: false });
    expect(state.calls.find(call => call.source === "enrollments")?.operations).toContainEqual(["eq", "academic_year_id", "past-year"]);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("a student outside the selected historical year cannot expose detail data", async () => {
    state.history = true;
    reply("students", student);
    const detail = await getStudentDetail(studentId);
    expect(detail).toMatchObject({ student: null, canWrite: false });
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.calls.some(call => call.source === "student_health_profiles")).toBe(false);
  });

  it("an old open enrollment cannot label the current-year header", async () => {
    reply("students", student);
    reply("enrollments", [{
      id: "old-open", academic_year_id: "past-year", status: "active",
      enrolled_on: "2025-09-01", ended_on: null,
      classes: { display_name: "Old class" },
      academic_years: { code: "2025-2026", status: "closed" },
    }]);
    const detail = await getStudentDetail(studentId);
    expect(detail).toMatchObject({ viewedClassName: null, openEnrollmentClassName: "Old class" });
  });

  it("historical header selects its year even when a newer open enrollment exists", async () => {
    state.history = true;
    reply("students", student);
    reply("enrollments", [{ id: "historical-membership" }]);
    reply("enrollments", [
      { id: "new-open", academic_year_id: "current-year", status: "active", enrolled_on: "2026-09-01", ended_on: null, classes: { display_name: "New class" }, academic_years: { code: "2026-2027", status: "current" } },
      { id: "old-ended", academic_year_id: "past-year", status: "completed", enrolled_on: "2025-09-01", ended_on: "2026-08-01", classes: { display_name: "Old class" }, academic_years: { code: "2025-2026", status: "closed" } },
    ]);
    const detail = await getStudentDetail(studentId);
    expect(detail).toMatchObject({ viewedClassName: "Old class", openEnrollmentClassName: "New class", canWrite: false });
  });

  it("overview warning remains scoped to the selected historical year and student", async () => {
    state.history = true;
    reply("v_student_attendance_summary", { warn_consecutive_absence: true, catechism_absence_streak: 3 });
    render(await StudentAttendanceOverview({ studentId }));
    const query = state.calls[0];
    expect(query.operations).toContainEqual(["eq", "student_id", studentId]);
    expect(query.operations).toContainEqual(["eq", "academic_year_id", "past-year"]);
    expect(screen.getByRole("status")).toHaveTextContent("Vắng 3 buổi giáo lý liên tiếp.");
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it("overview summary errors offer recovery rather than an apparently clear attendance record", async () => {
    reply("v_student_attendance_summary", null, { code: "FETCH_ERROR" });
    render(await StudentAttendanceOverview({ studentId }));
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể tải cảnh báo chuyên cần");
    expect(screen.getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", `/students/${studentId}`);
  });
});
