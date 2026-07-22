import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NOTIFICATION_LINK_ROUTES, isKnownNotificationLink } from "@/features/notifications/constants";
import { publishNotificationSchema } from "@/features/notifications/schemas";

describe("notification link allowlist", () => {
  it("chấp nhận route đã có và route con của nó", () => {
    expect(isKnownNotificationLink(null)).toBe(true);
    expect(isKnownNotificationLink("/attendance")).toBe(true);
    expect(isKnownNotificationLink("/committees/11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("từ chối deep-link tới route chưa tồn tại (AGENTS §8)", () => {
    expect(isKnownNotificationLink("/sa-mac")).toBe(false);
    expect(isKnownNotificationLink("https://example.com")).toBe(false);
    expect(isKnownNotificationLink("/attendancex")).toBe(false);
  });

  it("danh sách route ở TypeScript khớp với CHECK ở migration", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/20260723000400_notifications.sql"),
      "utf8",
    );
    const block = migration.slice(
      migration.indexOf("unnest(array["),
      migration.indexOf("]) as known(route)"),
    );
    for (const route of NOTIFICATION_LINK_ROUTES) {
      expect(block, `route ${route} phải có trong migration`).toContain(`'${route}'`);
    }
    const routesInSql = block.match(/'\/[^']+'/g) ?? [];
    expect(routesInSql).toHaveLength(NOTIFICATION_LINK_ROUTES.length);
  });
});

describe("publishNotificationSchema", () => {
  const base = { title: "Thông báo", content: "Nội dung" };
  const targetId = "11111111-1111-4111-8111-111111111111";

  it("bắt buộc chọn đối tượng với phạm vi ngành/lớp/Ban/người", () => {
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "class" }).success).toBe(false);
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "class", targetId }).success).toBe(true);
  });

  it("phạm vi nhóm cố định không được kèm đối tượng", () => {
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "all" }).success).toBe(true);
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "all", targetId }).success).toBe(false);
  });

  it("chặn deep-link lạ ngay ở tầng schema", () => {
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "all", linkPath: "/sa-mac" }).success).toBe(false);
    expect(publishNotificationSchema.safeParse({ ...base, targetType: "all", linkPath: "/results" }).success).toBe(true);
  });
});
