# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: results.spec.ts >> Kết quả và chuyển lớp Phase 5 >> đại diện nhập/công bố/khóa/xuất/Top 5; portal ownership; duyệt chuyển lớp nguyên tử
- Location: tests\e2e\results.spec.ts:260:7

# Error details

```
Error: Phân công đại diện E2E: CLASS_NOT_ACTIVE
```

# Test source

```ts
  15  |     index: 2, sourceClass: "Nghĩa 1", targetGrade: "20000000-0000-0000-0000-000000000011",
  16  |     targetName: "Nghĩa 2 E2E", rep: "GLV921", guardian: "84919999992", studentCode: "CQ9911",
  17  |   },
  18  |   "laptop-1366": {
  19  |     index: 3, sourceClass: "Hiệp 1", targetGrade: "20000000-0000-0000-0000-000000000014",
  20  |     targetName: "Hiệp 2 E2E", rep: "GLV922", guardian: "84919999993", studentCode: "CQ9921",
  21  |   },
  22  | } as const;
  23  | 
  24  | type ProjectName = keyof typeof PROJECT_FIXTURE;
  25  | let adminClient: SupabaseClient<Database> | null = null;
  26  | 
  27  | function getLocalAdmin() {
  28  |   if (adminClient) return adminClient;
  29  |   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  30  |   const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  31  |   if (!url || !key || !/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
  32  |     throw new Error("E2E Phase 5 chỉ được chạy với Supabase local và service role key.");
  33  |   }
  34  |   adminClient = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  35  |   return adminClient;
  36  | }
  37  | 
  38  | function uuid(kind: number, value: number): string {
  39  |   return `f${kind}000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
  40  | }
  41  | 
  42  | function aliasEmail(username: string): string {
  43  |   const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
  44  |   if (/^GLV\d+$/.test(username)) return `${username.toLowerCase()}@staff.${domain}`;
  45  |   if (/^CQ\d+$/.test(username)) return `${username.toLowerCase()}@students.${domain}`;
  46  |   return `${username}@guardians.${domain}`;
  47  | }
  48  | 
  49  | async function ensureAccount(username: string, displayName: string): Promise<string> {
  50  |   const admin = getLocalAdmin();
  51  |   const { data: existing } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  52  |   if (existing) return existing.id;
  53  |   const { data: created, error: authError } = await admin.auth.admin.createUser({
  54  |     email: aliasEmail(username), password: DEV_PASSWORD, email_confirm: true,
  55  |   });
  56  |   if (authError || !created.user) throw new Error(`Tạo account ${username}: ${authError?.message}`);
  57  |   const { error } = await admin.from("profiles").insert({
  58  |     id: created.user.id, username, display_name: displayName,
  59  |     account_status: "active", must_change_password: false,
  60  |   });
  61  |   if (error) throw new Error(`Tạo profile ${username}: ${error.message}`);
  62  |   return created.user.id;
  63  | }
  64  | 
  65  | async function ensureRole(profileId: string, role: Database["public"]["Enums"]["app_role"], scope: {
  66  |   academic_year_id?: string; class_id?: string;
  67  | } = {}) {
  68  |   const admin = getLocalAdmin();
  69  |   const { data } = await admin.from("role_assignments").select("id").eq("profile_id", profileId).eq("is_active", true).maybeSingle();
  70  |   if (data) return;
  71  |   const { error } = await admin.from("role_assignments").insert({ profile_id: profileId, role, ...scope });
  72  |   if (error) throw new Error(`Gán role ${role}: ${error.message}`);
  73  | }
  74  | 
  75  | async function prepareFixture(testInfo: TestInfo) {
  76  |   const fixture = PROJECT_FIXTURE[testInfo.project.name as ProjectName];
  77  |   if (!fixture) throw new Error(`Thiếu fixture cho ${testInfo.project.name}`);
  78  |   const admin = getLocalAdmin();
  79  |   const { data: year, error: yearError } = await admin.from("academic_years").select("id, code, start_date, end_date").eq("status", "current").single();
  80  |   if (yearError || !year) throw new Error(`Đọc năm hiện hành: ${yearError?.message}`);
  81  |   await admin.from("academic_years").update({ top5_enabled: true }).eq("id", year.id);
  82  |   const { data: sourceClass, error: classError } = await admin.from("classes")
  83  |     .select("id, grade_level_id").eq("academic_year_id", year.id).eq("display_name", fixture.sourceClass).single();
  84  |   if (classError || !sourceClass) throw new Error(`Đọc lớp nguồn: ${classError?.message}`);
  85  | 
  86  |   const { error: futureError } = await admin.from("academic_years").upsert({
  87  |     id: FUTURE_YEAR_ID, code: "2027-2028", name: "Năm đích E2E Phase 5",
  88  |     start_date: "2027-09-01", end_date: "2028-05-31", retention_until: "2033-05-31", status: "draft",
  89  |   });
  90  |   if (futureError) throw new Error(`Tạo năm đích: ${futureError.message}`);
  91  |   const targetClassId = uuid(6, 200 + fixture.index);
  92  |   const { error: targetError } = await admin.from("classes").upsert({
  93  |     id: targetClassId, academic_year_id: FUTURE_YEAR_ID, grade_level_id: fixture.targetGrade,
  94  |     section_code: null, class_kind: "catechism", term_scope: "full_year",
  95  |     display_name: fixture.targetName, status: "active",
  96  |   });
  97  |   if (targetError) throw new Error(`Tạo lớp đích: ${targetError.message}`);
  98  | 
  99  |   const representativeId = await ensureAccount(fixture.rep, `Đại diện E2E ${fixture.index}`);
  100 |   let { data: staff } = await admin.from("staff_profiles").select("id").eq("profile_id", representativeId).maybeSingle();
  101 |   if (!staff) {
  102 |     const result = await admin.from("staff_profiles").insert({
  103 |       profile_id: representativeId, staff_code: fixture.rep, title: "anh",
  104 |       full_name: `Đại diện E2E ${fixture.index}`, phone: `09880000${fixture.index}0`,
  105 |     }).select("id").single();
  106 |     if (result.error || !result.data) throw new Error(`Tạo staff E2E: ${result.error?.message}`);
  107 |     staff = result.data;
  108 |   }
  109 |   const { data: assignment } = await admin.from("class_staff_assignments").select("id")
  110 |     .eq("staff_profile_id", staff.id).eq("class_id", sourceClass.id).eq("is_active", true).maybeSingle();
  111 |   if (!assignment) {
  112 |     const { error } = await admin.from("class_staff_assignments").insert({
  113 |       class_id: sourceClass.id, staff_profile_id: staff.id, capacity: "representative", starts_on: year.start_date,
  114 |     });
> 115 |     if (error) throw new Error(`Phân công đại diện E2E: ${error.message}`);
      |                      ^ Error: Phân công đại diện E2E: CLASS_NOT_ACTIVE
  116 |   }
  117 |   await ensureRole(representativeId, "class_representative", { academic_year_id: year.id, class_id: sourceClass.id });
  118 | 
  119 |   const guardianProfileId = await ensureAccount(fixture.guardian, `Phụ huynh E2E ${fixture.index}`);
  120 |   const guardianId = uuid(2, 100 + fixture.index);
  121 |   const { error: guardianError } = await admin.from("guardians").upsert({
  122 |     id: guardianId, profile_id: guardianProfileId, full_name: `Phụ huynh E2E ${fixture.index}`, phone: fixture.guardian,
  123 |   });
  124 |   if (guardianError) throw new Error(`Tạo phụ huynh E2E: ${guardianError.message}`);
  125 |   await ensureRole(guardianProfileId, "guardian");
  126 | 
  127 |   const studentProfileId = await ensureAccount(fixture.studentCode, `Thiếu nhi E2E ${fixture.index}`);
  128 |   const studentNames: string[] = [];
  129 |   const enrollmentIds: string[] = [];
  130 |   for (let offset = 1; offset <= 6; offset += 1) {
  131 |     const studentId = uuid(3, fixture.index * 10 + offset);
  132 |     const enrollmentId = uuid(4, fixture.index * 10 + offset);
  133 |     const saintName = ["Giuse", "Maria", "Phêrô", "Anna", "Phaolô", "Têrêsa"][offset - 1]!;
  134 |     const fullName = `Em E2E ${fixture.index}-${offset}`;
  135 |     studentNames.push(`${saintName} ${fullName}`);
  136 |     enrollmentIds.push(enrollmentId);
  137 |     const { error: studentError } = await admin.from("students").upsert({
  138 |       id: studentId, profile_id: offset === 1 ? studentProfileId : null,
  139 |       student_code: `CQ99${fixture.index - 1}${offset}`, guardian_id: guardianId,
  140 |       saint_name: saintName, full_name: fullName, gender: offset % 2 ? "male" : "female", date_of_birth: `2015-0${offset}-01`,
  141 |     });
  142 |     if (studentError) throw new Error(`Tạo thiếu nhi E2E ${offset}: ${studentError.message}`);
  143 |     // 🔴 `ended_on`/`previous_enrollment_id` phải đặt lại về null TƯỜNG MINH.
  144 |     // `upsert` chỉ ghi đè đúng những cột được liệt kê, nên bản cũ để lại nguyên
  145 |     // giá trị của lượt chạy trước. Chính bài test này kết thúc ghi danh khi
  146 |     // duyệt chuyển lớp (`status='completed'`, `ended_on=<ngày>`); lượt chạy sau
  147 |     // đặt lại `status='active'` mà `ended_on` vẫn còn ⇒ vi phạm ràng buộc
  148 |     // `enrollments_open_has_no_end` ngay ở bước dựng dữ liệu. Đo được: cả 3
  149 |     // viewport rớt ở đúng dòng này, và bộ E2E chỉ chạy được **một lần** sau mỗi
  150 |     // `db:reset` — đúng loại ma sát khiến nợ #9 (E2E chưa chạy) kéo dài.
  151 |     const { error: enrollmentError } = await admin.from("enrollments").upsert({
  152 |       id: enrollmentId, student_id: studentId, academic_year_id: year.id,
  153 |       class_id: sourceClass.id, status: "active", enrolled_on: year.start_date,
  154 |       ended_on: null, previous_enrollment_id: null,
  155 |     });
  156 |     if (enrollmentError) throw new Error(`Ghi danh E2E ${offset}: ${enrollmentError.message}`);
  157 |   }
  158 |   await ensureRole(studentProfileId, "student");
  159 | 
  160 |   return {
  161 |     admin, fixture, year, classId: sourceClass.id, targetClassId, representativeId,
  162 |     studentNames, enrollmentIds, firstStudentName: studentNames[0]!, firstEnrollmentId: enrollmentIds[0]!,
  163 |   };
  164 | }
  165 | 
  166 | async function login(page: Page, username: string) {
  167 |   // 🔴 Xoá cookie TRƯỚC khi mở /login — M14 NC-3.
  168 |   // Từ nay `/login` chuyển thẳng vào `/dashboard` khi đã có phiên hợp lệ, nên
  169 |   // "đăng nhập lại bằng người khác trên cùng một trang" không còn thấy biểu mẫu
  170 |   // (đo được: 6 test rớt vì chờ mãi ô "Tên đăng nhập"). Trong ứng dụng thật,
  171 |   // đổi tài khoản là **Đăng xuất rồi đăng nhập** — chức năng đăng xuất vừa được
  172 |   // thêm ở A-01, trước đó chưa hề tồn tại nên các spec mới phải làm vòng này.
  173 |   // Xoá cookie là cách diễn đạt đúng ý "bắt đầu như một người mới trên máy
  174 |   // sạch"; mỗi context là độc lập nên không đụng tới phiên của context khác
  175 |   // (bài tranh chấp/tiếp quản ở attendance dùng hai context riêng).
  176 |   await page.context().clearCookies();
  177 |   await page.goto("/login");
  178 |   for (let attempt = 0; attempt < 3; attempt += 1) {
  179 |     await page.getByLabel("Tên đăng nhập").fill(username);
  180 |     await page.locator("input#password").fill(DEV_PASSWORD);
  181 |     await page.getByRole("button", { name: "Đăng nhập" }).click();
  182 |     try {
  183 |       await page.waitForURL(/\/(dashboard|change-password)$/, { timeout: 10_000 });
  184 |       await expect(page).toHaveURL(/\/dashboard$/);
  185 |       return;
  186 |     } catch {
  187 |       await page.goto("/login");
  188 |     }
  189 |   }
  190 |   throw new Error(`Không đăng nhập được bằng ${username}.`);
  191 | }
  192 | 
  193 | async function expectNoHorizontalOverflow(page: Page, where: string) {
  194 |   const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  195 |   expect(overflow, `${where} không được tràn ngang`).toBe(false);
  196 | }
  197 | 
  198 | /**
  199 |  * 🔴 **Nợ #10 — phần "chờ cứng 5 giây" của `results.spec.ts`, trả ở M07-A đúng
  200 |  * như bảng nợ đã hẹn.** (Phần `window.confirm` của cùng món nợ thuộc đợt C.)
  201 |  *
  202 |  * Sau một thao tác ghi, câu báo thành công hiện **ngay** vì nó là state phía
  203 |  * client đặt từ kết quả action; còn thứ **dẫn xuất từ dữ liệu máy chủ** — thẻ Top
  204 |  * 5 vừa tạo, nút "Ẩn" sau khi công bố, nhãn "Đã khóa" — chỉ về sau khi
  205 |  * `router.refresh()` lấy lại trang. Hai mốc ấy cách nhau đúng một vòng
  206 |  * round-trip, và ngưỡng mặc định của Playwright là **5 giây**.
  207 |  *
  208 |  * ⚠️ **Đây là che triệu chứng, không phải chữa** — và lượt chạy của M07-A đo được
  209 |  * nguyên nhân rõ hơn mọi lượt trước: khi bài rớt ở dòng "thẻ Top 5 vừa tạo",
  210 |  * `psql` cho thấy **cả hai bản ghi đã nằm trong bảng `leaderboards`**, câu *"Đã
  211 |  * tạo bảng Top 5"* đã hiện, mà nút thì vẫn kẹt ở **"Đang tạo…" [disabled]** —
  212 |  * tức `startTransition` chưa chốt vì lượt làm mới chưa về. Ghi vào được, câu trả
  213 |  * lời không về: đúng kết luận M03-C đã đo, không phải lỗi của mã ứng dụng.
  214 |  *
  215 |  * 20 giây là mốc `committees.spec.ts` đã dùng từ M09-C cho cùng loại khẳng định.
```