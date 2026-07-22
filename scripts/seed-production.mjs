/**
 * Seed production (P7-T5) — dựng đúng phần tối thiểu để Xứ đoàn bắt đầu dùng:
 * hai tài khoản Super Admin (D-16), một năm học và 19 lớp mặc định (D-9).
 *
 * KHÁC `seed:dev` ở ba điểm, và cả ba đều là chủ ý:
 *   1. Không có mật khẩu dùng chung. Mỗi tài khoản nhận một mật khẩu tạm ngẫu
 *      nhiên, in ra màn hình đúng một lần, và `must_change_password = true`
 *      (D-27) nên buộc phải đổi ngay lần đăng nhập đầu.
 *   2. Không tạo bất kỳ dữ liệu mẫu nào — không GLV giả, không thiếu nhi giả.
 *   3. Bắt gõ đúng hostname của project để chạy, vì đây là script duy nhất
 *      trong repo được phép trỏ vào Supabase thật.
 *
 * Cách chạy (env nạp từ file môi trường production, KHÔNG commit file đó):
 *   node --env-file=.env.production.local scripts/seed-production.mjs \
 *     --confirm=<hostname-cua-project> [--year=2026-2027] \
 *     [--start=2026-09-01] [--end=2027-05-31]
 */
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, ANON_KEY và SUPABASE_SERVICE_ROLE_KEY là bắt buộc.");
}

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  }),
);

const targetHost = new URL(url).hostname;
if (args.get("confirm") !== targetHost) {
  throw new Error(
    `Phải xác nhận đúng project. Chạy lại với --confirm=${targetHost}\n` +
      `(URL đang trỏ tới: ${url})`,
  );
}

const yearCode = args.get("year") ?? "2026-2027";
const startDate = args.get("start") ?? `${yearCode.slice(0, 4)}-09-01`;
const endDate = args.get("end") ?? `${Number(yearCode.slice(0, 4)) + 1}-05-31`;
// D-51: báo cáo giữ 5 năm, tính từ khi năm học kết thúc.
const retentionUntil = `${Number(endDate.slice(0, 4)) + 5}${endDate.slice(4)}`;

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function must(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

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

function normalizedUsername(username) {
  const digits = username.replace(/[^0-9]/g, "");
  if (/^0[0-9]{9}$/.test(digits)) return `84${digits.slice(1)}`;
  if (/^84[0-9]{9}$/.test(digits)) return digits;
  return username.trim().toUpperCase();
}

/**
 * Mật khẩu tạm 8 ký tự (D-27). Bỏ `0O1lI` vì mật khẩu này được đọc qua điện
 * thoại cho người nhận, đọc nhầm một ký tự là mất buổi.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function temporaryPassword() {
  return Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

async function main() {
  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(`Đọc profiles: ${countError.message}`);
  if ((count ?? 0) > 0) {
    throw new Error(
      "Database đã có tài khoản. Script này chỉ dùng để khởi tạo lần đầu; " +
        "thêm tài khoản về sau làm trong /admin.",
    );
  }

  process.stdout.write(`Khởi tạo ${targetHost} — năm học ${yearCode} (${startDate} → ${endDate}).\n\n`);

  // ── Hai Super Admin (D-16) ───────────────────────────────────────────────
  const credentials = [];
  let bootstrapEmail = null;
  let bootstrapPassword = null;
  let bootstrapProfileId = null;

  for (const [username, displayName] of [
    ["Khang.Nho", "Khang Nhỏ"],
    ["Mr.Dat", "Mr. Đạt"],
  ]) {
    const email = aliasEmail(username);
    const password = temporaryPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Tạo tài khoản ${username} thất bại: ${error?.message}`);
    }

    must(
      await admin.from("profiles").insert({
        id: data.user.id,
        username: normalizedUsername(username),
        display_name: displayName,
        account_status: "active",
        // Tài khoản đầu tiên tạm thời chưa bật cờ: nó phải đăng nhập ngay trong
        // script để tạo năm học/lớp bằng chính phiên Super Admin thật thay vì
        // service role. Cờ được bật lại ở cuối, trước khi script kết thúc.
        must_change_password: bootstrapEmail !== null,
      }),
      `Tạo profile ${username}`,
    );
    must(
      await admin
        .from("role_assignments")
        .insert({ profile_id: data.user.id, role: "super_admin", is_active: true }),
      `Gán super_admin cho ${username}`,
    );

    credentials.push({ username: normalizedUsername(username), displayName, password });
    if (bootstrapEmail === null) {
      bootstrapEmail = email;
      bootstrapPassword = password;
      bootstrapProfileId = data.user.id;
    }
  }

  // ── Năm học + 19 lớp, tạo qua phiên Super Admin thật ─────────────────────
  const sa = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await sa.auth.signInWithPassword({
    email: bootstrapEmail,
    password: bootstrapPassword,
  });
  if (signIn.error) throw new Error(`Đăng nhập Super Admin thất bại: ${signIn.error.message}`);

  const year = must(
    await sa
      .from("academic_years")
      .insert({
        code: yearCode,
        name: `Năm học ${yearCode}`,
        start_date: startDate,
        end_date: endDate,
        status: "current",
        retention_until: retentionUntil,
        updated_by: bootstrapProfileId,
      })
      .select("id, code")
      .single(),
    "Tạo năm học",
  );

  must(
    await sa.rpc("generate_default_classes", { target_academic_year_id: year.id }),
    "Sinh 19 lớp mặc định",
  );

  const { count: classCount } = await admin
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", year.id);

  await sa.auth.signOut();

  // Bật lại cờ đổi mật khẩu cho tài khoản bootstrap — từ đây cả hai Super Admin
  // đều buộc đổi mật khẩu ở lần đăng nhập đầu.
  must(
    await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", bootstrapProfileId),
    "Bật lại must_change_password cho tài khoản bootstrap",
  );

  process.stdout.write(`Đã tạo năm học ${year.code} và ${classCount} lớp.\n\n`);
  process.stdout.write("MẬT KHẨU TẠM — chỉ hiện một lần, không được lưu vào file:\n");
  for (const item of credentials) {
    process.stdout.write(`  ${item.username.padEnd(12)} ${item.password}   (${item.displayName})\n`);
  }
  process.stdout.write(
    "\nGiao tận tay từng người, đổi ngay lần đăng nhập đầu (hệ thống bắt buộc).\n" +
      "Không có tài khoản GLV/thiếu nhi nào được tạo: nhập bằng /imports hoặc /admin.\n",
  );
}

await main();
