import { describe, it, expect } from "vitest";
import { formatDateVi, formatDateTimeVi } from "@/lib/dates";

describe("formatDateVi", () => {
  it("định dạng mốc UTC theo giờ Asia/Ho_Chi_Minh (UTC+7)", () => {
    // 2026-08-31T18:00:00Z -> 01/09/2026 lúc 01:00 giờ VN
    expect(formatDateVi("2026-08-31T18:00:00Z")).toBe("01/09/2026");
  });

  it("định dạng ngày giờ dd/MM/yyyy HH:mm", () => {
    expect(formatDateTimeVi("2026-08-31T18:00:00Z")).toBe("01/09/2026 01:00");
  });
});
