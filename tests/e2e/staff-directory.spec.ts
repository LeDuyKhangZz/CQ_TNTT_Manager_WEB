import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../src/types/database";

/**
 * M04-B — danh sách `/staff` dùng được (TB-M04-04 · D-108 · D-110) và xóa hồ sơ
 * chưa từng dùng (D-106 · D-109).
 *
 * Các bài lọc trạng thái và xóa hồ sơ tự tạo dữ liệu trên Supabase local, rồi
 * dọn đúng ID của mình. Không tiêu dần seed dùng chung qua các viewport/lượt
 * chạy: GLV914 là nhân vật của bài tạm nghỉ, không phải hồ sơ dự phòng để xóa.
 */
const DEV_PASSWORD = "123456";

function getLocalAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url)) {
    throw new Error("Staff E2E fixtures require local Supabase and a service role key.");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function createStaffFixtures(entries: Array<{
  full_name: string;
  service_status: "active" | "paused" | "inactive";
}>) {
  const { data, error } = await getLocalAdmin().from("staff_profiles")
    .insert(entries.map((entry) => ({ ...entry, title: "anh" as const, saint_name: "Vinh Sơn" })))
    .select("id, staff_code, full_name, service_status");
  if (error || !data) throw new Error(`Create isolated staff fixtures: ${error?.message}`);
  return data;
}

async function cleanStaffFixtures(ids: string[]) {
  const { error } = await getLocalAdmin().from("staff_profiles").delete().in("id", ids);
  if (error) throw new Error(`Clean isolated staff fixtures: ${error.message}`);
}

async function login(page: Page, username: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/dashboard$/);
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

/**
 * Số thẻ nhân sự đang hiện trên trang.
 *
 * Phải nhắm vào LINK chứ không phải chữ: form "Phân công vào lớp" ở cột phải
 * liệt kê toàn bộ nhân sự trong một ô chọn, nên `getByText("<tên>")` luôn khớp
 * ít nhất hai phần tử (thẻ + `<option>`) và Playwright báo strict mode violation.
 */
function staffCards(page: Page) {
  return page.locator('a[href^="/staff/"]');
}

function cardFor(page: Page, name: string) {
  return staffCards(page).filter({ hasText: name });
}

/**
 * Bấm cho tới khi thấy kết quả — cùng khuôn với `clickUntil` của
 * `attendance.spec.ts` và cùng nguyên nhân: cú bấm rơi vào khoảng React ĐÃ gắn
 * handler của `<Link>` nhưng router chưa sẵn sàng thì nó bị nuốt, trang đứng
 * yên, và không có gì để chờ thêm. Đo được: cùng một bản build, `page.goto`
 * thẳng tới trang 2 luôn đúng, còn cú bấm đầu tiên có lượt không ăn.
 * Kiểm điều kiện TRƯỚC mỗi lần bấm nên bấm lại không gây tác dụng phụ.
 */
async function clickUntil(what: string, click: () => Promise<void>, done: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await done()) return;
    await click();
    for (let waited = 0; waited < 12; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
}

test("D-108: mặc định ẩn người 'Đã nghỉ' và NÓI RA đang ẩn bao nhiêu", async ({ page }) => {
  const suffix = randomUUID();
  const pausedName = `Mai Tạm Nghỉ ${suffix}`;
  const inactiveName = `Hồ Đã Nghỉ ${suffix}`;
  const fixtures = await createStaffFixtures([
    { full_name: pausedName, service_status: "paused" },
    { full_name: inactiveName, service_status: "inactive" },
  ]);
  try {
    await login(page, "GLV901");
    // The search scopes two known records; no service parameter means default.
    const fixtureUrl = `/staff?q=${encodeURIComponent(suffix)}`;
    await page.goto(fixtureUrl);
    await expect(page.getByText("Đang ẩn", { exact: false })).toBeVisible();
    await expect(cardFor(page, inactiveName)).toHaveCount(0);
    await expect(cardFor(page, pausedName)).toHaveCount(1);

    await page.getByLabel(/Tìm theo họ tên/).fill(pausedName);
    await page.getByRole("button", { name: "Lọc", exact: true }).click();
    await expect(cardFor(page, pausedName)).toHaveCount(1);
    await page.goto(fixtureUrl);

    const showAllHref = await page.getByRole("link", { name: "Hiện tất cả" }).getAttribute("href");
    expect(showAllHref, "link Hiện tất cả phải có href").toBeTruthy();
    await page.goto(showAllHref!);
    await expect(cardFor(page, inactiveName)).toHaveCount(1);
    await expect(cardFor(page, pausedName)).toHaveCount(1);
  } finally {
    await cleanStaffFixtures(fixtures.map((fixture) => fixture.id));
  }
});

test("TB-M04-04: tìm được người theo tên KHÔNG DẤU và theo mã GLV", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff");

  await page.getByLabel(/Tìm theo họ tên/).fill("tran xuan");
  await page.getByRole("button", { name: "Lọc" }).click();
  await expect(page).toHaveURL(/[?&]q=/);
  await expect(cardFor(page, "Trần Xuân Đoàn")).toHaveCount(1);
  await expect(staffCards(page)).toHaveCount(1);

  await page.goto("/staff?q=GLV913");
  await expect(cardFor(page, "Cao GLV 1B")).toHaveCount(1);
  await expect(staffCards(page)).toHaveCount(1);
});

test("AC-M04-06: trình độ huấn luyện hiện bằng tiếng Việt, không phải NONE", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff");
  await expect(page.getByText("Huấn luyện Chưa qua huấn luyện").first()).toBeVisible();
  await expect(page.getByText("NONE")).toHaveCount(0);
});

test("phân trang: bộ lọc được mang theo sang trang 2 và địa chỉ chép lại được", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff?service=all");

  // 18 hồ sơ trong seed, 10 thẻ mỗi trang ⇒ có trang 2.
  await expect(staffCards(page)).toHaveCount(10);
  // Tên khả dụng của ô số là `aria-label="Trang 2"`, không phải chữ "2" —
  // `aria-label` ghi đè nội dung khi trình đọc màn hình đặt tên cho link.
  // Ô số mang ĐỦ bộ lọc trong `href` — đây là điều khiến địa chỉ chép lại được.
  const nextPage = page.getByRole("link", { name: "Trang 2" });
  await expect(nextPage).toHaveAttribute("href", "/staff?service=all&page=2");
  const nextHref = await nextPage.getAttribute("href");
  expect(nextHref, "link Trang 2 phải có href").toBeTruthy();
  await page.goto(nextHref!);
  await expect(page).toHaveURL(/service=all/);
  await expect(staffCards(page).first()).toBeVisible();
});

test("D-110: Super Admin thấy tên đăng nhập, Xứ đoàn trưởng thì KHÔNG", async ({ page }) => {
  await login(page, "KHANG.NHO");
  await page.goto("/staff?q=GLV913");
  await expect(page.getByText("Đã có GLV913")).toBeVisible();

  await login(page, "GLV901");
  await page.goto("/staff?q=GLV913");
  await expect(page.getByText("Đã có tài khoản")).toBeVisible();
  await expect(page.getByText("Đã có GLV913")).toHaveCount(0);
});

test("D-110: cảnh báo '⚠ Chưa gán vai trò' hiện cho cả Xứ đoàn trưởng", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff?q=GLV918");
  await expect(page.getByText("⚠ Chưa gán vai trò")).toBeVisible();
});

test("TB-M04-03: trùng số điện thoại thì cảnh báo và GIỮ dữ liệu đã gõ, không chặn cứng", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff");

  // `exact: true` bắt buộc: nhãn của ô tìm kiếm là "Tìm theo họ tên, tên thánh,
  // mã GLV hoặc số điện thoại", mà `getByLabel` mặc định khớp CHUỖI CON không
  // phân biệt hoa thường ⇒ "Họ tên" và "Điện thoại" trúng cả ô tìm kiếm.
  await page.getByLabel("Danh xưng", { exact: true }).selectOption("chi");
  await page.getByLabel("Trình độ huấn luyện", { exact: true }).selectOption("ii");
  await page.getByLabel("Họ tên", { exact: true }).fill("Người Trùng Số");
  // Đúng số của GLV909 trong seed.
  await page.getByLabel("Điện thoại", { exact: true }).fill("0901000009");
  await page.getByRole("button", { name: "Tạo hồ sơ" }).click();

  const warning = page.getByRole("status").filter({ hasText: "trông giống người này" });
  await expect(warning).toBeVisible();
  await expect(warning.getByRole("link", { name: /Ngô Đại Diện 1A/ })).toBeVisible();
  await expect(warning).toContainText("trùng số điện thoại");

  // Không chặn cứng: nút đổi nhãn, và dữ liệu đã gõ còn nguyên (kể cả hai ô CHỌN
  // — đây đúng chỗ đã có lỗi thật: select không tự khôi phục theo defaultValue).
  await expect(page.getByRole("button", { name: "Vẫn tạo hồ sơ mới" })).toBeVisible();
  await expect(page.getByLabel("Họ tên", { exact: true })).toHaveValue("Người Trùng Số");
  await expect(page.getByLabel("Danh xưng", { exact: true })).toHaveValue("chi");
  await expect(page.getByLabel("Trình độ huấn luyện", { exact: true })).toHaveValue("ii");
});

test("D-106: hồ sơ ĐÃ DÙNG không xóa được và nêu đúng lý do", async ({ page }) => {
  await login(page, "GLV901");
  await page.goto("/staff?q=GLV909");
  await page.getByRole("link", { name: /Ngô Đại Diện 1A/ }).click();
  await page.waitForURL(/\/staff\/[0-9a-f-]{36}$/);

  await expect(page.getByRole("heading", { name: "Xóa hồ sơ" })).toBeVisible();
  await expect(page.getByText(/không xóa được/)).toBeVisible();
  await expect(page.getByText(/lần phân công lớp trong lịch sử/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Xóa hồ sơ" })).toHaveCount(0);
});

test("D-106: hồ sơ chưa từng dùng xóa được, sau khi gõ lại đúng họ tên", async ({ page }) => {
  const fixtures = await createStaffFixtures([
    { full_name: `Chu Chưa Dùng ${randomUUID()}`, service_status: "active" },
  ]);
  const target = fixtures[0].staff_code;
  try {
  await login(page, "GLV901");
  await page.goto(`/staff/${fixtures[0].id}`);

  // Lấy họ tên từ `placeholder` của chính ô xác nhận, KHÔNG cắt chuỗi từ `<h1>`:
  // tiêu đề là "Anh Vinh Sơn Chu Chưa Dùng" — danh xưng một từ nhưng tên thánh
  // có thể hai từ, nên mọi phép cắt theo số từ đều sai với một phần dữ liệu.
  const confirmField = page.getByLabel(/Gõ lại họ tên/);
  const fullName = (await confirmField.getAttribute("placeholder")) ?? "";
  expect(fullName).not.toBe("");
  const deleteButton = page.getByRole("button", { name: "Xóa hồ sơ" });
  await expect(deleteButton).toBeDisabled();

  await confirmField.fill(fullName);
  await expect(deleteButton).toBeEnabled();

  const dialog = page.getByRole("dialog");
  await clickUntil(
    "Xóa hồ sơ",
    async () => deleteButton.click(),
    async () => (await dialog.count()) > 0,
  );
  await expect(dialog).toContainText(fullName);
  await expect(dialog).toContainText(/không hoàn tác được/);

  // `done()` nhận cả "hộp thoại đã đóng": nếu thao tác hỏng thì hộp cũng đóng
  // và câu lỗi hiện ra — dừng bấm lại ở đó để bài test rớt với đúng câu lỗi,
  // thay vì bắn thêm vài lệnh xoá nữa rồi nhận "không tìm thấy hồ sơ".
  await clickUntil(
    "Xóa hẳn hồ sơ",
    async () => dialog.getByRole("button", { name: "Xóa hẳn hồ sơ" }).click(),
    async () => /\/staff\?deleted=/.test(page.url()) || (await dialog.count()) === 0,
  );

  await page.waitForURL(/\/staff\?deleted=/, { timeout: 20_000 });
  await expect(page.getByText(/^Đã xóa hồ sơ/)).toBeVisible();

  // Hồ sơ biến mất thật khỏi danh sách.
  await page.goto(`/staff?service=all&q=${target}`);
  await expect(staffCards(page)).toHaveCount(0);
  } finally {
    await cleanStaffFixtures(fixtures.map((fixture) => fixture.id));
  }
});

test("D-109: Trưởng ngành KHÔNG thấy khối xóa hồ sơ", async ({ page }) => {
  await login(page, "GLV905");
  await page.goto("/staff?q=GLV910");
  await page.getByRole("link", { name: /Đinh GLV 1A/ }).click();
  await page.waitForURL(/\/staff\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Xóa hồ sơ" })).toHaveCount(0);
});
