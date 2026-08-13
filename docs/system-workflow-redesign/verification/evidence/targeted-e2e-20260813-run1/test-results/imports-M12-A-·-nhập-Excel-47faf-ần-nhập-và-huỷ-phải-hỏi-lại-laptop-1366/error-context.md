# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> M12-A · nhập Excel >> 🔴 AC-14 + AC-17: tải lên xong vào thẳng lần nhập, và huỷ phải hỏi lại
- Location: tests\e2e\imports.spec.ts:200:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã huỷ lần nhập này/)
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText(/Đã huỷ lần nhập này/)

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
        - link "Nhập dữ liệu Excel":
          - /url: /imports
      - listitem: Lần nhập
  - paragraph: Nhập dữ liệu Excel
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Trần Xuân Đoàn
- main:
  - heading "M12A-laptop-1366.xlsx" [level=1]
  - paragraph: 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0
  - heading "Xác nhận ghi vào hệ thống" [level=3]
  - text: Đã kiểm tra, chờ xác nhận Tải lên 13/08/2026 13:28 · bởi Trần Xuân Đoàn
  - paragraph: 2 dòng sẽ được ghi. Dòng lỗi không được ghi; hãy sửa file rồi tải lại.
  - button "Ghi 2 dòng vào hệ thống"
  - button "Đang huỷ…" [disabled]
  - link "Tải file lỗi / kết quả":
    - /url: /imports/f2c1d08a-ef56-4245-88a5-a76b9145a499/errors
  - link "← Danh sách lần nhập":
    - /url: /imports
  - paragraph:
    - text: "File tải về có hai sheet:"
    - strong: LOI
    - text: liệt kê dòng còn lỗi hoặc cảnh báo để gửi cho Giáo lý viên lớp bổ sung,
    - strong: KET_QUA
    - text: ghi dòng nào đã thành hồ sơ nào (mã thiếu nhi).
  - heading "Chi tiết từng dòng" [level=2]
  - group "Lọc dòng của lần nhập":
    - text: Lọc dòng của lần nhập Trạng thái dòng
    - combobox "Trạng thái dòng":
      - option "Tất cả" [selected]
      - option "Lỗi"
      - option "Cảnh báo"
      - option "Hợp lệ"
      - option "Đã ghi"
      - option "Bỏ qua"
    - button "Lọc"
  - form "Sửa dòng của lần nhập":
    - table "Danh sách dòng của lần nhập — chọn giới tính và cách xử lý cho từng dòng, rồi lưu một lượt.":
      - caption: Danh sách dòng của lần nhập — chọn giới tính và cách xử lý cho từng dòng, rồi lưu một lượt.
      - rowgroup:
        - row "Chọn dòng Chọn tất cả dòng của trang này Dòng Họ tên Trạng thái Giới tính Xử lý":
          - columnheader "Chọn dòng Chọn tất cả dòng của trang này":
            - text: Chọn dòng
            - checkbox "Chọn tất cả dòng của trang này"
          - columnheader "Dòng"
          - columnheader "Họ tên"
          - columnheader "Trạng thái"
          - columnheader "Giới tính"
          - columnheader "Xử lý"
      - rowgroup:
        - 'row "Chọn dòng 2 #2 Test Nhap Mot laptop1366 Lớp: Ấu 1A Cảnh báo Nữ Tạo mới"':
          - cell "Chọn dòng 2":
            - checkbox "Chọn dòng 2"
            - text: Chọn dòng 2
          - cell "#2"
          - 'cell "Test Nhap Mot laptop1366 Lớp: Ấu 1A"'
          - cell "Cảnh báo"
          - cell "Nữ"
          - cell "Tạo mới":
            - combobox "Cách xử lý dòng 2":
              - option "Tạo mới" [selected]
              - option "Ghép hồ sơ có sẵn" [disabled]
              - option "Bỏ qua"
        - row:
          - cell:
            - group: "Dòng #2 — chi tiết"
      - rowgroup:
        - 'row "Chọn dòng 3 #3 Test Nhap Hai laptop1366 Lớp: Ấu 1A Cảnh báo Nữ Tạo mới"':
          - cell "Chọn dòng 3":
            - checkbox "Chọn dòng 3"
            - text: Chọn dòng 3
          - cell "#3"
          - 'cell "Test Nhap Hai laptop1366 Lớp: Ấu 1A"'
          - cell "Cảnh báo"
          - cell "Nữ"
          - cell "Tạo mới":
            - combobox "Cách xử lý dòng 3":
              - option "Tạo mới" [selected]
              - option "Ghép hồ sơ có sẵn" [disabled]
              - option "Bỏ qua"
        - row:
          - cell:
            - group: "Dòng #3 — chi tiết"
    - paragraph: Đánh dấu vài dòng rồi áp dụng giới tính cho cả nhóm.
    - button "Áp dụng Nam cho dòng đang chọn"
    - button "Áp dụng Nữ cho dòng đang chọn"
    - button "Lưu tất cả thay đổi"
- alert
```

# Test source

```ts
  129 |  * khi hai viewport kia xanh — đúng chữ ký "đổi chỗ giữa các lượt" của nợ ấy.
  130 |  */
  131 | async function clickUntil(what: string, click: () => Promise<void>, done: () => Promise<boolean>) {
  132 |   // 🔴 Ngân sách 60 giây, **không** phải 24 giây như bản gốc ở `attendance.spec.ts`.
  133 |   // Lượt chạy toàn bộ đầu tiên của M12-B đo được: bấm "Xoá lọc" 4 lần trong 24
  134 |   // giây vẫn chưa đi, rồi trang **tự đi** ngay sau đó — ảnh chụp lúc bài rớt cho
  135 |   // thấy đúng trang không lọc với đủ 3 dòng và không còn liên kết "Xoá lọc". Tức
  136 |   // 24 giây nhỏ hơn độ lớn thật của nợ #15: M02-B đã đo 9/72 lượt điều hướng
  137 |   // không chốt trong **45 giây**. Đặt ngân sách nhỏ hơn khuyết tật mình đang chịu
  138 |   // đựng thì con số đỏ nói về đồng hồ bấm giờ chứ không nói về sản phẩm.
  139 |   for (let attempt = 0; attempt < 6; attempt += 1) {
  140 |     if (await done()) return;
  141 |     await click();
  142 |     for (let waited = 0; waited < 20; waited += 1) {
  143 |       await new Promise((resolve) => setTimeout(resolve, 500));
  144 |       if (await done()) return;
  145 |     }
  146 |   }
  147 |   throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
  148 | }
  149 | 
  150 | /** Huỷ lần nhập đang mở để lượt chạy sau bắt đầu từ đúng chỗ cũ. */
  151 | async function cancelOpenBatch(page: Page) {
  152 |   const cancel = page.getByRole("button", { name: "Huỷ lần nhập" });
  153 |   if (!(await cancel.isVisible().catch(() => false))) return;
  154 |   await cancel.click();
  155 |   await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  156 |   await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
  157 | }
  158 | 
  159 | test.describe("M12-A · nhập Excel", () => {
  160 |   /**
  161 |    * 🔴 **Ngưỡng 30 giây mặc định của Playwright là TRẦN CỦA CẢ BÀI**, nên mọi
  162 |    * `expect(…, { timeout: 45_000 })` viết trong bộ này — kể cả những chỗ M12-A
  163 |    * đã viết từ đợt trước — đều bị nó cắt trước khi kịp dùng hết ngân sách của
  164 |    * mình. Lượt chạy toàn bộ của M12-B lộ ra điều đó: bài AC-14 rớt với đúng
  165 |    * thông điệp *"Test timeout of 30000ms exceeded"* trong khi lần nhập **đã nằm
  166 |    * trong cơ sở dữ liệu** — tức đo được đồng hồ bấm giờ chứ không đo được sản
  167 |    * phẩm. Mọi bài ở đây đều tải file lên và ghi thật, tức đúng loại thao tác của
  168 |    * **nợ #10**, nên nới trần cho cả bộ đúng cách `attendance.spec.ts` đã làm.
  169 |    */
  170 |   test.describe.configure({ timeout: 90_000 });
  171 | 
  172 |   test.beforeEach(async ({ page }) => {
  173 |     await login(page, SECRETARY);
  174 |   });
  175 | 
  176 |   test("SEC-01: Giáo lý viên lớp không vào được trang nhập dữ liệu", async ({ page }) => {
  177 |     await login(page, CLASS_TEACHER);
  178 |     await page.goto("/imports");
  179 |     await expect(page).toHaveURL(/\/access-denied$/);
  180 |   });
  181 | 
  182 |   test("🔴 AC-13: file hỏng phải nói ra LÝ DO, không im lặng", async ({ page }) => {
  183 |     await uploadWorkbook(
  184 |       page,
  185 |       "khong-phai-excel.xlsx",
  186 |       Buffer.from("đây là văn bản thường, không phải workbook", "utf8"),
  187 |     );
  188 | 
  189 |     // Câu chữ đến từ `parse.ts`, đã có sẵn từ Phase 2 nhưng chưa ai hiện nó ra.
  190 |     // Neo TRONG biểu mẫu: Next có sẵn một `role="alert"` rỗng để đọc tên trang.
  191 |     const message = page
  192 |       .getByRole("form", { name: "Tải file Excel lên" })
  193 |       .getByRole("alert");
  194 |     await expect(message).toBeVisible({ timeout: 45_000 });
  195 |     await expect(message).toContainText(/Không đọc được file|Không tìm thấy sheet dữ liệu/);
  196 |     // Vẫn ở nguyên trang tải lên, không nhảy đi đâu.
  197 |     await expect(page).toHaveURL(/\/imports$/);
  198 |   });
  199 | 
  200 |   test("🔴 AC-14 + AC-17: tải lên xong vào thẳng lần nhập, và huỷ phải hỏi lại", async ({
  201 |     page,
  202 |   }, testInfo) => {
  203 |     // Tên riêng theo viewport: ba project chạy trên cùng một database.
  204 |     const filename = `M12A-${testInfo.project.name}.xlsx`;
  205 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  206 |     const content = await buildWorkbook([
  207 |       { name: `Test Nhap Mot ${suffix}`, dob: "05/05/2016", phone: "0900123456" },
  208 |       { name: `Test Nhap Hai ${suffix}`, dob: "06/06/2016", phone: "0900123457" },
  209 |     ]);
  210 | 
  211 |     try {
  212 |       await uploadWorkbook(page, filename, content);
  213 | 
  214 |       // AC-14 — vào thẳng trang của lần nhập vừa tạo.
  215 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  216 |       await expect(page.getByRole("heading", { name: filename })).toBeVisible();
  217 |       await expect(page.getByText(/2 dòng/).first()).toBeVisible();
  218 |       await expect(batchRows(page)).toHaveCount(2);
  219 | 
  220 |       // AC-17 — hộp xác nhận nêu tên file và số dòng, và chưa huỷ gì trước đó.
  221 |       await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
  222 |       const dialog = page.getByRole("dialog");
  223 |       await expect(dialog).toBeVisible();
  224 |       await expect(dialog).toContainText(filename);
  225 |       await expect(dialog).toContainText("2");
  226 |       await expect(dialog).toContainText(/giữ lại/);
  227 | 
  228 |       await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
> 229 |       await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  230 | 
  231 |       // D-131 — huỷ là ĐÁNH DẤU: lần nhập vẫn còn trong danh sách.
  232 |       await page.goto("/imports");
  233 |       const card = page
  234 |         .getByRole("list", { name: "Danh sách lần nhập" })
  235 |         .getByRole("listitem")
  236 |         .filter({ hasText: filename })
  237 |         .first();
  238 |       await expect(card).toBeVisible();
  239 |       await expect(card).toContainText("Đã huỷ");
  240 |     } finally {
  241 |       await cancelOpenBatch(page).catch(() => {});
  242 |     }
  243 |   });
  244 | 
  245 |   test("lần nhập đã huỷ không còn nút huỷ, và mở ra vẫn xem lại được", async ({
  246 |     page,
  247 |   }, testInfo) => {
  248 |     const filename = `M12A-xem-lai-${testInfo.project.name}.xlsx`;
  249 |     const content = await buildWorkbook([
  250 |       { name: `Test Xem Lai ${testInfo.project.name}`, dob: "07/07/2016", phone: "0900123458" },
  251 |     ]);
  252 | 
  253 |     await uploadWorkbook(page, filename, content);
  254 |     await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  255 |     const batchUrl = page.url();
  256 | 
  257 |     await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
  258 |     await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  259 |     await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
  260 | 
  261 |     await page.goto(batchUrl);
  262 |     await expect(page.getByText("Đã huỷ").first()).toBeVisible();
  263 |     await expect(page.getByRole("button", { name: "Huỷ lần nhập" })).toHaveCount(0);
  264 |     // 🔴 Và cũng KHÔNG còn nút "Ghi": dòng vẫn ở trạng thái chờ (huỷ là đánh dấu,
  265 |     // không xoá) nhưng `commit_import_rows` ném `BATCH_CANCELLED` — để nút ở đó
  266 |     // là mời người dùng bấm một nút không bao giờ chạy.
  267 |     await expect(page.getByRole("button", { name: /Ghi \d+ dòng/ })).toHaveCount(0);
  268 |     // D-132 — sau khi huỷ thì dọn được dữ liệu thô.
  269 |     await expect(page.getByRole("button", { name: "Xoá dữ liệu thô" })).toBeVisible();
  270 |     // Dòng vẫn còn để tra cứu (BR-M12-35).
  271 |     await expect(batchRows(page)).toHaveCount(1);
  272 |   });
  273 | 
  274 |   test("🔴 AC-21: điền giới tính HÀNG LOẠT — nhiều dòng, một lượt lưu", async ({
  275 |     page,
  276 |   }, testInfo) => {
  277 |     test.setTimeout(180_000);
  278 |     const filename = `M12B-gioi-tinh-${testInfo.project.name}.xlsx`;
  279 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  280 |     // Sổ KHÔNG có cột giới tính — đúng hình dạng sổ SYLL của giáo xứ.
  281 |     const content = await buildWorkbookWithoutGender([
  282 |       { name: `Test Gioi Tinh Mot ${suffix}`, dob: "01/03/2016", phone: "0900223341" },
  283 |       { name: `Test Gioi Tinh Hai ${suffix}`, dob: "02/03/2016", phone: "0900223342" },
  284 |       { name: `Test Gioi Tinh Ba ${suffix}`, dob: "03/03/2016", phone: "0900223343" },
  285 |     ]);
  286 | 
  287 |     try {
  288 |       await uploadWorkbook(page, filename, content);
  289 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 75_000 });
  290 |       await expect(batchRows(page)).toHaveCount(3);
  291 | 
  292 |       // Con số này đếm trong cơ sở dữ liệu, không đếm trên trang đang xem.
  293 |       await expect(page.getByText(/3 dòng.*chưa có giới tính/)).toBeVisible();
  294 | 
  295 |       // Đánh dấu hai dòng rồi áp dụng Nam — điền TẠI CHỖ, chưa gửi gì lên.
  296 |       await page.getByLabel("Chọn dòng 2").check();
  297 |       await page.getByLabel("Chọn dòng 3").check();
  298 |       await expect(page.getByText("2 dòng đang chọn.")).toBeVisible();
  299 |       await page.getByRole("button", { name: "Áp dụng Nam cho dòng đang chọn" }).click();
  300 | 
  301 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveValue("male");
  302 |       await expect(page.getByLabel("Giới tính của dòng 3")).toHaveValue("male");
  303 |       // Dòng không đánh dấu phải nguyên vẹn.
  304 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  305 | 
  306 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  307 |       // 60 giây, không phải 45: lượt lưu hàng loạt là thao tác ghi NẶNG NHẤT của
  308 |       // module, và lượt chạy toàn bộ đo được nó mất tới ~48 giây khi máy đang
  309 |       // chạy hết bộ E2E. ⚠️ Che triệu chứng của nợ #10, không phải chữa.
  310 |       await expect(page.getByText(/Đã lưu 2 dòng/)).toBeVisible({ timeout: 60_000 });
  311 |       await page.reload();
  312 | 
  313 |       // Bằng chứng đã ghi thật: dải cảnh báo tự đếm lại còn đúng một dòng, và
  314 |       // hai dòng vừa lưu không còn ô chọn giới tính nữa.
  315 |       await expect(page.getByText(/1 dòng.*chưa có giới tính/)).toBeVisible({ timeout: 45_000 });
  316 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveCount(0);
  317 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  318 |     } finally {
  319 |       await cancelOpenBatch(page).catch(() => {});
  320 |     }
  321 |   });
  322 | 
  323 |   /**
  324 |    * 🔴 **D-133 phải sống sót qua TO-BE 4.** Chủ dự án chốt 2026-07-29 rằng dòng
  325 |    * trùng chắc chắn phải được xác nhận **từng dòng**; một nút "Lưu tất cả" gộp
  326 |    * luôn chúng là đúng thứ D-133 sinh ra để chặn. Bài này đo cả hai nửa: nút lưu
  327 |    * chung **từ chối** dòng ấy và nói ra, còn nút của riêng dòng thì lưu được.
  328 |    *
  329 |    * Dữ liệu trùng lấy thẳng từ `seed:dev` (CQ0060 — họ tên + ngày sinh + SĐT phụ
```