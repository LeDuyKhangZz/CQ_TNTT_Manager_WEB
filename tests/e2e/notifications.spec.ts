import { expect, test, type Page } from "@playwright/test";

/**
 * M10 — Thông báo, cả ba đợt trên trình duyệt thật.
 *
 * 🔴 **Vì sao spec này phải tồn tại.** `03_AUDIT_RESULTS.md` §4.1 kết luận hai
 * lỗi CRITICAL sống sót được là vì **mọi** bài kiểm cũ đều chạy bằng phiên phụ
 * huynh — một vai **không** có quyền đọc toàn cục — nên chúng không bao giờ
 * chạm tới nhánh lỗi. `08_ACCEPTANCE_CRITERIA.md` §1 đòi đúng bài còn thiếu:
 * *"đăng nhập Thư ký, mở chuông, kiểm số hiển thị khớp số thông báo thật của
 * tài khoản đó"*.
 *
 * Cần DB local đã `npm run db:reset && npm run seed:dev`.
 */
const DEV_PASSWORD = "123456";
/** Thư ký — có `app.can_global_read()`, đúng nhóm từng bị sai. */
const SECRETARY = "GLV903";
/**
 * Phụ huynh — vai trò **không** có quyền công bố bất kỳ phạm vi nào, dùng để
 * canh AC-01-07.
 *
 * ⚠️ Bản đầu của bài này dùng `GLV910` (Giáo lý viên lớp) và **đỏ đúng** — nhưng
 * lỗi nằm ở giả định của bài test, không ở mã: GLV910 trong `seed:dev` là
 * **Trưởng một Ban**, nên họ *được phép* gửi thông báo cho Ban mình và biểu mẫu
 * soạn thảo hiện ra là **đúng**.
 */
const GUARDIAN = "84912000001";
/** 🔴 Tài khoản đã kích hoạt nhưng CHƯA gán vai trò — đúng ca của D-167. */
const NO_ROLE = "GLV918";

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

/** Số trên chuông; `null` khi không có badge (tức 0 chưa đọc). */
async function bellCount(page: Page): Promise<number | null> {
  const badge = page.getByTestId("unread-notification-badge");
  if (await badge.count() === 0) return null;
  return Number.parseInt((await badge.first().innerText()).trim(), 10);
}

test.describe("M10-A · hộp thư và chuông chỉ thuộc về người đăng nhập", () => {
  test("AC-01-03 — chuông của Thư ký khớp đúng số dòng trong hộp thư của chính mình", async ({ page }) => {
    await login(page, SECRETARY);
    const onBell = await bellCount(page);

    await page.goto("/notifications?filter=unread");
    await expect(page.getByRole("heading", { name: "Hộp thư của tôi" })).toBeVisible();

    // 🔴 Đây là khẳng định mà cả pgTAP lẫn E2E cũ đều không có. Trước M10-A,
    // chuông đếm chưa đọc của **cả xứ đoàn** còn hộp thư liệt kê 50 dòng mới
    // nhất của cả hệ thống, nên hai con số này không liên quan gì đến nhau.
    //
    // ⚠️ Đếm bằng `data-testid`, **không** bằng `getByRole("listitem")`: vỏ ứng
    // dụng có tới 15 mục điều hướng và trang còn một danh sách "Tôi đã gửi", nên
    // vai trò `listitem` gom cả ba thứ vào một con số vô nghĩa.
    const unreadRows = await page.getByTestId("inbox-item").count();
    expect(onBell ?? 0).toBe(unreadRows);
  });

  test("AC-01-06 — bấm 'Đánh dấu đã đọc' có tác dụng thật sau khi tải lại", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/notifications");

    // 🔴 Bài này **tự dựng dữ liệu của mình** thay vì bỏ qua khi hộp thư rỗng.
    // Bản đầu có nhánh `test.skip` và nó skip trên **cả ba** viewport — tức
    // AC-01-06 chưa bao giờ chạy một lần nào, trong khi nút "bấm mãi không tắt"
    // đúng là một trong sáu triệu chứng của CRIT-M10-02. Một tiêu chí nghiệm thu
    // không bao giờ chạy thì không phải một bảo đảm.
    const title = `E2E đã đọc ${Date.now()}`;
    await page.getByLabel("Phạm vi").selectOption("user");
    await page.getByLabel("Tìm người nhận").fill(SECRETARY);
    const picker = page.getByLabel("Người nhận", { exact: true });
    await expect(picker.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await picker.selectOption({ index: 1 });
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Nội dung").fill("Thư ký tự gửi cho chính mình để kiểm read state.");
    await page.getByRole("button", { name: /^Gửi thông báo/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^(Gửi cho 1 người|Gửi thông báo|Vẫn gửi)$/ }).click();
    await expect(page.getByText(/Đã gửi thông báo tới 1 người/)).toBeVisible({ timeout: 15_000 });

    await page.goto("/notifications?filter=unread");
    const row = page.getByTestId("inbox-item").filter({ hasText: title });
    await expect(row).toHaveCount(1);

    const before = await page.getByTestId("inbox-item").count();
    await row.getByRole("button", { name: "Đánh dấu đã đọc" }).click();

    // Trước M10-A nút này bấm mãi không tắt: hộp thư hiện dòng của người khác
    // còn RPC chỉ đụng dòng của chính mình.
    await expect.poll(async () => {
      await page.goto("/notifications?filter=unread");
      return page.getByTestId("inbox-item").filter({ hasText: title }).count();
    }, { timeout: 15_000 }).toBe(0);
    expect(await page.getByTestId("inbox-item").count()).toBe(before - 1);
  });

  test("AC-01-07 — vai trò không có quyền rộng không bị ảnh hưởng", async ({ page }) => {
    await login(page, GUARDIAN);
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Hộp thư của tôi" })).toBeVisible();
    // Không có quyền công bố phạm vi nào thì không thấy biểu mẫu soạn thảo.
    await expect(page.getByRole("heading", { name: "Gửi thông báo" })).toHaveCount(0);
    await expect(page.getByText("Tôi đã gửi")).toHaveCount(0);
  });
});

test.describe("M10-B · xem lại trước khi gửi, và gửi đích danh", () => {
  test("AC-06-01 + AC-02-01 — hộp xác nhận nêu số người, gửi xong báo số thật", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/notifications");

    const title = `E2E xác nhận ${Date.now()}`;
    await page.getByLabel("Phạm vi").selectOption("guardians");
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Nội dung").fill("Nội dung do bài E2E tạo.");

    // Nút mang sẵn con số — đợi lượt đếm trước về rồi mới bấm.
    const send = page.getByRole("button", { name: /^Gửi thông báo/ });
    await expect(send).toContainText(/\d+ người/, { timeout: 15_000 });
    await send.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(title);
    await expect(dialog).toContainText(/không thu hồi được/i);

    await dialog.getByRole("button", { name: /^Gửi cho \d+ người$/ }).click();
    await expect(page.getByText(/Đã gửi thông báo tới \d+ người/)).toBeVisible({ timeout: 15_000 });
  });

  test("AC-05-01 · D-167 — gửi đích danh tới người CHƯA gán vai trò vẫn tới nơi", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/notifications");

    const title = `E2E gửi riêng ${Date.now()}`;
    await page.getByLabel("Phạm vi").selectOption("user");
    await page.getByLabel("Tìm người nhận").fill(NO_ROLE);
    // ⚠️ `exact: true` là bắt buộc: phép so tên của Playwright mặc định là
    // **chứa chuỗi**, mà ô tìm kiếm mang nhãn "Tìm người nhận" — nó khớp luôn.
    const picker = page.getByLabel("Người nhận", { exact: true });
    await expect(picker.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await picker.selectOption({ index: 1 });
    await expect(page.getByText(/Chỉ người này nhìn thấy/)).toBeVisible();

    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Nội dung").fill("Anh/chị vừa được cấp tài khoản.");
    await page.getByRole("button", { name: /^Gửi thông báo/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^(Gửi cho 1 người|Gửi thông báo|Vẫn gửi)$/ }).click();

    // 🔴 Trước D-167 câu trả lời ở đây là "0 người" — và trước M10-A thì thậm
    // chí không có câu nào cả, người gửi tưởng đã xong.
    await expect(page.getByText(/Đã gửi thông báo tới 1 người/)).toBeVisible({ timeout: 15_000 });

    await login(page, NO_ROLE);
    await page.goto("/notifications");
    await expect(page.getByText(title)).toBeVisible();
  });
});

test.describe("M10-C · thu hồi, lọc và phân trang", () => {
  test("D-166 — thu hồi bắt buộc nêu lý do, và người nhận thấy nhãn 'Đã thu hồi'", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/notifications");

    const title = `E2E thu hồi ${Date.now()}`;
    // 🔴 Nội dung cũng phải DUY NHẤT theo lượt chạy. Ba viewport dùng chung một
    // cơ sở dữ liệu, nên một chuỗi nội dung cố định sẽ còn lại từ lượt trước và
    // khẳng định "nội dung đã biến mất" ở cuối bài trở nên vô nghĩa.
    const body = `Bản sẽ bị thu hồi. ${title}`;
    await page.getByLabel("Phạm vi").selectOption("user");
    await page.getByLabel("Tìm người nhận").fill(NO_ROLE);
    // ⚠️ `exact: true` là bắt buộc: phép so tên của Playwright mặc định là
    // **chứa chuỗi**, mà ô tìm kiếm mang nhãn "Tìm người nhận" — nó khớp luôn.
    const picker = page.getByLabel("Người nhận", { exact: true });
    await expect(picker.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await picker.selectOption({ index: 1 });
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Nội dung").fill(body);
    await page.getByRole("button", { name: /^Gửi thông báo/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^(Gửi cho 1 người|Gửi thông báo|Vẫn gửi)$/ }).click();
    await expect(page.getByText(/Đã gửi thông báo tới 1 người/)).toBeVisible({ timeout: 15_000 });

    // Mục "Tôi đã gửi" — AC-07-01.
    const sentRow = page.getByRole("listitem").filter({ hasText: title });
    await expect(sentRow.first()).toBeVisible({ timeout: 15_000 });
    await sentRow.first().getByRole("button", { name: "Thu hồi" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Lý do bỏ trống thì máy chủ từ chối — luật nằm ở cả hai tầng.
    // `exact: true`: nút huỷ tên là "Không thu hồi" — phép so mặc định là
    // **chứa chuỗi** nên nó khớp luôn cả hai nút. Sửa bộ định vị, không đổi
    // câu chữ giao diện (bài học M08-C).
    const confirmRetract = dialog.getByRole("button", { name: "Thu hồi", exact: true });
    await confirmRetract.click();
    await expect(page.getByText(/Vui lòng nêu lý do thu hồi/)).toBeVisible({ timeout: 15_000 });

    await dialog.getByLabel(/Lý do thu hồi/).fill("Gửi nhầm người");
    await confirmRetract.click();
    // 🔴 Khẳng định phải mang ĐÚNG TIÊU ĐỀ của lượt này. Bản đầu chờ `/Đã thu
    // hồi/` chung chung và nó khớp ngay **dòng đã thu hồi của lượt viewport
    // trước** trong mục "Tôi đã gửi" — một cái xanh giả, và vì xanh ngay lập tức
    // nên bài test điều hướng đi khi lệnh thu hồi còn đang bay, làm chính thao
    // tác đang được kiểm **không bao giờ chạy xong**. Đo được ở cơ sở dữ liệu:
    // chỉ lượt viewport đầu tiên thu hồi thật.
    await expect(page.getByText(`Đã thu hồi “${title}”`)).toBeVisible({ timeout: 15_000 });

    // Vế người nhận: dòng Ở LẠI, nội dung thì không.
    await login(page, NO_ROLE);
    await page.goto("/notifications");
    await expect(page.getByText("Thông báo này đã được thu hồi").first()).toBeVisible();
    await expect(page.getByText(body)).toHaveCount(0);
  });

  test("TB-M10-06 — bộ lọc chưa đọc là một liên kết chép được", async ({ page }) => {
    await login(page, SECRETARY);
    await page.goto("/notifications");
    await page.getByRole("link", { name: "Chưa đọc" }).click();
    await expect(page).toHaveURL(/\/notifications\?filter=unread$/);
    await expect(page.getByRole("link", { name: "Chưa đọc" })).toHaveAttribute("aria-current", "page");
  });
});
