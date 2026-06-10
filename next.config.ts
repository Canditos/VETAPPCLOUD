import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['twilio', 'bcryptjs', 'pg', '@prisma/client', '@prisma/adapter-pg'],
  experimental: {
    webpackMemoryOptimizations: true,
    workerThreads: false,
    cpus: 1,
    serverSourceMaps: false,
  },
  webpack: (config) => {
    // Force lucide-react to keep all icon imports (their sideEffects:false flag
    // causes Webpack to tree-shake icons even when they're explicitly imported)
    config.module.rules.push({
      test: /node_modules[\\/]lucide-react/,
      sideEffects: true,
    });
    return config;
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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
