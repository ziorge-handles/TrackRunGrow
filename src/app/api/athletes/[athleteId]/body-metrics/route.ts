import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bodyMetricSchema } from '@/lib/validations'

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

  // Validate body metrics
  const parsed = bodyMetricSchema.safeParse({
    heightCm: body.heightCm ?? undefined,
    weightKg: body.weightKg ?? undefined,
    restingHR: body.restingHR ?? undefined,
    maxHR: body.maxHR ?? undefined,
    vo2Max: body.vo2Max ?? undefined,
    bodyFatPct: body.bodyFatPct ?? undefined,
    notes: body.notes,
  })

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid body metric data', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const metric = await prisma.bodyMetric.create({
    data: {
      athleteId,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
      heightCm: parsed.data.heightCm ?? undefined,
      weightKg: parsed.data.weightKg ?? undefined,
      restingHR: parsed.data.restingHR ?? undefined,
      maxHR: parsed.data.maxHR ?? undefined,
      vo2Max: parsed.data.vo2Max ?? undefined,
      bodyFatPct: parsed.data.bodyFatPct ?? undefined,
      notes: parsed.data.notes,
    },
  })

  return Response.json({ metric }, { status: 201 })
}
