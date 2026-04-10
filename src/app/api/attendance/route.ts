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

  const results = await prisma.$transaction(
    entries.map((entry) =>
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
