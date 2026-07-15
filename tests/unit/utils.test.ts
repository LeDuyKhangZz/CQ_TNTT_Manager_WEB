import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("gộp các class name", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("class Tailwind xung đột thì class sau thắng", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("bỏ qua giá trị falsy", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
