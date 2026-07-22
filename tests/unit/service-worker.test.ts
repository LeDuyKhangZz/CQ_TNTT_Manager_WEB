import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

/**
 * `public/sw.js` không đi qua TypeScript và không có test nào khác chạm tới,
 * nhưng nó là thứ duy nhất đứng giữa dữ liệu thiếu nhi và bộ nhớ đệm của một
 * máy dùng chung. Ở đây nạp thẳng file thật vào một `ServiceWorkerGlobalScope`
 * giả rồi bấm thử từng loại request, thay vì soi chuỗi bằng regex.
 */
const SW_SOURCE = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
const ORIGIN = "https://tntt.example.org";

type SwEvent = {
  request?: FakeRequest;
  waitUntil: (value: Promise<unknown>) => void;
  respondWith: (value: Promise<unknown>) => void;
};

type FakeRequest = {
  url: string;
  method: string;
  mode: string;
};

type FakeResponse = {
  url: string;
  body: string;
  ok: boolean;
  type: string;
  clone: () => FakeResponse;
};

function makeRequest(
  path: string,
  { method = "GET", mode = "cors", origin = ORIGIN } = {},
): FakeRequest {
  return { url: new URL(path, origin).href, method, mode };
}

function makeResponse(body: string, { ok = true, type = "basic", url = "" } = {}): FakeResponse {
  const response: FakeResponse = { url, body, ok, type, clone: () => response };
  return response;
}

function keyOf(requestOrUrl: string | FakeRequest): string {
  return new URL(typeof requestOrUrl === "string" ? requestOrUrl : requestOrUrl.url, ORIGIN).href;
}

function loadServiceWorker() {
  const listeners = new Map<string, (event: SwEvent) => void>();
  const store = new Map<string, Map<string, FakeResponse>>();
  const networkCalls: string[] = [];
  let offline = false;

  const cacheFor = (name: string) => {
    const existing = store.get(name);
    if (existing) return existing;
    const created = new Map<string, FakeResponse>();
    store.set(name, created);
    return created;
  };

  const caches = {
    async open(name: string) {
      const entries = cacheFor(name);
      return {
        async addAll(urls: string[]) {
          for (const url of urls) entries.set(keyOf(url), makeResponse(`precached:${url}`));
        },
        async put(request: string | FakeRequest, response: FakeResponse) {
          entries.set(keyOf(request), response);
        },
      };
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name: string) {
      return store.delete(name);
    },
    async match(request: string | FakeRequest) {
      const key = keyOf(request);
      for (const entries of store.values()) {
        const hit = entries.get(key);
        if (hit) return hit;
      }
      return undefined;
    },
  };

  const fetchImpl = async (request: FakeRequest) => {
    networkCalls.push(request.url);
    if (offline) throw new TypeError("Failed to fetch");
    return makeResponse(`network:${request.url}`, { url: request.url });
  };

  const self = {
    location: { origin: ORIGIN },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener(type: string, handler: (event: SwEvent) => void) {
      listeners.set(type, handler);
    },
  };

  const ResponseStub = { error: () => makeResponse("network-error", { ok: false }) };

  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- nạp đúng file
  // sẽ chạy trên trình duyệt; viết lại nội dung trong test thì test hết giá trị.
  new Function("self", "caches", "fetch", "Response", SW_SOURCE)(
    self,
    caches,
    fetchImpl,
    ResponseStub,
  );

  async function dispatch(type: string, request?: FakeRequest) {
    const handler = listeners.get(type);
    if (!handler) throw new Error(`sw.js không đăng ký sự kiện ${type}`);
    const pending: Promise<unknown>[] = [];
    let responded: Promise<unknown> | undefined;
    handler({
      request,
      waitUntil: (value) => pending.push(value),
      respondWith: (value) => {
        responded = value;
      },
    });
    await Promise.all(pending);
    return responded ? ((await responded) as FakeResponse) : undefined;
  }

  return {
    dispatch,
    store,
    networkCalls,
    cachedKeys: () => [...store.values()].flatMap((entries) => [...entries.keys()]),
    goOffline: () => {
      offline = true;
    },
  };
}

describe("service worker vỏ tĩnh", () => {
  let sw: ReturnType<typeof loadServiceWorker>;

  beforeEach(async () => {
    sw = loadServiceWorker();
    await sw.dispatch("install");
    await sw.dispatch("activate");
  });

  it("precache đúng vỏ tĩnh và trang offline", () => {
    expect(sw.cachedKeys()).toEqual(
      expect.arrayContaining([
        `${ORIGIN}/offline.html`,
        `${ORIGIN}/icons/icon-192.png`,
        `${ORIGIN}/icons/icon-512.png`,
      ]),
    );
  });

  it("activate xóa cache của bản cũ", async () => {
    sw.store.set("cq-tntt-shell-v0", new Map([[`${ORIGIN}/cu.js`, makeResponse("cũ")]]));
    await sw.dispatch("activate");
    expect([...sw.store.keys()]).not.toContain("cq-tntt-shell-v0");
  });

  it("điều hướng luôn ra mạng và không để lại HTML trong cache", async () => {
    const before = sw.cachedKeys();
    const response = await sw.dispatch("fetch", makeRequest("/students", { mode: "navigate" }));
    expect(response?.body).toBe(`network:${ORIGIN}/students`);
    expect(sw.cachedKeys()).toEqual(before);
  });

  it("mất mạng thì trả trang offline tĩnh, không trả trang đã xem", async () => {
    await sw.dispatch("fetch", makeRequest("/students", { mode: "navigate" }));
    sw.goOffline();
    const response = await sw.dispatch("fetch", makeRequest("/students", { mode: "navigate" }));
    expect(response?.body).toBe("precached:/offline.html");
  });

  it("file tĩnh có hash được phục vụ lại từ cache", async () => {
    const asset = makeRequest("/_next/static/chunks/abc123.js");
    const first = await sw.dispatch("fetch", asset);
    expect(first?.body).toBe(`network:${asset.url}`);

    const second = await sw.dispatch("fetch", asset);
    expect(second?.body).toBe(`network:${asset.url}`);
    // Lần hai không được chạm mạng nữa.
    expect(sw.networkCalls.filter((url) => url === asset.url)).toHaveLength(1);
  });

  // Đây là ràng buộc bảo mật, không phải tối ưu: mọi thứ mang dữ liệu nghiệp vụ
  // phải đi thẳng ra mạng và không để lại dấu vết.
  const passthrough: Array<[string, FakeRequest]> = [
    ["RSC payload của trang roster", makeRequest("/attendance/abc?_rsc=1")],
    ["file báo cáo tải về", makeRequest("/reports/export?scope=class")],
    ["ảnh trong storage của Supabase", makeRequest("/storage/v1/object/x", { origin: "https://db.supabase.co" })],
    ["Server Action ghi điểm danh", makeRequest("/attendance/abc", { method: "POST", mode: "navigate" })],
  ];

  for (const [label, request] of passthrough) {
    it(`không đụng vào ${label}`, async () => {
      const before = sw.cachedKeys();
      const response = await sw.dispatch("fetch", request);
      expect(response).toBeUndefined();
      expect(sw.cachedKeys()).toEqual(before);
    });
  }
});

describe("manifest PWA", () => {
  const value = manifest();

  it("khai báo đủ icon để Android Chrome cho cài", () => {
    const png = value.icons ?? [];
    expect(png.every((icon) => icon.type === "image/png")).toBe(true);
    const anySizes = png.filter((icon) => icon.purpose === "any").map((icon) => icon.sizes);
    const maskableSizes = png.filter((icon) => icon.purpose === "maskable").map((icon) => icon.sizes);
    expect(anySizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(maskableSizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("chạy dạng standalone với màu cam pastel đã chốt (D-5)", () => {
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toBe("#f28c5b");
    expect(value.lang).toBe("vi");
  });
});
