import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Keep Node.js-only packages out of the client bundle
  serverExternalPackages: ['twilio', 'bcryptjs', 'pg', '@prisma/client', '@prisma/adapter-pg'],
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
