import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://dev-api.seraphinteractive.com"}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
