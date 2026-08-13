# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-lifecycle.spec.ts >> TB-F06 · trạng thái hồ sơ tách khỏi biểu mẫu thông tin >> 🔴 D-130: tạm nghỉ hồ sơ kéo ghi danh sang Tạm nghỉ, rồi khôi phục lại
- Location: tests\e2e\student-lifecycle.spec.ts:148:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã khôi phục ghi danh ở lớp/)
Expected: visible
Timeout: 75000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 75000ms
  - waiting for getByText(/Đã khôi phục ghi danh ở lớp/)

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
  - heading "Phêrô Nguyễn Minh Khoa" [level=1]
  - paragraph: Mã thiếu nhi CQ0003
  - link "← Danh sách thiếu nhi":
    - /url: /students
  - paragraph: Người giám hộ
  - paragraph: Nguyễn Văn Ba · 0912000001
  - text: Lớp Ấu 1B Tạm nghỉ
  - navigation:
    - link "Tổng quan":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032
    - link "Lịch sử lớp":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=history
    - link "Bí tích":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=sacraments
    - link "Sức khỏe":
      - /url: /students/06f05e57-21b0-4684-8df9-adb7f8341032?tab=health
  - heading "Thông tin" [level=3]
  - paragraph: "Tên thánh: Phêrô"
  - paragraph: "Họ tên: Nguyễn Minh Khoa"
  - paragraph: "Giới tính: Nam"
  - paragraph: "Ngày sinh: 20/11/2016"
  - paragraph: "Bổn mạng: —"
  - paragraph: "Điện thoại: —"
  - paragraph: "Địa chỉ: —"
  - paragraph: "Ghi chú: —"
  - heading "Cập nhật hồ sơ" [level=3]
  - paragraph: Chỉnh sửa thông tin cơ bản của thiếu nhi.
  - text: Tên thánh
  - textbox "Tên thánh": Phêrô
  - text: Giới tính
  - combobox "Giới tính":
    - option "Nam" [selected]
    - option "Nữ"
    - option "Khác"
  - text: Họ tên
  - textbox "Họ tên": Nguyễn Minh Khoa
  - text: Ngày sinh
  - textbox "Ngày sinh": 2016-11-20
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
  - form "Sửa thông tin người giám hộ của Phêrô Nguyễn Minh Khoa":
    - text: Họ tên phụ huynh
    - textbox "Họ tên phụ huynh": Nguyễn Văn Ba
    - text: Điện thoại
    - textbox "Điện thoại": "0912000001"
    - text: Địa chỉ
    - textbox "Địa chỉ": 12 Trần Bình Trọng, Q5
    - text: Trạng thái hồ sơ phụ huynh
    - combobox "Trạng thái hồ sơ phụ huynh":
      - option "Đang sử dụng" [selected]
      - option "Ngừng sử dụng"
    - button "Lưu thông tin liên lạc"
  - form "Đổi người giám hộ của Phêrô Nguyễn Minh Khoa":
    - text: Đổi sang người giám hộ khác
    - combobox "Đổi sang người giám hộ khác":
      - option "Đinh GLV 1A · 0901000010" [selected]
      - option "Người giám hộ chưa có con 1 · 84918888102"
      - option "Người giám hộ chưa có con 2 · 84918888202"
      - option "Người giám hộ chưa có con 3 · 84918888302"
      - option "Người giám hộ chưa ghi danh 1 · 84918888103"
      - option "Người giám hộ chưa ghi danh 2 · 84918888203"
      - option "Người giám hộ chưa ghi danh 3 · 84918888303"
      - option "Phụ huynh E2E 1 · 84919999991"
      - option "Phụ huynh E2E 160563 · 0916056300"
      - option "Phụ huynh E2E 2 · 84919999992"
      - option "Phụ huynh E2E 3 · 84919999993"
      - option "Phụ huynh E2E 400732 · 0940073200"
      - option "Phụ huynh E2E 894547 · 0989454700"
      - option "Phụ huynh E2E không tài khoản · 0912999999"
      - option "Trần Thị Bốn · 0912000002"
    - paragraph: Thao tác này đổi ngay ai xem được Phêrô Nguyễn Minh Khoa trong cổng phụ huynh.
    - button "Đổi người giám hộ"
  - heading "Trạng thái hồ sơ" [level=3]
  - paragraph: Đổi trạng thái hồ sơ cũng đổi chỗ của em trong lớp — hệ thống nói rõ hệ quả trước khi ghi.
  - form "Trạng thái hồ sơ của Phêrô Nguyễn Minh Khoa":
    - text: Trạng thái hồ sơ
    - combobox "Trạng thái hồ sơ":
      - option "Đang sinh hoạt" [selected]
      - option "Tạm nghỉ"
      - option "Đã rút"
      - option "Lưu trữ"
    - button "Đang lưu…" [disabled]
- alert
```

# Test source

```ts
  95  |     // em là một cú chọn nhầm trong `<select>`, không hỏi gì.
  96  |     await openStudent(page, STUDENT);
  97  |     await expect(page.getByRole("heading", { name: "Cập nhật hồ sơ" })).toBeVisible({
  98  |       timeout: 20_000,
  99  |     });
  100 |     await expect(page.getByLabel("Trạng thái", { exact: true })).toHaveCount(0);
  101 |     await expect(page.getByLabel("Trạng thái hồ sơ", { exact: true })).toBeVisible();
  102 |   });
  103 | 
  104 |   test("AC-F06-01: lưu trữ em còn lớp thì cảnh báo nêu TÊN LỚP, và hộp xác nhận nêu TÊN EM", async ({
  105 |     page,
  106 |   }) => {
  107 |     await openStudent(page, STUDENT);
  108 |     const statusForm = page.getByRole("form", { name: new RegExp(`Trạng thái hồ sơ của`) });
  109 |     await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("archived");
  110 | 
  111 |     // Cảnh báo phải nêu tên lớp: "em còn ghi danh đang mở" mà không nói ở lớp
  112 |     // nào thì người dùng không biết mình sắp đóng cái gì (BR-M03-N12).
  113 |     //
  114 |     // Neo vào `<strong>` chứ không phải chuỗi trần: tên lớp xuất hiện HAI chỗ
  115 |     // trong khối này (câu cảnh báo và nhãn ô tick), và một `getByText` trần sẽ
  116 |     // vi phạm chế độ nghiêm ngặt của Playwright.
  117 |     await expect(statusForm.getByText(STUDENT_CLASS, { exact: true })).toBeVisible();
  118 |     const closeBox = statusForm.getByLabel(new RegExp("Đồng thời kết thúc ghi danh"));
  119 |     await expect(closeBox).toBeVisible();
  120 |     // Mặc định KHÔNG tick: một mặc định `true` sẽ đóng ghi danh của một em vì
  121 |     // người dùng quên bỏ tick.
  122 |     await expect(closeBox).not.toBeChecked();
  123 | 
  124 |     await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  125 |     const dialog = page.getByRole("dialog");
  126 |     await expect(dialog).toBeVisible({ timeout: 20_000 });
  127 |     await expect(dialog).toContainText(STUDENT);
  128 |     await expect(dialog).toContainText(STUDENT_CLASS);
  129 |     // 🔴 S-11 — hệ quả duy nhất người dùng không suy ra được từ màn hình.
  130 |     await expect(dialog).toContainText("Giáo lý viên");
  131 | 
  132 |     // Huỷ ⇒ không ghi gì. Hồ sơ phải còn nguyên trạng thái cũ.
  133 |     //
  134 |     // Kiểm bằng **giá trị của ô chọn**, không phải bằng `getByText("Đang sinh
  135 |     // hoạt").first()`: chuỗi ấy cũng là một `<option>` bên trong `<select>` đang
  136 |     // đóng, nên `.first()` rơi vào một phần tử **ẩn** và bài đỏ trong khi giao
  137 |     // diện đúng. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B, M04-C,
  138 |     // M03-A và M03-B.
  139 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  140 |     await page.reload();
  141 |     await expect(
  142 |       page
  143 |         .getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") })
  144 |         .getByLabel("Trạng thái hồ sơ"),
  145 |     ).toHaveValue("active", { timeout: 20_000 });
  146 |   });
  147 | 
  148 |   test("🔴 D-130: tạm nghỉ hồ sơ kéo ghi danh sang Tạm nghỉ, rồi khôi phục lại", async ({
  149 |     page,
  150 |   }) => {
  151 |     test.setTimeout(180_000);
  152 |     // Bài ĐI VÀ VỀ trong cùng một bài — ba viewport chạy nối tiếp trên cùng một
  153 |     // database, nên bài nào để lại dấu vết là bài ấy phá lượt sau của chính nó.
  154 |     await openStudent(page, STUDENT);
  155 |     const studentPath = new URL(page.url()).pathname;
  156 | 
  157 |     /*
  158 |       🔴 `try/finally` chứ không phải một mạch thẳng — và đây là bài học đắt
  159 |       nhất của đợt này.
  160 | 
  161 |       Lượt chạy trước: bài này rớt ở **nợ #10 vế (a)** (thao tác ghi ĐÃ vào cơ
  162 |       sở dữ liệu, nhưng câu phản hồi không kịp về trong 45 giây), nên chân "về"
  163 |       không bao giờ chạy và em nằm lại ở "Tạm nghỉ". Bộ lọc mặc định của
  164 |       `/students` chỉ hiện em **đang sinh hoạt**, nên **năm bài sau của hai
  165 |       viewport sau đỏ theo** — không bài nào trong số đó có lỗi gì cả.
  166 | 
  167 |       Một bài test ghi dữ liệu phải trả lại trạng thái **kể cả khi chính nó
  168 |       rớt**, nếu không thì một lỗi ngẫu nhiên biến thành năm lỗi và tập bài đỏ
  169 |       không còn nói lên điều gì.
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
> 195 |       await expect(page.getByText(/Đã khôi phục ghi danh ở lớp/)).toBeVisible({ timeout: 75_000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
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
```