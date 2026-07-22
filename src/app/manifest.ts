import type { MetadataRoute } from "next";

// PWA manifest (docs/04 §12). Icon sinh từ logo chính thức của Xứ đoàn
// (`logo_TNTT_CHOQUAN.jpg`, user cấp 2026-07-22 — gỡ BLK-4). Bản icon đã bỏ dải
// chữ ở đáy logo: ở 192px dòng chữ chỉ còn là vệt mờ.
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
      // Android Chrome chỉ coi là cài được khi có PNG 192 **và** 512.
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Bản maskable tràn nền để hệ điều hành cắt theo hình nó muốn mà không
      // xén mất chữ.
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
