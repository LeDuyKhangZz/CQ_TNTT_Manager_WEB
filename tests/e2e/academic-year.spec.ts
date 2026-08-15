import { expect, test, type Page } from "@playwright/test";

/**
 * M02-A — vòng đời năm học ở `/admin`: TB-F02 (sinh lớp) · TB-F12 (kênh phản hồi)
 * · D-112 (chỉ Super Admin) · D-113 (cảnh báo trước khi đặt hiện hành).
 *
 * 🔴 Ba viewport dùng chung MỘT database (bài học M04-A). Cả file này vì thế
 * được thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
 *   · bài "trùng mã năm học" dừng ở pha lỗi ⇒ không ghi gì;
 *   · bài "sinh lớp" bấm trên năm **đã có đủ lớp** ⇒ lượt nào cũng phải ra câu
 *     "đã có đủ … từ trước", và đó đúng là nhánh mà bản cũ không phân biệt được
 *     với "không tạo được lớp nào" (5W-F02);
 *   · bài "đặt hiện hành" tạo một năm NHÁP riêng cho từng viewport nếu chưa có,
 *     rồi chỉ **mở hộp xác nhận và bấm Huỷ** — không lượt nào đổi năm hiện hành
 *     của cả hệ thống.
 */
const DEV_PASSWORD = "123456";
const SUPER_ADMIN = "KHANG.NHO";
/** Vai trò ghi toàn xứ đoàn nhưng KHÔNG phải Super Admin — dùng cho bài D-112. */
const SECRETARY = "GLV903";
const SEEDED_YEAR_CODE = "2026-2027";

/** Mỗi viewport một mã năm nháp riêng: ba lượt chạy không giẫm lên nhau. */
const DRAFT_YEAR_BY_PROJECT: Record<string, string> = {
  "mobile-360": "2071-2072",
  "tablet-768": "2072-2073",
  "laptop-1366": "2073-2074",
};

async function login(page: Page, username: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

function yearCard(page: Page, code: string) {
  return page.locator("div.rounded-md.border").filter({ hasText: code }).first();
}

/**
 * 🔴 Phải neo vào ĐÚNG biểu mẫu. Trang `/admin` còn khối cấp tài khoản, và khối
 * đó cũng có một ô nhãn "Tên hiển thị" — `page.getByLabel("Tên hiển thị")` khớp
 * hai phần tử và Playwright báo strict mode violation.
 */
function createYearForm(page: Page) {
  return page.locator("form").filter({ has: page.locator("#academic-code") });
}

async function fillNewYear(page: Page, code: string, name: string, start: string, end: string) {
  const form = createYearForm(page);
  await form.getByLabel("Mã năm học").fill(code);
  await form.getByLabel("Tên hiển thị").fill(name);
  await form.getByLabel("Ngày bắt đầu").fill(start);
  // 🔴 `exact: true` là bắt buộc từ M02-B. `getByLabel` khớp theo **chuỗi con**, và
  // D-71 thêm ô "Ngày kết thúc học kỳ 1" vào đúng biểu mẫu này — nhãn mới BAO CHỨA
  // nhãn cũ, nên bản không `exact` khớp hai phần tử và Playwright báo strict mode
  // violation. Cùng họ với lỗi "Tên hiển thị trùng hai chỗ" của M02-A: trang
  // `/admin` đông biểu mẫu, mọi bài test phải neo chính xác.
  await form.getByLabel("Ngày kết thúc", { exact: true }).fill(end);
  await form.getByRole("button", { name: "Tạo năm học nháp" }).click();
}

test.describe("M02-A · quản trị năm học", () => {
  test("trang quản trị nói tiếng Việt: trạng thái, ngày tháng, số lớp", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    const card = yearCard(page, SEEDED_YEAR_CODE);
    await expect(card).toBeVisible();
    // Bản cũ in thẳng enum của cơ sở dữ liệu ("current") và ngày ISO thô.
    await expect(card).toContainText("Đang áp dụng");
    await expect(card).not.toContainText("current");
    await expect(card).toContainText("01/09/2026");
    await expect(card).toContainText("19/19 lớp");
  });

  test("tạo năm học trùng mã: báo lỗi tại chỗ và GIỮ dữ liệu đã gõ", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    await fillNewYear(page, SEEDED_YEAR_CODE, "Năm học gõ trùng", "2026-09-01", "2027-05-31");

    // AC-M02-04: trước đợt này màn hình im lặng hoàn toàn.
    await expect(page.getByText(`Mã năm học ${SEEDED_YEAR_CODE} đã tồn tại`)).toBeVisible({
      timeout: 20_000,
    });
    // D-61 (biểu mẫu dài): không bắt gõ lại bảy ô.
    const form = createYearForm(page);
    await expect(form.getByLabel("Tên hiển thị")).toHaveValue("Năm học gõ trùng");
    // Đợt C: ô ngày hiện dd/MM/yyyy; giá trị gửi lên máy chủ vẫn là ISO ở ô ẩn.
    await expect(form.getByLabel("Ngày kết thúc", { exact: true })).toHaveValue("31/05/2027");
    await expect(form.locator('input[type="hidden"][name="endDate"]')).toHaveValue("2027-05-31");
  });

  test("sinh lớp mặc định: phân biệt 'đã có đủ từ trước' với 'vừa tạo'", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    const card = yearCard(page, SEEDED_YEAR_CODE);
    await card.getByRole("button", { name: "Sinh lớp mặc định" }).click();

    // 11 §5: hộp xác nhận nêu hậu quả bằng tên riêng, không phải "Bạn có chắc?".
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);
    await expect(dialog).toContainText("19/19 lớp");
    await dialog.getByRole("button", { name: "Sinh lớp", exact: true }).click();

    // Câu trả lời hiện NGAY TẠI CHỖ vừa bấm, không qua chuyển hướng — xem ghi
    // chú dài ở cuối `academic-years/server/actions.ts`.
    await expect(card.getByText("đã có đủ 19 lớp từ trước")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Đã tạo 0")).toHaveCount(0);
  });

  test("đặt hiện hành: cảnh báo bằng số lớp thật trước khi làm (D-113)", async ({ page }, testInfo) => {
    const draftCode = DRAFT_YEAR_BY_PROJECT[testInfo.project.name] ?? "2079-2080";
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    if ((await yearCard(page, draftCode).count()) === 0) {
      const startYear = draftCode.slice(0, 4);
      const endYear = draftCode.slice(5);
      await fillNewYear(
        page,
        draftCode,
        `Năm học ${draftCode}`,
        `${startYear}-09-01`,
        `${endYear}-05-31`,
      );
      await expect(page.getByText("Đã tạo năm học nháp")).toBeVisible({ timeout: 20_000 });
      await page.reload();
    }

    const card = yearCard(page, draftCode);
    await expect(card).toContainText("Nháp");
    await expect(card).toContainText("0/19 lớp");

    await card.getByRole("button", { name: "Đặt hiện hành" }).click();
    const dialog = page.getByRole("dialog");
    // Đúng nửa sau của sự cố production: đặt hiện hành khi chưa có lớp nào.
    await expect(dialog).toContainText("mới có 0/19 lớp");
    await expect(dialog).toContainText("chưa ghi danh hay điểm danh được");
    await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);

    // Huỷ: bài test này KHÔNG được đổi năm hiện hành của cả hệ thống.
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(yearCard(page, SEEDED_YEAR_CODE)).toContainText("Đang áp dụng");
  });

  test("D-112: Thư ký (ghi toàn xứ đoàn) không vào được trang quản trị", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/access-denied$/);
  });
});

/**
 * M02-C — chốt sổ (I7 / TB-F09 / D-73) và lưu trữ (D-120).
 *
 * 🔴 **Cả hai bài đều dừng ở nút "Huỷ", và đó là chủ ý — không phải bài test viết
 * dở.** Chốt sổ và lưu trữ đều là thao tác **một chiều** (hệ thống không có luồng mở
 * lại năm học, cũng không có luồng bỏ lưu trữ), mà ba viewport lại **dùng chung một
 * database** (bài học M04-A). Một lượt xác nhận ở `mobile-360` là mọi spec sau đó
 * chạy trên một hệ thống **không còn năm học hiện hành** — tức toàn bộ bộ E2E đỏ.
 * Phần sau nút xác nhận được kiểm bằng **JWT thật ở pgTAP `034`**, nơi giao dịch được
 * `rollback`: ở đó có đủ cả đóng cưỡng bức thành công, lưu trữ thành công, và mọi
 * đường bị chặn.
 */
test.describe("M02-C · chốt sổ và lưu trữ năm học", () => {
  test("đóng năm học: bảng kiểm nêu con số thật, và ba lớp ma sát đều có thật", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");
    const card = yearCard(page, SEEDED_YEAR_CODE);

    // WF-16 bước 1–3 — bảng kiểm do cơ sở dữ liệu đếm, không do trang tự đếm.
    // Dữ liệu mẫu có thiếu nhi đang ghi danh, nên dòng này phải xuất hiện.
    await expect(card).toContainText("ghi danh đang mở");

    const codeInput = card.getByLabel(/Gõ lại mã năm học/);
    const closeButton = card.getByRole("button", { name: "Đóng năm học" });
    await expect(closeButton).toBeDisabled();

    // Ma sát 2 — gõ lại đúng mã (BR-M02-N08). Mã của năm khác không mở được nút.
    await codeInput.fill("2027-2028");
    await expect(closeButton).toBeDisabled();
    await codeInput.fill(SEEDED_YEAR_CODE);

    // Ma sát 3 — còn việc tồn đọng thì phải ghi lý do (BR-M02-N05).
    await expect(closeButton).toBeDisabled();
    await card.getByLabel(/Lý do chốt sổ/).fill("Kiểm thử E2E — sẽ bấm Huỷ, không chốt sổ thật");
    await expect(closeButton).toBeEnabled();

    await closeButton.click();
    const dialog = page.getByRole("dialog");
    // `11` §5 — hậu quả nêu bằng tên riêng, và nêu cả điều người dùng phát hiện
    // muộn nhất nếu không nói ra.
    await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);
    await expect(dialog).toContainText("không còn năm học hiện hành nào");
    await expect(dialog).toContainText("ghi danh đang mở");
    await expect(dialog).toContainText("Quản trị viên hệ thống");

    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card).toContainText("Đang áp dụng");
  });

  test("D-120: nút Lưu trữ chỉ hiện ở năm đã quá hạn giữ dữ liệu", async ({ page }) => {
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    // Hai năm học đã đóng của `seed:dev` khác nhau ở **đúng một điểm**: hạn giữ dữ liệu.
    const expired = yearCard(page, "2019-2020");
    await expect(expired.getByRole("button", { name: "Lưu trữ" })).toBeVisible();

    const notYet = yearCard(page, "2024-2025");
    await expect(notYet.getByRole("button", { name: "Lưu trữ" })).toHaveCount(0);
    // Không có nút thì phải nói RÕ BAO GIỜ mới có. Một nút xám không giải thích được
    // gì là chỗ người dùng bấm mãi rồi nghĩ hệ thống hỏng.
    await expect(notYet).toContainText("Lưu trữ được từ sau 31/05/2030");

    await expired.getByRole("button", { name: "Lưu trữ" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Năm học 2019-2020");
    await expect(dialog).toContainText("một chiều");
    await expect(dialog).toContainText("không bị xoá");
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
