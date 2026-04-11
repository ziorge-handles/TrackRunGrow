import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

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
