import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  // If teamId provided, return channels for that team (with access check)
  if (teamId) {
    const hasAccess = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coach: { userId: session.user.id } } } },
          { athletes: { some: { athlete: { userId: session.user.id } } } },
        ],
      },
    })
    if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const channels = await prisma.chatChannel.findMany({
      where: { teamId },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ isGeneral: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(channels)
  }

  // No teamId: return all channels from teams the user belongs to
  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
        { athletes: { some: { athlete: { userId: session.user.id } } } },
      ],
    },
    select: { id: true, name: true },
  })

  const teamIds = teams.map((t) => t.id)
  const teamNameMap = Object.fromEntries(teams.map((t) => [t.id, t.name]))

  const channels = await prisma.chatChannel.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ isGeneral: 'desc' }, { createdAt: 'asc' }],
  })

  const enrichedChannels = channels.map((ch) => ({
    ...ch,
    teamName: teamNameMap[ch.teamId] || 'Unknown',
  }))

  return NextResponse.json({ channels: enrichedChannels })
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { teamId?: string; name?: string; isGeneral?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamId, name, isGeneral } = body
  if (!teamId || !name) return NextResponse.json({ error: 'teamId and name are required' }, { status: 400 })

  // Only coaches can create channels
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const channel = await prisma.chatChannel.create({
    data: { teamId, name, isGeneral: isGeneral ?? false },
  })

  return NextResponse.json(channel, { status: 201 })
}
