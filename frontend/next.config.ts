import type { NextConfig } from "next";

// Read the analytics proxy path from environment variable
const analyticsProxyPath = process.env.NEXT_PUBLIC_ANALYTICS_PROXY_PATH || "_backend";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.hvemvindervalget.dk",
      },
      {
        protocol: "https",
        hostname: "cdn.hvemvindervalget.dk",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: `/${analyticsProxyPath}/analytics/:path*`,
        destination: "https://hvemvindervalget.dk/_vercel/insights/:path*",
      },
      {
        source: `/${analyticsProxyPath}/speed/:path*`,
        destination: "https://hvemvindervalget.dk/_vercel/speed-insights/:path*",
      },
    ];
  },
};

export default nextConfig;
