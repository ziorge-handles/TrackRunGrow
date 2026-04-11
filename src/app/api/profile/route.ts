import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, coach] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    }),
    prisma.coach.findUnique({
      where: { userId: session.user.id },
      select: { phoneNumber: true, bio: true, customAccentColor: true, customLogoUrl: true },
    }),
  ])

  return NextResponse.json({
    name: user?.name ?? '',
    email: user?.email ?? '',
    image: user?.image ?? '',
    phone: coach?.phoneNumber ?? '',
    bio: coach?.bio ?? '',
    customAccentColor: coach?.customAccentColor ?? '',
    customLogoUrl: coach?.customLogoUrl ?? '',
  })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, phone, bio, customAccentColor, customLogoUrl } = body as {
    name?: string; phone?: string; bio?: string;
    customAccentColor?: string; customLogoUrl?: string
  }

  if (name !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })
  }

  if (phone !== undefined || bio !== undefined || customAccentColor !== undefined || customLogoUrl !== undefined) {
    const updateData: Record<string, string> = {}
    if (phone !== undefined) updateData.phoneNumber = phone
    if (bio !== undefined) updateData.bio = bio
    if (customAccentColor !== undefined) updateData.customAccentColor = customAccentColor
    if (customLogoUrl !== undefined) updateData.customLogoUrl = customLogoUrl

    await prisma.coach.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })
  }

  return NextResponse.json({ success: true })
}
