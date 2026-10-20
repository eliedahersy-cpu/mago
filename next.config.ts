import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Bottom corners belong to the Ask MAGO and Install app buttons.
  devIndicators: { position: 'top-right' },
  partialPrefetching: true,
  images: {
    // AVIF first (smallest), WebP for browsers without it.
    formats: ['image/avif', 'image/webp'],
    // Product photos uploaded from the admin live in the Supabase Storage public buckets.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
};

export default nextConfig;
