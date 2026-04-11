import Stripe from 'stripe'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
}

// Lazily initialized to avoid build-time errors when env vars are absent
let _stripe: Stripe | null = null
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = getStripe()
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLANS = {
  BASIC: {
    name: 'Basic',
    price: 500,
    desc: '1 team, up to 25 athletes',
    productId: 'prod_UJOikMne3gJpG6',
    priceId: process.env.STRIPE_BASIC_PRICE_ID || null,
    features: [
      '1 team',
      'Up to 25 athletes',
      'Performance tracking',
      'Race results',
      'Workout logs',
      'Calendar',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 2900,
    desc: 'Unlimited teams, unlimited athletes',
    productId: 'prod_UJOig6QDIp9DQ2',
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    features: [
      'Unlimited teams',
      'Unlimited athletes',
      'AI workout suggestions',
      'Advanced analytics & projections',
      'Coach invitations',
      'Body metrics tracking',
      'Full calendar',
      'Athlete portal',
      'Meet lineups',
      'CSV import/export',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 9900,
    desc: 'For large programs and districts',
    productId: 'prod_UJOimgRsRBmTMd',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
    features: [
      'Everything in Pro',
      'Multi-school support',
      'Custom branding',
      'Priority support',
      'Data export API',
    ],
  },
} as const

export async function getOrLookupPriceId(plan: keyof typeof PLANS): Promise<string> {
  const planConfig = PLANS[plan]
  if (planConfig.priceId) return planConfig.priceId

  const prices = await stripe.prices.list({
    product: planConfig.productId,
    active: true,
    limit: 1,
    type: 'recurring',
  })

  if (prices.data.length === 0) {
    throw new Error(
      `No active recurring price for product ${planConfig.productId}. ` +
        `Set STRIPE_${plan}_PRICE_ID for this plan in the environment, or create an active price in Stripe.`,
    )
  }
  return prices.data[0].id
}
