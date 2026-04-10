import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

interface Params {
  params: Promise<{ feeId: string }>
}

export async function POST(_request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { feeId } = await params

  // Get the athlete record for the current user
  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!athlete) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fee = await prisma.teamFee.findUnique({ where: { id: feeId } })
  if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

  // Verify athlete has a payment record for this fee
  const payment = await prisma.feePayment.findUnique({
    where: { feeId_athleteId: { feeId, athleteId: athlete.id } },
  })
  if (!payment) return NextResponse.json({ error: 'No payment record found for this athlete' }, { status: 404 })
  if (payment.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: fee.amount, // already in cents
      currency: 'usd',
      metadata: {
        feeId,
        athleteId: athlete.id,
        feeName: fee.name,
      },
      description: `${fee.name} — TrackRunGrow`,
    })

    // Save the payment intent ID
    await prisma.feePayment.update({
      where: { feeId_athleteId: { feeId, athleteId: athlete.id } },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (e) {
    console.error('Stripe error:', e)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
