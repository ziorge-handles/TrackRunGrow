import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trophy, MapPin, Calendar } from 'lucide-react'
import { SPORT_LABELS, SPORT_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ filter?: string; sport?: string }>
}

async function getRaces(userId: string, filter?: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return []

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    select: { id: true },
  })

  const teamIds = teams.map((t) => t.id)
  const now = new Date()

  return prisma.race.findMany({
    where: {
      teamId: { in: teamIds },
      ...(filter === 'upcoming' ? { date: { gte: now } } : {}),
      ...(filter === 'past' ? { date: { lt: now } } : {}),
    },
    include: {
      _count: { select: { results: true } },
    },
    orderBy: { date: filter === 'upcoming' ? 'asc' : 'desc' },
  })
}

export default async function RacesPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { filter = 'upcoming' } = await searchParams

  const races = await getRaces(session.user.id, filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Races</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage race events</p>
        </div>
        <Link href="/races/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Race
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['upcoming', 'past'] as const).map((f) => (
          <Link
            key={f}
            href={`/races?filter=${f}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              filter === f
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {races.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filter} races
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'upcoming'
                ? 'Schedule your next race event.'
                : 'Past race results will appear here.'}
            </p>
            <Link href="/races/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Race
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {races.map((race) => (
            <Link key={race.id} href={`/races/${race.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={SPORT_COLORS[race.sport]}>
                          {SPORT_LABELS[race.sport]}
                        </Badge>
                        {race.isHome && (
                          <Badge variant="outline" className="text-xs">Home</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{race.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {race.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {race.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(race.date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-900">
                        {race._count.results}
                      </p>
                      <p className="text-xs text-gray-400">results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
