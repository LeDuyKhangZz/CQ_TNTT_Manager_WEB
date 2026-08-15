import { expect, test, type Page } from "@playwright/test";

/**
 * M03-C — **TB-F06** (lưu trữ đồng bộ ghi danh) · **TB-F08** (sửa/xoá bí tích) ·
 * **TB-F12** (quản lý người giám hộ) · **D-67** (mức đọc của Thủ quỹ).
 *
 * 🔴 Ba viewport dùng chung MỘT database (`workers: 1`, bài học M04-A) và
 * `students` **không cho xoá**. File này vì thế được thiết kế để chạy lại bao
 * nhiêu lượt cũng ra cùng kết quả:
 *
 *   · Mọi bài **đổi trạng thái đều đi VÀ về** trong cùng một bài.
 *   · Bài lưu trữ chỉ **mở hộp xác nhận rồi Huỷ** — lưu trữ thật một em của
 *     `seed:dev` là làm hỏng mọi spec khác, và không có đường hoàn tác.
 *   · Bài bí tích **tự dọn**: thêm → sửa → xoá trong một bài.
 *   · Bài sửa liên lạc phụ huynh **trả lại số cũ** ở cuối bài.
 *
 * 🔴 Và **không đụng lớp Ấu 1A**: đó là lớp duy nhất có thiếu nhi trong
 * `seed:dev` mà nhiều spec khác chốt cứng sĩ số (`enrollment-lifecycle:121`
 * khẳng định *"Sĩ số đang sinh hoạt: 2"*). Bài học lặp lại từ M04-A, M02-C và
 * M03-B: trên một database dùng chung, **một bài test ghi dữ liệu là một bài
 * test sửa hệ thống của bài khác**.
 */
const DEV_PASSWORD = "123456";
/** Xứ đoàn trưởng — ghi toàn xứ đoàn, lưu trữ được (`docs/05` §5). */
const GROUP_LEADER = "GLV901";
/** Giáo lý viên lớp Ấu 1A — D-127 cho họ GHI sức khoẻ/bí tích, D-128 không cho XOÁ. */
const CLASS_TEACHER = "GLV910";
/** Thủ quỹ — D-67/D-129. Trước M03-C mọi trang của họ đều trống. */
const TREASURER = "GLV904";

/** Em ở lớp Ấu 1B — KHÔNG spec nào chốt sĩ số lớp này. */
const STUDENT = "Nguyễn Minh Khoa";
const STUDENT_CLASS = "Ấu 1B";
/** Em ở lớp Ấu 1A, chỉ dùng cho các bài KHÔNG ghi gì. */
const READ_ONLY_STUDENT = "Nguyễn Minh An";
/** Phụ huynh của Trần Bảo Châu; `students-directory.spec` tra theo số của phụ huynh A. */
const GUARDIAN_PHONE = "0912000002";

async function login(page: Page, username: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/(dashboard|change-password|access-denied)$/, { timeout: 10_000 });
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

/**
 * 🔴 Ngưỡng của **cả bài** phải lớn hơn ngưỡng của từng khẳng định trong bài.
 *
 * Mặc định Playwright cho mỗi bài 30 giây, trong khi các khẳng định sau-thao-tác-
 * ghi ở đây chờ tới 45 giây (nợ #10 — mỗi thao tác là một RPC ghi hai bảng rồi
 * hai đến ba lượt `revalidatePath`). Nghĩa là bài **tự đặt ra một hạn không bao
 * giờ đạt được**: lượt chạy đầu có hai viewport xanh và viewport thứ ba hết giờ
 * giữa chừng, để lại một em ở trạng thái "Tạm nghỉ" — rồi mọi bài sau tìm em ấy
 * bằng bộ lọc mặc định (`status=active`) đều không thấy và đỏ theo.
 */
test.describe.configure({ timeout: 120_000 });

/**
 * Mở hồ sơ một em qua ô tìm kiếm của `/students` (D-126 — gõ không dấu cũng ra).
 * Đi qua danh sách chứ không chốt cứng UUID: mã hồ sơ do sequence sinh ra nên
 * mỗi lượt `seed:dev` lại khác.
 *
 * `status=all` là bắt buộc: bộ lọc mặc định của trang chỉ hiện em **đang sinh
 * hoạt** (D-108), nên một lượt chạy rớt giữa chừng sẽ làm mọi lượt sau không
 * tìm thấy em nữa — bài test không tự khôi phục được khỏi chính nó.
 */
async function openStudent(page: Page, fullName: string, tab?: string) {
  await page.goto(`/students?status=all&q=${encodeURIComponent(fullName)}`);
  const link = page.getByRole("link", { name: new RegExp(fullName) }).first();
  await expect(link).toBeVisible({ timeout: 20_000 });
  const href = await link.getAttribute("href");
  expect(href, `hồ sơ ${fullName} phải có href`).toMatch(/^\/students\/[0-9a-f-]{36}/);
  await page.goto(href!);
  if (tab) await page.goto(`${new URL(page.url()).pathname}?tab=${tab}`);
}

test.describe("TB-F06 · trạng thái hồ sơ tách khỏi biểu mẫu thông tin", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, GROUP_LEADER);
  });

  test('biểu mẫu "Cập nhật hồ sơ" KHÔNG còn ô Trạng thái', async ({ page }) => {
    // 🔴 Đây là điểm trừ C5 = 2 của biên bản audit: trước M03-C ô "Trạng thái"
    // nằm ngay cạnh ô "Điện thoại", chung một nút "Lưu thay đổi" — lưu trữ một
    // em là một cú chọn nhầm trong `<select>`, không hỏi gì.
    await openStudent(page, STUDENT);
    await expect(page.getByRole("heading", { name: "Cập nhật hồ sơ" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel("Trạng thái", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Trạng thái hồ sơ", { exact: true })).toBeVisible();
  });

  test("AC-F06-01: lưu trữ em còn lớp thì cảnh báo nêu TÊN LỚP, và hộp xác nhận nêu TÊN EM", async ({
    page,
  }) => {
    await openStudent(page, STUDENT);
    const statusForm = page.getByRole("form", { name: new RegExp(`Trạng thái hồ sơ của`) });
    await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("archived");

    // Cảnh báo phải nêu tên lớp: "em còn ghi danh đang mở" mà không nói ở lớp
    // nào thì người dùng không biết mình sắp đóng cái gì (BR-M03-N12).
    //
    // Neo vào `<strong>` chứ không phải chuỗi trần: tên lớp xuất hiện HAI chỗ
    // trong khối này (câu cảnh báo và nhãn ô tick), và một `getByText` trần sẽ
    // vi phạm chế độ nghiêm ngặt của Playwright.
    await expect(statusForm.getByText(STUDENT_CLASS, { exact: true })).toBeVisible();
    const closeBox = statusForm.getByLabel(new RegExp("Đồng thời kết thúc ghi danh"));
    await expect(closeBox).toBeVisible();
    // Mặc định KHÔNG tick: một mặc định `true` sẽ đóng ghi danh của một em vì
    // người dùng quên bỏ tick.
    await expect(closeBox).not.toBeChecked();

    await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(dialog).toContainText(STUDENT);
    await expect(dialog).toContainText(STUDENT_CLASS);
    // 🔴 S-11 — hệ quả duy nhất người dùng không suy ra được từ màn hình.
    await expect(dialog).toContainText("Giáo lý viên");

    // Huỷ ⇒ không ghi gì. Hồ sơ phải còn nguyên trạng thái cũ.
    //
    // Kiểm bằng **giá trị của ô chọn**, không phải bằng `getByText("Đang sinh
    // hoạt").first()`: chuỗi ấy cũng là một `<option>` bên trong `<select>` đang
    // đóng, nên `.first()` rơi vào một phần tử **ẩn** và bài đỏ trong khi giao
    // diện đúng. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B, M04-C,
    // M03-A và M03-B.
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await page.reload();
    await expect(
      page
        .getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") })
        .getByLabel("Trạng thái hồ sơ"),
    ).toHaveValue("active", { timeout: 20_000 });
  });

  test("🔴 D-130: tạm nghỉ hồ sơ kéo ghi danh sang Tạm nghỉ, rồi khôi phục lại", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // Bài ĐI VÀ VỀ trong cùng một bài — ba viewport chạy nối tiếp trên cùng một
    // database, nên bài nào để lại dấu vết là bài ấy phá lượt sau của chính nó.
    await openStudent(page, STUDENT);
    const studentPath = new URL(page.url()).pathname;

    /*
      🔴 `try/finally` chứ không phải một mạch thẳng — và đây là bài học đắt
      nhất của đợt này.

      Lượt chạy trước: bài này rớt ở **nợ #10 vế (a)** (thao tác ghi ĐÃ vào cơ
      sở dữ liệu, nhưng câu phản hồi không kịp về trong 45 giây), nên chân "về"
      không bao giờ chạy và em nằm lại ở "Tạm nghỉ". Bộ lọc mặc định của
      `/students` chỉ hiện em **đang sinh hoạt**, nên **năm bài sau của hai
      viewport sau đỏ theo** — không bài nào trong số đó có lỗi gì cả.

      Một bài test ghi dữ liệu phải trả lại trạng thái **kể cả khi chính nó
      rớt**, nếu không thì một lỗi ngẫu nhiên biến thành năm lỗi và tập bài đỏ
      không còn nói lên điều gì.
    */
    try {
      const statusForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
      await statusForm.getByLabel("Trạng thái hồ sơ").selectOption("temporarily_inactive");
      await statusForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
      const pauseDialog = page.getByRole("dialog");
      await expect(pauseDialog).toContainText("giữ nguyên chỗ");
      await pauseDialog.getByRole("button", { name: "Đổi trạng thái" }).click();

      // Ngưỡng 45 giây, không phải 20 — nợ #10 vế (a).
      await expect(page.getByText(/Ghi danh ở lớp .* đã chuyển sang "Tạm nghỉ"/)).toBeVisible({
        timeout: 45_000,
      });

      // Và ghi danh THẬT SỰ đổi, không chỉ có một câu thông báo.
      await page.goto(`${studentPath}?tab=history`);
      await expect(page.getByText(STUDENT_CLASS).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("Tạm nghỉ").first()).toBeVisible();
    } finally {
      // ── Về ──────────────────────────────────────────────────────────────
      await page.goto(studentPath);
      const backForm = page.getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") });
      await backForm.getByLabel("Trạng thái hồ sơ").selectOption("active");
      await backForm.getByRole("button", { name: "Đổi trạng thái hồ sơ" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Đổi trạng thái" }).click();
      await expect(page.getByText(/Đã khôi phục ghi danh ở lớp/)).toBeVisible({ timeout: 75_000 });
      await page.reload();
      await expect(
        page
          .getByRole("form", { name: new RegExp("Trạng thái hồ sơ của") })
          .getByLabel("Trạng thái hồ sơ"),
      ).toHaveValue("active");
    }
  });
});

test.describe("TB-F08 · sửa và xoá bản ghi bí tích", () => {
  test("AC-F08-01 · AC-F08-02 · D-128 — vòng đời một bản ghi: thêm → trùng → sửa → xoá", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await login(page, GROUP_LEADER);
    await openStudent(page, STUDENT, "sacraments");

    /*
      Dọn dấu vết của lượt trước NẾU có. Bài này tự dọn ở cuối, nhưng một lượt
      rớt giữa chừng sẽ để lại một bản ghi "Rửa tội" — và vì mỗi loại bí tích
      chỉ ghi được một lần cho mỗi em, lượt sau sẽ đỏ ở ngay bước đầu vì một lý
      do không liên quan gì tới thứ nó đang kiểm.
    */
    const leftover = page.getByRole("button", { name: "Xoá" });
    if ((await leftover.count()) > 0) {
      await leftover.first().click();
      await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
      await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
      await page.reload();
    }

    try {
      const addForm = page.getByRole("form", { name: "Thêm bí tích" });
      await expect(addForm).toBeVisible({ timeout: 20_000 });
      await addForm.getByLabel("Loại bí tích").selectOption("baptism");
      await addForm.getByLabel("Ngày lãnh").fill("2016-01-15");
      await addForm.getByLabel("Nơi lãnh").fill(`Nhà thờ E2E ${testInfo.project.name}`);
      await addForm.getByRole("button", { name: "Lưu bí tích" }).click();
      await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });
      await page.reload();

      // AC-F08-02 — unique index chạy đúng từ đầu, chỉ là mã `23505` từng bị nuốt
      // nên trải nghiệm là "bấm không có gì xảy ra".
      const addAgain = page.getByRole("form", { name: "Thêm bí tích" });
      await addAgain.getByLabel("Loại bí tích").selectOption("baptism");
      await addAgain.getByLabel("Ngày lãnh").fill("2016-02-20");
      await addAgain.getByRole("button", { name: "Lưu bí tích" }).click();
      await expect(page.getByText(/đã có bản ghi cho loại bí tích đó/i)).toBeVisible({
        timeout: 45_000,
      });

      // AC-F08-01 — sửa được, và sửa bằng một LIÊN KẾT nên không cần JavaScript.
      await page.getByRole("link", { name: "Sửa bí tích Rửa tội" }).click();
      await page.waitForURL(/edit=/, { timeout: 20_000 });
      const editForm = page.getByRole("form", { name: "Sửa bản ghi bí tích" });
      // Đợt C: hiển thị dd/MM/yyyy, ô ẩn giữ ISO.
      await expect(editForm.getByLabel("Ngày lãnh")).toHaveValue("15/01/2016");
      await editForm.getByLabel("Ngày lãnh").fill("2016-03-30");
      await editForm.getByRole("button", { name: "Lưu thay đổi" }).click();
      await expect(page.getByText("Đã lưu bí tích Rửa tội.")).toBeVisible({ timeout: 45_000 });

      // Sửa chứ KHÔNG tạo bản ghi thứ hai: vẫn đúng một dòng, và là ngày mới.
      await page.goto(`${new URL(page.url()).pathname}?tab=sacraments`);
      const list = page.getByRole("list", { name: new RegExp(`Bí tích của`) });
      await expect(list.getByRole("listitem")).toHaveCount(1, { timeout: 20_000 });
      await expect(list).toContainText("30/03/2016");

      // D-128 — xoá phải hỏi, và hỏi bằng tên riêng.
      await page.getByRole("button", { name: "Xoá" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText("Rửa tội");
      await expect(dialog).toContainText(STUDENT);
      await expect(dialog).toContainText("không có thùng rác");
      await dialog.getByRole("button", { name: "Xoá bản ghi" }).click();
      await expect(page.getByText("Đã xoá bản ghi bí tích Rửa tội.")).toBeVisible({
        timeout: 45_000,
      });
    } finally {
      /*
        Dọn **kể cả khi bài rớt giữa chừng** (nợ #10). Bước dọn ở đầu bài đã
        lo cho lượt sau của chính bài này, nhưng để bản ghi ở lại nghĩa là mọi
        spec chạy sau đó làm việc trên một fixture khác với `seed:dev`.
      */
      await openStudent(page, STUDENT, "sacraments");
      const remaining = page.getByRole("button", { name: "Xoá" });
      if ((await remaining.count()) > 0) {
        await remaining.first().click();
        await page.getByRole("dialog").getByRole("button", { name: "Xoá bản ghi" }).click();
        await expect(page.getByText(/Đã xoá bản ghi bí tích/)).toBeVisible({ timeout: 45_000 });
      }
    }
  });


  test("🔴 D-127 + D-128: Giáo lý viên GHI được bí tích nhưng KHÔNG thấy nút Xoá", async ({
    page,
  }) => {
    // Trước M03-C tab này của Giáo lý viên **không có biểu mẫu nào cả**, vì
    // `student_sacraments_*` còn là `app.can_global_write()`. Bài không ghi gì.
    await login(page, CLASS_TEACHER);
    await openStudent(page, READ_ONLY_STUDENT, "sacraments");
    await expect(page.getByRole("form", { name: "Thêm bí tích" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Xoá" })).toHaveCount(0);
  });

  test("D-127: Giáo lý viên sửa được hồ sơ SỨC KHOẺ của em lớp mình", async ({ page }) => {
    // Lý lẽ chính của D-127: người biết "em này dị ứng đậu phộng" là người đứng
    // lớp hằng tuần. Bài chỉ kiểm biểu mẫu có mặt — không ghi, để không đụng
    // dữ liệu sức khoẻ mà `seed:dev` dựng sẵn.
    await login(page, CLASS_TEACHER);
    await openStudent(page, READ_ONLY_STUDENT, "health");
    await expect(page.getByLabel("Dị ứng")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("TB-F12 · quản lý người giám hộ", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, GROUP_LEADER);
  });

  test("BR-M03-N15: sửa được số điện thoại phụ huynh (lỗi F12 — 31/75)", async ({ page }) => {
    // 🔴 Trước M03-C **không có màn hình nào** để sửa: `updateGuardian` viết
    // xong từ Phase 2 mà không nơi nào gọi. Bài này đi VÀ về để lượt sau còn
    // chạy được — `students-directory.spec` tra cứu theo số của phụ huynh khác,
    // nhưng để số rác lại vẫn là làm bẩn fixture.
    await openStudent(page, "Trần Bảo Châu");
    const form = page.getByRole("form", { name: new RegExp("Sửa thông tin người giám hộ của") });
    await expect(form.getByLabel("Điện thoại")).toHaveValue(GUARDIAN_PHONE, { timeout: 20_000 });

    // `try/finally` cùng lý do với bài D-130: một lượt rớt vì nợ #10 mà không
    // trả lại số cũ là để lại một số điện thoại rác trong fixture dùng chung.
    try {
      await form.getByLabel("Điện thoại").fill("0912999888");
      await form.getByRole("button", { name: "Lưu thông tin liên lạc" }).click();
      await expect(page.getByText(/Đã lưu thông tin liên lạc của/)).toBeVisible({
        timeout: 45_000,
      });

      await page.reload();
      const back = page.getByRole("form", { name: new RegExp("Sửa thông tin người giám hộ của") });
      await expect(back.getByLabel("Điện thoại")).toHaveValue("0912999888", { timeout: 20_000 });
    } finally {
      await page.reload();
      const restore = page.getByRole("form", {
        name: new RegExp("Sửa thông tin người giám hộ của"),
      });
      await restore.getByLabel("Điện thoại").fill(GUARDIAN_PHONE);
      await restore.getByRole("button", { name: "Lưu thông tin liên lạc" }).click();
      await expect(page.getByText(/Đã lưu thông tin liên lạc của/)).toBeVisible({
        timeout: 45_000,
      });
    }
  });

  test("🔴 AC-F12-02: đổi người giám hộ hỏi trước, nêu đủ BA cái tên", async ({ page }) => {
    // Thao tác này đổi NGAY quyền đọc của hai tài khoản phụ huynh
    // (`app.own_student_ids()` nối theo `guardians.profile_id`). Bài chỉ mở hộp
    // thoại rồi Huỷ ⇒ không ghi gì.
    await openStudent(page, "Trần Bảo Châu");
    const form = page.getByRole("form", { name: new RegExp("Đổi người giám hộ của") });
    await expect(form).toBeVisible({ timeout: 20_000 });
    await form.getByRole("button", { name: "Đổi người giám hộ" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(dialog).toContainText("Trần Bảo Châu");
    await expect(dialog).toContainText("KHÔNG còn xem được");
    await expect(dialog).toContainText("cổng phụ huynh");
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("`11` §5 · trang hồ sơ vừa khung và bấm được ở cả ba viewport", () => {
  /**
   * `responsive.spec.ts` quét 13 địa chỉ **cấp một** nhưng không có
   * `/students/[studentId]` — mà đợt này thêm **ba khối mới** vào đúng trang ấy.
   * Hai tiêu chí nghiệm thu chung ("không tràn ngang" · "mọi vùng chạm ≥44px")
   * vì thế không ai đo hộ, nên đo tại chỗ.
   */
  test("không tràn ngang và mọi vùng bấm ≥44px trên trang chi tiết", async ({ page }) => {
    await login(page, GROUP_LEADER);
    await openStudent(page, STUDENT);

    for (const tab of ["", "?tab=history", "?tab=sacraments", "?tab=health"]) {
      const base = new URL(page.url()).pathname;
      await page.goto(`${base}${tab}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${tab || "tổng quan"} tràn ngang`).toBeLessThanOrEqual(1);

      const undersized = await page.evaluate((min) => {
        const offenders: string[] = [];
        const controls = document.querySelectorAll<HTMLElement>(
          "main button, main a[href], main select, main input[type='checkbox']",
        );
        for (const control of controls) {
          const box = control.getBoundingClientRect();
          if (box.width === 0 && box.height === 0) continue;
          // Ô tick nằm trong một `<label>` cao 44px — vùng bấm thật là cái nhãn,
          // đúng khuôn đã dùng ở `create-student-form`.
          if (control instanceof HTMLInputElement && control.type === "checkbox") {
            const label = control.closest("label");
            if (label && label.getBoundingClientRect().height >= min) continue;
          }
          if (box.height < min) {
            offenders.push(`${control.tagName.toLowerCase()} ${Math.round(box.height)}px`);
          }
        }
        return offenders;
      }, 44);
      expect(undersized, `${tab || "tổng quan"} có vùng bấm nhỏ hơn 44px`).toEqual([]);
    }
  });
});

test.describe("D-67 · mức đọc riêng của Thủ quỹ", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TREASURER);
  });

  test("🔴 Thủ quỹ thấy được danh sách em — trước M03-C trang này TRỐNG TRƠN", async ({
    page,
  }) => {
    await page.goto("/students");
    const rows = page.getByRole("list", { name: "Danh sách thiếu nhi" }).getByRole("listitem");
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    await expect(rows.first()).toContainText("Giám hộ:");
  });

  test("trang NÓI RA phạm vi, không để người dùng đoán vì sao thiếu cột", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByText(/Danh sách phục vụ việc thu phí/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/không thuộc phạm vi Thủ quỹ/)).toBeVisible();
  });

  test("🔴 dòng KHÔNG phải liên kết — hồ sơ chi tiết ngoài phạm vi Thủ quỹ", async ({ page }) => {
    // Một liên kết luôn dẫn tới 404 còn tệ hơn không có liên kết: người dùng sẽ
    // báo "hệ thống mất hồ sơ của em".
    await page.goto("/students");
    const list = page.getByRole("list", { name: "Danh sách thiếu nhi" });
    await expect(list.getByRole("listitem").first()).toBeVisible({ timeout: 20_000 });
    await expect(list.getByRole("link")).toHaveCount(0);
  });

  test("D-67: Thủ quỹ KHÔNG ghi được gì — không có biểu mẫu tạo hồ sơ nào", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByRole("list", { name: "Danh sách thiếu nhi" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("form", { name: "Thêm thiếu nhi" })).toHaveCount(0);
    await expect(page.getByRole("form", { name: "Thêm người giám hộ" })).toHaveCount(0);
  });

  test("D-126: ô tìm không dấu của Thủ quỹ chạy đúng như của mọi người", async ({ page }) => {
    await page.goto("/students?status=all&q=nguyen+minh+khoa");
    const rows = page.getByRole("list", { name: "Danh sách thiếu nhi" }).getByRole("listitem");
    await expect(rows).toHaveCount(1, { timeout: 20_000 });
    await expect(rows.first()).toContainText(STUDENT);
  });
});
