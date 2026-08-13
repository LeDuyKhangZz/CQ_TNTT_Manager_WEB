# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: committees.spec.ts >> Phase 6 — Ban và thiết bị >> Trưởng ban đăng nội dung, thành viên chỉ đọc, người ngoài Ban không thấy
- Location: tests\e2e\committees.spec.ts:156:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('li').filter({ hasText: 'E2E-P6-3' }).first().getByText('Khả dụng 2/3')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('li').filter({ hasText: 'E2E-P6-3' }).first().getByText('Khả dụng 2/3')

```

```yaml
- link "Bỏ qua điều hướng":
  - /url: "#main-content"
- complementary "Thanh bên ứng dụng":
  - paragraph: Giáo xứ Chợ Quán
  - paragraph: Thiếu Nhi Thánh Thể
  - paragraph: "Đang xem: Ngành Ấu Nhi · Năm học 2026-2027"
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
  - button "Đăng xuất"
- banner:
  - navigation "Đường dẫn trang":
    - list:
      - listitem:
        - link "Trang chủ":
          - /url: /dashboard
      - listitem:
        - link "Ban":
          - /url: /committees
      - listitem: Chi tiết ban
  - paragraph: Ban
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo, 2 chưa đọc":
    - /url: /notifications
    - text: "2"
  - group: Ngô Đại Diện 1A
- main:
  - link "Danh sách Ban":
    - /url: /committees
  - heading "Ban Kỹ thuật" [level=1]
  - paragraph: Âm thanh, ánh sáng, thiết bị và kho mượn/trả.
  - tablist "Nội dung Ban Kỹ thuật":
    - tab "Tổng quan"
    - tab "Thành viên (3)"
    - tab "Thông báo"
    - tab "Lịch họp"
    - tab "Công việc tuần"
    - tab "Thiết bị" [selected]
  - tabpanel "Thiết bị":
    - status: "Thành công: Đã nhận lại 1 cái Đèn sân khấu E2E 3. Phiếu còn nợ 1 cái."
    - heading "Kho thiết bị" [level=3]
    - paragraph: Số lượng khả dụng chỉ thay đổi qua mượn/trả. Tổng kho chỉ thay đổi qua “Nhập thêm”, “Giảm tồn kho” hoặc “Báo hỏng/mất”.
    - list:
      - listitem:
        - paragraph: Đèn sân khấu E2E 1 (E2E-P6-1)
        - paragraph: Khả dụng 4/4 · Ánh sáng · Kho E2E
        - text: Hư hỏng
        - button "Cho mượn"
      - listitem:
        - paragraph: Đèn sân khấu E2E 2 (E2E-P6-2)
        - paragraph: Khả dụng 4/4 · Ánh sáng · Kho E2E
        - text: Hư hỏng
        - button "Cho mượn"
      - listitem:
        - paragraph: Đèn sân khấu E2E 3 (E2E-P6-3)
        - paragraph: Khả dụng 1/3 · Ánh sáng · Kho E2E
        - text: Tốt
        - button "Cho mượn"
      - listitem:
        - paragraph: Loa kéo di động (KT-LOA-01)
        - paragraph: Khả dụng 2/2 · Âm thanh · Kho tầng trệt
        - text: Tốt
        - button "Cho mượn"
      - listitem:
        - paragraph: Micro không dây (KT-MIC-01)
        - paragraph: Khả dụng 4/4 · Âm thanh · Kho tầng trệt
        - text: Tốt
        - button "Cho mượn"
    - heading "Đang mượn" [level=3]
    - paragraph: Nhận lại hàng nhiều lần được; phiếu chỉ đóng khi hết nợ.
    - paragraph: Đèn sân khấu E2E 3 · Đã mượn 2 cái · còn nợ 2
    - paragraph: Cecilia Bùi Phó Thiếu mượn lúc 12/08/2026 13:48
    - button "Nhận lại hàng"
    - button "Báo hỏng/mất"
    - heading "Lịch sử mượn/trả" [level=3]
    - list:
      - listitem:
        - paragraph: Đèn sân khấu E2E 2 · Đã mượn 2 cái · đã nhận lại 1 · hỏng/mất 1
        - paragraph: Cecilia Bùi Phó Thiếu · Đã trả lúc 12/08/2026 13:37 · Hư hỏng
        - paragraph: Vỡ đui đèn khi tháo
      - listitem:
        - paragraph: Đèn sân khấu E2E 1 · Đã mượn 2 cái · đã nhận lại 1 · hỏng/mất 1
        - paragraph: Cecilia Bùi Phó Thiếu · Đã trả lúc 12/08/2026 13:27 · Hư hỏng
        - paragraph: Vỡ đui đèn khi tháo
    - heading "Nhật ký tổng kho" [level=3]
    - paragraph: Mọi lần nhập thêm hoặc giảm tồn kho ngoài phiếu mượn.
    - list:
      - listitem:
        - paragraph: Đèn sân khấu E2E 2 · tăng 2 cái → tổng kho 4
        - paragraph: Mua mới · 12/08/2026 13:37
      - listitem:
        - paragraph: Đèn sân khấu E2E 1 · tăng 2 cái → tổng kho 4
        - paragraph: Mua mới · 12/08/2026 13:27
- alert
```

# Test source

```ts
  11  |  * test tạo ra đều mang chỉ số riêng của project (mã thiết bị, tiêu đề thông
  12  |  * báo, tuần công việc, ngày điểm danh). Không có chỉ số này thì ba project
  13  |  * tranh nhau cùng một dòng và số liệu nhảy loạn.
  14  |  */
  15  | const DEV_PASSWORD = "123456";
  16  | const COMMITTEE_SINH_HOAT = "30000000-0000-0000-0000-000000000001";
  17  | const COMMITTEE_KY_THUAT = "30000000-0000-0000-0000-000000000002";
  18  | 
  19  | const PROJECT_INDEX: Record<string, number> = {
  20  |   "mobile-360": 1,
  21  |   "tablet-768": 2,
  22  |   "laptop-1366": 3,
  23  | };
  24  | 
  25  | function indexOf(testInfo: TestInfo): number {
  26  |   const index = PROJECT_INDEX[testInfo.project.name];
  27  |   if (!index) throw new Error(`Project chưa khai báo chỉ số: ${testInfo.project.name}`);
  28  |   return index;
  29  | }
  30  | 
  31  | let adminClient: SupabaseClient<Database> | null = null;
  32  | 
  33  | function getLocalAdmin(): SupabaseClient<Database> {
  34  |   if (adminClient) return adminClient;
  35  |   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  36  |   const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  37  |   if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
  38  |     throw new Error("E2E Phase 6 chỉ chạy với Supabase local và service role key.");
  39  |   }
  40  |   adminClient = createClient<Database>(url, key, {
  41  |     auth: { persistSession: false, autoRefreshToken: false },
  42  |   });
  43  |   return adminClient;
  44  | }
  45  | 
  46  | async function login(page: Page, username: string) {
  47  |   // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  48  |   // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  49  |   // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu.
  50  |   // Trong ứng dụng thật, đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức
  51  |   // năng đăng xuất vừa được thêm ở A-01, trước đó chưa hề tồn tại nên các spec
  52  |   // cũ mới phải làm vòng này. Mỗi context độc lập nên không đụng phiên khác.
  53  |   await page.context().clearCookies();
  54  |   await page.goto("/login");
  55  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  56  |     await page.getByLabel("Tên đăng nhập").fill(username);
  57  |     await page.locator("input#password").fill(DEV_PASSWORD);
  58  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  59  |     try {
  60  |       await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
  61  |       return;
  62  |     } catch {
  63  |       await page.goto("/login");
  64  |     }
  65  |   }
  66  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  67  | }
  68  | 
  69  | /**
  70  |  * Chọn tuần rồi chờ form nạp xong bản của tuần đó (M09-A).
  71  |  *
  72  |  * 🔴 Ô ngày là controlled component. Điền vào nó **trước khi React hydrate** thì
  73  |  * lần hydrate ngay sau đó đặt lại state về tuần mặc định, ô nội dung trống mãi và
  74  |  * bài test đỏ trong khi ứng dụng hoàn toàn đúng. Đã đo: cùng một bản build,
  75  |  * `mobile-360` xanh còn `tablet-768`/`laptop-1366` đỏ ở đúng dòng này.
  76  |  *
  77  |  * `toPass` lặp lại **cả thao tác lẫn khẳng định**, nên nó chờ đúng thứ cần chờ —
  78  |  * khác với việc nới `timeout` của một khẳng định đơn lẻ, thứ không bao giờ xanh
  79  |  * vì giá trị đã bị đặt lại từ trước.
  80  |  */
  81  | async function selectWeekWithContent(page: Page, weekStart: string, content: string) {
  82  |   await expect(async () => {
  83  |     await page.getByLabel("Tuần bắt đầu (thứ Hai)").fill(weekStart);
  84  |     await expect(page.getByLabel("Nội dung công việc")).toHaveValue(content);
  85  |   }).toPass({ timeout: 15_000 });
  86  | }
  87  | 
  88  | /**
  89  |  * M09-C: trang chi tiết Ban nay là bộ tab (Tổng quan / Thành viên / Thông báo /
  90  |  * Lịch họp / Công việc tuần / Thiết bị). Chỉ panel đang chọn nằm trong DOM, nên
  91  |  * phải mở đúng tab trước khi thao tác — và sau mỗi `reload()` tab quay về mặc
  92  |  * định (Tổng quan), phải mở lại.
  93  |  */
  94  | async function openTab(page: Page, name: string) {
  95  |   await page.getByRole("tab", { name }).click();
  96  |   await expect(page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
  97  | }
  98  | 
  99  | /**
  100 |  * 🔴 Nợ #10 — vì sao một số khẳng định cần ngưỡng chờ dài hơn.
  101 |  *
  102 |  * Sau một thao tác ghi, câu báo thành công hiện NGAY (client state đặt từ kết quả
  103 |  * action), nhưng con số DẪN XUẤT — "Khả dụng 2/2", tiêu đề vừa đăng, nội dung
  104 |  * tuần vừa lưu — chỉ về sau khi `router.refresh()` lấy lại dữ liệu máy chủ. Hai
  105 |  * mốc đó tách nhau đúng một vòng round-trip; dưới tải nặng vòng đó vượt 5 giây mặc
  106 |  * định và bài test rớt ở **một dòng khác nhau mỗi lượt** (đã đo: 205→211→322) dù
  107 |  * ứng dụng hoàn toàn đúng. Nới ngưỡng cho đúng loại "hiện sau khi làm mới" này là
  108 |  * cách trả đúng cho nợ #10 (chờ tới khi làm mới xong, không phải chờ cứng 5 giây).
  109 |  */
  110 | async function expectSoon(locator: Locator) {
> 111 |   await expect(locator).toBeVisible({ timeout: 20_000 });
      |                         ^ Error: expect(locator).toBeVisible() failed
  112 | }
  113 | 
  114 | async function expectNoHorizontalOverflow(page: Page, where: string) {
  115 |   await page.waitForLoadState("domcontentloaded");
  116 |   await page.locator("body").waitFor({ state: "attached" });
  117 |   const overflows = await page.evaluate(
  118 |     () => document.documentElement.scrollWidth > window.innerWidth + 1,
  119 |   );
  120 |   expect(overflows, `${where} không được tràn ngang`).toBe(false);
  121 | }
  122 | 
  123 | async function currentYear() {
  124 |   const admin = getLocalAdmin();
  125 |   const { data } = await admin
  126 |     .from("academic_years")
  127 |     .select("id, start_date, end_date")
  128 |     .eq("status", "current")
  129 |     .single();
  130 |   if (!data) throw new Error("Chưa có năm học hiện hành. Chạy seed:dev trước.");
  131 |   return data;
  132 | }
  133 | 
  134 | async function classIdByName(name: string): Promise<string> {
  135 |   const admin = getLocalAdmin();
  136 |   const year = await currentYear();
  137 |   const { data } = await admin
  138 |     .from("classes")
  139 |     .select("id")
  140 |     .eq("academic_year_id", year.id)
  141 |     .eq("display_name", name)
  142 |     .single();
  143 |   if (!data) throw new Error(`Không tìm thấy lớp ${name}`);
  144 |   return data.id;
  145 | }
  146 | 
  147 | /** Thứ Năm thứ `offset` kể từ đầu năm học — mỗi project một ngày riêng. */
  148 | function thursdayInYear(startDate: string, offset: number): string {
  149 |   const date = new Date(`${startDate}T00:00:00Z`);
  150 |   while (date.getUTCDay() !== 4) date.setUTCDate(date.getUTCDate() + 1);
  151 |   date.setUTCDate(date.getUTCDate() + offset * 7);
  152 |   return date.toISOString().slice(0, 10);
  153 | }
  154 | 
  155 | test.describe("Phase 6 — Ban và thiết bị", () => {
  156 |   test("Trưởng ban đăng nội dung, thành viên chỉ đọc, người ngoài Ban không thấy", async ({ page }, testInfo) => {
  157 |     const index = indexOf(testInfo);
  158 |     const admin = getLocalAdmin();
  159 |     // Chạy lại suite trên cùng một DB là chuyện thường; tiêu đề mang dấu thời
  160 |     // gian để lần chạy trước không làm locator khớp nhiều phần tử.
  161 |     const runId = Date.now().toString(36);
  162 |     const assetCode = `E2E-P6-${index}`;
  163 |     const announcementTitle = `Thông báo Ban E2E ${index}-${runId}`;
  164 |     const meetingTitle = `Họp Ban E2E ${index}-${runId}`;
  165 |     // Mỗi Ban chỉ có một bản công việc cho mỗi tuần, nên mỗi project một tuần.
  166 |     const weekStart = `2026-10-${String(5 + (index - 1) * 7).padStart(2, "0")}`;
  167 | 
  168 |     // 🔴 Bộ E2E phải chạy lại được trên cùng một DB — bài học M14-A với
  169 |     // `results.spec.ts`. Bản công việc tuần còn sót từ lượt trước biến bước
  170 |     // "Tạo công việc tuần" thành "Cập nhật công việc tuần" và bài test đỏ oan,
  171 |     // trong khi ứng dụng hoàn toàn đúng.
  172 |     await admin
  173 |       .from("committee_weekly_plans")
  174 |       .delete()
  175 |       .eq("committee_id", COMMITTEE_SINH_HOAT)
  176 |       .eq("week_start", weekStart);
  177 | 
  178 |     // Thiết bị riêng cho project này để ba viewport không trừ kho của nhau.
  179 |     // Phiếu mượn tham chiếu thiết bị bằng ON DELETE RESTRICT nên phải dọn trước.
  180 |     const { data: staleItem } = await admin
  181 |       .from("equipment_items")
  182 |       .select("id")
  183 |       .eq("asset_code", assetCode)
  184 |       .maybeSingle();
  185 |     if (staleItem) {
  186 |       // 🔴 Thứ tự này là bắt buộc và đã suýt làm bộ test chỉ chạy được MỘT lần
  187 |       // sau mỗi `db:reset` (đúng bài học `results.spec.ts` ở M14-A):
  188 |       // `equipment_stock_adjustments` tham chiếu thiết bị bằng ON DELETE RESTRICT
  189 |       // — cố ý, vì nhật ký kho không được biến mất chỉ vì ai đó xoá thiết bị.
  190 |       // `equipment_loan_events` thì cascade theo phiếu mượn nên không cần dọn.
  191 |       await admin.from("equipment_stock_adjustments").delete().eq("equipment_item_id", staleItem.id);
  192 |       await admin.from("equipment_loans").delete().eq("equipment_item_id", staleItem.id);
  193 |       await admin.from("equipment_items").delete().eq("id", staleItem.id);
  194 |     }
  195 |     const { error: itemError } = await admin.from("equipment_items").insert({
  196 |       committee_id: COMMITTEE_KY_THUAT,
  197 |       asset_code: assetCode,
  198 |       name: `Đèn sân khấu E2E ${index}`,
  199 |       category: "Ánh sáng",
  200 |       total_quantity: 3,
  201 |       available_quantity: 3,
  202 |       storage_location: "Kho E2E",
  203 |     });
  204 |     expect(itemError, "tạo thiết bị fixture").toBeNull();
  205 | 
  206 |     // ── GLV909: Trưởng Ban Sinh hoạt, đồng thời là thành viên Ban Kỹ thuật ──
  207 |     await login(page, "GLV909");
  208 |     await page.goto("/committees");
  209 |     const main = page.getByRole("main");
  210 |     await expect(main.getByRole("heading", { name: "Ban", exact: true })).toBeVisible();
  211 |     await expect(page.getByText("Ban Sinh hoạt")).toBeVisible();
```