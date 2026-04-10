import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTotpSecret, verifyTotpToken, generateBackupCodes, hashBackupCode, encryptSecret } from '@/lib/mfa'
import QRCode from 'qrcode'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  if (!user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { secret, uri } = generateTotpSecret(user.email)
  const qrCodeDataUrl = await QRCode.toDataURL(uri)

  return NextResponse.json({ secret, qrCodeDataUrl, uri })
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { token?: string; secret?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, secret } = body
  if (!token || !secret) {
    return NextResponse.json({ error: 'token and secret are required' }, { status: 400 })
  }

  const isValid = verifyTotpToken(secret, token)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  // Generate backup codes
  const plainCodes = generateBackupCodes()
  const hashedCodes = await Promise.all(plainCodes.map(hashBackupCode))

  // Encrypt secret before storing
  const encryptedSecret = encryptSecret(secret)

  // Save to DB
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: encryptedSecret,
      mfaEnabled: true,
      mfaBackupCodes: hashedCodes,
    },
  })

  return NextResponse.json({ backupCodes: plainCodes })
}
