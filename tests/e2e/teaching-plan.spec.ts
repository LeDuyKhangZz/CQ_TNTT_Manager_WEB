import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Database } from "../../src/types/database";

const DEV_PASSWORD = "123456";
const PROJECT_DATE: Record<string, string> = {
  "mobile-360": "2026-09-02",
  "tablet-768": "2026-09-03",
  "laptop-1366": "2026-09-04",
};

let adminClient: SupabaseClient<Database> | null = null;

function getLocalAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
    throw new Error("E2E giáo án chỉ được chạy với Supabase local và service role key.");
  }
  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

async function login(page: Page, username: string) {
  // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu
  // (đo được: 6 test rớt vì chờ mãi ô "Tên đăng nhập"). Trong ứng dụng thật,
  // đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức năng đăng xuất vừa được
  // thêm ở A-01, trước đó chưa hề tồn tại nên các spec mới phải làm vòng này.
  // Xoá cookie là cách diễn đạt đúng ý "bắt đầu như một người mới trên máy
  // sạch"; mỗi context là độc lập nên không đụng tới phiên của context khác
  // (bài tranh chấp/tiếp quản ở attendance dùng hai context riêng).
  await page.context().clearCookies();
  await page.goto("/login");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("Tên đăng nhập").fill(username);
    await page.locator("input#password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/dashboard$/);
      return;
    } catch {
      await page.goto("/login");
    }
  }
  throw new Error(`Không đăng nhập được bằng ${username}. Đã chạy seed:dev chưa?`);
}

/** Hạng mục #12 / **UI-01** — bộ giáo án trước M06-A chưa từng đo tràn ngang. */
async function expectNoHorizontalOverflow(page: Page, where: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "attached" });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflows, `${where} không được tràn ngang`).toBe(false);
}

async function setupPlan(testInfo: TestInfo) {
  const admin = getLocalAdmin();
  const plannedDate = PROJECT_DATE[testInfo.project.name];
  if (!plannedDate) throw new Error(`Thiếu ngày riêng cho project ${testInfo.project.name}`);
  const { data: year } = await admin.from("academic_years").select("id").eq("status", "current").single();
  const { data: classRow } = await admin.from("classes").select("id").eq("display_name", "Ấu 1A").eq("academic_year_id", year!.id).single();
  const { data: plan, error: planError } = await admin
    .from("teaching_plans")
    .upsert({ class_id: classRow!.id, academic_year_id: year!.id, title: "Kế hoạch giảng dạy Ấu 1A" }, { onConflict: "class_id" })
    .select("id")
    .single();
  if (planError || !plan) throw new Error(`Không chuẩn bị được giáo án E2E: ${planError?.message}`);

  const { data: oldItems } = await admin
    .from("teaching_plan_items")
    .select("id, material_path")
    .eq("teaching_plan_id", plan.id)
    .eq("planned_date", plannedDate);
  for (const item of oldItems ?? []) {
    if (item.material_path) await admin.storage.from("teaching-materials").remove([item.material_path]);
  }
  await admin.from("teaching_plan_items").delete().eq("teaching_plan_id", plan.id).eq("planned_date", plannedDate);
  return { admin, classId: classRow!.id, plannedDate };
}

test.describe("Giáo án Phase 4", () => {
  test.describe.configure({ timeout: 120_000 });

  test("đại diện CRUD + private material; GLV đọc; portal chỉ thấy trường an toàn", async ({ page }, testInfo) => {
    const { admin, classId, plannedDate } = await setupPlan(testInfo);
    const suffix = testInfo.project.name;
    const title = `Bài E2E ${suffix}`;
    const preparation = `Chuẩn bị E2E ${suffix}`;
    const restricted = `Mục tiêu nội bộ ${suffix}`;
    const fileName = `tai-lieu-${suffix}.txt`;

    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    await expectNoHorizontalOverflow(page, "trang giáo án lớp");

    /**
     * M06-C · #8 — biểu mẫu 12 trường nay nằm trong hộp thoại (trên 360px là một
     * lớp trượt từ đáy lên, đúng "form drawer" của `docs/06` §11), và hai nhóm
     * trường ít dùng gập sẵn. Bài này đi qua đúng đường người dùng thật đi: mở
     * hộp thoại, mở nhóm nội dung, rồi mới điền.
     */
    await page.getByRole("button", { name: "Thêm mục giáo án" }).click();
    const addDialog = page.getByRole("dialog");
    await expect(addDialog).toBeVisible();
    const addForm = addDialog.locator("form");
    await addForm.getByLabel('Ngày dự kiến').fill(plannedDate);
    await addForm.locator('input[name="title"]').fill(title);
    await addDialog.locator("summary").filter({ hasText: "Nội dung buổi học" }).click();
    await addForm.locator('textarea[name="objectives"]').fill(restricted);
    await addForm.locator('textarea[name="preparation"]').fill(preparation);
    const teacherValue = await addForm.locator('select[name="teacherStaffId"] option:not([value=""])').first().getAttribute("value");
    expect(teacherValue).toBeTruthy();
    await addForm.locator('select[name="teacherStaffId"]').selectOption(teacherValue!);
    await addForm.getByRole("button", { name: "Thêm vào giáo án" }).click();

    // 🔴 Hộp thoại thêm mục CỐ Ý ở lại sau khi lưu: đóng ngay thì câu xác nhận
    // bị chính lượt đóng nó xoá mất (lỗi M05-B đã trả giá một lần), và soạn giáo
    // án là việc thêm nhiều mục liên tiếp.
    await expect(addDialog.getByText("Đã thêm mục giáo án.")).toBeVisible();
    await addDialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(addDialog).toHaveCount(0);

    const itemCard = page.locator("[data-teaching-plan-item]").filter({ hasText: title });
    await expect(itemCard).toBeVisible();
    await expect(itemCard.getByText(restricted, { exact: true })).toBeVisible();
    await itemCard.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: "text/plain",
      buffer: Buffer.from(`Nội dung tài liệu ${suffix}`, "utf8"),
    });
    await itemCard.getByRole("button", { name: "Lưu tài liệu" }).click();
    /**
     * 🔴 Khẳng định bằng **nút "Gỡ tệp"**, không bằng tên tệp hiện trên màn hình.
     *
     * Từ M06-A ô chọn tệp là `FileUpload` của design system, và nó hiện dòng
     * *"Đã chọn: tai-lieu-….txt"* ngay khi người dùng vừa chọn — tức **trước**
     * khi bấm Lưu. Bài cũ tìm tên tệp bằng biểu thức nên nó khớp đúng dòng ấy
     * và **xanh kể cả khi lượt lưu thất bại hoàn toàn**. Nút "Gỡ tệp" và
     * "Tải xuống" chỉ dựng khi `material_name` đã có trong cơ sở dữ liệu, nên
     * đó mới là bằng chứng của việc lưu.
     */
    await expect(itemCard.getByRole("button", { name: "Gỡ tệp" })).toBeVisible();
    await expect(itemCard.getByRole("button", { name: "Tải xuống" })).toBeVisible();
    await expect(itemCard.getByText("Chưa đính kèm tài liệu.")).toHaveCount(0);
    const itemId = await itemCard.getAttribute("data-teaching-plan-item");
    expect(itemId).toBeTruthy();

    // GLV thành viên đọc được toàn bộ giáo án và tải qua signed URL, nhưng không sửa.
    await login(page, "GLV910");
    await page.goto(`/teaching-plan/${classId}`);
    const readOnlyCard = page.locator(`[data-teaching-plan-item="${itemId}"]`);
    await expect(readOnlyCard.getByText(restricted, { exact: true })).toBeVisible();
    await expect(readOnlyCard.getByRole("button", { name: "Sửa" })).toHaveCount(0);
    const downloadPromise = page.waitForEvent("download");
    await readOnlyCard.getByRole("button", { name: "Tải xuống" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(fileName);

    // Portal không được nhận mục tiêu nội bộ hay tài liệu, chỉ lịch tuần an toàn.
    await login(page, "84912000001");
    await page.goto("/teaching-plan");
    await expectNoHorizontalOverflow(page, "cổng phụ huynh · /teaching-plan");
    await expect(page.getByRole("heading", { name: "7 ngày sắp tới" })).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByText(preparation, { exact: true })).toBeVisible();
    await expect(page.getByText(restricted, { exact: true })).toHaveCount(0);
    await expect(page.getByText(new RegExp(fileName))).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Giáo án theo lớp" })).toHaveCount(0);
    // M06-A / TB-M06-05 — mô tả đầu trang nay nói đúng thứ cổng thật sự có.
    await expect(page.getByText("Lịch học 7 ngày tới của con")).toBeVisible();

    /**
     * 🔴 **TB-07 — phụ huynh gõ thẳng địa chỉ trang quản trị phải nhận 404.**
     *
     * Trước M06-A, `route-map` không giới hạn vai trò cho `/teaching-plan` (đúng,
     * vì cổng dùng chung địa chỉ gốc cho lịch 7 ngày), nên `/teaching-plan/{id}`
     * vẫn dựng ra khung trang quản trị: tên lớp thật (bảng `classes` đọc rộng),
     * hai nút đổi kiểu hiển thị, và câu *"Giáo án chưa có bài dạy hoặc bài kiểm
     * tra."* — RLS đã lọc sạch dữ liệu nên không rò rỉ gì, nhưng câu cuối là một
     * lời nói dối về một giáo án đang có đầy bài.
     */
    await page.goto(`/teaching-plan/${classId}`);
    await expect(page.getByRole("heading", { name: /^Giáo án Ấu 1A$/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Danh sách" })).toHaveCount(0);
    await expect(page.getByText("Giáo án chưa có bài dạy hoặc bài kiểm tra.")).toHaveCount(0);

    // Gỡ tệp qua UI và xác nhận Storage API đã xóa object vật lý.
    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    const editableCard = page.locator(`[data-teaching-plan-item="${itemId}"]`);
    /**
     * M06-C · #9 / **nợ #1** — không còn `page.once("dialog")`: hộp xác nhận nay
     * là `ConfirmDialog` của design system, và nó nêu **tên tệp** — thứ
     * `window.confirm` cũ có nói, cộng thêm điều nó im lặng hoàn toàn: tệp bị
     * xoá khỏi kho lưu trữ chứ không chỉ gỡ liên kết.
     */
    await editableCard.getByRole("button", { name: "Gỡ tệp", exact: true }).click();
    const removeConfirm = page.getByRole("dialog");
    await expect(removeConfirm.getByText(new RegExp(fileName))).toBeVisible();
    await removeConfirm.getByRole("button", { name: "Gỡ tài liệu này" }).click();
    await expect(editableCard.getByText("Chưa đính kèm tài liệu.")).toBeVisible();
    // Ô chọn tệp mang `disabled={pending}`; đặt tệp vào lúc nó còn vô hiệu là
    // đặt vào hư không.
    await expect(editableCard.locator('input[type="file"]')).toBeEnabled();
    const { data: objects } = await admin.storage.from("teaching-materials").list(`${classId}/${itemId}`);
    expect(objects ?? []).toHaveLength(0);

    // Xóa cả item khi đang có tệp cũng phải dọn object, không để orphan.
    await editableCard.locator('input[type="file"]').setInputFiles({
      name: `delete-${fileName}`,
      mimeType: "text/plain",
      buffer: Buffer.from("Tệp phải được dọn cùng item", "utf8"),
    });
    await editableCard.getByRole("button", { name: "Lưu tài liệu" }).click();
    // Cùng lý do như lượt tải đầu: chờ bằng bằng chứng đã ghi (nút "Gỡ tệp"),
    // không bằng tên tệp — tên tệp hiện ngay lúc CHỌN, trước khi lưu.
    await expect(editableCard.getByRole("button", { name: "Gỡ tệp" })).toBeVisible();
    // 🔴 Và chờ nút "Xóa" thôi vô hiệu. Cả thanh nút dùng chung một cờ `pending`
    // của `useTransition`, mà cờ ấy chỉ hạ sau khi `router.refresh()` dựng xong
    // — bấm sớm là bấm vào một nút `disabled` rồi chờ hết giờ (đúng hình dạng
    // nợ #10, và ở đây nó là **lượt chờ thiếu của bài test**, không phải lỗi sản phẩm).
    await expect(editableCard.getByRole("button", { name: "Xóa", exact: true })).toBeEnabled();
    await editableCard.getByRole("button", { name: "Xóa", exact: true }).click();
    // 🔴 Hậu quả nêu bằng TÊN RIÊNG (`11` §5), và nêu cả điều `window.confirm` cũ
    // giấu mất: xoá mục là xoá luôn tệp đính kèm của nó.
    const deleteConfirm = page.getByRole("dialog");
    await expect(deleteConfirm.getByText(new RegExp(`delete-${fileName}`))).toBeVisible();
    await deleteConfirm.getByRole("button", { name: "Xóa mục này" }).click();
    await expect(page.locator(`[data-teaching-plan-item="${itemId}"]`)).toHaveCount(0);
    const { data: afterItemDelete } = await admin.storage.from("teaching-materials").list(`${classId}/${itemId}`);
    expect(afterItemDelete ?? []).toHaveLength(0);
  });

  /**
   * 🔴 **M06-B / D-146 / TB-01 — hai người cùng sửa một mục.**
   *
   * Trước đợt này `updateTeachingPlanItem` ghi đè cả 12 trường **chỉ theo `id`**,
   * nên người lưu sau xoá sạch thay đổi của người lưu trước: không cảnh báo, và
   * không có cách nào lấy lại vì bảng không có lịch sử.
   *
   * Bài này phải **CHẠY** mới chứng minh được, vì thứ nó kiểm là một phép so ở
   * cơ sở dữ liệu giữa hai lượt gửi cách nhau về thời gian. Người thứ nhất đóng
   * vai bằng service role — đây là **dàn dựng dữ liệu**, không phải kiểm phân
   * quyền bằng service role (`CLAUDE.md` §4): ranh giới quyền do pgTAP `043`
   * canh bằng JWT thật.
   */
  test("D-146 · TB-01 — lưu đè bản đã cũ bị chặn, công của người lưu trước còn nguyên", async ({ page }, testInfo) => {
    const { admin, classId, plannedDate } = await setupPlan(testInfo);
    const suffix = testInfo.project.name;

    const { data: plan } = await admin.from("teaching_plans").select("id").eq("class_id", classId).single();
    const { data: assignment } = await admin
      .from("class_staff_assignments")
      .select("staff_profile_id")
      .eq("class_id", classId)
      .eq("capacity", "representative")
      .eq("is_active", true)
      .limit(1)
      .single();
    const { data: item, error: itemError } = await admin
      .from("teaching_plan_items")
      .insert({
        teaching_plan_id: plan!.id,
        planned_date: plannedDate,
        title: `Bài gốc ${suffix}`,
        teacher_staff_id: assignment!.staff_profile_id,
        item_type: "lesson",
      })
      .select("id")
      .single();
    if (itemError || !item) throw new Error(`Không dựng được mục giáo án: ${itemError?.message}`);

    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    const card = page.locator(`[data-teaching-plan-item="${item.id}"]`);
    await expect(card).toBeVisible();
    // Trang đã tải xong ⇒ trình duyệt đang giữ phiên bản của LÚC NÀY.
    await card.getByRole("button", { name: "Sửa" }).click();

    // Người A lưu trước. Trigger `set_updated_at` đẩy phiên bản lên.
    const titleByA = `Người A đã sửa ${suffix}`;
    const { error: aError } = await admin
      .from("teaching_plan_items")
      .update({ title: titleByA })
      .eq("id", item.id);
    expect(aError, "lượt lưu của người A phải thành công").toBeNull();

    // Người B lưu sau, dựa trên bản đã cũ.
    await card.locator('input[name="title"]').fill(`Người B ghi đè ${suffix}`);
    await card.getByRole("button", { name: "Lưu thay đổi" }).click();

    await expect(card.getByText(/vừa được người khác cập nhật/)).toBeVisible();
    await expect(card.getByRole("button", { name: "Tải lại mục này" })).toBeVisible();

    // 🔴 Khẳng định quan trọng nhất: **cơ sở dữ liệu** vẫn giữ bản của người A.
    // Chỉ đọc thông báo trên màn hình thì chưa chứng minh được lượt ghi bị chặn.
    const { data: after } = await admin
      .from("teaching_plan_items")
      .select("title")
      .eq("id", item.id)
      .single();
    expect(after!.title).toBe(titleByA);

    await card.getByRole("button", { name: "Tải lại mục này" }).click();
    await expect(card.getByText(titleByA)).toBeVisible();
    await expect(card.getByRole("button", { name: "Lưu thay đổi" })).toHaveCount(0);
  });

  /**
   * **M06-B / D-144 — Thư ký chỉ còn XEM.**
   *
   * Ranh giới thật do pgTAP `043` canh bằng JWT thật. Bài này canh điều khác và
   * cũng cần thiết: màn hình **không mời họ làm** việc mà máy chủ sẽ từ chối —
   * `09` §10 gọi nút hiện ra rồi báo lỗi là ca tệ nhất của một lần siết quyền.
   * Và nó khẳng định phần ĐỌC không bị siết theo.
   */
  test("D-144 — Thư ký đọc được đầy đủ giáo án nhưng không thấy nút sửa nào", async ({ page }, testInfo) => {
    const { admin, classId, plannedDate } = await setupPlan(testInfo);
    const suffix = testInfo.project.name;

    const { data: plan } = await admin.from("teaching_plans").select("id").eq("class_id", classId).single();
    const { data: assignment } = await admin
      .from("class_staff_assignments")
      .select("staff_profile_id")
      .eq("class_id", classId)
      .eq("capacity", "representative")
      .eq("is_active", true)
      .limit(1)
      .single();
    const restricted = `Mục tiêu nội bộ D144 ${suffix}`;
    const { data: item } = await admin
      .from("teaching_plan_items")
      .insert({
        teaching_plan_id: plan!.id,
        planned_date: plannedDate,
        title: `Bài D144 ${suffix}`,
        objectives: restricted,
        teacher_staff_id: assignment!.staff_profile_id,
        item_type: "lesson",
      })
      .select("id")
      .single();

    await login(page, "GLV903");
    await page.goto(`/teaching-plan/${classId}`);
    await expectNoHorizontalOverflow(page, "trang giáo án lớp · Thư ký");

    const card = page.locator(`[data-teaching-plan-item="${item!.id}"]`);
    // ĐỌC vẫn đầy đủ, kể cả trường chỉ dành cho nhân sự.
    await expect(card.getByText(restricted, { exact: true })).toBeVisible();
    // GHI thì không còn một lối vào nào.
    await expect(card.getByRole("button", { name: "Sửa" })).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Xóa" })).toHaveCount(0);
    // M06-C — lối vào biểu mẫu soạn bài nay là một NÚT mở hộp thoại, không còn
    // là một khối luôn hiện trên trang.
    await expect(page.getByRole("button", { name: "Thêm mục giáo án" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Lưu tên" })).toHaveCount(0);
  });

  /**
   * 🔴 **M06-C · #8 — bài đo chính của đợt này, và nó phải chạy trên trình duyệt
   * thật.**
   *
   * Hai thứ không có cách nào kiểm bằng unit test: `<details>` đóng lại có thật
   * sự ẩn ô nhập không (jsdom **không** cài hành vi kích hoạt của `<details>`),
   * và một lớp nổi cao 90 % màn hình trên 360px có tràn ngang không.
   */
  test("M06-C · #8 — hộp thoại soạn bài: ô bắt buộc luôn mở, nhóm gập đủ 44px, không tràn ngang", async ({ page }, testInfo) => {
    const { classId } = await setupPlan(testInfo);
    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);

    await page.getByRole("button", { name: "Thêm mục giáo án" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectNoHorizontalOverflow(page, "hộp thoại soạn bài");

    /**
     * 🔴 Ba ô `required` **phải nằm ngoài mọi nhóm gập**: trình duyệt từ chối
     * lượt gửi kèm một ô `required` đang bị ẩn bằng lỗi *"An invalid form
     * control is not focusable"* — người dùng bấm Lưu và **không có gì xảy ra**,
     * không một câu nào giải thích.
     */
    await expect(dialog.locator('select[name="itemType"]')).toBeVisible();
    // Đợt C: ô ngày nay là ô chữ dd/MM/yyyy đeo nhãn, còn `name` thuộc về ô ẩn mang ISO.
    await expect(dialog.getByLabel('Ngày dự kiến')).toBeVisible();
    await expect(dialog.locator('input[name="title"]')).toBeVisible();
    await expect(dialog.locator('select[name="teacherStaffId"]')).toBeVisible();

    const contentGroup = dialog.locator("summary").filter({ hasText: "Nội dung buổi học" });
    await expect(contentGroup).toContainText("chưa điền");
    await expect(dialog.locator('textarea[name="objectives"]')).toBeHidden();

    const groupBox = await contentGroup.boundingBox();
    expect(groupBox, "tiêu đề nhóm phải đo được").not.toBeNull();
    expect(groupBox!.height, "tiêu đề nhóm gập phải cao ≥44px").toBeGreaterThanOrEqual(44);

    await contentGroup.click();
    await expect(dialog.locator('textarea[name="objectives"]')).toBeVisible();
    await expectNoHorizontalOverflow(page, "hộp thoại soạn bài · nhóm nội dung đã mở");

    // Dòng đếm đọc **thứ đang gõ dở**, không đọc dữ liệu đã lưu.
    await dialog.locator('textarea[name="objectives"]').fill("Mục tiêu tạm");
    await expect(contentGroup).toContainText("đã điền 1/7");

    // Nghiệm thu chung `11` §5 — `Escape` đóng được lớp nổi.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  /**
   * M06-A — vùng chạm và tràn ngang trên **trang chi tiết**.
   *
   * 🔴 Đo tại chỗ bằng `boundingBox()` chứ không chờ `responsive.spec.ts`: bộ
   * ấy chỉ quét **13 địa chỉ cấp một**, không có địa chỉ chi tiết nào — đúng lý
   * do M03-C và M05-A đã phải tự đo trang chi tiết của mình.
   */
  test("nợ #20 · vùng chạm 44px, không tràn ngang, và toggle có aria-current", async ({ page }, testInfo) => {
    const { classId } = await setupPlan(testInfo);
    await login(page, "GLV909");
    await page.goto(`/teaching-plan/${classId}`);
    await expectNoHorizontalOverflow(page, "trang giáo án lớp");

    const backLink = page.getByRole("link", { name: "← Danh sách lớp" });
    await expect(backLink).toBeVisible();
    const box = await backLink.boundingBox();
    expect(box, "link quay lại phải đo được").not.toBeNull();
    expect(box!.height, "link ← Danh sách lớp phải cao ≥44px").toBeGreaterThanOrEqual(44);

    // UI-04 — mục đang xem phải nói ra bằng thuộc tính, không chỉ bằng màu nút.
    const toggle = page.getByRole("group", { name: "Kiểu hiển thị" });
    await expect(toggle.getByRole("link", { name: "Danh sách" })).toHaveAttribute("aria-current", "page");
    await expect(toggle.getByRole("link", { name: "Theo tháng" })).not.toHaveAttribute("aria-current", "page");

    for (const name of ["Danh sách", "Theo tháng"]) {
      const control = toggle.getByRole("link", { name });
      const controlBox = await control.boundingBox();
      expect(controlBox, `nút "${name}" phải đo được`).not.toBeNull();
      expect(controlBox!.height, `nút "${name}" phải cao ≥44px`).toBeGreaterThanOrEqual(44);
    }

    await page.goto(`/teaching-plan/${classId}?view=calendar`);
    await expectNoHorizontalOverflow(page, "trang giáo án lớp · xem theo tháng");
    await expect(
      page.getByRole("group", { name: "Kiểu hiển thị" }).getByRole("link", { name: "Theo tháng" }),
    ).toHaveAttribute("aria-current", "page");

    // Hub cũng đo, vì `responsive.spec.ts` quét nó nhưng không đo vùng chạm.
    await page.goto("/teaching-plan");
    await expectNoHorizontalOverflow(page, "hub giáo án");
    await expect(page.getByRole("heading", { name: "7 ngày sắp tới" })).toBeVisible();
  });
});
