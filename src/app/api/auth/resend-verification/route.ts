import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { issueEmailVerification } from '@/lib/issue-email-verification'

const bodySchema = z.object({
  email: z.string().email().max(254),
})

const GENERIC_OK = {
  message:
    'If this account exists and still needs verification, we sent a new link. Check your inbox and spam folder.',
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'

  const ipRl = await rateLimit(`resend-verify:ip:${ip}`, 5, 60 * 60_000)
  if (!ipRl.success) {
    return NextResponse.json(GENERIC_OK)
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const normalized = parsed.data.email.trim().toLowerCase()

  const emailRl = await rateLimit(`resend-verify:email:${normalized}`, 3, 60 * 60_000)
  if (!emailRl.success) {
    return NextResponse.json(GENERIC_OK)
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
  })

  if (!user?.passwordHash || user.emailVerified) {
    return NextResponse.json(GENERIC_OK)
  }

  try {
    await issueEmailVerification(user.email)
  } catch (e) {
    console.error('Resend verification email failed:', e)
    return NextResponse.json(
      { error: 'Could not send email right now. Please try again in a few minutes.' },
      { status: 503 },
    )
  }

  return NextResponse.json(GENERIC_OK)
}
