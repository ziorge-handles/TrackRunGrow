import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Trophy, MapPin, Calendar, ClipboardList } from 'lucide-react'
import { SPORT_LABELS, SPORT_COLORS } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'

interface PageProps {
  params: Promise<{ raceId: string }>
}

export default async function RaceDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { raceId } = await params

  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: {
      results: {
        include: {
          athlete: { include: { user: { select: { id: true, name: true } } } },
          trackEvent: true,
        },
        orderBy: { place: 'asc' },
      },
    },
  })

  if (!race) notFound()

  // Verify access
  if (race.teamId) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) notFound()
    const team = await prisma.team.findFirst({
      where: {
        id: race.teamId,
        OR: [{ ownerId: session.user.id }, { coaches: { some: { coachId: coach.id } } }],
      },
    })
    if (!team) notFound()
  }

  // XC team scoring (lowest combined place wins)
  const xcTopFinishers = race.sport === 'XC'
    ? race.results
        .filter((r) => !r.dnf && !r.dns && !r.dq && r.place)
        .slice(0, 7)
    : []

  const teamScore = xcTopFinishers.slice(0, 5).reduce((sum, r) => sum + (r.place ?? 0), 0)

  // Group by event for track
  const byEvent = race.sport === 'TRACK'
    ? race.results.reduce<Record<string, typeof race.results>>((acc, r) => {
        const key = r.trackEvent?.name ?? 'Unknown'
        if (!acc[key]) acc[key] = []
        acc[key].push(r)
        return acc
      }, {})
    : {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/races">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={SPORT_COLORS[race.sport]}>{SPORT_LABELS[race.sport]}</Badge>
              {race.isHome && <Badge variant="outline">Home</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{race.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(race.date)}
              </span>
              {race.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {race.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/races/${raceId}/results`}>
          <Button variant="primary">
            <ClipboardList className="w-4 h-4 mr-2" />
            Enter Results
          </Button>
        </Link>
      </div>

      {/* XC Team Score */}
      {race.sport === 'XC' && xcTopFinishers.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Team Score (XC)</p>
                <p className="text-3xl font-bold text-emerald-700">{teamScore}</p>
                <p className="text-xs text-emerald-600">Sum of top 5 finishers&apos; places</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {race.sport === 'XC' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" />
              Results ({race.results.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {race.results.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No results yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Place</TableHead>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Team Place</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {race.results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-bold">{result.place ?? '—'}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/athletes/${result.athleteId}`}
                          className="font-medium text-gray-900 hover:text-emerald-700"
                        >
                          {result.athlete.user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono">
                        {result.dnf ? 'DNF' : result.dns ? 'DNS' : result.dq ? 'DQ' : formatTime(result.resultValue)}
                      </TableCell>
                      <TableCell>{result.teamPlace ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Track — group by event
        Object.entries(byEvent).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              No results yet. Click &quot;Enter Results&quot; to add them.
            </CardContent>
          </Card>
        ) : (
          Object.entries(byEvent).map(([eventName, results]) => (
            <Card key={eventName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{eventName}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Place</TableHead>
                      <TableHead>Athlete</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-bold">{result.place ?? '—'}</TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/athletes/${result.athleteId}`}
                            className="font-medium text-gray-900 hover:text-blue-700"
                          >
                            {result.athlete.user.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono">
                          {result.dnf ? 'DNF' : result.dns ? 'DNS' : result.dq ? 'DQ' :
                            result.trackEvent?.lowerIsBetter
                              ? formatTime(result.resultValue)
                              : `${result.resultValue}${result.trackEvent?.unitLabel ?? ''}`
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )
      )}

      {race.courseDescription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Course Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{race.courseDescription}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
