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

function formatRow(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(escapecsv).join(',')
}

export async function GET(request: Request): Promise<Response> {
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

  const filename = `${team.name.replace(/\s+/g, '_')}_${type}_${new Date().toISOString().slice(0, 10)}`
  const encoder = new TextEncoder()
  const batchSize = 100

  // For JSON format, we still need to build the full array (streaming JSON arrays is complex)
  if (format === 'json') {
    const jsonData = await buildJsonData(type, teamId)
    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  // CSV: stream response in batches
  const stream = new ReadableStream({
    async start(controller) {
      try {
        switch (type) {
          case 'athletes': {
            controller.enqueue(encoder.encode('name,email,graduation_year,gender,jersey_number,status,primary_events,height_cm,weight_kg,vo2max\r\n'))
            let skip = 0
            while (true) {
              const batch = await prisma.athlete.findMany({
                where: { teams: { some: { teamId } } },
                include: {
                  user: { select: { name: true, email: true } },
                  bodyMetrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
                  eventEntries: { include: { trackEvent: true }, where: { isPrimary: true } },
                },
                skip,
                take: batchSize,
              })
              if (batch.length === 0) break
              for (const a of batch) {
                controller.enqueue(encoder.encode(formatRow([
                  a.user.name, a.user.email, a.graduationYear, a.gender, a.jerseyNumber, a.status,
                  a.eventEntries.map((e) => e.trackEvent.name).join('; '),
                  a.bodyMetrics[0]?.heightCm, a.bodyMetrics[0]?.weightKg, a.bodyMetrics[0]?.vo2Max,
                ]) + '\r\n'))
              }
              skip += batchSize
            }
            break
          }

          case 'race_results': {
            controller.enqueue(encoder.encode('athlete_name,athlete_email,race_name,race_date,event,result_value,place,location\r\n'))
            let skip = 0
            while (true) {
              const batch = await prisma.raceResult.findMany({
                where: { race: { teamId } },
                include: {
                  race: true,
                  athlete: { include: { user: { select: { name: true, email: true } } } },
                  trackEvent: true,
                },
                orderBy: { recordedAt: 'desc' },
                skip,
                take: batchSize,
              })
              if (batch.length === 0) break
              for (const r of batch) {
                controller.enqueue(encoder.encode(formatRow([
                  r.athlete.user.name, r.athlete.user.email, r.race.name,
                  r.race.date.toISOString().slice(0, 10), r.trackEvent?.name ?? '',
                  r.resultValue, r.place, r.race.location,
                ]) + '\r\n'))
              }
              skip += batchSize
            }
            break
          }

          case 'workouts': {
            controller.enqueue(encoder.encode('athlete_name,athlete_email,date,type,title,distance_miles,duration_min,avg_pace,notes\r\n'))
            let skip = 0
            while (true) {
              const batch = await prisma.workoutLog.findMany({
                where: { athlete: { teams: { some: { teamId } } } },
                include: { athlete: { include: { user: { select: { name: true, email: true } } } } },
                orderBy: { date: 'desc' },
                skip,
                take: batchSize,
              })
              if (batch.length === 0) break
              for (const w of batch) {
                controller.enqueue(encoder.encode(formatRow([
                  w.athlete.user.name, w.athlete.user.email, w.date.toISOString().slice(0, 10),
                  w.type, w.title, w.distanceMiles, w.durationMin, w.avgPaceSecPerMile, w.notes,
                ]) + '\r\n'))
              }
              skip += batchSize
            }
            break
          }

          case 'personal_bests': {
            controller.enqueue(encoder.encode('athlete_name,athlete_email,event,result_value,unit,achieved_at\r\n'))
            let skip = 0
            while (true) {
              const batch = await prisma.personalBest.findMany({
                where: { athlete: { teams: { some: { teamId } } } },
                include: {
                  athlete: { include: { user: { select: { name: true, email: true } } } },
                  trackEvent: true,
                },
                orderBy: { achievedAt: 'desc' },
                skip,
                take: batchSize,
              })
              if (batch.length === 0) break
              for (const pb of batch) {
                controller.enqueue(encoder.encode(formatRow([
                  pb.athlete.user.name, pb.athlete.user.email, pb.trackEvent.name,
                  pb.resultValue, pb.trackEvent.unitLabel, pb.achievedAt.toISOString().slice(0, 10),
                ]) + '\r\n'))
              }
              skip += batchSize
            }
            break
          }

          case 'meet_lineup': {
            controller.enqueue(encoder.encode('lineup_name,athlete_name,event,heat,lane,seed_time,qualifying_mark\r\n'))
            let skip = 0
            while (true) {
              const batch = await prisma.meetLineup.findMany({
                where: { teamId },
                include: {
                  entries: {
                    include: {
                      athlete: { include: { user: { select: { name: true } } } },
                      trackEvent: true,
                    },
                  },
                },
                skip,
                take: batchSize,
              })
              if (batch.length === 0) break
              for (const lineup of batch) {
                for (const e of lineup.entries) {
                  controller.enqueue(encoder.encode(formatRow([
                    lineup.name, e.athlete.user.name, e.trackEvent?.name ?? '',
                    e.heatNumber, e.laneNumber, e.seedTime, e.qualifyingMark,
                  ]) + '\r\n'))
                }
              }
              skip += batchSize
            }
            break
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildJsonData(type: ExportType, teamId: string): Promise<Record<string, any>[]> {
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
      return athletes.map((a) => ({
        name: a.user.name, email: a.user.email, graduation_year: a.graduationYear,
        gender: a.gender, jersey_number: a.jerseyNumber, status: a.status,
        primary_events: a.eventEntries.map((e) => e.trackEvent.name).join('; '),
        height_cm: a.bodyMetrics[0]?.heightCm ?? null, weight_kg: a.bodyMetrics[0]?.weightKg ?? null,
        vo2max: a.bodyMetrics[0]?.vo2Max ?? null,
      }))
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
      return results.map((r) => ({
        athlete_name: r.athlete.user.name, athlete_email: r.athlete.user.email,
        race_name: r.race.name, race_date: r.race.date.toISOString().slice(0, 10),
        event: r.trackEvent?.name ?? null, result_value: r.resultValue,
        place: r.place, location: r.race.location,
      }))
    }
    case 'workouts': {
      const workouts = await prisma.workoutLog.findMany({
        where: { athlete: { teams: { some: { teamId } } } },
        include: { athlete: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { date: 'desc' },
      })
      return workouts.map((w) => ({
        athlete_name: w.athlete.user.name, athlete_email: w.athlete.user.email,
        date: w.date.toISOString().slice(0, 10), type: w.type, title: w.title,
        distance_miles: w.distanceMiles, duration_min: w.durationMin,
        avg_pace: w.avgPaceSecPerMile, notes: w.notes,
      }))
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
      return pbs.map((pb) => ({
        athlete_name: pb.athlete.user.name, athlete_email: pb.athlete.user.email,
        event: pb.trackEvent.name, result_value: pb.resultValue,
        unit: pb.trackEvent.unitLabel, achieved_at: pb.achievedAt.toISOString().slice(0, 10),
      }))
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
      return lineups.flatMap((lineup) =>
        lineup.entries.map((e) => ({
          lineup_name: lineup.name, athlete_name: e.athlete.user.name,
          event: e.trackEvent?.name ?? null, heat: e.heatNumber,
          lane: e.laneNumber, seed_time: e.seedTime, qualifying_mark: e.qualifyingMark,
        })),
      )
    }
  }
}
