import { describe, expect, it } from "vitest";
import {
  defaultReportScope,
  invalidFilterMessage,
  normalizeReportFilter,
  parseReportFilter,
  reportEmptyMessage,
  reportFilterSchema,
  reportFilterToSearchParams,
  reportScopeLabel,
  resolveReportRange,
  type ReportFilter,
  type ReportScopeSubject,
} from "@/features/reports/filters";
import { buildReportExportData } from "@/features/reports/report-data";

/**
 * M11-A — luật đọc tham số bộ lọc báo cáo (**TB-04 · TB-05**).
 *
 * Mọi tham số ở đây đến từ **thanh địa chỉ**, tức từ nơi người dùng sửa được, và
 * cùng chuỗi query ấy được dùng lại nguyên vẹn cho link tải Excel/PDF (D-52).
 * Vì thế bài kiểm ở đây canh đúng hai thứ:
 *
 *   1. **Không bao giờ NỚI RỘNG phạm vi sau lưng người dùng.** Bản trước
 *      2026-08-11 gặp tham số hỏng là đặt lại toàn bộ bộ lọc về `global` — im
 *      lặng, không một chữ báo. Với Giáo lý viên lớp thì đó là nhảy từ "lớp
 *      mình" sang "toàn xứ đoàn"; cơ sở dữ liệu vẫn chặn, nhưng thứ họ **nhìn
 *      thấy** không còn là thứ họ **yêu cầu**.
 *   2. **Không cảnh báo giả.** Mở `/reports` trần không kèm tham số là chuyện
 *      thường ngày, không phải lỗi — nếu lượt đó cũng hiện dải cảnh báo thì
 *      dải ấy luôn hiện, và một cảnh báo luôn hiện là một cảnh báo không ai đọc.
 */
const SECTOR_AU = "11111111-1111-4111-8111-111111111111";
const SECTOR_THIEU = "22222222-2222-4222-8222-222222222222";
const CLASS_AU_1A = "33333333-3333-4333-8333-333333333333";

const GLOBAL_VIEWER: ReportScopeSubject = { scopeKind: "global", sectorId: null, classId: null };
const SECTOR_VIEWER: ReportScopeSubject = { scopeKind: "sector", sectorId: SECTOR_AU, classId: null };
const CLASS_VIEWER: ReportScopeSubject = { scopeKind: "class", sectorId: SECTOR_AU, classId: CLASS_AU_1A };

const TODAY = "2026-09-17";
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

describe("defaultReportScope — phạm vi mặc định suy từ vai trò (TB-05 bước 1)", () => {
  it("vai trò toàn xứ đoàn mặc định toàn xứ đoàn", () => {
    expect(defaultReportScope(GLOBAL_VIEWER)).toEqual({ scopeType: "global", scopeId: null });
  });

  it("vai trò ngành mặc định đúng ngành mình, không phải toàn xứ đoàn", () => {
    expect(defaultReportScope(SECTOR_VIEWER)).toEqual({ scopeType: "sector", scopeId: SECTOR_AU });
  });

  it("vai trò lớp mặc định đúng lớp mình", () => {
    expect(defaultReportScope(CLASS_VIEWER)).toEqual({ scopeType: "class", scopeId: CLASS_AU_1A });
  });

  it("phụ huynh/thiếu nhi không có ngành lẫn lớp thì về toàn xứ đoàn — cơ sở dữ liệu vẫn là tuyến chặn", () => {
    expect(defaultReportScope({ scopeKind: "ownership", sectorId: null, classId: null }))
      .toEqual({ scopeType: "global", scopeId: null });
  });

  it("🔴 vai trò ngành mà CHƯA được gán ngành không rơi vào phạm vi ngành rỗng", () => {
    // `scopeType: "sector"` với `scopeId: null` sẽ trượt qua `superRefine` của
    // `reportFilterSchema` và cho một câu lỗi khó hiểu ở tận lúc bấm "Chốt".
    expect(defaultReportScope({ scopeKind: "sector", sectorId: null, classId: null }))
      .toEqual({ scopeType: "global", scopeId: null });
  });
});

describe("parseReportFilter — bộ lọc hợp lệ", () => {
  it("giữ nguyên bộ lọc hợp lệ trên URL", () => {
    expect(parseReportFilter({
      reportType: "attendance",
      periodType: "month",
      anchorDate: "2026-10-05",
      scopeType: "class",
      scopeId: CLASS_AU_1A,
    }, GLOBAL_VIEWER, TODAY)).toEqual({
      filter: {
        reportType: "attendance",
        periodType: "month",
        anchorDate: "2026-10-05",
        scopeType: "class",
        scopeId: CLASS_AU_1A,
      },
      invalidKeys: [],
    });
  });

  it("tham số lặp (?scopeType=class&scopeType=global) lấy giá trị đầu, không ghép chuỗi", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { scopeType: ["class", "global"], scopeId: [CLASS_AU_1A] },
      GLOBAL_VIEWER,
      TODAY,
    );
    expect(filter.scopeType).toBe("class");
    expect(filter.scopeId).toBe(CLASS_AU_1A);
    expect(invalidKeys).toEqual([]);
  });
});

describe("parseReportFilter — không có tham số thì KHÔNG cảnh báo, và mặc định theo vai trò", () => {
  it("người toàn xứ đoàn mở trang trần: toàn xứ đoàn, im lặng", () => {
    expect(parseReportFilter({}, GLOBAL_VIEWER, TODAY)).toEqual({
      filter: { reportType: "attendance", periodType: "month", anchorDate: TODAY, scopeType: "global", scopeId: null },
      invalidKeys: [],
    });
  });

  it("Trưởng ngành mở trang trần: thấy ngay ngành mình, im lặng", () => {
    expect(parseReportFilter({}, SECTOR_VIEWER, TODAY)).toEqual({
      filter: { reportType: "attendance", periodType: "month", anchorDate: TODAY, scopeType: "sector", scopeId: SECTOR_AU },
      invalidKeys: [],
    });
  });

  it("Giáo lý viên lớp mở trang trần: thấy ngay lớp mình, im lặng", () => {
    expect(parseReportFilter({}, CLASS_VIEWER, TODAY)).toEqual({
      filter: { reportType: "attendance", periodType: "month", anchorDate: TODAY, scopeType: "class", scopeId: CLASS_AU_1A },
      invalidKeys: [],
    });
  });

  it("tham số rỗng (?scopeType=) coi như không nói gì, không phải nói sai", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { scopeType: "", scopeId: "", anchorDate: "" },
      CLASS_VIEWER,
      TODAY,
    );
    expect(filter.scopeType).toBe("class");
    expect(filter.scopeId).toBe(CLASS_AU_1A);
    expect(filter.anchorDate).toBe(TODAY);
    expect(invalidKeys).toEqual([]);
  });
});

describe("parseReportFilter — tham số hỏng thì thu hẹp và NÓI RA", () => {
  it("🔴 scopeType rác của Giáo lý viên lớp rơi về LỚP MÌNH, không rơi về toàn xứ đoàn", () => {
    const { filter, invalidKeys } = parseReportFilter({ scopeType: "everything" }, CLASS_VIEWER, TODAY);
    expect(filter.scopeType).toBe("class");
    expect(filter.scopeId).toBe(CLASS_AU_1A);
    expect(invalidKeys).toContain("scopeType");
  });

  it("🔴 phạm vi lớp thiếu id rơi về phạm vi của chính người xem, không rơi về toàn xứ đoàn", () => {
    const { filter, invalidKeys } = parseReportFilter({ scopeType: "class" }, SECTOR_VIEWER, TODAY);
    expect(filter.scopeType).toBe("sector");
    expect(filter.scopeId).toBe(SECTOR_AU);
    expect(invalidKeys).toContain("scopeId");
  });

  it("scopeId không phải UUID bị bỏ và được báo — không đi thẳng vào câu truy vấn", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { scopeType: "sector", scopeId: "'; drop table students; --" },
      SECTOR_VIEWER,
      TODAY,
    );
    expect(filter.scopeId).toBe(SECTOR_AU);
    expect(invalidKeys).toEqual(["scopeId"]);
  });

  it("loại báo cáo và kỳ báo cáo rác rơi về mặc định và đều được báo", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { reportType: "finance", periodType: "decade", anchorDate: "17-09-2026" },
      GLOBAL_VIEWER,
      TODAY,
    );
    expect(filter).toEqual({
      reportType: "attendance",
      periodType: "month",
      anchorDate: TODAY,
      scopeType: "global",
      scopeId: null,
    });
    expect(invalidKeys).toEqual(["reportType", "periodType", "anchorDate"]);
  });

  it("toàn xứ đoàn kèm scopeId thừa thì bỏ im lặng — đó là thu hẹp, không phải lỗi người dùng", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { scopeType: "global", scopeId: SECTOR_AU },
      GLOBAL_VIEWER,
      TODAY,
    );
    expect(filter.scopeId).toBeNull();
    expect(invalidKeys).toEqual([]);
  });

  it("một scopeId hỏng chỉ được báo MỘT lần dù đi qua cả hai nhánh xử lý", () => {
    const { invalidKeys } = parseReportFilter(
      { scopeType: "class", scopeId: "không-phải-uuid" },
      CLASS_VIEWER,
      TODAY,
    );
    expect(invalidKeys).toEqual(["scopeId"]);
  });
});

describe("parseReportFilter — link tải file không lệch bản đang xem (D-52)", () => {
  const cases: Array<[string, ReportScopeSubject, ReportFilter]> = [
    ["toàn xứ đoàn", GLOBAL_VIEWER, { ...base, periodType: "month" }],
    ["theo ngành", SECTOR_VIEWER, { ...base, periodType: "month", scopeType: "sector", scopeId: SECTOR_AU }],
    ["theo lớp", CLASS_VIEWER, { ...base, periodType: "year", scopeType: "class", scopeId: CLASS_AU_1A }],
    // D-171: kỳ của báo cáo Kết quả **luôn** là năm học, nên vòng đi–về phải bắt
    // đầu từ một bộ lọc đã hợp lệ; đưa `week` vào đây là kiểm một trạng thái
    // không tồn tại được nữa.
    ["kết quả học tập theo ngành", GLOBAL_VIEWER, { ...base, reportType: "results", periodType: "year", scopeType: "sector", scopeId: SECTOR_THIEU }],
  ];

  it.each(cases)("chuỗi query dựng lại đúng bộ lọc — %s", (_label, subject, filter) => {
    const params = reportFilterToSearchParams(filter);
    expect(parseReportFilter(Object.fromEntries(params.entries()), subject, TODAY)).toEqual({
      filter,
      invalidKeys: [],
    });
  });
});

describe("câu chữ hiện ra cho người dùng", () => {
  it("không có tham số hỏng thì không có dải cảnh báo nào", () => {
    expect(invalidFilterMessage([])).toBeNull();
  });

  it("dải cảnh báo gọi tên trường bằng tiếng Việt, không phải tên khoá kỹ thuật", () => {
    const message = invalidFilterMessage(["scopeType", "scopeId"]);
    expect(message).toBe("Tham số không hợp lệ nên đã đặt lại về phạm vi của bạn: Phạm vi · Phạm vi cụ thể.");
    expect(message).not.toContain("scopeType");
  });

  it("🔴 ba lý do bảng trống cho ra ba câu KHÁC NHAU — gộp làm một là gốc của vòng lặp thử lại vô tận", () => {
    const messages = [
      reportEmptyMessage("empty"),
      reportEmptyMessage("out_of_scope"),
      reportEmptyMessage("no_finalized_session"),
    ];
    expect(new Set(messages).size).toBe(3);
    expect(reportEmptyMessage("out_of_scope")).toContain("không được xem phạm vi này");
    expect(reportEmptyMessage("no_finalized_session")).toContain("chưa có buổi điểm danh nào được chốt");
  });
});

/**
 * M11-B / D-171 — nhãn kỳ báo cáo phải nói đúng nội dung bên trong.
 *
 * 🔴 Bài quan trọng nhất của khối này là bài **cuối**: ép ở `parseReportFilter`
 * mà quên ép ở `reportFilterSchema` thì trang hiện "Năm học" trong khi bản chốt
 * ghi `period_type = 'month'` — và bản chốt thì **không sửa được**, nên cái nhãn
 * sai ấy nằm lại vĩnh viễn. Hai cửa vào, hai lượt kiểm.
 */
describe("D-171 — báo cáo Kết quả học tập luôn là cả năm học", () => {
  it("chuyên cần giữ nguyên mọi kỳ người dùng chọn", () => {
    for (const periodType of ["week", "month", "year"] as const) {
      expect(normalizeReportFilter({ ...base, reportType: "attendance", periodType }).periodType)
        .toBe(periodType);
    }
  });

  it("kết quả học tập bị ép về năm học dù URL nói tuần hay tháng", () => {
    expect(normalizeReportFilter({ ...base, reportType: "results", periodType: "week" }).periodType)
      .toBe("year");
    expect(normalizeReportFilter({ ...base, reportType: "results", periodType: "month" }).periodType)
      .toBe("year");
  });

  it("bộ lọc đã đúng thì trả về CHÍNH nó, không tạo bản sao thừa", () => {
    const filter: ReportFilter = { ...base, reportType: "results", periodType: "year" };
    expect(normalizeReportFilter(filter)).toBe(filter);
  });

  it("ép kỳ KHÔNG bị báo là tham số hỏng — đổi loại báo cáo là thao tác chính đáng", () => {
    const { filter, invalidKeys } = parseReportFilter(
      { reportType: "results", periodType: "month", anchorDate: "2026-10-05" },
      GLOBAL_VIEWER,
      TODAY,
    );
    expect(filter.periodType).toBe("year");
    expect(invalidKeys).toEqual([]);
  });

  it("khoảng ngày đi theo kỳ đã ép: cả năm học, không phải tháng 10", () => {
    const { filter } = parseReportFilter(
      { reportType: "results", periodType: "month", anchorDate: "2026-10-05" },
      GLOBAL_VIEWER,
      TODAY,
    );
    expect(resolveReportRange(filter, academicYear)).toEqual({ from: "2026-09-01", to: "2027-05-31" });
  });

  it("🔴 Server Action cũng ép — không chỉ trang. Bản chốt không sửa được nên nhãn sai là vĩnh viễn", () => {
    const parsed = reportFilterSchema.parse({
      reportType: "results",
      periodType: "month",
      anchorDate: "2026-10-05",
      scopeType: "global",
      scopeId: null,
    });
    expect(parsed.periodType).toBe("year");
  });
});

/**
 * M11-B / AC-B09 — hộp xác nhận phải nêu hậu quả **bằng tên riêng** (`11` §5),
 * nên phạm vi phải ra được thành chữ.
 */
describe("reportScopeLabel", () => {
  const options = {
    sectors: [{ id: SECTOR_AU, name: "Ấu" }],
    classes: [{ id: CLASS_AU_1A, name: "Ấu 1A" }],
  };

  it("toàn xứ đoàn có tên riêng, không phải chuỗi rỗng", () => {
    expect(reportScopeLabel({ scopeType: "global", scopeId: null }, options)).toBe("Toàn xứ đoàn");
  });

  it("ngành và lớp ra chữ kèm loại phạm vi", () => {
    expect(reportScopeLabel({ scopeType: "sector", scopeId: SECTOR_AU }, options)).toBe("Ngành Ấu");
    expect(reportScopeLabel({ scopeType: "class", scopeId: CLASS_AU_1A }, options)).toBe("Lớp Ấu 1A");
  });

  it("🔴 phạm vi ngoài quyền xem trả null chứ không bịa ra một cái tên", () => {
    expect(reportScopeLabel({ scopeType: "class", scopeId: SECTOR_THIEU }, options)).toBeNull();
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
      reason: "empty",
      sectors: [],
      classes: [],
      availableScopeTypes: ["global", "sector", "class"],
    });
    expect(data.rows[0][0]).toBe("'=SUM(A1:A9)");
    expect(data.rows[0][1]).toBe(12);
    expect(data.rows[0][2]).toBe("'@ghi chú");
  });
});
