import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  if (!subscription?.stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 404 })
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    })

    return Response.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return Response.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
