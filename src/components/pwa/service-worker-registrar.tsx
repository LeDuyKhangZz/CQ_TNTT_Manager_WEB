"use client";

import { useEffect } from "react";

/**
 * Đăng ký service worker vỏ tĩnh (docs/04 §12).
 *
 * Chỉ đăng ký ở bản production. Ở `next dev` các chunk đổi liên tục nên một
 * service worker cache lại sẽ làm người sửa code thấy bundle cũ; ngược lại nếu
 * đã từng chạy bản production trên cùng cổng thì bản đăng ký cũ còn nằm đó, nên
 * ở dev phải gỡ chứ không chỉ bỏ qua.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };

    // Đăng ký sau `load` để không giành băng thông với lần dựng trang đầu tiên.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
