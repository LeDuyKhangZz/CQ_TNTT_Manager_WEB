import { createRequire } from "node:module";
import path from "node:path";
import { buildSync } from "esbuild";
import { expect, test } from "@playwright/test";
import type { DashboardData } from "../../src/features/dashboard/server/queries";

// Render the real component with synthetic names and the application's compiled
// CSS. This isolates layout from the date-dependent 30-day list, without writing
// student records or relying on birthdays in the development database.
const names = ["An", "Giuse Trần Minh Tuấn", "Phanxicô Xaviê Nguyễn Hoàng Thiên Phúc Bình An"];
function fixture(count: number): DashboardData {
  const data: DashboardData = {
    audience: "staff", aggregateOnly: false, canOpenAdmin: false, hasLoadError: false,
    kpis: { academicYearCode: "2026-2027", studentCount: 30, staffCount: 4, classCount: 1,
      massRate: null, catechismRate: null, warnedStudentCount: 0, lastSessionDate: null },
    atRisk: [], upcoming: [], incompleteProfileCount: 0, committeeTasks: [], latestNotifications: [],
    celebrations: Array.from({ length: count }, (_, index) => ({
      studentId: `layout-${index}`, displayName: names[index % names.length],
      kind: index % 2 === 0 ? "birthday" : "patron_feast", nextOccurrence: "2026-10-15",
    })),
  };
  return data;
}

test("celebration names and dates follow one layout at every viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "One geometry sweep covers all viewport widths.");
  // Playwright's JSX transform creates component-test descriptors. Compile this
  // SSR fixture with the React transform so the actual product JSX is rendered.
  const compiled = testInfo.outputPath("dashboard-fixture.cjs");
  buildSync({
    stdin: { contents: `
      import { createElement } from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { DashboardOverview } from './src/features/dashboard/components/dashboard-overview';
      import { PageContainer } from './src/components/layout/page-container';
      export const renderFixture = (data) => renderToStaticMarkup(createElement(PageContainer, null, createElement(DashboardOverview, { data })));
    `, resolveDir: process.cwd() },
    outfile: compiled, bundle: true, platform: "node", format: "cjs", packages: "external", jsx: "automatic",
    alias: { "@": path.resolve("src") },
  });
  const { renderFixture } = createRequire(path.resolve("package.json"))(compiled) as { renderFixture: (data: DashboardData) => string };
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  for (const width of [360, 375, 390, 430, 639, 640, 768, 1024, 1366, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(markup => {
      document.body.innerHTML = `<main>${markup}</main>`;
    }, renderFixture(fixture(5)));
    await page.evaluate(() => document.fonts.ready);
    const list = page.getByRole("region", { name: "Sinh nhật và bổn mạng", exact: true });
    const geometry = await list.getByRole("listitem").evaluateAll(rows => rows.map(row => {
      const [name, detail] = Array.from(row.children).map(node => node.getBoundingClientRect());
      return { nameBottom: name.bottom, nameTop: name.top, nameLeft: name.left, detailTop: detail.top,
        detailLeft: detail.left, detailRight: detail.right };
    }));
    for (const row of geometry) {
      if (width < 640) {
        expect(row.detailTop, `${width}px: date must be below every name`).toBeGreaterThanOrEqual(row.nameBottom);
        expect(row.detailLeft).toBeCloseTo(row.nameLeft, 0);
      } else {
        expect(row.detailTop, `${width}px: dates align with the first line of names`).toBeCloseTo(row.nameTop, 0);
        expect(row.detailRight).toBeCloseTo(geometry[0].detailRight, 0);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    if ([360, 390, 768, 1366].includes(width)) {
      await list.screenshot({ path: testInfo.outputPath(`celebrations-${width}.png`) });
    }
  }
  await page.setViewportSize({ width: 360, height: 800 });
  for (const count of [0, 1, 20, 100]) {
    await page.evaluate(markup => { document.body.innerHTML = `<main>${markup}</main>`; }, renderFixture(fixture(count)));
    const list = page.getByRole("region", { name: "Sinh nhật và bổn mạng", exact: true });
    await expect(list.getByRole("listitem")).toHaveCount(count);
    if (!count) await expect(list).toContainText("Không có dịp nào sắp tới.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
