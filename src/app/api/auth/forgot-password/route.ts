import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes, createHash } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = await rateLimit(`forgot-${ip}`, 3, 3600000) // 3 per hour
  if (!rl.success) return Response.json({ message: 'Check your email for reset instructions.' })

  const { email } = await request.json() as { email: string }
  if (!email) return Response.json({ message: 'Check your email for reset instructions.' })

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(token).digest('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Use VerificationToken table
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token: hashedToken } },
      update: { expires },
      create: { identifier: email, token: hashedToken, expires },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    try {
      await sendPasswordResetEmail({ to: email, resetUrl: `${baseUrl}/reset-password?token=${token}&email=${email}` })
    } catch (e) { console.error('Failed to send reset email:', e) }
  }

  return Response.json({ message: 'If an account exists with that email, you will receive reset instructions.' })
}
