import { describe, expect, it } from "vitest";
import {
  buildStudentQuery,
  clampStudentPage,
  DEFAULT_STUDENT_STATUS_FILTER,
  foldSearchTerm,
  hasActiveStudentFilter,
  parseStudentCriteria,
  parseStudentPage,
  parseStudentStatusFilter,
  searchDigits,
  studentListHref,
  STUDENT_PAGE_SIZE,
} from "@/features/students/student-directory";

/**
 * TB-F03 — tìm kiếm, lọc, phân trang trên `/students` (đóng M03-F03).
 *
 * Mọi thứ ở đây đọc từ **thanh địa chỉ**, tức là bất kỳ ai cũng sửa được. Nhóm
 * bài "tham số rác" không phải chuyện lịch sự mà là `AGENTS` §5: *"Invalid UUID
 * trả 404/validation error, không 500"*.
 */

const UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("đọc tham số từ thanh địa chỉ", () => {
  it("không có tham số nào ⇒ trang 1, chỉ em đang sinh hoạt", () => {
    const criteria = parseStudentCriteria({});
    expect(criteria).toEqual({
      search: "",
      sectorId: "all",
      classId: "all",
      status: DEFAULT_STUDENT_STATUS_FILTER,
      page: 1,
    });
    expect(hasActiveStudentFilter(criteria)).toBe(false);
  });

  it("nhận UUID thật cho ngành và lớp", () => {
    const criteria = parseStudentCriteria({ sector: UUID, class: UUID });
    expect(criteria.sectorId).toBe(UUID);
    expect(criteria.classId).toBe(UUID);
  });

  it("`class=none` là bộ lọc thật — em CHƯA xếp lớp", () => {
    expect(parseStudentCriteria({ class: "none" }).classId).toBe("none");
  });

  it("`sector=none` KHÔNG hợp lệ: em chưa xếp lớp thì cũng chưa có ngành", () => {
    expect(parseStudentCriteria({ sector: "none" }).sectorId).toBe("all");
  });

  it("🔴 UUID rác rơi về `all` chứ không đi thẳng vào truy vấn", () => {
    // `eq("sector_id", "'; drop")` cho PostgREST một lỗi 22P02 và trang 500 —
    // trên một tham số mà ai cũng sửa được từ thanh địa chỉ.
    expect(parseStudentCriteria({ sector: "'; drop table students" }).sectorId).toBe("all");
    expect(parseStudentCriteria({ class: "12345" }).classId).toBe("all");
  });

  it("trạng thái lạ rơi về mặc định", () => {
    expect(parseStudentStatusFilter("khong-co-that")).toBe(DEFAULT_STUDENT_STATUS_FILTER);
    expect(parseStudentStatusFilter(undefined)).toBe(DEFAULT_STUDENT_STATUS_FILTER);
    expect(parseStudentStatusFilter("archived")).toBe("archived");
  });

  it("số trang âm, chữ, hoặc rỗng đều về trang 1", () => {
    expect(parseStudentPage("-3")).toBe(1);
    expect(parseStudentPage("abc")).toBe(1);
    expect(parseStudentPage(undefined)).toBe(1);
    expect(parseStudentPage("4")).toBe(4);
  });

  it("tham số lặp (`?q=a&q=b`) lấy giá trị đầu, không ghép thành mảng", () => {
    expect(parseStudentCriteria({ q: ["tran", "ngoc"] }).search).toBe("tran");
  });
});

describe("D-126 · tìm không dấu", () => {
  it("bỏ dấu và hạ chữ thường đúng luật của cột `search_name`", () => {
    expect(foldSearchTerm("Trần Ngọc Hiếu")).toBe("tran ngoc hieu");
    expect(foldSearchTerm("  ĐÀO   Thị  Ánh ")).toBe("dao thi anh");
  });

  it("chỉ giữ chữ số khi tìm theo số điện thoại", () => {
    expect(searchDigits("0901 234 567")).toBe("0901234567");
    expect(searchDigits("tran ngoc")).toBe("");
  });

  it("dựng truy vấn: khoảng trang khớp cỡ trang", () => {
    const plan = buildStudentQuery(parseStudentCriteria({ page: "3" }));
    expect(plan.from).toBe(2 * STUDENT_PAGE_SIZE);
    expect(plan.to).toBe(3 * STUDENT_PAGE_SIZE - 1);
  });

  it("gõ tên thì không kèm nhánh số điện thoại (nếu không nó khớp mọi số)", () => {
    expect(buildStudentQuery(parseStudentCriteria({ q: "tran" })).phoneDigits).toBe("");
  });
});

describe("trang vượt quá tổng số", () => {
  it("kéo về trang cuối thay vì hiện một trang trống", () => {
    // Xoá bớt vài em rồi bấm lại dấu trang cũ `?page=40` là chuyện có thật;
    // một trang trống không giải thích đọc như "hồ sơ đã biến mất".
    expect(clampStudentPage(40, 25)).toBe(2);
    expect(clampStudentPage(1, 0)).toBe(1);
    expect(clampStudentPage(2, STUDENT_PAGE_SIZE)).toBe(1);
  });
});

describe("đường dẫn giữ nguyên bộ lọc khi đổi trang", () => {
  it("không lọc gì thì đường dẫn sạch", () => {
    expect(studentListHref(parseStudentCriteria({}), 1)).toBe("/students");
  });

  it("giữ đủ tìm kiếm, ngành, lớp, trạng thái và trang", () => {
    const criteria = parseStudentCriteria({ q: "tran", class: UUID, status: "all" });
    const href = studentListHref(criteria, 2);
    expect(href).toContain("q=tran");
    expect(href).toContain(`class=${UUID}`);
    expect(href).toContain("status=all");
    expect(href).toContain("page=2");
  });

  it("trang 1 không kèm `page=1` — đường dẫn chép ra phải gọn", () => {
    expect(studentListHref(parseStudentCriteria({ q: "tran" }), 1)).toBe("/students?q=tran");
  });
});

describe("có đang lọc hay không — quyết định câu của trạng thái rỗng", () => {
  it("đổi trạng thái khỏi mặc định cũng là đang lọc", () => {
    expect(hasActiveStudentFilter(parseStudentCriteria({ status: "archived" }))).toBe(true);
  });

  it("chỉ đổi trang thì KHÔNG phải đang lọc", () => {
    expect(hasActiveStudentFilter(parseStudentCriteria({ page: "2" }))).toBe(false);
  });
});
