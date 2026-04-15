import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe, PLANS, getOrLookupPriceId, stripeSecretKey } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'
import { getPublicSiteOrigin } from '@/lib/site-url'

export const runtime = 'nodejs'

function logCheckoutError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    console.error('[stripe/public-checkout]', error.type, error.code ?? '', error.message)
    return
  }
  console.error('[stripe/public-checkout]', error)
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  const { success: rateLimitOk } = await rateLimit(`public-checkout:${ip}`, 10, 60000)
  if (!rateLimitOk) {
    return Response.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
  }

  if (!stripeSecretKey()) {
    console.error('[stripe/public-checkout] STRIPE_SECRET_KEY or STRIPE_SECRET is not set')
    return Response.json(
      { error: 'Checkout is not configured. Please contact support.' },
      { status: 503 },
    )
  }

  const body = await request.json() as { plan: string; email?: string }
  const { plan, email } = body

  const planKey = plan?.toUpperCase() as keyof typeof PLANS
  if (!planKey || !PLANS[planKey]) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const priceId = await getOrLookupPriceId(planKey)
    const baseUrl = getPublicSiteOrigin()

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/register?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
      cancel_url: `${baseUrl}/#pricing`,
      metadata: { plan: planKey },
    }

    if (email) {
      sessionParams.customer_email = email
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams)
    return Response.json({ url: checkoutSession.url })
  } catch (error) {
    logCheckoutError(error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
