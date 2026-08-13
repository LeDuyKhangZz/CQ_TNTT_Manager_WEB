# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-directory.spec.ts >> phân trang: bộ lọc được mang theo sang trang 2 và địa chỉ chép lại được
- Location: tests\e2e\staff-directory.spec.ts:124:5

# Error details

```
Error: Trang 2: bấm nhiều lần vẫn không có hiệu lực.
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
                  - generic [ref=e19]: Huynh trưởng/Giáo lý viên
            - paragraph [ref=e20]: Huynh trưởng/Giáo lý viên
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
            - heading "Huynh trưởng/Giáo lý viên" [level=1] [ref=e44]
            - paragraph [ref=e45]: Hồ sơ nhân sự và lịch sử phân công đứng lớp.
          - generic [ref=e46]:
            - generic [ref=e47]:
              - group "Lọc danh sách nhân sự" [ref=e49]:
                - generic [ref=e50]:
                  - img [ref=e51]
                  - text: Lọc danh sách nhân sự
                - generic [ref=e52]:
                  - generic [ref=e54]:
                    - generic [ref=e55]: Tìm theo họ tên, tên thánh, mã GLV hoặc số điện thoại
                    - generic [ref=e56]:
                      - img
                      - searchbox "Tìm theo họ tên, tên thánh, mã GLV hoặc số điện thoại" [ref=e57]
                    - paragraph [ref=e58]: Gõ không dấu cũng tìm được.
                  - generic [ref=e59]:
                    - generic [ref=e60]: Lớp đang phục vụ
                    - generic [ref=e61]:
                      - combobox "Lớp đang phục vụ" [ref=e62]:
                        - option "Mọi lớp" [selected]
                        - option "Chưa phân lớp"
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
                  - generic [ref=e63]:
                    - generic [ref=e64]: Trạng thái phục vụ
                    - generic [ref=e65]:
                      - combobox "Trạng thái phục vụ" [ref=e66]:
                        - option "Đang phục vụ và tạm nghỉ"
                        - option "Chỉ đang phục vụ"
                        - option "Chỉ tạm nghỉ"
                        - option "Chỉ đã nghỉ"
                        - option "Tất cả" [selected]
                      - img
                - generic [ref=e67]:
                  - button "Lọc" [ref=e68] [cursor=pointer]
                  - link "Xoá lọc" [ref=e69] [cursor=pointer]:
                    - /url: /staff
              - generic [ref=e70]:
                - generic [ref=e71]:
                  - heading "Danh sách nhân sự" [level=3] [ref=e72]
                  - paragraph [ref=e73]: Mỗi người chỉ có một lớp đang phục vụ tại một thời điểm.
                - generic [ref=e74]:
                  - generic [ref=e76]:
                    - generic [ref=e77]:
                      - link "Chị Cecilia Bùi Phó Thiếu" [ref=e78] [cursor=pointer]:
                        - /url: /staff/93575c4d-cfec-4f8b-b75f-1e91f0655b52
                      - paragraph [ref=e79]: GLV908 · 0901000008 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e80]:
                      - generic [ref=e81]:
                        - img [ref=e82]
                        - text: Đang phục vụ
                      - generic [ref=e85]:
                        - img [ref=e86]
                        - text: Đã có tài khoản
                      - generic [ref=e89]: Chưa phân lớp
                  - generic [ref=e91]:
                    - generic [ref=e92]:
                      - link "Chị Agnes Cao GLV 1B" [ref=e93] [cursor=pointer]:
                        - /url: /staff/50c83a2e-f141-41c6-ac82-b845745c64bf
                      - paragraph [ref=e94]: GLV913 · 0901000013 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e95]:
                      - generic [ref=e96]:
                        - img [ref=e97]
                        - text: Đang phục vụ
                      - generic [ref=e100]:
                        - img [ref=e101]
                        - text: Đã có tài khoản
                      - generic [ref=e104]:
                        - img [ref=e105]
                        - text: Ấu 1B · Giáo lý viên
                  - generic [ref=e109]:
                    - generic [ref=e110]:
                      - link "Anh Vinh Sơn Chu Chưa Dùng" [ref=e111] [cursor=pointer]:
                        - /url: /staff/bb1faa04-0c52-4f7b-b1cd-450d5e27e55f
                      - paragraph [ref=e112]: GLV916 · 0901000016 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e113]:
                      - generic [ref=e114]:
                        - img [ref=e115]
                        - text: Đang phục vụ
                      - generic [ref=e118]: Chưa có tài khoản
                      - generic [ref=e119]: Chưa phân lớp
                  - generic [ref=e121]:
                    - generic [ref=e122]:
                      - link "Anh Đại diện E2E 1" [ref=e123] [cursor=pointer]:
                        - /url: /staff/141e0c54-74b7-4c87-838c-ee10e2c414bb
                      - paragraph [ref=e124]: GLV920 · 0988000010 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e125]:
                      - generic [ref=e126]:
                        - img [ref=e127]
                        - text: Đang phục vụ
                      - generic [ref=e130]:
                        - img [ref=e131]
                        - text: Đã có tài khoản
                      - generic [ref=e134]:
                        - img [ref=e135]
                        - text: Chiên Con 1 · Đại diện
                  - generic [ref=e139]:
                    - generic [ref=e140]:
                      - link "Chị Lucia Đinh GLV 1A" [ref=e141] [cursor=pointer]:
                        - /url: /staff/99eb4359-d648-45c2-9693-d7f97049b00c
                      - paragraph [ref=e142]: GLV910 · 0901000010 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e143]:
                      - generic [ref=e144]:
                        - img [ref=e145]
                        - text: Đang phục vụ
                      - generic [ref=e148]:
                        - img [ref=e149]
                        - text: Đã có tài khoản
                      - generic [ref=e152]:
                        - img [ref=e153]
                        - text: Ấu 1A · Giáo lý viên
                  - generic [ref=e157]:
                    - generic [ref=e158]:
                      - link "Chị Têrêsa Đỗ Phó Ấu" [ref=e159] [cursor=pointer]:
                        - /url: /staff/6e292e9f-7f45-42ba-8383-895508e1762d
                      - paragraph [ref=e160]: GLV906 · 0901000006 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e161]:
                      - generic [ref=e162]:
                        - img [ref=e163]
                        - text: Đang phục vụ
                      - generic [ref=e166]:
                        - img [ref=e167]
                        - text: Đã có tài khoản
                      - generic [ref=e170]: Chưa phân lớp
                  - generic [ref=e172]:
                    - generic [ref=e173]:
                      - link "Anh Gioakim Đoàn Chưa Vai Trò" [ref=e174] [cursor=pointer]:
                        - /url: /staff/120169ff-74c6-42d7-bc10-07bf543f93af
                      - paragraph [ref=e175]: GLV918 · 0901000018 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e176]:
                      - generic [ref=e177]:
                        - img [ref=e178]
                        - text: Đang phục vụ
                      - generic [ref=e181]:
                        - img [ref=e182]
                        - text: ⚠ Chưa gán vai trò
                      - generic [ref=e184]: Chưa phân lớp
                  - generic [ref=e186]:
                    - generic [ref=e187]:
                      - link "Anh Antôn Hồ Đã Nghỉ" [ref=e188] [cursor=pointer]:
                        - /url: /staff/182bb0af-9b34-4a9b-8a24-6c95eafd8c79
                      - paragraph [ref=e189]: GLV915 · 0901000015 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e190]:
                      - generic [ref=e191]: Đã nghỉ
                      - generic [ref=e192]: Chưa có tài khoản
                      - generic [ref=e193]: Chưa phân lớp
                  - generic [ref=e195]:
                    - generic [ref=e196]:
                      - link "Anh Micae Hoàng Trưởng Thiếu" [ref=e197] [cursor=pointer]:
                        - /url: /staff/8db1e768-f24b-465e-915a-043316bb8bfb
                      - paragraph [ref=e198]: GLV907 · 0901000007 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e199]:
                      - generic [ref=e200]:
                        - img [ref=e201]
                        - text: Đang phục vụ
                      - generic [ref=e204]:
                        - img [ref=e205]
                        - text: Đã có tài khoản
                      - generic [ref=e208]: Chưa phân lớp
                  - generic [ref=e210]:
                    - generic [ref=e211]:
                      - link "Chị Maria Lê Phó Đoàn" [ref=e212] [cursor=pointer]:
                        - /url: /staff/a0b50282-156e-4812-ba77-18b8d4246179
                      - paragraph [ref=e213]: GLV902 · 0901000002 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e214]:
                      - generic [ref=e215]:
                        - img [ref=e216]
                        - text: Đang phục vụ
                      - generic [ref=e219]:
                        - img [ref=e220]
                        - text: Đã có tài khoản
                      - generic [ref=e223]: Chưa phân lớp
                  - navigation "Phân trang" [ref=e224]:
                    - paragraph [ref=e225]: Đang xem 1–10 trong 19 hồ sơ.
                    - list [ref=e226]:
                      - listitem [ref=e227]:
                        - img [ref=e229]
                      - listitem [ref=e231]:
                        - generic [ref=e232]: "1"
                      - listitem [ref=e233]:
                        - link "Trang 2" [active] [ref=e234] [cursor=pointer]:
                          - /url: /staff?service=all&page=2
                          - text: "2"
                      - listitem [ref=e235]:
                        - link "Trang sau" [ref=e236] [cursor=pointer]:
                          - /url: /staff?service=all&page=2
                          - img [ref=e237]
            - generic [ref=e239]:
              - generic [ref=e240]:
                - generic [ref=e241]:
                  - heading "Thêm nhân sự" [level=3] [ref=e242]
                  - paragraph [ref=e243]: Dì/Sơ là danh xưng, không phải role hệ thống.
                - generic [ref=e245]:
                  - generic [ref=e246]:
                    - generic [ref=e247]:
                      - generic [ref=e248]: Danh xưng
                      - generic [ref=e249]:
                        - combobox "Danh xưng" [ref=e250]:
                          - option "Anh" [selected]
                          - option "Chị"
                          - option "Dì"
                          - option "Sơ"
                          - option "Cha"
                          - option "Thầy"
                          - option "Khác"
                        - img
                    - generic [ref=e251]:
                      - generic [ref=e252]: Trình độ huấn luyện
                      - generic [ref=e253]:
                        - combobox "Trình độ huấn luyện" [ref=e254]:
                          - option "Chưa qua huấn luyện" [selected]
                          - option "Cấp I"
                          - option "Cấp II"
                          - option "Cấp III"
                          - option "Đặc biệt"
                        - img
                  - generic [ref=e255]:
                    - generic [ref=e256]: Tên thánh
                    - textbox "Tên thánh" [ref=e257]
                  - generic [ref=e258]:
                    - generic [ref=e259]: Họ tên
                    - textbox "Họ tên" [ref=e260]
                  - generic [ref=e261]:
                    - generic [ref=e262]: Điện thoại
                    - textbox "Điện thoại" [ref=e263]
                  - generic [ref=e264]:
                    - generic [ref=e265]: Ngày sinh
                    - textbox "Ngày sinh" [ref=e266]
                  - generic [ref=e267]:
                    - generic [ref=e268]: Email
                    - textbox "Email" [ref=e269]
                  - generic [ref=e270]:
                    - generic [ref=e271]: Địa chỉ
                    - textbox "Địa chỉ" [ref=e272]
                  - button "Tạo hồ sơ" [ref=e273] [cursor=pointer]
                  - paragraph [ref=e274]: Hồ sơ mới luôn ở trạng thái “Đang phục vụ”. Đổi trạng thái ở trang hồ sơ sau khi tạo.
              - generic [ref=e275]:
                - generic [ref=e276]:
                  - heading "Phân công vào lớp" [level=3] [ref=e277]
                  - paragraph [ref=e278]: Muốn đổi lớp mà giữ tài khoản thì mở hồ sơ và dùng “Chuyển lớp”.
                - generic [ref=e280]:
                  - generic [ref=e281]:
                    - generic [ref=e282]: Nhân sự
                    - generic [ref=e283]:
                      - combobox "Nhân sự" [ref=e284]:
                        - option "Chọn nhân sự" [disabled] [selected]
                        - option "GLV908 · Bùi Phó Thiếu"
                        - option "GLV913 · Cao GLV 1B (Ấu 1B)" [disabled]
                        - option "GLV916 · Chu Chưa Dùng"
                        - option "GLV920 · Đại diện E2E 1 (Chiên Con 1)" [disabled]
                        - option "GLV910 · Đinh GLV 1A (Ấu 1A)" [disabled]
                        - option "GLV906 · Đỗ Phó Ấu"
                        - option "GLV918 · Đoàn Chưa Vai Trò"
                        - option "GLV915 · Hồ Đã Nghỉ"
                        - option "GLV907 · Hoàng Trưởng Thiếu"
                        - option "GLV902 · Lê Phó Đoàn"
                        - option "GLV912 · Lý Đại Diện 1B (Ấu 1B)" [disabled]
                        - option "GLV914 · Mai Tạm Nghỉ"
                        - option "GLV909 · Ngô Đại Diện 1A (Ấu 1A)" [disabled]
                        - option "GLV903 · Nguyễn Thư Ký"
                        - option "GLV904 · Phạm Thủ Quỹ"
                        - option "GLV917 · Tạ Chưa Dùng"
                        - option "GLV901 · Trần Xuân Đoàn"
                        - option "GLV911 · Trịnh Dự Trưởng (Ấu 1A)" [disabled]
                        - option "GLV905 · Vũ Trưởng Ấu"
                      - img
                  - generic [ref=e285]:
                    - generic [ref=e286]: Lớp
                    - generic [ref=e287]:
                      - combobox "Lớp" [ref=e288]:
                        - option "Chọn lớp" [disabled] [selected]
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
                  - generic [ref=e289]:
                    - generic [ref=e290]: Vai trò trong lớp
                    - generic [ref=e291]:
                      - combobox "Vai trò trong lớp" [ref=e292]:
                        - option "Giáo lý viên đại diện"
                        - option "Giáo lý viên lớp" [selected]
                        - option "Dự trưởng phụ tá"
                      - img
                  - generic [ref=e293]:
                    - generic [ref=e294]: Ngày bắt đầu
                    - textbox "Ngày bắt đầu" [ref=e295]
                  - button "Lưu phân công" [ref=e296] [cursor=pointer]
    - navigation "Điều hướng nhanh" [ref=e297]:
      - list [ref=e298]:
        - listitem [ref=e299]:
          - link "Trang chủ" [ref=e300] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e301]
            - generic [ref=e306]: Trang chủ
        - listitem [ref=e307]:
          - link "Thiếu nhi" [ref=e308] [cursor=pointer]:
            - /url: /students
            - img [ref=e309]
            - generic [ref=e313]: Thiếu nhi
        - listitem [ref=e314]:
          - link "Điểm danh" [ref=e315] [cursor=pointer]:
            - /url: /attendance
            - img [ref=e316]
            - generic [ref=e320]: Điểm danh
        - listitem [ref=e321]:
          - link "Báo cáo" [ref=e322] [cursor=pointer]:
            - /url: /reports
            - img [ref=e323]
            - generic [ref=e325]: Báo cáo
        - listitem [ref=e326]:
          - link "Tài khoản" [ref=e327] [cursor=pointer]:
            - /url: /account
            - img [ref=e328]
            - generic [ref=e332]: Tài khoản
  - alert [ref=e333]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * M04-B — danh sách `/staff` dùng được (TB-M04-04 · D-108 · D-110) và xóa hồ sơ
  5   |  * chưa từng dùng (D-106 · D-109).
  6   |  *
  7   |  * 🔴 Hai bài ở cuối file GHI DỮ LIỆU và chỉ chạy được MỘT LẦN trên một database:
  8   |  * tạo hồ sơ và xóa hồ sơ. Ba viewport dùng chung một database (bài học M04-A,
  9   |  * nợ #10 họ hàng), nên chúng phải **tự dọn** hoặc **tự chọn mục tiêu còn lại**:
  10  |  *   · bài tạo hồ sơ dừng ở PHA CẢNH BÁO, không bấm "Vẫn tạo hồ sơ mới" ⇒ không
  11  |  *     ghi gì vào database, chạy bao nhiêu lượt cũng như nhau;
  12  |  *   · bài xóa nhận diện hồ sơ mục tiêu bằng "còn xóa được", và seed dựng SẴN hai
  13  |  *     hồ sơ chưa từng dùng (GLV916 · GLV917) cho ba viewport — dư một để lượt
  14  |  *     thứ ba không rơi vào cảnh không còn gì để xóa.
  15  |  */
  16  | const DEV_PASSWORD = "123456";
  17  | 
  18  | async function login(page: Page, username: string) {
  19  |   await page.context().clearCookies();
  20  |   await page.goto("/login");
  21  |   for (let attempt = 0; attempt < 3; attempt += 1) {
  22  |     await page.getByLabel("Tên đăng nhập").fill(username);
  23  |     await page.locator("input#password").fill(DEV_PASSWORD);
  24  |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  25  |     try {
  26  |       await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
  27  |       await expect(page).toHaveURL(/\/dashboard$/);
  28  |       return;
  29  |     } catch {
  30  |       await page.goto("/login");
  31  |     }
  32  |   }
  33  |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  34  | }
  35  | 
  36  | /**
  37  |  * Số thẻ nhân sự đang hiện trên trang.
  38  |  *
  39  |  * Phải nhắm vào LINK chứ không phải chữ: form "Phân công vào lớp" ở cột phải
  40  |  * liệt kê toàn bộ nhân sự trong một ô chọn, nên `getByText("<tên>")` luôn khớp
  41  |  * ít nhất hai phần tử (thẻ + `<option>`) và Playwright báo strict mode violation.
  42  |  */
  43  | function staffCards(page: Page) {
  44  |   return page.locator('a[href^="/staff/"]');
  45  | }
  46  | 
  47  | function cardFor(page: Page, name: string) {
  48  |   return staffCards(page).filter({ hasText: name });
  49  | }
  50  | 
  51  | /**
  52  |  * Bấm cho tới khi thấy kết quả — cùng khuôn với `clickUntil` của
  53  |  * `attendance.spec.ts` và cùng nguyên nhân: cú bấm rơi vào khoảng React ĐÃ gắn
  54  |  * handler của `<Link>` nhưng router chưa sẵn sàng thì nó bị nuốt, trang đứng
  55  |  * yên, và không có gì để chờ thêm. Đo được: cùng một bản build, `page.goto`
  56  |  * thẳng tới trang 2 luôn đúng, còn cú bấm đầu tiên có lượt không ăn.
  57  |  * Kiểm điều kiện TRƯỚC mỗi lần bấm nên bấm lại không gây tác dụng phụ.
  58  |  */
  59  | async function clickUntil(what: string, click: () => Promise<void>, done: () => Promise<boolean>) {
  60  |   for (let attempt = 0; attempt < 4; attempt += 1) {
  61  |     if (await done()) return;
  62  |     await click();
  63  |     for (let waited = 0; waited < 12; waited += 1) {
  64  |       await new Promise((resolve) => setTimeout(resolve, 500));
  65  |       if (await done()) return;
  66  |     }
  67  |   }
> 68  |   throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
      |         ^ Error: Trang 2: bấm nhiều lần vẫn không có hiệu lực.
  69  | }
  70  | 
  71  | test("D-108: mặc định ẩn người 'Đã nghỉ' và NÓI RA đang ẩn bao nhiêu", async ({ page }) => {
  72  |   await login(page, "GLV901");
  73  |   await page.goto("/staff");
  74  | 
  75  |   // GLV915 "Hồ Đã Nghỉ" có trong seed nhưng không được hiện ở bộ lọc mặc định.
  76  |   await expect(page.getByText("Đang ẩn", { exact: false })).toBeVisible();
  77  |   await expect(cardFor(page, "Hồ Đã Nghỉ")).toHaveCount(0);
  78  |   /*
  79  |    * Nhưng người "Tạm nghỉ" thì PHẢI còn — ẩn họ là làm hỏng kế hoạch năm học.
  80  |    *
  81  |    * 🔴 Tìm theo tên trước khi kiểm, chứ không đọc thẳng trang 1: `/staff` phân trang
  82  |    * **10 người/trang** và "Mai Tạm Nghỉ" xếp thứ ~10–11 theo họ tên, tức nằm đúng
  83  |    * ranh giới trang 1/trang 2 tuỳ cách so chuỗi tiếng Việt. Đó là lý do bài này chập
  84  |    * chờn (đỏ 1/3 rồi 3/3 viewport) từ khi M04-B thêm phân trang. Ô tìm kiếm **giữ
  85  |    * nguyên bộ lọc trạng thái phục vụ**, nên bài kiểm vẫn đúng điều nó muốn kiểm:
  86  |    * người "Tạm nghỉ" không bị bộ lọc mặc định ẩn đi.
  87  |    */
  88  |   await page.getByLabel(/Tìm theo họ tên/).fill("Mai Tạm Nghỉ");
  89  |   await page.getByRole("button", { name: "Lọc" }).click();
  90  |   await expect(cardFor(page, "Mai Tạm Nghỉ")).toHaveCount(1);
  91  |   await page.goto("/staff");
  92  | 
  93  |   const showAll = page.getByRole("link", { name: "Hiện tất cả" });
  94  |   await clickUntil(
  95  |     "Hiện tất cả",
  96  |     async () => showAll.click(),
  97  |     async () => /[?&]service=all/.test(page.url()),
  98  |   );
  99  |   await expect(cardFor(page, "Hồ Đã Nghỉ")).toHaveCount(1);
  100 | });
  101 | 
  102 | test("TB-M04-04: tìm được người theo tên KHÔNG DẤU và theo mã GLV", async ({ page }) => {
  103 |   await login(page, "GLV901");
  104 |   await page.goto("/staff");
  105 | 
  106 |   await page.getByLabel(/Tìm theo họ tên/).fill("tran xuan");
  107 |   await page.getByRole("button", { name: "Lọc" }).click();
  108 |   await expect(page).toHaveURL(/[?&]q=/);
  109 |   await expect(cardFor(page, "Trần Xuân Đoàn")).toHaveCount(1);
  110 |   await expect(staffCards(page)).toHaveCount(1);
  111 | 
  112 |   await page.goto("/staff?q=GLV913");
  113 |   await expect(cardFor(page, "Cao GLV 1B")).toHaveCount(1);
  114 |   await expect(staffCards(page)).toHaveCount(1);
  115 | });
  116 | 
  117 | test("AC-M04-06: trình độ huấn luyện hiện bằng tiếng Việt, không phải NONE", async ({ page }) => {
  118 |   await login(page, "GLV901");
  119 |   await page.goto("/staff");
  120 |   await expect(page.getByText("Huấn luyện Chưa qua huấn luyện").first()).toBeVisible();
  121 |   await expect(page.getByText("NONE")).toHaveCount(0);
  122 | });
  123 | 
  124 | test("phân trang: bộ lọc được mang theo sang trang 2 và địa chỉ chép lại được", async ({ page }) => {
  125 |   await login(page, "GLV901");
  126 |   await page.goto("/staff?service=all");
  127 | 
  128 |   // 18 hồ sơ trong seed, 10 thẻ mỗi trang ⇒ có trang 2.
  129 |   await expect(staffCards(page)).toHaveCount(10);
  130 |   // Tên khả dụng của ô số là `aria-label="Trang 2"`, không phải chữ "2" —
  131 |   // `aria-label` ghi đè nội dung khi trình đọc màn hình đặt tên cho link.
  132 |   // Ô số mang ĐỦ bộ lọc trong `href` — đây là điều khiến địa chỉ chép lại được.
  133 |   const nextPage = page.getByRole("link", { name: "Trang 2" });
  134 |   await expect(nextPage).toHaveAttribute("href", "/staff?service=all&page=2");
  135 | 
  136 |   await clickUntil(
  137 |     "Trang 2",
  138 |     async () => nextPage.click(),
  139 |     async () => /[?&]page=2/.test(page.url()),
  140 |   );
  141 |   await expect(page).toHaveURL(/service=all/);
  142 |   await expect(staffCards(page).first()).toBeVisible();
  143 | });
  144 | 
  145 | test("D-110: Super Admin thấy tên đăng nhập, Xứ đoàn trưởng thì KHÔNG", async ({ page }) => {
  146 |   await login(page, "KHANG.NHO");
  147 |   await page.goto("/staff?q=GLV913");
  148 |   await expect(page.getByText("Đã có GLV913")).toBeVisible();
  149 | 
  150 |   await login(page, "GLV901");
  151 |   await page.goto("/staff?q=GLV913");
  152 |   await expect(page.getByText("Đã có tài khoản")).toBeVisible();
  153 |   await expect(page.getByText("Đã có GLV913")).toHaveCount(0);
  154 | });
  155 | 
  156 | test("D-110: cảnh báo '⚠ Chưa gán vai trò' hiện cho cả Xứ đoàn trưởng", async ({ page }) => {
  157 |   await login(page, "GLV901");
  158 |   await page.goto("/staff?q=GLV918");
  159 |   await expect(page.getByText("⚠ Chưa gán vai trò")).toBeVisible();
  160 | });
  161 | 
  162 | test("TB-M04-03: trùng số điện thoại thì cảnh báo và GIỮ dữ liệu đã gõ, không chặn cứng", async ({ page }) => {
  163 |   await login(page, "GLV901");
  164 |   await page.goto("/staff");
  165 | 
  166 |   // `exact: true` bắt buộc: nhãn của ô tìm kiếm là "Tìm theo họ tên, tên thánh,
  167 |   // mã GLV hoặc số điện thoại", mà `getByLabel` mặc định khớp CHUỖI CON không
  168 |   // phân biệt hoa thường ⇒ "Họ tên" và "Điện thoại" trúng cả ô tìm kiếm.
```