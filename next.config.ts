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
  // PWA Configuration and Security Headers
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
      },
      // Apply CSP in both development and production, but make it permissive for LemonSqueezy
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://play.google.com https://www.gstatic.com https://*.lemonsqueezy.com https://assets.lemonsqueezy.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' data: blob:",
              "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-analytics.com https://*.supabase.co https://*.lemonsqueezy.com https://api.lemonsqueezy.com https://auth.lemonsqueezy.com https://checkout.lemonsqueezy.com https://play.google.com https://www.paypal.com https://*.paypal.com https://stats.g.doubleclick.net https://www.google.com https://accounts.google.com",
              "frame-src 'self' https://checkout.lemonsqueezy.com https://www.paypal.com https://*.paypal.com https://play.google.com",
              "child-src 'self' https://checkout.lemonsqueezy.com https://www.paypal.com https://*.paypal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.lemonsqueezy.com",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          ...(process.env.NODE_ENV === 'production' ? [
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            }
          ] : [])
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
