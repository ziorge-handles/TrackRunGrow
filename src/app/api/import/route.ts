import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/plan-limits'
import { z } from 'zod'
import { WorkoutType, Gender } from '@/generated/prisma/client'

const VALID_TYPES = ['race_results', 'athletes', 'workouts', 'qualifying_marks'] as const
type ImportType = typeof VALID_TYPES[number]

interface ImportError {
  row: number
  message: string
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const raceResultRowSchema = z.object({
  athlete_email: z.string().email(),
  event_name: z.string().min(1),
  result_value: z.coerce.number(),
  place: z.coerce.number().int().optional(),
  date: z.string().min(1),
  race_name: z.string().min(1),
  location: z.string().optional(),
})

const athleteRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  graduation_year: z.coerce.number().int().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  jersey_number: z.string().optional(),
  events: z.string().optional(),
})

const workoutRowSchema = z.object({
  athlete_email: z.string().email(),
  date: z.string().min(1),
  type: z.enum(['EASY_RUN', 'TEMPO', 'INTERVAL', 'LONG_RUN', 'RECOVERY', 'STRENGTH', 'CROSS_TRAINING', 'RACE', 'REST', 'CUSTOM']),
  title: z.string().min(1),
  distance_miles: z.coerce.number().optional(),
  duration_min: z.coerce.number().optional(),
  avg_pace: z.coerce.number().optional(),
  notes: z.string().optional(),
})

// ─── CSV parser (RFC 4180 compliant) ─────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (char === '"') { inQuotes = false }
      else { current += char }
    } else {
      if (char === '"') { inQuotes = true }
      else if (char === ',') { result.push(current.trim()); current = '' }
      else { current += char }
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim() })
    return row
  })
}

// ─── Import handlers ──────────────────────────────────────────────────────────

async function importRaceResults(
  rows: Record<string, string>[],
  teamId: string,
  userId: string,
): Promise<{ imported: number; errors: ImportError[] }> {
  let imported = 0
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2
    const parsed = raceResultRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      errors.push({ row: rowNum, message: parsed.error.issues.map((e) => e.message).join(', ') })
      continue
    }
    const d = parsed.data

    try {
      const athlete = await prisma.athlete.findFirst({
        where: { user: { email: d.athlete_email }, teams: { some: { teamId } } },
      })
      if (!athlete) {
        errors.push({ row: rowNum, message: `Athlete not found: ${d.athlete_email}` })
        continue
      }

      let trackEvent = null
      if (d.event_name) {
        trackEvent = await prisma.trackEvent.findFirst({ where: { name: { equals: d.event_name, mode: 'insensitive' } } })
      }

      const raceDate = new Date(d.date)
      const race = await prisma.race.upsert({
        where: { id: `import-${d.race_name}-${d.date}`.slice(0, 25) },
        create: {
          id: `import-${d.race_name}-${d.date}`.slice(0, 25),
          name: d.race_name,
          sport: 'TRACK',
          date: raceDate,
          location: d.location ?? null,
          teamId,
        },
        update: {},
      })

      await prisma.raceResult.create({
        data: {
          raceId: race.id,
          athleteId: athlete.id,
          trackEventId: trackEvent?.id ?? null,
          resultValue: d.result_value,
          place: d.place ?? null,
        },
      })
      imported++
    } catch (e) {
      errors.push({ row: rowNum, message: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  return { imported, errors }
}

async function importAthletes(
  rows: Record<string, string>[],
  teamId: string,
  userId: string,
): Promise<{ imported: number; errors: ImportError[] }> {
  let imported = 0
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2
    const parsed = athleteRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      errors.push({ row: rowNum, message: parsed.error.issues.map((e) => e.message).join(', ') })
      continue
    }
    const d = parsed.data

    try {
      const team = await prisma.team.findUnique({ where: { id: teamId } })
      if (!team) { errors.push({ row: rowNum, message: 'Team not found' }); continue }

      const user = await prisma.user.upsert({
        where: { email: d.email },
        create: { email: d.email, name: d.name, role: 'ATHLETE' },
        update: { name: d.name },
      })

      const athlete = await prisma.athlete.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          graduationYear: d.graduation_year ?? null,
          gender: (d.gender as Gender) ?? null,
          jerseyNumber: d.jersey_number ?? null,
        },
        update: {
          graduationYear: d.graduation_year ?? undefined,
          gender: (d.gender as Gender) ?? undefined,
          jerseyNumber: d.jersey_number ?? undefined,
        },
      })

      await prisma.athleteTeam.upsert({
        where: { athleteId_teamId: { athleteId: athlete.id, teamId } },
        create: { athleteId: athlete.id, teamId },
        update: {},
      })

      // Handle events
      if (d.events) {
        const eventNames = d.events.split(';').map((e) => e.trim()).filter(Boolean)
        for (const evtName of eventNames) {
          const trackEvent = await prisma.trackEvent.findFirst({
            where: { name: { equals: evtName, mode: 'insensitive' } },
          })
          if (trackEvent) {
            await prisma.athleteEvent.upsert({
              where: { athleteId_trackEventId_season: { athleteId: athlete.id, trackEventId: trackEvent.id, season: String(new Date().getFullYear()) } },
              create: { athleteId: athlete.id, trackEventId: trackEvent.id, season: String(new Date().getFullYear()) },
              update: {},
            })
          }
        }
      }

      imported++
    } catch (e) {
      errors.push({ row: rowNum, message: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  return { imported, errors }
}

async function importWorkouts(
  rows: Record<string, string>[],
  teamId: string,
  userId: string,
): Promise<{ imported: number; errors: ImportError[] }> {
  let imported = 0
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2
    const parsed = workoutRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      errors.push({ row: rowNum, message: parsed.error.issues.map((e) => e.message).join(', ') })
      continue
    }
    const d = parsed.data

    try {
      const athlete = await prisma.athlete.findFirst({
        where: { user: { email: d.athlete_email }, teams: { some: { teamId } } },
      })
      if (!athlete) {
        errors.push({ row: rowNum, message: `Athlete not found: ${d.athlete_email}` })
        continue
      }

      await prisma.workoutLog.create({
        data: {
          athleteId: athlete.id,
          loggedById: userId,
          date: new Date(d.date),
          type: d.type as WorkoutType,
          title: d.title,
          distanceMiles: d.distance_miles ?? null,
          durationMin: d.duration_min ?? null,
          avgPaceSecPerMile: d.avg_pace ?? null,
          notes: d.notes ?? null,
        },
      })
      imported++
    } catch (e) {
      errors.push({ row: rowNum, message: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  return { imported, errors }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Plan enforcement: check import/export feature access
  const hasImport = await checkFeatureAccess(session.user.id, 'importExport')
  if (!hasImport) {
    return NextResponse.json({ error: 'CSV import/export requires a Pro or Enterprise plan. Upgrade to unlock this feature.', upgrade: true }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null
  const teamId = formData.get('teamId') as string | null

  if (!file || !type || !teamId) {
    return NextResponse.json({ error: 'file, type, and teamId are required' }, { status: 400 })
  }

  if (!VALID_TYPES.includes(type as ImportType)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
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

  const text = await file.text()
  let rows: Record<string, string>[]

  const name = file.name.toLowerCase()
  if (name.endsWith('.json')) {
    try {
      const json = JSON.parse(text)
      rows = Array.isArray(json) ? json : []
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
    }
  } else {
    rows = parseCsv(text)
  }

  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, errors: [{ row: 0, message: 'No data rows found' }] })
  }

  let result: { imported: number; errors: ImportError[] }

  switch (type as ImportType) {
    case 'race_results':
      result = await importRaceResults(rows, teamId, session.user.id)
      break
    case 'athletes':
      result = await importAthletes(rows, teamId, session.user.id)
      break
    case 'workouts':
      result = await importWorkouts(rows, teamId, session.user.id)
      break
    default:
      result = { imported: 0, errors: [{ row: 0, message: `Import type '${type}' not yet implemented` }] }
  }

  return NextResponse.json(result)
}
