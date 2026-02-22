import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const basePath = "/plugins/redis";
const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  turbopack: {
    root: appRoot,
  },
  transpilePackages: [
    "@openforgelabs/rainbow-ui",
    "@openforgelabs/rainbow-connections",
    "@openforgelabs/rainbow-contracts",
  ],
};

export default nextConfig;
