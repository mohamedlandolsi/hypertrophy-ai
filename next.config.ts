import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', '@radix-ui/react-dialog'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure pdf-parse works on the server side
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    return config;
  },
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      }
    ];
  },
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
