import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { BCRYPT_ROUNDS } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = rateLimit(`reset-${ip}`, 5, 3600000) // 5 per hour
  if (!rl.success) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const { token, email, password } = await request.json() as {
    token: string
    email: string
    password: string
  }

  if (!token || !email || !password) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const hashedToken = createHash('sha256').update(token).digest('hex')

  // Find the verification token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashedToken,
      expires: { gt: new Date() },
    },
  })

  if (!verificationToken) {
    return Response.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 })
  }

  // Find the user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  // Hash new password and update user
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  // Delete the used verification token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token: hashedToken,
      },
    },
  })

  return Response.json({ message: 'Password reset successfully. You can now sign in with your new password.' })
}
