# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-lifecycle.spec.ts >> TB-F08 · sửa và xoá bản ghi bí tích >> AC-F08-01 · AC-F08-02 · D-128 — vòng đời một bản ghi: thêm → trùng → sửa → xoá
- Location: tests\e2e\student-lifecycle.spec.ts:207:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Đã xoá bản ghi bí tích Rửa tội.')
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByText('Đã xoá bản ghi bí tích Rửa tội.')

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
        - link "Thiếu nhi":
          - /url: /students
      - listitem: Hồ sơ thiếu nhi
  - paragraph: Thiếu nhi
  - paragraph: "Năm học hiện hành: 2026-2027"
  - link "Mở thông báo":
    - /url: /notifications
  - group
- main:
  - paragraph: "Đang xem: Huynh Trưởng · Năm học 2026-2027"
  - heading "Phêrô Nguyễn Minh Khoa" [level=1]
  - paragraph: Mã thiếu nhi CQ0003
  - link "← Danh sách thiếu nhi":
    - /url: /students
  - paragraph: Người giám hộ
  - paragraph: Nguyễn Văn Ba · 0912000001
  - text: Lớp Ấu 1B Đang sinh hoạt
  - navigation:
    - link "Tổng quan":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032
    - link "Lịch sử lớp":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=history
    - link "Bí tích":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=sacraments
    - link "Sức khỏe":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=health
  - heading "Bí tích đã lãnh" [level=3]
  - paragraph: Mỗi loại bí tích chỉ ghi một lần cho mỗi em.
  - list "Bí tích của Phêrô Nguyễn Minh Khoa":
    - listitem:
      - paragraph: Rửa tội
      - paragraph: 30/03/2016 · Nhà thờ E2E mobile-360
      - link "Sửa bí tích Rửa tội":
        - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=sacraments&edit=7e9a3571-1314-4604-8def-6ec36815146e
        - text: Sửa
      - button "Đang xoá…" [disabled]
  - heading "Thêm bí tích" [level=3]
  - paragraph: Ghi lại bí tích em đã lãnh nhận.
  - form "Thêm bí tích":
    - text: Loại bí tích
    - combobox "Loại bí tích":
      - option "Rửa tội" [selected]
      - option "Xưng tội lần đầu"
      - option "Rước lễ lần đầu"
      - option "Thêm sức"
      - option "Tuyên hứa"
      - option "Khác"
    - text: Tên (nếu chọn Khác)
    - textbox "Tên (nếu chọn Khác)"
    - text: Ngày lãnh
    - textbox "Ngày lãnh"
    - text: Nơi lãnh
    - textbox "Nơi lãnh"
    - text: Người đỡ đầu
    - textbox "Người đỡ đầu"
    - text: Số sổ
    - textbox "Số sổ"
    - text: Ghi chú
    - textbox "Ghi chú"
    - button "Đang lưu…" [disabled]
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
  170 |     */
  171 |     try {
  172 |       const statusForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
  173 |       await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("temporarily_inactive");
  174 |       await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  175 |       const pauseDialog = page.getByRole("dialog");
  176 |       await expect(pauseDialog).toContainText("giữ nguyên chỗ");
  177 |       await pauseDialog.getByRole("button", { name: "Đổi trạng thái" }).click();
  178 | 
  179 |       // Ngưỡng 45 giây, không phải 20 — nợ #10 vế (a).
  180 |       await expect(page.getByText(/Ghi danh ở lớp .* đã chuyển sang "Tạm nghỉ"/)).toBeVisible({
  181 |         timeout: 45_000,
  182 |       });
  183 | 
  184 |       // Và ghi danh THẬT SỰ đổi, không chỉ có một câu thông báo.
  185 |       await page.goto(`${studentPath}?tab=history`);
  186 |       await expect(page.getByText(STUDENT_CLASS).first()).toBeVisible({ timeout: 20_000 });
  187 |       await expect(page.getByText("Tạm nghỉ").first()).toBeVisible();
  188 |     } finally {
  189 |       // ── Về ──────────────────────────────────────────────────────────────
  190 |       await page.goto(studentPath);
  191 |       const backForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
  192 |       await backForm.getByLabel("Trạng thái hồ sơ").selectOption("active");
  193 |       await backForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  194 |       await page.getByRole("dialog").getByRole("button", { name: "Đổi trạng thái" }).click();
  195 |       await expect(page.getByText(/Đã khôi phục ghi danh ở lớp/)).toBeVisible({ timeout: 75_000 });
  196 |       await page.reload();
  197 |       await expect(
  198 |         page
  199 |           .getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") })
  200 |           .getByLabel("Trạng thái hồ sơ"),
  201 |       ).toHaveValue("active");
  202 |     }
  203 |   });
  204 | });
  205 | 
  206 | test.describe("TB-F08 · sửa và xoá bản ghi bí tích", () => {
  207 |   test("AC-F08-01 · AC-F08-02 · D-128 — vòng đời một bản ghi: thêm → trùng → sửa → xoá", async ({
  208 |     page,
  209 |   }, testInfo) => {
  210 |     test.setTimeout(180_000);
  211 |     await login(page, GROUP_LEADER);
  212 |     await openStudent(page, STUDENT, "sacraments");
  213 | 
  214 |     /*
  215 |       Dọn dấu vết của lượt trước NẾU có. Bài này tự dọn ở cuối, nhưng một lượt
  216 |       rớt giữa chừng sẽ để lại một bản ghi "Rửa tội" — và vì mỗi loại bí tích
  217 |       chỉ ghi được một lần cho mỗi em, lượt sau sẽ đỏ ở ngay bước đầu vì một lý
  218 |       do không liên quan gì tới thứ nó đang kiểm.
  219 |     */
  220 |     const leftover = page.getByRole("button", { name: "Xoá" });
  221 |     if ((await leftover.count()) > 0) {
  222 |       await leftover.first().click();
  223 |       await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
  224 |       await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
  225 |       await page.reload();
  226 |     }
  227 | 
  228 |     try {
  229 |       const addForm = page.getByRole("form", { name: "Thêm bí tích" });
  230 |       await expect(addForm).toBeVisible({ timeout: 20_000 });
  231 |       await addForm.getByLabel("Loại bí tích").selectOption("baptism");
  232 |       await addForm.getByLabel("Ngày lãnh").fill("2016-01-15");
  233 |       await addForm.getByLabel("Nơi lãnh").fill(`Nhà thờ E2E ${testInfo.project.name}`);
  234 |       await addForm.getByRole("button", { name: "Lưu bí tích" }).click();
  235 |       await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });
  236 |       await page.reload();
  237 | 
  238 |       // AC-F08-02 — unique index chạy đúng từ đầu, chỉ là mã `23505` từng bị nuốt
  239 |       // nên trải nghiệm là "bấm không có gì xảy ra".
  240 |       const addAgain = page.getByRole("form", { name: "Thêm bí tích" });
  241 |       await addAgain.getByLabel("Loại bí tích").selectOption("baptism");
  242 |       await addAgain.getByLabel("Ngày lãnh").fill("2016-02-20");
  243 |       await addAgain.getByRole("button", { name: "Lưu bí tích" }).click();
  244 |       await expect(page.getByText(/đã có bản ghi cho loại bí tích đó/i)).toBeVisible({
  245 |         timeout: 45_000,
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
> 270 |       await expect(page.getByText("Đã xoá bản ghi bí tích Rửa tội.")).toBeVisible({
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
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
  346 |       await expect(page.getByText(/Đã lưu thông tin liên lạc của/)).toBeVisible({
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
```