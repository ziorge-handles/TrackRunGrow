import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ lineupId: string }>
}

interface EntryInput {
  athleteId: string
  trackEventId?: string
  heatNumber?: number
  laneNumber?: number
  seedTime?: number
  qualifyingMark?: number
  notes?: string
  order?: number
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lineupId } = await params

  const lineup = await prisma.meetLineup.findUnique({ where: { id: lineupId } })
  if (!lineup) return NextResponse.json({ error: 'Lineup not found' }, { status: 404 })

  const team = await prisma.team.findFirst({
    where: {
      id: lineup.teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  if (lineup.isFinalized) {
    return NextResponse.json({ error: 'Cannot modify a finalized lineup' }, { status: 400 })
  }

  let body: EntryInput[]
  try {
    body = await request.json()
    if (!Array.isArray(body)) throw new Error('Expected array')
  } catch {
    return NextResponse.json({ error: 'Body must be an array of entry objects' }, { status: 400 })
  }

  const athleteIds = [...new Set(body.map((e) => e.athleteId))]
  const teamAthletes = await prisma.athleteTeam.findMany({
    where: { teamId: lineup.teamId, athleteId: { in: athleteIds }, leftAt: null },
    select: { athleteId: true },
  })
  const validIds = new Set(teamAthletes.map((a) => a.athleteId))
  const validEntries = body.filter((e) => validIds.has(e.athleteId))
  if (validEntries.length === 0) {
    return NextResponse.json({ error: 'No valid athletes for this team' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of validEntries) {
      await tx.lineupEntry.deleteMany({
        where: {
          lineupId,
          athleteId: entry.athleteId,
          ...(entry.trackEventId ? { trackEventId: entry.trackEventId } : {}),
        },
      })

      await tx.lineupEntry.create({
        data: {
          lineupId,
          athleteId: entry.athleteId,
          trackEventId: entry.trackEventId ?? null,
          heatNumber: entry.heatNumber ?? null,
          laneNumber: entry.laneNumber ?? null,
          seedTime: entry.seedTime ?? null,
          qualifyingMark: entry.qualifyingMark ?? null,
          notes: entry.notes ?? null,
          order: entry.order ?? 0,
        },
      })
    }
  })

  const updatedLineup = await prisma.meetLineup.findUnique({
    where: { id: lineupId },
    include: {
      entries: {
        include: {
          athlete: { include: { user: { select: { name: true } } } },
          trackEvent: true,
        },
      },
    },
  })

  return NextResponse.json(updatedLineup)
}
