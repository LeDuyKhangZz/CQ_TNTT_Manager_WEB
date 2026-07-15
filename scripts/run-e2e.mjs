import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const port = process.env.E2E_PORT ?? "3107";
const baseUrl = `http://127.0.0.1:${port}`;

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

const server = spawn(
  process.execPath,
  [join(projectRoot, "node_modules", "next", "dist", "bin", "next"), "start", "--hostname", "127.0.0.1", "--port", port],
  { cwd: projectRoot, stdio: "inherit", windowsHide: true },
);

let exitCode = 1;
try {
  await waitForServer(server);
  const playwright = spawn(
    process.execPath,
    [join(projectRoot, "node_modules", "@playwright", "test", "cli.js"), "test"],
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
