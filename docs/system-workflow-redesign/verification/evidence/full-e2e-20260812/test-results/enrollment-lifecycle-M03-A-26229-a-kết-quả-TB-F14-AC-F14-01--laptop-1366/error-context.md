# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enrollment-lifecycle.spec.ts >> M03-A · vòng đời ghi danh >> mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)
- Location: tests\e2e\enrollment-lifecycle.spec.ts:190:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('status').first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 45000ms
  - waiting for getByRole('status').first()

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
      - listitem: Thiếu nhi
  - paragraph: Thiếu nhi
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Trần Xuân Đoàn
- main:
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
    - text: Trạng thái hồ sơ
    - combobox "Trạng thái hồ sơ":
      - option "Đang sinh hoạt" [selected]
      - option "Tất cả trạng thái"
      - option "Tạm nghỉ"
      - option "Đã rút"
      - option "Đã lưu trữ"
    - button "Lọc"
  - heading "Danh sách thiếu nhi" [level=3]
  - paragraph: 20 hồ sơ trong phạm vi của bạn · đang lọc "Đang sinh hoạt".
  - list "Danh sách thiếu nhi":
    - listitem:
      - 'link "Anna Đinh Gia Hân Giám hộ: Đinh GLV 1A · 0901000010 Lớp: Thiếu 1A Thiếu Nhi Đang sinh hoạt"':
        - /url: /students/092811a2-26b5-4242-bfa9-9e834ebd226b
        - paragraph: Anna Đinh Gia Hân
        - paragraph: "Giám hộ: Đinh GLV 1A · 0901000010"
        - paragraph: "Lớp: Thiếu 1A"
        - text: Thiếu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Maria Em chưa ghi danh 1 Giám hộ: Người giám hộ chưa ghi danh 1 · 84918888103 Lớp: Chưa xếp lớp Đang sinh hoạt"':
        - /url: /students/e3000000-0000-4000-8000-000000000001
        - paragraph: Maria Em chưa ghi danh 1
        - paragraph: "Giám hộ: Người giám hộ chưa ghi danh 1 · 84918888103"
        - paragraph: "Lớp: Chưa xếp lớp"
        - text: Đang sinh hoạt
    - listitem:
      - 'link "Maria Em chưa ghi danh 2 Giám hộ: Người giám hộ chưa ghi danh 2 · 84918888203 Lớp: Chưa xếp lớp Đang sinh hoạt"':
        - /url: /students/e3000000-0000-4000-8000-000000000002
        - paragraph: Maria Em chưa ghi danh 2
        - paragraph: "Giám hộ: Người giám hộ chưa ghi danh 2 · 84918888203"
        - paragraph: "Lớp: Chưa xếp lớp"
        - text: Đang sinh hoạt
    - listitem:
      - 'link "Giuse Em E2E 1-1 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000011
        - paragraph: Giuse Em E2E 1-1
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Maria Em E2E 1-2 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000012
        - paragraph: Maria Em E2E 1-2
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Phêrô Em E2E 1-3 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000013
        - paragraph: Phêrô Em E2E 1-3
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Anna Em E2E 1-4 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000014
        - paragraph: Anna Em E2E 1-4
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Phaolô Em E2E 1-5 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000015
        - paragraph: Phaolô Em E2E 1-5
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Têrêsa Em E2E 1-6 Giám hộ: Phụ huynh E2E 1 · 84919999991 Lớp: Chiên Con 1 Chiên Con Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000016
        - paragraph: Têrêsa Em E2E 1-6
        - paragraph: "Giám hộ: Phụ huynh E2E 1 · 84919999991"
        - paragraph: "Lớp: Chiên Con 1"
        - text: Chiên Con Đang sinh hoạt
    - listitem:
      - 'link "Giuse Em E2E 2-1 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000021
        - paragraph: Giuse Em E2E 2-1
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Maria Em E2E 2-2 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000022
        - paragraph: Maria Em E2E 2-2
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Phêrô Em E2E 2-3 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000023
        - paragraph: Phêrô Em E2E 2-3
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Anna Em E2E 2-4 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000024
        - paragraph: Anna Em E2E 2-4
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Phaolô Em E2E 2-5 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000025
        - paragraph: Phaolô Em E2E 2-5
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Têrêsa Em E2E 2-6 Giám hộ: Phụ huynh E2E 2 · 84919999992 Lớp: Nghĩa 1 Nghĩa Sĩ Đang sinh hoạt"':
        - /url: /students/f3000000-0000-4000-8000-000000000026
        - paragraph: Têrêsa Em E2E 2-6
        - paragraph: "Giám hộ: Phụ huynh E2E 2 · 84919999992"
        - paragraph: "Lớp: Nghĩa 1"
        - text: Nghĩa Sĩ Đang sinh hoạt
    - listitem:
      - 'link "Anna Lê Thị E2E mobile-360 Giám hộ: Đinh GLV 1A · 0901000010 Lớp: Ấu 3B Ấu Nhi Đang sinh hoạt"':
        - /url: /students/a2979bd4-5326-4de1-b1e0-f9d31dd40b1c
        - paragraph: Anna Lê Thị E2E mobile-360
        - paragraph: "Giám hộ: Đinh GLV 1A · 0901000010"
        - paragraph: "Lớp: Ấu 3B"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Anna Lê Thị E2E tablet-768 Giám hộ: Đinh GLV 1A · 0901000010 Lớp: Ấu 3B Ấu Nhi Đang sinh hoạt"':
        - /url: /students/b5de685d-5a59-442f-ac53-10aa123eb736
        - paragraph: Anna Lê Thị E2E tablet-768
        - paragraph: "Giám hộ: Đinh GLV 1A · 0901000010"
        - paragraph: "Lớp: Ấu 3B"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Giuse Nguyễn Minh An Giám hộ: Nguyễn Văn Ba · 0912000001 Lớp: Ấu 1A Ấu Nhi Đang sinh hoạt"':
        - /url: /students/b1ffc137-2e9a-43eb-ba30-9a48f0c00f33
        - paragraph: Giuse Nguyễn Minh An
        - paragraph: "Giám hộ: Nguyễn Văn Ba · 0912000001"
        - paragraph: "Lớp: Ấu 1A"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Phêrô Nguyễn Minh Khoa Giám hộ: Nguyễn Văn Ba · 0912000001 Lớp: Ấu 1B Ấu Nhi Đang sinh hoạt"':
        - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4
        - paragraph: Phêrô Nguyễn Minh Khoa
        - paragraph: "Giám hộ: Nguyễn Văn Ba · 0912000001"
        - paragraph: "Lớp: Ấu 1B"
        - text: Ấu Nhi Đang sinh hoạt
    - listitem:
      - 'link "Maria Trần Bảo Châu Giám hộ: Trần Thị Bốn · 0912000002 Lớp: Ấu 1A Ấu Nhi Đang sinh hoạt"':
        - /url: /students/fba918c7-a187-40cd-81eb-62d9221d1fd6
        - paragraph: Maria Trần Bảo Châu
        - paragraph: "Giám hộ: Trần Thị Bốn · 0912000002"
        - paragraph: "Lớp: Ấu 1A"
        - text: Ấu Nhi Đang sinh hoạt
  - heading "Thêm người giám hộ" [level=3]
  - paragraph: Tạo phụ huynh trước khi thêm con.
  - form "Thêm người giám hộ":
    - text: Họ tên phụ huynh
    - textbox "Họ tên phụ huynh": Phụ huynh E2E 345936
    - text: Điện thoại
    - textbox "Điện thoại": "0934593600"
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
      - option "Người giám hộ chưa có con 1 · 84918888102"
      - option "Người giám hộ chưa có con 2 · 84918888202"
      - option "Người giám hộ chưa ghi danh 1 · 84918888103"
      - option "Người giám hộ chưa ghi danh 2 · 84918888203"
      - option "Nguyễn Văn Ba · 0912000001"
      - option "Phụ huynh E2E 1 · 84919999991"
      - option "Phụ huynh E2E 101779 · 0910177900"
      - option "Phụ huynh E2E 2 · 84919999992"
      - option "Phụ huynh E2E 691616 · 0969161600"
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
      - option "Hiệp 1 · Hiệp Sĩ"
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
- alert
```

# Test source

```ts
  109 |     // Huy hiệu bằng CHỮ, không phải chấm màu (điều cấm thứ 5).
  110 |     await expect(rosterRow(page, STUDENT_NAME).getByText("Tạm nghỉ", { exact: true }).first()).toBeVisible();
  111 | 
  112 |     // --- Khôi phục --------------------------------------------------------
  113 |     // AC-F10-02: chức năng này CHƯA TỪNG TỒN TẠI trước đợt này (BR-M03-21).
  114 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Khôi phục" }).click();
  115 |     await expect(page.getByRole("status").filter({ hasText: "Đang học" }).first()).toBeVisible({
  116 |       timeout: 45_000,
  117 |     });
  118 | 
  119 |     // Về đúng trạng thái ban đầu: sĩ số hết vế "trong đó N tạm nghỉ", và KHÔNG tạo
  120 |     // ghi danh thứ hai — nếu có, sĩ số sẽ nhảy lên 3 (AC-F10-02).
  121 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  122 |     // Chữ thường: vế "… tạm nghỉ" của câu sĩ số. Nút mang chữ "Tạm nghỉ" viết hoa
  123 |     // nên không lọt vào phép đếm này.
  124 |     await expect(page.getByText(/tạm nghỉ/)).toHaveCount(0);
  125 |     // Và nút quay lại đúng nhãn ban đầu — em không còn ở trạng thái tạm nghỉ.
  126 |     await expect(rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Tạm nghỉ" })).toBeVisible();
  127 |   });
  128 | 
  129 |   test("ô lý do kết thúc KHÔNG còn mục 'Tạm nghỉ' — gốc rễ của F10", async ({ page }) => {
  130 |     await login(page, GROUP_LEADER);
  131 |     await openClass(page, CLASS_WITH_STUDENTS);
  132 | 
  133 |     const select = page.getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`);
  134 |     await expect(select).toBeVisible({ timeout: 20_000 });
  135 |     const values = await select.locator("option").evaluateAll((options) =>
  136 |       options.map((option) => (option as HTMLOptionElement).value),
  137 |     );
  138 |     expect(values).toEqual(["withdrawn", "completed", "transferred", "repeating"]);
  139 |   });
  140 | 
  141 |   test("kết thúc phải HỎI TRƯỚC, nêu tên em và tên lớp (AC-F10-03)", async ({ page }) => {
  142 |     await login(page, GROUP_LEADER);
  143 |     await openClass(page, CLASS_WITH_STUDENTS);
  144 | 
  145 |     const row = rosterRow(page, STUDENT_NAME);
  146 |     await expect(row).toBeVisible({ timeout: 20_000 });
  147 |     await row.getByRole("button", { name: "Kết thúc", exact: true }).click();
  148 | 
  149 |     // Trước đợt này nút "Kết thúc" nằm ngay cạnh tên từng em và ghi thẳng, không
  150 |     // hỏi gì (C5 = 1 trong biên bản audit).
  151 |     const dialog = page.getByRole("dialog");
  152 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  153 |     await expect(dialog).toContainText(STUDENT_NAME);
  154 |     await expect(dialog).toContainText(CLASS_WITH_STUDENTS);
  155 | 
  156 |     // Huỷ ⇒ không ghi gì. Sĩ số phải còn nguyên.
  157 |     await page.getByRole("button", { name: "Huỷ" }).click();
  158 |     await expect(dialog).toBeHidden();
  159 |     await expect(page.getByText(/Sĩ số đang sinh hoạt: 2/)).toBeVisible({ timeout: 20_000 });
  160 |   });
  161 | 
  162 |   test("D-122 · lý do 'Chuyển lớp' nói thẳng hệ thống KHÔNG ghi danh em vào lớp mới", async ({ page }) => {
  163 |     await login(page, GROUP_LEADER);
  164 |     await openClass(page, CLASS_WITH_STUDENTS);
  165 | 
  166 |     await page
  167 |       .getByLabel(`Lý do kết thúc ghi danh của ${STUDENT_NAME}`)
  168 |       .selectOption("transferred");
  169 |     await rosterRow(page, STUDENT_NAME).getByRole("button", { name: "Kết thúc", exact: true }).click();
  170 | 
  171 |     const dialog = page.getByRole("dialog");
  172 |     await expect(dialog).toBeVisible({ timeout: 10_000 });
  173 |     await expect(dialog).toContainText("CHỈ đóng ghi danh ở lớp hiện tại");
  174 |     await page.getByRole("button", { name: "Huỷ" }).click();
  175 |   });
  176 | 
  177 |   test("GLV lớp KHÔNG được sửa ghi danh — ẩn nút, và RLS vẫn là chốt chặn", async ({ page }) => {
  178 |     await login(page, CLASS_REPRESENTATIVE);
  179 |     await openClass(page, CLASS_WITH_STUDENTS);
  180 | 
  181 |     // GLV đại diện đọc được danh sách lớp mình…
  182 |     await expect(page.getByRole("link", { name: STUDENT_NAME, exact: true })).toBeVisible({
  183 |       timeout: 20_000,
  184 |     });
  185 |     // …nhưng không có nút thao tác nào (`ENROLLMENT_WRITE_ROLES` không có vai này).
  186 |     await expect(page.getByRole("button", { name: "Tạm nghỉ" })).toHaveCount(0);
  187 |     await expect(page.getByRole("button", { name: "Kết thúc", exact: true })).toHaveCount(0);
  188 |   });
  189 | 
  190 |   test("mọi thao tác ghi trên trang thiếu nhi nói ra kết quả (TB-F14 / AC-F14-01)", async ({ page }) => {
  191 |     await login(page, GROUP_LEADER);
  192 |     await page.goto(`/students`);
  193 | 
  194 |     // Sáu thao tác ghi của module trước đợt này đều trả `Promise<void>` — kết quả
  195 |     // bị vứt bỏ ngay tại chỗ nhận (BR-M03-38). Bài này canh đường ngắn nhất:
  196 |     // biểu mẫu tạo phụ huynh, thao tác rẻ nhất và không đụng dữ liệu thiếu nhi.
  197 |     // 🔴 Neo vào ĐÚNG biểu mẫu. `/students` có hai ô mang nhãn bắt đầu bằng "Điện
  198 |     // thoại" (phụ huynh, và "Điện thoại (nếu có)" của thiếu nhi) ⇒ `getByLabel`
  199 |     // khớp hai phần tử. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B và
  200 |     // M04-C — trang nào đông biểu mẫu thì bài test phải neo phạm vi.
  201 |     const suffix = `${Date.now()}`.slice(-6);
  202 |     const form = page.locator("form").filter({ has: page.locator("#guardian-name") });
  203 |     await form.getByLabel("Họ tên phụ huynh").fill(`Phụ huynh E2E ${suffix}`);
  204 |     await form.locator("#guardian-phone").fill(`09${suffix}0000`.slice(0, 10));
  205 |     await form.getByRole("button", { name: "Tạo phụ huynh" }).click();
  206 | 
  207 |     const message = page.getByRole("status").first();
  208 |     // 45 giây — cùng lý do với bài "Tạm nghỉ" ở trên (nợ #10 vế (a)).
> 209 |     await expect(message).toBeVisible({ timeout: 45_000 });
      |                           ^ Error: expect(locator).toBeVisible() failed
  210 |     await expect(message).toContainText(`Phụ huynh E2E ${suffix}`);
  211 |     // Câu thành công phải CHỈ ĐƯỜNG sang việc tiếp theo, không chỉ báo "đã lưu".
  212 |     await expect(message).toContainText("Thêm thiếu nhi");
  213 |   });
  214 | });
  215 | 
```