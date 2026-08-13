# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> M12-A · nhập Excel >> lần nhập đã huỷ không còn nút huỷ, và mở ra vẫn xem lại được
- Location: tests\e2e\imports.spec.ts:245:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
                  - generic [ref=e19]: Nhập dữ liệu Excel
            - paragraph [ref=e20]: Nhập dữ liệu Excel
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
            - heading "Nhập dữ liệu Excel" [level=1] [ref=e46]
            - paragraph [ref=e47]: Tải file lên để kiểm tra thử, xem trước kết quả rồi mới ghi vào hệ thống.
          - generic [ref=e48]:
            - generic [ref=e49]:
              - heading "Tải file lên" [level=3] [ref=e51]
              - form "Tải file Excel lên" [ref=e53]:
                - paragraph [ref=e54]:
                  - text: Dữ liệu sẽ được ghi danh vào năm học
                  - strong [ref=e55]: 2026-2027
                  - text: . Hệ thống đọc được file mẫu chuẩn, sheet
                  - strong [ref=e56]: SYLL
                  - text: hoặc sheet
                  - strong [ref=e57]: DS_dau_nam
                  - text: của sổ lớp. Bước tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống.
                - generic [ref=e58]:
                  - generic [ref=e59]: File Excel (.xlsx — tối đa 4 MB và 1.000 dòng)
                  - button "File Excel (.xlsx — tối đa 4 MB và 1.000 dòng)" [ref=e60]
                - generic [ref=e61]:
                  - generic [ref=e62]: Lớp đích (nếu file không có cột lớp)
                  - generic [ref=e63]:
                    - combobox "Lớp đích (nếu file không có cột lớp)" [ref=e64]:
                      - option "— Lấy theo cột lớp trong file —" [selected]
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
                  - paragraph [ref=e65]: Sổ lớp Chiên Con không có cột lớp — hãy chọn lớp ở đây. Dòng nào đã ghi lớp trong file thì vẫn ưu tiên giá trị trong file.
                - generic [ref=e66]:
                  - button "Đang kiểm tra…" [disabled]
                  - link "Tải file mẫu" [ref=e67] [cursor=pointer]:
                    - /url: /imports/template
            - generic [ref=e68]:
              - heading "Lần nhập gần đây" [level=2] [ref=e69]
              - group "Lọc danh sách lần nhập" [ref=e71]:
                - generic [ref=e72]:
                  - img [ref=e73]
                  - text: Lọc danh sách lần nhập
                - generic [ref=e74]:
                  - generic [ref=e75]:
                    - generic [ref=e76]: Năm học
                    - generic [ref=e77]:
                      - combobox "Năm học" [ref=e78]:
                        - option "Năm học hiện hành" [selected]
                        - option "Tất cả năm học"
                        - option "2072-2073 — Năm học 2072-2073"
                        - option "2071-2072 — Năm học 2071-2072"
                        - option "2027-2028 — Năm đích E2E Phase 5"
                        - option "2026-2027 — Năm học 2026-2027"
                        - option "2024-2025 — Năm học 2024-2025"
                        - option "2019-2020 — Năm học 2019-2020"
                      - img
                  - generic [ref=e79]:
                    - generic [ref=e80]: Trạng thái
                    - generic [ref=e81]:
                      - combobox "Trạng thái" [ref=e82]:
                        - option "Tất cả trạng thái" [selected]
                        - option "Đã kiểm tra, chờ xác nhận"
                        - option "Ghi một phần — còn dòng lỗi"
                        - option "Đã ghi vào hệ thống"
                        - option "Đã huỷ"
                      - img
                - button "Lọc" [ref=e84] [cursor=pointer]
              - paragraph [ref=e85]: 10 lần nhập. Đang xem năm học 2026-2027.
              - list "Danh sách lần nhập" [ref=e86]:
                - listitem [ref=e87]:
                  - 'link "M12A-tablet-768.xlsx Đã huỷ 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 14:00 bởi Trần Xuân Đoàn · huỷ 13/08/2026 14:00" [ref=e88] [cursor=pointer]':
                    - /url: /imports/b1efd189-464f-4efd-9df9-2d9753917bde
                    - generic [ref=e89]:
                      - paragraph [ref=e90]: M12A-tablet-768.xlsx
                      - generic [ref=e91]: Đã huỷ
                    - paragraph [ref=e92]: 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0
                    - paragraph [ref=e93]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 14:00 bởi Trần Xuân Đoàn · huỷ 13/08/2026 14:00"
                - listitem [ref=e94]:
                  - 'link "M12C-sec-mobile-360.xlsx Đã huỷ 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52" [ref=e95] [cursor=pointer]':
                    - /url: /imports/cf334508-1d27-4ec0-8829-0c4abdbb6f0b
                    - generic [ref=e96]:
                      - paragraph [ref=e97]: M12C-sec-mobile-360.xlsx
                      - generic [ref=e98]: Đã huỷ
                    - paragraph [ref=e99]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e100]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52"
                - listitem [ref=e101]:
                  - 'link "M12C-bao-cao-mobile-360.xlsx Đã huỷ 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52" [ref=e102] [cursor=pointer]':
                    - /url: /imports/03ea64c1-cb96-423a-9087-f1b75ab685ce
                    - generic [ref=e103]:
                      - paragraph [ref=e104]: M12C-bao-cao-mobile-360.xlsx
                      - generic [ref=e105]: Đã huỷ
                    - paragraph [ref=e106]: 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0
                    - paragraph [ref=e107]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52"
                - listitem [ref=e108]:
                  - 'link "M12B-do-cham-mobile-360.xlsx Đã huỷ 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52" [ref=e109] [cursor=pointer]':
                    - /url: /imports/d4b99b9d-bf0e-427b-8d4e-1f1083fea752
                    - generic [ref=e110]:
                      - paragraph [ref=e111]: M12B-do-cham-mobile-360.xlsx
                      - generic [ref=e112]: Đã huỷ
                    - paragraph [ref=e113]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e114]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:52 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:52"
                - listitem [ref=e115]:
                  - 'link "M12B-danh-sach-mobile-360.xlsx Đã kiểm tra, chờ xác nhận 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn" [ref=e116] [cursor=pointer]':
                    - /url: /imports/931f179f-f1b1-4af0-937b-5f58f1b62f97
                    - generic [ref=e117]:
                      - paragraph [ref=e118]: M12B-danh-sach-mobile-360.xlsx
                      - generic [ref=e119]:
                        - img [ref=e120]
                        - text: Đã kiểm tra, chờ xác nhận
                    - paragraph [ref=e122]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e123]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn"
                - listitem [ref=e124]:
                  - 'link "M12B-loc-mobile-360.xlsx Đã huỷ 3 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 1 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51" [ref=e125] [cursor=pointer]':
                    - /url: /imports/ed6b0ed3-03fd-4037-9bca-fbfb34833498
                    - generic [ref=e126]:
                      - paragraph [ref=e127]: M12B-loc-mobile-360.xlsx
                      - generic [ref=e128]: Đã huỷ
                    - paragraph [ref=e129]: 3 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 1
                    - paragraph [ref=e130]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51"
                - listitem [ref=e131]:
                  - 'link "M12B-trung-mobile-360.xlsx Đã huỷ 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51" [ref=e132] [cursor=pointer]':
                    - /url: /imports/6c75d4b8-2ab6-4d51-a904-4d287e073aca
                    - generic [ref=e133]:
                      - paragraph [ref=e134]: M12B-trung-mobile-360.xlsx
                      - generic [ref=e135]: Đã huỷ
                    - paragraph [ref=e136]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e137]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51"
                - listitem [ref=e138]:
                  - 'link "M12B-gioi-tinh-mobile-360.xlsx Đã huỷ 3 dòng · hợp lệ 0 · cảnh báo 3 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51" [ref=e139] [cursor=pointer]':
                    - /url: /imports/3153e715-85ed-435d-b2e8-161dc24b90d3
                    - generic [ref=e140]:
                      - paragraph [ref=e141]: M12B-gioi-tinh-mobile-360.xlsx
                      - generic [ref=e142]: Đã huỷ
                    - paragraph [ref=e143]: 3 dòng · hợp lệ 0 · cảnh báo 3 · lỗi 0
                    - paragraph [ref=e144]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51"
                - listitem [ref=e145]:
                  - 'link "M12A-xem-lai-mobile-360.xlsx Đã huỷ 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51" [ref=e146] [cursor=pointer]':
                    - /url: /imports/5811c9f6-3787-4fcf-8701-9414ab7e8c4d
                    - generic [ref=e147]:
                      - paragraph [ref=e148]: M12A-xem-lai-mobile-360.xlsx
                      - generic [ref=e149]: Đã huỷ
                    - paragraph [ref=e150]: 1 dòng · hợp lệ 0 · cảnh báo 1 · lỗi 0
                    - paragraph [ref=e151]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51"
                - listitem [ref=e152]:
                  - 'link "M12A-mobile-360.xlsx Đã huỷ 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0 Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51" [ref=e153] [cursor=pointer]':
                    - /url: /imports/9398d3a6-536d-4853-9b39-07546e9c78d5
                    - generic [ref=e154]:
                      - paragraph [ref=e155]: M12A-mobile-360.xlsx
                      - generic [ref=e156]: Đã huỷ
                    - paragraph [ref=e157]: 2 dòng · hợp lệ 0 · cảnh báo 2 · lỗi 0
                    - paragraph [ref=e158]: "Nguồn: file mẫu chuẩn · tải lên 13/08/2026 13:51 bởi Trần Xuân Đoàn · huỷ 13/08/2026 13:51"
    - navigation "Điều hướng nhanh" [ref=e159]:
      - list [ref=e160]:
        - listitem [ref=e161]:
          - link "Trang chủ" [ref=e162] [cursor=pointer]:
            - /url: /dashboard
            - img [ref=e163]
            - generic [ref=e168]: Trang chủ
        - listitem [ref=e169]:
          - link "Thiếu nhi" [ref=e170] [cursor=pointer]:
            - /url: /students
            - img [ref=e171]
            - generic [ref=e175]: Thiếu nhi
        - listitem [ref=e176]:
          - link "Điểm danh" [ref=e177] [cursor=pointer]:
            - /url: /attendance
            - img [ref=e178]
            - generic [ref=e182]: Điểm danh
        - listitem [ref=e183]:
          - link "Báo cáo" [ref=e184] [cursor=pointer]:
            - /url: /reports
            - img [ref=e185]
            - generic [ref=e187]: Báo cáo
        - listitem [ref=e188]:
          - link "Tài khoản" [ref=e189] [cursor=pointer]:
            - /url: /account
            - img [ref=e190]
            - generic [ref=e194]: Tài khoản
  - alert [ref=e195]
```

# Test source

```ts
  154 |   await cancel.click();
  155 |   await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  156 |   await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
  157 | }
  158 | 
  159 | test.describe("M12-A · nhập Excel", () => {
  160 |   /**
  161 |    * 🔴 **Ngưỡng 30 giây mặc định của Playwright là TRẦN CỦA CẢ BÀI**, nên mọi
  162 |    * `expect(…, { timeout: 45_000 })` viết trong bộ này — kể cả những chỗ M12-A
  163 |    * đã viết từ đợt trước — đều bị nó cắt trước khi kịp dùng hết ngân sách của
  164 |    * mình. Lượt chạy toàn bộ của M12-B lộ ra điều đó: bài AC-14 rớt với đúng
  165 |    * thông điệp *"Test timeout of 30000ms exceeded"* trong khi lần nhập **đã nằm
  166 |    * trong cơ sở dữ liệu** — tức đo được đồng hồ bấm giờ chứ không đo được sản
  167 |    * phẩm. Mọi bài ở đây đều tải file lên và ghi thật, tức đúng loại thao tác của
  168 |    * **nợ #10**, nên nới trần cho cả bộ đúng cách `attendance.spec.ts` đã làm.
  169 |    */
  170 |   test.describe.configure({ timeout: 90_000 });
  171 | 
  172 |   test.beforeEach(async ({ page }) => {
  173 |     await login(page, SECRETARY);
  174 |   });
  175 | 
  176 |   test("SEC-01: Giáo lý viên lớp không vào được trang nhập dữ liệu", async ({ page }) => {
  177 |     await login(page, CLASS_TEACHER);
  178 |     await page.goto("/imports");
  179 |     await expect(page).toHaveURL(/\/access-denied$/);
  180 |   });
  181 | 
  182 |   test("🔴 AC-13: file hỏng phải nói ra LÝ DO, không im lặng", async ({ page }) => {
  183 |     await uploadWorkbook(
  184 |       page,
  185 |       "khong-phai-excel.xlsx",
  186 |       Buffer.from("đây là văn bản thường, không phải workbook", "utf8"),
  187 |     );
  188 | 
  189 |     // Câu chữ đến từ `parse.ts`, đã có sẵn từ Phase 2 nhưng chưa ai hiện nó ra.
  190 |     // Neo TRONG biểu mẫu: Next có sẵn một `role="alert"` rỗng để đọc tên trang.
  191 |     const message = page
  192 |       .getByRole("form", { name: "Tải file Excel lên" })
  193 |       .getByRole("alert");
  194 |     await expect(message).toBeVisible({ timeout: 45_000 });
  195 |     await expect(message).toContainText(/Không đọc được file|Không tìm thấy sheet dữ liệu/);
  196 |     // Vẫn ở nguyên trang tải lên, không nhảy đi đâu.
  197 |     await expect(page).toHaveURL(/\/imports$/);
  198 |   });
  199 | 
  200 |   test("🔴 AC-14 + AC-17: tải lên xong vào thẳng lần nhập, và huỷ phải hỏi lại", async ({
  201 |     page,
  202 |   }, testInfo) => {
  203 |     // Tên riêng theo viewport: ba project chạy trên cùng một database.
  204 |     const filename = `M12A-${testInfo.project.name}.xlsx`;
  205 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  206 |     const content = await buildWorkbook([
  207 |       { name: `Test Nhap Mot ${suffix}`, dob: "05/05/2016", phone: "0900123456" },
  208 |       { name: `Test Nhap Hai ${suffix}`, dob: "06/06/2016", phone: "0900123457" },
  209 |     ]);
  210 | 
  211 |     try {
  212 |       await uploadWorkbook(page, filename, content);
  213 | 
  214 |       // AC-14 — vào thẳng trang của lần nhập vừa tạo.
  215 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  216 |       await expect(page.getByRole("heading", { name: filename })).toBeVisible();
  217 |       await expect(page.getByText(/2 dòng/).first()).toBeVisible();
  218 |       await expect(batchRows(page)).toHaveCount(2);
  219 | 
  220 |       // AC-17 — hộp xác nhận nêu tên file và số dòng, và chưa huỷ gì trước đó.
  221 |       await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
  222 |       const dialog = page.getByRole("dialog");
  223 |       await expect(dialog).toBeVisible();
  224 |       await expect(dialog).toContainText(filename);
  225 |       await expect(dialog).toContainText("2");
  226 |       await expect(dialog).toContainText(/giữ lại/);
  227 | 
  228 |       await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  229 |       await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
  230 | 
  231 |       // D-131 — huỷ là ĐÁNH DẤU: lần nhập vẫn còn trong danh sách.
  232 |       await page.goto("/imports");
  233 |       const card = page
  234 |         .getByRole("list", { name: "Danh sách lần nhập" })
  235 |         .getByRole("listitem")
  236 |         .filter({ hasText: filename })
  237 |         .first();
  238 |       await expect(card).toBeVisible();
  239 |       await expect(card).toContainText("Đã huỷ");
  240 |     } finally {
  241 |       await cancelOpenBatch(page).catch(() => {});
  242 |     }
  243 |   });
  244 | 
  245 |   test("lần nhập đã huỷ không còn nút huỷ, và mở ra vẫn xem lại được", async ({
  246 |     page,
  247 |   }, testInfo) => {
  248 |     const filename = `M12A-xem-lai-${testInfo.project.name}.xlsx`;
  249 |     const content = await buildWorkbook([
  250 |       { name: `Test Xem Lai ${testInfo.project.name}`, dob: "07/07/2016", phone: "0900123458" },
  251 |     ]);
  252 | 
  253 |     await uploadWorkbook(page, filename, content);
> 254 |     await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 45000ms exceeded.
  255 |     const batchUrl = page.url();
  256 | 
  257 |     await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
  258 |     await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  259 |     await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
  260 | 
  261 |     await page.goto(batchUrl);
  262 |     await expect(page.getByText("Đã huỷ").first()).toBeVisible();
  263 |     await expect(page.getByRole("button", { name: "Huỷ lần nhập" })).toHaveCount(0);
  264 |     // 🔴 Và cũng KHÔNG còn nút "Ghi": dòng vẫn ở trạng thái chờ (huỷ là đánh dấu,
  265 |     // không xoá) nhưng `commit_import_rows` ném `BATCH_CANCELLED` — để nút ở đó
  266 |     // là mời người dùng bấm một nút không bao giờ chạy.
  267 |     await expect(page.getByRole("button", { name: /Ghi \d+ dòng/ })).toHaveCount(0);
  268 |     // D-132 — sau khi huỷ thì dọn được dữ liệu thô.
  269 |     await expect(page.getByRole("button", { name: "Xoá dữ liệu thô" })).toBeVisible();
  270 |     // Dòng vẫn còn để tra cứu (BR-M12-35).
  271 |     await expect(batchRows(page)).toHaveCount(1);
  272 |   });
  273 | 
  274 |   test("🔴 AC-21: điền giới tính HÀNG LOẠT — nhiều dòng, một lượt lưu", async ({
  275 |     page,
  276 |   }, testInfo) => {
  277 |     test.setTimeout(180_000);
  278 |     const filename = `M12B-gioi-tinh-${testInfo.project.name}.xlsx`;
  279 |     const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
  280 |     // Sổ KHÔNG có cột giới tính — đúng hình dạng sổ SYLL của giáo xứ.
  281 |     const content = await buildWorkbookWithoutGender([
  282 |       { name: `Test Gioi Tinh Mot ${suffix}`, dob: "01/03/2016", phone: "0900223341" },
  283 |       { name: `Test Gioi Tinh Hai ${suffix}`, dob: "02/03/2016", phone: "0900223342" },
  284 |       { name: `Test Gioi Tinh Ba ${suffix}`, dob: "03/03/2016", phone: "0900223343" },
  285 |     ]);
  286 | 
  287 |     try {
  288 |       await uploadWorkbook(page, filename, content);
  289 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 75_000 });
  290 |       await expect(batchRows(page)).toHaveCount(3);
  291 | 
  292 |       // Con số này đếm trong cơ sở dữ liệu, không đếm trên trang đang xem.
  293 |       await expect(page.getByText(/3 dòng.*chưa có giới tính/)).toBeVisible();
  294 | 
  295 |       // Đánh dấu hai dòng rồi áp dụng Nam — điền TẠI CHỖ, chưa gửi gì lên.
  296 |       await page.getByLabel("Chọn dòng 2").check();
  297 |       await page.getByLabel("Chọn dòng 3").check();
  298 |       await expect(page.getByText("2 dòng đang chọn.")).toBeVisible();
  299 |       await page.getByRole("button", { name: "Áp dụng Nam cho dòng đang chọn" }).click();
  300 | 
  301 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveValue("male");
  302 |       await expect(page.getByLabel("Giới tính của dòng 3")).toHaveValue("male");
  303 |       // Dòng không đánh dấu phải nguyên vẹn.
  304 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  305 | 
  306 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  307 |       // 60 giây, không phải 45: lượt lưu hàng loạt là thao tác ghi NẶNG NHẤT của
  308 |       // module, và lượt chạy toàn bộ đo được nó mất tới ~48 giây khi máy đang
  309 |       // chạy hết bộ E2E. ⚠️ Che triệu chứng của nợ #10, không phải chữa.
  310 |       await expect(page.getByText(/Đã lưu 2 dòng/)).toBeVisible({ timeout: 60_000 });
  311 |       await page.reload();
  312 | 
  313 |       // Bằng chứng đã ghi thật: dải cảnh báo tự đếm lại còn đúng một dòng, và
  314 |       // hai dòng vừa lưu không còn ô chọn giới tính nữa.
  315 |       await expect(page.getByText(/1 dòng.*chưa có giới tính/)).toBeVisible({ timeout: 45_000 });
  316 |       await expect(page.getByLabel("Giới tính của dòng 2")).toHaveCount(0);
  317 |       await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
  318 |     } finally {
  319 |       await cancelOpenBatch(page).catch(() => {});
  320 |     }
  321 |   });
  322 | 
  323 |   /**
  324 |    * 🔴 **D-133 phải sống sót qua TO-BE 4.** Chủ dự án chốt 2026-07-29 rằng dòng
  325 |    * trùng chắc chắn phải được xác nhận **từng dòng**; một nút "Lưu tất cả" gộp
  326 |    * luôn chúng là đúng thứ D-133 sinh ra để chặn. Bài này đo cả hai nửa: nút lưu
  327 |    * chung **từ chối** dòng ấy và nói ra, còn nút của riêng dòng thì lưu được.
  328 |    *
  329 |    * Dữ liệu trùng lấy thẳng từ `seed:dev` (CQ0060 — họ tên + ngày sinh + SĐT phụ
  330 |    * huynh khớp cả ba ⇒ mức `high`), nên bài không cần tạo hồ sơ thiếu nhi nào.
  331 |    */
  332 |   test("🔴 D-133: dòng trùng chắc chắn KHÔNG lưu hàng loạt được", async ({ page }, testInfo) => {
  333 |     const filename = `M12B-trung-${testInfo.project.name}.xlsx`;
  334 |     const content = await buildWorkbook([
  335 |       // Trùng cả ba với CQ0060 của seed:dev.
  336 |       { name: "Nguyễn Minh An", dob: "12/03/2017", phone: "0912000001" },
  337 |     ]);
  338 | 
  339 |     try {
  340 |       await uploadWorkbook(page, filename, content);
  341 |       await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
  342 | 
  343 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  344 |       await expect(page.getByText(/1 dòng.*nghi trùng chắc chắn/)).toBeVisible();
  345 |       // Mặc định an toàn của M12-A vẫn đứng: Ghép, không phải Tạo mới.
  346 |       await expect(page.getByLabel("Cách xử lý dòng 2")).toHaveValue("merge");
  347 | 
  348 |       // Nửa thứ nhất: nút lưu chung phải TỪ CHỐI dòng này và nói ra lý do.
  349 |       await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
  350 |       await expect(page.getByText(/Còn 1 dòng nghi trùng chắc chắn/)).toBeVisible({
  351 |         timeout: 45_000,
  352 |       });
  353 |       await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
  354 | 
```