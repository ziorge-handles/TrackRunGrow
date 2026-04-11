import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMessageNotification } from '@/lib/email'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)

  const messages = await prisma.message.findMany({
    where: { recipients: { some: { userId: session.user.id } } },
    include: {
      recipients: {
        where: { userId: session.user.id },
        select: { isRead: true, readAt: true },
      },
    },
    orderBy: { sentAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  const senderIds = [...new Set(messages.map((m) => m.senderId))]
  const senders = await prisma.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, email: true, image: true },
  })
  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]))

  const enriched = messages.map((m) => ({
    ...m,
    sender: senderMap[m.senderId] ?? null,
    isRead: m.recipients[0]?.isRead ?? false,
    readAt: m.recipients[0]?.readAt ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    subject?: string
    body?: string
    recipientIds?: string[]
    teamId?: string
    sendEmail?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { subject, body: msgBody, recipientIds, teamId, sendEmail } = body
  if (!msgBody) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
    include: {
      athletes: { include: { athlete: { include: { user: { select: { id: true } } } } } },
      coaches: { include: { coach: { include: { user: { select: { id: true } } } } } },
    },
  })
  if (!team) return NextResponse.json({ error: 'Team not found or access denied' }, { status: 403 })

  const athleteUserIds = team.athletes.map((at) => at.athlete.user.id)
  const coachUserIds = team.coaches.map((ct) => ct.coach.user.id)
  const teamMemberIds = new Set([...athleteUserIds, ...coachUserIds])

  let finalRecipientIds: string[]

  if (recipientIds && recipientIds.length > 0) {
    finalRecipientIds = recipientIds.filter((id) => teamMemberIds.has(id) && id !== session.user.id)
    if (finalRecipientIds.length === 0) {
      return NextResponse.json({ error: 'None of the specified recipients are members of this team' }, { status: 400 })
    }
  } else {
    finalRecipientIds = [...teamMemberIds].filter((id) => id !== session.user.id)
  }

  if (finalRecipientIds.length === 0) {
    return NextResponse.json({ error: 'No recipients available' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      teamId: teamId ?? null,
      subject: subject ?? null,
      body: msgBody,
      type: 'IN_APP',
      recipients: {
        create: finalRecipientIds.map((userId) => ({ userId })),
      },
    },
  })

  // Optional email notifications
  if (sendEmail) {
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })
    const recipients = await prisma.user.findMany({
      where: { id: { in: finalRecipientIds } },
      select: { email: true },
    })
    const teamData = teamId ? await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }) : null

    await Promise.allSettled(
      recipients.map((r) =>
        sendMessageNotification({
          to: r.email,
          senderName: sender?.name ?? sender?.email ?? 'A coach',
          teamName: teamData?.name ?? 'Your Team',
          subject: subject ?? msgBody.slice(0, 80),
        }),
      ),
    )
  }

  return NextResponse.json(message, { status: 201 })
}
