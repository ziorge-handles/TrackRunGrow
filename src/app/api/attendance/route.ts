import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@/generated/prisma/client'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const calendarEventId = searchParams.get('calendarEventId')
  const teamId = searchParams.get('teamId')

  if (!calendarEventId || !teamId) {
    return NextResponse.json({ error: 'calendarEventId and teamId are required' }, { status: 400 })
  }

  // Verify team access
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const { searchParams: sp } = new URL(request.url)
  const page = Math.max(0, parseInt(sp.get('page') ?? '0'))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '50')))

  // Get all athletes on the team
  const athleteTeams = await prisma.athleteTeam.findMany({
    where: { teamId, leftAt: null },
    include: {
      athlete: {
        include: {
          user: { select: { name: true, email: true } },
          attendance: {
            where: { calendarEventId },
          },
        },
      },
    },
    skip: page * limit,
    take: limit,
  })

  const result = athleteTeams.map((at) => {
    const attendance = at.athlete.attendance[0] ?? null
    return {
      athleteId: at.athlete.id,
      athleteName: at.athlete.user.name,
      athleteEmail: at.athlete.user.email,
      status: attendance?.status ?? null,
      availabilityNote: attendance?.availabilityNote ?? null,
      attendanceId: attendance?.id ?? null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { calendarEventId?: string; teamId?: string; entries?: Array<{ athleteId: string; status: AttendanceStatus; availabilityNote?: string }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { calendarEventId, teamId, entries } = body
  if (!calendarEventId || !teamId || !Array.isArray(entries)) {
    return NextResponse.json({ error: 'calendarEventId, teamId, and entries array are required' }, { status: 400 })
  }

  // Verify team access
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const teamAthletes = await prisma.athleteTeam.findMany({
    where: { teamId, leftAt: null },
    select: { athleteId: true },
  })
  const validAthleteIds = new Set(teamAthletes.map((a) => a.athleteId))

  const validEntries = entries.filter((e) => validAthleteIds.has(e.athleteId))
  if (validEntries.length === 0) {
    return NextResponse.json({ error: 'No valid athletes for this team' }, { status: 400 })
  }

  const results = await prisma.$transaction(
    validEntries.map((entry) =>
      prisma.eventAttendance.upsert({
        where: { calendarEventId_athleteId: { calendarEventId, athleteId: entry.athleteId } },
        create: {
          calendarEventId,
          athleteId: entry.athleteId,
          status: entry.status,
          availabilityNote: entry.availabilityNote ?? null,
          recordedById: session.user.id,
        },
        update: {
          status: entry.status,
          availabilityNote: entry.availabilityNote ?? null,
          recordedById: session.user.id,
        },
      }),
    ),
  )

  return NextResponse.json({ updated: results.length })
}
