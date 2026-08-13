# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: student-lifecycle.spec.ts >> TB-F08 · sửa và xoá bản ghi bí tích >> AC-F08-01 · AC-F08-02 · D-128 — vòng đời một bản ghi: thêm → trùng → sửa → xoá
- Location: tests\e2e\student-lifecycle.spec.ts:199:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Bỏ qua điều hướng" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - complementary "Thanh bên ứng dụng" [ref=e5]:
      - generic [ref=e7]:
        - paragraph [ref=e8]: Giáo xứ Chợ Quán
        - paragraph [ref=e9]: Thiếu Nhi Thánh Thể
      - paragraph [ref=e11]:
        - text: "Đang xem: Huynh Trưởng ·"
        - generic [ref=e12]: Năm học 2026-2027
      - navigation "Điều hướng chính" [ref=e13]:
        - generic [ref=e14]:
          - paragraph [ref=e15]: Chung
          - list [ref=e16]:
            - listitem [ref=e17]:
              - link "Tổng quan" [ref=e18] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e19]
                - generic [ref=e24]: Tổng quan
            - listitem [ref=e25]:
              - link "Thông báo" [ref=e26] [cursor=pointer]:
                - /url: /notifications
                - img [ref=e27]
                - generic [ref=e30]: Thông báo
            - listitem [ref=e31]:
              - link "Tài khoản" [ref=e32] [cursor=pointer]:
                - /url: /account
                - img [ref=e33]
                - generic [ref=e37]: Tài khoản
        - generic [ref=e38]:
          - paragraph [ref=e39]: Mục vụ
          - list [ref=e40]:
            - listitem [ref=e41]:
              - link "Thiếu nhi" [ref=e42] [cursor=pointer]:
                - /url: /students
                - img [ref=e43]
                - generic [ref=e47]: Thiếu nhi
            - listitem [ref=e48]:
              - link "Lớp học" [ref=e49] [cursor=pointer]:
                - /url: /classes
                - img [ref=e50]
                - generic [ref=e55]: Lớp học
            - listitem [ref=e56]:
              - link "Huynh trưởng/Giáo lý viên" [ref=e57] [cursor=pointer]:
                - /url: /staff
                - img [ref=e58]
                - generic [ref=e70]: Huynh trưởng/Giáo lý viên
            - listitem [ref=e71]:
              - link "Điểm danh" [ref=e72] [cursor=pointer]:
                - /url: /attendance
                - img [ref=e73]
                - generic [ref=e77]: Điểm danh
            - listitem [ref=e78]:
              - link "Giáo án" [ref=e79] [cursor=pointer]:
                - /url: /teaching-plan
                - img [ref=e80]
                - generic [ref=e83]: Giáo án
            - listitem [ref=e84]:
              - link "Kết quả học tập" [ref=e85] [cursor=pointer]:
                - /url: /results
                - img [ref=e86]
                - generic [ref=e89]: Kết quả học tập
            - listitem [ref=e90]:
              - link "Lên lớp/chuyển lớp" [ref=e91] [cursor=pointer]:
                - /url: /promotions
                - img [ref=e92]
                - generic [ref=e98]: Lên lớp/chuyển lớp
        - generic [ref=e99]:
          - paragraph [ref=e100]: Điều hành
          - list [ref=e101]:
            - listitem [ref=e102]:
              - link "Ban" [ref=e103] [cursor=pointer]:
                - /url: /committees
                - img [ref=e104]
                - generic [ref=e106]: Ban
            - listitem [ref=e107]:
              - link "Báo cáo" [ref=e108] [cursor=pointer]:
                - /url: /reports
                - img [ref=e109]
                - generic [ref=e111]: Báo cáo
            - listitem [ref=e112]:
              - link "Nhập dữ liệu Excel" [ref=e113] [cursor=pointer]:
                - /url: /imports
                - img [ref=e114]
                - generic [ref=e117]: Nhập dữ liệu Excel
      - button "Đăng xuất" [ref=e120] [cursor=pointer]:
        - img [ref=e121]
        - generic [ref=e124]: Đăng xuất
    - generic [ref=e125]:
      - banner [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]:
            - navigation "Đường dẫn trang" [ref=e129]:
              - list [ref=e130]:
                - listitem [ref=e131]:
                  - link "Trang chủ" [ref=e132] [cursor=pointer]:
                    - /url: /dashboard
                    - generic [ref=e133]: Trang chủ
                - listitem [ref=e134]:
                  - img [ref=e135]
                  - generic [ref=e137]: Thiếu nhi
            - paragraph [ref=e138]: Thiếu nhi
          - paragraph [ref=e139]:
            - img [ref=e140]
            - generic [ref=e142]: Năm học 2026-2027
          - link "Mở thông báo" [ref=e143] [cursor=pointer]:
            - /url: /notifications
            - img [ref=e144]
          - group [ref=e147]:
            - generic "Menu tài khoản của Trần Xuân Đoàn" [ref=e148] [cursor=pointer]:
              - img [ref=e150]
              - generic [ref=e153]: Trần Xuân Đoàn
              - img [ref=e154]
      - main [ref=e157]:
        - generic [ref=e158]:
          - generic [ref=e160]:
            - heading "Thiếu nhi" [level=1] [ref=e161]
            - paragraph [ref=e162]: Hồ sơ thiếu nhi và người giám hộ.
          - generic [ref=e163]:
            - generic [ref=e164]:
              - group "Lọc danh sách thiếu nhi" [ref=e166]:
                - generic [ref=e167]:
                  - img [ref=e168]
                  - text: Lọc danh sách thiếu nhi
                - generic [ref=e169]:
                  - generic [ref=e171]:
                    - generic [ref=e172]: Tìm theo tên thiếu nhi, mã hoặc số điện thoại phụ huynh
                    - generic [ref=e173]:
                      - img
                      - searchbox "Tìm theo tên thiếu nhi, mã hoặc số điện thoại phụ huynh" [ref=e174]: Nguyễn Minh Khoa
                    - paragraph [ref=e175]: Gõ không dấu cũng tìm được.
                  - generic [ref=e176]:
                    - generic [ref=e177]: Ngành
                    - generic [ref=e178]:
                      - combobox "Ngành" [ref=e179]:
                        - option "Tất cả ngành" [selected]
                        - option "Chiên Con"
                        - option "Ấu Nhi"
                        - option "Thiếu Nhi"
                        - option "Nghĩa Sĩ"
                        - option "Hiệp Sĩ"
                      - img
                  - generic [ref=e180]:
                    - generic [ref=e181]: Lớp
                    - generic [ref=e182]:
                      - combobox "Lớp" [ref=e183]:
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
                      - img
                  - generic [ref=e184]:
                    - generic [ref=e185]: Trạng thái hồ sơ
                    - generic [ref=e186]:
                      - combobox "Trạng thái hồ sơ" [ref=e187]:
                        - option "Đang sinh hoạt"
                        - option "Tất cả trạng thái" [selected]
                        - option "Tạm nghỉ"
                        - option "Đã rút"
                        - option "Đã lưu trữ"
                      - img
                - generic [ref=e188]:
                  - button "Lọc" [ref=e189] [cursor=pointer]
                  - link "Xoá lọc" [ref=e190] [cursor=pointer]:
                    - /url: /students
              - generic [ref=e191]:
                - generic [ref=e192]:
                  - heading "Danh sách thiếu nhi" [level=3] [ref=e193]
                  - paragraph [ref=e194]: 1 hồ sơ trong phạm vi của bạn.
                - list "Danh sách thiếu nhi" [ref=e196]:
                  - listitem [ref=e197]:
                    - 'link "Phêrô Nguyễn Minh Khoa Giám hộ: Nguyễn Văn Ba · 0912000001 Lớp: Ấu 1B Ấu Nhi Đang sinh hoạt" [active] [ref=e198] [cursor=pointer]':
                      - /url: /students/861150a2-9774-4587-945e-238b70dfb8d4
                      - generic [ref=e199]:
                        - generic [ref=e200]:
                          - paragraph [ref=e201]: Phêrô Nguyễn Minh Khoa
                          - paragraph [ref=e202]: "Giám hộ: Nguyễn Văn Ba · 0912000001"
                          - paragraph [ref=e203]: "Lớp: Ấu 1B"
                        - generic [ref=e204]:
                          - generic [ref=e205]: Ấu Nhi
                          - generic [ref=e207]:
                            - img [ref=e208]
                            - text: Đang sinh hoạt
            - generic [ref=e211]:
              - generic [ref=e212]:
                - generic [ref=e213]:
                  - heading "Thêm người giám hộ" [level=3] [ref=e214]
                  - paragraph [ref=e215]: Tạo phụ huynh trước khi thêm con.
                - form "Thêm người giám hộ" [ref=e217]:
                  - generic [ref=e218]:
                    - generic [ref=e219]: Họ tên phụ huynh
                    - textbox "Họ tên phụ huynh" [ref=e220]
                  - generic [ref=e221]:
                    - generic [ref=e222]: Điện thoại
                    - textbox "Điện thoại" [ref=e223]
                  - generic [ref=e224]:
                    - generic [ref=e225]: Địa chỉ
                    - textbox "Địa chỉ" [ref=e226]
                  - button "Tạo phụ huynh" [ref=e227] [cursor=pointer]
              - generic [ref=e228]:
                - generic [ref=e229]:
                  - heading "Thêm thiếu nhi" [level=3] [ref=e230]
                  - paragraph [ref=e231]: Mã thiếu nhi được cấp tự động.
                - form "Thêm thiếu nhi" [ref=e233]:
                  - generic [ref=e234]:
                    - generic [ref=e235]: Người giám hộ
                    - generic [ref=e236]:
                      - combobox "Người giám hộ" [ref=e237]:
                        - option "Chọn phụ huynh" [disabled] [selected]
                        - option "Đinh GLV 1A · 0901000010"
                        - option "Người giám hộ chưa có con 1 · 84918888102"
                        - option "Người giám hộ chưa có con 2 · 84918888202"
                        - option "Người giám hộ chưa có con 3 · 84918888302"
                        - option "Người giám hộ chưa ghi danh 1 · 84918888103"
                        - option "Người giám hộ chưa ghi danh 2 · 84918888203"
                        - option "Người giám hộ chưa ghi danh 3 · 84918888303"
                        - option "Nguyễn Văn Ba · 0912000001"
                        - option "Phụ huynh E2E 1 · 84919999991"
                        - option "Phụ huynh E2E 101779 · 0910177900"
                        - option "Phụ huynh E2E 2 · 84919999992"
                        - option "Phụ huynh E2E 3 · 84919999993"
                        - option "Phụ huynh E2E 345936 · 0934593600"
                        - option "Phụ huynh E2E 691616 · 0969161600"
                        - option "Trần Thị Bốn · 0912000002"
                      - img
                  - generic [ref=e238]:
                    - generic [ref=e239]:
                      - generic [ref=e240]: Tên thánh
                      - textbox "Tên thánh" [ref=e241]
                    - generic [ref=e242]:
                      - generic [ref=e243]: Giới tính
                      - generic [ref=e244]:
                        - combobox "Giới tính" [ref=e245]:
                          - option "Nam" [selected]
                          - option "Nữ"
                          - option "Khác"
                        - img
                  - generic [ref=e246]:
                    - generic [ref=e247]: Họ tên
                    - textbox "Họ tên" [ref=e248]
                  - generic [ref=e249]:
                    - generic [ref=e250]:
                      - generic [ref=e251]: Ngày sinh
                      - textbox "Ngày sinh" [ref=e252]
                    - generic [ref=e253]:
                      - generic [ref=e254]: Ngày bổn mạng
                      - textbox "Ngày bổn mạng" [ref=e255]
                  - generic [ref=e256]:
                    - generic [ref=e257]: Ghi danh vào lớp (nếu đã biết)
                    - generic [ref=e258]:
                      - combobox "Ghi danh vào lớp (nếu đã biết)" [ref=e259]:
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
                      - img
                    - paragraph [ref=e260]: Để trống cũng được — mở hồ sơ em để ghi danh sau.
                  - generic [ref=e261]:
                    - generic [ref=e262]: Điện thoại (nếu có)
                    - textbox "Điện thoại (nếu có)" [ref=e263]
                  - generic [ref=e264]:
                    - generic [ref=e265]: Địa chỉ
                    - textbox "Địa chỉ" [ref=e266]
                  - generic [ref=e267]:
                    - checkbox "Hoàn cảnh khó khăn" [ref=e268]
                    - text: Hoàn cảnh khó khăn
                  - button "Tạo hồ sơ thiếu nhi" [ref=e269] [cursor=pointer]
  - alert [ref=e270]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * M03-C — **TB-F06** (lưu trữ đồng bộ ghi danh) · **TB-F08** (sửa/xoá bí tích) ·
  5   |  * **TB-F12** (quản lý người giám hộ) · **D-67** (mức đọc của Thủ quỹ).
  6   |  *
  7   |  * 🔴 Ba viewport dùng chung MỘT database (`workers: 1`, bài học M04-A) và
  8   |  * `students` **không cho xoá**. File này vì thế được thiết kế để chạy lại bao
  9   |  * nhiêu lượt cũng ra cùng kết quả:
  10  |  *
  11  |  *   · Mọi bài **đổi trạng thái đều đi VÀ về** trong cùng một bài.
  12  |  *   · Bài lưu trữ chỉ **mở hộp xác nhận rồi Huỷ** — lưu trữ thật một em của
  13  |  *     `seed:dev` là làm hỏng mọi spec khác, và không có đường hoàn tác.
  14  |  *   · Bài bí tích **tự dọn**: thêm → sửa → xoá trong một bài.
  15  |  *   · Bài sửa liên lạc phụ huynh **trả lại số cũ** ở cuối bài.
  16  |  *
  17  |  * 🔴 Và **không đụng lớp Ấu 1A**: đó là lớp duy nhất có thiếu nhi trong
  18  |  * `seed:dev` mà nhiều spec khác chốt cứng sĩ số (`enrollment-lifecycle:121`
  19  |  * khẳng định *"Sĩ số đang sinh hoạt: 2"*). Bài học lặp lại từ M04-A, M02-C và
  20  |  * M03-B: trên một database dùng chung, **một bài test ghi dữ liệu là một bài
  21  |  * test sửa hệ thống của bài khác**.
  22  |  */
  23  | const DEV_PASSWORD = "123456";
  24  | /** Xứ đoàn trưởng — ghi toàn xứ đoàn, lưu trữ được (`docs/05` §5). */
  25  | const GROUP_LEADER = "GLV901";
  26  | /** Giáo lý viên lớp Ấu 1A — D-127 cho họ GHI sức khoẻ/bí tích, D-128 không cho XOÁ. */
  27  | const CLASS_TEACHER = "GLV910";
  28  | /** Thủ quỹ — D-67/D-129. Trước M03-C mọi trang của họ đều trống. */
  29  | const TREASURER = "GLV904";
  30  | 
  31  | /** Em ở lớp Ấu 1B — KHÔNG spec nào chốt sĩ số lớp này. */
  32  | const STUDENT = "Nguyễn Minh Khoa";
  33  | const STUDENT_CLASS = "Ấu 1B";
  34  | /** Em ở lớp Ấu 1A, chỉ dùng cho các bài KHÔNG ghi gì. */
  35  | const READ_ONLY_STUDENT = "Nguyễn Minh An";
  36  | /** Phụ huynh của Trần Bảo Châu; `students-directory.spec` tra theo số của phụ huynh A. */
  37  | const GUARDIAN_PHONE = "0912000002";
  38  | 
  39  | async function login(page: Page, username: string) {
  40  |   await page.context().clearCookies();
  41  |   await page.goto("/login");
  42  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  43  |     await page.getByLabel("Tên đăng nhập").fill(username);
  44  |     await page.locator("input#password").fill(DEV_PASSWORD);
  45  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  46  |     try {
  47  |       await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
  48  |       return;
  49  |     } catch {
  50  |       await page.goto("/login");
  51  |     }
  52  |   }
  53  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  54  | }
  55  | 
  56  | /**
  57  |  * 🔴 Ngưỡng của **cả bài** phải lớn hơn ngưỡng của từng khẳng định trong bài.
  58  |  *
  59  |  * Mặc định Playwright cho mỗi bài 30 giây, trong khi các khẳng định sau-thao-tác-
  60  |  * ghi ở đây chờ tới 45 giây (nợ #10 — mỗi thao tác là một RPC ghi hai bảng rồi
  61  |  * hai đến ba lượt `revalidatePath`). Nghĩa là bài **tự đặt ra một hạn không bao
  62  |  * giờ đạt được**: lượt chạy đầu có hai viewport xanh và viewport thứ ba hết giờ
  63  |  * giữa chừng, để lại một em ở trạng thái "Tạm nghỉ" — rồi mọi bài sau tìm em ấy
  64  |  * bằng bộ lọc mặc định (`status=active`) đều không thấy và đỏ theo.
  65  |  */
  66  | test.describe.configure({ timeout: 120_000 });
  67  | 
  68  | /**
  69  |  * Mở hồ sơ một em qua ô tìm kiếm của `/students` (D-126 — gõ không dấu cũng ra).
  70  |  * Đi qua danh sách chứ không chốt cứng UUID: mã hồ sơ do sequence sinh ra nên
  71  |  * mỗi lượt `seed:dev` lại khác.
  72  |  *
  73  |  * `status=all` là bắt buộc: bộ lọc mặc định của trang chỉ hiện em **đang sinh
  74  |  * hoạt** (D-108), nên một lượt chạy rớt giữa chừng sẽ làm mọi lượt sau không
  75  |  * tìm thấy em nữa — bài test không tự khôi phục được khỏi chính nó.
  76  |  */
  77  | async function openStudent(page: Page, fullName: string, tab?: string) {
  78  |   await page.goto(`/students?status=all&q=${encodeURIComponent(fullName)}`);
  79  |   const link = page.getByRole("link", { name: new RegExp(fullName) }).first();
  80  |   await expect(link).toBeVisible({ timeout: 20_000 });
  81  |   await link.click();
> 82  |   await page.waitForURL(/\/students\/[0-9a-f-]{36}/, { timeout: 20_000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  83  |   if (tab) await page.goto(`${new URL(page.url()).pathname}?tab=${tab}`);
  84  | }
  85  | 
  86  | test.describe("TB-F06 · trạng thái hồ sơ tách khỏi biểu mẫu thông tin", () => {
  87  |   test.beforeEach(async ({ page }) => {
  88  |     await login(page, GROUP_LEADER);
  89  |   });
  90  | 
  91  |   test('biểu mẫu "Cập nhật hồ sơ" KHÔNG còn ô Trạng thái', async ({ page }) => {
  92  |     // 🔴 Đây là điểm trừ C5 = 2 của biên bản audit: trước M03-C ô "Trạng thái"
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
```