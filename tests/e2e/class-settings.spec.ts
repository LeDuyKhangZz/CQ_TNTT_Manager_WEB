import { expect, test, type Page } from "@playwright/test";

/**
 * M02-B — chi tiết lớp neo vào năm học (I5 / TB-F07) và màn hình "Cài đặt lớp"
 * (I6 / TB-F08 · AC-M02-10), cộng huy hiệu trạng thái lớp (BR-M02-N12) và mốc kết
 * thúc học kỳ 1 (D-71 / D-115 / D-116).
 *
 * 🔴 Ba viewport dùng chung MỘT database (bài học M04-A, `workers: 1`). File này
 * được thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
 *   · mỗi viewport đổi trạng thái **một lớp riêng** rồi **trả lại `Đang hoạt động`**
 *     ngay trong cùng bài — không viewport nào giẫm lên lớp của viewport khác;
 *   · bài hộp xác nhận chỉ **mở rồi Huỷ** ⇒ không ghi gì;
 *   · bài mốc học kỳ 1 lưu rồi **xoá lại** trong cùng bài.
 */
const DEV_PASSWORD = "123456";
const SUPER_ADMIN = "KHANG.NHO";
/** Ghi toàn xứ đoàn — nhóm quyền của màn hình Cài đặt lớp (D-112 không lan sang lớp). */
const GROUP_LEADER = "GLV901";
/** Trưởng ngành Ấu: ghi danh được nhưng KHÔNG sửa cài đặt lớp. */
const SECTOR_LEADER_AU = "GLV905";
const SEEDED_YEAR_CODE = "2026-2027";
/** Lớp có thiếu nhi trong `seed:dev` — dùng cho bài hộp xác nhận (chỉ mở rồi Huỷ). */
const CLASS_WITH_STUDENTS = "Ấu 1A";

/** Mỗi viewport một lớp riêng để đổi trạng thái: ba lượt chạy không giẫm lên nhau. */
const TOGGLED_CLASS_BY_PROJECT: Record<string, string> = {
  "mobile-360": "Hiệp 1",
  "tablet-768": "Hiệp 2",
  "laptop-1366": "Nghĩa 3",
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

/** Mở đúng URL mà thẻ lớp công bố; không phụ thuộc client navigation đang chập chờn. */
async function openClass(page: Page, className: string) {
  await page.goto("/classes");
  const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  const href = await card.getAttribute("href");
  expect(href, `thẻ lớp ${className} phải có href`).toMatch(/^\/classes\/[0-9a-f-]{36}$/);
  await page.goto(href!);
}

function settingsForm(page: Page) {
  return page.locator("form").filter({ has: page.locator("#class-status") });
}

async function saveStatus(page: Page, status: "Đang hoạt động" | "Tạm ngưng" | "Đã đóng") {
  const form = settingsForm(page);
  await form.getByLabel("Trạng thái lớp").selectOption({ label: status });
  await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();
  // Lớp dùng cho bài này không có thiếu nhi ⇒ không có hộp xác nhận (BR-M02-N11).
  await expect(page.getByText(`Trạng thái hiện tại: ${status}`)).toBeVisible({ timeout: 45_000 });
  await page.reload();
  // `class_status` dùng `inactive`; `paused` là enum của ghi danh. Nhãn UI vẫn
  // là “Tạm ngưng”, nhưng assertion phải kiểm đúng giá trị hợp đồng của lớp.
  const expectedValue = status === "Đang hoạt động" ? "active" : status === "Tạm ngưng" ? "inactive" : "closed";
  await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue(expectedValue);
}

test.describe("M02-B · chi tiết lớp và cài đặt lớp", () => {
  test("trang chi tiết lớp nói rõ năm học và trạng thái năm học (BR-M02-N10)", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    // Trước M02-B, mã năm nằm lẫn trong phụ đề và KHÔNG có trạng thái năm học ở đâu
    // cả. Neo vào ĐÚNG phụ đề: mã năm học còn xuất hiện ở thanh đầu trang và ở
    // breadcrumb nữa, nên `getByText("Năm học 2026-2027")` khớp bốn phần tử.
    await expect(page.getByText(`Năm học ${SEEDED_YEAR_CODE} · Đang áp dụng`)).toBeVisible();
    // Năm đang áp dụng ⇒ KHÔNG có dải cảnh báo nào. Dải hiện ở mọi trang lớp chỉ
    // dạy người dùng cách phớt lờ nó.
    await expect(page.getByText("chỉ đọc")).toHaveCount(0);
    // I6: biểu mẫu cài đặt lớp có mặt cho vai trò ghi toàn xứ đoàn.
    await expect(settingsForm(page)).toBeVisible();
  });

  test("đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const className = TOGGLED_CLASS_BY_PROJECT[testInfo.project.name] ?? "Nghĩa 2";
    await login(page, GROUP_LEADER);
    await openClass(page, className);

    // `updateClass` viết xong từ Phase 1 mà KHÔNG màn hình nào gọi (5W-F08). Đây là
    // bài chứng minh nó đã có call site thật.
    try {
      await saveStatus(page, "Tạm ngưng");

      // BR-M02-N12 — huy hiệu phải nhìn ra được từ danh sách, bằng CHỮ chứ không
      // phải chấm màu.
      await page.goto("/classes");
      const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
      await expect(card).toContainText("Tạm ngưng", { timeout: 20_000 });
    } finally {
      // Cleanup phải chạy cả khi assertion ở giữa thất bại. Nếu để lớp tạm
      // ngưng, các fixture M07/M13 dùng lại lớp đó sẽ đỏ dây chuyền với
      // CLASS_NOT_ACTIVE và che mất nguyên nhân đầu tiên.
      await openClass(page, className);
      await saveStatus(page, "Đang hoạt động");
    }

    // Lớp đang hoạt động thì KHÔNG có huy hiệu — 19/19 lớp đều gắn thì huy hiệu mất
    // giá trị báo hiệu đúng lúc cần nó nhất.
    await page.goto("/classes");
    const restored = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
    await expect(restored).not.toContainText("Tạm ngưng", { timeout: 20_000 });
  });

  test("đóng lớp còn thiếu nhi: hộp xác nhận nêu SỐ EM và TÊN LỚP (BR-M02-N11)", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    const form = settingsForm(page);
    await form.getByLabel("Trạng thái lớp").selectOption({ label: "Đã đóng" });
    await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();

    // 11 §5 — hậu quả nêu bằng tên riêng, không phải "Bạn có chắc không?".
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
    await expect(dialog).toContainText("em đang sinh hoạt");
    await expect(dialog).toContainText(/không.*kết thúc ghi danh/i);

    // Huỷ: bài này KHÔNG được đóng lớp có thiếu nhi của cả hệ thống.
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue("active");
  });

  test("Trưởng ngành ghi danh được nhưng KHÔNG sửa được cài đặt lớp", async ({ page }) => {
    await login(page, SECTOR_LEADER_AU);
    await openClass(page, CLASS_WITH_STUDENTS);

    // Hai nhóm quyền tách riêng có chủ ý: `ENROLLMENT_WRITE_ROLES` gồm Trưởng ngành,
    // `classes_update_global_write` thì không. Gộp làm một là hoặc cho họ bấm một
    // nút RLS sẽ chặn, hoặc cắt mất quyền ghi danh của họ.
    await expect(page.getByRole("heading", { name: "Ghi danh thiếu nhi" })).toBeVisible();
    await expect(settingsForm(page)).toHaveCount(0);
    // Nhưng vẫn ĐỌC được cài đặt: ẩn cả sự thật thì họ không biết lớp mình họp ở đâu.
    await expect(page.getByText("Phòng sinh hoạt:")).toBeVisible();
  });
});

test.describe("M02-B · mốc kết thúc học kỳ 1 (D-71)", () => {
  test("lưu mốc, chặn ngày ngoài năm học, rồi xoá lại", async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, SUPER_ADMIN);
    await page.goto("/admin");

    const card = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
    const milestone = card.getByLabel("Ngày kết thúc học kỳ 1");
    await expect(milestone).toBeVisible();

    // Lớp chặn thứ nhất là của chính trình duyệt: `min`/`max` đọc từ năm học, khớp
    // CHECK constraint `academic_years_semester_1_range`. Ngày ngoài khoảng không gửi
    // đi được, nên câu lỗi tiếng Việt của Zod là lớp chặn thứ hai (kiểm ở unit test)
    // và cơ sở dữ liệu là lớp thứ ba (kiểm ở pgTAP `033`).
    await expect(milestone).toHaveAttribute("min", "2026-09-01");
    await expect(milestone).toHaveAttribute("max", "2027-05-31");

    await milestone.fill("2027-01-15");
    await card.getByRole("button", { name: "Lưu mốc" }).click();
    // D-115 — cùng một câu phải nói ra rằng hệ thống KHÔNG tự đóng lớp Dự trưởng.
    const saved = card.getByText("Đã lưu mốc kết thúc học kỳ 1");
    await expect(saved).toBeVisible({ timeout: 45_000 });
    await expect(saved).toContainText("không tự đóng lớp");

    await page.reload();
    const cardAgain = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
    // Đợt C: hiển thị dd/MM/yyyy, ô ẩn giữ ISO.
    await expect(cardAgain.getByLabel("Ngày kết thúc học kỳ 1")).toHaveValue("15/01/2027");

    // D-116 — lưu ô trống là XOÁ mốc, không phải lỗi. Trả lại trạng thái ban đầu để
    // lượt chạy sau và hai viewport còn lại không thấy một mốc lạ.
    await cardAgain.getByLabel("Ngày kết thúc học kỳ 1").fill("");
    await cardAgain.getByRole("button", { name: "Lưu mốc" }).click();
    await expect(cardAgain.getByText("Đã xoá mốc kết thúc học kỳ 1")).toBeVisible({ timeout: 45_000 });
    await page.reload();
    const finalCard = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
    await expect(finalCard.getByLabel("Ngày kết thúc học kỳ 1")).toHaveValue("");
  });
});
