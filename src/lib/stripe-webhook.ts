import type { SubscriptionPlan, SubscriptionStatus } from '@/generated/prisma/client'
import type Stripe from 'stripe'

export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return 'BASIC'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO'
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'ENTERPRISE'

  console.warn(
    `[stripe-webhook] Unrecognised price ID "${priceId}" — defaulting to BASIC. ` +
      'Check STRIPE_BASIC_PRICE_ID, STRIPE_PRO_PRICE_ID, and STRIPE_ENTERPRISE_PRICE_ID env vars.',
  )
  return 'BASIC'
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
      return 'CANCELED'
    case 'trialing':
      return 'TRIALING'
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE'
    case 'unpaid':
      return 'PAST_DUE'
    default:
      return 'ACTIVE'
  }
}
