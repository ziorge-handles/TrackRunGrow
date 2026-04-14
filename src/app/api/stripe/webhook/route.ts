import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type { SubscriptionPlan } from '@/generated/prisma/client'
import type Stripe from 'stripe'
import { getPlanFromPriceId, mapStripeStatus } from '@/lib/stripe-webhook'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.userId
        const planKey = (session.metadata?.plan ?? 'BASIC') as SubscriptionPlan

        if (!userId) break

        // Retrieve the subscription to get current period end (per-item in dahlia API)
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const firstItem = stripeSub.items.data[0]
        const priceId = firstItem?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : planKey
        const periodEnd = firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000)
          : null

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: 'ACTIVE',
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
          create: {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: 'ACTIVE',
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription
        const firstItem = stripeSub.items.data[0]
        const priceId = firstItem?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : 'BASIC'
        const status = mapStripeStatus(stripeSub.status)
        const periodEnd = firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000)
          : null

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSub.id },
          data: {
            plan,
            status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSub.id },
          data: {
            status: 'CANCELED',
            plan: 'BASIC',
            cancelAtPeriodEnd: false,
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // In Stripe dahlia API, subscription is nested under parent.subscription_details
        const subRef = invoice.parent?.subscription_details?.subscription
        const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id

        if (!subscriptionId) break

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'PAST_DUE' },
        })
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook handler error:', message)
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}
