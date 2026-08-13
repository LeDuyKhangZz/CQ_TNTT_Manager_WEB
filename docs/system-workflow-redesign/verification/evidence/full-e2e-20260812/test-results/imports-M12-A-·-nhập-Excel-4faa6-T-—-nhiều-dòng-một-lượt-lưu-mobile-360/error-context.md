# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> M12-A · nhập Excel >> 🔴 AC-21: điền giới tính HÀNG LOẠT — nhiều dòng, một lượt lưu
- Location: tests\e2e\imports.spec.ts:274:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "Bỏ qua điều hướng" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e5]:
      - banner [ref=e6]:
        - generic [ref=e7]:
          - button "Mở menu" [ref=e8] [cursor=pointer]:
            - img [ref=e9]
          - generic [ref=e10]:
            - navigation "Đường dẫn trang" [ref=e11]:
              - list [ref=e12]:
                - listitem [ref=e13]:
                  - link "Trang chủ" [ref=e14] [cursor=pointer]:
                    - /url: /dashboard
                    - generic [ref=e15]: Trang chủ
                - listitem [ref=e16]:
                  - img [ref=e17]
                  - generic [ref=e19]: Nhập dữ liệu Excel
            - paragraph [ref=e20]: Nhập dữ liệu Excel
          - paragraph [ref=e21]:
            - generic [ref=e22]:
              - generic [ref=e23]: "Năm học hiện hành:"
              - text: 2026-2027
          - link "Mở thông báo" [ref=e24] [cursor=pointer]:
            - /url: /notifications
            - img [ref=e25]
          - group [ref=e28]:
            - generic "Menu tài khoản của Trần Xuân Đoàn" [ref=e29] [cursor=pointer]:
              - img [ref=e31]
              - img [ref=e34]
      - main [ref=e37]:
        - paragraph [ref=e39]:
          - text: "Đang xem: Huynh Trưởng ·"
          - generic [ref=e40]: Năm học 2026-2027
        - generic [ref=e41]:
          - generic [ref=e43]:
            - heading "Nhập dữ liệu Excel" [level=1] [ref=e44]
            - paragraph [ref=e45]: Tải file lên để kiểm tra thử, xem trước kết quả rồi mới ghi vào hệ thống.
          - generic [ref=e46]:
            - generic [ref=e47]:
              - heading "Tải file lên" [level=3] [ref=e49]
              - form "Tải file Excel lên" [ref=e51]:
                - paragraph [ref=e52]:
                  - text: Dữ liệu sẽ được ghi danh vào năm học
                  - strong [ref=e53]: 2026-2027
                  - text: . Hệ thống đọc được file mẫu chuẩn, sheet
                  - strong [ref=e54]: SYLL
                  - text: hoặc sheet
                  - strong [ref=e55]: DS_dau_nam
                  - text: của sổ lớp. Bước tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống.
                - generic [ref=e56]:
                  - generic [ref=e57]: File Excel (.xlsx — tối đa 4 MB và 1.000 dòng)
                  - button "File Excel (.xlsx — tối đa 4 MB và 1.000 dòng)" [ref=e58]
                - generic [ref=e59]:
                  - generic [ref=e60]: Lớp đích (nếu file không có cột lớp)
                  - generic [ref=e61]:
                    - combobox "Lớp đích (nếu file không có cột lớp)" [ref=e62]:
                      - option "— Lấy theo cột lớp trong file —" [selected]
                      - option "Ấu 1A"
                      - option "Ấu 1B"
                      - option "Ấu 2A"
                      - option "Ấu 2B"
                      - option "Ấu 3A"
                      - option "Ấu 3B"
                      - option "Chiên Con 1"
                      - option "Chiên Con 2"
                      - option "Dự trưởng"
                      - option "Hiệp 1"
                      - option "Hiệp 2"
                      - option "Nghĩa 1"
                      - option "Nghĩa 2"
                      - option "Nghĩa 3"
                      - option "Thiếu 1A"
                      - option "Thiếu 1B"
                      - option "Thiếu 2A"
                      - option "Thiếu 2B"
                      - option "Thiếu 3"
                    - img
                  - paragraph [ref=e63]: Sổ lớp Chiên Con không có cột lớp — hãy chọn lớp ở đây. Dòng nào đã ghi lớp trong file thì vẫn ưu tiên giá trị trong file.
                - generic [ref=e64]:
                  - button "Đang kiểm tra…" [disabled]
                  - link "Tải file mẫu" [ref=e65] [cursor=pointer]:
                    - /url: /imports/template
            - generic [ref=e66]:
              - heading "Lần nhập gần đây" [level=2] [ref=e67]
              - group "Lọc danh sách lần nhập" [ref=e69]:
                - generic [ref=e70]:
                  - img [ref=e71]
                  - text: Lọc danh sách lần nhập
                - generic [ref=e72]:
                  - generic [ref=e73]:
                    - generic [ref=e74]: Năm học
                    - generic [ref=e75]:
                      - combobox "Năm học" [ref=e76]:
                        - option "Năm học hiện hành" [selected]
                        - option "Tất cả năm học"
                        - option "2071-2072 — Năm học 2071-2072"
                        - option "2026-2027 — Năm học 2026-2027"
                        - option "2024-2025 — Năm học 2024-2025"
                        - option "2019-2020 — Năm học 2019-2020"
                      - img
                  - generic [ref=e77]:
                    - generic [ref=e78]: Trạng thái
                    - generic [ref=e79]:
                      - combobox "Trạng thái" [ref=e80]:
                        - option "Tất cả trạng thái" [selected]
                        - option "Đã kiểm tra, chờ xác nhận"
                        - option "Ghi một phần — còn dòng lỗi"
                        - option "Đã ghi vào hệ thống"
                        - option "Đã huỷ"
                      - img
                - button "Lọc" [ref=e82] [cursor=pointer]
              - paragraph [ref=e83]: 2 lần nhập. Đang xem năm học 2026-2027.
              - list "Danh sách lần nhập" [ref=e84]:
                - listitem [ref=e85]:
                  - 'link "M12A-xem-lai-mobile-360.xlsx Đã huỷ 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 12/08/2026 13:28 bởi Trần Xuân Đoàn · huỷ 12/08/2026 13:28" [ref=e86] [cursor=pointer]':
                    - /url: /imports/13226d43-1b83-4fda-8bc0-72960321c847
                    - generic [ref=e87]:
                      - paragraph [ref=e88]: M12A-xem-lai-mobile-360.xlsx
                      - generic [ref=e89]: Đã huỷ
                    - paragraph [ref=e90]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e91]: "Nguồn: file mẫu chuẩn · tải lên 12/08/2026 13:28 bởi Trần Xuân Đoàn · huỷ 12/08/2026 13:28"
                - listitem [ref=e92]:
                  - 'link "M12A-mobile-360.xlsx Đã huỷ 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 12/08/2026 13:28 bởi Trần Xuân Đoàn · huỷ 12/08/2026 13:28" [ref=e93] [cursor=pointer]':
                    - /url: /imports/9d089b44-ff4e-4f63-9989-d09a2465ec35
                    - generic [ref=e94]:
                      - paragraph [ref=e95]: M12A-mobile-360.xlsx
                      - generic [ref=e96]: Đã huỷ
                    - paragraph [ref=e97]: 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0
                    - paragraph [ref=e98]: "Nguồn: file mẫu chuẩn · tải lên 12/08/2026 13:28 bởi Trần Xuân Đoàn · huỷ 12/08/2026 13:28"
    - navigation "Điều hướng nhanh" [ref=e99]:
      - list [ref=e100]:
        - listitem [ref=e101]:
          - link "Trang chủ" [ref=e102] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e103]
            - generic [ref=e108]: Trang chủ
        - listitem [ref=e109]:
          - link "Thiếu nhi" [ref=e110] [cursor=pointer]:
            - /url: /students
            - img [ref=e111]
            - generic [ref=e115]: Thiếu nhi
        - listitem [ref=e116]:
          - link "Điểm danh" [ref=e117] [cursor=pointer]:
            - /url: /attendance
            - img [ref=e118]
            - generic [ref=e122]: Điểm danh
        - listitem [ref=e123]:
          - link "Báo cáo" [ref=e124] [cursor=pointer]:
            - /url: /reports
            - img [ref=e125]
            - generic [ref=e127]: Báo cáo
        - listitem [ref=e128]:
          - link "Tài khoản" [ref=e129] [cursor=pointer]:
            - /url: /account
            - img [ref=e130]
            - generic [ref=e134]: Tài khoản
  - alert [ref=e135]
```

# Test source

```ts
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
  229 |       await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
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
  277 |     const filename = `M12B-gioi-tinh-${testInfo.project.name}.xlsx`;
  278 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  279 |     // Sổ KHÔNG có cột giới tính — đúng hình dạng sổ SYLL của giáo xứ.
  280 |     const content = await buildWorkbookWithoutGender([
  281 |       { name: `Test Gioi Tinh Mot ${suffix}`, dob: "01/03/2016", phone: "0900223341" },
  282 |       { name: `Test Gioi Tinh Hai ${suffix}`, dob: "02/03/2016", phone: "0900223342" },
  283 |       { name: `Test Gioi Tinh Ba ${suffix}`, dob: "03/03/2016", phone: "0900223343" },
  284 |     ]);
  285 | 
  286 |     try {
  287 |       await uploadWorkbook(page, filename, content);
> 288 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      |                  ^ TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
  289 |       await expect(batchRows(page)).toHaveCount(3);
  290 | 
  291 |       // Con số này đếm trong cơ sở dữ liệu, không đếm trên trang đang xem.
  292 |       await expect(page.getByText(/3 dòng.*chưa có giới tính/)).toBeVisible();
  293 | 
  294 |       // Đánh dấu hai dòng rồi áp dụng Nam — điền TẠI CHỖ, chưa gửi gì lên.
  295 |       await page.getByLabel("Chọn dòng 2").check();
  296 |       await page.getByLabel("Chọn dòng 3").check();
  297 |       await expect(page.getByText("2 dòng đang chọn.")).toBeVisible();
  298 |       await page.getByRole("button", { name: "Áp dụng Nam cho dòng đang chọn" }).click();
  299 | 
  300 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveValue("male");
  301 |       await expect(page.getByLabel("Giới tính của dòng 3")).toHaveValue("male");
  302 |       // Dòng không đánh dấu phải nguyên vẹn.
  303 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  304 | 
  305 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  306 |       // 60 giây, không phải 45: lượt lưu hàng loạt là thao tác ghi NẶNG NHẤT của
  307 |       // module, và lượt chạy toàn bộ đo được nó mất tới ~48 giây khi máy đang
  308 |       // chạy hết bộ E2E. ⚠️ Che triệu chứng của nợ #10, không phải chữa.
  309 |       await expect(page.getByText(/Đã lưu 2 dòng/)).toBeVisible({ timeout: 60_000 });
  310 | 
  311 |       // Bằng chứng đã ghi thật: dải cảnh báo tự đếm lại còn đúng một dòng, và
  312 |       // hai dòng vừa lưu không còn ô chọn giới tính nữa.
  313 |       await expect(page.getByText(/1 dòng.*chưa có giới tính/)).toBeVisible({ timeout: 45_000 });
  314 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveCount(0);
  315 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  316 |     } finally {
  317 |       await cancelOpenBatch(page).catch(() => {});
  318 |     }
  319 |   });
  320 | 
  321 |   /**
  322 |    * 🔴 **D-133 phải sống sót qua TO-BE 4.** Chủ dự án chốt 2026-07-29 rằng dòng
  323 |    * trùng chắc chắn phải được xác nhận **từng dòng**; một nút "Lưu tất cả" gộp
  324 |    * luôn chúng là đúng thứ D-133 sinh ra để chặn. Bài này đo cả hai nửa: nút lưu
  325 |    * chung **từ chối** dòng ấy và nói ra, còn nút của riêng dòng thì lưu được.
  326 |    *
  327 |    * Dữ liệu trùng lấy thẳng từ `seed:dev` (CQ0060 — họ tên + ngày sinh + SĐT phụ
  328 |    * huynh khớp cả ba ⇒ mức `high`), nên bài không cần tạo hồ sơ thiếu nhi nào.
  329 |    */
  330 |   test("🔴 D-133: dòng trùng chắc chắn KHÔNG lưu hàng loạt được", async ({ page }, testInfo) => {
  331 |     const filename = `M12B-trung-${testInfo.project.name}.xlsx`;
  332 |     const content = await buildWorkbook([
  333 |       // Trùng cả ba với CQ0060 của seed:dev.
  334 |       { name: "Nguyễn Minh An", dob: "12/03/2017", phone: "0912000001" },
  335 |     ]);
  336 | 
  337 |     try {
  338 |       await uploadWorkbook(page, filename, content);
  339 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  340 | 
  341 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  342 |       await expect(page.getByText(/1 dòng.*nghi trùng chắc chắn/)).toBeVisible();
  343 |       // Mặc định an toàn của M12-A vẫn đứng: Ghép, không phải Tạo mới.
  344 |       await expect(page.getByLabel("Cách xử lý dòng 2")).toHaveValue("merge");
  345 | 
  346 |       // Nửa thứ nhất: nút lưu chung phải TỪ CHỐI dòng này và nói ra lý do.
  347 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  348 |       await expect(page.getByText(/Còn 1 dòng nghi trùng chắc chắn/)).toBeVisible({
  349 |         timeout: 45_000,
  350 |       });
  351 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  352 | 
  353 |       // Nửa thứ hai: nút của riêng dòng thì lưu được, và dấu chặn biến mất.
  354 |       // Nút ấy nằm trong khối `<details>` đóng sẵn — phải mở ra mới bấm được, và
  355 |       // đó chính là điều D-133 muốn: người duyệt **nhìn hồ sơ đối chiếu** trước.
  356 |       await page.getByText(/Dòng #2 .* đối chiếu hồ sơ nghi trùng/).click();
  357 |       await page.getByRole("button", { name: "Xác nhận dòng #2" }).click();
  358 |       await expect(page.getByText(/Đã lưu 1 dòng/)).toBeVisible({ timeout: 45_000 });
  359 |       await expect(page.getByText("Chờ xác nhận trùng")).toHaveCount(0);
  360 |       await expect(page.getByText(/nghi trùng chắc chắn với hồ sơ đã có/)).toHaveCount(0);
  361 |     } finally {
  362 |       await cancelOpenBatch(page).catch(() => {});
  363 |     }
  364 |   });
  365 | 
  366 |   test("🔴 AC-25: lọc dòng theo trạng thái", async ({ page }, testInfo) => {
  367 |     const filename = `M12B-loc-${testInfo.project.name}.xlsx`;
  368 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  369 |     const content = await buildWorkbook([
  370 |       { name: `Test Loc Mot ${suffix}`, dob: "04/04/2016", phone: "0900223351" },
  371 |       { name: `Test Loc Hai ${suffix}`, dob: "05/04/2016", phone: "0900223352" },
  372 |       // Thiếu ngày sinh ⇒ dòng lỗi. Một lần nhập thật luôn có cả hai loại dòng.
  373 |       { name: `Test Loc Ba ${suffix}`, dob: "", phone: "0900223353" },
  374 |     ]);
  375 | 
  376 |     try {
  377 |       await uploadWorkbook(page, filename, content);
  378 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  379 |       await expect(batchRows(page)).toHaveCount(3);
  380 | 
  381 |       await page.getByLabel("Trạng thái dòng").selectOption("error");
  382 |       await clickUntil(
  383 |         "Lọc theo trạng thái Lỗi",
  384 |         () => page.getByRole("button", { name: "Lọc" }).click(),
  385 |         async () => (await batchRows(page).count()) === 1,
  386 |       );
  387 |       await expect(page).toHaveURL(/status=error/);
  388 |       await expect(batchRows(page)).toHaveCount(1);
```