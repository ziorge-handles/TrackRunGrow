import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { AthleteStatus } from '@/generated/prisma/client'

async function verifyAthleteAccess(athleteId: string, userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return null

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      teams: { include: { team: true } },
    },
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

  // Athletes can access their own data
  if (session.user.role === 'ATHLETE') {
    const ownAthlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
    })
    if (!ownAthlete || ownAthlete.id !== athleteId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    const access = await verifyAthleteAccess(athleteId, session.user.id)
    if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      teams: {
        include: { team: { include: { school: true } } },
      },
      bodyMetrics: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
      eventEntries: {
        include: { trackEvent: true },
        where: { isPrimary: true },
      },
      personalBests: {
        include: { trackEvent: true },
        orderBy: { achievedAt: 'desc' },
      },
      raceResults: {
        include: {
          race: true,
          trackEvent: true,
        },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      },
      workoutLogs: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })

  return Response.json({ athlete })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { athleteId } = await params
  const access = await verifyAthleteAccess(athleteId, session.user.id)
  if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const body = await request.json() as {
    status?: AthleteStatus
    jerseyNumber?: string
    graduationYear?: number
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    notes?: string
    dateOfBirth?: string
  }

  const updated = await prisma.athlete.update({
    where: { id: athleteId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.jerseyNumber !== undefined && { jerseyNumber: body.jerseyNumber }),
      ...(body.graduationYear !== undefined && { graduationYear: body.graduationYear }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.dateOfBirth !== undefined && { dateOfBirth: new Date(body.dateOfBirth) }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return Response.json({ athlete: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { athleteId } = await params
  const access = await verifyAthleteAccess(athleteId, session.user.id)
  if (!access) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  await prisma.athlete.delete({ where: { id: athleteId } })

  return Response.json({ success: true })
}
