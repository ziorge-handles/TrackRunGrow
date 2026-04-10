import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTime, formatDate } from '@/lib/utils'
import { Trophy, Users, Activity, Calendar } from 'lucide-react'

async function getDashboardData(userId: string) {
  const coach = await prisma.coach.findUnique({
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

  if (!coach) return null

  const teamIds = coach.teams.map((ct) => ct.team.id)

  const upcomingRaces = await prisma.race.findMany({
    where: {
      teamId: { in: teamIds },
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
    take: 5,
  })

  const recentResults = await prisma.raceResult.findMany({
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
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const data = await getDashboardData(session.user.id)
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Setting up your coach profile...</p>
      </div>
    )
  }

  const { upcomingRaces, recentResults, athleteCount, teamCount, recentWorkouts } = data

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome back, {session.user.name?.split(' ')[0] ?? 'Coach'}!
        </h2>
        <p className="text-emerald-100 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          label="Athletes"
          value={athleteCount}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-blue-600" />}
          label="Teams"
          value={teamCount}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          label="Workouts This Week"
          value={recentWorkouts}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-orange-600" />}
          label="Upcoming Races"
          value={upcomingRaces.length}
          bg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Races */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Upcoming Races
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRaces.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No upcoming races scheduled
              </p>
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

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No results yet
              </p>
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
                      <p className="text-xs text-gray-400">{result.race.name}</p>
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
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
