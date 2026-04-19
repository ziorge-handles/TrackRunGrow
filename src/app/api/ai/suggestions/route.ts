import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/plan-limits'
import anthropic from '@/lib/anthropic'
import { formatTime, formatDate } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Plan enforcement: check AI feature access
  const hasAI = await checkFeatureAccess(session.user.id, 'aiSuggestions')
  if (!hasAI) {
    return Response.json({ error: 'AI workout suggestions require a Pro or Enterprise plan. Upgrade to unlock this feature.', upgrade: true }, { status: 403 })
  }

  const body = await request.json() as {
    athleteId: string
    weekOf: string
    focusAreas?: string[]
  }

  const { athleteId, weekOf } = body
  let focusAreas = body.focusAreas
  if (focusAreas && Array.isArray(focusAreas)) {
    focusAreas = focusAreas
      .slice(0, 10)
      .map((s) => (typeof s === 'string' ? s.trim().slice(0, 200) : ''))
      .filter(Boolean)
    if (focusAreas.length === 0) focusAreas = undefined
  } else {
    focusAreas = undefined
  }

  if (!athleteId || !weekOf) {
    return Response.json({ error: 'athleteId and weekOf are required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI features require an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables.' }, { status: 503 })
  }

  // Verify coach can access this athlete
  let coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) coach = await prisma.coach.create({ data: { userId: session.user.id } })

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: { select: { name: true } },
      teams: { include: { team: true } },
    },
  })

  if (!athlete) return Response.json({ error: 'Not found' }, { status: 404 })

  const teamIds = athlete.teams.map((at) => at.teamId)
  const hasAccess = await prisma.team.findFirst({
    where: {
      id: { in: teamIds },
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
  })
  if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Gather athlete context
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)

  const [recentWorkouts, recentRaces, latestMetric, eventEntries] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId, date: { gte: fourWeeksAgo } },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.raceResult.findMany({
      where: { athleteId },
      include: { race: true, trackEvent: true },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    }),
    prisma.bodyMetric.findFirst({
      where: { athleteId },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.athleteEvent.findMany({
      where: { athleteId },
      include: { trackEvent: true },
    }),
  ])

  const sport = athlete.teams[0]?.team.sport ?? 'TRACK'
  const athleteName = athlete.user.name ?? 'Athlete'
  const events = eventEntries.map((ae) => ae.trackEvent.name).join(', ') || 'Not specified'

  const workoutSummary = recentWorkouts
    .slice(0, 10)
    .map((w) => `  - ${formatDate(w.date)}: ${w.type} — ${w.title}${w.distanceMiles ? ` (${w.distanceMiles}mi)` : ''}${w.perceivedEffort ? ` RPE ${w.perceivedEffort}/10` : ''}`)
    .join('\n')

  const raceSummary = recentRaces
    .map((r) => `  - ${formatDate(r.race.date)}: ${r.race.name}${r.trackEvent ? ` (${r.trackEvent.name})` : ''} — ${r.trackEvent?.lowerIsBetter !== false ? formatTime(r.resultValue) : `${r.resultValue}${r.trackEvent?.unitLabel ?? ''}`}${r.place ? ` | Place: ${r.place}` : ''}`)
    .join('\n')

  const metricSummary = latestMetric
    ? `Weight: ${latestMetric.weightKg ? `${latestMetric.weightKg}kg` : 'N/A'}, VO2Max: ${latestMetric.vo2Max ?? 'N/A'}, Resting HR: ${latestMetric.restingHR ?? 'N/A'}`
    : 'No recent metrics'

  const focusSummary = focusAreas && focusAreas.length > 0
    ? `Focus areas: ${focusAreas.join(', ')}`
    : 'No specific focus'

  const systemPrompt = `You are an expert cross country and track & field coach with 20+ years of experience. Generate a detailed, practical 7-day training plan based on the athlete's recent history, fitness level, and goals. Format your response with clear day-by-day structure using markdown. Include specific workout details: distance, pace targets, intervals, rest periods. Be specific and actionable. Consider periodization principles and athlete recovery.`

  const userPrompt = `Generate a 7-day training plan for the following athlete:

**Athlete:** ${athleteName}
**Sport:** ${sport === 'XC' ? 'Cross Country' : 'Track & Field'}
**Events:** ${events}
**Week of:** ${formatDate(weekOf)}
**${focusSummary}**

**Recent Workouts (last 4 weeks):**
${workoutSummary || '  No recent workouts logged'}

**Recent Race Results:**
${raceSummary || '  No recent race results'}

**Current Fitness Metrics:**
${metricSummary}

Please provide a complete 7-day training plan with:
1. Daily workout details (type, distance/duration, pace targets)
2. Key workout rationale
3. Recovery recommendations
4. Weekly mileage target
5. Any cautions or notes based on the athlete's history`

  // Stream the response
  let fullResponse = ''

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(new TextEncoder().encode(text))
          }
        }

        // Save to database after streaming completes
        await prisma.aiSuggestion.create({
          data: {
            athleteId,
            requestedBy: session.user.id,
            prompt: userPrompt,
            response: fullResponse,
            sport,
            weekOf: new Date(weekOf),
          },
        })

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
