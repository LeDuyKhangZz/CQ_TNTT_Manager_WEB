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
};

export default nextConfig;
