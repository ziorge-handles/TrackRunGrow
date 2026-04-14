import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { BCRYPT_ROUNDS } from '@/lib/constants'
import { issueEmailVerification } from '@/lib/issue-email-verification'
import { stripe } from '@/lib/stripe'
import type { CoachRole, SubscriptionPlan } from '@/generated/prisma/client'
import { registerSchema } from '@/lib/register-schema'

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = await rateLimit(`register:${ip}`, 5, 60000)
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

    const { name, password, stripeSessionId, inviteToken } = result.data

    let resolvedEmail: string
    let stripeCustomerId: string | null = null
    let plan: SubscriptionPlan = 'BASIC'
    let stripeSubscriptionId: string | null = null
    let pendingInvite: {
      id: string
      teamId: string
      coachRole: CoachRole
    } | null = null

    if (inviteToken) {
      const invitation = await prisma.teamInvitation.findUnique({
        where: { token: inviteToken },
      })

      if (!invitation) {
        return NextResponse.json({ error: 'Invalid invitation.' }, { status: 400 })
      }
      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { error: `This invitation is no longer valid (${invitation.status}).` },
          { status: 410 },
        )
      }
      if (invitation.expiresAt < new Date()) {
        await prisma.teamInvitation.update({
          where: { token: inviteToken },
          data: { status: 'EXPIRED' },
        })
        return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
      }

      resolvedEmail = invitation.invitedEmail.trim()
      pendingInvite = {
        id: invitation.id,
        teamId: invitation.teamId,
        coachRole: invitation.coachRole,
      }
    } else if (stripeSessionId) {
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
        resolvedEmail = (stripeEmail ?? result.data.email ?? '').trim()
        if (!resolvedEmail) {
          return NextResponse.json({ error: 'Could not resolve email from checkout.' }, { status: 400 })
        }

        stripeCustomerId = session.customer as string
        const planMeta = (session.metadata?.plan ?? 'BASIC').toUpperCase()
        if (['BASIC', 'PRO', 'ENTERPRISE'].includes(planMeta)) {
          plan = planMeta as SubscriptionPlan
        }
        if (session.subscription) {
          const sub =
            typeof session.subscription === 'string'
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
    } else {
      return NextResponse.json(
        { error: 'Complete payment or open a valid team invitation link to register.' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: resolvedEmail, mode: 'insensitive' } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in to accept the invitation.' },
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
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
      },
    })

    if (pendingInvite) {
      const stillPending = await prisma.teamInvitation.findFirst({
        where: {
          id: pendingInvite.id,
          status: 'PENDING',
          expiresAt: { gte: new Date() },
        },
      })
      if (stillPending) {
        const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
        if (coach) {
          const existingCt = await prisma.coachTeam.findUnique({
            where: {
              coachId_teamId: {
                coachId: coach.id,
                teamId: pendingInvite.teamId,
              },
            },
          })
          if (!existingCt) {
            await prisma.coachTeam.create({
              data: {
                coachId: coach.id,
                teamId: pendingInvite.teamId,
                coachRole: pendingInvite.coachRole,
                isPrimary: false,
              },
            })
          }
          await prisma.teamInvitation.update({
            where: { id: pendingInvite.id },
            data: { status: 'ACCEPTED', acceptedAt: new Date() },
          })
        }
      }
    }

    try {
      await issueEmailVerification(resolvedEmail)
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
