import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "www.kopis.or.kr", pathname: "/upload/**" },
      { protocol: "https", hostname: "www.kopis.or.kr", pathname: "/upload/**" },
      { protocol: "http", hostname: "kopis.or.kr", pathname: "/upload/**" },
      { protocol: "https", hostname: "kopis.or.kr", pathname: "/upload/**" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
