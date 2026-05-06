import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

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
      {
        protocol: 'https',
        hostname: 'pub-3764e3cd630540209ba5570c0c8c830f.r2.dev',
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
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.r2.dev https://images.unsplash.com https://*.tiktokcdn.com https://*.cdninstagram.com https://img.youtube.com https://i.ytimg.com https://i3.ytimg.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://*.sentry.io; worker-src 'self' blob:; frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://youtube.com https://www.instagram.com https://www.tiktok.com; media-src 'self' blob: https://*.supabase.co https://*.r2.dev; object-src 'none'; base-uri 'self'" },
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

// Sentry konfiguracija - uvija next config sa Sentry-ovim build pluginom
// koji uploaduje source maps i instrumentise build za bolji error reporting.
export default withSentryConfig(nextConfig, {
  // Sentry org i project (vidljivi i kao env varijable u CI)
  org: process.env.SENTRY_ORG || "yoursalesworld",
  project: process.env.SENTRY_PROJECT || "ugcexecutive",

  // Auth token za upload source maps (potreban samo u CI/build vremenu, NIKAD na klijentu)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tisi build output (ne logujemo svaki upload source map-a)
  silent: !process.env.CI,

  // Source maps: upload-uju se Sentry-u za citljive stack trace, a brisu se posle upload-a
  // (sigurnosno, da se source code ne moze rekonstruisati iz produkcijskog bundle-a)
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Disable Sentry telemetry (mi ne saljemo metriku Sentry-u o nasem build-u)
  telemetry: false,

  // Tunneling: rute koje pravimo /monitoring na nas server koji prosledjuje Sentry-u
  // Ovo zaobilazi ad-blocker-e koji blokiraju ingest.sentry.io
  tunnelRoute: "/monitoring",
});
