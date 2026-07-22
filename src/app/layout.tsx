import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Thiếu Nhi Chợ Quán",
    template: "%s · Thiếu Nhi Chợ Quán",
  },
  description:
    "Hệ thống quản lý Thiếu Nhi Thánh Thể — Giáo xứ Chợ Quán (nội bộ).",
  applicationName: "Thiếu Nhi Chợ Quán",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Thiếu Nhi Chợ Quán",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f28c5b",
  width: "device-width",
  initialScale: 1,
  // Cho phép zoom trên mobile (accessibility — docs/06 §16).
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
