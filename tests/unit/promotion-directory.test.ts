import { describe, expect, it } from "vitest";
import {
  buildClassProgress,
  clampPromotionPage,
  defaultTargetClassId,
  filterPromotionRows,
  hasActivePromotionFilter,
  parsePromotionClassFilter,
  parsePromotionCriteria,
  parsePromotionPage,
  parsePromotionStatusFilter,
  PROMOTION_PAGE_SIZE,
  promotionCellHref,
  promotionsHref,
  rowStatusFilterOf,
  type PromotionBoardCriteria,
} from "@/features/promotions/promotion-directory";

/**
 * M08-A — luật đọc tham số, luật lọc và luật chọn lớp đích mặc định của bảng
 * chuyển lớp (**TO-BE 1 / AC-12 · BR-M08-X2**).
 *
 * Mọi tham số ở đây đến từ **thanh địa chỉ**, tức từ nơi người dùng sửa được:
 * một chuỗi rác lọt qua sẽ thành `.eq()` với giá trị không phải UUID và cho
 * trang **500** — đúng điều `AGENTS` §5 cấm.
 */
const CLASS_A = "11111111-1111-4111-8111-111111111111";
const CLASS_B = "22222222-2222-4222-8222-222222222222";

describe("đọc tham số của bảng chuyển lớp", () => {
  it("không có tham số nào thì xem tất cả, trang 1", () => {
    expect(parsePromotionCriteria({})).toEqual({
      classId: "all",
      status: "all",
      search: "",
      page: 1,
    });
  });

  it("classId rác rơi về 'all' thay vì đi thẳng vào câu truy vấn", () => {
    expect(parsePromotionClassFilter("'; drop table --")).toBe("all");
    expect(parsePromotionClassFilter("123")).toBe("all");
    expect(parsePromotionClassFilter(undefined)).toBe("all");
    expect(parsePromotionClassFilter(CLASS_A)).toBe(CLASS_A);
  });

  it("trạng thái lạ rơi về 'all'; bốn trạng thái thật thì giữ nguyên", () => {
    expect(parsePromotionStatusFilter("approved")).toBe("approved");
    expect(parsePromotionStatusFilter("not_proposed")).toBe("not_proposed");
    expect(parsePromotionStatusFilter("completed")).toBe("all");
  });

  it("số trang âm, số 0 và chữ đều rơi về trang 1", () => {
    expect(parsePromotionPage("-3")).toBe(1);
    expect(parsePromotionPage("0")).toBe(1);
    expect(parsePromotionPage("hai")).toBe(1);
    expect(parsePromotionPage("4")).toBe(4);
  });

  it("mảng tham số (?q=a&q=b) lấy phần tử đầu, không ném lỗi", () => {
    expect(parsePromotionCriteria({ q: ["An", "Bình"] }).search).toBe("An");
  });

  it("khoảng trắng quanh chuỗi tìm bị cắt", () => {
    expect(parsePromotionCriteria({ q: "  An  " }).search).toBe("An");
  });
});

describe("đường dẫn giữ bộ lọc — TO-BE 1 bước 2", () => {
  const base: PromotionBoardCriteria = { classId: "all", status: "all", search: "", page: 1 };

  it("không bộ lọc, trang 1 thì đường dẫn sạch", () => {
    expect(promotionsHref(base, 1)).toBe("/promotions");
  });

  it("giữ nguyên lớp · trạng thái · chuỗi tìm khi sang trang", () => {
    const href = promotionsHref({ ...base, classId: CLASS_A, status: "pending", search: "An" }, 3);
    expect(href).toContain(`classId=${CLASS_A}`);
    expect(href).toContain("status=pending");
    expect(href).toContain("q=An");
    expect(href).toContain("page=3");
  });

  it("ô 'Chờ duyệt' của bảng tiến độ dẫn thẳng vào đúng lớp ở đúng trạng thái", () => {
    expect(promotionCellHref(CLASS_B, "pending")).toBe(`/promotions?classId=${CLASS_B}&status=pending`);
  });

  it("hasActivePromotionFilter phân biệt được 'chưa lọc gì' với 'đang lọc'", () => {
    expect(hasActivePromotionFilter(base)).toBe(false);
    expect(hasActivePromotionFilter({ ...base, search: "An" })).toBe(true);
    expect(hasActivePromotionFilter({ ...base, classId: CLASS_A })).toBe(true);
    expect(hasActivePromotionFilter({ ...base, status: "rejected" })).toBe(true);
  });

  it("bấm dấu trang cũ ?page=12 sau khi lọc hẹp lại thì về trang cuối, không ra trang trống", () => {
    expect(clampPromotionPage(12, 10)).toBe(1);
    expect(clampPromotionPage(12, PROMOTION_PAGE_SIZE * 3)).toBe(3);
    expect(clampPromotionPage(1, 0)).toBe(1);
  });
});

describe("lọc danh sách", () => {
  const rows = [
    { studentName: "Maria Nguyễn Thị An", classId: CLASS_A, finalStatus: null },
    { studentName: "Giuse Trần Văn Bình", classId: CLASS_A, finalStatus: "pending" as const },
    { studentName: "Anna Lê Thị Ánh", classId: CLASS_B, finalStatus: "approved" as const },
    { studentName: "Phêrô Đỗ Đình Cường", classId: CLASS_B, finalStatus: "rejected" as const },
  ];
  const base: PromotionBoardCriteria = { classId: "all", status: "all", search: "", page: 1 };

  it("'chưa đề xuất' là dòng KHÔNG có đề xuất nào, không phải một trạng thái của bảng", () => {
    expect(rowStatusFilterOf(null)).toBe("not_proposed");
    expect(rowStatusFilterOf("pending")).toBe("pending");
    const result = filterPromotionRows(rows, { ...base, status: "not_proposed" });
    expect(result.map((row) => row.studentName)).toEqual(["Maria Nguyễn Thị An"]);
  });

  it("lọc theo lớp và trạng thái cùng lúc", () => {
    const result = filterPromotionRows(rows, { ...base, classId: CLASS_B, status: "approved" });
    expect(result.map((row) => row.studentName)).toEqual(["Anna Lê Thị Ánh"]);
  });

  it("tìm tên KHÔNG DẤU vẫn ra — người dùng gõ trên điện thoại hiếm khi bỏ dấu", () => {
    expect(filterPromotionRows(rows, { ...base, search: "nguyen thi an" })).toHaveLength(1);
    expect(filterPromotionRows(rows, { ...base, search: "do dinh cuong" })).toHaveLength(1);
  });

  it("chữ 'đ' được coi là 'd' — 'Đỗ Đình' tìm bằng 'do dinh'", () => {
    expect(filterPromotionRows(rows, { ...base, search: "Đỗ Đình" })).toHaveLength(1);
  });

  it("tìm 'an' khớp cả 'An' lẫn 'Ánh' — bỏ dấu nên hai tên gần nhau đều ra", () => {
    const result = filterPromotionRows(rows, { ...base, search: "an" });
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe("bảng tiến độ theo lớp — TO-BE 1 bước 1 / AC-12", () => {
  const rows = [
    { studentName: "A", className: "Ấu 1A", classId: CLASS_A, finalStatus: null, enrollmentOpen: true },
    { studentName: "B", className: "Ấu 1A", classId: CLASS_A, finalStatus: "pending" as const, enrollmentOpen: true },
    { studentName: "C", className: "Ấu 1A", classId: CLASS_A, finalStatus: "rejected" as const, enrollmentOpen: true },
    // Đã duyệt ⇒ ghi danh nguồn thành `completed`, tức KHÔNG còn mở.
    { studentName: "D", className: "Ấu 1A", classId: CLASS_A, finalStatus: "approved" as const, enrollmentOpen: false },
    { studentName: "E", className: "Ấu 2B", classId: CLASS_B, finalStatus: null, enrollmentOpen: true },
  ];

  it("đếm đủ bốn trạng thái cho từng lớp", () => {
    const progress = buildClassProgress(rows);
    const first = progress.find((entry) => entry.classId === CLASS_A);
    expect(first).toMatchObject({ notProposed: 1, pending: 1, approved: 1, rejected: 1 });
  });

  it("sĩ số chỉ đếm ghi danh còn mở — em đã duyệt lên lớp không còn nằm trong sĩ số năm cũ", () => {
    const progress = buildClassProgress(rows);
    expect(progress.find((entry) => entry.classId === CLASS_A)?.rosterSize).toBe(3);
  });

  it("sắp xếp theo tên lớp tiếng Việt", () => {
    expect(buildClassProgress(rows).map((entry) => entry.className)).toEqual(["Ấu 1A", "Ấu 2B"]);
  });

  it("danh sách rỗng cho bảng rỗng, không ném lỗi", () => {
    expect(buildClassProgress([])).toEqual([]);
  });
});

describe("BR-M08-X2 — mặc định giữ nhánh A/B", () => {
  const targets = [
    { id: "target-a", sectionCode: "A", displayName: "Ấu 2A" },
    { id: "target-b", sectionCode: "B", displayName: "Ấu 2B" },
  ];

  it("em lớp nhánh B được đề xuất sẵn sang lớp nhánh B, KHÔNG phải phần tử đầu danh sách", () => {
    expect(defaultTargetClassId("B", targets)).toBe("target-b");
  });

  it("em lớp nhánh A vẫn ra lớp nhánh A", () => {
    expect(defaultTargetClassId("A", targets)).toBe("target-a");
  });

  it("lớp không chia nhánh thì lấy phần tử đầu — không có gì để 'giữ'", () => {
    expect(defaultTargetClassId(null, targets)).toBe("target-a");
  });

  it("năm sau không có lớp cùng nhánh thì rơi về phần tử đầu thay vì để trống", () => {
    expect(defaultTargetClassId("B", [{ id: "only", sectionCode: "A", displayName: "Ấu 2A" }])).toBe("only");
  });

  it("chưa có lớp đích nào thì trả chuỗi rỗng — ô chọn hiện 'Chọn lớp'", () => {
    expect(defaultTargetClassId("A", [])).toBe("");
  });
});
