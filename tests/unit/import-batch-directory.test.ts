import { describe, expect, it } from "vitest";
import {
  BATCH_PAGE_SIZE,
  BATCH_ROW_PAGE_SIZE,
  BULK_GENDER_FIELD,
  batchListHref,
  batchRowsHref,
  clampPage,
  CONFIRM_ROW_FIELD,
  hasActiveBatchFilter,
  hasActiveRowFilter,
  parseBatchListCriteria,
  parseBatchRowCriteria,
  parsePage,
  readRowEdits,
  ROW_FIELD_PREFIX,
} from "@/features/imports/batch-directory";

/**
 * M12-B — luật đọc tham số của trang nhập Excel (**TO-BE 7 / AC-25**) và luật
 * đọc biểu mẫu sửa hàng loạt (**TO-BE 4 / AC-21**).
 *
 * Tất cả tham số ở đây đến từ **thanh địa chỉ** hoặc từ **tên trường biểu mẫu**,
 * tức từ nơi người dùng sửa được. Đó là lý do file này tồn tại: một chuỗi rác
 * lọt qua sẽ thành `.eq()` với giá trị không phải UUID và cho trang **500**
 * (`AGENTS` §5 cấm), còn một tiền tố tên trường gõ nhầm thì **không lỗi gì cả** —
 * biểu mẫu vẫn gửi, máy chủ vẫn trả "đã lưu 0 dòng", và không ai biết vì sao.
 */
const BATCH_ID = "11111111-1111-4111-8111-111111111111";
const ROW_A = "22222222-2222-4222-8222-222222222222";
const ROW_B = "33333333-3333-4333-8333-333333333333";

describe("đọc tham số lọc dòng", () => {
  it("không có tham số nào thì xem tất cả, trang 1", () => {
    expect(parseBatchRowCriteria({})).toEqual({ status: "all", page: 1 });
  });

  it("trạng thái lạ rơi về 'tất cả' thay vì đi thẳng vào câu truy vấn", () => {
    expect(parseBatchRowCriteria({ status: "'; drop table" }).status).toBe("all");
    expect(parseBatchRowCriteria({ status: "committed" }).status).toBe("committed");
  });

  it("số trang âm, số 0 và chữ đều rơi về trang 1", () => {
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("hai")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("7")).toBe(7);
  });

  it("tham số lặp lại (?status=a&status=b) chỉ lấy giá trị đầu", () => {
    expect(parseBatchRowCriteria({ status: ["error", "valid"] }).status).toBe("error");
  });
});

describe("đọc tham số danh sách lần nhập", () => {
  it("mặc định là năm học hiện hành — D-135", () => {
    expect(parseBatchListCriteria({})).toEqual({ status: "all", yearId: "current", page: 1 });
  });

  it("'all' và một UUID thật đều nhận; chuỗi rác rơi về mặc định", () => {
    expect(parseBatchListCriteria({ year: "all" }).yearId).toBe("all");
    expect(parseBatchListCriteria({ year: BATCH_ID }).yearId).toBe(BATCH_ID);
    expect(parseBatchListCriteria({ year: "nam-ngoai" }).yearId).toBe("current");
  });

  it("biết khi nào đang lọc — quyết định trạng thái rỗng nói câu gì", () => {
    expect(hasActiveBatchFilter(parseBatchListCriteria({}))).toBe(false);
    expect(hasActiveBatchFilter(parseBatchListCriteria({ year: "all" }))).toBe(true);
    expect(hasActiveRowFilter(parseBatchRowCriteria({}))).toBe(false);
    expect(hasActiveRowFilter(parseBatchRowCriteria({ status: "error" }))).toBe(true);
  });
});

describe("đường dẫn giữ nguyên bộ lọc khi sang trang", () => {
  it("mặc định thì đường dẫn sạch, không rải tham số thừa", () => {
    expect(batchRowsHref(BATCH_ID, { status: "all", page: 1 }, 1)).toBe(`/imports/${BATCH_ID}`);
    expect(batchListHref({ status: "all", yearId: "current", page: 1 }, 1)).toBe("/imports");
  });

  it("đang lọc thì sang trang vẫn giữ đúng bộ lọc", () => {
    expect(batchRowsHref(BATCH_ID, { status: "error", page: 1 }, 3)).toBe(
      `/imports/${BATCH_ID}?status=error&page=3`,
    );
    expect(batchListHref({ status: "cancelled", yearId: "all", page: 2 }, 2)).toBe(
      "/imports?status=cancelled&year=all&page=2",
    );
  });
});

describe("kéo số trang vượt quá về trang cuối", () => {
  it("dấu trang cũ ?page=40 sau khi lọc lại không cho một trang trống", () => {
    expect(clampPage(40, 120, BATCH_ROW_PAGE_SIZE)).toBe(3);
    expect(clampPage(1, 0, BATCH_PAGE_SIZE)).toBe(1);
    expect(clampPage(2, 120, BATCH_ROW_PAGE_SIZE)).toBe(2);
  });
});

/**
 * 🔴 Phần quan trọng nhất của file: hợp đồng giữa biểu mẫu và Server Action.
 * Một biểu mẫu mang **cả trang dòng**, nên tên trường phải gắn id dòng vào —
 * và đây là chỗ duy nhất luật ấy được viết ra một lần cho cả hai bên.
 */
describe("đọc biểu mẫu sửa hàng loạt", () => {
  function formOf(pairs: [string, string][]) {
    const data = new FormData();
    for (const [key, value] of pairs) data.append(key, value);
    return data;
  }

  it("gom đúng giới tính, cách xử lý và ô đánh dấu về từng dòng", () => {
    const entries = readRowEdits(
      formOf([
        ["batchId", BATCH_ID],
        [`${ROW_FIELD_PREFIX.gender}${ROW_A}`, "male"],
        [`${ROW_FIELD_PREFIX.action}${ROW_A}`, "merge"],
        [`${ROW_FIELD_PREFIX.pick}${ROW_A}`, "on"],
        [`${ROW_FIELD_PREFIX.gender}${ROW_B}`, "female"],
      ]),
    );

    expect(entries).toHaveLength(2);
    expect(entries.find((entry) => entry.rowId === ROW_A)).toEqual({
      rowId: ROW_A,
      gender: "male",
      action: "merge",
      picked: true,
    });
    expect(entries.find((entry) => entry.rowId === ROW_B)).toEqual({
      rowId: ROW_B,
      gender: "female",
      action: null,
      picked: false,
    });
  });

  it("🔴 '— Chọn —' là CHƯA CHỌN, không phải một giá trị", () => {
    const entries = readRowEdits(formOf([[`${ROW_FIELD_PREFIX.gender}${ROW_A}`, ""]]));
    // Dòng vẫn có mặt (nó nằm trên trang), nhưng không mang quyết định nào —
    // nếu chuỗi rỗng lọt xuống thì Zod sẽ chặn và cả lượt lưu hỏng vì một dòng
    // mà người dùng đơn giản là chưa đụng tới.
    expect(entries).toEqual([{ rowId: ROW_A, gender: null, action: null, picked: false }]);
  });

  it("trường không thuộc ba tiền tố bị bỏ qua, kể cả trường ẩn của biểu mẫu", () => {
    const entries = readRowEdits(
      formOf([
        ["batchId", BATCH_ID],
        [CONFIRM_ROW_FIELD, ROW_A],
        [BULK_GENDER_FIELD, "male"],
      ]),
    );
    expect(entries).toEqual([]);
  });
});
