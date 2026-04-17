import { NextRequest, NextResponse } from 'next/server'

// Next.js 16 proxy — runs on matched routes.
// Reads request cookies for optimistic auth checks — no DB calls.
// Use NextRequest.cookies (see Next.js proxy docs); do not use cookies() from
// next/headers here — that API is for Server Components / Route Handlers.
// Actual role verification happens server-side in layouts/API routes.

/** True if the request carries an Auth.js session cookie (including JWT chunks). */
function hasAuthJsSessionCookie(req: NextRequest): boolean {
  for (const { name } of req.cookies.getAll()) {
    if (name === 'authjs.session-token' || name === '__Secure-authjs.session-token') {
      return true
    }
    if (
      name.startsWith('authjs.session-token.') ||
      name.startsWith('__Secure-authjs.session-token.')
    ) {
      return true
    }
  }
  return false
}

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
  // Vercel Analytics / Speed Insights inject these; must not redirect to login (would serve HTML as JS).
  if (path.startsWith('/_vercel')) return true
  if (path.startsWith('/favicon')) return true
  if (path === '/robots.txt' || path === '/sitemap.xml' || path === '/opengraph-image') return true

  // Marketing page anchor sections
  if (path.startsWith('/#')) return true

  return false
}

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (isPublicPath(path)) {
    return NextResponse.next()
  }

  if (!hasAuthJsSessionCookie(req)) {
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
