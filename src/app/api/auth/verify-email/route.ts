import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    redirect('/login?verify_error=missing')
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
    redirect('/login?verify_error=invalid')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    redirect('/login?verify_error=invalid')
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
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

  redirect('/login?verified=true')
}
