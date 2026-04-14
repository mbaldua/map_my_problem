import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Silence Turbopack/webpack conflict warning — we have no custom webpack config
  turbopack: {},
  // Required for Leaflet — map components use dynamic import + ssr:false
  // next-pwa removed for now: incompatible with Next.js 16 + Turbopack
  // Re-add when next-pwa releases Turbopack support or switch to @ducanh2912/next-pwa
}

export default nextConfig
