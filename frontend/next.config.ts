import type { NextConfig } from "next";

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
    ],
  },
};

export default nextConfig;
