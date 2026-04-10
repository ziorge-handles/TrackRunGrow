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

  const metrics = await prisma.bodyMetric.findMany({
    where: { athleteId },
    orderBy: { recordedAt: 'desc' },
  })

  return Response.json({ metrics })
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
    recordedAt?: string
    heightCm?: number
    weightKg?: number
    restingHR?: number
    maxHR?: number
    vo2Max?: number
    bodyFatPct?: number
    notes?: string
  }

  const metric = await prisma.bodyMetric.create({
    data: {
      athleteId,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      restingHR: body.restingHR,
      maxHR: body.maxHR,
      vo2Max: body.vo2Max,
      bodyFatPct: body.bodyFatPct,
      notes: body.notes,
    },
  })

  return Response.json({ metric }, { status: 201 })
}
