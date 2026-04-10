import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyTotpToken, verifyBackupCode, decryptSecret } from '@/lib/mfa'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token } = body
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  // Rate limit by user ID — 5 attempts per minute
  const { success: rateLimitOk } = rateLimit(`mfa-verify:${session.user.id}`, 5, 60000)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
  })

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: 'MFA is not enabled' }, { status: 400 })
  }

  // Decrypt the stored secret before verification
  const decryptedSecret = decryptSecret(user.mfaSecret)

  // Try TOTP first
  const totpValid = verifyTotpToken(decryptedSecret, token)
  if (totpValid) {
    return NextResponse.json({ valid: true })
  }

  // Try backup code
  const { valid, usedIndex } = await verifyBackupCode(token, user.mfaBackupCodes)
  if (valid) {
    // Remove used backup code
    const updatedCodes = user.mfaBackupCodes.filter((_, i) => i !== usedIndex)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaBackupCodes: updatedCodes },
    })
    return NextResponse.json({ valid: true, backupCodeUsed: true, remainingCodes: updatedCodes.length })
  }

  return NextResponse.json({ valid: false })
}
