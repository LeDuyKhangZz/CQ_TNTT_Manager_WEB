# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: academic-year.spec.ts >> M02-A · quản trị năm học >> sinh lớp mặc định: phân biệt 'đã có đủ từ trước' với 'vừa tạo'
- Location: tests\e2e\academic-year.spec.ts:104:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div.rounded-md.border').filter({ hasText: '2026-2027' }).first().getByText('đã có đủ 19 lớp từ trước')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('div.rounded-md.border').filter({ hasText: '2026-2027' }).first().getByText('đã có đủ 19 lớp từ trước')

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
      - listitem:
        - link "Quản trị hệ thống":
          - /url: /admin
  - button "Đăng xuất"
- banner:
  - navigation "Đường dẫn trang":
    - list:
      - listitem:
        - link "Trang chủ":
          - /url: /dashboard
      - listitem: Quản trị hệ thống
  - paragraph: Quản trị hệ thống
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Khang Nhỏ
- main:
  - heading "Quản trị hệ thống" [level=1]
  - paragraph: Cấu hình năm học và khởi tạo cơ cấu lớp chuẩn.
  - heading "Năm học" [level=3]
  - paragraph: Mỗi thời điểm chỉ có một năm học hiện hành.
  - paragraph: Năm học 2072-2073
  - paragraph: 2072-2073 · 01/09/2072 → 31/05/2073 · 0/19 lớp
  - text: Nháp Ngày kết thúc học kỳ 1
  - textbox "Ngày kết thúc học kỳ 1"
  - button "Lưu mốc"
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - button "Sinh lớp mặc định"
  - button "Đặt hiện hành"
  - paragraph: Năm học 2071-2072
  - paragraph: 2071-2072 · 01/09/2071 → 31/05/2072 · 0/19 lớp
  - text: Nháp Ngày kết thúc học kỳ 1
  - textbox "Ngày kết thúc học kỳ 1"
  - button "Lưu mốc"
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - button "Sinh lớp mặc định"
  - button "Đặt hiện hành"
  - paragraph: Năm đích E2E Phase 5
  - paragraph: 2027-2028 · 01/09/2027 → 31/05/2028 · 2/19 lớp
  - text: Nháp Ngày kết thúc học kỳ 1
  - textbox "Ngày kết thúc học kỳ 1"
  - button "Lưu mốc"
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - button "Sinh lớp mặc định"
  - button "Đặt hiện hành"
  - paragraph: Năm học 2026-2027
  - paragraph: 2026-2027 · 01/09/2026 → 31/05/2027 · 19/19 lớp
  - text: Đang áp dụng Ngày kết thúc học kỳ 1
  - textbox "Ngày kết thúc học kỳ 1"
  - button "Lưu mốc"
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - paragraph: "Năm học còn việc tồn đọng:"
  - list:
    - listitem: 17 ghi danh đang mở
    - listitem: 2 bảng điểm chưa khoá
    - listitem: 10 buổi điểm danh chưa chốt
  - text: Lý do chốt sổ khi còn việc tồn đọng
  - textbox "Lý do chốt sổ khi còn việc tồn đọng":
    - /placeholder: "Ví dụ: đã hết năm học; 1 em chuyển giáo xứ chưa kịp kết thúc ghi danh."
  - text: "Gõ lại mã năm học để mở nút chốt sổ:"
  - strong: 2026-2027
  - 'textbox "Gõ lại mã năm học để mở nút chốt sổ: 2026-2027"':
    - /placeholder: 2026-2027
  - button "Đóng năm học" [disabled]
  - button "Đang xử lý…" [disabled]
  - paragraph: Năm học 2024-2025
  - paragraph: 2024-2025 · 01/09/2024 → 31/05/2025 · 0/19 lớp
  - text: Đã đóng
  - paragraph: Lưu trữ được từ sau 31/05/2030 — dữ liệu của năm học phải được giữ 5 năm sau khi kết thúc.
  - paragraph: Năm học 2019-2020
  - paragraph: 2019-2020 · 01/09/2019 → 31/05/2020 · 0/19 lớp
  - text: Đã đóng
  - button "Lưu trữ"
  - heading "Tạo năm học" [level=3]
  - paragraph: Năm mới được tạo ở trạng thái nháp; hãy sinh lớp trước khi đặt hiện hành.
  - text: Mã năm học
  - textbox "Mã năm học":
    - /placeholder: 2026-2027
  - text: Tên hiển thị
  - textbox "Tên hiển thị":
    - /placeholder: Năm học 2026–2027
  - text: Ngày bắt đầu
  - textbox "Ngày bắt đầu"
  - text: Ngày kết thúc
  - textbox "Ngày kết thúc"
  - text: Ngày kết thúc học kỳ 1 (không bắt buộc)
  - textbox "Ngày kết thúc học kỳ 1 (không bắt buộc)"
  - paragraph: Mốc để cảnh báo lớp Dự trưởng đã hết học kỳ 1. Bỏ trống thì sửa sau cũng được.
  - text: Khóa điểm danh (ngày)
  - spinbutton "Khóa điểm danh (ngày)": "3"
  - text: Phiên chỉnh sửa (phút)
  - spinbutton "Phiên chỉnh sửa (phút)": "15"
  - checkbox "Bật tính năng Top 5 cho năm học"
  - text: Bật tính năng Top 5 cho năm học
  - button "Tạo năm học nháp"
  - heading "Cấu hình điểm danh" [level=3]
  - paragraph: Áp dụng cho năm học hiện hành. Ngưỡng cảnh báo dùng cho bảng chuyên cần và trang phụ huynh; đổi ở đây có hiệu lực ngay, không cần sửa mã nguồn.
  - text: Khóa điểm danh sau (ngày)
  - spinbutton "Khóa điểm danh sau (ngày)": "3"
  - text: Phiên chỉnh sửa (phút)
  - spinbutton "Phiên chỉnh sửa (phút)": "15"
  - text: Cảnh báo khi vắng liên tiếp (buổi)
  - spinbutton "Cảnh báo khi vắng liên tiếp (buổi)": "3"
  - text: Cảnh báo khi vắng lễ liên tiếp (Chúa nhật)
  - spinbutton "Cảnh báo khi vắng lễ liên tiếp (Chúa nhật)": "3"
  - text: Cảnh báo khi tỷ lệ chuyên cần dưới (%)
  - spinbutton "Cảnh báo khi tỷ lệ chuyên cần dưới (%)": "80"
  - button "Lưu cấu hình"
  - heading "Tạo tài khoản ngoại lệ" [level=3]
  - paragraph:
    - text: Chỉ dành cho người
    - strong: không có hồ sơ Giáo lý viên
    - text: ": Cha sở, Cha phó, phụ huynh và thiếu nhi. Mật khẩu tạm 8 ký tự chỉ hiển thị sau khi tạo thành công."
  - paragraph:
    - text: Tài khoản của Giáo lý viên được cấp ngay tại hồ sơ người đó —
    - link "mở Danh sách nhân sự":
      - /url: /staff
    - text: ", chọn đúng người rồi bấm “Cấp tài khoản”. Ở đó trang biết sẵn mã GLV, lớp và phân công nên không phải gõ lại."
  - text: Vai trò
  - combobox "Vai trò":
    - option "Cha sở" [selected]
    - option "Cha phó/Tuyên úy"
    - option "Phụ huynh"
    - option "Thiếu nhi"
  - text: Tên đăng nhập
  - textbox "Tên đăng nhập"
  - text: Tên hiển thị
  - textbox "Tên hiển thị"
  - text: Tên thánh
  - textbox "Tên thánh"
  - text: Điện thoại
  - textbox "Điện thoại"
  - text: Email liên hệ (tùy chọn)
  - textbox "Email liên hệ (tùy chọn)"
  - text: Ngày bắt đầu
  - textbox "Ngày bắt đầu"
  - button "Tạo tài khoản"
  - heading "Tài khoản hiện có" [level=3]
  - paragraph: Chỉ tài khoản không phải Super Admin mới sửa hoặc xóa được tại đây.
  - text: Tìm tài khoản
  - searchbox "Tìm tài khoản"
  - combobox "Lọc theo vai trò":
    - option "Tất cả vai trò" [selected]
    - option "Quản trị viên hệ thống"
    - option "Cha sở"
    - option "Cha phó/Tuyên úy"
    - option "Xứ đoàn trưởng"
    - option "Phó Xứ đoàn"
    - option "Thư ký"
    - option "Thủ quỹ"
    - option "Trưởng ngành"
    - option "Phó ngành"
    - option "Giáo lý viên đại diện"
    - option "Giáo lý viên lớp"
    - option "Dự trưởng phụ tá"
    - option "Phụ huynh"
    - option "Thiếu nhi"
  - combobox "Lọc theo trạng thái":
    - option "Mọi trạng thái" [selected]
    - option "Đang hoạt động"
    - option "Đã vô hiệu hóa"
  - status: 33 tài khoản · trang 1/5
  - paragraph: Nguyễn Văn Ba
  - paragraph: 84912000001 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Nguyễn Văn Ba": "84912000001"
  - button "Lưu username"
  - textbox "Mật khẩu mới Nguyễn Văn Ba":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Trần Thị Bốn
  - paragraph: 84912000002 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Trần Thị Bốn": "84912000002"
  - button "Lưu username"
  - textbox "Mật khẩu mới Trần Thị Bốn":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa liên kết 1
  - paragraph: 84918888101 · Chưa gán vai trò
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa liên kết 1": "84918888101"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa liên kết 1":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa có con 1
  - paragraph: 84918888102 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa có con 1": "84918888102"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa có con 1":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa ghi danh 1
  - paragraph: 84918888103 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa ghi danh 1": "84918888103"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa ghi danh 1":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa liên kết 2
  - paragraph: 84918888201 · Chưa gán vai trò
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa liên kết 2": "84918888201"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa liên kết 2":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa có con 2
  - paragraph: 84918888202 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa có con 2": "84918888202"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa có con 2":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - paragraph: Portal chưa ghi danh 2
  - paragraph: 84918888203 · Phụ huynh
  - text: Đang hoạt động
  - textbox "Tên đăng nhập Portal chưa ghi danh 2": "84918888203"
  - button "Lưu username"
  - textbox "Mật khẩu mới Portal chưa ghi danh 2":
    - /placeholder: Mật khẩu mới, ít nhất 8 ký tự
  - button "Đặt mật khẩu"
  - button "Tạo mật khẩu ngẫu nhiên"
  - button "Vô hiệu hóa"
  - button "Xóa tài khoản"
  - button "Trang trước" [disabled]
  - text: Trang 1/5
  - button "Trang sau"
- alert
```

# Test source

```ts
  19  | /** Vai trò ghi toàn xứ đoàn nhưng KHÔNG phải Super Admin — dùng cho bài D-112. */
  20  | const SECRETARY = "GLV903";
  21  | const SEEDED_YEAR_CODE = "2026-2027";
  22  | 
  23  | /** Mỗi viewport một mã năm nháp riêng: ba lượt chạy không giẫm lên nhau. */
  24  | const DRAFT_YEAR_BY_PROJECT: Record<string, string> = {
  25  |   "mobile-360": "2071-2072",
  26  |   "tablet-768": "2072-2073",
  27  |   "laptop-1366": "2073-2074",
  28  | };
  29  | 
  30  | async function login(page: Page, username: string) {
  31  |   await page.context().clearCookies();
  32  |   await page.goto("/login");
  33  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  34  |     await page.getByLabel("Tên đăng nhập").fill(username);
  35  |     await page.locator("input#password").fill(DEV_PASSWORD);
  36  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  37  |     try {
  38  |       await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
  39  |       return;
  40  |     } catch {
  41  |       await page.goto("/login");
  42  |     }
  43  |   }
  44  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  45  | }
  46  | 
  47  | function yearCard(page: Page, code: string) {
  48  |   return page.locator("div.rounded-md.border").filter({ hasText: code }).first();
  49  | }
  50  | 
  51  | /**
  52  |  * 🔴 Phải neo vào ĐÚNG biểu mẫu. Trang `/admin` còn khối cấp tài khoản, và khối
  53  |  * đó cũng có một ô nhãn "Tên hiển thị" — `page.getByLabel("Tên hiển thị")` khớp
  54  |  * hai phần tử và Playwright báo strict mode violation.
  55  |  */
  56  | function createYearForm(page: Page) {
  57  |   return page.locator("form").filter({ has: page.locator("#academic-code") });
  58  | }
  59  | 
  60  | async function fillNewYear(page: Page, code: string, name: string, start: string, end: string) {
  61  |   const form = createYearForm(page);
  62  |   await form.getByLabel("Mã năm học").fill(code);
  63  |   await form.getByLabel("Tên hiển thị").fill(name);
  64  |   await form.getByLabel("Ngày bắt đầu").fill(start);
  65  |   // 🔴 `exact: true` là bắt buộc từ M02-B. `getByLabel` khớp theo **chuỗi con**, và
  66  |   // D-71 thêm ô "Ngày kết thúc học kỳ 1" vào đúng biểu mẫu này — nhãn mới BAO CHỨA
  67  |   // nhãn cũ, nên bản không `exact` khớp hai phần tử và Playwright báo strict mode
  68  |   // violation. Cùng họ với lỗi "Tên hiển thị trùng hai chỗ" của M02-A: trang
  69  |   // `/admin` đông biểu mẫu, mọi bài test phải neo chính xác.
  70  |   await form.getByLabel("Ngày kết thúc", { exact: true }).fill(end);
  71  |   await form.getByRole("button", { name: "Tạo năm học nháp" }).click();
  72  | }
  73  | 
  74  | test.describe("M02-A · quản trị năm học", () => {
  75  |   test("trang quản trị nói tiếng Việt: trạng thái, ngày tháng, số lớp", async ({ page }) => {
  76  |     await login(page, SUPER_ADMIN);
  77  |     await page.goto("/admin");
  78  | 
  79  |     const card = yearCard(page, SEEDED_YEAR_CODE);
  80  |     await expect(card).toBeVisible();
  81  |     // Bản cũ in thẳng enum của cơ sở dữ liệu ("current") và ngày ISO thô.
  82  |     await expect(card).toContainText("Đang áp dụng");
  83  |     await expect(card).not.toContainText("current");
  84  |     await expect(card).toContainText("01/09/2026");
  85  |     await expect(card).toContainText("19/19 lớp");
  86  |   });
  87  | 
  88  |   test("tạo năm học trùng mã: báo lỗi tại chỗ và GIỮ dữ liệu đã gõ", async ({ page }) => {
  89  |     await login(page, SUPER_ADMIN);
  90  |     await page.goto("/admin");
  91  | 
  92  |     await fillNewYear(page, SEEDED_YEAR_CODE, "Năm học gõ trùng", "2026-09-01", "2027-05-31");
  93  | 
  94  |     // AC-M02-04: trước đợt này màn hình im lặng hoàn toàn.
  95  |     await expect(page.getByText(`Mã năm học ${SEEDED_YEAR_CODE} đã tồn tại`)).toBeVisible({
  96  |       timeout: 20_000,
  97  |     });
  98  |     // D-61 (biểu mẫu dài): không bắt gõ lại bảy ô.
  99  |     const form = createYearForm(page);
  100 |     await expect(form.getByLabel("Tên hiển thị")).toHaveValue("Năm học gõ trùng");
  101 |     await expect(form.getByLabel("Ngày kết thúc", { exact: true })).toHaveValue("2027-05-31");
  102 |   });
  103 | 
  104 |   test("sinh lớp mặc định: phân biệt 'đã có đủ từ trước' với 'vừa tạo'", async ({ page }) => {
  105 |     await login(page, SUPER_ADMIN);
  106 |     await page.goto("/admin");
  107 | 
  108 |     const card = yearCard(page, SEEDED_YEAR_CODE);
  109 |     await card.getByRole("button", { name: "Sinh lớp mặc định" }).click();
  110 | 
  111 |     // 11 §5: hộp xác nhận nêu hậu quả bằng tên riêng, không phải "Bạn có chắc?".
  112 |     const dialog = page.getByRole("dialog");
  113 |     await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);
  114 |     await expect(dialog).toContainText("19/19 lớp");
  115 |     await dialog.getByRole("button", { name: "Sinh lớp", exact: true }).click();
  116 | 
  117 |     // Câu trả lời hiện NGAY TẠI CHỖ vừa bấm, không qua chuyển hướng — xem ghi
  118 |     // chú dài ở cuối `academic-years/server/actions.ts`.
> 119 |     await expect(card.getByText("đã có đủ 19 lớp từ trước")).toBeVisible({ timeout: 20_000 });
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  120 |     await expect(page.getByText("Đã tạo 0")).toHaveCount(0);
  121 |   });
  122 | 
  123 |   test("đặt hiện hành: cảnh báo bằng số lớp thật trước khi làm (D-113)", async ({ page }, testInfo) => {
  124 |     const draftCode = DRAFT_YEAR_BY_PROJECT[testInfo.project.name] ?? "2079-2080";
  125 |     await login(page, SUPER_ADMIN);
  126 |     await page.goto("/admin");
  127 | 
  128 |     if ((await yearCard(page, draftCode).count()) === 0) {
  129 |       const startYear = draftCode.slice(0, 4);
  130 |       const endYear = draftCode.slice(5);
  131 |       await fillNewYear(
  132 |         page,
  133 |         draftCode,
  134 |         `Năm học ${draftCode}`,
  135 |         `${startYear}-09-01`,
  136 |         `${endYear}-05-31`,
  137 |       );
  138 |       await expect(page.getByText("Đã tạo năm học nháp")).toBeVisible({ timeout: 20_000 });
  139 |       await page.reload();
  140 |     }
  141 | 
  142 |     const card = yearCard(page, draftCode);
  143 |     await expect(card).toContainText("Nháp");
  144 |     await expect(card).toContainText("0/19 lớp");
  145 | 
  146 |     await card.getByRole("button", { name: "Đặt hiện hành" }).click();
  147 |     const dialog = page.getByRole("dialog");
  148 |     // Đúng nửa sau của sự cố production: đặt hiện hành khi chưa có lớp nào.
  149 |     await expect(dialog).toContainText("mới có 0/19 lớp");
  150 |     await expect(dialog).toContainText("chưa ghi danh hay điểm danh được");
  151 |     await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);
  152 | 
  153 |     // Huỷ: bài test này KHÔNG được đổi năm hiện hành của cả hệ thống.
  154 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  155 |     await expect(dialog).toHaveCount(0);
  156 |     await expect(yearCard(page, SEEDED_YEAR_CODE)).toContainText("Đang áp dụng");
  157 |   });
  158 | 
  159 |   test("D-112: Thư ký (ghi toàn xứ đoàn) không vào được trang quản trị", async ({ page }) => {
  160 |     await login(page, SECRETARY);
  161 |     await page.goto("/admin");
  162 |     await expect(page).toHaveURL(/\/access-denied$/);
  163 |   });
  164 | });
  165 | 
  166 | /**
  167 |  * M02-C — chốt sổ (I7 / TB-F09 / D-73) và lưu trữ (D-120).
  168 |  *
  169 |  * 🔴 **Cả hai bài đều dừng ở nút "Huỷ", và đó là chủ ý — không phải bài test viết
  170 |  * dở.** Chốt sổ và lưu trữ đều là thao tác **một chiều** (hệ thống không có luồng mở
  171 |  * lại năm học, cũng không có luồng bỏ lưu trữ), mà ba viewport lại **dùng chung một
  172 |  * database** (bài học M04-A). Một lượt xác nhận ở `mobile-360` là mọi spec sau đó
  173 |  * chạy trên một hệ thống **không còn năm học hiện hành** — tức toàn bộ bộ E2E đỏ.
  174 |  * Phần sau nút xác nhận được kiểm bằng **JWT thật ở pgTAP `034`**, nơi giao dịch được
  175 |  * `rollback`: ở đó có đủ cả đóng cưỡng bức thành công, lưu trữ thành công, và mọi
  176 |  * đường bị chặn.
  177 |  */
  178 | test.describe("M02-C · chốt sổ và lưu trữ năm học", () => {
  179 |   test("đóng năm học: bảng kiểm nêu con số thật, và ba lớp ma sát đều có thật", async ({ page }) => {
  180 |     await login(page, SUPER_ADMIN);
  181 |     await page.goto("/admin");
  182 |     const card = yearCard(page, SEEDED_YEAR_CODE);
  183 | 
  184 |     // WF-16 bước 1–3 — bảng kiểm do cơ sở dữ liệu đếm, không do trang tự đếm.
  185 |     // Dữ liệu mẫu có thiếu nhi đang ghi danh, nên dòng này phải xuất hiện.
  186 |     await expect(card).toContainText("ghi danh đang mở");
  187 | 
  188 |     const codeInput = card.getByLabel(/Gõ lại mã năm học/);
  189 |     const closeButton = card.getByRole("button", { name: "Đóng năm học" });
  190 |     await expect(closeButton).toBeDisabled();
  191 | 
  192 |     // Ma sát 2 — gõ lại đúng mã (BR-M02-N08). Mã của năm khác không mở được nút.
  193 |     await codeInput.fill("2027-2028");
  194 |     await expect(closeButton).toBeDisabled();
  195 |     await codeInput.fill(SEEDED_YEAR_CODE);
  196 | 
  197 |     // Ma sát 3 — còn việc tồn đọng thì phải ghi lý do (BR-M02-N05).
  198 |     await expect(closeButton).toBeDisabled();
  199 |     await card.getByLabel(/Lý do chốt sổ/).fill("Kiểm thử E2E — sẽ bấm Huỷ, không chốt sổ thật");
  200 |     await expect(closeButton).toBeEnabled();
  201 | 
  202 |     await closeButton.click();
  203 |     const dialog = page.getByRole("dialog");
  204 |     // `11` §5 — hậu quả nêu bằng tên riêng, và nêu cả điều người dùng phát hiện
  205 |     // muộn nhất nếu không nói ra.
  206 |     await expect(dialog).toContainText(`Năm học ${SEEDED_YEAR_CODE}`);
  207 |     await expect(dialog).toContainText("không còn năm học hiện hành nào");
  208 |     await expect(dialog).toContainText("ghi danh đang mở");
  209 |     await expect(dialog).toContainText("Quản trị viên hệ thống");
  210 | 
  211 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  212 |     await expect(dialog).toHaveCount(0);
  213 |     await expect(card).toContainText("Đang áp dụng");
  214 |   });
  215 | 
  216 |   test("D-120: nút Lưu trữ chỉ hiện ở năm đã quá hạn giữ dữ liệu", async ({ page }) => {
  217 |     await login(page, SUPER_ADMIN);
  218 |     await page.goto("/admin");
  219 | 
```