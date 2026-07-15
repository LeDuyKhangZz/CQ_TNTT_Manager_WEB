import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema, provisionAccountSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("yêu cầu username và password", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("chấp nhận thông tin đăng nhập ở mức schema giao diện", () => {
    expect(loginSchema.safeParse({ username: "GLV023", password: "matkhau" }).success).toBe(true);
  });

  it("requires the right scope for sector and class roles", () => {
    const base = {
      username: "GLV001",
      displayName: "Anrê Nguyễn Văn A",
      startsOn: "2026-09-01",
    };
    expect(provisionAccountSchema.safeParse({ ...base, role: "sector_leader" }).success).toBe(false);
    expect(provisionAccountSchema.safeParse({
      ...base,
      role: "sector_leader",
      academicYearId: "00000000-0000-4000-8000-000000000001",
      sectorId: "00000000-0000-4000-8000-000000000002",
    }).success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("chấp nhận mật khẩu 8 ký tự gồm chữ thường và số", () => {
    expect(changePasswordSchema.safeParse({ password: "matkhau1", confirmPassword: "matkhau1" }).success).toBe(true);
  });

  it("từ chối mật khẩu ngắn hoặc xác nhận không khớp", () => {
    expect(changePasswordSchema.safeParse({ password: "abc123", confirmPassword: "abc123" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "matkhau1", confirmPassword: "matkhau2" }).success).toBe(false);
  });
});
