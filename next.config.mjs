/** @type {import('next').NextConfig} */
const approvedAdminUrl = "https://admin.globle-trade.com";
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL
  ?.trim()
  .replace(/\/$/, "");
if (adminUrl && adminUrl !== approvedAdminUrl) {
  throw new Error(`NEXT_PUBLIC_ADMIN_URL must equal ${approvedAdminUrl}`);
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!adminUrl) return [];
    return {
      afterFiles: [
        { source: "/admin", destination: `${adminUrl}/admin` },
        { source: "/admin/:path*", destination: `${adminUrl}/admin/:path*` },
        { source: "/api/admin/:path*", destination: `${adminUrl}/api/admin/:path*` },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
