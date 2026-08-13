import { describe, expect, it } from "vitest";
import {
  describeCompleteSacraments,
  describeMissingSacraments,
  isSacramentReviewRequired,
  missingReviewNoteMessage,
  missingSacramentsOf,
  requiresReviewNote,
} from "@/features/promotions/sacrament-warning";

/**
 * M08-B — **D-156/D-161, AC-16 · AC-17, BR-M08-17 · BR-M08-18.**
 *
 * `03_AUDIT_RESULTS` §4.2 truy gốc rễ của lỗi này là *"cột cờ được seed nhưng
 * không có consumer"*: `grade_levels.requires_sacrament_review` nằm trong cơ sở
 * dữ liệu từ Phase 2 và **không chỗ nào trong `src/` đọc nó**. Bộ test dưới đây
 * canh phần tầng ứng dụng của luật ấy; phần luật *"lớp nào xét bí tích nào"* đo ở
 * pgTAP `046` vì nó sống trong cơ sở dữ liệu.
 *
 * 🔴 Điều được canh kỹ nhất là **ca khoá VẮNG**. Nó xảy ra ở hai tình huống khác
 * hẳn nhau — lớp không phải cấp cuối ngành (AC-17), và đề xuất tạo trước M08-B
 * (`07_IMPLEMENTATION_IMPACT` §2.5) — và cả hai đều **không** được biến thành một
 * cảnh báo, cũng không được làm sập màn hình.
 */

describe("khoá bí tích vắng", () => {
  it("AC-17 — lớp không phải cấp cuối ngành: không cờ, không danh sách, không bắt buộc ý kiến", () => {
    const snapshot = { weightedAverage: 8.4, warnLowRate: true };
    expect(isSacramentReviewRequired(snapshot)).toBe(false);
    expect(missingSacramentsOf(snapshot)).toEqual([]);
    expect(describeMissingSacraments(snapshot)).toBeNull();
    expect(describeCompleteSacraments(snapshot)).toBeNull();
    expect(requiresReviewNote(snapshot)).toBe(false);
  });

  it("snapshot cũ tạo trước M08-B đi qua y hệt, không ném lỗi", () => {
    expect(requiresReviewNote({})).toBe(false);
    expect(requiresReviewNote(null)).toBe(false);
    expect(requiresReviewNote(undefined)).toBe(false);
    expect(missingSacramentsOf(null)).toEqual([]);
  });

  it("cờ bật mà danh sách hỏng kiểu vẫn không làm sập màn hình", () => {
    const snapshot = {
      sacramentReviewRequired: true,
      missingSacraments: ["confirmation", 7, null] as unknown as string[],
    };
    expect(missingSacramentsOf(snapshot)).toEqual(["confirmation"]);
  });
});

describe("AC-16 — lớp cuối ngành thiếu bí tích", () => {
  const missing = {
    sacramentReviewRequired: true,
    requiredSacraments: ["first_confession", "first_communion"],
    missingSacraments: ["first_confession", "first_communion"],
  };

  it("liệt kê bí tích còn thiếu BẰNG TÊN, không phải bằng một con số", () => {
    const text = describeMissingSacraments(missing);
    expect(text).toContain("Xưng tội lần đầu");
    expect(text).toContain("Rước lễ lần đầu");
    expect(text).not.toContain("2 bí tích");
  });

  it("BR-M08-18 — bắt buộc nêu ý kiến, và câu lỗi nói rõ cảnh báo KHÔNG chặn lên lớp", () => {
    expect(requiresReviewNote(missing)).toBe(true);
    const message = missingReviewNoteMessage(missing);
    expect(message).toContain("Xưng tội lần đầu");
    expect(message).toContain("không chặn");
  });

  it("không có câu 'đã đủ bí tích' khi vẫn còn thiếu", () => {
    expect(describeCompleteSacraments(missing)).toBeNull();
  });
});

describe("lớp cuối ngành mà em đã đủ bí tích", () => {
  const complete = {
    sacramentReviewRequired: true,
    requiredSacraments: ["confirmation"],
    missingSacraments: [],
  };

  it("khẳng định là đủ — cờ bật KHÔNG phải điều kiện bắt buộc ý kiến, danh sách thiếu mới là", () => {
    expect(isSacramentReviewRequired(complete)).toBe(true);
    expect(requiresReviewNote(complete)).toBe(false);
    expect(describeMissingSacraments(complete)).toBeNull();
    expect(describeCompleteSacraments(complete)).toContain("đã có đủ bí tích");
  });
});
