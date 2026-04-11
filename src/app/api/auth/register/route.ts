import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { BCRYPT_ROUNDS } from '@/lib/constants'
import { randomBytes, createHash } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { stripe } from '@/lib/stripe'
import type { SubscriptionPlan } from '@/generated/prisma/client'

const registerSchema = z.object({
  name: z.string().min(2).max(100, 'Name too long'),
  email: z.string().email().max(254, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  stripeSessionId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = rateLimit(`register:${ip}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email: clientEmail, password, stripeSessionId } = result.data

    let resolvedEmail = clientEmail
    let stripeCustomerId: string | null = null
    let plan: SubscriptionPlan = 'BASIC'
    let stripeSubscriptionId: string | null = null

    if (stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
          expand: ['subscription'],
        })

        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          return NextResponse.json(
            { error: 'Payment not completed. Please complete checkout first.' },
            { status: 402 },
          )
        }

        const stripeEmail = session.customer_details?.email ?? session.customer_email
        if (stripeEmail) {
          resolvedEmail = stripeEmail
        }

        stripeCustomerId = session.customer as string
        const planMeta = (session.metadata?.plan ?? 'BASIC').toUpperCase()
        if (['BASIC', 'PRO', 'ENTERPRISE'].includes(planMeta)) {
          plan = planMeta as SubscriptionPlan
        }
        if (session.subscription) {
          const sub = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
          stripeSubscriptionId = sub
        }
      } catch (e) {
        console.error('Failed to verify Stripe session:', e)
        return NextResponse.json(
          { error: 'Could not verify payment session.' },
          { status: 400 },
        )
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: resolvedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        name,
        email: resolvedEmail,
        passwordHash,
        role: 'COACH',
        coachProfile: {
          create: {},
        },
      },
    })

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: stripeCustomerId ? 'ACTIVE' : 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
      },
    })

    const verifyToken = randomBytes(32).toString('hex')
    const hashedVerifyToken = createHash('sha256').update(verifyToken).digest('hex')
    const verifyExpires = new Date(Date.now() + 24 * 3600000)

    await prisma.verificationToken.create({
      data: {
        identifier: resolvedEmail,
        token: hashedVerifyToken,
        expires: verifyExpires,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    try {
      await sendVerificationEmail({
        to: resolvedEmail,
        verifyUrl: `${baseUrl}/verify-email?token=${verifyToken}&email=${resolvedEmail}`,
      })
    } catch (e) {
      console.error('Failed to send verification email:', e)
    }

    return NextResponse.json(
      { message: 'Account created successfully.', userId: user.id },
      { status: 201 },
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
