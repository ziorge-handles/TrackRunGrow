import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Sport, Gender } from '@/generated/prisma/client'

async function verifyTeamAccess(teamId: string, userId: string, requireOwner = false) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coaches: {
        include: { coach: true },
      },
    },
  })

  if (!team) return null

  const isOwner = team.ownerId === userId
  if (requireOwner && !isOwner) return null

  if (!isOwner) {
    const coach = await prisma.coach.findUnique({ where: { userId } })
    if (!coach) return null
    const isCoach = team.coaches.some((ct) => ct.coachId === coach.id)
    if (!isCoach) return null
  }

  return team
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId } = await params

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      school: true,
      coaches: {
        include: {
          coach: {
            include: { user: true },
          },
        },
      },
      athletes: {
        include: {
          athlete: {
            include: {
              user: true,
              eventEntries: {
                include: { trackEvent: true },
              },
            },
          },
        },
      },
    },
  })

  if (!team) {
    return Response.json({ error: 'Team not found' }, { status: 404 })
  }

  // Verify access
  const isOwner = team.ownerId === session.user.id
  if (!isOwner) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach || !team.coaches.some((ct) => ct.coachId === coach.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Get recent races for this team
  const recentRaces = await prisma.race.findMany({
    where: { teamId },
    orderBy: { date: 'desc' },
    take: 5,
    include: {
      _count: { select: { results: true } },
    },
  })

  return Response.json({ team, recentRaces })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId } = await params
  const team = await verifyTeamAccess(teamId, session.user.id)

  if (!team) {
    return Response.json({ error: 'Team not found or forbidden' }, { status: 404 })
  }

  // Check HEAD_COACH or owner
  const isOwner = team.ownerId === session.user.id
  if (!isOwner) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const coachTeam = team.coaches.find((ct) => ct.coachId === coach.id)
    if (!coachTeam || coachTeam.coachRole !== 'HEAD_COACH') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json() as {
    name?: string
    sport?: Sport
    season?: string
    gender?: Gender
    isActive?: boolean
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sport !== undefined && { sport: body.sport }),
      ...(body.season !== undefined && { season: body.season }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { school: true },
  })

  return Response.json({ team: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId } = await params
  const team = await verifyTeamAccess(teamId, session.user.id, true)

  if (!team) {
    return Response.json({ error: 'Team not found or forbidden' }, { status: 404 })
  }

  await prisma.team.delete({ where: { id: teamId } })

  return Response.json({ success: true })
}
