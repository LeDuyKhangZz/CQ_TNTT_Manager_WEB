// @vitest-environment node
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { accountNavigationItem, platformNavigation } from "@/config/navigation";
import { NOTIFICATION_LINK_ROUTES } from "@/features/notifications/constants";

const DASHBOARD_ROOT = path.resolve(process.cwd(), "src/app/(dashboard)");
const entryRoutes = new Set([
  ...platformNavigation.map((item) => item.href),
  accountNavigationItem.href,
  ...NOTIFICATION_LINK_ROUTES,
]);

function pageFileFor(href: string): string {
  return path.join(DASHBOARD_ROOT, ...href.split("/").filter(Boolean), "page.tsx");
}

function dashboardPageRoutes(directory = DASHBOARD_ROOT): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...dashboardPageRoutes(absolute));
    if (entry.isFile() && entry.name === "page.tsx") {
      const relativeDirectory = path.relative(DASHBOARD_ROOT, directory).replaceAll("\\", "/");
      routes.push(`/${relativeDirectory}`);
    }
  }
  return routes;
}

describe("M13-C — route đặc tả, điều hướng và mã nguồn không lệch nhau", () => {
  it("mọi href cấp cao trong navigation đều có page.tsx thật", () => {
    for (const item of [...platformNavigation, accountNavigationItem]) {
      expect(existsSync(pageFileFor(item.href)), `${item.href} thiếu page.tsx`).toBe(true);
    }
  });

  it("mọi deep-link thông báo được cho phép đều có page.tsx thật", () => {
    for (const href of NOTIFICATION_LINK_ROUTES) {
      expect(existsSync(pageFileFor(href)), `${href} trong allowlist nhưng thiếu page.tsx`).toBe(true);
    }
  });

  it("mọi trang trong dashboard có một lối vào cấp cha, trừ trang hệ thống access-denied", () => {
    for (const route of dashboardPageRoutes()) {
      if (route === "/access-denied") continue;
      const isReachable = [...entryRoutes].some(
        (entry) => route === entry || route.startsWith(`${entry}/`),
      );
      expect(isReachable, `${route} không có navigation/deep-link cấp cha`).toBe(true);
    }
  });
});
