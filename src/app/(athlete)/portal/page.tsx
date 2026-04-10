import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Activity, Calendar, TrendingUp } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'
import { ATHLETE_STATUS_COLORS, ATHLETE_STATUS_LABELS } from '@/lib/constants'

function getDaysUntil(date: Date) {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function AthletePortalHome() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true } },
      teams: {
        include: { team: { select: { id: true, name: true, sport: true } } },
      },
      personalBests: {
        include: { trackEvent: true },
        orderBy: { achievedAt: 'desc' },
      },
      raceResults: {
        include: { race: true, trackEvent: true },
        orderBy: { recordedAt: 'desc' },
        take: 5,
      },
      workoutLogs: {
        where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!athlete) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Setting up your athlete profile...</p>
      </div>
    )
  }

  const teamIds = athlete.teams.map((at) => at.teamId)

  const nextRace = await prisma.race.findFirst({
    where: {
      teamId: { in: teamIds },
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
  })

  const weeklyMileage = athlete.workoutLogs.reduce((sum, w) => sum + (w.distanceMiles ?? 0), 0)
  const daysUntilRace = nextRace ? getDaysUntil(nextRace.date) : null

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
        <h2 className="text-2xl font-bold">
          Hey, {session.user.name?.split(' ')[0] ?? 'Athlete'}!
        </h2>
        <p className="text-blue-100 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {athlete.teams.map(({ team }) => (
            <Badge key={team.id} className="bg-blue-500/40 text-white border-blue-400">
              {team.name}
            </Badge>
          ))}
          <Badge className={`${ATHLETE_STATUS_COLORS[athlete.status]} border`}>
            {ATHLETE_STATUS_LABELS[athlete.status]}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-4 h-4 text-orange-500" />}
          label="Next Race In"
          value={daysUntilRace !== null ? `${daysUntilRace}d` : '—'}
          sub={nextRace?.name}
        />
        <StatCard
          icon={<Activity className="w-4 h-4 text-blue-500" />}
          label="Weekly Mileage"
          value={`${weeklyMileage.toFixed(1)} mi`}
          sub={`${athlete.workoutLogs.length} workouts`}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4 text-amber-500" />}
          label="Personal Bests"
          value={athlete.personalBests.length}
          sub="all events"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          label="Total Races"
          value={athlete.raceResults.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week's Training */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-blue-500" />
              This Week&apos;s Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {athlete.workoutLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No workouts this week yet.</p>
            ) : (
              <ul className="space-y-2">
                {athlete.workoutLogs.map((w) => (
                  <li key={w.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{w.title}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(w.date)}{w.distanceMiles ? ` · ${w.distanceMiles} mi` : ''}
                      </p>
                    </div>
                    {w.perceivedEffort && (
                      <span className="text-xs text-gray-500">RPE {w.perceivedEffort}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent PRs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-amber-500" />
              Personal Bests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {athlete.personalBests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No PRs recorded yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {athlete.personalBests.slice(0, 6).map((pb) => (
                  <div key={pb.id} className="bg-amber-50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-amber-700">{pb.trackEvent.name}</p>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      {pb.trackEvent.lowerIsBetter
                        ? formatTime(pb.resultValue)
                        : `${pb.resultValue}${pb.trackEvent.unitLabel}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string | null
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-gray-500">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </CardContent>
    </Card>
  )
}
