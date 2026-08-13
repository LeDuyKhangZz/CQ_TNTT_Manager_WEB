import { expect, test, type Page } from "@playwright/test";

/**
 * M03-B — danh sách thiếu nhi (TB-F03), cảnh báo trùng (TB-F13) và nối
 * tạo hồ sơ → ghi danh (TB-F02/F09 · D-123).
 *
 * 🔴 Ba viewport dùng chung MỘT database (`workers: 1`, bài học M04-A), và
 * `students` **không cho xoá** (`20260716000100:176-179`). File này vì thế được
 * thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
 *
 *   · Bảy bài đầu **không ghi gì cả** — tìm kiếm, lọc, và hai bài cảnh báo trùng
 *     chỉ dừng ở pha một rồi bỏ đi.
 *   · Bài ghi duy nhất dùng **tên riêng theo viewport**, và **tự xử lý cảnh báo
 *     trùng của chính lượt chạy trước**: lượt hai trở đi sẽ thấy hồ sơ do lượt
 *     một tạo ra, nên nó bấm tiếp "Vẫn tạo hồ sơ mới". Nhờ vậy chính bài ấy kiểm
 *     luôn AC-F13-02 (*cảnh báo là mềm, không chặn*).
 */
const DEV_PASSWORD = "123456";
/** Thư ký — ghi toàn xứ đoàn, được tạo hồ sơ CHƯA xếp lớp (D-123). */
const SECRETARY = "GLV901";

/** `seed:dev` — em này ở lớp Ấu 1A. */
const SEEDED_STUDENT = "Nguyễn Minh An";
const SEEDED_STUDENT_DOB = "2017-03-12";
/** `seed:dev` — em này ở lớp Thiếu 1A, dùng làm ca ÂM TÍNH của bộ lọc lớp. */
const OTHER_SECTOR_STUDENT = "Đinh Gia Hân";
/** Guardian không có account, dành riêng cho các ca ghi của file này. */
const STUDENT_CREATION_GUARDIAN = "Phụ huynh E2E không tài khoản · 0912999999";

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

/**
 * Danh sách là `<ul>`/`<li>` thật từ M03-A, nên neo theo vai trò chứ không theo
 * `<div>`. 🔴 Nhưng phải neo vào ĐÚNG danh sách: vỏ ứng dụng cũng có `<li>`
 * (thanh điều hướng), nên `getByRole("listitem").first()` trả về một mục menu
 * chứ không phải em đầu tiên — bài "chip ngành" đã rớt 3/3 viewport đúng vì thế.
 */
function studentRows(page: Page) {
  return page.getByRole("list", { name: "Danh sách thiếu nhi" }).getByRole("listitem");
}

test.beforeEach(async ({ page }) => {
  await login(page, SECRETARY);
});

test.describe("TB-F03 · tìm kiếm, lọc, trạng thái rỗng", () => {
  test("D-126: gõ KHÔNG DẤU vẫn tìm ra em", async ({ page }) => {
    // Đây là bài canh chính của D-126: cột `search_name` sinh bằng
    // `app.fold_vietnamese()` phải khớp `foldVietnamese()` bên TypeScript. Lệch
    // nhau thì ô tìm kiếm im lặng không ra kết quả nào — hỏng mà không báo.
    await page.goto("/students?q=nguyen+minh+an");
    await expect(page.getByRole("link", { name: new RegExp(SEEDED_STUDENT) }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(OTHER_SECTOR_STUDENT)).toHaveCount(0);
  });

  test("tìm theo số điện thoại người giám hộ", async ({ page }) => {
    await page.goto("/students?q=0912000001");
    await expect(studentRows(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("0912000001").first()).toBeVisible();
  });

  test("ô tìm kiếm gửi được bằng chính biểu mẫu trên trang", async ({ page }) => {
    await page.goto("/students");
    const filters = page.getByRole("group", { name: "Lọc danh sách thiếu nhi" });
    await filters.getByLabel(/Tìm theo tên thiếu nhi/).fill("dinh gia han");
    await page.getByRole("button", { name: "Lọc" }).click();
    await expect(page).toHaveURL(/q=dinh\+gia\+han/);
    await expect(page.getByRole("link", { name: new RegExp(OTHER_SECTOR_STUDENT) }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("lọc theo lớp chỉ còn em của lớp đó", async ({ page }) => {
    await page.goto("/students");
    const filters = page.getByRole("group", { name: "Lọc danh sách thiếu nhi" });
    await filters.getByLabel("Lớp", { exact: true }).selectOption({ label: "Ấu 1A" });
    await page.getByRole("button", { name: "Lọc" }).click();
    await expect(page.getByRole("link", { name: new RegExp(SEEDED_STUDENT) }).first()).toBeVisible({
      timeout: 20_000,
    });
    // Ca âm tính: em lớp Thiếu 1A phải BIẾN MẤT, nếu không bộ lọc chỉ là trang trí.
    await expect(page.getByText(OTHER_SECTOR_STUDENT)).toHaveCount(0);
  });

  test("không khớp gì thì nói 'không có em nào khớp bộ lọc', không nói 'chưa có hồ sơ'", async ({
    page,
  }) => {
    // Hai câu khác nhau cho hai tình huống khác nhau (09 §9): nói "chưa có hồ sơ
    // nào" trong lúc đang lọc là dẫn người dùng đi tạo lại một em đã có.
    await page.goto("/students?q=khongcoemnaotenlathenay");
    await expect(page.getByText("Không có em nào khớp bộ lọc")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Xoá bộ lọc" })).toBeVisible();
  });

  test("thẻ ngành hiện TÊN NGÀNH bằng chữ, không chỉ có màu", async ({ page }) => {
    // `11` §5 — "không dùng màu làm tín hiệu duy nhất; chip ngành luôn có tên ngành".
    await page.goto("/students?q=nguyen+minh+an");
    await expect(studentRows(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(studentRows(page).first().getByText("Ấu Nhi")).toBeVisible();
  });
});

test.describe("TB-F13 · cảnh báo trùng", () => {
  test("AC-F13-01: nhập trùng tên và ngày sinh thì KHÔNG tạo ngay, mà hiện hồ sơ đã có", async ({
    page,
  }) => {
    await page.goto("/students");
    const form = page.getByRole("form", { name: "Thêm thiếu nhi" });
    await form.getByLabel("Người giám hộ").selectOption({ label: STUDENT_CREATION_GUARDIAN });
    await form.getByLabel("Tên thánh").fill("Giuse");
    await form.getByLabel("Họ tên").fill(SEEDED_STUDENT);
    await form.getByLabel("Ngày sinh").fill(SEEDED_STUDENT_DOB);
    await form.getByRole("button", { name: "Tạo hồ sơ thiếu nhi" }).click();

    await expect(page.getByText(/Đã có \d+ hồ sơ trông giống em này/)).toBeVisible({
      timeout: 20_000,
    });
    // Danh sách nghi trùng phải nêu MÃ em để người nhập nhận ra hồ sơ nào.
    await expect(page.getByText(/CQ\d{4}/).first()).toBeVisible();
    // AC-F13-02 — nút đổi chữ, tức người nhập vẫn đi tiếp được.
    await expect(form.getByRole("button", { name: "Vẫn tạo hồ sơ mới" })).toBeVisible();
  });

  test("BR-M03-N09: trùng số điện thoại phụ huynh cũng được cảnh báo", async ({ page }) => {
    await page.goto("/students");
    const form = page.getByRole("form", { name: "Thêm người giám hộ" });
    await form.getByLabel("Họ tên phụ huynh").fill("Người Khác Hẳn");
    await form.getByLabel("Điện thoại").fill("0912000001");
    await form.getByRole("button", { name: "Tạo phụ huynh" }).click();

    await expect(page.getByText(/Đã có \d+ phụ huynh trông giống người này/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(form.getByRole("button", { name: "Vẫn tạo phụ huynh mới" })).toBeVisible();
  });
});

test.describe("TB-F02/F09 · tạo hồ sơ kèm ghi danh", () => {
  test("D-123: tạo hồ sơ và xếp lớp trong một lần bấm", async ({ page }, testInfo) => {
    // Tên riêng theo viewport: ba viewport chạy nối tiếp trên cùng một database,
    // và `students` không cho xoá nên không dọn lại được.
    const fullName = `Lê Thị E2E ${testInfo.project.name}`;
    // 🔴 **Ấu 1A là lớp DUY NHẤT có thiếu nhi trong `seed:dev`, nên nhiều spec
    // khác chốt cứng sĩ số của nó** — `enrollment-lifecycle.spec.ts:150` khẳng
    // định "Sĩ số đang sinh hoạt: 2". Lượt E2E toàn bộ đầu tiên của đợt này đã
    // làm đỏ **4 bài của M03-A** đúng vì bài này ghi danh thêm em vào đó
    // (2 → 5 sau ba viewport). Đây là **vế (b) của nợ #10** do chính đợt này
    // gây ra, và cách trả là ghi danh vào một lớp **không spec nào chốt số**.
    const emptyClass = "Ấu 3B";

    await page.goto("/students");
    const form = page.getByRole("form", { name: "Thêm thiếu nhi" });
    await form.getByLabel("Người giám hộ").selectOption({ label: STUDENT_CREATION_GUARDIAN });
    await form.getByLabel("Tên thánh").fill("Anna");
    await form.getByLabel("Họ tên").fill(fullName);
    await form.getByLabel("Ngày sinh").fill("2016-01-01");
    await form.getByLabel(/Ghi danh vào lớp/).selectOption({ label: `${emptyClass} · Ấu Nhi` });
    await form.getByRole("button", { name: "Tạo hồ sơ thiếu nhi" }).click();

    // Lượt chạy lại sẽ thấy hồ sơ của lượt trước ⇒ cảnh báo trùng. Bấm tiếp
    // chính là AC-F13-02: cảnh báo MỀM, người nhập luôn được đi tiếp.
    //
    // 🔴 Phải CHỜ một trong hai kết cục hiện ra rồi mới rẽ nhánh. `isVisible()`
    // trả lời ngay lập tức, không chờ — hỏi nó khi Server Action còn đang chạy
    // thì luôn nhận `false`, và bài test bỏ qua nút xác nhận rồi đứng đợi một
    // câu thành công không bao giờ tới. Bài này đã rớt 3/3 viewport đúng vì thế.
    const confirmButton = form.getByRole("button", { name: "Vẫn tạo hồ sơ mới" });
    const success = page.getByText(/Đã tạo hồ sơ .* mã thiếu nhi CQ\d{4}/);
    //
    // Ngưỡng chờ 45 giây, không phải 20: đây là thao tác ghi **nặng nhất** của
    // trang — một RPC ghi hai bảng rồi ba lượt `revalidatePath`. Lượt chạy toàn
    // bộ đầu tiên rớt với nút còn nguyên chữ "Đang tạo hồ sơ…", tức thao tác
    // **chưa xong** chứ không phải giao diện sai (nợ #10 vế (a)).
    await expect(confirmButton.or(success).first()).toBeVisible({ timeout: 45_000 });
    if (await confirmButton.isVisible()) await confirmButton.click();

    await expect(success).toBeVisible({ timeout: 45_000 });
    // AC-F14-01 + BR-M03-N19 — câu thành công phải nói CẢ HAI việc vừa xảy ra.
    await expect(page.getByText(new RegExp(`Đã ghi danh vào lớp ${emptyClass}`))).toBeVisible();

    // Và em thật sự nằm trong lớp, không chỉ là một câu thông báo.
    await page.goto(`/students?q=${encodeURIComponent(fullName)}`);
    await expect(page.getByText(`Lớp: ${emptyClass}`).first()).toBeVisible({ timeout: 20_000 });
  });
});
