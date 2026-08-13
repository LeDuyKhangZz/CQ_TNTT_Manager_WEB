import { describe, expect, it } from "vitest";
import {
  buildChangePasswordUrl,
  buildLoginUrl,
  DEFAULT_AFTER_LOGIN_PATH,
  LOGIN_ERROR_BANNERS,
  LOGIN_ERROR_CODES,
  LOGIN_NOTICE_BANNERS,
  LOGIN_NOTICE_CODES,
  pathnameOfNext,
  resolveLoginBanner,
  resolveNextPath,
  sanitizeNextPath,
} from "@/lib/auth/login-redirect";
import type { AppRole } from "@/lib/permissions/roles";

/**
 * M14 A-04 — hợp đồng giữa guard và trang `/login`.
 * Phủ AC-F4, AC-F5, AC-F6 của `08_ACCEPTANCE_CRITERIA.md`.
 */

const active = (role: AppRole | null) => ({ accountStatus: "active" as const, role });

describe("sanitizeNextPath — hàng rào chống open redirect (AC-F5)", () => {
  it("giữ đường dẫn nội bộ, kể cả khi có query và neo", () => {
    expect(sanitizeNextPath("/reports")).toBe("/reports");
    expect(sanitizeNextPath("/reports?type=weekly")).toBe("/reports?type=weekly");
    expect(sanitizeNextPath("/students/abc#ho-so")).toBe("/students/abc#ho-so");
  });

  it("🔴 chặn mọi dạng dẫn ra ngoài miền", () => {
    for (const hostile of [
      "https://evil.example",
      "http://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "mailto:ai@do.vn",
    ]) {
      expect(sanitizeNextPath(hostile), `${hostile} phải bị chặn`).toBeNull();
    }
  });

  it("chặn ký tự điều khiển (chèn header vào Location)", () => {
    expect(sanitizeNextPath("/reports\nLocation: https://evil.example")).toBeNull();
    expect(sanitizeNextPath("/reports\r\nSet-Cookie: a=b")).toBeNull();
    expect(sanitizeNextPath("/reports\u0000")).toBeNull();
  });

  it("chặn giá trị rỗng và kiểu không phải chuỗi", () => {
    for (const empty of ["", "   ", undefined, null, 42, {}, ["/reports"]]) {
      expect(sanitizeNextPath(empty)).toBeNull();
    }
  });

  it("bỏ query và neo khi đối chiếu với ROUTE_RULES", () => {
    expect(pathnameOfNext("/reports?type=weekly")).toBe("/reports");
    expect(pathnameOfNext("/students/abc#tab")).toBe("/students/abc");
    expect(pathnameOfNext("/dashboard")).toBe("/dashboard");
  });
});

describe("resolveNextPath — next phải nằm trong quyền của chính người vừa đăng nhập", () => {
  it("giữ nguyên deep-link hợp lệ, kể cả phần query (AC-F4)", () => {
    expect(resolveNextPath(active("group_leader"), "/reports?type=weekly")).toBe(
      "/reports?type=weekly",
    );
    expect(resolveNextPath(active("super_admin"), "/admin")).toBe("/admin");
  });

  it("rơi về /dashboard khi next ngoài quyền — không đưa người dùng tới cửa rồi đóng sập", () => {
    expect(resolveNextPath(active("guardian"), "/imports")).toBe(DEFAULT_AFTER_LOGIN_PATH);
    expect(resolveNextPath(active("group_leader"), "/admin")).toBe(DEFAULT_AFTER_LOGIN_PATH);
    // A-11/A-03 cùng luật: ba vai trò chỉ đọc không có `/attendance`.
    expect(resolveNextPath(active("treasurer"), "/attendance")).toBe(DEFAULT_AFTER_LOGIN_PATH);
    expect(resolveNextPath(active("guardian"), "/student/attendance")).toBe(
      DEFAULT_AFTER_LOGIN_PATH,
    );
  });

  it("rơi về /dashboard với route không khai báo và với next thù địch", () => {
    expect(resolveNextPath(active("super_admin"), "/camps")).toBe(DEFAULT_AFTER_LOGIN_PATH);
    expect(resolveNextPath(active("super_admin"), "https://evil.example")).toBe(
      DEFAULT_AFTER_LOGIN_PATH,
    );
    expect(resolveNextPath(active("super_admin"), undefined)).toBe(DEFAULT_AFTER_LOGIN_PATH);
  });

  it("tài khoản không active không đi đâu được ngoài /dashboard", () => {
    expect(resolveNextPath({ accountStatus: "locked", role: "super_admin" }, "/admin")).toBe(
      DEFAULT_AFTER_LOGIN_PATH,
    );
    expect(resolveNextPath(null, "/reports")).toBe(DEFAULT_AFTER_LOGIN_PATH);
  });
});

describe("buildLoginUrl / buildChangePasswordUrl — guard không tự gõ chuỗi query", () => {
  it("dựng đúng URL cho từng loại tín hiệu", () => {
    expect(buildLoginUrl()).toBe("/login");
    expect(buildLoginUrl({ next: "/admin" })).toBe("/login?next=%2Fadmin");
    expect(buildLoginUrl({ error: "account_unavailable" })).toBe(
      "/login?error=account_unavailable",
    );
    expect(buildLoginUrl({ notice: "signed_out" })).toBe("/login?notice=signed_out");
  });

  it("next đi xuyên qua trạm đổi mật khẩu bắt buộc (F01 TO-BE §4)", () => {
    expect(buildChangePasswordUrl("/reports?type=weekly")).toBe(
      "/change-password?next=%2Freports%3Ftype%3Dweekly",
    );
    expect(buildChangePasswordUrl(undefined)).toBe("/change-password");
    expect(buildChangePasswordUrl("https://evil.example")).toBe("/change-password");
  });

  it("🔴 không tự trỏ về chính mình — nếu không là vòng lặp chuyển hướng", () => {
    expect(buildChangePasswordUrl("/change-password")).toBe("/change-password");
    expect(buildChangePasswordUrl("/change-password?next=%2Fadmin")).toBe("/change-password");
  });
});

describe("resolveLoginBanner — mọi mã phát ra đều có phía nhận (AC-F6)", () => {
  it("🔴 mỗi mã khai báo đều có sẵn câu chữ, không mã nào là tín hiệu câm", () => {
    for (const code of LOGIN_ERROR_CODES) {
      expect(LOGIN_ERROR_BANNERS[code]?.title, code).toBeTruthy();
      expect(resolveLoginBanner({ error: code })).toBe(LOGIN_ERROR_BANNERS[code]);
    }
    for (const code of LOGIN_NOTICE_CODES) {
      expect(LOGIN_NOTICE_BANNERS[code]?.title, code).toBeTruthy();
      expect(resolveLoginBanner({ notice: code })).toBe(LOGIN_NOTICE_BANNERS[code]);
    }
  });

  it("tài khoản bị khoá được giải thích bằng lời và cắt ngang trình đọc màn hình", () => {
    const banner = resolveLoginBanner({ error: "account_unavailable" });
    expect(banner?.role).toBe("alert");
    expect(banner?.tone).toBe("warning");
    expect(banner?.title).toContain("khóa");
  });

  it("xác nhận đăng xuất KHÔNG cắt ngang lời đang đọc", () => {
    expect(resolveLoginBanner({ notice: "signed_out" })?.role).toBe("status");
  });

  it("mã lạ từ thanh địa chỉ bị bỏ qua, không in lại giá trị thô", () => {
    expect(resolveLoginBanner({ error: "<script>alert(1)</script>" })).toBeNull();
    expect(resolveLoginBanner({ notice: "khong-co-that" })).toBeNull();
    expect(resolveLoginBanner({})).toBeNull();
  });

  it("lỗi được ưu tiên hơn xác nhận khi có cả hai", () => {
    expect(resolveLoginBanner({ error: "account_unavailable", notice: "signed_out" })).toBe(
      LOGIN_ERROR_BANNERS.account_unavailable,
    );
  });
});
