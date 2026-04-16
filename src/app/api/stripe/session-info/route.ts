import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = await rateLimit(`session-info:${ip}`, 10, 60_000)
  if (!rl.success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  const checkoutRef = request.nextUrl.searchParams.get('ref')

  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 200) {
    return Response.json({ error: 'Missing or invalid session_id' }, { status: 400 })
  }

  if (!checkoutRef || !/^[a-f0-9]{32}$/.test(checkoutRef)) {
    return Response.json({ error: 'Missing or invalid ref' }, { status: 400 })
  }

  // Only allow Stripe checkout session IDs (cs_live_* or cs_test_*)
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ error: 'Invalid session_id format' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.client_reference_id !== checkoutRef) {
      return Response.json({ error: 'Invalid session' }, { status: 403 })
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 402 })
    }

    return Response.json({
      email: session.customer_details?.email ?? session.customer_email ?? null,
      plan: (session.metadata?.plan ?? 'BASIC').toUpperCase(),
    })
  } catch (error) {
    console.error('Failed to retrieve Stripe session:', error)
    return Response.json({ error: 'Invalid session' }, { status: 400 })
  }
}
