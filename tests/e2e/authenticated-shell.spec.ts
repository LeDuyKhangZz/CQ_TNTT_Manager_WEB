import { expect, test, type Page } from "@playwright/test";

/**
 * Gate Phase 2 — "Student/guardian/staff/class UI usable".
 *
 * Đăng nhập thật rồi đi hết các trang nghiệp vụ của Phase 2 ở cả ba viewport.
 * Cần DB local đã `npm run db:reset && npm run seed:dev` (mật khẩu dev, tài
 * khoản GLV9xx). Nếu chưa seed thì test báo trượt ngay ở bước đăng nhập, đó là
 * tín hiệu đúng chứ không phải nhiễu.
 */
const DEV_PASSWORD = "123456";

async function login(page: Page, username: string) {
  // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu
  // (đo được: 6 test rớt vì chờ mãi ô "Tên đăng nhập"). Trong ứng dụng thật,
  // đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức năng đăng xuất vừa được
  // thêm ở A-01, trước đó chưa hề tồn tại nên các spec mới phải làm vòng này.
  // Xoá cookie là cách diễn đạt đúng ý "bắt đầu như một người mới trên máy
  // sạch"; mỗi context là độc lập nên không đụng tới phiên của context khác
  // (bài tranh chấp/tiếp quản ở attendance dùng hai context riêng).
  await page.context().clearCookies();
  await page.goto("/login");

  // Form gửi bằng handler của React. Nếu bấm trước khi hydrate xong thì trình
  // duyệt submit kiểu native và ở lại /login, nên thử lại vài lần thay vì chờ
  // một mốc thời gian đoán mò.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    // Ô mật khẩu có nút "Hiện mật khẩu" cùng nhãn, nên phải trỏ thẳng vào input.
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

/** Không trang nào được tràn ngang — yêu cầu mobile-first của docs/06. */
async function expectNoHorizontalOverflow(page: Page, where: string) {
  // Trang có thể vừa chuyển hướng xong; đo trước khi DOM mới sẵn sàng sẽ ném
  // "context destroyed".
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "attached" });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

test.describe("Xứ đoàn trưởng đi hết các trang Phase 2", () => {
  test("students, class, staff, imports đều dùng được", async ({ page }) => {
    await login(page, "GLV901");

    // ── Danh sách thiếu nhi ────────────────────────────────────────────────
    await page.goto("/students");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Thiếu nhi", exact: true })).toBeVisible();
    const studentLinks = page.locator('a[href^="/students/"]');
    await expect(studentLinks.first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/students");

    // ── Hồ sơ một em: có tab nhạy cảm vì đây là role global ────────────────
    const firstStudent = await studentLinks.first().getAttribute("href");
    expect(firstStudent).toBeTruthy();
    await page.goto(firstStudent!);
    await expect(page.getByText("Sức khỏe")).toBeVisible();
    await expect(page.getByText("Bí tích")).toBeVisible();
    await expectNoHorizontalOverflow(page, firstStudent!);

    // ── 19 thẻ lớp ─────────────────────────────────────────────────────────
    await page.goto("/classes");
    await expect(main.getByRole("heading", { name: "Lớp học", exact: true })).toBeVisible();
    const classLinks = page.locator('a[href^="/classes/"]');
    await expect(classLinks).toHaveCount(19);
    await expectNoHorizontalOverflow(page, "/classes");

    // ── Chi tiết lớp: đội ngũ + roster ─────────────────────────────────────
    const firstClass = await classLinks.first().getAttribute("href");
    await page.goto(firstClass!);
    await expect(page.getByText(/Ghi danh|Sĩ số|Đội ngũ/).first()).toBeVisible();
    await expectNoHorizontalOverflow(page, firstClass!);

    // ── Nhân sự và nhập liệu ───────────────────────────────────────────────
    await page.goto("/staff");
    /*
     * 🔴 Bài này neo vào **một người cụ thể ở trang 1** cho tới M02-B, và nó đã đỏ
     * từ M04-B mà không ai thấy: M04-B thêm phân trang **10 người/trang** cho
     * `/staff`, mà GLV901 "Trần Xuân Đoàn" xếp thứ **13/15** theo họ tên ⇒ nằm ở
     * **trang 2**. Không phải hồi quy của M02-B — chỉ là các đợt trước chạy E2E
     * *theo từng đợt*, nên spec của M14 này không được chạy lại sau khi M04-B đổi
     * `/staff`. Ý định của bài là "trang nhân sự dùng được", nên nay kiểm **có hồ sơ
     * mở được**, đúng khuôn với phần `/students` phía trên — không phụ thuộc thứ tự
     * xếp tên hay cỡ trang.
     */
    await expect(
      main.getByRole("heading", { name: "Huynh trưởng/Giáo lý viên", exact: true }),
    ).toBeVisible();
    await expect(page.locator('a[href^="/staff/"]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/staff");

    await page.goto("/imports");
    await expect(page.getByRole("button", { name: "Kiểm tra file" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/imports");
  });
});

test.describe("Phạm vi hiển thị theo vai trò", () => {
  test("GLV lớp chỉ thấy lớp mình trong danh sách thiếu nhi", async ({ page }) => {
    await login(page, "GLV910");
    await page.goto("/students");
    const rows = page.locator('a[href^="/students/"]');
    const seen = await rows.count();
    expect(seen).toBeGreaterThan(0);
    // Toàn xứ đoàn có hàng trăm em; GLV một lớp không được thấy cỡ đó.
    expect(seen).toBeLessThan(60);
    await expectNoHorizontalOverflow(page, "/students (GLV lớp)");
  });

  // D-45: phụ huynh không dùng module nghiệp vụ; mọi trang staff phải trả về
  // /access-denied chứ không phải một trang lỗi hay một trang rỗng.
  //
  // 🔴 `/student/attendance` là bổ sung của M14 A-03 (AC-A2). `ROUTE_RULES` khai
  // route này chỉ cho vai trò `student` từ đầu, nhưng query của nó guard bằng
  // `requireAuthContext` — chỉ hỏi "đã đăng nhập chưa" — nên luật chưa từng
  // được thi hành: bất kỳ ai có phiên hợp lệ gõ thẳng địa chỉ đều vào được.
  for (const route of ["/imports", "/students", "/classes", "/staff", "/student/attendance"]) {
    test(`phụ huynh bị chặn khỏi ${route}`, async ({ page }) => {
      await login(page, "84912000001");
      await page.goto(route);
      await expect(page).toHaveURL(/\/access-denied$/);
      await expectNoHorizontalOverflow(page, "/access-denied");
    });
  }

  test("GLV lớp cũng không vào được cổng thiếu nhi (M14 A-03)", async ({ page }) => {
    await login(page, "GLV910");
    await page.goto("/student/attendance");
    await expect(page).toHaveURL(/\/access-denied$/);
  });
});

/**
 * M14 A-01 — đăng xuất. Trước phiên này tính năng **không tồn tại**: luồng F07
 * chấm 16/75, thấp nhất toàn bộ audit. Máy phòng học là máy dùng chung.
 */
test.describe("Đăng xuất (M14 A-01)", () => {
  test("AC-F1 · AC-F2: thoát được từ trang bất kỳ và bấm Back không quay lại được", async ({ page }) => {
    await login(page, "GLV901");
    await page.goto("/reports");

    // Đi qua menu tài khoản chứ không qua chân thanh bên: thanh bên là
    // `hidden lg:flex` nên ở project 360 và 768 nó không hiện. Menu tài khoản
    // có mặt ở **cả ba** viewport, và đúng 2 thao tác — mở menu, bấm Đăng xuất.
    await page.locator("summary[aria-label^='Menu tài khoản']").click();
    await page.getByRole("menuitem", { name: "Đăng xuất" }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByTestId("login-banner")).toContainText("Bạn đã đăng xuất.");

    // AC-F2: phiên đã chết thật, không chỉ là điều hướng sang trang khác.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("AC-B1: chân thanh bên không còn chữ tạm P0-T3", async ({ page }) => {
    await login(page, "GLV901");
    await expect(page.locator("body")).not.toContainText("P0-T3");
    await expect(page.locator("body")).not.toContainText("Bản nền giao diện");
  });

  test("AC-F4: deep-link đưa về đúng trang sau khi đăng nhập", async ({ page }) => {
    await page.goto("/reports?type=weekly");
    await expect(page).toHaveURL(/\/login\?next=%2Freports%3Ftype%3Dweekly$/);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByLabel("Tên đăng nhập").fill("GLV901");
      await page.locator("input#password").fill(DEV_PASSWORD);
      await page.getByRole("button", { name: "Đăng nhập" }).click();
      try {
        await page.waitForURL(/\/reports\?type=weekly$/, { timeout: 10_000 });
        return;
      } catch {
        await page.goto("/reports?type=weekly");
      }
    }
    throw new Error("Deep-link không được giữ qua bước đăng nhập");
  });

  test("NC-3: đã có phiên thì /login vào thẳng Tổng quan", async ({ page }) => {
    await login(page, "GLV901");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

/**
 * M14 **đợt B** — trạng thái và lối thoát (A-12 · A-14 · A-16 · A-07).
 *
 * Ba trong bốn việc đều là cùng một triệu chứng: người dùng đứng ở một chỗ mà
 * giao diện không nói được đó là chỗ nào, hoặc không có đường đi tiếp.
 */
test.describe("Trạng thái và lối thoát (M14 đợt B)", () => {
  test("AC-C1 · A-12: mở bản ghi không tồn tại vẫn còn nguyên vỏ ứng dụng", async ({ page }) => {
    await login(page, "GLV901");
    // UUID đúng dạng nhưng không có trong DB ⇒ query trả null ⇒ `notFound()`.
    await page.goto("/students/6f1e0d7a-0000-4000-8000-0000000000ff");

    // Đây là điểm phân biệt với `src/app/not-found.tsx`: trang 404 toàn màn hình
    // KHÔNG có breadcrumb, không có nút chuông, không có menu tài khoản.
    await expect(page.getByRole("navigation", { name: "Đường dẫn trang" })).toBeVisible();
    await expect(page.locator("summary[aria-label^='Menu tài khoản']")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Về trang chủ" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "not-found trong vỏ");
  });

  test("AC-B5 · A-14: thanh đầu trang gọi đúng tên trang bị từ chối quyền", async ({ page }) => {
    await login(page, "84912000001");
    await page.goto("/students");
    await expect(page).toHaveURL(/\/access-denied$/);

    const header = page.locator("header");
    await expect(header).toContainText("Không có quyền truy cập");
    // Bản cũ in tên ứng dụng ở đây, tức thanh đầu trang không nói được mình
    // đang ở đâu đúng lúc người dùng cần biết chuyện gì vừa xảy ra.
    await expect(header).not.toContainText("Thiếu Nhi Chợ Quán");
  });

  test("A-16: nút chuông có mặt trong vỏ, phần đếm chảy về sau", async ({ page }) => {
    await login(page, "GLV901");
    // Nút và link tới `/notifications` thuộc phần vỏ dựng ngay; con số chưa đọc
    // nằm trong `<Suspense>`. Bài đếm badge thật ở `committees.spec.ts`.
    await expect(page.getByRole("link", { name: /^Mở thông báo/ })).toBeVisible();
  });

  test("AC-B2 · A-07: phụ huynh có đường vào hồ sơ từng con", async ({ page }) => {
    await login(page, "84912000001");

    // Trang chủ — đường vào tự nhiên nhất, trước đây không hề có.
    const childLinks = page.locator('a[href^="/parent/children/"]');
    await expect(childLinks.first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/dashboard (phụ huynh)");

    // Và cả trang Đơn xin nghỉ.
    await page.goto("/parent/absence-requests");
    await expect(page.locator('a[href^="/parent/children/"]').first()).toBeVisible();

    // Bấm vào mở đúng hồ sơ, và ở đó có đường đi tiếp.
    await page.locator('a[href^="/parent/children/"]').first().click();
    await page.waitForURL(/\/parent\/children\//);
    await expect(page.getByRole("heading", { name: "Chuyên cần" })).toBeVisible();
    // Bó trong `main`: thanh bên desktop cũng có một mục "Đơn xin nghỉ", nên
    // tìm trên cả trang sẽ trúng hai phần tử ở viewport 1366.
    await expect(page.getByRole("main").getByRole("link", { name: "Đơn xin nghỉ" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "/parent/children/<id>");
  });
});

/**
 * M14 **đợt C** — vỏ ứng dụng và IA. Bốn quyết định của chủ dự án 2026-07-23:
 * menu phụ huynh có "Con của tôi" · giữ nút ba gạch thay cho menu "Thêm" ·
 * trang Tài khoản làm thật ở mức tối thiểu · đặc tả route đã cũ thì cập nhật.
 */
test.describe("Vỏ ứng dụng và IA (M14 đợt C)", () => {
  /**
   * 🔴 Mọi locator điều hướng ở nhóm này phải có `:visible`.
   *
   * Thanh bên là `hidden lg:flex` — dưới 1024px nó **vẫn nằm trong DOM** nhưng
   * `display:none`. `page.locator('nav a[href=…]').first()` vì thế trúng đúng
   * cái link vô hình đó ở 360/768 và bài test rớt với "Received: hidden", trong
   * khi ứng dụng hoàn toàn đúng. Ba bài dưới đây đã rớt vì lý do này.
   */
  const navLink = (page: Page, href: string) => page.locator(`nav a[href="${href}"]:visible`);

  test("AC-B4 · A-08: phụ huynh có mục 'Con của tôi' dẫn tới trang danh sách con", async ({ page }) => {
    await login(page, "84912000001");

    // Mục điều hướng thật, không phải một link lẻ trong nội dung trang.
    await navLink(page, "/parent/children").first().click();
    await page.waitForURL(/\/parent\/children$/);

    await expect(page.getByRole("heading", { level: 1, name: "Con của tôi" })).toBeVisible();
    await expect(page.locator('a[href^="/parent/children/"]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "/parent/children");
  });

  test("A-08: Quản trị viên hệ thống có lối tắt Quản trị ngay trong vỏ", async ({ page }) => {
    // 1366 thì nằm ở thanh bên, 360/768 thì nằm ở thanh dưới — cả hai đều `<nav>`.
    await login(page, "KHANG.NHO");
    await expect(navLink(page, "/admin").first()).toBeVisible();
  });

  test("🔴 A-08: ba vai trò chỉ đọc không còn ô Điểm danh dẫn tới trang bị chặn", async ({ page }) => {
    await login(page, "GLV904"); // Thủ quỹ
    // Đếm trên toàn DOM, không lọc `:visible`: mục này không được phép tồn tại
    // trong bất kỳ thanh điều hướng nào, kể cả thanh bên đang ẩn.
    await expect(page.locator('nav a[href="/attendance"]')).toHaveCount(0);
    await expect(navLink(page, "/reports").first()).toBeVisible();
  });

  test("A-10 · AC-C6: trang Tài khoản có nội dung thật, không còn placeholder", async ({ page }) => {
    await login(page, "GLV901");
    await page.goto("/account");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Tài khoản" })).toBeVisible();
    await expect(main).toContainText("GLV901");
    await expect(main).toContainText("Xứ đoàn trưởng");
    await expect(main.getByRole("link", { name: "Đổi mật khẩu" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
    // Câu của `ProtectedModulePlaceholder`, và nó nói "Phase 1" trong khi dự án
    // đã ở Phase 7 — mọi vai trò, mọi thiết bị đều chạm vào trang này.
    await expect(page.locator("body")).not.toContainText("sẽ được triển khai");
    await expectNoHorizontalOverflow(page, "/account");
  });

  test("đổi mật khẩu tự nguyện không còn bị gọi là 'lần đăng nhập đầu tiên'", async ({ page }) => {
    await login(page, "GLV901");
    await page.goto("/account");
    await page.getByRole("main").getByRole("link", { name: "Đổi mật khẩu" }).click();
    await page.waitForURL(/\/change-password/);

    await expect(page.getByRole("heading", { level: 1, name: "Đổi mật khẩu" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("lần đăng nhập đầu tiên");
    await expect(page.locator("body")).not.toContainText("Bắt buộc");
  });

  test("AC-C5: trang bị từ chối quyền nói rõ vai trò hiện tại", async ({ page }) => {
    await login(page, "84912000001");
    await page.goto("/imports");
    await expect(page).toHaveURL(/\/access-denied$/);
    // Quản trị viên hỏi "anh đang đăng nhập bằng vai trò gì" — trước đây người
    // dùng không có gì để trả lời.
    await expect(page.getByRole("main")).toContainText("Phụ huynh");
  });

  test("🔴 màu ngành KHÔNG bao giờ đứng một mình — kể cả ở 360px", async ({ page }) => {
    // GLV910 là Giáo lý viên lớp Ấu 1A ⇒ vỏ lấy ngành Ấu Nhi (10 §3 bước 6).
    await login(page, "GLV910");

    // Dải màu 4px: có mặt và mang đúng token ngành đã bơm.
    const themed = page.locator("[data-theme-key]").first();
    await expect(themed).toHaveAttribute("data-theme-key", /.+/);

    // Và luôn có MỘT dòng chữ nói cùng điều đó đang nhìn thấy được — ở 1366 là
    // dòng trong thanh bên, ở 360/768 là bản trong nội dung. Đây chính là chỗ
    // suýt hổng: thanh bên `hidden lg:flex` nên bản desktop biến mất ở 360px.
    await expect(
      page.locator('[data-context-indicator="viewing"]:visible').first(),
    ).toContainText("Ngành Ấu Nhi");
  });
});
