import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyAthleteAccess(athleteId: string, userId: string, role: string) {
  if (role === 'ATHLETE') {
    const ownAthlete = await prisma.athlete.findUnique({ where: { userId } })
    return ownAthlete?.id === athleteId ? ownAthlete : null
  }

  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return null

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: { teams: true },
  })
  if (!athlete) return null

  const teamIds = athlete.teams.map((at) => at.teamId)
  const hasAccess = await prisma.team.findFirst({
    where: {
      id: { in: teamIds },
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
  })

  return hasAccess ? athlete : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { athleteId } = await params
  const access = await verifyAthleteAccess(athleteId, session.user.id, session.user.role)
  if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const results = await prisma.raceResult.findMany({
    where: { athleteId },
    include: {
      race: { select: { id: true, name: true, date: true, sport: true, location: true } },
      trackEvent: { select: { id: true, name: true, unitLabel: true, lowerIsBetter: true } },
    },
    orderBy: { recordedAt: 'desc' },
  })

  // Check PR status for each result
  const personalBests = await prisma.personalBest.findMany({
    where: { athleteId },
    select: { raceResultId: true, trackEventId: true },
  })
  const prResultIds = new Set(personalBests.map((pb) => pb.raceResultId).filter(Boolean))

  const resultsWithPR = results.map((r) => ({
    ...r,
    isPR: prResultIds.has(r.id),
  }))

  return Response.json({ results: resultsWithPR })
}
