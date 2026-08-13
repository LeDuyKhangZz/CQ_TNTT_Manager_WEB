# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enrollment-lifecycle.spec.ts >> M03-A · vòng đời ghi danh >> 🔴 tạm nghỉ CHẠY ĐƯỢC, rồi khôi phục về như cũ (AC-F10-01 · F10-02)
- Location: tests\e2e\enrollment-lifecycle.spec.ts:68:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('status').filter({ hasText: 'Đang học' }).first()
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('status').filter({ hasText: 'Đang học' }).first()

```

```yaml
- link "Bỏ qua điều hướng":
  - /url: "#main-content"
- banner:
  - button "Mở menu"
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
  - paragraph: "Đang xem: Huynh Trưởng · Năm học 2026-2027"
  - link "Danh sách lớp":
    - /url: /classes
  - heading "Ấu 1A" [level=1]
  - paragraph: Ấu Nhi · Năm học 2026-2027 · Đang áp dụng
  - heading "Danh sách thiếu nhi" [level=3]
  - paragraph: Sĩ số 2 · trong đó 1 tạm nghỉ
  - list:
    - listitem:
      - link "Giuse Nguyễn Minh An":
        - /url: /students/a622669e-8e82-45bf-a119-31d193fd085f
      - text: Tạm nghỉ
      - button "Đang lưu…" [disabled]
      - combobox "Lý do kết thúc ghi danh của Giuse Nguyễn Minh An":
        - option "Đã rút" [selected]
        - option "Hoàn thành"
        - option "Chuyển lớp"
        - option "Học lại"
      - textbox "Ngày kết thúc ghi danh của Giuse Nguyễn Minh An": 2026-08-13
      - button "Đang lưu…" [disabled]
    - listitem:
      - link "Maria Trần Bảo Châu":
        - /url: /students/fbcd5258-cb66-4142-9556-5450d0b3b844
      - button "Tạm nghỉ"
      - combobox "Lý do kết thúc ghi danh của Maria Trần Bảo Châu":
        - option "Đã rút" [selected]
        - option "Hoàn thành"
        - option "Chuyển lớp"
        - option "Học lại"
      - textbox "Ngày kết thúc ghi danh của Maria Trần Bảo Châu": 2026-08-13
      - button "Kết thúc"
  - heading "Đội ngũ lớp" [level=3]
  - link "Giuse Ngô Đại Diện 1A":
    - /url: /staff/d30e7b2b-9771-47d6-9722-2033c231f9a1
  - text: GLV đại diện
  - link "Lucia Đinh GLV 1A":
    - /url: /staff/b303569a-d434-4cf9-8248-bb37604b004d
  - text: GLV lớp
  - link "Đaminh Trịnh Dự Trưởng":
    - /url: /staff/a946371c-748a-4d39-8a32-3e197a11ae77
  - text: Dự trưởng phụ tá
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
  - button "Lưu cài đặt lớp"
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
  - text: Ngày ghi danh
  - textbox "Ngày ghi danh": 2026-08-13
  - button "Ghi danh"
- navigation "Điều hướng nhanh":
  - list:
    - listitem:
      - link "Trang chủ":
        - /url: /dashboard
    - listitem:
      - link "Thiếu nhi":
        - /url: /students
    - listitem:
      - link "Điểm danh":
        - /url: /attendance
    - listitem:
      - link "Báo cáo":
        - /url: /reports
    - listitem:
      - link "Tài khoản":
        - /url: /account
- alert
```

# Test source

```ts
  4   |  * M03-A · TB-F10 — vòng đời ghi danh: **tạm nghỉ · khôi phục · kết thúc**.
  5   |  *
  6   |  * 🔴 Bài quan trọng nhất của file này là bài đầu tiên. Trước đợt này, chọn "Tạm
  7   |  * nghỉ" **luôn thất bại im lặng**: biểu mẫu "Kết thúc" luôn gửi kèm ngày, mà `paused`
  8   |  * là trạng thái MỞ nên CHECK `enrollments_open_has_no_end` cấm có ngày. Trang tải
  9   |  * lại, em vẫn nằm nguyên trong lớp, **không một dòng thông báo nào** — người dùng
  10  |  * bấm mãi rồi kết luận hệ thống hỏng (F10 = 35/75, `04_SYSTEM_WIDE_FINDINGS.md` §2).
  11  |  *
  12  |  * 🔴 Ba viewport dùng chung MỘT database (`workers: 1`, bài học M04-A). File này
  13  |  * được thiết kế để chạy lại bao nhiêu lượt cũng ra cùng kết quả:
  14  |  *   · bài tạm nghỉ **đi và về** trong cùng một bài (tạm nghỉ → khôi phục);
  15  |  *   · bài hộp xác nhận chỉ **mở rồi Huỷ** ⇒ không ghi gì.
  16  |  * Không bài nào để lại dấu vết, nên ba viewport không giẫm lên nhau dù chỉ có đúng
  17  |  * một lớp có thiếu nhi trong `seed:dev`.
  18  |  */
  19  | const DEV_PASSWORD = "123456";
  20  | /** Ghi toàn xứ đoàn — nằm trong `ENROLLMENT_WRITE_ROLES`. */
  21  | const GROUP_LEADER = "GLV901";
  22  | /** GLV đại diện lớp Ấu 1A — KHÔNG nằm trong `ENROLLMENT_WRITE_ROLES`. */
  23  | const CLASS_REPRESENTATIVE = "GLV909";
  24  | /** Lớp duy nhất có thiếu nhi trong `seed:dev`. */
  25  | const CLASS_WITH_STUDENTS = "Ấu 1A";
  26  | const STUDENT_NAME = "Giuse Nguyễn Minh An";
  27  | 
  28  | async function login(page: Page, username: string) {
  29  |   await page.context().clearCookies();
  30  |   await page.goto("/login");
  31  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  32  |     await page.getByLabel("Tên đăng nhập").fill(username);
  33  |     await page.locator("input#password").fill(DEV_PASSWORD);
  34  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  35  |     try {
  36  |       await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
  37  |       return;
  38  |     } catch {
  39  |       await page.goto("/login");
  40  |     }
  41  |   }
  42  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  43  | }
  44  | 
  45  | /** Mở đúng URL mà thẻ lớp công bố; không phụ thuộc client navigation đang chập chờn. */
  46  | async function openClass(page: Page, className: string) {
  47  |   await page.goto("/classes");
  48  |   const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  49  |   await expect(card).toBeVisible({ timeout: 20_000 });
  50  |   const href = await card.getAttribute("href");
  51  |   expect(href, `thẻ lớp ${className} phải có href`).toMatch(/^\/classes\/[0-9a-f-]{36}$/);
  52  |   await page.goto(href!);
  53  | }
  54  | 
  55  | /**
  56  |  * Dòng của một em trong danh sách — neo theo **vai trò `listitem`**, không phải theo
  57  |  * `<div>`. Danh sách thiếu nhi là một `<ul>` thật (đợt này nâng lên cho đúng ngữ
  58  |  * nghĩa), nên mỗi em là đúng một `listitem`; lọc theo `<div>` thì `.last()` rơi vào
  59  |  * cái `<div>` trong cùng — cái chỉ chứa tên và huy hiệu, không có nút nào.
  60  |  */
  61  | function rosterRow(page: Page, studentName: string) {
  62  |   return page
  63  |     .getByRole("listitem")
  64  |     .filter({ has: page.getByRole("link", { name: studentName, exact: true }) });
  65  | }
  66  | 
  67  | test.describe("M03-A · vòng đời ghi danh", () => {
  68  |   test("🔴 tạm nghỉ CHẠY ĐƯỢC, rồi khôi phục về như cũ (AC-F10-01 · F10-02)", async ({ page }) => {
  69  |     test.setTimeout(120_000);
  70  |     await login(page, GROUP_LEADER);
  71  |     await openClass(page, CLASS_WITH_STUDENTS);
  72  | 
  73  |     const row = rosterRow(page, STUDENT_NAME);
  74  |     await expect(row).toBeVisible({ timeout: 20_000 });
  75  | 
  76  |     // --- Tạm nghỉ ---------------------------------------------------------
  77  |     await row.getByRole("button", { name: "Tạm nghỉ" }).click();
  78  | 
  79  |     // Điều mà bản cũ KHÔNG BAO GIỜ làm được: thao tác thành công và nói ra kết quả.
  80  |     //
  81  |     // 🔴 45 giây, không phải 20 — **nợ #10 vế (a)**, nới ở M03-B sau khi đo. Ba
  82  |     // lượt chạy khác nhau bắt được cùng một hình dạng: nút kẹt ở chữ "Đang lưu…",
  83  |     // tức vòng gọi Server Action **chưa về**, chứ không phải giao diện sai. Đã
  84  |     // loại cơ sở dữ liệu khỏi diện nghi vấn bằng số đo: với **909 thiếu nhi**,
  85  |     // truy vấn nặng nhất của `/students` là **52 ms**, `list_guardian_options`
  86  |     // **47 ms**. Bài nào rớt và ở viewport nào **đổi giữa các lượt**, và chạy
  87  |     // lại thì xanh. Đây KHÔNG phải bằng chứng đã sửa — nguyên nhân gốc vẫn nằm
  88  |     // ở nợ #10/#15 và chưa ai đụng tới.
  89  |     const message = page.getByRole("status").filter({ hasText: "Tạm nghỉ" }).first();
  90  |     await expect(message).toBeVisible({ timeout: 45_000 });
  91  |     await expect(message).toContainText("vẫn thuộc lớp");
  92  |     await page.reload();
  93  | 
  94  |     // D-121 — sĩ số tách hai số. Đây là con số duy nhất trên trang nói ra rằng
  95  |     // lớp không còn nguyên vẹn 2 em đang sinh hoạt.
  96  |     await expect(page.getByText(/trong đó 1 tạm nghỉ/)).toBeVisible({ timeout: 20_000 });
  97  | 
  98  |     // Huy hiệu bằng CHỮ, không phải chấm màu (điều cấm thứ 5).
  99  |     await expect(rosterRow(page, STUDENT_NAME).getByText("Tạm nghỉ", { exact: true }).first()).toBeVisible();
  100 | 
  101 |     // --- Khôi phục --------------------------------------------------------
  102 |     // AC-F10-02: chức năng này CHƯA TỪNG TỒN TẠI trước đợt này (BR-M03-21).
  103 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Khôi phục" }).click();
> 104 |     await expect(page.getByRole("status").filter({ hasText: "Đang học" }).first()).toBeVisible({
      |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  105 |       timeout: 45_000,
  106 |     });
  107 |     await page.reload();
  108 | 
  109 |     // Về đúng trạng thái ban đầu: sĩ số hết vế "trong đó N tạm nghỉ", và KHÔNG tạo
  110 |     // ghi danh thứ hai — nếu có, sĩ số sẽ nhảy lên 3 (AC-F10-02).
  111 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  112 |     // Chữ thường: vế "… tạm nghỉ" của câu sĩ số. Nút mang chữ "Tạm nghỉ" viết hoa
  113 |     // nên không lọt vào phép đếm này.
  114 |     await expect(page.getByText(/tạm nghỉ/)).toHaveCount(0);
  115 |     // Và nút quay lại đúng nhãn ban đầu — em không còn ở trạng thái tạm nghỉ.
  116 |     await expect(rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Tạm nghỉ" })).toBeVisible();
  117 |   });
  118 | 
  119 |   test("ô lý do kết thúc KHÔNG còn mục 'Tạm nghỉ' — gốc rễ của F10", async ({ page }) => {
  120 |     await login(page, GROUP_LEADER);
  121 |     await openClass(page, CLASS_WITH_STUDENTS);
  122 | 
  123 |     const select = page.getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`);
  124 |     await expect(select).toBeVisible({ timeout: 20_000 });
  125 |     const values = await select.locator("option").evaluateAll((options) =>
  126 |       options.map((option) => (option as HTMLOptionElement).value),
  127 |     );
  128 |     expect(values).toEqual(["withdrawn", "completed", "transferred", "repeating"]);
  129 |   });
  130 | 
  131 |   test("kết thúc phải HỎI TRƯỚC, nêu tên em và tên lớp (AC-F10-03)", async ({ page }) => {
  132 |     await login(page, GROUP_LEADER);
  133 |     await openClass(page, CLASS_WITH_STUDENTS);
  134 | 
  135 |     const row = rosterRow(page, STUDENT_NAME);
  136 |     await expect(row).toBeVisible({ timeout: 20_000 });
  137 |     await row.getByRole("button", { name: "Kết thúc", exact: true }).click();
  138 | 
  139 |     // Trước đợt này nút "Kết thúc" nằm ngay cạnh tên từng em và ghi thẳng, không
  140 |     // hỏi gì (C5 = 1 trong biên bản audit).
  141 |     const dialog = page.getByRole("dialog");
  142 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  143 |     await expect(dialog).toContainText(STUDENT_NAME);
  144 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  145 | 
  146 |     // Huỷ ⇒ không ghi gì. Sĩ số phải còn nguyên.
  147 |     await page.getByRole("button", { name: "Huỷ" }).click();
  148 |     await expect(dialog).toBeHidden();
  149 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  150 |   });
  151 | 
  152 |   test("D-122 · lý do 'Chuyển lớp' nói thẳng hệ thống KHÔNG ghi danh em vào lớp mới", async ({ page }) => {
  153 |     await login(page, GROUP_LEADER);
  154 |     await openClass(page, CLASS_WITH_STUDENTS);
  155 | 
  156 |     await page
  157 |       .getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`)
  158 |       .selectOption("transferred");
  159 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Kết thúc", exact: true }).click();
  160 | 
  161 |     const dialog = page.getByRole("dialog");
  162 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  163 |     await expect(dialog).toContainText("CHỈ đóng ghi danh ở lớp hiện tại");
  164 |     await page.getByRole("button", { name: "Huỷ" }).click();
  165 |   });
  166 | 
  167 |   test("GLV lớp KHÔNG được sửa ghi danh — ẩn nút, và RLS vẫn là chốt chặn", async ({ page }) => {
  168 |     await login(page, CLASS_REPRESENTATIVE);
  169 |     await openClass(page, CLASS_WITH_STUDENTS);
  170 | 
  171 |     // GLV đại diện đọc được danh sách lớp mình…
  172 |     await expect(page.getByRole("link", { name: STUDENT_NAME, exact: true })).toBeVisible({
  173 |       timeout: 20_000,
  174 |     });
  175 |     // …nhưng không có nút thao tác nào (`ENROLLMENT_WRITE_ROLES` không có vai này).
  176 |     await expect(page.getByRole("button", { name: "Tạm nghỉ" })).toHaveCount(0);
  177 |     await expect(page.getByRole("button", { name: "Kết thúc", exact: true })).toHaveCount(0);
  178 |   });
  179 | 
  180 |   test("mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)", async ({ page }) => {
  181 |     test.setTimeout(90_000);
  182 |     await login(page, GROUP_LEADER);
  183 |     await page.goto(`/students`);
  184 | 
  185 |     // Sáu thao tác ghi của module trước đợt này đều trả `Promise<void>` — kết quả
  186 |     // bị vứt bỏ ngay tại chỗ nhận (BR-M03-38). Bài này canh đường ngắn nhất:
  187 |     // biểu mẫu tạo phụ huynh, thao tác rẻ nhất và không đụng dữ liệu thiếu nhi.
  188 |     // 🔴 Neo vào ĐÚNG biểu mẫu. `/students` có hai ô mang nhãn bắt đầu bằng "Điện
  189 |     // thoại" (phụ huynh, và "Điện thoại (nếu có)" của thiếu nhi) ⇒ `getByLabel`
  190 |     // khớp hai phần tử. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B và
  191 |     // M04-C — trang nào đông biểu mẫu thì bài test phải neo phạm vi.
  192 |     const suffix = `${Date.now()}`.slice(-6);
  193 |     const form = page.locator("form").filter({ has: page.locator("#guardian-name") });
  194 |     await form.getByLabel("Họ tên phụ huynh").fill(`Phụ huynh E2E ${suffix}`);
  195 |     await form.locator("#guardian-phone").fill(`09${suffix}0000`.slice(0, 10));
  196 |     await form.getByRole("button", { name: "Tạo phụ huynh" }).click();
  197 | 
  198 |     const message = page.getByRole("status").first();
  199 |     // 45 giây — cùng lý do với bài "Tạm nghỉ" ở trên (nợ #10 vế (a)).
  200 |     await expect(message).toBeVisible({ timeout: 45_000 });
  201 |     await expect(message).toContainText(`Phụ huynh E2E ${suffix}`);
  202 |     // Câu thành công phải CHỈ ĐƯỜNG sang việc tiếp theo, không chỉ báo "đã lưu".
  203 |     await expect(message).toContainText("Thêm thiếu nhi");
  204 |   });
```