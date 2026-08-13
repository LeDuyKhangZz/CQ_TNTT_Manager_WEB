import { describe, expect, it } from "vitest";
import {
  CLASS_STATUS_LABELS,
  classStatusBadgeVariant,
  classStatusLabel,
  isPastSemester1,
  needsStatusBadge,
  semester1Notice,
} from "@/features/classes/class-status";

/** Định dạng giả, đủ để kiểm câu chữ mà không kéo `date-fns-tz` vào bài test. */
const formatDate = (value: string) => value.split("-").reverse().join("/");

describe("nhãn trạng thái lớp", () => {
  it("dịch cả ba trạng thái của enum sang tiếng Việt", () => {
    expect(classStatusLabel("active")).toBe("Đang hoạt động");
    expect(classStatusLabel("inactive")).toBe("Tạm ngưng");
    expect(classStatusLabel("closed")).toBe("Đã đóng");
    expect(Object.keys(CLASS_STATUS_LABELS)).toHaveLength(3);
  });

  it("giá trị lạ trả nguyên văn thay vì bịa một nhãn", () => {
    expect(classStatusLabel("suspended")).toBe("suspended");
  });
});

describe("huy hiệu trạng thái ở /classes (BR-M02-N12)", () => {
  it("KHÔNG gắn huy hiệu cho lớp đang hoạt động", () => {
    // 19/19 lớp đều `active` là chuyện thường ngày. Gắn hết thì huy hiệu mất giá
    // trị báo hiệu đúng lúc cần nó nhất.
    expect(needsStatusBadge("active")).toBe(false);
  });

  it("gắn huy hiệu cho lớp tạm ngưng và lớp đã đóng", () => {
    expect(needsStatusBadge("inactive")).toBe(true);
    expect(needsStatusBadge("closed")).toBe(true);
  });

  it("mỗi trạng thái một variant riêng — nhưng nhãn vẫn là chữ, không phải màu suông", () => {
    expect(classStatusBadgeVariant("active")).toBe("success");
    expect(classStatusBadgeVariant("inactive")).toBe("warning");
    expect(classStatusBadgeVariant("closed")).toBe("secondary");
  });
});

/**
 * **D-71 / D-115** — mốc kết thúc học kỳ 1.
 *
 * Bài quan trọng nhất là bài `null`: **chưa khai báo mốc thì không được cảnh báo**.
 * D-116 cho phép để trống, nên nếu hàm này coi `null` là "đã qua mốc" thì mọi lớp Dự
 * trưởng ở mọi năm học chưa điền mốc sẽ mang một cảnh báo bịa.
 */
describe("đã qua mốc học kỳ 1 chưa", () => {
  it("chưa khai báo mốc ⇒ không cảnh báo", () => {
    expect(isPastSemester1(null, "2027-03-01")).toBe(false);
    expect(isPastSemester1(undefined, "2027-03-01")).toBe(false);
    expect(isPastSemester1("", "2027-03-01")).toBe(false);
  });

  it("trước mốc ⇒ chưa qua", () => {
    expect(isPastSemester1("2027-01-15", "2027-01-14")).toBe(false);
  });

  it("đúng ngày mốc ⇒ CHƯA qua — hôm đó vẫn là học kỳ 1", () => {
    expect(isPastSemester1("2027-01-15", "2027-01-15")).toBe(false);
  });

  it("sau mốc ⇒ đã qua", () => {
    expect(isPastSemester1("2027-01-15", "2027-01-16")).toBe(true);
  });

  it("so sánh đúng qua mốc giao năm (chuỗi yyyy-MM-dd xếp theo thời gian)", () => {
    expect(isPastSemester1("2026-12-31", "2027-01-01")).toBe(true);
    expect(isPastSemester1("2027-01-01", "2026-12-31")).toBe(false);
  });
});

describe("câu cảnh báo lớp Dự trưởng (D-115)", () => {
  it("không có câu nào khi chưa qua mốc", () => {
    expect(semester1Notice("2027-01-15", "2027-01-15", formatDate)).toBeNull();
    expect(semester1Notice(null, "2027-06-01", formatDate)).toBeNull();
  });

  it("nêu mốc bằng ngày định dạng Việt Nam", () => {
    const notice = semester1Notice("2027-01-15", "2027-02-01", formatDate);
    expect(notice?.title).toContain("15/01/2027");
  });

  it("nói rõ hệ thống KHÔNG tự đóng lớp và chỉ đường tới nơi quyết định", () => {
    // D-115 là quyết định "chỉ cảnh báo". Câu chữ phải nói ra điều đó, nếu không
    // người dùng chờ hệ thống tự xử lý rồi không ai đóng lớp cả.
    const notice = semester1Notice("2027-01-15", "2027-02-01", formatDate);
    expect(notice?.detail).toContain("không tự đóng lớp");
    expect(notice?.detail).toContain("Cài đặt lớp");
  });
});
