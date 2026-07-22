/**
 * Dev fixture seed (docs/07 §14) — LOCAL ONLY.
 *
 * Creates the accounts, staff, classes, guardians and students that the manual
 * QA passes and the authenticated E2E suite need. Auth users cannot be created
 * from plain SQL, so this lives here instead of in supabase/seed.dev.sql.
 *
 * Run against a freshly reset database:
 *   npm run db:reset && npm run seed:dev
 *
 * Passwords here are local-only and deliberately never reused in production.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, ANON_KEY và SUPABASE_SERVICE_ROLE_KEY là bắt buộc.");
}
// Guard rail: this seed writes demo passwords, so it must never reach a remote
// project by accident.
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
  throw new Error(`Chỉ chạy seed dev trên Supabase local. URL hiện tại: ${url}`);
}

export const DEV_PASSWORD = "123456";

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SECTOR = {
  chien: "10000000-0000-0000-0000-000000000001",
  au: "10000000-0000-0000-0000-000000000002",
  thieu: "10000000-0000-0000-0000-000000000003",
};

/** Mirrors deriveLoginAlias() in src/features/auth/aliases.ts. */
function aliasEmail(username) {
  const upper = username.trim().toUpperCase();
  if (/^CQ[0-9]{4,}$/.test(upper)) return `${upper.toLowerCase()}@students.${domain}`;
  if (/^GLV[0-9]{3,}$/.test(upper)) return `${upper.toLowerCase()}@staff.${domain}`;
  const digits = username.replace(/[^0-9]/g, "");
  if (/^0[0-9]{9}$/.test(digits)) return `84${digits.slice(1)}@guardians.${domain}`;
  if (/^84[0-9]{9}$/.test(digits)) return `${digits}@guardians.${domain}`;
  return `${username.trim().toLowerCase()}@accounts.${domain}`;
}

/** Mirrors the normalizedUsername rule: phones become 84xxxxxxxxx, rest upper. */
function normalizedUsername(username) {
  const digits = username.replace(/[^0-9]/g, "");
  if (/^0[0-9]{9}$/.test(digits)) return `84${digits.slice(1)}`;
  if (/^84[0-9]{9}$/.test(digits)) return digits;
  return username.trim().toUpperCase();
}

function must(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

/** Create the auth user + profile pair. Returns the shared id. */
async function createAccount({ username, displayName, saintName = null }) {
  const email = aliasEmail(username);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Tạo auth user ${username} thất bại: ${error?.message}`);

  must(
    await admin.from("profiles").insert({
      id: data.user.id,
      username: normalizedUsername(username),
      display_name: displayName,
      saint_name: saintName,
      account_status: "active",
      // Dev fixtures log straight into the app; the forced change is exercised
      // by scripts/test-auth-flow.mjs instead.
      must_change_password: false,
    }),
    `Tạo profile ${username}`,
  );
  return data.user.id;
}

async function createStaff({
  fullName,
  staffCode,
  title = "anh",
  phone,
  profileId = null,
  saintName = null,
}) {
  const row = must(
    await admin
      .from("staff_profiles")
      .insert({
        profile_id: profileId,
        // Mã đặt tay thay vì lấy từ staff_code_seq: pgTAP tiêu thụ sequence nên
        // mã sinh tự động đổi theo số lần chạy test, làm E2E/perf gãy. Dải
        // GLV9xx dành riêng cho fixture dev.
        staff_code: staffCode,
        full_name: fullName,
        saint_name: saintName,
        title,
        phone,
        service_status: "active",
      })
      .select("id, staff_code")
      .single(),
    `Tạo staff ${fullName}`,
  );
  return row;
}

async function assignRole(profileId, role, extra = {}) {
  must(
    await admin.from("role_assignments").insert({ profile_id: profileId, role, is_active: true, ...extra }),
    `Gán role ${role}`,
  );
}

async function main() {
  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`Đọc profiles: ${countError.message}`);
  if ((count ?? 0) > 0) {
    throw new Error(
      "Database đã có profiles. Chạy `npm run db:reset` trước khi seed dev để tránh trộn dữ liệu.",
    );
  }

  const accounts = [];
  const record = (username, role, note) => accounts.push({ username, role, note });

  // ── Super Admin (D-16) ───────────────────────────────────────────────────
  let firstAdminEmail = null;
  for (const [username, displayName] of [
    ["Khang.Nho", "Khang Nhỏ"],
    ["Mr.Dat", "Mr. Đạt"],
  ]) {
    const id = await createAccount({ username, displayName });
    await assignRole(id, "super_admin");
    record(normalizedUsername(username), "super_admin", displayName);
    firstAdminEmail ??= aliasEmail(username);
  }

  // ── Academic year + 19 classes ───────────────────────────────────────────
  // Created through a real Super Admin session, not the service role: the year
  // and class policies are exactly what we want exercised here.
  const sa = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await sa.auth.signInWithPassword({
    email: firstAdminEmail,
    password: DEV_PASSWORD,
  });
  if (signIn.error) throw new Error(`Đăng nhập Super Admin thất bại: ${signIn.error.message}`);
  const saUserId = signIn.data.user.id;

  const year = must(
    await sa
      .from("academic_years")
      .insert({
        code: "2026-2027",
        name: "Năm học 2026-2027",
        start_date: "2026-09-01",
        end_date: "2027-05-31",
        status: "current",
        retention_until: "2032-05-31",
        updated_by: saUserId,
      })
      .select("id, code, start_date")
      .single(),
    "Tạo năm học",
  );

  must(
    await sa.rpc("generate_default_classes", { target_academic_year_id: year.id }),
    "Sinh 19 lớp mặc định",
  );

  const classes = must(
    await admin.from("classes").select("id, display_name").eq("academic_year_id", year.id),
    "Đọc danh sách lớp",
  );
  const classId = (name) => {
    const found = classes.find((item) => item.display_name === name);
    if (!found) throw new Error(`Không tìm thấy lớp ${name}`);
    return found.id;
  };

  // ── Cha sở / Cha phó (D-17, read-only) ───────────────────────────────────
  for (const [username, displayName, role] of [
    ["ChaSo", "Cha sở Giuse", "parish_priest"],
    ["ChaPho", "Cha phó Phêrô", "chaplain"],
  ]) {
    const id = await createAccount({ username, displayName });
    await assignRole(id, role);
    record(normalizedUsername(username), role, displayName);
  }

  /** Staff account = profile + staff_profiles link; username is the staff code. */
  async function createStaffAccount({ displayName, saintName, phone, staffCode, title = "anh" }) {
    // The staff row is created first so its code becomes the username (D-27).
    const staff = await createStaff({ fullName: displayName, staffCode, saintName, phone, title });
    const id = await createAccount({ username: staff.staff_code, displayName, saintName });
    must(
      await admin.from("staff_profiles").update({ profile_id: id }).eq("id", staff.id),
      "Liên kết staff với account",
    );
    return { profileId: id, staffId: staff.id, staffCode: staff.staff_code };
  }

  // ── Ban điều hành xứ đoàn (D-18, D-19) ───────────────────────────────────
  const boardSpec = [
    { role: "group_leader", staffCode: "GLV901", displayName: "Trần Xuân Đoàn", saintName: "Gioan", phone: "0901000001" },
    { role: "deputy_group_leader", staffCode: "GLV902", displayName: "Lê Phó Đoàn", saintName: "Maria", phone: "0901000002", title: "chi" },
    { role: "secretary", staffCode: "GLV903", displayName: "Nguyễn Thư Ký", saintName: "Anna", phone: "0901000003", title: "chi" },
    { role: "treasurer", staffCode: "GLV904", displayName: "Phạm Thủ Quỹ", saintName: "Tôma", phone: "0901000004" },
  ];
  for (const spec of boardSpec) {
    const staff = await createStaffAccount(spec);
    await assignRole(staff.profileId, spec.role, { academic_year_id: year.id });
    record(staff.staffCode, spec.role, spec.displayName);
  }

  // ── Trưởng/Phó của hai ngành (D-14, D-20) ────────────────────────────────
  const sectorSpec = [
    { role: "sector_leader", staffCode: "GLV905", sector: SECTOR.au, displayName: "Vũ Trưởng Ấu", saintName: "Phaolô", phone: "0901000005" },
    { role: "sector_deputy", staffCode: "GLV906", sector: SECTOR.au, displayName: "Đỗ Phó Ấu", saintName: "Têrêsa", phone: "0901000006", title: "chi" },
    { role: "sector_leader", staffCode: "GLV907", sector: SECTOR.thieu, displayName: "Hoàng Trưởng Thiếu", saintName: "Micae", phone: "0901000007" },
    { role: "sector_deputy", staffCode: "GLV908", sector: SECTOR.thieu, displayName: "Bùi Phó Thiếu", saintName: "Cecilia", phone: "0901000008", title: "chi" },
  ];
  for (const spec of sectorSpec) {
    const staff = await createStaffAccount(spec);
    await assignRole(staff.profileId, spec.role, {
      academic_year_id: year.id,
      sector_id: spec.sector,
    });
    record(staff.staffCode, spec.role, spec.displayName);
  }

  // ── GLV lớp: hai lớp cùng ngành A/B, mỗi lớp 2 GLV, thêm 1 Dự trưởng ─────
  // Order matters: class_staff_assignments must exist and be active before the
  // class role assignment (app.validate_role_assignment_scope).
  const classStaffSpec = [
    { className: "Ấu 1A", staffCode: "GLV909", capacity: "representative", role: "class_representative", displayName: "Ngô Đại Diện 1A", saintName: "Giuse", phone: "0901000009" },
    { className: "Ấu 1A", staffCode: "GLV910", capacity: "member", role: "class_teacher", displayName: "Đinh GLV 1A", saintName: "Lucia", phone: "0901000010", title: "chi" },
    { className: "Ấu 1A", staffCode: "GLV911", capacity: "trainee", role: "trainee_assistant", displayName: "Trịnh Dự Trưởng", saintName: "Đaminh", phone: "0901000011" },
    { className: "Ấu 1B", staffCode: "GLV912", capacity: "representative", role: "class_representative", displayName: "Lý Đại Diện 1B", saintName: "Martinô", phone: "0901000012" },
    { className: "Ấu 1B", staffCode: "GLV913", capacity: "member", role: "class_teacher", displayName: "Cao GLV 1B", saintName: "Agnes", phone: "0901000013", title: "chi" },
  ];
  for (const spec of classStaffSpec) {
    const staff = await createStaffAccount(spec);
    const targetClass = classId(spec.className);
    must(
      await admin.from("class_staff_assignments").insert({
        class_id: targetClass,
        staff_profile_id: staff.staffId,
        capacity: spec.capacity,
        starts_on: year.start_date,
        is_active: true,
        updated_by: staff.profileId,
      }),
      `Phân công ${spec.displayName} vào ${spec.className}`,
    );
    await assignRole(staff.profileId, spec.role, {
      academic_year_id: year.id,
      class_id: targetClass,
    });
    record(staff.staffCode, `${spec.role} (${spec.className})`, spec.displayName);
  }

  // ── Phụ huynh và thiếu nhi ───────────────────────────────────────────────
  async function createGuardianAccount({ fullName, phone, address, profileId = null }) {
    const guardian = must(
      await admin
        .from("guardians")
        .insert({ full_name: fullName, phone, address, status: "active", profile_id: profileId })
        .select("id, phone")
        .single(),
      `Tạo phụ huynh ${fullName}`,
    );
    return guardian;
  }

  const guardianA = await createGuardianAccount({
    fullName: "Nguyễn Văn Ba",
    phone: "0912000001",
    address: "12 Trần Bình Trọng, Q5",
  });
  const guardianAProfile = await createAccount({
    username: guardianA.phone,
    displayName: "Nguyễn Văn Ba",
  });
  must(
    await admin.from("guardians").update({ profile_id: guardianAProfile }).eq("id", guardianA.id),
    "Liên kết phụ huynh A",
  );
  await assignRole(guardianAProfile, "guardian");
  record(normalizedUsername(guardianA.phone), "guardian", "Nguyễn Văn Ba");

  const guardianB = await createGuardianAccount({
    fullName: "Trần Thị Bốn",
    phone: "0912000002",
    address: "45 Nguyễn Trãi, Q5",
  });
  const guardianBProfile = await createAccount({
    username: guardianB.phone,
    displayName: "Trần Thị Bốn",
  });
  must(
    await admin.from("guardians").update({ profile_id: guardianBProfile }).eq("id", guardianB.id),
    "Liên kết phụ huynh B",
  );
  await assignRole(guardianBProfile, "guardian");
  record(normalizedUsername(guardianB.phone), "guardian", "Trần Thị Bốn");

  // D-25: a GLV who is also a parent keeps the staff role and gains "Con của tôi".
  const staffGuardianStaff = must(
    await admin
      .from("staff_profiles")
      .select("id, profile_id, staff_code, full_name")
      .eq("full_name", "Đinh GLV 1A")
      .single(),
    "Đọc GLV kiêm phụ huynh",
  );
  const guardianC = await createGuardianAccount({
    fullName: "Đinh GLV 1A",
    phone: "0901000010",
    address: "77 An Dương Vương, Q5",
    profileId: staffGuardianStaff.profile_id,
  });

  const studentSpec = [
    { fullName: "Nguyễn Minh An", saintName: "Giuse", gender: "male", dob: "2017-03-12", guardian: guardianA.id, className: "Ấu 1A", withAccount: true },
    { fullName: "Trần Bảo Châu", saintName: "Maria", gender: "female", dob: "2017-07-05", guardian: guardianB.id, className: "Ấu 1A", withAccount: false },
    { fullName: "Nguyễn Minh Khoa", saintName: "Phêrô", gender: "male", dob: "2016-11-20", guardian: guardianA.id, className: "Ấu 1B", withAccount: false },
    { fullName: "Đinh Gia Hân", saintName: "Anna", gender: "female", dob: "2015-02-18", guardian: guardianC.id, className: "Thiếu 1A", withAccount: false },
  ];

  for (const spec of studentSpec) {
    const student = must(
      await admin
        .from("students")
        .insert({
          full_name: spec.fullName,
          saint_name: spec.saintName,
          gender: spec.gender,
          date_of_birth: spec.dob,
          guardian_id: spec.guardian,
          status: "active",
        })
        .select("id, student_code")
        .single(),
      `Tạo thiếu nhi ${spec.fullName}`,
    );

    must(
      await admin.from("enrollments").insert({
        student_id: student.id,
        academic_year_id: year.id,
        class_id: classId(spec.className),
        status: "active",
      }),
      `Ghi danh ${spec.fullName}`,
    );

    must(
      await admin.from("student_health_profiles").insert({
        student_id: student.id,
        allergies: spec.withAccount ? "Dị ứng hải sản" : null,
        emergency_notes: "Liên hệ phụ huynh khi có sự cố.",
      }),
      `Hồ sơ sức khỏe ${spec.fullName}`,
    );

    if (spec.withAccount) {
      // D-26: student accounts start from Ấu Nhi upward.
      const id = await createAccount({ username: student.student_code, displayName: spec.fullName });
      must(
        await admin.from("students").update({ profile_id: id }).eq("id", student.id),
        "Liên kết account thiếu nhi",
      );
      await assignRole(id, "student");
      record(student.student_code, "student", spec.fullName);
    }
  }

  process.stdout.write(`\nSeed dev hoàn tất — năm học ${year.code}, ${classes.length} lớp.\n`);
  process.stdout.write(`Mật khẩu chung (local): ${DEV_PASSWORD}\n\n`);
  process.stdout.write("Tài khoản:\n");
  for (const account of accounts) {
    process.stdout.write(`  ${account.username.padEnd(14)} ${account.role.padEnd(34)} ${account.note}\n`);
  }
}

await main();
