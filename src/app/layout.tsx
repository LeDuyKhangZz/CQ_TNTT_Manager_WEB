import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

// Đợt 0-UI mục 0.1 (docs/system-workflow-redesign/ui-redesign/11 §2). Trước đây
// `--font-sans` khai "Be Vietnam Pro" nhưng không có next/font, không <link>,
// không @font-face — máy nào không cài sẵn thì rơi về Inter/system-ui.
// Chỉ 3 weight: 400/500/600. Hướng A không dùng 700 (docs/09 §2).
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

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
  // Nền trang trung tính của hướng A — không đổi theo ngành (docs/09 §3).
  themeColor: "#FFFBF7",
  width: "device-width",
  initialScale: 1,
  // Cho phép zoom trên mobile (accessibility — docs/06 §16).
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
