# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal.spec.ts >> M13-A — cổng phụ huynh và thiếu nhi >> D-64: phụ huynh một con đi thẳng vào hồ sơ
- Location: tests\e2e\portal.spec.ts:247:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/parent\/children\/[0-9a-f-]{36}$/
Received string:  "http://127.0.0.1:3107/parent/children"
Timeout: 20000ms

Call log:
  - Expect "toHaveURL" with timeout 20000ms
    43 × unexpected value "http://127.0.0.1:3107/parent/children"

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
      - listitem: Con của tôi
  - paragraph: Con của tôi
  - paragraph: "Năm học hiện hành: 2026-2027"
  - link "Mở thông báo, 2 chưa đọc":
    - /url: /notifications
    - text: "2"
  - group
- main:
  - paragraph: "Đang xem: Ngành Ấu Nhi · Năm học 2026-2027"
- navigation "Điều hướng nhanh":
  - list:
    - listitem:
      - link "Trang chủ":
        - /url: /dashboard
    - listitem:
      - link "Con của tôi":
        - /url: /parent/children
    - listitem:
      - link "Xin nghỉ":
        - /url: /parent/absence-requests
    - listitem:
      - link "Thông báo":
        - /url: /notifications
    - listitem:
      - link "Tài khoản":
        - /url: /account
- alert: Thiếu Nhi Chợ Quán
```

# Test source

```ts
  151 |     unlinkedUsername,
  152 |     noChildrenUsername,
  153 |     noEnrollmentUsername,
  154 |     noEnrollmentProfileId,
  155 |   };
  156 | }
  157 | 
  158 | async function login(page: Page, username: string) {
  159 |   await page.context().clearCookies();
  160 |   for (let attempt = 0; attempt < 3; attempt += 1) {
  161 |     try {
  162 |       await page.goto("/login", { waitUntil: "domcontentloaded" });
  163 |       await page.getByLabel("Tên đăng nhập").fill(username);
  164 |       await page.locator("input#password").fill(DEV_PASSWORD);
  165 |       await page.getByRole("button", { name: "Đăng nhập" }).click();
  166 |       await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 15_000 });
  167 |       await expect(page).toHaveURL(/\/dashboard$/);
  168 |       // Chờ nội dung máy chủ dựng xong, không chỉ chờ URL đổi. Nếu kiểm menu
  169 |       // ngay khi URL vừa đổi, `isVisible()` có thể trả false trong lúc dashboard
  170 |       // còn đang nạp và bài test sẽ nhầm sang nhánh mở drawer.
  171 |       await expect(
  172 |         page.getByRole("main").getByRole("heading", { level: 1, name: "Tổng quan" }),
  173 |       ).toBeVisible();
  174 |       return;
  175 |     } catch {
  176 |       await page.waitForTimeout(500);
  177 |     }
  178 |   }
  179 |   throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
  180 | }
  181 | 
  182 | async function openParentChildrenFromNavigation(page: Page) {
  183 |   let link = page.locator('nav a[href="/parent/children"]:visible').first();
  184 |   if (!(await link.isVisible())) {
  185 |     await page.getByRole("button", { name: "Mở menu" }).click();
  186 |     link = page.locator('nav a[href="/parent/children"]:visible').first();
  187 |   }
  188 |   await expect(link).toBeVisible();
  189 |   await link.click();
  190 |   await page.waitForURL(/\/parent\/children(?:\/|$)/);
  191 | }
  192 | 
  193 | async function expectNoHorizontalOverflow(page: Page, where: string) {
  194 |   await page.waitForLoadState("domcontentloaded");
  195 |   const overflows = await page.evaluate(
  196 |     () => document.documentElement.scrollWidth > window.innerWidth + 1,
  197 |   );
  198 |   expect(overflows, `${where} không được tràn ngang`).toBe(false);
  199 | }
  200 | 
  201 | async function studentUsername(): Promise<string> {
  202 |   const admin = getLocalAdmin();
  203 |   const { data: student, error: studentError } = await admin
  204 |     .from("students")
  205 |     .select("profile_id")
  206 |     .not("profile_id", "is", null)
  207 |     .limit(1)
  208 |     .single();
  209 |   if (studentError || !student.profile_id) {
  210 |     throw new Error(`Không tìm thấy tài khoản thiếu nhi: ${studentError?.message ?? "thiếu profile"}`);
  211 |   }
  212 |   const { data: profile, error: profileError } = await admin
  213 |     .from("profiles")
  214 |     .select("username")
  215 |     .eq("id", student.profile_id)
  216 |     .single();
  217 |   if (profileError) throw new Error(`Không đọc được username thiếu nhi: ${profileError.message}`);
  218 |   return profile.username;
  219 | }
  220 | 
  221 | test.describe("M13-A — cổng phụ huynh và thiếu nhi", () => {
  222 |   // Hai ca M13-B/C đổi qua 3 tài khoản và nhiều route trong một ca; 30 giây mặc
  223 |   // định không đủ trên máy OneDrive dù từng thao tác riêng đều hoàn tất.
  224 |   test.describe.configure({ timeout: 120_000 });
  225 | 
  226 |   test.afterEach(async ({}, testInfo) => {
  227 |     const fixture = EMPTY_FIXTURE[testInfo.project.name as ProjectName];
  228 |     if (!fixture) return;
  229 |     const admin = getLocalAdmin();
  230 |     const { error: scoreError } = await admin
  231 |       .from("assessment_scores")
  232 |       .delete()
  233 |       .in("id", [fixtureUuid(7, fixture.index), fixtureUuid(8, fixture.index)]);
  234 |     if (scoreError) throw scoreError;
  235 |     const { error: assessmentError } = await admin
  236 |       .from("assessments")
  237 |       .delete()
  238 |       .in("id", [fixtureUuid(5, fixture.index), fixtureUuid(6, fixture.index)]);
  239 |     if (assessmentError) throw assessmentError;
  240 |     const { error: enrollmentError } = await admin
  241 |       .from("enrollments")
  242 |       .delete()
  243 |       .eq("id", fixtureUuid(4, fixture.index));
  244 |     if (enrollmentError) throw enrollmentError;
  245 |   });
  246 | 
  247 |   test("D-64: phụ huynh một con đi thẳng vào hồ sơ", async ({ page }) => {
  248 |     await login(page, GUARDIAN_ONE_CHILD);
  249 |     await openParentChildrenFromNavigation(page);
  250 | 
> 251 |     await expect(page).toHaveURL(/\/parent\/children\/[0-9a-f-]{36}$/, { timeout: 20_000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  252 |     await expect(
  253 |       page.getByRole("main").getByRole("heading", { level: 1, name: "Maria Trần Bảo Châu" }),
  254 |     ).toBeVisible();
  255 |     await expectNoHorizontalOverflow(page, "hồ sơ con duy nhất");
  256 |   });
  257 | 
  258 |   test("D-64/D-70: phụ huynh nhiều con thấy đúng hai con của mình", async ({ page }) => {
  259 |     await login(page, GUARDIAN_TWO_CHILDREN);
  260 |     await openParentChildrenFromNavigation(page);
  261 | 
  262 |     await expect(page).toHaveURL(/\/parent\/children$/);
  263 |     const main = page.getByRole("main");
  264 |     await expect(main.getByRole("link", { name: "Giuse Nguyễn Minh An" })).toBeVisible();
  265 |     await expect(main.getByRole("link", { name: "Phêrô Nguyễn Minh Khoa" })).toBeVisible();
  266 |     await expect(main.getByText("Maria Trần Bảo Châu", { exact: true })).toHaveCount(0);
  267 | 
  268 |     await main.getByRole("link", { name: "Phêrô Nguyễn Minh Khoa" }).click();
  269 |     await expect(
  270 |       page.getByRole("main").getByRole("heading", { level: 1, name: "Phêrô Nguyễn Minh Khoa" }),
  271 |     ).toBeVisible();
  272 |     await expect(page.getByRole("main").getByRole("link", { name: "Con của tôi" })).toBeVisible();
  273 |     await expectNoHorizontalOverflow(page, "hồ sơ một trong nhiều con");
  274 |   });
  275 | 
  276 |   test("D-25: GLV đồng thời là phụ huynh vẫn có mục Con của tôi", async ({ page }) => {
  277 |     await login(page, STAFF_GUARDIAN);
  278 |     await openParentChildrenFromNavigation(page);
  279 | 
  280 |     const childLink = page.getByRole("main").getByRole("link", { name: "Anna Đinh Gia Hân" });
  281 |     if (await childLink.isVisible()) await childLink.click();
  282 |     await expect(
  283 |       page.getByRole("main").getByRole("heading", { level: 1, name: "Anna Đinh Gia Hân" }),
  284 |     ).toBeVisible({ timeout: 20_000 });
  285 |   });
  286 | 
  287 |   test("BR-M13-02: URL con của người khác trả 404 và không lộ tên", async ({ page }) => {
  288 |     await login(page, GUARDIAN_ONE_CHILD);
  289 |     await openParentChildrenFromNavigation(page);
  290 |     // `openParentChildrenFromNavigation` chủ ý chấp nhận cả URL danh sách và
  291 |     // chi tiết; trường hợp một con còn một redirect D-64 ở phía máy chủ.
  292 |     await expect(page).toHaveURL(/\/parent\/children\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  293 |     const otherChildUrl = page.url();
  294 | 
  295 |     await login(page, GUARDIAN_TWO_CHILDREN);
  296 |     await page.goto(otherChildUrl);
  297 | 
  298 |     await expect(page.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeVisible();
  299 |     await expect(page.locator("body")).not.toContainText("Trần Bảo Châu");
  300 |   });
  301 | 
  302 |   test("AC-01-01/02: vai trò sai bị chặn, thiếu nhi vẫn thấy chính mình", async ({ page }) => {
  303 |     await login(page, GUARDIAN_TWO_CHILDREN);
  304 |     await page.goto("/student/attendance");
  305 |     await expect(page).toHaveURL(/\/access-denied$/);
  306 | 
  307 |     await login(page, await studentUsername());
  308 |     await page.goto("/student/attendance");
  309 |     await expect(page).toHaveURL(/\/student\/attendance$/);
  310 |     await expect(page.getByRole("heading", { level: 1, name: "Điểm danh của em" })).toBeVisible();
  311 |   });
  312 | 
  313 |   test("TB-M13-03/04: bốn nguyên nhân rỗng khác nhau và mật độ dễ đọc", async ({ page }, testInfo) => {
  314 |     const fixture = await prepareEmptyStateFixtures(testInfo);
  315 | 
  316 |     await login(page, fixture.unlinkedUsername);
  317 |     await page.goto("/parent/children");
  318 |     await expect(page.getByRole("heading", { level: 3, name: "Tài khoản chưa được gắn với hồ sơ" })).toBeVisible();
  319 | 
  320 |     await login(page, fixture.noChildrenUsername);
  321 |     await page.goto("/parent/children");
  322 |     await expect(page.getByRole("heading", { level: 3, name: "Hồ sơ người giám hộ chưa có thiếu nhi" })).toBeVisible();
  323 |     const comfortable = page.locator('[data-density="comfortable"]').first();
  324 |     await expect(comfortable).toBeVisible();
  325 |     const density = await comfortable.evaluate((element) => {
  326 |       const style = getComputedStyle(element);
  327 |       return {
  328 |         body: style.getPropertyValue("--text-base").trim(),
  329 |         control: style.getPropertyValue("--control-height").trim(),
  330 |       };
  331 |     });
  332 |     expect(density).toEqual({ body: "17px", control: "48px" });
  333 | 
  334 |     await login(page, fixture.noEnrollmentUsername);
  335 |     await page.goto("/parent/children");
  336 |     await expect(page).toHaveURL(new RegExp(`/parent/children/${fixture.studentId}$`));
  337 |     await expect(page.getByRole("heading", { level: 3, name: "Chưa có ghi danh trong năm học hiện hành" })).toBeVisible();
  338 |     await expect(page.getByText(/chưa được ghi danh trong năm học/)).toBeVisible();
  339 | 
  340 |     await page.goto("/results");
  341 |     await expect(page.getByRole("heading", { level: 3, name: "Chưa có ghi danh trong năm học hiện hành" })).toBeVisible();
  342 | 
  343 |     const { error: enrollmentError } = await fixture.admin.from("enrollments").upsert({
  344 |       id: fixture.enrollmentId,
  345 |       student_id: fixture.studentId,
  346 |       academic_year_id: fixture.year.id,
  347 |       class_id: fixture.classId,
  348 |       status: "active",
  349 |       enrolled_on: fixture.year.start_date,
  350 |       ended_on: null,
  351 |       previous_enrollment_id: null,
```