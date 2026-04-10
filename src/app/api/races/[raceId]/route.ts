import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyRaceAccess(raceId: string, userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return null

  const race = await prisma.race.findUnique({ where: { id: raceId } })
  if (!race) return null

  if (race.teamId) {
    // Race belongs to a team — verify user has access to that team
    const team = await prisma.team.findFirst({
      where: {
        id: race.teamId,
        OR: [
          { ownerId: userId },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    return team ? race : null
  }

  // Unattached race — allow access only if the user's teams have athletes with results in this race
  const accessibleTeams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    select: { id: true },
  })
  const teamIds = accessibleTeams.map((t) => t.id)

  const resultFromAccessibleAthlete = await prisma.raceResult.findFirst({
    where: {
      raceId,
      athlete: { teams: { some: { teamId: { in: teamIds } } } },
    },
  })

  return resultFromAccessibleAthlete ? race : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raceId } = await params

  const accessCheck = await verifyRaceAccess(raceId, session.user.id)
  if (!accessCheck) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      results: {
        include: {
          athlete: { include: { user: { select: { id: true, name: true } } } },
          trackEvent: true,
        },
        orderBy: { place: 'asc' },
      },
    },
  })

  if (!race) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  return Response.json({ race })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raceId } = await params
  const race = await verifyRaceAccess(raceId, session.user.id)
  if (!race) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const body = await request.json() as {
    name?: string
    date?: string
    location?: string
    isHome?: boolean
    courseDescription?: string
    notes?: string
  }

  const updated = await prisma.race.update({
    where: { id: raceId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.isHome !== undefined && { isHome: body.isHome }),
      ...(body.courseDescription !== undefined && { courseDescription: body.courseDescription }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })

  return Response.json({ race: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raceId } = await params
  const race = await verifyRaceAccess(raceId, session.user.id)
  if (!race) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  await prisma.race.delete({ where: { id: raceId } })

  return Response.json({ success: true })
}
