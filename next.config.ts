import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Next.js 16 configuration */
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Force Vercel to use latest deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
