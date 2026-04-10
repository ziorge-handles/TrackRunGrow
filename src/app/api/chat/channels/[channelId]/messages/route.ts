import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ channelId: string }>
}

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelId } = await params
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100)

  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } })
  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  // Verify team access
  const hasAccess = await prisma.team.findFirst({
    where: {
      id: channel.teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
        { athletes: { some: { athlete: { userId: session.user.id } } } },
      ],
    },
  })
  if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const messages = await prisma.chatMessage.findMany({
    where: {
      channelId,
      deletedAt: null,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      reactions: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, image: true },
  })
  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]))

  const enriched = messages
    .map((m) => ({ ...m, sender: senderMap[m.senderId] ?? null }))
    .reverse() // newest-last

  return NextResponse.json({
    messages: enriched,
    nextCursor: messages.length === limit ? messages[messages.length - 1]?.createdAt.toISOString() : null,
  })
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channelId } = await params

  let body: { body?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.body?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const channel = await prisma.chatChannel.findUnique({ where: { id: channelId } })
  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  // Verify access
  const hasAccess = await prisma.team.findFirst({
    where: {
      id: channel.teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
        { athletes: { some: { athlete: { userId: session.user.id } } } },
      ],
    },
  })
  if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const message = await prisma.chatMessage.create({
    data: { channelId, senderId: session.user.id, body: body.body },
    include: { reactions: true },
  })

  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true },
  })

  return NextResponse.json({ ...message, sender }, { status: 201 })
}
