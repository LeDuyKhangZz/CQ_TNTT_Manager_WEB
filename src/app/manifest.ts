import type { MetadataRoute } from "next";

// PWA manifest baseline (docs/04 §12). Icon thật do user cung cấp sau (BLK-4).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thiếu Nhi Chợ Quán",
    short_name: "TNTT CQ",
    description:
      "Hệ thống quản lý Thiếu Nhi Thánh Thể — Giáo xứ Chợ Quán.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff9f4",
    theme_color: "#f28c5b",
    lang: "vi",
    dir: "ltr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
