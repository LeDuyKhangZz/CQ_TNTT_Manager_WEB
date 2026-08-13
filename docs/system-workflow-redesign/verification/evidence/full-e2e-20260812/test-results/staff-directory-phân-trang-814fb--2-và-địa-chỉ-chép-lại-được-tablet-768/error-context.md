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
            - img [ref=e22]
            - generic [ref=e24]: Năm học 2026-2027
          - link "Mở thông báo" [ref=e25] [cursor=pointer]:
            - /url: /notifications
            - img [ref=e26]
          - group [ref=e29]:
            - generic "Menu tài khoản của Trần Xuân Đoàn" [ref=e30] [cursor=pointer]:
              - img [ref=e32]
              - generic [ref=e35]: Trần Xuân Đoàn
              - img [ref=e36]
      - main [ref=e39]:
        - paragraph [ref=e41]:
          - text: "Đang xem: Huynh Trưởng ·"
          - generic [ref=e42]: Năm học 2026-2027
        - generic [ref=e43]:
          - generic [ref=e45]:
            - heading "Huynh trưởng/Giáo lý viên" [level=1] [ref=e46]
            - paragraph [ref=e47]: Hồ sơ nhân sự và lịch sử phân công đứng lớp.
          - generic [ref=e48]:
            - generic [ref=e49]:
              - group "Lọc danh sách nhân sự" [ref=e51]:
                - generic [ref=e52]:
                  - img [ref=e53]
                  - text: Lọc danh sách nhân sự
                - generic [ref=e54]:
                  - generic [ref=e56]:
                    - generic [ref=e57]: Tìm theo họ tên, tên thánh, mã GLV hoặc số điện thoại
                    - generic [ref=e58]:
                      - img
                      - searchbox "Tìm theo họ tên, tên thánh, mã GLV hoặc số điện thoại" [ref=e59]
                    - paragraph [ref=e60]: Gõ không dấu cũng tìm được.
                  - generic [ref=e61]:
                    - generic [ref=e62]: Lớp đang phục vụ
                    - generic [ref=e63]:
                      - combobox "Lớp đang phục vụ" [ref=e64]:
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
                  - generic [ref=e65]:
                    - generic [ref=e66]: Trạng thái phục vụ
                    - generic [ref=e67]:
                      - combobox "Trạng thái phục vụ" [ref=e68]:
                        - option "Đang phục vụ và tạm nghỉ"
                        - option "Chỉ đang phục vụ"
                        - option "Chỉ tạm nghỉ"
                        - option "Chỉ đã nghỉ"
                        - option "Tất cả" [selected]
                      - img
                - generic [ref=e69]:
                  - button "Lọc" [ref=e70] [cursor=pointer]
                  - link "Xoá lọc" [ref=e71] [cursor=pointer]:
                    - /url: /staff
              - generic [ref=e72]:
                - generic [ref=e73]:
                  - heading "Danh sách nhân sự" [level=3] [ref=e74]
                  - paragraph [ref=e75]: Mỗi người chỉ có một lớp đang phục vụ tại một thời điểm.
                - generic [ref=e76]:
                  - generic [ref=e78]:
                    - generic [ref=e79]:
                      - link "Chị Cecilia Bùi Phó Thiếu" [ref=e80] [cursor=pointer]:
                        - /url: /staff/93575c4d-cfec-4f8b-b75f-1e91f0655b52
                      - paragraph [ref=e81]: GLV908 · 0901000008 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e82]:
                      - generic [ref=e83]:
                        - img [ref=e84]
                        - text: Đang phục vụ
                      - generic [ref=e87]:
                        - img [ref=e88]
                        - text: Đã có tài khoản
                      - generic [ref=e91]: Chưa phân lớp
                  - generic [ref=e93]:
                    - generic [ref=e94]:
                      - link "Chị Agnes Cao GLV 1B" [ref=e95] [cursor=pointer]:
                        - /url: /staff/50c83a2e-f141-41c6-ac82-b845745c64bf
                      - paragraph [ref=e96]: GLV913 · 0901000013 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e97]:
                      - generic [ref=e98]:
                        - img [ref=e99]
                        - text: Đang phục vụ
                      - generic [ref=e102]:
                        - img [ref=e103]
                        - text: Đã có tài khoản
                      - generic [ref=e106]:
                        - img [ref=e107]
                        - text: Ấu 1B · Giáo lý viên
                  - generic [ref=e111]:
                    - generic [ref=e112]:
                      - link "Anh Đại diện E2E 1" [ref=e113] [cursor=pointer]:
                        - /url: /staff/141e0c54-74b7-4c87-838c-ee10e2c414bb
                      - paragraph [ref=e114]: GLV920 · 0988000010 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e115]:
                      - generic [ref=e116]:
                        - img [ref=e117]
                        - text: Đang phục vụ
                      - generic [ref=e120]:
                        - img [ref=e121]
                        - text: Đã có tài khoản
                      - generic [ref=e124]:
                        - img [ref=e125]
                        - text: Chiên Con 1 · Đại diện
                  - generic [ref=e129]:
                    - generic [ref=e130]:
                      - link "Anh Đại diện E2E 2" [ref=e131] [cursor=pointer]:
                        - /url: /staff/f12b56fe-3388-4d59-a573-79e555ebdd89
                      - paragraph [ref=e132]: GLV921 · 0988000020 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e133]:
                      - generic [ref=e134]:
                        - img [ref=e135]
                        - text: Đang phục vụ
                      - generic [ref=e138]:
                        - img [ref=e139]
                        - text: Đã có tài khoản
                      - generic [ref=e142]:
                        - img [ref=e143]
                        - text: Nghĩa 1 · Đại diện
                  - generic [ref=e147]:
                    - generic [ref=e148]:
                      - link "Chị Lucia Đinh GLV 1A" [ref=e149] [cursor=pointer]:
                        - /url: /staff/99eb4359-d648-45c2-9693-d7f97049b00c
                      - paragraph [ref=e150]: GLV910 · 0901000010 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e151]:
                      - generic [ref=e152]:
                        - img [ref=e153]
                        - text: Đang phục vụ
                      - generic [ref=e156]:
                        - img [ref=e157]
                        - text: Đã có tài khoản
                      - generic [ref=e160]:
                        - img [ref=e161]
                        - text: Ấu 1A · Giáo lý viên
                  - generic [ref=e165]:
                    - generic [ref=e166]:
                      - link "Chị Têrêsa Đỗ Phó Ấu" [ref=e167] [cursor=pointer]:
                        - /url: /staff/6e292e9f-7f45-42ba-8383-895508e1762d
                      - paragraph [ref=e168]: GLV906 · 0901000006 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e169]:
                      - generic [ref=e170]:
                        - img [ref=e171]
                        - text: Đang phục vụ
                      - generic [ref=e174]:
                        - img [ref=e175]
                        - text: Đã có tài khoản
                      - generic [ref=e178]: Chưa phân lớp
                  - generic [ref=e180]:
                    - generic [ref=e181]:
                      - link "Anh Gioakim Đoàn Chưa Vai Trò" [ref=e182] [cursor=pointer]:
                        - /url: /staff/120169ff-74c6-42d7-bc10-07bf543f93af
                      - paragraph [ref=e183]: GLV918 · 0901000018 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e184]:
                      - generic [ref=e185]:
                        - img [ref=e186]
                        - text: Đang phục vụ
                      - generic [ref=e189]:
                        - img [ref=e190]
                        - text: ⚠ Chưa gán vai trò
                      - generic [ref=e192]: Chưa phân lớp
                  - generic [ref=e194]:
                    - generic [ref=e195]:
                      - link "Anh Antôn Hồ Đã Nghỉ" [ref=e196] [cursor=pointer]:
                        - /url: /staff/182bb0af-9b34-4a9b-8a24-6c95eafd8c79
                      - paragraph [ref=e197]: GLV915 · 0901000015 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e198]:
                      - generic [ref=e199]: Đã nghỉ
                      - generic [ref=e200]: Chưa có tài khoản
                      - generic [ref=e201]: Chưa phân lớp
                  - generic [ref=e203]:
                    - generic [ref=e204]:
                      - link "Anh Micae Hoàng Trưởng Thiếu" [ref=e205] [cursor=pointer]:
                        - /url: /staff/8db1e768-f24b-465e-915a-043316bb8bfb
                      - paragraph [ref=e206]: GLV907 · 0901000007 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e207]:
                      - generic [ref=e208]:
                        - img [ref=e209]
                        - text: Đang phục vụ
                      - generic [ref=e212]:
                        - img [ref=e213]
                        - text: Đã có tài khoản
                      - generic [ref=e216]: Chưa phân lớp
                  - generic [ref=e218]:
                    - generic [ref=e219]:
                      - link "Chị Maria Lê Phó Đoàn" [ref=e220] [cursor=pointer]:
                        - /url: /staff/a0b50282-156e-4812-ba77-18b8d4246179
                      - paragraph [ref=e221]: GLV902 · 0901000002 · Huấn luyện Chưa qua huấn luyện
                    - generic [ref=e222]:
                      - generic [ref=e223]:
                        - img [ref=e224]
                        - text: Đang phục vụ
                      - generic [ref=e227]:
                        - img [ref=e228]
                        - text: Đã có tài khoản
                      - generic [ref=e231]: Chưa phân lớp
                  - navigation "Phân trang" [ref=e232]:
                    - paragraph [ref=e233]: Đang xem 1–10 trong 19 hồ sơ.
                    - list [ref=e234]:
                      - listitem [ref=e235]:
                        - generic [ref=e236]:
                          - img [ref=e237]
                          - generic [ref=e239]: Trước
                      - listitem [ref=e240]:
                        - generic [ref=e241]: "1"
                      - listitem [ref=e242]:
                        - link "Trang 2" [active] [ref=e243] [cursor=pointer]:
                          - /url: /staff?service=all&page=2
                          - text: "2"
                      - listitem [ref=e244]:
                        - link "Trang sau" [ref=e245] [cursor=pointer]:
                          - /url: /staff?service=all&page=2
                          - generic [ref=e246]: Sau
                          - img [ref=e247]
            - generic [ref=e249]:
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - heading "Thêm nhân sự" [level=3] [ref=e252]
                  - paragraph [ref=e253]: Dì/Sơ là danh xưng, không phải role hệ thống.
                - generic [ref=e255]:
                  - generic [ref=e256]:
                    - generic [ref=e257]:
                      - generic [ref=e258]: Danh xưng
                      - generic [ref=e259]:
                        - combobox "Danh xưng" [ref=e260]:
                          - option "Anh" [selected]
                          - option "Chị"
                          - option "Dì"
                          - option "Sơ"
                          - option "Cha"
                          - option "Thầy"
                          - option "Khác"
                        - img
                    - generic [ref=e261]:
                      - generic [ref=e262]: Trình độ huấn luyện
                      - generic [ref=e263]:
                        - combobox "Trình độ huấn luyện" [ref=e264]:
                          - option "Chưa qua huấn luyện" [selected]
                          - option "Cấp I"
                          - option "Cấp II"
                          - option "Cấp III"
                          - option "Đặc biệt"
                        - img
                  - generic [ref=e265]:
                    - generic [ref=e266]: Tên thánh
                    - textbox "Tên thánh" [ref=e267]
                  - generic [ref=e268]:
                    - generic [ref=e269]: Họ tên
                    - textbox "Họ tên" [ref=e270]
                  - generic [ref=e271]:
                    - generic [ref=e272]: Điện thoại
                    - textbox "Điện thoại" [ref=e273]
                  - generic [ref=e274]:
                    - generic [ref=e275]: Ngày sinh
                    - textbox "Ngày sinh" [ref=e276]
                  - generic [ref=e277]:
                    - generic [ref=e278]: Email
                    - textbox "Email" [ref=e279]
                  - generic [ref=e280]:
                    - generic [ref=e281]: Địa chỉ
                    - textbox "Địa chỉ" [ref=e282]
                  - button "Tạo hồ sơ" [ref=e283] [cursor=pointer]
                  - paragraph [ref=e284]: Hồ sơ mới luôn ở trạng thái “Đang phục vụ”. Đổi trạng thái ở trang hồ sơ sau khi tạo.
              - generic [ref=e285]:
                - generic [ref=e286]:
                  - heading "Phân công vào lớp" [level=3] [ref=e287]
                  - paragraph [ref=e288]: Muốn đổi lớp mà giữ tài khoản thì mở hồ sơ và dùng “Chuyển lớp”.
                - generic [ref=e290]:
                  - generic [ref=e291]:
                    - generic [ref=e292]: Nhân sự
                    - generic [ref=e293]:
                      - combobox "Nhân sự" [ref=e294]:
                        - option "Chọn nhân sự" [disabled] [selected]
                        - option "GLV908 · Bùi Phó Thiếu"
                        - option "GLV913 · Cao GLV 1B (Ấu 1B)" [disabled]
                        - option "GLV920 · Đại diện E2E 1 (Chiên Con 1)" [disabled]
                        - option "GLV921 · Đại diện E2E 2 (Nghĩa 1)" [disabled]
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
                        - option "GLV911 · Trịnh Dự Trưởng (Ấu 1B)" [disabled]
                        - option "GLV905 · Vũ Trưởng Ấu"
                      - img
                  - generic [ref=e295]:
                    - generic [ref=e296]: Lớp
                    - generic [ref=e297]:
                      - combobox "Lớp" [ref=e298]:
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
                  - generic [ref=e299]:
                    - generic [ref=e300]: Vai trò trong lớp
                    - generic [ref=e301]:
                      - combobox "Vai trò trong lớp" [ref=e302]:
                        - option "Giáo lý viên đại diện"
                        - option "Giáo lý viên lớp" [selected]
                        - option "Dự trưởng phụ tá"
                      - img
                  - generic [ref=e303]:
                    - generic [ref=e304]: Ngày bắt đầu
                    - textbox "Ngày bắt đầu" [ref=e305]
                  - button "Lưu phân công" [ref=e306] [cursor=pointer]
    - navigation "Điều hướng nhanh" [ref=e307]:
      - list [ref=e308]:
        - listitem [ref=e309]:
          - link "Trang chủ" [ref=e310] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e311]
            - generic [ref=e316]: Trang chủ
        - listitem [ref=e317]:
          - link "Thiếu nhi" [ref=e318] [cursor=pointer]:
            - /url: /students
            - img [ref=e319]
            - generic [ref=e323]: Thiếu nhi
        - listitem [ref=e324]:
          - link "Điểm danh" [ref=e325] [cursor=pointer]:
            - /url: /attendance
            - img [ref=e326]
            - generic [ref=e330]: Điểm danh
        - listitem [ref=e331]:
          - link "Báo cáo" [ref=e332] [cursor=pointer]:
            - /url: /reports
            - img [ref=e333]
            - generic [ref=e335]: Báo cáo
        - listitem [ref=e336]:
          - link "Tài khoản" [ref=e337] [cursor=pointer]:
            - /url: /account
            - img [ref=e338]
            - generic [ref=e342]: Tài khoản
  - alert [ref=e343]
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