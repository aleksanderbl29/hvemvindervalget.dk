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
    return {
      beforeFiles: [
        {
          source: `/${analyticsProxyPath}/analytics/:path*`,
          destination: "/_vercel/insights/:path*",
        },
        {
          source: `/${analyticsProxyPath}/speed/:path*`,
          destination: "/_vercel/speed-insights/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
