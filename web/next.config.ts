import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extra hostnames allowed to load dev assets when sharing `pnpm dev` over a tunnel or
  // tailnet, comma-separated: DEV_ORIGINS=my-mac.tailnet.ts.net pnpm dev
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").filter(Boolean),
  cacheComponents: true,
  partialPrefetching: true,
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
