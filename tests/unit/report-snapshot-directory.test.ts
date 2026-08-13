import { describe, expect, it } from "vitest";
import {
  hasActiveSnapshotFilter,
  parseSnapshotCriteria,
  snapshotListHref,
  snapshotPageRange,
  SNAPSHOT_PAGE_SIZE,
} from "@/features/reports/snapshot-directory";

/**
 * M11-C / TB-06 — bộ lọc kho bản chốt (AC-B11).
 *
 * 🔴 Điểm khác với `parseReportFilter` của `/reports`, và nó là điểm dễ chép
 * nhầm nhất: ở đây tham số hỏng **nới** danh sách về "tất cả", và như thế là
 * đúng — RLS đã giới hạn tập bản chốt người dùng đọc được, nên "tất cả" vẫn
 * nằm trọn trong phạm vi của họ. Ở `/reports` thì ngược lại: `scopeType` hỏng
 * từng âm thầm nhảy từ "lớp mình" sang "toàn xứ đoàn", tức **nới phạm vi truy
 * vấn**. Hai trang, hai luật, và lý do khác nhau.
 */
const YEAR_2024 = "44444444-4444-4444-8444-444444444444";

describe("parseSnapshotCriteria", () => {
  it("không có tham số thì không lọc gì, trang 1", () => {
    expect(parseSnapshotCriteria({})).toEqual({
      academicYearId: null,
      reportType: null,
      scopeType: null,
      page: 1,
    });
  });

  it("đọc đủ ba bộ lọc và số trang", () => {
    expect(parseSnapshotCriteria({
      year: YEAR_2024,
      reportType: "attendance",
      scopeType: "class",
      page: "3",
    })).toEqual({
      academicYearId: YEAR_2024,
      reportType: "attendance",
      scopeType: "class",
      page: 3,
    });
  });

  it("giá trị 'all' nghĩa là không lọc, không phải một giá trị hợp lệ", () => {
    const criteria = parseSnapshotCriteria({ year: "all", reportType: "all", scopeType: "all" });
    expect(criteria.academicYearId).toBeNull();
    expect(criteria.reportType).toBeNull();
    expect(criteria.scopeType).toBeNull();
  });

  it("năm học không phải UUID bị bỏ — không đi thẳng vào câu truy vấn", () => {
    expect(parseSnapshotCriteria({ year: "'; drop table report_snapshots; --" }).academicYearId)
      .toBeNull();
  });

  it("loại báo cáo và phạm vi rác bị bỏ", () => {
    const criteria = parseSnapshotCriteria({ reportType: "finance", scopeType: "planet" });
    expect(criteria.reportType).toBeNull();
    expect(criteria.scopeType).toBeNull();
  });

  it("số trang âm, bằng 0 hoặc không phải số đều về trang 1", () => {
    expect(parseSnapshotCriteria({ page: "-2" }).page).toBe(1);
    expect(parseSnapshotCriteria({ page: "0" }).page).toBe(1);
    expect(parseSnapshotCriteria({ page: "hai" }).page).toBe(1);
  });

  it("tham số lặp lấy giá trị đầu", () => {
    expect(parseSnapshotCriteria({ reportType: ["results", "attendance"] }).reportType)
      .toBe("results");
  });
});

describe("snapshotListHref — đường dẫn chép được, mở tab mới được", () => {
  it("không lọc gì thì đường dẫn sạch, không có chuỗi query thừa", () => {
    expect(snapshotListHref(parseSnapshotCriteria({}))).toBe("/reports/snapshots");
  });

  it("giữ nguyên bộ lọc khi sang trang khác", () => {
    const criteria = parseSnapshotCriteria({ year: YEAR_2024, reportType: "attendance" });
    expect(snapshotListHref(criteria, 3))
      .toBe(`/reports/snapshots?year=${YEAR_2024}&reportType=attendance&page=3`);
  });

  it("trang 1 không kèm ?page=1 — đường dẫn ngắn nhất cho trạng thái mặc định", () => {
    expect(snapshotListHref(parseSnapshotCriteria({ reportType: "results" }), 1))
      .toBe("/reports/snapshots?reportType=results");
  });

  it("đi–về: đường dẫn sinh ra đọc lại đúng bộ lọc cũ", () => {
    const criteria = parseSnapshotCriteria({ year: YEAR_2024, scopeType: "sector", page: "2" });
    const href = snapshotListHref(criteria);
    const params = Object.fromEntries(new URL(href, "https://x.local").searchParams.entries());
    expect(parseSnapshotCriteria(params)).toEqual(criteria);
  });
});

describe("hasActiveSnapshotFilter", () => {
  it("chỉ đổi trang thì KHÔNG tính là đang lọc — nút 'Bỏ lọc' không được hiện vô cớ", () => {
    expect(hasActiveSnapshotFilter(parseSnapshotCriteria({ page: "4" }))).toBe(false);
  });

  it("có bất kỳ bộ lọc nào thì tính là đang lọc", () => {
    expect(hasActiveSnapshotFilter(parseSnapshotCriteria({ scopeType: "class" }))).toBe(true);
  });
});

describe("snapshotPageRange — AC-B11: mỗi trang tối đa 20 dòng", () => {
  it("trang 1 lấy 20 dòng đầu", () => {
    expect(snapshotPageRange(1)).toEqual({ from: 0, to: 19 });
  });

  it("trang 3 lấy đúng dải kế tiếp, không chồng lấn và không bỏ sót", () => {
    expect(snapshotPageRange(3)).toEqual({ from: 40, to: 59 });
  });

  it("dải luôn đúng bằng cỡ trang đã khai", () => {
    const { from, to } = snapshotPageRange(7);
    expect(to - from + 1).toBe(SNAPSHOT_PAGE_SIZE);
  });

  it("số trang không hợp lệ vẫn ra dải hợp lệ chứ không ra chỉ số âm", () => {
    expect(snapshotPageRange(0)).toEqual({ from: 0, to: 19 });
  });
});
