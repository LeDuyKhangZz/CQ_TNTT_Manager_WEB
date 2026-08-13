import { expect, test, type Page } from "@playwright/test";

/**
 * M08-A — bảng chuyển lớp `/promotions` sau khi thiết kế lại (**TO-BE 1 /
 * AC-12 · AC-13**), và ranh giới quyền của module (**SEC-01 · SEC-02**).
 *
 * 🔴 **Toàn bộ file này KHÔNG GHI một dòng nào vào cơ sở dữ liệu**, và đó là
 * chủ ý chứ không phải thiếu sót:
 *
 *   · Ba viewport dùng chung một database (`workers: 1`), và `promotion_reviews`
 *     **không có đường xoá** — bảng chỉ `grant select`, mọi lượt ghi đi qua RPC
 *     và không RPC nào xoá (BR-M08-Y2). Một bài ghi ở đây là **không dọn lại
 *     được**, đúng cái bẫy nợ #10 vế (b) mà M02-C đã đo.
 *   · ⚠️ **Và `seed:dev` một mình KHÔNG dựng nổi đường ghi của module.** Một đề
 *     xuất "lên lớp" cần lớp đích thuộc **năm học bắt đầu SAU** năm nguồn
 *     (BR-M08-07), mà `seed-dev.mjs` chỉ tạo lớp cho đúng một năm — 2026-2027 —
 *     cộng hai năm đã đóng **không có lớp nào**. Đường ghi vì thế được kiểm ở
 *     `results.spec.ts`, nơi fixture tự dựng thêm năm 2027-2028 và một lớp đích
 *     cho mỗi viewport: bài ấy chạy hết AC-01 (đề xuất) → AC-04 (duyệt nguyên
 *     tử) rồi **đọc thẳng cơ sở dữ liệu** để chứng minh giao dịch. Không lặp lại
 *     ở đây; file này lo phần TO-BE 1 mà bài kia không chạm tới.
 */
const DEV_PASSWORD = "123456";

/** Xứ đoàn trưởng — ghi toàn cục, thấy mọi lớp (`app.can_global_write`). */
const GROUP_LEADER = "GLV901";
/** Thủ quỹ — SEC-01: không được vào `/promotions` (`route-map.ts:60`). */
const TREASURER = "GLV904";
/** Trưởng ngành Ấu — duyệt được đúng ngành mình. */
const SECTOR_LEADER_AU = "GLV905";
/** Giáo lý viên đại diện lớp Ấu 1A — đề xuất được đúng lớp mình. */
const REPRESENTATIVE_AU_1A = "GLV909";
/** Giáo lý viên lớp (KHÔNG phải đại diện) — AC-03: không đề xuất được. */
const CLASS_TEACHER_AU_1A = "GLV910";

/** `seed:dev` — lớp DUY NHẤT có thiếu nhi, và em này nằm ở đó. */
const SEEDED_CLASS = "Ấu 1A";
const SEEDED_STUDENT = "Nguyễn Minh An";

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

function rosterRows(page: Page) {
  return page.getByRole("table", { name: /Danh sách thiếu nhi/ }).locator("tbody tr");
}

test.describe("TO-BE 1 · bảng tiến độ theo lớp", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, GROUP_LEADER);
  });

  test("AC-12: trang mở ra có bảng tiến độ với đủ bốn cột trạng thái", async ({ page }) => {
    await page.goto("/promotions");
    const progress = page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ });
    await expect(progress).toBeVisible({ timeout: 20_000 });
    // 🔴 Kiểm bằng CHỮ chứ không bằng vai trò `columnheader`, và đó không phải
    // sự lười: từ 360px trở xuống `<thead>` bị ẩn hẳn (`hidden sm:table-header-group`)
    // còn nhãn đi vào từng ô dưới dạng `<span sm:hidden>`. Người dùng ở cả ba
    // viewport đều **đọc được** năm chữ này; chỉ có phần tử mang chúng là khác.
    // Kiểm `columnheader` sẽ đỏ ở mobile với một lý do vô nghĩa.
    for (const heading of ["Sĩ số", "Chưa đề xuất", "Chờ duyệt", "Đã duyệt", "Từ chối"]) {
      await expect(progress).toContainText(heading);
    }
  });

  test("bảng tiến độ nêu ĐÚNG TÊN LỚP, không phải một con số trần", async ({ page }) => {
    await page.goto("/promotions");
    const progress = page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ });
    await expect(progress.getByRole("link", { name: SEEDED_CLASS })).toBeVisible({ timeout: 20_000 });
  });

  test("BR-M08-14: trang nói rõ đang xem ghi danh của năm học nào", async ({ page }) => {
    // Bản cũ đọc MỌI năm học (BR-M08-Y3) mà không nói gì — đề xuất đã duyệt của
    // các năm trước tích tụ mãi trên cùng màn hình với việc đang phải làm.
    await page.goto("/promotions");
    await expect(page.getByText(/Ghi danh của năm học/)).toBeVisible({ timeout: 20_000 });
  });

  test("bấm một con số trong bảng tiến độ dẫn thẳng vào đúng lớp ở đúng trạng thái", async ({
    page,
  }) => {
    await page.goto("/promotions");
    const progress = page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ });
    const row = progress.getByRole("row").filter({ hasText: SEEDED_CLASS });
    await expect(row).toBeVisible({ timeout: 20_000 });
    // Ô "Chưa đề xuất" của lớp có thiếu nhi phải là một liên kết thật.
    const cell = row.getByRole("link").nth(1);
    await expect(cell).toHaveAttribute("href", /classId=.*status=not_proposed/);
  });
});

test.describe("TO-BE 1 · lọc, tìm, phân trang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, GROUP_LEADER);
  });

  test("AC-12: chọn lớp và trạng thái thì trạng thái nằm TRÊN URL, chia sẻ được", async ({
    page,
  }) => {
    await page.goto("/promotions");
    const filters = page.getByRole("group", { name: "Lọc danh sách chuyển lớp" });
    await filters.getByLabel("Lớp", { exact: true }).selectOption({ label: SEEDED_CLASS });
    await filters.getByLabel("Trạng thái").selectOption("not_proposed");
    // 🔴 `exact: true` là **bắt buộc từ M08-C**, không phải một chi tiết trang
    // trí: phép khớp tên của `getByRole` mặc định là **chứa chuỗi, không phân
    // biệt hoa thường**, nên từ khi thanh hàng loạt có nút *"Chọn tất cả N em
    // khớp bộ lọc"* thì `name: "Lọc"` khớp **hai** nút và Playwright dừng ở chế
    // độ nghiêm ngặt. Ứng dụng không hỏng — bộ định vị mơ hồ.
    await page.getByRole("button", { name: "Lọc", exact: true }).click();

    await expect(page).toHaveURL(/classId=/, { timeout: 20_000 });
    await expect(page).toHaveURL(/status=not_proposed/);
    await expect(page.getByText(/Đang xem lớp Ấu 1A/)).toBeVisible({ timeout: 20_000 });
  });

  test("tìm tên KHÔNG DẤU vẫn ra em", async ({ page }) => {
    await page.goto("/promotions?q=nguyen+minh+an");
    // Neo vào DÒNG chứ không vào ô: nút mở panel mang nhãn *"Mở chi tiết của
    // {tên em}"* cho trình đọc màn hình, nên một phép tìm theo tên khớp **hai**
    // ô trong cùng một dòng. Đếm dòng cũng chặt hơn — nó khẳng định luôn rằng
    // bộ lọc đã loại những em khác, không chỉ rằng em này có mặt.
    await expect(rosterRows(page).filter({ hasText: SEEDED_STUDENT })).toHaveCount(1, {
      timeout: 20_000,
    });
  });

  test("không khớp gì thì nói 'không có em nào khớp bộ lọc', không nói 'chưa có ghi danh'", async ({
    page,
  }) => {
    // Hai câu khác nhau cho hai tình huống khác nhau (`09` §9): nói "chưa có ghi
    // danh nào" trong lúc đang lọc là dẫn người dùng đi tìm sai chỗ.
    await page.goto("/promotions?q=khongcoemnaotenlathenay");
    await expect(page.getByText("Không có em nào khớp bộ lọc")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Xoá bộ lọc" })).toBeVisible();
  });

  test("classId lạ trong đường dẫn KHÔNG cho trang 500, mà hiện lại bộ chọn kèm lời giải thích", async ({
    page,
  }) => {
    // TO-BE 1 "Validation". Hai ca — lớp không tồn tại và lớp không đọc được —
    // cố ý trả lời **giống hệt nhau**: phân biệt là biến đường dẫn thành một cái
    // máy dò xem lớp nào có thật.
    await page.goto("/promotions?classId=99999999-9999-4999-8999-999999999999");
    await expect(page.getByText(/không nằm trong phạm vi bạn phụ trách/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ })).toBeVisible();
  });

  test("classId rác (không phải UUID) cũng không cho trang 500", async ({ page }) => {
    // `AGENTS` §5 — "Invalid UUID trả 404/validation error, không 500". Ở đây
    // tham số bị bỏ qua hoàn toàn nên trang hiện bình thường.
    await page.goto("/promotions?classId=%27%3B+drop+table+--&page=-4");
    await expect(page.getByRole("heading", { name: "Lên lớp và chuyển lớp" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ })).toBeVisible();
  });

  test("dấu trang cũ ?page=99 rơi về trang cuối, không cho một trang trống không giải thích", async ({
    page,
  }) => {
    await page.goto("/promotions?page=99");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("panel chi tiết", () => {
  test("đóng sẵn, mở ra mới thấy biểu mẫu — 25 em không đổ 25 cặp biểu mẫu vào trang", async ({
    page,
  }) => {
    await login(page, REPRESENTATIVE_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Ghi chú đại diện")).toHaveCount(0);

    await page.getByRole("button", { name: /Mở chi tiết của/ }).first().click();
    await expect(page.getByLabel("Ghi chú đại diện").first()).toBeVisible({ timeout: 20_000 });
  });

  test("AC-03: Giáo lý viên lớp (không phải đại diện) KHÔNG thấy biểu mẫu đề xuất", async ({
    page,
  }) => {
    await login(page, CLASS_TEACHER_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Mở chi tiết của/ }).first().click();
    await expect(page.getByRole("button", { name: /Gửi đề xuất/ })).toHaveCount(0);
  });

  test("Trưởng ngành Ấu thấy lớp ngành mình và KHÔNG thấy lớp ngành khác", async ({ page }) => {
    await login(page, SECTOR_LEADER_AU);
    await page.goto("/promotions");
    const progress = page.getByRole("table", { name: /Số thiếu nhi theo từng trạng thái/ });
    await expect(progress).toBeVisible({ timeout: 20_000 });
    await expect(progress.getByRole("link", { name: SEEDED_CLASS })).toBeVisible();
    // Ca âm tính: lớp ngành Thiếu phải không có mặt. RLS là hàng rào thật —
    // `enrollments_select_scope` đã thu danh sách trước khi một dòng nào tới UI.
    await expect(progress.getByRole("link", { name: "Thiếu 1A" })).toHaveCount(0);
  });
});

/**
 * **M08-B · D-159 — một nút "Chuyển lớp" cho bốn vai trò cấp xứ đoàn.**
 *
 * ⚠️ Vẫn **không ghi một dòng nào**, đúng luật của file này (xem đầu file). Bài
 * dưới đây đi tới **hộp xác nhận rồi bấm Huỷ** — tức nó phủ đúng phần D-159 nói
 * là quan trọng (*"hỏi lại một lần"*) mà không để lại một đề xuất không xoá được.
 *
 * 🔴 Cố ý chọn trạng thái **"Tạm nghỉ"**, và lý do là một ràng buộc thật của dữ
 * liệu chứ không phải tiện tay: đề xuất *"lên lớp"* cần một lớp đích thuộc **năm
 * học bắt đầu sau** (BR-M08-07), mà `seed:dev` chỉ dựng đúng một năm — nên ô "Lớp
 * đích" là một ô `required` **không có lựa chọn nào**, và trình duyệt sẽ chặn lượt
 * gửi trước khi mã của trang chạy tới. "Tạm nghỉ" không có lớp đích nên đi thẳng
 * tới hộp xác nhận.
 */
test.describe("M08-B · D-159 · nút Chuyển lớp một bước", () => {
  test("cấp xứ đoàn thấy nút MỘT BƯỚC, và trang nói ra rằng nó vừa đề xuất vừa duyệt", async ({
    page,
  }) => {
    await login(page, GROUP_LEADER);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Mở chi tiết của/ }).first().click();

    await expect(page.getByRole("button", { name: "Chuyển lớp" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" })).toHaveCount(0);
    await expect(page.getByText(/vừa đề xuất vừa duyệt/)).toBeVisible();
  });

  test("bấm Chuyển lớp KHÔNG chuyển ngay — hộp xác nhận nêu tên em rồi Huỷ được", async ({
    page,
  }) => {
    await login(page, GROUP_LEADER);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Mở chi tiết của/ }).first().click();

    await page.getByLabel("Đề xuất", { exact: true }).selectOption("temporarily_pause");
    await page.getByRole("button", { name: "Chuyển lớp" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(dialog).toContainText(SEEDED_STUDENT);
    // Nhãn nút nói ra **việc sắp làm**, không phải "Đồng ý" chung chung.
    await expect(dialog.getByRole("button", { name: "Chuyển sang Tạm nghỉ" })).toBeVisible();

    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toHaveCount(0);
    // Ca âm tính quan trọng nhất của bài: huỷ xong **không có gì được ghi**, nên
    // em vẫn ở trạng thái "Chưa đề xuất".
    await expect(rosterRows(page).filter({ hasText: SEEDED_STUDENT })).toContainText(
      "Chưa đề xuất",
    );
  });

  test("Giáo lý viên đại diện KHÔNG có đường một bước — vẫn là hai bước như cũ", async ({
    page,
  }) => {
    await login(page, REPRESENTATIVE_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Mở chi tiết của/ }).first().click();

    await expect(page.getByRole("button", { name: "Gửi đề xuất cho Trưởng ngành" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Chuyển lớp" })).toHaveCount(0);
  });
});

/**
 * **M08-C — ba nợ cuối của module: AC-14 · AC-15 · AC-20.**
 *
 * ⚠️ Vẫn **không ghi một dòng nào**, đúng luật của file này (xem đầu file). Ba
 * bài dưới đây đi tới **hộp xác nhận rồi Huỷ**, hoặc dừng ở đúng câu lỗi — tức
 * phủ đúng phần mà cả ba tiêu chí nói là quan trọng (*"chỉ khi tôi xác nhận thì
 * action mới chạy"* · *"server cũng từ chối"* · *"xem lại trước khi xác nhận"*)
 * mà không để lại một đề xuất không xoá được.
 *
 * 🔴 Phần **"Duyệt"** không đo được bằng `seed:dev`: nó cần một đề xuất đang chờ,
 * mà tạo một đề xuất ở đây là ghi. Hộp xác nhận của "Duyệt" vì thế được đo ở
 * `promotion-board.test.tsx` (5 bài, có cả ca người duyệt đổi lớp đích) và đường
 * ghi trọn vẹn nằm ở `results.spec.ts`. Nói ra khoảng trống này thay vì để nó
 * lặng lẽ — đúng bài học đã ghi ở đầu file.
 */
test.describe("M08-C · đề xuất hàng loạt (AC-20)", () => {
  test("thanh hàng loạt nói ra con số của CẢ BỘ LỌC ngay trên nút, trước khi bấm", async ({
    page,
  }) => {
    await login(page, REPRESENTATIVE_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Chọn tất cả \d+ em khớp bộ lọc/ }))
      .toBeVisible();
  });

  test("🔴 chọn tất cả rồi bấm gửi KHÔNG gửi ngay — hộp xem lại liệt kê tên từng em", async ({
    page,
  }) => {
    await login(page, REPRESENTATIVE_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });

    // "Tạm nghỉ" — không cần lớp đích, nên không vướng ràng buộc "lớp đích phải
    // thuộc năm học sau" mà `seed:dev` không dựng nổi (xem ghi chú ở D-159).
    await page.getByLabel("Đề xuất chung").selectOption("temporarily_pause");
    await page.getByRole("button", { name: /Chọn tất cả \d+ em khớp bộ lọc/ }).click();
    await page.getByRole("button", { name: /Xem lại và gửi \d+ đề xuất/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    // `11` §5 — hậu quả nêu bằng TÊN RIÊNG, không phải một con số.
    await expect(dialog).toContainText(SEEDED_STUDENT);

    await dialog.getByRole("button", { name: /Huỷ/ }).click();
    await expect(dialog).toHaveCount(0);
    // Ca âm tính quan trọng nhất: huỷ xong không có gì được ghi.
    await expect(rosterRows(page).filter({ hasText: SEEDED_STUDENT })).toContainText(
      "Chưa đề xuất",
    );
  });

  test("người KHÔNG được đề xuất không thấy thanh hàng loạt", async ({ page }) => {
    // Giáo lý viên lớp đọc được danh sách (AC-03 cho họ xem, không cho ghi), nên
    // đây là ca đo đúng ranh giới: có dòng, không có ô tick.
    await login(page, CLASS_TEACHER_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /Chọn tất cả/ })).toHaveCount(0);
  });
});

test.describe("ranh giới quyền", () => {
  test("SEC-01: Thủ quỹ mở /promotions bị đưa về /access-denied", async ({ page }) => {
    await login(page, TREASURER);
    await page.goto("/promotions");
    await expect(page).toHaveURL(/\/access-denied$/, { timeout: 20_000 });
  });

  test("SEC-02: chưa đăng nhập thì về /login, không lộ nội dung trang", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/promotions");
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Lên lớp và chuyển lớp" })).toHaveCount(0);
  });
});

test.describe("đo tại chỗ trên ba viewport", () => {
  // `responsive.spec.ts` quét `/promotions` ở trạng thái **đóng**. Bài dưới đây
  // đo đúng trạng thái nó không với tới: **panel chi tiết đang mở**, tức lúc
  // trang có hai biểu mẫu và một bảng cùng lúc. Bài học nợ #20: mỗi module tự đo
  // trang của mình, đừng chờ `responsive.spec.ts`.
  test("panel mở ra không làm tràn ngang, và nút mở panel đạt vùng chạm 44px", async ({ page }) => {
    await login(page, REPRESENTATIVE_AU_1A);
    await page.goto("/promotions");
    await expect(rosterRows(page).first()).toBeVisible({ timeout: 20_000 });

    const toggle = page.getByRole("button", { name: /Mở chi tiết của/ }).first();
    // Đo CHIỀU CAO THẬT ĐÃ DỰNG chứ không kiểm tên lớp CSS — một chuỗi `min-h-11`
    // viết đúng vẫn có thể bị lớp khác đè, và bài kiểm tên lớp sẽ xanh giả
    // (bài học M05-A).
    const box = await toggle.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await toggle.click();
    await expect(page.getByLabel("Ghi chú đại diện").first()).toBeVisible({ timeout: 20_000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `/promotions với panel mở tràn ngang ${overflow}px`).toBeLessThanOrEqual(1);
  });
});
