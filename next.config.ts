import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,
  
  // Optimize production builds
  reactStrictMode: false, // Disable double-rendering in dev
  
  // Turbopack configuration - fix for multiple lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  images: {
    // Optimize images
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // Cache images for 24 hours
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'i3.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-sg.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.tiktokcdn.com https://*.cdninstagram.com https://img.youtube.com https://i.ytimg.com https://i3.ytimg.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://youtube.com https://www.instagram.com https://www.tiktok.com; media-src 'self' blob: https://*.supabase.co; object-src 'none'; base-uri 'self'" },
        ],
      },
      {
        source: '/api/categories',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/api/creators',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/api/jobs',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
};

export default nextConfig;
