import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logServerError, serverDebug } from '@/lib/server-debug'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime, formatDate } from '@/lib/utils'
import { Trophy, Users, Activity, Calendar } from 'lucide-react'
import Link from 'next/link'

async function getDashboardData(userId: string) {
  try {
  let coach = await prisma.coach.findUnique({
    where: { userId },
    include: {
      teams: {
        include: {
          team: {
            include: {
              athletes: true,
            },
          },
        },
      },
    },
  })

  if (!coach) {
    const created = await prisma.coach.create({ data: { userId } })
    coach = { ...created, teams: [] }
  }

  const teamIds = coach.teams.map((ct) => ct.team.id)
  serverDebug('dashboard', {
    userId,
    teamCount: coach.teams.length,
    teamIdsCount: teamIds.length,
  })

  // Prisma rejects `{ in: [] }` — new coaches have no teams yet.
  const upcomingRaces =
    teamIds.length === 0
      ? []
      : await prisma.race.findMany({
          where: {
            teamId: { in: teamIds },
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 5,
        })

  const recentResults =
    teamIds.length === 0
      ? []
      : await prisma.raceResult.findMany({
          where: {
            race: {
              teamId: { in: teamIds },
            },
          },
          include: {
            race: true,
            athlete: {
              include: { user: true },
            },
            trackEvent: true,
          },
          orderBy: { recordedAt: 'desc' },
          take: 10,
        })

  const athleteCount = new Set(
    coach.teams.flatMap((ct) => ct.team.athletes.map((a) => a.athleteId)),
  ).size

  const recentWorkouts = await prisma.workoutLog.count({
    where: {
      loggedById: userId,
      date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  return {
    coach,
    upcomingRaces,
    recentResults,
    athleteCount,
    teamCount: coach.teams.length,
    recentWorkouts,
  }
  } catch (err) {
    logServerError('dashboard:getDashboardData', err, { userId })
    throw err
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const data = await getDashboardData(session.user.id)

  const { upcomingRaces, recentResults, athleteCount, teamCount, recentWorkouts } = data
  const coachName = session.user.name?.split(' ')[0] ?? 'Coach'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {coachName}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your coaching overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total Athletes</span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{athleteCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Teams</span>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Trophy className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{teamCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Workouts This Week</span>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{recentWorkouts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Upcoming Races</span>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{upcomingRaces.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Races */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Upcoming Races
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRaces.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No upcoming races</p>
                  <Link href="/races/new" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    Add your first race &rarr;
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingRaces.map((race) => (
                    <li
                      key={race.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{race.name}</p>
                        <p className="text-xs text-gray-400">{race.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={race.sport === 'XC' ? 'emerald' : 'info'}>
                          {race.sport}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(race.date)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No results yet</p>
                  <Link href="/races" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    View races &rarr;
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentResults.slice(0, 6).map((result) => (
                    <li
                      key={result.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {result.athlete.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {result.race.name}
                          {result.trackEvent ? ` — ${result.trackEvent.name}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium text-gray-900">
                          {formatTime(result.resultValue)}
                        </p>
                        {result.place && (
                          <p className="text-xs text-gray-400">
                            Place: {result.place}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
