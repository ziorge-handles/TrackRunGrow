import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { BCRYPT_ROUNDS } from '@/lib/constants'
import { randomBytes, createHash } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    // Rate limit by IP
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

    const { name, email, password } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
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
        email,
        passwordHash,
        role: 'COACH',
        coachProfile: {
          create: {},
        },
      },
    })

    // Generate email verification token
    const verifyToken = randomBytes(32).toString('hex')
    const hashedVerifyToken = createHash('sha256').update(verifyToken).digest('hex')
    const verifyExpires = new Date(Date.now() + 24 * 3600000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedVerifyToken,
        expires: verifyExpires,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    try {
      await sendVerificationEmail({
        to: email,
        verifyUrl: `${baseUrl}/api/auth/verify-email?token=${verifyToken}&email=${email}`,
      })
    } catch (e) {
      console.error('Failed to send verification email:', e)
    }

    return NextResponse.json(
      { message: 'Account created successfully. Please check your email to verify your account.', userId: user.id },
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
