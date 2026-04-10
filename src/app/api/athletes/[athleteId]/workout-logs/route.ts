import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { WorkoutType } from '@/generated/prisma/client'

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
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { athleteId } = await params
  const access = await verifyAthleteAccess(athleteId, session.user.id, session.user.role)
  if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') as WorkoutType | null
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const workoutLogs = await prisma.workoutLog.findMany({
    where: {
      athleteId,
      ...(type ? { type } : {}),
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    include: {
      intervals: true,
    },
    orderBy: { date: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.workoutLog.count({
    where: {
      athleteId,
      ...(type ? { type } : {}),
    },
  })

  return Response.json({ workoutLogs, total, page, limit })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { athleteId } = await params
  const access = await verifyAthleteAccess(athleteId, session.user.id, session.user.role)
  if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const body = await request.json() as {
    date: string
    type: WorkoutType
    title: string
    description?: string
    distanceMiles?: number
    durationMin?: number
    avgPaceSecPerMile?: number
    avgHR?: number
    perceivedEffort?: number
    notes?: string
    intervals?: Array<{
      setNumber: number
      reps: number
      distanceMeters?: number
      targetPaceSec?: number
      actualPaceSec?: number
      restSeconds?: number
      notes?: string
    }>
  }

  if (!body.date || !body.type || !body.title) {
    return Response.json({ error: 'date, type, and title are required' }, { status: 400 })
  }

  const workoutLog = await prisma.workoutLog.create({
    data: {
      athleteId,
      loggedById: session.user.id,
      date: new Date(body.date),
      type: body.type,
      title: body.title,
      description: body.description,
      distanceMiles: body.distanceMiles,
      durationMin: body.durationMin,
      avgPaceSecPerMile: body.avgPaceSecPerMile,
      avgHR: body.avgHR,
      perceivedEffort: body.perceivedEffort,
      notes: body.notes,
      intervals: body.intervals
        ? { create: body.intervals }
        : undefined,
    },
    include: { intervals: true },
  })

  return Response.json({ workoutLog }, { status: 201 })
}
