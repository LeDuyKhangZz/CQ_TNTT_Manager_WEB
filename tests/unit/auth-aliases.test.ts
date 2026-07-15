import { describe, expect, it } from "vitest";
import { deriveLoginAlias, normalizeVietnamesePhone } from "@/features/auth/aliases";

describe("internal auth aliases", () => {
  it("derives student and staff aliases case-insensitively", () => {
    expect(deriveLoginAlias("cq0123", "choquan.internal")?.email).toBe("cq0123@students.choquan.internal");
    expect(deriveLoginAlias("glv023", "choquan.internal")?.email).toBe("glv023@staff.choquan.internal");
  });

  it("normalizes Vietnamese guardian phones", () => {
    expect(normalizeVietnamesePhone("090 123 4567")).toBe("84901234567");
    expect(deriveLoginAlias("0901234567", "choquan.internal")?.email).toBe("84901234567@guardians.choquan.internal");
  });

  it("uses a separate namespace for short admin accounts", () => {
    expect(deriveLoginAlias("Khang.Nho", "choquan.internal")).toEqual({
      normalizedUsername: "KHANG.NHO",
      email: "khang.nho@accounts.choquan.internal",
      kind: "account",
    });
  });

  it("rejects malformed usernames", () => {
    expect(deriveLoginAlias("@@", "choquan.internal")).toBeNull();
  });
});
