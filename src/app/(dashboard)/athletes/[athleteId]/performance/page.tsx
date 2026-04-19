import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PerformanceTrendChart } from '@/components/performance/PerformanceTrendChart'
import { PersonalBestCard } from '@/components/performance/PersonalBestCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface PageProps {
  params: Promise<{ athleteId: string }>
  searchParams: Promise<{ eventId?: string }>
}

export default async function AthletePerformancePage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { athleteId } = await params
  const { eventId } = await searchParams

  // Verify access
  if ((session.user.role === 'COACH' || session.user.role === 'ADMIN')) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) notFound()

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { teams: true },
    })
    if (!athlete) notFound()

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
    if (!hasAccess) notFound()
  } else {
    const ownAthlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
    if (!ownAthlete || ownAthlete.id !== athleteId) notFound()
  }

  // Get athlete events
  const athleteEvents = await prisma.athleteEvent.findMany({
    where: { athleteId },
    include: { trackEvent: true },
    orderBy: [{ isPrimary: 'desc' }],
  })

  const selectedEventId = eventId ?? athleteEvents[0]?.trackEventId
  const selectedEvent = athleteEvents.find((ae) => ae.trackEventId === selectedEventId)?.trackEvent

  // Get results for selected event
  const results = selectedEventId
    ? await prisma.raceResult.findMany({
        where: { athleteId, trackEventId: selectedEventId },
        include: { race: true },
        orderBy: { recordedAt: 'asc' },
      })
    : []

  // Get personal bests
  const personalBests = await prisma.personalBest.findMany({
    where: { athleteId },
    include: { trackEvent: true },
    orderBy: { achievedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">Performance</h2>
      </div>

      {/* Event selector for Track */}
      {athleteEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {athleteEvents.map(({ trackEvent, trackEventId }) => (
                <a
                  key={trackEventId}
                  href={`?eventId=${trackEventId}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    trackEventId === selectedEventId
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {trackEvent.name}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trend Chart */}
      {selectedEvent && results.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedEvent.name} — Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceTrendChart
              results={results.map((r) => ({
                id: r.id,
                resultValue: r.resultValue,
                recordedAt: r.recordedAt,
                raceName: r.race.name,
              }))}
              eventName={selectedEvent.name}
              lowerIsBetter={selectedEvent.lowerIsBetter}
              unitLabel={selectedEvent.unitLabel}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            {athleteEvents.length === 0
              ? 'No events assigned to this athlete yet.'
              : 'No results found for this event.'}
          </CardContent>
        </Card>
      )}

      {/* Personal Bests */}
      <PersonalBestCard personalBests={personalBests} />
    </div>
  )
}
