import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyTotpToken, verifyBackupCode } from '@/lib/mfa'

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
  })

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: 'MFA is not enabled' }, { status: 400 })
  }

  // Verify via TOTP or backup code
  const totpValid = verifyTotpToken(user.mfaSecret, token)
  if (!totpValid) {
    const { valid } = await verifyBackupCode(token, user.mfaBackupCodes)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }
  }

  // Disable MFA
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: null,
      mfaEnabled: false,
      mfaBackupCodes: [],
    },
  })

  return NextResponse.json({ success: true })
}
