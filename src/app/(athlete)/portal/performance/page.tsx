import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PerformanceTrendChart } from '@/components/performance/PerformanceTrendChart'
import { PersonalBestCard } from '@/components/performance/PersonalBestCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ eventId?: string }>
}

export default async function AthletePortalPerformancePage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { eventId } = await searchParams

  let athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
  })

  if (!athlete) {
    athlete = await prisma.athlete.create({ data: { userId: session.user.id } })
  }

  const athleteId = athlete.id

  const athleteEvents = await prisma.athleteEvent.findMany({
    where: { athleteId },
    include: { trackEvent: true },
    orderBy: [{ isPrimary: 'desc' }],
  })

  const selectedEventId = eventId ?? athleteEvents[0]?.trackEventId
  const selectedEvent = athleteEvents.find((ae) => ae.trackEventId === selectedEventId)?.trackEvent

  const results = selectedEventId
    ? await prisma.raceResult.findMany({
        where: { athleteId, trackEventId: selectedEventId },
        include: { race: true },
        orderBy: { recordedAt: 'asc' },
      })
    : []

  const personalBests = await prisma.personalBest.findMany({
    where: { athleteId },
    include: { trackEvent: true },
    orderBy: { achievedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">My Performance</h2>
      </div>

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
                      ? 'bg-blue-600 text-white'
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

      {selectedEvent && results.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEvent.name} — Performance Trend</CardTitle>
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
            {athleteEvents.length === 0 ? 'No events assigned yet.' : 'No results for this event.'}
          </CardContent>
        </Card>
      )}

      <PersonalBestCard personalBests={personalBests} />
    </div>
  )
}
