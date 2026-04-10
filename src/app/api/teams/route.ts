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
  const session = await auth()

  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  })

  if (!coach) {
    return Response.json({ error: 'Coach profile not found' }, { status: 404 })
  }

  // Plan enforcement: check team limit
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

  return Response.json({ team }, { status: 201 })
}
