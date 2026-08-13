# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-lifecycle.spec.ts >> TB-F06 · trạng thái hồ sơ tách khỏi biểu mẫu thông tin >> 🔴 D-130: tạm nghỉ hồ sơ kéo ghi danh sang Tạm nghỉ, rồi khôi phục lại
- Location: tests\e2e\student-lifecycle.spec.ts:147:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Đã khôi phục ghi danh ở lớp/)
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
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
  - paragraph: Mã thiếu nhi CQ0099
  - link "← Danh sách thiếu nhi":
    - /url: /students
  - paragraph: Người giám hộ
  - paragraph: Nguyễn Văn Ba · 0912000001
  - text: Lớp Ấu 1B Tạm nghỉ
  - navigation:
    - link "Tổng quan":
      - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4
    - link "Lịch sử lớp":
      - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4?tab=history
    - link "Bí tích":
      - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4?tab=sacraments
    - link "Sức khỏe":
      - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4?tab=health
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
      - option "Phụ huynh E2E 101779 · 0910177900"
      - option "Phụ huynh E2E 2 · 84919999992"
      - option "Phụ huynh E2E 3 · 84919999993"
      - option "Phụ huynh E2E 345936 · 0934593600"
      - option "Phụ huynh E2E 691616 · 0969161600"
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
  93  |     // nằm ngay cạnh ô "Điện thoại", chung một nút "Lưu thay đổi" — lưu trữ một
  94  |     // em là một cú chọn nhầm trong `<select>`, không hỏi gì.
  95  |     await openStudent(page, STUDENT);
  96  |     await expect(page.getByRole("heading", { name: "Cập nhật hồ sơ" })).toBeVisible({
  97  |       timeout: 20_000,
  98  |     });
  99  |     await expect(page.getByLabel("Trạng thái", { exact: true })).toHaveCount(0);
  100 |     await expect(page.getByLabel("Trạng thái hồ sơ", { exact: true })).toBeVisible();
  101 |   });
  102 | 
  103 |   test("AC-F06-01: lưu trữ em còn lớp thì cảnh báo nêu TÊN LỚP, và hộp xác nhận nêu TÊN EM", async ({
  104 |     page,
  105 |   }) => {
  106 |     await openStudent(page, STUDENT);
  107 |     const statusForm = page.getByRole("form", { name: new RegExp(`Trạng thái hồ sơ của`) });
  108 |     await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("archived");
  109 | 
  110 |     // Cảnh báo phải nêu tên lớp: "em còn ghi danh đang mở" mà không nói ở lớp
  111 |     // nào thì người dùng không biết mình sắp đóng cái gì (BR-M03-N12).
  112 |     //
  113 |     // Neo vào `<strong>` chứ không phải chuỗi trần: tên lớp xuất hiện HAI chỗ
  114 |     // trong khối này (câu cảnh báo và nhãn ô tick), và một `getByText` trần sẽ
  115 |     // vi phạm chế độ nghiêm ngặt của Playwright.
  116 |     await expect(statusForm.getByText(STUDENT_CLASS, { exact: true })).toBeVisible();
  117 |     const closeBox = statusForm.getByLabel(new RegExp("Đồng thời kết thúc ghi danh"));
  118 |     await expect(closeBox).toBeVisible();
  119 |     // Mặc định KHÔNG tick: một mặc định `true` sẽ đóng ghi danh của một em vì
  120 |     // người dùng quên bỏ tick.
  121 |     await expect(closeBox).not.toBeChecked();
  122 | 
  123 |     await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  124 |     const dialog = page.getByRole("dialog");
  125 |     await expect(dialog).toBeVisible({ timeout: 20_000 });
  126 |     await expect(dialog).toContainText(STUDENT);
  127 |     await expect(dialog).toContainText(STUDENT_CLASS);
  128 |     // 🔴 S-11 — hệ quả duy nhất người dùng không suy ra được từ màn hình.
  129 |     await expect(dialog).toContainText("Giáo lý viên");
  130 | 
  131 |     // Huỷ ⇒ không ghi gì. Hồ sơ phải còn nguyên trạng thái cũ.
  132 |     //
  133 |     // Kiểm bằng **giá trị của ô chọn**, không phải bằng `getByText("Đang sinh
  134 |     // hoạt").first()`: chuỗi ấy cũng là một `<option>` bên trong `<select>` đang
  135 |     // đóng, nên `.first()` rơi vào một phần tử **ẩn** và bài đỏ trong khi giao
  136 |     // diện đúng. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B, M04-C,
  137 |     // M03-A và M03-B.
  138 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  139 |     await page.reload();
  140 |     await expect(
  141 |       page
  142 |         .getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") })
  143 |         .getByLabel("Trạng thái hồ sơ"),
  144 |     ).toHaveValue("active", { timeout: 20_000 });
  145 |   });
  146 | 
  147 |   test("🔴 D-130: tạm nghỉ hồ sơ kéo ghi danh sang Tạm nghỉ, rồi khôi phục lại", async ({
  148 |     page,
  149 |   }) => {
  150 |     // Bài ĐI VÀ VỀ trong cùng một bài — ba viewport chạy nối tiếp trên cùng một
  151 |     // database, nên bài nào để lại dấu vết là bài ấy phá lượt sau của chính nó.
  152 |     await openStudent(page, STUDENT);
  153 |     const studentPath = new URL(page.url()).pathname;
  154 | 
  155 |     /*
  156 |       🔴 `try/finally` chứ không phải một mạch thẳng — và đây là bài học đắt
  157 |       nhất của đợt này.
  158 | 
  159 |       Lượt chạy trước: bài này rớt ở **nợ #10 vế (a)** (thao tác ghi ĐÃ vào cơ
  160 |       sở dữ liệu, nhưng câu phản hồi không kịp về trong 45 giây), nên chân "về"
  161 |       không bao giờ chạy và em nằm lại ở "Tạm nghỉ". Bộ lọc mặc định của
  162 |       `/students` chỉ hiện em **đang sinh hoạt**, nên **năm bài sau của hai
  163 |       viewport sau đỏ theo** — không bài nào trong số đó có lỗi gì cả.
  164 | 
  165 |       Một bài test ghi dữ liệu phải trả lại trạng thái **kể cả khi chính nó
  166 |       rớt**, nếu không thì một lỗi ngẫu nhiên biến thành năm lỗi và tập bài đỏ
  167 |       không còn nói lên điều gì.
  168 |     */
  169 |     try {
  170 |       const statusForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
  171 |       await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("temporarily_inactive");
  172 |       await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  173 |       const pauseDialog = page.getByRole("dialog");
  174 |       await expect(pauseDialog).toContainText("giữ nguyên chỗ");
  175 |       await pauseDialog.getByRole("button", { name: "Đổi trạng thái" }).click();
  176 | 
  177 |       // Ngưỡng 45 giây, không phải 20 — nợ #10 vế (a).
  178 |       await expect(page.getByText(/Ghi danh ở lớp .* đã chuyển sang "Tạm nghỉ"/)).toBeVisible({
  179 |         timeout: 45_000,
  180 |       });
  181 | 
  182 |       // Và ghi danh THẬT SỰ đổi, không chỉ có một câu thông báo.
  183 |       await page.goto(`${studentPath}?tab=history`);
  184 |       await expect(page.getByText(STUDENT_CLASS).first()).toBeVisible({ timeout: 20_000 });
  185 |       await expect(page.getByText("Tạm nghỉ").first()).toBeVisible();
  186 |     } finally {
  187 |       // ── Về ──────────────────────────────────────────────────────────────
  188 |       await page.goto(studentPath);
  189 |       const backForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
  190 |       await backForm.getByLabel("Trạng thái hồ sơ").selectOption("active");
  191 |       await backForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
  192 |       await page.getByRole("dialog").getByRole("button", { name: "Đổi trạng thái" }).click();
> 193 |       await expect(page.getByText(/Đã khôi phục ghi danh ở lớp/)).toBeVisible({ timeout: 45_000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  194 |     }
  195 |   });
  196 | });
  197 | 
  198 | test.describe("TB-F08 · sửa và xoá bản ghi bí tích", () => {
  199 |   test("AC-F08-01 · AC-F08-02 · D-128 — vòng đời một bản ghi: thêm → trùng → sửa → xoá", async ({
  200 |     page,
  201 |   }, testInfo) => {
  202 |     await login(page, GROUP_LEADER);
  203 |     await openStudent(page, STUDENT, "sacraments");
  204 | 
  205 |     /*
  206 |       Dọn dấu vết của lượt trước NẾU có. Bài này tự dọn ở cuối, nhưng một lượt
  207 |       rớt giữa chừng sẽ để lại một bản ghi "Rửa tội" — và vì mỗi loại bí tích
  208 |       chỉ ghi được một lần cho mỗi em, lượt sau sẽ đỏ ở ngay bước đầu vì một lý
  209 |       do không liên quan gì tới thứ nó đang kiểm.
  210 |     */
  211 |     const leftover = page.getByRole("button", { name: "Xoá" });
  212 |     if ((await leftover.count()) > 0) {
  213 |       await leftover.first().click();
  214 |       await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
  215 |       await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
  216 |     }
  217 | 
  218 |     try {
  219 |       const addForm = page.getByRole("form", { name: "Thêm bí tích" });
  220 |       await expect(addForm).toBeVisible({ timeout: 20_000 });
  221 |       await addForm.getByLabel("Loại bí tích").selectOption("baptism");
  222 |       await addForm.getByLabel("Ngày lãnh").fill("2016-01-15");
  223 |       await addForm.getByLabel("Nơi lãnh").fill(`Nhà thờ E2E ${testInfo.project.name}`);
  224 |       await addForm.getByRole("button", { name: "Lưu bí tích" }).click();
  225 |       await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });
  226 | 
  227 |       // AC-F08-02 — unique index chạy đúng từ đầu, chỉ là mã `23505` từng bị nuốt
  228 |       // nên trải nghiệm là "bấm không có gì xảy ra".
  229 |       const addAgain = page.getByRole("form", { name: "Thêm bí tích" });
  230 |       await addAgain.getByLabel("Loại bí tích").selectOption("baptism");
  231 |       await addAgain.getByLabel("Ngày lãnh").fill("2016-02-20");
  232 |       await addAgain.getByRole("button", { name: "Lưu bí tích" }).click();
  233 |       await expect(page.getByText(/đã có bản ghi cho loại bí tích đó/i)).toBeVisible({
  234 |         timeout: 45_000,
  235 |       });
  236 | 
  237 |       // AC-F08-01 — sửa được, và sửa bằng một LIÊN KẾT nên không cần JavaScript.
  238 |       await page.getByRole("link", { name: "Sửa bí tích Rửa tội" }).click();
  239 |       await page.waitForURL(/edit=/, { timeout: 20_000 });
  240 |       const editForm = page.getByRole("form", { name: "Sửa bản ghi bí tích" });
  241 |       await expect(editForm.getByLabel("Ngày lãnh")).toHaveValue("2016-01-15");
  242 |       await editForm.getByLabel("Ngày lãnh").fill("2016-03-30");
  243 |       await editForm.getByRole("button", { name: "Lưu thay đổi" }).click();
  244 |       await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });
  245 | 
  246 |       // Sửa chứ KHÔNG tạo bản ghi thứ hai: vẫn đúng một dòng, và là ngày mới.
  247 |       await page.goto(`${new URL(page.url()).pathname}?tab=sacraments`);
  248 |       const list = page.getByRole("list", { name: new RegExp(`Bí tích của`) });
  249 |       await expect(list.getByRole("listitem")).toHaveCount(1, { timeout: 20_000 });
  250 |       await expect(list).toContainText("30/03/2016");
  251 | 
  252 |       // D-128 — xoá phải hỏi, và hỏi bằng tên riêng.
  253 |       await page.getByRole("button", { name: "Xoá" }).click();
  254 |       const dialog = page.getByRole("dialog");
  255 |       await expect(dialog).toContainText("Rửa tội");
  256 |       await expect(dialog).toContainText(STUDENT);
  257 |       await expect(dialog).toContainText("không có thùng rác");
  258 |       await dialog.getByRole("button", { name: "Xoá bản ghi" }).click();
  259 |       await expect(page.getByText("Đã xoá bản ghi bí tích Rửa tội.")).toBeVisible({
  260 |         timeout: 45_000,
  261 |       });
  262 |     } finally {
  263 |       /*
  264 |         Dọn **kể cả khi bài rớt giữa chừng** (nợ #10). Bước dọn ở đầu bài đã
  265 |         lo cho lượt sau của chính bài này, nhưng để bản ghi ở lại nghĩa là mọi
  266 |         spec chạy sau đó làm việc trên một fixture khác với `seed:dev`.
  267 |       */
  268 |       await openStudent(page, STUDENT, "sacraments");
  269 |       const remaining = page.getByRole("button", { name: "Xoá" });
  270 |       if ((await remaining.count()) > 0) {
  271 |         await remaining.first().click();
  272 |         await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
  273 |         await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
  274 |       }
  275 |     }
  276 |   });
  277 | 
  278 | 
  279 |   test("🔴 D-127 + D-128: Giáo lý viên GHI được bí tích nhưng KHÔNG thấy nút Xoá", async ({
  280 |     page,
  281 |   }) => {
  282 |     // Trước M03-C tab này của Giáo lý viên **không có biểu mẫu nào cả**, vì
  283 |     // `student_sacraments_*` còn là `app.can_global_write()`. Bài không ghi gì.
  284 |     await login(page, CLASS_TEACHER);
  285 |     await openStudent(page, READ_ONLY_STUDENT, "sacraments");
  286 |     await expect(page.getByRole("form", { name: "Thêm bí tích" })).toBeVisible({
  287 |       timeout: 20_000,
  288 |     });
  289 |     await expect(page.getByRole("button", { name: "Xoá" })).toHaveCount(0);
  290 |   });
  291 | 
  292 |   test("D-127: Giáo lý viên sửa được hồ sơ SỨC KHOẺ của em lớp mình", async ({ page }) => {
  293 |     // Lý lẽ chính của D-127: người biết "em này dị ứng đậu phộng" là người đứng
```