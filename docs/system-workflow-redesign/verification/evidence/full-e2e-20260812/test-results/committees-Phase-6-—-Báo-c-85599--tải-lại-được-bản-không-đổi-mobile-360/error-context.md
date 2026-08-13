# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: committees.spec.ts >> Phase 6 — Báo cáo và snapshot >> báo cáo giữ đúng filter, chốt xong tải lại được bản không đổi
- Location: tests\e2e\committees.spec.ts:420:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Đã chốt báo cáo.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Đã chốt báo cáo.')

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
      - listitem: Báo cáo
  - paragraph: Báo cáo
  - paragraph: "Năm học hiện hành: 2026-2027"
  - link "Mở thông báo":
    - /url: /notifications
  - group
- main:
  - paragraph: "Đang xem: Huynh Trưởng · Năm học 2026-2027"
  - heading "Báo cáo" [level=1]
  - paragraph: Xem theo tuần, tháng hoặc năm học; xuất Excel/PDF và chốt bản không đổi để lưu 5 năm.
  - heading "Bộ lọc" [level=2]
  - paragraph: File tải về và bản chốt dùng đúng bộ lọc đang hiển thị.
  - text: Loại báo cáo
  - combobox "Loại báo cáo":
    - option "Chuyên cần" [selected]
    - option "Kết quả học tập"
  - text: Kỳ báo cáo
  - combobox "Kỳ báo cáo":
    - option "Tuần" [selected]
    - option "Tháng"
    - option "Năm học"
  - text: Ngày trong kỳ
  - textbox "Ngày trong kỳ": 2026-10-01
  - text: Phạm vi
  - combobox "Phạm vi":
    - option "Toàn xứ đoàn"
    - option "Theo ngành"
    - option "Theo lớp" [selected]
  - text: Chọn lớp
  - combobox "Chọn lớp":
    - option "Chọn phạm vi" [disabled]
    - option "Ấu 1A" [selected]
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
  - button "Xem báo cáo"
  - heading "Chuyên cần" [level=2]
  - paragraph: Năm học 2026-2027 · 28/09/2026 – 04/10/2026
  - link "Tải Excel":
    - /url: /reports/export?reportType=attendance&periodType=week&anchorDate=2026-10-01&scopeType=class&scopeId=4cf142cd-e3c4-478a-aec1-bc30b936be2d&format=xlsx
  - link "Tải PDF":
    - /url: /reports/export?reportType=attendance&periodType=week&anchorDate=2026-10-01&scopeType=class&scopeId=4cf142cd-e3c4-478a-aec1-bc30b936be2d&format=pdf
  - button "Chốt báo cáo"
  - paragraph:
    - text: "Đang xem: Chuyên cần · Tuần (28/09/2026 – 04/10/2026) · Lớp Ấu 1A ·"
    - strong: 1 dòng
    - text: .
  - table "Chuyên cần · Lớp Ấu 1A · 28/09/2026 – 04/10/2026.":
    - caption: Chuyên cần · Lớp Ấu 1A · 28/09/2026 – 04/10/2026.
    - rowgroup:
      - row "Lớp Sĩ số có điểm danh Số buổi đã chốt Tỷ lệ dự lễ Tỷ lệ học giáo lý Lượt vắng lễ Lượt vắng giáo lý":
        - columnheader "Lớp"
        - columnheader "Sĩ số có điểm danh"
        - columnheader "Số buổi đã chốt"
        - columnheader "Tỷ lệ dự lễ"
        - columnheader "Tỷ lệ học giáo lý"
        - columnheader "Lượt vắng lễ"
        - columnheader "Lượt vắng giáo lý"
    - rowgroup:
      - row "Ấu 1A 2 1 50% 100% 1 0":
        - cell "Ấu 1A"
        - cell "2"
        - cell "1"
        - cell "50%"
        - cell "100%"
        - cell "1"
        - cell "0"
  - paragraph: Vuốt ngang để xem thêm cột.
  - heading "Báo cáo đã chốt" [level=2]
  - paragraph: Bản chốt giữ nguyên số liệu và bộ lọc tại thời điểm chốt.
  - link "Mở kho bản chốt":
    - /url: /reports/snapshots
  - paragraph: Chưa có báo cáo nào được chốt.
  - dialog "Chốt báo cáo?":
    - heading "Chốt báo cáo?" [level=2]
    - button "Đóng hộp thoại"
    - text: Chốt
    - strong: Chuyên cần
    - text: · kỳ
    - strong: Tuần
    - text: (28/09/2026 – 04/10/2026) · phạm vi
    - strong: Lớp Ấu 1A
    - text: ·
    - strong: 1 dòng
    - text: . Bản chốt không sửa và không xoá được.
    - button "Huỷ"
    - button "Chốt báo cáo"
- navigation "Điều hướng nhanh":
  - list:
    - listitem:
      - link "Trang chủ":
        - /url: /dashboard
    - listitem:
      - link "Thiếu nhi":
        - /url: /students
    - listitem:
      - link "Điểm danh":
        - /url: /attendance
    - listitem:
      - link "Báo cáo":
        - /url: /reports
    - listitem:
      - link "Tài khoản":
        - /url: /account
- alert
```

# Test source

```ts
  393 |     const confirmDialog = page.getByRole("dialog");
  394 |     await expect(confirmDialog).toBeVisible();
  395 |     await confirmDialog.getByRole("button", { name: /^(Gửi cho \d+ người|Gửi thông báo|Vẫn gửi)$/ }).click();
  396 |     await expect(page.getByText(/Đã gửi thông báo tới \d+ người/)).toBeVisible({ timeout: 15_000 });
  397 |     await expectNoHorizontalOverflow(page, "/notifications");
  398 | 
  399 |     // ── Phụ huynh có con trong lớp: nhận được, badge đếm và đánh dấu đã đọc ──
  400 |     await page.context().clearCookies();
  401 |     await login(page, "84912000001");
  402 |     await expect(page.getByTestId("unread-notification-badge")).toBeVisible();
  403 |     await page.goto("/notifications");
  404 |     const row = page.locator("li", { hasText: title }).first();
  405 |     await expect(row).toBeVisible();
  406 |     await expect(row.getByRole("link", { name: "Mở trang liên quan" })).toHaveAttribute("href", "/attendance");
  407 |     await row.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  408 |     await expect(page.locator("li", { hasText: title }).first().getByRole("button", { name: "Đánh dấu đã đọc" }))
  409 |       .toHaveCount(0);
  410 | 
  411 |     // ── Giáo lý viên lớp khác: không nằm trong danh sách nhận ───────────────
  412 |     await page.context().clearCookies();
  413 |     await login(page, "GLV912");
  414 |     await page.goto("/notifications");
  415 |     await expect(page.getByText(title)).toHaveCount(0);
  416 |   });
  417 | });
  418 | 
  419 | test.describe("Phase 6 — Báo cáo và snapshot", () => {
  420 |   test("báo cáo giữ đúng filter, chốt xong tải lại được bản không đổi", async ({ page }, testInfo) => {
  421 |     const index = indexOf(testInfo);
  422 |     const admin = getLocalAdmin();
  423 |     const year = await currentYear();
  424 |     const classId = await classIdByName("Ấu 1A");
  425 |     const attendanceDate = thursdayInYear(year.start_date, index + 3);
  426 | 
  427 |     // Buổi điểm danh đã chốt để báo cáo có số liệu. Dùng service role vì đây là
  428 |     // dữ liệu nền, không phải thao tác đang được kiểm.
  429 |     await admin
  430 |       .from("attendance_sessions")
  431 |       .delete()
  432 |       .eq("class_id", classId)
  433 |       .eq("attendance_date", attendanceDate);
  434 |     const { data: finalizer } = await admin
  435 |       .from("profiles")
  436 |       .select("id")
  437 |       .eq("username", "GLV909")
  438 |       .single();
  439 |     const { data: session, error: sessionError } = await admin
  440 |       .from("attendance_sessions")
  441 |       .insert({
  442 |         class_id: classId,
  443 |         academic_year_id: year.id,
  444 |         attendance_date: attendanceDate,
  445 |         meeting_type: "thursday",
  446 |         status: "completed",
  447 |         // CHECK `attendance_sessions_finalized_shape`: chốt thì phải có người chốt.
  448 |         finalized_at: new Date().toISOString(),
  449 |         finalized_by: finalizer!.id,
  450 |       })
  451 |       .select("id")
  452 |       .single();
  453 |     expect(sessionError?.message ?? null, "tạo buổi điểm danh fixture").toBeNull();
  454 | 
  455 |     const { data: enrollments } = await admin
  456 |       .from("enrollments")
  457 |       .select("id, student_id")
  458 |       .eq("class_id", classId)
  459 |       .eq("status", "active");
  460 |     expect((enrollments ?? []).length, "lớp Ấu 1A phải có ghi danh từ seed:dev").toBeGreaterThan(0);
  461 |     const { error: recordError } = await admin.from("student_attendance_records").insert(
  462 |       (enrollments ?? []).map((enrollment, position) => ({
  463 |         attendance_session_id: session!.id,
  464 |         enrollment_id: enrollment.id,
  465 |         class_id: classId,
  466 |         student_id: enrollment.student_id,
  467 |         mass_status: position === 0 ? ("unexcused_absence" as const) : ("present" as const),
  468 |         catechism_status: "present" as const,
  469 |       })),
  470 |     );
  471 |     expect(recordError?.message ?? null, "tạo bản ghi điểm danh fixture").toBeNull();
  472 | 
  473 |     // ── Xem báo cáo đúng tuần và đúng lớp ──────────────────────────────────
  474 |     await login(page, "GLV901");
  475 |     const filterQuery = `reportType=attendance&periodType=week&anchorDate=${attendanceDate}&scopeType=class&scopeId=${classId}`;
  476 |     await page.goto(`/reports?${filterQuery}`);
  477 |     const main = page.getByRole("main");
  478 |     await expect(main.getByRole("heading", { name: "Báo cáo", exact: true })).toBeVisible();
  479 |     const reportTable = page.getByRole("table");
  480 |     await expect(reportTable.getByText("Ấu 1A", { exact: true })).toBeVisible();
  481 |     await expectNoHorizontalOverflow(page, "/reports");
  482 | 
  483 |     // File tải về dùng lại chính chuỗi filter đang xem (D-52).
  484 |     const excel = await page.request.get(`/reports/export?${filterQuery}&format=xlsx`);
  485 |     expect(excel.status()).toBe(200);
  486 |     expect(excel.headers()["content-type"]).toContain("spreadsheetml");
  487 |     const pdf = await page.request.get(`/reports/export?${filterQuery}&format=pdf`);
  488 |     expect(pdf.status()).toBe(200);
  489 |     expect(pdf.headers()["content-type"]).toContain("pdf");
  490 | 
  491 |     // ── Chốt báo cáo rồi tải lại bản chốt ──────────────────────────────────
  492 |     await page.getByRole("button", { name: "Chốt báo cáo" }).click();
> 493 |     await expect(page.getByText("Đã chốt báo cáo.", { exact: false })).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  494 |     const snapshotLink = page.getByRole("link", { name: "Tải bản chốt" }).first();
  495 |     await expect(snapshotLink).toBeVisible();
  496 |     const snapshotHref = await snapshotLink.getAttribute("href");
  497 |     expect(snapshotHref).toBeTruthy();
  498 |     const snapshotFile = await page.request.get(snapshotHref!);
  499 |     expect(snapshotFile.status()).toBe(200);
  500 |     expect(snapshotFile.headers()["content-type"]).toContain("spreadsheetml");
  501 | 
  502 |     // Dữ liệu nguồn đổi sau khi chốt không được làm đổi bản đã chốt.
  503 |     //
  504 |     // So sánh theo `payload_json`/`checksum` chứ KHÔNG so kích thước file: file
  505 |     // Excel được sinh lại từ payload mỗi lần tải, mà ExcelJS nhúng mốc thời gian
  506 |     // vào workbook nên hai lần tải cùng một snapshot có thể lệch nhau một byte.
  507 |     // Kích thước file chưa bao giờ là thứ cần bất biến — payload mới là.
  508 |     const snapshotId = snapshotHref!.split("/").at(-2);
  509 |     const sealed = await admin
  510 |       .from("report_snapshots")
  511 |       .select("payload_json, checksum, generated_at")
  512 |       .eq("id", snapshotId!)
  513 |       .single();
  514 |     expect(sealed.data).toBeTruthy();
  515 | 
  516 |     await admin.from("attendance_sessions").delete().eq("id", session!.id);
  517 | 
  518 |     const afterChange = await admin
  519 |       .from("report_snapshots")
  520 |       .select("payload_json, checksum, generated_at")
  521 |       .eq("id", snapshotId!)
  522 |       .single();
  523 |     expect(afterChange.data, "bản chốt không được đổi khi dữ liệu nguồn bị xóa").toEqual(
  524 |       sealed.data,
  525 |     );
  526 | 
  527 |     const snapshotAfterChange = await page.request.get(snapshotHref!);
  528 |     expect(snapshotAfterChange.status()).toBe(200);
  529 |     expect(snapshotAfterChange.headers()["content-type"]).toContain("spreadsheetml");
  530 |     expect((await snapshotAfterChange.body()).byteLength).toBeGreaterThan(0);
  531 |   });
  532 | });
  533 | 
```