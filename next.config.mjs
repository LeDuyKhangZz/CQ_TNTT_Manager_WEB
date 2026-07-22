/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // File nghiệp vụ tối đa 5 MB; chừa phần multipart nhưng vẫn chặn ở action và DB.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        // P7-T4. Ứng dụng nội bộ chứa hồ sơ trẻ em: URL mang UUID thiếu nhi nên
        // Referrer-Policy là biện pháp thật, không phải trang trí — không được
        // gửi đường dẫn ấy sang miền khác. Chưa có CSP: Next App Router cần
        // nonce cho script bootstrap, làm sau và đã ghi vào WORKLOG.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // Service worker phải được kiểm tra lại mỗi lần tải, nếu không máy đã
        // cài giữ bản cũ tới cả ngày (docs/04 §12 — không giữ bundle cũ lâu).
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
