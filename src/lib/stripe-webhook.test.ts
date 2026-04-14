import { describe, it, expect, vi, afterEach } from 'vitest'
import type Stripe from 'stripe'
import { getPlanFromPriceId, mapStripeStatus } from './stripe-webhook'

describe('getPlanFromPriceId', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('maps configured Stripe price IDs', () => {
    process.env.STRIPE_BASIC_PRICE_ID = 'price_basic_x'
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_x'
    process.env.STRIPE_ENTERPRISE_PRICE_ID = 'price_ent_x'

    expect(getPlanFromPriceId('price_basic_x')).toBe('BASIC')
    expect(getPlanFromPriceId('price_pro_x')).toBe('PRO')
    expect(getPlanFromPriceId('price_ent_x')).toBe('ENTERPRISE')
  })

  it('defaults unknown price IDs to BASIC', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.STRIPE_BASIC_PRICE_ID = ''
    delete process.env.STRIPE_PRO_PRICE_ID
    delete process.env.STRIPE_ENTERPRISE_PRICE_ID

    expect(getPlanFromPriceId('price_unknown')).toBe('BASIC')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('mapStripeStatus', () => {
  it('maps Stripe subscription statuses to Prisma enums', () => {
    expect(mapStripeStatus('active')).toBe('ACTIVE')
    expect(mapStripeStatus('past_due')).toBe('PAST_DUE')
    expect(mapStripeStatus('canceled')).toBe('CANCELED')
    expect(mapStripeStatus('trialing')).toBe('TRIALING')
    expect(mapStripeStatus('incomplete')).toBe('INCOMPLETE')
    expect(mapStripeStatus('incomplete_expired')).toBe('INCOMPLETE')
    expect(mapStripeStatus('unpaid')).toBe('PAST_DUE')
  })

  it('defaults unfamiliar statuses to ACTIVE', () => {
    expect(
      mapStripeStatus('not_a_stripe_status' as Stripe.Subscription.Status),
    ).toBe('ACTIVE')
  })
})
