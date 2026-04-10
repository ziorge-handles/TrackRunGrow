import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserPlus, User } from 'lucide-react'
import { ATHLETE_STATUS_COLORS, ATHLETE_STATUS_LABELS, SPORT_LABELS } from '@/lib/constants'

async function getAthletes(userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return { athletes: [], teams: [] }

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    select: { id: true, name: true, sport: true },
    orderBy: { name: 'asc' },
  })

  const teamIds = teams.map((t) => t.id)

  const athletes = await prisma.athlete.findMany({
    where: {
      teams: { some: { teamId: { in: teamIds } } },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      teams: {
        include: { team: { select: { id: true, name: true, sport: true } } },
        where: { teamId: { in: teamIds } },
      },
      eventEntries: {
        include: { trackEvent: { select: { name: true } } },
        where: { isPrimary: true },
      },
      raceResults: {
        include: { race: { select: { name: true, date: true } } },
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return { athletes, teams }
}

export default async function AthletesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { athletes, teams } = await getAthletes(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} across {teams.length} team{teams.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/athletes/new">
          <Button variant="primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Athlete
          </Button>
        </Link>
      </div>

      {athletes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No athletes yet</h3>
            <p className="text-gray-500 mb-6">
              Add athletes to your teams to start tracking their performance.
            </p>
            <Link href="/athletes/new">
              <Button variant="primary">
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Athlete
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Last Race</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {athlete.user.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{athlete.user.name}</p>
                          {athlete.jerseyNumber && (
                            <p className="text-xs text-gray-400">#{athlete.jerseyNumber}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {athlete.teams.map(({ team }) => (
                          <Badge
                            key={team.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {SPORT_LABELS[team.sport].split(' ')[0]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ATHLETE_STATUS_COLORS[athlete.status]}>
                        {ATHLETE_STATUS_LABELS[athlete.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {athlete.eventEntries.map((ae) => ae.trackEvent.name).join(', ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {athlete.raceResults[0] ? (
                        <span className="text-sm text-gray-600">
                          {athlete.raceResults[0].race.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/athletes/${athlete.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
