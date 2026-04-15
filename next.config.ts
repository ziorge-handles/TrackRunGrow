import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

/**
 * Production-only CSP: avoids blocking Next.js dev WebSockets / HMR on localhost.
 * Adjust if you add new third-party scripts or API hosts.
 */
function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.ingest.sentry.io https://*.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.upstash.io",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ')
}

const nextConfig: NextConfig = {
  async headers() {
    const baseHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ] as { key: string; value: string }[]

    if (process.env.NODE_ENV === 'production') {
      baseHeaders.push({
        key: 'Content-Security-Policy',
        value: contentSecurityPolicy(),
      })
    }

    return [
      {
        source: '/(.*)',
        headers: baseHeaders,
      },
    ]
  },
}

const sentryEnabled =
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT &&
  !!process.env.SENTRY_AUTH_TOKEN

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig
