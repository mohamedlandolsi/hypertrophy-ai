import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure pdf-parse works on the server side
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;
