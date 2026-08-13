# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-lifecycle.spec.ts >> TB-F12 · quản lý người giám hộ >> BR-M03-N15: sửa được số điện thoại phụ huynh (lỗi F12 — 31/75)
- Location: tests\e2e\student-lifecycle.spec.ts:318:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã lưu thông tin liên lạc của/)
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText(/Đã lưu thông tin liên lạc của/)

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
        - link "Thiếu nhi":
          - /url: /students
      - listitem: Hồ sơ thiếu nhi
  - paragraph: Thiếu nhi
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Trần Xuân Đoàn
- main:
  - heading "Maria Trần Bảo Châu" [level=1]
  - paragraph: Mã thiếu nhi CQ0002
  - link "← Danh sách thiếu nhi":
    - /url: /students
  - paragraph: Người giám hộ
  - paragraph: Trần Thị Bốn · 0912999888
  - text: Lớp Ấu 1A Đang sinh hoạt
  - navigation:
    - link "Tổng quan":
      - /url: /students/c6802aab-b064-4044-93bb-2cfed3974fa0
    - link "Lịch sử lớp":
      - /url: /students/c6802aab-b064-4044-93bb-2cfed3974fa0?tab=history
    - link "Bí tích":
      - /url: /students/c6802aab-b064-4044-93bb-2cfed3974fa0?tab=sacraments
    - link "Sức khỏe":
      - /url: /students/c6802aab-b064-4044-93bb-2cfed3974fa0?tab=health
  - heading "Thông tin" [level=3]
  - paragraph: "Tên thánh: Maria"
  - paragraph: "Họ tên: Trần Bảo Châu"
  - paragraph: "Giới tính: Nữ"
  - paragraph: "Ngày sinh: 05/07/2017"
  - paragraph: "Bổn mạng: —"
  - paragraph: "Điện thoại: —"
  - paragraph: "Địa chỉ: —"
  - paragraph: "Ghi chú: —"
  - heading "Cập nhật hồ sơ" [level=3]
  - paragraph: Chỉnh sửa thông tin cơ bản của thiếu nhi.
  - text: Tên thánh
  - textbox "Tên thánh": Maria
  - text: Giới tính
  - combobox "Giới tính":
    - option "Nam"
    - option "Nữ" [selected]
    - option "Khác"
  - text: Họ tên
  - textbox "Họ tên": Trần Bảo Châu
  - text: Ngày sinh
  - textbox "Ngày sinh": 2017-07-05
  - text: Bổn mạng
  - textbox "Bổn mạng"
  - text: Điện thoại
  - textbox "Điện thoại"
  - text: Địa chỉ
  - textbox "Địa chỉ"
  - text: Ghi chú
  - textbox "Ghi chú"
  - checkbox "Hoàn cảnh khó khăn"
  - text: Hoàn cảnh khó khăn
  - button "Lưu thay đổi"
  - heading "Người giám hộ" [level=3]
  - paragraph: Số điện thoại ở đây là số gọi khi em cần giúp đỡ giữa buổi học.
  - form "Sửa thông tin người giám hộ của Maria Trần Bảo Châu":
    - text: Họ tên phụ huynh
    - textbox "Họ tên phụ huynh": Trần Thị Bốn
    - text: Điện thoại
    - textbox "Điện thoại": "0912000002"
    - text: Địa chỉ
    - textbox "Địa chỉ": 45 Nguyễn Trãi, Q5
    - text: Trạng thái hồ sơ phụ huynh
    - combobox "Trạng thái hồ sơ phụ huynh":
      - option "Đang sử dụng" [selected]
      - option "Ngừng sử dụng"
    - button "Đang lưu…" [disabled]
  - form "Đổi người giám hộ của Maria Trần Bảo Châu":
    - text: Đổi sang người giám hộ khác
    - combobox "Đổi sang người giám hộ khác":
      - option "Đinh GLV 1A · 0901000010" [selected]
      - option "Người giám hộ chưa có con 1 · 84918888102"
      - option "Người giám hộ chưa có con 2 · 84918888202"
      - option "Người giám hộ chưa có con 3 · 84918888302"
      - option "Người giám hộ chưa ghi danh 1 · 84918888103"
      - option "Người giám hộ chưa ghi danh 2 · 84918888203"
      - option "Người giám hộ chưa ghi danh 3 · 84918888303"
      - option "Nguyễn Văn Ba · 0912000001"
      - option "Phụ huynh E2E 1 · 84919999991"
      - option "Phụ huynh E2E 160563 · 0916056300"
      - option "Phụ huynh E2E 2 · 84919999992"
      - option "Phụ huynh E2E 3 · 84919999993"
      - option "Phụ huynh E2E 400732 · 0940073200"
      - option "Phụ huynh E2E 894547 · 0989454700"
      - option "Phụ huynh E2E không tài khoản · 0912999999"
    - paragraph: Thao tác này đổi ngay ai xem được Maria Trần Bảo Châu trong cổng phụ huynh.
    - button "Đang đổi…" [disabled]
  - heading "Trạng thái hồ sơ" [level=3]
  - paragraph: Đổi trạng thái hồ sơ cũng đổi chỗ của em trong lớp — hệ thống nói rõ hệ quả trước khi ghi.
  - form "Trạng thái hồ sơ của Maria Trần Bảo Châu":
    - text: Trạng thái hồ sơ
    - combobox "Trạng thái hồ sơ":
      - option "Đang sinh hoạt" [selected]
      - option "Tạm nghỉ"
      - option "Đã rút"
      - option "Lưu trữ"
    - button "Đổi trạng thái hồ sơ"
- alert
```

# Test source

```ts
  246 |       });
  247 | 
  248 |       // AC-F08-01 — sửa được, và sửa bằng một LIÊN KẾT nên không cần JavaScript.
  249 |       await page.getByRole("link", { name: "Sửa bí tích Rửa tội" }).click();
  250 |       await page.waitForURL(/edit=/, { timeout: 20_000 });
  251 |       const editForm = page.getByRole("form", { name: "Sửa bản ghi bí tích" });
  252 |       await expect(editForm.getByLabel("Ngày lãnh")).toHaveValue("2016-01-15");
  253 |       await editForm.getByLabel("Ngày lãnh").fill("2016-03-30");
  254 |       await editForm.getByRole("button", { name: "Lưu thay đổi" }).click();
  255 |       await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });
  256 | 
  257 |       // Sửa chứ KHÔNG tạo bản ghi thứ hai: vẫn đúng một dòng, và là ngày mới.
  258 |       await page.goto(`${new URL(page.url()).pathname}?tab=sacraments`);
  259 |       const list = page.getByRole("list", { name: new RegExp(`Bí tích của`) });
  260 |       await expect(list.getByRole("listitem")).toHaveCount(1, { timeout: 20_000 });
  261 |       await expect(list).toContainText("30/03/2016");
  262 | 
  263 |       // D-128 — xoá phải hỏi, và hỏi bằng tên riêng.
  264 |       await page.getByRole("button", { name: "Xoá" }).click();
  265 |       const dialog = page.getByRole("dialog");
  266 |       await expect(dialog).toContainText("Rửa tội");
  267 |       await expect(dialog).toContainText(STUDENT);
  268 |       await expect(dialog).toContainText("không có thùng rác");
  269 |       await dialog.getByRole("button", { name: "Xoá bản ghi" }).click();
  270 |       await expect(page.getByText("Đã xoá bản ghi bí tích Rửa tội.")).toBeVisible({
  271 |         timeout: 45_000,
  272 |       });
  273 |     } finally {
  274 |       /*
  275 |         Dọn **kể cả khi bài rớt giữa chừng** (nợ #10). Bước dọn ở đầu bài đã
  276 |         lo cho lượt sau của chính bài này, nhưng để bản ghi ở lại nghĩa là mọi
  277 |         spec chạy sau đó làm việc trên một fixture khác với `seed:dev`.
  278 |       */
  279 |       await openStudent(page, STUDENT, "sacraments");
  280 |       const remaining = page.getByRole("button", { name: "Xoá" });
  281 |       if ((await remaining.count()) > 0) {
  282 |         await remaining.first().click();
  283 |         await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
  284 |         await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
  285 |       }
  286 |     }
  287 |   });
  288 | 
  289 | 
  290 |   test("🔴 D-127 + D-128: Giáo lý viên GHI được bí tích nhưng KHÔNG thấy nút Xoá", async ({
  291 |     page,
  292 |   }) => {
  293 |     // Trước M03-C tab này của Giáo lý viên **không có biểu mẫu nào cả**, vì
  294 |     // `student_sacraments_*` còn là `app.can_global_write()`. Bài không ghi gì.
  295 |     await login(page, CLASS_TEACHER);
  296 |     await openStudent(page, READ_ONLY_STUDENT, "sacraments");
  297 |     await expect(page.getByRole("form", { name: "Thêm bí tích" })).toBeVisible({
  298 |       timeout: 20_000,
  299 |     });
  300 |     await expect(page.getByRole("button", { name: "Xoá" })).toHaveCount(0);
  301 |   });
  302 | 
  303 |   test("D-127: Giáo lý viên sửa được hồ sơ SỨC KHOẺ của em lớp mình", async ({ page }) => {
  304 |     // Lý lẽ chính của D-127: người biết "em này dị ứng đậu phộng" là người đứng
  305 |     // lớp hằng tuần. Bài chỉ kiểm biểu mẫu có mặt — không ghi, để không đụng
  306 |     // dữ liệu sức khoẻ mà `seed:dev` dựng sẵn.
  307 |     await login(page, CLASS_TEACHER);
  308 |     await openStudent(page, READ_ONLY_STUDENT, "health");
  309 |     await expect(page.getByLabel("Dị ứng")).toBeVisible({ timeout: 20_000 });
  310 |   });
  311 | });
  312 | 
  313 | test.describe("TB-F12 · quản lý người giám hộ", () => {
  314 |   test.beforeEach(async ({ page }) => {
  315 |     await login(page, GROUP_LEADER);
  316 |   });
  317 | 
  318 |   test("BR-M03-N15: sửa được số điện thoại phụ huynh (lỗi F12 — 31/75)", async ({ page }) => {
  319 |     // 🔴 Trước M03-C **không có màn hình nào** để sửa: `updateGuardian` viết
  320 |     // xong từ Phase 2 mà không nơi nào gọi. Bài này đi VÀ về để lượt sau còn
  321 |     // chạy được — `students-directory.spec` tra cứu theo số của phụ huynh khác,
  322 |     // nhưng để số rác lại vẫn là làm bẩn fixture.
  323 |     await openStudent(page, "Trần Bảo Châu");
  324 |     const form = page.getByRole("form", { name: new RegExp("Sửa thông tin người giám hộ của") });
  325 |     await expect(form.getByLabel("Điện thoại")).toHaveValue(GUARDIAN_PHONE, { timeout: 20_000 });
  326 | 
  327 |     // `try/finally` cùng lý do với bài D-130: một lượt rớt vì nợ #10 mà không
  328 |     // trả lại số cũ là để lại một số điện thoại rác trong fixture dùng chung.
  329 |     try {
  330 |       await form.getByLabel("Điện thoại").fill("0912999888");
  331 |       await form.getByRole("button", { name: "Lưu thông tin liên lạc" }).click();
  332 |       await expect(page.getByText(/Đã lưu thông tin liên lạc của/)).toBeVisible({
  333 |         timeout: 45_000,
  334 |       });
  335 | 
  336 |       await page.reload();
  337 |       const back = page.getByRole("form", { name: new RegExp("Sửa thông tin người giám hộ của") });
  338 |       await expect(back.getByLabel("Điện thoại")).toHaveValue("0912999888", { timeout: 20_000 });
  339 |     } finally {
  340 |       await page.reload();
  341 |       const restore = page.getByRole("form", {
  342 |         name: new RegExp("Sửa thông tin người giám hộ của"),
  343 |       });
  344 |       await restore.getByLabel("Điện thoại").fill(GUARDIAN_PHONE);
  345 |       await restore.getByRole("button", { name: "Lưu thông tin liên lạc" }).click();
> 346 |       await expect(page.getByText(/Đã lưu thông tin liên lạc của/)).toBeVisible({
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  347 |         timeout: 45_000,
  348 |       });
  349 |     }
  350 |   });
  351 | 
  352 |   test("🔴 AC-F12-02: đổi người giám hộ hỏi trước, nêu đủ BA cái tên", async ({ page }) => {
  353 |     // Thao tác này đổi NGAY quyền đọc của hai tài khoản phụ huynh
  354 |     // (`app.own_student_ids()` nối theo `guardians.profile_id`). Bài chỉ mở hộp
  355 |     // thoại rồi Huỷ ⇒ không ghi gì.
  356 |     await openStudent(page, "Trần Bảo Châu");
  357 |     const form = page.getByRole("form", { name: new RegExp("Đổi người giám hộ của") });
  358 |     await expect(form).toBeVisible({ timeout: 20_000 });
  359 |     await form.getByRole("button", { name: "Đổi người giám hộ" }).click();
  360 | 
  361 |     const dialog = page.getByRole("dialog");
  362 |     await expect(dialog).toBeVisible({ timeout: 20_000 });
  363 |     await expect(dialog).toContainText("Trần Bảo Châu");
  364 |     await expect(dialog).toContainText("KHÔNG còn xem được");
  365 |     await expect(dialog).toContainText("cổng phụ huynh");
  366 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  367 |     await expect(dialog).toBeHidden();
  368 |   });
  369 | });
  370 | 
  371 | test.describe("`11` §5 · trang hồ sơ vừa khung và bấm được ở cả ba viewport", () => {
  372 |   /**
  373 |    * `responsive.spec.ts` quét 13 địa chỉ **cấp một** nhưng không có
  374 |    * `/students/[studentId]` — mà đợt này thêm **ba khối mới** vào đúng trang ấy.
  375 |    * Hai tiêu chí nghiệm thu chung ("không tràn ngang" · "mọi vùng chạm ≥44px")
  376 |    * vì thế không ai đo hộ, nên đo tại chỗ.
  377 |    */
  378 |   test("không tràn ngang và mọi vùng bấm ≥44px trên trang chi tiết", async ({ page }) => {
  379 |     await login(page, GROUP_LEADER);
  380 |     await openStudent(page, STUDENT);
  381 | 
  382 |     for (const tab of ["", "?tab=history", "?tab=sacraments", "?tab=health"]) {
  383 |       const base = new URL(page.url()).pathname;
  384 |       await page.goto(`${base}${tab}`);
  385 |       await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
  386 | 
  387 |       const overflow = await page.evaluate(
  388 |         () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  389 |       );
  390 |       expect(overflow, `${tab || "tổng quan"} tràn ngang`).toBeLessThanOrEqual(1);
  391 | 
  392 |       const undersized = await page.evaluate((min) => {
  393 |         const offenders: string[] = [];
  394 |         const controls = document.querySelectorAll<HTMLElement>(
  395 |           "main button, main a[href], main select, main input[type='checkbox']",
  396 |         );
  397 |         for (const control of controls) {
  398 |           const box = control.getBoundingClientRect();
  399 |           if (box.width === 0 && box.height === 0) continue;
  400 |           // Ô tick nằm trong một `<label>` cao 44px — vùng bấm thật là cái nhãn,
  401 |           // đúng khuôn đã dùng ở `create-student-form`.
  402 |           if (control instanceof HTMLInputElement && control.type === "checkbox") {
  403 |             const label = control.closest("label");
  404 |             if (label && label.getBoundingClientRect().height >= min) continue;
  405 |           }
  406 |           if (box.height < min) {
  407 |             offenders.push(`${control.tagName.toLowerCase()} ${Math.round(box.height)}px`);
  408 |           }
  409 |         }
  410 |         return offenders;
  411 |       }, 44);
  412 |       expect(undersized, `${tab || "tổng quan"} có vùng bấm nhỏ hơn 44px`).toEqual([]);
  413 |     }
  414 |   });
  415 | });
  416 | 
  417 | test.describe("D-67 · mức đọc riêng của Thủ quỹ", () => {
  418 |   test.beforeEach(async ({ page }) => {
  419 |     await login(page, TREASURER);
  420 |   });
  421 | 
  422 |   test("🔴 Thủ quỹ thấy được danh sách em — trước M03-C trang này TRỐNG TRƠN", async ({
  423 |     page,
  424 |   }) => {
  425 |     await page.goto("/students");
  426 |     const rows = page.getByRole("list", { name: "Danh sách thiếu nhi" }).getByRole("listitem");
  427 |     await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  428 |     await expect(rows.first()).toContainText("Giám hộ:");
  429 |   });
  430 | 
  431 |   test("trang NÓI RA phạm vi, không để người dùng đoán vì sao thiếu cột", async ({ page }) => {
  432 |     await page.goto("/students");
  433 |     await expect(page.getByText(/Danh sách phục vụ việc thu phí/)).toBeVisible({
  434 |       timeout: 20_000,
  435 |     });
  436 |     await expect(page.getByText(/không thuộc phạm vi Thủ quỹ/)).toBeVisible();
  437 |   });
  438 | 
  439 |   test("🔴 dòng KHÔNG phải liên kết — hồ sơ chi tiết ngoài phạm vi Thủ quỹ", async ({ page }) => {
  440 |     // Một liên kết luôn dẫn tới 404 còn tệ hơn không có liên kết: người dùng sẽ
  441 |     // báo "hệ thống mất hồ sơ của em".
  442 |     await page.goto("/students");
  443 |     const list = page.getByRole("list", { name: "Danh sách thiếu nhi" });
  444 |     await expect(list.getByRole("listitem").first()).toBeVisible({ timeout: 20_000 });
  445 |     await expect(list.getByRole("link")).toHaveCount(0);
  446 |   });
```