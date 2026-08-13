import { describe, expect, it } from "vitest";
import {
  changedScoreCells,
  hasScoreCellChanged,
  readNoteInput,
  readScoreInput,
  type ScoreCellBaseline,
} from "@/features/assessments/score-diff";

/**
 * M07-A — nền của **TB-M07-01** (xóa được cột) và **TB-M07-03** (không mất điểm
 * của người khác). Xem `score-diff.ts` để biết vì sao ba lỗi khác nhau cùng có
 * gốc ở chỗ *"gửi cả roster kể cả ô trống"*.
 */
describe("assessment score diff", () => {
  it("ô rỗng là null, không phải 0 (AGENTS §8)", () => {
    expect(readScoreInput("")).toBeNull();
    expect(readScoreInput("   ")).toBeNull();
    expect(readScoreInput(null)).toBeNull();
    expect(readScoreInput("0")).toBe(0);
  });

  it("ghi chú rỗng và ghi chú chưa nhập là một", () => {
    expect(readNoteInput("")).toBeNull();
    expect(readNoteInput("   ")).toBeNull();
    expect(readNoteInput(" cần cố gắng ")).toBe("cần cố gắng");
  });

  it("KHÔNG gửi ô chưa từng có dòng mà người dùng cũng để trống — đây là nguồn dòng rác của F04", () => {
    const changed = changedScoreCells(
      [
        { enrollmentId: "e1", score: null, note: null },
        { enrollmentId: "e2", score: null, note: null },
      ],
      {},
    );
    expect(changed).toEqual([]);
  });

  it("gửi đúng ô vừa sửa, bỏ qua 49 ô còn nguyên", () => {
    const baselines: Record<string, ScoreCellBaseline> = {};
    const drafts = Array.from({ length: 50 }, (_, index) => {
      const enrollmentId = `e${index}`;
      baselines[enrollmentId] = { score: 7, note: null };
      return { enrollmentId, score: 7, note: null };
    });
    drafts[12] = { enrollmentId: "e12", score: 9.5, note: null };

    const changed = changedScoreCells(drafts, baselines);
    expect(changed).toEqual([{ enrollmentId: "e12", score: 9.5, note: null }]);
  });

  it("9 và 9.0 là CÙNG một điểm — không đánh dấu ô đã đổi", () => {
    expect(
      hasScoreCellChanged({ enrollmentId: "e1", score: readScoreInput("9.0"), note: null }, { score: 9, note: null }),
    ).toBe(false);
  });

  it("xóa một điểm đã có là một thay đổi thật, phải gửi lên", () => {
    expect(
      hasScoreCellChanged({ enrollmentId: "e1", score: null, note: null }, { score: 8, note: null }),
    ).toBe(true);
  });

  it("điểm 0 khác hẳn ô rỗng — cả hai chiều", () => {
    expect(hasScoreCellChanged({ enrollmentId: "e1", score: 0, note: null }, { score: null, note: null })).toBe(true);
    expect(hasScoreCellChanged({ enrollmentId: "e1", score: null, note: null }, { score: 0, note: null })).toBe(true);
  });

  it("chỉ đổi ghi chú cũng là thay đổi", () => {
    expect(
      hasScoreCellChanged({ enrollmentId: "e1", score: 8, note: "vắng buổi kiểm tra" }, { score: 8, note: null }),
    ).toBe(true);
  });

  it("ô mới nhập lần đầu (chưa có dòng trong cơ sở dữ liệu) được gửi lên", () => {
    expect(hasScoreCellChanged({ enrollmentId: "e1", score: 10, note: null }, undefined)).toBe(true);
  });

  it("giữ nguyên thứ tự roster để thông điệp đếm được đúng số ô", () => {
    const changed = changedScoreCells(
      [
        { enrollmentId: "e1", score: 9, note: null },
        { enrollmentId: "e2", score: 5, note: null },
        { enrollmentId: "e3", score: 6, note: null },
      ],
      { e2: { score: 5, note: null } },
    );
    expect(changed.map((cell) => cell.enrollmentId)).toEqual(["e1", "e3"]);
  });
});
