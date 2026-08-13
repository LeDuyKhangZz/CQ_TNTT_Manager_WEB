# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: results.spec.ts >> Kết quả và chuyển lớp Phase 5 >> đại diện nhập/công bố/khóa/xuất/Top 5; portal ownership; duyệt chuyển lớp nguyên tử
- Location: tests\e2e\results.spec.ts:278:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Top 5 laptop-1366-1786605366723', exact: true }).locator('xpath=ancestor::div[contains(@class,\'rounded-lg\')][1]')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('heading', { name: 'Top 5 laptop-1366-1786605366723', exact: true }).locator('xpath=ancestor::div[contains(@class,\'rounded-lg\')][1]')

```

```yaml
- link "Bỏ qua điều hướng":
  - /url: "#main-content"
- complementary "Thanh bên ứng dụng":
  - paragraph: Giáo xứ Chợ Quán
  - paragraph: Thiếu Nhi Thánh Thể
  - paragraph: "Đang xem: Ngành Hiệp Sĩ · Năm học 2026-2027"
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
  - button "Đăng xuất"
- banner:
  - navigation "Đường dẫn trang":
    - list:
      - listitem:
        - link "Trang chủ":
          - /url: /dashboard
      - listitem:
        - link "Kết quả học tập":
          - /url: /results
      - listitem: Bảng điểm lớp
  - paragraph: Kết quả học tập
  - paragraph: Năm học 2026-2027
  - link "Mở thông báo":
    - /url: /notifications
  - group: Đại diện E2E 3
- main:
  - heading "Bảng điểm Hiệp 1" [level=1]
  - paragraph: Năm học 2026-2027 · Có quyền nhập điểm
  - link "← Danh sách lớp":
    - /url: /results
  - text: Đang mở 2 cột điểm · 6 thiếu nhi
  - link "Xuất Excel":
    - /url: /results/212e2769-b7df-4d54-b6fe-33fd2f49c414/export?format=xlsx
  - link "Xuất PDF":
    - /url: /results/212e2769-b7df-4d54-b6fe-33fd2f49c414/export?format=pdf
  - button "Khóa bảng điểm"
  - heading "Thêm cột điểm" [level=3]
  - paragraph: Số cột và loại cột do lớp tự chọn; có thể lặp cùng loại hoặc không dùng kiểm tra 15 phút.
  - text: Loại
  - combobox "Loại":
    - option "Kiểm tra 15 phút" [selected]
    - option "Giữa kỳ"
    - option "Cuối kỳ"
    - option "Chuyên cần"
    - option "Kiểm tra phát sinh"
  - text: Tên cột điểm
  - textbox "Tên cột điểm":
    - /placeholder: "Ví dụ: Giữa kỳ HK1"
  - text: Ngày kiểm tra
  - textbox "Ngày kiểm tra"
  - text: Hệ số
  - spinbutton "Hệ số": "1"
  - button "Thêm cột"
  - heading "Cấu hình cột điểm" [level=2]
  - text: Tên cột
  - textbox "Tên cột": Điểm công bố laptop-1366-1786605366723
  - text: Ngày
  - textbox "Ngày"
  - text: Hệ số
  - spinbutton "Hệ số": "2"
  - button "Lưu"
  - button "Ẩn khỏi cổng"
  - button "Ẩn cột"
  - text: Kiểm tra phát sinh Đã công bố 6 điểm đã nhập Tên cột
  - textbox "Tên cột": Điểm nội bộ laptop-1366-1786605366723
  - text: Ngày
  - textbox "Ngày"
  - text: Hệ số
  - spinbutton "Hệ số": "1"
  - button "Lưu"
  - button "Công bố"
  - button "Xóa cột"
  - text: Kiểm tra 15 phút Nội bộ Chưa có điểm
  - heading "Nhập điểm" [level=2]
  - heading "Điểm công bố laptop-1366-1786605366723" [level=3]
  - paragraph: Không ghi ngày · hệ số 2
  - text: Đã công bố
  - table "Nhập điểm Điểm công bố laptop-1366-1786605366723":
    - caption: Nhập điểm Điểm công bố laptop-1366-1786605366723
    - rowgroup:
      - row "Thiếu nhi Điểm Ghi chú":
        - columnheader "Thiếu nhi"
        - columnheader "Điểm"
        - columnheader "Ghi chú"
    - rowgroup:
      - row "Anna Em E2E 3-4 7":
        - rowheader "Anna Em E2E 3-4"
        - cell "7":
          - spinbutton "Điểm Anna Em E2E 3-4": "7"
        - cell:
          - textbox "Ghi chú Anna Em E2E 3-4"
      - row "Giuse Em E2E 3-1 10":
        - rowheader "Giuse Em E2E 3-1"
        - cell "10":
          - spinbutton "Điểm Giuse Em E2E 3-1": "10"
        - cell:
          - textbox "Ghi chú Giuse Em E2E 3-1"
      - row "Maria Em E2E 3-2 9":
        - rowheader "Maria Em E2E 3-2"
        - cell "9":
          - spinbutton "Điểm Maria Em E2E 3-2": "9"
        - cell:
          - textbox "Ghi chú Maria Em E2E 3-2"
      - row "Phaolô Em E2E 3-5 6":
        - rowheader "Phaolô Em E2E 3-5"
        - cell "6":
          - spinbutton "Điểm Phaolô Em E2E 3-5": "6"
        - cell:
          - textbox "Ghi chú Phaolô Em E2E 3-5"
      - row "Phêrô Em E2E 3-3 8":
        - rowheader "Phêrô Em E2E 3-3"
        - cell "8":
          - spinbutton "Điểm Phêrô Em E2E 3-3": "8"
        - cell:
          - textbox "Ghi chú Phêrô Em E2E 3-3"
      - row "Têrêsa Em E2E 3-6 5":
        - rowheader "Têrêsa Em E2E 3-6"
        - cell "5":
          - spinbutton "Điểm Têrêsa Em E2E 3-6": "5"
        - cell:
          - textbox "Ghi chú Têrêsa Em E2E 3-6"
  - button "Lưu điểm Điểm công bố laptop-1366-1786605366723"
  - heading "Điểm nội bộ laptop-1366-1786605366723" [level=3]
  - paragraph: Không ghi ngày · hệ số 1
  - text: Nội bộ
  - table "Nhập điểm Điểm nội bộ laptop-1366-1786605366723":
    - caption: Nhập điểm Điểm nội bộ laptop-1366-1786605366723
    - rowgroup:
      - row "Thiếu nhi Điểm Ghi chú":
        - columnheader "Thiếu nhi"
        - columnheader "Điểm"
        - columnheader "Ghi chú"
    - rowgroup:
      - row "Anna Em E2E 3-4":
        - rowheader "Anna Em E2E 3-4"
        - cell:
          - spinbutton "Điểm Anna Em E2E 3-4"
        - cell:
          - textbox "Ghi chú Anna Em E2E 3-4"
      - row "Giuse Em E2E 3-1":
        - rowheader "Giuse Em E2E 3-1"
        - cell:
          - spinbutton "Điểm Giuse Em E2E 3-1"
        - cell:
          - textbox "Ghi chú Giuse Em E2E 3-1"
      - row "Maria Em E2E 3-2":
        - rowheader "Maria Em E2E 3-2"
        - cell:
          - spinbutton "Điểm Maria Em E2E 3-2"
        - cell:
          - textbox "Ghi chú Maria Em E2E 3-2"
      - row "Phaolô Em E2E 3-5":
        - rowheader "Phaolô Em E2E 3-5"
        - cell:
          - spinbutton "Điểm Phaolô Em E2E 3-5"
        - cell:
          - textbox "Ghi chú Phaolô Em E2E 3-5"
      - row "Phêrô Em E2E 3-3":
        - rowheader "Phêrô Em E2E 3-3"
        - cell:
          - spinbutton "Điểm Phêrô Em E2E 3-3"
        - cell:
          - textbox "Ghi chú Phêrô Em E2E 3-3"
      - row "Têrêsa Em E2E 3-6":
        - rowheader "Têrêsa Em E2E 3-6"
        - cell:
          - spinbutton "Điểm Têrêsa Em E2E 3-6"
        - cell:
          - textbox "Ghi chú Têrêsa Em E2E 3-6"
  - button "Lưu điểm Điểm nội bộ laptop-1366-1786605366723"
  - heading "Điểm trung bình có trọng số" [level=3]
  - paragraph: Chỉ tính các ô đã nhập; thay hệ số cập nhật kết quả ngay.
  - table:
    - rowgroup:
      - row "Thiếu nhi Điểm trung bình":
        - columnheader "Thiếu nhi"
        - columnheader "Điểm trung bình"
    - rowgroup:
      - row "Anna Em E2E 3-4 7.00":
        - cell "Anna Em E2E 3-4"
        - cell "7.00"
      - row "Giuse Em E2E 3-1 10.00":
        - cell "Giuse Em E2E 3-1"
        - cell "10.00"
      - row "Maria Em E2E 3-2 9.00":
        - cell "Maria Em E2E 3-2"
        - cell "9.00"
      - row "Phaolô Em E2E 3-5 6.00":
        - cell "Phaolô Em E2E 3-5"
        - cell "6.00"
      - row "Phêrô Em E2E 3-3 8.00":
        - cell "Phêrô Em E2E 3-3"
        - cell "8.00"
      - row "Têrêsa Em E2E 3-6 5.00":
        - cell "Têrêsa Em E2E 3-6"
        - cell "5.00"
  - heading "Nhận xét" [level=2]
  - paragraph: Nhận xét công khai hiển thị trên cổng phụ huynh/thiếu nhi; ghi chú nội bộ không rò nội dung lẫn số lượng. Sửa và xóa dành cho người viết, Giáo lý viên đại diện lớp và Ban điều hành xứ đoàn.
  - heading "Anna Em E2E 3-4" [level=3]
  - paragraph: 0 nhận xét trong phạm vi bạn được xem
  - paragraph: Chưa có nhận xét.
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Giuse Em E2E 3-1" [level=3]
  - paragraph: 2 nhận xét trong phạm vi bạn được xem
  - list:
    - listitem:
      - text: Công khai cho phụ huynh/thiếu nhi
      - button "Sửa"
      - button "Xóa"
      - paragraph: Nhận xét công khai laptop-1366-1786605366723
      - paragraph: Đại diện E2E 3 · 13/08/2026
    - listitem:
      - text: Nội bộ nhân sự
      - button "Sửa"
      - button "Xóa"
      - paragraph: Ghi chú nội bộ laptop-1366-1786605366723
      - paragraph: Đại diện E2E 3 · 13/08/2026
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Maria Em E2E 3-2" [level=3]
  - paragraph: 0 nhận xét trong phạm vi bạn được xem
  - paragraph: Chưa có nhận xét.
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Phaolô Em E2E 3-5" [level=3]
  - paragraph: 0 nhận xét trong phạm vi bạn được xem
  - paragraph: Chưa có nhận xét.
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Phêrô Em E2E 3-3" [level=3]
  - paragraph: 0 nhận xét trong phạm vi bạn được xem
  - paragraph: Chưa có nhận xét.
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Têrêsa Em E2E 3-6" [level=3]
  - paragraph: 0 nhận xét trong phạm vi bạn được xem
  - paragraph: Chưa có nhận xét.
  - text: Mức hiển thị
  - combobox "Mức hiển thị":
    - option "Nội bộ nhân sự" [selected]
    - option "Công khai cho phụ huynh/thiếu nhi"
  - paragraph: Ghi chú nội bộ — phụ huynh và thiếu nhi không đọc được, kể cả số lượng.
  - text: Nội dung
  - textbox "Nội dung"
  - button "Thêm nhận xét"
  - heading "Top 5" [level=2]
  - paragraph: Danh sách đã chốt không tự đổi khi điểm nguồn thay đổi. Muốn xếp hạng lại thì bấm “Chốt lại danh sách” — bản đang giữ được lưu vào lịch sử, không mất đi.
  - heading "Tạo Top 5" [level=3]
  - paragraph: Có thể công bố từ một bài kiểm tra, điểm tạm, tổng kết hoặc đợt thi đua riêng.
  - text: Tiêu đề
  - textbox "Tiêu đề":
    - /placeholder: Top 5 tháng 10
  - text: Nguồn
  - combobox "Nguồn":
    - option "Một cột điểm" [selected]
    - option "Điểm trung bình tạm"
    - option "Điểm tổng kết đã khóa"
    - option "Đợt thi đua / điểm tùy chỉnh"
  - text: Cột điểm
  - combobox "Cột điểm":
    - option "Chọn cột điểm" [selected]
    - option "Điểm công bố laptop-1366-1786605366723"
    - option "Điểm nội bộ laptop-1366-1786605366723"
  - button "Đang tạo…" [disabled]
  - status: "Thành công: Đã tạo bảng Top 5. Hãy xem trước trước khi công bố."
  - text: Chưa có bảng Top 5.
- alert
```

# Test source

```ts
  118 | 
  119 |   const guardianProfileId = await ensureAccount(fixture.guardian, `Phụ huynh E2E ${fixture.index}`);
  120 |   const guardianId = uuid(2, 100 + fixture.index);
  121 |   const { error: guardianError } = await admin.from("guardians").upsert({
  122 |     id: guardianId, profile_id: guardianProfileId, full_name: `Phụ huynh E2E ${fixture.index}`, phone: fixture.guardian,
  123 |   });
  124 |   if (guardianError) throw new Error(`Tạo phụ huynh E2E: ${guardianError.message}`);
  125 |   await ensureRole(guardianProfileId, "guardian");
  126 | 
  127 |   const studentProfileId = await ensureAccount(fixture.studentCode, `Thiếu nhi E2E ${fixture.index}`);
  128 |   const studentNames: string[] = [];
  129 |   const enrollmentIds: string[] = [];
  130 |   for (let offset = 1; offset <= 6; offset += 1) {
  131 |     const studentId = uuid(3, fixture.index * 10 + offset);
  132 |     const enrollmentId = uuid(4, fixture.index * 10 + offset);
  133 |     const saintName = ["Giuse", "Maria", "Phêrô", "Anna", "Phaolô", "Têrêsa"][offset - 1]!;
  134 |     const fullName = `Em E2E ${fixture.index}-${offset}`;
  135 |     studentNames.push(`${saintName} ${fullName}`);
  136 |     enrollmentIds.push(enrollmentId);
  137 |     const { error: studentError } = await admin.from("students").upsert({
  138 |       id: studentId, profile_id: offset === 1 ? studentProfileId : null,
  139 |       student_code: `CQ99${fixture.index - 1}${offset}`, guardian_id: guardianId,
  140 |       saint_name: saintName, full_name: fullName, gender: offset % 2 ? "male" : "female", date_of_birth: `2015-0${offset}-01`,
  141 |     });
  142 |     if (studentError) throw new Error(`Tạo thiếu nhi E2E ${offset}: ${studentError.message}`);
  143 |     // 🔴 `ended_on`/`previous_enrollment_id` phải đặt lại về null TƯỜNG MINH.
  144 |     // `upsert` chỉ ghi đè đúng những cột được liệt kê, nên bản cũ để lại nguyên
  145 |     // giá trị của lượt chạy trước. Chính bài test này kết thúc ghi danh khi
  146 |     // duyệt chuyển lớp (`status='completed'`, `ended_on=<ngày>`); lượt chạy sau
  147 |     // đặt lại `status='active'` mà `ended_on` vẫn còn ⇒ vi phạm ràng buộc
  148 |     // `enrollments_open_has_no_end` ngay ở bước dựng dữ liệu. Đo được: cả 3
  149 |     // viewport rớt ở đúng dòng này, và bộ E2E chỉ chạy được **một lần** sau mỗi
  150 |     // `db:reset` — đúng loại ma sát khiến nợ #9 (E2E chưa chạy) kéo dài.
  151 |     const { error: enrollmentError } = await admin.from("enrollments").upsert({
  152 |       id: enrollmentId, student_id: studentId, academic_year_id: year.id,
  153 |       class_id: sourceClass.id, status: "active", enrolled_on: year.start_date,
  154 |       ended_on: null, previous_enrollment_id: null,
  155 |     });
  156 |     if (enrollmentError) throw new Error(`Ghi danh E2E ${offset}: ${enrollmentError.message}`);
  157 |   }
  158 |   await ensureRole(studentProfileId, "student");
  159 | 
  160 |   return {
  161 |     admin, fixture, year, classId: sourceClass.id, targetClassId, representativeId,
  162 |     studentNames, enrollmentIds, firstStudentName: studentNames[0]!, firstEnrollmentId: enrollmentIds[0]!,
  163 |   };
  164 | }
  165 | 
  166 | async function login(page: Page, username: string) {
  167 |   // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  168 |   // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  169 |   // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu
  170 |   // (đo được: 6 test rớt vì chờ mãi ô "Tên đăng nhập"). Trong ứng dụng thật,
  171 |   // đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức năng đăng xuất vừa được
  172 |   // thêm ở A-01, trước đó chưa hề tồn tại nên các spec mới phải làm vòng này.
  173 |   // Xoá cookie là cách diễn đạt đúng ý "bắt đầu như một người mới trên máy
  174 |   // sạch"; mỗi context là độc lập nên không đụng tới phiên của context khác
  175 |   // (bài tranh chấp/tiếp quản ở attendance dùng hai context riêng).
  176 |   await page.context().clearCookies();
  177 |   await page.goto("/login");
  178 |   for (let attempt = 0; attempt < 3; attempt += 1) {
  179 |     await page.getByLabel("Tên đăng nhập").fill(username);
  180 |     await page.locator("input#password").fill(DEV_PASSWORD);
  181 |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  182 |     try {
  183 |       await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
  184 |       await expect(page).toHaveURL(/\/dashboard$/);
  185 |       return;
  186 |     } catch {
  187 |       await page.goto("/login");
  188 |     }
  189 |   }
  190 |   throw new Error(`Không đăng nhập được bằng ${username}.`);
  191 | }
  192 | 
  193 | async function expectNoHorizontalOverflow(page: Page, where: string) {
  194 |   const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  195 |   expect(overflow, `${where} không được tràn ngang`).toBe(false);
  196 | }
  197 | 
  198 | /**
  199 |  * 🔴 **Nợ #10 — phần "chờ cứng 5 giây" của `results.spec.ts`, trả ở M07-A đúng
  200 |  * như bảng nợ đã hẹn.** (Phần `window.confirm` của cùng món nợ thuộc đợt C.)
  201 |  *
  202 |  * Sau một thao tác ghi, câu báo thành công hiện **ngay** vì nó là state phía
  203 |  * client đặt từ kết quả action; còn thứ **dẫn xuất từ dữ liệu máy chủ** — thẻ Top
  204 |  * 5 vừa tạo, nút "Ẩn" sau khi công bố, nhãn "Đã khóa" — chỉ về sau khi
  205 |  * `router.refresh()` lấy lại trang. Hai mốc ấy cách nhau đúng một vòng
  206 |  * round-trip, và ngưỡng mặc định của Playwright là **5 giây**.
  207 |  *
  208 |  * ⚠️ **Đây là che triệu chứng, không phải chữa** — và lượt chạy của M07-A đo được
  209 |  * nguyên nhân rõ hơn mọi lượt trước: khi bài rớt ở dòng "thẻ Top 5 vừa tạo",
  210 |  * `psql` cho thấy **cả hai bản ghi đã nằm trong bảng `leaderboards`**, câu *"Đã
  211 |  * tạo bảng Top 5"* đã hiện, mà nút thì vẫn kẹt ở **"Đang tạo…" [disabled]** —
  212 |  * tức `startTransition` chưa chốt vì lượt làm mới chưa về. Ghi vào được, câu trả
  213 |  * lời không về: đúng kết luận M03-C đã đo, không phải lỗi của mã ứng dụng.
  214 |  *
  215 |  * 20 giây là mốc `committees.spec.ts` đã dùng từ M09-C cho cùng loại khẳng định.
  216 |  */
  217 | async function expectSoon(locator: Locator) {
> 218 |   await expect(locator).toBeVisible({ timeout: 20_000 });
      |                         ^ Error: expect(locator).toBeVisible() failed
  219 | }
  220 | 
  221 | /** Chờ action trả kết quả thật, rồi nạp lại dữ liệu dẫn xuất thay vì đua với router.refresh(). */
  222 | async function reloadAfterSuccess(page: Page, message: string | RegExp) {
  223 |   await expectSoon(page.getByRole("status").filter({ hasText: message }).last());
  224 |   await page.reload();
  225 | }
  226 | 
  227 | /**
  228 |  * Trên mobile chỉ một cột điểm được dựng. Một `router.refresh()` muộn của thao
  229 |  * tác thêm cột có thể remount editor ngay sau lần chọn đầu và đưa select về cột
  230 |  * thứ nhất. Lặp cả thao tác chọn lẫn hậu điều kiện để test chờ đúng trạng thái
  231 |  * ổn định, thay vì chỉ kéo dài timeout trên một nút sẽ không bao giờ xuất hiện.
  232 |  */
  233 | async function selectScoreColumn(page: Page, title: string) {
  234 |   const button = page.getByRole("button", { name: `Lưu điểm ${title}` });
  235 |   const mobileSelect = page.locator("#mobile-assessment");
  236 |   if (await mobileSelect.isVisible()) {
  237 |     await expect(async () => {
  238 |       await mobileSelect.selectOption({ label: title });
  239 |       await expect(button).toBeVisible();
  240 |     }).toPass({ timeout: 20_000 });
  241 |   }
  242 |   await expectSoon(button);
  243 | }
  244 | 
  245 | /**
  246 |  * M07-B — thẻ chứa một biểu mẫu cấu hình cột điểm.
  247 |  *
  248 |  * 🔴 Badge *"N điểm đã nhập"* / *"Chưa có điểm"* nằm **ngoài** `<form>`: form giữ
  249 |  * ba ô nhập và hàng nút, còn hàng badge là một khối riêng ngay dưới nó. Neo
  250 |  * `getByText` vào form thì bài đỏ với *"element(s) not found"* trong khi giao
  251 |  * diện **đang hiện đúng chữ ấy** — lượt chạy đầu của đợt B bắt được đúng chỗ này.
  252 |  */
  253 | function settingsCardOf(form: Locator): Locator {
  254 |   return form.locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
  255 | }
  256 | 
  257 | /**
  258 |  * M07-C · **nợ #1** — bốn chỗ `window.confirm` cuối cùng của toàn hệ thống đã
  259 |  * thành `ConfirmDialog`, nên `page.once("dialog", …)` không còn bắt được gì:
  260 |  * lời hỏi nay là DOM thật, không phải hộp thoại của trình duyệt.
  261 |  *
  262 |  * 🔴 Phải neo nút xác nhận **vào trong hộp thoại**. Ba trong bốn chỗ có nhãn
  263 |  * nút xác nhận **trùng** nhãn nút mở hộp thoại (*"Xóa cột"* · *"Khóa bảng
  264 |  * điểm"* · *"Mở khóa"*) — đúng thiết kế, vì `11` §5 đòi nút xác nhận nói ra
  265 |  * việc sẽ làm chứ không phải *"Đồng ý"*. Tìm theo tên ở cấp trang sẽ khớp hai
  266 |  * phần tử và Playwright ném `strict mode violation`.
  267 |  */
  268 | async function acceptConfirm(page: Page, confirmLabel: string) {
  269 |   const dialog = page.getByRole("dialog");
  270 |   await expect(dialog).toBeVisible({ timeout: 20_000 });
  271 |   await dialog.getByRole("button", { name: confirmLabel, exact: true }).click();
  272 |   await expect(dialog).toHaveCount(0, { timeout: 20_000 });
  273 | }
  274 | 
  275 | test.describe("Kết quả và chuyển lớp Phase 5", () => {
  276 |   test.describe.configure({ timeout: 240_000 });
  277 | 
  278 |   test("đại diện nhập/công bố/khóa/xuất/Top 5; portal ownership; duyệt chuyển lớp nguyên tử", async ({ page }, testInfo) => {
  279 |     const setup = await prepareFixture(testInfo);
  280 |     const suffix = `${testInfo.project.name}-${Date.now()}`;
  281 |     const publishedTitle = `Điểm công bố ${suffix}`;
  282 |     const draftTitle = `Điểm nội bộ ${suffix}`;
  283 |     const publicComment = `Nhận xét công khai ${suffix}`;
  284 |     const internalComment = `Ghi chú nội bộ ${suffix}`;
  285 |     const topTitle = `Top 5 ${suffix}`;
  286 | 
  287 |     await login(page, setup.fixture.rep);
  288 |     await page.goto(`/results/${setup.classId}`);
  289 |     await expect(page.getByRole("heading", { name: `Bảng điểm ${setup.fixture.sourceClass}` })).toBeVisible();
  290 | 
  291 |     // Nợ #20 (M07-A) — **chỗ cuối cùng** của món nợ vùng chạm 44px. Đo
  292 |     // `boundingBox()`, tức **chiều cao thật đã dựng**: bài kiểm tên lớp CSS sẽ
  293 |     // xanh giả khi một lớp khác đè lên `min-h-11`.
  294 |     const backLink = page.getByRole("link", { name: "← Danh sách lớp" });
  295 |     const backBox = await backLink.boundingBox();
  296 |     expect(backBox, "link quay lại phải dựng được để đo").not.toBeNull();
  297 |     expect(backBox!.height, "vùng chạm link quay lại ≥ 44px (11 §5)").toBeGreaterThanOrEqual(44);
  298 | 
  299 |     const addForm = page.getByRole("heading", { name: "Thêm cột điểm" }).locator("xpath=../following-sibling::div/form");
  300 |     await addForm.locator('select[name="kind"]').selectOption("custom");
  301 |     await addForm.locator('input[name="title"]').fill(publishedTitle);
  302 |     await addForm.locator('input[name="weight"]').fill("2");
  303 |     await addForm.getByRole("button", { name: "Thêm cột" }).click();
  304 |     await reloadAfterSuccess(page, "Đã thêm cột điểm.");
  305 |     await selectScoreColumn(page, publishedTitle);
  306 | 
  307 |     const scoreForm = page.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).locator("xpath=ancestor::form");
  308 |     for (let index = 0; index < setup.studentNames.length; index += 1) {
  309 |       await scoreForm.getByLabel(`Điểm ${setup.studentNames[index]}`).fill(String(10 - index));
  310 |     }
  311 |     await scoreForm.getByRole("button", { name: `Lưu điểm ${publishedTitle}` }).click();
  312 |     // M07-A — đơn vị đếm đổi từ "dòng" sang "ô", và con số nay là **số ô thật sự
  313 |     // thay đổi**. Sáu em vừa được nhập lần đầu nên vẫn là 6; điều mới là bấm Lưu
  314 |     // lần thứ hai mà không sửa gì thì **không gửi gì lên máy chủ** — bài ngay
  315 |     // dưới canh đúng chỗ đó, vì nó chính là nguyên nhân gốc của F04.
  316 |     await expectSoon(scoreForm.getByText("Đã lưu 6 ô điểm."));
  317 |     await page.reload();
  318 |     await selectScoreColumn(page, publishedTitle);
```