# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: class-settings.spec.ts >> M02-B · chi tiết lớp và cài đặt lớp >> đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại
- Location: tests\e2e\class-settings.spec.ts:92:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Trạng thái hiện tại: Đang hoạt động')
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText('Trạng thái hiện tại: Đang hoạt động')

```

```yaml
- link "Bỏ qua điều hướng":
  - /url: "#main-content"
- complementary "Thanh bên ứng dụng":
  - paragraph: Giáo xứ Chợ Quán
  - paragraph: Thiếu Nhi Thánh Thể
  - paragraph: "Đang xem: Huynh Trưởng · Năm học 2026-2027"
  - navigation "Điều hướng chính":
    - paragraph: Chung
    - list:
      - listitem:
        - link "Tổng quan":
          - /url: /dashboard
      - listitem:
        - link "Thông báo":
          - /url: /notifications
      - listitem:
        - link "Tài khoản":
          - /url: /account
    - paragraph: Mục vụ
    - list:
      - listitem:
        - link "Thiếu nhi":
          - /url: /students
      - listitem:
        - link "Lớp học":
          - /url: /classes
      - listitem:
        - link "Huynh trưởng/Giáo lý viên":
          - /url: /staff
      - listitem:
        - link "Điểm danh":
          - /url: /attendance
      - listitem:
        - link "Giáo án":
          - /url: /teaching-plan
      - listitem:
        - link "Kết quả học tập":
          - /url: /results
      - listitem:
        - link "Lên lớp/chuyển lớp":
          - /url: /promotions
    - paragraph: Điều hành
    - list:
      - listitem:
        - link "Ban":
          - /url: /committees
      - listitem:
        - link "Báo cáo":
          - /url: /reports
      - listitem:
        - link "Nhập dữ liệu Excel":
          - /url: /imports
  - button "Đăng xuất"
- banner:
  - navigation "Đường dẫn trang":
    - list:
      - listitem:
        - link "Trang chủ":
          - /url: /dashboard
      - listitem:
        - link "Lớp học":
          - /url: /classes
      - listitem: Chi tiết lớp
  - paragraph: Lớp học
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Trần Xuân Đoàn
- main:
  - link "Danh sách lớp":
    - /url: /classes
  - heading "Nghĩa 3" [level=1]
  - paragraph: Nghĩa Sĩ · Năm học 2026-2027 · Đang áp dụng
  - text: Tạm ngưng
  - heading "Danh sách thiếu nhi" [level=3]
  - paragraph: "Sĩ số đang sinh hoạt: 0"
  - paragraph: Lớp chưa có thiếu nhi ghi danh.
  - heading "Đội ngũ lớp" [level=3]
  - paragraph: Chưa phân công nhân sự.
  - heading "Cài đặt lớp" [level=3]
  - paragraph: Trạng thái, phòng sinh hoạt và ghi chú. Đóng lớp không kết thúc ghi danh đang mở.
  - text: Trạng thái lớp
  - combobox "Trạng thái lớp":
    - option "Đang hoạt động" [selected]
    - option "Tạm ngưng"
    - option "Đã đóng"
  - text: Phòng sinh hoạt
  - textbox "Phòng sinh hoạt":
    - /placeholder: "Ví dụ: Phòng 3, tầng 2"
  - text: Ghi chú
  - textbox "Ghi chú":
    - /placeholder: Ghi chú nội bộ về lớp này.
  - button "Đang lưu…" [disabled]
  - heading "Ghi danh thiếu nhi" [level=3]
  - paragraph: Mỗi em chỉ có một lớp đang mở trong năm học.
  - text: Tìm thiếu nhi theo tên hoặc mã
  - searchbox "Tìm thiếu nhi theo tên hoặc mã"
  - paragraph: Gõ không dấu cũng tìm được.
  - button "Tìm"
  - text: Thiếu nhi
  - combobox "Thiếu nhi":
    - option "Chọn thiếu nhi" [disabled] [selected]
    - option "Maria Em chưa ghi danh 1"
    - option "Maria Em chưa ghi danh 2"
    - option "Giuse Em E2E 2-1"
  - text: Ngày ghi danh
  - textbox "Ngày ghi danh": 2026-08-13
  - button "Ghi danh"
- alert
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
> 68  |   await expect(page.getByText(`Trạng thái hiện tại: ${status}`)).toBeVisible({ timeout: 45_000 });
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  69  |   await page.reload();
  70  |   // `class_status` dùng `inactive`; `paused` là enum của ghi danh. Nhãn UI vẫn
  71  |   // là “Tạm ngưng”, nhưng assertion phải kiểm đúng giá trị hợp đồng của lớp.
  72  |   const expectedValue = status === "Đang hoạt động" ? "active" : status === "Tạm ngưng" ? "inactive" : "closed";
  73  |   await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue(expectedValue);
  74  | }
  75  | 
  76  | test.describe("M02-B · chi tiết lớp và cài đặt lớp", () => {
  77  |   test("trang chi tiết lớp nói rõ năm học và trạng thái năm học (BR-M02-N10)", async ({ page }) => {
  78  |     await login(page, GROUP_LEADER);
  79  |     await openClass(page, CLASS_WITH_STUDENTS);
  80  | 
  81  |     // Trước M02-B, mã năm nằm lẫn trong phụ đề và KHÔNG có trạng thái năm học ở đâu
  82  |     // cả. Neo vào ĐÚNG phụ đề: mã năm học còn xuất hiện ở thanh đầu trang và ở
  83  |     // breadcrumb nữa, nên `getByText("Năm học 2026-2027")` khớp bốn phần tử.
  84  |     await expect(page.getByText(`Năm học ${SEEDED_YEAR_CODE} · Đang áp dụng`)).toBeVisible();
  85  |     // Năm đang áp dụng ⇒ KHÔNG có dải cảnh báo nào. Dải hiện ở mọi trang lớp chỉ
  86  |     // dạy người dùng cách phớt lờ nó.
  87  |     await expect(page.getByText("chỉ đọc")).toHaveCount(0);
  88  |     // I6: biểu mẫu cài đặt lớp có mặt cho vai trò ghi toàn xứ đoàn.
  89  |     await expect(settingsForm(page)).toBeVisible();
  90  |   });
  91  | 
  92  |   test("đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại", async ({ page }, testInfo) => {
  93  |     test.setTimeout(120_000);
  94  |     const className = TOGGLED_CLASS_BY_PROJECT[testInfo.project.name] ?? "Nghĩa 2";
  95  |     await login(page, GROUP_LEADER);
  96  |     await openClass(page, className);
  97  | 
  98  |     // `updateClass` viết xong từ Phase 1 mà KHÔNG màn hình nào gọi (5W-F08). Đây là
  99  |     // bài chứng minh nó đã có call site thật.
  100 |     try {
  101 |       await saveStatus(page, "Tạm ngưng");
  102 | 
  103 |       // BR-M02-N12 — huy hiệu phải nhìn ra được từ danh sách, bằng CHỮ chứ không
  104 |       // phải chấm màu.
  105 |       await page.goto("/classes");
  106 |       const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  107 |       await expect(card).toContainText("Tạm ngưng", { timeout: 20_000 });
  108 |     } finally {
  109 |       // Cleanup phải chạy cả khi assertion ở giữa thất bại. Nếu để lớp tạm
  110 |       // ngưng, các fixture M07/M13 dùng lại lớp đó sẽ đỏ dây chuyền với
  111 |       // CLASS_NOT_ACTIVE và che mất nguyên nhân đầu tiên.
  112 |       await openClass(page, className);
  113 |       await saveStatus(page, "Đang hoạt động");
  114 |     }
  115 | 
  116 |     // Lớp đang hoạt động thì KHÔNG có huy hiệu — 19/19 lớp đều gắn thì huy hiệu mất
  117 |     // giá trị báo hiệu đúng lúc cần nó nhất.
  118 |     await page.goto("/classes");
  119 |     const restored = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  120 |     await expect(restored).not.toContainText("Tạm ngưng", { timeout: 20_000 });
  121 |   });
  122 | 
  123 |   test("đóng lớp còn thiếu nhi: hộp xác nhận nêu SỐ EM và TÊN LỚP (BR-M02-N11)", async ({ page }) => {
  124 |     await login(page, GROUP_LEADER);
  125 |     await openClass(page, CLASS_WITH_STUDENTS);
  126 | 
  127 |     const form = settingsForm(page);
  128 |     await form.getByLabel("Trạng thái lớp").selectOption({ label: "Đã đóng" });
  129 |     await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();
  130 | 
  131 |     // 11 §5 — hậu quả nêu bằng tên riêng, không phải "Bạn có chắc không?".
  132 |     const dialog = page.getByRole("dialog");
  133 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  134 |     await expect(dialog).toContainText("em đang sinh hoạt");
  135 |     await expect(dialog).toContainText(/không.*kết thúc ghi danh/i);
  136 | 
  137 |     // Huỷ: bài này KHÔNG được đóng lớp có thiếu nhi của cả hệ thống.
  138 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  139 |     await expect(dialog).toHaveCount(0);
  140 |     await page.reload();
  141 |     await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue("active");
  142 |   });
  143 | 
  144 |   test("Trưởng ngành ghi danh được nhưng KHÔNG sửa được cài đặt lớp", async ({ page }) => {
  145 |     await login(page, SECTOR_LEADER_AU);
  146 |     await openClass(page, CLASS_WITH_STUDENTS);
  147 | 
  148 |     // Hai nhóm quyền tách riêng có chủ ý: `ENROLLMENT_WRITE_ROLES` gồm Trưởng ngành,
  149 |     // `classes_update_global_write` thì không. Gộp làm một là hoặc cho họ bấm một
  150 |     // nút RLS sẽ chặn, hoặc cắt mất quyền ghi danh của họ.
  151 |     await expect(page.getByRole("heading", { name: "Ghi danh thiếu nhi" })).toBeVisible();
  152 |     await expect(settingsForm(page)).toHaveCount(0);
  153 |     // Nhưng vẫn ĐỌC được cài đặt: ẩn cả sự thật thì họ không biết lớp mình họp ở đâu.
  154 |     await expect(page.getByText("Phòng sinh hoạt:")).toBeVisible();
  155 |   });
  156 | });
  157 | 
  158 | test.describe("M02-B · mốc kết thúc học kỳ 1 (D-71)", () => {
  159 |   test("lưu mốc, chặn ngày ngoài năm học, rồi xoá lại", async ({ page }) => {
  160 |     test.setTimeout(120_000);
  161 |     await login(page, SUPER_ADMIN);
  162 |     await page.goto("/admin");
  163 | 
  164 |     const card = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
  165 |     const milestone = card.getByLabel("Ngày kết thúc học kỳ 1");
  166 |     await expect(milestone).toBeVisible();
  167 | 
  168 |     // Lớp chặn thứ nhất là của chính trình duyệt: `min`/`max` đọc từ năm học, khớp
```