import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkTeamLimit } from '@/lib/plan-limits'
import type { Sport, Gender } from '@/generated/prisma/client'

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  })

  if (!coach) {
    return Response.json({ teams: [] })
  }

  // Teams where user is owner OR is a member coach
  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    include: {
      school: true,
      _count: {
        select: {
          athletes: true,
          coaches: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ teams })
}

export async function POST(request: NextRequest) {
  try {
  const session = await auth()

  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  })

  if (!coach) {
    coach = await prisma.coach.create({ data: { userId: session.user.id } })
  }

  const teamCheck = await checkTeamLimit(session.user.id)
  if (!teamCheck.allowed) {
    return Response.json({
      error: `Your ${teamCheck.plan} plan allows ${teamCheck.max} team(s). You currently have ${teamCheck.current}. Upgrade to Pro for unlimited teams.`,
      upgrade: true
    }, { status: 403 })
  }

  const body = await request.json() as {
    name: string
    sport: Sport
    season: string
    gender?: Gender
    schoolName: string
    schoolCity?: string
    schoolState?: string
  }

  const { name, sport, season, gender, schoolName, schoolCity, schoolState } = body

  if (!name || !sport || !season || !schoolName) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (name.length > 100) {
    return Response.json({ error: 'Team name must not exceed 100 characters' }, { status: 400 })
  }

  if (!/^\d{4}-\d{4}$/.test(season)) {
    return Response.json({ error: 'Season must be in YYYY-YYYY format (e.g. 2025-2026)' }, { status: 400 })
  }

  if (schoolName.length > 200) {
    return Response.json({ error: 'School name must not exceed 200 characters' }, { status: 400 })
  }

  // Find or create school
  let school = await prisma.school.findFirst({
    where: {
      name: schoolName,
      city: schoolCity ?? null,
      state: schoolState ?? null,
    },
  })

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: schoolName,
        city: schoolCity,
        state: schoolState,
      },
    })
  }

  const team = await prisma.team.create({
    data: {
      name,
      sport,
      season,
      gender,
      schoolId: school.id,
      ownerId: session.user.id,
      coaches: {
        create: {
          coachId: coach.id,
          coachRole: 'HEAD_COACH',
          isPrimary: true,
        },
      },
    },
    include: {
      school: true,
      coaches: {
        include: {
          coach: {
            include: { user: true },
          },
        },
      },
    },
  })

  // Auto-create a General chat channel for the new team
  await prisma.chatChannel.create({
    data: {
      teamId: team.id,
      name: 'General',
      isGeneral: true,
    },
  })

  return Response.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Team creation error:', error)
    return Response.json({ error: 'Failed to create team. Please try again.' }, { status: 500 })
  }
}
