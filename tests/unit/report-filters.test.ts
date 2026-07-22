import { describe, expect, it } from "vitest";
import {
  parseReportFilter,
  reportFilterToSearchParams,
  resolveReportRange,
  type ReportFilter,
} from "@/features/reports/filters";
import { buildReportExportData } from "@/features/reports/report-data";

const academicYear = { startDate: "2026-09-01", endDate: "2027-05-31" };
const base: ReportFilter = {
  reportType: "attendance",
  periodType: "week",
  anchorDate: "2026-09-17",
  scopeType: "global",
  scopeId: null,
};

describe("resolveReportRange", () => {
  it("tuần chạy từ thứ Hai tới Chúa nhật chứa ngày đang chọn", () => {
    // 17/09/2026 là thứ Năm.
    expect(resolveReportRange(base, academicYear)).toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });

  it("ngày đang chọn là thứ Hai thì tuần bắt đầu từ chính ngày đó", () => {
    expect(resolveReportRange({ ...base, anchorDate: "2026-09-14" }, academicYear))
      .toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });

  it("ngày đang chọn là Chúa nhật vẫn thuộc tuần bắt đầu thứ Hai trước đó", () => {
    expect(resolveReportRange({ ...base, anchorDate: "2026-09-20" }, academicYear))
      .toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });

  it("tháng chạy trọn tháng dương lịch", () => {
    expect(resolveReportRange({ ...base, periodType: "month" }, academicYear))
      .toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("năm bám theo năm học chứ không phải năm dương lịch", () => {
    expect(resolveReportRange({ ...base, periodType: "year" }, academicYear))
      .toEqual({ from: "2026-09-01", to: "2027-05-31" });
  });
});

describe("parseReportFilter", () => {
  it("giữ nguyên bộ lọc hợp lệ trên URL", () => {
    expect(parseReportFilter({
      reportType: "results",
      periodType: "month",
      anchorDate: "2026-10-05",
      scopeType: "class",
      scopeId: "11111111-1111-4111-8111-111111111111",
    })).toEqual({
      reportType: "results",
      periodType: "month",
      anchorDate: "2026-10-05",
      scopeType: "class",
      scopeId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("phạm vi lớp thiếu id thì rơi về mặc định an toàn thay vì ném lỗi", () => {
    const filter = parseReportFilter({ scopeType: "class" });
    expect(filter.scopeType).toBe("global");
    expect(filter.scopeId).toBeNull();
  });

  it("query string tạo lại đúng bộ lọc — link tải file không lệch bản đang xem", () => {
    const filter: ReportFilter = { ...base, periodType: "month", scopeType: "sector", scopeId: "11111111-1111-4111-8111-111111111111" };
    const params = reportFilterToSearchParams(filter);
    expect(parseReportFilter(Object.fromEntries(params.entries()))).toEqual(filter);
  });
});

describe("buildReportExportData", () => {
  it("chặn Excel formula injection ở cả tên lớp lẫn ô chữ", () => {
    const data = buildReportExportData({
      filter: base,
      academicYear: { id: "x", code: "2026-2027", startDate: "2026-09-01", endDate: "2027-05-31" },
      title: "Chuyên cần",
      from: "2026-09-14",
      to: "2026-09-20",
      headers: ["Lớp", "Sĩ số", "Tỷ lệ"],
      rows: [{ classId: "c1", className: "=SUM(A1:A9)", sectorId: null, values: [12, "@ghi chú"] }],
    });
    expect(data.rows[0][0]).toBe("'=SUM(A1:A9)");
    expect(data.rows[0][1]).toBe(12);
    expect(data.rows[0][2]).toBe("'@ghi chú");
  });
});
