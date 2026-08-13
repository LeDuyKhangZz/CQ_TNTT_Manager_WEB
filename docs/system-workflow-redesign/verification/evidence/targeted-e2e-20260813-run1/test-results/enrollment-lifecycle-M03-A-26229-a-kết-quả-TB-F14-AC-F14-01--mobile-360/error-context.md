# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enrollment-lifecycle.spec.ts >> M03-A · vòng đời ghi danh >> mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)
- Location: tests\e2e\enrollment-lifecycle.spec.ts:180:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('status').first()
Expected: visible
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('status').first()

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
      - listitem: Thiếu nhi
  - paragraph: Thiếu nhi
  - paragraph: "Năm học hiện hành: 2026-2027"
  - link "Mở thông báo":
    - /url: /notifications
  - group
- main:
  - paragraph: "Đang xem: Huynh Trưởng · Năm học 2026-2027"
  - heading "Thiếu nhi" [level=1]
  - paragraph: Hồ sơ thiếu nhi và người giám hộ.
  - group "Lọc danh sách thiếu nhi":
    - text: Lọc danh sách thiếu nhi Tìm theo tên thiếu nhi, mã hoặc số điện thoại phụ huynh
    - searchbox "Tìm theo tên thiếu nhi, mã hoặc số điện thoại phụ huynh"
    - paragraph: Gõ không dấu cũng tìm được.
    - text: Ngành
    - combobox "Ngành":
      - option "Tất cả ngành" [selected]
      - option "Chiên Con"
      - option "Ấu Nhi"
      - option "Thiếu Nhi"
      - option "Nghĩa Sĩ"
      - option "Hiệp Sĩ"
    - text: Lớp
    - combobox "Lớp":
      - option "Tất cả lớp" [selected]
      - option "Chưa xếp lớp"
      - option "Ấu 1A"
      - option "Ấu 1B"
      - option "Ấu 2A"
      - option "Ấu 2B"
      - option "Ấu 3A"
      - option "Ấu 3B"
      - option "Chiên Con 1"
      - option "Chiên Con 2"
      - option "Dự trưởng"
      - option "Hiệp 2"
      - option "Nghĩa 1"
      - option "Nghĩa 2"
      - option "Nghĩa 3"
      - option "Thiếu 1A"
      - option "Thiếu 1B"
      - option "Thiếu 2A"
      - option "Thiếu 2B"
      - option "Thiếu 3"
    - text: Trạng thái hồ sơ
    - combobox "Trạng thái hồ sơ":
      - option "Đang sinh hoạt" [selected]
      - option "Tất cả trạng thái"
      - option "Tạm nghỉ"
      - option "Đã rút"
      - option "Đã lưu trữ"
    - button "Lọc"
  - heading "Danh sách thiếu nhi" [level=3]
  - paragraph: 4 hồ sơ trong phạm vi của bạn · đang lọc "Đang sinh hoạt".
  - list "Danh sách thiếu nhi":
    - listitem:
      - 'link "Anna Đinh Gia Hân Giám hộ: Đinh GLV 1A · 0901000010 Lớp: Thiếu 1A Thiếu Nhi Đang sinh hoạt"':
        - /url: /students/a0fa89a1-fa88-4146-b203-1a37ab5da85b
        - paragraph: Anna Đinh Gia Hân
        - paragraph: "Giám hộ: Đinh GLV 1A · 0901000010"
        - paragraph: "Lớp: Thiếu 1A"
        - text: Thiếu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Giuse Nguyễn Minh An Giám hộ: Nguyễn Văn Ba · 0912000001 Lớp: Ấu 1A Ấu Nhi Đang sinh hoạt"':
        - /url: /students/a622669e-8e82-45bf-a119-31d193fd085f
        - paragraph: Giuse Nguyễn Minh An
        - paragraph: "Giám hộ: Nguyễn Văn Ba · 0912000001"
        - paragraph: "Lớp: Ấu 1A"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Phêrô Nguyễn Minh Khoa Giám hộ: Nguyễn Văn Ba · 0912000001 Lớp: Ấu 1B Ấu Nhi Đang sinh hoạt"':
        - /url: /students/146fc2b5-bc06-4fce-9838-fb4d37aaf563
        - paragraph: Phêrô Nguyễn Minh Khoa
        - paragraph: "Giám hộ: Nguyễn Văn Ba · 0912000001"
        - paragraph: "Lớp: Ấu 1B"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Maria Trần Bảo Châu Giám hộ: Trần Thị Bốn · 0912000002 Lớp: Ấu 1A Ấu Nhi Đang sinh hoạt"':
        - /url: /students/fbcd5258-cb66-4142-9556-5450d0b3b844
        - paragraph: Maria Trần Bảo Châu
        - paragraph: "Giám hộ: Trần Thị Bốn · 0912000002"
        - paragraph: "Lớp: Ấu 1A"
        - text: Ấu Nhi Đang sinh hoạt
  - heading "Thêm người giám hộ" [level=3]
  - paragraph: Tạo phụ huynh trước khi thêm con.
  - form "Thêm người giám hộ":
    - text: Họ tên phụ huynh
    - textbox "Họ tên phụ huynh": Phụ huynh E2E 825418
    - text: Điện thoại
    - textbox "Điện thoại": "0982541800"
    - text: Địa chỉ
    - textbox "Địa chỉ"
    - button "Đang lưu…" [disabled]
  - heading "Thêm thiếu nhi" [level=3]
  - paragraph: Mã thiếu nhi được cấp tự động.
  - form "Thêm thiếu nhi":
    - text: Người giám hộ
    - combobox "Người giám hộ":
      - option "Chọn phụ huynh" [disabled] [selected]
      - option "Đinh GLV 1A · 0901000010"
      - option "Nguyễn Văn Ba · 0912000001"
      - option "Phụ huynh E2E không tài khoản · 0912999999"
      - option "Trần Thị Bốn · 0912000002"
    - text: Tên thánh
    - textbox "Tên thánh"
    - text: Giới tính
    - combobox "Giới tính":
      - option "Nam" [selected]
      - option "Nữ"
      - option "Khác"
    - text: Họ tên
    - textbox "Họ tên"
    - text: Ngày sinh
    - textbox "Ngày sinh"
    - text: Ngày bổn mạng
    - textbox "Ngày bổn mạng"
    - text: Ghi danh vào lớp (nếu đã biết)
    - combobox "Ghi danh vào lớp (nếu đã biết)":
      - option "Chưa xếp lớp" [disabled] [selected]
      - option "Ấu 1A · Ấu Nhi"
      - option "Ấu 1B · Ấu Nhi"
      - option "Ấu 2A · Ấu Nhi"
      - option "Ấu 2B · Ấu Nhi"
      - option "Ấu 3A · Ấu Nhi"
      - option "Ấu 3B · Ấu Nhi"
      - option "Chiên Con 1 · Chiên Con"
      - option "Chiên Con 2 · Chiên Con"
      - option "Dự trưởng"
      - option "Hiệp 2 · Hiệp Sĩ"
      - option "Nghĩa 1 · Nghĩa Sĩ"
      - option "Nghĩa 2 · Nghĩa Sĩ"
      - option "Nghĩa 3 · Nghĩa Sĩ"
      - option "Thiếu 1A · Thiếu Nhi"
      - option "Thiếu 1B · Thiếu Nhi"
      - option "Thiếu 2A · Thiếu Nhi"
      - option "Thiếu 2B · Thiếu Nhi"
      - option "Thiếu 3 · Thiếu Nhi"
    - paragraph: Để trống cũng được — mở hồ sơ em để ghi danh sau.
    - text: Điện thoại (nếu có)
    - textbox "Điện thoại (nếu có)"
    - text: Địa chỉ
    - textbox "Địa chỉ"
    - checkbox "Hoàn cảnh khó khăn"
    - text: Hoàn cảnh khó khăn
    - button "Tạo hồ sơ thiếu nhi"
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
  100 | 
  101 |     // --- Khôi phục --------------------------------------------------------
  102 |     // AC-F10-02: chức năng này CHƯA TỪNG TỒN TẠI trước đợt này (BR-M03-21).
  103 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Khôi phục" }).click();
  104 |     await expect(page.getByRole("status").filter({ hasText: "Đang học" }).first()).toBeVisible({
  105 |       timeout: 45_000,
  106 |     });
  107 |     await page.reload();
  108 | 
  109 |     // Về đúng trạng thái ban đầu: sĩ số hết vế "trong đó N tạm nghỉ", và KHÔNG tạo
  110 |     // ghi danh thứ hai — nếu có, sĩ số sẽ nhảy lên 3 (AC-F10-02).
  111 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  112 |     // Chữ thường: vế "… tạm nghỉ" của câu sĩ số. Nút mang chữ "Tạm nghỉ" viết hoa
  113 |     // nên không lọt vào phép đếm này.
  114 |     await expect(page.getByText(/tạm nghỉ/)).toHaveCount(0);
  115 |     // Và nút quay lại đúng nhãn ban đầu — em không còn ở trạng thái tạm nghỉ.
  116 |     await expect(rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Tạm nghỉ" })).toBeVisible();
  117 |   });
  118 | 
  119 |   test("ô lý do kết thúc KHÔNG còn mục 'Tạm nghỉ' — gốc rễ của F10", async ({ page }) => {
  120 |     await login(page, GROUP_LEADER);
  121 |     await openClass(page, CLASS_WITH_STUDENTS);
  122 | 
  123 |     const select = page.getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`);
  124 |     await expect(select).toBeVisible({ timeout: 20_000 });
  125 |     const values = await select.locator("option").evaluateAll((options) =>
  126 |       options.map((option) => (option as HTMLOptionElement).value),
  127 |     );
  128 |     expect(values).toEqual(["withdrawn", "completed", "transferred", "repeating"]);
  129 |   });
  130 | 
  131 |   test("kết thúc phải HỎI TRƯỚC, nêu tên em và tên lớp (AC-F10-03)", async ({ page }) => {
  132 |     await login(page, GROUP_LEADER);
  133 |     await openClass(page, CLASS_WITH_STUDENTS);
  134 | 
  135 |     const row = rosterRow(page, STUDENT_NAME);
  136 |     await expect(row).toBeVisible({ timeout: 20_000 });
  137 |     await row.getByRole("button", { name: "Kết thúc", exact: true }).click();
  138 | 
  139 |     // Trước đợt này nút "Kết thúc" nằm ngay cạnh tên từng em và ghi thẳng, không
  140 |     // hỏi gì (C5 = 1 trong biên bản audit).
  141 |     const dialog = page.getByRole("dialog");
  142 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  143 |     await expect(dialog).toContainText(STUDENT_NAME);
  144 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  145 | 
  146 |     // Huỷ ⇒ không ghi gì. Sĩ số phải còn nguyên.
  147 |     await page.getByRole("button", { name: "Huỷ" }).click();
  148 |     await expect(dialog).toBeHidden();
  149 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  150 |   });
  151 | 
  152 |   test("D-122 · lý do 'Chuyển lớp' nói thẳng hệ thống KHÔNG ghi danh em vào lớp mới", async ({ page }) => {
  153 |     await login(page, GROUP_LEADER);
  154 |     await openClass(page, CLASS_WITH_STUDENTS);
  155 | 
  156 |     await page
  157 |       .getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`)
  158 |       .selectOption("transferred");
  159 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Kết thúc", exact: true }).click();
  160 | 
  161 |     const dialog = page.getByRole("dialog");
  162 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  163 |     await expect(dialog).toContainText("CHỈ đóng ghi danh ở lớp hiện tại");
  164 |     await page.getByRole("button", { name: "Huỷ" }).click();
  165 |   });
  166 | 
  167 |   test("GLV lớp KHÔNG được sửa ghi danh — ẩn nút, và RLS vẫn là chốt chặn", async ({ page }) => {
  168 |     await login(page, CLASS_REPRESENTATIVE);
  169 |     await openClass(page, CLASS_WITH_STUDENTS);
  170 | 
  171 |     // GLV đại diện đọc được danh sách lớp mình…
  172 |     await expect(page.getByRole("link", { name: STUDENT_NAME, exact: true })).toBeVisible({
  173 |       timeout: 20_000,
  174 |     });
  175 |     // …nhưng không có nút thao tác nào (`ENROLLMENT_WRITE_ROLES` không có vai này).
  176 |     await expect(page.getByRole("button", { name: "Tạm nghỉ" })).toHaveCount(0);
  177 |     await expect(page.getByRole("button", { name: "Kết thúc", exact: true })).toHaveCount(0);
  178 |   });
  179 | 
  180 |   test("mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)", async ({ page }) => {
  181 |     test.setTimeout(90_000);
  182 |     await login(page, GROUP_LEADER);
  183 |     await page.goto(`/students`);
  184 | 
  185 |     // Sáu thao tác ghi của module trước đợt này đều trả `Promise<void>` — kết quả
  186 |     // bị vứt bỏ ngay tại chỗ nhận (BR-M03-38). Bài này canh đường ngắn nhất:
  187 |     // biểu mẫu tạo phụ huynh, thao tác rẻ nhất và không đụng dữ liệu thiếu nhi.
  188 |     // 🔴 Neo vào ĐÚNG biểu mẫu. `/students` có hai ô mang nhãn bắt đầu bằng "Điện
  189 |     // thoại" (phụ huynh, và "Điện thoại (nếu có)" của thiếu nhi) ⇒ `getByLabel`
  190 |     // khớp hai phần tử. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B và
  191 |     // M04-C — trang nào đông biểu mẫu thì bài test phải neo phạm vi.
  192 |     const suffix = `${Date.now()}`.slice(-6);
  193 |     const form = page.locator("form").filter({ has: page.locator("#guardian-name") });
  194 |     await form.getByLabel("Họ tên phụ huynh").fill(`Phụ huynh E2E ${suffix}`);
  195 |     await form.locator("#guardian-phone").fill(`09${suffix}0000`.slice(0, 10));
  196 |     await form.getByRole("button", { name: "Tạo phụ huynh" }).click();
  197 | 
  198 |     const message = page.getByRole("status").first();
  199 |     // 45 giây — cùng lý do với bài "Tạm nghỉ" ở trên (nợ #10 vế (a)).
> 200 |     await expect(message).toBeVisible({ timeout: 45_000 });
      |                           ^ Error: expect(locator).toBeVisible() failed
  201 |     await expect(message).toContainText(`Phụ huynh E2E ${suffix}`);
  202 |     // Câu thành công phải CHỈ ĐƯỜNG sang việc tiếp theo, không chỉ báo "đã lưu".
  203 |     await expect(message).toContainText("Thêm thiếu nhi");
  204 |   });
  205 | });
  206 | 
```