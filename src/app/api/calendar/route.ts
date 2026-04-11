import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDate } from '@/lib/utils'
import type { CalendarEventType, Sport } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const teamId = searchParams.get('teamId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  let teamIds: string[]

  if (session.user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) return Response.json({ events: [] })

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
      teamIds = [teamId]
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
      teamIds = teams.map((t) => t.id)
    }
  } else {
    // Athlete: get their team IDs
    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      include: { teams: true },
    })
    teamIds = athlete?.teams.map((at) => at.teamId) ?? []
  }

  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

  const events = await prisma.calendarEvent.findMany({
    where: {
      teamId: { in: teamIds },
      ...(start || end ? {
        startTime: {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {}),
        },
      } : {}),
    },
    orderBy: { startTime: 'asc' },
    skip: page * limit,
    take: limit,
  })

  return Response.json({ events })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) coach = await prisma.coach.create({ data: { userId: session.user.id } })

  const body = await request.json() as {
    teamId?: string
    title: string
    type: CalendarEventType
    sport?: Sport
    startTime: string
    endTime?: string
    allDay?: boolean
    location?: string
    description?: string
    color?: string
  }

  if (!body.title || !body.type || !body.startTime) {
    return Response.json({ error: 'title, type, and startTime are required' }, { status: 400 })
  }

  const parsedStartTime = parseDate(body.startTime)
  if (!parsedStartTime) {
    return Response.json({ error: 'Invalid startTime format' }, { status: 400 })
  }

  const parsedEndTime = body.endTime ? parseDate(body.endTime) : undefined
  if (body.endTime && !parsedEndTime) {
    return Response.json({ error: 'Invalid endTime format' }, { status: 400 })
  }

  if (body.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: body.teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      teamId: body.teamId,
      createdById: session.user.id,
      title: body.title,
      type: body.type,
      sport: body.sport,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      allDay: body.allDay ?? false,
      location: body.location,
      description: body.description,
      color: body.color,
    },
  })

  return Response.json({ event }, { status: 201 })
}
