import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ lineupId: string }>
}

async function getLineupWithAccess(lineupId: string, userId: string) {
  const lineup = await prisma.meetLineup.findUnique({
    where: { id: lineupId },
    include: {
      entries: {
        include: {
          athlete: { include: { user: { select: { name: true, email: true } } } },
          trackEvent: true,
        },
        orderBy: [{ trackEventId: 'asc' }, { heatNumber: 'asc' }, { laneNumber: 'asc' }],
      },
    },
  })
  if (!lineup) return null

  const team = await prisma.team.findFirst({
    where: {
      id: lineup.teamId,
      OR: [
        { ownerId: userId },
        { coaches: { some: { coach: { userId } } } },
      ],
    },
  })
  if (!team) return null

  return lineup
}

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lineupId } = await params
  const lineup = await getLineupWithAccess(lineupId, session.user.id)
  if (!lineup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(lineup)
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lineupId } = await params
  const lineup = await getLineupWithAccess(lineupId, session.user.id)
  if (!lineup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { name?: string; notes?: string; isFinalized?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updated = await prisma.meetLineup.update({
    where: { id: lineupId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.isFinalized !== undefined ? { isFinalized: body.isFinalized } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lineupId } = await params
  const lineup = await getLineupWithAccess(lineupId, session.user.id)
  if (!lineup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.meetLineup.delete({ where: { id: lineupId } })
  return NextResponse.json({ success: true })
}
