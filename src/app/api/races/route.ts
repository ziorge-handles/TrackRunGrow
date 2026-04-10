import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Sport } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const teamId = searchParams.get('teamId')
  const sport = searchParams.get('sport') as Sport | null
  const filter = searchParams.get('filter') // 'upcoming' | 'past'

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) return Response.json({ races: [] })

  // Get accessible team IDs
  let teamIdFilter: string[] | undefined
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })
    teamIdFilter = [teamId]
  } else {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
      select: { id: true },
    })
    teamIdFilter = teams.map((t) => t.id)
  }

  const now = new Date()

  const races = await prisma.race.findMany({
    where: {
      teamId: { in: teamIdFilter },
      ...(sport ? { sport } : {}),
      ...(filter === 'upcoming' ? { date: { gte: now } } : {}),
      ...(filter === 'past' ? { date: { lt: now } } : {}),
    },
    include: {
      _count: { select: { results: true } },
    },
    orderBy: { date: filter === 'upcoming' ? 'asc' : 'desc' },
  })

  return Response.json({ races })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) return Response.json({ error: 'Coach profile not found' }, { status: 404 })

  const body = await request.json() as {
    name: string
    sport: Sport
    date: string
    teamId?: string
    location?: string
    isHome?: boolean
    courseDescription?: string
    notes?: string
  }

  const { name, sport, date, teamId, location, isHome, courseDescription, notes } = body

  if (!name || !sport || !date) {
    return Response.json({ error: 'name, sport, and date are required' }, { status: 400 })
  }

  // Verify team access if provided
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const race = await prisma.race.create({
    data: {
      name,
      sport,
      date: new Date(date),
      teamId,
      location,
      isHome: isHome ?? false,
      courseDescription,
      notes,
    },
  })

  // Auto-create CalendarEvent if team is specified
  if (teamId) {
    await prisma.calendarEvent.create({
      data: {
        teamId,
        createdById: session.user.id,
        title: name,
        type: 'RACE',
        sport,
        startTime: new Date(date),
        location,
        raceId: race.id,
      },
    })
  }

  return Response.json({ race }, { status: 201 })
}
