import { describe, it, expect } from "vitest";
import {
  AppError,
  APP_ERROR_CODES,
  APP_ERROR_MESSAGES_VI,
  getErrorMessageVi,
} from "@/lib/errors";

describe("AppError", () => {
  it("dùng thông điệp tiếng Việt mặc định theo mã", () => {
    const err = new AppError("FORBIDDEN");
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe(APP_ERROR_MESSAGES_VI.FORBIDDEN);
    expect(err.name).toBe("AppError");
  });

  it("cho phép truyền message tùy chỉnh", () => {
    const err = new AppError("VALIDATION_ERROR", "Sai định dạng số điện thoại");
    expect(err.message).toBe("Sai định dạng số điện thoại");
  });

  it("mọi mã lỗi đều có thông điệp tiếng Việt", () => {
    for (const code of APP_ERROR_CODES) {
      expect(getErrorMessageVi(code).length).toBeGreaterThan(0);
    }
  });
});
