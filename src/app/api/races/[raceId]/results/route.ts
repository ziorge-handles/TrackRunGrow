import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyRaceAccess(raceId: string, userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return null

  const race = await prisma.race.findUnique({ where: { id: raceId } })
  if (!race) return null

  if (!race.teamId) return race

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

export async function GET(
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

  const results = await prisma.raceResult.findMany({
    where: { raceId },
    include: {
      athlete: { include: { user: { select: { id: true, name: true } } } },
      trackEvent: true,
    },
    orderBy: { place: 'asc' },
  })

  return Response.json({ results })
}

export async function POST(
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
    results: Array<{
      athleteId: string
      resultValue: number
      place?: number
      teamPlace?: number
      trackEventId?: string
      notes?: string
      dnf?: boolean
      dns?: boolean
      dq?: boolean
    }>
  }

  if (!body.results || !Array.isArray(body.results)) {
    return Response.json({ error: 'results array is required' }, { status: 400 })
  }

  const saved: string[] = []
  const newPRs: string[] = []

  for (const result of body.results) {
    if (!result.athleteId || result.resultValue === undefined) continue

    // Upsert result
    const upserted = await prisma.raceResult.upsert({
      where: {
        id: (await prisma.raceResult.findFirst({
          where: { raceId, athleteId: result.athleteId, trackEventId: result.trackEventId ?? null },
        }))?.id ?? '',
      },
      update: {
        resultValue: result.resultValue,
        place: result.place,
        teamPlace: result.teamPlace,
        notes: result.notes,
        dnf: result.dnf ?? false,
        dns: result.dns ?? false,
        dq: result.dq ?? false,
      },
      create: {
        raceId,
        athleteId: result.athleteId,
        trackEventId: result.trackEventId,
        resultValue: result.resultValue,
        place: result.place,
        teamPlace: result.teamPlace,
        notes: result.notes,
        dnf: result.dnf ?? false,
        dns: result.dns ?? false,
        dq: result.dq ?? false,
      },
      include: {
        athlete: { include: { user: { select: { name: true } } } },
        trackEvent: true,
      },
    })

    saved.push(upserted.id)

    // Skip PR detection for DNF/DNS/DQ
    if (result.dnf || result.dns || result.dq) continue
    if (!result.trackEventId) continue

    const trackEvent = await prisma.trackEvent.findUnique({
      where: { id: result.trackEventId },
    })
    if (!trackEvent) continue

    // Check existing PR
    const existingPR = await prisma.personalBest.findUnique({
      where: {
        athleteId_trackEventId: {
          athleteId: result.athleteId,
          trackEventId: result.trackEventId,
        },
      },
    })

    const isNewPR = existingPR
      ? trackEvent.lowerIsBetter
        ? result.resultValue < existingPR.resultValue
        : result.resultValue > existingPR.resultValue
      : true

    if (isNewPR) {
      await prisma.personalBest.upsert({
        where: {
          athleteId_trackEventId: {
            athleteId: result.athleteId,
            trackEventId: result.trackEventId,
          },
        },
        update: {
          resultValue: result.resultValue,
          achievedAt: race.date,
          raceResultId: upserted.id,
        },
        create: {
          athleteId: result.athleteId,
          trackEventId: result.trackEventId,
          resultValue: result.resultValue,
          achievedAt: race.date,
          raceResultId: upserted.id,
        },
      })

      const athleteName = upserted.athlete.user.name ?? 'Unknown'
      const eventName = upserted.trackEvent?.name ?? 'Unknown Event'
      newPRs.push(`${athleteName} - ${eventName}`)
    }
  }

  return Response.json({ saved: saved.length, newPRs })
}
