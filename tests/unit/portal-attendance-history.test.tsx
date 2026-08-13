import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import type { PortalAttendanceRow, PortalAttendanceSummary } from "@/features/portal/server/queries";

const summary: PortalAttendanceSummary = {
  sessionsCounted: 3,
  massPresentCount: 2,
  catechismPresentCount: 1,
  massAttendanceScore: 8,
  catechismAttendanceScore: 6,
  catechismAbsenceStreak: 2,
  sundayAbsenceStreak: 0,
  warnConsecutiveAbsence: true,
  warnConsecutiveSunday: false,
  warnLowRate: false,
};

const rows: PortalAttendanceRow[] = [{
  recordId: "record-1",
  attendanceDate: "2026-08-09",
  meetingType: "sunday",
  massStatus: "present",
  catechismStatus: "excused_absence",
}];

describe("M13-B — lịch sử điểm danh portal", () => {
  it("cảnh báo có live status, nêu hành động và không lộ ghi chú nội bộ", () => {
    const { container } = render(
      <AttendanceHistory
        summary={summary}
        rows={rows}
        status="ok"
        audience="guardian"
        yearCode="2026-2027"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Vắng 2 buổi giáo lý liên tiếp");
    expect(screen.getByRole("status")).toHaveTextContent("liên hệ Giáo lý viên");
    expect(container.textContent).not.toContain("ghi chú nội bộ");
  });

  it("bảng có caption, scope và vùng cuộn dùng được bằng bàn phím", () => {
    render(
      <AttendanceHistory
        summary={summary}
        rows={rows}
        status="ok"
        audience="student"
        yearCode="2026-2027"
      />,
    );
    const table = screen.getByRole("table", { name: /Lịch sử điểm danh/ });
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByRole("rowheader", { name: /09\/08\/2026/ })).toBeInTheDocument();
    expect(table.parentElement).toHaveAttribute("tabindex", "0");
  });

  it("phân biệt chưa ghi danh với đã ghi danh nhưng chưa có buổi chốt", () => {
    const { rerender } = render(
      <AttendanceHistory
        summary={null}
        rows={[]}
        status="no_enrollment"
        audience="guardian"
        yearCode="2026-2027"
      />,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Chưa có ghi danh");

    rerender(
      <AttendanceHistory
        summary={null}
        rows={[]}
        status="no_data"
        audience="guardian"
        yearCode="2026-2027"
      />,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Chưa có buổi điểm danh");
  });
});
