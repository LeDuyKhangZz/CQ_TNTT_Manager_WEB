import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const port = process.env.E2E_PORT ?? "3107";
const baseUrl = `http://127.0.0.1:${port}`;

// Next.js tự đọc `.env.local`, nhưng Playwright chạy ở process riêng. Nạp file
// local nếu có để các bài setup dữ liệu (chỉ local) dùng được service role;
// trên CI, biến môi trường đã cấp sẵn vẫn hoạt động khi file không tồn tại.
try {
  process.loadEnvFile(join(projectRoot, ".env.local"));
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

/**
 * 🔴 CHỐT AN TOÀN — đọc trước khi sửa file này.
 *
 * `next build`/`next start` chạy ở NODE_ENV=production, và thứ tự nạp env của
 * Next là `.env.production.local` **trước** `.env.local`. Phase 7 tạo đúng cái
 * tên đó để chạy `seed:prod`, nên từ đó mọi lượt E2E local đã âm thầm dựng app
 * trỏ vào **Supabase production**, trong khi Playwright vẫn dựng dữ liệu ở
 * Supabase local. Hậu quả đo được: 90/90 test đỏ vì không đăng nhập được, và
 * mỗi lượt chạy bắn hàng trăm lần thử mật khẩu sai vào dự án thật. Không ai
 * thấy vì E2E chưa được chạy lại kể từ Phase 7.
 *
 * Gốc rễ đã xử lý ở mục 0.9: file đổi tên thành `.env.production.deploy` —
 * Next chỉ nạp đúng bốn tên (`.env`, `.env.local`, `.env.<NODE_ENV>`,
 * `.env.<NODE_ENV>.local`) nên tên này không bao giờ được nạp, còn `seed:prod`
 * vẫn chạy vì nó chỉ đường dẫn tường minh qua `node --env-file=`. Hai lớp chặn
 * dưới đây **vẫn giữ**: chúng bắt cả trường hợp ai đó tạo lại file tên cũ.
 *
 * Hai lớp chặn:
 *   1. `assertLocalSupabase()` — dừng ngay nếu URL không phải máy này.
 *   2. Tự `next build` với env đã nạp sẵn vào `process.env`. Bắt buộc phải
 *      build lại: `NEXT_PUBLIC_*` bị **nhúng cứng lúc build**, nên đặt biến môi
 *      trường lúc `start` là quá muộn (đã đo: vẫn trỏ production). Biến có sẵn
 *      trong `process.env` thì thắng mọi file `.env` của Next.
 */
function assertLocalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL. E2E cần Supabase local đang chạy.");
  }
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url)) {
    throw new Error(
      `E2E chỉ được chạy trên Supabase local. URL hiện tại: ${url}\n` +
        "Sửa .env.local. Nếu ai đó tạo lại .env.production.local thì xoá đi — " +
        "Next nạp file đó TRƯỚC .env.local (env production dùng .env.production.deploy).",
    );
  }
}

function run(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
      env: { ...process.env },
    });
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} thất bại (mã ${code ?? 1}).`)),
    );
  });
}

function waitForExit(child) {
  return new Promise((resolve) => child.once("exit", (code) => resolve(code ?? 1)));
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js test server exited early with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // Server vẫn đang khởi động.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next.js test server did not become ready at ${baseUrl}.`);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    waitForExit(server),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");

/**
 * Cổng phải trống TRƯỚC khi dựng server. `waitForServer` chỉ hỏi `/login` có
 * trả 200 không — một server cũ còn sót lại cũng trả 200, nên bộ test sẽ chạy
 * ngon lành trên **bản build của lần trước** trong khi server thật vừa chết vì
 * không chiếm được cổng. Đã mất một giờ vì đúng cái bẫy này: 3/3 test đỏ trên
 * cổng bị chiếm, cùng lúc 3/3 xanh khi tự dựng server ở cổng khác.
 */
async function assertPortFree() {
  try {
    await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(2_000) });
  } catch {
    return; // Không ai trả lời — đúng như mong đợi.
  }
  throw new Error(
    `Cổng ${port} đang có tiến trình khác chiếm. Tắt nó rồi chạy lại, ` +
      "hoặc đặt E2E_PORT sang cổng khác. Nếu cứ chạy tiếp, bộ test sẽ kiểm bản build cũ.",
  );
}

assertLocalSupabase();
await assertPortFree();

// Bỏ qua build khi người chạy đã tự build với đúng env (ví dụ trên CI).
if (!process.env.E2E_SKIP_BUILD) {
  await run([nextBin, "build"], "next build");
}

const server = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", port],
  { cwd: projectRoot, stdio: "inherit", windowsHide: true, env: { ...process.env } },
);

let exitCode = 1;
try {
  await waitForServer(server);
  const playwright = spawn(
    process.execPath,
    [
      join(projectRoot, "node_modules", "@playwright", "test", "cli.js"),
      "test",
      ...process.argv.slice(2),
    ],
    {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        PLAYWRIGHT_EXTERNAL_SERVER: "1",
        PLAYWRIGHT_BASE_URL: baseUrl,
      },
    },
  );
  exitCode = await waitForExit(playwright);
} finally {
  await stopServer(server);
}

process.exitCode = exitCode;
