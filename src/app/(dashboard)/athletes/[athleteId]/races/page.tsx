import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface PageProps {
  params: Promise<{ athleteId: string }>
}

export default async function AthleteRacesPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { athleteId } = await params

  // Access check
  if ((session.user.role === 'COACH' || session.user.role === 'ADMIN')) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) notFound()
    const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, include: { teams: true } })
    if (!athlete) notFound()
    const teamIds = athlete.teams.map((at) => at.teamId)
    const hasAccess = await prisma.team.findFirst({
      where: { id: { in: teamIds }, OR: [{ ownerId: session.user.id }, { coaches: { some: { coachId: coach.id } } }] },
    })
    if (!hasAccess) notFound()
  } else {
    const ownAthlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
    if (!ownAthlete || ownAthlete.id !== athleteId) notFound()
  }

  const results = await prisma.raceResult.findMany({
    where: { athleteId },
    include: {
      race: { select: { id: true, name: true, date: true, sport: true, location: true } },
      trackEvent: { select: { id: true, name: true, unitLabel: true, lowerIsBetter: true } },
    },
    orderBy: { recordedAt: 'desc' },
  })

  // Get PR result IDs
  const personalBests = await prisma.personalBest.findMany({
    where: { athleteId },
    select: { raceResultId: true },
  })
  const prIds = new Set(personalBests.map((pb) => pb.raceResultId).filter(Boolean))

  function formatResult(value: number, lowerIsBetter: boolean, unitLabel: string) {
    if (lowerIsBetter) return formatTime(value)
    return `${value}${unitLabel}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-900">Race Results</h2>
        <span className="text-sm text-gray-400">({results.length})</span>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No race results yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Race</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>PR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.race.name}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(result.race.date)}</TableCell>
                    <TableCell>{result.trackEvent?.name ?? (result.race.sport === 'XC' ? 'XC' : '—')}</TableCell>
                    <TableCell className="font-mono font-medium">
                      {result.dnf ? 'DNF' : result.dns ? 'DNS' : result.dq ? 'DQ' :
                        result.trackEvent
                          ? formatResult(result.resultValue, result.trackEvent.lowerIsBetter, result.trackEvent.unitLabel)
                          : formatTime(result.resultValue)
                      }
                    </TableCell>
                    <TableCell>{result.place ?? '—'}</TableCell>
                    <TableCell>
                      {prIds.has(result.id) && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          PR
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
