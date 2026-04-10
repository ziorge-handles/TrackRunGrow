import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = ['athletes', 'race_results', 'workouts', 'personal_bests', 'meet_lineup'] as const
type ExportType = typeof VALID_TYPES[number]

function escapecsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines: string[] = [headers.map(escapecsv).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapecsv).join(','))
  }
  return lines.join('\r\n')
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ExportType | null
  const teamId = searchParams.get('teamId')
  const format = searchParams.get('format') ?? 'csv'

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }
  if (format !== 'csv' && format !== 'json') {
    return NextResponse.json({ error: 'format must be csv or json' }, { status: 400 })
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
  if (!team) {
    return NextResponse.json({ error: 'Team not found or access denied' }, { status: 403 })
  }

  let headers: string[] = []
  let dataRows: (string | number | boolean | null | undefined)[][] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jsonData: Record<string, any>[] = []
  const filename = `${team.name.replace(/\s+/g, '_')}_${type}_${new Date().toISOString().slice(0, 10)}`

  switch (type) {
    case 'athletes': {
      const athletes = await prisma.athlete.findMany({
        where: { teams: { some: { teamId } } },
        include: {
          user: { select: { name: true, email: true } },
          bodyMetrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
          eventEntries: { include: { trackEvent: true }, where: { isPrimary: true } },
        },
      })
      headers = ['name', 'email', 'graduation_year', 'gender', 'jersey_number', 'status', 'primary_events', 'height_cm', 'weight_kg', 'vo2max']
      dataRows = athletes.map((a) => [
        a.user.name,
        a.user.email,
        a.graduationYear,
        a.gender,
        a.jerseyNumber,
        a.status,
        a.eventEntries.map((e) => e.trackEvent.name).join('; '),
        a.bodyMetrics[0]?.heightCm,
        a.bodyMetrics[0]?.weightKg,
        a.bodyMetrics[0]?.vo2Max,
      ])
      jsonData = athletes.map((a) => ({
        name: a.user.name,
        email: a.user.email,
        graduation_year: a.graduationYear,
        gender: a.gender,
        jersey_number: a.jerseyNumber,
        status: a.status,
        primary_events: a.eventEntries.map((e) => e.trackEvent.name).join('; '),
        height_cm: a.bodyMetrics[0]?.heightCm ?? null,
        weight_kg: a.bodyMetrics[0]?.weightKg ?? null,
        vo2max: a.bodyMetrics[0]?.vo2Max ?? null,
      }))
      break
    }

    case 'race_results': {
      const results = await prisma.raceResult.findMany({
        where: { race: { teamId } },
        include: {
          race: true,
          athlete: { include: { user: { select: { name: true, email: true } } } },
          trackEvent: true,
        },
        orderBy: { recordedAt: 'desc' },
      })
      headers = ['athlete_name', 'athlete_email', 'race_name', 'race_date', 'event', 'result_value', 'place', 'location']
      dataRows = results.map((r) => [
        r.athlete.user.name,
        r.athlete.user.email,
        r.race.name,
        r.race.date.toISOString().slice(0, 10),
        r.trackEvent?.name ?? '',
        r.resultValue,
        r.place,
        r.race.location,
      ])
      jsonData = results.map((r) => ({
        athlete_name: r.athlete.user.name,
        athlete_email: r.athlete.user.email,
        race_name: r.race.name,
        race_date: r.race.date.toISOString().slice(0, 10),
        event: r.trackEvent?.name ?? null,
        result_value: r.resultValue,
        place: r.place,
        location: r.race.location,
      }))
      break
    }

    case 'workouts': {
      const workouts = await prisma.workoutLog.findMany({
        where: { athlete: { teams: { some: { teamId } } } },
        include: { athlete: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { date: 'desc' },
      })
      headers = ['athlete_name', 'athlete_email', 'date', 'type', 'title', 'distance_miles', 'duration_min', 'avg_pace', 'notes']
      dataRows = workouts.map((w) => [
        w.athlete.user.name,
        w.athlete.user.email,
        w.date.toISOString().slice(0, 10),
        w.type,
        w.title,
        w.distanceMiles,
        w.durationMin,
        w.avgPaceSecPerMile,
        w.notes,
      ])
      jsonData = workouts.map((w) => ({
        athlete_name: w.athlete.user.name,
        athlete_email: w.athlete.user.email,
        date: w.date.toISOString().slice(0, 10),
        type: w.type,
        title: w.title,
        distance_miles: w.distanceMiles,
        duration_min: w.durationMin,
        avg_pace: w.avgPaceSecPerMile,
        notes: w.notes,
      }))
      break
    }

    case 'personal_bests': {
      const pbs = await prisma.personalBest.findMany({
        where: { athlete: { teams: { some: { teamId } } } },
        include: {
          athlete: { include: { user: { select: { name: true, email: true } } } },
          trackEvent: true,
        },
        orderBy: { achievedAt: 'desc' },
      })
      headers = ['athlete_name', 'athlete_email', 'event', 'result_value', 'unit', 'achieved_at']
      dataRows = pbs.map((pb) => [
        pb.athlete.user.name,
        pb.athlete.user.email,
        pb.trackEvent.name,
        pb.resultValue,
        pb.trackEvent.unitLabel,
        pb.achievedAt.toISOString().slice(0, 10),
      ])
      jsonData = pbs.map((pb) => ({
        athlete_name: pb.athlete.user.name,
        athlete_email: pb.athlete.user.email,
        event: pb.trackEvent.name,
        result_value: pb.resultValue,
        unit: pb.trackEvent.unitLabel,
        achieved_at: pb.achievedAt.toISOString().slice(0, 10),
      }))
      break
    }

    case 'meet_lineup': {
      const lineups = await prisma.meetLineup.findMany({
        where: { teamId },
        include: {
          entries: {
            include: {
              athlete: { include: { user: { select: { name: true } } } },
              trackEvent: true,
            },
          },
        },
      })
      headers = ['lineup_name', 'athlete_name', 'event', 'heat', 'lane', 'seed_time', 'qualifying_mark']
      dataRows = lineups.flatMap((lineup) =>
        lineup.entries.map((e) => [
          lineup.name,
          e.athlete.user.name,
          e.trackEvent?.name ?? '',
          e.heatNumber,
          e.laneNumber,
          e.seedTime,
          e.qualifyingMark,
        ]),
      )
      jsonData = lineups.flatMap((lineup) =>
        lineup.entries.map((e) => ({
          lineup_name: lineup.name,
          athlete_name: e.athlete.user.name,
          event: e.trackEvent?.name ?? null,
          heat: e.heatNumber,
          lane: e.laneNumber,
          seed_time: e.seedTime,
          qualifying_mark: e.qualifyingMark,
        })),
      )
      break
    }
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  // CSV
  const csvContent = toCsv(headers, dataRows)
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
