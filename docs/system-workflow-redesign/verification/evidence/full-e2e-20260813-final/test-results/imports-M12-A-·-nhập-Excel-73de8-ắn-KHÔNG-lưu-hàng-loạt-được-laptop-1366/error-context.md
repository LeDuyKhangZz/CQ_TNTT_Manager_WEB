# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> M12-A · nhập Excel >> 🔴 D-133: dòng trùng chắc chắn KHÔNG lưu hàng loạt được
- Location: tests\e2e\imports.spec.ts:332:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã lưu 1 dòng/)
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText(/Đã lưu 1 dòng/)

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
  - heading "M12B-trung-laptop-1366.xlsx" [level=1]
  - paragraph: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
  - heading "Xác nhận ghi vào hệ thống" [level=3]
  - text: Đã kiểm tra, chờ xác nhận Tải lên 13/08/2026 14:12 · bởi Trần Xuân Đoàn
  - paragraph:
    - strong: 1 dòng
    - text: nghi trùng chắc chắn với hồ sơ đã có (#2). Hãy mở từng dòng, đối chiếu hồ sơ rồi bấm
    - emphasis: Xác nhận dòng
    - text: — chưa xác nhận hết thì chưa ghi được.
  - paragraph: 1 dòng sẽ được ghi. Dòng lỗi không được ghi; hãy sửa file rồi tải lại.
  - button "Ghi 1 dòng vào hệ thống"
  - button "Huỷ lần nhập"
  - link "Tải file lỗi / kết quả":
    - /url: /imports/c3888f42-1934-49f7-929f-2af787fa9eb5/errors
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
        - 'row "Chọn dòng 2 #2 Nguyễn Minh An Lớp: Ấu 1A Cảnh báo Chờ xác nhận trùng Nữ Ghép hồ sơ có sẵn"':
          - cell "Chọn dòng 2":
            - checkbox "Chọn dòng 2"
            - text: Chọn dòng 2
          - cell "#2"
          - 'cell "Nguyễn Minh An Lớp: Ấu 1A"'
          - cell "Cảnh báo Chờ xác nhận trùng"
          - cell "Nữ"
          - cell "Ghép hồ sơ có sẵn":
            - combobox "Cách xử lý dòng 2":
              - option "Tạo mới"
              - option "Ghép hồ sơ có sẵn" [selected]
              - option "Bỏ qua"
        - row:
          - cell:
            - group:
              - text: "Dòng #2 — đối chiếu hồ sơ nghi trùng"
              - list:
                - listitem: Có số điện thoại nhưng thiếu tên phụ huynh.
                - listitem: "[high] Trùng họ tên, ngày sinh và SĐT phụ huynh với CQ0001. Hãy chọn cách xử lý cho dòng này rồi bấm Lưu."
              - paragraph: Hồ sơ đã có trong hệ thống
              - paragraph: CQ0001 · Nguyễn Minh An · sinh 12/03/2017 · SĐT phụ huynh 0912000001
              - paragraph:
                - text: "Trạng thái hồ sơ:"
                - strong: Đang sinh hoạt
              - link "Mở hồ sơ CQ0001 để đối chiếu":
                - /url: /students/2fe25c13-1833-41c6-90b2-667f90b3a7f7
              - 'button "Xác nhận dòng #2" [disabled]'
    - paragraph: Đánh dấu vài dòng rồi áp dụng giới tính cho cả nhóm.
    - button "Áp dụng Nam cho dòng đang chọn" [disabled]
    - button "Áp dụng Nữ cho dòng đang chọn" [disabled]
    - button "Đang lưu…" [disabled]
    - status: "Thông tin: Không có thay đổi nào để lưu. Còn 1 dòng nghi trùng chắc chắn (#2) chưa lưu cách xử lý: mở dòng đó ra, đối chiếu hồ sơ đã có rồi bấm \"Xác nhận dòng này\". Cách xử lý của dòng trùng chắc chắn không lưu hàng loạt được."
- alert
```

# Test source

```ts
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
  330 |    * huynh khớp cả ba ⇒ mức `high`), nên bài không cần tạo hồ sơ thiếu nhi nào.
  331 |    */
  332 |   test("🔴 D-133: dòng trùng chắc chắn KHÔNG lưu hàng loạt được", async ({ page }, testInfo) => {
  333 |     const filename = `M12B-trung-${testInfo.project.name}.xlsx`;
  334 |     const content = await buildWorkbook([
  335 |       // Trùng cả ba với CQ0060 của seed:dev.
  336 |       { name: "Nguyễn Minh An", dob: "12/03/2017", phone: "0912000001" },
  337 |     ]);
  338 | 
  339 |     try {
  340 |       await uploadWorkbook(page, filename, content);
  341 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  342 | 
  343 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  344 |       await expect(page.getByText(/1 dòng.*nghi trùng chắc chắn/)).toBeVisible();
  345 |       // Mặc định an toàn của M12-A vẫn đứng: Ghép, không phải Tạo mới.
  346 |       await expect(page.getByLabel("Cách xử lý dòng 2")).toHaveValue("merge");
  347 | 
  348 |       // Nửa thứ nhất: nút lưu chung phải TỪ CHỐI dòng này và nói ra lý do.
  349 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  350 |       await expect(page.getByText(/Còn 1 dòng nghi trùng chắc chắn/)).toBeVisible({
  351 |         timeout: 45_000,
  352 |       });
  353 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  354 | 
  355 |       // Nửa thứ hai: nút của riêng dòng thì lưu được, và dấu chặn biến mất.
  356 |       // Nút ấy nằm trong khối `<details>` đóng sẵn — phải mở ra mới bấm được, và
  357 |       // đó chính là điều D-133 muốn: người duyệt **nhìn hồ sơ đối chiếu** trước.
  358 |       await page.getByText(/Dòng #2 .* đối chiếu hồ sơ nghi trùng/).click();
  359 |       await page.getByRole("button", { name: "Xác nhận dòng #2" }).click();
> 360 |       await expect(page.getByText(/Đã lưu 1 dòng/)).toBeVisible({ timeout: 45_000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  361 |       await expect(page.getByText("Chờ xác nhận trùng")).toHaveCount(0);
  362 |       await expect(page.getByText(/nghi trùng chắc chắn với hồ sơ đã có/)).toHaveCount(0);
  363 |     } finally {
  364 |       await cancelOpenBatch(page).catch(() => {});
  365 |     }
  366 |   });
  367 | 
  368 |   test("🔴 AC-25: lọc dòng theo trạng thái", async ({ page }, testInfo) => {
  369 |     const filename = `M12B-loc-${testInfo.project.name}.xlsx`;
  370 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  371 |     const content = await buildWorkbook([
  372 |       { name: `Test Loc Mot ${suffix}`, dob: "04/04/2016", phone: "0900223351" },
  373 |       { name: `Test Loc Hai ${suffix}`, dob: "05/04/2016", phone: "0900223352" },
  374 |       // Thiếu ngày sinh ⇒ dòng lỗi. Một lần nhập thật luôn có cả hai loại dòng.
  375 |       { name: `Test Loc Ba ${suffix}`, dob: "", phone: "0900223353" },
  376 |     ]);
  377 | 
  378 |     try {
  379 |       await uploadWorkbook(page, filename, content);
  380 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  381 |       await expect(batchRows(page)).toHaveCount(3);
  382 | 
  383 |       await page.getByLabel("Trạng thái dòng").selectOption("error");
  384 |       await clickUntil(
  385 |         "Lọc theo trạng thái Lỗi",
  386 |         () => page.getByRole("button", { name: "Lọc" }).click(),
  387 |         async () => (await batchRows(page).count()) === 1,
  388 |       );
  389 |       await expect(page).toHaveURL(/status=error/);
  390 |       await expect(batchRows(page)).toHaveCount(1);
  391 | 
  392 |       // Bộ lọc phải **chép được**: mở thẳng đường dẫn ra đúng kết quả ấy.
  393 |       const filteredUrl = page.url();
  394 |       await page.goto(filteredUrl);
  395 |       await expect(batchRows(page)).toHaveCount(1);
  396 | 
  397 |       await clickUntil(
  398 |         "Xoá lọc",
  399 |         () => page.getByRole("link", { name: "Xoá lọc" }).click(),
  400 |         async () => (await batchRows(page).count()) === 3,
  401 |       );
  402 |       await expect(batchRows(page)).toHaveCount(3);
  403 |     } finally {
  404 |       await cancelOpenBatch(page).catch(() => {});
  405 |     }
  406 |   });
  407 | 
  408 |   test("🔴 TO-BE 7: danh sách lần nhập nói ai tải lên và lọc được theo năm học", async ({
  409 |     page,
  410 |   }, testInfo) => {
  411 |     const filename = `M12B-danh-sach-${testInfo.project.name}.xlsx`;
  412 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  413 |     const content = await buildWorkbook([
  414 |       { name: `Test Danh Sach ${suffix}`, dob: "06/04/2016", phone: "0900223361" },
  415 |     ]);
  416 | 
  417 |     try {
  418 |       await uploadWorkbook(page, filename, content);
  419 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  420 | 
  421 |       await page.goto("/imports");
  422 |       const card = page
  423 |         .getByRole("list", { name: "Danh sách lần nhập" })
  424 |         .getByRole("listitem")
  425 |         .filter({ hasText: filename })
  426 |         .first();
  427 |       await expect(card).toBeVisible();
  428 |       // TO-BE 7 — người tải lên. Trước đợt này danh sách không nói ai tải file.
  429 |       await expect(card).toContainText(/bởi .+/);
  430 | 
  431 |       // D-135 — mặc định là năm học hiện hành, và màn hình nói ra phạm vi ấy.
  432 |       await expect(page.getByText(/Đang xem năm học/)).toBeVisible();
  433 | 
  434 |       await page.getByLabel("Năm học").selectOption("all");
  435 |       await page.getByRole("button", { name: "Lọc" }).click();
  436 |       await expect(page).toHaveURL(/year=all/);
  437 |       await expect(page.getByText(/Đang xem mọi năm học/)).toBeVisible();
  438 |       await expect(
  439 |         page
  440 |           .getByRole("list", { name: "Danh sách lần nhập" })
  441 |           .getByRole("listitem")
  442 |           .filter({ hasText: filename })
  443 |           .first(),
  444 |       ).toBeVisible();
  445 |     } finally {
  446 |       await page.goto("/imports").catch(() => {});
  447 |       const link = page.getByRole("link", { name: new RegExp(filename.replace(/\./g, "\\.")) });
  448 |       await link
  449 |         .first()
  450 |         .click()
  451 |         .catch(() => {});
  452 |       await cancelOpenBatch(page).catch(() => {});
  453 |     }
  454 |   });
  455 | 
  456 |   test("vùng chạm của trang lần nhập đạt 44px và không tràn ngang", async ({ page }, testInfo) => {
  457 |     await page.goto("/imports");
  458 |     const viewport = page.viewportSize();
  459 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  460 |     expect(scrollWidth).toBeLessThanOrEqual((viewport?.width ?? 360) + 1);
```