/**
 * NAV-DIAG — bộ đo nợ #15 ("điều hướng bị nuốt"), task 2C R2.12.
 *
 * M02-B đã đo hai đầu của chuỗi nhân quả: cú bấm LUÔN tới đích, và ~11-14% lượt
 * URL không bao giờ đổi. Phần giữa chưa ai đo. Bộ này đo cả BỐN mắt xích của
 * một cú bấm:
 *
 *   1. trình duyệt có phát request RSC không?      (Playwright request event)
 *   2. middleware có chạy xong không?              (##NAVDIAG## trong log server)
 *   3. phản hồi có về không?                       (Playwright response/requestfailed)
 *   4. router có đổi URL không?                    (page.url())
 *
 * Và mắt xích thứ 5, thứ quyết định: lời hứa `fetch` của Next **chốt hay không**
 * (`window.__navdiag`, bọc `window.fetch` trước khi trang chạy).
 *
 * Chạy: node scripts/nav-diag.mjs  (server phải đang chạy ở DIAG_BASE)
 *   DIAG_ROUNDS=36 DIAG_SCENARIO=classes|staff DIAG_VIEWPORT=1366x768
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const BASE = process.env.DIAG_BASE ?? "http://127.0.0.1:3107";
const ROUNDS = Number(process.env.DIAG_ROUNDS ?? 36);
const HANG_MS = Number(process.env.DIAG_HANG_MS ?? 15_000);
const SCENARIO = process.env.DIAG_SCENARIO ?? "classes";
const OUT = process.env.DIAG_OUT ?? "nav-diag-result.json";
const [vw, vh] = (process.env.DIAG_VIEWPORT ?? "1366x768").split("x").map(Number);
const USER = process.env.DIAG_USER ?? "GLV901";
const PASSWORD = "123456";

const SCENARIOS = {
  // Thẻ lớp ở /classes — đúng chỗ M02-B đo được 9/72 lượt treo.
  classes: {
    list: "/classes",
    link: (page) => page.locator('a[href^="/classes/"]').first(),
    other: (page) => page.locator('a[href^="/classes/"]').nth(3),
  },
  // Ô số phân trang của /staff — chỗ thứ hai đã có tên trong nợ #15.
  staff: {
    list: "/staff?service=all",
    link: (page) => page.getByRole("link", { name: "Trang 2" }),
    other: (page) => page.locator('a[href^="/staff/"]').first(),
  },
};

/** Bọc `fetch` TRƯỚC khi mã của Next chạy: nó gọi `fetch` toàn cục. */
const PROBE = () => {
  const diag = { fetches: [], events: [], history: [] };
  window.__navdiag = diag;

  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const headers = (init && init.headers) || {};
    const rsc = headers.RSC ?? headers.rsc;
    if (!rsc) return origFetch.apply(this, arguments);

    const rec = {
      url: String(typeof input === "string" ? input : input.url ?? input),
      start: performance.now(),
      prefetch: headers["Next-Router-Prefetch"] ?? null,
      priority: (init && init.priority) ?? null,
      signalAbortedAtCall: !!(init && init.signal && init.signal.aborted),
      headersAt: null,
      status: null,
      settled: null,
    };
    diag.fetches.push(rec);

    let promise;
    try {
      promise = origFetch.apply(this, arguments);
    } catch (error) {
      rec.settled = `throw:${error && error.name}`;
      throw error;
    }
    promise.then(
      (res) => {
        rec.headersAt = performance.now() - rec.start;
        rec.status = res.status;
        rec.settled = "headers";
      },
      (error) => {
        rec.headersAt = performance.now() - rec.start;
        rec.settled = `reject:${error && error.name}:${error && error.message}`;
      },
    );
    return promise;
  };

  for (const name of ["pagehide", "pageshow", "freeze", "resume", "beforeunload"]) {
    window.addEventListener(name, () => diag.events.push({ ev: name, t: performance.now() }));
  }
  document.addEventListener("visibilitychange", () =>
    diag.events.push({ ev: `visibility:${document.visibilityState}`, t: performance.now() }),
  );

  for (const name of ["pushState", "replaceState"]) {
    const orig = history[name].bind(history);
    history[name] = function (state, title, url) {
      diag.history.push({ fn: name, url: String(url), t: performance.now() });
      return orig(state, title, url);
    };
  }
};

function log(line) {
  console.log(line);
}

async function login(page) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Tên đăng nhập").fill(USER);
  await page.locator("input#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
}

async function main() {
  const scenario = SCENARIOS[SCENARIO];
  if (!scenario) throw new Error(`Kịch bản lạ: ${SCENARIO}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: vw, height: vh } });
  await context.addInitScript(PROBE);
  const page = await context.newPage();

  let net = [];
  const seen = new Map();
  page.on("request", (req) => {
    const url = req.url();
    if (!url.startsWith(BASE)) return;
    const headers = req.headers();
    const rec = {
      url: url.slice(BASE.length) || "/",
      rsc: headers["rsc"] ?? null,
      prefetch: headers["next-router-prefetch"] ?? null,
      start: Date.now(),
      end: null,
      status: null,
      failed: null,
    };
    seen.set(req, rec);
    net.push(rec);
  });
  page.on("response", (res) => {
    const rec = seen.get(res.request());
    if (rec) rec.status = res.status();
  });
  page.on("requestfinished", (req) => {
    const rec = seen.get(req);
    if (rec) {
      rec.end = Date.now();
      rec.failed = null;
    }
  });
  page.on("requestfailed", (req) => {
    const rec = seen.get(req);
    if (rec) {
      rec.failed = req.failure()?.errorText ?? "failed";
      rec.end = Date.now();
    }
  });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await login(page);
  log(`đăng nhập xong (${USER}) — kịch bản ${SCENARIO}, ${ROUNDS} lượt, viewport ${vw}x${vh}`);

  const rounds = [];

  for (let i = 0; i < ROUNDS; i += 1) {
    await page.goto(`${BASE}${scenario.list}`, { waitUntil: "load" });
    await page
      .getByTestId("global-loading-overlay")
      .waitFor({ state: "detached", timeout: 15_000 })
      .catch(() => {});
    await page.waitForTimeout(400);

    const link = scenario.link(page);
    await link.waitFor({ state: "visible", timeout: 15_000 });
    const href = await link.getAttribute("href");
    const before = page.url();

    net = [];
    seen.clear();
    await page.evaluate(() => {
      window.__navdiag.fetches.length = 0;
      window.__navdiag.events.length = 0;
      window.__navdiag.history.length = 0;
    });
    const t0 = Date.now();

    await link.click({ timeout: 10_000 }).catch(async () => {
      await link.dispatchEvent("click");
    });
    const clicked = Date.now() - t0;

    let changedAt = null;
    while (Date.now() - t0 < HANG_MS) {
      if (page.url() !== before) {
        changedAt = Date.now() - t0;
        break;
      }
      await page.waitForTimeout(50);
    }

    const probe = await page.evaluate(() => ({
      fetches: window.__navdiag.fetches.map((f) => ({ ...f, start: Math.round(f.start) })),
      events: window.__navdiag.events,
      history: window.__navdiag.history,
    }));

    // Treo thì thử bấm một link KHÁC mà KHÔNG tải lại trang: nếu link kia cũng
    // treo thì router đã chết hẳn (nghi `AbortController` dùng chung ở tầng
    // module của Next), chứ không phải một lượt xui.
    let secondClick = null;
    if (changedAt === null) {
      try {
        const other = scenario.other(page);
        const otherHref = await other.getAttribute("href");
        const t1 = Date.now();
        await other.click({ timeout: 5_000, force: true });
        let secondChanged = null;
        while (Date.now() - t1 < 8_000) {
          if (page.url() !== before) {
            secondChanged = Date.now() - t1;
            break;
          }
          await page.waitForTimeout(50);
        }
        secondClick = { href: otherHref, changedAt: secondChanged };
      } catch (error) {
        secondClick = { error: String(error).slice(0, 200) };
      }
    }

    const navReq = net.filter((r) => r.rsc && !r.prefetch);
    const round = {
      i,
      href,
      clickMs: clicked,
      changedAt,
      hung: changedAt === null,
      nav: navReq.map((r) => ({
        url: r.url,
        status: r.status,
        failed: r.failed,
        ms: r.end ? r.end - r.start : null,
        offset: r.start - t0,
      })),
      probeNav: probe.fetches.filter((f) => !f.prefetch),
      probeEvents: probe.events,
      probeHistory: probe.history,
      rscCount: net.filter((r) => r.rsc).length,
      secondClick,
    };
    rounds.push(round);

    const p = round.probeNav[0];
    log(
      `[${String(i + 1).padStart(2)}/${ROUNDS}] ${round.hung ? "🔴 TREO" : `✔ ${changedAt}ms`}` +
        ` · fetch=${p ? `${p.settled}@${Math.round(p.headersAt ?? -1)}ms` : "KHÔNG CÓ"}` +
        ` · net=${navReq.map((r) => `${r.status ?? "?"}${r.failed ? "/" + r.failed : "/done"}`).join(",") || "—"}` +
        ` · history=${round.probeHistory.length}` +
        (round.secondClick ? ` · bấm link khác: ${round.secondClick.changedAt ?? "CŨNG TREO"}` : ""),
    );
  }

  const hung = rounds.filter((r) => r.hung);
  const ok = rounds.filter((r) => !r.hung);
  const summary = {
    scenario: SCENARIO,
    viewport: `${vw}x${vh}`,
    rounds: rounds.length,
    hung: hung.length,
    rate: `${((hung.length / rounds.length) * 100).toFixed(1)}%`,
    okMs: ok.length
      ? {
          min: Math.min(...ok.map((r) => r.changedAt)),
          max: Math.max(...ok.map((r) => r.changedAt)),
          median: ok.map((r) => r.changedAt).sort((a, b) => a - b)[Math.floor(ok.length / 2)],
        }
      : null,
    consoleErrors: consoleErrors.slice(0, 20),
  };

  log("\n═══ TỔNG KẾT ═══");
  log(JSON.stringify(summary, null, 2));
  if (hung.length) {
    log("\n═══ LƯỢT TREO ═══");
    for (const r of hung) log(JSON.stringify(r));
  }

  writeFileSync(OUT, JSON.stringify({ summary, rounds }, null, 2));
  log(`\nghi ${OUT}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
