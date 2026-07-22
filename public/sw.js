/*
 * Service worker cho PWA (docs/04 §12).
 *
 * Nguyên tắc bất di bất dịch: **chỉ cache vỏ tĩnh**. Không cache HTML, không
 * cache phản hồi nghiệp vụ. Máy trong phòng học là máy dùng chung — một trang
 * roster hay bảng điểm nằm lại trong cache là rò dữ liệu thiếu nhi cho người
 * đăng nhập kế tiếp, kể cả khi đã đăng xuất.
 *
 * Đổi PRECACHE hay quy tắc cache thì phải tăng VERSION, nếu không máy đã cài
 * vẫn giữ danh sách cũ.
 */

const VERSION = "v1";
const SHELL_CACHE = `cq-tntt-shell-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

/** Chỉ hai nhánh này được cache: file tĩnh có hash hoặc icon, không mang dữ liệu người dùng. */
const CACHEABLE_PREFIXES = ["/_next/static/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // Lên ngay thay vì chờ tab cũ đóng hết: docs/04 §12 yêu cầu không giữ
      // bundle cũ lâu.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(url) {
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Server Action và mọi thao tác ghi đều là POST — không đụng vào.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase, storage signed URL và mọi thứ ngoài miền: để trình duyệt tự lo.
  if (url.origin !== self.location.origin) return;

  // Điều hướng luôn hỏi mạng. Mất mạng thì trả trang offline **tĩnh** chứ không
  // trả lại trang đã xem — trang đã xem có tên và hồ sơ các em.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // Còn lại (RSC payload, route handler, file báo cáo…) đi thẳng ra mạng.
  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // `basic` = cùng miền và đọc được; opaque/redirect thì không cache.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
