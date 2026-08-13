# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: class-settings.spec.ts >> M02-B · chi tiết lớp và cài đặt lớp >> đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại
- Location: tests\e2e\class-settings.spec.ts:90:7

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  locator('form').filter({ has: locator('#class-status') }).getByLabel('Trạng thái lớp')
Expected: "paused"
Received: "inactive"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for locator('form').filter({ has: locator('#class-status') }).getByLabel('Trạng thái lớp')
    14 × locator resolved to <select name="status" id="class-status" class="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-muted outline-none transition-colors duration-fast ease-out focus-visible:border-theme-primary focus-visible:ring-2 focus-visible:ring-theme-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 aria-[invalid=true]:border-danger h-control appearance-none pr-10">…</select>
       - unexpected value "inactive"

```

```yaml
- combobox "Trạng thái lớp":
  - option "Đang hoạt động"
  - option "Tạm ngưng" [selected]
  - option "Đã đóng"
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * M02-B — chi tiết lớp neo vào năm học (I5 / TB-F07) và màn hình "Cài đặt lớp"
  5   |  * (I6 / TB-F08 · AC-M02-10), cộng huy hiệu trạng thái lớp (BR-M02-N12) và mốc kết
  6   |  * thúc học kỳ 1 (D-71 / D-115 / D-116).
  7   |  *
  8   |  * 🔴 Ba viewport dùng chung MỘT database (bài học M04-A, `workers: 1`). File này
  9   |  * được thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
  10  |  *   · mỗi viewport đổi trạng thái **một lớp riêng** rồi **trả lại `Đang hoạt động`**
  11  |  *     ngay trong cùng bài — không viewport nào giẫm lên lớp của viewport khác;
  12  |  *   · bài hộp xác nhận chỉ **mở rồi Huỷ** ⇒ không ghi gì;
  13  |  *   · bài mốc học kỳ 1 lưu rồi **xoá lại** trong cùng bài.
  14  |  */
  15  | const DEV_PASSWORD = "123456";
  16  | const SUPER_ADMIN = "KHANG.NHO";
  17  | /** Ghi toàn xứ đoàn — nhóm quyền của màn hình Cài đặt lớp (D-112 không lan sang lớp). */
  18  | const GROUP_LEADER = "GLV901";
  19  | /** Trưởng ngành Ấu: ghi danh được nhưng KHÔNG sửa cài đặt lớp. */
  20  | const SECTOR_LEADER_AU = "GLV905";
  21  | const SEEDED_YEAR_CODE = "2026-2027";
  22  | /** Lớp có thiếu nhi trong `seed:dev` — dùng cho bài hộp xác nhận (chỉ mở rồi Huỷ). */
  23  | const CLASS_WITH_STUDENTS = "Ấu 1A";
  24  | 
  25  | /** Mỗi viewport một lớp riêng để đổi trạng thái: ba lượt chạy không giẫm lên nhau. */
  26  | const TOGGLED_CLASS_BY_PROJECT: Record<string, string> = {
  27  |   "mobile-360": "Hiệp 1",
  28  |   "tablet-768": "Hiệp 2",
  29  |   "laptop-1366": "Nghĩa 3",
  30  | };
  31  | 
  32  | async function login(page: Page, username: string) {
  33  |   await page.context().clearCookies();
  34  |   await page.goto("/login");
  35  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  36  |     await page.getByLabel("Tên đăng nhập").fill(username);
  37  |     await page.locator("input#password").fill(DEV_PASSWORD);
  38  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  39  |     try {
  40  |       await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
  41  |       return;
  42  |     } catch {
  43  |       await page.goto("/login");
  44  |     }
  45  |   }
  46  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  47  | }
  48  | 
  49  | /** Mở đúng URL mà thẻ lớp công bố; không phụ thuộc client navigation đang chập chờn. */
  50  | async function openClass(page: Page, className: string) {
  51  |   await page.goto("/classes");
  52  |   const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  53  |   await expect(card).toBeVisible({ timeout: 20_000 });
  54  |   const href = await card.getAttribute("href");
  55  |   expect(href, `thẻ lớp ${className} phải có href`).toMatch(/^\/classes\/[0-9a-f-]{36}$/);
  56  |   await page.goto(href!);
  57  | }
  58  | 
  59  | function settingsForm(page: Page) {
  60  |   return page.locator("form").filter({ has: page.locator("#class-status") });
  61  | }
  62  | 
  63  | async function saveStatus(page: Page, status: "Đang hoạt động" | "Tạm ngưng" | "Đã đóng") {
  64  |   const form = settingsForm(page);
  65  |   await form.getByLabel("Trạng thái lớp").selectOption({ label: status });
  66  |   await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();
  67  |   // Lớp dùng cho bài này không có thiếu nhi ⇒ không có hộp xác nhận (BR-M02-N11).
  68  |   await expect(page.getByText(`Trạng thái hiện tại: ${status}`)).toBeVisible({ timeout: 45_000 });
  69  |   await page.reload();
  70  |   const expectedValue = status === "Đang hoạt động" ? "active" : status === "Tạm ngưng" ? "paused" : "closed";
> 71  |   await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue(expectedValue);
      |                                                                 ^ Error: expect(locator).toHaveValue(expected) failed
  72  | }
  73  | 
  74  | test.describe("M02-B · chi tiết lớp và cài đặt lớp", () => {
  75  |   test("trang chi tiết lớp nói rõ năm học và trạng thái năm học (BR-M02-N10)", async ({ page }) => {
  76  |     await login(page, GROUP_LEADER);
  77  |     await openClass(page, CLASS_WITH_STUDENTS);
  78  | 
  79  |     // Trước M02-B, mã năm nằm lẫn trong phụ đề và KHÔNG có trạng thái năm học ở đâu
  80  |     // cả. Neo vào ĐÚNG phụ đề: mã năm học còn xuất hiện ở thanh đầu trang và ở
  81  |     // breadcrumb nữa, nên `getByText("Năm học 2026-2027")` khớp bốn phần tử.
  82  |     await expect(page.getByText(`Năm học ${SEEDED_YEAR_CODE} · Đang áp dụng`)).toBeVisible();
  83  |     // Năm đang áp dụng ⇒ KHÔNG có dải cảnh báo nào. Dải hiện ở mọi trang lớp chỉ
  84  |     // dạy người dùng cách phớt lờ nó.
  85  |     await expect(page.getByText("chỉ đọc")).toHaveCount(0);
  86  |     // I6: biểu mẫu cài đặt lớp có mặt cho vai trò ghi toàn xứ đoàn.
  87  |     await expect(settingsForm(page)).toBeVisible();
  88  |   });
  89  | 
  90  |   test("đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại", async ({ page }, testInfo) => {
  91  |     test.setTimeout(120_000);
  92  |     const className = TOGGLED_CLASS_BY_PROJECT[testInfo.project.name] ?? "Nghĩa 2";
  93  |     await login(page, GROUP_LEADER);
  94  |     await openClass(page, className);
  95  | 
  96  |     // `updateClass` viết xong từ Phase 1 mà KHÔNG màn hình nào gọi (5W-F08). Đây là
  97  |     // bài chứng minh nó đã có call site thật.
  98  |     await saveStatus(page, "Tạm ngưng");
  99  | 
  100 |     // BR-M02-N12 — huy hiệu phải nhìn ra được từ danh sách, bằng CHỮ chứ không
  101 |     // phải chấm màu.
  102 |     await page.goto("/classes");
  103 |     const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  104 |     await expect(card).toContainText("Tạm ngưng", { timeout: 20_000 });
  105 | 
  106 |     await openClass(page, className);
  107 |     await saveStatus(page, "Đang hoạt động");
  108 | 
  109 |     // Lớp đang hoạt động thì KHÔNG có huy hiệu — 19/19 lớp đều gắn thì huy hiệu mất
  110 |     // giá trị báo hiệu đúng lúc cần nó nhất.
  111 |     await page.goto("/classes");
  112 |     const restored = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  113 |     await expect(restored).not.toContainText("Tạm ngưng", { timeout: 20_000 });
  114 |   });
  115 | 
  116 |   test("đóng lớp còn thiếu nhi: hộp xác nhận nêu SỐ EM và TÊN LỚP (BR-M02-N11)", async ({ page }) => {
  117 |     await login(page, GROUP_LEADER);
  118 |     await openClass(page, CLASS_WITH_STUDENTS);
  119 | 
  120 |     const form = settingsForm(page);
  121 |     await form.getByLabel("Trạng thái lớp").selectOption({ label: "Đã đóng" });
  122 |     await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();
  123 | 
  124 |     // 11 §5 — hậu quả nêu bằng tên riêng, không phải "Bạn có chắc không?".
  125 |     const dialog = page.getByRole("dialog");
  126 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  127 |     await expect(dialog).toContainText("em đang sinh hoạt");
  128 |     await expect(dialog).toContainText(/không.*kết thúc ghi danh/i);
  129 | 
  130 |     // Huỷ: bài này KHÔNG được đóng lớp có thiếu nhi của cả hệ thống.
  131 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  132 |     await expect(dialog).toHaveCount(0);
  133 |     await page.reload();
  134 |     await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue("active");
  135 |   });
  136 | 
  137 |   test("Trưởng ngành ghi danh được nhưng KHÔNG sửa được cài đặt lớp", async ({ page }) => {
  138 |     await login(page, SECTOR_LEADER_AU);
  139 |     await openClass(page, CLASS_WITH_STUDENTS);
  140 | 
  141 |     // Hai nhóm quyền tách riêng có chủ ý: `ENROLLMENT_WRITE_ROLES` gồm Trưởng ngành,
  142 |     // `classes_update_global_write` thì không. Gộp làm một là hoặc cho họ bấm một
  143 |     // nút RLS sẽ chặn, hoặc cắt mất quyền ghi danh của họ.
  144 |     await expect(page.getByRole("heading", { name: "Ghi danh thiếu nhi" })).toBeVisible();
  145 |     await expect(settingsForm(page)).toHaveCount(0);
  146 |     // Nhưng vẫn ĐỌC được cài đặt: ẩn cả sự thật thì họ không biết lớp mình họp ở đâu.
  147 |     await expect(page.getByText("Phòng sinh hoạt:")).toBeVisible();
  148 |   });
  149 | });
  150 | 
  151 | test.describe("M02-B · mốc kết thúc học kỳ 1 (D-71)", () => {
  152 |   test("lưu mốc, chặn ngày ngoài năm học, rồi xoá lại", async ({ page }) => {
  153 |     test.setTimeout(120_000);
  154 |     await login(page, SUPER_ADMIN);
  155 |     await page.goto("/admin");
  156 | 
  157 |     const card = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
  158 |     const milestone = card.getByLabel("Ngày kết thúc học kỳ 1");
  159 |     await expect(milestone).toBeVisible();
  160 | 
  161 |     // Lớp chặn thứ nhất là của chính trình duyệt: `min`/`max` đọc từ năm học, khớp
  162 |     // CHECK constraint `academic_years_semester_1_range`. Ngày ngoài khoảng không gửi
  163 |     // đi được, nên câu lỗi tiếng Việt của Zod là lớp chặn thứ hai (kiểm ở unit test)
  164 |     // và cơ sở dữ liệu là lớp thứ ba (kiểm ở pgTAP `033`).
  165 |     await expect(milestone).toHaveAttribute("min", "2026-09-01");
  166 |     await expect(milestone).toHaveAttribute("max", "2027-05-31");
  167 | 
  168 |     await milestone.fill("2027-01-15");
  169 |     await card.getByRole("button", { name: "Lưu mốc" }).click();
  170 |     // D-115 — cùng một câu phải nói ra rằng hệ thống KHÔNG tự đóng lớp Dự trưởng.
  171 |     const saved = card.getByText("Đã lưu mốc kết thúc học kỳ 1");
```