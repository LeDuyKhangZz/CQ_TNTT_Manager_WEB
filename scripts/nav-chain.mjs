/**
 * NAV-CHAIN — bản đo thứ hai của nợ #15 (2C R2.12).
 *
 * `nav-diag.mjs` tải lại trang ở mỗi lượt, và chính điều đó CHE mất lỗi: đo lại
 * bằng một CHUỖI điều hướng phía trình duyệt, không tải lại lần nào:
 *   /classes → thẻ lớp → nút "Danh sách lớp" → thẻ lớp → …
 *
 * Mỗi bước ghi đủ bốn mốc để tách "máy chủ chưa gửi xong" khỏi "trình duyệt
 * chưa chốt":
 *   headersAt   — lời hứa `fetch` chốt (mới có header)
 *   bodyDoneAt  — thân phản hồi truyền xong  (Playwright requestfinished)
 *   abortedAt   — thân bị huỷ giữa chừng     (Playwright requestfailed)
 *   changedAt   — router đổi URL
 *
 * Chạy: node scripts/nav-chain.mjs   (server phải chạy sẵn ở DIAG_BASE)
 *   DIAG_HOPS=50 DIAG_BLOCK_PREFETCH=1 DIAG_VIEWPORT=1366x768
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const BASE = process.env.DIAG_BASE ?? "http://127.0.0.1:3107";
const HOPS = Number(process.env.DIAG_HOPS ?? 50);
const HANG_MS = Number(process.env.DIAG_HANG_MS ?? 12_000);
const CPU = Number(process.env.DIAG_CPU ?? 1);
const BLOCK_PREFETCH = process.env.DIAG_BLOCK_PREFETCH === "1";
const DISABLE_ANIMATIONS = process.env.DIAG_NO_ANIMATIONS === "1";
const DROP_DOC_CAPTURE = process.env.DIAG_DROP_DOC_CAPTURE === "1";
const OUT = process.env.DIAG_OUT ?? "nav-chain-result.json";
const [vw, vh] = (process.env.DIAG_VIEWPORT ?? "1366x768").split("x").map(Number);
const USER = process.env.DIAG_USER ?? "GLV901";
const PASSWORD = process.env.E2E_PASSWORD;
if (!PASSWORD) throw new Error("Set E2E_PASSWORD for a local test account.");

const PROBE = (opts) => {
  const diag = { fetches: [], events: [], history: [] };
  window.__navdiag = diag;

  // A/B không cần build lại: chặn ĐÚNG bộ bắt click giai đoạn capture trên
  // `document` mà `LoadingProvider` gắn (`loading-provider.tsx` §"Bắt điều hướng
  // ở tầng document"). Không đụng tới listener của React (gắn ở thẻ gốc của app).
  if (opts && opts.dropDocCapture) {
    const orig = document.addEventListener.bind(document);
    document.addEventListener = function (type, fn, options) {
      const capture = options === true || (options && options.capture);
      if (type === "click" && capture) {
        diag.events.push({ ev: "ĐÃ CHẶN listener click capture", t: Date.now() });
        return undefined;
      }
      return orig(type, fn, options);
    };
  }

  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const headers = (init && init.headers) || {};
    if (!(headers.RSC ?? headers.rsc)) return origFetch.apply(this, arguments);

    const rec = {
      url: String(typeof input === "string" ? input : input.url ?? input).replace(
        window.location.origin,
        "",
      ),
      wall: Date.now(),
      prefetch: headers["Next-Router-Prefetch"] ?? null,
      signalAbortedAtCall: !!(init && init.signal && init.signal.aborted),
      headersAt: null,
      status: null,
      settled: null,
    };
    diag.fetches.push(rec);

    const promise = origFetch.apply(this, arguments);
    promise.then(
      (res) => {
        rec.headersAt = Date.now() - rec.wall;
        rec.status = res.status;
        rec.contentType = res.headers.get("content-type");
        rec.redirected = res.redirected;
        rec.responseUrl = res.url;
        rec.settled = "headers";
      },
      (error) => {
        rec.headersAt = Date.now() - rec.wall;
        rec.settled = `reject:${error && error.name}`;
      },
    );
    return promise;
  };

  for (const name of ["pagehide", "pageshow", "freeze", "resume", "beforeunload"]) {
    window.addEventListener(name, () => diag.events.push({ ev: name, t: Date.now() }));
  }
  for (const name of ["pushState", "replaceState"]) {
    const orig = history[name].bind(history);
    history[name] = function (state, title, url) {
      diag.history.push({ fn: name, url: String(url), t: Date.now() });
      return orig(state, title, url);
    };
  }
};

async function login(page) {
  await page.context().clearCookies();
  // Biểu mẫu đăng nhập chạy bằng JS phía trình duyệt: bấm trước lúc hydrate xong
  // thì nó gửi GET `?username=…&password=…` và không đi đâu cả. Thử lại 3 lượt,
  // cùng khuôn với `login()` của `staff-directory.spec.ts`.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(`${BASE}/login`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await page.getByLabel("Tên đăng nhập").fill(USER);
    await page.locator("input#password").fill(PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    try {
      await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
      return;
    } catch {
      /* thử lại */
    }
  }
  throw new Error("Không đăng nhập được sau 3 lượt.");
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: vw, height: vh } });
  await context.addInitScript(PROBE, { dropDocCapture: DROP_DOC_CAPTURE });
  const page = await context.newPage();

  if (CPU > 1) {
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  }

  if (BLOCK_PREFETCH) {
    // Chặn HẲN mọi request nạp trước ở tầng mạng — không đụng vào mã ứng dụng.
    await page.route("**/*", (route) => {
      const headers = route.request().headers();
      if (headers["next-router-prefetch"] === "1") return route.abort();
      return route.continue();
    });
  }

  // Bảng tra: url RSC → mốc mạng thật.
  const netByUrl = new Map();
  const stamp = (req, patch) => {
    const url = req.url();
    if (!url.startsWith(BASE) || !req.headers()["rsc"]) return;
    const key = url.slice(BASE.length);
    netByUrl.set(key, { ...(netByUrl.get(key) ?? {}), ...patch });
  };
  page.on("request", (req) => stamp(req, { startWall: Date.now(), failed: null, finished: null }));
  page.on("response", (res) => stamp(res.request(), { status: res.status() }));
  page.on("requestfinished", (req) => stamp(req, { finished: Date.now() }));
  page.on("requestfailed", (req) =>
    stamp(req, { failed: Date.now(), err: req.failure()?.errorText ?? "failed" }),
  );

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  if (DISABLE_ANIMATIONS) await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto(`${BASE}/classes`, { waitUntil: "load" });
  await page
    .getByTestId("global-loading-overlay")
    .waitFor({ state: "detached", timeout: 15_000 })
    .catch(() => {});
  console.log(
    `đăng nhập xong — chuỗi ${HOPS} bước, CPU x${CPU}, ${vw}x${vh}` +
      (BLOCK_PREFETCH ? ", CHẶN NẠP TRƯỚC" : ""),
  );

  const hops = [];

  for (let i = 0; i < HOPS; i += 1) {
    const onList = /\/classes$/.test(page.url());
    const link = onList
      ? page.locator('a[href^="/classes/"]').first()
      : page.getByRole("link", { name: "Danh sách lớp" }).first();

    let href = null;
    try {
      await link.waitFor({ state: "visible", timeout: 8_000 });
      href = await link.getAttribute("href");
    } catch {
      /* lớp phủ có thể đang che — vẫn bấm bằng force */
    }

    const before = page.url();
    await page.evaluate(() => {
      window.__navdiag.fetches.length = 0;
      window.__navdiag.history.length = 0;
    });
    netByUrl.clear();
    const t0 = Date.now();

    try {
      await link.click({ timeout: 6_000, force: true });
    } catch (error) {
      hops.push({ i, from: before, href, clickError: String(error).slice(0, 160), hung: true });
      console.log(`[${String(i + 1).padStart(2)}] 🔴 KHÔNG BẤM ĐƯỢC`);
      continue;
    }

    let changedAt = null;
    let stalled = null;
    while (Date.now() - t0 < HANG_MS) {
      if (page.url() !== before) {
        changedAt = Date.now() - t0;
        break;
      }
      if (!stalled && Date.now() - t0 > 2000) stalled = await page.evaluate(() => {
        const key = Object.keys(document).find(k => k.startsWith("__reactContainer"));
        const root = key ? document[key].stateNode : null;
        return {root: root ? {pending:root.pendingLanes,suspended:root.suspendedLanes,pinged:root.pingedLanes,cancelPendingCommit:!!root.cancelPendingCommit,timeoutHandle:root.timeoutHandle} : null,
          sheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>({href:e.href,sheet:!!e.sheet,state: e._p ? String(e._p.status):null})),
          images:[...document.images].map(e=>({src:e.getAttribute("src"),complete:e.complete}))};
      });
      await page.waitForTimeout(50);
    }

    const probe = await page.evaluate(() => ({
      fetches: window.__navdiag.fetches,
      events: window.__navdiag.events,
      history: window.__navdiag.history,
    }));

    const nav = probe.fetches
      .filter((f) => !f.prefetch)
      .map((f) => {
        const net = netByUrl.get(f.url) ?? {};
        return {
          url: f.url,
          startedAt: f.wall - t0,
          headersAt: f.headersAt,
          status: f.status ?? net.status ?? null,
          settled: f.settled,
          contentType: f.contentType, redirected: f.redirected, responseUrl: f.responseUrl,
          bodyDoneAt: net.finished ? net.finished - t0 : null,
          abortedAt: net.failed ? net.failed - t0 : null,
          abortErr: net.err ?? null,
        };
      });

    hops.push({
      i,
      from: before.replace(BASE, ""),
      href,
      changedAt, stalled,
      hung: changedAt === null,
      nav,
      prefetchCount: probe.fetches.filter((f) => f.prefetch).length,
      history: probe.history.map((h) => ({ fn: h.fn, url: h.url, at: h.t - t0 })),
      events: probe.events,
    });

    const n = nav[0];
    console.log(
      `[${String(i + 1).padStart(2)}] ${changedAt === null ? "🔴 TREO   " : `✔ ${String(changedAt).padStart(5)}ms`}` +
        ` ${before.replace(BASE, "").slice(0, 22).padEnd(22)} → ${String(href).slice(0, 22).padEnd(22)}` +
        (n
          ? ` hdr@${String(n.headersAt).padStart(4)}ms  body@${String(n.bodyDoneAt ?? "—").padStart(5)}  abort@${String(n.abortedAt ?? "—").padStart(5)}`
          : "  KHÔNG CÓ REQUEST") +
        ` pf=${String(hops[hops.length - 1].prefetchCount).padStart(2)}`,
    );
  }

  const hung = hops.filter((h) => h.hung);
  const ok = hops.filter((h) => !h.hung);
  const toList = hops.filter((h) => h.href === "/classes");
  const toDetail = hops.filter((h) => h.href !== "/classes");
  let longest = 0;
  let current = 0;
  for (const h of hops) {
    current = h.hung ? current + 1 : 0;
    longest = Math.max(longest, current);
  }

  const summary = {
    hops: hops.length,
    hung: hung.length,
    rate: `${((hung.length / hops.length) * 100).toFixed(1)}%`,
    toList: `${toList.filter((h) => h.hung).length}/${toList.length}`,
    toDetail: `${toDetail.filter((h) => h.hung).length}/${toDetail.length}`,
    longestHangStreak: longest,
    cpuThrottle: CPU,
    blockPrefetch: BLOCK_PREFETCH,
    dropDocCapture: DROP_DOC_CAPTURE,
    viewport: `${vw}x${vh}`,
    okMs: ok.length
      ? {
          min: Math.min(...ok.map((h) => h.changedAt)),
          median: ok.map((h) => h.changedAt).sort((a, b) => a - b)[Math.floor(ok.length / 2)],
          max: Math.max(...ok.map((h) => h.changedAt)),
        }
      : null,
    consoleErrors: consoleErrors.slice(0, 20),
  };

  console.log("\n═══ TỔNG KẾT ═══");
  console.log(JSON.stringify(summary, null, 2));
  writeFileSync(OUT, JSON.stringify({ summary, hops }, null, 2));
  console.log(`\nghi ${OUT}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
