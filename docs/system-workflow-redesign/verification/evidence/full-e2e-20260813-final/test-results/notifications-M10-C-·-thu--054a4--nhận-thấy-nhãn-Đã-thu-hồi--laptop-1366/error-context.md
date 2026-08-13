# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications.spec.ts >> M10-C · thu hồi, lọc và phân trang >> D-166 — thu hồi bắt buộc nêu lý do, và người nhận thấy nhãn 'Đã thu hồi'
- Location: tests\e2e\notifications.spec.ts:176:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('listitem').filter({ hasText: 'E2E thu hồi 1786605259143' }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('listitem').filter({ hasText: 'E2E thu hồi 1786605259143' }).first()

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
      - listitem: Thông báo
  - paragraph: Thông báo
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Nguyễn Thư Ký
- main:
  - heading "Thông báo" [level=1]
  - paragraph: Danh sách người nhận được chốt ngay khi gửi, nên số chưa đọc không đổi khi bạn chuyển lớp hay đổi vai trò.
  - status: "Thành công: Đã gửi thông báo tới 1 người."
  - heading "Gửi thông báo" [level=3]
  - paragraph: Thông báo chỉ hiển thị trong hệ thống, không gửi SMS/email/Zalo và không hẹn giờ.
  - text: Phạm vi
  - combobox "Phạm vi":
    - option "Toàn hệ thống"
    - option "Tất cả phụ huynh"
    - option "Tất cả thiếu nhi"
    - option "Theo ngành"
    - option "Theo lớp"
    - option "Theo Ban"
    - option "Một người" [selected]
  - text: Tìm người nhận
  - searchbox "Tìm người nhận"
  - combobox "Người nhận":
    - option "Gõ ít nhất 2 ký tự để tìm" [selected]
  - text: Tiêu đề
  - textbox "Tiêu đề"
  - text: Nội dung
  - textbox "Nội dung"
  - text: Liên kết kèm theo (tùy chọn)
  - combobox "Liên kết kèm theo (tùy chọn)":
    - option "Không kèm liên kết" [selected]
    - option "/dashboard"
    - option "/notifications"
    - option "/account"
    - option "/students"
    - option "/classes"
    - option "/staff"
    - option "/attendance"
    - option "/teaching-plan"
    - option "/results"
    - option "/promotions"
    - option "/committees"
    - option "/reports"
    - option "/imports"
    - option "/admin"
    - option "/parent/absence-requests"
    - option "/parent/children"
    - option "/student/attendance"
  - button "Đang gửi…" [disabled]
  - heading "Hộp thư của tôi" [level=3]
  - paragraph: 0 thông báo chưa đọc
  - group "Lọc hộp thư":
    - link "Tất cả":
      - /url: /notifications
    - link "Chưa đọc":
      - /url: /notifications?filter=unread
  - list:
    - listitem:
      - paragraph: E2E đã đọc 1786605250349
      - paragraph: Thư ký tự gửi cho chính mình để kiểm read state.
      - paragraph: Một người13/08/2026 14:14
    - listitem:
      - paragraph: E2E đã đọc 1786604507176
      - paragraph: Thư ký tự gửi cho chính mình để kiểm read state.
      - paragraph: Một người13/08/2026 14:01
    - listitem:
      - paragraph: E2E đã đọc 1786603931006
      - paragraph: Thư ký tự gửi cho chính mình để kiểm read state.
      - paragraph: Một người13/08/2026 13:52
  - heading "Tôi đã gửi" [level=3]
  - paragraph: Xem lại thông báo mình đã gửi, kèm số người nhận thật. Gửi nhầm thì thu hồi ở đây.
  - list:
    - listitem:
      - paragraph: E2E gửi riêng 1786605256326
      - paragraph: Một người13/08/2026 14:14 · 1 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E xác nhận 1786605254111
      - paragraph: Tất cả phụ huynh13/08/2026 14:14 · 8 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E đã đọc 1786605250349
      - paragraph: Một người13/08/2026 14:14 · 1 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E thu hồi 1786604515648
      - paragraph: Một người13/08/2026 14:01 · 1 người nhận
      - paragraph: Đã thu hồi 13/08/2026 14:01 — Gửi nhầm người
    - listitem:
      - paragraph: E2E gửi riêng 1786604512827
      - paragraph: Một người13/08/2026 14:01 · 1 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E xác nhận 1786604511111
      - paragraph: Tất cả phụ huynh13/08/2026 14:01 · 5 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E đã đọc 1786604507176
      - paragraph: Một người13/08/2026 14:01 · 1 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E thu hồi 1786603940689
      - paragraph: Một người13/08/2026 13:52 · 1 người nhận
      - paragraph: Đã thu hồi 13/08/2026 13:52 — Gửi nhầm người
    - listitem:
      - paragraph: E2E gửi riêng 1786603937239
      - paragraph: Một người13/08/2026 13:52 · 1 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E xác nhận 1786603935131
      - paragraph: Tất cả phụ huynh13/08/2026 13:52 · 2 người nhận
      - button "Thu hồi" [disabled]
    - listitem:
      - paragraph: E2E đã đọc 1786603931006
      - paragraph: Một người13/08/2026 13:52 · 1 người nhận
      - button "Thu hồi" [disabled]
- alert
```

# Test source

```ts
  100 |     const before = await page.getByTestId("inbox-item").count();
  101 |     await row.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  102 | 
  103 |     // Trước M10-A nút này bấm mãi không tắt: hộp thư hiện dòng của người khác
  104 |     // còn RPC chỉ đụng dòng của chính mình.
  105 |     await expect.poll(async () => {
  106 |       await page.goto("/notifications?filter=unread");
  107 |       return page.getByTestId("inbox-item").filter({ hasText: title }).count();
  108 |     }, { timeout: 15_000 }).toBe(0);
  109 |     expect(await page.getByTestId("inbox-item").count()).toBe(before - 1);
  110 |   });
  111 | 
  112 |   test("AC-01-07 — vai trò không có quyền rộng không bị ảnh hưởng", async ({ page }) => {
  113 |     await login(page, GUARDIAN);
  114 |     await page.goto("/notifications");
  115 |     await expect(page.getByRole("heading", { name: "Hộp thư của tôi" })).toBeVisible();
  116 |     // Không có quyền công bố phạm vi nào thì không thấy biểu mẫu soạn thảo.
  117 |     await expect(page.getByRole("heading", { name: "Gửi thông báo" })).toHaveCount(0);
  118 |     await expect(page.getByText("Tôi đã gửi")).toHaveCount(0);
  119 |   });
  120 | });
  121 | 
  122 | test.describe("M10-B · xem lại trước khi gửi, và gửi đích danh", () => {
  123 |   test("AC-06-01 + AC-02-01 — hộp xác nhận nêu số người, gửi xong báo số thật", async ({ page }) => {
  124 |     await login(page, SECRETARY);
  125 |     await page.goto("/notifications");
  126 | 
  127 |     const title = `E2E xác nhận ${Date.now()}`;
  128 |     await page.getByLabel("Phạm vi").selectOption("guardians");
  129 |     await page.getByLabel("Tiêu đề").fill(title);
  130 |     await page.getByLabel("Nội dung").fill("Nội dung do bài E2E tạo.");
  131 | 
  132 |     // Nút mang sẵn con số — đợi lượt đếm trước về rồi mới bấm.
  133 |     const send = page.getByRole("button", { name: /^Gửi thông báo/ });
  134 |     await expect(send).toContainText(/\d+ người/, { timeout: 15_000 });
  135 |     await send.click();
  136 | 
  137 |     const dialog = page.getByRole("dialog");
  138 |     await expect(dialog).toBeVisible();
  139 |     await expect(dialog).toContainText(title);
  140 |     await expect(dialog).toContainText(/không thu hồi được/i);
  141 | 
  142 |     await dialog.getByRole("button", { name: /^Gửi cho \d+ người$/ }).click();
  143 |     await expect(page.getByText(/Đã gửi thông báo tới \d+ người/)).toBeVisible({ timeout: 15_000 });
  144 |   });
  145 | 
  146 |   test("AC-05-01 · D-167 — gửi đích danh tới người CHƯA gán vai trò vẫn tới nơi", async ({ page }) => {
  147 |     await login(page, SECRETARY);
  148 |     await page.goto("/notifications");
  149 | 
  150 |     const title = `E2E gửi riêng ${Date.now()}`;
  151 |     await page.getByLabel("Phạm vi").selectOption("user");
  152 |     await page.getByLabel("Tìm người nhận").fill(NO_ROLE);
  153 |     // ⚠️ `exact: true` là bắt buộc: phép so tên của Playwright mặc định là
  154 |     // **chứa chuỗi**, mà ô tìm kiếm mang nhãn "Tìm người nhận" — nó khớp luôn.
  155 |     const picker = page.getByLabel("Người nhận", { exact: true });
  156 |     await expect(picker.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
  157 |     await picker.selectOption({ index: 1 });
  158 |     await expect(page.getByText(/Chỉ người này nhìn thấy/)).toBeVisible();
  159 | 
  160 |     await page.getByLabel("Tiêu đề").fill(title);
  161 |     await page.getByLabel("Nội dung").fill("Anh/chị vừa được cấp tài khoản.");
  162 |     await page.getByRole("button", { name: /^Gửi thông báo/ }).click();
  163 |     await page.getByRole("dialog").getByRole("button", { name: /^(Gửi cho 1 người|Gửi thông báo|Vẫn gửi)$/ }).click();
  164 | 
  165 |     // 🔴 Trước D-167 câu trả lời ở đây là "0 người" — và trước M10-A thì thậm
  166 |     // chí không có câu nào cả, người gửi tưởng đã xong.
  167 |     await expect(page.getByText(/Đã gửi thông báo tới 1 người/)).toBeVisible({ timeout: 15_000 });
  168 | 
  169 |     await login(page, NO_ROLE);
  170 |     await page.goto("/notifications");
  171 |     await expect(page.getByText(title)).toBeVisible();
  172 |   });
  173 | });
  174 | 
  175 | test.describe("M10-C · thu hồi, lọc và phân trang", () => {
  176 |   test("D-166 — thu hồi bắt buộc nêu lý do, và người nhận thấy nhãn 'Đã thu hồi'", async ({ page }) => {
  177 |     await login(page, SECRETARY);
  178 |     await page.goto("/notifications");
  179 | 
  180 |     const title = `E2E thu hồi ${Date.now()}`;
  181 |     // 🔴 Nội dung cũng phải DUY NHẤT theo lượt chạy. Ba viewport dùng chung một
  182 |     // cơ sở dữ liệu, nên một chuỗi nội dung cố định sẽ còn lại từ lượt trước và
  183 |     // khẳng định "nội dung đã biến mất" ở cuối bài trở nên vô nghĩa.
  184 |     const body = `Bản sẽ bị thu hồi. ${title}`;
  185 |     await page.getByLabel("Phạm vi").selectOption("user");
  186 |     await page.getByLabel("Tìm người nhận").fill(NO_ROLE);
  187 |     // ⚠️ `exact: true` là bắt buộc: phép so tên của Playwright mặc định là
  188 |     // **chứa chuỗi**, mà ô tìm kiếm mang nhãn "Tìm người nhận" — nó khớp luôn.
  189 |     const picker = page.getByLabel("Người nhận", { exact: true });
  190 |     await expect(picker.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
  191 |     await picker.selectOption({ index: 1 });
  192 |     await page.getByLabel("Tiêu đề").fill(title);
  193 |     await page.getByLabel("Nội dung").fill(body);
  194 |     await page.getByRole("button", { name: /^Gửi thông báo/ }).click();
  195 |     await page.getByRole("dialog").getByRole("button", { name: /^(Gửi cho 1 người|Gửi thông báo|Vẫn gửi)$/ }).click();
  196 |     await expect(page.getByText(/Đã gửi thông báo tới 1 người/)).toBeVisible({ timeout: 15_000 });
  197 | 
  198 |     // Mục "Tôi đã gửi" — AC-07-01.
  199 |     const sentRow = page.getByRole("listitem").filter({ hasText: title });
> 200 |     await expect(sentRow.first()).toBeVisible({ timeout: 15_000 });
      |                                   ^ Error: expect(locator).toBeVisible() failed
  201 |     await sentRow.first().getByRole("button", { name: "Thu hồi" }).click();
  202 | 
  203 |     const dialog = page.getByRole("dialog");
  204 |     await expect(dialog).toBeVisible();
  205 |     // Lý do bỏ trống thì máy chủ từ chối — luật nằm ở cả hai tầng.
  206 |     // `exact: true`: nút huỷ tên là "Không thu hồi" — phép so mặc định là
  207 |     // **chứa chuỗi** nên nó khớp luôn cả hai nút. Sửa bộ định vị, không đổi
  208 |     // câu chữ giao diện (bài học M08-C).
  209 |     const confirmRetract = dialog.getByRole("button", { name: "Thu hồi", exact: true });
  210 |     await confirmRetract.click();
  211 |     await expect(page.getByText(/Vui lòng nêu lý do thu hồi/)).toBeVisible({ timeout: 15_000 });
  212 | 
  213 |     await dialog.getByLabel(/Lý do thu hồi/).fill("Gửi nhầm người");
  214 |     await confirmRetract.click();
  215 |     // 🔴 Khẳng định phải mang ĐÚNG TIÊU ĐỀ của lượt này. Bản đầu chờ `/Đã thu
  216 |     // hồi/` chung chung và nó khớp ngay **dòng đã thu hồi của lượt viewport
  217 |     // trước** trong mục "Tôi đã gửi" — một cái xanh giả, và vì xanh ngay lập tức
  218 |     // nên bài test điều hướng đi khi lệnh thu hồi còn đang bay, làm chính thao
  219 |     // tác đang được kiểm **không bao giờ chạy xong**. Đo được ở cơ sở dữ liệu:
  220 |     // chỉ lượt viewport đầu tiên thu hồi thật.
  221 |     await expect(page.getByText(`Đã thu hồi “${title}”`)).toBeVisible({ timeout: 15_000 });
  222 | 
  223 |     // Vế người nhận: dòng Ở LẠI, nội dung thì không.
  224 |     await login(page, NO_ROLE);
  225 |     await page.goto("/notifications");
  226 |     await expect(page.getByText("Thông báo này đã được thu hồi").first()).toBeVisible();
  227 |     await expect(page.getByText(body)).toHaveCount(0);
  228 |   });
  229 | 
  230 |   test("TB-M10-06 — bộ lọc chưa đọc là một liên kết chép được", async ({ page }) => {
  231 |     await login(page, SECRETARY);
  232 |     await page.goto("/notifications");
  233 |     await page.getByRole("link", { name: "Chưa đọc" }).click();
  234 |     await expect(page).toHaveURL(/\/notifications\?filter=unread$/);
  235 |     await expect(page.getByRole("link", { name: "Chưa đọc" })).toHaveAttribute("aria-current", "page");
  236 |   });
  237 | });
  238 | 
```