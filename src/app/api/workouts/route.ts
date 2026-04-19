import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { workoutSchema } from '@/lib/validations'
import type { WorkoutType } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const teamId = searchParams.get('teamId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) return Response.json({ workoutLogs: [] })

  // Get athlete IDs for the coach's teams
  let athleteIds: string[]

  if (teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
      include: { athletes: true },
    })
    if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })
    athleteIds = team.athletes.map((at) => at.athleteId)
  } else {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
      include: { athletes: true },
    })
    athleteIds = teams.flatMap((t) => t.athletes.map((at) => at.athleteId))
  }

  const workoutLogs = await prisma.workoutLog.findMany({
    where: {
      athleteId: { in: athleteIds },
      ...(from || to ? {
        date: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    include: {
      athlete: { include: { user: { select: { id: true, name: true } } } },
      intervals: true,
    },
    orderBy: { date: 'desc' },
  })

  return Response.json({ workoutLogs })
}

export async function POST(request: NextRequest) {
  try {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) {
    coach = await prisma.coach.create({ data: { userId: session.user.id } })
  }

  const body = await request.json() as {
    athleteIds: string[]
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

  const { athleteIds, date, type, title } = body

  if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0) {
    return Response.json({ error: 'athleteIds array is required' }, { status: 400 })
  }

  if (athleteIds.length > 50) {
    return Response.json({ error: 'athleteIds array must not exceed 50 entries' }, { status: 400 })
  }

  if (!date || !type || !title) {
    return Response.json({ error: 'date, type, and title are required' }, { status: 400 })
  }

  if (title.length > 200) {
    return Response.json({ error: 'Title must not exceed 200 characters' }, { status: 400 })
  }

  // Validate numeric workout fields
  const workoutParsed = workoutSchema.safeParse({
    distanceMiles: body.distanceMiles ?? undefined,
    durationMin: body.durationMin ?? undefined,
    avgHR: body.avgHR ?? undefined,
    perceivedEffort: body.perceivedEffort ?? undefined,
  })
  if (!workoutParsed.success) {
    return Response.json(
      { error: 'Invalid workout data', details: workoutParsed.error.issues },
      { status: 400 },
    )
  }

  // Verify all athletes are accessible
  const accessibleTeams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    include: { athletes: true },
  })
  const accessibleAthleteIds = new Set(
    accessibleTeams.flatMap((t) => t.athletes.map((at) => at.athleteId)),
  )

  const forbidden = athleteIds.filter((id) => !accessibleAthleteIds.has(id))
  if (forbidden.length > 0) {
    return Response.json({ error: 'Access denied to some athletes' }, { status: 403 })
  }

  const created = []
  const batchSize = 10
  for (let i = 0; i < athleteIds.length; i += batchSize) {
    const batch = athleteIds.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((athleteId) =>
        prisma.workoutLog.create({
          data: {
            athleteId,
            loggedById: session.user.id,
            date: new Date(date),
            type,
            title,
            description: body.description,
            distanceMiles: body.distanceMiles,
            durationMin: body.durationMin,
            avgPaceSecPerMile: body.avgPaceSecPerMile,
            avgHR: body.avgHR,
            perceivedEffort: body.perceivedEffort,
            notes: body.notes,
            intervals: body.intervals ? { create: body.intervals } : undefined,
          },
          include: { intervals: true },
        }),
      ),
    )
    created.push(...results)
  }

  return Response.json({ workoutLogs: created }, { status: 201 })
  } catch (error) {
    console.error('Workout creation error:', error)
    return Response.json({ error: 'Failed to log workout. Please try again.' }, { status: 500 })
  }
}
