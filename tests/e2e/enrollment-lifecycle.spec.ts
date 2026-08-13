import { expect, test, type Page } from "@playwright/test";

/**
 * M03-A · TB-F10 — vòng đời ghi danh: **tạm nghỉ · khôi phục · kết thúc**.
 *
 * 🔴 Bài quan trọng nhất của file này là bài đầu tiên. Trước đợt này, chọn "Tạm
 * nghỉ" **luôn thất bại im lặng**: biểu mẫu "Kết thúc" luôn gửi kèm ngày, mà `paused`
 * là trạng thái MỞ nên CHECK `enrollments_open_has_no_end` cấm có ngày. Trang tải
 * lại, em vẫn nằm nguyên trong lớp, **không một dòng thông báo nào** — người dùng
 * bấm mãi rồi kết luận hệ thống hỏng (F10 = 35/75, `04_SYSTEM_WIDE_FINDINGS.md` §2).
 *
 * 🔴 Ba viewport dùng chung MỘT database (`workers: 1`, bài học M04-A). File này
 * được thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
 *   · bài tạm nghỉ **đi và về** trong cùng một bài (tạm nghỉ → khôi phục);
 *   · bài hộp xác nhận chỉ **mở rồi Huỷ** ⇒ không ghi gì.
 * Không bài nào để lại dấu vết, nên ba viewport không giẫm lên nhau dù chỉ có đúng
 * một lớp có thiếu nhi trong `seed:dev`.
 */
const DEV_PASSWORD = "123456";
/** Ghi toàn xứ đoàn — nằm trong `ENROLLMENT_WRITE_ROLES`. */
const GROUP_LEADER = "GLV901";
/** GLV đại diện lớp Ấu 1A — KHÔNG nằm trong `ENROLLMENT_WRITE_ROLES`. */
const CLASS_REPRESENTATIVE = "GLV909";
/** Lớp duy nhất có thiếu nhi trong `seed:dev`. */
const CLASS_WITH_STUDENTS = "Ấu 1A";
const STUDENT_NAME = "Giuse Nguyễn Minh An";

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

/**
 * Dòng của một em trong danh sách — neo theo **vai trò `listitem`**, không phải theo
 * `<div>`. Danh sách thiếu nhi là một `<ul>` thật (đợt này nâng lên cho đúng ngữ
 * nghĩa), nên mỗi em là đúng một `listitem`; lọc theo `<div>` thì `.last()` rơi vào
 * cái `<div>` trong cùng — cái chỉ chứa tên và huy hiệu, không có nút nào.
 */
function rosterRow(page: Page, studentName: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: studentName, exact: true }) });
}

test.describe("M03-A · vòng đời ghi danh", () => {
  test("🔴 tạm nghỉ CHẠY ĐƯỢC, rồi khôi phục về như cũ (AC-F10-01 · F10-02)", async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    const row = rosterRow(page, STUDENT_NAME);
    await expect(row).toBeVisible({ timeout: 20_000 });

    // --- Tạm nghỉ ---------------------------------------------------------
    await row.getByRole("button", { name: "Tạm nghỉ" }).click();

    // Điều mà bản cũ KHÔNG BAO GIỜ làm được: thao tác thành công và nói ra kết quả.
    //
    // 🔴 45 giây, không phải 20 — **nợ #10 vế (a)**, nới ở M03-B sau khi đo. Ba
    // lượt chạy khác nhau bắt được cùng một hình dạng: nút kẹt ở chữ "Đang lưu…",
    // tức vòng gọi Server Action **chưa về**, chứ không phải giao diện sai. Đã
    // loại cơ sở dữ liệu khỏi diện nghi vấn bằng số đo: với **909 thiếu nhi**,
    // truy vấn nặng nhất của `/students` là **52 ms**, `list_guardian_options`
    // **47 ms**. Bài nào rớt và ở viewport nào **đổi giữa các lượt**, và chạy
    // lại thì xanh. Đây KHÔNG phải bằng chứng đã sửa — nguyên nhân gốc vẫn nằm
    // ở nợ #10/#15 và chưa ai đụng tới.
    const message = page.getByRole("status").filter({ hasText: "Tạm nghỉ" }).first();
    await expect(message).toBeVisible({ timeout: 45_000 });
    await expect(message).toContainText("vẫn thuộc lớp");
    await page.reload();

    // D-121 — sĩ số tách hai số. Đây là con số duy nhất trên trang nói ra rằng
    // lớp không còn nguyên vẹn 2 em đang sinh hoạt.
    await expect(page.getByText(/trong đó 1 tạm nghỉ/)).toBeVisible({ timeout: 20_000 });

    // Huy hiệu bằng CHỮ, không phải chấm màu (điều cấm thứ 5).
    await expect(rosterRow(page, STUDENT_NAME).getByText("Tạm nghỉ", { exact: true }).first()).toBeVisible();

    // --- Khôi phục --------------------------------------------------------
    // AC-F10-02: chức năng này CHƯA TỪNG TỒN TẠI trước đợt này (BR-M03-21).
    await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Khôi phục" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Đang học" }).first()).toBeVisible({
      timeout: 45_000,
    });
    await page.reload();

    // Về đúng trạng thái ban đầu: sĩ số hết vế "trong đó N tạm nghỉ", và KHÔNG tạo
    // ghi danh thứ hai — nếu có, sĩ số sẽ nhảy lên 3 (AC-F10-02).
    await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
    // Chữ thường: vế "… tạm nghỉ" của câu sĩ số. Nút mang chữ "Tạm nghỉ" viết hoa
    // nên không lọt vào phép đếm này.
    await expect(page.getByText(/tạm nghỉ/)).toHaveCount(0);
    // Và nút quay lại đúng nhãn ban đầu — em không còn ở trạng thái tạm nghỉ.
    await expect(rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Tạm nghỉ" })).toBeVisible();
  });

  test("ô lý do kết thúc KHÔNG còn mục 'Tạm nghỉ' — gốc rễ của F10", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    const select = page.getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`);
    await expect(select).toBeVisible({ timeout: 20_000 });
    const values = await select.locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
    expect(values).toEqual(["withdrawn", "completed", "transferred", "repeating"]);
  });

  test("kết thúc phải HỎI TRƯỚC, nêu tên em và tên lớp (AC-F10-03)", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    const row = rosterRow(page, STUDENT_NAME);
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: "Kết thúc", exact: true }).click();

    // Trước đợt này nút "Kết thúc" nằm ngay cạnh tên từng em và ghi thẳng, không
    // hỏi gì (C5 = 1 trong biên bản audit).
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toContainText(STUDENT_NAME);
    await expect(dialog).toContainText(CLASS_WITH_STUDENTS);

    // Huỷ ⇒ không ghi gì. Sĩ số phải còn nguyên.
    await page.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  });

  test("D-122 · lý do 'Chuyển lớp' nói thẳng hệ thống KHÔNG ghi danh em vào lớp mới", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openClass(page, CLASS_WITH_STUDENTS);

    await page
      .getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`)
      .selectOption("transferred");
    await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Kết thúc", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toContainText("CHỈ đóng ghi danh ở lớp hiện tại");
    await page.getByRole("button", { name: "Huỷ" }).click();
  });

  test("GLV lớp KHÔNG được sửa ghi danh — ẩn nút, và RLS vẫn là chốt chặn", async ({ page }) => {
    await login(page, CLASS_REPRESENTATIVE);
    await openClass(page, CLASS_WITH_STUDENTS);

    // GLV đại diện đọc được danh sách lớp mình…
    await expect(page.getByRole("link", { name: STUDENT_NAME, exact: true })).toBeVisible({
      timeout: 20_000,
    });
    // …nhưng không có nút thao tác nào (`ENROLLMENT_WRITE_ROLES` không có vai này).
    await expect(page.getByRole("button", { name: "Tạm nghỉ" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Kết thúc", exact: true })).toHaveCount(0);
  });

  test("mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, GROUP_LEADER);
    await page.goto(`/students`);

    // Sáu thao tác ghi của module trước đợt này đều trả `Promise<void>` — kết quả
    // bị vứt bỏ ngay tại chỗ nhận (BR-M03-38). Bài này canh đường ngắn nhất:
    // biểu mẫu tạo phụ huynh, thao tác rẻ nhất và không đụng dữ liệu thiếu nhi.
    // 🔴 Neo vào ĐÚNG biểu mẫu. `/students` có hai ô mang nhãn bắt đầu bằng "Điện
    // thoại" (phụ huynh, và "Điện thoại (nếu có)" của thiếu nhi) ⇒ `getByLabel`
    // khớp hai phần tử. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B và
    // M04-C — trang nào đông biểu mẫu thì bài test phải neo phạm vi.
    const suffix = `${Date.now()}`.slice(-6);
    const form = page.locator("form").filter({ has: page.locator("#guardian-name") });
    await form.getByLabel("Họ tên phụ huynh").fill(`Phụ huynh E2E ${suffix}`);
    await form.locator("#guardian-phone").fill(`09${suffix}0000`.slice(0, 10));
    await form.getByRole("button", { name: "Tạo phụ huynh" }).click();

    const message = page.getByRole("status").first();
    // 45 giây — cùng lý do với bài "Tạm nghỉ" ở trên (nợ #10 vế (a)).
    await expect(message).toBeVisible({ timeout: 45_000 });
    await expect(message).toContainText(`Phụ huynh E2E ${suffix}`);
    // Câu thành công phải CHỈ ĐƯỜNG sang việc tiếp theo, không chỉ báo "đã lưu".
    await expect(message).toContainText("Thêm thiếu nhi");
  });
});
