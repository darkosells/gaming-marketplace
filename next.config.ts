import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oljvdnbgefdgxadfeslx.supabase.co',
        pathname: '/storage/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'trackercdn.com',
        pathname: '/cdn/tracker.gg/valorant/**',
      },
    ],
  },
};

export default nextConfig;
