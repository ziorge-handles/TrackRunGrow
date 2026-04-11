import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  let body: { token?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, email } = body

  if (!token || !email) {
    return Response.json({ error: 'Missing token or email' }, { status: 400 })
  }

  const hashedToken = createHash('sha256').update(token).digest('hex')

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashedToken,
      expires: { gt: new Date() },
    },
  })

  if (!verificationToken) {
    return Response.json({ error: 'Invalid or expired verification link' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: email,
        token: hashedToken,
      },
    },
  })

  return Response.json({ verified: true })
}
