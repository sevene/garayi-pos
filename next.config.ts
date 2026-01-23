import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig = async (): Promise<NextConfig> => {
  if (process.env.NODE_ENV === "development") {
    await setupDevPlatform();
  }

  return {
    /* config options here */
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    }
  };
};

export default nextConfig;
