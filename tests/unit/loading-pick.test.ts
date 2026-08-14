import { describe, it, expect } from "vitest";
import { pickNextIndex } from "@/lib/loading/pick";

/** Chọn ngẫu nhiên không lặp liền kề — kế hoạch 17 §3.7. */
describe("pickNextIndex", () => {
  it("danh sách rỗng trả -1, một phần tử luôn trả 0", () => {
    expect(pickNextIndex(0, -1)).toBe(-1);
    expect(pickNextIndex(1, 0)).toBe(0);
  });

  it("KHÔNG BAO GIỜ trả lại chỉ số vừa dùng — quét đủ dải ngẫu nhiên", () => {
    for (const length of [2, 3, 4, 7]) {
      for (let previous = 0; previous < length; previous += 1) {
        for (let step = 0; step < 200; step += 1) {
          const next = pickNextIndex(length, previous, () => step / 200);
          expect(next).not.toBe(previous);
          expect(next).toBeGreaterThanOrEqual(0);
          expect(next).toBeLessThan(length);
        }
      }
    }
  });

  it("phủ hết mọi chỉ số còn lại, không bỏ sót cái nào", () => {
    const seen = new Set<number>();
    for (let step = 0; step < 300; step += 1) {
      seen.add(pickNextIndex(4, 2, () => step / 300));
    }
    expect([...seen].sort()).toEqual([0, 1, 3]);
  });

  it("lần đầu (chưa có gì trước đó) bốc trong toàn bộ danh sách", () => {
    expect(pickNextIndex(4, -1, () => 0)).toBe(0);
    expect(pickNextIndex(4, -1, () => 0.99)).toBe(3);
  });

  it("`random()` trả đúng 1 vẫn nằm trong dải — không tràn ra ngoài mảng", () => {
    expect(pickNextIndex(4, -1, () => 1)).toBe(3);
    expect(pickNextIndex(4, 1, () => 1)).toBe(3);
  });
});
