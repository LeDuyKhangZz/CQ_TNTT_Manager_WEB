import { expect, test, type Page } from "@playwright/test";

/**
 * P7-T4 — privacy/security review, phần kiểm được bằng máy.
 *
 * Ba nhóm: header bảo vệ trình duyệt, ID rác không được làm sập server
 * (AGENTS §5), và RLS negative smoke qua đường direct URL — thứ mà ẩn nút không
 * ngăn được.
 */
const DEV_PASSWORD = "123456";
const BAD_UUID = "11111111-1111-4111-8111-111111111111"; // đúng dạng, không tồn tại
const NOT_A_UUID = "khong-phai-uuid";

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

test("mọi trang trả về header bảo vệ trình duyệt", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  // URL của app mang UUID thiếu nhi — không được rò sang miền khác.
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  // Next tự tắt, nhưng để lộ phiên bản framework thì không có lợi gì.
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("ID rác trả 404/điều hướng chứ không phải lỗi 500", async ({ page }) => {
  await login(page, "GLV901");

  const routes = [
    `/students/${BAD_UUID}`,
    `/students/${NOT_A_UUID}`,
    `/classes/${BAD_UUID}`,
    `/classes/${NOT_A_UUID}`,
    `/committees/${NOT_A_UUID}`,
    `/results/${NOT_A_UUID}`,
    `/teaching-plan/${NOT_A_UUID}`,
    `/attendance/${NOT_A_UUID}`,
    // M01-B / S12: trang chi tiết GLV mới cũng phải chịu được ID rác.
    `/staff/${BAD_UUID}`,
    `/staff/${NOT_A_UUID}`,
  ];

  for (const route of routes) {
    const response = await page.goto(route);
    const status = response?.status() ?? 0;
    expect(status, `${route} không được trả 5xx`).toBeLessThan(500);
  }
});

/**
 * M02-C / D-70 — siết quyền đọc lớp & năm học của phụ huynh và thiếu nhi.
 *
 * 🔴 Bài này canh **nửa "không quá tay"** của D-70, và đó là nửa dễ làm hỏng: chính
 * D-70 cảnh báo bằng chữ rằng *"nhiều màn hình hiện dựa vào việc đọc được danh sách
 * lớp để hiển thị tên lớp; siết quá tay sẽ làm cổng phụ huynh hiện «lớp không xác
 * định»"*. Nửa "siết đủ" — phụ huynh không còn lấy được toàn bộ 19 lớp và toàn bộ
 * danh sách năm học qua Data API — được kiểm bằng **JWT thật ở pgTAP `035`**, nơi
 * đo được đúng số dòng RLS trả về; ở tầng trình duyệt không có cách nào thấy điều đó.
 */
test("D-70: cổng phụ huynh vẫn đọc được năm học hiện hành và lớp của con", async ({ page }) => {
  // Phụ huynh A của `seed:dev` (số điện thoại chuẩn hoá thành tên đăng nhập).
  await login(page, "84912000001");

  // Thanh đầu trang hiện năm học cho MỌI vai trò. Nếu chặn sạch `academic_years`
  // thì đây đúng là chỗ hiện "Chưa đặt năm học" — một câu SAI.
  //
  // 🔴 Neo vào `<header>` và dùng `toContainText`, KHÔNG dùng
  // `getByText("2026-2027").first()`: mã năm học xuất hiện ở ít nhất ba chỗ trong vỏ
  // ứng dụng, và hai trong số đó ẩn theo cỡ màn hình — `ContextIndicator` nằm ở thanh
  // bên (chỉ hiện từ `lg`), còn bản thân thanh năm học có hai biến thể
  // `sm:hidden`/`hidden sm:inline`. `.first()` vì thế trỏ vào một phần tử **ẩn** ở
  // đúng viewport mà bài test đang chạy. Cùng họ với lỗi "nhãn trùng hai chỗ" của
  // M02-A/M02-B: trên vỏ ứng dụng, mọi khẳng định phải neo phạm vi.
  await expect(page.getByText("Chưa đặt năm học")).toHaveCount(0);
  await expect(page.locator("header").first()).toContainText("2026-2027");

  // Trang "Con của tôi" dựng được nghĩa là chuỗi ghi danh ⟶ lớp ⟶ cấp ⟶ ngành mà
  // bộ chọn màu ngành cần (10 §4) vẫn đi hết được dưới phạm vi mới.
  await page.goto("/parent/children");
  await expect(page.getByRole("link", { name: /Nguyễn Minh An/ })).toBeVisible();
});

test("GLV lớp mở thẳng URL lớp khác vẫn bị chặn", async ({ page, browser }) => {
  // GLV910 dạy Ấu 1A. Lấy id lớp Ấu 1B bằng phiên global-write rồi mở chính
  // URL đó bằng một phiên độc lập của GLV910 — ẩn nút không phải
  // authorization (AGENTS §5). Hai context riêng để không phải đăng xuất.
  await login(page, "GLV901");
  await page.goto("/classes");
  const links = page.locator('a[href^="/classes/"]');
  await expect(links.first()).toBeVisible();

  const otherClassHref = await links
    .filter({ hasText: "Ấu 1B" })
    .first()
    .getAttribute("href");
  expect(otherClassHref, "fixture phải có lớp Ấu 1B").toBeTruthy();

  const classTeacherContext = await browser.newContext();
  try {
    const classTeacherPage = await classTeacherContext.newPage();
    await login(classTeacherPage, "GLV910");

    const response = await classTeacherPage.goto(otherClassHref!);
    expect(response?.status() ?? 0, "lớp khác không được trả 5xx").toBeLessThan(500);
    // Không được thấy một em nào của lớp khác.
    await expect(classTeacherPage.locator('a[href^="/students/"]')).toHaveCount(0);
  } finally {
    await classTeacherContext.close();
  }
});
