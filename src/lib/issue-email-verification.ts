import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

/**
 * Creates a fresh verification token (invalidates previous tokens for this email)
 * and sends the verification email. Uses the canonical `user.email` as the token identifier.
 */
export async function issueEmailVerification(email: string): Promise<void> {
  const verifyToken = randomBytes(32).toString('hex')
  const hashedVerifyToken = createHash('sha256').update(verifyToken).digest('hex')
  const verifyExpires = new Date(Date.now() + 24 * 3600000)

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedVerifyToken,
      expires: verifyExpires,
    },
  })

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000'

  await sendVerificationEmail({
    to: email,
    verifyUrl: `${baseUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`,
  })
}
