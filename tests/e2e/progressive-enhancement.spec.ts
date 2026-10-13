import { expect, test } from "@playwright/test";

test("no-JS login never puts credentials in the URL", async ({ browser, baseURL, viewport }) => {
  const context = await browser.newContext({ baseURL, viewport, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/login");
  await expect(page.getByLabel("Tên đăng nhập")).toBeVisible();
  await expect(page.locator("form")).toHaveAttribute("method", "post");
  await page.getByLabel("Tên đăng nhập").fill("DUMMY_ACCOUNT");
  await page.locator("input#password").fill("dummy-not-a-secret");
  let method = "";
  let query = "";
  await page.route("**/login", async route => {
    method = route.request().method();
    query = new URL(route.request().url()).search;
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Native submission checked</p>" });
  });
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Native submission checked")).toBeVisible();
  expect(method).toBe("POST");
  expect(query).toBe("");
  await context.close();
});

test("authenticated year form and module content work without JavaScript", async ({ page, browser, baseURL, viewport }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("GLV901");
  await page.locator("input#password").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const context = await browser.newContext({ baseURL, viewport, javaScriptEnabled: false, storageState: await page.context().storageState() });
  const nojs = await context.newPage();
  for (const path of ["/classes", "/students", "/results", "/reports"]) {
    await nojs.goto(path);
    await expect(nojs.locator("main h1")).toBeVisible();
    await nojs.locator('summary[aria-label="Chọn năm học"]').click();
    const selected = nojs.getByRole("menuitem", { name: /Hiện hành/ });
    await expect(selected).toBeVisible();
    await Promise.all([nojs.waitForNavigation(), selected.click()]);
    await expect(nojs.locator("main h1")).toBeVisible();
    expect(new URL(nojs.url()).pathname).toBe(path);
  }
  await context.close();
});
