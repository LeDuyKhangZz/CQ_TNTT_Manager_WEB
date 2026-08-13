import { expect, test, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

/**
 * M12-A — nhập dữ liệu Excel: phản hồi thật (TO-BE 1) và hàng rào xoá (TO-BE 3).
 *
 * 🔴 File này canh hai lỗi CRITICAL bằng đúng cách người dùng gặp chúng:
 *
 *   · **AC-13** — tải lên một file hỏng phải **đọc được lý do**. Trước đợt này
 *     màn hình không đổi một chữ nào, nên người dùng thử lại cùng một file hỏng.
 *   · **AC-14** — tải lên thành công thì vào thẳng trang của lần nhập vừa tạo,
 *     không phải tự đi tìm trong danh sách.
 *   · **AC-17** — "Huỷ lần nhập" phải hỏi lại và nêu **tên file + số dòng**.
 *
 * 🔴 **Không bài nào bấm "Ghi"**, và đó là điều cố ý: ghi là tạo hồ sơ thiếu nhi
 * thật, mà `students` **không cho xoá** (`20260716000100:176-179`). Ba viewport
 * dùng chung một database (`workers: 1`), nên một bài ghi dữ liệu là một bài sửa
 * hệ thống của bài khác — bài học đã trả giá ở M04-A, M02-C và M03-B. Đường ghi
 * do pgTAP `011` (RPC thật) và unit test của `BatchActions` phủ.
 *
 * Mỗi lượt chạy tạo một lần nhập mới rồi **tự huỷ nó ở cuối bài**, kể cả khi bài
 * rớt giữa chừng (`try/finally` — cách chặn thiệt hại M03-C đã dặn các module
 * sau làm theo).
 */
const DEV_PASSWORD = "123456";
/** Thư ký — một trong bốn vai trò ghi toàn xứ đoàn được nhập Excel. */
const SECRETARY = "GLV901";
/** Giáo lý viên lớp Ấu 1A của `seed:dev` — đối chứng âm tính của SEC-01. */
const CLASS_TEACHER = "GLV910";
/** `seed:dev` tạo đủ 19 lớp chuẩn cho năm hiện hành. */
const TARGET_CLASS = "Ấu 1A";

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
 * Dựng một workbook đúng mẫu chuẩn ngay trong bài test. Không đọc file thật của
 * giáo xứ: `Excel mẫu/` chứa dữ liệu cá nhân của trẻ em và không bao giờ được
 * đưa vào repo (xem `gate-phase2-import.test.ts`).
 */
async function buildWorkbook(rows: { name: string; dob: string; phone: string }[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("THIEU_NHI");
  sheet.addRow([
    "Tên Thánh",
    "Họ và tên",
    "Giới tính",
    "Ngày tháng năm sinh",
    "Số điện thoại cha",
    "Lớp học giáo lý hiện nay",
  ]);
  for (const row of rows) {
    sheet.addRow(["Maria", row.name, "Nữ", row.dob, row.phone, TARGET_CLASS]);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/**
 * M12-B — sổ **không có cột Giới tính**, đúng hình dạng sổ SYLL của giáo xứ
 * (`docs/09` §2b: thiếu giới tính ở **83% dòng**). Đây là dữ liệu duy nhất bắt
 * được luồng điền hàng loạt của TO-BE 4; file mẫu chuẩn ở trên luôn có sẵn giới
 * tính nên chạy qua nó là không đo gì cả.
 */
async function buildWorkbookWithoutGender(
  rows: { name: string; dob: string; phone: string }[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("THIEU_NHI");
  sheet.addRow([
    "Tên Thánh",
    "Họ và tên",
    "Ngày tháng năm sinh",
    "Số điện thoại cha",
    "Lớp học giáo lý hiện nay",
  ]);
  for (const row of rows) {
    sheet.addRow(["Maria", row.name, row.dob, row.phone, TARGET_CLASS]);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

async function uploadWorkbook(page: Page, filename: string, content: Buffer) {
  await page.goto("/imports");
  await page.setInputFiles("input#import-file", {
    name: filename,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: content,
  });
  await page.getByRole("button", { name: "Kiểm tra file" }).click();
}

/**
 * Đếm dòng của lần nhập.
 *
 * 🔴 **M12-B đổi bộ định vị này, và lý do đáng ghi lại.** Tới hết M12-A mỗi dòng
 * là một thẻ `<li>`, nên phải đếm **con trực tiếp** của danh sách (mỗi thẻ lại
 * chứa một `<ul>` cảnh báo bên trong ⇒ `getByRole("listitem")` đếm gộp hai tầng
 * — bài học đã trả giá ở chính đợt A). Từ đợt B, mỗi dòng là **một `<tbody>`
 * riêng** của bảng: đó là cách một cây DOM duy nhất vừa là thẻ trên điện thoại
 * vừa là bảng trên máy tính mà không nhân đôi ô nhập (xem `batch-row-editor.tsx`).
 */
function batchRows(page: Page) {
  return page.locator('form[aria-label="Sửa dòng của lần nhập"] tbody');
}

/**
 * Bấm lại cho tới khi có hiệu lực — cùng khuôn `attendance.spec.ts` đã dùng.
 *
 * ⚠️ **Đây là che triệu chứng của nợ #15, không phải chữa nó.** Lượt điều hướng
 * phía trình duyệt của Next 15.5 có khoảng 11–14 % lần **không bao giờ chốt**
 * (M02-B đã đo và loại cả cơ sở dữ liệu lẫn máy chủ khỏi diện nghi vấn). Lượt
 * chạy đầu của M12-B vấp đúng một lần ở nút "Xoá lọc" tại `laptop-1366`, trong
 * khi hai viewport kia xanh — đúng chữ ký "đổi chỗ giữa các lượt" của nợ ấy.
 */
async function clickUntil(what: string, click: () => Promise<void>, done: () => Promise<boolean>) {
  // 🔴 Ngân sách 60 giây, **không** phải 24 giây như bản gốc ở `attendance.spec.ts`.
  // Lượt chạy toàn bộ đầu tiên của M12-B đo được: bấm "Xoá lọc" 4 lần trong 24
  // giây vẫn chưa đi, rồi trang **tự đi** ngay sau đó — ảnh chụp lúc bài rớt cho
  // thấy đúng trang không lọc với đủ 3 dòng và không còn liên kết "Xoá lọc". Tức
  // 24 giây nhỏ hơn độ lớn thật của nợ #15: M02-B đã đo 9/72 lượt điều hướng
  // không chốt trong **45 giây**. Đặt ngân sách nhỏ hơn khuyết tật mình đang chịu
  // đựng thì con số đỏ nói về đồng hồ bấm giờ chứ không nói về sản phẩm.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await done()) return;
    await click();
    for (let waited = 0; waited < 20; waited += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await done()) return;
    }
  }
  throw new Error(`${what}: bấm nhiều lần vẫn không có hiệu lực.`);
}

/** Huỷ lần nhập đang mở để lượt chạy sau bắt đầu từ đúng chỗ cũ. */
async function cancelOpenBatch(page: Page) {
  const cancel = page.getByRole("button", { name: "Huỷ lần nhập" });
  if (!(await cancel.isVisible().catch(() => false))) return;
  await cancel.click();
  await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
  await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });
}

test.describe("M12-A · nhập Excel", () => {
  /**
   * 🔴 **Ngưỡng 30 giây mặc định của Playwright là TRẦN CỦA CẢ BÀI**, nên mọi
   * `expect(…, { timeout: 45_000 })` viết trong bộ này — kể cả những chỗ M12-A
   * đã viết từ đợt trước — đều bị nó cắt trước khi kịp dùng hết ngân sách của
   * mình. Lượt chạy toàn bộ của M12-B lộ ra điều đó: bài AC-14 rớt với đúng
   * thông điệp *"Test timeout of 30000ms exceeded"* trong khi lần nhập **đã nằm
   * trong cơ sở dữ liệu** — tức đo được đồng hồ bấm giờ chứ không đo được sản
   * phẩm. Mọi bài ở đây đều tải file lên và ghi thật, tức đúng loại thao tác của
   * **nợ #10**, nên nới trần cho cả bộ đúng cách `attendance.spec.ts` đã làm.
   */
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await login(page, SECRETARY);
  });

  test("SEC-01: Giáo lý viên lớp không vào được trang nhập dữ liệu", async ({ page }) => {
    await login(page, CLASS_TEACHER);
    await page.goto("/imports");
    await expect(page).toHaveURL(/\/access-denied$/);
  });

  test("🔴 AC-13: file hỏng phải nói ra LÝ DO, không im lặng", async ({ page }) => {
    await uploadWorkbook(
      page,
      "khong-phai-excel.xlsx",
      Buffer.from("đây là văn bản thường, không phải workbook", "utf8"),
    );

    // Câu chữ đến từ `parse.ts`, đã có sẵn từ Phase 2 nhưng chưa ai hiện nó ra.
    // Neo TRONG biểu mẫu: Next có sẵn một `role="alert"` rỗng để đọc tên trang.
    const message = page
      .getByRole("form", { name: "Tải file Excel lên" })
      .getByRole("alert");
    await expect(message).toBeVisible({ timeout: 45_000 });
    await expect(message).toContainText(/Không đọc được file|Không tìm thấy sheet dữ liệu/);
    // Vẫn ở nguyên trang tải lên, không nhảy đi đâu.
    await expect(page).toHaveURL(/\/imports$/);
  });

  test("🔴 AC-14 + AC-17: tải lên xong vào thẳng lần nhập, và huỷ phải hỏi lại", async ({
    page,
  }, testInfo) => {
    // Tên riêng theo viewport: ba project chạy trên cùng một database.
    const filename = `M12A-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbook([
      { name: `Test Nhap Mot ${suffix}`, dob: "05/05/2016", phone: "0900123456" },
      { name: `Test Nhap Hai ${suffix}`, dob: "06/06/2016", phone: "0900123457" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);

      // AC-14 — vào thẳng trang của lần nhập vừa tạo.
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      await expect(page.getByRole("heading", { name: filename })).toBeVisible();
      await expect(page.getByText(/2 dòng/).first()).toBeVisible();
      await expect(batchRows(page)).toHaveCount(2);

      // AC-17 — hộp xác nhận nêu tên file và số dòng, và chưa huỷ gì trước đó.
      await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(filename);
      await expect(dialog).toContainText("2");
      await expect(dialog).toContainText(/giữ lại/);

      await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
      await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });

      // D-131 — huỷ là ĐÁNH DẤU: lần nhập vẫn còn trong danh sách.
      await page.goto("/imports");
      const card = page
        .getByRole("list", { name: "Danh sách lần nhập" })
        .getByRole("listitem")
        .filter({ hasText: filename })
        .first();
      await expect(card).toBeVisible();
      await expect(card).toContainText("Đã huỷ");
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  test("lần nhập đã huỷ không còn nút huỷ, và mở ra vẫn xem lại được", async ({
    page,
  }, testInfo) => {
    const filename = `M12A-xem-lai-${testInfo.project.name}.xlsx`;
    const content = await buildWorkbook([
      { name: `Test Xem Lai ${testInfo.project.name}`, dob: "07/07/2016", phone: "0900123458" },
    ]);

    await uploadWorkbook(page, filename, content);
    await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
    const batchUrl = page.url();

    await page.getByRole("button", { name: "Huỷ lần nhập" }).click();
    await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
    await expect(page.getByText(/Đã huỷ lần nhập này/)).toBeVisible({ timeout: 45_000 });

    await page.goto(batchUrl);
    await expect(page.getByText("Đã huỷ").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Huỷ lần nhập" })).toHaveCount(0);
    // 🔴 Và cũng KHÔNG còn nút "Ghi": dòng vẫn ở trạng thái chờ (huỷ là đánh dấu,
    // không xoá) nhưng `commit_import_rows` ném `BATCH_CANCELLED` — để nút ở đó
    // là mời người dùng bấm một nút không bao giờ chạy.
    await expect(page.getByRole("button", { name: /Ghi \d+ dòng/ })).toHaveCount(0);
    // D-132 — sau khi huỷ thì dọn được dữ liệu thô.
    await expect(page.getByRole("button", { name: "Xoá dữ liệu thô" })).toBeVisible();
    // Dòng vẫn còn để tra cứu (BR-M12-35).
    await expect(batchRows(page)).toHaveCount(1);
  });

  test("🔴 AC-21: điền giới tính HÀNG LOẠT — nhiều dòng, một lượt lưu", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    const filename = `M12B-gioi-tinh-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    // Sổ KHÔNG có cột giới tính — đúng hình dạng sổ SYLL của giáo xứ.
    const content = await buildWorkbookWithoutGender([
      { name: `Test Gioi Tinh Mot ${suffix}`, dob: "01/03/2016", phone: "0900223341" },
      { name: `Test Gioi Tinh Hai ${suffix}`, dob: "02/03/2016", phone: "0900223342" },
      { name: `Test Gioi Tinh Ba ${suffix}`, dob: "03/03/2016", phone: "0900223343" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 75_000 });
      await expect(batchRows(page)).toHaveCount(3);

      // Con số này đếm trong cơ sở dữ liệu, không đếm trên trang đang xem.
      await expect(page.getByText(/3 dòng.*chưa có giới tính/)).toBeVisible();

      // Đánh dấu hai dòng rồi áp dụng Nam — điền TẠI CHỖ, chưa gửi gì lên.
      await page.getByLabel("Chọn dòng 2").check();
      await page.getByLabel("Chọn dòng 3").check();
      await expect(page.getByText("2 dòng đang chọn.")).toBeVisible();
      await page.getByRole("button", { name: "Áp dụng Nam cho dòng đang chọn" }).click();

      await expect(page.getByLabel("Giới tính của dòng 2")).toHaveValue("male");
      await expect(page.getByLabel("Giới tính của dòng 3")).toHaveValue("male");
      // Dòng không đánh dấu phải nguyên vẹn.
      await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");

      await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
      // 60 giây, không phải 45: lượt lưu hàng loạt là thao tác ghi NẶNG NHẤT của
      // module, và lượt chạy toàn bộ đo được nó mất tới ~48 giây khi máy đang
      // chạy hết bộ E2E. ⚠️ Che triệu chứng của nợ #10, không phải chữa.
      await expect(page.getByText(/Đã lưu 2 dòng/)).toBeVisible({ timeout: 60_000 });
      await page.reload();

      // Bằng chứng đã ghi thật: dải cảnh báo tự đếm lại còn đúng một dòng, và
      // hai dòng vừa lưu không còn ô chọn giới tính nữa.
      await expect(page.getByText(/1 dòng.*chưa có giới tính/)).toBeVisible({ timeout: 45_000 });
      await expect(page.getByLabel("Giới tính của dòng 2")).toHaveCount(0);
      await expect(page.getByLabel("Giới tính của dòng 4")).toHaveValue("");
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  /**
   * 🔴 **D-133 phải sống sót qua TO-BE 4.** Chủ dự án chốt 2026-07-29 rằng dòng
   * trùng chắc chắn phải được xác nhận **từng dòng**; một nút "Lưu tất cả" gộp
   * luôn chúng là đúng thứ D-133 sinh ra để chặn. Bài này đo cả hai nửa: nút lưu
   * chung **từ chối** dòng ấy và nói ra, còn nút của riêng dòng thì lưu được.
   *
   * Dữ liệu trùng lấy thẳng từ `seed:dev` (CQ0060 — họ tên + ngày sinh + SĐT phụ
   * huynh khớp cả ba ⇒ mức `high`), nên bài không cần tạo hồ sơ thiếu nhi nào.
   */
  test("🔴 D-133: dòng trùng chắc chắn KHÔNG lưu hàng loạt được", async ({ page }, testInfo) => {
    const filename = `M12B-trung-${testInfo.project.name}.xlsx`;
    const content = await buildWorkbook([
      // Trùng cả ba với CQ0060 của seed:dev.
      { name: "Nguyễn Minh An", dob: "12/03/2017", phone: "0912000001" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });

      await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();
      await expect(page.getByText(/1 dòng.*nghi trùng chắc chắn/)).toBeVisible();
      // Mặc định an toàn của M12-A vẫn đứng: Ghép, không phải Tạo mới.
      await expect(page.getByLabel("Cách xử lý dòng 2")).toHaveValue("merge");

      // Nửa thứ nhất: nút lưu chung phải TỪ CHỐI dòng này và nói ra lý do.
      await page.getByRole("button", { name: "Lưu tất cả thay đổi" }).click();
      await expect(page.getByText(/Còn 1 dòng nghi trùng chắc chắn/)).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByText("Chờ xác nhận trùng")).toBeVisible();

      // Nửa thứ hai: nút của riêng dòng thì lưu được, và dấu chặn biến mất.
      // Nút ấy nằm trong khối `<details>` đóng sẵn — phải mở ra mới bấm được, và
      // đó chính là điều D-133 muốn: người duyệt **nhìn hồ sơ đối chiếu** trước.
      await page.getByText(/Dòng #2 .* đối chiếu hồ sơ nghi trùng/).click();
      await page.getByRole("button", { name: "Xác nhận dòng #2" }).click();
      await expect(page.getByText(/Đã lưu 1 dòng/)).toBeVisible({ timeout: 45_000 });
      await expect(page.getByText("Chờ xác nhận trùng")).toHaveCount(0);
      await expect(page.getByText(/nghi trùng chắc chắn với hồ sơ đã có/)).toHaveCount(0);
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  test("🔴 AC-25: lọc dòng theo trạng thái", async ({ page }, testInfo) => {
    const filename = `M12B-loc-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbook([
      { name: `Test Loc Mot ${suffix}`, dob: "04/04/2016", phone: "0900223351" },
      { name: `Test Loc Hai ${suffix}`, dob: "05/04/2016", phone: "0900223352" },
      // Thiếu ngày sinh ⇒ dòng lỗi. Một lần nhập thật luôn có cả hai loại dòng.
      { name: `Test Loc Ba ${suffix}`, dob: "", phone: "0900223353" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      await expect(batchRows(page)).toHaveCount(3);

      await page.getByLabel("Trạng thái dòng").selectOption("error");
      await clickUntil(
        "Lọc theo trạng thái Lỗi",
        () => page.getByRole("button", { name: "Lọc" }).click(),
        async () => (await batchRows(page).count()) === 1,
      );
      await expect(page).toHaveURL(/status=error/);
      await expect(batchRows(page)).toHaveCount(1);

      // Bộ lọc phải **chép được**: mở thẳng đường dẫn ra đúng kết quả ấy.
      const filteredUrl = page.url();
      await page.goto(filteredUrl);
      await expect(batchRows(page)).toHaveCount(1);

      await clickUntil(
        "Xoá lọc",
        () => page.getByRole("link", { name: "Xoá lọc" }).click(),
        async () => (await batchRows(page).count()) === 3,
      );
      await expect(batchRows(page)).toHaveCount(3);
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  test("🔴 TO-BE 7: danh sách lần nhập nói ai tải lên và lọc được theo năm học", async ({
    page,
  }, testInfo) => {
    const filename = `M12B-danh-sach-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbook([
      { name: `Test Danh Sach ${suffix}`, dob: "06/04/2016", phone: "0900223361" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });

      await page.goto("/imports");
      const card = page
        .getByRole("list", { name: "Danh sách lần nhập" })
        .getByRole("listitem")
        .filter({ hasText: filename })
        .first();
      await expect(card).toBeVisible();
      // TO-BE 7 — người tải lên. Trước đợt này danh sách không nói ai tải file.
      await expect(card).toContainText(/bởi .+/);

      // D-135 — mặc định là năm học hiện hành, và màn hình nói ra phạm vi ấy.
      await expect(page.getByText(/Đang xem năm học/)).toBeVisible();

      await page.getByLabel("Năm học").selectOption("all");
      await page.getByRole("button", { name: "Lọc" }).click();
      await expect(page).toHaveURL(/year=all/);
      await expect(page.getByText(/Đang xem mọi năm học/)).toBeVisible();
      await expect(
        page
          .getByRole("list", { name: "Danh sách lần nhập" })
          .getByRole("listitem")
          .filter({ hasText: filename })
          .first(),
      ).toBeVisible();
    } finally {
      await page.goto("/imports").catch(() => {});
      const link = page.getByRole("link", { name: new RegExp(filename.replace(/\./g, "\\.")) });
      await link
        .first()
        .click()
        .catch(() => {});
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  test("vùng chạm của trang lần nhập đạt 44px và không tràn ngang", async ({ page }, testInfo) => {
    await page.goto("/imports");
    const viewport = page.viewportSize();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual((viewport?.width ?? 360) + 1);

    for (const name of ["Kiểm tra file", "Tải file mẫu"]) {
      const control = page.getByRole(name === "Tải file mẫu" ? "link" : "button", { name });
      const box = await control.boundingBox();
      expect(box, `${name} phải hiện ra ở ${testInfo.project.name}`).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  /**
   * 🔴 **Nợ #20 — mỗi module phải tự đo TRANG CHI TIẾT của mình.**
   * `responsive.spec.ts` chỉ quét 13 địa chỉ cấp một và không có địa chỉ chi tiết
   * nào, mà đúng những trang ấy mới là nơi có nhiều điều khiển nhất. Từ M12-B
   * trang này có thêm cả một bảng sửa dữ liệu, tức là chỗ dễ tràn ngang nhất của
   * cả module trên máy 360px.
   */
  test("bảng sửa dòng không tràn ngang và mọi điều khiển đạt 44px", async ({
    page,
  }, testInfo) => {
    const filename = `M12B-do-cham-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbookWithoutGender([
      { name: `Test Do Cham ${suffix}`, dob: "07/04/2016", phone: "0900223371" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });

      const viewport = page.viewportSize();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual((viewport?.width ?? 360) + 1);

      for (const control of [
        page.getByLabel("Giới tính của dòng 2"),
        page.getByLabel("Cách xử lý dòng 2"),
        page.getByRole("button", { name: "Lưu tất cả thay đổi" }),
        page.getByRole("link", { name: "← Danh sách lần nhập" }),
        // M12-C — nút tải file lỗi/kết quả nằm cùng hàng với liên kết quay lại.
        page.getByRole("link", { name: "Tải file lỗi / kết quả" }),
      ]) {
        const box = await control.boundingBox();
        expect(box, `điều khiển phải hiện ra ở ${testInfo.project.name}`).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });
});

/**
 * M12-C — file lỗi/kết quả (TO-BE 5) và hai cái trần (TO-BE 8).
 *
 * 🔴 Bộ này tách riêng khỏi bộ trên vì **một bài trong đây đăng nhập bằng vai
 * trò khác** (SEC-04b dùng Giáo lý viên lớp), mà `beforeEach` của bộ trên đăng
 * nhập sẵn bằng Thư ký. Trộn hai thứ vào một bộ là cách nhanh nhất để một bài
 * chạy dưới đúng phiên mà nó sinh ra để chứng minh là **không** được phép có.
 */
test.describe("M12-C · file lỗi/kết quả và giới hạn file", () => {
  test.describe.configure({ timeout: 90_000 });

  test("TO-BE 8: biểu mẫu nói ra CẢ HAI giới hạn trước khi người dùng chọn file", async ({
    page,
  }) => {
    await login(page, SECRETARY);
    await page.goto("/imports");
    // Nói trước, không nói sau: mạng phòng học chậm, và chờ hết một lượt tải để
    // biết là vô ích chính là thứ TO-BE 8 sinh ra để bỏ.
    await expect(page.getByText(/tối đa 4 MB và 1\.000 dòng/)).toBeVisible();
  });

  /**
   * 🔴 **SEC-12 — bài này TRƯỚC ĐÂY KHÔNG THỂ VIẾT ĐƯỢC** vì hệ thống không có
   * giới hạn số dòng nào. `08_ACCEPTANCE_CRITERIA` §C xếp nó vào nhóm *"phải
   * xanh"* và ghi thẳng *"hiện chưa có giới hạn số dòng"*.
   *
   * Dùng 1.001 dòng chứ không phải 100.000: cả hai đi cùng một nhánh mã, mà bài
   * test thì chạy ba lần trên ba viewport chung một database.
   */
  test("🔴 SEC-12: file vượt trần 1.000 dòng bị từ chối bằng câu tiếng Việt", async ({
    page,
  }, testInfo) => {
    await login(page, SECRETARY);
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      name: `Test Qua Dong ${suffix} ${index}`,
      dob: "05/05/2016",
      phone: `09${String(10_000_000 + index).slice(0, 8)}`,
    }));

    await uploadWorkbook(page, `M12C-qua-dong-${testInfo.project.name}.xlsx`, await buildWorkbook(rows));

    const message = page.getByRole("form", { name: "Tải file Excel lên" }).getByRole("alert");
    await expect(message).toBeVisible({ timeout: 45_000 });
    await expect(message).toContainText("1.001 dòng");
    await expect(message).toContainText("mỗi sổ lớp một file");
    // Không tạo lần nhập nào ⇒ vẫn đứng nguyên ở trang tải lên.
    await expect(page).toHaveURL(/\/imports$/);
  });

  /**
   * AC-22 + AC-23 + BR-M12-38 — tải file thật về rồi **mở nó ra kiểm**.
   *
   * 🔴 Dòng đầu tiên mang tên `=cmd|'/c calc'!A1`. Đây là dữ liệu người dùng đi
   * trọn vòng: từ ô Excel tải lên → cơ sở dữ liệu → ô Excel tải về. Unit test
   * canh hàm dựng workbook; bài này canh **cả đường ống**, tức đúng chỗ một ô
   * lọt ra ngoài bộ chặn mà không hàm nào báo sai.
   */
  test("🔴 AC-22 · AC-23: tải được file hai sheet, và ô độc bị vô hiệu", async ({
    page,
  }, testInfo) => {
    await login(page, SECRETARY);
    const filename = `M12C-bao-cao-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbook([
      { name: `=cmd|'/c calc'!A1 ${suffix}`, dob: "08/08/2016", phone: "0900224401" },
      { name: `Test Bao Cao ${suffix}`, dob: "09/09/2016", phone: "0900224402" },
    ]);

    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      const batchId = page.url().split("/").pop()!;

      const download = page.getByRole("link", { name: "Tải file lỗi / kết quả" });
      await expect(download).toBeVisible();
      await expect(download).toHaveAttribute("href", `/imports/${batchId}/errors`);

      // `page.request` dùng chung kho cookie của context ⇒ vẫn là phiên Thư ký.
      const response = await page.request.get(`/imports/${batchId}/errors`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("spreadsheetml.sheet");

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(
        (await response.body()) as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
      expect(workbook.getWorksheet("LOI")).toBeTruthy();
      const results = workbook.getWorksheet("KET_QUA");
      expect(results).toBeTruthy();
      // Hai dòng dữ liệu + một hàng tiêu đề.
      expect(results!.actualRowCount).toBe(3);

      const names = [2, 3].map((row) => String(results!.getRow(row).getCell(2).value ?? ""));
      const poisoned = names.find((name) => name.includes("/c calc"));
      expect(poisoned, "tên độc phải có mặt trong file kết quả").toBeTruthy();
      expect(poisoned!.startsWith("'")).toBe(true);
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }
  });

  /**
   * 🔴 **SEC-04b** — route handler **không** đi qua `ROUTE_RULES` của middleware
   * như một trang, nên hàng rào trong chính route là hàng rào duy nhất ở tầng
   * ứng dụng. Không có nó thì Giáo lý viên lớp tải được một file rỗng hợp lệ
   * (RLS trả 0 dòng) và tưởng lần nhập không có dòng nào.
   */
  test("🔴 SEC-04b: Giáo lý viên lớp không tải được file kết quả", async ({ page }, testInfo) => {
    await login(page, SECRETARY);
    const filename = `M12C-sec-${testInfo.project.name}.xlsx`;
    const suffix = testInfo.project.name.replace(/[^a-z0-9]/gi, "");
    const content = await buildWorkbook([
      { name: `Test Sec ${suffix}`, dob: "10/10/2016", phone: "0900224411" },
    ]);

    let batchId = "";
    try {
      await uploadWorkbook(page, filename, content);
      await page.waitForURL(/\/imports\/[0-9a-f-]{36}$/, { timeout: 45_000 });
      batchId = page.url().split("/").pop()!;
    } finally {
      await cancelOpenBatch(page).catch(() => {});
    }

    await login(page, CLASS_TEACHER);
    const response = await page.request.get(`/imports/${batchId}/errors`);
    expect(response.status()).toBe(403);
    expect(await response.text()).toContain("không có quyền nhập dữ liệu Excel");
  });
});
