import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  // Keep Node.js-only packages out of the client bundle
  serverExternalPackages: ['twilio', 'bcryptjs', 'pg', '@prisma/client', '@prisma/adapter-pg'],
  // Severe memory optimizations for builds on limited hardware (RPi 4)
  experimental: {
    webpackMemoryOptimizations: true,
    workerThreads: false,
    cpus: 1,
    serverSourceMaps: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Link',
            value: '</.well-known/api-catalog>; rel="api-catalog", </docs/api>; rel="service-doc"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
