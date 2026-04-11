import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, PLANS, getOrLookupPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as { plan: 'PRO' | 'ENTERPRISE' }
    const { plan } = body

    if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    let customerId = subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: 'BASIC',
          status: 'ACTIVE',
        },
      })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const priceId = await getOrLookupPriceId(plan)

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?success=true`,
      cancel_url: `${baseUrl}/settings?canceled=true`,
      metadata: { userId: session.user.id, plan },
    })

    return Response.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
