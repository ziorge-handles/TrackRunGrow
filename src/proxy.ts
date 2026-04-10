import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Next.js 16 proxy — runs on every matched route (Edge Runtime).
// Only reads cookies for optimistic auth checks — no DB calls.
// Actual role verification happens server-side in layouts/API routes.

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Public routes — always allowed
  if (
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/stripe/webhook') ||
    path.startsWith('/api/invitations') ||
    path.startsWith('/api/reviews/all') ||
    path.startsWith('/accept-invitation')
  ) {
    return NextResponse.next()
  }

  // Check for NextAuth session token (JWT strategy stores in this cookie)
  const cookieStore = await cookies()
  const sessionToken =
    cookieStore.get('authjs.session-token')?.value ??
    cookieStore.get('__Secure-authjs.session-token')?.value

  // No session → redirect to login
  if (!sessionToken && (path.startsWith('/dashboard') || path.startsWith('/portal'))) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|public/).*)'],
}
