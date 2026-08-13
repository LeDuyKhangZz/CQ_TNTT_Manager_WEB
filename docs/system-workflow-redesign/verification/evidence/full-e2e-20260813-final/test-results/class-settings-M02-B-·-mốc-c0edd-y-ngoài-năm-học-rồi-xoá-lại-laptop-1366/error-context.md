# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: class-settings.spec.ts >> M02-B · mốc kết thúc học kỳ 1 (D-71) >> lưu mốc, chặn ngày ngoài năm học, rồi xoá lại
- Location: tests\e2e\class-settings.spec.ts:159:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div.rounded-md.border').filter({ hasText: '2026-2027' }).first().getByText('Đã xoá mốc kết thúc học kỳ 1')
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for locator('div.rounded-md.border').filter({ hasText: '2026-2027' }).first().getByText('Đã xoá mốc kết thúc học kỳ 1')

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
  - paragraph: Năm học 2073-2074
  - paragraph: 2073-2074 · 01/09/2073 → 31/05/2074 · 0/19 lớp
  - text: Nháp Ngày kết thúc học kỳ 1
  - textbox "Ngày kết thúc học kỳ 1"
  - button "Lưu mốc"
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - button "Sinh lớp mặc định"
  - button "Đặt hiện hành"
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
  - button "Đang lưu…" [disabled]
  - paragraph: Để trống nếu chưa xác định. Qua mốc này, lớp Dự trưởng hiện cảnh báo — hệ thống không tự đóng lớp.
  - paragraph: "Năm học còn việc tồn đọng:"
  - list:
    - listitem: 17 ghi danh đang mở
    - listitem: 2 bảng điểm chưa khoá
    - listitem: 15 buổi điểm danh chưa chốt
  - text: Lý do chốt sổ khi còn việc tồn đọng
  - textbox "Lý do chốt sổ khi còn việc tồn đọng":
    - /placeholder: "Ví dụ: đã hết năm học; 1 em chuyển giáo xứ chưa kịp kết thúc ghi danh."
  - text: "Gõ lại mã năm học để mở nút chốt sổ:"
  - strong: 2026-2027
  - 'textbox "Gõ lại mã năm học để mở nút chốt sổ: 2026-2027"':
    - /placeholder: 2026-2027
  - button "Đóng năm học" [disabled]
  - button "Sinh lớp mặc định"
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
  90  |   });
  91  | 
  92  |   test("đổi trạng thái lớp: lưu được, hiện huy hiệu ở /classes, rồi trả lại", async ({ page }, testInfo) => {
  93  |     test.setTimeout(120_000);
  94  |     const className = TOGGLED_CLASS_BY_PROJECT[testInfo.project.name] ?? "Nghĩa 2";
  95  |     await login(page, GROUP_LEADER);
  96  |     await openClass(page, className);
  97  | 
  98  |     // `updateClass` viết xong từ Phase 1 mà KHÔNG màn hình nào gọi (5W-F08). Đây là
  99  |     // bài chứng minh nó đã có call site thật.
  100 |     try {
  101 |       await saveStatus(page, "Tạm ngưng");
  102 | 
  103 |       // BR-M02-N12 — huy hiệu phải nhìn ra được từ danh sách, bằng CHỮ chứ không
  104 |       // phải chấm màu.
  105 |       await page.goto("/classes");
  106 |       const card = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  107 |       await expect(card).toContainText("Tạm ngưng", { timeout: 20_000 });
  108 |     } finally {
  109 |       // Cleanup phải chạy cả khi assertion ở giữa thất bại. Nếu để lớp tạm
  110 |       // ngưng, các fixture M07/M13 dùng lại lớp đó sẽ đỏ dây chuyền với
  111 |       // CLASS_NOT_ACTIVE và che mất nguyên nhân đầu tiên.
  112 |       await openClass(page, className);
  113 |       await saveStatus(page, "Đang hoạt động");
  114 |     }
  115 | 
  116 |     // Lớp đang hoạt động thì KHÔNG có huy hiệu — 19/19 lớp đều gắn thì huy hiệu mất
  117 |     // giá trị báo hiệu đúng lúc cần nó nhất.
  118 |     await page.goto("/classes");
  119 |     const restored = page.getByRole("link", { name: new RegExp(`^${className}\\b`) }).first();
  120 |     await expect(restored).not.toContainText("Tạm ngưng", { timeout: 20_000 });
  121 |   });
  122 | 
  123 |   test("đóng lớp còn thiếu nhi: hộp xác nhận nêu SỐ EM và TÊN LỚP (BR-M02-N11)", async ({ page }) => {
  124 |     await login(page, GROUP_LEADER);
  125 |     await openClass(page, CLASS_WITH_STUDENTS);
  126 | 
  127 |     const form = settingsForm(page);
  128 |     await form.getByLabel("Trạng thái lớp").selectOption({ label: "Đã đóng" });
  129 |     await form.getByRole("button", { name: "Lưu cài đặt lớp" }).click();
  130 | 
  131 |     // 11 §5 — hậu quả nêu bằng tên riêng, không phải "Bạn có chắc không?".
  132 |     const dialog = page.getByRole("dialog");
  133 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  134 |     await expect(dialog).toContainText("em đang sinh hoạt");
  135 |     await expect(dialog).toContainText(/không.*kết thúc ghi danh/i);
  136 | 
  137 |     // Huỷ: bài này KHÔNG được đóng lớp có thiếu nhi của cả hệ thống.
  138 |     await dialog.getByRole("button", { name: "Huỷ" }).click();
  139 |     await expect(dialog).toHaveCount(0);
  140 |     await page.reload();
  141 |     await expect(settingsForm(page).getByLabel("Trạng thái lớp")).toHaveValue("active");
  142 |   });
  143 | 
  144 |   test("Trưởng ngành ghi danh được nhưng KHÔNG sửa được cài đặt lớp", async ({ page }) => {
  145 |     await login(page, SECTOR_LEADER_AU);
  146 |     await openClass(page, CLASS_WITH_STUDENTS);
  147 | 
  148 |     // Hai nhóm quyền tách riêng có chủ ý: `ENROLLMENT_WRITE_ROLES` gồm Trưởng ngành,
  149 |     // `classes_update_global_write` thì không. Gộp làm một là hoặc cho họ bấm một
  150 |     // nút RLS sẽ chặn, hoặc cắt mất quyền ghi danh của họ.
  151 |     await expect(page.getByRole("heading", { name: "Ghi danh thiếu nhi" })).toBeVisible();
  152 |     await expect(settingsForm(page)).toHaveCount(0);
  153 |     // Nhưng vẫn ĐỌC được cài đặt: ẩn cả sự thật thì họ không biết lớp mình họp ở đâu.
  154 |     await expect(page.getByText("Phòng sinh hoạt:")).toBeVisible();
  155 |   });
  156 | });
  157 | 
  158 | test.describe("M02-B · mốc kết thúc học kỳ 1 (D-71)", () => {
  159 |   test("lưu mốc, chặn ngày ngoài năm học, rồi xoá lại", async ({ page }) => {
  160 |     test.setTimeout(120_000);
  161 |     await login(page, SUPER_ADMIN);
  162 |     await page.goto("/admin");
  163 | 
  164 |     const card = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
  165 |     const milestone = card.getByLabel("Ngày kết thúc học kỳ 1");
  166 |     await expect(milestone).toBeVisible();
  167 | 
  168 |     // Lớp chặn thứ nhất là của chính trình duyệt: `min`/`max` đọc từ năm học, khớp
  169 |     // CHECK constraint `academic_years_semester_1_range`. Ngày ngoài khoảng không gửi
  170 |     // đi được, nên câu lỗi tiếng Việt của Zod là lớp chặn thứ hai (kiểm ở unit test)
  171 |     // và cơ sở dữ liệu là lớp thứ ba (kiểm ở pgTAP `033`).
  172 |     await expect(milestone).toHaveAttribute("min", "2026-09-01");
  173 |     await expect(milestone).toHaveAttribute("max", "2027-05-31");
  174 | 
  175 |     await milestone.fill("2027-01-15");
  176 |     await card.getByRole("button", { name: "Lưu mốc" }).click();
  177 |     // D-115 — cùng một câu phải nói ra rằng hệ thống KHÔNG tự đóng lớp Dự trưởng.
  178 |     const saved = card.getByText("Đã lưu mốc kết thúc học kỳ 1");
  179 |     await expect(saved).toBeVisible({ timeout: 45_000 });
  180 |     await expect(saved).toContainText("không tự đóng lớp");
  181 | 
  182 |     await page.reload();
  183 |     const cardAgain = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
  184 |     await expect(cardAgain.getByLabel("Ngày kết thúc học kỳ 1")).toHaveValue("2027-01-15");
  185 | 
  186 |     // D-116 — lưu ô trống là XOÁ mốc, không phải lỗi. Trả lại trạng thái ban đầu để
  187 |     // lượt chạy sau và hai viewport còn lại không thấy một mốc lạ.
  188 |     await cardAgain.getByLabel("Ngày kết thúc học kỳ 1").fill("");
  189 |     await cardAgain.getByRole("button", { name: "Lưu mốc" }).click();
> 190 |     await expect(cardAgain.getByText("Đã xoá mốc kết thúc học kỳ 1")).toBeVisible({ timeout: 45_000 });
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  191 |     await page.reload();
  192 |     const finalCard = page.locator("div.rounded-md.border").filter({ hasText: SEEDED_YEAR_CODE }).first();
  193 |     await expect(finalCard.getByLabel("Ngày kết thúc học kỳ 1")).toHaveValue("");
  194 |   });
  195 | });
  196 | 
```