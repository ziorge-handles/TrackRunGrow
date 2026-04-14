import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Next.js 16 proxy — runs on every matched route (Edge Runtime).
// Reads cookies for optimistic auth checks — no DB calls.
// Actual role verification happens server-side in layouts/API routes.

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
  '/accept-invitation',
  '/contact',
  '/demo',
  '/terms',
  '/privacy',
  '/cookies',
])

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true

  // API routes with their own auth handling
  if (path.startsWith('/api/auth')) return true
  if (path.startsWith('/api/stripe/webhook')) return true
  if (path.startsWith('/api/stripe/public-checkout')) return true
  if (path.startsWith('/api/stripe/session-info')) return true
  if (path.startsWith('/api/invitations')) return true
  if (path.startsWith('/api/contact')) return true

  // Public GET for approved reviews; POST has its own rate limit
  if (path.startsWith('/api/reviews') && !path.includes('/all') && !path.includes('/approve')) return true

  // Static assets, images, Next.js internals
  if (path.startsWith('/_next')) return true
  if (path.startsWith('/favicon')) return true
  if (path === '/robots.txt' || path === '/sitemap.xml' || path === '/opengraph-image') return true

  // Marketing page anchor sections
  if (path.startsWith('/#')) return true

  return false
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (isPublicPath(path)) {
    return NextResponse.next()
  }

  const cookieStore = await cookies()
  const sessionToken =
    cookieStore.get('authjs.session-token')?.value ??
    cookieStore.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', req.nextUrl)
    const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
    loginUrl.searchParams.set('callbackUrl', fullPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|public/).*)'],
}
